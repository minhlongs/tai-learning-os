import { describe, expect, it } from "vitest";

import { LESSONS } from "../../src/shared/content/index";
import { WAVE1_LEGACY_IDS } from "../../src/shared/content/wave1-legacy";
import { LESSON_STEP_KINDS } from "../../src/shared/schemas/attempt";
import { correctChoiceId, gradeSubmission } from "../../src/shared/schemas/answer";
import { validateExercise } from "../../src/shared/schemas/exercise";
import type { LessonDefinition } from "../../src/shared/content/types";

/**
 * The registry is what the seed walks, and the seed is the only path by which
 * a lesson reaches the learner. So these tests hold the same bar the seed holds:
 * a lesson that would fail seeding is a lesson that must not ship.
 *
 * They also hold the content promises the product made. One hundred lessons
 * across five subjects, each with an independent attempt and a transfer check,
 * each step explainable in Vietnamese — because a child who cannot follow the
 * explanation has been given a right answer with no reason.
 */

describe("lesson registry — shape", () => {
  it("covers five active subjects (20 Math, 20 English, 20 Vietnamese, 20 Science, 20 Debate = 100 lessons including 10 baselines)", () => {
    expect(LESSONS).toHaveLength(100);

    const bySubject = new Map<string, number>();
    for (const lesson of LESSONS) {
      bySubject.set(lesson.subjectId, (bySubject.get(lesson.subjectId) ?? 0) + 1);
    }
    expect(bySubject.get("math")).toBe(20);
    expect(bySubject.get("english")).toBe(20);
    expect(bySubject.get("vietnamese")).toBe(20);
    expect(bySubject.get("science")).toBe(20);
    expect(bySubject.get("debate")).toBe(20);

    const baselineLessons = LESSONS.filter((lesson) => lesson.isBaseline);
    expect(baselineLessons).toHaveLength(10);
    expect(baselineLessons.map((l) => l.subjectId).sort()).toEqual([
      "debate",
      "debate",
      "english",
      "english",
      "math",
      "math",
      "science",
      "science",
      "vietnamese",
      "vietnamese",
    ]);
  });

  it("uses unique lesson ids", () => {
    const ids = LESSONS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("distributes Grade 5 answers so no single position is guessable", () => {
    const grade5ChoiceIds = LESSONS.filter(
      (lesson) => lesson.gradeFrom === 5 && lesson.gradeTo === 5,
    ).flatMap((lesson) =>
      lesson.steps.flatMap((step) => {
        if (step.content.type === "fraction_visual") return [];
        return [correctChoiceId(step.content)];
      }),
    );
    const counts = new Map<string, number>();
    for (const id of grade5ChoiceIds) counts.set(id, (counts.get(id) ?? 0) + 1);

    expect(grade5ChoiceIds).toHaveLength(250);
    // Every position must be used, and none may dominate: a distribution where
    // one letter holds even a third of the answers is guessable.
    expect([...counts.keys()].sort()).toEqual(["a", "b", "c", "d"]);
    for (const [choiceId, count] of counts) {
      expect(count / grade5ChoiceIds.length, `choice "${choiceId}" share`).toBeLessThanOrEqual(0.3);
    }

    // Per-lesson sequences must vary too. If every core lesson used the same
    // order, the position of an answer would still be predictable even with an
    // even aggregate distribution.
    const patterns = LESSONS.filter(
      (lesson) => lesson.gradeFrom === 5 && lesson.gradeTo === 5 && lesson.steps.length >= 5,
    ).map((lesson) =>
      lesson.steps
        .map((step) => (step.content.type === "fraction_visual" ? "-" : correctChoiceId(step.content)))
        .join(""),
    );
    const distinctPatterns = new Set(patterns).size;
    expect(distinctPatterns, "distinct Grade 5 answer sequences").toBeGreaterThan(1);
  });

  it("distributes Grade 4 answers so no single position is guessable", () => {
    const grade4ChoiceIds = LESSONS.filter(
      (lesson) => lesson.gradeFrom === 4 && lesson.gradeTo === 4,
    ).flatMap((lesson) =>
      lesson.steps.flatMap((step) => {
        if (step.content.type === "fraction_visual") return [];
        return [correctChoiceId(step.content)];
      }),
    );
    const counts = new Map<string, number>();
    for (const id of grade4ChoiceIds) counts.set(id, (counts.get(id) ?? 0) + 1);

    expect([...counts.keys()].sort()).toEqual(["a", "b", "c", "d"]);
    for (const [choiceId, count] of counts) {
      expect(count / grade4ChoiceIds.length, `choice "${choiceId}" share`).toBeLessThanOrEqual(0.3);
    }

    const patterns = LESSONS.filter(
      (lesson) => lesson.gradeFrom === 4 && lesson.gradeTo === 4 && lesson.steps.length >= 5,
    ).map((lesson) =>
      lesson.steps
        .map((step) => (step.content.type === "fraction_visual" ? "-" : correctChoiceId(step.content)))
        .join(""),
    );
    expect(new Set(patterns).size, "distinct Grade 4 answer sequences").toBeGreaterThan(1);
  });

  it("keeps choice lengths balanced so clicking the longest option cannot game mastery", () => {
    // Wave 1 shipped before choice-length parity was gated; any lesson added from
    // Wave 2 onward is held to the strict per-subject and per-step ceilings so a
    // learner cannot pass FSRS/BKT thresholds by picking the longest string.
    const wave1LegacyIds = WAVE1_LEGACY_IDS;

    const postWave1BySubject = new Map<
      string,
      { total: number; ranks: [number, number, number, number] }
    >();
    const maxRatioViolations: string[] = [];
    const medianRatioViolations: string[] = [];
    const monoRankLessons: string[] = [];
    const indistinguishableDilution: string[] = [];
    // Distinguishable rows are aggregated per subject, then checked once, so a
    // subject with many tied rows cannot hide a real tell in the average.
    const distinguishableBySubject = new Map<string, { total: number; longest: number }>();

    for (const lesson of LESSONS) {
      if (wave1LegacyIds.has(lesson.id)) continue;
      const lessonRanks: number[] = [];

      for (const step of lesson.steps) {
        if (step.content.type === "fraction_visual") continue;
        const indexed = step.content.choices.map((choice, index) => ({
          choice,
          index,
          len: choice.label_vi.trim().length,
        }));
        const correctEntry = indexed.find((entry) => entry.choice.correct);
        const distractorLens = indexed
          .filter((entry) => !entry.choice.correct)
          .map((entry) => entry.len)
          .sort((a, b) => a - b);
        if (!correctEntry || distractorLens.length === 0) continue;

        const descending = [...indexed].sort(
          (a, b) => b.len - a.len || a.index - b.index,
        );
        const rank = descending.findIndex((entry) => entry.choice.correct);
        lessonRanks.push(rank);

        const bucket = postWave1BySubject.get(lesson.subjectId) ?? {
          total: 0,
          ranks: [0, 0, 0, 0],
        };
        bucket.total += 1;
        if (rank >= 0 && rank < 4) {
          bucket.ranks[rank] += 1;
        }
        postWave1BySubject.set(lesson.subjectId, bucket);

        const correctLen = correctEntry.len;
        const maxDistractorLen = distractorLens[distractorLens.length - 1] ?? 0;
        const medianDistractorLen =
          distractorLens[Math.floor((distractorLens.length - 1) / 2)] ?? 0;

        // A step where every choice is within 2 characters of every other carries
        // no length signal at all, so it cannot be evidence of a tell and must not
        // dilute the count of steps that can.
        const allLens = indexed.map((entry) => entry.len);
        const lengthSpread = Math.max(...allLens) - Math.min(...allLens);
        if (lengthSpread > 2) {
          const dist = distinguishableBySubject.get(lesson.subjectId) ?? {
            total: 0,
            longest: 0,
          };
          dist.total += 1;
          if (distractorLens.every((len) => len < correctLen)) dist.longest += 1;
          distinguishableBySubject.set(lesson.subjectId, dist);
        }

        if (correctLen >= 20 && maxDistractorLen > 0 && correctLen > maxDistractorLen * 1.6) {
          maxRatioViolations.push(
            `${lesson.id}#${step.position} (${correctLen} vs max ${maxDistractorLen})`,
          );
        }
        if (
          correctLen >= 25 &&
          medianDistractorLen > 0 &&
          correctLen > medianDistractorLen * 1.75
        ) {
          medianRatioViolations.push(
            `${lesson.id}#${step.position} (${correctLen} vs median ${medianDistractorLen})`,
          );
        }
      }

      if (lessonRanks.length >= 4 && new Set(lessonRanks).size === 1) {
        monoRankLessons.push(`${lesson.id} (all rank #${(lessonRanks[0] ?? 0) + 1})`);
      }
    }

    for (const [subjectId, dist] of distinguishableBySubject) {
      if (dist.total > 0 && dist.longest / dist.total > 0.4) {
        indistinguishableDilution.push(
          `${subjectId}: correct is strictly longest in ${dist.longest}/${dist.total} distinguishable steps`,
        );
      }
    }

    expect(
      maxRatioViolations,
      "steps where correct label > 1.6x longest distractor",
    ).toEqual([]);
    expect(
      medianRatioViolations,
      "steps where correct label > 1.75x median distractor (single-padded-decoy check)",
    ).toEqual([]);
    expect(
      monoRankLessons,
      "lessons where every MC step shares the exact same length rank",
    ).toEqual([]);
    // Rank share alone can pass on the strength of tied rows: a maths step whose
    // four options are bare numerals ("5", "7", "12", "15") puts the correct
    // answer at a random rank no matter how the labels are written. Those rows
    // dilute the picture, so the tell is also measured only across steps whose
    // choice lengths actually differ enough tobe distinguishable.
    expect(
      indistinguishableDilution,
      "steps where the correct answer is strictly longest among choices that differ by >2 chars",
    ).toEqual([]);
    expect(postWave1BySubject.size).toBe(5);
    for (const [subjectId, { total, ranks }] of postWave1BySubject) {
      expect(
        ranks[0] / total,
        `${subjectId} post-Wave-1 rank #1 (longest) floor so longest is not an auto-elimination tell`,
      ).toBeGreaterThanOrEqual(0.1);
      ranks.forEach((count, rankIndex) => {
        expect(
          count / total,
          `${subjectId} post-Wave-1 rank #${rankIndex + 1} share`,
        ).toBeLessThanOrEqual(0.4);
      });
    }
  });

  it("uses unique skill ids across core (non-baseline) lessons, so a core lesson cannot shadow another's evidence", () => {
    const coreLessons = LESSONS.filter((lesson) => !lesson.isBaseline);
    expect(coreLessons).toHaveLength(90);
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
