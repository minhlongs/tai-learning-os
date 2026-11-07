---
title: "Phase 1 — Zero ESLint Warnings & Node 26 Loader Migration"
status: completed
priority: P1
effort: 30m
---

# Phase 1 — Zero ESLint Warnings & Node 26 Loader Migration

## Context Links
- [Plan Index](./plan.md)
- `src/client/App.tsx`
- `src/client/lib/SessionProvider.tsx`
- `src/client/lib/useSession.ts`
- `scripts/resolve-ts-specifiers.mjs`

## Overview
Eliminate all 5 ESLint warnings across `src/client/` by separating pure routing helpers (`src/client/routing.ts`) and session context hooks (`src/client/lib/session-context.ts`) from React component files, and migrate `scripts/resolve-ts-specifiers.mjs` + all 8 operator scripts to `module.registerHooks({ resolve })` with a Node 22.12–22.14 `module.register` fallback.

## Requirements
- [x] Create `src/client/routing.ts` exporting `Route`, `matchRoute`, and `navigate`; re-point `src/client/App.tsx`, `src/client/screens/LoginScreen.tsx`, and `src/client/components/ProtectedScreen.tsx` to import from `./routing` / `../routing`.
- [x] Create `src/client/lib/session-context.ts` exporting `SessionContext`, `SessionContextValue`, `useSessionContext`, and `useAuthenticatedSession`; update `src/client/lib/SessionProvider.tsx` to export only `SessionProvider` (with full `useMemo` dependencies across all 6 `SessionState` fields) and update the 12 screen/component imports of `useSessionContext` to `session-context`.
- [x] Update `scripts/resolve-ts-specifiers.mjs` so `resolve` is synchronous and export `registerTsSpecifiers(moduleApi?)` using `module.registerHooks({ resolve })` when available and falling back to `module.register(...)`.
- [x] Update all 8 scripts (`seed-lessons.mjs`, `run-e2e.mjs`, `backup-restore-drill.mjs`, `reprovision-household-db.mjs`, `seed-pilot.mjs`, `validate-lessons.mjs`, `unlock-parent.mjs`, `export-learner.mjs`) to call `registerTsSpecifiers()`.

## Implementation Steps
1. Write unit tests in `test/unit/household-preflight.test.ts` covering `matchRoute`, `registerTsSpecifiers` (`registerHooks` primary path + `register` fallback path), and zero-deprecation execution of `validate-lessons.mjs`.
2. Extract `src/client/routing.ts` and `src/client/lib/session-context.ts`; update `App.tsx`, `SessionProvider.tsx`, and consumer imports.
3. Update `scripts/resolve-ts-specifiers.mjs` and the 8 `scripts/*.mjs` files.
4. Run `npm run lint` and verify `0 errors, 0 warnings`.
