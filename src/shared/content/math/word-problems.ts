/**
 * Toán · Bài toán có lời văn (skill: math-word-problem, lớp 3–4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const wordProblems: LessonDefinition = {
  id: "math-word-problems",
  subjectId: "math",
  skillId: "math-word-problem",
  titleVi: "Bài toán có lời văn",
  titleEn: "Word Problems",
  objectiveVi: "Em sẽ đọc kỹ đề bài, tìm các số có ý nghĩa và viết phép tính cho đúng.",
  objectiveEn: "Read a problem carefully, find the numbers that matter, and write the right calculation.",
  gradeFrom: 3,
  gradeTo: 4,
  objectiveId: "obj-math-word-prob",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày với bài toán có lời văn hai bước tính.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Làm bài toán có lời văn, em nên bắt đầu bằng việc gì?",
        question_en: "What should you do first with a word problem?",
        choices: [
          { id: "a", label_vi: "Cộng mọi con số có trong đề lại với nhau.", correct: false },
          { id: "b", label_vi: "Đọc kỹ đề để biết đề hỏi gì và số liệu nào cần dùng.", correct: true },
          { id: "c", label_vi: "Chọn đáp án dài nhất.", correct: false },
          { id: "d", label_vi: "Viết phép tính trước rồi mới đọc đề.", correct: false },
        ],
        hint1_vi: "Đề bài dài hơn phép tính, nhưng phép tính chỉ cần một phần số liệu.",
        hint2_vi: "Em hãy tìm câu cuối của đề — thường câu đó cho biết đề đang hỏi gì.",
        hint3_vi: "Một số trong đề bài có thể không cần dùng, nên đọc để biết mình cần gì đã.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đọc kỹ trước giúp em biết đề hỏi số gì, rồi mới chọn được số cần dùng. Nếu cộng tất cả con số, em sẽ dùng cả những số không liên quan.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong thư viện có 36 quyển truyện. Thầy mượn thêm 15 quyển nữa. Hỏi thư viện có tất cả bao nhiêu quyển truyện? Em chọn phép tính nào?",
        question_en: "Which calculation answers the question?",
        choices: [
          { id: "a", label_vi: "36 + 15", correct: true },
          { id: "b", label_vi: "36 − 15", correct: false },
          { id: "c", label_vi: "15 + 15", correct: false },
          { id: "d", label_vi: "36 + 36", correct: false },
        ],
        hint1_vi: "Hai nhóm ở đây là truyện cũ và truyện thêm vào. Em đang ghép chúng lại với nhau.",
        hint2_vi: "Khi biết mỗi nhóm có bao nhiêu và muốn hỏi cả hai nhóm cùng nhau, em nên cộng.",
        hint3_vi: "Ghép hai nhóm lại thì lượng tổng tăng lên, nên dùng dấu cộng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Đề hỏi cả hai nhóm truyện cùng nhau, tức là đang gộp chúng, nên em lấy cả hai số từ đề: 36 + 15. Các đáp án khác bỏ sót một số hoặc dùng sai số.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bình có 28 cái kẹo. Bình cho bạn 9 cái kẹo. Hỏi Bình còn lại bao nhiêu cái kẹo? Em chọn phép tính nào?",
        question_en: "Which calculation answers the question?",
        choices: [
          { id: "a", label_vi: "28 + 9", correct: false },
          { id: "b", label_vi: "28 × 9", correct: false },
          { id: "c", label_vi: "28 − 9", correct: true },
          { id: "d", label_vi: "28 − 28", correct: false },
        ],
        hint1_vi: "Số kẹo còn lại là số lượng Bình đang giữ sau khi có một phần đã rời đi.",
        hint2_vi: "Hãy tưởng tượng Bình đang cầm 28 cái và đưa đi 9 cái. Trong tay Bình nhiều hơn hay ít hơn trước?",
        hint3_vi: "Khi bớt đi một phần thì dùng dấu trừ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Bình vừa đưa đi một phần kẹo nên số còn lại ít hơn lúc đầu, và em dùng phép trừ: 28 − 9 = 19 cái kẹo.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Có 4 túi kẹo, mỗi túi có 12 cái kẹo. Hỏi cả bốn túi có tất cả bao nhiêu cái kẹo?",
        question_en: "How many sweets are there in total?",
        choices: [
          { id: "a", label_vi: "16 cái kẹo", correct: false },
          { id: "b", label_vi: "48 cái kẹo", correct: true },
          { id: "c", label_vi: "8 cái kẹo", correct: false },
          { id: "d", label_vi: "24 cái kẹo", correct: false },
        ],
        hint1_vi: "Các nhóm ở đây bằng nhau: mỗi túi đều có 12 cái.",
        hint2_vi: "Cộng số lượng của từng túi một với nhau cho đến đủ bốn túi.",
        hint3_vi: "Mỗi nhóm bằng nhau mà lặp lại nhiều lần thì em có thể nhân nhanh hơn là cộng dồn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Có 4 nhóm bằng nhau, mỗi nhóm 12 cái, nên 4 × 12 = 48. Em cũng được nếu cộng dồn 12 + 12 + 12 + 12, vì nhân chỉ là cách cộng nhanh các nhóm bằng nhau.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em Hoa có 45 viên bi xanh. Em ấy thua bạn và mất 17 viên, sau đó lại thắng lại được 5 viên. Hỏi em Hoa còn bao nhiêu viên bi?",
        question_en: "How many marbles does Hoa have now?",
        choices: [
          { id: "a", label_vi: "23 viên", correct: false },
          { id: "b", label_vi: "38 viên", correct: false },
          { id: "c", label_vi: "33 viên", correct: true },
          { id: "d", label_vi: "27 viên", correct: false },
        ],
        hint1_vi: "Đề có hai lần thay đổi, nên em xếp theo đúng thứ tự đã xảy ra.",
        hint2_vi: "Lần thứ nhất làm số bi giảm đi 17 viên, lần thứ hai làm số bi tăng thêm 5 viên.",
        hint3_vi: "Em tính lần một trước, rồi lấy kết quả đó làm số bắt đầu cho lần hai. 45 trừ 17 được bao nhiêu?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Làm theo thứ tự: 45 − 17 = 28 viên, rồi 28 + 5 = 33 viên. Làm đúng thứ tự mới đúng, vì con số mới của em Hoa sau bước đầu là điểm bắt đầu của bước sau.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Mẹ mua 3 kg gạo và 2 kg đường. Hỏi mẹ mua bao nhiêu kilôgam thực phẩm cả hai loại? Đáp án nào là đúng?",
        question_en: "How many kilograms did mother buy in total?",
        choices: [
          { id: "a", label_vi: "6 kg", correct: false },
          { id: "b", label_vi: "5 kg", correct: true },
          { id: "c", label_vi: "1 kg", correct: false },
          { id: "d", label_vi: "32 kg", correct: false },
        ],
        hint1_vi: "Đang tính hai thùng hàng cùng được cân nên em xếp chúng vào chung một đơn vị.",
        hint2_vi: "Cả hai số đều cùng một đơn vị là kilôgam, nên em cứ cộng thẳng được.",
        hint3_vi: "Em hãy tưởng tượng mình xếp hai bao lên cùng một chiếc cân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Cùng một đơn vị kilôgam nên em gộp hai số lại: 3 + 2 = 5 kg. Đáp án 1 kg là kết quả của hai nhân nhau, chứ chúng không phải hai lần cân.",
    },
  ],
};
