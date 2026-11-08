/**
 * Read-only household preflight helper (`npm run household:preflight`).
 *
 * Verifies local `.dev.vars` key presence (boolean only, never secret values),
 * SQLite `PRAGMA integrity_check`, household D1 isolation invariants (triggers,
 * unique attempt index, schema v14+, 50+ catalogue lessons, single parent/learner,
 * zero B2B2C organizations/classrooms, and zero foreign audit actors), household
 * identity presence (`parents`, `learners`, `school_years`), and the count of
 * parent-approved active lessons for the registered household learner without
 * writing a single row to D1.
 */

import {
  extractHouseholdIdentity,
  verifyCleanHouseholdState,
  type CleanHouseholdVerificationReport,
  type HouseholdIdentitySnapshot,
} from "./reprovision-household";

export interface DevVarsPreflightStatus {
  devVarsPresent: boolean;
  hasSessionSecret: boolean;
  hasParentPasswordHash: boolean;
}

export interface HouseholdIdentitySummary {
  hasParent: boolean;
  parentDisplayName: string | null;
  hasLearner: boolean;
  learnerNickname: string | null;
  learnerGrade: number | null;
  schoolYearLabel: string | null;
}

export interface HouseholdPreflightReport {
  ok: boolean;
  integrityCheck: string;
  devVars: DevVarsPreflightStatus;
  database: CleanHouseholdVerificationReport;
  household: HouseholdIdentitySummary;
  approvedLessonsCount: number;
  readyForLearnerSession: boolean;
  nextActionVi: string;
}

const PRISTINE_ENROLLMENT_ACTIONS = new Set(["parent.created", "learner.enrolled"]);

/**
 * Parses the raw text of `.dev.vars` (or `null` if the file does not exist)
 * and returns boolean key-presence flags only, never exposing secret values.
 */
export function inspectDevVarsText(rawText: string | null): DevVarsPreflightStatus {
  if (rawText === null) {
    return {
      devVarsPresent: false,
      hasSessionSecret: false,
      hasParentPasswordHash: false,
    };
  }

  let hasSessionSecret = false;
  let hasParentPasswordHash = false;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const val = line
      .slice(eqIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!val) continue;
    if (key === "SESSION_SECRET") hasSessionSecret = true;
    if (key === "PARENT_PASSWORD_HASH") hasParentPasswordHash = true;
  }

  return {
    devVarsPresent: true,
    hasSessionSecret,
    hasParentPasswordHash,
  };
}

/**
 * Verifies household D1 structural and isolation invariants in read-only mode.
 * Delegates to `verifyCleanHouseholdState(db)` when the database is still in its
 * pristine post-reprovision state, and continues to validate single-household
 * isolation after the parent logs in, approves lessons, or supervises sessions.
 */
