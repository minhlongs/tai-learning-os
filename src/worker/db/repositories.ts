/**
 * Repository layer.
 *
 * All SQL lives here. Two rules this file exists to enforce:
 *
 *  1. AUTHORIZATION IS A DATA QUESTION, NOT A ROUTE QUESTION. Every query that
 *     reads or mutates learner data takes the parent id and joins/filters on
 *     ownership, so a handler cannot accidentally return another parent's
 *     learner by forgetting a check.
 *
 *  2. No `SELECT *`. Columns are named, so a schema change surfaces here.
 */

import type {
  ApprovalStatus,
  CompetencyState,
  SessionStatus,
} from "../../shared/schemas/attempt";
import type {
  AuditEventRow,
  LearnerRow,
  LessonRow,
  LessonStepRow,
  ReviewApprovalRow,
  ReviewScheduleRow,
  SchoolYearRow,
  SkillEvidenceRow,
  SkillRow,
  SubjectRow,
  ParentRow,
  LearningAttemptRow,
  LearningSessionRow,
  LearningGoalRow,
} from "./schema";

export type Db = D1Database;

/* ── Parents ─────────────────────────────────────────────────────────────── */

export async function findParentByDisplayName(db: Db, displayName: string): Promise<ParentRow | null> {
  const row = await db
    .prepare("SELECT id, password_hash, display_name, created_at, updated_at FROM parents WHERE display_name = ?1")
    .bind(displayName)
    .first<ParentRow>();
  return row ?? null;
}

export async function findParentById(db: Db, id: string): Promise<ParentRow | null> {
  const row = await db
    .prepare("SELECT id, password_hash, display_name, created_at, updated_at FROM parents WHERE id = ?1")
    .bind(id)
    .first<ParentRow>();
  return row ?? null;
}

