# Phase Implementation Report — Session Summary Screen

## Executed Phase
- Phase: SessionSummaryScreen (single-file task)
- Plan: none
- Status: completed

## Files Modified
| File | Lines |
|---|---|
| `/Users/macbook/projects/tai-learning-os/src/client/screens/learner/SessionSummaryScreen.tsx` | 336 |
| `/Users/macbook/projects/tai-learning-os/src/client/styles/session-summary.css` | 144 |

Both files are new. No existing file was edited.

## Tasks Completed

### 1. Single finalize POST with a StrictMode-safe guard
- Module-level `finalizeIssued: Set<string>` marks a session id as *issued* before
  the request is sent, so a second mount, a StrictMode double-invoke, and a route
  revisit all short-circuit before any network call. The id is released only on
  failure, which is what keeps `onRetry` working.
- A second module-level `summaryCache: Map<string, StoredSummary>` means the
  screen re-renders from cache instead of re-POSTing when a learner navigates
  back to an already-finalized session.
- Types come from `shared/api-contract.ts` (`FinalizeSessionResponse`,
  `SessionSummary`, `SessionStatus`). Nothing is redeclared.

### 2. Render states
- Loading: `<LoadingPanel what="kết quả bài học" />`.
- Failure: `<ErrorPanel message={failureMessage(result.failure)} onRetry={finalize} />` —
  retry re-runs the same fetch.
- The three phases are a discriminated union, so loading, error and summary can
  never render simultaneously.

### 3. Content integrity
Every contract field is rendered, with zero shown honestly and never omitted:
- `attemptedCount`, `correctCount`, `assistedCount`, `maxHelpLevel`,
  `stepsCompleted`, `skillsPracticed[]`, `nextReview[]`.
- `assistedCount` is labelled "Số lần cần gợi ý mức 3 trở lên" and rendered
  unconditionally (including as 0). `maxHelpLevel` renders with a note that
  explains what level 0 means, so a zero is informative rather than blank.
- Correct/incorrect balance is stated as two plain counts, not a percentage.
  "Số câu chưa làm đúng" is *derived* by subtraction and floored at 0
  (`notCorrect`), so no negative count can render.
- `stepsCompleted` is labelled "Số bước đã hoàn thành" with an explicit note
  stating it is distinct steps, **not** a fraction of the lesson total. No
  denominator exists anywhere on the screen.
- `skillsPracticed` empty → `<EmptyPanel title="Chưa có kỹ năng nào được ghi nhận">`
  with copy that says nothing is invented. `nextReview` empty → a plain sentence,
  never a fabricated entry.
- Dates use the existing helpers: `formatDate(dueAt)` and
  `formatDaysUntil(dueAt, nowMs)`. Argument order verified against both
  signatures; no new date helper was added.
- Every count is a real `attempts.length` / `correctCount` / `assistedCount` /
  `maxHelpLevel` / distinct-step-count from the server route. No points, stars,
  XP, badges, percentage, invented rank or streak. No confetti, no fake
  celebration.
- No mastery or ability claim anywhere; all framing is "ghi nhận" (recorded).
- Bonus: `FinalizeSessionResponse.status` is also rendered as a Vietnamese
  phrase ("đang học", "đã hoàn thành", "đã thoát giữa chừng"), so a session that
  was abandoned is described plainly rather than congratulated.

### 4. Accessibility
- Semantic `h1` (single), `h2` per section, `h3` for the honesty note. Heading
  order verified, no levels skipped.
- Each section is labelled via `aria-labelledby` pointing at its heading.
- Facts are a `<dl>` of `<div><dt><dd>` rows with unique ids, so a screen reader
  reads label-then-value rather than a bare number.
- Counts are marked up with existing `.pill` classes, each pairing its colour
  with a glyph (`✓`, `✗`, `!`) and text, so meaning never depends on colour alone.
  A distinct glyph (`↻`) marks the neutral review pill.
