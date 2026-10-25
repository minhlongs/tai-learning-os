/**
 * Competency evidence model.
 *
 * A competency state is never stored as an independent assertion. It is derived
 * from the learner's attempts, and the derivation is re-runnable so the parent
 * can always see WHY a state was reached.
 *
 * The states form a ladder:
 *   NOT_OBSERVED  no attempt recorded for the skill
 *   SUPPORTED     reached the answer with help at level 3+
 *   INDEPENDENT   solved with no more than a small hint
 *   RETAINED      solved independently again after a scheduled review
 *   TRANSFERRED   solved a transfer question independently
 *
 * A single lucky guess must not establish mastery, so INDEPENDENT requires at
 * least INDEPENDENT_MIN_CORRECT correct unassisted attempts.
 */

import type { CompetencyState, SubmissionOutcome, EvidenceKind } from "../schemas/attempt";

/** Tunable starting assumptions, not validated thresholds for this learner. */
export const COMPETENCY_CONFIG = {
  /** Correct attempts with help_level <= SMALL_HINT needed for INDEPENDENT. */
  independentMinCorrect: 2,
  /** Attempts at or below this help level count as "small hint". */
  smallHint: 2,
  /** An independent solve after a *scheduled* review earns RETAINED. */
  retainedRequiresScheduledReview: true,
} as const;

export type AttemptEvidence = {
  attemptId: string;
  skillId: string;
  outcome: SubmissionOutcome;
  helpLevel: number;
  evidenceKind: EvidenceKind;
  /** True when this attempt answered a transfer question. */
  isTransfer: boolean;
  /** True when this attempt answered a scheduled review. */
  isReview: boolean;
  createdAt: number;
};

export type CompetencyDerivation = {
  state: CompetencyState;
  correctCount: number;
  independentCount: number;
  assistedCount: number;
  lastIndependentAt: number | null;
  /** Human-readable reason, shown in the parent dashboard. */
  reason_vi: string;
};

/** A helper: is this attempt "unassisted enough" to count as independent? */
export function isIndependentAttempt(evidence: AttemptEvidence): boolean {
  if (evidence.evidenceKind === "parent_correction") return false;
  if (evidence.outcome !== "correct") return false;
  if (evidence.helpLevel > COMPETENCY_CONFIG.smallHint) return false;
  return true;
}

/**
 * Derive the competency state for one skill from its attempt history.
 *
 * Deterministic and total: the same attempts always yield the same state.
 */
export function deriveCompetency(attempts: readonly AttemptEvidence[]): CompetencyDerivation {
  const relevant = attempts.filter((a) => a.skillId.length > 0);

  const correct = relevant.filter((a) => a.outcome === "correct");
  const independent = relevant.filter(isIndependentAttempt);
  const assisted = relevant.filter(
    (a) => a.outcome === "correct" && a.helpLevel > COMPETENCY_CONFIG.smallHint,
  );

  const correctCount = correct.length;
  const independentCount = independent.length;
  const assistedCount = assisted.length;

  const lastIndependentIndependent = independent.length > 0
    ? independent.reduce((max, a) => (a.createdAt > max ? a.createdAt : max), independent[0]!.createdAt)
    : null;

  const base = {
    correctCount,
    independentCount,
    assistedCount,
    lastIndependentAt: lastIndependentIndependent,
  };

  if (relevant.length === 0) {
    return {
      ...base,
      state: "NOT_OBSERVED",
      reason_vi: "Chưa có bài tập nào được ghi nhận cho kỹ năng này.",
    };
  }

  // TRANSFERRED: an independent correct answer to a transfer question, after the
  // skill has already been demonstrated independently at least once.
  const transferSolved = relevant.some(
    (a) => a.isTransfer && isIndependentAttempt(a) && independentCount >= COMPETENCY_CONFIG.independentMinCorrect,
  );
  if (transferSolved) {
    return {
      ...base,
      state: "TRANSFERRED",
      reason_vi: "Em đã tự áp dụng kỹ năng vào một tình huống mới.",
    };
  }

  // RETAINED: an independent correct answer on a scheduled review.
  const reviewSolved = relevant.some(
    (a) => a.isReview && isIndependentAttempt(a) && independentCount >= COMPETENCY_CONFIG.independentMinCorrect,
  );
  if (reviewSolved) {
    return {
      ...base,
      state: "RETAINED",
      reason_vi: "Em vẫn nhớ kỹ năng này sau thời gian chờ ôn tập.",
    };
  }

  if (independentCount >= COMPETENCY_CONFIG.independentMinCorrect) {
    return {
      ...base,
      state: "INDEPENDENT",
      reason_vi: `Em tự làm đúng ${independentCount} lần (cần tối thiểu ${COMPETENCY_CONFIG.independentMinCorrect}).`,
    };
  }

  if (assistedCount > 0) {
    return {
      ...base,
      state: "SUPPORTED",
      reason_vi: `Em làm đúng khi được gợi ý ${assistedCount} lần. Cần thêm bài tự luyện.`,
    };
  }

  return {
    ...base,
    state: "NOT_OBSERVED",
    reason_vi: `Em đã thử ${correctCount === 0 ? "nhưng chưa" : ""} làm đúng lần nào một cách độc lập.`,
  };
}

/**
 * Explain a state to the parent in plain Vietnamese, without exaggerating it.
 * Used by the dashboard; never claims more than the evidence supports.
 */
export function describeState(state: CompetencyState): string {
  switch (state) {
    case "NOT_OBSERVED":
      return "Chưa quan sát được";
    case "SUPPORTED":
      return "Làm được khi có hỗ trợ";
    case "INDEPENDENT":
      return "Tự làm được";
    case "RETAINED":
      return "Nhớ được sau thời gian ôn";
    case "TRANSFERRED":
      return "Áp dụng được vào tình huống mới";
    default:
      return "Không xác định";
  }
}
