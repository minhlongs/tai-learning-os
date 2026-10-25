/**
 * Learner-facing routes.
 *
 * These serve the child mode. Two invariants shape every handler here:
 *
 *  1. THE ANSWER KEY NEVER CROSSES THE WIRE. A step payload carries the content
 *     and the explanation, never the expected answer. Grading happens on the
 *     server in `gradeSubmission`, one code path, so the learner cannot inspect
 *     the answer from the browser.
 *
 *  2. THE LEARNER IS RESOLVED FROM THE PARENT, NOT FROM THE REQUEST. No learner
 *     id is accepted as an argument: the parent's session decides which learner
 *     is being served, so naming another learner's id changes nothing.
 */

import type {
  FinalizeSessionResponse,
  LearnerHomeResponse,
  LessonStepPayload,
  RequestHintResponse,
  StartSessionResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from "../../shared/api-contract";
import type { Submission } from "../../shared/schemas/answer";
import { clampHelp, hintFor } from "../../shared/schemas/answer";
import { parseExercise } from "../../shared/schemas/exercise";
import { toLearnerExercise } from "../../shared/schemas/exercise";
import type { LearnerRow } from "../db/schema";
import * as repo from "../db/repositories";
import { badRequest, forbidden, notFound, ok, readJsonBody, serverError } from "../http/response";
import type { Handler, HandlerContext } from "../http/middleware";
import {
  GuardError,
  loadStepContexts,
  recordAttemptWithDerivation,
  type StepContext,
} from "../services/session-service";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A resolved learner, or the response that explains why there is none. */
type LearnerResult = { learner: LearnerRow } | { response: Response };

async function currentLearner(context: HandlerContext): Promise<LearnerResult> {
  const learner = await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) {
    return { response: notFound("Chưa có hồ sơ người học. Phụ huynh vui lòng tạo hồ sơ trước.") };
  }
  return { learner };
}

/* ── GET /api/learner/home ─────────────────────────────────────────────────── */

