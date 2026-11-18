/**
 * Tư duy phản biện · Khảo sát năng lực đầu vào Tư duy phản biện Lớp 4 (skill: deb-claim-reason, lớp 4)
 *
 * Parent-supervised baseline diagnostic assessment. Short, low-pressure,
 * age-appropriate original tasks covering claims, supporting reasons, and fact vs. opinion.
 */
import type { LessonDefinition } from "../types";

export const baselineDebateGrade4: LessonDefinition = {
  id: "deb-baseline-grade4",
  subjectId: "debate",
  skillId: "deb-claim-reason",
  titleVi: "Khảo sát đầu vào Tư duy phản biện Lớp 4",
  titleEn: "Critical Thinking & Debate Grade 4 Baseline Diagnostic",
  objectiveVi: "Khảo sát nhẹ nhàng khả năng nhận diện ý kiến, chọn lý lẽ phù hợp và phân biệt sự thật với cảm nhận cá nhân.",
  objectiveEn: "Gentle baseline check of identifying claims, supporting reasons, and distinguishing fact from opinion.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-claim-reason",
  provenance: "original_supplemental",
  sourceRef: "Bài khảo sát đầu vào biên soạn độc lập cho TAI Learning OS — Môn Tư duy phản biện Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi: "Khảo sát đầu vào để phụ huynh nắm cách bé lập luận và giải thích lý do, không chấm điểm số.",
  isBaseline: true,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi em muốn đề xuất cả nhà cùng đi công viên vào sáng Chủ nhật, cách nói nào giúp bố mẹ dễ hiểu và dễ đồng tình nhất?",
        question_en: "When proposing a family trip to the park on Sunday morning, which statement helps your parents understand and agree most easily?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ nói ngắn gọn “Con muốn đi chơi!” rồi ngồi im lặng, để bố mẹ tự đoán xem con muốn đi đâu và vì sao.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Đề xuất đi công viên kèm lý do: sáng Chủ nhật trời mát và cả nhà cùng tập thể dục.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Kể lan man chuyện chiếc xe đạp của bạn hàng xóm mà không nhắc gì đến sáng Chủ nhật hay công viên.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Đòi cả nhà phải đi ngay mà nhất quyết không giải thích lý do gì.",
            correct: false,
          },
        ],
        hint1_vi: "Khi nghe một đề xuất, bố mẹ luôn muốn biết vì sao em lại chọn hoạt động đó.",
        hint2_vi: "Một lời thuyết phục tốt cần có cả điều em đề xuất (ý kiến) và lợi ích hợp lý (lý lẽ).",
        hint3_vi: "Giải thích thời tiết dễ chịu và dịp vận động chung cho gia đình chính là căn cứ thuyết phục.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi nêu rõ đề xuất (đi công viên) kèm lý lẽ hợp lý (trời mát, cả nhà cùng tập thể dục), người nghe hiểu ngay mục đích tốt đẹp và dễ dàng trao đổi cùng em.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu: “Chúng mình nên xếp sách gọn lên giá sau khi đọc xong, vì làm vậy giúp lần sau tìm sách nhanh hơn và sách không bị quăn góc”, đâu là ý kiến đề xuất chính?",
        question_en: "In the sentence above, which part is the main proposed claim?",
        choices: [
          {
            id: "a",
            label_vi: "Những quyển sách mới mua đều có giấy màu trắng.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chiếc giá đựng sách ở góc lớp đóng bằng gỗ.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chiều hôm qua ngoài sân có cơn mưa to.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chúng mình nên xếp sách gọn lên giá sau khi đọc xong.",
            correct: true,
          },
        ],
        hint1_vi: "Ý kiến đề xuất chính thường đứng trước chữ “vì” và nêu hành động khuyên mọi người cùng thực hiện.",
        hint2_vi: "Phần sau chữ “vì” là lý do giải thích lợi ích (tìm nhanh hơn, không quăn góc).",
        hint3_vi: "Hãy tìm vế câu nêu lời khuyên cất giữ sách ngay ngắn sau mỗi lần đọc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu đề xuất hành động “Chúng mình nên xếp sách gọn lên giá sau khi đọc xong” là ý kiến chính (luận điểm), còn vế sau chữ “vì” là lý lẽ giải thích.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ý kiến: “Học sinh nên kiểm tra lại bài trước khi nộp.” Lý lẽ nào dưới đây hỗ trợ đúng trọng tâm nhất cho ý kiến này?",
        question_en: "Claim: 'Students should check their work before submitting.' Which reason best supports this claim?",
        choices: [
          {
            id: "a",
            label_vi: "Vì trên đầu mỗi cây bút chì gỗ của học sinh thường có gắn sẵn một cục tẩy nhỏ màu hồng.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vì ngay sau khi tiếng trống báo hết tiết vang lên, ngoài sân có rất nhiều trò vui.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì soát lại bài giúp phát hiện và sửa kịp lỗi tính nhầm hoặc bỏ sót.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Vì tấm bảng từ phía trên bục giảng luôn được tổ trực nhật lau sạch mỗi sáng.",
            correct: false,
          },
        ],
        hint1_vi: "Lý lẽ phải trả lời trực tiếp cho câu hỏi: “Tại sao việc kiểm tra lại bài trước khi nộp lại có ích?”.",
        hint2_vi: "Màu cục tẩy, sân chơi hay việc lau bảng có liên quan đến độ chính xác của bài làm không?",
        hint3_vi: "Nhận ra và chỉnh sửa kịp những chỗ nhầm lẫn trước khi nộp bài là lợi ích sát chủ đề nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Việc soát lại bài giúp học sinh tự phát hiện lỗi tính toán hoặc bỏ sót câu hỏi để sửa kịp thời. Đây là lý lẽ gắn kết trực tiếp với ý kiến.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong hai câu sau: (1) “Một tuần lễ có 7 ngày.” và (2) “Chủ nhật là ngày tuyệt vời nhất trong tuần.” — câu nào nêu một sự thật có thể kiểm chứng?",
        question_en: "Between (1) 'A week has 7 days' and (2) 'Sunday is the best day of the week', which states a verifiable fact?",
        choices: [
          {
            id: "a",
            label_vi: "Câu (1), vì bất kỳ tờ lịch nào cũng xác nhận một tuần có đúng 7 ngày.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Câu (2), vì mọi người trên khắp thế giới đều chỉ thích duy nhất ngày Chủ nhật mà thôi.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cả hai câu trên đều chỉ thể hiện sở thích riêng của người nói.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Không có câu nào đối chiếu hay kiểm tra được trên tờ lịch.",
            correct: false,
          },
        ],
        hint1_vi: "Sự thật là điều có thể tra cứu, đếm hoặc kiểm chứng giống nhau với tất cả mọi người.",
        hint2_vi: "Từ “tuyệt vời nhất” thể hiện cảm nhận cá nhân (có bạn thích Thứ Bảy hơn, có bạn thích Thứ Sáu hơn).",
        hint3_vi: "Số lượng ngày trong một tuần là quy ước thời gian cố định mà ai tra cứu cũng thấy giống nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Một tuần lễ có 7 ngày” là sự thật khách quan có thể kiểm chứng trên lịch. Còn “ngày tuyệt vời nhất” là ý kiến/cảm nhận riêng của từng người.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm của An đang chọn chủ đề làm báo tường. Bạn Minh nói: “Chọn chủ đề Biển đảo đi, vì tớ vừa mua hộp bút màu mới!”. Để giúp lời đề xuất của Minh thuyết phục hơn, An nên góp ý điều gì?",
        question_en: "Minh says: 'Let's pick the Sea & Islands theme because I just bought a new box of crayons!' How should An help Minh make the proposal more convincing?",
        choices: [
          {
            id: "a",
            label_vi: "Khuyên Minh từ nay đừng bao giờ phát biểu đề xuất ý tưởng mới trong bất kỳ buổi họp nhóm nào của lớp.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Rủ cả nhóm gác việc làm báo tường lại để chuyển sang bàn về các món ăn trưa yêu thích ở trường.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đề nghị bỏ qua mọi lý do giải thích và chỉ ghi tên các thành viên lên tờ giấy báo tường.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Gợi ý Minh nêu lý do gắn với Biển đảo, như có nhiều câu chuyện và hình ảnh đẹp.",
            correct: true,
          },
        ],
        hint1_vi: "Hộp bút màu mới có thể dùng để vẽ bất kỳ chủ đề nào, chứ không riêng gì chủ đề Biển đảo.",
        hint2_vi: "Muốn thuyết phục cả nhóm chọn chủ đề Biển đảo, lý lẽ cần cho thấy nét hấp dẫn của chính chủ đề đó.",
        hint3_vi: "Bổ sung căn cứ về nguồn tư liệu phong phú và ý nghĩa của biển đảo quê hương sẽ giúp đề xuất chặt chẽ hơn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Hộp bút màu mới dùng cho chủ đề nào cũng được nên chưa phải là lý lẽ riêng cho chủ đề Biển đảo. Khi thay bằng lý do chủ đề Biển đảo có nhiều câu chuyện và hình ảnh ý nghĩa để cả nhóm cùng sáng tạo, đề xuất của Minh sẽ hợp lý và thuyết phục hơn nhiều.",
    },
  ],
};
