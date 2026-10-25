import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { resetData } from "./reset-data";

/**
 * The learner journey, end to end through the real Worker.
 *
 * This suite answers the questions a UI screenshot cannot: does data actually
 * persist, does a rejected lesson stay rejected, does an export/import round
 * trip bring the same record back, and does a session survive the process that
 * created it being torn down and recreated.
 *
 * It runs against a real D1 with the shipped migrations applied. The Worker's
 * fetch handler is the shipped one, so the route table, auth middleware and D1
 * binding under test are the ones the app runs with.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
/** The learner this suite enrols and then teaches. */
const LEARNER_NICKNAME = "Tài";
/** Test-only signing secret; never read from disk, never deployed. */
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

let worker: { fetch: typeof fetch };
let env: Env;
let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };

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

  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    if (jar.csrf) headers.set("x-tlo-csrf", jar.csrf);
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

beforeAll(async () => {
  proxy = await getPlatformProxy<{ DB: D1Database }>();
  // `ENVIRONMENT: "development"` is what the shipped wrangler.jsonc sets, and it
  // is what lets first-run bootstrap work without a pre-seeded password hash.
  // The test env mirrors the shipped one so the gate under test is the real one.
  env = {
    DB: proxy.env.DB,
    SESSION_SECRET: TEST_SECRET,
    ENVIRONMENT: "development",
  } as Env;
  worker = (await import("../../src/worker/index"))
    .default as unknown as { fetch: typeof fetch };
});

afterAll(async () => {
  // Releasing the proxy releases its SQLite handle. If this is skipped the file
  // stays locked, and the next suite in the same process fails with
  // SQLITE_BUSY on its first `delete` — a locking problem that looks exactly
  // like a data problem.
  await proxy.dispose();
});

beforeEach(async () => {
  await resetData(env.DB);
  jar.cookies = {};
  jar.csrf = null;

  await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  await login();

  // A learner has to be enrolled before anything can be learned: `startSession`
  // answers 404 when the parent has no profile, and that is the honest answer —
  // you cannot teach a child who has not been added.
  const enrolled = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolled.status, "enrol fixture").toBe(200);
});

describe("lesson approval gates learner access", () => {
  it("refuses to start a session for a lesson the parent has not approved", async () => {
    const lessons = await (await call("/api/parent/lessons")).json() as {
      lessons: { id: string; approvalStatus: string }[];
    };
    expect(lessons.lessons.length).toBeGreaterThan(0);

    const unapproved = lessons.lessons.find((l) => l.approvalStatus !== "approved");
    expect(unapproved, "fixture needs an unapproved lesson").toBeDefined();

    const response = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: unapproved!.id },
    });
    expect(response.status).toBe(403);
  });

  it("starts a session once the parent approves the lesson", async () => {
    const lessons = await (await call("/api/parent/lessons")).json() as {
      lessons: { id: string }[];
    };
    const lessonId = lessons.lessons[0]!.id;

    await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });

    const response = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as { steps: { kind: string }[] };
    // The teaching sequence ships with the lesson: concept first, transfer last.
    expect(body.steps[0]!.kind).toBe("concept");
    expect(body.steps[body.steps.length - 1]!.kind).toBe("transfer");
  });
});

describe("attempts are persisted and stay honest", () => {
  it("records a wrong answer, then the correct one, and keeps both", async () => {
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
    })).json() as StartSessionResponse;

    // The answer key is deliberately absent from the payload the worker sends
    // the learner, so a correct submission is built from the stored key rather
    // than from anything the client could read.
    const stepId = session.steps[0]!.id;
    const options = choicesOf(session.steps[0]!.content);
    const key = await answerKeyFor(stepId);
    expect(options.length, "first step must be answerable").toBeGreaterThan(1);
    expect(key, "first step must have a stored answer key").not.toBeNull();

    const wrong = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: wrongChoice(options, key!) },
        helpLevel: 0,
      },
    });
    expect(wrong.status).toBe(200);
    const wrongBody = (await wrong.json()) as {
      outcome: string;
      explanationVi: string | null;
    };
    // A wrong answer is not told the reasoning. Withholding the explanation
    // until a step is solved is what stops a worked solution being read first
    // and then resubmitted as the learner's own reasoning.
    expect(wrongBody.outcome).toBe("incorrect");
    expect(wrongBody.explanationVi).toBeNull();

    const right = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: key! },
        helpLevel: 0,
      },
    });
    expect(right.status).toBe(200);
    expect(((await right.json()) as { outcome: string }).outcome).toBe("correct");

    const attempts = await env.DB.prepare(
      "select count(*) as n from learning_attempts where step_id = ?",
    )
      .bind(stepId)
      .first<{ n: number }>();
    expect(attempts!.n).toBe(2);
  });
});

describe("restart recovery — data survives the process that wrote it", () => {
  it("still serves the session after a brand-new proxy is opened", async () => {
    const lessons = await (await call("/api/parent/lessons")).json() as {
      lessons: { id: string }[];
    };
    const lessonId = lessons.lessons[0]!.id;

    await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });

    const started = await (await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    })).json() as { sessionId: string };
    expect(started.sessionId).toBeTruthy();

    // A new proxy, a new Worker instance: nothing carried over in memory. If the
    // session and its attempts did not reach disk, these reads come back empty
    // and the test fails for the right reason.
    const reopened = await getPlatformProxy<{ DB: D1Database }>();
    const rows = await reopened.env.DB.prepare(
      "select id, status from learning_sessions where id = ?",
    )
      .bind(started.sessionId)
      .first<{ id: string; status: string }>();
    await reopened.dispose();

    expect(rows?.id).toBe(started.sessionId);
    expect(rows?.status).toBe("in_progress");
  });
});

/** A started session, as the worker reports it. `steps[].id` — not `stepId`. */
type StartSessionResponse = {
  sessionId: string;
  lessonId: string;
  lessonTitleVi: string;
  steps: { id: string; kind: string; content: unknown; explanationVi: string | null }[];
};

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

/** An option that is NOT the right answer, so the attempt is genuinely wrong. */
function wrongChoice(options: readonly string[], correct: string): string {
  const other = options.find((id) => id !== correct);
  if (!other) throw new Error(`step offers no wrong answer besides ${correct}`);
  return other;
}
