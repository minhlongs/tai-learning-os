import { seedLessons } from "./lesson-seed";

/**
 * Restores the local D1 database to a known starting state: a fresh parent, a
 * fresh learner, and the shipped lesson catalogue with no approval, no session
 * and no attempt anywhere.
 *
 * The reference catalogue the migrations install — subjects, skills,
 * prerequisites, schema_versions — is NOT cleared. It is required content
 * rather than test data: no app behaviour depends on it being optional, and
 * without it a lesson cannot seed and a subject screen is empty for the wrong
 * reason. Nothing the app runs writes to those tables, so leaving them alone
 * cannot leak one test's state into the next.
 *
 * Lessons are re-seeded afterwards, because a suite that has to teach something
 * needs lessons to be there. Seeding goes through `lesson-seed.ts` — the same
 * module the operator script uses — so a test and `npm run seed:demo` can never
 * disagree about what a lesson is.
 *
 * Miniflare's own bookkeeping tables (`_cf_METADATA`, `sqlite_sequence`) are not
 * ours to write and D1 refuses them with SQLITE_AUTH, and wrangler's
 * `d1_migrations` records which migrations have run — deleting it would make the
 * schema look unapplied. The filter lives here in one place rather than in an
 * `exec` string that has to escape correctly.
 *
 * If the catalogue tables are empty when this runs, the local database was
 * wiped rather than reset: re-apply the migrations and re-run the seed before
 * expecting the learner surface to work.
 */
const RESERVED_PREFIXES = ["sqlite_", "_cf_"] as const;

/** Installed by the migrations; required for anything to function. */
const CATALOGUE_TABLES = [
  "subjects",
  "skills",
  "skill_prerequisites",
  "curriculum_objectives",
  "schema_versions",
] as const;

/** Bookkeeping D1 and wrangler own; never ours to write or clear. */
const PLATFORM_TABLES = ["d1_migrations"] as const;

export async function resetData(db: D1Database): Promise<readonly string[]> {
  const rows = await db
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all<{ name: string }>();

  const cleared = rows.results
    .map((row) => row.name)
    .filter(
      (name) =>
        !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix)) &&
        !PLATFORM_TABLES.includes(name as (typeof PLATFORM_TABLES)[number]) &&
        !CATALOGUE_TABLES.includes(name as (typeof CATALOGUE_TABLES)[number]),
    );

  for (const name of cleared) {
    await db.exec(`delete from ${name};`);
  }

  await seedLessons(db, { checkSkills: false });

  return cleared;
}
