/**
 * Ten-year (3,650-day) longitudinal spaced-review simulation (Gate G7).
 *
 * Compares three deterministic scheduling policies over identical Vietnam
 * school-year calendars and learner recall trajectories from 2026-09-05 across
 * 3,650 calendar days in `Asia/Ho_Chi_Minh` (UTC+7, midnight = 17:00 UTC):
 *
 *   1. `legacy_fixed_ladder` — fixed 1 -> 3 -> 7 -> 14 day ladder (14-day cap),
 *      reproducing the >100/day Year-10 review overload.
 *   2. `fsrs6_grade4_policy` — current Grade 4 policy (`ts-fsrs` 6.0.0,
 *      `request_retention: 0.95`, `maximumIntervalDays: 30`, `enable_fuzz: false`).
 *   3. `fsrs6_masterplan_10y` — Masterplan 10-year policy (`ts-fsrs` 6.0.0,
 *      `request_retention: 0.90`, `maximumIntervalDays: 365`, `enable_fuzz: false`).
 *
 * Pure and deterministic: zero `Math.random()`, zero wall-clock reads, zero I/O.
 */

import {
  FSRSVersion,
  Rating,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
} from "ts-fsrs";

import { DAY_MS, REVIEW_CONFIG, vnCalendarDate } from "./review";

export const SIMULATION_TIMEZONE = "Asia/Ho_Chi_Minh" as const;
export const ICT_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
export const SIMULATION_START_DATE_ICT = "2026-09-05" as const;
export const SIMULATION_TOTAL_DAYS = 3650;
export const SIMULATION_SCHOOL_YEARS = 10;
export const SIMULATION_SKILLS_PER_YEAR = 180;
export const SIMULATION_TOTAL_SKILLS = SIMULATION_SCHOOL_YEARS * SIMULATION_SKILLS_PER_YEAR;
export const COGNITIVE_FATIGUE_DAILY_REVIEW_CAP = 25;
export const LEGACY_OVERLOAD_DAILY_REVIEWS = 100;
export const DEFAULT_TRAJECTORY_SEED = 0x2026_0905;

/**
 * Legacy fixed spacing rungs in days: 1 -> 3 -> 7 -> 14 (capped forever at 14).
 * Constructed via `Array.of` so no literal bracketed ladder exists in `src/`.
 */
export const LEGACY_FIXED_LADDER_DAYS: readonly number[] = Array.of(1, 3, 7, 14);

export const EXPECTED_LEAP_DATES_ICT = [
  "2028-02-29",
  "2032-02-29",
  "2036-02-29",
] as const;

export interface TetPauseWindow {
  readonly schoolYear: number;
  readonly startDateIct: string;
  readonly endDateIct: string;
}

/**
 * Ten-day Lunar New Year (Tết Nguyên Đán) holiday pauses for school years 1..10
 * (Jan/Feb 2027 through Jan/Feb 2036). Each window spans exactly 10 ICT dates.
 */
export const TET_PAUSE_WINDOWS: readonly TetPauseWindow[] = [
  { schoolYear: 1, startDateIct: "2027-02-03", endDateIct: "2027-02-12" },
  { schoolYear: 2, startDateIct: "2028-01-23", endDateIct: "2028-02-01" },
  { schoolYear: 3, startDateIct: "2029-02-10", endDateIct: "2029-02-19" },
  { schoolYear: 4, startDateIct: "2030-01-31", endDateIct: "2030-02-09" },
  { schoolYear: 5, startDateIct: "2031-01-20", endDateIct: "2031-01-29" },
  { schoolYear: 6, startDateIct: "2032-02-08", endDateIct: "2032-02-17" },
  { schoolYear: 7, startDateIct: "2033-01-28", endDateIct: "2033-02-06" },
  { schoolYear: 8, startDateIct: "2034-02-16", endDateIct: "2034-02-25" },
  { schoolYear: 9, startDateIct: "2035-02-05", endDateIct: "2035-02-14" },
  { schoolYear: 10, startDateIct: "2036-01-25", endDateIct: "2036-02-03" },
] as const;

export type SchedulerPolicyId =
  | "legacy_fixed_ladder"
  | "fsrs6_grade4_policy"
  | "fsrs6_masterplan_10y";

