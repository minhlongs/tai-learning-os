---
title: "Phase 2: Documentation Sync, Local DB Reprovision & Plan Hygiene"
status: completed
---

# Phase 2: Documentation Sync, Local DB Reprovision & Plan Hygiene

## Overview

Synchronize `CLAUDE.md` and `README.md` test counts and commands, close the 5 historical completed plans in `ak plan`, execute `npm run db:reprovision-household` on the local `.wrangler/state` database, and run full verification gates.

## Requirements

- [x] Update `CLAUDE.md` Section 2 and `README.md` verification commands with accurate unit test counts and `npm run db:reprovision-household`.
- [x] Close the 5 stale completed plans in `ak plan` and mark their `plan.md` files `status: completed`.
- [x] Run `npm run db:reprovision-household` against the primary checkout's `.wrangler/state` to archive the polluted DB into `backups/` and reprovision a 100% clean DB for learner `"Tài"`.
- [x] Run `npm run verify`, `npm run test:integration`, and `npm run test:e2e`.

## Implementation Steps

1. Update `CLAUDE.md` and `README.md`.
2. Update `status: completed` on the 5 historical `plan.md` files and close them in `ak plan`.
3. Execute `npm run db:reprovision-household` against the primary checkout's `.wrangler/state` and verify `PRAGMA integrity_check = ok` and exact table row counts.
4. Run `npm run verify`, `npm run test:integration`, and `npm run test:e2e`.

## Todo

- [x] Update `CLAUDE.md` and `README.md`
- [x] Mark 5 historical plans completed and close in `ak plan`
- [x] Archive and reprovision the local `.wrangler/state` household database
- [x] Pass `npm run verify`, `npm run test:integration`, and `npm run test:e2e`

## Success Criteria

All verification suites (`verify`, `test:integration`, `test:e2e`) pass 100%, `ak plan list` has 0 stale active plans, and the household D1 database is 100% clean.
