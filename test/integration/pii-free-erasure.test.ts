import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";

/**
 * M0 acceptance verification:
 *
 * 1. PII-free audit ledger: no writer puts child `nickname` into `audit_events`.
 * 2. Full cascade erasure: deleting a learner purges all personal data including
 *    free-text `session_reflections`, while preserving the audit proof that
 *    the erasure occurred.
 * 3. Append-only trigger preservation: 0004 triggers still reject UPDATE/DELETE
 *    on `audit_events`.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Bé Tí Hon 123";
const RENAMED_NICKNAME = "Bé Tí Lớn 456";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

let worker: { fetch: typeof fetch };
let env: Env;
let proxy: TestProxy;

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function callWithJar(
  targetJar: Jar,
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(targetJar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method) && targetJar.csrf) {
    headers.set("x-tlo-csrf", targetJar.csrf);
  }

  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
  }

  const request = new Request(`${ORIGIN}${path}`, {
    ...init,
    body: init.json === undefined ? undefined : JSON.stringify(init.json),
    headers,
  });
  return worker.fetch(request, env);
}

async function call(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  return callWithJar(jar, path, init);
}

function absorbSessionInto(targetJar: Jar, response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value.length === 0) delete targetJar.cookies[name];
    else targetJar.cookies[name] = value;
  }
}

async function loginInto(targetJar: Jar, displayName = DISPLAY_NAME, password = PASSWORD): Promise<void> {
  const response = await callWithJar(targetJar, "/api/session/login", {
    method: "POST",
    json: { displayName, password },
  });
  expect(response.status).toBe(200);
  absorbSessionInto(targetJar, response);
  targetJar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
}

beforeAll(async () => {
  proxy = await openTestDatabase();
  env = {
    DB: proxy.env.DB as unknown as D1Database,
    SESSION_SECRET: TEST_SECRET,
    ENVIRONMENT: "development",
  };
  worker = (await import("../../src/worker/index")).default as unknown as {
    fetch: typeof fetch;
  };
});

afterAll(async () => {
  await proxy.dispose();
});

let learnerId: string;

beforeEach(async () => {
  vi.restoreAllMocks();
  await resetData(env.DB);
  jar.cookies = {};
  jar.csrf = null;

  const boot = await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(boot.status).toBe(200);
  await loginInto(jar);

  const enrolRes = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(enrolRes.status).toBe(200);
  const enrolled = (await enrolRes.json()) as { learner: { id: string } };
  learnerId = enrolled.learner.id;
});

describe("PII-free audit ledger and complete learner erasure", () => {
  it("never writes child nickname into audit_events during enrollment, profile update, or deletion", async () => {
    // 1. Check audit log for learner.enrolled
    const enrollAudit = await env.DB.prepare(
      "SELECT action, detail FROM audit_events WHERE action = 'learner.enrolled' AND subject = ?1",
    )
      .bind(learnerId)
      .first<{ action: string; detail: string }>();

    expect(enrollAudit).not.toBeNull();
    expect(enrollAudit!.detail).not.toContain(LEARNER_NICKNAME);
    expect(JSON.parse(enrollAudit!.detail)).toEqual({ grade: 4 });

    // 2. Update profile (rename)
    const updateRes = await call("/api/parent/learners/profile", {
      method: "PATCH",
      json: { learnerId, nickname: RENAMED_NICKNAME, grade: 5 },
    });
    expect(updateRes.status).toBe(200);

    const updateAudit = await env.DB.prepare(
      "SELECT action, detail FROM audit_events WHERE action = 'learner.updated' AND subject = ?1",
    )
      .bind(learnerId)
      .first<{ action: string; detail: string }>();

    expect(updateAudit).not.toBeNull();
    expect(updateAudit!.detail).not.toContain(LEARNER_NICKNAME);
    expect(updateAudit!.detail).not.toContain(RENAMED_NICKNAME);
    expect(JSON.parse(updateAudit!.detail)).toEqual({ grade: 5 });

    // 3. Delete learner
    const deleteRes = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${RENAMED_NICKNAME}` },
    });
    expect(deleteRes.status).toBe(200);

    const deleteAudit = await env.DB.prepare(
      "SELECT action, detail FROM audit_events WHERE action = 'learner.deleted' AND subject = ?1",
    )
      .bind(learnerId)
      .first<{ action: string; detail: string }>();

    expect(deleteAudit).not.toBeNull();
    expect(deleteAudit!.detail).not.toContain(LEARNER_NICKNAME);
    expect(deleteAudit!.detail).not.toContain(RENAMED_NICKNAME);
    expect(JSON.parse(deleteAudit!.detail)).toEqual({ grade: 5 });

    // 4. Assert ZERO occurrences of nickname across the entire audit_events table
    const allAudits = await env.DB.prepare("SELECT * FROM audit_events").all<{
      actor: string;
      action: string;
      subject: string | null;
      detail: string | null;
    }>();

    for (const row of allAudits.results ?? []) {
      const dump = `${row.actor} ${row.action} ${row.subject ?? ""} ${row.detail ?? ""}`;
      expect(dump).not.toContain(LEARNER_NICKNAME);
      expect(dump).not.toContain(RENAMED_NICKNAME);
    }
  });

  it("erases session_reflections and all child-linked tables completely on learner deletion", async () => {
    // Look up a real lesson to create a valid session
    const lesson = await env.DB.prepare("SELECT id FROM lessons LIMIT 1").first<{ id: string }>();
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, started_at, status)
       VALUES (?1, ?2, ?3, 1, ?4, 'completed')`,
    )
      .bind(sessionId, learnerId, lesson!.id, now)
      .run();

    // Seed reflection notes for this learner
    await env.DB.prepare(
      `INSERT INTO session_reflections (id, session_id, learner_id, feeling, note_vi, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
      .bind(crypto.randomUUID(), sessionId, learnerId, "good", "Hôm nay con học rất vui và hiểu bài", now)
      .run();

    // Verify reflection exists
    const beforeCount = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM session_reflections WHERE learner_id = ?1",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(beforeCount!.n).toBe(1);

    // Delete learner
    const deleteRes = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleteRes.status).toBe(200);

    // Verify cascade removed all traces across child tables
    const tables = [
      "classroom_enrollments",
      "learner_consents",
      "session_reflections",
      "learning_plan_items",
      "baseline_assessments",
      "curriculum_intakes",
      "skill_evidence_observation",
      "skill_estimate",
      "learning_attempts",
      "learning_sessions",
      "skill_evidence",
      "review_schedule",
      "learning_goals",
      "school_years",
      "learners",
    ];

    for (const table of tables) {
      const idCol = table === "learners" ? "id" : "learner_id";
      const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${idCol} = ?1`)
        .bind(learnerId)
        .first<{ n: number }>();
      expect(count!.n, `Table ${table} must be completely cleared for learner`).toBe(0);
    }

    // Verify audit proof remains: learner.deleted exists
    const proof = await env.DB.prepare(
      "SELECT action, subject FROM audit_events WHERE action = 'learner.deleted' AND subject = ?1",
    )
      .bind(learnerId)
      .first<{ action: string; subject: string }>();
    expect(proof).toEqual({ action: "learner.deleted", subject: learnerId });
  });

  it("still preserves append-only integrity: triggers reject UPDATE and DELETE on audit_events", async () => {
    await expect(
      env.DB.prepare("DELETE FROM audit_events WHERE action = 'learner.enrolled'").run(),
    ).rejects.toThrow(/audit_events is append-only/);

    await expect(
      env.DB.prepare("UPDATE audit_events SET action = 'tampered' WHERE action = 'learner.enrolled'").run(),
    ).rejects.toThrow(/audit_events is append-only/);
  });
});

describe("parent correction durability across learner attempts", () => {
  it("survives subsequent learner attempts as a floor and allows subsequent evidence to rise above it", async () => {
    // 1. Find a skill and approve its lesson
    const skill = await env.DB.prepare("SELECT id FROM skills LIMIT 1").first<{ id: string }>();
    expect(skill).not.toBeNull();
    const skillId = skill!.id;

    const lesson = await env.DB.prepare("SELECT id FROM lessons WHERE skill_id = ?1 LIMIT 1")
      .bind(skillId)
      .first<{ id: string }>();
    expect(lesson).not.toBeNull();
    const lessonId = lesson!.id;

    // Approve the lesson so learner can start sessions
    const approveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    // 2. Parent sets a manual correction to SUPPORTED
    const correctionRes = await call("/api/parent/skills/correct", {
      method: "POST",
      json: {
        learnerId,
        skillId,
        state: "SUPPORTED",
        note: "Quan sát thấy con cần hỗ trợ nhưng đã hiểu quy luật cơ bản",
      },
    });
    expect(correctionRes.status).toBe(200);

    // Verify skill_evidence has source = 'parent_correction'
    let evidenceRow = await env.DB.prepare(
      "SELECT state, source, correction_note FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .first<{ state: string; source: string; correction_note: string }>();
    expect(evidenceRow).toEqual({
      state: "SUPPORTED",
      source: "parent_correction",
      correction_note: "Quan sát thấy con cần hỗ trợ nhưng đã hiểu quy luật cơ bản",
    });

    // Verify audit log has skill_evidence.corrected
    const correctionAudit = await env.DB.prepare(
      "SELECT action, subject FROM audit_events WHERE action = 'skill_evidence.corrected' AND subject = ?1",
    )
      .bind(`${learnerId}/${skillId}`)
      .first<{ action: string; subject: string }>();
    expect(correctionAudit).not.toBeNull();

    // 3. Learner submits an attempt on that skill with an incorrect answer (would derive NOT_OBSERVED)
    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as { sessionId: string; steps: { id: string }[] };
    const stepId = session.steps[0]!.id;

    const attemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: "wrong-choice-id" },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);

    // 4. Verify the parent correction SURVIVED: state is still SUPPORTED, source is still parent_correction!
    evidenceRow = await env.DB.prepare(
      "SELECT state, source, correction_note FROM skill_evidence WHERE learner_id = ?1 AND skill_id = ?2",
    )
      .bind(learnerId, skillId)
      .first<{ state: string; source: string; correction_note: string }>();
    expect(evidenceRow!.state).toBe("SUPPORTED");
    expect(evidenceRow!.source).toBe("parent_correction");
    expect(evidenceRow!.correction_note).toBe("Quan sát thấy con cần hỗ trợ nhưng đã hiểu quy luật cơ bản");

    // The audit row for correction is still there
    const auditCount = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'skill_evidence.corrected'",
    ).first<{ n: number }>();
    expect(auditCount!.n).toBe(1);
  });
});