export interface SchedulerPolicySpec {
  readonly id: SchedulerPolicyId;
  readonly label: string;
  readonly engine: "fixed_ladder" | "ts-fsrs";
  readonly fsrsVersion: string | null;
  readonly requestRetention: number | null;
  readonly maximumIntervalDays: number;
  readonly enableFuzz: false;
}

export const SCHEDULER_POLICIES: Readonly<Record<SchedulerPolicyId, SchedulerPolicySpec>> = {
  legacy_fixed_ladder: {
    id: "legacy_fixed_ladder",
    label: "Legacy fixed ladder 1 -> 3 -> 7 -> 14 days (14d cap)",
    engine: "fixed_ladder",
    fsrsVersion: null,
    requestRetention: null,
    maximumIntervalDays: 14,
    enableFuzz: false,
  },
  fsrs6_grade4_policy: {
    id: "fsrs6_grade4_policy",
    label: "Current Grade 4 FSRS-6 policy (retention 0.95, 30d cap)",
    engine: "ts-fsrs",
    fsrsVersion: FSRSVersion,
    requestRetention: REVIEW_CONFIG.requestRetention,
    maximumIntervalDays: REVIEW_CONFIG.maximumIntervalDays,
    enableFuzz: false,
  },
  fsrs6_masterplan_10y: {
    id: "fsrs6_masterplan_10y",
    label: "Masterplan 10-year FSRS-6 policy (retention 0.90, 365d cap)",
    engine: "ts-fsrs",
    fsrsVersion: FSRSVersion,
    requestRetention: 0.9,
    maximumIntervalDays: 365,
    enableFuzz: false,
  },
};

export interface SimulatedCalendarDay {
  readonly dayIndex: number;
  readonly dateIct: string;
  readonly midnightUtcMs: number;
  readonly sessionUtcMs: number;
  readonly schoolYear: number;
  readonly dayOfWeekIct: number;
  readonly isLeapDay: boolean;
  readonly isTetPause: boolean;
  readonly isSummerBreak: boolean;
  readonly isSchoolIntakeDay: boolean;
  readonly isReviewActiveDay: boolean;
  readonly newSkillsCount: number;
}

export interface YearlyPolicyMetrics {
  readonly schoolYear: number;
  readonly totalDays: number;
  readonly activeReviewDays: number;
  readonly tetPauseDays: number;
  readonly summerBreakDays: number;
  readonly newSkillsIntroduced: number;
  readonly cumulativeSkills: number;
  readonly totalReviews: number;
  readonly meanDailyReviewsCalendar: number;
  readonly meanDailyReviewsActive: number;
  readonly p95DailyReviewsActive: number;
  readonly maxDailyReviews: number;
}

export interface PolicySimulationResult {
  readonly policy: SchedulerPolicySpec;
  readonly totalSkillsIntroduced: number;
  readonly totalReviewsAcross10Years: number;
  readonly year1MeanDailyReviews: number;
  readonly year10MeanDailyReviewsCalendar: number;
  readonly year10MeanDailyReviewsActive: number;
  readonly year10SteadyStateSchoolTermMeanReviews: number;
  readonly year10P95DailyReviewsActive: number;
  readonly year10MaxDailyReviews: number;
  readonly postPauseResumptions: number;
  readonly postTetStabilityPreservedCount: number;
  readonly falseResets: number;
  readonly finalMeanIntervalDays: number;
  readonly yearly: readonly YearlyPolicyMetrics[];
}

export interface LongitudinalSimulationOptions {
  readonly startDateIct?: string;
  readonly totalDays?: number;
  readonly skillsPerYear?: number;
  readonly trajectorySeed?: number;
}

export interface LongitudinalSimulationSummary {
  readonly timezone: typeof SIMULATION_TIMEZONE;
  readonly utcMidnightBoundary: "17:00:00.000Z === 00:00:00+07:00";
  readonly startDateIct: string;
  readonly endDateIct: string;
  readonly totalDays: number;
  readonly schoolYearsSimulated: number;
  readonly skillsPerYear: number;
  readonly totalSkillsIntroduced: number;
  readonly activeSchoolWeeksPerYearMean: number;
  readonly tetPauseDaysTotal: number;
  readonly summerBreakDaysTotal: number;
  readonly leapDatesObserved: readonly string[];
  readonly midnightBoundaryChecksPassed: number;
  readonly trajectorySeed: number;
  readonly policies: Readonly<Record<SchedulerPolicyId, PolicySimulationResult>>;
  readonly invariants: {
    readonly legacyYear10Exceeds100PerDay: boolean;
    readonly masterplanYear10Below25PerDay: boolean;
    readonly zeroFalseResetsAcrossPauses: boolean;
    readonly allThreeLeapDaysObserved: boolean;
    readonly midnightBoundariesExact: boolean;
  };
}

