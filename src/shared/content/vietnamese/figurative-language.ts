/**
 * Tiếng Việt · So sánh và nhân hóa (skill: vie-figurative, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives (`GDPT2018.VIE.5.READ.02`).
 */
import type { LessonDefinition } from "../types";

export const figurativeLanguage: LessonDefinition = {
  id: "vie-figurative-language",
  subjectId: "vietnamese",
  skillId: "vie-figurative",
  titleVi: "So sánh và nhân hóa",
  titleEn: "Simile and Personification",
  objectiveVi:
    "Em sẽ nhận biết biện pháp so sánh, nhân hóa và hiểu tác dụng của chúng.",
  objectiveEn:
    "Recognise simile and personification and explain their effects.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-figurative",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tìm một câu so sánh hoặc nhân hóa trong sách em đang đọc.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào sử dụng biện pháp so sánh?",
        choices: [
          { id: "a", label_vi: "Mặt hồ rất phẳng.", correct: false },
          { id: "b", label_vi: "Mặt hồ phẳng như tấm gương.", correct: true },
          { id: "c", label_vi: "Mặt hồ ở sau ngôi nhà.", correct: false },
          { id: "d", label_vi: "Em đi quanh mặt hồ.", correct: false },
        ],
        hint1_vi: "So sánh đặt hai sự vật cạnh nhau vì có nét giống nhau.",
        hint2_vi: "Từ “như” thường báo hiệu một phép so sánh.",
        hint3_vi: "Câu có “mặt hồ ... như tấm gương” là câu so sánh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu “Mặt hồ phẳng như tấm gương” dùng từ “như” để so sánh, giúp người đọc hình dung rõ hơn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào sử dụng biện pháp nhân hóa?",
        choices: [
          { id: "a", label_vi: "Hàng cây cao năm mét.", correct: false },
          { id: "b", label_vi: "Hàng cây có nhiều lá xanh.", correct: false },
          { id: "c", label_vi: "Hàng cây mọc bên đường.", correct: false },
          { id: "d", label_vi: "Hàng cây dang tay đón gió.", correct: true },
        ],
        hint1_vi:
          "Nhân hóa làm cho sự vật mang hành động hoặc đặc điểm của con người.",
        hint2_vi: "Cây không có tay thật như con người.",
        hint3_vi: "“Dang tay đón gió” là hành động được gán cho hàng cây.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu gọi cành cây là “tay” và tả cây “đón gió” như con người nên đã dùng nhân hóa.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Những giọt sương long lanh như hạt ngọc”, hai sự vật nào được so sánh?",
        choices: [
          { id: "a", label_vi: "Giọt sương và hạt ngọc", correct: true },
          { id: "b", label_vi: "Ánh nắng và lá cây", correct: false },
          { id: "c", label_vi: "Giọt sương và ánh nắng", correct: false },
          { id: "d", label_vi: "Hạt ngọc và lá cây", correct: false },
        ],
        hint1_vi: "Tìm từ “như” trong câu.",
        hint2_vi: "Sự vật trước “như” được đặt cạnh sự vật sau “như”.",
        hint3_vi: "Câu đặt giọt sương cạnh hạt ngọc vì đều long lanh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Giọt sương được so sánh với hạt ngọc qua từ “như”, làm nổi bật vẻ trong sáng và long lanh.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Tác dụng chính của câu “Dòng sông uốn mình qua cánh đồng” là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Cho biết chính xác chiều dài dòng sông",
            correct: false,
          },
          { id: "b", label_vi: "Giải thích vì sao nước sông trong", correct: false },
          {
            id: "c",
            label_vi: "Làm dòng sông hiện lên mềm mại, sinh động như một cơ thể sống",
            correct: true,
          },
          { id: "d", label_vi: "Nêu tên địa phương có dòng sông", correct: false },
        ],
        hint1_vi: "“Uốn mình” vốn là hành động của người hoặc động vật.",
        hint2_vi: "Hành động đó khiến dòng sông có vẻ sống động hơn.",
        hint3_vi: "Câu văn gợi hình dáng cong mềm của dòng sông.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nhân hóa qua từ “uốn mình” khiến dòng sông hiện lên như một cơ thể sống, mềm mại và sinh động.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào dùng nhân hóa phù hợp để tả tiếng trống trường?",
        choices: [
          {
            id: "a",
            label_vi: "Tiếng trống trường có âm thanh.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tiếng trống trường giục giã gọi chúng em vào lớp.",
            correct: true,
          },
          { id: "c", label_vi: "Trống trường làm bằng gỗ.", correct: false },
          {
            id: "d",
            label_vi: "Trống trường đặt ở hành lang.",
            correct: false,
          },
        ],
        hint1_vi: "Hãy tìm câu gán cho tiếng trống hành động của con người.",
        hint2_vi: "“Gọi” là hành động giao tiếp của con người.",
        hint3_vi: "Câu có “gọi chúng em vào lớp” dùng nhân hóa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu “gọi chúng em vào lớp” gán cho tiếng trống hành động của con người nên đã dùng nhân hóa, làm âm thanh trở nên gần gũi.",
    },
  ],
};
