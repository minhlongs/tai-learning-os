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
import type { CurriculumProvenance, LessonDefinition, LessonStep } from "../../src/shared/content/types";
import { correctChoiceId } from "../../src/shared/schemas/answer";
import { leaksAnswer, toLearnerExercise, validateExercise } from "../../src/shared/schemas/exercise";

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

/**
 * The nine stages of the content gate, in the order it reports them. Declared
 * here rather than in the CLI so the offline authoring script and the seed can
 * never disagree about what a stage is called or which stage a problem belongs
 * to. The registry below emits problems for stages 1–6; the last three need no
 * database, so `scripts/validate-lessons.mjs` adds them on top.
 */
export const VALIDATION_STAGES = [
  { key: "identity", titleVi: "Danh tính bài học và thứ tự bước", titleEn: "lesson identity and step order" },
  { key: "curriculum", titleVi: "Nối vào đồ thị chương trình", titleEn: "linked to the curriculum graph" },
  { key: "rights", titleVi: "Quyền nội dung và nguồn trích dẫn", titleEn: "content rights and source citation" },
  { key: "schema", titleVi: "Lược đồ bài tập", titleEn: "exercise schema" },
  { key: "answer-key", titleVi: "Đáp án khớp với bài tập", titleEn: "answer key matches the exercise" },
  { key: "pedagogy", titleVi: "Trình tự sư phạm", titleEn: "pedagogical sequence" },
  { key: "hints", titleVi: "Gợi ý tăng dần", titleEn: "progressive hints" },
  { key: "explanation", titleVi: "Lời giải không chỉ vị trí đáp án", titleEn: "explanation does not cite a choice letter" },
  { key: "answer-leak", titleVi: "Không rò đáp án xuống trình duyệt", titleEn: "no answer reaches the browser" },
] as const;

export type SeedStage = (typeof VALIDATION_STAGES)[number]["key"];

export interface SeedProblem {
  lessonId: string;
  /** Which of the nine stages found it; see `VALIDATION_STAGES`. */
  stage: SeedStage;
  message: string;
  /**
   * `blocking` fails the CLI and `seedLessons()`; `advisory` is printed and
   * counted without failing the run. All nine stages — including choice-letter
   * citations in explanations or hints — emit `blocking` findings.
   */
  severity: "blocking" | "advisory";
}

/**
 * Facts the caller can supply from a live database. Everything here is
 * optional so the offline caller (`scripts/validate-lessons.mjs`, which has no
 * database) still gets the checks that need no catalogue, while the seed gets
 * the referential ones.
 */
export interface RegistryCatalogue {
  /** `skills.id` values currently in the database. */
  skills?: readonly string[];
  /** `curriculum_objectives.id` values currently in the database. */
  objectives?: readonly string[];
}

/** Objective ids are `obj-<subject>-<slug>`; see `migrations/0003_*.sql`. */
const OBJECTIVE_ID_SHAPE = /^obj-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The rights vocabulary, mirroring the `lesson_metadata.provenance` CHECK
 * constraint in `migrations/0003_curriculum_and_trust_closure.sql`. A value
 * outside this set is rejected by SQLite at insert time; checking it here means
 * the failure names the lesson instead of surfacing as a raw constraint error.
 */
const PROVENANCE_VALUES: readonly CurriculumProvenance[] = [
  "gdpt_2018_objective",
  "parent_textbook",
  "original_supplemental",
  "unverified_assumption",
];

/**
 * A choice cited by letter: "Câu a", "câu b:", "nếu em chọn c", "Đáp án c",
 * "phương án b", or "lựa chọn a".
 *
 * The learner's payload renders `label_vi` and never a letter, so any of these
 * is a reference the child cannot follow. Matching is Unicode-aware so it does
 * not read "câus" or swallow a following word, and it is case-insensitive
 * across all Vietnamese option-referencing prefixes.
 */
