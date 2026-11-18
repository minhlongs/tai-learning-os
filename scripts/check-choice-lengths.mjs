#!/usr/bin/env node
/**
 * Choice-length parity checker.
 *
 * A learner who clicks choices by length instead of reading must not be able to
 * pass a mastery threshold. This script measures, for every multiple-choice and
 * reading-comprehension step, which *descending length rank* the correct choice
 * occupies (rank 1 = longest). A healthy set spreads the correct answer across
 * all four ranks; a degenerate set concentrates it on one rank.
 *
 * It penalises two distinct failure modes:
 *   1. Rank concentration  - one rank holds the correct answer far too often.
 *   2. Single padded decoy - one distractor is inflated past the correct choice
 *                            while the other two stay stubs, which moves the tell
 *                            from rank 1 to rank 2 instead of removing it.
 *
 * Usage:
 *   node scripts/check-choice-lengths.mjs               # whole corpus, summary
 *   node scripts/check-choice-lengths.mjs --subject vietnamese
 *   node scripts/check-choice-lengths.mjs --lesson vie-personification
 *   node scripts/check-choice-lengths.mjs --json
 *
 * Exit code is non-zero when any hard limit is breached, so this is usable as a
 * gate. The unit test in test/unit/content-registry.test.ts encodes the same
 * limits; this script exists to make content authoring self-service.
 */
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();
const { LESSONS } = await import("../src/shared/content/index.ts");


/** Hard limits a gated lesson must satisfy. */
export const LIMITS = {
  /** No rank may hold the correct answer more than this share of a subject's steps. */
  maxRankShare: 0.4,
  /** The longest choice must be correct at least this often, so "never pick the longest" is not a safe rule. */
  minLongestShare: 0.1,
  /** correctLen / maxDistractorLen, applied when correctLen >= ratioFloorChars. */
  maxRatio: 1.6,
  /** correctLen / medianDistractorLen, applied when correctLen >= medianFloorChars. Catches single padded decoys. */
  maxMedianRatio: 1.75,
  ratioFloorChars: 20,
  medianFloorChars: 25,
  /**
   * When every choice in a step is within this many characters of every other,
   * length carries no usable signal and the step is excluded from the
   * distinguishable-row ceiling. Without this carve-out a maths step whose
   * options are bare numerals ("5", "7", "12", "15") would be counted as a
   * length tell it cannot possibly be.
   */
  tieSpreadChars: 2,
  /**
   * Among steps where length *is* distinguishable, the correct answer may be
   * strictly longest at most this often. The all-step rank-share ceilings above
   * are dominated by tied rows in subjects like maths, so they can pass while
   * this share sits at 50%; that is the tell this limit exists to catch.
   */
  maxDistinguishableLongestShare: 0.35,
};

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const hit = args.findIndex((a) => a === `--${name}`);
  return hit >= 0 ? args[hit + 1] : undefined;
};

const subjectFilter = value("subject");
const lessonFilter = value("lesson");

/** Steps in a lesson with at least two choices; fraction_visual has none. */
function mcSteps(lesson) {
  return lesson.steps
    .filter((s) => s.content && Array.isArray(s.content.choices))
    .filter((s) => s.content.choices.length >= 2);
}

/**
 * @param {string} lessonId
 * @param {string} subjectId
 */
