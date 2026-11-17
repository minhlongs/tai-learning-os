/**
 * Tiếng Việt · Từ đồng nghĩa và từ nhiều nghĩa (skill: vie-synonyms-polysemy, lớp 5)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const synonymsPolysemy: LessonDefinition = {
  id: "vie-synonyms-polysemy",
  subjectId: "vietnamese",
  skillId: "vie-synonyms-polysemy",
  titleVi: "Từ đồng nghĩa và từ nhiều nghĩa",
  titleEn: "Synonyms and Polysemous Words",
  objectiveVi:
    "Em sẽ biết chọn từ đồng nghĩa đúng sắc thái biểu cảm và phân biệt được nghĩa gốc với nghĩa chuyển của từ nhiều nghĩa.",
  objectiveEn:
    "Choose synonyms with the appropriate nuance and distinguish literal meanings from extended meanings in polysemous words.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-synonyms-polysemy",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách đặt hai câu với từ “mũi” hoặc “chân”: một câu dùng nghĩa gốc, một câu dùng nghĩa chuyển.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điểm khác biệt cốt lõi giữa nhóm từ đồng nghĩa và một từ nhiều nghĩa là gì?",
        question_en:
          "What is the core difference between synonyms and a polysemous word?",
        choices: [
          {
            id: "a",
            label_vi:
              "Từ đồng nghĩa là nhiều từ khác nhau có nghĩa giống hoặc gần giống nhau; từ nhiều nghĩa là một từ gợi ra nghĩa gốc và các nghĩa chuyển có liên hệ với nhau.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Từ đồng nghĩa là nhóm từ luôn mang nghĩa trái ngược nhau; còn từ nhiều nghĩa chỉ có một nghĩa cố định, không bao giờ mở rộng thêm.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Mọi từ đồng nghĩa đều có thể thay thế cho nhau trong mọi hoàn cảnh mà không cần xét sắc thái tình cảm.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Từ nhiều nghĩa là những từ viết giống hệt nhau nhưng các nghĩa hoàn toàn không có mối liên hệ nào.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy so sánh cặp từ “chăm chỉ – cần cù” với từ “chân” trong “chân người” và “chân bàn”.",
        hint2_vi:
          "Những từ viết giống nhau nhưng nghĩa hoàn toàn xa lạ không liên hệ gì với nhau là từ đồng âm, không phải từ nhiều nghĩa.",
        hint3_vi:
          "Nhiều từ cùng trỏ một ý gần nhau là từ đồng nghĩa; còn một từ mở rộng từ nghĩa ban đầu sang các nghĩa mới dựa trên nét tương đồng là từ nhiều nghĩa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Từ đồng nghĩa gồm nhiều từ có nghĩa giống hoặc gần giống nhau (nhưng có thể khác sắc thái biểu cảm). Từ nhiều nghĩa là một từ có nghĩa gốc ban đầu và các nghĩa chuyển được mở rộng dựa trên nét tương đồng.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Các từ “biếu, tặng, cho” đều chỉ hành động trao một vật cho người khác. Để điền vào câu “Nhân dịp mừng thọ ông nội, bố mẹ em ___ ông một hộp trà sen thơm ngát.”, từ nào thể hiện đúng thái độ kính trọng nhất?",
        question_en:
          "Which synonym best expresses respect toward a grandfather in the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "cho",
            correct: false,
          },
          {
            id: "b",
            label_vi: "phát",
            correct: false,
          },
          {
            id: "c",
            label_vi: "nhường",
            correct: false,
          },
          {
            id: "d",
            label_vi: "biếu",
            correct: true,
          },
        ],
        hint1_vi:
          "Đây là các từ đồng nghĩa không hoàn toàn, khác nhau ở thái độ của người trao đối với người nhận.",
        hint2_vi:
          "Từ “cho” thường dùng khi người lớn trao cho trẻ nhỏ hoặc giữa bạn bè thân mật ngang hàng.",
        hint3_vi:
          "Khi con cháu trao quà mừng người bề trên đáng kính như ông bà, cha mẹ, tiếng Việt dùng từ mang sắc thái lễ phép, trân trọng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Trong nhóm từ đồng nghĩa “cho, tặng, biếu”, từ “biếu” mang sắc thái kính trọng, lễ phép của người nhỏ tuổi hoặc con cháu dành cho ông bà, cha mẹ, thầy cô.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu nào dưới đây, từ “chân” được dùng với nghĩa gốc?",
        question_en:
          "In which sentence is the word 'chân' used in its original literal sense?",
        choices: [
          {
            id: "a",
            label_vi: "Chiếc bàn gỗ lim trong phòng khách có bốn cái chân chạm khắc hình rồng rất vững chãi.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Sau buổi tập chạy quanh sân trường, đôi chân của Nam hơi mỏi.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Đàn bò thung thăng gặm cỏ xanh dưới chân đồi.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Mây trắng vần vũ kéo ngang chân trời phía đông.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nghĩa gốc là nghĩa đầu tiên, trực tiếp nhất mà em nghĩ tới khi nhắc đến bộ phận cơ thể người hoặc động vật.",
        hint2_vi:
          "Các cụm “chân bàn”, “chân đồi”, “chân trời” đều mượn vị trí phần dưới cùng để gọi tên bộ phận của đồ vật và cảnh vật.",
        hint3_vi:
          "Chỉ bộ phận cơ thể giúp bạn Nam chạy quanh sân trường mới là nghĩa ban đầu của từ “chân”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Nghĩa gốc của từ “chân” chỉ bộ phận dưới cùng của cơ thể người hay động vật dùng để đi, đứng, chạy nhảy (“đôi chân của Nam”). Còn “chân bàn”, “chân đồi”, “chân trời” đều là nghĩa chuyển dựa trên vị trí tiếp giáp mặt đất hoặc phần đỡ phía dưới.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong hai cụm từ “mũi thuyền rẽ sóng” và “suy nghĩ chín chắn”, các từ “mũi” và “chín” được dùng theo nghĩa nào?",
        question_en:
          "How are the words 'mũi' and 'chín' used in 'mũi thuyền rẽ sóng' and 'suy nghĩ chín chắn'?",
        choices: [
          {
            id: "a",
            label_vi:
              "Cả hai từ “mũi” và “chín” đều được dùng theo nghĩa gốc.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Từ “mũi” dùng theo nghĩa gốc, còn từ “chín” dùng theo nghĩa chuyển.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Cả hai từ “mũi” và “chín” đều được dùng theo nghĩa chuyển.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Từ “mũi” dùng theo nghĩa chuyển, còn từ “chín” dùng theo nghĩa gốc.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy đối chiếu với nghĩa gốc: “mũi” là bộ phận dùng để thở trên khuôn mặt; “chín” là trạng thái quả trên cây hay thức ăn đã nấu xong.",
        hint2_vi:
          "Phần nhọn nhô ra phía trước của con thuyền có hình dáng tương đồng với chiếc mũi nên gọi là “mũi thuyền”.",
        hint3_vi:
          "Suy nghĩ được cân nhắc kĩ lưỡng, thấu đáo được ví như trái cây đã đến độ hoàn thiện nên gọi là “chín chắn”; vậy cả hai đều mang nghĩa mở rộng.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Cả hai từ đều mang nghĩa chuyển: “mũi thuyền” chuyển từ bộ phận trên khuôn mặt sang đầu nhọn nhô ra phía trước của con thuyền; “chín” trong “suy nghĩ chín chắn” chuyển từ trạng thái quả chín trên cây sang độ thấu đáo, sâu sắc trong nhận thức.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi viết đoạn văn tả mặt hồ thu mênh mông, yên ả trải rộng trước tầm mắt, từ đồng nghĩa chỉ độ rộng nào phù hợp nhất để điền vào câu: “Mặt hồ thu phẳng lặng trải rộng ___ trong nắng sớm.”?",
        question_en:
          "Which synonym denoting vastness best fits the calm autumn lake scene?",
        choices: [
          {
            id: "a",
            label_vi: "bát ngát",
            correct: true,
          },
          {
            id: "b",
            label_vi: "chật hẹp",
            correct: false,
          },
          {
            id: "c",
            label_vi: "khúc khuỷu",
            correct: false,
          },
          {
            id: "d",
            label_vi: "lổn nhổn",
            correct: false,
          },
        ],
        hint1_vi:
          "Em cần một từ đồng nghĩa với “mênh mông” gợi không gian thoáng đãng, trải dài êm ả ra xa.",
        hint2_vi:
          "“Chật hẹp” là từ trái nghĩa chỉ không gian nhỏ; “khúc khuỷu” tả con đường quanh co; “lổn nhổn” tả đá sỏi không đều.",
        hint3_vi:
          "Từ gợi cảm giác mặt nước mở rộng hiền hòa đến tận tầm mắt chính là “bát ngát”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Bát ngát” đồng nghĩa với “mênh mông”, mang sắc thái gợi không gian mặt hồ trải rộng, thoáng đãng và bình yên, rất hài hòa với cảnh nắng sớm mùa thu.",
    },
  ],
};
