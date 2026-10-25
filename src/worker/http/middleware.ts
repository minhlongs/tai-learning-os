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

export type AppEnv = {
  DB: D1Database;
  /** Present only in local dev, supplied by .dev.vars (gitignored). */
  PARENT_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
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
  kind: "protected";
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

  // Fail closed on configuration. If production credentials are missing, the
  // protected surface must not silently fall back to an unauthenticated mode.
  const missing: string[] = [];
  if (!env.SESSION_SECRET) missing.push("SESSION_SECRET");
  if (env.ENVIRONMENT === "development" && !env.PARENT_PASSWORD_HASH) {
    // Dev onboarding supports first-run parent creation, so this is allowed.
  } else if (!env.PARENT_PASSWORD_HASH) {
    missing.push("PARENT_PASSWORD_HASH");
  }
  if (missing.length > 0) {
    // Intentionally opaque: the operator must read logs, not the response body.
    console.error(`refusing to serve: missing configuration ${missing.join(", ")}`);
    return serverError();
  }

  // Rate limiting, per actor bucket.
  const limiter = pickLimiter(env, path);
  if (limiter) {
    const key = clientKey(request);
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
  if (path === "/api/session/login" || path === "/api/session/bootstrap") {
    return env.AUTH_RATE_LIMITER ?? null;
  }
  if (path.startsWith("/api/")) {
    return env.API_RATE_LIMITER ?? null;
  }
  return null;
}

/**
 * A coarse, privacy-preserving client key. Deliberately NOT the IP: an IP is
 * personal data, and for a single-parent app it identifies a household. The
 * rate limiter needs a bucket, not an identity.
 */
function clientKey(request: Request): string {
  const ua = request.headers.get("user-agent") ?? "unknown";
  const lang = request.headers.get("accept-language") ?? "";
  return `${ua.length}:${lang.length}:${hash32(ua + lang)}`;
}

function hash32(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
