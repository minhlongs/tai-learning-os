/**
 * Toán · So sánh phân số (skill: math-frac-compare, lớp 4–5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 Mathematics objectives (`GDPT2018.MATH.4.FRAC.02`).
 */
import type { LessonDefinition } from "../types";

export const fractionsCompare: LessonDefinition = {
  id: "math-fractions-compare",
  subjectId: "math",
  skillId: "math-frac-compare",
  titleVi: "So sánh hai phân số",
  titleEn: "Comparing Fractions",
  objectiveVi:
    "Em sẽ biết so sánh hai phân số cùng mẫu số và quy đồng mẫu số để so sánh hai phân số khác mẫu số.",
  objectiveEn:
    "Compare fractions with like denominators and find a common denominator to compare unlike fractions.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-math-frac-comp",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 1 ngày và 3 ngày bằng thanh phân số cùng độ dài.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi hai phân số có cùng mẫu số (ví dụ 3/7 và 5/7), vì sao ta chỉ cần so sánh tử số?",
        question_en: "When two fractions have the same denominator, why can we just compare their numerators?",
        choices: [
          {
            id: "a",
            label_vi: "Vì mỗi phần đều có kích thước bằng nhau, nên bên nào lấy nhiều phần hơn thì lớn hơn.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Vì mẫu số lúc nào cũng lớn hơn tử số.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì hai phân số đó bằng nhau.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vì không cần nhìn vào mẫu số của bất kỳ phân số nào.",
            correct: false,
          },
        ],
        hint1_vi: "Mẫu số cho biết cái bánh được chia thành bao nhiêu phần bằng nhau.",
        hint2_vi: "Nếu cả hai đều chia thành 7 phần bằng nhau, thì mỗi phần 1/7 có bằng nhau không?",
        hint3_vi: "5 phần 1/7 so với 3 phần 1/7 thì bên nào nhiều hơn?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Cùng mẫu số nghĩa là đơn vị được chia thành các phần đều nhau có cùng độ lớn. Do đó phân số nào có tử số lớn hơn thì lấy nhiều phần hơn và lớn hơn.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "fraction_visual",
        question_vi:
          "Thanh bên dưới chia thành 6 phần bằng nhau và tô màu 4 phần (4/6). Nếu đổi về mẫu số 3 thì phân số tương ứng là bao nhiêu?",
        question_en: "4/6 of the bar is shaded. What is the equivalent fraction with denominator 3?",
        allowedDenominators: [2, 3, 6],
        maxParts: 6,
        correctDenominator: 3,
        correctNumerator: 2,
        bar: { parts: 6, highlighted: 4 },
      },
      answerKey: JSON.stringify({ correctNumerator: 2, correctDenominator: 3 }),
      explanationVi:
        "Gộp mỗi 2 ô nhỏ thành 1 phần lớn thì 6 ô tạo thành 3 phần bằng nhau, trong đó 4 ô được tô màu ứng với 2 phần lớn, tức là 2/3.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Để so sánh 1/2 và 3/8, cách làm nào sau đây là đúng nhất?",
        question_en: "What is the best way to compare 1/2 and 3/8?",
        choices: [
          {
            id: "a",
            label_vi: "Đổi 1/2 thành 4/8 để cùng mẫu số 8, rồi so sánh 4/8 > 3/8.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "So sánh tử số 1 < 3 nên kết luận 1/2 < 3/8.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cộng tử số với tử số và mẫu số với mẫu số.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "So sánh mẫu số 2 < 8 nên kết luận 1/2 < 3/8.",
            correct: false,
          },
        ],
        hint1_vi: "Hai phân số này chưa có cùng mẫu số nên kích thước mỗi phần khác nhau.",
        hint2_vi: "Nhân cả tử và mẫu của 1/2 với 4 thì được phân số nào có mẫu số là 8?",
        hint3_vi: "Sau khi đổi 1/2 thành 4/8, em hãy so sánh 4/8 với 3/8.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi quy đồng 1/2 = 4/8, cả hai phân số có cùng mẫu số 8. Vì 4 > 3 nên 4/8 > 3/8, tức là 1/2 > 3/8.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Phân số nào lớn hơn trong hai phân số 2/3 và 5/6?",
        question_en: "Which fraction is greater: 2/3 or 5/6?",
        choices: [
          { id: "a", label_vi: "2/3 lớn hơn 5/6", correct: false },
          { id: "b", label_vi: "5/6 lớn hơn 2/3", correct: true },
          { id: "c", label_vi: "Hai phân số bằng nhau", correct: false },
          { id: "d", label_vi: "Không so sánh được vì khác mẫu số", correct: false },
        ],
        hint1_vi: "Em hãy đổi 2/3 sang phân số có mẫu số là 6.",
        hint2_vi: "Nhân cả tử số và mẫu số của 2/3 với 2 thì được mấy phần sáu?",
        hint3_vi: "So sánh phân số vừa tìm được với 5/6.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Ta quy đồng 2/3 = 4/6. Vì 5/6 > 4/6 nên 5/6 lớn hơn 2/3.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong giờ thể dục, bạn Hải chạy được 3/4 vòng sân, còn bạn An chạy được 7/8 vòng sân. Bạn nào chạy được quãng đường dài hơn?",
        question_en: "Hai ran 3/4 of a lap and An ran 7/8 of a lap. Who ran farther?",
        choices: [
          { id: "a", label_vi: "Bạn Hải chạy dài hơn vì 1/4 lớn hơn 1/8.", correct: false },
          { id: "b", label_vi: "Hai bạn chạy quãng đường bằng nhau.", correct: false },
          { id: "c", label_vi: "Bạn An chạy dài hơn vì 3/4 = 6/8 mà 7/8 > 6/8.", correct: true },
          { id: "d", label_vi: "Bạn Hải chạy dài hơn vì 3 gần với 4.", correct: false },
        ],
        hint1_vi: "Muốn biết ai chạy xa hơn, ta cần đưa hai phân số 3/4 và 7/8 về cùng mẫu số 8.",
        hint2_vi: "Đổi 3/4 sang mẫu số 8 bằng cách nhân cả tử và mẫu với 2.",
        hint3_vi: "Giữa 6/8 vòng sân và 7/8 vòng sân, quãng đường nào dài hơn?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Đổi 3/4 = 6/8 vòng sân. Bạn An chạy được 7/8 vòng sân, mà 7/8 > 6/8 nên bạn An chạy được quãng đường dài hơn.",
    },
  ],
};
