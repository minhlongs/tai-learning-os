import { describe, expect, it } from "vitest";

import { correctChoiceId, gradeSubmission } from "../../src/shared/schemas/answer";
import type { ExerciseSpec } from "../../src/shared/schemas/exercise";
import { validateExercise } from "../../src/shared/schemas/exercise";

/**
 * Answer grading is the app's single source of correctness. Every test below
 * pins one rule that the learner-facing experience depends on, and the
 * assisted-answer rule is the one that keeps the competency ladder honest.
 */

const fractionExercise = {
  type: "fraction_visual",
  question_vi: "Hình được chia thành mấy phần bằng nhau?",
  question_en: "How many equal parts?",
  allowedDenominators: [2, 4, 8],
  maxParts: 8,
  correctDenominator: 2,
  correctNumerator: 1,
  bar: { parts: 4, highlighted: 2 },
} as const;

const vocabExercise = {
  type: "vocab_match",
  question_vi: "Chọn từ đúng cho tranh",
  word: "apple",
  image: "apple",
  choices: [
    { id: "a", label_en: "apple", label_vi: "quả táo", correct: true },
    { id: "b", label_en: "book", label_vi: "quyển sách", correct: false },
  ],
  sentencePrompt_vi: "Viết một câu có chữ apple",
  sentenceAcceptedWords: ["apple", "apples"],
} as const;

const multipleChoiceExercise = {
  type: "multiple_choice",
  question_vi: "Phân số nào bằng 1/2?",
  choices: [
    { id: "half", label_vi: "1/2", correct: true },
    { id: "third", label_vi: "1/3", correct: false },
  ],
  hint1_vi: "Nhìn vào mẫu số.",
  hint2_vi: "Hãy so sánh giá trị.",
  hint3_vi: "Chia cả tử và mẫu cho cùng một số.",
} as const;

function parse<T>(raw: T): ExerciseSpec {
  const result = validateExercise(raw);
  if (!result.ok) throw new Error(`fixture invalid: ${result.error}`);
  return result.value;
}

const fraction = parse(fractionExercise);
const vocab = parse(vocabExercise);
const multipleChoice = parse(multipleChoiceExercise);

describe("gradeSubmission — choice answers", () => {
  it("accepts the correct choice", () => {
    const grade = gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 0);
    expect(grade.outcome).toBe("correct");
    // Parent-facing message stays Vietnamese and never empty. NOTE: the `Grade`
    // union declares `message_vi` but every implementation branch returns
    // `messageVi`, so the declared field is undefined at runtime. See report.
    expect(grade.messageVi.length).toBeGreaterThan(0);
  });

  it("rejects a wrong choice with outcome incorrect", () => {
    const grade = gradeSubmission(multipleChoice, { kind: "choice", choiceId: "third" }, 0);
    expect(grade.outcome).toBe("incorrect");
  });

  it("reports correctChoiceId for choice-based exercises", () => {
    expect(correctChoiceId(multipleChoice)).toBe("half");
  });
});

describe("gradeSubmission — fraction value equality", () => {
  it("accepts 1/2", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 1, denominator: 2 }, 0).outcome).toBe("correct");
  });

  it("accepts 2/4 as the same value, not the same digits", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 2, denominator: 4 }, 0).outcome).toBe("correct");
  });

  it("accepts 4/8 as the same value", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 4, denominator: 8 }, 0).outcome).toBe("correct");
  });

  it("rejects 1/3", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 1, denominator: 3 }, 0).outcome).toBe("incorrect");
  });

  it("rejects a non-integer numerator", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 1.5, denominator: 2 }, 0).outcome).toBe("incorrect");
  });

  it("rejects a denominator beyond the bar's maxParts", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 1, denominator: 16 }, 0).outcome).toBe("incorrect");
  });

  it("rejects a non-fraction submission kind", () => {
    expect(gradeSubmission(fraction, { kind: "choice", choiceId: "a" }, 0).outcome).toBe("incorrect");
  });
});

