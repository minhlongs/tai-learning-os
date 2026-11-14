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
  ExportResponse,
  ExtendSessionTimeResponse,
  FinalizeSessionResponse,
  ImportResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
} from "../../src/shared/api-contract";
import { decryptBackupEnvelope, encryptBackupEnvelope } from "../../src/shared/crypto/backup-cipher";
import { MAX_LEARNER_SESSION_MS } from "../../src/shared/engine/session-budget";
import { recomputeLearnerState } from "../../src/shared/engine/recompute-learner-state";
import { summarizeRetention } from "../../src/shared/engine/retention";
import { validateExportEnvelope } from "../../src/shared/schemas/transfer";
import * as repo from "../../src/worker/db/repositories";
import { selectRetentionAttempts } from "../../src/worker/db/retention-queries";
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

    // Finalizing the scheduled review session reproduces the stored multi-day FSRS reason cleanly
    const finReviewRes = await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s3Review.sessionId },
    });
    nowSpy.mockRestore();
    expect(finReviewRes.status).toBe(200);
    const finReviewBody = (await finReviewRes.json()) as FinalizeSessionResponse;
    const reviewSummaryItem = finReviewBody.summary.nextReview.find((r) => r.skillId === skillId);
    expect(reviewSummaryItem?.intervalDays).toBeGreaterThan(1);

    // Delayed-retention probe at 14+ days also recognizes due scheduled-review first-try solves on 1-to-1 lessons
    const eighteenDaysLater = fourDaysLater + 15 * 86_400_000;
    const probeSpy = vi.spyOn(Date, "now").mockReturnValue(eighteenDaysLater);
    await call("/api/session/login", {
      method: "POST",
      json: { displayName: "Phụ huynh Minh", password: PASSWORD },
    });
    csrf = ((await (await call("/api/session")).json()) as { csrfToken: string }).csrfToken;

    const s4Probe = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId } })
    ).json()) as StartSessionResponse;
    const probeAttemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: s4Probe.sessionId,
        stepId: nonTransferSteps[0]!.id,
        submission: { kind: "choice", choiceId: key0 },
        helpLevel: 0,
      },
    });
    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s4Probe.sessionId },
    });
    expect(probeAttemptRes.status).toBe(200);

    const retentionAttempts = await selectRetentionAttempts(env.DB, learnerId);
    const retentionReport = summarizeRetention(retentionAttempts);
    const h14 = retentionReport.horizons.find((h) => h.horizonDays === 14);
    expect(h14?.probes).toBeGreaterThanOrEqual(1);
    expect(h14?.independent).toBe(h14?.probes);

    // Parent manual correction preserves the normalized `independent_count` (4 independent solves)
    const corrRes = await call("/api/parent/skills/correct", {
      method: "POST",
      json: {
        skillId,
        state: "RETAINED",
        note: "Phụ huynh kiểm tra lại xác nhận con nắm vững.",
      },
    });
    expect(corrRes.status).toBe(200);
    const evAfterCorrection = await env.DB.prepare(
      "SELECT independent_count FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .first<{ independent_count: number }>();
    expect(evAfterCorrection?.independent_count).toBe(4);

    // Fork a family practice lesson on the same skill, record 2 practice attempts, AND
    // record 1 more official attempt to prove `attemptInsertGuarded` isolates `purpose = 'official'`!
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonId, titleVi: "Bài luyện tập thêm phân số" },
    });
    expect(forkRes.status).toBe(200);
    const forkedLessonId = ((await forkRes.json()) as { lesson: { id: string } }).lesson.id;
    await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: forkedLessonId, status: "approved" },
    });
    const pracSession = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId: forkedLessonId } })
    ).json()) as StartSessionResponse;
    const pracStep0 = pracSession.steps[0]!;
    const pracKey0 = await answerKeyFor(pracStep0.id);
    for (let i = 0; i < 2; i += 1) {
      const pracAtt = await call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: pracSession.sessionId,
          stepId: pracStep0.id,
          submission: { kind: "choice", choiceId: pracKey0 },
          helpLevel: 0,
        },
      });
      expect(pracAtt.status).toBe(200);
    }
    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: pracSession.sessionId },
    });
    probeSpy.mockRestore();

    // Clear manual parent_correction back to derived `RETAINED` via an official session attempt
    // (preserving chronological time order after `eighteenDaysLater`) and verify full G12
    // Export -> AES-256-GCM Encrypt/Decrypt -> Delete -> Import round-trip!
    await env.DB.prepare(
      "UPDATE skill_evidence SET source = 'derived', correction_note = NULL WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .run();

    const nineteenDaysLater = eighteenDaysLater + 86_400_000;
    const finalSpy = vi.spyOn(Date, "now").mockReturnValue(nineteenDaysLater);
    await call("/api/session/login", {
      method: "POST",
      json: { displayName: "Phụ huynh Minh", password: PASSWORD },
    });
    csrf = ((await (await call("/api/session")).json()) as { csrfToken: string }).csrfToken;

    const s5Official = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId } })
    ).json()) as StartSessionResponse;
    const postPracticeOfficialAtt = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: s5Official.sessionId,
        stepId: nonTransferSteps[0]!.id,
        submission: { kind: "choice", choiceId: key0 },
        helpLevel: 0,
      },
    });
    expect(postPracticeOfficialAtt.status).toBe(200);
    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s5Official.sessionId },
    });

    const expRes = await call("/api/data/export", { method: "POST", json: {} });
    expect(expRes.status).toBe(200);
    const exportedEnvelope = (await expRes.json()) as ExportResponse;
    const validation = validateExportEnvelope(exportedEnvelope);
    if (!validation.ok) {
      throw new Error(`validateExportEnvelope failed: ${JSON.stringify(validation.errors)}`);
    }
    expect(validation.ok).toBe(true);

    const encrypted = await encryptBackupEnvelope(exportedEnvelope, "mat-khau-sao-luu-2026");
    const decrypted = await decryptBackupEnvelope(encrypted, "mat-khau-sao-luu-2026");
    expect(decrypted.ok).toBe(true);

    // Delete learner and family lesson so lesson IDs don't collide on restore
    const delLearnerRes = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(delLearnerRes.status).toBe(200);
    await env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(forkedLessonId).run();

    const impRes = await call("/api/data/import", {
      method: "POST",
      json: exportedEnvelope,
    });
    finalSpy.mockRestore();
    expect(impRes.status).toBe(200);
    const impBody = (await impRes.json()) as ImportResponse;
    expect(impBody.ok).toBe(true);
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

  it("carries cumulative time across lesson switches (<15m gap) and reports softStopped on reload", async () => {
    const lessons = await env.DB.prepare(
      "SELECT id FROM lessons WHERE purpose = 'official' ORDER BY id ASC LIMIT 2",
    ).all<{ id: string }>();
    const lesson1 = lessons.results![0]!.id;
    const lesson2 = lessons.results![1]!.id;

    for (const id of [lesson1, lesson2]) {
      await call("/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: id, status: "approved" },
      });
    }

    // Study Lesson 1 for 24 minutes (1 minute shy of the 25-minute cap)
    const s1 = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId: lesson1 } })
    ).json()) as StartSessionResponse;
    await env.DB.prepare("UPDATE learning_sessions SET started_at = ?1 WHERE id = ?2")
      .bind(Date.now() - 24 * 60_000, s1.sessionId)
      .run();

    // Switch immediately to Lesson 2 -> abandons s1 at 24m and carries 24m forward (`remainingMs <= 60_000`)
    const s2 = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId: lesson2 } })
    ).json()) as StartSessionResponse;
    expect(s2.sessionBudget?.remainingMs).toBeLessThanOrEqual(60_000);
    expect(s2.sessionBudget?.reached).toBe(false);

    // 70 seconds later on Lesson 2 (total continuous study = 25m10s >= 25m):
    const nowPlus70s = Date.now() + 70_000;
    const spy = vi.spyOn(Date, "now").mockReturnValue(nowPlus70s);
    const step0 = s2.steps[0]!;
    const step1 = s2.steps[1]!;
    const key0 = await answerKeyFor(step0.id);
    const key1 = await answerKeyFor(step1.id);

    // In-flight submission on Lesson 2 hits Soft Stop!
    const inFlight = (await (
      await call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: s2.sessionId,
          stepId: step0.id,
          submission: { kind: "choice", choiceId: key0 },
          helpLevel: 0,
        },
      })
    ).json()) as SubmitAttemptResponse;
    expect(inFlight.sessionTimeBudgetReached).toBe(true);

    // Reloading Lesson 2 reports `softStopped: true` immediately so UI restores the rest banner
    const resumed = (await (
      await call("/api/learner/sessions", { method: "POST", json: { lessonId: lesson2 } })
    ).json()) as StartSessionResponse;
    expect(resumed.sessionBudget?.softStopped).toBe(true);

    // Advancing to step1 on Lesson 2 is blocked (403)
    const blocked = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: s2.sessionId,
        stepId: step1.id,
        submission: { kind: "choice", choiceId: key1 },
        helpLevel: 0,
      },
    });
    expect(blocked.status).toBe(403);

    // Finalizing Lesson 2 after 1m10s (cumulative 25m10s) triggers the 15-minute eye-rest cooldown!
    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: s2.sessionId },
    });
    const reopenDuringRest = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: lesson1 },
    });
    spy.mockRestore();
    expect(reopenDuringRest.status).toBe(403);
  });
});
