-- ============================================================================
-- TAI LEARNING OS — Lesson Authoring, Center Review & Classroom Assignments (schema v6)
--
-- Migration 0006 implements the teacher authoring and multi-tier approval workflow:
--   1. organization_lessons: Links lessons to creating organizations and authoring teachers,
--      tracking center approval state ('draft', 'submitted', 'org_approved', 'org_rejected').
--   2. classroom_lesson_assignments: Allows center staff to assign approved lessons
--      to specific classrooms.
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_lessons (
  lesson_id        TEXT PRIMARY KEY NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  organization_id  TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id        TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  review_status    TEXT NOT NULL CHECK (review_status IN ('draft', 'submitted', 'org_approved', 'org_rejected')),
  reviewed_by      TEXT REFERENCES parents(id) ON DELETE SET NULL,
  reviewed_at      INTEGER,
  review_note      TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_org_lessons_org ON organization_lessons(organization_id, review_status);
CREATE INDEX IF NOT EXISTS idx_org_lessons_author ON organization_lessons(author_id);

CREATE TABLE IF NOT EXISTS classroom_lesson_assignments (
  id              TEXT PRIMARY KEY NOT NULL,
  classroom_id    TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  lesson_id       TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  assigned_by     TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  assigned_at     INTEGER NOT NULL,
  due_at          INTEGER,
  UNIQUE (classroom_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_assignments_class ON classroom_lesson_assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_assignments_lesson ON classroom_lesson_assignments(lesson_id);

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (6, strftime('%s','now') * 1000, 'Teacher lesson authoring, center review status, and classroom lesson assignments');
