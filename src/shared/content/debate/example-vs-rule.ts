/**
 * Tư duy phản biện · Ví dụ đơn lẻ và quy luật chung (skill: deb-example-vs-rule, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const exampleVsRule: LessonDefinition = {
  id: "deb-example-vs-rule",
  subjectId: "debate",
  skillId: "deb-example-vs-rule",
  titleVi: "Phân biệt ví dụ đơn lẻ và quy luật chung",
  titleEn: "Single Example vs. General Rule",
  objectiveVi:
    "Em phân biệt được một trường hợp riêng lẻ với nhận định khái quát cho mọi trường hợp và biết tìm phản ví dụ để kiểm tra các kết luận vội vàng.",
  objectiveEn:
    "Distinguish a single example from a sweeping rule and use counterexamples to test hasty generalizations.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-example-vs-rule",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chú ý các từ 'mọi', 'tất cả', 'luôn luôn' trong cuộc trò chuyện và thử nghĩ xem có ngoại lệ nào không.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Nam mượn một cuốn sách khoa học ở thư viện lớp thấy có nhiều chữ nhỏ, liền kết luận: “Mọi cuốn sách khoa học trên đời đều toàn chữ nhỏ và không có hình vẽ!” Điểm chưa hợp lý trong kết luận của Nam là gì?",
        question_en:
          "Nam borrows one science book from the class library with small print and concludes: 'Every science book in the world has only tiny print and no pictures!' What is flawed in Nam's conclusion?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nam đã dành quá nhiều tuần đọc hết cả tủ sách khoa học của trường trước khi đưa ra lời nhận xét ngắn gọn này.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Theo nội quy thư viện thì các loại sách phổ biến khoa học không bao giờ được xếp trên kệ sách chung của lớp học.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Nam mới chỉ xem một cuốn sách đơn lẻ nhưng đã vội vàng kết luận thành quy luật chung cho tất cả sách khoa học.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Nam quên đọc kỹ tên tác giả, nhà xuất bản và năm in ở trang bìa lót trước khi kể lại câu chuyện với các bạn.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy so sánh số lượng sách Nam đã xem (1 cuốn) với phạm vi Nam kết luận (“mọi cuốn sách khoa học”).",
        hint2_vi:
          "Một ví dụ riêng lẻ có đủ để đại diện cho hàng nghìn cuốn sách khoa học có tranh minh họa sinh động khác không?",
        hint3_vi:
          "Dùng một trường hợp đơn lẻ để khẳng định cho “mọi” trường hợp là lỗi khái quát vội vàng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Một cuốn sách chỉ là một ví dụ đơn lẻ. Từ một ví dụ mà dùng từ “mọi” để khẳng định cho toàn bộ sách khoa học là kết luận quá vội vàng vì trên thực tế có rất nhiều sách khoa học in màu kèm hình minh họa rõ đẹp.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để kiểm tra xem một nhận định dùng từ “luôn luôn” hoặc “tất cả” có thật sự đúng hay không, cách làm đơn giản và thuyết phục nhất là gì?",
        question_en:
          "To test whether a claim using 'always' or 'all' is truly accurate, what is the simplest and most convincing method?",
        choices: [
          {
            id: "a",
            label_vi:
              "Thử tìm ít nhất một trường hợp thực tế trái ngược với nhận định đó (gọi là phản ví dụ).",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Tin ngay lập tức mà không cần kiểm tra vì câu nói có chữ “luôn luôn” nghe rất dứt khoát và tự tin.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đọc lại thật to và rõ ràng câu nhận định đó đúng ba lần trước cả nhóm xem nghe có xuôi tai hay không.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chuyển ngay sang bàn một chủ đề khác nhẹ nhàng hơn để cả nhóm không phải mất thời gian suy nghĩ thêm.",
            correct: false,
          },
        ],
        hint1_vi:
          "Khi ai đó nói “Tất cả các loài chim đều biết bay”, em chỉ cần nhớ tới chim cánh cụt hoặc đà điểu thì điều gì xảy ra?",
        hint2_vi:
          "Một quy luật khẳng định “tất cả đều như vậy” có còn đúng tuyệt đối nếu tồn tại một ngoại lệ có thật không?",
        hint3_vi:
          "Chỉ cần chỉ ra một phản ví dụ xác thực là đủ chứng minh nhận định “tất cả/luôn luôn” đã nói quá rộng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Một nhận định tuyệt đối như “tất cả” hay “luôn luôn” đòi hỏi không có bất kỳ ngoại lệ nào. Vì vậy, chỉ cần tìm được một phản ví dụ có thật là ta biết nhận định đó cần được diễn đạt cẩn trọng hơn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Hà nói trong giờ Khoa học: “Cây nào trồng trong bóng râm trong lớp cũng đều héo úa hết!” Thực tế nào dưới đây là phản ví dụ đúng để giúp Hà điều chỉnh lại nhận định?",
        question_en:
          "In Science class, Ha says: 'Every plant grown in indoor classroom shade withers away!' Which fact below is a valid counterexample that helps Ha refine her statement?",
        choices: [
          {
            id: "a",
            label_vi:
              "Khóm hoa hướng dương trồng ngoài bồn đất giữa sân trường vẫn nở hoa vàng rực rỡ suốt những ngày nắng hè.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chiều hôm qua các bạn tổ trực nhật đã dùng chổi quét sạch toàn bộ lá khô bay vào hành lang trước cửa lớp.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Một chậu xương rồng nhỏ đặt trên bệ cửa sổ bị bỏ quên không tưới giọt nước nào suốt hai tháng nên khô héo.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chậu cây trầu bà đặt ở góc kệ sách trong bóng râm của lớp 4B vẫn xanh tốt và ra lá mới suốt cả học kỳ.",
            correct: true,
          },
        ],
        hint1_vi:
          "Phản ví dụ cho câu của Hà phải là một cây vừa “trồng trong bóng râm trong lớp” vừa “không bị héo úa”.",
        hint2_vi:
          "Hoa hướng dương ngoài nắng hay cây bị héo có chứng minh được là cây trong bóng râm vẫn sống khỏe không?",
        hint3_vi:
          "Chậu trầu bà sống xanh tốt ngay trong góc râm của lớp học chính là bằng chứng thực tế bác bỏ từ “cây nào cũng héo”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Để kiểm tra câu “cây nào trong bóng râm cũng héo”, ta cần tìm một cây trồng trong bóng râm nhưng vẫn phát triển khỏe mạnh. Chậu trầu bà xanh tốt ở góc lớp 4B là phản ví dụ trực tiếp và thuyết phục nhất.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hôm thứ Hai trời mưa làm sân trường ướt nên giờ thể dục phải học trong phòng đa năng. Hôm thứ Ba bạn Bình nói: “Cứ đến tiết thể dục là trời lại mưa!” Em nhận xét thế nào về câu nói của Bình?",
        question_en:
          "On Monday it rained during PE, moving class indoors. On Tuesday Binh says: 'Whenever we have PE class, it always rains!' How should you evaluate Binh's statement?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đó là một quy luật thời tiết rất chính xác vì thực tế sáng thứ Hai vừa qua trời đã đổ mưa đúng giờ học.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đó là kết luận vội vàng từ một buổi học đơn lẻ; thực tế nhiều tiết thể dục tuần trước trời vẫn nắng.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Đó là bằng chứng rõ ràng cho thấy cứ mỗi lần học sinh xếp hàng tập thể dục là mây đen lại kéo về sân trường.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Câu nhận xét của Bình sẽ trở thành quy luật đúng hoàn toàn nếu tất cả các bạn trong tổ cùng gật đầu đồng ý.",
            correct: false,
          },
        ],
        hint1_vi:
          "Một buổi mưa hôm thứ Hai có đủ để kết luận cho mọi tiết thể dục trong cả năm học không?",
        hint2_vi:
          "Hãy nhớ lại những tuần học trước xem có tiết thể dục nào cả lớp tập dưới sân nắng đẹp không.",
        hint3_vi:
          "Bình đã lấy một sự việc vừa xảy ra để khái quát quá mức bằng cụm từ “cứ đến tiết thể dục là…”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Một cơn mưa trùng vào tiết thể dục hôm thứ Hai chỉ là một lần quan sát đơn lẻ. Khi nhìn lại nhiều tuần nắng ráo trước đó, ta thấy ngay không có quy luật “cứ học thể dục là mưa”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau khi khảo sát 3 bạn ngồi bàn đầu đều thích đọc truyện trinh thám, tổ trưởng muốn báo cáo trước lớp để mua sách cho cả 35 bạn. Cách diễn đạt nào trung thực và chuẩn xác nhất?",
        question_en:
          "After asking 3 front-row students who all like detective stories, the group leader wants to report to the class of 35 students. Which wording is most accurate and honest?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Tất cả học sinh khối lớp 4 của trường mình đều chỉ thích đọc truyện trinh thám hơn mọi thể loại sách khác trên kệ.”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Qua đợt hỏi ý kiến sáng nay thì không một bạn nào trong lớp 4A còn hứng thú với sách lịch sử hay thơ thiếu nhi nữa.”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Ba bạn đầu tiên tớ hỏi đều thích truyện trinh thám; mình nên hỏi thêm các tổ khác để biết sở thích cả lớp rồi mới chọn sách.”",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "“Quy luật chung của lớp mình là ba bạn ngồi bàn đầu tiên chọn thể loại gì thì cả 32 bạn còn lại cũng đều chọn giống hệt như vậy.”",
            correct: false,
          },
        ],
        hint1_vi:
          "Ý kiến của 3 bạn có chắc chắn giống hệt ý kiến của 32 bạn còn lại trong lớp không?",
        hint2_vi:
          "Người có tư duy phản biện nêu đúng phạm vi mình đã quan sát được và không dùng từ “tất cả” khi chưa khảo sát đủ.",
        hint3_vi:
          "Báo cáo rõ con số 3 bạn đã hỏi và đề nghị khảo sát thêm các tổ khác vừa trung thực vừa giúp lớp chọn sách hợp lý.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nêu rõ “ba bạn đầu tiên tớ hỏi” giúp phân biệt rạch ròi giữa vài ví dụ ban đầu với ý kiến chung của cả tập thể 35 bạn, đồng thời mở ra bước khảo sát đầy đủ hơn.",
    },
  ],
};
