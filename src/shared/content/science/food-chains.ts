/**
 * Khoa học · Chuỗi thức ăn trong tự nhiên (skill: sci-food-chains, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Khoa học Lớp 5 (`GDPT2018.SCI.5.LIFE.02`).
 */
import type { LessonDefinition } from "../types";

export const foodChains: LessonDefinition = {
  id: "sci-food-chains",
  subjectId: "science",
  skillId: "sci-food-chains",
  titleVi: "Chuỗi thức ăn trong tự nhiên",
  titleEn: "Food Chains in Nature",
  objectiveVi:
    "Em sẽ xác định được sinh vật sản xuất, sinh vật tiêu thụ và mối quan hệ ăn – bị ăn.",
  objectiveEn:
    "Identify producers, consumers, and the eating relationship in a food chain.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-food-chains",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tự viết một chuỗi thức ăn ở khu vườn gần nhà em.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Chuỗi thức ăn thể hiện điều gì?",
        choices: [
          {
            id: "a",
            label_vi: "Thứ tự xếp hàng của học sinh trong lớp",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Danh sách các món ăn ngon trong một bữa cơm",
            correct: false,
          },
          { id: "c", label_vi: "Cách con người nấu ăn mỗi ngày", correct: false },
          { id: "d", label_vi: "Quan hệ ai ăn ai trong tự nhiên", correct: true },
        ],
        hint1_vi:
          "Hãy nghĩ đến cây cỏ, con sâu, con chim và mũi tên nối giữa chúng.",
        hint2_vi: "Chuỗi này kể về ai bị ai ăn.",
        hint3_vi:
          "Chuỗi thức ăn thể hiện quan hệ ăn – bị ăn giữa các sinh vật.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Chuỗi thức ăn cho thấy quan hệ ai ăn ai trong tự nhiên, nơi sinh vật này trở thành thức ăn của sinh vật khác.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong chuỗi thức ăn, ai được gọi là sinh vật sản xuất?",
        choices: [
          {
            id: "a",
            label_vi: "Con cáo, vì cáo ăn thỏ",
            correct: false,
          },
          { id: "b", label_vi: "Con thỏ, vì thỏ ăn cỏ", correct: false },
          {
            id: "c",
            label_vi:
              "Cây xanh, vì cây tự tạo ra chất dinh dưỡng nhờ quang hợp",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Con đại bàng, vì đại bàng bay cao nhất",
            correct: false,
          },
        ],
        hint1_vi: "Sinh vật đó phải đứng ở đầu chuỗi thức ăn.",
        hint2_vi: "Nó cần ánh sáng mặt trời để tự tạo thức ăn cho mình.",
        hint3_vi:
          "Cây xanh tự tạo chất dinh dưỡng nhờ quang hợp nên là sinh vật sản xuất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cây xanh tự tạo chất dinh dưỡng qua quang hợp nên đứng đầu chuỗi thức ăn và được gọi là sinh vật sản xuất.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chuỗi thức ăn nào được viết đúng thứ tự từ sinh vật sản xuất đến sinh vật tiêu thụ bậc cao?",
        choices: [
          { id: "a", label_vi: "Cỏ → châu chấu → ếch → rắn", correct: true },
          { id: "b", label_vi: "Ếch → cỏ → rắn → châu chấu", correct: false },
          { id: "c", label_vi: "Rắn → ếch → châu chấu → cỏ", correct: false },
          { id: "d", label_vi: "Châu chấu → cỏ → rắn → ếch", correct: false },
        ],
        hint1_vi: "Mũi tên chỉ từ sinh vật bị ăn đến sinh vật ăn.",
        hint2_vi: "Đầu chuỗi phải là cây xanh tự tạo thức ăn.",
        hint3_vi:
          "Thứ tự đúng là cỏ, châu chấu ăn cỏ, ếch ăn châu chấu, rắn ăn ếch.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chuỗi bắt đầu từ cây xanh, rồi đến động vật ăn cỏ, tiếp theo là động vật ăn thịt bậc thấp rồi đến bậc cao.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong chuỗi “Cỏ → châu chấu → ếch”, châu chấu là sinh vật gì?",
        choices: [
          { id: "a", label_vi: "Sinh vật sản xuất tự tạo thức ăn", correct: false },
          {
            id: "b",
            label_vi: "Sinh vật tiêu thụ bậc một ăn sinh vật sản xuất",
            correct: true,
          },
          { id: "c", label_vi: "Sinh vật tiêu thụ bậc ba", correct: false },
          { id: "d", label_vi: "Sinh vật phân hủy", correct: false },
        ],
        hint1_vi: "Hãy xem châu chấu ăn sinh vật nào trong chuỗi.",
        hint2_vi: "Châu chấu lấy thức ăn trực tiếp từ cây xanh.",
        hint3_vi: "Châu chấu ăn cỏ nên là sinh vật tiêu thụ bậc một.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Châu chấu ăn trực tiếp cỏ — sinh vật sản xuất — nên là sinh vật tiêu thụ bậc một; ếch ăn châu chấu nên là sinh vật tiêu thụ bậc hai.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nếu sâu bướm trong ruộng lúa bị người ta diệt hết, điều gì dễ xảy ra cho chim sẻ ở ruộng ấy?",
        choices: [
          {
            id: "a",
            label_vi: "Chim sẻ vẫn có nhiều thức ăn hơn trước",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chim sẻ sẽ ăn trực tiếp hạt lúa nhiều hơn nên không đổi",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chuỗi thức ăn trong ruộng vẫn giữ nguyên như cũ",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chim sẻ thiếu thức ăn và có thể bay đi nơi khác",
            correct: true,
          },
        ],
        hint1_vi: "Sâu bướm là thức ăn của ai trong ruộng lúa?",
        hint2_vi: "Mất một mắt xích sẽ làm đổi các mắt xích phía sau.",
        hint3_vi:
          "Chim sẻ thiếu sâu để ăn, khó tìm thức ăn và có thể rời ruộng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Sâu bướm là thức ăn của chim; khi sâu biến mất, chim thiếu lương thực trong chuỗi thức ăn đó và có thể phải di chuyển đi nơi khác.",
    },
  ],
};
