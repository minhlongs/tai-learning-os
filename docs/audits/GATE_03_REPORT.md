# BÁO CÁO TOÀN DIỆN CỔNG KIỂM ĐỊNH GATE 03
## GATE 03 REPORT — CURRICULUM FOUNDATION & TRUST CLOSURE

**Dự án:** TAI LEARNING OS (Hệ điều hành học tập của bé Tài)  
**Ngày hoàn thành:** 26/10/2026  
**Thẩm quyền thực thi:** Supreme Command #03 (`/ak-vibe go next --ship --parallel`)  
**Chính sách phát hành (Release Policy):** **LOCAL ONLY / NO DEPLOY / NO REMOTE PUSH / PRODUCTION BLOCKED BY POLICY**  
**Kết quả kiểm định kỹ thuật cục bộ (Local Technical Verdict):** **PASS — 100% VERIFIED (6/6 GATES GREEN)**  

---

### 1. TỔNG QUAN THỰC THI SUPREME COMMAND #03

Supreme Command #03 mở rộng TAI LEARNING OS từ nền tảng khung MVP sang một hệ điều hành học tập có nền tảng chương trình chuẩn quốc gia (GDPT 2018), đánh giá đầu vào trung thực, kế hoạch học tập 4 tuần cá nhân hoá và đóng kín các chốt an toàn xác thực:

1. **Phase A (Trust Closure - Đóng kín chốt an toàn):**
   - Nâng cấp mật mã băm mật khẩu phụ huynh lên chuẩn PBKDF2-SHA256 với **600.000 vòng lặp** (per-password salt 16-byte). Hỗ trợ cơ chế nâng cấp trong suốt (`needsRehash`) khi phụ huynh đăng nhập từ hàm băm 100.000 vòng cũ mà không gây gián đoạn phiên.
   - Triển khai cơ chế bóp nghẹt đăng nhập thất bại đa tầng bền vững qua bảng D1 `auth_throttles` (phạm vi theo tài khoản `account:` và theo IP chuẩn hoá `auth:`), chống tấn công dò mật khẩu qua mặt Rate Limiter bằng cách đổi header hoặc khởi động lại Worker. Khóa tạm 15 phút khi vượt ngưỡng thất bại.
   - Thêm công cụ khôi phục CLI cục bộ `scripts/unlock-parent.mjs` (`npm run unlock:parent`) dành cho phụ huynh có quyền truy cập trực tiếp máy chủ.
   - Duy trì kiểm soát chặt chẽ phân quyền server-side giữa chế độ phụ huynh (`parent`) và người học (`learner`).
2. **Phase B (Curriculum Intake - Tiếp nhận chương trình):**
   - Màn hình phụ huynh `/parent/curriculum` (`CurriculumSetupScreen.tsx`) và API `GET/POST /api/parent/curriculum`.
   - Lưu trữ cấu hình năm học (`2026-2027`), khối lớp (`4`), môn học, bộ sách giáo khoa (mặc định trung thực `UNKNOWN`), chủ đề/bài học hiện tại trên lớp, mục tiêu học tập, thời lượng mỗi tuần và gắn nhãn nguồn gốc minh bạch (`gdpt_2018_objective`, `parent_textbook`, `original_supplemental`, `unverified_assumption`).
3. **Phase C (Curriculum Engine - Động cơ chương trình):**
   - Bảng cơ sở dữ liệu `curriculum_objectives`, `skill_prerequisites`, `lesson_metadata`.
   - Cơ chế bảo toàn phiên bản: khi bài học cập nhật nội dung, tăng `version` và `step_version`, đánh dấu bài học cần phụ huynh duyệt lại (`pendingReapproval`), bảo toàn 100% các bản ghi lịch sử `learning_attempts` với `step_version` gốc mà không xóa hay diễn giải sai lịch sử.
   - Động cơ suy diễn năng lực 5 bậc (`NOT_OBSERVED` → `EMERGING` → `SUPPORTED` → `INDEPENDENT` → `TRANSFERRED` / `RETAINED`) phản ánh trung thực bài tập độc lập vs có trợ giúp, và tự động hạ bậc về `INDEPENDENT` khi thất bại trong các phiên ôn tập định kỳ sau đó.
4. **Phase D (Baseline Assessment - Đánh giá đầu vào):**
   - Màn hình chẩn đoán đầu vào phụ huynh `/parent/baseline` (`BaselineAssessmentScreen.tsx`) và API `GET/POST /api/parent/baseline`.
   - Đánh giá có phụ huynh giám sát cho 3 môn Toán, Đọc hiểu Tiếng Việt và Tiếng Anh lớp 4 dựa trên bộ bài tập chẩn đoán chuẩn mực, tách bạch: cái đã quan sát được, cái được bằng chứng hỗ trợ, kỹ năng cần thêm quan sát, bài học đề xuất bắt đầu và cảnh báo mục phụ huynh cần duyệt.
