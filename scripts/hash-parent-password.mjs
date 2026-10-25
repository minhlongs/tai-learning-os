/**
 * Prints a `PARENT_PASSWORD_HASH` for a parent password, ready to paste into
 * `.dev.vars`.
 *
 * Local only. The password is passed as an argument so it never lands in a
 * shell history file via an interactive prompt's echo, and the hash is derived
 * with the same function the Worker verifies with — so a hash this script prints
 * is a hash the running app accepts. Nothing is stored, sent anywhere, or
 * logged beyond the printed line.
 *
 * Usage:
 *   node scripts/hash-parent-password.mjs 'your-password'
 */
import { hashPassword } from "../src/shared/crypto/password.ts";

const [password] = process.argv.slice(2);

if (!password) {
  console.error("usage: node scripts/hash-parent-password.mjs <password>");
  process.exit(1);
}

console.log(`PARENT_PASSWORD_HASH=${await hashPassword(password)}`);
