/**
 * Tiếng Việt · Danh từ, động từ và tính từ (skill: vie-word-classes, lớp 4)
 *
 * Authored for TAI Learning OS; original content aligned with GDPT 2018
 * Grade 4 Vietnamese objectives, not copied from any published textbook series.
 */
import type { LessonDefinition } from "../types";

export const wordClasses: LessonDefinition = {
  id: "vie-word-classes",
  subjectId: "vietnamese",
  skillId: "vie-word-classes",
  titleVi: "Danh từ, động từ và tính từ",
  titleEn: "Nouns, Verbs, and Adjectives",
  objectiveVi:
    "Em sẽ phân biệt được danh từ, động từ và tính từ trong các câu văn miêu tả sinh hoạt và thiên nhiên Việt Nam.",
  objectiveEn:
    "Distinguish nouns, verbs, and adjectives in sentences describing Vietnamese daily life and nature.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-vie-word-classes",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách gạch chân danh từ, động từ, tính từ trong ba câu tả cảnh sân trường.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cách hiểu nào sau đây giúp em phân biệt đúng danh từ, động từ và tính từ?",
        question_en:
          "Which statement accurately distinguishes nouns, verbs, and adjectives?",
        choices: [
          {
            id: "a",
            label_vi:
              "Danh từ chỉ hoạt động đang diễn ra, động từ chỉ tên gọi sự vật, còn tính từ chỉ số lượng cụ thể của đồ vật.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Danh từ chỉ sự vật, động từ chỉ hoạt động hoặc trạng thái, tính từ chỉ đặc điểm hoặc tính chất.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Danh từ chỉ màu sắc hoặc hình dáng, động từ chỉ tên riêng con người, còn tính từ chỉ việc làm hằng ngày.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Cả danh từ, động từ và tính từ đều chỉ dùng để gọi tên đồ vật, cây cối hay con vật quen thuộc quanh em.",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy thử lấy ba từ quen thuộc như “dòng sông”, “chảy”, “trong xanh” để so sánh.",
        hint2_vi:
          "Từ gọi tên người, vật, hiện tượng là danh từ; từ diễn tả việc đang diễn ra là động từ.",
        hint3_vi:
          "Từ cho biết màu sắc, hình dáng, tính chất như “trong xanh”, “hiền hòa” là tính từ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Danh từ dùng để gọi tên người, vật, hiện tượng tự nhiên; động từ diễn tả hoạt động hoặc trạng thái; còn tính từ miêu tả đặc điểm, màu sắc, tính chất của sự vật và hoạt động.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Buổi sớm, bà ngoại nhóm bếp củi thơm nồng mùi rơm mới.”, nhóm từ nào gồm toàn danh từ?",
        question_en:
          "Which group contains only nouns from the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "bà ngoại, nhóm, thơm nồng, bếp củi",
            correct: false,
          },
          {
            id: "b",
            label_vi: "buổi sớm, bà ngoại, nhóm, thơm nồng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "buổi sớm, bếp củi, thơm nồng, mới",
            correct: false,
          },
          {
            id: "d",
            label_vi: "buổi sớm, bà ngoại, bếp củi, rơm",
            correct: true,
          },
        ],
        hint1_vi:
          "Em hãy tìm những từ gọi tên thời gian, con người và đồ vật trong gian bếp quê.",
        hint2_vi:
          "Từ “nhóm” chỉ việc làm của bà nên là động từ, còn “thơm nồng” và “mới” chỉ đặc điểm nên là tính từ.",
        hint3_vi:
          "Loại bỏ động từ “nhóm” và các tính từ “thơm nồng”, “mới”, em sẽ giữ lại đúng nhóm từ chỉ người, vật và thời gian.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Các từ “buổi sớm” (thời gian), “bà ngoại” (người), “bếp củi” và “rơm” (sự vật) đều là danh từ. Từ “nhóm” là động từ chỉ hoạt động, còn “thơm nồng” và “mới” là tính từ chỉ đặc điểm.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Đàn cò trắng sải cánh bay qua cánh đồng lúa chín vàng.”, các động từ là những từ nào?",
        question_en:
          "Which words are the verbs in the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "sải, bay",
            correct: true,
          },
          {
            id: "b",
            label_vi: "trắng, chín vàng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "đàn cò, cánh đồng, lúa",
            correct: false,
          },
          {
            id: "d",
            label_vi: "cánh, chín vàng",
            correct: false,
          },
        ],
        hint1_vi:
          "Em hãy tự hỏi: đàn cò đang thực hiện những hoạt động gì trên bầu trời?",
        hint2_vi:
          "Những từ như “trắng”, “chín vàng” miêu tả màu sắc nên là tính từ, không phải động từ.",
        hint3_vi:
          "Hai từ diễn tả trực tiếp cử động của đôi cánh và sự di chuyển trên không trung chính là động từ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Sải” và “bay” diễn tả hoạt động di chuyển của đàn cò nên là động từ. “Đàn cò”, “cánh đồng”, “lúa” là danh từ, còn “trắng” và “chín vàng” là tính từ chỉ màu sắc.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong câu “Giọt sương mai long lanh đọng trên phiến lá sen xanh mướt.”, cặp từ nào đều là tính từ?",
        question_en:
          "Which pair of words are both adjectives in the sentence?",
        choices: [
          {
            id: "a",
            label_vi: "giọt sương mai, phiến lá sen",
            correct: false,
          },
          {
            id: "b",
            label_vi: "long lanh, đọng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "long lanh, xanh mướt",
            correct: true,
          },
          {
            id: "d",
            label_vi: "đọng, xanh mướt",
            correct: false,
          },
        ],
        hint1_vi:
          "Tính từ cho em biết vẻ đẹp, ánh sáng hoặc màu sắc của giọt sương và lá sen.",
        hint2_vi:
          "Từ “đọng” chỉ trạng thái nằm yên trên lá nên thuộc nhóm động từ, không phải tính từ.",
        hint3_vi:
          "Một từ gợi vẻ óng ánh của giọt sương, một từ gợi sắc xanh tươi non của lá sen.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "“Long lanh” gợi vẻ sáng trong của giọt sương và “xanh mướt” tả sắc xanh tươi của phiến lá sen nên cả hai đều là tính từ. Từ “đọng” là động từ chỉ trạng thái, còn “giọt sương” và “phiến lá” là danh từ.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em muốn điền một tính từ vào chỗ trống để câu văn tả phiên chợ quê giàu hình ảnh hơn: “Trên bến sông, những chiếc xuồng chở đầy chôm chôm ___ cập bờ.” Từ nào phù hợp nhất?",
        question_en:
          "Which word is an adjective that best completes the descriptive sentence?",
        choices: [
          {
            id: "a",
            label_vi: "chèo lái",
            correct: false,
          },
          {
            id: "b",
            label_vi: "chín đỏ",
            correct: true,
          },
          {
            id: "c",
            label_vi: "người bán",
            correct: false,
          },
          {
            id: "d",
            label_vi: "trao đổi",
            correct: false,
          },
        ],
        hint1_vi:
          "Chỗ trống đứng ngay sau danh từ “chôm chôm” để miêu tả đặc điểm của chùm quả.",
        hint2_vi:
          "Các từ “chèo lái”, “trao đổi” chỉ hoạt động (động từ), còn “người bán” chỉ người (danh từ).",
        hint3_vi:
          "Hãy tìm từ miêu tả màu sắc bắt mắt của những chùm chôm chôm khi vào mùa thu hoạch.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Chín đỏ” là tính từ miêu tả màu sắc rực rỡ của quả chôm chôm lúc chín, giúp cảnh xuồng ghe trên bến sông hiện lên tươi tắn. “Chèo lái” và “trao đổi” là động từ, còn “người bán” là danh từ nên không phù hợp.",
    },
  ],
};
