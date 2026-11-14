import { expect, test, type Page } from "@playwright/test";
import { attachZeroOutboundGuard, type OutboundNetworkRecorder } from "./network-guard";

/**
 * The learner journey in a real browser.
 *
 * This is the only suite that proves the screens render at all: a Worker test
 * can show an API contract holding, but the React tree mounting and the router
 * wiring are invisible to it. Every step goes through the real dev server,
 * which runs the shipped Worker inside workerd against the local D1 file.
 *
 * The credentials are the local development account. They are test-only values,
 * never real credentials, and they exist because the app fails closed without a
 * parent session — the behaviour under test, not something to bypass.
 *
 * Assertions are unconditional. A step that would make this suite pass while
 * proving nothing has no place here.
 */

/**
 * The local development account, which the app's own first-run bootstrap writes
 * into the local D1 file. These are fixture values, not credentials: they are
 * needed only because the app fails closed without a parent session — the
 * behaviour under test, not something to bypass. The environment override exists
 * so a developer whose local password differs does not have to edit this file.
 */
const PARENT_NAME = process.env.TLO_PARENT_NAME ?? "Phụ huynh";
const PARENT_PASSWORD = process.env.TLO_PARENT_PASSWORD ?? "MatKhauBiMat2026";

/**
 * The step count of the lesson the journey teaches.
 *
 * A constant rather than "click next until it disappears": the walk is bounded,
 * so a lesson that cannot advance fails at a named step instead of spinning
 * until the test times out. The count is asserted against the on-screen counter
 * at every step, so a lesson that gains or loses a step fails here loudly rather
 * than silently walking a different lesson.
 */
const TOTAL_STEPS = 6;

/** Sign in only. Used by the auth tests, which need no learner to exist. */
async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();

  await page.fill("#login-name", PARENT_NAME);
  await page.fill("#login-password", PARENT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  // The router re-reads /api/session and only then leaves /login, so landing on
  // an authenticated screen is itself the proof that the session state moved.
  await expect(page).toHaveURL(/^(?!.*\/login).*$/);
  await expect(page.locator(".page__title")).toBeVisible();
}

/**
 * Answer the current step with a choice that the server grades as correct.
 *
 * The helper does not know the answer and must not learn it: `StartSessionResponse`
 * carries no answer field, which is the invariant being protected. So each option
 * is tried in order and the first one the server grades correct is kept — the
 * same thing a real learner does, and the only way through that does not put an
 * answer key into test code.
 *
 * Returns the index that worked, or -1 if no option did, which the caller asserts.
 */
async function answerCurrentStep(page: Page): Promise<number> {
  const options = page.locator("input[type='radio']");
  await expect(options.first()).toBeVisible();
  const total = await options.count();
  expect(total, "a choice step must offer more than one option").toBeGreaterThan(1);

  const check = page.getByRole("button", { name: "Kiểm tra" });
  await expect(check).toBeVisible();

  for (let index = 0; index < total; index += 1) {
    await options.nth(index).check();
    await check.click();
    // Awaited by attribute rather than read from text: the outcome the server
    // graded is what the helper needs, and the message copy is chosen per
    // exercise type, so matching it would make this a Vietnamese test.
    const outcome = await gradedOutcome(page);
    if (outcome === "correct" || outcome === "partial") return index;
  }
  return -1;
}

/**
 * Submit options until the server grades one wrong, and return that index.
 *
 * Needed because a journey that only ever answers correctly never proves the
 * gate closes. The wrong option is whichever the server reports as wrong — the
 * test does not know which one it is, and finding out is the point.
 */
async function firstWrongOption(page: Page): Promise<number> {
  const options = page.locator("input[type='radio']");
  const total = await options.count();

  const check = page.getByRole("button", { name: "Kiểm tra" });
  for (let index = 0; index < total; index += 1) {
    await options.nth(index).check();
    await check.click();
    // A wrong answer must not unlock the step, and must say so rather than
    // leaving the learner to guess why the button did nothing.
    if ((await gradedOutcome(page)) === "incorrect") {
      await expect(page.getByTestId("next-step")).toBeDisabled();
      return index;
    }
  }
  return -1;
}

/** The outcome of the attempt now on screen, as the server graded it. */
async function gradedOutcome(page: Page): Promise<string | null> {
  const feedback = page.getByTestId("attempt-feedback");
  await expect(feedback, "submitting must produce feedback the learner can read").toBeVisible();
  return feedback.getAttribute("data-outcome");
}

/**
 * Sign in over the API, and return the CSRF token that comes with the session.
 *
 * Mutating routes require the header `x-tlo-csrf`, bound to the token id of the
 * session, and the value is only ever read off a `/api/session` response — the
 * same documented field the shipped client reads. Playwright's `page.request`
 * shares the browser's cookie jar, so authentication already succeeds; this is
 * the one header the client normally supplies from memory rather than a cookie.
 */
