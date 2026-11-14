import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMMERCIAL_SENSITIVITY_SCENARIOS,
  CONSERVATIVE_UPPER_HOUSEHOLD_TCO_INPUTS,
  DEFAULT_HOUSEHOLD_TCO_INPUTS,
  HOUSEHOLD_ANNUAL_TCO_CEILING_VND,
  UNIT_ECONOMICS_POLICY_GATES,
  computeHouseholdTco,
  evaluateCommercialScenario,
  verifyTcoAndUnitEconomics,
} from "../../src/shared/engine/tco-model";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const TCO_CLI_SCRIPT = join(REPO_ROOT, "scripts", "tco-verify.mjs");

describe("G15 Mission A Household Annual TCO model", () => {
  it("computes annual household TCO at 9,630,000 VND/yr (< 10M VND ceiling) with 0 cloud Worker cost", () => {
    const base = computeHouseholdTco();
    expect(base.inputs.macElectricityAnnualVnd).toBe(270_000);
    expect(base.inputs.localCloudWorkerOpsAnnualVnd).toBe(0);
    expect(base.inputs.periodicTeacherCrossCheckAnnualVnd).toBe(4_800_000);
    expect(base.totalAnnualHouseholdVnd).toBe(9_630_000);
    expect(base.totalAnnualHouseholdVnd).toBeLessThan(HOUSEHOLD_ANNUAL_TCO_CEILING_VND);
    expect(base.headroomVnd).toBe(370_000);
    expect(base.zeroCloudRuntimeCost).toBe(true);
    expect(base.withinBudgetCeiling).toBe(true);
    expect(base.verdict).toBe("PASS");

    const upper = computeHouseholdTco(CONSERVATIVE_UPPER_HOUSEHOLD_TCO_INPUTS);
    expect(upper.totalAnnualHouseholdVnd).toBe(9_850_000);
    expect(upper.totalAnnualHouseholdVnd).toBeLessThan(HOUSEHOLD_ANNUAL_TCO_CEILING_VND);
    expect(upper.verdict).toBe("PASS");
  });

  it("rejects household configurations that exceed 10M VND/yr or introduce non-zero cloud Worker spend", () => {
    const overBudget = computeHouseholdTco({
      ...DEFAULT_HOUSEHOLD_TCO_INPUTS,
      deviceAmortizationReserveAnnualVnd: 4_000_000,
    });
    expect(overBudget.totalAnnualHouseholdVnd).toBe(10_270_000);
    expect(overBudget.withinBudgetCeiling).toBe(false);
    expect(overBudget.verdict).toBe("REJECT");

    const nonLocalOps = computeHouseholdTco({
      ...DEFAULT_HOUSEHOLD_TCO_INPUTS,
      localCloudWorkerOpsAnnualVnd: 120_000,
    });
    expect(nonLocalOps.zeroCloudRuntimeCost).toBe(false);
    expect(nonLocalOps.verdict).toBe("REJECT");

    expect(() =>
      computeHouseholdTco({
        ...DEFAULT_HOUSEHOLD_TCO_INPUTS,
        macElectricityAnnualVnd: -1,
      }),
    ).toThrow(/non-negative finite VND amount/);
  });
});

