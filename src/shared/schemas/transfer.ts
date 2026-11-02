/**
 * Versioned export/import format.
 *
 * The export is the portable longitudinal record: it is what outlives the app
 * instance. Import is therefore strict — it validates before writing, rejects
 * anything it does not recognise, and never silently merges or upgrades data.
 *
 * Versioning: `formatVersion` is an integer. Import of a NEWER version than the
 * app knows is refused (we cannot interpret it). Import of an OLDER version is
 * accepted only through an explicit migration table, so old backups stay
 * restorable without the import path becoming a source of invented data.
 */

import type { ApprovalStatus, CompetencyState, SessionStatus } from "./attempt";
import type { ExerciseSpec } from "./exercise";

export const TRANSFER_FORMAT_VERSION = 1;

export type ExportEnvelope = {
  formatVersion: number;
  exportedAt: number;
  /** Where this payload came from, so an import can be audited. */
  source: "manual_export" | "demo_fixture" | "backup_restore";
  /** False when the payload contains fixture content rather than real records. */
  containsLearnerEvidence: boolean;
  data: ExportBody;
};

export type ExportBody = {
  learners: LearnerExport[];
  schoolYears: SchoolYearExport[];
  subjects: SubjectExport[];
  skills: SkillExport[];
  skillPrerequisites: PrerequisiteExport[];
  curriculumObjectives?: CurriculumObjectiveExport[];
  curriculumIntakes?: CurriculumIntakeExport[];
  lessons: LessonExport[];
  lessonVersions?: LessonVersionExport[];
  lessonSteps: LessonStepExport[];
  lessonMetadata?: LessonMetadataExport[];
  reviewApprovals: ReviewApprovalExport[];
  learningSessions: LearningSessionExport[];
  learningAttempts: LearningAttemptExport[];
  skillEvidence: SkillEvidenceExport[];
  reviewSchedule: ReviewScheduleExport[];
  baselineAssessments?: BaselineAssessmentExport[];
  learningPlanItems?: LearningPlanItemExport[];
  sessionReflections?: SessionReflectionExport[];
  learningGoals: LearningGoalExport[];
  auditEvents: AuditEventExport[];
  schemaVersions: { version: number; description: string }[];
};

type WithId = { id: string };

export type LearnerExport = WithId & {
  nickname: string;
  birthYear: number | null;
  grade: number | null;
  timezone: string;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
};

export type SchoolYearExport = WithId & {
  id: string;
  learnerId: string;
  label: string;
  startsOn: string;
  endsOn: string;
  grade: number | null;
};

export type SubjectExport = WithId & {
  nameVi: string;
  nameEn: string;
  sort: number;
  active: 0 | 1;
};

export type SkillExport = WithId & {
  subjectId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  gradeFrom: number;
  gradeTo: number;
};

export type PrerequisiteExport = { skillId: string; prerequisiteId: string };

export type LessonExport = WithId & {
  subjectId: string;
  skillId: string | null;
  titleVi: string;
  titleEn: string;
  objectiveVi: string;
  objectiveEn: string;
  gradeFrom: number;
  gradeTo: number;
  version: number;
  ownershipType?: "catalogue" | "organization" | "family";
  ownerParentId?: string | null;
  purpose?: "official" | "practice";
  sourceLessonId?: string | null;
  sourceVersion?: number | null;
  createdAt: number;
  updatedAt: number;
};

export type LessonVersionExport = {
  lessonId: string;
  version: number;
  titleVi: string;
  titleEn: string;
  objectiveVi: string;
  objectiveEn: string;
  createdAt: number;
};

export type LessonStepExport = WithId & {
  lessonId: string;
  position: number;
  kind: "concept" | "visual" | "guided" | "independent" | "transfer";
  content: ExerciseSpec;
  answerKey: unknown;
  explanationVi: string;
  contentVersion: number;
  sourceStepId?: string | null;
};

export type ReviewApprovalExport = WithId & {
  learnerId?: string | null;
  lessonId: string;
  lessonVersion?: number;
  status: ApprovalStatus;
  decidedBy: string;
  decidedAt: number;
  note: string | null;
};

export type LearningSessionExport = WithId & {
  learnerId: string;
  lessonId: string;
  lessonVersion: number;
  schoolYearId: string | null;
  startedAt: number;
  endedAt: number | null;
  status: SessionStatus;
  stepsSeen: number;
  continuationDeadline?: number | null;
  purpose?: "official" | "practice";
};

