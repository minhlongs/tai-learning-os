/**
 * Parent-facing routes: the dashboard, lesson management, and record control.
 *
 * Everything here is already behind authentication and CSRF (see
 * `http/middleware.ts`). The invariants these handlers add on top:
 *
 *  1. NO FABRICATED EVIDENCE. Competency rows come from `skill_evidence`, which
 *     the session service derives from stored attempts. Nothing here invents a
 *     score; an under-13 learner with no sessions sees an honest empty state.
 *
 *  2. CORRECTIONS ARE TRACEABLE. A parent's manual competency correction keeps
 *     the original attempts and writes an audit row naming the change, so the
 *     correction can be reversed and explained later.
 */

import type {
  BaselineGetResponse,
  CreateLearnerResponse,
  CurriculumGetResponse,
  EvaluateBaselineRequest,
  EvaluateBaselineResponse,
  GeneratePlanRequest,
  LearnerProfile,
  LessonDetailResponse,
  LessonListResponse,
  ParentDashboardResponse,
  PlannerGetResponse,
  ProvenanceType,
  SetApprovalRequest,
  SetApprovalResponse,
  UpdateContentRequest,
  UpdateContentResponse,
  UpdatePlanItemRequest,
  UpsertCurriculumIntakeRequest,
  UpsertCurriculumIntakeResponse,
} from "../../shared/api-contract";
import { APPROVAL_STATUSES, COMPETENCY_STATES, LESSON_STEP_KINDS } from "../../shared/schemas/attempt";
import type { ApprovalStatus, CompetencyState, LessonStepKind } from "../../shared/schemas/attempt";
import { validateExercise } from "../../shared/schemas/exercise";
import { describeState } from "../../shared/engine/competency";
import type { AttemptEvidence } from "../../shared/engine/competency";
import { needsParentAttention } from "../../shared/engine/review";
import {
  DEFAULT_PLANNER_CONFIG,
  evaluateBaselineDiagnostic,
  generateFourWeekPlan,
  type SkillCandidate,
} from "../../shared/engine/planner";
import * as repo from "../db/repositories";
import { badRequest, conflict, notFound, ok, readJsonBody, serverError } from "../http/response";
import type { Handler, HandlerContext } from "../http/middleware";
import { recordParentCorrection } from "../services/session-service";

/* ── GET /api/parent/dashboard ─────────────────────────────────────────────── */

