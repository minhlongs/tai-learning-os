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
 * migrations/0002_reference_content.sql,
 * migrations/0008_grade4_curriculum_expansion.sql,
 * migrations/0010_phase3_science_debate_and_school_years.sql,
 * migrations/0011_science_and_debate_parity.sql,
 * migrations/0014_grade5_curriculum_expansion.sql, and
 * migrations/0017_grade4_grade5_curriculum_wave2.sql; only that
 * skill id makes a lesson attach to a real skill. The seed only inserts lessons
 * for skills already in the `skills` table, so a skill the catalogue does not
 * know about falls out of the insert and the lesson silently never appears.
 */

import type { LessonDefinition } from "./types";

import { fractionsIdentify } from "./math/fractions-identify";
import { fractionsEquivalent } from "./math/fractions-equivalent";
import { fractionsCompare } from "./math/fractions-compare";
import { fractionsAddSub } from "./math/fractions-add-sub";
import { multiDigitOps } from "./math/multi-digit-ops";
import { averageValue } from "./math/average-value";
import { wordProblems } from "./math/word-problems";
import { anglesAndLines } from "./math/angles-and-lines";
import { areaMeasurement } from "./math/area-measurement";
import { decimalPlaceValue } from "./math/decimal-place-value";
import { decimalAddSubtract } from "./math/decimal-add-subtract";
import { decimalsMulDiv } from "./math/decimals-mul-div";
import { ratiosAndScales } from "./math/ratios-and-scales";
import { percentOfNumber } from "./math/percent-of-number";
import { triangleTrapezoidArea } from "./math/triangle-trapezoid-area";
import { circleArea } from "./math/circle-area";
import { cuboidVolume } from "./math/cuboid-volume";
import { speedDistanceTime } from "./math/speed-distance-time";
import { baselineMathGrade4 } from "./math/baseline-math-grade4";
import { baselineMathGrade5 } from "./math/baseline-math-grade5";

import { simpleSentences } from "./english/simple-sentences";
import { everydayNouns } from "./english/everyday-nouns";
import { homeVocabulary } from "./english/home-vocabulary";
import { greetingsDialogue } from "./english/greetings-dialogue";
import { schoolSubjects } from "./english/school-subjects";
import { timeActivities } from "./english/time-activities";
import { canAbilities } from "./english/can-abilities";
import { weatherClothes } from "./english/weather-clothes";
import { presentContinuous } from "./english/present-continuous";
import { pastSimple } from "./english/past-simple";
import { comparatives } from "./english/comparatives";
import { dailyRoutine } from "./english/daily-routine";
import { directions } from "./english/directions";
import { futurePlans } from "./english/future-plans";
import { healthAdvice } from "./english/health-advice";
import { frequencyAdverbs } from "./english/frequency-adverbs";
import { superlatives } from "./english/superlatives";
import { shortEmailReading } from "./english/short-email-reading";
import { baselineEnglishGrade4 } from "./english/baseline-english-grade4";
import { baselineEnglishGrade5 } from "./english/baseline-english-grade5";

import { readingMainIdea } from "./vietnamese/reading-main-idea";
import { sentenceClarity } from "./vietnamese/sentence-clarity";
import { findEvidence } from "./vietnamese/find-evidence";
import { storyLesson } from "./vietnamese/story-lesson";
import { wordClasses } from "./vietnamese/word-classes";
import { subjectPredicate } from "./vietnamese/subject-predicate";
import { adverbials } from "./vietnamese/adverbials";
import { personification } from "./vietnamese/personification";
import { descriptiveWriting } from "./vietnamese/descriptive-writing";
import { paragraphStructure } from "./vietnamese/paragraph-structure";
import { figurativeLanguage } from "./vietnamese/figurative-language";
import { inference } from "./vietnamese/inference";
import { sentenceLinking } from "./vietnamese/sentence-linking";
import { synonymsPolysemy } from "./vietnamese/synonyms-polysemy";
import { compoundSentences } from "./vietnamese/compound-sentences";
import { pronounSubstitution } from "./vietnamese/pronoun-substitution";
import { infoTextSummary } from "./vietnamese/info-text-summary";
import { expressiveArgument } from "./vietnamese/expressive-argument";
import { baselineVietnameseGrade4 } from "./vietnamese/baseline-vietnamese-grade4";
import { baselineVietnameseGrade5 } from "./vietnamese/baseline-vietnamese-grade5";

