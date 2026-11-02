-- ============================================================================
-- TAI LEARNING OS — Milestone M11: Practice Planner Scheduling & Version-Pinned Classroom Progress (Schema v13)
--
-- Migration 0013 adds:
--   1. `classroom_lesson_assignments.assigned_version` (integer >= 1) pinned at
--      classroom assignment time so center approval, parent approval, and
--      classroom progress reporting evaluate against the exact assigned version.
--   2. SQLite 4-step table rebuild of `learning_plan_items` to widen the
--      `item_kind` CHECK constraint from ('lesson', 'review', 'baseline') to
--      ('lesson', 'review', 'baseline', 'practice'), preserving all 16 columns
--      and recreating indexes.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (13, strftime('%s','now') * 1000, 'Milestone M11: practice planner item_kind and version-pinned classroom lesson assignments');

ALTER TABLE classroom_lesson_assignments
  ADD COLUMN assigned_version INTEGER NOT NULL DEFAULT 1
  CHECK (assigned_version >= 1);

UPDATE classroom_lesson_assignments
SET assigned_version = COALESCE(
  (SELECT l.version FROM lessons l WHERE l.id = classroom_lesson_assignments.lesson_id),
  1
);

CREATE TABLE learning_plan_items_new (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  school_year_label TEXT NOT NULL,
  week_index INTEGER NOT NULL CHECK (week_index BETWEEN 1 AND 4),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  scheduled_date TEXT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
  skill_id TEXT REFERENCES skills(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('lesson', 'review', 'baseline', 'practice')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  parent_note TEXT,
  reason_vi TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO learning_plan_items_new (
  id,
  learner_id,
  school_year_label,
  week_index,
  day_of_week,
  scheduled_date,
  subject_id,
  skill_id,
  lesson_id,
  item_kind,
  status,
  duration_minutes,
  parent_note,
  reason_vi,
  created_at,
  updated_at
)
SELECT
  id,
  learner_id,
  school_year_label,
  week_index,
  day_of_week,
  scheduled_date,
  subject_id,
  skill_id,
  lesson_id,
  item_kind,
  status,
  duration_minutes,
  parent_note,
  reason_vi,
  created_at,
  updated_at
FROM learning_plan_items;

DROP TABLE learning_plan_items;

ALTER TABLE learning_plan_items_new RENAME TO learning_plan_items;

CREATE INDEX IF NOT EXISTS idx_learning_plan_items_learner_week
  ON learning_plan_items(learner_id, week_index, day_of_week);
CREATE INDEX IF NOT EXISTS idx_learning_plan_items_status
  ON learning_plan_items(status);
