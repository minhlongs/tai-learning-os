/**
 * Isolated E2E Browser Test Runner (`npm run test:e2e`).
 *
 * Security & Isolation Invariants:
 *   1. Creates a dedicated temporary directory under `os.tmpdir()` (`mkdtempSync`).
 *   2. Generates a temporary `wrangler.e2e.jsonc` with `keep_vars: false` and
 *      test-only secrets (`SESSION_SECRET`, `ENVIRONMENT`), so `.dev.vars` and
 *      `.wrangler/state` in the repository are NEVER read or modified.
 *   3. Applies all shipped D1 migrations, seeds the demo lesson catalogue, and
 *      seeds the test parent account (`Phụ huynh`) strictly inside the temporary
 *      D1 persistence directory (`TLO_E2E_PERSIST_PATH`).
 *   4. Verifies that a simulated listener on port `8791` is completely ignored
 *      by the E2E suite (which binds strictly to port `8792` with `reuseExistingServer: false`).
 *   5. Cleans up only its own temporary directory upon exit while preserving
 *      Playwright failure artifacts (`test-results/`, `playwright-report/`) outside
 *      the temporary DB directory.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

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

const TEST_PARENT_NAME = process.env.TLO_PARENT_NAME ?? "Phụ huynh";
const TEST_PARENT_PASSWORD = process.env.TLO_PARENT_PASSWORD ?? "MatKhauBiMat2026";
const TEST_SESSION_SECRET = "e2e-isolated-test-only-session-secret-not-for-prod-2026";

function stripLeadingComments(statement) {
  return statement.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
}

const tempRoot = mkdtempSync(join(tmpdir(), "tai-learning-os-e2e-"));
const persistPath = join(tempRoot, "d1-state");
const configPath = join(tempRoot, "wrangler.e2e.jsonc");

let cleanedUp = false;
function cleanupTempDir() {
  if (cleanedUp) return;
  cleanedUp = true;
  try {
    rmSync(tempRoot, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors on exit
  }
}

process.on("exit", cleanupTempDir);
process.on("SIGINT", () => {
  cleanupTempDir();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanupTempDir();
  process.exit(143);
});

async function provisionIsolatedDatabase() {
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        name: "tai-learning-os-e2e",
        main: join(REPO_ROOT, "src/worker/index.ts"),
        compatibility_date: "2026-10-24",
        keep_vars: false,
        assets: {
          not_found_handling: "single-page-application",
        },
        d1_databases: [
          {
            binding: "DB",
            database_name: "tai-learning-os-e2e",
            database_id: "e2e-isolated-local-db",
            preview_database_id: "e2e-isolated-local-db",
          },
        ],
        ratelimits: [
          {
            name: "AUTH_RATE_LIMITER",
            namespace_id: "1001",
            simple: {
              limit: 100,
              period: 60,
            },
          },
          {
            name: "API_RATE_LIMITER",
            namespace_id: "1002",
            simple: {
              limit: 2000,
              period: 60,
            },
          },
        ],
        vars: {
          ENVIRONMENT: "development",
          SESSION_SECRET: TEST_SESSION_SECRET,
        },
      },
      null,
      2,
    ),
  );

  const { getPlatformProxy, unstable_splitSqlQuery } = await import("wrangler");
  const { seedLessons } = await import("../test/integration/lesson-seed.ts");
  const { hashPassword } = await import("../src/shared/crypto/password.ts");

  const proxy = await getPlatformProxy({
    configPath,
    persist: { path: join(persistPath, "v3") },
  });

  try {
    const db = proxy.env.DB;
    for (const file of MIGRATION_FILES) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      for (const raw of unstable_splitSqlQuery(sql)) {
        const stmt = stripLeadingComments(raw);
        if (stmt) {
          await db.prepare(stmt).run();
        }
      }
    }

    await seedLessons(db);

    const now = Date.now();
    const passwordHash = await hashPassword(TEST_PARENT_PASSWORD);
    await db
      .prepare(
        `INSERT INTO parents (id, display_name, password_hash, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)
         ON CONFLICT(id) DO UPDATE SET
           display_name = excluded.display_name,
           password_hash = excluded.password_hash,
           updated_at = excluded.updated_at`,
      )
      .bind("e2e-parent-1", TEST_PARENT_NAME, passwordHash, now)
      .run();
  } finally {
    await proxy.dispose();
  }
}

/**
 * If port 8791 is currently free, bind a dummy decoy server on 8791 that returns 599
 * for every request and counts hits. This proves empirically that the E2E suite never
 * talks to 8791. If the developer already has their own server running on 8791, we leave 8791 untouched.
 */
