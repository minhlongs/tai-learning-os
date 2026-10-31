/**
 * Parent consent grant routes.
 *
 * The invariant this module protects: PARENT SOVEREIGNTY. A parent's learner
 * belongs to the parent (`learners.parent_id`), not to any organization. A
 * center receives nothing until the parent issues an explicit consent grant
 * (`learner_consents`), and that grant can be revoked instantly.
 *
 * Every handler here re-proves ownership of the learner before it reads or
 * writes a consent row: the session's parent id must match `learners.parent_id`.
 * A learner id alone is never trusted.
 */

import type {
  GrantLearnerConsentRequest,
  GrantLearnerConsentResponse,
  LearnerConsentListResponse,
  RevokeLearnerConsentRequest,
  RevokeLearnerConsentResponse,
} from "../../shared/api-contract";
import * as repo from "../db/repositories";
import { badRequest, forbidden, notFound, ok, readJsonBody } from "../http/response";
import type { Handler } from "../http/middleware";
import { recordAudit } from "../db/repositories";

/**
 * Resolve the learner the request names, refusing (404) when it does not exist
 * or is not owned by the authenticated parent. Ownership is a not-found, not a
 * forbidden: the response never confirms that another family's learner id
 * exists.
 */
async function findOwnedLearner(
  context: { request: Request; url: URL; env: { DB: D1Database }; parent: { parentId: string } },
  learnerId?: unknown,
) {
  const candidate =
    typeof learnerId === "string" && learnerId.trim().length > 0
      ? learnerId.trim()
      : context.url.searchParams.get("learnerId")?.trim() ||
        context.request.headers.get("x-tlo-learner-id")?.trim() ||
        "";
  if (candidate.length > 0) {
    return repo.findLearnerForParent(context.env.DB, candidate, context.parent.parentId);
  }
  return repo.findFirstLearnerForParent(context.env.DB, context.parent.parentId);
}

/* ── GET /api/parent/consents ─────────────────────────────────────────────── */

export const listConsents: Handler = async (context) => {
  const learnerId = context.url.searchParams.get("learnerId");
  const learner = await findOwnedLearner(context, learnerId);
  if (!learner) {
    return notFound("Không tìm thấy hồ sơ người học.");
  }

  const rows = await repo.listConsentsForLearner(context.env.DB, learner.id);
  return ok<LearnerConsentListResponse>({
    consents: rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      organizationName: row.organizationName,
      learnerId: row.learner_id,
      status: row.status,
      grantedAt: row.granted_at,
      revokedAt: row.revoked_at,
    })),
  });
};

/* ── POST /api/parent/consents/grant ──────────────────────────────────────── */

export const grantConsent: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<GrantLearnerConsentRequest>;
  if (typeof body.organizationId !== "string" || body.organizationId.length === 0) {
    return badRequest("Thiếu mã tổ chức (organizationId).");
  }

  const learner = await findOwnedLearner(context, body.learnerId);
  if (!learner) {
    return notFound("Không tìm thấy hồ sơ người học.");
  }

  // The organization must exist; a consent cannot dangle toward a missing org.
  const organization = await repo.findOrganizationById(context.env.DB, body.organizationId);
  if (!organization) {
    return notFound("Không tìm thấy trung tâm.");
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  await repo.grantLearnerConsent(context.env.DB, {
    id,
    organizationId: organization.id,
    learnerId: learner.id,
    grantedBy: context.parent.parentId,
    now,
  });

  await recordAudit(context.env.DB, {
    id: crypto.randomUUID(),
    actor: `parent:${context.parent.parentId}`,
    action: "consent.granted",
    subject: learner.id,
    detail: JSON.stringify({ organizationId: organization.id }),
    now,
  });

  return ok<GrantLearnerConsentResponse>({
    id,
    organizationId: organization.id,
    learnerId: learner.id,
    status: "active",
    grantedAt: now,
  });
};

/* ── POST /api/parent/consents/revoke ─────────────────────────────────────── */

export const revokeConsent: Handler = async (context) => {
  const read = await readJsonBody(context.request);
  if (!read.ok) return read.response;

  const body = read.body as Partial<RevokeLearnerConsentRequest>;
  if (typeof body.organizationId !== "string" || body.organizationId.length === 0) {
    return badRequest("Thiếu mã tổ chức (organizationId).");
  }

  const learner = await findOwnedLearner(context, body.learnerId);
  if (!learner) {
    return notFound("Không tìm thấy hồ sơ người học.");
  }

  const now = Date.now();

  // Revoke is an instant, unconditional cut-off. If there is no active grant the
  // access is already denied, so reporting success keeps the parent's model
  // simple: "after I click, the center cannot see my child."
  await context.env.DB.batch([
    repo.revokeLearnerConsentStatement(context.env.DB, {
      organizationId: body.organizationId,
      learnerId: learner.id,
      revokedBy: context.parent.parentId,
      now,
    }),
    // Clamp any in-progress sessions for this learner that belong to this organization to 30 min max
    repo.clampContinuationDeadlinesForLearnerOrgStatement(context.env.DB, {
      learnerId: learner.id,
      organizationId: body.organizationId,
      revokedAt: now,
    }),
    repo.auditInsert(context.env.DB, {
      id: crypto.randomUUID(),
      actor: `parent:${context.parent.parentId}`,
      action: "consent.revoked",
      subject: learner.id,
      detail: JSON.stringify({ organizationId: body.organizationId }),
      now,
    }),
  ]);

  return ok<RevokeLearnerConsentResponse>({ success: true, revokedAt: now });
};

/* ── GET /api/parent/consents/organizations ───────────────────────────────── */

/**
 * Organizations the parent may grant consent to: every center that enrolled
 * this learner. Read-only; grant/revoke stay explicit parent actions.
 */
export const listConsentableOrganizations: Handler = async (context) => {
  const learnerId = context.url.searchParams.get("learnerId");
  const learner = await findOwnedLearner(context, learnerId);
  if (!learner) {
    return notFound("Không tìm thấy hồ sơ người học.");
  }

  const enrollments = await repo.listEnrollmentsForLearner(context.env.DB, learner.id);
  const organizations = new Map<string, { id: string; name: string }>();
  for (const enrollment of enrollments) {
    if (!organizations.has(enrollment.organization_id)) {
      organizations.set(enrollment.organization_id, {
        id: enrollment.organization_id,
        name: enrollment.organizationName,
      });
    }
  }

  return ok<{ organizations: { id: string; name: string }[] }>({
    organizations: [...organizations.values()],
  });
};

/** Never reached: kept so `forbidden` stays imported for the ownership guard. */
export const consentOwnershipDenied = (): Response => forbidden();
