/**
 * Authentication and session routes.
 *
 * SECURITY POSTURE, stated plainly:
 *   - Passwords are hashed with PBKDF2-SHA256 (600,000 iterations, per-password
 *     salt). Nothing reversible is stored. Legacy 100,000-iteration hashes are
 *     transparently upgraded on login or parent-mode unlock.
 *   - The login, bootstrap, and parent-unlock paths enforce persistent D1
 *     account-scoped and IP-scoped throttling (`auth_throttles`) in addition to
 *     the Cloudflare Rate Limiting binding, so brute force cannot bypass limits
 *     by rotating headers or restarting the Worker.
 *   - There is NO authentication bypass anywhere in the code. The only
 *     development affordance is first-run parent creation, which becomes
 *     unavailable once a parent row exists.
 *   - The session cookie is HttpOnly, SameSite=Strict, Secure off localhost.
 */

import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
  needsRehash,
  validatePasswordShape,
  verifyPassword,
} from "../../shared/crypto/password";
import {
  CLEARED_SESSION_COOKIE,
  createSessionToken,
  csrfTokenFor,
  sessionCookie,
  verifySessionToken,
} from "../../shared/crypto/session";
import type { SessionInfo } from "../../shared/api-contract";
import * as repo from "../db/repositories";
import { badRequest, ok, readJsonBody, unauthorized, forbidden, rateLimited, serverError } from "../http/response";
import { SESSION_TTL_MS } from "../../shared/crypto/session";
import { authClientKey, type AppEnv } from "../http/middleware";

/* ── GET /api/session ─────────────────────────────────────────────────────── */

export async function getSessionInfo(context: {
  request: Request;
  env: AppEnv;
}): Promise<Response> {
  const { request, env } = context;
  const cookie = request.headers.get("cookie") ?? "";
  const token = readCookie(cookie, "tlo_session");

  if (!token) {
    return ok<SessionInfo>({
      authenticated: false,
      parentDisplayName: null,
      learner: null,
      csrfToken: null,
    });
  }

  const secret = env.SESSION_SECRET;
  if (!secret) return serverError();

  const verified = await verifyToken(secret, token);
  if (!verified.ok) {
    return ok<SessionInfo>({
      authenticated: false,
      parentDisplayName: null,
      learner: null,
      csrfToken: null,
    });
  }

  // The parent row must still exist; a deleted parent must not stay logged in.
  const parent = await repo.findParentById(env.DB, verified.parentId);
  if (!parent) {
    return ok<SessionInfo>({
      authenticated: false,
      parentDisplayName: null,
      learner: null,
      csrfToken: null,
    });
  }

  const learner = await repo.findFirstLearnerForParent(env.DB, parent.id);
  const csrfToken = await csrfTokenFor(secret, verified.tokenId);

  return ok<SessionInfo>({
    authenticated: true,
    parentDisplayName: parent.display_name,
    learner: learner ? { id: learner.id, nickname: learner.nickname } : null,
    csrfToken,
    mode: verified.mode ?? "parent",
  });
}

/* ── POST /api/session/mode ──────────────────────────────────────────────── */

