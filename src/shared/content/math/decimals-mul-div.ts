/**
 * Toán 5 · Nhân và chia số thập phân (skill: math-dec-mul-div, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const decimalsMulDiv: LessonDefinition = {
  id: "math-decimals-mul-div",
  subjectId: "math",
  skillId: "math-dec-mul-div",
  titleVi: "Nhân và chia số thập phân",
  titleEn: "Multiplying and Dividing Decimals",
  objectiveVi:
    "Em sẽ nhân, chia đúng các số thập phân và thành thạo quy tắc dịch chuyển dấu phẩy khi nhân hoặc chia với 10, 100, 0,1.",
  objectiveEn:
    "Multiply and divide decimals accurately and shift the decimal point when multiplying or dividing by 10, 100, or 0.1.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-dec-mul-div",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 5 ngày, đếm kỹ tổng số chữ số ở phần thập phân của cả hai thừa số.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi nhân một số thập phân với 0,1 thì dấu phẩy của số đó dịch chuyển như thế nào?",
        question_en:
          "When multiplying a decimal number by 0.1, how does the decimal point shift?",
        choices: [
          {
            id: "a",
            label_vi:
              "Dịch sang phải một chữ số giống như khi nhân với 10 vì phép nhân luôn làm giá trị số tăng lên.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Dịch sang trái một chữ số vì nhân với 0,1 chính là lấy một phần mười (chia cho 10).",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Dịch sang trái hai chữ số vì trong số 0,1 có cả chữ số 0 và chữ số 1 ở hai bên dấu phẩy.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Giữ nguyên vị trí dấu phẩy không đổi.",
            correct: false,
          },
        ],
        hint1_vi: "Số thập phân 0,1 viết dưới dạng phân số thập phân là 1/10.",
        hint2_vi:
          "Nhân một số với 1/10 tức là chia số đó cho 10, làm giá trị của số giảm đi 10 lần.",
        hint3_vi:
          "Muốn một số thập phân giảm đi 10 lần, dấu phẩy phải dịch sang bên nào một hàng chữ số?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Vì 0,1 = 1/10 nên nhân một số thập phân với 0,1 tương đương chia số đó cho 10; ta dịch dấu phẩy của số đó sang bên trái một chữ số.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 3,45 × 100 là bao nhiêu?",
        question_en: "What is 3.45 × 100?",
        choices: [
          { id: "a", label_vi: "0,0345", correct: false },
          { id: "b", label_vi: "34,5", correct: false },
          { id: "c", label_vi: "3 450", correct: false },
          { id: "d", label_vi: "345", correct: true },
        ],
        hint1_vi:
          "Khi nhân một số thập phân với 100, giá trị của số đó gấp lên 100 lần.",
        hint2_vi:
          "Số 100 có hai chữ số 0, nên ta dịch dấu phẩy sang bên phải hai chữ số.",
        hint3_vi:
          "Dịch dấu phẩy của 3,45 qua chữ số 4 rồi qua tiếp chữ số 5 thì được số tự nhiên nào?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Nhân 3,45 với 100, ta dịch dấu phẩy sang bên phải hai chữ số được 345.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 2,4 × 1,5 là bao nhiêu?",
        question_en: "What is 2.4 × 1.5?",
        choices: [
          { id: "a", label_vi: "3,6", correct: true },
          { id: "b", label_vi: "36", correct: false },
          { id: "c", label_vi: "0,36", correct: false },
          { id: "d", label_vi: "3,9", correct: false },
        ],
        hint1_vi:
          "Trước hết em nhân như nhân hai số tự nhiên: tính 24 × 15.",
        hint2_vi:
          "Đếm tổng số chữ số ở phần thập phân của cả hai thừa số 2,4 và 1,5 (mỗi số có 1 chữ số thập phân).",
        hint3_vi:
          "Từ phải sang trái ở tích 360, tách ra hai chữ số ở phần thập phân rồi viết gọn phần 0 tận cùng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Ta tính 24 × 15 = 360. Cả hai thừa số 2,4 và 1,5 có tất cả 2 chữ số ở phần thập phân, nên đặt dấu phẩy được 3,60, viết gọn là 3,6.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 7,56 : 1,8 là bao nhiêu?",
        question_en: "What is 7.56 : 1.8?",
        choices: [
          { id: "a", label_vi: "0,42", correct: false },
          { id: "b", label_vi: "42", correct: false },
          { id: "c", label_vi: "4,2", correct: true },
          { id: "d", label_vi: "4,4", correct: false },
        ],
        hint1_vi:
          "Số chia 1,8 có 1 chữ số ở phần thập phân, nên ta dịch dấu phẩy của cả số bị chia và số chia sang phải 1 chữ số.",
        hint2_vi:
          "Phép chia trở thành chia số thập phân cho số tự nhiên: 75,6 : 18.",
        hint3_vi:
          "Lấy 75 chia 18 được 4 dư 3, đánh dấu phẩy vào thương rồi hạ 6 được 36 chia 18.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nhân cả số bị chia và số chia với 10, phép chia 7,56 : 1,8 trở thành 75,6 : 18. Lấy 75 : 18 = 4 (dư 3), viết dấu phẩy vào thương, hạ 6 được 36 : 18 = 2. Kết quả là 4,2.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cô thợ may có một cuộn ruy băng dài 13,5 m và cắt thành các đoạn bằng nhau, mỗi đoạn dài 0,75 m để thắt nơ hộp quà. Hỏi cô cắt được bao nhiêu đoạn ruy băng như thế?",
        question_en:
          "A tailor has a 13.5 m ribbon and cuts it into equal pieces of 0.75 m each. How many pieces does she get?",
        choices: [
          { id: "a", label_vi: "1,8 đoạn", correct: false },
          { id: "b", label_vi: "18 đoạn", correct: true },
          { id: "c", label_vi: "16 đoạn", correct: false },
          { id: "d", label_vi: "180 đoạn", correct: false },
        ],
        hint1_vi:
          "Muốn tìm số đoạn cắt được, em lấy tổng độ dài 13,5 m chia cho độ dài mỗi đoạn 0,75 m.",
        hint2_vi:
          "Số chia 0,75 có hai chữ số thập phân; khi dịch dấu phẩy của 13,5 sang phải hai hàng thì cần viết thêm một chữ số 0 thành 1 350.",
        hint3_vi: "Thực hiện phép chia hai số tự nhiên 1 350 : 75.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Số đoạn ruy băng cắt được là 13,5 : 0,75. Dịch dấu phẩy sang phải hai chữ số ở cả hai số (thêm chữ số 0 vào 13,5) ta được 1 350 : 75 = 18 đoạn.",
    },
  ],
};
