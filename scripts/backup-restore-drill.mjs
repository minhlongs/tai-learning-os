/**
 * Automated Encrypted Backup & Restore Drill (`npm run backup:drill`).
 *
 * Closes Production Gate #4 in `docs/ROADMAP_90_DAYS.md` by executing a real,
 * end-to-end backup, AES-256-GCM encryption, cascade deletion, decryption, and
 * restoration drill inside an isolated temporary D1 database (`os.tmpdir()`).
 *
 * Safety invariant: NEVER opens or touches `.wrangler/state` or `.dev.vars`.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPlatformProxy, unstable_splitSqlQuery } from "wrangler";

register(new URL("./resolve-ts-specifiers.mjs", import.meta.url).href);

const { exportRecord, deleteLearner, importRecord } = await import("../src/worker/routes/data.ts");
const { LESSONS } = await import("../src/shared/content/index.ts");
const {
  encryptBackupEnvelope,
  decryptBackupEnvelope,
  isEncryptedBackupEnvelope,
} = await import("../src/shared/crypto/backup-cipher.ts");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const DRILL_RUNTIME_DIR = mkdtempSync(join(tmpdir(), "tai-learning-os-backup-drill-"));
const DRILL_PERSIST_DIR = join(DRILL_RUNTIME_DIR, "d1-state");
const DRILL_CONFIG_PATH = join(DRILL_RUNTIME_DIR, "wrangler.drill.jsonc");
const DRILL_BACKUP_FILE = join(DRILL_RUNTIME_DIR, "learner-backup.enc.json");

const MIGRATION_FILES = [
  "0001_initial_schema.sql",
  "0002_reference_content.sql",
  "0003_curriculum_and_trust_closure.sql",
  "0004_evidence_integrity.sql",
  "0005_organization_and_consent.sql",
  "0006_lesson_authoring_and_assignments.sql",
  "0007_learner_version_approvals_and_session_continuation.sql",
  "0008_grade4_curriculum_expansion.sql",
  "0009_version_snapshots_and_legacy_approval_hardening.sql",
  "0010_phase3_science_debate_and_school_years.sql",
  "0011_science_and_debate_parity.sql",
];

function stripLeadingComments(statement) {
  return statement.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Backup drill assertion failed: ${message}`);
  }
}

writeFileSync(
  DRILL_CONFIG_PATH,
  JSON.stringify({
    name: "tai-learning-os-backup-drill",
    keep_vars: false,
    compatibility_date: "2026-10-24",
    d1_databases: [
      {
        binding: "DB",
        database_name: "tai-learning-os-backup-drill",
        database_id: "tai-learning-os-backup-drill-id",
        preview_database_id: "tai-learning-os-backup-drill-id",
      },
    ],
    vars: {
      ENVIRONMENT: "development",
    },
  }),
);

const proxy = await getPlatformProxy({
  configPath: DRILL_CONFIG_PATH,
  persist: { path: DRILL_PERSIST_DIR },
});

try {
  const db = proxy.env.DB;

  // 1. Apply all 11 migrations in order
  for (const file of MIGRATION_FILES) {
    const rawSql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const part of unstable_splitSqlQuery(rawSql)) {
      const stmt = stripLeadingComments(part);
      if (stmt) {
        await db.prepare(stmt).run();
      }
    }
  }

  // 2. Seed all 25 lessons & steps + parent + learner + real learning records
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
       VALUES (?1, ?2, 'Tài', 2016, 4, 'Asia/Ho_Chi_Minh', ?3, ?3)`,
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
  assert(exportedEnvelope.data.lessons.length === 25, `expected 25 lessons in export, got ${exportedEnvelope.data.lessons.length}`);
  assert(exportedEnvelope.data.learningSessions.length === 1, "expected 1 session in export");
  assert(exportedEnvelope.data.learningAttempts.length === 1, "expected 1 attempt in export");
  assert(exportedEnvelope.data.skillEvidence.length === 1, "expected 1 skillEvidence in export");
  assert(exportedEnvelope.data.learningGoals.length === 1, "expected 1 learningGoal in export");

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

  // 5. Cascade-delete the learner record via deleteLearner handler
  const deleteUrl = new URL("http://localhost/api/data/learner");
  const deleteRes = await deleteLearner({
    request: new Request(deleteUrl.toString(), {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ learnerId, confirmation: "XOA Tài" }),
    }),
    url: deleteUrl,
    env: proxy.env,
    parent: parentCtx,
    requestId: crypto.randomUUID(),
  });
  assert(deleteRes.status === 200, `deleteLearner returned HTTP ${deleteRes.status}`);
  const remainingLearners = await db.prepare("SELECT COUNT(*) AS cnt FROM learners").first();
  assert(Number(remainingLearners.cnt) === 0, "learner must be 0 after cascade delete");

  // 6. Decrypt the backup from disk and restore via importRecord handler
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
  assert(importReport.counts.learningSessions === 1, "restored 1 learningSession");
  assert(importReport.counts.learningAttempts === 1, "restored 1 learningAttempt");
  assert(importReport.counts.skillEvidence === 1, "restored 1 skillEvidence");
  assert(importReport.counts.learningGoals === 1, "restored 1 learningGoal");

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
      approvalFailClosedToDraft: restoredApproval?.status === "draft",
    }),
  );
} finally {
  await proxy.dispose();
  rmSync(DRILL_RUNTIME_DIR, { recursive: true, force: true });
}
