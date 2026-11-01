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

import type { D1PreparedStatement } from "@cloudflare/workers-types";
import { clampHelp } from "../../shared/schemas/answer";
import type {
  ApprovalStatus,
  CompetencyState,
  SessionStatus,
} from "../../shared/schemas/attempt";
import type {
  AuditEventRow,
  AuthThrottleRow,
  BaselineAssessmentRow,
  CurriculumIntakeRow,
  CurriculumObjectiveRow,
  LearnerRow,
  LessonMetadataRow,
  LessonRow,
  LessonStepRow,
  LessonVersionRow,
  LearningPlanItemRow,
  ReviewApprovalRow,
  ReviewScheduleRow,
  SchoolYearRow,
  SessionReflectionRow,
  SkillEvidenceRow,
  SkillRow,
  SubjectRow,
  ParentRow,
  LearningAttemptRow,
  LearningSessionRow,
  LearningGoalRow,
  OrganizationRow,
  OrganizationMemberRow,
  OrganizationLessonRow,
  ClassroomRow,
  LearnerConsentRow,
  OrganizationRole,
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

export async function findLearnerForParent(
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
    db.prepare("DELETE FROM classroom_enrollments WHERE learner_id = ?1"),
    db.prepare("DELETE FROM learner_consents WHERE learner_id = ?1"),
    db.prepare("DELETE FROM review_approvals WHERE learner_id = ?1"),
    db.prepare("DELETE FROM session_reflections WHERE learner_id = ?1"),
    db.prepare("DELETE FROM learning_plan_items WHERE learner_id = ?1"),
    db.prepare("DELETE FROM baseline_assessments WHERE learner_id = ?1"),
    db.prepare("DELETE FROM curriculum_intakes WHERE learner_id = ?1"),
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
       WHERE learner_id = ?1 AND ends_on >= ?2
       ORDER BY created_at DESC, starts_on DESC LIMIT 1`,
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

export async function upsertSchoolYear(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    label: string;
    startsOn: string;
    endsOn: string;
    grade: number | null;
    now: number;
  },
): Promise<SchoolYearRow> {
  await db
    .prepare(
      `INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
       ON CONFLICT(learner_id, label) DO UPDATE SET
         starts_on = excluded.starts_on,
         ends_on = excluded.ends_on,
         grade = excluded.grade,
         created_at = excluded.created_at`,
    )
    .bind(
      input.id,
      input.learnerId,
      input.label,
      input.startsOn,
      input.endsOn,
      input.grade,
      input.now,
    )
    .run();
  const saved = await db
    .prepare(
      `SELECT id, learner_id, label, starts_on, ends_on, grade, created_at
       FROM school_years WHERE learner_id = ?1 AND label = ?2`,
    )
    .bind(input.learnerId, input.label)
    .first<SchoolYearRow>();
  return (
    saved ?? {
      id: input.id,
      learner_id: input.learnerId,
      label: input.label,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      grade: input.grade,
      created_at: input.now,
    }
  );
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

export async function listSkillPrerequisites(
  db: Db,
): Promise<{ skill_id: string; prerequisite_id: string }[]> {
  const result = await db
    .prepare("SELECT skill_id, prerequisite_id FROM skill_prerequisites ORDER BY skill_id, prerequisite_id")
    .all<{ skill_id: string; prerequisite_id: string }>();
  return result.results ?? [];
}

export async function listSchoolYearsForLearner(db: Db, learnerId: string): Promise<SchoolYearRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, label, starts_on, ends_on, grade, created_at
       FROM school_years WHERE learner_id = ?1 ORDER BY starts_on DESC`,
    )
    .bind(learnerId)
    .all<SchoolYearRow>();
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

export async function listLessonsBySubject(db: Db, subjectId: string): Promise<LessonRow[]> {
  const result = await db
    .prepare(
      `SELECT id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
              grade_from, grade_to, version, created_at, updated_at
       FROM lessons WHERE subject_id = ?1 ORDER BY grade_from, title_vi`,
    )
    .bind(subjectId)
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

export async function findLessonVersion(
  db: Db,
  lessonId: string,
  version: number,
): Promise<LessonVersionRow | null> {
  const row = await db
    .prepare(
      `SELECT lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at
       FROM lesson_versions WHERE lesson_id = ?1 AND version = ?2`,
    )
    .bind(lessonId, version)
    .first<LessonVersionRow>();
  return row ?? null;
}

/**
 * Guarded insert of an immutable lesson version snapshot.
 *
 * Uses a subquery for `version` that returns `NULL` if `lessons.version` no
 * longer equals `expectedVersion` (or if the lesson does not exist). Because
 * `lesson_versions.version` is `NOT NULL`, any concurrent version publication
 * aborts the entire `db.batch` with `NOT NULL constraint failed: lesson_versions.version`
 * before any step insert, lesson update, deadline clamp, or audit row can commit.
 */
export function insertLessonVersionGuardedStatement(
  db: Db,
  input: {
    lessonId: string;
    expectedVersion: number;
    nextVersion: number;
    titleVi: string;
    titleEn: string;
    objectiveVi: string;
    objectiveEn: string;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
       VALUES (
         ?1,
         (SELECT ?3 WHERE EXISTS (SELECT 1 FROM lessons WHERE id = ?1 AND version = ?2)),
         ?4, ?5, ?6, ?7, ?8
       )`,
    )
    .bind(
      input.lessonId,
      input.expectedVersion,
      input.nextVersion,
      input.titleVi,
      input.titleEn,
      input.objectiveVi,
      input.objectiveEn,
      input.now,
    );
}

export async function listApprovalStatuses(
  db: Db,
  decidedBy?: string,
  learnerId?: string | null,
): Promise<Record<string, ApprovalStatus>> {
  if (learnerId === null || (learnerId !== undefined && learnerId.trim().length === 0)) {
    return {};
  }
  let query = `
    SELECT ra.lesson_id, ra.status, ra.learner_id
    FROM review_approvals ra
    JOIN lessons l ON l.id = ra.lesson_id AND ra.lesson_version = l.version
    WHERE 1=1
  `;
  const binds: (string | number)[] = [];
  if (decidedBy) {
    binds.push(decidedBy);
    query += ` AND ra.decided_by = ?${binds.length}`;
  }
  if (learnerId !== undefined) {
    binds.push(learnerId);
    query += ` AND ra.learner_id = ?${binds.length}`;
  } else {
    query += " AND ra.learner_id IS NOT NULL";
  }
  const result = binds.length > 0
    ? await db.prepare(query).bind(...binds).all<{ lesson_id: string; status: ApprovalStatus; learner_id: string | null }>()
    : await db.prepare(query).all<{ lesson_id: string; status: ApprovalStatus; learner_id: string | null }>();
  const map: Record<string, ApprovalStatus> = {};
  for (const row of result.results ?? []) {
    map[row.lesson_id] = row.status;
  }
  return map;
}

export async function listStepsForLesson(
  db: Db,
  lessonId: string,
  contentVersion?: number,
): Promise<LessonStepRow[]> {
  const result = contentVersion !== undefined
    ? await db
        .prepare(
          `SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version
           FROM lesson_steps WHERE lesson_id = ?1 AND content_version = ?2 ORDER BY position ASC`,
        )
        .bind(lessonId, contentVersion)
        .all<LessonStepRow>()
    : await db
        .prepare(
          `SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version
           FROM lesson_steps
           WHERE lesson_id = ?1
             AND content_version = (SELECT version FROM lessons WHERE id = ?1)
           ORDER BY position ASC`,
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
      `SELECT ls.id, ls.lesson_id, ls.position, ls.kind, ls.content, ls.answer_key, ls.explanation_vi, ls.content_version
       FROM lesson_steps ls
       JOIN lessons l ON l.id = ls.lesson_id AND ls.content_version = l.version
       WHERE ls.lesson_id IN (${placeholders}) ORDER BY ls.lesson_id, ls.position ASC`,
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

export async function getApproval(
  db: Db,
  lessonId: string,
  options?: { learnerId?: string | null; version?: number },
): Promise<ReviewApprovalRow | null> {
  const learnerId = options?.learnerId !== undefined ? options.learnerId : undefined;
  const version = options?.version;

  let query = "SELECT id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note FROM review_approvals WHERE lesson_id = ?1";
  const binds: (string | number)[] = [lessonId];

  if (version !== undefined) {
    binds.push(version);
    query += ` AND lesson_version = ?${binds.length}`;
  }

  if (learnerId !== undefined) {
    if (learnerId === null) {
      query += " AND learner_id IS NULL";
    } else {
      binds.push(learnerId);
      query += ` AND learner_id = ?${binds.length}`;
    }
  }

  query += " ORDER BY lesson_version DESC LIMIT 1";

  const row = await db.prepare(query).bind(...binds).first<ReviewApprovalRow>();
  return row ?? null;
}

export function setApprovalStatements(
  db: Db,
  input: {
    id: string;
    lessonId: string;
    status: ApprovalStatus;
    decidedBy: string;
    note: string | null;
    now: number;
    learnerId?: string | null;
    version?: number;
  },
): D1PreparedStatement[] {
  const learnerId = input.learnerId ?? null;
  const version = input.version ?? 1;

  if (learnerId === null) {
    return [
      db
        .prepare("DELETE FROM review_approvals WHERE lesson_id = ?1 AND lesson_version = ?2 AND learner_id IS NULL")
        .bind(input.lessonId, version),
      db
        .prepare(
          `INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
           VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(input.id, input.lessonId, version, input.status, input.decidedBy, input.now, input.note),
    ];
  }

  return [
    db
      .prepare(
        `INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(learner_id, lesson_id, lesson_version) DO UPDATE SET
           status = excluded.status,
           decided_by = excluded.decided_by,
           decided_at = excluded.decided_at,
           note = excluded.note`,
      )
      .bind(input.id, learnerId, input.lessonId, version, input.status, input.decidedBy, input.now, input.note),
  ];
}

export async function setApproval(
  db: Db,
  input: {
    id: string;
    lessonId: string;
    status: ApprovalStatus;
    decidedBy: string;
    note: string | null;
    now: number;
    learnerId?: string | null;
    version?: number;
  },
): Promise<void> {
  const stmts = setApprovalStatements(db, input);
  if (stmts.length === 1) {
    await stmts[0]!.run();
  } else {
    await db.batch(stmts);
  }
}

/* ── Sessions ────────────────────────────────────────────────────────────── */

export function createSessionInsert(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    lessonId: string;
    lessonVersion: number;
    schoolYearId: string | null;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO learning_sessions
         (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'in_progress', 0)`,
    )
    .bind(input.id, input.learnerId, input.lessonId, input.lessonVersion, input.schoolYearId, input.now);
}

/**
 * Concurrency-guarded session creation statement for `POST /api/learner/sessions`.
 *
 * Verifies at SQLite write time that:
 *   1. The lesson is still at `input.lessonVersion`.
 *   2. An explicit `approved` row in `review_approvals` exists for `(learnerId, lessonId, lessonVersion)`
 *      decided by `input.parentId`.
 *   3. If the lesson belongs to an organization (`organization_lessons`), its `review_status` is
 *      `'org_approved'` and the learner has an active classroom assignment + active parent consent.
 *
 * If a concurrent revocation or version bump landed between the route's read check and the batch commit,
 * `lesson_version` evaluates to `NULL` and aborts the batch with a `NOT NULL` constraint error.
 */
export function createSessionGuardedInsert(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    parentId: string;
    lessonId: string;
    lessonVersion: number;
    schoolYearId: string | null;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO learning_sessions
         (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
       VALUES (
         ?1, ?2, ?3,
         (
           SELECT ?4
           WHERE EXISTS (
             SELECT 1 FROM lessons WHERE id = ?3 AND version = ?4
           )
           AND EXISTS (
             SELECT 1 FROM review_approvals
             WHERE learner_id = ?2
               AND lesson_id = ?3
               AND lesson_version = ?4
               AND decided_by = ?7
               AND status = 'approved'
           )
           AND (
             NOT EXISTS (SELECT 1 FROM organization_lessons WHERE lesson_id = ?3)
             OR EXISTS (
               SELECT 1
               FROM classroom_lesson_assignments cla
               JOIN classrooms c ON c.id = cla.classroom_id
               JOIN classroom_enrollments ce ON ce.classroom_id = c.id AND ce.learner_id = ?2 AND ce.status = 'enrolled'
               JOIN learner_consents lc ON lc.learner_id = ?2 AND lc.organization_id = c.organization_id AND lc.status = 'active'
               JOIN organization_lessons ol ON ol.lesson_id = cla.lesson_id AND ol.organization_id = c.organization_id AND ol.review_status = 'org_approved'
               WHERE cla.lesson_id = ?3
             )
           )
         ),
         ?5, ?6, 'in_progress', 0
       )`,
    )
    .bind(
      input.id,
      input.learnerId,
      input.lessonId,
      input.lessonVersion,
      input.schoolYearId,
      input.now,
      input.parentId,
    );
}

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
  await createSessionInsert(db, input).run();
}

