/**
 * Toán 5 · Chu vi và diện tích hình tròn (skill: math-circle, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const circleArea: LessonDefinition = {
  id: "math-circle",
  subjectId: "math",
  skillId: "math-circle",
  titleVi: "Chu vi và diện tích hình tròn",
  titleEn: "Circumference and Area of a Circle",
  objectiveVi:
    "Em sẽ phân biệt bán kính, đường kính và tính được chu vi, diện tích hình tròn.",
  objectiveEn:
    "Distinguish radius from diameter and compute a circle's circumference and area.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-circle",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đo miệng cốc và tính chu vi.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Bán kính bằng mấy lần đường kính?",
        question_en: "How does the radius relate to the diameter?",
        choices: [
          { id: "a", label_vi: "Gấp đôi đường kính", correct: false },
          { id: "b", label_vi: "Bằng một nửa đường kính", correct: true },
          { id: "c", label_vi: "Bằng đường kính", correct: false },
          { id: "d", label_vi: "Bằng một phần tư đường kính", correct: false },
        ],
        hint1_vi: "Đường kính đi qua tâm và nối hai điểm trên đường tròn.",
        hint2_vi: "Bán kính đi từ tâm ra một điểm trên đường tròn.",
        hint3_vi: "Một đường kính dài bằng hai bán kính.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đường kính dài gấp đôi bán kính, nên bán kính bằng một nửa đường kính.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chu vi hình tròn bán kính 1 cm (lấy π = 3,14) là bao nhiêu?",
        question_en:
          "What is the circumference of a circle with radius 1 cm (π = 3.14)?",
        choices: [
          { id: "a", label_vi: "12,56 cm", correct: false },
          { id: "b", label_vi: "3,14 cm", correct: false },
          { id: "c", label_vi: "1,57 cm", correct: false },
          { id: "d", label_vi: "6,28 cm", correct: true },
        ],
        hint1_vi: "Công thức chu vi là đường kính nhân với 3,14.",
        hint2_vi: "Bán kính 1 cm thì đường kính là 2 cm.",
        hint3_vi: "Lấy 2 × 3,14.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi: "Đường kính là 2 cm. Chu vi bằng 2 × 3,14 = 6,28 cm.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Diện tích hình tròn bán kính 2 cm (lấy π = 3,14) là bao nhiêu?",
        question_en:
          "What is the area of a circle with radius 2 cm (π = 3.14)?",
        choices: [
          { id: "a", label_vi: "12,56 cm²", correct: true },
          { id: "b", label_vi: "3,14 cm²", correct: false },
          { id: "c", label_vi: "6,28 cm²", correct: false },
          { id: "d", label_vi: "25,12 cm²", correct: false },
        ],
        hint1_vi:
          "Công thức diện tích là bán kính nhân bán kính rồi nhân 3,14.",
        hint2_vi: "Trước hết tính 2 × 2.",
        hint3_vi: "Sau đó lấy 4 × 3,14.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Diện tích bằng bán kính × bán kính × 3,14 = 2 × 2 × 3,14 = 12,56 cm².",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hình tròn có đường kính 10 cm. Chu vi của nó là bao nhiêu (lấy π = 3,14)?",
        question_en:
          "A circle has a diameter of 10 cm. What is its circumference (π = 3.14)?",
        choices: [
          { id: "a", label_vi: "62,8 cm", correct: false },
          { id: "b", label_vi: "15,7 cm", correct: false },
          { id: "c", label_vi: "31,4 cm", correct: true },
          { id: "d", label_vi: "314 cm", correct: false },
        ],
        hint1_vi: "Đề đã cho đường kính, không cần nhân đôi nữa.",
        hint2_vi: "Chu vi bằng đường kính nhân 3,14.",
        hint3_vi: "Lấy 10 × 3,14.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi: "Chu vi bằng đường kính × 3,14 = 10 × 3,14 = 31,4 cm.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hình tròn có bán kính 5 cm. Diện tích của nó là bao nhiêu (lấy π = 3,14)?",
        question_en:
          "A circle has a radius of 5 cm. What is its area (π = 3.14)?",
        choices: [
          { id: "a", label_vi: "31,4 cm²", correct: false },
          { id: "b", label_vi: "15,7 cm²", correct: false },
          { id: "c", label_vi: "157 cm²", correct: false },
          { id: "d", label_vi: "78,5 cm²", correct: true },
        ],
        hint1_vi: "Diện tích dùng bán kính, không dùng đường kính.",
        hint2_vi: "Tính 5 × 5 trước.",
        hint3_vi: "Lấy 25 × 3,14.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi: "Diện tích bằng 5 × 5 × 3,14 = 25 × 3,14 = 78,5 cm².",
    },
  ],
};
