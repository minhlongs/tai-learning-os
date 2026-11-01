---
title: "M7: Parent Learning Goals Management, Curriculum School-Year Continuity, Sibling-Scoped Lesson Manager Isolation & Evergreen Docs Sync"
status: completed
created_at: 2026-11-01
branch: feat/m7-parent-goals-curriculum-continuity-and-lesson-isolation
---

# M7 Implementation Plan — Parent Learning Goals, Curriculum Continuity & Sibling-Scoped Lesson Manager Isolation

## 1. Objective & Scope
Deliver end-to-end Parent Learning Goals management (`learning_goals` API + UI on `/parent`), close Curriculum Setup active school-year continuity across multi-year intakes, enforce target-learner scoping for organization lessons in `/api/parent/lessons` and `/api/parent/lessons/:lessonId`, and synchronize remaining evergreen operational guides (`docs/PARENT_PILOT_GUIDE.md` and `docs/PARENT_OPERATIONS.md`).

### Non-Negotiable Constraints
- Preserve all security and pedagogical invariants:
  - Per-learner and per-version lesson approvals (`review_approvals`).
  - 30-minute continuation grace deadline (`continuation_deadline`) enforced at SQLite execution time.
  - Zero answer keys in learner payloads (`toLearnerExercise()`); `explanationVi` withheld until correct attempt.
  - Any hint or retry produces `assisted` (`SUPPORTED`) evidence, never `observed` (`INDEPENDENT`).
  - Owner-scoped SQL on every learner query (`parent_id` verification).
- Release policy: `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`. Do not touch `.wrangler/state`, `.dev.vars`, or port `8791`.

## 2. Work Tracks

### Track 1 — Parent Learning Goals Management (`POST /api/parent/goals`, `PATCH /api/parent/goals`, & `DashboardScreen.tsx`)
1. In `src/shared/api-contract.ts`:
   - Extend `ParentDashboardResponse["goals"][number]` to include `note: string | null` and `targetDate: string | null`.
   - Define `GoalStatus = "active" | "paused" | "achieved" | "retired"`, `CreateGoalRequest`, `CreateGoalResponse`, `UpdateGoalStatusRequest`, and `UpdateGoalStatusResponse`.
2. In `src/worker/db/repositories.ts`:
   - Add `findGoalForLearner(db, goalId, learnerId)` and `updateGoalStatus(db, { id, learnerId, status, note, now })` alongside existing `createGoal` and `listGoalsForLearner`.
3. In `src/worker/routes/parent.ts`, `src/worker/index.ts`, and `src/client/lib/endpoints.ts`:
   - Wire `parentRoute("POST", /^\/api\/parent\/goals$/, createLearningGoalRoute)` and `parentRoute("PATCH", /^\/api\/parent\/goals$/, updateLearningGoalStatusRoute)`.
   - Enforce owner-scoped `resolveTargetLearner`, validate `titleVi` (1–200 chars), optional `subjectId` (`math`, `vietnamese`, `english`, `science`, `debate`, or `null`), optional `targetDate` (`YYYY-MM-DD`), and `status` (`active`, `paused`, `achieved`, `retired`), and record `audit_events` (`goal.created`, `goal.status_updated`).
4. In `src/client/screens/parent/DashboardScreen.tsx`:
   - Render `ParentGoalsSection` whenever `data?.learner` is present (including before the learner's first completed session) so parents can set family learning goals (`Mục tiêu phụ huynh đặt ra`) from day 1 and update goal status (`active`, `paused`, `achieved`, `retired`) with full multi-learner race-safety guards.
   - Add direct navigation buttons in `dashboard-header__nav` for `/parent/curriculum` (`Chương trình học`), `/parent/baseline` (`Đánh giá đầu vào`), and `/parent/planner` (`Kế hoạch 4 tuần`) alongside `/parent/lessons` and `/parent/data`.

### Track 2 — Curriculum Setup Active School-Year Continuity (`CurriculumSetupScreen.tsx` & `parent.ts`)
1. In `src/client/screens/parent/CurriculumSetupScreen.tsx`:
   - In `syncFormForSubject(payload, subjectId)`, prefer the intake matching both `row.subjectId === subjectId` and `row.schoolYearLabel === payload.schoolYearLabel` before falling back to `row.subjectId === subjectId`.
   - When no intake exists for the selected subject (`else` branch), set `setSchoolYearLabel(payload.schoolYearLabel || "2026-2027")` instead of hardcoded `"2026-2027"`, preserving the active transitioned school year (e.g. `"2027-2028"`).

### Track 3 — Target-Learner Org-Lesson Isolation & Race-Safety on Lesson Manager (`parent.ts` & `LessonManagerScreen.tsx`)
1. In `src/worker/routes/parent.ts`:
   - In `listLessons` (`GET /api/parent/lessons`): when the caller is not a member of the organization owning an `organization_lesson`, check `assignedOrgLessonsForTargetLearner` (scoped to `targetLearner.id`) rather than unioning across all `parentLearners`, matching `setLessonApproval` (`POST /api/parent/lessons/approval`).
   - In `getLessonDetail` (`GET /api/parent/lessons/:lessonId`): resolve `targetLearner` first and scope non-member org-lesson visibility to `targetLearner.id` (falling back to any child only when no `targetLearner` exists).
2. In `src/client/screens/parent/LessonManagerScreen.tsx`:
   - Use `session.learner?.id ?? readActiveLearnerId()` in `handleGrantConsent`, `handleRevokeConsent`, and `openDetail`.
   - Guard async responses in `handleGrantConsent`, `handleRevokeConsent`, and `openDetail` against unmounted state and active-learner switches, and reset open lesson details when `session.learner?.id` changes.

### Track 4 — Evergreen Operational Guides & Multi-Layer Verification
1. Update `docs/PARENT_PILOT_GUIDE.md` and `docs/PARENT_OPERATIONS.md` to reflect all 5 active subjects (Toán, Tiếng Việt, Tiếng Anh, Khoa học, Tư duy phản biện) and document Parent Learning Goals (`Mục tiêu phụ huynh đặt ra`) on `/parent`.
2. Add comprehensive integration tests (`test/integration/m5-phase3-prerequisites-school-years-and-subjects.test.ts`) and Playwright E2E browser tests (`test/e2e/m4-browser-verification.spec.ts`) covering:
   - Parent Learning Goals creation, status updates, audit logging, learner-mode `403`, and cross-family `404` isolation.
   - Sibling-scoped org-lesson isolation in `GET /api/parent/lessons` and `GET /api/parent/lessons/:id`.
   - Curriculum Setup active school-year continuity (`2027-2028`) when switching across unconfigured subjects in the browser and Parent Learning Goals UI on `/parent`.

## 3. Acceptance Criteria & Verification Gates
- [x] `POST /api/parent/goals` and `PATCH /api/parent/goals` create and update learner-scoped goals with audit events, rejecting learner mode (`403`) and cross-family learner IDs (`404`).
- [x] `GET /api/parent/lessons` and `GET /api/parent/lessons/:id` isolate organization lessons per target sibling when the parent is not an organization member.
- [x] `CurriculumSetupScreen` preserves `payload.schoolYearLabel` (e.g. `"2027-2028"`) when switching to an unconfigured subject.
- [x] `npm run verify`, `npm run test:integration`, and `npm run test:e2e` pass with 0 errors.
