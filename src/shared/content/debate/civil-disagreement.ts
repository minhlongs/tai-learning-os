/**
 * Tư duy phản biện · Tranh luận văn minh (skill: deb-civil-disagreement, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking,
 * aligned with the supplemental Grade 5 objective `TLO.DEB.5.DIALOG.04`.
 */
import type { LessonDefinition } from "../types";

export const civilDisagreement: LessonDefinition = {
  id: "deb-civil-disagreement",
  subjectId: "debate",
  skillId: "deb-civil-disagreement",
  titleVi: "Tranh luận văn minh",
  titleEn: "Civil Disagreement",
  objectiveVi:
    "Em giữ bình tĩnh khi bất đồng, ghi nhận điểm hợp lý của bạn và phản hồi vào lý lẽ thay vì công kích cá nhân.",
  objectiveEn:
    "Stay calm when disagreeing, acknowledge valid points, and respond to the reasoning rather than the person.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-civil",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách luyện một câu phản hồi lịch sự khi không đồng ý.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi bạn nói điều em không đồng ý, phản ứng nào là văn minh?",
        choices: [
          {
            id: "a",
            label_vi: "Giữ bình tĩnh, nêu rõ điểm em không đồng ý và lý do",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Cắt ngang lời bạn ngay lập tức và nói to hơn để áp đảo cả nhóm",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đem ý kiến của bạn ra trêu đùa ngay trước lớp",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Đứng phắt dậy bỏ ra ngoài không thèm nghe",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nghĩ đến việc thể hiện sự khác biệt góc nhìn mà vẫn giữ lịch sự.",
        hint2_vi: "Phản ứng tốt cần điềm đạm và giải thích rõ căn cứ của mình.",
        hint3_vi: "Thái độ ôn hòa đi kèm lập luận cụ thể là biểu hiện của người biết đối thoại.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Văn minh là giữ bình tĩnh, nêu rõ điểm không đồng ý và giải thích lý do để cùng nhau bàn nội dung.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trước khi chỉ ra chỗ bạn chưa đúng, em nên làm gì với điểm hợp lý của bạn?",
        choices: [
          {
            id: "a",
            label_vi: "Bác bỏ sạch toàn bộ mọi câu chữ mà bạn vừa trình bày",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Lờ đi hoàn toàn vì không cần nhắc tới phần đúng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ghi nhận điểm đúng đó trước",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Chỉ xoáy sâu vào chỗ sơ hở để bắt bẻ bạn",
            correct: false,
          },
        ],
        hint1_vi: "Một cuộc bàn bạc tích cực luôn trân trọng những ý có căn cứ của người đối thoại.",
        hint2_vi: "Việc đó giúp bạn cảm thấy được lắng nghe và cởi mở hơn.",
        hint3_vi: "Hãy bắt đầu bằng lời công nhận phần hợp lý trong ý kiến của bạn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Ghi nhận điểm hợp lý của bạn trước giúp cuộc trao đổi tôn trọng nhau, và sau đó mới nêu điểm cần bàn thêm.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em không đồng ý với lý lẽ của bạn. Câu trả lời nào văn minh nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Mình không muốn nghe thêm câu nào nữa vì ý kiến của bạn lúc nào cũng lạc đề và mất thời gian.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mình thấy ý bạn có lý, nhưng mình còn băn khoăn vì … nên muốn hỏi thêm.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Bạn chưa tìm hiểu kỹ gì hết mà cứ phát biểu liều, cả nhóm đừng ai nghe theo ý kiến đó nhé.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Ai nhìn vào cũng biết ngay là bạn đã nghĩ sai hoàn toàn rồi.",
            correct: false,
          },
        ],
        hint1_vi: "Câu nên công nhận phần hợp lý rồi mới nêu điều chưa rõ.",
        hint2_vi: "Câu cần đặt câu hỏi để làm rõ lập luận chứ không chê người nói.",
        hint3_vi: "Vừa trân trọng góc nhìn của bạn vừa nêu câu hỏi trao đổi thêm là cách ứng xử lịch sự.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu trả lời ghi nhận điểm hợp lý của bạn, rồi nêu băn khoăn và đề nghị hỏi thêm nên vừa lịch sự vừa đi vào nội dung; các câu còn lại chê bai hoặc phủ nhận người nói.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Bạn nói lớn tiếng và tỏ ra giận. Em nên phản ứng sao?",
        choices: [
          {
            id: "a",
            label_vi: "Nói vọt lên thật to hơn bạn để giành phần thắng",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Dọa sẽ báo ngay với cô giáo để phạt bạn ấy",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cười chế nhạo thái độ nóng nảy của bạn",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Nói nhẹ nhàng rằng ta cùng bàn chậm lại cho dễ nghe",
            correct: true,
          },
        ],
        hint1_vi: "Hãy chọn cách giúp hai bạn hạ nhiệt và quay lại trao đổi bình tĩnh.",
        hint2_vi: "Cách đó không lớn tiếng đáp trả, không đe dọa, không chế giễu.",
        hint3_vi: "Lời rủ ôn tồn để giảm nhịp độ cuộc trò chuyện sẽ giúp cả hai dễ lắng nghe nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Đề nghị cùng bàn chậm lại là cách hạ nhiệt và quay về nội dung; nói to hơn, đe dọa hay chế giễu chỉ làm mâu thuẫn tăng.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong nhóm, bạn đưa ý kiến khác em và bạn vẫn nói rất rõ ràng. Em nên làm gì để kết thúc phần thảo luận cho tốt?",
        choices: [
          {
            id: "a",
            label_vi: "Ép bạn phải gạt bỏ hết lý lẽ riêng để làm theo đúng phương án ban đầu của em",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tự ghi luôn quyết định của riêng em vào biên bản nhóm mà không cần hỏi lại bạn",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nêu ý em, nghe bạn, rồi cùng chọn phần hai bên tạm đồng ý",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Sang kể xấu bạn với các tổ khác ngay sau giờ học",
            correct: false,
          },
        ],
        hint1_vi:
          "Một cuộc thảo luận tốt khép lại bằng điểm chung mà hai phía cùng chấp nhận được.",
        hint2_vi: "Cần vừa trình bày góc nhìn của mình vừa tôn trọng lắng nghe bạn.",
        hint3_vi: "Sau khi chia sẻ và lắng nghe đầy đủ, hai bên hãy thống nhất những nội dung chung trước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thảo luận văn minh cho ra điểm hai bên tạm đồng ý sau khi mỗi người đã nêu ý và lắng nghe; ép buộc, tự quyết hoặc nói xấu đều không phải cách làm việc nhóm.",
    },
  ],
};
