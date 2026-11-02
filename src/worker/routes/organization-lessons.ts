/**
 * Organization lesson authoring and classroom assignment routes.
 *
 * Implements the multi-stage pedagogy workflow:
 *   1. Teachers draft lessons (`review_status: 'draft'`).
 *   2. Teachers submit lessons for center review (`review_status: 'submitted'`).
 *   3. Center owners/admins approve or reject (`org_approved` / `org_rejected`).
 *   4. Approved lessons are assigned to classrooms (`classroom_lesson_assignments`).
 *   5. Parents view and approve center-assigned lessons before children can access them.
 */

import type {
  AssignClassroomLessonRequest,
  AssignClassroomLessonResponse,
  ClassroomLessonListResponse,
  CreateOrgLessonRequest,
  CreateOrgLessonResponse,
  OrganizationLessonListResponse,
  ReviewOrgLessonRequest,
  ReviewOrgLessonResponse,
  SubmitOrgLessonReviewRequest,
  SubmitOrgLessonReviewResponse,
} from "../../shared/api-contract";
import { validateExercise } from "../../shared/schemas/exercise";
import type { LessonRow } from "../db/schema";
import * as repo from "../db/repositories";
import { badRequest, forbidden, notFound, ok, readJsonBody } from "../http/response";
import type { Handler } from "../http/middleware";

/* ── GET /api/org/lessons ─────────────────────────────────────────────────── */

export const listOrganizationLessonsRoute: Handler = async (context) => {
  const orgId = context.url.searchParams.get("organizationId");
  if (!orgId) {
    return badRequest("Thiếu tham số organizationId.");
  }

  const role = await repo.findMemberRole(context.env.DB, orgId, context.parent.parentId);
  if (!role) {
    return forbidden("Bạn không phải thành viên của tổ chức này.");
  }

  const lessons = await repo.listOrganizationLessons(context.env.DB, orgId);
  return ok<OrganizationLessonListResponse>({ lessons });
};

/* ── POST /api/org/lessons/draft ──────────────────────────────────────────── */

export const createOrgDraftLessonRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<CreateOrgLessonRequest>;
  if (!body.organizationId || !body.subjectId || !body.titleVi || !body.objectiveVi || !body.steps) {
    return badRequest("Thiếu thông tin bài học (organizationId, subjectId, titleVi, objectiveVi, steps).");
  }

  // Must be member of the organization
  const role = await repo.findMemberRole(context.env.DB, body.organizationId, context.parent.parentId);
  if (!role) {
    return forbidden("Bạn không phải thành viên của tổ chức này.");
  }

  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    return badRequest("Bài học phải có ít nhất một bước học.");
  }

  // Validate all exercises in steps
  for (const step of body.steps) {
    const val = validateExercise(step.content);
    if (!val.ok) {
      return badRequest(`Nội dung bài tập bước ${step.position} không hợp lệ: ${val.error}`);
    }
  }

  const lessonId = crypto.randomUUID();
  const now = Date.now();

  const lessonRow: LessonRow = {
    id: lessonId,
    subject_id: body.subjectId,
    skill_id: body.skillId ?? null,
    title_vi: body.titleVi.trim(),
    title_en: body.titleEn?.trim() ?? body.titleVi.trim(),
    objective_vi: body.objectiveVi.trim(),
    objective_en: body.objectiveEn?.trim() ?? body.objectiveVi.trim(),
    grade_from: body.gradeFrom ?? 4,
    grade_to: body.gradeTo ?? 4,
    version: 1,
    ownership_type: "organization",
    owner_parent_id: null,
    purpose: "official",
    source_lesson_id: null,
    source_version: null,
    created_at: now,
    updated_at: now,
  };

  const stepRows = body.steps.map((s, idx) => ({
    id: crypto.randomUUID(),
    position: s.position ?? idx + 1,
    kind: s.kind,
    content: JSON.stringify(s.content),
    answerKey: JSON.stringify(s.answerKey),
    explanationVi: s.explanationVi,
  }));

  await repo.createOrganizationLesson(context.env.DB, {
    lesson: lessonRow,
    steps: stepRows,
    organizationId: body.organizationId,
    authorId: context.parent.parentId,
    now,
  });

  return ok<CreateOrgLessonResponse>({
    lessonId,
    organizationId: body.organizationId,
    reviewStatus: "draft",
  });
};

/* ── POST /api/org/lessons/submit ─────────────────────────────────────────── */