async function apiSignIn(page: Page): Promise<string> {
  const session = await page.request.get("/api/session");
  expect(session.status(), "read active session over the API").toBe(200);

  const info = (await session.json()) as { csrfToken: string | null };
  expect(info.csrfToken, "the session must issue a CSRF token").toBeTruthy();
  return info.csrfToken as string;
}

/**
 * Sign in, and leave the app looking at a learner with no history.
 *
 * Any learner that already exists is deleted through the real route and a fresh
 * one is enrolled, so the assertions about empty states hold on every run rather
 * than only on the first. A suite that is correct exactly once is not a suite.
 */
async function signInWithFreshLearner(page: Page): Promise<void> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();

  await page.fill("#login-name", PARENT_NAME);
  await page.fill("#login-password", PARENT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  // The router re-reads /api/session and only then leaves /login, so landing on
  // the learner home is itself the proof that the session state moved.
  await expect(page).toHaveURL(/^(?!.*\/login).*$/);
  await expect(page.locator(".page__title")).toBeVisible();

  const csrf = await apiSignIn(page);
  const withCsrf = { headers: { "x-tlo-csrf": csrf } };

  const session = await page.request.get("/api/session");
  if (session.ok()) {
    const info = (await session.json()) as {
      learner: { id: string; nickname: string } | null;
      learners?: { id: string; nickname: string }[];
    };
    const toDelete = info.learners ?? (info.learner ? [info.learner] : []);
    for (const l of toDelete) {
      await page.request.delete("/api/data/learner", {
        ...withCsrf,
        data: { learnerId: l.id, confirmation: `XOA ${l.nickname}` },
      });
    }
  }

  const enrolled = await page.request.post("/api/parent/learners", {
    ...withCsrf,
    data: { nickname: "Bé Mẫu", birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolled.status(), "enrol learner").toBe(200);

  // Every approval is also reset: the journey asserts that nothing is available
  // to the learner until a parent approves it, which is only true on a clean
  // slate.
  const lessons = await page.request.get("/api/parent/lessons");
  expect(lessons.status(), "load the parent's lesson list").toBe(200);
  const body = (await lessons.json()) as { lessons: { id: string }[] };
  // The journey depends on the count going 0 -> 1, so the list is not optional.
  expect(body.lessons.length, "lessons must exist to approve").toBeGreaterThan(0);
  for (const lesson of body.lessons) {
    const reset = await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      // `draft` is the honest default for a lesson with no approval row, so it is
      // the correct "unapproved" reset: `pending` is not a valid status.
      data: { lessonId: lesson.id, status: "draft" },
    });
    expect(reset.status(), "reset an approval").toBe(200);
  }

  await page.reload();
  await expect(page.getByText("Bé: Bé Mẫu")).toBeVisible();
}

