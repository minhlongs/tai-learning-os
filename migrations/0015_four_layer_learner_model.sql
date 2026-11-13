-- ============================================================================
-- TAI LEARNING OS — Four-layer learner model (schema v15)
--
-- ADR-005 splits the learner record into four layers that used to be mixed
-- together, so that each question about a child can be answered from the layer
-- that is actually allowed to answer it:
--
--   1. OBSERVATION  `learning_attempts` — what the child actually did, one
--                   append-only row per submission. Unchanged by this
--                   migration; it was already the raw layer.
--
--   2. EVIDENCE     `skill_evidence_observation` (new) — per attempt, per
--                   skill, the classification that makes an attempt count or
--                   not (`independent` / `assisted` / `correction`), plus the
--                   hint floor that applied at the time. Before this table the
--                   only place those per-attempt facts lived was inside the
--                   running counters on `skill_evidence`, where they were
--                   overwritten by each new attempt and could never be audited
--                   one by one.
--
--   3. ESTIMATE     `skill_estimate` (new) — the FSRS-6 memory state
--                   (stability, difficulty, retrievability) as computed at a
--                   stated instant from a stated watermark of the ledger.
--
--   4. STATE        `skill_evidence.state` — the single label the parent reads
--                   (NOT_OBSERVED -> SUPPORTED -> INDEPENDENT -> RETAINED ->
--                   TRANSFERRED). Unchanged by this migration.
--
-- Why the estimate is now stored, which reverses a decision recorded in
-- `src/shared/engine/review.ts` ("the card is derived, never stored"):
--
--   The old comment rejected storing the card because stored model state can
--   drift from the ledger the parent reads. That risk is real, but the old
--   design paid for it by throwing the estimate away: `replay()` recomputed a
--   card on every call, so nothing could be inspected, compared across model
--   versions, or checked for drift. Staying un-stored did not make the model
--   correct, it only made it unobservable.
--
--   This migration keeps the anti-drift property by construction instead:
--   every row in `skill_estimate` records the `attempt_watermark` and
--   `attempt_count` it was computed from, plus `model_version`. A reader can
--   therefore detect drift (a newer attempt exists than the one the estimate
--   was built from) and recompute the same card from `learning_attempts`
--   alone. The estimate is a cache with a proof obligation, not a source of
--   truth. `skill_evidence.state` is never written from this table; it stays
--   derived from the attempt ledger by `deriveCompetency()`.
--
-- Additive only. No column is added to, dropped from, or renamed on an
-- existing table: in SQLite 3.53 an `ALTER TABLE ... DROP COLUMN` silently
-- removes any CHECK constraint that referenced the dropped column, so
-- restructuring `skill_evidence` would quietly discard the
-- COMPETENCY_STATES guard. New tables carry the guards instead.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (15, strftime('%s','now') * 1000, 'Four-layer learner model: per-attempt evidence observations and stored FSRS estimate with drift watermark');

-- ── Layer 2: evidence, one row per (attempt, skill) ─────────────────────────
--
-- Keyed on the attempt, not on the run: re-deriving this table from
-- `learning_attempts` reproduces it exactly, which is what makes it an
-- evidence layer rather than another opinion. `observed_kind` is computed by
-- the same `isIndependentAttempt()` the rest of the system uses (ADR-001), and
-- `help_level` is copied rather than re-read so the classification can be
-- audited against the hint audit trail it was actually graded under.
CREATE TABLE IF NOT EXISTS skill_evidence_observation (
  id            TEXT PRIMARY KEY NOT NULL,
  learner_id    TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  skill_id      TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  attempt_id    TEXT NOT NULL REFERENCES learning_attempts(id) ON DELETE CASCADE,
  observed_kind TEXT NOT NULL
                  CHECK (observed_kind IN ('independent','assisted','correction')),
  help_level    INTEGER NOT NULL DEFAULT 0 CHECK (help_level >= 0 AND help_level <= 4),
  attempt_no    INTEGER NOT NULL DEFAULT 1,
  observed_at   INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  UNIQUE (learner_id, skill_id, attempt_id)
);

-- The per-skill timeline a parent reads: "these are the attempts that made up
-- this state". Serves the ORDER BY directly, so it earns its place.
CREATE INDEX IF NOT EXISTS idx_evidence_obs_learner_skill
  ON skill_evidence_observation(learner_id, skill_id, observed_at DESC);

-- ── Layer 3: estimate ───────────────────────────────────────────────────────
--
-- Not a SCHEDULER decision — `review_schedule` already holds the due date.
-- This table holds the memory model BEHIND that decision, so the parent can
-- ask "how strong is the model's belief, and how stale is it?" without
-- re-running FSRS in their head.
--
-- Every field needed to rebuild the FSRS card byte-for-byte is present
-- (stability, difficulty, reps, lapses, state, scheduled_days, last_review_at),
-- and `retrievability_at` is stored alongside `computed_at` so a later reader
-- can tell "0.91 as of 12 November" from "0.91 as of last March".
--
-- `model_version` is `v6.0.0` today. When the FSRS version changes, existing
-- rows keep their old version and become comparable-but-distinguishable
-- records instead of silently mixing two models in one column.
CREATE TABLE IF NOT EXISTS skill_estimate (
  id                 TEXT PRIMARY KEY NOT NULL,
  learner_id         TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  skill_id           TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  stability          REAL NOT NULL DEFAULT 0 CHECK (stability >= 0),
  difficulty         REAL NOT NULL DEFAULT 0 CHECK (difficulty >= 0),
  retrievability_at  REAL NOT NULL DEFAULT 0
                       CHECK (retrievability_at >= 0 AND retrievability_at <= 1),
  reps               INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
  lapses             INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  fsrs_state         INTEGER NOT NULL DEFAULT 0 CHECK (fsrs_state >= 0 AND fsrs_state <= 3),
  scheduled_days     INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_days >= 0),
  last_review_at     INTEGER,
  model_version      TEXT NOT NULL,
  computed_at        INTEGER NOT NULL,
  -- Drift proof: the ledger prefix this estimate was built from. A reader
  -- compares these against `learning_attempts` and knows immediately whether
  -- the number is current or needs recomputing.
  attempt_watermark  TEXT,
  attempt_count      INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL,
  UNIQUE (learner_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_estimate_learner
  ON skill_estimate(learner_id, computed_at DESC);

-- ── Append-only protection for the evidence layer ───────────────────────────
--
-- The evidence layer exists to be pointed at when a parent asks "why is this
-- state INDEPENDENT?", and an updatable evidence row can be rewritten to justify
-- any state. Rows may be added and (via learner deletion) removed with the
-- learner; they may not be edited in place.
--
-- Scope, stated precisely because it is narrower than `audit_events` in
-- migration 0004: 0004 blocks both UPDATE and DELETE, while this migration
-- adds an UPDATE guard only. Deletion stays permitted on the evidence layers
-- because a parent's erasure request is a real right, it is audited before it
-- runs, and the backup drill can recover a mistaken one. Migration 0016 extends
-- the same UPDATE-only guard to `learning_attempts`, the layer these rows are
-- derived from, which until then had no trigger at all.
--
-- What these triggers do NOT do, stated plainly: they do not stop DROP TABLE,
-- a schema change, or replacement of the database file — exactly the same
-- boundary 0004 documented for `audit_events`.
CREATE TRIGGER IF NOT EXISTS skill_evidence_observation_no_update
  BEFORE UPDATE ON skill_evidence_observation
BEGIN
  SELECT RAISE(ABORT, 'skill_evidence_observation is append-only: UPDATE is not permitted');
END;
