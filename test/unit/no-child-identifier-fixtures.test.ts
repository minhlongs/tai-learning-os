import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { activeLearnerLabelVi } from "../../src/client/lib/learner-label";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

const HISTORICAL_EXEMPT_PREFIXES = [
  "plans/",
  "docs/audits/",
];

const SELF_FILE = "test/unit/no-child-identifier-fixtures.test.ts";

export const FORBIDDEN_CHILD_IDENTIFIER_PATTERNS: readonly { label: string; regex: RegExp }[] = [
  {
    label: "literal nickname fixture for household child",
    regex: /["'`]?\bnickname\b["'`]?\s*:\s*["'`](?:Tài|Tai)(?:[\s"'`]|$)/iu,
  },
  {
    label: "SQL string literal nickname for household child",
    regex: /'(?:Tài|Tai)'\s*(?:,|\))/iu,
  },
  {
    label: "SQL equality predicate for household child nickname",
    regex: /\bnickname\s*=\s*'(?:Tài|Tai)'/iu,
  },
  {
    label: "parent displayName tied to household child",
    regex: /(?:Mẹ|Bố)\s+(?:Tài|Tai)/iu,
  },
  {
    label: "deletion confirmation tied to household child",
    regex: /XOA\s+(?:Tài|Tai)/iu,
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
  {
    label: "standalone capitalized household child name outside Vietnamese compound vocabulary",
    regex:
      /(?<![\p{L}\p{N}])(?:Tài|TÀI)(?!(?:\s+(?:[Ll]iệu|[Kk]hoản|[Nn]ăng|[Cc]hính|[Nn]guyên|[Ss]ản|[Xx]ế|[Gg]iỏi|[Tt]rợ)))(?![\p{L}\p{N}])/u,
  },
  {
    label: "unaccented mixed-case ASCII household child name",
    regex: /(?<![\p{L}\p{N}-])Tai(?![\p{L}\p{N}-])/u,
  },
];

export function findChildIdentifierViolationsInLine(line: string): string[] {
  const normalized = line.normalize("NFC");
  return FORBIDDEN_CHILD_IDENTIFIER_PATTERNS.filter((rule) => rule.regex.test(normalized)).map(
    (rule) => rule.label,
  );
}

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
  it("keeps tracked and untracked non-ignored code, UI, content, scripts, tests, and active docs free of household child identifiers", () => {
    const candidates = listCandidateFiles().filter(
      (rel) =>
        rel !== SELF_FILE &&
        !HISTORICAL_EXEMPT_PREFIXES.some((prefix) => rel.startsWith(prefix)),
    );
    expect(candidates.length).toBeGreaterThan(100);

    const violations: string[] = [];

    for (const rel of candidates) {
      const content = readFileSync(path.join(REPO_ROOT, rel), "utf8").normalize("NFC");
      const lines = content.split(/\r?\n/u);
      for (let idx = 0; idx < lines.length; idx += 1) {
        const line = lines[idx]!;
        for (const rule of FORBIDDEN_CHILD_IDENTIFIER_PATTERNS) {
          if (rule.regex.test(line)) {
            violations.push(`${rel}:${idx + 1} [${rule.label}] -> ${line.trim()}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("catches accented, NFD-decomposed, and unaccented ASCII child names while allowing ordinary Vietnamese words and uppercase TAI brand", () => {
    expect(findChildIdentifierViolationsInLine('question_vi: "Bài học của Tài"')).not.toEqual([]);
    expect(
      findChildIdentifierViolationsInLine(`question_vi: "Bài học của ${"Tài".normalize("NFD")}"`),
    ).not.toEqual([]);
    expect(findChildIdentifierViolationsInLine('question_en: "What fraction did Tai eat?"')).not.toEqual(
      [],
    );
    expect(findChildIdentifierViolationsInLine("Em chọn đề tài khoa học và trọng tài công tâm.")).toEqual(
      [],
    );
    expect(findChildIdentifierViolationsInLine("Tài liệu và Tài khoản tại Thư viện TAI (tai-learning-os).")).toEqual(
      [],
    );
  });

  it("formats activeLearnerLabelVi from session.learner.nickname with neutral fallback", () => {
    expect(activeLearnerLabelVi({ learner: { id: "l-1", nickname: "Bé An" } })).toBe("Bé An");
    expect(activeLearnerLabelVi({ learner: { id: "l-1", nickname: "  Na  " } })).toBe("Na");
    expect(activeLearnerLabelVi({ learner: { id: "l-1", nickname: "   " } })).toBe("con");
    expect(activeLearnerLabelVi({ learner: null })).toBe("con");
    expect(activeLearnerLabelVi({ learner: null }, "người học")).toBe("người học");
  });
});
