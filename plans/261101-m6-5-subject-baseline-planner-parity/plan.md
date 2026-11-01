---
title: "M6: 5-Subject Baseline Diagnostic & 4-Week Planner Parity, Tenant/Multi-Learner Hardening & Evergreen Docs Sync"
status: completed
created_at: 2026-11-01
branch: feat/m6-full-5-subject-baseline-planner-and-docs
---

# M6 Implementation Plan — 5-Subject Baseline Diagnostic & 4-Week Planner Parity

## 1. Objective & Scope
Following M5 Phase 3 (`science` and `debate` modules activated in `subjects`, `skills`, `skill_prerequisites`, `curriculum_objectives`, and 4 Grade 4 lessons), complete full 5-subject parity across the Baseline Diagnostic Assessment flow, 4-Week Learning Planner, Multi-Learner / Organization-Lesson Tenant Visibility boundaries, and Evergreen Architecture Documentation.

### Non-Negotiable Constraints
- Preserve all security and pedagogical invariants:
  - Per-learner and per-version lesson approvals (`review_approvals`).
  - 30-minute continuation grace deadline (`continuation_deadline`) enforced at SQLite execution time.
  - Zero answer keys in learner payloads (`toLearnerExercise()`); `explanationVi` withheld until correct attempt.
  - Any hint or retry produces `assisted` (`SUPPORTED`) evidence, never `observed` (`INDEPENDENT`).
- Release policy: `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`. Do not touch `.wrangler/state`, `.dev.vars`, or port `8791`.

## 2. Work Tracks

### Track 1 — 5-Subject Baseline Diagnostic Lessons & UI Parity (`science` & `debate`)
1. Author `src/shared/content/science/baseline-science-grade4.ts` (`id: "sci-baseline-grade4"`, `subjectId: "science"`, `skillId: "sci-water-cycle"`, `isBaseline: true`, 5 steps: `concept` → `concept` → `guided` → `independent` → `transfer`).
2. Author `src/shared/content/debate/baseline-debate-grade4.ts` (`id: "deb-baseline-grade4"`, `subjectId: "debate"`, `skillId: "deb-claim-reason"`, `isBaseline: true`, 5 steps: `concept` → `concept` → `guided` → `independent` → `transfer`).
3. Register both baseline lessons in `src/shared/content/index.ts` (bringing total lessons to 21 across 5 active subjects: 16 regular + 5 baseline).
4. Update `src/client/screens/parent/BaselineAssessmentScreen.tsx`:
   - Expand `SUBJECTS` from 3 to all 5 active subjects (`math`, `vietnamese`, `english`, `science`, `debate`).
   - Pass explicit `learnerId` (`readActiveLearnerId()` / `session.learner?.id`) in `POST /api/parent/baseline` and guard `GET`/`POST` responses against stale multi-learner switching (`mountedRef`, `requestSeqRef`).

### Track 2 — Tenant Visibility & School-Year Continuity on Baseline, Planner & Curriculum Routes
1. In `src/worker/routes/parent.ts`:
   - Extract `filterVisibleLessonsForParent(db, parentId, learnerId, lessons)` and apply it consistently across `getParentDashboard`, `listLessonsForParent`, `getBaselineAssessments`, `evaluateBaselineAssessment`, `getFourWeekPlan`, and `generateFourWeekPlanRoute` so cross-tenant `organization_lessons` never leak into baseline suggested lessons or 4-week planner slots.
   - Ensure `getCurriculumSetup`, `getFourWeekPlan`, and `generateFourWeekPlanRoute` consult `findActiveSchoolYear` first when resolving the default `schoolYearLabel` so school-year transitions (`POST /api/parent/school-years`) propagate immediately to curriculum and 4-week planning.
2. In `src/client/screens/parent/FourWeekPlannerScreen.tsx`:
   - Pass explicit `learnerId` in `POST /api/parent/planner/generate` and `PATCH /api/parent/planner/item` and guard `GET`/`POST`/`PATCH` responses against stale multi-learner switching (`mountedRef`, `requestSeqRef`).

### Track 3 — Evergreen Documentation Synchronization
1. Synchronize `CLAUDE.md`, `README.md`, `docs/BASELINE_ASSESSMENT.md`, `docs/DATA_MODEL.md`, and `docs/ROADMAP_90_DAYS.md` with exact verified metrics (22 D1 tables, 10 migrations `0001`–`0010`, 5 active subjects, 21 Grade 4 lessons including 5 baseline diagnostics, and `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED` policy).

## 3. Acceptance Criteria & Verification Gates
- [x] `npm run validate:lessons` passes with 21 lessons (112 steps) and 0 schema/answer-leak/pedagogy issues.
- [x] Unit tests (`test/unit/content-registry.test.ts` / `test/unit/planner.test.ts`) verify 21 lessons including `sci-baseline-grade4` and `deb-baseline-grade4`.
- [x] Integration tests (`test/integration/m5-phase3-prerequisites-school-years-and-subjects.test.ts`) verify 5-subject baseline evaluation (`science`, `debate`), cross-tenant org-lesson exclusion in baseline/planner, and active school-year propagation into planner generation.
- [x] Playwright E2E browser tests (`test/e2e/m4-browser-verification.spec.ts`) verify 5-subject cards on `/parent/baseline` (`science` and `debate` baseline evaluation) and 4-week planner generation across all 3 viewports (Desktop, Tablet, Mobile).
- [x] `npm run verify`, `npm run test:integration`, and `npm run test:e2e` pass with 0 errors.
