/**
 * Tiếng Anh · So sánh nhất của tính từ ngắn và tính từ dài (skill: eng-superlatives, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives.
 */
import type { LessonDefinition } from "../types";

export const superlatives: LessonDefinition = {
  id: "eng-superlatives",
  subjectId: "english",
  skillId: "eng-superlatives",
  titleVi: "So sánh nhất với tính từ ngắn và tính từ dài",
  titleEn: "Superlatives with Short and Long Adjectives",
  objectiveVi:
    "Em sẽ tạo và sử dụng đúng dạng so sánh nhất của cả tính từ ngắn (the + adj-est) lẫn tính từ dài (the most + adj) khi so sánh từ ba đối tượng trở lên.",
  objectiveEn:
    "Form and use superlatives of short and long adjectives to compare three or more items.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-superlatives",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đặt một câu so sánh nhất với tính từ ngắn (như “the tallest”, “the biggest”) và một câu với tính từ dài (như “the most interesting”).",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cách tạo dạng so sánh nhất giữa tính từ ngắn (như “tall”, “long”) và tính từ dài (như “peaceful”, “interesting”) khác nhau như thế nào?",
        question_en:
          "How do superlative forms differ between short adjectives and long adjectives?",
        choices: [
          {
            id: "a",
            label_vi: "Cả tính từ ngắn lẫn tính từ dài đều thêm đuôi “-er” và chữ “than”.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tính từ ngắn dùng “the + tính từ-est”, còn tính từ dài dùng “the most + tính từ”.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Tính từ ngắn dùng “the most + tính từ”, còn tính từ dài chỉ thêm đuôi “-est” vào cuối.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cả hai loại đều giữ nguyên tính từ và chỉ thêm từ “very” phía trước.",
            correct: false,
          },
        ],
        hint1_vi: "So sánh nhất luôn có mạo từ xác định “the” đứng ở đầu cụm tính từ.",
        hint2_vi: "Đuôi “-er ... than” là của so sánh hơn giữa hai vật, không phải so sánh nhất trong một nhóm.",
        hint3_vi: "Từ ngắn một âm tiết như “tall” thêm đuôi “-est”, còn từ nhiều âm tiết như “peaceful” đặt “the most” ở phía trước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Trong câu so sánh nhất (từ ba đối tượng trở lên), tính từ ngắn dùng cấu trúc “the + adj-est” (như “the tallest”), còn tính từ dài từ hai âm tiết trở lên dùng “the most + adj” (như “the most peaceful”).",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi chuyển tính từ ngắn “big” (to lớn) sang dạng so sánh nhất, cách viết nào đúng quy tắc chính tả?",
        question_en:
          "Which spelling is the correct superlative form of the short adjective “big”?",
        choices: [
          { id: "a", label_vi: "the bigest", correct: false },
          { id: "b", label_vi: "the most big", correct: false },
          { id: "c", label_vi: "the biggest", correct: true },
          { id: "d", label_vi: "bigger than", correct: false },
        ],
        hint1_vi: "“Big” là tính từ ngắn một âm tiết nên thêm đuôi “-est” sau chữ “the”, không dùng “most”.",
        hint2_vi: "Quan sát ba chữ cái của “big”: phụ âm “b” + một nguyên âm ngắn “i” + một phụ âm cuối “g”.",
        hint3_vi: "Theo quy tắc chính tả, cần gấp đôi phụ âm cuối “g” trước khi gắn đuôi “-est”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "“Big” kết thúc bằng một nguyên âm đơn đứng trước một phụ âm đơn nên phải gấp đôi chữ “g” thành “the biggest”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền cụm so sánh nhất thích hợp vào câu: “This science book is ___ book on my shelf.” (với tính từ “interesting” — thú vị).",
        question_en:
          "Complete: “This science book is ___ book on my shelf.” using “interesting”.",
        choices: [
          { id: "a", label_vi: "the most interesting", correct: true },
          { id: "b", label_vi: "the interestingest", correct: false },
          { id: "c", label_vi: "more interesting", correct: false },
          { id: "d", label_vi: "most interestingest", correct: false },
        ],
        hint1_vi: "Hãy đếm số âm tiết của từ “in-ter-est-ing” — đây là một tính từ dài.",
        hint2_vi: "Tính từ dài không gắn thêm đuôi “-est” vào cuối từ.",
        hint3_vi: "Đặt cụm “the most” đứng ngay trước tính từ dài nguyên gốc để tạo dạng so sánh nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Interesting” là tính từ dài nhiều âm tiết nên dạng so sánh nhất chuẩn là “the most interesting”: “This science book is the most interesting book on my shelf.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong ba dòng sông được nhắc trên bản đồ địa lí, em muốn nói sông Mê Kông dài nhất. Câu tiếng Anh nào đúng?",
        question_en:
          "Among the three rivers on the map, which sentence says the Mekong River is the longest?",
        choices: [
          {
            id: "a",
            label_vi: "The Mekong is longest than the other two rivers.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "The Mekong is the most long river of the three.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "The Mekong is longer river of the three.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "The Mekong is the longest river of the three.",
            correct: true,
          },
        ],
        hint1_vi: "Câu đang so sánh trong nhóm ba dòng sông (“of the three”) nên phải dùng so sánh nhất, không dùng “than”.",
        hint2_vi: "“Long” là tính từ ngắn một âm tiết.",
        hint3_vi: "Đừng quên mạo từ “the” đứng trước tính từ ngắn có gắn đuôi “-est” bổ nghĩa cho danh từ “river”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Long” là tính từ ngắn nên khi so sánh trong ba đối tượng (“of the three”) ta dùng “the longest”: “The Mekong is the longest river of the three.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em viết bưu thiếp kể về quê ngoại: ngôi làng là nơi yên bình nhất (“peaceful”) và có cây đa cao nhất (“tall”) trong vùng. Câu nào kết hợp đúng cả tính từ dài lẫn tính từ ngắn?",
        question_en:
          "Which sentence accurately uses superlatives for both “peaceful” and “tall”?",
        choices: [
          {
            id: "a",
            label_vi: "My grandparents' village is the peacefulest place and has the most tall banyan tree in the area.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "My grandparents' village is the most peaceful place and has the tallest banyan tree in the area.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "My grandparents' village is most peaceful place and has tallest banyan tree than the area.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "My grandparents' village is the more peaceful place and has the taller banyan tree in the area.",
            correct: false,
          },
        ],
        hint1_vi: "Phân loại hai tính từ: “peaceful” có hai âm tiết kết thúc bằng đuôi “-ful” (tính từ dài), còn “tall” có một âm tiết (tính từ ngắn).",
        hint2_vi: "Với “peaceful”, dùng cụm “the most” đứng trước; với “tall”, gắn đuôi “-est” vào sau tính từ.",
        hint3_vi: "Kiểm tra cả hai cụm so sánh nhất đều có đầy đủ chữ “the” và không dùng “more / -er”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Peaceful” (tính từ dài) chuyển thành “the most peaceful”, còn “tall” (tính từ ngắn) chuyển thành “the tallest”, nên câu đúng là “My grandparents' village is the most peaceful place and has the tallest banyan tree in the area.”.",
    },
  ],
};