export type LearningAttemptExport = WithId & {
  sessionId: string;
  learnerId: string;
  lessonId: string;
  stepId: string;
  stepVersion: number;
  skillId: string | null;
  submitted: unknown;
  outcome: "correct" | "incorrect" | "partial";
  helpLevel: number;
  evidenceKind: "observed" | "assisted" | "parent_correction";
  attemptNo: number;
  purpose?: "official" | "practice";
  createdAt: number;
};

export type SkillEvidenceExport = WithId & {
  learnerId: string;
  skillId: string;
  state: CompetencyState;
  independentCount: number;
  assistedCount: number;
  correctCount: number;
  lastIndependentAt: number | null;
  lastObservedAt: number | null;
  source: "derived" | "parent_correction";
  correctionNote: string | null;
  updatedAt: number;
};

export type ReviewScheduleExport = WithId & {
  learnerId: string;
  skillId: string;
  dueAt: number;
  intervalDays: number;
  lastResult: "passed" | "failed" | null;
  lastAttemptAt: number | null;
  failureStreak: number;
  createdAt: number;
  updatedAt: number;
};

export type LearningGoalExport = WithId & {
  learnerId: string;
  subjectId: string | null;
  titleVi: string;
  note: string | null;
  targetDate: string | null;
  status: "active" | "paused" | "achieved" | "retired";
  createdAt: number;
  updatedAt: number;
};

export type AuditEventExport = WithId & {
  actor: string;
  action: string;
  subject: string | null;
  detail: unknown;
  createdAt: number;
};

export type CurriculumObjectiveExport = WithId & {
  subjectId: string;
  grade: number;
  code: string;
  titleVi: string;
  descriptionVi: string;
  skillId: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  sourceRef: string | null;
  createdAt: number;
};

export type CurriculumIntakeExport = WithId & {
  learnerId: string;
  schoolYearLabel: string;
  grade: number;
  subjectId: string;
  textbookSeries: string;
  currentUnit: string;
  currentLesson: string;
  weeklySessions: number;
  sessionDurationMinutes: number;
  materialReference: string | null;
  learningGoalsVi: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  createdAt: number;
  updatedAt: number;
};

export type LessonMetadataExport = {
  lessonId: string;
  objectiveId: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  sourceRef: string | null;
  expectedDurationMinutes: number;
  reviewRecommendationVi: string | null;
  isBaseline: 0 | 1;
  updatedAt: number;
};

export type BaselineAssessmentExport = WithId & {
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
};

export type LearningPlanItemExport = WithId & {
  learnerId: string;
  schoolYearLabel: string;
  weekIndex: number;
  dayOfWeek: number;
  scheduledDate: string | null;
  subjectId: string;
  skillId: string | null;
  lessonId: string | null;
  itemKind: "lesson" | "review" | "baseline";
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  durationMinutes: number;
  parentNote: string | null;
  reasonVi: string;
  createdAt: number;
  updatedAt: number;
};

export type SessionReflectionExport = WithId & {
  sessionId: string;
  learnerId: string;
  feeling: "confident" | "good" | "neutral" | "confused" | "tired";
  noteVi: string | null;
  createdAt: number;
};

/** A rejection the parent can read and act on, not a stack trace. */
export type ImportReport = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
};

/* ── runtime validation ───────────────────────────────────────────────────────
 *
 * The validator lives beside the format it validates, and is shared by the
 * Worker's import route, the client's pre-send check, and the tests. Three
 * callers with one implementation is the only way the client's "this file looks
 * fine" cannot disagree with the server's decision to refuse it.
 * --------------------------------------------------------------------------- */

import {
  APPROVAL_STATUSES,
  COMPETENCY_STATES,
  EVIDENCE_KINDS,
  LESSON_STEP_KINDS,
  SESSION_STATUSES,
} from "./attempt";
import { validateExercise } from "./exercise";

/** Every row-bearing collection. `schemaVersions` is checked separately. */
export const EXPORT_COLLECTIONS = [
  "learners",
  "schoolYears",
  "subjects",
  "skills",
  "skillPrerequisites",
  "curriculumObjectives",
  "curriculumIntakes",
  "lessons",
  "lessonVersions",
  "lessonSteps",
  "lessonMetadata",
  "reviewApprovals",
  "learningSessions",
  "learningAttempts",
  "skillEvidence",
  "reviewSchedule",
  "baselineAssessments",
  "learningPlanItems",
  "sessionReflections",
  "learningGoals",
  "auditEvents",
] as const satisfies readonly (keyof ExportBody)[];

