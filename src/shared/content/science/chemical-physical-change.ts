/**
 * Khoa học · Sự biến đổi vật lí và sự biến đổi hóa học của chất (skill: sci-chemical-physical-change, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 5.
 */
import type { LessonDefinition } from "../types";

export const chemicalPhysicalChange: LessonDefinition = {
  id: "sci-chemical-physical-change",
  subjectId: "science",
  skillId: "sci-chemical-physical-change",
  titleVi: "Sự biến đổi vật lí và biến đổi hóa học",
  titleEn: "Physical Changes and Chemical Changes",
  objectiveVi:
    "Em phân biệt được sự biến đổi vật lí (không tạo ra chất mới) với sự biến đổi hóa học (tạo ra chất mới) qua các hiện tượng quen thuộc trong đời sống.",
  objectiveEn:
    "Distinguish physical changes (no new substance formed) from chemical changes (new substances formed) in everyday phenomena.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-chemical-physical-change",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách so sánh viên đá lạnh tan trong cốc với lớp gỉ nâu đỏ trên chiếc ổ khóa sắt cũ ngoài sân.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Dấu hiệu quan trọng nhất để phân biệt sự biến đổi hóa học với sự biến đổi vật lí là gì?",
        question_en:
          "What is the decisive difference between a chemical change and a physical change?",
        choices: [
          {
            id: "a",
            label_vi:
              "Biến đổi hóa học tạo thành chất mới; còn biến đổi vật lí chỉ đổi hình dạng, kích thước hoặc thể mà giữ nguyên chất cũ.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Biến đổi vật lí chỉ diễn ra âm thầm vào ban đêm khi trời mát, còn biến đổi hóa học chỉ xảy ra lúc có ánh nắng chiếu trực tiếp.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cứ vật nào từ thể rắn chuyển sang thể lỏng rồi chảy tràn ra đều chắc chắn là sự biến đổi hóa học tạo chất mới.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Cứ vật nào bị cắt gọt hoặc đập vỡ thành nhiều mảnh vụn nhỏ hơn ban đầu thì đều thuộc sự biến đổi hóa học.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy tự hỏi sau khi biến đổi xong, chất đó vẫn là chất cũ hay đã biến thành một chất hoàn toàn khác.",
        hint2_vi:
          "Nước đá tan ra thành nước lỏng thì chất đó vẫn là nước; còn tờ giấy đốt cháy thành tro đen thì không thể ghép tro lại thành giấy trắng được nữa.",
        hint3_vi:
          "Sự xuất hiện của chất mới khác hẳn tính chất ban đầu chính là ranh giới phân biệt biến đổi hóa học với biến đổi vật lí.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sự biến đổi vật lí chỉ làm thay đổi hình dạng, kích thước hoặc trạng thái (rắn, lỏng, khí) nhưng chất vẫn giữ nguyên. Sự biến đổi hóa học là sự biến đổi từ chất này thành chất khác (có chất mới tạo thành).",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm các hiện tượng nào dưới đây đều thuộc sự biến đổi vật lí?",
        question_en:
          "Which group of everyday phenomena consists entirely of physical changes?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đốt củi khô cháy thành than tro và nướng bánh mì cháy khét đen.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Sắt để ẩm lâu ngày bị gỉ nâu đỏ và sữa tươi để quên ngoài nắng bị chua hỏng.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Thắng đường trắng trên lửa tới khi sủi bọt chuyển màu cánh gián đắng nhẹ.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Cắt giấy thủ công thành ngôi sao, uốn cong dây đồng và nước đá tan thành nước.",
            correct: true,
          },
        ],
        hint1_vi:
          "Hãy kiểm tra từng nhóm xem ở nhóm nào các vật chỉ thay đổi hình dáng hoặc trạng thái chứ không sinh ra chất lạ nào mới.",
        hint2_vi:
          "Cháy thành tro, sắt bị gỉ, sữa lên men chua hay đường cháy thành màu cánh gián đều tạo ra chất mới.",
        hint3_vi:
          "Giấy cắt nhỏ vẫn là giấy, dây đồng uốn cong vẫn là đồng, nước đá tan ra vẫn là nước — cả ba đều là biến đổi vật lí.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cắt giấy chỉ đổi hình dạng, uốn dây đồng chỉ đổi dáng cong thẳng, nước đá tan chỉ chuyển từ thể rắn sang thể lỏng; không có chất mới nào sinh ra nên đều là biến đổi vật lí.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi cho một thìa đường kính trắng vào chảo khô đun nóng lâu trên bếp, lúc đầu đường chảy lỏng trong suốt, nhưng tiếp tục đun già lửa thì chuyển sang màu nâu sẫm (nước hàng cánh gián), tỏa mùi khét nhẹ và có vị đắng, không còn vị ngọt sắc ban đầu. Giai đoạn chuyển sang màu nâu đắng là sự biến đổi gì?",
        question_en:
          "Heating white sugar until it turns dark brown with a slightly bitter taste and burnt aroma represents what kind of change?",
        choices: [
          {
            id: "a",
            label_vi:
              "Biến đổi vật lí đơn thuần vì lớp nước hàng màu nâu đắng đó thực chất vẫn nguyên vẹn là đường trắng chỉ tạm đổi màu.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Biến đổi hóa học vì nhiệt cao đã làm đường biến thành chất mới khác hẳn màu, mùi và vị ban đầu.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Hiện tượng ngưng tụ hơi nước từ không khí xuống đáy chảo.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Phương pháp sàng tách đường ra khỏi chảo kim loại.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy so sánh màu sắc, mùi thơm và vị của chất màu nâu sẫm với hạt đường trắng ngọt ban đầu.",
        hint2_vi:
          "Khi để nguội lại, chất màu nâu đắng đó có tự quay trở về thành hạt đường trắng ngọt như cũ được không?",
        hint3_vi:
          "Đường đã bị phân hủy dưới nhiệt độ cao tạo thành các chất mới khác hẳn tính chất ban đầu, đó là sự biến đổi hóa học.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi đun quá nhiệt, đường trắng không chỉ nóng chảy mà đã biến đổi thành chất mới có màu nâu sẫm và vị đắng nhẹ (thường dùng kho cá tạo màu cánh gián). Đây là sự biến đổi hóa học.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một chiếc đinh sắt xám bóng có tính dẻo và bị nam châm hút mạnh; nhưng sau vài tháng nằm ngoài bãi đất ẩm mưa nắng, bề mặt đinh phủ lớp vảy màu nâu đỏ, giòn xốp dễ vỡ vụn. Lớp vảy nâu đỏ đó hình thành do quá trình nào?",
        question_en:
          "A shiny iron nail left outdoors in damp air develops a flaky reddish-brown crust. How is this crust formed?",
        choices: [
          {
            id: "a",
            label_vi:
              "Do lớp bụi đất đỏ ngoài vườn bám tạm bên ngoài mặt đinh, chỉ cần phủi nhẹ là lõi sắt lại sáng bóng nguyên vẹn.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Do sắt tự nóng chảy thành sắt lỏng rồi đông đặc lại ở nhiệt độ sân vườn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Do biến đổi hóa học: sắt tác dụng với các chất trong không khí ẩm tạo thành chất gỉ sắt nâu đỏ, giòn xốp.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Do sự biến đổi vật lí giống hệt như khi bẻ cong chiếc đinh sắt.",
            correct: false,
          },
        ],
        hint1_vi:
          "Sắt nguyên chất có màu trắng xám và cứng dẻo, còn lớp gỉ có màu nâu đỏ và bở vụn.",
        hint2_vi:
          "Tính chất của lớp gỉ nâu đỏ đã khác hẳn kim loại sắt ban đầu.",
        hint3_vi:
          "Trong không khí ẩm, sắt đã biến đổi hóa học tạo thành chất mới gọi là gỉ sắt, gây hư hỏng đồ dùng bằng sắt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Sắt để lâu trong không khí ẩm chịu tác động của khí ô-xi và hơi nước tạo thành chất mới là gỉ sắt (màu nâu đỏ, giòn xốp, không còn độ bền dẻo của sắt). Đây là biến đổi hóa học.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Từ hiểu biết về nguyên nhân làm sắt bị gỉ trong không khí ẩm, cách làm nào dưới đây giúp bảo vệ hàng rào sắt và xích xe đạp bền lâu nhất?",
        question_en:
          "Based on why iron rusts in moist air, which practice best protects iron fences and bicycle chains over time?",
        choices: [
          {
            id: "a",
            label_vi:
              "Sơn kín bề mặt cổng rào sắt, tra dầu mỡ vào xích xe và lau khô đồ sắt sau khi đi mưa.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Ngâm xích xe đạp trong chậu nước muối loãng mỗi tối cho sạch bụi.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cạo hết lớp sơn bảo vệ bên ngoài để thanh sắt phơi trực tiếp dưới sương đêm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Đắp khăn ướt quanh bản lề cửa sắt suốt mùa mưa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Sắt bị gỉ nhanh khi tiếp xúc trực tiếp với hơi nước và không khí bên ngoài, đặc biệt càng nhanh hơn nếu dính nước muối.",
        hint2_vi:
          "Muốn ngăn biến đổi hóa học tạo gỉ sắt, cần tạo một lớp màng chắn cách li mặt sắt với nước và không khí.",
        hint3_vi:
          "Lớp sơn chống gỉ trên cổng sắt hoặc lớp dầu mỡ trên xích xe cùng thói quen lau khô giúp ngăn sắt tiếp xúc ẩm, chống gỉ hiệu quả.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sơn phủ kín bề mặt hoặc bôi dầu mỡ tạo lớp màng ngăn không cho kim loại sắt tiếp xúc trực tiếp với nước và không khí ẩm, từ đó ngăn chặn sự biến đổi hóa học gây gỉ sét.",
    },
  ],
};
