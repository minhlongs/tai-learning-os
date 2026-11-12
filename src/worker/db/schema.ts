/**
 * Row types mirroring the SQL schema.
 *
 * These are the shapes D1 returns. They are declared here rather than inferred
 * from `any`-typed query results so that a schema/code drift becomes a
 * typecheck error instead of a runtime surprise.
 */

import type { ApprovalStatus, CompetencyState, SessionStatus } from "../../shared/schemas/attempt";

export type ParentRow = {
  id: string;
  password_hash: string;
  display_name: string;
  created_at: number;
  updated_at: number;
};

export type LearnerRow = {
  id: string;
  parent_id: string;
  nickname: string;
  birth_year: number | null;
  grade: number | null;
  timezone: string;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
};

export type SchoolYearRow = {
  id: string;
  learner_id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  grade: number | null;
  created_at: number;
};

export type SubjectRow = {
  id: string;
  name_vi: string;
  name_en: string;
  sort: number;
  active: number;
};

export type SkillRow = {
  id: string;
  subject_id: string;
  code: string;
  name_vi: string;
  name_en: string;
  grade_from: number;
  grade_to: number;
};

export type LessonOwnershipType = "catalogue" | "organization" | "family";
export type LessonPurpose = "official" | "practice";

export type LessonRow = {
  id: string;
  subject_id: string;
  skill_id: string | null;
  title_vi: string;
  title_en: string;
  objective_vi: string;
  objective_en: string;
  grade_from: number;
  grade_to: number;
  version: number;
  ownership_type?: LessonOwnershipType;
  owner_parent_id?: string | null;
  purpose?: LessonPurpose;
  source_lesson_id?: string | null;
  source_version?: number | null;
  created_at: number;
  updated_at: number;
};

export type LessonVersionRow = {
  lesson_id: string;
  version: number;
  title_vi: string;
  title_en: string;
  objective_vi: string;
  objective_en: string;
  created_at: number;
};

export type LessonStepRow = {
  id: string;
  lesson_id: string;
  position: number;
  kind: string;
  content: string;
  answer_key: string;
  explanation_vi: string;
  content_version: number;
  source_step_id?: string | null;
};

export type ReviewApprovalRow = {
  id: string;
  learner_id: string | null;
  lesson_id: string;
  lesson_version: number;
  status: ApprovalStatus;
  decided_by: string;
  decided_at: number;
  note: string | null;
};

export type LearningSessionRow = {
  id: string;
  learner_id: string;
  lesson_id: string;
  lesson_version: number;
  school_year_id: string | null;
  started_at: number;
  ended_at: number | null;
  status: SessionStatus;
  steps_seen: number;
  continuation_deadline: number | null;
  purpose?: LessonPurpose;
};

export type LearningAttemptRow = {
  id: string;
  session_id: string;
  learner_id: string;
  lesson_id: string;
  step_id: string;
  step_version: number;
  skill_id: string | null;
  submitted: string;
  outcome: "correct" | "incorrect" | "partial";
  help_level: number;
  evidence_kind: "observed" | "assisted" | "parent_correction";
  attempt_no: number;
  purpose?: LessonPurpose;
  created_at: number;
};

export type SkillEvidenceRow = {
  id: string;
  learner_id: string;
  skill_id: string;
  state: CompetencyState;
  independent_count: number;
  assisted_count: number;
  correct_count: number;
  last_independent_at: number | null;
  last_observed_at: number | null;
  source: "derived" | "parent_correction";
  correction_note: string | null;
  updated_at: number;
};

export type ReviewScheduleRow = {
  id: string;
  learner_id: string;
  skill_id: string;
  due_at: number;
  interval_days: number;
  last_result: "passed" | "failed" | null;
  last_attempt_at: number | null;
  failure_streak: number;
  created_at: number;
  updated_at: number;
};

/**
 * Layer 2 of the four-layer learner model (ADR-005): one row per (attempt,
 * skill), classifying what that single attempt may be counted as. Append-only —
 * a trigger rejects UPDATE.
 */
export type SkillEvidenceObservationRow = {
  id: string;
  learner_id: string;
  skill_id: string;
  attempt_id: string;
  observed_kind: "independent" | "assisted" | "correction";
  help_level: number;
  attempt_no: number;
  observed_at: number;
  created_at: number;
};

/**
 * Layer 3 of the four-layer learner model (ADR-005): the FSRS-6 memory state as
 * computed at a stated instant from a stated ledger prefix. Derived data —
 * `learning_attempts` remains the authority.
 */
