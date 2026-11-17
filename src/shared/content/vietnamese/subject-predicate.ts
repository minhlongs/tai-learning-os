/**
 * Tiếng Việt · Chủ ngữ và vị ngữ trong câu kể (skill: vie-subject-predicate, lớp 4)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const subjectPredicate: LessonDefinition = {
  id: "vie-subject-predicate",
  subjectId: "vietnamese",
  skillId: "vie-subject-predicate",
  titleVi: "Chủ ngữ và vị ngữ trong câu kể",
  titleEn: "Subject and Predicate in Declarative Sentences",
  objectiveVi:
    "Em sẽ xác định đúng chủ ngữ và vị ngữ trong ba kiểu câu kể quen thuộc và nhận ra câu văn bị thiếu thành phần chính.",
  objectiveEn:
    "Identify the subject and predicate in declarative sentences and spot incomplete sentences missing a main part.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-subject-predicate",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đặt ba câu kể thuộc ba mẫu: Ai làm gì?, Ai thế nào?, Ai là gì?",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu kể tiếng Việt, chủ ngữ và vị ngữ trả lời cho những câu hỏi nào?",
        question_en:
          "Which questions do the subject and predicate answer in Vietnamese declarative sentences?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chủ ngữ trả lời câu hỏi Khi nào, vào lúc nào?; vị ngữ trả lời câu hỏi Ở đâu hoặc tại địa điểm nào?",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Chủ ngữ trả lời câu hỏi Vì sao, nhờ nguyên nhân gì?; vị ngữ trả lời câu hỏi Bằng cách nào, với ai?",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chủ ngữ trả lời câu hỏi Ai, cái gì, con gì?; vị ngữ trả lời câu hỏi Làm gì, thế nào hoặc là gì?",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Cả chủ ngữ và vị ngữ đều chỉ trả lời cho câu hỏi Khi nào? để xác định thời gian diễn ra sự việc đó.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy nghĩ về hai phần chính làm nên nòng cốt của một câu kể.",
        hint2_vi:
          "Các câu hỏi Khi nào?, Ở đâu?, Vì sao? dùng để tìm thành phần phụ chứ không phải chủ ngữ hay vị ngữ.",
        hint3_vi:
          "Phần nêu người hoặc vật được nói tới trả lời Ai, cái gì, con gì?; phần nêu hoạt động, đặc điểm hoặc giới thiệu trả lời Làm gì, thế nào, là gì?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Trong câu kể, chủ ngữ nêu người, sự vật, con vật được nói đến (trả lời Ai? Cái gì? Con gì?), còn vị ngữ nêu hoạt động, đặc điểm hoặc nhận định về chủ ngữ đó (trả lời Làm gì? Thế nào? Là gì?).",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Những bác nông dân đang gặt lúa trên cánh đồng làng.”, bộ phận vị ngữ là phần nào?",
        question_en:
          "Which part is the predicate in the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "đang gặt lúa trên cánh đồng làng",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Những bác nông dân",
            correct: false,
          },
          {
            id: "c",
            label_vi: "trên cánh đồng làng",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Những bác nông dân đang gặt lúa trên cánh đồng",
            correct: false,
          },
        ],
        hint1_vi:
          "Đây là câu kể theo mẫu Ai làm gì? Em hãy tách phần nêu người làm ra trước.",
        hint2_vi:
          "“Những bác nông dân” trả lời cho câu hỏi Ai?, nên đó là chủ ngữ của câu.",
        hint3_vi:
          "Toàn bộ cụm từ kể việc các bác đang thực hiện ở sau chủ ngữ chính là vị ngữ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Những bác nông dân” là chủ ngữ trả lời câu hỏi Ai?, còn “đang gặt lúa trên cánh đồng làng” trả lời câu hỏi Làm gì? nên là bộ phận vị ngữ của câu.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây thuộc mẫu câu kể “Ai là gì?” dùng để giới thiệu hoặc nêu nhận định?",
        question_en:
          "Which sentence follows the 'Ai là gì?' declarative pattern?",
        choices: [
          {
            id: "a",
            label_vi: "Tiếng sáo diều ngân vang tha thiết giữa bầu trời chiều lộng gió.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mặt nước hồ Ba Bể mùa thu trong vắt như tấm gương soi bóng núi.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Mấy chú chim sẻ nâu nhảy nhót ríu rít trên cành bàng trước lớp.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Trống đồng Đông Sơn là bảo vật quý giá của dân tộc ta.",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy quan sát vị ngữ của từng câu xem câu nào giới thiệu bản chất hoặc vai trò của sự vật.",
        hint2_vi:
          "Câu tả tiếng sáo “ngân vang” và chim sẻ “nhảy nhót” thuộc mẫu Ai làm gì?; câu tả nước hồ “trong vắt” thuộc mẫu Ai thế nào?",
        hint3_vi:
          "Vị ngữ của mẫu câu Ai là gì? thường bắt đầu bằng từ “là” nối chủ ngữ với lời giới thiệu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “Trống đồng Đông Sơn là bảo vật quý giá của dân tộc ta.” có chủ ngữ “Trống đồng Đông Sơn” và vị ngữ “là bảo vật quý giá của dân tộc ta”, thuộc đúng mẫu câu kể Ai là gì? dùng để giới thiệu và nhận định.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Dòng nào dưới đây chưa phải là câu hoàn chỉnh vì bị thiếu vị ngữ?",
        question_en:
          "Which line is an incomplete sentence because it lacks a predicate?",
        choices: [
          {
            id: "a",
            label_vi: "Hàng phượng vĩ quanh sân trường đang nở hoa đỏ rực rỡ.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chiếc cặp sách màu xanh da trời mẹ mới mua cho em hôm qua.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Cơn gió chiều thổi mát rượi cả hiên nhà.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Bạn Thu Hà là lớp trưởng gương mẫu của lớp Bốn Một và rất hay giúp đỡ các bạn trong lớp.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đọc từng dòng và tự hỏi: sau khi gọi tên sự vật, người viết đã nói sự vật ấy làm gì, thế nào hay là gì chưa?",
        hint2_vi:
          "Đừng để độ dài đánh lừa: một cụm danh từ có thêm phần giải thích vẫn có thể chưa có vị ngữ.",
        hint3_vi:
          "Cụm “mẹ mới mua cho em hôm qua” chỉ làm rõ thêm cho “chiếc cặp sách màu xanh da trời”, chứ chưa cho biết chiếc cặp ấy thế nào hay nằm ở đâu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Dòng “Chiếc cặp sách màu xanh da trời mẹ mới mua cho em hôm qua.” mới chỉ nêu một cụm danh từ làm chủ ngữ (chiếc cặp nào?), hoàn toàn chưa có vị ngữ cho biết chiếc cặp đó ra sao hay được dùng thế nào.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn An viết dở dòng chữ: “Đang chăm chú tưới nước cho luống rau cải sau vườn.” Em nên sửa thế nào để câu có đủ chủ ngữ và vị ngữ?",
        question_en:
          "How should An revise the fragment so it has both a subject and a predicate?",
        choices: [
          {
            id: "a",
            label_vi: "Đang chăm chú tưới nước cho luống rau cải xanh non sau vườn.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vào buổi chiều mát, đang chăm chú tưới nước cho luống rau cải sau vườn.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Ông nội đang chăm chú tưới nước cho luống rau cải sau vườn.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Chăm chú tưới nước cho hai luống rau cải sau vườn nhà.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy kiểm tra xem dòng chữ của bạn An đang thiếu người thực hiện hành động hay thiếu hành động.",
        hint2_vi:
          "Thêm từ chỉ thời gian “Vào buổi chiều mát” chỉ bổ sung trạng ngữ, người đọc vẫn chưa biết ai tưới rau.",
        hint3_vi:
          "Cần thêm từ chỉ người đứng đầu câu trả lời cho câu hỏi Ai? trước cụm “đang chăm chú tưới nước…”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu viết dở của bạn An mới có phần vị ngữ “đang chăm chú tưới nước cho luống rau cải sau vườn” mà thiếu chủ ngữ. Thêm chủ ngữ “Ông nội” vào đầu câu giúp người đọc biết rõ ai đang thực hiện công việc đó.",
    },
  ],
};
