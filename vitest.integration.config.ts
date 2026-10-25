import { defineConfig } from "vitest/config";

/**
 * Integration suite configuration.
 *
 * These tests drive the shipped Worker's real fetch handler against a real D1,
 * with the shipped `migrations/` applied. They run in the Node environment
 * rather than the workers runtime, because that runtime exposes no host
 * filesystem and so cannot read `migrations/` from disk to apply them.
 *
 * `getPlatformProxy` (from wrangler, the same tool `npm run dev` uses) reads the
 * shipped `wrangler.jsonc`, provisions the local bindings it declares and
 * applies the shipped migrations — so the schema under test is the one that
 * ships, not a copy of it.
 *
 * Nothing in this file can deploy, and no real secret is read from the
 * environment: the suites supply their own test values at request time.
 */

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    // The suites call the Worker directly and use wrangler's platform proxy for
    // D1. Neither needs the workers pool, whose service-binding requirement
    // would only add a configuration surface that cannot read the migrations.
    pool: "threads",
  },
});
