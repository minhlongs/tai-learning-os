/**
 * Khoa học · Mạch điện đơn giản, vật dẫn điện – cách điện và an toàn điện (skill: sci-simple-circuits, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 5.
 */
import type { LessonDefinition } from "../types";

export const simpleCircuits: LessonDefinition = {
  id: "sci-simple-circuits",
  subjectId: "science",
  skillId: "sci-simple-circuits",
  titleVi: "Mạch điện đơn giản và sử dụng điện an toàn",
  titleEn: "Simple Electric Circuits and Electrical Safety",
  objectiveVi:
    "Em mô tả được cấu tạo và điều kiện để bóng đèn sáng trong mạch điện đơn giản, phân biệt vật dẫn điện với vật cách điện và thực hiện quy tắc an toàn điện.",
  objectiveEn:
    "Describe components and closed-loop condition of a simple circuit, distinguish electrical conductors from insulators, and practice electrical safety.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-simple-circuits",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách quan sát chiếc đèn pin gia đình và nhắc lại quy tắc tay khô ráo khi bật tắt công tắc điện.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một mạch điện thắp sáng đơn giản gồm pin (nguồn điện), dây dẫn, công tắc và bóng đèn nhỏ. Bóng đèn chỉ phát sáng khi thỏa mãn điều kiện nào?",
        question_en:
          "A simple lighting circuit has a battery, wires, a switch, and a small bulb. Under what condition does the bulb light up?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ cần xoắn cả hai đầu dây của bóng đèn dính chặt vào cùng một cực dương của viên pin là đèn sáng ngay.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Khi công tắc mở tách rời để ngăn không cho dòng điện chạy qua bóng đèn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Khi công tắc đóng tạo mạch kín liên tục từ cực dương qua đèn rồi về cực âm của pin.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Chỉ cần đặt bóng đèn nằm áp sát cạnh viên pin trên mặt bàn gỗ mà không cần nối bất kỳ dây dẫn nào.",
            correct: false,
          },
        ],
        hint1_vi:
          "Mỗi viên pin đều có hai cực là cực dương (+) và cực âm (-), dòng điện cần một đường đi khép kín giữa hai cực này.",
        hint2_vi:
          "Nếu công tắc mở hoặc một đầu dây không chạm cực còn lại, đường đi của dòng điện bị ngắt quãng (mạch hở).",
        hint3_vi:
          "Đèn chỉ sáng khi dòng điện chạy qua một mạch kín không bị hở từ cực dương qua dây tóc bóng đèn về tới cực âm của nguồn điện.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Bóng đèn chỉ sáng khi có dòng điện chạy qua một mạch điện kín: đi từ cực dương của pin qua dây dẫn, công tắc đang đóng, qua dây tóc bóng đèn rồi về cực âm của pin.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Lần lượt chèn các vật nhỏ vào chỗ hở của mạch điện thử pin – bóng đèn. Nhóm vật nào dưới đây đều làm bóng đèn phát sáng vì cho dòng điện chạy qua?",
        question_en:
          "Testing small items across a gap in a battery-bulb circuit: which group makes the bulb light up because all items conduct electricity?",
        choices: [
          {
            id: "a",
            label_vi: "Thước kẻ nhựa khô, cục tẩy cao su và que gỗ khô.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Lá đồng mỏng, ghim kẹp giấy bằng thép và thanh nhôm.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Mảnh bìa các-tông khô, ống hút nhựa và mảnh sứ trắng.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Dây thun cao su, mảnh vải bông khô và viên bi thủy tinh.",
            correct: false,
          },
        ],
        hint1_vi:
          "Vật cho dòng điện chạy qua gọi là vật dẫn điện; vật không cho dòng điện chạy qua gọi là vật cách điện.",
        hint2_vi:
          "Nhựa, cao su, sứ, thủy tinh và gỗ khô đều là những vật cách điện nên đèn sẽ không sáng.",
        hint3_vi:
          "Các kim loại như đồng, nhôm, sắt thép đều là vật dẫn điện tốt nên nối kín mạch làm bóng đèn bật sáng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đồng, nhôm, sắt, thép là các kim loại dẫn điện tốt nên cho dòng điện đi qua làm sáng đèn. Nhựa, cao su, thủy tinh, sứ, bìa và gỗ khô là các vật cách điện.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao sợi dây điện dùng trong nhà luôn có phần lõi bên trong bằng kim loại đồng, còn lớp vỏ bọc kín bên ngoài và thân phích cắm lại làm bằng nhựa hoặc cao su?",
        question_en:
          "Why do household electrical cords have a copper metal core inside and a plastic or rubber outer sheath and plug body?",
        choices: [
          {
            id: "a",
            label_vi:
              "Lõi đồng dẫn điện tới thiết bị, còn vỏ nhựa cách điện ngăn dòng điện truyền ra ngoài làm người chạm bị giật.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Vỏ nhựa mới là bộ phận dẫn dòng điện chính chạy dọc sợi dây, còn lõi đồng bên trong chỉ để giữ cho dây khỏi bị gãy gập.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cả lõi đồng lẫn lớp vỏ nhựa đều là chất cách điện hoàn hảo nên giữ dòng điện đứng yên tuyệt đối một chỗ.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Lớp vỏ nhựa chỉ để sợi dây trông dày dặn và đẹp mắt hơn chứ hoàn toàn không có tác dụng bảo vệ an toàn nào.",
            correct: false,
          },
        ],
        hint1_vi:
          "Dòng điện từ ổ cắm cần đi tới quạt điện, đèn bàn nhưng tuyệt đối không được truyền sang tay người sử dụng.",
        hint2_vi:
          "Bộ phận nào đảm nhận dẫn dòng điện đi, và bộ phận nào đóng vai trò rào chắn cách điện?",
        hint3_vi:
          "Đồng dẫn điện rất tốt làm lõi dẫn dòng điện; nhựa và cao su cách điện bao bọc bên ngoài đảm bảo an toàn chống điện giật.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Cấu tạo dây điện kết hợp cả hai tính chất: lõi đồng là vật dẫn điện để truyền điện năng nuôi thiết bị; lớp vỏ nhựa hoặc cao su là vật cách điện bảo vệ người dùng không chạm trực tiếp vào dòng điện.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong giờ thực hành lắp mạch điện với một viên pin còn mới, bạn học sinh đã gạt đóng công tắc nhưng bóng đèn vẫn không sáng. Nguyên nhân nào dưới đây hợp lí nhất để kiểm tra đầu tiên?",
        question_en:
          "In a science lab with a fresh battery, a student closes the switch yet the bulb stays dark. Which cause is most reasonable to check first?",
        choices: [
          {
            id: "a",
            label_vi:
              "Bóng đèn không chịu sáng vì lớp vỏ nhựa bọc ngoài dây dẫn có màu đỏ tía thay vì màu xanh lá như quy định.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Bóng đèn không sáng vì bạn đặt mạch điện trên mặt bàn gỗ khô cách điện.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Bóng đèn không sáng vì ánh đèn phòng học đang bật.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Mối nối lỏng ở cực pin hoặc dây tóc bóng đèn bị đứt khiến mạch điện bị hở.",
            correct: true,
          },
        ],
        hint1_vi:
          "Màu sắc vỏ dây hay mặt bàn gỗ bên ngoài không làm ngắt dòng điện chạy bên trong lõi đồng.",
        hint2_vi:
          "Khi pin còn điện và công tắc đã đóng mà đèn vẫn tối, chứng tỏ dòng điện đang bị đứt đoạn ở một vị trí nào đó.",
        hint3_vi:
          "Đầu dây lỏng khỏi cực pin, đui đèn tiếp xúc kém hoặc dây tóc bóng đèn bị đứt đều biến mạch kín thành mạch hở nên đèn tắt.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Chỉ cần một điểm tiếp xúc bị lỏng ở cực pin, chốt công tắc, đui đèn hoặc dây tóc bóng đèn bị đứt thì mạch điện trở thành mạch hở và dòng điện không thể chạy qua.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điện lưới sinh hoạt trong gia đình mạnh hơn pin thí nghiệm rất nhiều và có thể gây nguy hiểm tính mạng. Cách xử sự nào dưới đây tuân thủ đúng quy tắc an toàn điện?",
        question_en:
          "Household mains electricity is far stronger than a flashlight battery and can be life-threatening. Which behavior follows electrical safety rules?",
        choices: [
          {
            id: "a",
            label_vi:
              "Để bàn tay đang ướt sũng nước xà phòng cắm thẳng phích quạt vào ổ điện.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Thả diều ở bãi đất ngay sát bên dưới đường dây điện cao thế hoặc chọc que sắt vào lỗ ổ cắm điện.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Lau khô tay trước khi chạm công tắc, nắm phần vỏ nhựa khi rút phích và báo người lớn khi dây sờn vỏ.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Cầm nắm dây điện giật mạnh từ xa để rút phích cắm khỏi ổ tường mỗi khi dùng xong.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nước sinh hoạt thông thường (nhất là nước dính mồ hôi, xà phòng) có khả năng dẫn điện sang cơ thể người.",
        hint2_vi:
          "Giật dây điện dễ làm đứt ngầm hoặc tuột vỏ cách điện; thả diều gần đường dây điện dễ vướng gây phóng điện nguy hiểm.",
        hint3_vi:
          "Giữ tay khô ráo, cầm đúng thân nhựa cách điện của phích cắm và tránh xa dây điện hở, đường dây cao thế là nguyên tắc bảo vệ an toàn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nước thường và cơ thể người đều dẫn điện, nên tuyệt đối không chạm thiết bị điện khi tay ướt, không chơi đùa gần đường dây điện và phải báo người lớn ngắt điện sửa chữa ngay khi vỏ cách điện bị nứt hở.",
    },
  ],
};