- Both exit controls are real `<button type="button">` with clear Vietnamese
  labels ("Về trang học tập", "← Quay lại"), sized `btn--large` for ≥56px.
- Focus visibility is inherited from `global.css` `:focus-visible` (3px outline,
  never removed).
- Zero CSS animations and zero transitions added. The global
  `prefers-reduced-motion` rule has nothing to disable in this stylesheet.

### 5. Styling
- New file only: `session-summary.css`. No existing CSS file was modified.
- Reuse of existing tokens and shared class names: `--tlo-space-*`,
  `--tlo-radius-*`, `--tlo-text-*`, `--tlo-measure`, `--tlo-content-max`,
  `--tlo-border*`, `--tlo-text-muted`, `--tlo-primary-strong`, and the shared
  `.card`, `.card--muted`, `.card__title`, `.card__note`, `.section-title`,
  `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--large`, `.pill*`, `.rows`,
  `.row`, `.row__main`, `.row__title`, `.row__meta`, `.row__aside`, and
  `.state-panel*` conventions.
- New classes are namespaced `summary-*` so they cannot collide with another
  agent's learner-area CSS.
- Mobile-first: single column at 375px, two columns from 48rem, buttons
  side-by-side from 30rem with `flex: 1 1 minmax(0, 12rem)` so a long Vietnamese
  label shrinks the button rather than overflowing. `overflow-wrap: anywhere` on
  values and labels.

## Tests Status
- Type check: **pass** — the required command
  `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -i sessionsummary`
  produces no output.
- Full project typecheck has one pre-existing error outside my ownership:
  `src/client/App.tsx(32,33): Cannot find module './screens/parent/DashboardScreen'`.
  That file is another agent's in-flight work; it was absent before I started and
  I did not create or edit it.
- Unit/integration/eslint/vitest: **not run** per instruction.

### Manual verification performed
- CSS brace balance checked programmatically (19/19, depth 0, no unclosed
  comment).
- Duplicate-id scan: all 5 ids unique. Heading scan: h1×1, h2×3, h3×1.
- `formatDaysUntil` behaviour compared against my `overdue` predicate over six
  cases (due in 5 days / tomorrow / now / yesterday / long ago / same day 12h) —
  the boolean and the rendered phrase agree in every case.
- Call-site argument order for `formatDate` and `formatDaysUntil` cross-checked
  against `src/client/lib/format.ts` and against the existing `CompletedList.tsx`
  call convention.
- Cross-checked the semantics of each field against the server implementation in
  `src/worker/routes/learner.ts` (`finalizeSession`, ~line 367) so the copy
  describes what the route actually computes.

## Issues Encountered
1. `src/client/styles/subject.css` did not exist when I began reading, so the
   token conventions were taken from `global.css`, `app.css` and
   `learner-home.css`, which are identical in token set. No conflict resulted —
   I did not read or write any file outside my two.
2. The app-wide build cannot be verified green here because another agent's
   `DashboardScreen` is still missing. My file compiles clean within the same
   project config, and `App.tsx` already imports my component correctly
   (`case "session-summary"`), so no integration change was needed on my side.

## Next Steps
- Once `DashboardScreen` lands, a full `tsc -p tsconfig.app.json --noEmit` should
  run clean repo-wide.
- A component test (not requested, not written) would cover: the one-POST guard
  under StrictMode double-invoke, the zero-`skillsPracticed` empty panel, and the
  floored `notCorrect` arithmetic.

Status: DONE
Summary: Created the honest end-of-lesson summary screen plus its own new stylesheet; every contract field renders with zeros shown plainly, help usage is always visible, no score/percentage/streak or mastery claim exists, and the single finalize POST is guarded against StrictMode and route-revisit duplicates.
Concerns/Blockers: None affecting this deliverable. Note only that a repo-wide typecheck is blocked on another agent's not-yet-written `src/client/screens/parent/DashboardScreen`, which I did not touch.
