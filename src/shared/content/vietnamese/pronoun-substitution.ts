/**
 * Tiếng Việt · Liên kết câu bằng phép thế đại từ và từ ngữ đồng nghĩa (skill: vie-pronoun-substitution, lớp 5)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const pronounSubstitution: LessonDefinition = {
  id: "vie-pronoun-substitution",
  subjectId: "vietnamese",
  skillId: "vie-pronoun-substitution",
  titleVi: "Liên kết câu bằng phép thế",
  titleEn: "Cohesion Through Pronoun and Synonym Substitution",
  objectiveVi:
    "Em sẽ biết dùng đại từ hoặc từ ngữ đồng nghĩa thay thế cho từ đã xuất hiện ở câu trước để liên kết câu và khắc phục lỗi lặp từ.",
  objectiveEn:
    "Use pronouns and synonymous phrases to refer back to earlier mentions, linking sentences smoothly without heavy repetition.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-pronoun-substitution",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đọc lại một đoạn văn em viết và thay bớt các từ bị lặp bằng đại từ hoặc cụm từ đồng nghĩa.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Liên kết câu bằng phép thế trong đoạn văn được thực hiện như thế nào?",
        question_en:
          "How does cohesion by substitution work across sentences in a paragraph?",
        choices: [
          {
            id: "a",
            label_vi:
              "Xóa hết chủ ngữ của các câu đứng sau để người đọc tự đoán đối tượng đang được nói tới.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Viết lại y nguyên tên nhân vật ở đầu tất cả các câu trong cả đoạn văn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Sử dụng ở câu đứng sau các đại từ hoặc từ ngữ đồng nghĩa để thay thế cho từ ngữ đã đứng ở câu trước.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Đổi sang một nhân vật hoàn toàn mới ở mỗi câu để không phải nhắc lại từ cũ.",
            correct: false,
          },
        ],
        hint1_vi:
          "Chữ “thế” trong “phép thế” có nghĩa là thay thế một cách hợp lí mà vẫn giữ nguyên đối tượng được nói đến.",
        hint2_vi:
          "Nếu viết lại y nguyên tên nhân vật ở mọi câu thì là lặp từ, còn xóa mất chủ ngữ thì làm câu sai ngữ pháp.",
        hint3_vi:
          "Dùng đại từ (như ông, bà, họ, đó, ấy…) hoặc cụm từ cùng chỉ đối tượng ở câu trước giúp các câu vừa gắn kết vừa uyển chuyển.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Phép thế là cách dùng đại từ (như nó, họ, đây, đó…) hoặc từ ngữ đồng nghĩa ở câu đứng sau thay thế cho từ ngữ đã có ở câu đứng trước, giúp liên kết các câu chặt chẽ và tránh lặp từ nặng nề.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đọc hai câu văn: “Hải Đăng tự tay đóng một chiếc kệ gỗ nhỏ để xếp sách giáo khoa. Món đồ mộc giản dị ấy giúp góc học tập của bạn gọn gàng hơn hẳn.” Cụm từ nào ở câu sau đã thay thế cho từ ngữ ở câu trước?",
        question_en:
          "Which phrase in the second sentence substitutes for a phrase in the first sentence?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Món đồ mộc giản dị ấy” thay cho “một chiếc kệ gỗ nhỏ”, và “bạn” thay cho “Hải Đăng”.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "“góc học tập” thay thế cho “sách giáo khoa” trong câu sau để tránh lặp lại tên đồ dùng học tập.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“gọn gàng hơn hẳn” thay thế cho “tự tay đóng” ở câu đầu tiên.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Hai câu trên không dùng bất kì từ ngữ thay thế nào, vì người viết chỉ kể lại sự việc hằng ngày.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đối chiếu xem ở câu thứ hai, chiếc kệ gỗ và Hải Đăng được gọi bằng những từ ngữ nào.",
        hint2_vi:
          "Chữ “ấy” đi kèm cụm danh từ “Món đồ mộc giản dị” chỉ chính chiếc kệ gỗ vừa nhắc ở câu đầu.",
        hint3_vi:
          "Đồng thời từ “bạn” cũng thay thế cho tên riêng “Hải Đăng” để không phải lặp lại tên riêng hai lần liên tiếp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Câu thứ hai dùng cụm từ đồng nghĩa kèm chỉ từ “Món đồ mộc giản dị ấy” để thế cho “một chiếc kệ gỗ nhỏ” và dùng từ “bạn” để thế cho “Hải Đăng”, tạo sự liên kết tự nhiên giữa hai câu.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong cặp câu: “Cây bàng cổ thụ tỏa bóng mát rượi xuống khoảng sân gạch giữa trường. Dưới tán lá rộng lớn ___, chúng em thường ngồi đọc truyện vào giờ ra chơi.”, đại từ chỉ định nào điền vào chỗ trống là tự nhiên nhất?",
        question_en:
          "Which demonstrative word naturally completes the substitution in the second sentence?",
        choices: [
          {
            id: "a",
            label_vi: "tôi",
            correct: false,
          },
          {
            id: "b",
            label_vi: "ai",
            correct: false,
          },
          {
            id: "c",
            label_vi: "bao nhiêu",
            correct: false,
          },
          {
            id: "d",
            label_vi: "đó",
            correct: true,
          },
        ],
        hint1_vi:
          "Chỗ trống cần một từ chỉ trỏ quay ngược về bóng mát của cây bàng cổ thụ ở câu thứ nhất.",
        hint2_vi:
          "“Tôi” là đại từ xưng hô ngôi thứ nhất; “ai” và “bao nhiêu” là đại từ dùng để hỏi.",
        hint3_vi:
          "Từ chỉ định “đó” đặt sau “tán lá rộng lớn” giúp người đọc nhận ra ngay tán lá của cây bàng cổ thụ vừa kể.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Từ chỉ định “đó” trong cụm “Dưới tán lá rộng lớn đó” quy chiếu trực tiếp về “Cây bàng cổ thụ tỏa bóng mát rượi” ở câu trước, thực hiện phép thế mạch lạc.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đoạn văn sau mắc lỗi lặp từ nặng nề: “Bác Hòa là nghệ nhân đan rổ tre lâu năm của xóm em. Đôi bàn tay bác Hòa thoăn thoắt vót từng nan tre mỏng đều tăm tắp. Ai đi ngang sân nhà bác Hòa cũng dừng lại ngắm những chiếc rổ tre mộc mạc.” Cách sửa nào dùng phép thế hợp lí nhất?",
        question_en:
          "Which revision best uses substitution to fix the heavy word repetition?",
        choices: [
          {
            id: "a",
            label_vi:
              "Giữ nguyên cả ba từ “bác Hòa” vì càng lặp nhiều lần tên riêng thì câu văn càng trang trọng và dễ theo dõi.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Bác Hòa là nghệ nhân đan rổ tre lâu năm của xóm em. Đôi bàn tay bác thoăn thoắt vót từng nan trúc mỏng đều tăm tắp. Ai đi ngang sân nhà người thợ tài hoa ấy cũng dừng lại ngắm những sản phẩm mộc mạc.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Bác Hòa là nghệ nhân đan rổ tre lâu năm của xóm em. Đôi bàn tay thoăn thoắt vót từng nan mỏng. Đi ngang sân cũng dừng lại ngắm những chiếc rổ tre mới đan.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Bác Hòa là nghệ nhân đan rổ tre lâu năm của xóm em. Đôi bàn tay chú Minh thoăn thoắt vót từng nan tre mỏng. Ai đi ngang sân nhà cô Lan cũng dừng lại ngắm những chiếc rổ tre mộc mạc.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em cần giữ nguyên đối tượng là bác Hòa và nghề đan lát, nhưng thay tên gọi lặp lại bằng từ xưng hô hoặc cụm từ đồng nghĩa.",
        hint2_vi:
          "Đổi sang “chú Minh”, “cô Lan” làm đoạn văn đứt mạch chủ đề; còn cắt cụt chủ ngữ khiến câu văn thiếu thành phần.",
        hint3_vi:
          "Thay “bác Hòa” bằng “bác” ở câu hai, bằng “người thợ tài hoa ấy” ở câu ba và thay “chiếc rổ tre” bằng “sản phẩm” giúp đoạn văn uyển chuyển mà rất rõ ý.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đoạn văn sửa lại đã vận dụng linh hoạt phép thế: dùng “bác” và “người thợ tài hoa ấy” thay cho “bác Hòa”, dùng “những sản phẩm mộc mạc” thay cho “những chiếc rổ tre mộc mạc”, giúp lời văn thanh thoát mà vẫn gắn kết chặt chẽ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi dùng đại từ thay thế trong câu “Lan cho Mai mượn quyển từ điển tiếng Việt vì bạn ấy để quên sách ở nhà.”, người đọc dễ bối rối điều gì và nên sửa ra sao?",
        question_en:
          "Why is the pronoun in the sentence ambiguous, and how should it be clarified?",
        choices: [
          {
            id: "a",
            label_vi:
              "Câu văn quá ngắn nên chỉ cần thêm trạng ngữ chỉ thời gian như “hôm qua” vào đầu câu là người đọc hiểu ngay ai để quên sách ở nhà.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Từ “quyển từ điển” quá dài nên chỉ cần xóa bỏ hẳn tên cuốn sách đi là câu văn gọn và rõ ràng hơn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Đại từ “bạn ấy” gây mơ hồ không rõ chỉ Lan hay Mai; nên viết rõ “vì Mai để quên sách ở nhà” hoặc “vì cô bạn ngồi cùng bàn để quên sách ở nhà”.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Phải thay đại từ “bạn ấy” bằng đại từ “chúng tôi” thì người đọc mới hiểu đúng người mượn sách và câu mới rõ nghĩa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Ở vế trước có tới hai nhân vật cùng lứa tuổi là Lan và Mai.",
        hint2_vi:
          "Khi có hai người cùng có thể được gọi là “bạn ấy”, đại từ không còn chỉ đích danh một người duy nhất nữa.",
        hint3_vi:
          "Muốn phép thế không gây hiểu lầm, người viết phải đảm bảo từ thay thế chỉ quy chiếu rõ ràng về đúng một đối tượng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Khi vế trước xuất hiện hai nhân vật ngang hàng (Lan và Mai), đại từ “bạn ấy” trở nên mơ hồ. Để câu văn sáng rõ, cần nêu đích danh “Mai” hoặc dùng cụm từ đồng nghĩa xác định rõ người mượn sách.",
    },
  ],
};