function lessonSteps(lesson) {
  return mcSteps(lesson).map((step) => {
    const indexed = step.content.choices.map((choice, index) => ({
      id: choice.id,
      correct: Boolean(choice.correct),
      len: choice.label_vi.trim().length,
      index,
    }));
    const descending = [...indexed].sort((a, b) => b.len - a.len || a.index - b.index);
    const correctEntry = indexed.find((c) => c.correct);
    const rank = descending.findIndex((c) => c.correct);
    const distractorLens = indexed
      .filter((c) => !c.correct)
      .map((c) => c.len)
      .sort((a, b) => a - b);
    const medianDistractorLen =
      distractorLens.length === 0
        ? null
        : distractorLens.length % 2 === 1
          ? distractorLens[(distractorLens.length - 1) / 2]
          : distractorLens[distractorLens.length / 2 - 1];
    const maxDistractorLen = distractorLens.length ? Math.max(...distractorLens) : null;
    const allLens = indexed.map((c) => c.len);
    const lengthSpread = Math.max(...allLens) - Math.min(...allLens);
    const correctIsStrictlyLongest =
      distractorLens.length > 0 && distractorLens.every((len) => len < (correctEntry?.len ?? 0));
    return {
      lessonId: lesson.id,
      subjectId: lesson.subjectId,
      position: step.position,
      kind: step.kind,
      correctId: correctEntry?.id,
      correctLen: correctEntry?.len,
      rank,
      rankLabel: `#${rank + 1}`,
      distractorLens,
      medianDistractorLen,
      maxDistractorLen,
      lengthSpread,
      correctIsStrictlyLongest,
      lengths: descending.map((c) => `${c.correct ? "*" : ""}${c.id}:${c.len}`),
    };
  });
}

const lessons = LESSONS.filter((lesson) => {
  if (subjectFilter && lesson.subjectId !== subjectFilter) return false;
  if (lessonFilter && !lesson.id.endsWith(lessonFilter)) return false;
  return true;
});

const allSteps = lessons.flatMap((lesson) => lessonSteps(lesson));

/** @type {Map<string, {total:number, ranks:number[], ratioBreaches:string[], medianBreaches:string[], monoRankLessons:string[]}>} */
const bySubject = new Map();
const perLesson = new Map();

for (const step of allSteps) {
  const bucket = bySubject.get(step.subjectId) ?? {
    total: 0,
    ranks: [0, 0, 0, 0],
    ratioBreaches: [],
    medianBreaches: [],
    distinguishableTotal: 0,
    distinguishableLongest: 0,
  };
  bucket.total += 1;
  bucket.ranks[step.rank] += 1;

  // Only steps whose choices differ enough in length to be distinguishable can
  // carry a length tell. Tied maths rows ("5" / "7" / "12" / "15") are counted
  // in the rank table but excluded here, so a subject cannot hide an exploitable
  // tell behind a pile of rows where length means nothing.
  if (step.lengthSpread > LIMITS.tieSpreadChars) {
    bucket.distinguishableTotal += 1;
    if (step.correctIsStrictlyLongest) bucket.distinguishableLongest += 1;
  }

  const { correctLen, maxDistractorLen, medianDistractorLen } = step;
  if (
    correctLen >= LIMITS.ratioFloorChars &&
    maxDistractorLen > 0 &&
    correctLen > maxDistractorLen * LIMITS.maxRatio
  ) {
    bucket.ratioBreaches.push(
      `${step.lessonId}#${step.position} correct=${correctLen} maxDistractor=${maxDistractorLen} ratio=${(correctLen / maxDistractorLen).toFixed(2)}`,
    );
  }
  if (
    correctLen >= LIMITS.medianFloorChars &&
    medianDistractorLen > 0 &&
    correctLen > medianDistractorLen * LIMITS.maxMedianRatio
  ) {
    bucket.medianBreaches.push(
      `${step.lessonId}#${step.position} correct=${correctLen} lens=[${step.distractorLens.join(",")}] median=${medianDistractorLen} ratio=${(correctLen / medianDistractorLen).toFixed(2)}`,
    );
  }
  bySubject.set(step.subjectId, bucket);

  const lessonBucket = perLesson.get(step.lessonId) ?? { subjectId: step.subjectId, ranks: [] };
  lessonBucket.ranks.push(step.rank);
  perLesson.set(step.lessonId, lessonBucket);
}

