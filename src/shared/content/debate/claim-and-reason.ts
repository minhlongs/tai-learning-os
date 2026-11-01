/**
 * Tư duy phản biện · Ý kiến và lý lẽ hỗ trợ (skill: deb-claim-reason, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const claimAndReason: LessonDefinition = {
  id: "deb-claim-reason",
  subjectId: "debate",
  skillId: "deb-claim-reason",
  titleVi: "Nêu ý kiến và đưa ra lý lẽ hỗ trợ",
  titleEn: "Stating a Claim with Supporting Reasons",
  objectiveVi: "Em nhận biết được đâu là ý kiến chính (luận điểm) và biết chọn lý lẽ phù hợp để bảo vệ ý kiến đó.",
  objectiveEn: "Identify a main claim and choose relevant supporting reasons to justify it.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-deb-claim-reason",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách tập nói một ý kiến kèm từ 'vì' trong bữa cơm gia đình.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi thảo luận cùng bạn bè, nếu em chỉ nói “Tớ không thích ý tưởng đó!” mà không giải thích gì thêm, điều gì sẽ xảy ra?",
        question_en: "In a discussion, if you only say 'I don't like that idea!' without explaining why, what happens?",
        choices: [
          { id: "a", label_vi: "Mọi người hiểu ngay lý do và đồng ý với em ngay lập tức.", correct: false },
          { id: "b", label_vi: "Người nghe chưa hiểu vì sao em nghĩ vậy nên khó thuyết phục hoặc cùng tìm cách cải thiện.", correct: true },
          { id: "c", label_vi: "Ý kiến tự động trở thành sự thật hiển nhiên.", correct: false },
          { id: "d", label_vi: "Cuộc thảo luận không cần ai nói thêm nữa.", correct: false },
        ],
        hint1_vi: "Hãy đặt mình vào vị trí người nghe khi chỉ nhận được một câu khen hoặc chê trống không.",
        hint2_vi: "Người nghe có biết điều gì khiến em băn khoăn hay lo lắng không?",
        hint3_vi: "Muốn người khác hiểu và suy nghĩ cùng mình, ý kiến cần đi kèm lý do giải thích rõ ràng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Một ý kiến đứng một mình chỉ cho biết em đồng ý hay không, nhưng chưa cho người nghe biết nguyên nhân. Khi thêm lý lẽ giải thích (“vì…”), người nghe mới hiểu góc nhìn của em để cùng trao đổi.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu: “Lớp mình nên trồng thêm cây nhỏ ở bệ cửa sổ (1), vì cây xanh giúp góc lớp mát mắt và học sinh có thêm dịp tập chăm sóc cây mỗi ngày (2)”, phần nào là lý lẽ hỗ trợ?",
        question_en: "In the sentence above, which part is the supporting reason?",
        choices: [
          { id: "a", label_vi: "Phần (1): đề xuất lớp mình nên trồng thêm cây nhỏ.", correct: false },
          { id: "b", label_vi: "Phần (2): giải thích lợi ích của việc trồng cây ở bệ cửa sổ.", correct: true },
          { id: "c", label_vi: "Không có phần nào là lý lẽ cả.", correct: false },
          { id: "d", label_vi: "Cả câu chỉ là một câu hỏi.", correct: false },
        ],
        hint1_vi: "Ý kiến chính trả lời câu hỏi “Chúng ta nên làm gì?”, còn lý lẽ trả lời câu hỏi “Vì sao nên làm điều đó?”.",
        hint2_vi: "Hãy chú ý phần bắt đầu sau chữ “vì”.",
        hint3_vi: "Phần (1) là ý kiến đề xuất, còn phần (2) nêu lợi ích để giải thích vì sao nên trồng cây.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Phần (1) nêu đề xuất (ý kiến chính), còn phần (2) đứng sau từ “vì” giải thích cụ thể hai lợi ích của việc trồng cây, nên phần (2) chính là lý lẽ hỗ trợ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Lan nêu ý kiến: “Học sinh lớp 4 nên đi ngủ trước 9 giờ rưỡi tối.” Lý lẽ nào dưới đây hỗ trợ trực tiếp và thuyết phục nhất cho ý kiến của Lan?",
        question_en: "Lan claims: '4th graders should go to bed before 9:30 PM.' Which reason best supports her claim?",
        choices: [
          { id: "a", label_vi: "Vì ngủ đủ giấc giúp cơ thể khỏe mạnh và sáng hôm sau học tập tỉnh táo, tập trung hơn.", correct: true },
          { id: "b", label_vi: "Vì buổi tối bầu trời có nhiều ngôi sao.", correct: false },
          { id: "c", label_vi: "Vì chiếc đồng hồ treo tường hình tròn.", correct: false },
          { id: "d", label_vi: "Vì môn Toán có nhiều bài tập về phân số.", correct: false },
        ],
        hint1_vi: "Lý lẽ tốt phải liên quan trực tiếp đến việc đi ngủ đúng giờ của học sinh.",
        hint2_vi: "Hãy tự hỏi: Việc ngủ trước 9 giờ rưỡi tối mang lại lợi ích gì cho sức khỏe và buổi học sáng hôm sau?",
        hint3_vi: "Các câu về ngôi sao, đồng hồ hay phân số không giải thích tại sao cần ngủ sớm; chỉ có lợi ích về sức khỏe và sự tỉnh táo mới liên quan trực tiếp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Lý lẽ hỗ trợ cần gắn chặt với ý kiến đang bàn. Giải thích tác dụng của giấc ngủ đối với sức khỏe và sự tập trung vào sáng hôm sau trả lời thẳng vào câu hỏi “Vì sao nên ngủ trước 9 giờ rưỡi tối?”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Hùng nói: “Chúng mình nên mang bình nước cá nhân đi học vì chiếc cặp sách của tớ màu xanh dương.” Điểm chưa hợp lý trong câu nói của Hùng là gì?",
        question_en: "Hung says: 'We should bring personal water bottles to school because my backpack is blue.' What is the flaw in Hung's reasoning?",
        choices: [
          { id: "a", label_vi: "Lý lẽ (màu cặp sách) không liên quan gì đến ý kiến (mang bình nước cá nhân).", correct: true },
          { id: "b", label_vi: "Hùng chưa nêu được ý kiến nào cả.", correct: false },
          { id: "c", label_vi: "Câu nói không có từ “vì”.", correct: false },
          { id: "d", label_vi: "Mang bình nước cá nhân là việc không ai làm được.", correct: false },
        ],
        hint1_vi: "Có phải cứ có chữ “vì” ở giữa câu thì phần phía sau đều là lý lẽ đúng đắn không?",
        hint2_vi: "Màu sắc của chiếc cặp sách có giúp giải thích lợi ích của việc mang bình nước cá nhân không?",
        hint3_vi: "Một lý lẽ chỉ có giá trị khi nó thực sự giải thích hoặc chứng minh cho ý kiến đứng trước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Dù câu nói có từ “vì”, nhưng màu sắc chiếc cặp sách không hề giải thích tại sao nên mang bình nước cá nhân (như giữ vệ sinh, chủ động uống đủ nước, giảm rác nhựa). Lý lẽ phải có mối liên hệ hợp lý với ý kiến.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thư viện trường muốn chọn một quy định mới cho giờ đọc sách. Cách đề xuất nào dưới đây vừa có ý kiến rõ ràng vừa có lý lẽ thuyết phục nhất?",
        question_en: "The school library wants a new rule for reading time. Which proposal has both a clear claim and the most convincing supporting reason?",
        choices: [
          { id: "a", label_vi: "Trong thư viện mọi người cần nói chuyện thật khẽ, vì không gian yên tĩnh giúp tất cả các bạn đọc và hiểu nội dung sách tốt hơn.", correct: true },
          { id: "b", label_vi: "Trong thư viện cần nói khẽ, vì ai cũng phải làm theo mà không cần hỏi lý do.", correct: false },
          { id: "c", label_vi: "Thư viện có rất nhiều kệ gỗ và bàn ghế xếp thành hàng.", correct: false },
          { id: "d", label_vi: "Em rất thích đọc truyện tranh vào ngày chủ nhật.", correct: false },
        ],
        hint1_vi: "Tìm câu có đủ hai phần: (1) quy định đề xuất cho thư viện và (2) lý do mang lại lợi ích chung cho người đọc.",
        hint2_vi: "Loại bỏ những câu chỉ mô tả đồ vật hoặc ép buộc “không cần hỏi lý do”.",
        hint3_vi: "Giải thích rằng sự yên tĩnh giúp mọi người tập trung đọc hiểu sách chính là lý lẽ hợp lý và tôn trọng người nghe.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Đề xuất “mọi người cần nói chuyện thật khẽ” là ý kiến rõ ràng, đi kèm lý lẽ “vì không gian yên tĩnh giúp các bạn đọc và hiểu sách tốt hơn” giải thích thuyết phục lợi ích chung cho cả tập thể.",
    },
  ],
};
