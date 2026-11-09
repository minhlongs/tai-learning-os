/**
 * Strictly read-only CLI export of the local learner record (`npm run export:learner`).
 *
 * Opens the local D1 SQLite database directly via `node:sqlite`
 * `DatabaseSync(..., { readOnly: true })` wrapped in `createReadOnlyD1Adapter`,
 * then invokes `buildLearnerExportEnvelope` from `src/worker/routes/data.ts`
 * so the CLI export and `/api/data/export` produce the identical
 * `tai-learning-os-export@v1` envelope. A CLI backup writes nothing to the
 * database: the learner file is left byte-identical and no row is appended to
 * the append-only `audit_events` ledger.
 *
 * Optional encryption: if `--passphrase <secret>` or `BACKUP_PASSPHRASE` env var is
 * provided (minimum 8 chars), the envelope is encrypted with Web Crypto AES-256-GCM
 * (PBKDF2-SHA256, 600,000 iterations) via `encryptBackupEnvelope`.
 *
 * Usage:
 *   npm run export:learner
 *   npm run export:learner -- ./backup-tai.json
 *   npm run export:learner -- ./backup-tai.enc.json --passphrase "<secret>"
 *   npm run export:learner -- ./backup-tai.json --target-root <dir>
 *     (read <dir>/.wrangler/state/v3/d1/miniflare-D1DatabaseObject instead of the current working directory)
 */
import { existsSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createReadOnlyD1Adapter } from "./household-preflight.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { buildLearnerExportEnvelope } = await import("../src/worker/routes/data.ts");
const { encryptBackupEnvelope } = await import("../src/shared/crypto/backup-cipher.ts");

export function parseExportCliArgs(argv) {
  let targetPath = null;
  let passphrase = process.env.BACKUP_PASSPHRASE ?? null;
  let targetRoot = process.cwd();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--passphrase") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --passphrase");
      }
      passphrase = next;
      i += 1;
    } else if (arg === "--target-root") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --target-root");
      }
      targetRoot = resolve(next);
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag for export:learner: ${arg}`);
    } else if (!targetPath) {
      targetPath = arg;
    } else {
      throw new Error(`Unexpected positional argument for export:learner: ${arg}`);
    }
  }
  return { targetPath, passphrase, targetRoot };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let parsedArgs;
  try {
    parsedArgs = parseExportCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`export refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  const { targetPath, passphrase, targetRoot } = parsedArgs;
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
    console.error(
      `export refused: local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
    process.exit(1);
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true });
  try {
    const db = createReadOnlyD1Adapter(rawDb);
    const parentRow = await db
      .prepare(
        `SELECT p.id, p.display_name
         FROM parents p
         LEFT JOIN learners l ON l.parent_id = p.id
         ORDER BY (l.id IS NOT NULL) DESC, p.created_at ASC
         LIMIT 1`,
      )
      .first();

    if (!parentRow) {
      console.error("export refused: no parent account found in local D1.");
      process.exit(1);
    }

    const built = await buildLearnerExportEnvelope(db, String(parentRow.id));
    if (!built.ok) {
      const errBody = await built.response.json();
      console.error(`export refused (${built.status}): ${JSON.stringify(errBody)}`);
      process.exit(1);
    }

    const payload = built.envelope;
    const outputObj =
      typeof passphrase === "string" && passphrase.trim().length > 0
        ? await encryptBackupEnvelope(payload, passphrase.trim())
        : payload;

    const formatted = `${JSON.stringify(outputObj, null, 2)}\n`;
    if (targetPath) {
      writeFileSync(targetPath, formatted, "utf8");
      console.log(
        `exported ${outputObj.format === "tai-encrypted-backup-v1" ? "encrypted " : ""}learner record to ${targetPath}`,
      );
    } else {
      process.stdout.write(formatted);
    }
  } catch (error) {
    console.error(`export failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rawDb.close();
  }
}
