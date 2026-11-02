---
title: "Milestone M11: Family Practice Planner Integration, Version-Pinned Classroom Progress & End-to-End Practice Transparency"
description: "Schedule parent-owned family practice lessons into the 4-week planner, pin assigned_version on classroom lesson assignments with consent-gated progress reporting, render end-to-end Luyện tập gia đình badges across learner/parent screens, and support itemKind = 'practice' in portable backup/restore."
status: completed
priority: P1
effort: 6h
branch: feat/m11-practice-planner-and-classroom-progress
tags: [m11, family-practice, planner, classroom-progress, consent, backup-restore, d1]
created: 2026-11-02
updated: 2026-11-02
---

# Plan — Milestone M11: Family Practice Planner Integration, Version-Pinned Classroom Progress & End-to-End Practice Transparency

## 1. Objective & Scope

Deliver Milestone M11 for TAI Learning OS on branch `feat/m11-practice-planner-and-classroom-progress` (anchored from `main` `884e677`):

1. **Schema Migration `0013_practice_planner_and_classroom_progress.sql` (Schema v13)**:
   - Add `assigned_version INTEGER NOT NULL DEFAULT 1 CHECK (assigned_version >= 1)` to `classroom_lesson_assignments` and backfill from `lessons.version`.
   - Rebuild `learning_plan_items` via the standard SQLite 4-step table rebuild to widen `CHECK (item_kind IN ('lesson', 'review', 'baseline', 'practice'))` while preserving all 16 columns, foreign keys, and recreating `idx_learning_plan_items_learner_week` and `idx_learning_plan_items_status`.
   - Record schema version `13` in `schema_versions` and register `0013_practice_planner_and_classroom_progress.sql` in `test/integration/test-db.ts` and `scripts/backup-restore-drill.mjs`.
2. **Family Practice Lesson Scheduling in the 4-Week Planner (`POST /api/parent/planner/schedule-practice`)**:
   - Allow a parent to schedule an owned (`ownership_type = 'family'`, `owner_parent_id = parentId`, `purpose = 'practice'`) lesson into a chosen `weekIndex` (`1..4`) and `dayOfWeek` (`1..7`) of the learner's active school year (`item_kind = 'practice'`, `status = 'scheduled'`).
   - Preserve scheduled `item_kind = 'practice'` rows when `POST /api/parent/planner/generate` regenerates official 4-week plan items (`deleteScheduledPlanItemsForLearner` filters `AND item_kind != 'practice'`).
   - Keep `generateFourWeekPlanRoute` restricted to `official` lessons so automatic curriculum generation never schedules `practice` lessons into official slots.
   - Update `buildFourWeekPlanResponse` so `lessonById` includes the parent's `family` (`practice`) lessons, returning `purpose` on `LearningPlanItemDto` and `availablePracticeLessons` on `FourWeekPlanResponse`.
   - Add quick practice scheduling UI on `FourWeekPlannerScreen.tsx` and a practice action CTA in the `needsAttention` section of `DashboardScreen.tsx`.
