# TAI LEARNING OS — Cẩm Nang Vận Hành Dành Cho Phụ Huynh
## (Parent Operations Handbook)

> **Bilingual Guide / Hướng dẫn song ngữ**: Tài liệu hướng dẫn phụ huynh cách quản lý, phê duyệt bài học, theo dõi năng lực học tập và sao lưu dữ liệu cho con.

---

## 1. Bắt Đầu Sử Dụng (First-Run & Login)

### Khởi động hệ thống
Mỗi khi cho bé học, phụ huynh mở terminal trên máy tính và chạy:
```bash
npm run dev
```
Mở trình duyệt web tại địa chỉ: `http://localhost:8791`

### Đăng nhập phụ huynh
- Nhập thông tin đăng nhập đã cấu hình cục bộ (mặc định môi trường dev: Tên hiển thị `Phụ huynh`, mật khẩu: `MatKhauBiMat2026`).
- Phiên đăng nhập có thời hạn **8 tiếng**, tự động bảo vệ khi tắt trình duyệt.

---

## 2. Quản Trị Bài Học & Phê Duyệt Nội Dung (Lesson Approval)

Mặc định, khi bài học mới được đưa vào hệ thống, bài học ở trạng thái **Bản nháp (Draft)** hoặc **Chưa duyệt**. Bé Tài sẽ **không nhìn thấy** bài học này trong danh sách môn học cho đến khi phụ huynh duyệt.

### Các bước phê duyệt:
1. Đăng nhập vào hệ thống và nhấn vào menu **"Duyệt bài học"** (`/parent/lessons`).
2. Danh sách bài học theo từng môn (Toán, Tiếng Anh, Tiếng Việt) sẽ hiển thị chi tiết tên bài và mục tiêu học tập.
3. Nhấn nút **"Chưa duyệt"** để chuyển sang **"Đã duyệt"**.
4. Khi đã duyệt, bài học sẽ lập tức xuất hiện trên giao diện học tập của bé. Phụ huynh có thể thu hồi phê duyệt bất kỳ lúc nào nếu muốn điều chỉnh lộ trình học.

**Phạm vi của bản duyệt:** Phê duyệt gắn với **từng bé** và **từng phiên bản nội dung** của bài học:

- Duyệt bài cho bé thứ nhất **không** tự động duyệt cho bé thứ hai.
- Nếu bài học được chỉnh sửa nội dung (tạo phiên bản mới), bé sẽ không thấy bản mới cho đến khi phụ huynh duyệt lại.

**Khi thu hồi quyền đang có phiên đang học:** Phụ huynh thu hồi quyền thì phiên học mới bị chặn ngay lập tức. Nếu bé đang học dở một phiên hợp lệ đã bắt đầu trước khi thu hồi, phiên đó chỉ được tiếp tục tối đa **30 phút** kể từ lần thu hồi đầu tiên, sau đó mọi thao tác đều bị từ chối. Việc thu hồi rồi cấp lại không kéo dài thêm khoảng 30 phút này.

---

## 3. Theo Dõi Tiến Độ & Bằng Chứng Năng Lực (Mastery Dashboard)

Tại trang **"Bảng theo dõi"** (`/parent`):
- **Tổng quan ghi nhận**: Xem tổng số phiên học đã hoàn thành, số lần trả lời độc lập và tỷ lệ tự làm đúng mà không cần trợ giúp.
- **Chi tiết từng kỹ năng**:
  - `CHƯA QUAN SÁT (NOT_OBSERVED)`: Bé chưa làm bài tập về kỹ năng này.
  - `CẦN HỖ TRỢ (SUPPORTED)`: Bé trả lời đúng nhưng cần gợi ý mức 3-4 (đã xem hướng dẫn giải).
  - `ĐỘC LẬP (INDEPENDENT)`: Bé tự suy nghĩ và trả lời đúng không cần trợ giúp.
  - `GHI NHỚ TỐT (RETAINED)`: Bé hoàn thành xuất sắc các bài ôn tập cách quãng sau 3, 7, 14 ngày.
  - `VẬN DỤNG (TRANSFERRED)`: Bé giải quyết tốt các bài toán thực tế phức tạp.
- **Cảnh báo cần phụ huynh can thiệp (`needsParentAttention`)**: Nếu bé làm sai liên tiếp từ 3 lần trở lên ở một kỹ năng, hệ thống sẽ gắn cờ cảnh báo để phụ huynh ngồi cùng giải thích lại khái niệm cốt lõi cho con.

---

## 4. Quản Trị Dữ Liệu: Sao Lưu, Khôi Phục & Xóa (Data Management)

Tại trang **"Quản lý dữ liệu"** (`/parent/data`):

### 1. Sao lưu hồ sơ (Export)
- Nhấn nút **"Tải bản sao lưu (JSON)"** trên giao diện, hoặc chạy lệnh từ terminal:
  ```bash
  npm run export:learner -- ./backup-tai-$(date +%Y%m%d).json
  ```
- Toàn bộ lịch sử bài học, câu trả lời, tiến độ ôn tập và nhật ký kiểm toán sẽ được lưu trữ an toàn trong 1 tập tin JSON tiêu chuẩn (`tai-learning-os-export@v1`).

### 2. Khôi phục hồ sơ (Import)
- Dùng khi chuyển dữ liệu sang máy tính mới: Chọn tập tin sao lưu JSON và nhấn **"Khôi phục dữ liệu"**.
- Hệ thống sẽ xác thực toàn bộ tính toàn vẹn của dữ liệu trước khi nạp vào máy.

### 3. Xóa vĩnh viễn hồ sơ (Hard Delete)
- Nếu muốn xóa sạch toàn bộ lịch sử học tập của bé để bắt đầu lại:
  - Nhập chính xác chuỗi xác nhận: `XOA Tài`
  - Nhấn **"Xác nhận xóa vĩnh viễn"**.
  - Toàn bộ dữ liệu phiên học, câu trả lời và năng lực sẽ được dọn dẹp sạch sẽ khỏi máy.
