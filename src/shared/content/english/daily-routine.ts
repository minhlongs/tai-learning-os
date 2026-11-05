/**
 * Tiếng Anh · Thói quen hằng ngày và trạng từ tần suất (skill: eng-daily-routine, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives (`GDPT2018.ENG.5.VOC.03`).
 */
import type { LessonDefinition } from "../types";

export const dailyRoutine: LessonDefinition = {
  id: "eng-daily-routine",
  subjectId: "english",
  skillId: "eng-daily-routine",
  titleVi: "Thói quen hằng ngày và trạng từ tần suất",
  titleEn: "Daily Routines and Adverbs of Frequency",
  objectiveVi:
    "Em sẽ dùng từ vựng hoạt động hằng ngày và trạng từ tần suất để nói về thói quen.",
  objectiveEn:
    "Use daily-routine vocabulary and adverbs of frequency to describe habits.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-routine",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách mô tả ba thói quen của bản thân bằng tiếng Anh.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Cụm “get up” có nghĩa là gì?",
        question_en: "What does “get up” mean?",
        choices: [
          { id: "a", label_vi: "Đi ngủ", correct: false },
          { id: "b", label_vi: "Thức dậy và ra khỏi giường", correct: true },
          { id: "c", label_vi: "Ăn sáng", correct: false },
          { id: "d", label_vi: "Đi học", correct: false },
        ],
        hint1_vi: "Đây thường là hoạt động đầu tiên của một ngày.",
        hint2_vi: "Sau khi chuông báo thức reo, em làm việc này.",
        hint3_vi: "“Get up” nghĩa là thức dậy và ra khỏi giường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Get up” nghĩa là thức dậy và ra khỏi giường. Ví dụ: “I get up at six o’clock.”.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Trạng từ “always” diễn tả mức độ thường xuyên nào?",
        question_en: "What frequency does “always” express?",
        choices: [
          { id: "a", label_vi: "Luôn luôn, gần như 100%", correct: true },
          { id: "b", label_vi: "Thỉnh thoảng", correct: false },
          { id: "c", label_vi: "Không bao giờ, 0%", correct: false },
          { id: "d", label_vi: "Chỉ một lần", correct: false },
        ],
        hint1_vi: "“Always” là mức cao nhất trong thang tần suất.",
        hint2_vi: "Nó trái nghĩa với “never”.",
        hint3_vi: "“Always” có nghĩa là luôn luôn.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Always” nghĩa là luôn luôn, diễn tả hoạt động xảy ra gần như mọi lần. “Never” mới nghĩa là không bao giờ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Chọn vị trí đúng của “usually”: “I ___ have breakfast at 7 a.m.”",
        question_en:
          "Choose the correct placement of “usually”: “I ___ have breakfast at 7 a.m.”",
        choices: [
          {
            id: "a",
            label_vi: "I have usually breakfast at 7 a.m.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Usually I have at breakfast 7 a.m.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I have breakfast at usually 7 a.m.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "I usually have breakfast at 7 a.m.",
            correct: true,
          },
        ],
        hint1_vi: "Trạng từ tần suất thường đứng trước động từ thường.",
        hint2_vi: "Động từ thường trong câu là “have”.",
        hint3_vi: "Đặt “usually” ngay trước “have”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Với động từ thường, trạng từ tần suất đứng trước động từ: “I usually have breakfast at 7 a.m.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Nam đá bóng vào thứ Bảy và Chủ nhật hằng tuần. Câu nào mô tả đúng nhất?",
        question_en:
          "Nam plays football every Saturday and Sunday. Which sentence describes this best?",
        choices: [
          {
            id: "a",
            label_vi: "Nam never plays football at weekends.",
            correct: false,
          },
          { id: "b", label_vi: "Nam played football tomorrow.", correct: false },
          { id: "c", label_vi: "Nam often plays football at weekends.", correct: true },
          { id: "d", label_vi: "Nam is football at weekends.", correct: false },
        ],
        hint1_vi: "Hoạt động diễn ra đều đặn vào hai ngày mỗi tuần.",
        hint2_vi: "“Never” không phù hợp vì Nam có đá bóng.",
        hint3_vi: "“Often” nghĩa là thường xuyên.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nam đá bóng đều đặn vào cuối tuần nên “often” là trạng từ phù hợp: “Nam often plays football at weekends.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi: "Em đánh răng vào mỗi buổi sáng. Câu nào đúng?",
        question_en:
          "You brush your teeth every morning. Which sentence is correct?",
        choices: [
          {
            id: "a",
            label_vi: "I never brush my teeth in the morning.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I always brush my teeth in the morning.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "I always brushes my teeth in the morning.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "I brush always teeth my in the morning.",
            correct: false,
          },
        ],
        hint1_vi: "“Mỗi buổi sáng” cho biết hoạt động xảy ra luôn luôn.",
        hint2_vi: "Với chủ ngữ “I”, dùng động từ nguyên mẫu “brush”.",
        hint3_vi: "Đặt “always” trước động từ “brush”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Every morning” tương ứng với “always”. Với chủ ngữ “I”, ta dùng “brush”: “I always brush my teeth in the morning.”.",
    },
  ],
};