3. **Version-Pinned Classroom Assignments & Consent-Gated Classroom Progress (`GET /api/org/classrooms/progress`)**:
   - Pin `assigned_version = lesson.version` when assigning an `org_approved` lesson to a classroom (`POST /api/org/classrooms/assign-lesson`), updating `assigned_version` on conflict.
   - Evaluate parent approval status against `assigned_version` in `listParentClassroomLessonsRoute`.
   - Add `GET /api/org/classrooms/progress?classroomId=...` restricted to organization `owner`/`admin` or a `teacher` assigned to that classroom (`repo.isTeacherAssignedToClassroom`), returning `403 Forbidden` otherwise.
   - Strictly filter learners by `classroom_enrollments.status = 'enrolled'`, `learner_consents.status = 'active'` (for the classroom's `organization_id`), and `learners.archived_at IS NULL` so revoked consent immediately hides the learner.
   - Return per-learner, per-assignment `assignedVersion`, `parentApprovalStatus` (`approved` | `rejected` | `pending`), `completedSessionCount` (counting completed `official` sessions), and `lastCompletedAt`, and render the classroom progress table in `OrganizationStudioScreen.tsx`.
4. **End-to-End Vietnamese Practice Transparency Badges**:
   - Surface `purpose` on `LearnerLessonSummary` and `ParentDashboardResponse["recentSessions"]`.
   - Render explicit `"Luyện tập gia đình · Không tính độc lập"` / `"Luyện tập gia đình"` badges across `LearnerHomeScreen.tsx`, `CompletedList.tsx`, `SessionSummaryScreen.tsx`, `DashboardScreen.tsx` (`RecentSessions`), and `FourWeekPlannerScreen.tsx`.
5. **Portable Backup/Restore Support for `itemKind = 'practice'` & Documentation Sync**:
   - Widen `VALID_PLAN_ITEM_KINDS` and `LearningPlanItemExport["itemKind"]` in `src/shared/schemas/transfer.ts` to include `"practice"`, enforcing bidirectional consistency between `itemKind === "practice"` and `lesson.purpose === "practice"`.
   - Enforce ownership and purpose collision checks for `learningPlanItems` in `detectLessonImportCollision` (`src/worker/routes/data.ts`).
   - Update `docs/DATA_MODEL.md`, `docs/ROADMAP_90_DAYS.md`, and `CLAUDE.md`.

## 2. Non-Negotiable Constraints

- **PRODUCTION DEPLOY / LIVE CHILD PILOT: BLOCKED**: No `wrangler deploy`, remote migrations, remote resource provisioning, paid/external LLM APIs, or live child pilot.
- **Local Dev State Untouched**: Do not open or reset `.wrangler/state`, `.dev.vars`, or dev server on port `8791`. Use isolated test databases and synthetic data.
- **Pedagogical & Security Invariants**: Preserve parent/learner mode boundary, CSRF (`x-tlo-csrf`), zero answer keys in learner payloads (`toLearnerExercise`), `explanationVi` unlocked only after `correct`, hint/retry flooring (`assisted`), mastery isolation (`practice` never alters `skill_evidence` or `review_schedule`), and 30-minute session grace window.

## 3. Phases & File Ownership

| Phase | Title | Owned Files | Status |
| :--- | :--- | :--- | :--- |
| Phase 1 | Schema Migration `0013`, Contracts & Repository Layer | `migrations/0013_practice_planner_and_classroom_progress.sql`, `src/worker/db/schema.ts`, `src/shared/api-contract.ts`, `src/worker/db/repositories.ts`, `test/integration/test-db.ts`, `scripts/backup-restore-drill.mjs` | completed |
| Phase 2 | Practice Planner Scheduling, Classroom Progress API & Transfer Validation | `src/worker/routes/parent.ts`, `src/worker/routes/learner.ts`, `src/worker/routes/organization-lessons.ts`, `src/worker/routes/data.ts`, `src/shared/schemas/transfer.ts`, `src/worker/index.ts`, `src/client/lib/endpoints.ts` | completed |
| Phase 3 | Learner, Parent & Organization UI Updates | `src/client/screens/parent/FourWeekPlannerScreen.tsx`, `src/client/screens/parent/DashboardScreen.tsx`, `src/client/screens/parent/OrganizationStudioScreen.tsx`, `src/client/screens/learner/LearnerHomeScreen.tsx`, `src/client/components/learner/CompletedList.tsx`, `src/client/screens/learner/SessionSummaryScreen.tsx`, `src/client/screens/learner/SessionPlayerScreen.tsx` | completed |
| Phase 4 | Multi-Layer Verification, Tests & Documentation | `test/unit/export-import.test.ts`, `test/integration/family-practice-and-version-backup.test.ts`, `test/integration/organization-and-consent.test.ts`, `docs/DATA_MODEL.md`, `docs/ROADMAP_90_DAYS.md`, `CLAUDE.md` | completed |

## 4. Acceptance Criteria & Verification Gates

1. `migrations/0013_practice_planner_and_classroom_progress.sql` adds `classroom_lesson_assignments.assigned_version` and rebuilds `learning_plan_items` to allow `item_kind = 'practice'` while preserving all 16 columns and recreating indexes.
2. `POST /api/parent/planner/schedule-practice` schedules a parent-owned `family` (`practice`) lesson into a chosen `(weekIndex, dayOfWeek)` slot, rejects `official` or another parent's `family` lesson (`400`/`403`), and `POST /api/parent/planner/generate` preserves scheduled `practice` items while generating official items only from `official` lessons.
3. Completing a scheduled `practice` session automatically marks the matching `learning_plan_items` row `completed` without mutating `skill_evidence` or `review_schedule`.
4. `POST /api/org/classrooms/assign-lesson` pins `assigned_version = lesson.version`; `GET /api/org/classrooms/progress?classroomId=...` enforces RBAC (`owner`/`admin` or assigned `teacher`, `403` for unassigned teacher), returns only enrolled learners with `learner_consents.status = 'active'`, and immediately omits learners whose consent is revoked.
5. `"Luyện tập gia đình"` / `"Luyện tập gia đình · Không tính độc lập"` badges render on `LearnerHomeScreen.tsx`, `CompletedList.tsx`, `SessionSummaryScreen.tsx`, `DashboardScreen.tsx`, and `FourWeekPlannerScreen.tsx`, and `OrganizationStudioScreen.tsx` renders the classroom progress table.
6. `validateExportEnvelope` and `importRecord` support `itemKind = 'practice'` on `learningPlanItems` and reject mismatched `itemKind` vs `lesson.purpose` or cross-parent `family` lesson references (`400`/`409`).
7. All verification suites pass with 0 errors:
   - `npm run verify` (`typecheck` + `lint` + `test` + `validate:lessons` + `build`)
   - `npm run test:integration`
   - `npm run backup:drill`
