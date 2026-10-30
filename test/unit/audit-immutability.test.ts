import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as repo from "../../src/worker/db/repositories";

/**
 * Supplemental static source and migration check for `audit_events` immutability.
 *
 * The primary enforcement is the SQLite/D1 `BEFORE UPDATE` and `BEFORE DELETE`
 * triggers in `migrations/0004_evidence_integrity.sql`, verified against a live
 * local D1 instance in the integration suite. This unit test acts as a secondary
 * static guard ensuring application source and migrations never introduce
 * mutating SQL or repository helpers against `audit_events`.
 *
 * Paths are resolved from `import.meta.url` rather than `process.cwd()` so the
 * test behaves identically regardless of the working directory it is invoked from.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");

function collectSourceFiles(dir: string, list: string[] = []): string[] {
  if (!existsSync(dir)) {
    throw new Error(`Required directory for static audit scan does not exist: ${dir}`);
  }
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== ".git" && entry !== "dist") {
        collectSourceFiles(fullPath, list);
      }
    } else if (entry.endsWith(".ts") || entry.endsWith(".sql")) {
      list.push(fullPath);
    }
  }
  return list;
}

describe("audit_events static immutability guard (cwd-independent)", () => {
  it("resolves repository directories independent of process.cwd() and prohibits SQL DELETE or UPDATE against audit_events", () => {
    const srcDir = join(REPO_ROOT, "src");
    const migrationDir = join(REPO_ROOT, "migrations");

    const srcFiles = collectSourceFiles(srcDir);
    const migrationFiles = collectSourceFiles(migrationDir);
    expect(srcFiles.length, `Expected TypeScript source files under ${srcDir}`).toBeGreaterThan(0);
    expect(migrationFiles.length, `Expected SQL migration files under ${migrationDir}`).toBeGreaterThan(0);

    const sourceFiles = [...srcFiles, ...migrationFiles];

    const deletePattern = /DELETE\s+FROM\s+audit_events/i;
    const updatePattern = /UPDATE\s+audit_events\s+SET/i;

    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of sourceFiles) {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (deletePattern.test(line)) {
          violations.push({ file: filePath, line: idx + 1, match: line.trim() });
        }
        if (updatePattern.test(line)) {
          violations.push({ file: filePath, line: idx + 1, match: line.trim() });
        }
      });
    }

    expect(
      violations,
      `Detected mutating SQL statements targeting audit_events: ${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });

  it("verifies repository exports recordAudit/auditInsert and listAudit but no delete/update helpers", () => {
    const repoExports = Object.keys(repo);
    expect(repoExports).toContain("recordAudit");
    expect(repoExports).toContain("auditInsert");
    expect(repoExports).toContain("listAudit");

    const mutatingAuditHelpers = repoExports.filter((name) => {
      const lower = name.toLowerCase();
      return (
        lower.includes("audit") &&
        (lower.includes("delete") ||
          lower.includes("update") ||
          lower.includes("remove") ||
          lower.includes("clear") ||
          lower.includes("purge"))
      );
    });

    expect(
      mutatingAuditHelpers,
      `Repository must never export functions that delete or mutate audit_events: ${mutatingAuditHelpers.join(", ")}`,
    ).toEqual([]);
  });

  it("throws loudly when a target directory is missing and stays independent when process.cwd() changes", () => {
    expect(() => collectSourceFiles(join(REPO_ROOT, "non-existent-directory"))).toThrow(
      /Required directory for static audit scan does not exist/,
    );

    const originalCwd = process.cwd();
    try {
      process.chdir(tmpdir());
      const filesFromTmp = collectSourceFiles(join(REPO_ROOT, "migrations"));
      expect(filesFromTmp.some((f) => f.endsWith("0004_evidence_integrity.sql"))).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
