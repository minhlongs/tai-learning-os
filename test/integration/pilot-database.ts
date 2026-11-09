import { lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  createSqliteD1Adapter,
  miniflareD1SqliteFilename,
  splitSqlStatements,
} from "../../scripts/seed-lessons.mjs";

/**
 * Isolated local D1 database for the multi-learner pilot fixture, kept strictly
 * apart from the household learner's own database.
 *
 * Why this exists: `seed:pilot` seeds five simulated learners, a center,
 * classrooms and teachers. When that lands in the database the real learner
 * uses, the ledger the learner's own evidence would later be written into is
 * already full of other children's rows, and nothing downstream can tell which
 * session belonged to whom. This module gives the pilot fixture its own
 * database under the OS temporary directory, in the same spirit as
 * `test-db.ts`.
 *
 * Hard guarantees:
 *   1. Persistence lives under `tmpdir()`, never under the repository's
 *      `.wrangler/state`.
 *   2. The wrangler config is written into that temporary directory, so the
 *      shipped `wrangler.jsonc` is never read here and can never be pointed at
 *      the household database by accident.
 *   3. The target persist path is asserted to sit outside the repository before
 *      a single statement runs, so a misconfiguration fails closed rather than
 *      half-seeding the wrong database.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

/** Stable identifier, so the pilot database keeps the same file across runs. */
const PILOT_DATABASE_ID = "tai-learning-os-pilot-fixture-preview-id";

/**
 * Highest schema version the shipped `migrations/` directory reaches.
 *
 * This is read from the migration text rather than counted from filenames,
 * because the two do not agree: `0001` writes no `schema_versions` row at all,
 * `0002` records version 1, and `0003` records version 3. The schema's own
 * version numbers therefore drift from its filenames, and a filename scan
 * derives a version the database would never actually record — which is what
 * the skip-replay decision compares this value against.
 *
 * The `\s*` spans matter: every shipped migration wraps its `VALUES` onto the
 * next line, so a single-line pattern matches none of them and the derivation
 * would throw instead of reading the schema.
 */
