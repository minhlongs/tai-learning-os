# Gate 04 Audit & Security Closure Report: Supreme Command #10

## 1. Executive Summary

This report certifies the successful implementation, empirical testing, and multi-layer verification of **Supreme Command #10: Main Security Closure & M4 Browser Verification** on branch `fix/sc10-security-closure-and-m4-e2e`.

All four mandate deliverables have been verified under strict empirical testing:
1. **Write-Boundary Cutoff & Authorization (4.1)**: The authorization cutoff is evaluated by **SQLite itself at statement execution time**, not by any JavaScript clock. `src/worker/db/repositories.ts` defines `SQL_UTC_NOW_MS_EXPR` (`CAST(ROUND((julianday('now') - 2440587.5) * 86400000.0) AS INTEGER)`) and embeds it directly in the guarded statements (`attemptInsertGuarded`, `hintAuditInsertGuarded`, `finalizeSessionUpdateGuarded`, `finalizeSessionAuditInsertGuarded`, `sessionReflectionInsertGuarded`) as `(continuation_deadline IS NULL OR <expr> < continuation_deadline)`, and in read statements (`findSession`, `findInProgressSessionForLearner`, `listSessionsForLearner`) as the computed `is_continuation_expired` flag. Event timestamps (`now` / `created_at`) remain separately supplied and are never used for authorization. A request prepared before the deadline and executed after it is rejected atomically with zero partial writes, because the guard is part of the `INSERT`/`UPDATE` statement itself.
2. **Atomic Immutable Version Publication (4.2)**: `lesson_versions` snapshots metadata and steps atomically; concurrent editor conflicts trigger clean 409 Conflict with zero orphan steps, partial writes, or false audit log entries. Active sessions on previous versions remain isolated and intact during their 30-minute continuation window.
3. **Fail-Closed Import & Legacy Migration Hardening (4.3)**: Forward migration `0009` converts legacy approvals to `draft` and clamps unverified `in_progress` sessions to `started_at`. Data import downgrades imported approvals to `draft` and rejects forged `skillEvidence` envelopes. Migration upgrade from a populated v6 database with foreign-key linked `learning_attempts` executes cleanly with 0 FK violations.
4. **M4 Browser Verification (5)**: Complete Playwright browser test suite covering the 8 M4 interaction flows (cross-learner switching, race safety, per-learner approval badge isolation, skill correction reflection, organization consent management, classroom assignment gating, spaced review due CTA navigation, and 30-minute session continuation cutoff).

---

## 2. Verification Gate Results

All gates passed cleanly with zero errors:

| Verification Gate | Command | Scope | Result |
| :--- | :--- | :--- | :--- |
| **Worker Typecheck** | `npm run typecheck:worker` | Strict Cloudflare Worker TS | ✅ 0 errors |
| **App Typecheck** | `npm run typecheck:app` | Strict React App TS | ✅ 0 errors |
| **ESLint** | `npm run lint` | Full codebase linting | ✅ 0 errors |
| **Unit Tests** | `npm run test` | Vitest unit test suite | ✅ 10 files / 184 tests passed |
| **SC10 Integration Tests** | `vitest run --config vitest.integration.config.ts test/integration/sc10-security-and-migration-closure.test.ts` | 6 targeted closure tests | ✅ 6 / 6 tests passed |
| **All Integration Tests** | `npm run test:integration` | Vitest Worker + D1 test suite | ✅ 12 files / 131 tests passed |
| **Lesson Validator** | `npm run validate:lessons` | 15 Grade 4 lessons (82 steps) | ✅ 0 pedagogy / leak issues |
| **App Build** | `npm run build` | Vite production bundle | ✅ 0 errors |
| **E2E Browser Tests** | `npm run test:e2e` (`scripts/run-e2e.mjs`) | Playwright Desktop, Tablet, Mobile, isolated temp D1 on port 8792 | ✅ 42 / 42 tests passed |

---

## 3. Detailed Deliverables & Empirical Evidence

