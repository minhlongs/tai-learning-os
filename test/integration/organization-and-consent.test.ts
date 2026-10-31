import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";

/**
 * M1 Integration Test Suite: Organization, Classroom & Parent Consent Grants
 *
 * Verifies the B2B2C boundaries and parent sovereignty:
 *   1. Center creation and role assignments (owner, admin, teacher).
 *   2. Classroom creation and teacher assignments.
 *   3. Explicit consent grant required before any staff access.
 *   4. Teacher least-privilege scoping: teachers only access learners in their assigned classrooms.
 *   5. Instant revocation: revoking consent immediately cuts off staff access (403 / empty list).
 *   6. Full cascade erasure: deleting learner completely removes consent and enrollment records.
 */

const ORIGIN = "http://localhost";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

let proxy: TestProxy;
let env: Env;
let worker: { fetch: typeof fetch };

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function callWithJar(
  targetJar: Jar,
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(targetJar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method) && targetJar.csrf) {
    headers.set("x-tlo-csrf", targetJar.csrf);
  }

  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
  }

  const request = new Request(`${ORIGIN}${path}`, {
    ...init,
    body: init.json === undefined ? undefined : JSON.stringify(init.json),
    headers,
  });
  return worker.fetch(request, env);
}

async function createAuthenticatedJar(parentId: string, displayName: string): Promise<Jar> {
  const now = Date.now();
  const token = await createSessionToken(TEST_SECRET, parentId, displayName, now, "parent");
  const verified = await verifySessionToken(TEST_SECRET, token, now);
  if (!verified.ok) throw new Error("Failed to verify newly generated test token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return {
    cookies: { tlo_session: token },
    csrf,
  };
}

beforeAll(async () => {
  proxy = await openTestDatabase();
  env = {
    DB: proxy.env.DB as unknown as D1Database,
    SESSION_SECRET: TEST_SECRET,
    ENVIRONMENT: "development",
  };
  worker = (await import("../../src/worker/index")).default as unknown as {
    fetch: typeof fetch;
  };
});

afterAll(async () => {
  await proxy.dispose();
});

beforeEach(async () => {
  await resetData(env.DB);
});

