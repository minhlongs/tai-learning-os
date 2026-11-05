/**
 * Tiếng Việt · Câu văn rõ ràng (skill: vie-sentence-clear, lớp 4)
 *
 * Steps live inline: the payload is short enough that splitting it would only
 * add indirection. Authored for TAI Learning OS; original content, not copied
 * from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const sentenceClarity: LessonDefinition = {
  id: "vie-sentence-clarity",
  subjectId: "vietnamese",
  skillId: "vie-sentence-clear",
  titleVi: "Câu văn rõ ràng",
  titleEn: "Clear Sentences",
  objectiveVi:
    "Em sẽ viết được một câu đầy đủ: có chủ ngữ, có vị ngữ, viết hoa đầu câu và có dấu chấm ở cuối câu.",
  objectiveEn:
    "Write a complete sentence with a subject and a predicate, a capital letter at the start and a full stop at the end.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-write-sent",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng bài tập nhận diện chủ ngữ và vị ngữ.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Một câu văn đầy đủ thường có những phần nào?",
        question_en: "Which parts does a complete sentence usually have?",
        choices: [
          { id: "a", label_vi: "Chỉ cần một động từ.", correct: false },
          { id: "b", label_vi: "Có chủ ngữ và có vị ngữ.", correct: true },
          { id: "c", label_vi: "Có dấu phẩy và dấu chấm than.", correct: false },
          { id: "d", label_vi: "Càng nhiều từ càng tốt.", correct: false },
        ],
        hint1_vi: "Em hãy đọc một câu quen thuộc rồi tìm xem có mấy khúc.",
        hint2_vi: "Khúc đầu cho biết câu đang nói về ai hoặc cái gì.",
        hint3_vi: "Khúc sau cho biết đối tượng đó làm gì hoặc như thế nào.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu đầy đủ cần chủ ngữ để nói câu đang bàn về ai hoặc cái gì, và cần vị ngữ để nói đối tượng đó làm gì hoặc ra sao. Thiếu một trong hai thì câu chưa cho người đọc biết đủ thông tin.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong câu “Bầu trời sáng dần”, chủ ngữ là phần nào?",
        question_en: "Which part is the subject of 'Bầu trời sáng dần'?",
        choices: [
          { id: "a", label_vi: "“sáng dần”", correct: false },
          { id: "b", label_vi: "“Bầu trời”", correct: true },
          { id: "c", label_vi: "Cả câu", correct: false },
          { id: "d", label_vi: "Không có chủ ngữ", correct: false },
        ],
        hint1_vi: "Em hãy tự hỏi: câu này đang nói về cái gì?",
        hint2_vi: "Phần đứng đầu câu thường là chủ ngữ trong tiếng Việt.",
        hint3_vi: "“sáng dần” là điều xảy ra cho chủ ngữ đó, nên nó không phải chủ ngữ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu đang nói về bầu trời, nên “Bầu trời” là chủ ngữ, còn “sáng dần” nói bầu trời ra sao nên là vị ngữ. Cách hỏi “câu này nói về ai, về cái gì” giúp em tìm đúng chủ ngữ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào sau đây đã đủ chủ ngữ và vị ngữ?",
        question_en: "Which sentence has both a subject and a predicate?",
        choices: [
          { id: "a", label_vi: "Chú mèo con của nhà hàng xóm.", correct: false },
          { id: "b", label_vi: "Ngủ say trên giường.", correct: false },
          { id: "c", label_vi: "Chú mèo con ngủ say trên giường.", correct: true },
          { id: "d", label_vi: "Và rồi sau đó.", correct: false },
        ],
        hint1_vi: "Em hãy kiểm tra từng câu: câu đó nói về ai, về cái gì?",
        hint2_vi: "Câu a chỉ gọi tên một đối tượng, chưa nói đối tượng đó làm gì.",
        hint3_vi: "Câu b kể một việc xảy ra nhưng không cho biết ai làm việc đó.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu “Chú mèo con ngủ say trên giường” có chủ ngữ là “chú mèo con” và vị ngữ là “ngủ say trên giường”, nên là câu đầy đủ. Câu chỉ gọi tên chú mèo, câu chỉ kể việc ngủ mà thiếu người làm, và câu còn lại chỉ là từ nối — cả ba chưa phải câu hoàn chỉnh.",    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em viết về buổi sáng ở công viên. Câu nào viết đúng quy tắc chữ hoa đầu câu và dấu chấm cuối câu?",
        question_en: "Which sentence follows the capital letter and full stop rules?",
        choices: [
          { id: "a", label_vi: "mẹ dắt em đi công viên.", correct: false },
          { id: "b", label_vi: "Mẹ dắt em đi công viên", correct: false },
          { id: "c", label_vi: "Mẹ dắt em đi công viên.", correct: true },
          { id: "d", label_vi: "mẹ dắt em đi công viên", correct: false },
        ],
        hint1_vi: "Đầu câu cần viết hoa chữ cái đầu tiên để người đọc biết câu bắt đầu.",
        hint2_vi: "Cuối câu cần dấu chấm để người đọc biết câu đã kết thúc.",
        hint3_vi: "Em hãy xem lại câu b: câu đó còn thiếu dấu ở cuối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu “Mẹ dắt em đi công viên.” vừa viết hoa chữ đầu vừa có dấu chấm cuối câu nên người đọc biết bắt đầu và kết thúc ở đâu. Các câu còn lại thiếu chữ hoa đầu câu, thiếu dấu chấm, hoặc thiếu cả hai.",    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em cần viết lại một câu rõ ràng về buổi trồng cây của lớp. Câu nào làm tốt nhất?",
        question_en: "Which sentence best describes the class tree-planting day?",
        choices: [
          { id: "a", label_vi: "Cả lớp cùng trồng cây ở sân trường.", correct: true },
          { id: "b", label_vi: "Trồng cây ở đâu đó.", correct: false },
          { id: "c", label_vi: "cây xanh.", correct: false },
          { id: "d", label_vi: "Cả lớp cùng.", correct: false },
        ],
        hint1_vi: "Em hãy chọn câu vừa nói rõ ai làm vừa nói rõ việc gì.",
        hint2_vi: "Câu b không cho biết ai trồng cây và trồng ở đâu.",
        hint3_vi: "Câu c chỉ là một cụm từ, câu d mới chỉ có một nửa của câu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu có chủ ngữ “cả lớp”, vị ngữ “cùng trồng cây ở sân trường”, viết hoa đầu câu và có dấu chấm, nên đầy đủ và rõ ràng. Ba câu còn lại chỉ là cụm từ hoặc câu bị cụt, người đọc không biết ai làm việc gì.",    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Buổi chiều ở bờ hồ",
        passage_vi:
          "Chiều thứ Bảy, bà dắt Bin ra bờ hồ gần nhà. Mặt hồ phẳng lặng đến mức Bin nhìn thấy bóng mình in trên mặt nước. Mấy chú vịt bơi thành hàng để đi tìm mẹ. Nghe tiếng bà kể chuyện ngày xưa, Bin thiếp đi trên vai bà. Về đến nhà, Bin kể lại cho ba nghe từng chi tiết về bầy vịt.",
        question_vi: "Câu nào trong đoạn văn nói rõ ai đang làm việc gì?",
        choices: [
          { id: "a", label_vi: "Mặt hồ phẳng lặng đến mức Bin nhìn thấy bóng mình in trên mặt nước.", correct: false },
          { id: "b", label_vi: "Nghe tiếng bà kể chuyện ngày xưa, Bin thiếp đi trên vai bà.", correct: true },
          { id: "c", label_vi: "Chiều thứ Bảy, bà dắt Bin ra bờ hồ gần nhà.", correct: false },
          { id: "d", label_vi: "Mấy chú vịt bơi thành hàng để đi tìm mẹ.", correct: false },
        ],
        evidenceSentence_vi: "Nghe tiếng bà kể chuyện ngày xưa, Bin thiếp đi trên vai bà.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu b vừa có chủ ngữ là Bin vừa có vị ngữ là “thiếp đi trên vai bà”, nên nói đủ ai làm gì. Các câu khác đều mô tả cảnh hoặc kể một việc chung chung, em cần kiểm tra xem câu đó có chủ ngữ rõ ràng hay không trước khi chọn.",
    },
  ],
};