const SCHEMA_VERSION_INSERT_PATTERN =
  /INSERT\s+INTO\s+schema_versions\s*\(\s*version[^)]*\)\s*VALUES\s*\(\s*(\d+)/i;

/** Every shipped migration filename, in application order, newest last. */
const MIGRATION_NAMES = [
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

/**
 * Highest version the shipped migrations actually record. Fails closed when no
 * migration records a version, so a silent zero cannot make a partially applied
 * schema look complete.
 */
export function latestShippedSchemaVersion(): number {
  const versions = MIGRATION_NAMES.map((name) => {
    const text = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    return Number(SCHEMA_VERSION_INSERT_PATTERN.exec(text)?.[1]);
  }).filter((version) => Number.isFinite(version));

  if (versions.length === 0) {
    throw new Error(
      "Pilot schema verification failed: no shipped migration records a schema_versions row",
    );
  }
  return Math.max(...versions);
}

const PILOT_RUNTIME_DIR = join(tmpdir(), "tai-learning-os-pilot-runtime");
const PILOT_PERSIST_DIR = join(PILOT_RUNTIME_DIR, "d1-state");
const PILOT_CONFIG_PATH = join(PILOT_RUNTIME_DIR, "wrangler.pilot.jsonc");

export interface PilotProxy {
  configPath: string;
  persistPath: string;
  env: { DB: D1Database; ENVIRONMENT: string };
  dispose(): Promise<void>;
}

export function getPilotPersistDir(): string {
  return PILOT_PERSIST_DIR;
}

export function getPilotConfigPath(): string {
  return PILOT_CONFIG_PATH;
}

function writePilotConfig(): void {
  mkdirSync(PILOT_PERSIST_DIR, { recursive: true });
  writeFileSync(
    PILOT_CONFIG_PATH,
    JSON.stringify({
      name: "tai-learning-os-pilot-fixture",
      keep_vars: false,
      compatibility_date: "2026-10-24",
      d1_databases: [
        {
          binding: "DB",
          database_name: "tai-learning-os-pilot-fixture",
          database_id: PILOT_DATABASE_ID,
          preview_database_id: PILOT_DATABASE_ID,
        },
      ],
      vars: {
        ENVIRONMENT: "development",
      },
    }),
  );
}

/**
 * True when `candidate` sits inside `root`, comparing `..`-collapsed absolute
 * paths so a trailing separator on either side cannot make a prefix match land
 * on a sibling directory that merely shares the name.
 *
 * This is lexical: `path.resolve` does not follow symlinks, so a symlink planted
 * so an outbound path lands back in the repository reads as external here.
 * `realpathSync` is what would catch that, and is deliberately not used because
 * it throws on a path that does not exist yet — which is the case for the pilot
 * directory before it is created — so it cannot guard the first run.
 *
 * What this means in practice: the guard is trustworthy against config bugs and
 * environment misconfiguration, which write a path that is lexically wrong. It is
 * not a boundary against a `TMPDIR` deliberately symlinked into the repository,
 * which requires the operator to aim their own temp directory at the household
 * database. There is no remote input to `TMPDIR` on this machine; the operator is
 * the supervising parent, so that case is a deliberate self-inflicted action
 * rather than an attack this module is expected to survive.
 */
function isInside(root: string, candidate: string): boolean {
  const normalizedRoot = resolve(root).replace(/\/+$/, "");
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(normalizedRoot + "/");
}

/**
 * Refuse to run if the isolation path is wrong. A pilot seed that escaped into
 * the household database would be indistinguishable from the learner's own
 * evidence, and the audit ledger cannot be cleaned afterwards, so this check is
 * worth making loud.
 */
export function assertPilotIsolation(): void {
  const persistResolved = PILOT_PERSIST_DIR;
  const configResolved = PILOT_CONFIG_PATH;

  const insideRepo = [persistResolved, configResolved].some((candidate) =>
    isInside(REPO_ROOT, candidate),
  );
  if (insideRepo) {
    throw new Error(
      `Pilot fixture must not persist inside the repository (${REPO_ROOT}). ` +
        `Refusing to seed, because the household learner's database lives there.`,
    );
  }

  // The temp-directory check uses isInside rather than `startsWith(tmpdir() +
  // "/")`, because TMPDIR is user-controlled and may carry a trailing separator,
  // which would make every valid path fail this check and stop the seed for no
  // reason. It must not be the reverse: an escaping path has to be caught.
  if (!isInside(tmpdir(), persistResolved) || !isInside(tmpdir(), configResolved)) {
    throw new Error(
      `Pilot fixture must persist inside the OS temporary directory (${tmpdir()}), ` +
        `got persist=${persistResolved}, config=${configResolved}.`,
    );
  }

  // `isInside` is lexical, so it cannot see a `TMPDIR` that is itself a symlink
  // resolving into the repository. The parent directories do exist by this point
  // in a normal run, so comparing their real locations closes that case without
  // reintroducing the first-run failure `realpathSync` would cause on a path that
  // is not created yet. Skipped when either side is missing, rather than throwing:
  // a partially created temp tree is a valid state for the very first seed.
  const physicalLeak = [persistResolved, configResolved].some((candidate) => {
    const realTemp = realExistingAncestor(tmpdir());
    const realCandidate = realExistingAncestor(candidate);
    if (realTemp === undefined || realCandidate === undefined) return false;
    return isInside(REPO_ROOT, realCandidate) || !isInside(realTemp, realCandidate);
  });
  if (physicalLeak) {
    throw new Error(
      `Pilot fixture paths resolve to the wrong place after following symlinks ` +
        `(persist=${persistResolved}, config=${configResolved}). Refusing to seed, ` +
        `because the target may be the household learner's database.`,
    );
  }
}

/**
 * Nearest ancestor of `target` that exists, with every symlink on the way
 * resolved. Returns undefined when nothing up to the filesystem root exists,
 * which is not expected on any real path.
 */
function realExistingAncestor(target: string, depth = 0): string | undefined {
  if (depth > 32) return undefined;
  let current = resolve(target).replace(/\/+$/, "") || "/";
  for (;;) {
    try {
      return realpathSync(current);
    } catch {
      try {
        if (lstatSync(current).isSymbolicLink()) {
          const linkTarget = resolve(dirname(current), readlinkSync(current));
          return realExistingAncestor(linkTarget, depth + 1);
        }
      } catch {
        // Not an existing symlink entry; continue walking up to parent
      }
      const parent = dirname(current);
      if (parent === current) return undefined;
      current = parent;
    }
  }
}

/**
 * Every table the pilot fixture writes to, read from the fixture source so this
 * list cannot drift from what the seed actually does.
 */
const FIXTURE_TABLES = [
  ...new Set(
    Array.from(
      readFileSync(join(REPO_ROOT, "test/integration/pilot-fixture.ts"), "utf8").matchAll(
        /INSERT\s+OR\s+REPLACE\s+INTO\s+([a-z_]+)|INSERT\s+INTO\s+([a-z_]+)/gi,
      ),
    )
      .map((match) => match[1] ?? match[2])
      .filter((name): name is string => Boolean(name)),
  ),
].sort();

/** Every shipped migration, split into executable statements in file order. */
function migrationStatements(): string[] {
  const statements: string[] = [];
  for (const name of MIGRATION_NAMES) {
    for (const statement of splitSqlStatements(readFileSync(join(MIGRATIONS_DIR, name), "utf8"))) {
      if (statement) statements.push(statement);
    }
  }
  return statements;
}

/**
 * Apply the shipped schema to the isolated pilot database and confirm the
 * integrity controls are present, so the fixture never runs against a
 * half-applied schema.
 *
 * Idempotent: migration 0001 creates its tables with plain `CREATE TABLE` — none
 * of the 17 are `IF NOT EXISTS` — so replaying it against an already-migrated
 * database raises "table schema_versions already exists". A database whose
 * schema already reached the shipped newest version is therefore left as it
 * stands, and only a database that is behind gets the statements applied.
 * `test-db.ts` sidesteps this by dropping its tables first; this module cannot
 * drop, because the pilot database may carry fixture rows worth keeping.
 */
async function applySchema(db: D1Database): Promise<void> {
  const latestVersion = latestShippedSchemaVersion();
  const currentVersion = await db
    .prepare("SELECT MAX(version) AS max_version FROM schema_versions")
    .first<{ max_version: number | null }>()
    .catch(() => null);

  if (currentVersion && Number(currentVersion.max_version ?? 0) >= latestVersion) {
    // Already at the shipped schema. Skip replay, still verify integrity below.
  } else {
    for (const statement of migrationStatements()) {
      await db.prepare(statement).run();
    }
  }

  const triggers = (
    await db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
      )
      .all<{ name: string }>()
  ).results ?? [];
  const names = triggers.map((t) => t.name);
  if (!names.includes("audit_events_no_delete") || !names.includes("audit_events_no_update")) {
    throw new Error(
      `Pilot schema verification failed: missing audit_events immutability triggers (found: [${names.join(", ")}])`,
    );
  }

  const uniqueIndex = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'learning_attempts' AND name = 'idx_attempts_learner_step_attempt'",
    )
    .first<{ name: string }>();
  if (!uniqueIndex) {
    throw new Error(
      "Pilot schema verification failed: missing unique index idx_attempts_learner_step_attempt on learning_attempts",
    );
  }

  // The version, trigger and index checks above cannot tell a schema that is
  // complete from one that is missing a whole migration's payload: the shipped
  // migrations record their `schema_versions` row before their `CREATE TABLE`
  // statements, so a replay that died part-way through a trailing statement
  // leaves the newest version recorded while that migration's tables are absent.
  // The fixture would then fail deep inside the seed with an unrelated-looking
  // "no such table" instead of at the schema boundary that caused it. Assert on
  // the tables the fixture actually writes, which is the failure that matters.
  const tables = new Set(
    (
      await db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all<{ name: string }>()
    ).results?.map((row) => row.name) ?? [],
  );
  const missingTables = FIXTURE_TABLES.filter((name) => !tables.has(name));
  if (missingTables.length > 0) {
    throw new Error(
      `Pilot schema verification failed: missing tables the fixture writes (${missingTables.join(", ")})`,
    );
  }
}

