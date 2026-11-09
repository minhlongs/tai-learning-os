/**
 * Seeds the local D1 database from the shipped lesson registry (`npm run seed:demo`).
 *
 * The rules — what a valid lesson is, how a change is detected, how a step id
 * is derived, how a lesson is written — all live in
 * `test/integration/lesson-seed.ts`, because the integration suites seed the
 * same content and must not be able to disagree with this script about it. A
 * break in either caller fails both, which is the point.
 *
 * Opens the local D1 SQLite database directly via `node:sqlite` `DatabaseSync`
 * instead of spawning `workerd` via `getPlatformProxy()`.
 *
 * Usage:
 *   npm run seed:demo
 *   node scripts/seed-lessons.mjs [--target-root <dir>]
 *
 * Local only.
 */
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { seedLessons } = await import("../test/integration/lesson-seed.ts");

/**
 * Lightweight read-write D1Database adapter over Node's built-in `node:sqlite`
 * `DatabaseSync` for local CLI scripts (`seed-lessons`, `reset-local-d1`,
 * `reprovision-household-db`).
 */
export function createSqliteD1Adapter(rawDb) {
  function makeStatement(sql, boundValues = []) {
    return {
      bind(...values) {
        return makeStatement(sql, values);
      },
      async first(colName) {
        const stmt = rawDb.prepare(sql);
        const row = stmt.get(...boundValues);
        if (!row) return null;
        if (colName !== undefined) return row[colName] ?? null;
        return row;
      },
      async all() {
        const stmt = rawDb.prepare(sql);
        const results = stmt.all(...boundValues);
        return {
          results,
          success: true,
          meta: {
            duration: 0,
            size_after: 0,
            rows_read: results.length,
            rows_written: 0,
            last_row_id: 0,
            changed_db: false,
            changes: 0,
          },
        };
      },
      async run() {
        const stmt = rawDb.prepare(sql);
        const res = stmt.run(...boundValues);
        const changes = Number(res.changes ?? 0);
        return {
          results: [],
          success: true,
          meta: {
            duration: 0,
            size_after: 0,
            rows_read: 0,
            rows_written: changes,
            last_row_id: Number(res.lastInsertRowid ?? 0),
            changed_db: changes > 0,
            changes,
          },
        };
      },
      async raw() {
        return [];
      },
    };
  }

  return {
    prepare(sql) {
      return makeStatement(sql);
    },
    async batch(statements) {
      rawDb.exec("BEGIN IMMEDIATE;");
      try {
        const out = [];
        for (const stmt of statements) {
          out.push(await stmt.run());
        }
        rawDb.exec("COMMIT;");
        return out;
      } catch (error) {
        try {
          rawDb.exec("ROLLBACK;");
        } catch {
          // Ignore rollback error if transaction already closed.
        }
        throw error;
      }
    },
    async exec(sql) {
      rawDb.exec(sql);
      return { count: 1, duration: 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    withSession() {
      return this;
    },
  };
}

export function parseSeedLessonsCliArgs(argv) {
  let targetRoot = process.cwd();
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--target-root" && i + 1 < argv.length) {
      targetRoot = resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { targetRoot };
}

export async function runSeedLessonsOnRoot(targetRoot = process.cwd()) {
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
    return await seedLessons(db);
  } finally {
    rawDb.close();
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  const { targetRoot } = parseSeedLessonsCliArgs(process.argv.slice(2));
  try {
    const result = await runSeedLessonsOnRoot(targetRoot);
    console.log(
      `seeded: ${result.inserted} inserted, ${result.rewritten} content-changed, ${result.unchanged} unchanged`,
    );
  } catch (error) {
    console.error(`seed refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
