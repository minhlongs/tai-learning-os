import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { listShippedMigrationFiles } from "../../scripts/migrate-local-d1.mjs";
import {
  ADL_VERB_ANSWERED,
  ADL_VERB_COMPLETED,
  buildOpenPortabilityBundle,
  CLR_20_CONTEXT,
  computePortabilityChecksums,
  HOUSEHOLD_ISSUER_URN,
  PORTABILITY_BUNDLE_FORMAT,
  serializePortabilityBundleFiles,
  type PortabilityManifest,
  type Xapi20Statement,
} from "../../src/shared/portability/open-portability";
import {
  escapeJsonForHtmlScript,
  renderStandalonePortabilityViewerHtml,
  VIEWER_CSP_CONTENT,
} from "../../src/shared/portability/static-viewer";
import { leaksAnswer } from "../../src/shared/schemas/exercise";
import {
  TRANSFER_FORMAT_VERSION,
  validateExportEnvelope,
  type ExportEnvelope,
} from "../../src/shared/schemas/transfer";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "migrations");
const PORTABILITY_CLI = join(REPO_ROOT, "scripts", "export-portability.mjs");
const MIGRATION_FILES = listShippedMigrationFiles();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function buildSampleExportEnvelope(overrides?: {
  nickname?: string;
  goalTitle?: string;
  goalNote?: string;
  reflectionNote?: string;
  correctionNote?: string | null;
}): ExportEnvelope {
  const exportedAt = 1_760_000_000_000;
  return {
    formatVersion: TRANSFER_FORMAT_VERSION,
    exportedAt,
    source: "manual_export",
    containsLearnerEvidence: true,
    data: {
      learners: [
        {
          id: "learner-minh",
          nickname: overrides?.nickname ?? "Minh",
          birthYear: 2017,
          grade: 4,
          timezone: "Asia/Ho_Chi_Minh",
          createdAt: exportedAt - 86_400_000,
          updatedAt: exportedAt - 3_600_000,
          archivedAt: null,
        },
      ],
      schoolYears: [
        {
          id: "sy-2026-2027",
          learnerId: "learner-minh",
          label: "2026-2027",
          startsOn: "2026-09-01",
          endsOn: "2027-05-31",
          grade: 4,
        },
      ],
      subjects: [
        { id: "math", nameVi: "Toán", nameEn: "Mathematics", sort: 1, active: 1 },
        { id: "english", nameVi: "Tiếng Anh", nameEn: "English", sort: 2, active: 1 },
      ],
      skills: [
        {
          id: "skill-frac-concept",
          subjectId: "math",
          code: "MATH.G4.FRAC.1",
          nameVi: "Nhận biết phân số",
          nameEn: "Fraction Recognition",
          gradeFrom: 4,
          gradeTo: 4,
        },
        {
          id: "skill-frac-equiv",
          subjectId: "math",
          code: "MATH.G4.FRAC.2",
          nameVi: "Phân số bằng nhau",
          nameEn: "Equivalent Fractions",
          gradeFrom: 4,
          gradeTo: 5,
        },
      ],
      skillPrerequisites: [
        {
          prerequisiteId: "skill-frac-concept",
          skillId: "skill-frac-equiv",
        },
      ],
      curriculumObjectives: [
        {
          id: "obj-gdpt-math-4-frac",
          subjectId: "math",
          grade: 4,
          code: "GDPT2018.TOAN.4.PS.01",
          titleVi: "Khái niệm ban đầu về phân số",
          descriptionVi: "Đọc, viết và biểu diễn phân số trên hình trực quan.",
          skillId: "skill-frac-concept",
          provenance: "gdpt_2018_objective",
          sourceRef: "CT GDPT 2018 Môn Toán Lớp 4",
          createdAt: exportedAt - 100_000,
        },
      ],
      lessons: [
        {
          id: "lesson-frac-1",
          subjectId: "math",
          skillId: "skill-frac-concept",
          titleVi: "Làm quen với phân số",
          titleEn: "Introduction to Fractions",
          objectiveVi: "Hiểu tử số và mẫu số qua thanh phân số.",
          objectiveEn: "Understand numerator and denominator via fraction bars.",
          gradeFrom: 4,
          gradeTo: 4,
          version: 1,
          ownershipType: "catalogue",
          ownerParentId: null,
          purpose: "official",
          sourceLessonId: null,
          sourceVersion: null,
          createdAt: exportedAt - 90_000,
          updatedAt: exportedAt - 90_000,
        },
        {
          id: "lesson-family-prac",
          subjectId: "math",
          skillId: "skill-frac-equiv",
          titleVi: "Ôn tập gia đình về phân số",
          titleEn: "Family Fraction Practice",
          objectiveVi: "Củng cố phân số bằng nhau tại nhà.",
          objectiveEn: "Practice equivalent fractions at home.",
          gradeFrom: 4,
          gradeTo: 4,
          version: 1,
          ownershipType: "family",
          ownerParentId: "parent-1",
          purpose: "practice",
          sourceLessonId: null,
          sourceVersion: null,
          createdAt: exportedAt - 80_000,
          updatedAt: exportedAt - 80_000,
        },
      ],
      lessonVersions: [
        {
          lessonId: "lesson-frac-1",
          version: 1,
          titleVi: "Làm quen với phân số",
          titleEn: "Introduction to Fractions",
          objectiveVi: "Hiểu tử số và mẫu số qua thanh phân số.",
          objectiveEn: "Understand numerator and denominator via fraction bars.",
          createdAt: exportedAt - 90_000,
        },
        {
          lessonId: "lesson-family-prac",
          version: 1,
          titleVi: "Ôn tập gia đình về phân số",
          titleEn: "Family Fraction Practice",
          objectiveVi: "Củng cố phân số bằng nhau tại nhà.",
          objectiveEn: "Practice equivalent fractions at home.",
          createdAt: exportedAt - 80_000,
        },
      ],
      lessonSteps: [
        {
          id: "step-frac-1",
          lessonId: "lesson-frac-1",
          position: 1,
          kind: "independent",
          content: {
            type: "fraction_visual",
            question_vi: "Chọn phân số biểu diễn 3 phần trên 4 phần bằng nhau.",
            question_en: "Select the fraction representing 3 out of 4 equal parts.",
            allowedDenominators: [2, 4, 8],
            maxParts: 8,
            correctNumerator: 3,
            correctDenominator: 4,
            bar: { parts: 4, highlighted: 3 },
          },
          answerKey: {
            secretCanary: "CANARY_ANSWER_KEY_DO_NOT_EXPORT_999",
            correctChoiceId: "secret-choice-id-77",
          },
          explanationVi: "Thanh được chia làm 4 phần bằng nhau và tô màu 3 phần.",
          contentVersion: 1,
          sourceStepId: null,
        },
        {
          id: "step-frac-transfer",
          lessonId: "lesson-frac-1",
          position: 2,
          kind: "transfer",
          content: {
            type: "multiple_choice",
            question_vi: "Phân số nào chỉ phần bánh còn lại?",
            question_en: "Which fraction shows the remaining cake?",
            choices: [
              { id: "c1", label_vi: "Một phần tư", correct: true },
              { id: "c2", label_vi: "Ba phần tư", correct: false },
            ],
            hint1_vi: "Đếm tổng số phần bằng nhau.",
            hint2_vi: "Lấy tổng số phần trừ phần đã lấy.",
            hint3_vi: "Còn 1 phần trong 4 phần.",
          },
          answerKey: { choiceId: "c1", canary: "CANARY_MC_SECRET_KEY" },
          explanationVi: "Còn lại 1 phần trên tổng số 4 phần.",
          contentVersion: 1,
          sourceStepId: null,
        },
        {
          id: "step-prac-1",
          lessonId: "lesson-family-prac",
          position: 1,
          kind: "guided",
          content: {
            type: "reading_comprehension",
            passageTitle_vi: "Chia cam",
            passage_vi: "An chia quả cam thành hai phần bằng nhau. Mỗi phần là một phần hai quả cam.",
            question_vi: "Mỗi phần cam bằng bao nhiêu quả cam?",
            choices: [
              { id: "r1", label_vi: "Một phần hai", correct: true },
              { id: "r2", label_vi: "Một phần ba", correct: false },
            ],
            evidenceSentence_vi: "CANARY_EVIDENCE_SENTENCE_SECRET",
          },
          answerKey: "CANARY_READING_SECRET",
          explanationVi: "Mỗi phần là một phần hai.",
          contentVersion: 1,
          sourceStepId: null,
        },
      ],
      lessonMetadata: [
        {
          lessonId: "lesson-frac-1",
          objectiveId: "obj-gdpt-math-4-frac",
          provenance: "gdpt_2018_objective",
          sourceRef: "SGK Toán 4",
          expectedDurationMinutes: 15,
          reviewRecommendationVi: "Ôn lại sau 3 ngày",
          isBaseline: 0,
          updatedAt: exportedAt - 90_000,
        },
      ],
      reviewApprovals: [
        {
          id: "ra-1",
          learnerId: "learner-minh",
          lessonId: "lesson-frac-1",
          lessonVersion: 1,
          status: "approved",
          decidedBy: "parent-1",
          decidedAt: exportedAt - 70_000,
          note: null,
        },
      ],
      // Deliberately place later session first to verify deterministic chronological sorting.
      learningSessions: [
        {
          id: "sess-prac-2",
          learnerId: "learner-minh",
          lessonId: "lesson-family-prac",
          lessonVersion: 1,
          schoolYearId: "sy-2026-2027",
          startedAt: exportedAt - 20_000,
          endedAt: null,
          status: "in_progress",
          stepsSeen: 1,
          continuationDeadline: exportedAt + 60_000,
          purpose: "practice",
        },
        {
          id: "sess-official-1",
          learnerId: "learner-minh",
          lessonId: "lesson-frac-1",
          lessonVersion: 1,
          schoolYearId: "sy-2026-2027",
          startedAt: exportedAt - 60_000,
          endedAt: exportedAt - 40_000,
          status: "completed",
          stepsSeen: 2,
          continuationDeadline: null,
          purpose: "official",
        },
      ],
      // Deliberately unsorted attempts to test chronological ordering & tie-breaking.
      learningAttempts: [
        {
          id: "att-3-prac",
          sessionId: "sess-prac-2",
          learnerId: "learner-minh",
          lessonId: "lesson-family-prac",
          stepId: "step-prac-1",
          stepVersion: 1,
          skillId: "skill-frac-equiv",
          submitted: { choiceId: "r1" },
          outcome: "correct",
          helpLevel: 1,
          evidenceKind: "assisted",
          attemptNo: 1,
          purpose: "practice",
          createdAt: exportedAt - 15_000,
        },
        {
          id: "att-2-transfer",
          sessionId: "sess-official-1",
          learnerId: "learner-minh",
          lessonId: "lesson-frac-1",
          stepId: "step-frac-transfer",
          stepVersion: 1,
          skillId: "skill-frac-concept",
          submitted: { choiceId: "c1" },
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 1,
          purpose: "official",
          createdAt: exportedAt - 40_000, // Exact tie with sess-official-1 endedAt!
        },
        {
          id: "att-1-indep",
          sessionId: "sess-official-1",
          learnerId: "learner-minh",
          lessonId: "lesson-frac-1",
          stepId: "step-frac-1",
          stepVersion: 1,
          skillId: "skill-frac-concept",
          submitted: { numerator: 3, denominator: 4 },
          outcome: "correct",
          helpLevel: 0,
          evidenceKind: "observed",
          attemptNo: 1,
          purpose: "official",
          createdAt: exportedAt - 50_000,
        },
      ],
      skillEvidence: [
        {
          id: "ev-frac-concept",
          learnerId: "learner-minh",
          skillId: "skill-frac-concept",
          state: "TRANSFERRED",
          independentCount: 2,
          assistedCount: 0,
          correctCount: 2,
          lastIndependentAt: exportedAt - 40_000,
          lastObservedAt: exportedAt - 40_000,
          source: overrides?.correctionNote ? "parent_correction" : "derived",
          correctionNote: overrides?.correctionNote ?? null,
          updatedAt: exportedAt - 40_000,
        },
        {
          id: "ev-frac-equiv",
          learnerId: "learner-minh",
          skillId: "skill-frac-equiv",
          state: "SUPPORTED",
          independentCount: 0,
          assistedCount: 1,
          correctCount: 1,
          lastIndependentAt: null,
          lastObservedAt: exportedAt - 15_000,
          source: "derived",
          correctionNote: null,
          updatedAt: exportedAt - 15_000,
        },
      ],
      skillEstimates: [
        {
          id: "est-frac-concept",
          learnerId: "learner-minh",
          skillId: "skill-frac-concept",
          stability: 14.5,
          difficulty: 3.2,
          retrievabilityAt: 0.94,
          reps: 2,
          lapses: 0,
          fsrsState: 2,
          scheduledDays: 14,
          lastReviewAt: exportedAt - 40_000,
          modelVersion: "fsrs-6.0",
          computedAt: exportedAt - 40_000,
          attemptWatermark: "att-2-transfer",
          attemptCount: 2,
          createdAt: exportedAt - 50_000,
          updatedAt: exportedAt - 40_000,
        },
      ],
      reviewSchedule: [],
      sessionReflections: [
        {
          id: "refl-1",
          sessionId: "sess-official-1",
          learnerId: "learner-minh",
          feeling: "confident",
          noteVi: overrides?.reflectionNote ?? "Con tự chia được các phần phân số rõ ràng.",
          createdAt: exportedAt - 39_000,
        },
      ],
      learningGoals: [
        {
          id: "goal-1",
          learnerId: "learner-minh",
          subjectId: "math",
          titleVi: overrides?.goalTitle ?? "Nắm vững phân số lớp 4",
          note: overrides?.goalNote ?? "Tự giải thích bằng lời khi làm bài.",
          targetDate: "2027-01-15",
          status: "active",
          createdAt: exportedAt - 85_000,
          updatedAt: exportedAt - 85_000,
        },
      ],
      auditEvents: [],
      schemaVersions: [{ version: 16, description: "append-only attempts" }],
    },
  };
}

