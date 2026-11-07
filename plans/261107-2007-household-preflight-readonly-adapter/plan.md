---
title: "Household Preflight Read-Only Hardening (Node SQLite D1 Adapter)"
description: "Replace Wrangler getPlatformProxy() in scripts/household-preflight.mjs with a minimal read-only D1 adapter over node:sqlite DatabaseSync(..., { readOnly: true }) so npm run household:preflight never mutates SQLite WAL/_cf_METADATA state, never creates -wal/-shm sidecars, emits pure JSON on stdout, and runs ~10.8x faster."
status: completed
priority: P1
effort: 30m
branch: fix/household-preflight-readonly-adapter
tags: [security, sqlite, d1, preflight, household, readonly]
created: 2026-11-07
updated: 2026-11-07
---

# Plan — Household Preflight Read-Only Hardening (`F-01`)

## 1. Objective & Scope

`scripts/household-preflight.mjs` previously opened the local household SQLite file twice: first via `new DatabaseSync(..., { readOnly: true })` to run `PRAGMA integrity_check`, and second via Wrangler's `getPlatformProxy()` to pass `proxy.env.DB` into `inspectHouseholdPreflight()`.

Empirical sandbox testing proved that opening `getPlatformProxy()` and executing even a single `SELECT 1` causes Miniflare's `D1DatabaseObject` Durable Object wrapper to open the SQLite file in read-write WAL mode, increment `_cf_METADATA` (`key = 2`), create/update `.sqlite-wal` and `.sqlite-shm` sidecar files on disk, alter the `.sqlite` file's `SHA-256` and `mtimeMs` across checkpoints, and print a `Using secrets defined in .dev.vars` banner to `stdout` ahead of the JSON output.

Concretely:

1. **Remove `getPlatformProxy()` from `scripts/household-preflight.mjs`**:
   - Replace `getPlatformProxy()` with `createReadOnlyD1Adapter(rawDb)` wrapping a single `new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true })` connection closed in `finally`.
   - Implement the exact read-only D1 surface used by `inspectHouseholdPreflight`: `.prepare(sql)`, `.bind(...values)`, `.first(colName?)`, and `.all()`.
   - Explicitly forbid `.run()`, `.raw()`, `.batch()`, `.exec()`, `.dump()`, and `.withSession()`.
2. **Add adversarial acceptance tests (Gates A–D) in `test/unit/household-preflight.test.ts`**:
   - Gate A (Correctness): fresh household, provisioned household, parent-approved active lesson counting (excluding stale version approvals), foreign audit actor rejection, and missing `.dev.vars` handling.
   - Gate B (Strict Read-only): byte-identical `SHA-256`, `size`, and `mtimeMs` before and after CLI execution across both success and error paths; zero `-wal`, `-shm`, or `-journal` sidecars created; all write/session adapter methods and write SQL/PRAGMAs blocked.
   - Gate C (Output & Secrets): pure single-document JSON on `stdout` (`JSON.parse(stdout)` succeeds directly without Wrangler banners) and zero leakage of `.dev.vars` secrets or `parents.password_hash`.
   - Gate D (SQLite Compatibility): positional parameters `?1`/`?2`, empty result sets, `NULL` column extraction, and read-only `PRAGMA integrity_check`.

### Non-goals

- Do not expand `createReadOnlyD1Adapter` into a general-purpose D1 implementation.
- Do not modify business SQL or household isolation logic in `src/worker/db/household-preflight.ts` or `src/worker/db/reprovision-household.ts`.
- Do not modify authentication, CSRF, approval workflows, or SQL migrations (`0001`–`0014`).
- Do not modify `CLAUDE.md` child-safety boundary wording (`Blocked` / `Permitted`).

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `npm run household:preflight` preserves byte-for-byte SQLite file `SHA-256`, `size`, and `mtimeMs` and creates zero `-wal`/`-shm`/`-journal` files | P1 |
| 2 | `scripts/household-preflight.mjs` outputs pure valid JSON on `stdout` with zero Wrangler banners and zero secret values | P1 |
| 3 | All 6 verification gates (`typecheck`, `lint`, `validate:lessons`, `test`, `test:integration`, `test:e2e`) pass with 0 errors and 0 warnings | P1 |

## 3. Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Read-Only SQLite D1 Adapter & Adversarial Acceptance Tests](./phase-01-readonly-sqlite-d1-adapter.md) | Completed |

## 4. Success Criteria

- [x] `scripts/household-preflight.mjs` no longer imports or invokes `getPlatformProxy` from `wrangler`.
- [x] Running `scripts/household-preflight.mjs` against an isolated disk SQLite fixture leaves `SHA-256`, `size`, and `mtimeMs` 100% unchanged and creates zero `-wal`, `-shm`, or `-journal` files across both success and error paths.
- [x] `createReadOnlyD1Adapter` blocks `.run()`, `.raw()`, `.batch()`, `.exec()`, `.dump()`, and `.withSession()`, and `DatabaseSync(..., { readOnly: true })` rejects mutating SQL and write PRAGMAs with `SQLITE_READONLY`.
- [x] `stdout` from `scripts/household-preflight.mjs` parses directly via `JSON.parse(stdout)` and contains zero `.dev.vars` secrets or `password_hash` values.
- [x] Median preflight latency drops from `~876ms` to `~81ms` (~10.8x speedup).
- [x] `npm run typecheck`, `npm run lint`, `npm run validate:lessons`, `npm test` (225/225), `npm run test:integration` (148/148), and `npm run test:e2e` (54/54) all pass.

## 5. Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|-----------|------|--------------------|-------------|
| 1 | High | Byte-Level Disk Mutation | Opening `getPlatformProxy` mutates `_cf_METADATA` and creates `-wal`/`-shm` files even when only `SELECT` queries run. | Mitigated — `getPlatformProxy` removed from `scripts/household-preflight.mjs`; replaced with a single `DatabaseSync(..., { readOnly: true })` connection and verified by SHA-256/mtime/directory assertions in `test/unit/household-preflight.test.ts`. |
| 2 | Medium | Accidental Write via Read Method | A caller might pass `INSERT ... RETURNING` or `PRAGMA user_version = ...` to `.first()` or `.all()`. | Mitigated — `DatabaseSync` is opened with `{ readOnly: true }` (`SQLITE_OPEN_READONLY`), so SQLite's C engine rejects any write statement or write PRAGMA even if invoked through `.get()`/`.all()`. Verified by unit test. |
| 3 | Medium | Side Effect on Module Import | Importing `createReadOnlyD1Adapter` in unit tests could trigger the CLI top-level execution if not guarded. | Mitigated — `scripts/household-preflight.mjs` guards CLI execution behind `isMainModule` (`realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))`). |
| 4 | Low | Positional Parameter Binding (`?1`, `?2`) | D1 queries in `reprovision-household.ts` and `household-preflight.ts` use numbered positional parameters (`?1`, `?2`). | Mitigated — `node:sqlite` `StatementSync.prototype.get(...boundValues)` and `.all(...boundValues)` natively bind `?1`, `?2` in positional order; verified by unit and CLI fixture tests. |

## 6. Validation Log

### Verification Results
- Claims checked: 6
- Verified: 6 | Failed: 0 | Unverified: 0
- Tier: Focused (1 phase)
- Failures: None

<!-- slug: 261107-2007-household-preflight-readonly-adapter -->
