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
  BaselineGetResponse,
  CreateGoalResponse,
  CurriculumGetResponse,
  EvaluateBaselineResponse,
  ExportResponse,
  FinalizeSessionResponse,
  LearnerSubjectListResponse,
  LessonDetailResponse,
  ParentDashboardResponse,
  ParentLessonListResponse,
  PlannerGetResponse,
  SchoolYearTransitionResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
  UpdateGoalStatusResponse,
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

  it("3. Supports 5-subject baseline diagnostics (Science & Debate), excludes cross-tenant org lessons from baseline/planner, and propagates active school year into planner", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-m6', 'Mẹ Tài', ?1, ?2, ?2)",
      )
      .bind(passHash, now)
      .run();

    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-m6-1', 'parent-m6', 'Tài', 4, ?1, ?1)",
      )
      .bind(now - 5_000)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-m6-2', 'parent-m6', 'An', 4, ?1, ?1)",
      )
      .bind(now)
      .run();

    // Seed a cross-tenant organization and bind `sci-plant-needs` as an un-assigned org lesson of another org
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-foreign', 'Giáo viên Ngoài', ?1, ?2, ?2)",
      )
      .bind(passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-foreign', 'foreign-school', 'Trường Ngoài', ?1, ?1)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO organization_lessons (organization_id, lesson_id, author_id, review_status, created_at, updated_at) VALUES ('org-foreign', 'sci-plant-needs', 'parent-foreign', 'org_approved', ?1, ?1)",
      )
      .bind(now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-m6", "Mẹ Tài", "parent");

    // 1. GET /api/parent/baseline returns all 5 baseline lessons across the 5 active subjects
    const baseGetRes = await callWithJar(parentJar, "/api/parent/baseline");
    expect(baseGetRes.status).toBe(200);
    const baseGetBody = (await baseGetRes.json()) as BaselineGetResponse;
    expect(baseGetBody.baselineLessons.map((l) => l.lessonId).sort()).toEqual([
      "deb-baseline-grade4",
      "eng-baseline-grade4",
      "math-baseline-grade4",
      "sci-baseline-grade4",
      "vie-baseline-grade4",
    ]);

    // 2. POST /api/parent/baseline evaluates Science and Debate baselines, excluding cross-tenant `sci-plant-needs`
    const evalSciRes = await callWithJar(parentJar, "/api/parent/baseline", {
      method: "POST",
      json: { learnerId: "learner-m6-2", subjectId: "science" },
    });
    expect(evalSciRes.status).toBe(200);
    const evalSciBody = (await evalSciRes.json()) as EvaluateBaselineResponse;
    expect(evalSciBody.assessment.learnerId).toBe("learner-m6-2");
    expect(evalSciBody.assessment.subjectId).toBe("science");
    expect(evalSciBody.assessment.suggestedLessons).toContain("sci-water-cycle");
    expect(evalSciBody.assessment.suggestedLessons).not.toContain("sci-plant-needs");

    const evalDebRes = await callWithJar(parentJar, "/api/parent/baseline", {
      method: "POST",
      json: { learnerId: "learner-m6-2", subjectId: "debate" },
    });
    expect(evalDebRes.status).toBe(200);
    const evalDebBody = (await evalDebRes.json()) as EvaluateBaselineResponse;
    expect(evalDebBody.assessment.learnerId).toBe("learner-m6-2");
    expect(evalDebBody.assessment.subjectId).toBe("debate");
    expect(evalDebBody.assessment.suggestedLessons).toEqual(
      expect.arrayContaining(["deb-claim-reason", "deb-fact-opinion"]),
    );

    // 3. Transition learner-m6-2 to school year 2027-2028 (Grade 5) and verify curriculum + planner use 2027-2028
    const transRes = await callWithJar(parentJar, "/api/parent/school-years", {
      method: "POST",
      json: { learnerId: "learner-m6-2", label: "2027-2028", grade: 5 },
    });
    expect(transRes.status).toBe(200);

    const currRes = await callWithJar(parentJar, "/api/parent/curriculum?learnerId=learner-m6-2");
    expect(currRes.status).toBe(200);
    const currBody = (await currRes.json()) as CurriculumGetResponse;
    expect(currBody.learnerId).toBe("learner-m6-2");
    expect(currBody.schoolYearLabel).toBe("2027-2028");
    expect(currBody.grade).toBe(5);

    // 4. Generate 4-week plan for learner-m6-2 via body.learnerId and verify active school year + cross-tenant exclusion
    const genRes = await callWithJar(parentJar, "/api/parent/planner/generate", {
      method: "POST",
      json: { learnerId: "learner-m6-2", sessionsPerWeek: 3, sessionDurationMinutes: 20 },
    });
    expect(genRes.status).toBe(200);
    const genBody = (await genRes.json()) as PlannerGetResponse;
    expect(genBody.learnerId).toBe("learner-m6-2");
    expect(genBody.schoolYearLabel).toBe("2027-2028");
    expect(genBody.items.length).toBeGreaterThan(0);
    expect(genBody.items.every((i) => i.learnerId === "learner-m6-2")).toBe(true);
    expect(genBody.items.every((i) => i.schoolYearLabel === "2027-2028")).toBe(true);
    expect(genBody.items.some((i) => i.lessonId === "sci-plant-needs")).toBe(false);

    // 5. Update a plan item for learner-m6-2 via body.learnerId
    const firstItem = genBody.items[0]!;
    const patchRes = await callWithJar(parentJar, "/api/parent/planner/item", {
      method: "PATCH",
      json: {
        learnerId: "learner-m6-2",
        itemId: firstItem.id,
        status: "completed",
        parentNote: "Đã hoàn thành buổi học đầu tiên của năm học mới",
      },
    });
    expect(patchRes.status).toBe(200);
    const patchBody = (await patchRes.json()) as PlannerGetResponse;
    expect(patchBody.learnerId).toBe("learner-m6-2");
    const updatedItem = patchBody.items.find((i) => i.id === firstItem.id);
    expect(updatedItem?.status).toBe("completed");
    expect(updatedItem?.parentNote).toBe("Đã hoàn thành buổi học đầu tiên của năm học mới");

    // 6. POST /api/data/export excludes cross-tenant organization lessons and their step answer keys
    const expRes = await callWithJar(parentJar, "/api/data/export", {
      method: "POST",
      learnerIdHeader: "learner-m6-2",
    });
    expect(expRes.status).toBe(200);
    const expBody = (await expRes.json()) as ExportResponse;
    expect(expBody.data.lessons.some((l) => l.id === "sci-plant-needs")).toBe(false);
    expect(expBody.data.lessonSteps.some((s) => s.lessonId === "sci-plant-needs")).toBe(false);
    expect(expBody.data.lessonMetadata?.some((m) => m.lessonId === "sci-plant-needs")).toBe(false);
  });

  it("4. Supports parent learning goals (create & update status with audit trail and owner/sibling isolation) and enforces sibling-scoped organization-lesson isolation on GET /api/parent/lessons and GET /api/parent/lessons/:id", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-m7', 'Mẹ Tài', ?1, ?2, ?2)",
      )
      .bind(passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-m7-a', 'parent-m7', 'Tài', 4, ?1, ?1)",
      )
      .bind(now - 5_000)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-m7-b', 'parent-m7', 'An', 4, ?1, ?1)",
      )
      .bind(now)
      .run();

    // Seed another family to verify cross-family 404 isolation
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-m7-other', 'Phụ huynh Khác', ?1, ?2, ?2)",
      )
      .bind(passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-m7-other', 'parent-m7-other', 'Bé Khác', 4, ?1, ?1)",
      )
      .bind(now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-m7", "Mẹ Tài", "parent");
    const learnerJar = await createAuthenticatedJar("parent-m7", "Mẹ Tài", "learner");

    // 1. Create a learning goal for Sibling A (`learner-m7-a`)
    const createRes = await callWithJar(parentJar, "/api/parent/goals", {
      method: "POST",
      json: {
        learnerId: "learner-m7-a",
        titleVi: "Tự phân biệt ý kiến và sự thật trong đoạn văn ngắn",
        subjectId: "debate",
        targetDate: "2026-12-31",
        note: "Ôn tập nhẹ nhàng cuối tuần",
      },
    });
    expect(createRes.status).toBe(200);
    const createdBody = (await createRes.json()) as CreateGoalResponse;
    expect(createdBody.goal).toMatchObject({
      learnerId: "learner-m7-a",
      subjectId: "debate",
      titleVi: "Tự phân biệt ý kiến và sự thật trong đoạn văn ngắn",
      status: "active",
      targetDate: "2026-12-31",
      note: "Ôn tập nhẹ nhàng cuối tuần",
    });

    // 2. Verify goal appears in GET /api/parent/dashboard for Sibling A, not Sibling B
    const dashARes = await callWithJar(parentJar, "/api/parent/dashboard", {
      learnerIdHeader: "learner-m7-a",
    });
    const dashA = (await dashARes.json()) as ParentDashboardResponse;
    expect(dashA.goals).toHaveLength(1);
    expect(dashA.goals[0]?.id).toBe(createdBody.goal.id);
    expect(dashA.goals[0]?.targetDate).toBe("2026-12-31");
    expect(dashA.goals[0]?.note).toBe("Ôn tập nhẹ nhàng cuối tuần");

    const dashBRes = await callWithJar(parentJar, "/api/parent/dashboard", {
      learnerIdHeader: "learner-m7-b",
    });
    const dashB = (await dashBRes.json()) as ParentDashboardResponse;
    expect(dashB.goals).toHaveLength(0);

    // 3. Updating Sibling A's goal while targeting Sibling B must return 404
    const wrongSiblingPatch = await callWithJar(parentJar, "/api/parent/goals", {
      method: "PATCH",
      json: {
        learnerId: "learner-m7-b",
        goalId: createdBody.goal.id,
        status: "achieved",
      },
    });
    expect(wrongSiblingPatch.status).toBe(404);

    // 4. Update Sibling A's goal status to `achieved`
    const patchRes = await callWithJar(parentJar, "/api/parent/goals", {
      method: "PATCH",
      json: {
        learnerId: "learner-m7-a",
        goalId: createdBody.goal.id,
        status: "achieved",
        note: "Đã hoàn thành tốt trong tuần 3",
      },
    });
    expect(patchRes.status).toBe(200);
    const patchedBody = (await patchRes.json()) as UpdateGoalStatusResponse;
    expect(patchedBody.goal.status).toBe("achieved");
    expect(patchedBody.goal.note).toBe("Đã hoàn thành tốt trong tuần 3");

    // 5. Verify audit events (`goal.created` and `goal.status_updated`)
    const auditRows = await env.DB
      .prepare(
        "SELECT action FROM audit_events WHERE subject = ?1 ORDER BY created_at ASC",
      )
      .bind(createdBody.goal.id)
      .all<{ action: string }>();
    expect(auditRows.results.map((r) => r.action)).toEqual(["goal.created", "goal.status_updated"]);

    // 6. Verify child-mode 403, cross-family 404, and validation errors (400)
    const childGoalRes = await callWithJar(learnerJar, "/api/parent/goals", {
      method: "POST",
      json: { titleVi: "Mục tiêu giả mạo" },
    });
    expect(childGoalRes.status).toBe(403);

    const crossFamilyGoalRes = await callWithJar(parentJar, "/api/parent/goals", {
      method: "POST",
      json: { learnerId: "learner-m7-other", titleVi: "Mục tiêu chéo gia đình" },
    });
    expect(crossFamilyGoalRes.status).toBe(404);

    const invalidDateRes = await callWithJar(parentJar, "/api/parent/goals", {
      method: "POST",
      json: { learnerId: "learner-m7-a", titleVi: "Mục tiêu ngày sai", targetDate: "31-12-2026" },
    });
    expect(invalidDateRes.status).toBe(400);

    // 7. Sibling-scoped organization-lesson isolation on GET /api/parent/lessons and GET /api/parent/lessons/:id
    // Bind `sci-plant-needs` to an external organization where only Sibling A (`learner-m7-a`) is enrolled & consented
    await env.DB
      .prepare(
        "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-m7', 'm7-center', 'Trung tâm M7', ?1, ?1)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO classrooms (id, organization_id, name, grade, subject_id, created_at, updated_at) VALUES ('class-m7', 'org-m7', 'Lớp Khoa học 4A', 4, 'science', ?1, ?1)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO organization_lessons (organization_id, lesson_id, author_id, review_status, created_at, updated_at) VALUES ('org-m7', 'sci-plant-needs', 'parent-m7-other', 'org_approved', ?1, ?1)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO classroom_enrollments (id, classroom_id, learner_id, status, created_at, updated_at) VALUES ('enr-m7-a', 'class-m7', 'learner-m7-a', 'enrolled', ?1, ?1)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learner_consents (id, organization_id, learner_id, granted_by, status, granted_at, revoked_at) VALUES ('con-m7-a', 'org-m7', 'learner-m7-a', 'parent-m7', 'active', ?1, NULL)",
      )
      .bind(now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO classroom_lesson_assignments (id, classroom_id, lesson_id, assigned_by, assigned_at, due_at) VALUES ('asg-m7-1', 'class-m7', 'sci-plant-needs', 'parent-m7-other', ?1, NULL)",
      )
      .bind(now)
      .run();

    // Sibling A sees `sci-plant-needs` in GET /api/parent/lessons and GET /api/parent/lessons/sci-plant-needs
    const lessonsARes = await callWithJar(parentJar, "/api/parent/lessons", {
      learnerIdHeader: "learner-m7-a",
    });
    expect(lessonsARes.status).toBe(200);
    const lessonsABody = (await lessonsARes.json()) as ParentLessonListResponse;
    expect(lessonsABody.lessons.some((l) => l.id === "sci-plant-needs")).toBe(true);

    const detailARes = await callWithJar(parentJar, "/api/parent/lessons/sci-plant-needs", {
      learnerIdHeader: "learner-m7-a",
    });
    expect(detailARes.status).toBe(200);
    const detailABody = (await detailARes.json()) as LessonDetailResponse;
    expect(detailABody.id).toBe("sci-plant-needs");

    // Sibling B (`learner-m7-b`, neither enrolled nor consented) does NOT see `sci-plant-needs` in list or detail
    const lessonsBRes = await callWithJar(parentJar, "/api/parent/lessons", {
      learnerIdHeader: "learner-m7-b",
    });
    expect(lessonsBRes.status).toBe(200);
    const lessonsBBody = (await lessonsBRes.json()) as ParentLessonListResponse;
    expect(lessonsBBody.lessons.some((l) => l.id === "sci-plant-needs")).toBe(false);

    const detailBRes = await callWithJar(parentJar, "/api/parent/lessons/sci-plant-needs", {
      learnerIdHeader: "learner-m7-b",
    });
    expect(detailBRes.status).toBe(403);
  });
});
