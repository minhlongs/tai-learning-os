/**
 * Toán 5 · Cộng và trừ số thập phân (skill: math-dec-add-sub, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const decimalAddSubtract: LessonDefinition = {
  id: "math-dec-add-sub",
  subjectId: "math",
  skillId: "math-dec-add-sub",
  titleVi: "Cộng và trừ số thập phân",
  titleEn: "Adding and Subtracting Decimals",
  objectiveVi:
    "Em sẽ đặt tính đúng và thực hiện được phép cộng, trừ số thập phân.",
  objectiveEn:
    "Line up decimals correctly and add or subtract decimal numbers.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-dec-ops",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng bài toán tính tiền mua hàng.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Khi cộng 2,5 với 1,25 em cần đặt tính như thế nào?",
        question_en: "How should you line up 2.5 and 1.25 for addition?",
        choices: [
          { id: "a", label_vi: "Thẳng chữ số tận cùng bên phải", correct: false },
          { id: "b", label_vi: "Thẳng chữ số đầu tiên bên trái", correct: false },
          { id: "c", label_vi: "Thẳng dấu phẩy với nhau", correct: true },
          { id: "d", label_vi: "Không cần đặt tính", correct: false },
        ],
        hint1_vi: "Các hàng giống nhau phải đứng thẳng cột.",
        hint2_vi: "Dấu phẩy đánh dấu ranh giới phần nguyên và phần thập phân.",
        hint3_vi:
          "Nếu hai số có số chữ số sau dấu phẩy khác nhau, em thêm số 0 cho đủ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Muốn cộng đúng, các chữ số cùng hàng phải thẳng cột. Cách dễ nhất là đặt thẳng dấu phẩy, rồi bổ sung số 0 ở cuối cho đủ hàng.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 2,5 + 1,25 là bao nhiêu?",
        question_en: "What is 2.5 + 1.25?",
        choices: [
          { id: "a", label_vi: "2,70", correct: false },
          { id: "b", label_vi: "3,75", correct: true },
          { id: "c", label_vi: "3,30", correct: false },
          { id: "d", label_vi: "3,7", correct: false },
        ],
        hint1_vi: "Viết 2,5 thành 2,50 để có hai chữ số sau dấu phẩy.",
        hint2_vi: "Cộng phần trăm trước: 0 + 5.",
        hint3_vi: "Sau đó cộng hàng phần mười rồi đến hàng đơn vị.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "2,5 viết thành 2,50. Cộng theo hàng: 0 + 5 = 5 ở phần trăm, 5 + 2 = 7 ở phần mười, 2 + 1 = 3 ở phần nguyên. Kết quả là 3,75.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 5,6 − 2,35 là bao nhiêu?",
        question_en: "What is 5.6 − 2.35?",
        choices: [
          { id: "a", label_vi: "3,25", correct: true },
          { id: "b", label_vi: "3,45", correct: false },
          { id: "c", label_vi: "3,35", correct: false },
          { id: "d", label_vi: "2,25", correct: false },
        ],
        hint1_vi: "Viết 5,6 thành 5,60 rồi đặt thẳng dấu phẩy.",
        hint2_vi: "Trừ từ hàng phần trăm: 0 − 5 phải mượn 1 từ hàng phần mười.",
        hint3_vi: "Sau khi mượn, hàng phần trăm là 10 − 5.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "5,6 viết thành 5,60. Trừ theo hàng: 10 − 5 = 5 ở phần trăm (mượn 1), 5 − 3 = 2 ở phần mười, 5 − 2 = 3 ở phần nguyên. Kết quả là 3,25.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một chai đầy nước nặng 1,25 kg. Vỏ chai rỗng nặng 0,3 kg. Nước trong chai nặng bao nhiêu?",
        question_en:
          "A full bottle weighs 1.25 kg and the empty bottle weighs 0.3 kg. How much does the water weigh?",
        choices: [
          { id: "a", label_vi: "1,55 kg", correct: false },
          { id: "b", label_vi: "0,85 kg", correct: false },
          { id: "c", label_vi: "1,22 kg", correct: false },
          { id: "d", label_vi: "0,95 kg", correct: true },
        ],
        hint1_vi: "Cân nặng nước bằng cân nặng cả chai trừ đi vỏ chai.",
        hint2_vi: "Viết 0,3 thành 0,30 trước khi trừ.",
        hint3_vi: "Thực hiện 1,25 − 0,30.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi: "Nước nặng bằng cả chai trừ vỏ: 1,25 − 0,30 = 0,95 kg.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 7 − 2,5 là bao nhiêu?",
        question_en: "What is 7 − 2.5?",
        choices: [
          { id: "a", label_vi: "5,5", correct: false },
          { id: "b", label_vi: "4,5", correct: true },
          { id: "c", label_vi: "4,05", correct: false },
          { id: "d", label_vi: "4,95", correct: false },
        ],
        hint1_vi: "Viết số 7 thành 7,0 để cùng hàng với 2,5.",
        hint2_vi: "Đặt thẳng dấu phẩy rồi trừ như số tự nhiên.",
        hint3_vi: "7,0 − 2,5: hàng phần mười 0 − 5 phải mượn 1.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "7 viết thành 7,0. Trừ: 10 − 5 = 5 ở phần mười (mượn 1), 6 − 2 = 4 ở phần nguyên. Kết quả là 4,5.",
    },
  ],
};
