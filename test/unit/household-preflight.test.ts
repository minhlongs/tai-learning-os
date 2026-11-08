import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { unstable_splitSqlQuery } from "wrangler";
import { matchRoute } from "../../src/client/routing";
import {
  inspectDevVarsText,
  inspectHouseholdPreflight,
} from "../../src/worker/db/household-preflight";
import { restoreHouseholdIdentity } from "../../src/worker/db/reprovision-household";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const MIGRATION_FILES = [
  "0001_initial_schema.sql",
  "0002_reference_content.sql",
  "0003_curriculum_and_trust_closure.sql",
  "0004_evidence_integrity.sql",
  "0005_organization_and_consent.sql",
  "0006_lesson_authoring_and_assignments.sql",
  "0007_learner_version_approvals_and_session_continuation.sql",
  "0008_grade4_curriculum_expansion.sql",
  "0009_version_snapshots_and_legacy_approval_hardening.sql",
  "0010_phase3_science_debate_and_school_years.sql",
  "0011_science_and_debate_parity.sql",
  "0012_family_practice_and_version_lineage.sql",
  "0013_practice_planner_and_classroom_progress.sql",
  "0014_grade5_curriculum_expansion.sql",
];

function createInMemoryMigratedD1(): { db: D1Database; raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON;");

  for (const file of MIGRATION_FILES) {
    const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const part of unstable_splitSqlQuery(sqlText)) {
      const cleaned = part.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
      if (cleaned) raw.exec(cleaned);
    }
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

function seed50CatalogueLessons(raw: DatabaseSync): void {
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
}

describe("client routing helper extraction", () => {
  it("matches all learner, parent, and fallback routes without touching window", () => {
    expect(matchRoute("/")).toEqual({ name: "learner-home" });
    expect(matchRoute("/login")).toEqual({ name: "login" });
    expect(matchRoute("/subjects/math")).toEqual({ name: "subject", subjectId: "math" });
    expect(matchRoute("/lessons/math-g4-fractions")).toEqual({
      name: "lesson",
      lessonId: "math-g4-fractions",
    });
    expect(matchRoute("/session/sess-1")).toEqual({
      name: "session-summary",
      sessionId: "sess-1",
    });
    expect(matchRoute("/parent")).toEqual({ name: "parent-dashboard" });
    expect(matchRoute("/parent/lessons")).toEqual({ name: "parent-lessons" });
    expect(matchRoute("/parent/curriculum")).toEqual({ name: "parent-curriculum" });
    expect(matchRoute("/parent/baseline")).toEqual({ name: "parent-baseline" });
    expect(matchRoute("/parent/planner")).toEqual({ name: "parent-planner" });
    expect(matchRoute("/parent/organization")).toEqual({ name: "parent-organization" });
    expect(matchRoute("/parent/data")).toEqual({ name: "parent-data" });
    expect(matchRoute("/unknown/path")).toEqual({ name: "not-found" });
  });
});

describe("Node 26 synchronous TypeScript specifier loader", () => {
  it("prefers module.registerHooks when available and falls back to module.register on older Node 22", async () => {
    const loaderMod = (await import("../../scripts/resolve-ts-specifiers.mjs")) as {
      resolve: (
        specifier: string,
        context: { parentURL?: string },
        next: (s: string, c: { parentURL?: string }) => unknown,
      ) => unknown;
      registerTsSpecifiers: (moduleApi?: {
        registerHooks?: (hooks: { resolve: unknown }) => void;
        register?: (specifier: string) => void;
      }) => "registerHooks" | "register";
    };

    const hooksCalls: unknown[] = [];
    const modePrimary = loaderMod.registerTsSpecifiers({
      registerHooks(hooks) {
        hooksCalls.push(hooks);
      },
      register() {
        throw new Error("should not call deprecated register when registerHooks is present");
      },
    });
    expect(modePrimary).toBe("registerHooks");
    expect(hooksCalls).toHaveLength(1);

    const registerCalls: string[] = [];
    const modeFallback = loaderMod.registerTsSpecifiers({
      register(specifier) {
        registerCalls.push(specifier);
      },
    });
    expect(modeFallback).toBe("register");
    expect(registerCalls).toHaveLength(1);
    expect(registerCalls[0]).toContain("resolve-ts-specifiers.mjs");
  });

  it("synchronously resolves extensionless relative .ts specifiers and delegates bare specifiers to next", async () => {
    const loaderMod = (await import("../../scripts/resolve-ts-specifiers.mjs")) as {
      resolve: (
        specifier: string,
        context: { parentURL?: string },
        next: (s: string, c: { parentURL?: string }) => { url: string; shortCircuit?: boolean },
      ) => { url: string; shortCircuit?: boolean };
    };

    const resolvedTs = loaderMod.resolve(
      "../src/client/routing",
      { parentURL: new URL("../../scripts/validate-lessons.mjs", import.meta.url).href },
      () => ({ url: "unreachable" }),
    );
    expect(resolvedTs.shortCircuit).toBe(true);
    expect(resolvedTs.url.endsWith("/src/client/routing.ts")).toBe(true);

    const delegated = loaderMod.resolve(
      "node:fs",
      { parentURL: import.meta.url },
      (specifier) => ({ url: `builtin:${specifier}` }),
    );
    expect(delegated).toEqual({ url: "builtin:node:fs" });
  });

  it("runs validate-lessons.mjs with zero DEP0205 or DeprecationWarning output on stderr", () => {
    const output = execFileSync(
      process.execPath,
      ["--throw-deprecation", join(REPO_ROOT, "scripts", "validate-lessons.mjs")],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
      },
    );
    expect(output).toContain("validate:lessons OK — 50 lessons (257 steps)");
  });
});

