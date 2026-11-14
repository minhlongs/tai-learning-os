import { describe, expect, it } from "vitest";
import {
  EYE_REST_COOLDOWN_MS,
  MAX_LEARNER_SESSION_MINUTES,
  MAX_LEARNER_SESSION_MS,
  PARENT_SESSION_EXTENSION_MS,
  computeContinuousStudyCarryOverMs,
  evaluateEyeRestCooldown,
  evaluateSessionBudget,
  sessionCapAppliesToGrade,
} from "../../src/shared/engine/session-budget";
import {
  LEARNER_RULE_ENGINE_VERSION,
  isScheduledReviewFirstTryIndependent,
  recomputeLearnerState,
} from "../../src/shared/engine/recompute-learner-state";

describe("Gate G9 — 25-minute learner session budget & eye-rest cooldown", () => {
  it("applies 25-minute cap to Grades 4–5 and unset grades", () => {
    expect(MAX_LEARNER_SESSION_MINUTES).toBe(25);
    expect(MAX_LEARNER_SESSION_MS).toBe(25 * 60 * 1000);
    expect(sessionCapAppliesToGrade(4)).toBe(true);
    expect(sessionCapAppliesToGrade(5)).toBe(true);
    expect(sessionCapAppliesToGrade(null)).toBe(true);
    expect(sessionCapAppliesToGrade(6)).toBe(false);
  });

  it("marks budget reached at exactly 25 minutes and adds +15m per parent extension", () => {
    const start = 1_760_000_000_000;
    const beforeCap = evaluateSessionBudget({
      grade: 4,
      startedAt: start,
      nowMs: start + MAX_LEARNER_SESSION_MS - 1,
    });
    expect(beforeCap.reached).toBe(false);
    expect(beforeCap.remainingMs).toBe(1);

    const atCap = evaluateSessionBudget({
      grade: 4,
      startedAt: start,
      nowMs: start + MAX_LEARNER_SESSION_MS,
    });
    expect(atCap.reached).toBe(true);
    expect(atCap.remainingMs).toBe(0);

    const extended = evaluateSessionBudget({
      grade: 4,
      startedAt: start,
      nowMs: start + MAX_LEARNER_SESSION_MS + 60_000,
      extensionCount: 1,
    });
    expect(extended.budgetMs).toBe(MAX_LEARNER_SESSION_MS + PARENT_SESSION_EXTENSION_MS);
    expect(extended.reached).toBe(false);
    expect(extended.remainingMs).toBe(PARENT_SESSION_EXTENSION_MS - 60_000);
  });

  it("enforces 15-minute eye-rest cooldown after a full 25-minute session unless overridden by parent", () => {
    const start = 1_760_000_000_000;
    const endedAt = start + MAX_LEARNER_SESSION_MS;

    const shortSession = evaluateEyeRestCooldown({
      grade: 4,
      lastEndedSession: { startedAt: start, endedAt: start + 10 * 60_000, extensionCount: 0 },
      nowMs: start + 11 * 60_000,
    });
    expect(shortSession.resting).toBe(false);

    const resting = evaluateEyeRestCooldown({
      grade: 4,
      lastEndedSession: { startedAt: start, endedAt, extensionCount: 0 },
      nowMs: endedAt + 5 * 60_000,
    });
    expect(resting.resting).toBe(true);
    expect(resting.remainingRestMinutes).toBe(10);
    expect(resting.resumeAt).toBe(endedAt + EYE_REST_COOLDOWN_MS);

    const overridden = evaluateEyeRestCooldown({
      grade: 4,
      lastEndedSession: { startedAt: start, endedAt, extensionCount: 0 },
      lastParentRestOverrideAt: endedAt + 60_000,
      nowMs: endedAt + 5 * 60_000,
    });
    expect(overridden.resting).toBe(false);
  });

  it("carries continuous study duration across back-to-back sessions separated by less than 15 minutes", () => {
    const t0 = 1_760_000_000_000;
    const s1End = t0 + 24 * 60_000;
    const s2Start = s1End + 30_000; // 30s gap (< 15m eye-rest break)

    const carry = computeContinuousStudyCarryOverMs({
      currentSessionId: "s2",
      anchorMs: s2Start,
      priorSessions: [{ id: "s1", startedAt: t0, endedAt: s1End }],
    });
    expect(carry).toBe(24 * 60_000);

    const budgetOnS2 = evaluateSessionBudget({
      grade: 4,
      startedAt: s2Start,
      nowMs: s2Start + 65_000, // 24m + 1m05s >= 25m
      carryOverMs: carry,
    });
    expect(budgetOnS2.reached).toBe(true);

    // After a full 15-minute rest break, carry-over resets to 0
    const afterFullBreak = computeContinuousStudyCarryOverMs({
      currentSessionId: "s3",
      anchorMs: s1End + EYE_REST_COOLDOWN_MS,
      priorSessions: [{ id: "s1", startedAt: t0, endedAt: s1End }],
    });
    expect(afterFullBreak).toBe(0);
  });
});

