---
title: "Phase 1: Household DB Reprovision Module & TDD Suite"
status: completed
---

# Phase 1: Household DB Reprovision Module & TDD Suite

## Overview

Implement `src/worker/db/reprovision-household.ts` and `scripts/reprovision-household-db.mjs` with TDD coverage in `test/unit/reprovision-household-db.test.ts`, and update `src/worker/db/reset-user-data.ts` error guidance.

## Requirements

- [x] Export `extractHouseholdIdentity(db)`, `restoreHouseholdIdentity(db, snapshot, now)`, and `verifyCleanHouseholdState(db)` from `src/worker/db/reprovision-household.ts`.
- [x] Update `src/worker/db/reset-user-data.ts` so its immutable `audit_events` refusal points operators to `npm run db:reprovision-household`.
- [x] Implement `scripts/reprovision-household-db.mjs` and register `"db:reprovision-household": "node scripts/reprovision-household-db.mjs"` in `package.json`.
- [x] Add `test/unit/reprovision-household-db.test.ts` testing snapshot extraction, clean-room D1 reprovisioning, baseline verification, and fail-closed checks.

## Implementation Steps

1. Write failing TDD unit tests in `test/unit/reprovision-household-db.test.ts`.
2. Implement `src/worker/db/reprovision-household.ts` and update `src/worker/db/reset-user-data.ts`.
3. Implement `scripts/reprovision-household-db.mjs` and wire `package.json`.
4. Run `npx vitest run test/unit/reprovision-household-db.test.ts` and verify all tests pass.

## Todo

- [x] Author `test/unit/reprovision-household-db.test.ts`
- [x] Implement `src/worker/db/reprovision-household.ts`
- [x] Update `src/worker/db/reset-user-data.ts`
- [x] Implement `scripts/reprovision-household-db.mjs` and `package.json` script

## Success Criteria

`npx vitest run test/unit/reprovision-household-db.test.ts` passes with 0 errors.
