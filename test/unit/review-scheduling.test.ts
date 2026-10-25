import { describe, expect, it } from "vitest";

import {
  DAY_MS,
  REVIEW_CONFIG,
  needsParentAttention,
  scheduleReview,
  selectDueForReview,
} from "../../src/shared/engine/review";
import type { AttemptEvidence } from "../../src/shared/engine/competency";
import type { SubmissionOutcome } from "../../src/shared/schemas/attempt";

/**
 * The scheduler must be explainable: the parent is shown the interval and can
 * argue with it. So the intervals are pinned exactly, and a failure must push
 * the learner back to the short end rather than stranding them at 14 days.
 */

const SKILL = "math-frac-equiv";
const NOW = 1_700_000_000_000;

let sequence = 0;

function attempt(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  sequence += 1;
  return {
    attemptId: `att-${sequence}`,
    skillId: SKILL,
    outcome: "correct",
    helpLevel: 0,
    evidenceKind: "observed",
    isTransfer: false,
    isReview: false,
    createdAt: NOW + sequence * 60_000,
    ...overrides,
  };
}

function correct(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  return attempt({ outcome: "correct" as SubmissionOutcome, ...overrides });
}

function incorrect(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  return attempt({ outcome: "incorrect" as SubmissionOutcome, ...overrides });
}

describe("scheduleReview — nothing to schedule", () => {
  it("returns null with no attempts", () => {
    expect(scheduleReview([], NOW)).toBeNull();
  });

  it("returns null when no attempt was ever correct", () => {
    expect(scheduleReview([incorrect(), incorrect()], NOW)).toBeNull();
  });
});

describe("scheduleReview — the first independent solve", () => {
  it("schedules the initial interval of one day", () => {
    const decision = scheduleReview([correct()], NOW);
    expect(decision).not.toBeNull();
    expect(decision!.intervalDays).toBe(REVIEW_CONFIG.initialIntervalDays);
    expect(decision!.intervalDays).toBe(1);
  });

  it("computes dueAt as exactly now + interval days in milliseconds", () => {
    const decision = scheduleReview([correct()], NOW);
    expect(decision!.dueAt).toBe(NOW + decision!.intervalDays * DAY_MS);
    expect(decision!.dueAt).toBe(NOW + 1 * 86400_000);
  });

  it("reports zero failure streak after a clean solve", () => {
    expect(scheduleReview([correct()], NOW)!.failureStreak).toBe(0);
  });
});

describe("scheduleReview — the ladder climbs on successive review successes", () => {
  it("climbs 1 -> 3 -> 7 -> 14 across successive independent solves", () => {
    // The ladder is walked by *scheduled review* successes: each rung's history
    // is one independent solve more than the previous one.
    const one = scheduleReview([correct()], NOW)!;
    const two = scheduleReview([correct(), correct({ isReview: true })], NOW)!;
    const three = scheduleReview(
      [correct(), correct({ isReview: true }), correct({ isReview: true })],
      NOW,
    )!;
    const four = scheduleReview(
      [correct(), correct({ isReview: true }), correct({ isReview: true }), correct({ isReview: true })],
      NOW,
    )!;

    expect(REVIEW_CONFIG.intervals).toEqual([1, 3, 7, 14]);
    expect([one.intervalDays, two.intervalDays, three.intervalDays, four.intervalDays]).toEqual([1, 3, 7, 14]);
  });

  it("holds the top interval rather than running off the ladder", () => {
    const many = Array.from({ length: 8 }, () => correct({ isReview: true }));
    expect(scheduleReview(many, NOW)!.intervalDays).toBe(14);
  });

  it("produces an exact dueAt for every ladder rung", () => {
    for (const rung of REVIEW_CONFIG.intervals) {
      const successCount = REVIEW_CONFIG.intervals.indexOf(rung) + 1;
      const history = Array.from({ length: successCount }, (_, i) =>
        i === 0 ? correct() : correct({ isReview: true }),
      );
      const decision = scheduleReview(history, NOW)!;
      expect(decision.intervalDays).toBe(rung);
      expect(decision.dueAt).toBe(NOW + rung * DAY_MS);
    }
  });
});

