/**
 * Tiếng Anh · Hội thoại chào hỏi (skill: eng-dialogue, lớp 3–4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const greetingsDialogue: LessonDefinition = {
  id: "eng-greetings-dialogue",
  subjectId: "english",
  skillId: "eng-dialogue",
  titleVi: "Chào hỏi mỗi ngày",
  titleEn: "Greetings Dialogue",
  objectiveVi: "Em sẽ chào hỏi và trả lời lịch sự trong những tình huống quen thuộc.",
  objectiveEn: "Greet and answer politely in everyday situations.",
  gradeFrom: 3,
  gradeTo: 4,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Sáng đến lớp, em gặp cô giáo. Em nên nói gì?",
        question_en: "What should you say to your teacher in the morning?",
        choices: [
          { id: "a", label_vi: "Good morning, teacher!", correct: true },
          { id: "b", label_vi: "Good night, teacher!", correct: false },
          { id: "c", label_vi: "Goodbye, teacher!", correct: false },
          { id: "d", label_vi: "Thank you, teacher!", correct: false },
        ],
        hint1_vi: "Buổi sáng có một câu chào riêng, khác với ban đêm.",
        hint2_vi: "Em đang vừa gặp cô chứ không phải đang ra về.",
        hint3_vi: "Câu chào ban ngày dùng khi em gặp ai đó lúc bắt đầu buổi sáng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Good morning” dùng để chào khi gặp nhau lúc ban ngày. “Good night” là câu chúc ngủ ngon, “goodbye” dùng khi tạm biệt — cả hai không hợp lúc vừa gặp.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Bạn hỏi em: “How are you?”. Em trả lời thế nào?",
        question_en: "How do you answer 'How are you?'",
        choices: [
          { id: "a", label_vi: "I am nine years old.", correct: false },
          { id: "b", label_vi: "I am fine, thank you.", correct: true },
          { id: "c", label_vi: "My name is Nam.", correct: false },
          { id: "d", label_vi: "Goodbye!", correct: false },
        ],
        hint1_vi: "Câu hỏi đó hỏi em đang thế nào, chứ không hỏi tên hay tuổi.",
        hint2_vi: "Em hãy trả lời về sức khỏe của mình.",
        hint3_vi: "Câu trả lời lịch sự thường có lời cảm ơn ở cuối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“How are you?” hỏi về sức khỏe nên em trả lời mình đang khoẻ và nói lời cảm ơn. Trả lời tuổi hay tên là hợp với câu hỏi khác.",
    },
    {
      position: 3,
      kind: "visual",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu chào nào nghĩa là “Xin chào” và dùng được khi em gặp bất kỳ ai?",
        question_en: "Which greeting means 'hello' and fits anyone you meet?",
        choices: [
          { id: "a", label_vi: "Hello!", correct: true },
          { id: "b", label_vi: "Goodbye!", correct: false },
          { id: "c", label_vi: "Sorry!", correct: false },
          { id: "d", label_vi: "Please!", correct: false },
        ],
        hint1_vi: "Em cần một lời chào khi vừa gặp, chứ không phải lúc chia tay.",
        hint2_vi: "“Goodbye” chỉ dùng khi em sắp rời đi.",
        hint3_vi: "Hai đáp án còn lại dùng khi em xin lỗi hoặc nhờ vả.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Hello!” là câu chào khi em gặp ai đó. “Goodbye” dùng lúc tạm biệt, còn “sorry” và “please” là lời xin lỗi và lời nhờ vả — không phải lời chào.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Em muốn mượn bút của bạn. Em nên bắt đầu bằng câu nào?",
        question_en: "How should you start asking for a pen?",
        choices: [
          { id: "a", label_vi: "Give me your pen!", correct: false },
          { id: "b", label_vi: "Excuse me, may I borrow your pen?", correct: true },
          { id: "c", label_vi: "I want that pen.", correct: false },
          { id: "d", label_vi: "Take my pen.", correct: false },
        ],
        hint1_vi: "Khoản cho mượn, em đang xin phép chứ không ra lệnh.",
        hint2_vi: "Câu lịch sự thường bắt đầu bằng một câu xin phép ngắn.",
        hint3_vi: "“Excuse me” là câu quen thuộc để bắt đầu nhờ bạn một cách nhẹ nhàng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Excuse me, may I borrow your pen?” nhờ bạn một cách lịch sự. Còn “Give me...” là ra lệnh, nghe như em đang ép bạn đưa bút.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Bạn nhường em một chỗ ngồi. Em nên nói gì?",
        question_en: "What should you say when a friend offers you a seat?",
        choices: [
          { id: "a", label_vi: "That is my seat.", correct: false },
          { id: "b", label_vi: "Thank you!", correct: true },
          { id: "c", label_vi: "Excuse me!", correct: false },
          { id: "d", label_vi: "Goodbye!", correct: false },
        ],
        hint1_vi: "Bạn vừa làm một điều tốt với em.",
        hint2_vi: "Em cần một câu bày tỏ sự biết ơn.",
        hint3_vi: "Câu cảm ơn ngắn quen thuộc có hai tiếng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bạn vừa giúp em nên em nói “Thank you!” để bày tỏ lòng biết ơn. “Excuse me” dùng để xin phép, còn “goodbye” là lời chào tạm biệt.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em đến nhà bạn chơi lần đầu và gõ cửa. Bạn ra mở cửa. Em nên nói gì?",
        question_en: "What should you say at your friend's door?",
        choices: [
          { id: "a", label_vi: "Goodbye! See you.", correct: false },
          { id: "b", label_vi: "Hello! Thank you for having me.", correct: true },
          { id: "c", label_vi: "Sorry, go away.", correct: false },
          { id: "d", label_vi: "Good night! Sleep well.", correct: false },
        ],
        hint1_vi: "Em đang đến chơi nhà bạn, chưa phải lúc ra về.",
        hint2_vi: "Em vừa được mời đến nhà bạn.",
        hint3_vi: "Lời chào nên đi kèm lời cảm ơn vì đã được mời.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Em vừa đến nhà bạn nên chào và cảm ơn vì đã được mời. Các đáp án còn lại là lời tạm biệt, một câu khiến bạn phật ý, hoặc câu chúc ngủ ngon — không phù hợp lúc vừa đến cửa.",
    },
  ],
};