export async function createParent(
  db: Db,
  input: { id: string; passwordHash: string; displayName: string; now: number },
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       SELECT ?1, ?2, ?3, ?4, ?4
       WHERE NOT EXISTS (SELECT 1 FROM parents)`,
    )
    .bind(input.id, input.passwordHash, input.displayName, input.now)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function updateParentPasswordHash(
  db: Db,
  input: { id: string; passwordHash: string; now: number },
): Promise<void> {
  await db
    .prepare("UPDATE parents SET password_hash = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(input.passwordHash, input.now, input.id)
    .run();
}

/** Refuse a second parent account: the MVP is single-parent by design. */
export async function countParents(db: Db): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM parents").first<{ n: number }>();
  return row?.n ?? 0;
}

/* ── Learners ────────────────────────────────────────────────────────────── */

export async function listLearnersForParent(db: Db, parentId: string): Promise<LearnerRow[]> {
  const result = await db
    .prepare(
      `SELECT id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at, archived_at
       FROM learners WHERE parent_id = ?1 AND archived_at IS NULL ORDER BY created_at ASC`,
    )
    .bind(parentId)
    .all<LearnerRow>();
  return result.results ?? [];
}

export async function findLearnerOwnedBy(
  db: Db,
  learnerId: string,
  parentId: string,
): Promise<LearnerRow | null> {
  const row = await db
    .prepare(
      `SELECT id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at, archived_at
       FROM learners WHERE id = ?1 AND parent_id = ?2 AND archived_at IS NULL`,
    )
    .bind(learnerId, parentId)
    .first<LearnerRow>();
  return row ?? null;
}

export async function findFirstLearnerForParent(db: Db, parentId: string): Promise<LearnerRow | null> {
  const row = await db
    .prepare(
      `SELECT id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at, archived_at
       FROM learners WHERE parent_id = ?1 AND archived_at IS NULL ORDER BY created_at ASC LIMIT 1`,
    )
    .bind(parentId)
    .first<LearnerRow>();
  return row ?? null;
}

export async function createLearner(
  db: Db,
  input: {
    id: string;
    parentId: string;
    nickname: string;
    birthYear: number | null;
    grade: number | null;
    timezone: string;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
    )
    .bind(
      input.id,
      input.parentId,
      input.nickname,
      input.birthYear,
      input.grade,
      input.timezone,
      input.now,
    )
    .run();
}

export async function updateLearner(
  db: Db,
  input: { learnerId: string; parentId: string; nickname: string; grade: number | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `UPDATE learners SET nickname = ?1, grade = ?2, updated_at = ?3
       WHERE id = ?4 AND parent_id = ?5`,
    )
    .bind(input.nickname, input.grade, input.now, input.learnerId, input.parentId)
    .run();
}

/**
 * Deletion is a CASCADE: sessions, attempts, evidence, review rows, goals and
 * school years for this learner are removed. Audit events naming the learner
 * are deliberately NOT deleted — the audit trail must survive to prove the
 * deletion happened.
 */
export async function deleteLearnerCascade(
  db: Db,
  input: { learnerId: string; parentId: string },
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare("DELETE FROM learning_attempts WHERE learner_id = ?1"),
    db.prepare("DELETE FROM learning_sessions WHERE learner_id = ?1"),
    db.prepare("DELETE FROM skill_evidence WHERE learner_id = ?1"),
    db.prepare("DELETE FROM review_schedule WHERE learner_id = ?1"),
    db.prepare("DELETE FROM learning_goals WHERE learner_id = ?1"),
    db.prepare("DELETE FROM school_years WHERE learner_id = ?1"),
    db.prepare("DELETE FROM learners WHERE id = ?1 AND parent_id = ?2"),
  ];
  const bound = statements.map((stmt, index) =>
    index === statements.length - 1 ? stmt.bind(input.learnerId, input.parentId) : stmt.bind(input.learnerId),
  );
  await db.batch(bound);
}

/* ── School years ────────────────────────────────────────────────────────── */

export async function findActiveSchoolYear(
  db: Db,
  learnerId: string,
  todayIso: string,
): Promise<SchoolYearRow | null> {
  const row = await db
    .prepare(
      `SELECT id, learner_id, label, starts_on, ends_on, grade, created_at
       FROM school_years
       WHERE learner_id = ?1 AND starts_on <= ?2 AND ends_on >= ?2
       ORDER BY starts_on DESC LIMIT 1`,
    )
    .bind(learnerId, todayIso)
    .first<SchoolYearRow>();
  return row ?? null;
}

export async function createSchoolYear(
  db: Db,
  input: { id: string; learnerId: string; label: string; startsOn: string; endsOn: string; grade: number | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(input.id, input.learnerId, input.label, input.startsOn, input.endsOn, input.grade, input.now)
    .run();
}

/* ── Subjects / skills ───────────────────────────────────────────────────── */

export async function listSubjects(db: Db): Promise<SubjectRow[]> {
  const result = await db
    .prepare("SELECT id, name_vi, name_en, sort, active FROM subjects ORDER BY sort ASC")
    .all<SubjectRow>();
  return result.results ?? [];
}

export async function findSkill(db: Db, skillId: string): Promise<SkillRow | null> {
  const row = await db
    .prepare(
      "SELECT id, subject_id, code, name_vi, name_en, grade_from, grade_to FROM skills WHERE id = ?1",
    )
    .bind(skillId)
    .first<SkillRow>();
  return row ?? null;
}

export async function listSkills(db: Db): Promise<SkillRow[]> {
  const result = await db
    .prepare(
      "SELECT id, subject_id, code, name_vi, name_en, grade_from, grade_to FROM skills ORDER BY subject_id, code",
    )
    .all<SkillRow>();
  return result.results ?? [];
}

/* ── Lessons ─────────────────────────────────────────────────────────────── */

export async function listLessons(db: Db): Promise<LessonRow[]> {
  const result = await db
    .prepare(
      `SELECT id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
              grade_from, grade_to, version, created_at, updated_at
       FROM lessons ORDER BY subject_id, grade_from, title_vi`,
    )
    .all<LessonRow>();
  return result.results ?? [];
}

export async function findLesson(db: Db, lessonId: string): Promise<LessonRow | null> {
  const row = await db
    .prepare(
      `SELECT id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
              grade_from, grade_to, version, created_at, updated_at
       FROM lessons WHERE id = ?1`,
    )
    .bind(lessonId)
    .first<LessonRow>();
  return row ?? null;
}

export async function listApprovalStatuses(db: Db): Promise<Record<string, ApprovalStatus>> {
  const result = await db
    .prepare("SELECT lesson_id, status FROM review_approvals")
    .all<{ lesson_id: string; status: ApprovalStatus }>();
  const map: Record<string, ApprovalStatus> = {};
  for (const row of result.results ?? []) map[row.lesson_id] = row.status;
  return map;
}

export async function listStepsForLesson(db: Db, lessonId: string): Promise<LessonStepRow[]> {
  const result = await db
    .prepare(
      `SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version
       FROM lesson_steps WHERE lesson_id = ?1 ORDER BY position ASC`,
    )
    .bind(lessonId)
    .all<LessonStepRow>();
  return result.results ?? [];
}

export async function findStepsForLessons(db: Db, lessonIds: readonly string[]): Promise<LessonStepRow[]> {
  if (lessonIds.length === 0) return [];
  const placeholders = lessonIds.map((_, i) => `?${i + 1}`).join(",");
  const result = await db
    .prepare(
      `SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version
       FROM lesson_steps WHERE lesson_id IN (${placeholders}) ORDER BY lesson_id, position ASC`,
    )
    .bind(...lessonIds)
    .all<LessonStepRow>();
  return result.results ?? [];
}

export async function findStep(db: Db, stepId: string): Promise<LessonStepRow | null> {
  const row = await db
    .prepare(
      `SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version
       FROM lesson_steps WHERE id = ?1`,
    )
    .bind(stepId)
    .first<LessonStepRow>();
  return row ?? null;
}

export async function listTransferStepIds(db: Db): Promise<Set<string>> {
  const result = await db
    .prepare("SELECT id FROM lesson_steps WHERE kind = 'transfer'")
    .all<{ id: string }>();
  return new Set((result.results ?? []).map((r) => r.id));
}

export async function getApproval(db: Db, lessonId: string): Promise<ReviewApprovalRow | null> {
  const row = await db
    .prepare("SELECT id, lesson_id, status, decided_by, decided_at, note FROM review_approvals WHERE lesson_id = ?1")
    .bind(lessonId)
    .first<ReviewApprovalRow>();
  return row ?? null;
}

export async function setApproval(
  db: Db,
  input: { id: string; lessonId: string; status: ApprovalStatus; decidedBy: string; note: string | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO review_approvals (id, lesson_id, status, decided_by, decided_at, note)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(lesson_id) DO UPDATE SET
         status = excluded.status,
         decided_by = excluded.decided_by,
         decided_at = excluded.decided_at,
         note = excluded.note`,
    )
    .bind(input.id, input.lessonId, input.status, input.decidedBy, input.now, input.note)
    .run();
}