5. **Phase E (Four-Week Learning Planner - Kế hoạch học tập 4 tuần):**
   - Động cơ lập lịch tất định `src/shared/engine/planner.ts`, màn hình `/parent/planner` (`FourWeekPlannerScreen.tsx`) và API `GET /api/parent/planner`, `POST /api/parent/planner/generate`, `PATCH /api/parent/planner/item`.
   - Ưu tiên lấp lỗ hổng tiên quyết, tích hợp ôn tập cách quãng, tôn trọng thời lượng cấu hình (mặc định 3 buổi/tuần, 20 phút/buổi), cho phép phụ huynh linh hoạt chỉnh sửa/dời lịch/bỏ qua, phân loại trạng thái trực quan: `TODAY`, `UPCOMING`, `REVIEW DUE`, `COMPLETED`, `NEEDS PARENT REVIEW`.
6. **Phase F (Real Learning Experience - Nâng cao trải nghiệm học tập):**
   - Giao diện thân thiện với trẻ em: thẻ câu hỏi lớn, vùng chạm cảm ứng tối thiểu 48px, thanh tiến trình trực quan, phản hồi lỗi nhẹ nhàng không gây ức chế.
   - Điểm dừng tự nhiên và màn hình phản tư cuối phiên học (`SessionSummaryScreen.tsx`) gửi tự đánh giá cảm xúc & mức độ tự tin qua API `POST /api/learner/sessions/reflect`.
7. **Phase G (Data Continuity & Portability - Tính liên tục & Khôi phục dữ liệu):**
   - Mở rộng cấu trúc sao lưu `tai-learning-os-export@v1` bao gồm toàn bộ 21 bảng dữ liệu D1.
   - Hỗ trợ xuất/nhập/xoá dữ liệu hoàn toàn cục bộ, bảo vệ quyền riêng tư theo Luật Trẻ em và Nghị định bảo vệ dữ liệu cá nhân Việt Nam.

---

### 2. BẢNG TỔNG HỢP 6 CỔNG KIỂM ĐỊNH (VERIFICATION GATES)

| Cổng kiểm định | Lệnh kiểm tra | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Gate 1: Static Typecheck** | `npm run typecheck` | `tsc -p tsconfig.worker.json --noEmit`<br/>`tsc -p tsconfig.app.json --noEmit`<br/>**0 lỗi** | **PASS** |
| **Gate 2: Code Linting** | `npm run lint` | ESLint quét toàn bộ repo: **0 errors** (5 cảnh báo vô hại về Fast Refresh & useMemo) | **PASS** |
| **Gate 3: Unit Tests** | `npm test` | **8/8 test files passed**, **175/175 tests passed** (100% green) | **PASS** |
| **Gate 4: Integration Tests** | `npm run test:integration` | **4/4 test files passed**, **77/77 tests passed** (Worker + D1 in workerd) | **PASS** |
| **Gate 5: Browser E2E Tests** | `npm run test:e2e` | Playwright chạy 18 kịch bản trên 3 form-factor (Desktop, Tablet, Mobile Pixel 7): **18 passed** (30.6s) | **PASS** |
| **Gate 6: Production Build** | `npm run build` | Vite build bundle ứng dụng client thành công: **0 lỗi** | **PASS** |

---

### 3. KIỂM ĐỊNH BẢO VỆ DỮ LIỆU & BẢN QUYỀN

1. **Bảo tồn cơ sở dữ liệu cục bộ:**
   - Đã áp dụng migration `0003_curriculum_and_trust_closure.sql` bổ sung 6 bảng mới nâng tổng số bảng D1 lên 21 bảng.
   - Hồ sơ học tập và dữ liệu đã tích luỹ của phụ huynh và bé Tài được bảo toàn nguyên vẹn.
2. **Kiểm tra công cụ dòng lệnh (CLI Scripts):**
   - `npm run unlock:parent`: Đã thử nghiệm thực tế, xoá sạch bảng `auth_throttles` và ghi nhật ký kiểm toán `parent.throttle_unlocked_cli`.
   - `npm run export:learner`: Sử dụng đúng cấu trúc `exportRecord` của API, kiểm tra ràng buộc không xuất khi chưa có dữ liệu rỗng.
3. **Chính sách môi trường:**
   - Không thực hiện bất kỳ lệnh `git push` lên GitHub/remote.
   - Không chạy lệnh `wrangler deploy` lên Cloudflare Workers.
   - Không cấu hình hay sử dụng bất kỳ API LLM trả phí nào. Toàn bộ logic sư phạm và phân tích đều chạy offline/deterministic.

---

### 4. PHÁN QUYẾT CUỐI CÙNG

**PHÁN QUYẾT: PASS (HOÀN THÀNH TOÀN DIỆN MỤC TIÊU SUPREME COMMAND #03 TRÊN MÔI TRƯỜNG CỤC BỘ)**