export const getParentDashboard: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);

  if (!learner) {
    // Empty state, acknowledged as empty. No placeholder learner, no fake stats.
    return ok<ParentDashboardResponse>({
      learner: null,
      emptyState: true,
      stats: {
        sessionCount: 0,
        independentAttempts: 0,
        assistedAttempts: 0,
        skillsObserved: 0,
        skillsIndependent: 0,
        lastSessionAt: null,
      },
      reviewQueue: [],
      recentSessions: [],
      skillEvidence: [],
      goals: [],
      needsAttention: [],
    });
  }

  const [schoolYear, skills, sessions, attempts, evidenceRows, reviewRows, goals, lessons] =
    await Promise.all([
      repo.findActiveSchoolYear(context.env.DB, learner.id, new Date().toISOString().slice(0, 10)),
      repo.listSkills(context.env.DB),
      repo.listSessionsForLearner(context.env.DB, learner.id, 10),
      repo.listAttemptsForLearner(context.env.DB, learner.id),
      repo.listSkillEvidenceForLearner(context.env.DB, learner.id),
      repo.listReviewScheduleForLearner(context.env.DB, learner.id),
      repo.listGoalsForLearner(context.env.DB, learner.id),
      repo.listLessons(context.env.DB),
    ]);

  const skillById = new Map(skills.map((s) => [s.id, s]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const evidenceBySkill = new Map(evidenceRows.map((e) => [e.skill_id, e]));

  const skillEvidence: ParentDashboardResponse["skillEvidence"] = [];
  for (const skill of skills) {
    const row = evidenceBySkill.get(skill.id);
    if (!row) continue;
    skillEvidence.push({
      skillId: skill.id,
      skillNameVi: skill.name_vi,
      subjectId: skill.subject_id,
      state: row.state,
      independentCount: row.independent_count,
      assistedCount: row.assisted_count,
      reasonVi: row.correction_note
        ? `Ghi nhận thủ công bởi phụ huynh: ${row.correction_note}`
        : describeState(row.state),
      updatedAt: row.updated_at,
    });
  }

  const independentAttempts = attempts.filter(
    (a) => a.outcome === "correct" && a.help_level <= 2,
  ).length;
  const assistedAttempts = attempts.filter((a) => a.help_level >= 3).length;
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const lastSessionAt = sessions.length > 0 ? sessions[0]!.started_at : null;

  const now = Date.now();
  const reviewQueue: ParentDashboardResponse["reviewQueue"] = reviewRows
    .filter((r) => r.due_at <= now)
    .sort((a, b) => a.due_at - b.due_at)
    .map((r) => {
      const skill = skillById.get(r.skill_id);
      return {
        skillId: r.skill_id,
        skillNameVi: skill?.name_vi ?? r.skill_id,
        subjectId: skill?.subject_id ?? "",
        dueAt: r.due_at,
        intervalDays: r.interval_days,
        failureStreak: r.failure_streak,
      };
    });

  const recentSessions: ParentDashboardResponse["recentSessions"] = sessions.map((session) => {
    const lesson = lessonById.get(session.lesson_id);
    const sessionAttempts = attempts.filter((a) => a.session_id === session.id);
    return {
      sessionId: session.id,
      lessonTitleVi: lesson?.title_vi ?? session.lesson_id,
      subjectId: lesson?.subject_id ?? "",
      startedAt: session.started_at,
      status: session.status,
      correctCount: sessionAttempts.filter((a) => a.outcome === "correct").length,
      attemptedCount: sessionAttempts.length,
      independentCount: sessionAttempts.filter(
        (a) => a.outcome === "correct" && a.help_level <= 2,
      ).length,
    };
  });

  const needsAttention: ParentDashboardResponse["needsAttention"] = [];
  for (const skill of skills) {
    const skillAttempts = attempts.filter((a) => a.skill_id === skill.id);
    if (skillAttempts.length === 0) continue;
    if (needsParentAttention(toEngineEvidence(skillAttempts, skill.id))) {
      needsAttention.push({
        skillId: skill.id,
        skillNameVi: skill.name_vi,
        reasonVi: "Em làm sai nhiều lần liên tiếp. Phụ huynh nên xem lại cách giải thích.",
      });
    }
  }

  return ok<ParentDashboardResponse>({
    learner: {
      id: learner.id,
      nickname: learner.nickname,
      grade: learner.grade,
      schoolYearLabel: schoolYear?.label ?? null,
    },
    emptyState: completedSessions.length === 0 && attempts.length === 0,
    stats: {
      sessionCount: sessions.length,
      independentAttempts,
      assistedAttempts,
      skillsObserved: evidenceRows.length,
      skillsIndependent: evidenceRows.filter((e) =>
        e.state === "INDEPENDENT" || e.state === "RETAINED" || e.state === "TRANSFERRED",
      ).length,
      lastSessionAt,
    },
    reviewQueue,
    recentSessions,
    skillEvidence,
    goals: goals.map((goal) => ({
      id: goal.id,
      titleVi: goal.title_vi,
      subjectId: goal.subject_id,
      status: goal.status,
    })),
    needsAttention,
  });
};

/* ── GET /api/parent/lessons ───────────────────────────────────────────────── */

/**
 * Every stored lesson with its approval status.
 *
 * A lesson is `draft` when no approval row exists — that is the honest default:
 * content is present, but the parent has not reviewed it, so it is not shown in
 * learner mode.
 */
export const listLessons: Handler = async (context) => {
  const lessons = await repo.listLessons(context.env.DB);
  const [approvalsResult, steps, metadataRows] = await Promise.all([
    context.env.DB
      .prepare("SELECT lesson_id, status, decided_at FROM review_approvals")
      .all<{ lesson_id: string; status: ApprovalStatus; decided_at: number }>(),
    repo.findStepsForLessons(context.env.DB, lessons.map((l) => l.id)),
    repo.listLessonMetadata(context.env.DB),
  ]);

  const approvalByLesson = new Map<string, { status: ApprovalStatus; decidedAt: number }>();
  for (const row of approvalsResult.results ?? []) {
    approvalByLesson.set(row.lesson_id, { status: row.status, decidedAt: row.decided_at });
  }

  const stepCountByLesson = new Map<string, number>();
  for (const step of steps) {
    stepCountByLesson.set(step.lesson_id, (stepCountByLesson.get(step.lesson_id) ?? 0) + 1);
  }

  const metadataByLesson = new Map(metadataRows.map((m) => [m.lesson_id, m]));

  return ok<LessonListResponse>({
    lessons: lessons.map((lesson) => {
      const approval = approvalByLesson.get(lesson.id);
      const status = approval?.status ?? "draft";
      const pendingReapproval =
        status === "approved" && approval !== undefined && lesson.updated_at > approval.decidedAt;
      const meta = metadataByLesson.get(lesson.id);
      return {
        id: lesson.id,
        subjectId: lesson.subject_id,
        titleVi: lesson.title_vi,
        titleEn: lesson.title_en,
        objectiveVi: lesson.objective_vi,
        gradeFrom: lesson.grade_from,
        gradeTo: lesson.grade_to,
        version: lesson.version,
        approvalStatus: status,
        stepCount: stepCountByLesson.get(lesson.id) ?? 0,
        // Content edits bump the version and updated_at; an approval decided
        // before the current update is stale. Reported rather than hidden.
        pendingReapproval,
        objectiveId: meta?.objective_id ?? null,
        provenance: meta?.provenance ?? "original_supplemental",
        sourceRef: meta?.source_ref ?? null,
        expectedDurationMinutes: meta?.expected_duration_minutes ?? 20,
        reviewRecommendationVi: meta?.review_recommendation_vi ?? null,
        isBaseline: meta ? meta.is_baseline === 1 : false,
      };
    }),
  });
};

/* ── GET /api/parent/lessons/:lessonId ─────────────────────────────────────── */

/**
 * One lesson in full, INCLUDING the answer key — this is the parent's
 * inspection screen, the only place the key is ever returned.
 */
export const getLessonDetail: Handler = async (context) => {
  const lessonId = context.url.pathname.split("/").at(-1) ?? "";
  const lesson = await repo.findLesson(context.env.DB, lessonId);
  if (!lesson) return notFound("Không tìm thấy bài học.");

  const [steps, approval] = await Promise.all([
    repo.listStepsForLesson(context.env.DB, lesson.id),
    repo.getApproval(context.env.DB, lesson.id),
  ]);

  const payload: LessonDetailResponse["steps"] = [];
  for (const step of steps) {
    const exercise = validateExercise(parseJson(step.content));
    if (!exercise.ok) {
      // A step whose stored content no longer validates is a content bug, not
      // something to paper over with a cast.
      return serverError();
    }
    payload.push({
      id: step.id,
      position: step.position,
      kind: step.kind as LessonStepKind,
      content: exercise.value,
      explanationVi: step.explanation_vi,
      answerKey: parseJson(step.answer_key),
    });
  }

  return ok<LessonDetailResponse>({
    id: lesson.id,
    subjectId: lesson.subject_id,
    titleVi: lesson.title_vi,
    objectiveVi: lesson.objective_vi,
    approvalStatus: approval?.status ?? "draft",
    version: lesson.version,
    steps: payload,
  });
};

/* ── POST /api/parent/lessons/approval ─────────────────────────────────────── */

/**
 * Approve or reject a lesson.
 *
 * This is the gate between stored content and the learner: nothing reaches the
 * child mode until a row here says `approved`.
 */
export const setLessonApproval: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as SetApprovalRequest;

  if (typeof body.lessonId !== "string" || body.lessonId.length === 0) {
    return badRequest("Thiếu mã bài học.");
  }
  if (!isApprovalStatus(body.status)) return badRequest("Trạng thái phê duyệt không hợp lệ.");

  const lesson = await repo.findLesson(context.env.DB, body.lessonId);
  if (!lesson) return notFound("Không tìm thấy bài học.");

  const now = Date.now();
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  await repo.setApproval(context.env.DB, {
    id: crypto.randomUUID(),
    lessonId: lesson.id,
    status: body.status,
    decidedBy: context.parent.parentId,
    note,
    now,
  });

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: `lesson.approval.${body.status}`,
    subject: lesson.id,
    detail: JSON.stringify({ note: note === null ? null : note.length }),
    now,
  });

  return ok<SetApprovalResponse>({ lessonId: lesson.id, status: body.status });
};

