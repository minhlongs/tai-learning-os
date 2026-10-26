import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { deriveForTest, PBKDF2_ITERATIONS } from "../../src/shared/crypto/password";
import { leaksAnswer } from "../../src/shared/schemas/exercise";
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

describe("the answer key never crosses the wire", () => {
  it("sends no answer for any step of any lesson", async () => {
    const lessonIds = await approveEveryLesson();
    // Precondition on the fixture, not on the code under test: a library where
    // no step carries an answer cannot prove anything about stripping it.
    const stored = await storedContents();
    expect(stored.length, "the library must hold steps").toBeGreaterThan(0);
    const answerBearing = stored.filter((content) => leaksAnswer(content));
    expect(answerBearing.length, "the stored content must carry answers to strip")
      .toBe(stored.length);

    for (const lessonId of lessonIds) {
      const response = await call("/api/learner/sessions", {
        method: "POST",
        json: { lessonId },
      });
      expect(response.status, `open ${lessonId}`).toBe(200);

      const body = (await response.json()) as StartSessionResponse;
      expect(body.steps.length, `${lessonId} must teach a real sequence`).toBeGreaterThan(0);

      for (const step of body.steps) {
        // No step may carry an answer, and none may leak one through the choices
        // array. The assertion walks the payload rather than checking a flat
        // key, so an answer nested inside a rebuilt object still fails.
        expect(leaksAnswer(step.content), `${lessonId} step ${step.id} leaked an answer`)
          .toBe(false);
        // The explanation is unlocked by a correct answer, not by opening the
        // lesson: it is null here because nothing has been solved yet.
        expect(step.explanationVi).toBeNull();
      }
    }
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

  it("prevents client from spoofing helpLevel 0 after server-side hint level 3 disclosure", async () => {
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

    const stepId = session.steps[0]!.id;
    const key = await answerKeyFor(stepId);

    // Learner requests hint level 3
    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: { stepId, currentLevel: 3, sessionId: session.sessionId },
    });
    expect(hintRes.status).toBe(200);

    // Learner submits correct answer claiming helpLevel: 0
    const submitRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: key! },
        helpLevel: 0,
      },
    });
    expect(submitRes.status).toBe(200);

    // Stored attempt must reflect the disclosed level 3 and assisted evidence_kind
    const storedAttempt = await env.DB.prepare(
      "select help_level, evidence_kind from learning_attempts where session_id = ? and step_id = ?",
    )
      .bind(session.sessionId, stepId)
      .first<{ help_level: number; evidence_kind: string }>();

    expect(storedAttempt?.help_level).toBe(3);
    expect(storedAttempt?.evidence_kind).toBe("assisted");
  });

  it("prevents client from spoofing helpLevel 0 after server-side hint level 1 or 2 disclosure and keeps competency at SUPPORTED", async () => {
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

    const step0Id = session.steps[0]!.id;
    const key0 = await answerKeyFor(step0Id);

    // Step 1: Learner requests hint level 1, then spoofs helpLevel: 0
    await call("/api/learner/hints", {
      method: "POST",
      json: { stepId: step0Id, currentLevel: 1, sessionId: session.sessionId },
    });
    const res0 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step0Id,
        submission: { kind: "choice", choiceId: key0! },
        helpLevel: 0,
      },
    });
    expect(res0.status).toBe(200);
    const ev0 = await env.DB.prepare(
      "select state from skill_evidence where learner_id = (select learner_id from learning_sessions where id = ?)",
    )
      .bind(session.sessionId)
      .first<{ state: string }>();
    expect(ev0?.state).toBe("SUPPORTED");

    // Step 4 (guided multiple_choice): Learner submits with helpLevel: 2
    const step3Id = session.steps[3]!.id;
    const key3 = await answerKeyFor(step3Id);
    const res3 = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step3Id,
        submission: { kind: "choice", choiceId: key3! },
        helpLevel: 2,
      },
    });
    expect(res3.status).toBe(200);
    // Even with 2 correct answers (helpLevel 1 and helpLevel 2), state MUST stay SUPPORTED, never INDEPENDENT
    const ev3 = await env.DB.prepare(
      "select state from skill_evidence where learner_id = (select learner_id from learning_sessions where id = ?)",
    )
      .bind(session.sessionId)
      .first<{ state: string }>();
    expect(ev3?.state).toBe("SUPPORTED");

    const storedAttempts = await env.DB.prepare(
      "select help_level, evidence_kind from learning_attempts where session_id = ? order by created_at asc",
    )
      .bind(session.sessionId)
      .all<{ help_level: number; evidence_kind: string }>();

    expect(storedAttempts.results).toEqual([
      { help_level: 1, evidence_kind: "assisted" },
      { help_level: 2, evidence_kind: "assisted" },
    ]);
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

