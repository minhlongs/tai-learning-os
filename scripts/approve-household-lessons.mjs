/**
 * Idempotent CLI helper for approving household lessons (`npm run household:approve-lessons`).
 *
 * Opens the local household D1 SQLite file directly via `node:sqlite`
 * `DatabaseSync`, verifies single-household isolation (1 parent, 1 active
 * learner, 0 organizations/classrooms), and approves eligible catalogue/family
 * lessons for the registered learner.
 *
 * By default (when no `--all`, `--grade`, `--subject`, or `--lesson` filter is
 * passed), approves all lessons matching the learner's enrolled grade (e.g.
 * Grade 4 for Tài). Records both `review_approvals` and `audit_events`
 * (`lesson.approval.approved` attributed to `parent:<parentId>`) atomically in
 * a single transaction, skipping lessons already approved at their live version.
 *
 * Usage:
 *   npm run household:approve-lessons
 *   npm run household:approve-lessons -- --grade 4
 *   npm run household:approve-lessons -- --subject math --grade 4
 *   npm run household:approve-lessons -- --lesson math-g4-fractions-equivalent
 *   npm run household:approve-lessons -- --all
 *   node scripts/approve-household-lessons.mjs --target-root <dir>
 */
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

export function parseApproveLessonsCliArgs(argv) {
  let targetRoot = process.cwd();
  let grade = null;
  let subject = null;
  const lessonIds = [];
  let all = false;
  let note = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target-root" && i + 1 < argv.length) {
      targetRoot = resolve(argv[i + 1]);
      i += 1;
    } else if (arg === "--grade" && i + 1 < argv.length) {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`Invalid --grade value: ${argv[i + 1]}`);
      }
      grade = parsed;
      i += 1;
    } else if (arg === "--subject" && i + 1 < argv.length) {
      subject = argv[i + 1].trim();
      i += 1;
    } else if (arg === "--lesson" && i + 1 < argv.length) {
      for (const part of argv[i + 1].split(",")) {
        const trimmed = part.trim();
        if (trimmed) lessonIds.push(trimmed);
      }
      i += 1;
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--note" && i + 1 < argv.length) {
      note = argv[i + 1];
      i += 1;
    }
  }

  return {
    targetRoot,
    grade,
    subject,
    lessonIds,
    all,
    note,
  };
}

/**
 * Atomically and idempotently approves matching lessons for the single
 * registered household learner.
 */