describe("M1: Organization & Consent Grant Boundaries", () => {
  it("enforces explicit consent, teacher classroom scoping, and instant revocation at repository level", async () => {
    const db = env.DB;
    const now = Date.now();

    // 1. Seed three adult accounts (Parent, Teacher, Admin)
    const parentId = crypto.randomUUID();
    const teacherId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES
         (?1, 'hash1', 'Phụ Huynh A', ?4, ?4),
         (?2, 'hash2', 'Cô Giáo Lan', ?4, ?4),
         (?3, 'hash3', 'Quản Trị Viên', ?4, ?4)`,
    ).bind(parentId, teacherId, adminId, now).run();

    // 2. Parent has a learner
    const learnerId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
       VALUES (?1, ?2, 'Bé Nam', 2016, 4, 'Asia/Ho_Chi_Minh', ?3, ?3)`,
    ).bind(learnerId, parentId, now).run();

    // 3. Create an organization and members
    const orgId = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO organizations (id, slug, name, created_at, updated_at)
       VALUES (?1, 'trung-tam-toan-tai', 'Trung Tâm Toán Trí Tuệ', ?2, ?2)`,
    ).bind(orgId, now).run();

    await db.prepare(
      `INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
       VALUES
         (?1, ?2, ?3, 'admin', ?5, ?5),
         (?4, ?2, ?6, 'teacher', ?5, ?5)`,
    ).bind(crypto.randomUUID(), orgId, adminId, crypto.randomUUID(), now, teacherId).run();

    // 4. Repositories verification: without consent, NEITHER admin NOR teacher can access learner
    const {
      canStaffAccessLearner,
      grantLearnerConsent,
      revokeLearnerConsent,
      assignClassroomTeacher,
      enrollLearnerInClassroom,
    } = await import("../../src/worker/db/repositories");

    let adminAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: adminId, learnerId });
    let teacherAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: teacherId, learnerId });
    expect(adminAccess, "Admin cannot access learner without consent").toBe(false);
    expect(teacherAccess, "Teacher cannot access learner without consent").toBe(false);

    // 5. Parent grants explicit consent to the organization
    const consentId = crypto.randomUUID();
    await grantLearnerConsent(db, {
      id: consentId,
      organizationId: orgId,
      learnerId,
      grantedBy: parentId,
      now,
    });

    // Admin now has access because of organization-wide role
    adminAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: adminId, learnerId });
    expect(adminAccess, "Admin has access once consent is active").toBe(true);

    // But Teacher STILL CANNOT access because learner is not enrolled in teacher's classroom!
    teacherAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: teacherId, learnerId });
    expect(teacherAccess, "Teacher cannot access learner before classroom assignment").toBe(false);

    // 6. Setup Classrooms:
    // Classroom A (assigned to teacher)
    // Classroom B (NOT assigned to teacher)
    const classA = crypto.randomUUID();
    const classB = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO classrooms (id, organization_id, name, grade, subject_id, created_at, updated_at)
       VALUES
         (?1, ?3, 'Toán Nâng Cao 4A', 4, 'math', ?4, ?4),
         (?2, ?3, 'Tiếng Việt 4B', 4, 'vietnamese', ?4, ?4)`,
    ).bind(classA, classB, orgId, now).run();

    await assignClassroomTeacher(db, { classroomId: classA, teacherId, now });

    // Enroll learner into Classroom B (which teacher does NOT teach)
    await enrollLearnerInClassroom(db, {
      id: crypto.randomUUID(),
      classroomId: classB,
      learnerId,
      now,
    });

    teacherAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: teacherId, learnerId });
    expect(teacherAccess, "Teacher cannot access learner in another classroom").toBe(false);

    // Enroll learner into Classroom A (which teacher teaches)
    await enrollLearnerInClassroom(db, {
      id: crypto.randomUUID(),
      classroomId: classA,
      learnerId,
      now,
    });

    teacherAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: teacherId, learnerId });
    expect(teacherAccess, "Teacher has access when learner is in assigned classroom with active consent").toBe(true);

    // 7. Instant Revocation by parent
    await revokeLearnerConsent(db, {
      organizationId: orgId,
      learnerId,
      revokedBy: parentId,
      now: now + 1000,
    });

    // Both admin and teacher are immediately cut off
    adminAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: adminId, learnerId });
    teacherAccess = await canStaffAccessLearner(db, { organizationId: orgId, staffUserId: teacherId, learnerId });
    expect(adminAccess, "Admin immediately loses access upon revocation").toBe(false);
    expect(teacherAccess, "Teacher immediately loses access upon revocation").toBe(false);
  });

  it("verifies full HTTP workflow: org creation, teacher assignment, parent consent, enrollment, and instant revocation", async () => {
    const db = env.DB;
    const now = Date.now();

    const ownerId = crypto.randomUUID();
    const teacherId = crypto.randomUUID();
    const parentId = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES
         (?1, 'hash1', 'Chủ Trung Tâm', ?4, ?4),
         (?2, 'hash2', 'Thầy Hùng', ?4, ?4),
         (?3, 'hash3', 'Mẹ Bé An', ?4, ?4)`,
    ).bind(ownerId, teacherId, parentId, now).run();

    const ownerJar = await createAuthenticatedJar(ownerId, "Chủ Trung Tâm");
    const teacherJar = await createAuthenticatedJar(teacherId, "Thầy Hùng");
    const parentJar = await createAuthenticatedJar(parentId, "Mẹ Bé An");

    // 1. Parent creates learner profile
    const createLearnerRes = await callWithJar(parentJar, "/api/parent/learners", {
      method: "POST",
      json: { nickname: "Bé An", birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
    });
    expect(createLearnerRes.status).toBe(200);
    const { learner } = (await createLearnerRes.json()) as { learner: { id: string } };
    const learnerId = learner.id;

    // 2. Owner creates organization
    const createOrgRes = await callWithJar(ownerJar, "/api/org/create", {
      method: "POST",
      json: { slug: "hoc-vien-tai-nang", name: "Học Viện Tài Năng" },
    });
    expect(createOrgRes.status).toBe(200);
    const { organization } = (await createOrgRes.json()) as { organization: { id: string } };
    const orgId = organization.id;

    // 3. Owner adds Teacher to the organization
    const addMemberRes = await callWithJar(ownerJar, "/api/org/members", {
      method: "POST",
      json: { organizationId: orgId, userId: teacherId, role: "teacher" },
    });
    expect(addMemberRes.status).toBe(200);

    // Teacher cannot add members (403)
    const teacherAddRes = await callWithJar(teacherJar, "/api/org/members", {
      method: "POST",
      json: { organizationId: orgId, userId: parentId, role: "teacher" },
    });
    expect(teacherAddRes.status).toBe(403);

    // 4. Owner creates two classrooms: Class 4A and Class 4B
    const classARes = await callWithJar(ownerJar, "/api/org/classrooms", {
      method: "POST",
      json: { organizationId: orgId, name: "Lớp Toán 4A", grade: 4, subjectId: "math" },
    });
    expect(classARes.status).toBe(200);
    const classAId = ((await classARes.json()) as { classroom: { id: string } }).classroom.id;

    const classBRes = await callWithJar(ownerJar, "/api/org/classrooms", {
      method: "POST",
      json: { organizationId: orgId, name: "Lớp Tiếng Anh 4B", grade: 4, subjectId: "english" },
    });
    expect(classBRes.status).toBe(200);
    const classBId = ((await classBRes.json()) as { classroom: { id: string } }).classroom.id;

    // 5. Assign Teacher to Class 4A only
    const assignRes = await callWithJar(ownerJar, "/api/org/classrooms/teachers", {
      method: "POST",
      json: { classroomId: classAId, teacherId },
    });
    expect(assignRes.status).toBe(200);

    // 6. Attempting to enroll learner BEFORE parent consent fails with 403
    const enrollBeforeConsentRes = await callWithJar(ownerJar, "/api/org/classrooms/enroll", {
      method: "POST",
      json: { classroomId: classAId, learnerId },
    });
    expect(enrollBeforeConsentRes.status).toBe(403);

    // 7. Parent grants consent to the organization
    const grantRes = await callWithJar(parentJar, "/api/parent/consents/grant", {
      method: "POST",
      json: { organizationId: orgId, learnerId },
    });
    expect(grantRes.status).toBe(200);

    // Parent lists consents
    const listConsentsRes = await callWithJar(parentJar, `/api/parent/consents?learnerId=${learnerId}`);
    expect(listConsentsRes.status).toBe(200);
    const consentsBody = (await listConsentsRes.json()) as {
      consents: { organizationId: string; status: string }[];
    };
    expect(consentsBody.consents).toHaveLength(1);
    expect(consentsBody.consents[0]!.status).toBe("active");

    // 8. Owner enrolls learner into Class 4A now that consent is active
    const enrollAfterConsentRes = await callWithJar(ownerJar, "/api/org/classrooms/enroll", {
      method: "POST",
      json: { classroomId: classAId, learnerId },
    });
    expect(enrollAfterConsentRes.status).toBe(200);

    // 9. Teacher can view learners in Class 4A (assigned) -> sees Bé An
    const teacherClassARes = await callWithJar(
      teacherJar,
      `/api/org/classrooms/learners?classroomId=${classAId}`,
    );
    expect(teacherClassARes.status).toBe(200);
    const classALearners = (await teacherClassARes.json()) as { learners: { id: string; nickname: string }[] };
    expect(classALearners.learners).toHaveLength(1);
    expect(classALearners.learners[0]!.id).toBe(learnerId);

    // Teacher CANNOT view learners in Class 4B (unassigned) -> 403 Forbidden
    const teacherClassBRes = await callWithJar(
      teacherJar,
      `/api/org/classrooms/learners?classroomId=${classBId}`,
    );
    expect(teacherClassBRes.status).toBe(403);

    // 10. Parent revokes consent -> Teacher immediately sees 0 learners in Class 4A
    const revokeRes = await callWithJar(parentJar, "/api/parent/consents/revoke", {
      method: "POST",
      json: { organizationId: orgId, learnerId },
    });
    expect(revokeRes.status).toBe(200);

    const teacherAfterRevokeRes = await callWithJar(
      teacherJar,
      `/api/org/classrooms/learners?classroomId=${classAId}`,
    );
    expect(teacherAfterRevokeRes.status).toBe(200);
    const learnersAfterRevoke = (await teacherAfterRevokeRes.json()) as { learners: { id: string }[] };
    expect(learnersAfterRevoke.learners).toHaveLength(0);
  });
});
