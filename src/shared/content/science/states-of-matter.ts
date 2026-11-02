/**
 * Khoa học · Ba thể của chất và sự chuyển thể (skill: sci-states-of-matter, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const statesOfMatter: LessonDefinition = {
  id: "sci-states-of-matter",
  subjectId: "science",
  skillId: "sci-states-of-matter",
  titleVi: "Ba thể của chất và sự chuyển thể",
  titleEn: "Three States of Matter and Phase Changes",
  objectiveVi: "Em phân biệt được chất ở thể rắn, thể lỏng, thể khí và nhận biết hiện tượng nóng chảy, đông đặc trong đời sống.",
  objectiveEn: "Distinguish solid, liquid, and gas states of matter and identify melting and freezing in everyday life.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-sci-states-of-matter",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách phân loại 3 vật dụng trong bếp theo thể rắn, lỏng, khí.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vật nào dưới đây ở thể rắn và luôn giữ nguyên hình dạng xác định khi đặt trên mặt bàn?",
        question_en: "Which object below is a solid and keeps its definite shape when placed on a table?",
        choices: [
          { id: "a", label_vi: "Viên gạch xây nhà hoặc chiếc thước gỗ.", correct: true },
          { id: "b", label_vi: "Nước cam chảy tràn ra đĩa.", correct: false },
          { id: "c", label_vi: "Hơi nước bốc lên từ ấm trà nóng.", correct: false },
          { id: "d", label_vi: "Không khí chứa bên trong quả bóng bay.", correct: false },
        ],
        hint1_vi: "Chất ở thể rắn không tự chảy tràn như nước và không bay tản ra khắp phòng như không khí.",
        hint2_vi: "Khi em cầm một vật rắn đặt từ hộp sang mặt bàn, hình dạng của nó có thay đổi theo vật chứa không?",
        hint3_vi: "Viên gạch và chiếc thước gỗ có hình dạng xác định nên chúng ở thể rắn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chất ở thể rắn (như viên gạch, chiếc thước gỗ, viên đá lạnh) có hình dạng xác định và không tự thay đổi hình dạng theo bình chứa.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi rót cùng một lượng nước lọc từ cốc hình trụ sang bát tròn, đặc điểm nào của nước thay đổi?",
        question_en: "When pouring the same amount of water from a cylindrical cup into a round bowl, what changes?",
        choices: [
          { id: "a", label_vi: "Nước biến thành chất rắn cứng ngắc.", correct: false },
          { id: "b", label_vi: "Nước thay đổi hình dạng theo hình dạng của phần vật chứa nó.", correct: true },
          { id: "c", label_vi: "Nước tự động biến mất hoàn toàn ngay lập tức.", correct: false },
          { id: "d", label_vi: "Nước vẫn giữ nguyên hình khối trụ cao ở giữa bát.", correct: false },
        ],
        hint1_vi: "Nước lọc ở nhiệt độ phòng là chất ở thể lỏng.",
        hint2_vi: "Chất lỏng có hình dạng cố định riêng hay phụ thuộc vào cốc, bát đựng nó?",
        hint3_vi: "Chất ở thể lỏng không có hình dạng xác định mà có hình dạng của phần vật chứa nó.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Chất ở thể lỏng (như nước lọc, sữa, dầu ăn) không có hình dạng cố định riêng mà luôn chiếm hình dạng của phần vật chứa nó.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để một viên nước đá ngoài không khí ấm, một lúc sau viên đá tan hết thành nước lỏng. Hiện tượng chuyển từ thể rắn sang thể lỏng đó gọi là gì?",
        question_en: "An ice cube left in warm air melts into liquid water. What is this transition from solid to liquid called?",
        choices: [
          { id: "a", label_vi: "Sự nóng chảy.", correct: true },
          { id: "b", label_vi: "Sự đông đặc.", correct: false },
          { id: "c", label_vi: "Sự ngưng tụ.", correct: false },
          { id: "d", label_vi: "Sự quang hợp.", correct: false },
        ],
        hint1_vi: "Viên nước đá ban đầu ở thể rắn, sau đó chuyển thành nước ở thể lỏng.",
        hint2_vi: "Hãy phân biệt chiều chuyển thể: từ rắn sang lỏng khác với từ lỏng sang rắn.",
        hint3_vi: "Quá trình một chất chuyển từ thể rắn sang thể lỏng khi gặp nhiệt độ cao hơn gọi là sự nóng chảy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi viên đá (thể rắn) nhận nhiệt từ không khí xung quanh và tan thành nước (thể lỏng), hiện tượng chuyển từ thể rắn sang thể lỏng đó được gọi là sự nóng chảy.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Mẹ đặt khay nước lọc vào ngăn đá tủ lạnh. Sau vài giờ, nước lỏng biến thành những viên đá cứng. Đây là hiện tượng gì?",
        question_en: "Liquid water placed in a freezer turns into solid ice cubes after a few hours. What phenomenon is this?",
        choices: [
          { id: "a", label_vi: "Sự bay hơi (từ lỏng sang khí).", correct: false },
          { id: "b", label_vi: "Sự đông đặc (từ thể lỏng chuyển sang thể rắn khi gặp lạnh).", correct: true },
          { id: "c", label_vi: "Sự nóng chảy (từ rắn sang lỏng).", correct: false },
          { id: "d", label_vi: "Sự ngưng tụ (từ khí sang lỏng).", correct: false },
        ],
        hint1_vi: "Ban đầu trong khay là nước ở thể lỏng, sau khi làm lạnh thì chuyển sang thể rắn.",
        hint2_vi: "Hiện tượng này ngược chiều hoàn toàn với sự nóng chảy của viên đá.",
        hint3_vi: "Chất ở thể lỏng chuyển sang thể rắn khi hạ nhiệt độ xuống thấp gọi là sự đông đặc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi nhiệt độ giảm xuống đủ thấp trong ngăn đá, nước chuyển từ thể lỏng sang thể rắn (nước đá). Hiện tượng đó gọi là sự đông đặc.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi thắp một cây nến sáp, phần sáp gần ngọn lửa mềm ra thành chất lỏng chảy xuống thân nến rồi nguội đi lại cứng như cũ. Hai hiện tượng nào đã nối tiếp nhau xảy ra?",
        question_en: "When a wax candle burns, wax near the flame melts into liquid, trickles down, and hardens again as it cools. Which two phenomena occurred in sequence?",
        choices: [
          { id: "a", label_vi: "Nóng chảy (sáp rắn thành lỏng khi gặp nóng) rồi đông đặc (sáp lỏng thành rắn khi nguội đi).", correct: true },
          { id: "b", label_vi: "Đông đặc trước rồi mới bay hơi hoàn toàn thành đá.", correct: false },
          { id: "c", label_vi: "Ngưng tụ trước rồi mới quang hợp.", correct: false },
          { id: "d", label_vi: "Chỉ có sự bay hơi mà không có chất rắn hay chất lỏng nào.", correct: false },
        ],
        hint1_vi: "Theo dõi trạng thái của sáp nến qua hai giai đoạn: lúc ở sát ngọn lửa nóng và lúc chảy xuống chỗ nguội.",
        hint2_vi: "Giai đoạn 1: sáp rắn gặp nóng biến thành sáp lỏng. Giai đoạn 2: sáp lỏng gặp nguội biến lại thành sáp rắn.",
        hint3_vi: "Từ rắn sang lỏng là sự nóng chảy; tiếp theo từ lỏng về lại rắn là sự đông đặc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sáp nến ở gần ngọn lửa nóng chuyển từ thể rắn sang thể lỏng (nóng chảy). Khi chảy xuống phần thân nến mát hơn, sáp lỏng nguội đi và chuyển ngược lại sang thể rắn (đông đặc).",
    },
  ],
};
