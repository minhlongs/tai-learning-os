/**
 * Integration tests for M5 Phase 3 (Issue #8):
 *   1. Activated Science (`science` — Khoa học) and Reasoning (`debate` — Tư duy phản biện)
 *      subjects and 4 Grade 4 lessons (`sci-water-cycle`, `sci-plant-needs`,
 *      `deb-claim-reason`, `deb-fact-opinion`) with zero answer-key leakage.
 *   2. Prerequisite-graph guided recommendations (`recommendedNextLessons`) on
 *      `GET /api/parent/dashboard` transitioning from `prerequisite_gap` to
 *      `unlocked_next` when a foundational skill reaches `INDEPENDENT`.
 *   3. School-year continuity, archival, and multi-term comparison via
 *      `POST /api/parent/school-years` and `GET /api/parent/dashboard`, plus
 *      child-mode (`403`) and cross-family (`404`) isolation guards.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { seedLessons } from "./lesson-seed";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import { leaksAnswer } from "../../src/shared/schemas/exercise";
import type {
  FinalizeSessionResponse,
  LearnerSubjectListResponse,
  ParentDashboardResponse,
  SchoolYearTransitionResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
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

describe("M5 Phase 3: Prerequisite Recommendations, School-Year Continuity & Science/Debate Modules", () => {
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
    await seedLessons(env.DB);
  });

  it("1. Activates Science (Khoa học) & Reasoning (Tư duy phản biện) modules with 4 lessons, zero answer leakage, and prerequisite-guided recommendations", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-m5", "Mẹ Tài", passHash, now)
      .run();

    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-tai", "parent-m5", "Tài", now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-m5", "Mẹ Tài", "parent");
    const learnerJar = await createAuthenticatedJar("parent-m5", "Mẹ Tài", "learner");

    // 1. Verify initial prerequisite recommendations include foundational roots (sci-water-cycle / deb-claim-reason)
    // and do NOT prematurely recommend locked downstream skills (sci-plant-needs / deb-fact-opinion)
    const dashBefore = (await (
      await callWithJar(parentJar, "/api/parent/dashboard")
    ).json()) as ParentDashboardResponse;

    expect(
      dashBefore.recommendedNextLessons.some(
        (r) => r.skillId === "sci-water-cycle" && r.recommendationKind === "prerequisite_gap",
      ),
    ).toBe(true);
    expect(
      dashBefore.recommendedNextLessons.some(
        (r) => r.skillId === "deb-claim-reason" && r.recommendationKind === "prerequisite_gap",
      ),
    ).toBe(true);
    expect(dashBefore.recommendedNextLessons.some((r) => r.skillId === "sci-plant-needs")).toBe(
      false,
    );
    expect(dashBefore.recommendedNextLessons.some((r) => r.skillId === "deb-fact-opinion")).toBe(
      false,
    );

    // 2. Approve all 4 new Science & Debate lessons
    for (const lessonId of [
      "sci-water-cycle",
      "sci-plant-needs",
      "deb-claim-reason",
      "deb-fact-opinion",
    ]) {
      const res = await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId, status: "approved" },
      });
      expect(res.status).toBe(200);
    }

    // 3. Verify GET /api/learner/subjects exposes 5 active subjects including science & debate
    const subjectsRes = await callWithJar(learnerJar, "/api/learner/subjects");
    expect(subjectsRes.status).toBe(200);
    const subjectsBody = (await subjectsRes.json()) as LearnerSubjectListResponse;
    const subjectIds = subjectsBody.subjects.map((s) => s.id);
    expect(subjectIds).toEqual(["math", "english", "vietnamese", "science", "debate"]);

    const scienceSubj = subjectsBody.subjects.find((s) => s.id === "science");
    const debateSubj = subjectsBody.subjects.find((s) => s.id === "debate");
    expect(scienceSubj?.lessons.map((l) => l.id)).toEqual(
      expect.arrayContaining(["sci-water-cycle", "sci-plant-needs"]),
    );
    expect(debateSubj?.lessons.map((l) => l.id)).toEqual(
      expect.arrayContaining(["deb-claim-reason", "deb-fact-opinion"]),
    );

    // 4. Start sessions on all 4 new lessons and verify zero answer key leakage
    for (const lessonId of [
      "sci-water-cycle",
      "sci-plant-needs",
      "deb-claim-reason",
      "deb-fact-opinion",
    ]) {
      const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId },
      });
      expect(startRes.status).toBe(200);
      const started = (await startRes.json()) as StartSessionResponse;
      expect(started.steps.length).toBe(5);
      for (const step of started.steps) {
        expect(leaksAnswer(step.content)).toBe(false);
      }
    }

    // 5. Master `sci-water-cycle` and `deb-claim-reason` via parent correction (or independent attempts)
    // and verify `sci-plant-needs` and `deb-fact-opinion` unlock as `unlocked_next`
    for (const skillId of ["sci-water-cycle", "deb-claim-reason"]) {
      const correctRes = await callWithJar(parentJar, "/api/parent/skills/correct", {
        method: "POST",
        json: {
          skillId,
          state: "INDEPENDENT",
          note: "Em đã hoàn thành độc lập bài tập nền tảng",
        },
      });
      expect(correctRes.status).toBe(200);
    }

    const dashAfter = (await (
      await callWithJar(parentJar, "/api/parent/dashboard")
    ).json()) as ParentDashboardResponse;

    const unlockedPlant = dashAfter.recommendedNextLessons.find(
      (r) => r.skillId === "sci-plant-needs",
    );
    expect(unlockedPlant).toBeDefined();
    expect(unlockedPlant?.recommendationKind).toBe("unlocked_next");
    expect(unlockedPlant?.prerequisiteSkillIds).toEqual(["sci-water-cycle"]);
    expect(unlockedPlant?.lessonId).toBe("sci-plant-needs");

    const unlockedFactOpinion = dashAfter.recommendedNextLessons.find(
      (r) => r.skillId === "deb-fact-opinion",
    );
    expect(unlockedFactOpinion).toBeDefined();
    expect(unlockedFactOpinion?.recommendationKind).toBe("unlocked_next");
    expect(unlockedFactOpinion?.prerequisiteSkillIds).toEqual(["deb-claim-reason"]);
    expect(unlockedFactOpinion?.lessonId).toBe("deb-fact-opinion");
  });

  it("2. Transitions school years while preserving historical sessions, attempts, and competency evidence, and enforces child/cross-family isolation", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-sy", "Bố Tài", passHash, now)
      .run();

    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-sy", "parent-sy", "Tài", now)
      .run();

    // Seed an active 2026-2027 school year (Grade 4)
    await env.DB
      .prepare(
        `INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at)
         VALUES ('sy-2026', 'learner-sy', '2026-2027', '2026-09-01', '2027-06-30', 4, ?1)`,
      )
      .bind(now - 10_000)
      .run();

    const parentJar = await createAuthenticatedJar("parent-sy", "Bố Tài", "parent");
    const learnerJar = await createAuthenticatedJar("parent-sy", "Bố Tài", "learner");

    // Approve sci-water-cycle and complete a session in 2026-2027
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: "sci-water-cycle", status: "approved" },
    });

    const start2026Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: "sci-water-cycle" },
    });
    expect(start2026Res.status).toBe(200);
    const started2026 = (await start2026Res.json()) as StartSessionResponse;

    const step1 = started2026.steps[0]!;
    const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started2026.sessionId,
        stepId: step1.id,
        submission: { kind: "choice", choiceId: "b" },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);
    const attemptBody = (await attemptRes.json()) as SubmitAttemptResponse;
    expect(attemptBody.outcome).toBe("correct");

    const finRes = await callWithJar(learnerJar, "/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: started2026.sessionId, status: "completed" },
    });
    expect(finRes.status).toBe(200);
    const finBody = (await finRes.json()) as FinalizeSessionResponse;
    expect(finBody.status).toBe("completed");

    // Transition to 2027-2028 (Grade 5) via POST /api/parent/school-years
    const transitionRes = await callWithJar(parentJar, "/api/parent/school-years", {
      method: "POST",
      json: {
        learnerId: "learner-sy",
        label: "2027-2028",
        grade: 5,
      },
    });
    expect(transitionRes.status).toBe(200);
    const transitioned = (await transitionRes.json()) as SchoolYearTransitionResponse;
    expect(transitioned.schoolYear.label).toBe("2027-2028");
    expect(transitioned.schoolYear.grade).toBe(5);
    expect(transitioned.schoolYear.isActive).toBe(true);

    // Start a new session in 2027-2028 on deb-claim-reason
    await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: "deb-claim-reason", status: "approved" },
    });
    const start2027Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: "deb-claim-reason" },
    });
    expect(start2027Res.status).toBe(200);

    // Check GET /api/parent/dashboard preserves both school years with accurate per-year counts
    const dash = (await (
      await callWithJar(parentJar, "/api/parent/dashboard")
    ).json()) as ParentDashboardResponse;

    expect(dash.learner?.grade).toBe(5);
    expect(dash.learner?.schoolYearLabel).toBe("2027-2028");
    expect(dash.schoolYears).toHaveLength(2);

    const sy2027 = dash.schoolYears.find((y) => y.label === "2027-2028");
    const sy2026 = dash.schoolYears.find((y) => y.label === "2026-2027");

    expect(sy2027).toMatchObject({
      label: "2027-2028",
      grade: 5,
      isActive: true,
      sessionCount: 1,
      completedSessionCount: 0,
    });
    expect(sy2026).toMatchObject({
      label: "2026-2027",
      grade: 4,
      isActive: false,
      sessionCount: 1,
      completedSessionCount: 1,
      attemptCount: 1,
      independentAttemptCount: 1,
    });

    // Child mode is rejected (403)
    const childModeRes = await callWithJar(learnerJar, "/api/parent/school-years", {
      method: "POST",
      json: { label: "2028-2029", grade: 6 },
    });
    expect(childModeRes.status).toBe(403);

    // Cross-family learner ID is rejected (404)
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-other', 'Phụ huynh B', ?1, ?2, ?2)",
      )
      .bind(passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-other', 'parent-other', 'Bé B', 4, ?1, ?1)",
      )
      .bind(now)
      .run();

    const foreignRes = await callWithJar(parentJar, "/api/parent/school-years", {
      method: "POST",
      learnerIdHeader: "learner-other",
      json: { label: "2028-2029", grade: 6 },
    });
    expect(foreignRes.status).toBe(404);
  });
});
