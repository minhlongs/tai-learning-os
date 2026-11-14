/**
 * Session service: the write path for learning evidence.
 *
 * This is where an attempt becomes (a) a stored fact, (b) a re-derived
 * competency state, and (c) a re-scheduled review. All of it — plus the audit
 * row proving the attempt happened — goes to D1 as one `db.batch`, which the
 * database commits atomically or not at all, so the derived state can never
 * disagree with the attempts it was derived from.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { parseExercise } from "../../shared/schemas/exercise";
import {
  clampHelp,
  correctChoiceId,
  gradeSubmission,
  type Submission,
} from "../../shared/schemas/answer";
import {
  COMPETENCY_STATE_RANKS,
  deriveCompetency,
  isIndependentAttempt,
  type AttemptEvidence,
} from "../../shared/engine/competency";
import {
  isScheduledReviewFirstTryIndependent,
  replaySkillAttemptEvidence,
} from "../../shared/engine/recompute-learner-state";
import { computeEstimate, scheduleReview } from "../../shared/engine/review";
import {
  computeContinuousStudyCarryOverMs,
  evaluateSessionBudget,
} from "../../shared/engine/session-budget";
import type { CompetencyState } from "../../shared/schemas/attempt";
import * as repo from "../db/repositories";

const MAX_CONCURRENCY_RETRIES = 4;

export type StepContext = {
  stepId: string;
  position: number;
  kind: "concept" | "visual" | "guided" | "independent" | "transfer";
  content: ReturnType<typeof parseExercise>;
  contentVersion: number;
  explanationVi: string;
  answerKey: string;
  skillId: string | null;
  lessonId: string;
};

export class GuardError extends Error {
  readonly messageVi: string;
  readonly status: number;

  constructor(messageVi: string, status: number = 403) {
    super(messageVi);
    this.messageVi = messageVi;
    this.status = status;
  }
}

/**
 * Record one attempt and immediately recompute derived state for the skill.
 *
 * Deliberately NOT idempotent: two identical submissions produce two attempts,
 * because "the learner tried twice" is real evidence and collapsing it would
 * hide the struggle.
 *
 * ONE TRANSACTION. The attempt row, the re-derived competency, the re-scheduled
 * review and the audit row are bound first and flushed by a single `db.batch`.
 * D1 either commits all of them or none, so a failure part-way through cannot
 * leave an attempt with no ledger entry, a competency derived from an attempt
 * that is not there, or a review scheduled off evidence that vanished. Nothing
 * is reported as stored until the batch resolves.
 */
