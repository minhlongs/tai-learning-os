/**
 * Request middleware: authentication, CSRF, rate limiting, fail-closed config.
 *
 * The invariant this module protects: an unauthenticated request must never
 * reach a handler that reads or writes learner data. That is enforced here, in
 * one place, so handlers receive a proven parent context rather than a guess.
 */

import {
  csrfOk,
  forbidden,
  notFound,
  rateLimited,
  serverError,
  unauthorized,
} from "./response";
import {
  CSRF_HEADER_NAME,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  csrfTokenFor,
  type SessionClaims,
} from "../../shared/crypto/session";
import { validateConfig } from "../config-guard";

export type AppEnv = {
  DB: D1Database;
  /** Supplied via .dev.vars locally (gitignored) or a Worker secret when deployed. */
  PARENT_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
  /**
   * `"development"` is the only value that relaxes the config guard. Unset means
   * production: `wrangler.jsonc` declares no default, so a deploy gets the
   * strict rules unless it opts out deliberately.
   */
  ENVIRONMENT?: string;
  AUTH_RATE_LIMITER?: RateLimit;
  API_RATE_LIMITER?: RateLimit;
};

export type ParentContext = {
  parentId: string;
  displayName: string;
  claims: SessionClaims;
  csrfToken: string;
};

export type HandlerContext = {
  request: Request;
  url: URL;
  env: AppEnv;
  parent: ParentContext;
  /** Request-scoped id used for audit rows; not derived from any personal data. */
  requestId: string;
};

export type Handler = (context: HandlerContext) => Promise<Response>;

/** Behind authentication. The parent context is proven before this runs. */
export type ProtectedRoute = {
  method: string;
  pattern: RegExp;
  handler: Handler;
  kind: "protected" | "parent";
};

/** Unauthenticated by design. Receives no parent context. */
export type PublicRoute = {
  method: string;
  pattern: RegExp;
  handler: (context: { request: Request; url: URL; env: AppEnv; requestId: string }) => Promise<Response>;
  kind: "public";
};

export type Route = ProtectedRoute | PublicRoute;

export function protectedRoute(method: string, pattern: RegExp, handler: Handler): ProtectedRoute {
  return { method, pattern, handler, kind: "protected" };
}

/** Behind authentication AND parent privilege mode (`mode !== "learner"`). */
export function parentRoute(method: string, pattern: RegExp, handler: Handler): ProtectedRoute {
  return { method, pattern, handler, kind: "parent" };
}

