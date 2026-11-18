/**
 * Integration tests for catalogue re-seeding across version bumps (`v1 -> v2`):
 *   1. Mutating a previously seeded `v1` Wave 1 lesson and re-running `seedLessons()`
 *      bumps that lesson to `v2`, preserves immutable `v1` step rows (`${lessonId}-s${pos}`,
 *      `content_version = 1`), writes distinct `v2` step rows (`${lessonId}-v2-s${pos}`,
 *      `content_version = 2`, `source_step_id = ${lessonId}-s${pos}`), and clamps
 *      `continuation_deadline` on `in_progress` `v1` sessions without emitting
 *      non-enrollment `audit_events`.
 *   2. Active and completed `v1` learner sessions continue to grade against the
 *      preserved `v1` answer key and export cleanly through `/api/data/export/:learnerId`.
 *   3. `v1` parent approvals fail closed for new `v2` sessions until `v2` is approved.
 *   4. Subsequent `seedLessons()` runs are strictly idempotent (`rewritten === 0`)
 *      even when both `v1` and `v2` step rows coexist in `lesson_steps`.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { openTestDatabase, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { seedLessons, stepId } from "./lesson-seed";
import {
  createSessionToken,
  csrfTokenFor,
  verifySessionToken,
} from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import type {
  StartSessionResponse,
  SubmitAttemptResponse,
} from "../../src/shared/api-contract";

const ORIGIN = "http://localhost";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let proxy: TestProxy;
let env: Env;
let worker: { fetch: typeof fetch };

async function callWithJar(
  targetJar: Jar,
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookiePair = Object.entries(targetJar.cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  if (cookiePair) {
    headers.set("cookie", cookiePair);
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
  if (!verified.ok) throw new Error("Failed to verify test session token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return { cookies: { tlo_session: token }, csrf };
}

describe("seedLessons() v1 -> v2 immutable snapshot lineage", () => {
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

  it("preserves v1 steps, active sessions, and exports across a v1 -> v2 re-seed while requiring fresh v2 approval and staying idempotent", async () => {
    const lessonId = "deb-baseline-grade4";
    const now = Date.now();
    const passHash = await hashPassword("ParentPass123!", 100_000);

    await env.DB
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
      )
      .bind("parent-seed-v2", "Mẹ Mẫu", passHash, now)
      .run();
    await env.DB
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
      )
      .bind("learner-seed-v2", "parent-seed-v2", "Bé Mẫu", now)
      .run();

    // Simulate pre-remediation Wave 1 v1 content on step 1 where choice "a" was
    // historically keyed correct instead of the current v2 choice "b".
    const v1Step1Row = await env.DB
      .prepare("SELECT content, answer_key FROM lesson_steps WHERE id = ?1")
      .bind(stepId(lessonId, 1, 1))
      .first<{ content: string; answer_key: string }>();
    expect(v1Step1Row).not.toBeNull();

    const legacyV1Exercise = JSON.parse(v1Step1Row!.content) as {
      choices: Array<{ id: string; label_vi: string; correct: boolean }>;
    };
    for (const choice of legacyV1Exercise.choices) {
      choice.correct = choice.id === "a";
    }
    const legacyV1ContentJson = JSON.stringify(legacyV1Exercise);
    const legacyV1AnswerKeyJson = JSON.stringify({ correctChoiceId: "a" });

    await env.DB
      .prepare(
        "UPDATE lesson_steps SET content = ?1, answer_key = ?2 WHERE id = ?3 AND content_version = 1",
      )
      .bind(legacyV1ContentJson, legacyV1AnswerKeyJson, stepId(lessonId, 1, 1))
      .run();

    const parentJar = await createAuthenticatedJar("parent-seed-v2", "Mẹ Mẫu", "parent");
    const learnerJar = await createAuthenticatedJar("parent-seed-v2", "Mẹ Mẫu", "learner");

    // Approve v1 and start a learner session pinned to v1.
    const approveV1Res = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });
    expect(approveV1Res.status).toBe(200);

    const startV1Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(startV1Res.status).toBe(200);
    const startedV1 = (await startV1Res.json()) as StartSessionResponse;
    expect(startedV1.steps[0]?.id).toBe("deb-baseline-grade4-s1");

    // Stretch continuation_deadline far in the future to verify clamping on v1 -> v2 bump.
    await env.DB
      .prepare("UPDATE learning_sessions SET continuation_deadline = ?1 WHERE id = ?2")
      .bind(now + 24 * 60 * 60 * 1000, startedV1.sessionId)
      .run();

    // Submit step 1 on the v1 session using legacy v1 correct answer "a".
    const v1Step1Attempt = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: startedV1.sessionId,
        stepId: "deb-baseline-grade4-s1",
        submission: { kind: "choice", choiceId: "a" },
        helpLevel: 0,
      },
    });
    expect(v1Step1Attempt.status).toBe(200);
    expect(((await v1Step1Attempt.json()) as SubmitAttemptResponse).outcome).toBe("correct");

    const auditCountBeforeReseed = await env.DB
      .prepare("SELECT COUNT(*) AS count FROM audit_events")
      .first<{ count: number }>();

    // Re-run seedLessons(): only `deb-baseline-grade4` differs from canonical registry,
    // so it must bump cleanly to version 2 while the other 99 stay unchanged.
    const reseedResult = await seedLessons(env.DB);
    expect(reseedResult).toEqual({ inserted: 0, rewritten: 1, unchanged: 99 });

    const auditCountAfterReseed = await env.DB
      .prepare("SELECT COUNT(*) AS count FROM audit_events")
      .first<{ count: number }>();
    expect(auditCountAfterReseed?.count).toBe(auditCountBeforeReseed?.count);

    // Both v1 and v2 snapshots exist in `lesson_versions` and `lesson_steps`.
    const versionRows = await env.DB
      .prepare("SELECT version FROM lesson_versions WHERE lesson_id = ?1 ORDER BY version")
      .bind(lessonId)
      .all<{ version: number }>();
    expect((versionRows.results ?? []).map((r) => r.version)).toEqual([1, 2]);

    const preservedV1Step1 = await env.DB
      .prepare(
        "SELECT id, content, answer_key, content_version, source_step_id FROM lesson_steps WHERE id = ?1",
      )
      .bind("deb-baseline-grade4-s1")
      .first<{
        id: string;
        content: string;
        answer_key: string;
        content_version: number;
        source_step_id: string | null;
      }>();
    expect(preservedV1Step1).toEqual({
      id: "deb-baseline-grade4-s1",
      content: legacyV1ContentJson,
      answer_key: legacyV1AnswerKeyJson,
      content_version: 1,
      source_step_id: null,
    });

    const newV2Step1 = await env.DB
      .prepare(
        "SELECT id, answer_key, content_version, source_step_id FROM lesson_steps WHERE id = ?1",
      )
      .bind("deb-baseline-grade4-v2-s1")
      .first<{
        id: string;
        answer_key: string;
        content_version: number;
        source_step_id: string | null;
      }>();
    expect(newV2Step1).toEqual({
      id: "deb-baseline-grade4-v2-s1",
      answer_key: JSON.stringify({ correctChoiceId: "b" }),
      content_version: 2,
      source_step_id: "deb-baseline-grade4-s1",
    });

    // Active v1 session has its continuation_deadline clamped to <= ~30 minutes
    // and can still submit remaining v1 steps against v1 snapshot IDs.
    const clampedSession = await env.DB
      .prepare(
        "SELECT lesson_version, continuation_deadline FROM learning_sessions WHERE id = ?1",
      )
      .bind(startedV1.sessionId)
      .first<{ lesson_version: number; continuation_deadline: number | null }>();
    expect(clampedSession?.lesson_version).toBe(1);
    expect(clampedSession?.continuation_deadline).not.toBeNull();
    expect(clampedSession!.continuation_deadline!).toBeLessThanOrEqual(
      Date.now() + 31 * 60 * 1000,
    );

    const v1Step2Attempt = await callWithJar(learnerJar, "/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: startedV1.sessionId,
        stepId: "deb-baseline-grade4-s2",
        submission: { kind: "choice", choiceId: "d" },
        helpLevel: 0,
      },
    });
    expect(v1Step2Attempt.status).toBe(200);
    expect(((await v1Step2Attempt.json()) as SubmitAttemptResponse).outcome).toBe("correct");

    // Learner export succeeds cleanly with historical v1 session + attempt lineage intact.
    const exportRes = await callWithJar(
      parentJar,
      "/api/data/export?learnerId=learner-seed-v2",
      { method: "POST" },
    );
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        learningSessions: Array<{ id: string; lessonVersion: number }>;
        learningAttempts: Array<{ stepId: string; stepVersion: number }>;
      };
    };
    expect(exported.data.learningSessions).toContainEqual(
      expect.objectContaining({ id: startedV1.sessionId, lessonVersion: 1 }),
    );
    expect(
      exported.data.learningAttempts.map((a) => ({ stepId: a.stepId, stepVersion: a.stepVersion })),
    ).toEqual([
      { stepId: "deb-baseline-grade4-s1", stepVersion: 1 },
      { stepId: "deb-baseline-grade4-s2", stepVersion: 1 },
    ]);

    // Abandon the v1 session so we can test starting a brand-new session against v2:
    // without v2 parent approval, starting a new session must fail closed (403).
    await env.DB
      .prepare("UPDATE learning_sessions SET status = 'abandoned' WHERE id = ?1")
      .bind(startedV1.sessionId)
      .run();

    const unapprovedV2Start = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(unapprovedV2Start.status).toBe(403);

    // Approving v2 unlocks starting a new v2 session whose steps use `-v2-s1..s5`.
    const approveV2Res = await callWithJar(parentJar, "/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });
    expect(approveV2Res.status).toBe(200);

    const startV2Res = await callWithJar(learnerJar, "/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(startV2Res.status).toBe(200);
    const startedV2 = (await startV2Res.json()) as StartSessionResponse;
    expect(startedV2.steps.map((s) => s.id)).toEqual([
      "deb-baseline-grade4-v2-s1",
      "deb-baseline-grade4-v2-s2",
      "deb-baseline-grade4-v2-s3",
      "deb-baseline-grade4-v2-s4",
      "deb-baseline-grade4-v2-s5",
    ]);

    // Subsequent seedLessons() runs must be 100% idempotent even with both v1 & v2 in lesson_steps!
    const idempotentRun1 = await seedLessons(env.DB);
    expect(idempotentRun1).toEqual({ inserted: 0, rewritten: 0, unchanged: 100 });
    const idempotentRun2 = await seedLessons(env.DB);
    expect(idempotentRun2).toEqual({ inserted: 0, rewritten: 0, unchanged: 100 });
  });
});
