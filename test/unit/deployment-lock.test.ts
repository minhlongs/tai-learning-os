import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Static guard for the deployment lock in `wrangler.jsonc`.
 *
 * `database_id: "local-only"` is not a Cloudflare identifier and never will be,
 * which is why `wrangler deploy` fails against it. That protection is invisible
 * at runtime — nothing rejects the build if someone replaces the value with a
 * real UUID, and the next deploy silently points at a real database holding a
 * child's learning history. A runtime check cannot catch this; only a test that
 * reads the committed config can.
 *
 * The file is JSONC and no JSONC parser is a declared dependency, so comments
 * are stripped here rather than relying on a transitive package.
 *
 * Paths resolve from `import.meta.url`, not `process.cwd()`, so the test reads
 * the same file however it is invoked.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");

/** Removes `/* … *\/` and `// …` so a commented-out value cannot satisfy a check. */
function stripJsoncComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const WRANGLER_JSONC = readFileSync(join(REPO_ROOT, "wrangler.jsonc"), "utf8");
const WRANGLER_CODE = stripJsoncComments(WRANGLER_JSONC);

type WranglerConfig = {
  name: string;
  main: string;
  d1_databases: {
    binding: string;
    database_name: string;
    database_id: string;
    preview_database_id?: string;
  }[];
  vars?: Record<string, string>;
  env?: Record<string, unknown>;
};

const CONFIG = JSON.parse(WRANGLER_CODE) as WranglerConfig;

describe("wrangler.jsonc — deployment lock", () => {
  it("keeps database_id as the non-existent local-only placeholder", () => {
    expect(CONFIG.d1_databases).toHaveLength(1);
    const [database] = CONFIG.d1_databases;
    expect(database?.binding).toBe("DB");
    // A real Cloudflare D1 id is a 32-hex-character UUID. Anything else here
    // means the placeholder survived; anything else is worth a human review.
    expect(database?.database_id).toBe("local-only");
  });

  it("keeps the preview database on its placeholder too", () => {
    expect(CONFIG.d1_databases[0]?.preview_database_id).toBe("local-preview");
  });

  it("declares no environment override that could re-point the database", () => {
    // An `env.production` block is the documented way to ship a second
    // configuration. Its absence means there is exactly one database binding in
    // the repository, and it is the locked one.
    expect(CONFIG.env).toBeUndefined();
  });

  it("does not declare ENVIRONMENT, so a deploy inherits the strict guard", () => {
    // `ENVIRONMENT: "development"` in base vars would switch off the
    // PARENT_PASSWORD_HASH requirement for anyone who deployed this file.
    expect(CONFIG.vars ?? {}).not.toHaveProperty("ENVIRONMENT");
    expect(WRANGLER_CODE).not.toContain("ENVIRONMENT");
  });

  it("carries no secret values in vars", () => {
    const vars = CONFIG.vars ?? {};
    expect(vars).not.toHaveProperty("SESSION_SECRET");
    expect(vars).not.toHaveProperty("PARENT_PASSWORD_HASH");
  });

  it("states the LOCAL ONLY restriction in a comment the stripper would remove", () => {
    // Proves the comment is really there for a human reader, while the
    // assertions above prove nothing relies on it being present.
    expect(WRANGLER_JSONC).toContain("LOCAL ONLY");
    expect(WRANGLER_CODE).not.toContain("LOCAL ONLY");
  });
});
