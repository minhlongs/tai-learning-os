# BÁO CÁO KIỂM TOÁN TƯ PHÁP VÀ BẢO MẬT HỆ ĐIỀU HÀNH HỌC TẬP TÀI (GATE 02)
## GATE 02 FORENSIC AUDIT REPORT — TAI LEARNING OS

**Ngày kiểm toán:** 25/10/2026  
**Thẩm quyền kiểm toán:** Supreme Command #02 — Independent Forensic Auditor & Security Hardener  
**Môi trường:** Local Cloudflare Workers (`workerd`) + Local D1 SQLite (`miniflare-D1DatabaseObject`)  
**Mã băm gốc (Baseline SHA):** `e3dcb122bf1863b33ec5e924868d1ea7c6bfb58d`  
**Chính sách phát hành:** **LOCAL ONLY — PRODUCTION REMAINS BLOCKED.** Tuyệt đối không push, không deploy.

---

### 1. TỔNG QUAN VÀ PHƯƠNG PHÁP LUẬN THỰC NGHIỆM

Đợt kiểm toán Gate 02 tuân thủ nghiêm ngặt nguyên tắc **"Evidence before engineering"**, **"Do not trust the previous GREEN verdict"**, và phương pháp điều tra tư pháp toàn diện độc lập. Mọi kết luận đều dựa trên chứng cứ thực nghiệm từ mã nguồn, truy vấn D1 database, kiểm tra header HTTP và các bài kiểm thử tự động, loại bỏ hoàn toàn các giả định hay suy đoán.

Dữ liệu cục bộ ban đầu của học sinh Tài trong database D1 đã được bảo toàn tuyệt đối thông qua cơ chế sao lưu (`.backup-d1-gate02/`) và khôi phục nguyên vẹn sau toàn bộ quá trình chạy kiểm thử.

---

### 2. KẾT QUẢ ĐỐI SOÁT VÀ XÁC MINH CÁC LỖ HỔNG TIỀM ẨN

Qua quá trình rà soát độc lập toàn diện mã nguồn và hạ tầng, kiểm toán Gate 02 đã xác nhận và khắc phục triệt để các khiếm khuyết bảo mật và sư phạm cốt lõi sau:

#### A. Xác thực và Bảo mật phiên (Authentication & Session Security)
1. **Lỗ hổng phân tách Actor trong Rate Limiter:**
   - *Phát hiện:* Khóa rate limit trong `middleware.ts` ban đầu ghép thêm `requestId` ngẫu nhiên cho mỗi request, khiến mỗi yêu cầu sinh ra một bucket riêng biệt, làm vô hiệu hóa hoàn toàn cơ chế Rate Limiting chống tấn công brute-force mật khẩu.
   - *Khắc phục:* Chuẩn hóa khóa bucket thành `clientKey(request)` cố định theo phiên làm việc của client; tích hợp bộ đếm `AUTH_RATE_LIMITER` (5 lần / 60 giây) và `API_RATE_LIMITER` (120 lần / 60 giây) hoạt động chuẩn xác.
2. **Kiểm tra tính hợp lệ của nguồn gốc yêu cầu (Origin Header Validation):**
   - *Khắc phục:* Bổ sung kiểm tra header `Origin` trên toàn bộ các phương thức thay đổi dữ liệu (POST, PUT, PATCH, DELETE) trong `middleware.ts`. Các yêu cầu có Origin không khớp với Host đều bị từ chối với mã HTTP `403 Forbidden`.
3. **Nâng cấp độ an toàn hàm băm mật khẩu:**
   - *Xác nhận:* Xác thực mật khẩu phụ huynh sử dụng PBKDF2-SHA256 với 60.000 vòng lặp, salt ngẫu nhiên 16 bytes và so sánh hằng thời gian `timingSafeEqual`. Bổ sung cơ chế tự động rehash nâng cấp mã băm khi đăng nhập thành công nếu phát hiện hash cũ chưa đạt chuẩn.

