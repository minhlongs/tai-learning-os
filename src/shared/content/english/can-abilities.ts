/**
 * Tiếng Anh · Diễn đạt khả năng với can / can't (skill: eng-can-abilities, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives.
 */
import type { LessonDefinition } from "../types";

export const canAbilities: LessonDefinition = {
  id: "eng-can-abilities",
  subjectId: "english",
  skillId: "eng-can-abilities",
  titleVi: "Diễn đạt khả năng với can và can't",
  titleEn: "Expressing Abilities with Can and Can't",
  objectiveVi:
    "Em sẽ dùng can và cannot (can't) cùng động từ nguyên mẫu để nói và hỏi đáp về khả năng thực hiện một việc.",
  objectiveEn:
    "Use can and cannot (can't) with base verbs to talk and ask about abilities.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-can-abilities",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách tự đặt hai câu với “I can...” và một câu với “I can't...” về các môn thể thao hoặc năng khiếu.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong tiếng Anh, động từ đứng ngay sau “can” hoặc “can't” phải ở dạng nào?",
        question_en:
          "Which verb form always comes right after “can” or “can't”?",
        choices: [
          {
            id: "a",
            label_vi: "Động từ nguyên mẫu không có “to” và không thêm “-s”",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Động từ luôn phải có chữ “to” đứng trước",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Động từ thêm đuôi “-ing” cho mọi chủ ngữ",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Động từ thêm “-s” khi chủ ngữ là “he” hoặc “she”",
            correct: false,
          },
        ],
        hint1_vi: "“Can” là động từ khuyết thiếu chỉ khả năng làm được việc gì đó.",
        hint2_vi: "Dù chủ ngữ là “I”, “you”, “he” hay “she”, động từ sau “can” không bao giờ thay đổi hình thức.",
        hint3_vi: "Ví dụ đúng là “She can swim.” — động từ giữ nguyên gốc, không có “to” và không thêm “-s”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sau “can” và “cannot (can't)”, động từ luôn giữ nguyên mẫu không có “to” và không chia thêm “-s” hay “-ing”, kể cả với chủ ngữ “he” hoặc “she”.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu tiếng Anh nào dưới đây diễn đạt đúng ý: “Bạn Minh biết đạp xe đạp.”?",
        question_en:
          "Which sentence correctly says “Minh can ride a bike”?",
        choices: [
          { id: "a", label_vi: "Minh can rides a bike.", correct: false },
          { id: "b", label_vi: "Minh can to ride a bike.", correct: false },
          { id: "c", label_vi: "Minh can ride a bike.", correct: true },
          { id: "d", label_vi: "Minh cans ride a bike.", correct: false },
        ],
        hint1_vi: "Chủ ngữ “Minh” tương đương với “he”, nhưng từ “can” không thêm “-s”.",
        hint2_vi: "Động từ “ride” đứng sau “can” cần giữ nguyên gốc, không thêm “to” hay “-s”.",
        hint3_vi: "Ghép “Minh can” trực tiếp với cụm động từ nguyên mẫu “ride a bike”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cả “can” lẫn động từ chính “ride” đều không thêm “-s” và không chèn “to” ở giữa, nên câu đúng là “Minh can ride a bike.”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Hà chưa biết bơi. Khi được hỏi “Can you swim?”, Hà nên trả lời ngắn gọn như thế nào?",
        question_en:
          "Ha does not know how to swim. How should Ha answer “Can you swim?”?",
        choices: [
          { id: "a", label_vi: "Yes, I can.", correct: false },
          { id: "b", label_vi: "No, I can't.", correct: true },
          { id: "c", label_vi: "No, I don't can.", correct: false },
          { id: "d", label_vi: "Yes, I am.", correct: false },
        ],
        hint1_vi: "Vì Hà chưa biết bơi nên câu trả lời phải mang nghĩa phủ định bắt đầu bằng “No”.",
        hint2_vi: "Câu hỏi bắt đầu bằng “Can you...?” thì phần trả lời ngắn cũng lặp lại động từ khuyết thiếu đó.",
        hint3_vi: "Dạng phủ định viết tắt của “cannot” đi sau “No, I...” là từ có dấu lược “n't”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Với câu hỏi “Can you swim?”, nếu có thể làm được ta đáp “Yes, I can.”, còn nếu chưa làm được ta đáp “No, I can't.” (viết tắt của “No, I cannot.”).",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hoàn thành câu có hai vế đối lập sau: “Lan can play the piano, ___ she can't play the guitar.”",
        question_en:
          "Complete the sentence: “Lan can play the piano, ___ she can't play the guitar.”",
        choices: [
          { id: "a", label_vi: "because", correct: false },
          { id: "b", label_vi: "or", correct: false },
          { id: "c", label_vi: "at", correct: false },
          { id: "d", label_vi: "but", correct: true },
        ],
        hint1_vi: "Vế đầu nói việc Lan làm được (“can”), còn vế sau nói việc Lan chưa làm được (“can't”).",
        hint2_vi: "Để nối hai ý trái ngược nhau trong cùng một câu, ta cần liên từ mang nghĩa “nhưng”.",
        hint3_vi: "Liên từ tiếng Anh gồm ba chữ cái mang nghĩa “nhưng” đứng sau dấu phẩy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Liên từ “but” (nhưng) dùng để nối một khả năng làm được với một việc chưa làm được: “Lan can play the piano, but she can't play the guitar.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu lạc bộ thể thao của trường đang tìm bạn biết đá bóng. Em muốn hỏi bạn Quân xem Quân có đá bóng được không thì em hỏi câu nào?",
        question_en:
          "You want to ask Quan whether he can play football for the school club. Which question do you ask?",
        choices: [
          { id: "a", label_vi: "Do you can playing football, Quan?", correct: false },
          { id: "b", label_vi: "Can you plays football, Quan?", correct: false },
          { id: "c", label_vi: "Can you play football, Quan?", correct: true },
          { id: "d", label_vi: "Are you can play football, Quan?", correct: false },
        ],
        hint1_vi: "Khi đặt câu hỏi về khả năng, ta đảo “Can” lên đầu câu trước chủ ngữ “you”.",
        hint2_vi: "Không dùng chung “Can” với “Do” hoặc “Are” trong cùng một câu hỏi.",
        hint3_vi: "Sau “Can you”, động từ chỉ việc chơi bóng đá giữ nguyên mẫu không thêm đuôi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Để hỏi trực tiếp bạn Quân có biết đá bóng không, ta đảo “Can” lên trước “you” và giữ động từ nguyên mẫu “play”: “Can you play football, Quan?”.",
    },
  ],
};
