/**
 * Exercise schemas.
 *
 * Every lesson step's `content` and `answer_key` is stored as JSON in D1 and
 * validated against these types. The validator is deliberately hand-written
 * rather than pulling in a schema library: the shapes are small and closed, the
 * app must not add dependencies it does not need, and a bespoke validator that
 * REJECTS on unknown shape is safer here than one that coerces.
 *
 * Security note: content arrives from the parent (trusted) and from JSON import
 * (untrusted). Import input is validated here before it can reach the database,
 * so malformed or oversized content cannot be persisted.
 */

export type FractionSpec = {
  numerator: number;
  denominator: number;
};

export type FractionBarSpec = {
  /** Total equal-width segments in the bar. */
  parts: number;
  /** How many segments are highlighted. */
  highlighted: number;
};

// --- Interaction 1: Fraction visualisation ---------------------------------
export type FractionVisualSpec = {
  type: "fraction_visual";
  question_vi: string;
  question_en: string;
  /** Denominator options the learner may pick between. */
  allowedDenominators: number[];
  /** The bar renders this many equal segments at most. */
  maxParts: number;
  /** Denominator that answers the question correctly. */
  correctDenominator: number;
  /** Numerator that answers the question correctly. */
  correctNumerator: number;
  /** A pre-rendered bar the learner manipulates. */
  bar: FractionBarSpec;
};

// --- Interaction 2: English vocabulary ------------------------------------
export type VocabMatchSpec = {
  type: "vocab_match";
  question_vi: string;
  word: string;
  /** Locally drawn SVG key: no remote or stock imagery. */
  image: "apple" | "book" | "bottle" | "chair" | "cat" | "dog" | "house" | "table" | "tree" | "window";
  choices: { id: string; label_en: string; label_vi: string; correct: boolean }[];
  /** Follow-up: use the word in a simple sentence. */
  sentencePrompt_vi: string;
  /** Words accepted in the sentence answer (case-insensitive, any match wins). */
  sentenceAcceptedWords: string[];
};

// --- Interaction 3: Vietnamese reading comprehension ----------------------
export type ReadingComprehensionSpec = {
  type: "reading_comprehension";
  passage_vi: string;
  passageTitle_vi: string;
  question_vi: string;
  /** Options that require evidence present in the passage. */
  choices: { id: string; label_vi: string; correct: boolean }[];
  /** Which sentence of the passage supports the correct answer. */
  evidenceSentence_vi: string;
};

// --- Generic multiple choice (used for guided practice + transfer) ---------
export type MultipleChoiceSpec = {
  type: "multiple_choice";
  question_vi: string;
  question_en?: string;
  choices: { id: string; label_vi: string; correct: boolean }[];
  hint1_vi: string;
  hint2_vi: string;
  hint3_vi: string;
};

export type ExerciseSpec =
  | FractionVisualSpec
  | VocabMatchSpec
  | ReadingComprehensionSpec
  | MultipleChoiceSpec;

/* ── The learner-facing view ─────────────────────────────────────────────────
 *
 * The specs above are the AUTHORING shape: they are validated against parent
 * input and JSON import, and they legitimately contain the answer, because the
 * grader needs it. The child never receives them.
 *
 * These view types are the same shapes with every answer-bearing field removed
 * by construction. `LearnerExerciseSpec` deliberately has no `correct`, no
 * `correctNumerator`/`correctDenominator`, and no `evidenceSentence_vi`, so a
 * mistake in the serialising code cannot leak them: there is nowhere to put the
 * value. This is a type-level guard on top of the runtime strip, not a
 * replacement for it — the strip is what actually runs, and a test asserts the
 * wire carries no answer.
 */

export type LearnerFractionVisualSpec = Omit<
  FractionVisualSpec,
  "correctDenominator" | "correctNumerator"
>;

/** The picture and the words, minus which word is right and the accepted
 * sentence vocabulary — the sentence is graded on the server. */
export type LearnerVocabMatchSpec = {
  type: "vocab_match";
  question_vi: string;
  word: string;
  image: VocabMatchSpec["image"];
  choices: { id: string; label_en: string; label_vi: string }[];
  sentencePrompt_vi: string;
};

/** A choice as the learner sees it: the label only, never its correctness. */
export type LearnerChoice = { id: string; label_vi: string };