export function publicRoute(
  method: string,
  pattern: RegExp,
  handler: PublicRoute["handler"],
): PublicRoute {
  return { method, pattern, handler, kind: "public" };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Dispatch a request through the route table.
 *
 * Order of checks is deliberate: rate limit -> authenticate -> CSRF (mutations
 * only) -> handler. Authentication precedes CSRF so an anonymous flood is
 * rejected on cost, not on crypto.
 */
export async function dispatch(
  request: Request,
  env: AppEnv,
  routes: readonly Route[],
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const requestId = crypto.randomUUID();

  // Fail closed on configuration, before route matching, rate limiting, or
  // authentication. This runs first — not after the 404 branches — because a
  // Worker with no usable signing key has no correct answer to give for *any*
  // request, including one for a path it does not serve. Answering 404 there
  // would tell the caller the app is healthy and only that URL is missing,
  // which is a worse lie than a blank 500.
  //
  // A Worker has no startup hook: it is instantiated per request, so "refuse to
  // start" is not expressible. Refusing every request is the strongest form the
  // platform allows, and it is what `test/integration/api.test.ts` asserts.
  //
  // The check lives in `config-guard.ts` so it can be asserted directly rather
  // than inferred from a blank 500, and so it rejects weak values rather than
  // merely absent ones (`SESSION_SECRET="a"` signs a valid HMAC and is
  // worthless).
  const verdict = validateConfig(env);
  if (!verdict.ok) {
    // Intentionally opaque: the operator must read logs, not the response body.
    // Only codes and measured lengths are logged — never a secret value.
    console.error(
      `refusing to serve: invalid configuration ${verdict.problems.map((problem) => problem.code).join(", ")}`,
    );
    return serverError();
  }

  if (!path.startsWith("/api/")) {
    // Not an API route. The Vite plugin serves static assets itself, so this is
    // only reached for an API-shaped miss.
    return notFound();
  }

  const match = routes.find(
    (route) => route.method === method && route.pattern.test(path),
  );

  if (!match) {
    return notFound();
  }

  // Rate limiting, per actor bucket.
  const limiter = pickLimiter(env, path);
  if (limiter) {
    const key = clientKey(request, path);
    const { success } = await limiter.limit({ key });
    if (!success) {
      return rateLimited();
    }
  }

  if (match.kind === "public") {
    return match.handler({ request, url, env, requestId });
  }

  const parent = await authenticate(request, env);
  if (!parent.ok) {
    return unauthorized();
  }

  if (match.kind === "parent" && parent.parent.claims.mode === "learner") {
    return forbidden("Khu vực này dành riêng cho phụ huynh. Vui lòng xác nhận mật khẩu phụ huynh.");
  }

  if (!SAFE_METHODS.has(method)) {
    // Validate Origin header when present on mutating requests
    const originHeader = request.headers.get("origin");
    if (originHeader) {
      try {
        const originUrl = new URL(originHeader);
        if (originUrl.host !== url.host) {
          return forbidden("Yêu cầu không hợp lệ (sai nguồn gốc gửi tới). Vui lòng tải lại trang.");
        }
      } catch {
        return forbidden("Yêu cầu không hợp lệ (nguồn gốc không hợp lệ).");
      }
    }

    const supplied = request.headers.get(CSRF_HEADER_NAME);
    if (!csrfOk(supplied, parent.parent.csrfToken)) {
      return forbidden("Yêu cầu không hợp lệ (thiếu mã bảo mật). Vui lòng tải lại trang.");
    }
  }

  return match.handler({
    request,
    url,
    env,
    parent: parent.parent,
    requestId,
  });
}

type AuthResult = { ok: true; parent: ParentContext } | { ok: false; reason: string };

async function authenticate(request: Request, env: AppEnv): Promise<AuthResult> {
  const secret = env.SESSION_SECRET;
  if (!secret) return { ok: false, reason: "no session secret" };

  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
  if (!token) return { ok: false, reason: "no session cookie" };

  const verified = await verifySessionToken(secret, token, Date.now());
  if (!verified.ok) return { ok: false, reason: verified.reason };

  const csrfToken = await csrfTokenFor(secret, verified.claims.tokenId);

  return {
    ok: true,
    parent: {
      parentId: verified.claims.parentId,
      displayName: verified.claims.parentDisplayName,
      claims: verified.claims,
      csrfToken,
    },
  };
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name && rest.length > 0) return rest.join("=");
  }
  return null;
}

function pickLimiter(env: AppEnv, path: string): { limit: (opts: { key: string }) => Promise<{ success: boolean }> } | null {
  if (
    path === "/api/session/login" ||
    path === "/api/session/bootstrap" ||
    path === "/api/session/mode"
  ) {
    return null; // Rate limiting on auth endpoints is applied strictly on failed verification in session.ts
  }
  if (path.startsWith("/api/")) {
    return env.API_RATE_LIMITER ?? null;
  }
  return null;
}

/**
 * A coarse, privacy-preserving client key. Deliberately NOT the raw IP in logs/DB:
 * for auth endpoints (`/api/session/login`, `/api/session/bootstrap`, `/api/session/mode`),
 * we bucket by a fixed auth namespace (`auth:<hash32(ip)>`) rather than `User-Agent`
 * or `Accept-Language`, so an attacker cannot bypass brute-force throttling by rotating
 * request headers.
 */
export function authClientKey(request: Request): string {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  return `auth:${hash32(ip)}`;
}

function clientKey(request: Request, path: string): string {
  if (
    path === "/api/session/login" ||
    path === "/api/session/bootstrap" ||
    path === "/api/session/mode"
  ) {
    return authClientKey(request);
  }
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const ua = request.headers.get("user-agent") ?? "unknown";
  const lang = request.headers.get("accept-language") ?? "";
  return `api:${hash32(ip)}:${ua.length}:${lang.length}:${hash32(ua + lang)}`;
}

function hash32(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
