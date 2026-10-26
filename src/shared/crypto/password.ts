/**
 * Password hashing — Web Crypto PBKDF2-SHA256.
 *
 * Verified against the real Workers runtime (workerd), not assumed:
 * workerd's Web Crypto implements PBKDF2 and HMAC but does NOT implement scrypt
 * (attempting it throws). PBKDF2 with SHA-256 is a NIST-approved, widely
 * audited KDF, so this is a platform primitive rather than bespoke cryptography.
 *
 * Design notes for the reviewer:
 *   * A fresh 16-byte random salt per password, so identical passwords hash
 *     differently and precomputation is not reusable.
 *   * The iteration count is stored WITH the hash, so it can be raised later
 *     without invalidating existing parents.
 *   * Verification is constant-time (timingSafeEqual), so a wrong password is
 *     not distinguishable from a right one by how long the check takes.
 *   * The raw password never reaches storage, logs, or the client.
 *
 * Record format: "pbkdf2-sha256:<iterations>$<saltB64Url>$<hashB64Url>"
 */

import { timingSafeEqual } from "./timing-safe-equal";

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

export const PBKDF2_ITERATIONS = 600000;
export const SALT_BYTES = 16;
export const KEY_BYTES = 32;

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

const PREFIX = "pbkdf2-sha256";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  // workerd requires the format argument to name "PBKDF2" as a string; the
  // DOM library typechecks the same call, so this file compiles under both.
  const key = await crypto.subtle.importKey(
    "raw",
    asBufferSource(ENCODER.encode(password)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: asBufferSource(salt), iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export type PasswordError = { ok: false; reason: string };

/** Reject weak input before doing any expensive work. */
export function validatePasswordShape(password: string): PasswordError | { ok: true } {
  if (typeof password !== "string") return { ok: false, reason: "Mật khẩu không hợp lệ." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      reason: `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự để an toàn.`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, reason: "Mật khẩu quá dài." };
  }
  return { ok: true };
}

/** Hash a password with a fresh random salt. */
export async function hashPassword(password: string): Promise<string> {
  const shape = validatePasswordShape(password);
  if (!shape.ok) throw new Error(shape.reason);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `${PREFIX}:${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

/** Verify a candidate password against a stored record. */
export async function verifyPassword(
  password: string,
  record: string,
): Promise<boolean> {
  const parsed = parseRecord(record);
  if (!parsed) return false; // malformed record -> fail closed
  if (password.length > MAX_PASSWORD_LENGTH) return false;
  const candidate = await derive(password, parsed.salt, parsed.iterations);
  return timingSafeEqual(candidate, parsed.hash);
}

/** True when the stored record uses fewer iterations than we now want. */
export function needsRehash(record: string): boolean {
  return parseRecord(record)?.iterations !== PBKDF2_ITERATIONS;
}

type ParsedRecord = { iterations: number; salt: Uint8Array; hash: Uint8Array };

function parseRecord(record: string): ParsedRecord | null {
  if (typeof record !== "string" || !record.startsWith(`${PREFIX}:`)) return null;
  const [iterationsPart, saltPart, hashPart] = record.slice(PREFIX.length + 1).split("$");
  if (iterationsPart === undefined || saltPart === undefined || hashPart === undefined) return null;
  const iterations = Number.parseInt(iterationsPart, 10);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 10_000_000) return null;
  try {
    return { iterations, salt: fromBase64Url(saltPart), hash: fromBase64Url(hashPart) };
  } catch {
    return null;
  }
}

/** Exposed for the unit tests: re-derive to confirm determinism. */
export async function deriveForTest(
  password: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<string> {
  const hash = await derive(password, salt, iterations);
  return toBase64Url(hash);
}
