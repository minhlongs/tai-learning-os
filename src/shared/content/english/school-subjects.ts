/**
 * Tiếng Anh · Môn học và thời khóa biểu ở trường (skill: eng-school-subjects, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives.
 */
import type { LessonDefinition } from "../types";

export const schoolSubjects: LessonDefinition = {
  id: "eng-school-subjects",
  subjectId: "english",
  skillId: "eng-school-subjects",
  titleVi: "Môn học và thời khóa biểu ở trường",
  titleEn: "School Subjects and Timetable",
  objectiveVi:
    "Em sẽ hỏi và trả lời về các môn học có trong ngày cũng như thời khóa biểu từng thứ trong tuần bằng tiếng Anh.",
  objectiveEn:
    "Ask and answer about school subjects and weekly timetable days in English.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-school-subjects",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách đọc to thời khóa biểu hôm nay của em bằng mẫu câu “I have ... today.”.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi muốn hỏi bạn hôm nay học những môn gì ở trường, em dùng câu hỏi tiếng Anh nào?",
        question_en:
          "Which question asks a friend what school subjects they have today?",
        choices: [
          { id: "a", label_vi: "Where is your classroom today?", correct: false },
          { id: "b", label_vi: "What subjects do you have today?", correct: true },
          { id: "c", label_vi: "How old is your teacher?", correct: false },
          { id: "d", label_vi: "Who is sitting next to you?", correct: false },
        ],
        hint1_vi: "Từ “subjects” trong tiếng Anh có nghĩa là các môn học.",
        hint2_vi: "Muốn hỏi “những môn học nào”, ta mở đầu câu hỏi bằng cụm “What subjects...”.",
        hint3_vi: "Kết hợp “What subjects” với “do you have today?” để hỏi môn học hôm nay.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Mẫu câu “What subjects do you have today?” dùng để hỏi hôm nay bạn có những môn học nào. Các câu còn lại hỏi về vị trí phòng học, tuổi của giáo viên và người ngồi cạnh.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "vocab_match",
        question_vi:
          "Đồ dùng học tập nào trong tranh luôn đi cùng em trong các tiết Đọc hiểu và Khoa học?",
        word: "book",
        image: "book",
        choices: [
          { id: "a", label_en: "chair", label_vi: "cái ghế", correct: false },
          { id: "b", label_en: "table", label_vi: "cái bàn", correct: false },
          { id: "c", label_en: "bottle", label_vi: "bình nước", correct: false },
          { id: "d", label_en: "book", label_vi: "quyển sách", correct: true },
        ],
        sentencePrompt_vi: "Em hãy viết một câu tiếng Anh ngắn có từ “book”.",
        sentenceAcceptedWords: ["book"],
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Book” là quyển sách dùng để đọc bài và tra cứu kiến thức ở trường. Các từ còn lại là cái ghế (chair), cái bàn (table) và bình nước (bottle).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền giới từ chỉ ngày trong tuần thích hợp vào chỗ trống: “I have Maths, Music, and Science ___ Monday.”",
        question_en:
          "Choose the correct preposition: “I have Maths, Music, and Science ___ Monday.”",
        choices: [
          { id: "a", label_vi: "on", correct: true },
          { id: "b", label_vi: "in", correct: false },
          { id: "c", label_vi: "under", correct: false },
          { id: "d", label_vi: "behind", correct: false },
        ],
        hint1_vi: "“Monday” là thứ Hai — tên một ngày cụ thể trong tuần.",
        hint2_vi: "Trong tiếng Anh, trước các thứ từ Monday đến Sunday ta luôn dùng cùng một giới từ cố định.",
        hint3_vi: "Giới từ đi trước tên thứ trong tuần gồm hai chữ cái, bắt đầu bằng chữ “o”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Trước các ngày trong tuần như “Monday”, “Tuesday”, “Friday”, tiếng Anh luôn dùng giới từ “on”: “I have Maths, Music, and Science on Monday.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Nam nói: “In this lesson, we draw pictures and paint with colours.” Nam đang nhắc tới môn học nào?",
        question_en:
          "Nam says: “In this lesson, we draw pictures and paint with colours.” Which subject is it?",
        choices: [
          { id: "a", label_vi: "Maths — môn Toán", correct: false },
          { id: "b", label_vi: "Music — môn Âm nhạc", correct: false },
          { id: "c", label_vi: "Art — môn Mĩ thuật", correct: true },
          { id: "d", label_vi: "Science — môn Khoa học", correct: false },
        ],
        hint1_vi: "Chú ý hai hoạt động chính trong câu của Nam là “draw pictures” và “paint”.",
        hint2_vi: "“Draw pictures” là vẽ tranh, còn “paint with colours” là tô màu.",
        hint3_vi: "Môn học dạy vẽ tranh và phối màu ở trường tiểu học là môn Mĩ thuật.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Hoạt động “draw pictures” (vẽ tranh) và “paint with colours” (tô màu) thuộc môn Mĩ thuật, tiếng Anh gọi là “Art”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thứ Năm em có tiết Tiếng Anh và Khoa học. Khi bạn hỏi “What subjects do you have on Thursday?”, câu trả lời nào của em đúng và đầy đủ nhất?",
        question_en:
          "On Thursday you study English and Science. How do you answer “What subjects do you have on Thursday?”?",
        choices: [
          {
            id: "a",
            label_vi: "I have Maths and Music on Monday.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I have English and Science on Thursday.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "She having English at Thursday.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Yes, I like Art very much.",
            correct: false,
          },
        ],
        hint1_vi: "Câu hỏi dùng chủ ngữ “you” hỏi về thứ Năm (“on Thursday”) nên câu trả lời bắt đầu bằng “I have...”.",
        hint2_vi: "Tên hai môn học cần nêu là Tiếng Anh (“English”) và Khoa học (“Science”).",
        hint3_vi: "Ghép chủ ngữ “I have”, hai môn học đúng và cụm thời gian đi kèm giới từ “on” trước “Thursday”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu “I have English and Science on Thursday.” trả lời đúng môn Tiếng Anh và Khoa học, giữ đúng cấu trúc “I have ... on Thursday.”.",
    },
  ],
};