describe("gradeSubmission — vocabulary sentences", () => {
  it("accepts a sentence containing an accepted word", () => {
    const grade = gradeSubmission(vocab, { kind: "text", text: "I eat an apple every day." }, 0);
    expect(grade.outcome).toBe("correct");
  });

  it("accepts a sentence containing the plural accepted word", () => {
    expect(gradeSubmission(vocab, { kind: "text", text: "These apples are red" }, 0).outcome).toBe("correct");
  });

  it("rejects text that does not contain an accepted word", () => {
    expect(gradeSubmission(vocab, { kind: "text", text: "I read a book today." }, 0).outcome).toBe("incorrect");
  });

  it("rejects text that is too short to be a sentence", () => {
    expect(gradeSubmission(vocab, { kind: "text", text: "an" }, 0).outcome).toBe("incorrect");
  });

  it("rejects whitespace-only text", () => {
    expect(gradeSubmission(vocab, { kind: "text", text: "     " }, 0).outcome).toBe("incorrect");
  });

  it("accepts a correct vocabulary choice", () => {
    expect(gradeSubmission(vocab, { kind: "choice", choiceId: "a" }, 0).outcome).toBe("correct");
  });

  it("rejects an incorrect vocabulary choice", () => {
    expect(gradeSubmission(vocab, { kind: "choice", choiceId: "b" }, 0).outcome).toBe("incorrect");
  });

  it("rejects a non-text submission when a sentence is expected", () => {
    expect(gradeSubmission(vocab, { kind: "fraction", numerator: 1, denominator: 2 }, 0).outcome).toBe("incorrect");
  });
});

describe("gradeSubmission — assisted answers are never 'correct'", () => {
  // The anti-cheat rule: help level 3+ means the learner was shown a worked
  // example, so a right answer can only ever be recorded as partial.
  it("downgrades a correct answer at help level 3 to partial", () => {
    const grade = gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 3);
    expect(grade.outcome).toBe("partial");
    expect(grade.outcome).not.toBe("correct");
  });

  it("downgrades a correct answer at help level 4 to partial", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 4).outcome).toBe("partial");
  });

  it("downgrades an assisted correct fraction to partial", () => {
    expect(gradeSubmission(fraction, { kind: "fraction", numerator: 2, denominator: 4 }, 4).outcome).toBe("partial");
  });

  it("downgrades an assisted correct vocabulary sentence to partial", () => {
    expect(gradeSubmission(vocab, { kind: "text", text: "I like the apple" }, 3).outcome).toBe("partial");
  });

  it("keeps help level 2 as a small hint that still counts as correct", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 2).outcome).toBe("correct");
  });

  it("still reports incorrect for a wrong answer regardless of help level", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "third" }, 4).outcome).toBe("incorrect");
  });
});

describe("clampHelp", () => {
  it("clamps negative values to 0", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, -5).outcome).toBe("correct");
  });

  it("clamps values above 4 down to 4", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 99).outcome).toBe("partial");
  });

  it("treats NaN as no help", () => {
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, Number.NaN).outcome).toBe("correct");
  });

  it("treats Infinity as no help rather than maximum help", () => {
    // clampHelp rejects non-finite input first, so an infinite help level is
    // read as "no help recorded" — the direction that never invents assistance.
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, Number.POSITIVE_INFINITY).outcome).toBe("correct");
  });

  it("truncates fractional help levels", () => {
    // 2.9 truncates to 2, which is still a small hint.
    expect(gradeSubmission(multipleChoice, { kind: "choice", choiceId: "half" }, 2.9).outcome).toBe("correct");
  });
});

describe("correctChoiceId", () => {
  it("returns the correct id for multiple_choice", () => {
    expect(correctChoiceId(multipleChoice)).toBe("half");
  });

  it("returns the numerator string for fraction_visual", () => {
    expect(correctChoiceId(fraction)).toBe("1");
  });
});
