/**
 * Tiếng Anh · Trạng từ chỉ tần suất (skill: eng-frequency-adverbs, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 5 English objectives.
 */
import type { LessonDefinition } from "../types";

export const frequencyAdverbs: LessonDefinition = {
  id: "eng-frequency-adverbs",
  subjectId: "english",
  skillId: "eng-frequency-adverbs",
  titleVi: "Trạng từ chỉ tần suất và vị trí trong câu",
  titleEn: "Adverbs of Frequency and Word Order",
  objectiveVi:
    "Em sẽ phân biệt mức độ thường xuyên của always, usually, often, sometimes, never và đặt chúng đúng vị trí đối với động từ thường và động từ to be.",
  objectiveEn:
    "Distinguish frequency adverbs and place them accurately before main verbs and after be.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-eng-frequency-adverbs",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách viết hai câu thói quen có động từ thường (như “read”, “walk”) và một câu có “am / is / are” kèm trạng từ chỉ tần suất.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Dãy từ nào dưới đây sắp xếp các trạng từ chỉ tần suất theo thứ tự giảm dần từ mức độ “luôn luôn” đến “không bao giờ”?",
        question_en:
          "Which list orders the adverbs of frequency from 100% (most frequent) down to 0% (never)?",
        choices: [
          {
            id: "a",
            label_vi: "never → sometimes → often → usually → always",
            correct: false,
          },
          {
            id: "b",
            label_vi: "always → sometimes → usually → never → often",
            correct: false,
          },
          {
            id: "c",
            label_vi: "usually → always → never → often → sometimes",
            correct: false,
          },
          {
            id: "d",
            label_vi: "always → usually → often → sometimes → never",
            correct: true,
          },
        ],
        hint1_vi: "Đề bài yêu cầu sắp xếp giảm dần, nghĩa là từ chỉ mức độ 100% phải đứng đầu tiên.",
        hint2_vi: "“Always” là luôn luôn, “usually” là thường xuyên ở mức rất cao, còn “never” là không bao giờ (0%) nên đứng cuối cùng.",
        hint3_vi: "Giữa “usually” và “never”, mức độ giảm dần lần lượt qua “often” (thường) rồi đến “sometimes” (thỉnh thoảng).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Thứ tự mức độ thường xuyên giảm dần là: “always” (luôn luôn) → “usually” (thường lệ) → “often” (thường) → “sometimes” (thỉnh thoảng) → “never” (không bao giờ).",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Quy tắc vị trí của trạng từ chỉ tần suất (như “always”, “usually”, “often”) trong câu khẳng định tiếng Anh là gì?",
        question_en:
          "Where do adverbs of frequency go in an affirmative English sentence?",
        choices: [
          {
            id: "a",
            label_vi: "Đứng trước động từ thường nhưng đứng sau động từ “to be” (am / is / are)",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Luôn đứng ở đầu câu trước cả chủ ngữ",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Đứng sau động từ thường nhưng đứng trước động từ “to be”",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Luôn đứng kẹp giữa động từ và tân ngữ của câu",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nhớ hai câu mẫu quen thuộc: “I always brush my teeth.” và “She is always kind.”.",
        hint2_vi: "Trong câu thứ nhất, “brush” là động từ thường và “always” nằm ngay phía trước nó.",
        hint3_vi: "Trong câu thứ hai có động từ “is”, trạng từ tần suất lại lùi ra đứng ngay phía sau “is”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Quy tắc quan trọng cần nhớ: trạng từ chỉ tần suất đứng trước động từ thường (như “usually goes”) nhưng đứng sau động từ “to be” (như “is always”).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Câu nào dưới đây đặt trạng từ “usually” đúng vị trí và chia động từ đúng với chủ ngữ “Nam”?",
        question_en:
          "Which sentence places “usually” correctly and uses the right verb form for “Nam”?",
        choices: [
          {
            id: "a",
            label_vi: "Nam rides usually his bike to school.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Nam usually rides his bike to school.",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Nam usually ride his bike to school.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Usually Nam is ride his bike to school.",
            correct: false,
          },
        ],
        hint1_vi: "“Ride” (đạp xe) là động từ thường, nên trạng từ “usually” phải đứng trước động từ này.",
        hint2_vi: "Dù có “usually” xen vào giữa, động từ vẫn phải chia theo chủ ngữ ngôi thứ ba số ít “Nam” ở thì hiện tại đơn.",
        hint3_vi: "Với chủ ngữ “Nam”, động từ “ride” cần thêm chữ “-s” ở cuối.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "“Usually” đứng trước động từ thường và chủ ngữ số ít “Nam” vẫn làm động từ thêm “-s”, nên câu đúng là “Nam usually rides his bike to school.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Linh đi ngủ đúng giờ mỗi tối nên không bao giờ đi học muộn. Câu tiếng Anh nào diễn tả đúng ý “Linh không bao giờ đi học muộn” với tính từ “late”?",
        question_en:
          "Linh is punctual every day. Which sentence correctly says “Linh is never late for school”?",
        choices: [
          {
            id: "a",
            label_vi: "Linh never is late for school.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Linh doesn't never late for school.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Linh is never late for school.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Linh isn't never late for school.",
            correct: false,
          },
        ],
        hint1_vi: "“Late” là tính từ nên câu cần có động từ “to be” là “is” đi với chủ ngữ “Linh”.",
        hint2_vi: "Bản thân từ “never” đã mang nghĩa phủ định “không bao giờ”, nên không dùng kèm “isn't” hay “doesn't”.",
        hint3_vi: "Áp dụng quy tắc vị trí: đặt trạng từ tần suất ngay phía sau động từ “is”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Với động từ “to be” (“is”), trạng từ “never” đứng ngay sau “is” và không lặp lại phủ định “not”, tạo thành câu chuẩn “Linh is never late for school.”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi bạn hỏi “How often do you read English stories?”, em muốn kể rằng em thường đọc vào buổi tối và những cuốn truyện đó luôn rất thú vị. Câu trả lời nào đúng trật tự từ ở cả hai vế?",
        question_en:
          "How do you say you often read English stories in the evening and they are always interesting?",
        choices: [
          {
            id: "a",
            label_vi: "I read often English stories in the evening, and they always are interesting.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I often read English stories in the evening, and they always are interesting.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I read often English stories in the evening, and they are always interesting.",
            correct: false,
          },
          {
            id: "d",
            label_vi: "I often read English stories in the evening, and they are always interesting.",
            correct: true,
          },
        ],
        hint1_vi: "Vế thứ nhất có động từ thường “read”; vế thứ hai có động từ “to be” là “are”.",
        hint2_vi: "Ở vế đầu, đặt trạng từ “often” đứng trước động từ thường “read”.",
        hint3_vi: "Ở vế sau, đặt trạng từ “always” đứng ngay sau động từ “are” rồi mới đến tính từ “interesting”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Câu “I often read English stories in the evening, and they are always interesting.” vận dụng chính xác cả hai quy tắc: “often” đứng trước động từ thường “read” và “always” đứng sau động từ “are”.",
    },
  ],
};
