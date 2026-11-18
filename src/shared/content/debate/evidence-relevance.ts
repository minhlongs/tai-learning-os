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
          {
            id: "a",
            label_vi: "Nhắc đi nhắc lại thật to trước lớp rằng bất kỳ bạn nào chưa đồng ý với đề xuất này đều đang nghĩ sai.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Kể chi tiết rằng em thích những chiếc ô gấp màu vàng tươi hơn là những chiếc áo mưa màu xanh.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đoán trước mà không cần xem dự báo thời tiết rằng sang năm trời sẽ nắng ráo quanh năm.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Nêu quan sát: tuần qua có 3 ngày mưa, hơn 15 chiếc ô ướt làm trơn sàn lớp.",
            correct: true,
          },
        ],
        hint1_vi: "Lý lẽ đã giải thích nguyên nhân, nhưng bằng chứng cụ thể sẽ cho mọi người thấy sự việc thực sự diễn ra như thế nào.",
        hint2_vi: "Sở thích về màu sắc chiếc ô hay việc nói to có chứng minh được sàn lớp bị ướt không?",
        hint3_vi: "Số liệu ghi nhận thực tế về những buổi mưa làm ướt sàn phòng học chính là dẫn chứng sát chủ đề nhất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
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
          {
            id: "a",
            label_vi: "Là thông tin tuy hoàn toàn có thật trong sách báo nhưng lại bàn sang một chủ đề khác không ăn nhập.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Là thông tin có thật và chứng minh trực tiếp cho đúng ý kiến cùng lý lẽ đang nêu.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Là câu chuyện truyền miệng hấp dẫn dù chưa ai kiểm tra xem có đúng không.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Là bất kỳ câu nói nào viết thật dài và ghép thêm nhiều con số lạ.",
            correct: false,
          },
        ],
        hint1_vi: "Một thông tin có thể đúng sự thật (như “Một tuần có 7 ngày”) nhưng chưa chắc đã giúp chứng minh cho mọi ý kiến.",
        hint2_vi: "Bằng chứng tốt cần thỏa mãn cả hai điều: (1) đúng sự thật và (2) gắn chặt với điều đang cần chứng minh.",
        hint3_vi: "Dẫn chứng phù hợp vừa phải xác thực vừa phải hỗ trợ thẳng vào kết luận mà người nói đang bảo vệ.",
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
          {
            id: "a",
            label_vi: "Bìa các quyển truyện thiếu nhi ở hiệu sách năm nay đều được in nhiều gam màu tươi sáng và bắt mắt.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Vào giờ ra chơi buổi sáng, đa số các bạn học sinh trong lớp đều hào hứng rủ nhau đá cầu ở sân.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nhật ký đọc sách tổ 1 ghi nhận sau 4 tuần đọc tối, mỗi bạn tích lũy thêm 15–20 từ mới.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Thư viện của nhà trường luôn mở cửa đón học sinh từ 7 giờ sáng thứ Hai.",
            correct: false,
          },
        ],
        hint1_vi: "Xác định trọng tâm của ý kiến: mối liên hệ giữa “đọc sách 20 phút mỗi tối” và “mở rộng vốn từ tiếng Việt”.",
        hint2_vi: "Màu bìa sách, trò đá cầu hay giờ mở cửa buổi sáng có cho thấy vốn từ của học sinh tăng lên không?",
        hint3_vi: "Số lượng từ ngữ miêu tả được ghi thêm trong sổ theo dõi sau một tháng đọc sách buổi tối chứng minh trực tiếp cho luận điểm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
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
          {
            id: "a",
            label_vi: "Việc Nam mua giày cỡ 35 không cho biết mặt sân bóng sau cơn mưa có đọng nước hay trơn không.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Vì cỡ giày 35 vẫn là con số nhỏ hơn cỡ giày của các anh chị học lớp 5 trong đội bóng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì Nam mới chỉ nêu cỡ giày thể thao mà quên chưa tả rõ màu sắc của dây giày.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vì mặt sân bóng phía sau trường vốn được lát cỏ nhân tạo quanh năm.",
            correct: false,
          },
        ],
        hint1_vi: "Điều Nam đang muốn chứng minh là gì? Đó là “sân bóng rất trơn trượt sau cơn mưa”.",
        hint2_vi: "Chi tiết “hôm qua mua giày cỡ 35” dù có thật nhưng có mô tả mặt sân bóng lúc trời mưa không?",
        hint3_vi: "Muốn chứng minh sân trơn, Nam cần nêu quan sát về vũng nước hoặc bùn đất trên sân chứ không phải chuyện mua giày riêng.",
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
          {
            id: "a",
            label_vi: "Vỏ bọc bên ngoài của viên kẹo được trang trí bằng giấy bóng màu gì và bán ở cửa hàng nào?",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Thông tin này từ nguồn nào và có bằng chứng khoa học tin cậy chứng minh hay không?",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Trong giờ ra chơi sáng nay, bạn nào trong nhóm đã kể lại chuyện về viên kẹo với giọng to nhất?",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Có nên chia sẻ ngay lập tức cho thật nhiều bạn biết vì nghe rất hấp dẫn?",
            correct: false,
          },
        ],
        hint1_vi: "Những lời hứa hẹn nghe quá kỳ diệu (“không cần ôn tập vẫn giỏi gấp đôi”) thường thiếu bằng chứng thực tế.",
        hint2_vi: "Độ to của giọng nói hay màu vỏ kẹo có đảm bảo thông tin đó là thật không?",
        hint3_vi: "Người có tư duy phản biện luôn hỏi rõ xuất xứ bản tin và tìm nghiên cứu thực tế kiểm chứng trước khi tin theo.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Khi gặp một khẳng định lạ hoặc phóng đại, bước quan trọng nhất là kiểm tra nguồn gốc và xem có bằng chứng thực tế, khoa học nào chứng minh hay không, tránh tin ngay vào lời đồn hoặc quảng cáo quá mức.",
    },
  ],
};
