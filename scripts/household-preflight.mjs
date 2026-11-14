/**
 * Strictly read-only household database preflight check (`npm run household:preflight`).
 *
 * Opens the local household D1 SQLite file directly via `node:sqlite`
 * `DatabaseSync(..., { readOnly: true })`, checks `.dev.vars` key presence
 * (boolean flags only, never printing secret values), runs SQLite
 * `PRAGMA integrity_check` plus household isolation checks through a minimal
 * read-only D1 adapter, and reports how many active catalogue lessons the parent
 * has approved for the household learner.
 *
 * Writes nothing to D1 or disk and emits pure JSON on stdout.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const {
  inspectDevVarsText,
  inspectHouseholdPreflight,
} = await import("../src/worker/db/household-preflight.ts");

function forbidWriteOperation(methodName) {
  throw new Error(
    `Read-only preflight D1 adapter forbids ${methodName}() and all write/session operations.`,
  );
}

/**
 * Minimal read-only D1 adapter over `DatabaseSync(..., { readOnly: true })`
 * implementing only `.prepare()`, `.bind()`, `.first()`, and `.all()`.
 */
export function createReadOnlyD1Adapter(rawDb) {
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
        return forbidWriteOperation("run");
      },
      async raw() {
        return forbidWriteOperation("raw");
      },
    };
  }

  return {
    prepare(sql) {
      return makeStatement(sql);
    },
    async batch() {
      return forbidWriteOperation("batch");
    },
    async exec() {
      return forbidWriteOperation("exec");
    },
    async dump() {
      return forbidWriteOperation("dump");
    },
    withSession() {
      return forbidWriteOperation("withSession");
    },
  };
}

export function parsePreflightCliArgs(argv) {
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
      throw new Error(`Unknown flag for household:preflight: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for household:preflight: ${arg}`);
    }
  }
  return { targetRoot };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let targetRoot;
  try {
    ({ targetRoot } = parsePreflightCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(`preflight refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  const persistPath = join(targetRoot, ".wrangler", "state", "v3");
  const d1StateDir = join(persistPath, "d1", "miniflare-D1DatabaseObject");
  const devVarsPath = join(targetRoot, ".dev.vars");

  const devVarsRaw = existsSync(devVarsPath) ? readFileSync(devVarsPath, "utf8") : null;
  const devVars = inspectDevVarsText(devVarsRaw);

  const sqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (!existsSync(d1StateDir) || !sqliteFile) {
    console.error(
      `Household D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
    process.exit(1);
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true });
  let failure = null;
  try {
    const row = rawDb.prepare("PRAGMA integrity_check").get();
    const sqliteIntegrityCheck =
      String(row?.integrity_check ?? "unknown") === "ok" ? "ok" : "failed";
    const db = createReadOnlyD1Adapter(rawDb);
    const report = await inspectHouseholdPreflight(db, devVars, sqliteIntegrityCheck);
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    // A household database older than the shipped schema is a normal operator
    // state, not a crash: the check throws with the exact command that fixes
    // it. Report that sentence on stderr and exit 1, instead of letting an
    // uncaught error bury the instruction under a stack trace. Re-thrown after
    // the `finally` below has closed the read-only handle.
    failure = error;
  } finally {
    rawDb.close();
  }
  if (failure !== null) {
    console.error(
      `preflight refused: ${failure instanceof Error ? failure.message : String(failure)}`,
    );
    process.exit(1);
  }
}
