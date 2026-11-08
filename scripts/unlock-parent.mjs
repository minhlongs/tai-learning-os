/**
 * Clears persistent failed-login throttle records (`auth_throttles`) in local D1
 * so a parent who accidentally triggered the cooldown can immediately sign in
 * again without waiting for the time-bounded lockout window to expire.
 *
 * Local only. Opens the local D1 SQLite database directly via `node:sqlite`
 * `DatabaseSync`, clears `auth_throttles`, and records an audit event
 * (`parent.throttle_unlocked_cli`) attributed to the household parent account
 * (`parent:<id>`, or `"system"` if no parent row exists yet) inside a
 * transaction.
 *
 * Usage:
 *   npm run unlock:parent
 *   node scripts/unlock-parent.mjs [--target-root <dir>]
 */
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

export function parseUnlockCliArgs(argv) {
  let targetRoot = process.cwd();
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--target-root" && i + 1 < argv.length) {
      targetRoot = resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { targetRoot };
}

/**
 * Atomically clears `auth_throttles` and records a `parent.throttle_unlocked_cli`
 * audit row attributed to `parent:<id>` (when a parent account exists) or `"system"`.
 */
export function unlockParentAuthThrottles(rawDb, now = Date.now()) {
  const countRow = rawDb.prepare("SELECT COUNT(*) AS total FROM auth_throttles").get();
  const clearedCount = Number(countRow?.total ?? 0);

  const parentRow = rawDb
    .prepare(
      `SELECT p.id
       FROM parents p
       LEFT JOIN learners l ON l.parent_id = p.id AND l.archived_at IS NULL
       ORDER BY (l.id IS NOT NULL) DESC, p.created_at ASC
       LIMIT 1`,
    )
    .get();

  const actor = parentRow?.id ? `parent:${String(parentRow.id)}` : "system";
  const auditEventId = `aud-unlock-${now}-${randomUUID().slice(0, 8)}`;

  rawDb.exec("BEGIN IMMEDIATE;");
  try {
    rawDb.prepare("DELETE FROM auth_throttles").run();
    rawDb
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        auditEventId,
        actor,
        "parent.throttle_unlocked_cli",
        "auth_throttles",
        JSON.stringify({ clearedCount }),
        now,
      );
    rawDb.exec("COMMIT;");
  } catch (error) {
    try {
      rawDb.exec("ROLLBACK;");
    } catch {
      // Ignore rollback error if transaction already closed.
    }
    throw error;
  }

  return {
    clearedCount,
    actor,
    auditEventId,
  };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  const { targetRoot } = parseUnlockCliArgs(process.argv.slice(2));
  const d1StateDir = join(
    targetRoot,
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject",
  );
  const sqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (!existsSync(d1StateDir) || !sqliteFile) {
    console.error(
      `unlock refused: local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
    process.exit(1);
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile));
  try {
    rawDb.exec("PRAGMA foreign_keys = ON;");
    const { clearedCount } = unlockParentAuthThrottles(rawDb);
    console.log(`unlocked parent auth throttles (${clearedCount} throttle record(s) cleared).`);
  } catch (error) {
    console.error(`unlock failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rawDb.close();
  }
}