export async function findSession(
  db: Db,
  sessionId: string,
  parentId: string,
): Promise<(LearningSessionRow & { parent_id: string; is_continuation_expired: number }) | null> {
  const row = await db
    .prepare(
      `SELECT s.id, s.learner_id, s.lesson_id, s.lesson_version, s.school_year_id,
              s.started_at, s.ended_at, s.status, s.steps_seen, s.continuation_deadline, l.parent_id,
              CASE WHEN s.continuation_deadline IS NOT NULL AND ${SQL_UTC_NOW_MS_EXPR} >= s.continuation_deadline THEN 1 ELSE 0 END AS is_continuation_expired
       FROM learning_sessions s
       JOIN learners l ON l.id = s.learner_id
       WHERE s.id = ?1 AND l.parent_id = ?2`,
    )
    .bind(sessionId, parentId)
    .first<LearningSessionRow & { parent_id: string; is_continuation_expired: number }>();
  return row ?? null;
}

export async function findInProgressSessionForLearner(
  db: Db,
  learnerId: string,
): Promise<(LearningSessionRow & { is_continuation_expired: number }) | null> {
  const row = await db
    .prepare(
      `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline,
              CASE WHEN continuation_deadline IS NOT NULL AND ${SQL_UTC_NOW_MS_EXPR} >= continuation_deadline THEN 1 ELSE 0 END AS is_continuation_expired
       FROM learning_sessions WHERE learner_id = ?1 AND status = 'in_progress'
       ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(learnerId)
    .first<LearningSessionRow & { is_continuation_expired: number }>();
  return row ?? null;
}

export function finalizeSessionUpdate(
  db: Db,
  input: { sessionId: string; status: SessionStatus; stepsSeen: number; endedAt: number },
): D1PreparedStatement {
  return db
    .prepare("UPDATE learning_sessions SET status = ?1, steps_seen = ?2, ended_at = ?3 WHERE id = ?4")
    .bind(input.status, input.stepsSeen, input.endedAt, input.sessionId);
}

/**
 * Native SQLite/D1 UTC millisecond clock expression evaluated at SQL statement
 * execution time inside the database engine.
 *
 * Used at write-boundary authorization gates (`continuation_deadline`) so that
 * any request delayed between JavaScript dispatch and SQLite statement execution
 * is evaluated against the live database clock at the exact moment the SQL
 * statement runs, rather than a stale JavaScript timestamp (`input.now` or
 * `decisionNow`).
 */
export const SQL_UTC_NOW_MS_EXPR = "CAST(ROUND((julianday('now') - 2440587.5) * 86400000.0) AS INTEGER)";

export async function readDatabaseNowMs(db: Db): Promise<number> {
  const row = await db
    .prepare(`SELECT ${SQL_UTC_NOW_MS_EXPR} AS now_ms`)
    .first<{ now_ms: number }>();
  return typeof row?.now_ms === "number" && Number.isFinite(row.now_ms) ? row.now_ms : Date.now();
}

/**
 * Guarded session finalization at the write boundary.
 *
 * Requires the session to still be `in_progress` and, if a `continuation_deadline`
 * is present, requires `databaseNow < continuation_deadline` evaluated by SQLite
 * at the exact moment of UPDATE statement execution.
 */
export function finalizeSessionUpdateGuarded(
  db: Db,
  input: {
    sessionId: string;
    learnerId: string;
    status: SessionStatus;
    stepsSeen: number;
    endedAt: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `UPDATE learning_sessions
       SET status = ?1, steps_seen = ?2, ended_at = ?3
       WHERE id = ?4
         AND learner_id = ?5
         AND status = 'in_progress'
         AND (continuation_deadline IS NULL OR ${SQL_UTC_NOW_MS_EXPR} < continuation_deadline)`,
    )
    .bind(
      input.status,
      input.stepsSeen,
      input.endedAt,
      input.sessionId,
      input.learnerId,
    );
}

/**
 * Guarded session-completed audit INSERT that verifies in the same `db.batch`
 * that `finalizeSessionUpdateGuarded` actually transitioned the session to
 * `status = 'completed'` and that the database clock has not reached
 * `continuation_deadline`. If the session was already ended or its continuation
 * deadline expired before the batch executed, `action` evaluates to `NULL` and
 * SQLite aborts the entire `db.batch` with `NOT NULL constraint failed: audit_events.action`.
 */
export function finalizeSessionAuditInsertGuarded(
  db: Db,
  input: {
    id: string;
    actor: string;
    sessionId: string;
    learnerId: string;
    detail: string;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
       VALUES (
         ?1,
         ?2,
         (
           SELECT 'session.completed'
           WHERE EXISTS (
             SELECT 1
             FROM learning_sessions
             WHERE id = ?3
               AND learner_id = ?4
               AND status = 'completed'
               AND (continuation_deadline IS NULL OR ${SQL_UTC_NOW_MS_EXPR} < continuation_deadline)
           )
         ),
         ?3,
         ?5,
         ?6
       )`,
    )
    .bind(
      input.id,
      input.actor,
      input.sessionId,
      input.learnerId,
      input.detail,
      input.now,
    );
}