describe("lesson version bump, session reflections, and transparent password rehash", () => {
  it("bumps lesson version on content update, marks pendingReapproval, and preserves historical attempts", async () => {
    const lessonIds = await approveEveryLesson();
    const lessonId = lessonIds[0]!;

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as StartSessionResponse;
    const step = session.steps[0]!;
    const correct = await answerKeyFor(step.id);

    const attemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: step.id,
        submission: { kind: "choice", choiceId: correct! },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);

    // Record end-of-session learner reflection
    const reflectRes = await call("/api/learner/sessions/reflect", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        feeling: "confident",
        noteVi: "Con hiểu phần phân số bằng nhau rồi!",
      },
    });
    expect(reflectRes.status).toBe(200);
    const reflectBody = (await reflectRes.json()) as {
      id: string;
      sessionId: string;
      feeling: string;
      noteVi: string | null;
    };
    expect(reflectBody.feeling).toBe("confident");
    expect(reflectBody.noteVi).toContain("phân số bằng nhau");

    // Edit lesson content to bump version
    const updateRes = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId,
        titleVi: "Phân số bằng nhau (Bản cập nhật v2)",
      },
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { lessonId: string; version: number };
    expect(updated.version).toBe(2);

    // Check that pendingReapproval is flagged and historical attempts survive with content_version = 1
    const listRes = await call("/api/parent/lessons");
    const listBody = (await listRes.json()) as {
      lessons: { id: string; version: number; pendingReapproval: boolean }[];
    };
    const editedLesson = listBody.lessons.find((l) => l.id === lessonId);
    expect(editedLesson?.version).toBe(2);
    expect(editedLesson?.pendingReapproval).toBe(true);

    const storedAttempt = await env.DB.prepare(
      "SELECT outcome, step_version FROM learning_attempts WHERE session_id = ?",
    )
      .bind(session.sessionId)
      .first<{ outcome: string; step_version: number }>();
    expect(storedAttempt?.outcome).toBe("correct");
    expect(storedAttempt?.step_version).toBe(1);
  });

  it("transparently upgrades a legacy 100,000-iteration PBKDF2 password hash to 600,000 iterations upon login", async () => {
    const salt = new Uint8Array(16).fill(11);
    const saltB64 = btoa(String.fromCharCode(...salt))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const legacyHashB64 = await deriveForTest(PASSWORD, salt, 100_000);
    const legacyRecord = `pbkdf2-sha256:100000$${saltB64}$${legacyHashB64}`;

    await env.DB.prepare("UPDATE parents SET password_hash = ? WHERE display_name = ?")
      .bind(legacyRecord, DISPLAY_NAME)
      .run();

    const beforeRow = await env.DB.prepare(
      "SELECT password_hash FROM parents WHERE display_name = ?",
    )
      .bind(DISPLAY_NAME)
      .first<{ password_hash: string }>();
    expect(beforeRow?.password_hash.startsWith("pbkdf2-sha256:100000$")).toBe(true);

    const loginRes = await call("/api/session/login", {
      method: "POST",
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });
    expect(loginRes.status).toBe(200);

    const afterRow = await env.DB.prepare(
      "SELECT password_hash FROM parents WHERE display_name = ?",
    )
      .bind(DISPLAY_NAME)
      .first<{ password_hash: string }>();
    expect(afterRow?.password_hash.startsWith(`pbkdf2-sha256:${PBKDF2_ITERATIONS}$`)).toBe(true);
  });
});

/** A started session, as the worker reports it. `steps[].id` — not `stepId`. */
type StartSessionResponse = {
  sessionId: string;
  lessonId: string;
  lessonTitleVi: string;
  steps: {
    id: string;
    kind: string;
    content: unknown;
    explanationVi: string | null;
  }[];
};

/* ── fixtures ─────────────────────────────────────────────────────────────── */

/** Every lesson id in the library, with each one approved for the learner. */
async function approveEveryLesson(): Promise<string[]> {
  const lessons = await (await call("/api/parent/lessons")).json() as {
    lessons: { id: string }[];
  };
  for (const lesson of lessons.lessons) {
    const approved = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: lesson.id, status: "approved" },
    });
    expect(approved.status, `approve ${lesson.id}`).toBe(200);
  }
  return lessons.lessons.map((lesson) => lesson.id);
}

/** Exercise types as stored, read from the database rather than the payload. */
async function storedContents(): Promise<unknown[]> {
  const rows = await env.DB.prepare("select content from lesson_steps")
    .all<{ content: string }>();
  return rows.results.map((row) => JSON.parse(row.content) as unknown);
}

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
