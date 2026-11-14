/**
 * 10-Year Open Portability Export Route (`POST /api/data/export-portability`).
 *
 * Protected by `parentRoute` (parent mode + CSRF + owner-scoped learner lookup).
 * Reuses `buildLearnerExportEnvelope` so tenant/owner isolation matches
 * `/api/data/export`, then emits 1EdTech CLR v2.0, 1EdTech CASE v1.1,
 * IEEE xAPI v2.0 JSONL, and the self-contained offline `viewer.html` while
 * recording a single `data.portability_exported` audit row.
 */

import type { ExportPortabilityResponse } from "../../shared/api-contract";
import { buildOpenPortabilityBundle } from "../../shared/portability/open-portability";
import { renderStandalonePortabilityViewerHtml } from "../../shared/portability/static-viewer";
import type { ExportEnvelope } from "../../shared/schemas/transfer";
import * as repo from "../db/repositories";
import type { Handler } from "../http/middleware";
import { ok } from "../http/response";
import { buildLearnerExportEnvelope } from "./data";

export const exportPortabilityRecord: Handler = async (context) => {
  const db = context.env.DB;
  const requestedLearnerId =
    context.url.searchParams.get("learnerId")?.trim() ||
    context.request.headers.get("x-tlo-learner-id")?.trim() ||
    "";

  const built = await buildLearnerExportEnvelope(db, context.parent.parentId, requestedLearnerId);
  if (!built.ok) return built.response;

  const envelope = built.envelope as ExportEnvelope;
  const bundle = buildOpenPortabilityBundle(envelope);
  const viewerHtml = renderStandalonePortabilityViewerHtml(bundle, envelope);

  await repo.recordAudit(db, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "data.portability_exported",
    subject: built.learnerId,
    detail: JSON.stringify({
      format: bundle.manifest.format,
      xapiStatements: bundle.manifest.counts.xapiStatements,
      achievements: bundle.manifest.counts.achievements,
    }),
    now: envelope.exportedAt,
  });

  return ok<ExportPortabilityResponse>({
    exportedAt: envelope.exportedAt,
    manifest: {
      learners: bundle.manifest.counts.learners,
      skills: bundle.manifest.counts.skills,
      objectives: bundle.manifest.counts.objectives,
      achievements: bundle.manifest.counts.achievements,
      sessions: bundle.manifest.counts.sessions,
      attempts: bundle.manifest.counts.attempts,
      xapiStatements: bundle.manifest.counts.xapiStatements,
      formats: {
        clr: bundle.manifest.versions.clr,
        case: bundle.manifest.versions.case,
        xapi: bundle.manifest.versions.xapi,
      },
      exportedAtIso: bundle.manifest.exportedAtIso,
    },
    clr20: bundle.clr20,
    case11: bundle.case11,
    xapi20Jsonl: bundle.xapi20Jsonl,
    viewerHtml,
  });
};