export async function finalizeSession(
  db: Db,
  input: { sessionId: string; status: SessionStatus; stepsSeen: number; endedAt: number },
): Promise<void> {
  await finalizeSessionUpdate(db, input).run();
}

export async function listSessionsForLearner(
  db: Db,
  learnerId: string,
  limit: number,
): Promise<(LearningSessionRow & { is_continuation_expired: number })[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline,
              CASE WHEN continuation_deadline IS NOT NULL AND ${SQL_UTC_NOW_MS_EXPR} >= continuation_deadline THEN 1 ELSE 0 END AS is_continuation_expired
       FROM learning_sessions WHERE learner_id = ?1 ORDER BY started_at DESC LIMIT ?2`,
    )
    .bind(learnerId, limit)
    .all<LearningSessionRow & { is_continuation_expired: number }>();
  return result.results ?? [];
}

export const SESSION_CONTINUATION_GRACE_MS = 30 * 60 * 1000;

/**
 * Monotonically clamp the continuation_deadline on active sessions when authorization is lost.
 * Never extends an existing deadline.
 */
export async function clampSessionContinuationDeadlines(
  db: Db,
  sessionIds: string[],
  revokedAt: number,
): Promise<void> {
  if (sessionIds.length === 0) return;
  const deadline = revokedAt + SESSION_CONTINUATION_GRACE_MS;
  const placeholders = sessionIds.map((_, i) => `?${i + 2}`).join(",");
  await db
    .prepare(
      `UPDATE learning_sessions
       SET continuation_deadline = CASE
         WHEN continuation_deadline IS NULL THEN ?1
         WHEN continuation_deadline > ?1 THEN ?1
         ELSE continuation_deadline
       END
       WHERE id IN (${placeholders}) AND status = 'in_progress'`,
    )
    .bind(deadline, ...sessionIds)
    .run();
}

export function clampContinuationDeadlinesForLearnerLessonStatement(
  db: Db,
  input: { learnerId?: string | null; lessonId: string; revokedAt: number },
): D1PreparedStatement {
  const deadline = input.revokedAt + SESSION_CONTINUATION_GRACE_MS;
  if (input.learnerId) {
    return db
      .prepare(
        `UPDATE learning_sessions
         SET continuation_deadline = CASE
           WHEN continuation_deadline IS NULL THEN ?1
           WHEN continuation_deadline > ?1 THEN ?1
           ELSE continuation_deadline
         END
         WHERE learner_id = ?2 AND lesson_id = ?3 AND status = 'in_progress'`,
      )
      .bind(deadline, input.learnerId, input.lessonId);
  }
  return db
    .prepare(
      `UPDATE learning_sessions
       SET continuation_deadline = CASE
         WHEN continuation_deadline IS NULL THEN ?1
         WHEN continuation_deadline > ?1 THEN ?1
         ELSE continuation_deadline
       END
       WHERE lesson_id = ?2 AND status = 'in_progress'`,
    )
    .bind(deadline, input.lessonId);
}

export async function clampContinuationDeadlinesForLearnerLesson(
  db: Db,
  input: { learnerId?: string | null; lessonId: string; revokedAt: number },
): Promise<void> {
  await clampContinuationDeadlinesForLearnerLessonStatement(db, input).run();
}

export function clampContinuationDeadlinesForLearnerOrgStatement(
  db: Db,
  input: { learnerId: string; organizationId: string; revokedAt: number },
): D1PreparedStatement {
  const deadline = input.revokedAt + SESSION_CONTINUATION_GRACE_MS;
  return db
    .prepare(
      `UPDATE learning_sessions
       SET continuation_deadline = CASE
         WHEN continuation_deadline IS NULL THEN ?1
         WHEN continuation_deadline > ?1 THEN ?1
         ELSE continuation_deadline
       END
       WHERE learner_id = ?2
         AND status = 'in_progress'
         AND lesson_id IN (
           SELECT lesson_id FROM organization_lessons WHERE organization_id = ?3
         )`,
    )
    .bind(deadline, input.learnerId, input.organizationId);
}

export async function clampContinuationDeadlinesForLearnerOrg(
  db: Db,
  input: { learnerId: string; organizationId: string; revokedAt: number },
): Promise<void> {
  await clampContinuationDeadlinesForLearnerOrgStatement(db, input).run();
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
  await attemptInsert(db, input).run();
}

/**
 * The attempt INSERT as a bound statement, for composing into `db.batch`.
 *
 * Kept beside `recordAttempt` so the two can never drift: the batch path and the
 * single-statement path must write the same columns in the same order.
 */
export function attemptInsert(
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
): D1PreparedStatement {
  return db
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
    );
}

/**
 * Concurrency-guarded attempt INSERT for composing into `db.batch`.
 *
 * Enforces three invariants at the SQLite/D1 statement execution point:
 *   1. Gap-safe attempt numbering: `COALESCE(MAX(attempt_no), 0) + 1` for
 *      `(learner_id, step_id)` must still equal `input.attemptNo`, and
 *      `COUNT(*)` must still equal `input.expectedStepAttemptCount`.
 *   2. Hint-floor linearization: no `hint.requested` audit row for
 *      `(learner_id, step_id)` may have been committed since the snapshot
 *      (`COUNT(*) = input.expectedHintAuditCount`) or carry a numeric `level`
 *      greater than `input.helpLevel`.
 *   3. Same-skill cross-step serialization: when `input.skillId` is present,
 *      `COUNT(*)` of attempts for `(learner_id, skill_id)` must still equal
 *      `input.expectedSkillAttemptCount`.
 *
 * If any concurrent request (same-step attempt, cross-step same-skill attempt,
 * or hint disclosure) committed between snapshot read and batch execution, the
 * `WHERE` clause evaluates to 0 rows, `attempt_no` becomes `NULL`, and SQLite
 * aborts the entire `db.batch` with `NOT NULL constraint failed: learning_attempts.attempt_no`.
 */
export function attemptInsertGuarded(
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
    expectedStepAttemptCount: number;
    expectedHintAuditCount: number;
    expectedSkillAttemptCount: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id,
          submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
       VALUES (
         ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
         (
           SELECT ?12
           WHERE (
             SELECT COALESCE(MAX(attempt_no), 0) + 1
             FROM learning_attempts
             WHERE learner_id = ?3 AND step_id = ?5
           ) = ?12
           AND (
             SELECT COUNT(*)
             FROM learning_attempts
             WHERE learner_id = ?3 AND step_id = ?5
           ) = ?14
           AND (
             SELECT COUNT(*)
             FROM audit_events
             WHERE action = 'hint.requested'
               AND subject = ?5
               AND actor = 'learner:' || ?3
           ) = ?15
           AND NOT EXISTS (
             SELECT 1
             FROM audit_events
             WHERE action = 'hint.requested'
               AND subject = ?5
               AND actor = 'learner:' || ?3
               AND json_valid(detail) = 1
               AND json_type(detail, '$.level') IN ('integer', 'real')
               AND MIN(4, MAX(0, CAST(json_extract(detail, '$.level') AS INTEGER))) > ?10
           )
           AND (
             ?7 IS NULL
             OR (
               SELECT COUNT(*)
               FROM learning_attempts
               WHERE learner_id = ?3 AND skill_id = ?7
             ) = ?16
           )
           AND (
             -- Keep missing-lesson errors on the native FOREIGN KEY path rather
             -- than tripping the NOT NULL attempt_no retry sentinel.
             NOT EXISTS (SELECT 1 FROM lessons WHERE id = ?4)
             OR EXISTS (
               SELECT 1
               FROM learning_sessions
               WHERE id = ?2
                 AND learner_id = ?3
                 AND lesson_id = ?4
                 AND lesson_version = ?6
                 AND status = 'in_progress'
                 AND (continuation_deadline IS NULL OR ${SQL_UTC_NOW_MS_EXPR} < continuation_deadline)
             )
           )
         ),
         ?13
       )`,
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
      input.expectedStepAttemptCount,
      input.expectedHintAuditCount,
      input.expectedSkillAttemptCount,
    );
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

