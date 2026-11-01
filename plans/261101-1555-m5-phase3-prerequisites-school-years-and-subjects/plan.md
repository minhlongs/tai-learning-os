---
title: "M5 Phase 3 — Prerequisite Graph Guided Recommendations, School-Year Continuity & Activated Science/Debate Modules"
status: completed
created: 2026-11-01
branch: feat/m5-phase3-prerequisites-school-years-and-subjects
ship_mode: official
route: feature
---

# M5 Phase 3 — Prerequisite Graph Guided Recommendations, School-Year Continuity & Activated Science/Debate Modules

## 1. Objective & Scope

Deliver **Full Phase 3 (M5)** from `docs/ROADMAP_90_DAYS.md`:

1. **Track 1 — Prerequisite Graph Guided Recommendations**:
   - Build a deterministic, pure prerequisite-graph recommendation engine in `src/shared/engine/planner.ts` (`derivePrerequisiteRecommendations`) that inspects `skills`, `skill_prerequisites`, `skill_evidence`, `lessons`, and `approvals` to surface recommended next skills/lessons for the parent on `GET /api/parent/dashboard` (`recommendedNextLessons`).
   - Categorize recommendations transparently into:
     - `prerequisite_gap`: Foundational prerequisite skills that are `NOT_OBSERVED` or `SUPPORTED` and needed to unlock downstream skills.
     - `unlocked_next`: Downstream skills whose prerequisites have all reached `INDEPENDENT`, `RETAINED`, or `TRANSFERRED`, while the skill itself is still `NOT_OBSERVED` or `SUPPORTED`.
     - `reinforce_supported`: Root skills currently in `SUPPORTED` state that need independent practice.
   - Surface each recommendation on `DashboardScreen.tsx` (`data-testid="prerequisite-recommendations"`) with its Vietnamese rationale (`reasonVi`), prerequisite list, lesson title, approval badge, and navigation action to `/parent/lessons`.

2. **Track 2 — School-Year Archival, Transition & Multi-Term Comparison**:
   - Expose `schoolYears` on `ParentDashboardResponse` (`GET /api/parent/dashboard`) with longitudinal per-year summaries (`id`, `label`, `grade`, `startsOn`, `endsOn`, `isActive`, `sessionCount`, `completedSessionCount`, `attemptCount`, `independentAttemptCount`).
   - Add `POST /api/parent/school-years` (`transitionSchoolYear` in `src/worker/routes/parent.ts`, registered in `src/worker/index.ts` and `src/client/lib/endpoints.ts`) allowing the parent to create/transition a learner to a new school year (e.g., `2026-2027` → `2027-2028`, Grade 4 → Grade 5), updating `learners.grade`, inserting/updating `school_years`, and recording an append-only `school_year.transitioned` audit event while preserving all historical `learning_sessions`, `learning_attempts`, and `skill_evidence`.
   - Render the School-Year Continuity & Transition card (`data-testid="school-year-continuity-section"`) on `DashboardScreen.tsx` even when a learner is in `emptyState` or has active sessions, allowing parents to view multi-term history and transition to a new school year.

3. **Track 3 — Activated Science (`science` — `Khoa học`) & Reasoning (`debate` — `Tư duy phản biện`) Modules**:
   - Add `migrations/0010_phase3_science_debate_and_school_years.sql`:
     - Update `subjects` so `science` and `debate` have `active = 1`.
     - Insert 4 new skills (`sci-water-cycle`, `sci-plant-needs`, `deb-claim-reason`, `deb-fact-opinion`).
     - Insert prerequisite edges (`sci-plant-needs` requires `sci-water-cycle`; `deb-fact-opinion` requires `deb-claim-reason`).
     - Insert curriculum objectives (`obj-sci-water-cycle`, `obj-sci-plant-needs`, `obj-deb-claim-reason`, `obj-deb-fact-opinion`).
   - Wire `0010_phase3_science_debate_and_school_years.sql` into `test/integration/test-db.ts` and `scripts/run-e2e.mjs`.
   - Author 4 Grade 4 lessons in `src/shared/content/science/` (`water-cycle.ts`, `plant-needs.ts`) and `src/shared/content/debate/` (`claim-and-reason.ts`, `fact-vs-opinion.ts`) and register them in `src/shared/content/index.ts` (bringing the registry to 19 lessons: 16 core + 3 baseline across 5 active subjects).

## 2. Non-Negotiable Constraints

- Zero answer keys in learner payloads (`toLearnerExercise()` strips all answer fields; `leaksAnswer()` returns `false`).
- Explanations (`explanationVi`) withheld until `correct` outcome.
- Deterministic mastery engine; no generative AI/LLM calls.
- Owner-scoped SQL on every parent/learner route (`findLearnerForParent` / `resolveTargetLearner`).
- Preserve all security closures from Supreme Command #10 (SQLite execution-time `SQL_UTC_NOW_MS_EXPR` cutoff, atomic version snapshots, fail-closed import/migrations, isolated E2E runner on port `8792`).
- Release policy: `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`.

## 3. Acceptance Criteria & Verification Gates

- [x] `npm run validate:lessons` passes for all 19 lessons (0 schema, pedagogy, or answer-leak issues).
- [x] `npm run typecheck` (`typecheck:worker` + `typecheck:app`) passes with 0 errors.
- [x] `npm run lint` passes with 0 errors.
- [x] `npm run test` passes all unit tests (including new unit tests for `derivePrerequisiteRecommendations` and updated registry tests for 19 lessons across 5 subjects).
- [x] `npm run test:integration` passes all integration tests (including new `test/integration/m5-phase3-prerequisites-school-years-and-subjects.test.ts`).
- [x] `npm run build` succeeds cleanly.
- [x] `npm run test:e2e` passes all Playwright E2E browser tests on isolated port `8792` without touching `.wrangler/state`, `.dev.vars`, or port `8791`.
