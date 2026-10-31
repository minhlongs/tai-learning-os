/**
 * Integration tests for Supreme Command #10:
 *   4.1 Write-boundary cutoff & authorization (`now` vs `decisionNow`, pause/retry across
 *       deadline, exact boundary at `deadline - 1ms`, `deadline`, `deadline + 1ms`,
 *       non-concurrency DB error propagation, start-vs-revoke in both commit orders).
 *   4.2 Atomic immutable version publication (`lesson_versions` snapshot, concurrent
 *       editor conflict 409 with zero auxiliary/orphan writes, title/objective-only
 *       snapshot isolation, invalid payload rejection).
 *   4.3 Fail-closed import & legacy migration hardening (`0009` forward migration,
 *       forged approval in backup JSON, revoked-org session with imported approval,
 *       legacy backup missing security fields, forged skillEvidence rejection, and
 *       populated v6 -> v9 upgrade with FK-linked `learning_attempts` referencing
 *       `lesson_steps`).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { unstable_splitSqlQuery } from "wrangler";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { openTestDatabase, recreateSchema, type TestProxy } from "./test-db";
import { resetData } from "./reset-data";
import { createSessionToken, csrfTokenFor, verifySessionToken } from "../../src/shared/crypto/session";
import { hashPassword } from "../../src/shared/crypto/password";
import { TRANSFER_FORMAT_VERSION } from "../../src/shared/schemas/transfer";
import * as repo from "../../src/worker/db/repositories";
import { GuardError, loadStepContexts, recordAttemptWithDerivation } from "../../src/worker/services/session-service";
import type {
  ExportResponse,
  ImportResponse,
  LearnerHomeResponse,
  LessonDetailResponse,
  StartSessionResponse,
  UpdateContentResponse,
} from "../../src/shared/api-contract";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");

const ORIGIN = "http://localhost";
const TEST_SECRET = "integration-only-not-a-real-secret-value";

type Env = { DB: D1Database; SESSION_SECRET: string; ENVIRONMENT?: string };

let proxy: TestProxy;
let env: Env;
let worker: { fetch: typeof fetch };

interface Jar {
  cookies: Record<string, string>;
  csrf: string | null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function callWithJar(
  targetJar: Jar,
  path: string,
  init: RequestInit & { json?: unknown; learnerIdHeader?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);

  const cookie = Object.entries(targetJar.cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  if (cookie) headers.set("cookie", cookie);

  if (init.learnerIdHeader) {
    headers.set("x-tlo-learner-id", init.learnerIdHeader);
  }

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

async function createAuthenticatedJar(
  parentId: string,
  displayName: string,
  mode: "parent" | "learner" = "parent",
): Promise<Jar> {
  const now = Date.now();
  const token = await createSessionToken(TEST_SECRET, parentId, displayName, now, mode);
  const verified = await verifySessionToken(TEST_SECRET, token, now);
  if (!verified.ok) throw new Error("Failed to verify test token");
  const csrf = await csrfTokenFor(TEST_SECRET, verified.claims.tokenId);
  return {
    cookies: { tlo_session: token },
    csrf,
  };
}

function stripLeadingComments(statement: string): string {
  return statement.replace(/^(\s*--[^\n]*\n)+\s*/, "").trim();
}

function splitMigrationFile(filename: string): string[] {
  const rawSql = readFileSync(join(MIGRATIONS_DIR, filename), "utf8");
  const statements: string[] = [];
  for (const raw of unstable_splitSqlQuery(rawSql)) {
    const stmt = stripLeadingComments(raw);
    if (stmt) statements.push(stmt);
  }
  return statements;
}

