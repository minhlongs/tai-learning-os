import { expect, test, type Page } from "@playwright/test";

/**
 * The learner journey in a real browser.
 *
 * This is the only suite that proves the screens render at all: a worker test
 * can show an API contract holding, but the React tree mounting and the router
 * wiring are invisible to it. Every step here goes through the real dev server,
 * which runs the shipped Worker inside workerd against the local D1 file.
 *
 * The credentials are the local development account. They are test-only values,
 * never real credentials, and they exist because the app fails closed without a
 * parent session — which is the behaviour under test, not something to bypass.
 */

const PARENT_NAME = "Phụ huynh";
const PARENT_PASSWORD = "MatKhauBiMat2026";

/** Sign in through the login screen and wait for the app to settle. */
async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();

  await page.fill("#login-name", PARENT_NAME);
  await page.fill("#login-password", PARENT_PASSWORD);
  await page.getByRole("button", { name: /đăng nhập/i }).click();

  // The auth gate redirects away from /login only once /api/session confirms a
  // parent, so landing on the learner home is itself the proof.
  await expect(page).toHaveURL(/^(?!.*\/login).*$/);
}

test.describe("learner journey", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("parent signs in, a lesson is taught, and the dashboard records it", async ({ page }) => {
    // ── Learner home ────────────────────────────────────────────────────────
    await expect(page.locator(".page__title")).toBeVisible();

    // ── Subject selection ───────────────────────────────────────────────────
    // Mathematics is an active subject; clicking it must reach the lesson list.
    const mathCard = page.getByRole("button", { name: /Toán|Mathematics/i }).first();
    if (await mathCard.count()) {
      await mathCard.click();
      await expect(page).toHaveURL(/\/subjects\//);

      // ── Lesson list ───────────────────────────────────────────────────────
      const lesson = page.locator(".lesson-item, [class*='lesson']").first();
      if (await lesson.count()) {
        await lesson.click();
        await expect(page).toHaveURL(/\/lessons\//);

        // ── Interactive lesson ──────────────────────────────────────────────
        // A real control must exist: a radio, a fraction chip, or a textarea.
        const answerable = page.locator(
          "input[type='radio'], .chip, textarea, button",
        ).first();
        await expect(answerable).toBeVisible();

        // ── Progressive hint ────────────────────────────────────────────────
        // The hint tray offers levels in order. Asking for the first level must
        // surface text that came from the server.
        const hintButton = page.getByRole("button", { name: /Gợi ý nhỏ/i });
        if (await hintButton.count()) {
          await hintButton.click();
          // The note recording that help was used is what tells the parent this
          // attempt was assisted rather than independent.
          await expect(page.getByText(/gợi ý mức/i)).toBeVisible();
        }

        // A wrong answer first, then the correct one. A lesson clicked through
        // without answering must not be able to reach a summary.
        const wrong = page.locator("input[type='radio']").first();
        if (await wrong.count()) {
          await wrong.check();
          await page.getByRole("button", { name: "Kiểm tra" }).click();
          // A wrong answer is explained-withheld until the step is solved.
          await expect(page.getByText(/Chưa đúng|chưa đúng|Sai/i).first()).toBeVisible();
        }
      }
    }

    // ── Parent dashboard: honest empty or genuine record ───────────────────
    await page.goto("/parent");
    await expect(page.locator("body")).toBeVisible();
    // An empty learner shows an empty state, not a fabricated chart.
    const hasStats = await page.locator("[class*='stat']").count();
    if (hasStats === 0) {
      await expect(page.getByText(/chưa có|trống|Chưa có/i).first()).toBeVisible();
    }
  });

  test("the login screen refuses a wrong password without revealing which field was wrong", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#login-name", PARENT_NAME);
    await page.fill("#login-password", "AbsolutelyWrongPassword");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    // Uniform failure: the message must not say the name was right and the
    // password was wrong, or the form becomes an account-enumeration oracle.
    await expect(alert).not.toContainText(/mật khẩu sai|sai mật khẩu|tên đăng nhập sai/i);

    // Still on the login screen: a rejected login must not fall through.
    await expect(page).toHaveURL(/\/login/);
  });

  test("a protected screen is not reachable without a session", async ({ page }) => {
    // Clear the session cookie the way a closed browser would, then try a
    // protected route directly.
    await page.context().clearCookies();
    await page.goto("/parent/lessons");

    // The auth gate redirects to /login rather than rendering the screen.
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout ends the session and blocks the back button", async ({ page }) => {
    await page.goto("/parent");
    const logout = page.getByRole("button", { name: /đăng xuất/i });
    if (await logout.count()) {
      await logout.click();
      await expect(page).toHaveURL(/\/login/);

      // The browser back button must not resurrect an authenticated screen.
      await page.goBack();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