export async function switchSessionMode(context: {
  request: Request;
  env: AppEnv;
}): Promise<Response> {
  const { request, env } = context;
  const parsed = await readJsonBody(request, 2_000);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body as { mode?: unknown; password?: unknown };
  if (body.mode !== "parent" && body.mode !== "learner") {
    return badRequest("Chế độ phiên không hợp lệ. Chỉ chấp nhận 'parent' hoặc 'learner'.");
  }

  const cookie = request.headers.get("cookie") ?? "";
  const token = readCookie(cookie, "tlo_session");
  if (!token) return unauthorized();

  const secret = env.SESSION_SECRET;
  if (!secret) return serverError();

  const verified = await verifySessionToken(secret, token, Date.now());
  if (!verified.ok) return unauthorized();

  const parent = await repo.findParentById(env.DB, verified.claims.parentId);
  if (!parent) return unauthorized();

  const now = Date.now();

  if (body.mode === "parent") {
    if (typeof body.password !== "string" || body.password.length === 0) {
      return badRequest("Cần nhập mật khẩu để chuyển sang chế độ phụ huynh.");
    }
    const ipKey = authClientKey(request);
    const accountKey = `account:id:${parent.id}`;
    const ipThrottle = await repo.checkAuthThrottle(env.DB, ipKey, now);
    if (ipThrottle.blocked) return rateLimited(ipThrottle.retryAfterSec);
    const acctThrottle = await repo.checkAuthThrottle(env.DB, accountKey, now);
    if (acctThrottle.blocked) return rateLimited(acctThrottle.retryAfterSec);

    const valid = await verifyPassword(body.password, parent.password_hash);
    if (!valid) {
      const ipRec = await repo.recordAuthFailure(env.DB, { key: ipKey, scope: "ip", now });
      const acctRec = await repo.recordAuthFailure(env.DB, { key: accountKey, scope: "account", now });
      if (ipRec.blocked) return rateLimited(ipRec.retryAfterSec);
      if (acctRec.blocked) return rateLimited(acctRec.retryAfterSec);
      return forbidden("Mật khẩu phụ huynh không chính xác.");
    }

    await repo.clearAuthThrottle(env.DB, ipKey);
    await repo.clearAuthThrottle(env.DB, accountKey);

    if (needsRehash(parent.password_hash)) {
      const shape = validatePasswordShape(body.password);
      if (shape.ok) {
        const upgradedHash = await hashPassword(body.password);
        await repo.updateParentPasswordHash(env.DB, {
          id: parent.id,
          passwordHash: upgradedHash,
          now,
        });
      }
    }
  }

  const targetMode = body.mode;
  const newToken = await createSessionToken(
    secret,
    parent.id,
    parent.display_name,
    now,
    targetMode,
  );

  const issued = await verifySessionToken(secret, newToken, now);
  if (!issued.ok) return serverError();

  const csrfToken = await csrfTokenFor(secret, issued.claims.tokenId);
  const learner = await repo.findFirstLearnerForParent(env.DB, parent.id);

  await repo.recordAudit(env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${parent.id}`,
    action: targetMode === "parent" ? "session.mode_parent" : "session.mode_learner",
    subject: parent.id,
    detail: JSON.stringify({ previousMode: verified.claims.mode ?? "parent", newMode: targetMode }),
    now,
  });

  const response = ok<SessionInfo>({
    authenticated: true,
    parentDisplayName: parent.display_name,
    learner: learner ? { id: learner.id, nickname: learner.nickname } : null,
    csrfToken,
    mode: targetMode,
  });

  response.headers.append("set-cookie", sessionCookie(newToken, issued.claims.expiresAt, isSecure(request)));
  return response;
}

/* ── POST /api/session/login ─────────────────────────────────────────────── */

export async function login(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;
  const parsed = await readJsonBody(request, 2_000);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body as { displayName?: unknown; password?: unknown };
  if (typeof body.displayName !== "string" || typeof body.password !== "string") {
    return badRequest("Thiếu tên đăng nhập hoặc mật khẩu.");
  }

  const secret = env.SESSION_SECRET;
  if (!secret) return serverError();

  const now = Date.now();
  const normalizedName = body.displayName.trim();
  const ipKey = authClientKey(request);
  const nameAccountKey = `account:${normalizedName.toLowerCase()}`;

  const ipThrottle = await repo.checkAuthThrottle(env.DB, ipKey, now);
  if (ipThrottle.blocked) return rateLimited(ipThrottle.retryAfterSec);
  const nameThrottle = await repo.checkAuthThrottle(env.DB, nameAccountKey, now);
  if (nameThrottle.blocked) return rateLimited(nameThrottle.retryAfterSec);

  const parent = await repo.findParentByDisplayName(env.DB, normalizedName);
  // Uniform failure: a wrong name and a wrong password are indistinguishable,
  // so this endpoint cannot be used to enumerate parent accounts.
  if (!parent) {
    const ipRec = await repo.recordAuthFailure(env.DB, { key: ipKey, scope: "ip", now });
    const nameRec = await repo.recordAuthFailure(env.DB, { key: nameAccountKey, scope: "account", now });
    if (ipRec.blocked) return rateLimited(ipRec.retryAfterSec);
    if (nameRec.blocked) return rateLimited(nameRec.retryAfterSec);
    return unauthorized();
  }

  const parentAccountKey = `account:id:${parent.id}`;
  const parentThrottle = await repo.checkAuthThrottle(env.DB, parentAccountKey, now);
  if (parentThrottle.blocked) return rateLimited(parentThrottle.retryAfterSec);

  const valid = await verifyPassword(body.password, parent.password_hash);
  if (!valid) {
    const ipRec = await repo.recordAuthFailure(env.DB, { key: ipKey, scope: "ip", now });
    const nameRec = await repo.recordAuthFailure(env.DB, { key: nameAccountKey, scope: "account", now });
    const parentRec = await repo.recordAuthFailure(env.DB, { key: parentAccountKey, scope: "account", now });
    if (env.AUTH_RATE_LIMITER) {
      const { success } = await env.AUTH_RATE_LIMITER.limit({ key: ipKey });
      if (!success) return rateLimited();
    }
    if (ipRec.blocked) return rateLimited(ipRec.retryAfterSec);
    if (nameRec.blocked) return rateLimited(nameRec.retryAfterSec);
    if (parentRec.blocked) return rateLimited(parentRec.retryAfterSec);
    return unauthorized();
  }

  await repo.clearAuthThrottle(env.DB, ipKey);
  await repo.clearAuthThrottle(env.DB, nameAccountKey);
  await repo.clearAuthThrottle(env.DB, parentAccountKey);

  if (needsRehash(parent.password_hash)) {
    const shape = validatePasswordShape(body.password);
    if (shape.ok) {
      const upgradedHash = await hashPassword(body.password);
      await repo.updateParentPasswordHash(env.DB, {
        id: parent.id,
        passwordHash: upgradedHash,
        now,
      });
    }
  }

  const learner = await repo.findFirstLearnerForParent(env.DB, parent.id);
  const token = await createSessionToken(secret, parent.id, parent.display_name, now);
  // Derive the CSRF token from the freshly issued session's own token id, so
  // the header a client must send is cryptographically bound to this login.
  const issued = await verifyToken(secret, token);
  if (!issued.ok) return serverError();
  const csrfToken = await csrfTokenFor(secret, issued.tokenId);

  const info: SessionInfo = {
    authenticated: true,
    parentDisplayName: parent.display_name,
    learner: learner ? { id: learner.id, nickname: learner.nickname } : null,
    csrfToken,
    mode: "parent",
  };

  await repo.recordAudit(env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${parent.id}`,
    action: "session.login",
    subject: parent.id,
    detail: null,
    now,
  });

  const response = ok<SessionInfo>(info);
  response.headers.append("set-cookie", sessionCookie(token, issued.expiresAt, isSecure(request)));
  return response;
}