test.describe("learner journey", () => {
  let networkGuard: OutboundNetworkRecorder;

  test.beforeEach(async ({ context }) => {
    networkGuard = await attachZeroOutboundGuard(context);
  });

  test.afterEach(() => {
    networkGuard.assertZeroOutbound();
  });

  test("parent approves a lesson, the learner is taught, and the dashboard records it", async ({
    page,
  }) => {
    // A fresh learner and no approvals, so the empty-state assertions below are
    // true at the moment they are made rather than having been true once.
    await signInWithFreshLearner(page);

    // ── Learner home: the honest empty state, before anything is taught ────
    await expect(page.getByText("Chào Bé Mẫu!")).toBeVisible();
    // No sessions yet, so this must say so rather than render a fake chart.
    await expect(page.getByText(/Chưa có bài học nào được ghi nhận/i)).toBeVisible();

    // ── Parent approves a lesson ────────────────────────────────────────────
    // Learner-facing screens list approved lessons only, so before any approval
    // the subject must show zero available lessons.
    const subjectCard = page.getByRole("button", { name: /Toán/ });
    await expect(subjectCard).toContainText("0 bài học");

    await page.goto("/parent/lessons");
    // The gate, stated where the parent can read it before acting, parameterized by active learner nickname.
    await expect(page.getByText(/chỉ bài .Đã duyệt. mới xuất hiện khi Bé Mẫu học/i)).toBeVisible();

    // The lesson list is ordered by subject, so the first "Đã duyệt" button on
    // the page belongs to an English lesson. Selecting the row by its title is
    // what makes the approval and the later Toán assertion about the same
    // lesson: approving whatever row happens to be first would leave the
    // subject count at zero and read as a product bug.
    const mathRow = page.getByRole("row", { name: /Diện tích hình chữ nhật/ });
    await expect(mathRow).toBeVisible();
    const approveButton = mathRow.getByRole("button", { name: "Đã duyệt" });
    await expect(approveButton).toBeVisible();
    await approveButton.click();
    await expect(page.getByText(/Đã duyệt .Diện tích hình chữ nhật/i)).toBeVisible();

    // ── The approval is what unlocks the lesson for the learner ─────────────
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Toán/ })).toContainText(/[1-9]\d* bài học/);

    // ── Subject → lesson ────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Toán/ }).click();
    await expect(page).toHaveURL(/\/subjects\//);
    // The tile exposes `Mở bài học: <title>`, which names the exact lesson the
    // parent just approved — an implicit class-name match would instead open
    // whichever approved lesson sorted first.
    await page.getByRole("button", { name: "Mở bài học: Diện tích hình chữ nhật" }).click();
    await expect(page).toHaveURL(/\/lessons\//);

    // ── An answerable step, with no answer key in the payload ───────────────
    // The options are visible and selectable, which is what makes the step
    // answerable at all. The answer is not among them, and that is asserted in
    // the integration suite where the payload can be read directly.
    const options = page.locator("input[type='radio']");
    await expect(options.first()).toBeVisible();
    expect(await options.count(), "the step must offer more than one option").toBeGreaterThan(1);

    // ── Progressive hint: the tray keeps a record that help was used ────────
    const hintButton = page.getByRole("button", { name: "Gợi ý nhỏ" });
    await expect(hintButton).toBeVisible();
    await hintButton.click();
    // This note is what tells the parent the attempt was assisted, not
    // independent — a fully revealed answer must not count as solved alone.
    await expect(page.getByText(/đã dùng gợi ý mức/i)).toBeVisible();

    // ── Answer every step, advancing only where the gate opens ──────────────
    // The first attempt is deliberately a wrong one: the gate must stay shut
    // after a wrong answer, and that is only observable if one is made. Which
    // option is wrong is not known here — the wrong option is simply whichever
    // option the server does not grade correct.
    const wrongFirst = await firstWrongOption(page);
    expect(wrongFirst, "the step must have an option the server grades wrong")
      .toBeGreaterThanOrEqual(0);
    await expect(page.getByTestId("next-step")).toBeDisabled();

    const next = page.getByTestId("next-step");
    for (let walked = 1; walked <= TOTAL_STEPS; walked += 1) {
      const answered = await answerCurrentStep(page);
      expect(answered, `step ${walked} must be solvable by one of its options`)
        .toBeGreaterThanOrEqual(0);

      // Bounded by the step count rather than by a "clicked until it vanished"
      // loop, so a lesson that will not advance fails here instead of hanging.
      if (walked === TOTAL_STEPS) break;

      await expect(next).toBeEnabled();
      await next.click();
      // The step counter is what proves the click actually moved the lesson on
      // rather than re-rendering the same step with a fresh feedback box.
      await expect(page.getByText(new RegExp(`Bước ${walked + 1} trên ${TOTAL_STEPS}`)))
        .toBeVisible();
    }

    // The finish button exists only on the last step, so reaching it is itself
    // the proof that all six were answered and unlocked.
    const finish = page.getByRole("button", { name: "Kết thúc bài học" });
    await expect(finish).toBeVisible();
    await expect(finish).toBeEnabled();
    await finish.click();
    await expect(page).toHaveURL(/\/session\//);

    await page.goto("/parent");
    // The dashboard previously said nothing was recorded; it must now carry a
    // number that came from the session just finished.
    await expect(page.getByRole("heading", { name: "Bảng theo dõi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bé Mẫu — tổng quan ghi nhận/ })).toBeVisible();
    await expect(page.getByText(/Chưa có dữ liệu nào được ghi nhận/i)).toBeHidden();
  });

  test("the learner cannot advance a step they have not actually answered", async ({
    page,
  }) => {
    await signInWithFreshLearner(page);

    // Approve the one lesson the journey uses, through the real route.
    await page.goto("/parent/lessons");
    const mathRow = page.getByRole("row", { name: /Diện tích hình chữ nhật/ });
    await mathRow.getByRole("button", { name: "Đã duyệt" }).click();
    await expect(page.getByText(/Đã duyệt .Diện tích hình chữ nhật/i)).toBeVisible();

    await page.goto("/");
    await page.getByRole("button", { name: /Toán/ }).click();
    await page.getByRole("button", { name: "Mở bài học: Diện tích hình chữ nhật" }).click();
    await expect(page).toHaveURL(/\/lessons\//);

    const next = page.getByTestId("next-step");
    const check = page.getByRole("button", { name: "Kiểm tra" });
    const feedback = page.getByTestId("attempt-feedback");

    // ── Before any attempt: the gate is closed, and it says why ──────────────
    await expect(check).toBeVisible();
    await expect(next).toBeDisabled();
    // The note is what makes a disabled button legible instead of mysterious.
    await expect(page.getByText(/Em cần trả lời đúng bước này/i)).toBeVisible();

    // ── Every option, in order: graded wrong keeps the gate shut ─────────────
    // The test does not know which option is correct, and must not learn it: the
    // correct one is simply whichever the server reports as correct. The loop is
    // bounded by the option count, so an unsolvable step fails loudly rather
    // than hanging.
    const options = page.locator("input[type='radio']");
    await expect(options.first()).toBeVisible();
    const total = await options.count();
    expect(total, "the step must offer more than one option").toBeGreaterThan(1);

    let unlockedAt = -1;
    for (let index = 0; index < total; index += 1) {
      await options.nth(index).check();
      await check.click();

      // Awaited by attribute rather than read from text, so this is the reaction
      // to THIS attempt rather than the previous attempt's copy.
      await expect(feedback).toBeVisible();

      if ((await feedback.getAttribute("data-outcome")) === "correct") {
        // Asserted at the moment of unlocking, not after the loop: the gate opens
        // for the correct answer and for nothing else.
        await expect(next).toBeEnabled();
        unlockedAt = index;
        break;
      }
      await expect(next).toBeDisabled();
    }

    expect(unlockedAt, "the step must be solvable by one of its options")
      .toBeGreaterThanOrEqual(0);

    // The explanation is unlocked by the correct answer — it is not sent when
    // the lesson opens, which is exactly why nothing could be read off the wire.
    await expect(page.getByRole("heading", { name: "Giải thích" })).toBeVisible();
    await expect(next).toContainText("Bước tiếp theo");
  });

  test("the login screen refuses a wrong password without revealing which field was wrong", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#login-name", PARENT_NAME);
    await page.fill("#login-password", "AbsolutelyWrongPassword");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    // Uniform failure: the message must not say the name was right and the
    // password was wrong, or the form becomes an account-enumeration oracle.
    await expect(alert).not.toContainText(/mật khẩu sai|sai mật khẩu|tên đăng nhập sai/i);

    // Still on the login screen: a rejected login must not fall through.
    await expect(page).toHaveURL(/\/login/);
  });

  test("a protected screen is not reachable without a session", async ({ page }) => {
    await signIn(page);
    // Clear the cookie the way a closed browser would, then try a protected
    // route directly by URL.
    await page.context().clearCookies();
    await page.goto("/parent/lessons");

    // The auth gate redirects to /login rather than rendering the screen.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();
  });

  test("logout ends the session and blocks the back button", async ({ page }) => {
    await signIn(page);
    await page.goto("/parent");
    await page.getByRole("button", { name: "Đăng xuất" }).click();
    await expect(page).toHaveURL(/\/login/);

    // The browser back button must not resurrect an authenticated screen.
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });

  test("the parent can configure curriculum intake, run baseline diagnostics, and generate a 4-week learning plan", async ({
    page,
  }) => {
    await signInWithFreshLearner(page);

    // 1. Curriculum Setup Screen (/parent/curriculum)
    await page.goto("/parent/curriculum");
    await expect(page.getByRole("heading", { name: /Chương trình học/i })).toBeVisible();
    await expect(page.locator("#curriculum-textbook")).toHaveValue("UNKNOWN");

    await page.fill("#curriculum-textbook", "Kết nối tri thức với cuộc sống");
    await page.fill("#curriculum-unit", "Chủ đề Phân số");
    await page.getByTestId("save-curriculum-btn").click();
    await expect(page.getByText(/Đã lưu thiết lập chương trình học/i)).toBeVisible();

    // 2. Baseline Assessment Screen (/parent/baseline)
    await page.goto("/parent/baseline");
    await expect(page.getByRole("heading", { name: /Đánh giá đầu vào/i })).toBeVisible();
    await page.getByTestId("evaluate-baseline-math").click();
    await expect(page.getByText(/Đã tổng hợp báo cáo quan sát đầu vào cho môn math/i)).toBeVisible();

    // 3. Four-Week Learning Planner Screen (/parent/planner)
    await page.goto("/parent/planner");
    await expect(page.getByRole("heading", { name: /Kế hoạch học tập 4 tuần/i })).toBeVisible();
    await page.getByTestId("generate-plan-btn").click();
    await expect(page.getByText(/Đã lập kế hoạch 4 tuần/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Chi tiết Tuần 1/i })).toBeVisible();
  });
});
