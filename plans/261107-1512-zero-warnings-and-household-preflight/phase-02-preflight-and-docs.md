---
title: "Phase 2 — Read-Only Household Preflight Check & Docs Sync"
status: completed
priority: P1
effort: 30m
---

# Phase 2 — Read-Only Household Preflight Check & Docs Sync

## Context Links
- [Plan Index](./plan.md)
- `src/worker/db/reprovision-household.ts`
- `scripts/reprovision-household-db.mjs`
- `CLAUDE.md`
- `README.md`

## Overview
Add `src/worker/db/household-preflight.ts` (`inspectHouseholdPreflight(db, options)`) and `scripts/household-preflight.mjs` (`npm run household:preflight`) to verify local household database integrity, clean-room invariants, parent/learner/school-year presence, `.dev.vars` key presence (boolean only, never printing secret values), and approved-lesson count for learner `"Tài"` without writing to D1.

## Requirements
- [x] Implement `src/worker/db/household-preflight.ts` exporting `HouseholdPreflightReport` and `inspectHouseholdPreflight(db, { devVarsPresent, hasSessionSecret })`.
- [x] Implement `scripts/household-preflight.mjs` and register `"household:preflight": "node scripts/household-preflight.mjs"` in `package.json`.
- [x] Verify in `test/unit/household-preflight.test.ts` that `inspectHouseholdPreflight` is strictly read-only (`audit_events` and `learning_attempts` row counts remain unchanged), accurately reports `approvedLessonsCount` and `readyForLearnerSession`, and never includes `password_hash` or `SESSION_SECRET` values in its report.
- [x] Update `CLAUDE.md` and `README.md` with `npm run household:preflight` and updated unit test counts (`14 files, 222 tests`), preserving the `Blocked` / `Permitted` child-safety policy block verbatim.

## Implementation Steps
1. Implement `src/worker/db/household-preflight.ts` and `scripts/household-preflight.mjs`.
2. Add unit tests in `test/unit/household-preflight.test.ts`.
3. Update `package.json`, `CLAUDE.md`, and `README.md`.
4. Run `npm run verify`, `npm run test:integration`, and `npm run test:e2e`.
