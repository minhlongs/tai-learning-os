/**
 * SUPREME COMMAND #08 Integration Test Suite:
 * Learner/Version Approval & Bounded Session Continuation Regression Suite
 *
 * Verifies all 11 regression scenarios:
 *   1. Cross-Tenant Teacher Assignment Rejection (403)
 *   2. Strict Teacher Classroom Scoping (teacher views/acts only on assigned classrooms)
 *   3. Learner-Scoped Approval Isolation across Families (Family A vs Family B)
 *   4. Sibling Approval Isolation under Same Parent Account (Sibling 1 vs Sibling 2)
 *   5. Lesson Version Invalidation (v1 approval does not unlock v2 without re-approval)
 *   6. Direct Content Access Parity across Centers (GET /api/parent/lessons/:id blocked for unauthorized center)
 *   7. 30-Minute Continuation Grace Period (hints/attempts allowed within 30 min of revocation)
 *   8. Hard Cutoff After 30 Minutes (hints/attempts rejected with 403 after 30 min)
 *   9. Monotonic Clamping of Continuation Deadline (re-revoking never extends grace window)
 *  10. Session Completion / Abandonment Immediate Cutoff (finalizing cuts continuation; starting new session blocked)
 *  11. Learner Deletion Immediate Destruction (0-minute window, instant session termination, PII-free audit proof)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import { PILOT_MATH_LESSON_CONTENT } from "./pilot-fixture";
import type {
  CreateOrgLessonResponse,
  StartSessionResponse,
} from "../../src/shared/api-contract";

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

async function createAuthenticatedJar(
  parentId: string,
  displayName: string,
  mode: "parent" | "learner" = "parent",
): Promise<Jar> {
  const now = Date.now();
  const token = await createSessionToken(TEST_SECRET, parentId, displayName, now, mode);
  const verified = await verifySessionToken(TEST_SECRET, token, now);
  if (!verified.ok) throw new Error("Failed to verify test token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return {
    cookies: { tlo_session: token },
    csrf,
  };
}

describe("SUPREME COMMAND #08: Learner/Version Approval & Bounded Continuation", () => {
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

  it("Scenario 1: Cross-Tenant Teacher Assignment Rejection (403)", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    // Seed Center A and Center B
    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-a', 'center-a', 'Center A', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-b', 'center-b', 'Center B', ?1, ?1)").bind(now).run();

    // Accounts
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('owner-a', ?1, 'Owner A', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('teacher-b', ?1, 'Teacher B', ?2, ?2)").bind(passwordHash, now).run();

    // Memberships: owner-a in org-a, teacher-b ONLY in org-b
    await db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-1', 'org-a', 'owner-a', 'owner', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-2', 'org-b', 'teacher-b', 'teacher', ?1, ?1)").bind(now).run();

    // Classroom in Center A
    await db.prepare("INSERT INTO classrooms (id, organization_id, name, created_at, updated_at) VALUES ('class-a1', 'org-a', 'Class A1', ?1, ?1)").bind(now).run();

    // Owner A attempts to assign Teacher B (from Center B) to Class A1
    const ownerAJar = await createAuthenticatedJar("owner-a", "Owner A");
    const res = await callWithJar(ownerAJar, "/api/org/classrooms/teachers", {
      method: "POST",
      json: {
        classroomId: "class-a1",
        teacherId: "teacher-b",
      },
    });

    expect(res.status).toBe(403);
    const body = await res.json() as { messageVi: string };
    expect(body.messageVi).toContain("Giáo viên này không thuộc tổ chức");
  });

  it("Scenario 2: Strict Teacher Classroom Scoping", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-a', 'center-a', 'Center A', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('teacher-1', ?1, 'Teacher 1', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-t1', 'org-a', 'teacher-1', 'teacher', ?1, ?1)").bind(now).run();

    // 2 Classrooms in Center A
    await db.prepare("INSERT INTO classrooms (id, organization_id, name, created_at, updated_at) VALUES ('class-1', 'org-a', 'Class 1', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO classrooms (id, organization_id, name, created_at, updated_at) VALUES ('class-2', 'org-a', 'Class 2', ?1, ?1)").bind(now).run();

    // Teacher 1 is assigned only to Class 1
    await db.prepare("INSERT INTO classroom_teachers (classroom_id, teacher_id, created_at) VALUES ('class-1', 'teacher-1', ?1)").bind(now).run();

    const teacherJar = await createAuthenticatedJar("teacher-1", "Teacher 1");

    // GET /api/org/classrooms -> must only list Class 1
    const listRes = await callWithJar(teacherJar, "/api/org/classrooms?organizationId=org-a");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json() as { classrooms: { id: string }[] };
    expect(listBody.classrooms).toHaveLength(1);
    expect(listBody.classrooms[0]?.id).toBe("class-1");

    // Teacher 1 tries to view learners of Class 2 -> 403 Forbidden
    const unassignedRes = await callWithJar(teacherJar, "/api/org/classrooms/learners?classroomId=class-2");
    expect(unassignedRes.status).toBe(403);
  });

  it("Scenario 3: Learner-Scoped Approval Isolation Across Families", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    // Family A (Parent A, Learner A) and Family B (Parent B, Learner B)
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-a', ?1, 'Parent A', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-b', ?1, 'Parent B', ?2, ?2)").bind(passwordHash, now).run();

    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-a', 'parent-a', 'Bé A', 4, ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-b', 'parent-b', 'Bé B', 4, ?1, ?1)").bind(now).run();

    // Shared curriculum lesson math-1 (already seeded in reference content, e.g. lesson-math-01)
    const lesson = await db.prepare("SELECT id, version FROM lessons LIMIT 1").first<{ id: string; version: number }>();
    expect(lesson).toBeTruthy();
    const lessonId = lesson!.id;

    // Parent A approves lesson for Learner A
    const parentAJar = await createAuthenticatedJar("parent-a", "Parent A");
    const appRes = await callWithJar(parentAJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: {
        lessonId,
        learnerId: "learner-a",
        status: "approved",
      },
    });
    expect(appRes.status).toBe(200);

    // Learner A can start session
    const learnerAJar = await createAuthenticatedJar("parent-a", "Parent A", "learner");
    const startARes = await callWithJar(learnerAJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-a" },
    });
    expect(startARes.status).toBe(200);

    // Learner B under Parent B cannot start session -> 403 Forbidden
    const learnerBJar = await createAuthenticatedJar("parent-b", "Parent B", "learner");
    const startBRes = await callWithJar(learnerBJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-b" },
    });
    expect(startBRes.status).toBe(403);
    const errBody = await startBRes.json() as { messageVi: string };
    expect(errBody.messageVi).toContain("chưa được phụ huynh phê duyệt");
  });

  it("Scenario 4: Sibling Approval Isolation under Same Parent Account", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    // Parent with two siblings
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-sib', ?1, 'Parent Siblings', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('sibling-1', 'parent-sib', 'Bé Anh', 4, ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('sibling-2', 'parent-sib', 'Bé Em', 4, ?1, ?1)").bind(now).run();

    const lesson = await db.prepare("SELECT id, version FROM lessons LIMIT 1").first<{ id: string; version: number }>();
    const lessonId = lesson!.id;

    // Parent approves for sibling-1 ONLY
    const parentJar = await createAuthenticatedJar("parent-sib", "Parent Siblings");
    const appRes = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: {
        lessonId,
        learnerId: "sibling-1",
        status: "approved",
      },
    });
    expect(appRes.status).toBe(200);

    // Sibling 1 starts session successfully
    const learnerJar = await createAuthenticatedJar("parent-sib", "Parent Siblings", "learner");
    const start1Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "sibling-1" },
    });
    expect(start1Res.status).toBe(200);

    // Sibling 2 tries to start session -> 403 Forbidden!
    const start2Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "sibling-2" },
    });
    expect(start2Res.status).toBe(403);
    const errBody = await start2Res.json() as { messageVi: string };
    expect(errBody.messageVi).toContain("chưa được phụ huynh phê duyệt");
  });

  it("Scenario 5: Lesson Version Invalidation (v1 approval does not unlock v2)", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-ver', ?1, 'Parent Version', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-ver', 'parent-ver', 'Bé Ver', 4, ?1, ?1)").bind(now).run();

    const catalogueLesson = await db.prepare("SELECT id, version, subject_id, title_vi, objective_vi FROM lessons LIMIT 1").first<{ id: string; version: number; subject_id: string; title_vi: string; objective_vi: string }>();

    const parentJar = await createAuthenticatedJar("parent-ver", "Parent Version");
    const forkRes = await callWithJar(parentJar, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogueLesson!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId, lesson } = (await forkRes.json()) as { lessonId: string; lesson: { titleVi: string; objectiveVi: string } };

    // Approve v1
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-ver", version: 1, status: "approved" },
    });

    // Parent updates lesson content to create version 2 (needs contiguous positions starting at 1 and at least one transfer step)
    const updateRes = await callWithJar(parentJar, "/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId,
        titleVi: lesson.titleVi + " v2",
        objectiveVi: lesson.objectiveVi,
        steps: [
          {
            position: 1,
            kind: "transfer",
            content: {
              type: "multiple_choice",
              question_vi: "1 + 1 = ?",
              choices: [
                { id: "c1", label_vi: "2", correct: true },
                { id: "c2", label_vi: "3", correct: false },
              ],
              hint1_vi: "Gợi ý 1",
              hint2_vi: "Gợi ý 2",
              hint3_vi: "Gợi ý 3",
            },
            answerKey: { correctChoiceId: "c1" },
            explanationVi: "1 + 1 = 2",
          },
        ],
      },
    });
    expect(updateRes.status).toBe(200);

    // Verify DB bumped version to 2
    const updatedLesson = await db.prepare("SELECT version FROM lessons WHERE id = ?1").bind(lessonId).first<{ version: number }>();
    expect(updatedLesson?.version).toBe(2);

    // Learner attempts to start a NEW session on the updated lesson -> 403 Forbidden because v2 is unapproved!
    const learnerJar = await createAuthenticatedJar("parent-ver", "Parent Version", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-ver" },
    });
    expect(startRes.status).toBe(403);
    const errBody = await startRes.json() as { messageVi: string };
    expect(errBody.messageVi).toContain("chưa được phụ huynh phê duyệt");
  });

  it("Scenario 6: Direct Content Access Parity Across Centers", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    // Center X and Center Y
    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-x', 'center-x', 'Center X', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-y', 'center-y', 'Center Y', ?1, ?1)").bind(now).run();

    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('owner-x', ?1, 'Owner X', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-y', ?1, 'Parent Y', ?2, ?2)").bind(passwordHash, now).run();

    await db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-x', 'org-x', 'owner-x', 'owner', ?1, ?1)").bind(now).run();

    // Create draft lesson in Center X
    const ownerXJar = await createAuthenticatedJar("owner-x", "Owner X");
    const createRes = await callWithJar(ownerXJar, "/api/org/lessons/draft", {
      method: "POST",
      json: {
        organizationId: "org-x",
        subjectId: "math",
        titleVi: "Bí kíp Trung tâm X",
        objectiveVi: "Mục tiêu bí mật",
        steps: PILOT_MATH_LESSON_CONTENT.steps,
      },
    });
    expect(createRes.status).toBe(200);
    const { lessonId } = await createRes.json() as CreateOrgLessonResponse;

    // Parent Y (unaffiliated with Center X) attempts to inspect GET /api/parent/lessons/:lessonId directly -> 403 Forbidden
    const parentYJar = await createAuthenticatedJar("parent-y", "Parent Y");
    const inspectRes = await callWithJar(parentYJar, `/api/parent/lessons/${lessonId}`);
    expect(inspectRes.status).toBe(403);
    const errBody = await inspectRes.json() as { messageVi: string };
    expect(errBody.messageVi).toContain("Bạn không có quyền truy cập bài học của trung tâm này");
  });

  it("Scenario 7 & 8: 30-Minute Continuation Grace Period and Hard Cutoff After 30 Minutes", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-grace', 'center-grace', 'Center Grace', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('owner-grace', ?1, 'Owner Grace', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-grace', ?1, 'Parent Grace', ?2, ?2)").bind(passwordHash, now).run();

    await db.prepare("INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-g', 'org-grace', 'owner-grace', 'owner', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-grace', 'parent-grace', 'Bé Grace', 4, ?1, ?1)").bind(now).run();

    // Active consent & enrollment
    await db.prepare("INSERT INTO learner_consents (id, organization_id, learner_id, status, granted_by, granted_at) VALUES ('c-1', 'org-grace', 'learner-grace', 'active', 'parent-grace', ?1)").bind(now).run();
    await db.prepare("INSERT INTO classrooms (id, organization_id, name, created_at, updated_at) VALUES ('class-g', 'org-grace', 'Lớp Grace', ?1, ?1)").bind(now).run();
    await db.prepare("INSERT INTO classroom_enrollments (id, classroom_id, learner_id, status, created_at, updated_at) VALUES ('en-g', 'class-g', 'learner-grace', 'enrolled', ?1, ?1)").bind(now).run();

    // Center drafts, reviews, approves, and assigns lesson
    const ownerJar = await createAuthenticatedJar("owner-grace", "Owner Grace");
    const createRes = await callWithJar(ownerJar, "/api/org/lessons/draft", {
      method: "POST",
      json: {
        organizationId: "org-grace",
        subjectId: "math",
        titleVi: "Bài Học Grace",
        objectiveVi: "Mục tiêu Grace",
        steps: PILOT_MATH_LESSON_CONTENT.steps,
      },
    });
    const { lessonId } = await createRes.json() as CreateOrgLessonResponse;

    await callWithJar(ownerJar, "/api/org/lessons/review", {
      method: "POST",
      json: { organizationId: "org-grace", lessonId, decision: "org_approved" },
    });
    await callWithJar(ownerJar, "/api/org/classrooms/assign-lesson", {
      method: "POST",
      json: { classroomId: "class-g", lessonId },
    });

    // Parent approves lesson
    const parentJar = await createAuthenticatedJar("parent-grace", "Parent Grace");
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-grace", status: "approved" },
    });

    // Learner starts session
    const learnerJar = await createAuthenticatedJar("parent-grace", "Parent Grace", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-grace" },
    });
    expect(startRes.status).toBe(200);
    const { sessionId, steps } = await startRes.json() as StartSessionResponse;
    const stepId = steps[0]!.id;

    // Parent REVOKES consent for Center Grace
    const revokeRes = await callWithJar(parentJar, "/api/parent/consents/revoke", {
      method: "POST",
      json: { organizationId: "org-grace", learnerId: "learner-grace" },
    });
    expect(revokeRes.status).toBe(200);

    // Check DB: continuation_deadline has been set to now + 30 min
    const sessionRow = await db.prepare("SELECT continuation_deadline FROM learning_sessions WHERE id = ?1").bind(sessionId).first<{ continuation_deadline: number }>();
    expect(sessionRow?.continuation_deadline).toBeGreaterThan(now);

    // Scenario 7: Active session can still request hint within 30 min
    const hintRes = await callWithJar(learnerJar, "/api/learner/hints", {
      method: "POST",
      json: { sessionId, stepId, currentLevel: 1, learnerId: "learner-grace" },
    });
    expect(hintRes.status).toBe(200);

    // Starting a NEW session while in_progress resumes the existing session within the 30-min grace window
    const newSessionRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-grace" },
    });
    expect(newSessionRes.status).toBe(200);

    // Scenario 8: Fast-forward time past 30 minutes by updating continuation_deadline to the past
    const pastDeadline = Date.now() - 5_000;
    await db.prepare("UPDATE learning_sessions SET continuation_deadline = ?1 WHERE id = ?2").bind(pastDeadline, sessionId).run();

    // Now requesting hint must fail with 403
    const expiredHintRes = await callWithJar(learnerJar, "/api/learner/hints", {
      method: "POST",
      json: { sessionId, stepId, currentLevel: 2, learnerId: "learner-grace" },
    });
    expect(expiredHintRes.status).toBe(403);
    const errHint = await expiredHintRes.json() as { messageVi: string };
    expect(errHint.messageVi).toContain("30 phút");

    // Submitting attempt must also fail with 403
    const expiredAttemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId,
        stepId,
        submission: { kind: "choice", choiceId: "c2" },
        helpLevel: 0,
        learnerId: "learner-grace",
      },
    });
    expect(expiredAttemptRes.status).toBe(403);

    // Resuming session is also blocked after deadline
    const expiredResumeRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-grace" },
    });
    expect(expiredResumeRes.status).toBe(403);
  });

  it("Scenario 9: Monotonic Clamping of Continuation Deadline", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-mono', ?1, 'Parent Mono', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-mono', 'parent-mono', 'Bé Mono', 4, ?1, ?1)").bind(now).run();

    const lesson = await db.prepare("SELECT id, version FROM lessons LIMIT 1").first<{ id: string; version: number }>();
    const lessonId = lesson!.id;

    const parentJar = await createAuthenticatedJar("parent-mono", "Parent Mono");
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-mono", status: "approved" },
    });

    const learnerJar = await createAuthenticatedJar("parent-mono", "Parent Mono", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-mono" },
    });
    const { sessionId } = await startRes.json() as StartSessionResponse;

    // First revocation sets initial deadline = now + 30 min
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-mono", status: "rejected" },
    });

    const sessionT0 = await db.prepare("SELECT continuation_deadline FROM learning_sessions WHERE id = ?1").bind(sessionId).first<{ continuation_deadline: number }>();
    const deadlineT0 = sessionT0!.continuation_deadline;
    expect(deadlineT0).toBeDefined();

    // Simulate 10 minutes later: another revocation occurs
    // Set a tighter deadline manually to simulate previous clamp
    await db.prepare("UPDATE learning_sessions SET continuation_deadline = ?1 WHERE id = ?2").bind(deadlineT0 - 5000, sessionId).run();

    // Call clamp function again with t10 + 30 min (which is larger than current deadline)
    // The monotonic SQL clamp MUST NOT extend the deadline
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-mono", status: "rejected" },
    });

    const sessionFinal = await db.prepare("SELECT continuation_deadline FROM learning_sessions WHERE id = ?1").bind(sessionId).first<{ continuation_deadline: number }>();
    expect(sessionFinal!.continuation_deadline).toBeLessThanOrEqual(deadlineT0);
  });

  it("Scenario 10: Session Completion / Abandonment Immediate Cutoff", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-fin', ?1, 'Parent Fin', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-fin', 'parent-fin', 'Bé Fin', 4, ?1, ?1)").bind(now).run();

    const lesson = await db.prepare("SELECT id, version FROM lessons LIMIT 1").first<{ id: string; version: number }>();
    const lessonId = lesson!.id;

    const parentJar = await createAuthenticatedJar("parent-fin", "Parent Fin");
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-fin", status: "approved" },
    });

    const learnerJar = await createAuthenticatedJar("parent-fin", "Parent Fin", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-fin" },
    });
    const { sessionId, steps } = await startRes.json() as StartSessionResponse;
    const stepId = steps[0]!.id;

    // Revoke approval -> sets continuation deadline
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-fin", status: "rejected" },
    });

    // Learner finalizes session during the grace window
    const finRes = await callWithJar(learnerJar, "/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId, learnerId: "learner-fin" },
    });
    expect(finRes.status).toBe(200);

    // After finalization, attempts on this session are immediately rejected with 400
    const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId,
        stepId,
        submission: { kind: "choice", choiceId: "c1" },
        helpLevel: 0,
        learnerId: "learner-fin",
      },
    });
    expect(attemptRes.status).toBe(400);

    // Starting a new session is blocked with 403 because approval was rejected
    const restartRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-fin" },
    });
    expect(restartRes.status).toBe(403);
  });

  it("Scenario 11: Learner Deletion Immediate Destruction (Zero Grace Window)", async () => {
    const db = env.DB;
    const now = Date.now();
    const passwordHash = await hashPassword("MatKhau@123456", 100_000);

    await db.prepare("INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES ('parent-del', ?1, 'Parent Del', ?2, ?2)").bind(passwordHash, now).run();
    await db.prepare("INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-del', 'parent-del', 'Bé Xóa', 4, ?1, ?1)").bind(now).run();

    const lesson = await db.prepare("SELECT id, version FROM lessons LIMIT 1").first<{ id: string; version: number }>();
    const lessonId = lesson!.id;

    const parentJar = await createAuthenticatedJar("parent-del", "Parent Del");
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: "learner-del", status: "approved" },
    });

    const learnerJar = await createAuthenticatedJar("parent-del", "Parent Del", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId, learnerId: "learner-del" },
    });
    const { sessionId, steps } = await startRes.json() as StartSessionResponse;
    const stepId = steps[0]!.id;

    // Parent DELETES learner
    const delRes = await callWithJar(parentJar, "/api/data/learner", {
      method: "DELETE",
      json: {
        learnerId: "learner-del",
        confirmation: "XOA Bé Xóa",
      },
    });
    expect(delRes.status).toBe(200);

    // All sessions, attempts, approvals for this learner are immediately destroyed with ZERO grace window!
    const sessionCheck = await db.prepare("SELECT id FROM learning_sessions WHERE id = ?1").bind(sessionId).first();
    expect(sessionCheck).toBeNull();

    const approvalCheck = await db.prepare("SELECT id FROM review_approvals WHERE learner_id = 'learner-del'").first();
    expect(approvalCheck).toBeNull();

    // Audit row confirms deletion without child PII (no nickname)
    const auditRow = await db.prepare("SELECT actor, action, subject, detail FROM audit_events WHERE action = 'learner.deleted' AND subject = 'learner-del'").first<{ actor: string; action: string; subject: string; detail: string }>();
    expect(auditRow).toBeTruthy();
    expect(auditRow!.actor).toBe("parent:parent-del");
    expect(auditRow!.detail).not.toContain("Bé Xóa");

    // Any attempt on deleted session immediately returns 404 (not found)
    const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId,
        stepId,
        submission: { kind: "choice", choiceId: "c1" },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(404);
  });
});
