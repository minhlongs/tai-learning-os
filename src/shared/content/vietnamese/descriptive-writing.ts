/**
 * Tiếng Việt · Quan sát và chọn chi tiết khi viết văn miêu tả (skill: vie-descriptive-writing, lớp 4)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const descriptiveWriting: LessonDefinition = {
  id: "vie-descriptive-writing",
  subjectId: "vietnamese",
  skillId: "vie-descriptive-writing",
  titleVi: "Quan sát và chọn chi tiết tiêu biểu khi miêu tả",
  titleEn: "Multi-Sensory Observation in Descriptive Writing",
  objectiveVi:
    "Em sẽ biết kết hợp nhiều giác quan khi quan sát và chọn những chi tiết tiêu biểu để miêu tả cây cối, con vật thật sống động.",
  objectiveEn:
    "Combine multiple senses when observing and select distinctive details to describe plants and animals vividly.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-descriptive-writing",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách lập phiếu quan sát một cái cây ở sân nhà bằng mắt nhìn, tai nghe và mũi ngửi.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để bài văn miêu tả cây cối hoặc con vật không khô khan như một bản liệt kê, người viết cần quan sát như thế nào?",
        question_en:
          "How should a writer observe a plant or animal so the description feels vivid rather than like a dry checklist?",
        choices: [
          {
            id: "a",
            label_vi:
              "Kết hợp nhiều giác quan (nhìn, nghe, ngửi, chạm…) và chọn những nét riêng nổi bật nhất của đối tượng.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Chỉ dùng mắt đếm thật đủ số cành, số lá hoặc số chân rồi ghi tất cả thành một bản danh sách dài để đọc lại.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chép nguyên xi những câu văn tả một loài cây khác vào bài của mình.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chỉ cần nêu đúng tên gọi của cây hoặc con vật rồi kể thêm vài kỉ niệm của em, không cần tả hình dáng hay hoạt động của chúng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy nhớ lại khi đứng dưới gốc bưởi mùa hoa: ngoài nhìn màu trắng của cánh hoa, em còn nhận ra điều gì nữa?",
        hint2_vi:
          "Nếu chỉ đếm cành đếm lá, cây nào cũng giống cây nào và bài văn sẽ rất đơn điệu.",
        hint3_vi:
          "Khi phối hợp mắt nhìn hình dáng, mũi ngửi hương thơm, tai nghe tiếng lá xào xạc và chọn đúng nét riêng, đối tượng sẽ hiện lên sống động.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Quan sát bằng nhiều giác quan giúp em cảm nhận trọn vẹn màu sắc, âm thanh, hương thơm, độ mịn nhám của sự vật; đồng thời chọn lọc chi tiết tiêu biểu giúp làm bật nét riêng không trộn lẫn của cây cối hay con vật ấy.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc câu văn: “Mỗi sớm tháng Ba, chùm hoa bưởi trắng muốt sau hiên tỏa hương thơm thanh khiết giữa tiếng ong mật vo ve tìm nhụy.” Tác giả đã huy động những giác quan nào?",
        question_en:
          "Which senses did the author use in describing the pomelo blossoms?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ có thị giác (mắt nhìn).",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chỉ có thị giác nhìn màu hoa và xúc giác chạm cánh hoa.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vị giác (lưỡi nếm) và cả thính giác (tai nghe).",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Thị giác (mắt nhìn), khứu giác (mũi ngửi) và thính giác (tai nghe).",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy kiểm tra từng cụm từ: “trắng muốt”, “tỏa hương thơm thanh khiết” và “tiếng ong mật vo ve”.",
        hint2_vi:
          "Màu “trắng muốt” nhận biết bằng mắt; “hương thơm thanh khiết” cảm nhận bằng mũi.",
        hint3_vi:
          "Thêm “tiếng ong mật vo ve” được lắng nghe bằng tai, vậy câu văn đã phối hợp đủ ba giác quan.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu văn phối hợp khéo léo ba giác quan: thị giác qua sắc “trắng muốt” của cánh hoa, khứu giác qua “hương thơm thanh khiết” và thính giác qua “tiếng ong mật vo ve”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi tả chú mèo mướp của gia đình, chi tiết nào dưới đây là chi tiết tiêu biểu làm nổi bật thói quen riêng của loài mèo?",
        question_en:
          "Which detail is most distinctive when describing a family tabby cat?",
        choices: [
          {
            id: "a",
            label_vi: "Chú mèo nào cũng có một cái đầu, một cái mình và bốn cái chân giống như rất nhiều con vật khác trong nhà.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Đôi đệm thịt dưới bàn chân êm như nhung giúp chú rón rén bước đi không phát ra một tiếng động nhỏ.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Mỗi ngày chú mèo đều cần hít thở không khí và uống nước sạch.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chú mèo sống trong ngôi nhà xây gạch mái ngói đỏ của gia đình em, ngay cạnh bờ ao trồng nhiều cây xanh.",
            correct: false,
          },
        ],
        hint1_vi:
          "Chi tiết tiêu biểu là nét đặc sắc khiến người đọc hình dung ngay ra chú mèo chứ không nhầm với chó, gà hay thỏ.",
        hint2_vi:
          "Có đầu, mình, bốn chân hay cần thở và uống nước là đặc điểm chung của hầu hết loài vật.",
        hint3_vi:
          "Bàn chân có đệm thịt êm giúp di chuyển nhẹ nhàng không tiếng động là nét rất riêng và sinh động của loài mèo.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Chi tiết “đôi đệm thịt dưới bàn chân êm như nhung giúp chú rón rén bước đi không phát ra một tiếng động nhỏ” vừa có quan sát xúc giác, thính giác, vừa khắc họa đúng dáng đi đặc trưng của loài mèo.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi miêu tả cây phượng vĩ ở sân trường theo trình tự thời gian từ mùa xuân sang mùa hè, cách sắp xếp ý nào hợp lí nhất?",
        question_en:
          "Which sequence makes the most sense when describing a schoolyard flamboyant tree from spring to summer?",
        choices: [
          {
            id: "a",
            label_vi:
              "Tả quả phượng khô đen cuối thu trước, rồi tả hoa đỏ rực, sau đó quay lại tả chồi non đầu xuân.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chỉ tả chiếc ghế đá đặt dưới gốc phượng suốt từ đầu bài đến cuối bài.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mùa xuân tán lá non xanh mát như lá me; sang đầu hè từng chùm nụ hé mở rồi bừng nở đỏ rực giữa tiếng ve ngân.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Kể tên các loài cây bóng mát khác quanh khu phường em rồi tả kĩ từng cây mà không nhắc tới cây phượng.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trình tự thời gian từ xuân sang hè đòi hỏi em miêu tả sự biến đổi tuần tự của tán lá và sắc hoa theo mùa.",
        hint2_vi:
          "Nếu tả ghế đá hoặc kể tên các loài cây khác trong phường, bài viết sẽ bị lạc khỏi đối tượng miêu tả chính.",
        hint3_vi:
          "Đi từ tán lá non xanh mướt lúc xuân sang đến những chùm nụ và sắc hoa đỏ rực gọi ve về khi hè tới là mạch quan sát tự nhiên nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Sắp xếp từ tán lá non xanh mát mùa xuân đến lúc kết nụ và bừng nở hoa đỏ rực giữa tiếng ve mùa hè thể hiện rõ sự thay đổi của cây phượng theo dòng thời gian và làm nổi bật vẻ đẹp gắn với tuổi học trò.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Bình viết câu: “Quả mít chín trên cây rất ngon.” Em hãy giúp bạn viết lại câu văn có chi tiết quan sát bằng thị giác, xúc giác và khứu giác để câu tả sinh động hơn.",
        question_en:
          "Which revision best enriches Binh's sentence using sight, touch, and smell?",
        choices: [
          {
            id: "a",
            label_vi:
              "Quả mít chín trên cây vườn ngoại có trọng lượng khoảng năm ki-lô-gam.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nhà bà ngoại trồng ba cây mít mật ở góc vườn cạnh bờ ao.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Quả mít chín rất to, cả nhà em ai cũng thích ăn mít và mẹ thường mang biếu họ hàng mỗi dịp thu hoạch.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Quả mít chín ngả màu vàng nâu, gai nở thưa nhẵn tay và tỏa mùi thơm lừng khắp góc vườn.",
            correct: true,
          },
        ],
        hint1_vi:
          "Câu viết lại cần thay từ nhận xét chung chung “rất ngon” bằng những dấu hiệu cụ thể khi mít chín.",
        hint2_vi:
          "Nêu số cân nặng hay số lượng cây trong vườn chỉ cung cấp thông tin đo đếm, chưa gợi được cảm giác các giác quan.",
        hint3_vi:
          "Mắt thấy vỏ “ngả màu vàng nâu”, tay chạm thấy “gai nở thưa nhẵn tay” và mũi ngửi thấy “mùi thơm lừng khắp góc vườn” hội tụ đủ ba giác quan.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “Quả mít chín ngả màu vàng nâu, gai nở thưa nhẵn tay và tỏa mùi thơm lừng khắp góc vườn.” thay nhận xét chung chung bằng ba chi tiết tiêu biểu thu nhận từ mắt nhìn, tay chạm và mũi ngửi, giúp người đọc hình dung ngay trái mít chín cây.",
    },
  ],
};