export async function countAttemptsForStepForLearner(
  db: Db,
  learnerId: string,
  stepId: string,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2")
    .bind(learnerId, stepId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Gap-safe attempt numbering and prior-attempt check for `(learnerId, stepId)`.
 *
 * Uses `COALESCE(MAX(attempt_no), 0) + 1` rather than `COUNT(*) + 1` so imported
 * or legacy history with non-contiguous numbering (e.g. an existing row with
 * `attempt_no = 2` and no `attempt_no = 1`) never collides on `attempt_no` and
 * still reports `priorAttemptCount > 0` so the next attempt is never marked `observed`.
 */
export async function getStepAttemptSummaryForLearner(
  db: Db,
  learnerId: string,
  stepId: string,
): Promise<{ nextAttemptNo: number; priorAttemptCount: number }> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(MAX(attempt_no), 0) AS max_no
       FROM learning_attempts
       WHERE learner_id = ?1 AND step_id = ?2`,
    )
    .bind(learnerId, stepId)
    .first<{ count: number; max_no: number }>();
  const priorAttemptCount = Number(row?.count ?? 0);
  const maxNo = Number(row?.max_no ?? 0);
  return {
    nextAttemptNo: Math.max(maxNo, priorAttemptCount) + 1,
    priorAttemptCount,
  };
}

/**
 * Preflight diagnostic check for duplicate `(learner_id, step_id, attempt_no)`
 * tuples before applying migration 0004 (`idx_attempts_learner_step_attempt`).
 */
export async function findDuplicateStepAttemptNumbers(
  db: Db,
): Promise<{ learner_id: string; step_id: string; attempt_no: number; duplicate_count: number }[]> {
  const result = await db
    .prepare(
      `SELECT learner_id, step_id, attempt_no, COUNT(*) AS duplicate_count
       FROM learning_attempts
       GROUP BY learner_id, step_id, attempt_no
       HAVING COUNT(*) > 1
       ORDER BY learner_id ASC, step_id ASC, attempt_no ASC`,
    )
    .all<{ learner_id: string; step_id: string; attempt_no: number; duplicate_count: number }>();
  return result.results ?? [];
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
  await skillEvidenceUpsert(db, input).run();
}

/** The skill_evidence upsert as a bound statement, for composing into `db.batch`. */
export function skillEvidenceUpsert(
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
): D1PreparedStatement {
  return db
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
    );
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
  await reviewScheduleUpsert(db, input).run();
}

/** The review_schedule upsert as a bound statement, for composing into `db.batch`. */
export function reviewScheduleUpsert(
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
): D1PreparedStatement {
  return db
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
    );
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
  await auditInsert(db, input).run();
}

/**
 * The audit INSERT as a bound statement, for composing into `db.batch`.
 *
 * `audit_events` is an append-only ledger guarded by a database trigger, so the
 * only write that can ever exist here is an INSERT. Anything this builder does
 * not produce cannot be batched against the ledger.
 */
export function auditInsert(
  db: Db,
  input: { id: string; actor: string; action: string; subject: string | null; detail: string | null; now: number },
): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(input.id, input.actor, input.action, input.subject, input.detail, input.now);
}

/**
 * Guarded hint audit INSERT that verifies at write time that the session is still
 * `in_progress`, belongs to the learner and lesson version, and has not reached
 * `continuation_deadline`. If the session was finalized or expired concurrently,
 * `action` evaluates to `NULL` and aborts with a `NOT NULL` constraint failure.
 */
export function hintAuditInsertGuarded(
  db: Db,
  input: {
    id: string;
    sessionId: string;
    learnerId: string;
    lessonId: string;
    lessonVersion: number;
    stepId: string;
    detail: string;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
       VALUES (
         ?1,
         ?2,
         (
           SELECT 'hint.requested'
           WHERE EXISTS (
             SELECT 1
             FROM learning_sessions
             WHERE id = ?3
               AND learner_id = ?4
               AND lesson_id = ?5
               AND lesson_version = ?6
               AND status = 'in_progress'
               AND (continuation_deadline IS NULL OR ${SQL_UTC_NOW_MS_EXPR} < continuation_deadline)
           )
         ),
         ?7,
         ?8,
         ?9
       )`,
    )
    .bind(
      input.id,
      `learner:${input.learnerId}`,
      input.sessionId,
      input.learnerId,
      input.lessonId,
      input.lessonVersion,
      input.stepId,
      input.detail,
      input.now,
    );
}

export async function listAudit(db: Db, limit: number): Promise<AuditEventRow[]> {
  const result = await db
    .prepare("SELECT id, actor, action, subject, detail, created_at FROM audit_events ORDER BY created_at DESC LIMIT ?1")
    .bind(limit)
    .all<AuditEventRow>();
  return result.results ?? [];
}

/**
 * Highest hint level ever disclosed to this learner on this step, across every
 * session (including legacy `hint.requested` rows recorded before `sessionId`
 * became required). Once a step's hint has been shown to a learner, opening a
 * fresh session cannot return that step to unassisted.
 *
 * Output is normalized through `clampHelp` (`0..4`) so malformed or out-of-range
 * legacy detail JSON cannot produce `NaN`, negative numbers, or values > 4 that
 * would break the `CHECK (help_level >= 0 AND help_level <= 4)` constraint on
 * `learning_attempts`.
 */
export async function getDisclosedHintState(
  db: Db,
  input: { learnerId: string; stepId: string },
): Promise<{ maxLevel: number; auditCount: number }> {
  const result = await db
    .prepare(
      `SELECT detail FROM audit_events
       WHERE action = 'hint.requested'
         AND subject = ?1
         AND actor = ?2`,
    )
    .bind(input.stepId, `learner:${input.learnerId}`)
    .all<{ detail: string | null }>();

  const rows = result.results ?? [];
  let maxLevel = 0;
  for (const row of rows) {
    if (!row.detail) continue;
    try {
      const parsed = JSON.parse(row.detail) as { level?: unknown };
      if (typeof parsed?.level === "number" && Number.isFinite(parsed.level)) {
        const clamped = clampHelp(parsed.level);
        if (clamped > maxLevel) {
          maxLevel = clamped;
        }
      }
    } catch {
      // Ignore malformed detail
    }
  }
  return { maxLevel: clampHelp(maxLevel), auditCount: rows.length };
}

export async function findMaxDisclosedHintLevel(
  db: Db,
  input: { learnerId: string; stepId: string },
): Promise<number> {
  const state = await getDisclosedHintState(db, input);
  return state.maxLevel;
}

/* ── Auth throttles ─────────────────────────────────────────────────────────
 *
 * Persistent failed-login bookkeeping. In-memory counters reset whenever the
 * Worker restarts and are trivially bypassed by rotating a header, so the
 * counter lives in D1 keyed by a scope that the caller cannot change: the
 * account being attacked and the source IP the request reached us on.
 *
 * The lock is always time-bounded. A permanent lockout would turn a forgotten
 * password into a locked-out family with no path back in, and the documented
 * recovery (`scripts/unlock-parent.mjs`, local CLI access) clears the row.
 * --------------------------------------------------------------------------- */

export type AuthThrottleStatus =
  | { blocked: true; retryAfterSec: number; failedCount: number }
  | { blocked: false; failedCount: number };

/** The cooldown after a failed-attempt burst, and the window it is measured in. */
export const AUTH_THROTTLE_MAX_FAILURES = 5;
export const AUTH_THROTTLE_WINDOW_MS = 10 * 60 * 1000;
export const AUTH_THROTTLE_LOCKOUT_MS = 15 * 60 * 1000;

/** True while the lock is in force. Expired locks are cleared on read. */
export async function checkAuthThrottle(
  db: Db,
  key: string,
  now: number,
): Promise<AuthThrottleStatus> {
  const row = await db
    .prepare(
      "SELECT key, scope, failed_count, window_started_at, locked_until, updated_at FROM auth_throttles WHERE key = ?1",
    )
    .bind(key)
    .first<AuthThrottleRow>();

  if (!row) return { blocked: false, failedCount: 0 };

  if (row.locked_until !== null) {
    if (row.locked_until > now) {
      return {
        blocked: true,
        retryAfterSec: Math.ceil((row.locked_until - now) / 1000),
        failedCount: row.failed_count,
      };
    }
    // The cooldown elapsed, so the lock is spent. Both the lock and the counter
    // are cleared: a restored login must not inherit the failed attempts that
    // preceded the cooldown, or one more typo would lock the account again
    // immediately and the parent would be stuck in a loop.
    await db
      .prepare("DELETE FROM auth_throttles WHERE key = ?1")
      .bind(key)
      .run();
    return { blocked: false, failedCount: 0 };
  }

  return { blocked: false, failedCount: row.failed_count };
}

/**
 * Records one failed attempt. The counter resets when its window has already
 * elapsed, so a learner who typed the wrong password yesterday is not counted
 * against today. On the failure that reaches the limit, a lock is written.
 */
