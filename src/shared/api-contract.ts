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
  parentId?: string | null;
  parentDisplayName: string | null;
  /** Learner the parent manages, or null when none is enrolled yet. */
  learner: { id: string; nickname: string } | null;
  /** All active learners enrolled under this parent account. */
  learners?: { id: string; nickname: string; grade: number | null }[];
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

export type LessonOwnershipTypeContract = "catalogue" | "organization" | "family";
export type LessonPurposeContract = "official" | "practice";
export type LessonOwnershipType = LessonOwnershipTypeContract;
export type LessonPurpose = LessonPurposeContract;

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
    /** Approved lesson matching this skill, if one is currently available to the learner. */
    lessonId?: string | null;
    lessonTitleVi?: string | null;
  }[];
  /** The lesson the learner can continue, if a session is in progress. */
  continueLesson: {
    sessionId: string;
    lessonId: string;
    titleVi: string;
    subjectId: string;
    stepPosition: number;
    purpose?: LessonPurposeContract;
  } | null;
  completedSessions: {
    sessionId: string;
    lessonTitleVi: string;
    subjectId: string;
    completedAt: number;
    correctCount: number;
    attemptedCount: number;
    purpose?: LessonPurposeContract;
  }[];
};

// --- Lesson session --------------------------------------------------------

export type StartSessionRequest = { lessonId: string };

export type StartSessionResponse = {
  sessionId: string;
  lessonId: string;
  lessonTitleVi: string;
  subjectId: string;
  purpose?: LessonPurposeContract;
  ownershipType?: LessonOwnershipTypeContract;
  steps: LessonStepPayload[];
  /** Server-tracked session timing budget for Grade 4–5 Soft Stop (Gate G9). */
  sessionBudget?: {
    applies: boolean;
    startedAt: number;
    budgetMs: number;
    remainingMs: number;
    extensionCount: number;
    reached: boolean;
  };
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

export type RequestHintRequest = {
  stepId: string;
  /** The session the learner is working in. Required: a disclosure is recorded against it. */
  sessionId: string;
  currentLevel: number;
};
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
  purpose?: LessonPurposeContract;
  /** Gate G9 Soft Stop: true when the 25-minute session cap was reached on this submission. */
  sessionTimeBudgetReached?: boolean;
  remainingSessionMs?: number;
};

export type ExtendSessionTimeRequest = {
  sessionId?: string;
  learnerId?: string;
  password: string;
};

export type ExtendSessionTimeResponse = {
  ok: true;
  sessionId: string | null;
  extensionCount: number;
  addedMinutes: number;
  budgetMs: number | null;
  restOverridden: boolean;
};

export type FinalizeSessionRequest = { sessionId: string };
export type FinalizeSessionResponse = {
  sessionId: string;
  status: SessionStatus;
  purpose?: LessonPurposeContract;
  summary: SessionSummary;
};

export type SessionSummary = {
  attemptedCount: number;
  correctCount: number;
  /** Attempts where help level was 3 or 4. */
  assistedCount: number;
  /** Distinct hint levels used. */
  maxHelpLevel: number;
  stepsCompleted: number;
  purpose?: LessonPurposeContract;
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
    practiceSessionCount?: number;
    practiceAttemptCount?: number;
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
    purpose?: LessonPurposeContract;
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
    note?: string | null;
    targetDate?: string | null;
  }[];
  needsAttention: { skillId: string; skillNameVi: string; reasonVi: string }[];
  /**
   * Deterministic prerequisite-graph recommendations for the parent.
   * Derived from `skills`, `skill_prerequisites`, `skill_evidence`, `lessons`, and approvals.
   * A recommendation names the skill, its current evidence state, the matched lesson with its
   * approval status, and the reason — it never claims a mastery the evidence does not support.
   */
  recommendedNextLessons: {
    skillId: string;
    skillNameVi: string;
    subjectId: string;
    state: CompetencyState;
    recommendationKind: "prerequisite_gap" | "unlocked_next" | "reinforce_supported";
    prerequisiteSkillIds: string[];
    prerequisiteNamesVi: string[];
    lessonId: string | null;
    lessonTitleVi: string | null;
    lessonVersion: number | null;
    approvalStatus: ApprovalStatus;
    reasonVi: string;
  }[];
  /**
   * School-year history for this learner with longitudinal evidence summaries.
   * Sessions, attempts, and competency evidence are never rewritten when a new school year starts.
   */
  schoolYears: {
    id: string;
    label: string;
    grade: number | null;
    startsOn: string;
    endsOn: string;
    isActive: boolean;
    sessionCount: number;
    completedSessionCount: number;
    attemptCount: number;
    independentAttemptCount: number;
  }[];
};

