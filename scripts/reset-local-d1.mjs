/**
 * Local dev user-data reset script (`npm run db:reset-data`).
 *
 * Opens the local D1 SQLite database directly via `node:sqlite` `DatabaseSync`
 * and runs `resetUserData` so it never imports `test/integration/test-db.ts`,
 * never drops tables/triggers/migrations, and preserves the curriculum
 * catalogue (`subjects`, `skills`, `skill_prerequisites`,
 * `curriculum_objectives`, `schema_versions`, `d1_migrations`).
 *
 * Refuses to run when `audit_events` contains immutable rows and directs the
 * operator to `npm run db:reprovision-household`.
 *
 * Usage:
 *   npm run db:reset-data
 *   node scripts/reset-local-d1.mjs [--target-root <dir>]
 */
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";
import { createSqliteD1Adapter } from "./seed-lessons.mjs";

registerTsSpecifiers();

const { resetUserData } = await import("../src/worker/db/reset-user-data.ts");

export function parseResetLocalD1CliArgs(argv) {
  let targetRoot = process.cwd();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target-root") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --target-root");
      }
      targetRoot = resolve(next);
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag for db:reset-data: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for db:reset-data: ${arg}`);
    }
  }
  return { targetRoot };
}

export async function runResetLocalD1OnRoot(targetRoot = process.cwd()) {
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
    throw new Error(
      `local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate" first.`,
    );
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile));
  try {
    rawDb.exec("PRAGMA foreign_keys = ON;");
    rawDb.exec("PRAGMA busy_timeout = 5000;");
    const db = createSqliteD1Adapter(rawDb);
    await resetUserData(db);
  } finally {
    rawDb.close();
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  try {
    const { targetRoot } = parseResetLocalD1CliArgs(process.argv.slice(2));
    await runResetLocalD1OnRoot(targetRoot);
    console.log("reset local D1 user data (curriculum catalogue preserved).");
  } catch (error) {
    console.error(`reset refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
