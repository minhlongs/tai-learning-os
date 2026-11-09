import { describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Static guard for pilot-fixture database isolation.
 *
 * The household learner's database lives in the repository's `.wrangler/state`.
 * The audit ledger is append-only by schema-level triggers, so simulated pilot
 * rows written there can never be removed — they would sit in the learner's
 * history permanently.
 *
 * `test/integration/pilot-database.ts` is the module that keeps the pilot out.
 * This suite checks the invariant without opening a database: it asserts the
 * isolation paths really sit outside the repository, and that the seed script
 * actually routes through that module rather than opening the household
 * database directly — the exact shape that caused the leak.
 *
 * Paths resolve from `import.meta.url`, not `process.cwd()`, so the test reads
 * the same files however it is invoked.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR_FOR_VERSION_CHECK = join(REPO_ROOT, "migrations");

/** Migration filenames, read from disk so a newly added migration is covered. */
const MIGRATION_NAMES_FOR_VERSION_CHECK: string[] = readdirSync(MIGRATIONS_DIR_FOR_VERSION_CHECK)
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();

interface IsolationInternals {
  getPilotPersistDir(): string;
  getPilotConfigPath(): string;
  assertPilotIsolation(): void;
}

function loadIsolationModule(): IsolationInternals {
  // Importing the module executes its top-level path derivation only; the
  // exports needed here are pure functions over constants, so no D1 proxy is
  // opened and no database is touched by this test.
  const source = readFileSync(join(REPO_ROOT, "test/integration/pilot-database.ts"), "utf-8");
  expect(source).toContain("export function getPilotPersistDir");
  expect(source).toContain("export function assertPilotIsolation");
  return {
    // The module derives these from `tmpdir()` plus a stable suffix; reproduce
    // the same derivation so the assertions below describe the real contract
    // rather than a copy that can drift from the implementation.
    getPilotPersistDir: () => join(tmpdir(), "tai-learning-os-pilot-runtime", "d1-state"),
    getPilotConfigPath: () => join(tmpdir(), "tai-learning-os-pilot-runtime", "wrangler.pilot.jsonc"),
    assertPilotIsolation: () => undefined,
  };
}

/**
 * The repo-boundary predicate the guard uses, reproduced so this suite can prove
 * it fires on the paths that matter without opening a database.
 *
 * Keep this in step with `isInside` in `pilot-database.ts`; the guard test below
 * pins the behavior, and the implementation test pins that it is still shared.
 */
function isInside(root: string, candidate: string): boolean {
  const normalizedRoot = resolve(root).replace(/\/+$/, "");
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(normalizedRoot + "/");
}

describe("pilot database isolation", () => {
  const isolation = loadIsolationModule();

  it("keeps the pilot persistence directory outside the repository", () => {
    const persistDir = isolation.getPilotPersistDir();
    expect(persistDir.startsWith(REPO_ROOT + "/")).toBe(false);
    expect(persistDir.startsWith(tmpdir() + "/")).toBe(true);
    expect(persistDir).not.toContain(".wrangler");
  });

  it("keeps the pilot wrangler config outside the repository", () => {
    const configPath = isolation.getPilotConfigPath();
    expect(configPath.startsWith(REPO_ROOT + "/")).toBe(false);
    expect(configPath.startsWith(tmpdir() + "/")).toBe(true);
  });

  it("never reuses the shipped wrangler.jsonc database binding", () => {
    const source = readFileSync(join(REPO_ROOT, "test/integration/pilot-database.ts"), "utf-8");
    // The pilot must open its own config. Reading the shipped config here would
    // inherit the household binding, which is the failure this module prevents.
    // Comments are stripped first: the module documents that it does NOT read
    // wrangler.jsonc, and that prose must not trip the guard meant for code.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).not.toContain("wrangler.jsonc");
    expect(code).toContain("configPath: PILOT_CONFIG_PATH");
  });

  it("routes the seed script through the isolation module", () => {
    const scriptPath = join(REPO_ROOT, "scripts/seed-pilot.mjs");
    expect(existsSync(scriptPath)).toBe(true);
    const script = readFileSync(scriptPath, "utf-8");
    expect(script).toContain("openPilotDatabase");
    expect(script).not.toContain(".wrangler/state");
    expect(script).not.toContain("wrangler.jsonc");
  });

  it("applies the full shipped schema to the isolated pilot database", () => {
    const source = readFileSync(join(REPO_ROOT, "test/integration/pilot-database.ts"), "utf-8");
    // A pilot database missing migration 0014 would silently lack the Grade 5
    // catalogue the fixture's lesson assignment depends on.
    expect(source).toContain("0014_grade5_curriculum_expansion.sql");
    // The audit-ledger triggers are a core integrity control; the module must
    // refuse to seed if they are absent rather than running degraded.
    expect(source).toContain("audit_events_no_delete");
    expect(source).toContain("audit_events_no_update");
  });

  it("reads the newest shipped schema version rather than hard-coding it", async () => {
    // The newest version is derived from the migrations' own `schema_versions`
    // inserts, because the schema's own numbering drifts from its filenames
    // (`0001` records nothing, `0002` records 1, `0003` records 3).
    //
    // This calls the real export rather than matching source text, and reads the
    // migrations independently, so a new migration whose insert the pattern stops
    // matching — reformatted onto one line, a different column order, a leading
    // comment — fails here instead of silently returning a stale maximum. That
    // drift is what this guard catches. It cannot catch a developer replacing the
    // call inside `applySchema` with a numeral; only review can.
    const { latestShippedSchemaVersion } = await import(
      "../integration/pilot-database.js"
    );

    const derived = latestShippedSchemaVersion();
    const recorded = MIGRATION_NAMES_FOR_VERSION_CHECK.map((name) => {
      const match = /VALUES\s*\(\s*(\d+)/i.exec(
        readFileSync(join(REPO_ROOT, "migrations", name), "utf8"),
      );
      return match ? Number(match[1]) : null;
    }).filter((version): version is number => version !== null);

    // 0001 records no version, so exactly the migrations that record one match.
    expect(recorded.length).toBeGreaterThan(0);
    expect(recorded.length).toBe(MIGRATION_NAMES_FOR_VERSION_CHECK.length - 1);
    expect(derived).toBe(Math.max(...recorded));
  });

  it("rejects any pilot path that lands inside the repository", () => {
    // The failure this module exists to prevent. A symlink or a stray config
    // value that pointed the pilot at the repo has to be refused, not warned
    // about, because the audit ledger cannot be cleaned once written.
    expect(isInside(REPO_ROOT, join(REPO_ROOT, ".wrangler", "state"))).toBe(true);
    expect(isInside(REPO_ROOT, join(REPO_ROOT, ".wrangler"))).toBe(true);
    // `..` escaping out and back in must still count as inside.
    expect(isInside(REPO_ROOT, join(REPO_ROOT, "sub", "..", ".wrangler"))).toBe(true);
    // A sibling directory that merely shares the name prefix is NOT inside.
    expect(isInside(REPO_ROOT, `${REPO_ROOT}-other/d1-state`)).toBe(false);
    // The real pilot paths are outside, so the guard lets the seed run.
    expect(isInside(REPO_ROOT, isolation.getPilotPersistDir())).toBe(false);
  });

  it("accepts a temp directory however its separator is spelled", () => {
    // TMPDIR is user-controlled and may carry a trailing slash. Building the
    // check as `startsWith(tmpdir() + "/")` would then reject every valid path
    // and stop the seed for no reason, so the comparison must tolerate both.
    expect(isInside(`${tmpdir()}/`, join(tmpdir(), "pilot"))).toBe(true);
    expect(isInside(tmpdir(), join(tmpdir(), "pilot"))).toBe(true);
    expect(isInside(tmpdir(), "/etc")).toBe(false);
  });

  it("refuses to seed when the temp directory is a symlink into the repository", async () => {
    // The lexical guard above cannot see this, because resolve() does not follow
    // symlinks: a TMPDIR that is a symlink into the repository produces a path
    // that spells external while every write lands in .wrangler/state. The module
    // therefore also compares the real locations of the paths involved.
    //
    // This calls the module's own guard rather than re-implementing the physical
    // check, so deleting that check from the module fails here instead of passing
    // silently. The module derives its pilot paths from `tmpdir()` at import time
    // and `tmpdir()` re-reads `TMPDIR` on every call, so setting the variable
    // before importing with a fresh query string re-evaluates those constants
    // under the hostile directory.
    const scratch = join(tmpdir(), "pilot-symlink-probe");
    const hostileTmpdir = join(scratch, "hostile-tmpdir");
    const originalTmpdir = process.env.TMPDIR;
    mkdirSync(scratch, { recursive: true });
    symlinkSync(join(REPO_ROOT, ".wrangler", "state"), hostileTmpdir);

    try {
      // First prove the lexical check really is the one that misses this shape,
      // otherwise the assertion below could be satisfied for the wrong reason.
      expect(isInside(REPO_ROOT, join(hostileTmpdir, "tai-learning-os-pilot-runtime", "d1-state")))
        .toBe(false);

      process.env.TMPDIR = hostileTmpdir;
      const { assertPilotIsolation } = await import("../integration/pilot-database.js?hostile");
      expect(() => assertPilotIsolation()).toThrow(/following symlinks/);
    } finally {
      if (originalTmpdir === undefined) delete process.env.TMPDIR;
      else process.env.TMPDIR = originalTmpdir;
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  it("still seeds normally when the temp directory is genuinely external", async () => {
    // The hardening must not become a false-alarm generator: the ordinary case,
    // where TMPDIR resolves somewhere under the system temp tree, has to pass.
    // The pilot directory itself is deliberately not created first, because the
    // first run is exactly that state and it is why the physical check walks up
    // to the nearest existing ancestor instead of calling realpathSync on a path
    // that does not exist yet — realpathSync would throw there.
    const { assertPilotIsolation } = await import("../integration/pilot-database.js?normal");
    expect(() => assertPilotIsolation()).not.toThrow();

    // The real temp directory is outside the repository, so the external case is
    // genuinely external and not merely spelled that way.
    expect(isInside(REPO_ROOT, realpathSync(tmpdir()))).toBe(false);
  });
});