const CHOICE_LETTER =
  /(?<![\p{L}\p{N}])(?:câu|chọn|đáp\s+án|phương\s+án|lựa\s+chọn)\s*[abcd](?![\p{L}\p{N}])/iu;

/**
 * Every string on a step that is shown to the child, paired with its field name
 * so a finding says which one to fix. The hint fields are read defensively
 * because `validateAuthoringStages()` runs over steps whose schema may already
 * have failed; `stepTexts()` must never throw.
 */
function stepTexts(step: LessonStep): readonly (readonly [string, string])[] {
  const texts: (readonly [string, string])[] = [["explanationVi", step.explanationVi]];
  const content: Partial<Record<string, unknown>> = step.content;
  for (const field of ["hint1_vi", "hint2_vi", "hint3_vi"] as const) {
    const value = content[field];
    if (typeof value === "string") texts.push([field, value]);
  }
  return texts;
}

/**
 * Checks every lesson against the rules the parent import route enforces, PLUS
 * the same rules the seed must uphold so the two cannot diverge.
 *
 * Returns an empty array when the registry is sound. Never throws, so a caller
 * can decide what to do — an operator script fails loudly, a test fixture can
 * assert it is empty.
 *
 * `lessons` defaults to the shipped registry. It is injectable so a test can
 * hand this gate a deliberately broken lesson and prove the gate refuses it;
 * a check that cannot be made to fail proves nothing.
 */
