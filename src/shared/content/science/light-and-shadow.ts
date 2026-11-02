/**
 * Khoa học · Ánh sáng, bóng tối và bảo vệ thị giác (skill: sci-light-and-shadow, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const lightAndShadow: LessonDefinition = {
  id: "sci-light-and-shadow",
  subjectId: "science",
  skillId: "sci-light-and-shadow",
  titleVi: "Ánh sáng, bóng tối và bảo vệ thị giác",
  titleEn: "Light, Shadows, and Eye Protection",
  objectiveVi: "Em phân biệt được vật tự phát sáng và vật được chiếu sáng, giải thích sự tạo thành bóng tối và biết cách bảo vệ mắt.",
  objectiveEn: "Distinguish light sources from illuminated objects, explain shadow formation, and practice eye protection.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-sci-light-and-shadow",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách kiểm tra vị trí đặt đèn học trên bàn viết của em.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong các vật dưới đây, vật nào là vật tự phát sáng?",
        question_en: "Which of the following is a self-luminous object (light source)?",
        choices: [
          { id: "a", label_vi: "Mặt Trời ban ngày hoặc bóng đèn điện đang bật sáng.", correct: true },
          { id: "b", label_vi: "Quyển vở đặt trên bàn học.", correct: false },
          { id: "c", label_vi: "Mặt Trăng vào ban đêm.", correct: false },
          { id: "d", label_vi: "Chiếc gương soi trong phòng tắm.", correct: false },
        ],
        hint1_vi: "Vật tự phát sáng là vật tự nó tạo ra ánh sáng mà không cần nguồn sáng khác chiếu vào.",
        hint2_vi: "Mặt Trăng và chiếc gương chỉ hắt lại ánh sáng từ nơi khác chiếu tới.",
        hint3_vi: "Mặt Trời và bóng đèn đang có dòng điện chạy qua tự phát ra ánh sáng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Mặt Trời và bóng đèn điện đang bật là vật tự phát sáng. Quyển vở, chiếc gương hay Mặt Trăng đều là vật được chiếu sáng (Mặt Trăng sáng là nhờ phản chiếu ánh sáng Mặt Trời).",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi chiếu đèn pin vào một tấm bìa cứng đặt trước bức tường trong phòng tối, phía sau tấm bìa xuất hiện vùng tối (bóng của tấm bìa). Vì sao?",
        question_en: "When a flashlight shines on cardboard in front of a wall, a shadow forms behind it. Why?",
        choices: [
          { id: "a", label_vi: "Vì tấm bìa tự phát ra màu đen.", correct: false },
          { id: "b", label_vi: "Vì ánh sáng truyền theo đường thẳng và tấm bìa là vật cản sáng không cho ánh sáng đi qua.", correct: true },
          { id: "c", label_vi: "Vì bức tường hút hết ánh sáng của đèn pin.", correct: false },
          { id: "d", label_vi: "Vì ánh sáng tự uốn cong vòng quanh tấm bìa.", correct: false },
        ],
        hint1_vi: "Tấm bìa cứng có cho ánh sáng đèn pin truyền xuyên qua như tấm kính trong suốt không?",
        hint2_vi: "Ánh sáng truyền đi theo đường thẳng nên khi gặp vật cản sáng, vùng phía sau vật đó có nhận được ánh sáng không?",
        hint3_vi: "Do tấm bìa cản ánh sáng truyền thẳng tới tường nên vùng phía sau tấm bìa không nhận được ánh sáng và tạo thành bóng tối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Ánh sáng truyền theo đường thẳng. Tấm bìa cứng là vật cản sáng (không cho ánh sáng đi qua), nên vùng không gian phía sau tấm bìa không nhận được ánh sáng từ đèn pin và tạo thành bóng tối.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Muốn nhìn rõ chữ trong trang sách nhưng không làm chói mắt và không để bóng bàn tay che khuất dòng chữ khi viết bằng tay phải, em nên đặt đèn bàn ở vị trí nào?",
        question_en: "When writing with your right hand, where should you place the desk lamp so your hand's shadow does not block the text?",
        choices: [
          { id: "a", label_vi: "Đặt đèn ở phía bên trái, cao vừa phải và có chụp đèn che không chiếu thẳng vào mắt.", correct: true },
          { id: "b", label_vi: "Đặt đèn ở ngay phía bên phải sát cổ tay cầm bút.", correct: false },
          { id: "c", label_vi: "Đặt đèn ngay sau lưng người ngồi học.", correct: false },
          { id: "d", label_vi: "Tắt hết đèn và chỉ dùng ánh sáng màn hình điện thoại.", correct: false },
        ],
        hint1_vi: "Hãy nhớ bóng tối luôn nằm ở phía sau vật cản sáng so với nguồn sáng.",
        hint2_vi: "Nếu em viết bằng tay phải mà đặt đèn bên phải hoặc sau lưng, bóng của bàn tay và cơ thể sẽ đổ đè lên trang vở.",
        hint3_vi: "Đặt đèn phía bên trái giúp ánh sáng chiếu trực tiếp vào trang vở và đẩy bóng bàn tay phải ra phía ngoài.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi viết bằng tay phải, đặt đèn bàn ở phía bên trái giúp ánh sáng chiếu rõ vào đầu bút mà bóng của bàn tay phải không đổ lên dòng chữ đang viết; chụp đèn giúp ánh sáng không chiếu thẳng gây lóa mắt.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Giữ nguyên vị trí đèn pin và bức tường, nếu ta dịch chuyển quyển sách (vật cản sáng) lại gần bóng đèn pin hơn thì bóng của quyển sách trên tường sẽ thay đổi như thế nào?",
        question_en: "Keeping the flashlight and wall fixed, what happens to the book's shadow on the wall as the book moves closer to the flashlight?",
        choices: [
          { id: "a", label_vi: "Bóng của quyển sách trên tường to lên.", correct: true },
          { id: "b", label_vi: "Bóng của quyển sách biến mất hoàn toàn.", correct: false },
          { id: "c", label_vi: "Bóng của quyển sách thu nhỏ bằng đầu kim.", correct: false },
          { id: "d", label_vi: "Bóng chuyển sang phát sáng rực rỡ.", correct: false },
        ],
        hint1_vi: "Khi quyển sách tiến lại gần đèn pin hơn, nó chắn một phần chùm tia sáng rộng hơn hay hẹp hơn?",
        hint2_vi: "Em có thể liên hệ khi đưa bàn tay lại gần đèn bàn thì bóng bàn tay trên tường to ra hay nhỏ đi.",
        hint3_vi: "Vật cản sáng càng ở gần nguồn sáng thì cản càng nhiều tia sáng, làm bóng của nó trên màn chắn phía sau càng lớn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi đưa vật cản sáng (quyển sách) lại gần nguồn sáng (đèn pin), vật chắn một góc chùm sáng lớn hơn nên vùng bóng tối in trên bức tường phía sau sẽ to lên.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thói quen nào dưới đây giúp bảo vệ đôi mắt khỏe mạnh khi học tập và sinh hoạt hằng ngày?",
        question_en: "Which habit below helps protect healthy eyesight during daily study and activities?",
        choices: [
          { id: "a", label_vi: "Học ở nơi đủ ánh sáng, ngồi thẳng lưng cách vở khoảng 25–30 cm và cho mắt nghỉ ngơi sau mỗi 30–45 phút.", correct: true },
          { id: "b", label_vi: "Đọc truyện dưới ánh đèn lờ mờ hoặc vừa nằm vừa đọc sách.", correct: false },
          { id: "c", label_vi: "Nhìn trực tiếp vào Mặt Trời lúc trưa nắng hoặc đèn tia lửa hàn.", correct: false },
          { id: "d", label_vi: "Xem màn hình liên tục nhiều giờ trong phòng tắt hết đèn.", correct: false },
        ],
        hint1_vi: "Ánh sáng quá mạnh hoặc quá yếu đều gây hại cho võng mạc và làm mắt nhanh mỏi.",
        hint2_vi: "Nhìn trực tiếp vào Mặt Trời, tia lửa hàn hoặc đọc sách nơi thiếu sáng đều rất nguy hiểm cho mắt.",
        hint3_vi: "Đảm bảo đủ ánh sáng, giữ khoảng cách mắt tới vở 25–30 cm và cho mắt nghỉ định kỳ là cách bảo vệ thị giác đúng đắn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Để bảo vệ mắt, em cần học tập ở nơi đủ ánh sáng, giữ khoảng cách từ mắt đến sách vở khoảng 25–30 cm, tuyệt đối không nhìn thẳng vào nguồn sáng quá mạnh (Mặt Trời, đèn hàn) và cho mắt nghỉ ngơi hợp lý.",
    },
  ],
};
