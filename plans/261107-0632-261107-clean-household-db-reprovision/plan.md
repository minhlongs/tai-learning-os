---
title: "Clean Household Database Reprovisioning & Plan Store Hygiene"
description: "Archive the polluted household D1 database, reprovision a 100% clean local D1 database for learner Tài without dropping append-only audit triggers, add TDD tests, and sync CLAUDE.md/README.md + plan store."
status: completed
priority: P1
effort: 2h
branch: feat/clean-household-db-reprovision
tags: [d1, database, household, audit-ledger, reprovision, hygiene]
created: 2026-11-07
updated: 2026-11-07
---

# Plan — Clean Household Database Reprovisioning & Plan Store Hygiene

## 1. Objective & Scope

Earlier E2E and pilot runs (prior to `scripts/run-e2e.mjs` and `scripts/seed-pilot.mjs` isolation into `os.tmpdir()`) wrote 2,488 simulated `audit_events`, 18 `organizations`, 18 `classrooms`, and 3 automated E2E `learning_sessions` directly into the household learner's local D1 database (`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`). Because `audit_events` is protected by schema-level `BEFORE DELETE` and `BEFORE UPDATE` immutability triggers (`0004_evidence_integrity.sql`), in-place DML reset (`npm run db:reset-data`) intentionally fails closed when `audit_events > 0`.

This plan delivers a deterministic, non-destructive **archive-and-reprovision** workflow (`src/worker/db/reprovision-household.ts` + `scripts/reprovision-household-db.mjs` + `npm run db:reprovision-household`) that:

1. **Archives before touching**: Moves all existing `.sqlite*` files from `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` and any leftover `.wrangler/probe-iso*` directories into a timestamped backup folder under `backups/household-db-archive-<timestamp>/` (which is gitignored).
2. **Extracts & preserves household identity**: Reads the existing `parents` row (`Phụ huynh` + PBKDF2-SHA256 `password_hash`), active household `learners` row (`Tài`, `birth_year: 2016`, `grade: 4`, `timezone: 'Asia/Ho_Chi_Minh'`), and `school_years` row (`2026-2027`, `grade: 4`) from the current database before rotation so the parent never loses their credentials or learner profile.
3. **Clean-room D1 provisioning without trigger tampering**: Opens a fresh D1 database via Wrangler (`getPlatformProxy`), applies all 14 shipped migrations (`0001`–`0014`), verifies `MAX(version) = 14`, both `audit_events` immutability triggers, and `idx_attempts_learner_step_attempt`, seeds all 50 shipped Grade 4–5 catalogue lessons (`seedLessons`), and restores the household `parents`, `learners`, and `school_years` rows alongside only their 2 legitimate provenance audit events (`parent.created` and `learner.enrolled`).
4. **Actionable error guidance in `resetUserData`**: Updates `src/worker/db/reset-user-data.ts` so when `db:reset-data` refuses due to immutable `audit_events` rows, the error message explicitly points the operator to `npm run db:reprovision-household`.
5. **Documentation & Plan Store Synchronization**: Updates `CLAUDE.md` and `README.md` with accurate unit test counts and the `npm run db:reprovision-household` command (preserving the child-safety `Blocked` / `Permitted` boundary verbatim), and closes the 5 historical completed plans (`m0`, `m1`, `m2-m3`, `m4`, `m9`) in the local `ak plan` store.

### Non-goals

- Never drop or disable `audit_events_no_delete` or `audit_events_no_update` triggers on an existing database.
- No remote Cloudflare deploy (`wrangler deploy`), remote D1 migrations, or external API calls.
- No modifications to learner pedagogy, grading rules, or lesson content.

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Implement `reprovisionHouseholdDatabase` helper and `npm run db:reprovision-household` CLI with full TDD unit/integration coverage | P1 |
| 2 | Archive polluted `.wrangler/state` SQLite files to `backups/`, reprovision clean household DB for learner `"Tài"`, sync `CLAUDE.md`/`README.md`, and close 5 stale plans in `ak plan` | P1 |

## 3. Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Household DB Reprovision Module & TDD Suite](./phase-01-start.md) | Completed |
| 2 | [Phase 2: Documentation Sync, Local DB Reprovision & Plan Hygiene](./phase-02-docs-and-reprovision.md) | Completed |