let decoyHitCount = 0;
async function startOptionalDecoyOn8791() {
  return new Promise((resolvePromise) => {
    const decoy = createServer((_req, res) => {
      decoyHitCount += 1;
      res.writeHead(599, { "content-type": "text/plain" });
      res.end("DECOY_8791_MUST_NOT_BE_CALLED_BY_E2E");
    });
    decoy.once("error", () => {
      // Port 8791 is already in use by developer's local server; do not touch it.
      resolvePromise(null);
    });
    decoy.listen(8791, "127.0.0.1", () => {
      resolvePromise(decoy);
    });
  });
}

function captureUntouchedSnapshot() {
  const wranglerStateDir = join(REPO_ROOT, ".wrangler", "state");
  const devVarsFile = join(REPO_ROOT, ".dev.vars");
  return {
    wranglerExists: existsSync(wranglerStateDir),
    wranglerMtimeMs: existsSync(wranglerStateDir) ? statSync(wranglerStateDir).mtimeMs : null,
    devVarsExists: existsSync(devVarsFile),
    devVarsMtimeMs: existsSync(devVarsFile) ? statSync(devVarsFile).mtimeMs : null,
  };
}

const beforeUntouched = captureUntouchedSnapshot();
await provisionIsolatedDatabase();
const decoyServer = await startOptionalDecoyOn8791();

const playwrightArgs = ["playwright", "test", ...process.argv.slice(2)];
const child = spawn("npx", playwrightArgs, {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    TLO_E2E_ISOLATED: "1",
    TLO_E2E_WRANGLER_CONFIG: configPath,
    TLO_E2E_PERSIST_PATH: persistPath,
    TLO_PARENT_NAME: TEST_PARENT_NAME,
    TLO_PARENT_PASSWORD: TEST_PARENT_PASSWORD,
  },
});

const exitCode = await new Promise((resolveExit) => {
  child.on("close", (code) => resolveExit(code ?? 1));
  child.on("error", () => resolveExit(1));
});

if (decoyServer) {
  await new Promise((r) => decoyServer.close(() => r(undefined)));
}
cleanupTempDir();

const afterUntouched = captureUntouchedSnapshot();
if (
  beforeUntouched.wranglerExists !== afterUntouched.wranglerExists ||
  beforeUntouched.wranglerMtimeMs !== afterUntouched.wranglerMtimeMs
) {
  console.error("E2E isolation violation: .wrangler/state was created or modified during E2E run.");
  process.exit(1);
}
if (
  beforeUntouched.devVarsExists !== afterUntouched.devVarsExists ||
  beforeUntouched.devVarsMtimeMs !== afterUntouched.devVarsMtimeMs
) {
  console.error("E2E isolation violation: .dev.vars was created or modified during E2E run.");
  process.exit(1);
}
if (decoyHitCount > 0) {
  console.error(`E2E isolation violation: decoy server on port 8791 received ${decoyHitCount} request(s).`);
  process.exit(1);
}
if (existsSync(tempRoot)) {
  console.error(`E2E cleanup violation: temporary directory ${tempRoot} still exists after cleanup.`);
  process.exit(1);
}

process.exit(exitCode);