/**
 * Open the isolated pilot database with the shipped schema applied.
 *
 * Idempotent across runs: a database already at the newest shipped version is
 * left as it stands, so the fixture's own upserts bring it to the intended
 * state rather than replaying migrations that would collide.
 */
export async function openPilotDatabase(): Promise<PilotProxy> {
  assertPilotIsolation();
  writePilotConfig();
  const d1Dir = join(PILOT_PERSIST_DIR, "d1", "miniflare-D1DatabaseObject");
  mkdirSync(d1Dir, { recursive: true });
  const sqlitePath = join(d1Dir, miniflareD1SqliteFilename(PILOT_DATABASE_ID));
  const rawDb = new DatabaseSync(sqlitePath);
  rawDb.exec("PRAGMA foreign_keys = ON;");
  rawDb.exec("PRAGMA busy_timeout = 5000;");
  const db = createSqliteD1Adapter(rawDb) as D1Database;
  const proxy: PilotProxy = {
    configPath: PILOT_CONFIG_PATH,
    persistPath: PILOT_PERSIST_DIR,
    env: { DB: db, ENVIRONMENT: "development" },
    async dispose() {
      rawDb.close();
    },
  };
  try {
    await applySchema(db);
  } catch (error) {
    await proxy.dispose();
    throw error;
  }
  return proxy;
}
