/**
 * Organization and B2B2C routes: Center management, Classrooms, and Teacher assignments.
 *
 * Invariants enforced:
 *  1. Roles: owner, admin, teacher. Only owner/admin can add members, create classrooms, assign teachers.
 *  2. Least-privilege teacher scoping: Teachers only view enrolled learners in their assigned classrooms.
 *  3. Explicit parent consent is mandatory for any staff (owner, admin, or teacher) to access learner data.
 */

import type {
  AddOrganizationMemberRequest,
  AddOrganizationMemberResponse,
  AssignClassroomTeacherRequest,
  AssignClassroomTeacherResponse,
  ClassroomLearnersResponse,
  ClassroomListResponse,
  CreateClassroomRequest,
  CreateClassroomResponse,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  EnrollLearnerRequest,
  EnrollLearnerResponse,
  OrganizationMemberListResponse,
} from "../../shared/api-contract";
import * as repo from "../db/repositories";
import { badRequest, conflict, forbidden, notFound, ok, readJsonBody } from "../http/response";
import type { Handler } from "../http/middleware";

/* ── POST /api/org/create ─────────────────────────────────────────────────── */

export const createOrganizationRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<CreateOrganizationRequest>;
  if (!body.slug || typeof body.slug !== "string" || !body.name || typeof body.name !== "string") {
    return badRequest("Thiếu hoặc sai thông tin tổ chức (slug và tên tổ chức là bắt buộc).");
  }

  const slug = body.slug.trim().toLowerCase();
  const name = body.name.trim();

  const existing = await repo.findOrganizationBySlug(context.env.DB, slug);
  if (existing) {
    return conflict("Mã định danh (slug) tổ chức này đã tồn tại.");
  }

  const orgId = crypto.randomUUID();
  const now = Date.now();

  await repo.createOrganization(context.env.DB, {
    id: orgId,
    slug,
    name,
    now,
  });

  // Creator automatically becomes the owner
  await repo.addOrganizationMember(context.env.DB, {
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: context.parent.parentId,
    role: "owner",
    now,
  });

  return ok<CreateOrganizationResponse>({
    organization: {
      id: orgId,
      slug,
      name,
      createdAt: now,
    },
  });
};

/* ── POST /api/org/members ────────────────────────────────────────────────── */

export const addOrganizationMemberRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<AddOrganizationMemberRequest>;
  if (!body.organizationId || !body.userId || !body.role) {
    return badRequest("Thiếu thông tin thành viên (organizationId, userId, role).");
  }

  if (body.role !== "owner" && body.role !== "admin" && body.role !== "teacher") {
    return badRequest("Vai trò không hợp lệ (phải là owner, admin hoặc teacher).");
  }

  // Authorization check: requester must be owner or admin of the organization
  const requesterRole = await repo.findMemberRole(context.env.DB, body.organizationId, context.parent.parentId);
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    return forbidden("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền thêm/quản lý thành viên.");
  }

  const now = Date.now();
  await repo.addOrganizationMember(context.env.DB, {
    id: crypto.randomUUID(),
    organizationId: body.organizationId,
    userId: body.userId,
    role: body.role,
    now,
  });

  return ok<AddOrganizationMemberResponse>({ success: true });
};

/* ── GET /api/org/members ─────────────────────────────────────────────────── */

export const listOrganizationMembersRoute: Handler = async (context) => {
  const orgId = context.url.searchParams.get("organizationId");
  if (!orgId) {
    return badRequest("Thiếu tham số organizationId.");
  }

  const requesterRole = await repo.findMemberRole(context.env.DB, orgId, context.parent.parentId);
  if (!requesterRole) {
    return forbidden("Bạn không phải thành viên của tổ chức này.");
  }

  const members = await repo.listOrganizationMembers(context.env.DB, orgId);
  return ok<OrganizationMemberListResponse>({
    members: members.map((m) => ({
      id: m.id,
      userId: m.user_id,
      displayName: m.displayName,
      role: m.role,
      createdAt: m.created_at,
    })),
  });
};

/* ── POST /api/org/classrooms ─────────────────────────────────────────────── */

export const createClassroomRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<CreateClassroomRequest>;
  if (!body.organizationId || !body.name) {
    return badRequest("Thiếu thông tin lớp học (organizationId và tên lớp học là bắt buộc).");
  }

  const requesterRole = await repo.findMemberRole(context.env.DB, body.organizationId, context.parent.parentId);
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    return forbidden("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền tạo lớp học.");
  }

  const classroomId = crypto.randomUUID();
  const now = Date.now();

  await repo.createClassroom(context.env.DB, {
    id: classroomId,
    organizationId: body.organizationId,
    name: body.name.trim(),
    grade: body.grade ?? null,
    subjectId: body.subjectId ?? null,
    now,
  });

  return ok<CreateClassroomResponse>({
    classroom: {
      id: classroomId,
      organizationId: body.organizationId,
      name: body.name.trim(),
      grade: body.grade ?? null,
      subjectId: body.subjectId ?? null,
      createdAt: now,
    },
  });
};

