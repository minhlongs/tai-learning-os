import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

/**
 * The real Worker, driven through its real fetch handler, against a real D1.
 *
 * The Worker's default export is the shipped one: the same route table, auth
 * middleware and D1 binding the running app uses. Nothing here calls a
 * repository function directly, because the question these tests answer is
 * whether the app works, not whether a helper works in isolation.
 *
 * `openTestDatabase` provisions an isolated local SQLite D1 database and
 * applies the shipped `migrations/` to the D1 database
 * — the same schema `npm run dev` runs against. That is why this
 * suite can assert on the schema that actually ships rather than a copy of it.
 *
 * The signing secret is a test-only value supplied per request. The Worker
 * deliberately fails closed without one (see `src/worker/http/middleware.ts`),
 * and no real credential is read here.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
/** The display name bootstrap creates and login must then match. */
const DISPLAY_NAME = "Phụ huynh";

/** Test-only signing secret. Never read from disk, never deployed. */
const TEST_SECRET = "integration-only-not-a-real-secret-value";

let worker: { fetch: typeof fetch };
let env: { DB: D1Database };
let proxy: TestProxy;

let callSeq = 0;

/** Drive one request through the Worker, carrying what a browser would carry. */
async function call(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  callSeq += 1;
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  if (!headers.has("user-agent")) {
    headers.set("user-agent", `test-client-${callSeq}`);
  }

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
  return worker.fetch(request, { ...env, SESSION_SECRET: TEST_SECRET });
}

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };

/** Capture the session cookie the server issued, and clear the jar on logout. */
function absorbSession(response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    // A cleared cookie arrives with an empty value; it must clear the jar entry.
    if (value.length === 0) delete jar.cookies[name];
    else jar.cookies[name] = value;
  }
}

async function login(password: string): Promise<Response> {
  const response = await call("/api/session/login", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password },
  });
  absorbSession(response);
  if (response.ok) {
    const info = (await response.clone().json()) as { csrfToken: string | null };
    jar.csrf = info.csrfToken;
  }
  return response;
}

beforeAll(async () => {
  proxy = await openTestDatabase();
  env = proxy.env as unknown as { DB: D1Database };
  worker = (await import("../../src/worker/index")).default as unknown as {
    fetch: typeof fetch;
  };

  // A known starting state. A parent row left over from an earlier run would
  // make the first-run bootstrap test pass for the wrong reason — it would be
  // proving the route refused, not that it created. Clearing the data (never the
  // schema) makes the suite repeatable on the dedicated test database.
  await resetData(env.DB as unknown as D1Database);
});

afterAll(async () => {
  // Releasing the proxy releases its SQLite handle. If this is skipped the file
  // stays locked, and the next suite in the same process fails with
  // SQLITE_BUSY on its first `delete` — a locking problem that looks exactly
  // like a data problem.
  await proxy.dispose();
});

beforeEach(() => {
  jar.cookies = {};
  jar.csrf = null;
});

