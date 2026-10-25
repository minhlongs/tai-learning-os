/**
 * Session service: the write path for learning evidence.
 *
 * This is where an attempt becomes (a) a stored fact, (b) a re-derived
 * competency state, and (c) a re-scheduled review. All three happen in one
 * transaction so the derived state can never disagree with the attempts it was
 * derived from.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { parseExercise } from "../../shared/schemas/exercise";
import {
  correctChoiceId,
  gradeSubmission,
  type Submission,
} from "../../shared/schemas/answer";
import { deriveCompetency, isIndependentAttempt, type AttemptEvidence } from "../../shared/engine/competency";
import { scheduleReview } from "../../shared/engine/review";
import type { CompetencyState } from "../../shared/schemas/attempt";
import * as repo from "../db/repositories";

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

  const grade = gradeSubmission(step.content, input.submission, input.helpLevel);

  const session = await repo.findSession(db, input.sessionId, await ownerOf(db, input.learnerId));
  if (!session) throw new GuardError("Phiên học không tồn tại.", 404);
  if (session.learner_id !== input.learnerId) {
    // A session belonging to another learner must never accept this answer.
    throw new GuardError("Phiên học không thuộc về người học này.", 403);
  }

  const attemptNo =
    (await repo.countAttemptsForStepInSession(db, input.sessionId, step.stepId)) + 1;

  const attemptId = crypto.randomUUID();
  const evidenceKind: "observed" | "assisted" | "parent_correction" =
    grade.outcome === "correct" && input.helpLevel === 0 && attemptNo === 1
      ? "observed"
      : "assisted";

  await repo.recordAttempt(db, {
    id: attemptId,
    sessionId: input.sessionId,
    learnerId: input.learnerId,
    lessonId: input.lessonId,
    stepId: step.stepId,
    stepVersion: step.contentVersion,
    skillId: step.skillId,
    submitted: JSON.stringify(input.submission),
    outcome: grade.outcome,
    helpLevel: input.helpLevel,
    evidenceKind,
    attemptNo,
    now: input.now,
  });

  // ── Re-derive competency + review for this skill, from stored attempts ────
  let derivedState: CompetencyState | null = null;
  let review: { dueAt: number; intervalDays: number; reasonVi: string } | null = null;

  if (step.skillId) {
    const [attempts, reviewRows, transferStepIds] = await Promise.all([
      repo.listAttemptsForLearner(db, input.learnerId),
      repo.listReviewScheduleForLearner(db, input.learnerId),
      repo.listTransferStepIds(db),
    ]);
    // The review row that existed BEFORE this attempt decides whether an
    // attempt counts as a retention check. Reading it once avoids a query per
    // attempt and keeps the decision stable across the loop.
    const priorDue = reviewRows.find((r) => r.skill_id === step.skillId)?.due_at ?? null;

    const evidence: AttemptEvidence[] = attempts
      .filter((a) => a.skill_id === step.skillId)
      .map((a) => ({
        attemptId: a.id,
        skillId: step.skillId as string,
        outcome: a.outcome,
        helpLevel: a.help_level,
        evidenceKind: a.evidence_kind,
        attemptNo: a.attempt_no,
        // Only the transfer step exercises transfer; the rest exercise recall.
        isTransfer: transferStepIds.has(a.step_id) && a.outcome === "correct",
        // A retention check: scheduled review was due, then answered.
        isReview: priorDue !== null && a.created_at >= priorDue,
        createdAt: a.created_at,
      }));

    const derivation = deriveCompetency(evidence);
    derivedState = derivation.state;

    await repo.upsertSkillEvidence(db, {
      id: crypto.randomUUID(),
      learnerId: input.learnerId,
      skillId: step.skillId,
      state: derivation.state,
      independentCount: derivation.independentCount,
      assistedCount: derivation.assistedCount,
      correctCount: derivation.correctCount,
      lastIndependentAt: derivation.lastIndependentAt,
      lastObservedAt: attempts.at(-1)?.created_at ?? input.now,
      source: "derived",
      correctionNote: null,
      now: input.now,
    });

    const decision = scheduleReview(evidence, input.now);
    if (decision) {
      await repo.upsertReviewSchedule(db, {
        id: crypto.randomUUID(),
        learnerId: input.learnerId,
        skillId: step.skillId,
        dueAt: decision.dueAt,
        intervalDays: decision.intervalDays,
        lastResult:
          evidence.at(-1)?.outcome === "correct" ? "passed" : "failed",
        lastAttemptAt: input.now,
        failureStreak: decision.failureStreak,
        now: input.now,
      });
      review = { dueAt: decision.dueAt, intervalDays: decision.intervalDays, reasonVi: decision.reasonVi };
    }
  }

  return {
    attemptId,
    outcome: grade.outcome,
    messageVi: grade.messageVi,
    attemptNo,
    derivedState,
    review,
  };
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
  const skillAttempts = attempts.filter((a) => a.skill_id === input.skillId);
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

  await repo.upsertSkillEvidence(db, {
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
  });

  await repo.recordAudit(db, {
    id: crypto.randomUUID(),
    actor: `parent:${input.parentId}`,
    action: "skill_evidence.corrected",
    subject: `${input.learnerId}/${input.skillId}`,
    detail: JSON.stringify({ state: input.state, noteLength: input.note.length }),
    now: input.now,
  });
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
