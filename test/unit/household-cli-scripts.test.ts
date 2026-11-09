import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  approveHouseholdLessons,
  parseApproveLessonsCliArgs,
} from "../../scripts/approve-household-lessons.mjs";
import {
  buildReadOnlySqlDump,
  formatSqlLiteral,
  parseDumpLocalD1CliArgs,
  runDumpLocalD1OnRoot,
} from "../../scripts/dump-local-d1.mjs";
import { createReadOnlyD1Adapter } from "../../scripts/household-preflight.mjs";
import {
  listShippedMigrationFiles,
  parseMigrateLocalD1CliArgs,
  runMigrateLocalD1OnRoot,
} from "../../scripts/migrate-local-d1.mjs";
import {
  parseReprovisionCliArgs,
  reprovisionHouseholdDatabase,
} from "../../scripts/reprovision-household-db.mjs";
import {
  parseResetLocalD1CliArgs,
  runResetLocalD1OnRoot,
} from "../../scripts/reset-local-d1.mjs";
import {
  miniflareD1SqliteFilename,
  parseSeedLessonsCliArgs,
  runSeedLessonsOnRoot,
  splitSqlStatements,
} from "../../scripts/seed-lessons.mjs";
import { parseUnlockCliArgs, unlockParentAuthThrottles } from "../../scripts/unlock-parent.mjs";
import { inspectHouseholdPreflight } from "../../src/worker/db/household-preflight";

const HERE = new URL(".", import.meta.url).pathname;
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");
const APPROVE_CLI = join(REPO_ROOT, "scripts", "approve-household-lessons.mjs");
const UNLOCK_CLI = join(REPO_ROOT, "scripts", "unlock-parent.mjs");
const SEED_CLI = join(REPO_ROOT, "scripts", "seed-lessons.mjs");
const RESET_CLI = join(REPO_ROOT, "scripts", "reset-local-d1.mjs");
const MIGRATE_CLI = join(REPO_ROOT, "scripts", "migrate-local-d1.mjs");
const DUMP_CLI = join(REPO_ROOT, "scripts", "dump-local-d1.mjs");

const D1_SQLITE_FILENAME =
  "55cf0b3020dae37b568062fe28961bd8d3fcd41f9b33fe8ddfdc3540875f734a.sqlite";

const MIGRATION_FILES = listShippedMigrationFiles();

const CANARY_PARENT_HASH = "pbkdf2-sha256:600000$dbsalt001122334455$dbdigestdeadbeefcafe0123456789";
const FIXED_NOW = 1_800_000_000_000;

function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function createMigratedFixture(tag: string): {
  tmpRoot: string;
  sqlitePath: string;
  cleanup: () => void;
} {
  const tmpRoot = mkdtempSync(join(tmpdir(), `tlo-${tag}-`));
  const d1StateDir = join(tmpRoot, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  mkdirSync(d1StateDir, { recursive: true });
  const sqlitePath = join(d1StateDir, D1_SQLITE_FILENAME);

  const raw = new DatabaseSync(sqlitePath);
  try {
    raw.exec("PRAGMA foreign_keys = ON;");
    raw.exec("PRAGMA journal_mode = WAL;");
    for (const file of MIGRATION_FILES) {
      const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      raw.exec(sqlText);
    }
  } finally {
    raw.close();
  }

  return {
    tmpRoot,
    sqlitePath,
    cleanup() {
      rmSync(tmpRoot, { recursive: true, force: true });
    },
  };
}

function openWritable(sqlitePath: string): DatabaseSync {
  const raw = new DatabaseSync(sqlitePath);
  raw.exec("PRAGMA foreign_keys = ON;");
  return raw;
}

/**
 * Seeds a deterministic catalogue: 10 grade-4 lessons (2 math + 8 english) and
 * 5 grade-5 science lessons.
 */
function seedLessons(raw: DatabaseSync): void {
  const rows: Array<{ id: string; subject: string; from: number; to: number }> = [];
  for (let i = 1; i <= 2; i += 1) {
    rows.push({ id: `math-g4-${i}`, subject: "math", from: 4, to: 4 });
  }
  for (let i = 1; i <= 8; i += 1) {
    rows.push({ id: `eng-g4-${i}`, subject: "english", from: 4, to: 4 });
  }
  for (let i = 1; i <= 5; i += 1) {
    rows.push({ id: `sci-g5-${i}`, subject: "science", from: 5, to: 5 });
  }
  for (const row of rows) {
    raw
      .prepare(
        `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
                              grade_from, grade_to, version, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, 'obj', 'obj', ?, ?, 1, 1000, 1000)`,
      )
      .run(row.id, row.subject, `Bài ${row.id}`, `Lesson ${row.id}`, row.from, row.to);
    raw
      .prepare(
        `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
         VALUES (?, 1, ?, ?, 'obj', 'obj', 1000)`,
      )
      .run(row.id, `Bài ${row.id}`, `Lesson ${row.id}`);
  }
}

function seedHousehold(raw: DatabaseSync): void {
  raw
    .prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
    )
    .run(CANARY_PARENT_HASH);
  raw
    .prepare(
      "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-tai', 'parent-1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
    )
    .run();
  raw
    .prepare(
      "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES ('sy-2026', 'learner-tai', '2026-2027', '2026-09-01', '2027-06-30', 4, 1000)",
    )
    .run();
  raw
    .prepare(
      "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-1', 'parent:parent-1', 'parent.created', 'parent-1', NULL, 1000)",
    )
    .run();
}

