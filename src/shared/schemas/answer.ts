/**
 * Deterministic answer validation.
 *
 * Every answer is checked here, on the server, with one code path. The client
 * never decides correctness: it only renders. This is what makes "did the
 * learner actually do it" a fact rather than a claim.
 */

import type { ExerciseSpec } from "./exercise";

/** What the learner submitted. Shape depends on the interaction. */
export type Submission =
  | { kind: "choice"; choiceId: string }
  | { kind: "fraction"; numerator: number; denominator: number }
  | { kind: "text"; text: string };

export type Grade =
  | { outcome: "correct"; messageVi: string }
  | { outcome: "partial"; messageVi: string }
  | { outcome: "incorrect"; messageVi: string };

const CORRECT_MSG = "Chính xác!";
const PARTIAL_MSG = "Em đã làm đúng sau khi được gợi ý. Lần sau em hãy tự làm trước nhé.";

export function clampHelp(level: number): number {
  if (!Number.isFinite(level)) return 0;
  return Math.min(4, Math.max(0, Math.trunc(level)));
}

/**
 * Grade a submission against an exercise.
 *
 * `helpLevel` is the hint level reached BEFORE submitting. Level 3+ means the
 * learner was shown a worked example or near-solution, so a correct answer can
 * never be recorded as fully independent.
 */
export function gradeSubmission(
  exercise: ExerciseSpec,
  submission: Submission,
  helpLevel: number,
): Grade {
  const effectiveHelp = clampHelp(helpLevel);

  // A fully revealed solution never counts as an independent solve. Level 4 is
  // the ceiling because the learner has already been shown the method.
  const assisted = effectiveHelp >= 3;

  switch (exercise.type) {
    case "fraction_visual": {
      if (submission.kind !== "fraction") {
        return { outcome: "incorrect", messageVi: "Em hãy chọn tử số và mẫu số." };
      }
      const { numerator, denominator } = submission;
      if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
        return { outcome: "incorrect", messageVi: "Tử số và mẫu số phải là số nguyên." };
      }
      if (denominator <= 0 || denominator > exercise.maxParts) {
        return { outcome: "incorrect", messageVi: "Mẫu số không phù hợp với hình." };
      }
      // Compare as exact values: 1/2 and 2/4 are both "one half", which is the
      // reasoning being assessed.
      if (numerator / denominator === exercise.correctNumerator / exercise.correctDenominator) {
        return assisted
          ? { outcome: "partial", messageVi: PARTIAL_MSG }
          : { outcome: "correct", messageVi: "Chính xác! Em chọn đúng phần bằng nhau." };
      }
      return {
        outcome: "incorrect",
        messageVi: "Chưa đúng. Em hãy đếm số phần bằng nhau được tô màu.",
      };
    }

    case "vocab_match": {
      if (submission.kind === "choice") {
        const choice = exercise.choices.find((c) => c.id === submission.choiceId);
        if (!choice?.correct) {
          return {
            outcome: "incorrect",
            messageVi: "Chưa đúng. Em hãy nhìn tranh và chọn từ vựng phù hợp.",
          };
        }
        return assisted
          ? { outcome: "partial", messageVi: PARTIAL_MSG }
          : { outcome: "correct", messageVi: `Đúng rồi! "${exercise.word}" nghĩa là vậy.` };
      }
      if (submission.kind !== "text") {
        return { outcome: "incorrect", messageVi: "Em hãy viết một câu với từ vựng này." };
      }
      const text = submission.text.trim().toLowerCase();
      if (text.length < 3) {
        return { outcome: "incorrect", messageVi: "Câu cần dài hơn một chút." };
      }
      const used = exercise.sentenceAcceptedWords.some((w) => text.includes(w.toLowerCase()));
      if (!used) {
        return {
          outcome: "incorrect",
          messageVi: `Em hãy dùng từ "${exercise.word}" trong câu của mình.`,
        };
      }
      return assisted
        ? { outcome: "partial", messageVi: PARTIAL_MSG }
        : { outcome: "correct", messageVi: "Hay! Em đã dùng đúng từ trong câu." };
    }

    case "reading_comprehension":
    case "multiple_choice": {
      if (submission.kind !== "choice") {
        return { outcome: "incorrect", messageVi: "Em hãy chọn một đáp án." };
      }
      const correctId = correctChoiceId(exercise);
      if (submission.choiceId !== correctId) {
        return {
          outcome: "incorrect",
          messageVi: "Chưa đúng. Em hãy tìm lại dòng chứng cứ trong bài đọc.",
        };
      }
      return assisted
        ? { outcome: "partial", messageVi: PARTIAL_MSG }
        : { outcome: "correct", messageVi: "Chính xác! Em đã tìm ra chứng cứ." };
    }

    default: {
      // Exhaustive: no other exercise types exist.
      const exhaustive: never = exercise;
      void exhaustive;
      return { outcome: "incorrect", messageVi: "Dạng bài không được hỗ trợ." };
    }
  }
}

/**
 * The canonical correct choice id for an exercise, computed once so the grader
 * can compare against it and the parent can inspect it.
 */
export function correctChoiceId(exercise: ExerciseSpec): string | null {
  switch (exercise.type) {
    case "fraction_visual":
      return String(exercise.correctNumerator);
    case "vocab_match":
    case "reading_comprehension":
    case "multiple_choice":
      return exercise.choices.find((c) => c.correct)?.id ?? null;
    default:
      return null;
  }
}

/**
 * Progressive hints, Vietnamese-first. Help level maps 0..4 where 4 is the
 * highest disclosure. Higher levels approach the answer but the answer text is
 * never simply handed over as a clickable string.
 */
export function hintFor(exercise: ExerciseSpec, level: number): string | null {
  const clamped = clampHelp(level);
  if (clamped === 0) return null;

  switch (exercise.type) {
    case "multiple_choice":
      return (
        [null, exercise.hint1_vi, exercise.hint2_vi, exercise.hint3_vi,
          "Gợi ý cao nhất: em hãy loại trừ các lựa chọn không có chứng cứ."][clamped] ?? null
      );

    case "reading_comprehension":
      return (
        [null,
          "Em hãy đọc kỹ câu hỏi: câu hỏi hỏi về ai hoặc cái gì?",
          "Em hãy tìm trong bài đoạn văn nói về điều đó.",
          `Dòng chứng cứ trong bài: "${exercise.evidenceSentence_vi}"`,
          "Đáp án đúng là lựa chọn khớp với dòng chứng cứ đó."][clamped] ?? null
      );

    case "vocab_match":
      return (
        [null,
          "Em hãy nhìn tranh và đoán nội dung bằng tiếng Việt trước.",
          "Em hãy đọc kỹ từ vựng ở trên.",
          exercise.sentencePrompt_vi,
          `Từ vựng cần dùng là: "${exercise.word}".`][clamped] ?? null
      );

    case "fraction_visual":
      return (
        [null,
          "Em hãy đếm xem thanh được chia thành mấy phần bằng nhau.",
          "Em hãy đếm mấy phần được tô màu.",
          `Thanh chia ${exercise.bar.parts} phần, có ${exercise.bar.highlighted} phần tô màu. Em hãy viết phân số.`,
          `Phân số cần tìm có mẫu số ${exercise.correctDenominator} ở dạng đơn giản nhất. Em hãy tính tử số tương ứng.`][clamped] ?? null
      );

    default:
      return null;
  }
}

void CORRECT_MSG;