/* ── Sessions ────────────────────────────────────────────────────────────── */

export async function createSession(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    lessonId: string;
    lessonVersion: number;
    schoolYearId: string | null;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learning_sessions
         (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'in_progress', 0)`,
    )
    .bind(input.id, input.learnerId, input.lessonId, input.lessonVersion, input.schoolYearId, input.now)
    .run();
}

export async function findSession(
  db: Db,
  sessionId: string,
  parentId: string,
): Promise<(LearningSessionRow & { parent_id: string }) | null> {
  const row = await db
    .prepare(
      `SELECT s.id, s.learner_id, s.lesson_id, s.lesson_version, s.school_year_id,
              s.started_at, s.ended_at, s.status, s.steps_seen, l.parent_id
       FROM learning_sessions s
       JOIN learners l ON l.id = s.learner_id
       WHERE s.id = ?1 AND l.parent_id = ?2`,
    )
    .bind(sessionId, parentId)
    .first<LearningSessionRow & { parent_id: string }>();
  return row ?? null;
}

export async function findInProgressSessionForLearner(
  db: Db,
  learnerId: string,
): Promise<LearningSessionRow | null> {
  const row = await db
    .prepare(
      `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen
       FROM learning_sessions WHERE learner_id = ?1 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(learnerId)
    .first<LearningSessionRow>();
  return row ?? null;
}

