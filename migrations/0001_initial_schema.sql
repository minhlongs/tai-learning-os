-- ============================================================================
-- TAI LEARNING OS — Schema v1
-- Longitudinal, evidence-based learning record.
--
-- Design rules enforced by this schema:
--   * Every record carries a stable, opaque identifier (never the learner's name).
--   * Learning evidence is stored separately from interpretation. The system
--     records what the learner did, what help was given, and any parent
--     correction — never a single merged "score".
--   * Foreign keys are ON by default and enforced.
--   * No column stores free-text personal data beyond what a lesson needs.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- Tracks which schema version this database is at. Import/export checks this.
CREATE TABLE schema_versions (
  version     INTEGER PRIMARY KEY NOT NULL,
  applied_at  INTEGER NOT NULL,           -- unix epoch ms
  description TEXT    NOT NULL
);

-- The adult account. One row only in the local MVP. Password is stored as a
-- scrypt hash (never plaintext, never a bare SHA digest).
CREATE TABLE parents (
  id             TEXT PRIMARY KEY NOT NULL,
  password_hash  TEXT NOT NULL,           -- scrypt:N:salt:hash, hex-encoded
  display_name   TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

-- The learner. Display name only (e.g. "Tai").
-- Deliberately ABSENT: legal name, date of birth, school, address, phone, photo.
CREATE TABLE learners (
  id         TEXT PRIMARY KEY NOT NULL,
  parent_id  TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,               -- display name, e.g. "Tai"
  birth_year INTEGER,                     -- year only, optional, for age banding
  grade      INTEGER,                     -- current grade, optional
  timezone   TEXT    NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  archived_at INTEGER                     -- soft delete; null = active
);

-- School year grouping so a record stays meaningful across years.
CREATE TABLE school_years (
  id         TEXT PRIMARY KEY NOT NULL,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,               -- e.g. "2026-2027"
  starts_on  TEXT NOT NULL,               -- ISO date YYYY-MM-DD
  ends_on    TEXT NOT NULL,               -- ISO date YYYY-MM-DD
  grade      INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE (learner_id, label)
);

CREATE TABLE subjects (
  id        TEXT PRIMARY KEY NOT NULL,    -- 'math' | 'english' | 'vietnamese'
  name_vi   TEXT NOT NULL,
  name_en   TEXT NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0,
  active    INTEGER NOT NULL DEFAULT 1    -- 0 = documented future module, not yet built
);

-- A reusable capability, e.g. "equivalent fractions".
CREATE TABLE skills (
  id          TEXT PRIMARY KEY NOT NULL,
  subject_id  TEXT NOT NULL REFERENCES subjects(id),
  code        TEXT NOT NULL,              -- stable human-readable code
  name_vi     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  grade_from  INTEGER NOT NULL,
  grade_to    INTEGER NOT NULL,
  UNIQUE (subject_id, code)
);

-- Prerequisite graph. Deterministic ordering for lesson suggestions.
CREATE TABLE skill_prerequisites (
  skill_id       TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prerequisite_id),
  CHECK (skill_id <> prerequisite_id)
);

CREATE INDEX idx_skill_prereq ON skill_prerequisites(prerequisite_id);

-- A lesson is a container of ordered steps.
CREATE TABLE lessons (
  id             TEXT PRIMARY KEY NOT NULL,
  subject_id     TEXT NOT NULL REFERENCES subjects(id),
  skill_id       TEXT REFERENCES skills(id),
  title_vi       TEXT NOT NULL,
  title_en       TEXT NOT NULL,
  objective_vi   TEXT NOT NULL,
  objective_en   TEXT NOT NULL,
  grade_from     INTEGER NOT NULL,
  grade_to       INTEGER NOT NULL,
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE lesson_steps (
  id           TEXT PRIMARY KEY NOT NULL,
  lesson_id    TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  kind         TEXT NOT NULL
                 CHECK (kind IN
                   ('concept','visual','guided','independent','transfer')),
  -- The task payload is a JSON object validated against the exercise schemas
  -- (see src/shared/schemas/exercise.ts). version lets an edited question be
  -- distinguished from an earlier one when interpreting old attempts.
  content      TEXT NOT NULL,
  answer_key   TEXT NOT NULL,             -- JSON: expected answer(s)
  explanation_vi TEXT NOT NULL,           -- shown only after the attempt
  content_version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (lesson_id, position)
);

-- Parent approval gate. ONLY rows in this table with status 'approved' make a
-- lesson visible in learner mode.
CREATE TABLE review_approvals (
  id          TEXT PRIMARY KEY NOT NULL,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('draft','approved','rejected')),
  decided_by  TEXT NOT NULL REFERENCES parents(id),
  decided_at  INTEGER NOT NULL,
  note        TEXT,
  UNIQUE (lesson_id)
);

-- One completed lesson run.
CREATE TABLE learning_sessions (
  id            TEXT PRIMARY KEY NOT NULL,
  learner_id    TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL REFERENCES lessons(id),
  lesson_version INTEGER NOT NULL,
  school_year_id TEXT REFERENCES school_years(id) ON DELETE SET NULL,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER,                  -- null while in progress
  status        TEXT NOT NULL
                  CHECK (status IN ('in_progress','completed','abandoned')),
  steps_seen    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sessions_learner ON learning_sessions(learner_id, started_at DESC);

-- The atomic evidence record. One row per submitted answer attempt.
-- `help_level` records how much assistance was given BEFORE the answer.
-- `outcome` is the deterministic validation result.
CREATE TABLE learning_attempts (
  id            TEXT PRIMARY KEY NOT NULL,
  session_id    TEXT NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  learner_id    TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL REFERENCES lessons(id),
  step_id       TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
  step_version  INTEGER NOT NULL,
  skill_id      TEXT REFERENCES skills(id) ON DELETE SET NULL,
  submitted     TEXT NOT NULL,            -- JSON: the learner's actual answer
  outcome       TEXT NOT NULL
                  CHECK (outcome IN ('correct','incorrect','partial')),
  help_level    INTEGER NOT NULL DEFAULT 0
                  CHECK (help_level >= 0 AND help_level <= 4),
  -- provenance: what produced this record
  evidence_kind  TEXT NOT NULL
                  CHECK (evidence_kind IN
                    ('observed','assisted','parent_correction')),
  attempt_no     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL
);

CREATE INDEX idx_attempts_session  ON learning_attempts(session_id);
CREATE INDEX idx_attempts_skill    ON learning_attempts(skill_id, created_at DESC);
CREATE INDEX idx_attempts_learner  ON learning_attempts(learner_id, created_at DESC);

-- Derived competency state per skill. Always recomputed from attempts, and
-- holds the provenance of its own transitions.
CREATE TABLE skill_evidence (
  id           TEXT PRIMARY KEY NOT NULL,
  learner_id   TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  skill_id     TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  state        TEXT NOT NULL
                 CHECK (state IN
                   ('NOT_OBSERVED','SUPPORTED','INDEPENDENT','RETAINED','TRANSFERRED')),
  -- evidence basis, so a state is never a bare assertion
  independent_count INTEGER NOT NULL DEFAULT 0,
  assisted_count    INTEGER NOT NULL DEFAULT 0,
  correct_count    INTEGER NOT NULL DEFAULT 0,
  last_independent_at INTEGER,
  last_observed_at INTEGER,
  -- provenance of the current state
  source       TEXT NOT NULL DEFAULT 'derived'
                 CHECK (source IN ('derived','parent_correction')),
  correction_note TEXT,
  updated_at   INTEGER NOT NULL,
  UNIQUE (learner_id, skill_id)
);

-- Spaced-review queue: interval days are config-driven, not magic numbers.
CREATE TABLE review_schedule (
  id           TEXT PRIMARY KEY NOT NULL,
  learner_id   TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  skill_id     TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  due_at       INTEGER NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  -- review history
  last_result  TEXT CHECK (last_result IN ('passed','failed')),
  last_attempt_at INTEGER,
  -- +1 per failure, so scheduling stays explainable
  failure_streak  INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  UNIQUE (learner_id, skill_id)
);

CREATE INDEX idx_review_due ON review_schedule(learner_id, due_at);

-- Parent-set goals. Direction from the family, NOT measured ability.
CREATE TABLE learning_goals (
  id         TEXT PRIMARY KEY NOT NULL,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  title_vi   TEXT NOT NULL,
  note       TEXT,
  target_date TEXT,
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','paused','achieved','retired')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Append-only audit trail. Every privileged or correcting action lands here.
CREATE TABLE audit_events (
  id         TEXT PRIMARY KEY NOT NULL,
  actor      TEXT NOT NULL,               -- 'parent:<id>' | 'system' | 'learner:<id>'
  action     TEXT NOT NULL,               -- e.g. 'lesson.approve'
  subject    TEXT,                        -- record id acted upon
  detail     TEXT,                        -- JSON, non-sensitive metadata only
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_audit_time ON audit_events(created_at DESC);

-- Demo content is flagged so fixture data can never be confused with, or
-- merged into, the real learner's record.
CREATE TABLE content_origin (
  lesson_id TEXT PRIMARY KEY NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  origin   TEXT NOT NULL CHECK (origin IN ('authored','demo','imported'))
);
