# HƯỚNG DẪN DÀNH CHO PHỤ HUYNH VẬN HÀNH THỬ NGHIỆM
## PARENT PILOT & OPERATION GUIDE

**Dành cho:** Phụ huynh của bé Tài (Học sinh lớp 4)  
**Mục đích:** Hướng dẫn chi tiết từng bước vận hành hệ thống học tập cục bộ an toàn, khoa học và minh bạch.

---

### 1. NGUYÊN TẮC ĐỒNG HÀNH CÙNG CON

- 🌟 **Không áp lực điểm số:** Hệ thống ghi nhận trung thực quá trình con học. Việc con sử dụng gợi ý là điều hoàn toàn tự nhiên và được khuyến khích khi con gặp khó khăn.
- 🕒 **Phiên học ngắn gọn (15-20 phút):** Mỗi tuần chỉ cần 3 buổi học đều đặn để con hình thành thói quen tư duy tự giác.
- 🛡️ **An toàn tuyệt đối:** Hệ thống chạy hoàn toàn trên máy tính gia đình, không chia sẻ bất kỳ thông tin nào ra bên ngoài.

---

### 2. QUY TRÌNH 4 BƯỚC THIẾT LẬP VÀ VẬN HÀNH

#### Bước 1: Tiếp nhận chương trình học (`/parent/curriculum`)
- Đăng nhập tài khoản phụ huynh tại màn hình `/login`.
- Vào **Khu phụ huynh** → chọn **Chương trình học** trên thanh điều hướng.
- Cấu hình năm học (ví dụ `2026-2027`), chọn bộ sách giáo khoa của con trên lớp (Kết nối tri thức, Cánh Diều, Chân trời sáng tạo, hoặc giữ `UNKNOWN` khi chưa xác nhận), điền tên chủ đề/bài học con đang học trên lớp cho từng môn trong 5 môn đang mở (Toán học, Tiếng Việt, Tiếng Anh, Khoa học, Tư duy phản biện).
- Nhấn **Lưu thiết lập chương trình**.

#### Bước 2: Đánh giá đầu vào (`/parent/baseline`)
- Vào mục **Đánh giá đầu vào**.
- Cùng con thực hiện bài kiểm tra chẩn đoán các môn (Toán học, Tiếng Việt, Tiếng Anh, Khoa học, Tư duy phản biện) hoặc nhấn **Tổng hợp đánh giá đầu vào**.
- Đọc bảng tóm tắt kết quả: nhận biết những kỹ năng con đã vững và những phần con cần củng cố thêm.

#### Bước 3: Phê duyệt bài học (`/parent/lessons`)
- Vào mục **Quản lý bài học**.
- Xem danh sách bài học và nhấn **Duyệt bài học** cho những bài con sẽ học (phê duyệt được tách riêng cho từng bé và từng phiên bản bài học).
- *Lưu ý:* Con chỉ nhìn thấy và làm bài đối với những bài học đã được ba mẹ bấm duyệt cho đúng hồ sơ của con.

#### Bước 4: Tạo kế hoạch học tập 4 tuần (`/parent/planner`) & Đặt mục tiêu học tập (`/parent`)
- Vào mục **Kế hoạch 4 tuần**, nhấn nút **Tạo kế hoạch 4 tuần** để hệ thống tự động sắp xếp các buổi học phù hợp cho con.
- Ba mẹ có thể đổi ngày học, thêm ghi chú dặn dò con hoặc đánh dấu bỏ qua bài học khi cần.
- Tại **Bảng theo dõi** (`/parent`), ba mẹ có thể thêm **Mục tiêu phụ huynh đặt ra** (theo từng môn hoặc chung các môn, kèm ngày dự kiến và trạng thái *Đang theo đuổi / Tạm dừng / Đã đạt / Đã khép lại*) để đồng hành cùng con mà không tạo áp lực điểm số.

---

### 3. XỬ LÝ SỰ CỐ THƯỜNG GẶP

1. **Quên mật khẩu hoặc bị khóa do nhập sai nhiều lần:**
   - Hệ thống tự động khóa tạm 15 phút để bảo vệ tài khoản khi có 5 lần nhập sai liên tiếp.
   - Để mở khóa ngay lập tức, mở cửa sổ Terminal trên máy tính và chạy lệnh:
     ```bash
     npm run unlock:parent
     ```
2. **Sao lưu dữ liệu định kỳ:**
   - Để lưu giữ toàn bộ nhật ký học tập của con ra file an toàn:
     ```bash
     npm run export:learner -- ./backup-tai-2026.json
     ```
