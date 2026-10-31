# GROUP A REMEDIATION & LOCAL VERIFICATION REPORT (`F-01` – `F-05`)

> **Date:** 2026-10-30  
> **Repository:** `/Users/macbook/projects/tai-learning-os`  
> **Branch:** `fix/group-a-security-remediation`  
> **Baseline Commit:** `e38b975ee0ec44a35f4d71fadfd0a1054935d9c9`  
> **Reference Independent Audit:** `/Users/macbook/audit-reports/261029-commit-e38b975-independent-verification.md`  
> **Scope:** Group A (`A1`–`A4`, findings `F-01` through `F-05`) — Local corrective remediation, SQLite/D1 schema migration `0004`, and local verification only. No Group B or DeepTutor integration.  
> **Release Posture:** **LOCAL ONLY / PRODUCTION BLOCKED**

---

## 1. Baseline & Working Tree Status (Preflight & Post-Remediation)

1. **Git State:**
   - Branch: `fix/group-a-security-remediation`
   - `HEAD`: `e38b975ee0ec44a35f4d71fadfd0a1054935d9c9` (`fix(security): complete Group A security and pedagogical integrity remediation`)
   - Working tree: Local working diff containing corrective remediation for Command #07. No commit, push, PR, or deploy executed. Remote Cloudflare D1 and developer local dev DB (`.wrangler/state/`) untouched.
2. **Review Object Fingerprints & Clean Boundaries:**
   - Test files modified: `test/integration/evidence-and-ledger-integrity.test.ts`, `test/integration/data-round-trip.test.ts`, `test/integration/test-db.ts`.
   - Worker source modified: `src/worker/services/session-service.ts`, `src/worker/db/repositories.ts`, `src/worker/db/reset-user-data.ts`, `src/worker/routes/data.ts`.
   - Shared schemas modified: `src/shared/schemas/transfer.ts`.
   - Docs updated: `docs/audits/GROUP_A_REMEDIATION_VERIFICATION.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`.

---

## 2. Gate Definitions (`A1` – `A4`)

Per the project's verification gate framework:

1. **Gate A1 — Audit Logging + Atomicity (`F-01`):**
   - The write path for learner evidence must atomically commit the attempt row (`learning_attempts`), audit event (`audit_events`), re-derived competency state (`skill_evidence`), and review schedule (`review_schedule`) in one atomic boundary (`db.batch`).
   - If any statement in the batch fails (including constraint violations, foreign key errors, or trigger aborts), SQLite must roll back all statements so no partial attempt or orphan derived state survives.
2. **Gate A2 — Independent Mastery, Attempt & Hint Integrity (`F-02`, `F-03`):**
   - Attempt numbering must be gap-safe and monotonic per `(learner_id, step_id)`.
   - First-attempt uniqueness must be arbitrated by a database unique index (`idx_attempts_learner_step_attempt`).
   - Concurrent submissions across steps of the same skill or concurrent hint requests must not cause stale mastery derivation or bypass assistance flooring.
   - Hint disclosure must be session-validated, fail-closed before disclosure, and cross-session floored.
3. **Gate A3 — PBKDF2 Consistency & Documentation Truthfulness (`F-05`):**
   - Password hashing runtime constants (600,000 iterations, PBKDF2-SHA256, 16-byte random salt, transparent `needsRehash` upgrade) must strictly match documentation across `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_MODEL.md`.
4. **Gate A4 — Audit Protection, Isolation & Erasure Limits (`F-04`):**
   - The audit ledger (`audit_events`) must be protected by database-level append-only triggers (`audit_events_no_update`, `audit_events_no_delete`).
   - Test environments must be strictly isolated (dedicated `tmpdir()` runtime config and persistence, `WeakSet` branding on `D1Database` handles, schema recreation refused on unbranded handles).
   - User-data reset (`resetUserData`) must never drop triggers, delete ledger rows, or clear platform tables (`d1_migrations`, catalogue).
   - Erasure limits and retention conflicts must be stated honestly without certifying legal compliance.

---

## 3. Corrective Remediation Implemented (Command #07 Priorities)

### Priority 1: Strict Test-DB Isolation & Schema Recreation Separation
- **`test/integration/test-db.ts`**:
  - Runtime configuration and persistence are written strictly under `tmpdir()` via unique run IDs (`tai-learning-os-test-<runId>`). Both config path and persistence path are verified to live outside the repository root.
  - Branded database handles are tracked in an internal `WeakSet<D1Database>`.
  - `recreateSchema(db)` checks `isBrandedTestDatabase(db)` and throws explicitly before running any DDL if an unbranded database handle is provided.
  - Preserves `d1_migrations` table and reapplies all 4 shipped migrations in file order.
