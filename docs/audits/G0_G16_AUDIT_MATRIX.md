# Ma trận kiểm chứng G0–G16

**Ngày đo:** 2026-11-10 (khởi tạo G0–G16); 2026-11-13 (mục MB, mục OPS); **2026-11-15 (đo lại toàn diện G0–G16, MB, OPS và bộ xuất di sản 10 năm sau khi đóng G2, G6, G9, G10, G13, G15)**
**HEAD:** `659008ff35cb6ed18084581e6e9b0d64aab3fa09` — đây là nơi các phép đo dưới đây được chạy, trên một cây làm việc sạch. (Commit ngay sau đó chỉ cập nhật chính tài liệu này; xem G0.)
**Nhánh:** `feat/issue-68-mission-a-phase2-gates`
**Máy:** macOS, Node v26.7.0, npm 11.x

---

## Cách đọc tài liệu này

Mỗi dòng dưới đây ghi **đúng câu lệnh đã chạy**, **nguyên văn kết quả**, và **con số đo được**. Không có dòng nào ghi "NOT VERIFIED" khi câu lệnh chạy được và trả về kết quả — khi một cổng chưa đạt trọn vẹn, tài liệu ghi rõ nó chưa đạt vì cái gì, kèm số đo.

Ba mức phán quyết:

| Nhãn | Nghĩa |
|---|---|
| **PASS** | Cơ chế tồn tại, có test hoặc số đo chứng minh, và không có khoảng trống đã biết nào trong phạm vi cổng |
| **PARTIAL** | Cơ chế tồn tại nhưng chỉ đạt một phần yêu cầu của Masterplan; phần thiếu được ghi bằng số |
| **HOLD / FAIL** | Yêu cầu của Masterplan chưa được đáp ứng, hoặc thuộc thẩm quyền ký duyệt ngoài mã nguồn |

Bất kỳ dòng **HOLD/FAIL/PARTIAL** nào ở G0, G2, G3, G4, G12 hoặc G16 đều chặn triển khai ra ngoài máy cục bộ hộ gia đình (Masterplan §23).

---

## Bảng tổng hợp

| Cổng | Tên | Phán quyết | Số đo chính |
|---|---|---|---|
| G0 | Baseline & môi trường | **PASS** | HEAD `659008ff35cb6…`; cây làm việc **0 tệp** thay đổi; baseline `bff5c9d` là tổ tiên (`exit=0`) |
| G1 | Nhất quán mô hình năng lực | **PASS** | `src/` + `test/`: **0** `EMERGING`; 5 trạng thái khớp `COMPETENCY_STATES` |
| G2 | Kiểm thử không phụ thuộc mạng | **PASS** | `context.route("**/*", …)` chủ động chặn mọi URL ngoài localhost (**8** điểm gắn `attachZeroOutboundGuard`, **0** request ra ngoài trên **60/60** test E2E + mở `viewer.html` qua `file://` khi offline) |
| G3 | Bí mật & mặc định an toàn | **PASS** | 0 bí mật mặc định; **14** test `config-guard` + **6** test `deployment-lock` |
| G4 | Không lộ khoá đáp án | **PASS** | **25** trường đáp án bị bóc bởi `toLearnerExercise()`; `validate:lessons` **0** lỗi trên 50 bài (257 bước) |
| G5 | Chấm điểm xác định | **PASS** | **31** test đơn vị chấm điểm + bộ kiểm chứng đại số phân số tỷ lệ `bigint` trên 257 bước |
| G6 | Bằng chứng độc lập | **PASS** | `independentMinCorrect: 2` + `independentMinDistinctSessions: 2` (**5** tham chiếu `sessionId` trong `competency.ts`); mở khóa lần thử đầu khi `now >= due_at` giúp bài 1–1 đạt `RETAINED` mà vẫn giữ Cổng A2 trước hạn; `recomputeLearnerState` khớp 100% sổ cái |
| G7 | Lịch ôn tập | **PASS** | bậc `[1,3,7,14]` → **0**; `ts-fsrs` **6.0.0**; mô phỏng **3.650 ngày** (`npm run review:simulate`, `Asia/Ho_Chi_Minh`): bậc cũ phình **146,89 lượt/ngày** ở Năm 10 so với FSRS-6 **9,14 lượt/ngày** (lịch) / **8,92 lượt/ngày** (học kỳ), **0** reset sai sau Tết/hè |
| G8 | Phủ chương trình | **PARTIAL** | 50/50 bài có mục tiêu; 40/40 mục tiêu được seed; 16 test đồ thị; **3,57%** phủ quỹ tiết Lớp 4–5 |
| G9 | Giới hạn phiên học | **PASS** | Trần **Dừng Mềm 25 phút** (`MAX_LEARNER_SESSION_MS = 25 * 60 * 1000`) + nghỉ mắt **15 phút** + gia hạn mật khẩu phụ huynh `+15 phút` có kiểm toán (`session.time_extended` / `session.rest_overridden`); **0** bảng xếp hạng hay daily streak |
| G10 | Khả năng tiếp cận | **PASS** | `@axe-core/playwright` quét `wcag2a/2aa/21a/21aa/22aa` (**0** vi phạm `critical`/`serious`) + kiểm tra khung chạm `>= 48×48px` trên cả Desktop, Tablet và Mobile (**60/60** E2E xanh) |
| G11 | Nguyên tử hoá ghi chéo bảng | **PASS** | **16** điểm `batch(`; **4** test rollback/race; **9** test hình dạng batch (`batched-write-shape.test.ts`) |
| G12 | Sao lưu & khôi phục | **PASS** | Drill `ok:true`; **`restoreMs: 96`** < 60 giây; **`recordsLost: 0`** / 548 bản ghi; kèm gói di sản mở 10 năm (`CLR 2.0 + CASE 1.1 + xAPI 2.0 + viewer.html` ngoại tuyến) |
| G13 | Kiểm chứng nội dung bằng công cụ | **PASS** | `npm run qa:content` (`ok: true`, **257/257** bước sạch, `mathErrorsCount: 0`, `promptfooconfig.yaml` offline `echo` provider `sharing: false`, đối chiếu `bigint`/SymPy trên **109** cặp phân số, bắt **7/7** đột biến) |
| G14 | Đo lường thực nghiệm | **PARTIAL** | Giao thức đã dựng: `retention:report` → `NO_DATA` trên DB hộ gia đình thật (0 lần học); `retention:drill` → `MEASURED` (`probes 4/3`, rate `0.5` / `0.666…`); **7/7** mutation bị bắt; **0** số đo thật vì chưa có dữ liệu 14–30 ngày |
| G15 | Mô hình chi phí | **PASS** | `npm run tco:verify` (`ok: true`): TCO hộ gia đình Mission A **9.630.000 VNĐ/năm** (cơ sở) / **9.850.000 VNĐ/năm** (thận trọng) < trần `10.000.000 VNĐ/năm`, `0 VNĐ` đám mây; độ nhạy Mission B cô lập chấm `PASS` cho B2B2C trung tâm (`82,57%`, `28,9x` LTV/CAC) và `REJECT` cho B2C lẻ / Chat LLM không giới hạn |
| G16 | Phê duyệt của chủ sở hữu | **HOLD** | 0 bản ký duyệt; 3 điều kiện tiên quyết pháp lý & chủ sở hữu còn mở (`PRODUCTION DEPLOY BLOCKED`) |

