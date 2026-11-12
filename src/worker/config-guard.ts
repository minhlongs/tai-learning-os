/**
 * Configuration guard — fail closed on absent, weak, or unreadable secrets.
 *
 * The dispatch middleware already refused to serve when `SESSION_SECRET` was
 * absent, but it checked only for presence. This module makes the check a pure
 * function returning machine-stable problem codes, so it can be asserted on
 * directly instead of inferred from a blank 500.
 *
 * What "strong enough" can and cannot mean here:
 *
 * We can check the shape of a secret: that it exists, that it is long enough to
 * carry the entropy a signing key needs, and that it is not a repeated or
 * near-constant string. We cannot certify that it is random — entropy is a
 * property of the process that produced a string, not of the string itself. A
 * passphrase of six dictionary words measures well by every character statistic
 * and is still guessable by anyone who knows the phrase. These checks therefore
 * catch the realistic operational failure (a placeholder, an empty value, a
 * typed phrase, a truncated random key) and are documented as a floor, not as a
 * proof. Nothing in this file should be described as verifying randomness.
 *
 * The environment default is deliberately the strict one: an environment that
 * does not say it is development is treated as production. `ENVIRONMENT` is not
 * declared in `wrangler.jsonc` at all, so a deploy that forgets to set it gets
 * the production rules rather than the development bypass.
 */

import { PBKDF2_ITERATIONS } from "../shared/crypto/password";

export type ConfigEnv = {
  SESSION_SECRET?: string;
  PARENT_PASSWORD_HASH?: string;
  ENVIRONMENT?: string;
};

export type ConfigProblemCode =
  | "session_secret_missing"
  | "session_secret_too_short"
  | "session_secret_too_repetitive"
  | "parent_password_hash_missing"
  | "parent_password_hash_malformed"
  | "parent_password_hash_weak";

export type ConfigProblem = {
  /** Machine-stable code so a test can assert the specific failure. */
  code: ConfigProblemCode;
  /** Operator-facing message. Never contains a secret value. */
  message: string;
};

export type ConfigVerdict =
  | { ok: true }
  | { ok: false; problems: readonly ConfigProblem[] };

/**
 * An HMAC key shorter than the digest it signs adds nothing: 32 bytes is the
 * SHA-256 output size, and the signed value is derived from this key.
 */
export const MIN_SESSION_SECRET_BYTES = 32;

/**
 * Below this many distinct characters a long string is almost certainly a
 * padded placeholder (`aaaa…`, `0000…`) rather than generated output. A
 * base64url token over 32 random bytes has 43 characters and typically 25+
 * distinct symbols, so this floor does not reject real keys.
 */
const MIN_DISTINCT_CHARS = 8;

/**
 * Iteration counts below this are crackable in minutes on commodity hardware.
 * The project hashes at 600,000 and transparently upgrades older records, so a
 * supplied hash below this floor means someone hand-crafted it or used an
 * obsolete tool.
 */
const MIN_ACCEPTABLE_ITERATIONS = 100_000;

const HASH_PREFIX = "pbkdf2-sha256";

/** The one value that unlocks first-run parent creation. */
const DEVELOPMENT = "development";

function checkSessionSecret(secret: string | undefined): ConfigProblem | null {
  if (!secret) {
    return {
      code: "session_secret_missing",
      message: "SESSION_SECRET is not set; refusing to serve without a signing key.",
    };
  }
  // Measured in UTF-8 bytes: the signature is computed over bytes, and a
  // 16-character Vietnamese string is not 16 bytes of key material.
  const byteLength = new TextEncoder().encode(secret).byteLength;
  if (byteLength < MIN_SESSION_SECRET_BYTES) {
    return {
      code: "session_secret_too_short",
      message: `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_BYTES} bytes (got ${byteLength}).`,
    };
  }
  if (new Set(secret).size < MIN_DISTINCT_CHARS) {
    return {
      code: "session_secret_too_repetitive",
      message:
        "SESSION_SECRET uses too few distinct characters to be generated output; supply a CSPRNG value.",
    };
  }
  return null;
}

/**
 * Validates that `PARENT_PASSWORD_HASH`, when supplied, is structurally sound.
 *
 * Supplying this variable disables first-run parent creation, so logging in
 * against this record becomes the only way in. A malformed or weak record
 * therefore locks the operator out of the household database with no in-app
 * recovery path — worth refusing to serve over.
 */
function checkParentPasswordHash(
  hash: string | undefined,
  environment: string | undefined,
): ConfigProblem | null {
  if (!hash) {
    if (environment === DEVELOPMENT) {
      // First-run parent creation is the supported onboarding path on a fresh
      // local database, so absence is legitimate there and only there.
      return null;
    }
    return {
      code: "parent_password_hash_missing",
      message:
        "PARENT_PASSWORD_HASH is required outside development; without it the first visitor could claim the parent account.",
    };
  }
  if (!hash.startsWith(`${HASH_PREFIX}:`)) {
    return {
      code: "parent_password_hash_malformed",
      message: `PARENT_PASSWORD_HASH must use the ${HASH_PREFIX}:<iterations>$<salt>$<hash> format.`,
    };
  }
  const [iterationsPart, saltPart, digestPart] = hash.slice(HASH_PREFIX.length + 1).split("$");
  const iterations = Number.parseInt(iterationsPart ?? "", 10);
  if (!Number.isInteger(iterations) || iterations < 1) {
    return {
      code: "parent_password_hash_malformed",
      message: "PARENT_PASSWORD_HASH has an unreadable iteration count.",
    };
  }
  if (!saltPart || !digestPart) {
    return {
      code: "parent_password_hash_malformed",
      message: "PARENT_PASSWORD_HASH is missing its salt or digest segment.",
    };
  }
  if (iterations < MIN_ACCEPTABLE_ITERATIONS) {
    return {
      code: "parent_password_hash_weak",
      message: `PARENT_PASSWORD_HASH uses ${iterations} iterations; at least ${MIN_ACCEPTABLE_ITERATIONS} are required (regenerate with npm run hash:password, which uses ${PBKDF2_ITERATIONS}).`,
    };
  }
  return null;
}

/**
 * Pure check returning *every* problem, not just the first, so a single failure
 * reports the whole list instead of one item per restart.
 */
export function validateConfig(env: ConfigEnv): ConfigVerdict {
  const problems: ConfigProblem[] = [];

  const secretProblem = checkSessionSecret(env.SESSION_SECRET);
  if (secretProblem) problems.push(secretProblem);

  const hashProblem = checkParentPasswordHash(env.PARENT_PASSWORD_HASH, env.ENVIRONMENT);
  if (hashProblem) problems.push(hashProblem);

  return problems.length > 0 ? { ok: false, problems } : { ok: true };
}
