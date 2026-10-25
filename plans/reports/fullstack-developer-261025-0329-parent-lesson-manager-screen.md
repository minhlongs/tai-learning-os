# Phase Implementation Report

## Executed Phase
- Phase: Parent lesson manager screen (`/parent/lessons`)
- Plan: none
- Status: completed

### Files Modified
- `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/LessonManagerScreen.tsx` — new, 633 lines
- `/Users/macbook/projects/tai-learning-os/src/client/styles/lesson-manager.css` — new, 441 lines

No other file was created or modified.

### Tasks Completed
- [x] Load list via `api.get<LessonListResponse>(endpoints.lessons)`, with loading/error/retry states
- [x] Every lesson renders its true `approvalStatus` with a plain Vietnamese label, exhaustively mapped over the real `ApprovalStatus` members (`draft` / `approved` / `rejected` → "Chưa duyệt" / "Đã duyệt" / "Từ chối")
- [x] `pendingReapproval` flagged with a bordered text box naming the cause in Vietnamese (content edited after approval), never colour alone
- [x] Approval in one step; refusal behind a two-step inline panel with a real `<button>` pair (`window.confirm` deliberately not used)
- [x] Local state updated from `SetApprovalResponse` after each decision — no refetch, list stays truthful
- [x] Short status line in a polite live region, carrying the outcome in words as well as colour
- [x] Detail via `api.get<LessonDetailResponse>(endpoints.lessonDetail(id))`; steps render position, kind, content, explanation, and the answer key
- [x] Answer key labelled "Đáp án (chỉ phụ huynh xem được)" per step plus a panel-level warning that it must not reach the learner
- [x] Honest empty state via `EmptyPanel`; no fabricated placeholder lesson
- [x] All UI text in Vietnamese; no alignment/textbook claim, no invented stats or difficulty ratings
- [x] WCAG 2.2 AA: real `<h1>`/`<h2>`/`<h3>`, `<table>` with 5 `<th scope="col">` plus `<caption>`, `aria-labelledby`, `aria-expanded`/`aria-controls`, labelled inputs, 44px touch targets from the shared `.btn` classes, no animation
- [x] New CSS only; reuses `--tlo-*` tokens and `.btn*` / `.page__*` classes from `app.css`

### Tests Status
- Required verification — PASS:
  `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -i lessonmanager` → empty.
- Full `tsc` shows exactly 2 remaining errors, both outside this phase's ownership:
  `App.tsx` cannot find `./screens/learner/SessionSummaryScreen` and
  `./screens/parent/DashboardScreen` (files owned by other concurrent agents, not yet written).
  `App.tsx`'s import of `LessonManagerScreen` compiles clean, which confirms the exported
  signature matches the router's usage.
- Not run, per instructions: eslint, vitest.

### Issues Encountered
- **Correctness bug found and fixed during self-review.** The original status pill read
  "Cần duyệt lại" whenever `pendingReapproval` was true, including for lessons whose
  `approvalStatus` was `rejected`. A refused lesson has no approval to make stale, so the
  label was misleading. Extracted a `statusCell()` helper that only upgrades
  `approved` + `pendingReapproval` to the re-approval label; `draft` and `rejected` now
  always show their own true label, while the separate cause flag still renders in all
  three cases.
- `subject.css` / `learner-home.css` are owned by other agents and not guaranteed to load
  on this route, so `.section-title` is declared locally in `lesson-manager.css` rather
  than inherited. A heading that depends on another screen's stylesheet can render
  unstyled.
- **Content editing intentionally not implemented.** The spec allowed skipping it. A step
  editor needs a per-`ExerciseSpec` editor for four discriminated variants plus re-validation
  feedback, and a partial editor is worse than none on a screen whose job is the approval gate.
  `UpdateContentRequest` / `endpoints.updateContent` / `endpoints.correctSkill` are therefore
  unused here.

### Next Steps
- `/parent/lessons` is wired and renderable as soon as `SessionSummaryScreen` and
  `DashboardScreen` exist; the whole-app typecheck then goes clean.
- If content editing is wanted later, it belongs on a separate route rather than this screen.
- No automated tests were added for this screen — the phase instructions said not to run
  vitest, and no test file was within the ownership list.

### Unresolved Questions
1. The server currently hardcodes `pendingReapproval: false` in `listLessons`
   (`src/worker/routes/parent.ts:215`), so this safety surface will never activate from real
   data until the worker derives it from the content version versus the approval timestamp.
   The client is written to render it correctly once the server reports it truthfully.
2. The status cell states the learner-mode effect in words ("Bài này đang hiện với Tài").
   That is accurate given the learner screens list only approved lessons, but it is the one
   place this screen asserts something about another screen's behaviour rather than about
   its own data.