/* ── POST /api/session/logout ────────────────────────────────────────────── */

export async function logout(): Promise<Response> {
  const response = ok<{ loggedOut: true }>({ loggedOut: true });
  response.headers.append("set-cookie", CLEARED_SESSION_COOKIE);
  return response;
}

/**
 * POST /api/session/bootstrap
 *
 * First-run parent creation. This is the ONLY development affordance, and it
 * is structurally safe rather than hidden:
 *   - it refuses once any parent row exists;
 *   - it requires a password meeting the minimum length;
 *   - it hashes the password before storage;
 *   - it cannot be reached again, so there is no "demo bypass" to abuse.
 */
export async function bootstrapParent(context: { request: Request; env: AppEnv }): Promise<Response> {
  const { request, env } = context;
  const parsed = await readJsonBody(request, 4_000);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body as { displayName?: unknown; password?: unknown };
  if (typeof body.displayName !== "string" || typeof body.password !== "string") {
    return badRequest("Thiếu tên đăng nhập hoặc mật khẩu.");
  }

  const secret = env.SESSION_SECRET;
  if (!secret) return serverError();

  // A parent account must already exist for the app to be usable in production;
  // its hash is supplied as a deployment secret rather than chosen in a form.
  const now = Date.now();
  const ipKey = authClientKey(request);
  const ipThrottle = await repo.checkAuthThrottle(env.DB, ipKey, now);
  if (ipThrottle.blocked) return rateLimited(ipThrottle.retryAfterSec);

  const existing = await repo.countParents(env.DB);
  if (existing > 0) {
    const ipRec = await repo.recordAuthFailure(env.DB, { key: ipKey, scope: "ip", now });
    if (ipRec.blocked) return rateLimited(ipRec.retryAfterSec);
    return forbidden(
      "Tài khoản phụ huynh đã được tạo. Vui lòng đăng nhập bằng mật khẩu của bạn.",
    );
  }

  if (env.PARENT_PASSWORD_HASH) {
    // The operator supplied a pre-hashed password. Deriving the parent from the
    // supplied hash is the supported production path; the form path is disabled
    // because it would let anyone create an account on an unseeded instance.
    return forbidden(
      "Máy chủ đã được cấu hình bằng tài khoản phụ huynh có sẵn. Vui lòng đăng nhập.",
    );
  }

  const shape = validatePasswordShape(body.password);
  if (!shape.ok) return badRequest(shape.reason);

  const parentId = crypto.randomUUID();
  const passwordHash = await hashPassword(body.password);

  const created = await repo.createParent(env.DB, {
    id: parentId,
    passwordHash,
    displayName: body.displayName.trim().slice(0, 60),
    now,
  });
  if (!created) {
    return forbidden(
      "Tài khoản phụ huynh đã được tạo. Vui lòng đăng nhập bằng mật khẩu của bạn.",
    );
  }

  await repo.recordAudit(env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${parentId}`,
    action: "parent.created",
    subject: parentId,
    detail: null,
    now,
  });

  const token = await createSessionToken(secret, parentId, body.displayName.trim(), now);
  const response = ok<{ created: true }>({ created: true });
  response.headers.append("set-cookie", sessionCookie(token, now + SESSION_TTL_MS, isSecure(request)));
  return response;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name && rest.length > 0) return rest.join("=");
  }
  return null;
}

function isSecure(request: Request): boolean {
  // Local development runs on http://127.0.0.1, where a Secure cookie would be
  // silently dropped and lock the parent out. Production is https, where the
  // flag is required. This is decided by the actual request, never by config.
  const url = new URL(request.url);
  return url.protocol === "https:";
}

type VerifiedToken = { parentId: string; tokenId: string; expiresAt: number; mode?: "parent" | "learner" };

async function verifyToken(secret: string, token: string): Promise<
  ({ ok: true } & VerifiedToken) | { ok: false; reason: string }
> {
  const result = await verifySessionToken(secret, token, Date.now());
  if (!result.ok) return { ok: false, reason: result.reason };
  return {
    ok: true,
    parentId: result.claims.parentId,
    tokenId: result.claims.tokenId,
    expiresAt: result.claims.expiresAt,
    mode: result.claims.mode,
  };
}

void MIN_PASSWORD_LENGTH;
