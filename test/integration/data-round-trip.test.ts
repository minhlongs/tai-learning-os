import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";
import {
  createSessionToken,
  csrfTokenFor,
  verifySessionToken,
} from "../../src/shared/crypto/session";
import { TRANSFER_FORMAT_VERSION } from "../../src/shared/schemas/transfer";

/**
 * The export/import round trip, driven through the real Worker.
 *
 * A unit test can prove that an envelope validates. Only this suite can prove
 * the thing the parent actually cares about: that a record which survives an
 * export, a deletion, and an import comes back with the same evidence attached.
 *
 * The sequence is deliberately destructive between the two halves. Exporting
 * and re-importing without deleting anything in between would not exercise the
 * path a parent uses after a lost machine — so the learner is really deleted
 * here, with the confirmation phrase the route demands, and the import then has
 * to rebuild the record from the file alone.
 *
 * Every assertion compares values read back from D1 through the Worker, never
 * values the test already held in memory: the point is that the data reached
 * disk and came back, not that an object passed through a function unchanged.
 */

const ORIGIN = "http://localhost";
const PASSWORD = "MatKhauBiMat2026";
const DISPLAY_NAME = "Phụ huynh";
const LEARNER_NICKNAME = "Bé Mẫu";
/** Test-only signing secret; never read from disk, never deployed. */
const TEST_SECRET = "integration-only-not-a-real-secret-value";

let worker: { fetch: typeof fetch };
let env: { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };
let proxy: TestProxy;

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const jar: Jar = { cookies: {}, csrf: null };

/**
 * Drive one request through the Worker, carrying what a browser would carry.
 *
 * The CSRF header is sent for every unsafe method, not only for requests with a
 * JSON payload: `/api/data/export` is a POST whose handler reads no body, so a
 * client that only attached the token when it had a body would be rejected —
 * and would report it as a server bug.
 */
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
  if (!SAFE_METHODS.has(method) && targetJar.csrf) headers.set("x-tlo-csrf", targetJar.csrf);

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

async function createParentSessionJar(parentId: string, displayName: string): Promise<Jar> {
  const now = Date.now();
  const token = await createSessionToken(TEST_SECRET, parentId, displayName, now, "parent");
  const verified = await verifySessionToken(TEST_SECRET, token, now);
  if (!verified.ok) throw new Error("Failed to verify test parent session token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return { cookies: { tlo_session: token }, csrf };
}

function absorbSession(response: Response): void {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value.length === 0) delete jar.cookies[name];
    else jar.cookies[name] = value;
  }
}

async function login(): Promise<void> {
  const response = await call("/api/session/login", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  expect(response.status, "login fixture").toBe(200);
  absorbSession(response);
  jar.csrf = ((await response.clone().json()) as { csrfToken: string }).csrfToken;
}

/** Enrol the learner the round trip will move. */
async function enrol(): Promise<string> {
  const response = await call("/api/parent/learners", {
    method: "POST",
    json: { nickname: LEARNER_NICKNAME, birthYear: 2017, grade: 4, timezone: "Asia/Ho_Chi_Minh" },
  });
  expect(response.status, "enrol fixture").toBe(200);
  const body = (await response.json()) as { learner: { id: string } };
  return body.learner.id;
}

/**
 * Produce one real, stored attempt, so the record being moved is not empty.
 * An export with no evidence would round trip whether or not persistence
 * works at all.
 */
async function makeEvidence(): Promise<{ sessionId: string; stepId: string }> {
  const lessons = await (await call("/api/parent/lessons")).json() as {
    lessons: { id: string }[];
  };
  const lessonId = lessons.lessons[0]!.id;

  await call("/api/parent/lessons/approval", {
    method: "POST",
    json: { lessonId, status: "approved" },
  });

  const session = await (await call("/api/learner/sessions", {
    method: "POST",
    json: { lessonId },
  })).json() as { sessionId: string; steps: { id: string; content: unknown }[] };

  const stepId = session.steps[0]!.id;
  const key = await answerKeyFor(stepId);
  expect(key, "fixture needs a stored answer key").not.toBeNull();

  const wrong = choicesOf(session.steps[0]!.content).find((id) => id !== key);
  expect(wrong, "fixture needs a wrong option").toBeDefined();

  // A wrong answer first: evidence that is only ever correct is not a record of
  // learning, and the round trip should carry both outcomes.
  await call("/api/learner/attempts", {
    method: "POST",
    json: {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: wrong! },
      helpLevel: 0,
    },
  });
  await call("/api/learner/attempts", {
    method: "POST",
    json: {
      sessionId: session.sessionId,
      stepId,
      submission: { kind: "choice", choiceId: key! },
      helpLevel: 0,
    },
  });

  return { sessionId: session.sessionId, stepId };
}

async function captureCanonicalDatabaseSnapshot(targetDb: D1Database = env.DB): Promise<string> {
  const tableRows =
    (
      await targetDb
        .prepare(
          `SELECT name FROM sqlite_master
           WHERE type = 'table'
             AND name NOT LIKE 'sqlite_%'
             AND name NOT LIKE '_cf_%'
             AND name != 'd1_migrations'
           ORDER BY name ASC`,
        )
        .all<{ name: string }>()
    ).results ?? [];

  const dump: Record<string, unknown[]> = {};
  for (const { name } of tableRows) {
    const cols =
      (await targetDb.prepare(`PRAGMA table_info("${name}")`).all<{ name: string }>()).results ??
      [];
    const orderBy = cols.map((_, idx) => `${idx + 1} ASC`).join(", ");
    const query =
      cols.length > 0 ? `SELECT * FROM "${name}" ORDER BY ${orderBy}` : `SELECT * FROM "${name}"`;
    dump[name] = ((await targetDb.prepare(query).all()).results ?? []) as unknown[];
  }
  return JSON.stringify(dump);
}

beforeAll(async () => {
  proxy = await openTestDatabase();
  env = {
    DB: proxy.env.DB as unknown as D1Database,
    SESSION_SECRET: TEST_SECRET,
    ENVIRONMENT: "development",
  };
  worker = (await import("../../src/worker/index")).default as unknown as { fetch: typeof fetch };
});

afterAll(async () => {
  // Releasing the proxy releases its SQLite handle; skipping this leaves the
  // file locked and the next suite fails with SQLITE_BUSY, which reads like a
  // data problem rather than a locking one.
  await proxy.dispose();
});

/** The learner this suite enrols, created fresh by `beforeEach`. */
let learnerId: string;

beforeEach(async () => {
  await resetData(env.DB);
  jar.cookies = {};
  jar.csrf = null;

  await call("/api/session/bootstrap", {
    method: "POST",
    json: { displayName: DISPLAY_NAME, password: PASSWORD },
  });
  await login();
  learnerId = await enrol();
});

