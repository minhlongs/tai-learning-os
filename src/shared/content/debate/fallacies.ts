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
            label_vi: "Một đoạn trình bày thật dài có kèm nhiều ví dụ thực tế để giải thích kỹ vấn đề",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Cách diễn đạt chuẩn mực và thuyết phục nhất trong buổi thảo luận nhóm",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Việc giữ im lặng lắng nghe bạn nói hết câu trước khi nêu phản hồi",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cách nói nghe xuôi tai nhưng thực chất thiếu lý lẽ chắc chắn",
            correct: true,
          },
        ],
        hint1_vi: "Hãy nghĩ đến câu nghe có vẻ hợp lý nhưng thực ra lạc đề.",
        hint2_vi: "Lỗi này không phản bác được nội dung đang bàn.",
        hint3_vi:
          "Đó là kiểu lập luận tạo cảm giác thuyết phục giả tạo dù không có căn cứ vững vàng.",
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
          {
            id: "a",
            label_vi: "Dùng bằng chứng thực tế kiểm chứng được để đánh giá thẳng vào ý tưởng",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Công kích cá nhân người nói thay vì bàn về nội dung",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Đưa ra lý lẽ chặt chẽ và sát chủ đề đang bàn",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Nêu kết luận khách quan dựa trên số liệu",
            correct: false,
          },
        ],
        hint1_vi: "Câu này chê kết quả học tập của bạn chứ không xét ý kiến bạn nêu.",
        hint2_vi: "Nó chĩa vào con người phát biểu thay vì phân tích lập luận.",
        hint3_vi: "Đem chuyện riêng của bạn ra chê để bác bỏ ý kiến chính là lỗi nhắm vào người nói.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu trên chỉ trích chuyện riêng của bạn ấy thay vì phản bác ý kiến, nên là lỗi công kích cá nhân.",
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
            label_vi: "So sánh công bằng độ bền ngòi bút và nét mực của các loại",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chê bai tính cách cá nhân của người dùng bút",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Lấy số đông người dùng làm bằng chứng thay cho chất lượng bút",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Thử nghiệm thực tế nét mực trước khi đưa ra kết luận",
            correct: false,
          },
        ],
        hint1_vi: "Câu này dựa hoàn toàn vào việc có nhiều bạn đang dùng.",
        hint2_vi: "Nhiều người chọn chưa chắc đã chứng minh sản phẩm đó viết êm và bền nhất.",
        hint3_vi: "Dùng sự phổ biến trong tập thể để kết luận chất lượng là ngụy biện dựa vào đám đông.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu này dùng việc nhiều bạn dùng để kết luận bút tốt nhất, thay vì đưa lý do về chất lượng ngòi và mực, nên là lỗi lấy số đông làm bằng chứng.",
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
            label_vi: "Vì bạn ấy không ngồi tranh luận tiếp nên ý kiến ban đầu chắc chắn đúng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì bạn ấy ra về sớm nên mọi lý lẽ bạn vừa nêu đều hoàn toàn sai",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Câu nhận xét trên là bằng chứng vững chắc nhất",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nhìn vào việc có ai đưa ra căn cứ phản biện nội dung chưa.",
        hint2_vi: "Hành động rời khỏi cuộc họp không tự động làm một ý kiến trở thành đúng hay sai.",
        hint3_vi: "Chuyện người nói đi về là thái độ ứng xử, không chứng minh được giá trị của luận điểm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Việc bạn ấy bỏ về là hành động cá nhân, không phải lý do phản bác nội dung; không thể vì thế mà kết luận ý cũ đúng hoặc sai.",
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
            label_vi: "Lý do này đã đủ sức thuyết phục cả trường nên nhóm không cần bổ sung thêm dẫn chứng nào",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Nên trách mắng bạn thật gay gắt trước lớp vì nêu lý do thiếu căn cứ",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nên giữ im lặng bỏ qua luôn không góp ý thêm điều gì cho bạn",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cần đưa lý do về lợi ích thể thao, không chỉ dựa vào ý muốn của một người",
            correct: true,
          },
        ],
        hint1_vi: "Một bạn thích chưa phải là lý do thuyết phục cho quyết định chung của tập thể.",
        hint2_vi: "Nên gợi ý bạn bổ sung tác dụng rèn luyện sức khỏe của hoạt động vận động.",
        hint3_vi: "Hãy góp ý lịch sự để bạn thay sở thích cá nhân bằng tác dụng thực tế đối với học sinh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Ý thích của một người không đủ làm lý do cho quyết định chung; cần nêu lý do về lợi ích sức khỏe của thể thao, và góp ý khéo léo chứ không công kích.",
    },
  ],
};
