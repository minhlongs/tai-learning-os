/**
 * The interaction area.
 *
 * Three interaction types, each a real control the learner operates rather than
 * a series of "Next" taps:
 *
 *   - `fraction_visual` — a CSS/SVG bar divided into equal parts, with the
 *     learner setting numerator and denominator by tapping segments and
 *     choosing from the denominators the lesson allows.
 *   - `vocab_match` — a locally drawn picture key plus a choice of English
 *     words, followed by writing a sentence that uses the word.
 *   - `reading_comprehension` / `multiple_choice` — choices backed by a
 *     passage, so the answer must be found in the text.
 *
 * This component does NOT know the answer. It never receives the answer key and
 * never imports the grader: it renders controls and hands the learner's
 * submission up to the screen, which asks the server. Correctness lives in
 * `gradeSubmission` on the server, in one code path.
 */

import { useState } from "react";
import type { LearnerExerciseSpec } from "../../../../shared/schemas/exercise";
import type { Submission } from "../../../../shared/schemas/answer";
import { VocabPicture } from "./VocabPicture";

/*
 * Every rule this component's class names need (.fraction-body, .chip,
 * .choice, .choice__hint, .passage, .field, .vocab-picture, .btn) is defined
 * in styles/lesson.css, which the only consumer of this component,
 * LessonScreen, already imports. A second stylesheet beside this one would
 * define the same selectors twice and let the two copies drift, so the import
 * is deliberately absent rather than pointing at a near-duplicate file.
 */

export function ExerciseBody({
  exercise,
  onAnswer,
  disabled,
}: {
  /**
   * The learner view, never the authoring spec: this component does not know the
   * answer, and its type is what makes that structurally true rather than a
   * promise in a comment.
   */
  exercise: LearnerExerciseSpec;
  onAnswer: (submission: Submission) => void;
  disabled: boolean;
}): React.JSX.Element {
  switch (exercise.type) {
    case "fraction_visual":
      return <FractionBody exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    case "vocab_match":
      return <VocabBody exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
    case "reading_comprehension":
    case "multiple_choice":
      return <ChoiceBody exercise={exercise} onAnswer={onAnswer} disabled={disabled} />;
  }
}

/* ── fraction visualisation ────────────────────────────────────────────────── */

