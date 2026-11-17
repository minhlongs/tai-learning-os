/**
 * Tư duy phản biện · So sánh công bằng trên cùng tiêu chí (skill: deb-fair-comparison, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const fairComparison: LessonDefinition = {
  id: "deb-fair-comparison",
  subjectId: "debate",
  skillId: "deb-fair-comparison",
  titleVi: "So sánh công bằng trên cùng tiêu chí và điều kiện",
  titleEn: "Making Fair Comparisons Under Equal Conditions",
  objectiveVi:
    "Em nhận biết được thế nào là một phép so sánh công bằng (cùng điều kiện, chỉ khác yếu tố đang xét) khi thử nghiệm nhỏ hoặc lựa chọn phương án cho lớp.",
  objectiveEn:
    "Identify what makes a comparison fair (matching conditions and criteria) when running simple tests or choosing class activities.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-fair-comparison",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách kiểm tra xem hai lựa chọn đang bàn có được đặt trong cùng điều kiện và chấm theo cùng tiêu chí hay chưa.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm Khoa học muốn biết đất vườn hay đất cát giúp hạt đậu nảy mầm nhanh hơn. Một bạn đặt chậu đất vườn ở bệ cửa sổ nắng ấm và tưới nước đều, còn chậu đất cát lại cất trong góc tủ tối và không tưới nước. Vì sao phép so sánh này chưa công bằng?",
        question_en:
          "A Science group wants to test whether garden soil or sandy soil sprouts beans faster. One student puts the garden-soil pot on a sunny windowsill with water, and the sandy-soil pot in a dark closet without water. Why is this comparison unfair?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì hạt đậu xanh có kích thước nhỏ hơn hạt ngô nên hai chậu cây này không thể dùng để so sánh với nhau được.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì nhóm chưa đặt tên riêng và ghi nhãn phân biệt rõ ràng cho từng chậu cây trước khi bắt đầu thử nghiệm.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì trong giờ học Khoa học ở trường, học sinh không được phép lấy đất vườn mang vào lớp để làm thử nghiệm gieo hạt.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì hai chậu khác nhau cả ánh sáng lẫn nước tưới nên không rõ hạt nảy mầm khác nhau do loại đất hay do nắng và nước.",
            correct: true,
          },
        ],
        hint1_vi:
          "Nhóm đang muốn kiểm tra sự khác biệt của duy nhất yếu tố nào: loại đất, ánh sáng hay lượng nước?",
        hint2_vi:
          "Nếu chậu đất cát không nảy mầm, ta có chắc là tại đất cát hay tại không được tưới một giọt nước nào?",
        hint3_vi:
          "So sánh công bằng đòi hỏi giữ giống nhau các điều kiện khác (nước, ánh sáng, loại hạt) và chỉ để khác nhau yếu tố đang cần kiểm tra (loại đất).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Muốn so sánh công bằng tác dụng của hai loại đất, cả hai chậu phải nhận lượng nước, ánh sáng và hạt giống như nhau. Nếu thay đổi nhiều điều kiện cùng lúc, ta không thể kết luận yếu tố nào tạo ra sự khác biệt.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Lớp 4A muốn xem giữa “truyện lịch sử” và “sách đố vui khoa học”, thể loại nào được các bạn đọc nhiều hơn trong tuần. Cách đặt sách nào tạo ra sự so sánh công bằng nhất?",
        question_en:
          "Class 4A wants to see whether 'history stories' or 'science puzzle books' are read more during the week. Which setup creates the fairest comparison?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đặt truyện lịch sử ngay bàn đầu dễ lấy suốt 5 ngày, còn sách đố vui khoa học cất trên ngăn tủ cao và chỉ mở vào 5 phút cuối tuần.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đặt số cuốn bằng nhau của hai thể loại cạnh nhau trên kệ vừa tầm tay suốt cả tuần và ghi lại số lượt đọc từng loại.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Chỉ mang đúng 10 cuốn truyện lịch sử đến trưng bày ở lớp mà không mang theo bất kỳ cuốn sách đố vui khoa học nào.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ hỏi riêng các bạn trong câu lạc bộ Lịch sử xem các bạn thích đọc thể loại sách nào hơn rồi lấy đó làm kết quả chung.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nếu một loại sách để ngay tầm tay còn loại kia cất tít trên cao, kết quả mượn sách sẽ bị ảnh hưởng bởi vị trí để sách chứ không phải sở thích thật.",
        hint2_vi:
          "Để cả lớp có cơ hội chọn hai thể loại ngang nhau, số lượng sách, vị trí đặt và thời gian mở kệ cần như thế nào?",
        hint3_vi:
          "Đặt hai loại sách cạnh nhau với số lượng tương đương trong cùng khoảng thời gian giúp kết quả phản ánh đúng sự lựa chọn của các bạn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi cả hai thể loại đều có số lượng ngang nhau, đặt ở vị trí thuận tiện như nhau trong suốt 1 tuần, số lượt đọc mới phản ánh trung thực mức độ yêu thích của học sinh trong lớp.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Tổ 1 có 10 bạn quét và xếp bàn ghế xong trong 6 phút; Tổ 2 chỉ có 5 bạn làm cùng khối lượng việc đó trong 8 phút. Bạn Nam nói: “Tổ 2 làm chậm hơn hẳn 2 phút nên các bạn Tổ 2 ít cố gắng hơn Tổ 1!” Nhận xét của Nam thiếu công bằng ở điểm nào?",
        question_en:
          "Team 1 has 10 students and finishes tidying desks in 6 minutes; Team 2 has only 5 students doing the same workload in 8 minutes. Nam says: 'Team 2 took 2 minutes longer, so they tried less hard!' Why is Nam's comparison unfair?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì trên mặt đồng hồ đeo tay thì con số 6 phút thực ra dài hơn con số 8 phút nên kết quả đo đã bị đảo ngược, và cả hai tổ cần đo lại bằng một chiếc đồng hồ bấm giây thật chính xác mới tin được.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì bàn ghế trong lớp học được đóng bằng gỗ tự nhiên nên tổ nào cũng phải mất công như nhau khi kê lại.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì Nam chỉ nhìn tổng số phút mà bỏ qua sự chênh lệch lớn về số người làm (Tổ 2 chỉ có một nửa số người của Tổ 1 nhưng vẫn gánh cùng lượng việc).",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Vì không tổ nào trong lớp cần phải xếp lại bàn ghế sau mỗi giờ học thể dục hay giờ sinh hoạt lớp, nên việc bấm giờ là không cần thiết.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy chú ý số thành viên của mỗi tổ: 10 bạn so với 5 bạn khi cùng làm một lượng công việc như nhau.",
        hint2_vi:
          "Khi số người chỉ bằng một nửa, mỗi bạn ở Tổ 2 thực tế phải xếp số bàn ghế nhiều gấp mấy lần mỗi bạn ở Tổ 1?",
        hint3_vi:
          "So sánh thời gian hoàn thành mà không tính đến số người tham gia làm điều kiện đầu vào lệch hẳn nhau, dẫn đến đánh giá thiếu công bằng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Tổ 2 chỉ có 5 bạn (bằng một nửa Tổ 1) nên trung bình mỗi bạn phải làm gấp đôi phần việc nhưng chỉ mất thêm 2 phút. Muốn so sánh công bằng mức độ cố gắng, phải xét cùng quy mô nhân lực hoặc tính khối lượng việc trung bình của mỗi người.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình Lan muốn so sánh xem đi bộ theo lối ngõ nhỏ hay đi theo đường trục chính đến trường mất ít thời gian hơn. Cách bấm giờ nào cho kết quả đáng tin cậy nhất?",
        question_en:
          "Lan's family wants to compare whether walking via the small lane or the main street to school takes less time. Which timing method gives the most reliable comparison?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đi bộ với tốc độ bình thường từ cổng nhà đến cổng trường trên mỗi lối vào cùng khung giờ buổi sáng trong những ngày thời tiết khô ráo.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Hôm đi ngõ nhỏ thì chạy thật nhanh lúc đường vắng, còn hôm đi đường trục chính thì vừa đi bộ thong thả vừa ghé quán mua đồ ăn sáng.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đi lối ngõ nhỏ bằng xe đạp cho nhanh, còn hôm sau đo thời gian đi đường trục chính bằng cách đi bộ thong thả như mọi hôm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Đo thời gian đi ngõ nhỏ bắt đầu từ giữa ngõ cho gần, còn đường trục chính thì bấm đồng hồ ngay từ cửa phòng ngủ trong nhà.",
            correct: false,
          },
        ],
        hint1_vi:
          "Mục tiêu là so sánh độ ngắn – nhanh của hai tuyến đường khi đi bộ đến trường vào buổi sáng.",
        hint2_vi:
          "Nếu một hôm đi xe đạp hoặc ghé mua đồ ăn sáng, thời gian đo được còn phản ánh riêng quãng đường nữa không?",
        hint3_vi:
          "Cùng điểm xuất phát, cùng điểm đích, cùng tốc độ đi bộ và cùng khung giờ sáng mới tạo ra phép so sánh công bằng giữa hai lối đi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Giữ nguyên phương tiện (đi bộ tốc độ bình thường), cùng điểm đầu – điểm cuối và cùng khung giờ giao thông buổi sáng giúp gia đình Lan biết chính xác lối đi nào tiết kiệm thời gian hơn.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong buổi thảo luận chọn trò chơi tập thể cho ngày hội lớp, một bạn khen trò chơi kéo co bằng tiêu chí “vui nhộn”, nhưng lại chê trò chơi ghép tranh bằng tiêu chí “tốn giấy bìa”. Em nên góp ý thế nào để cả lớp so sánh công bằng hai trò chơi?",
        question_en:
          "Choosing a class festival game, a student praises tug-of-war using 'excitement' but criticizes puzzle-building using 'paper cost'. What should you suggest so the class compares both games fairly?",
        choices: [
          {
            id: "a",
            label_vi:
              "Hủy bỏ cả hai trò chơi đã bàn để cả lớp ngồi yên tại chỗ giữ trật tự suốt buổi hội vui của trường.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Ai giơ tay phát biểu trước thì cả lớp chọn luôn trò chơi của người đó mà không cần nghe thêm ý kiến nào khác.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chấm trò chơi mình thích bằng tiêu chí dễ đạt, còn trò chơi kia thì áp tiêu chí thật khắt khe để nhanh chóng loại khỏi danh sách.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Đề nghị lớp dùng chung một bộ tiêu chí (mức độ hào hứng, an toàn, chi phí chuẩn bị và số bạn cùng được tham gia) để đánh giá cả hai trò chơi.",
            correct: true,
          },
        ],
        hint1_vi:
          "Nếu chỉ nêu điểm mạnh của lựa chọn này rồi đem so với điểm yếu ở khía cạnh khác của lựa chọn kia thì có khách quan không?",
        hint2_vi:
          "Chuyện gì xảy ra nếu ta cũng hỏi ngược lại: kéo co cần chuẩn bị dây gì (chi phí/an toàn) và ghép tranh có vui không?",
        hint3_vi:
          "Áp dụng cùng một bộ tiêu chí chung cho cả hai trò chơi giúp tập thể nhìn rõ ưu điểm và hạn chế của từng bên một cách công tâm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "So sánh công bằng trong thảo luận nghĩa là đánh giá mọi phương án trên cùng một bộ thước đo chung (an toàn, chi phí, độ thu hút, số người tham gia), thay vì dùng tiêu chí có lợi riêng cho một bên.",
    },
  ],
};
