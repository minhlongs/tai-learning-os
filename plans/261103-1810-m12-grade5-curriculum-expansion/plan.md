---
title: "Milestone M12: Grade 5 Curriculum Expansion & Academic Year 5 Subject Parity"
description: "Add 25 Grade 5 lessons (5 per active subject) as seed-managed content, extend the skills/objectives catalogue with Grade 5 rows, and prove Grade 4 → Grade 5 school-year continuity."
status: in_progress
priority: P1
effort: 8h
branch: feat/m12-grade5-curriculum
tags: [m12, grade5, curriculum, expansion, validator]
created: 2026-11-03
updated: 2026-11-04
---

# Plan — Milestone M12: Grade 5 Curriculum Expansion

## 1. Objective & Scope

Grade 4 ships 25 lessons across five subjects (4 core + 1 baseline each). M12
gives Grade 5 the same parity: 25 new lessons and the catalogue rows they need,
without touching any Grade 4 lesson or any learner record.

### Corrected architecture (recorded after scout)

The original draft said migration `0014` would insert "25 Grade 5 lessons, 5-step
teaching sequences". That is not how this repository stores lessons. No migration
has ever inserted a lesson row. The real split is:

- **Migrations own the catalogue only** — `skills`, `curriculum_objectives`,
  `skill_prerequisites`. Precedent: `0008`, `0010`, `0011` each add catalogue
  rows and nothing else.
- **Lesson content is TypeScript** in `src/shared/content/`, walked by
  `LESSONS` and seeded by `scripts/seed-lessons.mjs` through
  `test/integration/lesson-seed.ts`. `lesson_versions`, `lesson_steps`, and the
  review metadata are written by the seed, not by SQL.

So M12 is: one catalogue migration, 25 TypeScript lesson files, registry wiring,
and tests. Writing lessons into SQL would have been dead content: the seed never
reads SQL for lesson bodies.

### Deliverables

1. `migrations/0014_grade5_curriculum_expansion.sql` — 20 Grade 5 skills, 20
   Grade 5 curriculum objectives (4 per subject), and prerequisite edges from
   each Grade 5 skill to its Grade 4 foundation. Baseline lessons reuse a core
   skill/objective of the same subject, matching the Grade 4 pattern.
2. `src/shared/content/<subject>/**` — 25 Grade 5 lesson definitions in the
   existing flat subject directories: 4 core + 1 baseline per subject, each with
   a `concept → … → guided → independent → transfer` sequence and a Vietnamese
   explanation on every step.
3. `src/shared/content/index.ts` — register the 25 definitions after the Grade 4
   block.
4. Tests — update the registry count assertions from 25/5/20 to 50/10/40 and add
   a Grade 5 integration suite covering seeding, answer-key stripping, and the
   Grade 4 → Grade 5 school-year transition.

### Non-goals

- No Grade 5 UI redesign, no new exercise types, no PLG/pricing work.
- No change to Grade 4 content, versions, or approvals.
- No grade-based hiding of lessons from the catalogue. Cross-grade visibility is
  existing behaviour; M12 records it rather than silently changing it (see
  Risk R3).
- No production deploy, remote migration, or remote resource provisioning.

## 2. Constraints

- Every learner-facing string is Vietnamese; `titleEn`/`objectiveEn` are provided
  for parent and maintainer surfaces.
- Zero answer keys in the learner payload: every step must survive
  `toLearnerExercise()` + `leaksAnswer()`.
- `independent` steps must be removable from mastery only by genuine independent
  evidence; M12 adds content, it does not change the mastering logic.
- Content is original and self-authored. Objectives that track the published
  GDPT 2018 framework use `gdpt_2018_objective`; Debate objectives, which the
  framework does not define as a standalone subject, use `original_supplemental`.
- No new dependencies.

## 3. Content map

| Subject | Core skills (Grade 5) | Baseline |
|---------|----------------------|----------|
| Math | place value of decimals; add/subtract decimals; percentage of a number; area and circumference of a circle | decimal identification |
| English | past simple (regular verbs); comparatives (short adjectives); daily routine + adverbs of frequency; prepositions of place and directions | past simple recognition |
| Vietnamese | paragraph structure (mở – thân – kết); comparison and personification; inference from details; linking sentences in a paragraph | paragraph structure |
| Science | life cycles; food chains; forms of energy; human impact on the environment | life cycles |
| Debate | argument structure (claim + reason); source credibility; common reasoning fallacies; civil disagreement | argument structure |

## 4. Phases

### Phase 1 — Catalogue migration

- Create `0014_grade5_curriculum_expansion.sql` following the `0011` shape:
  `schema_versions` row 14, `INSERT OR IGNORE` for skills, prerequisites,
  objectives.
- Verify every new lesson's `skillId` exists after the migration, because the
  seed silently drops a lesson whose skill is absent.

### Phase 2 — Lesson content

- One file per Grade 5 lesson under the existing flat `src/shared/content/<subject>/` directories.
- 5 steps per core lesson (6 allowed where the topic needs a second concept
  step); 4–5 steps per baseline.
