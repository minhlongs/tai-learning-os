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
import { getPlatformProxy } from "wrangler";

const { resetData } = await import("../test/integration/reset-data.ts");

const proxy = await getPlatformProxy();
const cleared = await resetData(proxy.env.DB);

console.log(`cleared ${cleared.length} tables`);
await proxy.dispose();