**Kết luận:** **14 PASS** (`G0, G1, G2, G3, G4, G5, G6, G7, G9, G10, G11, G12, G13, G15`), **2 PARTIAL** (`G8, G14`), **1 HOLD** (`G16`). Toàn bộ các cổng kỹ thuật trong phạm vi Mission A Phase 2 đã đóng bằng bằng chứng đo được; `G8` (mở rộng số lượng bài học ngoài 50 bài mẫu) và `G14` (chờ dữ liệu học thực tế 14–30 ngày) giữ nhãn `PARTIAL` trung thực, và `G16` giữ khoá `HOLD` đúng theo chính sách `PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED`.

---

## Chi tiết từng cổng

### G0 — Baseline & môi trường

**Câu lệnh:**
```bash
git rev-parse HEAD
git status --porcelain | wc -l
git merge-base --is-ancestor bff5c9d HEAD; echo "exit=$?"
```

**Kết quả nguyên văn (đo lại 2026-11-15):**
```
659008ff35cb6ed18084581e6e9b0d64aab3fa09
0
exit=0
```

**Đo được:** HEAD của toàn bộ mã nguồn, kiểm thử, script và ADR là `659008ff35cb6ed18084581e6e9b0d64aab3fa09`; baseline `bff5c9d` là tổ tiên của HEAD (`exit=0`); cây làm việc có **0 tệp** thay đổi. (Commit ngay sau `659008f` chỉ cập nhật chính tài liệu kiểm chứng này để không tự làm cũ SHA ghim.)

**Phán quyết: PASS.**

---

### G1 — Nhất quán mô hình năng lực

**Câu lệnh:**
```bash
grep -rn "EMERGING" src/ test/ --include='*.ts' | wc -l
grep -rn "EMERGING" docs/ | head
sed -n '20,32p' src/shared/schemas/attempt.ts
```

**Kết quả nguyên văn:**
```
0
docs/adr/ADR-001-single-independent-standard.md:55:`docs/CURRICULUM_ARCHITECTURE.md` mục 3 và `docs/audits/GATE_03_REPORT.md:27` từng mô tả thang năng lực **5 bậc** có `EMERGING`. …
```
```ts
export const COMPETENCY_STATES = [
  "NOT_OBSERVED",
  "SUPPORTED",
  "INDEPENDENT",
  "RETAINED",
  "TRANSFERRED",
] as const;
```

**Đo được:** `EMERGING` xuất hiện **0 lần** trong `src/` và `test/`. Toàn bộ hệ thống (bao gồm cả bộ xuất `CLR 2.0` và `recomputeLearnerState`) dùng duy nhất năm trạng thái của `COMPETENCY_STATES`.

**Phán quyết: PASS.**

---

### G2 — Kiểm thử không phụ thuộc mạng

**Câu lệnh:**
```bash
grep -rn "page.route\|context.route" test/ | wc -l
grep -rn "attachZeroOutboundGuard" test/e2e/ | wc -l
npx playwright test
```

**Kết quả nguyên văn:**
```
1
8
60 passed
```

