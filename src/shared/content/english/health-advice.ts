/**
 * Tiếng Anh · Sức khỏe và lời khuyên với should / shouldn't (skill: eng-health-advice, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives.
 */
import type { LessonDefinition } from "../types";

export const healthAdvice: LessonDefinition = {
  id: "eng-health-advice",
  subjectId: "english",
  skillId: "eng-health-advice",
  titleVi: "Triệu chứng sức khỏe và lời khuyên với should / shouldn't",
  titleEn: "Health Problems and Advice with Should / Shouldn't",
  objectiveVi:
    "Em sẽ gọi tên các triệu chứng sức khỏe thường gặp và đưa ra lời khuyên lịch sự bằng should hoặc shouldn't.",
  objectiveEn:
    "Name common health symptoms and give polite advice using should and shouldn't.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-health-advice",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách ghép từng triệu chứng như “headache”, “toothache”, “sore throat” với một lời khuyên “You should...” và một lời khuyên “You shouldn't...”.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi muốn khuyên bạn một cách lịch sự nên làm gì để chăm sóc sức khỏe, em dùng cấu trúc nào?",
        question_en:
          "Which structure gives polite health advice about what someone ought to do?",
        choices: [
          {
            id: "a",
            label_vi: "You should + động từ nguyên mẫu không “to”",
            correct: true,
          },
          {
            id: "b",
            label_vi: "You should + to + động từ thêm “-ing”",
            correct: false,
          },
          {
            id: "c",
            label_vi: "You are should + động từ thêm “-s”",
            correct: false,
          },
          {
            id: "d",
            label_vi: "You shoulds + động từ quá khứ",
            correct: false,
          },
        ],
        hint1_vi: "“Should” (nên) và “shouldn't” (không nên) là các động từ khuyết thiếu dùng để khuyên bảo nhẹ nhàng.",
        hint2_vi: "Giống như “can”, từ “should” không đi kèm “are” và không bao giờ thêm “-s”.",
        hint3_vi: "Động từ theo ngay sau “You should” luôn giữ nguyên gốc, không có chữ “to”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Để đưa ra lời khuyên lịch sự, tiếng Anh dùng “You should + động từ nguyên mẫu” cho việc nên làm và “You shouldn't + động từ nguyên mẫu” cho việc không nên làm.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Hùng ôm má và nói: “I have a toothache.” Hùng đang gặp vấn đề sức khỏe gì?",
        question_en:
          "Hung holds his cheek and says: “I have a toothache.” What is the matter with him?",
        choices: [
          { id: "a", label_vi: "Bạn ấy bị đau đầu.", correct: false },
          { id: "b", label_vi: "Bạn ấy bị sốt cao.", correct: false },
          { id: "c", label_vi: "Bạn ấy bị đau bụng.", correct: false },
          { id: "d", label_vi: "Bạn ấy bị đau răng.", correct: true },
        ],
        hint1_vi: "Tách từ ghép “toothache” thành hai phần: “tooth” và “ache”.",
        hint2_vi: "Đuôi “-ache” chỉ cơn đau nhức, còn phần đầu “tooth” chỉ một bộ phận trong miệng.",
        hint3_vi: "“Tooth” là chiếc răng — bộ phận dùng để nhai thức ăn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Tooth” là chiếc răng và “-ache” là cơn đau, nên “I have a toothache.” có nghĩa là bị đau răng (khác với “headache” là đau đầu và “fever” là sốt).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Phương bị đau họng (“a sore throat”). Lời khuyên nào dưới đây hợp lý và đúng ngữ pháp?",
        question_en:
          "Phuong has a sore throat. Which piece of advice is sensible and grammatically correct?",
        choices: [
          {
            id: "a",
            label_vi: "You should drink lots of iced water and eat cold ice cream.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "You shouldn't to drink warm water, and you should to shout loudly.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "You shouldn't drink cold water, and you should drink warm water.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "You should shouting loudly in the yard.",
            correct: false,
          },
        ],
        hint1_vi: "Khi bị đau rát cổ họng (“sore throat”), nước đá lạnh sẽ làm cổ họng khó chịu hơn.",
        hint2_vi: "Cần khuyên bạn không nên (“shouldn't”) uống nước lạnh và nên (“should”) uống nước ấm.",
        hint3_vi: "Kiểm tra động từ “drink” đứng sau cả “shouldn't” lẫn “should” đều ở dạng nguyên mẫu không có “to” hay “-ing”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi bị đau họng, lời khuyên đúng cả về sức khỏe lẫn ngữ pháp là “You shouldn't drink cold water, and you should drink warm water.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền cặp từ thích hợp vào cuộc trò chuyện: “An: What's the matter with you? — Bình: I have a high ___. — An: You ___ take a rest and tell your parents.”",
        question_en:
          "Fill in the blanks: “I have a high ___. — You ___ take a rest and tell your parents.”",
        choices: [
          { id: "a", label_vi: "dentist / shouldn't", correct: false },
          { id: "b", label_vi: "fever / should", correct: true },
          { id: "c", label_vi: "fever / shouldn't", correct: false },
          { id: "d", label_vi: "medicine / shoulds", correct: false },
        ],
        hint1_vi: "Chỗ trống đầu tiên đứng sau tính từ “high” (cao) để chỉ một triệu chứng cơ thể nóng lên.",
        hint2_vi: "Cụm “a high fever” nghĩa là bị sốt cao.",
        hint3_vi: "Khi bị sốt cao, việc nghỉ ngơi và báo cho bố mẹ biết là điều nên làm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“A high fever” là cơn sốt cao; khi bị sốt cao, bạn nên nghỉ ngơi và báo với bố mẹ nên dùng “should”: “You should take a rest and tell your parents.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em trai em thức khuya nhìn màn hình máy tính nên bị đau đầu (“a headache”). Lời khuyên tiếng Anh nào của em vừa ân cần vừa đúng cấu trúc?",
        question_en:
          "Your younger brother has a headache from looking at a screen late at night. Which advice should you give?",
        choices: [
          {
            id: "a",
            label_vi: "You should turn off the computer and rest your eyes, and you shouldn't stay up late.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "You shouldn't rest your eyes, and you should stay up late.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "You should to turn off the computer and staying up late.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "You should eat lots of sweet candies before bedtime.",
            correct: false,
          },
        ],
        hint1_vi: "Xác định rõ việc nên làm (tắt máy tính, cho mắt nghỉ ngơi) và việc không nên làm (thức khuya — “stay up late”).",
        hint2_vi: "Ghép “You should” với hành động tốt cho mắt và “you shouldn't” với việc thức khuya.",
        hint3_vi: "Đảm bảo sau “should” và “shouldn't” đều là động từ nguyên mẫu không có chữ “to”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu “You should turn off the computer and rest your eyes, and you shouldn't stay up late.” dùng đúng “should / shouldn't + động từ nguyên mẫu” và khuyên đúng cách giảm đau đầu.",
    },
  ],
};
