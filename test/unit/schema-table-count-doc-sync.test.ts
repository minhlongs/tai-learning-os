import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

function measureAppliedSchemaCounts(): {
  tables: number;
  views: number;
  triggers: number;
  indexes: number;
} {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec("PRAGMA foreign_keys = ON;");
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    }

    const tableRow = db
      .prepare(
        "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'd1_migrations'",
      )
      .get() as { n: number };
    const viewRow = db
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'view'")
      .get() as { n: number };
    const triggerRow = db
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'trigger'")
      .get() as { n: number };
    const indexRow = db
      .prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'index'")
      .get() as { n: number };

    return {
      tables: Number(tableRow.n),
      views: Number(viewRow.n),
      triggers: Number(triggerRow.n),
      indexes: Number(indexRow.n),
    };
  } finally {
    db.close();
  }
}

describe("applied schema table count stays synchronized with documentation", () => {
  it("matches the live sqlite_master table, view, trigger, and index counts across README.md, CLAUDE.md, and docs/DATA_MODEL.md", () => {
    const measured = measureAppliedSchemaCounts();
    expect(measured.tables).toBe(35);
    expect(measured.views).toBe(0);

    const readme = readFileSync(join(REPO_ROOT, "README.md"), "utf8");
    const claudeMd = readFileSync(join(REPO_ROOT, "CLAUDE.md"), "utf8");
    const dataModel = readFileSync(join(REPO_ROOT, "docs", "DATA_MODEL.md"), "utf8");

    const readmeStackMatch = readme.match(/Cloudflare D1 \(SQLite\) với (\d+) bảng quan hệ/);
    expect(readmeStackMatch, "README.md tech stack D1 table count").not.toBeNull();
    expect(Number(readmeStackMatch![1])).toBe(measured.tables);

    const readmeTreeMatch = readme.match(/DATA_MODEL\.md\s+# Đặc tả (\d+) bảng cơ sở dữ liệu/);
    expect(readmeTreeMatch, "README.md tree DATA_MODEL.md table count").not.toBeNull();
    expect(Number(readmeTreeMatch![1])).toBe(measured.tables);

    const claudeMatch = claudeMd.match(/DATA_MODEL\.md.*?— (\d+) D1 tables/);
    expect(claudeMatch, "CLAUDE.md DATA_MODEL.md table count").not.toBeNull();
    expect(Number(claudeMatch![1])).toBe(measured.tables);

    const dataModelHeadline = dataModel.match(
      /\*\*(\d+) tables, (\d+) triggers, and (\d+) indexes\*\*/,
    );
    expect(dataModelHeadline, "docs/DATA_MODEL.md headline counts").not.toBeNull();
    expect(Number(dataModelHeadline![1])).toBe(measured.tables);
    expect(Number(dataModelHeadline![2])).toBe(measured.triggers);
    expect(Number(dataModelHeadline![3])).toBe(measured.indexes);
  });
});