describe("read-only household preflight check", () => {
  it("parses .dev.vars key presence into booleans without exposing secret values", () => {
    const rawDevVars = [
      "# Local development secrets",
      "SESSION_SECRET=super-secret-value-never-print-me",
      "PARENT_PASSWORD_HASH=pbkdf2-sha256:600000$abcdef$1234567890",
    ].join("\n");

    const status = inspectDevVarsText(rawDevVars);
    expect(status).toEqual({
      devVarsPresent: true,
      hasSessionSecret: true,
      hasParentPasswordHash: true,
    });
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("super-secret-value-never-print-me");
    expect(serialized).not.toContain("pbkdf2-sha256");

    expect(inspectDevVarsText(null)).toEqual({
      devVarsPresent: false,
      hasSessionSecret: false,
      hasParentPasswordHash: false,
    });
    expect(inspectDevVarsText("SESSION_SECRET=\n# comment only\n")).toEqual({
      devVarsPresent: true,
      hasSessionSecret: false,
      hasParentPasswordHash: false,
    });
  });

  it("inspects a clean household database strictly read-only and reports approved-lesson readiness", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    seed50CatalogueLessons(raw);

    const secretHash =
      "pbkdf2-sha256:600000$00112233445566778899aabbccddeeff$deadbeefcafe0123456789abcdef0123456789abcdef0123456789abcdef0123";
    await restoreHouseholdIdentity(
      db,
      {
        parent: {
          id: "parent-household",
          password_hash: secretHash,
          display_name: "Phụ huynh",
          created_at: 1793275984978,
          updated_at: 1793275985198,
        },
        learner: {
          id: "learner-tai",
          parent_id: "parent-household",
          nickname: "Tài",
          birth_year: 2016,
          grade: 4,
          timezone: "Asia/Ho_Chi_Minh",
          created_at: 1793468880199,
          updated_at: 1793468880199,
        },
        schoolYear: {
          id: "sy-2026-2027",
          learner_id: "learner-tai",
          label: "2026-2027",
          starts_on: "2026-09-01",
          ends_on: "2027-06-30",
          grade: 4,
          created_at: 1793468888533,
        },
      },
      1793500000000,
    );

    const beforeAuditCount = Number(
      (raw.prepare("SELECT COUNT(*) AS c FROM audit_events").get() as { c: number }).c,
    );
    const beforeAttemptsCount = Number(
      (raw.prepare("SELECT COUNT(*) AS c FROM learning_attempts").get() as { c: number }).c,
    );

    const initialReport = await inspectHouseholdPreflight(db, {
      devVarsPresent: true,
      hasSessionSecret: true,
      hasParentPasswordHash: false,
    });

    const afterAuditCount = Number(
      (raw.prepare("SELECT COUNT(*) AS c FROM audit_events").get() as { c: number }).c,
    );
    const afterAttemptsCount = Number(
      (raw.prepare("SELECT COUNT(*) AS c FROM learning_attempts").get() as { c: number }).c,
    );

    expect(afterAuditCount).toBe(beforeAuditCount);
    expect(afterAttemptsCount).toBe(beforeAttemptsCount);
    expect(initialReport.ok).toBe(true);
    expect(initialReport.integrityCheck).toBe("ok");
    expect(initialReport.approvedLessonsCount).toBe(0);
    expect(initialReport.readyForLearnerSession).toBe(false);
    expect(initialReport.household).toEqual({
      hasParent: true,
      parentDisplayName: "Phụ huynh",
      hasLearner: true,
      learnerNickname: "Tài",
      learnerGrade: 4,
      schoolYearLabel: "2026-2027",
    });

    // Ensure no secret or password hash is ever present in the serialized report
    const serialized = JSON.stringify(initialReport);
    expect(serialized).not.toContain(secretHash);
    expect(serialized).not.toContain("pbkdf2-sha256");
    expect(serialized).not.toContain("password_hash");

    // Approve 2 lessons for Tài (including real session.login + lesson.approval.approved audit rows
    // and one stale version approval on a bumped lesson that must NOT be counted) and re-run preflight
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, 'session.login', ?, '{}', 1999)",
      )
      .run("audit-login-1", "parent:parent-household", "parent-household");
    raw
      .prepare(
        "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note) VALUES (?, ?, ?, 1, 'approved', ?, 2000, NULL)",
      )
      .run("ra-1", "learner-tai", "lesson-1", "parent-household");
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, 'lesson.approval.approved', 'lesson-1', '{}', 2000)",
      )
      .run("audit-approve-1", "parent:parent-household");
    raw
      .prepare(
        "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note) VALUES (?, ?, ?, 1, 'approved', ?, 2001, NULL)",
      )
      .run("ra-2", "learner-tai", "lesson-2", "parent-household");
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, ?, 'lesson.approval.approved', 'lesson-2', '{}', 2001)",
      )
      .run("audit-approve-2", "parent:parent-household");
    // Bump lesson-3 to version 2 while keeping a stale version-1 approval
    raw.prepare("UPDATE lessons SET version = 2 WHERE id = 'lesson-3'").run();
    raw
      .prepare(
        "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note) VALUES (?, ?, ?, 1, 'approved', ?, 2002, NULL)",
      )
      .run("ra-stale-v1", "learner-tai", "lesson-3", "parent-household");

    const readyReport = await inspectHouseholdPreflight(db, {
      devVarsPresent: true,
      hasSessionSecret: true,
      hasParentPasswordHash: false,
    });
    expect(readyReport.approvedLessonsCount).toBe(2);
    expect(readyReport.readyForLearnerSession).toBe(true);
    expect(readyReport.database.auditEventsCount).toBe(5);

    // Foreign/simulated actor in audit_events must be rejected
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (?, 'learner:foreign-pilot-learner', 'session.started', 'sess-foreign', '{}', 3000)",
      )
      .run("audit-foreign-1");
    await expect(
      inspectHouseholdPreflight(db, {
        devVarsPresent: true,
        hasSessionSecret: true,
        hasParentPasswordHash: false,
      }),
    ).rejects.toThrow(/foreign actor values in audit_events/i);
  });

  it("marks integrity as skipped rather than failing when D1 refuses PRAGMA integrity_check", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    seed50CatalogueLessons(raw);
    await restoreHouseholdIdentity(
      db,
      {
        parent: {
          id: "parent-household",
          password_hash: "pbkdf2-sha256:600000$abc$def",
          display_name: "Phụ huynh",
          created_at: 1793275984978,
          updated_at: 1793275985198,
        },
        learner: {
          id: "learner-tai",
          parent_id: "parent-household",
          nickname: "Tài",
          birth_year: 2016,
          grade: 4,
          timezone: "Asia/Ho_Chi_Minh",
          created_at: 1793468880199,
          updated_at: 1793468880199,
        },
        schoolYear: null,
      },
      1793500000000,
    );

    const dbWithAuthFailingPragma = {
      prepare(sql: string) {
        if (/PRAGMA integrity_check/i.test(sql)) {
          return {
            async first() {
              throw new Error("D1_ERROR: not authorized: SQLITE_AUTH");
            },
          } as unknown as D1PreparedStatement;
        }
        return db.prepare(sql);
      },
      batch: db.batch.bind(db),
      exec: db.exec.bind(db),
      dump: db.dump.bind(db),
      withSession: db.withSession.bind(db),
    } as unknown as D1Database;

    // The household report must be unaffected by the pragma failure.
    const report = await inspectHouseholdPreflight(dbWithAuthFailingPragma, {
      devVarsPresent: true,
      hasSessionSecret: true,
      hasParentPasswordHash: true,
    });
    expect(report.integrityCheck).toContain("skipped");
    expect(report.household.hasParent).toBe(true);
    expect(report.household.learnerNickname).toBe("Tài");
    expect(report.approvedLessonsCount).toBe(0);
  });

  it("reports ok=false and actionable Vietnamese guidance when .dev.vars or household identity is missing", async () => {
    const { db, raw } = createInMemoryMigratedD1();
    seed50CatalogueLessons(raw);

    const missingSecretReport = await inspectHouseholdPreflight(db, {
      devVarsPresent: false,
      hasSessionSecret: false,
      hasParentPasswordHash: false,
    });
    expect(missingSecretReport.ok).toBe(false);
    expect(missingSecretReport.readyForLearnerSession).toBe(false);
    expect(missingSecretReport.nextActionVi).toContain("SESSION_SECRET");

    const missingHouseholdReport = await inspectHouseholdPreflight(db, {
      devVarsPresent: true,
      hasSessionSecret: true,
      hasParentPasswordHash: true,
    });
    expect(missingHouseholdReport.ok).toBe(false);
    expect(missingHouseholdReport.household.hasParent).toBe(false);
    expect(missingHouseholdReport.household.hasLearner).toBe(false);
    expect(missingHouseholdReport.nextActionVi).toContain("/login");
  });
});

