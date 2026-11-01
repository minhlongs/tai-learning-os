/**
 * Tư duy phản biện · Phân biệt sự thật và ý kiến (skill: deb-fact-opinion, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const factVsOpinion: LessonDefinition = {
  id: "deb-fact-opinion",
  subjectId: "debate",
  skillId: "deb-fact-opinion",
  titleVi: "Phân biệt sự thật kiểm chứng được và ý kiến cá nhân",
  titleEn: "Distinguishing Verifiable Facts from Personal Opinions",
  objectiveVi: "Em phân biệt được câu nêu sự thật có thể kiểm tra bằng quan sát, đo đạc với câu nêu cảm nhận, sở thích cá nhân.",
  objectiveEn: "Distinguish statements of verifiable fact from personal feelings, preferences, or opinions.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-deb-fact-opinion",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách phân biệt thông tin đo đếm được và lời khen chê khi đọc sách báo.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điểm khác nhau quan trọng nhất giữa một “sự thật” (fact) và một “ý kiến cá nhân” (opinion) là gì?",
        question_en: "What is the key difference between a verifiable fact and a personal opinion?",
        choices: [
          { id: "a", label_vi: "Sự thật có thể kiểm tra đúng hay sai bằng quan sát, đo đạc hoặc bằng chứng; còn ý kiến thể hiện cảm nhận, sở thích riêng của mỗi người.", correct: true },
          { id: "b", label_vi: "Câu nào dài hơn thì luôn luôn là sự thật.", correct: false },
          { id: "c", label_vi: "Câu nào do người lớn nói thì đều là ý kiến cá nhân.", correct: false },
          { id: "d", label_vi: "Sự thật và ý kiến cá nhân hoàn toàn giống hệt nhau.", correct: false },
        ],
        hint1_vi: "Hãy nghĩ về hai câu: “Một tuần có 7 ngày” và “Ngày thứ Bảy là ngày vui nhất”.",
        hint2_vi: "Câu nào ai tra lịch cũng ra cùng một kết quả, còn câu nào mỗi bạn có thể cảm thấy khác nhau?",
        hint3_vi: "Điều kiểm chứng được bằng bằng chứng thực tế là sự thật; điều phụ thuộc vào sở thích hay đánh giá riêng là ý kiến cá nhân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Sự thật là thông tin khách quan có thể kiểm chứng bằng đo đạc, đếm hoặc tra cứu bằng chứng (ví dụ: 1 tuần có 7 ngày). Ý kiến cá nhân là nhận xét, cảm nhận hoặc sở thích riêng nên mỗi người có thể nghĩ khác nhau.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây là một câu nêu SỰ THẬT có thể kiểm chứng?",
        question_en: "Which statement below is a verifiable FACT?",
        choices: [
          { id: "a", label_vi: "Môn Toán là môn học thú vị nhất trên thế giới.", correct: false },
          { id: "b", label_vi: "Một giờ đồng hồ gồm có 60 phút.", correct: true },
          { id: "c", label_vi: "Màu xanh lá cây đẹp hơn màu vàng.", correct: false },
          { id: "d", label_vi: "Mùa mưa lúc nào cũng buồn tẻ.", correct: false },
        ],
        hint1_vi: "Hãy tìm câu mà chúng ta có thể dùng đồng hồ hoặc tài liệu khoa học để kiểm tra chính xác.",
        hint2_vi: "Những từ như “thú vị nhất”, “đẹp hơn”, “buồn tẻ” thể hiện cảm nhận riêng của từng người.",
        hint3_vi: "Số phút trong một giờ là quy ước đo thời gian cố định mà ai kiểm tra cũng thấy đúng bằng 60 phút.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Một giờ đồng hồ gồm có 60 phút” là sự thật có thể kiểm chứng trên mọi chiếc đồng hồ. Ba câu còn lại chứa các từ đánh giá cảm tính (“thú vị nhất”, “đẹp hơn”, “buồn tẻ”) nên là ý kiến cá nhân.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây là Ý KIẾN CÁ NHÂN chứ không phải sự thật hiển nhiên?",
        question_en: "Which statement below is a PERSONAL OPINION rather than a verifiable fact?",
        choices: [
          { id: "a", label_vi: "Hà Nội là thủ đô của nước Việt Nam.", correct: false },
          { id: "b", label_vi: "Hình vuông có bốn cạnh bằng nhau.", correct: false },
          { id: "c", label_vi: "Truyện cổ tích luôn hấp dẫn hơn truyện khoa học.", correct: true },
          { id: "d", label_vi: "Nước tinh khiết sôi ở 100 độ C trong điều kiện bình thường.", correct: false },
        ],
        hint1_vi: "Hãy tự hỏi: Có bạn nhỏ nào lại thích truyện khoa học hơn truyện cổ tích không?",
        hint2_vi: "Nếu một điều tùy thuộc vào sở thích của từng bạn đọc thì đó là sự thật hay ý kiến?",
        hint3_vi: "Ba câu về thủ đô Hà Nội, hình vuông và nhiệt độ sôi của nước đều kiểm chứng được trong sách giáo khoa; riêng việc thấy truyện nào hấp dẫn hơn là sở thích cá nhân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Mỗi người đọc có sở thích khác nhau: có bạn thích truyện cổ tích, có bạn lại mê truyện khoa học. Vì vậy “Truyện cổ tích luôn hấp dẫn hơn truyện khoa học” là ý kiến cá nhân.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi giới thiệu về cuốn sách mới, bạn Mai nói hai câu: (1) “Cuốn sách này dày 120 trang.” và (2) “Đây là cuốn sách hay nhất mà mọi học sinh đều sẽ mê.” Nhận xét nào dưới đây đúng?",
        question_en: "Mai says: (1) 'This book has 120 pages.' and (2) 'This is the best book that every student will love.' Which analysis is correct?",
        choices: [
          { id: "a", label_vi: "Câu (1) là sự thật kiểm đếm được; câu (2) là ý kiến đánh giá riêng của Mai.", correct: true },
          { id: "b", label_vi: "Cả hai câu đều là sự thật đã được chứng minh.", correct: false },
          { id: "c", label_vi: "Câu (1) là ý kiến cá nhân; câu (2) là sự thật đo đạc được.", correct: false },
          { id: "d", label_vi: "Không thể kiểm tra được cuốn sách có bao nhiêu trang.", correct: false },
        ],
        hint1_vi: "Hãy xét từng câu một: Em có thể mở trang cuối của cuốn sách để kiểm tra số 120 trang không?",
        hint2_vi: "Còn lời khen “hay nhất mà mọi học sinh đều sẽ mê” có chắc chắn đúng với tất cả mọi người không?",
        hint3_vi: "Số trang sách kiểm đếm được nên câu (1) là sự thật; lời khen “hay nhất” là cảm nhận riêng của Mai nên câu (2) là ý kiến.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Số trang sách (120 trang) bất kỳ ai mở sách ra cũng kiểm tra được nên câu (1) là sự thật. Còn việc cuốn sách có “hay nhất” hay không tùy thuộc cảm nhận mỗi người đọc nên câu (2) là ý kiến cá nhân.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để thuyết phục phụ huynh cho lớp tổ chức buổi đọc sách ngoài sân trường, cách trình bày nào dưới đây kết hợp tốt nhất giữa SỰ THẬT làm bằng chứng và Ý KIẾN đề xuất?",
        question_en: "To persuade parents to support an outdoor reading session, which statement best combines a verifiable FACT as evidence with a proposed OPINION?",
        choices: [
          { id: "a", label_vi: "Sân trường khu vực dưới hàng cây có ghế đá cho 35 học sinh và nhiệt độ buổi sáng khoảng 25 độ C (sự thật), nên đây là nơi rất thuận lợi để lớp mình tổ chức giờ đọc sách sáng thứ Sáu (ý kiến đề xuất).", correct: true },
          { id: "b", label_vi: "Sân trường là nơi tuyệt vời nhất vũ trụ nên ai không ra sân đọc sách đều sai.", correct: false },
          { id: "c", label_vi: "Sân trường có ghế đá cho 35 học sinh nhưng chúng mình không đề xuất làm gì cả.", correct: false },
          { id: "d", label_vi: "Em đoán ngày mai trời sẽ mát vì hôm qua em mơ thấy gió thổi.", correct: false },
        ],
        hint1_vi: "Một lập luận vững vàng cần nêu được thông tin thực tế kiểm tra được (số chỗ ngồi, thời tiết) để làm chỗ dựa cho đề xuất.",
        hint2_vi: "Hãy tìm câu vừa có số liệu thực tế về sân trường, vừa nêu đề xuất hợp lý cho giờ đọc sách.",
        hint3_vi: "Dùng sự thật kiểm chứng được (ghế đá cho 35 học sinh, nhiệt độ 25 độ C) làm bằng chứng giúp ý kiến đề xuất trở nên đáng tin cậy hơn rất nhiều.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Khi đưa ra một ý kiến đề xuất, việc dựa trên những sự thật có thể kiểm chứng (sức chứa 35 chỗ ngồi, nhiệt độ 25 độ C) giúp người nghe thấy rõ đề xuất có cơ sở thực tế chứ không chỉ là cảm hứng nhất thời.",
    },
  ],
};
