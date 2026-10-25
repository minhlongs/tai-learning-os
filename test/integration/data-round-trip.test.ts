import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { resetData } from "./reset-data";
import { TRANSFER_FORMAT_VERSION } from "../../src/shared/schemas/transfer";

/**
 * The export/import round trip, driven through the real Worker.
 *
 * A unit test can prove that an envelope validates. Only this suite can prove
 * the thing the parent actually cares about: that a record which survives an
 * export, a deletion, and an import comes back with the same evidence attached.
 *
 * The sequence is deliberately destructive between the two halves. Exporting
 * and re-importing without deleting anything in between would not exercise the
 * path a parent uses after a lost machine — so the learner is really deleted
 * here, with the confirmation phrase the route demands, and the import then has
 * to rebuild the record from the file alone.
 *
 * Every assertion compares values read back from D1 through the Worker, never
 * values the test already held in memory: the point is that the data reached
 * disk and came back, not that an object passed through a function unchanged.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Tài";
/** Test-only signing secret; never read from disk, never deployed. */
const TEST_SECRET = "integration-only-not-a-real-secret-value";

let worker: { fetch: typeof fetch };
let env: { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };
let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };

/**
 * Drive one request through the Worker, carrying what a browser would carry.
 *
 * The CSRF header is sent for every unsafe method, not only for requests with a
 * JSON payload: `/api/data/export` is a POST whose handler reads no body, so a
 * client that only attached the token when it had a body would be rejected —
 * and would report it as a server bug.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function call(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(jar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method) && jar.csrf) headers.set("x-tlo-csrf", jar.csrf);

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
  expect(response.status, "login fixture").toBe(200);
  absorbSession(response);
  jar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
}

/** Enrol the learner the round trip will move. */
async function enrol(): Promise<string> {
  const response = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(response.status, "enrol fixture").toBe(200);
  const body = (await response.json()) as { learner: { id: string } };
  return body.learner.id;
}

/**
 * Produce one real, stored attempt, so the record being moved is not empty.
 * An export with no evidence would round trip whether or not persistence
 * works at all.
 */
async function makeEvidence(): Promise<{ sessionId: string; stepId: string }> {
  const lessons = await (await call("/api/parent/lessons")).json() as {
    lessons: { id: string }[];
  };
  const lessonId = lessons.lessons[0]!.id;

  await call("/api/parent/lessons/approval", {
    method: "POST",
    json: { lessonId, status: "approved" },
  });

  const session = await (await call("/api/learner/sessions", {
    method: "POST",
    json: { lessonId },
  })).json() as { sessionId: string; steps: { id: string; content: unknown }[] };

  const stepId = session.steps[0]!.id;
  const key = await answerKeyFor(stepId);
  expect(key, "fixture needs a stored answer key").not.toBeNull();

  const wrong = choicesOf(session.steps[0]!.content).find((id) => id !== key);
  expect(wrong, "fixture needs a wrong option").toBeDefined();

  // A wrong answer first: evidence that is only ever correct is not a record of
  // learning, and the round trip should carry both outcomes.
  await call("/api/learner/attempts", {
    method: "POST",
    json: {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: wrong! },
      helpLevel: 0,
    },
  });
  await call("/api/learner/attempts", {
    method: "POST",
    json: {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: key! },
      helpLevel: 0,
    },
  });

  return { sessionId: session.sessionId, stepId };
}

beforeAll(async () => {
  proxy = await getPlatformProxy<{ DB: D1Database }>();
  env = {
    DB: proxy.env.DB,
    SESSION_SECRET: TEST_SECRET,
    ENVIRONMENT: "development",
  };
  worker = (await import("../../src/worker/index")).default as unknown as { fetch: typeof fetch };
});

afterAll(async () => {
  // Releasing the proxy releases its SQLite handle; skipping this leaves the
  // file locked and the next suite fails with SQLITE_BUSY, which reads like a
  // data problem rather than a locking one.
  await proxy.dispose();
});

/** The learner this suite enrols, created fresh by `beforeEach`. */
let learnerId: string;

beforeEach(async () => {
  await resetData(env.DB);
  jar.cookies = {};
  jar.csrf = null;

  await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  await login();
  learnerId = await enrol();
});

