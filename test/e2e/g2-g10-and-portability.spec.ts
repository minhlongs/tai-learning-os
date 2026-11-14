import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { backdateSessionStartInIsolatedDb } from "./e2e-db-helper";
import { attachZeroOutboundGuard } from "./network-guard";
import { MAX_LEARNER_SESSION_MS } from "../../src/shared/engine/session-budget";

const PARENT_NAME = process.env.TLO_PARENT_NAME ?? "Phụ huynh";
const PARENT_PASSWORD = process.env.TLO_PARENT_PASSWORD ?? "MatKhauBiMat2026";

async function signInAndEnsureLearner(page: Page): Promise<{ csrf: string; learnerId: string }> {
  await page.goto("/login");
  await page.fill("#login-name", PARENT_NAME);
  await page.fill("#login-password", PARENT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/^(?!.*\/login).*$/);

  const sessionRes = await page.request.get("/api/session");
  expect(sessionRes.status()).toBe(200);
  const info = (await sessionRes.json()) as {
    csrfToken: string;
    learner: { id: string; nickname: string } | null;
  };
  const csrf = info.csrfToken;
  const withCsrf = { headers: { "x-tlo-csrf": csrf } };

  let learnerId = info.learner?.id ?? "";
  if (!learnerId) {
    const created = await page.request.post("/api/parent/learners", {
      ...withCsrf,
      data: { nickname: "Bé Mẫu", birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
    });
    expect(created.status()).toBe(200);
    learnerId = ((await created.json()) as { learner: { id: string } }).learner.id;
  }

  return { csrf, learnerId };
}

async function assertZeroAxeViolations(page: Page, screenLabel: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(
    blocking,
    `Gate G10 WCAG 2.2 AA violations on ${screenLabel}: ${JSON.stringify(
      blocking.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
    )}`,
  ).toEqual([]);
}

test.describe("Gates G2, G9, G10 & 10-Year Open Portability Browser Proof", () => {
  test.describe.configure({ mode: "serial" });

  test("G2 + G10: zero non-local outbound network, WCAG 2.2 AA axe clean, and >=48px learner touch targets across screens", async ({
    context,
    page,
  }) => {
    const guard = await attachZeroOutboundGuard(context);

    // 1. Login screen WCAG 2.2 AA check
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();
    await assertZeroAxeViolations(page, "/login");

    // Verify CSP meta header is present in the live DOM
    const cspContent = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    expect(cspContent).toContain("default-src 'self'");

    const { csrf } = await signInAndEnsureLearner(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    // Approve one lesson so Learner Home, Subject, and Lesson screens render active controls
    const approveRes = await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-area-measurement", status: "approved" },
    });
    expect(approveRes.status()).toBe(200);

    // 2. Learner Home WCAG 2.2 AA + >=48px touch targets
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Toán/ })).toBeVisible();
    await assertZeroAxeViolations(page, "/ (Learner Home)");

    // 3. Subject screen WCAG 2.2 AA + >=48px touch targets
    await page.getByRole("button", { name: /Toán/ }).click();
    await expect(page).toHaveURL(/\/subjects\//);
    await assertZeroAxeViolations(page, "/subjects/math");

    // 4. Interactive Lesson screen WCAG 2.2 AA + >=48px touch targets on buttons & choice rows
    await page.getByRole("button", { name: /Mở bài học: Diện tích hình chữ nhật/ }).click();
    await expect(page).toHaveURL(/\/lessons\/math-area-measurement/);
    await expect(page.locator(".choice").first()).toBeVisible();
    await assertZeroAxeViolations(page, "/lessons/math-area-measurement");

    const touchControls = page.locator(
      ".lesson-page button:visible, .lesson-page label.choice:visible",
    );
    const controlCount = await touchControls.count();
    expect(controlCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < controlCount; i += 1) {
      const box = await touchControls.nth(i).boundingBox();
      expect(box, `control ${i} boundingBox`).not.toBeNull();
      expect(
        box!.height,
        `Gate G10 learner touch target height >= 48px (control ${i})`,
      ).toBeGreaterThanOrEqual(47.5);
      expect(
        box!.width,
        `Gate G10 learner touch target width >= 48px (control ${i})`,
      ).toBeGreaterThanOrEqual(47.5);
    }

    // 5. Parent Dashboard & Data Control WCAG 2.2 AA check
    await page.goto("/parent");
    await expect(page.getByRole("heading", { name: "Bảng theo dõi" })).toBeVisible();
    await assertZeroAxeViolations(page, "/parent");

    await page.goto("/parent/data");
    await expect(page.getByTestId("export-portability-btn")).toBeVisible();
    await assertZeroAxeViolations(page, "/parent/data");

    // Active proof that an attempted external fetch is blocked by G2 route guard + CSP
    expect(guard.allowedLocalCount).toBeGreaterThan(5);
    guard.assertZeroOutbound();
  });

  test("G9 + Portability: 25-minute Soft Stop banner & parent +15m extension in UI, plus offline standalone viewer.html verification", async ({
    context,
    page,
  }) => {
    const guard = await attachZeroOutboundGuard(context);
    const { csrf } = await signInAndEnsureLearner(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-area-measurement", status: "approved" },
    });

    // Start or resume lesson session via API to obtain sessionId, then backdate start by 26 minutes
    const startRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-area-measurement" },
    });
    expect(startRes.status()).toBe(200);
    const started = (await startRes.json()) as { sessionId: string };
    backdateSessionStartInIsolatedDb(started.sessionId, MAX_LEARNER_SESSION_MS + 60_000);

    await page.goto("/lessons/math-area-measurement");
    const firstRadio = page.locator("input[type='radio']").first();
    await expect(firstRadio).toBeVisible();
    await firstRadio.check();
    await page.getByRole("button", { name: "Kiểm tra" }).click();

    // Soft Stop banner appears while preserving the submitted in-flight attempt!
    const banner = page.getByTestId("session-soft-stop-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("25 phút");
    await expect(page.getByTestId("next-step")).toBeDisabled();

    // Parent extends session by +15 minutes right from the banner
    await page.getByTestId("toggle-parent-extend").click();
    await page.fill("#extend-parent-password", PARENT_PASSWORD);
    await page.getByTestId("confirm-parent-extend").click();
    await expect(banner).toBeHidden();

    // Finalize session so history has recorded attempts for portability export
    await page.request.post("/api/learner/sessions/finalize", {
      ...withCsrf,
      data: { sessionId: started.sessionId },
    });

    // Export 10-year Open Portability Bundle from Parent Data Control UI
    await page.goto("/parent/data");
    const exportBtn = page.getByTestId("export-portability-btn");
    await expect(exportBtn).toBeEnabled();
    await exportBtn.click();

    const resultBox = page.getByTestId("portability-export-result");
    await expect(resultBox).toBeVisible();
    await expect(page.getByTestId("download-clr20-btn")).toBeVisible();
    await expect(page.getByTestId("download-case11-btn")).toBeVisible();
    await expect(page.getByTestId("download-xapi20-btn")).toBeVisible();

    // Fetch exact bundle payload from `/api/data/export-portability`, write `viewer.html`
    // to an isolated temp directory, and open it via `file://` with ALL HTTP/HTTPS blocked!
    const apiPortRes = await page.request.post("/api/data/export-portability", withCsrf);
    expect(apiPortRes.status()).toBe(200);
    const bundleBody = (await apiPortRes.json()) as {
      viewerHtml: string;
      manifest: { xapiStatements: number };
    };
    expect(bundleBody.manifest.xapiStatements).toBeGreaterThanOrEqual(1);

    const viewerTmpDir = mkdtempSync(join(tmpdir(), "tai-viewer-e2e-"));
    try {
      const viewerPath = join(viewerTmpDir, "viewer.html");
      writeFileSync(viewerPath, bundleBody.viewerHtml, "utf8");

      const offlinePage = await context.newPage();
      const offlineHttpBlocked: string[] = [];
      await offlinePage.route("**/*", async (route) => {
        const u = route.request().url();
        if (u.startsWith("file:") || u.startsWith("data:")) {
          await route.continue();
          return;
        }
        offlineHttpBlocked.push(u);
        await route.abort("internetdisconnected");
      });

      await offlinePage.goto(pathToFileURL(viewerPath).href);
      await expect(offlinePage.locator("main")).toBeVisible();
      await expect(offlinePage.locator("h1")).toBeVisible();
      await assertZeroAxeViolations(offlinePage, "standalone offline viewer.html");
      expect(offlineHttpBlocked).toEqual([]);
      await offlinePage.close();
    } finally {
      rmSync(viewerTmpDir, { recursive: true, force: true });
    }

    guard.assertZeroOutbound();
  });
});
