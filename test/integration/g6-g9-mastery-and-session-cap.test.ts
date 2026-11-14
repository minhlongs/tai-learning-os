/**
 * Integration proof for Gate G6 (cross-session INDEPENDENT, scheduled-review
 * first-try unlock, deterministic `recomputeLearnerState`) and Gate G9
 * (25-minute Soft Stop session cap, 15-minute eye-rest cooldown, and parent
 * password-verified extension).
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../../src/worker/index";
import type { AppEnv } from "../../src/worker/http/middleware";
import type {
  ExtendSessionTimeResponse,
  FinalizeSessionResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
} from "../../src/shared/api-contract";
import { MAX_LEARNER_SESSION_MS } from "../../src/shared/engine/session-budget";
import { recomputeLearnerState } from "../../src/shared/engine/recompute-learner-state";
import * as repo from "../../src/worker/db/repositories";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

const PASSWORD = "Mat-khau-gia-dinh-2026!";
const SESSION_SECRET = "g6-g9-integration-test-secret-key-at-least-32-chars!!";
const LEARNER_NICKNAME = "Minh";

let testDb: TestProxy;
let env: AppEnv;
let cookies: Record<string, string> = {};
let csrf: string | null = null;
let learnerId = "";

function cookieHeader(): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function captureCookies(res: Response): void {
  const raw = res.headers.getSetCookie?.() ?? [];
  const list = raw.length > 0 ? raw : [res.headers.get("set-cookie") ?? ""];
  for (const line of list) {
    if (!line) continue;
    const first = line.split(";")[0] ?? "";
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (value === "") delete cookies[name];
    else cookies[name] = value;
  }
}

async function call(
  path: string,
  init: { method?: string; json?: unknown } = {},
): Promise<Response> {
  const method = init.method ?? "GET";
  const headers = new Headers();
  const ch = cookieHeader();
  if (ch) headers.set("cookie", ch);
  if (method !== "GET" && method !== "HEAD") {
    headers.set("origin", "http://localhost:8791");
    if (csrf) headers.set("x-tlo-csrf", csrf);
  }
  let body: string | undefined;
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  const req = new Request(`http://localhost:8791${path}`, { method, headers, body });
  const res = await worker.fetch(req, env);
  captureCookies(res);
  return res;
}

async function answerKeyFor(stepId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT answer_key FROM lesson_steps WHERE id = ?1")
    .bind(stepId)
    .first<{ answer_key: string }>();
  expect(row).not.toBeNull();
  return (JSON.parse(row!.answer_key) as { correctChoiceId: string }).correctChoiceId;
}

beforeAll(async () => {
  testDb = await openTestDatabase();
  const allowAll = { limit: async () => ({ success: true }) };
  env = {
    DB: testDb.env.DB,
    SESSION_SECRET,
    ENVIRONMENT: "development",
    AUTH_RATE_LIMITER: allowAll,
    API_RATE_LIMITER: allowAll,
  };
});

afterAll(async () => {
  await testDb.dispose();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await resetData(testDb.env.DB);
  cookies = {};
  csrf = null;

  const boot = await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: "Phụ huynh Minh", password: PASSWORD },
  });
  expect(boot.status).toBe(200);

  const sessionRes = await call("/api/session");
  csrf = ((await sessionRes.json()) as { csrfToken: string }).csrfToken;

  const enrolRes = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolRes.status).toBe(200);
  learnerId = ((await enrolRes.json()) as { learner: { id: string } }).learner.id;
});

describe("Gate G6 — cross-session INDEPENDENT & scheduled review RETAINED unlock", () => {
  it("keeps same-session solves at SUPPORTED, unlocks scheduled review on 1-to-1 lessons to reach RETAINED, and matches recomputeLearnerState()", async () => {
    const lessonRow = await env.DB.prepare(
      `SELECT l.id, l.skill_id
       FROM lessons l
       WHERE l.purpose = 'official' AND l.skill_id IS NOT NULL
       ORDER BY l.id ASC LIMIT 1`,
    ).first<{ id: string; skill_id: string }>();
    expect(lessonRow).not.toBeNull();
    const lessonId = lessonRow!.id;
    const skillId = lessonRow!.skill_id;

    const appRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });
    expect(appRes.status).toBe(200);

    // Session 1: solve 2 non-transfer steps unassisted inside the SAME session
    const s1 = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId } })
    ).json()) as StartSessionResponse;
    const nonTransferSteps = s1.steps.filter((s) => s.kind !== "transfer");
    expect(nonTransferSteps.length).toBeGreaterThanOrEqual(2);

    for (const st of nonTransferSteps.slice(0, 2)) {
      const key = await answerKeyFor(st.id);
      const r = await call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: s1.sessionId,
          stepId: st.id,
          submission: { kind: "choice", choiceId: key },
          helpLevel: 0,
        },
      });
      expect(r.status).toBe(200);
    }

    // Must still be SUPPORTED because all independent solves happened in 1 session
    const evAfterS1 = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .first<{ state: string; independent_count: number; assisted_count: number }>();
    expect(evAfterS1).toEqual({
      state: "SUPPORTED",
      independent_count: 2,
      assisted_count: 0,
    });

    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s1.sessionId },
    });

    // Gate A2 check: BEFORE review is due (`due_at` is 3 days in the future),
    // re-answering `nonTransferSteps[0]` in Session 2 is STILL `assisted` (`attemptNo = 2`).
    const s2Early = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId } })
    ).json()) as StartSessionResponse;
    const key0 = await answerKeyFor(nonTransferSteps[0]!.id);
    const earlyRetry = (await (
      await call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: s2Early.sessionId,
          stepId: nonTransferSteps[0]!.id,
          submission: { kind: "choice", choiceId: key0 },
          helpLevel: 0,
        },
      })
    ).json()) as SubmitAttemptResponse;
    expect(earlyRetry.attemptNo).toBe(2);

    const earlyRow = await env.DB.prepare(
      "SELECT evidence_kind FROM learning_attempts WHERE id = ?1",
    )
      .bind(earlyRetry.attemptId)
      .first<{ evidence_kind: string }>();
    expect(earlyRow?.evidence_kind).toBe("assisted");

    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s2Early.sessionId },
    });

    // Advance the clock forward by 4 days with `vi.spyOn(Date, "now")` AND sign in
    // fresh at that instant (session cookies have an 8h TTL!).
    const fourDaysLater = Date.now() + 4 * 86_400_000;
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(fourDaysLater);
    const reLoginRes = await call("/api/session/login", {
      method: "POST",
      json: { displayName: "Phụ huynh Minh", password: PASSWORD },
    });
    expect(reLoginRes.status).toBe(200);
    csrf = ((await (await call("/api/session")).json()) as { csrfToken: string }).csrfToken;

    // Session 3 (Scheduled Review Session): learner solves `nonTransferSteps[0]` unaided on first try of this session!
    const s3Review = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId } })
    ).json()) as StartSessionResponse;
    const dueAttemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: s3Review.sessionId,
        stepId: nonTransferSteps[0]!.id,
        submission: { kind: "choice", choiceId: key0 },
        helpLevel: 0,
      },
    });
    nowSpy.mockRestore();
    expect(dueAttemptRes.status).toBe(200);
    const dueAttempt = (await dueAttemptRes.json()) as SubmitAttemptResponse;
    expect(dueAttempt.attemptNo).toBe(3);

    const dueAttemptRow = await env.DB.prepare(
      "SELECT evidence_kind FROM learning_attempts WHERE id = ?1",
    )
      .bind(dueAttempt.attemptId)
      .first<{ evidence_kind: string }>();
    expect(dueAttemptRow?.evidence_kind).toBe("observed");

    // Now across distinct sessions AND with a due scheduled review solved independently -> RETAINED!
    const evAfterReview = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .first<{ state: string; independent_count: number; assisted_count: number }>();
    expect(evAfterReview?.state).toBe("RETAINED");
    expect(evAfterReview?.independent_count).toBe(3);

    // Verify `recomputeLearnerState` reproduces the exact stored state from raw ledger rows
    const rawAttempts = await repo.listAttemptsForLearner(env.DB, learnerId);
    const transferStepIds = await repo.listTransferStepIds(env.DB);
    const recomputed = recomputeLearnerState({
      learnerId,
      attempts: rawAttempts.map((a) => ({
        id: a.id,
        sessionId: a.session_id,
        stepId: a.step_id,
        skillId: a.skill_id,
        outcome: a.outcome,
        helpLevel: a.help_level,
        evidenceKind: a.evidence_kind,
        attemptNo: a.attempt_no,
        purpose: a.purpose ?? "official",
        createdAt: a.created_at,
      })),
      transferStepIds,
    });
    expect(recomputed.skills.get(skillId)?.derivation.state).toBe(evAfterReview?.state);
    expect(recomputed.skills.get(skillId)?.derivation.independentCount).toBe(
      evAfterReview?.independent_count,
    );
  });
});

describe("Gate G9 — 25-minute Soft Stop session cap, cooldown & parent password extension", () => {
  it("allows the in-flight step at 25m, blocks advancing to a new step until extended by parent, and enforces 15m eye-rest cooldown after finalize", async () => {
    const lessons = await env.DB.prepare(
      "SELECT id FROM lessons WHERE purpose = 'official' ORDER BY id ASC LIMIT 2",
    ).all<{ id: string }>();
    const lesson1 = lessons.results![0]!.id;
    const lesson2 = lessons.results![1]!.id;

    for (const id of [lesson1, lesson2]) {
      const r = await call("/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: id, status: "approved" },
      });
      expect(r.status).toBe(200);
    }

    const started = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId: lesson1 } })
    ).json()) as StartSessionResponse;
    expect(started.sessionBudget?.applies).toBe(true);
    expect(started.sessionBudget?.budgetMs).toBe(MAX_LEARNER_SESSION_MS);

    // Backdate `started_at` by 25 minutes + 5 seconds so the session just crossed the 25-minute cap
    const backdatedStart = Date.now() - MAX_LEARNER_SESSION_MS - 5_000;
    await env.DB.prepare("UPDATE learning_sessions SET started_at = ?1 WHERE id = ?2")
      .bind(backdatedStart, started.sessionId)
      .run();

    const step0 = started.steps[0]!;
    const step1 = started.steps[1]!;
    const key0 = await answerKeyFor(step0.id);
    const key1 = await answerKeyFor(step1.id);

    // In-flight submission on step0 MUST succeed (Soft Stop saves work in progress!)
    const inFlightRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: step0.id,
        submission: { kind: "choice", choiceId: key0 },
        helpLevel: 0,
      },
    });
    expect(inFlightRes.status).toBe(200);
    const inFlightBody = (await inFlightRes.json()) as SubmitAttemptResponse;
    expect(inFlightBody.outcome).toBe("correct");
    expect(inFlightBody.sessionTimeBudgetReached).toBe(true);
    expect(inFlightBody.canAdvance).toBe(false);

    // Attempting to advance to `step1` without parent extension MUST be refused (403)
    const blockedNextStep = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: step1.id,
        submission: { kind: "choice", choiceId: key1 },
        helpLevel: 0,
      },
    });
    expect(blockedNextStep.status).toBe(403);

    // Wrong parent password fails to extend (403)
    const badExtend = await call("/api/learner/sessions/extend", {
      method: "POST",
      json: { sessionId: started.sessionId, password: "wrong-password" },
    });
    expect(badExtend.status).toBe(403);

    // Valid parent password grants +15 minutes (`session.time_extended` in audit_events)
    const okExtend = await call("/api/learner/sessions/extend", {
      method: "POST",
      json: { sessionId: started.sessionId, password: PASSWORD },
    });
    expect(okExtend.status).toBe(200);
    const extendData = (await okExtend.json()) as ExtendSessionTimeResponse;
    expect(extendData.extensionCount).toBe(1);
    expect(extendData.addedMinutes).toBe(15);

    // Now `step1` succeeds cleanly!
    const unlockedStep1 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: started.sessionId,
        stepId: step1.id,
        submission: { kind: "choice", choiceId: key1 },
        helpLevel: 0,
      },
    });
    expect(unlockedStep1.status).toBe(200);
    expect(((await unlockedStep1.json()) as SubmitAttemptResponse).sessionTimeBudgetReached).toBe(
      false,
    );

    // Simulate exhausting the extended 40-minute budget and finalizing for rest
    await env.DB.prepare("UPDATE learning_sessions SET started_at = ?1 WHERE id = ?2")
      .bind(Date.now() - 41 * 60_000, started.sessionId)
      .run();

    const finRes = await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: started.sessionId },
    });
    expect(finRes.status).toBe(200);
    expect(((await finRes.json()) as FinalizeSessionResponse).sessionId).toBe(started.sessionId);

    // Immediately trying to start a new lesson during the 15-minute eye-rest cooldown is blocked (403)
    const cooldownBlocked = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: lesson2 },
    });
    expect(cooldownBlocked.status).toBe(403);

    // Parent can override the eye-rest cooldown with password verification
    const overrideRes = await call("/api/learner/sessions/extend", {
      method: "POST",
      json: { password: PASSWORD },
    });
    expect(overrideRes.status).toBe(200);
    expect(((await overrideRes.json()) as ExtendSessionTimeResponse).restOverridden).toBe(true);

    const afterOverride = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: lesson2 },
    });
    expect(afterOverride.status).toBe(200);
  });
});