/* ── POST /api/parent/lessons/content ─────────────────────────────────────── */

/**
 * Edit lesson content.
 *
 * Steps are re-validated against the exercise schema before anything is
 * written, and the lesson version is bumped. Bumping the version is what marks
 * an existing approval as out of date: the parent must re-review what changed.
 */
export const updateLessonContent: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 64_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as UpdateContentRequest;

  if (typeof body.lessonId !== "string") return badRequest("Thiếu mã bài học.");
  const lesson = await repo.findLesson(context.env.DB, body.lessonId);
  if (!lesson) return notFound("Không tìm thấy bài học.");

  if (body.steps !== undefined) {
    const validated = validateStepSet(body.steps);
    if (!validated.ok) return badRequest(validated.error);
    await replaceSteps(context, lesson.id, body.steps);
  }

  if (body.titleVi !== undefined && (typeof body.titleVi !== "string" || body.titleVi.trim().length === 0)) {
    return badRequest("Tiêu đề bài học không hợp lệ.");
  }
  if (
    body.objectiveVi !== undefined &&
    (typeof body.objectiveVi !== "string" || body.objectiveVi.trim().length === 0)
  ) {
    return badRequest("Mục tiêu bài học không hợp lệ.");
  }

  const now = Date.now();
  const nextVersion = lesson.version + 1;
  await bumpLesson(context, lesson.id, body, nextVersion, now);

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "lesson.content_updated",
    subject: lesson.id,
    detail: JSON.stringify({
      version: nextVersion,
      steps: body.steps?.length ?? null,
    }),
    now,
  });

  return ok<UpdateContentResponse>({ lessonId: lesson.id, version: nextVersion });
};

/* ── POST /api/parent/skills/correct ──────────────────────────────────────── */

/**
 * The parent's manual competency correction.
 *
 * The stored attempts are never rewritten — the correction is a new, labelled
 * judgement layered on top, with an audit row naming it, so the original
 * evidence survives and the change stays reversible.
 */
export const correctSkillEvidence: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as {
    learnerId?: unknown;
    skillId?: unknown;
    state?: unknown;
    note?: unknown;
  };

  if (typeof body.learnerId !== "string" || typeof body.skillId !== "string") {
    return badRequest("Thiếu thông tin kỹ năng.");
  }
  if (!isCompetencyState(body.state)) return badRequest("Trạng thái năng lực không hợp lệ.");
  if (typeof body.note !== "string" || body.note.trim().length === 0) {
    // A correction without a reason cannot be audited, so it is refused.
    return badRequest("Vui lòng ghi lý do điều chỉnh.");
  }

  const learner = await repo.findLearnerOwnedBy(context.env.DB, body.learnerId, context.parent.parentId);
  if (!learner) return notFound("Không tìm thấy hồ sơ người học.");
  const skill = await repo.findSkill(context.env.DB, body.skillId);
  if (!skill) return notFound("Không tìm thấy kỹ năng.");

  await recordParentCorrection(context.env.DB, {
    parentId: context.parent.parentId,
    learnerId: learner.id,
    skillId: skill.id,
    state: body.state,
    note: body.note.trim().slice(0, 1000),
    now: Date.now(),
  });

  return ok({ learnerId: learner.id, skillId: skill.id, state: body.state });
};

/* ── POST /api/parent/learners ────────────────────────────────────────────── */

/**
 * Enrols a learner under this parent.
 *
 * Enrolment is a parent action, not something the learner or an import file can
 * do for itself — which is why there is no way to reach this except an
 * authenticated parent session.
 *
 * The MVP is a single-learner install, so a second enrolment is refused rather
 * than silently shadowing the first. That keeps the honest invariant
 * `findFirstLearnerForParent` actually identifies a record, instead of making
 * the app guess which child a session belongs to.
 *
 * Deliberately not collected: full legal name, full date of birth, school
 * address, phone, photo, precise location. `birthYear` is a year alone and
 * `nickname` is what the learner is called in the app; the schema has no column
 * for anything more, so nothing more can be stored.
 */
