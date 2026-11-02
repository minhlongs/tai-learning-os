import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPlatformProxy, unstable_splitSqlQuery } from "wrangler";

/**
 * Isolated local D1 database for integration test suites, plus the controlled
 * schema reset that keeps every test repeatable.
 *
 * Key isolation guarantees:
 *   1. Every test proxy persists under an OS temporary directory (`tmpdir()`),
 *      never under the repository's `.wrangler/state`.
 *   2. The test Wrangler config is written inside that temporary directory, never
 *      opening or touching `wrangler.jsonc`.
 *   3. Every `D1Database` handle created by `openTestDatabase` / `reopenTestDatabase`
 *      is registered in an internal `WeakSet<D1Database>`. `recreateSchema` refuses
 *      any unbranded `D1Database` handle before executing a single statement.
 *   4. `d1_migrations`, `sqlite_*`, and `_cf_*` bookkeeping tables are preserved
 *      across schema resets.
 *   5. After applying migrations, `recreateSchema` verifies that all required
 *      schema v4 triggers and indexes exist, failing closed if any are missing.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const TEST_DATABASE_ID = "tai-learning-os-integration-test-preview-id";

/** Dedicated temporary directory outside the repo's `.wrangler/state`. */
const TEST_RUNTIME_DIR = join(tmpdir(), "tai-learning-os-integration-test-runtime");
const TEST_PERSIST_DIR = join(TEST_RUNTIME_DIR, "d1-state");
const TEST_CONFIG_PATH = join(TEST_RUNTIME_DIR, "wrangler.test.jsonc");

/** Test-only signing secret. Never read from disk, never deployed. */
export const TEST_SESSION_SECRET = "integration-only-not-a-real-secret-value";

export type TestProxy = Awaited<ReturnType<typeof getPlatformProxy>>;

/**
 * Internal brand registry of D1Database handles created by this test harness.
 * Cannot be forged by database name or a caller-passed boolean flag.
 */
const BRANDED_TEST_DBS = new WeakSet<D1Database>();

export function isBrandedTestDatabase(db: D1Database): boolean {
  return BRANDED_TEST_DBS.has(db);
}

export function getTestPersistDir(): string {
  return TEST_PERSIST_DIR;
}

export function getTestConfigPath(): string {
  return TEST_CONFIG_PATH;
}

function writeTestConfig(): void {
  mkdirSync(TEST_PERSIST_DIR, { recursive: true });
  writeFileSync(
    TEST_CONFIG_PATH,
    JSON.stringify({
      name: "tai-learning-os-integration-test",
      keep_vars: false,
      compatibility_date: "2026-10-24",
      d1_databases: [
        {
          binding: "DB",
          database_name: "tai-learning-os-integration-test",
          database_id: TEST_DATABASE_ID,
          preview_database_id: TEST_DATABASE_ID,
        },
      ],
      vars: {
        ENVIRONMENT: "development",
      },
    }),
  );
}

/** Strip the leading comment block a splitter attaches to each statement. */
function stripLeadingComments(statement: string): string {
  return statement.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
}

/** Every shipped migration, split into executable statements in file order. */
function migrationStatements(): string[] {
  const names = [
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
  ];
  const statements: string[] = [];
  for (const name of names) {
    for (const raw of unstable_splitSqlQuery(readFileSync(join(MIGRATIONS_DIR, name), "utf8"))) {
      const statement = stripLeadingComments(raw);
      if (statement) statements.push(statement);
    }
  }
  return statements;
}

/**
 * Verify that critical schema v4 invariants exist after migration replay.
 * Fails closed so no test can run against a degraded or partially-migrated schema.
 */
