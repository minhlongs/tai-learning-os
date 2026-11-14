/**
 * Delayed-retention drill (`npm run retention:drill`).
 *
 * `npm run retention:report` measures a real child, and the household database
 * currently holds no attempts, so the report answers `NO_DATA`. That is the
 * honest answer, but it means the instrument itself has never produced a number.
 * This drill produces one, on a timeline whose answer is known in advance, and
 * then asserts it: if the query, the engine or the CLI start disagreeing with
 * the protocol, the drill fails instead of printing a plausible figure.
 *
 * Safety invariant: never opens `.wrangler/state`, never touches `.dev.vars`,
 * never writes to the household learner's database. The whole run happens in a
 * fresh `os.tmpdir()` directory that is deleted on exit.
 *
 * The drill also exercises the CLI's reader the way the CLI uses it — a second
 * connection opened with `{ readOnly: true }` behind `createReadOnlyD1Adapter` —
 * and then proves that connection cannot write.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { createReadOnlyD1Adapter } from "./household-preflight.mjs";
import { listShippedMigrationFiles } from "./migrate-local-d1.mjs";
import { registerTsSpecifiers } from "./resolve-ts-specifiers.mjs";
import { createSqliteD1Adapter, miniflareD1SqliteFilename, splitSqlStatements } from "./seed-lessons.mjs";

registerTsSpecifiers();

const { summarizeRetention } = await import("../src/shared/engine/retention.ts");
const { selectHouseholdLearnerId, selectRetentionAttempts, selectBaselineStatus } = await import(
  "../src/worker/db/retention-queries.ts"
);
const { parseRetentionCliArgs, retentionStatus } = await import("./retention-report.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "migrations");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Retention drill assertion failed: ${message}`);
  }
}

const DAY = 86_400_000;
/** 23:00 Vietnam time, so a calendar-day count and an elapsed-time count disagree. */
const ANCHOR_AT = Date.parse("2026-01-05T23:00:00+07:00");
const at = (days) => ANCHOR_AT + days * DAY;

const RUNTIME_DIR = mkdtempSync(join(tmpdir(), "tai-learning-os-retention-drill-"));
const D1_DIR = join(RUNTIME_DIR, "d1", "miniflare-D1DatabaseObject");
mkdirSync(D1_DIR, { recursive: true });
const SQLITE_PATH = join(D1_DIR, miniflareD1SqliteFilename("tai-learning-os-retention-drill-id"));

/**
 * The timeline, and the answer it must produce.
 *
 * Each skill is a separate question:
 *   math-frac-equiv  solved at 0 and 14, then failed at 44 — a 14-day retention
 *                    success followed by a 30-day loss (44 is 30 dates after 14).
 *   vie-evidence     solved at 0, still solved at 31 — a clean month.
 *   math-area        solved at 0, failed at 15, solved at 45 — the 30-day gap is
 *                    measured from the day-0 solve, because she never solved it
 *                    unaided in between.
 *   vie-sentence-clear solved twice within a week — evidence, but too soon to
 *                    probe at either horizon.
 * Plus a practice attempt and a parent correction that must never be counted.
 */
const TIMELINE = [
  { id: "att-a0", skill: "math-frac-equiv", day: 0 },
  { id: "att-a14", skill: "math-frac-equiv", day: 14 },
  { id: "att-a44", skill: "math-frac-equiv", day: 44, outcome: "incorrect" },
  { id: "att-practice", skill: "math-frac-equiv", day: 20, purpose: "practice" },
  { id: "att-corrected", skill: "math-frac-equiv", day: 30, evidenceKind: "parent_correction" },
  { id: "att-b0", skill: "vie-evidence", day: 0 },
  { id: "att-b31", skill: "vie-evidence", day: 31 },
  { id: "att-c0", skill: "math-area", day: 0 },
  { id: "att-c15", skill: "math-area", day: 15, outcome: "incorrect" },
  { id: "att-c45", skill: "math-area", day: 45 },
  { id: "att-d0", skill: "vie-sentence-clear", day: 0 },
  { id: "att-d5", skill: "vie-sentence-clear", day: 5 },
];

const SKILLS = [...new Set(TIMELINE.map((row) => row.skill))];
const LESSON_BY_SKILL = {
  "math-frac-equiv": { id: "lesson-frac", subject: "math" },
  "vie-evidence": { id: "lesson-evidence", subject: "vietnamese" },
  "math-area": { id: "lesson-area", subject: "math" },
  "vie-sentence-clear": { id: "lesson-clear", subject: "vietnamese" },
};

const rawDb = new DatabaseSync(SQLITE_PATH);
rawDb.exec("PRAGMA foreign_keys = ON;");

