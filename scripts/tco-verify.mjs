/**
 * CLI Household TCO & Unit-Economics Verifier (`npm run tco:verify` / Gate G15).
 *
 * Evaluates Mission A's annual household TCO (`< 10,000,000 VND/year`, `0` VND
 * cloud Worker cost) alongside the isolated Mission B commercial unit-economics
 * sensitivity model (Base B2B2C `PASS`, Bear B2C `REJECT`, Unbounded-Chat
 * anti-pattern `REJECT`), printing a deterministic JSON summary and exiting 0
 * when every Gate G15 invariant holds.
 *
 * Usage:
 *   node scripts/tco-verify.mjs
 *   node scripts/tco-verify.mjs --output <path>
 */

import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { verifyTcoAndUnitEconomics } = await import("../src/shared/engine/tco-model.ts");

export function parseTcoVerifyCliArgs(argv) {
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
      throw new Error(`Unknown flag for tco:verify: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for tco:verify: ${String(arg)}`);
    }
  }
  return { outputPath };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let outputPath;
  try {
    ({ outputPath } = parseTcoVerifyCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(
      `tco:verify refused: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  const report = verifyTcoAndUnitEconomics();
  const payload = {
    ...report,
    command: "tco:verify",
  };
  const formatted = `${JSON.stringify(payload, null, 2)}\n`;

  if (outputPath !== null) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, formatted, "utf8");
  }
  process.stdout.write(formatted);

  if (!report.ok) {
    process.exit(1);
  }
}
