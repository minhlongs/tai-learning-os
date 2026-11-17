/**
 * Tiếng Việt · Viết đoạn văn nêu ý kiến về hiện tượng học đường (skill: vie-expressive-argument, lớp 5)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const expressiveArgument: LessonDefinition = {
  id: "vie-expressive-argument",
  subjectId: "vietnamese",
  skillId: "vie-expressive-argument",
  titleVi: "Viết đoạn văn nêu ý kiến về đời sống học đường",
  titleEn: "Writing an Opinion Paragraph on School Life",
  objectiveVi:
    "Em sẽ biết sắp xếp mạch lạc câu nêu ý kiến, các lí lẽ giải thích và dẫn chứng thực tế khi viết đoạn văn bàn về một hiện tượng học đường.",
  objectiveEn:
    "Organize a clear claim, supporting reasons, and concrete real-life examples when writing an opinion paragraph about school life.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-expressive-argument",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách viết một đoạn văn năm câu nêu ý kiến về việc giữ trật tự trong thư viện trường.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để một đoạn văn nêu ý kiến về hiện tượng đời sống học đường có sức thuyết phục, người viết cần kết hợp những yếu tố nào?",
        question_en:
          "Which elements must work together for an opinion paragraph on school life to be persuasive?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ cần viết một câu khẩu hiệu thật kêu rồi treo ở cửa lớp mà không cần giải thích thêm vì sao em chọn câu ấy.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Câu mở đầu nêu rõ ý kiến, tiếp theo là lí lẽ giải thích hợp lí và dẫn chứng cụ thể, gần gũi, cuối cùng khẳng định lại ý nghĩa vấn đề.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Kể lại một câu chuyện cổ tích thần kì, xa lạ hoàn toàn với chuyện trường lớp của em.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Dùng những lời lẽ thật gay gắt để chê bai bạn bè thay vì bình tĩnh phân tích điều đúng, điều nên làm và cùng góp ý chân thành để tập thể tiến bộ.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy nghĩ xem: nếu em chỉ nói “Em đồng ý” mà không giải thích vì sao và không nêu việc thật ở lớp, người đọc có bị thuyết phục không?",
        hint2_vi:
          "Văn nêu ý kiến khác với văn kể chuyện cổ tích ở chỗ cần lập luận rõ ràng quanh một vấn đề thực tế.",
        hint3_vi:
          "Ba trụ cột của đoạn văn nêu ý kiến gồm: quan điểm rõ ràng, lí lẽ giải thích vì sao và dẫn chứng thực tế làm minh chứng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Một đoạn văn nêu ý kiến chặt chẽ cần có câu mở đoạn nêu rõ quan điểm của người viết, phần thân đoạn đưa ra lí lẽ giải thích kèm dẫn chứng thực tế xác thực, và câu kết khẳng định lại giá trị hay lời nhắn nhủ tích cực.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Với đề bài nêu ý kiến về phong trào “Mang bình nước cá nhân đến trường để giảm chai nhựa dùng một lần”, câu nào dưới đây đóng vai trò là lí lẽ giải thích?",
        question_en:
          "Which sentence serves as a supporting reason for bringing reusable water bottles to school?",
        choices: [
          {
            id: "a",
            label_vi:
              "Bình đựng nước của bạn Tuấn có màu bạc, in hình chú cá heo xanh và được bạn ấy dán thêm vài hình dán ngộ nghĩnh ở quanh nắp bình.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Sáng thứ Hai đầu tuần, toàn trường em tập trung dưới sân trường để chào cờ.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Giờ ra chơi hôm qua, em cùng bạn Lan ngồi vẽ tranh ở hành lang lớp và kể cho nhau nghe về phong trào mới của trường học.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Thói quen dùng bình cá nhân giúp hạn chế hàng trăm vỏ chai nhựa khó phân hủy thải ra thùng rác trường học mỗi tuần.",
            correct: true,
          },
        ],
        hint1_vi:
          "Lí lẽ trả lời trực tiếp cho câu hỏi: Vì sao việc mang bình nước cá nhân lại cần thiết và đáng ủng hộ?",
        hint2_vi:
          "Màu sắc chiếc bình của bạn Tuấn hay cảnh chào cờ, vẽ tranh không giải thích nguyên nhân giảm rác nhựa.",
        hint3_vi:
          "Câu phân tích tác dụng cắt giảm lượng vỏ chai nhựa khó phân hủy chính là lí lẽ làm sáng tỏ ý kiến.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “Thói quen dùng bình cá nhân giúp hạn chế hàng trăm vỏ chai nhựa khó phân hủy thải ra thùng rác trường học mỗi tuần.” giải thích trực tiếp lợi ích đối với môi trường học đường, nên đây là lí lẽ vững chắc.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi viết đoạn văn tán thành việc học sinh cùng tham gia chăm sóc bồn hoa trước cửa lớp, câu nào dưới đây là dẫn chứng cụ thể và thuyết phục nhất?",
        question_en:
          "Which sentence provides the most concrete and convincing evidence for tending classroom flowerbeds?",
        choices: [
          {
            id: "a",
            label_vi:
              "Từ ngày lớp Năm Hai phân công mỗi tổ tưới nước và nhặt lá khô mười phút cuối buổi, bồn hoa mười giờ trước hiên lớp nở rực rỡ và không còn một mảnh giấy vụn nào.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Ai trên thế giới cũng biết cây xanh cần có ánh sáng mặt trời và đất ẩm để quang hợp và lớn lên.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Em nghĩ rằng chăm sóc cây xanh là một việc làm rất có ý nghĩa đối với tuổi học trò nên ai cũng nên tham gia.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Hoa mười giờ thường có rất nhiều màu như hồng cánh sen, vàng chanh, cam và đỏ thẫm, mỗi sáng đều bung nở khoe sắc dưới nắng nên trông rất đẹp mắt.",
            correct: false,
          },
        ],
        hint1_vi:
          "Dẫn chứng là sự việc có thật, cụ thể đã diễn ra ở lớp hoặc ở trường để chứng minh lí lẽ là đúng.",
        hint2_vi:
          "Câu bắt đầu bằng “Em nghĩ rằng…” là câu nêu ý kiến chung; câu kể các màu hoa chỉ là thông tin miêu tả.",
        hint3_vi:
          "Việc thật của tập thể lớp Năm Hai cùng sự thay đổi rõ rệt của bồn hoa trước hiên lớp chính là dẫn chứng sinh động nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Dẫn chứng thuyết phục cần gắn với hoạt động thực tế và kết quả cụ thể: cách phân công mười phút cuối buổi của lớp Năm Hai và hình ảnh bồn hoa nở rực rỡ, sạch bóng giấy vụn.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cho bốn câu văn bàn về việc vận động nhẹ nhàng trong giờ ra chơi: (1) Vì vậy, mỗi học sinh nên dành ít phút ra sân hít thở khí trời và vui chơi lành mạnh cùng bạn bè. (2) Theo em, việc rời bàn học ra sân vận động nhẹ nhàng trong giờ ra chơi là thói quen rất bổ ích. (3) Ngay ở lớp em, từ khi cả tổ cùng nhảy dây và đá cầu mười lăm phút giải lao, buổi học tiết sau bạn nào cũng tỉnh táo và phát biểu sôi nổi hơn. (4) Sau những tiết học tập trung cao độ, vận động giúp đôi mắt được thư giãn và cơ thể dẻo dai hơn. Thứ tự sắp xếp nào tạo thành đoạn văn nêu ý kiến mạch lạc nhất?",
        question_en:
          "Which order arranges the four sentences into the most coherent opinion paragraph?",
        choices: [
          {
            id: "a",
            label_vi: "(3) – (1) – (4) – (2)",
            correct: false,
          },
          {
            id: "b",
            label_vi: "(1) – (4) – (2) – (3)",
            correct: false,
          },
          {
            id: "c",
            label_vi: "(2) – (4) – (3) – (1)",
            correct: true,
          },
          {
            id: "d",
            label_vi: "(4) – (1) – (3) – (2)",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy xếp theo mạch chuẩn: Nêu ý kiến mở đầu -> Nêu lí lẽ giải thích -> Đưa dẫn chứng thực tế -> Kết luận khuyên nhủ.",
        hint2_vi:
          "Câu (2) có cụm “Theo em…” dùng để mở đoạn nêu quan điểm; câu (1) có từ nối “Vì vậy…” dùng để khép lại đoạn văn.",
        hint3_vi:
          "Sau câu mở đoạn (2), câu (4) giải thích lợi ích cho mắt và cơ thể, tiếp đến câu (3) nêu dẫn chứng ở lớp em, rồi kết lại bằng câu (1).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trình tự (2) – (4) – (3) – (1) tuân thủ đúng bố cục chặt chẽ của đoạn văn nghị luận nhỏ: câu (2) nêu ý kiến, câu (4) đưa lí lẽ về sức khỏe, câu (3) dẫn chứng thực tế tại lớp học và câu (1) rút ra lời khuyên kết đoạn.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi viết đoạn văn góp ý về hiện tượng một số bạn nói chuyện lớn tiếng trong phòng đọc thư viện trường, cách diễn đạt nào vừa rõ quan điểm vừa lịch sự, giàu tính xây dựng nhất?",
        question_en:
          "Which wording expresses a clear, respectful, and constructive opinion about noise in the school library?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nhà trường nên khóa chặt cửa thư viện suốt cả tuần để không còn bạn nào có thể vào đó nói chuyện ồn ào, làm phiền những người đang đọc sách bên trong.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Ai trót nói chuyện trong thư viện đều là người không biết tôn trọng bạn đọc và không đáng được mượn truyện.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Ai muốn nói to bao nhiêu trong phòng đọc cũng được vì giờ ra chơi là quyền riêng của mỗi người.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Giữ yên lặng trong thư viện là nét đẹp văn minh học đường, vì không gian tĩnh lặng giúp mọi người tập trung đọc hiểu và thể hiện sự tôn trọng bạn đọc xung quanh.",
            correct: true,
          },
        ],
        hint1_vi:
          "Ý kiến thuyết phục cần hướng tới giải pháp tích cực và tôn trọng tập thể, không cực đoan hay xúc phạm người khác.",
        hint2_vi:
          "Đòi khóa cửa thư viện hay nặng lời chê bai bạn bè đều không giúp xây dựng thói quen văn minh.",
        hint3_vi:
          "Khẳng định lợi ích của không gian tĩnh lặng đối với việc đọc hiểu và sự tôn trọng lẫn nhau vừa đúng đắn vừa chân thành.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu văn “Giữ yên lặng trong thư viện là nét đẹp văn minh học đường, vì không gian tĩnh lặng giúp mọi người tập trung đọc hiểu và thể hiện sự tôn trọng bạn đọc xung quanh.” nêu rõ quan điểm kết hợp lí lẽ thuyết phục với thái độ ôn hòa, tôn trọng và xây dựng.",
    },
  ],
};
