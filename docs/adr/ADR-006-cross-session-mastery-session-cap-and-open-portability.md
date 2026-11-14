# ADR-006 — Năng lực độc lập khác phiên (G6), giới hạn phiên học Dừng Mềm 25 phút (G9) và hồ sơ di sản mở 10 năm

**Trạng thái:** Đã chấp nhận (2026-11-15)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `src/shared/engine/competency.ts`, `src/shared/engine/recompute-learner-state.ts`, `src/shared/engine/session-budget.ts`, `src/shared/engine/review-simulation.ts`, `src/shared/content/qa-gate.ts`, `src/shared/engine/tco-model.ts`, `src/shared/portability/open-portability.ts`, `src/shared/portability/static-viewer.ts`, `src/worker/db/repositories.ts`, `src/worker/services/session-service.ts`, `src/worker/routes/learner.ts`, `src/worker/routes/portability.ts`, `src/client/screens/learner/LessonScreen.tsx`, `src/client/screens/parent/DataControlScreen.tsx`

---

## Bối cảnh

Sau đợt kiểm chứng G0–G16 đầu tiên (`ce1d87c57afff`), sáu cổng kỹ thuật trong Masterplan 2036 vẫn ở trạng thái **HOLD** (`G2, G6, G9, G10, G13, G15`), đồng thời hai yêu cầu kiến trúc 10 năm chưa có hiện thực kiểm chứng được: mô phỏng dòng ôn tập 3.650 ngày (`G7`) và gói xuất di sản chuẩn mở độc lập hoàn toàn với ứng dụng (`CLR 2.0 + CASE 1.1 + xAPI 2.0 + viewer.html`).

Ba nút thắt thiết kế cốt lõi cần giải quyết mà **không** phá vỡ bất biến hiện có và **không** thêm bảng SQL hay chạm vào cơ sở dữ liệu hộ gia đình đang chạy:

1. **Mâu thuẫn giữa G6 (Độc lập khác phiên + RETAINED trên bài 1-kỹ-năng) và Cổng A2 (Chống đoán mò liên phiên):**
   - Trước ADR này, `deriveCompetency` chỉ đếm `independentCount >= 2` mà không xét `sessionId`: học sinh làm đúng bước `independent` và bước `transfer` trong **cùng một buổi ngồi học** đã được nâng ngay lên `INDEPENDENT` (thậm chí `TRANSFERRED`), dù trí nhớ ngắn hạn vừa mới nhìn thấy ví dụ mẫu vài giây trước.
   - Ngược lại, Cổng A2 gắn `attempt_no` và sàn gợi ý theo **trọn đời từng `step_id`** để ngăn học sinh mở phiên mới đoán mò lại câu vừa sai. Hệ quả phụ trên các bài học ánh xạ 1–1 tới kỹ năng là khi đến ngày ôn tập định kỳ (`now >= due_at`), lần làm lại đầu tiên trên bước `independent` của bài đó nhận `attempt_no = 2` → bị ép thành `assisted` → trạng thái `RETAINED` **không bao giờ đạt được** nếu không có bài học thứ hai dùng chung kỹ năng.

2. **Giới hạn phiên học 25 phút cho Lớp 4–5 (G9) không gây ức chế giữa chừng:**
   - Ngắt cứng ngay giây thứ `25:00` khi học sinh đang gõ dở phép tính làm mất công sức hợp lệ và tạo phản ứng tâm lý tiêu cực; nhưng không có trần thời gian thì vi phạm nguyên tắc bảo vệ thị lực và nhịp độ chú ý tiểu học.
   - Ràng buộc bảo toàn dữ liệu hộ gia đình yêu cầu không tạo migration SQL mới chỉ để lưu cờ gia hạn phiên học.

3. **Khả năng đọc lại hồ sơ học tập sau 10 năm mà không cần máy chủ TAI Learning OS:**
   - Phong bì sao lưu nội bộ (`tai-learning-os-export@v1` / AES-256-GCM) phục vụ khôi phục nguyên trạng vào chính hệ thống này, nhưng nếu 10 năm sau gia đình chỉ còn một trình duyệt phổ thông ngoại tuyến và muốn đối chiếu chứng chỉ năng lực theo chuẩn quốc tế hoặc đọc bảng tiến độ bằng mắt thường, cần một gói xuất chuẩn mở tự chứa (zero-network).

---

## Quyết định

### 1. Khóa cứng `INDEPENDENT` khác phiên (`>= 2 sessionId`) và mở khóa lần thử đầu khi đến hạn ôn tập (`now >= due_at`)