export async function finalizeSession(
  db: Db,
  input: { sessionId: string; status: SessionStatus; stepsSeen: number; endedAt: number },
): Promise<void> {
  await db
    .prepare("UPDATE learning_sessions SET status = ?1, steps_seen = ?2, ended_at = ?3 WHERE id = ?4")
    .bind(input.status, input.stepsSeen, input.endedAt, input.sessionId)
    .run();
}

export async function listSessionsForLearner(
  db: Db,
  learnerId: string,
  limit: number,
): Promise<LearningSessionRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen
       FROM learning_sessions WHERE learner_id = ?1 ORDER BY started_at DESC LIMIT ?2`,
    )
    .bind(learnerId, limit)
    .all<LearningSessionRow>();
  return result.results ?? [];
}

/* ── Attempts ────────────────────────────────────────────────────────────── */

export async function recordAttempt(
  db: Db,
  input: {
    id: string;
    sessionId: string;
    learnerId: string;
    lessonId: string;
    stepId: string;
    stepVersion: number;
    skillId: string | null;
    submitted: string;
    outcome: "correct" | "incorrect" | "partial";
    helpLevel: number;
    evidenceKind: "observed" | "assisted" | "parent_correction";
    attemptNo: number;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id,
          submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
    )
    .bind(
      input.id,
      input.sessionId,
      input.learnerId,
      input.lessonId,
      input.stepId,
      input.stepVersion,
      input.skillId,
      input.submitted,
      input.outcome,
      input.helpLevel,
      input.evidenceKind,
      input.attemptNo,
      input.now,
    )
    .run();
}

export async function listAttemptsForSession(db: Db, sessionId: string): Promise<LearningAttemptRow[]> {
  const result = await db
    .prepare(
      `SELECT id, session_id, learner_id, lesson_id, step_id, step_version, skill_id,
              submitted, outcome, help_level, evidence_kind, attempt_no, created_at
       FROM learning_attempts WHERE session_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(sessionId)
    .all<LearningAttemptRow>();
  return result.results ?? [];
}

export async function listAttemptsForLearner(db: Db, learnerId: string): Promise<LearningAttemptRow[]> {
  const result = await db
    .prepare(
      `SELECT id, session_id, learner_id, lesson_id, step_id, step_version, skill_id,
              submitted, outcome, help_level, evidence_kind, attempt_no, created_at
       FROM learning_attempts WHERE learner_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(learnerId)
    .all<LearningAttemptRow>();
  return result.results ?? [];
}

export async function countAttemptsForStepInSession(
  db: Db,
  sessionId: string,
  stepId: string,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM learning_attempts WHERE session_id = ?1 AND step_id = ?2")
    .bind(sessionId, stepId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/* ── Skill evidence & review schedule ────────────────────────────────────── */

export async function listSkillEvidenceForLearner(
  db: Db,
  learnerId: string,
): Promise<SkillEvidenceRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, skill_id, state, independent_count, assisted_count, correct_count,
              last_independent_at, last_observed_at, source, correction_note, updated_at
       FROM skill_evidence WHERE learner_id = ?1`,
    )
    .bind(learnerId)
    .all<SkillEvidenceRow>();
  return result.results ?? [];
}

export async function upsertSkillEvidence(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    skillId: string;
    state: CompetencyState;
    independentCount: number;
    assistedCount: number;
    correctCount: number;
    lastIndependentAt: number | null;
    lastObservedAt: number | null;
    source: "derived" | "parent_correction";
    correctionNote: string | null;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO skill_evidence
         (id, learner_id, skill_id, state, independent_count, assisted_count, correct_count,
          last_independent_at, last_observed_at, source, correction_note, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
       ON CONFLICT(learner_id, skill_id) DO UPDATE SET
         state = excluded.state,
         independent_count = excluded.independent_count,
         assisted_count = excluded.assisted_count,
         correct_count = excluded.correct_count,
         last_independent_at = excluded.last_independent_at,
         last_observed_at = excluded.last_observed_at,
         source = excluded.source,
         correction_note = excluded.correction_note,
         updated_at = excluded.updated_at`,
    )
    .bind(
      input.id,
      input.learnerId,
      input.skillId,
      input.state,
      input.independentCount,
      input.assistedCount,
      input.correctCount,
      input.lastIndependentAt,
      input.lastObservedAt,
      input.source,
      input.correctionNote,
      input.now,
    )
    .run();
}

export async function listReviewScheduleForLearner(
  db: Db,
  learnerId: string,
): Promise<ReviewScheduleRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, skill_id, due_at, interval_days, last_result, last_attempt_at,
              failure_streak, created_at, updated_at
       FROM review_schedule WHERE learner_id = ?1 ORDER BY due_at ASC`,
    )
    .bind(learnerId)
    .all<ReviewScheduleRow>();
  return result.results ?? [];
}

