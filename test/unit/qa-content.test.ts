import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LESSONS } from "../../src/shared/content/index";
import type { LessonDefinition } from "../../src/shared/content/types";
import type { ExerciseSpec } from "../../src/shared/schemas/exercise";
import {
  MATH_ERROR_RATE_CEILING,
  QA_ASSERTION_RULES,
  evaluateRationalArithmetic,
  inferExpectedPromptRational,
  makeRational,
  parseChoiceQuantity,
  rationalsEqual,
  runContentQaGate,
  runQaMutationSelfTest,
} from "../../src/shared/content/qa-gate";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const QA_CLI_SCRIPT = join(REPO_ROOT, "scripts", "qa-content.mjs");

describe("G13 Offline Content QA Gate — shipped 50-lesson corpus", () => {
  it("verifies all 50 shipped lessons (257 steps) with 0 math, leakage, rights, or safety findings", () => {
    const report = runContentQaGate(LESSONS);
    expect(report.ok).toBe(true);
    expect(report.lessonsChecked).toBe(50);
    expect(report.stepsChecked).toBe(257);
    expect(report.mathErrorsCount).toBe(0);
    expect(report.mathErrorRate).toBe(0);
    expect(report.mathErrorRate).toBeLessThan(MATH_ERROR_RATE_CEILING);
    expect(report.answerLeakCount).toBe(0);
    expect(report.promptInjectionCount).toBe(0);
    expect(report.gamificationViolationCount).toBe(0);
    expect(report.rightsViolationCount).toBe(0);
    expect(report.pedagogyViolationCount).toBe(0);
    expect(report.findings).toEqual([]);
    expect(QA_ASSERTION_RULES).toHaveLength(6);
  });
});