/** What a parent sends to transition a learner into a new school year. */
export type SchoolYearTransitionRequest = {
  learnerId?: string;
  label: string;
  grade: number;
  startsOn?: string;
  endsOn?: string;
};

/** The school year that was created (or reused on conflict) plus the learner's updated grade. */
export type SchoolYearTransitionResponse = {
  learnerId: string;
  schoolYear: {
    id: string;
    label: string;
    grade: number | null;
    startsOn: string;
    endsOn: string;
    isActive: boolean;
    sessionCount: number;
    completedSessionCount: number;
    attemptCount: number;
    independentAttemptCount: number;
  };
};

export type GoalStatus = "active" | "paused" | "achieved" | "retired";

export type ParentGoalDto = {
  id: string;
  learnerId: string;
  titleVi: string;
  subjectId: string | null;
  status: GoalStatus;
  note: string | null;
  targetDate: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CreateGoalRequest = {
  learnerId?: string;
  titleVi: string;
  subjectId?: string | null;
  note?: string | null;
  targetDate?: string | null;
};

export type CreateGoalResponse = {
  goal: ParentGoalDto;
};

export type UpdateGoalStatusRequest = {
  learnerId?: string;
  goalId: string;
  status: GoalStatus;
  note?: string | null;
};

export type UpdateGoalStatusResponse = {
  goal: ParentGoalDto;
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
      purpose?: LessonPurposeContract;
      ownershipType?: LessonOwnershipTypeContract;
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
    ownershipType?: LessonOwnershipTypeContract;
    ownerParentId?: string | null;
    purpose?: LessonPurposeContract;
    sourceLessonId?: string | null;
    sourceVersion?: number | null;
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
  ownershipType?: LessonOwnershipTypeContract;
  ownerParentId?: string | null;
  purpose?: LessonPurposeContract;
  sourceLessonId?: string | null;
  sourceVersion?: number | null;
  steps: {
    id: string;
    position: number;
    kind: LessonStepKind;
    content: ExerciseSpec;
    explanationVi: string;
    answerKey: unknown;
    sourceStepId?: string | null;
  }[];
};

export type ForkLessonRequest = {
  sourceLessonId: string;
  sourceVersion?: number;
  titleVi?: string;
  objectiveVi?: string;
};

export type ForkLessonResponse = {
  lessonId: string;
  version: number;
  ownershipType: "family";
  purpose: "practice";
  sourceLessonId: string;
  sourceVersion: number;
  titleVi: string;
  lesson: LessonDetailResponse;
};

export type SetApprovalRequest = {
  lessonId: string;
  status: ApprovalStatus;
  note?: string;
  learnerId?: string;
  version?: number;
};
export type SetApprovalResponse = { lessonId: string; status: ApprovalStatus; learnerId?: string; version?: number };

export type UpdateContentRequest = {
  lessonId: string;
  expectedVersion?: number;
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
    sourceStepId?: string | null;
  }[];
};
export type UpdateContentResponse = { lessonId: string; version: number };

export type CorrectSkillRequest = {
  skillId: string;
  state: CompetencyState;
  note: string;
  learnerId?: string;
};

export type CorrectSkillResponse = {
  skillId: string;
  state: CompetencyState;
  learnerId?: string;
};

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

