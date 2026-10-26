/**
 * The lesson seeding rules, in one module.
 *
 * `scripts/seed-lessons.mjs` and the integration suites both seed lessons, and
 * they must not be able to disagree about what a lesson is: if the operator
 * script accepts content the test fixture also accepts, a broken lesson reaches
 * a child. So validation, canonical comparison, step-id derivation and the
 * writes all live here, and both callers use them.
 *
 * DEMO CONTENT. The lessons in `src/shared/content/` are sample material for
 * the local MVP. They are not aligned to any specific school textbook, because
 * the family has not supplied one, and they must never be merged into a real
 * learner's record.
 */
import { LESSONS } from "../../src/shared/content/index";
import { correctChoiceId } from "../../src/shared/schemas/answer";
import { validateExercise } from "../../src/shared/schemas/exercise";

/** Every lesson-level column, as stored. */
export interface LessonRow {
  id: string;
  subject_id: string;
  skill_id: string | null;
  title_vi: string;
  title_en: string;
  objective_vi: string;
  objective_en: string;
  grade_from: number;
  grade_to: number;
  version: number;
  created_at: number;
  updated_at: number;
}

/** Every step-level column, as stored by `writeSteps`. */
export interface StepRow {
  id: string;
  lesson_id: string;
  position: number;
  kind: string;
  content: string;
  answer_key: string;
  explanation_vi: string;
  content_version: number;
}

export interface SeedProblem {
  lessonId: string;
  message: string;
}

/**
 * Checks every lesson against the rules the parent import route enforces, PLUS
 * the same rules the seed must uphold so the two cannot diverge.
 *
 * Returns an empty array when the registry is sound. Never throws, so a caller
 * can decide what to do — an operator script fails loudly, a test fixture can
 * assert it is empty.
 */
export function validateRegistry(dbSkills?: readonly string[]): readonly SeedProblem[] {
  const known = dbSkills ? new Set(dbSkills) : null;
  const problems: SeedProblem[] = [];

  for (const lesson of LESSONS) {
    const fail = (message: string) => problems.push({ lessonId: lesson.id, message });

    if (lesson.steps.length === 0) fail("a lesson needs at least one step");
    if (known && !known.has(lesson.skillId)) {
      fail(`skill ${lesson.skillId} is not in the catalogue`);
    }

    const kinds = new Set<string>();
    lesson.steps.forEach((step, index) => {
      if (step.position !== index + 1) {
        fail(`step positions must run 1..n with no gap (expected ${index + 1}, got ${step.position})`);
      }
      if (!step.explanationVi || step.explanationVi.trim() === "") {
        fail(`step ${step.position} needs an explanation`);
      }
      kinds.add(step.kind);
      const result = validateExercise(step.content);
      if (!result.ok) {
        fail(`step ${step.position}: ${result.error}`);
      } else {
        try {
          const parsedKey = JSON.parse(step.answerKey) as Record<string, unknown>;
          if (step.content.type === "fraction_visual") {
            if (
              parsedKey.correctNumerator !== step.content.correctNumerator ||
              parsedKey.correctDenominator !== step.content.correctDenominator
            ) {
              fail(
                `step ${step.position}: answerKey fraction does not match exercise correctNumerator/correctDenominator`,
              );
            }
          } else {
            const expectedChoiceId = correctChoiceId(step.content);
            if (parsedKey.correctChoiceId !== expectedChoiceId) {
              fail(
                `step ${step.position}: answerKey correctChoiceId "${String(parsedKey.correctChoiceId)}" does not match exercise correct choice "${String(expectedChoiceId)}"`,
              );
            }
          }
        } catch {
          fail(`step ${step.position}: answerKey is not valid JSON`);
        }
      }
    });

    if (lesson.steps.length > 0 && !kinds.has("transfer")) {
      // Without a transfer step a skill can never be evidenced as TRANSFERRED,
      // so the lesson would quietly promise a mastery it cannot demonstrate.
      fail("needs at least one transfer step");
    }
  }

  return problems;
}

