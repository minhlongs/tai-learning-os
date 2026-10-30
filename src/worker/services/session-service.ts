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
import { scheduleReview } from "../../shared/engine/review";
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
  constructor(
    readonly messageVi: string,
    readonly status: number = 403,
  ) {
    super(messageVi);
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
}> {
  const { step } = input;
  if (!step.content) {
    // A step whose content no longer validates is a content bug, not a
    // learner error. Refuse rather than guess.
    throw new GuardError("Nội dung bài học không hợp lệ. Vui lòng báo phụ huynh.", 500);
  }

  const session = await repo.findSession(db, input.sessionId, await ownerOf(db, input.learnerId));
  if (!session) throw new GuardError("Phiên học không tồn tại.", 404);
  if (session.learner_id !== input.learnerId) {
    // A session belonging to another learner must never accept this answer.
    throw new GuardError("Phiên học không thuộc về người học này.", 403);
  }

  const clientHelpLevel = clampHelp(input.helpLevel);

  // ── Attempt + audit + derived state, re-derived on concurrency conflict ───
  //
  // Linearization point: the atomic execution of `db.batch`.
  // Inside each round we snapshot:
  //   1. Gap-safe step attempt summary (`COALESCE(MAX(attempt_no), 0) + 1` and
  //      `COUNT(*)` of prior attempts on `(learner_id, step_id)`).
  //   2. Disclosed hint state (`maxLevel` and `auditCount` on `audit_events` for
  //      `action = 'hint.requested'` and `(learner_id, step_id)`).
  //   3. Committed attempts on `(learner_id, skill_id)` for competency & review
  //      derivation.
  //
  // `repo.attemptInsertGuarded` embeds SQL assertions checking that none of those
  // three snapshots changed before the batch commits. If a concurrent request
  // (same-step attempt, cross-step same-skill attempt, or concurrent hint
  // disclosure) commits first, the batch aborts atomically and this bounded loop
  // re-reads the newly committed state and recomputes everything.
  for (let round = 0; round <= MAX_CONCURRENCY_RETRIES; round += 1) {
    const [stepSummary, hintState] = await Promise.all([
      repo.getStepAttemptSummaryForLearner(db, input.learnerId, step.stepId),
      repo.getDisclosedHintState(db, { learnerId: input.learnerId, stepId: step.stepId }),
    ]);

    const effectiveHelpLevel = clampHelp(Math.max(clientHelpLevel, hintState.maxLevel));
    const grade = gradeSubmission(step.content, input.submission, effectiveHelpLevel);

    const attemptNo = stepSummary.nextAttemptNo;
    const attemptId = crypto.randomUUID();
    const evidenceKind: "observed" | "assisted" | "parent_correction" =
      grade.outcome === "correct" &&
      effectiveHelpLevel === 0 &&
      attemptNo === 1 &&
      stepSummary.priorAttemptCount === 0
        ? "observed"
        : "assisted";

    let derivedState: CompetencyState | null = null;
    let review: { dueAt: number; intervalDays: number; reasonVi: string } | null = null;
    let expectedSkillAttemptCount = 0;
    const postAttemptStatements: D1PreparedStatement[] = [];

    if (step.skillId) {
      const [attempts, reviewRows, transferStepIds, currentEvidenceRows] = await Promise.all([
        repo.listAttemptsForLearner(db, input.learnerId),
        repo.listReviewScheduleForLearner(db, input.learnerId),
        repo.listTransferStepIds(db),
        repo.listSkillEvidenceForLearner(db, input.learnerId),
      ]);
      const skillAttempts = attempts.filter((a) => a.skill_id === step.skillId);
      expectedSkillAttemptCount = skillAttempts.length;

      const priorDue = reviewRows.find((r) => r.skill_id === step.skillId)?.due_at ?? null;
      const currentEvidence = currentEvidenceRows.find((r) => r.skill_id === step.skillId) ?? null;

      const learnerEvidence: AttemptEvidence[] = [
        ...skillAttempts.map((a) => ({
          attemptId: a.id,
          skillId: step.skillId as string,
          outcome: a.outcome,
          helpLevel: a.help_level,
          evidenceKind: a.evidence_kind,
          attemptNo: a.attempt_no,
          isTransfer: transferStepIds.has(a.step_id) && a.outcome === "correct",
          isReview: priorDue !== null && a.created_at >= priorDue,
          createdAt: a.created_at,
        })),
        {
          attemptId,
          skillId: step.skillId,
          outcome: grade.outcome,
          helpLevel: effectiveHelpLevel,
          evidenceKind,
          attemptNo,
          isTransfer: transferStepIds.has(step.stepId) && grade.outcome === "correct",
          isReview: priorDue !== null && input.now >= priorDue,
          createdAt: input.now,
        },
      ];

      const evidence: AttemptEvidence[] = [...learnerEvidence];
      if (currentEvidence?.source === "parent_correction") {
        evidence.push({
          attemptId: `correction-${currentEvidence.id}`,
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
        now: input.now,
        expectedStepAttemptCount: stepSummary.priorAttemptCount,
        expectedHintAuditCount: hintState.auditCount,
        expectedSkillAttemptCount,
      }),
      repo.auditInsert(db, {
        id: crypto.randomUUID(),
        actor: `learner:${input.learnerId}`,
        action: "attempt.submitted",
        subject: step.stepId,
        detail: JSON.stringify({
          sessionId: input.sessionId,
          attemptId,
          outcome: grade.outcome,
          attemptNo,
          helpLevel: effectiveHelpLevel,
        }),
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
      };
    } catch (error) {
      if (!isAttemptConcurrencyConflict(error) || round >= MAX_CONCURRENCY_RETRIES) {
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
  const attempts = await repo.listAttemptsForLearner(db, input.learnerId);
  const skillAttempts = attempts.filter((a) => a.skill_id === input.skillId && a.evidence_kind !== "parent_correction");
  const independent = skillAttempts.filter((a) => isIndependentAttempt({
    attemptId: a.id,
    skillId: input.skillId,
    outcome: a.outcome,
    helpLevel: a.help_level,
    evidenceKind: a.evidence_kind,
    attemptNo: a.attempt_no,
    isTransfer: false,
    isReview: false,
    createdAt: a.created_at,
  })).length;

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

/** Load a lesson's steps into validated, renderable contexts. */

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
export async function loadStepContexts(db: D1Database, lessonId: string): Promise<StepContext[]> {
  const rows = await repo.listStepsForLesson(db, lessonId);
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
