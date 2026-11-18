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
            label_vi: "Câu chuyện vui em kể đầu giờ cho các bạn cười",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Quan điểm chính em nêu ra và muốn bảo vệ bằng lý lẽ",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Lời chào hỏi lịch sự trước khi bắt đầu họp",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Một từ mới khó đọc em vừa học sáng nay",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nghĩ đến điều em muốn bạn đồng ý cùng mình.",
        hint2_vi: "Đó là ý cốt lõi sẽ được chứng minh bằng căn cứ.",
        hint3_vi: "Hãy chọn phương án chỉ kết luận trọng tâm mà người nói đưa ra để thuyết phục nhóm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Luận điểm là quan điểm chính em nêu ra và muốn bảo vệ bằng lý lẽ; chuyện cười, lời chào hay từ mới không phải luận điểm.",
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
          {
            id: "b",
            label_vi: "Bạn Nam ngồi bàn đầu hiện là học sinh cao nhất trong lớp",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chiếc cặp đi học của em may bằng vải xanh đậm",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Hôm nay ngoài sân trời nắng đẹp",
            correct: false,
          },
        ],
        hint1_vi: "Lý do phải cùng nói về sách vở với việc học.",
        hint2_vi: "Hãy chọn câu nêu lợi ích của việc chuẩn bị đủ đồ dùng học tập.",
        hint3_vi: "Có sẵn tài liệu trước mặt để nắm bài giảng dễ dàng là căn cứ sát chủ đề nhất.",
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
            label_vi: "Quay sang bàn bên cạnh rỉ tai các bạn khác rằng ý kiến đó hoàn toàn sai",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Đem lời bạn vừa phát biểu ra chế giễu ngay tại lớp",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ngắt ngang câu nói và cất giọng át cả lời bạn",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nêu rõ điểm em chưa đồng ý và hỏi bạn vì sao lại nghĩ vậy",
            correct: true,
          },
        ],
        hint1_vi: "Cần thể hiện sự khác biệt góc nhìn mà vẫn giữ lịch sự.",
        hint2_vi: "Nên đặt câu hỏi để hiểu rõ căn cứ trong lập luận của bạn.",
        hint3_vi: "Chia sẻ bình tĩnh chỗ còn băn khoăn và mời bạn giải thích thêm là cách ứng xử tôn trọng.",
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
            label_vi: "Đã đưa ra căn cứ thực tế rất đầy đủ nên cả lớp không cần bàn bạc thêm",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Dùng lời lẽ chê bai nặng nề đối với những bạn có ý kiến trái chiều",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Dựa vào số đông mà chưa nêu lý do vì sao món đó hợp",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Chứng minh chắc chắn món ăn đó bổ dưỡng và hợp túi tiền nhất",
            correct: false,
          },
        ],
        hint1_vi: "Câu này chỉ dựa vào việc có nhiều bạn yêu thích.",
        hint2_vi: "Nhiều người thích chưa phải là căn cứ về dinh dưỡng hay ngân sách của lớp.",
        hint3_vi: "Đây là lỗi viện dẫn đám đông thay vì giải thích tính phù hợp thực tế của lựa chọn.",
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
          {
            id: "b",
            label_vi: "Cứ chơi trò này đi vì riêng tớ thích và đã chọn rồi",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Bạn nào không chịu chơi cùng là thiếu hòa đồng",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Mọi người bắt buộc phải chơi theo ý tớ nhé",
            correct: false,
          },
        ],
        hint1_vi: "Cần có cả lời đề xuất và lý do thuyết phục ở trong câu.",
        hint2_vi: "Lý do phải nêu được tác dụng tích cực của hoạt động giải ô chữ.",
        hint3_vi: "Kết hợp sự hào hứng và lợi ích ghi nhớ bài học để rủ bạn cùng tham gia.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu nêu rõ trò chơi ô chữ vừa vui vừa giúp nhớ từ mới, kèm lời đề nghị cùng chơi nên thuyết phục nhất; các câu còn lại chỉ theo ý muốn cá nhân, công kích hoặc ép buộc.",
    },
  ],
};
