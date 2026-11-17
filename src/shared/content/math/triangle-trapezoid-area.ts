/**
 * Toán 5 · Diện tích hình tam giác và hình thang (skill: math-tri-trap-area, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const triangleTrapezoidArea: LessonDefinition = {
  id: "math-triangle-trapezoid-area",
  subjectId: "math",
  skillId: "math-tri-trap-area",
  titleVi: "Diện tích hình tam giác và hình thang",
  titleEn: "Area of Triangles and Trapezoids",
  objectiveVi:
    "Em sẽ hiểu vì sao công thức diện tích tam giác và hình thang đều chia cho 2, biết đổi cùng đơn vị đo và tính đúng diện tích.",
  objectiveEn:
    "Understand why triangle and trapezoid area formulas divide by 2, unify units of length, and compute areas accurately.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-tri-trap-area",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 5 ngày bằng cách ghép hai hình tam giác bằng nhau thành hình bình hành.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao trong công thức tính diện tích hình tam giác (độ dài đáy nhân chiều cao rồi chia cho 2), ta lại phải chia cho 2?",
        question_en:
          "Why must we divide by 2 in the triangle area formula (base times height divided by 2)?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì ghép hai hình tam giác bằng nhau sẽ tạo thành một hình bình hành có cùng đáy và cùng chiều cao, nên mỗi tam giác bằng một nửa hình bình hành đó.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Vì mọi hình tam giác đều có hai cạnh bên dài bằng nhau và nghiêng chéo vào giữa nên phần diện tích bên trong giảm đi một nửa so với tích hai cạnh.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì trong mọi hình tam giác, đường chiều cao hạ từ đỉnh xuống đáy luôn chỉ dài bằng đúng một nửa độ dài cạnh đáy tương ứng.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vì chia cho 2 là để đổi đơn vị độ dài sang đơn vị diện tích.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy tưởng tượng cắt hai tấm bìa hình tam giác giống hệt nhau rồi xoay ngược một tấm ghép sát vào tấm kia.",
        hint2_vi:
          "Hình mới tạo thành là một hình bình hành có diện tích bằng độ dài đáy nhân với chiều cao.",
        hint3_vi:
          "Vì hình bình hành đó gồm đúng hai hình tam giác bằng nhau ghép lại, nên diện tích một hình tam giác chiếm mấy phần diện tích hình bình hành?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hai hình tam giác bằng nhau ghép lại tạo thành một hình bình hành có diện tích bằng đáy × chiều cao. Do đó diện tích một hình tam giác bằng một nửa diện tích hình bình hành: (đáy × chiều cao) : 2.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hình tam giác có độ dài đáy 14 cm và chiều cao tương ứng là 9 cm. Diện tích của hình tam giác đó là bao nhiêu?",
        question_en:
          "A triangle has a base of 14 cm and a corresponding height of 9 cm. What is its area?",
        choices: [
          { id: "a", label_vi: "126 cm²", correct: false },
          { id: "b", label_vi: "23 cm²", correct: false },
          { id: "c", label_vi: "63 cm²", correct: true },
          { id: "d", label_vi: "31,5 cm²", correct: false },
        ],
        hint1_vi: "Hai số đo đáy và chiều cao đã cùng đơn vị xăng-ti-mét.",
        hint2_vi:
          "Áp dụng công thức diện tích hình tam giác: lấy độ dài đáy nhân chiều cao rồi chia cho 2.",
        hint3_vi:
          "Em có thể lấy 14 chia cho 2 trước cho gọn rồi nhân với 9.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Diện tích hình tam giác là (14 × 9) : 2 = 126 : 2 = 63 cm².",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hình thang có đáy lớn 18 m, đáy bé 12 m và chiều cao 7 m. Diện tích của hình thang đó là bao nhiêu?",
        question_en:
          "A trapezoid has bases of 18 m and 12 m, and a height of 7 m. What is its area?",
        choices: [
          { id: "a", label_vi: "210 m²", correct: false },
          { id: "b", label_vi: "105 m²", correct: true },
          { id: "c", label_vi: "96 m²", correct: false },
          { id: "d", label_vi: "126 m²", correct: false },
        ],
        hint1_vi:
          "Ghép hai hình thang bằng nhau (một xuôi, một ngược) sẽ được hình bình hành có đáy là tổng hai đáy (18 + 12) và chiều cao 7 m.",
        hint2_vi:
          "Tính tổng độ dài hai đáy của hình thang: 18 + 12 = 30 m.",
        hint3_vi:
          "Lấy tổng hai đáy nhân với chiều cao 7 m rồi chia cho 2.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Tổng hai đáy là 18 + 12 = 30 m. Diện tích hình thang là (30 × 7) : 2 = 210 : 2 = 105 m².",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một lá cờ nheo hình tam giác có độ dài đáy là 4 dm và chiều cao tương ứng là 25 cm. Diện tích của lá cờ đó tính theo xăng-ti-mét vuông là bao nhiêu?",
        question_en:
          "A triangular pennant has a base of 4 dm and a height of 25 cm. What is its area in square centimeters?",
        choices: [
          { id: "a", label_vi: "50 cm²", correct: false },
          { id: "b", label_vi: "1 000 cm²", correct: false },
          { id: "c", label_vi: "100 cm²", correct: false },
          { id: "d", label_vi: "500 cm²", correct: true },
        ],
        hint1_vi:
          "Đáy đang đo bằng đề-xi-mét còn chiều cao đo bằng xăng-ti-mét; em phải đổi về cùng đơn vị cm trước khi tính.",
        hint2_vi: "Đổi 4 dm = 40 cm.",
        hint3_vi:
          "Áp dụng công thức diện tích tam giác với đáy 40 cm và chiều cao 25 cm, nhớ chia cho 2.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Đổi về cùng đơn vị đo: 4 dm = 40 cm. Diện tích lá cờ hình tam giác là (40 × 25) : 2 = 1 000 : 2 = 500 cm².",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bồn hoa hình thang có diện tích 54 m² và chiều cao 6 m. Biết đáy bé dài 7 m, hỏi đáy lớn của bồn hoa dài bao nhiêu mét?",
        question_en:
          "A trapezoid flower bed has an area of 54 m² and a height of 6 m. If the shorter base is 7 m, how long is the longer base?",
        choices: [
          { id: "a", label_vi: "9 m", correct: false },
          { id: "b", label_vi: "18 m", correct: false },
          { id: "c", label_vi: "11 m", correct: true },
          { id: "d", label_vi: "12 m", correct: false },
        ],
        hint1_vi:
          "Từ công thức S = (tổng hai đáy × chiều cao) : 2, muốn tìm lại tích (tổng hai đáy × chiều cao) em phải nhân diện tích với 2.",
        hint2_vi:
          "Lấy 54 × 2 = 108, rồi chia cho chiều cao 6 m để tìm tổng độ dài hai đáy.",
        hint3_vi:
          "Biết tổng độ dài hai đáy và biết đáy bé là 7 m, em trừ đi 7 m để tìm đáy lớn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Tổng độ dài hai đáy của hình thang là (54 × 2) : 6 = 108 : 6 = 18 m. Đáy lớn của bồn hoa dài 18 − 7 = 11 m.",
    },
  ],
};
