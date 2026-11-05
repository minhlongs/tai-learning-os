/**
 * Tư duy phản biện · Lỗi lập luận thường gặp (skill: deb-fallacies, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking,
 * aligned with the supplemental Grade 5 objective `TLO.DEB.5.FALLACY.03`.
 */
import type { LessonDefinition } from "../types";

export const fallacies: LessonDefinition = {
  id: "deb-fallacies",
  subjectId: "debate",
  skillId: "deb-fallacies",
  titleVi: "Lỗi lập luận thường gặp",
  titleEn: "Common Reasoning Fallacies",
  objectiveVi:
    "Em nhận ra một số lỗi lập luận thường gặp như công kích cá nhân và lấy số đông làm bằng chứng.",
  objectiveEn:
    "Recognise common reasoning fallacies such as attacking the person and appealing to popularity.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-fallacy",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chỉ ra một lỗi lập luận trong câu bạn nói và đổi cách nói hợp lý hơn.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Lỗi lập luận trong tranh luận là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Một cách nói rất dài để giải thích kỹ vấn đề",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Cách nói đúng mực nhất trong cuộc tranh luận",
            correct: false,
          },
          { id: "c", label_vi: "Việc im lặng khi không đồng ý", correct: false },
          {
            id: "d",
            label_vi: "Cách nói khiến người nghe tưởng đã bị thuyết phục nhưng thực ra chưa có lý lẽ chắc chắn",
            correct: true,
          },
        ],
        hint1_vi: "Hãy nghĩ đến câu nghe có vẻ hợp lý nhưng thực ra lạc đề.",
        hint2_vi: "Lỗi này không phản bác được nội dung đang bàn.",
        hint3_vi:
          "Đó là câu nghe hay nhưng thiếu lý lẽ, không phản bác được vấn đề.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Lỗi lập luận là cách lập luận nghe có vẻ hợp lý nhưng thiếu căn cứ chắc chắn và không thực sự phản bác được nội dung đang bàn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "“Em không nên nghe bạn ấy — bạn ấy hay bị điểm kém mà.” Câu này mắc lỗi gì?",
        choices: [
          { id: "a", label_vi: "Dùng bằng chứng kiểm chứng được", correct: false },
          {
            id: "b",
            label_vi: "Công kích cá nhân thay vì bàn nội dung",
            correct: true,
          },
          { id: "c", label_vi: "Đưa ra một lý do rất chắc chắn", correct: false },
          { id: "d", label_vi: "Kết luận đúng theo sự thật", correct: false },
        ],
        hint1_vi: "Câu này nói về điểm kém của bạn, không nói về ý của bạn ấy.",
        hint2_vi: "Nó bàn về người nói thay vì bàn về lập luận.",
        hint3_vi: "Câu này công kích cá nhân thay vì phản bác nội dung.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu trên chỉ trích điểm kém của bạn ấy thay vì phản bác ý kiến, nên là lỗi công kích cá nhân.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "“Đa số bạn trong lớp dùng bút này nên đây là bút viết tốt nhất.” Câu này mắc lỗi gì?",
        choices: [
          {
            id: "a",
            label_vi: "So sánh hai loại bút một cách công bằng",
            correct: false,
          },
          { id: "b", label_vi: "Công kích cá nhân", correct: false },
          { id: "c", label_vi: "Lấy số đông làm bằng chứng", correct: true },
          { id: "d", label_vi: "Khuyến nghị dùng bút hay hơn", correct: false },
        ],
        hint1_vi: "Câu này dựa vào việc nhiều người dùng.",
        hint2_vi: "Nhiều người chọn chưa chắc đã là tốt nhất.",
        hint3_vi: "Đây là lỗi lấy số đông làm bằng chứng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu này dùng việc nhiều bạn dùng để kết luận bút tốt nhất, thay vì đưa lý do về chất lượng, nên là lỗi lấy số đông làm bằng chứng.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "“Bạn ấy nói rồi bỏ về, còn nói gì nữa đâu mà bàn.” Nhận xét nào đúng?",
        choices: [
          {
            id: "a",
            label_vi: "Việc bạn ấy bỏ về không phản bác được lý lẽ đang bàn",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Vì bạn ấy im nên ý cũ vẫn đúng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì bạn ấy đi nên mọi ý cũ đều sai",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Câu này là lý do chắc chắn nhất",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nhìn vào việc có ai phản bác được nội dung không.",
        hint2_vi: "Giữ im lặng không kết luận được đúng hay sai.",
        hint3_vi: "Bỏ về không chứng minh được nội dung đúng hay sai.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Việc bạn ấy bỏ về là hành động, không phải lý do phản bác nội dung; không thể vì thế mà kết luận ý cũ đúng hoặc sai.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong cuộc tranh luận “Nên tăng giờ chơi thể thao”, bạn nói: “Đồng ý vì bạn thân tớ cũng thích mà.” Em nhận xét sao cho đúng?",
        choices: [
          {
            id: "a",
            label_vi: "Lý do này đủ mạnh nên có thể giữ nguyên",
            correct: false,
          },
          { id: "b", label_vi: "Nên mắng bạn vì lý do thiếu căn cứ", correct: false },
          { id: "c", label_vi: "Nên im lặng không nêu ý kiến gì", correct: false },
          {
            id: "d",
            label_vi: "Cần đưa lý do về lợi ích thể thao, không chỉ dựa vào ý muốn của một người",
            correct: true,
          },
        ],
        hint1_vi: "Một bạn thích chưa phải là lý do dùng cho cả lớp.",
        hint2_vi: "Nên thay bằng lý do nêu lợi ích của thể thao.",
        hint3_vi: "Nên thay lý do bằng lợi ích thể thao cho học sinh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Ý thích của một người không đủ làm lý do cho quyết định chung; cần lý do về lợi ích thể thao, và ta nhắc nhắp khéo chứ không công kích.",
    },
  ],
};
