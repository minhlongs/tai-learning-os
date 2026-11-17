/**
 * Toán 4 · Cộng và trừ phân số (skill: math-frac-add-sub, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const fractionsAddSub: LessonDefinition = {
  id: "math-fractions-add-sub",
  subjectId: "math",
  skillId: "math-frac-add-sub",
  titleVi: "Cộng và trừ phân số",
  titleEn: "Adding and Subtracting Fractions",
  objectiveVi:
    "Em sẽ cộng, trừ đúng hai phân số cùng mẫu số và biết quy đồng mẫu số đơn giản trước khi tính.",
  objectiveEn:
    "Add and subtract fractions with like denominators and find simple common denominators before computing.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-frac-add-sub",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 5 ngày, chú ý giữ nguyên mẫu số chung khi cộng hoặc trừ tử số.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi cộng hai phân số có cùng mẫu số là 2/9 và 5/9, vì sao ta giữ nguyên mẫu số 9 mà không cộng hai mẫu số với nhau?",
        question_en:
          "When adding 2/9 and 5/9, why do we keep the denominator 9 instead of adding the denominators?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì mẫu số 9 chỉ độ lớn của mỗi phần bằng nhau không thay đổi, ta chỉ gộp số phần lại là 2 + 5 = 7 phần.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Vì phép cộng hai phân số chỉ áp dụng khi mẫu số là số lẻ nên buộc phải giữ nguyên số 9 ở dưới gạch ngang.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì tổng hai mẫu số 9 + 9 = 18 lớn hơn tổng hai tử số nên quy tắc không cho phép viết 18 vào mẫu số.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vì tử số và mẫu số luôn phải trừ bù cho nhau.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy hình dung một thanh sô-cô-la chia sẵn thành 9 ô bằng nhau.",
        hint2_vi:
          "Lấy 2 ô rồi lấy thêm 5 ô trên cùng thanh đó thì kích thước mỗi ô vẫn là một phần chín.",
        hint3_vi:
          "Khi gộp các phần cùng cỡ, số lượng phần tăng lên còn tên gọi của cỡ phần (mẫu số 9) có đổi không?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hai phân số cùng mẫu số 9 đều đếm theo đơn vị là một phần chín. Gộp 2 phần chín với 5 phần chín được 7 phần chín (7/9), cỡ mỗi phần không đổi nên giữ nguyên mẫu số 9.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 8/11 − 3/11 là bao nhiêu?",
        question_en: "What is 8/11 − 3/11?",
        choices: [
          { id: "a", label_vi: "5/22", correct: false },
          { id: "b", label_vi: "11/11", correct: false },
          { id: "c", label_vi: "5/8", correct: false },
          { id: "d", label_vi: "5/11", correct: true },
        ],
        hint1_vi: "Hai phân số này đã có cùng mẫu số là 11.",
        hint2_vi:
          "Khi trừ hai phân số cùng mẫu số, em lấy tử số thứ nhất trừ đi tử số thứ hai.",
        hint3_vi: "Thực hiện phép trừ 8 − 3 ở tử số và giữ nguyên mẫu số 11.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Hai phân số có cùng mẫu số 11 nên ta lấy tử số trừ tử số và giữ nguyên mẫu số: (8 − 3)/11 = 5/11.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 1/3 + 2/9 là bao nhiêu?",
        question_en: "What is 1/3 + 2/9?",
        choices: [
          { id: "a", label_vi: "3/12", correct: false },
          { id: "b", label_vi: "5/9", correct: true },
          { id: "c", label_vi: "3/9", correct: false },
          { id: "d", label_vi: "7/9", correct: false },
        ],
        hint1_vi:
          "Hai phân số 1/3 và 2/9 chưa cùng mẫu số, nhưng 9 chia hết cho 3.",
        hint2_vi:
          "Em hãy quy đồng 1/3 thành phân số có mẫu số là 9 bằng cách nhân cả tử và mẫu với 3.",
        hint3_vi:
          "Sau khi đổi 1/3 thành 3/9, em cộng 3/9 với 2/9 như hai phân số cùng mẫu số.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Ta chọn mẫu số chung là 9 vì 9 chia hết cho 3. Quy đồng 1/3 = 3/9, rồi tính 3/9 + 2/9 = 5/9.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Kết quả của 7/8 − 1/2 là bao nhiêu?",
        question_en: "What is 7/8 − 1/2?",
        choices: [
          { id: "a", label_vi: "6/6", correct: false },
          { id: "b", label_vi: "6/8", correct: false },
          { id: "c", label_vi: "3/8", correct: true },
          { id: "d", label_vi: "5/8", correct: false },
        ],
        hint1_vi:
          "Mẫu số 8 chia hết cho mẫu số 2 nên ta lấy 8 làm mẫu số chung.",
        hint2_vi:
          "Nhân cả tử số và mẫu số của 1/2 với 4 để được phân số có mẫu số là 8.",
        hint3_vi:
          "Lấy 7/8 trừ đi phân số vừa quy đồng được và giữ nguyên mẫu số 8.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Quy đồng 1/2 = 4/8 để cùng mẫu số 8 với 7/8. Khi đó 7/8 − 4/8 = 3/8.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bình tưới cây đang chứa 9/10 bình nước. Buổi sáng em dùng 1/5 bình để tưới hoa hồng và buổi chiều dùng thêm 3/10 bình để tưới rau. Trong bình còn lại bao nhiêu phần bình nước?",
        question_en:
          "A watering can holds 9/10 of its capacity. You use 1/5 in the morning and 3/10 in the afternoon. What fraction of the can remains?",
        choices: [
          { id: "a", label_vi: "2/5 bình", correct: true },
          { id: "b", label_vi: "1/2 bình", correct: false },
          { id: "c", label_vi: "3/10 bình", correct: false },
          { id: "d", label_vi: "3/5 bình", correct: false },
        ],
        hint1_vi:
          "Đổi lượng nước tưới buổi sáng 1/5 bình sang phân số có mẫu số là 10 để cùng mẫu số với các phân số còn lại.",
        hint2_vi:
          "Tính tổng lượng nước đã tưới cả hai buổi rồi lấy 9/10 trừ đi tổng đó.",
        hint3_vi:
          "Sau khi tìm được số phần mười còn lại, em chia cả tử số và mẫu số cho 2 để được phân số tối giản.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Quy đồng 1/5 = 2/10. Tổng lượng nước đã tưới là 2/10 + 3/10 = 5/10 bình. Lượng nước còn lại là 9/10 − 5/10 = 4/10, rút gọn bằng 2/5 bình.",
    },
  ],
};
