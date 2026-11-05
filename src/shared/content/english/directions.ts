/**
 * Tiếng Anh · Hỏi và chỉ đường (skill: eng-directions, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives (`GDPT2018.ENG.5.COMM.04`).
 */
import type { LessonDefinition } from "../types";

export const directions: LessonDefinition = {
  id: "eng-directions",
  subjectId: "english",
  skillId: "eng-directions",
  titleVi: "Hỏi và chỉ đường",
  titleEn: "Asking for and Giving Directions",
  objectiveVi: "Em sẽ hỏi, chỉ đường đơn giản và dùng đúng giới từ chỉ vị trí.",
  objectiveEn:
    "Ask for and give simple directions using common position words.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-directions",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chỉ đường từ nhà đến một địa điểm quen thuộc.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào dùng để hỏi đường đến thư viện?",
        question_en: "Which sentence asks for directions to the library?",
        choices: [
          { id: "a", label_vi: "The library reads a book.", correct: false },
          { id: "b", label_vi: "I am a library.", correct: false },
          { id: "c", label_vi: "How old is the library?", correct: false },
          {
            id: "d",
            label_vi: "Excuse me, how can I get to the library?",
            correct: true,
          },
        ],
        hint1_vi: "Một câu hỏi đường lịch sự thường bắt đầu bằng “Excuse me”.",
        hint2_vi:
          "Cụm “how can I get to...” có nghĩa là “tôi đến ... bằng cách nào”.",
        hint3_vi: "Chọn câu có cả “Excuse me” và “get to the library”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Excuse me, how can I get to the library?” là cách hỏi đường lịch sự và đúng ngữ pháp.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "“Next to” có nghĩa là gì?",
        question_en: "What does “next to” mean?",
        choices: [
          { id: "a", label_vi: "Ở giữa hai nơi", correct: false },
          { id: "b", label_vi: "Ngay bên cạnh", correct: true },
          { id: "c", label_vi: "Ở đối diện", correct: false },
          { id: "d", label_vi: "Ở phía sau rất xa", correct: false },
        ],
        hint1_vi: "Cụm này chỉ hai vật hoặc hai nơi ở sát nhau.",
        hint2_vi: "Ví dụ: “The bank is next to the post office.”",
        hint3_vi: "“Next to” nghĩa là ngay bên cạnh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Next to” nghĩa là ngay bên cạnh. “The bank is next to the post office” nghĩa là ngân hàng ở ngay bên bưu điện.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hiệu sách nằm giữa ngân hàng và trường học. Câu nào đúng?",
        question_en:
          "The bookshop is in the middle of the bank and the school. Which sentence is correct?",
        choices: [
          {
            id: "a",
            label_vi: "The bookshop is through the bank and the school.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "The bookshop is opposite the bank and the school.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "The bookshop is between the bank and the school.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "The bookshop is under the bank and the school.",
            correct: false,
          },
        ],
        hint1_vi: "Cần một giới từ diễn tả vị trí ở giữa hai đối tượng.",
        hint2_vi: "Cấu trúc là “___ A and B”.",
        hint3_vi: "Từ đúng là “between”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "“Between A and B” nghĩa là ở giữa A và B. Vì vậy câu đúng là “The bookshop is between the bank and the school.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Người chỉ đường nói: “Go straight and turn left at the traffic lights.” Em cần làm gì?",
        question_en:
          "Someone says: “Go straight and turn left at the traffic lights.” What should you do?",
        choices: [
          {
            id: "a",
            label_vi: "Đi thẳng rồi rẽ trái tại đèn giao thông",
            correct: true,
          },
          { id: "b", label_vi: "Rẽ phải ngay lập tức", correct: false },
          { id: "c", label_vi: "Quay lại phía sau", correct: false },
          { id: "d", label_vi: "Dừng lại trước ngã tư", correct: false },
        ],
        hint1_vi: "“Go straight” nghĩa là đi thẳng.",
        hint2_vi: "“Turn left” nghĩa là rẽ trái.",
        hint3_vi: "“At the traffic lights” cho biết chỗ cần rẽ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu chỉ đường yêu cầu đi thẳng trước, rồi rẽ trái khi đến đèn giao thông.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Công viên ở phía đối diện bệnh viện. Câu nào chỉ vị trí đúng?",
        question_en:
          "The park is across the street from the hospital. Which sentence is correct?",
        choices: [
          {
            id: "a",
            label_vi: "The park is between the hospital.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "The park is opposite the hospital.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "The park is turn left the hospital.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "The park is go straight the hospital.",
            correct: false,
          },
        ],
        hint1_vi: "Cần một giới từ chỉ hai nơi nằm đối diện qua đường.",
        hint2_vi: "“Opposite” có nghĩa là ở phía đối diện.",
        hint3_vi: "Mẫu câu là “The park is opposite the hospital.”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Opposite” nghĩa là ở phía đối diện, nên “The park is opposite the hospital.” diễn tả đúng vị trí.",
    },
  ],
};
