import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration: the real app, served by the real dev server.
 *
 * `npm run dev` starts Vite with the Cloudflare plugin, which runs the Worker
 * inside workerd against the local D1 file — so an E2E run exercises the same
 * Worker code, the same route table and the same migrations the app ships with.
 * There is no mock server and no stubbed API in this configuration.
 *
 * The suite is serial and runs one worker at a time. It drives a shared local
 * database through destructive sequences (enrol, delete, restart), so parallel
 * files would fight over the same rows.
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
    baseURL: "http://localhost:8791",
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

  // Starts the dev server and reuses one already running, so a developer with
  // the app open does not get a second instance on the same port.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8791/api/session",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
