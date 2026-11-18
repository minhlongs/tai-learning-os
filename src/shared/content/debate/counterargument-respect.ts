/**
 * Tư duy phản biện · Lắng nghe và phản hồi lịch sự trước góc nhìn khác (skill: deb-counterargument-respect, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const counterargumentRespect: LessonDefinition = {
  id: "deb-counterargument-respect",
  subjectId: "debate",
  skillId: "deb-counterargument-respect",
  titleVi: "Lắng nghe và phản hồi lịch sự trước góc nhìn khác",
  titleEn: "Respectful Listening and Responding to Counterviews",
  objectiveVi: "Em biết lắng nghe hết ý kiến trái chiều, ghi nhận điểm hợp lý của bạn và phản hồi văn minh vào nội dung lập luận thay vì công kích cá nhân.",
  objectiveEn: "Listen to differing opinions, acknowledge valid points, and respond respectfully to arguments rather than attacking people.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-deb-counterargument-respect",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách thực hành mẫu câu 'Tớ hiểu ý bạn về..., đồng thời tớ nghĩ...' khi thảo luận nhóm.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong giờ thảo luận nhóm, khi một bạn đưa ra ý kiến khác với ý kiến của em, thái độ nào dưới đây thể hiện tư duy phản biện văn minh?",
        question_en: "During group discussion, when a classmate shares a different opinion from yours, which attitude shows respectful critical thinking?",
        choices: [
          {
            id: "a",
            label_vi: "Ngắt lời bạn ngay khi bạn vừa mở đầu câu nói và cất giọng thật to để lấn át ý kiến của bạn trước lớp.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Quay mặt đi chỗ khác không nghe tiếp vì cho rằng ý kiến của mình luôn đúng.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chăm chú lắng nghe bạn nói hết câu để hiểu rõ lý lẽ của bạn trước khi nêu phản hồi.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Đem giọng nói hoặc trang phục của bạn ra trêu chọc để cả nhóm cười.",
            correct: false,
          },
        ],
        hint1_vi: "Nếu chưa nghe hết lý do của bạn, em có thể biết bạn đang băn khoăn điều gì không?",
        hint2_vi: "Tranh luận học thuật là cùng nhau tìm ra phương án tốt nhất chứ không phải cãi nhau xem ai to tiếng hơn.",
        hint3_vi: "Theo dõi trọn vẹn phần trình bày của người đối thoại là bước đầu tiên của sự tôn trọng và cầu thị.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Lắng nghe bạn nói hết ý vừa thể hiện sự tôn trọng, vừa giúp em hiểu đúng lý lẽ của bạn để tìm điểm chung hoặc giải đáp đúng điều bạn đang băn khoăn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sự khác nhau cốt lõi giữa “phản hồi vào lập luận” và “công kích cá nhân” là gì?",
        question_en: "What is the core difference between addressing an argument and attacking a person?",
        choices: [
          {
            id: "a",
            label_vi: "Phản hồi lập luận là bàn về lý lẽ, bằng chứng; công kích cá nhân là chê người nói.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Hai cách phản ứng này thực chất giống hệt nhau vì đều nhằm mục đích chứng minh người kia đã nghĩ sai.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Công kích cá nhân giúp không khí buổi thảo luận sôi nổi hơn và khiến mọi người dễ đồng thuận hơn.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Phản hồi vào lập luận nghĩa là bác bỏ ngay mà không cần nêu lý do nào.",
            correct: false,
          },
        ],
        hint1_vi: "Hãy phân biệt giữa “công việc/ý tưởng đang bàn” và “con người bạn đang nói chuyện”.",
        hint2_vi: "Câu chê bai cá nhân (như “Cậu chẳng biết gì cả!”) có giải quyết được vấn đề của nhóm không?",
        hint3_vi: "Người lịch sự chỉ trao đổi xoay quanh căn cứ của ý tưởng, tuyệt đối không xúc phạm người phát biểu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Phản hồi vào lập luận tập trung phân tích xem ý kiến và bằng chứng đã hợp lý chưa để cùng hoàn thiện giải pháp; ngược lại, công kích cá nhân làm tổn thương người nghe và làm hỏng cuộc thảo luận.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Mai đề xuất: “Tổ mình nên diễn kịch trong buổi sinh hoạt lớp.” Bạn Khoa lo lắng: “Diễn kịch cần nhiều thời gian tập mà tuần này chúng mình chỉ có 2 giờ trống.” Cách phản hồi nào của Mai là lịch sự và thuyết phục nhất?",
        question_en: "Mai proposes a skit for class activity, and Khoa worries that 2 free hours this week aren't enough rehearsal time. Which response from Mai is most respectful and constructive?",
        choices: [
          {
            id: "a",
            label_vi: "“Khoa lúc nào cũng nhút nhát và hay bàn lùi, tuần này tổ mình không mời Khoa tham gia tập kịch nữa!”",
            correct: false,
          },
          {
            id: "b",
            label_vi: "“Cảm ơn Khoa đã nhắc về thời gian; mình chọn tiểu phẩm ngắn 3 phút có lời thoại đơn giản để kịp tập trong 2 giờ nhé!”",
            correct: true,
          },
          {
            id: "c",
            label_vi: "“Mặc kệ quỹ thời gian trống, cả tổ cứ diễn một vở kịch dài 30 phút mà không cần tập thử trước buổi sinh hoạt!”",
            correct: false,
          },
          {
            id: "d",
            label_vi: "“Nếu Khoa đã băn khoăn như vậy thì tớ giận rồi, tổ mình hủy luôn không làm tiết mục gì hết!”",
            correct: false,
          },
        ],
        hint1_vi: "Khoa đã nêu ra một nỗi lo rất thực tế: tuần này cả tổ chỉ có 2 giờ trống để tập.",
        hint2_vi: "Một phản hồi tốt nên gồm: (1) ghi nhận điểm hợp lý của bạn và (2) điều chỉnh hoặc đề xuất cách giải quyết nỗi lo đó.",
        hint3_vi: "Trân trọng lời nhắc về quỹ giờ hạn hẹp rồi thu gọn quy mô tiết mục cho vừa sức tập sẽ thuyết phục cả tổ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Mai đã ghi nhận điểm hợp lý trong ý kiến của Khoa (quỹ thời gian 2 giờ) và đưa ra giải pháp thiết thực (chọn tiểu phẩm ngắn 3 phút), giúp cả tổ thống nhất được kế hoạch khả thi.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi tranh luận về việc chọn cây trồng ở góc lớp, câu nói nào dưới đây vi phạm nguyên tắc tôn trọng do mắc lỗi công kích cá nhân?",
        question_en: "In a discussion about choosing classroom plants, which statement below violates respect by attacking the person?",
        choices: [
          {
            id: "a",
            label_vi: "“Tớ hiểu bạn thích hoa hồng vì hoa đẹp, nhưng góc lớp ít nắng nên cây trầu bà sẽ dễ sống khỏe hơn.”",
            correct: false,
          },
          {
            id: "b",
            label_vi: "“Mình cùng hỏi thêm ý kiến cô giáo chủ nhiệm xem chậu cây cỡ nào vừa vặn với kệ cửa sổ lớp mình nhé.”",
            correct: false,
          },
          {
            id: "c",
            label_vi: "“Theo bảng hướng dẫn chăm sóc cây xanh, loài cây này chỉ cần tưới nước đều đặn mỗi ngày một lần.”",
            correct: false,
          },
          {
            id: "d",
            label_vi: "“Cậu viết chữ xấu thế thì làm sao biết chọn cây nào sống khỏe!”",
            correct: true,
          },
        ],
        hint1_vi: "Tìm câu nói không bàn về đặc điểm của cây trồng mà lại đem nhược điểm riêng của bạn ra để chê bai.",
        hint2_vi: "Nét chữ viết trong vở có liên quan gì đến kiến thức chăm sóc cây xanh không?",
        hint3_vi: "Lấy chuyện nét chữ cá nhân để phủ nhận khả năng góp ý chọn cây của bạn chính là lỗi công kích người nói.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu chê bạn viết chữ xấu đem chuyện cá nhân không liên quan ra hạ thấp người nói thay vì bàn về điều kiện ánh sáng hay cách chăm sóc cây. Ba câu còn lại đều tập trung vào giải pháp và bằng chứng.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong khi thảo luận, nếu bạn đưa ra một bằng chứng xác thực cho thấy ý kiến ban đầu của em có chỗ chưa chính xác, em nên làm gì?",
        question_en: "During a discussion, if a classmate presents solid evidence showing a flaw in your original idea, what should you do?",
        choices: [
          {
            id: "a",
            label_vi: "Vui vẻ cảm ơn bạn và sẵn sàng điều chỉnh lại ý kiến cho đúng với bằng chứng thực tế.",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Cố tranh cãi đến cùng để bảo vệ ý ban đầu dù biết rõ mình đã nhầm, vì sợ nhận sai trước cả nhóm.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Tự ái rời khỏi bàn thảo luận và từ chối trao đổi tiếp với các bạn trong nhóm.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cất giấu tờ tài liệu đi để các bạn khác không nhìn thấy bằng chứng đó.",
            correct: false,
          },
        ],
        hint1_vi: "Mục đích lớn nhất của học tập và thảo luận là tìm ra điều đúng đắn chứ không phải bảo vệ cái sai bằng mọi giá.",
        hint2_vi: "Biết nhận ra điểm chưa chuẩn và sửa lại nhờ bằng chứng mới có phải là biểu hiện của người thông minh, cầu thị không?",
        hint3_vi: "Biết ghi nhận dẫn chứng đúng của bạn và cập nhật lại quan điểm thể hiện bản lĩnh học tập nghiêm túc.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Tư duy phản biện không chỉ giúp em đánh giá ý kiến của người khác mà còn giúp em tự hoàn thiện suy nghĩ của chính mình. Biết lắng nghe bằng chứng đúng và điều chỉnh ý kiến là phẩm chất của người học tập trưởng thành.",
    },
  ],
};
