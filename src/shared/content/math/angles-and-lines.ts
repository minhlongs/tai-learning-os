/**
 * Toán 4 · Các loại góc, đường thẳng vuông góc và song song (skill: math-angles-lines, lớp 4)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const anglesAndLines: LessonDefinition = {
  id: "math-angles-and-lines",
  subjectId: "math",
  skillId: "math-angles-lines",
  titleVi: "Các loại góc, đường thẳng vuông góc và song song",
  titleEn: "Angles, Perpendicular Lines, and Parallel Lines",
  objectiveVi:
    "Em sẽ phân biệt góc nhọn, góc vuông, góc tù, góc bẹt và nhận diện hai đường thẳng vuông góc hoặc song song.",
  objectiveEn:
    "Classify acute, right, obtuse, and straight angles, and identify perpendicular and parallel lines.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-math-angles-lines",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 6 ngày bằng cách dùng ê-ke kiểm tra các góc trong phòng học.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi lấy góc vuông (90°) của thước ê-ke làm chuẩn để so sánh, góc tù là góc có số đo như thế nào?",
        question_en:
          "Using the 90° right angle of a set square as a reference, how is an obtuse angle described?",
        choices: [
          { id: "a", label_vi: "Nhỏ hơn góc vuông.", correct: false },
          {
            id: "b",
            label_vi: "Bằng đúng một góc vuông 90° (không hơn không kém).",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Lớn hơn góc vuông (90°) nhưng nhỏ hơn góc bẹt (180°).",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Bằng đúng hai góc vuông ghép lại (180°).",
            correct: false,
          },
        ],
        hint1_vi:
          "Góc nhỏ hơn góc vuông được gọi là góc nhọn, còn góc mở rộng hơn góc vuông thì sao?",
        hint2_vi:
          "Nếu hai cạnh mở thẳng hàng tạo thành một đường thẳng (180°) thì đó đã là góc bẹt.",
        hint3_vi:
          "Góc tù có độ mở nằm ở khoảng giữa góc vuông 90° và góc bẹt 180°.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Góc vuông có số đo 90° và góc bẹt có số đo 180°. Góc nhọn bé hơn 90°, còn góc tù lớn hơn 90° nhưng nhỏ hơn 180°.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cho bốn góc có số đo lần lượt là 45°, 90°, 135° và 180°. Số đo nào là của góc nhọn?",
        question_en:
          "Among the four angle measures 45°, 90°, 135°, and 180°, which one is an acute angle?",
        choices: [
          { id: "a", label_vi: "90°", correct: false },
          { id: "b", label_vi: "45°", correct: true },
          { id: "c", label_vi: "135°", correct: false },
          { id: "d", label_vi: "180°", correct: false },
        ],
        hint1_vi: "Góc nhọn là góc có độ mở hẹp hơn góc vuông.",
        hint2_vi: "Góc vuông có số đo đúng bằng 90°.",
        hint3_vi:
          "Em hãy tìm số đo nhỏ hơn 90° trong các số đo đã cho.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Góc nhọn có số đo lớn hơn 0° và nhỏ hơn 90°. Trong các số đo đã cho, chỉ có 45° nhỏ hơn 90° nên 45° là góc nhọn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Phát biểu nào dưới đây mô tả đúng hai đường thẳng song song trong cùng một mặt phẳng?",
        question_en:
          "Which statement accurately describes two parallel lines in the same plane?",
        choices: [
          {
            id: "a",
            label_vi:
              "Hai đường thẳng kéo dài mãi về hai phía cũng không bao giờ cắt nhau.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Hai đường thẳng cắt nhau tạo thành bốn góc vuông.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Hai đường thẳng cắt nhau tạo thành hai góc nhọn và hai góc tù.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Hai đoạn thẳng ngắn chưa chạm nhau trên trang giấy nhưng kéo dài ra sẽ cắt nhau.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy liên tưởng đến hai thanh ray thẳng của đường tàu hỏa hoặc hai mép đối diện của trang vở.",
        hint2_vi:
          "Hai đường thẳng tạo thành góc vuông khi cắt nhau là hai đường thẳng vuông góc, không phải song song.",
        hint3_vi:
          "Đường thẳng không giới hạn độ dài, nên hai đường thẳng song song dù kéo dài mãi vẫn giữ khoảng cách đều nhau và không có điểm chung.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Trong cùng một mặt phẳng, hai đường thẳng song song không có điểm chung nào; dù kéo dài mãi về cả hai phía chúng vẫn không bao giờ cắt nhau.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trên cùng một mặt phẳng, hai đường thẳng phân biệt m và n cùng vuông góc với đường thẳng p. Khi đó hai đường thẳng m và n có quan hệ gì với nhau?",
        question_en:
          "In the same plane, two distinct lines m and n are both perpendicular to line p. How are lines m and n related?",
        choices: [
          {
            id: "a",
            label_vi: "Hai đường thẳng m và n vuông góc với nhau.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Hai đường thẳng m và n cắt nhau tạo thành góc nhọn.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Hai đường thẳng m và n trùng nhau.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Hai đường thẳng m và n song song với nhau.",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy quan sát hai cạnh chiều rộng của hình chữ nhật: cả hai đều vuông góc với cạnh chiều dài.",
        hint2_vi:
          "Đặt thước ê-ke vẽ hai vạch thẳng phân biệt cùng tạo góc 90° với một đường thẳng chuẩn p.",
        hint3_vi:
          "Hai vạch thẳng đó đi cùng một hướng và không bao giờ cắt nhau, vậy chúng có quan hệ gì?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Trong cùng một mặt phẳng, hai đường thẳng phân biệt m và n cùng vuông góc với đường thẳng thứ ba p thì luôn song song với nhau, giống như các bậc thang ngang cùng vuông góc với thành thang.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đúng 3 giờ chiều, kim giờ chỉ số 3 và kim phút chỉ số 12 tạo thành một góc vuông (90°). Đúng 4 giờ chiều, kim phút chỉ số 12 còn kim giờ chỉ số 4 thì hai kim đồng hồ tạo thành góc gì?",
        question_en:
          "At 3 o'clock, the hands form a right angle (90°). At 4 o'clock, with the minute hand on 12 and the hour hand on 4, what kind of angle do the two hands form?",
        choices: [
          { id: "a", label_vi: "Góc nhọn", correct: false },
          { id: "b", label_vi: "Góc vuông", correct: false },
          { id: "c", label_vi: "Góc tù", correct: true },
          { id: "d", label_vi: "Góc bẹt", correct: false },
        ],
        hint1_vi:
          "Lúc 3 giờ hai kim tạo góc vuông 90°; đến 6 giờ hai kim thẳng hàng tạo góc bẹt 180°.",
        hint2_vi:
          "Lúc 4 giờ, kim phút vẫn ở số 12 nhưng kim giờ đã nhích qua số 3 để tới số 4, làm góc mở rộng hơn lúc 3 giờ.",
        hint3_vi:
          "Góc có độ mở lớn hơn góc vuông nhưng chưa thẳng hàng như góc bẹt thuộc loại góc nào?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Lúc 3 giờ hai kim tạo góc vuông 90°, lúc 6 giờ tạo góc bẹt 180°. Lúc 4 giờ độ mở giữa hai kim là 120°, lớn hơn 90° và nhỏ hơn 180°, nên đó là góc tù.",
    },
  ],
};
