---
title: "Phase 1: Read-Only Export Envelope Helper, CLI Refactor & Adversarial Tests"
status: completed
priority: P1
effort: 30m
---

# Phase 1 — Read-Only Export Envelope Helper, CLI Refactor & Adversarial Tests

## Context

- Parent plan: [`./plan.md`](./plan.md)
- Target files:
  - `src/worker/routes/data.ts`
  - `scripts/export-learner.mjs`
  - `test/unit/export-learner-readonly.test.ts`
  - `README.md`
  - `CLAUDE.md`

## Requirements

1. Extract pure read-only `buildLearnerExportEnvelope(db, parentId, requestedLearnerId)` in `src/worker/routes/data.ts` and keep `exportRecord` delegating to it before recording `data.exported` in `audit_events`.
2. Refactor `scripts/export-learner.mjs` to open `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` via `DatabaseSync(..., { readOnly: true })` and `createReadOnlyD1Adapter(rawDb)` from `./household-preflight.mjs`, supporting `--target-root <dir>` and guarding top-level CLI execution with `isMainModule`.
3. Add `test/unit/export-learner-readonly.test.ts` testing plain JSON stdout/file export, AES-256-GCM encrypted export/decrypt round-trip, empty-database refusal, and byte-level `.sqlite` `SHA-256`/`size`/`mtimeMs`/sidecar immutability.
4. Update unit test counts in `README.md` and `CLAUDE.md`.

## Verification

- `npx vitest run test/unit/export-learner-readonly.test.ts`
- `npm run verify`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run backup:drill`
