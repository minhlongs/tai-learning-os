/**
 * Tư duy phản biện · Khảo sát năng lực đầu vào Tư duy phản biện Lớp 5 (skill: deb-argument-structure, lớp 5)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering claims, reasons, and civil disagreement.
 */
import type { LessonDefinition } from "../types";

export const baselineDebateGrade5: LessonDefinition = {
  id: "deb-baseline-grade5",
  subjectId: "debate",
  skillId: "deb-argument-structure",
  titleVi: "Khảo sát đầu vào Tư duy phản biện Lớp 5",
  titleEn: "Critical Thinking & Debate Grade 5 Baseline Diagnostic",
  objectiveVi:
    "Khảo sát nhẹ nhàng khả năng nêu luận điểm, tìm lý do hỗ trợ và bàn bạc một cách văn minh.",
  objectiveEn:
    "Gentle baseline check of stating claims, finding supporting reasons, and discussing respectfully.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-argument",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Khảo sát đầu vào để phụ huynh nắm năng lực xuất phát điểm, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong cuộc bàn bạc, luận điểm là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Câu chuyện em kể cho bạn cười",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Quan điểm em muốn bạn cùng nghe hiểu và bảo vệ",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Lời chào hỏi trước khi vào việc",
            correct: false,
          },
          { id: "d", label_vi: "Một từ mới em vừa học được", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến điều em muốn bạn đồng ý cùng mình.",
        hint2_vi: "Đó là ý chính sẽ được bảo vệ bằng lý do.",
        hint3_vi: "Luận điểm là quan điểm em muốn bảo vệ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Luận điểm là quan điểm em nêu ra và muốn bảo vệ bằng lý do; chuyện cười, lời chào hay từ mới không phải luận điểm.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Luận điểm: “Nên mang đủ sách vở theo thời khóa biểu.” Câu nào là lý do phù hợp?",
        choices: [
          {
            id: "a",
            label_vi: "Đủ sách giúp em theo được bài trên lớp",
            correct: true,
          },
          { id: "b", label_vi: "Bạn Nam cao nhất lớp", correct: false },
          { id: "c", label_vi: "Cặp của em màu xanh", correct: false },
          { id: "d", label_vi: "Hôm nay trời nắng to", correct: false },
        ],
        hint1_vi: "Lý do phải cùng nói về sách vở với việc học.",
        hint2_vi: "Hãy chọn câu nêu lợi ích của việc mang đủ sách.",
        hint3_vi: "Mang đủ sách giúp theo bài là lý do đúng trọng tâm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu “Đủ sách giúp em theo được bài trên lớp” nêu lợi ích trực tiếp cho việc học nên hỗ trợ luận điểm; các câu còn lại không liên quan đến mang đủ sách.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Bạn nói ý em không đồng ý. Phản ứng nào là văn minh?",
        choices: [
          {
            id: "a",
            label_vi: "Nói với nhóm khác rằng bạn sai",
            correct: false,
          },
          { id: "b", label_vi: "Chế giễu bạn ngay trong lớp", correct: false },
          { id: "c", label_vi: "Cắt lời và nói to hơn bạn", correct: false },
          {
            id: "d",
            label_vi:
              "Nêu rõ điểm em chưa đồng ý và hỏi bạn vì sao lại nghĩ vậy",
            correct: true,
          },
        ],
        hint1_vi: "Cần thể hiện không đồng ý mà vẫn giữ lịch sự.",
        hint2_vi: "Nên hỏi để làm rõ lý lẽ của bạn.",
        hint3_vi: "Nêu điểm chưa đồng ý và hỏi bạn vì sao lại nghĩ vậy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cách văn minh là nêu điểm chưa đồng ý và hỏi bạn vì sao nghĩ vậy, để cùng bàn lý lẽ; chế giễu, cắt lời, nói xấu đều không phù hợp.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "“Lớp mình chọn món này đi, vì đa số bạn thích mà.” Câu này có vấn đề gì?",
        choices: [
          {
            id: "a",
            label_vi: "Nêu lý do rất rõ ràng nên không có vấn đề",
            correct: false,
          },
          { id: "b", label_vi: "Công kích người nói khác ý", correct: false },
          {
            id: "c",
            label_vi: "Lấy số đông làm lý do, chưa nói được vì sao món đó phù hợp",
            correct: true,
          },
          { id: "d", label_vi: "Chứng minh được món đó là tốt nhất", correct: false },
        ],
        hint1_vi: "Câu này chỉ dựa vào việc nhiều bạn thích.",
        hint2_vi: "Nhiều người thích chưa phải lý do về sự phù hợp.",
        hint3_vi:
          "Đây là lỗi lấy số đông làm lý do chứ chưa nêu được vì sao phù hợp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu trên dựa vào số đông thay vì nêu lý do về sự phù hợp, nên là lỗi lấy số đông làm bằng chứng.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong nhóm, em muốn thuyết phục bạn chơi trò chơi ô chữ để ôn từ vựng. Cách nói nào tốt nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Ô chữ vừa vui vừa giúp ta nhớ từ mới, nên ta cùng chơi nhé",
            correct: true,
          },
          { id: "b", label_vi: "Chơi đi vì tớ thích mà tớ bảo rồi", correct: false },
          { id: "c", label_vi: "Không chơi là bạn kém lắm", correct: false },
          { id: "d", label_vi: "Tớ ép bạn phải chơi cho bằng được", correct: false },
        ],
        hint1_vi: "Cần có luận điểm và lý do ở trong câu.",
        hint2_vi: "Lý do phải nêu lợi ích của trò ô chữ.",
        hint3_vi:
          "“Ô chữ vừa vui vừa giúp nhớ từ mới” là luận điểm có lý do rõ ràng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu nêu rõ trò chơi ô chữ vừa vui vừa giúp nhớ từ mới, kèm lời đề nghị cùng chơi nên thuyết phục nhất; các câu còn lại chỉ theo ý muốn cá nhân, công kích hoặc ép buộc.",
    },
  ],
};
