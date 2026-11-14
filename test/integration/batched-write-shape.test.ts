import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type {
  ExportResponse,
  StartSessionResponse,
  SubmitAttemptResponse,
} from "../../src/shared/api-contract";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

/**
 * The batch boundary, measured rather than argued from the source.
 *
 * `learning_attempts` and `skill_evidence` are evidence; `audit_events` is the
 * append-only proof that the evidence was written. They only mean anything
 * together, and D1 gives no explicit transaction control — the sole way to make
 * a group of writes commit or roll back as one unit is `env.DB.batch([...])`.
 * The four-layer learner model added two more of these: a
 * `skill_evidence_observation` names the attempt it was classified from, and a
 * `skill_estimate` certifies a ledger prefix. Both dangle if written alone.
 *
 * So the invariant is not "no write outside a batch". A lone INSERT is already
 * atomic, and wrapping one statement in a batch of one buys nothing. The
 * invariant is: **every group of related writes touching those five tables
 * commits as one batch, so no reader ever observes half of a group.**
 *
 * This suite proves that by instrumenting the D1 handle the Worker is given.
 * The wrapper overrides only `prepare` and `batch`, because those are the only
 * two D1 members `src/worker` uses. A statement created by `prepare` is wrapped
 * so its `run` / `runSync` classify the SQL it executes *at execution time*.
 * Recording at prepare time would misclassify every batched write, since
 * `repo.attemptInsertGuarded(db, …)` builds its statement before `batch` is
 * called. `batch` raises a depth counter across the delegated call, and
 * `bind()` returns a freshly wrapped statement because the SQLite adapter's own
 * `bind` returns a brand-new object and would otherwise drop the wrapper.
 *
 * The wrapper is passed to the Worker as `env.DB` and nowhere else. The test
 * harness brands its handle in a `WeakSet` checked by exact object identity, so
 * `resetData` must keep receiving `proxy.env.DB`.
 *
 * Known single-statement paths, enumerated rather than asserted away:
 *
 *   - `POST /api/data/export` writes one `data.exported` audit row. It is a read
 *     flow with one proof row; there is no second write to pair it with.
 *   - `DELETE /api/data/learner` writes `learner.deleted` *before* the cascade,
 *     so the proof survives the deletion it records.
 *   - `POST /api/data/import` writes `data.imported` after its collections have
 *     landed, and replays restored `hint.requested` rows one at a time. The
 *     imported attempts, evidence, and review schedule are batched.
 *   - `POST /api/learner/hints` writes one guarded `hint.requested` row and
 *     withholds the hint if that write fails, so the failure mode is safe.
 *   - Every `recordAudit(...)` caller outside the flows above writes one row.
 *
 * None of these is a hidden half-group. Each is a single write that is either
 * the whole point of the request or the independent proof of a request whose
 * other writes are already grouped.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Bé Mẫu";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

/**
 * Every table whose rows only mean something as part of a group.
 *
 * The two `skill_evidence_observation` / `skill_estimate` rows were added by the
 * four-layer learner model: an observation names the attempt it was classified
 * from, and an estimate certifies a ledger prefix. Either one committed alone
 * would point at evidence this commit did not write. They are written by
 * helpers that hand back a statement "for composing into `db.batch`", which is
 * exactly the shape this guard exists to check — a table written that way and
 * never watched is coverage in name only.
 */
type WatchTable =
  | "learning_attempts"
  | "skill_evidence"
  | "skill_evidence_observation"
  | "skill_estimate"
  | "audit_events";

type WriteEvent = { table: WatchTable; depth: number; sql: string };

const WATCHED_INSERT =
  /^\s*insert\s+(?:or\s+\w+\s+)?into\s+"?(skill_evidence_observation|learning_attempts|skill_evidence|skill_estimate|audit_events)"?\b/i;

const AUDIT_DELETE = /^\s*delete\s+from\s+"?audit_events"?\b/i;

type StatementWithSync = D1PreparedStatement & { runSync?: () => unknown };

type TrackingState = {
  depth: number;
  writes: WriteEvent[];
  batchCalls: number;
  /** Cumulative across the whole file: the append-only ledger is never deleted. */
  auditDeletes: string[];
};

