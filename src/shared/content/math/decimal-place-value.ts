/**
 * Toán 5 · Hàng và giá trị của số thập phân (skill: math-dec-place-value, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const decimalPlaceValue: LessonDefinition = {
  id: "math-dec-place-value",
  subjectId: "math",
  skillId: "math-dec-place-value",
  titleVi: "Hàng và giá trị của số thập phân",
  titleEn: "Place Value in Decimals",
  objectiveVi:
    "Em sẽ đọc, viết số thập phân và biết mỗi chữ số đứng ở hàng nào.",
  objectiveEn:
    "Read and write decimal numbers and identify the place of each digit.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-dec-place",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đọc giá tiền có số thập phân.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong số 3,47 chữ số 4 thuộc hàng nào?",
        question_en: "In 3.47, which place is the digit 4 in?",
        choices: [
          { id: "a", label_vi: "Hàng phần mười", correct: true },
          { id: "b", label_vi: "Hàng đơn vị", correct: false },
          { id: "c", label_vi: "Hàng chục", correct: false },
          { id: "d", label_vi: "Hàng phần trăm", correct: false },
        ],
        hint1_vi:
          "Dấu phẩy tách phần nguyên bên trái và phần thập phân bên phải.",
        hint2_vi: "Em hãy đếm xem chữ số 4 là chữ số thứ mấy sau dấu phẩy.",
        hint3_vi: "Đọc lần lượt sau dấu phẩy: phần mười, rồi đến phần trăm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sau dấu phẩy, chữ số đầu tiên là hàng phần mười. Trong 3,47 chữ số 4 đứng ngay sau dấu phẩy nên thuộc hàng phần mười.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Chữ số 7 trong số 12,507 có giá trị là bao nhiêu?",
        question_en: "What is the value of the digit 7 in 12.507?",
        choices: [
          { id: "a", label_vi: "0,7", correct: false },
          { id: "b", label_vi: "0,07", correct: false },
          { id: "c", label_vi: "7", correct: false },
          { id: "d", label_vi: "0,007", correct: true },
        ],
        hint1_vi: "Đếm xem chữ số 7 đứng ở hàng thứ mấy sau dấu phẩy.",
        hint2_vi: "Hàng thứ ba sau dấu phẩy là hàng phần nghìn.",
        hint3_vi: "Một phần nghìn được viết là 0,001.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Trong 12,507 chữ số 7 đứng ở hàng phần nghìn, nên giá trị của nó là bảy phần nghìn, viết là 0,007.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Số 5,06 được đọc như thế nào?",
        question_en: "How do you read 5.06?",
        choices: [
          { id: "a", label_vi: "Năm phẩy sáu mươi", correct: false },
          { id: "b", label_vi: "Năm phẩy sáu", correct: false },
          { id: "c", label_vi: "Năm phẩy không sáu", correct: true },
          { id: "d", label_vi: "Năm mươi sáu", correct: false },
        ],
        hint1_vi: "Đọc phần nguyên trước, rồi đọc 'phẩy'.",
        hint2_vi: "Sau dấu phẩy, đọc từng chữ số theo thứ tự.",
        hint3_vi: "Chữ số 0 vẫn phải đọc là 'không'.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Phần nguyên là 5, đọc 'năm'. Sau dấu phẩy có 0 rồi 6, đọc là 'không sáu'. Vậy 5,06 đọc là 'năm phẩy không sáu'.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Số 'hai phẩy ba trăm linh năm' được viết là số nào?",
        question_en: "Which number is 'two point three hundred and five'?",
        choices: [
          { id: "a", label_vi: "2,35", correct: false },
          { id: "b", label_vi: "2,305", correct: true },
          { id: "c", label_vi: "23,05", correct: false },
          { id: "d", label_vi: "2,503", correct: false },
        ],
        hint1_vi: "Phần nguyên 'hai' viết trước dấu phẩy.",
        hint2_vi: "Sau dấu phẩy phải có đủ ba chữ số ứng với ba trăm linh năm.",
        hint3_vi: "'Ba trăm linh năm' viết là 305, giữ đủ số 0 ở giữa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Phần nguyên là 2. Phần thập phân 'ba trăm linh năm' viết là 305, nên số cần viết là 2,305.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Trong số 8,246 chữ số nào đứng ở hàng phần trăm?",
        question_en: "In 8.246, which digit is in the hundredths place?",
        choices: [
          { id: "a", label_vi: "2", correct: false },
          { id: "b", label_vi: "6", correct: false },
          { id: "c", label_vi: "8", correct: false },
          { id: "d", label_vi: "4", correct: true },
        ],
        hint1_vi: "Hàng phần trăm là hàng thứ hai sau dấu phẩy.",
        hint2_vi:
          "Đếm sau dấu phẩy: thứ nhất là phần mười, thứ hai là phần trăm.",
        hint3_vi: "Chữ số ở vị trí thứ hai sau dấu phẩy chính là đáp án.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Sau dấu phẩy, chữ số 2 ở hàng phần mười, chữ số 4 ở hàng phần trăm, chữ số 6 ở hàng phần nghìn. Vậy hàng phần trăm là chữ số 4.",
    },
  ],
};