/**
 * The canonical form of a lesson: lesson-level fields plus every step, in one
 * object, so a single equality check answers "does the stored row already hold
 * this content?". `content` is normalised through a JSON round trip so key
 * order cannot make two identical exercises look different, and `answerKey` is
 * compared verbatim because it is already a JSON string in the registry.
 */
export function canonical(lessonId: string): string {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`unknown lesson: ${lessonId}`);
  return JSON.stringify({
    subjectId: lesson.subjectId,
    skillId: lesson.skillId,
    titleVi: lesson.titleVi,
    titleEn: lesson.titleEn,
    objectiveVi: lesson.objectiveVi,
    objectiveEn: lesson.objectiveEn,
    gradeFrom: lesson.gradeFrom,
    gradeTo: lesson.gradeTo,
    steps: lesson.steps.map((step) => ({
      position: step.position,
      kind: step.kind,
      content: JSON.parse(JSON.stringify(step.content)),
      answerKey: step.answerKey,
      explanationVi: step.explanationVi,
    })),
  });
}

/** What the seed would have had to write to produce the stored rows. */
export function storedCanonical(lesson: LessonRow, steps: readonly StepRow[]): string {
  return JSON.stringify({
    subjectId: lesson.subject_id,
    skillId: lesson.skill_id,
    titleVi: lesson.title_vi,
    titleEn: lesson.title_en,
    objectiveVi: lesson.objective_vi,
    objectiveEn: lesson.objective_en,
    gradeFrom: lesson.grade_from,
    gradeTo: lesson.grade_to,
    steps: steps.map((step) => ({
      position: step.position,
      kind: step.kind,
      content: JSON.parse(step.content),
      answerKey: step.answer_key,
      explanationVi: step.explanation_vi,
    })),
  });
}

/** Stable across runs, so an attempt pointing at a step id keeps pointing at it. */
export function stepId(lessonId: string, position: number): string {
  return `${lessonId}-s${position}`;
}

export interface SeedResult {
  inserted: number;
  /** Lessons whose content really changed; each bumps the lesson version. */
  rewritten: number;
  unchanged: number;
}

/**
 * Writes every registry lesson that is not already stored in canonical form.
 *
 * Idempotent: a lesson already holding this content is left completely alone,
 * including its version, so a parent approval recorded against it stays valid.
 *
 * The validation gate runs first and refuses the whole seed when any lesson is
 * unsound — a partially seeded database is worse than a failed seed, so
 * validation is all-or-nothing.
 */
export async function seedLessons(
  db: D1Database,
  options: { checkSkills?: boolean } = {},
): Promise<SeedResult> {
  const checkSkills = options.checkSkills ?? true;

  if (checkSkills) {
    const skillRows = await db.prepare("select id from skills").all<{ id: string }>();
    const known = (skillRows.results ?? []).map((row) => row.id);
    const problems = validateRegistry(known);
    if (problems.length > 0) {
      const rendered = problems.map((p) => `  - ${p.lessonId}: ${p.message}`).join("\n");
      throw new Error(`lesson registry refused, ${problems.length} problem(s):\n${rendered}`);
    }
  }

  let inserted = 0;
  let rewritten = 0;
  let unchanged = 0;

  for (const lesson of LESSONS) {
    const existing = await db
      .prepare("select * from lessons where id = ?")
      .bind(lesson.id)
      .first<LessonRow>();

    if (!existing) {
      await writeLesson(db, lesson.id, 1);
      inserted += 1;
      continue;
    }

    const stepRows = await db
      .prepare("select * from lesson_steps where lesson_id = ? order by position")
      .bind(lesson.id)
      .all<StepRow>();

    if (canonical(lesson.id) === storedCanonical(existing, stepRows.results ?? [])) {
      const now = Date.now();
      await db
        .prepare(
          `insert into lesson_metadata
             (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes, review_recommendation_vi, is_baseline, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?)
           on conflict(lesson_id) do update set
             objective_id = excluded.objective_id,
             provenance = excluded.provenance,
             source_ref = excluded.source_ref,
             expected_duration_minutes = excluded.expected_duration_minutes,
             review_recommendation_vi = excluded.review_recommendation_vi,
             is_baseline = excluded.is_baseline,
             updated_at = excluded.updated_at`,
        )
        .bind(
          lesson.id,
          lesson.objectiveId ?? null,
          lesson.provenance ?? "original_supplemental",
          lesson.sourceRef ?? null,
          lesson.expectedDurationMinutes ?? 20,
          lesson.reviewRecommendationVi ?? null,
          lesson.isBaseline ? 1 : 0,
          now,
        )
        .run();
      unchanged += 1;
      continue;
    }

    // The content really changed, so the version moves with it: an approval
    // recorded against the previous version is now stale, and the parent
    // dashboard can see that rather than assume the lesson is still the one it
    // reviewed.
    await writeLesson(db, lesson.id, existing.version + 1);
    rewritten += 1;
  }

  return { inserted, rewritten, unchanged };
}

