/**
 * The lesson registry.
 *
 * `LESSONS` is the seed source walked by the seed script: the script reads each
 * lesson, writes it once, and re-writes it whenever the object changes, so the
 * database always reflects this array. The seed validates every step against
 * `validateExercise` before it inserts anything, so a broken lesson fails the
 * seed rather than reaching the learner.
 *
 * Skill ids must match the catalogue installed by
 * migrations/0002_reference_content.sql; only that skill id makes a lesson
 * attach to a real skill. The seed only inserts lessons for skills already in
 * the `skills` table, so a skill the catalogue does not know about falls out of
 * the insert and the lesson silently never appears.
 */

import type { LessonDefinition } from "./types";

import { fractionsEquivalent } from "./math/fractions-equivalent";
import { wordProblems } from "./math/word-problems";
import { areaMeasurement } from "./math/area-measurement";
import { baselineMathGrade4 } from "./math/baseline-math-grade4";

import { simpleSentences } from "./english/simple-sentences";
import { everydayNouns } from "./english/everyday-nouns";
import { greetingsDialogue } from "./english/greetings-dialogue";
import { baselineEnglishGrade4 } from "./english/baseline-english-grade4";

import { readingMainIdea } from "./vietnamese/reading-main-idea";
import { sentenceClarity } from "./vietnamese/sentence-clarity";
import { findEvidence } from "./vietnamese/find-evidence";
import { baselineVietnameseGrade4 } from "./vietnamese/baseline-vietnamese-grade4";

export const LESSONS: readonly LessonDefinition[] = [
  // Toán
  fractionsEquivalent,
  wordProblems,
  areaMeasurement,
  // Tiếng Anh
  simpleSentences,
  everydayNouns,
  greetingsDialogue,
  // Tiếng Việt
  readingMainIdea,
  sentenceClarity,
  findEvidence,
  // Khảo sát năng lực đầu vào (Phụ huynh giám sát)
  baselineMathGrade4,
  baselineEnglishGrade4,
  baselineVietnameseGrade4,
];
