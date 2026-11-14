/**
 * Strictly read-only CLI export of the 10-Year Open Portability Bundle (`scripts/export-portability.mjs`).
 *
 * Opens the local D1 SQLite database via `node:sqlite` `DatabaseSync(..., { readOnly: true })`
 * wrapped in `createReadOnlyD1Adapter`, builds the `tai-learning-os-export@v1` envelope via
 * `buildLearnerExportEnvelope`, and writes five open-standard offline artifacts into `<output-dir>`:
 *   - `clr-2.0.json`    (1EdTech CLR Standard v2.0 JSON-LD Verifiable Credential)
 *   - `case-1.1.json`   (1EdTech CASE v1.1 curriculum & skill graph)
 *   - `xapi-2.0.jsonl`  (IEEE 9274.1.1-2023 / xAPI 2.0 chronological event ledger)
 *   - `manifest.json`   (Counts, versions, and SHA-256 checksums)
 *   - `viewer.html`     (100% standalone offline archival reader)
 *
 * Never mutates the SQLite database file or appends to `audit_events`.
 *
 * Usage:
 *   node scripts/export-portability.mjs ./portability-out
 *   node scripts/export-portability.mjs --output-dir ./portability-out --target-root <dir> --learner-id <id>
 */
import { existsSync, mkdirSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { createReadOnlyD1Adapter } from "./household-preflight.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

registerTsSpecifiers();

const { buildLearnerExportEnvelope } = await import("../src/worker/routes/data.ts");
const {
  buildOpenPortabilityBundle,
  computePortabilityChecksums,
  serializePortabilityBundleFiles,
} = await import("../src/shared/portability/open-portability.ts");
const { renderStandalonePortabilityViewerHtml } = await import(
  "../src/shared/portability/static-viewer.ts"
);

export function parsePortabilityCliArgs(argv) {
  let outputDir = null;
  let targetRoot = process.cwd();
  let learnerId = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--output-dir" || arg === "--out-dir") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error(`Missing or invalid value for ${arg}`);
      }
      if (outputDir !== null) {
        throw new Error(`Unexpected duplicate output directory argument: ${next}`);
      }
      outputDir = resolve(next.trim());
      i += 1;
    } else if (arg === "--target-root") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --target-root");
      }
      targetRoot = resolve(next.trim());
      i += 1;
    } else if (arg === "--learner-id") {
      const next = argv[i + 1];
      if (typeof next !== "string" || !next.trim() || next.startsWith("--")) {
        throw new Error("Missing or invalid value for --learner-id");
      }
      learnerId = next.trim();
      i += 1;
    } else if (typeof arg === "string" && arg.startsWith("-")) {
      throw new Error(`Unknown flag for export:portability: ${arg}`);
    } else if (typeof arg === "string" && arg.trim().length > 0 && outputDir === null) {
      outputDir = resolve(arg.trim());
    } else {
      throw new Error(`Unexpected positional argument for export:portability: ${String(arg)}`);
    }
  }

  if (!outputDir) {
    throw new Error("Missing required <output-dir> argument for export:portability");
  }

  return { outputDir, targetRoot, learnerId };
}

export async function exportPortabilityBundleFromRoot({
  outputDir,
  targetRoot = process.cwd(),
  learnerId = null,
}) {
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
      `local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile), { readOnly: true });
  try {
    const db = createReadOnlyD1Adapter(rawDb);
    const parentRow = learnerId
      ? ((await db
          .prepare(
            `SELECT p.id
             FROM parents p
             JOIN learners l ON l.parent_id = p.id
             WHERE l.id = ?1
             LIMIT 1`,
          )
          .bind(learnerId)
          .first()) ??
        (await db
          .prepare(
            `SELECT p.id
             FROM parents p
             ORDER BY p.created_at ASC
             LIMIT 1`,
          )
          .first()))
      : await db
          .prepare(
            `SELECT p.id
             FROM parents p
             LEFT JOIN learners l ON l.parent_id = p.id
             ORDER BY (l.id IS NOT NULL) DESC, p.created_at ASC
             LIMIT 1`,
          )
          .first();

    if (!parentRow) {
      throw new Error("no parent account found in local D1.");
    }

    const built = await buildLearnerExportEnvelope(
      db,
      String(parentRow.id),
      learnerId ?? "",
    );
    if (!built.ok) {
      const errBody = await built.response.json();
      throw new Error(`(${built.status}) ${JSON.stringify(errBody)}`);
    }

    const bundle = buildOpenPortabilityBundle(built.envelope);
    const subtleChecksums = await computePortabilityChecksums(bundle);
    if (subtleChecksums.bundleSha256 !== bundle.manifest.checksums.bundleSha256) {
      throw new Error("integrity check failed: SHA-256 mismatch between sync and WebCrypto digests.");
    }

    const serialized = serializePortabilityBundleFiles(bundle);
    const viewerHtml = renderStandalonePortabilityViewerHtml(bundle, built.envelope);

    mkdirSync(outputDir, { recursive: true });
    const writtenFiles = {
      clr20Path: join(outputDir, "clr-2.0.json"),
      case11Path: join(outputDir, "case-1.1.json"),
      xapi20Path: join(outputDir, "xapi-2.0.jsonl"),
      manifestPath: join(outputDir, "manifest.json"),
      viewerPath: join(outputDir, "viewer.html"),
    };

    writeFileSync(writtenFiles.clr20Path, serialized.clr20Json, "utf8");
    writeFileSync(writtenFiles.case11Path, serialized.case11Json, "utf8");
    writeFileSync(writtenFiles.xapi20Path, serialized.xapi20Jsonl, "utf8");
    writeFileSync(writtenFiles.manifestPath, serialized.manifestJson, "utf8");
    writeFileSync(writtenFiles.viewerPath, viewerHtml, "utf8");

    return {
      learnerId: built.learnerId,
      outputDir,
      manifest: bundle.manifest,
      writtenFiles,
    };
  } finally {
    rawDb.close();
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let parsedArgs;
  try {
    parsedArgs = parsePortabilityCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `export:portability refused: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  try {
    const result = await exportPortabilityBundleFromRoot(parsedArgs);
    console.log(
      JSON.stringify({
        ok: true,
        learnerId: result.learnerId,
        outputDir: result.outputDir,
        counts: result.manifest.counts,
        bundleSha256: result.manifest.checksums.bundleSha256,
        files: [
          "clr-2.0.json",
          "case-1.1.json",
          "xapi-2.0.jsonl",
          "manifest.json",
          "viewer.html",
        ],
      }),
    );
  } catch (error) {
    console.error(
      `export:portability refused: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