export const createLearnerProfile: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as {
    nickname?: unknown;
    birthYear?: unknown;
    grade?: unknown;
    timezone?: unknown;
  };

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (nickname.length === 0 || nickname.length > 40) {
    return badRequest("Biệt danh cần từ 1 đến 40 ký tự.");
  }

  // A year, never a full date: this app has no reason to know a birthday, and
  // the column has no room for one.
  const birthYear = optionalIntIn(body.birthYear, 2000, 2100);
  if (birthYear === null && body.birthYear !== null && body.birthYear !== undefined) {
    return badRequest("Năm sinh không hợp lệ.");
  }

  const grade = optionalIntIn(body.grade, 1, 12);
  if (grade === null && body.grade !== null && body.grade !== undefined) {
    return badRequest("Khối lớp không hợp lệ.");
  }

  const timezone = typeof body.timezone === "string" && body.timezone.length > 0 ? body.timezone : "Asia/Ho_Chi_Minh";
  if (timezone.length > 64) return badRequest("Múi giờ không hợp lệ.");

  const existing = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (existing) {
    return conflict(`Máy này đã có hồ sơ người học (${existing.nickname}).`);
  }

  const now = Date.now();
  const learner = {
    id: crypto.randomUUID(),
    nickname,
    birthYear,
    grade,
    timezone,
    createdAt: now,
    updatedAt: now,
  };

  await repo.createLearner(context.env.DB, {
    id: learner.id,
    parentId: context.parent.parentId,
    nickname: learner.nickname,
    birthYear: learner.birthYear,
    grade: learner.grade,
    timezone: learner.timezone,
    now,
  });

  // The profile field carries the parent's enrolment of a child, so the moment
  // it comes into existence is worth recording. No answer, score or attempt
  // exists yet, so there is nothing else to record.
  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "learner.enrolled",
    subject: learner.id,
    detail: JSON.stringify({ grade: learner.grade }),
    now,
  });

  return ok<CreateLearnerResponse>({ learner });
};

/* ── PATCH /api/parent/learners/profile ──────────────────────────────────── */

/**
 * Renames or re-grades the learner.
 *
 * Editing a grade never rewrites existing evidence: the sessions and attempts
 * that produced a competency state were produced at whatever grade the learner
 * was in at the time, and that history is the evidence, not a current setting.
 */
export const updateLearnerProfile: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as {
    learnerId?: unknown;
    nickname?: unknown;
    grade?: unknown;
  };

  if (typeof body.learnerId !== "string") return badRequest("Thiếu thông tin hồ sơ.");

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  if (nickname.length === 0 || nickname.length > 40) {
    return badRequest("Biệt danh cần từ 1 đến 40 ký tự.");
  }

  const grade = optionalIntIn(body.grade, 1, 12);
  if (grade === null && body.grade !== null && body.grade !== undefined) {
    return badRequest("Khối lớp không hợp lệ.");
  }

  const learner = await repo.findLearnerOwnedBy(context.env.DB, body.learnerId, context.parent.parentId);
  if (!learner) return notFound("Không tìm thấy hồ sơ người học.");

  const now = Date.now();
  await repo.updateLearner(context.env.DB, {
    learnerId: learner.id,
    parentId: context.parent.parentId,
    nickname,
    grade,
    now,
  });

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "learner.updated",
    subject: learner.id,
    detail: JSON.stringify({ grade }),
    now,
  });

  return ok<LearnerProfile>({
    id: learner.id,
    nickname,
    birthYear: learner.birth_year,
    grade,
    timezone: learner.timezone,
    createdAt: learner.created_at,
    updatedAt: now,
  });
};

/* ── GET /api/parent/curriculum ───────────────────────────────────────────── */

const PROVENANCE_TYPES: readonly ProvenanceType[] = [
  "gdpt_2018_objective",
  "parent_textbook",
  "original_supplemental",
  "unverified_assumption",
];

function isProvenanceType(val: unknown): val is ProvenanceType {
  return typeof val === "string" && PROVENANCE_TYPES.includes(val as ProvenanceType);
}

export const getCurriculumSetup: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  const objectives = await repo.listCurriculumObjectives(context.env.DB);
  const schoolYearLabel = "2026-2027";
  const grade = learner?.grade ?? 4;

  if (!learner) {
    return ok<CurriculumGetResponse>({
      learnerId: null,
      schoolYearLabel,
      grade,
      intakes: [],
      objectives: objectives.map((o) => ({
        id: o.id,
        subjectId: o.subject_id,
        grade: o.grade,
        code: o.code,
        titleVi: o.title_vi,
        descriptionVi: o.description_vi,
        skillId: o.skill_id,
        provenance: o.provenance,
        sourceRef: o.source_ref,
      })),
    });
  }

  const intakes = await repo.listCurriculumIntakesForLearner(context.env.DB, learner.id);
  const activeSchoolYear = await repo.findActiveSchoolYear(
    context.env.DB,
    learner.id,
    new Date().toISOString().slice(0, 10),
  );

  return ok<CurriculumGetResponse>({
    learnerId: learner.id,
    schoolYearLabel: intakes[0]?.school_year_label ?? activeSchoolYear?.label ?? schoolYearLabel,
    grade: intakes[0]?.grade ?? grade,
    intakes: intakes.map((i) => ({
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
      updatedAt: i.updated_at,
    })),
    objectives: objectives.map((o) => ({
      id: o.id,
      subjectId: o.subject_id,
      grade: o.grade,
      code: o.code,
      titleVi: o.title_vi,
      descriptionVi: o.description_vi,
      skillId: o.skill_id,
      provenance: o.provenance,
      sourceRef: o.source_ref,
    })),
  });
};

/* ── POST /api/parent/curriculum ──────────────────────────────────────────── */

