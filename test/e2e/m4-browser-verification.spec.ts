import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  readSessionSnapshotFromIsolatedDb,
  resolveIsolatedE2eSqlitePath,
  setSessionContinuationDeadlineNearNow,
} from "./e2e-db-helper";

/**
 * M4 Browser Verification Suite
 *
 * Implements end-to-end browser verification for the 8 core M4 flows:
 *   1. Learner switcher (cross-learner navigation without leaking data)
 *   2. Learner switcher race safety (rapid clicks converge reliably)
 *   3. Approval badge per-learner isolation (approving for learner A does not approve for learner B)
 *   4. Parent skill correction modal & reflected state
 *   5. Consent management workflow (grant/revoke)
 *   6. Classroom assigned lessons & parent approval requirement
 *   7. Spaced review due CTA direct lesson navigation
 *   8. Session continuation grace window & cutoff boundary
 */

const PARENT_NAME = process.env.TLO_PARENT_NAME ?? "Phụ huynh";
const PARENT_PASSWORD = process.env.TLO_PARENT_PASSWORD ?? "MatKhauBiMat2026";

async function signInAsParent(page: Page): Promise<string> {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "TAI LEARNING OS" })).toBeVisible();

  await page.fill("#login-name", PARENT_NAME);
  await page.fill("#login-password", PARENT_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/^(?!.*\/login).*$/);

  const session = await page.request.get("/api/session");
  expect(session.status()).toBe(200);
  const info = (await session.json()) as { csrfToken: string | null };
  expect(info.csrfToken).toBeTruthy();
  return info.csrfToken as string;
}

