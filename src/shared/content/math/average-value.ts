/**
 * Toán 4 · Tìm số trung bình cộng (skill: math-average, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const averageValue: LessonDefinition = {
  id: "math-average-value",
  subjectId: "math",
  skillId: "math-average",
  titleVi: "Tìm số trung bình cộng",
  titleEn: "Finding the Arithmetic Mean",
  objectiveVi:
    "Em sẽ hiểu ý nghĩa san đều của số trung bình cộng, tính đúng trung bình cộng và tìm lại tổng khi biết trung bình cộng.",
  objectiveEn:
    "Understand the equal-sharing meaning of the mean, compute averages, and recover totals from a known average.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-average",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 5 ngày, nhớ đếm đúng tổng số các số hạng kể cả số 0 nếu có.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ba rổ cam có lần lượt 5 quả, 7 quả và 9 quả. Trong thực tế, số trung bình cộng của ba số này có ý nghĩa là gì?",
        question_en:
          "Three baskets hold 5, 7, and 9 oranges. What does the average of these three numbers represent in practice?",
        choices: [
          {
            id: "a",
            label_vi: "Số quả cam nhiều nhất trong một rổ.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Số quả cam ở mỗi rổ nếu gộp chung tất cả cam lại rồi san đều vào 3 rổ.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Tổng số quả cam của cả ba rổ khi cộng gộp lại với nhau.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Hiệu giữa rổ nhiều cam nhất và rổ ít cam nhất.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nếu chuyển bớt 2 quả từ rổ 9 quả sang rổ 5 quả thì mỗi rổ sẽ có lượng cam thế nào?",
        hint2_vi:
          "Tổng số cam của cả ba rổ không đổi, nhưng lượng cam ở ba rổ trở nên bằng nhau.",
        hint3_vi:
          "Cách gộp chung rồi chia đều cho số rổ chính là ý nghĩa thực tế của số trung bình cộng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Số trung bình cộng thể hiện kết quả san đều: gộp tất cả 5 + 7 + 9 = 21 quả cam rồi chia đều vào 3 rổ thì mỗi rổ đều có 21 : 3 = 7 quả.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Số trung bình cộng của bốn số 12, 18, 24 và 30 là bao nhiêu?",
        question_en:
          "What is the average of the four numbers 12, 18, 24, and 30?",
        choices: [
          { id: "a", label_vi: "84", correct: false },
          { id: "b", label_vi: "28", correct: false },
          { id: "c", label_vi: "21", correct: true },
          { id: "d", label_vi: "20", correct: false },
        ],
        hint1_vi:
          "Muốn tìm số trung bình cộng, trước tiên em tính tổng của tất cả các số hạng.",
        hint2_vi:
          "Nhóm (12 + 18) và (24 + 30) để tính nhanh tổng của bốn số.",
        hint3_vi:
          "Có 4 số hạng nên em lấy tổng vừa tìm được chia cho 4.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Tổng của bốn số là 12 + 18 + 24 + 30 = 84. Có 4 số hạng nên số trung bình cộng là 84 : 4 = 21.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong 4 ngày đầu tuần, số trang sách bạn An đọc được mỗi ngày lần lượt là 14 trang, 0 trang, 16 trang và 10 trang. Trung bình mỗi ngày trong 4 ngày đó An đọc được bao nhiêu trang sách?",
        question_en:
          "Over 4 days, An read 14, 0, 16, and 10 pages. On average, how many pages per day did An read across those 4 days?",
        choices: [
          { id: "a", label_vi: "40 trang", correct: false },
          { id: "b", label_vi: "13 trang", correct: false },
          { id: "c", label_vi: "8 trang", correct: false },
          { id: "d", label_vi: "10 trang", correct: true },
        ],
        hint1_vi:
          "Ngày đọc 0 trang vẫn được tính là 1 ngày trong khoảng thời gian 4 ngày.",
        hint2_vi: "Tính tổng số trang đọc được: 14 + 0 + 16 + 10.",
        hint3_vi:
          "Lấy tổng số trang chia đều cho cả 4 ngày thay vì chỉ chia cho 3.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Tổng số trang An đọc được là 14 + 0 + 16 + 10 = 40 trang. Dù ngày thứ hai đọc 0 trang, tổng thời gian vẫn là 4 ngày nên trung bình mỗi ngày đọc 40 : 4 = 10 trang.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đội Một trồng được 36 cây xanh, đội Hai trồng được 42 cây xanh, đội Ba trồng được 48 cây xanh. Trung bình mỗi đội trồng được bao nhiêu cây xanh?",
        question_en:
          "Team One planted 36 trees, Team Two planted 42, and Team Three planted 48. On average, how many trees did each team plant?",
        choices: [
          { id: "a", label_vi: "42 cây", correct: true },
          { id: "b", label_vi: "39 cây", correct: false },
          { id: "c", label_vi: "45 cây", correct: false },
          { id: "d", label_vi: "126 cây", correct: false },
        ],
        hint1_vi:
          "Gộp tổng số cây của cả ba đội lại trước khi chia đều.",
        hint2_vi: "Tính tổng 36 + 42 + 48.",
        hint3_vi: "Chia tổng số cây vừa tính cho 3 đội.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Tổng số cây ba đội trồng được là 36 + 42 + 48 = 126 cây. Trung bình mỗi đội trồng được 126 : 3 = 42 cây.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trung bình cộng chiều cao của 3 cây hoa hướng dương là 85 cm. Biết hai cây đầu cao 78 cm và 84 cm. Hỏi cây thứ ba cao bao nhiêu xăng-ti-mét?",
        question_en:
          "The average height of 3 sunflowers is 85 cm. The first two are 78 cm and 84 cm tall. How tall is the third sunflower?",
        choices: [
          { id: "a", label_vi: "81 cm", correct: false },
          { id: "b", label_vi: "93 cm", correct: true },
          { id: "c", label_vi: "89 cm", correct: false },
          { id: "d", label_vi: "170 cm", correct: false },
        ],
        hint1_vi:
          "Biết trung bình cộng của 3 cây là 85 cm, em tìm lại tổng chiều cao của cả 3 cây bằng phép nhân.",
        hint2_vi:
          "Lấy 85 × 3 để ra tổng chiều cao ba cây, rồi tính tổng chiều cao hai cây đã biết là 78 + 84.",
        hint3_vi:
          "Lấy tổng chiều cao của 3 cây trừ đi tổng chiều cao của 2 cây đầu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Tổng chiều cao của 3 cây là 85 × 3 = 255 cm. Tổng chiều cao hai cây đầu là 78 + 84 = 162 cm, nên cây thứ ba cao 255 − 162 = 93 cm.",
    },
  ],
};
