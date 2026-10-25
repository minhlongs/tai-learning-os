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
  LessonDetailResponse,
  LessonListResponse,
  ParentDashboardResponse,
  SetApprovalRequest,
  SetApprovalResponse,
  UpdateContentRequest,
  UpdateContentResponse,
} from "../../shared/api-contract";
import { APPROVAL_STATUSES, COMPETENCY_STATES, LESSON_STEP_KINDS } from "../../shared/schemas/attempt";
import type { ApprovalStatus, CompetencyState, LessonStepKind } from "../../shared/schemas/attempt";
import { validateExercise } from "../../shared/schemas/exercise";
import { describeState } from "../../shared/engine/competency";
import type { AttemptEvidence } from "../../shared/engine/competency";
import { needsParentAttention } from "../../shared/engine/review";
import * as repo from "../db/repositories";
import { badRequest, notFound, ok, readJsonBody, serverError } from "../http/response";
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
  const [approvals, steps] = await Promise.all([
    repo.listApprovalStatuses(context.env.DB),
    repo.findStepsForLessons(context.env.DB, lessons.map((l) => l.id)),
  ]);

  const stepCountByLesson = new Map<string, number>();
  for (const step of steps) {
    stepCountByLesson.set(step.lesson_id, (stepCountByLesson.get(step.lesson_id) ?? 0) + 1);
  }

  return ok<LessonListResponse>({
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      subjectId: lesson.subject_id,
      titleVi: lesson.title_vi,
      titleEn: lesson.title_en,
      objectiveVi: lesson.objective_vi,
      gradeFrom: lesson.grade_from,
      gradeTo: lesson.grade_to,
      version: lesson.version,
      approvalStatus: approvals[lesson.id] ?? "draft",
      stepCount: stepCountByLesson.get(lesson.id) ?? 0,
      // Content edits bump the version; an approval decided before the current
      // version is stale. Reported rather than hidden.
      pendingReapproval: false,
    })),
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

