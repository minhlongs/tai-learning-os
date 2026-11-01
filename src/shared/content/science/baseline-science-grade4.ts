/**
 * Khoa học · Khảo sát năng lực đầu vào Khoa học Lớp 4 (skill: sci-water-cycle, lớp 4)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering foundational Grade 4 science observations.
 */
import type { LessonDefinition } from "../types";

export const baselineScienceGrade4: LessonDefinition = {
  id: "sci-baseline-grade4",
  subjectId: "science",
  skillId: "sci-water-cycle",
  titleVi: "Khảo sát đầu vào Khoa học Lớp 4",
  titleEn: "Science Grade 4 Baseline Diagnostic",
  objectiveVi: "Khảo sát nhẹ nhàng khả năng quan sát sự chuyển thể của nước và nhu cầu sống cơ bản của thực vật.",
  objectiveEn: "Gentle baseline check of water state changes and basic plant life requirements.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-water-cycle",
  provenance: "original_supplemental",
  sourceRef: "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Khảo sát đầu vào để phụ huynh nắm mức độ quan sát tự nhiên ban đầu của bé, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ở điều kiện bình thường, nước uống hằng ngày của chúng ta tồn tại ở thể nào?",
        question_en: "Under normal conditions, in what state does our everyday drinking water exist?",
        choices: [
          { id: "a", label_vi: "Thể lỏng (chảy được, không có hình dạng cố định).", correct: true },
          { id: "b", label_vi: "Thể rắn cứng như viên gạch.", correct: false },
          { id: "c", label_vi: "Thể khí bay lơ lửng không nhìn thấy.", correct: false },
          { id: "d", label_vi: "Vừa cứng vừa không chạm vào được.", correct: false },
        ],
        hint1_vi: "Hãy nhớ lại khi em rót nước từ bình sang cốc, nước chuyển động như thế nào.",
        hint2_vi: "Nước uống có thể chảy tràn và lấy theo hình dạng của chiếc cốc đựng nó.",
        hint3_vi: "Chất chảy được và không có hình dạng riêng cố định ở nhiệt độ phòng là thể lỏng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nước uống ở nhiệt độ phòng tồn tại ở thể lỏng: có thể chảy và có hình dạng của vật chứa nó.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi đặt khay nước vào ngăn đá tủ lạnh vài giờ, hiện tượng gì sẽ xảy ra?",
        question_en: "When a tray of water is placed in the freezer for several hours, what happens?",
        choices: [
          { id: "a", label_vi: "Nước lỏng đông đặc lại thành nước đá (thể rắn).", correct: true },
          { id: "b", label_vi: "Nước sôi lên và bốc khói nóng.", correct: false },
          { id: "c", label_vi: "Nước biến thành dầu ăn.", correct: false },
          { id: "d", label_vi: "Khay nước tự nóng lên.", correct: false },
        ],
        hint1_vi: "Ngăn đá tủ lạnh có nhiệt độ rất thấp (lạnh).",
        hint2_vi: "Khi gặp lạnh sâu, nước lỏng không còn chảy được nữa mà cứng lại.",
        hint3_vi: "Nước chuyển từ thể lỏng sang thể rắn (nước đá) gọi là sự đông đặc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi gặp nhiệt độ rất thấp trong ngăn đá, nước ở thể lỏng chuyển sang thể rắn (nước đá). Đó là hiện tượng đông đặc.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi phơi chiếc khăn ướt ngoài sân có nắng ấm và gió nhẹ, chiếc khăn khô dần vì sao?",
        question_en: "When a wet towel is hung outside in warm sun and gentle wind, why does it dry?",
        choices: [
          { id: "a", label_vi: "Nước trong khăn đã bay hơi thành hơi nước vào không khí.", correct: true },
          { id: "b", label_vi: "Sợi vải đã ăn hết nước.", correct: false },
          { id: "c", label_vi: "Nước trong khăn biến thành đá.", correct: false },
          { id: "d", label_vi: "Ánh nắng đổi màu chiếc khăn.", correct: false },
        ],
        hint1_vi: "Nước trong chiếc khăn ướt không tự mất đi mà chuyển sang một thể khác.",
        hint2_vi: "Dưới ánh nắng và gió, nước lỏng biến thành thể khí không nhìn thấy bằng mắt thường.",
        hint3_vi: "Hiện tượng nước lỏng chuyển thành hơi nước bay vào không khí gọi là sự bay hơi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nhờ nắng ấm và gió, nước thấm trong khăn chuyển từ thể lỏng sang thể khí (hơi nước) và bay vào không khí nên khăn khô dần.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hơi nước từ sông, biển bay lên cao gặp không khí lạnh trên bầu trời sẽ chuyển thành gì?",
        question_en: "When water vapor from rivers and seas rises high and meets cold air in the sky, what does it form?",
        choices: [
          { id: "a", label_vi: "Ngưng tụ thành những hạt nước nhỏ li ti tạo nên các đám mây.", correct: true },
          { id: "b", label_vi: "Biến thành khói bụi khô.", correct: false },
          { id: "c", label_vi: "Chảy ngược từ trên trời thành dòng sông lơ lửng.", correct: false },
          { id: "d", label_vi: "Biến mất hoàn toàn khỏi Trái Đất.", correct: false },
        ],
        hint1_vi: "Càng lên cao, nhiệt độ không khí càng lạnh đi.",
        hint2_vi: "Khi hơi nước gặp lạnh, nó chuyển ngược lại từ thể khí sang các giọt nước lỏng rất nhỏ.",
        hint3_vi: "Các hạt nước nhỏ li ti ngưng tụ lại trên cao hợp thành những đám mây.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hơi nước bay lên cao gặp lạnh sẽ ngưng tụ thành vô số hạt nước nhỏ li ti tạo thành mây, sau đó lớn dần và rơi xuống thành mưa.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vào buổi sáng sớm se lạnh, trên lá cỏ trong vườn thường đọng những giọt sương tròn trong suốt dù đêm qua trời không mưa. Những giọt sương đó hình thành như thế nào?",
        question_en: "On a cool early morning, clear dewdrops appear on grass blades even though it didn't rain. How did they form?",
        choices: [
          { id: "a", label_vi: "Hơi nước trong không khí ban đêm gặp mặt lá cỏ lạnh nên ngưng tụ thành giọt sương.", correct: true },
          { id: "b", label_vi: "Rễ cây phun nước từ dưới đất lên mặt ngoài của lá.", correct: false },
          { id: "c", label_vi: "Ánh trăng biến thành nước lỏng trên lá.", correct: false },
          { id: "d", label_vi: "Gió mang nước biển đổ trực tiếp lên từng chiếc lá.", correct: false },
        ],
        hint1_vi: "Trong không khí quanh vườn luôn có sẵn hơi nước.",
        hint2_vi: "Ban đêm và sáng sớm, bề mặt lá cỏ hạ nhiệt độ và trở nên lạnh.",
        hint3_vi: "Hơi nước trong không khí chạm vào mặt lá lạnh thì ngưng tụ lại thành những giọt sương nhỏ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Ban đêm nhiệt độ giảm làm bề mặt lá cỏ lạnh đi. Hơi nước có sẵn trong không khí chạm vào mặt lá lạnh sẽ ngưng tụ thành những giọt sương đọng trên lá.",
    },
  ],
};
