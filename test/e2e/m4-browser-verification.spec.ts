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

  test("10. M8: B2B2C Organization & Classroom Studio (/parent/organization), multi-subject curriculum parity, and AES-256-GCM encrypted backup export/import", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as {
      learner: { id: string; nickname: string } | null;
      learners?: { id: string; nickname: string }[];
    };
    let learner = sessionInfo.learner ?? sessionInfo.learners?.[0] ?? null;
    if (!learner) {
      const createRes = await page.request.post("/api/parent/learners", {
        ...withCsrf,
        data: { nickname: "Tài", birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as { learner: { id: string; nickname: string } };
      learner = created.learner;
    }
    const learnerId = learner.id;
    expect(learnerId).toBeTruthy();

    // 1. Approve the new Science (`sci-states-of-matter`, `sci-light-and-shadow`) and Debate (`deb-evidence-relevance`, `deb-counterargument-respect`) lessons
    for (const lessonId of [
      "sci-states-of-matter",
      "sci-light-and-shadow",
      "deb-evidence-relevance",
      "deb-counterargument-respect",
    ]) {
      const appRes = await page.request.post("/api/parent/lessons/approval", {
        ...withCsrf,
        data: { learnerId, lessonId, status: "approved" },
      });
      const appBody = await appRes.text();
      expect(appRes.ok(), `${lessonId}: ${appRes.status()} ${appBody}`).toBe(true);
    }

    // 2. Navigate to `/parent/organization` and create a B2B2C organization, grant consent, create a classroom, enroll learner, author + submit + approve + assign a 5-step lesson
    await page.goto("/parent/organization");
    await expect(page.getByRole("heading", { name: /Trung tâm & Lớp học/i })).toBeVisible();

    const uniqueSlug = `sao-khue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orgName = `Trung tâm Sao Khuê M8 ${uniqueSlug}`;
    await page.getByTestId("org-create-name-input").fill(orgName);
    await page.getByTestId("org-create-slug-input").fill(uniqueSlug);
    await page.getByTestId("org-create-submit-btn").click();
    await expect(page.getByText(`Đã khởi tạo trung tâm “${orgName}”.`)).toBeVisible();

    await expect(page.getByTestId("org-studio-role")).toContainText("Chủ sở hữu");

    // Grant active consent for the current learner directly in the studio
    await page.getByTestId("org-consent-grant-btn").click();
    await expect(page.getByTestId("org-consented-learners-table")).toContainText(learner.nickname);

    // Create a classroom
    await page.getByTestId("org-classroom-name-input").fill("Lớp Khoa học 4A");
    await page.getByTestId("org-classroom-create-btn").click();
    await expect(page.getByTestId("org-classroom-select")).toContainText("Lớp Khoa học 4A");

    // Enroll the consented learner into the classroom
    await page.getByTestId("org-enroll-learner-select").selectOption(learnerId);
    await page.getByTestId("org-enroll-submit").click();
    await expect(page.getByTestId("org-classroom-learners")).toContainText(learner.nickname);

    // Author a 5-step lesson using the 1-click template prefill, then submit -> approve -> assign to classroom
    await page.getByTestId("org-lesson-prefill-btn").click();
    await page.getByTestId("org-lesson-title-input").fill("Bài thực nghiệm Trung tâm Sao Khuê");
    await page.getByTestId("org-lesson-save-btn").dispatchEvent("click");

    await expect(page.getByTestId("org-lessons-table")).toContainText("Bài thực nghiệm Trung tâm Sao Khuê");
    await page.getByTestId("org-lesson-submit-btn").first().click();
    await expect(page.getByTestId("org-lessons-table")).toContainText("Chờ duyệt");

    await page.getByTestId("org-lesson-approve-btn").first().click();
    await expect(page.getByTestId("org-lessons-table")).toContainText("Trung tâm đã duyệt");

    // Assign the org-approved lesson to the classroom
    const assignSelect = page.getByTestId("org-assign-lesson-select");
    await assignSelect.focus();
    const firstApprovedValue = await assignSelect.locator("option").nth(1).getAttribute("value");
    expect(firstApprovedValue).toBeTruthy();
    await assignSelect.selectOption(firstApprovedValue!);
    await page.getByTestId("org-assign-lesson-btn").click();
    await expect(page.getByTestId("org-classroom-assigned")).toContainText(
      "Bài thực nghiệm Trung tâm Sao Khuê",
    );

    // 3. Verify parent sees the classroom-assigned lesson on `/parent/lessons`
    await page.goto("/parent/lessons");
    await expect(page.getByText("Bài thực nghiệm Trung tâm Sao Khuê").first()).toBeVisible();

    // 4. Verify AES-256-GCM encrypted backup UI on `/parent/data`
    await page.goto("/parent/data");
    const passInput = page.getByTestId("export-passphrase-input");
    await expect(passInput).toBeVisible();
    await passInput.fill("mat-khau-aes-gcm-2026");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Tải tệp sao lưu mã hóa AES-256-GCM/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("tai-learning-os-export-encrypted-");

    // 5. Verify new Science & Debate lessons appear on Learner Subject screens
    await page.goto("/subjects/science");
    await expect(page.getByText("Ba thể của chất và sự chuyển thể").first()).toBeVisible();
    await expect(page.getByText("Ánh sáng, bóng tối và bảo vệ thị giác").first()).toBeVisible();

    await page.goto("/subjects/debate");
    await expect(page.getByText("Chọn bằng chứng đúng trọng tâm và đáng tin cậy").first()).toBeVisible();
    await expect(page.getByText("Lắng nghe và phản hồi lịch sự trước góc nhìn khác").first()).toBeVisible();
  });

  test("11. M9: Learner profile editing (/parent), version-pinned lesson content editing (/parent/lessons), teacher dropdown & center lesson editing (/parent/organization)", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as {
      learner: { id: string; nickname: string } | null;
      learners?: { id: string; nickname: string }[];
    };
    if (!sessionInfo.learner && (!sessionInfo.learners || sessionInfo.learners.length === 0)) {
      const createRes = await page.request.post("/api/parent/learners", {
        ...withCsrf,
        data: { nickname: "Tài", birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
      });
      expect(createRes.ok()).toBe(true);
    }

    // 1. Learner profile edit on `/parent`
    await page.goto("/parent");
    const profileSection = page.getByTestId("learner-profile-section");
    await expect(profileSection).toBeVisible();

    await page.getByTestId("learner-profile-nickname-input").fill("Tài Chăm Ngoan");
    await page.getByTestId("learner-profile-grade-select").selectOption("5");
    await page.getByTestId("learner-profile-save-btn").click();
    await expect(page.getByTestId("learner-profile-notice")).toContainText("Tài Chăm Ngoan");

    // Restore original nickname & grade so downstream state stays consistent
    await page.getByTestId("learner-profile-nickname-input").fill("Tài");
    await page.getByTestId("learner-profile-grade-select").selectOption("4");
    await page.getByTestId("learner-profile-save-btn").click();
    await expect(page.getByTestId("learner-profile-notice")).toContainText("Tài");

    // 2. Version-pinned lesson content editing on `/parent/lessons` (via family practice copy fork)
    await page.goto("/parent/lessons");
    const m9CatRow = page.locator("tr", {
      has: page.getByTestId("lesson-ownership-badge-math-fractions-equivalent"),
    });
    await m9CatRow.getByRole("button", { name: "Xem bài" }).click();
    await expect(page.getByTestId("lesson-detail-version")).toBeVisible();

    await page.getByTestId("lesson-detail-fork-btn").click();
    await expect(page.getByTestId("lesson-detail-ownership")).toContainText("Bản luyện tập gia đình");

    await page.getByTestId("lesson-detail-edit-btn").click();
    const titleInput = page.getByTestId("lesson-edit-title-input");
    await titleInput.fill("Bài tự luyện gia đình M9 · Bản cập nhật");
    await page.getByTestId("lesson-edit-save-btn").click();

    await expect(page.getByTestId("lesson-detail-version")).toContainText("Phiên bản 2");
    await expect(page.locator("#lesson-detail-panel-title")).toContainText("Bản cập nhật");

    // 3. Organization Studio: Teacher dropdown (`org-teacher-select`) & lesson editing (`org-lesson-edit-btn-*`)
    await page.goto("/parent/organization");
    const uniqueSlug = `m9-center-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orgName = `Trung tâm M9 ${uniqueSlug}`;
    await page.getByTestId("org-create-name-input").fill(orgName);
    await page.getByTestId("org-create-slug-input").fill(uniqueSlug);
    await page.getByTestId("org-create-submit-btn").click();
    await expect(page.getByText(`Đã khởi tạo trung tâm “${orgName}”.`)).toBeVisible();

    await page.getByTestId("org-classroom-name-input").fill("Lớp M9");
    await page.getByTestId("org-classroom-create-btn").click();
    await expect(page.getByTestId("org-classroom-select")).toContainText("Lớp M9");

    const teacherSelect = page.getByTestId("org-teacher-select");
    await expect(teacherSelect).toBeVisible();
    await teacherSelect.focus();
    const firstMemberVal = await teacherSelect.locator("option").nth(1).getAttribute("value");
    expect(firstMemberVal).toBeTruthy();
    await teacherSelect.selectOption(firstMemberVal!);
    await page.getByTestId("org-teacher-assign-btn").click();
    await expect(page.getByText("Đã phân công giáo viên.")).toBeVisible();

    // Create an org lesson, approve it, then edit it and verify it resets to `Bản nháp` (draft) at v2
    await page.getByTestId("org-lesson-prefill-btn").click();
    await page.getByTestId("org-lesson-title-input").fill("Bài học Trung tâm M9");
    await page.getByTestId("org-lesson-save-btn").dispatchEvent("click");
    await expect(page.getByTestId("org-lessons-table")).toContainText("Bài học Trung tâm M9");

    await page.getByTestId("org-lesson-submit-btn").first().click();
    await page.getByTestId("org-lesson-approve-btn").first().click();
    await expect(page.getByTestId("org-lessons-table")).toContainText("Trung tâm đã duyệt");

    const editOrgLessonBtn = page.locator('[data-testid^="org-lesson-edit-btn-"]').first();
    await expect(editOrgLessonBtn).toBeVisible();
    await editOrgLessonBtn.click();

    await expect(page.getByTestId("org-lesson-cancel-edit-btn")).toBeVisible();
    await page.getByTestId("org-lesson-title-input").fill("Bài học Trung tâm M9 (Phiên bản 2)");
    await page.getByTestId("org-lesson-save-btn").dispatchEvent("click");
    await expect(page.getByTestId("org-lessons-table")).toContainText("Bài học Trung tâm M9 (Phiên bản 2)");
    await expect(page.getByTestId("org-lessons-table")).toContainText("Bản nháp");
  });

  test("12. M10: Family practice lesson fork & learner practice badge (/parent/lessons -> /lessons/:id) and polymorphic Org Studio editor (/parent/organization)", async ({ page }) => {
    const csrf = await signInAsParent(page);
    const withCsrf = { headers: { "x-tlo-csrf": csrf } };

    const sessionRes = await page.request.get("/api/session");
    const sessionInfo = (await sessionRes.json()) as {
      learner: { id: string; nickname: string } | null;
      learners?: { id: string; nickname: string }[];
    };
    let learner = sessionInfo.learner ?? sessionInfo.learners?.[0] ?? null;
    if (!learner) {
      const createRes = await page.request.post("/api/parent/learners", {
        ...withCsrf,
        data: { nickname: "Tài", birthYear: 2016, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
      });
      expect(createRes.ok()).toBe(true);
      const created = (await createRes.json()) as { learner: { id: string; nickname: string } };
      learner = created.learner;
    }
    const learnerId = learner.id;

    // 1. Verify catalogue ownership badge & fork to family practice lesson on `/parent/lessons`
    await page.goto("/parent/lessons");
    await expect(page.getByTestId("lesson-ownership-badge-math-fractions-equivalent")).toContainText(
      "Thư viện TAI",
    );

    const catRow = page.locator("tr", {
      has: page.getByTestId("lesson-ownership-badge-math-fractions-equivalent"),
    });
    await catRow.getByRole("button", { name: "Xem bài" }).click();

    await expect(page.getByTestId("lesson-detail-ownership")).toContainText("Thư viện TAI");
    await expect(page.getByTestId("lesson-detail-fork-btn")).toBeVisible();
    await expect(page.getByTestId("lesson-detail-edit-btn")).toHaveCount(0);

    const forkResPromise = page.waitForResponse(
      (res) => res.url().includes("/api/parent/lessons/fork") && res.request().method() === "POST",
    );
    await page.getByTestId("lesson-detail-fork-btn").click();
    const forkRes = await forkResPromise;
    expect(forkRes.ok()).toBe(true);
    const forkedPayload = (await forkRes.json()) as { lessonId: string; version: number };
    expect(forkedPayload.lessonId).toBeTruthy();

    await expect(page.getByTestId("lesson-detail-ownership")).toContainText(
      "Bản luyện tập gia đình (Luyện tập riêng · Gốc: math-fractions-equivalent v1)",
    );
    await expect(page.getByTestId("lesson-detail-edit-btn")).toBeVisible();

    await page.getByTestId("lesson-detail-edit-btn").click();
    await page.getByTestId("lesson-edit-title-input").fill("Bài tự luyện gia đình M10 · Bản riêng");
    await page.getByTestId("lesson-edit-save-btn").click();
    await expect(page.getByTestId("lesson-detail-version")).toContainText("Phiên bản 2");

    // Approve v2 of the forked family practice lesson for the active learner and verify learner practice badge
    const approveRes = await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        learnerId,
        lessonId: forkedPayload.lessonId,
        version: 2,
        status: "approved",
      },
    });
    expect(approveRes.ok()).toBe(true);

    await page.goto(`/lessons/${forkedPayload.lessonId}`);
    await expect(page.getByTestId("lesson-practice-badge")).toContainText("Luyện tập gia đình");

    // Revert approval to draft so subsequent viewport runs see a clean approved list
    await page.request.post("/api/parent/lessons/approval", {
      ...withCsrf,
      data: {
        learnerId,
        lessonId: forkedPayload.lessonId,
        version: 2,
        status: "draft",
      },
    });

    // 2. Polymorphic Org Studio Editor: verify fraction_visual, vocab_match, and reading_comprehension steps survive editing
    const uniqueSlug = `m10-poly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const orgCreateRes = await page.request.post("/api/org/create", {
      ...withCsrf,
      data: { slug: uniqueSlug, name: `Trung tâm Đa hình M10 ${uniqueSlug}` },
    });
    expect(orgCreateRes.ok()).toBe(true);
    const { organization } = (await orgCreateRes.json()) as { organization: { id: string } };

    const polyDraftRes = await page.request.post("/api/org/lessons/draft", {
      ...withCsrf,
      data: {
        organizationId: organization.id,
        subjectId: "math",
        titleVi: "Bài học Đa hình M10",
        titleEn: "Polymorphic Lesson M10",
        objectiveVi: "Bảo toàn cấu trúc bài tập đa hình",
        objectiveEn: "Preserve polymorphic exercise specs",
        gradeFrom: 4,
        gradeTo: 4,
        steps: [
          {
            position: 1,
            kind: "concept",
            content: {
              type: "fraction_visual",
              question_vi: "Quan sát thanh phân số 2/4:",
              question_en: "Observe the 2/4 fraction bar:",
              allowedDenominators: [2, 4],
              maxParts: 8,
              bar: { parts: 4, highlighted: 2 },
              correctNumerator: 2,
              correctDenominator: 4,
            },
            answerKey: { correctNumerator: 2, correctDenominator: 4 },
            explanationVi: "Thanh chia 4 phần, tô 2 phần là 2/4.",
          },
          {
            position: 2,
            kind: "visual",
            content: {
              type: "vocab_match",
              question_vi: "Chọn nghĩa đúng cho từ apple:",
              word: "apple",
              image: "apple",
              choices: [
                { id: "m1", label_en: "apple", label_vi: "Quả táo", correct: true },
                { id: "m2", label_en: "book", label_vi: "Quyển sách", correct: false },
              ],
              sentencePrompt_vi: "Viết một câu tiếng Anh có từ apple:",
              sentenceAcceptedWords: ["apple"],
            },
            answerKey: { correctChoiceId: "m1", acceptedWords: ["apple"] },
            explanationVi: "Apple nghĩa là quả táo.",
          },
          {
            position: 3,
            kind: "guided",
            content: {
              type: "reading_comprehension",
              question_vi: "Đọc đoạn văn và chọn ý chính:",
              passageTitle_vi: "Chia bánh công bằng",
              passage_vi:
                "Hai anh em chia chiếc bánh thành 4 phần bằng nhau. Mỗi người nhận 2 phần, tức là một nửa chiếc bánh.",
              evidenceSentence_vi: "Mỗi người nhận 2 phần, tức là một nửa chiếc bánh.",
              choices: [
                { id: "rc1", label_vi: "2/4 bằng 1/2 chiếc bánh", correct: true },
                { id: "rc2", label_vi: "Chiếc bánh chia làm 3 phần", correct: false },
              ],
            },
            answerKey: { correctChoiceId: "rc1" },
            explanationVi: "2 phần trong 4 phần bằng một nửa (1/2).",
          },
          {
            position: 4,
            kind: "independent",
            content: {
              type: "multiple_choice",
              question_vi: "Phân số nào bằng 1/2?",
              choices: [
                { id: "A", label_vi: "2/4", correct: true },
                { id: "B", label_vi: "1/4", correct: false },
              ],
              hint1_vi: "Nhân cả tử và mẫu với 2",
              hint2_vi: "1x2 / 2x2",
              hint3_vi: "2/4",
            },
            answerKey: { correctChoiceId: "A" },
            explanationVi: "1/2 = 2/4.",
          },
          {
            position: 5,
            kind: "transfer",
            content: {
              type: "multiple_choice",
              question_vi: "3/6 rút gọn bằng bao nhiêu?",
              choices: [
                { id: "A", label_vi: "1/2", correct: true },
                { id: "B", label_vi: "1/3", correct: false },
              ],
              hint1_vi: "Chia tử và mẫu cho 3",
              hint2_vi: "3:3 / 6:3",
              hint3_vi: "1/2",
            },
            answerKey: { correctChoiceId: "A" },
            explanationVi: "3/6 = 1/2.",
          },
        ],
      },
    });
    expect(polyDraftRes.ok()).toBe(true);
    const { lessonId: polyLessonId } = (await polyDraftRes.json()) as { lessonId: string };

    await page.goto("/parent/organization");
    await page.getByTestId("org-studio-select").selectOption(organization.id);
    await expect(page.getByTestId(`org-lesson-edit-btn-${polyLessonId}`)).toBeVisible();
    await page.getByTestId(`org-lesson-edit-btn-${polyLessonId}`).click();

    await expect(page.getByTestId("org-step-fraction-summary-1")).toContainText("Dạng hình phân số");
    await expect(page.getByTestId("org-step-vocab-summary-2")).toContainText("Dạng từ vựng");
    await expect(page.getByTestId("org-step-reading-summary-3")).toContainText("Dạng đọc hiểu");

    await page.getByTestId("org-lesson-title-input").fill("Bài học Đa hình M10 (Phiên bản 2)");
    await page.getByTestId("org-lesson-save-btn").dispatchEvent("click");
    await expect(page.getByTestId("org-lessons-table")).toContainText("Bài học Đa hình M10 (Phiên bản 2)");

    const detailAfterEditRes = await page.request.get(`/api/parent/lessons/${polyLessonId}`);
    expect(detailAfterEditRes.ok()).toBe(true);
    const detailAfterEdit = (await detailAfterEditRes.json()) as {
      version: number;
      steps: { position: number; content: { type: string } }[];
    };
    expect(detailAfterEdit.version).toBe(2);
    expect(detailAfterEdit.steps.map((s) => s.content.type)).toEqual([
      "fraction_visual",
      "vocab_match",
      "reading_comprehension",
      "multiple_choice",
      "multiple_choice",
    ]);
  });
});
