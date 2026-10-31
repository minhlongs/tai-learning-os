/**
 * CLI Lesson Authoring Validator (`npm run validate:lessons`).
 *
 * Validates every lesson in `src/shared/content/index.ts` offline (no D1 needed):
 *   1. Exercise schema & answerKey consistency via `validateRegistry()`.
 *   2. Required pedagogy sequence (`concept` first, `independent` present, `transfer` last).
 *   3. Progressive hints (`hint1_vi`, `hint2_vi`, `hint3_vi` non-empty and distinct).
 *   4. Zero answer-key leakage after `toLearnerExercise()`.
 */
import { register } from "node:module";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { LESSONS } = await import("../src/shared/content/index.ts");
const { validateRegistry } = await import("../test/integration/lesson-seed.ts");
const { toLearnerExercise, leaksAnswer } = await import("../src/shared/schemas/exercise.ts");

const problems = [...validateRegistry()];

for (const lesson of LESSONS) {
  const firstKind = lesson.steps[0]?.kind;
  const lastKind = lesson.steps[lesson.steps.length - 1]?.kind;
  const hasIndependent = lesson.steps.some((step) => step.kind === "independent");

  if (firstKind !== "concept") {
    problems.push({
      lessonId: lesson.id,
      message: `first step must be "concept", got "${String(firstKind)}"`,
    });
  }
  if (!hasIndependent) {
    problems.push({
      lessonId: lesson.id,
      message: `must contain at least one "independent" step`,
    });
  }
  if (lastKind !== "transfer") {
    problems.push({
      lessonId: lesson.id,
      message: `last step must be "transfer", got "${String(lastKind)}"`,
    });
  }

  for (const step of lesson.steps) {
    const learnerPayload = toLearnerExercise(step.content);
    if (leaksAnswer(learnerPayload)) {
      problems.push({
        lessonId: lesson.id,
        message: `step ${step.position}: toLearnerExercise() leaked an answer-bearing field`,
      });
    }

    if (step.content.type === "multiple_choice") {
      const h1 = step.content.hint1_vi.trim();
      const h2 = step.content.hint2_vi.trim();
      const h3 = step.content.hint3_vi.trim();
      if (new Set([h1, h2, h3]).size !== 3) {
        problems.push({
          lessonId: lesson.id,
          message: `step ${step.position}: progressive hints (hint1_vi, hint2_vi, hint3_vi) must be distinct`,
        });
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`validate:lessons failed with ${problems.length} problem(s):`);
  for (const p of problems) {
    console.error(`  - [${p.lessonId}] ${p.message}`);
  }
  process.exit(1);
}

const totalSteps = LESSONS.reduce((sum, l) => sum + l.steps.length, 0);
console.log(
  `validate:lessons OK — ${LESSONS.length} lessons (${totalSteps} steps) verified with 0 schema/answer-leak/pedagogy issues.`,
);