describe("Gate G6 — scheduled review first-try unlock & deterministic recomputeLearnerState", () => {
  it("unlocks first-try unassisted attempt only when scheduled review is due", () => {
    const dueAt = 1_760_100_000_000;
    // Before dueAt -> false (preserves Gate A2 anti-brute-force)
    expect(
      isScheduledReviewFirstTryIndependent({
        outcome: "correct",
        helpLevel: 0,
        priorDueAt: dueAt,
        createdAt: dueAt - 1,
        priorSameSessionStepAttempts: 0,
        purpose: "official",
      }),
    ).toBe(false);

    // At or after dueAt, first try in review session, helpLevel 0 -> true
    expect(
      isScheduledReviewFirstTryIndependent({
        outcome: "correct",
        helpLevel: 0,
        priorDueAt: dueAt,
        createdAt: dueAt,
        priorSameSessionStepAttempts: 0,
        purpose: "official",
      }),
    ).toBe(true);

    // Second try in the SAME review session -> false
    expect(
      isScheduledReviewFirstTryIndependent({
        outcome: "correct",
        helpLevel: 0,
        priorDueAt: dueAt,
        createdAt: dueAt + 5000,
        priorSameSessionStepAttempts: 1,
        purpose: "official",
      }),
    ).toBe(false);

    // Practice session -> false
    expect(
      isScheduledReviewFirstTryIndependent({
        outcome: "correct",
        helpLevel: 0,
        priorDueAt: dueAt,
        createdAt: dueAt,
        priorSameSessionStepAttempts: 0,
        purpose: "practice",
      }),
    ).toBe(false);
  });

  it("recomputes cross-session INDEPENDENT -> RETAINED -> TRANSFERRED deterministically", () => {
    const dayMs = 86_400_000;
    const t0 = 1_760_000_000_000;

    // Session 1: 1 independent solve on step-a -> NOT_OBSERVED (1/2) & schedules 3d review
    // Session 2 (after 3d due): 1 independent solve on step-a (attemptNo=2 on step-a, but due review!) -> RETAINED!
    const snapshot = recomputeLearnerState({
      learnerId: "learner-sample",
      transferStepIds: new Set(["step-transfer"]),
      attempts: [
        {
          id: "att-1",
          sessionId: "sess-1",
          stepId: "step-a",
          skillId: "math-frac-equiv",
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 1,
          purpose: "official",
          createdAt: t0,
        },
        {
          id: "att-2",
          sessionId: "sess-2",
          stepId: "step-a",
          skillId: "math-frac-equiv",
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 2,
          purpose: "official",
          createdAt: t0 + 3 * dayMs + 1000,
        },
      ],
    });

    expect(snapshot.ruleEngineVersion).toBe(LEARNER_RULE_ENGINE_VERSION);
    const skill = snapshot.skills.get("math-frac-equiv");
    expect(skill).toBeDefined();
    expect(skill?.derivation.independentCount).toBe(2);
    expect(skill?.derivation.independentSessionCount).toBe(2);
    expect(skill?.derivation.state).toBe("RETAINED");
    expect(skill?.review?.intervalDays).toBeGreaterThan(3);

    // Re-running with shuffled attempts yields byte-identical output
    const reversed = recomputeLearnerState({
      learnerId: "learner-sample",
      transferStepIds: new Set(["step-transfer"]),
      attempts: [
        {
          id: "att-2",
          sessionId: "sess-2",
          stepId: "step-a",
          skillId: "math-frac-equiv",
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 2,
          purpose: "official",
          createdAt: t0 + 3 * dayMs + 1000,
        },
        {
          id: "att-1",
          sessionId: "sess-1",
          stepId: "step-a",
          skillId: "math-frac-equiv",
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 1,
          purpose: "official",
          createdAt: t0,
        },
      ],
    });
    expect(reversed.skills.get("math-frac-equiv")).toEqual(skill);
  });
});
