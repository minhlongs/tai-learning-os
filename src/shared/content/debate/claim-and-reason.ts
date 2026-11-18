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
          {
            id: "a",
            label_vi: "Mọi người sẽ hiểu ngay điều em đang lo lắng và đồng tình đổi sang phương án khác ngay lập tức.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Người nghe chưa rõ lý do em băn khoăn nên rất khó trao đổi hay cùng sửa lại cho tốt.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Ý kiến của em tự động trở thành quy định chung mà cả nhóm phải làm theo.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cuộc thảo luận kết thúc êm đẹp vì không ai cần đặt thêm câu hỏi.",
            correct: false,
          },
        ],
        hint1_vi: "Hãy đặt mình vào vị trí người nghe khi chỉ nhận được một câu khen hoặc chê trống không.",
        hint2_vi: "Người nghe có biết điều gì khiến em chưa yên tâm với ý tưởng đó không?",
        hint3_vi: "Muốn bạn bè hiểu và suy nghĩ cùng mình, ý kiến luôn cần đi kèm lời giải thích nguyên nhân rõ ràng.",
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
          {
            id: "a",
            label_vi: "Phần (1), vì đứng ở đầu câu nên chắc chắn là lý do quan trọng nhất để thuyết phục cả lớp.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Không có phần nào là lý lẽ cả, vì cả câu trên chỉ đang kể lại một câu chuyện cũ.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cả câu chỉ nêu sở thích riêng về cây cảnh chứ chưa đưa ra đề xuất chung.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Phần (2): giải thích lợi ích cụ thể của việc trồng cây ở lớp.",
            correct: true,
          },
        ],
        hint1_vi: "Ý kiến chính trả lời câu hỏi “Chúng ta nên làm gì?”, còn lý lẽ trả lời câu hỏi “Vì sao nên làm điều đó?”.",
        hint2_vi: "Hãy chú ý mệnh đề bắt đầu ngay sau từ nối chỉ nguyên nhân.",
        hint3_vi: "Vế đầu nêu đề xuất hành động, còn vế đứng sau từ “vì” chỉ ra hai tác dụng thiết thực cho lớp học.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
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
          {
            id: "a",
            label_vi: "Vì ngủ đủ giấc giúp cơ thể khỏe mạnh và sáng hôm sau học tập tỉnh táo, tập trung hơn.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Vì chiếc đồng hồ báo thức đặt trên bàn học của Lan có vỏ nhựa màu xanh da trời.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Vì nhiều bạn nhỏ trong xóm cũng thích xem phim hoạt hình vào cuối tuần.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Vì buổi tối trời quang đãng thường nhìn thấy rất nhiều ngôi sao.",
            correct: false,
          },
        ],
        hint1_vi: "Lý lẽ tốt phải liên quan trực tiếp đến việc đi ngủ đúng giờ của học sinh.",
        hint2_vi: "Hãy tự hỏi: Việc ngủ trước 9 giờ rưỡi tối mang lại lợi ích gì cho sức khỏe và buổi học sáng hôm sau?",
        hint3_vi: "Màu chiếc đồng hồ, phim hoạt hình cuối tuần hay bầu trời sao đều lạc đề; hãy tìm câu nêu tác dụng của giấc ngủ.",
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
          {
            id: "a",
            label_vi: "Hùng mới chỉ mô tả màu chiếc cặp sách chứ chưa nêu ra được bất kỳ đề xuất nào cho cả lớp.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Câu nói của Hùng thiếu từ nối nên người nghe không nhận ra đâu là phần giải thích.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Lý lẽ về màu cặp sách không liên quan đến việc mang bình nước cá nhân.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Mang bình nước cá nhân đi học là việc quá khó đối với học sinh.",
            correct: false,
          },
        ],
        hint1_vi: "Có phải cứ có chữ “vì” ở giữa câu thì phần phía sau đều là lý lẽ đúng đắn không?",
        hint2_vi: "Màu sắc của chiếc cặp sách có giúp giải thích lợi ích của việc mang bình nước riêng không?",
        hint3_vi: "Một lý lẽ chỉ có giá trị khi nó thực sự giải thích hoặc chứng minh cho đề xuất đứng trước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
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
          {
            id: "a",
            label_vi: "Trong thư viện ai cũng phải giữ trật tự theo quy định chung, không cần giải thích dài dòng cho ai hết.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Thư viện trường có nhiều dãy kệ gỗ cao và bàn ghế được xếp ngay ngắn thành hàng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Em thích ngồi đọc truyện tranh thiếu nhi cùng các bạn vào chiều thứ Bảy.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Mọi người cần nói khẽ trong thư viện, vì không gian yên tĩnh giúp ai cũng dễ tập trung đọc.",
            correct: true,
          },
        ],
        hint1_vi: "Tìm câu có đủ hai phần: (1) quy định đề xuất cho thư viện và (2) lý do mang lại lợi ích chung cho người đọc.",
        hint2_vi: "Loại bỏ những câu chỉ mô tả đồ đạc, kể sở thích riêng hoặc áp đặt mà không nêu nguyên nhân.",
        hint3_vi: "Nêu quy định đi kèm lợi ích giúp bạn đọc hiểu nội dung sách tốt hơn chính là lập luận thuyết phục.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Đề xuất “Mọi người cần nói khẽ trong thư viện” nêu hành động rõ ràng, đi kèm lý lẽ giải thích lợi ích của không gian yên tĩnh giúp các bạn tập trung đọc sách tốt hơn.",
    },
  ],
};
