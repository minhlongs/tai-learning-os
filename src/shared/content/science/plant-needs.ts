/**
 * Khoa học · Nhu cầu sống của thực vật (skill: sci-plant-needs, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const plantNeeds: LessonDefinition = {
  id: "sci-plant-needs",
  subjectId: "science",
  skillId: "sci-plant-needs",
  titleVi: "Các yếu tố cần cho sự sống và phát triển của thực vật",
  titleEn: "What Plants Need to Live and Grow",
  objectiveVi: "Em xác định được các yếu tố thiết yếu giúp cây xanh sống, quang hợp và phát triển khỏe mạnh.",
  objectiveEn: "Identify the essential factors that plants need to live, photosynthesize, and grow.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-sci-plant-needs",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách quan sát chậu cây ở ban công hoặc góc học tập.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để sống và phát triển bình thường, cây xanh cần đồng thời những điều kiện bên ngoài nào dưới đây?",
        question_en: "Which external conditions do green plants need together to live and grow normally?",
        choices: [
          { id: "a", label_vi: "Chỉ cần tưới nước mỗi ngày, không cần nắng hay khí trời.", correct: false },
          { id: "b", label_vi: "Chỉ cần đất khô ráo và đặt cây trong bóng tối hoàn toàn.", correct: false },
          { id: "c", label_vi: "Ánh sáng, không khí, nước, chất khoáng và nhiệt độ thích hợp.", correct: true },
          { id: "d", label_vi: "Chỉ cần bón nhiều phân mà không cần tưới nước cho rễ.", correct: false },
        ],
        hint1_vi: "Cây xanh là sinh vật sống nên cần cả thức ăn, nước uống, hơi thở và môi trường phù hợp.",
        hint2_vi: "Hãy nghĩ xem lá cây đón gì từ mặt trời, và rễ cây hút gì từ đất.",
        hint3_vi: "Cây xanh chỉ khỏe mạnh khi có đủ cả năm điều kiện từ nắng, khí trời, độ ẩm, dưỡng chất trong đất đến mức nhiệt vừa phải.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thực vật cần đủ ánh sáng, không khí, nước, chất khoáng trong đất và nhiệt độ thích hợp. Nếu thiếu một trong các yếu tố này trong thời gian dài, cây sẽ còi cọc hoặc chết.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hai chậu đậu xanh giống nhau được tưới đủ nước mỗi ngày. Chậu A đặt ngoài bệ cửa sổ có nắng, chậu B úp kín trong thùng giấy tối suốt 10 ngày. Điều gì sẽ xảy ra với chậu B?",
        question_en: "Two identical bean pots are watered daily. Pot A is by a sunny window, Pot B is inside a dark box for 10 days. What happens to Pot B?",
        choices: [
          { id: "a", label_vi: "Thân cây vươn dài yếu ớt, lá nhạt màu hoặc vàng úa vì thiếu nắng.", correct: true },
          { id: "b", label_vi: "Lá cây chuyển màu xanh đậm hơn và thân cứng cáp hơn hẳn cây đặt ngoài nắng.", correct: false },
          { id: "c", label_vi: "Cây lập tức trổ nhiều hoa tươi và đậu quả to nhờ giữ ấm trong thùng giấy kín.", correct: false },
          { id: "d", label_vi: "Lá cây rụng hết và tự biến đổi thành gai nhọn như xương rồng.", correct: false },
        ],
        hint1_vi: "Cả hai chậu đều có nước, điểm khác nhau duy nhất là ánh sáng.",
        hint2_vi: "Lá cây cần ánh sáng mặt trời để chế tạo chất dinh dưỡng và giữ màu xanh.",
        hint3_vi: "Thiếu ánh sáng lâu ngày làm lá cây mất màu xanh, thân mềm yếu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nhờ ánh sáng mặt trời, lá cây mới quang hợp để tự tổng hợp chất dinh dưỡng và giữ sắc tố xanh. Khi bị nhốt trong bóng tối lâu ngày, cây ở chậu B sẽ nhạt màu, vàng úa và thân vươn dài yếu ớt.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao khi trồng cây trong chậu, dưới đáy chậu thường có lỗ thoát nước nhỏ và đất được xới tơi xốp?",
        question_en: "Why do plant pots have drainage holes and loose soil?",
        choices: [
          { id: "a", label_vi: "Để toàn bộ nước tưới chảy ra ngoài ngay lập tức giúp rễ cây luôn khô cứng hoàn toàn.", correct: false },
          { id: "b", label_vi: "Để ánh nắng mặt trời chiếu ngược từ dưới đáy chậu lên nuôi rễ.", correct: false },
          { id: "c", label_vi: "Để cát sỏi trong chậu tự biến đổi thành phân bón cho cây xanh.", correct: false },
          { id: "d", label_vi: "Để rễ cây không ngập úng và có không khí trong khe đất giúp rễ hô hấp.", correct: true },
        ],
        hint1_vi: "Rễ cây dưới đất cũng là bộ phận sống và cần thở (hô hấp) như lá và thân.",
        hint2_vi: "Nếu nước đọng ngập kín mọi khe hở trong đất, không khí có còn chỗ trong đất không?",
        hint3_vi: "Đất tơi xốp và lỗ thoát nước giúp nước thừa thoát đi, giữ lại độ ẩm vừa đủ và không khí cho rễ cây hô hấp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Rễ cây không chỉ hút nước và chất khoáng mà còn cần ô-xi trong các khe đất để hô hấp. Nếu chậu ngập nước lâu ngày không thoát được, đất mất hết không khí làm rễ bị thối và cây chết úng.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong quá trình quang hợp dưới ánh sáng mặt trời, lá cây lấy khí gì từ không khí và nhả ra khí gì?",
        question_en: "During photosynthesis in sunlight, what gas do plant leaves take in and what gas do they release?",
        choices: [
          { id: "a", label_vi: "Lấy khí ô-xi từ không khí xung quanh và nhả khói bụi ra ngoài.", correct: false },
          { id: "b", label_vi: "Lấy khí các-bô-níc và nhả ra khí ô-xi.", correct: true },
          { id: "c", label_vi: "Chỉ hút hơi nước trong gió và không nhả bất kỳ khí nào ra ngoài.", correct: false },
          { id: "d", label_vi: "Lấy chất khoáng bay lơ lửng trong không khí rồi nhả xuống đất.", correct: false },
        ],
        hint1_vi: "Nhờ có nhiều cây xanh mà bầu không khí quanh ta trở nên trong lành, giàu dưỡng khí cho con người thở.",
        hint2_vi: "Dưỡng khí cần cho sự thở của con người và động vật là khí ô-xi.",
        hint3_vi: "Khi quang hợp dưới ánh nắng, cây hấp thụ khí các-bô-níc và giải phóng khí ô-xi ra môi trường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Dưới ánh sáng mặt trời, lá cây thực hiện quá trình quang hợp: lấy khí các-bô-níc từ không khí cùng với nước để tổng hợp chất dinh dưỡng nuôi cây, đồng thời nhả khí ô-xi ra môi trường.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Minh trồng một cây rau cải vào chậu cát trắng đã rửa sạch hết bùn đất, đặt nơi có nắng thoáng và tưới nước lọc đều đặn. Sau vài tuần, cây lớn rất chậm và lá còi cọc dù đủ nắng và nước. Nguyên nhân chính là gì?",
        question_en: "Minh plants a mustard green in washed pure sand with plenty of sun and pure water, yet after weeks the plant is stunted. What is the main reason?",
        choices: [
          { id: "a", label_vi: "Cát trắng giữ lại quá nhiều muối khoáng đậm đặc làm rễ cây rau cải bị xót và ngừng hút nước lọc.", correct: false },
          { id: "b", label_vi: "Nước lọc tinh khiết không thể bay hơi khi đặt chậu cây ngoài nắng.", correct: false },
          { id: "c", label_vi: "Cát trắng đã rửa sạch hầu như không có chất khoáng cần cho cây phát triển.", correct: true },
          { id: "d", label_vi: "Không khí ngoài sân nắng không có khí các-bô-níc để lá quang hợp.", correct: false },
        ],
        hint1_vi: "Hãy kiểm tra từng yếu tố trong 5 nhu cầu của thực vật: ánh sáng, không khí, nước, nhiệt độ và chất khoáng.",
        hint2_vi: "Cây đã có nắng (ánh sáng), chỗ thoáng (không khí) và được tưới nước lọc đều đặn.",
        hint3_vi: "Cát trắng rửa sạch khác với đất trồng màu mỡ ở điểm nào mà rễ cây cần hút?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Ngoài ánh sáng, không khí và nước, cây còn cần các chất khoáng hòa tan trong đất để cấu tạo nên tế bào và phát triển. Cát trắng đã rửa sạch và nước lọc tinh khiết hầu như không chứa chất khoáng nên cây bị còi cọc.",
    },
  ],
};
