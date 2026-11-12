import { describe, expect, it } from "vitest";

import { LESSONS } from "../../src/shared/content/index";
import type {
  CurriculumProvenance,
  LessonDefinition,
  LessonStep,
} from "../../src/shared/content/types";
import type { ExerciseSpec } from "../../src/shared/schemas/exercise";
import {
  VALIDATION_STAGES,
  validateAuthoringStages,
  validateRegistry,
} from "../integration/lesson-seed";
import type { SeedProblem } from "../integration/lesson-seed";

/**
 * The content gate must be proven able to refuse, not merely seen to accept.
 *
 * `npm run validate:lessons` prints a green line per stage, and a green line
 * that no input can turn red is decoration. So every stage below is driven with
 * a lesson that breaks exactly that stage and nothing else, and the assertion is
 * that the named stage — and only it — reports the problem. The final test is
 * the mirror image: the 50 shipped lessons must produce zero problems, so a
 * gate that has been narrowed into over-rejection fails here too.
 *
 * These are pure functions over lesson objects; they never touch D1, which is
 * why this file belongs in the unit scope even though the rules live in the
 * integration module shared with the seed.
 */

const ALL_STAGES = VALIDATION_STAGES.map((stage) => stage.key);

/** A multiple-choice step that satisfies every stage on its own. */
function choiceStep(
  position: number,
  kind: LessonStep["kind"],
  overrides: Partial<LessonStep> = {},
): LessonStep {
  return {
    position,
    kind,
    content: {
      type: "multiple_choice",
      question_vi: `Câu hỏi số ${position}.`,
      choices: [
        { id: "a", label_vi: "Lựa chọn sai thứ nhất.", correct: false },
        { id: "b", label_vi: "Lựa chọn đúng.", correct: true },
        { id: "c", label_vi: "Lựa chọn sai thứ hai.", correct: false },
      ],
      hint1_vi: `Gợi ý mức một cho bước ${position}.`,
      hint2_vi: `Gợi ý mức hai cho bước ${position}.`,
      hint3_vi: `Gợi ý mức ba cho bước ${position}.`,
    },
    answerKey: JSON.stringify({ correctChoiceId: "b" }),
    explanationVi: `Vì lựa chọn đúng nêu đủ hai chiều, nên nó khớp với dữ kiện ở bước ${position}.`,
    ...overrides,
  };
}

/** A lesson that passes both gates; each test breaks it one field at a time. */
function soundLesson(overrides: Partial<LessonDefinition> = {}): LessonDefinition {
  return {
    id: "gate-fixture-lesson",
    subjectId: "math",
    skillId: "math-fixture-skill",
    titleVi: "Bài kiểm tra cổng nội dung",
    titleEn: "Content gate fixture",
    objectiveVi: "Mục tiêu kiểm tra cổng nội dung.",
    objectiveEn: "Content gate objective.",
    gradeFrom: 4,
    gradeTo: 4,
    objectiveId: "obj-math-fixture-objective",
    provenance: "original_supplemental",
    sourceRef: "Biên soạn riêng cho bài kiểm tra cổng nội dung.",
    steps: [
      choiceStep(1, "concept"),
      choiceStep(2, "independent"),
      choiceStep(3, "transfer"),
    ],
    ...overrides,
  };
}

/** Both gates over one lesson, concatenated in the order the CLI reports them. */
function problemsFor(lesson: LessonDefinition, catalogue: Parameters<typeof validateRegistry>[0] = {}) {
  return [...validateRegistry(catalogue, [lesson]), ...validateAuthoringStages([lesson])];
}

function stagesOf(problems: readonly SeedProblem[]): string[] {
  return [...new Set(problems.map((problem) => problem.stage))].sort();
}