export async function recordAttemptWithDerivation(
  db: D1Database,
  input: {
    sessionId: string;
    learnerId: string;
    learnerGrade?: number | null;
    lessonId: string;
    step: StepContext;
    submission: Submission;
    helpLevel: number;
    now: number;
  },
): Promise<{
  attemptId: string;
  outcome: "correct" | "incorrect" | "partial";
  messageVi: string;
  attemptNo: number;
  derivedState: CompetencyState | null;
  review: { dueAt: number; intervalDays: number; reasonVi: string } | null;
  sessionTimeBudgetReached: boolean;
  remainingSessionMs: number;
}> {
  const { step } = input;
  if (!step.content) {
    // A step whose content no longer validates is a content bug, not a
    // learner error. Refuse rather than guess.
    throw new GuardError("Nội dung bài học không hợp lệ. Vui lòng báo phụ huynh.", 500);
  }

  const parentId = await ownerOf(db, input.learnerId);
  const session = await repo.findSession(db, input.sessionId, parentId);
  if (!session) throw new GuardError("Phiên học không tồn tại.", 404);
  if (session.learner_id !== input.learnerId) {
    // A session belonging to another learner must never accept this answer.
    throw new GuardError("Phiên học không thuộc về người học này.", 403);
  }
  if (session.status !== "in_progress") {
    throw new GuardError("Phiên học đã kết thúc.", 403);
  }
  if (session.is_continuation_expired === 1) {
    throw new GuardError("Phiên học đã hết thời gian gia hạn 30 phút sau khi quyền truy cập bị thu hồi.", 403);
  }

  // Gate G9: 25-minute Soft Stop session budget for Grades 4–5.
  // An in-flight step attempt crossing the 25-minute boundary is ALWAYS accepted
  // and graded so the child never loses work in progress. Once at least one
  // attempt has already been recorded at or after the budget deadline, advancing
  // to a NEW step is refused until the session is finalized for rest or extended
  // by the parent (`session.time_extended`).
  const learnerGrade =
    input.learnerGrade !== undefined
      ? input.learnerGrade
      : (await repo.findLearnerForParent(db, input.learnerId, parentId))?.grade ?? null;
  const [extensionCount, recentSessions, lastParentRestOverrideAt] = await Promise.all([
    repo.countSessionTimeExtensions(db, session.id),
    repo.listSessionsForLearner(db, input.learnerId, 100),
    repo.findLatestParentRestOverrideAt(db, input.learnerId),
  ]);
  const carryOverMs = computeContinuousStudyCarryOverMs({
    currentSessionId: session.id,
    anchorMs: session.started_at,
    priorSessions: recentSessions.map((s) => ({
      id: s.id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    })),
    lastParentRestOverrideAt,
  });
  const budgetStatus = evaluateSessionBudget({
    grade: learnerGrade,
    startedAt: session.started_at,
    nowMs: input.now,
    extensionCount,
    carryOverMs,
  });

  if (budgetStatus.reached) {
    const budgetCutoffMs = session.started_at + Math.max(0, budgetStatus.budgetMs - carryOverMs);
    const sessionAttempts = await repo.listAttemptsForSession(db, session.id);
    const alreadySubmittedAfterCap = sessionAttempts.some((a) => a.created_at >= budgetCutoffMs);
    const alreadyWorkingThisStep = sessionAttempts.some((a) => a.step_id === step.stepId);
    if (alreadySubmittedAfterCap && !alreadyWorkingThisStep) {
      throw new GuardError(
        "Em đã học đủ 25 phút hôm nay rồi! Mình kết thúc phiên học và nghỉ mắt nhé.",
        403,
      );
    }
  }

  const lesson = await repo.findLesson(db, session.lesson_id);
  const sessionPurpose: "official" | "practice" =
    session.purpose === "practice" || lesson?.purpose === "practice" || lesson?.ownership_type === "family"
      ? "practice"
      : "official";

  const clientHelpLevel = clampHelp(input.helpLevel);

  // ── Attempt + audit + derived state, re-derived on concurrency conflict ───
  //
  // Linearization point: the atomic execution of `db.batch`.
  for (let round = 0; round <= MAX_CONCURRENCY_RETRIES; round += 1) {
    const [stepSummary, hintState, priorSameSessionStepAttempts, reviewRows] = await Promise.all([
      repo.getStepAttemptSummaryForLearner(db, input.learnerId, step.stepId),
      repo.getDisclosedHintState(db, {
        learnerId: input.learnerId,
        stepId: step.stepId,
        sessionId: input.sessionId,
      }),
      repo.getSessionStepAttemptCount(db, {
        learnerId: input.learnerId,
        sessionId: input.sessionId,
        stepId: step.stepId,
      }),
      step.skillId && sessionPurpose === "official"
        ? repo.listReviewScheduleForLearner(db, input.learnerId)
        : Promise.resolve([]),
    ]);

    const priorDue =
      step.skillId && sessionPurpose === "official"
        ? (reviewRows.find((r) => r.skill_id === step.skillId)?.due_at ?? null)
        : null;
    const isDueScheduledReview = priorDue !== null && input.now >= priorDue;

    // Outside a due scheduled review, prior hint disclosures on `(learnerId, stepId)`
    // permanently floor `helpLevel` across sessions (Gate A2). When a scheduled
    // FSRS review is due (`now >= priorDue`), only hints disclosed inside THIS
    // review session floor the review attempt, so a learner who needed help days
    // ago can prove unassisted recall on review day.
    const floorLevel = isDueScheduledReview ? hintState.sessionMaxLevel : hintState.maxLevel;
    const effectiveHelpLevel = clampHelp(Math.max(clientHelpLevel, floorLevel));
    const grade = gradeSubmission(step.content, input.submission, effectiveHelpLevel);

    const attemptNo = stepSummary.nextAttemptNo;
    const attemptId = crypto.randomUUID();

    const scheduledReviewFirstTryUnlock = isScheduledReviewFirstTryIndependent({
      outcome: grade.outcome,
      helpLevel: effectiveHelpLevel,
      priorDueAt: priorDue,
      createdAt: input.now,
      priorSameSessionStepAttempts,
      purpose: sessionPurpose,
    });

    const evidenceKind: "observed" | "assisted" | "parent_correction" =
      sessionPurpose === "practice"
        ? "assisted"
        : (grade.outcome === "correct" &&
              effectiveHelpLevel === 0 &&
              attemptNo === 1 &&
              stepSummary.priorAttemptCount === 0) ||
            scheduledReviewFirstTryUnlock
          ? "observed"
          : "assisted";

    let derivedState: CompetencyState | null = null;
    let review: { dueAt: number; intervalDays: number; reasonVi: string } | null = null;
    let expectedSkillAttemptCount = 0;
    const postAttemptStatements: D1PreparedStatement[] = [];

    if (step.skillId && sessionPurpose === "official") {
      const [attempts, transferStepIds, currentEvidenceRows] = await Promise.all([
        repo.listAttemptsForLearner(db, input.learnerId),
        repo.listTransferStepIds(db),
        repo.listSkillEvidenceForLearner(db, input.learnerId),
      ]);
      const skillAttempts = attempts.filter(
        (a) => a.skill_id === step.skillId && (a.purpose ?? "official") === "official",
      );
      expectedSkillAttemptCount = skillAttempts.length;

      const currentEvidence = currentEvidenceRows.find((r) => r.skill_id === step.skillId) ?? null;

      // Replay historical `dueAt` boundaries chronologically via the shared
      // `replaySkillAttemptEvidence` helper so live writes and `recomputeLearnerState`
      // agree bit-for-bit.
      const historicalEvidence = replaySkillAttemptEvidence({
        skillId: step.skillId,
        attempts: skillAttempts.map((a) => ({
          id: a.id,
          sessionId: a.session_id,
          stepId: a.step_id,
          skillId: a.skill_id,
          outcome: a.outcome,
          helpLevel: a.help_level,
          evidenceKind: a.evidence_kind,
          attemptNo: a.attempt_no,
          purpose: a.purpose === "practice" ? "practice" : "official",
          createdAt: a.created_at,
        })),
        transferStepIds,
      });

      const thisAttemptEvidence: AttemptEvidence = {
        attemptId,
        sessionId: input.sessionId,
        skillId: step.skillId,
        outcome: grade.outcome,
        helpLevel: effectiveHelpLevel,
        evidenceKind,
        attemptNo: scheduledReviewFirstTryUnlock ? 1 : attemptNo,
        isTransfer: transferStepIds.has(step.stepId) && grade.outcome === "correct",
        isReview: isDueScheduledReview,
        createdAt: input.now,
      };

      const learnerEvidence: AttemptEvidence[] = [
        ...historicalEvidence,
        thisAttemptEvidence,
      ];

      const evidence: AttemptEvidence[] = [...learnerEvidence];
      if (currentEvidence?.source === "parent_correction") {
        evidence.push({
          attemptId: `correction-${currentEvidence.id}`,
          sessionId: `correction-${currentEvidence.id}`,
          skillId: step.skillId,
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "parent_correction",
          attemptNo: 1,
          isTransfer: false,
          isReview: false,
          createdAt: currentEvidence.updated_at,
          correctedState: currentEvidence.state,
        });
      }

      const derivation = deriveCompetency(evidence);
      derivedState = derivation.state;

      const isStillFloored =
        currentEvidence?.source === "parent_correction" &&
        COMPETENCY_STATE_RANKS[derivation.state] <= COMPETENCY_STATE_RANKS[currentEvidence.state];

      postAttemptStatements.push(
        repo.skillEvidenceUpsert(db, {
          id: crypto.randomUUID(),
          learnerId: input.learnerId,
          skillId: step.skillId,
          state: derivation.state,
          independentCount: derivation.independentCount,
          assistedCount: derivation.assistedCount,
          correctCount: derivation.correctCount,
          lastIndependentAt: derivation.lastIndependentAt,
          lastObservedAt: learnerEvidence.at(-1)?.createdAt ?? input.now,
          source: isStillFloored ? "parent_correction" : "derived",
          correctionNote: isStillFloored ? currentEvidence.correction_note : null,
          now: input.now,
        }),
      );

      const decision = scheduleReview(learnerEvidence, input.now);
      if (decision) {
        postAttemptStatements.push(
          repo.reviewScheduleUpsert(db, {
            id: crypto.randomUUID(),
            learnerId: input.learnerId,
            skillId: step.skillId,
            dueAt: decision.dueAt,
            intervalDays: decision.intervalDays,
            lastResult: learnerEvidence.at(-1)?.outcome === "correct" ? "passed" : "failed",
            lastAttemptAt: input.now,
            failureStreak: decision.failureStreak,
            now: input.now,
          }),
        );
        review = {
          dueAt: decision.dueAt,
          intervalDays: decision.intervalDays,
          reasonVi: decision.reasonVi,
        };
      }

      // Layer 2 (ADR-005): what THIS attempt may be counted as, recorded beside
      // the counters on `skill_evidence` rather than only inside them, so the
      // per-attempt basis survives the next attempt overwriting the totals.
      postAttemptStatements.push(
        repo.evidenceObservationInsert(db, {
          id: crypto.randomUUID(),
          learnerId: input.learnerId,
          skillId: step.skillId,
          attemptId,
          observedKind: isIndependentAttempt(thisAttemptEvidence) ? "independent" : "assisted",
          helpLevel: effectiveHelpLevel,
          attemptNo,
          observedAt: input.now,
          now: input.now,
        }),
      );

      // Layer 3 (ADR-005): the FSRS memory state behind the schedule, stored
      // with the ledger prefix it was computed from so a reader can detect a
      // stale estimate and recompute it. Nothing reads this back into
      // `skill_evidence.state`; the state stays derived from attempts.
      const estimate = computeEstimate(learnerEvidence, input.now);
      if (estimate) {
        postAttemptStatements.push(
          repo.skillEstimateUpsert(db, {
            id: crypto.randomUUID(),
            learnerId: input.learnerId,
            skillId: step.skillId,
            ...estimate,
            computedAt: input.now,
            now: input.now,
          }),
        );
      }
    }

    const statements: D1PreparedStatement[] = [
      repo.attemptInsertGuarded(db, {
        id: attemptId,
        sessionId: input.sessionId,
        learnerId: input.learnerId,
        lessonId: input.lessonId,
        stepId: step.stepId,
        stepVersion: step.contentVersion,
        skillId: step.skillId,
        submitted: JSON.stringify(input.submission),
        outcome: grade.outcome,
        helpLevel: effectiveHelpLevel,
        evidenceKind,
        attemptNo,
        purpose: sessionPurpose,
        now: input.now,
        expectedStepAttemptCount: stepSummary.priorAttemptCount,
        expectedHintAuditCount: hintState.auditCount,
        expectedSkillAttemptCount,
        scopeHintFloorToSession: isDueScheduledReview,
      }),
      repo.auditInsert(db, {
        id: crypto.randomUUID(),
        actor: `learner:${input.learnerId}`,
        action: "attempt.submitted",
        subject: step.stepId,
        detail: JSON.stringify(
          sessionPurpose === "practice"
            ? {
                sessionId: input.sessionId,
                attemptId,
                outcome: grade.outcome,
                attemptNo,
                helpLevel: effectiveHelpLevel,
                purpose: "practice",
              }
            : {
                sessionId: input.sessionId,
                attemptId,
                outcome: grade.outcome,
                attemptNo,
                helpLevel: effectiveHelpLevel,
              },
        ),
        now: input.now,
      }),
      ...postAttemptStatements,
    ];

    try {
      await db.batch(statements);
      return {
        attemptId,
        outcome: grade.outcome,
        messageVi: grade.messageVi,
        attemptNo,
        derivedState,
        review,
        sessionTimeBudgetReached: budgetStatus.reached,
        remainingSessionMs: budgetStatus.remainingMs,
      };
    } catch (error) {
      // Only inspect session status/deadline if the batch failed due to the guarded
      // attemptInsertGuarded sentinel; never convert unrelated DB errors into 403.
      if (!isAttemptConcurrencyConflict(error)) {
        throw error;
      }

      const currentSession = await repo.findSession(db, input.sessionId, parentId);
      if (!currentSession || currentSession.status !== "in_progress") {
        throw new GuardError("Phiên học đã kết thúc.", 403);
      }
      if (currentSession.is_continuation_expired === 1) {
        throw new GuardError("Phiên học đã hết thời gian gia hạn 30 phút sau khi quyền truy cập bị thu hồi.", 403);
      }

      if (round >= MAX_CONCURRENCY_RETRIES) {
        throw error;
      }
    }
  }

  throw new Error("Exceeded maximum concurrency retries for attempt submission.");
}

