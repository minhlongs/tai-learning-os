import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import {
  COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
  EXPECTED_LEAP_DATES_ICT,
  ICT_UTC_OFFSET_MS,
  LEGACY_FIXED_LADDER_DAYS,
  LEGACY_OVERLOAD_DAILY_REVIEWS,
  SIMULATION_SCHOOL_YEARS,
  SIMULATION_SKILLS_PER_YEAR,
  SIMULATION_START_DATE_ICT,
  SIMULATION_TOTAL_DAYS,
  SIMULATION_TOTAL_SKILLS,
  TET_PAUSE_WINDOWS,
  buildSimulationCalendar,
  deterministicReviewOutcome,
  ictMidnightUtcMs,
  runLongitudinalReviewSimulation,
  verifyIctMidnightBoundary,
} from "../../src/shared/engine/review-simulation";
import { DAY_MS, scheduleReview, vnCalendarDate } from "../../src/shared/engine/review";
import type { AttemptEvidence } from "../../src/shared/engine/competency";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const CLI_SCRIPT = join(REPO_ROOT, "scripts", "review-simulate.mjs");

describe("G7 3,650-day FSRS-6 longitudinal simulation — calendar & timezone boundaries", () => {
  it("anchors 00:00:00 Asia/Ho_Chi_Minh at 17:00:00 UTC of the preceding UTC date", () => {
    const startMidnightMs = ictMidnightUtcMs("2026-09-05");
    expect(new Date(startMidnightMs).toISOString()).toBe("2026-09-04T17:00:00.000Z");
    expect(vnCalendarDate(startMidnightMs)).toBe("2026-09-05");
    expect(vnCalendarDate(startMidnightMs - 1)).toBe("2026-09-04");
    expect(ICT_UTC_OFFSET_MS).toBe(7 * 60 * 60 * 1000);
    expect(verifyIctMidnightBoundary("2026-09-05")).toBe(true);
  });

  it("verifies leap-year Feb 29 boundaries in Asia/Ho_Chi_Minh and rejects non-leap Feb 29", () => {
    for (const leapDate of EXPECTED_LEAP_DATES_ICT) {
      const ms = ictMidnightUtcMs(leapDate);
      expect(new Date(ms).toISOString()).toBe(`${leapDate.slice(0, 4)}-02-28T17:00:00.000Z`);
      expect(vnCalendarDate(ms)).toBe(leapDate);
      expect(vnCalendarDate(ms + DAY_MS)).toBe(`${leapDate.slice(0, 4)}-03-01`);
      expect(verifyIctMidnightBoundary(leapDate)).toBe(true);
    }
    expect(() => ictMidnightUtcMs("2027-02-29")).toThrow(/Out-of-range ICT calendar date/);
    expect(() => ictMidnightUtcMs("2026/09/05")).toThrow(/Invalid ICT calendar date/);
  });

  it("builds a 3,650-day calendar with 10 Tết 10-day pauses, 10 summer breaks, 3 leap days, and 1,800 skills", () => {
    const calendar = buildSimulationCalendar();
    expect(calendar).toHaveLength(SIMULATION_TOTAL_DAYS);
    expect(calendar[0]?.dateIct).toBe(SIMULATION_START_DATE_ICT);
    expect(calendar.at(-1)?.dateIct).toBe("2036-09-01");

    const leapDates = calendar.filter((d) => d.isLeapDay).map((d) => d.dateIct);
    expect(leapDates).toEqual([...EXPECTED_LEAP_DATES_ICT]);

    // Every Tết window spans exactly 10 days, totaling 100 paused days with 0 new skills.
    expect(TET_PAUSE_WINDOWS).toHaveLength(10);
    const tetDays = calendar.filter((d) => d.isTetPause);
    expect(tetDays).toHaveLength(100);
    expect(tetDays.every((d) => !d.isReviewActiveDay && !d.isSchoolIntakeDay && d.newSkillsCount === 0)).toBe(
      true,
    );

    // Every summer break (Jun 1 - Aug 31 = 92 days/year * 10 years = 920 days) pauses new-skill
    // intake while keeping scheduled review days active.
    const summerDays = calendar.filter((d) => d.isSummerBreak);
    expect(summerDays).toHaveLength(920);
    expect(summerDays.every((d) => !d.isSchoolIntakeDay && d.newSkillsCount === 0 && d.isReviewActiveDay)).toBe(
      true,
    );

    // Exact 180 skills introduced in each of the 10 school years = 1,800 skills total.
    for (let year = 1; year <= SIMULATION_SCHOOL_YEARS; year += 1) {
      const skillsInYear = calendar
        .filter((d) => d.schoolYear === year)
        .reduce((sum, d) => sum + d.newSkillsCount, 0);
      expect(skillsInYear, `school year ${year}`).toBe(SIMULATION_SKILLS_PER_YEAR);
    }
    const totalSkills = calendar.reduce((sum, d) => sum + d.newSkillsCount, 0);
    expect(totalSkills).toBe(SIMULATION_TOTAL_SKILLS);
  });
});