describe("content gate — every stage can refuse", () => {
  it("accepts the fixture lesson, so a later failure is the mutation and not the fixture", () => {
    expect(problemsFor(soundLesson())).toEqual([]);
  });

  it("stage 1 identity — refuses a duplicate lesson id", () => {
    const lesson = soundLesson();
    const problems = [...validateRegistry({}, [lesson, lesson]), ...validateAuthoringStages([lesson])];

    expect(stagesOf(problems)).toEqual(["identity"]);
    expect(problems[0]?.message).toContain("duplicate lesson id");
  });

  it("stage 1 identity — refuses step positions that do not run 1..n with no gap", () => {
    const problems = problemsFor(
      soundLesson({ steps: [choiceStep(1, "concept"), choiceStep(3, "independent"), choiceStep(4, "transfer")] }),
    );

    expect(stagesOf(problems)).toEqual(["identity"]);
    expect(problems[0]?.message).toContain("step positions must run 1..n");
  });

  it("stage 2 curriculum — refuses a lesson with no objectiveId", () => {
    const problems = problemsFor(soundLesson({ objectiveId: undefined }));

    expect(stagesOf(problems)).toEqual(["curriculum"]);
    expect(problems[0]?.message).toContain("needs an objectiveId");
  });

  it("stage 2 curriculum — refuses an objectiveId that is not shaped obj-<subject>-<slug>", () => {
    const problems = problemsFor(soundLesson({ objectiveId: "math-area" }));

    expect(stagesOf(problems)).toEqual(["curriculum"]);
    expect(problems[0]?.message).toContain("is not shaped like obj-");
  });

  it("stage 2 curriculum — refuses an objectiveId absent from the catalogue it is checked against", () => {
    const problems = problemsFor(soundLesson(), { objectives: ["obj-math-something-else"] });

    expect(stagesOf(problems)).toEqual(["curriculum"]);
    expect(problems[0]?.message).toContain("is not in the curriculum_objectives table");
  });

  it("stage 3 rights — refuses a lesson that states no provenance at all", () => {
    const problems = problemsFor(soundLesson({ provenance: undefined }));

    expect(stagesOf(problems)).toEqual(["rights"]);
    expect(problems[0]?.message).toContain("needs an explicit provenance");
  });

  it("stage 3 rights — refuses a provenance outside the stored vocabulary", () => {
    const problems = problemsFor(soundLesson({ provenance: "family_bought_it" as CurriculumProvenance }));

    expect(stagesOf(problems)).toEqual(["rights"]);
    expect(problems[0]?.message).toContain("is not one of");
  });

  it("stage 3 rights — refuses a sourceRef that is present but blank", () => {
    const problems = problemsFor(soundLesson({ sourceRef: "   " }));

    expect(stagesOf(problems)).toEqual(["rights"]);
    expect(problems[0]?.message).toContain("needs a non-empty sourceRef");
  });

  it("stage 4 schema — refuses a step whose content fails validateExercise()", () => {
    const broken = choiceStep(1, "concept");
    broken.content = { ...broken.content, hint2_vi: "" } as ExerciseSpec;
    const problems = problemsFor(
      soundLesson({ steps: [broken, choiceStep(2, "independent"), choiceStep(3, "transfer")] }),
    );

    expect(stagesOf(problems)).toContain("schema");
    expect(problems.find((problem) => problem.stage === "schema")?.message).toContain("hint2_vi required");
  });

  it("stage 5 answer-key — refuses an answerKey naming a choice that is not the correct one", () => {
    const problems = problemsFor(
      soundLesson({
        steps: [
          choiceStep(1, "concept", { answerKey: JSON.stringify({ correctChoiceId: "a" }) }),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["answer-key"]);
    expect(problems[0]?.message).toContain('does not match exercise correct choice "b"');
  });

  it("stage 5 answer-key — refuses an answerKey that is not valid JSON", () => {
    const problems = problemsFor(
      soundLesson({
        steps: [choiceStep(1, "concept", { answerKey: "{not json" }), choiceStep(2, "independent"), choiceStep(3, "transfer")],
      }),
    );

    expect(stagesOf(problems)).toEqual(["answer-key"]);
    expect(problems[0]?.message).toContain("is not valid JSON");
  });

  it("stage 6 pedagogy — refuses a lesson whose first step is not a concept", () => {
    const problems = problemsFor(
      soundLesson({ steps: [choiceStep(1, "guided"), choiceStep(2, "independent"), choiceStep(3, "transfer")] }),
    );

    expect(stagesOf(problems)).toEqual(["pedagogy"]);
    expect(problems[0]?.message).toContain('first step must be "concept"');
  });

  it("stage 6 pedagogy — refuses a lesson with no independent step", () => {
    const problems = problemsFor(
      soundLesson({ steps: [choiceStep(1, "concept"), choiceStep(2, "guided"), choiceStep(3, "transfer")] }),
    );

    expect(stagesOf(problems)).toEqual(["pedagogy"]);
    expect(problems[0]?.message).toContain('must contain at least one "independent" step');
  });

  it("stage 6 pedagogy — refuses a lesson whose last step is not a transfer", () => {
    // The lesson must *contain* a transfer step, or `validateRegistry()` fires
    // its own "needs at least one transfer step" first and this test would be
    // asserting the wrong check. Here the transfer exists but sits third, so
    // only the ordering rule can object.
    const problems = problemsFor(
      soundLesson({
        steps: [
          choiceStep(1, "concept"),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
          choiceStep(4, "guided"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["pedagogy"]);
    expect(problems[0]?.message).toContain('last step must be "transfer"');
  });

  it("stage 7 hints — refuses hints that repeat the same text", () => {
    const repeated = choiceStep(1, "concept");
    repeated.content = { ...repeated.content, hint2_vi: repeated.content.type === "multiple_choice" ? repeated.content.hint1_vi : "" } as ExerciseSpec;
    const problems = problemsFor(
      soundLesson({ steps: [repeated, choiceStep(2, "independent"), choiceStep(3, "transfer")] }),
    );

    expect(stagesOf(problems)).toEqual(["hints"]);
    expect(problems[0]?.message).toContain("must be distinct");
  });

  it("stage 8 explanation — refuses an explanation that cites a choice letter", () => {
    const problems = problemsFor(
      soundLesson({
        steps: [
          choiceStep(1, "concept", { explanationVi: "Câu a là đáp án đúng." }),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["explanation"]);
    expect(problems[0]?.message).toContain("not cite a choice letter");
  });

  it("stage 8 explanation — refuses a hint that cites a choice letter", () => {
    // Hints reach the child through `hintFor()`, so a letter there is the same
    // defect as one in the explanation. Before this rule the gate only checked
    // `explanationVi` and the shipped hints were never examined.
    const lettered = choiceStep(1, "concept");
    lettered.content = { ...lettered.content, hint2_vi: "Câu b kể một việc nhưng không nói ai làm." } as ExerciseSpec;

    const problems = problemsFor(
      soundLesson({ steps: [lettered, choiceStep(2, "independent"), choiceStep(3, "transfer")] }),
    );

    expect(stagesOf(problems)).toEqual(["explanation"]);
    expect(problems[0]?.message).toContain("hint2_vi");
    expect(problems[0]?.message).toContain("not cite a choice letter");
  });

  it("stage 8 explanation — refuses a lowercase citation with no 'Câu' prefix", () => {
    // "nếu em chọn c" is shipped in `vie-find-evidence` step 6. The original
    // `/Câu [abcd]/` rule missed it entirely, which is why the rule is written
    // to match `chọn` as well.
    const problems = problemsFor(
      soundLesson({
        steps: [
          choiceStep(1, "concept", { explanationVi: "Nó không nói trực tiếp; nếu em chọn c, em cần nối thêm một bước." }),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["explanation"]);
    expect(problems[0]?.message).toContain("not cite a choice letter");
  });

  it("stage 8 explanation — leaves a word that merely starts with a letter alone", () => {
    // The rule must not read "câu" inside a longer Vietnamese word, or it would
    // reject ordinary prose and the check would be turned off.
    const problems = problemsFor(
      soundLesson({
        steps: [
          choiceStep(1, "concept", { explanationVi: "Cấu trúc này đúng vì cả hai về đều khớp với dữ kiện đã cho." }),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(problems).toEqual([]);
  });

  it("stage 8 explanation — reports a letter citation as advisory, not blocking", () => {
    // Severity is what decides whether the CLI exits 1. A letter cannot leak an
    // answer, so it must never be able to block the seed of sound lessons.
    const problems = validateAuthoringStages([
      soundLesson({
        steps: [
          choiceStep(1, "concept", { explanationVi: "Câu a là đáp án đúng." }),
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    ]);

    expect(problems.map((problem) => problem.severity)).toEqual(["advisory"]);
  });

  it("stage 9 answer-leak — refuses a payload whose extra key survives toLearnerExercise()", () => {
    // `validateExercise()` checks the fields each shape requires; it does not
    // forbid a key the shape never declared. `toLearnerExercise()` destructures
    // the known answer fields and spreads the rest, so a stray `correct` on a
    // fraction_visual rides along into the payload the child receives. This is
    // the JSON-import path: untrusted content in, validated, then stored.
    const leaky = {
      type: "fraction_visual",
      question_vi: "Phần nào được tô màu?",
      question_en: "Which fraction is shaded?",
      allowedDenominators: [2, 4],
      maxParts: 4,
      correctDenominator: 2,
      correctNumerator: 1,
      bar: { parts: 2, highlighted: 1 },
      correct: true,
    } as unknown as ExerciseSpec;

    const problems = problemsFor(
      soundLesson({
        steps: [
          { position: 1, kind: "concept", content: leaky, answerKey: JSON.stringify({ correctNumerator: 1, correctDenominator: 2 }), explanationVi: "Một nửa thanh được tô màu." },
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["answer-leak"]);
    expect(problems[0]?.message).toContain("leaked an answer-bearing field");
  });

  it("reports a malformed exercise once, by stage 4, instead of crashing the run", () => {
    // Before the ordering fix, stage 7 read `hint1_vi.trim()` on a payload whose
    // schema had already failed, and the TypeError took every other problem
    // down with it — a broken lesson would print a stack trace, not a finding.
    const broken = {
      type: "multiple_choice",
      question_vi: "Câu hỏi thiếu gợi ý.",
      choices: [{ id: "a", label_vi: "Sai.", correct: false }, { id: "b", label_vi: "Đúng.", correct: true }],
    } as unknown as ExerciseSpec;

    const problems = problemsFor(
      soundLesson({
        steps: [
          { position: 1, kind: "concept", content: broken, answerKey: JSON.stringify({ correctChoiceId: "b" }), explanationVi: "Vì lựa chọn đúng khớp với dữ kiện." },
          choiceStep(2, "independent"),
          choiceStep(3, "transfer"),
        ],
      }),
    );

    expect(stagesOf(problems)).toEqual(["schema"]);
  });

  it("names every stage it claims to run", () => {
    // `VALIDATION_STAGES` is what the CLI prints and what `report()` groups by.
    // A stage the rules emit but the list omits would be dropped from the report
    // entirely — findings produced and never shown — so the list is pinned here.
    expect(ALL_STAGES).toEqual([
      "identity",
      "curriculum",
      "rights",
      "schema",
      "answer-key",
      "pedagogy",
      "hints",
      "explanation",
      "answer-leak",
    ]);
  });

  it("classifies integrity defects as blocking and quality defects as advisory", () => {
    // The CLI's exit code is driven by severity alone. If a rights or schema or
    // answer-leak finding ever became advisory, the gate would print it and
    // still exit 0 — a check that reports but never refuses. This pins the
    // split at its source so that cannot happen by editing a default.
    const cases: readonly (readonly [string, LessonDefinition])[] = [
      ["rights", soundLesson({ provenance: undefined })],
      ["schema", soundLesson({ steps: [{ ...choiceStep(1, "concept"), content: {} as ExerciseSpec }, choiceStep(2, "independent"), choiceStep(3, "transfer")] })],
      ["answer-key", soundLesson({ steps: [choiceStep(1, "concept", { answerKey: JSON.stringify({ correctChoiceId: "a" }) }), choiceStep(2, "independent"), choiceStep(3, "transfer")] })],
      ["explanation", soundLesson({ steps: [choiceStep(1, "concept", { explanationVi: "Câu a là đáp án." }), choiceStep(2, "independent"), choiceStep(3, "transfer")] })],
    ];

    for (const [stage, lesson] of cases) {
      const found = problemsFor(lesson).find((problem) => problem.stage === stage);
      expect(found, `expected a ${stage} finding`).toBeDefined();
      const expected = stage === "explanation" ? "advisory" : "blocking";
      expect(found?.severity, `${stage} severity`).toBe(expected);
    }
  });
});

describe("content gate — the shipped registry passes", () => {
  it("reports zero blocking problems for the 50 shipped lessons through both gates", () => {
    expect(LESSONS.length).toBe(50);
    expect(validateRegistry()).toEqual([]);
    expect(validateAuthoringStages().filter((problem) => problem.severity === "blocking")).toEqual([]);
  });

  it("reports zero problems for the real catalogue the seed passes", () => {
    const skills = LESSONS.map((lesson) => lesson.skillId);
    const objectives = LESSONS.map((lesson) => lesson.objectiveId).filter(
      (objectiveId): objectiveId is string => objectiveId !== undefined,
    );

    expect(validateRegistry({ skills, objectives })).toEqual([]);
  });

  it("carries a measured advisory residue, so the gate reports what it cannot yet refuse", () => {
    // The shipped content has learner-facing strings that cite a choice by
    // letter — text the child cannot follow, because the exercise body renders
    // `label_vi` and never a letter. Editing the 50 seeded lessons is out of
    // scope for this run, so the gate reports the residue instead of pretending
    // it is clean, and this assertion pins the exact measured set. If content is
    // fixed, this test fails and the residue shrinks; if a new lesson adds one,
    // it fails and the residue grows. Either way the number is a fact, not a
    // hope that nothing is wrong.
    const advisory = validateAuthoringStages().filter(
      (problem) => problem.severity === "advisory",
    );

    expect(advisory).toHaveLength(10);
    expect(advisory.every((problem) => problem.stage === "explanation")).toBe(true);
    expect(new Set(advisory.map((problem) => problem.lessonId))).toEqual(
      new Set(["vie-sentence-clarity", "vie-find-evidence"]),
    );
    expect(advisory.filter((problem) => problem.lessonId === "vie-sentence-clarity")).toHaveLength(6);
    expect(advisory.filter((problem) => problem.lessonId === "vie-find-evidence")).toHaveLength(4);
  });
});
