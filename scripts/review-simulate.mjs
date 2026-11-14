/**
 * CLI 3,650-day FSRS-6 longitudinal simulation (`npm run review:simulate` / Gate G7).
 *
 * Runs the 10-year (`3,650`-day) Vietnam school-calendar simulation twice to
 * prove byte-for-byte determinism, verifies every Gate G7 invariant (legacy
 * fixed ladder > 100/day Year-10 overload, Masterplan 10-year FSRS-6 < 25/day
 * cognitive fatigue cap, zero false card resets across Tết & summer breaks,
 * all three leap days `2028-02-29` / `2032-02-29` / `2036-02-29`, and exact
 * `17:00 UTC === 00:00 ICT` midnight boundaries), and emits JSON either to
 * `--output <path>` or to stdout.
 *
 * Usage:
 *   node scripts/review-simulate.mjs
 *   node scripts/review-simulate.mjs --output <path>
 */

import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const {
  COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
  LEGACY_OVERLOAD_DAILY_REVIEWS,
  runLongitudinalReviewSimulation,
} = await import("../src/shared/engine/review-simulation.ts");

export function parseReviewSimulateCliArgs(argv) {
  let outputPath = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--output") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --output");
      }
      outputPath = resolve(next);
      i += 1;
    } else if (typeof arg === "string" && arg.startsWith("-")) {
      throw new Error(`Unknown flag for review:simulate: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for review:simulate: ${String(arg)}`);
    }
  }
  return { outputPath };
}

export function executeReviewSimulationVerified() {
  const firstRun = runLongitudinalReviewSimulation();
  const secondRun = runLongitudinalReviewSimulation();

  const firstSerialized = JSON.stringify(firstRun);
  const secondSerialized = JSON.stringify(secondRun);
  const deterministicByteIdentical = firstSerialized === secondSerialized;

  const { invariants, policies } = firstRun;
  const allInvariantsHold =
    deterministicByteIdentical &&
    invariants.legacyYear10Exceeds100PerDay &&
    invariants.masterplanYear10Below25PerDay &&
    invariants.zeroFalseResetsAcrossPauses &&
    invariants.allThreeLeapDaysObserved &&
    invariants.midnightBoundariesExact;

  return {
    ok: allInvariantsHold,
    gate: "G7",
    command: "review:simulate",
    deterministicByteIdentical,
    thresholds: {
      cognitiveFatigueDailyReviewCap: COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
      legacyOverloadDailyReviews: LEGACY_OVERLOAD_DAILY_REVIEWS,
    },
    headlineComparison: {
      legacyYear10MeanDailyReviews: policies.legacy_fixed_ladder.year10MeanDailyReviewsCalendar,
      grade4PolicyYear1MeanDailyReviews: policies.fsrs6_grade4_policy.year1MeanDailyReviews,
      grade4PolicyYear10MeanDailyReviews:
        policies.fsrs6_grade4_policy.year10MeanDailyReviewsCalendar,
      masterplan10yYear10MeanDailyReviews:
        policies.fsrs6_masterplan_10y.year10MeanDailyReviewsCalendar,
      masterplan10yYear10ActiveMeanDailyReviews:
        policies.fsrs6_masterplan_10y.year10MeanDailyReviewsActive,
      masterplan10yYear10SteadySchoolTermMeanReviews:
        policies.fsrs6_masterplan_10y.year10SteadyStateSchoolTermMeanReviews,
    },
    simulation: firstRun,
  };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let outputPath;
  try {
    ({ outputPath } = parseReviewSimulateCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(
      `review:simulate refused: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  const payload = executeReviewSimulationVerified();
  const formatted = `${JSON.stringify(payload, null, 2)}\n`;

  if (outputPath !== null) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, formatted, "utf8");
    console.log(
      JSON.stringify({
        ok: payload.ok,
        gate: payload.gate,
        wrote: outputPath,
        deterministicByteIdentical: payload.deterministicByteIdentical,
        headlineComparison: payload.headlineComparison,
      }),
    );
  } else {
    process.stdout.write(formatted);
  }

  if (!payload.ok) {
    process.exit(1);
  }
}