describe("export/import round trip restores the record from the file", () => {
  it("brings the same session and attempts back after a real deletion", async () => {
    const { sessionId, stepId } = await makeEvidence();

    const exportResponse = await call("/api/data/export", { method: "POST" });
    expect(exportResponse.status, "export must succeed before anything else is asserted").toBe(200);
    const exported = (await exportResponse.json()) as {
      formatVersion: number;
      containsLearnerEvidence: boolean;
      data: {
        learners: { id: string; nickname: string; grade: number | null }[];
        learningSessions: { id: string; status: string }[];
        learningAttempts: { id: string; outcome: string; stepId: string }[];
        curriculumIntakes?: unknown[];
        curriculumObjectives?: unknown[];
        lessonMetadata?: unknown[];
        baselineAssessments?: unknown[];
        learningPlanItems?: unknown[];
        sessionReflections?: unknown[];
        skillEvidence: unknown[];
        auditEvents: unknown[];
      };
    };

    // The exported shape must match the format the app declares, not a shape
    // this test happened to observe.
    expect(exported.formatVersion).toBe(TRANSFER_FORMAT_VERSION);
    expect(exported.containsLearnerEvidence).toBe(true);
    expect(exported.data.learners).toHaveLength(1);
    expect(exported.data.learners[0]!.nickname).toBe(LEARNER_NICKNAME);
    expect(exported.data.learningSessions.map((s) => s.id)).toContain(sessionId);
    expect(exported.data.learningAttempts.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(exported.data.curriculumIntakes)).toBe(true);
    expect(Array.isArray(exported.data.curriculumObjectives)).toBe(true);
    expect(Array.isArray(exported.data.lessonMetadata)).toBe(true);
    expect(Array.isArray(exported.data.baselineAssessments)).toBe(true);
    expect(Array.isArray(exported.data.learningPlanItems)).toBe(true);
    expect(Array.isArray(exported.data.sessionReflections)).toBe(true);

    const exportedLearnerId = exported.data.learners[0]!.id;
    // The exported id must be the enrolled learner's own id, so the record being
    // moved is the record that was just created.
    expect(exportedLearnerId).toBe(learnerId);

    // Delete for real. The confirmation names the learner, so a generic "yes"
    // cannot delete — this also proves the guard is enforced on the happy path.
    const deleted = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleted.status).toBe(200);

    const afterDelete = await env.DB.prepare(
      "select count(*) as n from learning_sessions where learner_id = ?",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(afterDelete!.n, "deletion must remove the sessions").toBe(0);

    const attemptsAfterDelete = await env.DB.prepare(
      "select count(*) as n from learning_attempts where learner_id = ?",
    )
      .bind(learnerId)
      .first<{ n: number }>();
    expect(attemptsAfterDelete!.n, "deletion must remove the evidence").toBe(0);

    // The audit row recording the deletion outlives the record it describes:
    // this is the only proof left that the deletion was deliberate.
    const deletionAudit = await env.DB.prepare(
      "select count(*) as n from audit_events where action = 'learner.deleted'",
    ).first<{ n: number }>();
    expect(deletionAudit!.n).toBe(1);

    // Import the file that was exported before the deletion. A generic "yes"
    // must not satisfy the confirmation phrase.
    const wrongConfirmation = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: "yes" },
    });
    expect(wrongConfirmation.status).toBe(400);

    const imported = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(imported.status, "import of the exported file").toBe(200);

    // Read the restored record back through the database, and compare it to the
    // file rather than to any in-memory object.
    const restored = await env.DB.prepare(
      "select id, nickname, grade from learners",
    ).first<{ id: string; nickname: string; grade: number | null }>();
    expect(restored!.nickname).toBe(exported.data.learners[0]!.nickname);
    expect(restored!.grade).toBe(exported.data.learners[0]!.grade);

    // The learner id is remapped to a fresh one on import, so restored rows are
    // found through the new id, not the exported one.
    expect(restored!.id).not.toBe(learnerId);

    const restoredSessions = await env.DB.prepare(
      "select id, status, lesson_id from learning_sessions where learner_id = ?",
    )
      .bind(restored!.id)
      .all<{ id: string; status: string; lesson_id: string }>();
    expect(restoredSessions.results).toHaveLength(1);
    expect(restoredSessions.results[0]!.id).toBe(sessionId);
    // Under SC10 fail-closed import policy, imported in_progress sessions transition to 'abandoned'
    // with continuation_deadline clamped, preventing unverified session resumption from imported backup JSON
    expect(restoredSessions.results[0]!.status).toBe("abandoned");

    const restoredAttempts = await env.DB.prepare(
      "select step_id, outcome, help_level from learning_attempts where learner_id = ? order by created_at asc",
    )
      .bind(restored!.id)
      .all<{ step_id: string; outcome: string; help_level: number }>();
    expect(restoredAttempts.results.length).toBeGreaterThanOrEqual(2);
    expect(restoredAttempts.results[0]!.step_id).toBe(stepId);
    // Wrong first, then right: both outcomes survived, so the restored record
    // still shows that this step was not solved on the first try.
    expect(restoredAttempts.results[0]!.outcome).toBe("incorrect");
    expect(restoredAttempts.results[1]!.outcome).toBe("correct");

    // The restored record is usable, not merely present: a session started
    // before the export can still be read back through the Worker.
    const home = await call("/api/learner/home");
    expect(home.status).toBe(200);
    const homeBody = (await home.json()) as { learner: { nickname: string } | null };
    expect(homeBody.learner?.nickname).toBe(LEARNER_NICKNAME);
  });

  it("refuses an import while a learner profile already exists", async () => {
    const exportResponse = await call("/api/data/export", { method: "POST" });
    expect(exportResponse.status, "export must succeed before anything else is asserted").toBe(200);
    const exported = (await exportResponse.json()) as {
      data: unknown;
    };

    // The record was never deleted, so importing it again must be refused
    // rather than silently creating a second learner.
    const response = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(response.status).toBe(400);

    const count = await env.DB.prepare("select count(*) as n from learners").first<{ n: number }>();
    expect(count!.n).toBe(1);
  });

  it("refuses a payload from a format version it does not know", async () => {
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    const response = await call("/api/data/import", {
      method: "POST",
      json: {
        formatVersion: TRANSFER_FORMAT_VERSION + 1,
        exportedAt: Date.now(),
        source: "manual_export",
        containsLearnerEvidence: true,
        data: {
          learners: [],
          schoolYears: [],
          subjects: [],
          skills: [],
          skillPrerequisites: [],
          lessons: [],
          lessonSteps: [],
          reviewApprovals: [],
          learningSessions: [],
          learningAttempts: [],
          skillEvidence: [],
          reviewSchedule: [],
          learningGoals: [],
          auditEvents: [],
          schemaVersions: [],
        },
      },
    });
    // A newer format is refused outright: the app cannot interpret a record it
    // does not have the schema for, and guessing would invent data.
    expect(response.status).toBe(400);

    const count = await env.DB.prepare("select count(*) as n from learners").first<{ n: number }>();
    expect(count!.n).toBe(0);
  });

  it("scopes exported auditEvents, reviewApprovals, and dynamic schemaVersions strictly to the exported learner and rejects deleted/other-learner events", async () => {
    const { sessionId } = await makeEvidence();

    // Seed a second parent + learner + approval + audit events + deleted learner audit event
    const otherParentId = crypto.randomUUID();
    const otherLearnerId = crypto.randomUUID();
    const deletedLearnerId = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
      "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, 'Parent B', 'hash', ?2, ?2)",
    )
      .bind(otherParentId, now)
      .run();
    await env.DB.prepare(
      "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES (?1, ?2, 'Bé Khác', 2017, 4, 'Asia/Ho_Chi_Minh', ?3, ?3)",
    )
      .bind(otherLearnerId, otherParentId, now)
      .run();

    const otherLessonRow = await env.DB.prepare("SELECT id FROM lessons ORDER BY id DESC LIMIT 1").first<{ id: string }>();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO review_approvals (id, lesson_id, status, decided_by, decided_at, note) VALUES (?1, ?2, 'approved', ?3, ?4, 'Other parent approval')",
    )
      .bind(crypto.randomUUID(), otherLessonRow!.id, otherParentId, now)
      .run();

    // Unrelated audit events: another learner's hint, a previously deleted learner's events, and a parent auth failure
    await env.DB.prepare(
      `INSERT INTO audit_events (id, actor, action, subject, detail, created_at)
       VALUES
         (?1, ?2, 'hint.requested', 'step-other', '{"level":3}', ?5),
         (?3, ?4, 'learner.deleted', ?6, '{"reason":"erased"}', ?5),
         (?7, 'anonymous', 'session.login_failed', 'unknown-user', '{"ip":"127.0.0.1"}', ?5)`,
    )
      .bind(
        crypto.randomUUID(),
        `learner:${otherLearnerId}`,
        crypto.randomUUID(),
        `parent:${otherParentId}`,
        now,
        deletedLearnerId,
        crypto.randomUUID(),
      )
      .run();

    const exportResponse = await call("/api/data/export", { method: "POST" });
    expect(exportResponse.status).toBe(200);
    const exported = (await exportResponse.json()) as {
      data: {
        reviewApprovals: { decidedBy: string }[];
        auditEvents: { actor: string; action: string; subject: string; detail: string | null }[];
        schemaVersions: { version: number; description: string }[];
      };
    };

    // 1. Dynamic schemaVersions: the export mirrors whatever schema_versions rows exist,
    //    ascending, with a description per row — never a hard-coded list in the app.
    const expectedVersions = (
      await env.DB.prepare("SELECT version, description FROM schema_versions ORDER BY version ASC").all<{
        version: number;
        description: string;
      }>()
    ).results!;
    expect(expectedVersions.length).toBeGreaterThanOrEqual(3);
    expect(exported.data.schemaVersions).toEqual(expectedVersions);

    // 2. reviewApprovals contains only the current parent's approvals, never otherParentId's
    expect(exported.data.reviewApprovals.length).toBeGreaterThanOrEqual(1);
    for (const approval of exported.data.reviewApprovals) {
      expect(approval.decidedBy).not.toBe(otherParentId);
    }

    // 3. auditEvents contains only events linked to learnerId (or its sessions/attempts), never otherLearnerId, deletedLearnerId, or login_failed
    expect(exported.data.auditEvents.length).toBeGreaterThanOrEqual(2);
    const serializedAudits = JSON.stringify(exported.data.auditEvents);
    expect(serializedAudits).not.toContain(otherLearnerId);
    expect(serializedAudits).not.toContain(deletedLearnerId);
    expect(serializedAudits).not.toContain("session.login_failed");
    expect(serializedAudits).toContain(sessionId);
  });

  it("preserves the disclosed hint floor across export -> delete -> import so a post-import first attempt on that step is still floored to assisted", async () => {
    const lessons = (await (await call("/api/parent/lessons")).json()) as {
      lessons: { id: string }[];
    };
    const lessonId = lessons.lessons[0]!.id;

    await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved" },
    });

    const sessionA = (await (
      await call("/api/learner/sessions", {
        method: "POST",
        json: { lessonId },
      })
    ).json()) as { sessionId: string; steps: { id: string }[] };
    const stepId = sessionA.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);

    // Disclose a level-2 hint on stepId without submitting an attempt yet
    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: sessionA.sessionId,
        stepId,
        currentLevel: 2,
      },
    });
    expect(hintRes.status).toBe(200);

    // Export the learner record (which includes the hint.requested audit event)
    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = await exportRes.json();

    // Delete the learner profile
    const deleteRes = await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    expect(deleteRes.status).toBe(200);

    // Import the backup; learner gets a new remapped ID
    const importRes = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(importRes.status).toBe(200);
    const importBody = (await importRes.json()) as {
      ok: boolean;
      errors: string[];
      warnings: string[];
      counts: Record<string, number>;
    };
    expect(importBody.ok).toBe(true);
    expect(importBody.errors).toEqual([]);

    // The import response reports counts, not identifiers: the restored learner's
    // id is minted server-side and must be read back from D1.
    const restoredLearnerId = await env.DB.prepare("SELECT id FROM learners")
      .first<{ id: string }>();
    expect(restoredLearnerId, "import rebuilds exactly one learner").toBeTruthy();
    expect(restoredLearnerId!.id).not.toBe(learnerId);

    // Imported approvals do not grant live authorization until the parent explicitly
    // re-approves the lesson for the restored learner.
    const reapproveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId, status: "approved", learnerId: restoredLearnerId!.id },
    });
    expect(reapproveRes.status).toBe(200);

    // Start a session for the restored learner and submit a correct answer on stepId with client helpLevel: 0
    const sessionB = (await (
      await call("/api/learner/sessions", {
        method: "POST",
        json: { lessonId, learnerId: restoredLearnerId!.id },
      })
    ).json()) as { sessionId: string };

    const attemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: sessionB.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice! },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);

    const restoredAttempt = await env.DB.prepare(
      "SELECT help_level, evidence_kind, attempt_no FROM learning_attempts WHERE learner_id = ?1 AND step_id = ?2",
    )
      .bind(restoredLearnerId!.id, stepId)
      .first<{ help_level: number; evidence_kind: string; attempt_no: number }>();

    // Because the disclosed hint floor survived export/delete/import and was remapped to the new learnerId,
    // the attempt is floored to help_level = 2 and evidence_kind = 'assisted'.
    expect(restoredAttempt).toEqual({
      help_level: 2,
      evidence_kind: "assisted",
      attempt_no: 1,
    });
  });

  it("rejects tampered import payloads that forge observed attempts or inflate derived skillEvidence without matching independent attempts", async () => {
    const { stepId } = await makeEvidence();

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        learningAttempts: {
          id: string;
          stepId: string;
          outcome: string;
          helpLevel: number;
          evidenceKind: string;
          attemptNo: number;
        }[];
        skillEvidence: {
          skillId: string;
          state: string;
          independentCount: number;
          source: string;
        }[];
      };
    };

    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    // Case 1: Tamper with attempt 2 (a retry on stepId) to claim evidenceKind = "observed"
    const tamperedRetryObserved = structuredClone(exported);
    tamperedRetryObserved.data.learningAttempts[1]!.evidenceKind = "observed";

    const res1 = await call("/api/data/import", {
      method: "POST",
      json: tamperedRetryObserved,
    });
    expect(res1.status).toBe(400);

    // Case 2: Tamper with derived skillEvidence to claim a high independentCount
    // using a valid enum state, so the rejection comes from the provenance
    // cross-check (independentCount > observed correct attempts) rather than
    // from an unrelated enum rejection.
    const tamperedSkillEvidence = structuredClone(exported);
    tamperedSkillEvidence.data.skillEvidence[0]!.state = "TRANSFERRED";
    tamperedSkillEvidence.data.skillEvidence[0]!.independentCount = 3;
    tamperedSkillEvidence.data.skillEvidence[0]!.independentCount = 3;

    const res2 = await call("/api/data/import", {
      method: "POST",
      json: tamperedSkillEvidence,
    });
    expect(res2.status).toBe(400);

    // Case 3: Include a hint.requested audit row for stepId at level 2 while claiming an observed attempt with helpLevel: 0
    const tamperedHintBypass = structuredClone(exported);
    tamperedHintBypass.data.learningAttempts = [
      {
        ...tamperedHintBypass.data.learningAttempts[1]!,
        attemptNo: 1,
        helpLevel: 0,
        evidenceKind: "observed",
      },
    ];
    (tamperedHintBypass.data as unknown as { auditEvents: unknown[] }).auditEvents.push({
      id: "forged-hint-audit",
      actor: `learner:${exported.data.learners[0]!.id}`,
      action: "hint.requested",
      subject: stepId,
      detail: { level: 2, sessionId: exported.data.learningSessions[0]!.id },
      createdAt: Date.now(),
    });

    const res3 = await call("/api/data/import", {
      method: "POST",
      json: tamperedHintBypass,
    });
    expect(res3.status).toBe(400);
  });

  it("exports and round-trips lessonVersions after a version-pinned content update", async () => {
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as {
      lessons: { id: string; version: number }[];
    };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const forked = (await forkRes.json()) as { lessonId: string; version: number };
    const lessonId = forked.lessonId;
    const initialVersion = forked.version;

    const detailRes = await call(`/api/parent/lessons/${encodeURIComponent(lessonId)}`);
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      id: string;
      version: number;
      titleVi: string;
      objectiveVi: string;
      steps: {
        id: string;
        position: number;
        kind: string;
        content: unknown;
        explanationVi: string;
        answerKey: unknown;
      }[];
    };

    const updateRes = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId,
        expectedVersion: initialVersion,
        titleVi: `${detail.titleVi} (Bản cập nhật M9)`,
        objectiveVi: `${detail.objectiveVi} — đã bổ sung ví dụ thực tế.`,
        steps: detail.steps.map((s) => ({
          clientId: s.id,
          position: s.position,
          kind: s.kind,
          content: s.content,
          answerKey: s.answerKey,
          explanationVi: s.explanationVi,
        })),
      },
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { version: number };
    expect(updated.version).toBe(initialVersion + 1);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        lessonVersions?: {
          lessonId: string;
          version: number;
          titleVi: string;
          objectiveVi: string;
          stepsJson: unknown[];
        }[];
      };
    };

    expect(Array.isArray(exported.data.lessonVersions)).toBe(true);
    const versionsForLesson = exported.data.lessonVersions!.filter((v) => v.lessonId === lessonId);
    expect(versionsForLesson.length).toBeGreaterThanOrEqual(1);
    expect(versionsForLesson.some((v) => v.version === initialVersion + 1)).toBe(true);

    // Delete learner and lesson_versions row, then import and verify lessonVersions is restored
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1 AND version = ?2")
      .bind(lessonId, initialVersion + 1)
      .run();

    const importRes = await call("/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(importRes.status).toBe(200);
    const importBody = (await importRes.json()) as {
      ok: boolean;
      counts: Record<string, number>;
    };
    expect(importBody.ok).toBe(true);
    expect(importBody.counts.lessonVersions).toBeGreaterThanOrEqual(1);

    const restoredVersionRow = await env.DB.prepare(
      "SELECT title_vi FROM lesson_versions WHERE lesson_id = ?1 AND version = ?2",
    )
      .bind(lessonId, initialVersion + 1)
      .first<{ title_vi: string }>();
    expect(restoredVersionRow?.title_vi).toContain("(Bản cập nhật M9)");

    // Rejects tampered lessonVersions with out-of-bounds version (> lesson.version) or unreferenced lessonId
    const tamperedUnknownLesson = structuredClone(exported);
    tamperedUnknownLesson.data.lessonVersions!.push({
      lessonId: "non-existent-lesson",
      version: 1,
      titleVi: "Giả mạo",
      objectiveVi: "Giả mạo",
      stepsJson: [],
    });
    const badRes1 = await call("/api/data/import", {
      method: "POST",
      json: tamperedUnknownLesson,
    });
    expect(badRes1.status).toBe(400);

    const tamperedFutureVersion = structuredClone(exported);
    tamperedFutureVersion.data.lessonVersions![0]!.version = initialVersion + 99;
    const badRes2 = await call("/api/data/import", {
      method: "POST",
      json: tamperedFutureVersion,
    });
    expect(badRes2.status).toBe(400);
  });

  it("accepts a >2 MB pretty-printed multi-year backup envelope while enforcing the UTF-8 byte ceiling on readJsonBody", async () => {
    const { stepId } = await makeEvidence();

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        learners: { id: string }[];
        learningSessions: { id: string }[];
        sessionReflections?: {
          id: string;
          sessionId: string;
          learnerId: string;
          confidence: number;
          noteVi: string | null;
          createdAt: number;
        }[];
        auditEvents: {
          id: string;
          actor: string;
          action: string;
          subject: string | null;
          detail: unknown;
          createdAt: number;
        }[];
      };
    };

    const exportedLearnerId = exported.data.learners[0]!.id;
    const baseNow = Date.now();
    // Simulate multi-year household usage (Vietnamese audit records with multi-byte diacritics)
    // so the pretty-printed CLI export exceeds the old 2 MB limit (~2.4 MB UTF-8).
    const multiByteNote =
      "Phụ huynh đánh giá tiến độ học tập định kỳ học kỳ 2: con tự giác ôn tập phân số, đọc hiểu Tiếng Việt và tư duy phản biện vững vàng.";
    for (let i = 0; i < 2_600; i += 1) {
      exported.data.auditEvents.push({
        id: `multi-year-audit-${String(i).padStart(4, "0")}`,
        actor: `learner:${exportedLearnerId}`,
        action: "session.started",
        subject: stepId,
        detail: { note: multiByteNote, seq: i },
        createdAt: baseNow + i,
      });
    }

    const prettyPrintedBody = JSON.stringify(exported, null, 2);
    const utf8Bytes = new TextEncoder().encode(prettyPrintedBody).byteLength;
    expect(utf8Bytes).toBeGreaterThan(2_000_000);
    expect(utf8Bytes).toBeLessThan(10_000_000);

    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    const headers = new Headers({
      origin: ORIGIN,
      "content-type": "application/json",
    });
    const cookie = Object.entries(jar.cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
    if (cookie) headers.set("cookie", cookie);
    if (jar.csrf) headers.set("x-tlo-csrf", jar.csrf);

    const importRes = await worker.fetch(
      new Request(`${ORIGIN}/api/data/import`, {
        method: "POST",
        body: prettyPrintedBody,
        headers,
      }),
      env,
    );
    expect(importRes.status).toBe(200);
    const importBody = (await importRes.json()) as {
      ok: boolean;
      counts: Record<string, number>;
    };
    expect(importBody.ok).toBe(true);
    expect(importBody.counts.auditEvents).toBeGreaterThan(2_600);

    // Also verify UTF-8 byte enforcement (not UTF-16 code unit count) on a small-budget endpoint:
    // 1,600 Vietnamese characters = 1,600 UTF-16 code units (< 4,000), but > 4,000 UTF-8 bytes!
    const multiByteString = "ệ".repeat(1_500); // 1,500 chars * 3 UTF-8 bytes = 4,500 bytes > 4,000 limit on DELETE /api/data/learner
    const rawDeletePayload = JSON.stringify({
      learnerId: "any-id",
      confirmation: multiByteString,
    });
    expect(rawDeletePayload.length).toBeLessThan(4_000);
    expect(new TextEncoder().encode(rawDeletePayload).byteLength).toBeGreaterThan(4_000);

    // Omit content-length header so readJsonBody exercises the post-read UTF-8 byte check
    const deleteRes = await worker.fetch(
      new Request(`${ORIGIN}/api/data/learner`, {
        method: "DELETE",
        body: rawDeletePayload,
        headers,
      }),
      env,
    );
    expect(deleteRes.status).toBe(400);
    const deleteErr = (await deleteRes.json()) as { messageVi: string };
    expect(deleteErr.messageVi).toContain("quá lớn");
  });

  it("fails closed with 409 before creating learners or catalogue rows when imported catalogue entries are missing or mismatched", async () => {
    await makeEvidence();

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        subjects: {
          id: string;
          nameVi: string;
          nameEn: string;
          sort: number;
          active: 0 | 1;
        }[];
        skills: {
          id: string;
          subjectId: string;
          code: string;
          nameVi: string;
          nameEn: string;
          gradeFrom: number;
          gradeTo: number;
        }[];
        skillPrerequisites: { skillId: string; prerequisiteId: string }[];
        curriculumObjectives: {
          id: string;
          subjectId: string;
          grade: number;
          code: string;
          titleVi: string;
          descriptionVi: string;
          skillId: string | null;
          provenance: string;
          sourceRef: string | null;
          createdAt: number;
        }[];
        lessons: unknown[];
        lessonSteps: unknown[];
        lessonMetadata: unknown[];
        lessonVersions: unknown[];
        reviewApprovals: unknown[];
        learningSessions: unknown[];
        learningAttempts: unknown[];
        skillEvidence: unknown[];
        skillEvidenceObservations?: unknown[];
        skillEstimates?: unknown[];
        reviewSchedule: unknown[];
        sessionReflections: unknown[];
        auditEvents: unknown[];
      };
    };

    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    const baselineCounts = async () => ({
      learners: (await env.DB.prepare("SELECT COUNT(*) AS n FROM learners").first<{ n: number }>())!
        .n,
      subjects: (await env.DB.prepare("SELECT COUNT(*) AS n FROM subjects").first<{ n: number }>())!
        .n,
      skills: (await env.DB.prepare("SELECT COUNT(*) AS n FROM skills").first<{ n: number }>())!.n,
      prereqs: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM skill_prerequisites").first<{
          n: number;
        }>()
      )!.n,
      objectives: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM curriculum_objectives").first<{
          n: number;
        }>()
      )!.n,
    });

    const before = await baselineCounts();
    expect(before.learners).toBe(0);

    // 1. Missing skill (even when `lessons` is empty, preflight must still run and reject before learner creation).
    const missingSkillEnvelope = structuredClone(exported);
    missingSkillEnvelope.data.lessons = [];
    missingSkillEnvelope.data.lessonSteps = [];
    missingSkillEnvelope.data.lessonMetadata = [];
    missingSkillEnvelope.data.lessonVersions = [];
    missingSkillEnvelope.data.reviewApprovals = [];
    missingSkillEnvelope.data.learningSessions = [];
    missingSkillEnvelope.data.learningAttempts = [];
    missingSkillEnvelope.data.skillEvidence = [];
    missingSkillEnvelope.data.skillEvidenceObservations = [];
    missingSkillEnvelope.data.skillEstimates = [];
    missingSkillEnvelope.data.reviewSchedule = [];
    missingSkillEnvelope.data.sessionReflections = [];
    missingSkillEnvelope.data.auditEvents = [];
    missingSkillEnvelope.data.skills.push({
      id: "unshipped-foreign-skill",
      subjectId: exported.data.subjects[0]!.id,
      code: "UNSHIPPED.99",
      nameVi: "Kỹ năng ngoài danh mục",
      nameEn: "Foreign unshipped skill",
      gradeFrom: 4,
      gradeTo: 4,
    });

    const resMissingSkill = await call("/api/data/import", {
      method: "POST",
      json: missingSkillEnvelope,
    });
    expect(resMissingSkill.status).toBe(409);
    expect(await baselineCounts()).toEqual(before);

    // 2. Mismatched existing skill field (same ID, altered nameVi).
    const mismatchedSkillEnvelope = structuredClone(exported);
    mismatchedSkillEnvelope.data.skills[0]!.nameVi = "Tên kỹ năng đã bị sửa trái phép";
    const resMismatchedSkill = await call("/api/data/import", {
      method: "POST",
      json: mismatchedSkillEnvelope,
    });
    expect(resMismatchedSkill.status).toBe(409);
    expect(await baselineCounts()).toEqual(before);

    // 3. Missing curriculum objective.
    const missingObjectiveEnvelope = structuredClone(exported);
    missingObjectiveEnvelope.data.curriculumObjectives.push({
      ...exported.data.curriculumObjectives[0]!,
      id: "unshipped-objective-id",
      code: "GDPT2018-FAKE-99",
    });
    const resMissingObjective = await call("/api/data/import", {
      method: "POST",
      json: missingObjectiveEnvelope,
    });
    expect(resMissingObjective.status).toBe(409);
    expect(await baselineCounts()).toEqual(before);

    // 4. Mismatched subject metadata.
    const mismatchedSubjectEnvelope = structuredClone(exported);
    mismatchedSubjectEnvelope.data.subjects[0]!.nameVi = "Môn học giả mạo";
    const resMismatchedSubject = await call("/api/data/import", {
      method: "POST",
      json: mismatchedSubjectEnvelope,
    });
    expect(resMismatchedSubject.status).toBe(409);
    expect(await baselineCounts()).toEqual(before);

    // 5. Missing skill prerequisite edge.
    const existingEdgeSet = new Set(
      exported.data.skillPrerequisites.map((edge) => `${edge.skillId}:::${edge.prerequisiteId}`),
    );
    const absentPair = exported.data.skills
      .flatMap((a) => exported.data.skills.map((b) => ({ skillId: a.id, prerequisiteId: b.id })))
      .find(
        (pair) =>
          pair.skillId !== pair.prerequisiteId &&
          !existingEdgeSet.has(`${pair.skillId}:::${pair.prerequisiteId}`),
      )!;
    const missingPrereqEnvelope = structuredClone(exported);
    missingPrereqEnvelope.data.skillPrerequisites.push(absentPair);
    const resMissingPrereq = await call("/api/data/import", {
      method: "POST",
      json: missingPrereqEnvelope,
    });
    expect(resMissingPrereq.status).toBe(409);
    expect(await baselineCounts()).toEqual(before);

    // 6. Cross-machine restore where curriculumObjectives.createdAt differs (semantic fields match) succeeds.
    const crossMachineEnvelope = structuredClone(exported);
    crossMachineEnvelope.data.curriculumObjectives[0]!.createdAt += 86_400_000;
    const resCrossMachine = await call("/api/data/import", {
      method: "POST",
      json: crossMachineEnvelope,
    });
    expect(resCrossMachine.status).toBe(200);
  });

  it("rolls back newly created family lessons, learners, and withholds hint.requested audit rows when a late import write fails", async () => {
    // Create a family lesson fork, bump its version so lesson_versions + lesson_metadata + review_approvals exist,
    // and disclose a hint on its first step so `restoredHintFloor` is non-empty on import.
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as {
      lessons: { id: string }[];
    };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const forked = (await forkRes.json()) as { lessonId: string; version: number };
    const familyLessonId = forked.lessonId;

    const detailRes = await call(`/api/parent/lessons/${encodeURIComponent(familyLessonId)}`);
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      version: number;
      titleVi: string;
      objectiveVi: string;
      steps: {
        id: string;
        position: number;
        kind: string;
        content: unknown;
        explanationVi: string;
        answerKey: unknown;
      }[];
    };

    const contentRes = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId: familyLessonId,
        expectedVersion: detail.version,
        titleVi: `${detail.titleVi} (Bản sao thử nghiệm rollback)`,
        objectiveVi: detail.objectiveVi,
        steps: detail.steps.map((step) => ({
          clientId: step.id,
          position: step.position,
          kind: step.kind,
          content: step.content,
          answerKey: step.answerKey,
          explanationVi: step.explanationVi,
        })),
      },
    });
    expect(contentRes.status).toBe(200);

    const approveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: familyLessonId, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as { sessionId: string; steps: { id: string }[] };
    const hintedStepId = session.steps[0]!.id;

    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: hintedStepId,
        currentLevel: 2,
      },
    });
    expect(hintRes.status).toBe(200);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as {
      data: {
        learners: { id: string }[];
        learningGoals: {
          id: string;
          learnerId: string;
          subjectId: string;
          titleVi: string;
          note: string | null;
          targetDate: string | null;
          status: string;
          createdAt: number;
          updatedAt: number;
        }[];
      };
    };

    // Simulate restoring onto a clean installation where neither the learner nor the family lesson exists yet.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.batch([
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(familyLessonId),
    ]);

    const snapshotCounts = async () => ({
      learners: (await env.DB.prepare("SELECT COUNT(*) AS n FROM learners").first<{ n: number }>())!
        .n,
      skills: (await env.DB.prepare("SELECT COUNT(*) AS n FROM skills").first<{ n: number }>())!.n,
      objectives: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM curriculum_objectives").first<{
          n: number;
        }>()
      )!.n,
      familyLessons: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM lessons WHERE id = ?1")
          .bind(familyLessonId)
          .first<{ n: number }>()
      )!.n,
      familyMetadata: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM lesson_metadata WHERE lesson_id = ?1")
          .bind(familyLessonId)
          .first<{ n: number }>()
      )!.n,
      familyVersions: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM lesson_versions WHERE lesson_id = ?1")
          .bind(familyLessonId)
          .first<{ n: number }>()
      )!.n,
      familySteps: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM lesson_steps WHERE lesson_id = ?1")
          .bind(familyLessonId)
          .first<{ n: number }>()
      )!.n,
      familyApprovals: (
        await env.DB.prepare("SELECT COUNT(*) AS n FROM review_approvals WHERE lesson_id = ?1")
          .bind(familyLessonId)
          .first<{ n: number }>()
      )!.n,
      restoredHintAudits: (
        await env.DB.prepare(
          "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'hint.requested' AND detail LIKE '%restoredFromImport%'",
        ).first<{ n: number }>()
      )!.n,
    });

    const before = await snapshotCounts();
    expect(before.learners).toBe(0);
    expect(before.familyLessons).toBe(0);
    expect(before.restoredHintAudits).toBe(0);

    // Inject a late foreign-key failure in `learningGoals` (after learners, family lessons,
    // sessions, and evidence have already been written, and right before restoredHintFloor).
    const brokenImport = structuredClone(exported);
    brokenImport.data.learningGoals.push({
      id: crypto.randomUUID(),
      learnerId: exported.data.learners[0]!.id,
      subjectId: "non-existent-subject-fk",
      titleVi: "Mục tiêu gãy khóa ngoại",
      note: null,
      targetDate: null,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const failedRes = await call("/api/data/import", {
      method: "POST",
      json: brokenImport,
    });
    expect(failedRes.status).toBe(500);

    const after = await snapshotCounts();
    expect(after).toEqual(before);
  });

  it("atomically rolls back the single restore batch (mid-hint, on data.imported, and on oversized-batch rejection) with zero writes", async () => {
    // Fork a family lesson, edit it so lesson_versions + lesson_metadata exist, approve it,
    // and disclose hints on TWO distinct steps so the single atomic restore batch ends with:
    //   [hint.requested #1, hint.requested #2, data.imported].
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as {
      lessons: { id: string }[];
    };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const forked = (await forkRes.json()) as { lessonId: string; version: number };
    const familyLessonId = forked.lessonId;

    const detailRes = await call(`/api/parent/lessons/${encodeURIComponent(familyLessonId)}`);
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      version: number;
      titleVi: string;
      objectiveVi: string;
      steps: {
        id: string;
        position: number;
        kind: string;
        content: unknown;
        explanationVi: string;
        answerKey: unknown;
      }[];
    };
    expect(detail.steps.length).toBeGreaterThanOrEqual(2);

    const contentRes = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId: familyLessonId,
        expectedVersion: detail.version,
        titleVi: `${detail.titleVi} (Kiểm thử lỗi lô kiểm toán cuối)`,
        objectiveVi: detail.objectiveVi,
        steps: detail.steps.map((step) => ({
          clientId: step.id,
          position: step.position,
          kind: step.kind,
          content: step.content,
          answerKey: step.answerKey,
          explanationVi: step.explanationVi,
        })),
      },
    });
    expect(contentRes.status).toBe(200);

    const approveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: familyLessonId, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as { sessionId: string; steps: { id: string }[] };
    expect(session.steps.length).toBeGreaterThanOrEqual(2);

    // Disclose hints on two separate steps so restoredHintFloor has 2 entries.
    for (const step of [session.steps[0]!, session.steps[1]!]) {
      const hintRes = await call("/api/learner/hints", {
        method: "POST",
        json: {
          sessionId: session.sessionId,
          stepId: step.id,
          currentLevel: 2,
        },
      });
      expect(hintRes.status).toBe(200);
    }

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = await exportRes.json();

    // Remove the learner and the newly created family lesson so the import restores both from scratch.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.batch([
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(familyLessonId),
    ]);

    const realDb = env.DB;
    const readDatabaseState = async () => {
      const auditRows =
        (
          await realDb
            .prepare("SELECT id, action FROM audit_events ORDER BY created_at ASC, id ASC")
            .all<{ id: string; action: string }>()
        ).results ?? [];
      return {
        auditIds: auditRows.map((row) => `${row.id}:${row.action}`),
        learners: (await realDb.prepare("SELECT COUNT(*) AS n FROM learners").first<{ n: number }>())!.n,
        sessions: (
          await realDb.prepare("SELECT COUNT(*) AS n FROM learning_sessions").first<{ n: number }>()
        )!.n,
        attempts: (
          await realDb.prepare("SELECT COUNT(*) AS n FROM learning_attempts").first<{ n: number }>()
        )!.n,
        familyLessons: (
          await realDb
            .prepare("SELECT COUNT(*) AS n FROM lessons WHERE id = ?1")
            .bind(familyLessonId)
            .first<{ n: number }>()
        )!.n,
        familyMetadata: (
          await realDb
            .prepare("SELECT COUNT(*) AS n FROM lesson_metadata WHERE lesson_id = ?1")
            .bind(familyLessonId)
            .first<{ n: number }>()
        )!.n,
        familyVersions: (
          await realDb
            .prepare("SELECT COUNT(*) AS n FROM lesson_versions WHERE lesson_id = ?1")
            .bind(familyLessonId)
            .first<{ n: number }>()
        )!.n,
        familySteps: (
          await realDb
            .prepare("SELECT COUNT(*) AS n FROM lesson_steps WHERE lesson_id = ?1")
            .bind(familyLessonId)
            .first<{ n: number }>()
        )!.n,
        familyApprovals: (
          await realDb
            .prepare("SELECT COUNT(*) AS n FROM review_approvals WHERE lesson_id = ?1")
            .bind(familyLessonId)
            .first<{ n: number }>()
        )!.n,
      };
    };

    const baselineState = await readDatabaseState();
    expect(baselineState.learners).toBe(0);
    expect(baselineState.familyLessons).toBe(0);

    type SyncCapableStatement = D1PreparedStatement & {
      runSync?: () => { meta?: { changes?: number } };
    };
    type FaultMode = "fail_after_first_hint" | "fail_on_data_imported" | "oversized_batch";

    function createSingleBatchFaultDb(mode: FaultMode): {
      db: D1Database;
      stats: {
        learnersCommittedInTxBeforeFault: number;
        hintsCommittedInTxBeforeFault: number;
        batchCalls: number;
        unbatchedWriteRuns: number;
      };
    } {
      const stats = {
        learnersCommittedInTxBeforeFault: 0,
        hintsCommittedInTxBeforeFault: 0,
        batchCalls: 0,
        unbatchedWriteRuns: 0,
      };
      let insideBatch = false;
      let hintsSeenInCurrentBatch = 0;

      const triggerSqliteAbortSync = () => {
        const abortStmt = realDb.prepare(
          "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (NULL, NULL, NULL, NULL, NULL, NULL)",
        ) as SyncCapableStatement;
        return abortStmt.runSync!();
      };

      const wrapStatement = (
        inner: SyncCapableStatement,
        sql: string,
        boundValues: unknown[] = [],
      ): D1PreparedStatement => {
        const isLearnerInsert = /^\s*INSERT\s+INTO\s+learners\b/i.test(sql);
        const isAuditInsert = /^\s*INSERT\s+INTO\s+audit_events\b/i.test(sql);
        const action = typeof boundValues[2] === "string" ? boundValues[2] : null;

        const maybeFaultBeforeExecute = (): boolean => {
          if (!insideBatch || !isAuditInsert) return false;
          if (action === "hint.requested") {
            hintsSeenInCurrentBatch += 1;
            if (mode === "fail_after_first_hint" && hintsSeenInCurrentBatch === 2) {
              return true;
            }
          } else if (action === "data.imported" && mode === "fail_on_data_imported") {
            return true;
          }
          return false;
        };

        const wrapped: Record<string, unknown> = {
          bind: (...values: unknown[]) =>
            wrapStatement(inner.bind(...values) as SyncCapableStatement, sql, values),
          first: (colName?: string) => inner.first(colName),
          all: () => inner.all(),
          raw: (options?: { columnNames?: boolean }) => inner.raw(options),
          run: async () => {
            if (!insideBatch) {
              stats.unbatchedWriteRuns += 1;
            }
            if (maybeFaultBeforeExecute()) {
              return realDb
                .prepare(
                  "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES (NULL, NULL, NULL, NULL, NULL, NULL)",
                )
                .run();
            }
            const res = await inner.run();
            if (insideBatch && isLearnerInsert) {
              stats.learnersCommittedInTxBeforeFault += 1;
            }
            if (insideBatch && isAuditInsert && action === "hint.requested") {
              stats.hintsCommittedInTxBeforeFault += 1;
            }
            return res;
          },
        };

        if (typeof inner.runSync === "function") {
          wrapped.runSync = () => {
            if (!insideBatch) {
              stats.unbatchedWriteRuns += 1;
            }
            if (maybeFaultBeforeExecute()) {
              return triggerSqliteAbortSync();
            }
            const res = inner.runSync!();
            if (insideBatch && isLearnerInsert) {
              stats.learnersCommittedInTxBeforeFault += Number(res.meta?.changes ?? 0);
            }
            if (insideBatch && isAuditInsert && action === "hint.requested") {
              stats.hintsCommittedInTxBeforeFault += Number(res.meta?.changes ?? 0);
            }
            return res;
          };
        }

        return wrapped as unknown as D1PreparedStatement;
      };

      const faultDb = {
        prepare: (sql: string) => wrapStatement(realDb.prepare(sql) as SyncCapableStatement, sql),
        batch: async (statements: D1PreparedStatement[]) => {
          stats.batchCalls += 1;
          if (mode === "oversized_batch") {
            throw new Error("D1_ERROR: Exceeded maximum number of statements in a single batch");
          }
          insideBatch = true;
          hintsSeenInCurrentBatch = 0;
          try {
            return await realDb.batch(statements);
          } finally {
            insideBatch = false;
          }
        },
        exec: (sql: string) => realDb.exec(sql),
        dump: () => realDb.dump(),
        withSession: (constraintOrBookmark?: unknown) =>
          realDb.withSession(constraintOrBookmark as never),
      } as unknown as D1Database;

      return { db: faultDb, stats };
    }

    try {
      // Case 1: Fail inside the single atomic batch AFTER learners, family lessons, sessions,
      // and the first `hint.requested` row have executed in SQLite (faulting on hint #2).
      const fault1 = createSingleBatchFaultDb("fail_after_first_hint");
      env.DB = fault1.db;
      const res1 = await call("/api/data/import", {
        method: "POST",
        json: exported,
      });
      expect(res1.status).toBe(500);
      expect(fault1.stats.batchCalls).toBe(1);
      expect(fault1.stats.unbatchedWriteRuns).toBe(0);
      expect(fault1.stats.learnersCommittedInTxBeforeFault).toBe(1);
      expect(fault1.stats.hintsCommittedInTxBeforeFault).toBe(1);
      expect(await readDatabaseState()).toEqual(baselineState);

      // Case 2: Fail inside the single atomic batch on `data.imported` AFTER learners,
      // family lessons, and BOTH `hint.requested` rows have executed in SQLite.
      const fault2 = createSingleBatchFaultDb("fail_on_data_imported");
      env.DB = fault2.db;
      const res2 = await call("/api/data/import", {
        method: "POST",
        json: exported,
      });
      expect(res2.status).toBe(500);
      expect(fault2.stats.batchCalls).toBe(1);
      expect(fault2.stats.unbatchedWriteRuns).toBe(0);
      expect(fault2.stats.learnersCommittedInTxBeforeFault).toBe(1);
      expect(fault2.stats.hintsCommittedInTxBeforeFault).toBe(2);
      expect(await readDatabaseState()).toEqual(baselineState);

      // Case 3: Fail closed when the platform rejects an oversized `db.batch` — zero writes
      // and a clear Vietnamese message explaining no partial restore occurred.
      const faultOversized = createSingleBatchFaultDb("oversized_batch");
      env.DB = faultOversized.db;
      const resOversized = await call("/api/data/import", {
        method: "POST",
        json: exported,
      });
      expect(resOversized.status).toBe(500);
      const oversizedBody = (await resOversized.json()) as {
        code: string;
        messageVi: string;
      };
      expect(oversizedBody).toEqual({
        error: "server_error",
        code: "server_error",
        messageVi:
          "Bản sao lưu vượt quá giới hạn ghi nguyên tử của hệ thống. Không có dữ liệu nào bị ghi dở dang.",
      });
      expect(faultOversized.stats.batchCalls).toBe(1);
      expect(faultOversized.stats.unbatchedWriteRuns).toBe(0);
      expect(await readDatabaseState()).toEqual(baselineState);

      // Case 4: Restore the real database handle and verify the identical payload succeeds cleanly
      // in one atomic batch, committing learner, family lesson, both hints, and `data.imported`.
      env.DB = realDb;
      const okRes = await call("/api/data/import", {
        method: "POST",
        json: exported,
      });
      expect(okRes.status).toBe(200);
      const finalState = await readDatabaseState();
      expect(finalState.learners).toBe(1);
      expect(finalState.familyLessons).toBe(1);
      expect(finalState.auditIds.length).toBe(baselineState.auditIds.length + 3);
    } finally {
      env.DB = realDb;
    }
  });

  it("serializes same-parent concurrent double restore inside db.batch so one wins (200) and the loser aborts at statement 0 (400) without touching the winner's family lesson or evidence", async () => {
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as { lessons: { id: string }[] };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId: familyLessonId } = (await forkRes.json()) as { lessonId: string };

    const approveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: familyLessonId, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);
    expect(correctChoice).not.toBeNull();

    const attemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice! },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = await exportRes.json();

    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.batch([
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(familyLessonId),
    ]);

    const auditCountBefore = (
      await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'data.imported'",
      ).first<{ n: number }>()
    )!.n;

    // Barrier at `db.batch`: both concurrent requests pass `findFirstLearnerForParent`
    // (seeing 0 active learners) and `detectLessonImportCollision` (seeing `familyLessonId`
    // absent) before either transaction enters SQLite.
    const realDb = env.DB;
    let arrivals = 0;
    let releaseBarrier!: () => void;
    const bothArrived = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    env.DB = {
      prepare: (sql: string) => realDb.prepare(sql),
      batch: async (statements: D1PreparedStatement[]) => {
        arrivals += 1;
        if (arrivals === 2) {
          releaseBarrier();
        }
        await bothArrived;
        return realDb.batch(statements);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    try {
      const [resA, resB] = await Promise.all([
        call("/api/data/import", { method: "POST", json: structuredClone(exported) }),
        call("/api/data/import", { method: "POST", json: structuredClone(exported) }),
      ]);

      expect(arrivals).toBe(2);
      const responses = [resA, resB].sort((x, y) => x.status - y.status);
      expect(responses.map((r) => r.status)).toEqual([200, 400]);

      const loserBody = (await responses[1]!.json()) as {
        code: string;
        messageVi: string;
      };
      expect(loserBody).toEqual({
        error: "bad_request",
        code: "bad_request",
        messageVi:
          "Máy này đã có hồ sơ người học. Vui lòng xóa hồ sơ hiện tại trước khi phục hồi.",
      });
    } finally {
      env.DB = realDb;
    }

    const activeLearners = (
      await env.DB.prepare("SELECT id FROM learners WHERE archived_at IS NULL").all<{
        id: string;
      }>()
    ).results ?? [];
    expect(activeLearners).toHaveLength(1);

    const restoredLesson = await env.DB.prepare(
      "SELECT id, ownership_type FROM lessons WHERE id = ?1",
    )
      .bind(familyLessonId)
      .first<{ id: string; ownership_type: string }>();
    expect(restoredLesson).toEqual({ id: familyLessonId, ownership_type: "family" });

    const restoredSteps = (
      await env.DB.prepare("SELECT COUNT(*) AS n FROM lesson_steps WHERE lesson_id = ?1")
        .bind(familyLessonId)
        .first<{ n: number }>()
    )!.n;
    expect(restoredSteps).toBeGreaterThanOrEqual(1);

    const restoredAttempts = (
      await env.DB.prepare("SELECT COUNT(*) AS n FROM learning_attempts WHERE learner_id = ?1")
        .bind(activeLearners[0]!.id)
        .first<{ n: number }>()
    )!.n;
    expect(restoredAttempts).toBe(1);

    const auditCountAfter = (
      await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'data.imported'",
      ).first<{ n: number }>()
    )!.n;
    expect(auditCountAfter).toBe(auditCountBefore + 1);
  });

  it("rolls back the loser's learner and writes with 409 when two parents concurrently import the same absent family lesson ID", async () => {
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as { lessons: { id: string }[] };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId: familyLessonId } = (await forkRes.json()) as { lessonId: string };

    const approveRes = await call("/api/parent/lessons/approval", {
      method: "POST",
      json: { lessonId: familyLessonId, status: "approved" },
    });
    expect(approveRes.status).toBe(200);

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    const stepId = session.steps[0]!.id;
    const correctChoice = await answerKeyFor(stepId);
    expect(correctChoice).not.toBeNull();

    const attemptRes = await call("/api/learner/attempts", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId,
        submission: { kind: "choice", choiceId: correctChoice! },
        helpLevel: 0,
      },
    });
    expect(attemptRes.status).toBe(200);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exportedA = (await exportRes.json()) as {
      data: {
        schoolYears: { id: string }[];
        reviewApprovals: { id: string }[];
        learningSessions: { id: string; schoolYearId: string | null }[];
        learningAttempts: { id: string; sessionId: string }[];
        skillEvidenceObservations?: { id: string; attemptId: string }[];
        skillEstimates?: { id: string; attemptWatermark: string | null }[];
        sessionReflections?: { id: string; sessionId: string }[];
      };
    };

    const parentARow = await env.DB.prepare("SELECT id FROM parents LIMIT 1").first<{
      id: string;
    }>();
    const parentAId = parentARow!.id;

    // Remove Parent A's learner and the family lesson so `familyLessonId` is completely absent.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.batch([
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_metadata WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(familyLessonId),
    ]);

    // Provision Parent B with an independent, FK-valid backup envelope (distinct school-year,
    // approval, session, attempt, observation, and estimate IDs) that claims the exact same
    // absent `familyLessonId` — so whichever parent wins first commits 200 cleanly and the
    // loser aborts on `UNIQUE constraint failed: lessons.id` (409).
    const parentBId = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
    )
      .bind(parentBId, "hash-parent-b", "Phụ huynh B", now)
      .run();
    const jarB = await createParentSessionJar(parentBId, "Phụ huynh B");

    const exportedB = structuredClone(exportedA);
    const schoolYearIdMap = new Map<string, string>();
    for (const sy of exportedB.data.schoolYears) {
      const nextSyId = crypto.randomUUID();
      schoolYearIdMap.set(sy.id, nextSyId);
      sy.id = nextSyId;
    }
    for (const approval of exportedB.data.reviewApprovals) {
      approval.id = crypto.randomUUID();
    }
    const sessionIdMap = new Map<string, string>();
    for (const sess of exportedB.data.learningSessions) {
      const nextSessionId = crypto.randomUUID();
      sessionIdMap.set(sess.id, nextSessionId);
      sess.id = nextSessionId;
      sess.schoolYearId = sess.schoolYearId
        ? (schoolYearIdMap.get(sess.schoolYearId) ?? sess.schoolYearId)
        : null;
    }
    const attemptIdMap = new Map<string, string>();
    for (const att of exportedB.data.learningAttempts) {
      const nextAttemptId = crypto.randomUUID();
      attemptIdMap.set(att.id, nextAttemptId);
      att.id = nextAttemptId;
      att.sessionId = sessionIdMap.get(att.sessionId) ?? att.sessionId;
    }
    for (const obs of exportedB.data.skillEvidenceObservations ?? []) {
      obs.id = crypto.randomUUID();
      obs.attemptId = attemptIdMap.get(obs.attemptId) ?? obs.attemptId;
    }
    for (const est of exportedB.data.skillEstimates ?? []) {
      est.id = crypto.randomUUID();
      est.attemptWatermark = est.attemptWatermark
        ? (attemptIdMap.get(est.attemptWatermark) ?? est.attemptWatermark)
        : null;
    }
    for (const refl of exportedB.data.sessionReflections ?? []) {
      refl.id = crypto.randomUUID();
      refl.sessionId = sessionIdMap.get(refl.sessionId) ?? refl.sessionId;
    }

    // Barrier at `db.batch` so BOTH Parent A and Parent B pass preflight seeing
    // `familyLessonId` absent, and then execute their single-batch transactions back-to-back.
    type SyncCapableStmt = D1PreparedStatement & {
      runSync?: () => { meta?: { changes?: number } };
    };
    const realDb = env.DB;
    let arrivals = 0;
    let learnerInsertsExecutedInTx = 0;
    let releaseBarrier!: () => void;
    const bothArrived = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    const wrapStmt = (inner: SyncCapableStmt, sql: string): D1PreparedStatement => {
      const isLearnerInsert = /^\s*INSERT\s+INTO\s+learners\b/i.test(sql);
      const wrapped: Record<string, unknown> = {
        bind: (...values: unknown[]) =>
          wrapStmt(inner.bind(...values) as SyncCapableStmt, sql),
        first: (colName?: string) => inner.first(colName),
        all: () => inner.all(),
        raw: (options?: { columnNames?: boolean }) => inner.raw(options),
        run: async () => {
          const res = await inner.run();
          if (isLearnerInsert) learnerInsertsExecutedInTx += 1;
          return res;
        },
      };
      if (typeof inner.runSync === "function") {
        wrapped.runSync = () => {
          const res = inner.runSync!();
          if (isLearnerInsert) {
            learnerInsertsExecutedInTx += Number(res.meta?.changes ?? 0);
          }
          return res;
        };
      }
      return wrapped as unknown as D1PreparedStatement;
    };

    env.DB = {
      prepare: (sql: string) => wrapStmt(realDb.prepare(sql) as SyncCapableStmt, sql),
      batch: async (statements: D1PreparedStatement[]) => {
        arrivals += 1;
        if (arrivals === 2) {
          releaseBarrier();
        }
        await bothArrived;
        return realDb.batch(statements);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    let resA!: Response;
    let resB!: Response;
    try {
      [resA, resB] = await Promise.all([
        callWithJar(jar, "/api/data/import", { method: "POST", json: exportedA }),
        callWithJar(jarB, "/api/data/import", { method: "POST", json: exportedB }),
      ]);
    } finally {
      env.DB = realDb;
    }

    expect(arrivals).toBe(2);
    // Both parents inserted their learner at statement 0 inside their transaction,
    // proving the loser's learner insert really ran before `UNIQUE constraint failed: lessons.id`
    // rolled back the loser's batch.
    expect(learnerInsertsExecutedInTx).toBe(2);

    const outcomes = [
      { parentId: parentAId, res: resA },
      { parentId: parentBId, res: resB },
    ].sort((x, y) => x.res.status - y.res.status);
    expect(outcomes.map((o) => o.res.status)).toEqual([200, 409]);

    const winnerParentId = outcomes[0]!.parentId;
    const loserParentId = outcomes[1]!.parentId;
    const loserConflictBody = (await outcomes[1]!.res.json()) as {
      code: string;
      messageVi: string;
    };
    expect(loserConflictBody).toEqual({
      error: "conflict",
      code: "conflict",
      messageVi: "Xung đột dữ liệu bài học: bài học riêng đã thuộc về một gia đình khác.",
    });

    const lessonOwner = await env.DB.prepare(
      "SELECT owner_parent_id, ownership_type FROM lessons WHERE id = ?1",
    )
      .bind(familyLessonId)
      .first<{ owner_parent_id: string | null; ownership_type: string }>();
    expect(lessonOwner).toEqual({
      owner_parent_id: winnerParentId,
      ownership_type: "family",
    });

    const winnerLearners = (
      await env.DB.prepare("SELECT id FROM learners WHERE parent_id = ?1").bind(winnerParentId).all<{
        id: string;
      }>()
    ).results ?? [];
    expect(winnerLearners).toHaveLength(1);

    const loserLearners = (
      await env.DB.prepare("SELECT id FROM learners WHERE parent_id = ?1").bind(loserParentId).all<{
        id: string;
      }>()
    ).results ?? [];
    expect(loserLearners).toEqual([]);

    const loserImportAudits = (
      await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM audit_events WHERE action = 'data.imported' AND actor = ?1",
      )
        .bind(`parent:${loserParentId}`)
        .first<{ n: number }>()
    )!.n;
    expect(loserImportAudits).toBe(0);
  });

  it("preserves pre-existing family lesson versions, steps, metadata, and legacy approval byte-for-byte when a late statement fails inside db.batch", async () => {
    const parentRow = await env.DB.prepare("SELECT id FROM parents LIMIT 1").first<{
      id: string;
    }>();
    const parentId = parentRow!.id;

    // 1. Fork a family lesson at v1, capture its v1 title/objective, then publish v2 so the
    //    exported envelope carries both v1 and additive v2 (`lessonVersions` + `lessonSteps`).
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as { lessons: { id: string }[] };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId: familyLessonId, version: v1Version } = (await forkRes.json()) as {
      lessonId: string;
      version: number;
    };
    expect(v1Version).toBe(1);

    const v1DetailRes = await call(`/api/parent/lessons/${encodeURIComponent(familyLessonId)}`);
    expect(v1DetailRes.status).toBe(200);
    const v1Detail = (await v1DetailRes.json()) as {
      version: number;
      titleVi: string;
      objectiveVi: string;
      steps: {
        id: string;
        position: number;
        kind: string;
        content: unknown;
        explanationVi: string;
        answerKey: unknown;
      }[];
    };

    const v2Res = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId: familyLessonId,
        expectedVersion: 1,
        titleVi: `${v1Detail.titleVi} (Phiên bản 2 trong bản sao lưu)`,
        objectiveVi: `${v1Detail.objectiveVi} — bổ sung bước phiên bản 2.`,
        steps: v1Detail.steps.map((step) => ({
          clientId: step.id,
          position: step.position,
          kind: step.kind,
          content: step.content,
          answerKey: step.answerKey,
          explanationVi: step.explanationVi,
        })),
      },
    });
    expect(v2Res.status).toBe(200);

    // Attach v2 `lesson_metadata` and a legacy `learner_id IS NULL` `approved` row before exporting
    // so the backup payload contains:
    //   - additive `lessonVersions` (v2) + `lessonSteps` (v2),
    //   - `lessonMetadata` upsert overwriting `source_ref` + `review_recommendation_vi`,
    //   - legacy `reviewApprovals` (`learnerId: null, status: "approved"`), which import
    //     downgrades via `DELETE + INSERT` to `status = 'draft'`.
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO lesson_metadata
         (lesson_id, objective_id, provenance, source_ref, expected_duration_minutes, review_recommendation_vi, is_baseline, updated_at)
       VALUES (?1, NULL, 'parent_textbook', 'nguon-ban-sao-luu-v2', 25, 'Khuyến nghị từ bản sao lưu v2', 0, ?2)
       ON CONFLICT(lesson_id) DO UPDATE SET
         source_ref = excluded.source_ref,
         expected_duration_minutes = excluded.expected_duration_minutes,
         review_recommendation_vi = excluded.review_recommendation_vi,
         updated_at = excluded.updated_at`,
    )
      .bind(familyLessonId, now + 5_000)
      .run();

    const legacyApprovalId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare(
        `INSERT INTO review_approvals
           (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
         VALUES (?1, NULL, ?2, 1, 'approved', ?3, ?4, 'Ghi chú trong bản sao lưu')`,
      ).bind(legacyApprovalId, familyLessonId, parentId, now + 1_000),
      // Also approve v2 for the current learner so we can record a real v2 practice session + hint.
      env.DB.prepare(
        `INSERT INTO review_approvals
           (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
         VALUES (?1, ?2, ?3, 2, 'approved', ?4, ?5, NULL)`,
      ).bind(crypto.randomUUID(), learnerId, familyLessonId, parentId, now + 2_000),
    ]);

    const sessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(sessionRes.status).toBe(200);
    const session = (await sessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    const hintRes = await call("/api/learner/hints", {
      method: "POST",
      json: {
        sessionId: session.sessionId,
        stepId: session.steps[0]!.id,
        currentLevel: 1,
      },
    });
    expect(hintRes.status).toBe(200);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exportedV2 = (await exportRes.json()) as {
      data: {
        learners: { id: string }[];
        baselineAssessments?: {
          id: string;
          learnerId: string;
          subjectId: string;
          sessionId: string | null;
          status: "pending" | "completed" | "reviewed";
          observedSummaryVi: string | null;
          supportedSummaryVi: string | null;
          needsObservationJson: string;
          suggestedLessonsJson: string;
          parentReviewRequired: 0 | 1;
          createdAt: number;
          completedAt: number | null;
        }[];
      };
    };

    // 2. Delete the learner, then rewind the DB's `familyLessonId` back to its pre-existing v1 state:
    //    only v1 exists in `lesson_versions` / `lesson_steps`, `lesson_metadata` holds v1 values,
    //    and `review_approvals` holds the live legacy `learner_id IS NULL` `status = 'approved'` row.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1 AND content_version = 2").bind(
        familyLessonId,
      ),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1 AND version = 2").bind(
        familyLessonId,
      ),
      env.DB.prepare(
        "UPDATE lessons SET title_vi = ?1, objective_vi = ?2, version = 1, updated_at = ?3 WHERE id = ?4",
      ).bind(v1Detail.titleVi, v1Detail.objectiveVi, now, familyLessonId),
      env.DB.prepare(
        `UPDATE lesson_metadata
         SET source_ref = 'nguon-truoc-khoi-phuc-v1',
             expected_duration_minutes = 15,
             review_recommendation_vi = 'Giữ nguyên trước khôi phục',
             updated_at = ?1
         WHERE lesson_id = ?2`,
      ).bind(now, familyLessonId),
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
      env.DB.prepare(
        `INSERT INTO review_approvals
           (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at, note)
         VALUES (?1, NULL, ?2, 1, 'approved', ?3, ?4, 'Phê duyệt gốc trước khi khôi phục')`,
      ).bind(legacyApprovalId, familyLessonId, parentId, now),
    ]);

    const realDb = env.DB;
    const captureCanonicalDatabaseSnapshot = async (): Promise<string> => {
      const tableRows =
        (
          await realDb
            .prepare(
              `SELECT name FROM sqlite_master
               WHERE type = 'table'
                 AND name NOT LIKE 'sqlite_%'
                 AND name NOT LIKE '_cf_%'
                 AND name != 'd1_migrations'
               ORDER BY name ASC`,
            )
            .all<{ name: string }>()
        ).results ?? [];

      const dump: Record<string, unknown[]> = {};
      for (const { name } of tableRows) {
        const cols =
          (await realDb.prepare(`PRAGMA table_info("${name}")`).all<{ name: string }>()).results ??
          [];
        const orderBy = cols.map((_, idx) => `${idx + 1} ASC`).join(", ");
        const query =
          cols.length > 0 ? `SELECT * FROM "${name}" ORDER BY ${orderBy}` : `SELECT * FROM "${name}"`;
        dump[name] = ((await realDb.prepare(query).all()).results ?? []) as unknown[];
      }
      return JSON.stringify(dump);
    };

    const snapshotBefore = await captureCanonicalDatabaseSnapshot();

    // 3. Inject a late foreign-key failure in `baselineAssessments` (`subjectId` does not exist in `subjects`),
    //    which executes AFTER `lesson_versions`, `lesson_steps`, `review_approvals` (DELETE + INSERT),
    //    and `lesson_metadata` (ON CONFLICT DO UPDATE) have all mutated the pre-existing family lesson
    //    inside the single `db.batch`.
    const brokenV2 = structuredClone(exportedV2);
    brokenV2.data.baselineAssessments = [
      ...(brokenV2.data.baselineAssessments ?? []),
      {
        id: crypto.randomUUID(),
        learnerId: brokenV2.data.learners[0]!.id,
        subjectId: "non-existent-baseline-subject-fk",
        sessionId: null,
        status: "completed",
        observedSummaryVi: "Tóm tắt kiểm thử lỗi muộn",
        supportedSummaryVi: null,
        needsObservationJson: "[]",
        suggestedLessonsJson: "[]",
        parentReviewRequired: 0,
        createdAt: now,
        completedAt: now,
      },
    ];

    type SyncCapableStmt = D1PreparedStatement & {
      runSync?: () => { meta?: { changes?: number } };
    };
    const inTxMutations = {
      lessonVersionsInserted: 0,
      lessonStepsInserted: 0,
      legacyApprovalDeletes: 0,
      lessonMetadataUpserts: 0,
    };

    const wrapTrackerStmt = (inner: SyncCapableStmt, sql: string): D1PreparedStatement => {
      const trackChanges = (changes: number) => {
        if (/^\s*INSERT\s+INTO\s+lesson_versions\b/i.test(sql)) {
          inTxMutations.lessonVersionsInserted += changes;
        } else if (/^\s*INSERT\s+INTO\s+lesson_steps\b/i.test(sql)) {
          inTxMutations.lessonStepsInserted += changes;
        } else if (/^\s*DELETE\s+FROM\s+review_approvals\b/i.test(sql)) {
          inTxMutations.legacyApprovalDeletes += changes;
        } else if (/^\s*INSERT\s+INTO\s+lesson_metadata\b/i.test(sql)) {
          inTxMutations.lessonMetadataUpserts += changes;
        }
      };

      const wrapped: Record<string, unknown> = {
        bind: (...values: unknown[]) =>
          wrapTrackerStmt(inner.bind(...values) as SyncCapableStmt, sql),
        first: (colName?: string) => inner.first(colName),
        all: () => inner.all(),
        raw: (options?: { columnNames?: boolean }) => inner.raw(options),
        run: async () => {
          const res = await inner.run();
          trackChanges(Number(res.meta?.changes ?? 0));
          return res;
        },
      };
      if (typeof inner.runSync === "function") {
        wrapped.runSync = () => {
          const res = inner.runSync!();
          trackChanges(Number(res.meta?.changes ?? 0));
          return res;
        };
      }
      return wrapped as unknown as D1PreparedStatement;
    };

    env.DB = {
      prepare: (sql: string) => wrapTrackerStmt(realDb.prepare(sql) as SyncCapableStmt, sql),
      batch: (statements: D1PreparedStatement[]) => realDb.batch(statements),
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    let failedRes!: Response;
    try {
      failedRes = await call("/api/data/import", {
        method: "POST",
        json: brokenV2,
      });
    } finally {
      env.DB = realDb;
    }

    expect(failedRes.status).toBe(500);
    // Prove every pre-existing family mutation actually executed inside the SQLite transaction
    // before the late `baselineAssessments` FK failure triggered rollback:
    expect(inTxMutations.lessonVersionsInserted).toBe(1);
    expect(inTxMutations.lessonStepsInserted).toBe(v1Detail.steps.length);
    expect(inTxMutations.legacyApprovalDeletes).toBe(1);
    expect(inTxMutations.lessonMetadataUpserts).toBe(1);

    // Every table, row, and column in the database must match the pre-import snapshot byte-for-byte.
    const snapshotAfterFailure = await captureCanonicalDatabaseSnapshot();
    expect(snapshotAfterFailure).toBe(snapshotBefore);

    // Explicitly spot-check the preserved pre-existing family rows as well:
    const preservedApproval = await env.DB.prepare(
      "SELECT status, note FROM review_approvals WHERE lesson_id = ?1",
    )
      .bind(familyLessonId)
      .first<{ status: string; note: string | null }>();
    expect(preservedApproval).toEqual({
      status: "approved",
      note: "Phê duyệt gốc trước khi khôi phục",
    });
    const preservedMeta = await env.DB.prepare(
      "SELECT source_ref, expected_duration_minutes, review_recommendation_vi FROM lesson_metadata WHERE lesson_id = ?1",
    )
      .bind(familyLessonId)
      .first<{
        source_ref: string | null;
        expected_duration_minutes: number;
        review_recommendation_vi: string | null;
      }>();
    expect(preservedMeta).toEqual({
      source_ref: "nguon-truoc-khoi-phuc-v1",
      expected_duration_minutes: 15,
      review_recommendation_vi: "Giữ nguyên trước khôi phục",
    });

    // 4. Retry with the valid v2 backup envelope and confirm existing-family restore succeeds cleanly.
    const retryRes = await call("/api/data/import", {
      method: "POST",
      json: exportedV2,
    });
    expect(retryRes.status).toBe(200);

    const versionsAfterSuccess = (
      await env.DB.prepare(
        "SELECT version FROM lesson_versions WHERE lesson_id = ?1 ORDER BY version ASC",
      )
        .bind(familyLessonId)
        .all<{ version: number }>()
    ).results ?? [];
    expect(versionsAfterSuccess.map((r) => r.version)).toEqual([1, 2]);
  });

  it("aborts with 409 and zero restore writes when a concurrent parent edit publishes a divergent v2 between import preflight and db.batch, while keeping compatible existing snapshots working", async () => {
    // 1. Fork a family lesson at v1, approve v1, and record a v1 practice attempt.
    const lessonsRes = await call("/api/parent/lessons");
    const lessonsBody = (await lessonsRes.json()) as { lessons: { id: string }[] };
    const forkRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: lessonsBody.lessons[0]!.id },
    });
    expect(forkRes.status).toBe(200);
    const { lessonId: familyLessonId } = (await forkRes.json()) as { lessonId: string };

    const v1DetailRes = await call(`/api/parent/lessons/${encodeURIComponent(familyLessonId)}`);
    expect(v1DetailRes.status).toBe(200);
    const v1Detail = (await v1DetailRes.json()) as {
      version: number;
      titleVi: string;
      objectiveVi: string;
      steps: {
        id: string;
        position: number;
        kind: string;
        content: unknown;
        explanationVi: string;
        answerKey: unknown;
      }[];
    };

    expect(
      (
        await call("/api/parent/lessons/approval", {
          method: "POST",
          json: { lessonId: familyLessonId, status: "approved" },
        })
      ).status,
    ).toBe(200);

    const v1SessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(v1SessionRes.status).toBe(200);
    const v1Session = (await v1SessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    const v1Step0Id = v1Session.steps[0]!.id;
    const v1CorrectChoice = await answerKeyFor(v1Step0Id);
    expect(v1CorrectChoice).not.toBeNull();

    expect(
      (
        await call("/api/learner/attempts", {
          method: "POST",
          json: {
            sessionId: v1Session.sessionId,
            stepId: v1Step0Id,
            submission: { kind: "choice", choiceId: v1CorrectChoice! },
            helpLevel: 0,
          },
        })
      ).status,
    ).toBe(200);

    // 2. Publish backup's v2, approve v2, and open a v2 learner session + hint so the exported
    //    backup references v2 (`lesson_version = 2`) alongside its v2 `lessonVersions` / `lessonSteps`.
    const backupV2Title = `${v1Detail.titleVi} (Phiên bản 2 trong tệp sao lưu)`;
    const backupV2Objective = `${v1Detail.objectiveVi} — mục tiêu phiên bản 2 của bản sao lưu.`;
    const backupV2Res = await call("/api/parent/lessons/content", {
      method: "POST",
      json: {
        lessonId: familyLessonId,
        expectedVersion: 1,
        titleVi: backupV2Title,
        objectiveVi: backupV2Objective,
        steps: v1Detail.steps.map((step) => ({
          clientId: step.id,
          position: step.position,
          kind: step.kind,
          content: step.content,
          answerKey: step.answerKey,
          explanationVi: `${step.explanationVi} (Giải thích bản sao lưu v2)`,
        })),
      },
    });
    expect(backupV2Res.status).toBe(200);

    expect(
      (
        await call("/api/parent/lessons/approval", {
          method: "POST",
          json: { lessonId: familyLessonId, status: "approved" },
        })
      ).status,
    ).toBe(200);

    const v2SessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(v2SessionRes.status).toBe(200);
    const v2Session = (await v2SessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    expect(
      (
        await call("/api/learner/hints", {
          method: "POST",
          json: {
            sessionId: v2Session.sessionId,
            stepId: v2Session.steps[0]!.id,
            currentLevel: 1,
          },
        })
      ).status,
    ).toBe(200);

    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exportedBackupV2 = await exportRes.json();

    // 3. Delete learner and rewind `familyLessonId` back to v1 in D1 so preflight sees v1 present
    //    and v2 absent.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    const rewindNow = Date.now();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1 AND content_version = 2").bind(
        familyLessonId,
      ),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1 AND version = 2").bind(
        familyLessonId,
      ),
      env.DB.prepare(
        "UPDATE lessons SET title_vi = ?1, objective_vi = ?2, version = 1, updated_at = ?3 WHERE id = ?4",
      ).bind(v1Detail.titleVi, v1Detail.objectiveVi, rewindNow, familyLessonId),
      env.DB.prepare("DELETE FROM review_approvals WHERE lesson_id = ?1").bind(familyLessonId),
    ]);

    const realDb = env.DB;
    const captureCanonicalDatabaseSnapshot = async (): Promise<string> => {
      const tableRows =
        (
          await realDb
            .prepare(
              `SELECT name FROM sqlite_master
               WHERE type = 'table'
                 AND name NOT LIKE 'sqlite_%'
                 AND name NOT LIKE '_cf_%'
                 AND name != 'd1_migrations'
               ORDER BY name ASC`,
            )
            .all<{ name: string }>()
        ).results ?? [];

      const dump: Record<string, unknown[]> = {};
      for (const { name } of tableRows) {
        const cols =
          (await realDb.prepare(`PRAGMA table_info("${name}")`).all<{ name: string }>()).results ??
          [];
        const orderBy = cols.map((_, idx) => `${idx + 1} ASC`).join(", ");
        const query =
          cols.length > 0 ? `SELECT * FROM "${name}" ORDER BY ${orderBy}` : `SELECT * FROM "${name}"`;
        dump[name] = ((await realDb.prepare(query).all()).results ?? []) as unknown[];
      }
      return JSON.stringify(dump);
    };

    // 4. Interleave a concurrent parent edit (`expectedVersion: 1 -> 2` with DIFFERENT v2 title,
    //    objective, and step explanations) AFTER `POST /api/data/import` finishes preflight
    //    and right BEFORE its `db.batch` enters SQLite.
    const liveEditV2Title = `${v1Detail.titleVi} (Phiên bản 2 chỉnh sửa trực tiếp khác biệt)`;
    const liveEditV2Objective = `${v1Detail.objectiveVi} — mục tiêu chỉnh sửa đồng thời khác bản sao lưu.`;
    let interleavedEditTriggered = false;
    let snapshotAfterConcurrentEdit = "";
    let learnerInsertsExecutedInImportTx = 0;

    type SyncCapableStmt = D1PreparedStatement & {
      runSync?: () => { meta?: { changes?: number } };
    };
    const wrapImportStmt = (inner: SyncCapableStmt, sql: string): D1PreparedStatement => {
      const isLearnerInsert = /^\s*INSERT\s+INTO\s+learners\b/i.test(sql);
      const wrapped: Record<string, unknown> = {
        bind: (...values: unknown[]) => wrapImportStmt(inner.bind(...values) as SyncCapableStmt, sql),
        first: (colName?: string) => inner.first(colName),
        all: () => inner.all(),
        raw: (options?: { columnNames?: boolean }) => inner.raw(options),
        run: async () => {
          const res = await inner.run();
          if (isLearnerInsert) learnerInsertsExecutedInImportTx += 1;
          return res;
        },
      };
      if (typeof inner.runSync === "function") {
        wrapped.runSync = () => {
          const res = inner.runSync!();
          if (isLearnerInsert) {
            learnerInsertsExecutedInImportTx += Number(res.meta?.changes ?? 0);
          }
          return res;
        };
      }
      return wrapped as unknown as D1PreparedStatement;
    };

    env.DB = {
      prepare: (sql: string) => wrapImportStmt(realDb.prepare(sql) as SyncCapableStmt, sql),
      batch: async (statements: D1PreparedStatement[]) => {
        if (!interleavedEditTriggered) {
          interleavedEditTriggered = true;
          // Run the concurrent parent editor directly against `realDb` before the import batch executes.
          env.DB = realDb;
          const concurrentEditRes = await call("/api/parent/lessons/content", {
            method: "POST",
            json: {
              lessonId: familyLessonId,
              expectedVersion: 1,
              titleVi: liveEditV2Title,
              objectiveVi: liveEditV2Objective,
              steps: v1Detail.steps.map((step) => ({
                clientId: step.id,
                position: step.position,
                kind: step.kind,
                content: step.content,
                answerKey: step.answerKey,
                explanationVi: `${step.explanationVi} (Giải thích chỉnh sửa trực tiếp v2)`,
              })),
            },
          });
          expect(concurrentEditRes.status).toBe(200);
          snapshotAfterConcurrentEdit = await captureCanonicalDatabaseSnapshot();
        }
        return realDb.batch(statements);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    let importRes!: Response;
    try {
      importRes = await call("/api/data/import", {
        method: "POST",
        json: exportedBackupV2,
      });
    } finally {
      env.DB = realDb;
    }

    expect(interleavedEditTriggered).toBe(true);
    // Statement 0 (`learners`) ran inside the import transaction before the divergent v2 snapshot
    // conflict aborted and rolled back the entire restore batch.
    expect(learnerInsertsExecutedInImportTx).toBe(1);
    expect(importRes.status).toBe(409);

    const conflictBody = (await importRes.json()) as {
      error: string;
      code: string;
      messageVi: string;
    };
    expect(conflictBody).toEqual({
      error: "conflict",
      code: "conflict",
      messageVi:
        "Xung đột phiên bản bài học: bài học riêng đã được chỉnh sửa đồng thời trong khi khôi phục. Không có dữ liệu nào bị ghi dở dang.",
    });

    // Zero restore writes persisted, and the concurrent parent edit remains byte-for-byte intact.
    const snapshotAfterRejectedImport = await captureCanonicalDatabaseSnapshot();
    expect(snapshotAfterRejectedImport).toBe(snapshotAfterConcurrentEdit);

    const liveLesson = await env.DB.prepare(
      "SELECT version, title_vi, objective_vi FROM lessons WHERE id = ?1",
    )
      .bind(familyLessonId)
      .first<{ version: number; title_vi: string; objective_vi: string }>();
    expect(liveLesson).toEqual({
      version: 2,
      title_vi: liveEditV2Title,
      objective_vi: liveEditV2Objective,
    });

    const activeLearners = (
      await env.DB.prepare("SELECT id FROM learners WHERE archived_at IS NULL").all<{
        id: string;
      }>()
    ).results ?? [];
    expect(activeLearners).toEqual([]);

    // 4b. Also exercise the `lesson_steps` UNIQUE conflict path directly: when `lesson_versions` v2
    //     already matches at preflight (so only `lesson_steps` v2 are planned for plain INSERT) and a
    //     divergent step row lands at `(lesson_id, 2, position)` before `db.batch`, `INSERT INTO lesson_steps`
    //     likewise aborts the entire restore with 409 and zero writes.
    const liveV2Steps =
      (
        await env.DB.prepare(
          "SELECT id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version, source_step_id FROM lesson_steps WHERE lesson_id = ?1 AND content_version = 2 ORDER BY position ASC",
        )
          .bind(familyLessonId)
          .all<{
            id: string;
            lesson_id: string;
            position: number;
            kind: string;
            content: string;
            answer_key: string;
            explanation_vi: string | null;
            content_version: number;
            source_step_id: string | null;
          }>()
      ).results ?? [];

    await env.DB.batch([
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1 AND content_version = 2").bind(
        familyLessonId,
      ),
      env.DB.prepare(
        "UPDATE lesson_versions SET title_vi = ?1, objective_vi = ?2 WHERE lesson_id = ?3 AND version = 2",
      ).bind(backupV2Title, backupV2Objective, familyLessonId),
      env.DB.prepare("UPDATE lessons SET title_vi = ?1, objective_vi = ?2 WHERE id = ?3").bind(
        backupV2Title,
        backupV2Objective,
        familyLessonId,
      ),
    ]);

    let stepInterleaveTriggered = false;
    let snapshotAfterStepInterleave = "";
    env.DB = {
      prepare: (sql: string) => realDb.prepare(sql),
      batch: async (statements: D1PreparedStatement[]) => {
        if (!stepInterleaveTriggered) {
          stepInterleaveTriggered = true;
          env.DB = realDb;
          await realDb.batch(
            liveV2Steps.map((s) =>
              realDb
                .prepare(
                  `INSERT INTO lesson_steps
                     (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version, source_step_id)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
                )
                .bind(
                  s.id,
                  s.lesson_id,
                  s.position,
                  s.kind,
                  s.content,
                  s.answer_key,
                  s.explanation_vi,
                  s.content_version,
                  s.source_step_id,
                ),
            ),
          );
          snapshotAfterStepInterleave = await captureCanonicalDatabaseSnapshot();
        }
        return realDb.batch(statements);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    let stepConflictRes!: Response;
    try {
      stepConflictRes = await call("/api/data/import", {
        method: "POST",
        json: exportedBackupV2,
      });
    } finally {
      env.DB = realDb;
    }

    expect(stepInterleaveTriggered).toBe(true);
    expect(stepConflictRes.status).toBe(409);
    expect(await stepConflictRes.json()).toEqual({
      error: "conflict",
      code: "conflict",
      messageVi:
        "Xung đột phiên bản bài học: bài học riêng đã được chỉnh sửa đồng thời trong khi khôi phục. Không có dữ liệu nào bị ghi dở dang.",
    });
    expect(await captureCanonicalDatabaseSnapshot()).toBe(snapshotAfterStepInterleave);

    // 5. Verify compatible existing immutable snapshots still succeed: export a fresh backup
    //    whose v1 + v2 snapshots match the live family lesson, delete the learner while keeping
    //    both v1 and v2 snapshots in D1, and confirm `POST /api/data/import` succeeds cleanly (200)
    //    across repeated delete + restore cycles.
    const freshLearnerId = await enrol();
    expect(
      (
        await call("/api/parent/lessons/approval", {
          method: "POST",
          json: { lessonId: familyLessonId, status: "approved" },
        })
      ).status,
    ).toBe(200);
    const compatibleSessionRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: familyLessonId },
    });
    expect(compatibleSessionRes.status).toBe(200);
    const compatibleSession = (await compatibleSessionRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };
    const compatibleChoice = await answerKeyFor(compatibleSession.steps[0]!.id);
    expect(
      (
        await call("/api/learner/attempts", {
          method: "POST",
          json: {
            sessionId: compatibleSession.sessionId,
            stepId: compatibleSession.steps[0]!.id,
            submission: { kind: "choice", choiceId: compatibleChoice! },
            helpLevel: 0,
          },
        })
      ).status,
    ).toBe(200);

    const compatibleExportRes = await call("/api/data/export", { method: "POST" });
    expect(compatibleExportRes.status).toBe(200);
    const compatibleExport = await compatibleExportRes.json();

    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId: freshLearnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    // Both v1 and v2 snapshots already exist in `lesson_versions` and `lesson_steps` and match the backup.
    const compatibleImport1 = await call("/api/data/import", {
      method: "POST",
      json: compatibleExport,
    });
    expect(compatibleImport1.status).toBe(200);

    const restoredLearners1 = (
      await env.DB.prepare("SELECT id FROM learners WHERE archived_at IS NULL").all<{
        id: string;
      }>()
    ).results ?? [];
    expect(restoredLearners1).toHaveLength(1);

    // Delete learner again and retry the exact same import to verify idempotent retry support.
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId: restoredLearners1[0]!.id, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });
    const compatibleImport2 = await call("/api/data/import", {
      method: "POST",
      json: compatibleExport,
    });
    expect(compatibleImport2.status).toBe(200);
  });

  it("rejects unshipped catalogue rows (skills, prerequisites, curriculum objectives, subjects, catalogue lessons) before db.batch with zero catalogue or audit side effects", async () => {
    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as ExportEnvelope;
    await call("/api/data/learner", {
      method: "DELETE",
      json: { learnerId, confirmation: `XOA ${LEARNER_NICKNAME}` },
    });

    const baselineSnapshot = await captureCanonicalDatabaseSnapshot();
    const realDb = env.DB;
    let batchCalls = 0;
    env.DB = {
      prepare: (sql: string) => realDb.prepare(sql),
      batch: async (statements: D1PreparedStatement[]) => {
        batchCalls += 1;
        return realDb.batch(statements);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    try {
      // 1. Unshipped skill + prerequisite
      const unshippedSkillEnv = structuredClone(exported);
      unshippedSkillEnv.data.skills.push({
        id: "math-injected-skill-gh73",
        subjectId: "math",
        code: "M.GH73",
        titleVi: "Kỹ năng ngoại lai",
        descriptionVi: "Không có trong danh mục chính thức",
        gradeBand: "5",
      });
      unshippedSkillEnv.data.skillPrerequisites.push({
        skillId: "math-injected-skill-gh73",
        prerequisiteId: exported.data.skills[0]!.id,
      });
      const skillRes = await call("/api/data/import", {
        method: "POST",
        json: unshippedSkillEnv,
      });
      expect(skillRes.status).toBe(409);

      // 2. Unshipped curriculum objective
      const unshippedObjectiveEnv = structuredClone(exported);
      unshippedObjectiveEnv.data.curriculumObjectives = [
        ...(unshippedObjectiveEnv.data.curriculumObjectives ?? []),
        {
          id: "obj-injected-gh73",
          code: "GDPT2018-GH73",
          framework: "gdpt-2018",
          subjectId: "math",
          grade: 5,
          strandVi: "Số học",
          titleVi: "Mục tiêu ngoại lai",
          descriptionVi: "Không có trong danh mục chính thức",
        },
      ];
      const objRes = await call("/api/data/import", {
        method: "POST",
        json: unshippedObjectiveEnv,
      });
      expect(objRes.status).toBe(409);

      // 3. Unshipped subject
      const unshippedSubjectEnv = structuredClone(exported);
      unshippedSubjectEnv.data.subjects.push({
        id: "astrology-gh73",
        code: "AST",
        titleVi: "Chiêm tinh",
        descriptionVi: "Môn ngoại lai",
        position: 99,
      });
      const subRes = await call("/api/data/import", {
        method: "POST",
        json: unshippedSubjectEnv,
      });
      expect(subRes.status).toBe(409);

      // 4. Unshipped catalogue lesson
      const unshippedLessonEnv = structuredClone(exported);
      unshippedLessonEnv.data.lessons.push({
        id: "les-unshipped-cat-gh73",
        skillId: exported.data.skills[0]!.id,
        titleVi: "Bài danh mục giả mạo",
        objectiveVi: "Không tồn tại trên máy chủ",
        gradeBand: "5",
        estimatedMinutes: 10,
        version: 1,
        status: "published",
        ownershipType: "catalogue",
        ownerParentId: null,
        purpose: "official",
        sourceLessonId: null,
        sourceVersion: null,
      });
      const lesRes = await call("/api/data/import", {
        method: "POST",
        json: unshippedLessonEnv,
      });
      expect(lesRes.status).toBe(409);

      expect(batchCalls).toBe(0);
    } finally {
      env.DB = realDb;
    }

    expect(await captureCanonicalDatabaseSnapshot()).toBe(baselineSnapshot);
  });

  it("leaves zero family lessons, zero learner rows, and zero append-only audit rows behind when a late statement inside db.batch fails, and protects existing learners on PK collisions", async () => {
    const existingLearnerId = learnerId;

    // Populate live learner state (approved lesson, goal, session, attempt, hint floor)
    const lessonsRes = await call("/api/parent/lessons");
    expect(lessonsRes.status).toBe(200);
    const lessonsBody = (await lessonsRes.json()) as { lessons: { id: string }[] };
    const catalogueLessonId = lessonsBody.lessons[0]!.id;
    expect(
      (
        await call("/api/parent/lessons/approval", {
          method: "POST",
          json: { lessonId: catalogueLessonId, status: "approved" },
        })
      ).status,
    ).toBe(200);

    const createGoalRes = await call("/api/parent/goals", {
      method: "POST",
      json: {
        subjectId: "math",
        titleVi: "Hoàn thành phân số lớp 5",
        note: "Mục tiêu gốc",
      },
    });
    expect(createGoalRes.status).toBe(200);

    const startSesRes = await call("/api/learner/sessions", {
      method: "POST",
      json: { lessonId: catalogueLessonId },
    });
    expect(startSesRes.status).toBe(200);
    const liveSes = (await startSesRes.json()) as {
      sessionId: string;
      steps: { id: string }[];
    };

    // Request a hint so `hint.requested` exists in exported audit history
    expect(
      (
        await call("/api/learner/hints", {
          method: "POST",
          json: {
            sessionId: liveSes.sessionId,
            stepId: liveSes.steps[0]!.id,
            currentLevel: 2,
          },
        })
      ).status,
    ).toBe(200);

    const correctChoiceId = await answerKeyFor(liveSes.steps[0]!.id);
    expect(
      (
        await call("/api/learner/attempts", {
          method: "POST",
          json: {
            sessionId: liveSes.sessionId,
            stepId: liveSes.steps[0]!.id,
            submission: { kind: "choice", choiceId: correctChoiceId ?? "a" },
            helpLevel: 2,
          },
        })
      ).status,
    ).toBe(200);

    // Also fork a family practice lesson so the export carries family lesson + step statements
    const createFamRes = await call("/api/parent/lessons/fork", {
      method: "POST",
      json: { sourceLessonId: catalogueLessonId },
    });
    expect(createFamRes.status).toBe(200);
    const createdFamily = (await createFamRes.json()) as { lessonId: string };

    // Export full backup containing learner + hint.requested + attempt + family practice lesson
    const exportRes = await call("/api/data/export", { method: "POST" });
    expect(exportRes.status).toBe(200);
    const exported = (await exportRes.json()) as ExportEnvelope;
    expect(
      exported.data.auditEvents.some((a) => a.action === "hint.requested"),
      "backup must include hint.requested audit history",
    ).toBe(true);

    // Remove the family practice lesson from DB while keeping `existingLearnerId` alive,
    // so the restore must BOTH insert family lesson rows AND coexist with `existingLearnerId`!
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lesson_steps WHERE lesson_id = ?1").bind(createdFamily.lessonId),
      env.DB.prepare("DELETE FROM lesson_versions WHERE lesson_id = ?1").bind(createdFamily.lessonId),
      env.DB.prepare("DELETE FROM lessons WHERE id = ?1").bind(createdFamily.lessonId),
    ]);

    // Create a second parent (`parentB`) with no active learner yet so `importRecord` proceeds into `db.batch`
    // while `existingLearnerId` (owned by Parent A) still holds live PKs in D1!
    const parentBId = crypto.randomUUID();
    const nowB = Date.now();
    await env.DB.prepare(
      "INSERT INTO parents (id, password_hash, display_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
    )
      .bind(parentBId, "hash-parent-b-gh73", "Phụ huynh B GH73", nowB)
      .run();
    const jarB = await createParentSessionJar(parentBId, "Phụ huynh B GH73");

    const snapshotBeforeFailedImports = await captureCanonicalDatabaseSnapshot();
    const auditCountBefore =
      (await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_events").first<{ n: number }>())?.n ?? 0;

    // Case A: Attempting to import the exact same `learningSessions` / `learningGoals` / `learningAttempts` IDs
    // via Parent B while `existingLearnerId` still owns those primary keys MUST fail cleanly with 409 Conflict
    // (NOT overwrite `existingLearnerId`'s rows via ON CONFLICT DO UPDATE!) and leave ZERO side effects.
    const pkCollisionRes = await callWithJar(jarB, "/api/data/import", {
      method: "POST",
      json: exported,
    });
    expect(
      pkCollisionRes.status,
      JSON.stringify(await pkCollisionRes.clone().json()),
    ).toBe(409);
    expect(await captureCanonicalDatabaseSnapshot()).toBe(snapshotBeforeFailedImports);

    // Build a clean remapped-ID copy of the backup so primary keys don't collide with `existingLearnerId`
    const cleanBackup = structuredClone(exported);
    cleanBackup.data.schoolYears = cleanBackup.data.schoolYears.map((sy) => ({
      ...sy,
      id: `${sy.id}-restored`,
    }));
    const syMap = new Map(
      exported.data.schoolYears.map((sy, idx) => [sy.id, cleanBackup.data.schoolYears[idx]!.id]),
    );
    cleanBackup.data.learningGoals = cleanBackup.data.learningGoals.map((g) => ({
      ...g,
      id: `${g.id}-restored`,
    }));
    cleanBackup.data.learningSessions = cleanBackup.data.learningSessions.map((s) => ({
      ...s,
      id: `${s.id}-restored`,
      schoolYearId: s.schoolYearId ? (syMap.get(s.schoolYearId) ?? null) : null,
    }));
    const sesMap = new Map(
      exported.data.learningSessions.map((s, idx) => [s.id, cleanBackup.data.learningSessions[idx]!.id]),
    );
    cleanBackup.data.learningAttempts = cleanBackup.data.learningAttempts.map((a) => ({
      ...a,
      id: `${a.id}-restored`,
      sessionId: sesMap.get(a.sessionId) ?? a.sessionId,
    }));
    const attMap = new Map(
      exported.data.learningAttempts.map((a, idx) => [a.id, cleanBackup.data.learningAttempts[idx]!.id]),
    );
    cleanBackup.data.skillEvidence = cleanBackup.data.skillEvidence.map((se) => ({
      ...se,
      id: `${se.id}-restored`,
    }));
    cleanBackup.data.skillEvidenceObservations = (cleanBackup.data.skillEvidenceObservations ?? []).map(
      (obs) => ({
        ...obs,
        id: `${obs.id}-restored`,
        attemptId: attMap.get(obs.attemptId) ?? obs.attemptId,
      }),
    );
    cleanBackup.data.skillEstimates = (cleanBackup.data.skillEstimates ?? []).map((est) => ({
      ...est,
      id: `${est.id}-restored`,
      attemptWatermark: est.attemptWatermark ? (attMap.get(est.attemptWatermark) ?? est.attemptWatermark) : null,
    }));
    cleanBackup.data.reviewSchedule = cleanBackup.data.reviewSchedule.map((rs) => ({
      ...rs,
      id: `${rs.id}-restored`,
    }));
    cleanBackup.data.curriculumIntakes = (cleanBackup.data.curriculumIntakes ?? []).map((ci) => ({
      ...ci,
      id: `${ci.id}-restored`,
    }));
    cleanBackup.data.baselineAssessments = (cleanBackup.data.baselineAssessments ?? []).map((ba) => ({
      ...ba,
      id: `${ba.id}-restored`,
    }));
    cleanBackup.data.learningPlanItems = (cleanBackup.data.learningPlanItems ?? []).map((pi) => ({
      ...pi,
      id: `${pi.id}-restored`,
    }));
    cleanBackup.data.sessionReflections = (cleanBackup.data.sessionReflections ?? []).map((sr) => ({
      ...sr,
      id: `${sr.id}-restored`,
      sessionId: sesMap.get(sr.sessionId) ?? sr.sessionId,
    }));
    cleanBackup.data.reviewApprovals = cleanBackup.data.reviewApprovals.map((ra) => ({
      ...ra,
      id: `${ra.id}-restored`,
    }));
    cleanBackup.data.auditEvents = cleanBackup.data.auditEvents.map((ae) => {
      if (
        ae.action === "hint.requested" &&
        typeof ae.detail === "object" &&
        ae.detail !== null &&
        !Array.isArray(ae.detail)
      ) {
        const d = ae.detail as Record<string, unknown>;
        return {
          ...ae,
          id: `${ae.id}-restored`,
          detail: {
            ...d,
            sessionId: typeof d.sessionId === "string" ? (sesMap.get(d.sessionId) ?? d.sessionId) : d.sessionId,
          },
        };
      }
      return { ...ae, id: `${ae.id}-restored` };
    });

    // Case B: Force a late failure inside the single `db.batch` (appending a failing statement at the very tail
    // after family lessons, learner rows, attempts, and audit_events) and prove SQLite rolls back EVERYTHING.
    const realDb = env.DB;
    env.DB = {
      prepare: (sql: string) => realDb.prepare(sql),
      batch: async (statements: D1PreparedStatement[]) => {
        const poisoned = [
          ...statements,
          // Trigger an abort on the very last statement of the transaction (after audit_events inserts!)
          realDb
            .prepare("INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, started_at, status, steps_seen) VALUES (?1, ?2, ?3, 1, 1, 'invalid_status_constraint_boom', 0)")
            .bind("boom-ses", existingLearnerId, catalogueLessonId),
        ];
        return realDb.batch(poisoned);
      },
      exec: (sql: string) => realDb.exec(sql),
      dump: () => realDb.dump(),
      withSession: (constraintOrBookmark?: unknown) =>
        realDb.withSession(constraintOrBookmark as never),
    } as unknown as D1Database;

    let failedImportRes!: Response;
    try {
      failedImportRes = await callWithJar(jarB, "/api/data/import", {
        method: "POST",
        json: cleanBackup,
      });
    } finally {
      env.DB = realDb;
    }

    expect(failedImportRes.status).toBe(500);

    // Zero family lessons, zero new learners, and ZERO append-only `audit_events` survived the failed batch!
    const familyAfterFailure = await env.DB.prepare("SELECT id FROM lessons WHERE id = ?1")
      .bind(createdFamily.lessonId)
      .first();
    expect(familyAfterFailure).toBeNull();

    const auditCountAfterFailure =
      (await env.DB.prepare("SELECT COUNT(*) AS n FROM audit_events").first<{ n: number }>())?.n ?? 0;
    expect(auditCountAfterFailure).toBe(auditCountBefore);
    expect(await captureCanonicalDatabaseSnapshot()).toBe(snapshotBeforeFailedImports);

    // Retrying the exact same clean backup via Parent B against the restored real DB succeeds cleanly!
    const retryRes = await callWithJar(jarB, "/api/data/import", {
      method: "POST",
      json: cleanBackup,
    });
    expect(retryRes.status).toBe(200);

    const familyAfterRetry = await env.DB.prepare("SELECT id FROM lessons WHERE id = ?1")
      .bind(createdFamily.lessonId)
      .first<{ id: string }>();
    expect(familyAfterRetry?.id).toBe(createdFamily.lessonId);

    const activeLearnersAfterRetry =
      (
        await env.DB.prepare("SELECT id FROM learners WHERE archived_at IS NULL").all<{
          id: string;
        }>()
      ).results ?? [];
    expect(activeLearnersAfterRetry).toHaveLength(2);
    expect(activeLearnersAfterRetry.map((r) => r.id)).toContain(existingLearnerId);
  });
});

/* ── fixtures ─────────────────────────────────────────────────────────────── */

/** The answer key for a step, read from the database rather than the payload. */
async function answerKeyFor(stepId: string): Promise<string | null> {
  const row = await env.DB.prepare("select answer_key from lesson_steps where id = ?")
    .bind(stepId)
    .first<{ answer_key: string }>();
  if (!row) return null;
  const parsed = JSON.parse(row.answer_key) as { correctChoiceId?: unknown } | null;
  return typeof parsed?.correctChoiceId === "string" ? parsed.correctChoiceId : null;
}

/** Option ids from a step's learner payload, in the order the UI shows them. */
function choicesOf(content: unknown): readonly string[] {
  if (typeof content !== "object" || content === null) return [];
  const choices = (content as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((choice) => (choice as { id?: unknown }).id)
    .filter((id): id is string => typeof id === "string");
}
