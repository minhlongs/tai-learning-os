/**
 * Khoa học · Tính chất của không khí và sự hình thành gió (skill: sci-air-properties, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const airProperties: LessonDefinition = {
  id: "sci-air-properties",
  subjectId: "science",
  skillId: "sci-air-properties",
  titleVi: "Tính chất của không khí và sự hình thành gió",
  titleEn: "Properties of Air and How Wind Forms",
  objectiveVi:
    "Em nhận biết được các tính chất cơ bản của không khí (chiếm chỗ, không màu không mùi, chịu nén và giãn ra) và giải thích sự hình thành gió trong tự nhiên.",
  objectiveEn:
    "Identify key properties of air (occupying space, colorless, odorless, compressible and expandable) and explain how wind forms.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-air-properties",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách quan sát chiếc chong chóng quay trước hiên nhà hoặc cảm nhận luồng gió mát khi mở cửa sổ.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Không khí sạch bao quanh chúng ta có những tính chất cơ bản nào dưới đây?",
        question_en:
          "Which of the following describes the basic properties of clean air around us?",
        choices: [
          {
            id: "a",
            label_vi:
              "Có màu trắng đục rõ rệt, mùi thơm nhẹ và luôn đóng thành hình khối vuông vức.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Trong suốt nhưng cứng đặc và luôn giữ nguyên một hình dạng cố định trong mọi bình chứa.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Trong suốt, không màu, không mùi, không vị và không có hình dạng nhất định.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Có vị mặn nhẹ, màu xanh nhạt và chảy thành dòng nặng trịch như nước dưới khe suối.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy hít thở nhẹ trong phòng thoáng sạch và nhìn xuyên qua khoảng không trước mặt.",
        hint2_vi:
          "Khi thổi không khí vào quả bóng tròn hoặc quả bóng dài, không khí mang hình dạng của vật chứa nó.",
        hint3_vi:
          "Không khí tinh khiết hoàn toàn trong suốt, không màu, không mùi, không vị và không có hình dạng cố định.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Không khí sạch trong suốt, không màu, không mùi, không vị và không có hình dạng nhất định mà chiếm toàn bộ khoảng trống của vật chứa nó.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bạn gắn chặt mẩu giấy ăn khô vào đáy bên trong chiếc cốc thủy tinh rỗng, rồi úp thẳng đứng miệng cốc chìm hẳn xuống chậu nước. Khi nhấc thẳng cốc lên, mẩu giấy vẫn khô ráo. Thí nghiệm này chứng tỏ điều gì?",
        question_en:
          "A dry tissue stuck inside the bottom of an inverted glass stays dry when pushed straight underwater. What does this show?",
        choices: [
          {
            id: "a",
            label_vi:
              "Không khí chiếm chỗ trong lòng cốc nên ngăn nước tràn lên chạm tới giấy.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Thủy tinh đã hút cạn toàn bộ nước xung quanh miệng cốc.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mẩu giấy ăn tự động biến đổi thành tấm nhựa cứng chống thấm ngay khi chìm xuống chậu.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nước trong chậu chỉ có thể chảy ngang sang hai bên chứ không bao giờ dâng ngược lên.",
            correct: false,
          },
        ],
        hint1_vi:
          "Chiếc cốc nhìn tưởng như trống rỗng nhưng thật ra bên trong đang chứa đầy thứ gì?",
        hint2_vi:
          "Khi úp thẳng đứng miệng cốc xuống nước, lượng khí trong cốc không có lối thoát ra ngoài.",
        hint3_vi:
          "Vì không khí chiếm chỗ bên trong lòng cốc nên ngăn không cho nước dâng lên làm ướt mẩu giấy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chiếc cốc rỗng thực chất chứa đầy không khí. Khi úp thẳng cốc xuống chậu nước, không khí chiếm chỗ trong lòng cốc nên nước không thể tràn vào làm ướt giấy.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi kéo pít-tông của ống bơm tiêm nhựa (không gắn kim) để lấy đầy không khí, bịt kín đầu ống rồi ấn mạnh pít-tông xuống và buông tay ra, pít-tông tự đẩy ngược trở lại. Hiện tượng đó cho thấy không khí có tính chất gì?",
        question_en:
          "When you seal a syringe filled with air, push the plunger in, and release it, the plunger springs back. What property of air does this show?",
        choices: [
          {
            id: "a",
            label_vi: "Không khí tự đông đặc thành khối rắn khi bị ép nhẹ.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Không khí xuyên qua thành nhựa ra ngoài rồi tự chui ngược vào.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Không khí biến mất khi ấn xuống và tự sinh ra mới khi buông tay.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Không khí có thể bị nén lại và có tính đàn hồi giãn ra.",
            correct: true,
          },
        ],
        hint1_vi:
          "Lượng không khí bị nhốt kín trong ống tiêm không thoát đi đâu khi em ấn pít-tông xuống.",
        hint2_vi:
          "Khoảng không trong ống thu hẹp lại nghĩa là không khí đã bị ép gọn hơn.",
        hint3_vi:
          "Khi buông tay, phần không khí bị ép sẽ bung rộng trở lại, chứng tỏ không khí có thể bị nén lại và giãn ra.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Ấn được pít-tông xuống chứng tỏ không khí có thể bị nén lại; khi buông tay pít-tông bật ngược ra chứng tỏ không khí bị nén có tính giãn ra (đàn hồi). Tính chất này được ứng dụng để bơm lốp xe và quả bóng.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong tự nhiên, gió được hình thành do sự chuyển động của không khí theo chiều nào?",
        question_en:
          "In nature, wind is formed by air moving in which direction?",
        choices: [
          {
            id: "a",
            label_vi:
              "Không khí luôn thổi trực tiếp từ vùng đang nắng nóng gay gắt sang vùng lạnh giá hơn.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Không khí nóng bốc lên cao, không khí từ nơi lạnh hơn tràn tới thế chỗ tạo thành gió.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Không khí luôn đứng yên tại chỗ, còn gió là do cành lá cây cối tự đung đưa quạt ra.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ những nơi có nhiệt độ hoàn toàn bằng nhau mới sinh ra gió mạnh.",
            correct: false,
          },
        ],
        hint1_vi:
          "Khi không khí bị Mặt Trời đốt nóng, nó nhẹ đi và bay lên cao hay chìm xuống thấp?",
        hint2_vi:
          "Khi lớp không khí nóng ở sát mặt đất bốc lên cao, vùng bên dưới sẽ thiếu hụt không khí.",
        hint3_vi:
          "Không khí mát và nặng hơn từ vùng lạnh xung quanh sẽ tràn tới lấp chỗ trống, tạo nên luồng gió thổi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Ở nơi nhận được nhiều nhiệt, không khí nóng lên, nhẹ đi và bốc lên cao. Không khí ở vùng lạnh hơn xung quanh chuyển động tràn tới thế chỗ, tạo thành luồng gió.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vào buổi trưa nắng ở vùng ven biển, bãi cát và mặt đất trên bờ nóng lên nhanh hơn mặt nước biển rất nhiều. Khi đó, gió biển thường thổi theo hướng nào và vì sao?",
        question_en:
          "On a sunny afternoon at the coast, the sandy land heats up much faster than the sea. Which way does the sea breeze blow and why?",
        choices: [
          {
            id: "a",
            label_vi:
              "Thổi từ đất liền ra ngoài khơi vì cát nóng đẩy hết gió ra biển.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Hoàn toàn lặng gió suốt buổi trưa vì cả mặt biển lẫn bãi cát đều nhận chung ánh nắng Mặt Trời.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Thổi từ biển vào bờ vì không khí trên cát nóng bốc lên, khí mát ngoài biển tràn vào.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Thổi thẳng đứng từ đám mây cao dội xuống mặt cát vì nước biển ngừng bay hơi vào buổi trưa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy so sánh nơi nào đang nóng hơn và nơi nào đang mát hơn vào buổi trưa nắng ở bãi biển.",
        hint2_vi:
          "Mặt đất và bãi cát nóng hơn nên lớp không khí phía trên bờ sẽ bốc lên cao.",
        hint3_vi:
          "Theo quy luật chuyển động từ nơi lạnh sang nơi nóng, không khí mát trên mặt biển sẽ thổi vào đất liền.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Ban ngày đất liền nóng nhanh hơn mặt biển nên không khí trên bờ nóng lên và bốc cao; lớp không khí mát hơn từ ngoài mặt biển chuyển động tràn vào bờ thế chỗ, tạo thành làn gió biển mát rượi.",
    },
  ],
};
