/**
 * Tiếng Anh · Danh từ thông dụng (skill: eng-voc-noun, lớp 3–4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";
import { everydayNounsSteps } from "./everyday-nouns-steps";

export const everydayNouns: LessonDefinition = {
  id: "eng-everyday-nouns",
  subjectId: "english",
  skillId: "eng-voc-noun",
  titleVi: "Những danh từ quanh em",
  titleEn: "Everyday Nouns",
  objectiveVi: "Em sẽ nhận biết và dùng được những danh từ thông dụng xung quanh mình.",
  objectiveEn: "Recognise and use the common nouns around you.",
  gradeFrom: 3,
  gradeTo: 4,
  steps: everydayNounsSteps,
};
