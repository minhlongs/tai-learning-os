/**
 * Data control: export, import, and deletion.
 *
 * These are the routes that make the learning record the family's property:
 * portably exportable, restorable, and destroyable on request.
 *
 * The invariants:
 *
 *  1. IMPORT VALIDATES BEFORE IT WRITES. A payload is checked end to end first,
 *     and a single malformed row rejects the whole import. A partial import
 *     would leave a half-restored record that looks complete.
 *
 *  2. DELETION IS EXPLICITLY CONFIRMED. The parent types a confirmation naming
 *     the learner. Deleting a learner destroys their evidence permanently, and
 *     the audit row recording that it happened is deliberately kept.
 */

import type { ExportResponse, ImportResponse } from "../../shared/api-contract";
import {
  EXPORT_COLLECTIONS,
  TRANSFER_FORMAT_VERSION,
  type ExportBody,
  validateExportEnvelope,
} from "../../shared/schemas/transfer";
import type { Db } from "../db/repositories";
import * as repo from "../db/repositories";
import { badRequest, ok, readJsonBody, serverError } from "../http/response";
import type { Handler } from "../http/middleware";

/** Collections that carry rows keyed by `id`. Order is insert order (FK-safe). */
const COLLECTIONS = EXPORT_COLLECTIONS;

const MAX_IMPORT_BYTES = 2_000_000;

/* ── POST /api/data/export ─────────────────────────────────────────────────── */

/**
 * Export the parent's whole record.
 *
 * The envelope states its own provenance (`source`, `containsLearnerEvidence`)
 * so a future import can be audited: a restored backup must stay
 * distinguishable from a fresh manual export.
 */
