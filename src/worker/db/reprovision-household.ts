/**
 * Clean-room household D1 database reprovisioning helper (`npm run db:reprovision-household`).
 *
 * When a local household D1 database accumulates simulated E2E or pilot rows in
 * `audit_events`, in-place DML reset (`resetUserData`) intentionally fails closed
 * because `audit_events` is append-only by schema-level triggers.
 *
 * Instead of tampering with triggers, the CLI script:
 *   1. Reads the household's existing parent account, active learner profile, and
 *      current school-year record via `extractHouseholdIdentity(db)`.
 *   2. Disposes the D1 proxy and archives the `.wrangler/state` SQLite files into
 *      `backups/household-db-archive-<timestamp>/`.
 *   3. Opens a brand-new local D1 database, applies all shipped migrations (`0001`–`0016`),
 *      seeds the 50 shipped catalogue lessons, restores the household identity via
 *      `restoreHouseholdIdentity(db, snapshot, now)`, and verifies the resulting
 *      clean state via `verifyCleanHouseholdState(db)`.
 */

export interface HouseholdParentSnapshot {
  id: string;
  password_hash: string;
  display_name: string;
  created_at: number;
  updated_at: number;
}

export interface HouseholdLearnerSnapshot {
  id: string;
  parent_id: string;
  nickname: string;
  birth_year: number | null;
  grade: number | null;
  timezone: string;
  created_at: number;
  updated_at: number;
}

export interface HouseholdSchoolYearSnapshot {
  id: string;
  learner_id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  grade: number | null;
  created_at: number;
}

export interface HouseholdIdentitySnapshot {
  parent: HouseholdParentSnapshot | null;
  learner: HouseholdLearnerSnapshot | null;
  schoolYear: HouseholdSchoolYearSnapshot | null;
}

export interface CleanHouseholdVerificationReport {
  schemaVersion: number;
  lessonsCount: number;
  lessonVersionsCount: number;
  parentsCount: number;
  learnersCount: number;
  schoolYearsCount: number;
  organizationsCount: number;
  classroomsCount: number;
  learningSessionsCount: number;
  learningAttemptsCount: number;
  skillEvidenceCount: number;
  /**
   * Layers 2 and 3 (ADR-005). Counted separately from `skillEvidenceCount`
   * because a database can hold zero competency rows and still carry a stale
   * estimate derived from attempts that were deleted — exactly the drift these
   * layers exist to make visible.
   */
  skillEvidenceObservationCount: number;
  skillEstimateCount: number;
  auditEventsCount: number;
  auditActions: string[];
}

/**
 * Extracts the primary household parent account, their active learner profile,
 * and the learner's latest school-year record from an existing D1 database prior
 * to archiving its SQLite files.
 */
export async function extractHouseholdIdentity(
  db: D1Database,
): Promise<HouseholdIdentitySnapshot> {
  const hasParentsTable = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'parents'")
    .first<{ name: string }>();

  if (!hasParentsTable) {
    return { parent: null, learner: null, schoolYear: null };
  }

  const parentRow = await db
    .prepare(
      `SELECT p.id, p.password_hash, p.display_name, p.created_at, p.updated_at
       FROM parents p
       LEFT JOIN learners l ON l.parent_id = p.id AND l.archived_at IS NULL
       ORDER BY (l.id IS NOT NULL) DESC, p.created_at ASC
       LIMIT 1`,
    )
    .first<HouseholdParentSnapshot>();

  if (!parentRow) {
    return { parent: null, learner: null, schoolYear: null };
  }

  const parent: HouseholdParentSnapshot = {
    id: String(parentRow.id),
    password_hash: String(parentRow.password_hash),
    display_name: String(parentRow.display_name),
    created_at: Number(parentRow.created_at),
    updated_at: Number(parentRow.updated_at),
  };

  const learnerRow = await db
    .prepare(
      `SELECT id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at
       FROM learners
       WHERE parent_id = ?1 AND archived_at IS NULL
       ORDER BY created_at ASC
       LIMIT 1`,
    )
    .bind(parent.id)
    .first<HouseholdLearnerSnapshot>();

  if (!learnerRow) {
    return { parent, learner: null, schoolYear: null };
  }

  const learner: HouseholdLearnerSnapshot = {
    id: String(learnerRow.id),
    parent_id: String(learnerRow.parent_id),
    nickname: String(learnerRow.nickname),
    birth_year: learnerRow.birth_year === null ? null : Number(learnerRow.birth_year),
    grade: learnerRow.grade === null ? null : Number(learnerRow.grade),
    timezone: String(learnerRow.timezone),
    created_at: Number(learnerRow.created_at),
    updated_at: Number(learnerRow.updated_at),
  };

  const schoolYearRow = await db
    .prepare(
      `SELECT id, learner_id, label, starts_on, ends_on, grade, created_at
       FROM school_years
       WHERE learner_id = ?1
       ORDER BY created_at DESC, starts_on DESC
       LIMIT 1`,
    )
    .bind(learner.id)
    .first<HouseholdSchoolYearSnapshot>();

  const schoolYear: HouseholdSchoolYearSnapshot | null = schoolYearRow
    ? {
        id: String(schoolYearRow.id),
        learner_id: String(schoolYearRow.learner_id),
        label: String(schoolYearRow.label),
        starts_on: String(schoolYearRow.starts_on),
        ends_on: String(schoolYearRow.ends_on),
        grade: schoolYearRow.grade === null ? null : Number(schoolYearRow.grade),
        created_at: Number(schoolYearRow.created_at),
      }
    : null;

  return { parent, learner, schoolYear };
}

