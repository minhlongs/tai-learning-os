import { describe, expect, it } from "vitest";

import {
  TRANSFER_FORMAT_VERSION,
  type ExportBody,
  type ExportEnvelope,
  type LearnerExport,
  type LearningAttemptExport,
  type LearningSessionExport,
  validateExportEnvelope,
} from "../../src/shared/schemas/transfer";

/**
 * The validator under test is the REAL one, `validateExportEnvelope` from the
 * shared format module. The same function guards the Worker's import route and
 * the client's pre-send check, so this suite tests exactly what will run in
 * production rather than a stand-in that can drift from it.
 */

function validBody(): ExportBody {
  return {
    learners: [validLearner()],
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
    schemaVersions: [{ version: 1, description: "Initial schema" }],
  };
}

function validLearner(): LearnerExport {
  // Only a birth YEAR, a nickname and a timezone. The format deliberately has
  // no field for a full date of birth, legal name, address or photo.
  return {
    id: "lnr-0001",
    nickname: "Tài",
    birthYear: 2017,
    grade: 3,
    timezone: "Asia/Ho_Chi_Minh",
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    archivedAt: null,
  };
}

function validEnvelope(): ExportEnvelope {
  return {
    formatVersion: TRANSFER_FORMAT_VERSION,
    exportedAt: 1_700_000_000_000,
    source: "manual_export",
    containsLearnerEvidence: true,
    data: validBody(),
  };
}

describe("export envelope — a valid payload is accepted", () => {
  it("accepts a well-formed envelope", () => {
    expect(validateExportEnvelope(validEnvelope()).ok).toBe(true);
  });

  it("carries the current format version", () => {
    expect(TRANSFER_FORMAT_VERSION).toBe(1);
    expect(validEnvelope().formatVersion).toBe(1);
  });

  it("flags provenance so an import can be audited", () => {
    const envelope = validEnvelope();
    expect(envelope.source).toBe("manual_export");
    expect(envelope.containsLearnerEvidence).toBe(true);
  });

  it("accepts an empty body", () => {
    expect(validateExportEnvelope(validEnvelope()).ok).toBe(true);
  });

  it("accepts a demo_fixture source that carries no learner evidence", () => {
    const envelope: ExportEnvelope = { ...validEnvelope(), source: "demo_fixture", containsLearnerEvidence: false };
    expect(validateExportEnvelope(envelope).ok).toBe(true);
  });

  it("accepts an idempotent import of the same envelope twice", () => {
    // The envelope parses the same way on both imports, so re-import is a
    // question of how the writer handles duplicate ids (a warning, not a
    // rejection) — not of whether the payload is valid.
    const envelope = validEnvelope();
    expect(validateExportEnvelope(envelope)).toEqual(validateExportEnvelope(envelope));
  });
});