export const exportRecord: Handler = async (context) => {
  const db = context.env.DB;
  const learner = await repo.findFirstLearnerForParent(db, context.parent.parentId);
  if (!learner) {
    return badRequest("Chưa có hồ sơ người học để xuất dữ liệu.");
  }

  const [
    schoolYears,
    subjects,
    skills,
    lessons,
    approvals,
    sessions,
    attempts,
    evidence,
    reviewRows,
    goals,
    auditEvents,
    prerequisites,
    curriculumObjectives,
    curriculumIntakes,
    lessonMetadata,
    baselineAssessments,
    learningPlanItems,
    sessionReflections,
  ] =
    await Promise.all([
      db
        .prepare(
          `SELECT id, learner_id, label, starts_on, ends_on, grade, created_at
           FROM school_years WHERE learner_id = ?1 ORDER BY created_at ASC`,
        )
        .bind(learner.id)
        .all<Record<string, unknown>>(),
      repo.listSubjects(db),
      repo.listSkills(db),
      repo.listLessons(db),
      db
        .prepare("SELECT id, lesson_id, status, decided_by, decided_at, note FROM review_approvals ORDER BY decided_at ASC")
        .all<Record<string, unknown>>(),
      db
        .prepare(
          `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen
           FROM learning_sessions WHERE learner_id = ?1 ORDER BY started_at ASC`,
        )
        .bind(learner.id)
        .all<Record<string, unknown>>(),
      repo.listAttemptsForLearner(db, learner.id),
      repo.listSkillEvidenceForLearner(db, learner.id),
      repo.listReviewScheduleForLearner(db, learner.id),
      repo.listGoalsForLearner(db, learner.id),
      db
        .prepare("SELECT id, actor, action, subject, detail, created_at FROM audit_events ORDER BY created_at ASC")
        .all<Record<string, unknown>>(),
      db.prepare("SELECT skill_id, prerequisite_id FROM skill_prerequisites").all<Record<string, unknown>>(),
      repo.listCurriculumObjectives(db),
      repo.listCurriculumIntakesForLearner(db, learner.id),
      repo.listLessonMetadata(db),
      repo.listBaselineAssessmentsForLearner(db, learner.id),
      repo.listLearningPlanItemsForLearner(db, learner.id),
      repo.listSessionReflectionsForLearner(db, learner.id),
    ]);

  const lessonIds = lessons.map((l) => l.id);
  const stepRows = await repo.findStepsForLessons(db, lessonIds);

  const lessonSteps: ExportBody["lessonSteps"] = [];
  for (const step of stepRows) {
    const content = safeJson(step.content);
    const answerKey = safeJson(step.answer_key);
    // A step whose content no longer validates is a content bug, not something
    // to paper over with a cast; it is exported as-is so the parent can see it.
    lessonSteps.push({
      id: step.id,
      lessonId: step.lesson_id,
      position: step.position,
      kind: step.kind as ExportBody["lessonSteps"][number]["kind"],
      content: content as ExportBody["lessonSteps"][number]["content"],
      answerKey,
      explanationVi: step.explanation_vi,
      contentVersion: step.content_version,
    });
  }

  const body: ExportBody = {
    learners: [
      {
        id: learner.id,
        nickname: learner.nickname,
        birthYear: learner.birth_year,
        grade: learner.grade,
        timezone: learner.timezone,
        createdAt: learner.created_at,
        updatedAt: learner.updated_at,
        archivedAt: learner.archived_at,
      },
    ],
    schoolYears: (schoolYears.results ?? []).map((row) => ({
      id: String(row.id),
      learnerId: String(row.learner_id),
      label: String(row.label),
      startsOn: String(row.starts_on),
      endsOn: String(row.ends_on),
      grade: row.grade as number | null,
    })),
    subjects: subjects.map((s) => ({
      id: s.id,
      nameVi: s.name_vi,
      nameEn: s.name_en,
      sort: s.sort,
      active: s.active as 0 | 1,
    })),
    skills: skills.map((s) => ({
      id: s.id,
      subjectId: s.subject_id,
      code: s.code,
      nameVi: s.name_vi,
      nameEn: s.name_en,
      gradeFrom: s.grade_from,
      gradeTo: s.grade_to,
    })),
    skillPrerequisites: (prerequisites.results ?? []).map((row) => ({
      skillId: String(row.skill_id),
      prerequisiteId: String(row.prerequisite_id),
    })),
    lessons: lessons.map((l) => ({
      id: l.id,
      subjectId: l.subject_id,
      skillId: l.skill_id,
      titleVi: l.title_vi,
      titleEn: l.title_en,
      objectiveVi: l.objective_vi,
      objectiveEn: l.objective_en,
      gradeFrom: l.grade_from,
      gradeTo: l.grade_to,
      version: l.version,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    })),
    lessonSteps,
    reviewApprovals: (approvals.results ?? []).map((row) => ({
      id: String(row.id),
      lessonId: String(row.lesson_id),
      status: String(row.status) as ExportBody["reviewApprovals"][number]["status"],
      decidedBy: String(row.decided_by),
      decidedAt: Number(row.decided_at),
      note: (row.note as string | null) ?? null,
    })),
    learningSessions: (sessions.results ?? []).map((row) => ({
      id: String(row.id),
      learnerId: String(row.learner_id),
      lessonId: String(row.lesson_id),
      lessonVersion: Number(row.lesson_version),
      schoolYearId: row.school_year_id as string | null,
      startedAt: Number(row.started_at),
      endedAt: row.ended_at as number | null,
      status: String(row.status) as ExportBody["learningSessions"][number]["status"],
      stepsSeen: Number(row.steps_seen),
    })),
    learningAttempts: attempts.map((a) => ({
      id: a.id,
      sessionId: a.session_id,
      learnerId: a.learner_id,
      lessonId: a.lesson_id,
      stepId: a.step_id,
      stepVersion: a.step_version,
      skillId: a.skill_id,
      submitted: safeJson(a.submitted),
      outcome: a.outcome,
      helpLevel: a.help_level,
      evidenceKind: a.evidence_kind,
      attemptNo: a.attempt_no,
      createdAt: a.created_at,
    })),
    skillEvidence: evidence.map((e) => ({
      id: e.id,
      learnerId: e.learner_id,
      skillId: e.skill_id,
      state: e.state,
      independentCount: e.independent_count,
      assistedCount: e.assisted_count,
      correctCount: e.correct_count,
      lastIndependentAt: e.last_independent_at,
      lastObservedAt: e.last_observed_at,
      source: e.source,
      correctionNote: e.correction_note,
      updatedAt: e.updated_at,
    })),
    reviewSchedule: reviewRows.map((r) => ({
      id: r.id,
      learnerId: r.learner_id,
      skillId: r.skill_id,
      dueAt: r.due_at,
      intervalDays: r.interval_days,
      lastResult: r.last_result,
      lastAttemptAt: r.last_attempt_at,
      failureStreak: r.failure_streak,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    learningGoals: goals.map((g) => ({
      id: g.id,
      learnerId: g.learner_id,
      subjectId: g.subject_id,
      titleVi: g.title_vi,
      note: g.note,
      targetDate: g.target_date,
      status: g.status,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    })),
    curriculumObjectives: curriculumObjectives.map((o) => ({
      id: o.id,
      subjectId: o.subject_id,
      grade: o.grade,
      code: o.code,
      titleVi: o.title_vi,
      descriptionVi: o.description_vi,
      skillId: o.skill_id,
      provenance: o.provenance,
      sourceRef: o.source_ref,
      createdAt: o.created_at,
    })),
    curriculumIntakes: curriculumIntakes.map((i) => ({
      id: i.id,
      learnerId: i.learner_id,
      schoolYearLabel: i.school_year_label,
      grade: i.grade,
      subjectId: i.subject_id,
      textbookSeries: i.textbook_series,
      currentUnit: i.current_unit,
      currentLesson: i.current_lesson,
      weeklySessions: i.weekly_sessions,
      sessionDurationMinutes: i.session_duration_minutes,
      materialReference: i.material_reference,
      learningGoalsVi: i.learning_goals_vi,
      provenance: i.provenance,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    })),
    lessonMetadata: lessonMetadata.map((m) => ({
      lessonId: m.lesson_id,
      objectiveId: m.objective_id,
      provenance: m.provenance,
      sourceRef: m.source_ref,
      expectedDurationMinutes: m.expected_duration_minutes,
      reviewRecommendationVi: m.review_recommendation_vi,
      isBaseline: m.is_baseline as 0 | 1,
      updatedAt: m.updated_at,
    })),
    baselineAssessments: baselineAssessments.map((b) => ({
      id: b.id,
      learnerId: b.learner_id,
      subjectId: b.subject_id,
      sessionId: b.session_id,
      status: b.status,
      observedSummaryVi: b.observed_summary_vi,
      supportedSummaryVi: b.supported_summary_vi,
      needsObservationJson: b.needs_observation_json,
      suggestedLessonsJson: b.suggested_lessons_json,
      parentReviewRequired: b.parent_review_required as 0 | 1,
      createdAt: b.created_at,
      completedAt: b.completed_at,
    })),
    learningPlanItems: learningPlanItems.map((p) => ({
      id: p.id,
      learnerId: p.learner_id,
      schoolYearLabel: p.school_year_label,
      weekIndex: p.week_index,
      dayOfWeek: p.day_of_week,
      scheduledDate: p.scheduled_date,
      subjectId: p.subject_id,
      skillId: p.skill_id,
      lessonId: p.lesson_id,
      itemKind: p.item_kind,
      status: p.status,
      durationMinutes: p.duration_minutes,
      parentNote: p.parent_note,
      reasonVi: p.reason_vi,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    sessionReflections: sessionReflections.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      learnerId: r.learner_id,
      feeling: r.feeling,
      noteVi: r.note_vi,
      createdAt: r.created_at,
    })),
    auditEvents: (auditEvents.results ?? []).map((row) => ({
      id: String(row.id),
      actor: String(row.actor),
      action: String(row.action),
      subject: row.subject as string | null,
      detail: safeJson(row.detail as string | null),
      createdAt: Number(row.created_at),
    })),
    schemaVersions: [
      { version: 1, description: "Initial schema" },
      { version: 3, description: "Curriculum foundation, persistent auth throttles, baseline assessments, 4-week planner, reflections" },
    ],
  };

  const now = Date.now();
  await repo.recordAudit(db, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "data.exported",
    subject: learner.id,
    detail: JSON.stringify({ formatVersion: TRANSFER_FORMAT_VERSION }),
    now,
  });

  return ok<ExportResponse>({
    formatVersion: TRANSFER_FORMAT_VERSION,
    exportedAt: now,
    source: "manual_export",
    containsLearnerEvidence: body.learningSessions.length > 0,
    data: body,
  });
};

/* ── POST /api/data/import ─────────────────────────────────────────────────── */

/**
 * Import a previously exported envelope.
 *
 * Validation is all-or-nothing: every row is checked before any write happens,
 * so a rejected import leaves the database exactly as it was.
 *
 * The learner is re-keyed to the importing parent. This means an import can
 * never attach a learner to an account that did not already own that record —
 * and it is why the parent must settle an existing learner first.
 */
export const importRecord: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, MAX_IMPORT_BYTES);
  if (!parsed.ok) return parsed.response;

  const validation = validateExportEnvelope(parsed.body);
  if (!validation.ok) {
    return badRequest(validation.errors[0] ?? "Tệp dữ liệu không hợp lệ.");
  }

  const existing = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (existing) {
    return badRequest(
      "Máy này đã có hồ sơ người học. Vui lòng xóa hồ sơ hiện tại trước khi phục hồi.",
    );
  }

  const db = context.env.DB;
  const data = validation.envelope.data;
  const countOf = (key: (typeof COLLECTIONS)[number]) => (data[key] ?? []).length;

  try {
    // Remap the exported learner id to a fresh one owned by this parent, so
    // every dependent row can be re-pointed at a learner that really exists.
    const learnerIds = new Map<string, string>();
    for (const learner of data.learners) {
      const id = crypto.randomUUID();
      await repo.createLearner(db, {
        id,
        parentId: context.parent.parentId,
        nickname: learner.nickname,
        birthYear: learner.birthYear,
        grade: learner.grade,
        timezone: learner.timezone,
        now: learner.createdAt,
      });
      learnerIds.set(learner.id, id);
    }

    await importCollections(db, {
      ...data,
      learners: data.learners.map((learner) => ({
        ...learner,
        id: learnerIds.get(learner.id) ?? learner.id,
      })),
      schoolYears: data.schoolYears.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
      curriculumIntakes: (data.curriculumIntakes ?? []).map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      learningSessions: data.learningSessions.map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      learningAttempts: data.learningAttempts.map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      skillEvidence: data.skillEvidence.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
      reviewSchedule: data.reviewSchedule.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
      baselineAssessments: (data.baselineAssessments ?? []).map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      learningPlanItems: (data.learningPlanItems ?? []).map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      sessionReflections: (data.sessionReflections ?? []).map((row) => ({
        ...row,
        learnerId: retarget(learnerIds, row.learnerId),
      })),
      learningGoals: data.learningGoals.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
    });

    const counts: Record<string, number> = {};
    for (const key of COLLECTIONS) counts[key] = countOf(key);

    await repo.recordAudit(db, {
      id: crypto.randomUUID(),
      actor: `parent:${context.parent.parentId}`,
      action: "data.imported",
      subject: null,
      detail: JSON.stringify({
        source: validation.envelope.source,
        formatVersion: validation.envelope.formatVersion,
        counts,
      }),
      now: Date.now(),
    });

    const report: ImportResponse = {
      ok: true,
      errors: [],
      warnings: validation.warnings,
      counts,
    };
    return ok<ImportResponse>(report);
  } catch {
    // The import is not wrapped in a D1 transaction (D1 transactions are limited
    // to a single statement batch), so a failure mid-way must be reported rather
    // than presented as a successful restore.
    return serverError();
  }
};

