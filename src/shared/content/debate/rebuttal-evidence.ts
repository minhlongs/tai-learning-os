/**
 * Tư duy phản biện · Phản biện trực diện bằng bằng chứng kiểm chứng được (skill: deb-rebuttal-evidence, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking.
 */
import type { LessonDefinition } from "../types";

export const rebuttalEvidence: LessonDefinition = {
  id: "deb-rebuttal-evidence",
  subjectId: "debate",
  skillId: "deb-rebuttal-evidence",
  titleVi: "Phản biện trực diện vào lý do bằng số liệu và quan sát",
  titleEn: "Rebutting Reasons Directly with Verifiable Evidence",
  objectiveVi:
    "Em biết phản biện thẳng vào lý lẽ chưa chính xác bằng quan sát thực tế và số liệu kiểm chứng được, tuyệt đối tránh phản bác cảm tính hay công kích cá nhân.",
  objectiveEn:
    "Rebut flawed reasons directly using verifiable data and observations rather than emotional remarks or personal attacks.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-rebuttal-evidence",
  provenance: "original_supplemental",
  sourceRef: "Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách luyện tập mẫu câu 'Mình xin bổ sung số liệu thực tế về ý này như sau...' khi thảo luận trên lớp.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong tranh luận học đường, một lời phản biện có sức thuyết phục cần nhắm vào đâu và dựa trên cơ sở nào?",
        question_en:
          "In a school debate, what should a persuasive rebuttal target, and what should it be based on?",
        choices: [
          {
            id: "a",
            label_vi:
              "Nhắm trực tiếp vào lý do hoặc bằng chứng trong lập luận của bạn và dựa trên số liệu, quan sát thực tế có thể kiểm tra lại được.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Nhắm vào tính cách, giọng nói hoặc sở thích riêng của người đang phát biểu. Chỉ cần chê đúng chỗ yếu của bạn ấy là lập luận của bạn ấy sẽ tự lung lay trước cả lớp.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Dựa trên cảm giác chủ quan “tớ thích thế” mà không cần bất kỳ thông tin thực tế nào. Trong tranh luận, ai nói to hơn và tự tin hơn thì cả lớp thường mặc nhiên coi là người thắng cuộc.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nhắc đi nhắc lại ý kiến ban đầu của mình với âm lượng to hơn lần trước, để cả lớp nghe thấy mình nói nhiều nhất và tin rằng lập luận của mình đã đủ vững chắc.",
            correct: false,
          },
        ],
        hint1_vi:
          "Phản biện là đối thoại về ý tưởng để cùng tìm ra điều đúng đắn, không phải chê bai con người của bạn.",
        hint2_vi:
          "Giữa cảm giác cá nhân và số liệu ghi chép thực tế mà cả lớp đều kiểm tra được, điều gì đáng tin cậy hơn?",
        hint3_vi:
          "Đi thẳng vào lý lẽ cần trao đổi và đưa ra bằng chứng kiểm chứng được là nguyên tắc cốt lõi của phản biện văn minh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Phản biện chuẩn mực luôn tách bạch con người khỏi ý kiến: tôn trọng người nói nhưng kiểm tra kỹ lý do của họ bằng số liệu và quan sát thực tế rõ ràng.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn Nam nhận định: “Góc đọc sách 15 phút đầu giờ không hiệu quả vì hầu như chẳng có bạn nào trong lớp đọc hết được một mẩu truyện ngắn!” Sổ theo dõi thư viện lớp tháng vừa qua ghi rõ: trung bình mỗi sáng có 28/32 bạn đọc trọn vẹn ít nhất 1 truyện ngắn hoặc 1 mục kiến thức. Câu phản biện nào sử dụng bằng chứng hiệu quả và lịch sự nhất?",
        question_en:
          "Nam claims: 'The 15-minute morning reading slot is ineffective because almost nobody finishes a short story!' The class library log shows 28/32 students finish at least one story or article each morning. Which rebuttal uses evidence best and politely?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Nam ngồi tít bàn cuối nên lúc nào cũng đoán sai chuyện của lớp, chẳng cần mở sổ thư viện ra xem cũng đủ biết ý kiến của Nam về giờ đọc sách là không đáng tin chút nào rồi!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Tớ thấy giờ đọc sách buổi sáng vui lắm nên Nam đừng phát biểu ý kiến trái chiều nữa, cả lớp cứ giữ nguyên như cũ thì ai cũng thấy thoải mái hơn rồi!”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Mình hiểu Nam lo thời gian 15 phút hơi ngắn, nhưng theo sổ theo dõi thư viện tháng qua, trung bình mỗi sáng có tới 28/32 bạn đọc trọn vẹn một truyện ngắn hoặc mục kiến thức đấy.”",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "“Chắc chắn các lớp khác trong trường cũng thích đọc sách buổi sáng giống lớp mình, nên mình không cần bận tâm xem có bạn nào trong lớp chưa đọc hết một mẩu truyện ngắn hay không.”",
            correct: false,
          },
        ],
        hint1_vi:
          "Lý do của Nam là “hầu như chẳng bạn nào đọc hết một mẩu truyện”. Hãy dùng con số trong sổ thư viện để đối chiếu trực tiếp với lý do đó.",
        hint2_vi:
          "Loại bỏ câu chê chỗ ngồi của Nam (công kích cá nhân) hoặc câu nói chung chung không có số liệu của lớp.",
        hint3_vi:
          "Trích dẫn con số 28/32 bạn từ sổ theo dõi thư viện lớp vừa lịch sự vừa chứng minh rõ hiệu quả thực tế của 15 phút đầu giờ.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Câu phản hồi ghi nhận mối băn khoăn của Nam về thời lượng 15 phút, sau đó đưa ra số liệu cụ thể 28/32 bạn từ sổ theo dõi mà bất kỳ ai trong lớp cũng có thể mở ra kiểm chứng.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi bàn cách phân loại vỏ hộp sữa giấy ở lớp, bạn Quân nói: “Làm sạch và xếp gọn vỏ hộp sữa tốn ít nhất 20 phút mỗi buổi trưa, sẽ làm các bạn mất ngủ trưa!” Tổ trực nhật đã bấm đồng hồ thực nghiệm 5 ngày liên tiếp. Bằng chứng nào dưới đây phản biện trúng đích vào lý do của Quân?",
        question_en:
          "Discussing milk-carton recycling, Quan says: 'Rinsing and flattening cartons takes at least 20 minutes every noon, cutting into nap time!' The duty team timed the process for 5 days. Which evidence directly rebuts Quan's reason?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vỏ hộp sữa giấy sau khi tái chế có thể làm thành bìa sổ tay và tấm lợp sinh thái, nên dù việc phân loại có tốn bao nhiêu phút mỗi buổi trưa thì cả lớp vẫn nên tiếp tục làm vì lợi ích môi trường lâu dài.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Kết quả bấm giờ thực tế suốt 5 buổi trưa tuần trước cho thấy khi mỗi bạn tự tráng và ép phẳng hộp của mình tại bồn rửa thì cả lớp chỉ mất trung bình 4 phút, vẫn kịp giờ nghỉ trưa.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Sữa tươi cung cấp nhiều canxi giúp học sinh lớp 5 phát triển chiều cao, nên thay vì bàn chuyện phân loại vỏ hộp, cả lớp nên dành giờ ra chơi để tìm hiểu thêm về dinh dưỡng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Quân hôm qua uống nước cam chứ không uống sữa hộp vào giờ ra chơi, nên ý kiến của Quân về thời gian phân loại vỏ hộp sữa chắc chắn không đáng để cả lớp cân nhắc nữa.",
            correct: false,
          },
        ],
        hint1_vi:
          "Lý do khiến Quân phản đối là nỗi lo “tốn ít nhất 20 phút mỗi buổi trưa”.",
        hint2_vi:
          "Thông tin về canxi hay tấm lợp sinh thái tuy đúng nhưng có giải đáp được câu hỏi “mất bao nhiêu phút buổi trưa” không?",
        hint3_vi:
          "Số liệu đo thực tế trong 5 ngày (chỉ mất trung bình 4 phút khi mỗi bạn tự ép phẳng hộp của mình) trả lời trực diện vào mối lo thời gian của Quân.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Phản biện trực diện nghĩa là lý do đối phương nêu ở điểm nào (thời gian làm mất 20 phút), bằng chứng phản hồi phải giải quyết đúng điểm đó (đo thực tế 5 ngày chỉ mất trung bình 4 phút).",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Trong buổi thảo luận gia đình về việc trồng rau mầm trên ban công, anh trai nói: “Ban công nhà mình hướng Bắc nên thiếu sáng hoàn toàn, trồng loại cây gì cũng không lên nổi đâu!” Trong 4 cách phản hồi sau, cách nào dùng quan sát kiểm chứng được để phản biện thuyết phục nhất?",
        question_en:
          "Discussing growing sprouts on the balcony, the older brother says: 'Our north-facing balcony gets zero light, so nothing can grow there!' Which reply uses verifiable observation for the strongest rebuttal?",
        choices: [
          {
            id: "a",
            label_vi:
              "“Anh chẳng chịu tìm hiểu gì về trồng cây cả, lúc nào cũng chỉ bàn lùi làm mất tinh thần, trong khi em đã đọc bao nhiêu bài hướng dẫn trồng rau mầm trên ban công rồi mà anh vẫn không chịu nghe em giải thích lấy một câu nào hết!”",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "“Rau mầm trộn dầu giấm ăn kèm bữa tối rất giòn và mát, nên cả nhà cứ trồng thử một khay nhỏ cho vui, còn chuyện ánh sáng trên ban công thì để mùa sau tính tiếp cũng được.”",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "“Em rất thích màu xanh của khay rau mầm nên chắc chắn cây sẽ tự mọc tốt trên ban công. Cứ nhìn thấy mầm xanh nhú lên mỗi sáng là em tin rằng cây nào cũng muốn lớn nhanh trong khay của mình.”",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "“Em đã ghi chép 3 ngày cuối tuần: ban công nhà mình vẫn có ánh sáng tán xạ tự nhiên từ 7 giờ sáng đến 4 giờ chiều, mà hướng dẫn kỹ thuật ghi rõ rau mầm củ cải chỉ cần ánh sáng nhẹ tán xạ, không ưa nắng gắt.”",
            correct: true,
          },
        ],
        hint1_vi:
          "Anh trai nêu hai ý: ban công “thiếu sáng hoàn toàn” và vì thế “cây gì cũng không lên nổi”.",
        hint2_vi:
          "Món ăn ngon hay sở thích cá nhân không chứng minh được điều kiện ánh sáng trên ban công.",
        hint3_vi:
          "Kết hợp quan sát thực tế tại ban công (ánh sáng tán xạ từ 7 giờ đến 16 giờ) với đặc điểm sinh học của rau mầm giúp bác bỏ chính xác nỗi lo của anh.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Bằng chứng kép gồm quan sát thực tế tại chỗ (khung giờ có ánh sáng tự nhiên trên ban công) và thông tin kỹ thuật trồng rau mầm đã giải quyết trọn vẹn và lịch sự lý do mà anh trai đưa ra.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi chuẩn bị thuyết trình dự án Khoa học, một bạn trong nhóm nhận xét: “Biểu đồ cột của nhóm mình nhìn rối mắt vì có quá nhiều màu sắc khác nhau.” Trước khi phản biện lại hoặc sửa biểu đồ, bước hành động nào thể hiện tinh thần phản biện dựa trên bằng chứng?",
        question_en:
          "Preparing a Science presentation, a teammate remarks: 'Our bar chart looks cluttered because it uses too many colors.' What step best demonstrates evidence-based critical thinking?",
        choices: [
          {
            id: "a",
            label_vi:
              "Đếm lại số màu thực tế đang dùng trên biểu đồ và mời thử 3–4 bạn tổ khác nhìn trong 10 giây xem các bạn có đọc ngay được số liệu chính hay bị rối mắt thật.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Tự ái cất biểu đồ đi và tuyên bố không làm chung phần thuyết trình nữa. Cho rằng bạn góp ý chưa từng ngồi tô màu nên không có quyền nhận xét về công sức của mình.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Bác bỏ ngay lời góp ý vì em đã mất cả buổi tối hôm qua để tô màu từng cột, và cho rằng bạn góp ý phải tự làm lại toàn bộ biểu đồ thì mới được phép nhận xét.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chê lại nét chữ viết bảng của bạn góp ý để bạn không còn để ý tới biểu đồ nữa, nhờ vậy cả nhóm sẽ giữ nguyên biểu đồ như cũ mà không phải sửa gì.",
            correct: false,
          },
        ],
        hint1_vi:
          "Công sức tô màu buổi tối hay nét chữ của bạn có cho biết người xem có dễ đọc biểu đồ hay không?",
        hint2_vi:
          "Làm thế nào để kiểm tra khách quan xem một biểu đồ là dễ đọc hay rối mắt với người xem lần đầu?",
        hint3_vi:
          "Kiểm tra số lượng màu thực tế và thử nghiệm nhanh mức độ dễ đọc với vài người xem độc lập sẽ cung cấp bằng chứng khách quan cho cả nhóm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Thay vì phản ứng tự ái hay đánh lạc hướng sang chuyện nét chữ, việc kiểm tra số màu và thử nghiệm khả năng đọc hiểu thực tế với vài bạn tổ khác giúp nhóm có dữ liệu khách quan để giữ hoặc tinh chỉnh biểu đồ.",
    },
  ],
};
