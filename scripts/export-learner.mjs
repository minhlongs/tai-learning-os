/**
 * Exports the local learner record to a JSON file (or stdout if no path is given).
 *
 * Local only. It uses the exact `exportRecord` handler from `src/worker/routes/data.ts`
 * so the CLI export and the `/api/data/export` endpoint produce the same
 * `tai-learning-os-export@v1` envelope and cannot drift apart.
 *
 * Usage:
 *   npm run export:learner
 *   npm run export:learner -- ./backup-tai.json
 */
import { writeFileSync } from "node:fs";
import { register } from "node:module";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { getPlatformProxy } = await import("wrangler");
const { exportRecord } = await import("../src/worker/routes/data.ts");

const proxy = await getPlatformProxy();

try {
  const parentRow = await proxy.env.DB
    .prepare("SELECT id, display_name FROM parents ORDER BY created_at ASC LIMIT 1")
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

  const formatted = `${JSON.stringify(payload, null, 2)}\n`;
  const targetPath = process.argv[2];
  if (targetPath) {
    writeFileSync(targetPath, formatted, "utf8");
    console.log(`exported learner record to ${targetPath}`);
  } else {
    process.stdout.write(formatted);
  }
} catch (error) {
  console.error(`export failed: ${error instanceof Error ? error.message : String(error)}`);
  await proxy.dispose();
  process.exit(1);
}

await proxy.dispose();