describe("10-Year Open Portability Bundle builders (CLR 2.0 + CASE 1.1 + xAPI 2.0 + Manifest)", () => {
  it("validates sample envelope and builds deterministic CLR 2.0, CASE 1.1, xAPI 2.0, and SHA-256 manifest", async () => {
    const envelope = buildSampleExportEnvelope();
    const validation = validateExportEnvelope(envelope);
    expect(validation.ok).toBe(true);

    const bundleA = buildOpenPortabilityBundle(envelope);
    const bundleB = buildOpenPortabilityBundle(envelope);
    expect(bundleA).toEqual(bundleB);

    // 1. CLR 2.0 JSON-LD assertions
    const { clr20 } = bundleA;
    expect(clr20["@context"]).toEqual(CLR_20_CONTEXT);
    expect(clr20.type).toEqual(["VerifiableCredential", "ClrCredential"]);
    expect(clr20.issuer.id).toBe(HOUSEHOLD_ISSUER_URN);
    expect(clr20.validFrom).toBe(new Date(envelope.exportedAt).toISOString());
    expect(clr20.credentialSubject.id).toBe("urn:uuid:learner-minh");
    expect(clr20.credentialSubject.name).toBe("Minh");

    // Pseudonymous privacy guarantee: zero birthYear/DOB/legalName/school/address in CLR
    const clrSerialized = JSON.stringify(clr20);
    expect(clrSerialized).not.toContain("2017");
    expect(clrSerialized).not.toContain("birthYear");
    expect(clrSerialized).not.toContain("birthDate");

    expect(clr20.credentialSubject.achievements).toHaveLength(2);
    expect(clr20.credentialSubject.results).toHaveLength(2);

    const conceptAch = clr20.credentialSubject.achievements.find(
      (a) => a.humanCode === "MATH.G4.FRAC.1",
    );
    expect(conceptAch).toBeDefined();
    expect(conceptAch?.alignments.map((al) => al.targetUrl)).toContain(
      "urn:tai-learning-os:case:skill:skill-frac-concept",
    );
    expect(conceptAch?.alignments.map((al) => al.targetUrl)).toContain(
      "urn:tai-learning-os:case:objective:obj-gdpt-math-4-frac",
    );

    const conceptResult = clr20.credentialSubject.results.find(
      (r) => r.status === "TRANSFERRED",
    );
    expect(conceptResult).toBeDefined();
    expect(conceptResult?.evidenceSummary.independentCount).toBe(2);
    expect(conceptResult?.memoryEstimate).toMatchObject({
      stabilityDays: 14.5,
      retrievability: 0.94,
      modelVersion: "fsrs-6.0",
    });

    // 2. CASE 1.1 CFPackage assertions
    const { case11 } = bundleA;
    expect(case11.CFDocument.version).toBe("1.1");
    expect(case11.CFDocument.creator).toBe(HOUSEHOLD_ISSUER_URN);
    expect(case11.CFItems).toHaveLength(3); // 1 objective + 2 skills
    for (const item of case11.CFItems) {
      expect(item.identifier.length).toBeGreaterThan(0);
      expect(item.URI.startsWith("urn:tai-learning-os:case:")).toBe(true);
      expect(item.humanCodingScheme.length).toBeGreaterThan(0);
      expect(item.fullStatement.length).toBeGreaterThan(0);
      expect(item.educationLevel.length).toBeGreaterThan(0);
    }

    const precedesEdge = case11.CFAssociations.find((a) => a.associationType === "precedes");
    expect(precedesEdge).toBeDefined();
    expect(precedesEdge?.originNodeURI.identifier).toBe("skill-frac-concept");
    expect(precedesEdge?.destinationNodeURI.identifier).toBe("skill-frac-equiv");

    const childEdge = case11.CFAssociations.find((a) => a.associationType === "isChildOf");
    expect(childEdge).toBeDefined();
    expect(childEdge?.originNodeURI.identifier).toBe("skill-frac-concept");
    expect(childEdge?.destinationNodeURI.identifier).toBe("obj-gdpt-math-4-frac");

    // 3. IEEE xAPI 2.0 statements & JSONL ordering assertions
    // 3 attempts + 1 completed session (in_progress session is NOT emitted as completed) = 4 statements
    expect(bundleA.xapi20Statements).toHaveLength(4);
    const jsonlLines = bundleA.xapi20Jsonl.trim().split("\n");
    expect(jsonlLines).toHaveLength(4);

    for (let i = 0; i < bundleA.xapi20Statements.length; i += 1) {
      const stmt = bundleA.xapi20Statements[i]!;
      expect(stmt.version).toBe("2.0.0");
      expect(stmt.id).toMatch(UUID_REGEX);
      expect(stmt.actor).toEqual({
        objectType: "Agent",
        account: {
          homePage: HOUSEHOLD_ISSUER_URN,
          name: "learner-minh",
        },
      });
      expect(JSON.parse(jsonlLines[i]!) as Xapi20Statement).toEqual(stmt);
      if (i > 0) {
        const prev = bundleA.xapi20Statements[i - 1]!;
        expect(Date.parse(stmt.timestamp)).toBeGreaterThanOrEqual(Date.parse(prev.timestamp));
      }
    }

    // Verify chronological order + tie-breaker: att-1 (-50s), att-2 (-40s, answered), sess-official-1 (-40s, completed), att-3 (-15s, practice)
    expect(bundleA.xapi20Statements.map((s) => s.verb.id)).toEqual([
      ADL_VERB_ANSWERED,
      ADL_VERB_ANSWERED,
      ADL_VERB_COMPLETED,
      ADL_VERB_ANSWERED,
    ]);
    expect(
      bundleA.xapi20Statements[0]?.context.extensions["urn:tai-learning-os:xapi:ext:purpose"],
    ).toBe("official");
    expect(
      bundleA.xapi20Statements[0]?.context.extensions[
        "urn:tai-learning-os:xapi:ext:case-skill-iris"
      ],
    ).toEqual(["urn:tai-learning-os:case:skill:skill-frac-concept"]);
    expect(
      bundleA.xapi20Statements[0]?.context.extensions[
        "urn:tai-learning-os:xapi:ext:case-objective-iris"
      ],
    ).toEqual(["urn:tai-learning-os:case:objective:obj-gdpt-math-4-frac"]);
    expect(
      bundleA.xapi20Statements[3]?.context.extensions["urn:tai-learning-os:xapi:ext:purpose"],
    ).toBe("practice");
    expect(
      bundleA.xapi20Statements[3]?.context.extensions["urn:tai-learning-os:xapi:ext:help-level"],
    ).toBe(1);
    expect(
      bundleA.xapi20Statements[3]?.context.extensions["urn:tai-learning-os:xapi:ext:evidence-kind"],
    ).toBe("assisted");

    // 4. Manifest & WebCrypto SHA-256 verification
    expect(bundleA.manifest.format).toBe(PORTABILITY_BUNDLE_FORMAT);
    expect(bundleA.manifest.versions).toEqual({ clr: "2.0", case: "1.1", xapi: "2.0.0" });
    expect(bundleA.manifest.counts).toEqual({
      learners: 1,
      skills: 2,
      objectives: 1,
      achievements: 2,
      sessions: 2,
      attempts: 3,
      xapiStatements: 4,
    });

    const subtleChecksums = await computePortabilityChecksums(bundleA);
    expect(subtleChecksums).toEqual(bundleA.manifest.checksums);

    const serializedFiles = serializePortabilityBundleFiles(bundleA);
    expect(sha256Text(serializedFiles.clr20Json)).toBe(bundleA.manifest.checksums.clr20Sha256);
    expect(sha256Text(serializedFiles.case11Json)).toBe(bundleA.manifest.checksums.case11Sha256);
    expect(sha256Text(serializedFiles.xapi20Jsonl)).toBe(
      bundleA.manifest.checksums.xapi20JsonlSha256,
    );
  });

  it("Gate G4: never leaks lessonSteps.answerKey or any ExerciseSpec correct-answer field into any exported artifact", () => {
    const envelope = buildSampleExportEnvelope();
    const bundle = buildOpenPortabilityViewerAndFiles(envelope);

    expect(leaksAnswer(bundle.rawBundle)).toBe(false);

    const forbiddenSecrets = [
      "CANARY_ANSWER_KEY_DO_NOT_EXPORT_999",
      "secret-choice-id-77",
      "CANARY_MC_SECRET_KEY",
      "CANARY_EVIDENCE_SENTENCE_SECRET",
      "CANARY_READING_SECRET",
      "correctNumerator",
      "correctDenominator",
      "correctChoiceId",
      "evidenceSentence_vi",
      "sentenceAcceptedWords",
    ];

    for (const [name, content] of Object.entries(bundle.files)) {
      for (const secret of forbiddenSecrets) {
        expect(content, `artifact ${name} leaked ${secret}`).not.toContain(secret);
      }
      // Also check URL-decoded data URIs inside viewer.html cannot hide leaked secrets
      if (name === "viewer.html") {
        const decodedViewer = decodeURIComponent(content.replace(/%(?![0-9a-fA-F]{2})/g, "%25"));
        for (const secret of forbiddenSecrets) {
          expect(decodedViewer, `decoded viewer.html leaked ${secret}`).not.toContain(secret);
        }
      }
    }
  });
});

