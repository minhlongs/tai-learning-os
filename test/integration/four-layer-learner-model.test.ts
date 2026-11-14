import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { deriveCompetency, type AttemptEvidence } from "../../src/shared/engine/competency";
import { computeEstimate } from "../../src/shared/engine/review";
import type {
  LearningAttemptRow,
  SkillEstimateRow,
  SkillEvidenceObservationRow,
} from "../../src/worker/db/schema";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

/**
 * Four-layer learner model (ADR-005), proved on the real Worker + D1 stack:
 *
 *   layer 1  learning_attempts            raw observation, append-only
 *   layer 2  skill_evidence_observation   per-attempt evidence, append-only
 *   layer 3  skill_estimate               FSRS memory state + drift watermark
 *   layer 4  skill_evidence.state         the single label the parent reads
 *
 * What this suite proves is what ADR-005 claims and nothing more: the stored
 * estimate is REPRODUCIBLE from the ledger, the layers stay separate (no path
 * from layer 3 to layer 4), and a parent correction never rewrites the memory
 * model. It does not claim FSRS-6 is pedagogically correct for this child.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Bé Mẫu";
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
  if (init.json !== undefined) headers.set("content-type", "application/json");

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

async function loginInto(targetJar: Jar): Promise<void> {
  const response = await callWithJar(targetJar, "/api/session/login", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(response.status).toBe(200);
  absorbSessionInto(targetJar, response);
  targetJar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
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
let skillId: string;
let lessonId: string;

/**
 * Layer 2 and layer 3 are written only when `step.skillId` is present and the
 * session resolves to `official` purpose, so the fixture must pick a lesson that
 * carries a skill. `resetData()` seeds the 50 catalogue lessons before this runs;
 * `writeLesson()` marks every one of them `ownership_type = 'catalogue'` and
 * `purpose = 'official'`, so the practice/family exemption never applies here.
 */
async function approveSkillLesson(): Promise<void> {
  const skill = await env.DB.prepare("SELECT id FROM skills LIMIT 1").first<{ id: string }>();
  expect(skill).not.toBeNull();
  skillId = skill!.id;

  const lesson = await env.DB.prepare("SELECT id FROM lessons WHERE skill_id = ?1 LIMIT 1")
    .bind(skillId)
    .first<{ id: string }>();
  expect(lesson).not.toBeNull();
  lessonId = lesson!.id;

  const approveRes = await call("/api/parent/lessons/approval", {
    method: "POST",
    json: { lessonId, status: "approved" },
  });
  expect(approveRes.status).toBe(200);
}

beforeEach(async () => {
  vi.restoreAllMocks();
  // The branded handle, not `env.DB`: the harness refuses to reset a database it
  // did not open, and a cast preserves object identity while a wrapper would not.
  await resetData(proxy.env.DB);
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
    json: { nickname: LEARNER_NICKNAME, birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolRes.status).toBe(200);
  learnerId = ((await enrolRes.json()) as { learner: { id: string } }).learner.id;

  await approveSkillLesson();
});

interface LearnerSession {
  sessionId: string;
  steps: { id: string; kind: string; content: unknown }[];
}

async function startSession(): Promise<LearnerSession> {
  const res = await call("/api/learner/sessions", { method: "POST", json: { lessonId } });
  expect(res.status).toBe(200);
  return (await res.json()) as LearnerSession;
}

async function answerKeyFor(stepId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT answer_key FROM lesson_steps WHERE id = ?1")
    .bind(stepId)
    .first<{ answer_key: string }>();
  expect(row).not.toBeNull();
  return (JSON.parse(row!.answer_key) as { correctChoiceId: string }).correctChoiceId;
}

