/**
 * Toán 5 · Tỉ số và tỉ lệ bản đồ (skill: math-ratio-scale, lớp 5)
 *
 * Authored for TAI Learning OS. Original content, not copied from any published
 * textbook series.
 */
import type { LessonDefinition } from "../types";

export const ratiosAndScales: LessonDefinition = {
  id: "math-ratios-and-scales",
  subjectId: "math",
  skillId: "math-ratio-scale",
  titleVi: "Tỉ số và tỉ lệ bản đồ",
  titleEn: "Ratios and Map Scales",
  objectiveVi:
    "Em sẽ lập đúng tỉ số của hai đại lượng cùng loại theo thứ tự nêu trước sau và tính được độ dài thật hoặc độ dài thu nhỏ theo tỉ lệ bản đồ.",
  objectiveEn:
    "Write ratios of like quantities in the stated order and convert between map distances and real distances using map scales.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-math-ratio-scale",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Toán Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 2 ngày và 6 ngày, lưu ý đưa hai đại lượng về cùng đơn vị đo trước khi lập tỉ số.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trên góc một sơ đồ khu vườn có ghi tỉ lệ 1 : 1 000. Tỉ lệ này cho em biết điều gì?",
        question_en:
          "A garden plan shows a scale of 1 : 1,000. What does this scale mean?",
        choices: [
          {
            id: "a",
            label_vi: "Mỗi đoạn 1 cm trên sơ đồ ứng với 1 000 m ngoài thực tế.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Khu vườn ngoài thực tế nhỏ hơn hình vẽ trên sơ đồ 1 000 lần.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Độ dài trên sơ đồ đã thu nhỏ 1 000 lần; 1 cm trên sơ đồ ứng với 1 000 cm ngoài thực tế.",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Diện tích của sơ đồ luôn bằng đúng 1 000 cm².",
            correct: false,
          },
        ],
        hint1_vi:
          "Tỉ lệ bản đồ là tỉ số giữa độ dài thu nhỏ trên bản đồ và độ dài thật tương ứng khi đo bằng cùng một đơn vị.",
        hint2_vi:
          "Nếu lấy 1 cm trên sơ đồ làm đơn vị thì độ dài thật tương ứng cũng tính theo xăng-ti-mét trước khi đổi đơn vị khác.",
        hint3_vi:
          "Tỉ số 1 : 1 000 cho thấy độ dài ngoài thực tế gấp 1 000 lần độ dài đo trên sơ đồ theo cùng đơn vị đo.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Tỉ lệ 1 : 1 000 cho biết mọi độ dài trên thực tế đã được thu nhỏ 1 000 lần khi vẽ lên sơ đồ; do đó 1 cm trên sơ đồ ứng với 1 000 cm (tức 10 m) ngoài thực tế.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một hộp bút màu có 6 bút sáp đỏ và 11 bút sáp xanh. Tỉ số của số bút sáp đỏ và số bút sáp xanh là bao nhiêu?",
        question_en:
          "A box has 6 red crayons and 11 blue crayons. What is the ratio of red crayons to blue crayons?",
        choices: [
          { id: "a", label_vi: "6/11", correct: true },
          { id: "b", label_vi: "11/6", correct: false },
          { id: "c", label_vi: "6/17", correct: false },
          { id: "d", label_vi: "11/17", correct: false },
        ],
        hint1_vi:
          "Khi lập tỉ số của đại lượng thứ nhất và đại lượng thứ hai, thứ tự nêu trước viết ở tử số, nêu sau viết ở mẫu số.",
        hint2_vi:
          "Đề bài nêu số bút sáp đỏ trước (6 bút) rồi mới đến số bút sáp xanh (11 bút), không hỏi tổng số bút.",
        hint3_vi:
          "Viết tỉ số dưới dạng phân số có tử số là số bút đỏ và mẫu số là số bút xanh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Số bút sáp đỏ được nêu trước là 6, số bút sáp xanh nêu sau là 11, nên tỉ số của số bút sáp đỏ và số bút sáp xanh là 6 : 11 hay 6/11.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đoạn dây thứ nhất dài 40 cm, đoạn dây thứ hai dài 2 m. Tỉ số độ dài của đoạn dây thứ nhất và đoạn dây thứ hai (viết dưới dạng phân số tối giản) là bao nhiêu?",
        question_en:
          "The first rope is 40 cm long and the second rope is 2 m long. What is the ratio of the first rope's length to the second rope's length in simplest form?",
        choices: [
          { id: "a", label_vi: "20/1", correct: false },
          { id: "b", label_vi: "2/5", correct: false },
          { id: "c", label_vi: "1/20", correct: false },
          { id: "d", label_vi: "1/5", correct: true },
        ],
        hint1_vi:
          "Hai độ dài đang ở hai đơn vị khác nhau (cm và m), em chưa được lấy ngay 40 chia cho 2.",
        hint2_vi: "Đổi 2 m ra xăng-ti-mét: 2 m = 200 cm.",
        hint3_vi:
          "Lập phân số với tử số 40 và mẫu số 200 rồi rút gọn cả tử và mẫu cho 40.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Ta phải đổi về cùng đơn vị đo: 2 m = 200 cm. Tỉ số độ dài của đoạn dây thứ nhất và đoạn dây thứ hai là 40/200, rút gọn cho 40 được phân số tối giản 1/5.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trên bản đồ có tỉ lệ 1 : 10 000, quãng đường từ cổng trường đến nhà văn hóa đo được 4 cm. Độ dài thật của quãng đường đó là bao nhiêu mét?",
        question_en:
          "On a map with scale 1 : 10,000, the road from the school gate to the community house measures 4 cm. What is the real distance in meters?",
        choices: [
          { id: "a", label_vi: "40 m", correct: false },
          { id: "b", label_vi: "400 m", correct: true },
          { id: "c", label_vi: "4 000 m", correct: false },
          { id: "d", label_vi: "4 m", correct: false },
        ],
        hint1_vi:
          "Nhân độ dài trên bản đồ (4 cm) với 10 000 để tìm độ dài thật tính bằng xăng-ti-mét.",
        hint2_vi: "Ta được độ dài thật là 40 000 cm.",
        hint3_vi:
          "Vì 1 m = 100 cm nên em chia số xăng-ti-mét vừa tìm được cho 100 để đổi ra mét.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Độ dài thật của quãng đường là 4 × 10 000 = 40 000 cm. Đổi ra đơn vị mét: 40 000 cm = 400 m.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Sân bóng đá mini của trường có chiều dài thật là 35 m. Khi vẽ mặt bằng sân bóng lên bản vẽ có tỉ lệ 1 : 1 000 thì chiều dài sân bóng trên bản vẽ là bao nhiêu xăng-ti-mét?",
        question_en:
          "A school mini soccer field has a real length of 35 m. On a blueprint with scale 1 : 1,000, how many centimeters long is the field?",
        choices: [
          { id: "a", label_vi: "3,5 cm", correct: true },
          { id: "b", label_vi: "35 cm", correct: false },
          { id: "c", label_vi: "0,35 cm", correct: false },
          { id: "d", label_vi: "350 cm", correct: false },
        ],
        hint1_vi:
          "Đề bài hỏi số đo trên bản vẽ bằng xăng-ti-mét, nên trước hết em đổi chiều dài thật 35 m ra xăng-ti-mét.",
        hint2_vi: "Vì 1 m = 100 cm nên 35 m = 3 500 cm.",
        hint3_vi:
          "Theo tỉ lệ 1 : 1 000, lấy độ dài thật tính bằng xăng-ti-mét chia cho 1 000.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Đổi 35 m = 3 500 cm. Với tỉ lệ 1 : 1 000, chiều dài sân bóng trên bản vẽ thu nhỏ đi 1 000 lần là 3 500 : 1 000 = 3,5 cm.",
    },
  ],
};
