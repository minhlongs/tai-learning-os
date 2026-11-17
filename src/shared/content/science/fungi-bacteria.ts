/**
 * Khoa học · Nấm, vi khuẩn có ích – có hại và bảo quản thực phẩm (skill: sci-fungi-bacteria, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const fungiBacteria: LessonDefinition = {
  id: "sci-fungi-bacteria",
  subjectId: "science",
  skillId: "sci-fungi-bacteria",
  titleVi: "Nấm, vi khuẩn và an toàn bảo quản thực phẩm",
  titleEn: "Fungi, Bacteria, and Safe Food Preservation",
  objectiveVi:
    "Em phân biệt được vai trò của nấm và vi khuẩn có ích với tác hại của nấm mốc, vi khuẩn gây hỏng thức ăn, từ đó thực hành bảo quản thực phẩm an toàn.",
  objectiveEn:
    "Distinguish helpful fungi and bacteria from harmful molds and spoilage bacteria, and practice safe food preservation.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-fungi-bacteria",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách kiểm tra hạn sử dụng và cách đậy kín thức ăn trong tủ lạnh cùng người lớn.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhận định nào dưới đây nói đúng về kích thước và nơi sống của nấm và vi khuẩn xung quanh chúng ta?",
        question_en:
          "Which statement accurately describes the size and habitat of fungi and bacteria around us?",
        choices: [
          {
            id: "a",
            label_vi:
              "Tất cả các loài nấm và vi khuẩn đều to lớn như cây cổ thụ, mọc thành rừng rậm và chỉ sống được ở đáy biển sâu.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nấm lớn như nấm hương, nấm rơm nhìn thấy bằng mắt; vi khuẩn và nấm men rất nhỏ, phải xem qua kính hiển vi và có mặt ở khắp nơi.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Nấm và vi khuẩn đều có lá xanh chứa diệp lục để tự quang hợp dưới ánh nắng như cây lúa ngoài đồng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Trong đất, trong nước và trong không khí hoàn toàn không có một vi khuẩn nào sinh sống được.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em có nhìn thấy cây nấm kim châm, nấm hương trong bữa ăn không? Còn vi khuẩn trên bàn tay chưa rửa thì mắt thường có thấy được không?",
        hint2_vi:
          "Nấm không phải là thực vật có diệp lục, còn vi khuẩn có kích thước siêu hiển vi.",
        hint3_vi:
          "Có những loài nấm ăn nhìn rõ bằng mắt thường, nhưng nấm men và vi khuẩn nhỏ đến mức phải dùng kính hiển vi phóng đại nhiều lần mới thấy được.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thế giới nấm rất đa dạng: nấm hương, nấm đùi gà, mộc nhĩ nhìn rõ bằng mắt thường; riêng nấm men và toàn bộ vi khuẩn có kích thước vô cùng nhỏ bé, phân bố khắp trong đất, nước, không khí và trên cơ thể sinh vật.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hoạt động chế biến nào dưới đây tận dụng lợi ích của vi khuẩn có ích hoặc nấm men an toàn trong ẩm thực gia đình?",
        question_en:
          "Which kitchen preparation below uses helpful bacteria or safe yeast beneficially?",
        choices: [
          {
            id: "a",
            label_vi:
              "Ủ sữa ấm với men vi khuẩn có ích để làm sữa chua và dùng nấm men cho bột bánh mì nở xốp.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Để thịt tươi ngoài nắng nóng suốt hai ngày cho ruồi nhặng đậu vào.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Hái những cây nấm lạ có màu sắc sặc sỡ mọc hoang trong rừng sâu đem về nấu canh cho cả nhà ăn.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Để nồi cơm nguội trong góc bếp ẩm thấp cho đến khi cơm chuyển sang màu đen nhầy và bốc mùi chua.",
            correct: false,
          },
        ],
        hint1_vi:
          "Không phải mọi vi khuẩn hay nấm đều gây bệnh; nhiều chủng được con người nuôi cấy để lên men thức ăn bổ dưỡng.",
        hint2_vi:
          "Nhớ lại vị chua dịu của sữa chua, dưa cải muối vừa chín tới hoặc độ xốp phồng của ổ bánh mì nướng.",
        hint3_vi:
          "Vi khuẩn lên men chua giúp chuyển sữa thành sữa chua tốt cho tiêu hóa, còn nấm men giúp bột bánh mì nở xốp thơm ngon.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Con người ứng dụng vi khuẩn có ích để làm sữa chua, muối dưa cà đúng cách, và dùng nấm men để làm nở bột bánh mì, bánh bao. Tuyệt đối không hái nấm lạ mọc hoang vì nhiều loài nấm rừng chứa chất kịch độc.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Nhật ký quan sát hai mẩu bánh mì",
        passage_vi:
          "Cuối tuần, lớp học thực hiện thí nghiệm nhỏ với hai mẩu bánh mì cùng loại đặt trong hai túi nhựa trong suốt buộc kín. Mẩu thứ nhất được sấy khô giòn rồi để nơi thoáng mát. Mẩu thứ hai được vẩy vài giọt nước cho ẩm rồi đặt ở góc kệ ấm áp. Sau bốn ngày, mẩu bánh khô vẫn giữ màu vàng sáng, chưa thấy dấu hiệu lạ. Ngược lại, trên bề mặt mẩu bánh ẩm ở nơi ấm đã mọc nhiều đốm mốc trắng xám và xanh đen li ti. Kết quả cho thấy nấm mốc phát triển rất nhanh trong điều kiện ẩm ướt và ấm áp.",
        question_vi:
          "Theo đoạn quan sát trên, điều kiện môi trường nào khiến nấm mốc phát triển rất nhanh trên thực phẩm?",
        choices: [
          {
            id: "a",
            label_vi: "Môi trường thật khô giòn và thoáng mát.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Môi trường đóng băng lạnh sâu dưới không độ.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Môi trường hoàn toàn không có chút độ ẩm nào.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Điều kiện môi trường ẩm ướt và ấm áp.",
            correct: true,
          },
        ],
        evidenceSentence_vi:
          "Kết quả cho thấy nấm mốc phát triển rất nhanh trong điều kiện ẩm ướt và ấm áp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Thí nghiệm đối chứng giữa mẩu bánh khô và mẩu bánh ẩm cho thấy nấm mốc và vi khuẩn gây hỏng thức ăn sinh sôi rất mạnh ở nơi ẩm ướt, ấm áp.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi phát hiện một chiếc bánh bông lan hoặc củ lạc trong lọ đã xuất hiện đốm nấm mốc xanh đen và mùi lạ, cách xử lí nào an toàn nhất cho sức khỏe?",
        question_en:
          "When you notice greenish-black mold spots and an odd smell on a cake or peanuts, what is the safest action?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ cần gọt bỏ vài chấm mốc nhỏ nhìn thấy bên ngoài vỏ bánh rồi ăn hết phần còn lại như bình thường.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đem bánh ra phơi nắng thật lâu cho bay hết mùi lạ rồi tiếp tục dùng để khỏi lãng phí thức ăn trong nhà.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Bỏ toàn bộ thực phẩm đã mốc, rồi rửa sạch và làm khô hộp đựng.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Trộn thêm đường ngọt để che bớt mùi chua và ăn ngay.",
            correct: false,
          },
        ],
        hint1_vi:
          "Đốm màu xanh đen em nhìn thấy trên mặt bánh mới chỉ là phần lộ ra ngoài của nấm mốc.",
        hint2_vi:
          "Sợi nấm nhỏ li ti và độc tố của nấm mốc đã lan sâu vào bên trong thực phẩm mềm dù mắt thường không thấy rõ.",
        hint3_vi:
          "Độc tố nấm mốc rất bền nhiệt và dễ gây ngộ độc tiêu hóa, nên cần bỏ hoàn toàn thực phẩm đã bị mốc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi thức ăn đã lên mốc hoặc ôi thiu, sợi nấm và độc tố nguy hiểm đã lan vào bên trong, kể cả đun nóng cũng khó phân hủy hết độc tố. Vì vậy cần bỏ thực phẩm hỏng để phòng tránh ngộ độc.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao việc sấy khô nông sản (như hạt đậu, nấm hương khô) và đậy kín thức ăn chín cất vào tủ lạnh lại giúp giữ thực phẩm lâu hỏng hơn?",
        question_en:
          "Why do drying grains/mushrooms and storing covered cooked food in the refrigerator keep food fresh longer?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì tủ lạnh giữ được thực phẩm tươi ngon vĩnh viễn suốt nhiều năm liền mà không bao giờ bị hỏng hay ôi thiu.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì bóng tối lạnh lẽo trong tủ lạnh biến toàn bộ vi khuẩn có hại thành chất đường ngọt lành cho cơ thể.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì sấy khô làm tăng thêm thật nhiều nước ấm cho thực phẩm mềm ra.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì giảm độ ẩm hoặc hạ nhiệt độ khiến nấm mốc, vi khuẩn gây hại bị kìm hãm, khó sinh sôi.",
            correct: true,
          },
        ],
        hint1_vi:
          "Từ thí nghiệm bánh mì ở bước trước, nấm mốc và vi khuẩn thích nhất hai yếu tố nào: độ ẩm cao và nhiệt độ ấm.",
        hint2_vi:
          "Phơi sấy khô lấy đi nước trong thực phẩm; còn ngăn mát tủ lạnh hạ thấp nhiệt độ xuống mức lạnh.",
        hint3_vi:
          "Khi thiếu nước (khô ráo) hoặc gặp lạnh, vi khuẩn và nấm mốc hoạt động rất chậm lại nên thức ăn được bảo quản lâu hơn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Vi khuẩn và nấm mốc cần độ ẩm và nhiệt độ ấm để phát triển nhanh. Làm khô giúp tách bớt nước, còn giữ lạnh trong hộp kín giúp kìm hãm sự sinh sôi của vi sinh vật gây ôi thiu.",
    },
  ],
};
