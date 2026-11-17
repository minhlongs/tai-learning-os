/**
 * Khoa học · Hỗn hợp, dung dịch và các phương pháp tách chất (skill: sci-mixtures-solutions, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 5.
 */
import type { LessonDefinition } from "../types";

export const mixturesSolutions: LessonDefinition = {
  id: "sci-mixtures-solutions",
  subjectId: "science",
  skillId: "sci-mixtures-solutions",
  titleVi: "Hỗn hợp, dung dịch và cách tách chất",
  titleEn: "Mixtures, Solutions, and Separation Methods",
  objectiveVi:
    "Em phân biệt được hỗn hợp không đồng nhất với dung dịch hòa tan và lựa chọn đúng phương pháp sàng, lắng, lọc hoặc làm bay hơi để tách các chất.",
  objectiveEn:
    "Distinguish heterogeneous mixtures from solutions and choose sieving, settling, filtering, or evaporation to separate substances.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-mixtures-solutions",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách khuấy thử một thìa đường vào cốc nước lọc và so sánh với khi vo gạo trong chậu nước.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cho một thìa muối tinh vào cốc nước thứ nhất và một thìa cát sạch vào cốc nước thứ hai rồi khuấy đều. Kết quả nào dưới đây giúp em phân biệt đúng dung dịch với hỗn hợp không đồng nhất?",
        question_en:
          "Stirring table salt into one glass of water and clean sand into another: which observation correctly distinguishes a solution from a heterogeneous mixture?",
        choices: [
          {
            id: "a",
            label_vi:
              "Hạt cát tan hoàn toàn tạo dung dịch trong suốt, còn hạt muối tinh không tan nên chìm hết xuống đáy cốc.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Muối tan hết tạo dung dịch nước muối đồng nhất; còn cát không tan tạo hỗn hợp cát và nước.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Cả muối và cát đều biến mất vĩnh viễn thành hơi nước ngay khi chạm nước.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Muối và cát đều kết thành đá cuội nổi lềnh bềnh trên mặt nước.",
            correct: false,
          },
        ],
        hint1_vi:
          "Sau khi khuấy kỹ một lúc, ở cốc nào em không còn nhìn thấy từng hạt rắn riêng rẽ nữa?",
        hint2_vi:
          "Dung dịch là hỗn hợp chất lỏng với chất hòa tan hoàn toàn và phân bố đồng đều mọi phần.",
        hint3_vi:
          "Muối ăn tan hết trong nước tạo thành dung dịch đồng nhất, còn các hạt cát không tan lắng dưới đáy tạo hỗn hợp không đồng nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi hai hay nhiều chất trộn lẫn nhưng giữ nguyên tính chất tạo thành hỗn hợp. Riêng khi chất rắn (như muối, đường) hoặc chất lỏng tan hoàn toàn và phân bố đồng đều trong nước thì hỗn hợp đồng nhất đó gọi là dung dịch.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để tách những viên sỏi to ra khỏi đống cát mịn dùng xây nhà, hoặc tách tấm nhỏ ra khỏi hạt gạo nguyên, người lao động thường áp dụng phương pháp nào?",
        question_en:
          "To separate coarse pebbles from fine building sand, or broken bits from whole rice grains, which method is commonly used?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đun sôi thật lâu cho cát và sỏi cùng bay hơi hết lên không khí rồi ngưng tụ lại.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đổ toàn bộ hỗn hợp vào bể nước lớn khuấy mạnh cho cả sỏi và cát hòa tan thành dung dịch trong suốt.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Dùng lưới sàng mắt phù hợp để hạt nhỏ lọt qua và hạt lớn giữ lại trên mặt sàng.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Đổ dầu ăn thật nhiều vào để các viên sỏi to tự tan chảy thành nước trong veo.",
            correct: false,
          },
        ],
        hint1_vi:
          "Cả sỏi và cát đều là chất rắn không tan trong nước, nhưng kích thước hạt của chúng khác nhau rõ rệt.",
        hint2_vi:
          "Một tấm lưới mắt nhỏ cho phép hạt cát mịn rơi qua nhưng chặn lại viên sỏi to hơn mắt lưới.",
        hint3_vi:
          "Phương pháp tách hai chất rắn có kích thước hạt khác nhau bằng dụng cụ có lỗ nhỏ đều nhau gọi là sàng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Phương pháp sàng dựa trên sự chênh lệch kích thước giữa các hạt chất rắn: hạt mịn nhỏ hơn lỗ sàng sẽ lọt xuống dưới, còn hạt lớn hơn nằm lại trên sàng.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một lọ nước giếng khoan mới bơm lên bị đục do lẫn các hạt bùn đất và cát mịn không tan. Muốn tách bỏ phần bùn cát này để thu nước trong, ta kết hợp hai cách nào?",
        question_en:
          "Freshly pumped water is cloudy with insoluble mud and fine sand. Which pair of methods removes these insoluble particles?",
        choices: [
          {
            id: "a",
            label_vi:
              "Dùng rổ thưa có mắt to để vớt từng phân tử nước đục ra khỏi lọ thủy tinh.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Dùng đũa khuấy thật mạnh liên tục suốt nhiều giờ để các hạt bùn đất và cát mịn tự hòa tan hết vào nước.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cho thêm nhiều muối ăn vào khuấy đều để bùn đất hóa thành những hạt đường kính trắng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Để yên cho hạt nặng lắng xuống đáy, gạn nước rồi cho chảy qua bông, giấy lọc hoặc tầng cát sỏi sạch.",
            correct: true,
          },
        ],
        hint1_vi:
          "Các hạt bùn cát nặng hơn nước và không tan trong nước; nếu để cốc đứng yên một lúc thì chúng sẽ di chuyển đi đâu?",
        hint2_vi:
          "Sau khi hạt nặng chìm xuống đáy (lắng), những hạt lơ lửng rất nhỏ còn lại có thể bị giữ lại bởi khe nhỏ của bông hoặc giấy lọc.",
        hint3_vi:
          "Kết hợp lắng và lọc giúp tách hiệu quả các chất rắn không tan ra khỏi chất lỏng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Với các chất rắn không tan trong nước, để yên giúp hạt nặng lắng xuống đáy (lắng), sau đó cho nước đi qua bông hoặc giấy lọc để giữ lại cặn mịn còn lơ lửng (lọc).",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trên cánh đồng muối ven biển, diêm dân dẫn nước biển mặn vào ruộng phẳng dưới nắng gió. Vì sao người ta không dùng giấy lọc để lấy muối mà phải phơi nắng cho nước bay hơi?",
        question_en:
          "On coastal salt fields, why do salt farmers evaporate seawater under sun and wind instead of pouring seawater through filter paper?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì muối tan hết nên lọt qua giấy lọc; chỉ khi nước bay hơi, muối mới kết tinh lại.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Vì nước biển nặng gấp mười lần hạt muối nên tự chìm xuyên xuống lòng đất.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì ánh nắng biến cát biển thành muối trắng mà không cần tới nước biển.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì giấy lọc chỉ cho hạt muối đi qua còn giữ chặt toàn bộ nước lại.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nước biển trong đã lọc sạch rác là hỗn hợp không đồng nhất hay là dung dịch có muối hòa tan?",
        hint2_vi:
          "Giấy lọc chỉ giữ được chất rắn không tan, còn chất đã tan hoàn toàn sẽ đi xuyên qua lỗ giấy lọc cùng nước.",
        hint3_vi:
          "Nước có tính bay hơi dưới nắng gió còn muối ăn không bay hơi theo, nên phơi nắng làm nước bay đi sẽ thu được tinh thể muối trắng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Lọc không tách được chất đã hòa tan trong dung dịch. Muốn tách chất rắn hòa tan không bay hơi (như muối ăn) ra khỏi nước, ta dùng phương pháp làm bay hơi nước.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong giờ thực hành, một nhóm lỡ tay làm đổ lẫn một thìa muối tinh sạch vào đĩa cát thạch anh sạch (hạt cát và hạt muối có kích thước gần bằng nhau). Quy trình nào dưới đây giúp tách riêng cát và thu lại muối tinh khiết?",
        question_en:
          "Salt and clean quartz sand of similar grain size are accidentally mixed. Which procedure separates the sand and recovers the salt?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đổ hỗn hợp khô lên rây lưới lắc nhẹ một lượt để các hạt muối và hạt cát có kích thước ngang nhau tự tách sang hai góc.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Hòa nước sạch cho muối tan, lọc qua giấy lọc giữ cát lại, rồi đun nước lọc bay hơi để thu muối.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Phơi hỗn hợp khô ngoài nắng để hạt cát tự bay hơi hết chỉ còn muối ở lại.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Đổ hỗn hợp qua phễu khô không có giấy lọc để muối đứng yên còn cát tự chảy xuống.",
            correct: false,
          },
        ],
        hint1_vi:
          "Vì kích thước hai loại hạt gần bằng nhau nên sàng không tách riêng được; hãy nhớ lại tính tan trong nước khác nhau giữa muối và cát.",
        hint2_vi:
          "Khi cho nước vào khuấy đều, muối tan thành dung dịch còn cát không tan nằm lại ở thể rắn.",
        hint3_vi:
          "Bước một hòa nước cho muối tan; bước hai lọc thu cát trên giấy lọc; bước ba làm bay hơi nước muối trong suốt để kết tinh lại muối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Dựa vào sự khác biệt tính tan: hòa vào nước để muối tan hết còn cát không tan, dùng giấy lọc tách riêng phần cát, sau đó đun cho nước trong dung dịch bay hơi để thu hồi muối kết tinh.",
    },
  ],
};