- `COMPETENCY_CONFIG` bổ sung `independentMinDistinctSessions: 2`. `AttemptEvidence` nhận thêm trường `sessionId?: string | null`.
- `deriveCompetency(attempts)` tính tập phiên phân biệt thông qua `sessionKeyForAttempt`:
  - Hai lần giải đúng không gợi ý trong **cùng một `sessionId`** giữ kỹ năng ở mức **`SUPPORTED`** (*"Em đã tự làm đúng 2 lần trong cùng một phiên học; cần tự làm đúng lại ở ít nhất 2 phiên học khác nhau để xác nhận tự làm vững."*).
  - Chỉ khi có `>= 2` lần giải độc lập trải trên `>= 2` phiên học khác nhau (và hoàn toàn tách biệt khỏi `lessonPurpose === "practice"` và `parent_correction`), kỹ năng mới đạt `INDEPENDENT`, làm tiền đề cho `RETAINED` và `TRANSFERRED`.
- **Quy tắc mở khóa ôn tập định kỳ có điều kiện (`isScheduledReviewFirstTryIndependent`):**
  - Cổng A2 tiếp tục chặn tuyệt đối mọi hành vi mở phiên mới làm lại ngay trước hạn (`priorDue === null || now < priorDue`): mọi lần nộp lặp lại trước hạn đều mang `evidenceKind = "assisted"`.
  - Khi và chỉ khi kỹ năng đã có lịch ôn tập đến hạn (`priorDue !== null && now >= priorDue`), phiên hiện tại là phiên ôn tập hợp lệ, học sinh chưa mở gợi ý nào trong phiên (`sessionMaxLevel === 0`) và đây là lần nộp đầu tiên của bước đó trong phiên ôn tập (`priorSameSessionStepAttempts === 0`), lần nộp đúng đó được ghi nhận là bằng chứng độc lập (`evidenceKind = "observed"`, chuẩn hóa `attemptNo: 1` ở lớp dẫn xuất `skill_evidence_observation` trong khi `learning_attempts.attempt_no` vẫn giữ số thứ tự lịch sử trung thực để bảo toàn ràng buộc `UNIQUE (learner_id, step_id, attempt_no)`).
- Cung cấp hàm thuần `recomputeLearnerState` (`src/shared/engine/recompute-learner-state.ts`) phát lại toàn bộ lịch sử `learning_attempts` theo thứ tự thời gian thực tế để kiểm chứng bất kỳ lúc nào rằng trạng thái lưu trong DB khớp 100% với trạng thái tính lại từ sổ cái gốc.

### 2. Giới hạn phiên học Dừng Mềm 25 phút + Nghỉ mắt 15 phút + Gia hạn có mật khẩu phụ huynh (G9)

- Định nghĩa tại `src/shared/engine/session-budget.ts`:
  - `MAX_LEARNER_SESSION_MS = 25 * 60 * 1000` (25 phút cho Lớp 4–5).
  - `EYE_REST_COOLDOWN_MS = 15 * 60 * 1000` (15 phút nghỉ mắt bắt buộc giữa hai đợt học đầy ngân sách).
  - `PARENT_SESSION_EXTENSION_MS = 15 * 60 * 1000` (+15 phút mỗi lần phụ huynh xác thực mật khẩu).
- **Cơ chế Dừng Mềm (Soft Stop):**
  - Câu hỏi đang làm dở tại thời điểm vượt mốc 25 phút **vẫn được chấm điểm, lưu bằng chứng nguyên tử và trả lời giải bình thường**, kèm cờ `sessionTimeBudgetReached: true` và `canAdvance: false`.
  - Bước kế tiếp hoặc yêu cầu mở phiên học mới bị chặn nhẹ nhàng bằng thông điệp tiếng Việt thân thiện, hiển thị màn hình nghỉ mắt trên `LessonScreen.tsx` mà không dùng bất kỳ điểm thưởng, chuỗi ngày (streak) hay bảng xếp hạng nào.
- **Không thêm bảng SQL mới:** Sự kiện phụ huynh nhập mật khẩu gia hạn qua `POST /api/learner/sessions/extend` (có kiểm soát CSRF + `auth_throttles`) được ghi trực tiếp vào sổ cái kiểm toán bất biến `audit_events` (`action = 'session.time_extended'` hoặc `'session.rest_overridden'`). Bộ tính ngân sách phiên học đọc trực tiếp các chứng từ kiểm toán này để cộng hạn mức một cách xác định và có dấu vết kiểm toán đầy đủ.

### 3. Chặn mạng chủ động (G2), Kiểm thử tiếp cận WCAG 2.2 AA (G10), Cổng QA nội dung ngoại tuyến (G13), Mô phỏng 3.650 ngày (G7) và Mô hình TCO (G15)

