/**
 * Household Annual TCO & Commercial Unit-Economics Sensitivity Model (Gate G15).
 *
 * Models both sides required by Masterplan §20.3 and §23 Gate G15 as pure,
 * deterministic, auditable functions with zero runtime cloud dependencies:
 *
 *   1. Mission A Household Annual TCO (VND/year):
 *      - Local Mac M1 Max incremental electricity (~270,000 VND/yr),
 *      - Encrypted 3-2-1 backup storage & rotation media,
 *      - Local operations (0 VND cloud Worker / runtime LLM cost),
 *      - Periodic human teacher independent cross-check (4,800,000 VND/yr),
 *      - Device amortization & hardware maintenance reserve,
 *      verifying `totalAnnualHouseholdVnd < 10_000_000`.
 *
 *   2. Mission B Unit-Economics & Sensitivity Model (isolated financial model,
 *      NOT an active runtime):
 *      - Base case (`3,500,000 VND/mo` per 50-student secondary center pack) -> `PASS`,
 *      - Bear case (`149,000 VND/mo` B2C consumer subscription) -> `REJECT`,
 *      - Unbounded-Chat anti-pattern (live LLM chat variable token drain) -> `REJECT`.
 */

export const HOUSEHOLD_ANNUAL_TCO_CEILING_VND = 10_000_000;

export const UNIT_ECONOMICS_POLICY_GATES = {
  minimumContributionMargin: 0.7,
  minimumLtvToCacExclusive: 3.0,
} as const;

export interface HouseholdTcoInputs {
  readonly macElectricityAnnualVnd: number;
  readonly encryptedBackup321AnnualVnd: number;
  readonly localCloudWorkerOpsAnnualVnd: number;
  readonly periodicTeacherCrossCheckAnnualVnd: number;
  readonly deviceAmortizationReserveAnnualVnd: number;
}

export const DEFAULT_HOUSEHOLD_TCO_INPUTS: HouseholdTcoInputs = {
  // ~90 kWh/year incremental draw on Mac M1 Max @ 3,000 VND/kWh
  macElectricityAnnualVnd: 270_000,
  // Encrypted 3-2-1 external USB/SSD rotation + offsite cold archive allocation
  encryptedBackup321AnnualVnd: 1_200_000,
  // Strictly local-first runtime: 0 cloud Worker bill, 0 live LLM API calls
  localCloudWorkerOpsAnnualVnd: 0,
  // Periodic human teacher portfolio & independent mastery calibration check
  periodicTeacherCrossCheckAnnualVnd: 4_800_000,
  // Household Mac + learner peripheral amortization/maintenance reserve
  deviceAmortizationReserveAnnualVnd: 3_360_000,
} as const;

export const CONSERVATIVE_UPPER_HOUSEHOLD_TCO_INPUTS: HouseholdTcoInputs = {
  ...DEFAULT_HOUSEHOLD_TCO_INPUTS,
  // Peak electricity tariff + extra replacement backup media buffer (+220,000 VND/yr)
  macElectricityAnnualVnd: 330_000,
  encryptedBackup321AnnualVnd: 1_360_000,
} as const;

export interface HouseholdTcoBreakdown {
  readonly inputs: HouseholdTcoInputs;
  readonly totalAnnualHouseholdVnd: number;
  readonly monthlyEquivalentVnd: number;
  readonly ceilingVnd: number;
  readonly headroomVnd: number;
  readonly zeroCloudRuntimeCost: boolean;
  readonly withinBudgetCeiling: boolean;
  readonly verdict: "PASS" | "REJECT";
}

export type CommercialScenarioId =
  | "b2b2c_secondary_center_base"
  | "b2c_consumer_bear"
  | "unbounded_chat_antipattern";

export interface VariableCostBreakdownVnd {
  readonly edgeInfraAndStorageVnd: number;
  readonly offlineAiAuthoringQaAmortizedVnd: number;
  readonly liveUnboundedChatTokensVnd: number;
  readonly billingAndCenterSupportVnd: number;
}

export interface CommercialScenarioInputs {
  readonly id: CommercialScenarioId;
  readonly title: string;
  readonly unitLabel: string;
  readonly learnersPerUnit: number;
  readonly monthlyRevenueVnd: number;
  readonly variableCostsVnd: VariableCostBreakdownVnd;
  readonly monthlyChurnRate: number;
  readonly cacVnd: number;
  readonly monthlyFixedCostVnd: number;
}

