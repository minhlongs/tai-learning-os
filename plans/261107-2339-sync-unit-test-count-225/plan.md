---
title: "Sync Unit Test Count (225 Tests) & Prune Merged Remote Branches"
description: "Update README.md and CLAUDE.md unit test counts from 222 to 225 after the read-only D1 preflight adapter tests landed in PR #40, and delete the 4 already-merged remote feature/fix branches on origin."
status: completed
priority: P2
effort: 15m
branch: docs/sync-unit-test-count-225
tags: [docs, hygiene, tests, git]
created: 2026-11-07
updated: 2026-11-07
---

# Plan — Sync Unit Test Count (`225 tests`) & Prune Merged Remote Branches

## 1. Objective & Scope

Following PR `#40` (`d475a0fa762e90c71cd07922faf8e7dec01ad8a9`), `test/unit/household-preflight.test.ts` expanded from 8 to 11 unit tests, bringing the repository's unit test suite across all 14 unit test files from `222` to `225` tests. Two top-level documentation files (`README.md:75` and `CLAUDE.md:55`) still list `222 tests`. In addition, 4 remote branches on `origin` whose changes are already fully merged into `main` remain unpruned.

Concretely:

1. **Sync unit test count in `README.md` and `CLAUDE.md`**:
   - Update `README.md:75` from `222 tests across 14 files` to `225 tests across 14 files`.
   - Update `CLAUDE.md:55` from `14 files, 222 tests` to `14 files, 225 tests` while leaving the `Blocked` / `Permitted` child-safety policy block untouched.
2. **Prune 4 already-merged remote branches on `origin`**:
   - Confirm via `git merge-base --is-ancestor` / `git cherry -v main` that `origin/fix/group-a-security-remediation`, `origin/docs/m12-plan-completion-record` (PR `#33`), `origin/feat/m12-grade5-curriculum` (PR `#32`), and `origin/feat/zero-warnings-and-household-preflight` (PR `#38`) have zero unmerged commits relative to `main`, then delete them from `origin`.

### Non-goals

- Do not alter `CLAUDE.md`'s child-safety boundary wording (`Blocked` / `Permitted`).
- Do not modify any runtime code, tests, scripts, or SQL migrations.

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `README.md:75` and `CLAUDE.md:55` accurately state `225 tests` across `14 files`, matching `npm test` output | P2 |
| 2 | Only `origin/main` remains on `origin` after pruning merged feature/fix branches | P2 |
| 3 | All verification gates (`npm run verify`) pass with 0 errors and 0 warnings | P1 |

## 3. Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Documentation Count Sync & Remote Branch Hygiene](./phase-01-docs-and-remote-branch-hygiene.md) | Completed |

## 4. Success Criteria

- [x] `grep -n "225 tests" README.md CLAUDE.md` matches both `README.md:75` and `CLAUDE.md:55`, and `grep -n "222 tests" README.md CLAUDE.md` returns 0 matches.
- [x] `CLAUDE.md` lines 1–12 (`Release Policy`, `Blocked`, `Permitted`) have 0 diff lines.
- [x] `npm run verify` (`typecheck`, `lint`, `test` [14 files, 225 tests], `validate:lessons`, `build`) exits 0.
- [x] `git branch -r` lists only `origin/HEAD -> origin/main` and `origin/main` after PR merge and branch cleanup.

## 5. Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|-----------|------|--------------------|-------------|
| 1 | High | Child-Safety Boundary Preservation | Editing `CLAUDE.md` must never alter the `Blocked` / `Permitted` policy header. | Mitigated — edit is restricted strictly to line 55 (`npm run test               # Vitest unit tests (14 files, 225 tests)`), verified via `git diff CLAUDE.md`. |
| 2 | Medium | Unmerged Work Loss When Deleting Remote Branches | Deleting a remote branch that was not squash-merged or fast-forward merged into `main` could lose commits. | Mitigated — verified before deletion that `fix/group-a-security-remediation` is a direct ancestor of `main` (`04b2fdb`) and that `docs/m12-plan-completion-record` (PR `#33`), `feat/m12-grade5-curriculum` (PR `#32`), and `feat/zero-warnings-and-household-preflight` (PR `#38`) have `MERGED` PR state on GitHub and `-` in `git cherry -v main`. |

## 6. Validation Log

### Verification Results
- Claims checked: 4
- Verified: 4 | Failed: 0 | Unverified: 0
- Tier: Focused (1 phase)
- Failures: None

<!-- slug: 261107-2339-sync-unit-test-count-225 -->