/**
 * True when a batch failure is a concurrency conflict on:
 *   1. `idx_attempts_learner_step_attempt` (UNIQUE constraint on `(learner_id, step_id, attempt_no)`), or
 *   2. `NOT NULL constraint failed: learning_attempts.attempt_no` triggered by
 *      `attemptInsertGuarded` when the step attempt snapshot, hint floor snapshot,
 *      or skill attempt snapshot changed between read and commit.
 *
 * Unrelated constraint failures (e.g. `learning_attempts.id` PK collision,
 * `audit_events.id` PK collision, FK failure, CHECK failure, or trigger abort)
 * do NOT match and are surfaced immediately without retry.
 */
function isAttemptConcurrencyConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("idx_attempts_learner_step_attempt") ||
    (message.includes("UNIQUE constraint failed:") &&
      message.includes("learning_attempts.learner_id") &&
      message.includes("learning_attempts.step_id") &&
      message.includes("learning_attempts.attempt_no")) ||
    message.includes("NOT NULL constraint failed: learning_attempts.attempt_no")
  );
}

/**
 * The parent's manual correction. Appends an audit row and overwrites the
 * derived state with the parent's judgement, keeping the original attempts
 * untouched so the correction is reversible and traceable.
 */
export async function recordParentCorrection(
  db: D1Database,
  input: {
    parentId: string;
    learnerId: string;
    skillId: string;
    state: CompetencyState;
    note: string;
    now: number;
  },
): Promise<void> {
  const [attempts, transferStepIds] = await Promise.all([
    repo.listAttemptsForLearner(db, input.learnerId),
    repo.listTransferStepIds(db),
  ]);
  const skillAttempts = attempts.filter(
    (a) =>
      a.skill_id === input.skillId &&
      a.evidence_kind !== "parent_correction" &&
      (a.purpose ?? "official") === "official",
  );
  const replayed = replaySkillAttemptEvidence({
    skillId: input.skillId,
    attempts: skillAttempts.map((a) => ({
      id: a.id,
      sessionId: a.session_id,
      stepId: a.step_id,
      skillId: a.skill_id,
      outcome: a.outcome,
      helpLevel: a.help_level,
      evidenceKind: a.evidence_kind,
      attemptNo: a.attempt_no,
      purpose: "official",
      createdAt: a.created_at,
    })),
    transferStepIds,
  });
  const independent = replayed.filter((ev) => isIndependentAttempt(ev)).length;

  await db.batch([
    repo.skillEvidenceUpsert(db, {
      id: crypto.randomUUID(),
      learnerId: input.learnerId,
      skillId: input.skillId,
      state: input.state,
      independentCount: independent,
      assistedCount: skillAttempts.length - independent,
      correctCount: skillAttempts.filter((a) => a.outcome === "correct").length,
      lastIndependentAt: null,
      lastObservedAt: skillAttempts.at(-1)?.created_at ?? null,
      source: "parent_correction",
      correctionNote: input.note,
      now: input.now,
    }),
    repo.auditInsert(db, {
      id: crypto.randomUUID(),
      actor: `parent:${input.parentId}`,
      action: "skill_evidence.corrected",
      subject: `${input.learnerId}/${input.skillId}`,
      detail: JSON.stringify({ state: input.state, noteLength: input.note.length }),
      now: input.now,
    }),
  ]);
}

