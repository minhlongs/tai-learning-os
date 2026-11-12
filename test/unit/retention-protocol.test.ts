import { describe, expect, it } from "vitest";

import {
  RETENTION_HORIZONS_DAYS,
  calendarDaysBetween,
  computeDelayedProbes,
  isIndependentSolve,
  summarizeRetention,
} from "../../src/shared/engine/retention";
import type { RetentionAttempt } from "../../src/shared/engine/retention";

/**
 * The protocol exists to turn FSRS's 0.95 assumption into a measurement, so the
 * only thing that makes this suite worth running is that it can fail. Every case
 * below is written against a mutation that would keep it green otherwise; the
 * mutation each one catches is named in its comment.
 *
 * Timeline convention: one anchor on 2026-01-05 at 23:00 Vietnam time, and every
 * later attempt expressed as an offset from it. The 23:00 anchor is deliberate —
 * it makes elapsed time and calendar days disagree, which is exactly where a
 * timezone-naive implementation gives a different answer.
 */

const DAY = 86_400_000;
const ANCHOR_AT = Date.parse("2026-01-05T23:00:00+07:00");

/** An instant N whole days and M extra milliseconds after the anchor. */
function at(days: number, extraMs = 0): number {
  return ANCHOR_AT + days * DAY + extraMs;
}

let sequence = 0;

function attempt(overrides: Partial<RetentionAttempt> = {}): RetentionAttempt {
  sequence += 1;
  return {
    attemptId: `att-${String(sequence).padStart(4, "0")}`,
    skillId: "math-frac-equiv",
    outcome: "correct",
    helpLevel: 0,
    evidenceKind: "observed",
    attemptNo: 1,
    purpose: "official",
    createdAt: ANCHOR_AT,
    ...overrides,
  };
}

/** An independent solve: correct, unaided, first try, observed by the system. */
function solved(createdAt: number, overrides: Partial<RetentionAttempt> = {}): RetentionAttempt {
  return attempt({ createdAt, ...overrides });
}

describe("calendarDaysBetween", () => {
  it("counts calendar dates on the child's calendar, not 24-hour blocks", () => {
    // 13d 1.5h of elapsed time, but 14 dates apart in Asia/Ho_Chi_Minh.
    // A `(to - from) / DAY_MS` implementation returns 13 here and fails.
    expect(calendarDaysBetween(ANCHOR_AT, at(13, 1.5 * 3_600_000))).toBe(14);
  });

  it("treats two instants that straddle midnight as a full day apart", () => {
    const beforeMidnight = Date.parse("2026-01-05T23:59:00+07:00");
    const afterMidnight = Date.parse("2026-01-06T00:01:00+07:00");
    expect(calendarDaysBetween(beforeMidnight, afterMidnight)).toBe(1);
  });

  it("does not drift when both instants are in the same Vietnam date", () => {
    const early = Date.parse("2026-01-05T00:05:00+07:00");
    const late = Date.parse("2026-01-05T23:55:00+07:00");
    expect(calendarDaysBetween(early, late)).toBe(0);
  });
});

describe("computeDelayedProbes", () => {
  it("produces no probe from a single attempt", () => {
    // There is nothing to be delayed relative to.
    expect(computeDelayedProbes([solved(ANCHOR_AT)], 14)).toEqual([]);
  });

  it("counts an attempt one calendar day past the horizon", () => {
    const probes = computeDelayedProbes([solved(ANCHOR_AT), solved(at(14))], 14);
    expect(probes).toHaveLength(1);
    expect(probes[0]).toMatchObject({ horizonDays: 14, gapDays: 14, correct: true });
  });

  it("does not count an attempt one day short of the horizon", () => {
    expect(computeDelayedProbes([solved(ANCHOR_AT), solved(at(13))], 14)).toEqual([]);
  });

  it("resets the anchor after a failed probe", () => {
    // Anchor, fail 14 days later, succeed 14 days after that. The failure ends
    // the learning episode, so the later success has no anchor to be measured
    // against: one probe, not two. An implementation that keeps the stale anchor
    // reports two, and inflates the denominator with a retry.
    const probes = computeDelayedProbes(
      [
        solved(ANCHOR_AT),
        attempt({ createdAt: at(14), outcome: "incorrect" }),
        solved(at(28)),
      ],
      14,
    );
    expect(probes).toHaveLength(1);
    expect(probes[0]).toMatchObject({ correct: false, gapDays: 14 });
  });

  it("re-anchors on a successful probe, so the next gap is measured from it", () => {
    const probes = computeDelayedProbes(
      [solved(ANCHOR_AT), solved(at(14)), solved(at(28))],
      14,
    );
    expect(probes.map((probe) => probe.gapDays)).toEqual([14, 14]);
    expect(probes[1].anchorAt).toBe(at(14));
  });

  it("ignores practice attempts entirely", () => {
    // A practice run is not the child being asked a question. Removing the
    // `purpose` filter makes this test report a probe that never happened.
    const probes = computeDelayedProbes(
      [solved(ANCHOR_AT), solved(at(20), { purpose: "practice" })],
      14,
    );
    expect(probes).toEqual([]);
  });

  it("ignores parent-recorded corrections", () => {
    const probes = computeDelayedProbes(
      [solved(ANCHOR_AT), solved(at(20), { evidenceKind: "parent_correction" })],
      14,
    );
    expect(probes).toEqual([]);
  });

  it("counts an assisted solve as a probe but not as independent", () => {
    const probes = computeDelayedProbes(
      [solved(ANCHOR_AT), solved(at(20), { evidenceKind: "assisted", helpLevel: 2 })],
      14,
    );
    expect(probes).toHaveLength(1);
    expect(probes[0]).toMatchObject({ correct: true, independent: false });
  });

  it("counts a wrong answer as a probe that was not correct", () => {
    const probes = computeDelayedProbes(
      [solved(ANCHOR_AT), attempt({ createdAt: at(20), outcome: "incorrect" })],
      14,
    );
    expect(probes[0]).toMatchObject({ correct: false, independent: false });
  });

  it("sorts attempts itself, so ledger order is not load-bearing", () => {
    const reversed = [solved(at(20)), solved(ANCHOR_AT)];
    expect(computeDelayedProbes(reversed, 14)).toHaveLength(1);
  });

  it("keeps skills apart", () => {
    const probes = computeDelayedProbes(
      [
        solved(ANCHOR_AT, { skillId: "math-frac-equiv" }),
        solved(at(14), { skillId: "math-frac-equiv" }),
        solved(ANCHOR_AT, { skillId: "vie-find-evidence" }),
      ],
      14,
    );
    expect(probes.map((probe) => probe.skillId)).toEqual(["math-frac-equiv"]);
  });
});

