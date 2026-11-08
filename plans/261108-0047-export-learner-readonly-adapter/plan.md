---
title: "Read-Only Hardening for Learner Backup Export CLI (scripts/export-learner.mjs)"
description: "Extract pure read-only buildLearnerExportEnvelope in src/worker/routes/data.ts and switch scripts/export-learner.mjs from Wrangler getPlatformProxy() to node:sqlite DatabaseSync(..., { readOnly: true }) + createReadOnlyD1Adapter so CLI backups never mutate SQLite WAL/_cf_METADATA or append audit_events rows."
status: completed
priority: P1
effort: 30m
branch: fix/export-learner-readonly
tags: [security, sqlite, d1, backup, export, readonly]
created: 2026-11-08
updated: 2026-11-08
---

# Plan — Read-Only Hardening for Learner Backup Export CLI

## 1. Objective & Scope

`scripts/export-learner.mjs` (`npm run export:learner`) previously opened the local D1 SQLite database via Wrangler's `getPlatformProxy()` and called the HTTP handler `exportRecord` (`src/worker/routes/data.ts`). That caused two write side-effects during what should be a purely read-only CLI backup operation:
1. `getPlatformProxy()` opened Miniflare's `D1DatabaseObject` in read-write WAL mode, mutating `_cf_METADATA`, creating `-wal`/`-shm` sidecars, and altering the `.sqlite` file's `SHA-256` and `mtimeMs`.
2. `exportRecord` executed `repo.recordAudit(db, { action: "data.exported", ... })`, inserting a new row into the append-only `audit_events` ledger on every CLI export.

Concretely:

1. **Extract pure read-only `buildLearnerExportEnvelope` in `src/worker/routes/data.ts`**:
   - Move the 19-table read-only query and version-scoped filtering logic into `export async function buildLearnerExportEnvelope(db: Db, parentId: string, requestedLearnerId = "")`.
   - Keep `exportRecord` (`POST /api/data/export`) calling `buildLearnerExportEnvelope` followed by `repo.recordAudit(db, { action: "data.exported", ... })` so the HTTP endpoint contract and audit trail remain 100% unchanged.
2. **Switch `scripts/export-learner.mjs` to `DatabaseSync(..., { readOnly: true })` + `createReadOnlyD1Adapter`**:
   - Remove `getPlatformProxy()` from `scripts/export-learner.mjs`.
   - Open the local SQLite file in `.wrangler/state/v3/d1/miniflare-D1DatabaseObject` with `new DatabaseSync(sqlitePath, { readOnly: true })`, wrap it in `createReadOnlyD1Adapter(rawDb)` from `./household-preflight.mjs`, and invoke `buildLearnerExportEnvelope`.
   - Support `--target-root <dir>` and guard top-level CLI execution with `isMainModule` for isolated fixture testing.
3. **Add adversarial read-only unit tests in `test/unit/export-learner-readonly.test.ts`**:
   - Verify plain JSON export to `stdout` and file, AES-256-GCM encrypted export (`--passphrase`) and `decryptBackupEnvelope` round-trip, empty-database refusal (`exitCode === 1`), and byte-identical `.sqlite` `SHA-256`, `size`, `mtimeMs`, and directory entries (zero `-wal`/`-shm`/`-journal` files).
4. **Sync unit test count in `README.md` and `CLAUDE.md`**:
   - Update unit test file and test counts to match `npm test` (`15 files, 228 tests`).

### Non-goals

- Do not alter `TRANSFER_FORMAT_VERSION` (`tai-learning-os-export@v1`) or `tai-encrypted-backup-v1` cipher parameters.
- Do not alter HTTP `POST /api/data/export` behavior or its `data.exported` audit event recording.
- Do not touch `CLAUDE.md` child-safety boundary wording (`Blocked` / `Permitted`).

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `scripts/export-learner.mjs` has zero `getPlatformProxy` calls and leaves `.sqlite` `SHA-256`, `size`, `mtimeMs`, and `audit_events` 100% unchanged | P1 |
| 2 | `POST /api/data/export` and `scripts/export-learner.mjs` share `buildLearnerExportEnvelope` with zero schema or filtering drift | P1 |
| 3 | All verification gates (`verify`, `test:integration`, `test:e2e`, `backup:drill`) pass with 0 errors and 0 warnings | P1 |

## 3. Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Read-Only Export Envelope Helper, CLI Refactor & Adversarial Tests](./phase-01-readonly-export-learner.md) | Completed |

## 4. Success Criteria

- [x] `grep -n "getPlatformProxy" scripts/export-learner.mjs` returns 0 matches.
- [x] Running `scripts/export-learner.mjs` (stdout JSON, file JSON, `--passphrase` AES-256-GCM, and empty-DB error path) leaves the `.sqlite` `SHA-256`, `size`, `mtimeMs`, and `audit_events` row count 100% unchanged. Verified empirically against the real household database (`a77732b6…`, `954368` bytes, `mtime 1794036628`, `audit_events = 2`) and in `test/unit/export-learner-readonly.test.ts` against a WAL-mode fixture.
- [x] Not claimed: opening a WAL-mode database read-only refreshes the `-shm` sidecar's `mtime` (measured, `fd4c9fda` unchanged in content) without altering database bytes, so sidecar *absence* is not an achievable or asserted property.
- [x] `npm run verify` (15 files, 230 tests), `npm run test:integration` (15 files, 148 tests), `npm run test:e2e` (54 tests), and `npm run backup:drill` all pass.

## 5. Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|-----------|------|--------------------|-------------|
| 1 | High | Audit Write in `exportRecord` | Calling `exportRecord` directly against a read-only D1 adapter throws at `repo.recordAudit(db, { action: "data.exported" })` because `.run()` is forbidden. | Mitigated — extracted pure read-only `buildLearnerExportEnvelope(db, parentId, requestedLearnerId)` in `src/worker/routes/data.ts`; `exportRecord` still records `data.exported` for HTTP calls while `scripts/export-learner.mjs` calls `buildLearnerExportEnvelope` directly. |
| 2 | Medium | Schema Drift Between HTTP and CLI Export | Duplicating export queries in `scripts/export-learner.mjs` would risk drift from `/api/data/export`. | Mitigated — both `exportRecord` and `scripts/export-learner.mjs` call the single `buildLearnerExportEnvelope` implementation in `src/worker/routes/data.ts`. |

## 6. Validation Log

### Verification Results
- Claims checked: 4
- Verified: 4 | Failed: 0 | Unverified: 0
- Tier: Focused (1 phase)
- Failures: None

<!-- slug: 261108-0047-export-learner-readonly-adapter -->
