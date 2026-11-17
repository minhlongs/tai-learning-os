/**
 * Khoa học · Sự sinh sản của thực vật có hoa: thụ phấn, thụ tinh và phát tán hạt (skill: sci-flowering-reproduction, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 5.
 */
import type { LessonDefinition } from "../types";

export const floweringReproduction: LessonDefinition = {
  id: "sci-flowering-reproduction",
  subjectId: "science",
  skillId: "sci-flowering-reproduction",
  titleVi: "Sự sinh sản của thực vật có hoa",
  titleEn: "Reproduction in Flowering Plants",
  objectiveVi:
    "Em nhận biết được nhị và nhụy hoa, phân biệt hoa thụ phấn nhờ côn trùng với hoa thụ phấn nhờ gió, và trình bày quá trình tạo thành hạt, quả cùng sự phát tán hạt.",
  objectiveEn:
    "Identify stamens and pistils, compare insect-pollinated and wind-pollinated flowers, and explain seed/fruit formation and seed dispersal.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-flowering-reproduction",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách quan sát nhị và nhụy của một bông hoa dâm bụt hoặc hoa bí trong vườn mà không ngắt phá cây.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trên một bông hoa lưỡng tính, hai bộ phận sinh sản chính là bộ phận nào và chúng giữ nhiệm vụ gì?",
        question_en:
          "In a bisexual flower, what are the two main reproductive parts and what do they hold?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cuống hoa và đài hoa xanh; đài hoa là nơi tạo ra hạt phấn còn cuống hoa chứa đựng các noãn sinh sản cái.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nhị và nhụy: bao phấn ở nhị chứa hạt phấn (đực), bầu nhụy chứa noãn (cái).",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Lá non và gai nhọn mọc dọc trên cành; gai nhọn trực tiếp biến đổi thành hạt giống.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ có những cánh hoa sặc sỡ màu sắc mới là bộ phận sinh sản duy nhất nằm trên bông hoa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Đài hoa và cánh hoa che chở và thu hút côn trùng, còn bên trong tâm bông hoa mới là cơ quan sinh sản.",
        hint2_vi:
          "Cơ quan sinh sản đực tạo ra lớp phấn mịn vàng nhạt, còn cơ quan sinh sản cái có phần bầu phình nhỏ ở đáy.",
        hint3_vi:
          "Nhị (gồm chỉ nhị và bao phấn chứa hạt phấn) và nhụy (gồm đầu nhụy, vòi nhụy và bầu nhụy chứa noãn) là hai bộ phận sinh sản chính của hoa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Nhị là cơ quan sinh sản đực có bao phấn chứa hạt phấn; nhụy là cơ quan sinh sản cái có bầu nhụy chứa noãn. Một số loài có cả nhị và nhụy trên cùng bông hoa, một số loài như bầu, bí, mướp có hoa đực và hoa cái riêng.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "So với các loài hoa thụ phấn nhờ gió (như hoa lúa, hoa ngô, hoa cỏ lau), những loài hoa thụ phấn nhờ côn trùng (như hoa bưởi, hoa mướp, hoa hướng dương) thường có đặc điểm nổi bật nào?",
        question_en:
          "Compared with wind-pollinated flowers (rice, corn, reeds), what distinctive traits do insect-pollinated flowers (pomelo, gourd, sunflower) typically have?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cánh hoa lớn, màu sặc sỡ hoặc trắng nổi bật, tỏa hương thơm và tiết mật ngọt thu hút ong bướm.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Cánh hoa tiêu biến hoàn toàn thành những vảy nhỏ không màu, không mùi và không bao giờ tiết ra chút mật nào.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chỉ chịu nở ngầm sâu tận dưới lòng đất tối tăm, nơi chẳng có côn trùng nào có thể bay tới đậu lên được.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Hạt phấn nặng như viên sỏi để rơi thẳng xuống rễ cây.",
            correct: false,
          },
        ],
        hint1_vi:
          "Điều gì hấp dẫn ong mật và bướm tìm đến đậu lên những bông hoa trong vườn?",
        hint2_vi:
          "Hoa lúa, hoa cỏ nhờ gió thổi bay phấn nên cánh hoa nhỏ và màu sắc kém sặc sỡ; còn hoa nhờ côn trùng cần tín hiệu gọi ong bướm.",
        hint3_vi:
          "Màu sắc tươi sáng, hương thơm dịu và đĩa mật ngọt thu hút côn trùng ghé thăm, vô tình mang hạt phấn dính trên chân và lông sang đầu nhụy hoa khác.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hoa thụ phấn nhờ côn trùng thường có màu sắc rực rỡ, hương thơm và mật ngọt để hấp dẫn ong bướm. Ngược lại, hoa thụ phấn nhờ gió thường có cánh nhỏ, không màu sặc sỡ nhưng có nhiều hạt phấn nhỏ nhẹ và đầu nhụy có lông dính để đón phấn bay trong gió.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau khi hiện tượng thụ phấn (hạt phấn tiếp xúc đầu nhụy) và thụ tinh diễn ra thành công, noãn và bầu nhụy của bông hoa biến đổi thành bộ phận nào?",
        question_en:
          "After successful pollination and fertilization, what do the ovule and the ovary of the flower develop into?",
        choices: [
          {
            id: "a",
            label_vi:
              "Noãn biến thành chiếc rễ cọc cắm sâu của cây mẹ, còn bầu nhụy phình ra biến thành những phiến lá xanh quang hợp.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Cả noãn lẫn bầu nhụy đều khô héo rụng sạch, còn đài hoa xanh mới là bộ phận biến thành hạt giống.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Noãn phát triển thành hạt chứa phôi, còn bầu nhụy lớn lên thành quả bảo vệ hạt.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Bầu nhụy biến thành bao phấn mới, còn noãn biến thành cánh hoa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy hình dung quả xoài hay quả cam: bên trong cùng là hạt, bao bọc bên ngoài hạt là phần thịt và vỏ quả.",
        hint2_vi:
          "Trước khi thành quả, noãn vốn nằm gọn bên trong bầu nhụy.",
        hint3_vi:
          "Sau thụ tinh, noãn bên trong phát triển thành hạt, còn bầu nhụy bao quanh noãn phình to phát triển thành quả.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Từ hạt phấn mọc ra ống phấn vươn tới noãn để tế bào sinh dục đực kết hợp với tế bào sinh dục cái (thụ tinh) tạo hợp tử. Hợp tử phát triển thành phôi, noãn thành hạt chứa phôi, còn bầu nhụy phát triển thành quả chứa hạt.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Quả bồ công anh có túm lông tơ bay theo gió, quả ké đầu ngựa có gai móc bám vào lông động vật, còn quả dừa có vỏ xơ rỗng nổi trôi theo nước. Sự phát tán quả và hạt đi xa cây mẹ mang lại lợi ích sinh học gì?",
        question_en:
          "Dandelion seeds float on wind, burrs hook onto fur, and coconuts drift on water. What biological advantage does seed dispersal far from the parent plant bring?",
        choices: [
          {
            id: "a",
            label_vi:
              "Để hạt giống không bao giờ gặp đất ẩm và không phải nảy mầm nữa.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Để cây mẹ khỏi phải quang hợp tạo chất dinh dưỡng nuôi lá.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chỉ để làm đẹp cảnh quan tự nhiên, vì hạt mọc chen chúc sát gốc cây mẹ vẫn luôn khỏe mạnh và cho nhiều quả nhất.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Giúp mở rộng vùng sống để cây con đủ ánh sáng, nước, khoáng thay vì chen chúc dưới tán cây mẹ.",
            correct: true,
          },
        ],
        hint1_vi:
          "Điều gì xảy ra nếu hàng trăm hạt giống rụng thẳng xuống một khoảnh đất chật hẹp bị tán cây mẹ che rợp bóng?",
        hint2_vi:
          "Cây non mọc dày đặc dưới bóng râm của cây lớn sẽ thiếu nắng, thiếu nước và cạnh tranh nhau gay gắt.",
        hint3_vi:
          "Nhờ gió, nước và động vật phát tán đi xa, hạt tới vùng đất mới thoáng đãng để nảy mầm khỏe mạnh và duy trì nòi giống rộng khắp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Sự phát tán nhờ gió, nước, động vật hoặc tự nứt vỏ giúp hạt giống phân bố tới những vùng đất mới, tránh chen chúc thiếu ánh sáng và dinh dưỡng ngay dưới gốc cây mẹ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một nhà vườn trồng dưa lưới trong nhà màng kín mít để ngăn côn trùng chích hút gây bệnh. Khi dưa nở rộ cả hoa đực và hoa cái vàng tươi nhưng lại rất ít hoa cái đậu thành quả non, giải pháp khoa học nào dưới đây khắc phục đúng nguyên nhân?",
        question_en:
          "Cantaloupes grown inside a sealed insect-proof greenhouse bloom abundantly with male and female flowers yet set very few fruits. Which scientific solution addresses the root cause?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đóng kín cửa nhà màng tắt hết ánh sáng và ngừng tưới nước suốt một tuần liền để cây tự rụng bớt hoa cho đỡ tốn sức.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Thả ong mật sạch bệnh vào nhà màng hoặc dùng cọ mềm chấm hạt phấn từ nhị hoa đực sang đầu nhụy hoa cái.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Cắt bỏ toàn bộ hoa đực ngay khi mới nhú nụ để cây chỉ giữ lại hoa cái.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Dùng sơn kín bít đầu nhụy hoa cái lại để cho hạt phấn gió bay tới không thể bám vào được nữa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hoa bầu, bí, dưa lưới vốn là những loài hoa thụ phấn chủ yếu nhờ côn trùng mang phấn từ hoa đực sang hoa cái.",
        hint2_vi:
          "Nhà màng lưới kín đã chặn sâu hại nhưng đồng thời cũng ngăn ong bướm tự nhiên bay vào chuyển phấn.",
        hint3_vi:
          "Muốn bầu nhụy hoa cái phát triển thành quả dưa, cần thả ong mật hỗ trợ hoặc con người trực tiếp thụ phấn bổ sung từ hoa đực sang đầu nhụy hoa cái.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Dưa lưới có hoa đực và hoa cái riêng và thụ phấn nhờ côn trùng. Trong nhà màng kín vắng ong bướm tự nhiên, người trồng cần thả ong mật hoặc thụ phấn nhân tạo bằng tay để hạt phấn đến được đầu nhụy hoa cái, giúp quá trình thụ tinh tạo quả diễn ra hiệu quả.",
    },
  ],
};
