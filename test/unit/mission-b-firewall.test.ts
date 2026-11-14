import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Static guard for the Mission B firewall.
 *
 * Mission B — the commercial product — is not built. What exists is a boundary:
 * `wrangler.mission-b.jsonc` names a Worker that cannot start, against a
 * database that does not exist, with a binding name no Mission A code declares.
 * The value of that boundary is entirely in it staying untraversed, and nothing
 * at runtime notices if it stops being so. A single import of the commercial
 * bucket name into the household Worker, a single script that passes this file
 * as `configPath`, or a `main` that starts resolving would all keep every other
 * test green while quietly erasing the distinction between the product that is
 * allowed to run and the one that is not.
 *
 * So the assertions below are about absence, which is what makes this kind of
 * guard necessary: the failure mode is something appearing, not something
 * breaking. Comments are stripped before every "does not contain" check, because
 * a file may legitimately *describe* the firewall in prose — the household
 * config documents it, for instance — and that prose must not be mistaken for
 * code that uses it.
 *
 * Paths resolve from `import.meta.url`, not `process.cwd()`.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");

/**
 * Removes `/* … *\/` and `// …` so a commented-out value cannot satisfy a check.
 *
 * The scan is string-aware on purpose. A line-based regex is wrong in both
 * directions wherever a URL appears before a comment on the same line:
 * `const u = "https://x"; const c = "wrangler.mission-b.jsonc";` loses
 * everything from the `//` in `https://` onward, so code that really does name
 * the firewall reads as absent. That is a guard reporting "nothing here" about
 * the exact thing it exists to find. Tracking quote state — including escapes
 * and template literals — makes the removed text exactly the comments.
 */
function stripJsoncComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (ch === '"' || ch === "'" || ch === "`") {
      // Copy the whole string literal verbatim, honouring backslash escapes.
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") {
          j += 2;
          continue;
        }
        if (source[j] === ch) {
          j += 1;
          break;
        }
        j += 1;
      }
      out += source.slice(i, j);
      i = j;
      continue;
    }

    if (ch === "/" && next === "/") {
      const lineEnd = source.indexOf("\n", i);
      i = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (ch === "/" && next === "*") {
      const blockEnd = source.indexOf("*/", i + 2);
      i = blockEnd === -1 ? source.length : blockEnd + 2;
      continue;
    }

    out += ch;
    i += 1;
  }
  return out;
}

/** Removes `/* … *\/`, `// …` and (for TS) whole-line `* …` doc bodies from code. */
function stripComments(source: string): string {
  return stripJsoncComments(source);
}

type D1Binding = {
  binding: string;
  database_name: string;
  database_id: string;
  preview_database_id?: string;
};

type WranglerConfig = {
  name: string;
  main: string;
  keep_vars?: boolean;
  d1_databases: D1Binding[];
  vars?: Record<string, string>;
};

const HOUSEHOLD_RAW = readFileSync(join(REPO_ROOT, "wrangler.jsonc"), "utf8");
const HOUSEHOLD = JSON.parse(stripJsoncComments(HOUSEHOLD_RAW)) as WranglerConfig;

const MISSION_B_PATH = join(REPO_ROOT, "wrangler.mission-b.jsonc");
const MISSION_B_RAW = readFileSync(MISSION_B_PATH, "utf8");
const MISSION_B = JSON.parse(stripJsoncComments(MISSION_B_RAW)) as WranglerConfig;

const MISSION_B_BINDING = MISSION_B.d1_databases[0]?.binding ?? "";
const MISSION_B_DATABASE_NAME = MISSION_B.d1_databases[0]?.database_name ?? "";
const MISSION_B_WORKER_NAME = MISSION_B.name;

/** This file — it necessarily names the paths and binding its guard forbids. */
const SELF = "test/unit/mission-b-firewall.test.ts";

