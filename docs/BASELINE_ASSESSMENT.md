# HỆ THỐNG ĐÁNH GIÁ CHẨN ĐOÁN ĐẦU VÀO
## BASELINE ASSESSMENT ARCHITECTURE

**Dự án:** TAI LEARNING OS  
**Mục tiêu:** Đánh giá đầu vào có phụ huynh giám sát, phân tích trung thực năng lực hiện tại để định hướng lộ trình học tập.

---

### 1. TRIẾT LÝ ĐÁNH GIÁ TRUNG THỰC (HONEST DIAGNOSTICS)

Hệ thống đánh giá đầu vào không đưa ra điểm số phán xét hay xếp loại vô căn cứ. Thay vào đó, mỗi bản đánh giá đầu vào (`baseline_assessments`) phân tách bạch rõ 4 khía cạnh:
1. **Những gì đã quan sát được (`observedSummaryVi`):** Mô tả chính xác số bước, số câu trả lời độc lập và số lần dùng gợi ý thực tế.
2. **Các kỹ năng có bằng chứng vững chắc (`supportedSkillIds`):** Các kỹ năng mà người học đã giải quyết độc lập ngay lần đầu.
3. **Các kỹ năng cần quan sát thêm (`needsObservationSkillIds`):** Các kỹ năng chưa có lượt làm bài hoặc mới chỉ dừng ở mức có gợi ý hỗ trợ.
4. **Bài học đề xuất bắt đầu (`suggestedLessonIds`):** Danh sách bài học cụ thể phù hợp nhất để lấp lỗ hổng kiến thức.

---

### 2. BỘ BÀI TẬP CHẨN ĐOÁN 5 MÔN LỚP 4

- **Toán học (`math-baseline-grade4`):** Kiểm tra diện tích hình chữ nhật, nhận diện phân số và cộng hai phân số cùng mẫu số.
- **Tiếng Việt (`vie-baseline-grade4`):** Kiểm tra đọc hiểu chi tiết văn bản, tìm ý chính và cấu trúc câu chủ ngữ - vị ngữ.
- **Tiếng Anh (`eng-baseline-grade4`):** Kiểm tra từ vựng đồ vật quen thuộc, mẫu câu giao tiếp chào hỏi và cấu trúc câu đơn cơ bản.
- **Khoa học (`sci-baseline-grade4`):** Kiểm tra khả năng quan sát ba thể của nước, sự bay hơi - ngưng tụ và nhu cầu sống cơ bản của thực vật.
- **Tư duy phản biện (`deb-baseline-grade4`):** Kiểm tra khả năng nhận diện ý kiến đề xuất (luận điểm), chọn lý lẽ hỗ trợ phù hợp và phân biệt sự thật với cảm nhận cá nhân.

---

### 3. QUY TRÌNH THỰC HIỆN CỦA PHỤ HUYNH

1. Phụ huynh truy cập `/parent/baseline` trong khu vực quản trị.
2. Chọn môn học cần tổng hợp hoặc cho bé làm bài chẩn đoán đầu vào dưới sự quan sát trực tiếp.
3. Nhấn nút **Tổng hợp đánh giá đầu vào** để máy chủ phân tích toàn bộ bằng chứng thực tế trong cơ sở dữ liệu D1.
4. Phụ huynh xem xét báo cáo, duyệt các bài học đề xuất trước khi chuyển sang lập kế hoạch học tập 4 tuần.
