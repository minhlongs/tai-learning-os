/**
 * M2 & M3 Integration Test: Full B2B2C Lifecycle with 1 Center, 2 Teachers, 5 Learners
 *
 * Verifies:
 *   1. M3 Pilot Fixture Seeding: 1 center, 1 owner, 2 teachers, 2 classrooms, 5 parent–learner pairs (Grade 4).
 *   2. Consent & Enrollment: Parents grant consent -> Center enrolls 3 learners in Toán 4A, 2 learners in Anh-Việt 4B.
 *   3. M2 Teacher Lesson Authoring & Multi-Tier Approval:
 *      - Teacher (Thầy Quang) drafts a Math lesson (`review_status: 'draft'`).
 *      - Assigning a draft lesson to a classroom is rejected (403).
 *      - Teacher submits lesson for review (`review_status: 'submitted'`).
 *      - Teacher cannot approve their own lesson (403).
 *      - Center Owner (Cô Mai) approves the lesson (`review_status: 'org_approved'`).
 *      - Teacher assigns the approved lesson to Lớp Toán 4A.
 *   4. Parent Approval & Child Access Gate:
 *      - Enrolled learner (Bé An) cannot start the classroom lesson before parent approval (403).
 *      - Parent (Ba Minh) views classroom-assigned lessons (`GET /api/parent/classroom-lessons`) and approves the lesson (`POST /api/parent/lessons/approval`).
 *      - Learner (Bé An) starts the lesson (`POST /api/learner/sessions`), submits a correct answer (`POST /api/learner/attempts`), and finalizes the session (`POST /api/learner/sessions/finalize`).
 *      - Unenrolled learner (Bé Duy, who is in Anh-Việt 4B, not Toán 4A) is blocked (403) from starting the Toán 4A lesson even though it is approved!
 *   5. Revocation & Cascade Erasure:
 *      - Revoking consent for Bé Bảo immediately removes Bé Bảo from Thầy Quang's classroom learner list (`GET /api/org/classrooms/learners`).
 *      - Deleting Bé An (`DELETE /api/data/learner`) cascades across all tables while preserving PII-free immutable audit proof.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import {
  PILOT_ORGANIZATION,
  PILOT_OWNER,
  PILOT_TEACHERS,
  PILOT_CLASSROOMS,
  PILOT_LEARNERS,
  PILOT_MATH_LESSON_CONTENT,
} from "./pilot-fixture";
import type {
  CreateOrgLessonResponse,
  SubmitOrgLessonReviewResponse,
  ReviewOrgLessonResponse,
  AssignClassroomLessonResponse,
  ClassroomLessonListResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
  ClassroomLearnersResponse,
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

describe("M2 & M3 Pilot Lifecycle: 1 Center, 2 Teachers, 5 Learners E2E", () => {
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

  it("executes the complete multi-learner pilot workflow from teacher authoring to child learning, revocation, and erasure", async () => {
    const now = Date.now();
    const pwHash = await hashPassword("pilot-pass-12345");

    // 1. Seed Center Owner & 2 Teachers
    await env.DB.prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?4)`,
    )
      .bind(PILOT_OWNER.id, pwHash, PILOT_OWNER.name, now)
      .run();

    for (const teacher of PILOT_TEACHERS) {
      await env.DB.prepare(
        `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)`,
      )
        .bind(teacher.id, pwHash, teacher.name, now)
        .run();
    }

    // 2. Seed 5 Parent–Learner pairs (Grade 4)
    for (const item of PILOT_LEARNERS) {
      await env.DB.prepare(
        `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)`,
      )
        .bind(item.parentId, pwHash, item.parentName, now)
        .run();

      await env.DB.prepare(
        `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'Asia/Ho_Chi_Minh', ?6, ?6)`,
      )
        .bind(item.learnerId, item.parentId, item.nickname, item.birthYear, item.grade, now)
        .run();
    }

    const ownerJar = await createAuthenticatedJar(PILOT_OWNER.id, PILOT_OWNER.name);
    const teacherQuangJar = await createAuthenticatedJar(PILOT_TEACHERS[0]!.id, PILOT_TEACHERS[0]!.name);
    const teacherHuongJar = await createAuthenticatedJar(PILOT_TEACHERS[1]!.id, PILOT_TEACHERS[1]!.name);

    // 3. Owner creates the Center & adds both Teachers
    const createOrgRes = await callWithJar(ownerJar, "/api/org/create", {
      method: "POST",
      json: { slug: PILOT_ORGANIZATION.slug, name: PILOT_ORGANIZATION.name },
    });
    expect(createOrgRes.status).toBe(200);
    const orgId = ((await createOrgRes.json()) as { organization: { id: string } }).organization.id;

    for (const teacher of PILOT_TEACHERS) {
      const addMemberRes = await callWithJar(ownerJar, "/api/org/members", {
        method: "POST",
        json: { organizationId: orgId, userId: teacher.id, role: "teacher" },
      });
      expect(addMemberRes.status).toBe(200);
    }

    // 4. Owner creates 2 Classrooms (Toán 4A & Anh-Việt 4B) and assigns teachers
    const createMathClassRes = await callWithJar(ownerJar, "/api/org/classrooms", {
      method: "POST",
      json: {
        organizationId: orgId,
        name: PILOT_CLASSROOMS.math4a.name,
        grade: PILOT_CLASSROOMS.math4a.grade,
        subjectId: PILOT_CLASSROOMS.math4a.subjectId,
      },
    });
    expect(createMathClassRes.status).toBe(200);
    const mathClassId = ((await createMathClassRes.json()) as { classroom: { id: string } }).classroom.id;

    const createLangClassRes = await callWithJar(ownerJar, "/api/org/classrooms", {
      method: "POST",
      json: {
        organizationId: orgId,
        name: PILOT_CLASSROOMS.lang4b.name,
        grade: PILOT_CLASSROOMS.lang4b.grade,
        subjectId: PILOT_CLASSROOMS.lang4b.subjectId,
      },
    });
    expect(createLangClassRes.status).toBe(200);
    const langClassId = ((await createLangClassRes.json()) as { classroom: { id: string } }).classroom.id;

    await callWithJar(ownerJar, "/api/org/classrooms/teachers", {
      method: "POST",
      json: { classroomId: mathClassId, teacherId: PILOT_TEACHERS[0]!.id },
    });
    await callWithJar(ownerJar, "/api/org/classrooms/teachers", {
      method: "POST",
      json: { classroomId: langClassId, teacherId: PILOT_TEACHERS[1]!.id },
    });

    // 5. All 5 Parents grant consent to the Center, and Owner enrolls learners into their respective classrooms
    for (const item of PILOT_LEARNERS) {
      const parentJar = await createAuthenticatedJar(item.parentId, item.parentName);
      const grantRes = await callWithJar(parentJar, "/api/parent/consents/grant", {
        method: "POST",
        json: { organizationId: orgId, learnerId: item.learnerId },
      });
      expect(grantRes.status).toBe(200);

      const targetClassroomId = item.classroomName === "math4a" ? mathClassId : langClassId;
      const enrollRes = await callWithJar(ownerJar, "/api/org/classrooms/enroll", {
        method: "POST",
        json: { classroomId: targetClassroomId, learnerId: item.learnerId },
      });
      expect(enrollRes.status).toBe(200);
    }

    // Verify Thầy Quang sees 3 learners in Toán 4A, and Cô Hương sees 2 learners in Anh-Việt 4B
    const mathLearnersRes = await callWithJar(
      teacherQuangJar,
      `/api/org/classrooms/learners?classroomId=${mathClassId}`,
    );
    expect(mathLearnersRes.status).toBe(200);
    const mathLearners = (await mathLearnersRes.json()) as ClassroomLearnersResponse;
    expect(mathLearners.learners.map((l) => l.nickname).sort()).toEqual(["Bé An", "Bé Bảo", "Bé Châu"]);

    const langLearnersRes = await callWithJar(
      teacherHuongJar,
      `/api/org/classrooms/learners?classroomId=${langClassId}`,
    );
    expect(langLearnersRes.status).toBe(200);
    const langLearners = (await langLearnersRes.json()) as ClassroomLearnersResponse;
    expect(langLearners.learners.map((l) => l.nickname).sort()).toEqual(["Bé Duy", "Bé Em"]);

    // 6. M2 Workflow: Thầy Quang drafts a Math lesson
    const draftRes = await callWithJar(teacherQuangJar, "/api/org/lessons/draft", {
      method: "POST",
      json: {
        organizationId: orgId,
        subjectId: PILOT_MATH_LESSON_CONTENT.subjectId,
        titleVi: PILOT_MATH_LESSON_CONTENT.titleVi,
        objectiveVi: PILOT_MATH_LESSON_CONTENT.objectiveVi,
        gradeFrom: 4,
        gradeTo: 4,
        steps: PILOT_MATH_LESSON_CONTENT.steps.map((s, idx) => ({
          position: idx + 1,
          kind: s.kind,
          content: s.content,
          answerKey: s.answerKey,
          explanationVi: s.explanationVi,
        })),
      },
    });
    expect(draftRes.status).toBe(200);
    const draftBody = (await draftRes.json()) as CreateOrgLessonResponse;
    expect(draftBody.reviewStatus).toBe("draft");
    const authoredLessonId = draftBody.lessonId;

    // 7. Assigning a draft lesson to a classroom is rejected (403)
    const prematureAssignRes = await callWithJar(teacherQuangJar, "/api/org/classrooms/assign-lesson", {
      method: "POST",
      json: { classroomId: mathClassId, lessonId: authoredLessonId },
    });
    expect(prematureAssignRes.status).toBe(403);

    // 8. Thầy Quang submits the lesson for Center review
    const submitRes = await callWithJar(teacherQuangJar, "/api/org/lessons/submit", {
      method: "POST",
      json: { lessonId: authoredLessonId, organizationId: orgId },
    });
    expect(submitRes.status).toBe(200);
    const submitBody = (await submitRes.json()) as SubmitOrgLessonReviewResponse;
    expect(submitBody.reviewStatus).toBe("submitted");

    // 9. Teacher cannot approve their own lesson (403)
    const selfApproveRes = await callWithJar(teacherQuangJar, "/api/org/lessons/review", {
      method: "POST",
      json: { lessonId: authoredLessonId, organizationId: orgId, decision: "org_approved" },
    });
    expect(selfApproveRes.status).toBe(403);

    // 10. Center Owner (Cô Mai) approves the lesson
    const ownerReviewRes = await callWithJar(ownerJar, "/api/org/lessons/review", {
      method: "POST",
      json: {
        lessonId: authoredLessonId,
        organizationId: orgId,
        decision: "org_approved",
        note: "Nội dung chuẩn GDPT 2018 lớp 4, duyệt phân phối.",
      },
    });
    expect(ownerReviewRes.status).toBe(200);
    const ownerReviewBody = (await ownerReviewRes.json()) as ReviewOrgLessonResponse;
    expect(ownerReviewBody.reviewStatus).toBe("org_approved");

    // 11. Thầy Quang assigns the approved lesson to Lớp Toán 4A
    const assignRes = await callWithJar(teacherQuangJar, "/api/org/classrooms/assign-lesson", {
      method: "POST",
      json: {
        classroomId: mathClassId,
        lessonId: authoredLessonId,
        dueAt: now + 7 * 86400_000,
      },
    });
    expect(assignRes.status).toBe(200);
    const assignBody = (await assignRes.json()) as AssignClassroomLessonResponse;
    expect(assignBody.success).toBe(true);

    // 12. Before Parent approves, Bé An (enrolled in Toán 4A) CANNOT start the lesson (403)
    const anParent = PILOT_LEARNERS[0]!;
    const anLearnerJar = await createAuthenticatedJar(anParent.parentId, anParent.parentName, "learner");
    const blockedStartRes = await callWithJar(anLearnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: authoredLessonId },
    });
    expect(blockedStartRes.status).toBe(403);

    // 13. Parent (Ba Minh) inspects classroom lessons and approves the lesson
    const anParentJar = await createAuthenticatedJar(anParent.parentId, anParent.parentName, "parent");
    const parentClassroomLessonsRes = await callWithJar(
      anParentJar,
      `/api/parent/classroom-lessons?learnerId=${anParent.learnerId}`,
    );
    expect(parentClassroomLessonsRes.status).toBe(200);
    const classroomLessons = (await parentClassroomLessonsRes.json()) as ClassroomLessonListResponse;
    expect(classroomLessons.lessons).toHaveLength(1);
    expect(classroomLessons.lessons[0]?.lessonId).toBe(authoredLessonId);
    expect(classroomLessons.lessons[0]?.isParentApproved).toBe(false);

    const parentApproveRes = await callWithJar(anParentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: authoredLessonId, status: "approved", note: "Ba đồng ý cho con học bài này." },
    });
    expect(parentApproveRes.status).toBe(200);

    // 14. Unenrolled learner (Bé Duy in Anh-Việt 4B) is STILL blocked (403) because the lesson was only assigned to Toán 4A
    const duyParent = PILOT_LEARNERS[3]!;
    const duyLearnerJar = await createAuthenticatedJar(duyParent.parentId, duyParent.parentName, "learner");
    const duyBlockedRes = await callWithJar(duyLearnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: authoredLessonId },
    });
    expect(duyBlockedRes.status).toBe(403);

    // 15. Enrolled learner (Bé An in Toán 4A) starts the session, submits a correct answer, and finalizes
    const startRes = await callWithJar(anLearnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: authoredLessonId },
    });
    expect(startRes.status).toBe(200);
    const startBody = (await startRes.json()) as StartSessionResponse;
    expect(startBody.steps).toHaveLength(1);
    const stepId = startBody.steps[0]!.id;

    // Answer key must never leak to learner payload
    expect(JSON.stringify(startBody.steps[0]!.content)).not.toContain('"correct"');

    const attemptRes = await callWithJar(anLearnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: startBody.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: "c2" },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);
    const attemptBody = (await attemptRes.json()) as SubmitAttemptResponse;
    expect(attemptBody.outcome).toBe("correct");

    const finalizeRes = await callWithJar(anLearnerJar, "/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: startBody.sessionId },
    });
    expect(finalizeRes.status).toBe(200);

    // 16. Instant Revocation: Mẹ Lan revokes consent for Bé Bảo -> Thầy Quang immediately loses access to Bé Bảo
    const baoParent = PILOT_LEARNERS[1]!;
    const baoParentJar = await createAuthenticatedJar(baoParent.parentId, baoParent.parentName, "parent");
    const revokeBaoRes = await callWithJar(baoParentJar, "/api/parent/consents/revoke", {
      method: "POST",
      json: { organizationId: orgId, learnerId: baoParent.learnerId },
    });
    expect(revokeBaoRes.status).toBe(200);

    const mathLearnersAfterRevoke = await callWithJar(
      teacherQuangJar,
      `/api/org/classrooms/learners?classroomId=${mathClassId}`,
    );
    expect(mathLearnersAfterRevoke.status).toBe(200);
    const mathLearnersAfterRevokeBody = (await mathLearnersAfterRevoke.json()) as ClassroomLearnersResponse;
    expect(mathLearnersAfterRevokeBody.learners.map((l) => l.nickname).sort()).toEqual(["Bé An", "Bé Châu"]);

    // 17. Cascade Erasure: Ba Minh deletes Bé An -> all child records cascade, audit remains PII-free
    const deleteAnRes = await callWithJar(anParentJar, "/api/data/learner", {
      method: "DELETE",
      json: { learnerId: anParent.learnerId, confirmation: `XOA ${anParent.nickname}` },
    });
    expect(deleteAnRes.status).toBe(200);

    const mathLearnersAfterDelete = await callWithJar(
      teacherQuangJar,
      `/api/org/classrooms/learners?classroomId=${mathClassId}`,
    );
    expect(mathLearnersAfterDelete.status).toBe(200);
    const mathLearnersAfterDeleteBody = (await mathLearnersAfterDelete.json()) as ClassroomLearnersResponse;
    expect(mathLearnersAfterDeleteBody.learners.map((l) => l.nickname)).toEqual(["Bé Châu"]);

    // Verify audit_events has no nickname PII
    const audits = await env.DB.prepare("SELECT detail FROM audit_events").all<{ detail: string | null }>();
    for (const row of audits.results ?? []) {
      expect(row.detail ?? "").not.toContain("Bé An");
    }
  });
});