function buildOpenPortabilityViewerAndFiles(envelope: ExportEnvelope) {
  const rawBundle = buildOpenPortabilityBundle(envelope);
  const serialized = serializePortabilityBundleFiles(rawBundle);
  const viewerHtml = renderStandalonePortabilityViewerHtml(rawBundle, envelope);
  return {
    rawBundle,
    files: {
      "clr-2.0.json": serialized.clr20Json,
      "case-1.1.json": serialized.case11Json,
      "xapi-2.0.jsonl": serialized.xapi20Jsonl,
      "manifest.json": serialized.manifestJson,
      "viewer.html": viewerHtml,
    },
  };
}

describe("Standalone offline viewer.html (CSP, XSS breakout neutralization, WCAG 2.2 AA & Gate G10)", () => {
  it("enforces strict offline CSP, zero external URLs, >= 48x48px touch targets, and neutralizes </script> XSS breakouts across all user strings", () => {
    const xssPayload = "Minh </script><script>window.__xss=1</script><!--\u2028\u2029-->";
    const envelope = buildSampleExportEnvelope({
      nickname: xssPayload,
      goalTitle: `Mục tiêu </script><script>window.__xss=2</script>`,
      goalNote: `Ghi chú </script><script>window.__xss=3</script>`,
      reflectionNote: `Cảm nhận </script><script>window.__xss=4</script>`,
      correctionNote: `Phụ huynh xác nhận </script><script>window.__xss=5</script>`,
    });

    const bundle = buildOpenPortabilityBundle(envelope);
    const html = renderStandalonePortabilityViewerHtml(bundle, envelope);

    // 1. Exact offline CSP meta tag
    expect(html).toContain(
      `<meta http-equiv="Content-Security-Policy" content="${VIEWER_CSP_CONTENT}">`,
    );

    // 2. Zero external links, scripts, @import, or http(s):// asset fetches
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<script\b[^>]*\bsrc\s*=/i);
    expect(html).not.toMatch(/@import\b/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/\bblob:/i);

    // 3. XSS neutralization: strictly 2 <script> tags exist in the entire document, zero window.__xss executable tags
    const scriptOpenMatches = html.match(/<script\b/gi) ?? [];
    expect(scriptOpenMatches).toHaveLength(2);
    expect(html).not.toContain("<script>window.__xss");
    expect(html).not.toContain("</script><script>");

    // Embedded JSON script block must parse back to exact original strings cleanly
    const jsonBlockMatch = html.match(
      /<script id="tlo-portability-data" type="application\/json">([\s\S]*?)<\/script>/,
    );
    expect(jsonBlockMatch).not.toBeNull();
    const parsedEmbedded = JSON.parse(jsonBlockMatch![1]!) as {
      learnerNickname: string;
      skills: { correctionNote: string | null }[];
    };
    expect(parsedEmbedded.learnerNickname).toBe(xssPayload);
    expect(parsedEmbedded.skills.some((s) => s.correctionNote?.includes("window.__xss=5"))).toBe(
      true,
    );

    // Inline JS never uses innerHTML / outerHTML / document.write / eval
    const inlineJsMatch = html.match(/<script>\s*\(function[\s\S]*?<\/script>/);
    expect(inlineJsMatch).not.toBeNull();
    expect(inlineJsMatch![0]).not.toMatch(
      /\b(?:innerHTML|outerHTML|insertAdjacentHTML|eval)\b|document\.write/,
    );

    // Direct helper check for escapeJsonForHtmlScript
    const rawEscaped = escapeJsonForHtmlScript(JSON.stringify({ x: xssPayload }));
    expect(rawEscaped).not.toContain("</script>");
    expect(rawEscaped).not.toContain("<!--");
    expect(rawEscaped).not.toContain("\u2028");
    expect(rawEscaped).not.toContain("\u2029");
    expect((JSON.parse(rawEscaped) as { x: string }).x).toBe(xssPayload);

    // 4. WCAG 2.2 AA & Gate G10 touch target guarantees
    expect(html).toContain('<html lang="vi">');
    expect(html).toContain('<main id="main-content">');
    expect(html).toContain("<h1>");
    expect(html).toContain("<h2 ");
    expect(html).toContain("<h3>");
    expect(html).toContain("--paper-bg: #fcfbf7;");
    expect(html).toContain("--ink-primary: #14213d;");
    expect(html).toContain(":focus-visible");
    expect(html).toMatch(/button,\s*a\s*\{[\s\S]*?min-height:\s*48px;[\s\S]*?min-width:\s*48px;/);

    // 5. Offline data: URI download links decode back to exact open-standard files
    for (const fileName of ["clr-2.0.json", "case-1.1.json", "xapi-2.0.jsonl", "manifest.json"]) {
      const linkRegex = new RegExp(
        `<a[^>]+download="${fileName.replace(".", "\\.")}"[^>]+href="data:application\\/json;charset=utf-8,([^"]+)"`,
      );
      const match = html.match(linkRegex);
      expect(match, `missing offline data: download link for ${fileName}`).not.toBeNull();
      const decoded = decodeURIComponent(match![1]!);
      expect(decoded.length).toBeGreaterThan(10);
      if (fileName.endsWith(".json")) {
        expect(() => JSON.parse(decoded) as unknown).not.toThrow();
      } else {
        const lines = decoded.trim().split("\n");
        expect(lines).toHaveLength(4);
      }
    }
  });
});

describe("Read-only portability CLI (scripts/export-portability.mjs)", () => {
  it("parses valid CLI arguments and fails closed on missing, duplicate, or unknown flags", async () => {
    const { parsePortabilityCliArgs } = (await import("../../scripts/export-portability.mjs")) as {
      parsePortabilityCliArgs: (argv: string[]) => {
        outputDir: string;
        targetRoot: string;
        learnerId: string | null;
      };
    };

    expect(parsePortabilityCliArgs(["./out-bundle"])).toEqual({
      outputDir: resolve("./out-bundle"),
      targetRoot: process.cwd(),
      learnerId: null,
    });

    expect(
      parsePortabilityCliArgs([
        "--target-root",
        "/tmp/custom-d1-root",
        "--learner-id",
        "learner-minh",
        "--output-dir",
        "/tmp/bundle-dir",
      ]),
    ).toEqual({
      outputDir: resolve("/tmp/bundle-dir"),
      targetRoot: resolve("/tmp/custom-d1-root"),
      learnerId: "learner-minh",
    });

    expect(() => parsePortabilityCliArgs([])).toThrow(/Missing required <output-dir>/);
    expect(() => parsePortabilityCliArgs(["./dir-a", "./dir-b"])).toThrow(
      /Unexpected positional argument for export:portability/,
    );
    expect(() => parsePortabilityCliArgs(["./dir-a", "--output-dir", "./dir-b"])).toThrow(
      /Unexpected duplicate output directory argument/,
    );
    expect(() => parsePortabilityCliArgs(["./dir-a", "--unknown-flag"])).toThrow(
      /Unknown flag for export:portability: --unknown-flag/,
    );
    expect(() => parsePortabilityCliArgs(["--output-dir"])).toThrow(
      /Missing or invalid value for --output-dir/,
    );
    expect(() => parsePortabilityCliArgs(["--target-root", "--learner-id"])).toThrow(
      /Missing or invalid value for --target-root/,
    );
    expect(() => parsePortabilityCliArgs(["./dir-a", "--learner-id"])).toThrow(
      /Missing or invalid value for --learner-id/,
    );
  });

  it("writes all 5 portability artifacts end-to-end from a temporary SQLite DB while leaving SQLite SHA-256 byte-identical", () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), "tlo-portability-cli-"));
    const d1StateDir = join(
      tmpRoot,
      ".wrangler",
      "state",
      "v3",
      "d1",
      "miniflare-D1DatabaseObject",
    );
    mkdirSync(d1StateDir, { recursive: true });
    const sqlitePath = join(
      d1StateDir,
      "55cf0b3020dae37b568062fe28961bd8d3fcd41f9b33fe8ddfdc3540875f734a.sqlite",
    );
    const outDir = join(tmpRoot, "exported-portability");
    const canaryPasswordHash =
      "pbkdf2-sha256:600000$portabilitysalt0011$portabilitydigestdeadbeef9988";
    const canaryAnswerKey = '{"secretAnswer":"CANARY_SQLITE_ANSWER_KEY_888"}';

    try {
      const raw = new DatabaseSync(sqlitePath);
      try {
        raw.exec("PRAGMA foreign_keys = ON;");
        raw.exec("PRAGMA journal_mode = WAL;");
        for (const file of MIGRATION_FILES) {
          raw.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
        }

        raw
          .prepare(
            "INSERT INTO parents (id, display_name, password_hash, created_at, updated_at) VALUES ('parent-1', 'Phụ huynh', ?, 1000, 1000)",
          )
          .run(canaryPasswordHash);
        raw
          .prepare(
            "INSERT INTO learners (id, parent_id, nickname, birth_year, grade, timezone, created_at, updated_at) VALUES ('learner-minh', 'parent-1', 'Minh', 2017, 4, 'Asia/Ho_Chi_Minh', 1000, 1000)",
          )
          .run();
        raw
          .prepare(
            "INSERT INTO school_years (id, learner_id, label, starts_on, ends_on, grade, created_at) VALUES ('sy-2026', 'learner-minh', '2026-2027', '2026-09-01', '2027-06-30', 4, 1000)",
          )
          .run();

        const firstSkill = raw.prepare("SELECT id, subject_id FROM skills LIMIT 1").get() as
          | { id: string; subject_id: string }
          | undefined;
        const skillId = firstSkill ? String(firstSkill.id) : null;
        const subjectId = firstSkill ? String(firstSkill.subject_id) : "math";

        raw
          .prepare(
            "INSERT INTO lessons (id, subject_id, skill_id, title_vi, title_en, objective_vi, objective_en, grade_from, grade_to, version, created_at, updated_at) VALUES ('lesson-port-1', ?, ?, 'Bài kiểm thử di sản', 'Portability Test Lesson', 'Mục tiêu 1', 'Objective 1', 4, 4, 1, 2000, 2000)",
          )
          .run(subjectId, skillId);
        raw
          .prepare(
            "INSERT INTO lesson_versions (lesson_id, version, title_vi, title_en, objective_vi, objective_en, created_at) VALUES ('lesson-port-1', 1, 'Bài kiểm thử di sản', 'Portability Test Lesson', 'Mục tiêu 1', 'Objective 1', 2000)",
          )
          .run();
        raw
          .prepare(
            `INSERT INTO lesson_steps (id, lesson_id, position, kind, content, answer_key, explanation_vi, content_version)
             VALUES ('step-port-1', 'lesson-port-1', 1, 'independent', ?, ?, 'Giải thích rõ ràng.', 1)`,
          )
          .run(
            JSON.stringify({
              type: "multiple_choice",
              question_vi: "2 + 2 bằng mấy?",
              choices: [
                { id: "a", label_vi: "4", correct: true },
                { id: "b", label_vi: "5", correct: false },
              ],
              hint1_vi: "Gợi ý 1",
              hint2_vi: "Gợi ý 2",
              hint3_vi: "Gợi ý 3",
            }),
            canaryAnswerKey,
          );
        raw
          .prepare(
            "INSERT INTO review_approvals (id, learner_id, lesson_id, lesson_version, status, decided_by, decided_at) VALUES ('ra-port-1', 'learner-minh', 'lesson-port-1', 1, 'approved', 'parent-1', 2100)",
          )
          .run();
        raw
          .prepare(
            "INSERT INTO learning_sessions (id, learner_id, lesson_id, lesson_version, school_year_id, started_at, ended_at, status, steps_seen, purpose) VALUES ('sess-port-1', 'learner-minh', 'lesson-port-1', 1, 'sy-2026', 3000, 4000, 'completed', 1, 'official')",
          )
          .run();
        raw
          .prepare(
            `INSERT INTO learning_attempts (id, session_id, learner_id, lesson_id, step_id, step_version, skill_id, submitted, outcome, help_level, evidence_kind, attempt_no, purpose, created_at)
             VALUES ('att-port-1', 'sess-port-1', 'learner-minh', 'lesson-port-1', 'step-port-1', 1, ?, '{"choiceId":"a"}', 'correct', 0, 'observed', 1, 'official', 3500)`,
          )
          .run(skillId);
        if (skillId) {
          raw
            .prepare(
              `INSERT INTO skill_evidence (id, learner_id, skill_id, state, independent_count, assisted_count, correct_count, last_independent_at, last_observed_at, source, correction_note, updated_at)
               VALUES ('ev-port-1', 'learner-minh', ?, 'INDEPENDENT', 1, 0, 1, 3500, 3500, 'derived', NULL, 3500)`,
            )
            .run(skillId);
        }
        raw
          .prepare(
            "INSERT INTO audit_events (id, actor, action, subject, detail, created_at) VALUES ('au-port-1', 'parent:parent-1', 'learner.created', 'learner-minh', NULL, 1000)",
          )
          .run();
      } finally {
        raw.close();
      }

      const preSha256 = sha256File(sqlitePath);
      const preStat = statSync(sqlitePath);

      const cliRun = spawnSync(
        process.execPath,
        [PORTABILITY_CLI, outDir, "--target-root", tmpRoot, "--learner-id", "learner-minh"],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );

      expect(cliRun.status).toBe(0);
      expect(cliRun.stderr).toBe("");
      expect(cliRun.stdout).not.toContain(canaryPasswordHash);
      expect(cliRun.stdout).not.toContain("CANARY_SQLITE_ANSWER_KEY_888");

      const expectedFiles = [
        "clr-2.0.json",
        "case-1.1.json",
        "xapi-2.0.jsonl",
        "manifest.json",
        "viewer.html",
      ] as const;

      for (const fileName of expectedFiles) {
        const fullPath = join(outDir, fileName);
        expect(existsSync(fullPath), `missing ${fileName}`).toBe(true);
        const fileText = readFileSync(fullPath, "utf8");
        expect(fileText).not.toContain(canaryPasswordHash);
        expect(fileText).not.toContain("CANARY_SQLITE_ANSWER_KEY_888");
      }

      const manifest = JSON.parse(
        readFileSync(join(outDir, "manifest.json"), "utf8"),
      ) as PortabilityManifest;
      expect(manifest.counts.learners).toBe(1);
      expect(manifest.counts.sessions).toBe(1);
      expect(manifest.counts.attempts).toBe(1);
      expect(manifest.counts.xapiStatements).toBe(2);
      expect(sha256File(join(outDir, "clr-2.0.json"))).toBe(manifest.checksums.clr20Sha256);
      expect(sha256File(join(outDir, "case-1.1.json"))).toBe(manifest.checksums.case11Sha256);
      expect(sha256File(join(outDir, "xapi-2.0.jsonl"))).toBe(
        manifest.checksums.xapi20JsonlSha256,
      );

      // Fail-closed CLI check on bad flag also leaves SQLite untouched
      const badFlagRun = spawnSync(
        process.execPath,
        [PORTABILITY_CLI, outDir, "--bad-flag"],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      expect(badFlagRun.status).toBe(1);
      expect(badFlagRun.stderr).toContain("export:portability refused:");

      // Assert SQLite database file SHA-256, size, mtimeMs, and audit_events count are 100% unchanged
      const postSha256 = sha256File(sqlitePath);
      const postStat = statSync(sqlitePath);
      expect({
        sha256: postSha256,
        size: postStat.size,
        mtimeMs: postStat.mtimeMs,
      }).toEqual({
        sha256: preSha256,
        size: preStat.size,
        mtimeMs: preStat.mtimeMs,
      });

      const roVerify = new DatabaseSync(sqlitePath, { readOnly: true });
      try {
        const auditRow = roVerify.prepare("SELECT COUNT(*) AS n FROM audit_events").get() as {
          n: number;
        };
        expect(Number(auditRow.n)).toBe(1);
      } finally {
        roVerify.close();
      }
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});
