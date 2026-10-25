import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getPlatformProxy } from "wrangler";
import { resetData } from "./reset-data";

/**
 * The real Worker, driven through its real fetch handler, against a real D1.
 *
 * The Worker's default export is the shipped one: the same route table, auth
 * middleware and D1 binding the running app uses. Nothing here calls a
 * repository function directly, because the question these tests answer is
 * whether the app works, not whether a helper works in isolation.
 *
 * `getPlatformProxy` reads the shipped `wrangler.jsonc`, provisions the local
 * bindings it declares and applies the shipped `migrations/` to the D1 database
 * — exactly the configuration `npm run dev` runs against. That is why this
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
let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;

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
  proxy = await getPlatformProxy<{ DB: D1Database }>();
  env = proxy.env;
  worker = (await import("../../src/worker/index")).default as unknown as {
    fetch: typeof fetch;
  };

  // A known starting state. A parent row left over from an earlier run would
  // make the first-run bootstrap test pass for the wrong reason — it would be
  // proving the route refused, not that it created. Clearing the data (never the
  // schema) makes the suite repeatable on the same local database.
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

  it("enforces rate limiting per client bucket without random requestId bypass", async () => {
    let calls = 0;
    const keys: string[] = [];
    const mockLimiter = {
      limit: async ({ key }: { key: string }) => {
        calls += 1;
        keys.push(key);
        return { success: calls <= 2 };
      },
    };
    const makeLoginReq = () =>
      new Request(`${ORIGIN}/api/session/login`, {
        method: "POST",
        headers: {
          origin: ORIGIN,
          "user-agent": "rate-limit-test-agent/1.0",
          "accept-language": "vi-VN",
          "content-type": "application/json",
        },
        body: JSON.stringify({ displayName: DISPLAY_NAME, password: "wrong" }),
      });

    const r1 = await worker.fetch(makeLoginReq(), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);
    const r2 = await worker.fetch(makeLoginReq(), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);
    const r3 = await worker.fetch(makeLoginReq(), {
      ...env,
      SESSION_SECRET: TEST_SECRET,
      AUTH_RATE_LIMITER: mockLimiter,
    } as never);

    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
    expect(r3.status).toBe(429);
    // Keys must be identical across requests for the same client (no random requestId prefix)
    expect(keys).toHaveLength(3);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[1]).toBe(keys[2]);
  });
});
