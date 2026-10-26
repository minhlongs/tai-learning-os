/**
 * API CONTRACT — the frozen interface between the Worker and the React client.
 *
 * This file is the single source of truth for request/response shapes. The
 * client imports the types; it never re-declares them. Changing a response
 * shape means changing this file, which is a deliberate, reviewable act.
 *
 * All responses are JSON. All routes are relative to `/api`.
 * Auth: the parent session cookie (HttpOnly, SameSite=Strict) is sent
 * automatically by the browser. Mutating routes additionally require the
 * `x-tlo-csrf` header.
 */

import type { ApprovalStatus, CompetencyState, SessionStatus } from "./schemas/attempt";
import type { ExerciseSpec, LearnerExerciseSpec } from "./schemas/exercise";
import type { LessonStepKind } from "./schemas/attempt";

/** Returned by GET /api/session and by every authenticated response. */
export type SessionInfo = {
  authenticated: boolean;
  parentDisplayName: string | null;
  /** Learner the parent manages, or null when none is enrolled yet. */
  learner: { id: string; nickname: string } | null;
  csrfToken: string | null;
  /** Active privilege boundary: "parent" unlocks parent/data routes; "learner" restricts to learner routes. */
  mode?: "parent" | "learner" | null;
};

export type SwitchSessionModeRequest = {
  mode: "parent" | "learner";
  /** Required when switching to "parent" mode. */
  password?: string;
};

// --- Learner home -----------------------------------------------------------

export type SubjectSummary = {
  id: string;
  nameVi: string;
  nameEn: string;
  active: boolean;
  /** Lessons available to the learner right now (approved only). */
  lessonCount: number;
};

export type LearnerHomeResponse = {
  learner: { id: string; nickname: string };
  subjects: SubjectSummary[];
  /** Skills with an independent observation, ordered by strength of evidence. */
  currentObjectives: {
    skillId: string;
    skillNameVi: string;
    subjectId: string;
    state: CompetencyState;
  }[];
  /** Review entries whose due date has passed. */
  reviewDue: {
    skillId: string;
    skillNameVi: string;
    subjectId: string;
    dueAt: number;
    daysOverdue: number;
  }[];
  /** The lesson the learner can continue, if a session is in progress. */
  continueLesson: {
    sessionId: string;
    lessonId: string;
    titleVi: string;
    subjectId: string;
    stepPosition: number;
  } | null;
  completedSessions: {
    sessionId: string;
    lessonTitleVi: string;
    subjectId: string;
    completedAt: number;
    correctCount: number;
    attemptedCount: number;
  }[];
};

// --- Lesson session --------------------------------------------------------

export type StartSessionRequest = { lessonId: string };

export type StartSessionResponse = {
  sessionId: string;
  lessonId: string;
  lessonTitleVi: string;
  subjectId: string;
  steps: LessonStepPayload[];
};

/** What the client is allowed to see. Never includes the answer key. */
export type LessonStepPayload = {
  id: string;
  position: number;
  kind: LessonStepKind;
  content: LearnerExerciseSpec;
  /** Explanation is withheld until the step is completed. */
  explanationVi: string | null;
};

export type RequestHintRequest = { stepId: string; currentLevel: number };
export type RequestHintResponse = { level: number; hintVi: string | null };

export type SubmitAttemptRequest = {
  stepId: string;
  /**
   * The session the attempt belongs to, sent so the server can bind it to rows
   * it already owns rather than to whichever session it can find.
   */
  sessionId: string;
  submission:
    | { kind: "choice"; choiceId: string }
    | { kind: "fraction"; numerator: number; denominator: number }
    | { kind: "text"; text: string };
  /** Highest hint level used before submitting. */
  helpLevel: number;
};

export type SubmitAttemptResponse = {
  attemptId: string;
  outcome: "correct" | "incorrect" | "partial";
  messageVi: string;
  /** How many attempts on this step in this session. */
  attemptNo: number;
  /** Explanation is unlocked once the step is answered correctly. */
  explanationVi: string | null;
  /** True when a correct answer requires moving to the next step. */
  canAdvance: boolean;
  /** True when the interaction is a transfer check (well done message). */
  isTransfer: boolean;
};

export type FinalizeSessionRequest = { sessionId: string };
export type FinalizeSessionResponse = { sessionId: string; status: SessionStatus; summary: SessionSummary };

