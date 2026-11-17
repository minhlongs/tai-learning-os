/**
 * Tiếng Anh · Dự định tương lai gần với be going to (skill: eng-future-plans, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives.
 */
import type { LessonDefinition } from "../types";

export const futurePlans: LessonDefinition = {
  id: "eng-future-plans",
  subjectId: "english",
  skillId: "eng-future-plans",
  titleVi: "Dự định tương lai gần với be going to",
  titleEn: "Future Plans with Be Going To",
  objectiveVi:
    "Em sẽ dùng cấu trúc am / is / are going to + động từ nguyên mẫu để hỏi và trình bày kế hoạch, dự định sắp tới.",
  objectiveEn:
    "Use am / is / are going to + base verb to ask and talk about upcoming plans.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-future-plans",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách kể ba việc gia đình em dự định làm vào cuối tuần tới với cấu trúc “be going to”.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi muốn nói về một kế hoạch hoặc dự định đã chuẩn bị sẵn cho cuối tuần tới, em dùng cấu trúc nào?",
        question_en:
          "Which structure expresses a planned intention for the coming weekend?",
        choices: [
          {
            id: "a",
            label_vi: "Chủ ngữ + động từ thêm đuôi “-ed”",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chủ ngữ + going to + động từ thêm đuôi “-ing”",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chủ ngữ + am / is / are + going to + động từ nguyên mẫu",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Chủ ngữ + was / were + động từ nguyên mẫu",
            correct: false,
          },
        ],
        hint1_vi: "Cấu trúc nói về dự định tương lai gần luôn bắt đầu bằng động từ “to be” ở hiện tại.",
        hint2_vi: "Sau “am / is / are” là cụm cố định “going to” để chỉ ý định sắp thực hiện.",
        hint3_vi: "Đứng sau chữ “to” trong “going to” phải là động từ nguyên mẫu không thêm đuôi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Để diễn tả dự định đã lên kế hoạch cho tương lai gần, ta dùng công thức “Chủ ngữ + am / is / are + going to + động từ nguyên mẫu”.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hoàn thành câu trả lời cho câu hỏi “What are you going to do this weekend?”: “We ___ our grandparents in the countryside.”",
        question_en:
          "Complete the answer: “We ___ our grandparents in the countryside.”",
        choices: [
          { id: "a", label_vi: "is going to visit", correct: false },
          { id: "b", label_vi: "are going to visit", correct: true },
          { id: "c", label_vi: "are going visiting", correct: false },
          { id: "d", label_vi: "going to visit", correct: false },
        ],
        hint1_vi: "Chủ ngữ “We” (chúng em / chúng tôi) là ngôi thứ nhất số nhiều.",
        hint2_vi: "Chủ ngữ “We” đi với động từ “are”, tiếp theo là cụm “going to”.",
        hint3_vi: "Sau “going to”, động từ chỉ việc thăm ông bà giữ nguyên mẫu không thêm “-ing”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Chủ ngữ “We” đi với “are”, sau “going to” là động từ nguyên mẫu “visit”: “We are going to visit our grandparents in the countryside.”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn hỏi bạn Lan dự định làm gì vào tối mai (“tomorrow evening”), câu hỏi nào đúng ngữ pháp?",
        question_en:
          "Which question correctly asks what Lan plans to do tomorrow evening?",
        choices: [
          {
            id: "a",
            label_vi: "What Lan is going to do tomorrow evening?",
            correct: false,
          },
          {
            id: "b",
            label_vi: "What do Lan going to do tomorrow evening?",
            correct: false,
          },
          {
            id: "c",
            label_vi: "What is Lan going doing tomorrow evening?",
            correct: false,
          },
          {
            id: "d",
            label_vi: "What is Lan going to do tomorrow evening?",
            correct: true,
          },
        ],
        hint1_vi: "Trong câu hỏi có từ để hỏi “What”, cần đảo động từ “to be” lên trước chủ ngữ “Lan”.",
        hint2_vi: "“Lan” là ngôi thứ ba số ít nên động từ “to be” tương ứng là “is”.",
        hint3_vi: "Sau chủ ngữ “Lan” vẫn giữ nguyên cụm “going to do” rồi mới đến cụm chỉ thời gian.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Khi đặt câu hỏi về dự định của ngôi thứ ba số ít, ta đảo “is” lên trước chủ ngữ: “What is Lan going to do tomorrow evening?”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chiều Chủ nhật trời dự báo mưa lớn nên Minh quyết định không đi cắm trại nữa. Câu phủ định nào diễn đạt đúng ý này?",
        question_en:
          "Heavy rain is forecast, so Minh plans not to go camping. Which negative sentence is correct?",
        choices: [
          {
            id: "a",
            label_vi: "Minh isn't going to go camping this Sunday.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Minh doesn't going to go camping this Sunday.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Minh not going to camping this Sunday.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Minh aren't going to go camping this Sunday.",
            correct: false,
          },
        ],
        hint1_vi: "Với cấu trúc “be going to”, khi chuyển sang phủ định ta thêm “not” ngay sau động từ “to be”.",
        hint2_vi: "Không mượn trợ động từ “doesn't” đi kèm “going to”.",
        hint3_vi: "“Minh” là chủ ngữ số ít nên dùng “is not” (viết tắt là “isn't”) trước “going to go camping”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu phủ định với “be going to” đặt “not” sau “am / is / are”. Chủ ngữ “Minh” đi với “isn't”, tạo thành “Minh isn't going to go camping this Sunday.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sáng thứ Bảy tới, em dự định dọn góc học tập còn chị gái em dự định nướng bánh quy. Câu nào diễn tả đúng kế hoạch của hai chị em?",
        question_en:
          "Next Saturday morning, you plan to tidy your desk and your sister plans to bake cookies. Which sentence is accurate?",
        choices: [
          {
            id: "a",
            label_vi: "I going to tidy my desk, and my sister going to bake cookies.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I am going to tidied my desk, and my sister is going to baked cookies.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I am going to tidy my desk, and my sister is going to bake cookies.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "I is going to tidy my desk, and my sister are going to bake cookies.",
            correct: false,
          },
        ],
        hint1_vi: "Kiểm tra động từ “to be” ở từng vế theo đúng chủ ngữ “I” và “my sister”.",
        hint2_vi: "“I” đi với “am going to”, còn “my sister” (số ít) đi với “is going to”.",
        hint3_vi: "Hai động từ chính “tidy” và “bake” đứng sau “going to” phải ở dạng nguyên mẫu, không thêm “-ed”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Vế thứ nhất dùng “I am going to tidy”, vế thứ hai dùng “my sister is going to bake” — cả hai vế đều chia đúng động từ “to be” và giữ động từ nguyên mẫu.",
    },
  ],
};
