/**
 * Parent session tokens.
 *
 * A stateless, HMAC-SHA256-signed token held in an HttpOnly cookie. The
 * signature covers parent id, issued-at and expiry, so a modified id or expiry
 * invalidates the token.
 *
 * Why HMAC and not a custom construction: it is a platform primitive
 * (`crypto.subtle.sign("HMAC")`), audited, and constant-time on verify.
 *
 * Scope note: this authenticates the PARENT. The learner is a record the parent
 * owns, not an authenticated identity — the MVP has no learner login. That is a
 * deliberate child-safety choice, not an omission.
 */

const ENCODER = new TextEncoder();

/**
 * Web Crypto's `BufferSource` accepts only a view backed by a plain
 * `ArrayBuffer`. TypeScript 6 distinguishes that from a `Uint8Array` whose
 * backing buffer might be shared or offset, so bytes handed to `crypto.subtle`
 * are copied through this helper rather than hoping the types line up.
 */
function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

/** Session lifetime. Deliberately short; the parent re-logs rather than stays logged in. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = "tlo_session";
export const CSRF_HEADER_NAME = "x-tlo-csrf";

export type SessionMode = "parent" | "learner";

export type SessionClaims = {
  parentId: string;
  /** Display name, carried so the UI can greet without an extra round trip. */
  parentDisplayName: string;
  issuedAt: number;
  expiresAt: number;
  /** Token id, so a token can be described in audit events without a secret. */
  tokenId: string;
  /** Privilege mode: "parent" unlocks /api/parent/* and /api/data/*; "learner" restricts to /api/learner/*. */
  mode?: SessionMode;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    asBufferSource(ENCODER.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Serialize claims for signing. Fields are joined with a separator that is
 * percent-escaped first, so a parent id or display name containing a separator
 * cannot forge a boundary and swap fields.
 */
const FIELD_SEP = ".";
const ESCAPED_SEP = "%2E";

function claimsToBytes(claims: SessionClaims): Uint8Array {
  const baseFields = [
    claims.parentId,
    claims.parentDisplayName,
    String(claims.issuedAt),
    String(claims.expiresAt),
    claims.tokenId,
  ];
  if (claims.mode === "learner") {
    baseFields.push("learner");
  }
  const fields = baseFields.map((field) => field.split(FIELD_SEP).join(ESCAPED_SEP));
  return ENCODER.encode(fields.join(FIELD_SEP));
}

/** Create a signed session token. `secret` comes from env, never from code. */
export async function createSessionToken(
  secret: string,
  parentId: string,
  displayName: string,
  nowMs: number,
  mode: SessionMode = "parent",
): Promise<string> {
  const issuedAt = nowMs;
  const expiresAt = nowMs + SESSION_TTL_MS;
  const tokenId = crypto.randomUUID();
  const claims: SessionClaims = {
    parentId,
    parentDisplayName: displayName,
    issuedAt,
    expiresAt,
    tokenId,
    mode,
  };
  const key = await hmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, asBufferSource(claimsToBytes(claims))),
  );
  const payload = `${toBase64Url(claimsToBytes(claims))}.${toBase64Url(signature)}`;
  return payload;
}

export type VerifyResult =
  | { ok: true; claims: SessionClaims }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

/**
 * Verify a token. Checks the signature FIRST, then expiry, so an expired but
 * correctly-signed token is still a well-formed failure the caller can report.
 */
export async function verifySessionToken(
  secret: string,
  token: string,
  nowMs: number,
): Promise<VerifyResult> {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return { ok: false, reason: "malformed" };

  const claims = decodeClaims(payloadPart);
  if (!claims) return { ok: false, reason: "malformed" };

  const key = await hmacKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, asBufferSource(claimsToBytes(claims))),
  );
  const actual = tryFromBase64Url(signaturePart);
  if (!actual || actual.length !== expected.length) {
    return { ok: false, reason: "bad_signature" };
  }

  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
  }
  if (diff !== 0) return { ok: false, reason: "bad_signature" };

  if (claims.expiresAt <= nowMs) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}

function decodeClaims(payloadPart: string): SessionClaims | null {
  const bytes = tryFromBase64Url(payloadPart);
  if (!bytes) return null;
  try {
    const raw = new TextDecoder().decode(bytes);
    const parts = raw.split(FIELD_SEP);
    if (parts.length !== 5 && parts.length !== 6) return null;
    const parentId = parts[0]!;
    const parentDisplayName = parts[1]!;
    const issuedAt = parts[2]!;
    const expiresAt = parts[3]!;
    const tokenId = parts[4]!;
    const modePart = parts[5];
    if (parts.length === 6 && modePart !== "learner") return null;
    const issued = Number.parseInt(issuedAt, 10);
    const expires = Number.parseInt(expiresAt, 10);
    if (!Number.isFinite(issued) || !Number.isFinite(expires)) return null;
    if (expires <= issued) return null;
    return {
      parentId: unescapeField(parentId),
      parentDisplayName: unescapeField(parentDisplayName),
      issuedAt: issued,
      expiresAt: expires,
      tokenId,
      mode: modePart === "learner" ? "learner" : "parent",
    };
  } catch {
    return null;
  }
}

function unescapeField(value: string): string {
  return value.split(ESCAPED_SEP).join(FIELD_SEP);
}

/**
 * Decode base64url into bytes, or null when the input is not valid base64.
 *
 * `atob` THROWS on malformed input, so this must be wrapped: a tampered cookie
 * is attacker-controlled input, and an unhandled DOMException here would
 * surface as a 500 from the auth middleware rather than the 401 the caller
 * expects. Every decode of untrusted bytes goes through this function.
 */
function tryFromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/** Decode bytes that are known-valid (we produced them via `toBase64Url`). */
/**
 * The CSRF token is bound to the session token id. Because the app is
 * same-origin (SPA served by the same Worker), this double-submit pattern is
 * proportionate; the cookie is also SameSite=Strict, which is the primary
 * defense.
 */
export async function csrfTokenFor(secret: string, tokenId: string): Promise<string> {
  const key = await hmacKey(`csrf:${secret}`);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, asBufferSource(ENCODER.encode(tokenId))),
  );
  return toBase64Url(signature);
}

export async function verifyCsrfToken(
  secret: string,
  tokenId: string,
  candidate: string,
): Promise<boolean> {
  const key = await hmacKey(`csrf:${secret}`);
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, asBufferSource(ENCODER.encode(tokenId))),
  );
  const actual = tryFromBase64Url(candidate);
  if (!actual || actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
  }
  return diff === 0;
}

/** Cookie header value. Flags chosen for a child-safety product. */
export function sessionCookie(token: string, expiresAt: number, secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    // Strict: the app makes no cross-site requests at all.
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))}`,
  ];
  // Never set Secure on http://localhost: the cookie would be dropped and the
  // parent could not log in during local development.
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export const CLEARED_SESSION_COOKIE =
  `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