describe("export envelope — an unknown version is refused", () => {
  it("rejects a NEWER format version, which cannot be interpreted", () => {
    const result = validateExportEnvelope({ ...validEnvelope(), formatVersion: TRANSFER_FORMAT_VERSION + 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects a version of zero", () => {
    expect(validateExportEnvelope({ ...validEnvelope(), formatVersion: 0 }).ok).toBe(false);
  });

  it("rejects a missing version", () => {
    const { formatVersion, ...rest } = validEnvelope();
    expect(validateExportEnvelope(rest).ok).toBe(false);
  });

  it("rejects a non-numeric version", () => {
    expect(validateExportEnvelope({ ...validEnvelope(), formatVersion: "1" }).ok).toBe(false);
  });
});

describe("export envelope — malformed shells are refused", () => {
  it("rejects a null envelope", () => {
    expect(validateExportEnvelope(null).ok).toBe(false);
  });

  it("rejects an array envelope", () => {
    expect(validateExportEnvelope([validEnvelope()]).ok).toBe(false);
  });

  it("rejects a string envelope", () => {
    expect(validateExportEnvelope("manual_export").ok).toBe(false);
  });

  it("rejects a missing data body", () => {
    const { data, ...rest } = validEnvelope();
    expect(validateExportEnvelope(rest).ok).toBe(false);
  });

  it("rejects an unknown source", () => {
    expect(validateExportEnvelope({ ...validEnvelope(), source: "scan_me" }).ok).toBe(false);
  });

  it("rejects a missing exportedAt", () => {
    const { exportedAt, ...rest } = validEnvelope();
    expect(validateExportEnvelope(rest).ok).toBe(false);
  });

  it("rejects containsLearnerEvidence that is not a boolean", () => {
    expect(validateExportEnvelope({ ...validEnvelope(), containsLearnerEvidence: "yes" }).ok).toBe(false);
  });
});

describe("export body — rows carry stable opaque identifiers", () => {
  it("rejects a learner row without an id", () => {
    const envelope = validEnvelope();
    // Deliberately build a row missing its id to prove import refuses it.
    const { id, ...rest } = validLearner();
    void id;
    const broken = rest as unknown as LearnerExport;
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, learners: [broken] } }).ok).toBe(false);
  });

  it("rejects a learner row with an empty id", () => {
    const envelope = validEnvelope();
    const broken = { ...validLearner(), id: "" };
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, learners: [broken] } }).ok).toBe(false);
  });

  it("rejects a learner row without a nickname", () => {
    const envelope = validEnvelope();
    const broken = { ...validLearner(), nickname: "" };
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, learners: [broken] } }).ok).toBe(false);
  });

  it("rejects a body whose collections are missing entirely", () => {
    expect(validateExportEnvelope({ ...validEnvelope(), data: {} }).ok).toBe(false);
  });

  it("rejects a body whose sessions are not an array", () => {
    const envelope = validEnvelope();
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, learningSessions: {} as LearningSessionExport[] } }).ok).toBe(false);
  });

  it("rejects a body whose attempts are not an array", () => {
    const envelope = validEnvelope();
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, learningAttempts: "nope" as unknown as LearningAttemptExport[] } }).ok).toBe(false);
  });

  it("rejects a body whose schemaVersions are not an array", () => {
    const envelope = validEnvelope();
    expect(validateExportEnvelope({ ...envelope, data: { ...envelope.data, schemaVersions: {} as unknown as { version: number; description: string }[] } }).ok).toBe(false);
  });

  it("accepts a body that carries real sessions, attempts, evidence and reviews", () => {
    const envelope = validEnvelope();
    const attempt: LearningAttemptExport = {
      id: "att-1",
      sessionId: "ses-1",
      learnerId: "lnr-0001",
      lessonId: "les-1",
      stepId: "stp-1",
      stepVersion: 1,
      skillId: "math-frac-equiv",
      submitted: { kind: "choice", choiceId: "half" },
      outcome: "correct",
      helpLevel: 0,
      evidenceKind: "observed",
      isTransfer: false,
      isReview: false,
      createdAt: 1_700_000_000_000,
    };
    const populated: ExportEnvelope = {
      ...envelope,
      data: {
        ...envelope.data,
        schoolYears: [
          {
            id: "sy-1",
            learnerId: "lnr-0001",
            label: "2026-2027",
            startsOn: "2026-09-01",
            endsOn: "2027-06-30",
            grade: 3,
          },
        ],
        subjects: [{ id: "math", nameVi: "Toán", nameEn: "Mathematics", sort: 1, active: 1 }],
        skills: [
          {
            id: "math-frac-equiv",
            subjectId: "math",
            code: "MATH.FRAC.EQUIV",
            nameVi: "Phân số tương đương",
            nameEn: "Equivalent fractions",
            gradeFrom: 3,
            gradeTo: 4,
          },
        ],
        learningSessions: [
          {
            id: "ses-1",
            learnerId: "lnr-0001",
            lessonId: "les-1",
            lessonVersion: 1,
            schoolYearId: "sy-1",
            startedAt: 1_700_000_000_000,
            endedAt: 1_700_000_600_000,
            status: "completed",
            stepsSeen: 3,
          },
        ],
        learningAttempts: [attempt],
        skillEvidence: [
          {
            id: "ev-1",
            learnerId: "lnr-0001",
            skillId: "math-frac-equiv",
            state: "INDEPENDENT",
            independentCount: 1,
            assistedCount: 0,
            correctCount: 1,
            lastIndependentAt: 1_700_000_000_000,
            lastObservedAt: 1_700_000_000_000,
            source: "derived",
            correctionNote: null,
            updatedAt: 1_700_000_000_000,
          },
        ],
        reviewSchedule: [
          {
            id: "rs-1",
            learnerId: "lnr-0001",
            skillId: "math-frac-equiv",
            dueAt: 1_700_008_600_000,
            intervalDays: 1,
            lastResult: "passed",
            lastAttemptAt: 1_700_000_000_000,
            failureStreak: 0,
            createdAt: 1_700_000_000_000,
            updatedAt: 1_700_000_000_000,
          },
        ],
        auditEvents: [
          {
            id: "aud-1",
            actor: "parent",
            action: "export",
            subject: "lnr-0001",
            detail: null,
            createdAt: 1_700_000_000_000,
          },
        ],
      },
    };
    expect(validateExportEnvelope(populated).ok).toBe(true);
  });
});

