/**
 * Clears the data rows from the local D1 database, leaving the schema intact.
 *
 * Local only. It runs no migrations, creates no remote resource, and reads no
 * real secret. Used to give the local development or integration run a known
 * starting state, so a leftover parent row cannot make a first-run check pass
 * for the wrong reason.
 *
 * The table filter lives in `test/integration/reset-data.ts` so this script and
 * the test suite cannot disagree about which tables are theirs to clear.
 */
/**
 * Clears the data rows from the local D1 database, leaving the schema intact.
 *
 * Local only. It runs no migrations, creates no remote resource, and reads no
 * real secret. Used to give the local development or integration run a known
 * starting state, so a leftover parent row cannot make a first-run check pass
 * for the wrong reason.
 *
 * The table filter lives in `test/integration/reset-data.ts` so this script and
 * the test suite cannot disagree about which tables are theirs to clear.
 */
import { register } from "node:module";
import { getPlatformProxy } from "wrangler";

// The project compiles with `moduleResolution: "bundler"`, which allows
// extensionless imports that Node's own ESM loader resolves to nothing. This
// hook completes them to the `.ts` files that exist, and is registered before
// any project source is loaded — `register` resolves asynchronously, so the
// imports below are dynamic rather than static.
register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { resetData } = await import("../test/integration/reset-data.ts");

const proxy = await getPlatformProxy();
const cleared = await resetData(proxy.env.DB);

console.log(`cleared ${cleared.length} tables`);
// Releasing the proxy releases the SQLite handle. Skipping this leaves the file
// locked, so the next run fails to write and reports a data problem instead.
await proxy.dispose();
