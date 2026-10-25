/**
 * Tiếng Việt · Ý chính đoạn văn (skill: vie-reading-main, lớp 4)
 *
 * Steps live inline: the payload is short enough that splitting it would only
 * add indirection. Authored for TAI Learning OS; original content, not copied
 * from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const readingMainIdea: LessonDefinition = {
  id: "vie-reading-main-idea",
  subjectId: "vietnamese",
  skillId: "vie-reading-main",
  titleVi: "Tìm ý chính",
  titleEn: "Finding the Main Idea",
  objectiveVi:
    "Em sẽ đọc một đoạn văn ngắn và nói được ý chính, tách ý chính ra khỏi những chi tiết nhỏ.",
  objectiveEn:
    "Read a short paragraph and state its main idea, separating it from the small details.",
  gradeFrom: 4,
  gradeTo: 4,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Ý chính của một đoạn văn là gì?",
        question_en: "What is the main idea of a paragraph?",
        choices: [
          { id: "a", label_vi: "Câu dài nhất trong đoạn văn.", correct: false },
          { id: "b", label_vi: "Điều mà cả đoạn văn muốn nói với em.", correct: true },
          { id: "c", label_vi: "Từ mới xuất hiện trong đoạn văn.", correct: false },
          { id: "d", label_vi: "Một chi tiết nhỏ trong đoạn văn.", correct: false },
        ],
        hint1_vi: "Em hãy nghĩ: sau khi đọc xong, em kể lại điều gì cho bạn nghe trước tiên?",
        hint2_vi: "Ý chính là điều quan trọng nhất, không phải điều dài nhất.",
        hint3_vi: "Những chi tiết nhỏ giúp giải thích thêm cho ý chính, chúng không phải ý chính.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Ý chính là điều chính mà tác giả muốn truyền đạt trong cả đoạn văn. Các câu còn lại thường kể thêm chi tiết để làm rõ ý đó, nên ý chính không phải lúc nào cũng là câu dài nhất.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để tìm ý chính, em nên đọc đoạn văn theo cách nào?",
        question_en: "How should you read the paragraph to find the main idea?",
        choices: [
          { id: "a", label_vi: "Đọc lướt qua rồi đoán ngay.", correct: false },
          { id: "b", label_vi: "Đọc hết đoạn văn rồi tự hỏi cả đoạn nói chủ đề gì.", correct: true },
          { id: "c", label_vi: "Chỉ đọc câu đầu tiên.", correct: false },
          { id: "d", label_vi: "Đếm xem đoạn văn có mấy câu.", correct: false },
        ],
        hint1_vi: "Ý chính nằm ở mối quan hệ giữa các câu với nhau.",
        hint2_vi: "Nếu chỉ đọc một câu, em có thể bỏ sót các ý quan trọng sau đó.",
        hint3_vi: "Em hãy đọc hết rồi tự kể lại bằng lời của mình.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đọc hết đoạn văn giúp em thấy tất cả các ý và cách chúng liên quan nhau, từ đó mới tìm được điều chung. Đọc lướt hoặc chỉ đọc một câu dễ khiến em chọn nhầm một chi tiết làm ý chính.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Bữa cơm chiều ở quê",
        passage_vi:
          "Nhà bà ngoại có một cây xoài to ngay sau vườn. Mỗi độ tháng Năm, cây ra hoa và bắt đầu đậu quả. Bin hay leo cây thang để hái những quả xoài chín cho cả nhà. Quả xoai nhà bà có vị ngọt thanh, khác hẳn xoài bán ở chợ. Vào những bữa cơm chiều, cả nhà ngồi quanh bàn ăn xoài và trò chuyện. Những ngày ở quê khiến Bin nhớ mãi.",
        question_vi: "Đoạn văn trên nói chính về điều gì?",
        choices: [
          { id: "a", label_vi: "Cách leo cây thang lên cây xoài.", correct: false },
          { id: "b", label_vi: "Vị xoài chợ khác với xoài nhà trồng.", correct: false },
          { id: "c", label_vi: "Kỷ niệm vui về cây xoài và những ngày ở quê của Bin.", correct: true },
          { id: "d", label_vi: "Xoài cây nhà bà mọc sau vườn.", correct: false },
        ],
        evidenceSentence_vi: "Những ngày ở quê khiến Bin nhớ mãi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Các câu trong đoạn đều xoay quanh cây xoài và kỷ niệm của Bin ở quê, nên ý chính là những kỷ niệm ấy. Cách leo thang và vị xoài chỉ là chi tiết nhỏ làm rõ thêm, không phải điều chính cả đoạn muốn nói.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Con thuyền giấy",
        passage_vi:
          "Sau cơn mưa chiều, ngoài đường hứng từng vũng nước to. Bin và bạn Minh thả mấy con thuyền giấy xuống vũng nước trước cổng. Hai bạn thổi nhẹ cho thuyền chạy từ mép vũng này sang mép vũng kia. Con thuyền giấy nào về đích trước thì người thả được một cái kẹo. Lúc về nhà, quần áo của Bin dính đầy bùn nhưng hai bạn vẫn cười rất vui.",
        question_vi: "Ý chính của đoạn văn trên là gì?",
        choices: [
          { id: "a", label_vi: "Trời mưa to làm đường ngập nước.", correct: false },
          { id: "b", label_vi: "Bin và Minh rất thích chơi thuyền giấy sau cơn mưa.", correct: true },
          { id: "c", label_vi: "Quần áo của Bin bị dính bùn.", correct: false },
          { id: "d", label_vi: "Thuyền giấy được gấp từ giấy báo.", correct: false },
        ],
        evidenceSentence_vi: "Lúc về nhà, quần áo của Bin dính đầy bùn nhưng hai bạn vẫn cười rất vui.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Cả đoạn kể hai bạn làm gì sau cơn mưa, và câu cuối cho thấy hai bạn vui đến mức quên cả bùn đất, nên ý chính là hai bạn thích trò chơi này. Đường ngập nước chỉ là hoàn cảnh, quần áo dính bùn là chi tiết làm nổi bật sự vui thích.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Mèo con ở hiên nhà",
        passage_vi:
          "Nhà Nam nuôi một mèo con tên là Bông. Bông có bộ lông trắng như tuyết và đôi mắt tròn xanh như hai hòn bi. Mỗi sáng, Bông ngồi ở hiên nhà đợi Nam ra chơi. Khi Nam cầm túi thức ăn, Bông chạy tới cọ vào chân Nam liên tục. Những lúc Nam buồn, Bông nằm im trong lòng Nam và kêu khẽ. Bông không chỉ là một con mèo, mà còn là người bạn của cả nhà.",
        question_vi: "Đoạn văn trên nói chính điều gì về Bông?",
        choices: [
          { id: "a", label_vi: "Bông có bộ lông trắng và đôi mắt xanh.", correct: false },
          { id: "b", label_vi: "Bông rất thích được cho ăn mỗi sáng.", correct: false },
          { id: "c", label_vi: "Bông là người bạn quen thuộc và đáng yêu của cả nhà Nam.", correct: true },
          { id: "d", label_vi: "Bông ngồi đợi ở hiên nhà mỗi sáng.", correct: false },
        ],
        evidenceSentence_vi: "Bông không chỉ là một con mèo, mà còn là người bạn của cả nhà.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Các câu trong đoạn chỉ ra Bông ở bên Nam trong nhiều lúc: chờ Nam, ăn cùng Nam, an ủi lúc Nam buồn, nên ý chính là Bông là người bạn của cả nhà. Màu lông, màu mắt và chỗ ngồi là chi tiết nhỏ, không tóm được điều chính.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Buổi sáng ở lớp học",
        passage_vi:
          "Trước khi vào học, cả lớp cùng lau bảng và dọn sách trên bàn. Cô giáo vào lớp, các em liền ngồi vào chỗ và mở vở ra. Suốt buổi học, cả lớp chăm chú nghe cô giảng bài. Khi cô hỏi, nhiều em giơ tay xin trả lời. Tan học, mỗi em xếp gọn ghế rồi ra sân chơi cùng bạn. Một ngày ở lớp trôi qua bình yên và vui vẻ.",
        question_vi: "Nếu em phải đặt tên cho đoạn văn trên, em chọn tên nào?",
        choices: [
          { id: "a", label_vi: "Cách lau bảng sạch sẽ.", correct: false },
          { id: "b", label_vi: "Một ngày yên bình ở lớp học.", correct: true },
          { id: "c", label_vi: "Các em giơ tay trả lời.", correct: false },
          { id: "d", label_vi: "Chơi ở sân trường.", correct: false },
        ],
        evidenceSentence_vi: "Một ngày ở lớp trôi qua bình yên và vui vẻ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đặt tên cho đoạn văn cũng là chọn ý chính, và câu cuối đã tóm gọn cả ngày ở lớp nên tên “Một ngày yên bình ở lớp học” là vừa vặn. Ba tên còn lại chỉ gọi một chi tiết trong ngày, chưa phản ánh trọn đoạn văn.",
    },
  ],
};