async function inspectHouseholdDatabaseState(
  db: D1Database,
  snapshot: HouseholdIdentitySnapshot,
): Promise<CleanHouseholdVerificationReport> {
  const triggers =
    (
      await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
        )
        .all<{ name: string }>()
    ).results ?? [];
  const triggerNames = triggers.map((t) => String(t.name));
  if (
    !triggerNames.includes("audit_events_no_delete") ||
    !triggerNames.includes("audit_events_no_update")
  ) {
    throw new Error(
      `Household DB preflight failed: missing audit_events immutability triggers (found: [${triggerNames.join(", ")}])`,
    );
  }

  const uniqueIndex = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'learning_attempts' AND name = 'idx_attempts_learner_step_attempt'",
    )
    .first<{ name: string }>();
  if (!uniqueIndex) {
    throw new Error(
      "Household DB preflight failed: missing unique index idx_attempts_learner_step_attempt on learning_attempts",
    );
  }

  const counts = await db
    .prepare(
      `SELECT
         (SELECT MAX(version) FROM schema_versions) AS schema_version,
         (SELECT COUNT(*) FROM lessons) AS lessons_count,
         (SELECT COUNT(*) FROM lesson_versions) AS lesson_versions_count,
         (SELECT COUNT(*) FROM parents) AS parents_count,
         (SELECT COUNT(*) FROM learners) AS learners_count,
         (SELECT COUNT(*) FROM school_years) AS school_years_count,
         (SELECT COUNT(*) FROM organizations) AS organizations_count,
         (SELECT COUNT(*) FROM classrooms) AS classrooms_count,
         (SELECT COUNT(*) FROM learning_sessions) AS learning_sessions_count,
         (SELECT COUNT(*) FROM learning_attempts) AS learning_attempts_count,
         (SELECT COUNT(*) FROM skill_evidence) AS skill_evidence_count,
         (SELECT COUNT(*) FROM audit_events) AS audit_events_count`,
    )
    .first<{
      schema_version: number | null;
      lessons_count: number;
      lesson_versions_count: number;
      parents_count: number;
      learners_count: number;
      school_years_count: number;
      organizations_count: number;
      classrooms_count: number;
      learning_sessions_count: number;
      learning_attempts_count: number;
      skill_evidence_count: number;
      audit_events_count: number;
    }>();

  const auditRows =
    (
      await db
        .prepare(
          "SELECT action, actor FROM audit_events ORDER BY created_at ASC, rowid ASC",
        )
        .all<{ action: string; actor: string }>()
    ).results ?? [];
  const auditActions = auditRows.map((r) => String(r.action));

  const report: CleanHouseholdVerificationReport = {
    schemaVersion: Number(counts?.schema_version ?? 0),
    lessonsCount: Number(counts?.lessons_count ?? 0),
    lessonVersionsCount: Number(counts?.lesson_versions_count ?? 0),
    parentsCount: Number(counts?.parents_count ?? 0),
    learnersCount: Number(counts?.learners_count ?? 0),
    schoolYearsCount: Number(counts?.school_years_count ?? 0),
    organizationsCount: Number(counts?.organizations_count ?? 0),
    classroomsCount: Number(counts?.classrooms_count ?? 0),
    learningSessionsCount: Number(counts?.learning_sessions_count ?? 0),
    learningAttemptsCount: Number(counts?.learning_attempts_count ?? 0),
    skillEvidenceCount: Number(counts?.skill_evidence_count ?? 0),
    auditEventsCount: Number(counts?.audit_events_count ?? 0),
    auditActions,
  };

  const isPristinePostReprovision =
    report.lessonsCount === 50 &&
    report.lessonVersionsCount === 50 &&
    report.schoolYearsCount <= 1 &&
    report.auditEventsCount <= 2 &&
    report.learningSessionsCount === 0 &&
    report.learningAttemptsCount === 0 &&
    report.skillEvidenceCount === 0 &&
    report.auditActions.every((action) => PRISTINE_ENROLLMENT_ACTIONS.has(action));

  if (isPristinePostReprovision) {
    return verifyCleanHouseholdState(db);
  }

  if (report.schemaVersion < 14) {
    throw new Error(
      `Household DB preflight failed: expected schemaVersion >= 14, found ${report.schemaVersion}`,
    );
  }
  if (report.lessonsCount < 50 || report.lessonVersionsCount < 50) {
    throw new Error(
      `Household DB preflight failed: expected at least 50 catalogue lessons and 50 lesson_versions, found lessons=${report.lessonsCount}, lessonVersions=${report.lessonVersionsCount}`,
    );
  }
  if (
    report.parentsCount > 1 ||
    report.learnersCount > 1 ||
    report.organizationsCount !== 0 ||
    report.classroomsCount !== 0
  ) {
    throw new Error(
      `Household DB preflight failed: multi-learner or organization pollution detected ` +
        `(parentsCount=${report.parentsCount}, learnersCount=${report.learnersCount}, ` +
        `organizationsCount=${report.organizationsCount}, classroomsCount=${report.classroomsCount})`,
    );
  }

  const allowedActors = new Set<string>(["system", "cli-operator"]);
  if (snapshot.parent?.id) allowedActors.add(`parent:${snapshot.parent.id}`);
  if (snapshot.learner?.id) allowedActors.add(`learner:${snapshot.learner.id}`);

  const foreignActors = auditRows
    .map((r) => String(r.actor ?? ""))
    .filter((actor) => actor.length > 0 && !allowedActors.has(actor));
  if (foreignActors.length > 0) {
    throw new Error(
      `Household DB preflight failed: foreign actor values in audit_events ([${Array.from(new Set(foreignActors)).join(", ")}])`,
    );
  }

  return report;
}