describe("G15 Commercial Unit-Economics & Sensitivity Model (isolated financial model)", () => {
  it("marks B2B2C secondary center Base Case (3.5M VND/mo, 50 students) PASS with ~82.6% margin, 28.9x LTV/CAC, and 46 break-even centers", () => {
    const base = evaluateCommercialScenario(
      COMMERCIAL_SENSITIVITY_SCENARIOS.b2b2c_secondary_center_base,
    );
    expect(base.isolationStatus).toBe("isolated-financial-model-not-active-runtime");
    expect(base.learnersPerUnit).toBe(50);
    expect(base.monthlyRevenueVnd).toBe(3_500_000);
    expect(base.revenuePerLearnerMonthlyVnd).toBe(70_000);
    expect(base.monthlyVariableCostVnd).toBe(610_000);
    expect(base.monthlyContributionVnd).toBe(2_890_000);
    expect(base.contributionMargin).toBeGreaterThanOrEqual(
      UNIT_ECONOMICS_POLICY_GATES.minimumContributionMargin,
    );
    expect(base.contributionMarginPct).toBeCloseTo(82.57, 2);
    expect(base.ltvToCac).toBe(28.9);
    expect(base.ltvToCac).toBeGreaterThan(UNIT_ECONOMICS_POLICY_GATES.minimumLtvToCacExclusive);
    expect(base.breakEvenUnits).toBe(46);
    expect(base.verdict).toBe("PASS");
    expect(base.rejectionReasons).toEqual([]);
  });

  it("marks B2C Bear Case (149,000 VND/mo, LTV/CAC 1.75x) REJECT", () => {
    const bear = evaluateCommercialScenario(COMMERCIAL_SENSITIVITY_SCENARIOS.b2c_consumer_bear);
    expect(bear.monthlyRevenueVnd).toBe(149_000);
    expect(bear.ltvToCac).toBe(1.75);
    expect(bear.passesLtvToCacGate).toBe(false);
    expect(bear.verdict).toBe("REJECT");
    expect(bear.rejectionReasons.some((r) => r.includes("LTV/CAC"))).toBe(true);
  });

  it("marks Unbounded-Chat Anti-Pattern (18.3% margin, 0.95x LTV/CAC) REJECT on both policy gates", () => {
    const antiPattern = evaluateCommercialScenario(
      COMMERCIAL_SENSITIVITY_SCENARIOS.unbounded_chat_antipattern,
    );
    expect(antiPattern.contributionMarginPct).toBe(18.3);
    expect(antiPattern.ltvToCac).toBe(0.95);
    expect(antiPattern.passesMarginGate).toBe(false);
    expect(antiPattern.passesLtvToCacGate).toBe(false);
    expect(antiPattern.verdict).toBe("REJECT");
    expect(antiPattern.rejectionReasons).toHaveLength(2);
  });

  it("validates scenario input boundaries and verifies aggregate Gate G15 report", () => {
    expect(() =>
      evaluateCommercialScenario({
        ...COMMERCIAL_SENSITIVITY_SCENARIOS.b2b2c_secondary_center_base,
        monthlyChurnRate: 0,
      }),
    ).toThrow(/monthlyChurnRate/);

    expect(() =>
      evaluateCommercialScenario({
        ...COMMERCIAL_SENSITIVITY_SCENARIOS.b2b2c_secondary_center_base,
        cacVnd: 0,
      }),
    ).toThrow(/cacVnd must be > 0/);

    const fullReport = verifyTcoAndUnitEconomics();
    expect(fullReport.ok).toBe(true);
    expect(fullReport.invariants).toEqual({
      householdAnnualBelow10MVnd: true,
      householdUpperBoundBelow10MVnd: true,
      zeroCloudWorkerCostInMissionA: true,
      baseB2b2cMarkedPass: true,
      bearB2cMarkedReject: true,
      unboundedChatMarkedReject: true,
    });
  });
});

describe("G15 tco:verify CLI — fail-closed args & JSON output", () => {
  it("exits 0 with valid JSON summary and exits 1 on unknown flags", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "tai-tco-cli-"));
    try {
      const outPath = join(tmpDir, "tco-summary.json");
      const stdout = execFileSync(process.execPath, [TCO_CLI_SCRIPT, "--output", outPath], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      const parsed = JSON.parse(stdout) as { ok: boolean; gate: string; command: string };
      expect(parsed.ok).toBe(true);
      expect(parsed.gate).toBe("G15");
      expect(parsed.command).toBe("tco:verify");
      expect(JSON.parse(readFileSync(outPath, "utf8")).ok).toBe(true);

      let badExit = 0;
      try {
        execFileSync(process.execPath, [TCO_CLI_SCRIPT, "--invalid-flag"], {
          cwd: REPO_ROOT,
          stdio: "pipe",
        });
      } catch (error) {
        badExit = (error as { status?: number }).status ?? 1;
      }
      expect(badExit).toBe(1);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