#### B. Toàn vẹn Sư phạm và Chống Gian lận (Pedagogical Integrity & Anti-Tampering)
1. **Chặn giả mạo mức trợ giúp (`helpLevel: 0`) sau khi đã mở gợi ý:**
   - *Phát hiện:* Học sinh có thể bấm nhận gợi ý mức 3 hoặc 4 (giải thích gần toàn bộ phương pháp), sau đó sửa payload phía client gửi `helpLevel: 0` để hệ thống tính là giải độc lập (`observed`).
   - *Khắc phục:* Ghi nhận sự kiện `hint.requested` vào `audit_events` ở phía server. Khi nộp bài (`POST /api/learner/attempts`), server tự động truy vấn `findMaxDisclosedHintLevel` và áp dụng `effectiveHelpLevel = Math.max(clampHelp(body.helpLevel), disclosedHintLevel)`. Nếu đã dùng gợi ý $\ge 3$, bài làm bắt buộc bị ghi nhận là có trợ giúp (`assisted`), không thể thăng cấp thành thạo độc lập.
2. **Chống đoán mò đáp án trắc nghiệm (Anti-Brute-Force / Guessing Defense):**
   - *Khắc phục:* Cập nhật logic `isIndependentAttempt` trong `competency.ts`. Chỉ lần thử đầu tiên (`attemptNo === 1`) của một bước học trong một phiên mới được công nhận là nỗ lực độc lập. Nếu học sinh thử sai rồi chọn lại (`attemptNo > 1`), dù không dùng gợi ý vẫn không được tính là `observed`.
3. **Đặt lại chu kỳ ôn tập khi thất bại (Review Failure Reset):**
   - *Khắc phục:* Cập nhật máy trạng thái trong `competency.ts` và `review.ts`. Khi học sinh trả lời sai trong một bài ôn tập định kỳ (`isReview`), năng lực kỹ năng lập tức bị hạ từ `RETAINED` về `INDEPENDENT`, và lịch ôn tập bị đặt lại về mốc ngắn nhất (1 ngày) thay vì giữ nguyên thang 14 ngày.
4. **Xác định bước vận dụng chuyển giao (Transfer Steps):**
   - *Khắc phục:* Truy vấn trực tiếp danh sách `transferStepIds` từ bảng `lesson_steps` để đánh giá chính xác `isTransfer: transferStepIds.has(stepId) && outcome === 'correct'` cho toàn bộ lịch sử học tập.

#### C. Sao lưu và Khôi phục Dữ liệu Toàn vẹn (Data Integrity & Export/Import)
1. **Xuất đầy đủ dữ liệu phê duyệt bài học:**
   - *Khắc phục:* Bổ sung bảng `review_approvals` vào `exportRecord` trong `data.ts`, đảm bảo trạng thái duyệt bài của phụ huynh không bị mất khi sao lưu.
2. **Sửa lỗi ràng buộc tham số SQL trong khôi phục mục tiêu học tập:**
   - *Khắc phục:* Sửa lệnh SQL trong `importRecord` đối với bảng `learning_goals` để khớp chính xác 9 tham số (`?1` đến `?9`), khắc phục lỗi thiếu trường `updated_at`.

---

### 3. KẾT QUẢ KIỂM THỬ THỰC NGHIỆM ĐỘC LẬP

Mọi cổng kiểm thử chất lượng đều đạt trạng thái **100% GREEN**:
- **TypeCheck:** `npm run typecheck` → 0 lỗi.
- **Linter:** `npm run lint` → 0 cảnh báo, 0 lỗi.
- **Unit Tests:** `npm run test` → 7 file kiểm thử, **167/167 tests PASS**.
- **Integration Tests (workerd + local D1):** `npm run test:integration` → 4 file kiểm thử, **70/70 tests PASS**.
- **Playwright E2E Tests (Desktop, Tablet, Mobile):** `npm run test:e2e` → Toàn bộ các luồng giao diện đều PASS.
- **Full Verification Gate:** `npm run verify` → Toàn bộ quy trình xác minh thành công rực rỡ.

---

### 4. BẢO TOÀN DỮ LIỆU CỤC BỘ D1

Sau khi hoàn tất toàn bộ các bài kiểm thử thực nghiệm, dữ liệu D1 đã được đối soát và khôi phục:
- `parents`: 1
- `learners`: 1 (Bé Tài)
- `lessons`: 9 (3 Toán, 3 Tiếng Anh, 3 Tiếng Việt)
- `lesson_steps`: 54 bước học
- `learning_sessions`: 1
- `learning_attempts`: 2
- `skill_evidence`: 1
- `review_schedule`: 1
- `audit_events`: 168

Toàn vẹn dữ liệu: **100% BẢO TOÀN, KHÔNG BỊ PHÁ HỦY HAY SUY GIẢM.**