/* ── DELETE /api/data/learner ─────────────────────────────────────────────── */

export const deleteLearner: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as { learnerId?: unknown; confirmation?: unknown };

  if (typeof body.learnerId !== "string" || typeof body.confirmation !== "string") {
    return badRequest("Thiếu thông tin xóa hồ sơ.");
  }

  const learner = await repo.findLearnerOwnedBy(context.env.DB, body.learnerId, context.parent.parentId);
  if (!learner) return badRequest("Không tìm thấy hồ sơ người học.");

  // The confirmation names the learner, so a generic "yes" cannot delete.
  if (body.confirmation.trim() !== `XOA ${learner.nickname}`) {
    return badRequest("Câu xác nhận chưa đúng. Vui lòng nhập chính xác theo hướng dẫn.");
  }

  const now = Date.now();

  // Written BEFORE the cascade: this row is the proof that the deletion
  // happened, and it must survive the removal it records.
  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "learner.deleted",
    subject: learner.id,
    detail: JSON.stringify({ nickname: learner.nickname }),
    now,
  });

  await repo.deleteLearnerCascade(context.env.DB, {
    learnerId: learner.id,
    parentId: context.parent.parentId,
  });

  return ok({ deleted: true as const });
};

/* ── import writers ───────────────────────────────────────────────────────── */

