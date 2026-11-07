---
title: "Zero ESLint Warnings, Node 26 Loader Migration & Household Preflight Check"
description: "Eliminate all 5 ESLint warnings in src/client, migrate the 8 operator scripts from the deprecated Node 26 module.register() hook to module.registerHooks(), delete two merged local branches, and add a read-only npm run household:preflight CLI with TDD coverage so parent readiness before a real Tài session is visible in one command."
status: completed
priority: P1
effort: 1h
branch: feat/zero-warnings-and-household-preflight
tags: [eslint, react-refresh, node26, household, preflight, hygiene]
created: 2026-11-07
updated: 2026-11-07
---

# Plan — Zero ESLint Warnings, Node 26 Loader Migration & Household Preflight Check

## 1. Objective & Scope

`npm run lint` reports 5 warnings today, and every operator script prints a Node 26 `DEP0205` deprecation warning on stderr. Neither blocks a build or a test, but a permanently noisy terminal hides future real warnings, and `react-refresh/only-export-components` marks a genuine file-layout problem. In the same worktree, add one read-only readiness command the parent can run before a real session.

Concretely:

1. **Fix every ESLint warning (0 errors, 0 warnings)**:
   - `src/client/App.tsx:60,91` — `matchRoute` and `navigate` are exported from a file that also exports the `App` and `Router` components. Move the pure routing helpers into a new `src/client/routing.ts`, and re-point `LoginScreen.tsx` and `ProtectedScreen.tsx` at it.
   - `src/client/lib/SessionProvider.tsx:19` — `useMemo(() => value, [value.loading, value.session, value.error])` declares a hand-picked dependency list that is not the real dependency. Replace the memo with the identity of the value the hook already returns, so the provider stops lying to `react-hooks/exhaustive-deps` while preserving the single-fetch behaviour.
   - `src/client/lib/SessionProvider.tsx:23,30` — `useSessionContext` and `useAuthenticatedSession` are non-component exports in a component file. Move `SessionContext`, `SessionContextValue`, `useSessionContext`, and `useAuthenticatedSession` into `src/client/lib/session-context.ts`, leave `SessionProvider.tsx` exporting only the provider component, and update the importing screens/components to import `useSessionContext` from `session-context`.
2. **Replace the deprecated Node loader hook** in `scripts/resolve-ts-specifiers.mjs` so all 8 operator scripts (`seed-lessons`, `run-e2e`, `backup-restore-drill`, `reprovision-household-db`, `seed-pilot`, `validate-lessons`, `unlock-parent`, `export-learner`) stop emitting `DEP0205`. Register with `module.registerHooks` (Node 22.15+/26) when it exists and fall back to `register` on Node 22.12–22.14, keeping the resolved `.ts` completion byte-for-byte identical.
3. **Add `npm run household:preflight`** (`scripts/household-preflight.mjs` + `src/worker/db/household-preflight.ts`), a strictly read-only command that opens the household D1 database through `getPlatformProxy`, runs `PRAGMA integrity_check` plus `verifyCleanHouseholdState(db)`, and reports how many lessons the parent has actually approved for the registered learner. It writes nothing, prints no secret, and never seeds a simulated row.
4. **Sync `CLAUDE.md`, `README.md`** with the new command and the corrected test counts, and **delete the two merged local branches** (`fix/group-a-security-remediation`, `fix/pilot-database-isolation`).

### Non-goals

- No new ESLint `eslint-disable` comments: the warnings are removed by fixing the code layout, not by silencing the rule.
- No change to `src/worker/routes/`, `src/worker/db/repositories.ts`, lesson content, migrations, grading, or pedagogy.
- No dev-server startup inside the preflight check: the parent still runs `npm run dev` themselves; the preflight command only reads the database.
- No refactor of `src/client/App.tsx` routing behaviour, no new route, no UI change visible to the learner.
- No deployment, remote migration, or external call.

## 2. Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | `npm run lint` exits 0 with zero warnings; `npm run test` passes with the same assertion coverage plus new preflight tests | P1 |
| 2 | `node scripts/validate-lessons.mjs` runs without a `DEP0205` deprecation warning on Node 26 | P1 |
| 3 | `npm run household:preflight` reports clean-household state and approved-lesson count without writing to D1 | P1 |

## 3. Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Zero Warnings & Node 26 Loader Migration](./phase-01-zero-warnings-and-loader.md) | Completed |
| 2 | [Phase 2: Household Preflight Check & Docs Sync](./phase-02-preflight-and-docs.md) | Completed |

## 4. Success Criteria

- [x] `npx eslint .` prints `0 problems` (no errors, no warnings).
- [x] `node scripts/validate-lessons.mjs` emits no `DeprecationWarning` line, and `npm run validate:lessons` still prints the same `50 lessons (257 steps)` line.
- [x] `scripts/household-preflight.mjs` prints the verification report (`schemaVersion 14`, `lessonsCount 50`, `integrity ok`) plus the learner's approved-lesson count without writing to D1 (verified by comparing an `audit_events` count before and after).
- [x] `npm run household:preflight` never prints `SESSION_SECRET`, `PARENT_PASSWORD_HASH`, or a `password_hash` value (verified by a unit test over captured output).
- [x] `npm run verify`, `npm run test:integration`, and `npm run test:e2e` all pass.
- [x] `CLAUDE.md` documents `npm run household:preflight` and `README.md` reports the new test counts.
- [x] Two merged local branches are deleted; `git branch --list` on `main` shows no stale merged branch.

## 5. Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|-----------|------|--------------------|-------------|
| 1 | High | Child Safety / Data Pollution | A preflight command that opens the household D1 database could write to it, and the audit ledger is append-only, so a single stray row is permanent. | Mitigate — the preflight opens the D1 proxy, runs only `SELECT` statements and `PRAGMA integrity_check`, never calls `db.prepare(...).run()`, and an integration test asserts `audit_events` and `learning_attempts` counts are byte-identical before and after. |
| 2 | Medium | Credential Exposure | Reporting the parent's account status could print a `password_hash` or `.dev.vars` secret into the terminal, which is then pasted into GitHub. | Mitigate — the report contains only counts, booleans, the learner nickname, and the parent display name; a unit test asserts no `password_hash`/`SESSION_SECRET` substring appears in the printed output. |
| 3 | Medium | React Behaviour Regression | Splitting `SessionProvider.tsx` into a context module and a provider component could change the memoized context value, and a new object per render would re-render every screen on every parent render. | Mitigate — keep the exact `useMemo` dependency set the module already has by moving it verbatim, and assert in a unit test that two renders of the provider return a context value with identical identity. |
| 4 | Low | Node Version Matrix | `module.registerHooks` does not exist on Node 22.12, which `package.json` still declares as the minimum engine. | Mitigate — register through `module.registerHooks` when it is a function and fall back to `module.register` otherwise; verify the fallback branch by unit test with the global stubbed. |
| 5 | Low | Route Purity | Moving `matchRoute`/`navigate` out of `App.tsx` changes module load order for `window.history` users. | Mitigate — the new module contains only pure functions plus `navigate`, which already touched `window`; no new `window` access is introduced, and the existing route tests are re-pointed rather than rewritten. |

## 6. Validation Log

### Verification Results
- Claims checked: 5
- Verified: 5 | Failed: 0 | Unverified: 0
- Tier: Focused (2 phases)
- Failures: None

<!-- slug: 261107-zero-warnings-and-household-preflight -->
