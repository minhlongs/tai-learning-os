/**
 * Tiếng Anh · So sánh hơn với tính từ ngắn (skill: eng-comparatives, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives (`GDPT2018.ENG.5.GRAM.02`).
 */
import type { LessonDefinition } from "../types";

export const comparatives: LessonDefinition = {
  id: "eng-comparatives",
  subjectId: "english",
  skillId: "eng-comparatives",
  titleVi: "So sánh hơn với tính từ ngắn",
  titleEn: "Comparatives with Short Adjectives",
  objectiveVi:
    "Em sẽ tạo và dùng dạng so sánh hơn của tính từ ngắn để so sánh hai người hoặc hai vật.",
  objectiveEn:
    "Form and use comparatives with short adjectives to compare two people or things.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-comparatives",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách so sánh hai đồ vật quen thuộc bằng tiếng Anh.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn so sánh hơn với tính từ ngắn “tall”, em dùng dạng nào?",
        question_en: "Which form of “tall” do you use for a comparison?",
        choices: [
          { id: "a", label_vi: "taller", correct: true },
          { id: "b", label_vi: "more tall", correct: false },
          { id: "c", label_vi: "tallest", correct: false },
          { id: "d", label_vi: "talling", correct: false },
        ],
        hint1_vi: "Tính từ ngắn thường thêm một đuôi để tạo dạng so sánh hơn.",
        hint2_vi: "Đuôi dùng cho so sánh hơn là “-er”.",
        hint3_vi: "Thêm “-er” vào “tall”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Tính từ ngắn “tall” thêm “-er” thành “taller”, nghĩa là cao hơn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Từ nào thường đứng sau tính từ so sánh hơn khi nêu hai đối tượng?",
        question_en:
          "Which word usually follows a comparative adjective when comparing two things?",
        choices: [
          { id: "a", label_vi: "because", correct: false },
          { id: "b", label_vi: "and", correct: false },
          { id: "c", label_vi: "than", correct: true },
          { id: "d", label_vi: "with", correct: false },
        ],
        hint1_vi: "Mẫu câu là “A is ... B”.",
        hint2_vi: "Từ cần điền có nghĩa là “so với”.",
        hint3_vi: "Mẫu hoàn chỉnh: “A is taller than B.”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trong câu so sánh hơn, “than” đứng giữa đặc điểm so sánh và đối tượng thứ hai: “A is taller than B.”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Chọn câu đúng để nói: “Con mèo nhỏ hơn con chó.”",
        question_en: "Which sentence means “The cat is smaller than the dog”?",
        choices: [
          { id: "a", label_vi: "The cat smaller is than the dog.", correct: false },
          { id: "b", label_vi: "The cat is smaller than the dog.", correct: true },
          { id: "c", label_vi: "The cat is small than the dog.", correct: false },
          { id: "d", label_vi: "The cat is smallest the dog.", correct: false },
        ],
        hint1_vi: "Tính từ “small” là tính từ ngắn.",
        hint2_vi:
          "Thêm “-er” vào “small”, rồi đặt “than” trước đối tượng thứ hai.",
        hint3_vi: "Mẫu câu là “The cat is smaller than the dog.”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Small” thêm “-er” thành “smaller”, rồi dùng “than” trước “the dog”: “The cat is smaller than the dog.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Điền từ đúng: “A train is ___ than a bicycle.”",
        question_en: "Complete: “A train is ___ than a bicycle.”",
        choices: [
          { id: "a", label_vi: "fast", correct: false },
          { id: "b", label_vi: "fastest", correct: false },
          { id: "c", label_vi: "more faster", correct: false },
          { id: "d", label_vi: "faster", correct: true },
        ],
        hint1_vi: "Câu đang so sánh tốc độ của hai phương tiện.",
        hint2_vi: "“Fast” là tính từ ngắn nên thêm “-er”.",
        hint3_vi: "“Fast” trở thành “faster”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Fast” là tính từ ngắn nên dạng so sánh hơn là “faster”. Câu hoàn chỉnh: “A train is faster than a bicycle.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Lan 11 tuổi, Mai 10 tuổi. Câu nào đúng?",
        question_en:
          "Lan is 11 years old and Mai is 10. Which sentence is correct?",
        choices: [
          { id: "a", label_vi: "Lan is older than Mai.", correct: true },
          { id: "b", label_vi: "Lan is younger than Mai.", correct: false },
          { id: "c", label_vi: "Lan is old than Mai.", correct: false },
          { id: "d", label_vi: "Lan older Mai.", correct: false },
        ],
        hint1_vi: "Người 11 tuổi lớn tuổi hơn người 10 tuổi.",
        hint2_vi: "“Old” thêm “-er” thành “older”.",
        hint3_vi: "Dùng mẫu “Lan is older than Mai.”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Lan 11 tuổi nên lớn tuổi hơn Mai 10 tuổi. “Old” chuyển thành “older”, vì vậy câu đúng là “Lan is older than Mai.”.",
    },
  ],
};
