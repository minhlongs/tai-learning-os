/**
 * Lesson container types.
 *
 * Lessons live in TypeScript (not SQL) so the payload can be typechecked
 * against `ExerciseSpec` before it ever reaches the database. The seed script
 * walks `LESSONS` and writes each step as TEXT — hence `answerKey` is a JSON
 * string here, mirroring the JSON columns it will be stored in.
 */

import type { ExerciseSpec } from "../schemas/exercise";
import type { LessonStepKind } from "../schemas/attempt";

/** One teaching step. `position` is 1-based and must have no gaps. */
export type LessonStep = {
  position: number;
  kind: LessonStepKind;
  /** Validated by `validateExercise` at seed time. */
  content: ExerciseSpec;
  /** JSON string: the expected answer, e.g. `{"correctChoiceId":"a"}`. */
  answerKey: string;
  explanationVi: string;
};

export type SubjectId = "math" | "english" | "vietnamese" | "science" | "debate";

export type CurriculumProvenance =
  | "gdpt_2018_objective"
  | "parent_textbook"
  | "original_supplemental"
  | "unverified_assumption";

export type LessonDefinition = {
  id: string;
  subjectId: SubjectId;
  /** Must be an id from migrations/0002_reference_content.sql. */
  skillId: string;
  titleVi: string;
  titleEn: string;
  objectiveVi: string;
  objectiveEn: string;
  gradeFrom: number;
  gradeTo: number;
  /** Linked GDPT 2018 or supplemental objective ID from `curriculum_objectives`. */
  objectiveId?: string;
  /** Content provenance classification. */
  provenance?: CurriculumProvenance;
  /** Citation or textbook source note. */
  sourceRef?: string;
  /** Expected duration in minutes (default 20). */
  expectedDurationMinutes?: number;
  /** Parent/learner spaced-review recommendation in Vietnamese. */
  reviewRecommendationVi?: string;
  /** True when this lesson is a parent-supervised baseline assessment. */
  isBaseline?: boolean;
  steps: LessonStep[];
};