function countRows(raw: DatabaseSync, table: string, where: string, ...binds: unknown[]): number {
  const row = raw.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get(...binds);
  return Number(row?.n ?? 0);
}

describe("approve-household-lessons CLI argument parsing", () => {
  it("defaults to no filter, the cwd target root, and parses every documented flag", () => {
    expect(parseApproveLessonsCliArgs([])).toEqual({
      targetRoot: process.cwd(),
      grade: null,
      subject: null,
      lessonIds: [],
      all: false,
      note: null,
    });

    expect(
      parseApproveLessonsCliArgs([
        "--target-root",
        "/tmp/other-root",
        "--grade",
        "4",
        "--subject",
        " math ",
        "--lesson",
        "math-g4-1, eng-g4-2 ,",
        "--note",
        "duyệt cho buổi tối",
      ]),
    ).toEqual({
      targetRoot: "/tmp/other-root",
      grade: 4,
      subject: "math",
      lessonIds: ["math-g4-1", "eng-g4-2"],
      all: false,
      note: "duyệt cho buổi tối",
    });

    expect(parseApproveLessonsCliArgs(["--all"])).toMatchObject({ all: true });
    // Trailing value-bearing flag at the end of argv is ignored safely.
    expect(parseApproveLessonsCliArgs(["--grade"])).toMatchObject({ grade: null });
  });

  it("refuses an invalid grade value", () => {
    expect(() => parseApproveLessonsCliArgs(["--grade", "abc"])).toThrow(/Invalid --grade value/);
    expect(() => parseApproveLessonsCliArgs(["--grade", "0"])).toThrow(/Invalid --grade value/);
    expect(() => parseApproveLessonsCliArgs(["--grade", "--all"])).toThrow(/Invalid --grade value/);
  });
});

