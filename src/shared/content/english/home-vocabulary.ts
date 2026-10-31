/**
 * Tiếng Anh · Từ vựng trong nhà (skill: eng-voc-home, lớp 3–4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives (`GDPT2018.ENG.4.VOC.02`).
 */
import type { LessonDefinition } from "../types";

export const homeVocabulary: LessonDefinition = {
  id: "eng-home-vocabulary",
  subjectId: "english",
  skillId: "eng-voc-home",
  titleVi: "Từ vựng đồ vật trong nhà",
  titleEn: "Things at Home",
  objectiveVi: "Em sẽ nhận biết và đặt câu đơn giản với các từ chỉ đồ vật quen thuộc trong ngôi nhà.",
  objectiveEn: "Recognise and use vocabulary for common household objects in simple sentences.",
  gradeFrom: 3,
  gradeTo: 4,
  objectiveId: "obj-eng-voc-home",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Ôn lại sau 1 ngày và 3 ngày bằng cách gọi tên đồ vật thật trong phòng khách và phòng học.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Khi giới thiệu một đồ vật có ở trong phòng bằng tiếng Anh, mẫu câu nào sau đây tự nhiên và đúng ngữ pháp?",
        question_en: "Which pattern correctly names an object in a room?",
        choices: [
          { id: "a", label_vi: "This is a table in the room.", correct: true },
          { id: "b", label_vi: "Table is run fast.", correct: false },
          { id: "c", label_vi: "In room a table is this.", correct: false },
          { id: "d", label_vi: "A table sleeping.", correct: false },
        ],
        hint1_vi: "Để giới thiệu một đồ vật ở gần, ta bắt đầu bằng cụm từ “This is a…”.",
        hint2_vi: "Sau “This is a…” là danh từ chỉ đồ vật, rồi đến cụm chỉ nơi chốn “in the room”.",
        hint3_vi: "Em hãy chọn câu bắt đầu bằng “This is a table…”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Mẫu câu “This is a + danh từ + in the room” giúp giới thiệu rõ ràng một đồ vật trong phòng. Các câu còn lại sai trật tự từ hoặc ghép động từ không phù hợp.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "vocab_match",
        question_vi: "Từ tiếng Anh nào dùng để gọi đồ vật trong tranh?",
        word: "table",
        image: "table",
        choices: [
          { id: "a", label_en: "table", label_vi: "cái bàn", correct: true },
          { id: "b", label_en: "tree", label_vi: "cây xanh", correct: false },
          { id: "c", label_en: "cat", label_vi: "con mèo", correct: false },
          { id: "d", label_en: "apple", label_vi: "quả táo", correct: false },
        ],
        sentencePrompt_vi: "Em hãy viết một câu tiếng Anh ngắn có từ “table”.",
        sentenceAcceptedWords: ["table"],
      },
      answerKey: JSON.stringify({ correctChoiceId: "a", word: "table" }),
      explanationVi:
        "“Table” nghĩa là cái bàn. Các từ còn lại là cây xanh (tree), con mèo (cat) và quả táo (apple).",
    },
    {
      position: 3,
      kind: "visual",
      content: {
        type: "vocab_match",
        question_vi: "Từ tiếng Anh nào chỉ bộ phận đón ánh sáng trên tường ngôi nhà trong tranh?",
        word: "window",
        image: "window",
        choices: [
          { id: "a", label_en: "bottle", label_vi: "cái chai", correct: false },
          { id: "b", label_en: "window", label_vi: "cửa sổ", correct: true },
          { id: "c", label_en: "dog", label_vi: "con chó", correct: false },
          { id: "d", label_en: "book", label_vi: "quyển sách", correct: false },
        ],
        sentencePrompt_vi: "Em hãy viết một câu tiếng Anh ngắn có từ “window”.",
        sentenceAcceptedWords: ["window"],
      },
      answerKey: JSON.stringify({ correctChoiceId: "b", word: "window" }),
      explanationVi:
        "“Window” nghĩa là cửa sổ — nơi đón ánh sáng và gió vào phòng. Các đáp án khác là cái chai, con chó và quyển sách.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Chọn câu điền đúng từ chỉ đồ vật trong nhà vào chỗ trống: “I sit on a ___ at my desk.”",
        question_en: "Complete the sentence: 'I sit on a ___ at my desk.'",
        choices: [
          { id: "a", label_vi: "chair", correct: true },
          { id: "b", label_vi: "window", correct: false },
          { id: "c", label_vi: "bottle", correct: false },
          { id: "d", label_vi: "apple", correct: false },
        ],
        hint1_vi: "Động từ “sit on” nghĩa là ngồi lên.",
        hint2_vi: "Khi ngồi ở bàn học (desk), em ngồi trên đồ vật nào?",
        hint3_vi: "“Chair” nghĩa là cái ghế.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Sit on a chair” nghĩa là ngồi trên ghế. Cửa sổ (window), cái chai (bottle) và quả táo (apple) không phải đồ vật để ngồi học.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Nhóm nào sau đây gồm toàn các từ vựng chỉ ngôi nhà và đồ vật trong nhà?",
        question_en: "Which group contains only home and household words?",
        choices: [
          { id: "a", label_vi: "house, table, chair, window", correct: true },
          { id: "b", label_vi: "house, run, happy, green", correct: false },
          { id: "c", label_vi: "dog, cat, jump, sleep", correct: false },
          { id: "d", label_vi: "fast, slow, tall, short", correct: false },
        ],
        hint1_vi: "Em hãy kiểm tra từng từ trong nhóm xem có phải tên gọi của ngôi nhà hoặc đồ vật trong nhà không.",
        hint2_vi: "Loại bỏ các nhóm có động từ (run, jump) hoặc tính từ (happy, fast).",
        hint3_vi: "Nhóm đầu tiên gồm ngôi nhà, cái bàn, cái ghế và cửa sổ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“House” (ngôi nhà), “table” (cái bàn), “chair” (cái ghế) và “window” (cửa sổ) đều là các danh từ thuộc chủ đề gia đình và ngôi nhà.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Buổi sáng phòng học hơi tối nên mẹ bảo em mở cửa sổ để đón ánh nắng. Câu tiếng Anh nào diễn đạt đúng lời của mẹ?",
        question_en: "Which sentence means 'Open the window to let the sunlight in'?",
        choices: [
          { id: "a", label_vi: "Please open the window.", correct: true },
          { id: "b", label_vi: "Please eat the apple.", correct: false },
          { id: "c", label_vi: "Please read the book.", correct: false },
          { id: "d", label_vi: "Please drink the bottle.", correct: false },
        ],
        hint1_vi: "Từ khóa trong tình huống này là “mở cửa sổ”.",
        hint2_vi: "Động từ “mở” là “open”, còn “cửa sổ” trong tiếng Anh là gì?",
        hint3_vi: "Kết hợp “open” với “the window”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Please open the window.” nghĩa là “Con hãy mở cửa sổ nhé.” — phù hợp với tình huống phòng tối cần đón ánh sáng tự nhiên.",
    },
  ],
};
