/**
 * Constant-time byte comparison.
 *
 * Why not `a === b`: early-exit comparison leaks, through timing, how many
 * leading bytes matched. For password verification and session-token
 * verification that difference is enough to mount a byte-at-a-time attack.
 *
 * This implementation is length-constant for equal-length inputs and does not
 * branch on the data. It is short and used in exactly two places so it can be
 * reviewed as a unit.
 */

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    // `?? 0` keeps noUncheckedIndexedAccess satisfied without a branch.
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}