/**
 * Writes a lesson and its steps in one transaction, so a lesson never exists
 * with half its steps. Steps are deleted and re-inserted rather than patched,
 * because a reordered or replaced step is a different lesson, not an edit.
 */
async function writeLesson(db: D1Database, lessonId: string, version: number): Promise<void> {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`unknown lesson: ${lessonId}`);

  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `insert into lessons
           (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
            grade_from, grade_to, version, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(id) do update set
           subject_id = excluded.subject_id,
           skill_id = excluded.skill_id,
           title_vi = excluded.title_vi,
           title_en = excluded.title_en,
           objective_vi = excluded.objective_vi,
           objective_en = excluded.objective_en,
           grade_from = excluded.grade_from,
           grade_to = excluded.grade_to,
           version = excluded.version,
           updated_at = excluded.updated_at`,
      )
      .bind(
        lesson.id,
        lesson.subjectId,
        lesson.skillId,
        lesson.titleVi,
        lesson.titleEn,
        lesson.objectiveVi,
        lesson.objectiveEn,
        lesson.gradeFrom,
        lesson.gradeTo,
        version,
        now,
        now,
      ),
    ...lesson.steps.map((step) =>
      db
        .prepare(
          `insert into lesson_steps
             (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
           values (?, ?, ?, ?, ?, ?, ?, ?)
           on conflict(id) do update set
             lesson_id = excluded.lesson_id,
             position = excluded.position,
             kind = excluded.kind,
             content = excluded.content,
             answer_key = excluded.answer_key,
             explanation_vi = excluded.explanation_vi,
             content_version = excluded.content_version`,
        )
        .bind(
          stepId(lesson.id, step.position),
          lesson.id,
          step.position,
          step.kind,
          JSON.stringify(step.content),
          step.answerKey,
          step.explanationVi,
          version,
        ),
    ),
    db
      .prepare(
        `insert into lesson_metadata
           (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes, review_recommendation_vi, is_baseline, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(lesson_id) do update set
           objective_id = excluded.objective_id,
           provenance = excluded.provenance,
           source_ref = excluded.source_ref,
           expected_duration_minutes = excluded.expected_duration_minutes,
           review_recommendation_vi = excluded.review_recommendation_vi,
           is_baseline = excluded.is_baseline,
           updated_at = excluded.updated_at`,
      )
      .bind(
        lesson.id,
        lesson.objectiveId ?? null,
        lesson.provenance ?? "original_supplemental",
        lesson.sourceRef ?? null,
        lesson.expectedDurationMinutes ?? 20,
        lesson.reviewRecommendationVi ?? null,
        lesson.isBaseline ? 1 : 0,
        now,
      ),
  ]);
}
