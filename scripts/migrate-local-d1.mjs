/**
 * Local D1 SQLite schema migration runner (`npm run db:migrate`).
 *
 * Replaces `wrangler d1 migrations apply tai-learning-os --local` with Node's
 * built-in `node:sqlite` (`DatabaseSync`) so applying or checking local
 * migrations never invokes Wrangler's `getPlatformProxy` / Miniflare Durable
 * Object wrapper, never writes `_cf_METADATA`, and never prints Wrangler
 * banners.
 *
 * Key invariants:
 *   1. Read-only fast path: When the local D1 SQLite file already exists, it is
 *      first inspected with `DatabaseSync(..., { readOnly: true })`. If every
 *      shipped migration (`migrations/0001_*.sql` .. `0014_*.sql`) is already
 *      recorded in `d1_migrations` and all schema protection triggers/indexes
 *      are present, the read-only handle is closed and the script returns
 *      immediately with zero disk writes (preserving `SHA-256`, `size`, and
 *      `mtimeMs` of the `.sqlite` file).
 *   2. Atomic per-migration execution: When unapplied migrations exist (or on a
 *      fresh database), each pending migration file is split with
 *      `splitSqlStatements` and applied inside an explicit `BEGIN IMMEDIATE` /
 *      `COMMIT` transaction alongside its `d1_migrations` record.
 *   3. Fail-closed verification: Verifies `audit_events_no_delete`,
 *      `audit_events_no_update`, `idx_attempts_learner_step_attempt`, and
 *      `MAX(version)` in `schema_versions` before returning.
 *
 * Usage:
 *   npm run db:migrate
 *   node scripts/migrate-local-d1.mjs [--target-root <dir>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { miniflareD1SqliteFilename, splitSqlStatements } from "./seed-lessons.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");
const DEFAULT_SQLITE_FILENAME = miniflareD1SqliteFilename("local-preview");

export function listShippedMigrationFiles(migrationsDir = MIGRATIONS_DIR) {
  return readdirSync(migrationsDir)
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort();
}

export function parseMigrateLocalD1CliArgs(argv) {
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
      throw new Error(`Unknown flag for db:migrate: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for db:migrate: ${arg}`);
    }
  }
  return { targetRoot };
}

function verifySchemaInvariants(rawDb) {
  const triggerRows = rawDb
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
    )
    .all();
  const triggers = triggerRows.map((row) => String(row.name));
  if (
    !triggers.includes("audit_events_no_delete") ||
    !triggers.includes("audit_events_no_update")
  ) {
    throw new Error(
      `Schema verification failed: missing audit_events immutability triggers (found: [${triggers.join(", ")}])`,
    );
  }

  const uniqueIndex = rawDb
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'learning_attempts' AND name = 'idx_attempts_learner_step_attempt'",
    )
    .get();
  if (!uniqueIndex) {
    throw new Error(
      "Schema verification failed: missing unique index idx_attempts_learner_step_attempt on learning_attempts",
    );
  }

  const versionRow = rawDb
    .prepare("SELECT MAX(version) AS max_version FROM schema_versions")
    .get();
  const schemaVersion = Number(versionRow?.max_version ?? 0);
  if (schemaVersion < 14) {
    throw new Error(
      `Schema verification failed: expected schema_versions >= 14, found ${String(versionRow?.max_version)}`,
    );
  }
  return schemaVersion;
}

function inspectAppliedMigrationsReadOnly(sqlitePath, migrationFiles) {
  const roDb = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const tableRow = roDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'd1_migrations'",
      )
      .get();
    if (!tableRow) {
      return null;
    }
    const appliedRows = roDb.prepare("SELECT name FROM d1_migrations ORDER BY id ASC").all();
    const appliedSet = new Set(appliedRows.map((row) => String(row.name)));
    const unapplied = migrationFiles.filter((file) => !appliedSet.has(file));
    if (unapplied.length > 0) {
      return null;
    }
    const schemaVersion = verifySchemaInvariants(roDb);
    return {
      ok: true,
      sqlitePath,
      applied: [],
      skippedCount: migrationFiles.length,
      schemaVersion,
    };
  } finally {
    roDb.close();
  }
}

export function runMigrateLocalD1OnRoot(targetRoot = process.cwd()) {
  const resolvedRoot = resolve(targetRoot);
  const d1StateDir = join(
    resolvedRoot,
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject",
  );
  const migrationFiles = listShippedMigrationFiles();

  const existingSqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (existingSqliteFile) {
    const existingSqlitePath = join(d1StateDir, existingSqliteFile);
    const fastPathResult = inspectAppliedMigrationsReadOnly(existingSqlitePath, migrationFiles);
    if (fastPathResult) {
      return fastPathResult;
    }
  }

  mkdirSync(d1StateDir, { recursive: true });
  const sqliteFile = existingSqliteFile ?? DEFAULT_SQLITE_FILENAME;
  const sqlitePath = join(d1StateDir, sqliteFile);

  const rawDb = new DatabaseSync(sqlitePath);
  try {
    rawDb.exec("PRAGMA foreign_keys = ON;");
    rawDb.exec("PRAGMA busy_timeout = 5000;");
    rawDb.exec("PRAGMA journal_mode = WAL;");
    rawDb.exec(
      `CREATE TABLE IF NOT EXISTS d1_migrations (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT UNIQUE,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
       );`,
    );

    const appliedRows = rawDb.prepare("SELECT name FROM d1_migrations ORDER BY id ASC").all();
    const appliedSet = new Set(appliedRows.map((row) => String(row.name)));

    const applied = [];
    let skippedCount = 0;
    const insertMigrationStmt = rawDb.prepare(
      "INSERT INTO d1_migrations (name) VALUES (?)",
    );

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        skippedCount += 1;
        continue;
      }

      const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const statements = splitSqlStatements(sqlText);

      rawDb.exec("BEGIN IMMEDIATE;");
      try {
        for (const stmt of statements) {
          rawDb.exec(stmt);
        }
        insertMigrationStmt.run(file);
        rawDb.exec("COMMIT;");
        applied.push(file);
      } catch (err) {
        rawDb.exec("ROLLBACK;");
        throw err;
      }
    }

    const schemaVersion = verifySchemaInvariants(rawDb);
    return {
      ok: true,
      sqlitePath,
      applied,
      skippedCount,
      schemaVersion,
    };
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
    const { targetRoot } = parseMigrateLocalD1CliArgs(process.argv.slice(2));
    const result = runMigrateLocalD1OnRoot(targetRoot);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`db:migrate failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
