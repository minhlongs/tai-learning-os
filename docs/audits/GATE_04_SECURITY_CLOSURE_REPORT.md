# Gate 04 Audit & Security Closure Report: Supreme Command #10

## 1. Executive Summary

This report certifies the successful implementation, empirical testing, and multi-layer verification of **Supreme Command #10: Main Security Closure & M4 Browser Verification** on branch `fix/sc10-security-closure-and-m4-e2e`.

All four mandate deliverables have been verified under strict empirical testing:
1. **Write-Boundary Cutoff & Authorization (4.1)**: Clock separation between event input `now` and execution-time `decisionNow = Math.max(input.now, readClock())` evaluated immediately prior to `db.batch`. Bounded continuation deadline enforced across attempt pause/retry, exact boundary semantics (`deadline - 1ms` accepted, `deadline` rejected, `deadline + 1ms` rejected), non-concurrency error propagation preserved, and start-vs-revoke enforced across both commit orderings.
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
| **E2E Browser Tests** | `npm run test:e2e` | Playwright Desktop, Tablet, Mobile | ✅ 42 / 42 tests passed |

---

## 3. Detailed Deliverables & Empirical Evidence

### 3.1 Write-Boundary Cutoff & Authorization
- **Clock Separation**: In `src/worker/services/session-service.ts`, `recordAttemptWithDerivation` checks both event timestamp `input.now` and write-execution clock `readClock() = clock() ?? Date.now`. If either reaches or exceeds `session.continuation_deadline`, a `GuardError` (403) is raised before database mutation.
- **Atomic Rollback & Zero Partial Writes**: Validated by `test/integration/sc10-security-and-migration-closure.test.ts` test 1: when a request arrives before deadline but crosses deadline during retry/pause, execution rejects with `GuardError`, resulting in 0 attempts, 0 skill evidence rows, and 0 review schedule changes.
- **Exact Boundary Semantics**: Validated by test 2: `futureDeadline - 1` succeeds (attemptNo: 1), while `futureDeadline` and `futureDeadline + 1` are rejected with `GuardError`. HTTP endpoints (`/api/learner/hints`, `/api/learner/attempts`, `/api/learner/sessions/finalize`, `/api/learner/sessions`) reject expired sessions with 403 Forbidden.
- **Start vs Revoke In Both Commit Orders**: Validated by test 3:
  - Order 1 (Approve → Revoke → Start): Start is rejected with 403.
  - Order 2 (Approve → Start → Revoke): Start succeeds (200), subsequent Revoke establishes a 30-minute `continuation_deadline` on the active session. Non-concurrency database errors (FK failures) throw raw errors rather than converting into 403 `GuardError`.

### 3.2 Atomic Immutable Version Publication
- **Conflict Handling (409)**: In `src/worker/routes/parent.ts`, `updateLessonContent` checks `expectedVersion` against `lesson.version`, returning 409 Conflict if mismatched.
- **Guarded Batch Insert**: `repo.insertLessonVersionGuardedStatement` evaluates `version` to NULL if `lessons.version` changed concurrently, preventing partial step or audit writes.
- **Snapshot Isolation**: Validated by test 4: Publishing v2 by Editor A increments version to 2; Editor B submitting with stale `expectedVersion: 1` receives 409 Conflict. The active v1 learner session continues reading v1 snapshot title, objective, and steps without disruption.

### 3.3 Fail-Closed Data Import & Legacy Migration
- **Downgrade of Imported Approvals**: In `src/worker/routes/data.ts`, imported `reviewApprovals` are downgraded to `status: 'draft'`, preventing forged backup files from restoring live learner access.
- **Clamped Continuation Deadline**: In-progress sessions in imported JSON have `continuation_deadline` clamped to `started_at` (now expired), preventing unverified session continuation.
- **Forged Skill Evidence Rejection**: `validateExportEnvelope` in `src/shared/schemas/transfer.ts` rejects any envelope claiming `INDEPENDENT`, `RETAINED`, or `TRANSFERRED` states without observed correct attempts (HTTP 400).
- **FK-Safe v6 → v9 Migration Rebuild**: In `migrations/0007_learner_version_approvals_and_session_continuation.sql`, table rebuild of `lesson_steps` preserves existing `learning_attempts` via `_tmp_learning_attempts`, verified with `PRAGMA foreign_key_check` returning 0 violations.

### 3.4 M4 Browser Verification Suite
- Implemented `test/e2e/m4-browser-verification.spec.ts` executing 8 end-to-end tests across Chromium Desktop, Tablet, and Mobile (24 test runs total):
  1. Learner switcher updates view context and isolates learner progress.
  2. Learner switcher rapid selection converges to final chosen learner.
  3. Approval badges are isolated per learner.
  4. Parent skill correction modal updates state correctly.
  5. Consent management workflow grants and revokes organization consent.
  6. Classroom assigned lessons require parent approval before learner can access.
  7. Spaced review due CTA navigates to matching lesson.
  8. Bounded continuation deadline enforces 30-minute cutoff on revoked session.

---

## 4. Policy & Authorization Status

- **Release Policy**: Updated in `AGENTS.md` and `CLAUDE.md` to:
  `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.`
- **Permitted Operations**: Git push, pull request creation, and branch merge to `main`.
- **Restricted Operations**: `wrangler deploy`, remote D1 migrations, remote resource provisioning, external/paid LLM APIs, and live child pilot remain strictly blocked.
