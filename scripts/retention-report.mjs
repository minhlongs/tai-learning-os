/**
 * Delayed-retention report over the household learner's real attempts (`npm run retention:report`).
 *
 * This is the instrument for the question FSRS cannot answer by itself: the
 * scheduler is tuned to 0.95 recall at the due date, and that 0.95 is an
 * assumption about this child. This command measures it — of the skills she
 * solved unaided, how many can she still solve unaided once the interval has
 * actually elapsed?
 *
 * Strictly read-only. Opens the household D1 SQLite file with
 * `DatabaseSync(..., { readOnly: true })` behind the same read-only adapter
 * `household:preflight` uses, and runs only the SELECTs in
 * `src/worker/db/retention-queries.ts` — the same code the integration test
 * exercises, so the report and the test cannot drift apart.
 *
 * The one thing this command must never do is print a number it did not
 * measure. A household database with no attempts produces `status: "NO_DATA"`
 * and `correctRate: null`, never `0` and never `0%`: "she has not been tested
 * yet" and "she forgot everything" are different facts, and a report that
 * conflates them is worse than no report.
 *
 * Usage:
 *   npm run retention:report
 *   npm run retention:report -- --target-root <dir>
 */
import { existsSync, realpathSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createReadOnlyD1Adapter } from "./household-preflight.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { summarizeRetention } = await import("../src/shared/engine/retention.ts");
const { selectHouseholdLearnerId, selectRetentionAttempts, selectBaselineStatus } = await import(
  "../src/worker/db/retention-queries.ts"
);

export function parseRetentionCliArgs(argv) {
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
      throw new Error(`Unknown flag for retention:report: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for retention:report: ${arg}`);
    }
  }
  return { targetRoot };
}

/**
 * What the report can honestly say, given the evidence it found.
 *
 * Three states, and the distinction between the first two is the point:
 *   NO_DATA          — nothing has been recorded for this learner yet.
 *   AWAITING_PROBES  — attempts exist, but none is far enough from its anchor
 *                      to measure a horizon. The clock is running; it has not
 *                      run long enough.
 *   MEASURED         — at least one horizon has at least one probe.
 */
export function retentionStatus(report) {
  const probes = report.horizons.reduce((sum, horizon) => sum + horizon.probes, 0);
  if (probes > 0) return "MEASURED";
  if (report.eligibleAttempts === 0) return "NO_DATA";
  return "AWAITING_PROBES";
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let targetRoot;
  try {
    ({ targetRoot } = parseRetentionCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(`retention:report refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const d1StateDir = join(targetRoot, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  const sqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (!existsSync(d1StateDir) || !sqliteFile) {
    console.error(
      `retention:report refused: local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate" first.`,
    );
    process.exit(1);
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true });
  try {
    const db = createReadOnlyD1Adapter(rawDb);
    const learnerId = await selectHouseholdLearnerId(db);

    if (learnerId === null) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            protocol: "delayed-retention",
            status: "NO_LEARNER",
            horizonsDays: [14, 30],
            learnerFound: false,
          },
          null,
          2,
        ),
      );
    } else {
      const attempts = await selectRetentionAttempts(db, learnerId);
      const report = summarizeRetention(attempts);
      const baselines = await selectBaselineStatus(db, learnerId);

      console.log(
        JSON.stringify(
          {
            ok: true,
            protocol: "delayed-retention",
            status: retentionStatus(report),
            learnerFound: true,
            horizonsDays: report.horizons.map((horizon) => horizon.horizonDays),
            eligibleAttempts: report.eligibleAttempts,
            skillsSeen: report.skillsSeen.length,
            skillsWithAnchor: report.skillsWithAnchor,
            baselines,
            horizons: report.horizons,
            howToReadVi:
              "correctRate = null nghĩa là chưa có lần kiểm tra nào cách đủ xa; đó không phải 0%.",
          },
          null,
          2,
        ),
      );
    }
  } finally {
    rawDb.close();
  }
}
