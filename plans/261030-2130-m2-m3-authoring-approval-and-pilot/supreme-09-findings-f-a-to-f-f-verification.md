# SUPREME COMMAND #09 — Findings F-A to F-F Verification

- Date: 2026-10-31
- Scope: Tenant/resource authorization, per-learner + per-version approval, immutable
  content publication, bounded session continuation, migration/export-import privilege
  containment, and regression coverage.
- Working tree: uncommitted on `fix/group-a-security-remediation` (HEAD `ee3d831`).
- Policy: LOCAL ONLY / PRODUCTION RELEASE BLOCKED — no commits, pushes, PRs, remote
  migrations, `wrangler deploy`, or dev-DB access were performed.

## 1. Verification gates

| Gate | Command | Result |
| --- | --- | --- |
| Typecheck | `npm run typecheck` (worker + app) | pass (0 errors) |
| Lint | `npm run lint` | pass (0 errors, 5 pre-existing `react-refresh` / `react-hooks` warnings, untouched by this change) |
| Unit tests | `npm run test` | 184 passed / 184 (51 files) |
| Integration tests | `npm run test:integration` | 123 passed / 123 (40 files) |
| Build | `npm run build` | pass |

## 2. Findings and remediation

### F-A — Write-path session boundary enforcement

`learning_attempts` and hint audit rows had no SQL-level assertion that the session was
still `in_progress` at the moment the write committed. A revocation or finalization racing
an attempt could still be recorded against a dead session.

- `src/worker/db/repositories.ts:960` — `attemptInsertGuarded` now asserts
  `lesson_id` exists in `lessons` **or** the session row is `in_progress` on the expected
  `lesson_version` with `continuation_deadline` in the future. The `NOT EXISTS (SELECT 1
  FROM lessons ...)` wrapper keeps a genuinely missing `lesson_id` surfacing as the native
  `FOREIGN KEY` failure instead of a misleading `NOT NULL constraint failed:
  learning_attempts.attempt_no`, which is the sentinel the bounded retry loop matches.
- `src/worker/db/repositories.ts:1322` — `hintAuditInsertGuarded` carries the same
  session owner / lesson / version / status / deadline assertions.
- `src/worker/services/session-service.ts:92` — `recordAttemptWithDerivation` rejects
  `status !== 'in_progress'` and `now >= continuation_deadline` with `403` before doing any
  derivation work, so the pre-read rejection matches the SQL boundary decision exactly.

Verified in `test/integration/finding-ledger-repro.test.ts`: a session whose
`continuation_deadline === now` (exact boundary) fails `recordAttemptWithDerivation`,
and `hintAuditInsertGuarded`'s guarded insert aborts at the same boundary.

### F-B — Approval leakage across siblings and stale versions

Approval rows were selected with a `(ra.learner_id = ?2 OR ra.learner_id IS NULL)`
disjunction, so a sibling-agnostic row or another sibling's row could be reported as the
selected learner's approval.

- `src/worker/routes/learner.ts:212` — `listSubjectsForLearner` passes `learnerId` (which
  may be `null`) into `repo.listApprovalStatuses`, which returns `{}` for `null` so a
  missing learner selection reports zero approved lessons instead of falling back to
  another learner's row.
- `src/worker/routes/parent.ts:214` — `listLessons` now selects approvals scoped to
  `ra.learner_id = ?2` only. The prior `(ra.learner_id = ?2 OR ra.learner_id IS NULL)`
  disjunction let a NULL-learner (sibling-agnostic) row stand in for a specific learner's
  approval. A response-bearing lesson is only approved when an approval row exists whose
  `lesson_version` equals the current `lessons.version`.
- An approval for an older version with `status = 'approved'` now drives
  `pendingReapproval = true` on the newer version rather than reporting the lesson as
  approved.

Verified in `finding-ledger-repro.test.ts`: sibling 2 sees zero approved lessons; after a
title-only content bump to v2, the parent view for the only-approving sibling reports
`approvalStatus` `draft` and `pendingReapproval` `true`.

### F-C — Session continuation boundary at the write path

`now > continuation_deadline` was used in `learner.ts` (`getLearnerHome`, `startSession`)
instead of `now >= continuation_deadline`, so exactly at the deadline a session still
counted as resumable.

- `src/worker/routes/learner.ts:159` and `src/worker/routes/learner.ts:273` — both now
  reject at `now >= continuation_deadline`.
- `startSession` now closes an abandoned session, creates the new session, and writes the
  audit row in a single `db.batch` using the version/status-guarded inserts, so a
  revocation that lands mid-write aborts all three statements atomically.
- `requestHint` uses `hintAuditInsertGuarded` and maps the constraint failure to `403`.
- `submitAttempt` uses a fresh `Date.now()` after `loadStepContexts`, so the derivation
  uses a timestamp no older than the step snapshot it was derived from.
- `finalizeSession` batches the finalize and audit rows.

### F-D — Immutable content publication

A title-only update (`/api/parent/lessons/content` without `steps`) bumped
`lessons.version` while writing no v2 step rows, so the new version had no content.

- `src/worker/routes/parent.ts` — `updateLessonContent` validates `titleVi`,
  `objectiveVi`, and `steps` (when supplied) **before** any write. When `steps` is
  omitted it reads the current version's step rows and re-inserts them under the next
  `content_version`, so no version is ever left empty.
