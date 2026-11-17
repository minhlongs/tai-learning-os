/**
 * Lessons that shipped in Wave 1, before choice-length parity was gated.
 *
 * These are exempt from the strict length-rank ceilings in
 * `test/unit/content-registry.test.ts` and `scripts/check-choice-lengths.mjs`.
 * The list lives here once so the gate that blocks a merge and the script that
 * authors run locally can never disagree about which lessons are exempt.
 *
 * Removing an id from this list subjects that lesson to the Wave 2 ceilings.
 * Issue #71 tracks rebalancing the remaining Wave 1 lessons so this file can be
 * deleted entirely.
 */
export const WAVE1_LEGACY_IDS: ReadonlySet<string> = new Set([
  "deb-argument-structure", "deb-baseline-grade4", "deb-baseline-grade5",
  "deb-civil-disagreement", "deb-claim-reason", "deb-counterargument-respect",
  "deb-evidence-relevance", "deb-fact-opinion", "deb-fallacies", "deb-source-credibility",
  "eng-baseline-grade4", "eng-baseline-grade5", "eng-comparatives", "eng-daily-routine",
  "eng-directions", "eng-everyday-nouns", "eng-greetings-dialogue", "eng-home-vocabulary",
  "eng-past-simple", "eng-simple-sentences",
  "math-area-measurement", "math-baseline-grade4", "math-baseline-grade5", "math-circle",
  "math-dec-add-sub", "math-dec-place-value", "math-fractions-compare",
  "math-fractions-equivalent", "math-percent", "math-word-problems",
  "sci-baseline-grade4", "sci-baseline-grade5", "sci-energy-forms", "sci-environment",
  "sci-food-chains", "sci-life-cycles", "sci-light-and-shadow", "sci-plant-needs",
  "sci-states-of-matter", "sci-water-cycle",
  "vie-baseline-grade4", "vie-baseline-grade5", "vie-figurative-language",
  "vie-find-evidence", "vie-inference", "vie-paragraph-structure",
  "vie-reading-main-idea", "vie-sentence-clarity", "vie-sentence-linking",
  "vie-story-lesson",
]);
