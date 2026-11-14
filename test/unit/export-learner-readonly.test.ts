import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { listShippedMigrationFiles } from "../../scripts/migrate-local-d1.mjs";
import type { ExportResponse } from "../../src/shared/api-contract";
import {
  decryptBackupEnvelope,
  isEncryptedBackupEnvelope,
} from "../../src/shared/crypto/backup-cipher";
import { TRANSFER_FORMAT_VERSION } from "../../src/shared/schemas/transfer";
import { buildLearnerExportEnvelope } from "../../src/worker/routes/data";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");
const CLI_SCRIPT = join(REPO_ROOT, "scripts", "export-learner.mjs");

const MIGRATION_FILES = listShippedMigrationFiles();

function createDiskMigratedSqliteFixture(): {
  tmpRoot: string;
  d1StateDir: string;
  sqlitePath: string;
  cleanup: () => void;
} {
  const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-export-readonly-fixture-"));
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
      raw.exec(sqlText);
    }
    raw
      .prepare(
        "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES ('lesson-1', 'math', NULL, 'Bài 1', 'Lesson 1', 'Mục tiêu 1', 'Objective 1', 4, 4, 1, 1000, 1000)",
      )
      .run();
    raw
      .prepare(
        "INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at) VALUES ('lesson-1', 1, 'Bài 1', 'Lesson 1', 'Mục tiêu 1', 'Objective 1', 1000)",
      )
      .run();
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
 * Assert the invariant the read-only CLI actually guarantees: the learner
 * database file is left byte-identical (`SHA-256`, `size`, `mtimeMs`) and the
 * `audit_events` ledger is unchanged.
 *
 * Sidecar files (`-wal`/`-shm`) are deliberately excluded: opening a WAL-mode
 * database read-only maps the shared-memory index, which refreshes the `-shm`
 * file's `mtime` without touching the database contents. Miniflare's local D1
 * state is WAL-mode, so the production fixture ships those sidecars.
 */
function expectLearnerDatabaseUnchanged(
  before: ReturnType<typeof snapshotSqliteFileState>,
  after: ReturnType<typeof snapshotSqliteFileState>,
): void {
  expect({ sha256: after.sha256, size: after.size, mtimeMs: after.mtimeMs }).toEqual({
    sha256: before.sha256,
    size: before.size,
    mtimeMs: before.mtimeMs,
  });
}

function seedHouseholdParentAndLearner(sqlitePath: string, canaryHash: string): void {
  const raw = new DatabaseSync(sqlitePath);
  try {
    raw
      .prepare(
        "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
      )
      .run(canaryHash);
    raw
      .prepare(
        "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-mau', 'parent-1', 'Bé Mẫu', 2017, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
      )
      .run();
    raw
      .prepare(
        "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES ('sy-2026', 'learner-mau', '2026-2027', '2026-09-01', '2027-06-30', 4, 1000)",
      )
      .run();
    raw
      .prepare(
        "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-1', 'parent:parent-1', 'learner.created', 'learner-mau', NULL, 1000), ('au-2', 'learner:learner-mau', 'session.started', 'sess-1', NULL, 1001)",
      )
      .run();
    raw
      .prepare(
        "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at) VALUES ('ra-1', 'learner-mau', 'lesson-1', 1, 'approved', 'parent-1', 1001)",
      )
      .run();
  } finally {
    raw.close();
  }
}

