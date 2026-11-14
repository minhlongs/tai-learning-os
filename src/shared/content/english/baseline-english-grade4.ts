/**
 * Tiếng Anh · Khảo sát đầu vào Tiếng Anh Lớp 4 (skill: eng-voc-noun, lớp 4)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate vocabulary and basic phrasing check.
 */
import type { LessonDefinition } from "../types";

export const baselineEnglishGrade4: LessonDefinition = {
  id: "eng-baseline-grade4",
  subjectId: "english",
  skillId: "eng-voc-noun",
  titleVi: "Khảo sát đầu vào Tiếng Anh Lớp 4",
  titleEn: "English Grade 4 Baseline Diagnostic",
  objectiveVi: "Khảo sát từ vựng đồ vật và mẫu câu giao tiếp đơn giản đầu lớp 4.",
  objectiveEn: "Baseline check of everyday nouns and simple communicative patterns for Grade 4.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-voc-noun",
  provenance: "original_supplemental",
  sourceRef: "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Khảo sát nhẹ nhàng, giúp phụ huynh biết từ vựng quen thuộc của bé.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Đồ vật dùng để viết bài trong hộp bút tiếng Anh gọi là gì?",
        question_en: "What do we call the item used to write in a pencil case?",
        choices: [
          { id: "a", label_vi: "pen", correct: true },
          { id: "b", label_vi: "ruler", correct: false },
          { id: "c", label_vi: "eraser", correct: false },
          { id: "d", label_vi: "book", correct: false },
        ],
        hint1_vi: "Từ này bắt đầu bằng chữ 'p' và có 3 chữ cái.",
        hint2_vi: "Ruler là cây thước, book là quyển sách.",
        hint3_vi: "Pen là cái bút mực.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "Pen là cây bút. Ruler là thước kẻ, eraser là cục tẩy, book là quyển sách.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Khi muốn hỏi 'Đây là cái gì?', em dùng câu nào?",
        question_en: "How do you ask 'What is this?' in English?",
        choices: [
          { id: "a", label_vi: "What is your name?", correct: false },
          { id: "b", label_vi: "What is this?", correct: true },
          { id: "c", label_vi: "How are you?", correct: false },
          { id: "d", label_vi: "Where do you live?", correct: false },
        ],
        hint1_vi: "'What' nghĩa là cái gì, 'this' nghĩa là cái này/đây.",
        hint2_vi: "Câu 'What is your name?' dùng để hỏi tên.",
        hint3_vi: "Để hỏi về đồ vật ở gần em dùng 'What is this?'.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "'What is this?' có nghĩa là 'Đây là cái gì?'.",
    },
    {
      position: 3,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Chọn câu trả lời đúng cho câu hỏi: 'What is this?' (chỉ vào một quyển sách)",
        question_en: "Choose the correct answer for 'What is this?' pointing to a book:",
        choices: [
          { id: "a", label_vi: "It is a book.", correct: true },
          { id: "b", label_vi: "Yes, it is.", correct: false },
          { id: "c", label_vi: "I am fine.", correct: false },
          { id: "d", label_vi: "He is a student.", correct: false },
        ],
        hint1_vi: "Câu hỏi bắt đầu bằng 'What' thì cần nêu tên đồ vật.",
        hint2_vi: "Đồ vật được nhắc đến là quyển sách (book).",
        hint3_vi: "Mẫu câu trả lời là 'It is a book.'",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "Khi ai đó hỏi 'What is this?', ta trả lời 'It is a book.' (Đó là một quyển sách).",
    },
    {
      position: 4,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "An muốn giới thiệu với bạn: 'Đây là cặp sách của mình.' An nên nói câu nào?",
        question_en: "An wants to introduce: 'This is my school bag.' What should An say?",
        choices: [
          { id: "a", label_vi: "This is my school bag.", correct: true },
          { id: "b", label_vi: "My bag is blue.", correct: false },
          { id: "c", label_vi: "Open your bag.", correct: false },
          { id: "d", label_vi: "I like books.", correct: false },
        ],
        hint1_vi: "'This is...' nghĩa là 'Đây là...'.",
        hint2_vi: "'my school bag' nghĩa là cặp sách của tôi/của mình.",
        hint3_vi: "Ghép lại: 'This is my school bag.'",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "'This is my school bag.' nghĩa là 'Đây là cặp sách của mình.'",
    },
  ],
};