export const COMMERCIAL_SENSITIVITY_SCENARIOS: Readonly<
  Record<CommercialScenarioId, CommercialScenarioInputs>
> = {
  b2b2c_secondary_center_base: {
    id: "b2b2c_secondary_center_base",
    title: "Base Case — B2B2C Secondary Center Pack (50 learners/center)",
    unitLabel: "50-student secondary center pack",
    learnersPerUnit: 50,
    monthlyRevenueVnd: 3_500_000,
    variableCostsVnd: {
      edgeInfraAndStorageVnd: 160_000,
      offlineAiAuthoringQaAmortizedVnd: 150_000,
      liveUnboundedChatTokensVnd: 0,
      billingAndCenterSupportVnd: 300_000,
    },
    monthlyChurnRate: 0.04,
    cacVnd: 2_500_000,
    monthlyFixedCostVnd: 132_000_000,
  },
  b2c_consumer_bear: {
    id: "b2c_consumer_bear",
    title: "Bear Case — Direct B2C Consumer Household Subscription",
    unitLabel: "single-learner B2C subscription",
    learnersPerUnit: 1,
    monthlyRevenueVnd: 149_000,
    variableCostsVnd: {
      edgeInfraAndStorageVnd: 4_500,
      offlineAiAuthoringQaAmortizedVnd: 4_000,
      liveUnboundedChatTokensVnd: 0,
      billingAndCenterSupportVnd: 18_000,
    },
    monthlyChurnRate: 0.2,
    cacVnd: 350_000,
    monthlyFixedCostVnd: 132_000_000,
  },
  unbounded_chat_antipattern: {
    id: "unbounded_chat_antipattern",
    title: "Anti-Pattern — Unbounded Live LLM Chat Tutor (50 learners)",
    unitLabel: "50-student pack with unbounded live chat",
    learnersPerUnit: 50,
    monthlyRevenueVnd: 3_500_000,
    variableCostsVnd: {
      edgeInfraAndStorageVnd: 160_000,
      offlineAiAuthoringQaAmortizedVnd: 0,
      liveUnboundedChatTokensVnd: 2_399_500,
      billingAndCenterSupportVnd: 300_000,
    },
    monthlyChurnRate: 0.25,
    cacVnd: 2_700_000,
    monthlyFixedCostVnd: 132_000_000,
  },
} as const;

export interface CommercialScenarioEvaluation {
  readonly id: CommercialScenarioId;
  readonly title: string;
  readonly isolationStatus: "isolated-financial-model-not-active-runtime";
  readonly learnersPerUnit: number;
  readonly monthlyRevenueVnd: number;
  readonly revenuePerLearnerMonthlyVnd: number;
  readonly monthlyVariableCostVnd: number;
  readonly monthlyContributionVnd: number;
  readonly contributionMargin: number;
  readonly contributionMarginPct: number;
  readonly expectedLifetimeMonths: number;
  readonly ltvVnd: number;
  readonly cacVnd: number;
  readonly ltvToCac: number;
  readonly monthlyFixedCostVnd: number;
  readonly breakEvenUnits: number | null;
  readonly passesMarginGate: boolean;
  readonly passesLtvToCacGate: boolean;
  readonly verdict: "PASS" | "REJECT";
  readonly rejectionReasons: readonly string[];
}

export interface GateG15VerificationReport {
  readonly ok: boolean;
  readonly gate: "G15";
  readonly runtimeStatus: "mission-a-local-only-commercial-inactive";
  readonly householdBase: HouseholdTcoBreakdown;
  readonly householdConservativeUpper: HouseholdTcoBreakdown;
  readonly commercialScenarios: Readonly<Record<CommercialScenarioId, CommercialScenarioEvaluation>>;
  readonly invariants: {
    readonly householdAnnualBelow10MVnd: boolean;
    readonly householdUpperBoundBelow10MVnd: boolean;
    readonly zeroCloudWorkerCostInMissionA: boolean;
    readonly baseB2b2cMarkedPass: boolean;
    readonly bearB2cMarkedReject: boolean;
    readonly unboundedChatMarkedReject: boolean;
  };
}