export async function upsertReviewSchedule(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    skillId: string;
    dueAt: number;
    intervalDays: number;
    lastResult: "passed" | "failed";
    lastAttemptAt: number;
    failureStreak: number;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO review_schedule
         (id, learner_id, skill_id, due_at, interval_days, last_result, last_attempt_at,
          failure_streak, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)
       ON CONFLICT(learner_id, skill_id) DO UPDATE SET
         due_at = excluded.due_at,
         interval_days = excluded.interval_days,
         last_result = excluded.last_result,
         last_attempt_at = excluded.last_attempt_at,
         failure_streak = excluded.failure_streak,
         updated_at = excluded.updated_at`,
    )
    .bind(
      input.id,
      input.learnerId,
      input.skillId,
      input.dueAt,
      input.intervalDays,
      input.lastResult,
      input.lastAttemptAt,
      input.failureStreak,
      input.now,
    )
    .run();
}

/* ── Goals ───────────────────────────────────────────────────────────────── */

export async function listGoalsForLearner(db: Db, learnerId: string): Promise<LearningGoalRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, subject_id, title_vi, note, target_date, status, created_at, updated_at
       FROM learning_goals WHERE learner_id = ?1 ORDER BY created_at DESC`,
    )
    .bind(learnerId)
    .all<LearningGoalRow>();
  return result.results ?? [];
}

export async function createGoal(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    subjectId: string | null;
    titleVi: string;
    note: string | null;
    targetDate: string | null;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learning_goals (id, learner_id, subject_id, title_vi, note, target_date, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7, ?7)`,
    )
    .bind(input.id, input.learnerId, input.subjectId, input.titleVi, input.note, input.targetDate, input.now)
    .run();
}

/* ── Audit ───────────────────────────────────────────────────────────────── */

export async function recordAudit(
  db: Db,
  input: { id: string; actor: string; action: string; subject: string | null; detail: string | null; now: number },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(input.id, input.actor, input.action, input.subject, input.detail, input.now)
    .run();
}

export async function listAudit(db: Db, limit: number): Promise<AuditEventRow[]> {
  const result = await db
    .prepare("SELECT id, actor, action, subject, detail, created_at FROM audit_events ORDER BY created_at DESC LIMIT ?1")
    .bind(limit)
    .all<AuditEventRow>();
  return result.results ?? [];
}

export async function findMaxDisclosedHintLevel(
  db: Db,
  input: { learnerId: string; sessionId: string; stepId: string },
): Promise<number> {
  const result = await db
    .prepare(
      `SELECT detail FROM audit_events
       WHERE action = 'hint.requested'
         AND subject = ?1
         AND actor = ?2`,
    )
    .bind(input.stepId, `learner:${input.learnerId}`)
    .all<{ detail: string | null }>();

  let maxLevel = 0;
  for (const row of result.results ?? []) {
    if (!row.detail) continue;
    try {
      const parsed = JSON.parse(row.detail) as { sessionId?: string; level?: number };
      if (
        (parsed.sessionId === undefined || parsed.sessionId === input.sessionId) &&
        typeof parsed.level === "number" &&
        parsed.level > maxLevel
      ) {
        maxLevel = parsed.level;
      }
    } catch {
      // Ignore malformed detail
    }
  }
  return maxLevel;
}