export async function recordAuthFailure(
  db: Db,
  input: { key: string; scope: AuthThrottleRow["scope"]; now: number },
): Promise<AuthThrottleStatus> {
  const row = await db
    .prepare(
      "SELECT key, scope, failed_count, window_started_at, locked_until, updated_at FROM auth_throttles WHERE key = ?1",
    )
    .bind(input.key)
    .first<AuthThrottleRow>();

  if (!row) {
    await db
      .prepare(
        `INSERT INTO auth_throttles (key, scope, failed_count, window_started_at, locked_until, updated_at)
         VALUES (?1, ?2, 1, ?3, NULL, ?3)`,
      )
      .bind(input.key, input.scope, input.now)
      .run();
    return { blocked: false, failedCount: 1 };
  }

  const withinWindow = input.now - row.window_started_at < AUTH_THROTTLE_WINDOW_MS;
  const failedCount = withinWindow ? row.failed_count + 1 : 1;
  const lockedUntil =
    failedCount >= AUTH_THROTTLE_MAX_FAILURES ? input.now + AUTH_THROTTLE_LOCKOUT_MS : null;

  await db
    .prepare(
      `UPDATE auth_throttles
       SET failed_count = ?1, window_started_at = ?2, locked_until = ?3, updated_at = ?2, scope = ?4
       WHERE key = ?5`,
    )
    .bind(failedCount, input.now, lockedUntil, input.scope, input.key)
    .run();

  if (lockedUntil !== null) {
    return {
      blocked: true,
      retryAfterSec: Math.ceil((lockedUntil - input.now) / 1000),
      failedCount,
    };
  }
  return { blocked: false, failedCount };
}

/** Clears the counter. A successful password proves the row no longer applies. */
export async function clearAuthThrottle(db: Db, key: string): Promise<void> {
  await db.prepare("DELETE FROM auth_throttles WHERE key = ?1").bind(key).run();
}

/* ── Curriculum objectives & intake ─────────────────────────────────────── */

export async function listCurriculumObjectives(
  db: Db,
  subjectId?: string,
  grade?: number,
): Promise<CurriculumObjectiveRow[]> {
  if (subjectId !== undefined && grade !== undefined) {
    const result = await db
      .prepare(
        `SELECT id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at
         FROM curriculum_objectives WHERE subject_id = ?1 AND grade = ?2 ORDER BY grade ASC, code ASC`,
      )
      .bind(subjectId, grade)
      .all<CurriculumObjectiveRow>();
    return result.results ?? [];
  }
  if (subjectId !== undefined) {
    const result = await db
      .prepare(
        `SELECT id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at
         FROM curriculum_objectives WHERE subject_id = ?1 ORDER BY grade ASC, code ASC`,
      )
      .bind(subjectId)
      .all<CurriculumObjectiveRow>();
    return result.results ?? [];
  }
  const result = await db
    .prepare(
      `SELECT id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at
       FROM curriculum_objectives ORDER BY subject_id ASC, grade ASC, code ASC`,
    )
    .all<CurriculumObjectiveRow>();
  return result.results ?? [];
}

export async function findCurriculumObjective(db: Db, objectiveId: string): Promise<CurriculumObjectiveRow | null> {
  const row = await db
    .prepare(
      "SELECT id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at FROM curriculum_objectives WHERE id = ?1",
    )
    .bind(objectiveId)
    .first<CurriculumObjectiveRow>();
  return row ?? null;
}

export async function listCurriculumIntakesForLearner(
  db: Db,
  learnerId: string,
): Promise<CurriculumIntakeRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, school_year_label, grade, subject_id, textbook_series, current_unit,
              current_lesson, weekly_sessions, session_duration_minutes, material_reference,
              learning_goals_vi, provenance, created_at, updated_at
       FROM curriculum_intakes WHERE learner_id = ?1 ORDER BY subject_id ASC`,
    )
    .bind(learnerId)
    .all<CurriculumIntakeRow>();
  return result.results ?? [];
}

export async function findCurriculumIntake(
  db: Db,
  learnerId: string,
  subjectId: string,
  schoolYearLabel: string,
): Promise<CurriculumIntakeRow | null> {
  const row = await db
    .prepare(
      `SELECT id, learner_id, school_year_label, grade, subject_id, textbook_series, current_unit,
              current_lesson, weekly_sessions, session_duration_minutes, material_reference,
              learning_goals_vi, provenance, created_at, updated_at
       FROM curriculum_intakes WHERE learner_id = ?1 AND subject_id = ?2 AND school_year_label = ?3`,
    )
    .bind(learnerId, subjectId, schoolYearLabel)
    .first<CurriculumIntakeRow>();
  return row ?? null;
}

export async function upsertCurriculumIntake(
  db: Db,
  input: { intake: CurriculumIntakeRow },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO curriculum_intakes
         (id, learner_id, school_year_label, grade, subject_id, textbook_series, current_unit,
          current_lesson, weekly_sessions, session_duration_minutes, material_reference,
          learning_goals_vi, provenance, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
       ON CONFLICT(learner_id, subject_id, school_year_label) DO UPDATE SET
         grade = excluded.grade,
         textbook_series = excluded.textbook_series,
         current_unit = excluded.current_unit,
         current_lesson = excluded.current_lesson,
         weekly_sessions = excluded.weekly_sessions,
         session_duration_minutes = excluded.session_duration_minutes,
         material_reference = excluded.material_reference,
         learning_goals_vi = excluded.learning_goals_vi,
         provenance = excluded.provenance,
         updated_at = excluded.updated_at`,
    )
    .bind(
      input.intake.id,
      input.intake.learner_id,
      input.intake.school_year_label,
      input.intake.grade,
      input.intake.subject_id,
      input.intake.textbook_series,
      input.intake.current_unit,
      input.intake.current_lesson,
      input.intake.weekly_sessions,
      input.intake.session_duration_minutes,
      input.intake.material_reference,
      input.intake.learning_goals_vi,
      input.intake.provenance,
      input.intake.created_at,
      input.intake.updated_at,
    )
    .run();
}

/* ── Lesson metadata ────────────────────────────────────────────────────── */

export async function listLessonMetadata(db: Db): Promise<LessonMetadataRow[]> {
  const result = await db
    .prepare(
      `SELECT lesson_id, objective_id, provenance, source_ref, expected_duration_minutes,
              review_recommendation_vi, is_baseline, updated_at
       FROM lesson_metadata`,
    )
    .all<LessonMetadataRow>();
  return result.results ?? [];
}

export async function upsertLessonMetadata(
  db: Db,
  input: {
    lessonId: string;
    objectiveId: string | null;
    provenance: LessonMetadataRow["provenance"];
    sourceRef: string | null;
    expectedDurationMinutes: number;
    reviewRecommendationVi: string | null;
    isBaseline: boolean;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO lesson_metadata
         (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes,
          review_recommendation_vi, is_baseline, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(lesson_id) DO UPDATE SET
         objective_id = excluded.objective_id,
         provenance = excluded.provenance,
         source_ref = excluded.source_ref,
         expected_duration_minutes = excluded.expected_duration_minutes,
         review_recommendation_vi = excluded.review_recommendation_vi,
         is_baseline = excluded.is_baseline,
         updated_at = excluded.updated_at`,
    )
    .bind(
      input.lessonId,
      input.objectiveId,
      input.provenance,
      input.sourceRef,
      input.expectedDurationMinutes,
      input.reviewRecommendationVi,
      input.isBaseline ? 1 : 0,
      input.now,
    )
    .run();
}

export async function findLessonMetadata(db: Db, lessonId: string): Promise<LessonMetadataRow | null> {
  const row = await db
    .prepare(
      `SELECT lesson_id, objective_id, provenance, source_ref, expected_duration_minutes,
              review_recommendation_vi, is_baseline, updated_at
       FROM lesson_metadata WHERE lesson_id = ?1`,
    )
    .bind(lessonId)
    .first<LessonMetadataRow>();
  return row ?? null;
}

export async function listBaselineLessons(db: Db): Promise<string[]> {
  const result = await db
    .prepare("SELECT lesson_id FROM lesson_metadata WHERE is_baseline = 1")
    .all<{ lesson_id: string }>();
  return (result.results ?? []).map((row) => row.lesson_id);
}

/* ── Baseline assessments ───────────────────────────────────────────────── */

export async function listBaselineAssessmentsForLearner(
  db: Db,
  learnerId: string,
): Promise<BaselineAssessmentRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, subject_id, session_id, status, observed_summary_vi,
              supported_summary_vi, needs_observation_json, suggested_lessons_json,
              parent_review_required, created_at, completed_at
       FROM baseline_assessments WHERE learner_id = ?1 ORDER BY created_at DESC`,
    )
    .bind(learnerId)
    .all<BaselineAssessmentRow>();
  return result.results ?? [];
}

export async function findBaselineAssessment(
  db: Db,
  learnerId: string,
  subjectId: string,
): Promise<BaselineAssessmentRow | null> {
  const row = await db
    .prepare(
      `SELECT id, learner_id, subject_id, session_id, status, observed_summary_vi,
              supported_summary_vi, needs_observation_json, suggested_lessons_json,
              parent_review_required, created_at, completed_at
       FROM baseline_assessments WHERE learner_id = ?1 AND subject_id = ?2
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(learnerId, subjectId)
    .first<BaselineAssessmentRow>();
  return row ?? null;
}

export async function createBaselineAssessment(
  db: Db,
  input: { id: string; learnerId: string; subjectId: string; sessionId: string | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO baseline_assessments
         (id, learner_id, subject_id, session_id, status, observed_summary_vi,
          supported_summary_vi, needs_observation_json, suggested_lessons_json,
          parent_review_required, created_at)
       VALUES (?1, ?2, ?3, ?4, 'pending', NULL, NULL, '[]', '[]', 1, ?5)`,
    )
    .bind(input.id, input.learnerId, input.subjectId, input.sessionId, input.now)
    .run();
}

export async function completeBaselineAssessment(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    sessionId: string | null;
    observedSummaryVi: string;
    supportedSummaryVi: string;
    needsObservationJson: string;
    suggestedLessonsJson: string;
    parentReviewRequired: number;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE baseline_assessments
       SET status = 'completed',
           session_id = COALESCE(?2, session_id),
           observed_summary_vi = ?3,
           supported_summary_vi = ?4,
           needs_observation_json = ?5,
           suggested_lessons_json = ?6,
           parent_review_required = ?7,
           completed_at = ?8
       WHERE id = ?1 AND learner_id = ?9`,
    )
    .bind(
      input.id,
      input.sessionId,
      input.observedSummaryVi,
      input.supportedSummaryVi,
      input.needsObservationJson,
      input.suggestedLessonsJson,
      input.parentReviewRequired,
      input.now,
      input.learnerId,
    )
    .run();
}

export async function upsertBaselineAssessment(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    subjectId: string;
    sessionId: string | null;
    status: BaselineAssessmentRow["status"];
    observedSummaryVi: string | null;
    supportedSummaryVi: string | null;
    needsObservationJson: string;
    suggestedLessonsJson: string;
    parentReviewRequired: boolean;
    now: number;
    completedAt: number | null;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO baseline_assessments
         (id, learner_id, subject_id, session_id, status, observed_summary_vi,
          supported_summary_vi, needs_observation_json, suggested_lessons_json,
          parent_review_required, created_at, completed_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
       ON CONFLICT(id) DO UPDATE SET
         session_id = excluded.session_id,
         status = excluded.status,
         observed_summary_vi = excluded.observed_summary_vi,
         supported_summary_vi = excluded.supported_summary_vi,
         needs_observation_json = excluded.needs_observation_json,
         suggested_lessons_json = excluded.suggested_lessons_json,
         parent_review_required = excluded.parent_review_required,
         completed_at = excluded.completed_at`,
    )
    .bind(
      input.id,
      input.learnerId,
      input.subjectId,
      input.sessionId,
      input.status,
      input.observedSummaryVi,
      input.supportedSummaryVi,
      input.needsObservationJson,
      input.suggestedLessonsJson,
      input.parentReviewRequired ? 1 : 0,
      input.now,
      input.completedAt,
    )
    .run();
}

