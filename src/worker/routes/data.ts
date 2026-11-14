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
import { badRequest, conflict, notFound, ok, readJsonBody, serverError } from "../http/response";
import type { Handler } from "../http/middleware";
import { filterVisibleLessonsForParent } from "./parent";

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
export async function buildLearnerExportEnvelope(
  db: Db,
  parentId: string,
  requestedLearnerId = "",
): Promise<
  | { ok: true; learnerId: string; envelope: ExportResponse }
  | { ok: false; status: number; response: Response }
> {
  const learner =
    requestedLearnerId.length > 0
      ? await repo.findLearnerForParent(db, requestedLearnerId, parentId)
      : await repo.findFirstLearnerForParent(db, parentId);
  if (!learner) {
    if (requestedLearnerId.length > 0) {
      return { ok: false, status: 404, response: notFound("Không tìm thấy hồ sơ người học.") };
    }
    return {
      ok: false,
      status: 400,
      response: badRequest("Chưa có hồ sơ người học để xuất dữ liệu."),
    };
  }

  const [
    schoolYears,
    subjects,
    skills,
    rawLessons,
    approvals,
    sessions,
    attempts,
    evidence,
    evidenceObservations,
    skillEstimates,
    reviewRows,
    goals,
    auditEvents,
    prerequisites,
    curriculumObjectives,
    curriculumIntakes,
    rawLessonMetadata,
    baselineAssessments,
    learningPlanItems,
    sessionReflections,
    schemaVersionsResult,
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
        .prepare(
          `SELECT id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note
           FROM review_approvals
           WHERE decided_by = ?1 AND (learner_id = ?2 OR learner_id IS NULL)
           ORDER BY decided_at ASC`,
        )
        .bind(parentId, learner.id)
        .all<Record<string, unknown>>(),
      db
        .prepare(
          `SELECT id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline, purpose
           FROM learning_sessions WHERE learner_id = ?1 ORDER BY started_at ASC`,
        )
        .bind(learner.id)
        .all<Record<string, unknown>>(),
      repo.listAttemptsForLearner(db, learner.id),
      repo.listSkillEvidenceForLearner(db, learner.id),
      repo.listEvidenceObservationsForLearner(db, learner.id),
      repo.listSkillEstimatesForLearner(db, learner.id),
      repo.listReviewScheduleForLearner(db, learner.id),
      repo.listGoalsForLearner(db, learner.id),
      db
        .prepare(
          `SELECT id, actor, action, subject, detail, created_at
           FROM audit_events
           WHERE actor = ?1 OR actor = ?2
           ORDER BY created_at ASC`,
        )
        .bind(`learner:${learner.id}`, `parent:${parentId}`)
        .all<Record<string, unknown>>(),
      db.prepare("SELECT skill_id, prerequisite_id FROM skill_prerequisites").all<Record<string, unknown>>(),
      repo.listCurriculumObjectives(db),
      repo.listCurriculumIntakesForLearner(db, learner.id),
      repo.listLessonMetadata(db),
      repo.listBaselineAssessmentsForLearner(db, learner.id),
      repo.listLearningPlanItemsForLearner(db, learner.id),
      repo.listSessionReflectionsForLearner(db, learner.id),
      db
        .prepare("SELECT version, description FROM schema_versions ORDER BY version ASC")
        .all<{ version: number; description: string }>(),
    ]);

  const [learnerVisibleLessons, assignedOrgVersions, allOrgLessonIds] = await Promise.all([
    filterVisibleLessonsForParent(
      db,
      parentId,
      learner.id,
      rawLessons,
    ),
    repo.listAssignedOrgLessonVersionsForLearner(db, learner.id),
    repo.listAllOrgLessonIds(db),
  ]);
  const visibleLessonIds = new Set<string>(learnerVisibleLessons.map((l) => l.id));
  const referencedLessonIds = new Set<string>(learnerVisibleLessons.map((l) => l.id));
  for (const row of sessions.results ?? []) referencedLessonIds.add(String(row.lesson_id));
  for (const row of approvals.results ?? []) referencedLessonIds.add(String(row.lesson_id));
  for (const a of attempts) referencedLessonIds.add(a.lesson_id);
  for (const p of learningPlanItems) {
    if (p.lesson_id) referencedLessonIds.add(p.lesson_id);
  }
  const lessons = rawLessons.filter((l) => referencedLessonIds.has(l.id));

  // Compute version-scoped authorization set `authorizedLessonVersions`:
  //   - For currently visible lessons (catalogue, owned family lessons, or assigned org lessons),
  //     catalogue lessons use `l.version`, assigned org lessons use `assigned_version`, and owned family lessons authorize all versions.
  //   - For any lesson (including previously assigned org lessons whose current version was edited
  //     after assignment revocation), only the exact `(lesson_id, version)` pairs referenced by the
  //     learner's historical `learning_sessions`, `learning_attempts`, or `review_approvals` are authorized.
  const authorizedLessonVersions = new Set<string>();
  const familyOwnedLessonIds = new Set<string>();
  for (const l of lessons) {
    if (l.ownership_type === "family" && l.owner_parent_id === parentId) {
      familyOwnedLessonIds.add(l.id);
      for (let v = 1; v <= l.version; v += 1) {
        authorizedLessonVersions.add(`${l.id}@${v}`);
      }
    } else if (visibleLessonIds.has(l.id)) {
      const isOrg = l.ownership_type === "organization" || allOrgLessonIds.has(l.id);
      const pinnedVer = isOrg ? (assignedOrgVersions.get(l.id) ?? l.version) : l.version;
      authorizedLessonVersions.add(`${l.id}@${pinnedVer}`);
    }
  }
  for (const row of sessions.results ?? []) {
    authorizedLessonVersions.add(`${String(row.lesson_id)}@${Number(row.lesson_version)}`);
  }
  for (const row of approvals.results ?? []) {
    const v = typeof row.lesson_version === "number" ? row.lesson_version : 1;
    authorizedLessonVersions.add(`${String(row.lesson_id)}@${v}`);
  }
  for (const a of attempts) {
    authorizedLessonVersions.add(`${a.lesson_id}@${a.step_version}`);
  }

  const maxAuthorizedVersionByLesson = new Map<string, number>();
  for (const key of authorizedLessonVersions) {
    const [lid, verStr] = key.split("@");
    const ver = Number(verStr);
    if (lid && Number.isInteger(ver)) {
      const prev = maxAuthorizedVersionByLesson.get(lid) ?? 0;
      if (ver > prev) maxAuthorizedVersionByLesson.set(lid, ver);
    }
  }

  const lessonIds = lessons.map((l) => l.id);
  const [allStepRows, allLessonVersionRows] = await Promise.all([
    repo.findAllStepsForLessons(db, lessonIds),
    repo.findLessonVersionsForLessons(db, lessonIds),
  ]);

  const stepRows = allStepRows.filter(
    (s) =>
      familyOwnedLessonIds.has(s.lesson_id) ||
      authorizedLessonVersions.has(`${s.lesson_id}@${s.content_version}`),
  );
  const lessonVersionRows = allLessonVersionRows.filter(
    (lv) =>
      familyOwnedLessonIds.has(lv.lesson_id) ||
      authorizedLessonVersions.has(`${lv.lesson_id}@${lv.version}`),
  );
  const lessonVersionRowMap = new Map(
    lessonVersionRows.map((lv) => [`${lv.lesson_id}@${lv.version}`, lv]),
  );

  // Only export lessons that are either currently visible to this learner OR have an
  // authorized historical version with a pinned snapshot in `lesson_versions`.
  // Never fall back to live `l.version` / `l.title_vi` / `l.objective_vi` for non-visible lessons
  // or when the effective exported version differs from live `l.version`.
  const exportableLessons = lessons.filter((l) => {
    if (l.ownership_type === "family" && l.owner_parent_id !== parentId) {
      return false;
    }
    const isOrg = l.ownership_type === "organization" || allOrgLessonIds.has(l.id);
    const effectiveVer =
      maxAuthorizedVersionByLesson.get(l.id) ??
      (isOrg ? (assignedOrgVersions.get(l.id) ?? l.version) : l.version);
    if (!visibleLessonIds.has(l.id) || effectiveVer !== l.version) {
      return lessonVersionRowMap.has(`${l.id}@${effectiveVer}`);
    }
    return true;
  });
  const exportableLessonIds = new Set(exportableLessons.map((l) => l.id));
  const lessonMetadata = rawLessonMetadata.filter((m) => exportableLessonIds.has(m.lesson_id));
  const exportableLessonVersionRows = lessonVersionRows.filter((lv) =>
    exportableLessonIds.has(lv.lesson_id),
  );

  const lessonSteps: ExportBody["lessonSteps"] = [];
  for (const step of stepRows) {
    if (!exportableLessonIds.has(step.lesson_id)) {
      continue;
    }
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
      sourceStepId: step.source_step_id ?? null,
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
    lessons: exportableLessons.map((l) => {
      const isOrg = l.ownership_type === "organization" || allOrgLessonIds.has(l.id);
      const effectiveVer =
        maxAuthorizedVersionByLesson.get(l.id) ??
        (isOrg ? (assignedOrgVersions.get(l.id) ?? l.version) : l.version);
      const pinnedSnapshot = lessonVersionRowMap.get(`${l.id}@${effectiveVer}`);
      return {
        id: l.id,
        subjectId: l.subject_id,
        skillId: l.skill_id,
        titleVi: pinnedSnapshot ? pinnedSnapshot.title_vi : l.title_vi,
        titleEn: pinnedSnapshot ? pinnedSnapshot.title_en : l.title_en,
        objectiveVi: pinnedSnapshot ? pinnedSnapshot.objective_vi : l.objective_vi,
        objectiveEn: pinnedSnapshot ? pinnedSnapshot.objective_en : l.objective_en,
        gradeFrom: l.grade_from,
        gradeTo: l.grade_to,
        version: effectiveVer,
        ownershipType: l.ownership_type ?? "catalogue",
        ownerParentId: l.owner_parent_id ?? null,
        purpose: l.purpose ?? (l.ownership_type === "family" ? "practice" : "official"),
        sourceLessonId: l.source_lesson_id ?? null,
        sourceVersion: l.source_version ?? null,
        createdAt: l.created_at,
        updatedAt: pinnedSnapshot ? pinnedSnapshot.created_at : l.updated_at,
      };
    }),
    lessonVersions: exportableLessonVersionRows.map((lv) => ({
      lessonId: lv.lesson_id,
      version: lv.version,
      titleVi: lv.title_vi,
      titleEn: lv.title_en,
      objectiveVi: lv.objective_vi,
      objectiveEn: lv.objective_en,
      createdAt: lv.created_at,
    })),
    lessonSteps,
    reviewApprovals: (approvals.results ?? [])
      .filter((row) => exportableLessonIds.has(String(row.lesson_id)))
      .map((row) => ({
      id: String(row.id),
      learnerId: (row.learner_id as string | null) ?? null,
      lessonId: String(row.lesson_id),
      lessonVersion: typeof row.lesson_version === "number" ? row.lesson_version : 1,
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
      continuationDeadline: (row.continuation_deadline as number | null) ?? null,
      purpose: ((row.purpose as string | undefined) === "practice" ? "practice" : "official") as
        | "official"
        | "practice",
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
      purpose: (a.purpose === "practice" ? "practice" : "official") as "official" | "practice",
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
    skillEvidenceObservations: evidenceObservations.map((o) => ({
      id: o.id,
      learnerId: o.learner_id,
      skillId: o.skill_id,
      attemptId: o.attempt_id,
      observedKind: o.observed_kind,
      helpLevel: o.help_level,
      attemptNo: o.attempt_no,
      observedAt: o.observed_at,
      createdAt: o.created_at,
    })),
    skillEstimates: skillEstimates.map((s) => ({
      id: s.id,
      learnerId: s.learner_id,
      skillId: s.skill_id,
      stability: s.stability,
      difficulty: s.difficulty,
      retrievabilityAt: s.retrievability_at,
      reps: s.reps,
      lapses: s.lapses,
      fsrsState: s.fsrs_state,
      scheduledDays: s.scheduled_days,
      lastReviewAt: s.last_review_at,
      modelVersion: s.model_version,
      computedAt: s.computed_at,
      attemptWatermark: s.attempt_watermark,
      attemptCount: s.attempt_count,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
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
    auditEvents: filterExportedAuditEvents(
      auditEvents.results ?? [],
      {
        learnerId: learner.id,
        parentId,
        sessionIds: new Set((sessions.results ?? []).map((r) => String(r.id))),
        goalIds: new Set(goals.map((g) => g.id)),
        planItemIds: new Set(learningPlanItems.map((p) => p.id)),
        baselineIds: new Set(baselineAssessments.map((b) => b.id)),
        familyLessonIds: familyOwnedLessonIds,
      },
    ),
    schemaVersions: (schemaVersionsResult.results ?? []).map((row) => ({
      version: Number(row.version),
      description: String(row.description),
    })),
  };

  const now = Date.now();
  return {
    ok: true,
    learnerId: learner.id,
    envelope: {
      formatVersion: TRANSFER_FORMAT_VERSION,
      exportedAt: now,
      source: "manual_export",
      containsLearnerEvidence: body.learningSessions.length > 0,
      data: body,
    },
  };
}

export const exportRecord: Handler = async (context) => {
  const db = context.env.DB;
  const requestedLearnerId =
    context.url.searchParams.get("learnerId")?.trim() ||
    context.request.headers.get("x-tlo-learner-id")?.trim() ||
    "";

  const built = await buildLearnerExportEnvelope(db, context.parent.parentId, requestedLearnerId);
  if (!built.ok) return built.response;

  await repo.recordAudit(db, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "data.exported",
    subject: built.learnerId,
    detail: JSON.stringify({ formatVersion: TRANSFER_FORMAT_VERSION }),
    now: built.envelope.exportedAt,
  });

  return ok<ExportResponse>(built.envelope);
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

  // Pre-flight collision check against existing database rows BEFORE any learner or collection is written:
  // If any imported lesson ID already exists in D1 with incompatible ownership (e.g. a family lesson
  // owned by another parent, or an imported lesson claiming family ownership of a catalogue/org lesson),
  // or if any `(lessonId, version)` or `lessonSteps` row already exists in D1 with conflicting content,
  // reject the entire import with 409 Conflict instead of silently dropping via INSERT OR IGNORE.
  const collisionError = await detectLessonImportCollision(db, data, context.parent.parentId);
  if (collisionError) {
    return conflict(collisionError);
  }

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

    await importCollections(
      db,
      {
        ...data,
        learners: data.learners.map((learner) => ({
          ...learner,
          id: learnerIds.get(learner.id) ?? learner.id,
        })),
        lessons: data.lessons.map((lesson) => {
          const resolvedOwnership = resolveImportedOwnership(lesson);
          return {
            ...lesson,
            ownershipType: resolvedOwnership,
            ownerParentId:
              resolvedOwnership === "family" ? context.parent.parentId : (lesson.ownerParentId ?? null),
          };
        }),
        schoolYears: data.schoolYears.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
        curriculumIntakes: (data.curriculumIntakes ?? []).map((row) => ({
          ...row,
          learnerId: retarget(learnerIds, row.learnerId),
        })),
        learningSessions: data.learningSessions.map((row) => ({
          ...row,
          learnerId: retarget(learnerIds, row.learnerId),
        })),
        reviewApprovals: data.reviewApprovals.map((row) => ({
          ...row,
          learnerId: row.learnerId ? retarget(learnerIds, row.learnerId) : null,
          decidedBy: context.parent.parentId,
        })),
        learningAttempts: data.learningAttempts.map((row) => ({
          ...row,
          learnerId: retarget(learnerIds, row.learnerId),
        })),
        skillEvidence: data.skillEvidence.map((row) => ({ ...row, learnerId: retarget(learnerIds, row.learnerId) })),
        skillEvidenceObservations: (data.skillEvidenceObservations ?? []).map((row) => ({
          ...row,
          learnerId: retarget(learnerIds, row.learnerId),
        })),
        skillEstimates: (data.skillEstimates ?? []).map((row) => ({
          ...row,
          learnerId: retarget(learnerIds, row.learnerId),
        })),
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
        auditEvents: data.auditEvents.map((row) => ({
          ...row,
          actor: row.actor.startsWith("learner:")
            ? `learner:${retarget(learnerIds, row.actor.slice("learner:".length))}`
            : row.actor,
          subject: row.subject ? retarget(learnerIds, row.subject) : row.subject,
        })),
      },
      context.parent.parentId,
    );

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
    detail: JSON.stringify({ grade: learner.grade }),
    now,
  });

  await repo.deleteLearnerCascade(context.env.DB, {
    learnerId: learner.id,
    parentId: context.parent.parentId,
  });

  return ok({ deleted: true as const });
};

/* ── import writers ───────────────────────────────────────────────────────── */

function resolveImportedOwnership(
  lesson: { ownershipType?: "catalogue" | "organization" | "family"; purpose?: "official" | "practice" },
  fallback: "catalogue" | "organization" | "family" = "catalogue",
): "catalogue" | "organization" | "family" {
  return lesson.ownershipType ?? (lesson.purpose === "practice" ? "family" : fallback);
}

async function detectLessonImportCollision(
  db: Db,
  data: ExportBody,
  importingParentId: string,
): Promise<string | null> {
  const referencedLessonIdSet = new Set<string>(data.lessons.map((l) => l.id));
  for (const lv of data.lessonVersions ?? []) referencedLessonIdSet.add(lv.lessonId);
  for (const s of data.lessonSteps) referencedLessonIdSet.add(s.lessonId);
  for (const sess of data.learningSessions) referencedLessonIdSet.add(sess.lessonId);
  for (const att of data.learningAttempts) referencedLessonIdSet.add(att.lessonId);
  for (const app of data.reviewApprovals) referencedLessonIdSet.add(app.lessonId);
  for (const meta of data.lessonMetadata ?? []) referencedLessonIdSet.add(meta.lessonId);
  for (const item of data.learningPlanItems ?? []) {
    if (item.lessonId) referencedLessonIdSet.add(item.lessonId);
  }
  const lessonIds = [...referencedLessonIdSet];
  if (lessonIds.length === 0) return null;

  const [existingLessons, existingVersions, existingSteps, existingSubjects, existingSkills] =
    await Promise.all([
      repo.listLessons(db),
      repo.findLessonVersionsForLessons(db, lessonIds),
      repo.findAllStepsForLessons(db, lessonIds),
      repo.listSubjects(db),
      repo.listSkills(db),
    ]);

  const existingSubjectIds = new Set<string>([
    ...existingSubjects.map((s) => s.id),
    ...(data.subjects ?? []).map((s) => s.id),
  ]);
  const existingSkillIds = new Set<string>([
    ...existingSkills.map((s) => s.id),
    ...(data.skills ?? []).map((s) => s.id),
  ]);

  const existingLessonById = new Map(existingLessons.map((l) => [l.id, l]));
  for (const importedLesson of data.lessons) {
    const existing = existingLessonById.get(importedLesson.id);
    if (!existing) {
      const importedOwnership = resolveImportedOwnership(importedLesson, "catalogue");
      if (importedOwnership !== "family") {
        return `Xung đột dữ liệu bài học (${importedLesson.id}): không được phép chèn mới bài học thư viện chung hoặc trung tâm từ tệp sao lưu.`;
      }
      continue;
    }

    const existingOwnership = existing.ownership_type ?? "catalogue";
    const importedOwnership = resolveImportedOwnership(importedLesson, existingOwnership);
    if (existingOwnership !== importedOwnership) {
      return `Xung đột dữ liệu bài học (${importedLesson.id}): loại quyền sở hữu trong tệp (${importedOwnership}) khác với cơ sở dữ liệu (${existingOwnership}).`;
    }
    const existingPurpose = existing.purpose ?? (existingOwnership === "family" ? "practice" : "official");
    const importedPurpose =
      importedLesson.purpose ?? (importedOwnership === "family" ? "practice" : "official");
    if (existingPurpose !== importedPurpose) {
      return `Xung đột dữ liệu bài học (${importedLesson.id}): mục đích bài học trong tệp (${importedPurpose}) khác với cơ sở dữ liệu (${existingPurpose}).`;
    }
    if (existingOwnership === "family" && existing.owner_parent_id !== importingParentId) {
      return `Xung đột dữ liệu bài học (${importedLesson.id}): bài học riêng đã thuộc về một gia đình khác.`;
    }
    if (existing.subject_id !== importedLesson.subjectId) {
      return `Xung đột dữ liệu bài học (${importedLesson.id}): mã môn học không khớp với cơ sở dữ liệu.`;
    }
    if (existingOwnership !== "family" && importedLesson.version > existing.version) {
      return `Xung đột dữ liệu bài học (${importedLesson.id} v${importedLesson.version}): phiên bản trong tệp vượt quá phiên bản hiện tại trong cơ sở dữ liệu (v${existing.version}).`;
    }
    if (
      existing.version === importedLesson.version &&
      (existing.title_vi !== importedLesson.titleVi ||
        existing.objective_vi !== importedLesson.objectiveVi)
    ) {
      return `Xung đột dữ liệu bài học (${importedLesson.id} v${importedLesson.version}): tiêu đề hoặc mục tiêu trong tệp khác với cơ sở dữ liệu.`;
    }
  }

  for (const lid of lessonIds) {
    const existing = existingLessonById.get(lid);
    if (existing && (existing.ownership_type ?? "catalogue") === "family" && existing.owner_parent_id !== importingParentId) {
      return `Xung đột dữ liệu bài học (${lid}): bài học riêng đã thuộc về một gia đình khác.`;
    }
  }

  for (const sess of data.learningSessions) {
    const existing = existingLessonById.get(sess.lessonId);
    if (
      existing &&
      ((existing.ownership_type ?? "catalogue") === "family" || existing.purpose === "practice") &&
      sess.purpose !== "practice"
    ) {
      return `Xung đột mục đích phiên học (${sess.id}): bài luyện tập (${sess.lessonId}) bắt buộc phải có mục đích phiên học là 'practice'.`;
    }
  }

  for (const att of data.learningAttempts) {
    const existing = existingLessonById.get(att.lessonId);
    if (
      existing &&
      ((existing.ownership_type ?? "catalogue") === "family" || existing.purpose === "practice") &&
      (att.purpose !== "practice" || att.evidenceKind === "observed")
    ) {
      return `Xung đột mục đích lượt làm bài (${att.id}): bài luyện tập (${att.lessonId}) bắt buộc phải có mục đích 'practice' và không được phép ghi nhận bằng chứng độc lập (observed).`;
    }
  }

  const importedLessonById = new Map(data.lessons.map((l) => [l.id, l]));
  for (const item of data.learningPlanItems ?? []) {
    if (!existingSubjectIds.has(item.subjectId)) {
      return `Xung đột mục kế hoạch (${item.id}): mã môn học (${item.subjectId}) không tồn tại trong hệ thống.`;
    }
    if (item.skillId && !existingSkillIds.has(item.skillId)) {
      return `Xung đột mục kế hoạch (${item.id}): mã kỹ năng (${item.skillId}) không tồn tại trong hệ thống.`;
    }
    if (!item.lessonId) continue;
    const existing = existingLessonById.get(item.lessonId);
    const imported = importedLessonById.get(item.lessonId);
    if (!existing && !imported) {
      return `Xung đột mục kế hoạch (${item.id}): bài học tham chiếu (${item.lessonId}) không tồn tại trong tệp hoặc hệ thống.`;
    }
    const isPractice = existing
      ? (existing.ownership_type ?? "catalogue") === "family" &&
        (existing.purpose ?? "practice") === "practice"
      : imported
        ? resolveImportedOwnership(imported) === "family" &&
          (imported.purpose ?? "practice") === "practice"
        : false;
    if (item.itemKind === "practice" && !isPractice) {
      return `Xung đột mục kế hoạch (${item.id}): mục luyện tập (itemKind = 'practice') chỉ được phép trỏ tới bài luyện tập riêng của gia đình (${item.lessonId}).`;
    }
    if (item.itemKind !== "practice" && isPractice) {
      return `Xung đột mục kế hoạch (${item.id}): bài luyện tập (${item.lessonId}) bắt buộc phải có itemKind = 'practice'.`;
    }
  }

  const existingVersionByKey = new Map(
    existingVersions.map((lv) => [`${lv.lesson_id}@${lv.version}`, lv]),
  );
  for (const lv of data.lessonVersions ?? []) {
    const existing = existingLessonById.get(lv.lessonId);
    const existingLv = existingVersionByKey.get(`${lv.lessonId}@${lv.version}`);
    if (existingLv) {
      if (
        existingLv.title_vi !== lv.titleVi ||
        existingLv.objective_vi !== lv.objectiveVi
      ) {
        return `Xung đột phiên bản bài học (${lv.lessonId} v${lv.version}): tiêu đề hoặc mục tiêu trong tệp khác với bản chụp đã lưu trong hệ thống.`;
      }
      continue;
    }
    if (existing && (existing.ownership_type ?? "catalogue") !== "family") {
      if (
        lv.version !== existing.version ||
        lv.titleVi !== existing.title_vi ||
        lv.objectiveVi !== existing.objective_vi
      ) {
        return `Xung đột phiên bản bài học (${lv.lessonId} v${lv.version}): không được phép chèn bản chụp phiên bản mới cho bài học chung từ tệp sao lưu.`;
      }
    }
  }

  const existingStepById = new Map(existingSteps.map((s) => [s.id, s]));
  const existingStepByPosKey = new Map(
    existingSteps.map((s) => [`${s.lesson_id}@${s.content_version}#${s.position}`, s]),
  );
  for (const step of data.lessonSteps) {
    const importedContentJson = JSON.stringify(step.content);
    const importedAnswerJson = JSON.stringify(step.answerKey);
    const byId = existingStepById.get(step.id);
    if (byId) {
      if (
        byId.lesson_id !== step.lessonId ||
        byId.content_version !== step.contentVersion ||
        byId.position !== step.position ||
        byId.kind !== step.kind ||
        byId.content !== importedContentJson ||
        byId.answer_key !== importedAnswerJson ||
        byId.explanation_vi !== step.explanationVi
      ) {
        return `Xung đột bước học (${step.id}): nội dung bước học trong tệp khác với bản ghi đã tồn tại trong cơ sở dữ liệu.`;
      }
    }
    const byPos = existingStepByPosKey.get(`${step.lessonId}@${step.contentVersion}#${step.position}`);
    if (byPos) {
      if (
        byPos.id !== step.id ||
        byPos.kind !== step.kind ||
        byPos.content !== importedContentJson ||
        byPos.answer_key !== importedAnswerJson ||
        byPos.explanation_vi !== step.explanationVi
      ) {
        return `Xung đột bước học tại bài ${step.lessonId} (v${step.contentVersion}, bước ${step.position}): nội dung trong tệp khác với bản chụp đã lưu.`;
      }
    }
    if (!byId && !byPos) {
      const existing = existingLessonById.get(step.lessonId);
      if (existing && (existing.ownership_type ?? "catalogue") !== "family") {
        return `Xung đột bước học (${step.id}): không được phép chèn bước học mới vào bài học chung (${step.lessonId}) từ tệp sao lưu.`;
      }
    }
  }

  return null;
}

async function importCollections(
  db: Db,
  data: ExportBody,
  importingParentId: string,
): Promise<void> {
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

  const hasExplicitLessonVersions =
    Array.isArray(data.lessonVersions) && data.lessonVersions.length > 0;
  const lessonsById = new Map(data.lessons.map((l) => [l.id, l]));
  const existingLessons = await repo.listLessons(db);
  const existingLessonById = new Map(existingLessons.map((l) => [l.id, l]));
  const isFamilyLesson = (lessonId: string): boolean => {
    const imported = lessonsById.get(lessonId);
    if (imported) {
      const existing = existingLessonById.get(lessonId);
      if (existing) {
        return (
          (existing.ownership_type ?? "catalogue") === "family" &&
          existing.owner_parent_id === importingParentId
        );
      }
      return resolveImportedOwnership(imported) === "family";
    }
    const existing = existingLessonById.get(lessonId);
    return (
      (existing?.ownership_type ?? "catalogue") === "family" &&
      existing?.owner_parent_id === importingParentId
    );
  };
  const isPracticeLesson = (lessonId: string): boolean => {
    const imported = lessonsById.get(lessonId);
    if (imported && (resolveImportedOwnership(imported) === "family" || imported.purpose === "practice")) {
      return true;
    }
    const existing = existingLessonById.get(lessonId);
    if (existing && ((existing.ownership_type ?? "catalogue") === "family" || existing.purpose === "practice")) {
      return true;
    }
    return false;
  };

  for (const lesson of data.lessons) {
    const ownershipType = resolveImportedOwnership(lesson);
    if (ownershipType !== "family") {
      continue;
    }
    const ownerParentId = importingParentId;
    const purpose = "practice";
    await db
      .prepare(
        `INSERT OR IGNORE INTO lessons
           (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
            grade_from, grade_to, version, ownership_type, owner_parent_id, purpose,
            source_lesson_id, source_version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)`,
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
        ownershipType,
        ownerParentId,
        purpose,
        lesson.sourceLessonId ?? null,
        lesson.sourceVersion ?? null,
        lesson.createdAt,
        lesson.updatedAt,
      )
      .run();

    // Only synthesize a fallback `lesson_versions` row when the backup is a legacy
    // pre-0009 export that did not include `lessonVersions`. When `lessonVersions`
    // is present, historical version snapshots must come strictly from `data.lessonVersions`.
    if (!hasExplicitLessonVersions) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO lesson_versions
             (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          lesson.id,
          lesson.version,
          lesson.titleVi,
          lesson.titleEn,
          lesson.objectiveVi,
          lesson.objectiveEn,
          lesson.updatedAt,
        )
        .run();
    }
  }

  for (const lv of data.lessonVersions ?? []) {
    const parentLesson = lessonsById.get(lv.lessonId);
    if (!parentLesson || !isFamilyLesson(lv.lessonId) || lv.version < 1 || lv.version > parentLesson.version) {
      continue;
    }
    await db
      .prepare(
        `INSERT OR IGNORE INTO lesson_versions
           (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(lv.lessonId, lv.version, lv.titleVi, lv.titleEn, lv.objectiveVi, lv.objectiveEn, lv.createdAt)
      .run();
  }

  for (const step of data.lessonSteps) {
    if (!isFamilyLesson(step.lessonId)) {
      continue;
    }
    const parentLesson = lessonsById.get(step.lessonId);
    if (parentLesson && !hasExplicitLessonVersions) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO lesson_versions
             (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          parentLesson.id,
          step.contentVersion,
          parentLesson.titleVi,
          parentLesson.titleEn,
          parentLesson.objectiveVi,
          parentLesson.objectiveEn,
          parentLesson.createdAt,
        )
        .run();
    }
    await db
      .prepare(
        `INSERT OR IGNORE INTO lesson_steps
           (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version, source_step_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
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
        step.sourceStepId ?? null,
      )
      .run();
  }

  // Fail-closed authorization on import:
  // `reviewApprovals` in an imported JSON file are untrusted external claims and
  // NEVER grant live authorization. Any imported approval claiming `status = 'approved'`
  // is downgraded to `'draft'` so the parent must explicitly review and re-approve
  // the lesson version for the restored learner before new sessions or continuation
  // can occur.
  for (const approval of data.reviewApprovals) {
    const version =
      typeof approval.lessonVersion === "number" && Number.isInteger(approval.lessonVersion) && approval.lessonVersion >= 1
        ? approval.lessonVersion
        : 1;
    const learnerId = approval.learnerId ?? null;
    const importedStatus = approval.status === "approved" ? "draft" : approval.status;
    await repo.setApproval(db, {
      id: approval.id,
      learnerId,
      lessonId: approval.lessonId,
      version,
      status: importedStatus,
      decidedBy: approval.decidedBy,
      note: approval.note,
      now: approval.decidedAt,
    });
  }

  for (const session of data.learningSessions) {
    const explicitDeadline =
      typeof session.continuationDeadline === "number" && Number.isFinite(session.continuationDeadline)
        ? session.continuationDeadline
        : null;
    const importNow = Date.now();
    // Fail-closed: an imported `in_progress` session never retains an open
    // continuation window from JSON claims (`continuationDeadline = null` or a
    // future timestamp), nor is it granted a fresh `now + 30 min` grace window.
    // Its deadline is clamped to at most `Math.min(explicitDeadline ?? Infinity, session.startedAt, importNow)`,
    // preserving historical session evidence while blocking unverified continuation
    // until the parent re-approves and starts a fresh authorized session.
    // If an imported session was in_progress, transition its stored status to 'abandoned'
    // so it can never be resumed via session-continuation paths.
    const effectiveStatus = session.status === "in_progress" ? "abandoned" : session.status;
    const continuationDeadline =
      session.status === "in_progress"
        ? Math.min(explicitDeadline !== null ? explicitDeadline : session.startedAt, session.startedAt, importNow)
        : explicitDeadline;

    const sessionPurpose = isPracticeLesson(session.lessonId)
      ? "practice"
      : (session.purpose ?? "official");

    await db
      .prepare(
        `INSERT OR IGNORE INTO learning_sessions
           (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline, purpose)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
      )
      .bind(
        session.id,
        session.learnerId,
        session.lessonId,
        session.lessonVersion,
        session.schoolYearId,
        session.startedAt,
        session.endedAt,
        effectiveStatus,
        session.stepsSeen,
        continuationDeadline,
        sessionPurpose,
      )
      .run();
  }

  // Attempts, derived evidence, and review schedules are one logical unit: the
  // evidence counts and due dates are a function of the attempt history, so a
  // commit that lands some attempts without their matching evidence would leave
  // the restored record describing a learner who never did what the rows say.
  // They therefore accumulate into a single statement list and commit together.
  const evidenceStatements: D1PreparedStatement[] = [];

  const sessionsById = new Map(data.learningSessions.map((s) => [s.id, s]));
  for (const attempt of data.learningAttempts) {
    const parentSession = sessionsById.get(attempt.sessionId);
    const attemptPurpose =
      isPracticeLesson(attempt.lessonId) ||
      (parentSession ? isPracticeLesson(parentSession.lessonId) || parentSession.purpose === "practice" : false)
        ? "practice"
        : (attempt.purpose ?? "official");
    evidenceStatements.push(
      repo.attemptInsert(db, {
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
        evidenceKind: attemptPurpose === "practice" ? "assisted" : attempt.evidenceKind,
        attemptNo: attempt.attemptNo,
        purpose: attemptPurpose,
        now: attempt.createdAt,
      }),
    );
  }

  // Evidence is restored verbatim, INCLUDING a parent correction: the import
  // must not silently re-derive and thereby overwrite a recorded decision.
  for (const row of data.skillEvidence) {
    evidenceStatements.push(
      repo.skillEvidenceUpsert(db, {
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
      }),
    );
  }

  for (const row of data.reviewSchedule) {
    evidenceStatements.push(
      repo.reviewScheduleUpsert(db, {
        id: row.id,
        learnerId: row.learnerId,
        skillId: row.skillId,
        dueAt: row.dueAt,
        intervalDays: row.intervalDays,
        lastResult: row.lastResult ?? "failed",
        lastAttemptAt: row.lastAttemptAt ?? row.createdAt,
        failureStreak: row.failureStreak,
        now: row.updatedAt,
      }),
    );
  }

  // Layers 2 and 3 (ADR-005). Both are derived from `learningAttempts`, so they
  // ride in the same batch as the attempts for the same reason the evidence
  // counters do: an observation that names an attempt this commit did not write
  // would be a dangling reference, and an estimate certifying a ledger prefix
  // that is not there would be a claim the file cannot back.
  for (const row of data.skillEvidenceObservations ?? []) {
    evidenceStatements.push(
      repo.evidenceObservationInsert(db, {
        id: row.id,
        learnerId: row.learnerId,
        skillId: row.skillId,
        attemptId: row.attemptId,
        observedKind: row.observedKind,
        helpLevel: row.helpLevel,
        attemptNo: row.attemptNo,
        observedAt: row.observedAt,
        now: row.observedAt,
      }),
    );
  }

  for (const row of data.skillEstimates ?? []) {
    evidenceStatements.push(
      repo.skillEstimateUpsert(db, {
        id: row.id,
        learnerId: row.learnerId,
        skillId: row.skillId,
        stability: row.stability,
        difficulty: row.difficulty,
        retrievabilityAt: row.retrievabilityAt,
        reps: row.reps,
        lapses: row.lapses,
        fsrsState: row.fsrsState,
        scheduledDays: row.scheduledDays,
        lastReviewAt: row.lastReviewAt,
        modelVersion: row.modelVersion,
        attemptWatermark: row.attemptWatermark,
        attemptCount: row.attemptCount,
        // `computedAt` keeps the instant the model produced these numbers; the
        // upsert's `now` stamps created/updated the way the review-schedule
        // restore does, because the export's `updatedAt` is the last time this
        // estimate changed, which is what a restored row should report.
        computedAt: row.computedAt,
        now: row.updatedAt,
      }),
    );
  }

  if (evidenceStatements.length > 0) {
    await db.batch(evidenceStatements);
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
    if (!isFamilyLesson(meta.lessonId)) {
      continue;
    }
    await repo.upsertLessonMetadata(db, {
      lessonId: meta.lessonId,
      objectiveId: meta.objectiveId,
      provenance: meta.provenance,
      sourceRef: meta.sourceRef,
      expectedDurationMinutes: meta.expectedDurationMinutes,
      reviewRecommendationVi: meta.reviewRecommendationVi,
      isBaseline: false,
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

  // Restore hint disclosure floors so an export -> delete -> import round-trip
  // never resets a step's hint provenance back to zero. Arbitrary security/admin
  // audit events from the untrusted import file are NOT inserted; instead we
  // compute the monotonic max hint level per (learnerId, stepId) from validated
  // `hint.requested` entries and `learningAttempts.helpLevel`, and record a
  // single server-minted `hint.requested` provenance row per disclosed step.
  const restoredHintFloor = new Map<
    string,
    { learnerId: string; stepId: string; level: number; sessionId: string | null; createdAt: number }
  >();

  for (const audit of data.auditEvents) {
    if (audit.action !== "hint.requested") continue;
    if (!audit.actor.startsWith("learner:")) continue;
    const learnerId = audit.actor.slice("learner:".length);
    if (!learnerId || typeof audit.subject !== "string" || !audit.subject) continue;
    const detailObj =
      typeof audit.detail === "object" && audit.detail !== null && !Array.isArray(audit.detail)
        ? (audit.detail as Record<string, unknown>)
        : null;
    const rawLevel = detailObj?.level;
    if (typeof rawLevel !== "number" || !Number.isInteger(rawLevel) || rawLevel < 1 || rawLevel > 4) {
      continue;
    }
    const sessionId = typeof detailObj?.sessionId === "string" ? detailObj.sessionId : null;
    const key = `${learnerId}::${audit.subject}`;
    const prev = restoredHintFloor.get(key);
    if (!prev || rawLevel > prev.level) {
      restoredHintFloor.set(key, {
        learnerId,
        stepId: audit.subject,
        level: rawLevel,
        sessionId,
        createdAt: audit.createdAt,
      });
    }
  }

  for (const attempt of data.learningAttempts) {
    if (attempt.helpLevel >= 1 && attempt.helpLevel <= 4) {
      const key = `${attempt.learnerId}::${attempt.stepId}`;
      const prev = restoredHintFloor.get(key);
      if (!prev || attempt.helpLevel > prev.level) {
        restoredHintFloor.set(key, {
          learnerId: attempt.learnerId,
          stepId: attempt.stepId,
          level: attempt.helpLevel,
          sessionId: attempt.sessionId,
          createdAt: attempt.createdAt,
        });
      }
    }
  }

  for (const entry of restoredHintFloor.values()) {
    await repo.recordAudit(db, {
      id: crypto.randomUUID(),
      actor: `learner:${entry.learnerId}`,
      action: "hint.requested",
      subject: entry.stepId,
      detail: JSON.stringify({
        sessionId: entry.sessionId,
        level: entry.level,
        restoredFromImport: true,
      }),
      now: entry.createdAt,
    });
  }
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

interface AuditFilterScope {
  learnerId: string;
  parentId: string;
  sessionIds: Set<string>;
  goalIds: Set<string>;
  planItemIds: Set<string>;
  baselineIds: Set<string>;
  familyLessonIds: Set<string>;
}

const LEARNER_SUBJECT_ACTIONS = new Set([
  "learner.created",
  "curriculum.intake_updated",
  "planner.generated",
  "data.exported",
  "data.portability_exported",
  "session.rest_overridden",
]);

function filterExportedAuditEvents(
  rows: Record<string, unknown>[],
  scope: AuditFilterScope,
): ExportBody["auditEvents"] {
  const expectedLearnerActor = `learner:${scope.learnerId}`;
  const expectedParentActor = `parent:${scope.parentId}`;
  const out: ExportBody["auditEvents"] = [];

  for (const row of rows) {
    const actor = String(row.actor);
    const action = String(row.action);
    const subject = (row.subject as string | null) ?? null;
    const detail = safeJson(row.detail as string | null);

    let matchesLearner = false;
    if (actor === expectedLearnerActor) {
      matchesLearner = true;
    } else if (actor === expectedParentActor) {
      if (subject !== null && LEARNER_SUBJECT_ACTIONS.has(action) && subject === scope.learnerId) {
        matchesLearner = true;
      } else if (action === "competency.corrected") {
        const detailLearnerId =
          typeof detail === "object" && detail !== null && !Array.isArray(detail)
            ? (detail as Record<string, unknown>).learnerId
            : undefined;
        if (detailLearnerId === scope.learnerId) {
          matchesLearner = true;
        }
      } else if (action === "goal.created" && subject !== null && scope.goalIds.has(subject)) {
        matchesLearner = true;
      } else if (
        (action.startsWith("planner.item_") || action === "planner.practice_scheduled") &&
        subject !== null &&
        scope.planItemIds.has(subject)
      ) {
        matchesLearner = true;
      } else if (
        action === "baseline.evaluated" &&
        subject !== null &&
        scope.baselineIds.has(subject)
      ) {
        matchesLearner = true;
      } else if (
        (action === "lesson.forked" || action === "lesson.content_updated") &&
        subject !== null &&
        scope.familyLessonIds.has(subject)
      ) {
        matchesLearner = true;
      } else if (
        action === "session.time_extended" &&
        subject !== null &&
        scope.sessionIds.has(subject)
      ) {
        matchesLearner = true;
      }
    }

    if (!matchesLearner) continue;

    out.push({
      id: String(row.id),
      actor,
      action,
      subject,
      detail,
      createdAt: Number(row.created_at),
    });
  }

  return out;
}

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