import { waterCycle } from "./science/water-cycle";
import { plantNeeds } from "./science/plant-needs";
import { statesOfMatter } from "./science/states-of-matter";
import { lightAndShadow } from "./science/light-and-shadow";
import { airProperties } from "./science/air-properties";
import { soundWaves } from "./science/sound-waves";
import { heatConductors } from "./science/heat-conductors";
import { nutrientsHealth } from "./science/nutrients-health";
import { fungiBacteria } from "./science/fungi-bacteria";
import { lifeCycles } from "./science/life-cycles";
import { foodChains } from "./science/food-chains";
import { energyForms } from "./science/energy-forms";
import { environment } from "./science/environment";
import { soilErosion } from "./science/soil-erosion";
import { mixturesSolutions } from "./science/mixtures-solutions";
import { chemicalPhysicalChange } from "./science/chemical-physical-change";
import { simpleCircuits } from "./science/simple-circuits";
import { floweringReproduction } from "./science/flowering-reproduction";
import { baselineScienceGrade4 } from "./science/baseline-science-grade4";
import { baselineScienceGrade5 } from "./science/baseline-science-grade5";

import { claimAndReason } from "./debate/claim-and-reason";
import { factVsOpinion } from "./debate/fact-vs-opinion";
import { evidenceRelevance } from "./debate/evidence-relevance";
import { counterargumentRespect } from "./debate/counterargument-respect";
import { clarifyingQuestions } from "./debate/clarifying-questions";
import { exampleVsRule } from "./debate/example-vs-rule";
import { causeVsCoincidence } from "./debate/cause-vs-coincidence";
import { fairComparison } from "./debate/fair-comparison";
import { restatingFairly } from "./debate/restating-fairly";
import { argumentStructure } from "./debate/argument-structure";
import { sourceCredibility } from "./debate/source-credibility";
import { fallacies } from "./debate/fallacies";
import { civilDisagreement } from "./debate/civil-disagreement";
import { hiddenAssumptions } from "./debate/hidden-assumptions";
import { weighingProsCons } from "./debate/weighing-pros-cons";
import { rebuttalEvidence } from "./debate/rebuttal-evidence";
import { changingMind } from "./debate/changing-mind";
import { structuredConclusion } from "./debate/structured-conclusion";
import { baselineDebateGrade4 } from "./debate/baseline-debate-grade4";
import { baselineDebateGrade5 } from "./debate/baseline-debate-grade5";

export const LESSONS: readonly LessonDefinition[] = [
  // Toán
  fractionsIdentify,
  fractionsEquivalent,
  fractionsCompare,
  fractionsAddSub,
  multiDigitOps,
  averageValue,
  wordProblems,
  anglesAndLines,
  areaMeasurement,
  decimalPlaceValue,
  decimalAddSubtract,
  decimalsMulDiv,
  ratiosAndScales,
  percentOfNumber,
  triangleTrapezoidArea,
  circleArea,
  cuboidVolume,
  speedDistanceTime,
  // Tiếng Anh
  simpleSentences,
  everydayNouns,
  homeVocabulary,
  greetingsDialogue,
  schoolSubjects,
  timeActivities,
  canAbilities,
  weatherClothes,
  presentContinuous,
  pastSimple,
  comparatives,
  dailyRoutine,
  directions,
  futurePlans,
  healthAdvice,
  frequencyAdverbs,
  superlatives,
  shortEmailReading,
  // Tiếng Việt
  readingMainIdea,
  sentenceClarity,
  findEvidence,
  storyLesson,
  wordClasses,
  subjectPredicate,
  adverbials,
  personification,
  descriptiveWriting,
  paragraphStructure,
  figurativeLanguage,
  inference,
  sentenceLinking,
  synonymsPolysemy,
  compoundSentences,
  pronounSubstitution,
  infoTextSummary,
  expressiveArgument,
  // Khoa học
  waterCycle,
  plantNeeds,
  statesOfMatter,
  lightAndShadow,
  airProperties,
  soundWaves,
  heatConductors,
  nutrientsHealth,
  fungiBacteria,
  lifeCycles,
  foodChains,
  energyForms,
  environment,
  soilErosion,
  mixturesSolutions,
  chemicalPhysicalChange,
  simpleCircuits,
  floweringReproduction,
  // Tư duy phản biện
  claimAndReason,
  factVsOpinion,
  evidenceRelevance,
  counterargumentRespect,
  clarifyingQuestions,
  exampleVsRule,
  causeVsCoincidence,
  fairComparison,
  restatingFairly,
  argumentStructure,
  sourceCredibility,
  fallacies,
  civilDisagreement,
  hiddenAssumptions,
  weighingProsCons,
  rebuttalEvidence,
  changingMind,
  structuredConclusion,
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
