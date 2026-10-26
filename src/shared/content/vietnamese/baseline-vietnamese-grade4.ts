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
          { id: "a", label_vi: "Đọc kỹ từng câu và tự hỏi đoạn văn đang nói về ai, về việc gì.", correct: true },
          { id: "b", label_vi: "Chỉ đọc từ đầu tiên và từ cuối cùng.", correct: false },
          { id: "c", label_vi: "Đếm xem có bao nhiêu dấu phẩy.", correct: false },
          { id: "d", label_vi: "Đoán mò không cần đọc.", correct: false },
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
          "Sáng sớm, ông nội dắt Tài ra vườn tưới rau. Những luống rau cải xanh mướt còn đọng những giọt sương đêm lấp lánh dưới ánh nắng mai. Ông chỉ cho Tài cách nhổ cỏ dại và bắt những chú sâu nhỏ lá cây. Tài thấy việc chăm sóc cây cối tuy bận rộn nhưng rất vui vẻ và bổ ích.",
        question_vi: "Đoạn văn trên kể về việc gì của ông và Tài?",
        choices: [
          { id: "a", label_vi: "Hai ông cháu đi dạo phố mua đồ.", correct: false },
          { id: "b", label_vi: "Ông dắt Tài ra vườn tưới rau và chăm sóc luống rau buổi sớm.", correct: true },
          { id: "c", label_vi: "Tài xem ti vi ở trong nhà.", correct: false },
          { id: "d", label_vi: "Ông nội đi câu cá ở bờ sông.", correct: false },
        ],
        evidenceSentence_vi: "Sáng sớm, ông nội dắt Tài ra vườn tưới rau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "Toàn bộ đoạn văn kể lại buổi sáng ông dắt Tài ra vườn tưới rau và nhổ cỏ chăm sóc cây cối.",
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
          { id: "b", label_vi: "xanh mướt", correct: false },
          { id: "c", label_vi: "dưới ánh nắng mai", correct: false },
          { id: "d", label_vi: "rau cải xanh", correct: false },
        ],
        hint1_vi: "Chủ ngữ trả lời cho câu hỏi: 'Cái gì?', 'Con gì?' hoặc 'Ai?'.",
        hint2_vi: "Cái gì xanh mướt dưới ánh nắng mai?",
        hint3_vi: "'Những luống rau cải' là sự vật được nói đến ở đầu câu.",
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
          { id: "a", label_vi: "Hôm nay trời nắng đẹp.", correct: false },
          { id: "b", label_vi: "Tài giúp mẹ quét nhà và xếp lại bàn học thật gọn gàng.", correct: true },
          { id: "c", label_vi: "Quyển truyện tranh này rất hay.", correct: false },
          { id: "d", label_vi: "Ngoài sân có nhiều chim sẻ hót líu lo.", correct: false },
        ],
        hint1_vi: "Tìm câu có người thực hiện hành động giúp đỡ.",
        hint2_vi: "Tài làm việc nhà để đỡ đần cho mẹ.",
        hint3_vi: "Hành động 'giúp mẹ quét nhà và xếp bàn học' là việc làm có ích.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi: "Câu 'Tài giúp mẹ quét nhà và xếp lại bàn học thật gọn gàng.' nêu rõ người làm và hành động giúp đỡ mẹ.",
    },
  ],
};
