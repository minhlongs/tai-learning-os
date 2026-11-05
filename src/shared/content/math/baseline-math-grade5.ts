/**
 * Toán · Khảo sát năng lực đầu vào Toán Lớp 5 (skill: math-dec-place-value, lớp 5)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering core grade-level prerequisites.
 */
import type { LessonDefinition } from "../types";

export const baselineMathGrade5: LessonDefinition = {
  id: "math-baseline-grade5",
  subjectId: "math",
  skillId: "math-dec-place-value",
  titleVi: "Khảo sát đầu vào Toán Lớp 5",
  titleEn: "Math Grade 5 Baseline Diagnostic",
  objectiveVi:
    "Khảo sát nhẹ nhàng khả năng đọc viết số thập phân và hiểu phân số nền tảng.",
  objectiveEn:
    "Gentle baseline check of decimal reading/writing and foundational fraction sense.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-dec-place",
  provenance: "original_supplemental",
  sourceRef:
    "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Khảo sát đầu vào để phụ huynh nắm năng lực xuất phát điểm, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Dấu phẩy trong số thập phân có tác dụng gì?",
        question_en: "What does the decimal point do in a decimal number?",
        choices: [
          { id: "a", label_vi: "Phân chia hai số cần nhân với nhau", correct: false },
          { id: "b", label_vi: "Cho biết kết quả đang bị làm tròn", correct: false },
          { id: "c", label_vi: "Chỉ dùng để viết số đo cân nặng", correct: false },
          {
            id: "d",
            label_vi: "Ngăn cách phần nguyên và phần thập phân",
            correct: true,
          },
        ],
        hint1_vi: "Nhìn vào số 3,47: bên trái dấu phẩy là phần nguyên.",
        hint2_vi: "Bên phải dấu phẩy là các hàng nhỏ hơn một đơn vị.",
        hint3_vi: "Dấu phẩy là ranh giới giữa phần nguyên và phần thập phân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Dấu phẩy ngăn cách phần nguyên bên trái và phần thập phân bên phải. Trong 3,47 thì 3 là phần nguyên, 47 là hai chữ số của phần thập phân.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong số 6,2 chữ số 2 thuộc hàng nào?",
        question_en: "In 6.2, which place is the digit 2 in?",
        choices: [
          { id: "a", label_vi: "Hàng phần mười", correct: true },
          { id: "b", label_vi: "Hàng phần trăm", correct: false },
          { id: "c", label_vi: "Hàng đơn vị", correct: false },
          { id: "d", label_vi: "Hàng chục", correct: false },
        ],
        hint1_vi: "Em hãy đọc lại số 6,2 và tìm xem chữ số 2 đứng ở đâu so với dấu phẩy.",
        hint2_vi: "Các hàng nhỏ hơn đơn vị nằm về bên phải dấu phẩy, xếp theo thứ tự từ trái sang phải.",
        hint3_vi: "Trong 6,2 chỉ có một chữ số sau dấu phẩy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sau dấu phẩy, chữ số đầu tiên nằm ở hàng phần mười. Trong 6,2 chữ số 2 đứng ngay sau dấu phẩy nên thuộc hàng phần mười.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Phân số 3/5 viết thành số thập phân là bao nhiêu?",
        question_en: "What is 3/5 written as a decimal?",
        choices: [
          { id: "a", label_vi: "0,35", correct: false },
          { id: "b", label_vi: "0,6", correct: true },
          { id: "c", label_vi: "0,3", correct: false },
          { id: "d", label_vi: "3,5", correct: false },
        ],
        hint1_vi: "Muốn có mẫu số 10, nhân cả tử và mẫu với cùng một số.",
        hint2_vi: "5 nhân 2 được 10, nên tử số 3 cũng nhân 2.",
        hint3_vi: "3 × 2 = 6 nên 3/5 bằng 6/10, viết là 0,6.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Nhân cả tử và mẫu của 3/5 với 2 được 6/10. Phân số có mẫu số 10 viết thành số thập phân có một chữ số sau dấu phẩy là 0,6.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Số nào lớn hơn: 0,8 hay 0,75?",
        question_en: "Which is larger: 0.8 or 0.75?",
        choices: [
          { id: "a", label_vi: "0,75", correct: false },
          { id: "b", label_vi: "Hai số bằng nhau", correct: false },
          { id: "c", label_vi: "Không so sánh được", correct: false },
          { id: "d", label_vi: "0,8", correct: true },
        ],
        hint1_vi: "Viết thêm số 0 cho hai số có cùng số chữ số sau dấu phẩy.",
        hint2_vi: "Khi hai số có cùng số chữ số sau dấu phẩy, em hãy xét từng hàng từ trái sang phải.",
        hint3_vi: "So sánh 80 và 75 ở hàng phần trăm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Viết 0,8 thành 0,80. Ở hàng phần trăm, 80 lớn hơn 75 nên 0,8 lớn hơn 0,75.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một vỏ chai rỗng nặng 0,24 kg, đầy nước nặng 1,15 kg. Nước trong chai nặng bao nhiêu?",
        question_en:
          "An empty bottle weighs 0.24 kg and full of water weighs 1.15 kg. How much does the water weigh?",
        choices: [
          { id: "a", label_vi: "0,81 kg", correct: false },
          { id: "b", label_vi: "1,39 kg", correct: false },
          { id: "c", label_vi: "0,91 kg", correct: true },
          { id: "d", label_vi: "0,71 kg", correct: false },
        ],
        hint1_vi:
          "Nước nặng bằng trọng lượng cả chai trừ đi trọng lượng vỏ chai.",
        hint2_vi: "Đặt thẳng dấu phẩy: 1,15 − 0,24.",
        hint3_vi:
          "Mượn 1 phần mười thành 10 phần trăm: 15 − 4 = 11, viết 1 và nhớ 1.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nước nặng bằng 1,15 − 0,24 = 0,91 kg. Ở hàng phần trăm, mượn 1 phần mười để có 15 phần trăm: 15 − 4 = 11, viết 1; hàng phần mười còn 0 nên mượn 1 đơn vị thành 10 phần mười: 10 − 2 = 8; hàng đơn vị còn 0.",
    },
  ],
};