export type LearnerReadingComprehensionSpec = {
  type: "reading_comprehension";
  passage_vi: string;
  passageTitle_vi: string;
  question_vi: string;
  choices: LearnerChoice[];
};

export type LearnerMultipleChoiceSpec = {
  type: "multiple_choice";
  question_vi: string;
  question_en?: string;
  choices: LearnerChoice[];
  hint1_vi: string;
  hint2_vi: string;
  hint3_vi: string;
};

export type LearnerExerciseSpec =
  | LearnerFractionVisualSpec
  | LearnerVocabMatchSpec
  | LearnerReadingComprehensionSpec
  | LearnerMultipleChoiceSpec;

/** Keys that must never appear in a payload the learner receives. */
const ANSWER_BEARING_KEYS = [
  "correct",
  "correctDenominator",
  "correctNumerator",
  "correctChoiceId",
  "evidenceSentence_vi",
  "sentenceAcceptedWords",
] as const;

/**
 * Strip the answer key from a stored exercise, producing the learner view.
 *
 * This is the runtime half of the guard: the learner types make it impossible
 * to type an answer back in, and this function is what removes it on the way
 * out. Choices are rebuilt rather than mapped, so a `correct` field cannot
 * survive by being left behind in an untouched object.
 */
export function toLearnerExercise(spec: ExerciseSpec): LearnerExerciseSpec {
  switch (spec.type) {
    case "fraction_visual": {
      const { correctDenominator, correctNumerator, ...rest } = spec;
      void correctDenominator;
      void correctNumerator;
      return { ...rest, type: "fraction_visual" };
    }
    case "vocab_match": {
      const { sentenceAcceptedWords, ...rest } = spec;
      void sentenceAcceptedWords;
      return {
        ...rest,
        type: "vocab_match",
        choices: spec.choices.map(({ id, label_en, label_vi }) => ({ id, label_en, label_vi })),
      };
    }
    case "reading_comprehension": {
      const { evidenceSentence_vi, ...rest } = spec;
      void evidenceSentence_vi;
      return {
        ...rest,
        type: "reading_comprehension",
        choices: spec.choices.map(({ id, label_vi }) => ({ id, label_vi })),
      };
    }
    case "multiple_choice":
      return {
        ...spec,
        type: "multiple_choice",
        choices: spec.choices.map(({ id, label_vi }) => ({ id, label_vi })),
      };
  }
}

/** True when a payload the learner receives still carries an answer. */
export function leaksAnswer(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(leaksAnswer);
  if (typeof value !== "object" || value === null) return false;
  return (Object.keys(value) as readonly string[]).some(
    (key) => ANSWER_BEARING_KEYS.includes(key as (typeof ANSWER_BEARING_KEYS)[number]) || leaksAnswer((value as Record<string, unknown>)[key]),
  );
}

export const EXERCISE_TYPES = [
  "fraction_visual",
  "vocab_match",
  "reading_comprehension",
  "multiple_choice",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

const MAX_TEXT_LENGTH = 4000;
const MAX_CHOICES = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, max = MAX_TEXT_LENGTH): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Validate an exercise payload. Returns a discriminated result so callers must
 * handle failure rather than casting.
 */
export type ValidationResult =
  | { ok: true; value: ExerciseSpec }
  | { ok: false; error: string };

/** Reason a choices array was rejected, or null when it is acceptable. */
export function choiceArrayError(
  choices: unknown,
  labelKey: "label_vi" | "label_en",
): string | null {
  if (!Array.isArray(choices) || choices.length < 2 || choices.length > MAX_CHOICES) {
    return `choices must contain between 2 and ${MAX_CHOICES} entries`;
  }
  let correctCount = 0;
  const ids = new Set<string>();
  for (const choice of choices) {
    if (!isRecord(choice)) return "each choice must be an object";
    const { id } = choice;
    if (!isString(id, 64)) return "choice.id must be a short non-empty string";
    if (ids.has(id)) return `duplicate choice id: ${id}`;
    ids.add(id);
    if (!isString(choice[labelKey])) return `choice.${labelKey} must be a non-empty string`;
    if (typeof choice.correct !== "boolean") return "choice.correct must be boolean";
    if (choice.correct) correctCount += 1;
  }
  if (correctCount !== 1) {
    return `exactly one choice must be marked correct (found ${correctCount})`;
  }
  return null;
}