/* ── Learning plan items ────────────────────────────────────────────────── */

export async function listPlanItemsForLearner(
  db: Db,
  learnerId: string,
): Promise<LearningPlanItemRow[]> {
  const result = await db
    .prepare(
      `SELECT id, learner_id, school_year_label, week_index, day_of_week, scheduled_date,
              subject_id, skill_id, lesson_id, item_kind, status, duration_minutes,
              parent_note, reason_vi, created_at, updated_at
       FROM learning_plan_items WHERE learner_id = ?1 ORDER BY week_index ASC, day_of_week ASC`,
    )
    .bind(learnerId)
    .all<LearningPlanItemRow>();
  return result.results ?? [];
}

export const listLearningPlanItemsForLearner = listPlanItemsForLearner;
export const insertLearningPlanItem = insertPlanItem;
export const updateLearningPlanItem = updatePlanItem;

export async function deleteScheduledPlanItemsForLearner(
  db: Db,
  learnerId: string,
  schoolYearLabel: string,
): Promise<void> {
  await db
    .prepare(
      "DELETE FROM learning_plan_items WHERE learner_id = ?1 AND school_year_label = ?2 AND status = 'scheduled'",
    )
    .bind(learnerId, schoolYearLabel)
    .run();
}

export async function insertPlanItem(
  db: Db,
  input: { item: LearningPlanItemRow },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learning_plan_items
         (id, learner_id, school_year_label, week_index, day_of_week, scheduled_date,
          subject_id, skill_id, lesson_id, item_kind, status, duration_minutes,
          parent_note, reason_vi, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`,
    )
    .bind(
      input.item.id,
      input.item.learner_id,
      input.item.school_year_label,
      input.item.week_index,
      input.item.day_of_week,
      input.item.scheduled_date,
      input.item.subject_id,
      input.item.skill_id,
      input.item.lesson_id,
      input.item.item_kind,
      input.item.status,
      input.item.duration_minutes,
      input.item.parent_note,
      input.item.reason_vi,
      input.item.created_at,
      input.item.updated_at,
    )
    .run();
}

export async function updatePlanItem(
  db: Db,
  input: {
    id: string;
    learnerId: string;
    status?: LearningPlanItemRow["status"];
    lessonId?: string | null;
    skillId?: string | null;
    weekIndex?: number;
    dayOfWeek?: number;
    scheduledDate?: string | null;
    parentNote?: string | null;
    now: number;
  },
): Promise<void> {
  const sets: string[] = [];
  const binds: (string | number | null)[] = [];

  if (input.status !== undefined) {
    sets.push("status = ?");
    binds.push(input.status);
  }
  if (input.lessonId !== undefined) {
    sets.push("lesson_id = ?");
    binds.push(input.lessonId);
  }
  if (input.skillId !== undefined) {
    sets.push("skill_id = ?");
    binds.push(input.skillId);
  }
  if (input.weekIndex !== undefined) {
    sets.push("week_index = ?");
    binds.push(input.weekIndex);
  }
  if (input.dayOfWeek !== undefined) {
    sets.push("day_of_week = ?");
    binds.push(input.dayOfWeek);
  }
  if (input.scheduledDate !== undefined) {
    sets.push("scheduled_date = ?");
    binds.push(input.scheduledDate);
  }
  if (input.parentNote !== undefined) {
    sets.push("parent_note = ?");
    binds.push(input.parentNote);
  }
  if (sets.length === 0) return;

  sets.push("updated_at = ?");
  binds.push(input.now);

  await db
    .prepare(`UPDATE learning_plan_items SET ${sets.join(", ")} WHERE id = ? AND learner_id = ?`)
    .bind(...binds, input.id, input.learnerId)
    .run();
}

export async function deletePlanItemsForLearner(db: Db, learnerId: string): Promise<void> {
  await db.prepare("DELETE FROM learning_plan_items WHERE learner_id = ?1").bind(learnerId).run();
}

/* ── Session reflections ────────────────────────────────────────────────── */

export function sessionReflectionInsertGuarded(
  db: Db,
  input: { id: string; sessionId: string; learnerId: string; feeling: SessionReflectionRow["feeling"]; noteVi: string | null; now: number },
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO session_reflections (id, session_id, learner_id, feeling, note_vi, created_at)
       VALUES (
         ?1,
         ?2,
         ?3,
         (
           SELECT ?4
           WHERE EXISTS (
             SELECT 1
             FROM learning_sessions
             WHERE id = ?2
               AND learner_id = ?3
               AND status IN ('in_progress', 'completed')
               AND (continuation_deadline IS NULL OR ${SQL_UTC_NOW_MS_EXPR} < continuation_deadline)
           )
         ),
         ?5,
         ?6
       )`,
    )
    .bind(input.id, input.sessionId, input.learnerId, input.feeling, input.noteVi, input.now);
}