export type ExportPortabilityResponse = {
  exportedAt: number;
  manifest: {
    learners: number;
    skills: number;
    objectives: number;
    achievements: number;
    sessions: number;
    attempts: number;
    xapiStatements: number;
    formats: {
      clr: string;
      case: string;
      xapi: string;
    };
    exportedAtIso: string;
  };
  clr20: unknown;
  case11: unknown;
  xapi20Jsonl: string;
  viewerHtml: string;
};

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
  learnerId?: string;
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
  learnerId?: string;
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
  itemKind: "lesson" | "review" | "baseline" | "practice";
  purpose?: LessonPurposeContract;
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
  availablePracticeLessons?: {
    id: string;
    subjectId: string;
    skillId: string | null;
    titleVi: string;
    version: number;
    approvalStatus?: ApprovalStatus;
  }[];
  summary: {
    todayCount: number;
    upcomingCount: number;
    reviewDueCount: number;
    completedCount: number;
    needsParentReviewCount: number;
  };
};

export type GeneratePlanRequest = {
  learnerId?: string;
  schoolYearLabel?: string;
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
};

export type SchedulePracticePlanItemRequest = {
  learnerId?: string;
  schoolYearLabel?: string;
  lessonId: string;
  weekIndex: number;
  dayOfWeek: number;
  scheduledDate?: string | null;
  durationMinutes?: number;
  parentNote?: string | null;
};

