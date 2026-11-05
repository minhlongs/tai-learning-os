/**
 * Khoa học · Các dạng năng lượng và sự chuyển hóa (skill: sci-energy-forms, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Khoa học Lớp 5 (`GDPT2018.SCI.5.ENERGY.03`).
 */
import type { LessonDefinition } from "../types";

export const energyForms: LessonDefinition = {
  id: "sci-energy-forms",
  subjectId: "science",
  skillId: "sci-energy-forms",
  titleVi: "Các dạng năng lượng và sự chuyển hóa",
  titleEn: "Forms and Transformations of Energy",
  objectiveVi:
    "Em sẽ nêu được một số dạng năng lượng quen thuộc và ví dụ về sự chuyển hóa năng lượng trong đời sống.",
  objectiveEn:
    "Name familiar forms of energy and give examples of energy transformation in daily life.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-energy",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chỉ ra một ví dụ năng lượng chuyển hóa trong nhà em.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bóng đèn phát sáng khi có dòng điện chạy qua. Điều đó chứng tỏ điện năng đã chuyển hóa thành dạng năng lượng nào?",
        choices: [
          { id: "a", label_vi: "Năng lượng sáng", correct: true },
          { id: "b", label_vi: "Năng lượng hóa học", correct: false },
          { id: "c", label_vi: "Năng lượng âm thanh", correct: false },
          { id: "d", label_vi: "Năng lượng dự trữ trong pin khô", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến điều em nhìn thấy khi bật công tắc đèn.",
        hint2_vi: "Dạng năng lượng đó giúp em nhìn rõ trong bóng tối.",
        hint3_vi: "Điện năng chuyển thành năng lượng sáng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi dòng điện chạy qua bóng đèn, điện năng được chuyển hóa thành năng lượng sáng để em nhìn thấy vật.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Dạng năng lượng được tích trữ trong chìa khóa vặn đồ chơi hoặc trong dây cao su căng thẳng là gì?",
        choices: [
          { id: "a", label_vi: "Năng lượng ánh sáng", correct: false },
          { id: "b", label_vi: "Năng lượng nhiệt", correct: false },
          { id: "c", label_vi: "Năng lượng cơ", correct: true },
          { id: "d", label_vi: "Năng lượng điện", correct: false },
        ],
        hint1_vi:
          "Dạng năng lượng này gắn với vị trí hoặc hình dạng bị biến đổi.",
        hint2_vi: "Lò xo bị nén hoặc căng ra rồi sẽ đẩy vật chuyển động.",
        hint3_vi: "Năng lượng dự trữ trong vật bị biến dạng là năng lượng cơ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Năng lượng dự trữ trong vật bị biến dạng như lò xo, vật nâng cao hoặc dây căng gọi là năng lượng cơ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Quạt điện bật lên giúp cánh quạt quay. Điều đó chứng tỏ điện năng đã chuyển hóa thành dạng năng lượng nào?",
        choices: [
          { id: "a", label_vi: "Năng lượng hóa học", correct: false },
          { id: "b", label_vi: "Năng lượng sáng", correct: false },
          { id: "c", label_vi: "Năng lượng nhiệt", correct: false },
          { id: "d", label_vi: "Năng lượng chuyển động", correct: true },
        ],
        hint1_vi: "Hãy nghĩ đến cánh quạt khi quay.",
        hint2_vi: "Em hãy nghĩ đến điều gì đã xảy ra với cánh quạt, rồi tìm dạng năng lượng mô tả sự thay đổi đó.",
        hint3_vi:
          "Điện năng chuyển thành năng lượng chuyển động để quay cánh quạt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Quạt điện biến điện năng thành năng lượng chuyển động, làm cánh quạt quay tạo ra gió.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bếp điện nóng lên khi đun nước là ví dụ về sự chuyển hóa từ điện năng thành dạng năng lượng nào?",
        choices: [
          { id: "a", label_vi: "Năng lượng nhiệt", correct: true },
          { id: "b", label_vi: "Năng lượng sáng", correct: false },
          { id: "c", label_vi: "Năng lượng âm thanh", correct: false },
          { id: "d", label_vi: "Năng lượng chuyển động", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến cảm giác khi chạm tay vào bếp đang đun nóng.",
        hint2_vi: "Dạng năng lượng đó làm nước trong nồi nóng lên.",
        hint3_vi: "Điện năng chuyển thành năng lượng nhiệt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bếp điện biến điện năng thành năng lượng nhiệt, truyền nhiệt cho nồi và nước để đun nóng thức ăn.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em thắp đèn pin bằng pin khô. Trong đèn đó đang diễn ra sự chuyển hóa nào?",
        choices: [
          {
            id: "a",
            label_vi: "Năng lượng sáng → điện năng → năng lượng hóa học",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Năng lượng hóa học trong pin → điện năng → năng lượng sáng",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Năng lượng nhiệt → điện năng → năng lượng âm thanh",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Năng lượng chuyển động → năng lượng sáng → điện năng",
            correct: false,
          },
        ],
        hint1_vi: "Pin chứa năng lượng ở đâu?",
        hint2_vi: "Trước khi thành ánh sáng, năng lượng phải đi qua dòng điện.",
        hint3_vi:
          "Năng lượng hóa học trong pin chuyển thành điện năng, rồi điện năng chuyển thành ánh sáng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Pin khô dự trữ năng lượng hóa học; khi đóng mạch, năng lượng đó thành điện năng chạy qua bóng đèn và biến thành năng lượng sáng.",
    },
  ],
};
