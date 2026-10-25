/**
 * Spaced-review scheduler.
 *
 * Deterministic and explainable: the interval ladder is a plain input, and the
 * due date is a pure function of (last result, failure streak, interval ladder).
 * No randomness, so the parent can audit and argue with every schedule.
 *
 * These intervals are starting assumptions for this MVP — NOT validated
 * thresholds for this learner. They are configuration, not findings.
 */

import type { AttemptEvidence } from "./competency";
import { isIndependentAttempt } from "./competency";

export const REVIEW_CONFIG = {
  /** Interval ladder in days, climbed on each successful review. */
  intervals: [1, 3, 7, 14] as const,
  /** Interval used for the first scheduled review after independent learning. */
  initialIntervalDays: 1,
  /** Interval after a failed review — rescheduled, not dropped. */
  failureRetryDays: 1,
  /** A skill with more than this many consecutive failures is flagged for parent review. */
  failureEscalation: 3,
} as const;

export const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewDecision = {
  dueAt: number;
  intervalDays: number;
  failureStreak: number;
  /** Why this schedule was chosen — shown in the parent dashboard. */
  reasonVi: string;
};

/**
 * Decide when a skill should next be reviewed.
 *
 * The ladder is climbed by SCHEDULED REVIEW successes, not by elapsed time and
 * not by total attempt count: the first independent solve gets the first rung,
 * and each subsequent review that the learner answers independently moves one
 * rung up. That is what makes the interval mean "time since it was last
 * retained" rather than "time this skill has existed".
 *
 * A failure drops back to the first rung, so a learner who struggled restarts
 * with tomorrow rather than being pushed out to fourteen days.
 *
 * @param attempts  full attempt history for the skill
 * @param nowMs     current time, passed in so the function stays pure and testable
 */
export function scheduleReview(
  attempts: readonly AttemptEvidence[],
  nowMs: number,
): ReviewDecision | null {
  // Nothing solved yet -> nothing to schedule.
  if (attempts.every((a) => a.outcome !== "correct")) {
    return null;
  }

  const byTime = [...attempts].sort((a, b) => a.createdAt - b.createdAt);

  // The decision point is the last attempt the learner answered CORRECTLY. A
  // failure recorded after that solve is an input to the NEXT scheduling
  // decision, not this one: it has not yet disproven anything the learner
  // knew when they solved it.
  const lastCorrect = byTime.filter((a) => a.outcome === "correct").pop();
  if (!lastCorrect) return null;

  // Check if any scheduled review attempt failed after the last correct solve.
  const trailingFailedReviews = byTime.filter(
    (a) => a.createdAt > lastCorrect.createdAt && a.isReview && a.outcome !== "correct",
  );
  if (trailingFailedReviews.length > 0) {
    const interval = REVIEW_CONFIG.failureRetryDays;
    return {
      dueAt: nowMs + interval * DAY_MS,
      intervalDays: interval,
      failureStreak: trailingFailedReviews.length,
      reasonVi: "Em chưa nhớ kỹ năng ở lần ôn tập gần nhất, cần ôn lại sau 1 ngày.",
    };
  }

  // Only an independent review success climbs the ladder. An assisted or
  // unsolved attempt is evidence of needing help, not of retention.
  const canClimb = isIndependentAttempt(lastCorrect);

  // The run of wrong answers leading up to this decision point. The solve
  // itself is excluded (or the run would always be zero). When the solve
  // needed help it JOINS the run, so a parent sees "1" after an assisted
  // answer rather than a clean-looking zero that hides the help.
  const precedingFailures = countTrailingFailures(byTime, lastCorrect.createdAt, true);
  const failureStreak = canClimb ? precedingFailures : precedingFailures + 1;

  if (!canClimb) {
    const interval = REVIEW_CONFIG.failureRetryDays;
    return {
      dueAt: nowMs + interval * DAY_MS,
      intervalDays: interval,
      failureStreak,
      reasonVi: "Em cần ôn lại sớm vì lần làm gần nhất chưa tự làm được.",
    };
  }

  // Ladder position: how many independent reviews the learner has already
  // cleared since the most recent failed review, counting this one as the rung it earns.
  const lastFailedReviewAt = byTime
    .filter((a) => a.isReview && !isIndependentAttempt(a))
    .reduce((max, a) => (a.createdAt > max ? a.createdAt : max), -Infinity);
  const reviewWins = byTime.filter(
    (a) => a.isReview && isIndependentAttempt(a) && a.createdAt > lastFailedReviewAt,
  ).length;
  const stepIndex = Math.min(reviewWins, REVIEW_CONFIG.intervals.length - 1);
  const intervalDays = REVIEW_CONFIG.intervals[stepIndex] ?? REVIEW_CONFIG.initialIntervalDays;

  return {
    dueAt: nowMs + intervalDays * DAY_MS,
    intervalDays,
    // A failure run right before the solve is reported, but it does not erase
    // the rung the learner has already climbed.
    failureStreak,
    reasonVi:
      failureStreak > 0
        ? `Em đã vượt qua sau ${failureStreak} lần chưa đạt, nên tiếp tục chu kỳ ${intervalDays} ngày.`
        : `Em làm độc lập được, ôn tiếp sau ${intervalDays} ngày.`,
  };
}

/**
 * How many attempts immediately before `beforeMs` ended incorrectly.
 *
 * `exclusive` skips an attempt recorded at exactly `beforeMs`, so the caller can
 * count the failures that led UP TO an attempt rather than including it.
 */
function countTrailingFailures(
  attempts: readonly AttemptEvidence[],
  beforeMs: number,
  exclusive = false,
): number {
  const relevant = exclusive
    ? attempts.filter((a) => a.createdAt < beforeMs)
    : attempts.filter((a) => a.createdAt <= beforeMs);
  const sorted = relevant.sort((a, b) => b.createdAt - a.createdAt);

  let failures = 0;
  for (const attempt of sorted) {
    if (attempt.outcome === "incorrect") failures += 1;
    else if (attempt.outcome === "correct") break;
  }
  return failures;
}

/** Which skills are due for review now, most overdue first. */
export function selectDueForReview<T extends { dueAt: number; skillId: string }>(
  queue: readonly T[],
  nowMs: number,
): T[] {
  return queue
    .filter((entry) => entry.dueAt <= nowMs)
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * Flag for the parent, not the learner: a skill that keeps failing needs a
 * human decision, not another automated retry.
 */
export function needsParentAttention(
  attempts: readonly AttemptEvidence[],
): boolean {
  const sorted = [...attempts].sort((a, b) => b.createdAt - a.createdAt);
  let consecutiveFailures = 0;
  for (const attempt of sorted) {
    if (attempt.outcome === "incorrect") {
      consecutiveFailures += 1;
    } else if (attempt.outcome === "correct" && isIndependentAttempt(attempt)) {
      break;
    }
  }
  return consecutiveFailures >= REVIEW_CONFIG.failureEscalation;
}