export const submitOrgLessonReviewRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<SubmitOrgLessonReviewRequest>;
  if (!body.lessonId || !body.organizationId) {
    return badRequest("Thiếu thông tin gửi duyệt (lessonId, organizationId).");
  }

  const orgLesson = await repo.findOrganizationLesson(context.env.DB, body.lessonId);
  if (!orgLesson || orgLesson.organization_id !== body.organizationId) {
    return notFound("Không tìm thấy bài học trong tổ chức này.");
  }

  // Only author, admin, or owner can submit
  const role = await repo.findMemberRole(context.env.DB, body.organizationId, context.parent.parentId);
  if (!role || (role === "teacher" && orgLesson.author_id !== context.parent.parentId)) {
    return forbidden("Bạn không có quyền gửi duyệt bài học này.");
  }

  if (orgLesson.review_status === "org_approved") {
    return badRequest("Bài học đã được trung tâm phê duyệt (org_approved), không thể gửi duyệt lại khi chưa cập nhật nội dung mới.");
  }

  const lesson = await repo.findLesson(context.env.DB, body.lessonId);
  if (!lesson) {
    return notFound("Không tìm thấy bài học.");
  }

  const now = Date.now();
  const submitted = await repo.submitOrganizationLessonForReview(context.env.DB, {
    lessonId: body.lessonId,
    organizationId: body.organizationId,
    expectedVersion: lesson.version,
    now,
  });
  if (!submitted) {
    return badRequest("Không thể gửi duyệt bài học do phiên bản hoặc trạng thái vừa thay đổi. Vui lòng tải lại.");
  }

  return ok<SubmitOrgLessonReviewResponse>({
    success: true,
    reviewStatus: "submitted",
  });
};

/* ── POST /api/org/lessons/review ─────────────────────────────────────────── */

export const reviewOrgLessonRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<ReviewOrgLessonRequest>;
  if (!body.lessonId || !body.organizationId || !body.decision) {
    return badRequest("Thiếu thông tin phê duyệt (lessonId, organizationId, decision).");
  }

  if (body.decision !== "org_approved" && body.decision !== "org_rejected") {
    return badRequest("Quyết định phê duyệt không hợp lệ.");
  }

  // Only owner or admin can review
  const role = await repo.findMemberRole(context.env.DB, body.organizationId, context.parent.parentId);
  if (role !== "owner" && role !== "admin") {
    return forbidden("Chỉ chủ sở hữu hoặc quản trị viên trung tâm mới có quyền duyệt bài học.");
  }

  const orgLesson = await repo.findOrganizationLesson(context.env.DB, body.lessonId);
  if (!orgLesson || orgLesson.organization_id !== body.organizationId) {
    return notFound("Không tìm thấy bài học trong tổ chức.");
  }

  const lesson = await repo.findLesson(context.env.DB, body.lessonId);
  if (!lesson) {
    return notFound("Không tìm thấy bài học.");
  }

  const now = Date.now();
  const statements: D1PreparedStatement[] = [
    repo.reviewOrganizationLessonStatement(context.env.DB, {
      lessonId: body.lessonId,
      organizationId: body.organizationId,
      expectedVersion: lesson.version,
      decision: body.decision,
      reviewedBy: context.parent.parentId,
      note: body.note?.trim() ?? null,
      now,
    }),
  ];

  if (body.decision === "org_rejected") {
    statements.push(
      repo.clampContinuationDeadlinesForLearnerLessonStatement(context.env.DB, {
        lessonId: body.lessonId,
        revokedAt: now,
      }),
    );
  }

  const batchResults = await context.env.DB.batch(statements);
  if (Number(batchResults[0]?.meta?.changes ?? 0) === 0) {
    return badRequest("Phiên bản bài học đã thay đổi trong lúc duyệt. Vui lòng tải lại trước khi phê duyệt.");
  }

  return ok<ReviewOrgLessonResponse>({
    success: true,
    reviewStatus: body.decision,
  });
};

/* ── POST /api/org/classrooms/assign-lesson ────────────────────────────────── */

export const assignClassroomLessonRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<AssignClassroomLessonRequest>;
  if (!body.classroomId || !body.lessonId) {
    return badRequest("Thiếu thông tin phân công bài học (classroomId, lessonId).");
  }

  // Look up classroom
  const classroom = await context.env.DB
    .prepare("SELECT organization_id FROM classrooms WHERE id = ?1")
    .bind(body.classroomId)
    .first<{ organization_id: string }>();

  if (!classroom) {
    return notFound("Không tìm thấy lớp học.");
  }

  // Requester must be staff (owner, admin, or assigned teacher)
  const role = await repo.findMemberRole(context.env.DB, classroom.organization_id, context.parent.parentId);
  if (!role) {
    return forbidden("Bạn không phải thành viên của tổ chức quản lý lớp học này.");
  }

  if (role === "teacher") {
    const isAssigned = await repo.isTeacherAssignedToClassroom(context.env.DB, body.classroomId, context.parent.parentId);
    if (!isAssigned) {
      return forbidden("Giáo viên chỉ có quyền giao bài cho lớp được phân công.");
    }
  }

  // Lesson must be approved by the organization before it can be assigned to a classroom
  const orgLesson = await repo.findOrganizationLesson(context.env.DB, body.lessonId);
  if (
    !orgLesson ||
    orgLesson.organization_id !== classroom.organization_id ||
    orgLesson.review_status !== "org_approved"
  ) {
    return forbidden("Bài học chưa được trung tâm phê duyệt (org_approved) hoặc không thuộc tổ chức này.");
  }

  const assignmentId = crypto.randomUUID();
  const now = Date.now();

  await repo.assignLessonToClassroom(context.env.DB, {
    id: assignmentId,
    classroomId: body.classroomId,
    lessonId: body.lessonId,
    assignedBy: context.parent.parentId,
    dueAt: body.dueAt ?? null,
    now,
  });

  return ok<AssignClassroomLessonResponse>({
    success: true,
    assignmentId,
  });
};

