import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  RequestHintResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
} from "../../src/shared/api-contract";
import * as repo from "../../src/worker/db/repositories";
import { resetUserData } from "../../src/worker/db/reset-user-data";
import {
  loadStepContexts,
  recordAttemptWithDerivation,
} from "../../src/worker/services/session-service";
import { resetData } from "./reset-data";
import {
  getTestConfigPath,
  getTestPersistDir,
  isBrandedTestDatabase,
  openTestDatabase,
  recreateSchema,
  splitSqlStatements,
  type TestProxy,
} from "./test-db";

/**
 * End-to-end integration tests for learning evidence and audit ledger invariants:
 *
 *   1. Atomic attempt persistence: the attempt row, derived skill competency,
 *      spaced-review schedule, and `attempt.submitted` audit event commit in a
 *      single D1 batch or roll back together on failure.
 *   2. Concurrent first-attempt serialization: at most one submission per
 *      (learner_id, step_id) can claim `attempt_no = 1` and `observed` evidence,
 *      whether submitted within one session or across multiple sessions.
 *   3. Cross-session hint disclosure floor: `requestHint` requires a verified
 *      in-progress session belonging to the learner and step's lesson, withholds
 *      the hint if the audit write fails, and floors `helpLevel` across sessions
 *      and legacy session-less audit rows.
 *   4. Database-enforced append-only `audit_events` ledger: SQLite triggers
 *      reject `UPDATE` and `DELETE` statements while preserving `INSERT`,
 *      `SELECT`, and learner deletion flows.
 *   5. Schema v3 -> v4 upgrade compatibility: applying `0004_evidence_integrity.sql`
 *      to a populated v3 database preserves existing append-only evidence and
 *      fails loudly without data loss if duplicate `(learner_id, step_id, attempt_no)`
 *      rows exist.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "..", "migrations");

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Tài";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

let worker: { fetch: typeof fetch };
let env: Env;
let proxy: TestProxy;

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };
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

async function call(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  return callWithJar(jar, path, init);
}

function absorbSessionInto(targetJar: Jar, response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value.length === 0) delete targetJar.cookies[name];
    else targetJar.cookies[name] = value;
  }
}

async function loginInto(targetJar: Jar, displayName = DISPLAY_NAME, password = PASSWORD): Promise<void> {
  const response = await callWithJar(targetJar, "/api/session/login", {
    method: "POST",
    json: { displayName, password },
  });
  expect(response.status).toBe(200);
  absorbSessionInto(targetJar, response);
  targetJar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
}

async function answerKeyFor(stepId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT answer_key FROM lesson_steps WHERE id = ?1")
    .bind(stepId)
    .first<{ answer_key: string }>();
  const parsed = JSON.parse(row!.answer_key) as { correctChoiceId: string };
  return parsed.correctChoiceId;
}

async function approveFirstLesson(): Promise<string> {
  const lessons = (await (await call("/api/parent/lessons")).json()) as {
    lessons: { id: string }[];
  };
  const lessonId = lessons.lessons[0]!.id;
  const res = await call("/api/parent/lessons/approval", {
    method: "POST",
    json: { lessonId, status: "approved" },
  });
  expect(res.status).toBe(200);
  return lessonId;
}

async function startApprovedSession(lessonId: string): Promise<StartSessionResponse> {
  const res = await call("/api/learner/sessions", {
    method: "POST",
    json: { lessonId },
  });
  expect(res.status).toBe(200);
  return (await res.json()) as StartSessionResponse;
}

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

let learnerId: string;

beforeEach(async () => {
  vi.restoreAllMocks();
  await resetData(env.DB);
  jar.cookies = {};
  jar.csrf = null;

  const boot = await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(boot.status).toBe(200);
  await loginInto(jar);

  const enrolRes = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolRes.status).toBe(200);
  const enrolled = (await enrolRes.json()) as { learner: { id: string } };
  learnerId = enrolled.learner.id;
});

describe("atomic attempt, derivation, review schedule, and audit batch boundary", () => {
  it("rolls back the attempt, skill_evidence, and review_schedule when the audit insert fails inside db.batch, and succeeds cleanly on retry", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    // Inject a real database-level failure on the audit_events INSERT for attempt.submitted.
    // Because statements[0] is the learning_attempts INSERT and statements[1] is the
    // audit_events INSERT inside db.batch, this proves D1 rolls back the already-executed
    // attempt INSERT and skips/reverts the skill_evidence and review_schedule upserts.
    await env.DB.prepare(
      `CREATE TRIGGER fault_inject_attempt_audit
         BEFORE INSERT ON audit_events
         WHEN NEW.action = 'attempt.submitted'
       BEGIN
         SELECT RAISE(ABORT, 'injected audit write failure');
       END`,
    ).run();

    const failedRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
      },
    });
    expect(failedRes.status).toBe(500);

    const attemptsAfterFault = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    const evidenceAfterFault = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM skill_evidence WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    const reviewAfterFault = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM review_schedule WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    const auditAfterFault = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'attempt.submitted'",
    ).first<{ n: number }>();

    expect(attemptsAfterFault?.n).toBe(0);
    expect(evidenceAfterFault?.n).toBe(0);
    expect(reviewAfterFault?.n).toBe(0);
    expect(auditAfterFault?.n).toBe(0);

    // Remove the injected fault and retry the exact same submission.
    await env.DB.prepare("DROP TRIGGER fault_inject_attempt_audit").run();

    const retryRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
      },
    });
    expect(retryRes.status).toBe(200);
    const retryBody = (await retryRes.json()) as SubmitAttemptResponse;
    expect(retryBody.outcome).toBe("correct");
    expect(retryBody.attemptNo).toBe(1);

    const attemptRow = await env.DB.prepare(
      "SELECT id, attempt_no, evidence_kind, help_level FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2",
    )
      .bind(learnerId, stepId)
      .first<{ id: string; attempt_no: number; evidence_kind: string; help_level: number }>();
    expect(attemptRow?.attempt_no).toBe(1);
    expect(attemptRow?.evidence_kind).toBe("observed");
    expect(attemptRow?.help_level).toBe(0);

    const evidenceRow = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count, correct_count FROM skill_evidence WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ state: string; independent_count: number; assisted_count: number; correct_count: number }>();
    expect(evidenceRow?.independent_count).toBe(1);
    expect(evidenceRow?.assisted_count).toBe(0);
    expect(evidenceRow?.correct_count).toBe(1);

    const reviewRow = await env.DB.prepare(
      "SELECT interval_days, last_result, failure_streak FROM review_schedule WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ interval_days: number; last_result: string; failure_streak: number }>();
    expect(reviewRow?.interval_days).toBe(1);
    expect(reviewRow?.last_result).toBe("passed");
    expect(reviewRow?.failure_streak).toBe(0);

    const auditRow = await env.DB.prepare(
      "SELECT actor, subject, detail FROM audit_events WHERE action = 'attempt.submitted'",
    ).first<{ actor: string; subject: string; detail: string }>();
    expect(auditRow?.actor).toBe(`learner:${learnerId}`);
    expect(auditRow?.subject).toBe(stepId);

    const detail = JSON.parse(auditRow!.detail) as Record<string, unknown>;
    expect(detail).toEqual({
      sessionId: session.sessionId,
      attemptId: retryBody.attemptId,
      outcome: "correct",
      attemptNo: 1,
      helpLevel: 0,
    });
    // Audit detail must never leak the submitted answer, choiceId, or explanation text.
    expect(Object.keys(detail).sort()).toEqual([
      "attemptId",
      "attemptNo",
      "helpLevel",
      "outcome",
      "sessionId",
    ]);
    expect(detail).not.toHaveProperty("submission");
    expect(detail).not.toHaveProperty("submitted");
    expect(detail).not.toHaveProperty("choiceId");
    expect(detail).not.toHaveProperty("explanationVi");
  });

  it("rolls back the attempt and audit row when a derived write (skill_evidence) fails inside db.batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    await env.DB.prepare(
      `CREATE TRIGGER fault_inject_skill_evidence
         BEFORE INSERT ON skill_evidence
       BEGIN
         SELECT RAISE(ABORT, 'injected skill_evidence failure');
       END`,
    ).run();

    const failedRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
      },
    });
    expect(failedRes.status).toBe(500);

    await env.DB.prepare("DROP TRIGGER fault_inject_skill_evidence").run();

    const attemptsCount = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    const auditCount = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'attempt.submitted'",
    ).first<{ n: number }>();

    expect(attemptsCount?.n).toBe(0);
    expect(auditCount?.n).toBe(0);
  });
});

describe("concurrent first-attempt uniqueness and conflict-retry derivation", () => {
  it("assigns attempt_no = 1 to at most one submission when two identical first attempts fire concurrently in the same session", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    const payload = {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: correctChoice },
      helpLevel: 0,
    };

    const [resA, resB] = await Promise.all([
      call("/api/learner/attempts", { method: "POST", json: payload }),
      call("/api/learner/attempts", { method: "POST", json: payload }),
    ]);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const bodyA = (await resA.json()) as SubmitAttemptResponse;
    const bodyB = (await resB.json()) as SubmitAttemptResponse;
    expect([bodyA.attemptNo, bodyB.attemptNo].sort((a, b) => a - b)).toEqual([1, 2]);

    const attempts = (
      await env.DB.prepare(
        "SELECT attempt_no, evidence_kind, outcome, help_level FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2 ORDER BY attempt_no ASC",
      )
        .bind(learnerId, stepId)
        .all<{ attempt_no: number; evidence_kind: string; outcome: string; help_level: number }>()
    ).results ?? [];

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toEqual({
      attempt_no: 1,
      evidence_kind: "observed",
      outcome: "correct",
      help_level: 0,
    });
    expect(attempts[1]).toEqual({
      attempt_no: 2,
      evidence_kind: "assisted",
      outcome: "correct",
      help_level: 0,
    });

    // Competency must NOT promote to INDEPENDENT from a duplicate retry on the same step:
    // only 1 attempt is independent (observed), the second is assisted.
    const evidence = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count, correct_count FROM skill_evidence WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ state: string; independent_count: number; assisted_count: number; correct_count: number }>();
    expect(evidence?.independent_count).toBe(1);
    expect(evidence?.assisted_count).toBe(1);
    expect(evidence?.correct_count).toBe(2);
    expect(evidence?.state).toBe("SUPPORTED");
  });

  it("assigns attempt_no = 1 to at most one submission across two different sessions for the same learner and step", async () => {
    const lessonId = await approveFirstLesson();
    const session1 = await startApprovedSession(lessonId);
    const stepId = session1.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    // Create a second in-progress session for the same learner and lesson to exercise cross-session concurrency
    const session2Id = crypto.randomUUID();
    await repo.createSession(env.DB, {
      id: session2Id,
      learnerId,
      lessonId,
      lessonVersion: 1,
      schoolYearId: null,
      now: Date.now(),
    });

    const [res1, res2] = await Promise.all([
      call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: session1.sessionId,
          stepId,
          submission: { kind: "choice", choiceId: correctChoice },
          helpLevel: 0,
        },
      }),
      call("/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: session2Id,
          stepId,
          submission: { kind: "choice", choiceId: correctChoice },
          helpLevel: 0,
        },
      }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const attempts = (
      await env.DB.prepare(
        "SELECT session_id, attempt_no, evidence_kind FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2 ORDER BY attempt_no ASC",
      )
        .bind(learnerId, stepId)
        .all<{ session_id: string; attempt_no: number; evidence_kind: string }>()
    ).results ?? [];

    expect(attempts).toHaveLength(2);
    expect(attempts.map((a) => a.attempt_no)).toEqual([1, 2]);
    expect(attempts.filter((a) => a.evidence_kind === "observed")).toHaveLength(1);
    expect(attempts.filter((a) => a.evidence_kind === "assisted")).toHaveLength(1);
  });

  it("recovers from a true UNIQUE(learner_id, step_id, attempt_no) race between summary read and batch commit, recomputing mastery as assisted", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepContexts = await loadStepContexts(env.DB, lessonId);
    const stepContext = stepContexts[0]!;
    const correctChoice = await answerKeyFor(stepContext.stepId);

    const realSummary = repo.getStepAttemptSummaryForLearner;
    let injectedWinner = false;

    // Simulate a concurrent writer committing attempt_no = 1 right after this call
    // reads priorAttemptCount = 0 / nextAttemptNo = 1 and before its db.batch executes.
    vi.spyOn(repo, "getStepAttemptSummaryForLearner").mockImplementation(
      async (db, lId, sId) => {
        const summary = await realSummary(db, lId, sId);
        if (!injectedWinner) {
          injectedWinner = true;
          await repo.recordAttempt(db, {
            id: crypto.randomUUID(),
            sessionId: session.sessionId,
            learnerId: lId,
            lessonId,
            stepId: sId,
            stepVersion: stepContext.contentVersion,
            skillId: stepContext.skillId,
            submitted: JSON.stringify({ kind: "choice", choiceId: correctChoice }),
            outcome: "correct",
            helpLevel: 0,
            evidenceKind: "observed",
            attemptNo: 1,
            now: 1_700_000_000_000,
          });
        }
        return summary;
      },
    );

    const result = await recordAttemptWithDerivation(env.DB, {
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      step: stepContext,
      submission: { kind: "choice", choiceId: correctChoice },
      helpLevel: 0,
      now: 1_700_000_000_100,
    });

    // The losing writer must re-number to 2 and recompute derivedState from both attempts.
    expect(result.attemptNo).toBe(2);
    expect(result.derivedState).toBe("SUPPORTED");

    const rows = (
      await env.DB.prepare(
        "SELECT attempt_no, evidence_kind FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2 ORDER BY attempt_no ASC",
      )
        .bind(learnerId, stepContext.stepId)
        .all<{ attempt_no: number; evidence_kind: string }>()
    ).results ?? [];

    expect(rows).toEqual([
      { attempt_no: 1, evidence_kind: "observed" },
      { attempt_no: 2, evidence_kind: "assisted" },
    ]);

    const evidence = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count, correct_count FROM skill_evidence WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ state: string; independent_count: number; assisted_count: number; correct_count: number }>();
    expect(evidence).toEqual({
      state: "SUPPORTED",
      independent_count: 1,
      assisted_count: 1,
      correct_count: 2,
    });
  });

  it("handles legacy gaps in attempt_no (e.g. attempt_no = 2 without attempt_no = 1) by assigning MAX + 1 = 3 and marking as assisted", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepContexts = await loadStepContexts(env.DB, lessonId);
    const stepContext = stepContexts[0]!;
    const correctChoice = await answerKeyFor(stepContext.stepId);

    // Pre-insert a gapped attempt row with attempt_no = 2 (no attempt_no = 1)
    await repo.recordAttempt(env.DB, {
      id: crypto.randomUUID(),
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      stepId: stepContext.stepId,
      stepVersion: stepContext.contentVersion,
      skillId: stepContext.skillId,
      submitted: JSON.stringify({ kind: "choice", choiceId: correctChoice }),
      outcome: "incorrect",
      helpLevel: 0,
      evidenceKind: "assisted",
      attemptNo: 2,
      now: 1_700_000_000_000,
    });

    const result = await recordAttemptWithDerivation(env.DB, {
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      step: stepContext,
      submission: { kind: "choice", choiceId: correctChoice },
      helpLevel: 0,
      now: 1_700_000_000_100,
    });

    // MAX(attempt_no) + 1 = 3, never COUNT(*) + 1 = 2 (which would collide with existing attempt_no = 2)
    expect(result.attemptNo).toBe(3);

    const rows = (
      await env.DB.prepare(
        "SELECT attempt_no, evidence_kind FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2 ORDER BY attempt_no ASC",
      )
        .bind(learnerId, stepContext.stepId)
        .all<{ attempt_no: number; evidence_kind: string }>()
    ).results ?? [];
    expect(rows).toEqual([
      { attempt_no: 2, evidence_kind: "assisted" },
      { attempt_no: 3, evidence_kind: "assisted" },
    ]);
  });

  it("prevents stale mastery overwrite when two concurrent submissions on different steps of the same skill interleave between read and batch commit", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepContexts = await loadStepContexts(env.DB, lessonId);
    const step0 = stepContexts[0]!;
    const step3 = stepContexts[3]!;
    expect(step0.skillId).toBeTruthy();
    expect(step0.skillId).toBe(step3.skillId);
    const choice0 = await answerKeyFor(step0.stepId);
    const choice3 = await answerKeyFor(step3.stepId);

    const realListAttempts = repo.listAttemptsForLearner;
    let injectedConcurrentStep = false;

    // Request A (on step0) reads 0 attempts for the skill; before Request A's batch commits,
    // Request B (on step3, same skill) commits its independent attempt and derives DEVELOPING (1 independent).
    // Request A's batch must detect that the skill attempt count changed, abort, re-read both attempts,
    // and commit INDEPENDENT (2 independent) instead of overwriting skill_evidence with stale DEVELOPING (1 independent).
    vi.spyOn(repo, "listAttemptsForLearner").mockImplementation(async (db, lId) => {
      const rows = await realListAttempts(db, lId);
      if (!injectedConcurrentStep) {
        injectedConcurrentStep = true;
        await recordAttemptWithDerivation(db, {
          sessionId: session.sessionId,
          learnerId: lId,
          lessonId,
          step: step3,
          submission: { kind: "choice", choiceId: choice3 },
          helpLevel: 0,
          now: 1_700_000_000_050,
        });
      }
      return rows;
    });

    const resultA = await recordAttemptWithDerivation(env.DB, {
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      step: step0,
      submission: { kind: "choice", choiceId: choice0 },
      helpLevel: 0,
      now: 1_700_000_000_100,
    });

    expect(resultA.attemptNo).toBe(1);
    expect(resultA.derivedState).toBe("INDEPENDENT");

    const skillEvidence = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count, correct_count FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, step0.skillId)
      .first<{ state: string; independent_count: number; assisted_count: number; correct_count: number }>();

    expect(skillEvidence).toEqual({
      state: "INDEPENDENT",
      independent_count: 2,
      assisted_count: 0,
      correct_count: 2,
    });
  });

  it("caps conflict recovery at bounded retries (MAX_CONCURRENCY_RETRIES = 4) and never retries unrelated constraint errors", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepContexts = await loadStepContexts(env.DB, lessonId);
    const stepContext = stepContexts[0]!;
    const correctChoice = await answerKeyFor(stepContext.stepId);

    // Pre-insert attempt_no = 1 while forcing getStepAttemptSummaryForLearner to return stale snapshot
    // on every retry round so all 1 + 4 = 5 attempts fail the guarded snapshot assertion.
    await repo.recordAttempt(env.DB, {
      id: crypto.randomUUID(),
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      stepId: stepContext.stepId,
      stepVersion: stepContext.contentVersion,
      skillId: stepContext.skillId,
      submitted: JSON.stringify({ kind: "choice", choiceId: correctChoice }),
      outcome: "correct",
      helpLevel: 0,
      evidenceKind: "observed",
      attemptNo: 1,
      now: 1_700_000_000_000,
    });

    const summarySpy = vi
      .spyOn(repo, "getStepAttemptSummaryForLearner")
      .mockResolvedValue({ priorAttemptCount: 0, nextAttemptNo: 1 });

    await expect(
      recordAttemptWithDerivation(env.DB, {
        sessionId: session.sessionId,
        learnerId,
        lessonId,
        step: stepContext,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
        now: 1_700_000_000_100,
      }),
    ).rejects.toThrow(/NOT NULL constraint failed: learning_attempts\.attempt_no/);
    // 1 initial attempt + 4 bounded retries = 5 calls total.
    expect(summarySpy).toHaveBeenCalledTimes(5);

    summarySpy.mockRestore();

    // Unrelated constraint error inside db.batch (e.g., foreign key violation from unknown lessonId,
    // or PK collision on learning_attempts.id) must not retry at all.
    const nonConflictSpy = vi.spyOn(repo, "getStepAttemptSummaryForLearner");
    await expect(
      recordAttemptWithDerivation(env.DB, {
        sessionId: session.sessionId,
        learnerId,
        lessonId: "non-existent-lesson-id",
        step: stepContext,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
        now: 1_700_000_000_200,
      }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
    expect(nonConflictSpy).toHaveBeenCalledTimes(1);

    // Primary key collision on learning_attempts.id (not on (learner_id, step_id, attempt_no)) must not retry
    nonConflictSpy.mockClear();
    const existingAttempt = await env.DB.prepare(
      "SELECT id FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2 LIMIT 1",
    )
      .bind(learnerId, stepContext.stepId)
      .first<{ id: string }>();
    const uuidSpy = vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(existingAttempt!.id as `${string}-${string}-${string}-${string}-${string}`);
    await expect(
      recordAttemptWithDerivation(env.DB, {
        sessionId: session.sessionId,
        learnerId,
        lessonId,
        step: stepContext,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
        now: 1_700_000_000_300,
      }),
    ).rejects.toThrow(/UNIQUE constraint failed: learning_attempts\.id/);
    expect(nonConflictSpy).toHaveBeenCalledTimes(1);
    uuidSpy.mockRestore();
  });

  it("does not affect attempt numbering or observed status for a different step or a different learner", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const step0 = session.steps[0]!;
    const step3 = session.steps[3]!;
    const choice0 = await answerKeyFor(step0.id);
    const choice3 = await answerKeyFor(step3.id);

    const res0 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step0.id,
        submission: { kind: "choice", choiceId: choice0 },
        helpLevel: 0,
      },
    });
    const res3 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step3.id,
        submission: { kind: "choice", choiceId: choice3 },
        helpLevel: 0,
      },
    });
    expect(res0.status).toBe(200);
    expect(res3.status).toBe(200);
    expect(((await res0.json()) as SubmitAttemptResponse).attemptNo).toBe(1);
    expect(((await res3.json()) as SubmitAttemptResponse).attemptNo).toBe(1);

    // Two distinct independent steps on the same skill promote competency to INDEPENDENT
    const evidence = await env.DB.prepare(
      "SELECT state, independent_count, assisted_count FROM skill_evidence WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ state: string; independent_count: number; assisted_count: number }>();
    expect(evidence?.independent_count).toBe(2);
    expect(evidence?.assisted_count).toBe(0);
    expect(evidence?.state).toBe("INDEPENDENT");
  });
});

describe("cross-session hint disclosure floor and session-scoped hint validation", () => {
  it("floors helpLevel in session B when a hint was disclosed for the same learner and step in session A", async () => {
    const lessonId = await approveFirstLesson();
    const sessionA = await startApprovedSession(lessonId);
    const stepId = sessionA.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    // Disclose level 2 hint in session A without submitting an attempt
    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: sessionA.sessionId,
        stepId,
        currentLevel: 2,
      },
    });
    expect(hintRes.status).toBe(200);
    const hintBody = (await hintRes.json()) as RequestHintResponse;
    expect(hintBody.level).toBe(2);
    expect(hintBody.hintVi).toBeTruthy();

    // Abandon/finalize session A and open session B for the same lesson
    const finRes = await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: sessionA.sessionId },
    });
    expect(finRes.status).toBe(200);

    const sessionB = await startApprovedSession(lessonId);
    expect(sessionB.sessionId).not.toBe(sessionA.sessionId);

    // Submit correct answer in session B claiming helpLevel: 0
    const submitRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: sessionB.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
      },
    });
    expect(submitRes.status).toBe(200);

    const stored = await env.DB.prepare(
      "SELECT help_level, evidence_kind, attempt_no FROM learning_attempts WHERE session_id = ?1 AND step_id = ?2",
    )
      .bind(sessionB.sessionId, stepId)
      .first<{ help_level: number; evidence_kind: string; attempt_no: number }>();

    expect(stored?.attempt_no).toBe(1);
    expect(stored?.help_level).toBe(2);
    expect(stored?.evidence_kind).toBe("assisted");
  });

  it("rejects hint requests with missing, nonexistent, foreign, finalized, or lesson-mismatched sessionId without disclosing hint text", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;

    // 1. Missing sessionId
    const missingSession = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId, currentLevel: 1 },
    });
    expect(missingSession.status).toBe(400);
    expect(await missingSession.text()).not.toContain("hintVi");

    // 2. Nonexistent sessionId
    const unknownSession = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId, sessionId: "non-existent-session-id", currentLevel: 1 },
    });
    expect(unknownSession.status).toBe(404);
    expect(await unknownSession.text()).not.toContain("hintVi");

    // 3. Step from a different lesson
    const otherStep = await env.DB.prepare(
      "SELECT id FROM lesson_steps WHERE lesson_id != ?1 LIMIT 1",
    )
      .bind(lessonId)
      .first<{ id: string }>();
    const wrongLessonStep = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId: otherStep!.id, sessionId: session.sessionId, currentLevel: 1 },
    });
    expect(wrongLessonStep.status).toBe(400);
    expect(await wrongLessonStep.text()).not.toContain("hintVi");

    // 4. Foreign learner's session under another parent
    const otherParentId = crypto.randomUUID();
    const otherLearnerId = crypto.randomUUID();
    const otherSessionId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, 'Phụ huynh 2', 'hash', ?2, ?2)",
    )
      .bind(otherParentId, Date.now())
      .run();
    await repo.createLearner(env.DB, {
      id: otherLearnerId,
      parentId: otherParentId,
      nickname: "Bé B",
      birthYear: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      now: Date.now(),
    });
    await repo.createSession(env.DB, {
      id: otherSessionId,
      learnerId: otherLearnerId,
      lessonId,
      lessonVersion: 1,
      schoolYearId: null,
      now: Date.now(),
    });

    const foreignSessionRes = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId, sessionId: otherSessionId, currentLevel: 1 },
    });
    expect(foreignSessionRes.status).toBe(404);
    expect(await foreignSessionRes.text()).not.toContain("hintVi");

    // 5. Finalized session
    await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: session.sessionId },
    });
    const finalizedSessionRes = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId, sessionId: session.sessionId, currentLevel: 1 },
    });
    expect(finalizedSessionRes.status).toBe(400);
    expect(await finalizedSessionRes.text()).not.toContain("hintVi");

    // Confirm zero hint.requested rows were written for any of the rejected requests
    const hintAudits = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'hint.requested'",
    ).first<{ n: number }>();
    expect(hintAudits?.n).toBe(0);
  });

  it("honours legacy hint.requested audit rows that lack sessionId without spreading the floor to other steps or learners", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const step0 = session.steps[0]!;
    const step3 = session.steps[3]!;
    const choice0 = await answerKeyFor(step0.id);
    const choice3 = await answerKeyFor(step3.id);

    // Insert a legacy session-less hint.requested row for learnerId on step0
    await repo.recordAudit(env.DB, {
      id: crypto.randomUUID(),
      actor: `learner:${learnerId}`,
      action: "hint.requested",
      subject: step0.id,
      detail: JSON.stringify({ level: 3 }),
      now: Date.now() - 60_000,
    });

    // Also insert a hint.requested row for a DIFFERENT learner on step3
    await repo.recordAudit(env.DB, {
      id: crypto.randomUUID(),
      actor: "learner:other-learner-id",
      action: "hint.requested",
      subject: step3.id,
      detail: JSON.stringify({ level: 4 }),
      now: Date.now() - 60_000,
    });

    // Submit step0 with helpLevel: 0 -> floored to 3 (assisted) by legacy row
    const res0 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step0.id,
        submission: { kind: "choice", choiceId: choice0 },
        helpLevel: 0,
      },
    });
    expect(res0.status).toBe(200);

    // Submit step3 with helpLevel: 0 -> unaffected by step0 or other learner, stays 0 (observed)
    const res3 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step3.id,
        submission: { kind: "choice", choiceId: choice3 },
        helpLevel: 0,
      },
    });
    expect(res3.status).toBe(200);

    const row0 = await env.DB.prepare(
      "SELECT help_level, evidence_kind FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2",
    )
      .bind(learnerId, step0.id)
      .first<{ help_level: number; evidence_kind: string }>();
    const row3 = await env.DB.prepare(
      "SELECT help_level, evidence_kind FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2",
    )
      .bind(learnerId, step3.id)
      .first<{ help_level: number; evidence_kind: string }>();

    expect(row0).toEqual({ help_level: 3, evidence_kind: "assisted" });
    expect(row3).toEqual({ help_level: 0, evidence_kind: "observed" });
  });

  it("withholds the hint payload when recording the hint.requested audit row fails", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;

    await env.DB.prepare(
      `CREATE TRIGGER fault_inject_hint_audit
         BEFORE INSERT ON audit_events
         WHEN NEW.action = 'hint.requested'
       BEGIN
         SELECT RAISE(ABORT, 'injected hint audit failure');
       END`,
    ).run();

    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        currentLevel: 2,
      },
    });
    expect(hintRes.status).toBe(500);
    const rawText = await hintRes.text();
    expect(rawText).not.toContain("hintVi");

    await env.DB.prepare("DROP TRIGGER fault_inject_hint_audit").run();
  });

  it("enforces hint/attempt linearization: if hint.requested commits after submitAttempt reads its snapshot, the attempt batch aborts, re-reads the hint floor, and commits as assisted", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepContexts = await loadStepContexts(env.DB, lessonId);
    const stepContext = stepContexts[0]!;
    const correctChoice = await answerKeyFor(stepContext.stepId);

    const realGetHintState = repo.getDisclosedHintState;
    let injectedConcurrentHint = false;

    // Simulate requestHint committing its hint.requested audit row AFTER submitAttempt
    // reads hintState = { maxLevel: 0, auditCount: 0 } and BEFORE submitAttempt's db.batch commits.
    vi.spyOn(repo, "getDisclosedHintState").mockImplementation(async (db, input) => {
      const state = await realGetHintState(db, input);
      if (!injectedConcurrentHint) {
        injectedConcurrentHint = true;
        await repo.recordAudit(db, {
          id: crypto.randomUUID(),
          actor: `learner:${input.learnerId}`,
          action: "hint.requested",
          subject: input.stepId,
          detail: JSON.stringify({ level: 2, sessionId: session.sessionId }),
          now: 1_700_000_000_010,
        });
      }
      return state;
    });

    const result = await recordAttemptWithDerivation(env.DB, {
      sessionId: session.sessionId,
      learnerId,
      lessonId,
      step: stepContext,
      submission: { kind: "choice", choiceId: correctChoice },
      helpLevel: 0,
      now: 1_700_000_000_020,
    });

    expect(result.attemptNo).toBe(1);
    expect(result.derivedState).toBe("SUPPORTED");

    const storedAttempt = await env.DB.prepare(
      "SELECT help_level, evidence_kind, attempt_no FROM learning_attempts WHERE id = ?1",
    )
      .bind(result.attemptId)
      .first<{ help_level: number; evidence_kind: string; attempt_no: number }>();

    expect(storedAttempt).toEqual({
      help_level: 2,
      evidence_kind: "assisted",
      attempt_no: 1,
    });
  });

  it("clamps out-of-range legacy or corrupted hint levels in findMaxDisclosedHintLevel to [0, 4]", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;

    await repo.recordAudit(env.DB, {
      id: crypto.randomUUID(),
      actor: `learner:${learnerId}`,
      action: "hint.requested",
      subject: stepId,
      detail: JSON.stringify({ level: 999 }),
      now: Date.now(),
    });

    const maxLevel = await repo.findMaxDisclosedHintLevel(env.DB, {
      learnerId,
      stepId,
    });
    expect(maxLevel).toBe(4);
  });
});

describe("database-enforced append-only audit_events triggers and strict test/user-data reset separation", () => {
  it("keeps audit_events_no_update and audit_events_no_delete active after reset and blocks UPDATE and DELETE while permitting INSERT and SELECT", async () => {
    const triggers = (
      await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
      ).all<{ name: string }>()
    ).results ?? [];
    expect(triggers.map((t) => t.name)).toEqual([
      "audit_events_no_delete",
      "audit_events_no_update",
    ]);

    const auditId = crypto.randomUUID();
    await repo.recordAudit(env.DB, {
      id: auditId,
      actor: `parent:test`,
      action: "test.append_only",
      subject: "subject-original",
      detail: JSON.stringify({ intact: true }),
      now: 1_700_000_000_000,
    });

    const inserted = await env.DB.prepare(
      "SELECT id, actor, action, subject, detail, created_at FROM audit_events WHERE id = ?1",
    )
      .bind(auditId)
      .first<{ id: string; actor: string; action: string; subject: string; detail: string; created_at: number }>();
    expect(inserted?.subject).toBe("subject-original");

    // Direct SQL UPDATE must fail and leave the row untouched
    await expect(
      env.DB.prepare("UPDATE audit_events SET subject = 'tampered', detail = '{}' WHERE id = ?1")
        .bind(auditId)
        .run(),
    ).rejects.toThrow(/audit_events is append-only: UPDATE is not permitted/);

    const afterUpdateAttempt = await env.DB.prepare(
      "SELECT subject, detail FROM audit_events WHERE id = ?1",
    )
      .bind(auditId)
      .first<{ subject: string; detail: string }>();
    expect(afterUpdateAttempt).toEqual({
      subject: "subject-original",
      detail: JSON.stringify({ intact: true }),
    });

    // Direct SQL DELETE (targeted or blanket) must fail and leave the row present
    await expect(
      env.DB.prepare("DELETE FROM audit_events WHERE id = ?1").bind(auditId).run(),
    ).rejects.toThrow(/audit_events is append-only: DELETE is not permitted/);

    await expect(
      env.DB.prepare("DELETE FROM audit_events").run(),
    ).rejects.toThrow(/audit_events is append-only: DELETE is not permitted/);

    const afterDeleteAttempt = await env.DB.prepare(
      "SELECT id, subject, detail FROM audit_events WHERE id = ?1",
    )
      .bind(auditId)
      .first<{ id: string; subject: string; detail: string }>();
    expect(afterDeleteAttempt?.id).toBe(auditId);
    expect(afterDeleteAttempt?.subject).toBe("subject-original");
  });

  it("allows confirmed learner deletion (DELETE /api/data/learner) to cascade learner tables while preserving the append-only audit trail", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startApprovedSession(lessonId);
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    const submitRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice },
        helpLevel: 0,
      },
    });
    expect(submitRes.status).toBe(200);

    const deleteRes = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleteRes.status).toBe(200);

    const learnerRemaining = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learners WHERE id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    const attemptsRemaining = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(learnerRemaining?.n).toBe(0);
    expect(attemptsRemaining?.n).toBe(0);

    const deletedAudit = await env.DB.prepare(
      "SELECT action, subject FROM audit_events WHERE action = 'learner.deleted' AND subject = ?1",
    )
      .bind(learnerId)
      .first<{ action: string; subject: string }>();
    expect(deletedAudit).toEqual({ action: "learner.deleted", subject: learnerId });
  });

  it("keeps test runtime config and D1 persistence strictly outside the repo and refuses recreateSchema on unbranded D1Database handles", async () => {
    const repoRoot = join(HERE, "..", "..");
    const persistDir = getTestPersistDir();
    const configPath = getTestConfigPath();

    // The test runtime root is the parent of the D1 persistence dir, so both it
    // and the config file must live outside the repository tree. A config or
    // state file inside the repo could point a test at the owner's dev database.
    expect(persistDir.startsWith(repoRoot)).toBe(false);
    expect(configPath.startsWith(repoRoot)).toBe(false);
    expect(configPath.startsWith(dirname(persistDir))).toBe(true);
    expect(isBrandedTestDatabase(env.DB)).toBe(true);

    // An unbranded D1Database handle (e.g., if someone passed a non-test DB handle) is rejected before any SQL runs
    const unbrandedDb = Object.create(env.DB) as D1Database;
    expect(isBrandedTestDatabase(unbrandedDb)).toBe(false);
    await expect(recreateSchema(unbrandedDb)).rejects.toThrow(
      /Refusing to run destructive recreateSchema on an unbranded D1Database handle/,
    );
  });

  it("clears only user data while preserving catalogue, migrations, triggers and the audit ledger, and fails closed once audit rows exist", async () => {
    // Start with a clean schema so the empty-ledger path is tested with zero audit rows.
    await recreateSchema(env.DB);

    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p-clean', 'Parent', 'hash', ?1, ?1)",
    )
      .bind(now)
      .run();

    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TEXT NOT NULL)",
    ).run();
    await env.DB.prepare(
      "INSERT OR IGNORE INTO d1_migrations (name, applied_at) VALUES ('0001_initial_schema.sql', '2026-10-30T00:00:00Z')",
    ).run();

    const parentsBefore = await env.DB.prepare("SELECT COUNT(*) AS n FROM parents").first<{ n: number }>();
    expect(parentsBefore!.n).toBe(1);
    const versionsBefore = await env.DB.prepare("SELECT COUNT(*) AS n FROM schema_versions").first<{ n: number }>();
    expect(versionsBefore!.n, "catalogue data is present").toBeGreaterThanOrEqual(3);

    await resetUserData(env.DB);

    const parentsLeft = await env.DB.prepare("SELECT COUNT(*) AS n FROM parents").first<{ n: number }>();
    const attemptsLeft = await env.DB.prepare("SELECT COUNT(*) AS n FROM learning_attempts").first<{ n: number }>();
    const migRow = await env.DB.prepare(
      "SELECT name FROM d1_migrations WHERE name = '0001_initial_schema.sql'",
    ).first<{ name: string }>();
    const versionsLeft = await env.DB.prepare("SELECT COUNT(*) AS n FROM schema_versions").first<{ n: number }>();
    const skillsLeft = await env.DB.prepare("SELECT COUNT(*) AS n FROM skills").first<{ n: number }>();
    const triggersLeft = (
      await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
      ).all<{ name: string }>()
    ).results ?? [];

    expect(parentsLeft!.n, "user data is cleared").toBe(0);
    expect(attemptsLeft!.n, "user data is cleared").toBe(0);
    expect(migRow?.name, "d1_migrations is not user data").toBe("0001_initial_schema.sql");
    expect(versionsLeft!.n, "schema_versions is not user data").toBe(versionsBefore!.n);
    expect(skillsLeft!.n, "catalogue rows are preserved").toBeGreaterThan(0);
    expect(triggersLeft.map((t) => t.name), "append-only triggers survive").toEqual([
      "audit_events_no_delete",
      "audit_events_no_update",
    ]);

    // Once the ledger holds a row, the helper must refuse before mutating any
    // user table, because wiping user data would strand that audit row with the
    // rows that explained it already deleted.
    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p-locked', 'Parent Locked', 'hash', ?1, ?1)",
    )
      .bind(now)
      .run();
    await repo.recordAudit(env.DB, {
      id: crypto.randomUUID(),
      actor: "parent:p-locked",
      action: "session.login",
      subject: "p-locked",
      detail: null,
      now,
    });

    await expect(resetUserData(env.DB)).rejects.toThrow(
      /Cannot reset user data: audit_events contains 1 immutable row\(s\)/,
    );
    const parentsStillPresent = await env.DB.prepare("SELECT COUNT(*) AS n FROM parents").first<{ n: number }>();
    expect(parentsStillPresent!.n, "nothing was deleted before refusing").toBe(1);
  });
});

describe("schema v3 to v4 migration upgrade compatibility", () => {
  function statementsFor(file: string): string[] {
    const rawSql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    return splitSqlStatements(rawSql);
  }

  async function rebuildAtSchemaV3(db: D1Database): Promise<void> {
    // Drop triggers and tables first via recreateSchema, then drop 0004 artifacts to stand at v3
    await recreateSchema(db);
    await db.prepare("DROP TRIGGER IF EXISTS audit_events_no_update").run();
    await db.prepare("DROP TRIGGER IF EXISTS audit_events_no_delete").run();
    await db.prepare("DROP INDEX IF EXISTS idx_attempts_learner_step_attempt").run();
    await db.prepare("DELETE FROM schema_versions WHERE version = 4").run();
  }

  it("upgrades a populated v3 database cleanly to v4 while preserving existing attempts and audit rows", async () => {
    await rebuildAtSchemaV3(env.DB);

    const now = 1_700_000_000_000;
    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p1', 'Parent', 'hash', ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('l1', 'p1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES ('les1', 'math', 'math-frac-identify', 'Bài 1', 'Lesson 1', 'Mục tiêu', 'Objective', 4, 4, 1, ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version) VALUES ('s1', 'les1', 1, 'concept', '{}', '{}', 'Giải thích', 1)",
    ).run();
    await env.DB.prepare(
      "INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen) VALUES ('ses1', 'l1', 'les1', 1, NULL, ?1, 'in_progress', 1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
       VALUES
         ('att1', 'ses1', 'l1', 'les1', 's1', 1, 'math-frac-identify', '{}', 'incorrect', 0, 'assisted', 1, ?1),
         ('att2', 'ses1', 'l1', 'les1', 's1', 1, 'math-frac-identify', '{}', 'correct', 1, 'assisted', 2, ?2)`,
    )
      .bind(now, now + 1000)
      .run();
    await env.DB.prepare(
      "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('aud1', 'learner:l1', 'hint.requested', 's1', '{\"level\":1}', ?1)",
    )
      .bind(now)
      .run();

    const duplicatesBefore = await repo.findDuplicateStepAttemptNumbers(env.DB);
    expect(duplicatesBefore).toEqual([]);

    for (const stmt of statementsFor("0004_evidence_integrity.sql")) {
      await env.DB.prepare(stmt).run();
    }

    const attempts = await env.DB.prepare("SELECT COUNT(*) AS n FROM learning_attempts").first<{ n: number }>();
    const audits = await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_events").first<{ n: number }>();
    const v4Row = await env.DB.prepare("SELECT version FROM schema_versions WHERE version = 4").first<{ version: number }>();
    expect(attempts?.n).toBe(2);
    expect(audits?.n).toBe(1);
    expect(v4Row?.version).toBe(4);
  });

  it("detects duplicate (learner_id, step_id, attempt_no) rows via findDuplicateStepAttemptNumbers and refuses migration 0004 loudly without deleting or rewriting history", async () => {
    await rebuildAtSchemaV3(env.DB);

    const now = 1_700_000_000_000;
    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p1', 'Parent', 'hash', ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('l1', 'p1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES ('les1', 'math', 'math-frac-identify', 'Bài 1', 'Lesson 1', 'Mục tiêu', 'Objective', 4, 4, 1, ?1, ?1)",
    )
      .bind(now)
      .run();
    await env.DB.prepare(
      "INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version) VALUES ('s1', 'les1', 1, 'concept', '{}', '{}', 'Giải thích', 1)",
    ).run();
    await env.DB.prepare(
      "INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen) VALUES ('ses1', 'l1', 'les1', 1, NULL, ?1, 'in_progress', 1)",
    )
      .bind(now)
      .run();

    // Two conflicting attempt_no = 1 rows in unindexed v3
    await env.DB.prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
       VALUES
         ('dup1', 'ses1', 'l1', 'les1', 's1', 1, 'math-frac-identify', '{}', 'correct', 0, 'observed', 1, ?1),
         ('dup2', 'ses1', 'l1', 'les1', 's1', 1, 'math-frac-identify', '{}', 'correct', 0, 'observed', 1, ?2)`,
    )
      .bind(now, now + 10)
      .run();

    const duplicates = await repo.findDuplicateStepAttemptNumbers(env.DB);
    expect(duplicates).toEqual([
      {
        learner_id: "l1",
        step_id: "s1",
        attempt_no: 1,
        duplicate_count: 2,
      },
    ]);

    const v4Statements = statementsFor("0004_evidence_integrity.sql");
    await expect(env.DB.prepare(v4Statements[0]!).run()).rejects.toThrow(/UNIQUE constraint failed/);

    // Both historical rows remain untouched
    const remaining = await env.DB.prepare("SELECT COUNT(*) AS n FROM learning_attempts").first<{ n: number }>();
    expect(remaining?.n).toBe(2);
  });
});