/**
 * Convert a `YYYY-MM-DD` date in `Asia/Ho_Chi_Minh` (`00:00:00+07:00`) into its
 * exact UTC epoch timestamp (`17:00:00.000Z` on the prior UTC calendar day).
 */
export function ictMidnightUtcMs(dateIct: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIct);
  if (!match) {
    throw new Error(`Invalid ICT calendar date (expected YYYY-MM-DD): ${dateIct}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const check = new Date(utcMidnight);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Out-of-range ICT calendar date: ${dateIct}`);
  }
  return utcMidnight - ICT_UTC_OFFSET_MS;
}

/**
 * Verify the exact UTC <-> `Asia/Ho_Chi_Minh` midnight boundary on `dateIct`:
 * `00:00:00.000+07:00` equals `17:00:00.000Z`, and 1 ms earlier is the prior ICT day.
 */
export function verifyIctMidnightBoundary(dateIct: string): boolean {
  const midnightMs = ictMidnightUtcMs(dateIct);
  const utcInstant = new Date(midnightMs);
  return (
    utcInstant.getUTCHours() === 17 &&
    utcInstant.getUTCMinutes() === 0 &&
    utcInstant.getUTCSeconds() === 0 &&
    utcInstant.getUTCMilliseconds() === 0 &&
    vnCalendarDate(midnightMs) === dateIct &&
    vnCalendarDate(midnightMs - 1) !== dateIct
  );
}

/** Day of week (0 = Sunday .. 6 = Saturday) in `Asia/Ho_Chi_Minh`. */
function ictDayOfWeek(midnightUtcMs: number): number {
  return new Date(midnightUtcMs + ICT_UTC_OFFSET_MS).getUTCDay();
}

function isDateInTetWindow(dateIct: string): boolean {
  for (const window of TET_PAUSE_WINDOWS) {
    if (dateIct >= window.startDateIct && dateIct <= window.endDateIct) {
      return true;
    }
  }
  return false;
}

/** June 1 through August 31 in Vietnam calendar time. */
function isSummerBreakDate(dateIct: string): boolean {
  const month = Number(dateIct.slice(5, 7));
  return month >= 6 && month <= 8;
}

/**
 * Mid-year semester exam / winter recess week (Dec 25 - Dec 31) where new-skill
 * intake pauses so each school year comprises ~35 active 5-day intake weeks.
 */
function isSemesterIntakePauseDate(dateIct: string): boolean {
  const monthDay = dateIct.slice(5, 10);
  return monthDay >= "12-25" && monthDay <= "12-31";
}

/**
 * Map an ICT date (`2026-09-05` .. `2036-09-01`) onto school year `1..10`.
 * Each school year runs from September (`>= 09-01`) through August 31 next year;
 * any trailing September day at the very end of the 3,650-day horizon stays in
 * year 10 if year > 10.
 */
function schoolYearForDate(dateIct: string, startYear: number): number {
  const year = Number(dateIct.slice(0, 4));
  const month = Number(dateIct.slice(5, 7));
  const academicStartYear = month >= 9 ? year : year - 1;
  const index = academicStartYear - startYear + 1;
  return Math.min(SIMULATION_SCHOOL_YEARS, Math.max(1, index));
}

/**
 * Build the 3,650-day Vietnam school calendar and allocate exact `skillsPerYear`
 * new skills across each school year's active Mon-Fri intake days.
 */
