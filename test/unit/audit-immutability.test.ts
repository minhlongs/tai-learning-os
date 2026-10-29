import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as repo from "../../src/worker/db/repositories";

/**
 * Gate A4: Audit Immutability Invariant.
 *
 * `audit_events` is an append-only security ledger. It records tamper-evident
 * actions (hint disclosures, attempt submissions, session lifecycles, and
 * parent corrections). Because it is used as an active integrity control
 * (e.g., flooring effectiveHelpLevel via findMaxDisclosedHintLevel), allowing
 * DELETE or UPDATE operations against `audit_events` would permit tampering
 * with educational provenance and security audit trails.
 */

function collectSourceFiles(dir: string, list: string[] = []): string[] {
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

describe("Gate A4: audit_events immutability invariant", () => {
  it("prohibits any SQL DELETE or UPDATE against audit_events across the entire codebase", () => {
    const srcDir = join(process.cwd(), "src");
    const migrationDir = join(process.cwd(), "migrations");
    const sourceFiles = [
      ...collectSourceFiles(srcDir),
      ...collectSourceFiles(migrationDir),
    ];

    expect(sourceFiles.length).toBeGreaterThan(0);

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

  it("verifies repository exports recordAudit and listAuditEvents but no delete/update helpers", () => {
    const repoExports = Object.keys(repo);
    expect(repoExports).toContain("recordAudit");
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
});
