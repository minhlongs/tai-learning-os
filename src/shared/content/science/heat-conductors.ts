/**
 * Khoa học · Sự truyền nhiệt, vật dẫn nhiệt tốt và vật dẫn nhiệt kém (skill: sci-heat-conductors, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const heatConductors: LessonDefinition = {
  id: "sci-heat-conductors",
  subjectId: "science",
  skillId: "sci-heat-conductors",
  titleVi: "Sự truyền nhiệt và vật dẫn nhiệt",
  titleEn: "Heat Transfer, Conductors, and Insulators",
  objectiveVi:
    "Em nêu được chiều truyền nhiệt từ vật nóng hơn sang vật lạnh hơn, phân biệt vật dẫn nhiệt tốt với vật dẫn nhiệt kém và vận dụng an toàn trong đời sống.",
  objectiveEn:
    "State that heat flows from warmer to cooler objects, distinguish thermal conductors from insulators, and apply them safely in daily life.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-sci-heat-conductors",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách quan sát chất liệu làm thân nồi và quai cầm trong gian bếp gia đình cùng người lớn.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi đặt một chiếc thìa kim loại đang nguội vào bát súp ấm, vài phút sau cán thìa ấm dần lên còn súp nguội bớt đi. Nhiệt đã truyền theo chiều nào?",
        question_en:
          "When a cool metal spoon is placed in warm soup, the spoon warms up while the soup cools slightly. Which way did heat flow?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nhiệt truyền từ vật nóng hơn là bát súp sang vật lạnh hơn là chiếc thìa.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Nhiệt truyền từ chiếc thìa nguội sang làm bát súp nóng thêm.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Hai vật hoàn toàn không trao đổi nhiệt mà tự tăng giảm nhiệt độ một cách ngẫu nhiên.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nhiệt chỉ truyền một chiều từ những góc lạnh nhất trong phòng dồn sang vật đang sôi.",
            correct: false,
          },
        ],
        hint1_vi:
          "Lúc mới đặt vào, bát súp và chiếc thìa vật nào có nhiệt độ cao hơn?",
        hint2_vi:
          "Vật nóng hơn tỏa bớt nhiệt nên nguội đi, còn vật lạnh hơn nhận thêm nhiệt nên ấm lên.",
        hint3_vi:
          "Nhiệt luôn truyền từ vật có nhiệt độ cao hơn (nóng hơn) sang vật có nhiệt độ thấp hơn (lạnh hơn).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi hai vật chênh lệch nhiệt độ tiếp xúc nhau, vật nóng hơn (súp ấm) truyền nhiệt sang vật lạnh hơn (chiếc thìa) cho tới khi nhiệt độ cân bằng.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cùng cắm một đầu của ba chiếc que có kích thước tương đương — một que đồng, một que gỗ khô và một que nhựa — vào cốc nước nóng. Sau hai phút, đầu trên của que nào ấm lên rõ rệt nhất?",
        question_en:
          "Equal-sized rods of copper, dry wood, and plastic are dipped into hot water. After two minutes, which top end feels warmest?",
        choices: [
          {
            id: "a",
            label_vi: "Que nhựa ấm nhanh nhất vì nhựa rất nhẹ.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Que gỗ khô ấm nhanh nhất vì gỗ có thớ dọc.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Que đồng ấm nhanh nhất vì kim loại là vật dẫn nhiệt tốt.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Cả ba que đều lạnh buốt hơn lúc chưa nhúng vào nước nóng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Giữa kim loại (đồng, nhôm, sắt) với gỗ và nhựa, nhóm chất liệu nào truyền cái nóng đi nhanh hơn?",
        hint2_vi:
          "Gỗ và nhựa thuộc nhóm vật dẫn nhiệt kém nên đầu trên của chúng hầu như chưa kịp nóng.",
        hint3_vi:
          "Đồng là kim loại dẫn nhiệt rất tốt nên nhiệt từ nước nóng truyền nhanh dọc theo que đồng lên đầu trên.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Các kim loại như đồng, nhôm, sắt là vật dẫn nhiệt tốt nên truyền nhiệt nhanh; còn gỗ, nhựa, len, bông là các vật dẫn nhiệt kém (vật cách nhiệt).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao phần thân xoong nồi thường được làm bằng nhôm hoặc thép không gỉ, trong khi quai nồi và núm vung lại bọc nhựa cứng hoặc gỗ?",
        question_en:
          "Why are cooking pot bodies made of aluminum or stainless steel, while handles and lid knobs are covered in hard plastic or wood?",
        choices: [
          {
            id: "a",
            label_vi:
              "Để thân nồi cách nhiệt không cho bếp làm nóng thức ăn, còn quai nồi hút hết nhiệt.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Thân nồi dẫn nhiệt tốt giúp thức ăn mau chín, còn quai và núm dẫn nhiệt kém để cầm không bỏng.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Chỉ để trang trí nhiều màu sắc chứ không liên quan đến sự truyền nhiệt.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì gỗ khô và nhựa cứng dẫn nhiệt nhanh gấp nhiều lần so với nhôm hay thép không gỉ.",
            correct: false,
          },
        ],
        hint1_vi:
          "Khi đun nấu trên bếp, ta cần nhiệt truyền vào thức ăn nhanh hay chậm?",
        hint2_vi:
          "Ngược lại, khi tay người nấu chạm vào quai nồi hoặc núm vung, ta cần bộ phận đó nóng rẫy hay nguội mát?",
        hint3_vi:
          "Kim loại dẫn nhiệt tốt giúp nấu chín nhanh tiết kiệm năng lượng; nhựa cứng và gỗ dẫn nhiệt kém giúp bảo vệ tay khỏi bị bỏng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thân nồi bằng kim loại dẫn nhiệt tốt giúp truyền nhanh nhiệt từ bếp vào thức ăn. Quai cầm và núm vung bằng nhựa chịu nhiệt hoặc gỗ dẫn nhiệt kém để người nấu nhấc mở an toàn.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vào những ngày mùa đông rét lạnh, vì sao mặc áo khoác bông xốp hoặc mặc nhiều lớp áo mỏng lại giữ ấm cơ thể tốt hơn một chiếc áo vải cứng dày tương đương?",
        question_en:
          "On cold winter days, why does wearing a fluffy padded jacket or several thin layers keep your body warmer than a single stiff cloth layer?",
        choices: [
          {
            id: "a",
            label_vi: "Vì sợi bông tự đốt nóng lên như một chiếc bếp điện nhỏ.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì không khí dẫn nhiệt nhanh hơn mọi kim loại nên hút gom toàn bộ hơi ấm từ gió lạnh ngoài trời vào da.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì lớp áo bông làm nhiệt độ cơ thể hạ nhanh xuống ngang bằng nhiệt độ gió rét bên ngoài để đỡ thấy lạnh.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì không khí giữa các sợi bông và các lớp áo dẫn nhiệt kém, ngăn nhiệt cơ thể thoát nhanh ra ngoài.",
            correct: true,
          },
        ],
        hint1_vi:
          "Chiếc áo bông đặt trên giường khi chưa ai mặc có tự nóng lên được không, hay nguồn ấm đến từ cơ thể chúng ta?",
        hint2_vi:
          "Không khí nằm yên trong các khe nhỏ giữa những sợi bông và giữa các lớp áo là chất dẫn nhiệt tốt hay kém?",
        hint3_vi:
          "Không khí và bông len đều dẫn nhiệt kém, tạo thành lớp chắn giữ nhiệt ấm của cơ thể không thất thoát nhanh ra trời lạnh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cơ thể người luôn ấm hơn không khí mùa đông. Giữa các sợi bông xốp hoặc giữa nhiều lớp áo có chứa nhiều lớp không khí dẫn nhiệt rất kém, ngăn không cho nhiệt từ cơ thể truyền nhanh ra ngoài.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình chuẩn bị mang mấy túi đá lạnh đi dã ngoại buổi sáng nhưng không có tủ điện mang theo. Cách bảo quản nào dưới đây giúp đá lâu tan nhất?",
        question_en:
          "A family wants to keep ice packs frozen on a morning picnic without a powered fridge. Which method keeps the ice from melting longest?",
        choices: [
          {
            id: "a",
            label_vi:
              "Trải rời từng viên đá ra khay inox rộng và mỏng để toàn bộ mặt đá đón gió trời bên ngoài.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đặt túi đá vào chậu nhôm mỏng mở nắp ngoài nắng nhẹ vì kim loại nhôm khóa chặt hơi lạnh.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đặt túi đá vào thùng xốp đậy kín nắp và lót thêm khăn bông khô xung quanh.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Quấn giấy bạc kim loại thật mỏng rồi đặt sát cạnh phích nước sôi.",
            correct: false,
          },
        ],
        hint1_vi:
          "Đá lạnh bị tan chảy là do nhận nhiệt truyền từ môi trường ấm hơn bên ngoài vào viên đá.",
        hint2_vi:
          "Muốn đá lâu tan, ta cần chọn vật liệu ngăn cản nhiệt bên ngoài truyền vào: vật dẫn nhiệt tốt hay vật dẫn nhiệt kém?",
        hint3_vi:
          "Nhựa xốp và khăn bông khô chứa nhiều bọt khí dẫn nhiệt rất kém, đậy kín nắp sẽ giữ đá lâu tan nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Đá tan nhanh khi nhận nhiều nhiệt từ không khí nóng bên ngoài. Thùng xốp và khăn bông khô là các vật cách nhiệt (dẫn nhiệt kém), ngăn nhiệt từ ngoài truyền vào nên giữ đá lâu tan.",
    },
  ],
};