export function approveHouseholdLessons(rawDb, options = {}, now = Date.now()) {
  const counts = rawDb
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM parents) AS parents_count,
         (SELECT COUNT(*) FROM learners WHERE archived_at IS NULL) AS learners_count,
         (SELECT COUNT(*) FROM organizations) AS organizations_count,
         (SELECT COUNT(*) FROM classrooms) AS classrooms_count`,
    )
    .get();

  const parentsCount = Number(counts?.parents_count ?? 0);
  const learnersCount = Number(counts?.learners_count ?? 0);
  const organizationsCount = Number(counts?.organizations_count ?? 0);
  const classroomsCount = Number(counts?.classrooms_count ?? 0);

  if (
    parentsCount > 1 ||
    learnersCount > 1 ||
    organizationsCount !== 0 ||
    classroomsCount !== 0
  ) {
    throw new Error(
      `Household lesson approval refused: multi-learner or organization pollution detected ` +
        `(parentsCount=${parentsCount}, learnersCount=${learnersCount}, ` +
        `organizationsCount=${organizationsCount}, classroomsCount=${classroomsCount})`,
    );
  }

  if (parentsCount === 0 || learnersCount === 0) {
    throw new Error(
      "Household lesson approval refused: household parent or learner profile not found in D1.",
    );
  }

  const parent = rawDb
    .prepare("SELECT id, display_name FROM parents ORDER BY created_at ASC LIMIT 1")
    .get();
  const learner = rawDb
    .prepare(
      "SELECT id, parent_id, nickname, grade FROM learners WHERE parent_id = ? AND archived_at IS NULL ORDER BY created_at ASC LIMIT 1",
    )
    .get(String(parent.id));

  if (!learner) {
    throw new Error(
      "Household lesson approval refused: active learner profile does not belong to the household parent.",
    );
  }

  const parentId = String(parent.id);
  const learnerId = String(learner.id);
  const learnerNickname = String(learner.nickname);
  const learnerGrade = learner.grade === null || learner.grade === undefined ? null : Number(learner.grade);

  const requestedLessonIds = Array.isArray(options.lessonIds) ? options.lessonIds : [];
  const hasExplicitFilter =
    Boolean(options.all) ||
    (options.grade !== null && options.grade !== undefined) ||
    Boolean(options.subject) ||
    requestedLessonIds.length > 0;

  const targetGrade = hasExplicitFilter
    ? (options.grade ?? null)
    : (learnerGrade ?? 4);

  let sql = `
    SELECT l.id, l.version
    FROM lessons l
    WHERE (
      l.ownership_type IS NULL
      OR l.ownership_type = 'catalogue'
      OR (l.ownership_type = 'family' AND l.owner_parent_id = ?)
    )
    AND l.id NOT IN (SELECT lesson_id FROM organization_lessons)
  `;
  const binds = [parentId];

  if (targetGrade !== null && targetGrade !== undefined) {
    sql += " AND l.grade_from <= ? AND l.grade_to >= ?";
    binds.push(Number(targetGrade), Number(targetGrade));
  }
  if (options.subject) {
    sql += " AND l.subject_id = ?";
    binds.push(String(options.subject));
  }
  if (requestedLessonIds.length > 0) {
    const placeholders = requestedLessonIds.map(() => "?").join(", ");
    sql += ` AND l.id IN (${placeholders})`;
    binds.push(...requestedLessonIds);
  }
  sql += " ORDER BY l.subject_id ASC, l.grade_from ASC, l.id ASC";

  const candidateLessons = rawDb.prepare(sql).all(...binds);
  if (candidateLessons.length === 0) {
    throw new Error(
      "Household lesson approval refused: no eligible lessons matched the requested filter.",
    );
  }

  const normalizedNote =
    typeof options.note === "string" && options.note.length > 0
      ? options.note.slice(0, 500)
      : null;

  let newlyApprovedCount = 0;
  let alreadyApprovedCount = 0;
  const approvedLessonIds = [];

  const selectExistingStmt = rawDb.prepare(
    `SELECT status, decided_by
     FROM review_approvals
     WHERE learner_id = ? AND lesson_id = ? AND lesson_version = ?`,
  );
  const upsertApprovalStmt = rawDb.prepare(
    `INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
     VALUES (?, ?, ?, ?, 'approved', ?, ?, ?)
     ON CONFLICT(learner_id, lesson_id, lesson_version) DO UPDATE SET
       status = excluded.status,
       decided_by = excluded.decided_by,
       decided_at = excluded.decided_at,
       note = excluded.note`,
  );
  const insertAuditStmt = rawDb.prepare(
    `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
     VALUES (?, ?, 'lesson.approval.approved', ?, ?, ?)`,
  );

  rawDb.exec("BEGIN IMMEDIATE;");
  try {
    for (const row of candidateLessons) {
      const lessonId = String(row.id);
      const version = Number(row.version);
      const existing = selectExistingStmt.get(learnerId, lessonId, version);
      if (
        existing &&
        String(existing.status) === "approved" &&
        String(existing.decided_by) === parentId
      ) {
        alreadyApprovedCount += 1;
        continue;
      }

      upsertApprovalStmt.run(
        randomUUID(),
        learnerId,
        lessonId,
        version,
        parentId,
        now,
        normalizedNote,
      );
      insertAuditStmt.run(
        randomUUID(),
        `parent:${parentId}`,
        lessonId,
        JSON.stringify({
          note: normalizedNote === null ? null : normalizedNote.length,
          learnerId,
          version,
        }),
        now,
      );
      newlyApprovedCount += 1;
      approvedLessonIds.push(lessonId);
    }
    rawDb.exec("COMMIT;");
  } catch (error) {
    try {
      rawDb.exec("ROLLBACK;");
    } catch {
      // Ignore rollback error if transaction already closed.
    }
    throw error;
  }

  const totalApprovedRow = rawDb
    .prepare(
      `SELECT COUNT(DISTINCT ra.lesson_id) AS approved_count
       FROM review_approvals ra
       JOIN lessons l ON l.id = ra.lesson_id AND l.version = ra.lesson_version
       WHERE ra.learner_id = ? AND ra.decided_by = ? AND ra.status = 'approved'`,
    )
    .get(learnerId, parentId);
  const totalApprovedCount = Number(totalApprovedRow?.approved_count ?? 0);

  return {
    ok: true,
    parentId,
    learnerId,
    learnerNickname,
    targetGrade,
    newlyApprovedCount,
    alreadyApprovedCount,
    totalApprovedCount,
    readyForLearnerSession: totalApprovedCount > 0,
    approvedLessonIds,
  };
}

const isMainModule =
  Boolean(process.argv[1]) &&
  existsSync(resolve(process.argv[1])) &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));

if (isMainModule) {
  let parsedArgs;
  try {
    parsedArgs = parseApproveLessonsCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`approval refused: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const d1StateDir = join(
    parsedArgs.targetRoot,
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject",
  );
  const sqliteFile = existsSync(d1StateDir)
    ? readdirSync(d1StateDir).find((name) => /^[0-9a-f]+\.sqlite$/i.test(name))
    : undefined;

  if (!existsSync(d1StateDir) || !sqliteFile) {
    console.error(
      `approval refused: local D1 SQLite database not found in ${d1StateDir}. Run "npm run db:migrate && npm run seed:demo" first.`,
    );
    process.exit(1);
  }

  const rawDb = new DatabaseSync(join(d1StateDir, sqliteFile));
  try {
    rawDb.exec("PRAGMA foreign_keys = ON;");
    const report = approveHouseholdLessons(rawDb, parsedArgs);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error(`approval failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    rawDb.close();
  }
}