describe("summarizeRetention", () => {
  it("reports null, never 0, while no probe exists", () => {
    // "She has not been tested after 14 days" and "she forgot everything after
    // 14 days" are different facts. Returning 0 would turn the first into the
    // second, so `rate()` must stay nullable.
    const report = summarizeRetention([solved(ANCHOR_AT), solved(at(3))]);
    expect(report.horizons.map((horizon) => horizon.horizonDays)).toEqual([
      ...RETENTION_HORIZONS_DAYS,
    ]);
    for (const horizon of report.horizons) {
      expect(horizon.probes).toBe(0);
      expect(horizon.correctRate).toBeNull();
      expect(horizon.independentRate).toBeNull();
    }
  });

  it("reports null on an entirely empty history", () => {
    const report = summarizeRetention([]);
    expect(report.eligibleAttempts).toBe(0);
    expect(report.skillsWithAnchor).toBe(0);
    expect(report.skillsSeen).toEqual([]);
    expect(report.horizons.every((horizon) => horizon.correctRate === null)).toBe(true);
  });

  it("separates the two horizons: a 14-day cadence yields no 30-day probe", () => {
    // Reviews every 14 days, three times. Each probe becomes the next anchor, so
    // no gap ever reaches 30 days. The 30-day figure answers "what survives a
    // month with no review", and this child has no such evidence — reported as
    // 0 probes, not as a low rate.
    const report = summarizeRetention([
      solved(ANCHOR_AT),
      solved(at(14)),
      solved(at(28)),
      solved(at(42)),
    ]);
    const [fourteen, thirty] = report.horizons;
    expect(fourteen.probes).toBe(3);
    expect(fourteen.correctRate).toBe(1);
    expect(thirty.probes).toBe(0);
    expect(thirty.correctRate).toBeNull();
  });

  it("measures a 30-day gap when the child really did go a month", () => {
    const report = summarizeRetention([solved(ANCHOR_AT), solved(at(30))]);
    const thirty = report.horizons.find((horizon) => horizon.horizonDays === 30);
    expect(thirty?.probes).toBe(1);
    expect(thirty?.correctRate).toBe(1);
  });

  it("computes rates over probes, so one loss is visible immediately", () => {
    const report = summarizeRetention([
      solved(ANCHOR_AT, { skillId: "a" }),
      attempt({ createdAt: at(14), skillId: "a", outcome: "incorrect" }),
      solved(ANCHOR_AT, { skillId: "b" }),
      solved(at(14), { skillId: "b" }),
    ]);
    const fourteen = report.horizons[0];
    expect(fourteen.probes).toBe(2);
    expect(fourteen.correct).toBe(1);
    expect(fourteen.correctRate).toBe(0.5);
    expect(fourteen.bySkill).toEqual([
      { skillId: "a", probes: 1, correct: 0, independent: 0 },
      { skillId: "b", probes: 1, correct: 1, independent: 1 },
    ]);
  });

  it("counts eligibility the same way the probes do", () => {
    // The two filters must agree, or the headline attempt count would describe
    // attempts the probe walk never looked at.
    const report = summarizeRetention([
      solved(ANCHOR_AT),
      solved(at(5), { purpose: "practice" }),
      solved(at(6), { evidenceKind: "parent_correction" }),
      solved(at(7), { skillId: null }),
      solved(at(8), { skillId: "" }),
    ]);
    expect(report.eligibleAttempts).toBe(1);
    expect(report.skillsSeen).toEqual(["math-frac-equiv"]);
  });

  it("counts a skill as anchored only if she solved it unaided", () => {
    const report = summarizeRetention([
      solved(ANCHOR_AT, { skillId: "a" }),
      attempt({ createdAt: ANCHOR_AT, skillId: "b", evidenceKind: "assisted", helpLevel: 1 }),
      attempt({ createdAt: ANCHOR_AT, skillId: "c", attemptNo: 2 }),
    ]);
    expect(report.skillsSeen).toEqual(["a", "b", "c"]);
    expect(report.skillsWithAnchor).toBe(1);
  });
});

describe("isIndependentSolve", () => {
  it("delegates to the competency engine's rule", () => {
    // Held equal on purpose: if mastery and retention disagreed on what "unaided"
    // means, the retention figure would measure a standard the engine never used.
    expect(isIndependentSolve(attempt())).toBe(true);
    expect(isIndependentSolve(attempt({ helpLevel: 1 }))).toBe(false);
    expect(isIndependentSolve(attempt({ attemptNo: 2 }))).toBe(false);
    expect(isIndependentSolve(attempt({ outcome: "partial" }))).toBe(false);
    expect(isIndependentSolve(attempt({ evidenceKind: "assisted" }))).toBe(false);
    expect(isIndependentSolve(attempt({ evidenceKind: "parent_correction" }))).toBe(false);
  });
});
