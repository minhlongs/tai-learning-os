/**
 * Seeds the local D1 database from the shipped lesson registry.
 *
 * The rules — what a valid lesson is, how a change is detected, how a step id
 * is derived, how a lesson is written — all live in
 * `test/integration/lesson-seed.ts`, because the integration suites seed the
 * same content and must not be able to disagree with this script about it. A
 * break in either caller fails both, which is the point.
 *
 * The lesson registry (`src/shared/content/`) is the single source of truth for
 * lesson content, and this is the only path by which a lesson reaches the
 * learner. Nothing here deploys, and no remote resource is created.
 *
 * DEMO CONTENT. These lessons are sample material for the local MVP. They are
 * not aligned to any specific school textbook, because the family has not
 * supplied one, and they must never be merged into a real learner's record.
 *
 * Local only.
 */
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";

/**
 * The extensionless specifiers the project uses need this hook, and a hook can
 * only be registered before the first import it applies to — so the project's
 * sources are loaded with dynamic import below, after registration, rather than
 * with static imports this loader would race.
 *
 * The hook path is built from an absolute file URL because `register` resolves
 * a bare relative specifier against a `data:` base, which fails.
 */
registerTsSpecifiers();

const { getPlatformProxy } = await import("wrangler");
const { seedLessons } = await import("../test/integration/lesson-seed.ts");

const proxy = await getPlatformProxy();

try {
  const result = await seedLessons(proxy.env.DB);
  console.log(
    `seeded: ${result.inserted} inserted, ${result.rewritten} content-changed, ${result.unchanged} unchanged`,
  );
} catch (error) {
  console.error(`seed refused: ${error instanceof Error ? error.message : String(error)}`);
  await proxy.dispose();
  process.exit(1);
}

// The proxy holds the local workerd open, so it has to be released or the
// script finishes its work and then hangs with nothing left to do.
await proxy.dispose();
