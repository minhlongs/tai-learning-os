/**
 * Khoa học · Con người và môi trường (skill: sci-environment, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Khoa học Lớp 5 (`GDPT2018.SCI.5.ENV.04`).
 */
import type { LessonDefinition } from "../types";

export const environment: LessonDefinition = {
  id: "sci-environment",
  subjectId: "science",
  skillId: "sci-environment",
  titleVi: "Con người và môi trường",
  titleEn: "Human Impact on the Environment",
  objectiveVi:
    "Em sẽ nhận biết việc làm gây ô nhiễm hoặc bảo vệ môi trường và đề xuất hành động phù hợp.",
  objectiveEn:
    "Recognise actions that harm or protect the environment and propose suitable actions.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-environment",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tự chọn một việc bảo vệ môi trường và nêu lý do.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Việc làm nào của con người gây ô nhiễm không khí?",
        choices: [
          {
            id: "a",
            label_vi: "Trồng thêm cây xanh ở sân trường",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Đốt rác thải và khói xe thải ra ngoài",
            correct: true,
          },
          { id: "c", label_vi: "Đi học bằng xe đạp", correct: false },
          { id: "d", label_vi: "Phân loại rác trước khi đổ", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến những việc tạo ra khói bụi.",
        hint2_vi: "Khói là một chất làm không khí bẩn đi.",
        hint3_vi: "Đốt rác thải và khói xe làm ô nhiễm không khí.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đốt rác thải và khói từ xe cộ thải ra khói bụi, làm không khí bị ô nhiễm, trong khi trồng cây và đi xe đạp thì giúp môi trường sạch hơn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Hành động nào của học sinh là bảo vệ môi trường?",
        choices: [
          { id: "a", label_vi: "Vứt vỏ kẹo xuống sân trường", correct: false },
          { id: "b", label_vi: "Đổ dầu ăn ra cống thoát nước", correct: false },
          { id: "c", label_vi: "Mở điều hòa cả ngày dù lớp trống", correct: false },
          { id: "d", label_vi: "Tắt điện khi ra khỏi lớp", correct: true },
        ],
        hint1_vi: "Hãy chọn việc tiết kiệm và giữ sạch.",
        hint2_vi: "Việc làm đó giúp giảm lãng phí điện năng.",
        hint3_vi: "Tắt điện khi ra khỏi lớp là hành động bảo vệ môi trường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Tắt điện khi không sử dụng giúp tiết kiệm điện và giảm lãng phí năng lượng; các việc còn lại đều làm hỏng môi trường.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Rác thải nhựa trong sông suối gây hại chủ yếu cho đối tượng nào?",
        choices: [
          { id: "a", label_vi: "Không gây hại cho sinh vật nào", correct: false },
          { id: "b", label_vi: "Cây cối trên núi cao", correct: false },
          { id: "c", label_vi: "Cá và các sinh vật sống dưới nước", correct: true },
          { id: "d", label_vi: "Chim sống trong tổ trên cây", correct: false },
        ],
        hint1_vi: "Rác đổ ở đâu thì sinh vật ở đó chịu ảnh hưởng trước.",
        hint2_vi: "Có sinh vật ở trong nước ăn nhầm rác và bị nghẹt.",
        hint3_vi: "Rác nhựa trong nước làm hại cá và sinh vật dưới nước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Rác nhựa trong nước do cá và sinh vật dưới nước chịu ảnh hưởng trực tiếp: nước bẩn, thiếu dưỡng khí và sinh vật dễ ăn nhầm rác.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Biện pháp nào phù hợp để bảo vệ môi trường ở nơi em sinh sống?",
        choices: [
          {
            id: "a",
            label_vi:
              "Thu gom rác đúng nơi quy định và tái sử dụng vật dụng còn tốt",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Đốt rác ngay sau nhà để khỏi phải đi xa",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Thêm bỏ túi nilon mỗi lần đi chợ",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Đổ nước thải ra mương gần nhà",
            correct: false,
          },
        ],
        hint1_vi: "Hãy chọn việc làm giảm được chất thải.",
        hint2_vi: "Việc làm đó giúp rác không tràn ra đường hay mương.",
        hint3_vi:
          "Thu gom rác đúng nơi quy định và tái sử dụng đồ còn dùng được là biện pháp phù hợp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Thu gom rác đúng nơi quy định và tái sử dụng đồ còn dùng được giúp giảm lượng rác thải, nên là biện pháp bảo vệ môi trường phù hợp.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Lớp em muốn giảm rác nhựa trong nhà trường. Giải pháp nào hợp lý nhất cho lớp tự làm?",
        choices: [
          {
            id: "a",
            label_vi: "Đổ hết rác nhựa xuống vườn sau trường",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mua thêm nhiều túi nilon để dùng một lần",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nhường việc xử lý rác cho nhà trường, lớp không làm gì",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Đề xuất mỗi bạn dùng bình nước cá nhân và túi tái sử dụng",
            correct: true,
          },
        ],
        hint1_vi: "Hãy chọn việc lớp tự làm được ngay.",
        hint2_vi: "Giải pháp đó giúp giảm được số túi nilon vứt đi mỗi ngày.",
        hint3_vi:
          "Dùng bình nước và túi tái sử dụng giúp lớp giảm rác nhựa ngay.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Dùng bình nước cá nhân và túi tái sử dụng là việc cả lớp tự làm được và giảm trực tiếp lượng rác nhựa thải ra mỗi ngày.",
    },
  ],
};
