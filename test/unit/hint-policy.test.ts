import { describe, expect, it } from "vitest";

import { clampHelp, hintFor } from "../../src/shared/schemas/answer";
import type { ExerciseSpec } from "../../src/shared/schemas/exercise";
import { validateExercise } from "../../src/shared/schemas/exercise";

/**
 * Hint policy is the app's anti-cheat surface. Higher levels must approach the
 * answer without ever reducing it to "click this one", and level 0 must be a
 * true absence of help rather than a nudge.
 */

const multipleChoiceExercise = {
  type: "multiple_choice",
  question_vi: "Phân số nào bằng 1/2?",
  choices: [
    { id: "half", label_vi: "Một phần hai", correct: true },
    { id: "third", label_vi: "Một phần ba", correct: false },
  ],
  hint1_vi: "Hãy nhìn vào mẫu số trước.",
  hint2_vi: "So sánh giá trị của hai phân số.",
  hint3_vi: "Quy đồng mẫu số rồi so sánh tử số.",
} as const;

const readingExercise = {
  type: "reading_comprehension",
  passage_vi: "Bạn Minh có một con mèo. Con mèo thích ngủ ở ghế.",
  passageTitle_vi: "Con mèo của Minh",
  question_vi: "Con mèo thích ngủ ở đâu?",
  choices: [
    { id: "chair", label_vi: "Ở ghế", correct: true },
    { id: "bed", label_vi: "Ở giường", correct: false },
  ],
  evidenceSentence_vi: "Con mèo thích ngủ ở ghế.",
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
  sentenceAcceptedWords: ["apple"],
} as const;

const fractionExercise = {
  type: "fraction_visual",
  question_vi: "Phần được tô màu là phân số nào?",
  question_en: "Which fraction is highlighted?",
  allowedDenominators: [2, 4],
  maxParts: 4,
  correctDenominator: 2,
  correctNumerator: 1,
  bar: { parts: 4, highlighted: 2 },
} as const;

function parse(raw: unknown): ExerciseSpec {
  const result = validateExercise(raw);
  if (!result.ok) throw new Error(`fixture invalid: ${result.error}`);
  return result.value;
}

const multipleChoice = parse(multipleChoiceExercise);
const reading = parse(readingExercise);
const vocab = parse(vocabExercise);
const fraction = parse(fractionExercise);

describe("hintFor — level 0 is a real absence of help", () => {
  it("returns null at level 0 for every exercise type", () => {
    expect(hintFor(multipleChoice, 0)).toBeNull();
    expect(hintFor(reading, 0)).toBeNull();
    expect(hintFor(vocab, 0)).toBeNull();
    expect(hintFor(fraction, 0)).toBeNull();
  });

  it("returns null for a negative level, not a hint", () => {
    expect(hintFor(multipleChoice, -1)).toBeNull();
  });
});

describe("hintFor — progressive disclosure", () => {
  it("returns non-null for levels 1..4", () => {
    for (const level of [1, 2, 3, 4]) {
      expect(hintFor(multipleChoice, level)).not.toBeNull();
    }
  });

  it("reads the hint text from the exercise, not a hardcoded string", () => {
    expect(hintFor(multipleChoice, 1)).toBe(multipleChoiceExercise.hint1_vi);
    expect(hintFor(multipleChoice, 2)).toBe(multipleChoiceExercise.hint2_vi);
    expect(hintFor(multipleChoice, 3)).toBe(multipleChoiceExercise.hint3_vi);
  });

  it("returns non-null progressive hints for every exercise type", () => {
    for (const exercise of [reading, vocab, fraction]) {
      for (const level of [1, 2, 3, 4]) {
        const hint = hintFor(exercise, level);
        expect(hint, `${exercise.type} level ${level}`).not.toBeNull();
        expect(hint!.length).toBeGreaterThan(0);
      }
    }
  });

  it("clamps levels above 4 to the level-4 hint rather than returning null", () => {
    expect(hintFor(multipleChoice, 4)).toBe(hintFor(multipleChoice, 99));
  });
});

describe("hintFor — the highest hint never hands over the answer", () => {
  it("for multiple_choice, level 4 is not simply the correct choice text", () => {
    const hint = hintFor(multipleChoice, 4)!;
    const correct = multipleChoiceExercise.choices.find((c) => c.correct)!;
    // Not the id, and not the label.
    expect(hint).not.toBe(correct.id);
    expect(hint).not.toBe(correct.label_vi);
    // Not even a case-insensitive containment of the label.
    expect(hint.toLowerCase()).not.toContain(correct.label_vi.toLowerCase());
    expect(hint.toLowerCase()).not.toContain(correct.id.toLowerCase());
  });

  it("for reading comprehension, level 4 does not name the correct choice", () => {
    const hint = hintFor(reading, 4)!;
    const correct = readingExercise.choices.find((c) => c.correct)!;
    expect(hint.toLowerCase()).not.toContain(correct.id.toLowerCase());
    expect(hint.toLowerCase()).not.toContain(correct.label_vi.toLowerCase());
  });

  it("for vocab_match, level 4 promotes the word to reuse rather than a choice id", () => {
    const hint = hintFor(vocab, 4)!;
    const correct = vocabExercise.choices.find((c) => c.correct)!;
    // The top hint tells the learner which word to use in a sentence; it must
    // not resolve the picture-to-word choice into "pick option <id>".
    expect(hint).toContain(vocabExercise.word);
    expect(hint).not.toBe(correct.id);
  });

  it("for fraction_visual, level 4 withholds the numerator", () => {
    const hint = hintFor(fraction, 4)!;
    // The denominator is disclosed (it is the simplest-form denominator), but
    // the numerator the learner must produce is not simply stated.
    expect(hint).toContain(String(fractionExercise.correctDenominator));
    expect(hint).not.toBe(String(fractionExercise.correctNumerator));
  });
});

describe("clampHelp", () => {
  it("keeps values inside 0..4 unchanged", () => {
    for (const level of [0, 1, 2, 3, 4]) {
      expect(clampHelp(level)).toBe(level);
    }
  });

  it("clamps below 0 to 0", () => {
    expect(clampHelp(-1)).toBe(0);
    expect(clampHelp(-1000)).toBe(0);
  });

  it("clamps above 4 to 4", () => {
    expect(clampHelp(5)).toBe(4);
    expect(clampHelp(Number.MAX_SAFE_INTEGER)).toBe(4);
  });

  it("returns 0 for NaN", () => {
    expect(clampHelp(Number.NaN)).toBe(0);
  });

  it("returns 0 for positive Infinity", () => {
    expect(clampHelp(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("returns 0 for negative Infinity", () => {
    expect(clampHelp(Number.NEGATIVE_INFINITY)).toBe(0);
  });

  it("truncates a fractional level", () => {
    expect(clampHelp(2.9)).toBe(2);
    expect(clampHelp(3.2)).toBe(3);
  });
});
