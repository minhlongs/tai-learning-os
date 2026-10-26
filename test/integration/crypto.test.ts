import { describe, expect, it } from "vitest";

import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PBKDF2_ITERATIONS,
  deriveForTest,
  hashPassword,
  needsRehash,
  validatePasswordShape,
  verifyPassword,
} from "../../src/shared/crypto/password";
import {
  CLEARED_SESSION_COOKIE,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSessionToken,
  csrfTokenFor,
  sessionCookie,
  verifyCsrfToken,
  verifySessionToken,
} from "../../src/shared/crypto/session";

/**
 * These run in the workers pool (`test/integration/`) rather than the node
 * unit suite because the modules under test call `btoa`, `atob` and
 * `crypto.subtle` directly, and workerd is the runtime the password and
 * session formats are actually stored and verified in.
 */

const SECRET = "unit-test-secret-not-real-key-0123456789";
const PASSWORD = "MatKhauBiMat2024";
const NOW = 1_700_000_000_000;

function encodeB64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeB64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
}

/** Token layout: base64url("parentId.displayName.issuedAt.expiresAt.tokenId") + "." + signature. */
function splitToken(token: string): { fields: string[]; signature: string } {
  const [payload, signature] = token.split(".");
  return { fields: decodeB64Url(payload!).split("."), signature: signature! };
}

function rebuildToken(fields: string[], signature: string): string {
  return `${encodeB64Url(fields.join("."))}.${signature}`;
}

