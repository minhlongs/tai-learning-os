/**
 * Delayed-retention measurement protocol.
 *
 * FSRS is configured to hold a skill at 0.95 recall at the due date
 * (`REVIEW_CONFIG.requestRetention`). That number is an assumption about this
 * child, not a measurement of her. This module computes the measurement: of the
 * skills she learned unaided, how many can she still do unaided after the
 * interval has actually elapsed?
 *
 * The unit of evidence is a **delayed probe**: an attempt that answers a skill
 * at least N calendar days after the last attempt where she solved it
 * independently. That attempt already exists in the ledger; nothing here writes
 * or schedules. Nothing here reads `review_schedule` either, because that table
 * holds only the CURRENT due date — the history of what was due when is not in
 * it, so a probe derived from it could not be recomputed later and checked.
 * `learning_attempts` is append-only, so a probe derived from it can.
 *
 * Calendar days are Asia/Ho_Chi_Minh dates, via the same `vnCalendarDate()` the
 * scheduler uses, so "14 days" means 14 dates on the child's own calendar and
 * never 14 × 24 hours measured from a different timezone.
 *
 * Each horizon is computed on its own anchor chain, and the anchor is always the
 * most recent independent solve. A skill reviewed every 14 days therefore
 * produces 14-day probes and no 30-day probe, because the reviews in between
 * reset the chain before it can reach a month. That is a property of the
 * protocol, not a defect: the 30-day figure answers "what survives a month
 * without review", and a child who never goes a month without review has no
 * such evidence.
 */

import type { EvidenceKind, SubmissionOutcome } from "../schemas/attempt";
import { isIndependentAttempt } from "./competency";
import { DAY_MS, vnCalendarDate } from "./review";

/** The two horizons the protocol reports, in days. */
export const RETENTION_HORIZONS_DAYS = [14, 30] as const;
export type RetentionHorizonDays = (typeof RETENTION_HORIZONS_DAYS)[number];

/** The grain of one `learning_attempts` row this module needs. */
export type RetentionAttempt = {
  attemptId: string;
  skillId: string | null;
  outcome: SubmissionOutcome;
  helpLevel: number;
  evidenceKind: EvidenceKind;
  attemptNo: number;
  purpose: "official" | "practice";
  createdAt: number;
};

export type DelayedProbe = {
  skillId: string;
  horizonDays: number;
  /** The independent solve the probe is measured against. */
  anchorAttemptId: string;
  probeAttemptId: string;
  anchorAt: number;
  probeAt: number;
  /** Calendar days in Asia/Ho_Chi_Minh between anchor and probe. */
  gapDays: number;
  correct: boolean;
  /** Solved unaided on the first try — the same standard `isIndependentAttempt()` uses. */
  independent: boolean;
};

export type HorizonReport = {
  horizonDays: number;
  probes: number;
  correct: number;
  independent: number;
  /**
   * `null` when there is no probe yet. Never `0`: "no child has come back after
   * 14 days" and "no skill survived 14 days" are different facts, and a report
   * that prints 0 for both would turn absence of evidence into evidence of
   * forgetting.
   */
  correctRate: number | null;
  independentRate: number | null;
  /** Per-skill tallies, sorted by skill id, so a parent can see which decayed. */
  bySkill: readonly {
    skillId: string;
    probes: number;
    correct: number;
    independent: number;
  }[];
};

export type RetentionReport = {
  horizons: readonly HorizonReport[];
  /** Attempts that could carry a probe (official, learner-produced, skill-bearing). */
  eligibleAttempts: number;
  /** Skills with at least one independent solve, i.e. a possible anchor. */
  skillsWithAnchor: number;
  skillsSeen: readonly string[];
};

/**
 * An independent solve, by the same rule the competency engine applies.
 *
 * Delegated rather than re-expressed: if the mastery rule ever changes, the
 * retention figure must move with it. Two copies of "what counts as unaided"
 * would drift, and the protocol would then measure a standard the engine never
 * used.
 */
export function isIndependentSolve(attempt: RetentionAttempt): boolean {
  return isIndependentAttempt({
    attemptId: attempt.attemptId,
    skillId: attempt.skillId ?? "",
    outcome: attempt.outcome,
    helpLevel: attempt.helpLevel,
    evidenceKind: attempt.evidenceKind,
    attemptNo: attempt.attemptNo,
    isTransfer: false,
    isReview: false,
    createdAt: attempt.createdAt,
  });
}

/** Whole calendar days between two instants, on the child's own calendar. */
export function calendarDaysBetween(fromMs: number, toMs: number): number {
  const from = Date.parse(vnCalendarDate(fromMs));
  const to = Date.parse(vnCalendarDate(toMs));
  return Math.round((to - from) / DAY_MS);
}