export async function insertSessionReflection(
  db: Db,
  input: { id: string; sessionId: string; learnerId: string; feeling: SessionReflectionRow["feeling"]; noteVi: string | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO session_reflections (id, session_id, learner_id, feeling, note_vi, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(input.id, input.sessionId, input.learnerId, input.feeling, input.noteVi, input.now)
    .run();
}

export async function findSessionReflection(
  db: Db,
  sessionId: string,
): Promise<SessionReflectionRow | null> {
  const row = await db
    .prepare(
      `SELECT id, session_id, learner_id, feeling, note_vi, created_at
       FROM session_reflections WHERE session_id = ?1`,
    )
    .bind(sessionId)
    .first<SessionReflectionRow>();
  return row ?? null;
}

export async function listSessionReflectionsForLearner(
  db: Db,
  learnerId: string,
): Promise<SessionReflectionRow[]> {
  const result = await db
    .prepare(
      `SELECT id, session_id, learner_id, feeling, note_vi, created_at
       FROM session_reflections WHERE learner_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(learnerId)
    .all<SessionReflectionRow>();
  return result.results ?? [];
}

/* ── Organizations, Classrooms & Consent Grants ─────────────────────────── */

export async function createOrganization(
  db: Db,
  input: { id: string; slug: string; name: string; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO organizations (id, slug, name, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?4)`,
    )
    .bind(input.id, input.slug, input.name, input.now)
    .run();
}

export async function findOrganizationById(db: Db, id: string): Promise<OrganizationRow | null> {
  const row = await db
    .prepare("SELECT id, slug, name, created_at, updated_at FROM organizations WHERE id = ?1")
    .bind(id)
    .first<OrganizationRow>();
  return row ?? null;
}

export async function findOrganizationBySlug(db: Db, slug: string): Promise<OrganizationRow | null> {
  const row = await db
    .prepare("SELECT id, slug, name, created_at, updated_at FROM organizations WHERE slug = ?1")
    .bind(slug)
    .first<OrganizationRow>();
  return row ?? null;
}

export async function addOrganizationMember(
  db: Db,
  input: { id: string; organizationId: string; userId: string; role: OrganizationRole; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)
       ON CONFLICT(organization_id, user_id) DO UPDATE SET
         role = excluded.role,
         updated_at = excluded.updated_at`,
    )
    .bind(input.id, input.organizationId, input.userId, input.role, input.now)
    .run();
}

export async function findMemberRole(
  db: Db,
  organizationId: string,
  userId: string,
): Promise<OrganizationRole | null> {
  const row = await db
    .prepare("SELECT role FROM organization_members WHERE organization_id = ?1 AND user_id = ?2")
    .bind(organizationId, userId)
    .first<{ role: OrganizationRole }>();
  return row?.role ?? null;
}

export async function listOrganizationMembers(
  db: Db,
  organizationId: string,
): Promise<(OrganizationMemberRow & { displayName: string })[]> {
  const result = await db
    .prepare(
      `SELECT om.id, om.organization_id, om.user_id, om.role, om.created_at, om.updated_at, p.display_name AS displayName
       FROM organization_members om
       JOIN parents p ON p.id = om.user_id
       WHERE om.organization_id = ?1
       ORDER BY om.created_at ASC`,
    )
    .bind(organizationId)
    .all<OrganizationMemberRow & { displayName: string }>();
  return result.results ?? [];
}

export async function createClassroom(
  db: Db,
  input: { id: string; organizationId: string; name: string; grade: number | null; subjectId: string | null; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO classrooms (id, organization_id, name, grade, subject_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
    )
    .bind(input.id, input.organizationId, input.name, input.grade, input.subjectId, input.now)
    .run();
}

export async function listClassroomsForOrganization(
  db: Db,
  organizationId: string,
  teacherId?: string,
): Promise<ClassroomRow[]> {
  if (teacherId) {
    const result = await db
      .prepare(
        `SELECT c.id, c.organization_id, c.name, c.grade, c.subject_id, c.created_at, c.updated_at
         FROM classrooms c
         JOIN classroom_teachers ct ON ct.classroom_id = c.id
         WHERE c.organization_id = ?1 AND ct.teacher_id = ?2
         ORDER BY c.created_at ASC`,
      )
      .bind(organizationId, teacherId)
      .all<ClassroomRow>();
    return result.results ?? [];
  }
  const result = await db
    .prepare(
      `SELECT id, organization_id, name, grade, subject_id, created_at, updated_at
       FROM classrooms WHERE organization_id = ?1 ORDER BY created_at ASC`,
    )
    .bind(organizationId)
    .all<ClassroomRow>();
  return result.results ?? [];
}

export async function assignClassroomTeacher(
  db: Db,
  input: { classroomId: string; teacherId: string; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO classroom_teachers (classroom_id, teacher_id, created_at)
       VALUES (?1, ?2, ?3)`,
    )
    .bind(input.classroomId, input.teacherId, input.now)
    .run();
}

export async function isTeacherAssignedToClassroom(
  db: Db,
  classroomId: string,
  teacherId: string,
): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 AS ok FROM classroom_teachers WHERE classroom_id = ?1 AND teacher_id = ?2")
    .bind(classroomId, teacherId)
    .first<{ ok: number }>();
  return (row?.ok ?? 0) === 1;
}

export async function grantLearnerConsent(
  db: Db,
  input: { id: string; organizationId: string; learnerId: string; grantedBy: string; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO learner_consents (id, organization_id, learner_id, granted_by, status, granted_at, revoked_at)
       VALUES (?1, ?2, ?3, ?4, 'active', ?5, NULL)
       ON CONFLICT(organization_id, learner_id) DO UPDATE SET
         status = 'active',
         granted_by = excluded.granted_by,
         granted_at = excluded.granted_at,
         revoked_at = NULL`,
    )
    .bind(input.id, input.organizationId, input.learnerId, input.grantedBy, input.now)
    .run();
}

export function revokeLearnerConsentStatement(
  db: Db,
  input: { organizationId: string; learnerId: string; revokedBy: string; now: number },
): D1PreparedStatement {
  return db
    .prepare(
      `UPDATE learner_consents
       SET status = 'revoked', revoked_at = ?1
       WHERE organization_id = ?2 AND learner_id = ?3 AND granted_by = ?4`,
    )
    .bind(input.now, input.organizationId, input.learnerId, input.revokedBy);
}

export async function revokeLearnerConsent(
  db: Db,
  input: { organizationId: string; learnerId: string; revokedBy: string; now: number },
): Promise<void> {
  await revokeLearnerConsentStatement(db, input).run();
}

export async function findActiveConsent(
  db: Db,
  organizationId: string,
  learnerId: string,
): Promise<LearnerConsentRow | null> {
  const row = await db
    .prepare(
      `SELECT id, organization_id, learner_id, granted_by, status, granted_at, revoked_at
       FROM learner_consents
       WHERE organization_id = ?1 AND learner_id = ?2 AND status = 'active'`,
    )
    .bind(organizationId, learnerId)
    .first<LearnerConsentRow>();
  return row ?? null;
}

export async function listConsentsForLearner(
  db: Db,
  learnerId: string,
): Promise<(LearnerConsentRow & { organizationName: string })[]> {
  const result = await db
    .prepare(
      `SELECT lc.id, lc.organization_id, lc.learner_id, lc.granted_by, lc.status, lc.granted_at, lc.revoked_at, o.name AS organizationName
       FROM learner_consents lc
       JOIN organizations o ON o.id = lc.organization_id
       WHERE lc.learner_id = ?1
       ORDER BY lc.granted_at DESC`,
    )
    .bind(learnerId)
    .all<LearnerConsentRow & { organizationName: string }>();
  return result.results ?? [];
}

export async function enrollLearnerInClassroom(
  db: Db,
  input: { id: string; classroomId: string; learnerId: string; now: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO classroom_enrollments (id, classroom_id, learner_id, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, 'enrolled', ?4, ?4)
       ON CONFLICT(classroom_id, learner_id) DO UPDATE SET
         status = 'enrolled',
         updated_at = excluded.updated_at`,
    )
    .bind(input.id, input.classroomId, input.learnerId, input.now)
    .run();
}

export async function listEnrolledLearnersInClassroom(
  db: Db,
  classroomId: string,
): Promise<(LearnerRow & { enrollmentId: string; enrolledAt: number })[]> {
  const result = await db
    .prepare(
      `SELECT l.id, l.parent_id, l.nickname, l.birth_year, l.grade, l.timezone, l.created_at, l.updated_at, l.archived_at,
              ce.id AS enrollmentId, ce.created_at AS enrolledAt
       FROM classroom_enrollments ce
       JOIN classrooms c ON c.id = ce.classroom_id
       JOIN learner_consents lc ON lc.learner_id = ce.learner_id AND lc.organization_id = c.organization_id AND lc.status = 'active'
       JOIN learners l ON l.id = ce.learner_id AND l.archived_at IS NULL
       WHERE ce.classroom_id = ?1 AND ce.status = 'enrolled'
       ORDER BY ce.created_at ASC`,
    )
    .bind(classroomId)
    .all<LearnerRow & { enrollmentId: string; enrolledAt: number }>();
  return result.results ?? [];
}

export async function listEnrollmentsForLearner(
  db: Db,
  learnerId: string,
): Promise<
  {
    enrollmentId: string;
    classroomId: string;
    classroomName: string;
    organization_id: string;
    organizationName: string;
    status: string;
    created_at: number;
  }[]
> {
  const result = await db
    .prepare(
      `SELECT ce.id AS enrollmentId, ce.classroom_id AS classroomId, c.name AS classroomName,
              c.organization_id, o.name AS organizationName, ce.status, ce.created_at
       FROM classroom_enrollments ce
       JOIN classrooms c ON c.id = ce.classroom_id
       JOIN organizations o ON o.id = c.organization_id
       WHERE ce.learner_id = ?1 AND ce.status = 'enrolled'
       ORDER BY ce.created_at ASC`,
    )
    .bind(learnerId)
    .all<{
      enrollmentId: string;
      classroomId: string;
      classroomName: string;
      organization_id: string;
      organizationName: string;
      status: string;
      created_at: number;
    }>();
  return result.results ?? [];
}

/**
 * Access check for center staff: returns true if the staff member is authorized
 * to view the learner's evidence.
 *
 * Rules:
 *  - An active consent MUST exist between the learner and the organization.
 *  - If staff is owner or admin of the organization -> authorized.
 *  - If staff is teacher -> must be assigned to at least one classroom where
 *    the learner is actively enrolled in that organization.
 */
