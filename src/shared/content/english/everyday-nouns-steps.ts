/**
 * Tiếng Anh · Danh từ thông dụng (skill: eng-voc-noun, lớp 3–4)
 *
 * Steps only — the lesson lives in `everyday-nouns.ts`. Authored for TAI
 * Learning OS; original content.
 */
import type { LessonStep } from "../types";

export const everydayNounsSteps: LessonStep[] = [
  {
    position: 1,
    kind: "concept",
    content: {
      type: "multiple_choice",
      question_vi: "Danh từ thường là loại từ chỉ điều gì?",
      question_en: "What do nouns usually name?",
      choices: [
        { id: "a", label_vi: "Người, con vật hoặc đồ vật.", correct: true },
        { id: "b", label_vi: "Cách làm một việc.", correct: false },
        { id: "c", label_vi: "Màu sắc của đồ vật.", correct: false },
        { id: "d", label_vi: "Cảm xúc của em lúc đang học.", correct: false },
      ],
      hint1_vi: "Em hãy nhìn quanh lớp và chỉ một thứ em có thể đặt tên được.",
      hint2_vi: "Cái bàn, cái ghế, bạn học… những thứ đó có tên gọi được không?",
      hint3_vi: "Danh từ là từ đặt tên cho thứ, chứ không phải mô tả thứ làm gì.",
    },
    answerKey: JSON.stringify({ correctChoiceId: "a" }),
    explanationVi:
      "Danh từ là từ dùng để gọi tên: bạn Nam, con mèo, quyển vở. Từ mô tả cách làm hoặc màu sắc là loại từ khác, chúng không đặt tên cho đồ vật.",
  },
  {
    position: 2,
    kind: "visual",
    content: {
      type: "vocab_match",
      question_vi: "Từ nào dùng để gọi đồ vật trong tranh?",
      word: "book",
      image: "book",
      choices: [
        { id: "a", label_en: "book", label_vi: "quyển sách", correct: true },
        { id: "b", label_en: "apple", label_vi: "quả táo", correct: false },
        { id: "c", label_en: "chair", label_vi: "cái ghế", correct: false },
        { id: "d", label_en: "tree", label_vi: "cây xanh", correct: false },
      ],
      sentencePrompt_vi: "Em hãy viết một câu ngắn có chữ “book”.",
      sentenceAcceptedWords: ["book"],
    },
    answerKey: JSON.stringify({ correctChoiceId: "a", word: "book" }),
    explanationVi:
      "Tranh vẽ một vật có trang giấy, bìa và được dùng để đọc — đó là quyển sách, tiếng Anh là “book”. Các đáp án khác là táo, ghế và cây xanh, là những đồ vật khác.",
  },
  {
    position: 3,
    kind: "visual",
    content: {
      type: "vocab_match",
      question_vi: "Từ nào dùng để gọi đồ vật trong tranh?",
      word: "house",
      image: "house",
      choices: [
        { id: "a", label_en: "house", label_vi: "ngôi nhà", correct: true },
        { id: "b", label_en: "window", label_vi: "cửa sổ", correct: false },
        { id: "c", label_en: "bottle", label_vi: "cái chai", correct: false },
        { id: "d", label_en: "table", label_vi: "cái bàn", correct: false },
      ],
      sentencePrompt_vi: "Em hãy viết một câu ngắn có chữ “house”.",
      sentenceAcceptedWords: ["house"],
    },
    answerKey: JSON.stringify({ correctChoiceId: "a", word: "house" }),
    explanationVi:
      "Tranh vẽ một chỗ có người ở, có cửa và mái — đó là ngôi nhà, tiếng Anh là “house”. Cửa sổ và cửa chính chỉ là một phần nhỏ của ngôi nhà.",
  },
  {
    position: 4,
    kind: "guided",
    content: {
      type: "multiple_choice",
      question_vi: "Trong nhóm từ nào sau đây, cả ba từ đều là danh từ?",
      question_en: "Which group has three nouns?",
      choices: [
        { id: "a", label_vi: "dog, run, jump", correct: false },
        { id: "b", label_vi: "dog, cat, bird", correct: true },
        { id: "c", label_vi: "big, small, tall", correct: false },
        { id: "d", label_vi: "quickly, slowly, softly", correct: false },
      ],
      hint1_vi: "Em hãy hỏi từng từ: từ này gọi tên một thứ được không?",
      hint2_vi: "Nhóm c có những từ dùng để so sánh kích thước, không phải đặt tên.",
      hint3_vi: "Nhóm a chỉ có một từ đặt tên con vật, hai từ còn lại chỉ hoạt động.",
    },
    answerKey: JSON.stringify({ correctChoiceId: "b" }),
    explanationVi:
      "Cả “dog”, “cat”, “bird” đều đặt tên cho con vật. “Run” và “jump” chỉ hoạt động, còn “big”, “small”, “tall” chỉ mô tả kích thước, nên không phải danh từ.",
  },
  {
    position: 5,
    kind: "independent",
    content: {
      type: "multiple_choice",
      question_vi: "Từ nào sau đây là danh từ?",
      question_en: "Which word is a noun?",
      choices: [
        { id: "a", label_vi: "singly", correct: false },
        { id: "b", label_vi: "apple", correct: true },
        { id: "c", label_vi: "sing", correct: false },
        { id: "d", label_vi: "happy", correct: false },
      ],
      hint1_vi: "Danh từ là từ đặt tên cho một thứ có thể nhìn thấy hoặc chạm vào.",
      hint2_vi: "Thử xem từ nào trong các đáp án là tên một loại trái cây.",
      hint3_vi: "“Sing” chỉ một việc làm, “happy” chỉ cảm xúc, “singly” chỉ cách thức.",
    },
    answerKey: JSON.stringify({ correctChoiceId: "b" }),
    explanationVi:
      "“Apple” là tên một loại trái cây, nên là danh từ. “Sing” nói về việc làm, “happy” nói về cảm xúc, “singly” nói về cách thức, ba từ đó không đặt tên đồ vật.",
  },
  {
    position: 6,
    kind: "transfer",
    content: {
      type: "multiple_choice",
      question_vi:
        "Em muốn viết một câu bằng tiếng Anh kể về con vật em đang nuôi ở nhà. Em cần dùng danh từ nào?",
      question_en: "Which noun would you use in your sentence?",
      choices: [
        { id: "a", label_vi: "happy", correct: false },
        { id: "b", label_vi: "cat", correct: true },
        { id: "c", label_vi: "sleep", correct: false },
        { id: "d", label_vi: "very", correct: false },
      ],
      hint1_vi: "Câu cần một từ để gọi tên con vật ấy.",
      hint2_vi: "Em hãy loại các từ chỉ cảm xúc, chỉ việc làm hoặc chỉ mức độ.",
      hint3_vi: "Chỉ còn một đáp án là tên của một con vật đặt được tên.",
    },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
      "“Cat” đặt tên con vật nên mới làm được chủ đề của câu. “Happy” chỉ cảm xúc, “sleep” chỉ việc làm, “very” chỉ dùng để nhấn mạnh — không từ nào trong đó gọi tên được con vật.",
  },
];