async function importCollections(db: Db, data: ExportBody): Promise<void> {
  for (const schoolYear of data.schoolYears) {
    await repo.createSchoolYear(db, {
      id: schoolYear.id,
      learnerId: schoolYear.learnerId,
      label: schoolYear.label,
      startsOn: schoolYear.startsOn,
      endsOn: schoolYear.endsOn,
      grade: schoolYear.grade,
      // `SchoolYearExport` carries no timestamp: a restored row is stamped with
      // the moment of import, which is the honest created_at for this record.
      now: Date.now(),
    });
  }

  for (const skill of data.skills) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(skill.id, skill.subjectId, skill.code, skill.nameVi, skill.nameEn, skill.gradeFrom, skill.gradeTo)
      .run();
  }

  for (const row of data.skillPrerequisites) {
    await db
      .prepare("INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES (?1, ?2)")
      .bind(row.skillId, row.prerequisiteId)
      .run();
  }

  for (const lesson of data.lessons) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO lessons
           (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
            grade_from, grade_to, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`,
      )
      .bind(
        lesson.id,
        lesson.subjectId,
        lesson.skillId,
        lesson.titleVi,
        lesson.titleEn,
        lesson.objectiveVi,
        lesson.objectiveEn,
        lesson.gradeFrom,
        lesson.gradeTo,
        lesson.version,
        lesson.createdAt,
        lesson.updatedAt,
      )
      .run();
  }

  for (const step of data.lessonSteps) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO lesson_steps
           (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      )
      .bind(
        step.id,
        step.lessonId,
        step.position,
        step.kind,
        JSON.stringify(step.content),
        JSON.stringify(step.answerKey),
        step.explanationVi,
        step.contentVersion,
      )
      .run();
  }

  for (const approval of data.reviewApprovals) {
    await repo.setApproval(db, {
      id: approval.id,
      lessonId: approval.lessonId,
      status: approval.status,
      decidedBy: approval.decidedBy,
      note: approval.note,
      now: approval.decidedAt,
    });
  }

  for (const session of data.learningSessions) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO learning_sessions
           (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(
        session.id,
        session.learnerId,
        session.lessonId,
        session.lessonVersion,
        session.schoolYearId,
        session.startedAt,
        session.endedAt,
        session.status,
        session.stepsSeen,
      )
      .run();
  }

  for (const attempt of data.learningAttempts) {
    await repo.recordAttempt(db, {
      id: attempt.id,
      sessionId: attempt.sessionId,
      learnerId: attempt.learnerId,
      lessonId: attempt.lessonId,
      stepId: attempt.stepId,
      stepVersion: attempt.stepVersion,
      skillId: attempt.skillId,
      submitted: JSON.stringify(attempt.submitted),
      outcome: attempt.outcome,
      helpLevel: attempt.helpLevel,
      evidenceKind: attempt.evidenceKind,
      attemptNo: attempt.attemptNo,
      now: attempt.createdAt,
    });
  }

  // Evidence is restored verbatim, INCLUDING a parent correction: the import
  // must not silently re-derive and thereby overwrite a recorded decision.
  for (const row of data.skillEvidence) {
    await repo.upsertSkillEvidence(db, {
      id: row.id,
      learnerId: row.learnerId,
      skillId: row.skillId,
      state: row.state,
      independentCount: row.independentCount,
      assistedCount: row.assistedCount,
      correctCount: row.correctCount,
      lastIndependentAt: row.lastIndependentAt,
      lastObservedAt: row.lastObservedAt,
      source: row.source,
      correctionNote: row.correctionNote,
      now: row.updatedAt,
    });
  }

  for (const row of data.reviewSchedule) {
    await repo.upsertReviewSchedule(db, {
      id: row.id,
      learnerId: row.learnerId,
      skillId: row.skillId,
      dueAt: row.dueAt,
      intervalDays: row.intervalDays,
      lastResult: row.lastResult ?? "failed",
      lastAttemptAt: row.lastAttemptAt ?? row.createdAt,
      failureStreak: row.failureStreak,
      now: row.updatedAt,
    });
  }

  // Goals are written directly rather than through `createGoal`, which would
  // force every restored goal back to `active` and lose its real status.
  for (const goal of data.learningGoals) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO learning_goals
           (id, learner_id, subject_id, title_vi, note, target_date, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
      )
      .bind(
        goal.id,
        goal.learnerId,
        goal.subjectId,
        goal.titleVi,
        goal.note,
        goal.targetDate,
        goal.status,
        goal.createdAt,
        goal.updatedAt,
      )
      .run();
  }

  for (const obj of data.curriculumObjectives ?? []) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO curriculum_objectives
           (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
      )
      .bind(
        obj.id,
        obj.subjectId,
        obj.grade,
        obj.code,
        obj.titleVi,
        obj.descriptionVi,
        obj.skillId,
        obj.provenance,
        obj.sourceRef,
        obj.createdAt,
      )
      .run();
  }

  for (const intake of data.curriculumIntakes ?? []) {
    await repo.upsertCurriculumIntake(db, {
      intake: {
        id: intake.id,
        learner_id: intake.learnerId,
        school_year_label: intake.schoolYearLabel,
        grade: intake.grade,
        subject_id: intake.subjectId,
        textbook_series: intake.textbookSeries,
        current_unit: intake.currentUnit,
        current_lesson: intake.currentLesson,
        weekly_sessions: intake.weeklySessions,
        session_duration_minutes: intake.sessionDurationMinutes,
        material_reference: intake.materialReference,
        learning_goals_vi: intake.learningGoalsVi,
        provenance: intake.provenance,
        created_at: intake.createdAt,
        updated_at: intake.updatedAt,
      },
    });
  }

  for (const meta of data.lessonMetadata ?? []) {
    await repo.upsertLessonMetadata(db, {
      lessonId: meta.lessonId,
      objectiveId: meta.objectiveId,
      provenance: meta.provenance,
      sourceRef: meta.sourceRef,
      expectedDurationMinutes: meta.expectedDurationMinutes,
      reviewRecommendationVi: meta.reviewRecommendationVi,
      isBaseline: meta.isBaseline === 1,
      now: meta.updatedAt,
    });
  }

  for (const b of data.baselineAssessments ?? []) {
    await repo.upsertBaselineAssessment(db, {
      id: b.id,
      learnerId: b.learnerId,
      subjectId: b.subjectId,
      sessionId: b.sessionId,
      status: b.status,
      observedSummaryVi: b.observedSummaryVi,
      supportedSummaryVi: b.supportedSummaryVi,
      needsObservationJson: b.needsObservationJson,
      suggestedLessonsJson: b.suggestedLessonsJson,
      parentReviewRequired: b.parentReviewRequired === 1,
      now: b.createdAt,
      completedAt: b.completedAt,
    });
  }

  for (const item of data.learningPlanItems ?? []) {
    await repo.insertPlanItem(db, {
      item: {
        id: item.id,
        learner_id: item.learnerId,
        school_year_label: item.schoolYearLabel,
        week_index: item.weekIndex,
        day_of_week: item.dayOfWeek,
        scheduled_date: item.scheduledDate,
        subject_id: item.subjectId,
        skill_id: item.skillId,
        lesson_id: item.lessonId,
        item_kind: item.itemKind,
        status: item.status,
        duration_minutes: item.durationMinutes,
        parent_note: item.parentNote,
        reason_vi: item.reasonVi,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      },
    });
  }

  for (const refl of data.sessionReflections ?? []) {
    await repo.insertSessionReflection(db, {
      id: refl.id,
      sessionId: refl.sessionId,
      learnerId: refl.learnerId,
      feeling: refl.feeling,
      noteVi: refl.noteVi,
      now: refl.createdAt,
    });
  }
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

function retarget(map: Map<string, string>, exportedId: string): string {
  return map.get(exportedId) ?? exportedId;
}

function safeJson(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
