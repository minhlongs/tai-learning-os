/**
 * Tư duy phản biện · Sẵn sàng điều chỉnh quan điểm trước bằng chứng mới (skill: deb-changing-mind, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const changingMind: LessonDefinition = {
  id: "deb-changing-mind",
  subjectId: "debate",
  skillId: "deb-changing-mind",
  titleVi: "Sẵn sàng điều chỉnh quan điểm khi có bằng chứng thuyết phục",
  titleEn: "Updating Your View When Stronger Evidence Appears",
  objectiveVi:
    "Em hiểu rằng điều chỉnh nhận định khi gặp bằng chứng mới xác thực là biểu hiện của tư duy trung thực và trưởng thành, không coi thảo luận là cuộc hơn thua.",
  objectiveEn:
    "Recognize that updating one's view in light of stronger verifiable evidence reflects intellectual honesty rather than 'losing' an argument.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-changing-mind",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tự hỏi 'Thông tin mới này có giúp hiểu biết của mình chính xác hơn trước không?' mỗi khi nghe một góc nhìn có dẫn chứng rõ ràng.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong thảo luận khoa học và học đường, khi bạn đưa ra bằng chứng xác thực cho thấy nhận định ban đầu của em chưa đầy đủ, việc em sẵn sàng điều chỉnh lại quan điểm thể hiện điều gì?",
        question_en:
          "In academic and scientific discussions, when a classmate presents solid evidence showing your initial claim was incomplete, what does updating your view show?",
        choices: [
          {
            id: "a",
            label_vi:
              "Thể hiện em là người thiếu lập trường, ai nói gì cũng nghe theo, nên từ nay cả lớp sẽ không còn coi trọng những ý kiến mà em đưa ra trong các buổi thảo luận nữa.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Thể hiện em đã thất bại nặng nề trước mặt các bạn trong nhóm. Người ta thường chỉ đổi ý khi mình đã thua và không còn cách nào bảo vệ được nhận định ban đầu của mình.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Thể hiện từ nay em không bao giờ nên nêu ý kiến cá nhân nữa. Đã một lần điều chỉnh quan điểm thì những nhận định sau này của em sẽ không còn được các bạn tin tưởng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Thể hiện tư duy trung thực, coi trọng sự thật và mục tiêu cùng tiến bộ hơn là cố bảo vệ cái tôi bằng mọi giá.",
            correct: true,
          },
        ],
        hint1_vi:
          "Mục đích cao nhất của một buổi thảo luận học tập là tìm ra hiểu biết đúng đắn nhất hay là xem ai cãi đến cùng?",
        hint2_vi:
          "Đổi ý vì nể nang khác hẳn với điều chỉnh nhận định nhờ có bằng chứng kiểm chứng được. Hãy phân biệt hai điều này.",
        hint3_vi:
          "Biết cập nhật suy nghĩ khi có dữ liệu chính xác hơn chính là phẩm chất trung thực trí tuệ của người học trưởng thành.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Thảo luận không phải cuộc phân định thắng – thua cá nhân. Điều chỉnh quan điểm dựa trên bằng chứng xác thực khác hoàn toàn với việc gió chiều nào che chiều ấy, vì người học chỉ thay đổi khi lý lẽ và dữ liệu mới thực sự vững chắc hơn.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trường hợp nào dưới đây là sự điều chỉnh quan điểm đúng đắn dựa trên tư duy phản biện, chứ KHÔNG phải thay đổi tùy tiện theo đám đông?",
        question_en:
          "Which case below represents a sound evidence-based change of mind rather than blindly following the crowd?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đổi ý ngay khi thấy ba bạn ngồi cạnh nói to hơn mình, dù các bạn chưa đưa ra lý do hay bằng chứng nào, chỉ vì em không muốn bị cả nhóm cho là người hay cãi bạn trong giờ thảo luận.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Ban đầu em nghĩ xương rồng không cần tưới nước; sau khi đọc tài liệu thực vật học và thấy chậu cây héo sau nhiều tuần khô kiệt, em hiểu xương rồng chịu hạn giỏi nhưng vẫn cần tưới ít nước định kỳ.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Đổi kết quả phép tính đúng của mình thành kết quả sai chỉ vì sợ bài của mình khác bạn thân, rồi tẩy xóa cả các bước làm để cô giáo không nhận ra ai đã đổi bài cho ai.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Hôm nay nói thích đọc sách lịch sử, ngày mai lại nói ghét chỉ để trêu đùa các bạn trong tổ, và hôm sau lại nói thích trở lại để rồi chẳng ai biết ý nào của em là thật.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy xem trường hợp nào người học đổi nhận định nhờ có tài liệu đáng tin cậy và quan sát thực nghiệm rõ ràng.",
        hint2_vi:
          "Đổi ý vì tiếng nói to hay vì sợ khác bạn thân có dựa trên bằng chứng thực tế nào không?",
        hint3_vi:
          "Từ chỗ nghĩ “không bao giờ cần nước” sang hiểu rõ “cần ít nước định kỳ” nhờ tài liệu thực vật học và quan sát thực tế là bước cập nhật kiến thức chuẩn mực.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Người có bản lĩnh tư duy không đổi ý vì áp lực số đông hay tiếng nói lớn, nhưng luôn sẵn sàng tinh chỉnh nhận định khi đối chiếu với tài liệu khoa học và kết quả quan sát thực tế.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ban đầu bạn Hà cho rằng tổ trực nhật hôm qua quên đóng cửa sổ làm ướt bệ gỗ. Sau đó bác bảo vệ cho biết chính bác đã mở cửa sổ lúc sáng sớm nay để thông gió thì bất ngờ mưa tạt vào. Câu nói nào của Hà thể hiện thái độ trung thực và văn minh nhất?",
        question_en:
          "Ha initially thought yesterday's duty team forgot to close the window, wetting the sill. Later, the school guard explains he opened it early this morning to air the room when sudden rain blew in. Which response from Ha is most honest and respectful?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Dù bác bảo vệ mở cửa sáng nay thì tổ trực nhật hôm qua vẫn có lỗi như thường. Đã là trực nhật thì phải biết kiểm tra quanh lớp kể cả khi người khác làm gì ngoài phòng!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Im lặng giả vờ như mình chưa từng trách nhầm các bạn tổ trực nhật, để mọi người tự bỏ qua chuyện đó và không ai biết hôm qua mình đã lớn tiếng đổ lỗi cho cả tổ.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Cảm ơn thông tin của bác ạ. Vậy là lúc nãy tớ đã suy đoán vội nên trách nhầm tổ trực nhật, cho tớ xin lỗi các bạn nhé; để tớ cùng lấy khăn lau khô bệ cửa sổ!”",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Đổ lỗi sang cho chiếc cửa sổ thiết kế không tự đóng lại khi trời mưa. Nếu bác bảo vệ đã mở ra thì mọi chuyện phải do cái cửa sổ cũ kỹ này chứ không phải do tổ trực nhật hay ai khác.",
            correct: false,
          },
        ],
        hint1_vi:
          "Thông tin trực tiếp từ bác bảo vệ đã làm thay đổi hoàn toàn nguyên nhân sự việc mà Hà phỏng đoán lúc đầu.",
        hint2_vi:
          "Khi nhận ra mình đã suy đoán sai làm ảnh hưởng tới bạn, thái độ dũng cảm và chân thành nhất là gì?",
        hint3_vi:
          "Thừa nhận phỏng đoán ban đầu chưa đúng, xin lỗi tổ trực nhật và cùng chung tay lau khô cửa sổ giúp tập thể càng thêm quý trọng sự thẳng thắn của Hà.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thừa nhận thẳng thắn khi có thông tin xác thực mới và chủ động xin lỗi vì phỏng đoán vội không làm giảm uy tín của Hà, mà trái lại tạo dựng sự tin cậy bền vững trong tập thể lớp.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong thí nghiệm Khoa học về vật nổi – vật chìm, Bình dự đoán “quả quýt luôn luôn nổi trong nước”. Khi thả thử: quả quýt còn nguyên vỏ thì nổi, nhưng quả quýt đã bóc vỏ lại chìm xuống đáy cốc! Cách ghi kết luận nào vào phiếu học tập thể hiện tốt nhất kỹ năng điều chỉnh quan điểm theo bằng chứng?",
        question_en:
          "In a buoyancy experiment, Binh predicted 'a mandarin orange always floats in water'. Testing shows an unpeeled mandarin floats, while a peeled mandarin sinks! Which lab-sheet conclusion best demonstrates evidence-based revision?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Dự đoán ban đầu của em mới đúng một phần: quả quýt còn vỏ nổi được nhờ lớp vỏ xốp chứa nhiều túi khí nhỏ, còn khi bóc vỏ thì phần múi đặc hơn nước nên chìm xuống.”",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "“Cốc nước hôm nay bị hỏng nên quả quýt bóc vỏ mới chìm, dự đoán ban đầu của em vẫn đúng hoàn toàn, cả nhóm cứ ghi vào phiếu là quả quýt luôn nổi và thí nghiệm hôm nay coi như chưa tính.”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Tẩy xóa phần dự đoán ban đầu đi để viết lại như thể ngay từ đầu mình đã đoán quả quýt bóc vỏ sẽ chìm, nhờ vậy phiếu học tập của em sẽ được cô giáo khen là dự đoán chính xác.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Bỏ quả quýt bóc vỏ ra khỏi bàn thí nghiệm để không ai nhìn thấy kết quả trái với dự đoán của mình nữa, rồi lặng lẽ trả quả quýt về giỏ đúng lúc cả nhóm đang quay sang chỗ khác.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trong nghiên cứu khoa học, dự đoán ban đầu khác với kết quả thí nghiệm là chuyện hết sức bình thường và quý giá.",
        hint2_vi:
          "Giấu mẫu vật hay tẩy xóa dự đoán cũ có giúp em hiểu thêm về tác dụng của lớp vỏ xốp chứa khí không?",
        hint3_vi:
          "Giữ trung thực dự đoán ban đầu, ghi rõ phần nào đúng, phần nào cần điều chỉnh kèm lời giải thích từ quan sát thực nghiệm chính là tư duy khoa học đích thực.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nhà khoa học luôn trân trọng những kết quả bất ngờ vì chúng giúp làm sắc nét hiểu biết cũ: từ câu nói quá rộng “quả quýt luôn nổi” tiến tới hiểu rõ vai trò chứa khí của lớp vỏ quýt.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi thảo luận chọn lộ trình tham quan bảo tàng của lớp, em ủng hộ đi xe buýt tuyến số 1 vì nhớ mang máng tuyến đó đi thẳng. Bạn Châu mở bản đồ lộ trình mới nhất của thành phố cho thấy tuyến số 1 vừa đổi đường từ tháng trước phải đi bộ thêm 1 km, trong khi tuyến số 2 nay dừng ngay cổng bảo tàng. Em nên phản hồi thế nào trước nhóm?",
        question_en:
          "Planning a museum visit, you favor Bus Route 1 from memory. Chau opens the city's updated transit map showing Route 1 changed last month (requiring a 1 km walk), whereas Route 2 now stops right at the museum gate. How should you respond?",
        choices: [
          {
            id: "a",
            label_vi:
              "Khăng khăng đòi đi tuyến số 1 như ý ban đầu để chứng tỏ mình không chịu nhường bạn Châu. Theo em, phương án mình đã nói ra trước cả lớp thì dù bản đồ cập nhật thế nào vẫn phải giữ cho bằng được.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nói rằng bản đồ chính thức của thành phố mới cập nhật chắc chắn in nhầm. Từ trước tới giờ tuyến số 1 vẫn luôn đi thẳng tới bảo tàng nên em tin vào trí nhớ của mình hơn là bản đồ do thành phố ban hành.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Giận dỗi không tham gia bàn kế hoạch chuyến tham quan cùng các bạn nữa. Em thấy Châu mang bản đồ ra trước mặt cả nhóm như vậy là làm em mất mặt nên em không muốn góp thêm ý kiến nào.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Cảm ơn Châu đã tra bản đồ mới nhất nhé! Trí nhớ của tớ là từ lộ trình cũ năm ngoái rồi; với thông tin cập nhật này, tớ nhất trí chuyển sang phương án đi tuyến số 2 để cả lớp đến thẳng cổng bảo tàng an toàn hơn.”",
            correct: true,
          },
        ],
        hint1_vi:
          "Giữa trí nhớ mang máng từ năm ngoái và bản đồ lộ trình chính thức vừa cập nhật tháng trước, nguồn thông tin nào đáng tin cậy hơn?",
        hint2_vi:
          "Nếu cố bảo vệ ý kiến cũ đã lỗi thời, cả lớp sẽ phải chịu bất tiện gì khi đi tham quan?",
        hint3_vi:
          "Cảm ơn người cung cấp dữ liệu mới, nêu rõ lý do mình cập nhật quan điểm và đồng thuận với lộ trình thuận lợi hơn cho tập thể là cách ứng xử đẹp nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Biết nói lời cảm ơn trước bằng chứng cập nhật chính xác và sẵn sàng điều chỉnh đề xuất vì lợi ích chung của cả lớp thể hiện phong thái tự tin, cầu thị và đáng tin cậy.",
    },
  ],
};