- The version bump is now `UPDATE lessons ... WHERE id = ?5 AND version = ?6`, so a
  concurrent content edit that already bumped the version cannot silently overwrite it.
- Step inserts, the version bump, the continuation clamp, and the audit row all land in
  one `db.batch`. The obsolete `replaceSteps` / `bumpLesson` helpers were removed.

Verified in `finding-ledger-repro.test.ts`: after a title-only update, v1 retains 1 step
and v2 has 1 carried-forward step; and a request with valid steps but an invalid
`titleVi` leaves 0 rows for the aborted v2.

### F-E — Organization resource authorization

`/api/parent/lessons/content` accepted any authenticated parent for any lesson, including
lessons authored by an organization.

- `src/worker/routes/parent.ts` — `updateLessonContent` now resolves
  `repo.findOrganizationLesson` and requires the caller be a member: `owner`/`admin`, or a
  `teacher` whose `author_id` matches. Non-members get `403`.
- `src/worker/routes/organization-lessons.ts` — `reviewOrgLessonRoute` batches the review
  update and continuation clamp.

Verified in `finding-ledger-repro.test.ts`: an outsider's content edit on an org lesson
returns `403`.

### F-F — Migration, export, and import privilege containment

- `migrations/0007_learner_version_approvals_and_session_continuation.sql` — `learner_id`
  is only carried over from the legacy `review_approvals` row when the deciding parent has
  exactly one active learner (`ELSE NULL`), and `lesson_version` is derived from
  `lessons.version`. Pre-existing `in_progress` sessions lacking verified per-learner,
  per-version approval provenance fail closed with `continuation_deadline = started_at`.
- `src/shared/schemas/transfer.ts` — `ReviewApprovalExport` gains optional `learnerId` and
  `lessonVersion`; `LearningSessionExport` gains optional `continuationDeadline`.
- `src/worker/routes/data.ts` — export writes `learner_id` / `lesson_version` (scoped to
  this parent's learner, or NULL) and `continuation_deadline`; import retargets
  `reviewApprovals.learnerId` through `learnerIds`, forces `decidedBy` to the importing
  parent, writes `lesson_version`, and clamps any imported `in_progress` session that
  lacks an imported `approved` row for its exact
  `(learnerId, lessonId, lessonVersion)` tuple to `started_at`.

Verified in `finding-ledger-repro.test.ts`: exporting an `in_progress` session with no
approval, then importing it with `reviewApprovals` emptied, restores the session with
`continuation_deadline === started_at`.

## 3. Code review pass & post-review fixes

Three parallel reviewers audited write-path SQL guards (`repositories.ts` / `session-service.ts`),
route authorization paths (`learner.ts`, `parent.ts`, `consents.ts`, `organization-lessons.ts`),
and migration / transfer / test soundness (`0007_*.sql`, `transfer.ts`, `data.ts`,
`finding-ledger-repro.test.ts`):

- **`src/worker/routes/learner.ts:354`** (CRITICAL, fixed) — `startSession`'s `db.batch`
  catch block mapped every database failure to `403 Forbidden`. Tightened to match the
  `NOT NULL constraint failed: learning_sessions.lesson_version` sentinel from
  `createSessionGuardedInsert` and fall through to `serverError()` on unrelated DB errors
  (matching `requestHint` at line 450).
- **`src/shared/schemas/transfer.ts:474`** (MINOR, fixed) — `validateExportEnvelope` now
  verifies that any non-null `reviewApprovals[].learnerId` references a learner present in
  `data.learners`.
- **`src/worker/db/repositories.ts:961`** (MINOR, documented) — Added inline comment explaining
  why `NOT EXISTS (SELECT 1 FROM lessons WHERE id = ?4)` precedes the session-state guard:
  under `PRAGMA foreign_keys = ON`, a missing `lesson_id` must reach the native `FOREIGN KEY`
  constraint rather than tripping the `NOT NULL attempt_no` concurrency-retry sentinel.
- **`test/integration/finding-ledger-repro.test.ts:119`** (TEST SOUNDNESS, fixed) — Asserts
  the specific `403` status and expiration message from `recordAttemptWithDerivation` AND
  directly exercises `repo.attemptInsertGuarded(...).run()` at `now === continuation_deadline`
  to verify the SQL-embedded guard independently of the service pre-check.
- **Reviewer suggestion rejected (by design):** duplicating legacy approvals across all
  siblings in migration `0007` when a parent has `>1` active learners would violate locked
  invariant #2 (siblings never inherit approval) and invariant #9 (legacy sessions lacking
  per-learner authorization proof fail closed).

## 4. Invariant preservation

- Answer keys never reach the browser: no change touched `toLearnerExercise` /
  `StartSessionResponse` shaping.
- Evidence stays append-only; `recordParentCorrection` still layers a labelled judgement
  rather than rewriting attempts.
- Hint/retry still floors `evidence_kind` to `assisted` (server-computed `attempt_no` and
  disclosed-hint state).
- Learner-facing messages remain Vietnamese.
- Child PII absent from the audit ledger — the deletion audit row still records only the
  learner id and grade.

## 5. Still open

- `src/worker/routes/learner.ts` and `src/worker/routes/parent.ts` remain large files; no
  refactor was in scope.
- Re-approval UX is surfaced via `pendingReapproval` only; no notification flow exists.
