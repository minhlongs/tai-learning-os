/**
 * Tiếng Anh · Thời tiết và trang phục phù hợp (skill: eng-weather-clothes, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives.
 */
import type { LessonDefinition } from "../types";

export const weatherClothes: LessonDefinition = {
  id: "eng-weather-clothes",
  subjectId: "english",
  skillId: "eng-weather-clothes",
  titleVi: "Thời tiết và trang phục phù hợp",
  titleEn: "Weather and Suitable Clothes",
  objectiveVi:
    "Em sẽ hỏi đáp về thời tiết trong ngày và nêu trang phục hoặc vật dụng phù hợp khi ra ngoài bằng tiếng Anh.",
  objectiveEn:
    "Ask and answer about daily weather and choose suitable clothes or items in English.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-weather-clothes",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách nhìn ra ngoài cửa sổ buổi sáng, tự nói thời tiết và món đồ nên mặc bằng tiếng Anh.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn hỏi thời tiết hôm nay như thế nào bằng tiếng Anh, em dùng câu hỏi nào?",
        question_en:
          "Which question asks about today's weather in English?",
        choices: [
          { id: "a", label_vi: "What time is it today?", correct: false },
          { id: "b", label_vi: "Where are your clothes today?", correct: false },
          { id: "c", label_vi: "Who likes sunny days?", correct: false },
          { id: "d", label_vi: "What's the weather like today?", correct: true },
        ],
        hint1_vi: "Từ khóa chỉ “thời tiết” trong tiếng Anh là “weather”.",
        hint2_vi: "Mẫu câu quen thuộc hỏi đặc điểm thời tiết có cấu trúc “What's the ... like?”.",
        hint3_vi: "Ghép “What's the weather like” với từ “today?” ở cuối câu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“What's the weather like today?” là câu hỏi chuẩn để hỏi thời tiết hôm nay như thế nào, và thường được trả lời bằng “It's sunny / rainy / windy / cold.”.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ngoài trời đang mưa to. Câu nào miêu tả đúng thời tiết và vật dụng em cần mang theo?",
        question_en:
          "It is raining outside. Which sentence matches the weather and item to bring?",
        choices: [
          {
            id: "a",
            label_vi: "It's sunny. Put on your sunglasses.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "It's rainy. Bring an umbrella.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "It's hot. Wear a thick wool coat.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "It's windy. Drink cold water.",
            correct: false,
          },
        ],
        hint1_vi: "Trời mưa trong tiếng Anh được tạo từ danh từ “rain” thêm đuôi “-y”.",
        hint2_vi: "Khi trời mưa (“rainy”), vật dụng che mưa quen thuộc là chiếc ô.",
        hint3_vi: "Chiếc ô trong tiếng Anh là “an umbrella”, đi cùng động từ “bring” (mang theo).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Rainy” nghĩa là có mưa và “umbrella” là chiếc ô. Vì vậy “It's rainy. Bring an umbrella.” phù hợp với tình huống trời mưa.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền từ chỉ trang phục phù hợp vào câu sau: “It's cold and windy today. Remember to wear a warm ___.”",
        question_en:
          "Complete: “It's cold and windy today. Remember to wear a warm ___.”",
        choices: [
          { id: "a", label_vi: "shorts", correct: false },
          { id: "b", label_vi: "sandals", correct: false },
          { id: "c", label_vi: "coat", correct: true },
          { id: "d", label_vi: "swimsuit", correct: false },
        ],
        hint1_vi: "“Cold and windy” nghĩa là trời vừa lạnh vừa nhiều gió.",
        hint2_vi: "Trước chỗ trống có mạo từ “a” và tính từ “warm” (ấm áp), nên cần một danh từ số ít giữ ấm cơ thể.",
        hint3_vi: "Áo khoác dài giữ ấm trong tiếng Anh gồm bốn chữ cái, bắt đầu bằng chữ “c”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi trời lạnh và có gió (“cold and windy”), mặc áo khoác ấm (“wear a warm coat”) giúp giữ ấm cơ thể; quần đùi, dép xăng đan và đồ bơi đều không phù hợp.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Mẹ dặn bạn Chi trước giờ đi dã ngoại: “It's very sunny at noon, so wear a hat.” Mẹ khuyên Chi điều gì?",
        question_en:
          "Chi's mother says: “It's very sunny at noon, so wear a hat.” What does she advise?",
        choices: [
          {
            id: "a",
            label_vi: "Buổi trưa trời nắng gắt nên hãy đội mũ.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Buổi trưa trời mưa nên hãy mặc áo mưa.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Buổi tối trời lạnh nên hãy quàng khăn len.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Buổi sáng có gió nhẹ nên hãy đi giày thể thao.",
            correct: false,
          },
        ],
        hint1_vi: "Cụm “very sunny at noon” cho biết thời tiết vào buổi trưa.",
        hint2_vi: "“Sunny” là trời nắng, còn “wear a hat” nói về món đồ đội trên đầu.",
        hint3_vi: "“Hat” là chiếc mũ giúp che nắng khi đi ngoài trời buổi trưa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Very sunny at noon” là buổi trưa trời rất nắng và “wear a hat” là đội mũ, nên lời dặn có nghĩa là buổi trưa nắng gắt cần đội mũ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình em chuẩn bị đi Đà Lạt vào ngày thời tiết se lạnh và nhiều gió. Câu tiếng Anh nào giới thiệu đúng thời tiết và trang phục em chuẩn bị?",
        question_en:
          "Your family visits Da Lat on a cold and windy day. Which sentence best describes the weather and clothes?",
        choices: [
          {
            id: "a",
            label_vi: "It's cold and windy, so I wear a T-shirt and shorts.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "It cold windy, so I wearing coat.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "It's hot and sunny, so I wear a warm coat and a scarf.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "It's cold and windy, so I wear a coat and a scarf.",
            correct: true,
          },
        ],
        hint1_vi: "Trước tính từ chỉ thời tiết cần có đầy đủ chủ ngữ và động từ “It's...”.",
        hint2_vi: "Thời tiết ở Đà Lạt trong tình huống này là lạnh và nhiều gió (“cold and windy”).",
        hint3_vi: "Trang phục giữ ấm hợp lý với thời tiết đó là áo khoác (“coat”) và khăn quàng cổ (“scarf”).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “It's cold and windy, so I wear a coat and a scarf.” vừa đúng cấu trúc ngữ pháp “It's + tính từ thời tiết”, vừa chọn áo khoác và khăn quàng phù hợp với trời lạnh gió.",
    },
  ],
};
