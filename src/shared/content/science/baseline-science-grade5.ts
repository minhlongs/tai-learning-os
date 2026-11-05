/**
 * Khoa học · Khảo sát năng lực đầu vào Khoa học Lớp 5 (skill: sci-life-cycles, lớp 5)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering core grade-level prerequisites.
 */
import type { LessonDefinition } from "../types";

export const baselineScienceGrade5: LessonDefinition = {
  id: "sci-baseline-grade5",
  subjectId: "science",
  skillId: "sci-life-cycles",
  titleVi: "Khảo sát đầu vào Khoa học Lớp 5",
  titleEn: "Science Grade 5 Baseline Diagnostic",
  objectiveVi:
    "Khảo sát nhẹ nhàng kiến thức nền về sinh vật, chuỗi thức ăn và môi trường trước khi học lớp 5.",
  objectiveEn:
    "Gentle baseline check of living things, food chains, and the environment before Grade 5.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-life-cycles",
  provenance: "original_supplemental",
  sourceRef:
    "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS theo khung GDPT 2018",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Khảo sát đầu vào để phụ huynh nắm năng lực xuất phát điểm, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Dấu hiệu nào cho thấy một vật đang sống?",
        choices: [
          { id: "a", label_vi: "Có màu sắc tươi sáng", correct: false },
          { id: "b", label_vi: "Có hình dáng tròn hoặc vuông", correct: false },
          { id: "c", label_vi: "Cần nước, lớn lên và sinh sản được", correct: true },
          { id: "d", label_vi: "Được đặt trên bàn học", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến điều mà người và cây đều làm được.",
        hint2_vi: "Sinh vật sống phải lấy thức ăn, nước và lớn lên.",
        hint3_vi: "Sinh vật sống cần nước, lớn lên và sinh sản được.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cần nước, lớn lên và sinh sản là những dấu hiệu của sinh vật sống; màu sắc hay hình dáng không quyết định vật có sống hay không.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trong chuỗi “Cỏ → thỏ → cáo”, ai là sinh vật sản xuất?",
        choices: [
          { id: "a", label_vi: "Cáo", correct: false },
          { id: "b", label_vi: "Thỏ", correct: false },
          { id: "c", label_vi: "Cả thỏ và cáo", correct: false },
          { id: "d", label_vi: "Cỏ", correct: true },
        ],
        hint1_vi: "Sinh vật sản xuất đứng ở đầu chuỗi thức ăn.",
        hint2_vi: "Chỉ cây xanh tự tạo được chất dinh dưỡng nhờ ánh sáng.",
        hint3_vi: "Cỏ là cây xanh nên là sinh vật sản xuất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cỏ tự tạo chất dinh dưỡng nhờ quang hợp nên đứng đầu chuỗi; thỏ và cáo chỉ lấy thức ăn từ sinh vật khác.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi: "Vòng đời của một chú bướm được bắt đầu từ đâu?",
        choices: [
          { id: "a", label_vi: "Chú sâu đã lớn", correct: false },
          { id: "b", label_vi: "Quả trứng do bướm mẹ đẻ ra", correct: true },
          { id: "c", label_vi: "Chiếc lá non trên cành cây", correct: false },
          { id: "d", label_vi: "Chiếc nhộng trên cành khô", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến giai đoạn đầu tiên trước khi sâu xuất hiện.",
        hint2_vi: "Bướm mẹ không sinh ra sâu trực tiếp.",
        hint3_vi: "Vòng đời bắt đầu từ quả trứng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bướm mẹ đẻ trứng, trứng nở thành sâu, sâu thành nhộng rồi nhộng hóa thành bướm nên vòng đời bắt đầu từ trứng.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi: "Việc làm nào của con người gây hại môi trường?",
        choices: [
          { id: "a", label_vi: "Đổ rác thẳng xuống sông", correct: true },
          {
            id: "b",
            label_vi: "Trồng thêm cây xanh ở công viên",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Tiết kiệm điện khi ra khỏi nhà",
            correct: false,
          },
          { id: "d", label_vi: "Phân loại rác trước khi đổ", correct: false },
        ],
        hint1_vi: "Hãy chọn việc làm bẩn nguồn nước hoặc đất.",
        hint2_vi: "Nước sông bị bẩn sẽ ảnh hưởng đến cá và sinh vật dưới nước.",
        hint3_vi: "Đổ rác xuống sông làm ô nhiễm nước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Đổ rác xuống sông gây ô nhiễm nước và làm hại sinh vật dưới nước; các việc còn lại đều bảo vệ môi trường.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Ở nhà, em muốn hành động gì để bảo vệ môi trường?",
        choices: [
          {
            id: "a",
            label_vi: "Mở điện suốt ngày dù không ai ở phòng",
            correct: false,
          },
          { id: "b", label_vi: "Vứt vỏ bánh xuống sân", correct: false },
          {
            id: "c",
            label_vi: "Dùng bình nước cá nhân thay cho chai nhựa dùng một lần",
            correct: true,
          },
          { id: "d", label_vi: "Xả nước thừa ra đường", correct: false },
        ],
        hint1_vi: "Hãy chọn việc làm giảm được lượng rác thải.",
        hint2_vi: "Việc làm đó giúp bớt chai nhựa bỏ đi mỗi ngày.",
        hint3_vi:
          "Dùng bình nước cá nhân nhiều lần thay cho chai nhựa dùng một lần.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Dùng bình nước cá nhân nhiều lần thay cho chai nhựa dùng một lần giúp giảm rác nhựa, là việc làm phù hợp cho học sinh lớp 5.",
    },
  ],
};
