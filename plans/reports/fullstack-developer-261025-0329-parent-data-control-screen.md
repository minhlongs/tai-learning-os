# Parent Data Control Screen — Implementation Report

Date: 2026-10-25
Phase: `DataControlScreen` + `data-control.css` (new files only)

## Executed Phase

- Phase: parent-data-control-screen
- Plan: none (direct delegation)
- Status: **completed**

## Files Modified

Both files are NEW. No existing file was read-modified-written.

1. `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DataControlScreen.tsx` (709 lines)
2. `/Users/macbook/projects/tai-learning-os/src/client/styles/data-control.css` (359 lines)

## Tasks Completed

### Context verification (read before writing)

- `src/worker/routes/data.ts` — read in full. Confirmed the server's exact delete rule at
  `data.ts:385`: `body.confirmation.trim() !== \`XOA ${learner.nickname}\``. The client builds
  `requiredPhrase = \`XOA ${learner.nickname}\`` from `session.learner.nickname`, matching it with
  strict equality. This is deliberately *stricter* than the server's `.trim()` so the gate fails
  closed — a phrase with stray spaces is rejected client-side rather than silently accepted.
- `src/shared/api-contract.ts:266-282` — used `ExportResponse`, `ImportResponse`,
  `DeleteLearnerRequest`, `DeleteLearnerResponse` directly. Nothing redeclared.
- `src/shared/schemas/transfer.ts` — imported `TRANSFER_FORMAT_VERSION` and the `ExportBody` type.
  `COLLECTION_LABELS` is typed `keyof ExportBody`, so the collection keys are compile-checked
  against the real format rather than hand-written strings.
- `src/worker/routes/data.ts:161-178` (`deleteLearnerCascade`) — the itemized delete list mirrors
  the seven tables the cascade actually removes: attempts, sessions, skillEvidence,
  reviewSchedule, learningGoals, schoolYears, learners. Audit events are explicitly named as the
  one thing that survives, matching the repository comment at `data.ts:392-400`.

### 1. Export

`api.post<ExportResponse>(endpoints.exportData)` → real Blob download
(`createObjectURL` → synthetic `<a download>` → `click()` → `remove()` → `revokeObjectURL` on a
`setTimeout` so the download is not cancelled). Filename
`tai-learning-os-export-<iso-safe timestamp>.json` contains no personal identifier. File size is
computed as `new TextEncoder().encode(text).length` — real UTF-8 bytes of the exact text written,
never an estimate. `formatVersion` and `exportedAt` are read from the response. Counts per
collection are derived from `countCollections(envelope.data)`, which only counts collections that
are actually arrays, so counts cannot be fabricated. The Vietnamese copy states the file contains
the learner's learning record and must be stored safely.

### 2. Import

Real `<input type="file" accept="application/json,.json">`, read with `file.text()`, checked by a
pure `checkEnvelope` before anything is sent. The browser-side check rejects: non-object JSON,
non-integer or missing `formatVersion`, a `formatVersion` **greater** than
`TRANSFER_FORMAT_VERSION` (with a Vietnamese explanation that a newer version made the file), a
version older than the current one, an invalid `exportedAt`, a missing `data` object, and any
present collection that is not an array. All problems accumulate and render together in a
`role="alert"` list, and the submit button stays disabled until the file validates. The submit
button's disabled rule is driven by `importReady` state (see the React note below). The copy states
the server re-keys the imported learner to the currently signed-in parent and will not merge or
overwrite.

### 3. Delete

Typed confirmation matching the server string exactly, itemized Vietnamese list of what is
removed, and a distinct `role="alert"` warning panel (`data-control__alert`) that carries a
6px/2px border, a bold heading containing the word "Cảnh báo", and the plain statement that the
action cannot be undone and is not recoverable by any button in the app. On success the panel
shows "Máy chủ đã xác nhận đã xóa" and a "Về trang tổng quan" button; on failure it shows
`failureMessage(result.failure)`. No auto-navigation, no optimistic clearing: state only changes
inside the `.then()` after a real `{ ok: true }`. A second submit is blocked by the `deleted` guard
in `onDelete` and the button's `disabled`.

## Issues Encountered

