import { getPlatformProxy } from "wrangler";
import { resetUserData } from "../src/worker/db/reset-user-data.ts";

/**
 * Local dev user-data reset script (`npm run db:reset-data`).
 *
 * Uses `resetUserData` so it never imports `test/integration/test-db.ts`, never
 * drops tables/triggers/migrations, and preserves the curriculum catalogue
 * (`subjects`, `skills`, `skill_prerequisites`, `curriculum_objectives`,
 * `schema_versions`, `d1_migrations`).
 */
const { env, dispose } = await getPlatformProxy();
try {
  await resetUserData(env.DB);
} finally {
  await dispose();
}