export const upsertCurriculumSetup: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) {
    return badRequest("Vui lòng tạo hồ sơ người học trước khi thiết lập chương trình học.");
  }

  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as Partial<UpsertCurriculumIntakeRequest>;

  if (typeof body.subjectId !== "string" || body.subjectId.trim().length === 0) {
    return badRequest("Thiếu mã môn học.");
  }
  const schoolYearLabel =
    typeof body.schoolYearLabel === "string" && body.schoolYearLabel.trim().length > 0
      ? body.schoolYearLabel.trim().slice(0, 32)
      : "2026-2027";
  const grade = optionalIntIn(body.grade ?? learner.grade ?? 4, 1, 12) ?? 4;
  const textbookSeries =
    typeof body.textbookSeries === "string" && body.textbookSeries.trim().length > 0
      ? body.textbookSeries.trim().slice(0, 120)
      : "UNKNOWN";
  const currentUnit =
    typeof body.currentUnit === "string" && body.currentUnit.trim().length > 0
      ? body.currentUnit.trim().slice(0, 120)
      : "UNKNOWN";
  const currentLesson =
    typeof body.currentLesson === "string" && body.currentLesson.trim().length > 0
      ? body.currentLesson.trim().slice(0, 120)
      : "UNKNOWN";
  const weeklySessions = optionalIntIn(body.weeklySessions ?? 3, 1, 14) ?? 3;
  const sessionDurationMinutes = optionalIntIn(body.sessionDurationMinutes ?? 20, 5, 120) ?? 20;
  const materialReference =
    typeof body.materialReference === "string" && body.materialReference.trim().length > 0
      ? body.materialReference.trim().slice(0, 500)
      : null;
  const learningGoalsVi =
    typeof body.learningGoalsVi === "string" && body.learningGoalsVi.trim().length > 0
      ? body.learningGoalsVi.trim().slice(0, 1000)
      : null;
  const provenance: ProvenanceType = isProvenanceType(body.provenance)
    ? body.provenance
    : textbookSeries === "UNKNOWN"
      ? "gdpt_2018_objective"
      : "parent_textbook";

  const now = Date.now();
  const id = crypto.randomUUID();
  await repo.upsertCurriculumIntake(context.env.DB, {
    intake: {
      id,
      learner_id: learner.id,
      school_year_label: schoolYearLabel,
      grade,
      subject_id: body.subjectId.trim(),
      textbook_series: textbookSeries,
      current_unit: currentUnit,
      current_lesson: currentLesson,
      weekly_sessions: weeklySessions,
      session_duration_minutes: sessionDurationMinutes,
      material_reference: materialReference,
      learning_goals_vi: learningGoalsVi,
      provenance,
      created_at: now,
      updated_at: now,
    },
  });

  // Ensure school_years row also exists for longitudinal continuity
  const existingYears = await repo.listSchoolYearsForLearner(context.env.DB, learner.id);
  if (!existingYears.some((y) => y.label === schoolYearLabel)) {
    const startYear = Number.parseInt(schoolYearLabel.slice(0, 4), 10) || 2026;
    await repo.createSchoolYear(context.env.DB, {
      id: crypto.randomUUID(),
      learnerId: learner.id,
      label: schoolYearLabel,
      startsOn: `${startYear}-09-01`,
      endsOn: `${startYear + 1}-06-30`,
      grade,
      now,
    });
  }

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "curriculum.intake_updated",
    subject: learner.id,
    detail: JSON.stringify({
      subjectId: body.subjectId,
      schoolYearLabel,
      grade,
      textbookSeries,
      provenance,
    }),
    now,
  });

  const intakes = await repo.listCurriculumIntakesForLearner(context.env.DB, learner.id);
  const saved = intakes.find(
    (i) => i.subject_id === body.subjectId && i.school_year_label === schoolYearLabel,
  );

  return ok<UpsertCurriculumIntakeResponse>({
    intake: {
      id: saved?.id ?? id,
      learnerId: learner.id,
      schoolYearLabel,
      grade,
      subjectId: body.subjectId.trim(),
      textbookSeries,
      currentUnit,
      currentLesson,
      weeklySessions,
      sessionDurationMinutes,
      materialReference,
      learningGoalsVi,
      provenance,
      updatedAt: now,
    },
  });
};

/* ── GET /api/parent/baseline ─────────────────────────────────────────────── */

export const getBaselineAssessments: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  const [lessons, metadataRows, approvals] = await Promise.all([
    repo.listLessons(context.env.DB),
    repo.listLessonMetadata(context.env.DB),
    repo.listApprovalStatuses(context.env.DB),
  ]);

  const baselineMeta = new Map(
    metadataRows.filter((m) => m.is_baseline === 1).map((m) => [m.lesson_id, m]),
  );

  const baselineLessons = lessons
    .filter((l) => baselineMeta.has(l.id))
    .map((l) => ({
      lessonId: l.id,
      subjectId: l.subject_id,
      titleVi: l.title_vi,
      objectiveVi: l.objective_vi,
      expectedDurationMinutes: baselineMeta.get(l.id)?.expected_duration_minutes ?? 15,
      approvalStatus: approvals[l.id] ?? "draft",
    }));

  if (!learner) {
    return ok<BaselineGetResponse>({
      learnerId: null,
      baselineLessons,
      assessments: [],
    });
  }

  const rows = await repo.listBaselineAssessmentsForLearner(context.env.DB, learner.id);
  return ok<BaselineGetResponse>({
    learnerId: learner.id,
    baselineLessons,
    assessments: rows.map((r) => ({
      id: r.id,
      learnerId: r.learner_id,
      subjectId: r.subject_id,
      sessionId: r.session_id,
      status: r.status,
      observedSummaryVi: r.observed_summary_vi,
      supportedSummaryVi: r.supported_summary_vi,
      needsObservation: parseStringArray(r.needs_observation_json),
      suggestedLessons: parseStringArray(r.suggested_lessons_json),
      parentReviewRequired: r.parent_review_required === 1,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    })),
  });
};

