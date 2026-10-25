/**
 * The evidence vocabulary shared by client, server and database.
 *
 * These string unions are the canonical contract. They are duplicated as CHECK
 * constraints in the SQL schema; changing one without the other is a bug.
 */

/** Result of the deterministic validation of a single submission. */
export const SUBMISSION_OUTCOMES = ["correct", "incorrect", "partial"] as const;
export type SubmissionOutcome = (typeof SUBMISSION_OUTCOMES)[number];

/**
 * How this attempt record came to exist.
 *   observed          learner answered unaided on the first attempt (help_level === 0, attempt_no === 1)
 *   assisted          learner answered after hints (help_level >= 1) or on retry (attempt_no > 1)
 *   parent_correction the parent recorded an observation by hand
 */
export const EVIDENCE_KINDS = ["observed", "assisted", "parent_correction"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/** Lesson stage in the teaching sequence. */
export const LESSON_STEP_KINDS = ["concept", "visual", "guided", "independent", "transfer"] as const;
export type LessonStepKind = (typeof LESSON_STEP_KINDS)[number];

export const COMPETENCY_STATES = [
  "NOT_OBSERVED",
  "SUPPORTED",
  "INDEPENDENT",
  "RETAINED",
  "TRANSFERRED",
] as const;

/**
 * The competency ladder. Declared here, with the rest of the evidence
 * vocabulary, because it is part of the persisted record contract — it is also
 * a CHECK constraint on skill_evidence.state.
 */
export type CompetencyState = (typeof COMPETENCY_STATES)[number];

export const SESSION_STATUSES = ["in_progress", "completed", "abandoned"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const APPROVAL_STATUSES = ["draft", "approved", "rejected"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/**
 * Derive the evidence kind for a stored attempt. This is the single place that
 * decides provenance, so the database never holds an ambiguous record.
 */
export function evidenceKindFor(
  outcome: SubmissionOutcome,
  helpLevel: number,
  attemptNo = 1,
): EvidenceKind {
  if (outcome === "correct" && helpLevel === 0 && attemptNo === 1) return "observed";
  return "assisted";
}