export async function canStaffAccessLearner(
  db: Db,
  input: { organizationId: string; staffUserId: string; learnerId: string },
): Promise<boolean> {
  const consent = await findActiveConsent(db, input.organizationId, input.learnerId);
  if (!consent) return false;

  const role = await findMemberRole(db, input.organizationId, input.staffUserId);
  if (!role) return false;

  if (role === "owner" || role === "admin") return true;

  if (role === "teacher") {
    const row = await db
      .prepare(
        `SELECT 1 AS ok
         FROM classroom_teachers ct
         JOIN classrooms c ON c.id = ct.classroom_id AND c.organization_id = ?1
         JOIN classroom_enrollments ce ON ce.classroom_id = c.id AND ce.learner_id = ?2 AND ce.status = 'enrolled'
         WHERE ct.teacher_id = ?3
         LIMIT 1`,
      )
      .bind(input.organizationId, input.learnerId, input.staffUserId)
      .first<{ ok: number }>();
    return (row?.ok ?? 0) === 1;
  }

  return false;
}

/* ── M2: Teacher Lesson Authoring & Multi-Tier Approvals ─────────────────── */

export async function createOrganizationLesson(
  db: Db,
  input: {
    lesson: LessonRow;
    steps: {
      id: string;
      position: number;
      kind: string;
      content: string;
      answerKey: string;
      explanationVi: string;
    }[];
    organizationId: string;
    authorId: string;
    now: number;
  },
): Promise<void> {
  const statements: D1PreparedStatement[] = [];

  // 1. Insert lesson
  statements.push(
    db
      .prepare(
        `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10, ?10)`,
      )
      .bind(
        input.lesson.id,
        input.lesson.subject_id,
        input.lesson.skill_id,
        input.lesson.title_vi,
        input.lesson.title_en,
        input.lesson.objective_vi,
        input.lesson.objective_en,
        input.lesson.grade_from,
        input.lesson.grade_to,
        input.now,
      ),
  );

  // 1b. Insert initial immutable version snapshot (v1)
  statements.push(
    db
      .prepare(
        `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
         VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(
        input.lesson.id,
        input.lesson.title_vi,
        input.lesson.title_en,
        input.lesson.objective_vi,
        input.lesson.objective_en,
        input.now,
      ),
  );

  // 2. Insert steps
  for (const step of input.steps) {
    statements.push(
      db
        .prepare(
          `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)`,
        )
        .bind(
          step.id,
          input.lesson.id,
          step.position,
          step.kind,
          step.content,
          step.answerKey,
          step.explanationVi,
        ),
    );
  }

  // 3. Insert organization_lessons link (draft)
  statements.push(
    db
      .prepare(
        `INSERT INTO organization_lessons (lesson_id, organization_id, author_id, review_status, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'draft', ?4, ?4)`,
      )
      .bind(input.lesson.id, input.organizationId, input.authorId, input.now),
  );

  await db.batch(statements);
}

export async function findOrganizationLesson(
  db: Db,
  lessonId: string,
): Promise<OrganizationLessonRow | null> {
  const row = await db
    .prepare(
      `SELECT lesson_id, organization_id, author_id, review_status, reviewed_by, reviewed_at, review_note, created_at, updated_at
       FROM organization_lessons WHERE lesson_id = ?1`,
    )
    .bind(lessonId)
    .first<OrganizationLessonRow>();
  return row ?? null;
}

export async function submitOrganizationLessonForReview(
  db: Db,
  input: { lessonId: string; organizationId: string; now: number },
): Promise<void> {
  await db
    .prepare(
      `UPDATE organization_lessons
       SET review_status = 'submitted', updated_at = ?1
       WHERE lesson_id = ?2 AND organization_id = ?3`,
    )
    .bind(input.now, input.lessonId, input.organizationId)
    .run();
}

export function reviewOrganizationLessonStatement(
  db: Db,
  input: {
    lessonId: string;
    organizationId: string;
    decision: "org_approved" | "org_rejected";
    reviewedBy: string;
    note: string | null;
    now: number;
  },
): D1PreparedStatement {
  return db
    .prepare(
      `UPDATE organization_lessons
       SET review_status = ?1, reviewed_by = ?2, reviewed_at = ?3, review_note = ?4, updated_at = ?3
       WHERE lesson_id = ?5 AND organization_id = ?6`,
    )
    .bind(
      input.decision,
      input.reviewedBy,
      input.now,
      input.note,
      input.lessonId,
      input.organizationId,
    );
}

export async function reviewOrganizationLesson(
  db: Db,
  input: {
    lessonId: string;
    organizationId: string;
    decision: "org_approved" | "org_rejected";
    reviewedBy: string;
    note: string | null;
    now: number;
  },
): Promise<void> {
  await reviewOrganizationLessonStatement(db, input).run();
}

export async function assignLessonToClassroom(
  db: Db,
  input: {
    id: string;
    classroomId: string;
    lessonId: string;
    assignedBy: string;
    dueAt: number | null;
    now: number;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO classroom_lesson_assignments (id, classroom_id, lesson_id, assigned_by, assigned_at, due_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(classroom_id, lesson_id) DO UPDATE SET
         due_at = excluded.due_at,
         assigned_at = excluded.assigned_at`,
    )
    .bind(input.id, input.classroomId, input.lessonId, input.assignedBy, input.now, input.dueAt)
    .run();
}

export async function listClassroomAssignedLessons(
  db: Db,
  classroomId: string,
): Promise<
  {
    assignmentId: string;
    classroomId: string;
    lessonId: string;
    titleVi: string;
    subjectId: string;
    gradeFrom: number;
    gradeTo: number;
    assignedAt: number;
    dueAt: number | null;
    orgReviewStatus: string;
  }[]
> {
  const result = await db
    .prepare(
      `SELECT cla.id AS assignmentId, cla.classroom_id AS classroomId, cla.lesson_id AS lessonId,
              l.title_vi AS titleVi, l.subject_id AS subjectId, l.grade_from AS gradeFrom, l.grade_to AS gradeTo,
              cla.assigned_at AS assignedAt, cla.due_at AS dueAt,
              ol.review_status AS orgReviewStatus
       FROM classroom_lesson_assignments cla
       JOIN classrooms c ON c.id = cla.classroom_id
       JOIN lessons l ON l.id = cla.lesson_id
       JOIN organization_lessons ol ON ol.lesson_id = cla.lesson_id AND ol.organization_id = c.organization_id
       WHERE cla.classroom_id = ?1
       ORDER BY cla.assigned_at DESC`,
    )
    .bind(classroomId)
    .all<{
      assignmentId: string;
      classroomId: string;
      lessonId: string;
      titleVi: string;
      subjectId: string;
      gradeFrom: number;
      gradeTo: number;
      assignedAt: number;
      dueAt: number | null;
      orgReviewStatus: string;
    }>();
  return result.results ?? [];
}

export async function isLessonAssignedToLearner(
  db: Db,
  input: { learnerId: string; lessonId: string },
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok
       FROM classroom_lesson_assignments cla
       JOIN classrooms c ON c.id = cla.classroom_id
       JOIN classroom_enrollments ce ON ce.classroom_id = c.id AND ce.learner_id = ?1 AND ce.status = 'enrolled'
       JOIN learner_consents lc ON lc.learner_id = ?1 AND lc.organization_id = c.organization_id AND lc.status = 'active'
       JOIN organization_lessons ol ON ol.lesson_id = cla.lesson_id AND ol.organization_id = c.organization_id AND ol.review_status = 'org_approved'
       WHERE cla.lesson_id = ?2
       LIMIT 1`,
    )
    .bind(input.learnerId, input.lessonId)
    .first<{ ok: number }>();
  return (row?.ok ?? 0) === 1;
}

export async function listAssignedOrgLessonIdsForLearner(
  db: Db,
  learnerId: string,
): Promise<Set<string>> {
  const result = await db
    .prepare(
      `SELECT cla.lesson_id
       FROM classroom_lesson_assignments cla
       JOIN classrooms c ON c.id = cla.classroom_id
       JOIN classroom_enrollments ce ON ce.classroom_id = c.id AND ce.learner_id = ?1 AND ce.status = 'enrolled'
       JOIN learner_consents lc ON lc.learner_id = ?1 AND lc.organization_id = c.organization_id AND lc.status = 'active'
       JOIN organization_lessons ol ON ol.lesson_id = cla.lesson_id AND ol.organization_id = c.organization_id AND ol.review_status = 'org_approved'`,
    )
    .bind(learnerId)
    .all<{ lesson_id: string }>();
  return new Set((result.results ?? []).map((r) => r.lesson_id));
}

export async function listAllOrgLessonIds(db: Db): Promise<Set<string>> {
  const result = await db.prepare("SELECT lesson_id FROM organization_lessons").all<{ lesson_id: string }>();
  return new Set((result.results ?? []).map((r) => r.lesson_id));
}


