/**
 * CLI Lesson Authoring Validator (`npm run validate:lessons`).
 *
 * Nine stages, in this order, over every lesson in `src/shared/content/index.ts`.
 * The rules themselves live in `test/integration/lesson-seed.ts` — the same
 * module `seedLessons()` runs — so a lesson this CLI accepts is a lesson the
 * seed also accepts, and the authoring CLI cannot drift away from the write
 * path. This script owns only how the result is reported.
 *
 *   1. identity       — lesson id unique, step positions run 1..n with no gap
 *   2. curriculum     — an objectiveId, correctly shaped and present in the graph
 *   3. rights         — an explicit provenance and a non-empty sourceRef
 *   4. schema         — every step's content passes `validateExercise()`
 *   5. answer-key     — the stored answerKey matches the exercise's correct answer
 *   6. pedagogy       — concept first, independent present, transfer last
 *   7. hints          — hint1_vi / hint2_vi / hint3_vi non-empty and distinct
 *   8. explanation    — never cites a choice by letter ("Câu a"), because the
 *                       learner's payload renders options without letters
 *   9. answer-leak    — zero answer-bearing fields survive `toLearnerExercise()`
 *
 * Stage 3 exists because rights are not derivable. `lesson_metadata` defaults
 * `provenance` to 'original_supplemental' and allows `source_ref` to be NULL,
 * so a lesson that omits both is stored as a rights claim nobody made. The gate
 * refuses that here rather than letting the default answer for the family.
 *
 * Exit 0 and one summary line when the registry is sound; exit 1 listing every
 * problem, grouped by stage, when it is not.
 */
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { LESSONS } = await import("../src/shared/content/index.ts");
const { validateRegistry, validateAuthoringStages, VALIDATION_STAGES } = await import(
  "../test/integration/lesson-seed.ts"
);

const problems = [...validateRegistry(), ...validateAuthoringStages()];
const blocking = problems.filter((problem) => problem.severity === "blocking");
const advisory = problems.filter((problem) => problem.severity === "advisory");

/** One block per stage, so a finding says which check produced it. */
function report(heading, found) {
  console.error(heading);
  for (const stage of VALIDATION_STAGES) {
    const bucket = found.filter((problem) => problem.stage === stage.key);
    if (bucket.length === 0) continue;
    console.error("");
    console.error(`▸ ${stage.key} — ${stage.titleVi} / ${stage.titleEn}`);
    for (const problem of bucket) console.error(`  - ${problem.lessonId}: ${problem.message}`);
  }
}

if (blocking.length > 0) {
  report(`validate:lessons failed with ${blocking.length} blocking problem(s):`, blocking);
  if (advisory.length > 0) {
    console.error("");
    report(`${advisory.length} advisory problem(s) not counted above:`, advisory);
  }
  process.exit(1);
}

const totalSteps = LESSONS.reduce((sum, lesson) => sum + lesson.steps.length, 0);

// One line per stage, so a passing run shows which check produced the pass
// rather than only that something did.
for (const stage of VALIDATION_STAGES) {
  console.log(`  ✓ ${stage.key.padEnd(12)} ${stage.titleVi} / ${stage.titleEn}`);
}

console.log(
  `validate:lessons OK — ${LESSONS.length} lessons (${totalSteps} steps) verified with 0 schema/answer-leak/pedagogy issues.`,
);

// Advisory findings do not fail the run — they are quality defects, not
// integrity ones — but they are never silent. The count is what makes the
// residue visible: it can shrink as content is fixed and must never grow
// unnoticed.
if (advisory.length > 0) {
  console.error("");
  report(
    `validate:lessons advisory — ${advisory.length} learner-facing string(s) cite a choice the child cannot see:`,
    advisory,
  );
  console.error("");
  console.error(
    "Advisory only: the run still exits 0. Fix these when the 50 seeded lessons are next edited.",
  );
}
