import { describe, expect, it } from "vitest";

import {
  DAY_MS,
  REVIEW_CONFIG,
  needsParentAttention,
  scheduleReview,
  selectDueForReview,
  vnCalendarDate,
} from "../../src/shared/engine/review";
import type { AttemptEvidence } from "../../src/shared/engine/competency";
import type { SubmissionOutcome } from "../../src/shared/schemas/attempt";

/**
 * The scheduler must be explainable: the parent is shown the interval and can
 * argue with it, so every expectation here is an exact number.
 *
 * Those numbers come from FSRS-6, not from a ladder written by hand. The
 * ladder-shaped cases below use REALISTIC spacing (each review happens when it
 * came due), because FSRS reads elapsed time as evidence: four correct answers
 * inside four minutes tell it far less than four correct answers across three
 * weeks. An early version of this suite massed the attempts minutes apart and
 * every interval collapsed to the minimum, which was the model behaving
 * correctly on evidence that never claimed to be spaced practice.
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

/**
 * Build a history of `count` spaced reviews, each at the moment the previous
 * one came due. Returns the history plus that same spacing applied as gaps.
 */
function spacedReviews(count: number): { history: AttemptEvidence[]; spans: number[] } {
  const gaps = [0, 3, 6, 15, 30, 30, 30, 30, 30, 30];
  const history: AttemptEvidence[] = [];
  const spans: number[] = [];
  let t = NOW;

  const first = correct({ createdAt: t });
  history.push(first);
  for (let i = 1; i < count; i += 1) {
    const gap = gaps[i] ?? 30;
    t += gap * DAY_MS;
    spans.push(gap);
    history.push(correct({ isReview: true, createdAt: t }));
  }
  return { history, spans };
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
  it("schedules FSRS's first Good interval of three days", () => {
    const decision = scheduleReview([correct()], NOW);
    expect(decision).not.toBeNull();
    expect(decision!.intervalDays).toBe(3);
  });

  it("computes dueAt as exactly now + interval days in milliseconds", () => {
    const decision = scheduleReview([correct()], NOW);
    expect(decision!.dueAt).toBe(NOW + decision!.intervalDays * DAY_MS);
  });

  it("reports zero failure streak after a clean solve", () => {
    expect(scheduleReview([correct()], NOW)!.failureStreak).toBe(0);
  });

  it("reports the due date as a Vietnam calendar date", () => {
    const decision = scheduleReview([correct()], NOW)!;
    expect(decision.dueOnVi).toBe(vnCalendarDate(NOW + 3 * DAY_MS));
    expect(decision.dueOnVi).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("scheduleReview — the interval grows with spaced success", () => {
  it("climbs 3 -> 6 -> 15 -> 30 across successive on-time reviews", () => {
    const decisions = [1, 2, 3, 4].map((n) => scheduleReview(spacedReviews(n).history, NOW)!);
    expect(decisions.map((d) => d.intervalDays)).toEqual([3, 6, 15, 30]);
  });

  it("holds the ceiling rather than running past it", () => {
    const { history } = spacedReviews(8);
    expect(scheduleReview(history, NOW)!.intervalDays).toBe(REVIEW_CONFIG.maximumIntervalDays);
  });

  it("never exceeds the configured ceiling, however long the history", () => {
    const { history } = spacedReviews(10);
    for (let n = 1; n <= history.length; n += 1) {
      const decision = scheduleReview(history.slice(0, n), NOW)!;
      expect(decision.intervalDays).toBeLessThanOrEqual(REVIEW_CONFIG.maximumIntervalDays);
      expect(decision.intervalDays).toBeGreaterThanOrEqual(REVIEW_CONFIG.minimumIntervalDays);
    }
  });

  it("stays deterministic — the same history yields the same interval", () => {
    const { history } = spacedReviews(5);
    const first = scheduleReview(history, NOW)!;
    const second = scheduleReview(history, NOW)!;
    expect(second.intervalDays).toBe(first.intervalDays);
    expect(second.dueAt).toBe(first.dueAt);
  });

  it("produces an exact dueAt for every interval it emits", () => {
    const { history } = spacedReviews(6);
    const decision = scheduleReview(history, NOW)!;
    expect(decision.dueAt).toBe(NOW + decision.intervalDays * DAY_MS);
  });
});

describe("scheduleReview — a failure resets the interval", () => {
  it("drops back to one day after a failed review", () => {
    const { history } = spacedReviews(4);
    const failed = incorrect({ isReview: true, createdAt: history.at(-1)!.createdAt + DAY_MS });
    const decision = scheduleReview([...history, failed], NOW)!;
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.failureRetryDays);
    expect(decision.intervalDays).toBe(1);
    expect(decision.failureStreak).toBe(1);
  });

  it("ignores failures that happened AFTER the last correct attempt", () => {
    // A failure recorded after the solve is input to the NEXT scheduling
    // decision, not this one: it has not yet disproven what was solved.
    const decision = scheduleReview([correct(), correct(), incorrect(), incorrect()], NOW)!;
    expect(decision.failureStreak).toBe(0);
    expect(decision.intervalDays).toBe(3);
  });

  it("counts the failure run that precedes the solve it follows", () => {
    // Three failures, then a solve: that 3-long run belongs to this decision.
    const decision = scheduleReview(
      [incorrect(), incorrect(), incorrect(), correct()],
      NOW,
    )!;
    expect(decision.failureStreak).toBe(3);
  });

  it("restarts low after struggling through several failures, not at the top", () => {
    const { history } = spacedReviews(5);
    const t = history.at(-1)!.createdAt;
    const struggled = [
      ...history,
      incorrect({ createdAt: t + DAY_MS }),
      incorrect({ createdAt: t + 2 * DAY_MS }),
      incorrect({ createdAt: t + 3 * DAY_MS }),
      correct({ createdAt: t + 4 * DAY_MS }),
    ];
    const decision = scheduleReview(struggled, NOW)!;
    expect(decision.intervalDays).toBeLessThan(REVIEW_CONFIG.maximumIntervalDays);
    expect(decision.failureStreak).toBe(3);
  });

  it("reschedules an assisted solve for tomorrow rather than dropping it", () => {
    const decision = scheduleReview([correct({ helpLevel: 4 })], NOW)!;
    expect(decision.intervalDays).toBe(REVIEW_CONFIG.failureRetryDays);
    expect(decision.dueAt).toBe(NOW + 1 * DAY_MS);
    expect(decision.failureStreak).toBeGreaterThanOrEqual(1);
  });

  it("treats an assisted solve as weaker evidence than an independent one", () => {
    // FSRS is told "Hard", not "Good": the child reached the answer, but the
    // help means it is not yet evidence of durable memory.
    const assisted = scheduleReview([correct({ helpLevel: 2 })], NOW)!;
    expect(assisted.intervalDays).toBe(REVIEW_CONFIG.failureRetryDays);
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

  it("resets parent attention flag once an independent solve breaks the failure streak", () => {
    expect(
      needsParentAttention([
        incorrect(),
        incorrect(),
        incorrect(),
        correct({ helpLevel: 0 }),
      ]),
    ).toBe(false);
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

describe("vnCalendarDate", () => {
  it("uses the Vietnam calendar day, not UTC", () => {
    // 2023-11-15T00:00:00Z is 07:00 on the 15th in Vietnam.
    expect(vnCalendarDate(Date.UTC(2023, 10, 15, 0, 0, 0))).toBe("2023-11-15");
    // 2023-11-14T18:00:00Z is already 01:00 on the 15th in Vietnam.
    expect(vnCalendarDate(Date.UTC(2023, 10, 14, 18, 0, 0))).toBe("2023-11-15");
    // 2023-11-14T16:00:00Z is 23:00 on the 14th in Vietnam.
    expect(vnCalendarDate(Date.UTC(2023, 10, 14, 16, 0, 0))).toBe("2023-11-14");
  });
});

describe("DAY_MS", () => {
  it("is exactly one day in milliseconds", () => {
    expect(DAY_MS).toBe(86_400_000);
  });
});