function FractionBody({
  exercise,
  onAnswer,
  disabled,
}: {
  exercise: Extract<LearnerExerciseSpec, { type: "fraction_visual" }>;
  onAnswer: (submission: Submission) => void;
  disabled: boolean;
}): React.JSX.Element {
  const { bar, allowedDenominators } = exercise;
  const [denominator, setDenominator] = useState(bar.parts);
  const [numerator, setNumerator] = useState(0);

  // The bar always shows the shape the lesson defines; the learner decides how
  // many of those segments the value is worth.
  const segments = Array.from({ length: bar.parts }, (_, i) => i);
  const maxNumerator = Math.min(denominator, bar.parts);

  return (
    <div className="fraction-body">
      <svg
        className="fraction-bar"
        viewBox={`0 0 ${bar.parts * 40} 40`}
        role="img"
        aria-label={`Thanh chia thành ${bar.parts} phần bằng nhau, ${bar.highlighted} phần được tô màu.`}
      >
        {segments.map((i) => (
          <rect
            key={i}
            x={i * 40}
            y={0}
            width={40}
            height={40}
            className={i < bar.highlighted ? "fraction-bar__seg is-shaded" : "fraction-bar__seg"}
          />
        ))}
      </svg>

      <fieldset className="fraction-body__controls">
        <legend>Em hãy chọn mẫu số</legend>
        <div className="chip-row">
          {allowedDenominators.map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${denominator === value ? "is-selected" : ""}`}
              aria-pressed={denominator === value}
              disabled={disabled}
              onClick={() => {
                setDenominator(value);
                setNumerator((n) => Math.min(n, Math.min(value, bar.parts)));
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="fraction-body__controls">
        <legend>Em hãy chọn tử số</legend>
        <div className="chip-row">
          {Array.from({ length: maxNumerator }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${numerator === value ? "is-selected" : ""}`}
              aria-pressed={numerator === value}
              disabled={disabled}
              onClick={() => setNumerator(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="fraction-body__value" aria-live="polite">
        Phân số của em: <strong>{numerator}</strong>
        {" / "}
        <strong>{denominator}</strong>
      </p>

      <button
        type="button"
        className="btn btn--primary"
        disabled={disabled || numerator === 0}
        onClick={() => onAnswer({ kind: "fraction", numerator, denominator })}
      >
        Kiểm tra
      </button>
    </div>
  );
}

/* ── English vocabulary ────────────────────────────────────────────────────── */

function VocabBody({
  exercise,
  onAnswer,
  disabled,
}: {
  exercise: Extract<LearnerExerciseSpec, { type: "vocab_match" }>;
  onAnswer: (submission: Submission) => void;
  disabled: boolean;
}): React.JSX.Element {
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [sentence, setSentence] = useState("");

  return (
    <div className="vocab-body">
      <VocabPicture image={exercise.image} word={exercise.word} />
      <fieldset className="vocab-body__choices">
        <legend>Em hãy chọn từ đúng</legend>
        {exercise.choices.map((choice) => (
          <label key={choice.id} className="choice">
            <input
              type="radio"
              name={`vocab-${exercise.word}`}
              value={choice.id}
              checked={choiceId === choice.id}
              disabled={disabled}
              onChange={() => setChoiceId(choice.id)}
            />
            <span className="choice__label">
              {choice.label_en}
              <span className="choice__hint"> ({choice.label_vi})</span>
            </span>
          </label>
        ))}
      </fieldset>

      {/* The word choice is graded on submit; the sentence follow-up is graded
          as its own attempt so a learner can try again without losing the
          first, real observation. */}
      <button
        type="button"
        className="btn btn--primary"
        disabled={disabled || choiceId === null}
        onClick={() => {
          if (choiceId) onAnswer({ kind: "choice", choiceId });
        }}
      >
        Kiểm tra từ vựng
      </button>

      <form
        className="vocab-body__sentence"
        onSubmit={(event) => {
          event.preventDefault();
          if (sentence.trim().length > 0) onAnswer({ kind: "text", text: sentence });
        }}
      >
        <label className="field">
          <span className="field__label">{exercise.sentencePrompt_vi}</span>
          <textarea
            className="field__input"
            rows={3}
            value={sentence}
            disabled={disabled}
            onChange={(event) => setSentence(event.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--secondary" disabled={disabled || !sentence.trim()}>
          Gửi câu
        </button>
      </form>
    </div>
  );
}

/* ── choice-based reading and multiple choice ──────────────────────────────── */

function ChoiceBody({
  exercise,
  onAnswer,
  disabled,
}: {
  exercise: Extract<LearnerExerciseSpec, { type: "reading_comprehension" | "multiple_choice" }>;
  onAnswer: (submission: Submission) => void;
  disabled: boolean;
}): React.JSX.Element {
  const [choiceId, setChoiceId] = useState<string | null>(null);

  return (
    <div className="choice-body">
      {exercise.type === "reading_comprehension" ? (
        <article className="passage">
          <h3 className="passage__title">{exercise.passageTitle_vi}</h3>
          <p className="passage__text">{exercise.passage_vi}</p>
        </article>
      ) : null}

      <fieldset className="choice-body__choices">
        <legend>Em hãy chọn một đáp án</legend>
        {exercise.choices.map((choice) => (
          <label key={choice.id} className="choice">
            <input
              type="radio"
              name={`choice-${exercise.question_vi.slice(0, 40)}`}
              value={choice.id}
              checked={choiceId === choice.id}
              disabled={disabled}
              onChange={() => setChoiceId(choice.id)}
            />
            <span className="choice__label">{choice.label_vi}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn btn--primary"
        disabled={disabled || choiceId === null}
        onClick={() => {
          if (choiceId) onAnswer({ kind: "choice", choiceId });
        }}
      >
        Kiểm tra
      </button>
    </div>
  );
}
