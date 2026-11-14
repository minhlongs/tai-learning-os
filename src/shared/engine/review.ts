/**
 * Spaced-review scheduler.
 *
 * Intervals are computed by FSRS-6 (`ts-fsrs` 6.0.0), not by a hand-picked
 * ladder. The decision is still deterministic: the FSRS card state is rebuilt
 * by replaying the learner's own attempt history forward, with fuzzing and
 * short-term (sub-day) steps disabled, so the same history always yields the
 * same interval and the parent can audit and argue with every schedule.
 *
 * Two policy rules stay ours, not FSRS's:
 *   - a failed review is retried the next day rather than at whatever interval
 *     FSRS would assign a lapse;
 *   - a solve that needed help schedules the next day, because FSRS would
 *     otherwise treat assistance as memory.
 *
 * `maximumIntervalDays` is a ceiling for a 4th grader, not a claim about the
 * model. Both are recorded as consequences in `docs/adr/ADR-002`.
 *
 * Calendar days: every interval is emitted as an exact multiple of 24 hours,
 * so the due date lands on the same clock time N calendar days later. Vietnam
 * has no daylight saving, so for `Asia/Ho_Chi_Minh` that is also exactly N
 * calendar days later in the child's own timezone. `dueOnVi` makes that date
 * visible instead of implicit.
 */

import {
  FSRSVersion,
  Rating,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Grade,
} from "ts-fsrs";

import type { AttemptEvidence } from "./competency";
import { isIndependentAttempt } from "./competency";

export const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_CONFIG = {
  /**
   * Target probability of recall at the due date. 0.9 is FSRS's own default and
   * is tuned for adult self-study; a 4th grader loses more from a lapse (lost
   * confidence, a re-taught step) than an adult does, so this asks for 0.95.
   */
  requestRetention: 0.95,
  /**
   * Ceiling for this learner. At 0.95 the uncapped ladder reaches 72 days by the
   * fifth success; a month is long enough that a 9-year-old still recalls it and
   * short enough that a forgotten skill resurfaces inside a school term, before
   * the parent would notice the gap only at the next report card.
   */
  maximumIntervalDays: 30,
  /** Interval after a failed review — retried tomorrow, not at an FSRS lapse. */
  failureRetryDays: 1,
  /** Floor for any computed interval; a review is never same-day. */
  minimumIntervalDays: 1,
  /** A skill with this many consecutive failures is flagged for parent review. */
  failureEscalation: 3,
} as const;

export type ReviewDecision = {
  dueAt: number;
  intervalDays: number;
  /** Due date as a `YYYY-MM-DD` calendar date in Asia/Ho_Chi_Minh. */
  dueOnVi: string;
  failureStreak: number;
  /** Why this schedule was chosen — shown in the parent dashboard. */
  reasonVi: string;
};

/**
 * The FSRS scheduler.
 *
 * `enable_fuzz: false` keeps the output reproducible: fuzzing deliberately
 * spreads intervals to avoid massed due dates, which would make this function
 * impure and untestable. `enable_short_term: false` drops the sub-day learning
 * steps; this household has one session per day, so a 10-minute step would
 * mark a skill due before the child next opens the app.
 */
const scheduler = fsrs(
  generatorParameters({
    request_retention: REVIEW_CONFIG.requestRetention,
    maximum_interval: REVIEW_CONFIG.maximumIntervalDays,
    enable_fuzz: false,
    enable_short_term: false,
  }),
);

/**
 * Map one attempt onto an FSRS grade.
 *
 * Only an unassisted correct solve is `Good`. An assisted solve is `Hard`:
 * the child reached the answer, but with help, so FSRS should not read it as
 * evidence of durable memory. A wrong answer is `Again`.
 */
function gradeFor(attempt: AttemptEvidence): Grade {
  if (attempt.outcome !== "correct") return Rating.Again;
  return isIndependentAttempt(attempt) ? Rating.Good : Rating.Hard;
}

/**
 * Replay the attempt history through FSRS in the order the learner lived it.
 *
 * Each `next()` call is given the real timestamp of the attempt, so FSRS sees
 * the actual gap since the card was last reviewed. That is the whole point of
 * the model: a solve two weeks later is stronger evidence than the same solve
 * an hour later. Feeding it uniform gaps would produce a plausible-looking
 * number with no basis in what the child actually did.
 *
 * The card is derived here, from the ledger, on every call. `skill_estimate`
 * stores a copy of this result for inspection, but that copy is a cache with a
 * proof obligation (it records the ledger prefix it came from), never a source
 * of truth — see ADR-005. Recomputing from `learning_attempts` must always
 * reproduce what was written.
 *
 * `parent_correction` rows are skipped — they record the parent's claim, not
 * the learner's performance, and grading them would let a well-meant override
 * silently rewrite the memory model.
 */
function replay(attempts: readonly AttemptEvidence[]): Card {
  const ordered = attempts
    .filter((a) => a.evidenceKind !== "parent_correction")
    .sort((a, b) => a.createdAt - b.createdAt);

  let card = createEmptyCard(new Date(ordered[0]?.createdAt ?? 0));
  for (const attempt of ordered) {
    card = scheduler.next(card, new Date(attempt.createdAt), gradeFor(attempt)).card;
  }
  return card;
}

