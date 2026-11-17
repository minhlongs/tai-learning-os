/**
 * Tư duy phản biện · Nguyên nhân thật sự và sự trùng hợp (skill: deb-cause-vs-coincidence, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const causeVsCoincidence: LessonDefinition = {
  id: "deb-cause-vs-coincidence",
  subjectId: "debate",
  skillId: "deb-cause-vs-coincidence",
  titleVi: "Phân biệt nguyên nhân thật sự và sự trùng hợp",
  titleEn: "True Cause vs. Coincidence",
  objectiveVi:
    "Em hiểu rằng hai việc xảy ra kế tiếp nhau chưa chắc việc trước đã gây ra việc sau, và biết tìm cơ chế giải thích hợp lý trước khi kết luận nguyên nhân.",
  objectiveEn:
    "Understand that one event following another does not prove causation, and look for a real mechanism before claiming a cause.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-cause-vs-coincidence",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tự hỏi 'Có lý do thực tế nào nối việc trước với việc sau không, hay chỉ tình cờ xảy ra cùng lúc?' khi gặp các sự việc bất ngờ.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sáng nay bạn An mang chiếc bút chì màu xanh lá mới mua đi học, và trong tiết Toán An làm đúng hết bài tập. Nếu An kết luận “Nhờ chiếc bút màu xanh lá mà tớ giỏi Toán hẳn lên!”, An đang nhầm lẫn điều gì?",
        question_en:
          "An brings a new green pencil to school and gets every Math problem right. If An concludes 'Thanks to the green pencil, I became great at Math!', what is An confusing?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nhầm sự trùng hợp ngẫu nhiên (mang bút mới cùng hôm làm bài tốt) với nguyên nhân thật sự (ôn kỹ và tính cẩn thận).",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Nhầm lẫn giữa môn Toán và môn Mỹ thuật trong thời khóa biểu của lớp ở học kỳ này.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Nhầm màu xanh lá của vỏ bút chì với màu xanh dương của bìa quyển vở ghi bài tập.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Không có gì nhầm lẫn cả: màu sơn bên ngoài vỏ bút chì luôn quyết định kết quả tính toán trong bài Toán.",
            correct: false,
          },
        ],
        hint1_vi:
          "Màu sơn bên ngoài chiếc bút chì có giúp em thuộc bảng nhân chia hay đọc kỹ đề bài hơn không?",
        hint2_vi:
          "Điều gì mới thật sự giúp một học sinh làm đúng hết các bài tập Toán trong lớp?",
        hint3_vi:
          "Việc mang bút mới chỉ tình cờ diễn ra cùng buổi sáng, còn nguyên nhân thật sự giúp làm bài đúng là kiến thức và sự cẩn thận của An.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hai sự việc xảy ra nối tiếp nhau (mang bút mới rồi làm bài đúng) không có nghĩa việc trước gây ra việc sau. Nguyên nhân thật sự giúp An làm tốt bài Toán là nhờ An đã hiểu bài và tính toán cẩn thận.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vừa lúc bạn Khoa bước ra hành lang vỗ tay một tiếng thì đèn hành lang bật sáng. Trước khi tin rằng “tiếng vỗ tay của Khoa làm đèn sáng”, cách kiểm tra nào khoa học nhất?",
        question_en:
          "Right as Khoa steps into the hallway and claps once, the hallway light turns on. Before believing 'Khoa's clap turned on the light', what is the most scientific check?",
        choices: [
          {
            id: "a",
            label_vi:
              "Kể ngay cho cả trường nghe rằng Khoa có phép thuật đặc biệt điều khiển được bóng đèn hành lang bằng tiếng vỗ tay.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Quyết định từ đó không bước ra hành lang nữa để tránh vô tình làm hỏng bóng đèn chung của nhà trường mỗi giờ ra chơi.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Nhắm mắt đoán mò rồi ghi ngay vào sổ tay là Khoa có phép thuật mà không cần quan sát công tắc hay thử lại.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Xem lúc đó bác bảo vệ có vừa bật công tắc tổng không, rồi thử vỗ tay lại vài lần khi không ai chạm công tắc.",
            correct: true,
          },
        ],
        hint1_vi:
          "Có khả năng một người khác vừa bật công tắc điện đúng vào giây phút Khoa vỗ tay không?",
        hint2_vi:
          "Nếu tiếng vỗ tay thật sự là nguyên nhân (như đèn cảm ứng âm thanh), khi thử lại trong điều kiện tương tự kết quả sẽ ra sao?",
        hint3_vi:
          "Kiểm tra công tắc điện và thử lặp lại giúp phân biệt rõ đâu là sự trùng hợp tình cờ, đâu là nguyên nhân thật.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Muốn biết tiếng vỗ tay là nguyên nhân thật (đèn cảm ứng) hay chỉ tình cờ trùng lúc bác bảo vệ bật công tắc, ta cần quan sát các yếu tố xung quanh và kiểm chứng lại một cách khách quan.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong 4 nhận định dưới đây của nhóm chăm sóc góc cây xanh lớp 4, nhận định nào nêu đúng mối quan hệ nguyên nhân – kết quả có cơ sở thực tế?",
        question_en:
          "Among the 4 statements from the Grade 4 plant-care team, which one states a genuine, well-founded cause-and-effect relationship?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cây trầu bà bỗng mọc thêm hai lá mới chỉ vì sáng qua các bạn trong lớp vừa thay chiếc khăn trải bàn của giáo viên.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đất trong chậu cây giữ được độ ẩm vừa phải và cây đặt gần cửa sổ đủ ánh sáng nhẹ nên lá cây xanh tươi hơn tuần trước.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Chậu cây bị khô dần do sáng nay bạn tổ trưởng tết tóc hai bím và đeo thêm chiếc nơ màu hồng rực rỡ khi bước vào lớp học.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Những bông hoa mười giờ nở rộ vào buổi trưa chỉ vì tiết trước cả lớp vừa học xong bài phân số bằng nhau.",
            correct: false,
          },
        ],
        hint1_vi:
          "Cây xanh cần những yếu tố tự nhiên nào để quang hợp và phát triển lá mới?",
        hint2_vi:
          "Khăn trải bàn, kiểu tóc hay tiết học Toán có cung cấp nước và ánh sáng cho rễ và lá cây không?",
        hint3_vi:
          "Chỉ có độ ẩm của đất và ánh sáng phù hợp mới tác động trực tiếp đến sự phát triển xanh tươi của cây trồng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Nước và ánh sáng là những yếu tố sinh học tác động trực tiếp giúp cây quang hợp và xanh tốt. Các sự việc như đổi khăn trải bàn, tết tóc hay học phân số chỉ diễn ra cùng thời điểm chứ không hề tác động lên cây.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chiều Chủ nhật, Minh vừa dán một hình dán ngôi sao lên bình nước cá nhân thì ngoài trời đổ cơn mưa rào mát mẻ. Em gái Minh reo lên: “Hình dán ngôi sao gọi mưa về đấy anh ơi!” Minh nên giải thích thế nào cho em hiểu?",
        question_en:
          "On Sunday afternoon, right after Minh puts a star sticker on his water bottle, a cool rain shower starts outside. His little sister cheers: 'The star sticker called the rain!' How should Minh explain it?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vội vàng gỡ ngay hình dán ra khỏi bình nước rồi đem cất kín vào trong tủ để cơn mưa ngoài trời sớm tạnh và không kéo dài sang thứ Hai tuần sau.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Dán thêm mười ngôi sao giấy nữa lên cửa sổ để tạo thành một cơn bão lớn thổi tung sân trường trong chiều nay.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Giải thích nhẹ nhàng rằng mưa do mây tích đầy hơi nước trên bầu trời từ trước, còn lúc anh dán hình chỉ tình cờ trùng đúng lúc mưa rơi thôi.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Khẳng định với em gái rằng mọi hình dán bằng giấy đều có thể điều khiển được thời tiết nếu dán đúng chỗ trên cửa sổ hoặc nắp bình nước.",
            correct: false,
          },
        ],
        hint1_vi:
          "Mưa rào hình thành từ đâu trong tự nhiên: từ mây hơi nước trên bầu trời hay từ miếng giấy nhỏ trong phòng?",
        hint2_vi:
          "Vì sao em gái lại tưởng miếng dán gọi mưa? Có phải vì hai việc xảy ra sát giờ nhau không?",
        hint3_vi:
          "Chỉ rõ nguyên nhân tự nhiên của mưa (hơi nước ngưng tụ thành mây mưa) và giải thích sự trùng hợp về thời gian sẽ giúp em gái hiểu đúng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cơn mưa hình thành do hơi nước ngưng tụ trên mây từ trước đó, hoàn toàn độc lập với việc dán hình lên bình nước. Giải thích cả nguyên nhân thật lẫn sự trùng hợp thời gian giúp người nghe hiểu thấu đáo.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Tháng này số lượt mượn sách ở góc thư viện lớp tăng gấp đôi. Cùng tháng đó, lớp vừa (1) sơn lại thùng rác góc lớp và (2) bổ sung 25 cuốn truyện tranh khoa học mới kèm giờ đọc sách 15 phút đầu buổi. Khi báo cáo trong giờ sinh hoạt, kết luận nào hợp lý nhất?",
        question_en:
          "This month class library checkouts doubled. The same month, the class (1) repainted the corner trash bin and (2) added 25 new science comics plus a 15-minute morning reading slot. Which report conclusion is most reasonable?",
        choices: [
          {
            id: "a",
            label_vi:
              "Sách mới hấp dẫn và giờ đọc cố định là nguyên nhân chính tăng lượt mượn; việc sơn thùng rác chỉ trùng lúc đó.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Chắc chắn màu sơn mới của chiếc thùng rác ở góc lớp đã làm các bạn thích thú hơn hẳn và chăm đọc sách nhanh gấp đôi tháng trước.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mọi việc xảy ra trong cùng một tháng đều là nguyên nhân ngang nhau và cùng góp phần tạo ra mọi kết quả của lớp.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nên bỏ hẳn giờ đọc sách cố định đi vì chỉ cần sơn lại thùng rác với màu mới là góc thư viện đã đông vui rồi.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trong hai thay đổi của tháng này, thay đổi nào liên quan trực tiếp đến nhu cầu đọc và thời gian đọc sách của học sinh?",
        hint2_vi:
          "Việc sơn lại thùng rác giữ vệ sinh lớp học, nhưng có tạo ra sách hay thời gian đọc sách cho các bạn không?",
        hint3_vi:
          "Phân biệt được yếu tố tác động trực tiếp (sách mới + giờ đọc sách) với việc xảy ra cùng tháng (sơn thùng rác) giúp lớp rút ra bài học đúng để duy trì phong trào đọc sách.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi nhiều việc cùng diễn ra trong một tháng, người có tư duy phản biện xét xem việc nào thực sự tạo ra động lực và điều kiện mượn sách (sách mới và giờ đọc cố định), tránh gán ghép nhầm cho việc trùng thời điểm.",
    },
  ],
};
