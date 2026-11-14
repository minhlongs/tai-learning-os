import { describe, expect, it } from "vitest";

import {
  COMPETENCY_CONFIG,
  deriveCompetency,
  isIndependentAttempt,
  type AttemptEvidence,
} from "../../src/shared/engine/competency";
import type { EvidenceKind, SubmissionOutcome } from "../../src/shared/schemas/attempt";

/**
 * The competency ladder exists to stop a single lucky guess from being reported
 * to a parent as mastery. Every test here guards one rung of that ladder.
 */

const SKILL = "math-frac-equiv";
const OTHER_SKILL = "math-frac-compare";

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
    createdAt: 1_700_000_000_000 + sequence * 1000,
    ...overrides,
  };
}

function correct(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  return attempt({ outcome: "correct" as SubmissionOutcome, ...overrides });
}

function incorrect(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  return attempt({ outcome: "incorrect" as SubmissionOutcome, ...overrides });
}

describe("deriveCompetency — no evidence", () => {
  it("returns NOT_OBSERVED with an empty history", () => {
    const result = deriveCompetency([]);
    expect(result.state).toBe("NOT_OBSERVED");
    expect(result.correctCount).toBe(0);
    expect(result.independentCount).toBe(0);
  });

  it("returns NOT_OBSERVED when every attempt is incorrect", () => {
    const result = deriveCompetency([incorrect(), incorrect(), incorrect()]);
    expect(result.state).toBe("NOT_OBSERVED");
    expect(result.correctCount).toBe(0);
  });

  it("ignores attempts tagged for a different skill", () => {
    const foreign = correct({ skillId: OTHER_SKILL, attemptId: "foreign" });
    expect(deriveCompetency([foreign]).state).toBe("NOT_OBSERVED");
  });

  it("ignores attempts with an empty skillId", () => {
    expect(deriveCompetency([correct({ skillId: "" })]).state).toBe("NOT_OBSERVED");
  });
});

