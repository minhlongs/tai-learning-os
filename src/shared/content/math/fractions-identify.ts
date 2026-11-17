/**
 * Toán 4 · Nhận biết phân số: tử số, mẫu số và các phần bằng nhau (skill: math-frac-identify, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const fractionsIdentify: LessonDefinition = {
  id: "math-fractions-identify",
  subjectId: "math",
  skillId: "math-frac-identify",
  titleVi: "Nhận biết phân số: tử số và mẫu số",
  titleEn: "Identifying Fractions: Numerator and Denominator",
  objectiveVi:
    "Em sẽ hiểu ý nghĩa của tử số, mẫu số và đọc viết đúng phân số chỉ số phần bằng nhau được lấy ra.",
  objectiveEn:
    "Understand numerator and denominator and identify fractions representing equal parts of a whole.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-frac-identify",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 1 ngày và 3 ngày bằng cách chia đều tờ giấy hoặc thanh phân số thành các phần bằng nhau.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong phân số 3/7, mẫu số là 7 cho em biết điều gì?",
        question_en:
          "In the fraction 3/7, what does the denominator 7 tell you?",
        choices: [
          { id: "a", label_vi: "Số phần được tô màu là 7 phần.", correct: false },
          {
            id: "b",
            label_vi: "Tổng của tử số và mẫu số cộng lại với nhau đúng bằng 7 nên mẫu số chính là 7.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Một đơn vị trọn vẹn được chia thành 7 phần bằng nhau.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Có 3 cái bánh xếp thành 7 hàng khác nhau.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trong một phân số, số viết dưới dấu gạch ngang là mẫu số, còn số viết trên là tử số.",
        hint2_vi:
          "Mẫu số luôn gắn với cách chia đều toàn bộ hình hoặc vật ban đầu.",
        hint3_vi:
          "Em hãy nghĩ xem toàn bộ đơn vị đã được chia thành bao nhiêu phần có kích thước như nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trong phân số 3/7, mẫu số 7 viết dưới dấu gạch ngang cho biết cả đơn vị được chia thành 7 phần bằng nhau, còn tử số 3 cho biết ta lấy 3 phần trong số đó.",
    },
    {
      position: 2,
      kind: "visual",
      content: {
        type: "fraction_visual",
        question_vi:
          "Thanh bên dưới được chia thành 5 phần bằng nhau, trong đó có 3 phần được tô màu. Phân số tối giản biểu thị phần đã tô màu là gì?",
        question_en:
          "The bar below is divided into 5 equal parts with 3 parts shaded. What fraction in simplest form is shaded?",
        allowedDenominators: [3, 5, 8],
        maxParts: 8,
        correctNumerator: 3,
        correctDenominator: 5,
        bar: { parts: 5, highlighted: 3 },
      },
      answerKey: JSON.stringify({ correctNumerator: 3, correctDenominator: 5 }),
      explanationVi:
        "Thanh được chia thành 5 phần bằng nhau nên mẫu số là 5; có 3 phần được tô màu nên tử số là 3. Phân số tối giản cần tìm là 3/5.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một chiếc bánh chưng vuông được cắt thành 8 miếng bằng nhau. Gia đình em đã ăn hết 5 miếng. Phân số chỉ phần bánh còn lại là phân số nào?",
        question_en:
          "A square rice cake is cut into 8 equal pieces, and 5 pieces are eaten. What fraction of the cake remains?",
        choices: [
          { id: "a", label_vi: "3/8", correct: true },
          { id: "b", label_vi: "5/8", correct: false },
          { id: "c", label_vi: "3/5", correct: false },
          { id: "d", label_vi: "8/3", correct: false },
        ],
        hint1_vi:
          "Đề bài hỏi phần bánh còn lại chứ không phải phần bánh đã ăn.",
        hint2_vi:
          "Từ 8 miếng ban đầu, ăn hết 5 miếng thì còn lại mấy miếng?",
        hint3_vi:
          "Đặt số miếng còn lại ở tử số và tổng số 8 miếng bằng nhau ban đầu ở mẫu số.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chiếc bánh chia thành 8 miếng bằng nhau nên mẫu số là 8. Ăn hết 5 miếng thì còn lại 8 − 5 = 3 miếng, vậy phân số chỉ phần bánh còn lại là 3/8.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cách chia nào dưới đây cho phép em viết phân số 1/4 để chỉ một phần lấy ra?",
        question_en:
          "Which way of dividing allows you to write the fraction 1/4 for one chosen part?",
        choices: [
          {
            id: "a",
            label_vi: "Cắt một sợi dây thành 4 đoạn dài ngắn tùy ý rồi lấy 1 đoạn.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chia một tờ giấy thành 3 phần bằng nhau rồi lấy 1 phần.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chia thanh gỗ thành 4 đoạn, trong đó đoạn đầu dài gấp đôi mỗi đoạn còn lại, rồi lấy đoạn đầu tiên làm phần đã lấy ra.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Gấp đôi tờ giấy hình chữ nhật hai lần liên tiếp thành 4 phần chồng khít lên nhau rồi tô màu 1 phần.",
            correct: true,
          },
        ],
        hint1_vi:
          "Một phân số chỉ đúng khi các phần được chia ra phải hoàn toàn bằng nhau.",
        hint2_vi:
          "Em hãy kiểm tra xem trường hợp nào vừa có đúng 4 phần vừa bảo đảm các phần chồng khít bằng nhau.",
        hint3_vi:
          "Gấp đôi một lần được 2 phần bằng nhau; gấp đôi thêm lần nữa thì 2 phần đó thành mấy phần bằng nhau?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Muốn biểu diễn phân số 1/4, cả đơn vị phải được chia thành 4 phần bằng nhau. Gấp đôi tờ giấy hai lần tạo ra 4 phần chồng khít bằng nhau, tô màu 1 phần chính là 1/4.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một luống rau chia thành 11 ô bằng nhau: 4 ô trồng cải ngọt, 2 ô trồng rau muống, các ô còn lại trồng xà lách. Phân số chỉ phần luống rau trồng xà lách là bao nhiêu?",
        question_en:
          "A garden bed has 11 equal plots: 4 with sweet cabbage, 2 with water spinach, and the rest with lettuce. What fraction is planted with lettuce?",
        choices: [
          { id: "a", label_vi: "6/11", correct: false },
          { id: "b", label_vi: "5/11", correct: true },
          { id: "c", label_vi: "4/11", correct: false },
          { id: "d", label_vi: "5/6", correct: false },
        ],
        hint1_vi:
          "Trước hết em tính tổng số ô đã trồng cải ngọt và rau muống.",
        hint2_vi:
          "Lấy tổng số 11 ô trừ đi số ô trồng hai loại rau kia để tìm số ô trồng xà lách.",
        hint3_vi:
          "Đặt số ô trồng xà lách ở tử số và tổng số 11 ô bằng nhau của cả luống ở mẫu số.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Số ô trồng cải ngọt và rau muống là 4 + 2 = 6 ô. Số ô trồng xà lách còn lại là 11 − 6 = 5 ô trong tổng số 11 ô bằng nhau, nên phân số cần tìm là 5/11.",
    },
  ],
};
