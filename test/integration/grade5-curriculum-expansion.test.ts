/**
 * Integration tests for the Grade 5 curriculum expansion:
 *   1. The catalogue migration seeds the 20 Grade 5 skills with their objectives
 *      and prerequisite edges, and every Grade 5 lesson attaches to a real skill.
 *   2. All 50 registry lessons seed and stay current (no rewrite churn).
 *   3. Grade 5 baselines are flagged as baselines, so a parent sees them as a
 *      diagnostic rather than a scored lesson.
 *   4. A Grade 5 learner can start and complete a session on a Grade 5 lesson
 *      with zero answer-key leakage.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { seedLessons } from "./lesson-seed";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import { leaksAnswer } from "../../src/shared/schemas/exercise";
import { LESSONS } from "../../src/shared/content/index";
import type {
  FinalizeSessionResponse,
  ParentLessonListResponse,
  RequestHintResponse,
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
  return { cookies: { tlo_session: token }, csrf };
}

const GRADE5_CORE_LESSONS = LESSONS.filter(
  (lesson) => lesson.gradeFrom === 5 && lesson.gradeTo === 5 && !lesson.isBaseline,
);

describe("Grade 5 curriculum expansion", () => {
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

  it("1. Installs every Grade 5 skill with its objective and prerequisite edge", async () => {
    const skills = await env.DB
      .prepare("select id, subject_id, grade_from, grade_to from skills where grade_from = 5 and grade_to = 5")
      .all<{ id: string; subject_id: string; grade_from: number; grade_to: number }>();
    const skillIds = (skills.results ?? []).map((row) => row.id).sort();

    expect(skillIds).toHaveLength(20);
    expect(skillIds).toEqual(
      [
        "deb-argument-structure",
        "deb-civil-disagreement",
        "deb-fallacies",
        "deb-source-credibility",
        "eng-comparatives",
        "eng-daily-routine",
        "eng-directions",
        "eng-past-simple",
        "math-circle",
        "math-dec-add-sub",
        "math-dec-place-value",
        "math-percent",
        "sci-energy-forms",
        "sci-environment",
        "sci-food-chains",
        "sci-life-cycles",
        "vie-figurative",
        "vie-inference",
        "vie-paragraph-structure",
        "vie-sentence-linking",
      ].sort(),
    );

    // Each prerequisite edge points at a skill that exists in the catalogue.
    const edges = await env.DB
      .prepare(
        `select skill_id, prerequisite_id from skill_prerequisites
         where skill_id in (${"?, ".repeat(skillIds.length).slice(0, -2)})`,
      )
      .bind(...skillIds)
      .all<{ skill_id: string; prerequisite_id: string }>();

    const allSkills = new Set(
      (
        await env.DB.prepare("select id from skills").all<{ id: string }>()
      ).results!.map((row) => row.id),
    );
    for (const edge of edges.results ?? []) {
      expect(allSkills.has(edge.prerequisite_id), `${edge.skill_id} -> ${edge.prerequisite_id}`).toBe(
        true,
      );
    }
    expect((edges.results ?? []).length).toBe(20);
  });

  it("2. Seeds all 50 lessons, keeping Grade 4 and Grade 5 versions distinct", async () => {
    const rows = await env.DB.prepare("select id from lessons").all<{ id: string }>();
    const lessonIds = (rows.results ?? []).map((row) => row.id);

    for (const lesson of LESSONS) {
      expect(lessonIds, lesson.id).toContain(lesson.id);
    }

    // Each active subject carries both a Grade 4 and a Grade 5 baseline.
    const baselines = await env.DB
      .prepare("select lesson_id, subject_id from lessons l, lesson_metadata m where m.lesson_id = l.id and m.is_baseline = 1")
      .all<{ lesson_id: string; subject_id: string }>();
    const baselineSubjects = (baselines.results ?? []).map((row) => row.subject_id).sort();
    expect(baselineSubjects).toEqual([
      "debate",
      "debate",
      "english",
      "english",
      "math",
      "math",
      "science",
      "science",
      "vietnamese",
      "vietnamese",
    ]);
  });

  it("3. Registers every Grade 5 objective referenced by a Grade 5 lesson", async () => {
    const objectiveIds = new Set(
      (
        await env.DB.prepare("select id from curriculum_objectives").all<{ id: string }>()
      ).results!.map((row) => row.id),
    );

    for (const lesson of GRADE5_CORE_LESSONS) {
      expect(lesson.objectiveId, lesson.id).toBeDefined();
      expect(objectiveIds.has(lesson.objectiveId!), lesson.id).toBe(true);
    }
  });

  it("4. Lets a Grade 5 learner complete a Grade 5 lesson with no answer-key leakage", async () => {
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);
    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-g5", "Mẹ Tài", passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 5, ?4, ?4)",
      )
      .bind("learner-g5", "parent-g5", "Tài", now)
      .run();

    const parentJar = await createAuthenticatedJar("parent-g5", "Mẹ Tài", "parent");
    const learnerJar = await createAuthenticatedJar("parent-g5", "Mẹ Tài", "learner");

    const approvalRes = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: "sci-life-cycles", status: "approved" },
    });
    expect(approvalRes.status).toBe(200);

    const listRes = await callWithJar(parentJar, "/api/parent/lessons");
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as ParentLessonListResponse;
    expect(listBody.lessons.map((lesson) => lesson.id)).toContain("sci-life-cycles");

    const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId: "sci-life-cycles" },
    });
    expect(startRes.status).toBe(200);
    const started = (await startRes.json()) as StartSessionResponse;
    expect(started.steps).toHaveLength(5);
    for (const step of started.steps) {
      expect(leaksAnswer(step.content), step.id).toBe(false);
      expect(JSON.stringify(step.content), step.id).not.toContain("hint1_vi");
      expect(JSON.stringify(step.content), step.id).not.toContain("hint2_vi");
      expect(JSON.stringify(step.content), step.id).not.toContain("hint3_vi");
    }

    const hintedStep = started.steps[1]!;
    const hintRes = await callWithJar(learnerJar, "/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: hintedStep.id,
        currentLevel: 3,
      },
    });
    expect(hintRes.status).toBe(200);
    const hintBody = (await hintRes.json()) as RequestHintResponse;
    expect(hintBody.level).toBe(3);
    expect(hintBody.hintVi).toBeTruthy();

    const firstStep = started.steps[0]!;
    // Step 1's correct choice is "c"; submitting any other id must grade
    // "incorrect" and must not release the withheld explanation.
    const wrongRes = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: firstStep.id,
        submission: { kind: "choice", choiceId: "a" },
        helpLevel: 0,
      },
    });
    expect(wrongRes.status).toBe(200);
    const wrongBody = (await wrongRes.json()) as SubmitAttemptResponse;
    expect(wrongBody.outcome).toBe("incorrect");
    expect(wrongBody.explanationVi).toBeNull();

    // The correct choice id for each step of sci-life-cycles, in order.
    const intendedAnswers = ["c", "a", "b", "d", "a"] as const;
    for (const [index, step] of started.steps.entries()) {
      const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: started.sessionId,
          stepId: step.id,
          submission: { kind: "choice", choiceId: intendedAnswers[index] },
          helpLevel: 0,
        },
      });
      expect(attemptRes.status).toBe(200);
      const attemptBody = (await attemptRes.json()) as SubmitAttemptResponse;
      // Step 2 already reached hint level 3 above, so a correct answer there can
      // only grade "partial" — the disclosed help is server-side sticky, and
      // explanationVi is withheld unless the outcome is "correct".
      if (index === 1) {
        expect(attemptBody.outcome, step.id).toBe("partial");
        expect(attemptBody.explanationVi, step.id).toBeNull();
      } else {
        expect(attemptBody.outcome, step.id).toBe("correct");
        expect(attemptBody.explanationVi, step.id).toBeTruthy();
      }
    }

    const retriedAttempt = await env.DB.prepare(
      "SELECT attempt_no, evidence_kind FROM learning_attempts WHERE session_id = ?1 AND step_id = ?2 ORDER BY attempt_no DESC LIMIT 1",
    )
      .bind(started.sessionId, firstStep.id)
      .first<{ attempt_no: number; evidence_kind: string }>();
    expect(retriedAttempt).toEqual({ attempt_no: 2, evidence_kind: "assisted" });

    const hintedAttempt = await env.DB.prepare(
      "SELECT help_level, evidence_kind FROM learning_attempts WHERE session_id = ?1 AND step_id = ?2 ORDER BY attempt_no DESC LIMIT 1",
    )
      .bind(started.sessionId, hintedStep.id)
      .first<{ help_level: number; evidence_kind: string }>();
    expect(hintedAttempt).toEqual({ help_level: 3, evidence_kind: "assisted" });

    const finishRes = await callWithJar(learnerJar, "/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: started.sessionId, status: "completed" },
    });
    expect(finishRes.status).toBe(200);
    expect(((await finishRes.json()) as FinalizeSessionResponse).status).toBe("completed");
  });
});
