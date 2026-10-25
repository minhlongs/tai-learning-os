# MA TRẬN BẢO MẬT VÀ PHÂN QUYỀN HỆ ĐIỀU HÀNH HỌC TẬP TÀI (GATE 02)
## GATE 02 SECURITY MATRIX — TAI LEARNING OS

**Ngày lập:** 25/10/2026  
**Phiên bản:** Gate 02 — Hardened Security Posture  

---

### 1. MA TRẬN KIỂM SOÁT TRUY CẬP CÁC TUYẾN API (API ROUTE ACCESS MATRIX)

Toàn bộ các đường dẫn API đều được xử lý tập trung qua `dispatch` trong `src/worker/http/middleware.ts`. Mọi đường dẫn không khai báo tường minh trong bảng định tuyến đều trả về `404 Not Found`.

| Đường dẫn (Path) | Phương thức | Phân loại | Yêu cầu Cookie Phiên (`tlo_session`) | Yêu cầu CSRF (`x-tlo-csrf`) | Kiểm tra Header `Origin` | Giới hạn tốc độ (Rate Limiter) | Phạm vi sở hữu dữ liệu (Owner Scope) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `/api/session` | `GET` | Public | Tùy chọn | Không | Không | `API_RATE_LIMITER` (120/60s) | Xác minh `parent_id` tồn tại trong DB |
| `/api/session/login` | `POST` | Public | Không | Không | Không | `AUTH_RATE_LIMITER` (5/60s) | Không tiết lộ lỗi sai tên hay sai mật khẩu |
| `/api/session/logout` | `POST` | Public | Không | Không | Không | `API_RATE_LIMITER` (120/60s) | Xóa cookie ngay lập tức (`Max-Age=0`) |
| `/api/session/bootstrap` | `POST` | Public | Không | Không | Không | `AUTH_RATE_LIMITER` (5/60s) | Khóa vĩnh viễn (`403`) khi đã có 1 phụ huynh |
| `/api/learner/home` | `GET` | Protected | **Bắt buộc** | Không | Không | `API_RATE_LIMITER` (120/60s) | Ràng buộc `learners.parent_id = session.parentId` |
| `/api/learner/subjects` | `GET` | Protected | **Bắt buộc** | Không | Không | `API_RATE_LIMITER` (120/60s) | Chỉ hiển thị bài học có trạng thái `approved` |
| `/api/learner/sessions` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Từ chối (`403`) nếu bài học chưa được phê duyệt |
| `/api/learner/hints` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Ghi nhật ký `hint.requested` gắn với `learnerId` |
| `/api/learner/attempts` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Xác minh `session.learner_id` thuộc phụ huynh |
| `/api/learner/sessions/finalize` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Xác minh chủ sở hữu phiên học |
| `/api/parent/dashboard` | `GET` | Protected | **Bắt buộc** | Không | Không | `API_RATE_LIMITER` (120/60s) | Chỉ đọc dữ liệu của người học thuộc phụ huynh |
| `/api/parent/lessons` | `GET` | Protected | **Bắt buộc** | Không | Không | `API_RATE_LIMITER` (120/60s) | Toàn bộ danh mục bài học và trạng thái duyệt |
| `/api/parent/lessons/:id` | `GET` | Protected | **Bắt buộc** | Không | Không | `API_RATE_LIMITER` (120/60s) | Dành riêng cho phụ huynh kiểm tra nội dung & đáp án |
| `/api/parent/lessons/approval` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Ghi nhận `decided_by = parentId` và audit log |
| `/api/parent/lessons/content` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Tự động chuyển trạng thái duyệt về `draft` |
| `/api/parent/skills/correct` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Bắt buộc ghi chú lý do (`note`) và lưu audit |
| `/api/parent/learners` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Gắn `parent_id` từ phiên đăng nhập |
| `/api/parent/learners/profile` | `PATCH` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Ràng buộc `WHERE id = ? AND parent_id = ?` |
| `/api/data/export` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Chỉ xuất dữ liệu của người học thuộc phụ huynh |
| `/api/data/import` | `POST` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Từ chối (`409`) nếu đã có hồ sơ người học |
| `/api/data/learner` | `DELETE` | Protected | **Bắt buộc** | **Bắt buộc** | **Bắt buộc** | `API_RATE_LIMITER` (120/60s) | Yêu cầu chuỗi xác nhận chính xác `XOA <nickname>` |

---

### 2. KIẾN TRÚC MẬT MÃ VÀ BẢO VỆ PHIÊN (CRYPTOGRAPHY & SESSION POSTURE)

1. **Băm mật khẩu (Password Hashing):**
   - Thuật toán: `PBKDF2-SHA256` thông qua Web Crypto API (`crypto.subtle`).
   - Số vòng lặp: `60,000` iterations.
   - Salt: Ngẫu nhiên 16 bytes (`crypto.getRandomValues`) cho mỗi lần băm.
   - Chống tấn công thời gian (Timing Attack): So sánh chuỗi băm bằng hàm hằng thời gian `timingSafeEqual` (XOR từng byte).
   - Tự động nâng cấp: Hàm `needsRehash` tự động phát hiện cấu hình cũ và cập nhật lại mã băm mới ngay khi đăng nhập thành công.

2. **Quản lý phiên không trạng thái (Stateless Session Token):**
   - Định dạng: `<payload_base64url>.<hmac_sha256_signature_base64url>`.
   - Thời hạn (TTL): 8 giờ (`28,800,000` ms).
   - Thuộc tính Cookie: `HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` (kèm cờ `Secure` tự động khi chạy trên giao thức `https:`).

3. **Chống giả mạo yêu cầu liên trang (CSRF & Origin Defense):**
   - Mã CSRF được dẫn xuất mật mã học bằng `HMAC-SHA256(secret, "csrf:" + tokenId)`, ràng buộc chặt chẽ với phiên đăng nhập hiện hành.
   - Mọi yêu cầu thay đổi dữ liệu (`POST`, `PUT`, `PATCH`, `DELETE`) bắt buộc phải đính kèm header `x-tlo-csrf` hợp lệ và có header `Origin` khớp với `Host` của máy chủ.

---

### 3. BẢO VỆ DỮ LIỆU TRẺ EM THEO NGUYÊN TẮC VẮNG MẶT (CHILD PRIVACY BY ABSENCE)

Tuân thủ Luật Bảo vệ dữ liệu cá nhân Việt Nam (Luật số 91/2025/QH15) và Nghị định 356/2025/NĐ-CP:
- Hệ thống **tuyệt đối không thu thập, không lưu trữ** họ tên khai sinh đầy đủ, ngày tháng năm sinh đầy đủ, tên trường học, địa chỉ nhà, số điện thoại, email hay hình ảnh cá nhân của trẻ.
- Hồ sơ học sinh chỉ lưu trữ biệt danh (`nickname`: "Tài"), năm sinh (`birth_year`: 2016), khối lớp (`grade`: 4) và múi giờ (`timezone`: "Asia/Ho_Chi_Minh").
- Khóa phân loại Rate Limiting (`clientKey`) không lưu địa chỉ IP của hộ gia đình mà chỉ sử dụng hàm băm FNV-1a 32-bit trên chiều dài và chuỗi `user-agent` + `accept-language`.