- Every `multiple_choice` step carries three distinct hints.
- Every step carries a specific `explanationVi`, not a restatement of the answer.

### Phase 3 — Registry + tests

- Import and append the 25 definitions in `index.ts`.
- Update `test/unit/content-registry.test.ts` counts and the per-subject
  expectation.
- Add `test/integration/grade5-curriculum-expansion.test.ts` (seeding 50 lessons /
  10 baselines, skill/objective/prerequisite verification, no answer leak, and
  full Grade 5 approval + session completion) and extend
  `test/integration/m5-phase3-prerequisites-school-years-and-subjects.test.ts`
  to assert `school_year.transitioned` audit event persistence alongside Grade 4
  → Grade 5 evidence preservation.

### Phase 4 — Verification

- `npm run validate:lessons`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:integration`
- `npm run build`

## 5. Acceptance criteria

- [x] `validate:lessons` reports 50 lessons and zero schema/answer-leak/pedagogy
      problems.
- [x] Seeding a fresh integration database yields 50 lessons, 10 baseline.
- [x] Every Grade 5 core lesson has a unique skill id; every baseline reuses a
      same-subject core skill.
- [x] No Grade 5 step leaks an answer-bearing field to the learner payload.
- [x] `POST /api/parent/school-years` to grade 5 preserves Grade 4 attempts and
      evidence and records the transition in the audit log.
- [x] A parent can approve a Grade 5 lesson and the learner can start and finish
      a session on it.
- [x] All six verification commands pass with zero errors.
- [x] Grade 4 content, versions, and approvals are unchanged.

## 6. Risks

- **R1 — content quality.** 25 lessons authored quickly can drift from grade
  level. Mitigation: short passages, one skill per lesson, hints that scaffold
  rather than reveal, and a reviewer pass before merge.
- **R2 — catalogue/lesson drift.** A lesson whose `skillId` is missing is
  dropped silently by the seed. Mitigation: the integration test seeds and
  asserts the count.
- **R3 — cross-grade visibility.** Lesson lists are not filtered by grade, so
  the 25 Grade 5 lessons appear in a Grade 4 parent's catalogue. This predates
  M12 and is intentional (parent preview + school-year continuity). M12 documents
  it and does not change it; a grade filter would be a separate product decision.
- **R4 — objective provenance.** Claiming `gdpt_2018_objective` for content that
  only approximates the framework. Mitigation: use that provenance only where the
  objective matches the published Grade 5 requirements; use
  `original_supplemental` otherwise.

## 7. Rollback

Revert the branch. Since the migration only inserts catalogue rows and lessons
are seed-managed, no learner data is rewritten. A rollback leaves orphan Grade 5
catalogue rows only on a database that already ran the migration.

## Red Team Review

| # | Severity | Lens | Finding & Evidence | Disposition |
|---|----------|------|--------------------|-------------|
| 1 | Medium | Failure Mode Analyst | `toLearnerExercise()` previously spread `...spec` on `multiple_choice`, leaving `hint1_vi`..`hint3_vi` in the initial session payload (`src/shared/schemas/exercise.ts:131`, `src/shared/schemas/exercise.ts:185`). | Accept — fixed by explicitly picking `question_vi`/`question_en` and transformed `choices`, asserted in `test/integration/grade5-curriculum-expansion.test.ts:248`. |
| 2 | Medium | Failure Mode Analyst | E2E and backup drill migration lists omitted `0013`/`0014` (`scripts/run-e2e.mjs:42`, `scripts/backup-restore-drill.mjs:47`, `test/integration/test-db.ts:100`). | Accept — updated all three harnesses to apply `0014_grade5_curriculum_expansion.sql`. |
| 3 | Medium | Assumption Destroyer | Grade 5 multiple-choice steps initially defaulted to `correctChoiceId: "a"` across files, making position `a` guessable (`test/unit/content-registry.test.ts:52`). | Accept — relabeled all 25 Grade 5 files to staggered `b c d a b` distribution and added registry distribution assertion. |
| 4 | Low | Assumption Destroyer | Phase 3 referenced `grade5-curriculum-and-school-year-transition.test.ts` while the suite split between `test/integration/grade5-curriculum-expansion.test.ts:1` and `test/integration/m5-phase3-prerequisites-school-years-and-subjects.test.ts:330`. | Accept — reconciled Phase 3 prose in `plan.md`. |

### Whole-Plan Consistency Sweep

- Verified all 20 Grade 5 skills, 20 prerequisite edges, and 20 curriculum objectives in `migrations/0014_grade5_curriculum_expansion.sql` match the 25 Grade 5 lesson files registered in `src/shared/content/index.ts`.
- Verified `plan.md` paths, counts (50 total lessons, 40 core, 10 baselines), and test references are consistent with the working tree.

## Validation Log

### Verification Results

- Claims checked: 28
- Verified: 28 | Failed: 0 | Unverified: 0
- Tier: Standard (4 phases)
- Failures: None

### Whole-Plan Consistency Sweep

- No stale file paths, conflicting counts, or unresolved contradictions remain across `plan.md` and the repository.

