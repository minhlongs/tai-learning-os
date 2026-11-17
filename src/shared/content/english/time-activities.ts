/**
 * Tiếng Anh · Hỏi giờ và hoạt động trong ngày (skill: eng-time-activities, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives.
 */
import type { LessonDefinition } from "../types";

export const timeActivities: LessonDefinition = {
  id: "eng-time-activities",
  subjectId: "english",
  skillId: "eng-time-activities",
  titleVi: "Hỏi giờ và hoạt động trong ngày",
  titleEn: "Telling the Time and Daily Activities",
  objectiveVi:
    "Em sẽ hỏi và trả lời về giờ giấc trên đồng hồ cũng như thời điểm thực hiện các hoạt động hằng ngày bằng tiếng Anh.",
  objectiveEn:
    "Ask and answer about clock times and when daily activities happen in English.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-time-activities",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách nhìn đồng hồ trong nhà rồi nói giờ và hoạt động của em bằng tiếng Anh.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi kim đồng hồ chỉ đúng 6 giờ 30 phút và bạn hỏi “What time is it?”, em trả lời thế nào?",
        question_en:
          "The clock shows 6:30. How do you answer “What time is it?”?",
        choices: [
          { id: "a", label_vi: "It's six o'clock.", correct: false },
          { id: "b", label_vi: "It's thirty six o'clock.", correct: false },
          { id: "c", label_vi: "It's six thirty.", correct: true },
          { id: "d", label_vi: "I am six years old.", correct: false },
        ],
        hint1_vi: "Cụm “o'clock” chỉ dùng cho giờ đúng (khi số phút bằng không).",
        hint2_vi: "Với 6 giờ 30 phút, ta đọc số giờ trước rồi đọc tiếp số phút ở phía sau.",
        hint3_vi: "Số 6 là “six” và số 30 là “thirty”, mở đầu câu bằng “It's...”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi nói giờ lẻ có số phút như 6 giờ 30 phút, ta ghép giờ trước phút sau thành “It's six thirty.” và không thêm “o'clock” ở cuối.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền giới từ chỉ giờ đúng vào câu sau: “I get up ___ six o'clock every morning.”",
        question_en:
          "Complete the sentence: “I get up ___ six o'clock every morning.”",
        choices: [
          { id: "a", label_vi: "at", correct: true },
          { id: "b", label_vi: "on", correct: false },
          { id: "c", label_vi: "under", correct: false },
          { id: "d", label_vi: "from", correct: false },
        ],
        hint1_vi: "Phía sau chỗ trống là “six o'clock” — một mốc giờ cụ thể trên đồng hồ.",
        hint2_vi: "Giới từ “on” đi với thứ trong tuần, còn mốc giờ cụ thể cần một giới từ ngắn khác.",
        hint3_vi: "Giới từ đứng trước giờ giấc gồm hai chữ cái, bắt đầu bằng “a” và kết thúc bằng “t”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Trước một mốc giờ cụ thể trên đồng hồ như “six o'clock” hay “seven fifteen”, tiếng Anh dùng giới từ “at”: “I get up at six o'clock.”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn hỏi bạn Mai thức dậy lúc mấy giờ, câu hỏi nào sau đây đúng ngữ pháp?",
        question_en:
          "Which question correctly asks what time a friend gets up?",
        choices: [
          { id: "a", label_vi: "What time you get up?", correct: false },
          { id: "b", label_vi: "Where time do you get up?", correct: false },
          { id: "c", label_vi: "What time are you get up?", correct: false },
          { id: "d", label_vi: "What time do you get up?", correct: true },
        ],
        hint1_vi: "Để hỏi “lúc mấy giờ”, câu hỏi bắt đầu bằng cụm “What time...”.",
        hint2_vi: "“Get up” là động từ thường, nên khi hỏi với chủ ngữ “you” cần mượn trợ động từ.",
        hint3_vi: "Đặt trợ động từ “do” ngay trước “you get up” để hoàn chỉnh câu hỏi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Mẫu câu hỏi giờ thực hiện một hoạt động hằng ngày với chủ ngữ “you” là “What time do you + động từ nguyên mẫu?”, nên câu đúng là “What time do you get up?”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc đoạn hội thoại ngắn: “An: What time do you go to school? — Linh: I go to school at seven fifteen.” Linh đi học lúc mấy giờ?",
        question_en:
          "Read: “An: What time do you go to school? — Linh: I go to school at seven fifteen.” When does Linh go to school?",
        choices: [
          { id: "a", label_vi: "Lúc 7 giờ đúng", correct: false },
          { id: "b", label_vi: "Lúc 7 giờ 15 phút", correct: true },
          { id: "c", label_vi: "Lúc 7 giờ 50 phút", correct: false },
          { id: "d", label_vi: "Lúc 6 giờ 15 phút", correct: false },
        ],
        hint1_vi: "Tìm cụm từ chỉ thời gian đứng sau giới từ “at” trong câu trả lời của Linh.",
        hint2_vi: "“Seven” là số 7 chỉ giờ; em hãy nhớ lại nghĩa của từ “fifteen” đứng ngay sau đó.",
        hint3_vi: "“Fifteen” là 15 (khác với “fifty” là 50), nên đó là số phút sau 7 giờ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Seven” là 7 và “fifteen” là 15, nên cụm “at seven fifteen” có nghĩa là vào lúc 7 giờ 15 phút.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Buổi tối em ăn tối cùng gia đình lúc 6 giờ 45 phút và đi ngủ lúc 9 giờ đúng. Câu tiếng Anh nào diễn tả đúng hai mốc giờ này?",
        question_en:
          "You have dinner at 6:45 and go to bed at 9:00. Which sentence describes this accurately?",
        choices: [
          {
            id: "a",
            label_vi: "I having dinner six forty-five and goes to bed nine.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I have dinner on six forty-five and go to bed on nine o'clock.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I have dinner at nine o'clock and go to bed at six forty-five.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "I have dinner at six forty-five and go to bed at nine o'clock.",
            correct: true,
          },
        ],
        hint1_vi: "Kiểm tra thứ tự hai hoạt động: ăn tối (“have dinner”) lúc 6:45 và đi ngủ (“go to bed”) lúc 9:00.",
        hint2_vi: "6 giờ 45 phút đọc là “six forty-five”, còn 9 giờ đúng đọc là “nine o'clock”.",
        hint3_vi: "Cả hai mốc giờ đều phải có giới từ “at” đứng ngay phía trước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "6 giờ 45 phút là “six forty-five”, 9 giờ đúng là “nine o'clock”, và cả hai đều đi với giới từ “at”, nên câu đúng là “I have dinner at six forty-five and go to bed at nine o'clock.”.",
    },
  ],
};