/** Every committed source file a Mission A change could plausibly land in. */
function sourceFiles(): string[] {
  const roots = [join(REPO_ROOT, "src"), join(REPO_ROOT, "scripts"), join(REPO_ROOT, "test")];
  const files: string[] = [];
  for (const root of roots) {
    for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) continue;
      files.push(join(entry.parentPath, entry.name));
    }
  }
  return files;
}

const SOURCE_FILES = sourceFiles();

/** A Cloudflare D1 identifier is 32 lowercase hex characters. */
const CLOUDFLARE_ID = /^[0-9a-f]{32}$/;

describe("Mission B firewall config", () => {
  it("exists and parses as JSONC", () => {
    expect(existsSync(MISSION_B_PATH)).toBe(true);
    expect(MISSION_B.d1_databases.length).toBe(1);
  });

  it("names a Worker and a database distinct from the household pair", () => {
    expect(MISSION_B_WORKER_NAME).not.toBe(HOUSEHOLD.name);
    expect(MISSION_B_DATABASE_NAME).not.toBe(HOUSEHOLD.d1_databases[0]?.database_name);
    // The binding is the part code actually references. Sharing `DB` would make
    // every existing query a Mission B query the moment the config loaded.
    expect(MISSION_B_BINDING).not.toBe("");
    expect(MISSION_B_BINDING).not.toBe(HOUSEHOLD.d1_databases[0]?.binding);
  });

  it("carries a placeholder database id that cannot resolve", () => {
    const binding = MISSION_B.d1_databases[0] as D1Binding;
    expect(binding.database_id).not.toMatch(CLOUDFLARE_ID);
    expect(binding.preview_database_id ?? binding.database_id).not.toMatch(CLOUDFLARE_ID);
    expect(binding.database_id.startsWith("unprovisioned-")).toBe(true);
  });

  it("declares no secrets and inherits no dashboard variables", () => {
    expect(MISSION_B.keep_vars).toBe(false);
    expect(MISSION_B.vars ?? {}).not.toHaveProperty("SESSION_SECRET");
    expect(MISSION_B.vars ?? {}).not.toHaveProperty("PARENT_PASSWORD_HASH");
    expect(Object.keys(MISSION_B.vars ?? {})).toEqual([]);
  });

  it("points `main` at a file that does not exist, so a deploy cannot start", () => {
    // This is the difference between "not activated" and "activated but idle".
    // The moment someone creates the entry point, this test fails and the
    // activation becomes a reviewable decision instead of a stray commit.
    const entry = join(REPO_ROOT, MISSION_B.main);
    expect(existsSync(entry)).toBe(false);
  });

  it("is not a deployable household lock: the household config stays as pinned", () => {
    // Restating the deployment-lock invariants here keeps the two guards from
    // drifting apart. If either file changes shape, one of them notices.
    expect(HOUSEHOLD.d1_databases.length).toBe(1);
    expect(HOUSEHOLD.d1_databases[0]?.database_id).toBe("local-only");
    expect((HOUSEHOLD as { env?: unknown }).env).toBeUndefined();
  });
});

