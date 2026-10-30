import { seedLessons } from "./lesson-seed";
import { recreateSchema } from "./test-db";

/**
 * Restores a D1 database to a known starting state: the shipped schema and
 * reference catalogue from `migrations/`, plus the seeded lesson catalogue with
 * no approval, no session, no attempt, and an empty append-only `audit_events`
 * ledger with its `BEFORE UPDATE` and `BEFORE DELETE` triggers active.
 *
 * Because `audit_events` is guarded by database triggers that forbid `DELETE`,
 * reset works by recreating the schema via `recreateSchema(db)` rather than
 * issuing `DELETE FROM` against the ledger.
 */
const RESERVED_PREFIXES = ["sqlite_", "_cf_"] as const;
const CATALOGUE_TABLES = [
  "subjects",
  "skills",
  "skill_prerequisites",
  "curriculum_objectives",
  "schema_versions",
] as const;
const PLATFORM_TABLES = ["d1_migrations"] as const;

export async function resetData(db: D1Database): Promise<readonly string[]> {
  await recreateSchema(db);
  await seedLessons(db, { checkSkills: false });

  const rows = await db
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all<{ name: string }>();

  return (rows.results ?? [])
    .map((row) => row.name)
    .filter(
      (name) =>
        !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix)) &&
        !PLATFORM_TABLES.includes(name as (typeof PLATFORM_TABLES)[number]) &&
        !CATALOGUE_TABLES.includes(name as (typeof CATALOGUE_TABLES)[number]),
    );
}