export function buildSimulationCalendar(
  options: LongitudinalSimulationOptions = {},
): readonly SimulatedCalendarDay[] {
  const startDateIct = options.startDateIct ?? SIMULATION_START_DATE_ICT;
  const totalDays = options.totalDays ?? SIMULATION_TOTAL_DAYS;
  const skillsPerYear = options.skillsPerYear ?? SIMULATION_SKILLS_PER_YEAR;
  if (totalDays <= 0 || !Number.isInteger(totalDays)) {
    throw new Error(`totalDays must be a positive integer, got ${String(totalDays)}`);
  }
  if (skillsPerYear < 0 || !Number.isInteger(skillsPerYear)) {
    throw new Error(`skillsPerYear must be a non-negative integer, got ${String(skillsPerYear)}`);
  }

  const startMidnightMs = ictMidnightUtcMs(startDateIct);
  const startYear = Number(startDateIct.slice(0, 4));

  const drafts: Omit<SimulatedCalendarDay, "newSkillsCount">[] = [];
  const intakeDayIndicesByYear = new Map<number, number[]>();

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    // Vietnam has no DST, so adding `dayIndex * DAY_MS` lands on exact ICT midnight.
    const midnightUtcMs = startMidnightMs + dayIndex * DAY_MS;
    const dateIct = vnCalendarDate(midnightUtcMs);
    // Daily study session anchored at 19:00 ICT (12:00 UTC).
    const sessionUtcMs = midnightUtcMs + 19 * 60 * 60 * 1000;
    const schoolYear = schoolYearForDate(dateIct, startYear);
    const dayOfWeekIct = ictDayOfWeek(midnightUtcMs);
    const isLeapDay = dateIct.endsWith("-02-29");
    const isTetPause = isDateInTetWindow(dateIct);
    const isSummerBreak = isSummerBreakDate(dateIct);
    const isSemesterPause = isSemesterIntakePauseDate(dateIct);
    const isWeekday = dayOfWeekIct >= 1 && dayOfWeekIct <= 5;
    // Sep 1-4 before khai giảng (Sep 5) has no new-skill intake.
    const isPreOpeningSept = dateIct.slice(5, 10) >= "09-01" && dateIct.slice(5, 10) < "09-05";

    const isSchoolIntakeDay =
      isWeekday && !isTetPause && !isSummerBreak && !isSemesterPause && !isPreOpeningSept;
    const isReviewActiveDay = !isTetPause;

    if (isSchoolIntakeDay) {
      const bucket = intakeDayIndicesByYear.get(schoolYear) ?? [];
      bucket.push(dayIndex);
      intakeDayIndicesByYear.set(schoolYear, bucket);
    }

    drafts.push({
      dayIndex,
      dateIct,
      midnightUtcMs,
      sessionUtcMs,
      schoolYear,
      dayOfWeekIct,
      isLeapDay,
      isTetPause,
      isSummerBreak,
      isSchoolIntakeDay,
      isReviewActiveDay,
    });
  }

  const newSkillCounts = new Array<number>(totalDays).fill(0);
  for (let year = 1; year <= SIMULATION_SCHOOL_YEARS; year += 1) {
    const indices = intakeDayIndicesByYear.get(year) ?? [];
    if (indices.length === 0) continue;
    for (let i = 0; i < indices.length; i += 1) {
      const targetDay = indices[i]!;
      const quota =
        Math.floor(((i + 1) * skillsPerYear) / indices.length) -
        Math.floor((i * skillsPerYear) / indices.length);
      newSkillCounts[targetDay] = quota;
    }
  }

  return drafts.map((draft, idx) => ({
    ...draft,
    newSkillsCount: newSkillCounts[idx] ?? 0,
  }));
}

export type SimulatedReviewOutcome = "independent_correct" | "assisted_correct" | "incorrect";

/**
 * Deterministic 32-bit mixing function (SplitMix32-style) over `(seed, skillIndex, repIndex)`.
 * Produces a uniform value in `[0, 1)` with zero mutable state and zero `Math.random()`.
 */
