import { defineConfig } from "vitest/config";

/**
 * Integration suite configuration.
 *
 * These tests drive the shipped Worker's real fetch handler against an isolated
 * local D1 SQLite database (`node:sqlite` `DatabaseSync` in `test/integration/test-db.ts`)
 * with all shipped `migrations/` applied. They run in the Node environment
 * rather than the workers runtime so `migrations/` can be read directly from
 * disk and applied deterministically without invoking Wrangler's platform proxy.
 *
 * Nothing in this file can deploy, and no real secret is read from the
 * environment: the suites supply their own test values at request time.
 */

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    // The suites call the Worker directly against an isolated node:sqlite D1
    // database under tmpdir().
    pool: "threads",
    // One process per test file. The integration suites share the isolated
    // test SQLite database under tmpdir(), and SQLite allows only one writer at
    // a time: isolating the files gives each suite exclusive access during its run.
    fileParallelism: false,
    isolate: true,
    hookTimeout: 30_000,
  },
});