export type SessionSummary = {
  attemptedCount: number;
  correctCount: number;
  /** Attempts where help level was 3 or 4. */
  assistedCount: number;
  /** Distinct hint levels used. */
  maxHelpLevel: number;
  stepsCompleted: number;
  skillsPracticed: { skillId: string; skillNameVi: string; subjectId: string }[];
  nextReview: {
    skillId: string;
    skillNameVi: string;
    dueAt: number;
    intervalDays: number;
    reasonVi: string;
  }[];
};

// --- Parent dashboard ------------------------------------------------------

export type ParentDashboardResponse = {
  learner: {
    id: string;
    nickname: string;
    grade: number | null;
    schoolYearLabel: string | null;
  } | null;
  emptyState: boolean;
  stats: {
    sessionCount: number;
    independentAttempts: number;
    assistedAttempts: number;
    skillsObserved: number;
    skillsIndependent: number;
    lastSessionAt: number | null;
  };
  reviewQueue: {
    skillId: string;
    skillNameVi: string;
    subjectId: string;
    dueAt: number;
    intervalDays: number;
    failureStreak: number;
  }[];
  recentSessions: {
    sessionId: string;
    lessonTitleVi: string;
    subjectId: string;
    startedAt: number;
    status: SessionStatus;
    correctCount: number;
    attemptedCount: number;
    independentCount: number;
  }[];
  skillEvidence: {
    skillId: string;
    skillNameVi: string;
    subjectId: string;
    state: CompetencyState;
    independentCount: number;
    assistedCount: number;
    reasonVi: string;
    updatedAt: number;
  }[];
  goals: {
    id: string;
    titleVi: string;
    subjectId: string | null;
    status: "active" | "paused" | "achieved" | "retired";
  }[];
  needsAttention: { skillId: string; skillNameVi: string; reasonVi: string }[];
};

// --- Parent lesson management ---------------------------------------------

/**
 * The learner's view of one subject: its metadata plus the lessons the parent
 * has approved for it. An unapproved lesson is absent, not hidden.
 */
export type LearnerSubjectListResponse = {
  subjects: (SubjectSummary & {
    lessons: {
      id: string;
      titleVi: string;
      titleEn: string;
      objectiveVi: string;
      gradeFrom: number;
      gradeTo: number;
    }[];
  })[];
};

export type LessonListResponse = {
  lessons: {
    id: string;
    subjectId: string;
    titleVi: string;
    titleEn: string;
    objectiveVi: string;
    gradeFrom: number;
    gradeTo: number;
    version: number;
    approvalStatus: ApprovalStatus;
    stepCount: number;
    /** True when the parent has edited content since approval. */
    pendingReapproval: boolean;
    objectiveId?: string | null;
    provenance?: ProvenanceType;
    sourceRef?: string | null;
    expectedDurationMinutes?: number;
    reviewRecommendationVi?: string | null;
    isBaseline?: boolean;
  }[];
};

export type LessonDetailResponse = {
  id: string;
  subjectId: string;
  titleVi: string;
  objectiveVi: string;
  approvalStatus: ApprovalStatus;
  version: number;
  steps: (LessonStepPayload & { answerKey: unknown })[];
};

export type SetApprovalRequest = { lessonId: string; status: ApprovalStatus; note?: string };
export type SetApprovalResponse = { lessonId: string; status: ApprovalStatus };

export type UpdateContentRequest = {
  lessonId: string;
  titleVi?: string;
  objectiveVi?: string;
  /** Full replacement step set. Re-validated against the exercise schema. */
  steps?: {
    clientId: string;
    position: number;
    kind: LessonStepKind;
    content: ExerciseSpec;
    answerKey: unknown;
    explanationVi: string;
  }[];
};
export type UpdateContentResponse = { lessonId: string; version: number };

// --- Data control ---------------------------------------------------------

export type ExportResponse = {
  formatVersion: number;
  exportedAt: number;
  source: "manual_export" | "backup_restore";
  containsLearnerEvidence: boolean;
  data: unknown;
};

export type ImportResponse = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
};

export type DeleteLearnerRequest = { learnerId: string; confirmation: string };
export type DeleteLearnerResponse = { deleted: true };

// --- Learner enrolment ----------------------------------------------------

/**
 * What a parent supplies to enrol a learner.
 *
 * Deliberately minimal, and deliberately NOT a full legal name or date of
 * birth: `birthYear` is a year, never a full date, and `nickname` is what the
 * learner is called in the app. The MVP has no reason to know more, so it does
 * not ask.
 */
export type CreateLearnerRequest = {
  nickname: string;
  birthYear: number | null;
  grade: number | null;
  timezone: string;
};

export type UpdateLearnerProfileRequest = {
  learnerId: string;
  nickname: string;
  grade: number | null;
};

