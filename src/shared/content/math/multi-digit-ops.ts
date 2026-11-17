/**
 * Toán 4 · Nhân và chia với số có hai chữ số (skill: math-multi-digit-ops, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const multiDigitOps: LessonDefinition = {
  id: "math-multi-digit-ops",
  subjectId: "math",
  skillId: "math-multi-digit-ops",
  titleVi: "Nhân và chia với số có hai chữ số",
  titleEn: "Multiplying and Dividing by Two-Digit Numbers",
  objectiveVi:
    "Em sẽ vận dụng tính chất phân phối để nhân đúng các tích riêng và biết làm tròn số chia để ước lượng thương.",
  objectiveEn:
    "Use the distributive property for partial products and round two-digit divisors to estimate quotients.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-multi-digit-ops",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 6 ngày, chú ý đặt tích riêng thứ hai lùi sang trái một cột.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi đặt tính 134 × 23, tích riêng thứ hai là 134 × 2 = 268 phải viết lùi sang trái một cột so với tích riêng thứ nhất vì sao?",
        question_en:
          "When computing 134 × 23, why is the second partial product 134 × 2 = 268 shifted one column to the left?",
        choices: [
          {
            id: "a",
            label_vi: "Vì chữ số 2 lớn hơn chữ số 1 ở hàng trăm của 134.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vì đặt lệch cột chỉ để phân biệt hai dòng cho dễ nhìn.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì phép nhân luôn phải tính từ hàng chục trước rồi mới đến hàng đơn vị.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì chữ số 2 ở hàng chục của 23 có giá trị là 20, nên 268 thực chất là 268 chục (2 680).",
            correct: true,
          },
        ],
        hint1_vi: "Số 23 gồm mấy chục và mấy đơn vị?",
        hint2_vi:
          "Theo tính chất phân phối của phép nhân đối với phép cộng: 134 × 23 = 134 × 3 + 134 × 20.",
        hint3_vi:
          "Khi nhân 134 với 2 chục, kết quả thu được tính theo đơn vị chục nên chữ số 8 phải đứng thẳng cột hàng chục.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Số 23 = 20 + 3 nên 134 × 23 = 134 × 3 + 134 × 20. Tích 134 × 2 = 268 chỉ 268 chục (tức 2 680), vì vậy phải viết chữ số 8 thẳng cột hàng chục, lùi sang trái một cột.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 125 × 24 là bao nhiêu?",
        question_en: "What is 125 × 24?",
        choices: [
          { id: "a", label_vi: "3 000", correct: true },
          { id: "b", label_vi: "750", correct: false },
          { id: "c", label_vi: "2 900", correct: false },
          { id: "d", label_vi: "3 250", correct: false },
        ],
        hint1_vi:
          "Em có thể tách 24 = 20 + 4 để tính hai tích riêng rồi cộng lại.",
        hint2_vi:
          "Tích riêng thứ nhất là 125 × 4 = 500; tích riêng thứ hai là 125 × 20.",
        hint3_vi:
          "Tính 125 × 20 = 2 500 rồi cộng với tích riêng thứ nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Tách 24 = 20 + 4: ta có 125 × 4 = 500 và 125 × 20 = 2 500. Cộng hai tích riêng được 500 + 2 500 = 3 000.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi chia 252 cho 28, nếu làm tròn 28 thành 30 để ước lượng thương ban đầu thì ta thử thương mấy và sau đó điều chỉnh thế nào?",
        question_en:
          "When dividing 252 by 28, if you round 28 to 30 to estimate the initial quotient, what trial digit do you get and how do you adjust it?",
        choices: [
          {
            id: "a",
            label_vi:
              "Thử thương 7 và giữ nguyên 7, còn dư 56 thì ghi 56 vào bên phải thương.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Thử thương 8 và giữ nguyên 8 vì 28 × 8 = 224 bé hơn 252.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Thử thương 8, thấy phần còn lại 252 − 224 = 28 bằng số chia nên tăng thương lên 9.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Thử thương 10 vì làm tròn 28 thành 30 thì 252 gần bằng 300.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nhẩm 25 chục chia 3 chục được khoảng 8 lần, nên thương thử ban đầu là 8.",
        hint2_vi:
          "Lấy số chia thật là 28 nhân với 8 được 224, rồi tính hiệu 252 − 224.",
        hint3_vi:
          "Trong phép chia, số dư luôn phải bé hơn số chia 28; nếu phần còn lại vừa đủ 28 thì chia thêm được mấy lần nữa?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Làm tròn 28 thành 30, nhẩm 252 : 30 được thương thử là 8. Nhân lại với số chia thật: 28 × 8 = 224, còn lại 252 − 224 = 28 bằng đúng số chia, nên ta tăng thương thêm 1 thành 9 (28 × 9 = 252).",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 1 512 : 36 là bao nhiêu?",
        question_en: "What is 1,512 : 36?",
        choices: [
          { id: "a", label_vi: "38", correct: false },
          { id: "b", label_vi: "42", correct: true },
          { id: "c", label_vi: "44", correct: false },
          { id: "d", label_vi: "52", correct: false },
        ],
        hint1_vi:
          "Lấy 3 chữ số đầu là 151 chia cho 36 để tìm chữ số hàng chục của thương.",
        hint2_vi:
          "Ta có 36 × 4 = 144, lấy 151 − 144 còn dư 7, hạ tiếp chữ số 2 xuống được 72.",
        hint3_vi:
          "Thực hiện bước chia cuối cùng 72 : 36 để tìm chữ số hàng đơn vị của thương.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Lấy 151 chia 36 được 4 (vì 36 × 4 = 144), dư 7; hạ 2 được 72, lấy 72 chia 36 được 2 không dư. Vậy 1 512 : 36 = 42.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thư viện trường nhận về 860 quyển truyện thiếu nhi và xếp đều vào các hộp, mỗi hộp chứa tối đa 24 quyển. Hỏi cần ít nhất bao nhiêu hộp để cất hết toàn bộ số truyện đó?",
        question_en:
          "A school library receives 860 children's books and packs them into boxes holding at most 24 books each. At least how many boxes are needed to pack all the books?",
        choices: [
          { id: "a", label_vi: "34 hộp", correct: false },
          { id: "b", label_vi: "35 hộp", correct: false },
          { id: "c", label_vi: "37 hộp", correct: false },
          { id: "d", label_vi: "36 hộp", correct: true },
        ],
        hint1_vi:
          "Thực hiện phép chia có dư 860 : 24 để xem xếp đầy được bao nhiêu hộp và còn lẻ mấy quyển.",
        hint2_vi:
          "Lấy 86 chia 24 được 3 dư 14, hạ 0 được 140; lấy 140 chia 24 được 5 dư 20 quyển.",
        hint3_vi:
          "Xếp đầy các hộp trên mới chứa được 840 quyển; 20 quyển còn lẻ vẫn cần thêm 1 hộp riêng để cất hết.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Ta có 860 : 24 = 35 (dư 20), nghĩa là xếp đầy 35 hộp được 840 quyển và còn dư 20 quyển. Để cất hết số truyện, cần thêm 1 hộp cho 20 quyển dư, tổng cộng là 35 + 1 = 36 hộp.",
    },
  ],
};
