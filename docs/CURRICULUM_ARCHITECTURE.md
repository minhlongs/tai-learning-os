# KIẾN TRÚC CHƯƠNG TRÌNH HỌC VÀ BẢO TOÀN NĂNG LỰC
## CURRICULUM ARCHITECTURE & COMPETENCY INTEGRITY

**Dự án:** TAI LEARNING OS  
**Tài liệu:** Thiết kế kiến trúc chương trình GDPT 2018, bảo toàn phiên bản nội dung và suy diễn năng lực học tập.

---

### 1. NGUYÊN TẮC CỐT LÕI

1. **Chuẩn GDPT 2018 làm gốc:** Mọi mục tiêu bài học đều ánh xạ trực tiếp đến các yêu cầu cần đạt (YCCĐ) của Chương trình Giáo dục Phổ thông 2018 đối với khối lớp 4.
2. **Minh bạch xuất xứ (Provenance Transparency):** Mỗi bài học, mục tiêu và bước học tập đều mang nhãn xuất xứ rõ ràng:
   - `gdpt_2018_objective`: Mục tiêu chuẩn quốc gia GDPT 2018.
   - `parent_textbook`: Nội dung theo bộ sách giáo khoa phụ huynh lựa chọn (Kết nối tri thức, Cánh Diều, Chân trời sáng tạo,...).
   - `original_supplemental`: Nội dung bổ trợ trực quan nguyên bản.
   - `unverified_assumption`: Giả định chưa được phụ huynh xác thực.
3. **Bảo toàn bằng chứng lịch sử (Immutability of Evidence):** Khi nội dung bài học được chỉnh sửa, hệ thống tăng `version` của bài học và `step_version` của từng bước. Không bao giờ xóa hoặc làm sai lệch các lượt làm bài trong quá khứ (`learning_attempts`).

---

### 2. CƠ SỞ DỮ LIỆU CHƯƠNG TRÌNH (D1 SCHEMA)

Hệ thống triển khai 4 bảng chuyên biệt quản lý chương trình:
- `curriculum_objectives`: Danh mục mục tiêu học tập chuẩn quốc gia GDPT 2018 theo môn học, lớp, mã định danh, mô tả tiếng Việt và điều kiện tiên quyết.
- `skill_prerequisites`: Quan hệ tiên quyết giữa các kỹ năng (`skill_id` phụ thuộc `prerequisite_id`).
- `curriculum_intakes`: Hồ sơ cấu hình chương trình học của phụ huynh theo từng năm học và môn học.
- `lesson_metadata`: Siêu dữ liệu bài học bao gồm thời lượng dự kiến, xuất xứ, khuyến nghị ôn tập, liên kết mục tiêu YCCĐ và cờ đánh dấu bài chẩn đoán đầu vào (`is_baseline`).

---

### 3. THANG NĂNG LỰC 5 BẬC VÀ CƠ CHẾ ÔN TẬP CÁCH QUÃNG

Động cơ suy diễn năng lực học sinh (`src/shared/engine/competency.ts`) vận hành theo thang 5 bậc:
1. `NOT_OBSERVED`: Chưa có quan sát thực tế nào.
2. `EMERGING`: Đã làm nhưng tỷ lệ đúng thấp hoặc chỉ hoàn thành với nhiều gợi ý.
3. `SUPPORTED`: Trả lời đúng nhưng cần trợ giúp (gợi ý cấp 1-4, hoặc làm lại sau lần sai đầu tiên).
4. `INDEPENDENT`: Làm đúng độc lập ngay từ lần thử đầu tiên, không dùng gợi ý, đạt đủ số lần tối thiểu.
5. `TRANSFERRED` / `RETAINED`:
   - `TRANSFERRED`: Vận dụng giải quyết thành công bài tập biến thể độc lập.
   - `RETAINED`: Vượt qua bài kiểm tra ôn tập cách quãng sau khoảng thời gian tiêu chuẩn `[1, 3, 7, 14]` ngày.
   - **Quy tắc bảo vệ:** Nếu học sinh thất bại trong một lần ôn tập định kỳ sau đó, hệ thống tự động giáng cấp về `INDEPENDENT` để đưa vào hàng đợi ôn tập lại.
   - **Tách biệt bài luyện tập gia đình (`purpose = 'practice'`):** Khi phụ huynh nhân bản bài học thư viện chuẩn TAI (`POST /api/parent/lessons/fork`), bản sao mang `ownership_type = 'family'` và `purpose = 'practice'` kèm liên kết phả hệ (`source_lesson_id`, `source_version`, `source_step_id`). Các phiên và lượt làm bài trên bài luyện tập gia đình luôn được server gán `purpose = 'practice'`, `evidence_kind = 'assisted'` và không bao giờ ghi đè `skill_evidence`, `review_schedule`, chẩn đoán đầu vào hay kế hoạch 4 tuần chính thức.
