/**
 * Tiếng Việt · Câu ghép và cặp quan hệ từ (skill: vie-compound-sentences, lớp 5)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const compoundSentences: LessonDefinition = {
  id: "vie-compound-sentences",
  subjectId: "vietnamese",
  skillId: "vie-compound-sentences",
  titleVi: "Câu ghép và cách nối các vế câu ghép",
  titleEn: "Compound Sentences and Correlative Conjunctions",
  objectiveVi:
    "Em sẽ nhận biết cấu tạo của câu ghép và sử dụng đúng các cặp quan hệ từ để thể hiện quan hệ nguyên nhân, điều kiện, tương phản.",
  objectiveEn:
    "Identify the structure of compound sentences and use correlative conjunction pairs to express cause, condition, and contrast.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-compound-sentences",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đặt ba câu ghép dùng các cặp quan hệ từ: Vì… nên…, Nếu… thì…, Tuy… nhưng…",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đặc điểm cấu tạo nào giúp em phân biệt câu ghép với câu đơn?",
        question_en:
          "Which structural feature distinguishes a compound sentence from a simple sentence?",
        choices: [
          {
            id: "a",
            label_vi:
              "Câu ghép chỉ có một cụm chủ ngữ – vị ngữ duy nhất, dù thêm nhiều trạng ngữ đầu câu.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Câu ghép do hai hoặc nhiều cụm chủ ngữ – vị ngữ (vế câu) có quan hệ chặt chẽ về ý nghĩa tạo thành.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Câu nào có từ mười lăm chữ trở lên thì đều được gọi là câu ghép.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Câu ghép là câu bắt buộc phải kết thúc bằng dấu chấm hỏi hoặc dấu chấm than.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đếm số cụm chủ ngữ – vị ngữ độc lập chứ đừng đếm số chữ trong câu.",
        hint2_vi:
          "Một câu đơn dù thêm nhiều trạng ngữ chỉ thời gian, nơi chốn vẫn chỉ có một nòng cốt chủ ngữ – vị ngữ.",
        hint3_vi:
          "Khi trong một câu có từ hai vế câu trở lên, mỗi vế đều có chủ ngữ và vị ngữ riêng gắn bó ý nghĩa với nhau, đó là câu ghép.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu ghép được tạo bởi hai hoặc nhiều vế câu (mỗi vế thường có cấu tạo giống một cụm chủ ngữ – vị ngữ) có mối quan hệ ý nghĩa chặt chẽ với nhau.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Dòng nào dưới đây là một câu ghép có đủ hai vế chủ ngữ – vị ngữ?",
        question_en:
          "Which of the following is a compound sentence with two complete subject-predicate clauses?",
        choices: [
          {
            id: "a",
            label_vi:
              "Sáng sớm mùa thu, làn sương mỏng giăng nhẹ trên mặt hồ yên ả.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Những chùm nhãn lồng vàng óng đung đưa trong gió chiều mát rượi.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mây đen kéo đến kín bầu trời, gió thổi mạnh làm hàng cây nghiêng ngả.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Dưới mái hiên trường, các bạn lớp Năm đang đọc báo thiếu nhi.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy tách từng câu theo dấu phẩy và kiểm tra xem phần đứng trước dấu phẩy là trạng ngữ hay là một vế câu hoàn chỉnh.",
        hint2_vi:
          "“Sáng sớm mùa thu” và “Dưới mái hiên trường” chỉ là trạng ngữ thời gian và nơi chốn, chưa phải một vế chủ ngữ – vị ngữ.",
        hint3_vi:
          "Vế thứ nhất có chủ ngữ “Mây đen” và vị ngữ “kéo đến kín bầu trời”; vế thứ hai có chủ ngữ “gió” và vị ngữ “thổi mạnh làm hàng cây nghiêng ngả”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu “Mây đen kéo đến kín bầu trời, gió thổi mạnh làm hàng cây nghiêng ngả.” gồm hai vế câu nối trực tiếp bằng dấu phẩy: vế một (Mây đen / kéo đến kín bầu trời) và vế hai (gió / thổi mạnh làm hàng cây nghiêng ngả).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu ghép “Tuy đường lên bản vùng cao còn nhiều dốc đá gập ghềnh nhưng các thầy cô giáo vẫn đều đặn đến lớp đúng giờ.”, cặp quan hệ từ “Tuy… nhưng…” biểu thị quan hệ gì?",
        question_en:
          "What semantic relationship does the conjunction pair 'Tuy… nhưng…' express?",
        choices: [
          {
            id: "a",
            label_vi: "Quan hệ tương phản.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Quan hệ nguyên nhân – kết quả.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Quan hệ điều kiện – kết quả.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Quan hệ tăng tiến.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đối chiếu ý nghĩa của hai vế: đường đi rất vất vả với việc thầy cô vẫn đến lớp đúng giờ.",
        hint2_vi:
          "Quan hệ nguyên nhân thường dùng “Vì… nên…”, còn quan hệ điều kiện thường dùng “Nếu… thì…”.",
        hint3_vi:
          "Hai vế nêu hai sự việc trái chiều nhau nhằm làm nổi bật nghị lực của các thầy cô giáo, đó là quan hệ tương phản.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Cặp quan hệ từ “Tuy… nhưng…” nối hai vế câu có ý nghĩa đối lập nhau (đường dốc khó đi và sự bền bỉ đến lớp đúng giờ), biểu thị quan hệ tương phản.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cặp quan hệ từ nào thích hợp nhất để điền vào hai chỗ trống trong câu ghép: “___ chúng em phân loại rác nhựa ngay tại lớp học ___ sân trường luôn sạch đẹp và giảm được lượng rác thải ra môi trường.”?",
        question_en:
          "Which correlative conjunction pair best fits the blanks in the compound sentence?",
        choices: [
          {
            id: "a",
            label_vi: "Mặc dù … nhưng …",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Tuy … nhưng …",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chẳng những … mà …",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Nếu … thì …",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy xét mối liên hệ giữa việc phân loại rác nhựa ở vế đầu và kết quả sân trường sạch đẹp ở vế sau.",
        hint2_vi:
          "Hai vế không đối lập nhau nên không thể dùng “Mặc dù… nhưng…” hay “Tuy… nhưng…”.",
        hint3_vi:
          "Vế đầu nêu giả thiết hoặc điều kiện thực hiện, vế sau nêu kết quả tích cực đạt được khi điều kiện đó diễn ra.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Hai vế câu có quan hệ điều kiện – kết quả: việc phân loại rác tại lớp là điều kiện dẫn tới kết quả sân trường sạch đẹp và giảm rác thải, nên cặp quan hệ từ “Nếu… thì…” là phù hợp nhất (ngoài ra khi nói về sự việc đã xảy ra có thể dùng quan hệ nguyên nhân, nhưng trong bốn từ nối đã cho thì “Nếu… thì…” diễn đạt hoàn chỉnh và tự nhiên nhất).",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cho hai câu đơn: “Rừng phòng hộ đầu nguồn giữ nước mưa rất tốt. Làng mạc dưới chân núi ít bị lũ quét vào mùa mưa bão.” Cách gộp thành câu ghép nào dưới đây giữ đúng quan hệ nguyên nhân – kết quả?",
        question_en:
          "Which compound sentence accurately combines the two simple sentences with a cause-and-effect relationship?",
        choices: [
          {
            id: "a",
            label_vi:
              "Tuy rừng phòng hộ đầu nguồn giữ nước mưa rất tốt nhưng làng mạc dưới chân núi ít bị lũ quét.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Nhờ rừng phòng hộ đầu nguồn giữ nước mưa rất tốt nên làng mạc dưới chân núi ít bị lũ quét vào mùa mưa bão.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Vì làng mạc dưới chân núi ít bị lũ quét nên rừng phòng hộ đầu nguồn giữ nước mưa rất tốt.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Giá mà rừng phòng hộ đầu nguồn giữ nước mưa thật tốt thì làng mạc dưới chân núi đã bị lũ quét nặng nề vào mùa mưa bão.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy xác định rõ câu nào là nguyên nhân đáng quý, câu nào là kết quả tốt đẹp nhờ nguyên nhân đó mang lại.",
        hint2_vi:
          "Đảo ngược vế kết quả lên sau chữ “Vì” sẽ làm sai lệch mối quan hệ thực tế của tự nhiên.",
        hint3_vi:
          "Khi nguyên nhân mang lại kết quả tích cực, cặp quan hệ từ “Nhờ… nên…” vừa chỉ đúng nguyên nhân – kết quả vừa thể hiện sự trân trọng vai trò của rừng phòng hộ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Việc rừng phòng hộ giữ nước mưa tốt là nguyên nhân tích cực dẫn đến kết quả làng mạc ít bị lũ quét. Dùng cặp quan hệ từ “Nhờ… nên…” đặt đúng thứ tự nguyên nhân trước, kết quả sau giúp câu ghép chặt chẽ và chuẩn nghĩa.",
    },
  ],
};
