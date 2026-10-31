/**
 * Tiếng Việt · Bài học từ câu chuyện (skill: vie-story-lesson, lớp 4–5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives (`GDPT2018.VIE.4.READ.03`).
 */
import type { LessonDefinition } from "../types";

export const storyLesson: LessonDefinition = {
  id: "vie-story-lesson",
  subjectId: "vietnamese",
  skillId: "vie-story-lesson",
  titleVi: "Rút ra bài học từ câu chuyện",
  titleEn: "Finding the Moral of a Story",
  objectiveVi:
    "Em sẽ biết dựa vào hành động của nhân vật và kết quả của câu chuyện để rút ra bài học ý nghĩa.",
  objectiveEn:
    "Identify the moral or message of a story from the characters' actions and outcomes.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-vie-story-lesson",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách kể lại một câu chuyện ngắn và nêu điều em học được.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Muốn rút ra bài học từ một câu chuyện, em cần chú ý nhất vào điều gì?",
        question_en: "What should you pay most attention to when finding the moral of a story?",
        choices: [
          {
            id: "a",
            label_vi: "Hành động của nhân vật trước khó khăn và kết quả mà nhân vật nhận được.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Số lượng câu văn có trong bài đọc.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Màu áo hoặc tên gọi của từng nhân vật.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chỉ đọc câu đầu tiên của câu chuyện.",
            correct: false,
          },
        ],
        hint1_vi: "Bài học của câu chuyện thường nằm ở cách nhân vật cư xử và kết quả cuối bài.",
        hint2_vi: "Màu áo hay số lượng câu văn có cho ta biết điều nên làm hay không nên làm không?",
        hint3_vi: "Hãy nối hành động của nhân vật với kết quả tốt đẹp ở cuối truyện.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bài học của câu chuyện được thể hiện qua cách nhân vật lựa chọn hành động khi gặp thử thách và kết quả mà hành động đó mang lại.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Hạt giống nhỏ kiên trì",
        passage_vi:
          "Mùa xuân đến, hai hạt giống nằm cạnh nhau dưới lớp đất ẩm. Hạt giống thứ nhất sợ bên trên có gió lạnh nên cứ nằm yên trong vỏ cứng. Hạt giống thứ hai mỗi ngày đều cố gắng vươn rễ xuống sâu và đẩy mầm xanh lên khỏi mặt đất. Ít lâu sau, hạt giống thứ hai đón được nắng ấm và nở hoa rực rỡ, còn hạt giống thứ nhất vẫn nằm im trong bóng tối. Nhờ dám vượt qua nỗi sợ để vươn lên, mầm cây nhỏ đã lớn thành cây khỏe mạnh.",
        question_vi: "Câu nào trong bài nêu rõ bài học từ sự cố gắng của hạt giống thứ hai?",
        choices: [
          {
            id: "a",
            label_vi: "Mùa xuân đến, hai hạt giống nằm cạnh nhau dưới lớp đất ẩm.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Hạt giống thứ nhất sợ bên trên có gió lạnh nên cứ nằm yên trong vỏ cứng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nhờ dám vượt qua nỗi sợ để vươn lên, mầm cây nhỏ đã lớn thành cây khỏe mạnh.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Hạt giống thứ nhất vẫn nằm im trong bóng tối.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Nhờ dám vượt qua nỗi sợ để vươn lên, mầm cây nhỏ đã lớn thành cây khỏe mạnh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu cuối bài đúc kết trực tiếp nguyên nhân và kết quả: dám vượt qua nỗi sợ và kiên trì vươn lên sẽ giúp ta trưởng thành.",
    },
    {
      position: 3,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Chiếc cầu gỗ qua suối",
        passage_vi:
          "Con suối nhỏ sau cơn mưa lớn bị cuốn trôi mất lối đi. Sóc Nâu muốn sang bờ bên kia hái hạt dẻ nhưng một mình không khiêng nổi khúc gỗ nặng. Thấy vậy, Gấu Con và Thỏ Trắng cùng chạy lại đỡ hai đầu khúc gỗ. Chỉ một lúc sau, cả ba bạn đã bắc xong chiếc cầu vững chắc qua suối. Ba bạn nhận ra rằng khi biết hợp sức cùng nhau, công việc nặng nhọc mấy cũng hoàn thành được.",
        question_vi: "Câu nào thể hiện bài học mà ba bạn nhỏ rút ra được sau khi bắc cầu?",
        choices: [
          {
            id: "a",
            label_vi: "Con suối nhỏ sau cơn mưa lớn bị cuốn trôi mất lối đi.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Sóc Nâu muốn sang bờ bên kia hái hạt dẻ nhưng một mình không khiêng nổi khúc gỗ nặng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ba bạn nhận ra rằng khi biết hợp sức cùng nhau, công việc nặng nhọc mấy cũng hoàn thành được.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Thấy vậy, Gấu Con và Thỏ Trắng cùng chạy lại đỡ hai đầu khúc gỗ.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Ba bạn nhận ra rằng khi biết hợp sức cùng nhau, công việc nặng nhọc mấy cũng hoàn thành được.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu cuối bài nêu rõ bài học về tinh thần đoàn kết: khi biết hợp sức cùng nhau thì việc khó cũng hoàn thành được.",
    },
    {
      position: 4,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Từ câu chuyện “Chiếc cầu gỗ qua suối”, nếu tổ của em được giao trang trí góc học tập của lớp, cách làm nào vận dụng đúng bài học trong truyện?",
        question_en: "How can your group apply the moral of 'The Wooden Bridge' when decorating the classroom corner?",
        choices: [
          {
            id: "a",
            label_vi: "Để một bạn làm hết mọi việc, các bạn khác ngồi xem.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mỗi bạn nhận một phần việc vừa sức và cùng phối hợp để hoàn thành góc học tập.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Bỏ cuộc ngay vì thấy có nhiều giấy màu cần cắt.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Tranh cãi xem việc của ai nhẹ hơn.",
            correct: false,
          },
        ],
        hint1_vi: "Bài học từ câu chuyện chiếc cầu gỗ là sự hợp sức giữa các bạn.",
        hint2_vi: "Khi trang trí lớp học, làm thế nào để mọi người cùng góp sức nhịp nhàng?",
        hint3_vi: "Chọn đáp án nói về việc phân chia công việc và cùng nhau phối hợp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Phân chia công việc và cùng phối hợp giúp cả tổ hoàn thành góc học tập nhanh và đẹp, đúng với bài học đoàn kết từ câu chuyện.",
    },
  ],
};
