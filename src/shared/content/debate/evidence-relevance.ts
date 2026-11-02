/**
 * Tư duy phản biện · Chọn bằng chứng đúng trọng tâm (skill: deb-evidence-relevance, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const evidenceRelevance: LessonDefinition = {
  id: "deb-evidence-relevance",
  subjectId: "debate",
  skillId: "deb-evidence-relevance",
  titleVi: "Chọn bằng chứng đúng trọng tâm và đáng tin cậy",
  titleEn: "Choosing Relevant and Reliable Evidence",
  objectiveVi: "Em biết phân biệt bằng chứng thực tế, đúng trọng tâm với những thông tin lạc đề hoặc lời đồn chưa kiểm chứng.",
  objectiveEn: "Distinguish relevant, factual evidence from off-topic details or unverified rumors.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-deb-evidence-relevance",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách tìm 1 dẫn chứng cụ thể cho một đề xuất sinh hoạt trong gia đình.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi em nêu ý kiến: “Lớp mình cần thêm một kệ để ô dù ở gần cửa ra vào vào mùa mưa”, điều gì sẽ giúp ý kiến này trở nên thuyết phục hơn?",
        question_en: "When proposing 'Our classroom needs an umbrella rack near the door for the rainy season,' what makes the claim more convincing?",
        choices: [
          { id: "a", label_vi: "Đưa ra bằng chứng thực tế quan sát được (ví dụ: tuần trước có 3 ngày mưa, hơn 15 chiếc áo mưa và ô ướt treo ở ghế làm ướt sàn lớp).", correct: true },
          { id: "b", label_vi: "Nói thật to nhiều lần rằng ai không đồng ý là sai.", correct: false },
          { id: "c", label_vi: "Kể rằng em thích ô màu vàng hơn ô màu xanh.", correct: false },
          { id: "d", label_vi: "Đoán mò rằng năm sau trời sẽ không bao giờ mưa nữa.", correct: false },
        ],
        hint1_vi: "Lý lẽ đã giải thích nguyên nhân, nhưng bằng chứng cụ thể sẽ cho mọi người thấy sự việc thực sự diễn ra như thế nào.",
        hint2_vi: "Sở thích về màu sắc chiếc ô hay việc nói to có chứng minh được sàn lớp bị ướt không?",
        hint3_vi: "Số liệu và quan sát thực tế về những ngày mưa làm ướt sàn lớp chính là bằng chứng cụ thể và đúng trọng tâm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bằng chứng thực tế (sự việc đã quan sát được, con số cụ thể gắn trực tiếp với vấn đề) giúp người nghe thấy rõ nhu cầu thực sự thay vì chỉ nghe phỏng đoán cảm tính.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thế nào là một bằng chứng “đúng trọng tâm” cho luận điểm đang bàn?",
        question_en: "What makes a piece of evidence 'relevant' to the claim being discussed?",
        choices: [
          { id: "a", label_vi: "Là thông tin dù hoàn toàn có thật nhưng nói về một chủ đề khác không ăn nhập.", correct: false },
          { id: "b", label_vi: "Là thông tin có thật và chứng minh trực tiếp cho đúng ý kiến cùng lý lẽ đang nêu.", correct: true },
          { id: "c", label_vi: "Là câu chuyện truyền miệng chưa ai kiểm tra xem có đúng hay không.", correct: false },
          { id: "d", label_vi: "Là bất kỳ câu nào dài và có nhiều chữ số bất kỳ.", correct: false },
        ],
        hint1_vi: "Một thông tin có thể đúng sự thật (như “Một tuần có 7 ngày”) nhưng chưa chắc đã giúp chứng minh cho mọi ý kiến.",
        hint2_vi: "Bằng chứng tốt cần thỏa mãn cả hai điều: (1) đúng sự thật và (2) gắn chặt với điều đang cần chứng minh.",
        hint3_vi: "Bằng chứng đúng trọng tâm phải là thông tin xác thực và hỗ trợ trực tiếp cho luận điểm đang bàn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Một thông tin dù đúng sự thật nhưng nếu không liên quan đến luận điểm thì vẫn là bằng chứng lạc đề. Bằng chứng đúng trọng tâm vừa phải xác thực vừa phải chứng minh trực tiếp cho ý kiến đang bàn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để bảo vệ ý kiến: “Đọc sách 20 phút mỗi tối giúp học sinh mở rộng vốn từ tiếng Việt”, bằng chứng nào dưới đây đúng trọng tâm nhất?",
        question_en: "To support the claim 'Reading 20 minutes every evening expands students' Vietnamese vocabulary,' which evidence is most relevant?",
        choices: [
          { id: "a", label_vi: "Nhật ký đọc sách của tổ 1 cho thấy sau 4 tuần đọc truyện mỗi tối, các bạn đều ghi thêm được 15–20 từ ngữ miêu tả mới để dùng khi viết văn.", correct: true },
          { id: "b", label_vi: "Bìa các quyển sách ở hiệu sách năm nay được in nhiều màu rất đẹp.", correct: false },
          { id: "c", label_vi: "Giờ ra chơi các bạn nam trong lớp rất thích chơi đá cầu.", correct: false },
          { id: "d", label_vi: "Thư viện trường mở cửa từ 7 giờ sáng thứ Hai.", correct: false },
        ],
        hint1_vi: "Xác định trọng tâm của ý kiến: mối liên hệ giữa “đọc sách 20 phút mỗi tối” và “mở rộng vốn từ tiếng Việt”.",
        hint2_vi: "Màu bìa sách, trò đá cầu hay giờ mở cửa buổi sáng có cho thấy vốn từ của học sinh tăng lên không?",
        hint3_vi: "Kết quả ghi chép 15–20 từ mới sau 4 tuần đọc sách buổi tối chứng minh thẳng vào việc mở rộng vốn từ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Bằng chứng từ nhật ký đọc sách của tổ 1 cho thấy kết quả trực tiếp của thói quen đọc sách buổi tối đối với số lượng từ ngữ mới học sinh tích lũy được.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Nam nói: “Sân bóng sau trường rất trơn trượt sau cơn mưa, vì hôm qua tớ mới mua một đôi giày thể thao cỡ 35.” Vì sao câu của Nam chưa có bằng chứng đúng trọng tâm?",
        question_en: "Nam says: 'The field behind school is slippery after rain because yesterday I bought size 35 sneakers.' Why is Nam's evidence irrelevant?",
        choices: [
          { id: "a", label_vi: "Việc Nam mua giày cỡ 35 là chuyện cá nhân, không cho biết tình trạng mặt sân bóng sau cơn mưa có trơn hay đọng nước không.", correct: true },
          { id: "b", label_vi: "Vì cỡ giày 35 là một con số quá nhỏ.", correct: false },
          { id: "c", label_vi: "Vì sân bóng không bao giờ có cỏ.", correct: false },
          { id: "d", label_vi: "Vì Nam chưa nói màu sắc của đôi giày.", correct: false },
        ],
        hint1_vi: "Điều Nam đang muốn chứng minh là gì? Đó là “sân bóng rất trơn trượt sau cơn mưa”.",
        hint2_vi: "Chi tiết “hôm qua mua giày cỡ 35” dù có thật nhưng có mô tả mặt sân bóng lúc trời mưa không?",
        hint3_vi: "Muốn chứng minh sân trơn, Nam cần nêu quan sát về vũng nước, bùn đất hoặc việc các bạn bị trượt chân trên sân chứ không phải cỡ giày mới mua.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Chi tiết mua giày cỡ 35 hoàn toàn không liên quan đến độ trơn của mặt sân bóng. Bằng chứng đúng trọng tâm phải là quan sát thực tế trên mặt sân (như mặt sân đọng bùn hoặc có bạn bị trượt ngã sau mưa).",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trước khi tin và chia sẻ lại một thông tin như “Ăn loại kẹo X giúp làm bài Toán nhanh gấp đôi mà không cần ôn tập”, em nên đặt câu hỏi kiểm chứng nào đầu tiên?",
        question_en: "Before believing and sharing a claim like 'Candy X doubles math speed without studying,' what verification question should you ask first?",
        choices: [
          { id: "a", label_vi: "Thông tin này lấy từ nguồn nào và có bằng chứng khoa học đáng tin cậy nào chứng minh không, hay chỉ là lời quảng cáo phóng đại?", correct: true },
          { id: "b", label_vi: "Vỏ kẹo được bọc bằng giấy màu gì?", correct: false },
          { id: "c", label_vi: "Ai là người nói câu đó to nhất trong giờ ra chơi?", correct: false },
          { id: "d", label_vi: "Không cần hỏi gì cả, cứ tin ngay vì nghe rất hấp dẫn.", correct: false },
        ],
        hint1_vi: "Những lời hứa hẹn nghe quá kỳ diệu (“không cần ôn tập vẫn giỏi gấp đôi”) thường thiếu bằng chứng thực tế.",
        hint2_vi: "Độ to của giọng nói hay màu vỏ kẹo có đảm bảo thông tin đó là thật không?",
        hint3_vi: "Người có tư duy phản biện luôn kiểm tra nguồn gốc thông tin và đòi hỏi bằng chứng thực tế đáng tin cậy trước khi tin theo.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi gặp một khẳng định lạ hoặc phóng đại, bước quan trọng nhất là kiểm tra nguồn gốc và xem có bằng chứng thực tế, khoa học nào chứng minh hay không, tránh tin ngay vào lời đồn hoặc quảng cáo quá mức.",
    },
  ],
};