describe("Mission B is not wired to any run path", () => {
  it("is never referenced by the household config", () => {
    expect(stripJsoncComments(HOUSEHOLD_RAW)).not.toContain("mission-b");
    expect(stripJsoncComments(HOUSEHOLD_RAW)).not.toContain(MISSION_B_BINDING);
  });

  it("is never passed as a wrangler config path", () => {
    const offenders = SOURCE_FILES.filter((file) => {
      if (relative(REPO_ROOT, file) === SELF) return false;
      const code = stripComments(readFileSync(file, "utf8"));
      return code.includes("wrangler.mission-b");
    }).map((file) => relative(REPO_ROOT, file));
    expect(offenders).toEqual([]);
  });

  it("is never reached by the build, dev server or CI config", () => {
    for (const name of ["vite.config.ts", "playwright.config.ts", "package.json"]) {
      const path = join(REPO_ROOT, name);
      if (!existsSync(path)) continue;
      expect(stripComments(readFileSync(path, "utf8"))).not.toContain("mission-b");
    }
    const ciPath = join(REPO_ROOT, ".github/workflows/ci.yml");
    if (existsSync(ciPath)) {
      expect(readFileSync(ciPath, "utf8")).not.toContain("mission-b");
    }
  });

  it("has no Mission A code that binds its database", () => {
    // The binding name is the seam. Any `src/` file mentioning it means Mission A
    // code was written against commercial data, however the config is loaded.
    const offenders = SOURCE_FILES.filter((file) => {
      const code = stripComments(readFileSync(file, "utf8"));
      return code.includes(MISSION_B_BINDING) || code.includes(MISSION_B_DATABASE_NAME);
    })
      .map((file) => relative(REPO_ROOT, file))
      .filter((file) => file !== SELF);
    expect(offenders).toEqual([]);
  });

  it("has no runtime env contract for it", () => {
    const middleware = readFileSync(join(REPO_ROOT, "src/worker/http/middleware.ts"), "utf8");
    expect(stripComments(middleware)).not.toContain(MISSION_B_BINDING);
  });
});

describe("Mission B activation stays a documented, signed decision", () => {
  it("states in the config itself that it is not active", () => {
    // Prose is allowed to describe the firewall; that is the point of checking
    // the raw text rather than the stripped code.
    expect(MISSION_B_RAW).toContain("NOT ACTIVE");
    expect(stripJsoncComments(MISSION_B_RAW)).not.toContain("NOT ACTIVE");
  });

  it("names the owner-authorization prerequisites it is blocked on", () => {
    expect(MISSION_B_RAW).toContain("ROADMAP_90_DAYS.md");
    expect(MISSION_B_RAW).toContain("founder written authorization");
  });

  it("is backed by a written risk assessment for keeping the repository public", () => {
    const riskPath = join(REPO_ROOT, "docs/audits/MISSION_B_PUBLIC_REPO_RISK.md");
    expect(existsSync(riskPath)).toBe(true);
    expect(readFileSync(riskPath, "utf8")).toContain("MISSION-B");
  });
});

describe("the comment stripper cannot hide the firewall behind a URL", () => {
  // The guard's "does not contain" checks are only as good as this function.
  // A line-based `//` strip truncates a line at the `//` inside `https://`,
  // which turns real wiring into apparent absence — the guard would report the
  // firewall untouched while a run path pointed straight at it.
  it("keeps code that follows a URL on the same line", () => {
    const source = `const u = "https://example.com"; const c = "wrangler.mission-b.jsonc";`;
    expect(stripJsoncComments(source)).toContain("wrangler.mission-b.jsonc");
  });

  it("still removes real line comments, including ones mentioning the firewall", () => {
    const source = `// see wrangler.mission-b.jsonc\nconst keep = 1;`;
    expect(stripJsoncComments(source)).not.toContain("mission-b");
    expect(stripJsoncComments(source)).toContain("const keep = 1;");
  });

  it("still removes block comments spanning lines", () => {
    const source = `/*\n * wrangler.mission-b.jsonc\n */\nconst keep = 1;`;
    expect(stripJsoncComments(source)).not.toContain("mission-b");
    expect(stripJsoncComments(source)).toContain("const keep = 1;");
  });

  it("does not treat an escaped quote as the end of a string literal", () => {
    const source = `const s = "a \\" // b"; const c = "wrangler.mission-b.jsonc";`;
    expect(stripJsoncComments(source)).toContain("wrangler.mission-b.jsonc");
  });

  it("keeps a `//` inside a template literal", () => {
    const source = "const t = `https://x`; const c = \"wrangler.mission-b.jsonc\";";
    expect(stripJsoncComments(source)).toContain("wrangler.mission-b.jsonc");
  });
});