/**
 * Resolve the parent that owns a learner, so the attempt is written under a
 * verified owner rather than one supplied by the caller.
 */
async function ownerOf(db: D1Database, learnerId: string): Promise<string> {
  const row = await db
    .prepare("SELECT parent_id FROM learners WHERE id = ?1 AND archived_at IS NULL")
    .bind(learnerId)
    .first<{ parent_id: string }>();
  if (!row) throw new GuardError("Không tìm thấy hồ sơ người học.", 404);
  return row.parent_id;
}

/** Load a lesson's steps into validated, renderable contexts. */
export async function loadStepContexts(
  db: D1Database,
  lessonId: string,
  contentVersion?: number,
): Promise<StepContext[]> {
  const rows = await repo.listStepsForLesson(db, lessonId, contentVersion);
  const lesson = await repo.findLesson(db, lessonId);
  return rows.map((row) => ({
    stepId: row.id,
    position: row.position,
    kind: row.kind as StepContext["kind"],
    content: parseExercise(row.content),
    contentVersion: row.content_version,
    explanationVi: row.explanation_vi,
    answerKey: row.answer_key,
    skillId: lesson?.skill_id ?? null,
    lessonId,
  }));
}

/** The correct choice id for a step, for the parent's inspection screen. */
export function stepCorrectChoiceId(step: StepContext): string | null {
  return step.content ? correctChoiceId(step.content) : null;
}