describe("bootstrap — first-run parent creation", () => {
  it("creates the parent and issues an HttpOnly session cookie", async () => {
    const response = await call("/api/session/bootstrap", {
      method: "POST",
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("refuses a second bootstrap, so account creation is not repeatable", async () => {
    // 403: the route closes itself once a parent row exists, by design.
    const response = await call("/api/session/bootstrap", {
      method: "POST",
      json: { displayName: "Parent Two", password: PASSWORD },
    });
    expect(response.status).toBe(403);
  });
});

describe("session — login", () => {
  it("rejects a wrong password and does not issue a session", async () => {
    const response = await login("SaiMatKhauThatBai");
    expect(response.status).toBe(401);
    expect(jar.cookies).toEqual({});
  });

  it("accepts the correct password and returns a CSRF token", async () => {
    const response = await login(PASSWORD);
    expect(response.status).toBe(200);
    expect(jar.csrf).toBeTruthy();
  });
});

describe("authorization — the protected surface is closed", () => {
  it("rejects a protected read with no session cookie", async () => {
    const response = await call("/api/parent/dashboard");
    expect(response.status).toBe(401);
  });

  it("refuses every matched route when SESSION_SECRET is absent, before authentication runs", async () => {
    // The guard runs ahead of auth, so a misconfigured Worker answers 500 rather
    // than 401: it is not "you are not logged in", it is "this server cannot
    // decide who you are". A 401 here would mean the request reached the
    // authenticator without a signing key.
    const noSecret = { ...env } as unknown as typeof env;
    const response = await worker.fetch(
      new Request(`${ORIGIN}/api/parent/dashboard`, {
        headers: { origin: ORIGIN, "user-agent": "config-guard-ua" },
      }),
      noSecret,
    );
    expect(response.status).toBe(500);
    // Opaque body: the operator reads logs, not the response.
    const body = (await response.json()) as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain("SESSION_SECRET");
    expect(JSON.stringify(body)).not.toContain("configuration");
  });

  it("refuses unmatched and non-API paths too, so the guard precedes route matching", async () => {
    // A Worker with no signing key has no correct answer for any request. If the
    // guard sat after route matching, these would answer 404 — telling the caller
    // the app is healthy and only that URL is missing.
    const noSecret = { ...env } as unknown as typeof env;
    const headers = { origin: ORIGIN, "user-agent": "config-guard-ua" };
    const misses = ["/api/does-not-exist", "/", "/some/asset.js"];
    for (const path of misses) {
      const response = await worker.fetch(new Request(`${ORIGIN}${path}`, { headers }), noSecret);
      expect(response.status, `path ${path}`).toBe(500);
    }
  });

  it("refuses when SESSION_SECRET is present but too weak to be a key", async () => {
    const response = await worker.fetch(
      new Request(`${ORIGIN}/api/parent/dashboard`, {
        headers: { origin: ORIGIN, "user-agent": "config-guard-ua" },
      }),
      { ...env, SESSION_SECRET: "a" } as unknown as typeof env,
    );
    // A one-character secret signs a valid HMAC and is worthless. Presence-only
    // checking would have accepted it and served the request.
    expect(response.status).toBe(500);
  });

  it("rejects a protected read with a garbage cookie", async () => {
    jar.cookies = { tlo_session: "not-a-real-token" };
    const response = await call("/api/parent/dashboard");
    expect(response.status).toBe(401);
  });

  it("rejects a protected read with a tampered signature segment", async () => {
    // The malformed-base64 case: this must be a 401, never an unhandled
    // DOMException surfacing as a 500.
    jar.cookies = { tlo_session: "eyJhIjoxfQ.***not*base64***" };
    const response = await call("/api/parent/dashboard");
    expect(response.status).toBe(401);
  });

  it("rejects a mutating request that carries no CSRF header", async () => {
    await login(PASSWORD);
    jar.csrf = null;
    const response = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: "does-not-exist", status: "approved" },
    });
    expect(response.status).toBe(403);
  });

  it("rejects a mutating request whose CSRF does not match the session", async () => {
    await login(PASSWORD);
    jar.csrf = "a-token-minted-for-some-other-session";
    const response = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: "does-not-exist", status: "approved" },
    });
    expect(response.status).toBe(403);
  });

  it("rejects a mutating request from a mismatched Origin header even with valid session and CSRF", async () => {
    const loginRes = await call("/api/session/login", {
      method: "POST",
      headers: { "user-agent": "test-origin-ua" },
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });
    expect(loginRes.status).toBe(200);
    absorbSession(loginRes);
    const info = (await loginRes.json()) as { csrfToken: string };
    const cookie = Object.entries(jar.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    const request = new Request(`${ORIGIN}/api/parent/lessons/approval`, {
      method: "POST",
      headers: {
        origin: "https://evil.example.com",
        "user-agent": "test-origin-ua",
        cookie,
        "x-tlo-csrf": info.csrfToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({ lessonId: "does-not-exist", status: "approved" }),
    });
    const response = await worker.fetch(request, { ...env, SESSION_SECRET: TEST_SECRET });
    expect(response.status).toBe(403);
  });

  it("enforces rate limiting per client bucket without random requestId bypass or User-Agent/Accept-Language rotation bypass", async () => {
    let calls = 0;
    const keys: string[] = [];
    const mockLimiter = {
      limit: async ({ key }: { key: string }) => {
        calls += 1;
        keys.push(key);
        return { success: calls <= 2 };
      },
    };
    const makeLoginReq = (ua: string, lang: string) =>
      new Request(`${ORIGIN}/api/session/login`, {
        method: "POST",
        headers: {
          origin: ORIGIN,
          "user-agent": ua,
          "accept-language": lang,
          "content-type": "application/json",
        },
        body: JSON.stringify({ displayName: DISPLAY_NAME, password: "wrong" }),
      });

    const r1 = await worker.fetch(makeLoginReq("agent-1", "vi-VN"), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);
    const r2 = await worker.fetch(makeLoginReq("agent-2-rotated", "en-US"), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);
    const r3 = await worker.fetch(makeLoginReq("agent-3-spoofed", "fr-FR"), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);

    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
    expect(r3.status).toBe(429);
    // Keys must be identical across requests even when User-Agent and Accept-Language rotate
    expect(keys).toHaveLength(3);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[1]).toBe(keys[2]);
  });
});

