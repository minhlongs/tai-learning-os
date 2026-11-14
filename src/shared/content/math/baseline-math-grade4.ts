/**
 * Toán · Khảo sát năng lực đầu vào Toán Lớp 4 (skill: math-frac-identify, lớp 4)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering core grade-level prerequisites.
 */
import type { LessonDefinition } from "../types";

export const baselineMathGrade4: LessonDefinition = {
  id: "math-baseline-grade4",
  subjectId: "math",
  skillId: "math-frac-identify",
  titleVi: "Khảo sát đầu vào Toán Lớp 4",
  titleEn: "Math Grade 4 Baseline Diagnostic",
  objectiveVi: "Khảo sát nhẹ nhàng khả năng nhận biết phân số và tư duy số học nền tảng.",
  objectiveEn: "Gentle baseline check of fraction identification and foundational numeracy.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-frac-intro",
  provenance: "original_supplemental",
  sourceRef: "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Khảo sát đầu vào để phụ huynh nắm năng lực xuất phát điểm, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Hình tròn chia làm 4 phần bằng nhau, tô màu 1 phần. Phân số chỉ phần tô màu là:",
        question_en: "A circle is divided into 4 equal parts, 1 is shaded. What fraction is shaded?",
        choices: [
          { id: "a", label_vi: "1/4", correct: true },
          { id: "b", label_vi: "4/1", correct: false },
          { id: "c", label_vi: "1/3", correct: false },
          { id: "d", label_vi: "3/4", correct: false },
        ],
        hint1_vi: "Tử số là số phần được tô màu, mẫu số là tổng số phần bằng nhau.",
        hint2_vi: "Có 1 phần tô màu và có tất cả 4 phần đều nhau.",
        hint3_vi: "Viết số phần tô ở trên, gạch ngang rồi viết tổng số phần ở dưới.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hình tròn có 4 phần bằng nhau và 1 phần được tô màu nên phân số chỉ phần tô màu là 1/4. Số 1 là tử số, số 4 là mẫu số.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "fraction_visual",
        question_vi:
          "Thanh bên dưới chia thành 4 phần bằng nhau, có 3 phần được tô màu. Phân số chỉ phần tô màu là gì?",
        question_en: "What fraction of the bar is shaded?",
        allowedDenominators: [2, 4],
        maxParts: 4,
        correctDenominator: 4,
        correctNumerator: 3,
        bar: { parts: 4, highlighted: 3 },
      },
      answerKey: JSON.stringify({ correctNumerator: 3, correctDenominator: 4 }),
      explanationVi: "Thanh có 4 phần đều nhau và có 3 phần được tô màu nên phân số là 3/4.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Mẫu số của phân số 5/8 cho biết điều gì?",
        question_en: "What does the denominator of 5/8 tell us?",
        choices: [
          { id: "a", label_vi: "Số phần đã lấy đi.", correct: false },
          { id: "b", label_vi: "Đơn vị được chia thành 8 phần bằng nhau.", correct: true },
          { id: "c", label_vi: "Số phần còn lại.", correct: false },
          { id: "d", label_vi: "Phép tính cộng 5 và 8.", correct: false },
        ],
        hint1_vi: "Mẫu số là số viết ở dưới gạch ngang.",
        hint2_vi: "Mẫu số luôn biểu thị tổng số phần bằng nhau được chia ra.",
        hint3_vi: "Số 8 ở dưới nghĩa là một cái bánh hay một đơn vị được chia thành 8 phần đều nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "Mẫu số 8 cho biết một đơn vị được chia đều thành 8 phần bằng nhau.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Trong các phân số sau, phân số nào bé hơn 1?",
        question_en: "Which fraction is less than 1?",
        choices: [
          { id: "a", label_vi: "3/4", correct: true },
          { id: "b", label_vi: "5/5", correct: false },
          { id: "c", label_vi: "7/4", correct: false },
          { id: "d", label_vi: "8/3", correct: false },
        ],
        hint1_vi: "Phân số bé hơn 1 khi tử số bé hơn mẫu số.",
        hint2_vi: "Em hãy so sánh số ở trên và số ở dưới của từng phân số.",
        hint3_vi: "3 bé hơn 4 nên 3/4 chưa được 1 đơn vị trọn vẹn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "Phân số 3/4 có tử số (3) bé hơn mẫu số (4) nên phân số này bé hơn 1.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hộp có 10 cái bánh, Nam đã ăn 3 cái. Phân số chỉ số bánh Nam đã ăn là:",
        question_en: "There are 10 cakes in a box, Nam ate 3. What fraction did Nam eat?",
        choices: [
          { id: "a", label_vi: "3/10 hộp bánh", correct: true },
          { id: "b", label_vi: "7/10 hộp bánh", correct: false },
          { id: "c", label_vi: "3/7 hộp bánh", correct: false },
          { id: "d", label_vi: "10/3 hộp bánh", correct: false },
        ],
        hint1_vi: "Hỏi số bánh đã ăn, không phải số bánh còn lại.",
        hint2_vi: "Nam đã ăn 3 cái trong tổng số 10 cái bằng nhau.",
        hint3_vi: "Tử số là 3 (số đã ăn), mẫu số là 10 (tổng số bánh).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "Nam đã ăn 3 cái trong tổng số 10 cái nên phân số chỉ số bánh đã ăn là 3/10 hộp.",
    },
  ],
};
