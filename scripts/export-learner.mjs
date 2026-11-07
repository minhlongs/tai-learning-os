/**
 * Exports the local learner record to a JSON file (or stdout if no path is given).
 *
 * Local only. It uses the exact `exportRecord` handler from `src/worker/routes/data.ts`
 * so the CLI export and the `/api/data/export` endpoint produce the same
 * `tai-learning-os-export@v1` envelope and cannot drift apart.
 *
 * Optional encryption: if `--passphrase <secret>` or `BACKUP_PASSPHRASE` env var is
 * provided (minimum 8 chars), the envelope is encrypted with Web Crypto AES-256-GCM
 * (PBKDF2-SHA256, 600,000 iterations) via `encryptBackupEnvelope`.
 *
 * Usage:
 *   npm run export:learner
 *   npm run export:learner -- ./backup-tai.json
 *   npm run export:learner -- ./backup-tai.enc.json --passphrase "<secret>"
 */
import { writeFileSync } from "node:fs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { getPlatformProxy } = await import("wrangler");
const { exportRecord } = await import("../src/worker/routes/data.ts");
const { encryptBackupEnvelope } = await import("../src/shared/crypto/backup-cipher.ts");

function parseCliArgs(argv) {
  let targetPath = null;
  let passphrase = process.env.BACKUP_PASSPHRASE ?? null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--passphrase" && i + 1 < argv.length) {
      passphrase = argv[i + 1];
      i++;
    } else if (!arg.startsWith("--") && !targetPath) {
      targetPath = arg;
    }
  }
  return { targetPath, passphrase };
}

const { targetPath, passphrase } = parseCliArgs(process.argv.slice(2));
const proxy = await getPlatformProxy();

try {
  const parentRow = await proxy.env.DB
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
    await proxy.dispose();
    process.exit(1);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const url = new URL("http://localhost/api/data/export");
  const request = new Request(url.toString(), { method: "POST" });

  const response = await exportRecord({
    request,
    url,
    env: proxy.env,
    parent: {
      parentId: String(parentRow.id),
      displayName: String(parentRow.display_name),
      claims: {
        sub: String(parentRow.id),
        iat: nowSec,
        exp: nowSec + 60,
        jti: "cli-export",
      },
      csrfToken: "cli-export",
    },
    requestId: crypto.randomUUID(),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error(`export refused (${response.status}): ${JSON.stringify(payload)}`);
    await proxy.dispose();
    process.exit(1);
  }

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
  await proxy.dispose();
  process.exit(1);
}

await proxy.dispose();
