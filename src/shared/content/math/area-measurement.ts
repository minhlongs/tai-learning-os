/**
 * Toán · Diện tích hình chữ nhật (skill: math-area, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const areaMeasurement: LessonDefinition = {
  id: "math-area-measurement",
  subjectId: "math",
  skillId: "math-area",
  titleVi: "Diện tích hình chữ nhật",
  titleEn: "Area of a Rectangle",
  objectiveVi: "Em sẽ tìm được độ dài hai cạnh của hình chữ nhật và đo bề mặt của nó.",
  objectiveEn: "Find the two side lengths of a rectangle and measure its surface.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-math-geo-area",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng bài toán đo diện tích thực tế.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn biết một tấm chiếu rộng bao nhiêu, em đo “mặt chiếu” bằng cách nào sau đây?",
        question_en: "How do you measure the surface of a mat?",
        choices: [
          { id: "a", label_vi: "Đo bề dài của tấm chiếu bằng thước dây.", correct: false },
          { id: "b", label_vi: "Đo cả chiều ngang và chiều dọc của tấm chiếu.", correct: true },
          { id: "c", label_vi: "Đếm số dây thừng buộc tấm chiếu.", correct: false },
          { id: "d", label_vi: "Cân xem tấm chiếu nặng bao nhiêu.", correct: false },
        ],
        hint1_vi: "Bề mặt là cái em đặt đồ lên trên, không phải cái em cân.",
        hint2_vi: "Mặt chiếu có chiều ngang cũng có chiều dọc.",
        hint3_vi: "Một chiều thôi chỉ cho biết hình dài ra sao, chưa đủ để biết mặt rộng bao nhiêu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bề mặt rộng ít hay nhiều phụ thuộc cả hai chiều: ngang rộng và dọc dài. Đo một chiều chỉ cho biết hình trông ra sao, còn đo cả hai mới biết mặt rộng bao nhiêu.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sân lớp có dài 8 mét và rộng 5 mét. Diện tích sân bằng bao nhiêu?",
        question_en: "What is the area of the schoolyard in square metres?",
        choices: [
          { id: "a", label_vi: "13 m²", correct: false },
          { id: "b", label_vi: "26 m²", correct: false },
          { id: "c", label_vi: "40 m²", correct: true },
          { id: "d", label_vi: "3 m²", correct: false },
        ],
        hint1_vi: "Diện tích là bề mặt gồm các hình vuông nhỏ xếp đầy mặt đất.",
        hint2_vi: "Em hãy xem mỗi hàng ngang xếp được bao nhiêu ô vuông 1 mét.",
        hint3_vi: "Nếu mỗi hàng có một số ô như nhau và có nhiều hàng như nhau, em có thể nhân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mặt sân xếp đầy các ô vuông cạnh 1 mét: mỗi hàng ngang có 8 ô, và cứ 8 ô đó lặp lại đúng 5 hàng, nên 8 × 5 = 40 ô vuông 1 mét, tức 40 m². Đáp án 13 là cộng hai cạnh, nhưng cộng chỉ cho biết chu vi chứ không cho biết mặt rộng.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bức tường hình chữ nhật dài 6 mét, rộng 3 mét. Người ta sơn 1 mét vuông tường mất 1 thùng sơn. Hỏi cần bao nhiêu thùng sơn cho vừa bức tường?",
        question_en: "How many tins of paint are needed for the wall?",
        choices: [
          { id: "a", label_vi: "9 thùng", correct: false },
          { id: "b", label_vi: "18 thùng", correct: true },
          { id: "c", label_vi: "6 thùng", correct: false },
          { id: "d", label_vi: "3 thùng", correct: false },
        ],
        hint1_vi: "Diện tích tường cho biết có bao nhiêu mét vuông, mà mỗi mét vuông cần một thùng sơn.",
        hint2_vi: "Số thùng sơn gần như bằng số mét vuông, nên em tính diện tích trước.",
        hint3_vi: "Diện tích hình chữ nhật là nhân chiều dài với chiều rộng. Thử nhân xem.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Tường có 6 × 3 = 18 mét vuông. Vì mỗi mét vuông cần một thùng sơn, nên cần 18 thùng. Đáp án 9 là hiệu hai cạnh, không phải diện tích.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thước dây đo được một thửa ruộng dài 12 mét và rộng 7 mét. Diện tích thửa ruộng là bao nhiêu?",
        question_en: "What is the area of the field?",
        choices: [
          { id: "a", label_vi: "19 m²", correct: false },
          { id: "b", label_vi: "84 m²", correct: true },
          { id: "c", label_vi: "5 m²", correct: false },
          { id: "d", label_vi: "70 m²", correct: false },
        ],
        hint1_vi: "Diện tích là bề mặt gồm các ô vuông 1 mét xếp đều khắp thửa ruộng.",
        hint2_vi: "Nhân chiều dài với chiều rộng: 12 nhân với 7.",
        hint3_vi: "Nếu em tính 10 × 7 = 70 và 2 × 7 = 14 rồi cộng lại thì ra bao nhiêu?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thửa ruộng xếp đầy ô vuông 1 mét, cứ 12 ô lại lặp đúng 7 hàng, nên 12 × 7 = 84 m². Cộng hai cạnh là 19, chỉ là chu vi chứ không cho biết mặt đất rộng bao nhiêu.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một tấm thảm hình chữ nhật dài 9 bước chân và rộng 4 bước chân. Diện tích tấm thảm là bao nhiêu bước vuông?",
        question_en: "What is the area of the rug in square steps?",
        choices: [
          { id: "a", label_vi: "36 bước vuông", correct: true },
          { id: "b", label_vi: "22 bước vuông", correct: false },
          { id: "c", label_vi: "13 bước vuông", correct: false },
          { id: "d", label_vi: "5 bước vuông", correct: false },
        ],
        hint1_vi: "Diện tích là bề mặt, nên em nhân hai chiều chứ không cộng.",
        hint2_vi: "Nhân chiều dài với chiều rộng: 9 nhân với 4.",
        hint3_vi: "Nếu 10 × 4 = 40 thì 9 × 4 bằng bao nhiêu?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bề mặt thảm xếp đầy các ô vuông cạnh 1 bước chân, cứ 9 ô lại lặp đúng 4 hàng, nên 9 × 4 = 36 bước vuông. Đáp án 5 là bề rộng cạnh, chứ không phải diện tích.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Mảnh vườn hình chữ nhật dài 10 mét, rộng 5 mét. Bà cho thêm một dải đất hình chữ nhật dài 10 mét, rộng 3 mét để trồng thêm rau. Hỏi cả mảnh vườn hiện có diện tích là bao nhiêu m²?",
        question_en: "What is the total area of the garden now?",
        choices: [
          { id: "a", label_vi: "50 m²", correct: false },
          { id: "b", label_vi: "30 m²", correct: false },
          { id: "c", label_vi: "80 m²", correct: true },
          { id: "d", label_vi: "18 m²", correct: false },
        ],
        hint1_vi: "Đất mới được ghép thêm nên tổng diện tích lớn hơn ban đầu.",
        hint2_vi: "Em tính diện tích mảnh cũ, rồi tính diện tích dải mới, rồi gộp hai kết quả lại.",
        hint3_vi: "Mảnh cũ là 10 × 5, dải mới là 10 × 3; cả hai đều có hiệu số 10 mét nên cũng có thể tính gộp thành 10 × (5 + 3).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mảnh cũ: 10 × 5 = 50 m², dải mới: 10 × 3 = 30 m². Gộp lại được 50 + 30 = 80 m². Cách gộp 10 × 8 = 80 cho cùng kết quả, vì hai mảnh có cùng một chiều dài nên cộng hai chiều rộng lại rồi nhân với chiều chung vẫn đúng.",
    },
  ],
};