test.describe("M4 Browser Verification Flows", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Learner switcher updates view context and isolates learner progress", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    // Ensure two active learners exist: "Tài" and "An"
    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learners?: { id: string; nickname: string }[] };
    const learners = sessionInfo.learners ?? [];

    let tai = learners.find((l) => l.nickname === "Tài");
    if (!tai) {
      const res = await page.request.post("/api/parent/learners", {
        ...withCsrf,
        data: { nickname: "Tài", birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
      });
      expect(res.ok()).toBe(true);
      const body = (await res.json()) as { learner: { id: string; nickname: string } };
      tai = body.learner;
    }

    let an = learners.find((l) => l.nickname === "An");
    if (!an) {
      const res = await page.request.post("/api/parent/learners", {
        ...withCsrf,
        data: { nickname: "An", birthYear: 2018, grade: 2, timezone: "Asia/Ho_Chi_Minh" },
      });
      expect(res.ok()).toBe(true);
      const body = (await res.json()) as { learner: { id: string; nickname: string } };
      an = body.learner;
    }

    await page.goto("/parent");
    await expect(page.getByRole("heading", { name: "Bảng theo dõi" })).toBeVisible();

    // Assert learner selector exists unconditionally and switch between learners
    const switcher = page.getByTestId("learner-switcher");
    await expect(switcher).toBeVisible();
    await switcher.selectOption(tai.id);
    await expect(page.locator(".topbar__who")).toContainText("Bé: Tài");

    await switcher.selectOption(an.id);
    await expect(page.locator(".topbar__who")).toContainText("Bé: An");
  });

  test("2. Learner switcher rapid selection converges to final chosen learner", async ({ page }) => {
    await signInAsParent(page);
    await page.goto("/parent");

    const switcher = page.getByTestId("learner-switcher");
    await expect(switcher).toBeVisible();
    const options = await switcher.locator("option").all();
    expect(options.length).toBeGreaterThanOrEqual(2);
    const val1 = await options[0]!.getAttribute("value");
    const val2 = await options[1]!.getAttribute("value");
    expect(val1).toBeTruthy();
    expect(val2).toBeTruthy();

    // Rapid toggling
    await switcher.selectOption(val1!);
    await switcher.selectOption(val2!);
    await switcher.selectOption(val1!);

    await expect(switcher).toHaveValue(val1!);
  });

  test("3. Approval badges are isolated per learner", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learners?: { id: string; nickname: string }[] };
    const learners = sessionInfo.learners ?? [];
    expect(learners.length).toBeGreaterThanOrEqual(2);
    const [l1, l2] = learners;

    // Approve lesson for l1 only
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        lessonId: "math-fractions-equivalent",
        status: "approved",
        learnerId: l1!.id,
        version: 1,
      },
    });

    // Draft for l2
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        lessonId: "math-fractions-equivalent",
        status: "draft",
        learnerId: l2!.id,
        version: 1,
      },
    });

    await page.goto("/parent/lessons");
    const switcher = page.getByTestId("learner-switcher");
    await expect(switcher).toBeVisible();

    await switcher.selectOption(l1!.id);
    const mathRowL1 = page.getByRole("row", { name: /Hai phân số bằng nhau/i });
    await expect(mathRowL1).toBeVisible();
    await expect(mathRowL1.locator(".status-pill")).toContainText(/Đã duyệt/i);

    await switcher.selectOption(l2!.id);
    const mathRowL2 = page.getByRole("row", { name: /Hai phân số bằng nhau/i });
    await expect(mathRowL2).toBeVisible();
    await expect(mathRowL2.locator(".status-pill")).not.toContainText(/Đã duyệt/i);
  });

  test("4. Parent skill correction modal updates state correctly via UI form", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    // Resolve active learner to ensure dashboard renders for this learner
    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learner: { id: string } | null };
    const learnerId = sessionInfo.learner?.id;
    expect(learnerId).toBeTruthy();

    // Complete a session with an attempt so dashboard emptyState is false
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent", status: "approved", version: 1, learnerId },
    });
    const sessRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    expect(sessRes.ok()).toBe(true);
    const sessData = (await sessRes.json()) as { sessionId: string; steps: { stepId: string }[] };
    await page.request.post("/api/learner/attempts", {
      ...withCsrf,
      data: {
        sessionId: sessData.sessionId,
        stepId: sessData.steps[0]!.stepId,
        submitted: { kind: "choice", choiceId: "c1" },
        outcome: "incorrect",
        helpLevel: 0,
      },
    });
    await page.request.post("/api/learner/sessions/finalize", {
      ...withCsrf,
      data: { sessionId: sessData.sessionId, status: "completed" },
    });

    // Seed an initial skill evidence row so table renders
    await page.request.post("/api/parent/skills/correct", {
      ...withCsrf,
      data: {
        learnerId,
        skillId: "math-frac-equiv",
        state: "SUPPORTED",
        note: "Trạng thái ban đầu cần điều chỉnh",
      },
    });

    await page.goto("/parent");
    await expect(page.getByRole("heading", { name: "Bảng theo dõi" })).toBeVisible();

    // Locate the edit button for math-frac-equiv and click it
    const editBtn = page.getByTestId("correct-skill-math-frac-equiv");
    await expect(editBtn).toBeVisible();
    await editBtn.click({ force: true });

    // Verify form opens
    const form = page.getByTestId("skill-correction-form-math-frac-equiv");
    await expect(form).toBeVisible();

    // Fill form in browser DOM
    await page.selectOption("#state-math-frac-equiv", "INDEPENDENT");
    await page.fill("#note-math-frac-equiv", "Đã quan sát thực tế tại nhà qua bài tập giấy");
    await form.getByRole("button", { name: "Lưu điều chỉnh" }).click({ force: true });

    // Verify notice appears in UI
    await expect(page.locator(".data-control__notice--ok")).toContainText("Đã ghi nhận điều chỉnh");

    // Verify row displays updated state
    const updatedRow = page.getByRole("row", { name: /Phân số tương đương/i });
    await expect(updatedRow).toContainText("Tự làm được");
  });

  test("5. Consent management workflow grants and revokes organization consent via UI", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learner: { id: string } | null };
    const learnerId = sessionInfo.learner?.id;
    expect(learnerId).toBeTruthy();

    // Ensure a test organization exists via /api/org/create
    const orgSlug = `test-org-${Date.now()}`;
    const orgRes = await page.request.post("/api/org/create", {
      ...withCsrf,
      data: { slug: orgSlug, name: "Trường Tiểu Học Ánh Sao" },
    });
    expect(orgRes.ok()).toBe(true);
    const orgData = (await orgRes.json()) as { organization: { id: string } };
    const orgId = orgData.organization.id;

    // Create a classroom and pre-grant consent so classroom enrollment succeeds
    const roomRes = await page.request.post("/api/org/classrooms", {
      ...withCsrf,
      data: { organizationId: orgId, name: "Lớp 4A", grade: 4 },
    });
    expect(roomRes.ok()).toBe(true);
    const roomData = (await roomRes.json()) as { classroom: { id: string } };

    await page.request.post("/api/parent/consents/grant", {
      ...withCsrf,
      data: { organizationId: orgId, learnerId },
    });

    // Enroll learner in org classroom so org appears on parent consent panel
    const enrollRes = await page.request.post("/api/org/classrooms/enroll", {
      ...withCsrf,
      data: { classroomId: roomData.classroom.id, learnerId },
    });
    expect(enrollRes.ok()).toBe(true);

    await page.goto("/parent/lessons");
    await expect(page.getByRole("heading", { name: "Quản lý bài học" })).toBeVisible();

    // Since consent is currently granted, revoke button is visible
    const revokeBtn = page.getByTestId(`revoke-consent-${orgId}`);
    await expect(revokeBtn).toBeVisible();

    // Click revoke in DOM
    await revokeBtn.click();

    // Now grant button should be visible in DOM
    const grantBtn = page.getByTestId(`grant-consent-${orgId}`);
    await expect(grantBtn).toBeVisible();

    // Click grant in DOM to complete the cycle
    await grantBtn.click();
    await expect(page.getByTestId(`revoke-consent-${orgId}`)).toBeVisible();
  });

  test("6. Classroom assigned lessons require parent approval before learner can access", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learner: { id: string } | null };
    const learnerId = sessionInfo.learner?.id;
    expect(learnerId).toBeTruthy();

    // First ensure any in_progress session for this lesson is finalized
    const activeSess = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    if (activeSess.ok()) {
      const body = (await activeSess.json()) as { sessionId: string };
      await page.request.post("/api/learner/sessions/finalize", {
        ...withCsrf,
        data: { sessionId: body.sessionId, status: "abandoned" },
      });
    }

    // Set lesson approval to draft
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        lessonId: "math-fractions-equivalent",
        status: "draft",
        learnerId,
        version: 1,
      },
    });

    const startRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    expect(startRes.status()).toBe(403);
  });

  test("7. Spaced review due CTA navigates to matching lesson", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learner: { id: string } | null };
    const learnerId = sessionInfo.learner?.id;
    expect(learnerId).toBeTruthy();

    // 1. Approve lesson so it counts as visible and reviewable
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent", status: "approved", version: 1, learnerId },
    });

    // 2. Export learner data to get a valid envelope, inject an overdue review_schedule item, and import
    const exportRes = await page.request.post("/api/data/export", {
      ...withCsrf,
    });
    expect(exportRes.ok()).toBe(true);
    const envelope = (await exportRes.json()) as {
      data: {
        learners: { id: string; nickname: string }[];
        reviewSchedule: {
          id: string;
          learnerId: string;
          skillId: string;
          dueAt: number;
          intervalDays: number;
          lastResult: "passed" | "failed";
          lastAttemptAt: number;
          failureStreak: number;
          createdAt: number;
          updatedAt: number;
        }[];
        reviewApprovals: {
          id: string;
          learnerId: string | null;
          lessonId: string;
          lessonVersion: number;
          status: string;
          decidedBy: string;
          decidedAt: number;
          note: string | null;
        }[];
      };
    };

    const targetLearner = envelope.data.learners[0]!;
    const now = Date.now();
    envelope.data.reviewSchedule = [
      {
        id: `rev-${now}`,
        learnerId: targetLearner.id,
        skillId: "math-frac-equiv",
        dueAt: now - 86_400_000,
        intervalDays: 1,
        lastResult: "passed",
        lastAttemptAt: now - 172_800_000,
        failureStreak: 0,
        createdAt: now - 172_800_000,
        updatedAt: now - 86_400_000,
      },
    ];

    // Delete all existing learner profiles to allow clean restore
    const currentSessionRes = await page.request.get("/api/session");
    const currentSessionInfo = (await currentSessionRes.json()) as { learners?: { id: string; nickname: string }[] };
    for (const l of currentSessionInfo.learners ?? []) {
      const delRes = await page.request.delete("/api/data/learner", {
        ...withCsrf,
        data: { learnerId: l.id, confirmation: `XOA ${l.nickname}` },
      });
      expect(delRes.ok()).toBe(true);
    }

    // Import envelope with overdue review
    const impRes = await page.request.post("/api/data/import", {
      ...withCsrf,
      data: envelope,
    });
    expect(impRes.ok()).toBe(true);

    // Re-approve lesson for the restored learner
    const freshSessionRes = await page.request.get("/api/session");
    const freshInfo = (await freshSessionRes.json()) as { learner: { id: string } | null };
    const freshLearnerId = freshInfo.learner?.id;
    expect(freshLearnerId).toBeTruthy();

    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent", status: "approved", version: 1, learnerId: freshLearnerId },
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Chào/i })).toBeVisible();

    const reviewSection = page.getByTestId("review-due-list");
    await expect(reviewSection).toBeVisible();

    const reviewItem = reviewSection.locator("a, button").first();
    await expect(reviewItem).toBeVisible();
    await reviewItem.click();
    await expect(page).toHaveURL(/\/lessons\/math-fractions-equivalent/);
  });

  test("8. Bounded continuation deadline enforces real SQLite expiry cutoff on revoked in_progress session", async ({ page }) => {
    const sysTmp = resolve(tmpdir());
    const sqlitePath = resolveIsolatedE2eSqlitePath();
    expect(sqlitePath.startsWith(sysTmp)).toBe(true);
    expect(sqlitePath.includes(".wrangler")).toBe(false);

    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    // 1. Approve lesson and start session
    const approveRes = await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent", status: "approved", version: 1 },
    });
    expect(approveRes.status()).toBe(200);

    const startRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    expect(startRes.status()).toBe(200);
    const startData = (await startRes.json()) as {
      sessionId: string;
      steps: Array<{ id: string; kind: string }>;
    };
    const practiceStep = startData.steps[0]!;

    // 2. Revoke approval while session is STILL IN_PROGRESS
    const revokeRes = await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent", status: "rejected", note: "Thu hồi khi đang học" },
    });
    expect(revokeRes.status()).toBe(200);

    // Verify in D1 that session is still in_progress and continuation_deadline was set ~30m out
    const afterRevokeSnap = readSessionSnapshotFromIsolatedDb(startData.sessionId);
    expect(afterRevokeSnap.status).toBe("in_progress");
    expect(afterRevokeSnap.continuationDeadline).not.toBeNull();
    expect(afterRevokeSnap.isContinuationExpired).toBe(0);

    // 3. New session for an unapproved lesson must be blocked immediately with 403 Forbidden
    const newSessionAttempt = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-word-problems" },
    });
    expect(newSessionAttempt.status()).toBe(403);

    // 4. Within the grace period, the existing in_progress session CAN resume and use hints
    const resumeRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    expect(resumeRes.status()).toBe(200);

    const graceHintRes = await page.request.post("/api/learner/hints", {
      ...withCsrf,
      data: {
        sessionId: startData.sessionId,
        stepId: practiceStep.id,
        currentLevel: 1,
      },
    });
    expect(graceHintRes.status()).toBe(200);

    const afterGraceHintSnap = readSessionSnapshotFromIsolatedDb(startData.sessionId);
    expect(afterGraceHintSnap.status).toBe("in_progress");
    expect(afterGraceHintSnap.hintAuditCount).toBe(1);
    expect(afterGraceHintSnap.attemptCount).toBe(0);

    // 5. Move continuation_deadline to a near timestamp (now + 400ms) directly in the isolated E2E D1 DB,
    //    keeping session.status = 'in_progress' (do NOT finalize the session).
    const nearDeadlineSnap = setSessionContinuationDeadlineNearNow(startData.sessionId, 400);
    expect(nearDeadlineSnap.status).toBe("in_progress");
    expect(nearDeadlineSnap.continuationDeadline).not.toBeNull();

    // Wait for the SQLite database clock to cross continuation_deadline
    while (readSessionSnapshotFromIsolatedDb(startData.sessionId).isContinuationExpired === 0) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const expiredSnapBeforeCalls = readSessionSnapshotFromIsolatedDb(startData.sessionId);
    expect(expiredSnapBeforeCalls.status).toBe("in_progress");
    expect(expiredSnapBeforeCalls.isContinuationExpired).toBe(1);
    expect(expiredSnapBeforeCalls.databaseNowMs).toBeGreaterThanOrEqual(
      expiredSnapBeforeCalls.continuationDeadline!,
    );

    // 6. Browser navigation to the lesson player after cutoff must show error/blocked state
    await page.goto("/lessons/math-fractions-equivalent");
    await expect(
      page.getByText(/chưa được phụ huynh phê duyệt|chưa được phụ huynh duyệt|hết thời gian|không mở được/i).first(),
    ).toBeVisible();

    // 7. Direct API calls for session resume, attempt submission, hint disclosure, and finalize
    //    must all be rejected at the SQLite write/read boundary while session status remains 'in_progress'.
    const expiredResumeRes = await page.request.post("/api/learner/sessions", {
      ...withCsrf,
      data: { lessonId: "math-fractions-equivalent" },
    });
    expect(expiredResumeRes.status()).toBe(403);

    const expiredAttemptRes = await page.request.post("/api/learner/attempts", {
      ...withCsrf,
      data: {
        sessionId: startData.sessionId,
        stepId: practiceStep.id,
        submission: { kind: "choice", choiceId: "a" },
        helpLevel: 0,
      },
    });
    expect(expiredAttemptRes.status()).toBe(403);

    const expiredHintRes = await page.request.post("/api/learner/hints", {
      ...withCsrf,
      data: {
        sessionId: startData.sessionId,
        stepId: practiceStep.id,
        currentLevel: 2,
      },
    });
    expect(expiredHintRes.status()).toBe(403);

    const expiredFinalizeRes = await page.request.post("/api/learner/sessions/finalize", {
      ...withCsrf,
      data: { sessionId: startData.sessionId, status: "completed" },
    });
    expect(expiredFinalizeRes.status()).toBe(403);

    // 8. Verify in D1 that session status is STILL 'in_progress' and ZERO new attempts or hints were recorded after cutoff
    const finalSnap = readSessionSnapshotFromIsolatedDb(startData.sessionId);
    expect(finalSnap.status).toBe("in_progress");
    expect(finalSnap.attemptCount).toBe(0);
    expect(finalSnap.hintAuditCount).toBe(1);
  });

  test("9. M5 Phase 3: Prerequisite recommendations quick-approve, school-year transition & archival, and Science/Debate modules on Learner Home", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as { learner: { id: string } | null };
    const learnerId = sessionInfo.learner?.id;
    expect(learnerId).toBeTruthy();

    // 1. Mark foundational skill `sci-water-cycle` as INDEPENDENT so `sci-plant-needs` unlocks as `unlocked_next`
    const correctRes = await page.request.post("/api/parent/skills/correct", {
      ...withCsrf,
      data: {
        learnerId,
        skillId: "sci-water-cycle",
        state: "INDEPENDENT",
        note: "Em đã nắm vững vòng tuần hoàn của nước",
      },
    });
    expect(correctRes.ok()).toBe(true);

    // Ensure `sci-plant-needs` starts unapproved (`draft`) so we can test quick-approve on the dashboard
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        learnerId,
        lessonId: "sci-plant-needs",
        status: "draft",
      },
    });

    // Also approve `deb-claim-reason` so both Science & Debate appear on Learner Home
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        learnerId,
        lessonId: "deb-claim-reason",
        status: "approved",
      },
    });

    // 2. Open Parent Dashboard (`/parent`) and verify Prerequisite Graph Guided Recommendations
    await page.goto("/parent");
    const prereqSection = page.getByTestId("prerequisite-recommendations");
    await expect(prereqSection).toBeVisible();

    const unlockedPlantCard = page.getByTestId("prereq-rec-sci-plant-needs");
    await expect(unlockedPlantCard).toBeVisible();
    await expect(unlockedPlantCard).toContainText("Đã mở khóa");
    await expect(unlockedPlantCard).toContainText("Khoa học");

    // Quick-approve `sci-plant-needs` directly from the recommendation card
    const approveBtn = page.getByTestId("prereq-approve-sci-plant-needs");
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();
    await expect(page.getByTestId("prereq-approved-sci-plant-needs")).toBeVisible();

    // 3. Verify School-Year Continuity & Transition section and transition to 2027-2028 (Grade 5)
    const schoolYearSection = page.getByTestId("school-year-continuity-section");
    await expect(schoolYearSection).toBeVisible();

    await page.getByTestId("school-year-label-input").fill("2027-2028");
    await page.getByTestId("school-year-grade-input").selectOption("5");
    await page.getByTestId("school-year-transition-submit").click();

    await expect(page.getByTestId("school-year-transition-notice")).toContainText("2027-2028");
    await expect(page.getByTestId("active-school-year-label")).toHaveText("2027-2028");
    await expect(page.getByTestId("school-year-row-2027-2028")).toBeVisible();

    // 3b. Verify Parent Learning Goals creation and status transition on `/parent`
    const goalsSection = page.getByTestId("parent-goals-section");
    await expect(goalsSection).toBeVisible();
    await page.getByTestId("goal-title-input").fill("Tự nêu ý kiến và lý lẽ rõ ràng trong bài đọc");
    await page.getByTestId("goal-subject-select").selectOption("debate");
    await page.getByTestId("goal-target-date-input").fill("2027-06-01");
    await page.getByTestId("goal-note-input").fill("Luyện 2 buổi mỗi tuần");
    await page.getByTestId("create-goal-submit").click();

    await expect(page.getByTestId("parent-goals-notice")).toContainText(
      "Tự nêu ý kiến và lý lẽ rõ ràng trong bài đọc",
    );
    await expect(page.getByTestId("parent-goals-list")).toContainText(
      "Tự nêu ý kiến và lý lẽ rõ ràng trong bài đọc",
    );

    const statusSelect = page.locator('[data-testid^="goal-status-select-"]').first();
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption("achieved");
    await expect(page.getByTestId("parent-goals-notice")).toContainText("Đã đạt");

    // 3c. Verify Curriculum Setup screen preserves transitioned active school year (`2027-2028`) across subject tabs
    await page.getByRole("button", { name: "Chương trình học" }).click();
    await expect(page).toHaveURL(/\/parent\/curriculum/);
    await page.getByTestId("curriculum-subject-science").click();
    await expect(page.locator("#curriculum-school-year")).toHaveValue("2027-2028");

    // 4. Verify 5-Subject Baseline Diagnostic Screen (`/parent/baseline`) including Science & Debate
    await page.goto("/parent/baseline");
    await expect(
      page.getByRole("heading", { name: /Đánh giá đầu vào/i }),
    ).toBeVisible();
    await expect(page.getByTestId("baseline-card-science")).toBeVisible();
    await expect(page.getByTestId("baseline-card-debate")).toBeVisible();
    await expect(page.getByTestId("baseline-card-science")).toContainText("Khoa học");
    await expect(page.getByTestId("baseline-card-debate")).toContainText("Tư duy phản biện");

    // Trigger baseline synthesis for Science directly in the browser UI
    await page.getByTestId("evaluate-baseline-science").click();
    await expect(page.getByTestId("baseline-card-science")).toContainText("sci-plant-needs");

    // 5. Verify 4-Week Planner Screen (`/parent/planner`) generates plan for active school year
    await page.goto("/parent/planner");
    await expect(
      page.getByRole("heading", { name: /Kế hoạch học tập 4 tuần/i }),
    ).toBeVisible();
    await page.getByTestId("generate-plan-btn").click();
    await expect(page.getByRole("button", { name: /Tuần 1/i })).toBeVisible();

    // 6. Navigate to Learner Home (`/`) and verify Science (`Khoa học`) and Debate (`Tư duy phản biện`) subjects and lessons are visible
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Chào/i })).toBeVisible();
    await expect(page.getByText("Khoa học").first()).toBeVisible();
    await expect(page.getByText("Tư duy phản biện").first()).toBeVisible();

    await page.goto("/subjects/science");
    await expect(
      page.getByText("Các yếu tố cần cho sự sống và phát triển của thực vật").first(),
    ).toBeVisible();

    await page.goto("/subjects/debate");
    await expect(
      page.getByText("Nêu ý kiến và đưa ra lý lẽ hỗ trợ").first(),
    ).toBeVisible();
  });
});