/* ── POST /api/parent/baseline ────────────────────────────────────────────── */

export const evaluateBaselineAssessment: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) {
    return badRequest("Chưa có hồ sơ người học.");
  }

  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as Partial<EvaluateBaselineRequest>;

  if (typeof body.subjectId !== "string" || body.subjectId.trim().length === 0) {
    return badRequest("Thiếu mã môn học.");
  }

  const subjectId = body.subjectId.trim();
  const [lessons, attempts] = await Promise.all([
    repo.listLessonsBySubject(context.env.DB, subjectId),
    repo.listAttemptsForLearner(context.env.DB, learner.id),
  ]);

  const subjectLessonIds = new Set(lessons.map((l) => l.id));
  const relevantAttempts = attempts
    .filter((a) => subjectLessonIds.has(a.lesson_id))
    .map((a) => ({
      stepId: a.step_id,
      stepPosition: 1,
      kind: "concept",
      outcome: a.outcome,
      helpLevel: a.help_level,
      attemptNo: a.attempt_no,
      skillId: a.skill_id,
    }));

  const evalResult = evaluateBaselineDiagnostic({
    learnerId: learner.id,
    subjectId,
    attempts: relevantAttempts,
  });

  // Map needsObservation skill IDs to suggested non-baseline lesson IDs
  const suggestedLessons = lessons
    .filter((l) => !l.id.includes("baseline") && (!l.skill_id || evalResult.needsObservation.includes(l.skill_id)))
    .map((l) => l.id);

  const now = Date.now();
  const status = body.markReviewed
    ? "reviewed"
    : relevantAttempts.length > 0
      ? "completed"
      : "pending";
  const parentReviewRequired = body.markReviewed ? false : evalResult.parentReviewRequired;

  const existing = await repo.listBaselineAssessmentsForLearner(context.env.DB, learner.id);
  const existingForSubj = existing.find((e) => e.subject_id === subjectId);
  const id = existingForSubj?.id ?? crypto.randomUUID();

  await repo.upsertBaselineAssessment(context.env.DB, {
    id,
    learnerId: learner.id,
    subjectId,
    sessionId: body.sessionId ?? existingForSubj?.session_id ?? null,
    status,
    observedSummaryVi: evalResult.observedSummaryVi,
    supportedSummaryVi: evalResult.supportedSummaryVi,
    needsObservationJson: JSON.stringify(evalResult.needsObservation),
    suggestedLessonsJson: JSON.stringify(suggestedLessons),
    parentReviewRequired,
    now,
    completedAt: status === "completed" || status === "reviewed" ? now : null,
  });

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: `baseline.${status}`,
    subject: id,
    detail: JSON.stringify({ subjectId, needsObservationCount: evalResult.needsObservation.length }),
    now,
  });

  return ok<EvaluateBaselineResponse>({
    assessment: {
      id,
      learnerId: learner.id,
      subjectId,
      sessionId: body.sessionId ?? existingForSubj?.session_id ?? null,
      status,
      observedSummaryVi: evalResult.observedSummaryVi,
      supportedSummaryVi: evalResult.supportedSummaryVi,
      needsObservation: evalResult.needsObservation,
      suggestedLessons,
      parentReviewRequired,
      createdAt: existingForSubj?.created_at ?? now,
      completedAt: status === "completed" || status === "reviewed" ? now : null,
    },
  });
};

/* ── GET /api/parent/planner ──────────────────────────────────────────────── */

