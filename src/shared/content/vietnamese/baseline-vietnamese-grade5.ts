/**
 * Tiếng Việt · Khảo sát năng lực đầu vào Tiếng Việt Lớp 5 (skill: vie-paragraph-structure, lớp 5)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering core grade-level prerequisites.
 */
import type { LessonDefinition } from "../types";

export const baselineVietnameseGrade5: LessonDefinition = {
  id: "vie-baseline-grade5",
  subjectId: "vietnamese",
  skillId: "vie-paragraph-structure",
  titleVi: "Khảo sát đầu vào Tiếng Việt Lớp 5",
  titleEn: "Vietnamese Grade 5 Baseline Diagnostic",
  objectiveVi:
    "Khảo sát nhẹ nhàng khả năng đọc hiểu và sắp xếp ý thành đoạn văn trước khi học lớp 5.",
  objectiveEn:
    "Gentle baseline check of reading comprehension and paragraph organisation before Grade 5.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-para-structure",
  provenance: "original_supplemental",
  sourceRef:
    "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Khảo sát đầu vào để phụ huynh nắm năng lực xuất phát điểm, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Một đoạn văn thường tập trung vào điều gì?",
        choices: [
          { id: "a", label_vi: "Nhiều chủ đề không liên quan", correct: false },
          { id: "b", label_vi: "Chỉ một từ duy nhất", correct: false },
          { id: "c", label_vi: "Một ý chính", correct: true },
          { id: "d", label_vi: "Các câu xếp ngẫu nhiên", correct: false },
        ],
        hint1_vi: "Các câu trong đoạn cần cùng hướng về một nội dung.",
        hint2_vi: "Nội dung chung đó được gọi là ý chính.",
        hint3_vi: "Một đoạn văn tốt tập trung vào một ý chính.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Một đoạn văn thường xoay quanh một ý chính; các câu còn lại giải thích hoặc làm rõ ý đó.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Chú sẻ nhỏ",
        passage_vi:
          "Một chú sẻ non rơi khỏi tổ sau cơn gió lớn. Vy nhẹ nhàng đặt chú vào chiếc hộp lót khăn rồi nhờ người lớn đưa trở lại tổ. Chiều hôm đó, sẻ mẹ bay về ríu rít bên đàn con.",
        question_vi: "Vy đã làm gì khi thấy chú sẻ non?",
        choices: [
          {
            id: "a",
            label_vi: "Đặt sẻ vào hộp an toàn rồi nhờ người lớn đưa về tổ",
            correct: true,
          },
          { id: "b", label_vi: "Mang sẻ đến trường", correct: false },
          { id: "c", label_vi: "Để mặc sẻ nằm dưới đất", correct: false },
          { id: "d", label_vi: "Đuổi sẻ mẹ đi", correct: false },
        ],
        evidenceSentence_vi:
          "Vy nhẹ nhàng đặt chú vào chiếc hộp lót khăn rồi nhờ người lớn đưa trở lại tổ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bài đọc nói rõ Vy đặt sẻ vào hộp lót khăn rồi nhờ người lớn đưa sẻ về tổ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào phù hợp nhất làm câu mở cho đoạn văn tả khu vườn?",
        choices: [
          {
            id: "a",
            label_vi: "Em luôn muốn chăm sóc khu vườn thật tốt.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Khu vườn sau nhà em lúc nào cũng đầy màu sắc và tiếng chim.",
            correct: true,
          },
          { id: "c", label_vi: "Một chú bướm vàng đậu trên hoa cúc.", correct: false },
          { id: "d", label_vi: "Luống rau xanh mướt sau cơn mưa.", correct: false },
        ],
        hint1_vi: "Câu mở cần giới thiệu bao quát cả khu vườn.",
        hint2_vi: "Các chi tiết về bướm và luống rau phù hợp với phần thân.",
        hint3_vi: "Chọn câu giới thiệu khu vườn đầy màu sắc và tiếng chim.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu giới thiệu bao quát đối tượng là khu vườn và đặc điểm chung nên phù hợp làm câu mở đoạn; các câu còn lại là chi tiết thuộc phần thân hoặc phù hợp làm câu kết.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Chiếc áo mưa",
        passage_vi:
          "Tan học, trời bỗng đổ mưa. An thấy bạn Hòa đứng nép dưới mái hiên vì không có áo mưa. An kéo rộng chiếc áo mưa của mình rồi cả hai cùng chạy về nhà.",
        question_vi: "Hành động của An cho thấy bạn có phẩm chất gì?",
        choices: [
          { id: "a", label_vi: "Chỉ nghĩ đến bản thân", correct: false },
          { id: "b", label_vi: "Không muốn về nhà", correct: false },
          { id: "c", label_vi: "Sợ trời mưa", correct: false },
          { id: "d", label_vi: "Biết quan tâm và chia sẻ với bạn", correct: true },
        ],
        evidenceSentence_vi:
          "An kéo rộng chiếc áo mưa của mình rồi cả hai cùng chạy về nhà.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "An chia áo mưa để Hòa cùng về nhà, cho thấy bạn biết quan tâm và chia sẻ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào kết đoạn phù hợp sau khi kể các việc cả lớp dọn sạch sân trường?",
        choices: [
          { id: "a", label_vi: "Tổ một quét lá dưới gốc cây.", correct: false },
          { id: "b", label_vi: "Tổ hai nhặt giấy quanh sân.", correct: false },
          {
            id: "c",
            label_vi: "Nhìn sân trường sạch đẹp, chúng em hiểu rằng giữ gìn không gian chung là trách nhiệm của mọi người.",
            correct: true,
          },
          { id: "d", label_vi: "Cô giáo mang đến nhiều túi đựng rác.", correct: false },
        ],
        hint1_vi: "Câu kết nên tổng kết cảm nghĩ hoặc bài học.",
        hint2_vi: "Các câu kể từng việc làm thuộc phần thân.",
        hint3_vi: "Chọn câu nêu trách nhiệm giữ gìn không gian chung.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu khép lại bằng kết quả sân trường sạch đẹp và bài học về trách nhiệm nên phù hợp làm câu kết; các câu còn lại chỉ kể chi tiết từng việc làm trong phần thân.",
    },
  ],
};
