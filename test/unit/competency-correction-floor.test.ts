import { describe, expect, it } from "vitest";
import {
  deriveCompetency,
  isIndependentAttempt,
  type AttemptEvidence,
} from "../../src/shared/engine/competency";
import type { CompetencyState } from "../../src/shared/schemas/attempt";

const SKILL = "math-frac-equiv";

let sequence = 0;

function attempt(overrides: Partial<AttemptEvidence> = {}): AttemptEvidence {
  sequence += 1;
  return {
    attemptId: `att-floor-${sequence}`,
    skillId: SKILL,
    outcome: "correct",
    helpLevel: 0,
    evidenceKind: "observed",
    attemptNo: 1,
    isTransfer: false,
    isReview: false,
    createdAt: 1_700_000_000_000 + sequence * 1000,
    ...overrides,
  };
}

function correction(
  correctedState: CompetencyState,
  overrides: Partial<AttemptEvidence> = {},
): AttemptEvidence {
  return attempt({
    evidenceKind: "parent_correction",
    outcome: "correct",
    helpLevel: 0,
    correctedState,
    ...overrides,
  });
}

describe("deriveCompetency — parent correction floor", () => {
  it("establishes a floor state without inflating correct, independent, or assisted counts", () => {
    const result = deriveCompetency([correction("SUPPORTED")]);

    expect(result.state).toBe("SUPPORTED");
    expect(result.correctCount).toBe(0);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(0);
    expect(result.lastIndependentAt).toBeNull();
  });

  it("prevents subsequent incorrect or assisted learner attempts from dropping state below the correction floor", () => {
    const result = deriveCompetency([
      correction("INDEPENDENT", { createdAt: 1000 }),
      attempt({ outcome: "incorrect", createdAt: 2000 }),
      attempt({ outcome: "correct", helpLevel: 2, evidenceKind: "assisted", createdAt: 3000 }),
      attempt({ outcome: "incorrect", createdAt: 4000 }),
    ]);

    expect(result.state).toBe("INDEPENDENT");
    expect(result.correctCount).toBe(1);
    expect(result.independentCount).toBe(0);
    expect(result.assistedCount).toBe(1);
  });

  it("allows subsequent learner evidence to raise state above a correction floor", () => {
    // Parent sets floor at SUPPORTED; learner then solves two steps independently
    const toIndependent = deriveCompetency([
      correction("SUPPORTED", { createdAt: 1000 }),
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", createdAt: 2000 }),
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", createdAt: 3000 }),
    ]);

    expect(toIndependent.state).toBe("INDEPENDENT");
    expect(toIndependent.independentCount).toBe(2);
    expect(toIndependent.correctCount).toBe(2);

    // Learner then solves a transfer step independently -> rises to TRANSFERRED
    const toTransferred = deriveCompetency([
      correction("SUPPORTED", { createdAt: 1000 }),
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", createdAt: 2000 }),
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", createdAt: 3000 }),
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", isTransfer: true, createdAt: 4000 }),
    ]);

    expect(toTransferred.state).toBe("TRANSFERRED");
    expect(toTransferred.independentCount).toBe(3);
  });

  it("never lets a parent correction satisfy transfer or review promotion", () => {
    const result = deriveCompetency([
      attempt({ outcome: "correct", helpLevel: 0, evidenceKind: "observed", createdAt: 1000 }),
      correction("SUPPORTED", { isTransfer: true, isReview: true, createdAt: 2000 }),
    ]);

    expect(isIndependentAttempt(correction("INDEPENDENT"))).toBe(false);
    expect(result.independentCount).toBe(1);
    expect(result.state).toBe("SUPPORTED");
    expect(result.state).not.toBe("RETAINED");
    expect(result.state).not.toBe("TRANSFERRED");
  });

  it("uses the latest parent correction when multiple corrections exist", () => {
    const result = deriveCompetency([
      correction("INDEPENDENT", { createdAt: 1000 }),
      correction("SUPPORTED", { createdAt: 2000 }),
    ]);

    expect(result.state).toBe("SUPPORTED");
  });

  it("remains deterministic and total across repeated calls", () => {
    const history: AttemptEvidence[] = [
      correction("SUPPORTED", { createdAt: 1000 }),
      attempt({ outcome: "incorrect", createdAt: 2000 }),
      attempt({ outcome: "correct", helpLevel: 1, evidenceKind: "assisted", createdAt: 3000 }),
    ];

    expect(deriveCompetency(history)).toEqual(deriveCompetency(history));
  });
});