- **`src/worker/db/reset-user-data.ts`**:
  - Strictly separated from test schema recreation: `resetUserData` deletes only user-data tables in FK child-first order.
  - Never drops triggers, never alters schema, and preserves platform tables (`d1_migrations`, `schema_versions`, `subjects`, `skills`, `skill_prerequisites`, `lessons`, `lesson_steps`).
  - Fails closed if `audit_events` contains rows: throws `Cannot reset user data: audit_events contains N immutable row(s) protected by append-only triggers.` Refuses to drop triggers or perform partial deletions. Prohibits mutating SQL against `audit_events`.

### Priority 2: Learner-Scoped Export, Dynamic Schema Versions & Hint Floor Restore
- **`src/worker/routes/data.ts`**:
  - `exportCollections` scopes all exported entities strictly to the authenticated parent's requested learner:
    - `reviewApprovals`: filtered by `decided_by = context.parent.parentId`.
    - `auditEvents`: filtered via `filterExportedAuditEvents` by `learner:<learnerId>`, session IDs, goal IDs, plan item IDs, and baseline IDs. Explicitly excludes other learners, unlinked login failures, and deleted learner events.
    - `schemaVersions`: dynamically queries `SELECT version, description FROM schema_versions ORDER BY version ASC` from D1 instead of relying on a hard-coded application array.
  - `importCollections`:
    - Validates provenance cross-checks via `validateTransferEnvelope`: rejects tampered import payloads claiming `observed` attempts with `attemptNo > 1`, `helpLevel > 0`, or `hintFloor > 0`, and rejects `derived` `skillEvidence` claiming higher `independentCount` than observed correct attempts.
    - Restores the disclosed hint floor across export -> delete -> import: calculates monotonic max level per `(learner_id, step_id)` from valid imported `hint.requested` audit events and attempt `help_level`s, then records a server-minted `hint.requested` audit event mapped to the new restored learner ID so subsequent first attempts remain floored to `assisted`.

### Priority 3 & 4: Gap-Safe Numbering, Per-Skill Concurrency & Hint Linearization
- **`src/worker/db/repositories.ts`**:
  - `getStepAttemptSummaryForLearner`: computes `COALESCE(MAX(attempt_no), 0) + 1` and `COUNT(*)` of prior attempts on `(learner_id, step_id)` in a single query.
  - `getDisclosedHintState`: queries `COALESCE(MAX(json_extract(detail, '$.level')), 0)` and `COUNT(*)` of `hint.requested` audit events on `(learner_id, step_id)`.
  - `attemptInsertGuarded`: embeds SQL assertions inside `INSERT INTO learning_attempts`:
    - Asserts prior step attempt count equals snapshot.
    - Asserts hint audit count equals snapshot.
    - Asserts skill committed attempt count equals snapshot.
    - If any snapshot changed before commit, `attempt_no` evaluates to `NULL`, triggering `NOT NULL constraint failed: learning_attempts.attempt_no` and rolling back the entire batch atomically.
  - `findDuplicateStepAttemptNumbers`: preflight check querying `HAVING COUNT(*) > 1` on `(learner_id, step_id, attempt_no)`.
- **`src/worker/services/session-service.ts`**:
  - Bounded retry loop (`MAX_CONCURRENCY_RETRIES = 4`). Inside each round, snapshots step attempts, disclosed hint state, and skill attempts.
  - Derives competency and schedules review off committed evidence plus the in-flight attempt.
  - `isAttemptConcurrencyConflict`: catches `idx_attempts_learner_step_attempt`, `UNIQUE constraint failed`, or `NOT NULL constraint failed: learning_attempts.attempt_no`. Surfaces PK collisions, FK failures, and CHECK failures immediately without retrying.

### Section 6 Verification Fixes:
- **`findMaxDisclosedHintLevel`**: clamps candidate levels via `clampHelp(level)` to guard against malformed or out-of-range audit detail numbers (e.g. `{level: 999}` is clamped to 4).
- **Migration `0004` Preflight**: `findDuplicateStepAttemptNumbers` validates absence of duplicates before creating `idx_attempts_learner_step_attempt`. Fails cleanly without corrupting or deleting historical evidence.

---

## 4. Verification Evidence & Exact Test Results

All tests run locally in an isolated environment without network access, paid APIs, or local dev DB modification (`.wrangler/state` timestamp unchanged).