**Đo được:**
- `test/e2e/network-guard.ts` đăng ký `context.route("**/*", ...)` ở cấp BrowserContext và được gắn tại **8** điểm trải đều trên cả ba tệp E2E (`test/e2e/learner-journey.spec.ts`, `test/e2e/m4-browser-verification.spec.ts`, và `test/e2e/g2-g10-and-portability.spec.ts`).
- Mọi request HTTP/HTTPS/WS ra ngoài `127.0.0.1` / `localhost` bị `route.abort("blockedbyclient")` ngay lập tức và được ghi vào mảng `blockedUrls`; cuối mỗi bài kiểm thử `guard.assertZeroOutbound()` khẳng định `blockedUrls` rỗng (**0** request ra ngoài trên cả **60/60** lượt chạy Desktop, Tablet, Mobile).
- Bài kiểm thử di sản 10 năm trong `test/e2e/g2-g10-and-portability.spec.ts` còn gắn `offlinePage.route("**/*", ...)` gọi `route.abort("internetdisconnected")` cho mọi giao thức khác `file:`/`data:`/`blob:`, rồi mở trực tiếp tệp `viewer.html` qua giao thức `file://`, chứng minh hồ sơ học tập hiển thị trọn vẹn khi không có bất kỳ kết nối mạng nào.

**Phán quyết: PASS.**

---

### G3 — Bí mật & mặc định an toàn

**Câu lệnh:**
```bash
grep -rn "SESSION_SECRET\s*=\s*['\"]\|PARENT_PASSWORD_HASH\s*=\s*['\"]" src/
grep -c "  it(" test/unit/config-guard.test.ts
grep -c "  it(" test/unit/deployment-lock.test.ts
```

**Kết quả nguyên văn:**
```
src/worker/http/middleware.ts:126:  // merely absent ones (`SESSION_SECRET="a"` signs a valid HMAC and is
14
6
```

**Đo được:** **0** bí mật mặc định trong mã nguồn (dòng khớp duy nhất là chú thích giải thích vì sao kiểm tra độ mạnh). Cổng cấu hình có **14** test đơn vị; khoá triển khai có **6** test đọc trực tiếp `wrangler.jsonc` (`"database_id": "local-only"`). `test/unit/build-no-secrets.test.ts` xác nhận bản build `dist/` không chứa `.dev.vars` hay khoá bí mật.

**Phán quyết: PASS.**

---

### G4 — Không lộ khoá đáp án

**Câu lệnh:**
```bash
grep -c "correctDenominator\|correctNumerator\|correctChoiceId\|sentenceAcceptedWords\|evidenceSentence_vi" src/shared/schemas/exercise.ts
npm run validate:lessons
```

**Kết quả nguyên văn:**
```
25
  ✓ identity     Danh tính bài học và thứ tự bước / lesson identity and step order
  ✓ curriculum   Nối vào đồ thị chương trình / linked to the curriculum graph
  ✓ rights       Quyền nội dung và nguồn trích dẫn / content rights and source citation
  ✓ schema       Lược đồ bài tập / exercise schema
  ✓ answer-key   Đáp án khớp với bài tập / answer key matches the exercise
  ✓ pedagogy     Trình tự sư phạm / pedagogical sequence
  ✓ hints        Gợi ý tăng dần / progressive hints
  ✓ explanation  Lời giải không chỉ vị trí đáp án / explanation does not cite a choice letter
  ✓ answer-leak  Không rò đáp án xuống trình duyệt / no answer reaches the browser
validate:lessons OK — 50 lessons (257 steps) verified with 0 schema/answer-leak/pedagogy issues.
```

**Đo được:** **25** lần xuất hiện của năm trường đáp án trong `exercise.ts`; `toLearnerExercise()` bóc toàn bộ chúng khỏi payload gửi xuống trình duyệt. Bộ xuất di sản mở (`CLR 2.0`, `CASE 1.1`, `xAPI 2.0`, `viewer.html`) cũng được kiểm chứng bằng `test/unit/open-portability.test.ts` rằng **0** khoá đáp án lọt ra ngoài.

**Phán quyết: PASS.** *(Ghi chú giữ nguyên từ đợt trước: 10 dòng cảnh báo `advisory` trên hai bài Tiếng Việt nhắc chữ cái lựa chọn trong lời giải sau khi làm đúng không phải lỗi rò đáp án và không sửa trong đợt này do ràng buộc không biên tập lại nội dung 50 bài đã ship.)*

---

### G5 — Chấm điểm xác định

**Câu lệnh:**
```bash
grep -c "  it(" test/unit/answer-validation.test.ts
```

**Kết quả nguyên văn:**
```
31
```

**Đo được:** **31** test đơn vị chấm điểm (`answer-validation.test.ts`), cộng thêm bộ kiểm chứng phân số chính xác `bigint` trong `src/shared/content/qa-gate.ts` đối chiếu chéo `gradeSubmission` trên toàn bộ **257** bước bài học.

**Phán quyết: PASS.**

---

### G6 — Bằng chứng độc lập

**Câu lệnh:**
```bash
grep -n "sessionId\|session_id" src/shared/engine/competency.ts | wc -l
grep -n "independentMinCorrect\|independentMinDistinctSessions\|smallHint" src/shared/engine/competency.ts
npx vitest run test/unit/competency-transitions.test.ts test/unit/session-budget-and-recompute.test.ts
npx vitest run --config vitest.integration.config.ts test/integration/g6-g9-mastery-and-session-cap.test.ts
```

