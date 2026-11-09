import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { listShippedMigrationFiles } from "../../scripts/migrate-local-d1.mjs";
import {
  extractHouseholdIdentity,
  restoreHouseholdIdentity,
  verifyCleanHouseholdState,
} from "../../src/worker/db/reprovision-household";
import { resetUserData } from "../../src/worker/db/reset-user-data";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const MIGRATION_FILES = listShippedMigrationFiles();

/**
 * Lightweight D1Database adapter over Node's built-in in-memory SQLite (`node:sqlite`)
 * so unit tests can exercise real SQL, foreign keys, and `audit_events` triggers
 * deterministically without touching `.wrangler/state`.
 */
function createInMemoryMigratedD1(): { db: D1Database; raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");

  for (const file of MIGRATION_FILES) {
    const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    raw.exec(sqlText);
  }

  function makeStatement(sql: string, boundValues: unknown[] = []): D1PreparedStatement {
    return {
      bind(...values: unknown[]) {
        return makeStatement(sql, values);
      },
      async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
        const stmt = raw.prepare(sql);
        const row = stmt.get(...(boundValues as never[])) as Record<string, unknown> | undefined;
        if (!row) return null;
        if (colName !== undefined) return (row[colName] as T) ?? null;
        return row as T;
      },
      async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
        const stmt = raw.prepare(sql);
        const results = stmt.all(...(boundValues as never[])) as unknown as T[];
        return {
          results,
          success: true,
          meta: {
            duration: 0,
            size_after: 0,
            rows_read: results.length,
            rows_written: 0,
            last_row_id: 0,
            changed_db: false,
            changes: 0,
          },
        };
      },
      async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
        const stmt = raw.prepare(sql);
        const res = stmt.run(...(boundValues as never[]));
        return {
          results: [],
          success: true,
          meta: {
            duration: 0,
            size_after: 0,
            rows_read: 0,
            rows_written: Number(res.changes),
            last_row_id: Number(res.lastInsertRowid),
            changed_db: Number(res.changes) > 0,
            changes: Number(res.changes),
          },
        };
      },
      async raw<T = unknown[]>(): Promise<T[]> {
        return [];
      },
    } as unknown as D1PreparedStatement;
  }

  const db: D1Database = {
    prepare(sql: string) {
      return makeStatement(sql);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      raw.exec("BEGIN");
      try {
        const out: D1Result<T>[] = [];
        for (const stmt of statements) {
          out.push(await stmt.run<T>());
        }
        raw.exec("COMMIT");
        return out;
      } catch (err) {
        raw.exec("ROLLBACK");
        throw err;
      }
    },
    async exec(sql: string): Promise<D1ExecResult> {
      raw.exec(sql);
      return { count: 1, duration: 0 };
    },
    async dump(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    },
    withSession() {
      return this as unknown as D1DatabaseSession;
    },
  };

  return { db, raw };
}