export function validateRegistry(
  catalogue: RegistryCatalogue = {},
  lessons: readonly LessonDefinition[] = LESSONS,
): readonly SeedProblem[] {
  const knownSkills = catalogue.skills ? new Set(catalogue.skills) : null;
  const knownObjectives = catalogue.objectives ? new Set(catalogue.objectives) : null;
  const seenLessons = new Set<string>();
  const problems: SeedProblem[] = [];

  for (const lesson of lessons) {
    const fail = (
      stage: SeedStage,
      message: string,
      severity: SeedProblem["severity"] = "blocking",
    ) => problems.push({ lessonId: lesson.id, stage, message, severity });

    /* Stage 1 — identity and step order. */
    if (seenLessons.has(lesson.id)) fail("identity", "duplicate lesson id in the registry");
    seenLessons.add(lesson.id);

    if (lesson.steps.length === 0) fail("identity", "a lesson needs at least one step");
    if (knownSkills && !knownSkills.has(lesson.skillId)) {
      fail("identity", `skill ${lesson.skillId} is not in the catalogue`);
    }

    /* Stage 2 — reachable from the curriculum graph. */
    // A lesson with no objective is not connected to the curriculum graph at
    // all: it can be taught and graded, but it evidences nothing a Grade 4–5
    // outcome expects, and no coverage report can see it.
    if (!lesson.objectiveId) {
      fail("curriculum", "needs an objectiveId so it is reachable from the curriculum graph");
    } else if (!OBJECTIVE_ID_SHAPE.test(lesson.objectiveId)) {
      fail("curriculum", `objectiveId "${lesson.objectiveId}" is not shaped like obj-<subject>-<slug>`);
    } else if (knownObjectives && !knownObjectives.has(lesson.objectiveId)) {
      fail("curriculum", `objective ${lesson.objectiveId} is not in the curriculum_objectives table`);
    }

    /* Stage 3 — rights: who says this content may be used, and where it came from. */
    // Rights are a claim about where the content came from, and only the family
    // can make it. Leaving the field out is not neutral: `seedLessons()` binds
    // `provenance ?? "original_supplemental"` and `sourceRef ?? null`, so an
    // absent field silently becomes a provenance claim nobody made. The gate
    // refuses it here so the seed path and the authoring CLI cannot diverge.
    if (lesson.provenance === undefined) {
      fail(
        "rights",
        "needs an explicit provenance; absence is stored as original_supplemental, a rights claim the family never made",
      );
    } else if (!PROVENANCE_VALUES.includes(lesson.provenance)) {
      fail(
        "rights",
        `provenance "${lesson.provenance}" is not one of ${PROVENANCE_VALUES.join(" | ")}`,
      );
    }

    if (!lesson.sourceRef || lesson.sourceRef.trim() === "") {
      fail(
        "rights",
        "needs a non-empty sourceRef citing the textbook or noting the content is original; without it the stored source_ref is NULL",
      );
    }

    /* Stages 4, 5, 6 — per step: schema, answer key, pedagogical sequence. */
    const kinds = new Set<string>();
    lesson.steps.forEach((step, index) => {
      if (step.position !== index + 1) {
        fail(
          "identity",
          `step positions must run 1..n with no gap (expected ${index + 1}, got ${step.position})`,
        );
      }
      if (!step.explanationVi || step.explanationVi.trim() === "") {
        fail("pedagogy", `step ${step.position} needs an explanation`);
      }
      kinds.add(step.kind);
      const result = validateExercise(step.content);
      if (!result.ok) {
        fail("schema", `step ${step.position}: ${result.error}`);
      } else {
        try {
          const parsedKey = JSON.parse(step.answerKey) as Record<string, unknown>;
          if (step.content.type === "fraction_visual") {
            if (
              parsedKey.correctNumerator !== step.content.correctNumerator ||
              parsedKey.correctDenominator !== step.content.correctDenominator
            ) {
              fail(
                "answer-key",
                `step ${step.position}: answerKey fraction does not match exercise correctNumerator/correctDenominator`,
              );
            }
          } else {
            const expectedChoiceId = correctChoiceId(step.content);
            if (parsedKey.correctChoiceId !== expectedChoiceId) {
              fail(
                "answer-key",
                `step ${step.position}: answerKey correctChoiceId "${String(parsedKey.correctChoiceId)}" does not match exercise correct choice "${String(expectedChoiceId)}"`,
              );
            }
          }
        } catch {
          fail("answer-key", `step ${step.position}: answerKey is not valid JSON`);
        }
      }
    });

    if (lesson.steps.length > 0 && !kinds.has("transfer")) {
      // Without a transfer step a skill can never be evidenced as TRANSFERRED,
      // so the lesson would quietly promise a mastery it cannot demonstrate.
      fail("pedagogy", "needs at least one transfer step");
    }
  }

  return problems;
}
/**
 * Stages 6–9 — the checks that need no database and no write path, only the
 * lesson object itself.
 *
 * Kept here rather than in `scripts/validate-lessons.mjs` for the same reason
 * the first six are: one owner for the rules, so the authoring CLI and the seed
 * cannot disagree. The CLI adds nothing of its own; it only decides how to
 * report what this returns.
 *
 * The sequence checks (`concept` first, `independent` present, `transfer` last)
 * are asserted here and not in `validateRegistry()` because they constrain the
 * *shape of a lesson* rather than the shape of a row: a lesson may be perfectly
 * storable and still teach nothing.
 */