- **G2 (`test/e2e/network-guard.ts`):** Mọi kịch bản Playwright gắn `context.route("**/*", ...)` chặn và làm đỏ bài kiểm thử ngay lập tức nếu xuất hiện bất kỳ request nào ra ngoài `127.0.0.1` / `localhost` (cho phép duy nhất `data:` và `blob:` nội bộ).
- **G10 (`@axe-core/playwright`):** Quét tự động bộ quy tắc `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` (**0** lỗi `critical`/`serious`) kết hợp đo khung hình học `boundingBox >= 48×48 CSS px` cho các nút tương tác của học sinh trên cả Desktop, Tablet và Mobile.
- **G7 (`npm run review:simulate`):** Mô phỏng tất định 3.650 ngày (`2026-09-05` → `2036-09-01`, múi giờ `Asia/Ho_Chi_Minh`, bao gồm 3 năm nhuận, kỳ nghỉ Tết Âm lịch và nghỉ hè) chứng minh thang cố định cũ phình lên **146,89 lượt ôn/ngày** ở Năm thứ 10, trong khi chính sách FSRS-6 dài hạn giữ tải ở mức **9,14 lượt/ngày** (trung bình năm lịch) / **8,92 lượt/ngày** (trong học kỳ) với **0** lần reset sai sau kỳ nghỉ.
- **G13 (`npm run qa:content` + `promptfooconfig.yaml`):** Kiểm chứng đại số phân số/biểu thức bằng số học tỷ lệ chính xác `bigint` (kèm nhánh đối chiếu `python3 -I` SymPy tùy chọn khi máy có cài đặt) và cấu hình `promptfoo` hoàn toàn ngoại tuyến (`echo` provider, `sharing: false`) bắt đủ 7/7 phép đột biến tiêm nhiễm/rò đáp án/gamification mà không gọi bất kỳ LLM API nào.
- **G15 (`npm run tco:verify`):** Mô hình hóa minh bạch TCO hộ gia đình Mission A (**9.630.000 VNĐ/năm** kịch bản cơ sở; **9.850.000 VNĐ/năm** kịch bản thận trọng — dưới trần `10.000.000 VNĐ/năm`, `0 VNĐ` chi phí đám mây) và mô hình độ nhạy Mission B độc lập (chỉ B2B2C trung tâm `82,57%` biên đóng góp, `28,9x` LTV/CAC đạt `PASS`; kịch bản B2C lẻ và Chat LLM không giới hạn bị gắn nhãn `REJECT`).

### 4. Gói Di sản Mở 10 Năm (`CLR 2.0 + CASE 1.1 + xAPI 2.0 + viewer.html`)

- Thực thi tại `src/shared/portability/` và mở qua cả giao diện phụ huynh (`POST /api/data/export-portability` có ghi kiểm toán `data.portability_exported`) lẫn CLI chỉ-đọc `npm run export:portability` (mở SQLite với `readOnly: true`, giữ nguyên mã băm SHA-256 của tệp DB).
- Bộ xuất gồm 4 tạo phẩm chuẩn hóa:
  1. **1EdTech CLR Standard 2.0 (`clr-2.0.json`):** Hồ sơ thành tích JSON-LD ẩn danh (`urn:uuid:...`), chỉ phát hành chứng nhận cho các kỹ năng có bằng chứng thực chất, không chứa PII hay khóa đáp án.
  2. **1EdTech CASE 1.1 (`case-1.1.json`):** Khung mục tiêu chương trình `CFPackage` ánh xạ đầy đủ mục tiêu GDPT 2018 và quan hệ tiên quyết (`CFAssociations`).
  3. **IEEE 9274.1.1 xAPI 2.0 (`xapi-2.0.jsonl`):** Dòng sự kiện lịch sử làm bài định dạng JSON Lines với Actor `account = { homePage: "urn:tai-learning-os:household", name: learnerId }` ẩn danh.
  4. **Trình xem độc lập ngoại tuyến (`viewer.html`):** Một tệp HTML duy nhất tự chứa CSS/JS nội tuyến, khóa cứng `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'`, thoát mã an toàn mọi chuỗi JSON nhúng (`escapeJsonForHtmlScript`), đạt chuẩn WCAG 2.2 AA và mở trực tiếp qua giao thức `file://` khi tắt hoàn toàn Wi-Fi.

---

## Hệ quả và giới hạn trung thực

- **Sáu cổng kỹ thuật chuyển từ HOLD sang PASS (`G2, G6, G9, G10, G13, G15`)** bằng cơ chế thực thi thật và kiểm thử tự động có kiểm chứng đột biến.
- **Hai cổng giữ nguyên PARTIAL (`G8, G14`):** `G8` mới phủ 50 bài mẫu (`3,57%` quỹ tiết Lớp 4–5); `G14` đã có đầy đủ giao thức đo nhưng cơ sở dữ liệu hộ gia đình thực tế đang có `0` lượt làm bài nên chưa có số đo sau 14/30 ngày học thật.
- **Một cổng giữ nguyên HOLD (`G16`):** Phê duyệt pháp lý và chữ ký chủ sở hữu để mở triển khai ngoài máy cục bộ vẫn đóng hoàn toàn theo chính sách `PRODUCTION DEPLOY BLOCKED`.