/* ── GET /api/org/classrooms/assigned-lessons ─────────────────────────────── */

export const listClassroomAssignedLessonsRoute: Handler = async (context) => {
  const classroomId = context.url.searchParams.get("classroomId");
  if (!classroomId) {
    return badRequest("Thiếu tham số classroomId.");
  }

  const classroom = await context.env.DB
    .prepare("SELECT organization_id FROM classrooms WHERE id = ?1")
    .bind(classroomId)
    .first<{ organization_id: string }>();

  if (!classroom) {
    return notFound("Không tìm thấy lớp học.");
  }

  const role = await repo.findMemberRole(context.env.DB, classroom.organization_id, context.parent.parentId);
  if (!role) {
    return forbidden("Bạn không phải thành viên của tổ chức.");
  }

  if (role === "teacher") {
    const isAssigned = await repo.isTeacherAssignedToClassroom(context.env.DB, classroomId, context.parent.parentId);
    if (!isAssigned) {
      return forbidden("Giáo viên chỉ có quyền xem bài học trong lớp được phân công.");
    }
  }

  const lessons = await repo.listClassroomAssignedLessons(context.env.DB, classroomId);
  return ok<ClassroomLessonListResponse>({
    lessons: lessons.map((l) => ({
      lessonId: l.lessonId,
      classroomId: l.classroomId,
      titleVi: l.titleVi,
      subjectId: l.subjectId,
      gradeFrom: l.gradeFrom,
      gradeTo: l.gradeTo,
      assignedAt: l.assignedAt,
      dueAt: l.dueAt,
      isParentApproved: false,
    })),
  });
};

/* ── GET /api/parent/classroom-lessons ────────────────────────────────────── */

export const listParentClassroomLessonsRoute: Handler = async (context) => {
  const candidate =
    context.url.searchParams.get("learnerId")?.trim() ||
    context.request.headers.get("x-tlo-learner-id")?.trim() ||
    "";
  const learner =
    candidate.length > 0
      ? await repo.findLearnerForParent(context.env.DB, candidate, context.parent.parentId)
      : await repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
  if (!learner) {
    return notFound("Không tìm thấy hồ sơ người học.");
  }

  // Find all classrooms where learner is enrolled and consent is active
  const enrollments = await context.env.DB
    .prepare(
      `SELECT ce.classroom_id
       FROM classroom_enrollments ce
       JOIN classrooms c ON c.id = ce.classroom_id
       JOIN learner_consents lc ON lc.learner_id = ce.learner_id AND lc.organization_id = c.organization_id AND lc.status = 'active'
       WHERE ce.learner_id = ?1 AND ce.status = 'enrolled'`,
    )
    .bind(learner.id)
    .all<{ classroom_id: string }>();

  const classroomIds = (enrollments.results ?? []).map((r) => r.classroom_id);
  if (classroomIds.length === 0) {
    return ok<ClassroomLessonListResponse>({ lessons: [] });
  }

  // Get all assigned lessons
  const lessons: ClassroomLessonListResponse["lessons"] = [];
  for (const cid of classroomIds) {
    const assigned = await repo.listClassroomAssignedLessons(context.env.DB, cid);
    for (const a of assigned) {
      if (a.orgReviewStatus !== "org_approved") continue;
      const lessonRow = await repo.findLesson(context.env.DB, a.lessonId);
      const approval = await repo.getApproval(context.env.DB, a.lessonId, {
        learnerId: learner.id,
        version: lessonRow?.version,
      });
      lessons.push({
        lessonId: a.lessonId,
        classroomId: a.classroomId,
        titleVi: a.titleVi,
        subjectId: a.subjectId,
        gradeFrom: a.gradeFrom,
        gradeTo: a.gradeTo,
        assignedAt: a.assignedAt,
        dueAt: a.dueAt,
        isParentApproved: approval?.status === "approved" && approval.decided_by === context.parent.parentId && approval.learner_id === learner.id,
      });
    }
  }

  return ok<ClassroomLessonListResponse>({ lessons });
};
