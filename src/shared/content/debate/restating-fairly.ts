/**
 * Tư duy phản biện · Diễn đạt lại trung thực ý của bạn (skill: deb-restating-fairly, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const restatingFairly: LessonDefinition = {
  id: "deb-restating-fairly",
  subjectId: "debate",
  skillId: "deb-restating-fairly",
  titleVi: "Diễn đạt lại trung thực ý của bạn trước khi phản hồi",
  titleEn: "Restating Others' Views Fairly Before Replying",
  objectiveVi:
    "Em biết tóm tắt lại đúng và công tâm ý kiến của người đối thoại (“Ý bạn là… có đúng không?”) trước khi nêu góc nhìn của mình, tránh phóng đại hay bóp méo lời bạn.",
  objectiveEn:
    "Accurately and fairly restate a classmate's point ('Do you mean...?' ) before replying, avoiding exaggeration or distortion.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-restating-fairly",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách thực hành mẫu câu 'Tớ hiểu ý bạn là..., có đúng không?' trước khi nêu ý kiến khác trong giờ học nhóm.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trước khi nêu ý kiến không đồng tình với bạn trong buổi thảo luận nhóm, việc nhắc lại ngắn gọn và trung thực ý của bạn (“Ý bạn là… có đúng không?”) mang lại tác dụng gì?",
        question_en:
          "Before sharing a disagreement in group discussion, what is the benefit of briefly and accurately restating your classmate's point ('Do you mean...?')?",
        choices: [
          {
            id: "a",
            label_vi:
              "Giúp kiểm tra xem em đã hiểu đúng ý bạn chưa và cho bạn thấy em thực sự lắng nghe, tôn trọng góc nhìn của bạn.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Nghĩa là em bắt buộc phải gác hết mọi lý lẽ riêng của mình sang một bên để làm theo ý của bạn hoàn toàn từ đầu đến cuối.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Làm cho buổi thảo luận của nhóm kết thúc ngay tại chỗ mà các thành viên còn lại không cần góp thêm ý kiến nào nữa.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Giúp em khéo léo sửa đổi lời phát biểu của bạn sang một ý khác kém hợp lý hơn để lát nữa dễ bề phản bác.",
            correct: false,
          },
        ],
        hint1_vi:
          "Đã bao giờ em thấy hai người tranh luận rất lâu chỉ vì người này nghe nhầm ý người kia chưa?",
        hint2_vi:
          "Hiểu đúng ý bạn có đồng nghĩa với việc phải đồng ý 100% với bạn không, hay chỉ là bước chuẩn bị để trao đổi trúng trọng tâm?",
        hint3_vi:
          "Diễn đạt lại trung thực giúp tránh hiểu lầm đáng tiếc và tạo không khí tin cậy trước khi em trình bày lý lẽ riêng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Diễn đạt lại đúng ý người nói không có nghĩa là đã đồng thuận hoàn toàn, mà là bước xác nhận để chắc chắn cả hai đang bàn đúng một vấn đề và tôn trọng suy nghĩ của nhau.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Linh đề xuất: “Giờ ra chơi những hôm trời mưa trơn, chúng mình nên chơi cờ vua hoặc đọc sách trong lớp để tránh trượt ngã ngoài sân.” Bạn Đức đáp: “Vậy là Linh muốn cấm cả lớp không bao giờ được ra sân vui chơi nữa chứ gì!” Lời đáp của Đức mắc lỗi gì?",
        question_en:
          "Linh suggests: 'During recess on rainy, slippery days, we should play chess or read indoors to avoid slipping.' Duc replies: 'So Linh wants to ban the whole class from ever playing outside again!' What flaw is in Duc's reply?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đức đã tóm tắt rất chính xác và giữ nguyên điều kiện “những hôm trời mưa trơn” trong lời đề xuất ban đầu của bạn Linh.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Đức đã nêu đầy đủ số liệu khảo sát xem trong lớp hiện có bao nhiêu bạn biết chơi cờ vua vào giờ giải lao giữa buổi.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đức đã phóng đại và làm sai lệch ý của Linh (biến đề xuất chỉ áp dụng khi trời mưa trơn thành cấm ra sân mọi lúc).",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Đức đã đặt một câu hỏi làm rõ rất lịch sự, thiện chí để kiểm tra xem mình nghe lời đề xuất của Linh có chuẩn xác chưa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy đối chiếu kỹ lời gốc của Linh (“những hôm trời mưa trơn”) với lời Đức gán cho Linh (“không bao giờ được ra sân nữa”).",
        hint2_vi:
          "Linh có đề nghị ở trong lớp vào những ngày nắng đẹp, sân khô ráo không?",
        hint3_vi:
          "Bỏ đi điều kiện “trời mưa trơn” và phóng đại thành “không bao giờ” là làm méo mó ý kiến thật của người nói.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Linh chỉ đề xuất chơi trong lớp vào những hôm mưa trơn để giữ an toàn, nhưng Đức lại phóng đại thành “không bao giờ được ra sân”. Phóng đại ý người khác khiến cuộc trao đổi trở nên thiếu công bằng và dễ gây hiểu lầm.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Cuộc họp nhỏ về góc cây xanh lớp 4C",
        passage_vi:
          "Chiều thứ Sáu, tổ 2 bàn cách chăm sóc ba chậu cây bên cửa sổ. Bạn Châu nói: “Mùa này nắng gắt buổi trưa nên mình nghĩ tổ nên chuyển chậu lan ý vào kệ mát trong góc lớp, còn hai chậu sen đá ưa nắng vẫn để nguyên ở bệ cửa sổ.” Nghe xong, bạn Quân mỉm cười hỏi lại: “Ý Châu là chỉ dời riêng chậu lan ý vào chỗ mát để lá không bị cháy nắng, còn hai chậu sen đá vẫn giữ ở cửa sổ như cũ, có đúng không?” Châu gật đầu vui vẻ rồi cả hai cùng bàn tiếp xem kệ nào trong lớp đủ chỗ đặt chậu cây.",
        question_vi:
          "Chi tiết nào trong đoạn hội thoại cho thấy Quân đã diễn đạt lại trung thực và đầy đủ ý kiến của Châu trước khi bàn tiếp?",
        choices: [
          {
            id: "a",
            label_vi:
              "Quân cho rằng Châu muốn mang toàn bộ ba chậu cây xanh bên cửa sổ về nhà riêng chứ không tiếp tục trồng ở góc lớp 4C nữa.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Quân nhắc lại rõ cả phần dời riêng chậu lan ý vào chỗ mát lẫn phần giữ hai chậu sen đá ở cửa sổ rồi hỏi xác nhận.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Quân ngắt lời Châu ngay khi bạn mới nói câu đầu tiên để đề xuất cả tổ góp tiền mua thêm ba chậu cây cảnh hoàn toàn mới.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Quân lẳng lặng bước ra sân chơi mà không hỏi lại xem Châu đang lo lắng về nắng trưa cho chậu cây nào của tổ mình.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Nghe xong, bạn Quân mỉm cười hỏi lại: “Ý Châu là chỉ dời riêng chậu lan ý vào chỗ mát để lá không bị cháy nắng, còn hai chậu sen đá vẫn giữ ở cửa sổ như cũ, có đúng không?”",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Quân đã giữ nguyên ranh giới trong đề xuất của Châu (chỉ dời chậu lan ý vì sợ cháy nắng, giữ nguyên hai chậu sen đá) và hỏi xác nhận lịch sự, nhờ đó Châu thấy được lắng nghe và cuộc bàn bạc diễn ra suôn sẻ.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong bữa cơm tối, anh trai góp ý: “Tối thứ Tư em có bài tập Tiếng Việt dài nên mình giảm thời gian xem hoạt hình xuống 15 phút để em kịp đi ngủ lúc 9 giờ nhé.” Cách diễn đạt lại nào của người em là trung thực nhất trước khi nêu đề xuất của mình?",
        question_en:
          "At dinner, the older brother suggests: 'Since you have longer Vietnamese homework on Wednesday night, let's shorten cartoon time to 15 minutes so you can sleep by 9 PM.' Which restatement by the younger sibling is fairest before replying?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Anh không thích phim hoạt hình nên mới lấy cớ bài tập dài để giữ luôn chiếc điều khiển tivi suốt cả tuần không cho em xem chứ gì!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Ý anh vừa nói là tối thứ Tư tuần này bài Tiếng Việt dài quá nên em được phép bỏ qua không cần làm bài tập về nhà nữa phải không ạ?”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Vậy là từ tuần này trở đi tối nào anh cũng bắt em phải ngồi ở bàn học thức đến tận 11 giờ đêm mới được tắt đèn đi ngủ đúng không?”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Ý anh là riêng tối thứ Tư xem 15 phút để em kịp ngủ lúc 9 giờ đúng không ạ? Nếu em làm xong bài từ chiều thì mình giữ 25 phút được không anh?”",
            correct: true,
          },
        ],
        hint1_vi:
          "Hãy giữ đúng 3 thông tin trong lời anh trai: thời điểm (riêng tối thứ Tư), hành động (xem 15 phút) và mục đích (làm xong bài, ngủ kịp 9 giờ).",
        hint2_vi:
          "Loại bỏ những câu gán ghép ác ý (“ghét hoạt hình”, “cả tuần”) hoặc nói ngược hẳn lời anh trai.",
        hint3_vi:
          "Nhắc lại đúng ý tốt của anh rồi mới thương lượng phương án “làm xong bài từ chiều” là cách đối thoại vừa trung thực vừa thuyết phục.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Người em đã tóm tắt chính xác phạm vi (tối thứ Tư) và lý do quan tâm sức khỏe của anh (kịp ngủ lúc 9 giờ), sau đó mới nêu giải pháp chủ động làm bài sớm từ buổi chiều. Cách nói này giữ hòa khí và giải quyết trọn vẹn nỗi lo của anh.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi chuẩn bị báo tường của lớp, bạn Mai nói: “Mình lo vẽ tranh khổ quá lớn sẽ chiếm hết chỗ dán bài thơ của các bạn tổ 3.” Em muốn đề xuất vẫn giữ bức tranh nhưng thu nhỏ khung viền lại. Câu mở đầu phản hồi nào vận dụng tốt nhất kỹ năng diễn đạt lại công bằng?",
        question_en:
          "Preparing the class wall newspaper, Mai says: 'I worry that drawing too large a picture will leave no room for Team 3's poems.' You want to keep the picture with a smaller border. Which opening best applies fair restatement?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Vậy là Mai chê tranh của nhóm mỹ thuật chưa đẹp nên muốn loại bỏ toàn bộ phần hình vẽ minh họa trên tờ báo tường của lớp mình chứ gì!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Mai đang lo cần chừa đủ chỗ cho bài thơ của tổ 3 phải không? Vậy mình thu gọn viền tranh lại để vừa có tranh đẹp vừa đủ chỗ dán thơ nhé!”",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "“Ý của Mai là năm nay không muốn các bạn tổ 3 gửi bài thơ tham gia trang trí tờ báo tường chung cùng với cả lớp nữa có phải không?”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Nhóm mỹ thuật cứ vẽ bức tranh choán kín hết mặt giấy báo tường đi, không cần bận tâm xem các tổ khác còn chỗ dán bài viết hay không!”",
            correct: false,
          },
        ],
        hint1_vi:
          "Mai có chê tranh xấu không, hay Mai đang lo về diện tích dành cho bài thơ của các bạn tổ 3?",
        hint2_vi:
          "Một câu phản hồi trọn vẹn nên bắt đầu bằng việc xác nhận đúng mối quan tâm của Mai, rồi nối sang giải pháp dung hòa cả hai bên.",
        hint3_vi:
          "Ghi nhận đúng nỗi lo thiếu chỗ dán thơ của Mai rồi đề xuất thu gọn viền tranh giúp cả hai ý tưởng cùng được tôn trọng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bằng cách diễn đạt lại đúng thiện chí của Mai (đảm bảo chỗ cho bài thơ của tổ 3) thay vì suy diễn Mai chê tranh, em vừa tôn trọng bạn vừa đưa ra được giải pháp hài hòa cho tờ báo tường của lớp.",
    },
  ],
};