describe("G13 Rational & Math AST equivalence engine", () => {
  it("normalizes fractions, decimals (comma & dot), percentages, space-grouped integers, and arithmetic to exact rationals", () => {
    const oneHalfA = parseChoiceQuantity("1/2");
    const oneHalfB = parseChoiceQuantity("2/4");
    const oneHalfC = parseChoiceQuantity("0,5");
    const oneHalfD = parseChoiceQuantity("0.5");
    const oneHalfE = parseChoiceQuantity("50%");

    expect(oneHalfA.kind).toBe("quantity");
    expect(oneHalfB.kind).toBe("quantity");
    expect(oneHalfC.kind).toBe("quantity");
    expect(oneHalfD.kind).toBe("quantity");
    expect(oneHalfE.kind).toBe("quantity");

    if (
      oneHalfA.kind === "quantity" &&
      oneHalfB.kind === "quantity" &&
      oneHalfC.kind === "quantity" &&
      oneHalfD.kind === "quantity" &&
      oneHalfE.kind === "quantity"
    ) {
      expect(rationalsEqual(oneHalfA.value.rational, oneHalfB.value.rational)).toBe(true);
      expect(rationalsEqual(oneHalfA.value.rational, oneHalfC.value.rational)).toBe(true);
      expect(rationalsEqual(oneHalfA.value.rational, oneHalfD.value.rational)).toBe(true);
      expect(rationalsEqual(oneHalfA.value.rational, oneHalfE.value.rational)).toBe(true);
      expect(oneHalfB.value.canonical).toBe("1/2");
    }

    const vnd = parseChoiceQuantity("240 000 đồng");
    expect(vnd).toEqual({
      kind: "quantity",
      value: {
        rational: makeRational(240000n, 1n),
        unit: "đồng",
        canonical: "240000",
      },
    });

    const expr = evaluateRationalArithmetic("2,5 + 1,25 × 2");
    expect(expr).toEqual({ kind: "ok", value: makeRational(5n, 1n) });

    expect(inferExpectedPromptRational("Kết quả của 5,6 − 2,35 là bao nhiêu?")).toEqual(
      makeRational(13n, 4n),
    );
    expect(inferExpectedPromptRational("10% của 200 là bao nhiêu?")).toEqual(
      makeRational(20n, 1n),
    );
  });

  it("flags zero denominators in both fractions and division expressions", () => {
    expect(parseChoiceQuantity("5/0")).toEqual({ kind: "zero_denominator", token: "5/0" });
    expect(evaluateRationalArithmetic("20 : 0")).toEqual({
      kind: "zero_denominator",
      token: "20 : 0",
    });
  });

  it("distinguishes incompatible physical units (40 m vs 40 m²) while catching matching units (3/10 hộp bánh vs 0,3 hộp bánh)", () => {
    const baseMath = LESSONS.find((l) => l.id === "math-area-measurement")!;
    const step2 = baseMath.steps[1]!;

    // 40 m vs 40 m² have distinct units ("m" vs "m²") and should not collide
    const distinctUnitsDraft: LessonDefinition = {
      ...baseMath,
      id: "draft-distinct-units",
      steps: [
        baseMath.steps[0]!,
        {
          ...step2,
          content: {
            ...(step2.content as Extract<ExerciseSpec, { type: "multiple_choice" }>),
            choices: [
              { id: "a", label_vi: "40 m", correct: false },
              { id: "b", label_vi: "26 m²", correct: false },
              { id: "c", label_vi: "40 m²", correct: true },
              { id: "d", label_vi: "3 m²", correct: false },
            ],
          },
        },
        ...baseMath.steps.slice(2),
      ],
    };
    expect(runContentQaGate([distinctUnitsDraft]).ok).toBe(true);

    // 0,3 hộp bánh === 3/10 hộp bánh with same unit -> must be rejected
    const baseline4 = LESSONS.find((l) => l.id === "math-baseline-grade4")!;
    const step5 = baseline4.steps[4]!;
    const collidingUnitDraft: LessonDefinition = {
      ...baseline4,
      id: "draft-colliding-unit",
      steps: [
        ...baseline4.steps.slice(0, 4),
        {
          ...step5,
          content: {
            ...(step5.content as Extract<ExerciseSpec, { type: "multiple_choice" }>),
            choices: [
              { id: "a", label_vi: "3/10 hộp bánh", correct: true },
              { id: "b", label_vi: "0,3 hộp bánh", correct: false },
              { id: "c", label_vi: "3/7 hộp bánh", correct: false },
              { id: "d", label_vi: "10/3 hộp bánh", correct: false },
            ],
          },
        },
      ],
    };
    const collidingReport = runContentQaGate([collidingUnitDraft]);
    expect(collidingReport.ok).toBe(false);
    expect(collidingReport.findings.some((f) => f.ruleId === "math-equivalence")).toBe(true);
  });

  it("catches unreduced fraction_visual answers when simplest form is requested and bar-ratio mismatches", () => {
    const fracLesson = LESSONS.find((l) => l.id === "math-fractions-equivalent")!;
    const visualStep = fracLesson.steps[1]!;

    const unreducedDraft: LessonDefinition = {
      ...fracLesson,
      id: "draft-unreduced-visual",
      steps: [
        fracLesson.steps[0]!,
        {
          ...visualStep,
          content: {
            ...(visualStep.content as Extract<ExerciseSpec, { type: "fraction_visual" }>),
            correctNumerator: 2,
            correctDenominator: 4,
          },
          answerKey: JSON.stringify({ correctNumerator: 2, correctDenominator: 4 }),
        },
        ...fracLesson.steps.slice(2),
      ],
    };
    const unreducedReport = runContentQaGate([unreducedDraft]);
    expect(unreducedReport.ok).toBe(false);
    expect(unreducedReport.findings[0]?.message).toContain("simplest form");

    const mismatchedBarDraft: LessonDefinition = {
      ...fracLesson,
      id: "draft-wrong-bar",
      steps: [
        fracLesson.steps[0]!,
        {
          ...visualStep,
          content: {
            ...(visualStep.content as Extract<ExerciseSpec, { type: "fraction_visual" }>),
            allowedDenominators: [2, 3, 4],
            correctNumerator: 1,
            correctDenominator: 3,
          },
          answerKey: JSON.stringify({ correctNumerator: 1, correctDenominator: 3 }),
        },
        ...fracLesson.steps.slice(2),
      ],
    };
    const barReport = runContentQaGate([mismatchedBarDraft]);
    expect(barReport.ok).toBe(false);
    expect(barReport.findings[0]?.message).toContain("does not equal keyed");
  });
});