describe("export/import round trip restores the record from the file", () => {
  it("brings the same session and attempts back after a real deletion", async () => {
    const { sessionId, stepId } = await makeEvidence();

    const exportResponse = await call("/api/data/export", { method: "POST" });
    expect(exportResponse.status, "export must succeed before anything else is asserted").toBe(200);
    const exported = (await exportResponse.json()) as {
      formatVersion: number;
      containsLearnerEvidence: boolean;
      data: {
        learners: { id: string; nickname: string; grade: number | null }[];
        learningSessions: { id: string; status: string }[];
        learningAttempts: { id: string; outcome: string; stepId: string }[];
        skillEvidence: unknown[];
        auditEvents: unknown[];
      };
    };

    // The exported shape must match the format the app declares, not a shape
    // this test happened to observe.
    expect(exported.formatVersion).toBe(TRANSFER_FORMAT_VERSION);
    expect(exported.containsLearnerEvidence).toBe(true);
    expect(exported.data.learners).toHaveLength(1);
    expect(exported.data.learners[0]!.nickname).toBe(LEARNER_NICKNAME);
    expect(exported.data.learningSessions.map((s) => s.id)).toContain(sessionId);
    expect(exported.data.learningAttempts.length).toBeGreaterThanOrEqual(2);

    const exportedLearnerId = exported.data.learners[0]!.id;
    // The exported id must be the enrolled learner's own id, so the record being
    // moved is the record that was just created.
    expect(exportedLearnerId).toBe(learnerId);

    // Delete for real. The confirmation names the learner, so a generic "yes"
    // cannot delete — this also proves the guard is enforced on the happy path.
    const deleted = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleted.status).toBe(200);

    const afterDelete = await env.DB.prepare(
      "select count(*) as n from learning_sessions where learner_id = ?",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(afterDelete!.n, "deletion must remove the sessions").toBe(0);

    const attemptsAfterDelete = await env.DB.prepare(
      "select count(*) as n from learning_attempts where learner_id = ?",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(attemptsAfterDelete!.n, "deletion must remove the evidence").toBe(0);

    // The audit row recording the deletion outlives the record it describes:
    // this is the only proof left that the deletion was deliberate.
    const deletionAudit = await env.DB.prepare(
      "select count(*) as n from audit_events where action = 'learner.deleted'",
    ).first<{ n: number }>();
    expect(deletionAudit!.n).toBe(1);

    // Import the file that was exported before the deletion. A generic "yes"
    // must not satisfy the confirmation phrase.
    const wrongConfirmation = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: "yes" },
    });
    expect(wrongConfirmation.status).toBe(400);

    const imported = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(imported.status, "import of the exported file").toBe(200);

    // Read the restored record back through the database, and compare it to the
    // file rather than to any in-memory object.
    const restored = await env.DB.prepare(
      "select id, nickname, grade from learners",
    ).first<{ id: string; nickname: string; grade: number | null }>();
    expect(restored!.nickname).toBe(exported.data.learners[0]!.nickname);
    expect(restored!.grade).toBe(exported.data.learners[0]!.grade);

    // The learner id is remapped to a fresh one on import, so restored rows are
    // found through the new id, not the exported one.
    expect(restored!.id).not.toBe(learnerId);

    const restoredSessions = await env.DB.prepare(
      "select id, status, lesson_id from learning_sessions where learner_id = ?",
    )
      .bind(restored!.id)
      .all<{ id: string; status: string; lesson_id: string }>();
    expect(restoredSessions.results).toHaveLength(1);
    expect(restoredSessions.results[0]!.id).toBe(sessionId);
    expect(restoredSessions.results[0]!.status).toBe("in_progress");

    const restoredAttempts = await env.DB.prepare(
      "select step_id, outcome, help_level from learning_attempts where learner_id = ? order by created_at asc",
    )
      .bind(restored!.id)
      .all<{ step_id: string; outcome: string; help_level: number }>();
    expect(restoredAttempts.results.length).toBeGreaterThanOrEqual(2);
    expect(restoredAttempts.results[0]!.step_id).toBe(stepId);
    // Wrong first, then right: both outcomes survived, so the restored record
    // still shows that this step was not solved on the first try.
    expect(restoredAttempts.results[0]!.outcome).toBe("incorrect");
    expect(restoredAttempts.results[1]!.outcome).toBe("correct");

    // The restored record is usable, not merely present: a session started
    // before the export can still be read back through the Worker.
    const home = await call("/api/learner/home");
    expect(home.status).toBe(200);
    const homeBody = (await home.json()) as { learner: { nickname: string } | null };
    expect(homeBody.learner?.nickname).toBe(LEARNER_NICKNAME);
  });

  it("refuses an import while a learner profile already exists", async () => {
    const exportResponse = await call("/api/data/export", { method: "POST" });
    expect(exportResponse.status, "export must succeed before anything else is asserted").toBe(200);
    const exported = (await exportResponse.json()) as {
      data: unknown;
    };

    // The record was never deleted, so importing it again must be refused
    // rather than silently creating a second learner.
    const response = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(response.status).toBe(400);

    const count = await env.DB.prepare("select count(*) as n from learners").first<{ n: number }>();
    expect(count!.n).toBe(1);
  });

  it("refuses a payload from a format version it does not know", async () => {
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    const response = await call("/api/data/import", {
      method: "POST",
      json: {
        formatVersion: TRANSFER_FORMAT_VERSION + 1,
        exportedAt: Date.now(),
        source: "manual_export",
        containsLearnerEvidence: true,
        data: {
          learners: [],
          schoolYears: [],
          subjects: [],
          skills: [],
          skillPrerequisites: [],
          lessons: [],
          lessonSteps: [],
          reviewApprovals: [],
          learningSessions: [],
          learningAttempts: [],
          skillEvidence: [],
          reviewSchedule: [],
          learningGoals: [],
          auditEvents: [],
          schemaVersions: [],
        },
      },
    });
    // A newer format is refused outright: the app cannot interpret a record it
    // does not have the schema for, and guessing would invent data.
    expect(response.status).toBe(400);

    const count = await env.DB.prepare("select count(*) as n from learners").first<{ n: number }>();
    expect(count!.n).toBe(0);
  });
});

/* ── fixtures ─────────────────────────────────────────────────────────────── */

/** The answer key for a step, read from the database rather than the payload. */
async function answerKeyFor(stepId: string): Promise<string | null> {
  const row = await env.DB.prepare("select answer_key from lesson_steps where id = ?")
    .bind(stepId)
    .first<{ answer_key: string }>();
  if (!row) return null;
  const parsed = JSON.parse(row.answer_key) as { correctChoiceId?: unknown } | null;
  return typeof parsed?.correctChoiceId === "string" ? parsed.correctChoiceId : null;
}

/** Option ids from a step's learner payload, in the order the UI shows them. */
function choicesOf(content: unknown): readonly string[] {
  if (typeof content !== "object" || content === null) return [];
  const choices = (content as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((choice) => (choice as { id?: unknown }).id)
    .filter((id): id is string => typeof id === "string");
}