async function assertSchemaProtectionPresent(db: D1Database): Promise<void> {
  const triggers = (
    await db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
      )
      .all<{ name: string }>()
  ).results ?? [];
  const triggerNames = triggers.map((t) => t.name);
  if (
    !triggerNames.includes("audit_events_no_delete") ||
    !triggerNames.includes("audit_events_no_update")
  ) {
    throw new Error(
      `Schema setup verification failed: missing audit_events immutability triggers (found: [${triggerNames.join(", ")}])`,
    );
  }

  const uniqueIndex = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'learning_attempts' AND name = 'idx_attempts_learner_step_attempt'",
    )
    .first<{ name: string }>();
  if (!uniqueIndex) {
    throw new Error(
      "Schema setup verification failed: missing unique index idx_attempts_learner_step_attempt on learning_attempts",
    );
  }

  const versionRow = await db
    .prepare("SELECT MAX(version) AS max_version FROM schema_versions")
    .first<{ max_version: number | null }>();
  if (Number(versionRow?.max_version ?? 0) < 4) {
    throw new Error(
      `Schema setup verification failed: expected schema_versions >= 4, found ${String(versionRow?.max_version)}`,
    );
  }
}

/**
 * Recreate the schema from the shipped migrations on a controlled test database.
 *
 * Refuses any `D1Database` handle that was not created by `openTestDatabase` or
 * `reopenTestDatabase`. Preserves `d1_migrations`, `sqlite_*`, and `_cf_*`.
 */
export async function recreateSchema(db: D1Database): Promise<void> {
  if (!BRANDED_TEST_DBS.has(db)) {
    throw new Error(
      "Refusing to run destructive recreateSchema on an unbranded D1Database handle. " +
        "Only handles created by openTestDatabase()/reopenTestDatabase() may be reset via recreateSchema.",
    );
  }

  const triggers =
    (await db.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all<{ name: string }>())
      .results ?? [];
  for (const trigger of triggers) {
    await db.prepare(`DROP TRIGGER IF EXISTS ${trigger.name}`).run();
  }

  const reserved =
    (await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>())
      .results ?? [];
  let tables = reserved
    .map((row) => row.name)
    .filter(
      (name) =>
        !name.startsWith("sqlite_") &&
        !name.startsWith("_cf_") &&
        name !== "d1_migrations",
    );

  for (;;) {
    const stillThere: string[] = [];
    for (const table of tables) {
      try {
        await db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
      } catch {
        stillThere.push(table);
      }
    }
    if (stillThere.length === 0) break;
    if (stillThere.length === tables.length) {
      throw new Error(
        `cannot drop tables [${stillThere.join(", ")}]: foreign-key cycle or missing parent`,
      );
    }
    tables = stillThere;
  }

  for (const statement of migrationStatements()) {
    await db.prepare(statement).run();
  }

  await assertSchemaProtectionPresent(db);
}

/**
 * Open the dedicated test database in an isolated temp directory with all
 * shipped migrations applied and verified.
 */
export async function openTestDatabase(): Promise<TestProxy> {
  writeTestConfig();
  const proxy = await getPlatformProxy({
    configPath: TEST_CONFIG_PATH,
    persist: { path: TEST_PERSIST_DIR },
  });
  const db = proxy.env.DB as D1Database;
  BRANDED_TEST_DBS.add(db);
  try {
    await recreateSchema(db);
  } catch (err) {
    await proxy.dispose();
    throw err;
  }
  return proxy;
}

/**
 * Re-open a fresh platform proxy pointing at the same isolated test persistence
 * directory without recreating its schema, used to verify persistence across
 * process/handle restarts.
 */
export async function reopenTestDatabase(): Promise<TestProxy> {
  writeTestConfig();
  const proxy = await getPlatformProxy({
    configPath: TEST_CONFIG_PATH,
    persist: { path: TEST_PERSIST_DIR },
  });
  const db = proxy.env.DB as D1Database;
  BRANDED_TEST_DBS.add(db);
  return proxy;
}

/** Ensure the isolated test runtime directory exists. */
export function ensureTestConfigDir(): void {
  mkdirSync(TEST_PERSIST_DIR, { recursive: true });
}
