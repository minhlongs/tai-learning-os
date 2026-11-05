/**
 * Tiếng Việt · Suy luận từ chi tiết (skill: vie-inference, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives (`GDPT2018.VIE.5.READ.03`).
 */
import type { LessonDefinition } from "../types";

export const inference: LessonDefinition = {
  id: "vie-inference",
  subjectId: "vietnamese",
  skillId: "vie-inference",
  titleVi: "Suy luận từ chi tiết trong văn bản",
  titleEn: "Inferring from Textual Details",
  objectiveVi:
    "Em sẽ dựa vào các chi tiết đã đọc để suy ra điều văn bản không nói trực tiếp.",
  objectiveEn:
    "Use details in a text to infer information that is not stated directly.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-inference",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách nêu một suy luận và chỉ ra chi tiết làm bằng chứng.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Suy luận khi đọc là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Đoán bất kì điều gì không cần bằng chứng",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Dùng chi tiết trong bài và hiểu biết hợp lý để rút ra điều chưa nói thẳng",
            correct: true,
          },
          { id: "c", label_vi: "Chép lại nguyên câu đầu tiên", correct: false },
          {
            id: "d",
            label_vi: "Bỏ qua các chi tiết trong bài",
            correct: false,
          },
        ],
        hint1_vi: "Suy luận không phải là đoán tùy ý.",
        hint2_vi: "Kết luận cần dựa vào dấu hiệu có thật trong văn bản.",
        hint3_vi: "Ta kết hợp chi tiết đã đọc với hiểu biết hợp lý.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Suy luận là kết luận hợp lý từ chi tiết trong bài kết hợp với hiểu biết sẵn có, không phải đoán không có căn cứ.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Trước giờ ra chơi",
        passage_vi:
          "Mây đen kéo kín bầu trời. Gió thổi mạnh làm lá cây bay xào xạc. Minh vội đóng các cửa sổ lớp học.",
        question_vi: "Điều gì có khả năng sắp xảy ra?",
        choices: [
          { id: "a", label_vi: "Lớp sắp đi tham quan", correct: false },
          { id: "b", label_vi: "Trời sắp nắng gắt", correct: false },
          { id: "c", label_vi: "Trời sắp mưa", correct: true },
          { id: "d", label_vi: "Mùa hè đã kết thúc", correct: false },
        ],
        evidenceSentence_vi:
          "Mây đen kéo kín bầu trời. Gió thổi mạnh làm lá cây bay xào xạc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mây đen và gió mạnh là những dấu hiệu thường xuất hiện trước cơn mưa; việc Minh đóng cửa sổ càng củng cố suy luận này.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Chiếc hộp nhỏ",
        passage_vi:
          "Lan đặt chiếc hộp có nơ đỏ lên bàn mẹ rồi nhẹ nhàng bước ra. Cả buổi tối, bạn cứ nhìn đồng hồ và mỉm cười. Hôm sau là ngày 8 tháng 3.",
        question_vi: "Vì sao Lan đặt chiếc hộp lên bàn mẹ?",
        choices: [
          {
            id: "a",
            label_vi: "Lan chuẩn bị quà tặng mẹ nhân ngày 8 tháng 3",
            correct: true,
          },
          { id: "b", label_vi: "Lan định mang hộp đến trường", correct: false },
          { id: "c", label_vi: "Lan muốn cất đồ chơi của mình", correct: false },
          { id: "d", label_vi: "Lan đang dọn bàn học", correct: false },
        ],
        evidenceSentence_vi:
          "Lan đặt chiếc hộp có nơ đỏ lên bàn mẹ rồi nhẹ nhàng bước ra. Hôm sau là ngày 8 tháng 3.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chiếc hộp có nơ, được đặt trên bàn mẹ ngay trước ngày 8 tháng 3 cho thấy Lan đang chuẩn bị quà tặng mẹ.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Buổi tập cuối",
        passage_vi:
          "Dù các bạn đã ra về, Huy vẫn ở lại sân tập từng cú phát bóng. Bạn xem lại động tác, sửa tư thế rồi thử lần nữa. Sáng mai đội của Huy sẽ thi đấu trận chung kết.",
        question_vi: "Có thể suy ra Huy là người như thế nào?",
        choices: [
          { id: "a", label_vi: "Không thích chơi thể thao", correct: false },
          { id: "b", label_vi: "Luôn bỏ cuộc khi gặp khó", correct: false },
          { id: "c", label_vi: "Không quan tâm đến trận đấu", correct: false },
          { id: "d", label_vi: "Kiên trì và có trách nhiệm với đội", correct: true },
        ],
        evidenceSentence_vi:
          "Dù các bạn đã ra về, Huy vẫn ở lại sân tập từng cú phát bóng. Bạn xem lại động tác, sửa tư thế rồi thử lần nữa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Huy ở lại tập thêm, tự xem và sửa động tác trước trận chung kết. Những hành động đó cho thấy bạn kiên trì và có trách nhiệm.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Góc vườn buổi sáng",
        passage_vi:
          "Trên luống rau có nhiều vết chân nhỏ. Mấy chiếc lá non bị cắn nham nhở. Dưới gốc cây, một chú thỏ trắng đang nép mình sau bụi cỏ.",
        question_vi: "Suy luận nào hợp lý nhất?",
        choices: [
          {
            id: "a",
            label_vi: "Một cơn bão đã làm hỏng luống rau",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chú thỏ có thể đã vào vườn ăn lá non",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Người làm vườn đã hái hết rau",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Luống rau chưa từng có con vật nào đến",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Trên luống rau có nhiều vết chân nhỏ. Mấy chiếc lá non bị cắn nham nhở. Dưới gốc cây, một chú thỏ trắng đang nép mình sau bụi cỏ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Vết chân nhỏ, lá bị cắn và chú thỏ đang trốn gần đó cùng hỗ trợ suy luận rằng thỏ đã vào vườn ăn lá.",
    },
  ],
};