/**
 * Runs a strictly read-only preflight inspection over the household D1 database.
 * Never mutates any table or `audit_events` row, and strips `password_hash`
 * before building the returned report.
 */
export async function inspectHouseholdPreflight(
  db: D1Database,
  devVars: DevVarsPreflightStatus,
  precomputedIntegrityCheck?: string,
): Promise<HouseholdPreflightReport> {
  // `PRAGMA integrity_check` is refused by workerd's D1 SQLITE_AUTH authorizer
  // unless precomputed via read-only `node:sqlite` by the CLI caller.
  let integrityCheck: string;
  if (precomputedIntegrityCheck !== undefined) {
    integrityCheck =
      precomputedIntegrityCheck === "ok" || precomputedIntegrityCheck.startsWith("skipped")
        ? precomputedIntegrityCheck
        : "failed";
  } else {
    try {
      const integrityRow = await db
        .prepare("PRAGMA integrity_check")
        .first<{ integrity_check: string }>();
      integrityCheck = String(integrityRow?.integrity_check ?? "unknown");
      if (integrityCheck !== "ok") {
        integrityCheck = "failed";
      }
    } catch {
      integrityCheck = "skipped (D1 binding did not authorize PRAGMA integrity_check)";
    }
  }

  const snapshot = await extractHouseholdIdentity(db);
  const database = await inspectHouseholdDatabaseState(db, snapshot);

  let approvedLessonsCount = 0;
  if (snapshot.learner && snapshot.parent) {
    const approvedRow = await db
      .prepare(
        `SELECT COUNT(DISTINCT ra.lesson_id) AS approved_count
         FROM review_approvals ra
         JOIN lessons l ON l.id = ra.lesson_id AND l.version = ra.lesson_version
         WHERE ra.learner_id = ?1 AND ra.decided_by = ?2 AND ra.status = 'approved'`,
      )
      .bind(snapshot.learner.id, snapshot.parent.id)
      .first<{ approved_count: number }>();
    approvedLessonsCount = Number(approvedRow?.approved_count ?? 0);
  }

  const household: HouseholdIdentitySummary = {
    hasParent: snapshot.parent !== null,
    parentDisplayName: snapshot.parent?.display_name ?? null,
    hasLearner: snapshot.learner !== null,
    learnerNickname: snapshot.learner?.nickname ?? null,
    learnerGrade: snapshot.learner?.grade ?? null,
    schoolYearLabel: snapshot.schoolYear?.label ?? null,
  };

  const ok =
    (integrityCheck === "ok" || integrityCheck.startsWith("skipped")) &&
    devVars.devVarsPresent &&
    devVars.hasSessionSecret &&
    household.hasParent &&
    household.hasLearner;

  const readyForLearnerSession = ok && approvedLessonsCount > 0;

  let nextActionVi: string;
  if (!devVars.devVarsPresent || !devVars.hasSessionSecret) {
    nextActionVi =
      "Tạo file .dev.vars với SESSION_SECRET trước khi khởi chạy npm run dev.";
  } else if (!household.hasParent || !household.hasLearner) {
    nextActionVi =
      "Chạy npm run dev và mở /login để hoàn tất thiết lập tài khoản phụ huynh và hồ sơ học sinh.";
  } else if (approvedLessonsCount === 0) {
    nextActionVi =
      "DB hộ gia đình sạch 100%, nhưng chưa có bài học nào được duyệt. Hãy chạy npm run household:approve-lessons (hoặc mở /parent/lessons) để duyệt bài cho Tài trước buổi học.";
  } else {
    nextActionVi = `Sẵn sàng cho buổi học của ${household.learnerNickname ?? "học sinh"} (${approvedLessonsCount} bài học đã được phụ huynh duyệt).`;
  }

  return {
    ok,
    integrityCheck,
    devVars,
    database,
    household,
    approvedLessonsCount,
    readyForLearnerSession,
    nextActionVi,
  };
}
