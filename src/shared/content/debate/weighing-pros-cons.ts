/**
 * Tư duy phản biện · Cân nhắc lợi ích và hạn chế của các lựa chọn (skill: deb-weighing-pros-cons, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const weighingProsCons: LessonDefinition = {
  id: "deb-weighing-pros-cons",
  subjectId: "debate",
  skillId: "deb-weighing-pros-cons",
  titleVi: "Cân nhắc lợi ích và hạn chế trước khi đề xuất chung",
  titleEn: "Weighing Pros, Cons, and Trade-Offs Before Deciding",
  objectiveVi:
    "Em biết liệt kê công tâm cả điểm mạnh lẫn hạn chế (sự đánh đổi) của từng cách làm và đề xuất giải pháp giảm bớt hạn chế cho tập thể.",
  objectiveEn:
    "Fairly weigh both benefits and drawbacks (trade-offs) of competing options before making a group recommendation.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-weighing-pros-cons",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách kẻ bảng hai cột 'Điểm thuận lợi' và 'Điểm cần lưu ý' khi gia đình bàn kế hoạch sinh hoạt cuối tuần.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao khi tập thể lớp đứng trước hai cách tổ chức hoạt động, người có tư duy phản biện luôn xem xét cả lợi ích lẫn hạn chế của từng cách thay vì chỉ kể toàn ưu điểm của cách mình thích?",
        question_en:
          "When a class faces two ways to organize an activity, why does a critical thinker examine both benefits and drawbacks of each option instead of listing only pros of their favorite?",
        choices: [
          {
            id: "a",
            label_vi:
              "Để buổi họp lớp có thể kéo dài thêm thật lâu, sang tận tiết học kế tiếp, nhờ vậy cả lớp được nghỉ ngơi nhiều hơn mà không phải học bài mới.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Để chứng minh rằng trên đời này không có hoạt động tập thể nào thật sự đáng để cả lớp bỏ thời gian và công sức ra tổ chức.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì hầu hết lựa chọn thực tế đều có sự đánh đổi; nhìn rõ cả hai mặt giúp lớp chọn cách phù hợp nhất và chủ động chuẩn bị phương án khắc phục hạn chế.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Vì chỉ những ý tưởng đã hoàn hảo tuyệt đối, không còn một điểm trừ nhỏ nào, mới được phép đem ra nêu trong buổi sinh hoạt của lớp.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trong đời sống học đường, có kế hoạch nào vừa không tốn thời gian chuẩn bị, vừa không tốn công dọn dẹp mà lại đáp ứng mọi mong muốn cùng lúc không?",
        hint2_vi:
          "Nếu cố tình giấu đi điểm bất tiện của cách mình thích, điều gì sẽ xảy ra khi cả lớp bắt tay vào làm thật?",
        hint3_vi:
          "Nhận diện rõ sự đánh đổi (được điểm này nhưng vất vả điểm kia) giúp cả lớp quyết định sáng suốt và chuẩn bị chu đáo từ đầu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mỗi lựa chọn trong thực tế đều có mặt thuận lợi đi kèm những giới hạn về thời gian, không gian hoặc công sức. Nêu thẳng thắn cả hai mặt giúp tập thể chọn đúng ưu tiên và lường trước khó khăn.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Lớp 5B bàn nơi đặt góc đọc sách: đặt ở hành lang trước lớp thì rộng rãi, thoáng sáng nhưng giờ ra chơi hơi ồn; đặt ở góc cuối lớp thì yên tĩnh, dễ bảo quản sách nhưng diện tích hẹp chỉ ngồi được 5 bạn một lúc. Sự đánh đổi chính giữa hai vị trí này là gì?",
        question_en:
          "Class 5B debates placing the reading corner: the hallway is spacious and bright but noisy at recess; the back corner is quiet and safe for books but fits only 5 students at once. What is the main trade-off?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đánh đổi giữa việc cả lớp góp tiền mua thêm sách Tiếng Việt mới hay dùng khoản quỹ đó để mua thêm bộ sách Khoa học có tranh minh họa màu.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đánh đổi giữa thói quen đọc sách vào mỗi buổi sáng ở lớp với thói quen đọc sách vào buổi tối trước giờ đi ngủ tại nhà riêng.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chẳng có sự đánh đổi nào đáng bàn: góc cuối lớp vốn rộng hơn hành lang nên đương nhiên tốt hơn về mọi mặt.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Đánh đổi giữa không gian rộng rãi cho nhiều bạn cùng ngồi (ở hành lang) với sự yên tĩnh và an toàn cho tủ sách (ở góc cuối lớp).",
            correct: true,
          },
        ],
        hint1_vi:
          "Hãy đặt điểm mạnh của vị trí thứ nhất cạnh điểm hạn chế của vị trí thứ hai và ngược lại.",
        hint2_vi:
          "Hành lang được cái gì nhưng mất cái gì? Góc cuối lớp giữ được điều gì nhưng bị giới hạn điều gì?",
        hint3_vi:
          "Chọn hành lang thì được chỗ ngồi rộng nhưng kém yên tĩnh; chọn cuối lớp thì yên tĩnh, dễ giữ sách nhưng ít chỗ ngồi hơn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Xác định đúng cặp đánh đổi cốt lõi (độ rộng rãi so với độ yên tĩnh và bảo quản sách) giúp cả lớp tập trung tìm cách dung hòa thay vì tranh cãi cảm tính.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình An có 2 giờ rảnh chiều Chủ nhật và cân nhắc hai hoạt động: (1) Cùng dọn lại tủ sách gia đình — nhà cửa gọn gàng, tìm lại được nhiều sách hay nhưng hơi mỏi tay và chưa được vận động ngoài trời; (2) Đạp xe quanh công viên gần nhà — khỏe người, thoáng đãng nhưng tủ sách vẫn lộn xộn sang tuần sau. Cách trình bày nào thể hiện tư duy cân nhắc đa chiều?",
        question_en:
          "An's family has 2 free hours Sunday afternoon and weighs: (1) tidying the home bookshelf vs. (2) cycling in the park. Which proposal reflects balanced trade-off thinking?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nêu rõ ưu điểm và hạn chế của cả hai việc, rồi đề xuất 1 giờ đầu xếp gọn tủ sách và 1 giờ sau đạp xe hóng mát ngoài công viên.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Khẳng định chắc chắn rằng đạp xe quanh công viên chẳng đem lại ích lợi gì cho sức khỏe cả, để cả nhà ở nhà dọn tủ sách cho xong việc.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Nói rằng chiếc tủ sách trong nhà cứ để tự nhiên rồi vài tuần sau nó sẽ tự gọn gàng lại, nên không cần ai phải sắp xếp gì cả.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Quyết định bỏ luôn cả hai hoạt động đã bàn, để mỗi người trong nhà về phòng riêng ngồi một góc, không trò chuyện hay làm gì cùng nhau nữa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Cả nhu cầu giữ góc học tập ngăn nắp lẫn nhu cầu vận động ngoài trời cuối tuần đều chính đáng.",
        hint2_vi:
          "Khi hiểu rõ điểm mạnh và hạn chế của từng hoạt động trong quỹ thời gian 2 giờ, ta có thể kết hợp hợp lý không?",
        hint3_vi:
          "Ghi nhận trung thực lợi ích của cả hai bên rồi chia khung giờ hợp lý giúp giữ được ưu điểm và giảm bớt sự tiếc nuối của từng lựa chọn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi nhìn nhận công bằng giá trị của cả hai hoạt động, An không cần hạ thấp hoạt động nào mà còn tìm ra phương án chia thời gian hợp lý để cả nhà vừa gọn góc sách vừa được vận động.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm Khoa học lớp 5 chuẩn bị mô hình vòng tuần hoàn của nước với kinh phí tiết kiệm và thời gian chuẩn bị 2 ngày. Cách làm bằng bìa tái chế nhẹ, không tốn tiền, kịp xong trong 1 buổi nhưng dễ thấm nước nếu đổ nước thật; cách làm bằng hộp nhựa trong suốt đổ được nước thật nhưng tốn chi phí mua hộp và mất 3 ngày gắn keo chống rò. Nếu hạn nộp bài là sáng ngày kia (chỉ còn đúng 2 ngày), đề xuất nào hợp lý nhất?",
        question_en:
          "A Grade 5 Science group has a low budget and 2 days left to build a water-cycle model. Recycled cardboard is free and takes 1 session, though it cannot hold real water; a clear plastic tank holds water but costs money and takes 3 days to seal. With a strict 2-day deadline, what is the soundest recommendation?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chọn làm hộp nhựa trong suốt cho thật đẹp mắt và đổ được nước thật, dù biết chắc đến sáng buổi thuyết trình lớp keo chống rò vẫn chưa khô kịp và bài của nhóm sẽ bị trễ hạn nộp.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chọn làm bằng bìa tái chế để kịp thời hạn 2 ngày và tiết kiệm, đồng thời gắn thêm mũi tên trượt minh họa sự bay hơi – ngưng tụ để bù cho việc không đổ được nước thật.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Giấu kín chuyện hộp nhựa phải mất tới 3 ngày chờ khô keo, để cả nhóm tin rằng vẫn kịp và đồng ý chọn phương án hộp nhựa trong suốt.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Thống nhất bỏ luôn việc làm mô hình vòng tuần hoàn nước: cách nào cũng có điểm hạn chế riêng chưa thật sự hoàn hảo.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy chú ý điều kiện bắt buộc không thể lùi của bài tập: thời hạn nộp chỉ còn đúng 2 ngày và ưu tiên tiết kiệm.",
        hint2_vi:
          "Cách làm bằng bìa tái chế đáp ứng tốt thời hạn và chi phí, vậy điểm yếu “không đổ được nước thật” có thể bù đắp bằng cách minh họa nào?",
        hint3_vi:
          "Chọn cách đáp ứng được mốc thời gian bắt buộc kèm giải pháp sáng tạo khắc phục điểm hạn chế là bước ra quyết định rất thực tế.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Cân nhắc lợi – hại không dừng ở việc liệt kê, mà còn đối chiếu với điều kiện thực tế (thời hạn 2 ngày) và tìm biện pháp giảm nhẹ hạn chế (dùng mũi tên trượt thay cho nước thật).",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi thay mặt tổ trình bày trước lớp lời đề xuất tổ chức “Ngày hội đổi sách cũ lấy sách mới” thay vì “Quyên góp tiền mua sách mới”, cấu trúc phát biểu nào thuyết phục và công tâm nhất?",
        question_en:
          "Presenting a recommendation for a 'Book Swap Day' instead of 'Collecting Money to Buy New Books', which speech structure is most fair and persuasive?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ kể toàn ưu điểm của ngày hội đổi sách cũ do tổ mình nghĩ ra, đồng thời chê bai những bạn vừa giơ tay ủng hộ phương án quyên góp tiền mua sách mới để cả lớp không bầu cho cách đó nữa.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chỉ cần đọc to tên hoạt động mà tổ mình đã chọn rồi kết thúc phần trình bày, không giải thích thêm bất kỳ lý do hay điểm cần lưu ý nào trước lớp để đỡ tốn thời gian sinh hoạt chung.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Ghi nhận điểm hay của việc mua sách mới, nêu lý do chọn đổi sách cũ (tiết kiệm chi phí, tận dụng sách ở nhà) và đề xuất kiểm tra, bọc lại bìa để khắc phục sách cũ quăn rách.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Phóng đại rằng tất cả sách mới bày bán ngoài hiệu sách đều không có cuốn nào đọc được, để cả lớp thấy phương án mua sách mới là vô nghĩa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Một bài đề xuất chín chắn trước tập thể cần thể hiện sự tôn trọng với phương án còn lại như thế nào?",
        hint2_vi:
          "Nếu chính tổ em chủ động nêu luôn nhược điểm “sách cũ có thể quăn mép” kèm cách khắc phục, cả lớp sẽ tin tưởng hơn hay ít tin tưởng hơn?",
        hint3_vi:
          "Cấu trúc gồm 3 phần: ghi nhận điểm hay của cách kia, nêu lợi ích vượt trội của cách đề xuất, và kèm giải pháp cho điểm hạn chế luôn tạo sức thuyết phục cao nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trình bày công tâm ưu điểm của phương án đối chiếu, giải thích rõ lý do ưu tiên phương án đổi sách và chủ động nêu giải pháp giữ gìn chất lượng sách thể hiện tư duy phản biện sâu sắc, tôn trọng tập thể.",
    },
  ],
};
