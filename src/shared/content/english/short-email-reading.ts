/**
 * Tiếng Anh · Đọc hiểu thư điện tử và bưu thiếp ngắn (skill: eng-short-email-reading, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives.
 */
import type { LessonDefinition } from "../types";

export const shortEmailReading: LessonDefinition = {
  id: "eng-short-email-reading",
  subjectId: "english",
  skillId: "eng-short-email-reading",
  titleVi: "Đọc hiểu bưu thiếp và thư điện tử ngắn",
  titleEn: "Reading Short Postcards and Emails",
  objectiveVi:
    "Em sẽ đọc hiểu các bưu thiếp và thư điện tử tiếng Anh ngắn (60–80 từ) để xác định người gửi, người nhận, mục đích viết thư và các thông tin chi tiết.",
  objectiveEn:
    "Read short 60–80-word English emails and postcards to identify sender, recipient, purpose, and key details.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-short-email-reading",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đọc lại một bức thư ngắn, gạch chân lời chào mở đầu, chữ ký cuối thư và các mốc thời gian chính.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong một bức thư điện tử hoặc bưu thiếp tiếng Anh ngắn mở đầu bằng “Dear Mai,” và kết thúc bằng “Best wishes, Linh”, làm thế nào để biết ai là người viết và ai là người nhận?",
        question_en:
          "In an email starting with “Dear Mai,” and ending with “Best wishes, Linh”, who is the recipient and who is the sender?",
        choices: [
          {
            id: "a",
            label_vi: "Tên sau “Dear” (Mai) là người nhận; tên ký ở cuối thư (Linh) là người gửi.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Tên đi sau “Dear” (Mai) là người gửi; tên ký ở cuối thư (Linh) là người nhận.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cả hai bạn Mai và Linh đều là người nhận bức thư này.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Tên sau “Best wishes” là địa điểm nơi bưu điện đặt trụ sở.",
            correct: false,
          },
        ],
        hint1_vi: "Hãy liên hệ với cách viết thư tiếng Việt: đầu thư ta chào người mình muốn nhắn tới, cuối thư ta ký tên của chính mình.",
        hint2_vi: "“Dear Mai,” nghĩa là “Mai thân mến,” — lời chào dành cho người đọc lá thư.",
        hint3_vi: "Cụm “Best wishes, Linh” (Thân mến, Linh) ở dòng cuối là chữ ký của người viết.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Trong thư điện tử và bưu thiếp tiếng Anh, tên đi sau lời chào “Dear / Hi” là người nhận thư, còn tên ký sau lời chúc kết thư (“Best wishes,”, “Love,”, “From,”) là người gửi.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc bức thư điện tử ngắn sau và trả lời câu hỏi:\n“Subject: School Science Fair\nHi Mai,\nHow are you? I am writing to invite you to our School Science Fair this Saturday morning. It starts at eight thirty in the school hall. My group is going to show a small solar boat model. After the fair, we can have noodles for lunch together. Please tell me if you can come!\nBest wishes,\nAn”\n— Mục đích chính An viết bức thư điện tử này cho Mai là gì?",
        question_en:
          "What is An's main purpose in writing this email to Mai?",
        choices: [
          {
            id: "a",
            label_vi: "Nhờ Mai sửa giúp chiếc thuyền chạy bằng pin mặt trời bị hỏng.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mời Mai đến dự Ngày hội Khoa học ở trường vào sáng thứ Bảy tuần này.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Xin phép thầy cô nghỉ học vào sáng thứ Bảy vì bận nấu ăn.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Kể lại chuyến tham quan bảo tàng đã diễn ra vào tháng trước.",
            correct: false,
          },
        ],
        hint1_vi: "Đọc kỹ dòng tiêu đề “Subject” và câu thứ hai ngay sau câu hỏi thăm sức khỏe.",
        hint2_vi: "Chú ý cụm động từ “I am writing to invite you to...” nêu trực tiếp lí do viết thư.",
        hint3_vi: "Động từ “invite” có nghĩa là mời tham dự sự kiện “School Science Fair” vào sáng thứ Bảy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu “I am writing to invite you to our School Science Fair this Saturday morning.” cho biết rõ mục đích chính của An là mời Mai đến dự Ngày hội Khoa học của trường.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc lại bức thư điện tử của An ở trên:\n“Hi Mai, How are you? I am writing to invite you to our School Science Fair this Saturday morning. It starts at eight thirty in the school hall. My group is going to show a small solar boat model. After the fair, we can have noodles for lunch together. Please tell me if you can come! Best wishes, An”\n— Ngày hội Khoa học bắt đầu lúc mấy giờ và diễn ra ở đâu?",
        question_en:
          "According to An's email, what time does the Science Fair start and where is it held?",
        choices: [
          {
            id: "a",
            label_vi: "Lúc 8 giờ đúng tại sân vận động thành phố",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Lúc 12 giờ trưa tại quán mì gần trường",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Lúc 8 giờ 15 phút tại phòng thí nghiệm",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Lúc 8 giờ 30 phút tại hội trường của trường học",
            correct: true,
          },
        ],
        hint1_vi: "Tìm câu bắt đầu bằng “It starts at...” để lấy cả thông tin giờ giấc lẫn địa điểm.",
        hint2_vi: "Cụm “eight thirty” cho biết số giờ và số phút bắt đầu sự kiện.",
        hint3_vi: "Cụm “in the school hall” cho biết sự kiện tổ chức trong hội trường của nhà trường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “It starts at eight thirty in the school hall.” nêu rõ thời gian là 8 giờ 30 phút (“eight thirty”) và địa điểm là hội trường của trường (“the school hall”).",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc tấm bưu thiếp ngắn sau và trả lời câu hỏi:\n“Dear Minh,\nGreetings from Hoi An! My family arrived here yesterday morning. The weather is warm and sunny every day. Yesterday afternoon, we rode bicycles around the quiet old streets and took many photos of colourful lanterns. Tomorrow, we are going to visit a traditional pottery village by boat. I bought a lovely wooden bookmark for you. See you next Monday!\nWarm regards,\nChi”\n— Hoạt động nào dưới đây gia đình bạn Chi dự định làm vào ngày mai chứ CHƯA thực hiện?",
        question_en:
          "Which activity is Chi's family going to do tomorrow rather than having done already?",
        choices: [
          {
            id: "a",
            label_vi: "Đạp xe dạo quanh những con phố cổ yên tĩnh",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chụp nhiều bức ảnh những chiếc đèn lồng rực rỡ",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đi thuyền thăm một làng gốm truyền thống",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Mua một chiếc thẻ đánh dấu trang sách bằng gỗ",
            correct: false,
          },
        ],
        hint1_vi: "Phân biệt các câu dùng thì quá khứ đơn (“arrived”, “rode”, “took”, “bought”) với câu nói về kế hoạch ngày mai.",
        hint2_vi: "Tìm câu mở đầu bằng từ chỉ thời gian “Tomorrow,” và cấu trúc “we are going to...”.",
        hint3_vi: "“Pottery village” là làng gốm và “by boat” là đi bằng thuyền.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Các việc đạp xe, chụp ảnh đèn lồng và mua thẻ đánh dấu sách đều ở thì quá khứ đơn (đã làm rồi); riêng câu “Tomorrow, we are going to visit a traditional pottery village by boat.” cho biết việc đi thuyền thăm làng gốm là kế hoạch của ngày mai.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc bức thư điện tử phản hồi ngắn mà Mai viết gửi lại An:\n“Subject: Re: School Science Fair\nHi An,\nThank you for your kind invitation! I would love to come to the Science Fair this Saturday, and I am very excited to see your solar boat. However, I have a piano lesson at eleven thirty, so I cannot stay for lunch with you. Let's meet at the school gate at eight twenty!\nYour friend,\nMai”\n— Kết luận nào dưới đây khớp chính xác với toàn bộ thông tin trong thư của Mai?",
        question_en:
          "Which statement accurately summarises Mai's reply email to An?",
        choices: [
          {
            id: "a",
            label_vi:
              "Mai từ chối đến Ngày hội Khoa học sáng thứ Bảy vì bận đi học đàn piano ngay từ lúc 8 giờ 20 phút sáng.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Mai nhận lời đến cổng trường lúc 8 giờ 20 phút để xem thuyền năng lượng mặt trời và sẽ ở lại ăn trưa cùng An sau 11 giờ 30 phút.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Mai hẹn gặp An ở cổng trường lúc 8 giờ 20 phút để dự hội, nhưng không ở lại ăn trưa được vì có giờ học đàn lúc 11 giờ 30 phút.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "An là người viết bức thư phản hồi này để hẹn Mai đi học đàn piano.",
            correct: false,
          },
        ],
        hint1_vi: "Kiểm tra hai phần trong thư của Mai: phần đồng ý trước từ “However” (Tuy nhiên) và phần lí do bận ở sau từ “However”.",
        hint2_vi: "Mai viết “I would love to come...” (đồng ý tới dự) và hẹn “at the school gate at eight twenty” (8 giờ 20 phút ở cổng trường).",
        hint3_vi: "Vì có tiết học piano lúc 11 giờ 30 phút (“at eleven thirty”) nên Mai viết “I cannot stay for lunch with you”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mai đồng ý đến dự Ngày hội Khoa học và hẹn gặp ở cổng trường lúc 8 giờ 20 phút, nhưng giải thích sau từ “However” rằng bạn có giờ học đàn lúc 11 giờ 30 phút nên không thể ở lại ăn trưa.",
    },
  ],
};
