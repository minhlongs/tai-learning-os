/**
 * Removes every data row from the local D1 database, leaving the schema intact.
 *
 * Miniflare's own bookkeeping tables (`_cf_METADATA`, `sqlite_sequence`) are not
 * ours to write and D1 refuses them with SQLITE_AUTH, and wrangler's
 * `d1_migrations` records which migrations have run — deleting it would make the
 * schema look unapplied. So those are excluded, and the filter lives here in one
 * place rather than in an `exec` string that has to escape correctly.
 */
const RESERVED_PREFIXES = ["sqlite_", "_cf_"] as const;
const RESERVED_TABLES = ["d1_migrations"] as const;

export async function resetData(db: D1Database): Promise<readonly string[]> {
  const rows = await db
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all<{ name: string }>();

  const tables = rows.results
    .map((row) => row.name)
    .filter(
      (name) =>
        !RESERVED_PREFIXES.some((prefix) => name.startsWith(prefix)) &&
        !RESERVED_TABLES.includes(name as (typeof RESERVED_TABLES)[number]),
    );

  for (const name of tables) {
    await db.exec(`delete from ${name};`);
  }

  return tables;
}