function recordExecution(sql: string, state: TrackingState): void {
  const insert = WATCHED_INSERT.exec(sql);
  if (insert) {
    state.writes.push({ table: insert[1]!.toLowerCase() as WatchTable, depth: state.depth, sql });
    return;
  }
  if (AUDIT_DELETE.test(sql)) state.auditDeletes.push(sql);
}

/**
 * Wraps a prepared statement so the SQL is classified when it *runs*.
 *
 * `bind` re-wraps because the adapter's `bind` returns a brand-new statement
 * object, so returning the inner one would silently drop the instrumentation
 * for every parameterised write — which is all of them.
 */
function instrumentStatement(
  inner: StatementWithSync,
  sql: string,
  state: TrackingState,
): D1PreparedStatement {
  const wrapped = {
    bind: (...values: unknown[]) =>
      instrumentStatement(inner.bind(...values) as StatementWithSync, sql, state),
    first: (colName?: string) => inner.first(colName),
    all: () => inner.all(),
    run: async () => {
      recordExecution(sql, state);
      return inner.run();
    },
    raw: (options?: { columnNames?: boolean }) => inner.raw(options),
    ...(typeof inner.runSync === "function"
      ? {
          runSync: () => {
            recordExecution(sql, state);
            return inner.runSync!();
          },
        }
      : {}),
  };
  return wrapped as unknown as D1PreparedStatement;
}

/**
 * Wraps the branded handle. Only `prepare` and `batch` change; everything else
 * delegates untouched so the Worker behaves exactly as it does in production.
 */
function instrumentDatabase(db: D1Database, state: TrackingState): D1Database {
  const wrapper = {
    prepare: (sql: string) =>
      instrumentStatement(db.prepare(sql) as StatementWithSync, sql, state),
    batch: async (statements: D1PreparedStatement[]) => {
      state.batchCalls += 1;
      state.depth += 1;
      try {
        return await db.batch(statements);
      } finally {
        state.depth -= 1;
      }
    },
    exec: (sql: string) => db.exec(sql),
    dump: () => db.dump(),
    withSession: (constraintOrBookmark?: unknown) =>
      db.withSession(constraintOrBookmark as never),
  };
  return wrapper as unknown as D1Database;
}

let worker: { fetch: typeof fetch };
let proxy: TestProxy;
let state: TrackingState;
let env: { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function call(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(jar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method) && jar.csrf) headers.set("x-tlo-csrf", jar.csrf);
  if (init.json !== undefined) headers.set("content-type", "application/json");

  const request = new Request(`${ORIGIN}${path}`, {
    ...init,
    body: init.json === undefined ? undefined : JSON.stringify(init.json),
    headers,
  });
  return worker.fetch(request, env);
}

function absorbSession(response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value.length === 0) delete jar.cookies[name];
    else jar.cookies[name] = value;
  }
}

