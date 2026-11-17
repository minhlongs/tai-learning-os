/**
 * Khoa học · Sự phát ra, lan truyền âm thanh và chống tiếng ồn (skill: sci-sound-waves, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const soundWaves: LessonDefinition = {
  id: "sci-sound-waves",
  subjectId: "science",
  skillId: "sci-sound-waves",
  titleVi: "Âm thanh, sự lan truyền âm và chống tiếng ồn",
  titleEn: "Sound Production, Propagation, and Noise Reduction",
  objectiveVi:
    "Em giải thích được âm thanh phát ra do vật rung động, nêu được sự truyền âm qua chất khí, chất lỏng, chất rắn và biết cách giảm tiếng ồn trong sinh hoạt.",
  objectiveEn:
    "Explain that vibrating objects produce sound, describe sound propagation through gases, liquids, and solids, and practice noise reduction.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-sound-waves",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đặt nhẹ ngón tay lên cổ họng khi nói để cảm nhận dây thanh quản rung động.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Rắc vài vụn giấy nhỏ lên mặt trống rồi gõ dùi trống vào, ta nghe tiếng trống vang lên đồng thời thấy vụn giấy nảy lăn tăn. Điều này chứng tỏ các vật phát ra âm thanh khi nào?",
        question_en:
          "Paper bits bounce on a drumhead when struck and sound is heard. What causes objects to produce sound?",
        choices: [
          {
            id: "a",
            label_vi: "Khi vật được chiếu ánh sáng thật mạnh vào bề mặt.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Khi vật rung động.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Khi vật đứng yên hoàn toàn và tăng nhiệt độ.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Khi vật được sơn màu sáng bóng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Vì sao những vụn giấy đặt trên mặt trống lại nảy lên khi tiếng trống vang ra?",
        hint2_vi:
          "Khi em đặt nhẹ ngón tay lên cổ họng lúc đang ngân nga một tiếng, ngón tay cảm nhận thấy chuyển động gì?",
        hint3_vi:
          "Mặt trống hay dây đàn phát ra tiếng kêu đều đang dao động qua lại rất nhanh, gọi là sự rung động.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Mọi âm thanh đều phát ra từ những vật đang rung động: mặt trống rung khi bị gõ, dây đàn rung khi được gảy, và dây thanh quản ở cổ họng rung khi chúng ta nói.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em nghe được tiếng cô giáo giảng bài trong lớp, áp tai xuống mặt bàn gỗ nghe rõ tiếng bạn gõ nhẹ đầu bàn bên kia, và đàn cá dưới ao bơi tản ra khi nghe tiếng vỗ tay trên bờ. Các hiện tượng đó cho biết âm thanh truyền qua được những môi trường nào?",
        question_en:
          "Hearing a teacher in class, tapping through a wooden desk, and fish reacting underwater show that sound travels through which media?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ truyền qua không khí chứ không truyền qua nước và gỗ.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chỉ truyền qua các vật rắn cứng như gỗ và sắt thép.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chỉ truyền qua chất lỏng trong suốt như nước ao hồ.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Truyền qua được cả chất khí, chất lỏng và chất rắn.",
            correct: true,
          },
        ],
        hint1_vi:
          "Giữa miệng cô giáo và tai em trong phòng học là môi trường chất gì?",
        hint2_vi:
          "Mặt bàn gỗ thuộc chất rắn, còn nước trong ao nuôi cá thuộc chất lỏng.",
        hint3_vi:
          "Cả ba trường hợp đều nghe thấy tiếng động, chứng tỏ âm thanh lan truyền được qua chất khí, chất lỏng và chất rắn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Âm thanh không chỉ lan truyền qua không khí (chất khí) mà còn truyền được qua chất lỏng (như nước ao) và chất rắn (như mặt bàn gỗ, tường gạch).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi bác bảo vệ đánh trống trường, bạn đứng ngay gần sân trống nghe tiếng rất to, còn bạn đứng ở cuối dãy lớp xa sân hơn lại nghe tiếng trống nhỏ hơn. Vì sao?",
        question_en:
          "Why does the school drum sound louder near the courtyard and softer at the far end of the building?",
        choices: [
          {
            id: "a",
            label_vi:
              "Khi lan truyền càng ra xa nguồn phát âm, độ mạnh của âm thanh càng giảm dần.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Tiếng trống tự đổi sang một bài nhạc khác khi bay qua sân trường.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Khi truyền càng xa nguồn phát âm thì tiếng trống càng mạnh lên và vang dội gấp nhiều lần.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Lớp không khí ở cuối dãy lớp học đặc quánh lại nên chặn đứng không cho âm thanh đi qua.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy nhớ lại khi một chiếc xe cấp cứu chạy xa dần, tiếng còi nghe to lên hay nhỏ đi.",
        hint2_vi:
          "Rung động âm thanh tỏa rộng ra xung quanh nên năng lượng phân tán dần theo khoảng cách.",
        hint3_vi:
          "Khoảng cách tới nguồn âm càng xa thì âm thanh truyền tới tai càng yếu đi, nên nghe nhỏ hơn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi âm thanh lan truyền từ nguồn phát ra xung quanh, càng đi xa nguồn âm thì âm thanh càng yếu đi nên tai ta nghe nhỏ dần.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Tiếng ồn lớn kéo dài làm mất tập trung học tập, khó ngủ và có hại cho tai. Việc làm nào dưới đây giúp giảm tiếng ồn văn minh và hiệu quả trong sinh hoạt?",
        question_en:
          "Prolonged loud noise harms hearing and focus. Which action effectively reduces noise in daily life?",
        choices: [
          {
            id: "a",
            label_vi: "Bật loa tivi thật lớn để át đi tiếng xe cộ ngoài đường.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Bấm còi xe inh ỏi liên tục mỗi khi đi ngang qua cổng bệnh viện, thư viện và trường học.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Trồng cây xanh quanh sân, đóng cửa kính hoặc treo rèm dày và giữ trật tự giờ nghỉ.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Cầm thước gỗ gõ mạnh liên hồi xuống mặt bàn học mỗi khi muốn gọi các bạn ngồi xung quanh.",
            correct: false,
          },
        ],
        hint1_vi:
          "Mở thêm âm thanh thật to chỉ làm tổng tiếng ồn trong phòng tăng lên và càng hại thính giác.",
        hint2_vi:
          "Tán lá cây xanh, cửa kính kín và rèm vải dày có khả năng cản bớt và phân tán âm thanh từ ngoài đường.",
        hint3_vi:
          "Kết hợp giữ yên lặng giờ nghỉ ngơi với trồng cây xanh, lắp cửa kính và rèm cách âm giúp giảm tiếng ồn bền vững.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trồng cây xanh giúp phân tán âm thanh, đóng cửa kính và treo rèm dày giúp ngăn âm truyền qua, đồng thời nói nhỏ nhẹ và tắt thiết bị âm thanh lớn vào giờ nghỉ giúp bảo vệ sức khỏe cho mọi người.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau khi gõ nhẹ vào chiếc chuông đồng nhỏ làm tiếng chuông ngân dài, muốn tiếng chuông ngừng kêu ngay lập tức, em cần làm gì và vì sao?",
        question_en:
          "After striking a small brass bell so it rings, how can you make the sound stop immediately and why?",
        choices: [
          {
            id: "a",
            label_vi:
              "Tắt bóng đèn trong phòng vì thiếu ánh sáng thì chuông không ngân được.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Áp bàn tay giữ nhẹ vào thành chuông để làm chuông ngừng rung động.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Quạt gió nhẹ về phía chiếc chuông để thổi tiếng kêu bay sang hướng khác.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nhắm mắt lại vì khi không nhìn thấy chuông thì chuông sẽ tự tắt tiếng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Vì sao sau khi gõ xong, chiếc chuông đồng vẫn tiếp tục ngân vang thêm một lúc?",
        hint2_vi:
          "Thành chuông vẫn đang rung động nhẹ nên âm thanh vẫn tiếp tục phát ra.",
        hint3_vi:
          "Khi bàn tay chạm và giữ vào thành chuông, sự rung động dừng lại ngay nên âm thanh cũng tắt lập tức.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Tiếng chuông còn ngân là do thành chuông vẫn đang rung động. Khi chạm tay giữ vào thành chuông, chuông ngừng rung động nên âm thanh dừng phát ra ngay lập tức.",
    },
  ],
};
