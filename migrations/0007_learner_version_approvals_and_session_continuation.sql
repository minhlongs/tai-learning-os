-- ============================================================================
-- TAI LEARNING OS — Per-Learner & Per-Version Approvals, Step Snapshots & Bounded Session Continuation (schema v7)
--
-- Migration 0007 implements:
--   1. Scoping review_approvals by (learner_id, lesson_id, lesson_version) so
--      approvals are isolated across different families, sibling learners, and lesson versions.
--   2. Versioned lesson_steps preserving snapshots across versions via UNIQUE (lesson_id, content_version, position).
--   3. continuation_deadline column on learning_sessions to enforce bounded 30-minute grace windows upon revocation.
-- ============================================================================

-- 1. Bounded session continuation deadline
ALTER TABLE learning_sessions ADD COLUMN continuation_deadline INTEGER;

-- 2. Rebuild review_approvals to support per-learner, per-version approvals
CREATE TABLE review_approvals_v7 (
  id              TEXT PRIMARY KEY NOT NULL,
  learner_id      TEXT REFERENCES learners(id) ON DELETE CASCADE,
  lesson_id       TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  lesson_version  INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected')),
  decided_by      TEXT NOT NULL REFERENCES parents(id),
  decided_at      INTEGER NOT NULL,
  note            TEXT,
  UNIQUE (learner_id, lesson_id, lesson_version)
);

INSERT INTO review_approvals_v7 (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
SELECT
  ra.id,
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM learners l
      WHERE l.parent_id = ra.decided_by AND l.archived_at IS NULL
    ) = 1 THEN (
      SELECT l.id
      FROM learners l
      WHERE l.parent_id = ra.decided_by AND l.archived_at IS NULL
      LIMIT 1
    )
    ELSE NULL
  END,
  ra.lesson_id,
  COALESCE((SELECT les.version FROM lessons les WHERE les.id = ra.lesson_id), 1),
  ra.status,
  ra.decided_by,
  ra.decided_at,
  ra.note
FROM review_approvals ra;

DROP TABLE review_approvals;
ALTER TABLE review_approvals_v7 RENAME TO review_approvals;

CREATE INDEX idx_review_approvals_learner_lesson ON review_approvals(learner_id, lesson_id, lesson_version);
CREATE INDEX idx_review_approvals_decided_by ON review_approvals(decided_by);

-- Fail-closed on pre-existing in_progress sessions that lack verified per-learner, per-version approval provenance
UPDATE learning_sessions
SET continuation_deadline = started_at
WHERE status = 'in_progress'
  AND continuation_deadline IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM review_approvals ra
    JOIN learners l ON l.id = learning_sessions.learner_id
    WHERE ra.learner_id = learning_sessions.learner_id
      AND ra.lesson_id = learning_sessions.lesson_id
      AND ra.lesson_version = learning_sessions.lesson_version
      AND ra.decided_by = l.parent_id
      AND ra.status = 'approved'
  );

-- 3. Rebuild lesson_steps to allow immutable snapshots per content_version
CREATE TABLE lesson_steps_v7 (
  id               TEXT PRIMARY KEY NOT NULL,
  lesson_id        TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,
  kind             TEXT NOT NULL CHECK (kind IN ('concept', 'visual', 'guided', 'independent', 'transfer')),
  content          TEXT NOT NULL,
  answer_key       TEXT NOT NULL,
  explanation_vi   TEXT,
  content_version  INTEGER NOT NULL DEFAULT 1,
  UNIQUE (lesson_id, content_version, position)
);

INSERT INTO lesson_steps_v7 (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, COALESCE(content_version, 1)
FROM lesson_steps;

DROP TABLE lesson_steps;
ALTER TABLE lesson_steps_v7 RENAME TO lesson_steps;

CREATE INDEX idx_lesson_steps_lesson ON lesson_steps(lesson_id, content_version, position);

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (7, strftime('%s','now') * 1000, 'Per-learner and per-version lesson approvals, versioned lesson steps, and session continuation deadline');
