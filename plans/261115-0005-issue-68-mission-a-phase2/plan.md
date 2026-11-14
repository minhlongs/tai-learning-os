# Plan: Mission A Phase 2 Technical Gates & 10-Year Open Portability (Issue #68)

- **Issue:** [#68](https://github.com/minhlongs/tai-learning-os/issues/68)
- **Branch:** `feat/issue-68-mission-a-phase2-gates`
- **Status:** In Progress
- **Baseline Household DB SHA-256:** `d8828c6a9f7417c49325dc240e59922083e56142be4e1b1432836ebf06c3b611` (must remain byte-identical)

## Phases & File Ownership

1. **Piece A — Engine, Cross-Session Mastery (G6) & 25-Minute Soft Stop Session Cap (G9)**
   - **Files:** `src/shared/engine/competency.ts`, `src/shared/engine/session-budget.ts`, `src/shared/engine/recompute-learner-state.ts`, `src/shared/api-contract.ts`, `src/worker/db/repositories.ts`, `src/worker/services/session-service.ts`, `src/worker/routes/learner.ts`, `src/worker/routes/parent.ts`, `src/client/lib/endpoints.ts`, `src/client/screens/learner/LessonScreen.tsx`, `src/client/screens/learner/SessionSummaryScreen.tsx`, `src/client/screens/learner/LearnerHomeScreen.tsx`, `src/client/styles/lesson.css`, `src/client/styles/session-summary.css`, plus unit/integration tests for G6 & G9.
   - **Dependencies:** None (Foundation).

2. **Piece B — 3,650-Day FSRS Simulation (G7), Offline Content QA Gate (G13) & TCO Model (G15)**
   - **Files:** `src/shared/engine/review-simulation.ts`, `src/shared/engine/tco-model.ts`, `src/shared/content/qa-gate.ts`, `promptfooconfig.yaml`, `scripts/review-simulate.mjs`, `scripts/qa-content.mjs`, `scripts/tco-verify.mjs`, `test/unit/review-simulation.test.ts`, `test/unit/qa-content.test.ts`, `test/unit/tco-model.test.ts`.
   - **Dependencies:** Runs in parallel in isolated worktree (disjoint files from Piece A & Piece C).

3. **Piece C — 10-Year Open Portability Bundle (`CLR 2.0 + CASE 1.1 + xAPI 2.0 + viewer.html`)**
   - **Files:** `src/shared/portability/open-portability.ts`, `src/shared/portability/static-viewer.ts`, `src/worker/routes/portability.ts`, `scripts/export-portability.mjs`, `test/unit/open-portability.test.ts`, `test/integration/open-portability.test.ts`, plus wiring into `src/worker/index.ts` and `src/client/screens/parent/DataControlScreen.tsx`.
   - **Dependencies:** Core generator + CLI + unit tests run in parallel worktree; route/UI integration wired cleanly on integration branch.

4. **Piece D — Playwright Zero-Outbound Network Guard (G2), WCAG 2.2 AA `axe` + Touch Targets (G10) & Offline Viewer E2E**
   - **Files:** `test/e2e/network-guard.ts`, `test/e2e/learner-journey.spec.ts`, `test/e2e/m4-browser-verification.spec.ts`, `test/e2e/g2-g10-and-portability.spec.ts`, UI accessibility CSS/markup refinements if surfaced by `axe`.
   - **Dependencies:** Runs after Pieces A, B, C merge into integration branch.

5. **Piece E — CI Wiring, ADR-006, Empirical `G0_G16_AUDIT_MATRIX.md` Re-measurement & Isolated Code Review**
   - **Files:** `package.json`, `.github/workflows/ci.yml`, `docs/adr/ADR-006-cross-session-mastery-session-cap-and-open-portability.md`, `docs/audits/G0_G16_AUDIT_MATRIX.md`, `README.md`, `CLAUDE.md`, `docs/PARENT_OPERATIONS.md`.
   - **Dependencies:** Final integration verification + isolated `code-reviewer` subagent before PR & merge.
