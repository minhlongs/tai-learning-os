import { readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const SQL_UTC_NOW_MS_EXPR =
  "CAST(ROUND((julianday('now') - 2440587.5) * 86400000.0) AS INTEGER)";

function findSqliteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSqliteFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".sqlite")) {
      results.push(full);
    }
  }
  return results;
}

export function resolveIsolatedE2eSqlitePath(): string {
  const sysTmp = resolve(tmpdir());
  const persistPath = process.env.TLO_E2E_PERSIST_PATH
    ? resolve(process.env.TLO_E2E_PERSIST_PATH)
    : "";
  if (!persistPath || !persistPath.startsWith(sysTmp)) {
    throw new Error(
      `Refusing to open E2E SQLite file outside ${sysTmp} (received ${JSON.stringify(process.env.TLO_E2E_PERSIST_PATH)})`,
    );
  }
  const files = findSqliteFiles(persistPath);
  if (files.length === 0) {
    throw new Error(`No .sqlite file found under isolated E2E persist path: ${persistPath}`);
  }
  for (const file of files) {
    const db = new DatabaseSync(file);
    try {
      const table = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'learning_sessions'")
        .get() as { name?: string } | undefined;
      if (table?.name === "learning_sessions") {
        return file;
      }
    } finally {
      db.close();
    }
  }
  throw new Error(
    `Found ${files.length} .sqlite file(s) under ${persistPath}, but none contained learning_sessions`,
  );
}

export interface SessionDbSnapshot {
  id: string;
  status: string;
  continuationDeadline: number | null;
  databaseNowMs: number;
  isContinuationExpired: number;
  attemptCount: number;
  hintAuditCount: number;
}

export function readSessionSnapshotFromIsolatedDb(sessionId: string): SessionDbSnapshot {
  const sqlitePath = resolveIsolatedE2eSqlitePath();
  const db = new DatabaseSync(sqlitePath);
  try {
    const row = db
      .prepare(
        `SELECT id,
                status,
                continuation_deadline AS continuationDeadline,
                ${SQL_UTC_NOW_MS_EXPR} AS databaseNowMs,
                CASE
                  WHEN continuation_deadline IS NOT NULL AND ${SQL_UTC_NOW_MS_EXPR} >= continuation_deadline
                  THEN 1
                  ELSE 0
                END AS isContinuationExpired
           FROM learning_sessions
          WHERE id = ?`,
      )
      .get(sessionId) as
      | {
          id: string;
          status: string;
          continuationDeadline: number | null;
          databaseNowMs: number;
          isContinuationExpired: number;
        }
      | undefined;
    if (!row) {
      throw new Error(`Session ${sessionId} not found in isolated E2E SQLite DB`);
    }
    const attempts = db
      .prepare("SELECT COUNT(*) AS count FROM learning_attempts WHERE session_id = ?")
      .get(sessionId) as { count: number };
    const hints = db
      .prepare(
        "SELECT COUNT(*) AS count FROM audit_events WHERE action = 'hint.requested' AND detail LIKE ?",
      )
      .get(`%${sessionId}%`) as { count: number };
    return {
      ...row,
      attemptCount: Number(attempts.count),
      hintAuditCount: Number(hints.count),
    };
  } finally {
    db.close();
  }
}

export function setSessionContinuationDeadlineNearNow(
  sessionId: string,
  offsetMs: number,
): SessionDbSnapshot {
  const sqlitePath = resolveIsolatedE2eSqlitePath();
  const db = new DatabaseSync(sqlitePath);
  try {
    db.prepare(
      `UPDATE learning_sessions
          SET continuation_deadline = ${SQL_UTC_NOW_MS_EXPR} + ?
        WHERE id = ?`,
    ).run(offsetMs, sessionId);
  } finally {
    db.close();
  }
  return readSessionSnapshotFromIsolatedDb(sessionId);
}
