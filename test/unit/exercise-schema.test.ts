import { describe, expect, it } from "vitest";

import {
  validateAnswerKeyForExercise,
  validateCanonicalLessonStep,
  validateCanonicalStepSequence,
  validateExercise,
} from "../../src/shared/schemas/exercise";

/**
 * The validator is the gate for untrusted content (JSON import), so it must
 * REJECT on anything unrecognised rather than coerce. These tests pin the
 * rejection side; the accept side is pinned by the fixtures used elsewhere.
 */

const validMultipleChoice = {
  type: "multiple_choice",
  question_vi: "Phân số nào bằng 1/2?",
  choices: [
    { id: "half", label_vi: "Một phần hai", correct: true },
    { id: "third", label_vi: "Một phần ba", correct: false },
  ],
  hint1_vi: "Hãy nhìn vào mẫu số.",
  hint2_vi: "So sánh giá trị.",
  hint3_vi: "Quy đồng mẫu số.",
};

describe("validateExercise", () => {
  it("accepts a well-formed multiple_choice payload", () => {
    const result = validateExercise(validMultipleChoice);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe("multiple_choice");
  });

  it("returns the parsed value, not just a boolean", () => {
    const result = validateExercise(validMultipleChoice);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.choices).toHaveLength(2);
  });

  it("accepts a fraction_visual payload", () => {
    const result = validateExercise({
      type: "fraction_visual",
      question_vi: "Phần được tô là phân số nào?",
      question_en: "Which fraction is highlighted?",
      allowedDenominators: [2, 4],
      maxParts: 4,
      correctDenominator: 2,
      correctNumerator: 1,
      bar: { parts: 4, highlighted: 2 },
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a vocab_match payload", () => {
    const result = validateExercise({
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
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a reading_comprehension payload", () => {
    const result = validateExercise({
      type: "reading_comprehension",
      passage_vi: "Bạn Minh có một con mèo. Con mèo thích ngủ ở ghế.",
      passageTitle_vi: "Con mèo của Minh",
      question_vi: "Con mèo thích ngủ ở đâu?",
      choices: [
        { id: "chair", label_vi: "Ở ghế", correct: true },
        { id: "bed", label_vi: "Ở giường", correct: false },
      ],
      evidenceSentence_vi: "Con mèo thích ngủ ở ghế.",
    });
    expect(result.ok).toBe(true);
  });

  it("reports a reason on rejection", () => {
    const result = validateExercise({ ...validMultipleChoice, type: "unknown_type" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe("validateExercise — invalid answer keys", () => {
  it("rejects zero choices marked correct", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      choices: [
        { id: "half", label_vi: "Một phần hai", correct: false },
        { id: "third", label_vi: "Một phần ba", correct: false },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects two choices marked correct", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      choices: [
        { id: "half", label_vi: "Một phần hai", correct: true },
        { id: "twoFourths", label_vi: "Hai phần tư", correct: true },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a single-choice exercise", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      choices: [{ id: "half", label_vi: "Một phần hai", correct: true }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty choices array", () => {
    const result = validateExercise({ ...validMultipleChoice, choices: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a fraction answer key whose denominator is out of range", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      type: "fraction_visual",
      maxParts: 4,
      correctDenominator: 16,
      correctNumerator: 4,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a fraction bar whose highlighted part count exceeds its parts", () => {
    const result = validateExercise({
      type: "fraction_visual",
      question_vi: "Phần được tô là phân số nào?",
      question_en: "Which fraction is highlighted?",
      allowedDenominators: [2, 4],
      maxParts: 4,
      correctDenominator: 2,
      correctNumerator: 1,
      bar: { parts: 2, highlighted: 4 },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a vocab_match with no accepted words", () => {
    const result = validateExercise({
      type: "vocab_match",
      question_vi: "Chọn từ đúng cho tranh",
      word: "apple",
      image: "apple",
      choices: [
        { id: "a", label_en: "apple", label_vi: "quả táo", correct: true },
        { id: "b", label_en: "book", label_vi: "quyển sách", correct: false },
      ],
      sentencePrompt_vi: "Viết một câu có chữ apple",
      sentenceAcceptedWords: [],
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateExercise — malformed shapes", () => {
  it("rejects an unknown type", () => {
    expect(validateExercise({ ...validMultipleChoice, type: "drag_and_drop" }).ok).toBe(false);
  });

  it("rejects a missing type", () => {
    // Deliberately strip the discriminator to prove import refuses a row that
    // cannot be identified.
    const { type, ...rest } = validMultipleChoice;
    expect(validateExercise(rest).ok).toBe(false);
  });

  it("rejects a missing question", () => {
    expect(validateExercise({ ...validMultipleChoice, question_vi: "" }).ok).toBe(false);
  });

  it("rejects a null payload", () => {
    expect(validateExercise(null).ok).toBe(false);
  });

  it("rejects an array payload", () => {
    expect(validateExercise([validMultipleChoice]).ok).toBe(false);
  });

  it("rejects a string payload", () => {
    expect(validateExercise("multiple_choice").ok).toBe(false);
  });

  it("rejects a number payload", () => {
    expect(validateExercise(42).ok).toBe(false);
  });

  it("rejects choices that are not objects", () => {
    expect(validateExercise({ ...validMultipleChoice, choices: ["a", "b"] }).ok).toBe(false);
  });

  it("rejects duplicate choice ids", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      choices: [
        { id: "same", label_vi: "Một phần hai", correct: true },
        { id: "same", label_vi: "Một phần ba", correct: false },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing label", () => {
    const result = validateExercise({
      ...validMultipleChoice,
      choices: [
        { id: "half", label_vi: "Một phần hai", correct: true },
        { id: "third", correct: false },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a vocab_match with an image outside the local set", () => {
    const result = validateExercise({
      type: "vocab_match",
      question_vi: "Chọn từ đúng cho tranh",
      word: "apple",
      image: "https://example.com/tracking.gif",
      choices: [
        { id: "a", label_en: "apple", label_vi: "quả táo", correct: true },
        { id: "b", label_en: "book", label_vi: "quyển sách", correct: false },
      ],
      sentencePrompt_vi: "Viết một câu có chữ apple",
      sentenceAcceptedWords: ["apple"],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts extra unknown properties at the top level", () => {
    const result = validateExercise({ ...validMultipleChoice, sneakyField: "x" });
    // GAP (source, not this suite): the validator rejects malformed fields but
    // does not strip or reject unknown extras, so unrecognised properties are
    // carried through into the stored payload as bare `as` casts.
    expect(result.ok).toBe(true);
  });

  it("carries the image key through unchanged when valid", () => {
    const result = validateExercise({
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
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.type).toBe("vocab_match");
    if (result.value.type !== "vocab_match") throw new Error("unreachable");
    expect(result.value.image).toBe("apple");
  });
});

describe("canonical step and answer-key validation across authoring, seed, and import", () => {
  it("synchronises answerKey with fraction_visual and choice exercises and rejects mismatches", () => {
    const mcRes = validateExercise(validMultipleChoice);
    expect(mcRes.ok).toBe(true);
    if (!mcRes.ok) throw new Error("expected ok");

    expect(validateAnswerKeyForExercise(mcRes.value, { correctChoiceId: "half" }).ok).toBe(true);
    expect(validateAnswerKeyForExercise(mcRes.value, { correctChoiceId: "third" }).ok).toBe(false);
    expect(validateAnswerKeyForExercise(mcRes.value, { choiceId: "half" }).ok).toBe(false);

    const fracRes = validateExercise({
      type: "fraction_visual",
      question_vi: "Phần được tô là phân số nào?",
      question_en: "Which fraction is highlighted?",
      allowedDenominators: [2, 4, 8],
      maxParts: 8,
      correctNumerator: 3,
      correctDenominator: 4,
      bar: { parts: 4, highlighted: 3 },
    });
    expect(fracRes.ok).toBe(true);
    if (!fracRes.ok) throw new Error("expected ok");

    expect(
      validateAnswerKeyForExercise(fracRes.value, {
        correctNumerator: 3,
        correctDenominator: 4,
      }).ok,
    ).toBe(true);
    expect(
      validateAnswerKeyForExercise(fracRes.value, {
        correctNumerator: 1,
        correctDenominator: 4,
      }).ok,
    ).toBe(false);
  });

  it("enforces vocab_match acceptedWords bounds and rejects empty explanationVi", () => {
    const stepOk = validateCanonicalLessonStep({
      position: 1,
      kind: "guided",
      content: {
        type: "vocab_match",
        question_vi: "Chọn từ đúng",
        word: "apple",
        image: "apple",
        choices: [
          { id: "a", label_en: "apple", label_vi: "quả táo", correct: true },
          { id: "b", label_en: "book", label_vi: "quyển sách", correct: false },
        ],
        sentencePrompt_vi: "Viết một câu có từ apple",
        sentenceAcceptedWords: ["apple"],
      },
      answerKey: { correctChoiceId: "a", acceptedWords: ["apple", "apples"] },
      explanationVi: "Apple nghĩa là quả táo.",
    });
    expect(stepOk.ok).toBe(true);

    const badAcceptedWords = validateCanonicalLessonStep({
      position: 1,
      kind: "guided",
      content: {
        type: "vocab_match",
        question_vi: "Chọn từ đúng",
        word: "apple",
        image: "apple",
        choices: [
          { id: "a", label_en: "apple", label_vi: "quả táo", correct: true },
          { id: "b", label_en: "book", label_vi: "quyển sách", correct: false },
        ],
        sentencePrompt_vi: "Viết một câu có từ apple",
        sentenceAcceptedWords: ["apple"],
      },
      answerKey: { correctChoiceId: "a", acceptedWords: [] },
      explanationVi: "Apple nghĩa là quả táo.",
    });
    expect(badAcceptedWords.ok).toBe(false);

    const blankExplanation = validateCanonicalLessonStep({
      position: 1,
      kind: "guided",
      content: validMultipleChoice,
      answerKey: { correctChoiceId: "half" },
      explanationVi: "   ",
    });
    expect(blankExplanation.ok).toBe(false);
  });

  it("enforces contiguous 1..k step positions and transfer-step requirements", () => {
    const guidedStep = {
      position: 1,
      kind: "guided",
      content: validMultipleChoice,
      answerKey: { correctChoiceId: "half" },
      explanationVi: "Một phần hai là 1/2.",
    };
    const transferStep = {
      ...guidedStep,
      position: 2,
      kind: "transfer",
    };

    expect(
      validateCanonicalStepSequence([guidedStep], { requireTransferStep: true }).ok,
    ).toBe(false);
    expect(
      validateCanonicalStepSequence([guidedStep], { requireTransferStep: false }).ok,
    ).toBe(true);
    expect(
      validateCanonicalStepSequence([guidedStep, transferStep], { requireTransferStep: true }).ok,
    ).toBe(true);
    expect(
      validateCanonicalStepSequence(
        [guidedStep, { ...transferStep, position: 3 }],
        { requireTransferStep: true },
      ).ok,
    ).toBe(false);
  });
});