export type UpdatePlanItemRequest = {
  learnerId?: string;
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

// --- Organization & Consent Grants ----------------------------------------

export type OrganizationRoleContract = "owner" | "admin" | "teacher";
export type ConsentStatusContract = "active" | "revoked";
export type EnrollmentStatusContract = "enrolled" | "withdrawn";

export type CreateOrganizationRequest = {
  slug: string;
  name: string;
};

export type CreateOrganizationResponse = {
  organization: {
    id: string;
    slug: string;
    name: string;
    createdAt: number;
  };
};

export type MemberOrganizationListResponse = {
  organizations: {
    id: string;
    slug: string;
    name: string;
    role: OrganizationRoleContract;
    createdAt: number;
  }[];
};

export type ConsentedOrgLearnersResponse = {
  learners: {
    id: string;
    nickname: string;
    grade: number | null;
    grantedAt: number;
  }[];
};

export type OrganizationLessonListResponse = {
  lessons: {
    lessonId: string;
    organizationId: string;
    authorId: string;
    authorDisplayName: string;
    subjectId: string;
    skillId: string | null;
    titleVi: string;
    objectiveVi: string;
    gradeFrom: number;
    gradeTo: number;
    stepCount: number;
    reviewStatus: CenterReviewStatusContract;
    reviewNote: string | null;
    createdAt: number;
    updatedAt: number;
  }[];
};

export type AddOrganizationMemberRequest = {
  organizationId: string;
  userId: string;
  role: OrganizationRoleContract;
};

export type AddOrganizationMemberResponse = {
  success: boolean;
};

export type OrganizationMemberListResponse = {
  members: {
    id: string;
    userId: string;
    displayName: string;
    role: OrganizationRoleContract;
    createdAt: number;
  }[];
};

export type CreateClassroomRequest = {
  organizationId: string;
  name: string;
  grade?: number | null;
  subjectId?: string | null;
};

export type CreateClassroomResponse = {
  classroom: {
    id: string;
    organizationId: string;
    name: string;
    grade: number | null;
    subjectId: string | null;
    createdAt: number;
  };
};

export type ClassroomListResponse = {
  classrooms: {
    id: string;
    organizationId: string;
    name: string;
    grade: number | null;
    subjectId: string | null;
    createdAt: number;
  }[];
};

export type AssignClassroomTeacherRequest = {
  classroomId: string;
  teacherId: string;
};

export type AssignClassroomTeacherResponse = {
  success: boolean;
};

export type EnrollLearnerRequest = {
  classroomId: string;
  learnerId: string;
};

export type EnrollLearnerResponse = {
  success: boolean;
  enrollmentId: string;
};

export type GrantLearnerConsentRequest = {
  organizationId: string;
  learnerId: string;
};

export type GrantLearnerConsentResponse = {
  id: string;
  organizationId: string;
  learnerId: string;
  status: ConsentStatusContract;
  grantedAt: number;
};

export type RevokeLearnerConsentRequest = {
  organizationId: string;
  learnerId: string;
};

export type RevokeLearnerConsentResponse = {
  success: boolean;
  revokedAt: number;
};

export type LearnerConsentListResponse = {
  consents: {
    id: string;
    organizationId: string;
    organizationName: string;
    learnerId: string;
    status: ConsentStatusContract;
    grantedAt: number;
    revokedAt: number | null;
  }[];
};

export type ClassroomLearnersResponse = {
  learners: {
    id: string;
    nickname: string;
    grade: number | null;
    enrolledAt: number;
  }[];
};

// --- M2: Teacher Lesson Authoring & Classroom Assignments -----------------

export type CenterReviewStatusContract = "draft" | "submitted" | "org_approved" | "org_rejected";

export type CreateDraftLessonStep = {
  position: number;
  kind: LessonStepKind;
  content: ExerciseSpec;
  answerKey: unknown;
  explanationVi: string;
};

export type CreateOrgLessonRequest = {
  organizationId: string;
  subjectId: string;
  skillId?: string | null;
  titleVi: string;
  titleEn?: string;
  objectiveVi: string;
  objectiveEn?: string;
  gradeFrom: number;
  gradeTo: number;
  steps: CreateDraftLessonStep[];
};

export type CreateOrgLessonResponse = {
  lessonId: string;
  organizationId: string;
  reviewStatus: CenterReviewStatusContract;
};

export type SubmitOrgLessonReviewRequest = {
  lessonId: string;
  organizationId: string;
};

export type SubmitOrgLessonReviewResponse = {
  success: boolean;
  reviewStatus: "submitted";
};

export type ReviewOrgLessonRequest = {
  lessonId: string;
  organizationId: string;
  decision: "org_approved" | "org_rejected";
  note?: string;
};

export type ReviewOrgLessonResponse = {
  success: boolean;
  reviewStatus: "org_approved" | "org_rejected";
};

export type AssignClassroomLessonRequest = {
  classroomId: string;
  lessonId: string;
  dueAt?: number | null;
};

export type AssignClassroomLessonResponse = {
  success: boolean;
  assignmentId: string;
  assignedVersion?: number;
};

export type ClassroomLessonListResponse = {
  lessons: {
    lessonId: string;
    classroomId: string;
    titleVi: string;
    subjectId: string;
    gradeFrom: number;
    gradeTo: number;
    assignedVersion?: number;
    assignedAt: number;
    dueAt: number | null;
    isParentApproved: boolean;
  }[];
};

export type ClassroomLearnerProgressItem = {
  learnerId: string;
  learnerNickname: string;
  learnerGrade: number | null;
  lessonId: string;
  lessonTitleVi: string;
  subjectId: string;
  assignedVersion: number;
  assignedAt: number;
  dueAt: number | null;
  parentApprovalStatus: ApprovalStatus;
  isParentApproved: boolean;
  completedSessionCount: number;
  lastCompletedAt: number | null;
};

export type ClassroomLearnerSummaryItem = {
  id: string;
  learnerId: string;
  nickname: string;
  grade: number | null;
  enrolledAt: number;
  assignedCount: number;
  parentApprovedCount: number;
  completedCount: number;
};

export type ClassroomProgressResponse = {
  classroomId: string;
  classroomName?: string;
  organizationId: string;
  assignedLessonCount: number;
  learners: ClassroomLearnerSummaryItem[];
  assignments: {
    lessonId: string;
    titleVi: string;
    subjectId: string;
    assignedVersion: number;
    assignedAt: number;
    dueAt: number | null;
  }[];
  progress: ClassroomLearnerProgressItem[];
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
