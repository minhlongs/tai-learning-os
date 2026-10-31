# M4 — UI Closure (M0–M3 & Spaced Review), Multi-Learner Switcher, Grade 4 Curriculum Expansion & CLI Validator

- **Status:** completed
- **Date:** 2026-10-31
- **Branch:** `feat/m4-ui-multi-learner-and-curriculum`
- **Route:** feature (`--tdd`)
- **Ship mode:** `official` (`--ship`)

---

## 1. Outcome & Scope

Deliver all four user-confirmed tracks in one cohesive, backward-compatible slice:

1. **Track 1 — M4 UI Closure (M0–M3 & Phase 2 Spaced Review)**:
   - **Fix `pendingReapproval` badge rendering (`src/client/screens/parent/LessonManagerScreen.tsx`)**: After Supreme #09 (F-B), a lesson whose version was bumped after a prior approval returns `approvalStatus: "draft"` and `pendingReapproval: true`. Update `statusCell()` and row copy so any lesson with `pendingReapproval === true` renders `"Cần duyệt lại"` (`status-pill--attention`) regardless of whether `approvalStatus` is `"draft"` or `"approved"`.
   - **Parent Skill Correction UI (`src/client/screens/parent/DashboardScreen.tsx`)**: Wire `POST /api/parent/skills/correct` (`endpoints.correctSkill`) into `SkillTable` so a parent can select a new `CompetencyState` (`NOT_OBSERVED`, `SUPPORTED`, `INDEPENDENT`, `RETAINED`, `TRANSFERRED`) and provide a mandatory Vietnamese `note` (`correctionNote`) for any skill, persisting an append-only `parent_correction` floor and refreshing the dashboard.
   - **Interactive Spaced Review Queue UI (`src/worker/routes/learner.ts`, `src/shared/api-contract.ts`, `src/client/screens/learner/LearnerHomeScreen.tsx`, `src/client/screens/learner/components/ReviewDueList.tsx`)**: Enrich `LearnerHomeResponse.reviewDue` entries with `lessonId: string | null` and `lessonTitleVi: string | null` (resolved from `visibleLessons` matching `skill_id`), and render an actionable `"Ôn tập ngay"` button on each review-due row that navigates directly to `/lessons/:lessonId` (or `/subjects/:subjectId` when no specific approved lesson is linked).
   - **Center Consent & Classroom Assigned Lessons UI (`src/client/screens/parent/LessonManagerScreen.tsx`, `src/client/lib/endpoints.ts`)**: Add endpoints (`consents`, `consentOrganizations`, `grantConsent`, `revokeConsent`, `classroomLessons`) and render a Parent Sovereignty panel on `LessonManagerScreen` allowing parents to view/grant/revoke center consents (`learner_consents`) and inspect/approve classroom-assigned lessons (`classroom_lesson_assignments`).

2. **Track 2 — Multi-Learner Switcher UI & Learner-Scoped Routes**:
   - **Session & Active Learner Store (`src/shared/api-contract.ts`, `src/worker/routes/session.ts`, `src/client/lib/active-learner-store.ts`, `src/client/lib/api.ts`, `src/client/lib/useSession.ts`)**:
     - Include `learners?: { id: string; nickname: string; grade: number | null }[]` on `SessionInfo` returned by `GET /api/session`, `POST /api/session/login`, and `POST /api/session/mode`.
     - Respect `x-tlo-learner-id` header or `?learnerId=` query param in `GET /api/session`, `src/worker/routes/parent.ts` (`getParentDashboard`, `listLessons`, `getLessonDetail`, `setApproval`, `correctSkillEvidence`, `getCurriculumSetup`, `upsertCurriculumIntake`, `getBaselineAssessments`, `evaluateBaseline`, `getPlanner`, `generatePlan`, `updatePlanItem`), `src/worker/routes/consents.ts`, and `src/worker/routes/data.ts` (`exportRecord`), always verifying parent ownership via `repo.findLearnerForParent`.
     - Store the selected `activeLearnerId` in `src/client/lib/active-learner-store.ts` and attach `x-tlo-learner-id` in `src/client/lib/api.ts` so every client request automatically scopes to the selected child.
   - **Topbar Switcher & Household Profile Enrolment (`src/client/components/AppShell.tsx`, `src/client/components/ProtectedScreen.tsx`, `src/client/screens/parent/DataControlScreen.tsx`)**:
     - Render a learner selector (`data-testid="learner-switcher"`) in `AppShell` whenever a parent has learners, allowing instant switching between siblings.
     - Add a household learner enrolment form on `DataControlScreen.tsx` (`POST /api/parent/learners`) so a parent can add a sibling profile (nickname, birthYear, grade) directly from the UI.

