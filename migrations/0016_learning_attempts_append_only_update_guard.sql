-- ============================================================================
-- TAI LEARNING OS — Append-only protection for the observation layer (v16)
--
-- `CLAUDE.md` invariant 3 states that evidence (`learning_attempts`) is
-- append-only and separated from interpretation (`skill_evidence`). Until this
-- migration only the second half of that sentence was enforced: migration 0015
-- added `skill_evidence_observation_no_update`, but the raw observation layer it
-- is derived from had no trigger at all. An attempt row could be rewritten in
-- place — `outcome` from 'incorrect' to 'correct', `evidence_kind` from
-- 'assisted' to 'observed', `help_level` down to 0 — and `deriveCompetency()`
-- would then read a history that never happened, with no audit trace, because
-- the ledger itself was the thing edited.
--
-- This migration closes exactly that hole, and only that hole.
--
-- ── Why UPDATE only, and not DELETE ────────────────────────────────────────
--
-- A `BEFORE DELETE` guard was considered and rejected on evidence, not taste.
-- Attempts legitimately leave the database through three paths, all of which
-- must keep working:
--
--   1. `deleteLearner` — an explicit parent action that writes a
--      `learner.deleted` audit row *before* the cascade runs.
--   2. `resetUserData` — deletes child tables before `learners`, so a guard
--      keyed on "the learner still exists" would not help; and D1's
--      `batch()` is all-or-nothing, so one blocked DELETE aborts the reset.
--   3. `ON DELETE CASCADE` from `lessons` — wiping a lesson removes attempts
--      that may belong to a learner who is still very much present.
--
-- Every one of those is either audited or recoverable from a backup. What is
-- *not* audited is a silent in-place UPDATE, and that is the only vector that
-- can fabricate a competency state. So the guard is deliberately asymmetric,
-- and this comment states the residual exposure plainly rather than implying
-- the layer is now fully immutable: a `DELETE FROM learning_attempts` issued
-- outside those paths is not stopped here. It is made visible instead by the
-- audit ledger and by the backup drill.
--
-- What this trigger does NOT do, stated plainly, same boundary migration 0004
-- documented for `audit_events` and 0015 for `skill_evidence_observation`:
-- it does not stop DROP TABLE, a schema change, or replacement of the
-- database file.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (16, strftime('%s','now') * 1000, 'Append-only guard on the observation layer: learning_attempts rejects in-place UPDATE');

-- ── The guard ──────────────────────────────────────────────────────────────
--
-- Safe against every writer in the codebase: both `learning_attempts` write
-- sites in `src/worker/db/repositories.ts` are plain INSERTs (grading and the
-- concurrency-checked retry), and nothing anywhere issues an upsert against
-- this table. A `BEFORE UPDATE` trigger therefore cannot break a live path.
CREATE TRIGGER IF NOT EXISTS learning_attempts_no_update
  BEFORE UPDATE ON learning_attempts
BEGIN
  SELECT RAISE(ABORT, 'learning_attempts is append-only: UPDATE is not permitted');
END;
