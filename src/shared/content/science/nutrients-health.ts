/**
 * Khoa học · Các nhóm chất dinh dưỡng và bữa ăn cân đối (skill: sci-nutrients-health, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const nutrientsHealth: LessonDefinition = {
  id: "sci-nutrients-health",
  subjectId: "science",
  skillId: "sci-nutrients-health",
  titleVi: "Các nhóm chất dinh dưỡng và bữa ăn cân đối",
  titleEn: "Nutrient Groups and a Balanced Meal",
  objectiveVi:
    "Em phân biệt được bốn nhóm chất dinh dưỡng cùng vai trò của nước, chất xơ và biết cách lựa chọn thực phẩm cho bữa ăn cân đối, lành mạnh.",
  objectiveEn:
    "Distinguish the four main nutrient groups plus water and fiber, and design a balanced, healthy daily meal.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-nutrients-health",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách cùng bố mẹ gọi tên các nhóm chất dinh dưỡng có trong mâm cơm tối của gia đình.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cơm gạo, bún, phở, khoai lang và ngô chứa nhiều nhóm chất dinh dưỡng nào dưới đây, giúp cung cấp nguồn năng lượng chủ yếu cho mọi hoạt động học tập và vận động hằng ngày?",
        question_en:
          "Rice, noodles, sweet potatoes, and corn are rich in which nutrient group that provides our main daily energy?",
        choices: [
          {
            id: "a",
            label_vi: "Nhóm chất béo từ mỡ động vật.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Nhóm chất khoáng tạo vỏ cứng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nhóm nước tinh khiết không sinh năng lượng.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Nhóm chất bột đường.",
            correct: true,
          },
        ],
        hint1_vi:
          "Trong bốn nhóm chất dinh dưỡng chính (chất bột đường, chất đạm, chất béo, vi-ta-min và chất khoáng), nhóm nào có nhiều trong lương thực như lúa gạo, khoai, ngô?",
        hint2_vi:
          "Khi vận động chạy nhảy lâu mà chưa ăn cơm hay bánh mì, cơ thể thường thấy đói và thiếu sức.",
        hint3_vi:
          "Gạo, bún, khoai, ngô thuộc nhóm chất bột đường — nguồn cung cấp năng lượng chủ yếu cho cơ thể.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Thức ăn hằng ngày gồm bốn nhóm chất dinh dưỡng chính: chất bột đường, chất đạm, chất béo, vi-ta-min và chất khoáng. Trong đó, cơm, bún, ngô, khoai giàu chất bột đường cung cấp năng lượng chủ yếu cho mọi hoạt động.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thịt nạc, cá, tôm, trứng, sữa và đậu phụ là những thức ăn giàu nhóm chất nào và có vai trò nổi bật gì đối với lứa tuổi học sinh?",
        question_en:
          "Lean meat, fish, shrimp, eggs, milk, and tofu are rich in which nutrient group, and how do they help growing children?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ chứa chất xơ thô giúp cọ sạch men răng như bàn chải.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Giàu chất đạm, giúp xây dựng và đổi mới cơ thể để em lớn lên khỏe mạnh.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Chỉ chứa nước lọc tinh khiết giúp giải khát mát ruột vào lúc trời nắng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Giàu đường tinh luyện ngọt đậm và chất béo bão hòa dồi dào năng lượng dư thừa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Cơ bắp, máu và các tế bào mới trong cơ thể trẻ em đang cao lớn mỗi ngày cần nguyên liệu xây dựng nào?",
        hint2_vi:
          "Chất dinh dưỡng này có cả từ nguồn động vật (thịt, cá, trứng, sữa) và thực vật (đậu nành, đậu phụ, các loại đỗ).",
        hint3_vi:
          "Đó là nhóm chất đạm — thành phần thiết yếu giúp cơ thể phát triển chiều cao, cơ bắp và phục hồi vết thương.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thịt, cá, tôm, trứng, sữa và các loại đậu giàu chất đạm. Chất đạm đóng vai trò xây dựng và đổi mới các tế bào mới làm cơ thể lớn lên và khỏe mạnh.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao bên cạnh chất bột đường, chất đạm và chất béo, hằng ngày chúng ta vẫn cần ăn đủ rau xanh, quả chín và uống đủ nước sạch?",
        question_en:
          "Besides carbohydrates, proteins, and fats, why must we eat green vegetables, ripe fruits, and drink enough clean water every day?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì rau quả tươi có thể thay thế hoàn toàn cơm trắng, thịt cá và dầu mỡ suốt cả năm mà không cần thực phẩm khác.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì chất xơ thô trong rau xanh biến thẳng thành lớp mỡ dự trữ săn chắc tích tụ dưới da bụng.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì chúng cung cấp vi-ta-min, chất khoáng và chất xơ giúp tăng sức đề kháng, tiêu hóa tốt.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Vì uống nhiều nước và ăn nhiều rau làm dạ dày khỏi phải tiêu hóa bất kỳ thức ăn nào nữa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Khi cơ thể thiếu rau xanh, hoa quả tươi và uống quá ít nước trong nhiều ngày, hệ tiêu hóa thường gặp khó khăn gì?",
        hint2_vi:
          "Rau củ và trái cây tươi rất giàu vi-ta-min, chất khoáng và chất xơ dù không sinh nhiều năng lượng.",
        hint3_vi:
          "Vi-ta-min và chất khoáng giúp cơ thể hoạt động bình thường, phòng bệnh; còn chất xơ và nước giúp tiêu hóa êm ái, ngăn ngừa táo bón.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Rau xanh và quả chín cung cấp nhiều vi-ta-min, chất khoáng giúp tăng sức đề kháng và phòng bệnh; đồng thời bổ sung chất xơ cùng nước sạch giúp hệ tiêu hóa hoạt động trơn tru, tránh táo bón.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thực đơn bữa trưa nào dưới đây phối hợp đầy đủ, cân đối cả bốn nhóm chất dinh dưỡng cùng chất xơ?",
        question_en:
          "Which lunch menu below provides a balanced combination of all four nutrient groups and dietary fiber?",
        choices: [
          {
            id: "a",
            label_vi: "Cơm trắng, đậu phụ nhồi thịt sốt cà chua nấu dầu thực vật, canh rau ngót nấu tôm và chuối chín.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Một bát cơm trắng chan nước xì dầu mặn, ăn kèm hai củ khoai lang luộc và một chiếc bánh quy ngọt phủ kem.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Hai đùi gà chiên giòn rụm nhiều dầu mỡ, một cây xúc xích nướng và một lon nước ngọt có ga ướp lạnh.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ ăn một đĩa dưa chuột thái lát và uống hai cốc nước lọc.",
            correct: false,
          },
        ],
        hint1_vi:
          "Một bữa ăn cân đối cần có mặt đủ: chất bột đường, chất đạm, một lượng vừa phải chất béo lành mạnh, cùng rau quả giàu vi-ta-min, chất khoáng và chất xơ.",
        hint2_vi:
          "Hãy loại trừ những thực đơn toàn tinh bột (cơm + khoai + bánh), toàn đồ chiên ngọt thiếu rau, hoặc chỉ có rau nước thiếu năng lượng.",
        hint3_vi:
          "Thực đơn có cơm (bột đường), đậu phụ - thịt - tôm (đạm động vật và thực vật), dầu thực vật (béo giúp hấp thu vi-ta-min), rau ngót và chuối chín (vi-ta-min, khoáng, chất xơ) là cân đối nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bữa ăn cân đối phối hợp đa dạng thực phẩm: cơm cung cấp chất bột đường; thịt, tôm và đậu phụ cung cấp chất đạm; dầu thực vật cung cấp chất béo; rau ngót, cà chua và chuối chín bổ sung vi-ta-min, chất khoáng và chất xơ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bạn nhỏ thường xuyên bỏ món canh rau, chỉ thích ăn gà rán nhiều dầu mỡ và uống trà sữa ngọt mỗi ngày, lại ít vận động ngoài trời. Nếu duy trì thói quen ấy lâu dài, sức khỏe của bạn dễ gặp nguy cơ nào nhất?",
        question_en:
          "A child regularly skips vegetables, eats deep-fried chicken and sugary drinks daily, and rarely exercises. What health risk is most likely over time?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cơ thể sẽ dẻo dai hơn hẳn và hệ tiêu hóa chạy êm ru nhờ ăn toàn đồ chiên rán mỗi ngày.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chiều cao tăng vọt thấy rõ chỉ sau vài tuần, răng miệng chắc khỏe và không bao giờ bị sâu.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cơ thể tự tích trữ được đầy đủ mọi loại vi-ta-min và chất xơ từ trong nước trà sữa ngọt lịm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Dư thừa năng lượng gây thừa cân béo phì, kèm thiếu chất xơ và vi-ta-min gây táo bón, giảm sức đề kháng.",
            correct: true,
          },
        ],
        hint1_vi:
          "Đồ chiên rán và thức uống nhiều đường đưa vào cơ thể quá nhiều chất béo và chất đường so với nhu cầu vận động.",
        hint2_vi:
          "Bỏ rau củ quả làm cơ thể thiếu hụt nghiêm trọng chất xơ, vi-ta-min và chất khoáng.",
        hint3_vi:
          "Ăn thừa chất béo, đường mà thiếu rau xanh và vận động sẽ dẫn đến thừa cân béo phì, táo bón và cơ thể dễ mệt mỏi, ốm vặt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Không có loại thức ăn đơn lẻ nào chứa đủ mọi chất cần thiết. Ăn quá nhiều đồ chiên ngọt gây dư thừa chất béo và đường dẫn tới béo phì, trong khi bỏ rau quả làm thiếu chất xơ và vi-ta-min gây táo bón, suy giảm sức đề kháng.",
    },
  ],
};