export const getFourWeekPlan: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  const schoolYearLabel = "2026-2027";
  if (!learner) {
    return ok<PlannerGetResponse>({
      learnerId: null,
      schoolYearLabel,
      items: [],
      summary: {
        todayCount: 0,
        upcomingCount: 0,
        reviewDueCount: 0,
        completedCount: 0,
        needsParentReviewCount: 0,
      },
    });
  }

  const [items, skills, lessons, reviewRows, baselines] = await Promise.all([
    repo.listLearningPlanItemsForLearner(context.env.DB, learner.id),
    repo.listSkills(context.env.DB),
    repo.listLessons(context.env.DB),
    repo.listReviewScheduleForLearner(context.env.DB, learner.id),
    repo.listBaselineAssessmentsForLearner(context.env.DB, learner.id),
  ]);

  const skillById = new Map(skills.map((s) => [s.id, s]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const now = Date.now();
  const reviewDueCount = reviewRows.filter((r) => r.due_at <= now).length;
  const needsParentReviewCount = baselines.filter((b) => b.parent_review_required === 1).length;

  const dtos = items.map((item) => ({
    id: item.id,
    learnerId: item.learner_id,
    schoolYearLabel: item.school_year_label,
    weekIndex: item.week_index,
    dayOfWeek: item.day_of_week,
    scheduledDate: item.scheduled_date,
    subjectId: item.subject_id,
    skillId: item.skill_id,
    skillNameVi: item.skill_id ? (skillById.get(item.skill_id)?.name_vi ?? null) : null,
    lessonId: item.lesson_id,
    lessonTitleVi: item.lesson_id ? (lessonById.get(item.lesson_id)?.title_vi ?? null) : null,
    itemKind: item.item_kind,
    status: item.status,
    durationMinutes: item.duration_minutes,
    parentNote: item.parent_note,
    reasonVi: item.reason_vi,
    updatedAt: item.updated_at,
  }));

  const scheduled = dtos.filter((d) => d.status === "scheduled" || d.status === "rescheduled");
  const todayCount = scheduled.filter((d) => d.weekIndex === 1).slice(0, 1).length;
  const upcomingCount = Math.max(0, scheduled.length - todayCount);
  const completedCount = dtos.filter((d) => d.status === "completed").length;

  return ok<PlannerGetResponse>({
    learnerId: learner.id,
    schoolYearLabel: items[0]?.school_year_label ?? schoolYearLabel,
    items: dtos,
    summary: {
      todayCount,
      upcomingCount,
      reviewDueCount,
      completedCount,
      needsParentReviewCount,
    },
  });
};

/* ── POST /api/parent/planner/generate ────────────────────────────────────── */

export const generateFourWeekPlanRoute: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) {
    return badRequest("Vui lòng tạo hồ sơ người học trước khi lập kế hoạch 4 tuần.");
  }

  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as Partial<GeneratePlanRequest>;

  const [skills, prereqs, lessons, metaRows, evidenceRows, reviewRows, baselines, intakes] =
    await Promise.all([
      repo.listSkills(context.env.DB),
      repo.listSkillPrerequisites(context.env.DB),
      repo.listLessons(context.env.DB),
      repo.listLessonMetadata(context.env.DB),
      repo.listSkillEvidenceForLearner(context.env.DB, learner.id),
      repo.listReviewScheduleForLearner(context.env.DB, learner.id),
      repo.listBaselineAssessmentsForLearner(context.env.DB, learner.id),
      repo.listCurriculumIntakesForLearner(context.env.DB, learner.id),
    ]);

  const schoolYearLabel =
    typeof body.schoolYearLabel === "string" && body.schoolYearLabel.trim().length > 0
      ? body.schoolYearLabel.trim()
      : intakes[0]?.school_year_label ?? "2026-2027";
  const sessionsPerWeek =
    optionalIntIn(body.sessionsPerWeek ?? intakes[0]?.weekly_sessions ?? 3, 1, 7) ??
    DEFAULT_PLANNER_CONFIG.sessionsPerWeek;
  const sessionDurationMinutes =
    optionalIntIn(body.sessionDurationMinutes ?? intakes[0]?.session_duration_minutes ?? 20, 10, 60) ??
    DEFAULT_PLANNER_CONFIG.sessionDurationMinutes;

  const evidenceBySkill = new Map(evidenceRows.map((e) => [e.skill_id, e]));
  const metaByLesson = new Map(metaRows.map((m) => [m.lesson_id, m]));
  const now = Date.now();
  const dueSkillIds = new Set(reviewRows.filter((r) => r.due_at <= now).map((r) => r.skill_id));
  const baselineNeedsObs = new Set<string>();
  for (const b of baselines) {
    for (const s of parseStringArray(b.needs_observation_json)) {
      baselineNeedsObs.add(s);
    }
  }

  const candidates: SkillCandidate[] = skills.map((skill) => {
    const ev = evidenceBySkill.get(skill.id);
    const skillPrereqs = prereqs
      .filter((p) => p.skill_id === skill.id)
      .map((p) => p.prerequisite_id);
    const matchingLesson =
      lessons.find((l) => l.skill_id === skill.id && !l.id.includes("baseline")) ??
      lessons.find((l) => l.skill_id === skill.id) ??
      null;
    const meta = matchingLesson ? metaByLesson.get(matchingLesson.id) : null;

    return {
      id: skill.id,
      subjectId: skill.subject_id,
      code: skill.code,
      nameVi: skill.name_vi,
      competencyState: ev?.state ?? "NOT_OBSERVED",
      prerequisiteSkillIds: skillPrereqs,
      dueForReview: dueSkillIds.has(skill.id),
      needsObservation: baselineNeedsObs.has(skill.id) || !ev || ev.state === "NOT_OBSERVED",
      suggestedLessonId: matchingLesson?.id ?? null,
      lessonTitleVi: matchingLesson?.title_vi ?? null,
      expectedDurationMinutes: meta?.expected_duration_minutes ?? sessionDurationMinutes,
      provenance: meta?.provenance ?? "gdpt_2018_objective",
    };
  });

  const generatedSlots = generateFourWeekPlan(candidates, {
    sessionsPerWeek,
    sessionDurationMinutes,
    totalWeeks: 4,
  });

  await repo.deleteScheduledPlanItemsForLearner(context.env.DB, learner.id, schoolYearLabel);

  for (const slot of generatedSlots) {
    await repo.insertPlanItem(context.env.DB, {
      item: {
        id: crypto.randomUUID(),
        learner_id: learner.id,
        school_year_label: schoolYearLabel,
        week_index: slot.weekIndex,
        day_of_week: slot.dayOfWeek,
        scheduled_date: null,
        subject_id: slot.subjectId,
        skill_id: slot.skillId,
        lesson_id: slot.lessonId,
        item_kind: slot.itemKind,
        status: "scheduled",
        duration_minutes: slot.durationMinutes,
        parent_note: null,
        reason_vi: slot.reasonVi,
        created_at: now,
        updated_at: now,
      },
    });
  }

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "planner.generated",
    subject: learner.id,
    detail: JSON.stringify({
      schoolYearLabel,
      sessionsPerWeek,
      sessionDurationMinutes,
      slotCount: generatedSlots.length,
    }),
    now,
  });

  return getFourWeekPlan(context);
};

/* ── PATCH /api/parent/planner/item ───────────────────────────────────────── */

