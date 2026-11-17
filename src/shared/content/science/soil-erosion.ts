/**
 * Khoa học · Thành phần của đất, xói mòn đất và vai trò giữ đất của rừng (skill: sci-soil-erosion, lớp 5)
 *
 * Authored for TAI Learning OS. Original content aligned with GDPT 2018 Khoa học Lớp 5.
 */
import type { LessonDefinition } from "../types";

export const soilErosion: LessonDefinition = {
  id: "sci-soil-erosion",
  subjectId: "science",
  skillId: "sci-soil-erosion",
  titleVi: "Thành phần của đất và phòng chống xói mòn đất",
  titleEn: "Soil Composition and Preventing Soil Erosion",
  objectiveVi:
    "Em nêu được các thành phần chính của đất trồng, giải thích nguyên nhân gây xói mòn sạt lở đất và vai trò giữ đất của rừng đầu nguồn, ruộng bậc thang.",
  objectiveEn:
    "Identify the main components of topsoil, explain causes of soil erosion, and describe how watershed forests and terraced fields protect soil.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-sci-soil-erosion",
  provenance: "original_supplemental",
  sourceRef:
    "Biên soạn riêng cho TAI Learning OS bám sát yêu cầu cần đạt GDPT 2018 Khoa học Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách quan sát màu sắc lớp đất mặt trong chậu cây xanh và cách rễ cây bám giữ đất khi tưới nước.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Đất trồng màu mỡ cho cây cối sinh trưởng gồm những thành phần chủ yếu nào dưới đây?",
        question_en:
          "Fertile soil that supports plant growth consists mainly of which components?",
        choices: [
          {
            id: "a",
            label_vi:
              "Chỉ gồm những hòn đá sỏi khô cứng nằm rời rạc, hoàn toàn không có nước, không khí hay sinh vật nào.",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Chỉ gồm nước mưa đọng lại trộn với cát trắng tinh khiết.",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Chỉ gồm lá khô nguyên vẹn chưa phân hủy nằm trên mặt gạch.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Chất khoáng, chất mùn, nước, không khí và các sinh vật nhỏ sống trong đất.",
            correct: true,
          },
        ],
        hint1_vi:
          "Rễ cây nằm dưới lòng đất vừa cần hút nước, muối khoáng vừa cần thở và lấy chất dinh dưỡng từ xác sinh vật phân hủy.",
        hint2_vi:
          "Lớp đất mặt thường sẫm màu nhờ chất mùn và tơi xốp nhờ giun đất cùng vi sinh vật.",
        hint3_vi:
          "Đất trồng gồm chất khoáng, chất mùn màu mỡ, nước, không khí nằm trong các khe hở và hệ sinh vật đất.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Đất trồng gồm các thành phần chính là chất khoáng, chất mùn (tạo độ màu mỡ từ xác động thực vật phân hủy), nước, không khí và các sinh vật sống trong đất như giun đất, vi sinh vật.",
    },
    {
      position: 2,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Thả nhẹ một cục đất vườn khô vào cốc nước trong suốt, ta thấy nhiều bọt nhỏ sủi lăn tăn từ cục đất nổi lên mặt nước. Hiện tượng đó chứng minh trong đất có thành phần gì?",
        question_en:
          "Dropping a lump of dry garden soil into clear water releases tiny rising bubbles. What component in the soil does this prove?",
        choices: [
          {
            id: "a",
            label_vi:
              "Trong các khe nhỏ giữa các hạt đất có chứa không khí.",
            correct: true,
          },
          {
            id: "b",
            label_vi:
              "Đất khô tự đun sôi cốc nước ở nhiệt độ phòng.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Chất mùn trong đất biến hoàn toàn thành thủy tinh lỏng.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Nước trong cốc tự đông cứng thành đá viên dưới đáy.",
            correct: false,
          },
        ],
        hint1_vi:
          "Khi nước len lỏi tràn vào những lỗ rỗng li ti bên trong cục đất khô, nước đã đẩy thứ gì thoát ra thành bọt?",
        hint2_vi:
          "Giống như khi nhấn miếng bọt biển khô xuống chậu nước cũng có bọt khí nổi lên.",
        hint3_vi:
          "Những bọt sủi lên chính là không khí nằm sẵn trong các khe hở của đất bị nước chiếm chỗ đẩy ra ngoài.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Giữa các hạt đất tơi xốp luôn có những khe hở chứa không khí giúp rễ cây và giun đất hô hấp. Khi thả đất vào nước, nước tràn vào khe hở đẩy không khí thoát ra thành bọt.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "reading_comprehension",
        passageTitle_vi: "Thí nghiệm hai khay đất đặt nghiêng",
        passage_vi:
          "Nhóm học sinh chuẩn bị hai khay đất giống hệt nhau đặt nghiêng cùng một độ dốc như sườn đồi. Khay thứ nhất để mặt đất trống trơn không có cây. Khay thứ hai được phủ kín lớp cỏ xanh có bộ rễ đan dày dưới đất. Khi dùng bình vòi sen tưới cùng một lượng nước mạnh mô phỏng cơn mưa lớn lên cả hai khay, nước chảy ra từ khay đất trống đục ngầu và cuốn trôi nhiều lớp đất mùn xuống chậu hứng. Trong khi đó, thảm cỏ và bộ rễ chằng chịt đã cản bớt sức nước mưa và giữ chặt các hạt đất nên nước chảy ra trong hơn rất nhiều.",
        question_vi:
          "Theo thí nghiệm trên, vì sao khay đất có trồng cỏ bị rửa trôi ít đất hơn hẳn so với khay đất trống?",
        choices: [
          {
            id: "a",
            label_vi:
              "Vì khay trồng cỏ được đặt nằm ngang bằng phẳng chứ không nghiêng cùng một độ dốc như khay đất trống.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Vì khay trồng cỏ không được tưới giọt nước nào từ bình vòi sen.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì thảm cỏ che chắn sức đập của nước mưa và bộ rễ giữ chặt các hạt đất lại.",
            correct: true,
          },
          {
            id: "d",
            label_vi:
              "Vì lá cỏ tự biến nước mưa thành đá sỏi nặng nằm trên mặt khay.",
            correct: false,
          },
        ],
        evidenceSentence_vi:
          "Trong khi đó, thảm cỏ và bộ rễ chằng chịt đã cản bớt sức nước mưa và giữ chặt các hạt đất nên nước chảy ra trong hơn rất nhiều.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Thảm thực vật đóng vai trò như chiếc ô giảm lực xối của mưa lớn, còn hệ rễ chằng chịt giữ chặt lớp đất mặt không bị dòng nước cuốn trôi.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Ở các sườn đồi núi dốc, nguyên nhân kết hợp nào dưới đây dễ dẫn đến xói mòn đất, lũ quét và sạt lở đất nghiêm trọng nhất?",
        question_en:
          "On steep hillsides, which combination of factors most severely triggers soil erosion, flash floods, and landslides?",
        choices: [
          {
            id: "a",
            label_vi:
              "Trồng rừng phòng hộ nhiều tầng tán xen kẽ cây bụi và thảm cỏ phủ kín mặt đất dưới tán rừng.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Mưa lớn kéo dài trên sườn dốc trọc đã bị chặt phá mất rừng đầu nguồn che phủ.",
            correct: true,
          },
          {
            id: "c",
            label_vi:
              "Bón phân hữu cơ hoai mục và phủ rơm rạ giữ ẩm cho gốc cây ăn quả.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Gió nhẹ mùa thu thổi qua những cánh rừng nguyên sinh rậm rạp.",
            correct: false,
          },
        ],
        hint1_vi:
          "Nước mưa chảy trên sườn đồi dốc sẽ lao xuống rất nhanh nếu không có vật cản.",
        hint2_vi:
          "Khi rừng đầu nguồn bị chặt phá trơ trọi, đất đồi mất cả tán lá che mưa lẫn mạng lưới rễ cây neo giữ.",
        hint3_vi:
          "Mưa lớn trút xuống đồi trọc dốc đứng sẽ cuốn phăng lớp đất mùn màu mỡ, gây xói mòn và sạt lở nguy hiểm.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Độ dốc lớn, mưa lũ tập trung cùng việc mất rừng che phủ khiến nước mưa không kịp thấm xuống đất mà chảy tràn dữ dội, cuốn trôi tầng đất mặt và gây sạt lở.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Vì sao người dân vùng núi cao Việt Nam thường làm ruộng bậc thang men theo sườn đồi kết hợp giữ rừng trên đỉnh núi thay vì cày xới thẳng từ đỉnh dốc xuống chân đồi?",
        question_en:
          "Why do highland farmers in Vietnam build terraced fields along slopes while preserving summit forests instead of plowing straight up and down?",
        choices: [
          {
            id: "a",
            label_vi:
              "Để nước mưa lao thẳng từ đỉnh núi xuống đáy thung lũng nhanh gấp mười lần.",
            correct: false,
          },
          {
            id: "b",
            label_vi:
              "Để gió cuốn bay hết lớp mùn đen chỉ chừa lại sỏi đá khô cằn.",
            correct: false,
          },
          {
            id: "c",
            label_vi:
              "Vì cây lúa không cần nước và chất mùn khi mọc ở vùng núi.",
            correct: false,
          },
          {
            id: "d",
            label_vi:
              "Rừng đỉnh núi giữ nước ngầm, ruộng bậc thang có bờ bao giảm tốc dòng chảy và giữ đất mùn.",
            correct: true,
          },
        ],
        hint1_vi:
          "Nếu cày rãnh thẳng từ đỉnh dốc xuống chân đồi, mỗi khi mưa to rãnh cày sẽ biến thành máng trượt cuốn đất đi mất.",
        hint2_vi:
          "Ruộng bậc thang chia sườn dốc thành từng mặt phẳng ngang có đắp bờ nhỏ giữ nước.",
        hint3_vi:
          "Kết hợp rừng đầu nguồn giữ nước phía trên với các bậc ruộng phẳng phía dưới giúp hãm dòng chảy mặt, chống xói mòn và giữ lại chất mùn nuôi lúa.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Rừng đầu nguồn trên cao giúp thấm và điều tiết nước mưa, còn hệ thống ruộng bậc thang chia sườn dốc thành các bậc phẳng có bờ giữ nước, ngăn dòng chảy xiết cuốn trôi lớp đất màu mỡ.",
    },
  ],
};