describe("approveHouseholdLessons", () => {
  it("approves the learner's grade catalogue lessons by default and is idempotent on re-run", () => {
    const fixture = createMigratedFixture("approve-default");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);

        const first = approveHouseholdLessons(raw, {}, FIXED_NOW);
        expect(first.ok).toBe(true);
        expect(first.parentId).toBe("parent-1");
        expect(first.learnerId).toBe("learner-tai");
        expect(first.learnerNickname).toBe("Tài");
        expect(first.targetGrade).toBe(4);
        expect(first.newlyApprovedCount).toBe(10);
        expect(first.alreadyApprovedCount).toBe(0);
        expect(first.totalApprovedCount).toBe(10);
        expect(first.readyForLearnerSession).toBe(true);

        expect(countRows(raw, "review_approvals", "status = 'approved'")).toBe(10);
        expect(
          countRows(raw, "review_approvals", "decided_by = ? AND learner_id = ?", "parent-1", "learner-tai"),
        ).toBe(10);
        expect(countRows(raw, "audit_events", "action = 'lesson.approval.approved'")).toBe(10);
        expect(
          countRows(raw, "audit_events", "action = 'lesson.approval.approved' AND actor = ?", "parent:parent-1"),
        ).toBe(10);
        // Every approval is pinned to the lesson's live version.
        const unpinned = raw
          .prepare(
            `SELECT COUNT(*) AS n FROM review_approvals ra
             JOIN lessons l ON l.id = ra.lesson_id
             WHERE ra.learner_id = 'learner-tai' AND ra.lesson_version <> l.version`,
          )
          .get();
        expect(Number(unpinned?.n ?? 0)).toBe(0);

        const second = approveHouseholdLessons(raw, {}, FIXED_NOW + 1);
        expect(second.newlyApprovedCount).toBe(0);
        expect(second.alreadyApprovedCount).toBe(10);
        expect(second.totalApprovedCount).toBe(10);
        // No duplicate audit rows on the second run.
        expect(countRows(raw, "audit_events", "action = 'lesson.approval.approved'")).toBe(10);
        expect(countRows(raw, "review_approvals", "1 = 1")).toBe(10);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("honors --grade, --subject, and --lesson filters", () => {
    const fixture = createMigratedFixture("approve-filters");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);
        raw
          .prepare(
            `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
                                  grade_from, grade_to, version, ownership_type, owner_parent_id, created_at, updated_at)
             VALUES ('family-mine', 'math', NULL, 'Bài nhà tôi', 'My family lesson', 'obj', 'obj', 4, 4, 1, 'family', 'parent-1', 1000, 1000)`,
          )
          .run();
        raw
          .prepare(
            `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
             VALUES ('family-mine', 1, 'Bài nhà tôi', 'My family lesson', 'obj', 'obj', 1000)`,
          )
          .run();

        const gradeOnly = approveHouseholdLessons(raw, { grade: 5 }, FIXED_NOW);
        expect(gradeOnly.targetGrade).toBe(5);
        expect(gradeOnly.newlyApprovedCount).toBe(5);
        expect(countRows(raw, "review_approvals", "lesson_id LIKE 'sci-g5-%'")).toBe(5);

        const subjectOnly = approveHouseholdLessons(raw, { grade: 4, subject: "math" }, FIXED_NOW);
        expect(subjectOnly.newlyApprovedCount).toBe(3);
        const mathIds = raw
          .prepare(
            `SELECT lesson_id FROM review_approvals ra
             JOIN lessons l ON l.id = ra.lesson_id
             WHERE ra.learner_id = 'learner-tai' AND l.subject_id = 'math' ORDER BY lesson_id ASC`,
          )
          .all();
        expect(mathIds.map((r) => r.lesson_id)).toEqual(["family-mine", "math-g4-1", "math-g4-2"]);

        const single = approveHouseholdLessons(raw, { lessonIds: ["eng-g4-7"] }, FIXED_NOW);
        expect(single.newlyApprovedCount).toBe(1);
        expect(single.approvedLessonIds).toEqual(["eng-g4-7"]);
        expect(approveHouseholdLessons(raw, { lessonIds: ["eng-g4-7"] }, FIXED_NOW).newlyApprovedCount).toBe(0);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("approves every grade with --all and records the note length only", () => {
    const fixture = createMigratedFixture("approve-all");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);

        const all = approveHouseholdLessons(
          raw,
          { all: true, note: "duyệt toàn bộ chương trình" },
          FIXED_NOW,
        );
        expect(all.newlyApprovedCount).toBe(15);
        expect(all.totalApprovedCount).toBe(15);

        const auditDetail = raw
          .prepare(
            `SELECT detail FROM audit_events
             WHERE action = 'lesson.approval.approved' AND subject = 'math-g4-1'`,
          )
          .get();
        expect(JSON.parse(String(auditDetail?.detail))).toMatchObject({
          note: "duyệt toàn bộ chương trình".length,
          learnerId: "learner-tai",
          version: 1,
        });
        const storedNote = raw
          .prepare("SELECT note FROM review_approvals WHERE lesson_id = 'math-g4-1'")
          .get();
        expect(String(storedNote?.note)).toBe("duyệt toàn bộ chương trình");
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("re-approves a lesson when its live version moves past the approved version", () => {
    const fixture = createMigratedFixture("approve-version");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);

        expect(approveHouseholdLessons(raw, { lessonIds: ["math-g4-1"] }, FIXED_NOW).newlyApprovedCount).toBe(1);
        raw.prepare("UPDATE lessons SET version = 2 WHERE id = 'math-g4-1'").run();

        const bumped = approveHouseholdLessons(raw, { lessonIds: ["math-g4-1"] }, FIXED_NOW + 5);
        expect(bumped.newlyApprovedCount).toBe(1);
        expect(bumped.totalApprovedCount).toBe(1);
        expect(countRows(raw, "review_approvals", "1 = 1")).toBe(2);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("lets an explicit filter approve a grade other than the learner's own", () => {
    const fixture = createMigratedFixture("approve-foreign-grade");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);

        const report = approveHouseholdLessons(raw, { grade: 5 }, FIXED_NOW);
        expect(report.targetGrade).toBe(5);
        expect(report.newlyApprovedCount).toBe(5);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("refuses a household-polluted or empty database without writing anything", () => {
    const fixture = createMigratedFixture("approve-refuse");
    try {
      // Empty database: no parent and no learner.
      const emptyRaw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(emptyRaw);
        expect(() => approveHouseholdLessons(emptyRaw, {}, FIXED_NOW)).toThrow(
          /household parent or learner profile not found/i,
        );
      } finally {
        emptyRaw.close();
      }

      // Multi-learner pollution must be refused before any write.
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedHousehold(raw);
        raw
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-other', 'parent-1', 'Khác', 2016, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
          )
          .run();
        expect(() => approveHouseholdLessons(raw, {}, FIXED_NOW)).toThrow(
          /multi-learner or organization pollution detected/i,
        );
        expect(countRows(raw, "review_approvals", "1 = 1")).toBe(0);
        expect(countRows(raw, "audit_events", "action = 'lesson.approval.approved'")).toBe(0);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("refuses an empty filter result instead of approving nothing silently", () => {
    const fixture = createMigratedFixture("approve-empty-filter");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedLessons(raw);
        seedHousehold(raw);
        expect(() => approveHouseholdLessons(raw, { subject: "history" }, FIXED_NOW)).toThrow(
          /no eligible lessons matched the requested filter/i,
        );
        expect(countRows(raw, "review_approvals", "1 = 1")).toBe(0);
        expect(countRows(raw, "audit_events", "action = 'lesson.approval.approved'")).toBe(0);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("runs from the terminal with --target-root against an isolated fixture and never leaks the password hash", () => {
    const fixture = createMigratedFixture("approve-cli");
    try {
      const setup = openWritable(fixture.sqlitePath);
      try {
        seedLessons(setup);
        seedHousehold(setup);
      } finally {
        setup.close();
      }

      const run = spawnSync(
        process.execPath,
        [APPROVE_CLI, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).not.toContain("Using secrets defined in");
      expect(run.stdout).not.toContain(CANARY_PARENT_HASH);
      expect(run.stdout).not.toContain("pbkdf2-sha256");

      const report = JSON.parse(run.stdout) as {
        ok: boolean;
        newlyApprovedCount: number;
        readyForLearnerSession: boolean;
      };
      expect(report.ok).toBe(true);
      expect(report.newlyApprovedCount).toBe(10);
      expect(report.readyForLearnerSession).toBe(true);

      const verify = openWritable(fixture.sqlitePath);
      try {
        expect(countRows(verify, "review_approvals", "1 = 1")).toBe(10);
      } finally {
        verify.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("fails cleanly when the local D1 SQLite file is missing", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-approve-missing-db-"));
    try {
      const run = spawnSync(process.execPath, [APPROVE_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("local D1 SQLite database not found");
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

describe("unlockParentAuthThrottles", () => {
  it("clears every throttle row, writes an audit row attributed to the household parent, and is idempotent", () => {
    const fixture = createMigratedFixture("unlock-parent");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedHousehold(raw);
        raw
          .prepare(
            `INSERT INTO auth_throttles (key, scope, failed_count, window_started_at, locked_until, updated_at)
             VALUES ('ip:198.51.100.1', 'ip', 5, 1000, 2000, 1000),
                    ('account:parent-1', 'account', 5, 1000, 2000, 1000)`,
          )
          .run();

        const result = unlockParentAuthThrottles(raw, FIXED_NOW);
        expect(result.clearedCount).toBe(2);
        expect(result.actor).toBe("parent:parent-1");

        expect(countRows(raw, "auth_throttles", "1 = 1")).toBe(0);
        const audit = raw
          .prepare(
            "SELECT actor, action, subject, created_at FROM audit_events WHERE action = 'parent.throttle_unlocked_cli'",
          )
          .get();
        expect(audit?.actor).toBe("parent:parent-1");
        expect(audit?.action).toBe("parent.throttle_unlocked_cli");
        expect(audit?.subject).toBe("auth_throttles");
        expect(Number(audit?.created_at)).toBe(FIXED_NOW);

        // A second run reports zero records cleared but stays a valid audit trail.
        const again = unlockParentAuthThrottles(raw, FIXED_NOW + 1);
        expect(again.clearedCount).toBe(0);
        expect(countRows(raw, "audit_events", "action = 'parent.throttle_unlocked_cli'")).toBe(2);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("attributes the audit row to system when no parent exists yet", () => {
    const fixture = createMigratedFixture("unlock-system");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        raw
          .prepare(
            `INSERT INTO auth_throttles (key, scope, failed_count, window_started_at, locked_until, updated_at)
             VALUES ('ip:198.51.100.1', 'ip', 5, 1000, 2000, 1000)`,
          )
          .run();
        const result = unlockParentAuthThrottles(raw, FIXED_NOW);
        expect(result.actor).toBe("system");
        expect(result.clearedCount).toBe(1);
        expect(countRows(raw, "auth_throttles", "1 = 1")).toBe(0);
      } finally {
        raw.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("parses --target-root and clears the real fixture database from the terminal", () => {
    expect(parseUnlockCliArgs([])).toEqual({ targetRoot: process.cwd() });
    expect(parseUnlockCliArgs(["--target-root", "/tmp/other-root"])).toEqual({
      targetRoot: "/tmp/other-root",
    });

    const fixture = createMigratedFixture("unlock-cli");
    try {
      const setup = openWritable(fixture.sqlitePath);
      try {
        seedHousehold(setup);
        setup
          .prepare(
            `INSERT INTO auth_throttles (key, scope, failed_count, window_started_at, locked_until, updated_at)
             VALUES ('ip:198.51.100.1', 'ip', 5, 1000, 2000, 1000)`,
          )
          .run();
      } finally {
        setup.close();
      }

      const run = spawnSync(process.execPath, [UNLOCK_CLI, "--target-root", fixture.tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).toContain("1 throttle record(s) cleared");

      const verify = openWritable(fixture.sqlitePath);
      try {
        expect(countRows(verify, "auth_throttles", "1 = 1")).toBe(0);
        expect(
          countRows(
            verify,
            "audit_events",
            "action = ? AND actor = ?",
            "parent.throttle_unlocked_cli",
            "parent:parent-1",
          ),
        ).toBe(1);
      } finally {
        verify.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("fails cleanly when the local D1 SQLite file is missing", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-unlock-missing-db-"));
    try {
      const run = spawnSync(process.execPath, [UNLOCK_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("local D1 SQLite database not found");
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it("leaves household:preflight passing after unlockParentAuthThrottles, legacy cli-operator events, and approveHouseholdLessons", async () => {
    const fixture = createMigratedFixture("cli-preflight-compat");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        // Seed 50 catalogue lessons so preflight's catalogue invariant is satisfied.
        for (let i = 1; i <= 50; i += 1) {
          const id = `cat-lesson-${i}`;
          const grade = i <= 25 ? 4 : 5;
          raw
            .prepare(
              `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
                                    grade_from, grade_to, version, created_at, updated_at)
               VALUES (?, 'math', NULL, ?, ?, 'obj', 'obj', ?, ?, 1, 1000, 1000)`,
            )
            .run(id, `Bài ${i}`, `Lesson ${i}`, grade, grade);
          raw
            .prepare(
              `INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
               VALUES (?, 1, ?, ?, 'obj', 'obj', 1000)`,
            )
            .run(id, `Bài ${i}`, `Lesson ${i}`);
        }
        seedHousehold(raw);

        // Legacy `cli-operator` audit rows must remain acceptable, and the new
        // unlock writer must emit a household `parent:` actor instead.
        raw
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-legacy', 'cli-operator', 'parent.throttle_unlocked_cli', 'auth_throttles', '{}', 1500)",
          )
          .run();
        unlockParentAuthThrottles(raw, FIXED_NOW);
      } finally {
        raw.close();
      }

      const ro1 = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const preReport = await inspectHouseholdPreflight(
          createReadOnlyD1Adapter(ro1),
          { devVarsPresent: true, hasSessionSecret: true, hasParentPasswordHash: true },
          "ok",
        );
        expect(preReport.ok).toBe(true);
        expect(preReport.approvedLessonsCount).toBe(0);
        expect(preReport.readyForLearnerSession).toBe(false);
        expect(preReport.nextActionVi).toContain("household:approve-lessons");
      } finally {
        ro1.close();
      }

      const rawApprove = openWritable(fixture.sqlitePath);
      try {
        const approvalReport = approveHouseholdLessons(rawApprove, {}, FIXED_NOW + 10);
        expect(approvalReport.newlyApprovedCount).toBe(25);
        expect(approvalReport.readyForLearnerSession).toBe(true);
      } finally {
        rawApprove.close();
      }

      const ro2 = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const postReport = await inspectHouseholdPreflight(
          createReadOnlyD1Adapter(ro2),
          { devVarsPresent: true, hasSessionSecret: true, hasParentPasswordHash: true },
          "ok",
        );
        expect(postReport.ok).toBe(true);
        expect(postReport.approvedLessonsCount).toBe(25);
        expect(postReport.readyForLearnerSession).toBe(true);
      } finally {
        ro2.close();
      }
    } finally {
      fixture.cleanup();
    }
  });
});

describe("seed-lessons and reset-local-d1 CLI scripts (DatabaseSync, zero platform proxy)", () => {
  it("parses --target-root and seeds all 50 shipped catalogue lessons idempotently", async () => {
    expect(parseSeedLessonsCliArgs([])).toEqual({ targetRoot: process.cwd() });
    expect(parseSeedLessonsCliArgs(["--target-root", "/tmp/seed-root"])).toEqual({
      targetRoot: "/tmp/seed-root",
    });

    const fixture = createMigratedFixture("seed-lessons-cli");
    try {
      const first = await runSeedLessonsOnRoot(fixture.tmpRoot);
      expect(first).toEqual({ inserted: 50, rewritten: 0, unchanged: 0 });

      const run = spawnSync(process.execPath, [SEED_CLI, "--target-root", fixture.tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).toContain("seeded: 0 inserted, 0 content-changed, 50 unchanged");
    } finally {
      fixture.cleanup();
    }
  });

  it("resets local user data when audit_events is empty and refuses when audit_events has rows", async () => {
    expect(parseResetLocalD1CliArgs([])).toEqual({ targetRoot: process.cwd() });
    expect(parseResetLocalD1CliArgs(["--target-root", "/tmp/reset-root"])).toEqual({
      targetRoot: "/tmp/reset-root",
    });

    const fixture = createMigratedFixture("reset-local-d1-cli");
    try {
      await runSeedLessonsOnRoot(fixture.tmpRoot);

      const raw = openWritable(fixture.sqlitePath);
      try {
        raw
          .prepare(
            "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
          )
          .run(CANARY_PARENT_HASH);
        raw
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-tai', 'parent-1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
          )
          .run();
      } finally {
        raw.close();
      }

      // With 0 audit_events, resetUserData succeeds and preserves the curriculum catalogue tables.
      await runResetLocalD1OnRoot(fixture.tmpRoot);

      const checkAfterReset = openWritable(fixture.sqlitePath);
      try {
        expect(countRows(checkAfterReset, "parents", "1 = 1")).toBe(0);
        expect(countRows(checkAfterReset, "learners", "1 = 1")).toBe(0);
        expect(countRows(checkAfterReset, "lessons", "1 = 1")).toBe(0);
        expect(countRows(checkAfterReset, "subjects", "1 = 1")).toBeGreaterThan(0);
        expect(countRows(checkAfterReset, "skills", "1 = 1")).toBeGreaterThan(0);
        expect(countRows(checkAfterReset, "schema_versions", "1 = 1")).toBeGreaterThanOrEqual(13);

        // Now add an immutable audit_event row and verify reset-local-d1 refuses.
        seedHousehold(checkAfterReset);
      } finally {
        checkAfterReset.close();
      }

      const refused = spawnSync(process.execPath, [RESET_CLI, "--target-root", fixture.tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(refused.status).toBe(1);
      expect(refused.stderr).toContain("db:reprovision-household");
    } finally {
      fixture.cleanup();
    }
  });

  it("fails cleanly when the local D1 SQLite file is missing for seed-lessons or reset-local-d1", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-seed-reset-missing-"));
    try {
      const seedRun = spawnSync(process.execPath, [SEED_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(seedRun.status).toBe(1);
      expect(seedRun.stderr).toContain("local D1 SQLite database not found");

      const resetRun = spawnSync(process.execPath, [RESET_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(resetRun.status).toBe(1);
      expect(resetRun.stderr).toContain("local D1 SQLite database not found");
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

describe("reprovision-household-db CLI script (byte-for-byte archive + clean reprovision)", () => {
  it("parses --target-root and --approve-grade-lessons", () => {
    expect(parseReprovisionCliArgs([])).toEqual({
      targetRoot: process.cwd(),
      approveGradeLessons: false,
    });
    expect(
      parseReprovisionCliArgs(["--target-root", "/tmp/reprov-root", "--approve-grade-lessons"]),
    ).toEqual({
      targetRoot: "/tmp/reprov-root",
      approveGradeLessons: true,
    });
  });

  it("archives the existing SQLite file with 100% identical SHA-256 and reprovisions a clean household DB with grade approvals", async () => {
    const fixture = createMigratedFixture("reprovision-sha256");
    try {
      const raw = openWritable(fixture.sqlitePath);
      try {
        seedHousehold(raw);
        // Simulate historical E2E pollution (extra learner + organization + audit events).
        raw
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-polluted', 'parent-1', 'Minh', 2016, 4, 'Asia/Ho_Chi_Minh', 2000, 2000)",
          )
          .run();
        raw
          .prepare(
            "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES ('org-1', 'pilot-school', 'Trường Pilot', 2000, 2000)",
          )
          .run();
        raw
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-polluted', 'parent:other', 'org.created', 'org-1', NULL, 2000)",
          )
          .run();
        // Checkpoint WAL into main database file and switch to DELETE journal mode so we have a single deterministic file hash before reprovisioning.
        raw.exec("PRAGMA wal_checkpoint(TRUNCATE);");
      } finally {
        raw.close();
      }

      // Also create a leftover .wrangler/probe-iso-test directory to verify it gets archived.
      const probeIsoDir = join(fixture.tmpRoot, ".wrangler", "probe-iso-test");
      mkdirSync(probeIsoDir, { recursive: true });
      writeFileSync(join(probeIsoDir, "marker.txt"), "probe");

      const preArchiveSha256 = sha256File(fixture.sqlitePath);

      const result = await reprovisionHouseholdDatabase({
        targetRoot: fixture.tmpRoot,
        approveGradeLessons: true,
        now: FIXED_NOW,
      });

      expect(result.status).toBe("ok");
      expect(result.preservedParentDisplayName).toBe("Phụ huynh");
      expect(result.preservedLearnerNickname).toBe("Tài");
      expect(result.preservedSchoolYearLabel).toBe("2026-2027");
      expect(result.lessonsInserted).toBe(50);
      expect(result.verification.schemaVersion).toBe(14);
      expect(result.verification.lessonsCount).toBe(50);
      expect(result.verification.organizationsCount).toBe(0);
      expect(result.lessonApprovals?.ok).toBe(true);
      expect(result.lessonApprovals?.newlyApprovedCount).toBe(25);
      expect(result.lessonApprovals?.readyForLearnerSession).toBe(true);

      // Verify the archived SQLite file in backups/ has the exact same SHA-256 byte-for-byte.
      expect(result.archiveDir).toBeTruthy();
      const archivedSqlitePath = join(
        String(result.archiveDir),
        "miniflare-D1DatabaseObject",
        D1_SQLITE_FILENAME,
      );
      expect(existsSync(archivedSqlitePath)).toBe(true);
      expect(sha256File(archivedSqlitePath)).toBe(preArchiveSha256);
      expect(existsSync(join(String(result.archiveDir), "probe-iso-test", "marker.txt"))).toBe(true);
      expect(existsSync(probeIsoDir)).toBe(false);

      // Verify household:preflight passes with readyForLearnerSession: true on the reprovisioned DB.
      const ro = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const preflight = await inspectHouseholdPreflight(
          createReadOnlyD1Adapter(ro),
          { devVarsPresent: true, hasSessionSecret: true, hasParentPasswordHash: true },
          "ok",
        );
        expect(preflight.ok).toBe(true);
        expect(preflight.approvedLessonsCount).toBe(25);
        expect(preflight.readyForLearnerSession).toBe(true);
      } finally {
        ro.close();
      }
    } finally {
      fixture.cleanup();
    }
  });
});

describe("household CLI discovery helpers", () => {
  it("finds the hashed D1 SQLite file next to wrangler metadata and nothing else", () => {
    const fixture = createMigratedFixture("cli-discovery");
    try {
      const d1StateDir = join(
        fixture.tmpRoot,
        ".wrangler",
        "state",
        "v3",
        "d1",
        "miniflare-D1DatabaseObject",
      );
      const entries = readdirSync(d1StateDir).sort();
      expect(entries).toContain(D1_SQLITE_FILENAME);
      expect(entries.some((name) => name.endsWith(".json"))).toBe(false);
    } finally {
      fixture.cleanup();
    }
  });

  it("computes the exact Miniflare D1 SQLite filename and splits trigger-bearing SQL migrations deterministically", () => {
    expect(miniflareD1SqliteFilename("local-preview")).toBe(D1_SQLITE_FILENAME);
    expect(miniflareD1SqliteFilename("e2e-isolated-local-db")).toBe(
      "84891d8ddec1c08a873cfabd146a49086b29b87fb3c4ad8290151c4915fa180e.sqlite",
    );

    const v4Sql = readFileSync(join(MIGRATIONS_DIR, "0004_evidence_integrity.sql"), "utf8");
    const v4Stmts = splitSqlStatements(v4Sql);
    expect(v4Stmts.length).toBe(4);
    expect(v4Stmts[0]).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_learner_step_attempt");
    expect(v4Stmts[1]).toContain("INSERT INTO schema_versions");
    expect(v4Stmts[2]).toContain("CREATE TRIGGER IF NOT EXISTS audit_events_no_update");
    expect(v4Stmts[2]).toContain("RAISE(ABORT, 'audit_events is append-only: UPDATE is not permitted');");
    expect(v4Stmts[3]).toContain("CREATE TRIGGER IF NOT EXISTS audit_events_no_delete");

    const dropAndCaseTriggerSql = `
      DROP TRIGGER IF EXISTS old_trigger;
      CREATE TRIGGER tr_case BEFORE INSERT ON audit_events
      BEGIN
        SELECT CASE WHEN NEW.id IS NULL THEN RAISE(ABORT, 'missing;id') ELSE 1 END;
      END;
      SELECT 1;
    `;
    const edgeStmts = splitSqlStatements(dropAndCaseTriggerSql);
    expect(edgeStmts).toHaveLength(3);
    expect(edgeStmts[0]).toBe("DROP TRIGGER IF EXISTS old_trigger;");
    expect(edgeStmts[1]).toContain("SELECT CASE WHEN NEW.id IS NULL");
    expect(edgeStmts[2]).toBe("SELECT 1;");
  });
});

describe("migrate-local-d1 CLI script (DatabaseSync, read-only zero-write fast path)", () => {
  it("parses --target-root and lists all 14 shipped migration files in order", () => {
    expect(parseMigrateLocalD1CliArgs([])).toEqual({ targetRoot: process.cwd() });
    expect(parseMigrateLocalD1CliArgs(["--target-root", "/tmp/migrate-root"])).toEqual({
      targetRoot: "/tmp/migrate-root",
    });
    const files = listShippedMigrationFiles();
    expect(files).toHaveLength(14);
    expect(files[0]).toBe("0001_initial_schema.sql");
    expect(files[13]).toBe("0014_grade5_curriculum_expansion.sql");
    expect(files.every((f) => /^\d{4}_.*\.sql$/.test(f))).toBe(true);
  });

  it("provisions a fresh database with all 14 migrations and then runs as a strict zero-write no-op on subsequent invocations", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-migrate-local-d1-"));
    try {
      const first = runMigrateLocalD1OnRoot(tmpRoot);
      expect(first.ok).toBe(true);
      expect(first.applied).toEqual(MIGRATION_FILES);
      expect(first.skippedCount).toBe(0);
      expect(first.schemaVersion).toBe(14);
      expect(existsSync(first.sqlitePath)).toBe(true);

      // Checkpoint WAL and switch to DELETE journal mode so the file on disk is a single quiescent SQLite file.
      const db = new DatabaseSync(first.sqlitePath);
      try {
        db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
        db.exec("PRAGMA journal_mode = DELETE;");
      } finally {
        db.close();
      }

      const preHash = sha256File(first.sqlitePath);
      const preStat = statSync(first.sqlitePath);

      const second = runMigrateLocalD1OnRoot(tmpRoot);
      expect(second.ok).toBe(true);
      expect(second.applied).toEqual([]);
      expect(second.skippedCount).toBe(14);
      expect(second.schemaVersion).toBe(14);

      const postHash = sha256File(first.sqlitePath);
      const postStat = statSync(first.sqlitePath);
      expect(postHash).toBe(preHash);
      expect(postStat.size).toBe(preStat.size);
      expect(postStat.mtimeMs).toBe(preStat.mtimeMs);

      // Also verify CLI execution via spawnSync preserves SHA-256 and mtimeMs.
      const cliRun = spawnSync(process.execPath, [MIGRATE_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(cliRun.status).toBe(0);
      expect(cliRun.stderr).toBe("");
      const parsedCli = JSON.parse(cliRun.stdout.trim()) as {
        ok: boolean;
        applied: string[];
        skippedCount: number;
        schemaVersion: number;
      };
      expect(parsedCli.ok).toBe(true);
      expect(parsedCli.applied).toEqual([]);
      expect(parsedCli.skippedCount).toBe(14);
      expect(parsedCli.schemaVersion).toBe(14);
      expect(sha256File(first.sqlitePath)).toBe(preHash);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it("applies only pending migrations when a database has a subset of migrations recorded in d1_migrations", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-migrate-partial-"));
    try {
      const d1StateDir = join(
        tmpRoot,
        ".wrangler",
        "state",
        "v3",
        "d1",
        "miniflare-D1DatabaseObject",
      );
      mkdirSync(d1StateDir, { recursive: true });
      const sqlitePath = join(d1StateDir, D1_SQLITE_FILENAME);
      const raw = new DatabaseSync(sqlitePath);
      try {
        raw.exec("PRAGMA foreign_keys = ON;");
        raw.exec(
          `CREATE TABLE d1_migrations (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             name TEXT UNIQUE,
             applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
           );`,
        );
        const insertStmt = raw.prepare("INSERT INTO d1_migrations (name) VALUES (?)");
        for (const file of MIGRATION_FILES.slice(0, 10)) {
          raw.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
          insertStmt.run(file);
        }
      } finally {
        raw.close();
      }

      const result = runMigrateLocalD1OnRoot(tmpRoot);
      expect(result.ok).toBe(true);
      expect(result.skippedCount).toBe(10);
      expect(result.applied).toEqual(MIGRATION_FILES.slice(10));
      expect(result.schemaVersion).toBe(14);
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

describe("dump-local-d1 CLI script (DatabaseSync readOnly: true, zero-write SQL dump)", () => {
  it("parses CLI arguments and formats SQL literals deterministically", () => {
    expect(parseDumpLocalD1CliArgs([])).toEqual({
      targetRoot: process.cwd(),
      outputPath: null,
      includeSchema: true,
      includeData: true,
    });
    expect(
      parseDumpLocalD1CliArgs([
        "--target-root",
        "/tmp/dump-root",
        "--output",
        "/tmp/out.sql",
        "--no-schema",
        "--no-data",
      ]),
    ).toEqual({
      targetRoot: "/tmp/dump-root",
      outputPath: "/tmp/out.sql",
      includeSchema: false,
      includeData: false,
    });
    expect(parseDumpLocalD1CliArgs(["/tmp/positional.sql"]).outputPath).toBe(
      "/tmp/positional.sql",
    );

    expect(formatSqlLiteral(null)).toBe("NULL");
    expect(formatSqlLiteral(undefined)).toBe("NULL");
    expect(formatSqlLiteral(Number.NaN)).toBe("NULL");
    expect(formatSqlLiteral(42)).toBe("42");
    expect(formatSqlLiteral(123n)).toBe("123");
    expect(formatSqlLiteral("Tài's lesson")).toBe("'Tài''s lesson'");
    expect(formatSqlLiteral(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe("X'DEADBEEF'");
  });

  it("exports a replayable SQL dump without writing a single byte to the source SQLite file or leaking password_hash", () => {
    const fixture = createMigratedFixture("dump-readonly");
    try {
      const setup = openWritable(fixture.sqlitePath);
      try {
        seedLessons(setup);
        seedHousehold(setup);
        setup
          .prepare(
            "INSERT INTO auth_throttles (key, scope, failed_count, window_started_at, locked_until, updated_at) VALUES ('account:phu-huynh', 'account', 5, 1000, 9999999, 1000)",
          )
          .run();
        setup.exec("PRAGMA wal_checkpoint(TRUNCATE);");
        setup.exec("PRAGMA journal_mode = DELETE;");
      } finally {
        setup.close();
      }

      const preHash = sha256File(fixture.sqlitePath);
      const preStat = statSync(fixture.sqlitePath);
      const outSqlPath = join(fixture.tmpRoot, "household-dump.sql");

      const run = spawnSync(
        process.execPath,
        [DUMP_CLI, "--target-root", fixture.tmpRoot, "--output", outSqlPath],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(run.status).toBe(0);
      expect(run.stderr).toBe("");
      expect(run.stdout).not.toContain(CANARY_PARENT_HASH);
      expect(run.stdout).not.toContain("pbkdf2-sha256");

      // Source SQLite file must remain 100% untouched (SHA-256, size, mtimeMs, and no -wal/-shm sidecars).
      const postHash = sha256File(fixture.sqlitePath);
      const postStat = statSync(fixture.sqlitePath);
      expect(postHash).toBe(preHash);
      expect(postStat.size).toBe(preStat.size);
      expect(postStat.mtimeMs).toBe(preStat.mtimeMs);
      expect(existsSync(`${fixture.sqlitePath}-wal`)).toBe(false);
      expect(existsSync(`${fixture.sqlitePath}-shm`)).toBe(false);

      const sqlText = readFileSync(outSqlPath, "utf8");
      expect(sqlText).not.toContain(CANARY_PARENT_HASH);
      expect(sqlText).not.toContain("pbkdf2-sha256");
      expect(sqlText).not.toContain("account:phu-huynh");
      expect(sqlText).not.toContain('INSERT INTO "parents"');
      expect(sqlText).not.toContain('INSERT INTO "auth_throttles"');
      expect(sqlText).not.toContain('INSERT INTO "d1_migrations"');
      expect(sqlText).toContain('CREATE TABLE parents');
      expect(sqlText).toContain('INSERT INTO "learners"');
      expect(sqlText).toContain('INSERT INTO "lessons"');

      // Replay the SQL dump into a fresh in-memory SQLite database and verify row counts and triggers.
      const restored = new DatabaseSync(":memory:");
      try {
        restored.exec(sqlText);
        expect(countRows(restored, "parents", "1 = 1")).toBe(0);
        expect(countRows(restored, "auth_throttles", "1 = 1")).toBe(0);
        expect(countRows(restored, "learners", "id = 'learner-tai'")).toBe(1);
        expect(countRows(restored, "lessons", "1 = 1")).toBe(15);
        expect(countRows(restored, "audit_events", "1 = 1")).toBeGreaterThan(0);

        // Immutability triggers on audit_events must be restored and active.
        expect(() =>
          restored.prepare("DELETE FROM audit_events").run(),
        ).toThrow(/append-only/i);
      } finally {
        restored.close();
      }

      // Also verify --no-schema and --no-data flags.
      const ro = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const schemaOnly = buildReadOnlySqlDump(ro, { includeSchema: true, includeData: false });
        expect(schemaOnly).toContain("CREATE TABLE learners");
        expect(schemaOnly).not.toContain('INSERT INTO "learners"');

        const dataOnly = buildReadOnlySqlDump(ro, { includeSchema: false, includeData: true });
        expect(dataOnly).not.toContain("CREATE TABLE learners");
        expect(dataOnly).toContain('INSERT INTO "learners"');
      } finally {
        ro.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  it("fails cleanly when the local D1 SQLite file is missing", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-dump-missing-"));
    try {
      expect(() => runDumpLocalD1OnRoot({ targetRoot: tmpRoot })).toThrow(
        /local D1 SQLite database not found/i,
      );
      const run = spawnSync(process.execPath, [DUMP_CLI, "--target-root", tmpRoot], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("local D1 SQLite database not found");
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});


