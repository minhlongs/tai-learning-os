-- ============================================================================
-- TAI LEARNING OS — Milestone M10: Family Practice Lessons, Mastery Isolation & Version Lineage (Schema v12)
--
-- Migration 0012 adds durable, server-authoritative lesson ownership, purpose,
-- and source lineage columns across `lessons`, `lesson_steps`,
-- `learning_sessions`, and `learning_attempts`:
--   1. `lessons.ownership_type` ('catalogue' | 'organization' | 'family')
--   2. `lessons.owner_parent_id` (foreign key to `parents.id` for 'family' lessons)
--   3. `lessons.purpose` ('official' | 'practice')
--   4. `lessons.source_lesson_id` & `lessons.source_version` (fork lineage)
--   5. `lesson_steps.source_step_id` (step-level lineage across forks/edits)
--   6. `learning_sessions.purpose` & `learning_attempts.purpose` ('official' | 'practice')
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (12, strftime('%s','now') * 1000, 'Milestone M10: server-authoritative lesson ownership, family practice forks, step lineage, and session/attempt purpose isolation');

ALTER TABLE lessons ADD COLUMN ownership_type TEXT NOT NULL DEFAULT 'catalogue'
  CHECK (ownership_type IN ('catalogue', 'organization', 'family'));

ALTER TABLE lessons ADD COLUMN owner_parent_id TEXT REFERENCES parents(id) ON DELETE CASCADE;

ALTER TABLE lessons ADD COLUMN purpose TEXT NOT NULL DEFAULT 'official'
  CHECK (purpose IN ('official', 'practice'));

ALTER TABLE lessons ADD COLUMN source_lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL;

ALTER TABLE lessons ADD COLUMN source_version INTEGER;

-- Backfill existing organization lessons to ownership_type = 'organization', purpose = 'official'
UPDATE lessons
SET ownership_type = 'organization',
    purpose = 'official'
WHERE EXISTS (
  SELECT 1 FROM organization_lessons ol WHERE ol.lesson_id = lessons.id
);

-- Ensure remaining existing catalogue lessons are explicitly marked catalogue + official
UPDATE lessons
SET ownership_type = 'catalogue',
    purpose = 'official'
WHERE ownership_type = 'catalogue'
  AND NOT EXISTS (
    SELECT 1 FROM organization_lessons ol WHERE ol.lesson_id = lessons.id
  );

CREATE INDEX IF NOT EXISTS idx_lessons_ownership_parent ON lessons(ownership_type, owner_parent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_source_lineage ON lessons(source_lesson_id, source_version);

ALTER TABLE lesson_steps ADD COLUMN source_step_id TEXT;

CREATE INDEX IF NOT EXISTS idx_lesson_steps_source_step ON lesson_steps(source_step_id);

ALTER TABLE learning_sessions ADD COLUMN purpose TEXT NOT NULL DEFAULT 'official'
  CHECK (purpose IN ('official', 'practice'));

CREATE INDEX IF NOT EXISTS idx_sessions_learner_purpose ON learning_sessions(learner_id, purpose);

ALTER TABLE learning_attempts ADD COLUMN purpose TEXT NOT NULL DEFAULT 'official'
  CHECK (purpose IN ('official', 'practice'));

CREATE INDEX IF NOT EXISTS idx_attempts_learner_purpose ON learning_attempts(learner_id, purpose);
