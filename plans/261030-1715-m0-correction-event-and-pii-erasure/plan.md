# M0 — Parent Correction as Evidence, and PII-free Audit Ledger

Status: completed
Branch: `fix/group-a-security-remediation` (local only; no remote, no push)
Route: bugfix

## Outcome

Two defects in the learning-evidence write path are closed so the parent's
judgement and the child's right to erasure both hold:

1. A parent correction to a skill's competency state survives the learner's
   next attempt on that skill instead of being silently overwritten.
2. No child-identifying value (`nickname`) is written into `audit_events`,
   so erasing a learner profile leaves no identifying residue.

## Proven defects (verified at HEAD `e38b975`)

**A. Correction is silently erased.** `recordParentCorrection`
(`src/worker/services/session-service.ts:299`) writes the parent's state into
`skill_evidence` with `source: "parent_correction"`. But the next
`recordAttemptWithDerivation` re-derives competency purely from
`learning_attempts` (which never contains the correction) and upserts with
`source: "derived"` (`session-service.ts:176-190`). The upsert is
`ON CONFLICT(learner_id, skill_id) DO UPDATE` (`repositories.ts:795-830`), so
the correction is gone at the next submission — no error, no trace.

**B. `nickname` is persisted into the append-only ledger.** Four writers put a
child's nickname into `audit_events.detail`:

- `src/worker/routes/data.ts:538` — `{ nickname }` on learner deletion
- `src/worker/routes/parent.ts:532` — `{ nickname, grade }` on enrolment
- `src/worker/routes/parent.ts:586` — `{ from, to }` nicknames on rename
- `src/worker/routes/session-service.ts:344` — state only, no PII (leave alone)

Migration `0004` refuses `DELETE`/`UPDATE` on `audit_events`, so once written
the nickname can never be removed — an erasure request cannot be satisfied.

**C. `session_reflections` survives erasure.** `deleteLearnerCascade`
(`src/worker/db/repositories.ts:183`) deletes 11 tables but omits
`session_reflections`, which holds `learner_id` and the child's free-text
`note_vi`. The reset helper already lists it
(`src/worker/db/reset-user-data.ts`), so the omission is an oversight.

## Design decisions (frozen — both tracks must follow)

**D1. A correction becomes an attempt-shaped evidence row, not a state
overwrite.** `learning_attempts.evidence_kind` already has a `CHECK (... IN
('observed','assisted','parent_correction'))` constraint
(`migrations/0001_initial_schema.sql:167-169`) and no writer uses
`'parent_correction'` today. The schema was built for this model; only the write
path is missing. No new table, no new column, no API-contract change.

**D2. `deriveCompetency` folds a correction as a floor, never as an attempt.**
`src/shared/engine/competency.ts` stays a pure function of evidence. A
`parent_correction` row must:
- never count toward `correctCount`, `independentCount`, or `assistedCount`;
- never satisfy `isIndependentAttempt` (already true at `competency.ts:56-63`);
- establish a floor: the derived state may rise with learner evidence but must
  not fall below the corrected state while the correction is the latest
  evidence for that skill;
- let later learner evidence raise the state above the floor (a correction is
  not a lock — the child still learning is the point).

**D3. Erasure removes the reason to keep ledger PII, then the PII itself.**
`deleteLearner` must not put `nickname` in `audit_events.detail` at any writer.
The ledger keeps the *fact* of erasure (`learner.erased`, subject = learner id);
it does not keep the name. `deleteLearnerCascade` must cover every table holding
`learner_id` or child free text.

**D4. The `0004` triggers are never dropped, weakened, or reopened.**
Immutability of `audit_events` is the audit guarantee. Corruption of the ledger
is prevented by never writing PII into it, not by making it deletable.

**D5. No schema migration is added in M0.** D1 uses the existing CHECK
constraint. Adding `0005` here would mix two concerns and is not needed for the
outcome.

## Files and ownership (strict — no overlap)

| Track | Files |
|---|---|
| Correction engine | `src/shared/engine/competency.ts`, `src/worker/services/session-service.ts`, `test/unit/competency-*.test.ts` |
| Erasure + ledger | `src/worker/db/repositories.ts`, `src/worker/routes/data.ts`, `src/worker/routes/parent.ts`, `test/integration/*erasure*` |

`src/shared/engine/competency.ts` has exactly one owner (correction track).
Neither track touches the other's files.

## Acceptance criteria

- [x] A parent correction survives any number of subsequent learner attempts
      on the same skill; the correction remains visible in the audit ledger.
- [x] Subsequent learner evidence can raise derived state above a correction
      floor (a correction is not a permanent lock).
- [x] A correction never counts as a correct, independent, or assisted attempt,
      and never satisfies transfer or review promotion.
- [x] `deriveCompetency` stays deterministic and total: same evidence in, same
      state out, with no clock or randomness.
- [x] No writer puts `nickname` (or any child name) into `audit_events`.
- [x] Deleting a learner profile removes `session_reflections` free text and
      every other row holding that `learner_id`, while `audit_events` keeps the
      erasure fact and loses the name.
- [x] The `0004` append-only triggers still reject `DELETE`/`UPDATE` on
      `audit_events` after every change.
- [x] `npm run typecheck`, `npm test` (184 = 178 + 6 new), and
      `npm run test:integration` (106 = 102 + 4 new) all pass on the same snapshot.
- [x] PRODUCTION RELEASE remains BLOCKED: no remote push, no deploy, no
      external API call.

## Verification evidence (2026-10-30, branch `fix/group-a-security-remediation`)

- `npm run verify` — typecheck, lint (0 errors), 10 unit files, 184 tests passed.
- `npm run test:integration` — 6 files, 106 tests passed, including the new
  `test/integration/pii-free-erasure.test.ts` (4 tests) that proves:
  - no `audit_events.detail` ever contains `nickname` across enrol, update, delete;
  - cascade erasure clears `session_reflections` plus every other `learner_id` table;
  - `0004` triggers still reject `UPDATE` and `DELETE` on `audit_events`;
  - a parent correction on a skill survives a subsequent learner attempt on
    that skill, keeps `source = 'parent_correction'` and `correction_note`,
    and keeps its `skill_evidence.corrected` audit row.
