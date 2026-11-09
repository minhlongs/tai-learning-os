/**
 * Archives the existing local household D1 database and reprovisions a 100% clean
 * household D1 database (`npm run db:reprovision-household`).
 *
 * Why this exists:
 *   `audit_events` is append-only by schema-level `BEFORE DELETE` and `BEFORE UPDATE`
 *   triggers (`0004_evidence_integrity.sql`). When historical E2E or pilot runs
 *   polluted the local `.wrangler/state` D1 database with simulated `audit_events`,
 *   in-place DML (`npm run db:reset-data`) intentionally refuses to run.
 *
 * What this script does (never dropping or disabling triggers):
 *   1. Opens the current local D1 SQLite file in strict read-only mode via
 *      `DatabaseSync(..., { readOnly: true })` + `createReadOnlyD1Adapter`,
 *      extracts the household `parents`, `learners`, and `school_years` snapshot
 *      via `extractHouseholdIdentity(db)`, and closes the handle without mutating
 *      a single byte of the existing SQLite or WAL files.
 *   2. Moves all `.sqlite*` files from `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`
 *      (and any leftover `.wrangler/probe-iso*` directories) into a timestamped backup
 *      directory under `backups/household-db-archive-<timestamp>/`, preserving the
 *      archived SQLite file's SHA-256 byte-for-byte.
 *   3. Opens a fresh local D1 SQLite file via `DatabaseSync`, applies all shipped
 *      migrations (`0001`–`0014`) + records them in `d1_migrations`, seeds all 50
 *      catalogue lessons via `seedLessons`, restores the household identity via
 *      `restoreHouseholdIdentity`, verifies the resulting clean state via
 *      `verifyCleanHouseholdState`, and optionally approves the learner's grade
 *      catalogue lessons when `--approve-grade-lessons` is passed.
 *
 * Usage:
 *   npm run db:reprovision-household
 *   npm run db:reprovision-household -- --approve-grade-lessons
 *   node scripts/reprovision-household-db.mjs [--target-root <dir>] [--approve-grade-lessons]
 *
 * Local only. Never touches remote Cloudflare resources.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { approveHouseholdLessons } from "./approve-household-lessons.mjs";
import { createReadOnlyD1Adapter } from "./household-preflight.mjs";
import { listShippedMigrationFiles } from "./migrate-local-d1.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";
import { createSqliteD1Adapter } from "./seed-lessons.mjs";

registerTsSpecifiers();

const { seedLessons } = await import("../test/integration/lesson-seed.ts");
const {
  extractHouseholdIdentity,
  restoreHouseholdIdentity,
  verifyCleanHouseholdState,
} = await import("../src/worker/db/reprovision-household.ts");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const DEFAULT_D1_SQLITE_FILENAME =
  "55cf0b3020dae37b568062fe28961bd8d3fcd41f9b33fe8ddfdc3540875f734a.sqlite";

const MIGRATION_FILES = listShippedMigrationFiles();

export function parseReprovisionCliArgs(argv) {
  let targetRoot = process.cwd();
  let approveGradeLessons = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target-root" && i + 1 < argv.length) {
      targetRoot = resolve(argv[i + 1]);
      i += 1;
    } else if (arg === "--approve-grade-lessons") {
      approveGradeLessons = true;
    }
  }

  return {
    targetRoot,
    approveGradeLessons,
  };
}

export async function reprovisionHouseholdDatabase(options = {}) {
  const targetRoot = options.targetRoot ? resolve(options.targetRoot) : process.cwd();
  const approveGradeLessons = Boolean(options.approveGradeLessons);
  const now = typeof options.now === "number" ? options.now : Date.now();

  const wranglerDir = join(targetRoot, ".wrangler");
  const d1StateDir = join(wranglerDir, "state", "v3", "d1", "miniflare-D1DatabaseObject");

  // Step 1: Extract household identity from existing D1 database in strict read-only mode
  //         so the SQLite file is archived byte-for-byte untouched in Step 2.
  let snapshot = { parent: null, learner: null, schoolYear: null };
  const existingSqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (existingSqliteFile) {
    const roDb = new DatabaseSync(join(d1StateDir, existingSqliteFile), { readOnly: true });
    try {
      snapshot = await extractHouseholdIdentity(createReadOnlyD1Adapter(roDb));
    } finally {
      roDb.close();
    }
  }

  // Step 2: Archive existing SQLite files and any probe-iso* directories into backups/
  const timestamp = new Date(now).toISOString().replace(/[:.]/g, "-");
  const archiveDir = join(targetRoot, "backups", `household-db-archive-${timestamp}`);
  const archivedItems = [];

  if (existsSync(d1StateDir)) {
    const entries = readdirSync(d1StateDir);
    const sqliteEntries = entries.filter((name) => name.includes(".sqlite"));
    if (sqliteEntries.length > 0) {
      const d1ArchiveSubdir = join(archiveDir, "miniflare-D1DatabaseObject");
      mkdirSync(d1ArchiveSubdir, { recursive: true });
      for (const file of sqliteEntries) {
        const srcPath = join(d1StateDir, file);
        const destPath = join(d1ArchiveSubdir, file);
        renameSync(srcPath, destPath);
        archivedItems.push(`miniflare-D1DatabaseObject/${file}`);
      }
    }
  }

  if (existsSync(wranglerDir)) {
    const wranglerEntries = readdirSync(wranglerDir);
    for (const name of wranglerEntries) {
      if (name.startsWith("probe-iso")) {
        mkdirSync(archiveDir, { recursive: true });
        renameSync(join(wranglerDir, name), join(archiveDir, name));
        archivedItems.push(name);
      }
    }
  }

  // Step 3: Open a fresh local D1 SQLite database, apply migrations 0001..0014,
  //         seed 50 lessons, restore household identity, verify clean state,
  //         and optionally approve the learner's grade lessons.
  mkdirSync(d1StateDir, { recursive: true });
  const targetSqliteFile = existingSqliteFile ?? DEFAULT_D1_SQLITE_FILENAME;
  const rawDb = new DatabaseSync(join(d1StateDir, targetSqliteFile));

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

    const insertMigrationStmt = rawDb.prepare(
      "INSERT OR IGNORE INTO d1_migrations (name) VALUES (?)",
    );
    for (const file of MIGRATION_FILES) {
      const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      rawDb.exec(sqlText);
      insertMigrationStmt.run(file);
    }

    const db = createSqliteD1Adapter(rawDb);
    const seedResult = await seedLessons(db);
    await restoreHouseholdIdentity(db, snapshot, now);
    const report = await verifyCleanHouseholdState(db);

    let lessonApprovals = null;
    if (approveGradeLessons && snapshot.parent && snapshot.learner) {
      lessonApprovals = approveHouseholdLessons(rawDb, {}, now);
    }

    return {
      status: "ok",
      targetRoot,
      archiveDir: archivedItems.length > 0 ? archiveDir : null,
      archivedItemsCount: archivedItems.length,
      preservedParentDisplayName: snapshot.parent?.display_name ?? null,
      preservedLearnerNickname: snapshot.learner?.nickname ?? null,
      preservedSchoolYearLabel: snapshot.schoolYear?.label ?? null,
      lessonsInserted: seedResult.inserted,
      verification: report,
      lessonApprovals,
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
  const parsedArgs = parseReprovisionCliArgs(process.argv.slice(2));
  try {
    const result = await reprovisionHouseholdDatabase(parsedArgs);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`reprovision failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
