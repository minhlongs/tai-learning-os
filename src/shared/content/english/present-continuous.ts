/**
 * Tiếng Anh · Thì hiện tại tiếp diễn (skill: eng-present-continuous, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Grade 4 English objectives.
 */
import type { LessonDefinition } from "../types";

export const presentContinuous: LessonDefinition = {
  id: "eng-present-continuous",
  subjectId: "english",
  skillId: "eng-present-continuous",
  titleVi: "Hành động đang diễn ra với thì hiện tại tiếp diễn",
  titleEn: "Actions Happening Now (Present Continuous)",
  objectiveVi:
    "Em sẽ dùng cấu trúc am / is / are + V-ing để hỏi và kể về những hành động đang diễn ra ngay lúc nói.",
  objectiveEn:
    "Use am / is / are + V-ing to ask and talk about actions happening right now.",
  gradeFrom: 4,
  gradeTo: 4,
  objectiveId: "obj-eng-present-continuous",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Tiếng Anh Lớp 4",
  expectedDurationMinutes: 15,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày bằng cách quan sát mọi người trong nhà đang làm gì và đặt câu với “is / are + V-ing”.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Để diễn tả một hành động đang diễn ra ngay lúc nói (có từ “now”), cấu trúc câu khẳng định nào là đúng?",
        question_en:
          "Which affirmative structure describes an action happening right now?",
        choices: [
          {
            id: "a",
            label_vi: "Chủ ngữ + động từ thêm đuôi “-ed”",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chủ ngữ + am / is / are + động từ thêm đuôi “-ing”",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Chủ ngữ + động từ thêm đuôi “-ing” (bỏ qua am / is / are)",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chủ ngữ + can + động từ thêm đuôi “-ing”",
            correct: false,
          },
        ],
        hint1_vi: "Thì hiện tại tiếp diễn luôn cần hai thành phần đi liền nhau trong phần vị ngữ.",
        hint2_vi: "Thành phần thứ nhất là động từ “to be” chia theo chủ ngữ (“am”, “is” hoặc “are”).",
        hint3_vi: "Ngay sau “am / is / are” là động từ chính có gắn thêm đuôi “-ing”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Thì hiện tại tiếp diễn có công thức “Chủ ngữ + am / is / are + V-ing”. Nếu thiếu “am / is / are” thì câu chưa đúng ngữ pháp tiếng Anh.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trả lời câu hỏi “What is she doing?” khi bạn nữ đang đọc một quyển sách.",
        question_en:
          "Answer “What is she doing?” when the girl is reading a book.",
        choices: [
          { id: "a", label_vi: "She reading a book.", correct: false },
          { id: "b", label_vi: "She are reading a book.", correct: false },
          { id: "c", label_vi: "She is read a book.", correct: false },
          { id: "d", label_vi: "She is reading a book.", correct: true },
        ],
        hint1_vi: "Chủ ngữ “She” là ngôi thứ ba số ít nên đi với động từ “is”.",
        hint2_vi: "Động từ “read” chỉ hành động đọc cần thêm đuôi “-ing” ở sau “is”.",
        hint3_vi: "Kiểm tra câu có đủ cả “She is” và “reading” trước cụm danh từ chỉ quyển sách.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Với chủ ngữ “She”, ta dùng “is” cộng với “reading”: “She is reading a book.” (Cô ấy đang đọc một quyển sách).",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Điền cụm động từ đúng vào chỗ trống: “Look! Minh and Bình ___ badminton in the schoolyard now.”",
        question_en:
          "Complete: “Look! Minh and Binh ___ badminton in the schoolyard now.”",
        choices: [
          { id: "a", label_vi: "are playing", correct: true },
          { id: "b", label_vi: "is playing", correct: false },
          { id: "c", label_vi: "am playing", correct: false },
          { id: "d", label_vi: "playing", correct: false },
        ],
        hint1_vi: "Từ “Look!” và “now” báo hiệu hành động đang diễn ra ngay trước mắt.",
        hint2_vi: "Chủ ngữ “Minh and Bình” gồm hai người (tương đương với “they” — số nhiều).",
        hint3_vi: "Chủ ngữ số nhiều đi với “are” rồi mới đến động từ “play” thêm đuôi “-ing”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "“Minh and Bình” là chủ ngữ số nhiều nên đi với “are”, kết hợp “playing” tạo thành “are playing badminton in the schoolyard now.”.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi thêm đuôi “-ing” vào động từ có tận cùng bằng chữ “e” câm như “write” hoặc “dance”, cách viết nào đúng chính tả?",
        question_en:
          "Which spelling is correct when adding “-ing” to “write” and “dance”?",
        choices: [
          { id: "a", label_vi: "writeing, danceing", correct: false },
          { id: "b", label_vi: "writting, danccing", correct: false },
          { id: "c", label_vi: "writing, dancing", correct: true },
          { id: "d", label_vi: "writng, dancng", correct: false },
        ],
        hint1_vi: "Quan sát chữ cái cuối cùng của hai động từ gốc “write” và “dance”.",
        hint2_vi: "Với động từ kết thúc bằng một chữ “e” không phát âm, ta lược bỏ chữ “e” đó trước khi gắn “-ing”.",
        hint3_vi: "Không gấp đôi phụ âm “t” hay “c”; chỉ bỏ chữ “e” cuối rồi thêm trực tiếp “-ing”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Động từ kết thúc bằng chữ “e” câm như “write” và “dance” sẽ bỏ “e” rồi mới thêm “-ing”, viết đúng là “writing” và “dancing”.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Giờ ra chơi, em đang tưới cây còn các bạn đang nhảy dây. Câu tiếng Anh nào miêu tả đúng cả hai hoạt động đang diễn ra?",
        question_en:
          "At break time, you are watering the plants and your friends are skipping rope. Which sentence is correct?",
        choices: [
          {
            id: "a",
            label_vi: "I watering the plants, and my friends skipping rope.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "I is watering the plants, and my friends is skipping rope.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "I am watering the plants, and my friends are skipping rope.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "I are watering the plants, and my friends am skipping rope.",
            correct: false,
          },
        ],
        hint1_vi: "Câu có hai chủ ngữ khác nhau: vế đầu là “I”, vế sau là “my friends” (số nhiều).",
        hint2_vi: "Chủ ngữ “I” luôn đi với “am”, còn danh từ số nhiều “my friends” đi với “are”.",
        hint3_vi: "Kiểm tra cả hai vế đều có đủ động từ “to be” chia đúng ngôi trước “watering” và “skipping”.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Chủ ngữ “I” đi với “am watering”, còn “my friends” (số nhiều) đi với “are skipping”, nên câu hoàn chỉnh và đúng ngữ pháp là “I am watering the plants, and my friends are skipping rope.”.",
    },
  ],
};