describe("scheduleReview — a failure resets the ladder", () => {
  it("drops back to the first interval after a failed review", () => {
    const history = [correct(), correct(), correct(), incorrect()];
    const decision = scheduleReview(history, NOW)!;
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.intervals[0]);
    expect(decision.intervalDays).toBe(1);
  });

  it("ignores failures that happened AFTER the last correct attempt", () => {
    // Failures are only counted in the run immediately preceding the solve they
    // follow. A failure recorded after the solve is an input to the NEXT
    // scheduling decision, not this one.
    const decision = scheduleReview([correct(), correct(), incorrect(), incorrect()], NOW)!;
    expect(decision.failureStreak).toBe(0);
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.intervals[0]);
  });

  it("counts the failure run that precedes the solve it follows", () => {
    // Three failures, then a solve: that 3-long run belongs to this decision.
    const history = [incorrect(), incorrect(), incorrect(), correct()];
    const decision = scheduleReview(history, NOW)!;
    expect(decision.failureStreak).toBe(3);
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.intervals[0]);
  });

  it("restarts low after struggling through several failures, not at the top", () => {
    const decision = scheduleReview(
      [incorrect(), incorrect(), incorrect(), correct()],
      NOW,
    )!;
    expect(decision.intervalDays).toBe(1);
    expect(decision.failureStreak).toBe(3);
  });

  it("reschedules an assisted solve for tomorrow rather than dropping it", () => {
    const decision = scheduleReview([correct({ helpLevel: 4 })], NOW)!;
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.failureRetryDays);
    expect(decision.dueAt).toBe(NOW + 1 * DAY_MS);
    expect(decision.failureStreak).toBeGreaterThanOrEqual(1);
  });
});

describe("scheduleReview — parent attention flag", () => {
  it("is false below the escalation threshold", () => {
    expect(needsParentAttention([incorrect(), incorrect()])).toBe(false);
  });

  it("is true at three or more failures", () => {
    expect(REVIEW_CONFIG.failureEscalation).toBe(3);
    expect(needsParentAttention([incorrect(), incorrect(), incorrect()])).toBe(true);
  });

  it("stays true beyond the threshold", () => {
    const failures = Array.from({ length: 6 }, () => incorrect());
    expect(needsParentAttention(failures)).toBe(true);
  });

  it("is false when there are no attempts at all", () => {
    expect(needsParentAttention([])).toBe(false);
  });

  it("ignores successful attempts when counting failures", () => {
    expect(needsParentAttention([correct(), correct(), correct()])).toBe(false);
  });
});

describe("selectDueForReview", () => {
  it("returns only entries whose due date has passed", () => {
    const queue = [
      { skillId: "a", dueAt: NOW - 1000 },
      { skillId: "b", dueAt: NOW + 5000 },
    ];
    expect(selectDueForReview(queue, NOW).map((e) => e.skillId)).toEqual(["a"]);
  });

  it("includes an entry due exactly now", () => {
    expect(selectDueForReview([{ skillId: "a", dueAt: NOW }], NOW)).toHaveLength(1);
  });

  it("orders the most overdue first", () => {
    const queue = [
      { skillId: "late", dueAt: NOW - 5000 },
      { skillId: "earliest", dueAt: NOW - 9000 },
      { skillId: "notdue", dueAt: NOW + 1 },
    ];
    expect(selectDueForReview(queue, NOW).map((e) => e.skillId)).toEqual(["earliest", "late"]);
  });
});

describe("DAY_MS", () => {
  it("is exactly one day in milliseconds", () => {
    expect(DAY_MS).toBe(86_400_000);
  });
});
