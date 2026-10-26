/**
 * Tiếng Việt · Dẫn chứng từ bài đọc (skill: vie-evidence, lớp 4)
 *
 * Steps live inline: the payload is short enough that splitting it would only
 * add indirection. Authored for TAI Learning OS; original content, not copied
 * from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const findEvidence: LessonDefinition = {
  id: "vie-find-evidence",
  subjectId: "vietnamese",
  skillId: "vie-evidence",
  titleVi: "Tìm dẫn chứng trong bài đọc",
  titleEn: "Finding Evidence in Text",
  objectiveVi:
    "Em sẽ chỉ ra được câu trong bài đọc giúp chứng minh cho câu trả lời của mình.",
  objectiveEn:
    "Point to the sentence in the text that supports your answer.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-read-evid",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách gạch chân câu dẫn chứng trong bài đọc.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Dẫn chứng trong bài đọc là gì?",
        question_en: "What is evidence in a text?",
        choices: [
          { id: "a", label_vi: "Câu trong bài đọc giúp chứng minh câu trả lời của em.", correct: true },
          { id: "b", label_vi: "Điều em nhớ từ bài đọc hôm trước.", correct: false },
          { id: "c", label_vi: "Suy nghĩ của em về nhân vật.", correct: false },
          { id: "d", label_vi: "Tên của tác giả bài đọc.", correct: false },
        ],
        hint1_vi: "Em hãy nghĩ: làm sao để bạn tin câu trả lời của em là đúng?",
        hint2_vi: "Dẫn chứng phải nằm trong bài đọc, chứ không nằm ngoài trang giấy.",
        hint3_vi: "Khi có dẫn chứng, em chỉ vào đúng một chỗ trong bài và cho mọi người thấy.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Dẫn chứng là câu có sẵn trong bài đọc, giúp chứng minh câu trả lời của em đúng. Còn nhớ từ hôm trước hay suy nghĩ của em không nằm trong bài, nên không ai kiểm tra được — dùng chúng thì câu trả lời chỉ là ý kiến riêng.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi tìm dẫn chứng, câu em chọn cần thỏa điều kiện nào?",
        question_en: "What must the evidence sentence satisfy?",
        choices: [
          { id: "a", label_vi: "Phải là câu dài nhất trong bài.", correct: false },
          { id: "b", label_vi: "Phải có chữ khớp theo thứ tự trong câu hỏi.", correct: false },
          { id: "c", label_vi: "Phải thật sự nằm trong bài và chứng minh được câu trả lời.", correct: true },
          { id: "d", label_vi: "Phải là câu cuối cùng của bài.", correct: false },
        ],
        hint1_vi: "Em hãy kiểm tra câu mình chọn có thật trong bài không.",
        hint2_vi: "Câu dài nhất chưa chắc liên quan đến câu hỏi.",
        hint3_vi: "Một câu chỉ là dẫn chứng khi nó chứng minh được điều em đang khẳng định.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Có hai điều kiện: câu đó phải nằm trong bài đọc, và phải chứng minh được câu trả lời. Nếu thiếu điều kiện thứ nhất thì em đang tự thêm chữ vào bài, còn thiếu điều kiện thứ hai thì câu đúng nhưng không giúp gì cho câu trả lời.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Tra cây",
        passage_vi:
          "Mỗi tháng Một, cả lớp cùng tham gia trồng cây ở vườn nhà trường. Cô giáo chia cho mỗi em một cây giống và một cái xẻng nhỏ. Cả lớp đào hố, cắm cây rồi lấp đất và tưới nước. Bin đặt bảng tên cạnh cây để sau này còn đi tìm. Các em hứa sẽ chăm sóc cây cho đến khi cây cao hơn mình.",
        question_vi: "Điều gì trong bài chứng minh cả lớp cùng nhau trồng cây?",
        choices: [
          { id: "a", label_vi: "Cô giáo chia cho mỗi em một cây giống và một cái xẻng nhỏ.", correct: false },
          { id: "b", label_vi: "Bin đặt bảng tên cạnh cây để sau này còn đi tìm.", correct: false },
          { id: "c", label_vi: "Cả lớp đào hố, cắm cây rồi lấp đất và tưới nước.", correct: true },
          { id: "d", label_vi: "Các em hứa sẽ chăm sóc cây cho đến khi cây cao hơn mình.", correct: false },
        ],
        evidenceSentence_vi: "Cả lớp đào hố, cắm cây rồi lấp đất và tưới nước.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu này có tên “cả lớp” và kể đủ các việc đào hố, cắm cây, lấp đất, tưới nước, nên nó chứng minh mọi người cùng làm với nhau. Câu a nói về việc cô phát đồ, còn câu d nói về việc chăm sóc sau này, cả hai chỉ là một phần của hoạt động.",
    },
    {
      position: 4,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Con thỏ của Lan",
        passage_vi:
          "Ngày đầu tiên về nhà, con thỏ của Lan rất nhút nhát. Nó thu mình trong góc chuồng và không chịu ăn hết phần cỏ khô. Lan ngồi im bên chuồng đọc truyện để con thỏ quen với mình. Ba hôm sau, con thỏ bắt đầu tin người và chạy ra ăn cỏ từ tay Lan. Từ đó trở đi, mỗi sáng Lan đều hái cỏ tươi cho bạn của mình. Nhờ kiên nhẫn, Lan đã có một người bạn thân.",
        question_vi: "Câu nào trong bài chứng minh Lan đã kiên nhẫn chăm sóc con thỏ?",
        choices: [
          { id: "a", label_vi: "Ngày đầu tiên về nhà, con thỏ của Lan rất nhút nhát.", correct: false },
          { id: "b", label_vi: "Lan ngồi im bên chuồng đọc truyện để con thỏ quen với mình.", correct: true },
          { id: "c", label_vi: "Nó thu mình trong góc chuồng và không chịu ăn hết phần cỏ khô.", correct: false },
          { id: "d", label_vi: "Nhờ kiên nhẫn, Lan đã có một người bạn thân.", correct: false },
        ],
        evidenceSentence_vi: "Lan ngồi im bên chuồng đọc truyện để con thỏ quen với mình.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Câu b mô tả chính hành động chứng minh sự kiên nhẫn: Lan ngồi im và làm quen dần với con thỏ. Câu a và c chỉ nói về tính nhút nhát của con thỏ, còn câu d là câu kết luận của tác giả, không cho thấy Lan đã làm gì.",
    },
    {
      position: 5,
      kind: "independent",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Trận bóng sau giờ học",
        passage_vi:
          "Sau giờ học, đội bóng của lớp Bin gặp đội bạn ở sân trường. Giữa trận, Bin ngã xuống sau một pha tranh bóng và đầu gối chảy máu. Bin định bỏ về nhưng các bạn trong đội động viên Bin đứng dậy tiếp tục chơi. Sang hiệp hai, Bin ghi bàn thắng quyết định cho đội nhà. Cả hai đội bắt tay nhau sau tiếng còi kết thúc. Bin hiểu rằng có bạn bên cạnh, mình có thể vượt qua khó khăn.",
        question_vi: "Câu nào chứng minh Bin được các bạn trong đội động viên?",
        choices: [
          { id: "a", label_vi: "Sang hiệp hai, Bin ghi bàn thắng quyết định cho đội nhà.", correct: false },
          { id: "b", label_vi: "Cả hai đội bắt tay nhau sau tiếng còi kết thúc.", correct: false },
          { id: "c", label_vi: "Bin ngã xuống sau một pha tranh bóng và đầu gối chảy máu.", correct: false },
          { id: "d", label_vi: "Bin định bỏ về nhưng các bạn trong đội động viên Bin đứng dậy tiếp tục chơi.", correct: true },
        ],
        evidenceSentence_vi: "Bin định bỏ về nhưng các bạn trong đội động viên Bin đứng dậy tiếp tục chơi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu này có đủ hai phần: Bin định bỏ về và các bạn động viên Bin tiếp tục chơi, nên nó chứng minh đúng điều được hỏi. Câu a kể kết quả sau này, câu c chỉ nói về chấn thương của Bin, còn câu b nói về tinh thần thể thao giữa hai đội.",
    },
    {
      position: 6,
      kind: "transfer",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Giữ sạch phố phường",
        passage_vi:
          "Sáng chủ nhật, Bin cùng các bạn trong tổ dọn dẹp khu vườn nhỏ đầu phố. Các em nhặt rác đựng vào túi, cắt cỏ và tưới nước cho mấy chậu hoa. Bà Tư ở gần đó mang ra mấy chai nước lớn cho các em uống. Thấy mấy cháu nhỏ giúp đỡ, mọi người trong phố đều tấm tắc khen. Khi khu vườn sạch sẽ, các em ngồi xuống bục đá và cùng hát một bài hát quen thuộc. Từ hôm đó, có nhiều em trong phố tham gia dọn dẹp mỗi cuối tuần.",
        question_vi: "Câu nào chứng minh công việc của các em đã được mọi người ghi nhận?",
        choices: [
          { id: "a", label_vi: "Các em nhặt rác đựng vào túi, cắt cỏ và tưới nước cho mấy chậu hoa.", correct: false },
          { id: "b", label_vi: "Bà Tư ở gần đó mang ra mấy chai nước lớn cho các em uống.", correct: false },
          { id: "c", label_vi: "Từ hôm đó, có nhiều em trong phố tham gia dọn dẹp mỗi cuối tuần.", correct: false },
          { id: "d", label_vi: "Thấy mấy cháu nhỏ giúp đỡ, mọi người trong phố đều tấm tắc khen.", correct: true },
        ],
        evidenceSentence_vi: "Thấy mấy cháu nhỏ giúp đỡ, mọi người trong phố đều tấm tắc khen.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu này nói rõ mọi người trong phố khen ngợi khi thấy các em giúp đỡ, nên nó chứng minh công việc được ghi nhận. Câu cũng là một tín hiệu, nhưng nó cho thấy kết quả kéo theo, không nói trực tiếp về lời khen; nếu em chọn c, em cần nối thêm một bước suy luận của riêng mình.",
    },
  ],
};