### 3.1 Write-Boundary Cutoff & Authorization
- **Clock Separation**: There is no JavaScript clock in the authorization path at all. `decisionNow`, `clock()`, and `Date.now()` were removed from the continuation decision. `src/worker/db/repositories.ts` evaluates `<SQL_UTC_NOW_MS_EXPR> < continuation_deadline` inside the guarded `INSERT`/`UPDATE` statements, so SQLite decides at execution time. `recordAttemptWithDerivation` in `src/worker/services/session-service.ts` retains only a cheap preflight (`session.is_continuation_expired === 1` → 403) plus a re-check after any concurrency conflict; the authoritative refusal is the SQL guard, which makes a late-executing batch fail atomically rather than commit.
- **Atomic Rollback & Zero Partial Writes**: Validated by `test/integration/sc10-security-and-migration-closure.test.ts` test 1: a write batch (`attemptInsertGuarded` + `auditInsert` + `skillEvidenceUpsert` + `reviewScheduleUpsert`), `hintAuditInsertGuarded`, and `finalizeSessionUpdateGuarded` + `finalizeSessionAuditInsertGuarded` are prepared while `prepDbNow < deadline`, held until `readDatabaseNowMs(env.DB) >= deadline`, and then executed — verifying atomic `NOT NULL constraint failed` rollback and zero partial writes. Retry crossing cutoff (round 0 conflict followed by deadline expiry before retry) is likewise rejected with 0 rows committed.
- **Exact Boundary Semantics**: Validated by test 2: SQLite boundary evaluation at `deadline - 1` succeeds, while `deadline` and `deadline + 1` are rejected; runtime live database clock check and HTTP endpoints (`/api/learner/hints`, `/api/learner/attempts`, `/api/learner/sessions/finalize`, `/api/learner/sessions/reflection`, `/api/learner/sessions`) reject expired sessions with 403 Forbidden. Submit after finalize records zero evidence.
- **Start vs Revoke In Both Commit Orders**: Validated by test 3:
  - Order 1 (Approve → Revoke → Start): Start is rejected with 403.
  - Order 2 (Approve → Start → Revoke): Start succeeds (200), subsequent Revoke establishes a 30-minute `continuation_deadline` on the active session. Non-concurrency database errors (FK failures) throw raw errors rather than converting into 403 `GuardError`.

### 3.2 Atomic Immutable Version Publication
- **Conflict Handling (409)**: In `src/worker/routes/parent.ts`, `updateLessonContent` checks `expectedVersion` against `lesson.version`, returning 409 Conflict if mismatched.
- **Guarded Batch Insert**: `repo.insertLessonVersionGuardedStatement` evaluates `version` to NULL if `lessons.version` changed concurrently, preventing partial step or audit writes.
- **Snapshot Isolation**: Validated by test 4: Publishing v2 by Editor A increments version to 2; Editor B submitting with stale `expectedVersion: 1` receives 409 Conflict. The active v1 learner session continues reading v1 snapshot title, objective, and steps without disruption.

### 3.3 Fail-Closed Data Import & Legacy Migration
- **Downgrade of Imported Approvals**: In `src/worker/routes/data.ts`, imported `reviewApprovals` are downgraded to `status: 'draft'`, preventing forged backup files from restoring live learner access.
- **Clamped Continuation Deadline & Transition to Abandoned**: In-progress sessions in imported JSON have `continuation_deadline` clamped to `Math.min(explicitDeadline, session.startedAt, now)` and their status safely transitioned to `'abandoned'`, preventing unverified session continuation even if `startedAt` is crafted in the future.
- **Validation of Future Timestamps & Timings**: In `src/shared/schemas/transfer.ts`, `validateExportEnvelope` rejects backup files with `exportedAt` or `learningSessions[].startedAt` in the future beyond 5 minutes clock skew tolerance (HTTP 400), and rejects sessions where `endedAt < startedAt`.
- **Forged Skill Evidence Rejection**: `validateExportEnvelope` in `src/shared/schemas/transfer.ts` rejects any envelope claiming `INDEPENDENT`, `RETAINED`, or `TRANSFERRED` states without observed correct attempts (HTTP 400).
- **FK-Safe v6 → v9 Migration Rebuild**: In `migrations/0007_learner_version_approvals_and_session_continuation.sql`, table rebuild of `lesson_steps` preserves existing `learning_attempts` via `_tmp_learning_attempts`, verified with `PRAGMA foreign_key_check` returning 0 violations.