function assertNonNegativeFiniteVnd(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite VND amount, got ${String(value)}`);
  }
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Evaluate Mission A's annual household TCO against the 10,000,000 VND/year
 * Masterplan budget ceiling and local-first zero-cloud-ops invariant.
 */
export function computeHouseholdTco(
  inputs: HouseholdTcoInputs = DEFAULT_HOUSEHOLD_TCO_INPUTS,
  ceilingVnd: number = HOUSEHOLD_ANNUAL_TCO_CEILING_VND,
): HouseholdTcoBreakdown {
  assertNonNegativeFiniteVnd("macElectricityAnnualVnd", inputs.macElectricityAnnualVnd);
  assertNonNegativeFiniteVnd("encryptedBackup321AnnualVnd", inputs.encryptedBackup321AnnualVnd);
  assertNonNegativeFiniteVnd(
    "localCloudWorkerOpsAnnualVnd",
    inputs.localCloudWorkerOpsAnnualVnd,
  );
  assertNonNegativeFiniteVnd(
    "periodicTeacherCrossCheckAnnualVnd",
    inputs.periodicTeacherCrossCheckAnnualVnd,
  );
  assertNonNegativeFiniteVnd(
    "deviceAmortizationReserveAnnualVnd",
    inputs.deviceAmortizationReserveAnnualVnd,
  );
  assertNonNegativeFiniteVnd("ceilingVnd", ceilingVnd);

  const totalAnnualHouseholdVnd =
    inputs.macElectricityAnnualVnd +
    inputs.encryptedBackup321AnnualVnd +
    inputs.localCloudWorkerOpsAnnualVnd +
    inputs.periodicTeacherCrossCheckAnnualVnd +
    inputs.deviceAmortizationReserveAnnualVnd;

  const zeroCloudRuntimeCost = inputs.localCloudWorkerOpsAnnualVnd === 0;
  const withinBudgetCeiling = totalAnnualHouseholdVnd < ceilingVnd;

  return {
    inputs,
    totalAnnualHouseholdVnd,
    monthlyEquivalentVnd: round2(totalAnnualHouseholdVnd / 12),
    ceilingVnd,
    headroomVnd: ceilingVnd - totalAnnualHouseholdVnd,
    zeroCloudRuntimeCost,
    withinBudgetCeiling,
    verdict: withinBudgetCeiling && zeroCloudRuntimeCost ? "PASS" : "REJECT",
  };
}

/**
 * Evaluate one commercial unit-economics scenario against Masterplan §20.3
 * policy gates (`contributionMargin >= 70%`, `LTV/CAC > 3.0x`).
 */
export function evaluateCommercialScenario(
  scenario: CommercialScenarioInputs,
): CommercialScenarioEvaluation {
  if (!Number.isInteger(scenario.learnersPerUnit) || scenario.learnersPerUnit <= 0) {
    throw new Error(`learnersPerUnit must be a positive integer, got ${String(scenario.learnersPerUnit)}`);
  }
  assertNonNegativeFiniteVnd("monthlyRevenueVnd", scenario.monthlyRevenueVnd);
  if (scenario.monthlyRevenueVnd === 0) {
    throw new Error("monthlyRevenueVnd must be > 0");
  }
  assertNonNegativeFiniteVnd(
    "edgeInfraAndStorageVnd",
    scenario.variableCostsVnd.edgeInfraAndStorageVnd,
  );
  assertNonNegativeFiniteVnd(
    "offlineAiAuthoringQaAmortizedVnd",
    scenario.variableCostsVnd.offlineAiAuthoringQaAmortizedVnd,
  );
  assertNonNegativeFiniteVnd(
    "liveUnboundedChatTokensVnd",
    scenario.variableCostsVnd.liveUnboundedChatTokensVnd,
  );
  assertNonNegativeFiniteVnd(
    "billingAndCenterSupportVnd",
    scenario.variableCostsVnd.billingAndCenterSupportVnd,
  );
  assertNonNegativeFiniteVnd("cacVnd", scenario.cacVnd);
  if (scenario.cacVnd === 0) {
    throw new Error("cacVnd must be > 0");
  }
  assertNonNegativeFiniteVnd("monthlyFixedCostVnd", scenario.monthlyFixedCostVnd);
  if (
    typeof scenario.monthlyChurnRate !== "number" ||
    !Number.isFinite(scenario.monthlyChurnRate) ||
    scenario.monthlyChurnRate <= 0 ||
    scenario.monthlyChurnRate > 1
  ) {
    throw new Error(`monthlyChurnRate must be in (0, 1], got ${String(scenario.monthlyChurnRate)}`);
  }

  const monthlyVariableCostVnd =
    scenario.variableCostsVnd.edgeInfraAndStorageVnd +
    scenario.variableCostsVnd.offlineAiAuthoringQaAmortizedVnd +
    scenario.variableCostsVnd.liveUnboundedChatTokensVnd +
    scenario.variableCostsVnd.billingAndCenterSupportVnd;

  const monthlyContributionVnd = scenario.monthlyRevenueVnd - monthlyVariableCostVnd;
  const contributionMargin = round4(monthlyContributionVnd / scenario.monthlyRevenueVnd);
  const contributionMarginPct = round2(contributionMargin * 100);
  const expectedLifetimeMonths = round2(1 / scenario.monthlyChurnRate);
  const rawLtvVnd =
    monthlyContributionVnd > 0 ? monthlyContributionVnd / scenario.monthlyChurnRate : 0;
  const ltvVnd = Math.round(rawLtvVnd);
  const ltvToCac = round2(rawLtvVnd / scenario.cacVnd);
  const breakEvenUnits =
    monthlyContributionVnd > 0
      ? Math.ceil(scenario.monthlyFixedCostVnd / monthlyContributionVnd)
      : null;

  const passesMarginGate =
    contributionMargin >= UNIT_ECONOMICS_POLICY_GATES.minimumContributionMargin;
  const passesLtvToCacGate =
    ltvToCac > UNIT_ECONOMICS_POLICY_GATES.minimumLtvToCacExclusive;

  const rejectionReasons: string[] = [];
  if (!passesMarginGate) {
    rejectionReasons.push(
      `Contribution margin ${contributionMarginPct}% is below the ${UNIT_ECONOMICS_POLICY_GATES.minimumContributionMargin * 100}% floor`,
    );
  }
  if (!passesLtvToCacGate) {
    rejectionReasons.push(
      `LTV/CAC ${ltvToCac}x does not exceed the ${UNIT_ECONOMICS_POLICY_GATES.minimumLtvToCacExclusive}x minimum gate`,
    );
  }

  return {
    id: scenario.id,
    title: scenario.title,
    isolationStatus: "isolated-financial-model-not-active-runtime",
    learnersPerUnit: scenario.learnersPerUnit,
    monthlyRevenueVnd: scenario.monthlyRevenueVnd,
    revenuePerLearnerMonthlyVnd: round2(scenario.monthlyRevenueVnd / scenario.learnersPerUnit),
    monthlyVariableCostVnd,
    monthlyContributionVnd,
    contributionMargin,
    contributionMarginPct,
    expectedLifetimeMonths,
    ltvVnd,
    cacVnd: scenario.cacVnd,
    ltvToCac,
    monthlyFixedCostVnd: scenario.monthlyFixedCostVnd,
    breakEvenUnits,
    passesMarginGate,
    passesLtvToCacGate,
    verdict: rejectionReasons.length === 0 ? "PASS" : "REJECT",
    rejectionReasons,
  };
}

/**
 * Run the complete Gate G15 household TCO + commercial sensitivity verification.
 */
export function verifyTcoAndUnitEconomics(): GateG15VerificationReport {
  const householdBase = computeHouseholdTco(DEFAULT_HOUSEHOLD_TCO_INPUTS);
  const householdConservativeUpper = computeHouseholdTco(CONSERVATIVE_UPPER_HOUSEHOLD_TCO_INPUTS);

  const baseEval = evaluateCommercialScenario(
    COMMERCIAL_SENSITIVITY_SCENARIOS.b2b2c_secondary_center_base,
  );
  const bearEval = evaluateCommercialScenario(
    COMMERCIAL_SENSITIVITY_SCENARIOS.b2c_consumer_bear,
  );
  const unboundedChatEval = evaluateCommercialScenario(
    COMMERCIAL_SENSITIVITY_SCENARIOS.unbounded_chat_antipattern,
  );

  const invariants = {
    householdAnnualBelow10MVnd: householdBase.verdict === "PASS",
    householdUpperBoundBelow10MVnd: householdConservativeUpper.verdict === "PASS",
    zeroCloudWorkerCostInMissionA: householdBase.zeroCloudRuntimeCost,
    baseB2b2cMarkedPass: baseEval.verdict === "PASS",
    bearB2cMarkedReject: bearEval.verdict === "REJECT",
    unboundedChatMarkedReject: unboundedChatEval.verdict === "REJECT",
  };

  const ok = Object.values(invariants).every(Boolean);

  return {
    ok,
    gate: "G15",
    runtimeStatus: "mission-a-local-only-commercial-inactive",
    householdBase,
    householdConservativeUpper,
    commercialScenarios: {
      b2b2c_secondary_center_base: baseEval,
      b2c_consumer_bear: bearEval,
      unbounded_chat_antipattern: unboundedChatEval,
    },
    invariants,
  };
}
