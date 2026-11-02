# Plan: Milestone M9 — UI Endpoint Closure, 21-Collection Export Parity, and RBAC Teacher Assignment

- **Plan ID**: `261102-0825-m9-ui-closure-and-export-parity`
- **Status**: `completed`
- **Branch**: `feat/m9-ui-closure-and-export-parity`
- **Route**: `feature` (`/ak:cook --tdd --auto`)
- **Ship Mode**: `official` (`--ship`)
- **Advisory Reference**: `/Users/macbook/projects/tai-learning-os/plans/reports/advise-261102-0805-m9-ui-closure-and-export-parity.md`

---

## 1. Objective & Scope

Close the final 2 unwired client endpoints in `src/client/lib/endpoints.ts` (`endpoints.updateContent` and `endpoints.updateLearner`), enforce compile-time 21-collection exhaustiveness in `DataControlScreen.tsx` alongside `lessonVersions` export parity in `src/worker/routes/data.ts`, and replace the raw `teacherId` text input in `OrganizationStudioScreen.tsx` (`ClassroomSection`) with an organization-member `<select>` dropdown while enforcing RBAC visibility for `teacher` vs `owner`/`admin` lesson edits.

### Non-Goals & Constraints
- **Release Policy**: `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`. No `wrangler deploy`, no remote D1 migrations, no external LLM calls.
- **Database Safety**: Zero D1 schema migrations; never touch `.wrangler/state`, `.dev.vars`, or port `8791`.
- **Code Quality**: `0 :any` types, `0 console.log` in production code, all user-facing UI in Vietnamese (`Tiếng Việt`).
- **Pedagogical Integrity**: Preserve polymorphic `ExerciseSpec` and `answerKey` shapes when editing lesson steps; always send `expectedVersion` on `POST /api/parent/lessons/content`.

---

## 2. Phases & Dependencies

| Phase | Title | Key Files | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Shared Contract & Worker Export/Session Parity (`SessionInfo.parentId`, `LessonDetailResponse`, `lessonVersions` export) | `src/shared/api-contract.ts`, `src/worker/routes/session.ts`, `src/worker/routes/data.ts`, `src/shared/schemas/transfer.ts` |Completed |
| **Phase 2** | 21-Collection Compile-Time Exhaustiveness (`DataControlScreen.tsx`) & Learner Profile Editor (`DashboardScreen.tsx`) | `src/client/screens/parent/DataControlScreen.tsx`, `src/client/screens/parent/DashboardScreen.tsx` | Completed |
| **Phase 3** | Version-Pinned Lesson Content Editor (`LessonManagerScreen.tsx`) & Organization Studio Closure (`OrganizationStudioScreen.tsx`) | `src/client/screens/parent/LessonManagerScreen.tsx`, `src/client/screens/parent/OrganizationStudioScreen.tsx` | Completed |
| **Phase 4** | Multi-Layer Verification (Unit, Integration, E2E across Desktop/Tablet/Mobile, Backup Drill) | `test/integration/data-round-trip.test.ts`, `test/e2e/m4-browser-verification.spec.ts` | Completed |

---

## 3. Detailed Phase Specifications & TDD Steps

### Phase 1: Shared Contract & Worker Export/Session Parity
1. **`src/shared/api-contract.ts` & `src/worker/routes/session.ts`**:
   - Add `parentId?: string | null` to `SessionInfo` (`src/shared/api-contract.ts:19-29`).
   - Populate `parentId: parent.id` (or `null` when unauthenticated) in `src/worker/routes/session.ts` (`getSessionInfo`, `login`, `switchMode`, `setupParent`).
   - Update `LessonDetailResponse["steps"]` in `src/shared/api-contract.ts:365-373` to `{ id: string; position: number; kind: LessonStepKind; content: ExerciseSpec; explanationVi: string; answerKey: unknown }[]` so it accurately reflects `getLessonDetail` in `src/worker/routes/parent.ts:488-504`.
2. **`src/worker/routes/data.ts` & `src/shared/schemas/transfer.ts`**:
   - In `exportRecord` (`src/worker/routes/data.ts`), query `lesson_versions` for the exported `lessonIds` (`SELECT lesson_id, version, title_vi, title_en, objective_vi, objective_en, change_Summary_vi, created_by, created_at FROM lesson_versions WHERE lesson_id IN (...) ORDER BY lesson_id ASC, version ASC`) and attach `lessonVersions` to `body`.
   - Ensure `validateExportEnvelope` in `src/shared/schemas/transfer.ts` validates optional `lessonVersions` cleanly during round-trip export/import.

### Phase 2: 21-Collection Exhaustiveness & Learner Profile Editor
1. **`src/client/screens/parent/DataControlScreen.tsx`**:
   - Define `type ExportCollectionKey = Exclude<keyof ExportBody, "schemaVersions">;` and `COLLECTION_LABEL_MAP: Record<ExportCollectionKey, string>` with all 21 Vietnamese labels.
   - Derive `COLLECTION_LABELS` in deterministic export order (21 collections).
