/**
 * Tiếng Việt · Tóm tắt văn bản thông tin nhiều đoạn (skill: vie-info-text-summary, lớp 5)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const infoTextSummary: LessonDefinition = {
  id: "vie-info-text-summary",
  subjectId: "vietnamese",
  skillId: "vie-info-text-summary",
  titleVi: "Tóm tắt văn bản thông tin nhiều đoạn",
  titleEn: "Summarizing Multi-Paragraph Informational Texts",
  objectiveVi:
    "Em sẽ biết rút ra thông tin cốt lõi của từng đoạn, lược bỏ số liệu và ví dụ phụ để tóm tắt ngắn gọn văn bản thông tin.",
  objectiveEn:
    "Extract core ideas from each paragraph and filter out minor figures and examples to summarize informational texts concisely.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-info-text-summary",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đọc một mục khoa học ngắn hai đoạn và viết lại mỗi đoạn thành một câu tóm tắt.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nguyên tắc quan trọng nhất khi tóm tắt một văn bản thông tin nhiều đoạn là gì?",
        question_en:
          "What is the most important principle when summarizing a multi-paragraph informational text?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chép lại nguyên văn đoạn mở đầu của văn bản rồi bỏ trống toàn bộ các đoạn còn lại, vì theo em đoạn mở đầu bao giờ cũng chứa đủ thông tin cốt lõi.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chỉ ghi lại các con số thống kê lẻ mà không cần nêu chủ đề của bài đọc.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Thêm thật nhiều cảm xúc tưởng tượng riêng của em vào bản tóm tắt làm thay đổi hoàn toàn nội dung thông tin gốc của văn bản.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Xác định ý chính của từng đoạn, giữ lại thông tin cốt lõi rồi diễn đạt ngắn gọn, trung thực theo lời văn của mình.",
            correct: true,
          },
        ],
        hint1_vi:
          "Bản tóm tắt giúp người đọc nắm nhanh nội dung toàn bài mà không bỏ sót mạch thông tin chính.",
        hint2_vi:
          "Nếu chỉ chép các con số lẻ hoặc chỉ lấy đoạn đầu, người đọc sẽ không hiểu toàn bộ văn bản trình bày những khía cạnh nào.",
        hint3_vi:
          "Tách thông tin chính của mỗi đoạn khỏi ví dụ minh họa và viết lại gọn gàng, đúng sự thật là cách tóm tắt chuẩn xác.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Khi tóm tắt văn bản thông tin nhiều đoạn, ta cần tìm thông tin cốt lõi của từng đoạn, lược bỏ các số liệu chi tiết hay ví dụ minh họa phụ, rồi kết nối lại ngắn gọn và trung thực với văn bản gốc.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi đọc câu: “Chuồn chuồn ngô là loài côn trùng săn mồi có ích cho nhà nông vì chúng bắt muỗi và rầy nâu trên đồng ruộng, chẳng hạn một cá thể trưởng thành có thể đớp vài chục con muỗi nhỏ trong một buổi chiều.”, phần nào là ví dụ và số liệu phụ có thể lược bỏ khi tóm tắt?",
        question_en:
          "Which part of the sentence is a supporting example or figure that can be omitted in a summary?",
        choices: [
          {
            id: "a",
            label_vi: "Chuồn chuồn ngô là loài côn trùng săn mồi có ích cho nhà nông nên rất cần được bảo vệ trong mùa lúa.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "chẳng hạn một cá thể trưởng thành có thể đớp vài chục con muỗi nhỏ trong một buổi chiều",
            correct: true,
          },
          {
            id: "c",
            label_vi: "chúng bắt muỗi và rầy nâu trên đồng ruộng",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chuồn chuồn ngô là loài côn trùng có ích vì chăm chỉ bắt sâu bọ hại mùa màng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy chú ý từ nối báo hiệu phần dẫn chứng minh họa cụ thể trong câu.",
        hint2_vi:
          "Thông tin chính của câu khẳng định lợi ích diệt côn trùng gây hại của chuồn chuồn ngô đối với nhà nông.",
        hint3_vi:
          "Cụm mở đầu bằng “chẳng hạn…” nêu số lượng muỗi trong một buổi chiều chỉ làm rõ thêm cho ý chính nên có thể lược bớt khi tóm tắt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Cụm “chẳng hạn một cá thể trưởng thành có thể đớp vài chục con muỗi nhỏ trong một buổi chiều” là ví dụ kèm số liệu minh họa cụ thể; khi tóm tắt, ta chỉ cần giữ thông tin cốt lõi là chuồn chuồn ngô có ích vì giúp nhà nông bắt muỗi và rầy nâu.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Lá chắn xanh của vùng cửa biển",
        passage_vi:
          "Rừng ngập mặn ven biển Việt Nam đóng vai trò như bức tường xanh che chắn sóng gió và nuôi dưỡng nguồn lợi thủy sản phong phú. Bộ rễ chằng chịt của cây đước, cây bần và cây mắm bám sâu vào bùn nhão, làm giảm sức tàn phá của sóng lớn mỗi mùa bão tới. Chẳng hạn, một dải cây bần rộng khoảng một trăm mét có thể cắt giảm đáng kể chiều cao ngọn sóng trước khi nước tràn vào chân đê đất. Dưới tán rừng ẩm mát ấy còn là nơi trú ngụ và sinh sản an toàn của tôm, cua, cá bống cùng nhiều loài chim nước.",
        question_vi:
          "Bản tóm tắt nào dưới đây bao quát đầy đủ thông tin cốt lõi của đoạn văn mà không sa vào số liệu phụ?",
        choices: [
          {
            id: "a",
            label_vi:
              "Một dải cây bần rộng khoảng một trăm mét ở ven biển có bộ rễ bám sâu vào lớp bùn nhão nên có thể cắt giảm đáng kể chiều cao ngọn sóng trước khi nước tràn vào chân đê.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Dưới tán rừng ngập mặn chỉ có duy nhất loài cá bống và chim nước sinh sống quanh năm mà không có thêm tôm, cua hay loài nào khác.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Rừng ngập mặn ven biển Việt Nam vừa giúp cản sóng bảo vệ đê điều mùa bão, vừa là môi trường sống giàu nguồn lợi thủy sản.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Đê đất ven biển Việt Nam rất dễ sạt lở nếu không trồng đúng cây mắm và cây đước.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Rừng ngập mặn ven biển Việt Nam đóng vai trò như bức tường xanh che chắn sóng gió và nuôi dưỡng nguồn lợi thủy sản phong phú.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Đoạn văn trình bày hai vai trò chính của rừng ngập mặn: che chắn sóng bão bảo vệ đê điều và làm nơi cư trú giàu nguồn lợi thủy sản. Chi tiết “một trăm mét” hay tên từng loài cá lẻ là dẫn chứng phụ nên được lược gọn khi tóm tắt.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Hành trình làm nên món đồ gốm thủ công",
        passage_vi:
          "Để làm ra một sản phẩm gốm truyền thống bền đẹp, người thợ làng nghề phải thực hiện tuần tự khâu chọn lọc đất sét, tạo hình, tráng men và canh lửa nung gốm. Ban đầu, đất sét trắng đào về được ngâm nước qua nhiều bể lắng để loại sạch sỏi cát và tạp chất. Tiếp đó, người thợ đặt khối đất dẻo lên bàn xoay, khéo léo vuốt nặn thành dáng ấm chén hay bình hoa rồi phơi cho se mặt. Sau khi phủ lớp men mịn và vẽ hoa văn như cành trúc hoặc đàn cá chép, gốm mộc được xếp vào lò nung ở nhiệt độ hơn một nghìn độ C cho đến khi lớp men bóng sáng.",
        question_vi:
          "Tóm tắt nào phản ánh đúng và gọn nhất quy trình chính được nêu trong đoạn văn trên?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nghề gốm truyền thống trải qua quy trình chặt chẽ gồm lọc sạch đất sét, tạo dáng trên bàn xoay, phủ men trang trí và nung lò ở nhiệt độ cao để ra thành phẩm bền đẹp.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Người thợ gốm thường thích vẽ hình cành trúc và đàn cá chép lên ấm chén trước khi xếp tất cả vào lò nung ở mức hơn một nghìn độ C cho đến khi lớp men bóng sáng đẹp lung linh.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đất sét trắng đào về có lẫn nhiều sỏi cát nên phải ngâm qua nhiều bể nước khác nhau mới dùng được.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ cần đặt khối đất lên bàn xoay vuốt thành bình hoa rồi đem phơi nắng là hoàn thành món đồ gốm truyền thống.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Để làm ra một sản phẩm gốm truyền thống bền đẹp, người thợ làng nghề phải thực hiện tuần tự khâu chọn lọc đất sét, tạo hình, tráng men và canh lửa nung gốm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bản tóm tắt đúng giữ trọn bốn công đoạn nối tiếp nhau (lọc đất, tạo dáng, tráng men vẽ hoa văn, nung lò) và lược bỏ hợp lí các ví dụ phụ như hình cành trúc, đàn cá chép hay con số hơn một nghìn độ C.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bài thông tin về thư viện xanh của trường gồm ba đoạn: Đoạn một giới thiệu không gian đọc sách ngoài trời dưới tán cây; Đoạn hai nêu cách học sinh tự quản lí, mượn và quyên góp sách; Đoạn ba nêu lợi ích nuôi dưỡng thói quen đọc sách mỗi ngày. Dàn ý tóm tắt ba câu nào cân đối và đầy đủ nhất?",
        question_en:
          "Which three-point summary outline best captures all three paragraphs in balance?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ viết ba câu miêu tả thật kĩ màu sơn của những chiếc tủ sách đặt dưới gốc cây bàng, rồi kể lại cảm giác mát mẻ khi ngồi đọc truyện ở đó.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nêu tên từng quyển truyện tranh có trong thư viện và danh sách các bạn trực nhật ngày thứ Hai.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Bỏ qua không gian và cách hoạt động, chỉ ghi lại lời khuyên mọi người nên đọc sách nhiều hơn mỗi ngày.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Thư viện xanh có không gian đọc thoáng mát dưới tán cây, vận hành nhờ học sinh tự quản và quyên góp sách, qua đó giúp hình thành thói quen đọc sách hằng ngày.",
            correct: true,
          },
        ],
        hint1_vi:
          "Văn bản có ba đoạn mang ba thông tin chính khác nhau nên bản tóm tắt cần kết nối đủ cả ba mảnh ghép ấy.",
        hint2_vi:
          "Màu sơn tủ sách hay danh sách học sinh trực nhật thứ Hai đều là chi tiết nhỏ của một đoạn.",
        hint3_vi:
          "Gộp đủ ba ý lớn: không gian đọc ngoài trời, cách tự quản quyên góp và lợi ích rèn thói quen đọc sách sẽ tạo nên bản tóm tắt toàn diện.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cách tóm tắt tốt nhất liên kết trọn vẹn ý chính của cả ba đoạn (không gian thư viện xanh, cơ chế học sinh tự quản – quyên góp và tác dụng bồi đắp thói quen đọc sách) trong một mạch câu ngắn gọn, sáng rõ.",
    },
  ],
};
