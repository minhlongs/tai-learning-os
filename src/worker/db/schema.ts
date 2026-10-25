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
  created_at: number;
  updated_at: number;
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
};

export type ReviewApprovalRow = {
  id: string;
  lesson_id: string;
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
