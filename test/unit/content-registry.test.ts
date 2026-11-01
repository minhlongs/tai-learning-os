import { describe, expect, it } from "vitest";

import { LESSONS } from "../../src/shared/content/index";
import { LESSON_STEP_KINDS } from "../../src/shared/schemas/attempt";
import { correctChoiceId, gradeSubmission } from "../../src/shared/schemas/answer";
import { validateExercise } from "../../src/shared/schemas/exercise";
import type { LessonDefinition } from "../../src/shared/content/types";

/**
 * The registry is what the seed walks, and the seed is the only path by which
 * a lesson reaches the learner. So these tests hold the same bar the seed holds:
 * a lesson that would fail seeding is a lesson that must not ship.
 *
 * They also hold the content promises the product made. Nine lessons across
 * three subjects, each with an independent attempt and a transfer check, each
 * step explainable in Vietnamese — because a child who cannot follow the
 * explanation has been given a right answer with no reason.
 */

describe("lesson registry — shape", () => {
  it("covers five active subjects (5 Math, 5 English, 5 Vietnamese, 3 Science, 3 Debate = 21 lessons including 5 baselines)", () => {
    expect(LESSONS).toHaveLength(21);

    const bySubject = new Map<string, number>();
    for (const lesson of LESSONS) {
      bySubject.set(lesson.subjectId, (bySubject.get(lesson.subjectId) ?? 0) + 1);
    }
    expect(bySubject.get("math")).toBe(5);
    expect(bySubject.get("english")).toBe(5);
    expect(bySubject.get("vietnamese")).toBe(5);
    expect(bySubject.get("science")).toBe(3);
    expect(bySubject.get("debate")).toBe(3);

    const baselineLessons = LESSONS.filter((lesson) => lesson.isBaseline);
    expect(baselineLessons).toHaveLength(5);
    expect(baselineLessons.map((l) => l.subjectId).sort()).toEqual([
      "debate",
      "english",
      "math",
      "science",
      "vietnamese",
    ]);
  });

  it("uses unique lesson ids", () => {
    const ids = LESSONS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique skill ids across core (non-baseline) lessons, so a core lesson cannot shadow another's evidence", () => {
    const coreLessons = LESSONS.filter((lesson) => !lesson.isBaseline);
    expect(coreLessons).toHaveLength(16);
    const skillIds = coreLessons.map((lesson) => lesson.skillId);
    expect(new Set(skillIds).size).toBe(skillIds.length);
  });

  it("titles its lessons in both languages", () => {
    for (const lesson of LESSONS) {
      expect(lesson.titleVi.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.titleEn.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.objectiveVi.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.objectiveEn.length, lesson.id).toBeGreaterThan(0);
    }
  });
});

describe("lesson registry — every step is teachable", () => {
  it("passes the exercise schema the import route enforces", () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        const result = validateExercise(step.content);
        expect(
          result.ok,
          `${lesson.id} step ${step.position}: ${result.ok ? "" : result.error}`,
        ).toBe(true);
      }
    }
  });

  it("uses only real lesson step kinds", () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(LESSON_STEP_KINDS, `${lesson.id} step ${step.position}`).toContain(step.kind);
      }
    }
  });

  it("numbers steps contiguously from one", () => {
    for (const lesson of LESSONS) {
      const positions = lesson.steps.map((step) => step.position).sort((a, b) => a - b);
      expect(positions, lesson.id).toEqual(
        Array.from({ length: lesson.steps.length }, (_, i) => i + 1),
      );
    }
  });

  it("explains every step in Vietnamese", () => {
    // An unexplained step gives the learner a verdict with no reasoning.
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(step.explanationVi.trim().length, `${lesson.id} step ${step.position}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("lesson registry — the required pedagogy sequence", () => {
  it("contains an independent attempt in every lesson", () => {
    // Without one, nothing in the lesson can demonstrate independent solving.
    for (const lesson of LESSONS) {
      const kinds = lesson.steps.map((step) => step.kind);
      expect(kinds, lesson.id).toContain("independent");
    }
  });

  it("ends with a transfer check in every lesson", () => {
    // The transfer check is the last step of the teaching sequence, so a
    // lesson without one never reaches "vận dụng được".
    for (const lesson of LESSONS) {
      const last = lesson.steps[lesson.steps.length - 1];
      expect(last?.kind, lesson.id).toBe("transfer");
    }
  });

  it("opens with a concept before any practice", () => {
    for (const lesson of LESSONS) {
      expect(lesson.steps[0]?.kind, lesson.id).toBe("concept");
    }
  });

  it("reaches the independent attempt only after guided practice", () => {
    // Order is the whole point: independent comes after guided, never before.
    for (const lesson of LESSONS) {
      const kinds = lesson.steps.map((step) => step.kind);
      const guided = kinds.indexOf("guided");
      const independent = kinds.indexOf("independent");
      if (guided !== -1 && independent !== -1) {
        expect(guided, lesson.id).toBeLessThan(independent);
      }
    }
  });
});

describe("lesson registry — nothing the learner cannot see is claimed", () => {
  it("declares a grade band covering primary school", () => {
    for (const lesson of LESSONS) {
      expect(lesson.gradeFrom, lesson.id).toBeGreaterThanOrEqual(1);
      expect(lesson.gradeTo, lesson.id).toBeGreaterThanOrEqual(lesson.gradeFrom);
    }
  });

  it("stores an answer key per step that matches the exercise's correct answer, because grading is server-side", () => {
    // The key exists so the Worker can grade without telling. The learner
    // payload deliberately drops it (see `toStepPayload` in the learner routes),
    // so holding it here is the precondition for that, not a leak.
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(step.answerKey, `${lesson.id} step ${step.position}`).toBeDefined();
        const parsedKey = JSON.parse(step.answerKey) as Record<string, unknown>;
        if (step.content.type === "fraction_visual") {
          expect(parsedKey.correctNumerator, `${lesson.id} step ${step.position}`).toBe(
            step.content.correctNumerator,
          );
          expect(parsedKey.correctDenominator, `${lesson.id} step ${step.position}`).toBe(
            step.content.correctDenominator,
          );
        } else {
          expect(parsedKey.correctChoiceId, `${lesson.id} step ${step.position}`).toBe(
            correctChoiceId(step.content),
          );
        }
      }
    }
  });

  it("grades the English simple-sentences step 3 ('She reads books.') as correct when choosing option 'a'", () => {
    const lesson = LESSONS.find((l) => l.id === "eng-simple-sentences");
    expect(lesson).toBeDefined();
    const step3 = lesson!.steps.find((s) => s.position === 3);
    expect(step3).toBeDefined();
    expect(JSON.parse(step3!.answerKey)).toEqual({ correctChoiceId: "a" });
    const grade = gradeSubmission(step3!.content, { kind: "choice", choiceId: "a" }, 0);
    expect(grade.outcome).toBe("correct");
  });
});

/** The type-level shape a seed writes from. Asserted to keep it honest. */
describe("lesson registry — seed inputs", () => {
  it("carries every field the seed insert needs", () => {
    const fields: readonly (keyof LessonDefinition)[] = [
      "id",
      "subjectId",
      "skillId",
      "titleVi",
      "titleEn",
      "objectiveVi",
      "objectiveEn",
      "gradeFrom",
      "gradeTo",
      "steps",
    ];
    for (const lesson of LESSONS) {
      for (const field of fields) {
        expect(lesson[field], `${lesson.id}.${String(field)}`).toBeDefined();
      }
    }
  });
});
