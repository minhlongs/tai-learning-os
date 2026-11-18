/**
 * Tư duy phản biện · Đánh giá độ tin cậy của nguồn (skill: deb-source-credibility, lớp 5)
 *
 * Authored for TAI Learning OS. Original content for Grade 5 critical thinking,
 * aligned with the supplemental Grade 5 objective `TLO.DEB.5.SOURCE.02`.
 */
import type { LessonDefinition } from "../types";

export const sourceCredibility: LessonDefinition = {
  id: "deb-source-credibility",
  subjectId: "debate",
  skillId: "deb-source-credibility",
  titleVi: "Đánh giá độ tin cậy của nguồn",
  titleEn: "Evaluating Source Credibility",
  objectiveVi:
    "Em phân biệt được nguồn đáng tin với nguồn cần kiểm chứng dựa trên người cung cấp và bằng chứng đi kèm.",
  objectiveEn:
    "Distinguish trustworthy sources from ones that need checking, based on the provider and evidence.",
  gradeFrom: 5,
  gradeTo: 5,
  objectiveId: "obj-deb-credibility",
  provenance: "original_supplemental",
  sourceRef: "Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5",
  expectedDurationMinutes: 20,
  reviewRecommendationVi:
    "Ôn lại sau 3 ngày bằng cách chỉ ra một nguồn đáng tin và nêu vì sao.",
  isBaseline: false,
  steps: [
    {
      position: 1,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi:
          "Khi cần biết thông tin đúng hay không, em nên làm gì trước?",
        choices: [
          {
            id: "a",
            label_vi: "Xem rõ thông tin đó đến từ ai và có căn cứ xác thực không",
            correct: true,
          },
          {
            id: "b",
            label_vi: "Tin ngay nếu người kể nói thật nhanh và tỏ vẻ tự tin",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Tin ngay nếu thấy nhiều bạn giờ ra chơi lặp lại",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Tin ngay vì người kể có giọng nói thật lớn",
            correct: false,
          },
        ],
        hint1_vi: "Hãy nghĩ đến điều giúp em phân biệt tin thật với tin đồn.",
        hint2_vi: "Cần hỏi: ai nói, dựa vào đâu?",
        hint3_vi: "Hãy kiểm tra xuất xứ người cung cấp và bằng chứng đi kèm trước khi tin.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "a" }),
      explanationVi:
        "Em cần xem thông tin đến từ ai và có căn cứ gì; nói tự tin, nhiều người lặp lại hay nói to không chứng minh thông tin đúng.",
    },
    {
      position: 2,
      kind: "concept",
      content: {
        type: "multiple_choice",
        question_vi: "Nguồn tin nào đáng tin hơn khi kiểm chứng một thông tin?",
        choices: [
          {
            id: "a",
            label_vi: "Bình luận của một tài khoản lạ viết giọng rất khẳng định dưới video",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Lời đồn lan truyền trên mạng xã hội không ghi tên người đăng",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Tiêu đề giật gân không ghi ngày tháng",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Sách giáo khoa hoặc trang thông tin của bệnh viện",
            correct: true,
          },
        ],
        hint1_vi: "Nguồn đáng tin cho thấy người chịu trách nhiệm về nội dung.",
        hint2_vi: "Sách học và cổng thông tin của cơ sở y tế có người kiểm duyệt.",
        hint3_vi: "Tài liệu học tập chính thức và cơ quan chuyên môn luôn đáng tin hơn tin trôi nổi.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Sách giáo khoa và trang chính thức của bệnh viện có người biên soạn và kiểm duyệt nên đáng tin hơn tin đồn, bình luận vô danh hoặc tiêu đề giật gân.",
    },
    {
      position: 3,
      kind: "guided",
      content: {
        type: "multiple_choice",
        question_vi:
          "Một bài viết về sức khỏe không ghi tên người viết, không ghi ngày và không dẫn nguồn. Em nên đánh giá sao?",
        choices: [
          {
            id: "a",
            label_vi: "Khẳng định ngay trăm phần trăm mọi chi tiết trong bài đều bịa đặt",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Cần thận trọng, phải kiểm chứng thêm ở nguồn khác",
            correct: true,
          },
          {
            id: "c",
            label_vi: "Tin tưởng làm theo ngay vì bài viết trình bày dài và nhiều đoạn",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Chia sẻ ngay cho người thân vì câu chữ trong bài rất dễ đọc",
            correct: false,
          },
        ],
        hint1_vi:
          "Thiếu tác giả, ngày tháng và nguồn là dấu hiệu thiếu căn cứ.",
        hint2_vi: "Không nên vừa tin ngay vừa vội kết luận là giả.",
        hint3_vi: "Hãy giữ thái độ dè dặt và đối chiếu lại thông tin với các nguồn uy tín.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "b" }),
      explanationVi:
        "Bài viết thiếu tác giả, ngày tháng và dẫn nguồn thì thiếu căn cứ; em cần kiểm chứng thêm ở nguồn khác trước khi tin.",
    },
    {
      position: 4,
      kind: "independent",
      content: {
        type: "multiple_choice",
        question_vi:
          "Bạn nói: “Sắp có động đất vì tớ đọc trên trang cá nhân không rõ tác giả.” Em nên phản hồi thế nào?",
        choices: [
          {
            id: "a",
            label_vi: "Tin ngay lời bạn kể vì nét mặt bạn đang rất lo lắng nên chắc chắn tin đó phải có thật",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Loan báo vội cho khắp các dãy lớp để mọi người cùng chạy ra sân ngay",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Cười chê bạn trước lớp vì nhẹ dạ tin vào bài đăng trôi nổi",
            correct: false,
          },
          {
            id: "d",
            label_vi: "Cùng bạn tra cứu thông báo của cơ quan địa chất hoặc trung tâm báo tin động đất",
            correct: true,
          },
        ],
        hint1_vi: "Cần xử lý cùng nhau bằng kiểm chứng, không hoảng loạn.",
        hint2_vi:
          "Nên chọn cơ quan chuyên môn theo dõi địa chấn để xác minh.",
        hint3_vi: "Rủ bạn mở trang tin chính thống của cơ quan chuyên ngành để đối chiếu thực hư.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "d" }),
      explanationVi:
        "Cách đúng là cùng kiểm chứng ở nguồn chính thức như cơ quan địa chất hoặc trung tâm báo tin động đất, thay vì tin lời đồn, gây hoảng loạn hoặc chế giễu bạn.",
    },
    {
      position: 5,
      kind: "transfer",
      content: {
        type: "multiple_choice",
        question_vi:
          "Em thấy hai nguồn nói trái ngược về một sự kiện. Nguồn nào em nên dùng làm bằng chứng?",
        choices: [
          {
            id: "a",
            label_vi: "Nguồn thu hút nhiều lượt chia sẻ và bình luận hưởng ứng sôi nổi",
            correct: false,
          },
          {
            id: "b",
            label_vi: "Nguồn viết in hoa toàn bộ tiêu đề kèm nhiều dấu chấm than",
            correct: false,
          },
          {
            id: "c",
            label_vi: "Nguồn ghi rõ người chịu trách nhiệm, ngày cập nhật và dẫn được căn cứ",
            correct: true,
          },
          {
            id: "d",
            label_vi: "Nguồn chèn nhiều hình minh họa rực rỡ và bắt mắt nhất",
            correct: false,
          },
        ],
        hint1_vi: "Bằng chứng tốt là bằng chứng kiểm tra lại được.",
        hint2_vi: "Hãy tìm nơi công khai đơn vị biên soạn, thời gian đăng và tài liệu gốc.",
        hint3_vi: "Ưu tiên bản tin minh bạch về tác giả, thời điểm xuất bản và số liệu đối chiếu.",
      },
      answerKey: JSON.stringify({ correctChoiceId: "c" }),
      explanationVi:
        "Nguồn kiểm tra lại được với người chịu trách nhiệm, ngày cập nhật và căn cứ là bằng chứng tốt hơn; lượt chia sẻ, chữ hoa hay hình ảnh không chứng minh tính đúng.",
    },
  ],
};
