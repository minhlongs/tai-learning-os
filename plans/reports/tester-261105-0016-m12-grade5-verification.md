# Test Report — 2026-11-05 — M12 Grade 5 Curriculum (local verification)

Branch: `feat/m12-grade5-curriculum` (uncommitted working tree, 13 modified + 21 untracked files)
Scope: full local gate sweep, serialized. No edits, no deploy, no remote resources.

## Verdict

**All gates pass except `npm run test:integration`, which fails on exactly one test.**
That failure is a real gap between the test's stated contract and shipped behavior — not an
environment artifact. Everything else, including build, backup drill, and all 54 E2E tests, is green.

## Gate results

| # | Command | Exit | Result |
|---|---------|------|--------|
| 1 | `npm run validate:lessons` | 0 | 50 lessons, 257 steps, 0 issues |
| 2 | `npm run typecheck` | 0 | worker + app clean |
| 3 | `npm run lint` | 0 | 0 errors, 5 warnings (pre-existing) |
| 4 | `npm run test` | 0 | 11 files, **198 passed** (1.24 s) |
| 5 | `npm run test:integration` | 1 | 15 files, **147 passed / 1 failed** (196.8 s) |
| 6 | `npm run build` | 0 | worker 351.86 kB + client 426.35 kB |
| 7 | `npm run backup:drill` | 0 | AES-256-GCM round trip, 51 lessons restored |
| 8 | `npm run test:e2e` | 0 | **54 passed** across desktop/tablet/mobile (100 s) |

## The one real failure

`test/integration/grade5-curriculum-expansion.test.ts:301` — test 4,
"Lets a Grade 5 learner complete a Grade 5 lesson with no answer-key leakage".

```
AssertionError: sci-life-cycles-s2: expected null to be truthy
 ❯ test/integration/grade5-curriculum-expansion.test.ts:301
   expect(attemptBody.explanationVi, step.id).toBeTruthy();
```

The test drives the learner through hint level 3 on step 2, then submits the correct answer.
The submission grades `partial` (expected, and asserted on line 300). The very next assertion
demands `explanationVi` be non-null for that `partial` outcome, but the shipped route at
`src/worker/routes/learner.ts:604` releases the explanation only on `correct`:

```ts
explanationVi: result.outcome === "correct" ? stepContext.explanationVi : null,
```

Three independent checks show this is not a branch regression:

1. `git diff main HEAD -- src/worker/routes/learner.ts` is empty — the branch never touched this file.
2. `git show main:src/worker/routes/learner.ts` contains the identical line at 604.
3. The test file itself was modified at 00:50:29, during this verification run, by another process.

So the new test asserts a product behavior that has never existed. The comment immediately above
the assertion ("Step 2 ... can only grade 'partial' — the disclosed help is server-side sticky")
correctly describes grading, then assumes an explanation is attached to a `partial` result, which
the API contract does not promise (`explanationVi: string | null`).

**This needs an owner decision, not a test edit.** Either the route should release the explanation
on `partial` (an answer the learner did reach, albeit assisted), or the test should drop the
`explanationVi` assertion for the hinted step. I did not change either, per the no-edit constraint.

## Environment vs branch classification

One earlier full run showed 5 failures. Three in `evidence-and-ledger-integrity.test.ts`
(`SQLITE_BUSY`, `Failed to get session commit token`) and one in `learner-journey.test.ts`
were **environmental**: a stale `vitest` process (PID 59376) from a prior session held the shared
temp D1 handle, and the runner is configured `fileParallelism: false` precisely because D1 allows
one writer. Both files passed cleanly when re-run in isolation (21/21 and 10/10). The final full
run, after that process exited, reproduced only the single Grade 5 failure above.

The Grade 5 failure itself reproduced deterministically in isolation both before and after,
so it is branch-caused, not flaky.

## Coverage notes

No gap in the new content itself: `validate:lessons` verified all 257 steps, and the other three
Grade 5 tests (catalogue rows, 50-lesson seeding, baseline flags) pass. The untested surface is
the `partial`-outcome explanation path, which has no test anywhere in the suite.

## Cleanup

Ports 8791/8792 are free. Zero leftover `tai-learning-os-e2e-*` or `tai-learning-os-backup-drill-*`
temp dirs. One long-lived `workerd` (PID 35291, started Nov 2, orphaned to PID 1, not started by
this session) remains — left untouched since it predates this verification and may belong to
another session.

## Lint warnings (pre-existing, non-blocking)

5 warnings in `src/client/App.tsx` and `src/client/lib/SessionProvider.tsx`, all fast-refresh
export-shape or `useMemo` dependency notices. None are in files this branch changed.

## Resolution addendum — 2026-11-05

The controller resolved the reported contract question against the repository authority in
`CLAUDE.md`: `explanationVi` is withheld until the Worker grades an attempt as `correct`.
The integration test now expects `partial` plus `explanationVi: null` for the hinted step and
`correct` plus a non-null explanation for the remaining steps.

Re-verification after that test-only correction:

- Focused Grade 5 integration suite: **4/4 passed**.
- Full integration suite: **15 files, 148/148 passed**.
- `npm run verify`: typecheck, lint, **198/198 unit tests**, lesson validation, and build passed.
- The earlier isolated backup drill and **54/54 E2E** evidence remains valid because the correction
  changed only this integration assertion.

The controller also rechecked the branch and working tree before shipping. No competing file edit
was observed during the final verification window.

## Unresolved questions

None.
