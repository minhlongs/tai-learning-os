/**
 * Tư duy phản biện · Tổng kết cuộc thảo luận có cấu trúc (skill: deb-structured-conclusion, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const structuredConclusion: LessonDefinition = {
  id: "deb-structured-conclusion",
  subjectId: "debate",
  skillId: "deb-structured-conclusion",
  titleVi: "Tổng kết cuộc thảo luận: điểm chung, điểm khác và bước tìm hiểu tiếp",
  titleEn: "Structuring a Discussion Conclusion: Consensus, Differences, and Next Questions",
  objectiveVi:
    "Em biết khép lại một cuộc thảo luận rõ ràng bằng ba phần: điều cả nhóm đã đồng thuận, điểm còn góc nhìn khác nhau và câu hỏi thực tế cần tìm hiểu tiếp.",
  objectiveEn:
    "Summarize a group discussion clearly by stating shared agreements, remaining differences, and the next open question to investigate.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-structured-conclusion",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tập tóm tắt một cuộc trao đổi theo 3 ý: 'Chúng mình đã thống nhất...', 'Điểm còn cân nhắc là...', 'Việc cần hỏi thêm là...'.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau 15 phút thảo luận sôi nổi của nhóm mà vẫn còn một chi tiết chưa ngã ngũ, cách tổng kết nào của trưởng nhóm hữu ích và công bằng nhất?",
        question_en:
          "After a lively 15-minute group discussion where one detail remains unsettled, which wrap-up by the group leader is fairest and most useful?",
        choices: [
          {
            id: "a",
            label_vi:
              "Trưởng nhóm là người chịu trách nhiệm chính nên chỉ ghi riêng ý kiến của mình vào biên bản cuộc họp và bỏ qua toàn bộ góp ý của các thành viên còn lại trong nhóm.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Kết luận rằng buổi họp hoàn toàn vô ích vì nhóm chưa đồng ý 100% ở mọi chi tiết nhỏ, và đề nghị cả nhóm bỏ hẳn phần đã thống nhất để lần sau bàn lại từ đầu cho chắc chắn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Nêu rõ những điểm cả nhóm đã thống nhất, ghi nhận trung thực điểm còn hai góc nhìn khác nhau và xác định thông tin cần kiểm tra thêm để quyết định ở buổi sau.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Vừa hết giờ thảo luận thì đứng dậy giải tán nhóm luôn mà không chốt lại nội dung đã bàn; ai ngồi nghe cũng tự nhớ rồi nên khỏi tốn thêm thời gian ghi chép biên bản.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nếu không ghi lại những điểm đã thống nhất, buổi họp sau cả nhóm sẽ phải bàn lại từ con số không.",
        hint2_vi:
          "Với chi tiết còn khác ý kiến vì thiếu thông tin thực tế, nhóm nên ép buộc vội vàng hay xác định câu hỏi cần tìm hiểu tiếp?",
        hint3_vi:
          "Một lời tổng kết có cấu trúc gồm 3 phần (điểm chung – điểm còn khác biệt – câu hỏi cần tìm hiểu tiếp) giúp giữ trọn thành quả buổi họp và định hướng rõ bước tiếp theo.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Tổng kết có cấu trúc giúp mọi thành viên thấy ý kiến của mình được ghi nhận công tâm, nắm rõ phần việc đã chốt và biết chính xác cần thu thập thêm dữ liệu gì cho phần còn băn khoăn.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Tổ 1 bàn kế hoạch chăm sóc bồn hoa lớp 5A: cả 6 bạn đều đồng ý tưới nước vào đầu giờ sáng và nhặt cỏ vào chiều thứ Sáu; tuy nhiên 3 bạn muốn trồng hoa mười giờ vì chịu nắng khỏe, 3 bạn muốn trồng cây hương thảo vì có mùi thơm dịu. Phần “điểm đồng thuận chung” trong lời tổng kết của tổ là gì?",
        question_en:
          "Team 1 plans care for Class 5A's planter: all 6 students agree on watering in the morning and weeding Friday afternoon; however, 3 prefer moss roses for sun tolerance while 3 prefer rosemary for scent. What is the 'shared consensus' part of the summary?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cả tổ thống nhất lịch chăm sóc gồm tưới nước vào đầu giờ sáng hằng ngày và nhặt cỏ vào buổi chiều thứ Sáu.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Cả tổ chốt trồng duy nhất cây hương thảo và bỏ hẳn hoa mười giờ theo đúng ý của nhóm ba bạn phát biểu đầu tiên trong buổi họp.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cả tổ chưa thống nhất được bất kỳ nội dung nào: hai luồng ý kiến ba – ba khiến toàn bộ kế hoạch chăm cây phải tạm gác lại chờ bàn xong.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Cả tổ thống nhất chuyển luôn bồn hoa sang nhờ tổ khác chăm sóc để khỏi mất thêm thời gian bàn cãi xem nên chọn trồng loại cây nào.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy tách riêng phần mà tất cả 6 bạn trong tổ đều đã gật đầu nhất trí với phần còn chia làm hai luồng ý kiến 3 – 3.",
        hint2_vi:
          "Loại cây trồng còn đang cân nhắc giữa hoa mười giờ và hương thảo, vậy lịch chăm sóc hàng tuần thì sao?",
        hint3_vi:
          "Lịch tưới nước buổi sáng và nhặt cỏ chiều thứ Sáu chính là nền tảng đồng thuận chung mà cả 6 bạn đã thống nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Tách bạch rõ phần đã đồng thuận (lịch tưới nước và nhặt cỏ) khỏi phần còn khác biệt (chọn giống cây) giúp tổ thấy buổi thảo luận đã tiến được một bước rất vững chắc.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Biên bản ngắn cuối buổi thảo luận Góc Khoa học xanh",
        passage_vi:
          "Cuối giờ sinh hoạt thứ Năm, bạn Mai thay mặt nhóm điều phối tóm tắt cuộc họp 15 phút của lớp 5C: “Thứ nhất, cả lớp mình đã thống nhất chọn chủ đề ‘Tái chế rác thải nhựa học đường’ cho ngày hội Khoa học tháng tới và chia thành bốn trạm trưng bày. Thứ hai, về vật liệu làm bảng giới thiệu, lớp đang có hai ý kiến: một nhóm đề xuất dùng mặt sau lịch treo tường cũ cho nhẹ, nhóm kia đề xuất dùng bìa thùng giấy cứng để dựng đứng vững hơn. Thứ ba, để sáng thứ Hai chốt được vật liệu, chúng mình cần tìm hiểu xem ở góc kho của trường hiện có sẵn bao nhiêu tờ lịch cũ khổ lớn và bảng trưng bày sẽ đặt trên bàn hay treo lên giá đỡ nhé!”",
        question_vi:
          "Trong lời tổng kết của Mai, “câu hỏi cần tìm hiểu tiếp” để giúp lớp giải quyết điểm còn khác biệt vào sáng thứ Hai là gì?",
        choices: [
          {
            id: "a",
            label_vi:
              "Bàn lại từ đầu xem cả lớp có nên đổi sang chủ đề khám phá vũ trụ thay cho chủ đề tái chế rác thải nhựa học đường đã thống nhất hay không.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Tìm hiểu xem ngày hội Khoa học tổ chức vào mùa xuân năm ngoái có bao nhiêu tiết mục văn nghệ, để lớp mình năm nay biết cần chuẩn bị bao nhiêu tiết mục cho giống năm trước.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Xem lại trong buổi sinh hoạt chiều thứ Năm bạn nào phát biểu to rõ nhất rồi chọn luôn vật liệu làm bảng giới thiệu theo đúng ý bạn đó.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Kiểm tra số lượng tờ lịch cũ khổ lớn hiện có trong kho trường và xác nhận bảng giới thiệu sẽ đặt trên bàn hay treo lên giá đỡ.",
            correct: true,
          },
        ],
        evidenceSentence_vi:
          "Thứ ba, để sáng thứ Hai chốt được vật liệu, chúng mình cần tìm hiểu xem ở góc kho của trường hiện có sẵn bao nhiêu tờ lịch cũ khổ lớn và bảng trưng bày sẽ đặt trên bàn hay treo lên giá đỡ nhé!",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Mai đã nối trực tiếp điểm còn khác biệt (chọn lịch treo tường cũ hay bìa thùng cứng) với hai thông tin thực tế cần kiểm tra (số lịch sẵn có và cách trưng bày treo hay đặt bàn), giúp buổi họp tiếp theo giải quyết vấn đề nhanh gọn.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình Minh bàn kế hoạch đọc sách chung tối cuối tuần: bố mẹ và hai anh em đều đồng ý dành 30 phút tối thứ Bảy tắt tivi để cùng đọc sách; Minh muốn mỗi người đọc cuốn sách riêng mình thích rồi kể tóm tắt cho nhau nghe, còn em gái muốn cả nhà cùng đọc chung một cuốn truyện dài theo từng chương. Lời tổng kết nào đầy đủ cả 3 phần chuẩn mực?",
        question_en:
          "Minh's family discusses weekend reading: everyone agrees on 30 screen-free minutes Saturday night; Minh wants individual books with short sharing, while his sister wants reading one chapter book together. Which summary covers all 3 structured parts?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Vì cả nhà chưa thống nhất được đọc sách riêng hay đọc sách chung nên tối thứ Bảy tuần này mình cứ bật tivi xem chương trình giải trí như cũ đi ạ, bao giờ hai anh em có cùng sở thích rồi hãy bắt đầu đọc sách cũng chưa muộn.”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Nhà mình đã thống nhất dành 30 phút tối thứ Bảy tắt tivi đọc sách; còn hai ý là đọc riêng rồi kể lại hay đọc chung theo chương, mình xem trên giá có truyện hợp cả hai anh em không hoặc luân phiên mỗi tuần nhé ạ!”",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "“Con là anh lớn nên tự biết cuốn sách nào hợp nhất; tối thứ Bảy cả nhà cứ đọc sách riêng theo đúng cách của con, không cần bàn thêm ý của em gái nữa ạ.”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Tối thứ Bảy tuần trước cả nhà mình đã ăn món bún thang rất ngon, nên tối nay mình cứ ăn lại món đó rồi tính tiếp chuyện đọc sách sau cũng được ạ.”",
            correct: false,
          },
        ],
        hint1_vi:
          "Kiểm tra xem câu tổng kết đã có đủ: (1) Điểm đồng thuận 30 phút tối thứ Bảy, (2) Hai cách đọc của hai anh em, và (3) Hướng tìm hiểu/thử nghiệm tiếp theo chưa.",
        hint2_vi:
          "Bỏ cuộc quay lại xem tivi hay áp đặt một phía đều đánh mất sự đồng thuận quý giá ban đầu.",
        hint3_vi:
          "Ghi nhận khung giờ chung 30 phút, nêu công tâm hai cách đọc và gợi ý kiểm tra tủ sách hoặc thử nghiệm luân phiên chính là lời tổng kết trọn vẹn 3 phần.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Lời tổng kết giữ vững cam kết chung (30 phút tắt tivi đọc sách tối thứ Bảy), tóm tắt công bằng mong muốn của cả hai anh em và mở ra bước kiểm tra sách thực tế rất ấm áp, hợp tác.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cuối buổi thảo luận về quy định mượn sách về nhà của thư viện lớp 5B, cả lớp đồng ý cho mượn sách về nhà vào cuối tuần và giữ sách bọc bìa cẩn thận; còn băn khoăn nên cho mượn tối đa 1 cuốn hay 2 cuốn mỗi tuần vì chưa rõ tổng số sách hiện có trên kệ có đủ chia cho 35 bạn không. Nếu được giao viết câu kết vào sổ sinh hoạt lớp, em sẽ viết câu hỏi tìm hiểu tiếp theo như thế nào?",
        question_en:
          "Wrapping up Class 5B's weekend book-lending rules, everyone agrees on weekend lending with protective covers, while debating a 1-book vs. 2-book limit because total shelf inventory for 35 students is unknown. What 'next question to investigate' should be recorded?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Cần hỏi lại xem bạn nào đã nêu ý kiến mượn 2 cuốn sách mỗi tuần để đề nghị bạn rút lại đề xuất đó, giúp cả lớp chốt nhanh phương án 1 cuốn.”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Không cần mất công kiểm đếm sách trên kệ nữa; đầu tuần tới lớp trưởng cứ rút thăm ngẫu nhiên giữa mức 1 cuốn và 2 cuốn để quyết định luôn.”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Cần tra cứu xem thư viện lớn của thành phố được xây dựng từ năm nào và mở cửa đón học sinh tiểu học vào những khung giờ nào trong tuần.”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Tổ thư viện sẽ kiểm đếm chính xác tổng số đầu sách hiện có trên kệ để xem nếu mỗi bạn mượn 2 cuốn thì có đủ sách cho cả 35 bạn trong lớp hay không, rồi báo lại vào giờ sinh hoạt tuần tới.”",
            correct: true,
          },
        ],
        hint1_vi:
          "Nguyên nhân khiến lớp chưa chốt được mức 1 cuốn hay 2 cuốn chính là chưa biết tổng số sách hiện có trên kệ.",
        hint2_vi:
          "Câu hỏi tìm hiểu tiếp theo cần nhắm thẳng vào con số thực tế nào để giải tỏa băn khoăn đó?",
        hint3_vi:
          "Kiểm đếm tổng số sách hiện có so với nhu cầu của 35 bạn sẽ cung cấp căn cứ rõ ràng để cả lớp dễ dàng thống nhất hạn mức mượn sách.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Một câu hỏi tìm hiểu tiếp theo tốt luôn cụ thể, kiểm chứng được và giải quyết đúng nguyên nhân gây phân vân của tập thể (kiểm đếm tổng số sách trên kệ so với 35 học sinh).",
    },
  ],
};