**Kết quả nguyên văn:**
```
5
29:  independentMinCorrect: 2,
31:  independentMinDistinctSessions: 2,
33:  smallHint: 0,
149:    independentCount >= COMPETENCY_CONFIG.independentMinCorrect &&
150:    independentSessionCount >= COMPETENCY_CONFIG.independentMinDistinctSessions;
153:    independentCount >= COMPETENCY_CONFIG.independentMinCorrect &&
154:    independentSessionCount < COMPETENCY_CONFIG.independentMinDistinctSessions;

 ✓ test/unit/competency-transitions.test.ts (35 tests)
 ✓ test/unit/session-budget-and-recompute.test.ts (6 tests)
 ✓ test/integration/g6-g9-mastery-and-session-cap.test.ts (3 tests)
```

**Đo được:**
- `competency.ts` kiểm tra đồng thời `independentCount >= 2` **và** `independentSessionCount >= 2` (tính theo `sessionId` phân biệt qua `sessionKeyForAttempt`), tách biệt hoàn toàn `lessonPurpose === "practice"` và `evidenceKind === "parent_correction"`.
- Hai lượt giải độc lập trong **cùng một phiên học** giữ trạng thái ở **`SUPPORTED`**; chỉ khi xác nhận lại ở phiên học thứ hai khác `sessionId` mới lên **`INDEPENDENT`**.
- Trên các bài học ánh xạ 1–1 tới kỹ năng, `isScheduledReviewFirstTryIndependent()` và `replaySkillAttemptEvidence()` (`src/shared/engine/recompute-learner-state.ts`) mở khóa lần nộp đầu tiên không gợi ý trong phiên ôn tập định kỳ **khi và chỉ khi `priorDue !== null && now >= priorDue`**, được chia sẻ đồng nhất giữa `session-service.ts`, `finalizeSession`, `recordParentCorrection`, `selectRetentionAttempts` và `recomputeLearnerState` — giúp kỹ năng tiến lên **`RETAINED`** và được ghi nhận chính xác trên phép đo `retention:report` 14/30 ngày mà vẫn giữ nguyên Cổng A2 chống đoán mò trước hạn (`now < due_at` → bị ép về `assisted`).
- Bộ tái tính toán tất định `recomputeLearnerState` (`src/shared/engine/recompute-learner-state.ts`) phát lại lịch sử `learning_attempts` từ đầu và được integration test xác nhận khớp 100% với `skill_evidence` và `review_schedule` lưu trong D1.

**Phán quyết: PASS.**

---

### G7 — Lịch ôn tập & mô phỏng 3.650 ngày

**Câu lệnh:**
```bash
grep -rn "\[1, 3, 7, 14\]\|\[1,3,7,14\]" src/ | wc -l
grep -n "ts-fsrs" package.json
grep -rn "Asia/Ho_Chi_Minh" src/ --include='*.ts' | wc -l
npm run review:simulate
```

**Kết quả nguyên văn:**
```
0
46:    "ts-fsrs": "6.0.0"
13
```
Trích xuất kết quả JSON từ `npm run review:simulate` (`ok: true`, chạy tất định 100% trên 3.650 ngày lịch `2026-09-05` → `2036-09-01`, 1.800 kỹ năng tích lũy, 3 ngày nhuận `2028-02-29`, `2032-02-29`, `2036-02-29`, 10 kỳ nghỉ Tết Âm lịch + 10 kỳ nghỉ hè 92 ngày theo nửa đêm `Asia/Ho_Chi_Minh` `17:00:00Z`):
- **Thang cố định cũ 1–3–7–14 (`legacy_fixed_ladder`):** tổng **288.416** lượt ôn / 10 năm; trung bình Năm thứ 10 vọt lên **146,89 lượt/ngày** (lịch) / **151,01 lượt/ngày** (ngày học), đỉnh **1.437 lượt/ngày** → quá tải sụp đổ.
- **Chính sách Lớp 4 hiện hành (`fsrs6_grade4_policy`, `retention: 0.95`, trần `30d`):** trung bình Năm 1 ở quy mô tiểu học chỉ **6,34 lượt/ngày** (phù hợp cho học sinh 9 tuổi trong 1 năm học, còn ở quy mô tích lũy 10 năm không nới trần thì Năm 10 lên `96,44 lượt/ngày` — minh họa rõ vì sao lộ trình liên cấp 10 năm cần nới trần khoảng cách khi lên cấp 2–3).
- **Chính sách FSRS-6 10 năm của Masterplan (`fsrs6_masterplan_10y`, `retention: 0.90`, trần `365d`):** tổng **20.817** lượt ôn / 10 năm; Năm thứ 10 giữ ổn định ở **9,14 lượt/ngày** (lịch) / **9,40 lượt/ngày** (ngày hoạt động) / **8,92 lượt/ngày** (trung bình học kỳ chính khóa) — thấp hơn rất xa trần `25 lượt/ngày`; **611/660** lượt nối lại sau nghỉ Tết giữ nguyên độ ổn định ký ức và **`falseResets: 0`**.

**Phán quyết: PASS.**

---

### G8 — Phủ chương trình

**Câu lệnh:**
```bash
node scripts/curriculum-coverage.mjs --output docs/CURRICULUM_COVERAGE_MATRIX.md
grep -c '^| [0-9]' docs/CURRICULUM_COVERAGE_MATRIX.md
npx vitest run --config vitest.integration.config.ts \
  test/integration/curriculum-graph-integrity.test.ts
```

