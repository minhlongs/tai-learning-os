import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import * as repo from "../../src/worker/db/repositories";
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

describe("Family Practice Lessons, Mastery Isolation, and Version-Safe Backup", () => {
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

  it("refuses direct catalogue edits, forks a family practice lesson with pinned lineage, and isolates families", async () => {
    const parentA = crypto.randomUUID();
    const parentB = crypto.randomUUID();
    const learnerA = crypto.randomUUID();
    const now = Date.now();
    const jarA = await createJar(parentA, "Phụ huynh A", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentA, "hash", "Phụ huynh A", now).run();
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentB, "hash", "Phụ huynh B", now).run();

    await repo.createLearner(env.DB, {
      id: learnerA,
      parentId: parentA,
      nickname: "Bé An",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const catalogue = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const catalogueId = catalogue!.id;

    // Direct edit of the catalogue lesson is refused before any mutation.
    const catalogueEdit = await callWithJar(jarA, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId: catalogueId, titleVi: "Sửa trộm thư viện" },
    });
    expect(catalogueEdit.status).toBe(403);
    expect((await repo.findLesson(env.DB, catalogueId))!.title_vi).not.toBe("Sửa trộm thư viện");

    // Forking a catalogue lesson creates a family practice copy with lineage.
    const forkRes = await callWithJar(jarA, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogueId },
    });
    expect(forkRes.status).toBe(200);
    const forkBody = (await forkRes.json()) as {
      lessonId: string;
      version: number;
      ownershipType: string;
      purpose: string;
      sourceLessonId: string;
      sourceVersion: number;
    };
    expect(forkBody.ownershipType).toBe("family");
    expect(forkBody.purpose).toBe("practice");
    expect(forkBody.version).toBe(1);
    expect(forkBody.sourceLessonId).toBe(catalogueId);
    expect(forkBody.sourceVersion).toBeGreaterThanOrEqual(1);

    const forked = (await repo.findLesson(env.DB, forkBody.lessonId))!;
    expect(forked.ownership_type).toBe("family");
    expect(forked.owner_parent_id).toBe(parentA);
    expect(forked.purpose).toBe("practice");
    expect(forked.source_lesson_id).toBe(catalogueId);

    const catalogueSteps = await repo.listStepsForLesson(env.DB, catalogueId, forked.source_version ?? 1);
    const forkedSteps = await repo.listStepsForLesson(env.DB, forkBody.lessonId, 1);
    expect(forkedSteps.length).toBe(catalogueSteps.length);
    expect(forkedSteps.map((s) => s.source_step_id).sort()).toEqual(
      catalogueSteps.map((s) => s.id).sort(),
    );

    // No approval, attempt, or mastery row is carried over.
    const copiedApprovals = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM review_approvals WHERE lesson_id = ?1"
    ).bind(forkBody.lessonId).first<{ n: number }>();
    expect(copiedApprovals?.n).toBe(0);
    const copiedAttempts = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE lesson_id = ?1"
    ).bind(forkBody.lessonId).first<{ n: number }>();
    expect(copiedAttempts?.n).toBe(0);

    // Forking an organization or existing family lesson is refused.
    await env.DB.prepare(
      `INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-m10', 'center-m10', 'Center M10', ?1, ?1)`
    ).bind(now).run();
    const orgLessonId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, ownership_type, purpose, created_at, updated_at)
       VALUES (?1, 'math', NULL, 'Bài trung tâm', 'Org lesson', 'Mục tiêu', 'Objective', 4, 4, 1, 'organization', 'official', ?2, ?2)`
    ).bind(orgLessonId, now).run();
    await env.DB.prepare(
      `INSERT INTO organization_lessons (lesson_id, organization_id, author_id, review_status, created_at, updated_at)
       VALUES (?1, 'org-m10', ?2, 'org_approved', ?3, ?3)`
    ).bind(orgLessonId, parentA, now).run();

    const forkOrg = await callWithJar(jarA, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: orgLessonId },
    });
    expect(forkOrg.status).toBe(403);

    const forkFamily = await callWithJar(jarA, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: forkBody.lessonId },
    });
    expect(forkFamily.status).toBe(403);

    // A different family cannot list, detail, edit, approve, or export the fork.
    const jarB = await createJar(parentB, "Phụ huynh B", "parent");
    const listB = await callWithJar(jarB, "/api/parent/lessons");
    const listBodyB = (await listB.json()) as LessonListResponse;
    expect(listBodyB.lessons.some((l) => l.id === forkBody.lessonId)).toBe(false);

    const detailB = await callWithJar(jarB, `/api/parent/lessons/${forkBody.lessonId}`);
    expect([403, 404]).toContain(detailB.status);

    const editB = await callWithJar(jarB, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId: forkBody.lessonId, titleVi: "Xâm nhập" },
    });
    expect(editB.status).toBe(403);

    const approveB = await callWithJar(jarB, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: forkBody.lessonId, version: 1, status: "approved" },
    });
    expect([403, 404]).toContain(approveB.status);

    // The owning parent can edit its own fork with a matching expectedVersion.
    const editA = await callWithJar(jarA, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId: forkBody.lessonId, expectedVersion: 1, titleVi: "Bản luyện tập của An" },
    });
    expect(editA.status).toBe(200);
    const edited = (await repo.findLesson(env.DB, forkBody.lessonId))!;
    expect(edited.version).toBe(2);
    const v2Steps = await repo.listStepsForLesson(env.DB, forkBody.lessonId, 2);
    expect(v2Steps.map((s) => s.source_step_id).sort()).toEqual(
      catalogueSteps.map((s) => s.id).sort(),
    );

    // The catalogue lesson is untouched by the fork and by the family edit.
    const catalogueAfter = (await repo.findLesson(env.DB, catalogueId))!;
    expect(catalogueAfter.version).toBe(1);
    expect(catalogueAfter.ownership_type).toBe("catalogue");
  });

  it("grades practice sessions normally while keeping official mastery, evidence, and review untouched", async () => {
    const parentId = crypto.randomUUID();
    const learnerId = crypto.randomUUID();
    const now = Date.now();
    const jar = await createJar(parentId, "Phụ huynh luyện tập", "parent");
    const learnerJar = await createJar(parentId, "Phụ huynh luyện tập", "learner");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Phụ huynh luyện tập", now).run();
    await repo.createLearner(env.DB, {
      id: learnerId,
      parentId,
      nickname: "Bé Bình",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const catalogue = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const forkRes = await callWithJar(jar, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogue!.id },
    });
    const forkBody = (await forkRes.json()) as { lessonId: string };
    const practiceLessonId = forkBody.lessonId;

    const approveRes = await callWithJar(jar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: practiceLessonId, version: 1, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: practiceLessonId },
    });
    expect(startRes.status).toBe(200);
    const started = (await startRes.json()) as {
      sessionId: string;
      steps: { id: string; content: Record<string, unknown> }[];
    };
    // The learner payload never carries any answer field.
    const answerFields = ["correctChoiceId", "correct", "correctNumerator", "correctDenominator"];
    for (const step of started.steps) {
      for (const field of answerFields) {
        expect(step.content[field]).toBeUndefined();
      }
    }

    const step = (await repo.listStepsForLesson(env.DB, practiceLessonId, 1))[0]!;
    const answer = JSON.parse(step.answer_key) as { choiceId?: string; correctChoiceId?: string };
    const correctChoice = answer.choiceId ?? answer.correctChoiceId ?? "c2";

    const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: step.id,
        submission: { kind: "choice", choiceId: correctChoice },
      },
    });
    expect(attemptRes.status).toBe(200);
    const attemptBody = (await attemptRes.json()) as { outcome: string; explanationVi?: string };
    expect(attemptBody.outcome).toBe("correct");

    const storedAttempt = await env.DB.prepare(
      "SELECT purpose, evidence_kind, help_level FROM learning_attempts WHERE session_id = ?1"
    ).bind(started.sessionId).first<{ purpose: string; evidence_kind: string; help_level: number }>();
    expect(storedAttempt?.purpose).toBe("practice");
    // Purpose is decided by the server: a practice attempt can never earn
    // independent evidence, even when the learner used no hint and was correct.
    expect(storedAttempt?.evidence_kind).toBe("assisted");

    const storedSession = await env.DB.prepare(
      "SELECT purpose FROM learning_sessions WHERE id = ?1"
    ).bind(started.sessionId).first<{ purpose: string }>();
    expect(storedSession?.purpose).toBe("practice");

    // No mastery derivation and no spaced-review row is created from practice.
    const evidence = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM skill_evidence WHERE learner_id = ?1"
    ).bind(learnerId).first<{ n: number }>();
    expect(evidence?.n).toBe(0);
    const review = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM review_schedule WHERE learner_id = ?1"
    ).bind(learnerId).first<{ n: number }>();
    expect(review?.n).toBe(0);

    // The dashboard counts practice separately and never as independent work.
    const dashboardRes = await callWithJar(jar, "/api/parent/dashboard");
    expect(dashboardRes.status).toBe(200);
    const dashboard = (await dashboardRes.json()) as {
      stats: {
        independentAttempts: number;
        assistedAttempts: number;
        practiceAttemptCount: number;
        practiceSessionCount: number;
      };
      needsAttention: unknown[];
    };
    expect(dashboard.stats.independentAttempts).toBe(0);
    expect(dashboard.stats.assistedAttempts).toBe(0);
    expect(dashboard.stats.practiceAttemptCount).toBe(1);
    expect(dashboard.stats.practiceSessionCount).toBe(1);

    // Practice never feeds baseline assessment, planning, or recommendations.
    await env.DB.prepare(
      `INSERT OR REPLACE INTO subjects (id, name_vi, name_en, sort, active) VALUES ('math', 'Toán', 'Math', 1, 1)`
    ).run();
    const baselineRes = await callWithJar(jar, "/api/parent/baseline", {
      method: "POST",
      json: { subjectId: "math" },
    });
    expect([200, 201]).toContain(baselineRes.status);
    const baselineList = await callWithJar(jar, "/api/parent/baseline");
    expect(baselineList.status).toBe(200);
    const baselines = (await baselineList.json()) as { assessments?: { subjectId: string }[] };
    // No practice evidence means nothing is observed, so nothing is diagnosed.
    for (const assessment of baselines.assessments ?? []) {
      expect(assessment.subjectId).toBeTruthy();
    }

    const planRes = await callWithJar(jar, "/api/parent/planner/generate", {
      method: "POST",
      json: { learnerId },
    });
    if (planRes.status === 200) {
      const plan = (await planRes.json()) as { items?: { lessonId?: string | null }[] };
      expect((plan.items ?? []).every((i) => i.lessonId !== practiceLessonId)).toBe(true);
    }

    const dashboard2 = (await (await callWithJar(jar, "/api/parent/dashboard")).json()) as {
      recommendedNextLessons: { lessonId?: string | null }[];
      needsAttention: unknown[];
    };
    expect(
      (dashboard2.recommendedNextLessons ?? []).every((r) => r.lessonId !== practiceLessonId),
    ).toBe(true);
    expect(dashboard2.needsAttention).toEqual([]);
  });

  it("exports only authorized version snapshots and refuses to overwrite a colliding lesson version", async () => {
    const parentId = crypto.randomUUID();
    const learnerId = crypto.randomUUID();
    const now = Date.now();
    const jar = await createJar(parentId, "Phụ huynh sao lưu", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Phụ huynh sao lưu", now).run();
    await repo.createLearner(env.DB, {
      id: learnerId,
      parentId,
      nickname: "Bé Sao",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const catalogue = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const forkRes = await callWithJar(jar, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogue!.id },
    });
    const { lessonId } = (await forkRes.json()) as { lessonId: string };

    // v1 snapshot and a real attempt at v1, then a v2 title-only edit.
    await callWithJar(jar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, version: 1, status: "approved" },
    });
    const learnerJar = await createJar(parentId, "Phụ huynh sao lưu", "learner");
    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(startRes.status).toBe(200);
    const started = (await startRes.json()) as { sessionId: string };
    const v1Step = (await repo.listStepsForLesson(env.DB, lessonId, 1))[0]!;
    const v1Answer = JSON.parse(v1Step.answer_key) as { choiceId?: string; correctChoiceId?: string };
    await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: v1Step.id,
        submission: { kind: "choice", choiceId: v1Answer.choiceId ?? v1Answer.correctChoiceId ?? "c2" },
      },
    });

    const bumpRes = await callWithJar(jar, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId, expectedVersion: 1, titleVi: "Tiêu đề phiên bản 2" },
    });
    expect(bumpRes.status).toBe(200);

    // Export carries both snapshots and both step versions.
    const exportRes = await callWithJar(jar, "/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const envelope = (await exportRes.json()) as ExportEnvelope;
    const versions = (envelope.data.lessonVersions ?? []).filter((v) => v.lessonId === lessonId);
    expect(versions.map((v) => v.version).sort()).toEqual([1, 2]);
    const stepVersions = new Set((envelope.data.lessonSteps ?? []).filter((s) => s.lessonId === lessonId).map((s) => s.contentVersion));
    expect([...stepVersions].sort()).toEqual([1, 2]);
    expect((envelope.data.learningSessions ?? []).some((s) => s.lessonId === lessonId)).toBe(true);
    expect((envelope.data.learningAttempts ?? []).some((a) => a.lessonId === lessonId)).toBe(true);
    const approval = (envelope.data.reviewApprovals ?? []).find((a) => a.lessonId === lessonId);
    expect(approval?.lessonVersion).toBe(1);

    // Delete the learner first so import can run on this parent account.
    const delRes = await callWithJar(jar, "/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: "XOA Bé Sao" },
    });
    expect(delRes.status).toBe(200);

    // A colliding import (modified title on an existing lesson/version in D1) is refused with 409 before anything is written.
    const colliding: ExportEnvelope = JSON.parse(JSON.stringify(envelope));
    colliding.data.lessons = colliding.data.lessons.map((l) =>
      l.id === lessonId ? { ...l, titleVi: "Tiêu đề xung đột" } : l,
    );
    const collisionRes = await callWithJar(jar, "/api/data/import", {
      method: "POST",
      json: colliding,
    });
    expect(collisionRes.status).toBe(409);
    expect((await repo.findLesson(env.DB, lessonId))!.title_vi).toBe("Tiêu đề phiên bản 2");

    // Restoring into another parent account when the family lesson ID is already owned by parentId also fails with 409.
    const outsiderParent = crypto.randomUUID();
    const outsiderJar = await createJar(outsiderParent, "Phụ huynh khác", "parent");
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(outsiderParent, "hash", "Phụ huynh khác", now).run();
    const outsiderCollisionRes = await callWithJar(outsiderJar, "/api/data/import", {
      method: "POST",
      json: envelope,
    });
    expect(outsiderCollisionRes.status).toBe(409);

    // Wipe the lesson from D1 to simulate restoring onto a clean database, then restore into jar.
    await env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(lessonId).run();
    await env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(lessonId).run();
    await env.DB.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(lessonId).run();
    await env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(lessonId).run();

    const restoreRes = await callWithJar(jar, "/api/data/import", {
      method: "POST",
      json: envelope,
    });
    expect(restoreRes.status).toBe(200);

    const restoredLesson = (await repo.findLesson(env.DB, lessonId))!;
    expect(restoredLesson.title_vi).toBe("Tiêu đề phiên bản 2");
    expect(restoredLesson.version).toBe(2);
    expect(restoredLesson.ownership_type).toBe("family");
    expect(restoredLesson.purpose).toBe("practice");
    expect(restoredLesson.source_lesson_id).toBe(catalogue!.id);
    const restoredV1 = await repo.listStepsForLesson(env.DB, lessonId, 1);
    const restoredV2 = await repo.listStepsForLesson(env.DB, lessonId, 2);
    expect(restoredV1.length).toBeGreaterThan(0);
    expect(restoredV2.length).toBe(restoredV1.length);
    expect(restoredV1[0]!.source_step_id).not.toBeNull();
    const restoredAttempt = await env.DB.prepare(
      "SELECT purpose, evidence_kind FROM learning_attempts WHERE lesson_id = ?1 LIMIT 1"
    ).bind(lessonId).first<{ purpose: string; evidence_kind: string }>();
    expect(restoredAttempt?.purpose).toBe("practice");
    expect(restoredAttempt?.evidence_kind).toBe("assisted");
  });

  it("does not leak an organization lesson version to a former member's learner", async () => {
    const ownerId = crypto.randomUUID();
    const memberId = crypto.randomUUID();
    const ownerLearnerId = crypto.randomUUID();
    const exLearnerId = crypto.randomUUID();
    const now = Date.now();
    const ownerJar = await createJar(ownerId, "Chủ trung tâm", "parent");
    const memberJar = await createJar(memberId, "Giáo viên cũ", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(ownerId, "hash", "Chủ trung tâm", now).run();
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(memberId, "hash", "Giáo viên cũ", now).run();

    await env.DB.prepare(
      "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-leak', 'center-leak', 'Center Leak', ?1, ?1)"
    ).bind(now).run();
    await env.DB.prepare(
      "INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-owner', 'org-leak', ?1, 'owner', ?2, ?2)"
    ).bind(ownerId, now).run();
    await env.DB.prepare(
      "INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at) VALUES ('mem-ex', 'org-leak', ?1, 'teacher', ?2, ?2)"
    ).bind(memberId, now).run();

    await repo.createLearner(env.DB, {
      id: ownerLearnerId,
      parentId: ownerId,
      nickname: "Bé Chủ",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });
    await repo.createLearner(env.DB, {
      id: exLearnerId,
      parentId: memberId,
      nickname: "Bé Cũ",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const lessonId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, ownership_type, purpose, created_at, updated_at)
       VALUES (?1, 'math', NULL, 'Bài trung tâm L1', 'Org', 'Mục tiêu', 'Objective', 4, 4, 1, 'organization', 'official', ?2, ?2)`
    ).bind(lessonId, now).run();
    await env.DB.prepare(
      `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
       VALUES (?1, 1, 'Bài trung tâm L1', 'Org', 'Mục tiêu', 'Objective', ?2)`
    ).bind(lessonId, now).run();
    const stepId = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
       VALUES (?1, ?2, 1, 'transfer', ?3, ?4, 'Giải thích', 1)`
    ).bind(
      stepId,
      lessonId,
      JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].content),
      JSON.stringify(PILOT_MATH_LESSON_CONTENT.steps[0].answerKey),
    ).run();
    await env.DB.prepare(
      `INSERT INTO organization_lessons (lesson_id, organization_id, author_id, review_status, created_at, updated_at)
       VALUES (?1, 'org-leak', ?2, 'org_approved', ?3, ?3)`
    ).bind(lessonId, ownerId, now).run();

    // Create classroom, enroll both learners with active consent, and assign the org lesson to the classroom.
    await env.DB.prepare(
      `INSERT INTO classrooms (id, organization_id, name, grade, subject_id, created_at, updated_at)
       VALUES ('cls-leak', 'org-leak', 'Lớp Toán 4', 4, 'math', ?1, ?1)`
    ).bind(now).run();
    for (const [lId, pId] of [[ownerLearnerId, ownerId], [exLearnerId, memberId]] as const) {
      await env.DB.prepare(
        `INSERT INTO learner_consents (id, organization_id, learner_id, granted_by, status, granted_at, revoked_at)
         VALUES (?1, 'org-leak', ?2, ?3, 'active', ?4, NULL)`
      ).bind(`con-${lId}`, lId, pId, now).run();
      await env.DB.prepare(
        `INSERT INTO classroom_enrollments (id, classroom_id, learner_id, status, created_at, updated_at)
         VALUES (?1, 'cls-leak', ?2, 'enrolled', ?3, ?3)`
      ).bind(`enr-${lId}`, lId, now).run();
    }
    await env.DB.prepare(
      `INSERT INTO classroom_lesson_assignments (id, classroom_id, lesson_id, assigned_by, assigned_at, due_at)
       VALUES ('asgn-leak', 'cls-leak', ?1, ?2, ?3, NULL)`
    ).bind(lessonId, ownerId, now).run();

    // While enrolled & assigned, the lesson is visible and exportable.
    const beforeExport = await callWithJar(memberJar, "/api/data/export", { method: "POST" });
    expect(beforeExport.status).toBe(200);
    const beforeEnvelope = (await beforeExport.json()) as ExportEnvelope;
    expect((beforeEnvelope.data.lessons ?? []).some((l) => l.id === lessonId)).toBe(true);

    // Record a v1 approval for exLearnerId while still enrolled, then withdraw enrollment and bump the org lesson to v2.
    await callWithJar(memberJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, learnerId: exLearnerId, version: 1, status: "approved" },
    });

    await env.DB.prepare(
      "UPDATE classroom_enrollments SET status = 'withdrawn' WHERE learner_id = ?1"
    ).bind(exLearnerId).run();
    await env.DB.prepare("DELETE FROM organization_members WHERE id = 'mem-ex'").run();

    const v2Res = await callWithJar(ownerJar, "/api/parent/lessons/content", {
      method: "POST",
      json: { lessonId, expectedVersion: 1, titleVi: "Bài trung tâm L1 (Nội bộ v2)" },
    });
    expect(v2Res.status).toBe(200);
    // Center owner approves v2 at the organization level and re-assigns v2 to the classroom so enrolled learners see v2.
    await env.DB.prepare(
      "UPDATE organization_lessons SET review_status = 'org_approved' WHERE lesson_id = ?1"
    ).bind(lessonId).run();
    await env.DB.prepare(
      "UPDATE classroom_lesson_assignments SET assigned_version = 2 WHERE id = 'asgn-leak'"
    ).bind().run();

    // The withdrawn learner's export only carries the historical v1 snapshot referenced by their v1 approval — NEVER v2!
    const afterExport = await callWithJar(memberJar, "/api/data/export", { method: "POST" });
    expect(afterExport.status).toBe(200);
    const afterEnvelope = (await afterExport.json()) as ExportEnvelope;
    const afterVersions = (afterEnvelope.data.lessonVersions ?? []).filter((v) => v.lessonId === lessonId);
    expect(afterVersions.map((v) => v.version)).toEqual([1]);
    expect(afterVersions[0]?.titleVi).toBe("Bài trung tâm L1");
    const afterSteps = (afterEnvelope.data.lessonSteps ?? []).filter((s) => s.lessonId === lessonId);
    expect(afterSteps.every((s) => s.contentVersion === 1)).toBe(true);
    const afterLessonHeader = (afterEnvelope.data.lessons ?? []).find((l) => l.id === lessonId);
    expect(afterLessonHeader?.version).toBe(1);
    expect(afterLessonHeader?.titleVi).toBe("Bài trung tâm L1");

    // If the historical v1 snapshot row in lesson_versions is absent for a non-visible lesson,
    // exportRecord omits the lesson rather than falling back to live v2 title/version.
    await env.DB.prepare(
      "DELETE FROM lesson_versions WHERE lesson_id = ?1 AND version = 1"
    ).bind(lessonId).run();
    const missingSnapExport = await callWithJar(memberJar, "/api/data/export", { method: "POST" });
    expect(missingSnapExport.status).toBe(200);
    const missingSnapEnvelope = (await missingSnapExport.json()) as ExportEnvelope;
    expect((missingSnapEnvelope.data.lessons ?? []).some((l) => l.id === lessonId)).toBe(false);

    // The enrolled owner learner's export carries the current v2 snapshot.
    const ownerExport = await callWithJar(ownerJar, "/api/data/export", { method: "POST" });
    expect(ownerExport.status).toBe(200);
    const ownerEnvelope = (await ownerExport.json()) as ExportEnvelope;
    const ownerVersions = (ownerEnvelope.data.lessonVersions ?? []).filter((v) => v.lessonId === lessonId);
    expect(ownerVersions.some((v) => v.version === 2)).toBe(true);
  });

  it("blocks global catalogue/shared metadata injection and mastery-isolation bypass during parent import", async () => {
    const parentId = crypto.randomUUID();
    const learnerId = crypto.randomUUID();
    const now = Date.now();
    const jar = await createJar(parentId, "Phụ huynh Kiểm thử", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)"
    ).bind(parentId, "hash", "Phụ huynh Kiểm thử", now).run();
    await repo.createLearner(env.DB, {
      id: learnerId,
      parentId,
      nickname: "Bé Bảo Mật",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const exportRes = await callWithJar(jar, "/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const baseEnvelope = (await exportRes.json()) as ExportEnvelope;

    await callWithJar(jar, "/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: "XOA Bé Bảo Mật" },
    });

    // 1. Attempting to inject a brand-new 'catalogue' lesson via import fails with 409.
    const injectedCatalogue: ExportEnvelope = JSON.parse(JSON.stringify(baseEnvelope));
    injectedCatalogue.data.lessons.push({
      ...injectedCatalogue.data.lessons[0]!,
      id: "injected-global-cat-1",
      ownershipType: "catalogue",
      purpose: "official",
    });
    const injCatRes = await callWithJar(jar, "/api/data/import", {
      method: "POST",
      json: injectedCatalogue,
    });
    expect(injCatRes.status).toBe(409);
    expect(await repo.findLesson(env.DB, "injected-global-cat-1")).toBeNull();

    // 2. Attempting to inject a new version/step into an existing catalogue lesson fails with 409.
    const targetCat = baseEnvelope.data.lessons[0]!;
    const injectedCatVersion: ExportEnvelope = JSON.parse(JSON.stringify(baseEnvelope));
    injectedCatVersion.data.lessons = injectedCatVersion.data.lessons.map((l) =>
      l.id === targetCat.id ? { ...l, version: 2 } : l,
    );
    injectedCatVersion.data.lessonVersions = [
      ...(injectedCatVersion.data.lessonVersions ?? []),
      {
        lessonId: targetCat.id,
        version: 2,
        titleVi: "Phiên bản giả mạo v2",
        titleEn: "",
        objectiveVi: "Mục tiêu giả mạo",
        objectiveEn: "",
        createdAt: now,
      },
    ];
    const injVerRes = await callWithJar(jar, "/api/data/import", {
      method: "POST",
      json: injectedCatVersion,
    });
    expect(injVerRes.status).toBe(409);

    // 3. Attempting to tamper shared lesson_metadata (isBaseline) on a valid import is ignored for shared catalogue lessons.
    const metaTamper: ExportEnvelope = JSON.parse(JSON.stringify(baseEnvelope));
    metaTamper.data.lessonMetadata = (metaTamper.data.lessonMetadata ?? []).map((m) =>
      m.lessonId === targetCat.id ? { ...m, isBaseline: 1, reviewRecommendationVi: "Tampered" } : m,
    );
    const metaRes = await callWithJar(jar, "/api/data/import", {
      method: "POST",
      json: metaTamper,
    });
    expect(metaRes.status).toBe(200);
    const catMetaRow = await env.DB.prepare(
      "SELECT review_recommendation_vi FROM lesson_metadata WHERE lesson_id = ?1"
    ).bind(targetCat.id).first<{ review_recommendation_vi: string | null }>();
    expect(catMetaRow?.review_recommendation_vi).not.toBe("Tampered");
  });

  it("schedules owned family practice lessons in the 4-week planner, preserves them across official plan regeneration, and round-trips via export/import", async () => {
    const parentA = crypto.randomUUID();
    const parentB = crypto.randomUUID();
    const learnerA = crypto.randomUUID();
    const now = Date.now();
    const jarA = await createJar(parentA, "Phụ huynh Lịch học", "parent");

    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4), (?5, ?2, ?6, ?4, ?4)"
    ).bind(parentA, "hash", "Phụ huynh A", now, parentB, "Phụ huynh B").run();

    await repo.createLearner(env.DB, {
      id: learnerA,
      parentId: parentA,
      nickname: "Bé Kiên",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now,
    });

    const catLesson = await env.DB.prepare("SELECT id FROM lessons WHERE ownership_type = 'catalogue' LIMIT 1").first<{ id: string }>();
    const catLessonId = catLesson!.id;

    // Fork a family practice lesson for parentA
    const forkRes = await callWithJar(jarA, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catLessonId, titleVi: "Bài luyện tập phân số tối thứ Tư" },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId: practiceLessonId } = (await forkRes.json()) as { lessonId: string };

    // Fork a family practice lesson for parentB (foreign family)
    const jarB = await createJar(parentB, "Phụ huynh B", "parent");
    const forkBRes = await callWithJar(jarB, "/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catLessonId, titleVi: "Bài riêng gia đình B" },
    });
    expect(forkBRes.status).toBe(200);
    const { lessonId: foreignPracticeId } = (await forkBRes.json()) as { lessonId: string };

    // Refuses scheduling a catalogue lesson as practice (403)
    const scheduleCatRes = await callWithJar(jarA, "/api/parent/planner/schedule-practice", {
      method: "POST",
      json: { learnerId: learnerA, lessonId: catLessonId, weekIndex: 1, dayOfWeek: 3 },
    });
    expect(scheduleCatRes.status).toBe(403);

    // Refuses scheduling another family's practice lesson (403)
    const scheduleForeignRes = await callWithJar(jarA, "/api/parent/planner/schedule-practice", {
      method: "POST",
      json: { learnerId: learnerA, lessonId: foreignPracticeId, weekIndex: 1, dayOfWeek: 3 },
    });
    expect(scheduleForeignRes.status).toBe(403);

    // Schedules owned family practice lesson into Week 2, Day 4
    const scheduleRes = await callWithJar(jarA, "/api/parent/planner/schedule-practice", {
      method: "POST",
      json: {
        learnerId: learnerA,
        lessonId: practiceLessonId,
        weekIndex: 2,
        dayOfWeek: 4,
        durationMinutes: 20,
        parentNote: "Làm cùng bố 20 phút",
      },
    });
    expect(scheduleRes.status).toBe(200);
    const scheduleBody = (await scheduleRes.json()) as {
      items: { id: string; lessonId: string | null; itemKind: string; purpose?: string; lessonTitleVi: string | null }[];
      availablePracticeLessons?: { id: string; titleVi: string }[];
    };
    const practiceItem = scheduleBody.items.find((i) => i.lessonId === practiceLessonId);
    expect(practiceItem).toBeDefined();
    expect(practiceItem?.itemKind).toBe("practice");
    expect(practiceItem?.purpose).toBe("practice");
    expect(practiceItem?.lessonTitleVi).toBe("Bài luyện tập phân số tối thứ Tư");
    expect(scheduleBody.availablePracticeLessons?.some((l) => l.id === practiceLessonId)).toBe(true);
    expect(scheduleBody.availablePracticeLessons?.some((l) => l.id === foreignPracticeId)).toBe(false);

    // Regenerating the official 4-week plan preserves the scheduled practice item and never auto-schedules practice lessons as 'lesson'
    const genRes = await callWithJar(jarA, "/api/parent/planner/generate", {
      method: "POST",
      json: { learnerId: learnerA, sessionsPerWeek: 4, sessionDurationMinutes: 15 },
    });
    expect(genRes.status).toBe(200);
    const genBody = (await genRes.json()) as {
      items: { id: string; lessonId: string | null; itemKind: string; purpose?: string }[];
    };
    expect(genBody.items.some((i) => i.id === practiceItem!.id && i.itemKind === "practice")).toBe(true);
    expect(genBody.items.some((i) => i.lessonId === practiceLessonId && i.itemKind === "lesson")).toBe(false);

    // Export -> Delete learner -> Import preserves the scheduled practice item
    const expRes = await callWithJar(jarA, "/api/data/export", { method: "POST" });
    expect(expRes.status).toBe(200);
    const envelope = (await expRes.json()) as ExportEnvelope;
    expect(
      (envelope.data.learningPlanItems ?? []).some(
        (i) => i.id === practiceItem!.id && i.itemKind === "practice" && i.lessonId === practiceLessonId,
      ),
    ).toBe(true);

    // Attempting to import a tampered practice item pointing to a catalogue lesson is rejected
    const tamperedPracticeItem: ExportEnvelope = JSON.parse(JSON.stringify(envelope));
    tamperedPracticeItem.data.learningPlanItems = (tamperedPracticeItem.data.learningPlanItems ?? []).map((i) =>
      i.id === practiceItem!.id ? { ...i, lessonId: catLessonId } : i,
    );
    await callWithJar(jarA, "/api/data/learner", {
      method: "DELETE",
      json: { learnerId: learnerA, confirmation: "XOA Bé Kiên" },
    });
    const badImpRes = await callWithJar(jarA, "/api/data/import", {
      method: "POST",
      json: tamperedPracticeItem,
    });
    expect(badImpRes.status).toBe(400);

    // Valid import succeeds and restores the scheduled practice item (under the newly assigned learnerId),
    // including when legacy/handcrafted practice lessons omit ownershipType while declaring purpose = 'practice'.
    const legacyStyleEnvelope: ExportEnvelope = JSON.parse(JSON.stringify(envelope));
    legacyStyleEnvelope.data.lessons = legacyStyleEnvelope.data.lessons.map((l) =>
      l.id === practiceLessonId ? { ...l, ownershipType: undefined } : l,
    );
    const goodImpRes = await callWithJar(jarA, "/api/data/import", {
      method: "POST",
      json: legacyStyleEnvelope,
    });
    expect(goodImpRes.status).toBe(200);

    const afterPlanRes = await callWithJar(jarA, "/api/parent/planner");
    expect(afterPlanRes.status).toBe(200);
    const afterPlan = (await afterPlanRes.json()) as {
      learnerId: string | null;
      items: { id: string; itemKind: string; lessonId: string | null; purpose?: string; status: string }[];
    };
    expect(
      afterPlan.items.some(
        (i) => i.id === practiceItem!.id && i.itemKind === "practice" && i.lessonId === practiceLessonId && i.purpose === "practice" && i.status === "scheduled",
      ),
    ).toBe(true);

    // Approve, start, and finalize a session on the scheduled practice lesson:
    // completing the session automatically marks the scheduled practice plan item 'completed'.
    const restoredLearnerId = afterPlan.learnerId!;
    const approvePracRes = await callWithJar(jarA, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: practiceLessonId, learnerId: restoredLearnerId, version: 1, status: "approved" },
    });
    expect(approvePracRes.status).toBe(200);

    const learnerJar = await createJar(parentA, "Phụ huynh A", "learner");
    const startPracRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: practiceLessonId, learnerId: restoredLearnerId },
    });
    expect(startPracRes.status).toBe(200);
    const { sessionId: pracSessionId } = (await startPracRes.json()) as { sessionId: string };

    const pracStep = (await repo.listStepsForLesson(env.DB, practiceLessonId, 1))[0]!;
    const pracAnswer = JSON.parse(pracStep.answer_key) as { choiceId?: string; correctChoiceId?: string };
    const pracCorrectChoice = pracAnswer.choiceId ?? pracAnswer.correctChoiceId ?? "c2";

    const pracAttemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: pracSessionId,
        stepId: pracStep.id,
        submission: { kind: "choice", choiceId: pracCorrectChoice },
      },
    });
    expect(pracAttemptRes.status).toBe(200);

    const finPracRes = await callWithJar(learnerJar, "/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: pracSessionId, learnerId: restoredLearnerId },
    });
    expect(finPracRes.status).toBe(200);

    const completedPlanRes = await callWithJar(jarA, "/api/parent/planner");
    expect(completedPlanRes.status).toBe(200);
    const completedPlan = (await completedPlanRes.json()) as {
      items: { id: string; status: string }[];
    };
    expect(completedPlan.items.find((i) => i.id === practiceItem!.id)?.status).toBe("completed");
  });
});
