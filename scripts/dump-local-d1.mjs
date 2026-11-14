/**
 * Strictly read-only local D1 SQL dump runner (`npm run db:dump`).
 *
 * Replaces `wrangler d1 export tai-learning-os --local` with Node's built-in
 * `node:sqlite` (`DatabaseSync(..., { readOnly: true })`) so dumping the local
 * D1 database never invokes Wrangler's `getPlatformProxy` / Miniflare Durable
 * Object wrapper, never writes `_cf_METADATA`, and never prints Wrangler banners.
 *
 * Security & Read-Only Invariants:
 *   1. Opens the local D1 SQLite file strictly with `new DatabaseSync(sqlitePath, { readOnly: true })`,
 *      leaving `SHA-256`, `size`, and `mtimeMs` of the `.sqlite` file 100% untouched.
 *   2. Never exports rows from `parents` (which stores `password_hash`) or
 *      `auth_throttles` (login lockout records) or internal bookkeeping tables
 *      (`sqlite_*`, `_cf_*`, `d1_migrations`), preventing accidental credential
 *      hash leakage in SQL dumps.
 *   3. Produces deterministic, replayable SQL statements (`PRAGMA foreign_keys = OFF;`,
 *      `BEGIN TRANSACTION;`, `CREATE TABLE` / `INSERT INTO` / `CREATE INDEX` /
 *      `CREATE TRIGGER`, `COMMIT;`, `PRAGMA foreign_keys = ON;`).
 *
 * Usage:
 *   npm run db:dump
 *   npm run db:dump -- --output ./dump.sql
 *   node scripts/dump-local-d1.mjs [--target-root <dir>] [--output <path>] [--no-schema] [--no-data]
 */
import { existsSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const EXCLUDED_DATA_TABLES = new Set(["d1_migrations", "parents", "auth_throttles"]);

function isInternalTableName(name) {
  return (
    name.startsWith("sqlite_") ||
    name.startsWith("_cf_") ||
    name === "d1_migrations"
  );
}

function shouldSkipDataTable(name) {
  return isInternalTableName(name) || EXCLUDED_DATA_TABLES.has(name);
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

export function formatSqlLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "NULL";
    }
    return String(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Uint8Array) {
    const hex = Buffer.from(value).toString("hex").toUpperCase();
    return `X'${hex}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function parseDumpLocalD1CliArgs(argv) {
  let targetRoot = process.cwd();
  let outputPath = null;
  let includeSchema = true;
  let includeData = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target-root") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --target-root");
      }
      targetRoot = resolve(next);
      i += 1;
    } else if (arg === "--output") {
      if (outputPath) {
        throw new Error(`Tham số vị trí dư thừa cho db:dump: ${arg}`);
      }
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --output");
      }
      outputPath = resolve(next);
      i += 1;
    } else if (arg === "--no-schema") {
      includeSchema = false;
    } else if (arg === "--no-data") {
      includeData = false;
    } else if (arg.startsWith("--")) {
      throw new Error(`Tham số không hợp lệ cho db:dump: ${arg}`);
    } else if (!outputPath) {
      outputPath = resolve(arg);
    } else {
      throw new Error(`Tham số vị trí dư thừa cho db:dump: ${arg}`);
    }
  }

  return {
    targetRoot,
    outputPath,
    includeSchema,
    includeData,
  };
}

export function buildReadOnlySqlDump(rawDb, options = {}) {
  const includeSchema = options.includeSchema !== false;
  const includeData = options.includeData !== false;

  const lines = [
    "-- TAI Learning OS local D1 read-only SQL dump",
    "-- Sensitive authentication tables (parents, auth_throttles) are excluded from data export.",
    "PRAGMA foreign_keys = OFF;",
    "BEGIN TRANSACTION;",
  ];

  const tables = rawDb
    .prepare(
      `SELECT name, sql
       FROM sqlite_master
       WHERE type = 'table' AND sql IS NOT NULL
       ORDER BY name ASC`,
    )
    .all()
    .filter((row) => !isInternalTableName(String(row.name)));

  if (includeSchema) {
    for (const table of tables) {
      lines.push(`${String(table.sql).trim().replace(/;$/, "")};`);
    }
  }

  if (includeData) {
    for (const table of tables) {
      const tableName = String(table.name);
      if (shouldSkipDataTable(tableName)) {
        continue;
      }

      const quotedTable = quoteIdentifier(tableName);
      const colInfoRows = rawDb.prepare(`PRAGMA table_info(${quotedTable})`).all();
      const columns = colInfoRows.map((col) => String(col.name));
      if (columns.length === 0) {
        continue;
      }

      const pkCols = colInfoRows
        .filter((col) => Number(col.pk) > 0)
        .sort((a, b) => Number(a.pk) - Number(b.pk))
        .map((col) => quoteIdentifier(String(col.name)));
      const orderByClause =
        pkCols.length > 0 ? `ORDER BY ${pkCols.join(", ")} ASC` : "ORDER BY rowid ASC";

      const rows = rawDb.prepare(`SELECT * FROM ${quotedTable} ${orderByClause}`).all();
      if (rows.length === 0) {
        continue;
      }

      const columnList = columns.map(quoteIdentifier).join(", ");
      for (const row of rows) {
        const valuesList = columns.map((col) => formatSqlLiteral(row[col])).join(", ");
        lines.push(`INSERT INTO ${quotedTable} (${columnList}) VALUES (${valuesList});`);
      }
    }
  }

  if (includeSchema) {
    const secondaryObjects = rawDb
      .prepare(
        `SELECT type, name, tbl_name, sql
         FROM sqlite_master
         WHERE type IN ('index', 'trigger', 'view')
           AND sql IS NOT NULL
         ORDER BY
           CASE type
             WHEN 'index' THEN 1
             WHEN 'view' THEN 2
             WHEN 'trigger' THEN 3
             ELSE 4
           END ASC,
           name ASC`,
      )
      .all()
      .filter(
        (row) =>
          !isInternalTableName(String(row.name)) &&
          !isInternalTableName(String(row.tbl_name)),
      );

    for (const obj of secondaryObjects) {
      lines.push(`${String(obj.sql).trim().replace(/;$/, "")};`);
    }
  }

  lines.push("COMMIT;");
  lines.push("PRAGMA foreign_keys = ON;");
  return `${lines.join("\n")}\n`;
}

export function runDumpLocalD1OnRoot(options = {}) {
  const targetRoot = options.targetRoot ? resolve(options.targetRoot) : process.cwd();
  const outputPath = options.outputPath ? resolve(options.outputPath) : null;
  const includeSchema = options.includeSchema !== false;
  const includeData = options.includeData !== false;

  const d1StateDir = join(
    targetRoot,
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject",
  );
  const sqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (!existsSync(d1StateDir) || !sqliteFile) {
    throw new Error(
      `db:dump refused: local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
  }

  const sqlitePath = join(d1StateDir, sqliteFile);
  const roDb = new DatabaseSync(sqlitePath, { readOnly: true });
  try {
    const sqlDump = buildReadOnlySqlDump(roDb, { includeSchema, includeData });
    if (outputPath) {
      writeFileSync(outputPath, sqlDump, "utf8");
    }
    return {
      ok: true,
      sqlitePath,
      outputPath,
      sqlDump,
    };
  } finally {
    roDb.close();
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  try {
    const args = parseDumpLocalD1CliArgs(process.argv.slice(2));
    const result = runDumpLocalD1OnRoot(args);
    if (result.outputPath) {
      console.log(
        JSON.stringify({
          ok: true,
          sqlitePath: result.sqlitePath,
          outputPath: result.outputPath,
          bytesWritten: Buffer.byteLength(result.sqlDump, "utf8"),
        }),
      );
    } else {
      process.stdout.write(result.sqlDump);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