try {
  for (const file of listShippedMigrationFiles()) {
    for (const statement of splitSqlStatements(readFileSync(join(MIGRATIONS_DIR, file), "utf8"))) {
      rawDb.exec(statement);
    }
  }

  const db = createSqliteD1Adapter(rawDb);
  const now = ANCHOR_AT;

  await db
    .prepare(
      `INSERT INTO parents (id, password_hash, display_name, created_at, updated_at)
       VALUES ('p-drill', 'pbkdf2:600000:salt:hash', 'Phụ huynh Drill', ?1, ?1)`,
    )
    .bind(now)
    .run();
  await db
    .prepare(
      `INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at)
       VALUES ('l-drill', 'p-drill', 'Bé Mẫu', 2017, 4, 'Asia/Ho_Chi_Minh', ?1, ?1)`,
    )
    .bind(now)
    .run();

  // One lesson per skill, each with enough steps for every attempt to sit on its
  // own: the attempt table is unique on (learner, step, attempt number), and a
  // probe is a first try by definition.
  for (const skillId of SKILLS) {
    const lesson = LESSON_BY_SKILL[skillId];
    await db
      .prepare(
        `INSERT INTO lessons
           (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
            grade_from, grade_to, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'Bài drill', 'Drill lesson', 'Mục tiêu', 'Objective', 4, 4, 1, ?4, ?4)`,
      )
      .bind(lesson.id, lesson.subject, skillId, now)
      .run();
    for (let position = 1; position <= 6; position += 1) {
      await db
        .prepare(
          `INSERT INTO lesson_steps
             (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
           VALUES (?1, ?2, ?3, 'concept', '{}', '{}', 'Giải thích', 1)`,
        )
        .bind(`${lesson.id}-step-${position}`, lesson.id, position)
        .run();
    }
  }

  const stepCursor = new Map();
  for (const [index, row] of TIMELINE.entries()) {
    const lesson = LESSON_BY_SKILL[row.skill];
    const next = (stepCursor.get(lesson.id) ?? 0) + 1;
    stepCursor.set(lesson.id, next);
    const sessionId = `sess-drill-${index + 1}`;
    const createdAt = at(row.day);

    await db
      .prepare(
        `INSERT INTO learning_sessions
           (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
         VALUES (?1, 'l-drill', ?2, 1, NULL, ?3, 'completed', 1)`,
      )
      .bind(sessionId, lesson.id, createdAt)
      .run();

    await db
      .prepare(
        `INSERT INTO learning_attempts
           (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted,
            outcome, help_level, evidence_kind, attempt_no, purpose, created_at)
         VALUES (?1, ?2, 'l-drill', ?3, ?4, 1, ?5, '{}', ?6, 0, ?7, 1, ?8, ?9)`,
      )
      .bind(
        row.id,
        sessionId,
        lesson.id,
        `${lesson.id}-step-${next}`,
        row.skill,
        row.outcome ?? "correct",
        row.evidenceKind ?? "observed",
        row.purpose ?? "official",
        createdAt,
      )
      .run();
  }

  // Two baselines, one reviewed: the second half of the protocol, counted.
  await db
    .prepare(
      `INSERT INTO baseline_assessments (id, learner_id, subject_id, status, created_at)
       VALUES ('base-drill-1', 'l-drill', 'math', 'reviewed', ?1),
              ('base-drill-2', 'l-drill', 'vietnamese', 'completed', ?1)`,
    )
    .bind(now)
    .run();

  rawDb.close();

  // From here on the run uses the CLI's own reader: a separate connection opened
  // read-only, behind the adapter that refuses every write.
  const readonlyDb = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  try {
    const reader = createReadOnlyD1Adapter(readonlyDb);

    const learnerId = await selectHouseholdLearnerId(reader);
    assert(learnerId === "l-drill", `expected the enrolled learner, got ${String(learnerId)}`);

    const attempts = await selectRetentionAttempts(reader, learnerId);
    const report = summarizeRetention(attempts);
    const baselines = await selectBaselineStatus(reader, learnerId);

    const [fourteen, thirty] = report.horizons;

    // Exactly the rows the protocol admits, in ledger order.
    //
    // Naming the ids is what makes the SQL filter load-bearing here: asserting
    // only a count leaves the filter free to swap one excluded row for another,
    // and asserting only the summary leaves it free to be redundant with the
    // engine's own filter, so removing it would change nothing observable.
    assert(
      attempts.map((attempt) => attempt.attemptId).join(",") ===
        "att-a0,att-b0,att-c0,att-d0,att-d5,att-a14,att-c15,att-b31,att-a44,att-c45",
      `loaded attempts: ${attempts.map((attempt) => attempt.attemptId).join(",")}`,
    );

    // The engine's filter is proved separately, on a list built here, because a
    // row the SQL never returns cannot show whether the engine would have
    // dropped it. Both filters must hold on their own: the query is what keeps
    // practice out of every other reader, and the engine is the last line if a
    // new caller forgets to filter.
    const engineOnly = summarizeRetention([
      { attemptId: "e-anchor", skillId: "s", outcome: "correct", helpLevel: 0, evidenceKind: "observed", attemptNo: 1, purpose: "official", createdAt: at(0) },
      { attemptId: "e-practice", skillId: "s", outcome: "correct", helpLevel: 0, evidenceKind: "observed", attemptNo: 1, purpose: "practice", createdAt: at(20) },
      { attemptId: "e-corrected", skillId: "s", outcome: "correct", helpLevel: 0, evidenceKind: "parent_correction", attemptNo: 1, purpose: "official", createdAt: at(21) },
    ]);
    assert(
      engineOnly.eligibleAttempts === 1,
      `engine admitted ${engineOnly.eligibleAttempts} of 3 attempts, expected only the anchor`,
    );
    assert(
      engineOnly.horizons.every((horizon) => horizon.probes === 0),
      "practice and parent-recorded corrections must never produce a probe",
    );

    // The filters: 12 seeded attempts, minus one practice and one parent
    // correction.
    assert(report.eligibleAttempts === 10, `eligible attempts 10, got ${report.eligibleAttempts}`);
    assert(report.skillsSeen.length === 4, `skills seen 4, got ${report.skillsSeen.length}`);
    assert(report.skillsWithAnchor === 4, `skills with an anchor 4, got ${report.skillsWithAnchor}`);

    // 14 days: a14, a44, b31, c15. Two correct (a14, b31), both unaided.
    assert(fourteen.probes === 4, `14-day probes 4, got ${fourteen.probes}`);
    assert(fourteen.correct === 2, `14-day correct 2, got ${fourteen.correct}`);
    assert(fourteen.independent === 2, `14-day independent 2, got ${fourteen.independent}`);
    assert(fourteen.correctRate === 0.5, `14-day rate 0.5, got ${String(fourteen.correctRate)}`);

    // 30 days: a44 (measured from a14, a loss), b31, c45 (measured from c0, because
    // the failure at c15 never reset an anchor that was already solved).
    assert(thirty.probes === 3, `30-day probes 3, got ${thirty.probes}`);
    assert(thirty.correct === 2, `30-day correct 2, got ${thirty.correct}`);
    assert(
      Math.abs(thirty.correctRate - 2 / 3) < 1e-12,
      `30-day rate 2/3, got ${String(thirty.correctRate)}`,
    );

    // Per-skill detail is what tells a parent which skill decayed.
    assert(
      fourteen.bySkill.map((row) => `${row.skillId}:${row.correct}/${row.probes}`).join(",") ===
        "math-area:0/1,math-frac-equiv:1/2,vie-evidence:1/1",
      `14-day per-skill detail: ${JSON.stringify(fourteen.bySkill)}`,
    );

    assert(baselines.total === 2, `baseline rows 2, got ${baselines.total}`);
    assert(baselines.reviewed === 1, `reviewed baselines 1, got ${baselines.reviewed}`);

    assert(retentionStatus(report) === "MEASURED", "a report with probes must be MEASURED");
    assert(
      retentionStatus(summarizeRetention([])) === "NO_DATA",
      "an empty history must be NO_DATA, not a zero-percent measurement",
    );
    assert(
      retentionStatus(summarizeRetention(attempts.slice(0, 1))) === "AWAITING_PROBES",
      "attempts with no probe yet must be AWAITING_PROBES",
    );

    // The CLI must refuse a flag it does not understand rather than ignore it.
    let refused = false;
    try {
      parseRetentionCliArgs(["--not-a-flag"]);
    } catch {
      refused = true;
    }
    assert(refused, "retention:report must reject an unknown flag");

    // The reader is genuinely read-only: the household database cannot be
    // altered by running the report.
    let writeRefused = false;
    try {
      await reader
        .prepare("UPDATE learners SET nickname = 'x' WHERE id = 'l-drill'")
        .run();
    } catch {
      writeRefused = true;
    }
    assert(writeRefused, "the read-only adapter must refuse a write");

    console.log(
      JSON.stringify({
        ok: true,
        drill: "delayed-retention-14-30",
        status: retentionStatus(report),
        eligibleAttempts: report.eligibleAttempts,
        skillsSeen: report.skillsSeen.length,
        skillsWithAnchor: report.skillsWithAnchor,
        baselines,
        horizons: report.horizons.map((horizon) => ({
          horizonDays: horizon.horizonDays,
          probes: horizon.probes,
          correct: horizon.correct,
          correctRate: horizon.correctRate,
        })),
        writeRefused,
      }),
    );
  } finally {
    readonlyDb.close();
  }
} finally {
  try {
    rawDb.close();
  } catch {
    // Already closed on the happy path; a double close must not mask the real error.
  }
  rmSync(RUNTIME_DIR, { recursive: true, force: true });
}