## 4. Success Criteria

- [x] `src/worker/db/reprovision-household.ts` exports `extractHouseholdIdentity(db)`, `restoreHouseholdIdentity(db, snapshot, now)`, and `verifyCleanHouseholdState(db)`.
- [x] `scripts/reprovision-household-db.mjs` archives `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite*` (and `.wrangler/probe-iso*`) into `backups/household-db-archive-<timestamp>/` before opening a fresh local D1 database and reprovisioning it.
- [x] `test/unit/reprovision-household-db.test.ts` verifies identity extraction from a polluted DB, clean reprovisioning into a fresh D1 database, baseline post-conditions (`lessons = 50`, `organizations = 0`, `classrooms = 0`, `learning_sessions = 0`, `audit_events = 2` with `parent.created` + `learner.enrolled`), and immutability trigger enforcement.
- [x] Live `.wrangler/state` household database is archived and reprovisioned cleanly: `PRAGMA integrity_check = ok`, `parents = 1` (`Phụ huynh`), `learners = 1` (`Tài`), `school_years = 1` (`2026-2027`), `lessons = 50`, `organizations = 0`, `classrooms = 0`, `learning_sessions = 0`, `audit_events = 2`.
- [x] `CLAUDE.md` and `README.md` reflect exact unit test counts (`13 files, 214 tests`) and document `npm run db:reprovision-household` without altering the `Blocked` / `Permitted` child-safety policy block.
- [x] `npm run verify`, `npm run test:integration`, and `npm run test:e2e` all pass 100%.

## 5. Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|----------|------|--------------------|-------------|
| 1 | High | Data Preservation & Auth | If `.wrangler/state` SQLite files were moved before reading `parents` and `learners`, the parent's PBKDF2-SHA256 `password_hash` and learner `"Tài"` UUID (`502e1440-ce2a-4f9e-8c21-7069970cc66a`) would be lost from the active DB (`src/worker/routes/session.ts:227`). | Accept — `scripts/reprovision-household-db.mjs` first opens the existing D1 proxy read-only via `extractHouseholdIdentity(db)`, disposes the proxy, archives the `.sqlite*` files to `backups/`, and then opens a fresh proxy to provision and restore the exact snapshot. |
| 2 | Medium | Workerd File Lock | Moving `.sqlite` files while `getPlatformProxy()` still holds an open Miniflare/workerd handle can leave WAL/SHM descriptors dangling or write into the moved inode. | Accept — strictly `await oldProxy.dispose()` before moving any `.sqlite`, `.sqlite-wal`, or `.sqlite-shm` files, then open a brand-new `getPlatformProxy()` instance afterwards. |
| 3 | Medium | Migration Split Consistency | Applying migrations via `wrangler d1 migrations apply` vs `unstable_splitSqlQuery` must also record or tolerate `schema_versions` and `d1_migrations`. | Accept — `reprovision-household-db.mjs` applies all 14 shipped migrations (`0001`–`0014`) using `unstable_splitSqlQuery` AND records the 14 migration entries in `d1_migrations` (matching `wrangler d1 migrations apply --local`) so subsequent `npm run db:migrate` calls see all 14 migrations as already applied. |
| 4 | Low | Child-Safety Boundary | Editing `CLAUDE.md` could inadvertently alter the top `Blocked` / `Permitted` policy header. | Accept — only lines in Section 2 (`## 2. Exact Commands`) of `CLAUDE.md` are edited; a unit assertion in `test/unit/reprovision-household-db.test.ts` verifies the policy block in `CLAUDE.md` remains intact. |

## 6. Validation Log

### Verification Results
- Claims checked: 14
- Verified: 14 | Failed: 0 | Unverified: 0
- Tier: Focused (2 phases)
- Failures: None

### Whole-Plan Consistency Sweep
- Verified all file paths (`src/worker/db/reprovision-household.ts`, `src/worker/db/reset-user-data.ts`, `scripts/reprovision-household-db.mjs`, `test/unit/reprovision-household-db.test.ts`, `package.json`, `CLAUDE.md`, `README.md`) and table/column names against `migrations/0001_initial_schema.sql` through `0014_grade5_curriculum_expansion.sql`.

<!-- slug: 261107-clean-household-db-reprovision -->