export type EnvelopeValidation =
  | { ok: true; envelope: ExportEnvelope; warnings: string[] }
  | { ok: false; errors: string[] };

/**
 * Validate an entire envelope before anything is written.
 *
 * The rules mirror what the format promises: a known integer version, an object
 * body, every collection an array, every row carrying a non-empty id, and every
 * lesson step's content passing the exercise schema. Import is the untrusted
 * boundary, so a row that fails here never reaches the database.
 *
 * Messages are Vietnamese because they surface to the parent, who is the person
 * acting on them. An unknown `formatVersion` is refused rather than coerced: a
 * newer file cannot be interpreted, and guessing would invent data.
 */
export function validateExportEnvelope(raw: unknown): EnvelopeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["Tệp dữ liệu phải là một đối tượng JSON."] };
  }
  const candidate = raw as Partial<ExportEnvelope>;

  if (candidate.formatVersion !== TRANSFER_FORMAT_VERSION) {
    // A newer version cannot be interpreted; an older one needs a migration path.
    errors.push(
      `Phiên bản định dạng ${String(candidate.formatVersion)} không được hỗ trợ (cần ${TRANSFER_FORMAT_VERSION}).`,
    );
  }
  if (typeof candidate.exportedAt !== "number" || !Number.isFinite(candidate.exportedAt)) {
    errors.push("Thiếu thời điểm xuất dữ liệu.");
  }
  // Clock skew tolerance: exportedAt cannot be in the future beyond 5 minutes
  const CLOCK_TOLERANCE_MS = 5 * 60 * 1000;
  if (
    typeof candidate.exportedAt === "number" &&
    Number.isFinite(candidate.exportedAt) &&
    candidate.exportedAt > Date.now() + CLOCK_TOLERANCE_MS
  ) {
    errors.push("Thời điểm xuất dữ liệu nằm trong tương lai bất thường.");
  }
  if (
    candidate.source !== "manual_export" &&
    candidate.source !== "backup_restore" &&
    candidate.source !== "demo_fixture"
  ) {
    errors.push("Nguồn dữ liệu không được nhận diện.");
  }
  if (typeof candidate.containsLearnerEvidence !== "boolean") {
    errors.push("Thiếu cờ đánh dấu dữ liệu người học.");
  }
  if (typeof candidate.data !== "object" || candidate.data === null || Array.isArray(candidate.data)) {
    errors.push("Thiếu phần nội dung dữ liệu.");
  }
  if (errors.length > 0) return { ok: false, errors };

  const data = candidate.data as ExportBody;

  const OPTIONAL_NEW_COLLECTIONS = new Set<string>([
    "curriculumObjectives",
    "curriculumIntakes",
    "lessonVersions",
    "lessonMetadata",
    "baselineAssessments",
    "learningPlanItems",
    "sessionReflections",
  ]);

  for (const key of EXPORT_COLLECTIONS) {
    const rows = data[key];
    if (rows === undefined && OPTIONAL_NEW_COLLECTIONS.has(key)) {
      continue;
    }
    if (!Array.isArray(rows)) {
      errors.push(`Danh sách ${key} không hợp lệ.`);
      continue;
    }
    for (const row of rows) {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        errors.push(`Một dòng trong ${key} không hợp lệ.`);
        continue;
      }
      // A row's identity is whatever its table's primary key is. Most tables
      // have a single `id` column; `skill_prerequisites` does not, and its row
      // is identified by the pair of skills it joins — so it is checked on that
      // pair rather than on an `id` it never had. `lessonMetadata` and `lessonVersions` are keyed by `lessonId`.
      const identity = key === "skillPrerequisites"
        ? (["skillId", "prerequisiteId"] as const).map((field) => (row as Record<string, unknown>)[field])
        : key === "lessonMetadata" || key === "lessonVersions"
          ? [(row as { lessonId?: unknown }).lessonId]
          : [(row as { id?: unknown }).id];
      if (identity.some((value) => typeof value !== "string" || value.length === 0)) {
        errors.push(`Một dòng trong ${key} thiếu mã định danh.`);
      }
    }
  }
  if (!Array.isArray(data.schemaVersions)) {
    errors.push("Danh sách phiên bản lược đồ không hợp lệ.");
  }
  const exportedLessonsById = new Map<string, number>();
  if (Array.isArray(data.lessons)) {
    const seenLessonIds = new Set<string>();
    for (const l of data.lessons) {
      if (typeof l === "object" && l !== null && typeof l.id === "string" && typeof l.version === "number") {
        if (seenLessonIds.has(l.id)) {
          errors.push(`Trùng mã bài học (${l.id}) trong danh sách lessons.`);
        }
        seenLessonIds.add(l.id);
        exportedLessonsById.set(l.id, l.version);
      }
      if (typeof l === "object" && l !== null) {
        const recL = l as Partial<LessonExport>;
        if (
          recL.ownershipType !== undefined &&
          recL.ownershipType !== "catalogue" &&
          recL.ownershipType !== "organization" &&
          recL.ownershipType !== "family"
        ) {
          errors.push(`Loại quyền sở hữu bài học (${String(recL.ownershipType)}) không hợp lệ.`);
        }
        if (
          recL.purpose !== undefined &&
          recL.purpose !== "official" &&
          recL.purpose !== "practice"
        ) {
          errors.push(`Mục đích bài học (${String(recL.purpose)}) không hợp lệ.`);
        }
      }
    }
  }

  const declaredLessonVersions = new Set<string>();
  const hasExplicitLessonVersions =
    Array.isArray(data.lessonVersions) && data.lessonVersions.length > 0;
  if (data.lessonVersions !== undefined) {
    if (!Array.isArray(data.lessonVersions)) {
      errors.push("Danh sách lessonVersions không hợp lệ.");
    } else {
      for (const lv of data.lessonVersions) {
        if (typeof lv !== "object" || lv === null || Array.isArray(lv)) {
          errors.push("Một dòng trong lessonVersions không hợp lệ.");
          continue;
        }
        const rec = lv as {
          lessonId?: unknown;
          version?: unknown;
          titleVi?: unknown;
          titleEn?: unknown;
          objectiveVi?: unknown;
          objectiveEn?: unknown;
          createdAt?: unknown;
        };
        if (typeof rec.lessonId !== "string" || rec.lessonId.length === 0) {
          errors.push("Một dòng trong lessonVersions thiếu mã bài học (lessonId).");
        }
        if (typeof rec.version !== "number" || !Number.isInteger(rec.version) || rec.version < 1) {
          errors.push("Một dòng trong lessonVersions có số phiên bản (version) không hợp lệ.");
        }
        if (typeof rec.titleVi !== "string" || rec.titleVi.trim().length === 0 || rec.titleVi.length > 500) {
          errors.push("Một dòng trong lessonVersions có tiêu đề tiếng Việt (titleVi) không hợp lệ.");
        }
        if (typeof rec.titleEn !== "string" || rec.titleEn.length > 500) {
          errors.push("Một dòng trong lessonVersions có tiêu đề tiếng Anh (titleEn) không hợp lệ.");
        }
        if (
          typeof rec.objectiveVi !== "string" ||
          rec.objectiveVi.trim().length === 0 ||
          rec.objectiveVi.length > 2000
        ) {
          errors.push("Một dòng trong lessonVersions có mục tiêu tiếng Việt (objectiveVi) không hợp lệ.");
        }
        if (typeof rec.objectiveEn !== "string" || rec.objectiveEn.length > 2000) {
          errors.push("Một dòng trong lessonVersions có mục tiêu tiếng Anh (objectiveEn) không hợp lệ.");
        }
        if (
          typeof rec.createdAt !== "number" ||
          !Number.isFinite(rec.createdAt) ||
          rec.createdAt < 0 ||
          rec.createdAt > Date.now() + CLOCK_TOLERANCE_MS
        ) {
          errors.push("Một dòng trong lessonVersions có thời điểm tạo (createdAt) không hợp lệ.");
        }
        if (
          typeof rec.lessonId === "string" &&
          rec.lessonId.length > 0 &&
          typeof rec.version === "number" &&
          Number.isInteger(rec.version) &&
          rec.version >= 1
        ) {
          const lvKey = `${rec.lessonId}@${rec.version}`;
          if (declaredLessonVersions.has(lvKey)) {
            errors.push(`Trùng phiên bản bài học (${rec.lessonId} v${rec.version}) trong lessonVersions.`);
          }
          declaredLessonVersions.add(lvKey);
          const maxLessonVersion = exportedLessonsById.get(rec.lessonId);
          if (maxLessonVersion === undefined) {
            errors.push(`Dòng lessonVersions tham chiếu đến bài học không có trong tệp (${rec.lessonId}).`);
          } else if (rec.version > maxLessonVersion) {
            errors.push(
              `Dòng lessonVersions của bài ${rec.lessonId} có phiên bản (${rec.version}) vượt quá phiên bản hiện hành (${maxLessonVersion}).`,
            );
          }
        }
      }
    }
  }
  if (errors.length > 0) return { ok: false, errors };

  if (data.learners.length === 0) {
    errors.push("Tệp dữ liệu không có hồ sơ người học.");
  }
  for (const learner of data.learners) {
    if (typeof learner.nickname !== "string" || learner.nickname.length === 0) {
      errors.push("Hồ sơ người học thiếu biệt danh.");
    }
    // Only a birth YEAR is accepted. A full date of birth is never collected.
    if (learner.birthYear !== null && !Number.isInteger(learner.birthYear)) {
      errors.push("Năm sinh không hợp lệ.");
    }
  }

  // Every step's content must validate: import is the untrusted input boundary,
  // so content cannot be persisted without passing the exercise schema.
  const exportedStepById = new Map<string, LessonStepExport>();
  const seenStepVersionPos = new Set<string>();
  const stepVersionsPresent = new Set<string>();
  for (const step of data.lessonSteps) {
    if (exportedStepById.has(step.id)) {
      errors.push(`Trùng mã bước học (${step.id}) trong lessonSteps.`);
    }
    exportedStepById.set(step.id, step);
    const maxVer = exportedLessonsById.get(step.lessonId);
    if (maxVer === undefined) {
      errors.push(`Bước học ${step.id} tham chiếu đến bài học không tồn tại trong tệp (${step.lessonId}).`);
    } else if (
      typeof step.contentVersion !== "number" ||
      !Number.isInteger(step.contentVersion) ||
      step.contentVersion < 1 ||
      step.contentVersion > maxVer
    ) {
      errors.push(
        `Bước học ${step.id} của bài ${step.lessonId} có contentVersion (${String(step.contentVersion)}) không hợp lệ.`,
      );
    } else {
      const lvKey = `${step.lessonId}@${step.contentVersion}`;
      stepVersionsPresent.add(lvKey);
      if (hasExplicitLessonVersions && !declaredLessonVersions.has(lvKey)) {
        errors.push(
          `Bước học ${step.id} của bài ${step.lessonId} (v${step.contentVersion}) không có bản ghi tương ứng trong lessonVersions.`,
        );
      }
      const posKey = `${step.lessonId}@${step.contentVersion}#${step.position}`;
      if (seenStepVersionPos.has(posKey)) {
        errors.push(
          `Trùng vị trí bước học (position=${step.position}) trên bài ${step.lessonId} phiên bản ${step.contentVersion}.`,
        );
      }
      seenStepVersionPos.add(posKey);
    }
    if (!LESSON_STEP_KINDS.includes(step.kind)) {
      errors.push(`Loại bước học không hợp lệ: ${String(step.kind)}`);
    }
    const result = validateExercise(step.content);
    if (!result.ok) {
      errors.push(`Bước học ${step.position} của bài ${step.lessonId}: ${result.error}`);
    }
    if (typeof step.explanationVi !== "string" || step.explanationVi.trim().length === 0) {
      errors.push(`Bước học ${step.position} của bài ${step.lessonId} cần có giải thích.`);
    }
  }

  const hasDeclaredLessons = data.lessons.length > 0 || hasExplicitLessonVersions;

  for (const session of data.learningSessions) {
    if (!SESSION_STATUSES.includes(session.status)) {
      errors.push(`Trạng thái phiên học không hợp lệ: ${String(session.status)}`);
    }
    if (
      session.purpose !== undefined &&
      session.purpose !== "official" &&
      session.purpose !== "practice"
    ) {
      errors.push(`Mục đích phiên học (${String(session.purpose)}) không hợp lệ.`);
    }
    if (hasDeclaredLessons) {
      const maxVer = exportedLessonsById.get(session.lessonId);
      if (maxVer === undefined) {
        errors.push(`Phiên học ${session.id} tham chiếu đến bài học không tồn tại trong tệp (${session.lessonId}).`);
      } else if (
        typeof session.lessonVersion !== "number" ||
        !Number.isInteger(session.lessonVersion) ||
        session.lessonVersion < 1 ||
        session.lessonVersion > maxVer
      ) {
        errors.push(
          `Phiên học ${session.id} có lessonVersion (${String(session.lessonVersion)}) không hợp lệ đối với bài ${session.lessonId}.`,
        );
      } else if (
        hasExplicitLessonVersions &&
        !declaredLessonVersions.has(`${session.lessonId}@${session.lessonVersion}`)
      ) {
        errors.push(
          `Phiên học ${session.id} tham chiếu đến phiên bản ${session.lessonId}@v${session.lessonVersion} không có trong lessonVersions.`,
        );
      }
    }
    if (typeof session.startedAt !== "number" || !Number.isFinite(session.startedAt)) {
      errors.push("Phiên học thiếu thời điểm bắt đầu hợp lệ.");
    } else {
      if (candidate.exportedAt && session.startedAt > candidate.exportedAt + CLOCK_TOLERANCE_MS) {
        errors.push(`Phiên học ${session.id} có thời điểm bắt đầu lớn hơn thời điểm xuất tệp.`);
      }
      if (session.startedAt > Date.now() + CLOCK_TOLERANCE_MS) {
        errors.push(`Phiên học ${session.id} có thời điểm bắt đầu nằm trong tương lai bất thường.`);
      }
    }
    if (session.endedAt !== null && session.endedAt !== undefined) {
      if (typeof session.endedAt !== "number" || !Number.isFinite(session.endedAt)) {
        errors.push(`Phiên học ${session.id} có thời điểm kết thúc không hợp lệ.`);
      } else if (typeof session.startedAt === "number" && session.endedAt < session.startedAt) {
        errors.push(`Phiên học ${session.id} có thời điểm kết thúc trước thời điểm bắt đầu.`);
      }
    }
  }
  const exportedSessionsById = new Map(data.learningSessions.map((s) => [s.id, s]));
  for (const attempt of data.learningAttempts) {
    if (!EVIDENCE_KINDS.includes(attempt.evidenceKind)) {
      errors.push(`Loại bằng chứng không hợp lệ: ${String(attempt.evidenceKind)}`);
    }
    if (!Number.isInteger(attempt.helpLevel) || attempt.helpLevel < 0 || attempt.helpLevel > 4) {
      errors.push("Mức gợi ý phải nằm trong khoảng 0..4.");
    }
    if (
      attempt.purpose !== undefined &&
      attempt.purpose !== "official" &&
      attempt.purpose !== "practice"
    ) {
      errors.push(`Mục đích lượt làm bài (${String(attempt.purpose)}) không hợp lệ.`);
    }
    if (hasDeclaredLessons || data.lessonSteps.length > 0) {
      const referencedStep = exportedStepById.get(attempt.stepId);
      if (!referencedStep) {
        errors.push(`Lượt làm bài ${attempt.id} tham chiếu đến bước học không có trong tệp (${attempt.stepId}).`);
      } else {
        if (referencedStep.lessonId !== attempt.lessonId) {
          errors.push(
            `Lượt làm bài ${attempt.id} có lessonId (${attempt.lessonId}) không khớp với bài học của bước ${attempt.stepId} (${referencedStep.lessonId}).`,
          );
        }
        if (referencedStep.contentVersion !== attempt.stepVersion) {
          errors.push(
            `Lượt làm bài ${attempt.id} có stepVersion (${attempt.stepVersion}) không khớp với contentVersion của bước ${attempt.stepId} (${referencedStep.contentVersion}).`,
          );
        }
      }
    }
    if (data.learningSessions.length > 0) {
      const referencedSession = exportedSessionsById.get(attempt.sessionId);
      if (!referencedSession) {
        errors.push(`Lượt làm bài ${attempt.id} tham chiếu đến phiên học không có trong tệp (${attempt.sessionId}).`);
      } else if (referencedSession.lessonId !== attempt.lessonId) {
        errors.push(
          `Lượt làm bài ${attempt.id} có lessonId (${attempt.lessonId}) không khớp với phiên học ${attempt.sessionId} (${referencedSession.lessonId}).`,
        );
      }
    }
  }
  for (const row of data.skillEvidence) {
    if (!COMPETENCY_STATES.includes(row.state)) {
      errors.push(`Trạng thái năng lực không hợp lệ: ${String(row.state)}`);
    }
  }
  for (const approval of data.reviewApprovals) {
    if (!APPROVAL_STATUSES.includes(approval.status)) {
      errors.push(`Trạng thái phê duyệt không hợp lệ: ${String(approval.status)}`);
    }
    if (hasDeclaredLessons) {
      const maxVer = exportedLessonsById.get(approval.lessonId);
      const appVer = approval.lessonVersion ?? 1;
      if (maxVer === undefined) {
        errors.push(`Bản ghi phê duyệt ${approval.id} tham chiếu đến bài học không có trong tệp (${approval.lessonId}).`);
      } else if (!Number.isInteger(appVer) || appVer < 1 || appVer > maxVer) {
        errors.push(
          `Bản ghi phê duyệt ${approval.id} có lessonVersion (${String(approval.lessonVersion)}) không hợp lệ đối với bài ${approval.lessonId}.`,
        );
      } else if (
        hasExplicitLessonVersions &&
        !declaredLessonVersions.has(`${approval.lessonId}@${appVer}`)
      ) {
        errors.push(
          `Bản ghi phê duyệt ${approval.id} tham chiếu đến phiên bản ${approval.lessonId}@v${appVer} không có trong lessonVersions.`,
        );
      }
    }
  }

  const exportedLearnerIds = new Set(data.learners.map((l) => l.id));
  const exportedSessionIds = new Set(data.learningSessions.map((s) => s.id));
  for (const approval of data.reviewApprovals) {
    if (
      approval.learnerId !== undefined &&
      approval.learnerId !== null &&
      !exportedLearnerIds.has(approval.learnerId)
    ) {
      errors.push("Bản ghi phê duyệt tham chiếu đến người học không tồn tại trong tệp.");
    }
  }
  const hintFloorByLearnerStep = new Map<string, number>();

  for (const audit of data.auditEvents) {
    if (typeof audit.actor !== "string" || audit.actor.trim().length === 0) {
      errors.push("Sự kiện kiểm toán thiếu actor hợp lệ.");
      continue;
    }
    if (typeof audit.action !== "string" || audit.action.trim().length === 0) {
      errors.push("Sự kiện kiểm toán thiếu action hợp lệ.");
      continue;
    }
    if (typeof audit.createdAt !== "number" || !Number.isFinite(audit.createdAt)) {
      errors.push("Sự kiện kiểm toán thiếu thời điểm hợp lệ.");
      continue;
    }
    if (audit.action === "hint.requested") {
      if (!audit.actor.startsWith("learner:")) {
        errors.push("Sự kiện gợi ý (hint.requested) phải có actor thuộc người học.");
        continue;
      }
      const actorLearnerId = audit.actor.slice("learner:".length);
      if (!exportedLearnerIds.has(actorLearnerId)) {
        errors.push("Sự kiện gợi ý (hint.requested) tham chiếu đến người học không nằm trong tệp xuất.");
        continue;
      }
      if (typeof audit.subject !== "string" || audit.subject.trim().length === 0) {
        errors.push("Sự kiện gợi ý (hint.requested) thiếu mã bước học (subject).");
        continue;
      }
      if (
        typeof audit.detail !== "object" ||
        audit.detail === null ||
        Array.isArray(audit.detail)
      ) {
        errors.push("Chi tiết sự kiện gợi ý (hint.requested) phải là đối tượng JSON.");
        continue;
      }
      const detailObj = audit.detail as Record<string, unknown>;
      const level = detailObj.level;
      if (typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 4) {
        errors.push("Mức gợi ý trong sự kiện kiểm toán (hint.requested) phải là số nguyên 1..4.");
        continue;
      }
      if (
        detailObj.sessionId !== undefined &&
        (typeof detailObj.sessionId !== "string" ||
          (exportedSessionIds.size > 0 && !exportedSessionIds.has(detailObj.sessionId)))
      ) {
        errors.push("Sự kiện gợi ý (hint.requested) tham chiếu đến phiên học không hợp lệ.");
        continue;
      }
      const key = `${actorLearnerId}::${audit.subject}`;
      const prev = hintFloorByLearnerStep.get(key) ?? 0;
      if (level > prev) hintFloorByLearnerStep.set(key, level);
    }
  }

  // Provenance cross-check: attempts must not violate first-attempt or hint-floor rules,
  // and skillEvidence must not claim higher independentCount or competency state than derived from attempts.
  const attemptsByLearnerStep = new Map<string, LearningAttemptExport[]>();
  const observedCorrectByLearnerSkill = new Map<string, number>();
  const transferStepIds = new Set(
    data.lessonSteps.filter((s) => s.kind === "transfer").map((s) => s.id),
  );

  for (const attempt of data.learningAttempts) {
    if (!exportedLearnerIds.has(attempt.learnerId)) {
      errors.push("Bản ghi lượt trả lời tham chiếu đến người học không tồn tại trong tệp.");
      continue;
    }
    const stepKey = `${attempt.learnerId}::${attempt.stepId}`;
    const stepList = attemptsByLearnerStep.get(stepKey) ?? [];
    stepList.push(attempt);
    attemptsByLearnerStep.set(stepKey, stepList);

    const floor = hintFloorByLearnerStep.get(stepKey) ?? 0;
    const attemptNo = attempt.attemptNo ?? 1;
    if (!Number.isInteger(attemptNo) || attemptNo < 1) {
      errors.push("Số thứ tự lượt làm bài (attemptNo) phải là số nguyên dương.");
    }
    if (attempt.evidenceKind === "observed") {
      if ((attempt.purpose ?? "official") === "practice") {
        errors.push(
          `Lượt làm bài luyện tập (${attempt.id}) không được phép ghi nhận là bằng chứng độc lập (observed).`,
        );
      }
      if (attemptNo > 1 || attempt.helpLevel > 0 || floor > 0) {
        errors.push(
          `Lượt làm bài ${attempt.id} không thể được ghi nhận là độc lập (observed) khi đã dùng gợi ý hoặc làm lại.`,
        );
      }
    }
    if (
      attempt.outcome === "correct" &&
      attempt.evidenceKind === "observed" &&
      (attempt.purpose ?? "official") === "official" &&
      attempt.skillId
    ) {
      const skillKey = `${attempt.learnerId}::${attempt.skillId}`;
      observedCorrectByLearnerSkill.set(
        skillKey,
        (observedCorrectByLearnerSkill.get(skillKey) ?? 0) + 1,
      );
    }
  }

  for (const [, stepAttempts] of attemptsByLearnerStep) {
    const seenNos = new Set<number>();
    let observedCount = 0;
    for (const att of stepAttempts) {
      const no = att.attemptNo ?? 1;
      if (seenNos.has(no)) {
        errors.push(`Trùng số thứ tự lượt làm bài (attemptNo=${no}) trên bước ${att.stepId}.`);
      }
      seenNos.add(no);
      if (att.evidenceKind === "observed") observedCount += 1;
    }
    if (observedCount > 1) {
      errors.push("Một bước học không thể có nhiều hơn một lượt làm bài độc lập (observed).");
    }
  }

  for (const row of data.skillEvidence) {
    if (row.source === "derived") {
      const skillKey = `${row.learnerId}::${row.skillId}`;
      const maxObserved = observedCorrectByLearnerSkill.get(skillKey) ?? 0;
      if (row.independentCount > maxObserved) {
        errors.push(
          `Bằng chứng kỹ năng ${row.skillId} khai báo số lượt độc lập (${row.independentCount}) vượt quá số lượt làm đúng độc lập thực tế (${maxObserved}).`,
        );
      }
      const skillAttempts = data.learningAttempts.filter(
        (a) =>
          a.learnerId === row.learnerId &&
          a.skillId === row.skillId &&
          (a.purpose ?? "official") === "official",
      );
      const anyObservedCorrect = maxObserved >= 1;
      const anyObservedTransfer = skillAttempts.some(
        (a) =>
          a.outcome === "correct" &&
          a.evidenceKind === "observed" &&
          transferStepIds.has(a.stepId),
      );
      if (
        (row.state === "INDEPENDENT" || row.state === "TRANSFERRED" || row.state === "RETAINED") &&
        !anyObservedCorrect
      ) {
        errors.push(
          `Bằng chứng kỹ năng ${row.skillId} khai báo trạng thái ${row.state} nhưng không có lượt làm đúng độc lập (observed).`,
        );
      }
      if ((row.state === "TRANSFERRED" || row.state === "RETAINED") && !anyObservedTransfer) {
        errors.push(
          `Bằng chứng kỹ năng ${row.skillId} khai báo trạng thái ${row.state} nhưng không có lượt làm đúng độc lập ở bước vận dụng (transfer).`,
        );
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  if (candidate.source === "demo_fixture") {
    warnings.push("Đây là dữ liệu mẫu, không phải thành tích thật của người học.");
  }
  if (!candidate.containsLearnerEvidence) {
    warnings.push("Tệp này không chứa bằng chứng học tập của người học.");
  }

  return { ok: true, envelope: candidate as ExportEnvelope, warnings };
}
