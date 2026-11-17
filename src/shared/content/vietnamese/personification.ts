/**
 * Tiếng Việt · Biện pháp nhân hóa trong thơ văn thiếu nhi (skill: vie-personification, lớp 4)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const personification: LessonDefinition = {
  id: "vie-personification",
  subjectId: "vietnamese",
  skillId: "vie-personification",
  titleVi: "Biện pháp nhân hóa trong thơ văn",
  titleEn: "Personification in Children's Literature",
  objectiveVi:
    "Em sẽ nhận biết các cách nhân hóa sự vật và hiểu tác dụng làm cho cảnh vật, con vật trở nên gần gũi, sinh động.",
  objectiveEn:
    "Recognize ways objects and animals are personified and understand how personification makes descriptions vivid and relatable.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-personification",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách viết hai câu tả cây bàng hoặc chú chó nhỏ có dùng biện pháp nhân hóa.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Biện pháp nhân hóa trong thơ văn là gì?",
        question_en:
          "What is personification in poetry and prose?",
        choices: [
          {
            id: "a",
            label_vi:
              "Là cách liệt kê thật nhiều số đo về chiều cao, cân nặng và cả tuổi của từng đồ vật trong nhà.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Là đặt hai sự vật có nét giống nhau cạnh từ “như” để người đọc dễ hình dung và đối chiếu chúng với nhau.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Là lặp đi lặp lại một từ thật nhiều lần ở đầu mọi câu văn để bài viết nghe thật nhịp nhàng, dễ nhớ.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Là gọi hoặc tả con vật, cây cối, đồ vật bằng những từ ngữ vốn dùng cho con người.",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy chú ý chữ “nhân” nghĩa là người, “hóa” nghĩa là làm cho trở thành giống như vậy.",
        hint2_vi:
          "Cách dùng từ “như” để đối chiếu hai sự vật là biện pháp so sánh, không phải nhân hóa.",
        hint3_vi:
          "Khi gọi “bác mặt trời”, “chị gió” hay tả đám mây “dạo chơi”, người viết đang dùng từ vốn dành cho con người để nói về sự vật.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Nhân hóa là cách gọi hoặc tả con vật, cây cối, đồ vật, hiện tượng tự nhiên bằng những từ ngữ vốn dùng để gọi hoặc tả hoạt động, tính nết của con người, giúp sự vật hiện lên gần gũi và có hồn.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Bác đa già trầm ngâm đứng gác đầu làng suốt bao mùa nắng mưa.”, tác giả đã nhân hóa cây đa bằng những cách nào?",
        question_en:
          "How is the banyan tree personified in the sentence?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ dùng cách trò chuyện trực tiếp với cây đa như đang nói chuyện thân mật với một người bạn thân thiết đứng bên cạnh mình.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vừa gọi cây bằng từ gọi người (“bác”), vừa tả cây bằng từ chỉ tâm trạng, hoạt động của người (“trầm ngâm”, “đứng gác”).",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Chỉ miêu tả kích thước thật của tán lá và rễ cây đa rồi kể lại cảm giác mát mẻ, dễ chịu mỗi khi cả xóm ngồi nghỉ dưới gốc cây vào những trưa hè oi ả.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "So sánh cây đa với ngọn núi cao bằng từ “như”.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy nhìn từ đứng trước chữ “đa già” và những từ diễn tả dáng vẻ, việc làm của cây.",
        hint2_vi:
          "Từ “bác” vốn dùng để xưng hô với người lớn tuổi trong gia đình hoặc xóm làng.",
        hint3_vi:
          "Ngoài từ gọi “bác”, hai cụm từ “trầm ngâm” (dáng vẻ suy tư) và “đứng gác” (nhiệm vụ canh giữ) cũng là từ tả tính nết, hoạt động của người.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu văn kết hợp hai cách nhân hóa: gọi cây đa bằng từ gọi người kính trọng là “bác”, đồng thời tả cây bằng từ chỉ tâm trạng và công việc của con người là “trầm ngâm” và “đứng gác”.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Buổi sáng trong góc vườn nhỏ",
        passage_vi:
          "Khi ông mặt trời vừa vén màn mây hồng nhìn xuống sân, khu vườn nhà Mai bỗng rộn rã hẳn lên. Chị gió xuân dịu dàng đi qua từng luống cải, khẽ đánh thức những búp non còn ngái ngủ. Bên bờ giậu, mấy cô cúc vàng tươi cười nghiêng đầu chào đàn bướm trắng. Chiếc bình tưới nước bằng nhựa xanh nằm cạnh vòi nước chờ tay Mai ra chăm cây. Cả khu vườn nhỏ ấm áp như một gia đình thân thương.",
        question_vi:
          "Trong đoạn văn trên, chi tiết nào nhân hóa ngọn gió xuân bằng hoạt động và tính nết dịu hiền của con người?",
        choices: [
          {
            id: "a",
            label_vi: "Chiếc bình tưới màu xanh vẫn nằm im cạnh vòi nước chờ tay Mai chăm cây.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Trong vườn trồng nhiều luống cải và có bờ giậu hoa cúc vàng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chị gió xuân dịu dàng đi qua từng luống cải và khẽ đánh thức những búp non.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Mai thường ra vườn tưới cây vào mỗi buổi sáng sớm.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Chị gió xuân dịu dàng đi qua từng luống cải, khẽ đánh thức những búp non còn ngái ngủ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trong bài đọc, ngọn gió được gọi thân mật là “chị gió xuân” và được miêu tả với tính nết “dịu dàng”, biết “đi qua” và “khẽ đánh thức” những búp non còn ngái ngủ như một người chị ân cần.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu văn nào dưới đây có sử dụng biện pháp nhân hóa?",
        question_en:
          "Which of the following sentences uses personification?",
        choices: [
          {
            id: "a",
            label_vi: "Dòng suối nhỏ vui vẻ trò chuyện rì rầm cùng những hòn cuội trắng bên bờ.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Nước suối đầu nguồn mát lạnh, trong vắt đến mức nhìn thấu đáy cát.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Mặt hồ phẳng lặng như một tấm gương khổng lồ giữa thung lũng.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Hai bên bờ suối mọc nhiều bụi dương xỉ xanh rì.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy tìm câu gán cho dòng nước hoặc mặt hồ một hoạt động giao tiếp chỉ con người mới có.",
        hint2_vi:
          "Câu tả mặt hồ “như một tấm gương khổng lồ” dùng biện pháp so sánh chứ không phải nhân hóa.",
        hint3_vi:
          "Chỉ con người mới biết “vui vẻ trò chuyện” cùng bạn bè; khi gán nét ấy cho dòng suối, câu văn đã dùng nhân hóa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu “Dòng suối nhỏ vui vẻ trò chuyện rì rầm cùng những hòn cuội trắng bên bờ.” dùng từ chỉ cảm xúc và giao tiếp của người (“vui vẻ trò chuyện”) để tả tiếng nước chảy qua kẽ đá, đó chính là biện pháp nhân hóa.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Từ câu tả thực “Chiếc đồng hồ báo thức trên bàn kêu reng reng đúng sáu giờ sáng.”, cách viết lại nào dưới đây sử dụng nhân hóa sinh động và tự nhiên nhất?",
        question_en:
          "Which rewrite best uses vivid and natural personification for the alarm clock?",
        choices: [
          {
            id: "a",
            label_vi: "Chiếc đồng hồ báo thức hình tròn màu cam kêu reng reng lúc sáu giờ sáng.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tiếng chuông đồng hồ báo thức vang to như tiếng còi tàu đầu ngõ.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đúng sáu giờ sáng, chiếc đồng hồ điện tử trên bàn học phát ra những âm thanh báo thức đều đặn và khô khan.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Đúng sáu giờ sáng, anh bạn đồng hồ chăm chỉ cất tiếng hát reng reng giục em thức dậy.",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy biến chiếc đồng hồ thành một người bạn gần gũi có tính cách và hành động đáng mến.",
        hint2_vi:
          "Thêm màu sắc “hình tròn màu cam” chỉ là tả thực; dùng “như tiếng còi tàu” là biện pháp so sánh.",
        hint3_vi:
          "Gọi đồng hồ là “anh bạn”, khen tính nết “chăm chỉ” và tả tiếng chuông là “cất tiếng hát… giục em thức dậy” tạo nên hình ảnh nhân hóa trọn vẹn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cách viết “Đúng sáu giờ sáng, anh bạn đồng hồ chăm chỉ cất tiếng hát reng reng giục em thức dậy.” gọi đồ vật là “anh bạn” và dùng các từ chỉ phẩm chất, hành động của người (“chăm chỉ”, “cất tiếng hát”, “giục”) làm câu văn ấm áp và giàu sức gợi.",
    },
  ],
};