export const updatePlanItemRoute: Handler = async (context) => {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) return badRequest("Chưa có hồ sơ người học.");

  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as Partial<UpdatePlanItemRequest>;

  if (typeof body.itemId !== "string" || body.itemId.length === 0) {
    return badRequest("Thiếu mã mục kế hoạch.");
  }
  const validStatuses = ["scheduled", "completed", "skipped", "rescheduled"] as const;
  if (!body.status || !validStatuses.includes(body.status)) {
    return badRequest("Trạng thái mục kế hoạch không hợp lệ.");
  }

  const items = await repo.listLearningPlanItemsForLearner(context.env.DB, learner.id);
  const current = items.find((i) => i.id === body.itemId);
  if (!current) return notFound("Không tìm thấy mục kế hoạch.");

  const now = Date.now();
  await repo.updateLearningPlanItem(context.env.DB, {
    id: current.id,
    learnerId: learner.id,
    status: body.status,
    weekIndex: optionalIntIn(body.weekIndex, 1, 4) ?? current.week_index,
    dayOfWeek: optionalIntIn(body.dayOfWeek, 1, 7) ?? current.day_of_week,
    scheduledDate:
      body.scheduledDate !== undefined ? body.scheduledDate : current.scheduled_date,
    parentNote:
      typeof body.parentNote === "string"
        ? body.parentNote.slice(0, 500)
        : body.parentNote === null
          ? null
          : current.parent_note,
    now,
  });

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: `planner.item_${body.status}`,
    subject: current.id,
    detail: JSON.stringify({ weekIndex: body.weekIndex, dayOfWeek: body.dayOfWeek }),
    now,
  });

  return getFourWeekPlan(context);
};

function parseStringArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/* ── helpers ──────────────────────────────────────────────────────────────── */

type StepDraft = UpdateContentRequest["steps"] extends infer T
  ? T extends readonly (infer U)[] ? U : never
  : never;

function validateStepSet(
  steps: readonly StepDraft[] | undefined,
): { ok: true } | { ok: false; error: string } {
  if (steps === undefined) return { ok: true };
  if (!Array.isArray(steps) || steps.length === 0) {
    return { ok: false, error: "Bài học cần ít nhất một bước học." };
  }
  const positions = new Set<number>();
  const kinds = new Set<string>();
  for (const step of steps) {
    if (!Number.isInteger(step.position) || step.position < 1 || step.position > 100) {
      return { ok: false, error: "Thứ tự bước học không hợp lệ." };
    }
    if (positions.has(step.position)) {
      return { ok: false, error: `Trùng thứ tự bước học: ${step.position}` };
    }
    positions.add(step.position);
    if (!LESSON_STEP_KINDS.includes(step.kind as LessonStepKind)) {
      return { ok: false, error: `Loại bước học không hợp lệ: ${step.kind}` };
    }
    kinds.add(step.kind);
    // Positions must be contiguous from 1: a gap means a step was silently lost.
    if (positions.size !== step.position) {
      return { ok: false, error: "Thứ tự bước học phải liên tiếp từ 1." };
    }
    const result = validateExercise(step.content);
    if (!result.ok) {
      return { ok: false, error: `Nội dung bước ${step.position} không hợp lệ: ${result.error}` };
    }
    if (typeof step.explanationVi !== "string" || step.explanationVi.trim().length === 0) {
      return { ok: false, error: `Bước ${step.position} cần có phần giải thích.` };
    }
  }
  // A pedagogy requirement, not a convenience: without a transfer step the skill
  // can never be evidenced as TRANSFERRED.
  if (!kinds.has("transfer")) {
    return { ok: false, error: "Bài học cần ít nhất một bước kiểm tra vận dụng." };
  }
  return { ok: true };
}

async function replaceSteps(
  context: HandlerContext,
  lessonId: string,
  steps: readonly StepDraft[],
): Promise<void> {
  const existing = await repo.listStepsForLesson(context.env.DB, lessonId);
  const nextVersion = (existing[0]?.content_version ?? 0) + 1;
  for (const step of steps) {
    // Already validated by `validateStepSet` before this runs.
    const content = step.content;
    await context.env.DB
      .prepare(
        `INSERT INTO lesson_steps
           (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(lesson_id, position) DO UPDATE SET
           kind = excluded.kind,
           content = excluded.content,
           answer_key = excluded.answer_key,
           explanation_vi = excluded.explanation_vi,
           content_version = excluded.content_version`,
      )
      .bind(
        crypto.randomUUID(),
        lessonId,
        step.position,
        step.kind,
        JSON.stringify(content),
        JSON.stringify(step.answerKey),
        step.explanationVi,
        nextVersion,
      )
      .run();
  }
}

async function bumpLesson(
  context: HandlerContext,
  lessonId: string,
  body: UpdateContentRequest,
  nextVersion: number,
  now: number,
): Promise<void> {
  const lesson = await repo.findLesson(context.env.DB, lessonId);
  if (!lesson) return;
  await context.env.DB
    .prepare(
      `UPDATE lessons
       SET title_vi = ?1, objective_vi = ?2, version = ?3, updated_at = ?4
       WHERE id = ?5`,
    )
    .bind(
      typeof body.titleVi === "string" ? body.titleVi : lesson.title_vi,
      typeof body.objectiveVi === "string" ? body.objectiveVi : lesson.objective_vi,
      nextVersion,
      now,
      lessonId,
    )
    .run();
}

function toEngineEvidence(
  attempts: readonly { id: string; outcome: string; help_level: number; evidence_kind: string; created_at: number }[],
  skillId: string,
): AttemptEvidence[] {
  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    skillId,
    outcome: attempt.outcome as AttemptEvidence["outcome"],
    helpLevel: attempt.help_level,
    evidenceKind: attempt.evidence_kind as AttemptEvidence["evidenceKind"],
    isTransfer: false,
    isReview: false,
    createdAt: attempt.created_at,
  }));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" && APPROVAL_STATUSES.includes(value as ApprovalStatus);
}

function isCompetencyState(value: unknown): value is CompetencyState {
  return typeof value === "string" && COMPETENCY_STATES.includes(value as CompetencyState);
}

/** An optional whole number within a range, or absent. */
function optionalIntIn(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