/**
 * Practice runs and parent-recorded corrections are not the child answering a
 * question. Counting either would report retention the learner never showed.
 */
function isEligible(attempt: RetentionAttempt): boolean {
  if (attempt.purpose === "practice") return false;
  if (attempt.evidenceKind === "parent_correction") return false;
  return attempt.skillId !== null && attempt.skillId !== "";
}

function compareAttempts(a: RetentionAttempt, b: RetentionAttempt): number {
  if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
  return a.attemptId.localeCompare(b.attemptId);
}

/**
 * Delayed probes for one horizon, over any attempt list.
 *
 * The anchor is always the most recent independent solve, so a probe answers
 * exactly one question: "has she gone N days without solving this unaided, and
 * what happened when she came back?" Re-anchoring on a solve that arrives too
 * soon to be a probe is what keeps the two horizons distinct — otherwise a child
 * reviewed every 14 days would emit a 30-day probe measured straight past the
 * reviews in between, and the 30-day figure would claim a month-long gap that
 * never happened.
 *
 * Anchors reset to `null` after a failed probe: once she has failed to recall a
 * skill, the earlier learning event no longer describes what she knows, and
 * every later attempt would otherwise be counted as another probe against that
 * stale anchor — inflating the denominator with retries inside one forgetting
 * episode.
 */
export function computeDelayedProbes(
  attempts: readonly RetentionAttempt[],
  horizonDays: number,
): DelayedProbe[] {
  const bySkill = new Map<string, RetentionAttempt[]>();
  for (const attempt of attempts) {
    if (!isEligible(attempt)) continue;
    const skillId = attempt.skillId as string;
    const bucket = bySkill.get(skillId);
    if (bucket) bucket.push(attempt);
    else bySkill.set(skillId, [attempt]);
  }

  const probes: DelayedProbe[] = [];
  for (const [skillId, bucket] of bySkill) {
    bucket.sort(compareAttempts);
    let anchor: RetentionAttempt | null = null;

    for (const attempt of bucket) {
      const independent = isIndependentSolve(attempt);

      if (anchor === null) {
        if (independent) anchor = attempt;
        continue;
      }

      const gapDays = calendarDaysBetween(anchor.createdAt, attempt.createdAt);
      if (gapDays < horizonDays) {
        // Too soon to probe. If she solved it unaided anyway, this solve is the
        // newer thing she knows, so it becomes the anchor the next gap is
        // measured from.
        if (independent) anchor = attempt;
        continue;
      }

      probes.push({
        skillId,
        horizonDays,
        anchorAttemptId: anchor.attemptId,
        probeAttemptId: attempt.attemptId,
        anchorAt: anchor.createdAt,
        probeAt: attempt.createdAt,
        gapDays,
        correct: attempt.outcome === "correct",
        independent,
      });
      anchor = independent ? attempt : null;
    }
  }

  return probes.sort(
    (a, b) =>
      a.skillId.localeCompare(b.skillId) ||
      a.probeAt - b.probeAt ||
      a.probeAttemptId.localeCompare(b.probeAttemptId),
  );
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

function summarizeHorizon(
  attempts: readonly RetentionAttempt[],
  horizonDays: number,
): HorizonReport {
  const probes = computeDelayedProbes(attempts, horizonDays);
  const correct = probes.filter((probe) => probe.correct).length;
  const independent = probes.filter((probe) => probe.independent).length;

  const skills = new Map<string, { probes: number; correct: number; independent: number }>();
  for (const probe of probes) {
    const row = skills.get(probe.skillId) ?? { probes: 0, correct: 0, independent: 0 };
    row.probes += 1;
    if (probe.correct) row.correct += 1;
    if (probe.independent) row.independent += 1;
    skills.set(probe.skillId, row);
  }

  return {
    horizonDays,
    probes: probes.length,
    correct,
    independent,
    correctRate: rate(correct, probes.length),
    independentRate: rate(independent, probes.length),
    bySkill: [...skills.entries()]
      .map(([skillId, row]) => ({ skillId, ...row }))
      .sort((a, b) => a.skillId.localeCompare(b.skillId)),
  };
}

/** The full protocol over one learner's attempt history. */
export function summarizeRetention(attempts: readonly RetentionAttempt[]): RetentionReport {
  const eligible = attempts.filter(isEligible);
  const skillsSeen = [...new Set(eligible.map((attempt) => attempt.skillId as string))].sort();
  const skillsWithAnchor = new Set(
    eligible.filter(isIndependentSolve).map((attempt) => attempt.skillId as string),
  );

  return {
    horizons: RETENTION_HORIZONS_DAYS.map((horizon) =>
      summarizeHorizon(attempts, horizon),
    ),
    eligibleAttempts: eligible.length,
    skillsWithAnchor: skillsWithAnchor.size,
    skillsSeen,
  };
}
