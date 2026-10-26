# BÁO CÁO ĐÓNG KÍN AN TOÀN XÁC THỰC VÀ QUẢN TRỊ RỦI RO (GATE 03)
## GATE 03 SECURITY CLOSURE & TRUST AUDIT

**Dự án:** TAI LEARNING OS  
**Mục tiêu kiểm định:** Đóng kín các lỗ hổng xác thực, chống tấn công brute-force bền vững, phân tách đặc quyền phụ huynh - trẻ em, bảo vệ dữ liệu học tập.

---

### 1. NÂNG CẤP MẬT MÃ BĂM MẬT KHẨU (PBKDF2-SHA256 600.000 VÒNG)

- **Chuẩn mật mã:** PBKDF2-SHA256 với 600.000 vòng lặp, muối ngẫu nhiên (salt) 16 bytes tạo từ CSPRNG `crypto.getRandomValues`.
- **Độ phức tạp mật khẩu:** Tối thiểu 12 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số.
- **Nâng cấp trong suốt (`needsRehash`):**
  - Khi phụ huynh đăng nhập thành công với mật khẩu có định dạng băm 100.000 vòng cũ (`pbkdf2_sha256$100000$...`), hàm `needsRehash` nhận diện và tự động băm lại mật khẩu ở mức 600.000 vòng lặp, cập nhật trực tiếp vào bảng `parents` trong cùng giao dịch phiên đăng nhập.
  - Phụ huynh không bị ngắt quãng phiên hay yêu cầu đổi mật khẩu thủ công.
  - Được kiểm chứng tự động qua integration test `transparently upgrades a 100,000-iteration PBKDF2 hash on login`.

---

### 2. CƠ CHẾ BÓP NGHẸT ĐĂNG NHẬP THẤT BẠI BỀN VỮNG (D1 AUTH THROTTLES)

- **Vấn đề đã triệt tiêu:** Rate Limiting trong bộ nhớ hoặc dựa trên header có thể bị qua mặt nếu kẻ tấn công xoay tua `User-Agent`, gửi giả mạo `X-Forwarded-For`, hoặc khi Worker Cloudflare bị khởi động lại.
- **Giải pháp triển khai:**
  - Bảng D1 `auth_throttles`: Lưu trữ số lần thử sai (`failure_count`), thời điểm bắt đầu cửa sổ (`first_failed_at`), thời điểm thử sai gần nhất (`last_failed_at`), và thời điểm hết hạn khoá (`locked_until`).
  - Phạm vi kép (Dual-Scope Throttling):
    1. **Theo địa chỉ IP (`auth:<hash32(ip)>`):** Khóa tạm IP sau 5 lần thử sai liên tiếp trong vòng 10 phút.
    2. **Theo tài khoản (`account:<normalized_name>` và `account:id:<parent_id>`):** Khóa tạm tài khoản phụ huynh sau 5 lần thử sai bất kể xuất phát từ IP nào.
  - Thời gian khoá: 15 phút (900 giây). Mọi yêu cầu đăng nhập trong thời gian khoá nhận mã lỗi `429 Too Many Requests` kèm tiêu đề `Retry-After: 900`.
  - Phục hồi an toàn: Thành công xóa bỏ bản ghi throttle tương ứng.
  - Khôi phục khẩn cấp qua CLI: Cung cấp kịch bản `scripts/unlock-parent.mjs` (`npm run unlock:parent`) chạy trực tiếp trên máy chủ cục bộ để mở khóa khi phụ huynh tự khóa nhầm tài khoản của mình.

---

### 3. BẢO VỆ PHÂN TÁCH ĐẶC QUYỀN SERVER-SIDE (PARENT VS LEARNER)

- **Cơ chế phân quyền:**
  - Phiên làm việc mang thuộc tính `mode: "parent"` hoặc `mode: "learner"`.
  - Mọi route quản trị phụ huynh (`/api/parent/*`) và xuất/xoá dữ liệu (`/api/data/*`) được bảo vệ bằng middleware `parentRoute`.
  - Khi phiên đang ở chế độ `learner`, máy chủ từ chối phục vụ ngay lập tức với mã lỗi `403 Forbidden`.
  - Để chuyển lại sang chế độ `parent`, phụ huynh bắt buộc phải nhập lại mật khẩu hợp lệ qua route `POST /api/session/mode`.

---

### 4. BẢO VỆ XUẤT NHẬP VÀ PHỤC HỒI DỮ LIỆU ĐỘC LẬP

- Cấu trúc `tai-learning-os-export@v1` bao quát toàn bộ 21 bảng dữ liệu D1.
- Mọi dữ liệu nhạy cảm được cô lập trong môi trường máy trạm cục bộ, không gửi ra ngoài Internet.
