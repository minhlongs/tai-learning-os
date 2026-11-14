import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createBuilder } from "vite";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..");
const CANARY_SECRET = "canary-build-secret-must-never-ship-to-dist";
const CANARY_HASH = "canary-password-hash-must-never-ship-to-dist";

function listAllFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...listAllFiles(full));
    } else {
      found.push(full);
    }
  }
  return found;
}

describe("production build secret exclusion", () => {
  it(
    "never emits .dev.vars or canary secrets into built worker or client output, even in clean CI checkouts",
    async () => {
      const outRoot = mkdtempSync(join(tmpdir(), "tlo-build-guard-"));
      const configDir = join(outRoot, "config");
      const persistDir = join(outRoot, "persist");
      mkdirSync(configDir, { recursive: true });
      mkdirSync(persistDir, { recursive: true });

      const wranglerConfigPath = join(configDir, "wrangler.jsonc");
      writeFileSync(
        wranglerConfigPath,
        JSON.stringify(
          {
            name: "tai-learning-os-build-guard",
            main: join(REPO_ROOT, "src/worker/index.ts"),
            compatibility_date: "2026-10-24",
            assets: { not_found_handling: "single-page-application" },
            d1_databases: [
              {
                binding: "DB",
                database_name: "tai-learning-os",
                database_id: "local-only",
                preview_database_id: "local-preview",
              },
            ],
            vars: {},
          },
          null,
          2,
        ),
        "utf8",
      );

      // Seed synthetic .dev.vars and .dev.vars.production files next to the
      // Wrangler config so this test fails in GitHub Actions CI (where gitignored
      // REPO_ROOT/.dev.vars is absent) if the Vite build guard ever regresses.
      writeFileSync(
        join(configDir, ".dev.vars"),
        `SESSION_SECRET="${CANARY_SECRET}"\nPARENT_PASSWORD_HASH="${CANARY_HASH}"\n`,
        "utf8",
      );
      writeFileSync(
        join(configDir, ".dev.vars.production"),
        `SESSION_SECRET="${CANARY_SECRET}-prod"\n`,
        "utf8",
      );

      const prevEnv = {
        TLO_E2E_ISOLATED: process.env.TLO_E2E_ISOLATED,
        TLO_E2E_WRANGLER_CONFIG: process.env.TLO_E2E_WRANGLER_CONFIG,
        TLO_E2E_PERSIST_PATH: process.env.TLO_E2E_PERSIST_PATH,
      };
      process.env.TLO_E2E_ISOLATED = "1";
      process.env.TLO_E2E_WRANGLER_CONFIG = wranglerConfigPath;
      process.env.TLO_E2E_PERSIST_PATH = persistDir;

      try {
        const builder = await createBuilder({
          root: REPO_ROOT,
          configFile: join(REPO_ROOT, "vite.config.ts"),
          logLevel: "silent",
          environments: {
            client: {
              build: { outDir: join(outRoot, "client"), emptyOutDir: true },
            },
            worker: {
              build: { outDir: join(outRoot, "worker"), emptyOutDir: true },
            },
          },
        });

        await builder.buildApp();

        const workerOutDir = join(outRoot, "worker");
        const clientOutDir = join(outRoot, "client");
        expect(existsSync(join(workerOutDir, "index.js"))).toBe(true);
        expect(existsSync(join(workerOutDir, "wrangler.json"))).toBe(true);
        expect(existsSync(join(clientOutDir, "index.html"))).toBe(true);

        const emittedFiles = [...listAllFiles(workerOutDir), ...listAllFiles(clientOutDir)];
        expect(
          emittedFiles.filter((filePath) =>
            filePath.split(/[/\\]/u).some((segment) => segment.startsWith(".dev.vars")),
          ),
        ).toEqual([]);

        for (const filePath of emittedFiles) {
          const text = readFileSync(filePath, "utf8");
          expect(text).not.toContain(CANARY_SECRET);
          expect(text).not.toContain(CANARY_HASH);
        }

        const emittedWrangler = JSON.parse(
          readFileSync(join(workerOutDir, "wrangler.json"), "utf8"),
        ) as {
          d1_databases?: { binding: string }[];
          assets?: { not_found_handling?: string };
        };
        expect(emittedWrangler.d1_databases?.[0]?.binding).toBe("DB");
        expect(emittedWrangler.assets?.not_found_handling).toBe("single-page-application");
      } finally {
        if (prevEnv.TLO_E2E_ISOLATED === undefined) delete process.env.TLO_E2E_ISOLATED;
        else process.env.TLO_E2E_ISOLATED = prevEnv.TLO_E2E_ISOLATED;

        if (prevEnv.TLO_E2E_WRANGLER_CONFIG === undefined) delete process.env.TLO_E2E_WRANGLER_CONFIG;
        else process.env.TLO_E2E_WRANGLER_CONFIG = prevEnv.TLO_E2E_WRANGLER_CONFIG;

        if (prevEnv.TLO_E2E_PERSIST_PATH === undefined) delete process.env.TLO_E2E_PERSIST_PATH;
        else process.env.TLO_E2E_PERSIST_PATH = prevEnv.TLO_E2E_PERSIST_PATH;

        rmSync(outRoot, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
