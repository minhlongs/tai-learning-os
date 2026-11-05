/**
 * Khoa học · Vòng đời của sinh vật (skill: sci-life-cycles, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018
 * Khoa học Lớp 5 (`GDPT2018.SCI.5.LIFE.01`).
 */
import type { LessonDefinition } from "../types";

export const lifeCycles: LessonDefinition = {
  id: "sci-life-cycles",
  subjectId: "science",
  skillId: "sci-life-cycles",
  titleVi: "Vòng đời của sinh vật",
  titleEn: "Life Cycles of Living Things",
  objectiveVi:
    "Em sẽ nhận biết và xếp đúng thứ tự các giai đoạn trong vòng đời của sinh vật quen thuộc.",
  objectiveEn:
    "Recognise and order the stages in the life cycle of familiar living things.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-life-cycles",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách vẽ vòng đời của một cây hoặc một con vật em quen.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Vòng đời của một sinh vật là gì?",
        choices: [
          {
            id: "a",
            label_vi: "Chỉ khoảng thời gian con vật ăn uống mỗi ngày",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Đường đi lại quen thuộc của một loài trong rừng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chuỗi các giai đoạn từ khi sinh ra, lớn lên, sinh sản đến khi qua đời",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Một giai đoạn duy nhất trong đời của cơ thể",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy nghĩ từ khi con vật ra đời cho đến khi kết thúc cuộc đời.",
        hint2_vi: "Đó là nhiều giai đoạn nối tiếp nhau theo một thứ tự.",
        hint3_vi:
          "Vòng đời gồm các giai đoạn từ sinh ra, lớn lên, sinh sản đến qua đời.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Vòng đời là chuỗi các giai đoạn liên tiếp từ lúc sinh vật được sinh ra, lớn lên, sinh sản cho đến khi kết thúc cuộc đời.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ở giai đoạn đầu của vòng đời, cây hạt giống cần điều kiện gì để nảy mầm?",
        choices: [
          { id: "a", label_vi: "Nước, không khí và nhiệt độ thích hợp", correct: true },
          { id: "b", label_vi: "Chỉ cần có ánh sáng, không cần nước", correct: false },
          {
            id: "c",
            label_vi: "Chỉ cần được để trong bóng tối hoàn toàn",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Không cần điều kiện nào, hạt luôn nảy mầm ngay",
            correct: false,
          },
        ],
        hint1_vi:
          "Hãy nghĩ đến lúc em gieo hột đậu vào bông ẩm để cho nảy mầm.",
        hint2_vi: "Mầm cây cần hút nước và hơi thở.",
        hint3_vi: "Hạt nảy mầm cần nước, không khí và nhiệt độ phù hợp.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Hạt nảy mầm khi có đủ nước, không khí và nhiệt độ thích hợp; thiếu một trong các điều kiện đó hạt sẽ không nảy mầm.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vòng đời của một côn trùng biến thái hoàn toàn (như con bướm) diễn ra theo thứ tự nào?",
        choices: [
          { id: "a", label_vi: "Nhộng → bướm → trứng → sâu", correct: false },
          { id: "b", label_vi: "Trứng → sâu → nhộng → bướm", correct: true },
          { id: "c", label_vi: "Sâu → trứng → bướm → nhộng", correct: false },
          { id: "d", label_vi: "Bướm → trứng → sâu → nhộng", correct: false },
        ],
        hint1_vi: "Đời con vật bắt đầu từ một vật rất nhỏ do mẹ đẻ ra.",
        hint2_vi:
          "Sau giai đoạn ăn nhiều và lớn lên, con vật tìm chỗ để khoác vỏ cứng.",
        hint3_vi: "Thứ tự đúng là trứng, rồi sâu, rồi nhộng, rồi bướm ra.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bướm đẻ trứng, trứng nở thành sâu, sâu lớn lên rồi biến thành nhộng, từ nhộng hóa thành bướm trưởng thành.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ở giai đoạn cuối của vòng đời, sinh vật trưởng thành thường làm gì để duy trì loài của mình?",
        choices: [
          {
            id: "a",
            label_vi: "Biến mất hoàn toàn khỏi thiên nhiên ngay",
            correct: false,
          },
          { id: "b", label_vi: "Quay lại giai đoạn trứng", correct: false },
          { id: "c", label_vi: "Ngừng lớn và ngừng ăn uống", correct: false },
          { id: "d", label_vi: "Sinh sản, tạo ra các cá thể trẻ", correct: true },
        ],
        hint1_vi:
          "Hãy nghĩ đến điều các bậc cha mẹ làm để loài sinh vật không bị tuyệt chủng.",
        hint2_vi: "Loài kế tục cần có cá thể mới tiếp nối.",
        hint3_vi: "Sinh vật trưởng thành sinh sản để tạo ra cá thể trẻ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Sinh vật trưởng thành sinh sản, tạo ra đời sau, để loài sinh vật không bị tuyệt chủng trong tự nhiên.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Gia đình em nuôi gà thả vườn. Nhận xét nào đúng nhất về vòng đời của gà?",
        choices: [
          {
            id: "a",
            label_vi: "Gà con lớn lên thành gà trưởng thành, gà trưởng thành đẻ trứng và ấp thành gà con",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Gà lớn lên hoàn toàn giống gà mẹ ngay từ lúc mới nở",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Gà trưởng thành biến thành nhộng rồi hóa thành gà",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Gà đẻ trứng nhưng trứng không liên quan đến vòng đời của gà",
            correct: false,
          },
        ],
        hint1_vi: "Gà nở ra từ đâu?",
        hint2_vi: "Trước khi lớn, gà trải qua giai đoạn là gà con.",
        hint3_vi:
          "Gà con lớn thành gà trưởng thành, rồi đẻ trứng và tiếp tục sinh ra gà con.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Gà sinh ra từ trứng dưới dạng gà con, lớn lên thành gà trưởng thành, rồi đẻ trứng và ấp thành gà con, quay lại đầu vòng đời.",
    },
  ],
};