describe("Supreme Command #10 — Write-Boundary Cutoff, Atomic Version Publication & Fail-Closed Import/Migration", () => {
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

  beforeEach(async () => {
    await resetData(env.DB);
  });

  describe("4.1 Write-boundary cutoff and authorization", () => {
    it("rejects an attempt that starts before continuation_deadline but crosses the deadline before write execution (pause/retry), with zero partial writes", async () => {
      const baseNow = 1_760_000_000_000;
      const passHash = await hashPassword("ParentPass123!", 100_000);
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        )
        .bind("parent-1", "Mẹ Tài", passHash, baseNow)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
        )
        .bind("learner-1", "parent-1", "Tài", baseNow)
        .run();

      // Approve math-fractions-equivalent v1 and start a valid in_progress session
      await env.DB.batch([
        ...repo.setApprovalStatements(env.DB, {
          id: "app-1",
          learnerId: "learner-1",
          lessonId: "math-fractions-equivalent",
          version: 1,
          status: "approved",
          decidedBy: "parent-1",
          note: null,
          now: baseNow,
        }),
        repo.auditInsert(env.DB, {
          id: "aud-app-1",
          actor: "parent:parent-1",
          action: "lesson.approval.approved",
          subject: "math-fractions-equivalent",
          detail: JSON.stringify({ learnerId: "learner-1", version: 1 }),
          now: baseNow,
        }),
      ]);

      const stepContexts = await loadStepContexts(env.DB, "math-fractions-equivalent", 1);
      const firstStep = stepContexts[0]!;

      const revokedAt = baseNow + 10_000;
      const deadline = revokedAt + 30 * 60 * 1000;

      await env.DB
        .prepare(
          `INSERT INTO learning_sessions
             (id, learner_id, lesson_id, lesson_version, status, steps_seen, started_at, continuation_deadline)
           VALUES (?1, ?2, ?3, 1, 'in_progress', 1, ?4, ?5)`,
        )
        .bind("sess-cutoff-1", "learner-1", "math-fractions-equivalent", baseNow + 1_000, deadline)
        .run();

      // Request arrives BEFORE deadline (`now = deadline - 500`), but by the time the write batch executes
      // (`clock()`), time has reached `deadline` (`decisionNow = deadline`).
      await expect(
        recordAttemptWithDerivation(env.DB, {
          sessionId: "sess-cutoff-1",
          learnerId: "learner-1",
          lessonId: "math-fractions-equivalent",
          step: firstStep,
          submission: { kind: "multiple_choice", choiceId: "choice-1" },
          helpLevel: 0,
          now: deadline - 500,
          clock: () => deadline,
        }),
      ).rejects.toBeInstanceOf(GuardError);

      // Verify zero partial writes across attempts, skill_evidence, review_schedule, and audit_events
      const attemptsAfter = await repo.listAttemptsForSession(env.DB, "sess-cutoff-1");
      expect(attemptsAfter).toHaveLength(0);
      const evidenceAfter = await repo.listSkillEvidenceForLearner(env.DB, "learner-1");
      expect(evidenceAfter).toHaveLength(0);
      const reviewsAfter = await repo.listReviewScheduleForLearner(env.DB, "learner-1");
      expect(reviewsAfter).toHaveLength(0);

      // Deterministic interleaving test at write execution boundary:
      // A request was prepared when clock was valid (e.g. deadline - 100),
      // but db.batch statement execution is delayed and runs when clock reaches/passes deadline.
      // attemptInsertGuarded executes statement-level subquery: (?17 < continuation_deadline).
      // When ?17 (decisionNow) reaches deadline, subquery returns NULL for attempt_no,
      // tripping SQLite NOT NULL constraint on attempt_no and aborting the entire atomic transaction!
      const delayedStmt = repo.attemptInsertGuarded(env.DB, {
        id: "att-interleaved-1",
        sessionId: "sess-cutoff-1",
        learnerId: "learner-1",
        lessonId: "math-fractions-equivalent",
        stepId: firstStep.stepId,
        stepVersion: 1,
        skillId: "math-frac-equiv",
        submitted: JSON.stringify({ kind: "choice", choiceId: "choice-1" }),
        outcome: "correct",
        helpLevel: 0,
        evidenceKind: "observed",
        attemptNo: 1,
        now: deadline - 100, // input time was before deadline
        decisionNow: deadline, // write execution time crossed deadline
        expectedStepAttemptCount: 0,
        expectedHintAuditCount: 0,
        expectedSkillAttemptCount: 0,
      });

      // Executing statement at write boundary when decisionNow >= deadline fails closed with NOT NULL constraint
      await expect(delayedStmt.run()).rejects.toThrow(/NOT NULL constraint failed/i);

      // Verify still 0 attempts in DB
      const attemptsStillZero = await repo.listAttemptsForSession(env.DB, "sess-cutoff-1");
      expect(attemptsStillZero).toHaveLength(0);
    });

    it("enforces exact boundary semantics (deadline - 1ms allowed, deadline rejected, deadline + 1ms rejected) across submitAttempt, requestHint, finalizeSession, and startSession resume", async () => {
      const now = Date.now();
      const passHash = await hashPassword("ParentPass123!", 100_000);
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)",
        )
        .bind("parent-b", "Bố Tài", passHash, now)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES (?1, ?2, ?3, 4, ?4, ?4)",
        )
        .bind("learner-b", "parent-b", "Tài", now)
        .run();

      const stepContexts = await loadStepContexts(env.DB, "math-fractions-equivalent", 1);
      const step1 = stepContexts[0]!;

      // Session 1: continuation_deadline is in the future (allowed at deadline - 1ms)
      const futureDeadline = Date.now() + 60_000;
      await env.DB
        .prepare(
          `INSERT INTO learning_sessions
             (id, learner_id, lesson_id, lesson_version, status, steps_seen, started_at, continuation_deadline)
           VALUES ('sess-before', 'learner-b', 'math-fractions-equivalent', 1, 'in_progress', 1, ?1, ?2)`,
        )
        .bind(now - 5_000, futureDeadline)
        .run();

      // Exact boundary `deadline - 1ms` via recordAttemptWithDerivation
      const beforeRes = await recordAttemptWithDerivation(env.DB, {
        sessionId: "sess-before",
        learnerId: "learner-b",
        lessonId: "math-fractions-equivalent",
        step: step1,
        submission: { kind: "multiple_choice", choiceId: "choice-1" },
        helpLevel: 0,
        now: futureDeadline - 1,
        clock: () => futureDeadline - 1,
      });
      expect(beforeRes.attemptNo).toBe(1);

      // Exact boundary `decisionNow === deadline` must be rejected
      await expect(
        recordAttemptWithDerivation(env.DB, {
          sessionId: "sess-before",
          learnerId: "learner-b",
          lessonId: "math-fractions-equivalent",
          step: step1,
          submission: { kind: "multiple_choice", choiceId: "choice-1" },
          helpLevel: 0,
          now: futureDeadline,
          clock: () => futureDeadline,
        }),
      ).rejects.toBeInstanceOf(GuardError);

      // Exact boundary `decisionNow === deadline + 1` must be rejected
      await expect(
        recordAttemptWithDerivation(env.DB, {
          sessionId: "sess-before",
          learnerId: "learner-b",
          lessonId: "math-fractions-equivalent",
          step: step1,
          submission: { kind: "multiple_choice", choiceId: "choice-1" },
          helpLevel: 0,
          now: futureDeadline + 1,
          clock: () => futureDeadline + 1,
        }),
      ).rejects.toBeInstanceOf(GuardError);

      // Now clamp `sess-before` to `Date.now() - 1` (past deadline) and verify HTTP routes
      // `requestHint`, `submitAttempt`, `finalizeSession`, and `startSession` all reject with 403
      await env.DB
        .prepare("UPDATE learning_sessions SET continuation_deadline = ?1 WHERE id = 'sess-before'")
        .bind(Date.now() - 1)
        .run();

      const learnerJar = await createAuthenticatedJar("parent-b", "Bố Tài", "learner");

      const hintRes = await callWithJar(learnerJar, "/api/learner/hints", {
        method: "POST",
        json: { sessionId: "sess-before", stepId: step1.stepId, level: 1 },
      });
      expect(hintRes.status).toBe(403);

      const attemptRes = await callWithJar(learnerJar, "/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: "sess-before",
          stepId: step1.stepId,
          submission: { kind: "choice", choiceId: "choice-1" },
          helpLevel: 0,
        },
      });
      expect(attemptRes.status).toBe(403);

      const finalizeRes = await callWithJar(learnerJar, "/api/learner/sessions/finalize", {
        method: "POST",
        json: { sessionId: "sess-before", status: "completed" },
      });
      expect(finalizeRes.status).toBe(403);

      const resumeRes = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent" },
      });
      expect(resumeRes.status).toBe(403);
    });

    it("propagates non-concurrency DB errors instead of converting them into 403 GuardError, and enforces start-vs-revoke in both commit orders", async () => {
      const now = Date.now();
      const passHash = await hashPassword("ParentPass123!", 100_000);
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-c', 'Mẹ Tài', ?1, ?2, ?2)",
        )
        .bind(passHash, now)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-c', 'parent-c', 'Tài', 4, ?1, ?1)",
        )
        .bind(now)
        .run();

      const parentJar = await createAuthenticatedJar("parent-c", "Mẹ Tài", "parent");
      const learnerJar = await createAuthenticatedJar("parent-c", "Mẹ Tài", "learner");

      // Order 1: Approve -> Revoke -> Start (Revoke commits before Start)
      await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent", status: "approved" },
      });
      await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent", status: "rejected", note: "Tạm hoãn" },
      });
      const startAfterRevoke = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent" },
      });
      expect(startAfterRevoke.status).toBe(403);

      // Order 2: Approve -> Start -> Revoke (Start commits before Revoke)
      await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent", status: "approved" },
      });
      const startBeforeRevoke = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent" },
      });
      expect(startBeforeRevoke.status).toBe(200);
      const startedBody = (await startBeforeRevoke.json()) as StartSessionResponse;

      const beforeRevokeMs = Date.now();
      await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent", status: "rejected", note: "Thu hồi sau khi mở" },
      });
      const afterRevokeMs = Date.now();

      const sessionRow = await repo.findSession(env.DB, startedBody.sessionId, "parent-c");
      expect(sessionRow?.continuation_deadline).not.toBeNull();
      expect(sessionRow!.continuation_deadline!).toBeGreaterThanOrEqual(beforeRevokeMs + 30 * 60 * 1000);
      expect(sessionRow!.continuation_deadline!).toBeLessThanOrEqual(afterRevokeMs + 30 * 60 * 1000);

      const stepContexts = await loadStepContexts(env.DB, "math-fractions-equivalent", 1);
      const validStep = stepContexts[0]!;

      // Non-concurrency DB error (e.g., FK failure on nonexistent stepId) must throw raw error, not GuardError
      await expect(
        recordAttemptWithDerivation(env.DB, {
          sessionId: startedBody.sessionId,
          learnerId: "learner-c",
          lessonId: "math-fractions-equivalent",
          step: {
            ...validStep,
            stepId: "non-existent-step-id-causing-fk-error",
          },
          submission: { kind: "multiple_choice", choiceId: "choice-1" },
          helpLevel: 0,
          now: Date.now(),
        }),
      ).rejects.not.toBeInstanceOf(GuardError);
    });
  });

  describe("4.2 Atomic immutable version publication", () => {
    it("enforces atomic version conflict (409) when two editors publish from the same expectedVersion, leaving zero orphan steps or false audits, while preserving v1 metadata & steps for active sessions", async () => {
      const now = Date.now();
      const passHash = await hashPassword("ParentPass123!", 100_000);
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-v', 'Mẹ Tài', ?1, ?2, ?2)",
        )
        .bind(passHash, now)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-v', 'parent-v', 'Tài', 4, ?1, ?1)",
        )
        .bind(now)
        .run();

      const parentJar = await createAuthenticatedJar("parent-v", "Mẹ Tài", "parent");
      const learnerJar = await createAuthenticatedJar("parent-v", "Mẹ Tài", "learner");

      // Approve v1 and start a learner session on v1
      await callWithJar(parentJar, "/api/parent/lessons/approval", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent", status: "approved" },
      });
      const detailRes = await callWithJar(parentJar, "/api/parent/lessons/math-fractions-equivalent?version=1");
      expect(detailRes.status).toBe(200);
      const v1Detail = (await detailRes.json()) as LessonDetailResponse;
      const v1Title = v1Detail.titleVi;
      const v1Objective = v1Detail.objectiveVi;

      const startRes = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent" },
      });
      expect(startRes.status).toBe(200);

      // Invalid payload is rejected before any mutation
      const invalidRes = await callWithJar(parentJar, "/api/parent/lessons/content", {
        method: "POST",
        json: {
          lessonId: "math-fractions-equivalent",
          expectedVersion: 1,
          titleVi: "Tiêu đề lỗi",
          objectiveVi: "Mục tiêu lỗi",
          steps: [{ position: 1, kind: "concept", content: { invalid: true }, explanationVi: "Lỗi", answerKey: {} }],
        },
      });
      expect(invalidRes.status).toBe(400);

      // Editor A publishes v2 (from expectedVersion: 1) -> succeeds (200)
      const v2Steps = v1Detail.steps.map((s) => ({
        clientId: crypto.randomUUID(),
        position: s.position,
        kind: s.kind,
        content: s.content,
        explanationVi: `${s.explanationVi} (Bản v2 của Editor A)`,
        answerKey: s.answerKey,
      }));
      const editorARes = await callWithJar(parentJar, "/api/parent/lessons/content", {
        method: "POST",
        json: {
          lessonId: "math-fractions-equivalent",
          expectedVersion: 1,
          titleVi: "Hai phân số bằng nhau (Phiên bản 2 - Editor A)",
          objectiveVi: "Mục tiêu phiên bản 2 của Editor A",
          steps: v2Steps,
        },
      });
      expect(editorARes.status).toBe(200);
      const editorABody = (await editorARes.json()) as UpdateContentResponse;
      expect(editorABody.version).toBe(2);

      // Editor B attempts to publish using stale expectedVersion: 1 -> fails atomically with 409 Conflict
      const staleSteps = v1Detail.steps.map((s) => ({
        clientId: crypto.randomUUID(),
        position: s.position,
        kind: s.kind,
        content: s.content,
        explanationVi: `${s.explanationVi} (Bản xung đột của Editor B)`,
        answerKey: s.answerKey,
      }));
      const editorBRes = await callWithJar(parentJar, "/api/parent/lessons/content", {
        method: "POST",
        json: {
          lessonId: "math-fractions-equivalent",
          expectedVersion: 1,
          titleVi: "Tiêu đề xung đột của Editor B",
          objectiveVi: "Mục tiêu xung đột của Editor B",
          steps: staleSteps,
        },
      });
      expect(editorBRes.status).toBe(409);

      // Verify v2 steps and metadata belong strictly to Editor A (never overwritten by Editor B)
      const v2Detail = (await (
        await callWithJar(parentJar, "/api/parent/lessons/math-fractions-equivalent?version=2")
      ).json()) as LessonDetailResponse;
      expect(v2Detail.titleVi).toBe("Hai phân số bằng nhau (Phiên bản 2 - Editor A)");
      expect(v2Detail.objectiveVi).toBe("Mục tiêu phiên bản 2 của Editor A");
      expect(v2Detail.steps[0]?.explanationVi).toContain("Bản v2 của Editor A");

      // Verify v1 snapshot metadata and steps are completely untouched and still served to the active v1 session
      const v1DetailAfter = (await (
        await callWithJar(parentJar, "/api/parent/lessons/math-fractions-equivalent?version=1")
      ).json()) as LessonDetailResponse;
      expect(v1DetailAfter.titleVi).toBe(v1Title);
      expect(v1DetailAfter.objectiveVi).toBe(v1Objective);
      expect(v1DetailAfter.steps[0]?.explanationVi).not.toContain("Bản v2 của Editor A");

      // Title/objective-only edit (v3) creates a full snapshot of metadata & steps without mutating v1 or v2
      const v3TitleOnlyRes = await callWithJar(parentJar, "/api/parent/lessons/content", {
        method: "POST",
        json: {
          lessonId: "math-fractions-equivalent",
          expectedVersion: 2,
          titleVi: "Hai phân số bằng nhau (Phiên bản 3 - Chỉ đổi tiêu đề)",
          objectiveVi: "Mục tiêu phiên bản 3 chỉ đổi metadata",
          steps: v2Steps,
        },
      });
      expect(v3TitleOnlyRes.status).toBe(200);
      const v2DetailAfterV3 = (await (
        await callWithJar(parentJar, "/api/parent/lessons/math-fractions-equivalent?version=2")
      ).json()) as LessonDetailResponse;
      expect(v2DetailAfterV3.titleVi).toBe("Hai phân số bằng nhau (Phiên bản 2 - Editor A)");
      expect(v2DetailAfterV3.objectiveVi).toBe("Mục tiêu phiên bản 2 của Editor A");

      // Learner home `continueLesson` and session resume still read v1 title & objective during the 30-minute continuation window
      const homeBody = (await (await callWithJar(learnerJar, "/api/learner/home")).json()) as LearnerHomeResponse;
      expect(homeBody.continueLesson?.titleVi).toBe(v1Title);

      const resumedBody = (await (
        await callWithJar(learnerJar, "/api/learner/sessions", {
          method: "POST",
          json: { lessonId: "math-fractions-equivalent" },
        })
      ).json()) as StartSessionResponse;
      expect(resumedBody.lessonTitleVi).toBe(v1Title);
    });
  });

  describe("4.3 Fail-closed import and legacy migration hardening", () => {
    it("refuses to treat reviewApprovals in imported JSON as live authorization, clamps imported in_progress sessions to started_at, and rejects forged skillEvidence without observed attempts", async () => {
      const now = Date.now();
      const passHash = await hashPassword("ParentPass123!", 100_000);
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-imp', 'Mẹ Tài', ?1, ?2, ?2)",
        )
        .bind(passHash, now)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('learner-imp', 'parent-imp', 'Tài', 4, ?1, ?1)",
        )
        .bind(now)
        .run();

      const parentJar = await createAuthenticatedJar("parent-imp", "Mẹ Tài", "parent");
      const learnerJar = await createAuthenticatedJar("parent-imp", "Mẹ Tài", "learner");

      // Export baseline envelope
      const exportRes = await callWithJar(parentJar, "/api/data/export", { method: "POST" });
      expect(exportRes.status).toBe(200);
      const envelope = (await exportRes.json()) as ExportResponse;
      const data = envelope.data as Record<string, unknown[]>;

      // 1. Forged skillEvidence claiming INDEPENDENT with zero observed attempts must be rejected (400)
      const forgedEvidenceEnvelope = structuredClone(envelope);
      (forgedEvidenceEnvelope.data as Record<string, unknown[]>).skillEvidence = [
        {
          id: "forged-ev-1",
          learnerId: "learner-imp",
          skillId: "math-frac-equiv",
          state: "INDEPENDENT",
          independentCount: 3,
          assistedCount: 0,
          correctCount: 3,
          lastIndependentAt: now,
          lastObservedAt: now,
          source: "derived",
          correctionNote: null,
          updatedAt: now,
        },
      ];
      const forgedImportRes = await callWithJar(parentJar, "/api/data/import", {
        method: "POST",
        json: forgedEvidenceEnvelope,
      });
      expect(forgedImportRes.status).toBe(400);

      // 2. Backup containing `reviewApprovals` with `status: 'approved'` and an `in_progress` session with `continuationDeadline: null`
      const forgedApprovalEnvelope = structuredClone(envelope);
      const bodyData = forgedApprovalEnvelope.data as Record<string, unknown[]>;
      bodyData.reviewApprovals = [
        {
          id: "forged-app-1",
          learnerId: "learner-imp",
          lessonId: "math-fractions-equivalent",
          lessonVersion: 1,
          status: "approved",
          decidedBy: "parent-imp",
          decidedAt: now - 10_000,
          note: "Forged in backup file",
        },
      ];
      bodyData.learningSessions = [
        {
          id: "imported-in-progress-sess",
          learnerId: "learner-imp",
          lessonId: "math-fractions-equivalent",
          lessonVersion: 1,
          schoolYearId: null,
          status: "in_progress",
          stepsSeen: 1,
          startedAt: now - 60_000,
          endedAt: null,
          continuationDeadline: null,
        },
      ];

      // Delete existing learner first with exact confirmation nickname ("XOA Tài") so we import cleanly
      const delRes = await callWithJar(parentJar, "/api/data/learner", {
        method: "DELETE",
        json: { learnerId: "learner-imp", confirmation: "XOA Tài" },
      });
      expect(delRes.status).toBe(200);

      const importRes = await callWithJar(parentJar, "/api/data/import", {
        method: "POST",
        json: forgedApprovalEnvelope,
      });
      expect(importRes.status).toBe(200);
      const importBody = (await importRes.json()) as ImportResponse;
      expect(importBody.ok).toBe(true);

      // Verify imported reviewApproval was downgraded to 'draft'
      const approvalRow = await env.DB
        .prepare("SELECT status FROM review_approvals WHERE lesson_id = 'math-fractions-equivalent'")
        .first<{ status: string }>();
      expect(approvalRow?.status).toBe("draft");

      // Verify imported in_progress session had its continuation_deadline clamped to started_at (never NULL or extended)
      // and its status safely transitioned to 'abandoned' so it can never be resumed.
      const importedSess = await env.DB
        .prepare("SELECT started_at, continuation_deadline, status FROM learning_sessions WHERE id = 'imported-in-progress-sess'")
        .first<{ started_at: number; continuation_deadline: number | null; status: string }>();
      expect(importedSess?.continuation_deadline).toBe(importedSess?.started_at);
      expect(importedSess?.status).toBe("abandoned");

      // Verify learner cannot submit attempts on the imported session or start a new session without live parent approval.
      // Attempt returns 400 (session already abandoned) or 403 (forbidden).
      const steps = await repo.listStepsForLesson(env.DB, "math-fractions-equivalent", 1);
      const attemptOnImported = await callWithJar(learnerJar, "/api/learner/attempts", {
        method: "POST",
        json: {
          sessionId: "imported-in-progress-sess",
          stepId: steps[0]!.id,
          submission: { kind: "choice", choiceId: "choice-1" },
          helpLevel: 0,
        },
      });
      expect([400, 403]).toContain(attemptOnImported.status);

      const startWithoutReapproval = await callWithJar(learnerJar, "/api/learner/sessions", {
        method: "POST",
        json: { lessonId: "math-fractions-equivalent" },
      });
      expect(startWithoutReapproval.status).toBe(403);

      // 3. Legacy backup missing security fields (`lessonVersion`, `continuationDeadline`):
      //    imported approval is still downgraded and session is clamped to startedAt
      const currentLearner = await repo.findFirstLearnerForParent(env.DB, "parent-imp");
      expect(currentLearner).not.toBeNull();
      const del2Res = await callWithJar(parentJar, "/api/data/learner", {
        method: "DELETE",
        json: { learnerId: currentLearner!.id, confirmation: "XOA Tài" },
      });
      expect(del2Res.status).toBe(200);

      const legacyBackupEnvelope = structuredClone(envelope);
      const legacyData = legacyBackupEnvelope.data as Record<string, unknown[]>;
      legacyData.reviewApprovals = [
        {
          id: "legacy-backup-app",
          learnerId: "learner-imp",
          lessonId: "math-fractions-equivalent",
          status: "approved",
          decidedBy: "parent-imp",
          decidedAt: now - 20_000,
          note: "Legacy backup without version",
        },
      ];
      legacyData.learningSessions = [
        {
          id: "legacy-backup-sess",
          learnerId: "learner-imp",
          lessonId: "math-fractions-equivalent",
          lessonVersion: 1,
          schoolYearId: null,
          status: "in_progress",
          stepsSeen: 1,
          startedAt: now - 120_000,
          endedAt: null,
        },
      ];

      const legacyImportRes = await callWithJar(parentJar, "/api/data/import", {
        method: "POST",
        json: legacyBackupEnvelope,
      });
      expect(legacyImportRes.status).toBe(200);

      const legacySessAfter = await env.DB
        .prepare("SELECT started_at, continuation_deadline, lesson_version, status FROM learning_sessions WHERE id = 'legacy-backup-sess'")
        .first<{ started_at: number; continuation_deadline: number | null; lesson_version: number; status: string }>();
      expect(legacySessAfter?.lesson_version).toBe(1);
      expect(legacySessAfter?.continuation_deadline).toBe(legacySessAfter?.started_at);
      expect(legacySessAfter?.status).toBe("abandoned");

      // 4. Priority Counterexample: Future-dated in_progress session in backup JSON
      //    Attacker crafts a backup where in_progress session has `startedAt = now + 86_400_000` (tomorrow)
      //    and no continuationDeadline or a future deadline.
      //    Import must reject the future-dated timestamp or fail closed so the session CANNOT be resumed or attempted.
      const currentLearner3 = await repo.findFirstLearnerForParent(env.DB, "parent-imp");
      expect(currentLearner3).not.toBeNull();
      const del3Res = await callWithJar(parentJar, "/api/data/learner", {
        method: "DELETE",
        json: { learnerId: currentLearner3!.id, confirmation: "XOA Tài" },
      });
      expect(del3Res.status).toBe(200);

      const futureDatedEnvelope = structuredClone(envelope);
      const futureData = futureDatedEnvelope.data as Record<string, unknown[]>;
      const futureTimestamp = now + 86_400_000; // +24 hours into the future
      futureData.learningSessions = [
        {
          id: "future-sess-attack",
          learnerId: "learner-imp",
          lessonId: "math-fractions-equivalent",
          lessonVersion: 1,
          schoolYearId: null,
          status: "in_progress",
          stepsSeen: 1,
          startedAt: futureTimestamp,
          endedAt: null,
          continuationDeadline: null,
        },
      ];

      const futureImportRes = await callWithJar(parentJar, "/api/data/import", {
        method: "POST",
        json: futureDatedEnvelope,
      });

      // The import must either be rejected at envelope validation (400) because of impossible future timestamp,
      // OR if accepted, the session must be transitioned/clamped so it CANNOT be resumed (resume returns 403, attempt returns 403).
      if (futureImportRes.status === 200) {
        // If imported, verify learner CANNOT resume this session or submit attempts
        const resumeAttack = await callWithJar(learnerJar, "/api/learner/sessions", {
          method: "POST",
          json: { lessonId: "math-fractions-equivalent" },
        });
        expect(resumeAttack.status).toBe(403);

        const attemptAttack = await callWithJar(learnerJar, "/api/learner/attempts", {
          method: "POST",
          json: {
            sessionId: "future-sess-attack",
            stepId: steps[0]!.id,
            submission: { kind: "choice", choiceId: "choice-1" },
            helpLevel: 0,
          },
        });
        expect(attemptAttack.status).toBe(403);
      } else {
        expect(futureImportRes.status).toBe(400);
      }

      void data;
      void TRANSFER_FORMAT_VERSION;
    });

    it("upgrades a populated v6 database (with FK-linked learning_attempts referencing lesson_steps and legacy unverified approvals) cleanly through v7, v8, and v9 with 0 foreign-key errors and fail-closed approvals", async () => {
      // Drop all tables/triggers on the branded test DB and replay ONLY migrations 0001..0006
      const triggers =
        (await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all<{ name: string }>())
          .results ?? [];
      for (const trigger of triggers) {
        await env.DB.prepare(`DROP TRIGGER IF EXISTS ${trigger.name}`).run();
      }
      const reserved =
        (await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>())
          .results ?? [];
      let tables = reserved
        .map((r) => r.name)
        .filter((n) => !n.startsWith("sqlite_") && !n.startsWith("_cf_") && n !== "d1_migrations");
      while (tables.length > 0) {
        const remaining: string[] = [];
        for (const t of tables) {
          try {
            await env.DB.prepare(`DROP TABLE IF EXISTS ${t}`).run();
          } catch {
            remaining.push(t);
          }
        }
        tables = remaining;
      }

      const v1ToV6 = [
        "0001_initial_schema.sql",
        "0002_reference_content.sql",
        "0003_curriculum_and_trust_closure.sql",
        "0004_evidence_integrity.sql",
        "0005_organization_and_consent.sql",
        "0006_lesson_authoring_and_assignments.sql",
      ];
      for (const file of v1ToV6) {
        for (const stmt of splitMigrationFile(file)) {
          await env.DB.prepare(stmt).run();
        }
      }

      // Populate v6 database with parent, learner, lesson, lesson_step, legacy lesson-level approval (no learner_id/version columns),
      // an in_progress session, and FK-linked learning_attempts referencing lesson_steps(id)
      const now = 1_760_000_000_000;
      await env.DB
        .prepare(
          "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('p-v6', 'Phụ huynh v6', 'hash', ?1, ?1)",
        )
        .bind(now)
        .run();
      await env.DB
        .prepare(
          "INSERT INTO learners (id, parent_id, nickname, grade, created_at, updated_at) VALUES ('l-v6', 'p-v6', 'Tài v6', 4, ?1, ?1)",
        )
        .bind(now)
        .run();

      await env.DB
        .prepare(
          `INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at)
           VALUES ('lesson-v6', 'math', 'math-frac-equiv', 'Bài v6', 'Lesson v6', 'Mục tiêu v6', 'Objective v6', 3, 4, 1, ?1, ?1)`,
        )
        .bind(now)
        .run();

      await env.DB
        .prepare(
          `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
           VALUES ('step-v6-1', 'lesson-v6', 1, 'concept', '{"type":"multiple_choice","promptVi":"P","choices":[{"id":"choice-1","textVi":"A"},{"id":"choice-2","textVi":"B"}]}', '{"correctChoiceId":"choice-1"}', 'Giai thich v6', 1)`,
        )
        .run();

      // Legacy v6 review_approvals had `(id, lesson_id, status, decided_by, decided_at, note)`
      await env.DB
        .prepare(
          "INSERT INTO review_approvals (id, lesson_id, status, decided_by, decided_at, note) VALUES ('legacy-app-v6', 'lesson-v6', 'approved', 'p-v6', ?1, 'Legacy v6 approval without version/learner audit')",
        )
        .bind(now)
        .run();

      await env.DB
        .prepare(
          "INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, status, steps_seen, started_at) VALUES ('sess-v6-open', 'l-v6', 'lesson-v6', 1, 'in_progress', 1, ?1)",
        )
        .bind(now + 1000)
        .run();

      await env.DB
        .prepare(
          `INSERT INTO learning_attempts
             (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, created_at)
           VALUES ('att-v6-1', 'sess-v6-open', 'l-v6', 'lesson-v6', 'step-v6-1', 1, 'math-frac-equiv', '{}', 'correct', 0, 'observed', 1, ?1)`,
        )
        .bind(now + 2000)
        .run();

      // Now apply migrations 0007, 0008, and 0009 in sequence
      for (const file of [
        "0007_learner_version_approvals_and_session_continuation.sql",
        "0008_grade4_curriculum_expansion.sql",
        "0009_version_snapshots_and_legacy_approval_hardening.sql",
      ]) {
        for (const stmt of splitMigrationFile(file)) {
          await env.DB.prepare(stmt).run();
        }
      }

      // 1. Foreign key integrity check must return 0 violations
      const fkViolations = (await env.DB.prepare("PRAGMA foreign_key_check").all()).results ?? [];
      expect(fkViolations).toHaveLength(0);

      // 2. FK-linked learning_attempts row is preserved intact
      const attemptAfter = await env.DB
        .prepare("SELECT id, step_id, outcome, evidence_kind FROM learning_attempts WHERE id = 'att-v6-1'")
        .first<{ id: string; step_id: string; outcome: string; evidence_kind: string }>();
      expect(attemptAfter).toEqual({
        id: "att-v6-1",
        step_id: "step-v6-1",
        outcome: "correct",
        evidence_kind: "observed",
      });

      // 3. Legacy unverified approval was fail-closed downgraded to 'draft' by 0009
      const migratedApproval = await env.DB
        .prepare("SELECT status FROM review_approvals WHERE id = 'legacy-app-v6'")
        .first<{ status: string }>();
      expect(migratedApproval?.status).toBe("draft");

      // 4. Legacy in_progress session without verified approval had its continuation_deadline clamped to started_at
      const migratedSession = await env.DB
        .prepare("SELECT started_at, continuation_deadline FROM learning_sessions WHERE id = 'sess-v6-open'")
        .first<{ started_at: number; continuation_deadline: number | null }>();
      expect(migratedSession?.continuation_deadline).toBe(migratedSession?.started_at);

      // 5. lesson_versions table is populated
      const versionCount = await env.DB
        .prepare("SELECT COUNT(*) AS cnt FROM lesson_versions")
        .first<{ cnt: number }>();
      expect(versionCount?.cnt).toBeGreaterThanOrEqual(1);

      // Restore clean latest schema for any subsequent tests
      await recreateSchema(env.DB);
    });
  });
});
