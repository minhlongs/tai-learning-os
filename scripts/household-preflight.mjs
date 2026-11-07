/**
 * Strictly read-only household database preflight check (`npm run household:preflight`).
 *
 * Opens the local household D1 database via `getPlatformProxy`, checks `.dev.vars`
 * key presence (boolean flags only, never printing secret values), runs SQLite
 * `PRAGMA integrity_check` in read-only mode plus household isolation checks,
 * and reports how many active catalogue lessons the parent has approved for the
 * household learner.
 *
 * Writes nothing to D1 or disk.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { getPlatformProxy } = await import("wrangler");
const {
  inspectDevVarsText,
  inspectHouseholdPreflight,
} = await import("../src/worker/db/household-preflight.ts");

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

let sqliteIntegrityCheck;
const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true });
try {
  const row = rawDb.prepare("PRAGMA integrity_check").get();
  sqliteIntegrityCheck = String(row?.integrity_check ?? "unknown") === "ok" ? "ok" : "failed";
} finally {
  rawDb.close();
}

const proxy = await getPlatformProxy({ configPath, persist: { path: persistPath } });
try {
  const report = await inspectHouseholdPreflight(
    proxy.env.DB,
    devVars,
    sqliteIntegrityCheck,
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) {
    process.exitCode = 1;
  }
} finally {
  await proxy.dispose();
}
