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
  lessons: LessonExport[];
  lessonSteps: LessonStepExport[];
  reviewApprovals: ReviewApprovalExport[];
  learningSessions: LearningSessionExport[];
  learningAttempts: LearningAttemptExport[];
  skillEvidence: SkillEvidenceExport[];
  reviewSchedule: ReviewScheduleExport[];
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
  createdAt: number;
  updatedAt: number;
};

export type LessonStepExport = WithId & {
  lessonId: string;
  position: number;
  kind: "concept" | "visual" | "guided" | "independent" | "transfer";
  content: ExerciseSpec;
  answerKey: unknown;
  explanationVi: string;
  contentVersion: number;
};

export type ReviewApprovalExport = WithId & {
  lessonId: string;
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
  "lessons",
  "lessonSteps",
  "reviewApprovals",
  "learningSessions",
  "learningAttempts",
  "skillEvidence",
  "reviewSchedule",
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

  for (const key of EXPORT_COLLECTIONS) {
    const rows = data[key];
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
      // pair rather than on an `id` it never had.
      const identity = key === "skillPrerequisites"
        ? (["skillId", "prerequisiteId"] as const).map((field) => (row as Record<string, unknown>)[field])
        : [(row as { id?: unknown }).id];
      if (identity.some((value) => typeof value !== "string" || value.length === 0)) {
        errors.push(`Một dòng trong ${key} thiếu mã định danh.`);
      }
    }
  }
  if (!Array.isArray(data.schemaVersions)) {
    errors.push("Danh sách phiên bản lược đồ không hợp lệ.");
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
  for (const step of data.lessonSteps) {
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

  for (const session of data.learningSessions) {
    if (!SESSION_STATUSES.includes(session.status)) {
      errors.push(`Trạng thái phiên học không hợp lệ: ${String(session.status)}`);
    }
  }
  for (const attempt of data.learningAttempts) {
    if (!EVIDENCE_KINDS.includes(attempt.evidenceKind)) {
      errors.push(`Loại bằng chứng không hợp lệ: ${String(attempt.evidenceKind)}`);
    }
    if (!Number.isInteger(attempt.helpLevel) || attempt.helpLevel < 0 || attempt.helpLevel > 4) {
      errors.push("Mức gợi ý phải nằm trong khoảng 0..4.");
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
