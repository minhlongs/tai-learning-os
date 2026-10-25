/**
 * Toán · Phân số tương đương (skill: math-frac-equiv, lớp 3–4)
 *
 * Authored for TAI Learning OS. Content is original — written for this app and
 * not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const fractionsEquivalent: LessonDefinition = {
  id: "math-fractions-equivalent",
  subjectId: "math",
  skillId: "math-frac-equiv",
  titleVi: "Hai phân số bằng nhau",
  titleEn: "Equal Fractions",
  objectiveVi: "Em sẽ nhận ra hai phân số viết khác nhau nhưng chỉ cùng một lượng.",
  objectiveEn: "Recognise two fractions that look different but name the same amount.",
  gradeFrom: 3,
  gradeTo: 4,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Hai phân số viết khác nhau có thể chỉ cùng một lượng. Vì sao 1/2 và 2/4 lại bằng nhau?",
        question_en: "Why do 1/2 and 2/4 name the same amount?",
        choices: [
          { id: "a", label_vi: "Vì cả hai đều có tử số là 1.", correct: false },
          {
            id: "b",
            label_vi: "Vì chia thêm mỗi nửa thành hai phần đều nhau thì được 4 phần bằng nhau.",
            correct: true,
          },
          { id: "c", label_vi: "Vì 2 lớn hơn 1.", correct: false },
          { id: "d", label_vi: "Vì hai phân số đó có cùng mẫu số.", correct: false },
        ],
        hint1_vi: "Em hãy tưởng tượng một tấm bánh chia làm đôi, và em cầm một nửa.",
        hint2_vi: "Giờ em chia tiếp mỗi nửa đó thành hai phần đều nhau.",
        hint3_vi: "Các phần mới chia có cùng lớn nhỏ với nhau không? Nếu vậy phần bánh em cầm có đổi không?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Chia thêm làm cho tấm bánh có nhiều phần hơn, nhưng các phần mới vẫn đều nhau nên lượng bánh em cầm không đổi. 2/4 chỉ là cách viết khác của 1/2.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "fraction_visual",
        question_vi:
          "Thanh bên dưới chia thành 4 phần bằng nhau, có 2 phần được tô màu. Phần tô màu bằng phân số nào ở dạng đơn giản nhất?",
        question_en: "What fraction of the bar is shaded, in simplest form?",
        allowedDenominators: [2, 4],
        maxParts: 4,
        correctDenominator: 2,
        correctNumerator: 1,
        bar: { parts: 4, highlighted: 2 },
      },
      answerKey: JSON.stringify({ correctNumerator: 1, correctDenominator: 2 }),
      explanationVi:
        "Thanh có 4 phần đều nhau và 2 phần được tô, nên viết thành 2/4. Vì mỗi lần tô rộng bằng hai ô, ta có thể gộp cặp ô lại: chỉ còn 2 nửa và 1 nửa được tô, tức là 1/2.",
    },
    {
      position: 3,
      kind: "visual",
      content: {
        type: "fraction_visual",
        question_vi:
          "Lần này thanh chia thành 6 phần bằng nhau, có 2 phần được tô màu. Phần tô màu bằng phân số nào ở dạng đơn giản nhất?",
        question_en: "What fraction of this bar is shaded, in simplest form?",
        allowedDenominators: [2, 3, 6],
        maxParts: 6,
        correctDenominator: 3,
        correctNumerator: 1,
        bar: { parts: 6, highlighted: 2 },
      },
      answerKey: JSON.stringify({ correctNumerator: 1, correctDenominator: 3 }),
      explanationVi:
        "Sáu phần đều nhau mà có hai phần tô màu thì viết là 2/6. Gộp mỗi ba ô lại thành một nhóm, thanh chỉ còn 3 nhóm đều nhau và 1 nhóm được tô, tức là 1/3.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Em biết 1/2 = 2/4. Theo cách làm tương tự, 3/4 bằng phân số nào sau đây?",
        question_en: "Using the same idea, which fraction equals 3/4?",
        choices: [
          { id: "a", label_vi: "3/8", correct: false },
          { id: "b", label_vi: "6/8", correct: true },
          { id: "c", label_vi: "6/4", correct: false },
          { id: "d", label_vi: "9/8", correct: false },
        ],
        hint1_vi: "Để giữ đúng lượng cũ, em nhân cả tử số và mẫu số với cùng một số.",
        hint2_vi: "Mẫu số 4 nhân với 2 thì được 8. Vậy tử số phải nhân với mấy?",
        hint3_vi: "Cả tử số và mẫu số đều là các phần của cùng một phân số nên phải được nhân cùng lúc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Nhân cả tử số và mẫu số với cùng một số không làm đổi lượng. 3 × 2 = 6 và 4 × 2 = 8, nên 3/4 = 6/8.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "2/3 bằng phân số nào trong các đáp án sau?",
        question_en: "Which fraction equals 2/3?",
        choices: [
          { id: "a", label_vi: "4/6", correct: true },
          { id: "b", label_vi: "3/6", correct: false },
          { id: "c", label_vi: "4/9", correct: false },
          { id: "d", label_vi: "2/6", correct: false },
        ],
        hint1_vi: "Em hãy nhìn mẫu số của phân số đúng: nó phải là 3 nhân với một số.",
        hint2_vi: "Thử nhân cả tử số và mẫu số với cùng một số rồi xem kết quả.",
        hint3_vi: "Nếu mẫu số được đổi, tử số cũng phải đổi theo cùng một số.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nhân cả tử và mẫu của 2/3 với 2 thì được 4/6. Các đáp án khác chỉ đổi một phần hoặc đổi hai phần với hai số khác nhau, nên lượng bị thay đổi.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Lan uống 2/8 ly nước cam. Bạn Minh uống 1/4 ly nước cam. Hai bạn uống có lượng bằng nhau không?",
        question_en: "Do Lan and Minh drink the same amount of orange juice?",
        choices: [
          { id: "a", label_vi: "Không, Lan uống nhiều hơn vì 2 lớn hơn 1.", correct: false },
          { id: "b", label_vi: "Có, hai bạn uống cùng một lượng nước cam.", correct: true },
          { id: "c", label_vi: "Có, vì cả hai số đều bé.", correct: false },
          { id: "d", label_vi: "Không, Minh uống nhiều hơn vì 4 lớn hơn 8.", correct: false },
        ],
        hint1_vi: "Em đừng chỉ so tử số. Hai ly nước đang được chia thành số phần khác nhau.",
        hint2_vi: "Nếu chia ly nước thành 8 phần đều nhau thì một phần tư ly sẽ là mấy phần?",
        hint3_vi: "Em hãy đổi 1/4 sang phân số có mẫu số là 8 rồi mới so sánh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "1/4 ly tức là chia ly thành 4 phần đều nhau và lấy 1 phần; nếu chia thành 8 phần đều nhau thì lượng đó là 2 phần, tức 2/8 ly. Hai bạn uống đúng bằng nhau.",
    },
  ],
};