3. **Track 3 — Grade 4 Curriculum Expansion (GDPT 2018)**:
   - Add 3 new core Grade 4 lessons (1 per active subject, each mapped to a distinct catalogue skill so every core lesson continues to have a unique `skillId`):
     - **Mathematics (`math-frac-compare`)**: `src/shared/content/math/fractions-compare.ts` (`id: "math-fractions-compare"`, skill `math-frac-compare`, objective `obj-math-frac-comp` — So sánh hai phân số cùng mẫu số và khác mẫu số).
     - **English (`eng-voc-home`)**: `src/shared/content/english/home-vocabulary.ts` (`id: "eng-home-vocabulary"`, skill `eng-voc-home`, objective `obj-eng-voc-noun` — Từ vựng đồ vật và không gian trong nhà).
     - **Vietnamese (`vie-reading-comprehension-story` / new skill `vie-story-moral` or existing catalogue skill)**: Add skill `vie-story-lesson` (`Bài học từ câu chuyện`, `VIE.READ.LESSON`, grade 4–5) in migration `0008_grade4_curriculum_expansion.sql` (and `test-db.ts`), plus `src/shared/content/vietnamese/story-lesson.ts` (`id: "vie-story-lesson"`, skill `vie-story-lesson`).
   - Register all 3 new lessons in `src/shared/content/index.ts` (bringing total lessons from 12 to 15: 5 per subject = 4 core + 1 baseline, and 12 core lessons with 12 distinct `skillId`s).

4. **Track 4 — CLI Lesson Authoring Validator**:
   - Create `scripts/validate-lessons.mjs` and wire `"validate:lessons": "node scripts/validate-lessons.mjs"` in `package.json`.
   - The validator checks `LESSONS` via `validateRegistry()`, verifies progressive hints (`hint1_vi`, `hint2_vi`, `hint3_vi`), checks `toLearnerExercise()` strips all answer keys on every step, and exits non-zero on any violation.

---

## 2. Non-Negotiable Invariants & Constraints

1. **All 10 TAI Security & Pedagogy Invariants Hold**:
   - Per-learner, per-version approvals (`UNIQUE (learner_id, lesson_id, lesson_version)`).
   - Siblings never inherit approvals, evidence, sessions, or curriculum state.
   - Zero answer keys in learner payloads (`toLearnerExercise()`).
   - `explanationVi` withheld until Worker grades `correct`.
   - Hint/retry floors `evidence_kind` to `assisted`.
   - Zero child PII (`nickname`, DOB, school, address) in `audit_events`.
   - All learner-facing and parent-facing UI copy in Vietnamese (`Tiếng Việt`).
   - Zero `:any` types, zero `console.log` in production code (`src/`).

---

## 3. Acceptance Criteria

- [x] **AC1 (`pendingReapproval` UI)**: When a lesson has `pendingReapproval: true` (including when `approvalStatus === "draft"` after a version bump), `LessonManagerScreen` renders the `"Cần duyệt lại"` badge (`status-pill--attention`).
- [x] **AC2 (Parent Skill Correction UI)**: `DashboardScreen` allows a parent to open a correction form on a skill row, select a competency state, enter a non-empty Vietnamese reason, submit to `POST /api/parent/skills/correct`, and see the updated state reflected.
- [x] **AC3 (Interactive Spaced Review Queue)**: `GET /api/learner/home` returns `lessonId` and `lessonTitleVi` on `reviewDue` entries when an approved lesson exists for that skill, and `ReviewDueList` renders an `"Ôn tập ngay"` button that navigates to the lesson.
- [x] **AC4 (Center Consent & Classroom Lessons UI)**: `LessonManagerScreen` displays enrolled center consent status (with grant/revoke buttons) and classroom-assigned lessons (with parent approval controls).
- [x] **AC5 (Multi-Learner Switcher & Backend Scoping)**: `GET /api/session` returns `learners` list and active `learner`; `AppShell` renders a learner switcher (`data-testid="learner-switcher"`) when learners exist; `DataControlScreen` allows enrolling an additional learner; all `/api/parent/*`, `/api/learner/*`, and `/api/data/export` endpoints honor `x-tlo-learner-id` / `learnerId` with strict parent ownership verification.
- [x] **AC6 (Grade 4 Curriculum Expansion & CLI Validator)**: 15 lessons (5 Math, 5 English, 5 Vietnamese) pass all unit and integration checks, and `npm run validate:lessons` exits 0 with full schema + zero-leakage verification.
- [x] **AC7 (Full Verification Gates)**: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:integration`, and `npm run build` all pass with 0 errors.

---

## 4. Red-Team & Consistency Sweep

- **Risk 1 — Breaking existing `content-registry.test.ts` assertions**:
  - `test/unit/content-registry.test.ts` asserts `expect(LESSONS).toHaveLength(12)`, `bySubject.get(...) === 4`, and `expect(coreLessons).toHaveLength(9)` with unique `skillId` per core lesson.
  - *Mitigation*: Adding exactly 1 core lesson per subject (Math `math-frac-compare`, English `eng-voc-home`, Vietnamese `vie-story-lesson`) keeps the subjects balanced (5 lessons each, 15 total, 12 core lessons) and preserves the 1-to-1 unique `skillId` invariant across all 12 core lessons. Update `content-registry.test.ts` counts to 15 total / 5 per subject / 12 core.
- **Risk 2 — Cross-tenant learner ID spoofing via `x-tlo-learner-id`**:
  - *Mitigation*: Every route resolving `x-tlo-learner-id` or `learnerId` calls `repo.findLearnerForParent(db, targetId, context.parent.parentId)`. If the learner does not belong to the authenticated parent, the route returns `404 Không tìm thấy hồ sơ người học` (never leaking whether the ID exists under another family).
- **Risk 3 — Stale `activeLearnerId` after learner deletion**:
  - *Mitigation*: When `GET /api/session` receives an `x-tlo-learner-id` that no longer exists under the parent, `getSessionInfo` falls back to `findFirstLearnerForParent`, and `useSession` syncs `activeLearnerId` to `result.value.learner?.id ?? null`.