export type SkillEstimateRow = {
  id: string;
  learner_id: string;
  skill_id: string;
  stability: number;
  difficulty: number;
  retrievability_at: number;
  reps: number;
  lapses: number;
  fsrs_state: number;
  scheduled_days: number;
  last_review_at: number | null;
  model_version: string;
  computed_at: number;
  attempt_watermark: string | null;
  attempt_count: number;
  created_at: number;
  updated_at: number;
};

export type LearningGoalRow = {
  id: string;
  learner_id: string;
  subject_id: string | null;
  title_vi: string;
  note: string | null;
  target_date: string | null;
  status: "active" | "paused" | "achieved" | "retired";
  created_at: number;
  updated_at: number;
};

export type AuditEventRow = {
  id: string;
  actor: string;
  action: string;
  subject: string | null;
  detail: string | null;
  created_at: number;
};

export type AuthThrottleRow = {
  key: string;
  scope: "account" | "ip";
  failed_count: number;
  window_started_at: number;
  locked_until: number | null;
  updated_at: number;
};

export type CurriculumObjectiveRow = {
  id: string;
  subject_id: string;
  grade: number;
  code: string;
  title_vi: string;
  description_vi: string;
  skill_id: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  source_ref: string | null;
  created_at: number;
};

export type CurriculumIntakeRow = {
  id: string;
  learner_id: string;
  school_year_label: string;
  grade: number;
  subject_id: string;
  textbook_series: string;
  current_unit: string;
  current_lesson: string;
  weekly_sessions: number;
  session_duration_minutes: number;
  material_reference: string | null;
  learning_goals_vi: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  created_at: number;
  updated_at: number;
};

export type LessonMetadataRow = {
  lesson_id: string;
  objective_id: string | null;
  provenance: "gdpt_2018_objective" | "parent_textbook" | "original_supplemental" | "unverified_assumption";
  source_ref: string | null;
  expected_duration_minutes: number;
  review_recommendation_vi: string | null;
  is_baseline: number;
  updated_at: number;
};

export type BaselineAssessmentRow = {
  id: string;
  learner_id: string;
  subject_id: string;
  session_id: string | null;
  status: "pending" | "completed" | "reviewed";
  observed_summary_vi: string | null;
  supported_summary_vi: string | null;
  needs_observation_json: string;
  suggested_lessons_json: string;
  parent_review_required: number;
  created_at: number;
  completed_at: number | null;
};

export type LearningPlanItemRow = {
  id: string;
  learner_id: string;
  school_year_label: string;
  week_index: number;
  day_of_week: number;
  scheduled_date: string | null;
  subject_id: string;
  skill_id: string | null;
  lesson_id: string | null;
  item_kind: "lesson" | "review" | "baseline" | "practice";
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  duration_minutes: number;
  parent_note: string | null;
  reason_vi: string;
  created_at: number;
  updated_at: number;
};

export type SessionReflectionRow = {
  id: string;
  session_id: string;
  learner_id: string;
  feeling: "confident" | "good" | "neutral" | "confused" | "tired";
  note_vi: string | null;
  created_at: number;
};

export type OrganizationRole = "owner" | "admin" | "teacher";

export type OrganizationRow = {
  id: string;
  slug: string;
  name: string;
  created_at: number;
  updated_at: number;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: number;
  updated_at: number;
};

export type ClassroomRow = {
  id: string;
  organization_id: string;
  name: string;
  grade: number | null;
  subject_id: string | null;
  created_at: number;
  updated_at: number;
};

export type ClassroomTeacherRow = {
  classroom_id: string;
  teacher_id: string;
  created_at: number;
};

export type ConsentStatus = "active" | "revoked";

export type LearnerConsentRow = {
  id: string;
  organization_id: string;
  learner_id: string;
  granted_by: string;
  status: ConsentStatus;
  granted_at: number;
  revoked_at: number | null;
};

export type EnrollmentStatus = "enrolled" | "withdrawn";

export type ClassroomEnrollmentRow = {
  id: string;
  classroom_id: string;
  learner_id: string;
  status: EnrollmentStatus;
  created_at: number;
  updated_at: number;
};

export type CenterReviewStatus = "draft" | "submitted" | "org_approved" | "org_rejected";

export type OrganizationLessonRow = {
  lesson_id: string;
  organization_id: string;
  author_id: string;
  review_status: CenterReviewStatus;
  reviewed_by: string | null;
  reviewed_at: number | null;
  review_note: string | null;
  created_at: number;
  updated_at: number;
};

export type ClassroomLessonAssignmentRow = {
  id: string;
  classroom_id: string;
  lesson_id: string;
  assigned_version: number;
  assigned_by: string;
  assigned_at: number;
  due_at: number | null;
};


