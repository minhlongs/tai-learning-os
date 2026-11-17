/**
 * Toán 5 · Vận tốc, quãng đường và thời gian (skill: math-motion, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const speedDistanceTime: LessonDefinition = {
  id: "math-speed-distance-time",
  subjectId: "math",
  skillId: "math-motion",
  titleVi: "Vận tốc, quãng đường và thời gian",
  titleEn: "Speed, Distance, and Time",
  objectiveVi:
    "Em sẽ hiểu mối liên hệ giữa vận tốc, quãng đường, thời gian và biết đổi số phút sang giờ trước khi nhân hoặc chia với vận tốc km/giờ.",
  objectiveEn:
    "Relate speed, distance, and time in uniform motion, converting minutes to hours before computing with speeds in km/h.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-motion",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 6 ngày, luôn kiểm tra sự tương ứng đơn vị thời gian (1 giờ = 60 phút, không phải 100 phút).",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một ô tô chuyển động đều với vận tốc 48 km/giờ trong thời gian 45 phút. Vì sao ta không được lấy 48 × 45 hoặc đổi 45 phút thành 0,45 giờ để tính quãng đường?",
        question_en:
          "A car travels at a constant speed of 48 km/h for 45 minutes. Why is it wrong to compute 48 × 45 or convert 45 minutes to 0.45 hours?",
        choices: [
          {
            id: "a",
            label_vi: "Vì 45 phút luôn phải làm tròn thành 1 giờ chẵn.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì vận tốc tính theo km/giờ mà 1 giờ có 60 phút (chứ không phải 100 phút), nên phải đổi 45 phút = 45/60 giờ = 0,75 giờ.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Vì muốn tính quãng đường của chuyển động đều ta luôn phải lấy số đo vận tốc chia thẳng cho số phút đi trên đường.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Vì khi thời gian chưa đủ 1 giờ thì quy tắc bắt buộc phải lấy số phút cộng trực tiếp vào số đo vận tốc ban đầu.",
            correct: false,
          },
        ],
        hint1_vi:
          "Đơn vị vận tốc là km/giờ nghĩa là quãng đường đi được trong mỗi 1 giờ.",
        hint2_vi:
          "Thời gian đang cho bằng phút, nên phải đổi từ phút sang giờ mới khớp đơn vị thời gian với km/giờ.",
        hint3_vi:
          "Một giờ có 60 phút chứ không phải 100 phút; em lấy 45 chia cho 60 xem được mấy phần tư giờ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Vận tốc 48 km/giờ tính theo đơn vị giờ, còn 1 giờ = 60 phút nên 45 phút = 45/60 giờ = 3/4 giờ = 0,75 giờ (quãng đường là 48 × 0,75 = 36 km), không phải 0,45 giờ.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một người đi xe đạp đi hết quãng đường 30 km trong 2,5 giờ. Vận tốc trung bình của người đi xe đạp là bao nhiêu?",
        question_en:
          "A cyclist covers 30 km in 2.5 hours. What is the cyclist's average speed?",
        choices: [
          { id: "a", label_vi: "12 km/giờ", correct: true },
          { id: "b", label_vi: "75 km/giờ", correct: false },
          { id: "c", label_vi: "15 km/giờ", correct: false },
          { id: "d", label_vi: "1,2 km/giờ", correct: false },
        ],
        hint1_vi:
          "Quãng đường tính bằng km và thời gian đã tính bằng giờ nên đơn vị đã khớp nhau.",
        hint2_vi: "Muốn tìm vận tốc, em lấy quãng đường chia cho thời gian: v = s : t.",
        hint3_vi:
          "Để tính 30 : 2,5, em nhân cả hai số với 10 thành phép chia 300 : 25.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Vận tốc của người đi xe đạp là v = s : t = 30 : 2,5 = 300 : 25 = 12 km/giờ.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một xe buýt đi đều với vận tốc 40 km/giờ trong thời gian 1 giờ 15 phút. Quãng đường xe buýt đi được là bao nhiêu ki-lô-mét?",
        question_en:
          "A bus travels at a steady speed of 40 km/h for 1 hour 15 minutes. How many kilometers does it travel?",
        choices: [
          { id: "a", label_vi: "46 km", correct: false },
          { id: "b", label_vi: "45 km", correct: false },
          { id: "c", label_vi: "60 km", correct: false },
          { id: "d", label_vi: "50 km", correct: true },
        ],
        hint1_vi:
          "Trước khi tính s = v × t, em hãy đổi toàn bộ 1 giờ 15 phút sang đơn vị giờ.",
        hint2_vi:
          "Ta có 15 phút = 15/60 giờ = 1/4 giờ = 0,25 giờ, vậy tổng thời gian là 1,25 giờ.",
        hint3_vi: "Nhân vận tốc 40 km/giờ với thời gian tính bằng giờ vừa đổi được.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Đổi 15 phút = 15 : 60 = 0,25 giờ, nên 1 giờ 15 phút = 1,25 giờ. Quãng đường xe buýt đi được là 40 × 1,25 = 50 km.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một ca nô đi hết quãng sông dài 54 km với vận tốc không đổi là 36 km/giờ. Thời gian ca nô đi hết quãng sông đó là bao lâu?",
        question_en:
          "A motorboat travels 54 km along a river at a constant speed of 36 km/h. How long does the trip take?",
        choices: [
          { id: "a", label_vi: "1 giờ 50 phút", correct: false },
          { id: "b", label_vi: "1 giờ 20 phút", correct: false },
          { id: "c", label_vi: "1 giờ 30 phút", correct: true },
          { id: "d", label_vi: "2 giờ 15 phút", correct: false },
        ],
        hint1_vi:
          "Muốn tìm thời gian, em lấy quãng đường chia cho vận tốc: t = s : v.",
        hint2_vi: "Thực hiện phép chia 54 : 36 để tìm số giờ dưới dạng số thập phân.",
        hint3_vi:
          "Phần nguyên là số giờ; phần thập phân nhân với 60 phút sẽ đổi ra đúng số phút (không đọc 0,5 giờ thành 50 phút).",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thời gian đi của ca nô là 54 : 36 = 1,5 giờ. Đổi 0,5 giờ = 0,5 × 60 = 30 phút, vậy thời gian đi là 1 giờ 30 phút.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Lúc 7 giờ sáng, bác Hòa đi xe máy từ nhà lên huyện với vận tốc 36 km/giờ. Đi được 20 phút thì bác dừng lại đổ xăng mất 10 phút, rồi đi tiếp 30 phút nữa cũng với vận tốc 36 km/giờ là tới nơi. Hỏi quãng đường từ nhà bác Hòa lên huyện dài bao nhiêu ki-lô-mét?",
        question_en:
          "At 7:00 AM, Mr. Hoa rides a motorbike toward the district center at 36 km/h. After 20 minutes he stops 10 minutes for fuel, then rides another 30 minutes at 36 km/h to arrive. How long is the road in kilometers?",
        choices: [
          { id: "a", label_vi: "30 km", correct: true },
          { id: "b", label_vi: "36 km", correct: false },
          { id: "c", label_vi: "18 km", correct: false },
          { id: "d", label_vi: "24 km", correct: false },
        ],
        hint1_vi:
          "Trong 10 phút dừng đổ xăng xe đứng yên không đi thêm quãng đường nào, nên em chỉ cộng thời gian xe thực sự chạy.",
        hint2_vi:
          "Tổng thời gian xe chạy là 20 + 30 = 50 phút; đổi 50 phút sang giờ bằng phân số 50/60 = 5/6 giờ.",
        hint3_vi:
          "Nhân vận tốc 36 km/giờ với 5/6 giờ (lấy 36 chia 6 rồi nhân 5) để tìm tổng quãng đường.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Không tính 10 phút dừng nghỉ, tổng thời gian xe thực sự chạy là 20 + 30 = 50 phút = 50/60 giờ = 5/6 giờ. Quãng đường từ nhà lên huyện dài 36 × 5/6 = 30 km.",
    },
  ],
};
