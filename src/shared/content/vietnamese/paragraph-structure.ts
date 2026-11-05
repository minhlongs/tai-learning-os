/**
 * Tiếng Việt · Cấu trúc đoạn văn (skill: vie-paragraph-structure, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives (`GDPT2018.VIE.5.WRITE.01`).
 */
import type { LessonDefinition } from "../types";

export const paragraphStructure: LessonDefinition = {
  id: "vie-paragraph-structure",
  subjectId: "vietnamese",
  skillId: "vie-paragraph-structure",
  titleVi: "Cấu trúc đoạn văn: mở, thân, kết",
  titleEn: "Paragraph Structure: Opening, Body, Closing",
  objectiveVi:
    "Em sẽ nhận biết và sắp xếp được câu mở đoạn, các câu triển khai và câu kết đoạn.",
  objectiveEn:
    "Identify and arrange an opening sentence, supporting sentences, and a closing sentence.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-para-structure",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chỉ ra ba phần trong một đoạn văn em đã viết.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Câu mở đoạn thường có nhiệm vụ gì?",
        choices: [
          { id: "a", label_vi: "Kể mọi chi tiết nhỏ", correct: false },
          { id: "b", label_vi: "Lặp nguyên câu cuối đoạn", correct: false },
          { id: "c", label_vi: "Giới thiệu ý chính của đoạn văn", correct: true },
          { id: "d", label_vi: "Đưa ra một ý không liên quan", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến điều người đọc cần biết đầu tiên.",
        hint2_vi: "Câu này giúp người đọc biết đoạn văn sẽ nói về chủ đề nào.",
        hint3_vi: "Câu mở đoạn giới thiệu ý chính.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu mở đoạn giới thiệu chủ đề hoặc ý chính để người đọc biết đoạn văn sắp nói về điều gì.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Các câu thân đoạn cần làm gì?",
        choices: [
          {
            id: "a",
            label_vi: "Giải thích hoặc làm rõ ý chính bằng chi tiết",
            correct: true,
          },
          { id: "b", label_vi: "Chỉ lặp lại đúng câu mở đoạn", correct: false },
          {
            id: "c",
            label_vi: "Chuyển sang một chủ đề hoàn toàn khác",
            correct: false,
          },
          { id: "d", label_vi: "Không cần liên quan đến nhau", correct: false },
        ],
        hint1_vi: "Phần thân nằm giữa câu mở và câu kết.",
        hint2_vi: "Nó cần cung cấp ví dụ, lý do hoặc miêu tả.",
        hint3_vi: "Các chi tiết trong thân đoạn phải làm rõ ý chính.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Các câu thân đoạn phát triển ý chính bằng chi tiết, ví dụ, lý do hoặc sự việc cụ thể có liên quan.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Đoạn văn tả cây phượng nên dùng câu nào làm câu mở đoạn?",
        choices: [
          {
            id: "a",
            label_vi: "Em luôn nhớ màu hoa ấy mỗi khi nghỉ hè.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Những chùm hoa đỏ rực rung rinh trong gió.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ve sầu kêu râm ran trên cành.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Cây phượng giữa sân trường là người bạn thân thiết của chúng em.",
            correct: true,
          },
        ],
        hint1_vi: "Câu mở cần giới thiệu đối tượng chính là cây phượng.",
        hint2_vi: "Câu này nên bao quát hơn các chi tiết về hoa và ve.",
        hint3_vi: "Chọn câu giới thiệu cây phượng là người bạn của học sinh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu giới thiệu trực tiếp đối tượng là cây phượng và nêu ý bao quát nên phù hợp làm câu mở đoạn. Các câu còn lại phù hợp với phần thân hoặc phần kết.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau câu mở “Thư viện trường em là nơi rất thú vị”, câu nào phù hợp nhất để triển khai?",
        choices: [
          { id: "a", label_vi: "Sáng nay trời có mưa lớn.", correct: false },
          {
            id: "b",
            label_vi: "Các giá sách đầy truyện hay, bàn đọc luôn sạch sẽ và cô thủ thư rất thân thiện.",
            correct: true,
          },
          { id: "c", label_vi: "Em thích ăn món canh chua.", correct: false },
          { id: "d", label_vi: "Bóng đá là môn thể thao phổ biến.", correct: false },
        ],
        hint1_vi: "Câu triển khai phải cùng nói về thư viện.",
        hint2_vi: "Tìm câu nêu chi tiết chứng minh thư viện thú vị.",
        hint3_vi: "Giá sách, bàn đọc và cô thủ thư đều là chi tiết liên quan.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu đưa ra ba chi tiết cụ thể — giá sách đầy truyện hay, bàn đọc sạch sẽ và cô thủ thư thân thiện — làm rõ vì sao thư viện thú vị; các câu còn lại không liên quan đến chủ đề.",    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào kết thúc phù hợp đoạn văn kể về buổi trồng cây của lớp?",
        choices: [
          {
            id: "a",
            label_vi: "Buổi trồng cây giúp chúng em hiểu rằng chăm sóc môi trường là trách nhiệm của mỗi người.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Cô giáo phát cho mỗi bạn một chiếc xẻng.",
            correct: false,
          },
          { id: "c", label_vi: "Nam đào hố còn Lan tưới nước.", correct: false },
          { id: "d", label_vi: "Cây giống được đặt cạnh hàng rào.", correct: false },
        ],
        hint1_vi: "Câu kết nên khép lại ý nghĩa của cả hoạt động.",
        hint2_vi: "Các chi tiết ai làm gì phù hợp hơn với phần thân.",
        hint3_vi: "Chọn câu nêu bài học về trách nhiệm với môi trường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu nêu rằng chăm sóc môi trường là trách nhiệm của mỗi người nên tổng kết ý nghĩa buổi trồng cây, phù hợp làm câu kết đoạn. Ba câu còn lại chỉ kể chi tiết phần thân.",
    },
  ],
};
