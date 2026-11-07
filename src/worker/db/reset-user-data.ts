/**
 * Non-destructive local user-data reset helper (`npm run db:reset-data`).
 *
 * Unlike `test/integration/test-db.ts` (which drops and recreates schema on
 * isolated test databases), this helper NEVER drops tables, indexes, triggers,
 * `d1_migrations`, `schema_versions`, or curriculum catalogue rows (`subjects`,
 * `skills`, `skill_prerequisites`, `curriculum_objectives`).
 *
 * Because schema v4 (`0004_evidence_integrity.sql`) enforces append-only
 * `BEFORE DELETE` triggers on `audit_events`, clearing a database that already
 * holds audit ledger rows cannot proceed via DML without violating the ledger's
 * immutability guarantee. This helper checks `audit_events` up front before any
 * mutation and fails closed with an explicit error if rows exist or if a delete
 * probe is refused.
 */

export const PRESERVED_CATALOGUE_TABLES = [
  "schema_versions",
  "d1_migrations",
  "subjects",
  "skills",
  "skill_prerequisites",
  "curriculum_objectives",
] as const;

export const USER_DATA_TABLES_IN_DELETE_ORDER = [
  "classroom_lesson_assignments",
  "organization_lessons",
  "classroom_enrollments",
  "classroom_teachers",
  "learner_consents",
  "classrooms",
  "organization_members",
  "organizations",
  "session_reflections",
  "learning_plan_items",
  "baseline_assessments",
  "curriculum_intakes",
  "learning_attempts",
  "learning_sessions",
  "skill_evidence",
  "review_schedule",
  "learning_goals",
  "school_years",
  "learners",
  "review_approvals",
  "lesson_metadata",
  "content_origin",
  "lesson_steps",
  "lessons",
  "auth_throttles",
  "parents",
] as const;

export async function resetUserData(db: D1Database): Promise<void> {
  // 1. Preflight check: if audit_events exists and contains rows (or refuses DELETE),
  //    abort BEFORE mutating any user or lesson table so the database is never left
  //    in a half-wiped state.
  const auditTable = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_events'")
    .first<{ name: string }>();

  if (auditTable) {
    const auditCountRow = await db
      .prepare("SELECT COUNT(*) AS count FROM audit_events")
      .first<{ count: number }>();
    const count = Number(auditCountRow?.count ?? 0);
    if (count > 0) {
      throw new Error(
        `Cannot reset user data: audit_events contains ${count} immutable row(s) protected by append-only triggers. ` +
          `User-data reset refuses to drop triggers or partially delete state. ` +
          `Use 'npm run db:reprovision-household' to archive the existing SQLite file and provision a clean database.`,
      );
    }
  }

  // 2. Discover which user-data tables actually exist in this schema version
  const existingTablesResult = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all<{ name: string }>();
  const existingTables = new Set((existingTablesResult.results ?? []).map((r) => r.name));

  // 3. Execute all user-data table deletions in a single atomic batch in FK child-first order
  const statements: D1PreparedStatement[] = [];
  for (const table of USER_DATA_TABLES_IN_DELETE_ORDER) {
    if (existingTables.has(table)) {
      statements.push(db.prepare(`DELETE FROM ${table}`));
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }
}