async function login(): Promise<void> {
  const response = await call("/api/session/login", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(response.status).toBe(200);
  absorbSession(response);
  jar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
}

async function answerKeyFor(stepId: string): Promise<string> {
  const row = await proxy.env.DB.prepare("SELECT answer_key FROM lesson_steps WHERE id = ?1")
    .bind(stepId)
    .first<{ answer_key: string }>();
  return (JSON.parse(row!.answer_key) as { correctChoiceId: string }).correctChoiceId;
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

async function startLesson(lessonId: string): Promise<StartSessionResponse> {
  const res = await call("/api/learner/sessions", { method: "POST", json: { lessonId } });
  expect(res.status).toBe(200);
  return (await res.json()) as StartSessionResponse;
}

async function answerFirstStepCorrectly(session: StartSessionResponse): Promise<void> {
  const stepId = session.steps[0]!.id;
  const correctChoice = await answerKeyFor(stepId);
  const res = await call("/api/learner/attempts", {
    method: "POST",
    json: {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: correctChoice },
      helpLevel: 0,
    },
  });
  expect(res.status).toBe(200);
  expect(((await res.json()) as SubmitAttemptResponse).outcome).toBe("correct");
}

function batched(table: WatchTable): WriteEvent[] {
  return state.writes.filter((write) => write.table === table && write.depth > 0);
}

function unbatched(table: WatchTable): WriteEvent[] {
  return state.writes.filter((write) => write.table === table && write.depth === 0);
}

function resetTracker(): void {
  state.depth = 0;
  state.writes = [];
  state.batchCalls = 0;
}

let learnerId: string;

beforeAll(async () => {
  proxy = await openTestDatabase();
  state = { depth: 0, writes: [], batchCalls: 0, auditDeletes: [] };
  env = {
    DB: instrumentDatabase(proxy.env.DB, state),
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

afterEach(() => {
  // Cumulative across every flow in this file. The trigger set is the
  // structural backstop; this is the behavioural one — no code path even
  // attempts the delete.
  expect(state.auditDeletes, "no path deletes from the append-only ledger").toEqual([]);
});

beforeEach(async () => {
  // Deliberately the branded handle, not `env.DB`: `recreateSchema` refuses any
  // handle it does not recognise by exact object identity, and the wrapper is a
  // different object.
  await resetData(proxy.env.DB);
  resetTracker();
  jar.cookies = {};
  jar.csrf = null;

  const boot = await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(boot.status).toBe(200);
  await login();

  const enrolRes = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolRes.status).toBe(200);
  learnerId = ((await enrolRes.json()) as { learner: { id: string } }).learner.id;
});

describe("every grouped write touching the watched evidence tables commits as one batch", () => {
  it("starts a session with its audit row in the same batch", async () => {
    const lessonId = await approveFirstLesson();
    resetTracker();

    await startLesson(lessonId);

    expect(state.batchCalls, "session start must use a batch, not two separate runs").toBe(1);
    expect(unbatched("audit_events")).toHaveLength(0);
    expect(batched("audit_events")).toHaveLength(1);
    expect(batched("learning_attempts")).toHaveLength(0);
    expect(batched("skill_evidence")).toHaveLength(0);
  });

  it("submits an attempt with its evidence and audit row in the same batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    resetTracker();

    await answerFirstStepCorrectly(session);

    expect(state.batchCalls, "exactly one attempt batch, no retry").toBe(1);
    expect(unbatched("learning_attempts")).toHaveLength(0);
    expect(unbatched("skill_evidence")).toHaveLength(0);
    expect(unbatched("audit_events")).toHaveLength(0);
    expect(batched("learning_attempts")).toHaveLength(1);
    expect(batched("audit_events")).toHaveLength(1);
    expect(batched("skill_evidence")).toHaveLength(1);
    // Layers 2 and 3 ride the same batch as the attempt they describe. If either
    // ever moves out, the attempt could land without the observation naming it.
    expect(unbatched("skill_evidence_observation")).toHaveLength(0);
    expect(unbatched("skill_estimate")).toHaveLength(0);
    expect(batched("skill_evidence_observation")).toHaveLength(1);
    expect(batched("skill_estimate").length).toBeGreaterThanOrEqual(1);
  });

  it("records a parent correction with its audit row in the same batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    // `skill_id` hangs off the lesson, not the step.
    const row = await proxy.env.DB.prepare(
      `SELECT l.skill_id AS skill_id
         FROM lessons l
         JOIN lesson_steps s ON s.lesson_id = l.id
        WHERE s.id = ?1`,
    )
      .bind(session.steps[0]!.id)
      .first<{ skill_id: string | null }>();
    expect(row?.skill_id, "the first seeded step must carry a skill for this test").toBeTruthy();
    resetTracker();

    const res = await call("/api/parent/skills/correct", {
      method: "POST",
      json: {
        learnerId,
        skillId: row!.skill_id,
        state: "INDEPENDENT",
        note: "Bài kiểm tra trên giấy cho thấy con đã tự làm đúng.",
      },
    });
    expect(res.status).toBe(200);

    expect(state.batchCalls).toBe(1);
    expect(unbatched("skill_evidence")).toHaveLength(0);
    expect(unbatched("audit_events")).toHaveLength(0);
    expect(batched("skill_evidence")).toHaveLength(1);
    expect(batched("audit_events")).toHaveLength(1);
  });

  it("finalizes a session with its audit row in the same batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    await answerFirstStepCorrectly(session);
    resetTracker();

    const res = await call("/api/learner/sessions/finalize", {
      method: "POST",
      json: { sessionId: session.sessionId },
    });
    expect(res.status).toBe(200);

    expect(state.batchCalls).toBe(1);
    expect(unbatched("audit_events")).toHaveLength(0);
    expect(batched("audit_events")).toHaveLength(1);
  });

  it("saves a session reflection with its audit row in the same batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    resetTracker();

    const res = await call("/api/learner/sessions/reflect", {
      method: "POST",
      json: { sessionId: session.sessionId, feeling: "good", noteVi: "Con thấy dễ hiểu." },
    });
    expect(res.status).toBe(200);

    expect(state.batchCalls).toBe(1);
    expect(unbatched("audit_events")).toHaveLength(0);
    expect(batched("audit_events")).toHaveLength(1);
  });
});

