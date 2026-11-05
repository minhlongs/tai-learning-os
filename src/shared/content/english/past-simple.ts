/**
 * Tiếng Anh · Thì quá khứ đơn với động từ có quy tắc (skill: eng-past-simple, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives (`GDPT2018.ENG.5.GRAM.01`).
 */
import type { LessonDefinition } from "../types";

export const pastSimple: LessonDefinition = {
  id: "eng-past-simple",
  subjectId: "english",
  skillId: "eng-past-simple",
  titleVi: "Thì quá khứ đơn với động từ có quy tắc",
  titleEn: "Past Simple with Regular Verbs",
  objectiveVi:
    "Em sẽ nhận biết và dùng dạng quá khứ của động từ có quy tắc để kể lại việc đã xảy ra.",
  objectiveEn:
    "Recognise and use the past form of regular verbs to talk about what happened.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-past-simple",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách kể lại một việc đã làm trong ngày bằng thì quá khứ đơn.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Khi kể lại việc đã xảy ra hôm qua, em cần dùng thì nào?",
        question_en:
          "Which tense do you use to talk about something that happened yesterday?",
        choices: [
          { id: "a", label_vi: "Thì hiện tại đơn", correct: false },
          { id: "b", label_vi: "Thì tương lai đơn", correct: false },
          { id: "c", label_vi: "Thì quá khứ đơn", correct: true },
          { id: "d", label_vi: "Thì hiện tại tiếp diễn", correct: false },
        ],
        hint1_vi: "Cụm “yesterday” (hôm qua) cho biết việc đã xảy ra rồi.",
        hint2_vi:
          "Theo từ “yesterday” ở đầu câu, em hãy chọn thì dùng cho việc đã kết thúc trong quá khứ.",
        hint3_vi: "Ta gọi dạng này là thì quá khứ đơn (past simple).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi kể lại việc đã xảy ra và đã kết thúc, ta dùng thì quá khứ đơn. Các cụm từ như “yesterday”, “last week”, “this morning” thường đi kèm thì này.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Dạng quá khứ của động từ có quy tắc “play” là gì?",
        question_en: "What is the past form of the regular verb “play”?",
        choices: [
          { id: "a", label_vi: "playing", correct: false },
          { id: "b", label_vi: "play", correct: false },
          { id: "c", label_vi: "played is not a form", correct: false },
          { id: "d", label_vi: "played", correct: true },
        ],
        hint1_vi: "Động từ có quy tắc thêm đuôi vào sau động từ gốc.",
        hint2_vi: "Đuôi thường dùng nhất trong thì quá khứ đơn là “-ed”.",
        hint3_vi: "Lấy “play” rồi thêm “-ed”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Động từ có quy tắc thêm “-ed” để sang dạng quá khứ đơn. “Play” trở thành “played”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Chọn câu đúng ở thì quá khứ đơn.",
        question_en: "Which sentence is correct in the past simple?",
        choices: [
          { id: "a", label_vi: "I will watch TV last night.", correct: false },
          { id: "b", label_vi: "I watched TV last night.", correct: true },
          { id: "c", label_vi: "I watch TV last night.", correct: false },
          { id: "d", label_vi: "I watching TV last night.", correct: false },
        ],
        hint1_vi: "Cụm “last night” bắt buộc dùng thì quá khứ.",
        hint2_vi:
          "Động từ chính phải ở dạng quá khứ, không phải dạng nguyên mẫu.",
        hint3_vi: "Dạng quá khứ của “watch” là “watched”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Vì có “last night”, động từ phải ở quá khứ. “Watched” là dạng quá khứ của “watch”, nên câu đúng là “I watched TV last night.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Minh kể: “I walked to school this morning.” Minh đi học bằng cách nào trong buổi sáng đó?",
        question_en:
          "Minh says: “I walked to school this morning.” How did Minh get to school?",
        choices: [
          { id: "a", label_vi: "By bus — đi xe buýt", correct: false },
          { id: "b", label_vi: "By bike — đi xe đạp", correct: false },
          { id: "c", label_vi: "On foot — đi bộ", correct: true },
          { id: "d", label_vi: "By car — đi ô tô", correct: false },
        ],
        hint1_vi: "Tìm động từ trong câu nói về cách Minh đến trường.",
        hint2_vi: "Động từ “walked” cho biết Minh đã đi bộ.",
        hint3_vi: "Đi bộ mà không dùng phương tiện được gọi là “on foot”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trong đoạn văn có câu “I walked to school this morning.” nên Minh đã đi bộ đến trường, tức là đi “on foot”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chọn câu kể lại đúng một việc em đã làm vào cuối tuần trước.",
        question_en:
          "Which sentence correctly retells something you did last weekend?",
        choices: [
          {
            id: "a",
            label_vi: "I helped my mother clean the house last weekend.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "I help my mother clean the house last weekend.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I will help my mother clean the house last weekend.",
            correct: false,
          },
          { id: "d", label_vi: "I am helping my mother last weekend.", correct: false },
        ],
        hint1_vi: "Cụm “last weekend” cho biết việc thuộc quá khứ.",
        hint2_vi:
          "Động từ “help” cần chuyển sang dạng quá khứ bằng cách thêm “-ed”.",
        hint3_vi: "Dạng quá khứ của “help” là “helped”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Vì “last weekend” chỉ thời gian đã qua, động từ phải ở quá khứ. “Helped” là dạng quá khứ của “help”, nên câu đúng là “I helped my mother clean the house last weekend.”.",
    },
  ],
};