export function validateAuthoringStages(
  lessons: readonly LessonDefinition[] = LESSONS,
): readonly SeedProblem[] {
  const problems: SeedProblem[] = [];

  for (const lesson of lessons) {
    const fail = (
      stage: SeedStage,
      message: string,
      severity: SeedProblem["severity"] = "blocking",
    ) => problems.push({ lessonId: lesson.id, stage, message, severity });

    /* Stage 6 — pedagogical sequence. */
    const firstKind = lesson.steps[0]?.kind;
    const lastKind = lesson.steps[lesson.steps.length - 1]?.kind;

    if (firstKind !== "concept") {
      fail("pedagogy", `first step must be "concept", got "${String(firstKind)}"`);
    }
    if (!lesson.steps.some((step) => step.kind === "independent")) {
      fail("pedagogy", `must contain at least one "independent" step`);
    }
    if (lastKind !== "transfer") {
      fail("pedagogy", `last step must be "transfer", got "${String(lastKind)}"`);
    }

    for (const step of lesson.steps) {
      /* Stage 8 — the text describes the option, it does not letter it. */
      // The learner's payload renders choices without letters and the answer key
      // is withheld, so "Câu b" and "nếu em chọn c" name nothing the child can
      // see: the text is unactionable and, once options are reordered, points at
      // the wrong one. Both an explanation and a hint reach the child (hints via
      // `hintFor()`), so both are checked here and block the gate.
      //
      // The check reads only string fields, so it still runs when the exercise
      // itself is malformed and is reported once, by stage 4, below.
      for (const [field, text] of stepTexts(step)) {
        if (CHOICE_LETTER.test(text)) {
          fail(
            "explanation",
            `step ${step.position}: ${field} must describe the option by its text, not cite a choice letter ("Câu b", "chọn c")`,
          );
        }
      }

      // Every check below reads fields the schema guarantees exist: the hint
      // strings, and the `choices` array `toLearnerExercise()` rebuilds. A step
      // that fails stage 4 is already reported by `validateRegistry()`, so
      // stopping here reports it once instead of throwing a TypeError that
      // would hide every other problem behind a stack trace.
      if (!validateExercise(step.content).ok) continue;

      /* Stage 9 — nothing the learner receives may carry an answer. */
      // The runtime strip, re-checked as a gate. This is the one stage that can
      // catch a payload whose type says "no answer here" while the object still
      // carries one — the shapes that import JSON can produce.
      if (leaksAnswer(toLearnerExercise(step.content))) {
        fail("answer-leak", `step ${step.position}: toLearnerExercise() leaked an answer-bearing field`);
      }

      if (step.content.type !== "multiple_choice") continue;

      /* Stage 7 — three progressive hints that actually differ. */
      const hints = [
        step.content.hint1_vi.trim(),
        step.content.hint2_vi.trim(),
        step.content.hint3_vi.trim(),
      ];
      if (new Set(hints).size !== 3) {
        fail("hints", `step ${step.position}: progressive hints (hint1_vi, hint2_vi, hint3_vi) must be distinct`);
      }
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
    const objectiveRows = await db
      .prepare("select id from curriculum_objectives")
      .all<{ id: string }>();
    const problems = [
      ...validateRegistry({
        skills: (skillRows.results ?? []).map((row) => row.id),
        objectives: (objectiveRows.results ?? []).map((row) => row.id),
      }),
      ...validateAuthoringStages(),
    ].filter((problem) => problem.severity === "blocking");
    if (problems.length > 0) {
      const rendered = problems
        .map((p) => `  - ${p.lessonId} [${p.stage}]: ${p.message}`)
        .join("\n");
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
      await db.batch([
        db
          .prepare(
            `insert or ignore into lesson_versions
               (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
             values (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            lesson.id,
            existing.version,
            lesson.titleVi,
            lesson.titleEn,
            lesson.objectiveVi,
            lesson.objectiveEn,
            existing.updated_at || now,
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
            grade_from, grade_to, version, ownership_type, owner_parent_id, purpose, source_lesson_id, source_version, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'catalogue', null, 'official', null, null, ?, ?)
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
           ownership_type = 'catalogue',
           owner_parent_id = null,
           purpose = 'official',
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
    db
      .prepare(
        `insert into lesson_versions
           (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
         values (?, ?, ?, ?, ?, ?, ?)
         on conflict(lesson_id, version) do update set
           title_vi = excluded.title_vi,
           title_en = excluded.title_en,
           objective_vi = excluded.objective_vi,
           objective_en = excluded.objective_en`,
      )
      .bind(
        lesson.id,
        version,
        lesson.titleVi,
        lesson.titleEn,
        lesson.objectiveVi,
        lesson.objectiveEn,
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
