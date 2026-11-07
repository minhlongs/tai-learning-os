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
 *   1. Opens the current local D1 database via `getPlatformProxy`, extracts the
 *      household `parents`, `learners`, and `school_years` snapshot via
 *      `extractHouseholdIdentity(db)`, and disposes the proxy.
 *   2. Moves all `.sqlite*` files from `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`
 *      (and any leftover `.wrangler/probe-iso*` directories) into a timestamped backup
 *      directory under `backups/household-db-archive-<timestamp>/`.
 *   3. Opens a fresh local D1 database via `getPlatformProxy`, applies all shipped
 *      migrations (`0001`–`0014`) + records them in `d1_migrations`, seeds all 50
 *      catalogue lessons via `seedLessons`, restores the household identity via
 *      `restoreHouseholdIdentity`, and verifies the resulting clean state via
 *      `verifyCleanHouseholdState`.
 *
 * Local only. Never touches remote Cloudflare resources.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { getPlatformProxy, unstable_splitSqlQuery } = await import("wrangler");
const { seedLessons } = await import("../test/integration/lesson-seed.ts");
const {
  extractHouseholdIdentity,
  restoreHouseholdIdentity,
  verifyCleanHouseholdState,
} = await import("../src/worker/db/reprovision-household.ts");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const MIGRATION_FILES = [
  "0001_initial_schema.sql",
  "0002_reference_content.sql",
  "0003_curriculum_and_trust_closure.sql",
  "0004_evidence_integrity.sql",
  "0005_organization_and_consent.sql",
  "0006_lesson_authoring_and_assignments.sql",
  "0007_learner_version_approvals_and_session_continuation.sql",
  "0008_grade4_curriculum_expansion.sql",
  "0009_version_snapshots_and_legacy_approval_hardening.sql",
  "0010_phase3_science_debate_and_school_years.sql",
  "0011_science_and_debate_parity.sql",
  "0012_family_practice_and_version_lineage.sql",
  "0013_practice_planner_and_classroom_progress.sql",
  "0014_grade5_curriculum_expansion.sql",
];

function parseTargetDir(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--target-root" && argv[i + 1]) {
      return resolve(argv[i + 1]);
    }
  }
  return process.cwd();
}

const targetRoot = parseTargetDir(process.argv.slice(2));
const configPath = join(targetRoot, "wrangler.jsonc");
const wranglerDir = join(targetRoot, ".wrangler");
const d1StateDir = join(wranglerDir, "state", "v3", "d1", "miniflare-D1DatabaseObject");
const persistPath = join(wranglerDir, "state", "v3");

// Step 1: Extract household identity from existing D1 database (if present)
let snapshot = { parent: null, learner: null, schoolYear: null };
if (existsSync(d1StateDir)) {
  const oldProxy = await getPlatformProxy({ configPath, persist: { path: persistPath } });
  try {
    snapshot = await extractHouseholdIdentity(oldProxy.env.DB);
  } finally {
    await oldProxy.dispose();
  }
}

// Step 2: Archive existing SQLite files and any probe-iso* directories into backups/
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
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

// Step 3: Open a fresh local D1 database, apply migrations 0001..0014, seed 50 lessons,
//         restore household identity, and verify clean state.
const newProxy = await getPlatformProxy({ configPath, persist: { path: persistPath } });
try {
  const db = newProxy.env.DB;
  await db.prepare("PRAGMA foreign_keys = ON").run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS d1_migrations (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         name TEXT UNIQUE,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
       )`,
    )
    .run();

  for (const file of MIGRATION_FILES) {
    const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const statement of unstable_splitSqlQuery(sqlText)) {
      const cleaned = statement.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
      if (cleaned) {
        await db.prepare(cleaned).run();
      }
    }
    await db
      .prepare("INSERT OR IGNORE INTO d1_migrations (name) VALUES (?1)")
      .bind(file)
      .run();
  }

  const seedResult = await seedLessons(db);
  await restoreHouseholdIdentity(db, snapshot, Date.now());
  const report = await verifyCleanHouseholdState(db);

  console.log(
    JSON.stringify(
      {
        status: "ok",
        targetRoot,
        archiveDir: archivedItems.length > 0 ? archiveDir : null,
        archivedItemsCount: archivedItems.length,
        preservedParentDisplayName: snapshot.parent?.display_name ?? null,
        preservedLearnerNickname: snapshot.learner?.nickname ?? null,
        preservedSchoolYearLabel: snapshot.schoolYear?.label ?? null,
        lessonsInserted: seedResult.inserted,
        verification: report,
      },
      null,
      2,
    ),
  );
} finally {
  await newProxy.dispose();
}
