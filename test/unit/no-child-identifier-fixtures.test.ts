import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const HISTORICAL_EXEMPT_PREFIXES = [
  "plans/",
  "docs/audits/",
];

const SELF_FILE = "test/unit/no-child-identifier-fixtures.test.ts";

const FORBIDDEN_PATTERNS: readonly { label: string; regex: RegExp }[] = [
  {
    label: "literal nickname fixture for household child",
    regex: /["'`]?\bnickname\b["'`]?\s*:\s*["'`](?:Tài|Tai)(?:[\s"'`]|$)/u,
  },
  {
    label: "SQL string literal nickname for household child",
    regex: /'(?:Tài|Tai)'\s*(?:,|\))/u,
  },
  {
    label: "SQL equality predicate for household child nickname",
    regex: /\bnickname\s*=\s*'(?:Tài|Tai)'/iu,
  },
  {
    label: "parent displayName tied to household child",
    regex: /(?:Mẹ|Bố)\s+Tài/u,
  },
  {
    label: "deletion confirmation tied to household child",
    regex: /XOA\s+Tài/u,
  },
  {
    label: "backup filename fixture tied to household child",
    regex: /backup-tai/iu,
  },
  {
    label: "learner ID fixture tied to household child",
    regex: /learner-tai/iu,
  },
  {
    label: "birthYear 2016 fixture",
    regex: /\b(?:birthYear|birth_year)\b[^\n]{0,40}\b2016\b/u,
  },
  {
    label: "SQL VALUES row with 2016 birth_year",
    regex: /,\s*2016\s*,\s*[345]\s*,/u,
  },
];

function listCandidateFiles(): string[] {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
    },
  );
  return out.split("\0").filter(Boolean);
}

describe("public-repo child-identifier fixture guard", () => {
  it("keeps tracked and untracked non-ignored code, scripts, tests, and active docs free of household child-identifier fixtures", () => {
    const candidates = listCandidateFiles().filter(
      (rel) =>
        rel !== SELF_FILE &&
        !HISTORICAL_EXEMPT_PREFIXES.some((prefix) => rel.startsWith(prefix)),
    );
    expect(candidates.length).toBeGreaterThan(100);

    const violations: string[] = [];

    for (const rel of candidates) {
      const content = readFileSync(path.join(REPO_ROOT, rel), "utf8");
      const lines = content.split(/\r?\n/u);
      for (let idx = 0; idx < lines.length; idx += 1) {
        const line = lines[idx]!;
        for (const rule of FORBIDDEN_PATTERNS) {
          if (rule.regex.test(line)) {
            violations.push(`${rel}:${idx + 1} [${rule.label}] -> ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
