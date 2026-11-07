---
title: "Phase 1: Read-Only SQLite D1 Adapter & Adversarial Acceptance Tests"
status: completed
priority: P1
effort: 30m
---

# Phase 1 — Read-Only SQLite D1 Adapter & Adversarial Acceptance Tests

## Context

- Parent plan: [`./plan.md`](./plan.md)
- Target files:
  - `scripts/household-preflight.mjs`
  - `test/unit/household-preflight.test.ts`
- Unchanged reference files:
  - `src/worker/db/household-preflight.ts`
  - `src/worker/db/reprovision-household.ts`

## Requirements

1. Remove `getPlatformProxy` from `scripts/household-preflight.mjs`.
2. Export `createReadOnlyD1Adapter(rawDb)` backed by `DatabaseSync(..., { readOnly: true })` supporting `.prepare()`, `.bind()`, `.first()`, and `.all()`, while throwing on `.run()`, `.raw()`, `.batch()`, `.exec()`, `.dump()`, and `.withSession()`.
3. Guard top-level CLI execution in `scripts/household-preflight.mjs` with `isMainModule` so unit tests can import `createReadOnlyD1Adapter` directly without running the CLI.
4. Add Gates A, B, C, and D adversarial tests in `test/unit/household-preflight.test.ts`.

## Verification

- `npx vitest run test/unit/household-preflight.test.ts` (11/11 passed)
- `npm run verify` (typecheck, lint, unit tests, validate:lessons, build — all passed)
- `npm run test:integration` (15/15 files, 148/148 tests passed)
- `npm run test:e2e` (54/54 Playwright browser tests passed)
