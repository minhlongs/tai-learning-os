import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const sysTmp = resolve(tmpdir());
const e2ePersistPath = process.env.TLO_E2E_PERSIST_PATH
  ? resolve(process.env.TLO_E2E_PERSIST_PATH)
  : "";

if (!e2ePersistPath || !e2ePersistPath.startsWith(sysTmp)) {
  throw new Error(
    `Playwright E2E requires an isolated temporary persistence path inside ${sysTmp} (received TLO_E2E_PERSIST_PATH=${JSON.stringify(process.env.TLO_E2E_PERSIST_PATH)}). Run via "npm run test:e2e".`,
  );
}

/**
 * E2E configuration: the real app, served by an isolated Vite + Cloudflare workerd
 * server on port 8792 backed exclusively by a temporary D1 database in os.tmpdir().
 *
 * It never touches `.wrangler/state`, `.dev.vars`, or port `8791`, and refuses to
 * reuse any pre-existing server (`reuseExistingServer: false`).
 */
export default defineConfig({
  testDir: "./test/e2e",
  // Serial by design: the fixtures create and delete the parent's single
  // learner, and two specs doing that at once cannot both be correct.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "line" : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:8792",
    trace: "retain-on-failure",
    // Screenshots and traces are evidence for visual QA; keeping them is the
    // point, and they are gitignored so they never reach a commit.
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      // An iPad/tablet viewport to verify responsive layout across all three required form factors.
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 820, height: 1180 },
        isMobile: true,
        hasTouch: true,
        userAgent: `${devices["Desktop Chrome"].userAgent} Tablet/1.0`,
      },
    },
    {
      // An iPhone-sized viewport, because the learner uses this on a phone.
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    command: "npx vite dev --port 8792 --strictPort",
    url: "http://localhost:8792/api/session",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