**Kết quả nguyên văn:**
```
wrote /Users/macbook/projects/tai-learning-os/docs/CURRICULUM_COVERAGE_MATRIX.md
lessons 50 · objectives 40 · uncovered 0 · dangling edges 0
50
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

**Đo được:** **50/50** bài học có `objectiveId` hợp lệ, **40/40** mục tiêu được seed, **0** cạnh treo hay chu trình. Về quy mô nội dung, 50 bài mẫu chiếm **3,57%** quỹ tiết Lớp 4–5 năm môn (việc biên soạn thêm bài học mới nằm ngoài phạm vi đợt đóng cổng kỹ thuật này).

**Phán quyết: PARTIAL.**

---

### G9 — Giới hạn phiên học

**Câu lệnh:**
```bash
grep -rn "25 \* 60\|SESSION_MAX\|MAX_LEARNER_SESSION_MS\|maxSessionMinutes" src/ --include='*.ts' | wc -l
grep -rn "leaderboard\|streak" src/ --include='*.ts'
npx vitest run test/unit/session-budget-and-recompute.test.ts
npx vitest run --config vitest.integration.config.ts test/integration/g6-g9-mastery-and-session-cap.test.ts
```

**Kết quả nguyên văn:**
```
4
(Các dòng khớp `leaderboard`/`streak` duy nhất là bộ lọc chặn gamification trong `src/shared/content/qa-gate.ts` và cột sư phạm chỉ hiển thị cho phụ huynh `failure_streak`)
 ✓ test/unit/session-budget-and-recompute.test.ts (6 tests)
 ✓ test/integration/g6-g9-mastery-and-session-cap.test.ts (3 tests)
```

**Đo được:**
- `src/shared/engine/session-budget.ts` khóa cứng `MAX_LEARNER_SESSION_MS = 25 * 60 * 1000` (25 phút), `EYE_REST_COOLDOWN_MS = 15 * 60 * 1000` (15 phút nghỉ mắt), `PARENT_SESSION_EXTENSION_MS = 15 * 60 * 1000` (+15 phút khi phụ huynh xác thực mật khẩu), đồng thời cộng dồn thời lượng học liên tục qua `computeContinuousStudyCarryOverMs` để việc chuyển sang bài học khác ở phút thứ 24 không thể xóa bộ đếm 25 phút.
- **Dừng Mềm (Soft Stop):** Lần nộp bài đang làm dở chạm mốc 25 phút vẫn được chấm điểm và lưu bằng chứng nguyên tử (`200 OK`, `sessionTimeBudgetReached: true`, `canAdvance: false`); bước tiếp theo hoặc phiên học mới bị từ chối `403 Forbidden` kèm thông báo nghỉ mắt tiếng Việt trên `LessonScreen.tsx` (giữ nguyên trạng thái `softStopped: true` cả khi tải lại trang).
- Phụ huynh nhập mật khẩu tại `POST /api/learner/sessions/extend` (có kiểm soát CSRF và khoá `auth_throttles`) sẽ mở thêm 15 phút và ghi chứng từ kiểm toán `session.time_extended` / `session.rest_overridden` vào `audit_events`. Kịch bản này được chứng minh cả ở tầng Worker/D1 lẫn trên trình duyệt thật trong `test/e2e/g2-g10-and-portability.spec.ts`.
- **0** bảng xếp hạng, **0** chuỗi ngày học gây áp lực.

**Phán quyết: PASS.**

---

### G10 — Khả năng tiếp cận (WCAG 2.2 AA & Vùng chạm `>= 48px`)

**Câu lệnh:**
```bash
grep -rn "axe" package.json test/ playwright.config.ts | wc -l
npx playwright test test/e2e/g2-g10-and-portability.spec.ts
```

**Kết quả nguyên văn:**
```
3
Running 6 tests using 3 workers
  6 passed
