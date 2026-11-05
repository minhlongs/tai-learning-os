/**
 * Toán 5 · Tỉ số phần trăm (skill: math-percent, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const percentOfNumber: LessonDefinition = {
  id: "math-percent",
  subjectId: "math",
  skillId: "math-percent",
  titleVi: "Tỉ số phần trăm",
  titleEn: "Percentages",
  objectiveVi:
    "Em sẽ hiểu tỉ số phần trăm và tìm được giá trị phần trăm của một số.",
  objectiveEn: "Understand percentages and find a percentage of a number.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-percent",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tính phần trăm giảm giá khi đi mua sắm.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "25% nghĩa là gì?",
        question_en: "What does 25% mean?",
        choices: [
          { id: "a", label_vi: "25 lần một số", correct: false },
          { id: "b", label_vi: "25 phần trong 1 000 phần bằng nhau", correct: false },
          { id: "c", label_vi: "25 trên 10", correct: false },
          { id: "d", label_vi: "25 phần trong 100 phần bằng nhau", correct: true },
        ],
        hint1_vi: "Kí hiệu % đọc là 'phần trăm'.",
        hint2_vi: "Phần trăm luôn so với tổng là 100 phần bằng nhau.",
        hint3_vi: "25% bằng phân số 25/100.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Phần trăm nghĩa là so với 100 phần bằng nhau. 25% tức là 25 phần trong 100 phần, bằng phân số 25/100.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "10% của 200 là bao nhiêu?",
        question_en: "What is 10% of 200?",
        choices: [
          { id: "a", label_vi: "20", correct: true },
          { id: "b", label_vi: "2", correct: false },
          { id: "c", label_vi: "10", correct: false },
          { id: "d", label_vi: "200", correct: false },
        ],
        hint1_vi:
          "“10%” có nghĩa là mười phần trăm, tức một trong mười phần bằng nhau.",
        hint2_vi:
          "Em hãy nghĩ xem để tìm một trong mười phần bằng nhau của một số, em cần thực hiện phép tính nào.",
        hint3_vi: "Hãy lấy 200 rồi tìm giá trị của một trong mười phần bằng nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "10% của 200 là 200 : 10 = 20. Vì 10% bằng một phần mười.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "50% của 80 là bao nhiêu?",
        question_en: "What is 50% of 80?",
        choices: [
          { id: "a", label_vi: "4", correct: false },
          { id: "b", label_vi: "30", correct: false },
          { id: "c", label_vi: "40", correct: true },
          { id: "d", label_vi: "50", correct: false },
        ],
        hint1_vi: "50% bằng một nửa, tức 50/100 = 1/2.",
        hint2_vi: "Một nửa của 80 là bao nhiêu?",
        hint3_vi: "Lấy 80 chia cho 2.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "50% bằng một nửa. Một nửa của 80 là 40, nên 50% của 80 bằng 40.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một lớp có 40 học sinh, trong đó 25% là học sinh giỏi. Lớp có bao nhiêu học sinh giỏi?",
        question_en:
          "A class of 40 has 25% outstanding students. How many are outstanding?",
        choices: [
          { id: "a", label_vi: "4 học sinh", correct: false },
          { id: "b", label_vi: "10 học sinh", correct: true },
          { id: "c", label_vi: "16 học sinh", correct: false },
          { id: "d", label_vi: "25 học sinh", correct: false },
        ],
        hint1_vi: "25% bằng 25/100, tức một phần tư.",
        hint2_vi: "Một phần tư của 40 là bao nhiêu?",
        hint3_vi: "Lấy 40 chia cho 4.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "25% bằng một phần tư. Một phần tư của 40 là 10, nên lớp có 10 học sinh giỏi.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một chiếc áo giá 300 000 đồng, được giảm 20%. Giá sau khi giảm là bao nhiêu?",
        question_en:
          "A shirt costs 300,000 dong and is discounted by 20%. What is the new price?",
        choices: [
          { id: "a", label_vi: "280 000 đồng", correct: false },
          { id: "b", label_vi: "60 000 đồng", correct: false },
          { id: "c", label_vi: "250 000 đồng", correct: false },
          { id: "d", label_vi: "240 000 đồng", correct: true },
        ],
        hint1_vi: "Trước hết tìm 20% của 300 000 là bao nhiêu tiền.",
        hint2_vi: "20% bằng một phần năm. Lấy 300 000 chia cho 5.",
        hint3_vi: "Sau đó lấy giá gốc trừ đi số tiền được giảm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "20% của 300 000 là 300 000 : 5 = 60 000 đồng. Giá sau khi giảm là 300 000 − 60 000 = 240 000 đồng.",
    },
  ],
};
