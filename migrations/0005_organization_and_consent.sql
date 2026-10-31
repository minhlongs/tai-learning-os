-- ============================================================================
-- TAI LEARNING OS — Organization & Parent Consent Grant (schema v5)
--
-- Migration 0005 establishes the multi-tenant center/tutor structure while
-- preserving parent data sovereignty and child privacy:
--
--   1. Organizations & Memberships: Centers have owners, admins, and teachers.
--      Adults can belong to multiple organizations or act as independent parents.
--   2. Classrooms: Classes organized by grade and subject. Teachers are assigned
--      to specific classrooms.
--   3. Learner Consents: Parents grant explicit, revocable access to an
--      organization. No center member can view a learner without an 'active' consent.
--   4. Classroom Enrollments: Learners are placed into classrooms only when
--      consent exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_members (
  id              TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'teacher')),
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

CREATE TABLE IF NOT EXISTS classrooms (
  id              TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  grade           INTEGER,
  subject_id      TEXT REFERENCES subjects(id),
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classrooms_org ON classrooms(organization_id);

CREATE TABLE IF NOT EXISTS classroom_teachers (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id   TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (classroom_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS learner_consents (
  id              TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  learner_id      TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  granted_by      TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  granted_at      INTEGER NOT NULL,
  revoked_at      INTEGER,
  UNIQUE (organization_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_learner_consents_lookup
  ON learner_consents(organization_id, learner_id, status);

CREATE TABLE IF NOT EXISTS classroom_enrollments (
  id              TEXT PRIMARY KEY NOT NULL,
  classroom_id    TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  learner_id      TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('enrolled', 'withdrawn')),
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  UNIQUE (classroom_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_learner
  ON classroom_enrollments(learner_id);

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (5, strftime('%s','now') * 1000, 'Organization, classroom, teacher assignment, and parent consent grants');
