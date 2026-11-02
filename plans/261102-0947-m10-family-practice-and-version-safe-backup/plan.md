---
title: "Milestone M10: Family Practice Lessons, Mastery Isolation, Polymorphic Org Editor & Version-Safe Backup"
description: "Server-authoritative lesson ownership/purpose/lineage, family practice fork & approval, official mastery isolation, polymorphic org studio editor, and version-scoped collision-safe backup/restore."
status: completed
priority: P1
effort: 8h
branch: feat/m10-family-practice-and-version-safe-backup
tags: [m10, family-practice, mastery-isolation, org-editor, backup-restore, security, d1]
created: 2026-11-02
updated: 2026-11-02
---

# Plan — Milestone M10: Family Practice Lessons, Mastery Isolation, Polymorphic Org Studio Editor & Version-Safe Backup

## 1. Objective & Scope

Deliver Milestone M10 for TAI Learning OS on branch `feat/m10-family-practice-and-version-safe-backup` (anchored from baseline `f9103aa539e00c0b5fa5f70c12c5e41fc466cff0` / `main` `bc63f56592492f689212ca7c6b07dae9d3142f1b`):

1. **Durable Server-Authoritative Lesson Ownership, Purpose, and Lineage (`0012_family_practice_and_version_lineage.sql`)**:
   - Distinguish three lesson ownership classes on `lessons`: `catalogue` (shared TAI library), `organization` (center/org lessons), and `family` (family-private forked practice lessons owned by a single `owner_parent_id`).
   - Persist `purpose` (`official` vs `practice`) on `lessons`, `learning_sessions`, and `learning_attempts`.
   - Persist `source_lesson_id`, `source_version` on `lessons` and `source_step_id` on `lesson_steps`.
2. **Family-Owned Practice Lesson Fork & Approval Workflow**:
   - Add `POST /api/parent/lessons/fork` to fork a TAI `catalogue` lesson at a pinned `sourceVersion` into a new `family` lesson (`purpose = 'practice'`, `version = 1`, `owner_parent_id = context.parent.parentId`), copying `lesson_versions`, `lesson_steps` (with `source_step_id`), and `lesson_metadata` (`is_baseline = 0`), while never copying approvals, attempts, mastery, or organization permissions.
   - Reject direct parent edits to `catalogue` lessons (`403 Forbidden`) and reject forking `organization` or `family` lessons (`403 Forbidden`).
   - Enforce strict cross-family and resource-based teacher isolation across `listLessons`, `getLessonDetail`, `updateLessonContent`, `setLessonApproval`, `startSession`, `getLearnerHome`, `listSubjectsForLearner`, and `exportRecord`.
   - Require explicit per-learner, per-immutable-version approval (`review_approvals.status = 'approved'`) before a learner can view or start a family practice lesson.
3. **Practice Purpose Isolation from Official Mastery**:
   - Stamp `session.purpose` and `attempt.purpose` strictly server-side from `lesson.purpose` (never trusting request body or query params).
   - Keep full grading, progressive hint disclosure, retry counting, `explanationVi` unlock after `correct`, and 30-minute continuation grace window on practice sessions.
   - Exclude `purpose = 'practice'` sessions and attempts from `skill_evidence`, `review_schedule`, `evaluateBaselineAssessment`, `getBaselineAssessments`, `generateFourWeekPlanRoute`, `derivePrerequisiteRecommendations` (`recommendedNextLessons`), `needsAttention`, `recordParentCorrection` official counters, and official `independentAttempts` / `assistedAttempts` on the parent dashboard.
4. **Polymorphic Exercise Preservation in `OrganizationStudioScreen.tsx`**:
   - Preserve all 4 `ExerciseSpec` types (`multiple_choice`, `fraction_visual`, `vocab_match`, `reading_comprehension`) and their `answerKey` when opening an organization lesson for editing in `LessonStudioSection`, eliminating the destructive `blankChoiceStep` fallback.
   - Preserve user draft on `409 Conflict` (`expectedVersion` mismatch) and offer a button to reload the latest server version.
5. **Version-Scoped Export & Fail-Closed Collision-Safe Import**:
   - Filter `exportRecord` so `lessonVersions` and `lessonSteps` only include the exact `(lesson_id, version)` pairs authorized for or referenced by the exported learner's history (never leaking unapproved/unassigned draft versions of an organization lesson).
   - Strengthen `validateExportEnvelope` and `importRecord` to reject duplicate `(lessonId, version)`, verify session/approval/attempt version referential integrity, remove blind synthesis of missing historical `lesson_versions` from current `lessons` when `lessonVersions` is present, and enforce pre-flight payload identity checks on colliding shared (`catalogue`/`organization`) or `family` rows before any database writes.
   - Expand `scripts/backup-restore-drill.mjs` to verify multi-version historical restore, collection parity across all exported collections, and practice isolation during restore.

