/**
 * Tiếng Anh · Câu đơn S–V–O (skill: eng-sentence-basic, lớp 3–4)
 *
 * Steps live inline: the payload is short enough that splitting it would only
 * add indirection. Authored for TAI Learning OS; original content.
 */
import type { LessonDefinition } from "../types";

export const simpleSentences: LessonDefinition = {
  id: "eng-simple-sentences",
  subjectId: "english",
  skillId: "eng-sentence-basic",
  titleVi: "Câu đơn đầu tiên",
  titleEn: "Simple Sentences",
  objectiveVi: "Em sẽ xếp được một câu đơn đúng thứ tự: chủ đề – động từ – bổ ngữ.",
  objectiveEn: "Build a simple sentence in the right order: subject – verb – object.",
  gradeFrom: 3,
  gradeTo: 4,
  objectiveId: "obj-eng-sent-basic",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Ôn lại sau 1 ngày và 3 ngày bằng cách đặt câu đơn S–V–O.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Một câu đơn tiếng Anh bắt đầu bằng gì?",
        question_en: "How does a simple English sentence begin?",
        choices: [
          { id: "a", label_vi: "Bằng động từ.", correct: false },
          { id: "b", label_vi: "Bằng chữ cái đầu viết hoa và kết thúc bằng dấu chấm.", correct: true },
          { id: "c", label_vi: "Bằng dấu phẩy.", correct: false },
          { id: "d", label_vi: "Bằng một từ nối.", correct: false },
        ],
        hint1_vi: "Em hãy nhớ lại những câu tiếng Anh em từng đọc sách.",
        hint2_vi: "Câu văn viết tay đều có một chỗ bắt đầu và một chỗ kết thúc.",
        hint3_vi: "Chữ cái đầu tiên luôn được viết hoa để cho người đọc biết câu bắt đầu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu văn bắt đầu bằng chữ hoa và kết thúc bằng dấu chấm để người đọc biết đâu là lúc bắt đầu và đâu là lúc nghỉ. Các dấu còn lại nằm bên trong câu, không phải ở đầu.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong câu “I read books”, chữ “I” đóng vai trò gì?",
        question_en: "In 'I read books', what does 'I' do?",
        choices: [
          { id: "a", label_vi: "Chỉ một đồ vật trong câu.", correct: false },
          { id: "b", label_vi: "Là người làm việc đọc sách.", correct: true },
          { id: "c", label_vi: "Chỉ một động từ.", correct: false },
          { id: "d", label_vi: "Là dấu câu.", correct: false },
        ],
        hint1_vi: "Câu có ba phần: ai làm – làm gì – cái gì.",
        hint2_vi: "Em hãy đọc câu và tự hỏi: ai là người đọc sách?",
        hint3_vi: "Phần đầu của câu cho biết đối tượng đang thực hiện việc đọc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“I” là em — người thực hiện việc đọc. Đặt phần này đầu câu thì người đọc biết ngay câu đang nói về ai.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Các từ “she”, “reads”, “books” xếp thành câu đúng thứ tự nào?",
        question_en: "Which of these words is in the correct order?",
        choices: [
          { id: "a", label_vi: "She reads books.", correct: true },
          { id: "b", label_vi: "Reads she books.", correct: false },
          { id: "c", label_vi: "Books reads she.", correct: false },
          { id: "d", label_vi: "She books reads.", correct: false },
        ],
        hint1_vi: "Câu đơn cần chủ đề đứng trước, rồi đến việc làm.",
        hint2_vi: "“She” là chủ đề, nên nó phải đứng đầu câu.",
        hint3_vi: "Sau khi biết ai làm, câu cho biết việc làm gì, rồi mới đến việc làm với cái gì.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Thứ tự đúng là ai làm trước (“She”), rồi việc làm (“reads”), rồi đồ vật liên quan (“books”). Các đáp án khác đặt chủ đề ở giữa hoặc cuối câu, khiến người đọc không biết ai là người làm việc.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Câu “The dog barks” có đủ ba phần chưa?",
        question_en: "Is 'The dog barks' a complete sentence?",
        choices: [
          { id: "a", label_vi: "Chưa, còn thiếu đồ vật chịu tác động.", correct: false },
          { id: "b", label_vi: "Đủ rồi, câu đã nói ai làm gì.", correct: true },
          { id: "c", label_vi: "Chưa, còn thiếu chữ cái viết hoa.", correct: false },
          { id: "d", label_vi: "Chưa, còn thiếu động từ.", correct: false },
        ],
        hint1_vi: "Em hãy đọc kỹ câu rồi hỏi: ai và làm gì?",
        hint2_vi: "“The dog” là chủ đề, “barks” là việc làm.",
        hint3_vi: "Không phải câu nào cũng cần một đồ vật bị tác động — có việc người ta chỉ tự làm một mình.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu đã có chủ đề (“the dog”) và việc làm (“barks”), nên là câu đủ nghĩa. Việc sủa chỉ cần một con chó làm, không cần thêm đồ vật bị tác động.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào sau đây được viết đúng?",
        question_en: "Which sentence is written correctly?",
        choices: [
          { id: "a", label_vi: "plays soccer He.", correct: false },
          { id: "b", label_vi: "He plays soccer.", correct: true },
          { id: "c", label_vi: "he plays soccer", correct: false },
          { id: "d", label_vi: "He soccer plays.", correct: false },
        ],
        hint1_vi: "Em hãy nhớ: ai làm việc gì, rồi mới đến đồ vật.",
        hint2_vi: "Chữ cái đầu tiên của câu cần viết hoa và cuối câu cần dấu chấm.",
        hint3_vi: "Đáp án c thiếu chữ hoa ở đầu, em hãy xem lại.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“He plays soccer.” có đủ thứ tự đúng, chữ hoa đầu câu và dấu chấm cuối câu. Đáp án c đúng thứ tự nhưng thiếu chữ hoa, còn hai đáp án kia xếp sai vị trí.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em muốn viết một câu tiếng Anh nói rằng bạn mình đang vẽ một bức tranh. Em chọn câu nào?",
        question_en: "Which sentence says your friend is drawing a picture?",
        choices: [
          { id: "a", label_vi: "She draws a picture.", correct: true },
          { id: "b", label_vi: "Draws she a picture.", correct: false },
          { id: "c", label_vi: "A picture draws she.", correct: false },
          { id: "d", label_vi: "She a picture draws.", correct: false },
        ],
        hint1_vi: "Em cần một chủ đề, một việc làm và một đồ vật liên quan.",
        hint2_vi: "“She” là chủ đề nên đứng đầu câu.",
        hint3_vi: "Sau việc làm “draws” là đồ vật được vẽ ra; em sắp xếp thử xem.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“She draws a picture.” có đủ ba phần đúng thứ tự: ai vẽ, việc vẽ, và thứ được vẽ ra. Các đáp án còn lại đảo chủ đề ra sau làm người đọc bối rối không biết ai là người vẽ.",
    },
  ],
};
