import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { summarizeRetention } from "../../src/shared/engine/retention";
import {
  selectBaselineStatus,
  selectHouseholdLearnerId,
  selectRetentionAttempts,
} from "../../src/worker/db/retention-queries";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

/**
 * The delayed-retention queries, against the real D1 stack.
 *
 * The engine's rules are proved in `test/unit/retention-protocol.test.ts`; the
 * thing that can still go wrong here is the SQL — a filter that lets a practice
 * attempt or a parent correction through would hand the engine rows the protocol
 * says it must never count, and no unit test would see it.
 *
 * So this suite seeds rows that are identical apart from the one column each
 * filter depends on, and checks the loader drops exactly those rows. Then it
 * checks the loaded rows and a hand-built expectation produce the same report,
 * which is what "the CLI and the test run the same query" has to mean in
 * practice.
 */

const DAY = 86_400_000;
const ANCHOR_AT = Date.parse("2026-01-05T23:00:00+07:00");

function at(days: number): number {
  return ANCHOR_AT + days * DAY;
}

let proxy: TestProxy;
let env: { DB: D1Database };

type Fixture = {
  learnerId: string;
  lessonId: string;
  skillId: string;
};

let fixture: Fixture;

/**
 * Steps of the fixture lesson, consumed one per seeded attempt.
 *
 * `learning_attempts` is unique on (learner_id, step_id, attempt_no), so two
 * first-try attempts on the same step collide by design — that constraint exists
 * to stop one answer being recorded twice. A probe is a first try by definition,
 * so the fixture needs a fresh step for every attempt rather than a repeated one.
 */
const STEP_POOL_SIZE = 16;
let stepPool: string[] = [];
let stepCursor = 0;

function nextStepId(): string {
  if (stepCursor >= stepPool.length) {
    throw new Error(
      `retention fixture ran out of steps: seed STEP_POOL_SIZE above ${stepCursor}`,
    );
  }
  const stepId = stepPool[stepCursor];
  stepCursor += 1;
  return stepId;
}

beforeAll(async () => {
  proxy = await openTestDatabase();
  env = { DB: proxy.env.DB as unknown as D1Database };
});

afterAll(async () => {
  await proxy.dispose();
});

beforeEach(async () => {
  await resetData(env.DB);
  stepCursor = 0;

  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p-retention', 'Phụ huynh', 'hash', ?1, ?1)",
  )
    .bind(now)
    .run();
  await env.DB.prepare(
    "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('l-retention', 'p-retention', 'Bé Mẫu', 2017, 4, 'Asia/Ho_Chi_Minh', ?1, ?1)",
  )
    .bind(now)
    .run();

  // A lesson of this suite's own, carrying a real seeded skill.
  //
  // The attempt table is unique on (learner_id, step_id, attempt_no) — the
  // duplicate-attempt guard from migration 0004 — and a probe is by definition a
  // FIRST try, so every probe needs its own step. Borrowing a catalogue lesson
  // would cap the fixture at however many steps that lesson happens to have.
  const catalogue = await env.DB.prepare(
    `SELECT skills.id AS skill_id, lessons.subject_id AS subject_id
       FROM skills
       JOIN lessons ON lessons.skill_id = skills.id
      ORDER BY skills.id, lessons.id
      LIMIT 1`,
  ).first<{ skill_id: string; subject_id: string }>();
  expect(catalogue).not.toBeNull();

  await env.DB.prepare(
    `INSERT INTO lessons
       (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en,
        grade_from, grade_to, version, created_at, updated_at)
     VALUES ('les-retention', ?1, ?2, 'Bài đo', 'Measurement lesson', 'Mục tiêu', 'Objective', 4, 4, 1, ?3, ?3)`,
  )
    .bind(catalogue!.subject_id, catalogue!.skill_id, now)
    .run();

  stepPool = [];
  for (let position = 1; position <= STEP_POOL_SIZE; position += 1) {
    const stepId = `step-ret-${position}`;
    await env.DB.prepare(
      `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
       VALUES (?1, 'les-retention', ?2, 'concept', '{}', '{}', 'Giải thích', 1)`,
    )
      .bind(stepId, position)
      .run();
    stepPool.push(stepId);
  }

  fixture = {
    learnerId: "l-retention",
    lessonId: "les-retention",
    skillId: catalogue!.skill_id,
  };
});