/* ── GET /api/org/classrooms ─────────────────────────────────────────────── */

export const listClassroomsRoute: Handler = async (context) => {
  const orgId = context.url.searchParams.get("organizationId");
  if (!orgId) {
    return badRequest("Thiếu tham số organizationId.");
  }

  const requesterRole = await repo.findMemberRole(context.env.DB, orgId, context.parent.parentId);
  if (!requesterRole) {
    return forbidden("Bạn không phải thành viên của tổ chức này.");
  }

  const classrooms = await repo.listClassroomsForOrganization(context.env.DB, orgId);
  return ok<ClassroomListResponse>({
    classrooms: classrooms.map((c) => ({
      id: c.id,
      organizationId: c.organization_id,
      name: c.name,
      grade: c.grade,
      subjectId: c.subject_id,
      createdAt: c.created_at,
    })),
  });
};

/* ── POST /api/org/classrooms/teachers ────────────────────────────────────── */

export const assignClassroomTeacherRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<AssignClassroomTeacherRequest>;
  if (!body.classroomId || !body.teacherId) {
    return badRequest("Thiếu thông tin phân công (classroomId, teacherId).");
  }

  // Look up classroom to get organization
  const classroom = await context.env.DB
    .prepare("SELECT organization_id FROM classrooms WHERE id = ?1")
    .bind(body.classroomId)
    .first<{ organization_id: string }>();

  if (!classroom) {
    return notFound("Không tìm thấy lớp học.");
  }

  const requesterRole = await repo.findMemberRole(context.env.DB, classroom.organization_id, context.parent.parentId);
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    return forbidden("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền phân công giáo viên.");
  }

  const now = Date.now();
  await repo.assignClassroomTeacher(context.env.DB, {
    classroomId: body.classroomId,
    teacherId: body.teacherId,
    now,
  });

  return ok<AssignClassroomTeacherResponse>({ success: true });
};

/* ── POST /api/org/classrooms/enroll ──────────────────────────────────────── */

export const enrollLearnerRoute: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<EnrollLearnerRequest>;
  if (!body.classroomId || !body.learnerId) {
    return badRequest("Thiếu thông tin ghi danh (classroomId, learnerId).");
  }

  // Look up classroom
  const classroom = await context.env.DB
    .prepare("SELECT organization_id FROM classrooms WHERE id = ?1")
    .bind(body.classroomId)
    .first<{ organization_id: string }>();

  if (!classroom) {
    return notFound("Không tìm thấy lớp học.");
  }

  const requesterRole = await repo.findMemberRole(context.env.DB, classroom.organization_id, context.parent.parentId);
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    return forbidden("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền xếp lớp.");
  }

  // Check consent: parent must have granted active consent to the organization
  const consent = await repo.findActiveConsent(context.env.DB, classroom.organization_id, body.learnerId);
  if (!consent) {
    return forbidden("Học sinh chưa có sự chấp thuận (consent) đang hiệu lực từ phụ huynh cho tổ chức này.");
  }

  const enrollmentId = crypto.randomUUID();
  const now = Date.now();

  await repo.enrollLearnerInClassroom(context.env.DB, {
    id: enrollmentId,
    classroomId: body.classroomId,
    learnerId: body.learnerId,
    now,
  });

  return ok<EnrollLearnerResponse>({
    success: true,
    enrollmentId,
  });
};

/* ── GET /api/org/classrooms/learners ─────────────────────────────────────── */

export const listClassroomLearnersRoute: Handler = async (context) => {
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
    return forbidden("Bạn không phải thành viên của tổ chức quản lý lớp học này.");
  }

  // If teacher, must be assigned to this classroom
  if (role === "teacher") {
    const isAssigned = await repo.isTeacherAssignedToClassroom(context.env.DB, classroomId, context.parent.parentId);
    if (!isAssigned) {
      return forbidden("Giáo viên chỉ có quyền xem học sinh trong lớp được phân công.");
    }
  }

  const learners = await repo.listEnrolledLearnersInClassroom(context.env.DB, classroomId);
  return ok<ClassroomLearnersResponse>({
    learners: learners.map((l) => ({
      id: l.id,
      nickname: l.nickname,
      grade: l.grade,
      enrolledAt: l.enrolledAt,
    })),
  });
};
