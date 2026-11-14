/**
 * Learner session time-budget policy (Gate G9).
 *
 * Grade 4–5 learners (ages 9–11) have a 25-minute cognitive and visual-comfort
 * budget per study session (`MAX_LEARNER_SESSION_MS`), paired with a 15-minute
 * eye-rest cooldown (`EYE_REST_COOLDOWN_MS`) after a soft-stopped session ends.
 *
 * Soft-stop contract:
 *   1. An in-flight step attempt is ALWAYS accepted and graded when the clock
 *      crosses `budgetMs` — the child never loses work they were typing or
 *      solving on scratch paper.
 *   2. Once `elapsedMs >= budgetMs`, the server sets `sessionTimeBudgetReached: true`
 *      on the attempt response and refuses a SECOND post-budget step submission
 *      on a DIFFERENT step in that session until either the session is finalized
 *      for rest or the parent explicitly grants an audited extension
 *      (`session.time_extended`, +15 minutes per grant).
 *   3. Starting a brand-new session within `EYE_REST_COOLDOWN_MS` of a session
 *      that ended at or above its time budget is refused with a calm Vietnamese
 *      eye-rest message unless the parent granted an extension covering `nowMs`.
 */

export const MAX_LEARNER_SESSION_MINUTES = 25;
export const MAX_LEARNER_SESSION_MS = 25 * 60 * 1000;
export const PARENT_SESSION_EXTENSION_MINUTES = 15;
export const PARENT_SESSION_EXTENSION_MS = 15 * 60 * 1000;
export const EYE_REST_COOLDOWN_MINUTES = 15;
export const EYE_REST_COOLDOWN_MS = 15 * 60 * 1000;

export type SessionBudgetStatus = {
  /** Whether the Grade 4–5 25-minute cap applies to this learner. */
  applies: boolean;
  startedAt: number;
  elapsedMs: number;
  budgetMs: number;
  remainingMs: number;
  extensionCount: number;
  reached: boolean;
};

/**
 * Cap applies to elementary learners (Grade <= 5 or unset/default Grade 4).
 * Older secondary learners in future horizons may use a wider window, while
 * keeping the Grade 4–5 household default fail-closed at 25 minutes.
 */
export function sessionCapAppliesToGrade(grade: number | null | undefined): boolean {
  if (grade === null || grade === undefined) return true;
  return grade <= 5;
}

export type SessionWindowSegment = {
  id: string;
  startedAt: number;
  endedAt: number | null;
};

/**
 * Compute continuous active study duration across back-to-back sessions that
 * were NOT separated by a full 15-minute `EYE_REST_COOLDOWN_MS` break (or an
 * explicit parent `session.rest_overridden` event).
 *
 * This closes the lesson-switch loophole: abandoning Lesson A at minute 24 and
 * immediately opening Lesson B carries forward the 24 minutes already spent,
 * rather than resetting the 25-minute timer to zero.
 */
export function computeContinuousStudyCarryOverMs(input: {
  currentSessionId?: string | null;
  anchorMs: number;
  priorSessions: readonly SessionWindowSegment[];
  lastParentRestOverrideAt?: number | null;
}): number {
  const closed = input.priorSessions
    .filter(
      (s): s is { id: string; startedAt: number; endedAt: number } =>
        s.id !== input.currentSessionId &&
        typeof s.endedAt === "number" &&
        s.endedAt <= input.anchorMs &&
        s.endedAt >= s.startedAt,
    )
    .sort((a, b) => b.endedAt - a.endedAt);

  let carryOverMs = 0;
  let chainCursorStart = input.anchorMs;

  for (const seg of closed) {
    if (
      typeof input.lastParentRestOverrideAt === "number" &&
      input.lastParentRestOverrideAt >= seg.endedAt &&
      input.lastParentRestOverrideAt <= chainCursorStart
    ) {
      break;
    }
    const gapMs = chainCursorStart - seg.endedAt;
    if (gapMs >= EYE_REST_COOLDOWN_MS) {
      break;
    }
    carryOverMs += seg.endedAt - seg.startedAt;
    chainCursorStart = Math.min(chainCursorStart, seg.startedAt);
  }

  return carryOverMs;
}

export function evaluateSessionBudget(input: {
  grade: number | null | undefined;
  startedAt: number;
  nowMs: number;
  extensionCount?: number;
  carryOverMs?: number;
}): SessionBudgetStatus {
  const applies = sessionCapAppliesToGrade(input.grade);
  const extensionCount = Math.max(0, Math.trunc(input.extensionCount ?? 0));
  const carryOverMs = Math.max(0, Math.trunc(input.carryOverMs ?? 0));
  const budgetMs = MAX_LEARNER_SESSION_MS + extensionCount * PARENT_SESSION_EXTENSION_MS;
  const elapsedMs = Math.max(0, input.nowMs - input.startedAt) + carryOverMs;
  const remainingMs = applies ? Math.max(0, budgetMs - elapsedMs) : budgetMs;
  const reached = applies && elapsedMs >= budgetMs;

  return {
    applies,
    startedAt: input.startedAt,
    elapsedMs,
    budgetMs,
    remainingMs,
    extensionCount,
    reached,
  };
}

export type EyeRestStatus = {
  resting: boolean;
  resumeAt: number | null;
  remainingRestMinutes: number;
};

/**
 * Determine whether the learner is currently inside the post-25-minute eye-rest
 * window from their most recently ended session (including cumulative study
 * across back-to-back sessions that were not separated by a 15-minute rest).
 */
export function evaluateEyeRestCooldown(input: {
  grade: number | null | undefined;
  lastEndedSession: {
    startedAt: number;
    endedAt: number;
    extensionCount: number;
    carryOverMs?: number;
  } | null;
  lastParentRestOverrideAt?: number | null;
  nowMs: number;
}): EyeRestStatus {
  if (!sessionCapAppliesToGrade(input.grade) || !input.lastEndedSession) {
    return { resting: false, resumeAt: null, remainingRestMinutes: 0 };
  }

  const { startedAt, endedAt, extensionCount, carryOverMs } = input.lastEndedSession;
  const sessionBudgetMs =
    MAX_LEARNER_SESSION_MS + Math.max(0, Math.trunc(extensionCount)) * PARENT_SESSION_EXTENSION_MS;
  const durationMs = Math.max(0, endedAt - startedAt) + Math.max(0, Math.trunc(carryOverMs ?? 0));

  // Cooldown triggers only when the prior session actually ran up to its time budget.
  if (durationMs < sessionBudgetMs) {
    return { resting: false, resumeAt: null, remainingRestMinutes: 0 };
  }

  if (
    typeof input.lastParentRestOverrideAt === "number" &&
    input.lastParentRestOverrideAt >= endedAt
  ) {
    return { resting: false, resumeAt: null, remainingRestMinutes: 0 };
  }

  const resumeAt = endedAt + EYE_REST_COOLDOWN_MS;
  if (input.nowMs >= resumeAt) {
    return { resting: false, resumeAt: null, remainingRestMinutes: 0 };
  }

  const remainingRestMinutes = Math.max(1, Math.ceil((resumeAt - input.nowMs) / 60_000));
  return {
    resting: true,
    resumeAt,
    remainingRestMinutes,
  };
}
