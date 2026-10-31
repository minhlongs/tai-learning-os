-- ============================================================================
-- TAI LEARNING OS — Version Snapshots & Legacy Approval Hardening (Schema v9)
--
-- Migration 0009 closes two security/integrity gaps:
--
-- 1. Immutable Lesson Version Metadata Snapshots (`lesson_versions`):
--    Snapshots `title_vi`, `title_en`, `objective_vi`, and `objective_en` per
--    `(lesson_id, version)` so that in-progress or historical sessions pinned
--    to an older `lesson_version` never read mutated metadata from `lessons`.
--    Also serves as the database-enforced atomic conflict guard during version
--    publication (`INSERT INTO lesson_versions ...`).
--
-- 2. Legacy Approval Ambiguity Hardening:
--    Migration 0007 backfilled legacy `review_approvals` rows (which had no
--    `learner_id` or `lesson_version` in v1-v6) to a parent's single active
--    learner and the current `lessons.version`. Because a legacy approval row
--    without a matching per-learner, per-version approval audit event does not
--    prove the parent approved that specific learner or current payload version,
--    any such unproven `status = 'approved'` row is downgraded to `'draft'`
--    (requiring explicit re-approval), and any `in_progress` session relying on
--    it has `continuation_deadline` clamped fail-closed to `started_at`.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (9, strftime('%s','now') * 1000, 'Immutable lesson version metadata snapshots and fail-closed legacy approval hardening');

CREATE TABLE IF NOT EXISTS lesson_versions (
  lesson_id    TEXT    NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL CHECK (version >= 1),
  title_vi     TEXT    NOT NULL CHECK (length(title_vi) BETWEEN 1 AND 200),
  title_en     TEXT    NOT NULL CHECK (length(title_en) BETWEEN 1 AND 200),
  objective_vi TEXT    NOT NULL CHECK (length(objective_vi) BETWEEN 1 AND 600),
  objective_en TEXT    NOT NULL CHECK (length(objective_en) BETWEEN 1 AND 600),
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (lesson_id, version)
) STRICT;

-- Backfill current lesson version metadata
INSERT OR IGNORE INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
SELECT id, version, title_vi, title_en, objective_vi, objective_en, updated_at
FROM lessons;

-- Backfill any historical version referenced by lesson_steps, learning_sessions, or review_approvals
INSERT OR IGNORE INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
SELECT DISTINCT l.id, s.content_version, l.title_vi, l.title_en, l.objective_vi, l.objective_en, l.created_at
FROM lesson_steps s
JOIN lessons l ON l.id = s.lesson_id;

INSERT OR IGNORE INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
SELECT DISTINCT l.id, ls.lesson_version, l.title_vi, l.title_en, l.objective_vi, l.objective_en, l.created_at
FROM learning_sessions ls
JOIN lessons l ON l.id = ls.lesson_id;

-- Fail-closed on legacy approvals that lack explicit per-learner, per-version audit provenance.
-- Post-0007 explicit approvals record `action = 'lesson.approval.approved'` with `learnerId` and `version` in JSON detail.
UPDATE review_approvals
SET status = 'draft'
WHERE status = 'approved'
  AND (
    learner_id IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM audit_events ae
      WHERE ae.actor = 'parent:' || review_approvals.decided_by
        AND ae.action = 'lesson.approval.approved'
        AND ae.subject = 'lesson:' || review_approvals.lesson_id
        AND json_valid(ae.detail) = 1
        AND json_extract(ae.detail, '$.learnerId') = review_approvals.learner_id
        AND CAST(json_extract(ae.detail, '$.version') AS INTEGER) = review_approvals.lesson_version
    )
  );

-- Clamp any in_progress session whose (learner_id, lesson_id, lesson_version) no longer has a verified active approval.
UPDATE learning_sessions
SET continuation_deadline = CASE
  WHEN continuation_deadline IS NULL OR continuation_deadline > started_at THEN started_at
  ELSE continuation_deadline
END
WHERE status = 'in_progress'
  AND NOT EXISTS (
    SELECT 1
    FROM review_approvals ra
    JOIN learners l ON l.id = learning_sessions.learner_id
    WHERE ra.learner_id = learning_sessions.learner_id
      AND ra.lesson_id = learning_sessions.lesson_id
      AND ra.lesson_version = learning_sessions.lesson_version
      AND ra.status = 'approved'
      AND ra.decided_by = l.parent_id
  );
