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
 * instead of spawning a local `workerd` runtime proxy.
 *
 * Usage:
 *   npm run seed:demo
 *   node scripts/seed-lessons.mjs [--target-root <dir>]
 *
 * Local only.
 */
import { createHash, createHmac } from "node:crypto";
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { seedLessons } = await import("../test/integration/lesson-seed.ts");

/**
 * Computes the deterministic SQLite filename that Miniflare v3 (`wrangler dev --local`)
 * creates inside `<persistDir>/d1/miniflare-D1DatabaseObject/` for a given
 * `preview_database_id` (or `database_id`).
 */
export function miniflareD1SqliteFilename(previewDatabaseId) {
  const key = createHash("sha256").update("miniflare-D1DatabaseObject").digest();
  const nameHmac = createHmac("sha256", key).update(previewDatabaseId).digest().subarray(0, 16);
  const hmac = createHmac("sha256", key).update(nameHmac).digest().subarray(0, 16);
  return `${Buffer.concat([nameHmac, hmac]).toString("hex")}.sqlite`;
}

/**
 * Splits a multi-statement SQL migration text into individual top-level SQL
 * statements while preserving semicolons inside `--` line comments, `/* ... *\/`
 * block comments, `'...'` string literals, and `CREATE TRIGGER ... BEGIN ... END;`
 * blocks. Leading comment lines on each statement are stripped.
 */
export function splitSqlStatements(sqlText) {
  const statements = [];
  let start = 0;
  let i = 0;
  let prevKeyword = "";
  let awaitingTriggerBegin = false;
  let blockDepth = 0;
  const n = sqlText.length;

  while (i < n) {
    const ch = sqlText[i];
    const next = sqlText[i + 1];

    // Single-line comment: -- ... \n
    if (ch === "-" && next === "-") {
      i += 2;
      while (i < n && sqlText[i] !== "\n") i += 1;
      continue;
    }

    // Block comment: /* ... */
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(sqlText[i] === "*" && sqlText[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    // Single-quoted string literal: '...' (with '' escape)
    if (ch === "'") {
      i += 1;
      while (i < n) {
        if (sqlText[i] === "'") {
          if (sqlText[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    // Double-quoted identifier: "..."
    if (ch === '"') {
      i += 1;
      while (i < n && sqlText[i] !== '"') i += 1;
      i += 1;
      continue;
    }

    // Track CREATE [TEMP|TEMPORARY] TRIGGER ... BEGIN ... [CASE ... END] ... END;
    if (/[A-Za-z_]/.test(ch)) {
      let wordEnd = i + 1;
      while (wordEnd < n && /[A-Za-z0-9_]/.test(sqlText[wordEnd])) wordEnd += 1;
      const word = sqlText.slice(i, wordEnd).toUpperCase();
      if (
        word === "TRIGGER" &&
        (prevKeyword === "CREATE" || prevKeyword === "TEMP" || prevKeyword === "TEMPORARY")
      ) {
        awaitingTriggerBegin = true;
      } else if (word === "BEGIN" && awaitingTriggerBegin) {
        awaitingTriggerBegin = false;
        blockDepth = 1;
      } else if (word === "CASE" && blockDepth > 0) {
        blockDepth += 1;
      } else if (word === "END" && blockDepth > 0) {
        blockDepth -= 1;
      }
      prevKeyword = word;
      i = wordEnd;
      continue;
    }

    if (ch === ";" && blockDepth === 0) {
      awaitingTriggerBegin = false;
      prevKeyword = "";
      const raw = sqlText.slice(start, i + 1);
      const cleaned = raw.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
      if (cleaned && cleaned !== ";") {
        statements.push(cleaned);
      }
      start = i + 1;
    }

    i += 1;
  }

  const tail = sqlText.slice(start).replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
  if (tail && tail !== ";") {
    statements.push(tail);
  }
  return statements;
}

/**
 * Lightweight read-write D1Database adapter over Node's built-in `node:sqlite`
 * `DatabaseSync` for local CLI scripts and isolated test harnesses.
 */
export function createSqliteD1Adapter(rawDb) {
  function makeStatement(sql, boundValues = []) {
    function runSync() {
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
    }

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
      runSync,
      async run() {
        return runSync();
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
          out.push(typeof stmt.runSync === "function" ? stmt.runSync() : await stmt.run());
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
