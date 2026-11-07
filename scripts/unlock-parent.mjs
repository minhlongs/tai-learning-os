/**
 * Clears persistent failed-login throttle records (`auth_throttles`) in local D1
 * so a parent who accidentally triggered the cooldown can immediately sign in
 * again without waiting for the time-bounded lockout window to expire.
 *
 * Local only. Requires physical/local CLI access to the machine hosting the D1
 * database. Records an audit event (`parent.throttle_unlocked_cli`) for full
 * provenance.
 *
 * Usage:
 *   npm run unlock:parent
 *   node scripts/unlock-parent.mjs
 */
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { getPlatformProxy } = await import("wrangler");

const proxy = await getPlatformProxy();

try {
  const countRow = await proxy.env.DB
    .prepare("SELECT COUNT(*) as total FROM auth_throttles")
    .first();
  const clearedCount = Number(countRow?.total ?? 0);

  await proxy.env.DB.prepare("DELETE FROM auth_throttles").run();
  await proxy.env.DB
    .prepare(
      "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      `aud-unlock-${Date.now()}`,
      "cli-operator",
      "parent.throttle_unlocked_cli",
      "auth_throttles",
      JSON.stringify({ clearedCount }),
      Date.now(),
    )
    .run();

  console.log(`unlocked parent auth throttles (${clearedCount} throttle record(s) cleared).`);
} catch (error) {
  console.error(`unlock failed: ${error instanceof Error ? error.message : String(error)}`);
  await proxy.dispose();
  process.exit(1);
}

await proxy.dispose();