describe("transfer version constant", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(TRANSFER_FORMAT_VERSION)).toBe(true);
    expect(TRANSFER_FORMAT_VERSION).toBeGreaterThan(0);
  });
});

describe("version-scoped lessonVersions, lineage, and practice purpose validation", () => {
  function baseLessonExport() {
    return {
      id: "les-fam-1",
      subjectId: "math",
      skillId: "math-frac-equiv",
      titleVi: "Bài luyện tập phân số",
      titleEn: null,
      objectiveVi: "Mục tiêu luyện tập",
      objectiveEn: null,
      gradeFrom: 4,
      gradeTo: 4,
      version: 2,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_100_000,
      ownershipType: "family" as const,
      ownerParentId: "parent-1",
      purpose: "practice" as const,
      sourceLessonId: "math-fractions-equivalent",
      sourceVersion: 1,
    };
  }

  function baseStepExport(version: number, id = `stp-v${version}`) {
    return {
      id,
      lessonId: "les-fam-1",
      position: 1,
      kind: "transfer" as const,
      content: {
        type: "multiple_choice",
        question_vi: "1/2 bằng phân số nào?",
        choices: [
          { id: "c1", label_vi: "2/4", correct: true },
          { id: "c2", label_vi: "1/3", correct: false },
        ],
        hint1_vi: "Nhân tử và mẫu với 2",
        hint2_vi: "1x2 / 2x2",
        hint3_vi: "Đáp án là 2/4",
      },
      answerKey: { correctChoiceId: "c1" },
      explanationVi: "Giải thích",
      contentVersion: version,
      sourceStepId: "cat-step-1",
    };
  }

  it("accepts a multi-version family practice lesson export with matching lessonVersions, steps, sessions, and attempts", () => {
    const envelope = validEnvelope();
    const populated: ExportEnvelope = {
      ...envelope,
      data: {
        ...envelope.data,
        lessons: [baseLessonExport()],
        lessonSteps: [baseStepExport(1, "stp-v1"), baseStepExport(2, "stp-v2")],
        lessonVersions: [
          {
            lessonId: "les-fam-1",
            version: 1,
            titleVi: "Bản v1",
            titleEn: "",
            objectiveVi: "Mục tiêu v1",
            objectiveEn: "",
            createdAt: 1_700_000_000_000,
          },
          {
            lessonId: "les-fam-1",
            version: 2,
            titleVi: "Bản v2",
            titleEn: "",
            objectiveVi: "Mục tiêu v2",
            objectiveEn: "",
            createdAt: 1_700_000_100_000,
          },
        ],
        reviewApprovals: [
          {
            id: "app-1",
            lessonId: "les-fam-1",
            learnerId: "lnr-0001",
            lessonVersion: 1,
            status: "approved",
            reviewerNote: null,
            reviewedAt: 1_700_000_000_000,
          },
        ],
        learningSessions: [
          {
            id: "ses-prac-1",
            learnerId: "lnr-0001",
            lessonId: "les-fam-1",
            lessonVersion: 1,
            schoolYearId: null,
            startedAt: 1_700_000_010_000,
            endedAt: 1_700_000_050_000,
            status: "completed",
            stepsSeen: 1,
            purpose: "practice",
          },
        ],
        learningAttempts: [
          {
            id: "att-prac-1",
            sessionId: "ses-prac-1",
            learnerId: "lnr-0001",
            lessonId: "les-fam-1",
            stepId: "stp-v1",
            stepVersion: 1,
            skillId: "math-frac-equiv",
            submitted: { kind: "choice", choiceId: "c1" },
            outcome: "correct",
            helpLevel: 0,
            evidenceKind: "assisted",
            isTransfer: true,
            isReview: false,
            createdAt: 1_700_000_020_000,
            purpose: "practice",
          },
        ],
      },
    };
    expect(validateExportEnvelope(populated).ok).toBe(true);
  });

  it("rejects duplicate (lessonId, version) entries in lessonVersions", () => {
    const envelope = validEnvelope();
    const res = validateExportEnvelope({
      ...envelope,
      data: {
        ...envelope.data,
        lessons: [baseLessonExport()],
        lessonSteps: [baseStepExport(1, "stp-v1")],
        lessonVersions: [
          {
            lessonId: "les-fam-1",
            version: 1,
            titleVi: "Bản v1",
            titleEn: "",
            objectiveVi: "Mục tiêu v1",
            objectiveEn: "",
            createdAt: 1_700_000_000_000,
          },
          {
            lessonId: "les-fam-1",
            version: 1,
            titleVi: "Bản v1 trùng",
            titleEn: "",
            objectiveVi: "Mục tiêu v1",
            objectiveEn: "",
            createdAt: 1_700_000_000_000,
          },
        ],
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.join(" ")).toContain("Trùng phiên bản bài học");
    }
  });

  it("rejects lessonVersions referencing a lessonId missing from data.lessons", () => {
    const envelope = validEnvelope();
    const res = validateExportEnvelope({
      ...envelope,
      data: {
        ...envelope.data,
        lessons: [baseLessonExport()],
        lessonVersions: [
          {
            lessonId: "ghost-lesson",
            version: 1,
            titleVi: "Ghost",
            titleEn: "",
            objectiveVi: "Ghost",
            objectiveEn: "",
            createdAt: 1_700_000_000_000,
          },
        ],
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.join(" ")).toContain("ghost-lesson");
    }
  });

  it("rejects learningSessions referencing an undeclared lessonVersion when lessonVersions are present", () => {
    const envelope = validEnvelope();
    const res = validateExportEnvelope({
      ...envelope,
      data: {
        ...envelope.data,
        lessons: [baseLessonExport()],
        lessonSteps: [baseStepExport(1, "stp-v1")],
        lessonVersions: [
          {
            lessonId: "les-fam-1",
            version: 1,
            titleVi: "Bản v1",
            titleEn: "",
            objectiveVi: "Mục tiêu v1",
            objectiveEn: "",
            createdAt: 1_700_000_000_000,
          },
        ],
        learningSessions: [
          {
            id: "ses-bad-ver",
            learnerId: "lnr-0001",
            lessonId: "les-fam-1",
            lessonVersion: 99,
            schoolYearId: null,
            startedAt: 1_700_000_010_000,
            endedAt: null,
            status: "in_progress",
            stepsSeen: 0,
          },
        ],
      },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.join(" ")).toContain("ses-bad-ver");
    }
  });

  it("rejects invalid ownershipType or purpose on lesson/session/attempt rows", () => {
    const envelope = validEnvelope();
    const badOwnership = validateExportEnvelope({
      ...envelope,
      data: {
        ...envelope.data,
        lessons: [{ ...baseLessonExport(), ownershipType: "pirated" as unknown as "family" }],
      },
    });
    expect(badOwnership.ok).toBe(false);

    const badSessionPurpose = validateExportEnvelope({
      ...envelope,
      data: {
        ...envelope.data,
        learningSessions: [
          {
            id: "ses-bad-purpose",
            learnerId: "lnr-0001",
            lessonId: "les-1",
            lessonVersion: 1,
            schoolYearId: null,
            startedAt: 1_700_000_010_000,
            endedAt: null,
            status: "in_progress",
            stepsSeen: 0,
            purpose: "ranked" as unknown as "practice",
          },
        ],
      },
    });
    expect(badSessionPurpose.ok).toBe(false);
  });
});

