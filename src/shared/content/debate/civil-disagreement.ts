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
          { id: "b", label_vi: "Cắt lời bạn và nói to hơn", correct: false },
          { id: "c", label_vi: "Chế giễu bạn ngay trong lớp", correct: false },
          { id: "d", label_vi: "Im lặng và bỏ ra ngoài", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến việc thể hiện không đồng ý mà vẫn giữ lịch sự.",
        hint2_vi: "Phản ứng đó cần nêu cả điểm không đồng ý và lý do.",
        hint3_vi: "Giữ bình tĩnh và nêu lý do là cách văn minh.",
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
          { id: "a", label_vi: "Phản đối mọi điều bạn nói", correct: false },
          { id: "b", label_vi: "Bỏ qua vì không cần nói", correct: false },
          { id: "c", label_vi: "Ghi nhận điểm đúng đó trước", correct: true },
          {
            id: "d",
            label_vi: "Chỉ tập trung vào chỗ sai để chê",
            correct: false,
          },
        ],
        hint1_vi: "Một cuộc bàn bạc tốt ghi nhận điều đúng trước.",
        hint2_vi: "Việc đó giúp bạn cảm thấy được tôn trọng.",
        hint3_vi: "Em nên ghi nhận điểm hợp lý của bạn trước.",
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
          { id: "a", label_vi: "Mình không thèm bàn với bạn nữa.", correct: false },
          {
            id: "b",
            label_vi: "Mình thấy ý bạn có lý, nhưng mình còn băn khoăn vì … nên muốn hỏi thêm.",
            correct: true,
          },
          { id: "c", label_vi: "Bạn nói chẳng ra gì cả.", correct: false },
          { id: "d", label_vi: "Ai cũng biết bạn sai rồi.", correct: false },
        ],
        hint1_vi: "Câu nên công nhận điểm hợp lý rồi mới nêu băn khoăn.",
        hint2_vi: "Câu cần hỏi để làm rõ lập luận, không chê người nói.",
        hint3_vi: "“Băn khoăn vì … nên muốn hỏi thêm” là cách văn minh.",
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
          { id: "a", label_vi: "Nói to hơn bạn để được lời", correct: false },
          { id: "b", label_vi: "Dọa sẽ mách cô ngay", correct: false },
          { id: "c", label_vi: "Cười nhạo bạn", correct: false },
          {
            id: "d",
            label_vi: "Nói nhẹ nhàng rằng ta cùng bàn chậm lại cho dễ nghe",
            correct: true,
          },
        ],
        hint1_vi: "Hãy chọn cách giúp hai bạn bàn lại bình tĩnh.",
        hint2_vi: "Cách đó không nói to, không đe dọa, không chế giễu.",
        hint3_vi: "Nên đề nghị cùng bàn chậm lại một cách nhẹ nhàng.",
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
          { id: "a", label_vi: "Bắt buộc bạn phải đồng ý với em", correct: false },
          {
            id: "b",
            label_vi: "Tự quyết định và không cần lắng nghe bạn",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nêu ý em, nghe bạn, rồi cùng chọn phần hai bên tạm đồng ý",
            correct: true,
          },
          { id: "d", label_vi: "Nói xấu bạn với nhóm khác", correct: false },
        ],
        hint1_vi:
          "Một cuộc thảo luận tốt kết thúc bằng điểm hai bên cùng nhận.",
        hint2_vi: "Cần vừa nêu ý mình, vừa lắng nghe bạn.",
        hint3_vi: "Nên nêu ý em, nghe bạn, rồi cùng chọn phần tạm đồng ý.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thảo luận văn minh cho ra điểm hai bên tạm đồng ý sau khi mỗi người đã nêu ý và lắng nghe; ép buộc, tự quyết hoặc nói xấu đều không phải cách làm việc nhóm.",
    },
  ],
};
