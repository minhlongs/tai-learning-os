/**
 * Tiếng Việt · Trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân (skill: vie-adverbials, lớp 4)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const adverbials: LessonDefinition = {
  id: "vie-adverbials",
  subjectId: "vietnamese",
  skillId: "vie-adverbials",
  titleVi: "Trạng ngữ và dấu phẩy ngăn cách trạng ngữ",
  titleEn: "Adverbials of Time, Place, and Cause",
  objectiveVi:
    "Em sẽ nhận diện được trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân và dùng dấu phẩy ngăn cách đúng trạng ngữ với chủ ngữ, vị ngữ.",
  objectiveEn:
    "Identify adverbials of time, place, and cause, and punctuate them properly with a comma before the main clause.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-adverbials",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách thêm trạng ngữ chỉ thời gian hoặc nơi chốn vào đầu ba câu kể.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vai trò của trạng ngữ và quy tắc đặt dấu câu khi trạng ngữ đứng đầu câu là gì?",
        question_en:
          "What is the role of an adverbial and how is it punctuated at the start of a sentence?",
        choices: [
          {
            id: "a",
            label_vi:
              "Bổ sung thông tin về thời gian, nơi chốn, nguyên nhân… cho câu và thường ngăn cách với chủ ngữ, vị ngữ bằng dấu phẩy.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Thay thế hoàn toàn cho bộ phận vị ngữ chính của câu kể và luôn phải ngăn cách với chủ ngữ đứng trước bằng dấu chấm than.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Gọi tên nhân vật hoặc sự vật chính được nói đến trong câu và luôn ngăn cách với bộ phận vị ngữ theo sau bằng dấu hai chấm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Biến mọi câu kể thông thường thành câu dùng để hỏi người nghe nên ở cuối câu lúc nào cũng bắt buộc phải đặt dấu chấm hỏi.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đọc câu “Sáng Chủ nhật, em cùng mẹ đi chợ hoa.” và quan sát cụm từ đứng trước dấu phẩy.",
        hint2_vi:
          "Nếu lược bỏ “Sáng Chủ nhật”, phần “em cùng mẹ đi chợ hoa” vẫn đủ chủ ngữ và vị ngữ.",
        hint3_vi:
          "Thành phần phụ đứng đầu câu làm rõ lúc nào, ở đâu, vì sao sự việc diễn ra và được tách khỏi nòng cốt câu bằng dấu phẩy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Trạng ngữ là thành phần phụ bổ sung thông tin về thời gian, nơi chốn, nguyên nhân, mục đích… cho sự việc nêu trong câu. Khi đứng đầu câu, trạng ngữ thường được ngăn cách với cụm chủ ngữ – vị ngữ bằng dấu phẩy.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Dưới bóng tre xanh mát, đàn trâu thong thả nằm nhai cỏ.”, trạng ngữ “Dưới bóng tre xanh mát” bổ sung ý nghĩa gì?",
        question_en:
          "What kind of meaning does the adverbial 'Dưới bóng tre xanh mát' add to the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ thời gian diễn ra sự việc.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chỉ nguyên nhân của sự việc.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chỉ nơi chốn diễn ra sự việc.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Chỉ mục đích của hoạt động.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đặt câu hỏi cho cụm từ “Dưới bóng tre xanh mát” để xem nó trả lời cho từ để hỏi nào.",
        hint2_vi:
          "Đàn trâu nằm nhai cỏ ở đâu? Câu trả lời chính là “Dưới bóng tre xanh mát”.",
        hint3_vi:
          "Bộ phận trả lời cho câu hỏi Ở đâu? luôn là trạng ngữ chỉ địa điểm, nơi chốn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cụm từ “Dưới bóng tre xanh mát” trả lời cho câu hỏi Ở đâu?, cho biết vị trí đàn trâu nằm nghỉ, nên đây là trạng ngữ chỉ nơi chốn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây mở đầu bằng một trạng ngữ chỉ nguyên nhân?",
        question_en:
          "Which sentence begins with an adverbial of cause?",
        choices: [
          {
            id: "a",
            label_vi: "Ngoài hiên nhà, giàn hoa giấy bung nở sắc tím rực rỡ làm sáng bừng cả góc sân nhỏ.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Nhờ chăm chỉ tưới nước mỗi ngày, luống hoa cúc của lớp đã nở rộ đúng dịp lễ.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Khi tiếng trống trường vang lên, chúng em nhanh nhẹn xếp hàng ngay ngắn bước vào lớp học.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Trên mặt đầm phẳng lặng, mấy búp sen hồng vừa hé nở tỏa hương thơm ngát trong nắng sớm.",
            correct: false,
          },
        ],
        hint1_vi:
          "Trạng ngữ chỉ nguyên nhân trả lời cho câu hỏi Vì sao? hoặc Nhờ đâu?",
        hint2_vi:
          "Các cụm “Ngoài hiên nhà”, “Trên mặt đầm phẳng lặng” chỉ nơi chốn; cụm “Khi tiếng trống trường vang lên” chỉ thời gian.",
        hint3_vi:
          "Hãy tìm câu giải thích lí do khiến luống hoa cúc của lớp nở rộ đúng dịp lễ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Cụm “Nhờ chăm chỉ tưới nước mỗi ngày” trả lời câu hỏi Nhờ đâu? (Vì sao?) giải thích lí do luống hoa nở rộ đúng dịp lễ, nên là trạng ngữ chỉ nguyên nhân.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây đặt dấu phẩy đúng vị trí để ngăn cách trạng ngữ với chủ ngữ và vị ngữ?",
        question_en:
          "Which sentence places the comma accurately between the adverbial and the main clause?",
        choices: [
          {
            id: "a",
            label_vi: "Vào những đêm trăng rằm lũ trẻ trong xóm, vẫn rủ nhau rước đèn quanh sân đình và hát vang những bài đồng dao quen thuộc.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vào những đêm, trăng rằm lũ trẻ trong xóm rủ nhau rước đèn quanh sân đình.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vào những đêm trăng rằm lũ trẻ, trong xóm rủ nhau rước đèn quanh sân đình.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vào những đêm trăng rằm, lũ trẻ trong xóm rủ nhau rước đèn quanh sân đình.",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy tìm ranh giới nơi kết thúc phần chỉ thời gian và bắt đầu phần nêu người thực hiện hoạt động.",
        hint2_vi:
          "Chủ ngữ của câu là “lũ trẻ trong xóm”, không được đặt dấu phẩy cắt đôi chủ ngữ hoặc cắt rời chủ ngữ với vị ngữ.",
        hint3_vi:
          "Trạng ngữ chỉ thời gian kéo dài hết cụm “Vào những đêm trăng rằm”, nên dấu phẩy phải đặt ngay sau từ “rằm”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Trạng ngữ chỉ thời gian của câu là “Vào những đêm trăng rằm”, chủ ngữ là “lũ trẻ trong xóm” và vị ngữ là “rủ nhau rước đèn quanh sân đình”. Đặt dấu phẩy ngay sau “trăng rằm” giúp tách rõ trạng ngữ với nòng cốt câu.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em muốn mở rộng câu “Đàn chim én chao liệng rộn ràng.” bằng cách thêm cả trạng ngữ chỉ thời gian và trạng ngữ chỉ nơi chốn. Câu nào đạt yêu cầu và đặt dấu câu chuẩn xác nhất?",
        question_en:
          "Which sentence accurately adds both an adverbial of time and an adverbial of place with proper punctuation?",
        choices: [
          {
            id: "a",
            label_vi: "Trên bầu trời cao rộng, đàn chim én cánh đen nhánh đang chao liệng thật nhịp nhàng.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vì tiết trời ấm áp, từng đàn chim én nhỏ cứ thế chao liệng rộn ràng không biết mỏi.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Mỗi độ xuân về đàn chim én nhỏ, chao liệng rộn ràng khắp cả bầu trời cao rộng.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Mỗi độ xuân về, trên bầu trời cao rộng, đàn chim én chao liệng rộn ràng.",
            correct: true,
          },
        ],
        hint1_vi:
          "Câu viết mới cần có một cụm trả lời Khi nào? và một cụm trả lời Ở đâu?, đồng thời không đặt dấu phẩy xen giữa chủ ngữ và vị ngữ.",
        hint2_vi:
          "Câu có “Vì tiết trời ấm áp” mới thêm trạng ngữ nguyên nhân; câu chỉ có “Trên bầu trời cao rộng” mới thêm trạng ngữ nơi chốn.",
        hint3_vi:
          "Hai trạng ngữ “Mỗi độ xuân về” (thời gian) và “trên bầu trời cao rộng” (nơi chốn) đứng đầu câu được tách nhau và tách khỏi chủ ngữ “đàn chim én” bằng dấu phẩy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “Mỗi độ xuân về, trên bầu trời cao rộng, đàn chim én chao liệng rộn ràng.” vừa có trạng ngữ thời gian (“Mỗi độ xuân về”), vừa có trạng ngữ nơi chốn (“trên bầu trời cao rộng”), lại dùng dấu phẩy tách mạch lạc từng thành phần với nòng cốt câu.",
    },
  ],
};
