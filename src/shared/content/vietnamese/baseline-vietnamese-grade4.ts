/**
 * Tiếng Việt · Khảo sát đầu vào Tiếng Việt Lớp 4 (skill: vie-reading-main, lớp 4)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate reading comprehension and sentence structure check.
 */
import type { LessonDefinition } from "../types";

export const baselineVietnameseGrade4: LessonDefinition = {
  id: "vie-baseline-grade4",
  subjectId: "vietnamese",
  skillId: "vie-reading-main",
  titleVi: "Khảo sát đầu vào Tiếng Việt Lớp 4",
  titleEn: "Vietnamese Grade 4 Baseline Diagnostic",
  objectiveVi: "Khảo sát nhẹ nhàng khả năng đọc hiểu văn bản ngắn và nhận biết câu rõ ràng.",
  objectiveEn: "Gentle baseline check of short text reading comprehension and clear sentence syntax.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-read-main",
  provenance: "original_supplemental",
  sourceRef: "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Khảo sát đầu vào giúp ba mẹ nhận biết khả năng đọc hiểu và vốn từ của con.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Khi đọc một đoạn văn ngắn, em làm thế nào để hiểu rõ nội dung?",
        question_en: "How do you clearly understand a short paragraph?",
        choices: [
          { id: "a", label_vi: "Đọc kỹ từng câu và xem đoạn văn nói về ai, về việc gì.", correct: true },
          { id: "b", label_vi: "Chỉ nhìn lướt từ đầu tiên và từ cuối cùng của cả đoạn văn.", correct: false },
          { id: "c", label_vi: "Ngồi đếm xem trong đoạn văn có tất cả bao nhiêu dấu phẩy.", correct: false },
          { id: "d", label_vi: "Nhìn tên bài rồi tự đoán nội dung không cần đọc.", correct: false },
        ],
        hint1_vi: "Đọc hiểu cần chú ý nội dung câu chuyện.",
        hint2_vi: "Mỗi câu trong đoạn văn đều đóng góp vào ý chung.",
        hint3_vi: "Đọc cẩn thận giúp em nắm được nhân vật và hành động trong bài.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "Đọc kỹ từng câu và liên kết các ý lại với nhau giúp em hiểu đúng nội dung đoạn văn.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Vườn rau của ông",
        passage_vi:
          "Sáng sớm, ông nội dắt An ra vườn tưới rau. Những luống rau cải xanh mướt còn đọng những giọt sương đêm lấp lánh dưới ánh nắng mai. Ông chỉ cho An cách nhổ cỏ dại và bắt những chú sâu nhỏ lá cây. An thấy việc chăm sóc cây cối tuy bận rộn nhưng rất vui vẻ và bổ ích.",
        question_vi: "Đoạn văn trên kể về việc gì của ông và An?",
        choices: [
          { id: "a", label_vi: "Hai ông cháu dắt nhau đi dạo phố sớm để mua hạt giống rau mới.", correct: false },
          { id: "b", label_vi: "Ông nội dắt An ra vườn tưới nước và chăm sóc luống rau.", correct: true },
          { id: "c", label_vi: "An ngồi trong phòng khách xem chương trình thiếu nhi.", correct: false },
          { id: "d", label_vi: "Ông nội mang cần câu ra bờ sông gần nhà câu cá.", correct: false },
        ],
        evidenceSentence_vi: "Sáng sớm, ông nội dắt An ra vườn tưới rau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "Toàn bộ đoạn văn kể lại buổi sáng ông dắt An ra vườn tưới rau và nhổ cỏ chăm sóc cây cối.",
    },
    {
      position: 3,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Trong câu “Những luống rau cải xanh mướt dưới ánh nắng mai.”, bộ phận nào là chủ ngữ?",
        question_en: "Which part is the subject of the sentence?",
        choices: [
          { id: "a", label_vi: "Những luống rau cải", correct: true },
          { id: "b", label_vi: "xanh mướt dưới ánh nắng mai", correct: false },
          { id: "c", label_vi: "rau cải xanh mướt dưới ánh nắng", correct: false },
          { id: "d", label_vi: "luống rau cải xanh mướt", correct: false },
        ],
        hint1_vi: "Chủ ngữ trả lời cho câu hỏi: 'Cái gì?', 'Con gì?' hoặc 'Ai?'.",
        hint2_vi: "Cái gì xanh mướt dưới ánh nắng mai?",
        hint3_vi: "Chủ ngữ là cụm danh từ đứng đầu câu chỉ sự vật mang vẻ xanh mướt đó.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi: "'Những luống rau cải' trả lời cho câu hỏi 'Cái gì?', là chủ ngữ của câu.",
    },
    {
      position: 4,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Câu nào dưới đây là câu kể lại một việc làm có ích giúp đỡ người thân?",
        question_en: "Which sentence describes a helpful act for family?",
        choices: [
          { id: "a", label_vi: "Bầu trời sáng hôm nay trong xanh và nắng ấm.", correct: false },
          { id: "b", label_vi: "An giúp mẹ quét nhà và xếp lại bàn học thật gọn gàng.", correct: true },
          { id: "c", label_vi: "Quyển truyện tranh mới mượn ở thư viện rất hay.", correct: false },
          { id: "d", label_vi: "Ngoài sân có nhiều chim sẻ hót líu lo.", correct: false },
        ],
        hint1_vi: "Tìm câu có người thực hiện hành động giúp đỡ.",
        hint2_vi: "An làm việc nhà để đỡ đần cho mẹ.",
        hint3_vi: "Hãy tìm câu kể rõ việc quét dọn và sắp xếp góc học tập phụ giúp mẹ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "Câu 'An giúp mẹ quét nhà và xếp lại bàn học thật gọn gàng.' nêu rõ người làm và hành động giúp đỡ mẹ.",
    },
  ],
};