describe("hashPassword / verifyPassword", () => {
  it("verifies a correct password", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, record)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword("MatKhauBiMat2025", record)).toBe(false);
  });

  it("rejects an empty password against a real record", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword("", record)).toBe(false);
  });

  it("rejects a password that differs only by case", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD.toLowerCase(), record)).toBe(false);
  });

  it("uses a fresh random salt so identical passwords produce different records", async () => {
    const a = await hashPassword(PASSWORD);
    const b = await hashPassword(PASSWORD);
    expect(a).not.toBe(b);
    expect(await verifyPassword(PASSWORD, a)).toBe(true);
    expect(await verifyPassword(PASSWORD, b)).toBe(true);
  });

  it("stores algorithm, iteration count, salt and hash, but never the password", async () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    const record = await hashPassword(PASSWORD);
    expect(record.startsWith(`pbkdf2-sha256:${PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(record.split("$")).toHaveLength(3);
    expect(record.includes(PASSWORD)).toBe(false);
  });

  it("is deterministic for a known salt and iteration count", async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await deriveForTest(PASSWORD, salt, 1000);
    const b = await deriveForTest(PASSWORD, salt, 1000);
    expect(a).toBe(b);
    expect(await deriveForTest(PASSWORD, salt, 1001)).not.toBe(a);
  });

  it("returns false for a password above the maximum length without hashing it", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword("x".repeat(MAX_PASSWORD_LENGTH + 1), record)).toBe(false);
  });
});

describe("password shape validation", () => {
  it("refuses to hash a password below the minimum length", async () => {
    await expect(hashPassword("x".repeat(MIN_PASSWORD_LENGTH - 1))).rejects.toThrow();
  });

  it("accepts a password at exactly the minimum length", async () => {
    await expect(hashPassword("x".repeat(MIN_PASSWORD_LENGTH))).resolves.toContain("pbkdf2-sha256:");
  });

  it("refuses to hash a password above the maximum length", async () => {
    await expect(hashPassword("x".repeat(MAX_PASSWORD_LENGTH + 1))).rejects.toThrow();
  });

  it("reports a Vietnamese reason for a short password", () => {
    const result = validatePasswordShape("short");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0);
  });

  it("accepts a password inside the allowed range", () => {
    expect(validatePasswordShape(PASSWORD).ok).toBe(true);
  });
});

describe("verifyPassword - malformed records fail closed", () => {
  it("returns false for an empty record", async () => {
    expect(await verifyPassword(PASSWORD, "")).toBe(false);
  });

  it("returns false for a record with the wrong algorithm prefix", async () => {
    const record = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, record.replace("pbkdf2-sha256", "scrypt"))).toBe(false);
  });

  it("returns false for a record with too few fields", async () => {
    expect(await verifyPassword(PASSWORD, "pbkdf2-sha256:60000$onlysalt")).toBe(false);
  });

  it("returns false when the iteration count is not a number", async () => {
    expect(await verifyPassword(PASSWORD, "pbkdf2-sha256:abc$c2FsdA$aGFzaA")).toBe(false);
  });

  it("returns false for an iteration count of zero or an absurdly large one", async () => {
    expect(await verifyPassword(PASSWORD, "pbkdf2-sha256:0$c2FsdA$aGFzaA")).toBe(false);
    expect(await verifyPassword(PASSWORD, "pbkdf2-sha256:99999999999$c2FsdA$aGFzaA")).toBe(false);
  });

  it("returns false rather than throwing when the salt is not valid base64", async () => {
    await expect(verifyPassword(PASSWORD, "pbkdf2-sha256:60000$***$aGFzaA")).resolves.toBe(false);
  });

  it("does not throw on any malformed shape", async () => {
    for (const broken of ["", "$", "$$$$", "x", ":::", "pbkdf2-sha256:", "pbkdf2-sha256:$$"]) {
      await expect(verifyPassword(PASSWORD, broken)).resolves.toBe(false);
    }
  });
});

describe("needsRehash", () => {
  it("is false for a fresh hash", async () => {
    expect(needsRehash(await hashPassword(PASSWORD))).toBe(false);
  });

  it("is true for a record with a lower iteration count", () => {
    expect(needsRehash("pbkdf2-sha256:1000$c2FsdHNhbHQ$aGFzaGhhc2g")).toBe(true);
  });

  it("is true for a record with a higher iteration count, because it is not the current policy", () => {
    expect(needsRehash(`pbkdf2-sha256:${PBKDF2_ITERATIONS + 1}$c2FsdHNhbHQ$aGFzaGhhc2g`)).toBe(true);
  });

  it("is true for an unknown algorithm and for unparsable or empty records", () => {
    expect(needsRehash("scrypt:60000$c2FsdA$aGFzaA")).toBe(true);
    expect(needsRehash("garbage")).toBe(true);
    expect(needsRehash("")).toBe(true);
  });
});

describe("session tokens", () => {
  it("round-trips a valid token", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const result = await verifySessionToken(SECRET, token, NOW + 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.claims.parentId).toBe("par-0001");
    expect(result.claims.parentDisplayName).toBe("Mẹ Lan");
    expect(result.claims.issuedAt).toBe(NOW);
    expect(result.claims.expiresAt).toBe(NOW + SESSION_TTL_MS);
    expect(result.claims.tokenId.length).toBeGreaterThan(0);
  });

  it("round-trips ids and names that contain the field separator", async () => {
    const token = await createSessionToken(SECRET, "par.0001", "Cô Hoa.", NOW);
    const result = await verifySessionToken(SECRET, token, NOW + 1000);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.claims.parentId).toBe("par.0001");
    expect(result.claims.parentDisplayName).toBe("Cô Hoa.");
  });

  it("rejects a tampered parent id with bad_signature", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const { fields, signature } = splitToken(token);
    fields[0] = "par-9999";
    expect(await verifySessionToken(SECRET, rebuildToken(fields, signature), NOW + 1000)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects a tampered display name with bad_signature", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const { fields, signature } = splitToken(token);
    fields[1] = "Admin";
    const result = await verifySessionToken(SECRET, rebuildToken(fields, signature), NOW + 1000);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects an extended expiry with bad_signature", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const { fields, signature } = splitToken(token);
    fields[3] = String(NOW + 365 * 24 * 3600 * 1000);
    const result = await verifySessionToken(SECRET, rebuildToken(fields, signature), NOW + 1000);
    expect(result).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken("some-other-secret-value-0123456789", "par-0001", "Mẹ Lan", NOW);
    expect(await verifySessionToken(SECRET, token, NOW + 1000)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("rejects a token whose signature has been altered", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const { fields, signature } = splitToken(token);
    const flipped = (signature[0] === "A" ? "B" : "A") + signature.slice(1);
    const result = await verifySessionToken(SECRET, rebuildToken(fields, flipped), NOW + 1000);
    expect(result.ok).toBe(false);
  });

  it("rejects an expired token with the expired reason", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    expect(await verifySessionToken(SECRET, token, NOW + SESSION_TTL_MS + 1000)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("treats the exact expiry instant as expired and the instant before as valid", async () => {
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    expect((await verifySessionToken(SECRET, token, NOW + SESSION_TTL_MS - 1)).ok).toBe(true);
    expect(await verifySessionToken(SECRET, token, NOW + SESSION_TTL_MS)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects tokens with no separator, an empty token, and an empty signature as malformed", async () => {
    expect(await verifySessionToken(SECRET, "noseparator", NOW)).toEqual({ ok: false, reason: "malformed" });
    expect(await verifySessionToken(SECRET, "", NOW)).toEqual({ ok: false, reason: "malformed" });
    expect(await verifySessionToken(SECRET, "abc.", NOW)).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a payload with the wrong number of fields as malformed", async () => {
    const result = await verifySessionToken(SECRET, `${encodeB64Url("a.b.c")}.${encodeB64Url("sig")}`, NOW);
    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a payload with non-numeric timestamps as malformed", async () => {
    const payload = encodeB64Url("par-0001.Name.notanumber.alsonot.tok");
    expect(await verifySessionToken(SECRET, `${payload}.${encodeB64Url("sig")}`, NOW)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects a payload whose expiry is not after its issue time as malformed", async () => {
    const payload = encodeB64Url(`par-0001.Name.${NOW}.${NOW}.tok`);
    expect(await verifySessionToken(SECRET, `${payload}.${encodeB64Url("sig")}`, NOW - 1)).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("does not throw when the signature segment is not valid base64url", async () => {
    // A garbage signature must be a well-formed failure, never an exception
    // that would surface as a 500 from the auth middleware.
    const token = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    const { fields } = splitToken(token);
    const result = await verifySessionToken(SECRET, rebuildToken(fields, "***not*base64***"), NOW + 1000).catch(
      (error: unknown) => ({ threw: String(error) }),
    );
    expect(result).not.toHaveProperty("threw");
    expect(result).toMatchObject({ ok: false });
  });

  it("mints a distinct token id for each token", async () => {
    const a = await verifySessionToken(SECRET, await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW), NOW);
    const b = await verifySessionToken(SECRET, await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW), NOW);
    if (!a.ok || !b.ok) throw new Error("expected ok");
    expect(a.claims.tokenId).not.toBe(b.claims.tokenId);
  });
});

describe("csrf tokens", () => {
  it("round-trips for the token id it was minted for", async () => {
    const csrf = await csrfTokenFor(SECRET, "tok-1");
    expect(await verifyCsrfToken(SECRET, "tok-1", csrf)).toBe(true);
  });

  it("is deterministic for the same secret and token id", async () => {
    expect(await csrfTokenFor(SECRET, "tok-1")).toBe(await csrfTokenFor(SECRET, "tok-1"));
  });

  it("rejects a candidate minted for a different session", async () => {
    const csrf = await csrfTokenFor(SECRET, "tok-1");
    expect(await verifyCsrfToken(SECRET, "tok-2", csrf)).toBe(false);
  });

  it("rejects a candidate minted with a different secret", async () => {
    const csrf = await csrfTokenFor("other-secret-0123456789abcdef", "tok-1");
    expect(await verifyCsrfToken(SECRET, "tok-1", csrf)).toBe(false);
  });

  it("rejects an empty or altered candidate", async () => {
    const csrf = await csrfTokenFor(SECRET, "tok-1");
    expect(await verifyCsrfToken(SECRET, "tok-1", "")).toBe(false);
    expect(await verifyCsrfToken(SECRET, "tok-1", `${csrf}x`)).toBe(false);
  });

  it("does not throw when the candidate is not valid base64url", async () => {
    await expect(verifyCsrfToken(SECRET, "tok-1", "***")).resolves.toBe(false);
  });

  it("is not interchangeable with the session signature for the same input", async () => {
    // The csrf key is domain-separated ("csrf:" prefix), so a csrf token can
    // never double as a session signature.
    const csrf = await csrfTokenFor(SECRET, "tok-1");
    const session = await createSessionToken(SECRET, "par-0001", "Mẹ Lan", NOW);
    expect(session.endsWith(csrf)).toBe(false);
  });
});

describe("session cookie", () => {
  const EXPIRES = Date.now() + 60_000;

  it("sets HttpOnly, SameSite=Strict and a path", () => {
    const cookie = sessionCookie("abc", EXPIRES, false);
    expect(cookie.startsWith(`${SESSION_COOKIE_NAME}=abc`)).toBe(true);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Path=/");
  });

  it("adds Secure only when asked, so http://localhost login keeps working", () => {
    expect(sessionCookie("abc", EXPIRES, true)).toContain("Secure");
    expect(sessionCookie("abc", EXPIRES, false)).not.toContain("Secure");
  });

  it("never emits a negative Max-Age for an already-expired session", () => {
    expect(sessionCookie("abc", Date.now() - 10_000, false)).toContain("Max-Age=0");
  });

  it("provides a cleared cookie that expires immediately", () => {
    expect(CLEARED_SESSION_COOKIE).toContain("Max-Age=0");
    expect(CLEARED_SESSION_COOKIE.startsWith(`${SESSION_COOKIE_NAME}=;`)).toBe(true);
  });
});
