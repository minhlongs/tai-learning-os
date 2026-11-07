import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
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