## 2. Non-Negotiable Constraints

- **PRODUCTION DEPLOY / LIVE CHILD PILOT: BLOCKED**: No `wrangler deploy`, remote migrations, remote resource provisioning, paid/external LLM APIs, or live child pilot.
- **Local Dev State Untouched**: Do not open or reset `.wrangler/state`, `.dev.vars`, or dev server on port `8791`. Use isolated test databases and synthetic data.
- **Pedagogical & Security Invariants**: Preserve parent/learner mode boundary, CSRF (`x-tlo-csrf`), zero answer keys in learner payloads (`toLearnerExercise`), `explanationVi` unlocked only after `correct`, hint/retry flooring (`assisted`), and 30-minute session grace window.

## 3. Phases & File Ownership

| Phase | Title | Owned Files | Status |
| :--- | :--- | :--- | :--- |
| Phase 1 | Schema Migration `0012`, Contracts & Repository Layer | `migrations/0012_family_practice_and_version_lineage.sql`, `src/worker/db/schema.ts`, `src/shared/api-contract.ts`, `src/worker/db/repositories.ts`, `scripts/migrate-local.mjs`, `test/integration/helpers/d1.ts` | completed |
| Phase 2 | Family Fork API, Resource Authorization & Practice Mastery Isolation | `src/worker/routes/parent.ts`, `src/worker/routes/learner.ts`, `src/worker/routes/organization-lessons.ts`, `src/worker/services/session-service.ts`, `src/worker/index.ts`, `src/client/lib/endpoints.ts` | completed |
| Phase 3 | Version-Scoped Export, Fail-Closed Import & Encrypted Drill | `src/shared/schemas/transfer.ts`, `src/worker/routes/data.ts`, `scripts/backup-restore-drill.mjs` | completed |
| Phase 4 | Parent Lesson Manager, Polymorphic Org Editor & Learner Practice UI | `src/client/screens/parent/LessonManagerScreen.tsx`, `src/client/screens/parent/OrganizationStudioScreen.tsx`, `src/client/screens/learner/LessonScreen.tsx`, `src/client/screens/learner/LearnerHomeScreen.tsx`, `src/client/screens/learner/SubjectScreen.tsx`, `src/client/screens/learner/SessionSummaryScreen.tsx`, `src/client/screens/learner/components/LessonList.tsx` | completed |
| Phase 5 | Multi-Layer Verification, Tests & Documentation | `test/unit/export-import.test.ts`, `test/integration/family-practice-and-version-backup.test.ts`, `test/integration/data-round-trip.test.ts`, `test/e2e/m4-browser-verification.spec.ts`, `docs/DATA_MODEL.md`, `docs/CURRICULUM_ARCHITECTURE.md`, `docs/SECURITY.md`, `CLAUDE.md` | completed |

## 4. Acceptance Criteria & Verification Gates

1. `catalogue` lessons cannot be edited directly via `POST /api/parent/lessons/content` (`403 Forbidden`); parents fork via `POST /api/parent/lessons/fork` into a `family` lesson (`purpose = 'practice'`, `version = 1`) with pinned `sourceLessonId`, `sourceVersion`, and step `sourceStepId`.
2. Forking `organization` or `family` lessons via `POST /api/parent/lessons/fork` returns `403 Forbidden`.
3. Cross-family isolation holds across list, detail, content edit, approval, session start, learner home/subject, and export; a parent who is also a center teacher cannot use teacher privileges to access another family's `family` lesson or mutate a `catalogue` lesson.
4. Completing a `practice` session records `purpose = 'practice'` on `learning_sessions` and `learning_attempts`, grades exercises and unlocks hints/`explanationVi`, and causes **zero** mutations to `skill_evidence`, `review_schedule`, baseline assessments, 4-week plans, `recommendedNextLessons`, `needsAttention`, or official attempt counters.
5. `OrganizationStudioScreen.tsx` preserves `fraction_visual`, `vocab_match`, `reading_comprehension`, and `multiple_choice` steps when opening and saving an existing org lesson, and handles `409 Conflict` without losing the user's draft.
6. `exportRecord` exports only authorized/referenced `(lesson_id, version)` snapshots and steps; `importRecord` fails closed (`400`/`409`) on payload collisions or missing version references before mutating D1, and restores multi-version histories accurately without synthesizing historical titles from current `lessons`.
7. All verification suites pass with 0 errors:
   - `npm run verify` (`typecheck` + `lint` + `test` + `validate:lessons` + `build`)
   - `npm run test:integration`
   - `npm run backup:drill`
   - `npm run test:e2e` (Desktop, Tablet, Mobile)