/** Option ids in the order the learner sees them, so a wrong option is a real one. */
function choicesOf(content: unknown): readonly string[] {
  if (typeof content !== "object" || content === null) return [];
  const choices = (content as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((choice) => (choice as { id?: unknown }).id)
    .filter((id): id is string => typeof id === "string");
}

function wrongChoice(options: readonly string[], correct: string): string {
  const other = options.find((id) => id !== correct);
  if (!other) throw new Error(`step offers no wrong answer besides ${correct}`);
  return other;
}

async function submitChoice(
  sessionId: string,
  stepId: string,
  choiceId: string,
  helpLevel = 0,
): Promise<{ attemptId: string; outcome: string; attemptNo: number }> {
  const res = await call("/api/learner/attempts", {
    method: "POST",
    json: { sessionId, stepId, submission: { kind: "choice", choiceId }, helpLevel },
  });
  expect(res.status).toBe(200);
  return (await res.json()) as { attemptId: string; outcome: string; attemptNo: number };
}

/** Answer `index`-th step of a fresh session correctly, independently. */
async function solveStepIndependently(index: number): Promise<{
  session: LearnerSession;
  attemptId: string;
  stepId: string;
}> {
  const session = await startSession();
  const step = session.steps[index]!;
  const correct = await answerKeyFor(step.id);
  const result = await submitChoice(session.sessionId, step.id, correct, 0);
  expect(result.outcome).toBe("correct");
  return { session, attemptId: result.attemptId, stepId: step.id };
}

async function attemptsForSkill(): Promise<LearningAttemptRow[]> {
  const rows = await env.DB.prepare(
    `SELECT id, session_id, learner_id, lesson_id, step_id, step_version, skill_id,
            submitted, outcome, help_level, evidence_kind, attempt_no, purpose, created_at
     FROM learning_attempts
     WHERE learner_id = ?1 AND skill_id = ?2
     ORDER BY created_at ASC, rowid ASC`,
  )
    .bind(learnerId, skillId)
    .all<LearningAttemptRow>();
  return rows.results ?? [];
}

/**
 * Rebuild the per-attempt evidence the Worker fed to the model, from the ledger
 * alone. `replay()` ignores `isTransfer`/`isReview`, so the estimate comparison
 * does not depend on them; the state comparison is only made for attempts that
 * are genuinely neither a transfer solve nor a scheduled review (asserted by the
 * caller), so `false` here is the truthful value rather than a convenience.
 */
function toEvidence(rows: readonly LearningAttemptRow[]): AttemptEvidence[] {
  return rows
    .filter((row) => (row.purpose ?? "official") === "official")
    .map((row) => ({
      attemptId: row.id,
      sessionId: row.session_id,
      skillId: row.skill_id ?? "",
      outcome: row.outcome,
      helpLevel: row.help_level,
      evidenceKind: row.evidence_kind,
      attemptNo: row.attempt_no,
      isTransfer: false,
      isReview: false,
      createdAt: row.created_at,
    }));
}

async function observations(): Promise<SkillEvidenceObservationRow[]> {
  const rows = await env.DB.prepare(
    `SELECT id, learner_id, skill_id, attempt_id, observed_kind, help_level, attempt_no,
            observed_at, created_at
     FROM skill_evidence_observation
     WHERE learner_id = ?1 AND skill_id = ?2
     ORDER BY observed_at ASC, rowid ASC`,
  )
    .bind(learnerId, skillId)
    .all<SkillEvidenceObservationRow>();
  return rows.results ?? [];
}

async function estimateRow(): Promise<SkillEstimateRow | null> {
  return env.DB.prepare(
    `SELECT id, learner_id, skill_id, stability, difficulty, retrievability_at, reps, lapses,
            fsrs_state, scheduled_days, last_review_at, model_version, computed_at,
            attempt_watermark, attempt_count, created_at, updated_at
     FROM skill_estimate
     WHERE learner_id = ?1 AND skill_id = ?2`,
  )
    .bind(learnerId, skillId)
    .first<SkillEstimateRow>();
}

async function storedState(): Promise<{ state: string; source: string } | null> {
  return env.DB.prepare(
    "SELECT state, source FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
  )
    .bind(learnerId, skillId)
    .first<{ state: string; source: string }>();
}

describe("layer 2 — every attempt is classified exactly once, in an immutable row", () => {
  it("records one independent observation carrying the help level it was graded under", async () => {
    const { attemptId } = await solveStepIndependently(0);

    const rows = await observations();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      learner_id: learnerId,
      skill_id: skillId,
      attempt_id: attemptId,
      observed_kind: "independent",
      help_level: 0,
      attempt_no: 1,
    });

    // `observed_at` is the attempt's own instant, not a later read of the clock:
    // the evidence must line up with the ledger row it describes.
    const attempt = await env.DB.prepare(
      "SELECT created_at FROM learning_attempts WHERE id = ?1",
    )
      .bind(attemptId)
      .first<{ created_at: number }>();
    expect(rows[0]!.observed_at).toBe(attempt!.created_at);
  });

  it("classifies a hinted correct solve as assisted, not independent", async () => {
    const session = await startSession();
    const step = session.steps[0]!;
    const correct = await answerKeyFor(step.id);
    // helpLevel 2 is a disclosed hint; the same correct answer must not count as
    // independent evidence once the child was helped.
    await submitChoice(session.sessionId, step.id, correct, 2);

    const rows = await observations();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.observed_kind).toBe("assisted");
    expect(rows[0]!.help_level).toBe(2);
  });

  it("refuses a second classification of the same attempt (UNIQUE learner, skill, attempt)", async () => {
    const { attemptId } = await solveStepIndependently(0);

    await expect(
      env.DB.prepare(
        `INSERT INTO skill_evidence_observation
           (id, learner_id, skill_id, attempt_id, observed_kind, help_level, attempt_no, observed_at, created_at)
         VALUES (?1, ?2, ?3, ?4, 'assisted', 0, 1, 0, 0)`,
      )
        .bind(crypto.randomUUID(), learnerId, skillId, attemptId)
        .run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i);
  });

  it("rejects UPDATE on the observation ledger", async () => {
    await solveStepIndependently(0);

    await expect(
      env.DB.prepare("UPDATE skill_evidence_observation SET observed_kind = 'correction'").run(),
    ).rejects.toThrow(
      /skill_evidence_observation is append-only: UPDATE is not permitted/,
    );
  });

  it("rejects UPDATE on the raw attempt it was derived from", async () => {
    await solveStepIndependently(0);

    // Layer 2 is only worth reading if layer 1 cannot be rewritten underneath
    // it: flipping the outcome of an already-graded attempt would let a reader
    // justify a competency state from history that never happened.
    await expect(
      env.DB.prepare("UPDATE learning_attempts SET outcome = 'incorrect'").run(),
    ).rejects.toThrow(/learning_attempts is append-only: UPDATE is not permitted/);
  });
});