describe("privilege boundary — child mode (mode: 'learner') vs parent mode (mode: 'parent')", () => {
  it("blocks all /api/parent/* and /api/data/* routes with 403 while in child mode, and unlocks them only after password verification", async () => {
    const loginRes = await login(PASSWORD);
    expect(loginRes.status).toBe(200);
    const loginInfo = (await loginRes.json()) as { mode?: string };
    expect(loginInfo.mode).toBe("parent");

    // In parent mode, /api/parent/dashboard succeeds
    const dashBefore = await call("/api/parent/dashboard");
    expect(dashBefore.status).toBe(200);

    // Switch session to child mode (mode: "learner")
    const switchChildRes = await call("/api/session/mode", {
      method: "POST",
      json: { mode: "learner" },
    });
    expect(switchChildRes.status).toBe(200);
    absorbSession(switchChildRes);
    const childInfo = (await switchChildRes.json()) as { csrfToken: string; mode: string };
    expect(childInfo.mode).toBe("learner");
    jar.csrf = childInfo.csrfToken;

    // Learner routes continue to work in child mode
    const subjectsRes = await call("/api/learner/subjects");
    expect(subjectsRes.status).toBe(200);

    // Every parent and data control route MUST return 403 Forbidden in child mode
    const forbiddenChecks = [
      await call("/api/parent/dashboard"),
      await call("/api/parent/lessons"),
      await call("/api/parent/lessons/math-rect-area"),
      await call("/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-rect-area", status: "approved" },
      }),
      await call("/api/parent/lessons/content", {
        method: "POST",
        json: { lessonId: "math-rect-area", titleVi: "Hack" },
      }),
      await call("/api/parent/skills/correct", {
        method: "POST",
        json: { learnerId: "any", skillId: "any", targetState: "INDEPENDENT", reason: "test reason long enough" },
      }),
      await call("/api/parent/learners", {
        method: "POST",
        json: { nickname: "Bé 2", birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
      }),
      await call("/api/parent/learners/profile", {
        method: "PATCH",
        json: { learnerId: "any", nickname: "Bé 2", grade: 4 },
      }),
      await call("/api/parent/curriculum"),
      await call("/api/parent/curriculum", {
        method: "POST",
        json: { subjectId: "math" },
      }),
      await call("/api/parent/baseline"),
      await call("/api/parent/baseline", {
        method: "POST",
        json: { subjectId: "math" },
      }),
      await call("/api/parent/planner"),
      await call("/api/parent/planner/generate", {
        method: "POST",
        json: {},
      }),
      await call("/api/parent/planner/item", {
        method: "PATCH",
        json: { itemId: "any", status: "completed" },
      }),
      await call("/api/data/export", { method: "POST", json: {} }),
      await call("/api/data/import", { method: "POST", json: {} }),
      await call("/api/data/learner", {
        method: "DELETE",
        json: { learnerId: "any", confirmation: "XOA Bé Mẫu" },
      }),
    ];

    for (const response of forbiddenChecks) {
      expect(response.status).toBe(403);
    }

    // Attempting to re-enter parent mode WITHOUT password fails with 400
    const unlockNoPw = await call("/api/session/mode", {
      method: "POST",
      json: { mode: "parent" },
    });
    expect(unlockNoPw.status).toBe(400);

    // Attempting to re-enter parent mode with WRONG password fails with 403
    const unlockWrongPw = await call("/api/session/mode", {
      method: "POST",
      json: { mode: "parent", password: "WrongPassword12345" },
    });
    expect(unlockWrongPw.status).toBe(403);

    // Still locked in child mode
    expect((await call("/api/parent/dashboard")).status).toBe(403);

    // Unlocking with CORRECT password restores parent mode
    const unlockOk = await call("/api/session/mode", {
      method: "POST",
      json: { mode: "parent", password: PASSWORD },
    });
    expect(unlockOk.status).toBe(200);
    absorbSession(unlockOk);
    const parentInfo = (await unlockOk.json()) as { csrfToken: string; mode: string };
    expect(parentInfo.mode).toBe("parent");
    jar.csrf = parentInfo.csrfToken;

    // Parent routes now succeed again
    expect((await call("/api/parent/dashboard")).status).toBe(200);
    expect((await call("/api/parent/lessons")).status).toBe(200);
    expect((await call("/api/parent/curriculum")).status).toBe(200);
    expect((await call("/api/parent/baseline")).status).toBe(200);
    expect((await call("/api/parent/planner")).status).toBe(200);
  });
});

