import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetData } from "./reset-data";
import { openTestDatabase, type TestProxy } from "./test-db";
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

async function call(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(jar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  const method = (init.method ?? "GET").toUpperCase();
  if (!SAFE_METHODS.has(method) && jar.csrf) headers.set("x-tlo-csrf", jar.csrf);

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