/** `YYYY-MM-DD` for an instant, in Asia/Ho_Chi_Minh (UTC+7, no DST). */
export function vnCalendarDate(ms: number): string {
  const shifted = new Date(ms + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Decide when a skill should next be reviewed.
 *
 * The decision point is the last attempt the learner answered CORRECTLY. A
 * failure recorded after that solve is an input to the NEXT decision, not this
 * one: it has not yet disproven anything the learner knew when they solved it.
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
  const lastCorrect = byTime.filter((a) => a.outcome === "correct").pop();
  if (!lastCorrect) return null;

  // A failed scheduled review after the last solve means the skill did not
  // survive the interval: retry tomorrow rather than trusting FSRS's lapse
  // interval, which assumes the learner was actually recalling the item.
  const trailingFailedReviews = byTime.filter(
    (a) => a.createdAt > lastCorrect.createdAt && a.isReview && a.outcome !== "correct",
  );
  if (trailingFailedReviews.length > 0) {
    return decide(nowMs, REVIEW_CONFIG.failureRetryDays, trailingFailedReviews.length,
      "Em chưa nhớ kỹ năng ở lần ôn tập gần nhất, cần ôn lại sau 1 ngày.");
  }

  // Only an independent solve earns a computed interval. An assisted or
  // unsolved attempt is evidence of needing help, not of retention.
  const canClimb = isIndependentAttempt(lastCorrect);

  // The run of wrong answers leading up to this decision point. The solve
  // itself is excluded (or the run would always be zero). When the solve
  // needed help it JOINS the run, so a parent sees "1" after an assisted
  // answer rather than a clean-looking zero that hides the help.
  const precedingFailures = countTrailingFailures(byTime, lastCorrect.createdAt, true);
  const failureStreak = canClimb ? precedingFailures : precedingFailures + 1;

  if (!canClimb) {
    return decide(nowMs, REVIEW_CONFIG.failureRetryDays, failureStreak,
      "Em cần ôn lại sớm vì lần làm gần nhất chưa tự làm được.");
  }

  // Replay only up to and including this solve: a later attempt is the next
  // decision's input, and folding it in here would answer a question the
  // parent has not asked yet.
  const upToSolve = byTime.filter((a) => a.createdAt <= lastCorrect.createdAt);
  const card = replay(upToSolve);
  const intervalDays = clampInterval(card.scheduled_days);

  return decide(
    nowMs,
    intervalDays,
    failureStreak,
    failureStreak > 0
      ? `Em đã vượt qua sau ${failureStreak} lần chưa đạt; FSRS tính chu kỳ ${intervalDays} ngày.`
      : `Em làm độc lập được; FSRS tính chu kỳ ${intervalDays} ngày.`,
  );
}

/**
 * The stored form of the memory estimate (layer 3 of the four-layer model).
 *
 * Every field here is a number FSRS computed from `learning_attempts`; the two
 * ledger fields at the bottom say WHICH ledger prefix produced them, so a
 * reader can tell a current estimate from a stale one without re-running the
 * model, and can re-run the model to check the number.
 */
export type SkillEstimate = {
  stability: number;
  difficulty: number;
  /** Probability the child still recalls it, at `computedAt`. */
  retrievabilityAt: number;
  reps: number;
  lapses: number;
  fsrsState: number;
  scheduledDays: number;
  lastReviewAt: number | null;
  modelVersion: string;
  /** `attemptId` of the last attempt folded into this estimate. */
  attemptWatermark: string | null;
  attemptCount: number;
};

/**
 * Build the estimate for a skill's attempt history as of `nowMs`.
 *
 * Returns `null` when the history contains no learner attempt at all — there is
 * nothing to estimate, and writing a zeroed card would claim "we measured this
 * child and found zero memory", which is a different and false statement.
 *
 * `ts-fsrs` stays confined to this module (ADR-002): callers get plain numbers.
 */
export function computeEstimate(
  attempts: readonly AttemptEvidence[],
  nowMs: number,
): SkillEstimate | null {
  const ordered = attempts
    .filter((a) => a.evidenceKind !== "parent_correction")
    .sort((a, b) => a.createdAt - b.createdAt);
  if (ordered.length === 0) return null;

  const card = replay(ordered);
  const lastReviewAt = card.last_review ? card.last_review.getTime() : null;

  // Retrievability is only defined at or after the last review; asking earlier
  // would extrapolate backwards. The ledger is append-only and `now` is the
  // server clock, so this clamp is a guard, not a routine path.
  const at = lastReviewAt === null ? nowMs : Math.max(nowMs, lastReviewAt);
  const rawRetrievability = scheduler.retrievability(card, new Date(at));
  const retrievabilityAt = Number.isFinite(rawRetrievability)
    ? Math.min(1, Math.max(0, rawRetrievability))
    : 0;

  return {
    stability: card.stability,
    difficulty: card.difficulty,
    retrievabilityAt,
    reps: card.reps,
    lapses: card.lapses,
    fsrsState: card.state,
    scheduledDays: card.scheduled_days,
    lastReviewAt,
    modelVersion: FSRSVersion,
    attemptWatermark: ordered.at(-1)?.attemptId ?? null,
    attemptCount: ordered.length,
  };
}

/** Keep an FSRS interval inside the policy floor and ceiling. */
function clampInterval(days: number): number {
  if (!Number.isFinite(days)) return REVIEW_CONFIG.minimumIntervalDays;
  return Math.min(
    REVIEW_CONFIG.maximumIntervalDays,
    Math.max(REVIEW_CONFIG.minimumIntervalDays, Math.round(days)),
  );
}

function decide(
  nowMs: number,
  intervalDays: number,
  failureStreak: number,
  reasonVi: string,
): ReviewDecision {
  const dueAt = nowMs + intervalDays * DAY_MS;
  return { dueAt, intervalDays, dueOnVi: vnCalendarDate(dueAt), failureStreak, reasonVi };
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