const monoRankLessons = [...perLesson.entries()]
  .filter(([, v]) => v.ranks.length >= 4 && new Set(v.ranks).size === 1)
  .map(([id, v]) => `${id} (${v.subjectId}) all ${v.ranks.map((r) => `#${r + 1}`).join("")}`);

const failures = [];

for (const [subjectId, bucket] of bySubject) {
  if (bucket.total === 0) continue;
  bucket.ranks.forEach((count, rank) => {
    const share = count / bucket.total;
    if (share > LIMITS.maxRankShare) {
      failures.push(
        `${subjectId}: rank #${rank + 1} holds ${count}/${bucket.total} = ${(share * 100).toFixed(1)}% (limit ${LIMITS.maxRankShare * 100}%)`,
      );
    }
  });
  const longestShare = bucket.ranks[0] / bucket.total;
  if (longestShare < LIMITS.minLongestShare) {
    failures.push(
      `${subjectId}: longest choice is correct only ${bucket.ranks[0]}/${bucket.total} = ${(longestShare * 100).toFixed(1)}% (floor ${LIMITS.minLongestShare * 100}%) - "never pick the longest" is a safe elimination rule`,
    );
  }
  if (bucket.distinguishableTotal > 0) {
    const share = bucket.distinguishableLongest / bucket.distinguishableTotal;
    if (share > LIMITS.maxDistinguishableLongestShare) {
      failures.push(
        `${subjectId}: among ${bucket.distinguishableTotal} steps whose lengths differ by >${LIMITS.tieSpreadChars} chars, the correct answer is strictly longest ${bucket.distinguishableLongest} times = ${(share * 100).toFixed(1)}% (limit ${LIMITS.maxDistinguishableLongestShare * 100}%)`,
      );
    }
  }
  failures.push(...bucket.ratioBreaches.map((b) => `${subjectId}: ${b}`));
  failures.push(...bucket.medianBreaches.map((b) => `${subjectId}: ${b}`));
}
failures.push(...monoRankLessons.map((m) => `mono-rank lesson: ${m}`));

if (flag("json")) {
  console.log(
    JSON.stringify(
      {
        steps: allSteps.length,
        lessons: lessons.length,
        limits: LIMITS,
        bySubject: Object.fromEntries(bySubject),
        monoRankLessons,
        failures,
      },
      null,
      2,
    ),
  );
} else {
  console.log(`Checked ${allSteps.length} multiple-choice steps across ${lessons.length} lessons.\n`);
  console.log("Correct-answer length rank (1 = longest), share per subject:");
  console.log("  subject            steps   #1     #2     #3     #4   longest|distinguishable");
  for (const [subjectId, bucket] of [...bySubject].sort()) {
    const shares = bucket.ranks.map(
      (count) => `${((count / bucket.total) * 100).toFixed(1)}%`.padStart(6),
    );
    const distShare =
      bucket.distinguishableTotal > 0
        ? `${((bucket.distinguishableLongest / bucket.distinguishableTotal) * 100).toFixed(0)}% of ${bucket.distinguishableTotal}`
        : "n/a";
    console.log(
      `  ${subjectId.padEnd(18)} ${String(bucket.total).padStart(4)}  ${shares.join(" ")}   ${distShare}`,
    );
  }

  const ratio = bucket => bucket.ratioBreaches.length + bucket.medianBreaches.length;
  const totalRatio = [...bySubject.values()].reduce((n, b) => n + ratio(b), 0);
  console.log(`\nLength-ratio breaches: ${totalRatio}`);
  for (const [subjectId, bucket] of bySubject) {
    for (const b of bucket.medianBreaches) console.log(`  ${subjectId} MEDIAN ${b}`);
    for (const b of bucket.ratioBreaches) console.log(`  ${subjectId} MAX    ${b}`);
  }

  console.log(`\nMono-rank lessons (all steps same rank): ${monoRankLessons.length}`);
  for (const m of monoRankLessons) console.log(`  ${m}`);

  if (failures.length === 0) {
    console.log("\nPASS - every limit satisfied.");
  } else {
    console.log(`\nFAIL - ${failures.length} limit breach(es).`);
  }
}

process.exit(failures.length === 0 ? 0 : 1);