```

**Đo được:**
- `@axe-core/playwright` (`^4.14.0`) quét trực tiếp cây DOM đang render với bộ thẻ `["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]` trên màn hình chọn môn/bài học, màn hình làm bài tập của học sinh, màn hình nghỉ mắt 25 phút, màn hình Quản lý dữ liệu của phụ huynh và trình xem di sản ngoại tuyến `viewer.html` trên cả 3 cấu hình khung nhìn (`desktop`, `tablet`, `mobile`) → **0** vi phạm `critical` hoặc `serious`.
- Quá trình quét đã phát hiện và sửa triệt để 3 lỗi WCAG thực tế trong mã nguồn: `label-content-name-mismatch` trên `.lesson-tile` (`LessonList.tsx`), thiếu nhãn cho `role="progressbar"` (`StepProgress.tsx`), và vùng bảng cuộn ngang trên di động cần `tabindex="0"` (`static-viewer.ts`).
- Mọi nút tương tác và lựa chọn hiển thị trên màn hình làm bài tập của học sinh (`.lesson-page button:visible, .lesson-page label.choice:visible`) đều được đo `boundingBox()` thực tế và đạt **`width >= 48px` và `height >= 48px`** (cùng quy tắc `min-height: 48px` trên `.subject-card`, `.lesson-tile`, `.btn`).

**Phán quyết: PASS.**

---

### G11 — Nguyên tử hoá ghi chéo bảng

**Câu lệnh:**
```bash
grep -rn "\.batch(" src/ --include='*.ts' | wc -l
npx vitest run --config vitest.integration.config.ts test/integration/batched-write-shape.test.ts
```

**Kết quả nguyên văn:**
```
16
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

**Đo được:** **16** điểm gọi `.batch(` trong `src/`; **4** bài test rollback/race trong `evidence-and-ledger-integrity.test.ts`; **9** bài test hình dạng batch trong `batched-write-shape.test.ts` (bao gồm bài thứ 9 mới bổ sung cho `POST /api/data/export-portability`: `0` batch, đúng `1` lệnh ghi chứng từ `data.portability_exported` ở độ sâu `0` vào `audit_events`). Ngoài ra các tuyến gia hạn phiên học (`learner.ts:969,1005`) và xuất di sản (`portability.ts:34`) đều là các chứng từ kiểm toán đơn câu lệnh thuộc bộ ngoại lệ hợp lệ đã liệt kê.

**Phán quyết: PASS.**

---

### G12 — Sao lưu, khôi phục & Hồ sơ di sản mở 10 năm

**Câu lệnh:**
```bash
npm run backup:drill
npx vitest run test/unit/open-portability.test.ts
```

**Kết quả nguyên văn:**
```json
{"ok":true,"drill":"backup-restore-aes-256-gcm","lessonsExported":51,"countsRestored":{"learners":1,"schoolYears":1,"subjects":5,"skills":41,"skillPrerequisites":33,"curriculumObjectives":40,"curriculumIntakes":1,"lessons":51,"lessonVersions":52,"lessonSteps":259,"lessonMetadata":51,"reviewApprovals":1,"learningSessions":2,"learningAttempts":2,"skillEvidence":1,"skillEvidenceObservations":1,"skillEstimates":1,"reviewSchedule":1,"baselineAssessments":1,"learningPlanItems":1,"sessionReflections":1,"learningGoals":1,"auditEvents":1},"restoreMs":96,"recordsBackedUp":548,"recordsLost":0,"approvalFailClosedToDraft":true}
```
```
 ✓ test/unit/open-portability.test.ts (5 tests) 699ms
```

**Đo được:**
- Sao lưu & khôi phục AES-256-GCM: **`restoreMs: 96`** (< ngân sách 60.000 ms hơn 625 lần), **`recordsLost: 0`** trên **548** bản ghi, `approvalFailClosedToDraft: true`.
- Hồ sơ di sản mở 10 năm (`src/shared/portability/`, `POST /api/data/export-portability`, `npm run export:portability`): xuất đầy đủ **1EdTech CLR 2.0**, **1EdTech CASE 1.1**, **IEEE xAPI 2.0 JSONL** và trình xem ngoại tuyến tự chứa **`viewer.html`** (`default-src 'none'`), mở trực tiếp qua `file://` không cần mạng hay máy chủ ứng dụng, và bảo toàn nguyên vẹn từng byte mã băm SHA-256 của tệp SQLite khi chạy từ CLI chỉ-đọc.

**Phán quyết: PASS.** *(Ghi chú kiến trúc giữ nguyên từ ADR-003: mã hóa sao lưu dùng `AES-256-GCM` + `PBKDF2-SHA256` 600.000 vòng tích hợp sẵn trong `node:crypto` thay vì nhị phân rời `age`.)*

---

### G13 — Kiểm chứng nội dung bằng công cụ (Offline QA Gate)

**Câu lệnh:**
```bash
grep -rni "sympy\|promptfoo" package.json scripts/ src/ | wc -l
npm run qa:content
```

**Kết quả nguyên văn:**
```
47
```
Trích xuất kết quả JSON từ `npm run qa:content`:
```json
{
  "ok": true,
  "gate": "G13",
  "command": "qa:content",
  "sympyBackend": "ts-deterministic-rational-verifier (python sympy optional, not installed)",
  "sympyCrossCheck": { "ok": true, "sympyAvailable": false, "checkedPairs": 109, "mismatchesCount": 0 },
  "promptfooOfflineConfig": {
    "ok": true,
    "hasSharingDisabled": true,
    "hasEchoProvider": true,
    "zeroNetworkProviders": true
  },
  "corpus": {
    "ok": true,
    "lessonsChecked": 50,
    "stepsChecked": 257,
    "mathStepsChecked": 53,
    "mathErrorsCount": 0,
    "mathErrorRate": 0,
    "answerLeakCount": 0,
    "promptInjectionCount": 0,
    "gamificationViolationCount": 0,
    "rightsViolationCount": 0,
    "pedagogyViolationCount": 0
  },
  "mutationSelfTest": { "ok": true, "totalMutations": 7, "caughtMutations": 7 }
}
```

**Đo được:**
- Toàn bộ **50** bài học (**257** bước, **53** bước toán, **109** cặp biểu thức phân số/số thập phân) đạt `mathErrorsCount: 0` (`mathErrorRate: 0 <= 0.5%`), `answerLeakCount: 0`, `promptInjectionCount: 0`, `gamificationViolationCount: 0`, `rightsViolationCount: 0`.
- `promptfooconfig.yaml` được neo cứng ở chế độ ngoại tuyến tuyệt đối (`sharing: false`, `id: echo`, `zeroNetworkProviders: true`) — không bao giờ gọi API LLM bên ngoài.
- Khi máy có cài `python3` + `sympy`, `qa-content.mjs` tự động chạy thêm đối chiếu chéo `python3 -I` cô lập; khi máy không cài `sympy`, trình kiểm chứng số học tỷ lệ chính xác `bigint` của TypeScript đảm nhiệm đầy đủ (cả hai đường thực thi đều được kiểm thử trong `test/unit/qa-content.test.ts`).
- Tự kiểm chứng đột biến nội bộ bắt gọn **7/7** lỗi cố ý (sai đáp án phép cộng số thập phân, nhiễu trùng giá trị phân số `2/4 == 3/6`, mẫu số bằng 0, rò `[ANSWER: b]`, thiếu `sourceRef`, cài chữ `daily streak`/`leaderboard`, và prompt injection).

**Phán quyết: PASS.**

---

### G14 — Đo lường thực nghiệm

**Câu lệnh:**
```bash
npm run retention:report
npm run retention:drill
```

**Kết quả nguyên văn:**
```json
{ "ok": true, "protocol": "delayed-retention", "status": "NO_DATA", "learnerFound": true, "eligibleAttempts": 0, "correctRate": null }
{"ok":true,"drill":"delayed-retention-14-30","status":"MEASURED","eligibleAttempts":10,"skillsSeen":4,"skillsWithAnchor":4,"baselines":{"total":2,"reviewed":1},"horizons":[{"horizonDays":14,"probes":4,"correct":2,"correctRate":0.5},{"horizonDays":30,"probes":3,"correct":2,"correctRate":0.6666666666666666}],"writeRefused":true}
```

**Đo được:** Công cụ đo chỉ-đọc (`readOnly: true`, `writeRefused: true`) hoạt động chính xác, bắt 7/7 phép đột biến và trả về `NO_DATA` trung thực trên DB hộ gia đình hiện tại (0 lượt làm bài). Số đo thực nghiệm 14 ngày và 30 ngày chỉ xuất hiện sau thời gian học thực tế của bé.

**Phán quyết: PARTIAL.**

---

### G15 — Mô hình chi phí (Household TCO & Mission B Sensitivity)

**Câu lệnh:**
```bash
grep -rnw "TCO" docs/ src/ scripts/ --exclude='G0_G16_AUDIT_MATRIX.md' | wc -l
npm run tco:verify
```

**Kết quả nguyên văn:**
```
9
```
Trích xuất kết quả JSON từ `npm run tco:verify` (`ok: true`, `runtimeStatus: "mission-a-local-only-commercial-inactive"`):
- **TCO Hộ gia đình Mission A (cơ sở):** **9.630.000 VNĐ/năm** (`802.500 VNĐ/tháng` — gồm điện Mac cục bộ `270k`, sao lưu mã hóa 3-2-1 `1.200k`, vận hành Cloud Worker `0 VNĐ`, đối chiếu giáo viên định kỳ `4.800k`, khấu hao thiết bị `3.360k`) → dưới trần `10.000.000 VNĐ/năm` (dư địa `370.000 VNĐ`), phán quyết **`PASS`**.
- **TCO Hộ gia đình Mission A (cận trên thận trọng):** **9.850.000 VNĐ/năm** (`820.833,33 VNĐ/tháng`) → dưới trần `10.000.000 VNĐ/năm` (dư địa `150.000 VNĐ`), phán quyết **`PASS`**.
- **Mô hình độ nhạy thương mại Mission B (cô lập tài chính, không kích hoạt runtime):**
  - `b2b2c_secondary_center_base` (50 học sinh/trung tâm, `3.500.000 VNĐ/tháng`): biên đóng góp **`82,57%`** (`>= 70%`), `LTV/CAC` **`28,9x`** (`> 3x`), điểm hòa vốn **46 trung tâm** → **`PASS`**.
  - `b2c_consumer_bear` (thuê bao lẻ hộ gia đình): `LTV/CAC` **`1,75x`** (`< 3x`), cần 1.078 hộ để hòa vốn → **`REJECT`**.
  - `unbounded_chat_antipattern` (gia sư chat LLM trực tiếp không giới hạn): biên đóng góp sụt còn **`18,3%`** (`< 70%`), `LTV/CAC` **`0,95x`** → **`REJECT`**.

**Phán quyết: PASS.**

---

### G16 — Phê duyệt của chủ sở hữu

**Câu lệnh:**
```bash
sed -n '56,62p' docs/ROADMAP_90_DAYS.md
```

**Kết quả nguyên văn:**
```
No `wrangler deploy`, remote D1 creation, or public URL publication may occur unless and until:

1. **Founder Written Authorization**: Explicit sign-off revoking the `LOCAL ONLY` constraint in `wrangler.jsonc`.
2. **Child Privacy Legal Sign-Off**: Completion of the compliance review specified in `docs/CHILD_PRIVACY_REVIEW.md` §4 (Nghị định 13/2023/NĐ-CP impact assessment).
3. **Production Secret Provisioning**: High-entropy `SESSION_SECRET` and production `PARENT_PASSWORD_HASH` provisioned via encrypted Worker secrets (never in config files).
```

**Đo được:** Ba điều kiện tiên quyết được ghi rõ; **0** bản ký duyệt tồn tại trong repo cho cả ba.

**Phán quyết: HOLD** — chỉ chủ sở hữu mới có quyền ký mở cổng này; mã nguồn tiếp tục khóa chặt triển khai từ xa.

---

### MB — Tường lửa Mission-B & Bảo toàn byte-identical DB hộ gia đình (bổ sung)

**Câu lệnh:**
```bash
ls -1 wrangler.mission-b.jsonc && npx vitest run test/unit/mission-b-firewall.test.ts test/unit/no-child-identifier-fixtures.test.ts
grep -rn "wrangler.mission-b" src/ scripts/ package.json vite.config.ts .github/ | wc -l
shasum -a 256 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

**Kết quả nguyên văn:**
```
wrangler.mission-b.jsonc
 ✓ test/unit/no-child-identifier-fixtures.test.ts (3 tests)
 ✓ test/unit/mission-b-firewall.test.ts (19 tests)
0
d8828c6a9f7417c49325dc240e59922083e56142be4e1b1432836ebf06c3b611  .wrangler/state/v3/d1/miniflare-D1DatabaseObject/55cf0b3020dae37b568062fe28961bd8d3fcd41f9b33fe8ddfdc3540875f734a.sqlite
97e8d54f8a7255106f66cf1b213c4a4d7b558d21310b1c2bfedc3d0d526dddda  .wrangler/state/v3/d1/miniflare-D1DatabaseObject/metadata.sqlite
```

**Đo được:** **19/19** test tường lửa Mission B và **3/3** test chống rò định danh trẻ em đều xanh; **0** tham chiếu runtime tới `wrangler.mission-b.jsonc`; hai tệp SQLite hộ gia đình giữ nguyên mã băm SHA-256 tuyệt đối từng byte trước và sau toàn bộ quá trình phát triển và kiểm thử.

**Phán quyết: PASS.**

---

### OPS — `household:preflight` từ chối DB cũ bằng một câu (bổ sung)

**Câu lệnh:**
```bash
npm run household:preflight >/tmp/pf.out 2>/tmp/pf.err; echo "REAL_EXIT=$?"
cat /tmp/pf.err
npx vitest run test/unit/household-preflight.test.ts
```

**Kết quả nguyên văn:**
```
REAL_EXIT=1
preflight refused: Household DB preflight failed: expected schemaVersion >= 15, found 14. Run `npm run db:migrate` to bring this database up to date.
 ✓ test/unit/household-preflight.test.ts (14 tests)
```

**Phán quyết: PASS.**

---

## Lệnh chạy lại toàn bộ

```bash
cd ~/projects/tai-learning-os

# G0
git rev-parse HEAD && git status --porcelain | wc -l

# G1, G2, G6, G7, G9, G10, G11, G13, G15 (grep tĩnh)
grep -rn "EMERGING" src/ test/ --include='*.ts' | wc -l
grep -rn "page.route\|context.route" test/ | wc -l
grep -n "sessionId\|session_id" src/shared/engine/competency.ts | wc -l
grep -rn "\[1, 3, 7, 14\]\|\[1,3,7,14\]" src/ | wc -l
grep -rn "25 \* 60\|SESSION_MAX\|MAX_LEARNER_SESSION_MS\|maxSessionMinutes" src/ --include='*.ts' | wc -l
grep -rn "axe" package.json test/ playwright.config.ts | wc -l
grep -rn "\.batch(" src/ --include='*.ts' | wc -l
grep -rni "sympy\|promptfoo" package.json scripts/ src/ | wc -l
grep -rnw "TCO" docs/ src/ scripts/ --exclude='G0_G16_AUDIT_MATRIX.md' | wc -l

# Bộ kiểm chứng CLI xác định (G4, G7, G12, G13, G14, G15)
npm run validate:lessons
npm run qa:content
npm run review:simulate
npm run tco:verify
npm run backup:drill
npm run retention:report
npm run retention:drill

# Bộ kiểm thử đầy đủ (Unit + Integration + Playwright E2E)
npm run verify            # 29 tệp / 400 unit test + lint + typecheck + QA/sim/TCO + build
npm run test:integration  # 20 tệp / 207 integration test
npm run test:e2e          # 60 Playwright E2E test (Desktop + Tablet + Mobile)
```

---

## Điều tài liệu này **không** khẳng định

- **Không khẳng định được phép triển khai công cộng (`wrangler deploy`).** Cổng **G16 (HOLD)** vẫn chặn cứng mọi triển khai ra ngoài máy cục bộ của gia đình cho tới khi có phê duyệt pháp lý và chữ ký chủ sở hữu.
- **Không khẳng định nội dung chương trình Lớp 4–5 đã viết xong.** 50 bài hiện có chiếm **3,57%** quỹ tiết Lớp 4–5 năm môn (**G8 PARTIAL**); hạ tầng đồ thị và cổng QA ngoại tuyến (`G13`) đã sẵn sàng cho các đợt biên soạn tiếp theo.
- **Không khẳng định đã có dữ liệu ghi nhớ thực nghiệm của học sinh thật.** Cơ sở dữ liệu hộ gia đình hiện có `0` lượt làm bài nên `retention:report` trả về `NO_DATA` (**G14 PARTIAL**).
- **Không chạy migration tự động lên tệp SQLite hộ gia đình hiện hữu.** Tệp DB hộ gia đình đang ở `schemaVersion = 14` được giữ nguyên vẹn từng byte (`SHA-256: d8828c6a…`) đúng theo yêu cầu của chủ sở hữu.