/**
 * Restores the extracted household identity (`parents`, `learners`, `school_years`)
 * into a freshly migrated D1 database and writes only the canonical provenance
 * rows (`parent.created` and `learner.enrolled`) into `audit_events`.
 *
 * Refuses to run if the target database already contains any `audit_events`,
 * `parents`, `learners`, or `organizations` rows.
 */
export async function restoreHouseholdIdentity(
  db: D1Database,
  snapshot: HouseholdIdentitySnapshot,
  now: number,
): Promise<void> {
  const existingCounts = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM audit_events) AS audit_count,
         (SELECT COUNT(*) FROM parents) AS parents_count,
         (SELECT COUNT(*) FROM learners) AS learners_count,
         (SELECT COUNT(*) FROM organizations) AS orgs_count`,
    )
    .first<{
      audit_count: number;
      parents_count: number;
      learners_count: number;
      orgs_count: number;
    }>();

  if (
    Number(existingCounts?.audit_count ?? 0) > 0 ||
    Number(existingCounts?.parents_count ?? 0) > 0 ||
    Number(existingCounts?.learners_count ?? 0) > 0 ||
    Number(existingCounts?.orgs_count ?? 0) > 0
  ) {
    throw new Error(
      `Cannot restore household identity: target database is not clean ` +
        `(audit_events=${String(existingCounts?.audit_count ?? 0)}, ` +
        `parents=${String(existingCounts?.parents_count ?? 0)}, ` +
        `learners=${String(existingCounts?.learners_count ?? 0)}, ` +
        `organizations=${String(existingCounts?.orgs_count ?? 0)}).`,
    );
  }

  if (!snapshot.parent) {
    return;
  }

  const statements: D1PreparedStatement[] = [];
  const parentCreatedAt = snapshot.parent.created_at || now;
  const parentUpdatedAt = snapshot.parent.updated_at || parentCreatedAt;

  statements.push(
    db
      .prepare(
        `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
      .bind(
        snapshot.parent.id,
        snapshot.parent.password_hash,
        snapshot.parent.display_name,
        parentCreatedAt,
        parentUpdatedAt,
      ),
  );

  statements.push(
    db
      .prepare(
        `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
         VALUES (?1, ?2, 'parent.created', ?3, NULL, ?4)`,
      )
      .bind(
        crypto.randomUUID(),
        `parent:${snapshot.parent.id}`,
        snapshot.parent.id,
        parentCreatedAt,
      ),
  );

  if (snapshot.learner && snapshot.learner.parent_id === snapshot.parent.id) {
    const learnerCreatedAt = snapshot.learner.created_at || now;
    const learnerUpdatedAt = snapshot.learner.updated_at || learnerCreatedAt;

    statements.push(
      db
        .prepare(
          `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at, archived_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL)`,
        )
        .bind(
          snapshot.learner.id,
          snapshot.learner.parent_id,
          snapshot.learner.nickname,
          snapshot.learner.birth_year,
          snapshot.learner.grade,
          snapshot.learner.timezone,
          learnerCreatedAt,
          learnerUpdatedAt,
        ),
    );

    statements.push(
      db
        .prepare(
          `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
           VALUES (?1, ?2, 'learner.enrolled', ?3, ?4, ?5)`,
        )
        .bind(
          crypto.randomUUID(),
          `parent:${snapshot.parent.id}`,
          snapshot.learner.id,
          JSON.stringify({ grade: snapshot.learner.grade }),
          learnerCreatedAt,
        ),
    );

    if (snapshot.schoolYear && snapshot.schoolYear.learner_id === snapshot.learner.id) {
      statements.push(
        db
          .prepare(
            `INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
          )
          .bind(
            snapshot.schoolYear.id,
            snapshot.schoolYear.learner_id,
            snapshot.schoolYear.label,
            snapshot.schoolYear.starts_on,
            snapshot.schoolYear.ends_on,
            snapshot.schoolYear.grade,
            snapshot.schoolYear.created_at || learnerCreatedAt,
          ),
      );
    }
  }

  await db.batch(statements);
}

/**
 * The oldest schema this verifier knows how to read.
 *
 * Enforced in its own query, before any query touches a table a later migration
 * introduced. On a v14 database the combined COUNT below would otherwise die on
 * `no such table: skill_evidence_observation` and hand the operator a raw SQL
 * error instead of the one instruction that fixes it.
 */
const MINIMUM_SUPPORTED_SCHEMA_VERSION = 15;

/**
 * Fails closed when the database predates the schema this verifier reads.
 *
 * `failurePrefix` carries the caller's operator-facing wording ("preflight
 * failed" / "verification failed") so both entry points report themselves.
 */
export async function assertMinimumSchemaVersion(
  db: D1Database,
  failurePrefix: string,
): Promise<number> {
  const row = await db
    .prepare("SELECT MAX(version) AS schema_version FROM schema_versions")
    .first<{ schema_version: number | null }>();
  const schemaVersion = Number(row?.schema_version ?? 0);
  if (schemaVersion < MINIMUM_SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `${failurePrefix}: expected schemaVersion >= ${MINIMUM_SUPPORTED_SCHEMA_VERSION}, found ${schemaVersion}. Run \`npm run db:migrate\` to bring this database up to date.`,
    );
  }
  return schemaVersion;
}

/**
 * Verifies that a reprovisioned household D1 database has all schema v15 protections,
 * all 50 shipped catalogue lessons, zero simulated B2B2C or E2E rows, and only
 * legitimate household identity provenance in `audit_events`.
 */
export async function verifyCleanHouseholdState(
  db: D1Database,
): Promise<CleanHouseholdVerificationReport> {
  await assertMinimumSchemaVersion(db, "Household DB verification failed");

  const triggers =
    (
      await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_events' ORDER BY name ASC",
        )
        .all<{ name: string }>()
    ).results ?? [];
  const triggerNames = triggers.map((t) => t.name);
  if (
    !triggerNames.includes("audit_events_no_delete") ||
    !triggerNames.includes("audit_events_no_update")
  ) {
    throw new Error(
      `Household DB verification failed: missing audit_events immutability triggers (found: [${triggerNames.join(", ")}])`,
    );
  }

  const uniqueIndex = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'learning_attempts' AND name = 'idx_attempts_learner_step_attempt'",
    )
    .first<{ name: string }>();
  if (!uniqueIndex) {
    throw new Error(
      "Household DB verification failed: missing unique index idx_attempts_learner_step_attempt on learning_attempts",
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
         (SELECT COUNT(*) FROM skill_evidence_observation) AS skill_evidence_observation_count,
         (SELECT COUNT(*) FROM skill_estimate) AS skill_estimate_count,
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
      skill_evidence_observation_count: number;
      skill_estimate_count: number;
      audit_events_count: number;
    }>();

  const auditRows =
    (
      await db
        .prepare("SELECT action FROM audit_events ORDER BY created_at ASC, rowid ASC")
        .all<{ action: string }>()
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
    skillEvidenceObservationCount: Number(counts?.skill_evidence_observation_count ?? 0),
    skillEstimateCount: Number(counts?.skill_estimate_count ?? 0),
    auditEventsCount: Number(counts?.audit_events_count ?? 0),
    auditActions,
  };

  if (report.lessonsCount !== 50 || report.lessonVersionsCount !== 50) {
    throw new Error(
      `Household DB verification failed: expected 50 catalogue lessons and 50 lesson_versions, found lessons=${report.lessonsCount}, lessonVersions=${report.lessonVersionsCount}`,
    );
  }
  if (
    report.parentsCount > 1 ||
    report.learnersCount > 1 ||
    report.schoolYearsCount > 1 ||
    report.auditEventsCount > 2 ||
    report.organizationsCount !== 0 ||
    report.classroomsCount !== 0 ||
    report.learningSessionsCount !== 0 ||
    report.learningAttemptsCount !== 0 ||
    report.skillEvidenceCount !== 0 ||
    report.skillEvidenceObservationCount !== 0 ||
    report.skillEstimateCount !== 0
  ) {
    throw new Error(
      `Household DB verification failed: simulated or stale rows remain ` +
        `(parentsCount=${report.parentsCount}, learnersCount=${report.learnersCount}, ` +
        `schoolYearsCount=${report.schoolYearsCount}, auditEventsCount=${report.auditEventsCount}, ` +
        `organizationsCount=${report.organizationsCount}, classroomsCount=${report.classroomsCount}, ` +
        `learningSessionsCount=${report.learningSessionsCount}, learningAttemptsCount=${report.learningAttemptsCount}, ` +
        `skillEvidenceCount=${report.skillEvidenceCount}, ` +
        `skillEvidenceObservationCount=${report.skillEvidenceObservationCount}, ` +
        `skillEstimateCount=${report.skillEstimateCount})`,
    );
  }

  const allowedActions = new Set(["parent.created", "learner.enrolled"]);
  const unexpectedActions = report.auditActions.filter((action) => !allowedActions.has(action));
  if (unexpectedActions.length > 0) {
    throw new Error(
      `Household DB verification failed: unexpected audit_events actions found ([${unexpectedActions.join(", ")}])`,
    );
  }

  return report;
}