2. **`src/client/screens/parent/DashboardScreen.tsx`**:
   - Add `LearnerProfileSection` (`data-testid="learner-profile-section"`) rendered whenever `data?.learner` is present.
   - Provide `<input data-testid="learner-profile-nickname-input" />` (1–40 chars), `<select data-testid="learner-profile-grade-select">` (grades 1–12), and `<button type="submit" data-testid="learner-profile-save-btn">`.
   - Call `api.patch<LearnerProfile>(endpoints.updateLearner, { learnerId: learner.id, nickname: nickname.trim(), grade })`, then invoke both `load()` and `reload()` from `useSessionContext()`.

### Phase 3: Version-Pinned Lesson Content Editor & Organization Studio Closure
1. **`src/client/screens/parent/LessonManagerScreen.tsx`**:
   - In `DetailPanel`, add an edit mode toggle (`data-testid="lesson-detail-edit-btn"`).
   - Allow editing `titleVi` (`data-testid="lesson-edit-title-input"`), `objectiveVi` (`data-testid="lesson-edit-objective-input"`), and per-step `question_vi` (`data-testid={`lesson-edit-step-question-${step.position}`}`), `hint1_vi..hint3_vi` (when present / `multiple_choice`), and `explanationVi` (`data-testid={`lesson-edit-step-explanation-${step.position}`}`), preserving all polymorphic `ExerciseSpec` fields and `answerKey`.
   - Submit via `api.post<UpdateContentResponse>(endpoints.updateContent, { lessonId: detail.id, expectedVersion: detail.version, titleVi, objectiveVi, steps })`.
   - Refresh both `openDetail(detail.id)` and `loadLessons()` so version increments to `v + 1` and previously approved lessons show `"Cần duyệt lại"` (`pendingReapproval: true`).
2. **`src/client/screens/parent/OrganizationStudioScreen.tsx`**:
   - Share/load organization `members` (`GET /api/org/members`) in `ClassroomSection` and replace `<input id="org-teacher-input">` with `<select id="org-teacher-select" data-testid="org-teacher-select">` (also keeping compatibility or clear selection of members `${m.displayName} (${ROLE_LABELS[m.role]})`).
   - In `LessonStudioSection`, compute `canEditLesson = canManage || (myRole === "teacher" && l.authorId === session.parentId)`.
   - Show `"Chỉnh sửa"` (`data-testid={`org-lesson-edit-btn-${l.lessonId}`}`) and `"Gửi duyệt"` only when `canEditLesson(l)` holds.
   - When `"Chỉnh sửa"` is clicked, fetch `api.get<LessonDetailResponse>(endpoints.lessonDetail(l.lessonId))`, populate the form, and on submit call `api.post<UpdateContentResponse>(endpoints.updateContent, { lessonId, expectedVersion, titleVi, objectiveVi, steps })` (`data-testid="org-lesson-save-btn"`), which increments `version` to `v + 1` and resets center status to `"Bản nháp"` (`draft`).

### Phase 4: Multi-Layer Verification
- Update `test/integration/data-round-trip.test.ts` to assert `lessonVersions` is included in exported envelopes.
- Update `test/e2e/m4-browser-verification.spec.ts` to verify learner profile update on `/parent`, 21 collection labels on `/parent/data`, teacher `<select>` dropdown and org lesson content editing on `/parent/organization`, and lesson content editing in `DetailPanel` on `/parent/lessons`.
- Run `npm run verify`, `npm run test:integration`, `npm run test:e2e`, and `npm run backup:drill`.

---

## 4. Validation & Red-Team Gate Record

- **Plan Validation Gate**: Verified all file paths, line numbers, API contract types, and test commands against commit `631f44a`.
- **Red-Team Gate**:
  1. *Risk*: Editing a non-`multiple_choice` seeded lesson step in `LessonManagerScreen.tsx` could strip type-specific fields (`bar`, `correctNumerator`, `evidenceSentence_vi`, `sentenceAcceptedWords`).
     *Mitigation*: Clone `{ ...step.content, question_vi: editedQuestion }` and preserve `step.answerKey` verbatim unless choice labels/hints on `multiple_choice` are edited.
  2. *Risk*: Selector change from `org-teacher-input` to `org-teacher-select` could break existing E2E test 10 in `test/e2e/m4-browser-verification.spec.ts`.
     *Mitigation*: Check and update `test/e2e/m4-browser-verification.spec.ts` where `org-teacher-input` is referenced to use `selectOption` on the `<select>` element.
  3. *Risk*: `validateExportEnvelope` in `src/shared/schemas/transfer.ts` requires `id` on every row in `EXPORT_COLLECTIONS`, whereas `lesson_versions` rows are keyed by `(lesson_id, version)` without an `id` column.
     *Mitigation*: Keep `EXPORT_COLLECTIONS` for `id`-bearing tables and validate `lessonVersions` explicitly in `validateExportEnvelope` by checking `lessonId` (string) and `version` (positive integer), matching how `importCollections` in `src/worker/routes/data.ts:662-671` already imports `data.lessonVersions`.