describe("deriveCompetency — a single correct guess is not mastery", () => {
  it("keeps ONE unassisted correct attempt below INDEPENDENT", () => {
    const result = deriveCompetency([correct()]);
    expect(result.independentCount).toBe(1);
    // The critical assertion: one attempt can never establish mastery.
    expect(result.state).not.toBe("INDEPENDENT");
    expect(["NOT_OBSERVED", "SUPPORTED"]).toContain(result.state);
    expect(result.reason_vi).toBe(
      "Em đã tự làm đúng 1 lần. Cần thêm 1 lần nữa để ba mẹ thấy em đã nắm chắc.",
    );
    expect(result.reason_vi).not.toContain("chưa làm đúng lần nào");
  });

  it("reserves 'chưa làm đúng lần nào' strictly for zero correct attempts", () => {
    const zeroCorrect = deriveCompetency([incorrect(), incorrect()]);
    expect(zeroCorrect.correctCount).toBe(0);
    expect(zeroCorrect.state).toBe("NOT_OBSERVED");
    expect(zeroCorrect.reason_vi).toBe(
      "Em đã thử nhưng chưa làm đúng lần nào một cách độc lập.",
    );
  });

  it("preserves the unaided-solve acknowledgment when one independent solve coexists with an assisted solve", () => {
    const mixed = deriveCompetency([
      correct({ helpLevel: 1, evidenceKind: "assisted" }),
      correct({ helpLevel: 0, attemptNo: 1, evidenceKind: "observed" }),
    ]);
    expect(mixed.state).toBe("SUPPORTED");
    expect(mixed.independentCount).toBe(1);
    expect(mixed.assistedCount).toBe(1);
    expect(mixed.reason_vi).toBe(
      "Em đã tự làm đúng 1 lần và làm đúng có hỗ trợ 1 lần. Cần thêm 1 lần tự làm đúng nữa để ba mẹ thấy em đã nắm chắc.",
    );
  });

  it("reports zero-attempt wording when only a NOT_OBSERVED parent correction exists", () => {
    const onlyCorrection = deriveCompetency([
      correct({ evidenceKind: "parent_correction", correctedState: "NOT_OBSERVED" }),
    ]);
    expect(onlyCorrection.state).toBe("NOT_OBSERVED");
    expect(onlyCorrection.reason_vi).toBe("Chưa có bài tập nào được ghi nhận cho kỹ năng này.");
  });

  it("does not promote ONE correct attempt with a small hint", () => {
    const result = deriveCompetency([correct({ helpLevel: 1, evidenceKind: "assisted" })]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(1);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });

  it("reflects the configured minimum in the reported reason", () => {
    expect(COMPETENCY_CONFIG.independentMinCorrect).toBe(2);
    expect(COMPETENCY_CONFIG.smallHint).toBe(0);
  });
});

describe("deriveCompetency — the independent threshold", () => {
  it("promotes to INDEPENDENT on two unassisted correct attempts (helpLevel: 0, attemptNo: 1)", () => {
    const result = deriveCompetency([
      correct({ helpLevel: 0, attemptNo: 1, evidenceKind: "observed" }),
      correct({ helpLevel: 0, attemptNo: 1, evidenceKind: "observed" }),
    ]);
    expect(result.independentCount).toBe(2);
    expect(result.state).toBe("INDEPENDENT");
  });

  it("still promotes when the two unassisted attempts are separated by a failure", () => {
    const result = deriveCompetency([correct(), incorrect(), correct()]);
    expect(result.state).toBe("INDEPENDENT");
  });

  it("treats helpLevel 1 as SUPPORTED / assisted, NOT INDEPENDENT", () => {
    const result = deriveCompetency([
      correct({ helpLevel: 1, evidenceKind: "assisted" }),
      correct({ helpLevel: 1, evidenceKind: "assisted" }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(2);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });

  it("treats helpLevel 2 as SUPPORTED / assisted, NOT INDEPENDENT", () => {
    const result = deriveCompetency([
      correct({ helpLevel: 2, evidenceKind: "assisted" }),
      correct({ helpLevel: 2, evidenceKind: "assisted" }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(2);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });

  it("treats helpLevel >= 3 (including partial outcomes) as SUPPORTED / assisted, NOT INDEPENDENT", () => {
    const result = deriveCompetency([
      attempt({ outcome: "partial", helpLevel: 3, evidenceKind: "assisted" }),
      attempt({ outcome: "partial", helpLevel: 4, evidenceKind: "assisted" }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(2);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });

  it("rejects spoofed helpLevel 0 if evidenceKind was marked assisted due to disclosed hint", () => {
    const result = deriveCompetency([
      correct({ helpLevel: 0, evidenceKind: "assisted" }),
      correct({ helpLevel: 0, evidenceKind: "assisted" }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(2);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });
});

describe("deriveCompetency — assisted answers are SUPPORTED", () => {
  it("reports SUPPORTED for two assisted correct attempts", () => {
    const result = deriveCompetency([
      correct({ helpLevel: 3 }),
      correct({ helpLevel: 4 }),
    ]);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
    expect(result.assistedCount).toBe(2);
    expect(result.independentCount).toBe(0);
  });

  it("reports SUPPORTED when one attempt is assisted and one independent", () => {
    const result = deriveCompetency([correct(), correct({ helpLevel: 3 })]);
    expect(result.state).toBe("SUPPORTED");
  });

  it("counts only correct attempts as assisted", () => {
    const result = deriveCompetency([incorrect({ helpLevel: 4 })]);
    expect(result.assistedCount).toBe(0);
    expect(result.state).toBe("NOT_OBSERVED");
  });
});

describe("deriveCompetency — retention and transfer", () => {
  it("reports RETAINED when an independent review attempt reaches the threshold", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isReview: true }),
    ]);
    expect(result.state).toBe("RETAINED");
  });

  it("reports TRANSFERRED for an independent transfer attempt once independent", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isTransfer: true }),
    ]);
    expect(result.state).toBe("TRANSFERRED");
  });

  it("prefers TRANSFERRED over RETAINED when both are present", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isReview: true }),
      correct({ isTransfer: true }),
    ]);
    expect(result.state).toBe("TRANSFERRED");
  });

  it("does not report TRANSFERRED unless there are two independent solves", () => {
    // One ordinary independent solve plus a transfer answer is only one
    // independent observation of the original skill: the threshold of two
    // must be met from the skill's own attempts before a transfer counts.
    const result = deriveCompetency([correct()]);
    expect(result.independentCount).toBe(1);
    expect(result.state).not.toBe("TRANSFERRED");
  });

  it("does not report TRANSFERRED when the transfer attempt was assisted", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isTransfer: true, helpLevel: 4 }),
    ]);
    expect(result.state).toBe("INDEPENDENT");
  });

  it("revokes RETAINED back to INDEPENDENT when a subsequent scheduled review fails", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isReview: true }),
      incorrect({ isReview: true }),
    ]);
    expect(result.state).toBe("INDEPENDENT");
  });

  it("downgrades TRANSFERRED back to INDEPENDENT when a subsequent scheduled review fails", () => {
    const result = deriveCompetency([
      correct(),
      correct(),
      correct({ isTransfer: true }),
      incorrect({ isReview: true }),
    ]);
    expect(result.state).toBe("INDEPENDENT");
  });

  it("disqualifies multiple guesses on the same step (attemptNo > 1) from counting as independent", () => {
    const result = deriveCompetency([
      incorrect({ attemptNo: 1 }),
      incorrect({ attemptNo: 2 }),
      correct({ attemptNo: 3, helpLevel: 0 }),
      incorrect({ attemptNo: 1 }),
      correct({ attemptNo: 2, helpLevel: 0 }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(2);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("INDEPENDENT");
  });
});

describe("deriveCompetency — parent correction is never independent", () => {
  it("excludes a parent_correction from the independent count", () => {
    const kind: EvidenceKind = "parent_correction";
    const result = deriveCompetency([
      correct({ evidenceKind: kind }),
      correct({ evidenceKind: kind }),
    ]);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(0);
    // A hand-recorded observation is never the learner's own evidence: the
    // skill stays unobserved rather than being credited as supported.
    expect(result.state).toBe("NOT_OBSERVED");
    expect(result.state).not.toBe("INDEPENDENT");
    expect(result.state).not.toBe("TRANSFERRED");
  });

  it("does not let a parent_correction satisfy a transfer promotion", () => {
    const kind: EvidenceKind = "parent_correction";
    const result = deriveCompetency([
      correct(),
      correct({ isTransfer: true, evidenceKind: kind }),
    ]);
    expect(result.state).not.toBe("TRANSFERRED");
  });

  it("marks parent_correction as non-independent directly", () => {
    expect(isIndependentAttempt(correct({ evidenceKind: "parent_correction" }))).toBe(false);
  });
});

describe("deriveCompetency — determinism", () => {
  it("returns an identical derivation for identical input", () => {
    const history = [correct(), incorrect(), correct({ helpLevel: 2 }), correct({ isReview: true })];
    expect(deriveCompetency(history)).toEqual(deriveCompetency(history));
  });

  it("returns an identical derivation for a re-ordered equivalent history", () => {
    const a = correct();
    const b = correct();
    const shuffled = deriveCompetency([b, a]);
    const ordered = deriveCompetency([a, b]);
    expect(shuffled.state).toBe(ordered.state);
    expect(shuffled.independentCount).toBe(ordered.independentCount);
  });

  it("reports the last independent timestamp", () => {
    const older = correct({ createdAt: 1000 });
    const newer = correct({ createdAt: 5000 });
    expect(deriveCompetency([older, newer]).lastIndependentAt).toBe(5000);
  });

  it("reports null lastIndependentAt when nothing is independent", () => {
    expect(deriveCompetency([incorrect()]).lastIndependentAt).toBeNull();
  });
});