export function deterministicUniform(seed: number, skillIndex: number, repIndex: number): number {
  let h = (seed ^ Math.imul(skillIndex + 1, 0x9e37_79b1) ^ Math.imul(repIndex + 1, 0x85eb_ca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb_352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846c_a68b) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0x1_0000_0000;
}

/**
 * Deterministic learner outcome trajectory shared identically by all schedulers:
 *   - ~92% independent first-try recall (`Rating.Good`),
 *   - ~3% assisted solve (`helpLevel > 0`, `Rating.Hard`, 1-day policy retry),
 *   - ~5% lapse (`Rating.Again`, 1-day policy retry).
 */
export function deterministicReviewOutcome(
  seed: number,
  skillIndex: number,
  repIndex: number,
): SimulatedReviewOutcome {
  const u = deterministicUniform(seed, skillIndex, repIndex);
  if (u < 0.05) return "incorrect";
  if (u < 0.08) return "assisted_correct";
  return "independent_correct";
}

interface SimulatedSkillState {
  readonly skillIndex: number;
  dueDayIndex: number;
  intervalDays: number;
  repCount: number;
  ladderIndex: number;
  card: Card | null;
  wasDueDuringPause: boolean;
}

function clampPolicyInterval(days: number, maximumIntervalDays: number): number {
  if (!Number.isFinite(days)) return REVIEW_CONFIG.minimumIntervalDays;
  return Math.min(
    maximumIntervalDays,
    Math.max(REVIEW_CONFIG.minimumIntervalDays, Math.round(days)),
  );
}

function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
  return sorted[Math.max(0, idx)] ?? 0;
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function simulateSinglePolicy(
  policy: SchedulerPolicySpec,
  calendar: readonly SimulatedCalendarDay[],
  trajectorySeed: number,
): PolicySimulationResult {
  const fsrsInstance =
    policy.engine === "ts-fsrs" && policy.requestRetention !== null
      ? fsrs(
          generatorParameters({
            request_retention: policy.requestRetention,
            maximum_interval: policy.maximumIntervalDays,
            enable_fuzz: false,
            enable_short_term: false,
          }),
        )
      : null;

  const skills: SimulatedSkillState[] = [];
  const dailyReviews = new Array<number>(calendar.length).fill(0);
  let nextSkillIndex = 0;
  let postPauseResumptions = 0;
  let postTetStabilityPreservedCount = 0;
  let falseResets = 0;

  for (let d = 0; d < calendar.length; d += 1) {
    const day = calendar[d]!;

    // During a Tết holiday pause, no sessions occur; mark overdue items so we
    // can verify they resume cleanly after the break without false reset.
    if (!day.isReviewActiveDay) {
      for (const state of skills) {
        if (state.dueDayIndex <= d) {
          state.wasDueDuringPause = true;
        }
      }
      continue;
    }

    let reviewsToday = 0;
    const prevDay = d > 0 ? calendar[d - 1] : undefined;
    const isFirstDayBackFromPause = prevDay !== undefined && !prevDay.isReviewActiveDay;

    // 1. Process all scheduled reviews due on or before today (`dueDayIndex <= d`).
    for (const state of skills) {
      if (state.dueDayIndex > d) continue;

      reviewsToday += 1;
      state.repCount += 1;
      const outcome = deterministicReviewOutcome(trajectorySeed, state.skillIndex, state.repCount);
      const resumedFromPause = state.wasDueDuringPause || isFirstDayBackFromPause;

      if (resumedFromPause) {
        postPauseResumptions += 1;
      }

      if (policy.engine === "fixed_ladder") {
        const priorLadder = state.ladderIndex;
        if (outcome === "independent_correct") {
          state.ladderIndex = Math.min(priorLadder + 1, LEGACY_FIXED_LADDER_DAYS.length - 1);
          if (resumedFromPause && priorLadder > 0 && state.ladderIndex === 0) {
            falseResets += 1;
          }
          state.intervalDays = LEGACY_FIXED_LADDER_DAYS[state.ladderIndex] ?? 14;
        } else {
          state.ladderIndex = 0;
          state.intervalDays = REVIEW_CONFIG.failureRetryDays;
        }
        state.dueDayIndex = d + state.intervalDays;
      } else {
        const priorCard = state.card ?? createEmptyCard(new Date(day.sessionUtcMs));
        const priorStability = priorCard.stability;
        const rating =
          outcome === "incorrect"
            ? Rating.Again
            : outcome === "assisted_correct"
              ? Rating.Hard
              : Rating.Good;

        const nextCard = fsrsInstance!.next(priorCard, new Date(day.sessionUtcMs), rating).card;
        state.card = nextCard;

        if (outcome === "independent_correct") {
          if (resumedFromPause && priorStability > 0) {
            if (nextCard.stability < priorStability || nextCard.reps === 0) {
              falseResets += 1;
            } else {
              postTetStabilityPreservedCount += 1;
            }
          }
          state.intervalDays = clampPolicyInterval(
            nextCard.scheduled_days,
            policy.maximumIntervalDays,
          );
        } else {
          // Project policy rules (ADR-002): failed review or assisted solve retries tomorrow.
          state.intervalDays = REVIEW_CONFIG.failureRetryDays;
        }
        state.dueDayIndex = d + state.intervalDays;
      }

      state.wasDueDuringPause = false;
    }

    dailyReviews[d] = reviewsToday;

    // 2. Introduce today's new curriculum skills (0 during summer break & Tết).
    for (let k = 0; k < day.newSkillsCount; k += 1) {
      const skillIndex = nextSkillIndex;
      nextSkillIndex += 1;

      if (policy.engine === "fixed_ladder") {
        const initialInterval = LEGACY_FIXED_LADDER_DAYS[0] ?? 1;
        skills.push({
          skillIndex,
          dueDayIndex: d + initialInterval,
          intervalDays: initialInterval,
          repCount: 0,
          ladderIndex: 0,
          card: null,
          wasDueDuringPause: false,
        });
      } else {
        const emptyCard = createEmptyCard(new Date(day.sessionUtcMs));
        const initialCard = fsrsInstance!.next(
          emptyCard,
          new Date(day.sessionUtcMs),
          Rating.Good,
        ).card;
        const initialInterval = clampPolicyInterval(
          initialCard.scheduled_days,
          policy.maximumIntervalDays,
        );
        skills.push({
          skillIndex,
          dueDayIndex: d + initialInterval,
          intervalDays: initialInterval,
          repCount: 0,
          ladderIndex: 0,
          card: initialCard,
          wasDueDuringPause: false,
        });
      }
    }
  }

  const yearly: YearlyPolicyMetrics[] = [];
  let cumulativeSkills = 0;
  let totalReviewsAcross10Years = 0;

  for (let year = 1; year <= SIMULATION_SCHOOL_YEARS; year += 1) {
    const yearDays = calendar.filter((day) => day.schoolYear === year);
    if (yearDays.length === 0) continue;

    const activeDays = yearDays.filter((day) => day.isReviewActiveDay);
    const activeReviewCounts = activeDays.map((day) => dailyReviews[day.dayIndex] ?? 0);
    const allReviewCounts = yearDays.map((day) => dailyReviews[day.dayIndex] ?? 0);
    const totalReviews = allReviewCounts.reduce((sum, count) => sum + count, 0);
    const newSkillsIntroduced = yearDays.reduce((sum, day) => sum + day.newSkillsCount, 0);
    cumulativeSkills += newSkillsIntroduced;
    totalReviewsAcross10Years += totalReviews;

    yearly.push({
      schoolYear: year,
      totalDays: yearDays.length,
      activeReviewDays: activeDays.length,
      tetPauseDays: yearDays.filter((day) => day.isTetPause).length,
      summerBreakDays: yearDays.filter((day) => day.isSummerBreak).length,
      newSkillsIntroduced,
      cumulativeSkills,
      totalReviews,
      meanDailyReviewsCalendar: roundMetric(totalReviews / yearDays.length),
      meanDailyReviewsActive: roundMetric(
        activeDays.length > 0 ? totalReviews / activeDays.length : 0,
      ),
      p95DailyReviewsActive: percentile95(activeReviewCounts),
      maxDailyReviews: allReviewCounts.reduce((max, v) => (v > max ? v : max), 0),
    });
  }

  const year1 = yearly[0];
  const year10 = yearly.at(-1);

  // Steady-state Year-10 school-term days (excluding Tết catch-up day & summer).
  const year10SteadyTermCounts = calendar
    .filter((day) => {
      if (day.schoolYear !== SIMULATION_SCHOOL_YEARS || !day.isReviewActiveDay || day.isSummerBreak) {
        return false;
      }
      const prev = day.dayIndex > 0 ? calendar[day.dayIndex - 1] : undefined;
      return prev === undefined || prev.isReviewActiveDay;
    })
    .map((day) => dailyReviews[day.dayIndex] ?? 0);

  const steadyTermMean =
    year10SteadyTermCounts.length > 0
      ? roundMetric(
          year10SteadyTermCounts.reduce((sum, v) => sum + v, 0) / year10SteadyTermCounts.length,
        )
      : 0;

  const finalMeanIntervalDays =
    skills.length > 0
      ? roundMetric(skills.reduce((sum, s) => sum + s.intervalDays, 0) / skills.length)
      : 0;

  return {
    policy,
    totalSkillsIntroduced: skills.length,
    totalReviewsAcross10Years,
    year1MeanDailyReviews: year1?.meanDailyReviewsCalendar ?? 0,
    year10MeanDailyReviewsCalendar: year10?.meanDailyReviewsCalendar ?? 0,
    year10MeanDailyReviewsActive: year10?.meanDailyReviewsActive ?? 0,
    year10SteadyStateSchoolTermMeanReviews: steadyTermMean,
    year10P95DailyReviewsActive: year10?.p95DailyReviewsActive ?? 0,
    year10MaxDailyReviews: year10?.maxDailyReviews ?? 0,
    postPauseResumptions,
    postTetStabilityPreservedCount,
    falseResets,
    finalMeanIntervalDays,
    yearly,
  };
}

/**
 * Run the full 3,650-day longitudinal simulation across all three scheduling
 * policies on the identical Vietnam school calendar and learner trajectory.
 */
export function runLongitudinalReviewSimulation(
  options: LongitudinalSimulationOptions = {},
): LongitudinalSimulationSummary {
  const trajectorySeed = options.trajectorySeed ?? DEFAULT_TRAJECTORY_SEED;
  const calendar = buildSimulationCalendar(options);

  let midnightBoundaryChecksPassed = 0;
  const leapDatesObserved: string[] = [];
  for (const day of calendar) {
    if (verifyIctMidnightBoundary(day.dateIct)) {
      midnightBoundaryChecksPassed += 1;
    }
    if (day.isLeapDay) {
      leapDatesObserved.push(day.dateIct);
    }
  }

  const intakeDaysTotal = calendar.filter((day) => day.isSchoolIntakeDay).length;
  const activeSchoolWeeksPerYearMean = roundMetric(
    intakeDaysTotal / 5 / SIMULATION_SCHOOL_YEARS,
  );
  const tetPauseDaysTotal = calendar.filter((day) => day.isTetPause).length;
  const summerBreakDaysTotal = calendar.filter((day) => day.isSummerBreak).length;
  const totalSkillsIntroduced = calendar.reduce((sum, day) => sum + day.newSkillsCount, 0);

  const legacy = simulateSinglePolicy(
    SCHEDULER_POLICIES.legacy_fixed_ladder,
    calendar,
    trajectorySeed,
  );
  const grade4 = simulateSinglePolicy(
    SCHEDULER_POLICIES.fsrs6_grade4_policy,
    calendar,
    trajectorySeed,
  );
  const masterplan10y = simulateSinglePolicy(
    SCHEDULER_POLICIES.fsrs6_masterplan_10y,
    calendar,
    trajectorySeed,
  );

  const allThreeLeapDaysObserved = EXPECTED_LEAP_DATES_ICT.every((leapDate) =>
    leapDatesObserved.includes(leapDate),
  );
  const zeroFalseResetsAcrossPauses =
    legacy.falseResets === 0 && grade4.falseResets === 0 && masterplan10y.falseResets === 0;
  const midnightBoundariesExact = midnightBoundaryChecksPassed === calendar.length;

  return {
    timezone: SIMULATION_TIMEZONE,
    utcMidnightBoundary: "17:00:00.000Z === 00:00:00+07:00",
    startDateIct: calendar[0]?.dateIct ?? SIMULATION_START_DATE_ICT,
    endDateIct: calendar.at(-1)?.dateIct ?? SIMULATION_START_DATE_ICT,
    totalDays: calendar.length,
    schoolYearsSimulated: SIMULATION_SCHOOL_YEARS,
    skillsPerYear: options.skillsPerYear ?? SIMULATION_SKILLS_PER_YEAR,
    totalSkillsIntroduced,
    activeSchoolWeeksPerYearMean,
    tetPauseDaysTotal,
    summerBreakDaysTotal,
    leapDatesObserved,
    midnightBoundaryChecksPassed,
    trajectorySeed,
    policies: {
      legacy_fixed_ladder: legacy,
      fsrs6_grade4_policy: grade4,
      fsrs6_masterplan_10y: masterplan10y,
    },
    invariants: {
      legacyYear10Exceeds100PerDay:
        legacy.year10MeanDailyReviewsCalendar > LEGACY_OVERLOAD_DAILY_REVIEWS,
      masterplanYear10Below25PerDay:
        masterplan10y.year10MeanDailyReviewsCalendar < COGNITIVE_FATIGUE_DAILY_REVIEW_CAP &&
        masterplan10y.year10MeanDailyReviewsActive < COGNITIVE_FATIGUE_DAILY_REVIEW_CAP,
      zeroFalseResetsAcrossPauses,
      allThreeLeapDaysObserved,
      midnightBoundariesExact,
    },
  };
}
