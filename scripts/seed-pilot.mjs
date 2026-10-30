/**
 * Seeds the local D1 database with the Multi-Learner Pilot Fixture (M3).
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
 * LOCAL ONLY.
 */
import { register } from "node:module";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { getPlatformProxy } = await import("wrangler");
const { seedPilotFixture } = await import("../test/integration/pilot-fixture.ts");

const proxy = await getPlatformProxy();

try {
  const result = await seedPilotFixture(proxy.env.DB);
  console.log(
    `Pilot seeded successfully: 1 Center (${result.organizationId}), ${result.classroomsCount} Classrooms, ${result.teachersCount} Teachers, ${result.learnersCount} Learners, Lesson (${result.lessonId}) ready for learning.`,
  );
} catch (error) {
  console.error(`Pilot seed failed: ${error instanceof Error ? error.message : String(error)}`);
  await proxy.dispose();
  process.exit(1);
}

await proxy.dispose();
