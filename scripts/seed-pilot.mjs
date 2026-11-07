/**
 * Seeds the multi-learner pilot fixture into its own isolated database.
 *
 * Seeds:
 *   - 1 Learning Center: Trung Tâm Bồi Dưỡng Tài Năng Trẻ
 *   - 1 Center Owner: Cô Hiệu Trưởng Mai
 *   - 2 Teachers: Thầy Quang (Toán 4A), Cô Hương (Anh-Việt 4B)
 *   - 2 Classrooms: Lớp Toán 4A, Lớp Anh-Việt 4B
 *   - 5 Grade-4 Learners & Parents: Bé Tài, Bé Bảo, Bé Châu, Bé Duy, Bé Em
 *   - 5 Active Consent Grants & Classroom Enrollments
 *   - 1 Approved & Assigned Center Lesson
 *
 * The pilot fixture is simulated data for exercising the B2B2C surface. It
 * deliberately writes to a separate database from the household learner's: the
 * appendix-only audit ledger cannot be cleaned once written, so mixing five
 * simulated children's evidence into the learner's own database would make the
 * learner's history permanently unreadable. `pilot-database.ts` owns that
 * isolation and refuses to start if the path would land in the repository.
 *
 * LOCAL ONLY.
 */
import { register } from "node:module";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { seedPilotFixture } = await import("../test/integration/pilot-fixture.ts");
const { openPilotDatabase, getPilotPersistDir } = await import("../test/integration/pilot-database.ts");

const proxy = await openPilotDatabase();

try {
  const result = await seedPilotFixture(proxy.env.DB);
  console.log(
    `Pilot seeded successfully into an isolated database: 1 Center (${result.organizationId}), ${result.classroomsCount} Classrooms, ${result.teachersCount} Teachers, ${result.learnersCount} Learners, Lesson (${result.lessonId}) ready for learning.`,
  );
  console.log(`Pilot database location: ${getPilotPersistDir()}`);
} catch (error) {
  console.error(`Pilot seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await proxy.dispose();
  process.exit(1);
}

await proxy.dispose();