describe("read-only learner export helper and CLI (scripts/export-learner.mjs)", () => {
  const CANARY_DB_HASH =
    "pbkdf2-sha256:600000$dbsalt001122334455$dbdigestdeadbeefcafe0123456789";

  it("buildLearnerExportEnvelope operates over createReadOnlyD1Adapter without writing audit_events", async () => {
    const { createReadOnlyD1Adapter } = (await import("../../scripts/household-preflight.mjs")) as {
      createReadOnlyD1Adapter: (rawDb: DatabaseSync) => D1Database;
    };

    const fixture = createDiskMigratedSqliteFixture();
    try {
      seedHouseholdParentAndLearner(fixture.sqlitePath, CANARY_DB_HASH);
      const beforeSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);

      const rawDb = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const db = createReadOnlyD1Adapter(rawDb);
        const result = await buildLearnerExportEnvelope(db, "parent-1");
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("expected ok export envelope");
        expect(result.learnerId).toBe("learner-mau");
        expect(result.envelope.formatVersion).toBe(TRANSFER_FORMAT_VERSION);
        expect(result.envelope.source).toBe("manual_export");
        expect(result.envelope.data.learners).toHaveLength(1);
        expect(result.envelope.data.learners[0]?.nickname).toBe("Bé Mẫu");
        expect(result.envelope.data.auditEvents).toHaveLength(2);
        expect(
          result.envelope.data.auditEvents.some((ev) => ev.action === "data.exported"),
        ).toBe(false);

        const missingLearner = await buildLearnerExportEnvelope(db, "parent-1", "non-existent");
        expect(missingLearner.ok).toBe(false);
        if (!missingLearner.ok) {
          expect(missingLearner.status).toBe(404);
        }
      } finally {
        rawDb.close();
      }

      const afterSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectLearnerDatabaseUnchanged(beforeSnapshot, afterSnapshot);
    } finally {
      fixture.cleanup();
    }
  });

  it("exports plain JSON to stdout and file and AES-256-GCM ciphertext while preserving exact SQLite SHA-256, size, mtimeMs, and audit_events count", async () => {
    const fixture = createDiskMigratedSqliteFixture();
    try {
      seedHouseholdParentAndLearner(fixture.sqlitePath, CANARY_DB_HASH);
      const beforeSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);

      // 1. Plain JSON to stdout
      const stdoutRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(stdoutRun.status).toBe(0);
      expect(stdoutRun.stderr).toBe("");
      expect(stdoutRun.stdout.trim().startsWith("{")).toBe(true);
      expect(stdoutRun.stdout).not.toContain("Using secrets defined in");
      expect(stdoutRun.stdout).not.toContain(CANARY_DB_HASH);

      const stdoutEnvelope = JSON.parse(stdoutRun.stdout) as ExportResponse;
      expect(stdoutEnvelope.formatVersion).toBe(TRANSFER_FORMAT_VERSION);
      expect(stdoutEnvelope.data.learners[0]?.nickname).toBe("Bé Mẫu");
      expect(stdoutEnvelope.data.auditEvents).toHaveLength(2);

      const afterStdoutSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectLearnerDatabaseUnchanged(beforeSnapshot, afterStdoutSnapshot);

      // 2. Plain JSON to file + Encrypted AES-256-GCM export to file
      const plainBackupPath = join(fixture.tmpRoot, "backup-mau.json");
      const encBackupPath = join(fixture.tmpRoot, "backup-mau.enc.json");
      const passphrase = "mat-khau-sao-luu-kiem-dinh";

      const fileRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, plainBackupPath, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(fileRun.status).toBe(0);
      expect(fileRun.stderr).toBe("");

      const encRun = spawnSync(
        process.execPath,
        [
          CLI_SCRIPT,
          encBackupPath,
          "--passphrase",
          passphrase,
          "--target-root",
          fixture.tmpRoot,
        ],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(encRun.status).toBe(0);
      expect(encRun.stderr).toBe("");

      const encRaw = JSON.parse(readFileSync(encBackupPath, "utf8")) as unknown;
      expect(isEncryptedBackupEnvelope(encRaw)).toBe(true);
      if (!isEncryptedBackupEnvelope(encRaw)) {
        throw new Error("expected encrypted backup envelope");
      }
      const decryptedResult = await decryptBackupEnvelope(encRaw, passphrase);
      expect(decryptedResult.ok).toBe(true);
      if (!decryptedResult.ok) {
        throw new Error(`decrypt failed: ${decryptedResult.errors.join(", ")}`);
      }
      expect(decryptedResult.envelope.formatVersion).toBe(TRANSFER_FORMAT_VERSION);
      expect(decryptedResult.envelope.data.learners[0]?.id).toBe("learner-mau");
      expect(decryptedResult.envelope.data.auditEvents).toHaveLength(2);

      const afterAllRunsSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectLearnerDatabaseUnchanged(beforeSnapshot, afterAllRunsSnapshot);
    } finally {
      fixture.cleanup();
    }
  });

  it("refuses export on an empty database without mutating the learner database file or the audit ledger", () => {
    const fixture = createDiskMigratedSqliteFixture();
    try {
      const beforeSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);

      const emptyRun = spawnSync(
        process.execPath,
        [CLI_SCRIPT, "--target-root", fixture.tmpRoot],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(emptyRun.status).toBe(1);
      expect(emptyRun.stderr).toContain("no parent account found in local D1");

      const afterSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectLearnerDatabaseUnchanged(beforeSnapshot, afterSnapshot);
    } finally {
      fixture.cleanup();
    }
  });

  it("forbids every write and session method on the D1 adapter it opens and rejects mutating SQL from the read-only handle", async () => {
    const fixture = createDiskMigratedSqliteFixture();
    try {
      seedHouseholdParentAndLearner(fixture.sqlitePath, CANARY_DB_HASH);
      const beforeSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);

      const rawDb = new DatabaseSync(fixture.sqlitePath, { readOnly: true });
      try {
        const { createReadOnlyD1Adapter } = (await import("../../scripts/household-preflight.mjs")) as {
          createReadOnlyD1Adapter: (rawDb: DatabaseSync) => D1Database;
        };
        const db = createReadOnlyD1Adapter(rawDb);

        await expect(db.prepare("SELECT 1").run()).rejects.toThrow(
          /forbids run\(\) and all write\/session operations/i,
        );
        await expect(db.prepare("SELECT 1").raw()).rejects.toThrow(
          /forbids raw\(\) and all write\/session operations/i,
        );
        await expect(db.batch([])).rejects.toThrow(
          /forbids batch\(\) and all write\/session operations/i,
        );
        await expect(db.exec("SELECT 1")).rejects.toThrow(
          /forbids exec\(\) and all write\/session operations/i,
        );
        await expect(db.dump()).rejects.toThrow(
          /forbids dump\(\) and all write\/session operations/i,
        );
        expect(() => db.withSession()).toThrow(
          /forbids withSession\(\) and all write\/session operations/i,
        );

        // Even bypassing the adapter guard cannot write: the SQLite handle is read-only.
        await expect(
          db
            .prepare(
              "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('x', 'parent:parent-1', 'data.exported', NULL, NULL, 1) RETURNING id",
            )
            .first(),
        ).rejects.toThrow(/readonly/i);
        await expect(db.prepare("PRAGMA user_version = 123").first()).rejects.toThrow(/readonly/i);
      } finally {
        rawDb.close();
      }

      const afterSnapshot = snapshotSqliteFileState(fixture.d1StateDir, fixture.sqlitePath);
      expectLearnerDatabaseUnchanged(beforeSnapshot, afterSnapshot);
    } finally {
      fixture.cleanup();
    }
  });

  it("parses the CLI output path, passphrase, and target-root arguments in any order", async () => {
    const { parseExportCliArgs } = (await import("../../scripts/export-learner.mjs")) as {
      parseExportCliArgs: (argv: string[]) => {
        targetPath: string | null;
        passphrase: string | null;
        targetRoot: string;
      };
    };

    expect(parseExportCliArgs([])).toEqual({
      targetPath: null,
      passphrase: null,
      targetRoot: process.cwd(),
    });
    expect(
      parseExportCliArgs(["./backup.json", "--passphrase", "mat-khau-sao-luu"]),
    ).toMatchObject({ targetPath: "./backup.json", passphrase: "mat-khau-sao-luu" });
    expect(
      parseExportCliArgs(["--target-root", "/tmp/other-root", "./backup.json"]),
    ).toMatchObject({ targetPath: "./backup.json", targetRoot: "/tmp/other-root" });
    // Unknown flags, missing flag values, and extra positional arguments fail closed.
    expect(() => parseExportCliArgs(["./a.json", "--unknown"])).toThrow(
      /Unknown flag for export:learner: --unknown/,
    );
    expect(() => parseExportCliArgs(["./a.json", "./b.json"])).toThrow(
      /Unexpected positional argument for export:learner: \.\/b\.json/,
    );
    expect(() => parseExportCliArgs(["--passphrase"])).toThrow(
      /Missing or invalid value for --passphrase/,
    );
    expect(() => parseExportCliArgs(["--passphrase", "--target-root"])).toThrow(
      /Missing or invalid value for --passphrase/,
    );
    expect(() => parseExportCliArgs(["--target-root"])).toThrow(
      /Missing or invalid value for --target-root/,
    );
  });
});
