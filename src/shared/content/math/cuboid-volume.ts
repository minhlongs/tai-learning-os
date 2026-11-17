/**
 * Toán 5 · Thể tích hình hộp chữ nhật và hình lập phương (skill: math-cuboid-volume, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const cuboidVolume: LessonDefinition = {
  id: "math-cuboid-volume",
  subjectId: "math",
  skillId: "math-cuboid-volume",
  titleVi: "Thể tích hình hộp chữ nhật và hình lập phương",
  titleEn: "Volume of Rectangular Prisms and Cubes",
  objectiveVi:
    "Em sẽ tính được thể tích hình hộp chữ nhật, hình lập phương theo cm³, dm³, m³ và giải được bài toán bể chứa nước (1 dm³ = 1 lít).",
  objectiveEn:
    "Compute volumes of rectangular prisms and cubes in cm³, dm³, and m³, and solve water tank problems using 1 dm³ = 1 liter.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-cuboid-volume",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày, nhớ hai đơn vị thể tích liền kề hơn kém nhau 1 000 lần và 1 dm³ = 1 lít.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao 1 dm³ lại bằng 1 000 cm³ chứ không phải bằng 10 cm³ hay 100 cm³?",
        question_en:
          "Why does 1 dm³ equal 1,000 cm³ rather than 10 cm³ or 100 cm³?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì một hình lập phương lớn có tất cả 6 mặt vuông và mỗi mặt chia đều thành khoảng hơn một trăm ô nhỏ ghép quanh vỏ ngoài.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì trên thước thẳng 1 dm dài gấp 100 lần 1 cm nên khi đổi sang thể tích ta chỉ cần nhân thêm 10 lần chiều cao nữa.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì người ta quy ước mỗi cạnh nhân thêm với 333.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì 1 dm = 10 cm nên hình lập phương cạnh 1 dm xếp vừa khít 10 × 10 = 100 khối 1 cm³ mỗi lớp, nhân 10 lớp được 1 000 cm³.",
            correct: true,
          },
        ],
        hint1_vi:
          "Xét một hình lập phương có cạnh dài 1 dm, tức là dài 10 cm theo cả chiều dài, chiều rộng và chiều cao.",
        hint2_vi:
          "Ở lớp đáy dưới cùng, xếp dọc 10 hàng và mỗi hàng 10 khối lập phương cạnh 1 cm thì một lớp có bao nhiêu khối?",
        hint3_vi:
          "Chiều cao 10 cm xếp chồng được 10 lớp như thế lên nhau; lấy số khối một lớp nhân với 10 lớp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Do 1 dm = 10 cm nên hình lập phương cạnh 1 dm chứa được 10 lớp, mỗi lớp gồm 10 × 10 = 100 khối lập phương cạnh 1 cm. Tổng cộng có 10 × 10 × 10 = 1 000 cm³.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hộp gỗ hình hộp chữ nhật có chiều dài 8 cm, chiều rộng 5 cm và chiều cao 4 cm. Thể tích của hộp gỗ đó là bao nhiêu?",
        question_en:
          "A rectangular wooden box is 8 cm long, 5 cm wide, and 4 cm high. What is its volume?",
        choices: [
          { id: "a", label_vi: "17 cm³", correct: false },
          { id: "b", label_vi: "160 cm³", correct: true },
          { id: "c", label_vi: "320 cm³", correct: false },
          { id: "d", label_vi: "80 cm³", correct: false },
        ],
        hint1_vi:
          "Ba kích thước đã cùng đơn vị đo là xăng-ti-mét.",
        hint2_vi:
          "Thể tích hình hộp chữ nhật bằng diện tích mặt đáy (dài × rộng) nhân với chiều cao.",
        hint3_vi: "Tính diện tích mặt đáy 8 × 5 trước rồi nhân tiếp với chiều cao 4.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thể tích hình hộp chữ nhật bằng tích ba kích thước cùng đơn vị đo: 8 × 5 × 4 = 160 cm³.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một khối rubik hình lập phương có cạnh dài 6 cm. Thể tích của khối rubik đó là bao nhiêu?",
        question_en:
          "A Rubik's cube has an edge length of 6 cm. What is its volume?",
        choices: [
          { id: "a", label_vi: "36 cm³", correct: false },
          { id: "b", label_vi: "18 cm³", correct: false },
          { id: "c", label_vi: "216 cm³", correct: true },
          { id: "d", label_vi: "144 cm³", correct: false },
        ],
        hint1_vi:
          "Hình lập phương là hình hộp chữ nhật đặc biệt có chiều dài, chiều rộng và chiều cao đều bằng nhau.",
        hint2_vi:
          "Muốn tính thể tích hình lập phương, ta lấy cạnh nhân với cạnh rồi nhân tiếp với cạnh.",
        hint3_vi:
          "Tính 6 × 6 = 36 trước, sau đó lấy 36 nhân tiếp với 6 (không phải nhân với 4 mặt hay chỉ dừng ở 36).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thể tích hình lập phương cạnh 6 cm là 6 × 6 × 6 = 216 cm³.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một thùng chứa hàng dạng hình hộp chữ nhật có các kích thước lòng thùng là dài 1,5 m, rộng 1,2 m và cao 0,8 m. Thể tích lòng thùng là bao nhiêu mét khối?",
        question_en:
          "A cargo container has interior dimensions 1.5 m long, 1.2 m wide, and 0.8 m high. What is its interior volume in cubic meters?",
        choices: [
          { id: "a", label_vi: "1,44 m³", correct: true },
          { id: "b", label_vi: "3,5 m³", correct: false },
          { id: "c", label_vi: "14,4 m³", correct: false },
          { id: "d", label_vi: "1,8 m³", correct: false },
        ],
        hint1_vi:
          "Cả ba kích thước đều đã đo bằng mét nên em nhân trực tiếp ba số thập phân đó với nhau.",
        hint2_vi: "Tính diện tích đáy lòng thùng: 1,5 × 1,2 = 1,8 m².",
        hint3_vi: "Lấy diện tích đáy 1,8 nhân tiếp với chiều cao 0,8.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Thể tích lòng thùng chứa hàng là 1,5 × 1,2 × 0,8 = 1,8 × 0,8 = 1,44 m³.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bể cá cảnh dạng hình hộp chữ nhật có lòng bể dài 6 dm, rộng 4 dm và cao 5 dm. Hiện tại mực nước trong bể cao bằng 3/5 chiều cao của bể. Hỏi trong bể đang chứa bao nhiêu lít nước (biết 1 dm³ = 1 lít)?",
        question_en:
          "A rectangular fish tank has interior dimensions 6 dm long, 4 dm wide, and 5 dm high. Water currently fills 3/5 of its height. How many liters of water are in the tank (1 dm³ = 1 liter)?",
        choices: [
          { id: "a", label_vi: "120 lít", correct: false },
          { id: "b", label_vi: "48 lít", correct: false },
          { id: "c", label_vi: "96 lít", correct: false },
          { id: "d", label_vi: "72 lít", correct: true },
        ],
        hint1_vi:
          "Phần nước trong bể tạo thành một khối hình hộp chữ nhật có cùng đáy (dài 6 dm, rộng 4 dm) nhưng chiều cao là chiều cao mực nước.",
        hint2_vi:
          "Tìm chiều cao mực nước bằng cách lấy 3/5 của 5 dm (hoặc tính thể tích cả bể rồi nhân với 3/5).",
        hint3_vi:
          "Lấy diện tích đáy bể 6 × 4 = 24 dm² nhân với chiều cao mực nước vừa tìm được; mỗi đề-xi-mét khối ứng với 1 lít nước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Chiều cao mực nước trong bể là 5 × 3/5 = 3 dm. Thể tích nước trong bể là 6 × 4 × 3 = 72 dm³. Vì 1 dm³ = 1 lít nên bể đang chứa 72 lít nước.",
    },
  ],
};
