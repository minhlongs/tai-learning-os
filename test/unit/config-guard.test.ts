import { describe, expect, it } from "vitest";
import {
  MIN_SESSION_SECRET_BYTES,
  validateConfig,
  type ConfigProblemCode,
} from "../../src/worker/config-guard";

/**
 * The config guard is the only thing standing between a misconfigured Worker
 * and an unprotected household database, so it is tested directly rather than
 * through a blank 500 response.
 *
 * Every secret used here is a literal placeholder chosen to sit on one side of a
 * documented threshold. None of them is, or is derived from, a real credential.
 */

/** 43 characters, 25+ distinct — the shape the documented generator emits. */
const VALID_SECRET = "Zm9vYmFyYmF6cXV1eGNvcmdlZ3JhdWx0Z2FycGx5aA";
/** The project hashes at 600,000; any value at or above the 100,000 floor is accepted. */
const VALID_HASH = "pbkdf2-sha256:600000$c2FsdHNhbHRzYWx0c2FsdA$ZGlnZXN0ZGlnZXN0ZGlnZXN0";

/**
 * Returns problem codes for `env`, defaulting `ENVIRONMENT` to `development` so
 * each case exercises one concern. The production-only rules are asserted
 * explicitly by the tests that care about them.
 */
const codesFor = (env: Parameters<typeof validateConfig>[0]): ConfigProblemCode[] => {
  const verdict = validateConfig({ ENVIRONMENT: "development", ...env });
  return verdict.ok ? [] : verdict.problems.map((problem) => problem.code);
};

describe("validateConfig — SESSION_SECRET", () => {
  it("refuses to serve when SESSION_SECRET is absent, in any environment", () => {
    expect(codesFor({ PARENT_PASSWORD_HASH: VALID_HASH })).toEqual(["session_secret_missing"]);
    expect(
      codesFor({ PARENT_PASSWORD_HASH: VALID_HASH, ENVIRONMENT: "production" }),
    ).toEqual(["session_secret_missing"]);
  });

  it("refuses a secret shorter than the 32-byte digest it signs", () => {
    expect(codesFor({ SESSION_SECRET: "a".repeat(MIN_SESSION_SECRET_BYTES - 1) })).toEqual([
      "session_secret_too_short",
    ]);
  });

  it("measures length in UTF-8 bytes, not characters", () => {
    // 20 codepoints, 26 bytes: a character-count rule would call this 20 and a
    // byte-count rule calls it 26 — both under the floor, so use a string that
    // separates the two rules. 24 codepoints of 2-byte Vietnamese is 48 bytes,
    // comfortably past the 32-byte floor, while its 24 characters would fail a
    // naive character count.
    const vietnamese = "mậtkhẩubímmậtchobéyeuquý";
    const byteLength = new TextEncoder().encode(vietnamese).byteLength;
    expect(vietnamese.length).toBeLessThan(MIN_SESSION_SECRET_BYTES);
    expect(byteLength).toBeGreaterThanOrEqual(MIN_SESSION_SECRET_BYTES);
    expect(validateConfig({ SESSION_SECRET: vietnamese, ENVIRONMENT: "development" }).ok).toBe(
      true,
    );
  });

  it("accepts the shipped documented generator output", () => {
    expect(validateConfig({ SESSION_SECRET: VALID_SECRET, ENVIRONMENT: "development" }).ok).toBe(
      true,
    );
  });

  it("refuses a long but near-constant string", () => {
    // 40 characters, one distinct symbol: passes any length rule, carries no
    // key material. This is the placeholder shape the check exists to catch.
    expect(codesFor({ SESSION_SECRET: "a".repeat(40) })).toEqual([
      "session_secret_too_repetitive",
    ]);
  });
});

describe("validateConfig — PARENT_PASSWORD_HASH", () => {
  it("permits absence in development, where first-run creation is the onboarding path", () => {
    expect(validateConfig({ SESSION_SECRET: VALID_SECRET, ENVIRONMENT: "development" }).ok).toBe(
      true,
    );
  });

  it("requires the hash outside development", () => {
    // The default is production: an environment that does not say it is
    // development gets the strict rules, so a deploy cannot inherit the bypass.
    expect(codesFor({ SESSION_SECRET: VALID_SECRET, ENVIRONMENT: undefined })).toEqual([
      "parent_password_hash_missing",
    ]);
    expect(codesFor({ SESSION_SECRET: VALID_SECRET, ENVIRONMENT: "production" })).toEqual([
      "parent_password_hash_missing",
    ]);
  });

  it("refuses a hash that is not in the pbkdf2-sha256 record format", () => {
    expect(
      codesFor({ SESSION_SECRET: VALID_SECRET, PARENT_PASSWORD_HASH: "plaintext-password" }),
    ).toEqual(["parent_password_hash_malformed"]);
  });

  it("refuses a hash with an unreadable iteration count", () => {
    expect(
      codesFor({
        SESSION_SECRET: VALID_SECRET,
        PARENT_PASSWORD_HASH: "pbkdf2-sha256:notanumber$c2FsdA$ZGlnZXN0",
      }),
    ).toEqual(["parent_password_hash_malformed"]);
  });

  it("refuses a hash missing its salt or digest segment", () => {
    expect(
      codesFor({
        SESSION_SECRET: VALID_SECRET,
        PARENT_PASSWORD_HASH: "pbkdf2-sha256:600000$c2FsdA",
      }),
    ).toEqual(["parent_password_hash_malformed"]);
  });

  it("refuses an iteration count below the floor — the weak-hash case, not the malformed one", () => {
    expect(
      codesFor({
        SESSION_SECRET: VALID_SECRET,
        PARENT_PASSWORD_HASH: "pbkdf2-sha256:1000$c2FsdA$ZGlnZXN0",
      }),
    ).toEqual(["parent_password_hash_weak"]);
  });
});

describe("validateConfig — aggregate behaviour", () => {
  it("reports every problem at once rather than one per restart", () => {
    const codes = codesFor({ PARENT_PASSWORD_HASH: "junk" });
    expect(codes).toEqual(["session_secret_missing", "parent_password_hash_malformed"]);
  });

  it("passes a fully formed production configuration", () => {
    expect(
      validateConfig({
        SESSION_SECRET: VALID_SECRET,
        PARENT_PASSWORD_HASH: VALID_HASH,
        ENVIRONMENT: "production",
      }).ok,
    ).toBe(true);
  });

  it("never echoes a supplied value back in a problem message", () => {
    const secret = "leaky-value-should-not-appear-anywhere";
    const verdict = validateConfig({
      SESSION_SECRET: secret,
      PARENT_PASSWORD_HASH: "another-leaky-value",
    });
    expect(verdict.ok).toBe(false);
    if (verdict.ok) return;
    const rendered = verdict.problems.map((problem) => problem.message).join(" ");
    expect(rendered).not.toContain(secret);
    expect(rendered).not.toContain("another-leaky-value");
  });
});