type AttemptSeed = {
  id: string;
  createdAt: number;
  outcome?: "correct" | "incorrect" | "partial";
  helpLevel?: number;
  evidenceKind?: "observed" | "assisted" | "parent_correction";
  attemptNo?: number;
  purpose?: "official" | "practice";
  skillId?: string | null;
};

let sessionCounter = 0;

/**
 * One session and one step per attempt, because `learning_attempts` hangs off a
 * session and is unique per (learner, step, attempt number): if these assertions
 * hold, they hold on attempt rows rather than on session bookkeeping.
 */
async function seedAttempt(seed: AttemptSeed): Promise<void> {
  sessionCounter += 1;
  const sessionId = `sess-ret-${sessionCounter}`;
  const stepId = nextStepId();
  await env.DB.prepare(
    `INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
     VALUES (?1, ?2, ?3, 1, NULL, ?4, 'completed', 1)`,
  )
    .bind(sessionId, fixture.learnerId, fixture.lessonId, seed.createdAt)
    .run();

  await env.DB.prepare(
    `INSERT INTO learning_attempts
       (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted,
        outcome, help_level, evidence_kind, attempt_no, purpose, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, '{}', ?7, ?8, ?9, ?10, ?11, ?12)`,
  )
    .bind(
      seed.id,
      sessionId,
      fixture.learnerId,
      fixture.lessonId,
      stepId,
      seed.skillId === undefined ? fixture.skillId : seed.skillId,
      seed.outcome ?? "correct",
      seed.helpLevel ?? 0,
      seed.evidenceKind ?? "observed",
      seed.attemptNo ?? 1,
      seed.purpose ?? "official",
      seed.createdAt,
    )
    .run();
}

describe("selectHouseholdLearnerId", () => {
  it("finds the enrolled learner", async () => {
    expect(await selectHouseholdLearnerId(env.DB)).toBe(fixture.learnerId);
  });

  it("ignores an archived learner", async () => {
    await env.DB.prepare("UPDATE learners SET archived_at = ?1 WHERE id = ?2")
      .bind(Date.now(), fixture.learnerId)
      .run();
    expect(await selectHouseholdLearnerId(env.DB)).toBeNull();
  });

  it("returns null when nobody is enrolled", async () => {
    await env.DB.prepare("DELETE FROM learners").run();
    expect(await selectHouseholdLearnerId(env.DB)).toBeNull();
  });
});

describe("selectRetentionAttempts", () => {
  it("returns attempts oldest first", async () => {
    await seedAttempt({ id: "att-late", createdAt: at(14) });
    await seedAttempt({ id: "att-early", createdAt: ANCHOR_AT });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(["att-early", "att-late"]);
    expect(attempts[0]).toMatchObject({
      skillId: fixture.skillId,
      outcome: "correct",
      helpLevel: 0,
      evidenceKind: "observed",
      attemptNo: 1,
      purpose: "official",
    });
  });

  it("drops practice attempts in SQL, not after the fact", async () => {
    // Seeded as a full independent solve, so only the `purpose` filter can
    // remove it. If this row reached the engine it would add a probe.
    await seedAttempt({ id: "att-official", createdAt: ANCHOR_AT });
    await seedAttempt({ id: "att-practice", createdAt: at(20), purpose: "practice" });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(["att-official"]);
  });

  it("drops parent corrections in SQL", async () => {
    await seedAttempt({ id: "att-official", createdAt: ANCHOR_AT });
    await seedAttempt({
      id: "att-corrected",
      createdAt: at(20),
      evidenceKind: "parent_correction",
    });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(["att-official"]);
  });

  it("drops skill-less attempts in SQL", async () => {
    await seedAttempt({ id: "att-official", createdAt: ANCHOR_AT });
    await seedAttempt({ id: "att-skillless", createdAt: at(20), skillId: null });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(["att-official"]);
  });

  it("keeps assisted and wrong attempts, which are evidence even though they are not solves", async () => {
    await seedAttempt({ id: "att-anchor", createdAt: ANCHOR_AT });
    await seedAttempt({
      id: "att-assisted",
      createdAt: at(14),
      evidenceKind: "assisted",
      helpLevel: 2,
    });
    await seedAttempt({ id: "att-wrong", createdAt: at(21), outcome: "incorrect" });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual([
      "att-anchor",
      "att-assisted",
      "att-wrong",
    ]);
  });

  it("scopes to the learner it was given", async () => {
    await env.DB.prepare(
      "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('l-other', 'p-retention', 'Khác', 2017, 4, 'Asia/Ho_Chi_Minh', ?1, ?1)",
    )
      .bind(Date.now())
      .run();
    await env.DB.prepare(
      `INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, status, steps_seen)
       VALUES ('sess-other', 'l-other', ?1, 1, NULL, ?2, 'completed', 1)`,
    )
      .bind(fixture.lessonId, ANCHOR_AT)
      .run();
    // Same values as the learner's own anchor row, except the learner: the only
    // thing that may hide it is the WHERE clause being scoped.
    await env.DB.prepare(
      `INSERT INTO learning_attempts
         (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted,
          outcome, help_level, evidence_kind, attempt_no, purpose, created_at)
       VALUES ('att-other', 'sess-other', 'l-other', ?1, ?2, 1, ?3, '{}', 'correct', 0, 'observed', 1, 'official', ?4)`,
    )
      .bind(fixture.lessonId, "step-ret-1", fixture.skillId, ANCHOR_AT)
      .run();
    await seedAttempt({ id: "att-mine", createdAt: ANCHOR_AT });

    const attempts = await selectRetentionAttempts(env.DB, fixture.learnerId);
    expect(attempts.map((attempt) => attempt.attemptId)).toEqual(["att-mine"]);
  });
});

