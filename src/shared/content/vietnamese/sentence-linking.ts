/**
 * Tiếng Việt · Liên kết câu trong đoạn văn (skill: vie-sentence-linking, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 Vietnamese objectives (`GDPT2018.VIE.5.WRITE.04`).
 */
import type { LessonDefinition } from "../types";

export const sentenceLinking: LessonDefinition = {
  id: "vie-sentence-linking",
  subjectId: "vietnamese",
  skillId: "vie-sentence-linking",
  titleVi: "Liên kết câu trong đoạn văn",
  titleEn: "Linking Sentences in a Paragraph",
  objectiveVi:
    "Em sẽ dùng từ nối, từ thay thế hoặc lặp từ hợp lý để đoạn văn mạch lạc.",
  objectiveEn:
    "Use connectors, substitution, or purposeful repetition to make a paragraph coherent.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-vie-linking",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Việt Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách sửa một đoạn văn có các câu rời rạc.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Liên kết câu giúp đoạn văn như thế nào?",
        choices: [
          {
            id: "a",
            label_vi: "Các câu gắn bó, ý nối tiếp rõ ràng và dễ hiểu",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Mỗi câu nói về một chủ đề không liên quan",
            correct: false,
          },
          { id: "c", label_vi: "Đoạn văn có thật nhiều từ khó", correct: false },
          { id: "d", label_vi: "Câu nào cũng dài như nhau", correct: false },
        ],
        hint1_vi: "Hãy nghĩ đến cảm giác khi đọc một đoạn trôi chảy.",
        hint2_vi: "Các ý cần có quan hệ rõ ràng với nhau.",
        hint3_vi: "Liên kết làm đoạn văn mạch lạc và dễ hiểu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Liên kết câu giúp các ý nối tiếp hợp lý, tránh rời rạc và giúp người đọc hiểu mạch của đoạn văn.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Từ nối nào phù hợp để nêu kết quả: “Trời mưa rất to, ___ trận đấu phải hoãn lại.”?",
        choices: [
          { id: "a", label_vi: "chẳng hạn", correct: false },
          { id: "b", label_vi: "tuy nhiên", correct: false },
          { id: "c", label_vi: "trước tiên", correct: false },
          { id: "d", label_vi: "vì vậy", correct: true },
        ],
        hint1_vi: "Vế sau là kết quả của việc trời mưa.",
        hint2_vi: "Cần từ nối thể hiện quan hệ nguyên nhân – kết quả.",
        hint3_vi: "“Vì vậy” dùng để giới thiệu kết quả.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Vì vậy” nối nguyên nhân trời mưa to với kết quả trận đấu bị hoãn.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thay từ nào để tránh lặp: “Lan nuôi một chú mèo. Chú mèo rất quấn Lan.”?",
        choices: [
          {
            id: "a",
            label_vi: "Lan nuôi một chú mèo. Tuy nhiên chú mèo.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Lan nuôi một chú mèo. Nó rất quấn Lan.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Lan nuôi một chú mèo. Cái bàn rất quấn Lan.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Lan nuôi một chú mèo. Vì vậy rất quấn Lan.",
            correct: false,
          },
        ],
        hint1_vi: "Câu sau vẫn cần chỉ đúng chú mèo ở câu trước.",
        hint2_vi: "Có thể dùng một đại từ thay cho tên sự vật.",
        hint3_vi: "Đại từ “nó” thay thế cho “chú mèo”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Đại từ “nó” thay cho “chú mèo”, vừa tránh lặp vừa giữ rõ đối tượng được nói đến.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền từ nối: “Minh đã luyện tập nhiều tuần. ___, bạn vẫn hồi hộp trước cuộc thi.”",
        choices: [
          { id: "a", label_vi: "Vì vậy", correct: false },
          { id: "b", label_vi: "Do đó", correct: false },
          { id: "c", label_vi: "Tuy nhiên", correct: true },
          { id: "d", label_vi: "Trước hết", correct: false },
        ],
        hint1_vi: "Hai ý có sự trái ngược: luyện tập nhiều nhưng vẫn hồi hộp.",
        hint2_vi: "Cần từ nối chỉ quan hệ tương phản.",
        hint3_vi: "“Tuy nhiên” dùng để nối hai ý trái ngược.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "“Tuy nhiên” thể hiện sự tương phản giữa việc Minh đã luyện tập nhiều và cảm giác vẫn hồi hộp.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Cách nối nào làm hai câu mạch lạc nhất: “Mai quên mang ô. Mai bị ướt khi về nhà.”?",
        choices: [
          {
            id: "a",
            label_vi: "Mai quên mang ô. Tuy nhiên, cái ô màu xanh.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Mai quên mang ô. Trước hết, bạn bị ướt khi về nhà.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Mai quên mang ô. Chẳng hạn, bạn bị ướt khi về nhà.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Mai quên mang ô. Vì vậy, bạn bị ướt khi về nhà.",
            correct: true,
          },
        ],
        hint1_vi: "Bị ướt là kết quả của việc quên ô.",
        hint2_vi: "Dùng từ nối nguyên nhân – kết quả và đại từ thay cho “Mai”.",
        hint3_vi: "“Vì vậy, bạn...” vừa nối ý vừa tránh lặp tên.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "“Vì vậy” nêu quan hệ kết quả, còn “bạn” thay cho “Mai”, khiến hai câu gắn kết và tự nhiên.",
    },
  ],
};
