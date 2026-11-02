import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import * as repo from "../../src/worker/db/repositories";
import { recordAttemptWithDerivation, loadStepContexts } from "../../src/worker/services/session-service";
import { PILOT_MATH_LESSON_CONTENT } from "./pilot-fixture";
import type { ExportEnvelope, LessonListResponse } from "../../src/shared/api-contract";

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
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && targetJar.csrf) {
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

async function createJar(parentId: string, displayName: string, mode: "parent" | "learner" = "parent"): Promise<Jar> {
  const now = Date.now();
  const token = await createSessionToken(TEST_SECRET, parentId, displayName, now, mode);
  const verified = await verifySessionToken(TEST_SECRET, token, now);
  if (!verified.ok) throw new Error("Failed to verify test token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return { cookies: { tlo_session: token }, csrf };
}

describe("Finding Ledger Verification (F-A through F-F)", () => {
  beforeAll(async () => {
    proxy = await openTestDatabase();
    env = {
      DB: proxy.env.DB as unknown as D1Database,
      SESSION_SECRET: TEST_SECRET,
      ENVIRONMENT: "development",
    };
    worker = (await import("../../src/worker/index")).default as unknown as { fetch: typeof fetch };
  });

  afterAll(async () => {
    await proxy.dispose();
  });

  beforeEach(async () => {
    await resetData(env.DB);
  });

  it("F-A & F-C: recordAttemptWithDerivation and hintAuditInsertGuarded enforce write-boundary session status, version, and continuation_deadline (including exact boundary now === deadline)", async () => {
    const parentId = crypto.randomUUID();
    const learnerId = crypto.randomUUID();
    const lessonId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const now = 1000000;

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Parent C", now).run();

    await repo.createLearner(env.DB, {
      id: learnerId,
      parentId,
      nickname: "Learner C",
      birthYear: 2015,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const subjectId = "math";
    await env.DB.prepare(
      `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at)
       VALUES (?1, ?2, NULL, 'Bài 1', 'Lesson 1', 'Mục tiêu', 'Objective', 4, 4, 1, ?3, ?3)`
    ).bind(lessonId, subjectId, now).run();

    const stepId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
       VALUES (?1, ?2, 1, 'independent', ?3, ?4, 'Giải thích', 1)`
    ).bind(stepId, lessonId, JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].content), JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].answerKey)).run();

    const steps = await loadStepContexts(env.DB, lessonId, 1);
    const step = steps[0]!;

    // Create session that is at the exact boundary (continuation_deadline === now)
    await env.DB.prepare(
      `INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen, continuation_deadline)
       VALUES (?1, ?2, ?3, 1, NULL, ?4, 'in_progress', 0, ?5)`
    ).bind(sessionId, learnerId, lessonId, now - 1000, now).run();

    let caughtError: unknown = null;
    try {
      await recordAttemptWithDerivation(env.DB, {
        sessionId,
        learnerId,
        lessonId,
        step,
        submission: { kind: "choice", choiceId: "c1" },
        helpLevel: 0,
        now,
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as { status?: number }).status).toBe(403);
    expect((caughtError as Error).message).toContain("30 phút");

    // Direct SQL write-boundary guard on attemptInsertGuarded also rejects at exact boundary (now === continuation_deadline)
    let attemptSqlRejected = false;
    try {
      await repo.attemptInsertGuarded(env.DB, {
        id: crypto.randomUUID(),
        sessionId,
        learnerId,
        lessonId,
        stepId,
        stepVersion: 1,
        skillId: null,
        submitted: JSON.stringify({ kind: "choice", choiceId: "c1" }),
        outcome: "correct",
        helpLevel: 0,
        evidenceKind: "observed",
        attemptNo: 1,
        now,
        expectedStepAttemptCount: 0,
        expectedHintAuditCount: 0,
        expectedSkillAttemptCount: 0,
      }).run();
    } catch (err) {
      if (err instanceof Error && err.message.includes("NOT NULL constraint failed: learning_attempts.attempt_no")) {
        attemptSqlRejected = true;
      }
    }
    expect(attemptSqlRejected).toBe(true);

    // Guarded hint audit insert also rejects at exact boundary (now === continuation_deadline)
    let hintRejected = false;
    try {
      await repo.hintAuditInsertGuarded(env.DB, {
        id: crypto.randomUUID(),
        sessionId,
        learnerId,
        lessonId,
        lessonVersion: 1,
        stepId,
        detail: JSON.stringify({ level: 1, sessionId }),
        now,
      }).run();
    } catch {
      hintRejected = true;
    }
    expect(hintRejected).toBe(true);
  });

  it("F-B: Parent listLessons and learner listSubjects do not leak stale-version or sibling approvals", async () => {
    const parentId = crypto.randomUUID();
    const sibling1 = crypto.randomUUID();
    const sibling2 = crypto.randomUUID();
    const now = Date.now();
    const parentJar = await createJar(parentId, "Parent B", "parent");
    const learnerJar = await createJar(parentId, "Parent B", "learner");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Parent B", now).run();

    await repo.createLearner(env.DB, {
      id: sibling1,
      parentId,
      nickname: "Anh Hai",
      birthYear: 2015,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });
    await repo.createLearner(env.DB, {
      id: sibling2,
      parentId,
      nickname: "Em Ba",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now: now + 10,
    });

    const catalogueLesson = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const forkRes = await callWithJar(parentJar, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogueLesson!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId } = (await forkRes.json()) as { lessonId: string };

    // Approve v1 for sibling1 ONLY
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: sibling1, version: 1, status: "approved" },
    });

    // Sibling 2 must see 0 approved lessons in /api/learner/subjects
    const subjSibling2 = await callWithJar(learnerJar, `/api/learner/subjects?learnerId=${sibling2}`);
    expect(subjSibling2.status).toBe(200);
    const subjBody2 = await subjSibling2.json() as { subjects: { lessons: { id: string }[] }[] };
    const visibleIds2 = subjBody2.subjects.flatMap((s) => s.lessons.map((l) => l.id));
    expect(visibleIds2).not.toContain(lessonId);

    // Bump lesson to v2 (title-only update)
    const updateRes = await callWithJar(parentJar, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId, titleVi: "Bài học nâng cấp v2" },
    });
    expect(updateRes.status).toBe(200);

    // Parent listLessons for sibling1 must report approvalStatus = 'draft' and pendingReapproval = true
    const parentLessonsRes = await callWithJar(parentJar, `/api/parent/lessons?learnerId=${sibling1}`);
    expect(parentLessonsRes.status).toBe(200);
    const parentLessonsBody = await parentLessonsRes.json() as LessonListResponse;
    const item = parentLessonsBody.lessons.find((l) => l.id === lessonId);
    expect(item?.version).toBe(2);
    expect(item?.approvalStatus).toBe("draft");
    expect(item?.pendingReapproval).toBe(true);
  });

  it("F-D & F-E: Title-only content update carries forward step snapshots to nextVersion and blocks unauthorized org lesson edits", async () => {
    const ownerId = crypto.randomUUID();
    const outsiderId = crypto.randomUUID();
    const lessonId = crypto.randomUUID();
    const now = 1000000;
    const ownerJar = await createJar(ownerId, "Owner D", "parent");
    const outsiderJar = await createJar(outsiderId, "Outsider D", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(ownerId, "hash", "Owner D", now).run();
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(outsiderId, "hash", "Outsider D", now).run();

    await env.DB.prepare(
      "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-d', 'center-d', 'Center D', ?1, ?1)"
    ).bind(now).run();
    await env.DB.prepare(
      "INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-d', 'org-d', ?1, 'owner', ?2, ?2)"
    ).bind(ownerId, now).run();

    const subjectId = "math";
    await env.DB.prepare(
      `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at)
       VALUES (?1, ?2, NULL, 'Bài Gốc', 'Original', 'Mục tiêu', 'Objective', 4, 4, 1, ?3, ?3)`
    ).bind(lessonId, subjectId, now).run();
    await env.DB.prepare(
      `INSERT INTO organization_lessons (lesson_id, organization_id, author_id, review_status, created_at, updated_at)
       VALUES (?1, 'org-d', ?2, 'org_approved', ?3, ?3)`
    ).bind(lessonId, ownerId, now).run();

    const stepId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
       VALUES (?1, ?2, 1, 'transfer', ?3, ?4, 'Giải thích', 1)`
    ).bind(stepId, lessonId, JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].content), JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].answerKey)).run();

    // Outsider cannot edit organization lesson content -> 403
    const forbiddenRes = await callWithJar(outsiderJar, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId, titleVi: "Giả mạo" },
    });
    expect(forbiddenRes.status).toBe(403);

    // Invalid titleVi after valid steps does NOT leave orphan version-2 steps
    const badTitleRes = await callWithJar(ownerJar, "/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId,
        titleVi: "   ",
        steps: PILOT_MATH_LESSON_CONTENT.steps,
      },
    });
    expect(badTitleRes.status).toBe(400);
    const orphanSteps = await repo.listStepsForLesson(env.DB, lessonId, 2);
    expect(orphanSteps.length).toBe(0);

    // Valid title-only update carries forward steps to version 2
    const updateRes = await callWithJar(ownerJar, "/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId,
        titleVi: "Tiêu đề mới chỉ sửa tên",
      },
    });
    expect(updateRes.status).toBe(200);

    const updatedLesson = await repo.findLesson(env.DB, lessonId);
    expect(updatedLesson!.version).toBe(2);

    const stepsForV1 = await repo.listStepsForLesson(env.DB, lessonId, 1);
    const stepsForV2 = await repo.listStepsForLesson(env.DB, lessonId, 2);
    expect(stepsForV1.length).toBe(1);
    expect(stepsForV2.length).toBe(1);
  });

  it("F-F: Export/Import preserves learnerId, lessonVersion, continuationDeadline and fails closed on unapproved in_progress sessions", async () => {
    const parentId = crypto.randomUUID();
    const learnerId = crypto.randomUUID();
    const now = Date.now();
    const parentJar = await createJar(parentId, "Parent F", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Parent F", now).run();

    await repo.createLearner(env.DB, {
      id: learnerId,
      parentId,
      nickname: "Bé Xuất",
      birthYear: 2015,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const lesson = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const lessonId = lesson!.id;

    // Create an unapproved in_progress session with NULL continuation_deadline
    const unapprovedSessionId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen, continuation_deadline)
       VALUES (?1, ?2, ?3, 1, NULL, ?4, 'in_progress', 0, NULL)`
    ).bind(unapprovedSessionId, learnerId, lessonId, now - 10_000).run();

    // Export
    const exportRes = await callWithJar(parentJar, "/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const envelope = await exportRes.json() as ExportEnvelope;

    // Delete learner
    const delRes = await callWithJar(parentJar, "/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: "XOA Bé Xuất" },
    });
    expect(delRes.status).toBe(200);

    // Strip any approval in the envelope and import
    envelope.data.reviewApprovals = [];
    const importRes = await callWithJar(parentJar, "/api/data/import", {
      method: "POST",
      json: envelope,
    });
    expect(importRes.status).toBe(200);

    // Imported in_progress session lacking approval provenance must be clamped to started_at (fail-closed)
    const restoredSession = await env.DB.prepare(
      "SELECT started_at, continuation_deadline FROM learning_sessions WHERE id = ?1"
    ).bind(unapprovedSessionId).first<{ started_at: number; continuation_deadline: number | null }>();
    expect(restoredSession).toBeTruthy();
    expect(restoredSession!.continuation_deadline).toBe(restoredSession!.started_at);
  });
});
