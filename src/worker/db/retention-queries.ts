/**
 * Read-only queries behind the delayed-retention protocol (`npm run retention:report`).
 *
 * These live next to the repositories rather than inside the reporting script so
 * the CLI and the integration test run the *same* SQL. A protocol whose query is
 * written twice is a protocol where the thing under test and the thing that runs
 * can disagree, and the disagreement only shows up when the numbers matter.
 *
 * Nothing here writes. The only statements are SELECTs, and the CLI opens the
 * household database with `readOnly: true` on top of that.
 */

import type { EvidenceKind, SubmissionOutcome } from "../../shared/schemas/attempt";
import type { RetentionAttempt } from "../../shared/engine/retention";

/** The single learner this local install records for, or `null` when none is enrolled. */
export async function selectHouseholdLearnerId(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT id FROM learners
        WHERE archived_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1`,
    )
    .first<{ id: string }>();
  return row?.id ?? null;
}

type AttemptRow = {
  id: string;
  skill_id: string | null;
  outcome: string;
  help_level: number;
  evidence_kind: string;
  attempt_no: number;
  purpose: string;
  created_at: number;
};

/**
 * Every attempt the protocol may count, oldest first.
 *
 * Filtering happens here rather than after the fact so that an ineligible row
 * cannot reach the engine at all — a practice attempt or a parent correction
 * that arrived in the array would be one `if` away from being counted.
 *
 * `purpose` is read from the attempt row, not from the session: migration 0012
 * added the column to both, and the attempt's own value is the one the write
 * path sets at insert time.
 */
export async function selectRetentionAttempts(
  db: D1Database,
  learnerId: string,
): Promise<RetentionAttempt[]> {
  const { results } = await db
    .prepare(
      `SELECT id, skill_id, outcome, help_level, evidence_kind, attempt_no, purpose, created_at
         FROM learning_attempts
        WHERE learner_id = ?1
          AND purpose = 'official'
          AND evidence_kind <> 'parent_correction'
          AND skill_id IS NOT NULL
        ORDER BY created_at ASC, id ASC`,
    )
    .bind(learnerId)
    .all<AttemptRow>();

  return (results ?? []).map((row) => ({
    attemptId: row.id,
    skillId: row.skill_id,
    outcome: row.outcome as SubmissionOutcome,
    helpLevel: row.help_level,
    evidenceKind: row.evidence_kind as EvidenceKind,
    attemptNo: row.attempt_no,
    purpose: row.purpose === "practice" ? "practice" : "official",
    createdAt: row.created_at,
  }));
}

/** Baseline rows, which anchor the second half of the protocol. */
export async function selectBaselineStatus(
  db: D1Database,
  learnerId: string,
): Promise<{ total: number; reviewed: number }> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END), 0) AS reviewed
         FROM baseline_assessments
        WHERE learner_id = ?1`,
    )
    .bind(learnerId)
    .first<{ total: number; reviewed: number }>();
  return { total: row?.total ?? 0, reviewed: row?.reviewed ?? 0 };
}
