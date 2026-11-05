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
import { fractionsCompare } from "./math/fractions-compare";
import { wordProblems } from "./math/word-problems";
import { areaMeasurement } from "./math/area-measurement";
import { decimalPlaceValue } from "./math/decimal-place-value";
import { decimalAddSubtract } from "./math/decimal-add-subtract";
import { percentOfNumber } from "./math/percent-of-number";
import { circleArea } from "./math/circle-area";
import { baselineMathGrade4 } from "./math/baseline-math-grade4";
import { baselineMathGrade5 } from "./math/baseline-math-grade5";

import { simpleSentences } from "./english/simple-sentences";
import { everydayNouns } from "./english/everyday-nouns";
import { homeVocabulary } from "./english/home-vocabulary";
import { greetingsDialogue } from "./english/greetings-dialogue";
import { pastSimple } from "./english/past-simple";
import { comparatives } from "./english/comparatives";
import { dailyRoutine } from "./english/daily-routine";
import { directions } from "./english/directions";
import { baselineEnglishGrade4 } from "./english/baseline-english-grade4";
import { baselineEnglishGrade5 } from "./english/baseline-english-grade5";

import { readingMainIdea } from "./vietnamese/reading-main-idea";
import { sentenceClarity } from "./vietnamese/sentence-clarity";
import { findEvidence } from "./vietnamese/find-evidence";
import { storyLesson } from "./vietnamese/story-lesson";
import { paragraphStructure } from "./vietnamese/paragraph-structure";
import { figurativeLanguage } from "./vietnamese/figurative-language";
import { inference } from "./vietnamese/inference";
import { sentenceLinking } from "./vietnamese/sentence-linking";
import { baselineVietnameseGrade4 } from "./vietnamese/baseline-vietnamese-grade4";
import { baselineVietnameseGrade5 } from "./vietnamese/baseline-vietnamese-grade5";

import { waterCycle } from "./science/water-cycle";
import { plantNeeds } from "./science/plant-needs";
import { statesOfMatter } from "./science/states-of-matter";
import { lightAndShadow } from "./science/light-and-shadow";
import { lifeCycles } from "./science/life-cycles";
import { foodChains } from "./science/food-chains";
import { energyForms } from "./science/energy-forms";
import { environment } from "./science/environment";
import { baselineScienceGrade4 } from "./science/baseline-science-grade4";
import { baselineScienceGrade5 } from "./science/baseline-science-grade5";

import { claimAndReason } from "./debate/claim-and-reason";
import { factVsOpinion } from "./debate/fact-vs-opinion";
import { evidenceRelevance } from "./debate/evidence-relevance";
import { counterargumentRespect } from "./debate/counterargument-respect";
import { argumentStructure } from "./debate/argument-structure";
import { sourceCredibility } from "./debate/source-credibility";
import { fallacies } from "./debate/fallacies";
import { civilDisagreement } from "./debate/civil-disagreement";
import { baselineDebateGrade4 } from "./debate/baseline-debate-grade4";
import { baselineDebateGrade5 } from "./debate/baseline-debate-grade5";

export const LESSONS: readonly LessonDefinition[] = [
  // Toán
  fractionsEquivalent,
  fractionsCompare,
  wordProblems,
  areaMeasurement,
  decimalPlaceValue,
  decimalAddSubtract,
  percentOfNumber,
  circleArea,
  // Tiếng Anh
  simpleSentences,
  everydayNouns,
  homeVocabulary,
  greetingsDialogue,
  pastSimple,
  comparatives,
  dailyRoutine,
  directions,
  // Tiếng Việt
  readingMainIdea,
  sentenceClarity,
  findEvidence,
  storyLesson,
  paragraphStructure,
  figurativeLanguage,
  inference,
  sentenceLinking,
  // Khoa học
  waterCycle,
  plantNeeds,
  statesOfMatter,
  lightAndShadow,
  lifeCycles,
  foodChains,
  energyForms,
  environment,
  // Tư duy phản biện
  claimAndReason,
  factVsOpinion,
  evidenceRelevance,
  counterargumentRespect,
  argumentStructure,
  sourceCredibility,
  fallacies,
  civilDisagreement,
  // Khảo sát năng lực đầu vào (Phụ huynh giám sát)
  baselineMathGrade4,
  baselineEnglishGrade4,
  baselineVietnameseGrade4,
  baselineScienceGrade4,
  baselineDebateGrade4,
  baselineMathGrade5,
  baselineEnglishGrade5,
  baselineVietnameseGrade5,
  baselineScienceGrade5,
  baselineDebateGrade5,
];