describe("retention over the loaded rows", () => {
  it("reports a 14-day probe and a still-unanswered 30-day horizon", async () => {
    await seedAttempt({ id: "att-anchor", createdAt: ANCHOR_AT });
    await seedAttempt({ id: "att-probe", createdAt: at(14) });

    const report = summarizeRetention(
      await selectRetentionAttempts(env.DB, fixture.learnerId),
    );

    expect(report.eligibleAttempts).toBe(2);
    expect(report.skillsWithAnchor).toBe(1);
    expect(report.skillsSeen).toEqual([fixture.skillId]);

    const fourteen = report.horizons.find((horizon) => horizon.horizonDays === 14);
    expect(fourteen?.probes).toBe(1);
    expect(fourteen?.correctRate).toBe(1);

    const thirty = report.horizons.find((horizon) => horizon.horizonDays === 30);
    expect(thirty?.probes).toBe(0);
    expect(thirty?.correctRate).toBeNull();
  });

  it("reports null rates on a real but too-recent history", async () => {
    // The exact state a freshly-started household will be in: attempts exist,
    // nothing is old enough to measure. A 0 here would read as total forgetting.
    await seedAttempt({ id: "att-1", createdAt: ANCHOR_AT });
    await seedAttempt({ id: "att-2", createdAt: at(2) });

    const report = summarizeRetention(
      await selectRetentionAttempts(env.DB, fixture.learnerId),
    );
    expect(report.eligibleAttempts).toBe(2);
    expect(report.horizons.every((horizon) => horizon.correctRate === null)).toBe(true);
  });

  it("reports nothing at all on an empty household database", async () => {
    const report = summarizeRetention(
      await selectRetentionAttempts(env.DB, fixture.learnerId),
    );
    expect(report.eligibleAttempts).toBe(0);
    expect(report.skillsWithAnchor).toBe(0);
    expect(report.horizons.every((horizon) => horizon.probes === 0)).toBe(true);
  });
});

describe("selectBaselineStatus", () => {
  async function seedBaseline(id: string, status: "pending" | "completed" | "reviewed") {
    await env.DB.prepare(
      `INSERT INTO baseline_assessments (id, learner_id, subject_id, status, created_at)
       SELECT ?1, ?2, id, ?3, ?4 FROM subjects ORDER BY id LIMIT 1`,
    )
      .bind(id, fixture.learnerId, status, ANCHOR_AT)
      .run();
  }

  it("reports zero of zero when no baseline was run", async () => {
    expect(await selectBaselineStatus(env.DB, fixture.learnerId)).toEqual({
      total: 0,
      reviewed: 0,
    });
  });

  it("counts every baseline row and the reviewed subset", async () => {
    await seedBaseline("base-1", "pending");
    await seedBaseline("base-2", "completed");
    await seedBaseline("base-3", "reviewed");

    expect(await selectBaselineStatus(env.DB, fixture.learnerId)).toEqual({
      total: 3,
      reviewed: 1,
    });
  });
});