**One React correctness bug I introduced and then fixed.** The import button's `disabled` prop
originally read `importPayload.current === null` during render. `file.text()` resolves after the
render pass, so a ref read during render can show a stale answer. Replaced with a `useState`
`importReady` flag, set in the same `.then()` as the payload, so the render is correct.

**Nested live-region conflict, fixed.** The first draft wrapped each operation's results in
`<div aria-live="polite">` that contained `role="alert"` children. A polite ancestor demotes a
nested alert, so a destructive-path error would have been announced politely instead of
interrupting. Each result region now owns its own explicit `aria-live`/`role`, and the wrappers
carry no live attribute. This is documented in the CSS so it does not regress.

**Four `.tsx` typecheck errors, fixed** (see verification below). One was a genuine
`Array.isArray`-style narrowing gap on `formatVersion` that let `unknown` reach a template string;
the fix adds an explicit `typeof rawVersion !== "number"` branch plus a separate non-integer
branch. One was my own wrong assumption that `ImportResponse["counts"]` was an array — it is a
`Record<string, number>`, and the `.length` check was nonsense. Replaced with
`Object.keys(...).length > 0` and a heading, which also renders the server's real collection keys.

## Tests Status

- **Type check: PASS for this file.** The specified command returns empty:
  `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -i datacontrol` → no matches.
- `npx tsc -p tsconfig.app.json --noEmit` (full) reports exactly two remaining errors, both
  `TS2307` in `App.tsx` for `./screens/learner/SessionSummaryScreen` and
  `./screens/parent/DashboardScreen`. Those files do not exist and are owned by concurrent
  agents; before my edits the same command reported four errors, so `DataControlScreen` itself
  now resolves correctly for `App.tsx`.
- **Unit tests: NOT RUN**, per the instruction not to run vitest.
- **Lint: NOT RUN**, per the instruction not to run eslint.
- No `:any`, no `console.log`, no TODO/FIXME, no `window.confirm`.

## Deviations

- I did not write `src/client/screens/parent/components/*` sub-components, even though other
  parent screens use `./components/`. The phase's file ownership lists exactly two files, and a
  third directory would have been an unowned file. The screen is one cohesive unit at 709 lines;
  note the repo has no active LOC ceiling in `tsconfig`/`package.json`, so this is not a gate
  violation, but it is the first thing to review if a ceiling is later imposed.
- The `onNavigate` prop is accepted as specified by the router contract
  (`App.tsx:36` passes it). It is used only for the post-delete "Về trang tổng quan" button,
  since `noUnusedParameters` would reject a declared-but-unused prop.

## Next Steps

- `App.tsx` already imports and routes `DataControlScreen`; no wiring change is needed once the
  other agents' `DashboardScreen` / `LessonManagerScreen` / `SessionSummaryScreen` land.
- One behavioural edge worth a follow-up decision by the owner, not a blocker: after a successful
  delete the parent stays on this screen showing the confirmation panel, but `session.learner` in
  the provider is still the now-deleted learner until the session is re-read. The screen never
  re-navigates or clears it (as required), so the top bar's "Bé: …" may briefly show a deleted
  nickname. That is a session-refresh concern, not a data-control one.

## Unresolved Questions

1. Should a successful delete invalidate or refresh the client session so the top bar stops
   showing the deleted learner's nickname? That touches `SessionProvider` / `useSession`, which I
   do not own.
2. `src/client/styles/subject.css` did not exist when I read it (referenced by
   `SubjectScreen.tsx:17`), so I took tokens exclusively from `global.css` and `app.css`. If
   `subject.css` is later added with overlapping class names, the cascade order is `data-control`
   imported at module scope, same as every other screen — no conflict expected, but worth a
   glance if visual drift appears.

Status: DONE
Summary: Wrote the parent data-control screen with three real operations — a real Blob download of the actual export envelope, browser-side envelope validation that accumulates and shows all problems before enabling submit, and a delete gated by the server's exact `XOA <nickname>` typed confirmation — plus its own stylesheet, with zero typecheck errors in both files.
Concerns/Blockers: The two remaining `tsc` errors are missing screens owned by concurrent agents. One UX edge (deleted learner's nickname lingering in the top bar until session refresh) is a SessionProvider concern outside my file ownership.