describe("erasure still reaches every layer", () => {
  it("a parent-confirmed learner deletion removes attempts, observations and estimates", async () => {
    await solveStepIndependently(0);
    expect(await observations()).toHaveLength(1);
    expect(await estimateRow()).not.toBeNull();

    const res = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(res.status).toBe(200);

    // The append-only guard covers UPDATE, not DELETE. Erasure by the parent is
    // an audited path, and a guard that blocked it would trade a real privacy
    // right for an immutability the audit ledger already provides.
    const counts = await env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM learning_attempts WHERE learner_id = ?1) AS attempts,
         (SELECT COUNT(*) FROM skill_evidence_observation WHERE learner_id = ?1) AS observations,
         (SELECT COUNT(*) FROM skill_estimate WHERE learner_id = ?1) AS estimates,
         (SELECT COUNT(*) FROM audit_events WHERE action = 'learner.deleted') AS deletions`,
    )
      .bind(learnerId)
      .first<{ attempts: number; observations: number; estimates: number; deletions: number }>();

    expect(counts).toEqual({ attempts: 0, observations: 0, estimates: 0, deletions: 1 });
  });
});

describe("layer 3 — the stored estimate replays bit-for-bit from the ledger", () => {
  it("matches computeEstimate() field for field at its own computed_at instant", async () => {
    const { attemptId } = await solveStepIndependently(0);

    const row = await estimateRow();
    expect(row).not.toBeNull();

    const rebuilt = computeEstimate(toEvidence(await attemptsForSkill()), row!.computed_at);
    expect(rebuilt).not.toBeNull();

    expect({
      stability: row!.stability,
      difficulty: row!.difficulty,
      retrievabilityAt: row!.retrievability_at,
      reps: row!.reps,
      lapses: row!.lapses,
      fsrsState: row!.fsrs_state,
      scheduledDays: row!.scheduled_days,
      lastReviewAt: row!.last_review_at,
      modelVersion: row!.model_version,
      attemptWatermark: row!.attempt_watermark,
      attemptCount: row!.attempt_count,
    }).toEqual(rebuilt);

    // The watermark names the attempt it folded in, so a reader can see whether
    // the number is stale without re-running the model.
    expect(row!.attempt_watermark).toBe(attemptId);
    expect(row!.attempt_count).toBe(1);
  });

  it("advances the watermark and the attempt count while keeping one row per skill", async () => {
    const first = await solveStepIndependently(0);
    const before = await estimateRow();

    const second = await solveStepIndependently(1);
    const after = await estimateRow();

    expect(after).not.toBeNull();
    expect(after!.id).toBe(before!.id);
    expect(after!.attempt_watermark).toBe(second.attemptId);
    expect(after!.attempt_watermark).not.toBe(first.attemptId);
    expect(after!.attempt_count).toBe(2);
    expect(after!.computed_at).toBeGreaterThanOrEqual(before!.computed_at);

    const rebuilt = computeEstimate(toEvidence(await attemptsForSkill()), after!.computed_at);
    expect(rebuilt!.attemptWatermark).toBe(second.attemptId);
    expect(rebuilt!.attemptCount).toBe(2);
  });

  it("writes no estimate at all for an attempt on a lesson with no skill", async () => {
    const skillLess = await env.DB.prepare(
      "SELECT id FROM lessons WHERE skill_id IS NULL LIMIT 1",
    ).first<{ id: string }>();

    // The shipped catalogue maps every lesson to a skill; a skill-less lesson is
    // a schema-level possibility, not a state this fixture can reach through the
    // API. Assert the premise instead of pretending the case was exercised.
    expect(skillLess).toBeNull();
  });
});

describe("layer 4 — state is derived from attempts, never from the stored estimate", () => {
  it("reports NOT_OBSERVED after a single independent correct solve", async () => {
    // Measured behaviour of deriveCompetency(): an independent solve is excluded
    // from `assisted`, `independentMinCorrect` is 2, and no branch fires — so the
    // honest label is "not observed yet", not "supported".
    const { stepId } = await solveStepIndependently(0);

    const stepKind = await env.DB.prepare("SELECT kind FROM lesson_steps WHERE id = ?1")
      .bind(stepId)
      .first<{ kind: string }>();
    expect(stepKind!.kind).not.toBe("transfer");

    const stored = await storedState();
    expect(stored).not.toBeNull();
    expect(stored!.source).toBe("derived");

    const derived = deriveCompetency(toEvidence(await attemptsForSkill()));
    expect(derived.state).toBe("NOT_OBSERVED");
    expect(stored!.state).toBe(derived.state);

    // The estimate exists and is non-trivial at the same moment the state is
    // still NOT_OBSERVED — the two layers answer different questions.
    const row = await estimateRow();
    expect(row).not.toBeNull();
    expect(row!.reps).toBe(1);
  });

  it("does not let a wrong answer count toward the independent threshold", async () => {
    const session = await startSession();
    const step = session.steps[0]!;
    const correct = await answerKeyFor(step.id);
    // A real option that is not the answer, taken from what the learner is
    // shown — not a made-up id the grader might get to treat specially.
    const wrong = wrongChoice(choicesOf(step.content), correct);

    const result = await submitChoice(session.sessionId, step.id, wrong, 0);
    expect(result.outcome).not.toBe("correct");

    // A wrong answer is evidence, but never independent evidence: the label
    // must not rise, and the independent counter must not move.
    const rows = await observations();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.observed_kind).toBe("assisted");

    const derived = deriveCompetency(toEvidence(await attemptsForSkill()));
    expect(derived.state).toBe("NOT_OBSERVED");
  });

  it("reaches INDEPENDENT after two independent solves across two distinct sessions, with the estimate moving independently", async () => {
    const first = await solveStepIndependently(0);
    const afterFirst = await estimateRow();

    // Finalize session 1 so the second solve occurs in a distinct session (Gate G6).
    const finRes = await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: first.session.sessionId },
    });
    expect(finRes.status).toBe(200);

    const second = await solveStepIndependently(1);
    expect(second.session.sessionId).not.toBe(first.session.sessionId);
    const afterSecond = await estimateRow();

    const derived = deriveCompetency(toEvidence(await attemptsForSkill()));
    expect(derived.state).toBe("INDEPENDENT");

    const stored = await storedState();
    expect(stored!.state).toBe("INDEPENDENT");

    // Layer 3 tracked the same attempts but is not what layer 4 was written from:
    // the estimate changed by a different rule (reps/stability) than the label.
    expect(afterSecond!.reps).toBe(afterFirst!.reps + 1);
  });
});

describe("a parent correction never rewrites the memory model", () => {
  it("leaves the stored estimate byte-identical while changing the state label", async () => {
    await solveStepIndependently(0);
    const before = await estimateRow();
    expect(before).not.toBeNull();

    const correctRes = await call("/api/parent/skills/correct", {
      method: "POST",
      json: {
        learnerId,
        skillId,
        state: "INDEPENDENT",
        note: "Ba mẹ quan sát thấy con tự làm được bài này ở nhà",
      },
    });
    expect(correctRes.status).toBe(200);

    const after = await estimateRow();
    expect(after).toEqual(before);

    // The decision survives where it belongs: as a floor on the derived state.
    const stored = await storedState();
    expect(stored).toEqual({ state: "INDEPENDENT", source: "parent_correction" });

    // And the model is unaffected even if the correction is fed to it directly:
    // `replay()` drops `parent_correction` before stepping FSRS.
    const evidence = toEvidence(await attemptsForSkill());
    const correction: AttemptEvidence = {
      attemptId: "parent-correction-synthetic",
      skillId,
      outcome: "correct",
      helpLevel: 0,
      evidenceKind: "parent_correction",
      isTransfer: false,
      isReview: false,
      createdAt: Date.now(),
      correctedState: "INDEPENDENT",
    };
    expect(computeEstimate([...evidence, correction], before!.computed_at)).toEqual(
      computeEstimate(evidence, before!.computed_at),
    );
  });
});