describe("household D1 database clean reprovisioning", () => {
  it("extracts parent, learner, and school-year snapshot from a polluted database while preserving password_hash verbatim", async () => {
    const { db, raw } = createInMemoryMigratedD1();

    const sampleHash =
      "pbkdf2-sha256:600000$00112233445566778899aabbccddeeff$deadbeefcafe0123456789abcdef0123456789abcdef0123456789abcdef0123";
    raw
      .prepare(
        "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("parent-1", sampleHash, "Phụ huynh", 1793275984978, 1793275985198);
    raw
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("learner-tai", "parent-1", "Tài", 2016, 4, "Asia/Ho_Chi_Minh", 1793468880199, 1793468880199);
    raw
      .prepare(
        "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run("sy-2026", "learner-tai", "2026-2027", "2026-09-01", "2027-06-30", 4, 1793468888533);

    // Pollute with simulated organization + audit rows
    raw
      .prepare("INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run("org-sim", "Trung Tâm Giả Lập", "trung-tam-gia-lap", 1793468890000, 1793468890000);
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("aud-sim", "parent:sim", "organization.created", "org-sim", null, 1793468890000);

    const snapshot = await extractHouseholdIdentity(db);
    expect(snapshot.parent).toEqual({
      id: "parent-1",
      password_hash: sampleHash,
      display_name: "Phụ huynh",
      created_at: 1793275984978,
      updated_at: 1793275985198,
    });
    expect(snapshot.learner).toEqual({
      id: "learner-tai",
      parent_id: "parent-1",
      nickname: "Tài",
      birth_year: 2016,
      grade: 4,
      timezone: "Asia/Ho_Chi_Minh",
      created_at: 1793468880199,
      updated_at: 1793468880199,
    });
    expect(snapshot.schoolYear).toEqual({
      id: "sy-2026",
      learner_id: "learner-tai",
      label: "2026-2027",
      starts_on: "2026-09-01",
      ends_on: "2027-06-30",
      grade: 4,
      created_at: 1793468888533,
    });
  });

  it("restores household identity into a fresh migrated database and records only canonical provenance audit events", async () => {
    const { db: pollutedDb, raw: pollutedRaw } = createInMemoryMigratedD1();
    const sampleHash =
      "pbkdf2-sha256:600000$00112233445566778899aabbccddeeff$deadbeefcafe0123456789abcdef0123456789abcdef0123456789abcdef0123";
    pollutedRaw
      .prepare(
        "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run("parent-1", sampleHash, "Phụ huynh", 1793275984978, 1793275985198);
    pollutedRaw
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("learner-tai", "parent-1", "Tài", 2016, 4, "Asia/Ho_Chi_Minh", 1793468880199, 1793468880199);
    pollutedRaw
      .prepare(
        "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run("sy-2026", "learner-tai", "2026-2027", "2026-09-01", "2027-06-30", 4, 1793468888533);

    const snapshot = await extractHouseholdIdentity(pollutedDb);

    // Open a clean migrated D1 instance
    const { db: cleanDb, raw: cleanRaw } = createInMemoryMigratedD1();
    // Seed 50 stub lessons to satisfy the 50-lesson catalogue baseline check
    for (let i = 1; i <= 50; i++) {
      const lessonId = `lesson-${i}`;
      cleanRaw
        .prepare(
          "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES (?, 'math', NULL, ?, ?, 'obj', 'obj', 4, 4, 1, 1000, 1000)",
        )
        .run(lessonId, `Bài ${i}`, `Lesson ${i}`);
      cleanRaw
        .prepare(
          "INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at) VALUES (?, 1, ?, ?, 'obj', 'obj', 1000)",
        )
        .run(lessonId, `Bài ${i}`, `Lesson ${i}`);
    }

    await restoreHouseholdIdentity(cleanDb, snapshot, 1793500000000);
    const report = await verifyCleanHouseholdState(cleanDb);

    expect(report).toEqual({
      schemaVersion: 14,
      lessonsCount: 50,
      lessonVersionsCount: 50,
      parentsCount: 1,
      learnersCount: 1,
      schoolYearsCount: 1,
      organizationsCount: 0,
      classroomsCount: 0,
      learningSessionsCount: 0,
      learningAttemptsCount: 0,
      skillEvidenceCount: 0,
      auditEventsCount: 2,
      auditActions: ["parent.created", "learner.enrolled"],
    });
  });

  it("refuses to restore into a database that already contains audit_events or simulated organizations", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("aud-existing", "parent:sim", "organization.created", "org-1", null, 1000);

    await expect(
      restoreHouseholdIdentity(
        db,
        { parent: null, learner: null, schoolYear: null },
        2000,
      ),
    ).rejects.toThrow(/target database is not clean/i);
  });

  it("fails verification if simulated organizations, sessions, or unexpected audit actions exist", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    for (let i = 1; i <= 50; i++) {
      const lessonId = `lesson-${i}`;
      raw
        .prepare(
          "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES (?, 'math', NULL, ?, ?, 'obj', 'obj', 4, 4, 1, 1000, 1000)",
        )
        .run(lessonId, `Bài ${i}`, `Lesson ${i}`);
      raw
        .prepare(
          "INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at) VALUES (?, 1, ?, ?, 'obj', 'obj', 1000)",
        )
        .run(lessonId, `Bài ${i}`, `Lesson ${i}`);
    }
    raw
      .prepare("INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run("org-leak", "Sim Org", "sim-org", 1000, 1000);

    await expect(verifyCleanHouseholdState(db)).rejects.toThrow(/organizationsCount/i);
  });

  it("points operators to npm run db:reprovision-household when resetUserData refuses due to audit_events", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("aud-1", "parent:1", "parent.created", "p1", null, 1000);

    await expect(resetUserData(db)).rejects.toThrow(/npm run db:reprovision-household/);
  });

  it("wires scripts/reprovision-household-db.mjs and preserves CLAUDE.md child-safety policy block", () => {
    const scriptPath = join(REPO_ROOT, "scripts/reprovision-household-db.mjs");
    expect(existsSync(scriptPath)).toBe(true);

    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.["db:reprovision-household"]).toBe(
      "node scripts/reprovision-household-db.mjs",
    );

    const claudeMd = readFileSync(join(REPO_ROOT, "CLAUDE.md"), "utf8");
    expect(claudeMd).toContain("Release Policy: PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.");
    expect(claudeMd).toContain(
      "**Blocked:** Remote deploy (`wrangler deploy`), remote migrations, remote resource provisioning, paid/external LLM APIs, and hosted child pilot",
    );
    expect(claudeMd).toContain(
      "**Permitted:** Localhost use on this household machine for the single learner registered in it, supervised in person by the parent/owner.",
    );
    expect(claudeMd).toContain("npm run db:reprovision-household");
  });
});
