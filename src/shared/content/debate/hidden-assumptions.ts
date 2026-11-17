/**
 * Tư duy phản biện · Nhận diện giả định ngầm trong lập luận (skill: deb-hidden-assumptions, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const hiddenAssumptions: LessonDefinition = {
  id: "deb-hidden-assumptions",
  subjectId: "debate",
  skillId: "deb-hidden-assumptions",
  titleVi: "Nhận diện giả định ngầm giữa lý do và kết luận",
  titleEn: "Identifying Hidden Assumptions Between Reason and Claim",
  objectiveVi:
    "Em nhận ra điều được mặc nhiên coi là đúng (giả định ngầm) nối giữa lý do và kết luận, từ đó kiểm tra xem lập luận đã thực sự vững chắc hay chưa.",
  objectiveEn:
    "Identify the unstated assumption linking a reason to a claim and evaluate whether that assumption holds true.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-hidden-assumptions",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tập đặt câu hỏi 'Người nói đang mặc nhiên coi điều gì là đúng dù chưa nói ra?' khi đọc một lập luận ngắn.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong một lập luận, “giả định ngầm” được hiểu là gì?",
        question_en:
          "In an argument, what is a 'hidden assumption'?",
        choices: [
          {
            id: "a",
            label_vi:
              "Lời chào mở đầu lịch sự mà người điều phối nói ra trước khi cả nhóm bước vào phần thảo luận chính.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Một ý không được nói ra thành lời nhưng người nói mặc nhiên coi là đúng để nối lý do với kết luận.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Một con số thống kê cụ thể đã được bạn thư ký viết thật rõ ràng bằng phấn trắng lên góc bảng lớp.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Câu nhắc lại nguyên văn lời phát biểu của bạn ngồi cạnh để kiểm tra xem cả tổ nghe có rõ hay chưa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy hình dung một chiếc cầu vô hình nối từ “lý do” sang “kết luận” mà người nói không nhắc trực tiếp.",
        hint2_vi:
          "Vì sao gọi là “ngầm”? Vì nó chưa được phát biểu thành câu chữ rõ ràng nhưng nếu thiếu nó thì lý do chưa dẫn tới kết luận được.",
        hint3_vi:
          "Giả định ngầm là niềm tin chưa nói ra mà người lập luận dựa vào để kết luận của mình có vẻ hợp lý.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Giả định ngầm là mắt xích ẩn nằm giữa lý do và kết luận. Khi phát hiện ra mắt xích ẩn này, chúng ta có thể kiểm tra xem nó có đúng với thực tế hay không trước khi đồng tình.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Khoa nói: “Cuốn sách lịch sử này dày tới 300 trang, nên chắc chắn đọc nó sẽ rất bổ ích cho bài thuyết trình của tổ mình!” Khoa đang dựa vào giả định ngầm nào?",
        question_en:
          "Khoa says: 'This history book is 300 pages thick, so reading it will definitely be useful for our team's presentation!' What hidden assumption is Khoa relying on?",
        choices: [
          {
            id: "a",
            label_vi:
              "Sách càng dày nhiều trang thì nội dung càng chất lượng và chắc chắn phù hợp với đúng chủ đề thuyết trình của tổ.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Phòng đọc thư viện của trường luôn mở cửa đón học sinh vào tất cả các buổi chiều từ thứ Hai đến hết ngày thứ Sáu.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mọi thành viên trong tổ đều thích tự tay vẽ lược đồ lịch sử trên giấy khổ lớn bằng hộp bút chì màu của nhóm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Những cuốn sách mỏng dưới 50 trang ở góc thư viện lớp lúc nào cũng được nhà xuất bản in trên giấy ngả màu vàng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Lý do của Khoa là “sách dày 300 trang”, còn kết luận là “rất bổ ích cho bài thuyết trình của tổ”.",
        hint2_vi:
          "Muốn từ “dày 300 trang” nhảy thẳng sang “bổ ích cho bài thuyết trình”, Khoa phải tin điều gì về độ dày cuốn sách và chủ đề bên trong?",
        hint3_vi:
          "Khoa đang mặc định rằng cứ sách dày là nội dung hay và trùng khớp với giai đoạn lịch sử mà tổ đang tìm hiểu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Giữa “dày 300 trang” và “bổ ích cho bài thuyết trình” có khoảng trống: một cuốn sách dày vẫn có thể viết về thời kỳ khác với đề tài của tổ hoặc viết quá khó hiểu với học sinh lớp 5.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Minh đề xuất: “Tổ mình gửi thông báo phân công trực nhật vào nhóm tin nhắn lúc 8 giờ tối nay nhé, như vậy sáng mai cả 8 bạn chắc chắn đều biết việc của mình!” Giả định ngầm nào của Minh dễ không đúng trong thực tế gia đình học sinh lớp 5?",
        question_en:
          "Minh suggests: 'Let's send duty assignments to the message group at 8 PM tonight, so tomorrow morning all 8 teammates will surely know their tasks!' Which hidden assumption might fail in reality for 5th graders?",
        choices: [
          {
            id: "a",
            label_vi:
              "Một tuần lễ học tập chính khóa ở trường tiểu học luôn bắt đầu bằng tiết chào cờ đầu tuần vào sáng sớm ngày thứ Hai.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Danh sách tổ của Minh do cô giáo chủ nhiệm xếp từ đầu học kỳ hiện có tất cả 8 thành viên cùng tham gia trực nhật.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Những phần việc trực nhật quen thuộc mỗi buổi sáng của tổ gồm quét sàn lớp, lau sạch bảng đen và tưới chậu cây.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Tất cả 8 bạn (hoặc bố mẹ các bạn) đều mở điện thoại đọc tin nhắn sau 8 giờ tối trước khi đi học vào sáng hôm sau.",
            correct: true,
          },
        ],
        hint1_vi:
          "Học sinh lớp 5 có phải bạn nào cũng có điện thoại riêng hoặc được xem tin nhắn muộn vào buổi tối không?",
        hint2_vi:
          "Điều gì cần xảy ra từ 8 giờ tối nay đến 7 giờ sáng mai thì tin nhắn mới đến được với cả 8 bạn?",
        hint3_vi:
          "Minh đang mặc nhiên cho rằng gia đình mọi bạn đều đọc tin nhắn tối muộn, trong khi nhiều nhà tắt thiết bị sớm hoặc bố mẹ đi làm ca tối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Nhiều học sinh tiểu học không dùng điện thoại riêng vào buổi tối. Nhận ra giả định ngầm này giúp tổ Minh thống nhất phân công trực tiếp ngay tại lớp trước khi ra về thay vì đợi nhắn tin muộn.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi bàn về góc đọc sách, bạn Lan nói: “Hôm qua không thấy ai mượn cuốn ‘Bí mật đại dương’, chứng tỏ cả lớp mình chẳng ai thích tìm hiểu về sinh vật biển cả!” Cách phản hồi nào chỉ ra đúng giả định ngầm chưa chắc chắn của Lan?",
        question_en:
          "Lan says: 'Yesterday nobody borrowed Secrets of the Ocean, proving nobody in our class likes marine life!' Which response accurately points out Lan's questionable hidden assumption?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Theo sách Khoa học tự nhiên thì các đại dương mênh mông đang bao phủ hơn bảy phần mười diện tích bề mặt Trái Đất của chúng ta đấy.”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Trang bìa ngoài của cuốn sách ‘Bí mật đại dương’ được họa sĩ vẽ minh họa hình một chú cá heo màu xanh đang phóng lên khỏi mặt sóng.”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Lan đang giả định hễ thích sinh vật biển thì hôm qua các bạn đều đã thấy cuốn sách đó; thực ra sách bị kẹt khuất ở ngăn dưới cùng nên chưa ai biết.”",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "“Nếu hôm qua chưa có bạn nào kịp ghi tên mượn đọc thì mình nghĩ lớp nên dọn luôn chiếc kệ gỗ đi để lấy chỗ trống kê thêm bàn học.”",
            correct: false,
          },
        ],
        hint1_vi:
          "Ngoài lý do “không thích sinh vật biển”, còn những lý do thực tế nào khiến hôm qua chưa ai mượn cuốn sách đó?",
        hint2_vi:
          "Các bạn có biết cuốn sách đó mới được đặt ở đâu trên kệ hay hôm qua lớp có giờ ra chơi dài để mượn sách không?",
        hint3_vi:
          "Lan đã mặc nhiên coi “chưa mượn trong một ngày” đồng nghĩa với “không thích chủ đề đó”, bỏ qua khả năng cuốn sách bị khuất tầm mắt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Việc một cuốn sách chưa được mượn trong một ngày có thể do vị trí đặt khuất hoặc các bạn chưa biết sách mới về, chứ chưa đủ để kết luận cả lớp không quan tâm tới sinh vật biển.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm dự án tiết kiệm điện viết trong bản kế hoạch: “Nếu dán một tờ khẩu hiệu nhỏ ở cuối lớp, chắc chắn lớp mình sẽ không còn quên tắt quạt khi ra sân thể dục nữa.” Câu hỏi kiểm tra giả định ngầm nào giúp nhóm hoàn thiện kế hoạch thực tế hơn?",
        question_en:
          "The energy-saving team writes: 'If we put a small poster at the back of the classroom, our class will never forget to turn off the fans before PE.' Which question tests the hidden assumption to improve the plan?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Nếu chúng mình cắt tờ giấy vẽ khẩu hiệu theo hình chữ nhật nằm ngang thay vì hình vuông thì hộp màu sáp của tổ có đỡ hao hơn nhiều không nhỉ?”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Lúc xếp hàng vội ra cửa trước, các bạn có kịp nhìn về cuối lớp không, hay mình nên dán nhắc ngay cạnh công tắc cửa ra vào và cử bạn khóa cửa kiểm tra?”",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "“Trong phòng học tầng hai của lớp 5A hiện nay có tất cả bao nhiêu ô cửa sổ lắp kính trong suốt nhìn thẳng ra hàng phượng vĩ ngoài sân trường?”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Các bạn có nhớ nhà kỹ thuật nào trong lịch sử thế giới là người đầu tiên chế tạo thành công chiếc quạt trần chạy bằng động cơ điện không?”",
            correct: false,
          },
        ],
        hint1_vi:
          "Nhóm đang mặc định rằng cứ có khẩu hiệu ở cuối lớp là lúc ra cửa trước ai cũng nhìn thấy và tự giác bật tắt công tắc.",
        hint2_vi:
          "Hãy hình dung hướng di chuyển của học sinh khi trống báo ra sân: các bạn nhìn về phía cửa ra vào hay quay ngược lại cuối lớp?",
        hint3_vi:
          "Đặt câu hỏi kiểm tra xem vị trí dán có nằm trong tầm mắt cạnh công tắc không và ai chịu trách nhiệm chính sẽ giúp kế hoạch hiệu quả thật sự.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bản kế hoạch ban đầu giả định rằng tờ giấy ở cuối lớp tự động làm thay đổi thói quen lúc vội vã ở cửa trước. Phát hiện giả định ngầm đó giúp nhóm chuyển biển nhắc lại gần công tắc và phân công người phụ trách rõ ràng.",
    },
  ],
};
