-- ============================================================================
-- TAI LEARNING OS — Evidence integrity (schema v4)
--
-- Migration 0004 closes two gaps that application code alone cannot close:
--
--   1. The first-attempt rule was decided by a read-then-write (COUNT then
--      INSERT), so two concurrent submissions for the same learner and step
--      could both read zero, both compute attempt_no = 1, and both persist
--      evidence_kind = 'observed' — unearned independent mastery. The database
--      now arbitrates: UNIQUE (learner_id, step_id, attempt_no) means exactly
--      one row can ever claim a given attempt number, so a race resolves in
--      favour of whichever request the database accepts first. The remaining
--      loser re-reads the committed state and re-derives from it, which makes
--      the second attempt legitimately 'assisted' rather than a duplicate
--      'observed'.
--
--   2. audit_events was append-only by convention alone: one INSERT in the
--      repository and a source-scanning test. Both are application-level, and
--      neither binds a direct database session. The triggers below make the
--      schema itself refuse UPDATE and DELETE against the ledger.
--
-- Attempt numbering stays per learner per step (not per session), so the
-- constraint covers retries across sessions rather than forbidding them.
-- ============================================================================

-- Denormalised uniqueness. `learning_attempts` already has a composite index on
-- (learner_id, created_at) and single-column indexes on session and step; the new
-- index serves the uniqueness rule and the per-step ordering that the derivation
-- reads, so it earns its place rather than only enforcing.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_learner_step_attempt
  ON learning_attempts(learner_id, step_id, attempt_no);

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (4, strftime('%s','now') * 1000, 'Evidence integrity: unique first attempt per learner/step and append-only audit_events');

-- ── Append-only audit ledger ────────────────────────────────────────────────
--
-- `audit_events` is the provenance record for everything that changed learner
-- state: hint disclosures (which floor an attempt's help level), attempt
-- submissions, session lifecycle, parent corrections, and learner deletion.
-- Rewriting or removing a row would let a caller erase the evidence that a
-- disclosure happened, which is an active integrity control, not just a report.
--
-- Both triggers raise an error that aborts the statement. SQLite rolls the
-- offending statement back, so the row the writer tried to change keeps its
-- original values and the row the writer tried to delete still exists.
--
-- What these triggers do NOT do, stated plainly so no reviewer overreads them:
--   - they do not stop DROP TABLE, TRUNCATE, or a schema change that replaces
--     this table or drops these triggers;
--   - they do not stop a writer with privilege to alter the schema, which D1
--     grants within the binding and which no per-table grant can withhold;
--   - they do not stop replacement of the database file itself.
--
-- They enforce DML immutability inside the schema as it ships. Everything above
-- is operational access control and is outside this migration's reach.
CREATE TRIGGER IF NOT EXISTS audit_events_no_update
  BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events is append-only: UPDATE is not permitted');
END;

CREATE TRIGGER IF NOT EXISTS audit_events_no_delete
  BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events is append-only: DELETE is not permitted');
END;
