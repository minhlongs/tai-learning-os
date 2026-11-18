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
          { id: "a", label_vi: "Liệt kê hết mọi chi tiết nhỏ sẽ kể trong đoạn.", correct: false },
          { id: "b", label_vi: "Chép lại nguyên vẹn câu kết ở cuối đoạn văn.", correct: false },
          { id: "c", label_vi: "Giới thiệu chủ đề của đoạn văn.", correct: true },
          { id: "d", label_vi: "Nêu thêm một sự việc nằm ngoài nội dung đoạn.", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến điều người đọc cần biết đầu tiên.",
        hint2_vi: "Câu này giúp người đọc biết đoạn văn sẽ nói về nội dung nào.",
        hint3_vi: "Câu đầu tiên mở ra hướng triển khai chung cho các câu đứng sau.",
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
            label_vi: "Làm rõ ý chính bằng các chi tiết, lí lẽ cụ thể.",
            correct: true,
          },
          { id: "b", label_vi: "Lặp lại nguyên xi từ ngữ đã có ở câu mở đầu.", correct: false },
          {
            id: "c",
            label_vi: "Chuyển hẳn sang kể một câu chuyện khác không liên quan.",
            correct: false,
          },
          { id: "d", label_vi: "Ghép các câu rời rạc, mỗi câu nói về một việc.", correct: false },
        ],
        hint1_vi: "Phần thân nằm giữa câu mở và câu kết.",
        hint2_vi: "Nó cần cung cấp ví dụ, lý do hoặc miêu tả.",
        hint3_vi: "Các ý ở phần giữa đoạn đều phải xoay quanh và bổ sung cho câu mở.",
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
            label_vi: "Tiếng ve sầu kêu râm ran trên những vòm lá.",
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
        hint2_vi: "Câu này nên bao quát hơn các chi tiết về hoa và tiếng ve.",
        hint3_vi: "Hãy tìm câu nêu cái nhìn bao quát về cây phượng giữa sân trường.",
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
          {
            id: "a",
            label_vi: "Sân vận động cạnh trường rất rộng rãi nên chiều nào cũng đông học sinh.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Giá sách đầy truyện hay, bàn đọc sạch sẽ và cô thủ thư thân thiện.",
            correct: true,
          },
          { id: "c", label_vi: "Buổi sáng hôm nay bầu trời trong xanh và có nắng ấm.", correct: false },
          {
            id: "d",
            label_vi: "Nhà ăn của trường phục vụ nhiều món canh nóng hổi vào mỗi buổi trưa.",
            correct: false,
          },
        ],
        hint1_vi: "Câu triển khai phải cùng nói về thư viện.",
        hint2_vi: "Tìm câu nêu chi tiết chứng minh thư viện thú vị.",
        hint3_vi: "Hãy tìm những hình ảnh quen thuộc bên trong phòng đọc sách.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu đưa ra ba chi tiết cụ thể — giá sách đầy truyện hay, bàn đọc sạch sẽ và cô thủ thư thân thiện — làm rõ vì sao thư viện thú vị; các câu còn lại nói sang sân vận động, thời tiết hoặc nhà ăn nên lạc chủ đề.",
    },
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
            label_vi: "Buổi trồng cây nhắc chúng em cùng chung tay chăm sóc môi trường xanh.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Đầu giờ sáng, cô giáo phát cho mỗi tổ hai chiếc xẻng nhỏ và một bình tưới nước.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Bạn Nam đào hố đất mềm còn bạn Lan nhẹ tay đặt bầu cây giống.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Những bầu cây non được xếp ngay ngắn dọc theo hàng rào cuối sân.",
            correct: false,
          },
        ],
        hint1_vi: "Câu kết nên khép lại ý nghĩa của cả hoạt động.",
        hint2_vi: "Các chi tiết ai làm gì phù hợp hơn với phần thân.",
        hint3_vi: "Hãy tìm câu nêu ý nghĩa chung đọng lại sau hoạt động của cả lớp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu nêu ý nghĩa cùng chung tay chăm sóc môi trường xanh đã tổng kết trọn vẹn buổi trồng cây, phù hợp làm câu kết đoạn. Ba câu còn lại chỉ kể chi tiết phần thân.",
    },
  ],
};
