/**
 * CLI Offline Content QA Gate (`npm run qa:content` / Gate G13).
 *
 * Performs deterministic offline verification across all 50 shipped lessons (or
 * an optional `--drafts <json-file>` candidate Level-1 AI lesson array), verifies
 * `promptfooconfig.yaml` stays 100% offline with zero network providers, runs an
 * optional `python3 -I` SymPy algebraic cross-check when `sympy` is installed
 * (falling back cleanly to the exact TypeScript `bigint` rational verifier when
 * absent), and executes the built-in mutation self-test (`caughtMutations ===
 * totalMutations`). Exits 1 if any check or mutation self-test fails.
 *
 * Usage:
 *   node scripts/qa-content.mjs
 *   node scripts/qa-content.mjs --output <path>
 *   node scripts/qa-content.mjs --drafts <candidate-lessons.json>
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { LESSONS } = await import("../src/shared/content/index.ts");
const { QA_ASSERTION_RULE_IDS, runContentQaGate, runQaMutationSelfTest } = await import(
  "../src/shared/content/qa-gate.ts"
);

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const DEFAULT_PROMPTFOO_CONFIG = join(REPO_ROOT, "promptfooconfig.yaml");

export const TS_FALLBACK_SYMPY_BACKEND =
  "ts-deterministic-rational-verifier (python sympy optional, not installed)";

export function parseQaContentCliArgs(argv) {
  let outputPath = null;
  let draftsPath = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--output") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --output");
      }
      outputPath = resolve(next);
      i += 1;
    } else if (arg === "--drafts") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --drafts");
      }
      draftsPath = resolve(next);
      i += 1;
    } else if (typeof arg === "string" && arg.startsWith("-")) {
      throw new Error(`Unknown flag for qa:content: ${arg}`);
    } else {
      throw new Error(`Unexpected positional argument for qa:content: ${String(arg)}`);
    }
  }

  return { outputPath, draftsPath };
}

export function verifyPromptfooOfflineConfig(configPath = DEFAULT_PROMPTFOO_CONFIG) {
  if (!existsSync(configPath)) {
    return {
      ok: false,
      configPath,
      reason: `promptfooconfig.yaml not found at ${configPath}`,
      coveredRules: [],
    };
  }
  const raw = readFileSync(configPath, "utf8");
  const strippedComments = raw
    .split(/\r?\n/u)
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");

  const hasSharingDisabled = /^\s*sharing\s*:\s*false\s*$/mu.test(strippedComments);
  const hasEchoProvider = /\bid\s*:\s*echo\b/u.test(strippedComments);
  const forbiddenNetworkProvider =
    /\b(?:openai|anthropic|azure|bedrock|vertex|openrouter|cohere|mistral|groq)\s*:/iu.test(
      strippedComments,
    ) || /https?:\/\//iu.test(strippedComments);

  const coveredRules = QA_ASSERTION_RULE_IDS.filter((ruleId) => raw.includes(ruleId));
  const allRulesDocumented = coveredRules.length === QA_ASSERTION_RULE_IDS.length;

  const ok =
    hasSharingDisabled && hasEchoProvider && !forbiddenNetworkProvider && allRulesDocumented;

  return {
    ok,
    configPath,
    hasSharingDisabled,
    hasEchoProvider,
    zeroNetworkProviders: !forbiddenNetworkProvider,
    coveredRules,
  };
}

const SYMPY_CROSS_CHECK_SCRIPT = [
  "import json, re, sys, sympy",
  "from sympy import Rational",
  "PAT = re.compile(r'^Rational\\(\\s*([+-]?\\d+)\\s*,\\s*([+-]?\\d+)\\s*\\)$')",
  "def parse_rat(expr):",
  "    m = PAT.match(expr.strip())",
  "    if not m:",
  "        raise ValueError(f'Unsupported expression: {expr}')",
  "    return Rational(int(m.group(1)), int(m.group(2)))",
  "items = json.loads(sys.stdin.read())",
  "mismatches = []",
  "for item in items:",
  "    lhs = parse_rat(item['leftExpr'])",
  "    rhs = parse_rat(item['rightExpr'])",
  "    is_eq = (lhs == rhs)",
  "    if is_eq != bool(item['expectEqual']):",
  "        mismatches.append({'lessonId': item['lessonId'], 'stepPosition': item['stepPosition']})",
  "print(json.dumps({'sympyVersion': sympy.__version__, 'checked': len(items), 'mismatches': mismatches}))",
].join("\n");

export function runOptionalSympyCrossCheck(items, runner = spawnSync) {
  const probe = runner("python3", ["-I", "-c", "import sympy; print(sympy.__version__)"], {
    encoding: "utf8",
    timeout: 10_000,
  });

  if (probe.error || probe.status !== 0) {
    return {
      ok: true,
      sympyAvailable: false,
      sympyBackend: TS_FALLBACK_SYMPY_BACKEND,
      checkedPairs: items.length,
      mismatches: [],
    };
  }

  const verifyRun = runner("python3", ["-I", "-c", SYMPY_CROSS_CHECK_SCRIPT], {
    input: JSON.stringify(items),
    encoding: "utf8",
    timeout: 15_000,
  });

  if (verifyRun.error || verifyRun.status !== 0) {
    return {
      ok: false,
      sympyAvailable: true,
      sympyBackend: "python-sympy-error",
      checkedPairs: items.length,
      mismatches: [{ error: (verifyRun.stderr || "sympy subprocess failed").trim() }],
    };
  }

  const parsed = JSON.parse(verifyRun.stdout.trim());
  return {
    ok: Array.isArray(parsed.mismatches) && parsed.mismatches.length === 0,
    sympyAvailable: true,
    sympyBackend: `python-sympy-${String(parsed.sympyVersion)}`,
    checkedPairs: Number(parsed.checked ?? items.length),
    mismatches: parsed.mismatches ?? [],
  };
}

export function executeContentQaVerified(options = {}) {
  const lessons = options.lessons ?? LESSONS;
  const promptfooConfigCheck = verifyPromptfooOfflineConfig(options.promptfooConfigPath);
  const corpusReport = runContentQaGate(lessons);
  const sympyCheck = runOptionalSympyCrossCheck(
    corpusReport.sympyCrossCheckItems,
    options.spawnRunner,
  );
  const mutationSelfTest = runQaMutationSelfTest();

  const ok =
    promptfooConfigCheck.ok &&
    corpusReport.ok &&
    corpusReport.mathErrorsCount === 0 &&
    sympyCheck.ok &&
    mutationSelfTest.ok &&
    mutationSelfTest.caughtMutations === mutationSelfTest.totalMutations;

  const { sympyCrossCheckItems, ...corpusSummary } = corpusReport;
  void sympyCrossCheckItems;

  return {
    ok,
    gate: "G13",
    command: "qa:content",
    sympyBackend: sympyCheck.sympyBackend,
    sympyCrossCheck: {
      ok: sympyCheck.ok,
      sympyAvailable: sympyCheck.sympyAvailable,
      checkedPairs: sympyCheck.checkedPairs,
      mismatchesCount: sympyCheck.mismatches.length,
    },
    promptfooOfflineConfig: promptfooConfigCheck,
    corpus: corpusSummary,
    mutationSelfTest,
  };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let outputPath;
  let draftsPath;
  try {
    ({ outputPath, draftsPath } = parseQaContentCliArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(
      `qa:content refused: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  let candidateLessons = LESSONS;
  if (draftsPath !== null) {
    try {
      const parsed = JSON.parse(readFileSync(draftsPath, "utf8"));
      if (!Array.isArray(parsed)) {
        throw new Error("--drafts JSON root must be an array of LessonDefinition objects");
      }
      candidateLessons = parsed;
    } catch (error) {
      console.error(
        `qa:content refused: unable to read --drafts file: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  }

  const result = executeContentQaVerified({ lessons: candidateLessons });
  const formatted = `${JSON.stringify(result, null, 2)}\n`;

  if (outputPath !== null) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, formatted, "utf8");
  }
  process.stdout.write(formatted);

  if (!result.ok) {
    process.exit(1);
  }
}