| Suite | Command | File Count | Tests Passed | Tests Failed | Verdict |
|---|---|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` | Worker + App configs | All clean | 0 | **PASS** |
| **ESLint** | `npm run lint` | Repo root | 0 errors (5 React refresh warnings) | 0 | **PASS** |
| **Unit Test Suite** | `npm run test` | 9 files | 178 tests | 0 | **PASS** (178/178) |
| **Integration Test Suite** | `npm run test:integration` | 5 files | 102 tests | 0 | **PASS** (102/102) |
| **Full Verify Pipeline** | `npm run verify` | Typecheck + Lint + Test + Build | Full pipeline | 0 | **PASS** |
| **Browser E2E Tests** | `npm run test:e2e` | N/A | 0 | 0 | **NOT VERIFIED** (see Section 5) |

### Integration Test Breakdown (102 Tests across 5 Files):
1. `test/integration/evidence-and-ledger-integrity.test.ts` (21 tests):
   - Atomicity rollback on audit insert failure and skill evidence failure.
   - Gap-safe attempt numbering and legacy gap handling.
   - Bounded concurrency retry loop with 3 snapshot assertions (`attemptInsertGuarded`).
   - Cross-step same-skill concurrency serialization.
   - Hint floor linearization and fail-closed audit logging before disclosure.
   - `findMaxDisclosedHintLevel` clamp protection (`{level: 999}` -> 4).
   - Schema v3 to v4 migration upgrade and duplicate attempt preflight failure.
   - Database branding isolation and `resetUserData` fail-closed immutability guard.
2. `test/integration/data-round-trip.test.ts` (6 tests):
   - Full export/delete/import round trip.
   - Learner-scoped audit export and foreign-event rejection.
   - Dynamic `schemaVersions` validation from D1.
   - Hint floor preservation across export -> delete -> import.
   - Tamper rejection (retry claimed as observed, inflated independentCount, forged hint audit).
3. `test/integration/learner-journey.test.ts` (21 tests):
   - Multi-step lesson progression, review ladder scheduling, parent corrections, and session reflections.
4. `test/integration/api.test.ts` (18 tests):
   - Route authorization, CSRF protection, and error envelopes.
5. `test/integration/crypto.test.ts` (36 tests):
   - PBKDF2 600,000 iterations, legacy 100,000 auto-rehash, session token signing, and CSRF token HMAC verification.

---

## 5. Retention vs. Erasure Analysis (`F-04` Status)

### Technical Reality:
- **Append-Only Ledger**: `audit_events` rows are protected by SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers (`RAISE(ABORT, ...)`). No application bypass exists.
- **Learner Deletion (`DELETE /api/data/learner`)**:
  - Hard-deletes operational records across 11 tables (`session_reflections`, `learning_plan_items`, `baseline_assessments`, `curriculum_intake`, `learning_attempts`, `skill_evidence`, `review_schedule`, `review_approvals`, `learning_sessions`, `goals`, `learners`).
  - Appends an audit event `action = 'learner.deleted'`, `actor = 'parent:<parentId>'`, `subject = '<learnerId>'`.
  - Historical audit events (`learner.enrolled`, `learner.updated`, `hint.requested`, `attempt.submitted`) remain in `audit_events` to preserve auditability and prevent ledger tampering.
  - Some historical rows contain `learner.id` (UUID) or `nickname` in their JSON detail.

### Product & Design Conflict (Not Certified as Legal Compliance):
- There is an inherent conflict between an append-only, tamper-evident audit ledger and complete erasure of personal identifiers.
- This report does **NOT** certify legal compliance with Vietnamese Law 91/2025/QH15 or GDPR. Whether audit logs must be anonymized, pseudonymized via a separate erasable mapping table, or retained as an immutable compliance record is an explicit product design decision requiring legal counsel.
- Consequently, **F-04 is marked CONDITIONAL** and **Retention/Erasure Policy Reconciliation is marked BLOCKED**.

---

## 6. Gate Status Matrix & Production Posture

| Gate | Scope | Technical Status | Production Posture |
|---|---|---|---|
| **A1 — Atomic Evidence & Audit Persistence** | `F-01` | Single `db.batch` covering attempt, audit, skill evidence, and review schedule. Rollback proven via fault injection. | **READY FOR INDEPENDENT RE-REVIEW** |
| **A2 — First-Attempt Concurrency & Hint Provenance** | `F-02`, `F-03` | `UNIQUE` index + gap-safe `COALESCE(MAX, COUNT) + 1` + snapshot-guarded bounded retry (`MAX_CONCURRENCY_RETRIES = 4`) + session-validated fail-closed hint disclosure. | **READY FOR INDEPENDENT RE-REVIEW** |
| **A3 — PBKDF2 Consistency & Documentation** | `F-05` | 600,000 iterations runtime aligned across code, tests, and documentation (`SECURITY.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`). | **READY FOR INDEPENDENT RE-REVIEW** |
| **A4 — Audit Protection, Isolation & Erasure Limits** | `F-04` | Append-only triggers verified, test isolation verified in `tmpdir()`, `resetUserData` fails closed. Retention vs. erasure conflict documented. | **CONDITIONAL (Retention/Erasure BLOCKED)** |

### Overall Release Posture:
- **PRODUCTION RELEASE: BLOCKED**
- Remote deployment, PR creation, and release tagging remain strictly blocked pending independent verification of the working tree diff and product/legal decision on retention/erasure.
