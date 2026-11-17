/**
 * Tư duy phản biện · Đặt câu hỏi làm rõ ý (skill: deb-clarifying-questions, lớp 4)
 *
 * Authored for TAI Learning OS. Original content for Grade 4 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const clarifyingQuestions: LessonDefinition = {
  id: "deb-clarifying-questions",
  subjectId: "debate",
  skillId: "deb-clarifying-questions",
  titleVi: "Đặt câu hỏi làm rõ ý trước khi phản hồi",
  titleEn: "Asking Clarifying Questions Before Responding",
  objectiveVi:
    "Em nhận ra các từ ngữ còn mơ hồ trong cuộc trò chuyện và biết đặt câu hỏi lịch sự để hiểu đúng ý người nói trước khi đồng tình hoặc phản đối.",
  objectiveEn:
    "Spot vague words in a discussion and ask polite clarifying questions before agreeing or disagreeing.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-deb-clarifying-questions",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách tập hỏi 'Ý bạn cụ thể là bao nhiêu hoặc như thế nào?' khi nghe các từ như 'nhiều', 'sớm' trong sinh hoạt gia đình.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong giờ sinh hoạt lớp, bạn Minh đề xuất: “Tuần này tổ mình nên đến lớp thật sớm để tưới cây.” Vì sao các bạn trong tổ cần hỏi lại để làm rõ từ “thật sớm” trước khi biểu quyết?",
        question_en:
          "During a class meeting, Minh suggests: 'This week our group should come to class very early to water the plants.' Why should teammates ask to clarify 'very early' before voting?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì đặt thêm nhiều câu hỏi sẽ giúp kéo dài thời gian thảo luận để cả tổ được hoãn việc phân công tưới cây sang tuần sau.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì mỗi bạn hiểu “thật sớm” theo mốc giờ khác nhau, hỏi rõ giúp cả tổ biết chính xác mấy giờ có mặt để sắp xếp.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Vì trong sinh hoạt lớp, cụm từ “thật sớm” thực ra dùng để chỉ khung giờ buổi chiều sau khi cả trường đã tan học.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì khi chưa muốn làm theo đề xuất của bạn Minh thì hỏi vặn lại là cách nhanh nhất để bác bỏ ngay ý kiến đó.",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy thử nghĩ xem: với bạn Minh “thật sớm” có thể là 7 giờ kém 15, nhưng với bạn khác có thể là 6 giờ rưỡi sáng.",
        hint2_vi:
          "Nếu chưa biết mốc giờ cụ thể, các bạn có biết mình có kịp ăn sáng và đi đến trường đúng hẹn không?",
        hint3_vi:
          "Từ “thật sớm” còn mơ hồ; hỏi rõ giờ giấc cụ thể giúp mọi người hiểu cùng một ý trước khi đồng tình hay góp ý điều chỉnh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Những từ chỉ mức độ như “thật sớm”, “nhiều” hay “lâu” thường được mỗi người hiểu theo một mức khác nhau. Đặt câu hỏi làm rõ mốc giờ cụ thể giúp cả tổ hiểu đúng đề xuất của Minh trước khi quyết định.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Lan nói khi bàn về góc thư viện lớp: “Mỗi bạn nên góp nhiều truyện vào tủ sách chung.” Từ nào trong câu nói của Lan còn mơ hồ và cần được hỏi rõ nhất?",
        question_en:
          "Discussing the class library corner, Lan says: 'Everyone should donate many storybooks to the shared shelf.' Which word in Lan's statement is vague and most needs clarification?",
        choices: [
          {
            id: "a",
            label_vi:
              "Từ “tủ sách” — các bạn trong lớp chưa biết chiếc tủ gỗ ở góc phòng dùng để xếp sách hay cất dụng cụ vệ sinh.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Từ “mỗi bạn”: câu nói chưa cho biết lời đề xuất này dành cho học sinh trong lớp hay cả các lớp khối khác.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Từ “truyện” ở góc thư viện dễ bị nhầm với quyển vở ghi bài tập Toán hằng ngày của các bạn trong lớp.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Từ “nhiều”: chưa rõ Lan dự kiến mỗi bạn góp khoảng 2 quyển hay 10 quyển, cho mượn hay tặng luôn.",
            correct: true,
          },
        ],
        hint1_vi:
          "Hãy tìm từ chỉ số lượng mà một bạn có thể nghĩ là 2 quyển, bạn khác lại lo là phải mang tới 10 quyển.",
        hint2_vi:
          "Các từ “mỗi bạn”, “truyện”, “tủ sách” đã khá rõ đối tượng, còn từ nào chưa cho biết con số cụ thể?",
        hint3_vi:
          "Từ “nhiều” chưa nêu số lượng quyển sách cụ thể nên dễ gây lo lắng hoặc hiểu lệch giữa các bạn trong lớp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Từ “nhiều” không cho biết con số cụ thể. Khi hỏi rõ xem Lan dự kiến mỗi bạn mang khoảng 1–2 quyển hay nhiều hơn, các bạn sẽ dễ xem xét khả năng thực hiện của mình.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi em trai nói với chị: “Phân công dọn bàn ăn ở nhà mình hiện nay chưa công bằng!”, câu hỏi nào dưới đây là câu hỏi làm rõ ý lịch sự và hữu ích nhất?",
        question_en:
          "When a younger brother tells his sister: 'Cleaning the dinner table at home right now isn't fair!', which question below is the most polite and helpful clarifying question?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Theo em, điểm nào trên lịch phân công đang chưa công bằng và em mong chia lại việc như thế nào?”",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "“Sao ngày nào đến giờ dọn bát đũa em cũng phàn nàn đủ thứ để tìm cớ trốn việc phụ giúp bố mẹ vậy?”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Nếu em thấy lịch đó phiền phức quá thì từ tối mai hai chị em mình cứ để nguyên bàn ăn khỏi dọn nữa nhé?”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Hôm nay món canh rau ngót mẹ nấu buổi tối có vừa miệng hơn món canh bí đỏ hôm qua không hả em?”",
            correct: false,
          },
        ],
        hint1_vi:
          "Từ “công bằng” rất rộng: có thể em thấy số buổi chưa đều, hoặc có việc nặng quá sức của em.",
        hint2_vi:
          "Câu hỏi làm rõ cần giúp người nói giải thích cụ thể điều họ đang băn khoăn, không chê bai hay đánh trống lảng.",
        hint3_vi:
          "Hỏi nhẹ nhàng xem điểm nào chưa hợp lý và em muốn chia lại ra sao sẽ giúp hai chị em hiểu rõ vấn đề để bàn với bố mẹ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Từ “công bằng” có thể hiểu là chia đều số ngày hoặc chia việc vừa sức từng người. Đặt câu hỏi mở và tôn trọng giúp em trai nêu rõ điều đang vướng mắc thay vì nảy sinh tranh cãi cảm tính.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nhóm làm dự án khoa học bàn nhau: “Chúng mình cần quan sát chậu đậu xanh thường xuyên hơn.” Câu hỏi nào giúp cả nhóm thống nhất được kế hoạch hành động rõ ràng nhất?",
        question_en:
          "A science project group says: 'We need to observe the mung bean pot more often.' Which question best helps the group agree on a clear action plan?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Các bạn có biết nhà thực vật học nào trên thế giới là người đầu tiên ghi chép cách trồng hạt đậu xanh không?”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Hay là nhóm mình dừng hẳn dự án theo dõi cây đậu xanh để chuyển sang làm mô hình gấp giấy cho đỡ mất công chờ?”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Ý bạn ‘thường xuyên hơn’ là quan sát mỗi ngày một lần giờ ra chơi hay hai lần vào đầu giờ sáng và cuối chiều?”",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "“Theo các bạn thì chiếc chậu nhựa màu trắng đang đặt bên cửa sổ trông có nổi bật hơn chậu đất nung màu nâu không?”",
            correct: false,
          },
        ],
        hint1_vi:
          "Cụm từ “thường xuyên hơn” trong câu nói của nhóm vẫn chưa cho biết tần suất và thời điểm cụ thể.",
        hint2_vi:
          "Để phân công ghi chép số liệu cây lớn mỗi ngày, nhóm cần làm rõ điều gì về thời gian quan sát?",
        hint3_vi:
          "Hỏi cụ thể số lần quan sát trong ngày và vào khung giờ nào giúp biến lời đề xuất chung chung thành lịch làm việc rõ ràng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cụm từ “thường xuyên hơn” chưa đủ rõ để phân công trực quan sát. Câu hỏi gợi ra các khung giờ cụ thể giúp cả nhóm dễ dàng chốt lịch ghi chép thống nhất.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong buổi họp lớp chuẩn bị góc đọc sách cuối tuần, bạn Quân nói: “Chúng mình chỉ nên chọn những cuốn sách thật bổ ích.” Nếu áp dụng kỹ năng đặt câu hỏi làm rõ trước khi phản hồi, em sẽ nói gì?",
        question_en:
          "Preparing a weekend reading corner, Quan says: 'We should only pick truly useful books.' Applying the clarifying-question skill before responding, what should you say?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Tớ phản đối ngay đề xuất đó vì Quân định loại bỏ hết truyện cổ tích và truyện tranh khoa học mà các bạn đang thích đọc!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Quân ơi, theo ý bạn ‘sách thật bổ ích’ gồm những thể loại nào — có tính truyện lịch sử và khoa học vui không?”",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "“Tớ giơ tay tán thành ngay với ý của Quân dù thực sự chưa rõ bạn muốn giữ lại hay bỏ bớt những đầu sách nào.”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Chiếc kệ gỗ ba tầng ở góc lớp đã được tổ trực nhật lau sạch bụi từ chiều hôm qua để sẵn sàng xếp sách lên rồi.”",
            correct: false,
          },
        ],
        hint1_vi:
          "Đừng vội đoán ý bạn rồi phản đối gay gắt, cũng đừng gật đầu đồng ý khi chưa hiểu tiêu chí chọn sách của bạn.",
        hint2_vi:
          "Cụm từ “sách thật bổ ích” có thể bao gồm hoặc chưa bao gồm những thể loại sách nào?",
        hint3_vi:
          "Hỏi rõ tiêu chí và các thể loại sách bạn Quân đang nghĩ tới giúp cả lớp trao đổi đúng trọng tâm mà không hiểu lầm nhau.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thay vì vội vàng suy diễn ý của Quân hoặc đồng ý mù quáng, việc hỏi rõ “sách thật bổ ích” gồm những thể loại nào giúp cuộc thảo luận cởi mở, chính xác và tôn trọng lẫn nhau.",
    },
  ],
};