describe("single-statement paths are single on purpose", () => {
  it("writes exactly one unbatched audit row for an export, because there is nothing to pair it with", async () => {
    await approveFirstLesson();
    resetTracker();

    const res = await call("/api/data/export", { method: "POST" });
    expect(res.status).toBe(200);
    expect((await res.json()) as ExportResponse).toMatchObject({
      formatVersion: expect.any(Number),
    });

    expect(state.batchCalls, "a read flow with one proof row needs no batch").toBe(0);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]!.table).toBe("audit_events");
    expect(state.writes[0]!.depth).toBe(0);
  });

  it("writes the deletion proof before the cascade, and the cascade as one batch", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    await answerFirstStepCorrectly(session);
    resetTracker();

    const res = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(res.status).toBe(200);

    // The proof of deletion must exist even after the rows it describes are gone,
    // so it is written first and outside the cascade.
    expect(unbatched("audit_events")).toHaveLength(1);
    expect(state.writes.filter((write) => write.depth === 0).map((write) => write.table)).toEqual([
      "audit_events",
    ]);

    // The cascade is a single batch: a partial deletion cannot be observed.
    expect(state.batchCalls).toBe(1);

    const remaining = await proxy.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(remaining!.n, "the cascade really removed the attempts").toBe(0);
  });
});

describe("import restores grouped evidence as a batch and names its unbatched rows", () => {
  it("batches restored attempts and evidence, and writes the proof rows singly", async () => {
    const lessonId = await approveFirstLesson();
    const session = await startLesson(lessonId);
    await answerFirstStepCorrectly(session);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const envelope = (await exportRes.json()) as ExportResponse;

    const deleted = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleted.status).toBe(200);

    resetTracker();
    const imported = await call("/api/data/import", { method: "POST", json: envelope });
    expect(imported.status, "the export must round-trip before the shape means anything").toBe(200);

    expect(batched("learning_attempts").length).toBeGreaterThanOrEqual(1);
    expect(batched("skill_evidence").length).toBeGreaterThanOrEqual(1);
    expect(unbatched("learning_attempts")).toHaveLength(0);
    expect(unbatched("skill_evidence")).toHaveLength(0);

    // The restored observation names an attempt this very import writes, so it
    // must land in that batch rather than after it.
    expect(batched("skill_evidence_observation").length).toBeGreaterThanOrEqual(1);
    expect(unbatched("skill_evidence_observation")).toHaveLength(0);
    expect(unbatched("skill_estimate")).toHaveLength(0);

    // At least `data.imported`, and one restored `hint.requested` per hint the
    // file recorded. Enumerated, not asserted away: they are proof rows written
    // after the group they describe has already landed.
    expect(unbatched("audit_events").length).toBeGreaterThanOrEqual(1);

    const restoredLearner = await proxy.env.DB.prepare(
      "SELECT id FROM learners WHERE nickname = ?1",
    )
      .bind(LEARNER_NICKNAME)
      .first<{ id: string }>();
    expect(restoredLearner, "the learner was restored").not.toBeNull();
    const restoredAttempts = await proxy.env.DB.prepare(
      "SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1",
    )
      .bind(restoredLearner!.id)
      .first<{ n: number }>();
    expect(restoredAttempts!.n, "the imported attempt really landed").toBeGreaterThanOrEqual(1);
  });
});