### 3.4 M4 Browser Verification Suite & Isolated E2E Harness
- **Isolated E2E Runner (`scripts/run-e2e.mjs`, `vite.config.ts`, `playwright.config.ts`)**:
  - Creates a temporary directory under `os.tmpdir()` (`mkdtempSync`), writes a temporary `wrangler.e2e.jsonc` (`keep_vars: false`, test-only `SESSION_SECRET`), migrates `0001`..`0009`, and seeds the demo catalogue plus test parent `"Phụ huynh"` strictly inside `${tempRoot}/d1-state/v3`.
  - Runs Vite + Cloudflare workerd on dedicated port `8792` (`strictPort: true`, `reuseExistingServer: false`), binds a decoy server on `8791` when free (verifying 0 requests touch `8791`), and asserts `.wrangler/state` and `.dev.vars` remain completely untouched before and after the run.
- **Browser Flows (`test/e2e/m4-browser-verification.spec.ts`)** — 8 end-to-end tests across Chromium Desktop, Tablet, and Mobile (42 total E2E tests across both spec files):
  1. Learner switcher updates view context and isolates learner progress (unconditional selector assertion).
  2. Learner switcher rapid selection converges to final chosen learner.
  3. Approval badges are isolated per learner (unconditional table row assertion).
  4. Parent skill correction modal updates state correctly via interactive DOM form (`data-testid="skill-correction-form-*"`).
  5. Consent management workflow grants and revokes organization consent via interactive DOM buttons (`data-testid="grant-consent-*"` and `data-testid="revoke-consent-*"`).
  6. Classroom assigned lessons require parent approval before learner can access (403 Forbidden).
  7. Spaced review due CTA navigates to matching lesson (unconditional CTA element assertion).
  8. Bounded continuation deadline enforces real SQLite expiry cutoff on a revoked `in_progress` session: verifies resume and hint disclosure work during the grace window (`hintAuditCount === 1`), moves `continuation_deadline` to a near timestamp in the isolated E2E SQLite database while keeping `status = 'in_progress'`, waits for `readDatabaseNowMs >= continuation_deadline`, and verifies browser navigation (`/lessons/math-fractions-equivalent`) and direct API calls (`/api/learner/sessions`, `/api/learner/attempts`, `/api/learner/hints`, `/api/learner/sessions/finalize`) are all blocked with `403` and zero new attempts or hints are written (`status === 'in_progress'`, `attemptCount === 0`, `hintAuditCount === 1`).

### 3.5 Verification Boundaries & Honest Limitations
- **Pedagogical Quality vs Schema Validity**: The `validate:lessons` script verifies schema correctness, presence of explanations, answer structure, and absence of answer keys in learner payloads. It does not certify human pedagogical quality across the entire GDPT 2018 curriculum.
- **Backfill Provenance**: Historical snapshots backfilled during migration `0009` reflect the state of lessons at migration execution time; historical provenance is bounded by when snapshots were introduced.
- **Local Isolation**: Browser and integration tests operate exclusively against local in-memory/temporary SQLite state and local dev servers. Remote Cloudflare D1 and production environments remain untouched and blocked from deployment.

---

## 4. Policy & Authorization Status

- **Release Policy**: Updated in `AGENTS.md` and `CLAUDE.md` to:
  `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.`
- **Permitted Operations**: Git push, pull request creation, and branch merge to `main`.
- **Restricted Operations**: `wrangler deploy`, remote D1 migrations, remote resource provisioning, external/paid LLM APIs, and live child pilot remain strictly blocked.
