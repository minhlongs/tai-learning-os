/**
 * Khoa học · Vòng tuần hoàn của nước (skill: sci-water-cycle, lớp 4)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 4.
 */
import type { LessonDefinition } from "../types";

export const waterCycle: LessonDefinition = {
  id: "sci-water-cycle",
  subjectId: "science",
  skillId: "sci-water-cycle",
  titleVi: "Vòng tuần hoàn của nước trong tự nhiên",
  titleEn: "The Water Cycle in Nature",
  objectiveVi: "Em nhận biết được hiện tượng bay hơi, ngưng tụ và giải thích vòng tuần hoàn của nước trong tự nhiên.",
  objectiveEn: "Identify evaporation and condensation, and explain how water circulates in nature.",
  gradeFrom: 4,
  gradeTo: 5,
  objectiveId: "obj-sci-water-cycle",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 4",
  expectedDurationMinutes: 20,
  reviewRecommendationVi: "Ôn lại sau 3 ngày bằng cách quan sát hơi nước trên nắp nồi hoặc sương sớm.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sau cơn mưa, vũng nước trên sân gạch nắng ấm dần khô đi. Nước ở vũng đó đã đi đâu?",
        question_en: "After rain, a puddle on a sunny courtyard dries up. Where did the water go?",
        choices: [
          { id: "a", label_vi: "Nước biến mất hoàn toàn không còn tồn tại.", correct: false },
          { id: "b", label_vi: "Nước chuyển thành hơi nước bay vào không khí (bay hơi).", correct: true },
          { id: "c", label_vi: "Nước hóa thành đá cứng trên mặt sân.", correct: false },
          { id: "d", label_vi: "Nước tự chảy ngược lên mái nhà.", correct: false },
        ],
        hint1_vi: "Khi phơi quần áo ướt ngoài nắng, quần áo cũng khô đi theo cách tương tự.",
        hint2_vi: "Nước lỏng gặp nắng và gió sẽ chuyển sang thể khí không nhìn thấy bằng mắt thường.",
        hint3_vi: "Hiện tượng nước lỏng chuyển thành hơi nước bay vào không khí gọi là sự bay hơi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Dưới tác dụng của ánh nắng và gió, nước ở thể lỏng trên mặt sân chuyển thành hơi nước (thể khí) bay vào không khí. Hiện tượng đó gọi là sự bay hơi.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi úp một chiếc vung (nắp nồi) nguội lên nồi nước ấm, một lúc sau mặt dưới vung có nhiều giọt nước nhỏ. Vì sao?",
        question_en: "When a cool lid is placed over warm water, tiny water droplets form underneath. Why?",
        choices: [
          { id: "a", label_vi: "Nắp nồi kim loại tự tiết ra các giọt nước lỏng khi đặt gần hơi nóng từ bếp truyền lên.", correct: false },
          { id: "b", label_vi: "Nước bên ngoài thấm xuyên qua mặt nắp kim loại xuống.", correct: false },
          { id: "c", label_vi: "Không khí khô trong phòng tự biến thành nước trên nắp.", correct: false },
          { id: "d", label_vi: "Hơi nước ấm bay lên gặp nắp nguội lạnh đi nên ngưng tụ thành giọt nước.", correct: true },
        ],
        hint1_vi: "Nước ấm trong nồi luôn có hơi nước bay lên phía trên.",
        hint2_vi: "Khi hơi nước đang ấm chạm vào mặt nắp nguội hơn, nhiệt độ của hơi nước giảm xuống.",
        hint3_vi: "Hơi nước gặp lạnh chuyển ngược lại thành các giọt nước lỏng gọi là sự ngưng tụ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Hơi nước từ nồi nước ấm bay lên gặp mặt nắp nguội hơn thì bị lạnh đi và chuyển từ thể khí sang thể lỏng, tạo thành những giọt nước nhỏ. Đó là hiện tượng ngưng tụ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong tự nhiên, các đám mây trên bầu trời được hình thành như thế nào?",
        question_en: "How are clouds formed in nature?",
        choices: [
          { id: "a", label_vi: "Hơi nước bay lên cao gặp lạnh ngưng tụ thành hạt nước nhỏ li ti.", correct: true },
          { id: "b", label_vi: "Khói bếp và bụi mịn từ mặt đất bay lên cao rồi tụ lại thành từng đám trắng xốp.", correct: false },
          { id: "c", label_vi: "Sóng biển lớn hất thẳng những giọt nước mặn lên tầng không khí cao trên bầu trời.", correct: false },
          { id: "d", label_vi: "Gió mạnh cuốn hơi nóng khô ráo từ mặt đất tụ lại thành khối khí đặc trên bầu trời.", correct: false },
        ],
        hint1_vi: "Hãy nhớ lại hai hiện tượng vừa học: bay hơi từ mặt nước và ngưng tụ khi gặp lạnh.",
        hint2_vi: "Càng lên cao trên bầu trời, không khí càng lạnh hơn so với mặt đất.",
        hint3_vi: "Hơi nước từ sông, hồ, biển bay lên cao gặp lạnh sẽ ngưng tụ thành các hạt nước nhỏ li ti tạo nên mây.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Nước ở biển, sông, hồ bay hơi vào không khí. Khi bay lên cao gặp không khí lạnh, hơi nước ngưng tụ thành vô số hạt nước nhỏ li ti hợp lại thành những đám mây.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thứ tự nào dưới đây mô tả đúng vòng tuần hoàn của nước trong tự nhiên?",
        question_en: "Which sequence correctly describes the water cycle in nature?",
        choices: [
          { id: "a", label_vi: "Mây trên cao bay hơi trước → Nước đóng băng cứng → Mưa bay ngược từ mặt đất lên bầu trời.", correct: false },
          { id: "b", label_vi: "Nước sông tự chảy thẳng lên mây → Mây khô dần đi → Nước biển cạn sạch không quay trở lại.", correct: false },
          { id: "c", label_vi: "Nước bay hơi → Ngưng tụ thành mây → Mưa rơi xuống → Nước chảy về sông, biển.", correct: true },
          { id: "d", label_vi: "Mưa rơi xuống đất → Nước thấm sâu rồi biến mất hoàn toàn.", correct: false },
        ],
        hint1_vi: "Bắt đầu từ mặt nước ở sông, hồ, biển dưới ánh nắng mặt trời.",
        hint2_vi: "Sau khi hơi nước bay lên cao và ngưng tụ thành mây dày, các giọt nước lớn dần rồi rơi xuống thành gì?",
        hint3_vi: "Nước mưa rơi xuống đất lại thấm và chảy về sông, hồ, biển để tiếp tục bay hơi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Vòng tuần hoàn của nước diễn ra liên tục: nước ở biển, sông, hồ bay hơi lên cao, gặp lạnh ngưng tụ thành mây; khi các giọt nước trong mây lớn và nặng sẽ rơi xuống thành mưa, rồi chảy lại về sông, hồ, biển.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bạn lấy cốc nước đá lạnh đặt lên bàn. Vài phút sau, thành ngoài của cốc ướt đẫm những giọt nước dù cốc không hề bị nứt. Những giọt nước đó từ đâu ra?",
        question_en: "A glass of ice water becomes wet on the outside even though it has no cracks. Where do the droplets come from?",
        choices: [
          { id: "a", label_vi: "Nước đá đang tan bên trong tự thấm xuyên qua lớp thành thủy tinh dày để chảy ra mặt ngoài cốc.", correct: false },
          { id: "b", label_vi: "Mặt bàn gỗ ẩm bên dưới tự tiết ra nước rồi dâng bám lên thành cốc.", correct: false },
          { id: "c", label_vi: "Ánh sáng đèn trong phòng chiếu vào đá lạnh nên hóa thành nước lỏng.", correct: false },
          { id: "d", label_vi: "Hơi nước trong không khí xung quanh chạm vào thành cốc lạnh nên ngưng tụ lại.", correct: true },
        ],
        hint1_vi: "Cốc thủy tinh không bị thủng nên nước bên trong không thể chảy ra ngoài.",
        hint2_vi: "Trong không khí xung quanh chúng ta luôn có hơi nước không nhìn thấy được.",
        hint3_vi: "Khi hơi nước trong không khí chạm vào thành cốc đang rất lạnh, hiện tượng gì sẽ xảy ra?",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Trong không khí xung quanh cốc luôn có hơi nước. Khi hơi nước chạm vào thành ngoài rất lạnh của cốc nước đá, nó bị lạnh đi và ngưng tụ thành các giọt nước bám bên ngoài cốc.",
    },
  ],
};