export function validateExercise(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return { ok: false, error: "content must be an object" };

  const { type } = raw;
  if (typeof type !== "string" || !EXERCISE_TYPES.includes(type as ExerciseType)) {
    return { ok: false, error: `unknown exercise type: ${String(type)}` };
  }

  switch (type as ExerciseType) {
    case "fraction_visual": {
      const bar = raw.bar;
      if (!isRecord(bar)) return { ok: false, error: "bar must be an object" };
      if (!isPositiveInteger(bar.parts) || bar.parts > 24) {
        return { ok: false, error: "bar.parts must be 1..24" };
      }
      if (!isPositiveInteger(bar.highlighted) || bar.highlighted > bar.parts) {
        return { ok: false, error: "bar.highlighted must be 1..bar.parts" };
      }
      if (!isString(raw.question_vi)) return { ok: false, error: "question_vi required" };
      if (!isString(raw.question_en)) return { ok: false, error: "question_en required" };
      if (
        !Array.isArray(raw.allowedDenominators) ||
        raw.allowedDenominators.length < 2 ||
        !raw.allowedDenominators.every(isPositiveInteger)
      ) {
        return { ok: false, error: "allowedDenominators must hold 2+ positive integers" };
      }
      for (const key of ["correctDenominator", "correctNumerator", "maxParts"] as const) {
        if (!isPositiveInteger(raw[key])) return { ok: false, error: `${key} must be positive` };
      }
      return { ok: true, value: raw as unknown as FractionVisualSpec };
    }

    case "vocab_match": {
      if (!isString(raw.question_vi)) return { ok: false, error: "question_vi required" };
      if (!isString(raw.word, 60)) return { ok: false, error: "word must be 1..60 chars" };
      if (!isString(raw.sentencePrompt_vi)) {
        return { ok: false, error: "sentencePrompt_vi required" };
      }
      if (
        !Array.isArray(raw.sentenceAcceptedWords) ||
        raw.sentenceAcceptedWords.length === 0 ||
        !raw.sentenceAcceptedWords.every((w) => isString(w, 60))
      ) {
        return { ok: false, error: "sentenceAcceptedWords must be non-empty strings" };
      }
      const choiceError = choiceArrayError(raw.choices, "label_en");
      if (choiceError) return { ok: false, error: choiceError };
      if (!isString(raw.image, 40)) return { ok: false, error: "image key required" };
      return { ok: true, value: raw as unknown as VocabMatchSpec };
    }

    case "reading_comprehension": {
      if (!isString(raw.passage_vi)) return { ok: false, error: "passage_vi required" };
      if (!isString(raw.passageTitle_vi, 120)) {
        return { ok: false, error: "passageTitle_vi required" };
      }
      if (!isString(raw.question_vi)) return { ok: false, error: "question_vi required" };
      if (!isString(raw.evidenceSentence_vi)) {
        return { ok: false, error: "evidenceSentence_vi required" };
      }
      const choiceError = choiceArrayError(raw.choices, "label_vi");
      if (choiceError) return { ok: false, error: choiceError };
      return { ok: true, value: raw as unknown as ReadingComprehensionSpec };
    }

    case "multiple_choice": {
      if (!isString(raw.question_vi)) return { ok: false, error: "question_vi required" };
      if (raw.question_en !== undefined && !isString(raw.question_en)) {
        return { ok: false, error: "question_en must be a string when present" };
      }
      for (const key of ["hint1_vi", "hint2_vi", "hint3_vi"] as const) {
        if (!isString(raw[key])) return { ok: false, error: `${key} required` };
      }
      const choiceError = choiceArrayError(raw.choices, "label_vi");
      if (choiceError) return { ok: false, error: choiceError };
      return { ok: true, value: raw as unknown as MultipleChoiceSpec };
    }

    default:
      // Exhaustiveness: unreachable while EXERCISE_TYPES is closed.
      return { ok: false, error: "unreachable exercise type" };
  }
}

/** Parse stored JSON content into a validated exercise, or null. */
export function parseExercise(json: string): ExerciseSpec | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const result = validateExercise(parsed);
  return result.ok ? result.value : null;
}

/** Parse a stored answer key. Used by the validator and by parent review. */
export function parseAnswerKey(json: string): unknown | null {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}