function createDiskMigratedSqliteFixture(): {
  tmpRoot: string;
  d1StateDir: string;
  sqlitePath: string;
  cleanup: () => void;
} {
  const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-preflight-fixture-"));
  const d1StateDir = join(tmpRoot, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
  mkdirSync(d1StateDir, { recursive: true });
  const sqlitePath = join(
    d1StateDir,
    "55cf0b3020dae37b568062fe28961bd8d3fcd41f9b33fe8ddfdc3540875f734a.sqlite",
  );

  const raw = new DatabaseSync(sqlitePath);
  try {
    raw.exec("PRAGMA foreign_keys = ON;");
    // Match Miniflare's real D1 persistence shape: a WAL-mode database whose
    // `-wal`/`-shm` sidecars are present alongside the main file.
    raw.exec("PRAGMA journal_mode = WAL;");
    for (const file of MIGRATION_FILES) {
      const sqlText = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      for (const part of unstable_splitSqlQuery(sqlText)) {
        const cleaned = part.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
        if (cleaned) raw.exec(cleaned);
      }
    }
    seed50CatalogueLessons(raw);
  } finally {
    // Leave the `-wal`/`-shm` sidecars on disk, as a live household database does.
    raw.close();
  }

  return {
    tmpRoot,
    d1StateDir,
    sqlitePath,
    cleanup() {
      rmSync(tmpRoot, { recursive: true, force: true });
    },
  };
}

function snapshotSqliteFileState(d1StateDir: string, sqlitePath: string) {
  const stat = statSync(sqlitePath);
  const sha256 = createHash("sha256").update(readFileSync(sqlitePath)).digest("hex");
  const dirEntries = readdirSync(d1StateDir).sort();
  return {
    sha256,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    dirEntries,
  };
}

/**
 * Assert the invariant the read-only CLI actually guarantees: the primary
 * database file is left byte-identical (`SHA-256`, `size`, `mtimeMs`).
 *
 * Sidecar files (`-wal`/`-shm`) are deliberately excluded: opening a WAL-mode
 * database read-only maps the shared-memory index, which refreshes the `-shm`
 * file's `mtime` without touching the database contents. Miniflare's local D1
 * state is WAL-mode, so the production fixture ships those sidecars.
 */
function expectSqliteFileUnchanged(
  before: ReturnType<typeof snapshotSqliteFileState>,
  after: ReturnType<typeof snapshotSqliteFileState>,
): void {
  expect({ sha256: after.sha256, size: after.size, mtimeMs: after.mtimeMs }).toEqual({
    sha256: before.sha256,
    size: before.size,
    mtimeMs: before.mtimeMs,
  });
}

describe("household-preflight CLI & read-only D1 adapter", () => {
  const CLI_SCRIPT = join(REPO_ROOT, "scripts", "household-preflight.mjs");
  const CANARY_SESSION_SECRET = "canary-session-secret-99887766554433221100";
  const CANARY_ENV_HASH = "pbkdf2-sha256:600000$envsalt9988$envdigest77665544";
  const CANARY_DB_HASH =
    "pbkdf2-sha256:600000$dbsalt001122334455$dbdigestdeadbeefcafe0123456789";

  it("evaluates fresh, provisioned, approved, missing-config, and foreign-polluted fixtures with pure JSON stdout and zero secret leaks", () => {
    const fixture = createDiskMigratedSqliteFixture();
    try {
      // 1. Missing .dev.vars -> ok: false, exit code 1, pure JSON, no sidecars
      const missingDevVarsRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(missingDevVarsRun.status).toBe(1);
      expect(missingDevVarsRun.stderr).toBe("");
      const missingDevVarsJson = JSON.parse(missingDevVarsRun.stdout) as {
        ok: boolean;
        devVars: { devVarsPresent: boolean; hasSessionSecret: boolean };
        nextActionVi: string;
      };
      expect(missingDevVarsJson.ok).toBe(false);
      expect(missingDevVarsJson.devVars.devVarsPresent).toBe(false);
      expect(missingDevVarsJson.nextActionVi).toContain("SESSION_SECRET");

      // 2. Write .dev.vars with canary secrets; fresh household (0 parents, 0 learners) -> ok: false, exit code 1
      writeFileSync(
        join(fixture.tmpRoot, ".dev.vars"),
        `SESSION_SECRET=${CANARY_SESSION_SECRET}\nPARENT_PASSWORD_HASH=${CANARY_ENV_HASH}\n`,
      );
      const freshHouseholdRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(freshHouseholdRun.status).toBe(1);
      expect(freshHouseholdRun.stderr).toBe("");
      const freshJson = JSON.parse(freshHouseholdRun.stdout) as {
        ok: boolean;
        household: { hasParent: boolean; hasLearner: boolean };
        nextActionVi: string;
      };
      expect(freshJson.ok).toBe(false);
      expect(freshJson.household.hasParent).toBe(false);
      expect(freshJson.household.hasLearner).toBe(false);
      expect(freshJson.nextActionVi).toContain("/login");

      // 3. Provision household identity + 2 approved lessons (and 1 stale approval)
      const setupDb = new DatabaseSync(fixture.sqlitePath);
      try {
        setupDb
          .prepare(
            "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
          )
          .run(CANARY_DB_HASH);
        setupDb
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-tai', 'parent-1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
          )
          .run();
        setupDb
          .prepare(
            "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES ('sy-2026', 'learner-tai', '2026-2027', '2026-09-01', '2027-06-30', 4, 1000)",
          )
          .run();
        setupDb
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-1', 'parent:parent-1', 'parent.created', 'parent-1', NULL, 1000), ('au-2', 'parent:parent-1', 'learner.enrolled', 'learner-tai', NULL, 1000)",
          )
          .run();
        setupDb
          .prepare(
            "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at) VALUES ('ra-1', 'learner-tai', 'lesson-1', 1, 'approved', 'parent-1', 1001), ('ra-2', 'learner-tai', 'lesson-2', 1, 'approved', 'parent-1', 1002)",
          )
          .run();
        setupDb.prepare("UPDATE lessons SET version = 2 WHERE id = 'lesson-3'").run();
        setupDb
          .prepare(
            "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at) VALUES ('ra-stale', 'learner-tai', 'lesson-3', 1, 'approved', 'parent-1', 1003)",
          )
          .run();
      } finally {
        setupDb.close();
      }

      const provisionedRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(provisionedRun.status).toBe(0);
      expect(provisionedRun.stderr).toBe("");
      expect(provisionedRun.stdout.trim().startsWith("{")).toBe(true);
      expect(provisionedRun.stdout).not.toContain("Using secrets defined in");
      expect(provisionedRun.stdout).not.toContain(CANARY_SESSION_SECRET);
      expect(provisionedRun.stdout).not.toContain(CANARY_ENV_HASH);
      expect(provisionedRun.stdout).not.toContain(CANARY_DB_HASH);
      expect(provisionedRun.stdout).not.toContain("pbkdf2-sha256");

      const provisionedJson = JSON.parse(provisionedRun.stdout) as {
        ok: boolean;
        integrityCheck: string;
        approvedLessonsCount: number;
        readyForLearnerSession: boolean;
        household: { learnerNickname: string; schoolYearLabel: string };
      };
      expect(provisionedJson.ok).toBe(true);
      expect(provisionedJson.integrityCheck).toBe("ok");
      expect(provisionedJson.approvedLessonsCount).toBe(2);
      expect(provisionedJson.readyForLearnerSession).toBe(true);
      expect(provisionedJson.household.learnerNickname).toBe("Tài");
      expect(provisionedJson.household.schoolYearLabel).toBe("2026-2027");
    } finally {
      fixture.cleanup();
    }
  });

  it("preserves exact WAL-mode SQLite SHA-256, size, and mtimeMs across success and error paths while a real write alters SHA-256", () => {
    const fixture = createDiskMigratedSqliteFixture();
    try {
      writeFileSync(
        join(fixture.tmpRoot, ".dev.vars"),
        `SESSION_SECRET=${CANARY_SESSION_SECRET}\nPARENT_PASSWORD_HASH=${CANARY_ENV_HASH}\n`,
      );
      const setupDb = new DatabaseSync(fixture.sqlitePath);
      try {
        setupDb
          .prepare(
            "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
          )
          .run(CANARY_DB_HASH);
        setupDb
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-tai', 'parent-1', 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
          )
          .run();
        setupDb
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-1', 'parent:parent-1', 'parent.created', 'parent-1', NULL, 1000), ('au-2', 'parent:parent-1', 'learner.enrolled', 'learner-tai', NULL, 1000)",
          )
          .run();
      } finally {
        setupDb.close();
      }

      const beforeSuccess = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);

      const okRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(okRun.status).toBe(0);

      const afterSuccess = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectSqliteFileUnchanged(beforeSuccess, afterSuccess);

      // Positive control: a real write alters the primary .sqlite SHA-256 on close,
      // and the subsequent failing preflight run leaves that new SHA-256 unchanged.
      const polluteDb = new DatabaseSync(fixture.sqlitePath);
      try {
        polluteDb
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-foreign', 'learner:foreign-pilot', 'session.started', 's1', '{}', 2000)",
          )
          .run();
      } finally {
        polluteDb.close();
      }

      const beforeFailure = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expect(beforeFailure.sha256).not.toBe(beforeSuccess.sha256);

      const failRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(failRun.status).not.toBe(0);
      expect(failRun.stderr).not.toContain(CANARY_SESSION_SECRET);
      expect(failRun.stderr).not.toContain(CANARY_DB_HASH);

      const afterFailure = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectSqliteFileUnchanged(beforeFailure, afterFailure);
    } finally {
      fixture.cleanup();
    }
  });

  it("blocks all write/session methods on createReadOnlyD1Adapter, enforces SQLITE_READONLY on mutating SQL/PRAGMAs, and handles ?1/?2 parameters, empty sets, and NULL columns", async () => {
    const { createReadOnlyD1Adapter } = (await import("../../scripts/household-preflight.mjs")) as {
      createReadOnlyD1Adapter: (rawDb: DatabaseSync) => D1Database;
    };

    const fixture = createDiskMigratedSqliteFixture();
    try {
      const beforeState = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      const rawDb = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const adapter = createReadOnlyD1Adapter(rawDb);

        // 1. All write / raw / session methods on the adapter throw immediately
        await expect(adapter.prepare("SELECT 1").run()).rejects.toThrow(
          /forbids run\(\) and all write\/session operations/i,
        );
        await expect(adapter.prepare("SELECT 1").raw()).rejects.toThrow(
          /forbids raw\(\) and all write\/session operations/i,
        );
        await expect(adapter.batch([])).rejects.toThrow(
          /forbids batch\(\) and all write\/session operations/i,
        );
        await expect(adapter.exec("SELECT 1")).rejects.toThrow(
          /forbids exec\(\) and all write\/session operations/i,
        );
        await expect(adapter.dump()).rejects.toThrow(
          /forbids dump\(\) and all write\/session operations/i,
        );
        expect(() => adapter.withSession()).toThrow(
          /forbids withSession\(\) and all write\/session operations/i,
        );

        // 2. Even if someone calls .first() or .all() with mutating SQL or write PRAGMA, SQLite readOnly mode rejects it
        await expect(
          adapter
            .prepare(
              "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('x', 'y', 'z', 1, 1) RETURNING id",
            )
            .first(),
        ).rejects.toThrow(/readonly/i);
        await expect(adapter.prepare("PRAGMA user_version = 123").first()).rejects.toThrow(
          /readonly/i,
        );

        // 3. Positional parameters ?1, ?2, empty results, and NULL column handling
        const boundRow = await adapter
          .prepare("SELECT id, skill_id, grade_from FROM lessons WHERE id = ?1 AND grade_from = ?2")
          .bind("lesson-1", 4)
          .first<{ id: string; skill_id: string | null; grade_from: number }>();
        expect(boundRow).toEqual({
          id: "lesson-1",
          skill_id: null,
          grade_from: 4,
        });

        const nullColValue = await adapter
          .prepare("SELECT skill_id FROM lessons WHERE id = ?1")
          .bind("lesson-1")
          .first<string>("skill_id");
        expect(nullColValue).toBeNull();

        const namedColValue = await adapter
          .prepare("SELECT title_vi FROM lessons WHERE id = ?1")
          .bind("lesson-1")
          .first<string>("title_vi");
        expect(namedColValue).toBe("Bài 1");

        const emptyFirst = await adapter
          .prepare("SELECT id FROM lessons WHERE id = ?1")
          .bind("non-existent-lesson")
          .first();
        expect(emptyFirst).toBeNull();

        const emptyAll = await adapter
          .prepare("SELECT id FROM lessons WHERE id = ?1")
          .bind("non-existent-lesson")
          .all();
        expect(emptyAll.results).toEqual([]);
        expect(emptyAll.success).toBe(true);
      } finally {
        rawDb.close();
      }

      const afterState = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectSqliteFileUnchanged(beforeState, afterState);
    } finally {
      fixture.cleanup();
    }
  });
});