/** The learner record as the app stores it. */
export type LearnerProfile = {
  id: string;
  nickname: string;
  birthYear: number | null;
  grade: number | null;
  timezone: string;
  createdAt: number;
  updatedAt: number;
};

export type CreateLearnerResponse = { learner: LearnerProfile };
export type LearnerProfileResponse = { learner: LearnerProfile | null };

// --- Curriculum intake & metadata -----------------------------------------

export type ProvenanceType =
  | "gdpt_2018_objective"
  | "parent_textbook"
  | "original_supplemental"
  | "unverified_assumption";

export type CurriculumObjectiveDto = {
  id: string;
  subjectId: string;
  grade: number;
  code: string;
  titleVi: string;
  descriptionVi: string;
  skillId: string | null;
  provenance: ProvenanceType;
  sourceRef: string | null;
};

export type CurriculumIntakeDto = {
  id: string;
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
  provenance: ProvenanceType;
  updatedAt: number;
};

export type CurriculumGetResponse = {
  learnerId: string | null;
  schoolYearLabel: string;
  grade: number;
  intakes: CurriculumIntakeDto[];
  objectives: CurriculumObjectiveDto[];
};

export type UpsertCurriculumIntakeRequest = {
  schoolYearLabel: string;
  grade: number;
  subjectId: string;
  textbookSeries?: string;
  currentUnit?: string;
  currentLesson?: string;
  weeklySessions?: number;
  sessionDurationMinutes?: number;
  materialReference?: string | null;
  learningGoalsVi?: string | null;
  provenance?: ProvenanceType;
};

export type UpsertCurriculumIntakeResponse = {
  intake: CurriculumIntakeDto;
};

// --- Baseline assessment --------------------------------------------------

export type BaselineAssessmentDto = {
  id: string;
  learnerId: string;
  subjectId: string;
  sessionId: string | null;
  status: "pending" | "completed" | "reviewed";
  observedSummaryVi: string | null;
  supportedSummaryVi: string | null;
  needsObservation: string[];
  suggestedLessons: string[];
  parentReviewRequired: boolean;
  createdAt: number;
  completedAt: number | null;
};

export type BaselineGetResponse = {
  learnerId: string | null;
  baselineLessons: {
    lessonId: string;
    subjectId: string;
    titleVi: string;
    objectiveVi: string;
    expectedDurationMinutes: number;
    approvalStatus: ApprovalStatus;
  }[];
  assessments: BaselineAssessmentDto[];
};

export type EvaluateBaselineRequest = {
  subjectId: string;
  sessionId?: string | null;
  markReviewed?: boolean;
};

export type EvaluateBaselineResponse = {
  assessment: BaselineAssessmentDto;
};

// --- Four-Week Learning Planner -------------------------------------------

export type LearningPlanItemDto = {
  id: string;
  learnerId: string;
  schoolYearLabel: string;
  weekIndex: number;
  dayOfWeek: number;
  scheduledDate: string | null;
  subjectId: string;
  skillId: string | null;
  skillNameVi: string | null;
  lessonId: string | null;
  lessonTitleVi: string | null;
  itemKind: "lesson" | "review" | "baseline";
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  durationMinutes: number;
  parentNote: string | null;
  reasonVi: string;
  updatedAt: number;
};

export type PlannerGetResponse = {
  learnerId: string | null;
  schoolYearLabel: string;
  items: LearningPlanItemDto[];
  summary: {
    todayCount: number;
    upcomingCount: number;
    reviewDueCount: number;
    completedCount: number;
    needsParentReviewCount: number;
  };
};

export type GeneratePlanRequest = {
  schoolYearLabel?: string;
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
};

export type UpdatePlanItemRequest = {
  itemId: string;
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  weekIndex?: number;
  dayOfWeek?: number;
  scheduledDate?: string | null;
  parentNote?: string | null;
};

// --- Session reflection ---------------------------------------------------

export type SessionFeeling = "confident" | "good" | "neutral" | "confused" | "tired";

export type SubmitReflectionRequest = {
  sessionId: string;
  feeling: SessionFeeling;
  noteVi?: string | null;
};

export type SubmitReflectionResponse = {
  id: string;
  sessionId: string;
  feeling: SessionFeeling;
  noteVi: string | null;
};

// --- Errors ---------------------------------------------------------------

export type ApiError = {
  error: string;
  /** Vietnamese, safe to display to the parent. */
  messageVi: string;
  code:
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "bad_request"
    | "rate_limited"
    | "conflict"
    | "server_error";
};