describe("G7 3,650-day FSRS-6 longitudinal simulation — policy comparison & determinism", () => {
  const firstRun = runLongitudinalReviewSimulation();

  it("yields byte-identical JSON across independent runs (strict determinism)", () => {
    const secondRun = runLongitudinalReviewSimulation();
    expect(JSON.stringify(secondRun)).toBe(JSON.stringify(firstRun));

    // Deterministic trajectory helper is pure across repeated calls.
    expect(deterministicReviewOutcome(0x2026_0905, 42, 7)).toBe(
      deterministicReviewOutcome(0x2026_0905, 42, 7),
    );
  });

  it("proves 10-year FSRS-6 stays well below 25 reviews/day at Year 10 while legacy ladder exceeds 100/day", () => {
    expect(LEGACY_FIXED_LADDER_DAYS).toEqual([1, 3, 7, 14]);
    const legacy = firstRun.policies.legacy_fixed_ladder;
    const grade4 = firstRun.policies.fsrs6_grade4_policy;
    const masterplan10y = firstRun.policies.fsrs6_masterplan_10y;

    expect(legacy.totalSkillsIntroduced).toBe(1800);
    expect(grade4.totalSkillsIntroduced).toBe(1800);
    expect(masterplan10y.totalSkillsIntroduced).toBe(1800);

    // Legacy 14d cap overloads the learner at >100 reviews/day by Year 10.
    expect(legacy.year10MeanDailyReviewsCalendar).toBeGreaterThan(LEGACY_OVERLOAD_DAILY_REVIEWS);
    expect(legacy.year10MeanDailyReviewsActive).toBeGreaterThan(LEGACY_OVERLOAD_DAILY_REVIEWS);

    // Current Grade 4 policy (0.95 retention, 30d cap) is light in Year 1 (<10/day),
    // but climbs substantially by Year 10 due to the 30-day ceiling.
    expect(grade4.year1MeanDailyReviews).toBeLessThan(10);
    expect(grade4.year10MeanDailyReviewsCalendar).toBeGreaterThan(
      masterplan10y.year10MeanDailyReviewsCalendar * 5,
    );

    // Masterplan 10-year FSRS-6 (0.90 retention, 365d cap) keeps Year-10 mean daily
    // reviews well below the 25/day cognitive fatigue cap.
    expect(masterplan10y.year10MeanDailyReviewsCalendar).toBeLessThan(
      COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
    );
    expect(masterplan10y.year10MeanDailyReviewsActive).toBeLessThan(
      COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
    );
    expect(masterplan10y.year10SteadyStateSchoolTermMeanReviews).toBeLessThan(
      COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
    );
    expect(masterplan10y.year10P95DailyReviewsActive).toBeLessThan(
      COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
    );
  });

  it("resumes scheduled reviews cleanly after Tết and summer pauses with zero false resets", () => {
    expect(firstRun.invariants).toEqual({
      legacyYear10Exceeds100PerDay: true,
      masterplanYear10Below25PerDay: true,
      zeroFalseResetsAcrossPauses: true,
      allThreeLeapDaysObserved: true,
      midnightBoundariesExact: true,
    });

    for (const policyResult of Object.values(firstRun.policies)) {
      expect(policyResult.falseResets).toBe(0);
      expect(policyResult.postPauseResumptions).toBeGreaterThan(0);
    }
    expect(firstRun.policies.fsrs6_grade4_policy.postTetStabilityPreservedCount).toBeGreaterThan(0);
    expect(firstRun.policies.fsrs6_masterplan_10y.postTetStabilityPreservedCount).toBeGreaterThan(0);
  });

  it("agrees with src/shared/engine/review.ts Grade 4 FSRS-6 interval progression", () => {
    const t0 = ictMidnightUtcMs("2026-09-05") + 19 * 60 * 60 * 1000;
    const history: AttemptEvidence[] = [
      {
        attemptId: "sim-eq-1",
        skillId: "math-frac-equiv",
        outcome: "correct",
        helpLevel: 0,
        evidenceKind: "observed",
        attemptNo: 1,
        isTransfer: false,
        isReview: false,
        createdAt: t0,
      },
    ];
    const d1 = scheduleReview(history, t0)!;
    expect(d1.intervalDays).toBe(3);

    const t1 = d1.dueAt;
    history.push({
      attemptId: "sim-eq-2",
      skillId: "math-frac-equiv",
      outcome: "correct",
      helpLevel: 0,
      evidenceKind: "observed",
      attemptNo: 1,
      isTransfer: false,
      isReview: true,
      createdAt: t1,
    });
    const d2 = scheduleReview(history, t1)!;
    expect(d2.intervalDays).toBe(6);
  });
});

describe("G7 review:simulate CLI — fail-closed args & --output support", () => {
  it("writes JSON output when --output <path> is passed and rejects unknown flags with exit 1", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "tai-review-sim-test-"));
    try {
      const outFile = join(tmpDir, "sim-report.json");
      const stdout = execFileSync(process.execPath, [CLI_SCRIPT, "--output", outFile], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      const cliAck = JSON.parse(stdout.trim()) as { ok: boolean; wrote: string };
      expect(cliAck.ok).toBe(true);
      expect(cliAck.wrote).toBe(outFile);

      const written = JSON.parse(readFileSync(outFile, "utf8")) as {
        ok: boolean;
        deterministicByteIdentical: boolean;
      };
      expect(written.ok).toBe(true);
      expect(written.deterministicByteIdentical).toBe(true);

      let failedExitCode = 0;
      try {
        execFileSync(process.execPath, [CLI_SCRIPT, "--bogus-flag"], {
          cwd: REPO_ROOT,
          encoding: "utf8",
          stdio: "pipe",
        });
      } catch (error) {
        failedExitCode = (error as { status?: number }).status ?? 1;
      }
      expect(failedExitCode).toBe(1);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
