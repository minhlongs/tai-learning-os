/**
 * Tiếng Anh · Khảo sát năng lực đầu vào Tiếng Anh Lớp 5 (skill: eng-past-simple, lớp 5)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering core grade-level prerequisites.
 */
import type { LessonDefinition } from "../types";

export const baselineEnglishGrade5: LessonDefinition = {
  id: "eng-baseline-grade5",
  subjectId: "english",
  skillId: "eng-past-simple",
  titleVi: "Khảo sát đầu vào Tiếng Anh Lớp 5",
  titleEn: "English Grade 5 Baseline Diagnostic",
  objectiveVi:
    "Khảo sát nhẹ nhàng khả năng hiểu từ vựng và câu tiếng Anh quen thuộc trước khi học lớp 5.",
  objectiveEn:
    "Gentle baseline check of familiar English vocabulary and sentence patterns before Grade 5.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-past-simple",
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
        question_vi: "Câu chào nào phù hợp khi em gặp giáo viên vào buổi sáng?",
        question_en:
          "Which greeting is suitable when you meet your teacher in the morning?",
        choices: [
          { id: "a", label_vi: "Good night, teacher.", correct: false },
          { id: "b", label_vi: "Goodbye, teacher.", correct: false },
          { id: "c", label_vi: "Good morning, teacher.", correct: true },
          { id: "d", label_vi: "See you yesterday, teacher.", correct: false },
        ],
        hint1_vi: "Thời điểm là buổi sáng.",
        hint2_vi: "“Morning” nghĩa là buổi sáng.",
        hint3_vi: "Cách chào bắt đầu bằng “Good morning”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Vào buổi sáng, cách chào phù hợp là “Good morning, teacher.”. “Good night” dùng khi chúc ngủ ngon.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "vocab_match",
        question_vi: "Từ tiếng Anh nào chỉ đồ vật dùng để đọc trong tranh?",
        word: "book",
        image: "book",
        choices: [
          { id: "a", label_en: "apple", label_vi: "quả táo", correct: false },
          { id: "b", label_en: "chair", label_vi: "cái ghế", correct: false },
          { id: "c", label_en: "window", label_vi: "cửa sổ", correct: false },
          { id: "d", label_en: "book", label_vi: "quyển sách", correct: true },
        ],
        sentencePrompt_vi: "Em hãy viết một câu tiếng Anh ngắn có từ “book”.",
        sentenceAcceptedWords: ["book"],
      },
      answerKey: JSON.stringify({ correctChoiceId: "d", word: "book" }),
      explanationVi: "“Book” nghĩa là quyển sách, đồ vật dùng để đọc.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Chọn câu đúng để giới thiệu: “Đây là ngôi nhà của tôi.”",
        question_en: "Which sentence means “Đây là ngôi nhà của tôi”?",
        choices: [
          { id: "a", label_vi: "This is my house.", correct: true },
          { id: "b", label_vi: "My this house.", correct: false },
          { id: "c", label_vi: "These my house is.", correct: false },
          { id: "d", label_vi: "This are my house.", correct: false },
        ],
        hint1_vi: "“Đây là” được diễn đạt bằng “This is”.",
        hint2_vi: "“Ngôi nhà của tôi” là “my house”.",
        hint3_vi: "Ghép lại thành “This is my house.”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“This is” nghĩa là “đây là”, “my house” nghĩa là “ngôi nhà của tôi”. Câu hoàn chỉnh là “This is my house.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Điền động từ đúng: “She ___ to school every day.”",
        question_en: "Complete: “She ___ to school every day.”",
        choices: [
          { id: "a", label_vi: "go", correct: false },
          { id: "b", label_vi: "goes", correct: true },
          { id: "c", label_vi: "going", correct: false },
          { id: "d", label_vi: "gone", correct: false },
        ],
        hint1_vi: "“Every day” cho biết đây là thói quen ở hiện tại.",
        hint2_vi:
          "Với chủ ngữ “she”, động từ hiện tại đơn cần thêm “-s” hoặc “-es”.",
        hint3_vi: "Động từ “go” thêm “-es” thành “goes”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Với chủ ngữ ngôi thứ ba số ít “she”, động từ “go” thêm “-es”: “She goes to school every day.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Hôm qua em đã chơi cầu lông. Câu nào đúng?",
        question_en:
          "You played badminton yesterday. Which sentence is correct?",
        choices: [
          { id: "a", label_vi: "I play badminton yesterday.", correct: false },
          { id: "b", label_vi: "I playing badminton yesterday.", correct: false },
          { id: "c", label_vi: "I will play badminton yesterday.", correct: false },
          { id: "d", label_vi: "I played badminton yesterday.", correct: true },
        ],
        hint1_vi: "“Yesterday” cho biết việc đã xảy ra trong quá khứ.",
        hint2_vi: "Động từ “play” là động từ có quy tắc.",
        hint3_vi: "Thêm “-ed” vào “play” để được “played”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Vì có “yesterday”, động từ phải ở quá khứ. “Play” thêm “-ed” thành “played”: “I played badminton yesterday.”.",
    },
  ],
};
