/**
 * Tư duy phản biện · Cấu trúc lập luận: luận điểm và lý do (skill: deb-argument-structure, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking,
 * aligned with the supplemental Grade 5 objective `TLO.DEB.5.ARG.01`.
 */
import type { LessonDefinition } from "../types";

export const argumentStructure: LessonDefinition = {
  id: "deb-argument-structure",
  subjectId: "debate",
  skillId: "deb-argument-structure",
  titleVi: "Cấu trúc lập luận: luận điểm và lý do",
  titleEn: "Argument Structure: Claim and Reason",
  objectiveVi:
    "Em nêu được luận điểm rõ ràng và đưa ra lý do phù hợp để bảo vệ luận điểm đó.",
  objectiveEn: "State a clear claim and give a fitting reason to support it.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-argument",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách nêu một luận điểm và viết một lý do hỗ trợ.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Luận điểm trong một lập luận là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Câu chuyện vui mở đầu nhằm thu hút sự chú ý và gây cười cho cả lớp",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Một thuật ngữ thật khó hiểu để người nghe tưởng bài nói sâu sắc",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Quan điểm hoặc kết luận mà người nói muốn bảo vệ",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Lời chào xã giao trước khi trình bày ý",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nghĩ đến điều người nói muốn bạn đồng ý.",
        hint2_vi: "Đó là ý chính sẽ được bảo vệ bằng lý do.",
        hint3_vi: "Hãy tìm phương án chỉ ý kiến cốt lõi người nói đưa ra để thuyết phục người nghe.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Luận điểm là quan điểm hoặc kết luận mà người nói đưa ra và muốn bảo vệ bằng các lý do và bằng chứng phù hợp.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Lý do trong lập luận có vai trò gì?",
        choices: [
          {
            id: "a",
            label_vi: "Thay thế luận điểm ban đầu bằng một chủ đề hoàn toàn khác biệt",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Kéo dài dung lượng bài phát biểu để nghe có vẻ trang trọng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Dùng làm lời mở đầu chào hỏi các bạn trong nhóm",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Giải thích vì sao luận điểm là hợp lý",
            correct: true,
          },
        ],
        hint1_vi: "Hãy nghĩ đến điều giúp người nghe hiểu vì sao nên tin.",
        hint2_vi: "Nó cho thấy luận điểm có căn cứ rõ ràng.",
        hint3_vi: "Tìm câu nêu vai trò làm rõ nguyên nhân khiến kết luận trở nên đáng tin.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Lý do giải thích và chứng minh luận điểm, giúp người nghe thấy quan điểm đó có căn cứ thay vì chỉ là ý muốn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Luận điểm: “Lớp ta nên trồng thêm cây xanh ở sân trường.” Câu nào là lý do phù hợp nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Cây xanh che mát sân trường và lọc bụi trong không khí",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Thời khóa biểu tuần sau của lớp có thêm tiết vẽ",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Bạn Nam rất mê môn bóng đá nên giờ ra chơi nào cũng rủ bạn đá bóng",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Trường em hiện được xây thành hai dãy nhà",
            correct: false,
          },
        ],
        hint1_vi: "Lý do phải cùng nói về cây xanh và sân trường.",
        hint2_vi: "Hãy chọn câu nêu lợi ích của việc trồng cây.",
        hint3_vi: "Tác dụng tỏa bóng râm và giữ không khí trong lành hỗ trợ thẳng vào đề xuất trồng cây.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu “Cây xanh che mát sân trường và lọc bụi trong không khí” nêu đúng lợi ích của việc trồng cây nên trực tiếp hỗ trợ luận điểm; ba câu còn lại không liên quan đến chủ đề trồng cây.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Luận điểm: “Nên tắt điện khi ra khỏi lớp.” Câu nào hỗ trợ luận điểm tốt nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Thời tiết ngoài sân trường hôm nay dịu mát",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tắt điện không dùng đến giúp tiết kiệm điện năng",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Bạn Hòa hôm nay đeo chiếc khăn quàng đỏ thắm",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Tiết học ngay trước giờ ra chơi là Toán",
            correct: false,
          },
        ],
        hint1_vi: "Lý do phải nói về việc sử dụng điện trong phòng học.",
        hint2_vi: "Hãy chọn câu nêu lợi ích thực tế của việc ngắt công tắc đèn quạt.",
        hint3_vi: "Tránh lãng phí nguồn năng lượng chung là tác dụng trực tiếp khi ra khỏi phòng nhớ tắt đèn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu “Tắt điện không dùng đến giúp tiết kiệm điện năng” nêu đúng lợi ích nên hỗ trợ trực tiếp luận điểm tắt điện khi ra khỏi lớp; các câu còn lại không liên quan.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em muốn thuyết phục bạn cùng nhóm đọc sách mỗi ngày 15 phút. Câu ghép luận điểm và lý do nào rõ ràng nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Ta nên đọc sách 15 phút mỗi ngày vì bạn Lan lớp trưởng học rất giỏi môn Toán và viết chữ rất đẹp",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Ta nên đọc sách 15 phút mỗi ngày vì dự báo thời tiết báo chiều mai khu phố mình có mưa rào",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ta nên đọc sách 15 phút mỗi ngày vì việc này giúp mở rộng vốn từ và hiểu bài sâu",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Ta nên đọc sách 15 phút mỗi ngày vì ai trong nhóm cũng phải làm theo mà không cần hỏi",
            correct: false,
          },
        ],
        hint1_vi: "Cần có cả luận điểm rõ ràng và lý do cùng chủ đề.",
        hint2_vi: "Lý do phải nêu lợi ích trực tiếp của thói quen đọc sách hằng ngày.",
        hint3_vi: "Tích lũy thêm từ ngữ và nắm chắc kiến thức là căn cứ sát trọng tâm cho lời khuyên đọc sách.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu ghép vừa nêu rõ luận điểm nên đọc sách 15 phút mỗi ngày, vừa đưa lý do đúng trọng tâm là mở rộng vốn từ và hiểu bài sâu; các câu còn lại đưa lý do lạc đề hoặc áp đặt.",
    },
  ],
};
