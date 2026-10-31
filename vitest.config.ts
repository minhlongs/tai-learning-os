import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * Unit test suite.
 *
 * These suites are pure logic: answer validation, hint policy, competency
 * derivation, review scheduling, exercise-schema validation, and transfer
 * envelope shape. Nothing in them touches D1, the network, or a Workers
 * runtime, so the default `node` environment is the fastest and most
 * reproducible choice. Web-crypto-dependent suites (password/session/timing)
 * live in `test/integration/` and run in the real workers runtime where
 * `crypto.subtle`, `btoa` and `atob` are platform primitives rather than
 * Node shims.
 */
export default defineConfig({
  root: ROOT,
  test: {
    include: ["test/unit/**/*.test.ts"],
    environment: "node",
    globals: false,
    restoreMocks: true,
    reporters: ["default"],
  },
});