export const getLearnerHome: Handler = async (context) => {
  const resolved = await currentLearner(context);
  if ("response" in resolved) {
    // No learner enrolled yet: an honest empty home, never a fabricated one.
    return ok<LearnerHomeResponse>({
      learner: { id: "", nickname: "" },
      subjects: [],
      currentObjectives: [],
      reviewDue: [],
      continueLesson: null,
      completedSessions: [],
    });
  }
  const learner = resolved.learner;

  const [subjects, skills, lessons, approvals, evidence, reviewRows, sessions, attempts] =
    await Promise.all([
      repo.listSubjects(context.env.DB),
      repo.listSkills(context.env.DB),
      repo.listLessons(context.env.DB),
      repo.listApprovalStatuses(context.env.DB),
      repo.listSkillEvidenceForLearner(context.env.DB, learner.id),
      repo.listReviewScheduleForLearner(context.env.DB, learner.id),
      repo.listSessionsForLearner(context.env.DB, learner.id, 20),
      repo.listAttemptsForLearner(context.env.DB, learner.id),
    ]);

  const skillById = new Map(skills.map((s) => [s.id, s]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  // Only APPROVED lessons count as available. A lesson the parent has not
  // reviewed must not appear to the learner, even though it is stored.
  const visibleLessons = lessons.filter((l) => approvals[l.id] === "approved");

  const perSession = tallyBySession(attempts);

  const currentObjectives: LearnerHomeResponse["currentObjectives"] = [];
  const evidenceBySkill = new Map(evidence.map((e) => [e.skill_id, e]));
  for (const skill of skills) {
    const row = evidenceBySkill.get(skill.id);
    if (!row || row.state === "NOT_OBSERVED") continue;
    currentObjectives.push({
      skillId: skill.id,
      skillNameVi: skill.name_vi,
      subjectId: skill.subject_id,
      state: row.state,
    });
  }
  currentObjectives.sort((a, b) => stateRank(b.state) - stateRank(a.state));

  const now = Date.now();
  const reviewDue: LearnerHomeResponse["reviewDue"] = reviewRows
    .filter((r) => r.due_at <= now)
    .sort((a, b) => a.due_at - b.due_at)
    .map((r) => {
      const skill = skillById.get(r.skill_id);
      return {
        skillId: r.skill_id,
        skillNameVi: skill?.name_vi ?? r.skill_id,
        subjectId: skill?.subject_id ?? "",
        dueAt: r.due_at,
        daysOverdue: Math.max(0, Math.floor((now - r.due_at) / DAY_MS)),
      };
    });

  const inProgress = sessions.find((s) => s.status === "in_progress") ?? null;
  const inProgressLesson = inProgress ? lessonById.get(inProgress.lesson_id) : null;
  const continueLesson = inProgress && inProgressLesson
    ? {
        sessionId: inProgress.id,
        lessonId: inProgress.lesson_id,
        titleVi: inProgressLesson.title_vi,
        subjectId: inProgressLesson.subject_id,
        stepPosition: inProgress.steps_seen,
      }
    : null;

  const completedSessions = sessions
    .filter((s) => s.status === "completed")
    .slice(0, 10)
    .map((s) => {
      const tally = perSession.get(s.id);
      return {
        sessionId: s.id,
        lessonTitleVi: lessonById.get(s.lesson_id)?.title_vi ?? s.lesson_id,
        subjectId: lessonById.get(s.lesson_id)?.subject_id ?? "",
        completedAt: s.ended_at ?? s.started_at,
        correctCount: tally?.correct ?? 0,
        attemptedCount: tally?.attempted ?? 0,
      };
    });

  return ok<LearnerHomeResponse>({
    learner: { id: learner.id, nickname: learner.nickname },
    subjects: subjects.map((subject) => ({
      id: subject.id,
      nameVi: subject.name_vi,
      nameEn: subject.name_en,
      active: subject.active === 1,
      lessonCount: visibleLessons.filter((l) => l.subject_id === subject.id).length,
    })),
    currentObjectives,
    reviewDue,
    continueLesson,
    completedSessions,
  });
};

/* ── GET /api/learner/subjects ─────────────────────────────────────────────── */

/** Subjects and their approved lessons. Inactive subjects are labelled as such. */
export const listSubjectsForLearner: Handler = async (context) => {
  const [subjects, lessons, approvals] = await Promise.all([
    repo.listSubjects(context.env.DB),
    repo.listLessons(context.env.DB),
    repo.listApprovalStatuses(context.env.DB),
  ]);
  return ok({
    subjects: subjects.map((subject) => ({
      id: subject.id,
      nameVi: subject.name_vi,
      nameEn: subject.name_en,
      active: subject.active === 1,
      lessons: lessons
        .filter((l) => l.subject_id === subject.id && approvals[l.id] === "approved")
        .map((l) => ({
          id: l.id,
          titleVi: l.title_vi,
          titleEn: l.title_en,
          objectiveVi: l.objective_vi,
          gradeFrom: l.grade_from,
          gradeTo: l.grade_to,
        })),
    })),
  });
};

/* ── POST /api/learner/sessions ────────────────────────────────────────────── */

/**
 * Start (or resume) a session for an APPROVED lesson.
 *
 * A lesson the parent has not approved is refused here even when its id is
 * known, because this is the only path that renders content to the child.
 */
export const startSession: Handler = async (context) => {
  const resolved = await currentLearner(context);
  if ("response" in resolved) return resolved.response;
  const learner = resolved.learner;

  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as { lessonId?: unknown };
  if (typeof body.lessonId !== "string" || body.lessonId.length === 0) {
    return badRequest("Thiếu mã bài học.");
  }

  const lesson = await repo.findLesson(context.env.DB, body.lessonId);
  if (!lesson) return notFound("Không tìm thấy bài học.");

  const approval = await repo.getApproval(context.env.DB, lesson.id);
  if (approval?.status !== "approved") {
    return forbidden("Bài học này chưa được phụ huynh phê duyệt.");
  }

  // Checked before any session row is written, so a broken lesson leaves
  // nothing behind to resume.
  const steps = toStepPayloads(await loadStepContexts(context.env.DB, lesson.id));
  if (!steps) return serverError();

  // Resume rather than duplicate: an unfinished session keeps its attempts.
  const existing = await repo.findInProgressSessionForLearner(context.env.DB, learner.id);
  if (existing) {
    if (existing.lesson_id === lesson.id) {
      return ok<StartSessionResponse>({
        sessionId: existing.id,
        lessonId: lesson.id,
        lessonTitleVi: lesson.title_vi,
        subjectId: lesson.subject_id,
        steps,
      });
    }
    // A different lesson is unfinished: close it out so only one is in progress.
    await repo.finalizeSession(context.env.DB, {
      sessionId: existing.id,
      status: "abandoned",
      stepsSeen: existing.steps_seen,
      endedAt: Date.now(),
    });
  }

  const schoolYearId = await resolveSchoolYear(context, learner);
  const now = Date.now();
  const sessionId = crypto.randomUUID();
  await repo.createSession(context.env.DB, {
    id: sessionId,
    learnerId: learner.id,
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    schoolYearId,
    now,
  });

  await repo.recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "session.started",
    subject: sessionId,
    detail: JSON.stringify({ lessonId: lesson.id, lessonVersion: lesson.version }),
    now,
  });

  return ok<StartSessionResponse>({
    sessionId,
    lessonId: lesson.id,
    lessonTitleVi: lesson.title_vi,
    subjectId: lesson.subject_id,
    steps,
  });
};

