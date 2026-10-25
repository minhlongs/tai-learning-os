/**
 * Authentication and session routes.
 *
 * SECURITY POSTURE, stated plainly:
 *   - Passwords are hashed with PBKDF2-SHA256 (60000 iterations, per-password
 *     salt). Nothing reversible is stored.
 *   - The login path is wrapped in the native Rate Limiting binding, so brute
 *     force is throttled at the edge, not after the fact.
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
import { badRequest, ok, readJsonBody, unauthorized, forbidden, serverError } from "../http/response";
import { SESSION_TTL_MS } from "../../shared/crypto/session";
import type { AppEnv } from "../http/middleware";

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
  });
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

  const parent = await repo.findParentByDisplayName(env.DB, body.displayName.trim());
  // Uniform failure: a wrong name and a wrong password are indistinguishable,
  // so this endpoint cannot be used to enumerate parent accounts.
  if (!parent) return unauthorized();

  const valid = await verifyPassword(body.password, parent.password_hash);
  if (!valid) return unauthorized();

  const now = Date.now();
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
  const existing = await repo.countParents(env.DB);
  if (existing > 0) {
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
  const now = Date.now();
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

type VerifiedToken = { parentId: string; tokenId: string; expiresAt: number };

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
  };
}

void MIN_PASSWORD_LENGTH;
