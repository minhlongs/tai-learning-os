/**
 * Integration tests for Issue #3:
 *   1. Multi-learner session listing & `x-tlo-learner-id` header scoping across
 *      session, parent, learner, classroom-lessons, and export routes.
 *   2. Spaced review `reviewDue` enrichment (`lessonId` & `lessonTitleVi`) on
 *      `GET /api/learner/home`.
 *   3. Parent skill correction (`POST /api/parent/skills/correct`) scoped per
 *      selected learner.
 *   4. Grade 4 curriculum expansion (15 lessons across 3 subjects, including
 *      `math-fractions-compare`, `eng-home-vocabulary`, and `vie-story-lesson`).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { seedLessons } from "./lesson-seed";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import { leaksAnswer } from "../../src/shared/schemas/exercise";
import type {
  CreateLearnerResponse,
  ExportResponse,
  LearnerHomeResponse,
  LessonListResponse,
  ParentDashboardResponse,
  SessionInfo,
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
  init: RequestInit & { json?: unknown; learnerIdHeader?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(targetJar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  if (init.learnerIdHeader) {
    headers.set("x-tlo-learner-id", init.learnerIdHeader);
  }

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

describe("M4 UI Closure, Multi-Learner Header Scoping & Grade 4 Curriculum Expansion", () => {
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

  it("1. Enrolls a second learner and isolates session, approvals, dashboard, skill correction, and export via x-tlo-learner-id", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-1", "Mẹ Mẫu & Na", passHash, now)
      .run();

    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-mau", "parent-1", "Bé Mẫu", now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-1", "Mẹ Mẫu & Na", "parent");

    // Enrol a second learner via POST /api/parent/learners
    const createRes = await callWithJar(parentJar, "/api/parent/learners", {
      method: "POST",
      json: { nickname: "Bé Na", grade: 4 },
    });
    expect(createRes.status).toBe(200);
    const created = (await createRes.json()) as CreateLearnerResponse;
    const naId = created.learner.id;
    expect(created.learner.nickname).toBe("Bé Na");

    // GET /api/session lists both learners and switches active learner via x-tlo-learner-id
    const sessionDefaultRes = await callWithJar(parentJar, "/api/session");
    const sessionDefault = (await sessionDefaultRes.json()) as SessionInfo;
    expect(sessionDefault.learners).toHaveLength(2);
    expect(sessionDefault.learner?.id).toBe("learner-mau");

    const sessionNaRes = await callWithJar(parentJar, "/api/session", {
      learnerIdHeader: naId,
    });
    const sessionNa = (await sessionNaRes.json()) as SessionInfo;
    expect(sessionNa.learner?.id).toBe(naId);
    expect(sessionNa.learner?.nickname).toBe("Bé Na");

    // Approve math-fractions-compare ONLY for Bé Na via x-tlo-learner-id
    const approveRes = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      learnerIdHeader: naId,
      json: { lessonId: "math-fractions-compare", status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    // Check lesson list for Bé Na vs Bé Mẫu
    const lessonsNa = (await (
      await callWithJar(parentJar, "/api/parent/lessons", { learnerIdHeader: naId })
    ).json()) as LessonListResponse;
    const lessonsMau = (await (
      await callWithJar(parentJar, "/api/parent/lessons", { learnerIdHeader: "learner-mau" })
    ).json()) as LessonListResponse;

    expect(
      lessonsNa.lessons.find((l) => l.id === "math-fractions-compare")?.approvalStatus,
    ).toBe("approved");
    expect(
      lessonsMau.lessons.find((l) => l.id === "math-fractions-compare")?.approvalStatus,
    ).toBe("draft");

    // Correct a skill for Bé Na via x-tlo-learner-id and verify Bé Mẫu's dashboard is untouched
    const correctRes = await callWithJar(parentJar, "/api/parent/skills/correct", {
      method: "POST",
      learnerIdHeader: naId,
      json: {
        skillId: "math-frac-compare",
        state: "INDEPENDENT",
        note: "Bé Na đã làm đúng bài tập so sánh phân số trên giấy",
      },
    });
    expect(correctRes.status).toBe(200);

    const dashNa = (await (
      await callWithJar(parentJar, "/api/parent/dashboard", { learnerIdHeader: naId })
    ).json()) as ParentDashboardResponse;
    const dashMau = (await (
      await callWithJar(parentJar, "/api/parent/dashboard", { learnerIdHeader: "learner-mau" })
    ).json()) as ParentDashboardResponse;

    expect(dashNa.learner?.id).toBe(naId);
    expect(dashNa.skillEvidence.find((s) => s.skillId === "math-frac-compare")?.state).toBe(
      "INDEPENDENT",
    );
    expect(dashMau.learner?.id).toBe("learner-mau");
    expect(dashMau.skillEvidence).toHaveLength(0);

    // Export scoped to Bé Na via x-tlo-learner-id
    const exportNa = (await (
      await callWithJar(parentJar, "/api/data/export", {
        method: "POST",
        learnerIdHeader: naId,
      })
    ).json()) as ExportResponse;
    expect(exportNa.data.learners).toHaveLength(1);
    expect(exportNa.data.learners[0]?.nickname).toBe("Bé Na");
    expect(exportNa.data.skillEvidence).toHaveLength(1);

    // Seed a real second family (Parent 2 + Learner Minh) to verify cross-family rejection on a real foreign learner ID
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-other", "Phụ huynh Gia đình B", passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-other-family", "parent-other", "Bé Minh (Gia đình B)", now)
      .run();

    // Real foreign learnerId in x-tlo-learner-id or body is rejected across session, dashboard, approval, skill correction, learner home, and export
    const foreignSessionRes = await callWithJar(parentJar, "/api/session", {
      learnerIdHeader: "learner-other-family",
    });
    expect(foreignSessionRes.status).toBe(200);
    const foreignSessionBody = (await foreignSessionRes.json()) as SessionInfo;
    expect(foreignSessionBody.learner?.id).not.toBe("learner-other-family");

    const foreignDashRes = await callWithJar(parentJar, "/api/parent/dashboard", {
      learnerIdHeader: "learner-other-family",
    });
    expect(foreignDashRes.status).toBe(404);

    const foreignApproveRes = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      learnerIdHeader: "learner-other-family",
      json: { lessonId: "math-fractions-compare", status: "approved" },
    });
    expect(foreignApproveRes.status).toBe(404);

    const foreignCorrectRes = await callWithJar(parentJar, "/api/parent/skills/correct", {
      method: "POST",
      learnerIdHeader: "learner-other-family",
      json: {
        skillId: "math-frac-compare",
        state: "INDEPENDENT",
        note: "Thử ghi đè kỹ năng của học sinh gia đình khác",
      },
    });
    expect(foreignCorrectRes.status).toBe(404);

    const foreignHomeRes = await callWithJar(parentJar, "/api/learner/home", {
      learnerIdHeader: "learner-other-family",
    });
    expect(foreignHomeRes.status).toBe(404);

    const foreignExportRes = await callWithJar(parentJar, "/api/data/export", {
      method: "POST",
      learnerIdHeader: "learner-other-family",
    });
    expect(foreignExportRes.status).toBe(404);
  });

  it("2. Enriches reviewDue on GET /api/learner/home with lessonId and lessonTitleVi for approved lessons, and seeds all Grade 4 lessons", async () => {
    const seedResult = await seedLessons(env.DB);
    expect(seedResult.unchanged).toBe(50);

    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-2", "Bố Mẫu", passHash, now)
      .run();

    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-2", "parent-2", "Bé Mẫu", now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-2", "Bố Mẫu", "parent");

    // Approve the 3 new Grade 4 lessons (`math-fractions-compare`, `eng-home-vocabulary`, `vie-story-lesson`)
    for (const lessonId of ["math-fractions-compare", "eng-home-vocabulary", "vie-story-lesson"]) {
      const res = await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId, status: "approved" },
      });
      expect(res.status).toBe(200);
    }

    // Seed a due review_schedule entry for `vie-story-lesson`
    await env.DB
      .prepare(
        `INSERT INTO review_schedule
           (id, learner_id, skill_id, due_at, interval_days, last_result, last_attempt_at, failure_streak, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, 1, 'passed', ?5, 0, ?5, ?5)`,
      )
      .bind("rev-1", "learner-2", "vie-story-lesson", now - 86_400_000, now - 172_800_000)
      .run();

    const learnerJar = await createAuthenticatedJar("parent-2", "Bố Mẫu", "learner");
    const homeRes = await callWithJar(learnerJar, "/api/learner/home");
    expect(homeRes.status).toBe(200);
    const home = (await homeRes.json()) as LearnerHomeResponse;

    const dueItem = home.reviewDue.find((r) => r.skillId === "vie-story-lesson");
    expect(dueItem).toBeDefined();
    expect(dueItem?.lessonId).toBe("vie-story-lesson");
    expect(dueItem?.lessonTitleVi).toBe("Rút ra bài học từ câu chuyện");

    // Start sessions on all 3 new lessons and verify zero answer key leakage
    for (const lessonId of ["math-fractions-compare", "eng-home-vocabulary", "vie-story-lesson"]) {
      const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId },
      });
      expect(startRes.status).toBe(200);
      const started = (await startRes.json()) as StartSessionResponse;
      expect(started.steps.length).toBeGreaterThanOrEqual(4);
      for (const step of started.steps) {
        expect(leaksAnswer(step.content)).toBe(false);
      }
    }
  });
});
