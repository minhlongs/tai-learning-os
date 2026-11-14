/**
 * Automated Encrypted Backup & Restore Drill (`npm run backup:drill`).
 *
 * Closes Production Gate #4 in `docs/ROADMAP_90_DAYS.md` by executing a real,
 * end-to-end backup, AES-256-GCM encryption, cascade deletion, decryption, and
 * restoration drill inside an isolated temporary D1 database (`os.tmpdir()`).
 *
 * Safety invariant: NEVER opens or touches `.wrangler/state` or `.dev.vars`.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { listShippedMigrationFiles } from "./migrate-local-d1.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";
import {
  createSqliteD1Adapter,
  miniflareD1SqliteFilename,
  splitSqlStatements,
} from "./seed-lessons.mjs";

registerTsSpecifiers();

const { exportRecord, deleteLearner, importRecord } = await import("../src/worker/routes/data.ts");
const { LESSONS } = await import("../src/shared/content/index.ts");
const {
  encryptBackupEnvelope,
  decryptBackupEnvelope,
  isEncryptedBackupEnvelope,
} = await import("../src/shared/crypto/backup-cipher.ts");
const { EXPORT_COLLECTIONS } = await import("../src/shared/schemas/transfer.ts");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const DRILL_RUNTIME_DIR = mkdtempSync(join(tmpdir(), "tai-learning-os-backup-drill-"));
const DRILL_PERSIST_DIR = join(DRILL_RUNTIME_DIR, "d1-state");
const DRILL_BACKUP_FILE = join(DRILL_RUNTIME_DIR, "learner-backup.enc.json");

const MIGRATION_FILES = listShippedMigrationFiles();

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Backup drill assertion failed: ${message}`);
  }
}

const DRILL_DB_ID = "tai-learning-os-backup-drill-id";
const drillD1Dir = join(DRILL_PERSIST_DIR, "d1", "miniflare-D1DatabaseObject");
mkdirSync(drillD1Dir, { recursive: true });

const rawDb = new DatabaseSync(join(drillD1Dir, miniflareD1SqliteFilename(DRILL_DB_ID)));
rawDb.exec("PRAGMA foreign_keys = ON;");
rawDb.exec("PRAGMA busy_timeout = 5000;");
const db = createSqliteD1Adapter(rawDb);
const proxy = {
  env: { DB: db, ENVIRONMENT: "development" },
  async dispose() {
    rawDb.close();
  },
};

try {
  // 1. Apply all shipped migrations in order
  for (const file of MIGRATION_FILES) {
    const rawSql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const stmt of splitSqlStatements(rawSql)) {
      rawDb.exec(stmt);
    }
  }

  // 2. Seed all 50 catalogue lessons and steps + parent + learner + real learning records
  const now = Date.now() - 120_000;
  for (const lesson of LESSONS) {
    await db
      .prepare(
        `INSERT INTO lessons
           (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
            grade_from, grade_to, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10, ?10)`,
      )
      .bind(
        lesson.id,
        lesson.subjectId,
        lesson.skillId,
        lesson.titleVi,
        lesson.titleEn,
        lesson.objectiveVi,
        lesson.objectiveEn,
        lesson.gradeFrom,
        lesson.gradeTo,
        now,
      )
      .run();

    await db
      .prepare(
        `INSERT INTO lesson_versions
           (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
         VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(lesson.id, lesson.titleVi, lesson.titleEn, lesson.objectiveVi, lesson.objectiveEn, now)
      .run();

    await db
      .prepare(
        `INSERT INTO lesson_metadata
           (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes, review_recommendation_vi, is_baseline, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
      )
      .bind(
        lesson.id,
        lesson.objectiveId ?? null,
        lesson.provenance ?? "original_supplemental",
        lesson.sourceRef ?? null,
        lesson.expectedDurationMinutes ?? 20,
        lesson.reviewRecommendationVi ?? null,
        lesson.isBaseline ? 1 : 0,
        now,
      )
      .run();

    for (const step of lesson.steps) {
      const stepId = `${lesson.id}-step-${step.position}`;
      await db
        .prepare(
          `INSERT INTO lesson_steps
             (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1)`,
        )
        .bind(
          stepId,
          lesson.id,
          step.position,
          step.kind,
          JSON.stringify(step.content),
          step.answerKey,
          step.explanationVi,
        )
        .run();
    }
  }

  const parentId = "parent-drill-1";
  const learnerId = "learner-drill-1";
  await db
    .prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES (?1, 'pbkdf2:600000:salt:hash', 'Phụ huynh Drill', ?2, ?2)`,
    )
    .bind(parentId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
       VALUES (?1, ?2, 'Bé Mẫu', 2017, 4, 'Asia/Ho_Chi_Minh', ?3, ?3)`,
    )
    .bind(learnerId, parentId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at)
       VALUES ('sy-drill-1', ?1, '2026-2027', '2026-09-05', '2027-05-31', 4, ?2)`,
    )
    .bind(learnerId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
       VALUES ('app-drill-1', ?1, 'sci-states-of-matter', 1, 'approved', ?2, ?3, 'Đã duyệt bài Khoa học')`,
    )
    .bind(learnerId, parentId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_sessions
         (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline)
       VALUES ('sess-drill-1', ?1, 'sci-states-of-matter', 1, 'sy-drill-1', ?2, ?3, 'completed', 5, NULL)`,
    )
    .bind(learnerId, now, now + 60_000)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
       VALUES ('att-drill-1', 'sess-drill-1', ?1, 'sci-states-of-matter', 'sci-states-of-matter-step-5', 1, 'sci-states-of-matter', '{"choiceId":"a"}', 'correct', 0, 'observed', 1, ?2)`,
    )
    .bind(learnerId, now + 30_000)
    .run();

  await db
    .prepare(
      `INSERT INTO skill_evidence
         (id, learner_id, skill_id, state, independent_count, assisted_count, correct_count, last_independent_at, last_observed_at, source, correction_note, updated_at)
       VALUES ('ev-drill-1', ?1, 'sci-states-of-matter', 'TRANSFERRED', 1, 0, 1, ?2, ?2, 'derived', NULL, ?2)`,
    )
    .bind(learnerId, now + 30_000)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_goals
         (id, learner_id, subject_id, title_vi, note, target_date, status, created_at, updated_at)
       VALUES ('goal-drill-1', ?1, 'science', 'Hoàn thành 4 bài Khoa học lớp 4', 'Ôn kỹ sự chuyển thể', '2026-12-15', 'active', ?2, ?2)`,
    )
    .bind(learnerId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO review_schedule
         (id, learner_id, skill_id, due_at, interval_days, last_result, last_attempt_at, failure_streak, created_at, updated_at)
       VALUES ('rev-drill-1', ?1, 'sci-states-of-matter', ?2, 3, 'passed', ?3, 0, ?3, ?3)`,
    )
    .bind(learnerId, now + 86_400_000 * 3, now + 30_000)
    .run();

  await db
    .prepare(
      `INSERT INTO curriculum_intakes
         (id, learner_id, school_year_label, grade, subject_id, textbook_series, current_unit, current_lesson,
          weekly_sessions, session_duration_minutes, material_reference, learning_goals_vi, provenance, created_at, updated_at)
       VALUES ('intake-drill-1', ?1, '2026-2027', 4, 'science', 'Kết nối tri thức', 'Chủ đề 1', 'Sự chuyển thể của nước',
               3, 25, 'SGK Khoa học 4 trang 10', 'Hiểu 3 thể của nước', 'parent_textbook', ?2, ?2)`,
    )
    .bind(learnerId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO baseline_assessments
         (id, learner_id, subject_id, session_id, status, observed_summary_vi, supported_summary_vi,
          needs_observation_json, suggested_lessons_json, parent_review_required, created_at, completed_at)
       VALUES ('base-drill-1', ?1, 'science', 'sess-drill-1', 'completed', 'Vững kiến thức', '', '[]', '["sci-water-cycle"]', 0, ?2, ?3)`,
    )
    .bind(learnerId, now, now + 60_000)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_plan_items
         (id, learner_id, school_year_label, week_index, day_of_week, scheduled_date, subject_id, skill_id, lesson_id,
          item_kind, status, duration_minutes, parent_note, reason_vi, created_at, updated_at)
       VALUES ('plan-drill-1', ?1, '2026-2027', 1, 2, '2026-11-03', 'science', 'sci-states-of-matter', 'sci-states-of-matter',
               'review', 'scheduled', 20, 'Ôn lại buổi tối', 'Củng cố kiến thức', ?2, ?2)`,
    )
    .bind(learnerId, now)
    .run();

  await db
    .prepare(
      `INSERT INTO session_reflections
         (id, session_id, learner_id, feeling, note_vi, created_at)
       VALUES ('refl-drill-1', 'sess-drill-1', ?1, 'confident', 'Em hiểu bài rất rõ!', ?2)`,
    )
    .bind(learnerId, now + 65_000)
    .run();

  await db
    .prepare(
      `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
       VALUES ('aud-drill-hint-1', ?1, 'hint.requested', 'sci-states-of-matter-step-1', '{"sessionId":"sess-drill-1","level":2}', ?2)`,
    )
    .bind(`learner:${learnerId}`, now + 20_000)
    .run();

  // Seed a family-owned forked practice lesson with historical v1 session/attempt AND an edited v2 snapshot
  const familyLessonId = "family-fork-sci-drill-1";
  await db
    .prepare(
      `INSERT INTO lessons
         (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
          grade_from, grade_to, version, ownership_type, owner_parent_id, purpose,
          source_lesson_id, source_version, created_at, updated_at)
       VALUES (?1, 'science', 'sci-states-of-matter', 'Bản luyện tập v2: Ba thể của nước (Đã chỉnh sửa)', 'States of Matter (Family v2)',
               'Mục tiêu v2 đã chỉnh sửa', 'Objective v2', 4, 4, 2, 'family', ?2, 'practice',
               'sci-states-of-matter', 1, ?3, ?4)`,
    )
    .bind(familyLessonId, parentId, now + 10_000, now + 50_000)
    .run();

  await db
    .prepare(
      `INSERT INTO lesson_versions
         (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at)
       VALUES (?1, 1, 'Bản luyện tập v1: Ba thể của nước (Gốc)', 'States of Matter (Family v1)', 'Mục tiêu v1 gốc', 'Objective v1', ?2),
              (?1, 2, 'Bản luyện tập v2: Ba thể của nước (Đã chỉnh sửa)', 'States of Matter (Family v2)', 'Mục tiêu v2 đã chỉnh sửa', 'Objective v2', ?3)`,
    )
    .bind(familyLessonId, now + 10_000, now + 50_000)
    .run();

  await db
    .prepare(
      `INSERT INTO lesson_metadata
         (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes, review_recommendation_vi, is_baseline, updated_at)
       VALUES (?1, NULL, 'original_supplemental', 'family_fork:sci-states-of-matter@v1', 20, NULL, 0, ?2)`,
    )
    .bind(familyLessonId, now + 50_000)
    .run();

  const sampleStepContentV1 = JSON.stringify(LESSONS[0].steps[4].content);
  const sampleStepAnswerV1 = LESSONS[0].steps[4].answerKey;
  await db
    .prepare(
      `INSERT INTO lesson_steps
         (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version, source_step_id)
       VALUES ('fam-step-v1-1', ?1, 1, 'transfer', ?2, ?3, 'Giải thích v1 gốc', 1, 'sci-states-of-matter-step-5'),
              ('fam-step-v2-1', ?1, 1, 'transfer', ?2, ?3, 'Giải thích v2 đã cập nhật', 2, 'sci-states-of-matter-step-5')`,
    )
    .bind(familyLessonId, sampleStepContentV1, sampleStepAnswerV1)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_sessions
         (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, continuation_deadline, purpose)
       VALUES ('sess-drill-fam-v1', ?1, ?2, 1, 'sy-drill-1', ?3, ?4, 'completed', 1, NULL, 'practice')`,
    )
    .bind(learnerId, familyLessonId, now + 15_000, now + 25_000)
    .run();

  await db
    .prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, purpose, created_at)
       VALUES ('att-drill-fam-v1', 'sess-drill-fam-v1', ?1, ?2, 'fam-step-v1-1', 1, 'sci-states-of-matter', '{"choiceId":"a"}', 'correct', 0, 'assisted', 1, 'practice', ?3)`,
    )
    .bind(learnerId, familyLessonId, now + 20_000)
    .run();

  // Layers 2 and 3 (ADR-005). Without a row in each, the restored collection
  // counts are 0 and the parity check compares 0 to 0 — it passes whether the
  // import wrote these tables or dropped them on the floor. One row each makes
  // the round-trip an actual claim: the observation resolves to an attempt id
  // that only survives if the attempt was restored under the same id, and the
  // estimate names the ledger watermark it was computed from.
  await db
    .prepare(
      `INSERT INTO skill_evidence_observation
         (id, learner_id, skill_id, attempt_id, observed_kind, help_level, attempt_no, observed_at, created_at)
       VALUES ('obs-drill-1', ?1, 'sci-states-of-matter', 'att-drill-1', 'independent', 0, 1, ?2, ?2)`,
    )
    .bind(learnerId, now + 30_000)
    .run();

  await db
    .prepare(
      `INSERT INTO skill_estimate
         (id, learner_id, skill_id, stability, difficulty, retrievability_at, reps, lapses, fsrs_state,
          scheduled_days, last_review_at, model_version, computed_at, attempt_watermark, attempt_count,
          created_at, updated_at)
       VALUES ('est-drill-1', ?1, 'sci-states-of-matter', 4.2, 5.1, 0.93, 1, 0, 2,
               3, ?2, 'v6.0.0', ?2, 'att-drill-1', 1, ?2, ?2)`,
    )
    .bind(learnerId, now + 30_000)
    .run();

  const parentCtx = {
    parentId,
    displayName: "Phụ huynh Drill",
    claims: {
      sub: parentId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
      jti: "drill-jti",
      mode: "parent",
    },
    csrfToken: "drill-csrf",
  };

  // 3. Export learner record via exportRecord handler
  const exportUrl = new URL("http://localhost/api/data/export");
  const exportRes = await exportRecord({
    request: new Request(exportUrl.toString(), { method: "POST" }),
    url: exportUrl,
    env: proxy.env,
    parent: parentCtx,
    requestId: crypto.randomUUID(),
  });
  assert(exportRes.status === 200, `exportRecord returned HTTP ${exportRes.status}`);
  const exportedEnvelope = await exportRes.json();
  assert(exportedEnvelope.learners?.length === undefined && exportedEnvelope.data.learners.length === 1, "exported 1 learner");
  assert(exportedEnvelope.data.lessons.length === 51, `expected 51 lessons (50 catalogue + 1 family) in export, got ${exportedEnvelope.data.lessons.length}`);
  assert(exportedEnvelope.data.lessonVersions.length === 52, `expected 52 lessonVersions (50 catalogue v1 + 2 family v1/v2) in export, got ${exportedEnvelope.data.lessonVersions.length}`);
  assert(exportedEnvelope.data.learningSessions.length === 2, "expected 2 sessions in export");
  assert(exportedEnvelope.data.learningAttempts.length === 2, "expected 2 attempts in export");
  assert(exportedEnvelope.data.skillEvidence.length === 1, "expected 1 skillEvidence in export");
  assert(exportedEnvelope.data.learningGoals.length === 1, "expected 1 learningGoal in export");
  assert(exportedEnvelope.data.reviewSchedule.length === 1, "expected 1 reviewSchedule in export");
  assert(exportedEnvelope.data.curriculumIntakes.length === 1, "expected 1 curriculumIntake in export");
  assert(exportedEnvelope.data.baselineAssessments.length === 1, "expected 1 baselineAssessment in export");
  assert(exportedEnvelope.data.learningPlanItems.length === 1, "expected 1 learningPlanItem in export");
  assert(exportedEnvelope.data.sessionReflections.length === 1, "expected 1 sessionReflection in export");

  // 4. Encrypt the backup envelope with Web Crypto AES-256-GCM and write to disk
  const drillPassphrase = "drill-passphrase-2026-aes-gcm";
  const encryptedPayload = await encryptBackupEnvelope(exportedEnvelope, drillPassphrase);
  writeFileSync(DRILL_BACKUP_FILE, JSON.stringify(encryptedPayload, null, 2), "utf8");

  const diskRaw = JSON.parse(readFileSync(DRILL_BACKUP_FILE, "utf8"));
  assert(isEncryptedBackupEnvelope(diskRaw), "disk file must be recognized as tai-encrypted-backup-v1");

  // 4b. Verify wrong passphrase, corrupted ciphertext byte, and tampered AAD iterations all fail closed
  const wrongDecrypt = await decryptBackupEnvelope(diskRaw, "wrong-passphrase-12345");
  assert(wrongDecrypt.ok === false, "wrong passphrase must fail decryption");

  const rawCipherBytes = Buffer.from(diskRaw.ciphertextB64, "base64");
  rawCipherBytes[0] ^= 0xff;
  const corruptedCiphertextEnvelope = {
    ...diskRaw,
    ciphertextB64: rawCipherBytes.toString("base64"),
  };
  const corruptedDecrypt = await decryptBackupEnvelope(corruptedCiphertextEnvelope, drillPassphrase);
  assert(corruptedDecrypt.ok === false, "corrupted ciphertext byte must fail GCM authentication");

  const tamperedAadEnvelope = {
    ...diskRaw,
    iterations: diskRaw.iterations + 1,
  };
  const tamperedAadDecrypt = await decryptBackupEnvelope(tamperedAadEnvelope, drillPassphrase);
  assert(tamperedAadDecrypt.ok === false, "tampered AAD iterations must fail decryption");

  // 5. Cascade-delete the learner record via deleteLearner handler, AND wipe the family lesson
  //    from D1 so we prove importRecord faithfully restores historical v1 + current v2 snapshots
  //    and steps without relying on pre-existing D1 rows or blind synthesis from data.lessons.
  const deleteUrl = new URL("http://localhost/api/data/learner");
  const deleteRes = await deleteLearner({
    request: new Request(deleteUrl.toString(), {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ learnerId, confirmation: "XOA Bé Mẫu" }),
    }),
    url: deleteUrl,
    env: proxy.env,
    parent: parentCtx,
    requestId: crypto.randomUUID(),
  });
  assert(deleteRes.status === 200, `deleteLearner returned HTTP ${deleteRes.status}`);
  const remainingLearners = await db.prepare("SELECT COUNT(*) AS cnt FROM learners").first();
  assert(Number(remainingLearners.cnt) === 0, "learner must be 0 after cascade delete");

  await db.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(familyLessonId).run();
  await db.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(familyLessonId).run();
  await db.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(familyLessonId).run();
  await db.prepare("DELETE FROM lessons WHERE id = ?1").bind(familyLessonId).run();

  // 6. Decrypt the backup from disk and restore via importRecord handler
  //
  // The restore is timed from the first byte read off disk to the last committed
  // row, because that is what "roll back to the backup" costs an operator. The
  // clock is `performance.now()` rather than `Date.now()`: this number decides
  // whether the documented recovery procedure fits its stated budget, and a
  // wall clock can jump under NTP correction mid-drill.
  const restoreStartedAt = performance.now();
  const decrypted = await decryptBackupEnvelope(diskRaw, drillPassphrase);
  assert(decrypted.ok === true, `decryption failed: ${!decrypted.ok ? decrypted.errors.join("; ") : ""}`);

  const importUrl = new URL("http://localhost/api/data/import");
  const importRes = await importRecord({
    request: new Request(importUrl.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(decrypted.envelope),
    }),
    url: importUrl,
    env: proxy.env,
    parent: parentCtx,
    requestId: crypto.randomUUID(),
  });
  assert(importRes.status === 200, `importRecord returned HTTP ${importRes.status}`);
  const importReport = await importRes.json();
  assert(importReport.ok === true, "importReport.ok must be true");
  assert(importReport.counts.learners === 1, "restored 1 learner");
  assert(importReport.counts.lessons === 51, "restored 51 lessons");
  assert(importReport.counts.lessonVersions === 52, "restored 52 lessonVersions");
  assert(importReport.counts.learningSessions === 2, "restored 2 learningSessions");
  assert(importReport.counts.learningAttempts === 2, "restored 2 learningAttempts");
  assert(importReport.counts.skillEvidence === 1, "restored 1 skillEvidence");
  assert(importReport.counts.learningGoals === 1, "restored 1 learningGoal");
  assert(importReport.counts.reviewSchedule === 1, "restored 1 reviewSchedule");
  assert(importReport.counts.curriculumIntakes === 1, "restored 1 curriculumIntake");
  assert(importReport.counts.baselineAssessments === 1, "restored 1 baselineAssessment");
  assert(importReport.counts.learningPlanItems === 1, "restored 1 learningPlanItem");
  assert(importReport.counts.sessionReflections === 1, "restored 1 sessionReflection");

  // The rollback finishes when the last row is committed, which is exactly when
  // `importRecord` returns. Everything after this point is verification, not
  // recovery, so it is excluded from the measured duration: an operator waiting
  // on a restore is waiting for this, not for our assertions.
  const restoreMs = performance.now() - restoreStartedAt;

  // The documented recovery procedure promises an operator can roll back inside
  // one minute. Asserting it here means a restore that creeps past the budget
  // fails the drill instead of quietly reporting a larger number nobody reads.
  assert(
    restoreMs < 60_000,
    `rollback must finish inside the 60s budget, took ${restoreMs.toFixed(1)}ms`,
  );

  // Verify historical v1 snapshot AND v2 snapshot of the family lesson were both faithfully restored
  const restoredFamV1 = await db
    .prepare("SELECT title_vi, objective_vi FROM lesson_versions WHERE lesson_id = ?1 AND version = 1")
    .bind(familyLessonId)
    .first();
  const restoredFamV2 = await db
    .prepare("SELECT title_vi, objective_vi FROM lesson_versions WHERE lesson_id = ?1 AND version = 2")
    .bind(familyLessonId)
    .first();
  assert(
    restoredFamV1?.title_vi === "Bản luyện tập v1: Ba thể của nước (Gốc)",
    `historical v1 title_vi must be preserved verbatim, got ${String(restoredFamV1?.title_vi)}`,
  );
  assert(
    restoredFamV2?.title_vi === "Bản luyện tập v2: Ba thể của nước (Đã chỉnh sửa)",
    `current v2 title_vi must be preserved verbatim, got ${String(restoredFamV2?.title_vi)}`,
  );

  const restoredFamStepV1 = await db
    .prepare("SELECT explanation_vi, source_step_id FROM lesson_steps WHERE id = 'fam-step-v1-1'")
    .first();
  const restoredFamStepV2 = await db
    .prepare("SELECT explanation_vi, source_step_id FROM lesson_steps WHERE id = 'fam-step-v2-1'")
    .first();
  assert(
    restoredFamStepV1?.explanation_vi === "Giải thích v1 gốc" &&
      restoredFamStepV1?.source_step_id === "sci-states-of-matter-step-5",
    "historical v1 step explanation and source_step_id must be preserved",
  );
  assert(
    restoredFamStepV2?.explanation_vi === "Giải thích v2 đã cập nhật" &&
      restoredFamStepV2?.source_step_id === "sci-states-of-matter-step-5",
    "v2 step explanation and source_step_id must be preserved",
  );

  // Verify every restored collection round-tripped, by re-exporting from the
  // database after the restore and comparing against the backup. This reads real
  // D1 rows, which is the only way to detect a row the import silently dropped:
  // `importReport.counts` is counted off the request body (`countOf` in
  // `importRecord` reads `data[key].length`), so comparing it to the envelope
  // would compare the file to itself and could never report a loss.
  const postRestoreExportRes = await exportRecord({
    request: new Request(exportUrl.toString(), { method: "POST" }),
    url: exportUrl,
    env: proxy.env,
    parent: parentCtx,
    requestId: crypto.randomUUID(),
  });
  assert(postRestoreExportRes.status === 200, "post-restore exportRecord must return 200");
  const postRestoreEnvelope = await postRestoreExportRes.json();

  // `auditEvents` is the one collection a restore deliberately does not replay
  // verbatim. Import re-derives `hint.requested` provenance from the attempt
  // history and records its own `data.imported` row, so the ledger after a
  // restore is a new set of facts about the restore, not a copy of the old one.
  // Comparing it would fail on a correct restore; every other collection is
  // compared against the full `EXPORT_COLLECTIONS` list so a collection added to
  // the schema is checked here without editing this drill.
  const parityKeys = EXPORT_COLLECTIONS.filter((key) => key !== "auditEvents");

  // Records the backup held versus records the restore actually reached in D1.
  // Both sides are summed over `parityKeys`, so a collection that imported
  // nothing shows up as a non-zero loss rather than as twenty passing counts
  // masking one silent drop.
  const backedUpRecords = parityKeys.reduce(
    (sum, key) => sum + (exportedEnvelope.data[key] ?? []).length,
    0,
  );
  const restoredRecords = parityKeys.reduce((sum, key) => sum + (postRestoreEnvelope.data[key] ?? []).length, 0);
  const recordsLost = backedUpRecords - restoredRecords;
  assert(
    recordsLost === 0,
    `rollback must lose no records: backup held ${backedUpRecords}, restore reached ${restoredRecords}`,
  );

  for (const key of parityKeys) {
    assert(
      postRestoreEnvelope.data[key].length === exportedEnvelope.data[key].length,
      `collection parity mismatch for ${key}: exported ${exportedEnvelope.data[key].length}, post-restore ${postRestoreEnvelope.data[key].length}`,
    );
  }

  // Verify fail-closed approval downgrade invariant after restore
  const restoredApproval = await db
    .prepare("SELECT status FROM review_approvals WHERE id = 'app-drill-1'")
    .first();
  assert(
    restoredApproval?.status === "draft",
    `imported 'approved' status must fail-closed to 'draft', got ${String(restoredApproval?.status)}`,
  );

  console.log(
    JSON.stringify({
      ok: true,
      drill: "backup-restore-aes-256-gcm",
      lessonsExported: exportedEnvelope.data.lessons.length,
      countsRestored: importReport.counts,
      restoreMs: Math.round(restoreMs),
      recordsBackedUp: backedUpRecords,
      recordsLost,
      approvalFailClosedToDraft: restoredApproval?.status === "draft",
    }),
  );
} finally {
  await proxy.dispose();
  rmSync(DRILL_RUNTIME_DIR, { recursive: true, force: true });
}