describe("curriculum, baseline and 4-week planner API contracts", () => {
  it("persists curriculum intake with UNKNOWN defaults, provenance labels and loads registered GDPT 2018 objectives", async () => {
    await login(PASSWORD);
    // Enroll learner
    await call("/api/parent/learners", {
      method: "POST",
      json: { nickname: "Bé Mẫu", birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
    });

    const getRes = await call("/api/parent/curriculum");
    expect(getRes.status).toBe(200);
    const initial = (await getRes.json()) as { objectives: { id: string }[]; intakes: unknown[] };
    expect(initial.objectives.length).toBeGreaterThan(0);

    const postRes = await call("/api/parent/curriculum", {
      method: "POST",
      json: {
        subjectId: "math",
        schoolYearLabel: "2026-2027",
        grade: 4,
        textbookSeries: "UNKNOWN",
        currentUnit: "UNKNOWN",
        currentLesson: "UNKNOWN",
        weeklySessions: 3,
        sessionDurationMinutes: 20,
        provenance: "unverified_assumption",
        learningGoalsVi: "Nắm vững phân số",
      },
    });
    expect(postRes.status).toBe(200);

    const verifyRes = await call("/api/parent/curriculum");
    expect(verifyRes.status).toBe(200);
    const updated = (await verifyRes.json()) as {
      intakes: {
        subjectId: string;
        textbookSeries: string;
        currentUnit: string;
        currentLesson: string;
        provenance: string;
      }[];
    };
    const mathIntake = updated.intakes.find((i) => i.subjectId === "math");
    expect(mathIntake).toBeDefined();
    expect(mathIntake?.textbookSeries).toBe("UNKNOWN");
    expect(mathIntake?.currentUnit).toBe("UNKNOWN");
    expect(mathIntake?.currentLesson).toBe("UNKNOWN");
    expect(mathIntake?.provenance).toBe("unverified_assumption");
  });

  it("evaluates baseline diagnostic assessment and generates/edits 4-week planner items", async () => {
    await login(PASSWORD);

    // Baseline evaluate
    const evalRes = await call("/api/parent/baseline", {
      method: "POST",
      json: { subjectId: "math" },
    });
    expect(evalRes.status).toBe(200);
    const evalData = (await evalRes.json()) as {
      assessment: { subjectId: string; parentReviewRequired: boolean };
    };
    expect(evalData.assessment.subjectId).toBe("math");
    expect(evalData.assessment.parentReviewRequired).toBe(true);

    // Plan generate
    const planGenRes = await call("/api/parent/planner/generate", {
      method: "POST",
      json: { schoolYearLabel: "2026-2027", sessionsPerWeek: 3, sessionDurationMinutes: 20 },
    });
    expect(planGenRes.status).toBe(200);
    const plan = (await planGenRes.json()) as {
      items: { id: string; status: string; weekIndex: number }[];
    };
    expect(plan.items.length).toBeGreaterThan(0);

    // Plan edit
    const firstItem = plan.items[0]!;
    const patchRes = await call("/api/parent/planner/item", {
      method: "PATCH",
      json: { itemId: firstItem.id, status: "completed", parentNote: "Hoàn thành tốt" },
    });
    expect(patchRes.status).toBe(200);
    const updatedPlan = (await patchRes.json()) as {
      items: { id: string; status: string; parentNote: string | null }[];
    };
    const updatedItem = updatedPlan.items.find((i) => i.id === firstItem.id);
    expect(updatedItem?.status).toBe("completed");
    expect(updatedItem?.parentNote).toBe("Hoàn thành tốt");
  });
});

describe("persistent auth throttling across headers and restarts", () => {
  it("locks out an IP and account after 5 consecutive failed attempts, returning 429 and retry-after header", async () => {
    // Reset data first
    await resetData(env.DB);
    // Bootstrap parent
    await call("/api/session/bootstrap", {
      method: "POST",
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });

    // Make 4 failed attempts from different User-Agents using a dedicated client IP
    for (let i = 1; i <= 4; i++) {
      const res = await call("/api/session/login", {
        method: "POST",
        headers: {
          "user-agent": `rotator-ua-${i}`,
          "cf-connecting-ip": "198.51.100.77",
        },
        json: { displayName: DISPLAY_NAME, password: "SaiMatKhau" },
      });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt triggers the lockout
    const fifthRes = await call("/api/session/login", {
      method: "POST",
      headers: {
        "user-agent": "rotator-ua-5",
        "cf-connecting-ip": "198.51.100.77",
      },
      json: { displayName: DISPLAY_NAME, password: "SaiMatKhau" },
    });
    expect(fifthRes.status).toBe(429);
    expect(fifthRes.headers.get("retry-after")).toBeTruthy();

    // 6th attempt (even with CORRECT password and a DIFFERENT IP) is locked out by account scope in D1
    const lockedRes = await call("/api/session/login", {
      method: "POST",
      headers: {
        "user-agent": "brand-new-ua",
        "cf-connecting-ip": "198.51.100.99",
      },
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });
    expect(lockedRes.status).toBe(429);
    expect(lockedRes.headers.get("retry-after")).toBeTruthy();

    // Verify records exist in auth_throttles in D1
    const throttleRows = await env.DB.prepare("SELECT COUNT(*) as n FROM auth_throttles").first<{ n: number }>();
    expect(throttleRows?.n).toBeGreaterThan(0);

    // Operator CLI unlock (simulate scripts/unlock-parent.mjs)
    await env.DB.prepare("DELETE FROM auth_throttles").run();

    // After clearing auth_throttles, login with correct password succeeds immediately!
    const recoveredRes = await call("/api/session/login", {
      method: "POST",
      headers: {
        "user-agent": "recovered-ua",
        "cf-connecting-ip": "198.51.100.99",
      },
      json: { displayName: DISPLAY_NAME, password: PASSWORD },
    });
    expect(recoveredRes.status).toBe(200);
  });
});

