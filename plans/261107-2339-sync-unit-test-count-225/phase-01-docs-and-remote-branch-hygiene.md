---
title: "Phase 1: Documentation Count Sync & Remote Branch Hygiene"
status: completed
priority: P2
effort: 15m
---

# Phase 1 — Documentation Count Sync & Remote Branch Hygiene

## Context

- Parent plan: [`./plan.md`](./plan.md)
- Target files:
  - `README.md`
  - `CLAUDE.md`

## Requirements

1. Update `README.md:75` from `# Chạy toàn bộ Unit Tests (222 tests across 14 files)` to `# Chạy toàn bộ Unit Tests (225 tests across 14 files)`.
2. Update `CLAUDE.md:55` from `npm run test               # Vitest unit tests (14 files, 222 tests)` to `npm run test               # Vitest unit tests (14 files, 225 tests)` without touching lines 1–12 (`Blocked` / `Permitted`).
3. Verify via `npm run verify` that `typecheck`, `lint`, `test` (14 files, 225 tests), `validate:lessons`, and `build` all pass.
4. Delete the 4 already-merged remote branches (`fix/group-a-security-remediation`, `docs/m12-plan-completion-record`, `feat/m12-grade5-curriculum`, `feat/zero-warnings-and-household-preflight`) from `origin`.

## Verification

- `npm run verify` (typecheck, lint, 225 unit tests, validate:lessons, build — all passed)
- `git diff CLAUDE.md README.md` confirms only the single unit-test count line changed in each file