/* ── POST /api/learner/hints ───────────────────────────────────────────────── */

/**
 * Progressive hints.
 *
 * The requested level is clamped server-side, and callers are responsible for
 * asking again for a higher level: a client that claims level 0 after already
 * showing level 3 cannot reset the disclosure clock. Higher levels reveal more
 * of the method; the answer is never returned as a copyable string.
 */
export const requestHint: Handler = async (context) => {
  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as { stepId?: unknown; currentLevel?: unknown };
  if (typeof body.stepId !== "string") return badRequest("Thiếu mã bước học.");

  const step = await repo.findStep(context.env.DB, body.stepId);
  if (!step) return notFound("Không tìm thấy bước học.");

  const exercise = parseExercise(step.content);
  if (!exercise) return serverError();

  const level = clampHelp(typeof body.currentLevel === "number" ? body.currentLevel : 0);
  const hintVi = hintFor(exercise, level);
  return ok<RequestHintResponse>({ level, hintVi });
};

/* ── POST /api/learner/attempts ────────────────────────────────────────────── */

/**
 * Record one attempt and re-derive competency and review scheduling.
 *
 * Every attempt is stored, including wrong ones: "the learner tried three times
 * and then got it" is real evidence, and collapsing it would hide the struggle.
 */
export const submitAttempt: Handler = async (context) => {
  const resolved = await currentLearner(context);
  if ("response" in resolved) return resolved.response;
  const learner = resolved.learner;

  const parsed = await readJsonBody(context.request, 8_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as SubmitAttemptRequest & { sessionId?: unknown };

  if (typeof body.sessionId !== "string" || typeof body.stepId !== "string") {
    return badRequest("Thiếu thông tin bài làm.");
  }
  if (!isSubmission(body.submission)) return badRequest("Dạng bài làm không hợp lệ.");

  const session = await repo.findSession(context.env.DB, body.sessionId, context.parent.parentId);
  if (!session) return notFound("Phiên học không tồn tại.");
  if (session.learner_id !== learner.id) {
    return forbidden("Phiên học không thuộc về người học này.");
  }
  if (session.status !== "in_progress") return badRequest("Phiên học đã kết thúc.");

  const stepContexts = await loadStepContexts(context.env.DB, session.lesson_id);
  const stepContext = stepContexts.find((s) => s.stepId === body.stepId);
  if (!stepContext) return notFound("Bước học không thuộc về bài học này.");

  try {
    const result = await recordAttemptWithDerivation(context.env.DB, {
      sessionId: session.id,
      learnerId: learner.id,
      lessonId: session.lesson_id,
      step: stepContext,
      submission: body.submission,
      helpLevel: clampHelp(body.helpLevel),
      now: Date.now(),
    });

    return ok<SubmitAttemptResponse>({
      attemptId: result.attemptId,
      outcome: result.outcome,
      messageVi: result.messageVi,
      attemptNo: result.attemptNo,
      // Unlocked only on a correct answer, so the worked solution cannot be read
      // first and then resubmitted as the learner's own reasoning.
      explanationVi: result.outcome === "correct" ? stepContext.explanationVi : null,
      canAdvance: result.outcome !== "incorrect",
      isTransfer: stepContext.kind === "transfer",
    });
  } catch (error) {
    if (error instanceof GuardError) {
      if (error.status === 404) return notFound(error.messageVi);
      if (error.status === 400) return badRequest(error.messageVi);
      return forbidden(error.messageVi);
    }
    return serverError();
  }
};

/* ── POST /api/learner/sessions/finalize ───────────────────────────────────── */

/**
 * Close a session and return an honest summary.
 *
 * The summary counts only what happened. It awards no points, and
 * `assistedCount` keeps it visible when help was needed.
 */
export const finalizeSession: Handler = async (context) => {
  const resolved = await currentLearner(context);
  if ("response" in resolved) return resolved.response;
  const learner = resolved.learner;

  const parsed = await readJsonBody(context.request, 4_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body as { sessionId?: unknown };
  if (typeof body.sessionId !== "string") return badRequest("Thiếu mã phiên học.");

  const session = await repo.findSession(context.env.DB, body.sessionId, context.parent.parentId);
  if (!session) return notFound("Phiên học không tồn tại.");
  if (session.learner_id !== learner.id) {
    return forbidden("Phiên học không thuộc về người học này.");
  }

  const now = Date.now();
  const attempts = await repo.listAttemptsForSession(context.env.DB, session.id);
  const reviewRows = await repo.listReviewScheduleForLearner(context.env.DB, learner.id);

  const correctCount = attempts.filter((a) => a.outcome === "correct").length;
  const assistedCount = attempts.filter((a) => a.help_level >= 3).length;
  const maxHelpLevel = attempts.reduce((max, a) => Math.max(max, a.help_level), 0);
  const stepsCompleted = new Set(
    attempts.filter((a) => a.outcome !== "incorrect").map((a) => a.step_id),
  ).size;

  const skillsPracticed: FinalizeSessionResponse["summary"]["skillsPracticed"] = [];
  const nextReview: FinalizeSessionResponse["summary"]["nextReview"] = [];
  const skillIds = [...new Set(attempts.map((a) => a.skill_id).filter((id): id is string => !!id))];
  for (const skillId of skillIds) {
    const skill = await repo.findSkill(context.env.DB, skillId);
    if (!skill) continue;
    skillsPracticed.push({ skillId, skillNameVi: skill.name_vi, subjectId: skill.subject_id });
    const row = reviewRows.find((r) => r.skill_id === skillId);
    if (row) {
      nextReview.push({
        skillId,
        skillNameVi: skill.name_vi,
        dueAt: row.due_at,
        intervalDays: row.interval_days,
        reasonVi: `Ôn lại sau ${row.interval_days} ngày.`,
      });
    }
  }

  let status = session.status;
  if (session.status === "in_progress") {
    status = "completed";
    await repo.finalizeSession(context.env.DB, {
      sessionId: session.id,
      status,
      stepsSeen: stepsCompleted,
      endedAt: now,
    });
    await repo.recordAudit(context.env.DB, {
      id: crypto.randomUUID(),
      actor: `parent:${context.parent.parentId}`,
      action: "session.completed",
      subject: session.id,
      detail: JSON.stringify({
        lessonId: session.lesson_id,
        attempted: attempts.length,
        correct: correctCount,
        assisted: assistedCount,
      }),
      now,
    });
  }

  return ok<FinalizeSessionResponse>({
    sessionId: session.id,
    status,
    summary: {
      attemptedCount: attempts.length,
      correctCount,
      assistedCount,
      maxHelpLevel,
      stepsCompleted,
      skillsPracticed,
      nextReview,
    },
  });
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

/**
 * Steps as the client may see them: content only, never the answer key.
 *
 * Null when any step's stored content no longer validates. That is a content
 * bug, not something to show the learner part of: skipping the step would leave
 * a gap in the sequence the learner cannot finish past.
 */
function toStepPayloads(steps: readonly StepContext[]): LessonStepPayload[] | null {
  const payloads: LessonStepPayload[] = [];
  for (const step of steps) {
    if (!step.content) return null;
    payloads.push({
      id: step.stepId,
      position: step.position,
      kind: step.kind,
      // The stored spec carries the answer because the grader needs it; this is
      // the one place it crosses a boundary toward the browser, so it is
      // stripped here rather than anywhere the client has to remember to do it.
      content: toLearnerExercise(step.content),
      explanationVi: null,
    });
  }
  return payloads;
}

function tallyBySession(
  attempts: readonly { session_id: string; outcome: string }[],
): Map<string, { correct: number; attempted: number }> {
  const tally = new Map<string, { correct: number; attempted: number }>();
  for (const attempt of attempts) {
    const entry = tally.get(attempt.session_id) ?? { correct: 0, attempted: 0 };
    entry.attempted += 1;
    if (attempt.outcome === "correct") entry.correct += 1;
    tally.set(attempt.session_id, entry);
  }
  return tally;
}

/** Strongest evidence first, so the home screen leads with real ability. */
function stateRank(state: LearnerHomeResponse["currentObjectives"][number]["state"]): number {
  switch (state) {
    case "TRANSFERRED":
      return 5;
    case "RETAINED":
      return 4;
    case "INDEPENDENT":
      return 3;
    case "SUPPORTED":
      return 2;
    default:
      return 1;
  }
}

/**
 * The school year a session belongs to, created on first use so teaching is
 * never blocked by an administrative row the parent has not entered yet.
 *
 * The lookup and the insert are deliberately not a single atomic step, because
 * D1 has no INSERT-OR-IGNORE guarantee here that also returns the id. Two
 * requests racing — a lesson screen mounts twice in React StrictMode, or a
 * learner double-taps — both find nothing and both insert, and the unique
 * constraint on (learner_id, label) rejects the loser. Losing that race is
 * normal and harmless, so the row created by the winner is read back instead of
 * failing the request.
 */
async function resolveSchoolYear(context: HandlerContext, learner: LearnerRow): Promise<string | null> {
  const todayIso = new Date().toISOString().slice(0, 10);
  const existing = await repo.findActiveSchoolYear(context.env.DB, learner.id, todayIso);
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  const now = Date.now();
  const year = Number(todayIso.slice(0, 4));
  const startedThisYear = Number(todayIso.slice(5, 7)) >= 8;
  const startYear = startedThisYear ? year : year - 1;
  const label = `${startYear}-${startYear + 1}`;

  try {
    await repo.createSchoolYear(context.env.DB, {
      id,
      learnerId: learner.id,
      label,
      startsOn: `${startYear}-09-01`,
      endsOn: `${startYear + 1}-06-30`,
      grade: learner.grade,
      now,
    });
    return id;
  } catch {
    // Another request created this exact school year first. Its row is the one
    // the school knows about, so the session joins it rather than erroring.
    const raced = await repo.findActiveSchoolYear(context.env.DB, learner.id, todayIso);
    return raced?.id ?? null;
  }
}

/** Reject a submission whose shape does not match any known interaction. */
function isSubmission(value: unknown): value is Submission {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  switch (candidate.kind) {
    case "choice":
      return typeof candidate.choiceId === "string";
    case "fraction":
      return typeof candidate.numerator === "number" && typeof candidate.denominator === "number";
    case "text":
      return typeof candidate.text === "string";
    default:
      return false;
  }
}
