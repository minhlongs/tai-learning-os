---
title: "M2 & M3: Teacher Lesson Authoring, Center & Parent Approval, and Multi-Learner Pilot Fixture"
status: completed
created: 2026-10-30
---

# M2 & M3: Teacher Lesson Authoring, Center & Parent Approval, and Multi-Learner Pilot Fixture

- **Status:** completed
- **Date:** 2026-10-30
- **Scope:** M2 (Teacher Content Authoring + Multi-Tier Approval Workflow) & M3 (Multi-Learner Local Pilot Fixture & E2E Verification)

---

## 1. Overview & Context

To support a true B2B2C learning environment (Parent ↔ Learning Center / Tutor ↔ Learner), `tai-learning-os` implements:
1. **Teacher Lesson Authoring (M2):** Teachers draft lessons in their assigned organizations.
2. **Center Review (M2):** Center owners/admins review and approve/reject lessons (`draft` → `submitted` → `org_approved` / `org_rejected`).
3. **Classroom Assignments (M2):** Approved lessons are assigned to specific classrooms with due dates.
4. **Parent Approval Sovereignty (M2):** Parents must explicitly approve center-assigned lessons (`review_approvals.status = 'approved'`) before their children can view or start them.
5. **Multi-Learner Pilot Fixture (M3):** 1 Center, 1 Owner, 2 Teachers (Toán 4A & Anh-Việt 4B), 5 Grade-4 Learners under 5 Parent accounts demonstrating end-to-end learning, instant revocation, and cascade erasure.

---

## 2. Invariants & Safety

- **Release Policy:** LOCAL ONLY / PRODUCTION BLOCKED. No remote push, no deployment.
- **Child Privacy by Absence:** No full legal names, no dates of birth, no emails, no phones, no addresses.
- **PII-Free Audit:** Child nicknames are never written into immutable `audit_events`.
- **Zero Answer Keys on Wire:** `content` is stripped of answer keys before sending to child mode.
- **Server-Side Enforcement:** Learner `startSession` verifies both `review_approvals.status = 'approved'` AND that the lesson is `org_approved` and assigned to a classroom the learner is actively enrolled in with active parent consent.

---

## 3. Implemented Components

1. **Database Schema & Migrations:**
   - `migrations/0006_lesson_authoring_and_assignments.sql` creates `organization_lessons` and `classroom_lesson_assignments`.
   - Updated `test/integration/test-db.ts` and `src/worker/db/reset-user-data.ts`.

2. **Routes & Handlers:**
   - `POST /api/org/lessons/draft`: Teacher drafts lesson (exercises validated).
   - `POST /api/org/lessons/submit`: Submit for center review.
   - `POST /api/org/lessons/review`: Center owner/admin approves or rejects.
   - `POST /api/org/classrooms/assign-lesson`: Assign approved lesson to classroom.
   - `GET /api/org/classrooms/assigned-lessons`: Staff lists assigned lessons.
   - `GET /api/parent/classroom-lessons`: Parent views assigned lessons for enrolled child with consent.
   - Guard in `src/worker/routes/learner.ts` (`startSession`): Enforces classroom assignment and center approval in addition to parent approval.

3. **M3 Pilot Fixture & Seed:**
   - `test/integration/pilot-fixture.ts`: Canonical fixture containing 1 Center, 2 Teachers, 2 Classrooms, 5 Learners, and `seedPilotFixture` function.
   - `scripts/seed-pilot.mjs`: CLI seed script (`npm run seed:pilot`).
   - `test/integration/pilot-b2b2c-lifecycle.test.ts`: Comprehensive E2E test verifying all steps of the lifecycle.

---

## 4. Verification Evidence

- `npm run typecheck`: 0 errors.
- `npm run lint`: 0 errors.
- `npm run test`: 10 test files, 184 tests passed.
- `npm run test:integration`: 8 test files, 109 tests passed.
- `npm run verify`: all gates green.