describe("G13 Built-in mutation self-test & CLI / Promptfoo / SymPy verification", () => {
  it("catches 100% of built-in synthetic mutations (>= 6 mutations)", () => {
    const selfTest = runQaMutationSelfTest();
    expect(selfTest.ok).toBe(true);
    expect(selfTest.totalMutations).toBeGreaterThanOrEqual(6);
    expect(selfTest.caughtMutations).toBe(selfTest.totalMutations);
    for (const item of selfTest.cases) {
      expect(item.caught, item.mutationId).toBe(true);
      expect(item.matchedExpectedRule, item.mutationId).toBe(true);
    }
  });

  it("verifies promptfooconfig.yaml offline enforcement and both SymPy fallback and subprocess paths", async () => {
    // Dynamic import of .mjs CLI helpers
    const cliMod = (await import("../../scripts/qa-content.mjs")) as {
      TS_FALLBACK_SYMPY_BACKEND: string;
      verifyPromptfooOfflineConfig: (p?: string) => {
        ok: boolean;
        zeroNetworkProviders: boolean;
      };
      runOptionalSympyCrossCheck: (
        items: readonly unknown[],
        runner?: (cmd: string, args: string[]) => { status: number; stdout: string; stderr: string },
      ) => { ok: boolean; sympyAvailable: boolean; sympyBackend: string; checkedPairs: number };
      parseQaContentCliArgs: (argv: string[]) => { outputPath: string | null; draftsPath: string | null };
    };

    const shippedCfg = cliMod.verifyPromptfooOfflineConfig();
    expect(shippedCfg.ok).toBe(true);
    expect(shippedCfg.zeroNetworkProviders).toBe(true);

    // Reject a config that introduces a network LLM provider
    const tmpDir = mkdtempSync(join(tmpdir(), "tai-qa-cfg-"));
    try {
      const badCfgPath = join(tmpDir, "bad-promptfoo.yaml");
      writeFileSync(
        badCfgPath,
        "sharing: false\nproviders:\n  - openai:gpt-4o\n",
        "utf8",
      );
      const badResult = cliMod.verifyPromptfooOfflineConfig(badCfgPath);
      expect(badResult.ok).toBe(false);
      expect(badResult.zeroNetworkProviders).toBe(false);

      // SymPy absent fallback path
      const fallback = cliMod.runOptionalSympyCrossCheck([{ leftExpr: "Rational(1, 2)", rightExpr: "Rational(2, 4)", expectEqual: true }], () => ({
        status: 1,
        stdout: "",
        stderr: "No module named sympy",
      }));
      expect(fallback.ok).toBe(true);
      expect(fallback.sympyAvailable).toBe(false);
      expect(fallback.sympyBackend).toBe(cliMod.TS_FALLBACK_SYMPY_BACKEND);

      // SymPy present mock path (0 mismatches -> ok: true; 1 mismatch -> ok: false)
      let callNo = 0;
      const sympyGreen = cliMod.runOptionalSympyCrossCheck(
        [{ leftExpr: "Rational(1, 2)", rightExpr: "Rational(2, 4)", expectEqual: true }],
        () => {
          callNo += 1;
          if (callNo === 1) return { status: 0, stdout: "1.13.3\n", stderr: "" };
          return {
            status: 0,
            stdout: JSON.stringify({ sympyVersion: "1.13.3", checked: 1, mismatches: [] }),
            stderr: "",
          };
        },
      );
      expect(sympyGreen.ok).toBe(true);
      expect(sympyGreen.sympyBackend).toBe("python-sympy-1.13.3");

      // CLI exits 1 when handed a defective --drafts JSON file or an unknown flag
      const badDraftsPath = join(tmpDir, "bad-drafts.json");
      const badDraft: LessonDefinition = {
        ...LESSONS[0]!,
        id: "cli-bad-draft",
        sourceRef: "",
      };
      writeFileSync(badDraftsPath, JSON.stringify([badDraft]), "utf8");

      let badDraftExit = 0;
      try {
        execFileSync(process.execPath, [QA_CLI_SCRIPT, "--drafts", badDraftsPath], {
          cwd: REPO_ROOT,
          stdio: "pipe",
        });
      } catch (error) {
        badDraftExit = (error as { status?: number }).status ?? 1;
      }
      expect(badDraftExit).toBe(1);

      expect(() => cliMod.parseQaContentCliArgs(["--unknown"])).toThrow(/Unknown flag/);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
