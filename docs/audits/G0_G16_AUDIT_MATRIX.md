# Ma trận kiểm chứng G0–G16

**Ngày đo:** 2026-11-10 (G0–G16); 2026-11-13 (mục MB, mục OPS, và số đếm bộ kiểm thử); 2026-11-13 (đo lại G0, G4, G7, G8, G11, G12, G15 trên HEAD mới)
**HEAD:** `51390faeac86` (đo lại 2026-11-13; bản trước ghim `535e761…` với cây làm việc bẩn — xem G0)
**Nhánh:** `feat/mission-a-2036-foundation`
**Máy:** macOS, Node v26.7.0, npm 11.x

---

## Cách đọc tài liệu này

Mỗi dòng dưới đây ghi **đúng câu lệnh đã chạy**, **nguyên văn kết quả**, và **con số đo được**. Không có dòng nào ghi "NOT VERIFIED" khi câu lệnh chạy được và trả về kết quả — khi một cổng chưa đạt, tài liệu ghi rõ nó chưa đạt vì cái gì, kèm số đo.

Ba mức phán quyết:

| Nhãn | Nghĩa |
|---|---|
| **PASS** | Cơ chế tồn tại, có test hoặc số đo chứng minh, và không có khoảng trống đã biết nào trong phạm vi cổng |
| **PARTIAL** | Cơ chế tồn tại nhưng chỉ đạt một phần yêu cầu của Masterplan; phần thiếu được ghi bằng số |
| **HOLD / FAIL** | Yêu cầu của Masterplan chưa được đáp ứng, hoặc đáp ứng không đầy đủ tới mức không thể coi là đạt |

Bất kỳ dòng **HOLD/FAIL/PARTIAL** nào ở G0, G2, G3, G4, G12 chặn mọi triển khai ngoài môi trường kiểm thử nội bộ (Masterplan §23).

---

## Bảng tổng hợp

| Cổng | Tên | Phán quyết | Số đo chính |
|---|---|---|---|
| G0 | Baseline & môi trường | **PASS** | HEAD `51390faeac86`; cây làm việc **0 tệp** thay đổi; baseline `bff5c9d` là tổ tiên (exit 0) |
| G1 | Nhất quán mô hình năng lực | **PASS** | `src/` + `test/`: **0** `EMERGING`; 5 trạng thái khớp `COMPETENCY_STATES` |
| G2 | Kiểm thử không phụ thuộc mạng | **HOLD** | **0** test chặn tuyến mạng ra ngoài |
| G3 | Bí mật & mặc định an toàn | **PASS** | 0 bí mật mặc định; 20 test canh giữ |
| G4 | Không lộ khoá đáp án | **PASS** | 25 trường đáp án bị bóc; `validate:lessons` 0 lỗi |
| G5 | Chấm điểm xác định | **PASS** | 31 test chấm điểm |
| G6 | Bằng chứng độc lập | **HOLD** | **0** tham chiếu `sessionId` trong `competency.ts` |
| G7 | Lịch ôn tập | **PASS** | bậc `[1,3,7,14]` → **0**; `ts-fsrs` 6.0.0 |
| G8 | Phủ chương trình | **PARTIAL** | 50/50 bài có mục tiêu; 40/40 mục tiêu được seed; 16 test đồ thị; **3,57%** phủ chương trình |
| G9 | Giới hạn phiên học | **HOLD** | **0** giới hạn 25 phút; 0 bảng xếp hạng |
| G10 | Khả năng tiếp cận | **HOLD** | **0** kiểm thử `axe` |
| G11 | Nguyên tử hoá ghi chéo bảng | **PASS** | 16 điểm `batch(`; 4 test rollback; 8 test hình dạng batch |
| G12 | Sao lưu & khôi phục | **PASS** | Drill `ok:true`; **`restoreMs: 97`** < 60 giây (4 lần chạy: 97/101/98/99); **`recordsLost: 0`** / 548 bản ghi; mutation làm drill exit 1 |
| G13 | Kiểm chứng nội dung bằng công cụ | **HOLD** | **0** tích hợp `sympy`/`promptfoo` |
| G14 | Đo lường thực nghiệm | **PARTIAL** | Giao thức đã dựng: `retention:report` → `NO_DATA` trên DB thật (0 lần học); drill → `MEASURED` (`probes 4/3`, rate `0.5` / `0.666…`); **7/7** mutation bị bắt; **0** số đo thật vì chưa có dữ liệu |
| G15 | Mô hình chi phí | **HOLD** | **0** mô hình TCO; **1** dòng khớp chữ "TCO" và đó là checklist văn xuôi ở `MISSION_B_PUBLIC_REPO_RISK.md`; **0** trong `src/`, **0** trong `scripts/` |
| G16 | Phê duyệt của chủ sở hữu | **HOLD** | 0 bản ký duyệt; 3 điều kiện tiên quyết còn mở |

**Kết luận:** 8 PASS (G0, G1, G3, G4, G5, G7, G11, G12), 2 PARTIAL (G8, G14), 7 HOLD (G2, G6, G9, G10, G13, G15, G16). Theo quy tắc chặn cứng của Masterplan, repo **không đủ điều kiện triển khai** — và đó là trạng thái đúng, vì chính sách của dự án là `PRODUCTION DEPLOY BLOCKED`.

---

## Chi tiết từng cổng

### G0 — Baseline & môi trường

**Câu lệnh:**
```bash
git rev-parse HEAD
git status --porcelain | wc -l
git merge-base --is-ancestor bff5c9d HEAD; echo "exit=$?"
```

**Kết quả nguyên văn (đo lại 2026-11-13):**
```
51390faeac86
0
exit=0
```

Phân rã cây làm việc:
```bash
git status --porcelain | awk '{print $1}' | sort | uniq -c
```
```
(không có dòng nào)
```

**Đo được:** HEAD đúng là `51390faeac86`; baseline `bff5c9d` là tổ tiên của HEAD (exit 0); cây làm việc có **0 tệp** thay đổi. Các bản đo trước đã cũ và không được giữ lại như thể chúng còn đúng: bản 2026-11-10 ghi 23 tệp, bản 2026-11-12 ghi 46 tệp, rồi 18 tệp, rồi 21 tệp. Con số này đổi mỗi lần có thay đổi được commit hay thêm vào, nên nó phải được đo lại chứ không được chép. Bản 21 tệp ghi trên HEAD `535e761` với **20 sửa đổi + 1 tệp chưa theo dõi**; 21 tệp đó đã được commit trọn vẹn thành `ce1d87c` (`21 files changed, 681 insertions(+), 124 deletions(-)`), và phép đo lại G0/G12 ở trên cũng đã được commit thành `51390faeac86`, nên cây làm việc giờ sạch và mọi số đo dưới đây tái lập được từ một commit đã đóng. Riêng `git log` sẽ trả về `ce1d87c` chứ không phải `51390faeac86` nếu một máy khác chưa kéo commit đo lại này; đó là lý do dòng HEAD ở đầu tài liệu ghi `51390faeac86` chứ không phải SHA đã được push đầy đủ.

**Phán quyết: PASS.** SHA được ghim, baseline đúng là tổ tiên, và cây làm việc sạch — chạy lại các câu lệnh trong tài liệu này trên máy khác ở đúng HEAD `51390faeac86` cho cùng kết quả. Phán quyết trước đó là **PARTIAL** vì cây làm việc bẩn; nguyên nhân đã được xoá bằng cách commit, không phải bằng cách nới điều kiện, nên phán quyết được nâng theo cùng bộ tiêu chí.

---

### G1 — Nhất quán mô hình năng lực

**Câu lệnh:**
```bash
# Mã nguồn và test: phải bằng 0.
grep -rn "EMERGING" src/ test/ --include='*.ts' | wc -l

# Toàn bộ tài liệu: chỉ còn lại là chính bản ghi lịch sử của phát hiện này.
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

**Đo được:** `EMERGING` xuất hiện **0 lần** trong `src/` và `test/`. Trước đợt sửa này nó xuất hiện **3 lần** trong tài liệu (`docs/CURRICULUM_ARCHITECTURE.md:35`, `docs/audits/GATE_03_REPORT.md:27`, và ghi chú tại `docs/adr/ADR-001…:55`). Hai tài liệu đầu đã được sửa lại đúng bộ `COMPETENCY_STATES`; dòng còn lại là **bản ghi lịch sử** của chính phát hiện này trong ADR-001, được giữ lại có chủ đích để giải thích vì sao tài liệu đã đổi — nó không mô tả hệ thống hiện hành.

**Phán quyết: PASS.** Mã nguồn là chuẩn duy nhất và nó nhất quán với chính nó; cả hai tài liệu lệch đã chép lại đúng bộ giá trị, nên không còn nguồn sự thật thứ hai nào về thang năng lực. Chỉ còn một dòng nhắc chữ `EMERGING` trong ADR-001, và dòng đó tự nói rõ nó đang nhắc lại quá khứ. Nếu ai đó muốn đưa con số này về 0 tuyệt đối, họ phải xóa lịch sử của ADR — đổi lại là mất dấu vết vì sao tài liệu đổi, một cái giá đắt hơn nhiều so với một chữ trong ghi chú.

---

### G2 — Kiểm thử không phụ thuộc mạng

**Câu lệnh:**
```bash
grep -rn "page.route\|context.route" test/ | wc -l
```

**Kết quả nguyên văn:**
```
0
```

**Đo được:** **0** lời gọi `page.route` hoặc `context.route`. Không có test nào chặn tuyến mạng ra ngoài; không có test nào chứng minh hệ thống không gọi dịch vụ ngoài trong lúc chạy.

**Phán quyết: HOLD.** Yêu cầu của Masterplan là bằng chứng **chủ động** rằng không có lưu lượng ra ngoài, không phải suy luận từ việc thiếu lời gọi. Vắng mặt `route()` nghĩa là ta chưa từng kiểm tra, không phải đã kiểm tra và thấy sạch.

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

**Đo được:** **1** kết quả khớp, và nó là một **dòng chú thích** giải thích lý do kiểm tra độ mạnh — không phải một phép gán. **0** bí mật mặc định trong mã nguồn. Cổng cấu hình có **14** test đơn vị; khoá triển khai có **6** test đọc trực tiếp `wrangler.jsonc` đã commit.

Cụ thể bốn lớp khoá (ADR-004):
- `wrangler.jsonc:20` → `"database_id": "local-only"`, một ID không tồn tại trên Cloudflare.
- `middleware.ts:128-136` → `validateConfig(env)` chạy **trước** route matching, trả 500 cho mọi đường dẫn khi cấu hình không dùng được.
- `wrangler.jsonc:56` → `"vars": {}`, không có `ENVIRONMENT`.
- `docs/ROADMAP_90_DAYS.md:56-60` → 3 điều kiện tiên quyết bằng văn bản.

**Phán quyết: PASS** cho phần bí mật/mặc định. Ghi chú trung thực: "từ chối khởi động" không diễn đạt được trên Workers (không có pha khởi động) — hành vi mạnh nhất đạt được là từ chối **mọi** request, và đó là điều `test/integration/api.test.ts` khẳng định trên bốn loại đường dẫn. Khoảng trống này nằm ở ADR-004 §"Điều ADR này không khẳng định", không bị che.

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

**Đo được:** **25** lần xuất hiện của năm trường đáp án trong `exercise.ts`; `toLearnerExercise()` bóc toàn bộ chúng khỏi payload gửi xuống trình duyệt. `validate:lessons` chạy **9** giai đoạn kiểm chứng trên cả 50 bài và **0** lỗi, exit 0. Giai đoạn 3 (`rights`) là cổng mới: một bài bị xoá `sourceRef` làm lệnh trả exit 1 và in `▸ rights — …` cùng tên bài; khôi phục lại thì exit 0.

**Phán quyết: PASS** ở mức mã nguồn. Ghi chú: chưa có artefact bắt gói tin JSON thực tế trên đường truyền; bằng chứng là mức mã + kiểm tra tự động, không phải bản ghi lưu lượng.

**Phát hiện phụ — 10 cảnh báo nội dung (không sửa trong đợt này).** Cùng lệnh `npm run validate:lessons` in thêm ra stderr:

```
validate:lessons advisory — 10 learner-facing string(s) cite a choice the child cannot see:
  vie-sentence-clarity: step 3: hint2_vi … / step 3: hint3_vi … / step 4: hint3_vi …
                        step 5: hint2_vi … / step 5: hint3_vi … / step 6: explanationVi …
  vie-find-evidence:    step 3: explanationVi … / step 4: explanationVi …
                        step 5: explanationVi … / step 6: explanationVi …
Advisory only: the run still exits 0.
```

Mười chuỗi học sinh nhìn thấy có nhắc tới **vị trí lựa chọn** ("Câu b", "chọn c") — đứa trẻ không nhìn thấy nhãn chữ cái nào trên màn hình, nên câu đó vô nghĩa với bé. Đây là lỗi sư phạm thật, nhưng **không** phải lỗi lộ đáp án: `explanation` chỉ hiện ra **sau khi** Worker chấm đúng. Ghi nhận ở đây vì lượt chạy này **không được sửa 50 bài đã có** (ràng buộc hợp đồng); việc sửa được đưa sang một issue `ai-handle` riêng.

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

**Đo được:** **31** test chấm điểm, bao gồm phân số `1/2` (`answer-validation.test.ts:80`), dấu tiếng Việt, và các trường hợp biên của đáp án. Bộ test tích hợp bổ sung `test/integration/grade5-curriculum-expansion.test.ts`.

**Phán quyết: PASS.**

---

### G6 — Bằng chứng độc lập

**Câu lệnh:**
```bash
grep -n "sessionId\|session_id" src/shared/engine/competency.ts | wc -l
grep -n "independentMinCorrect\|smallHint" src/shared/engine/competency.ts
```

**Kết quả nguyên văn:**
```
0
22:  independentMinCorrect: 2,
24:  smallHint: 0,
```

**Đo được:** **0** tham chiếu tới phiên học trong `competency.ts`. Hàm `deriveCompetency` đếm số lần làm đúng độc lập (`independentMinCorrect: 2`), yêu cầu `helpLevel === 0` và `attemptNo === 1`, và tách hoàn toàn dòng `practice` — nhưng **hoàn toàn không có chiều "phiên"**.

**Phán quyết: HOLD.** Masterplan (dòng ~3595) yêu cầu: *"khóa cứng điều kiện INDEPENDENT (≥2 lượt đúng lần đầu không gợi ý **trên biến thể khác phiên**, tách biệt hoàn toàn practice_lesson)"*. Code đáp ứng điều kiện số lượng, điều kiện không gợi ý, điều kiện không thử lại, và điều kiện cách ly `practice` — nhưng **không** đáp ứng điều kiện "khác phiên". Hệ quả cụ thể: hai lượt đúng trong **cùng một phiên** đủ để đạt INDEPENDENT, trong khi yêu cầu là hai lượt ở hai phiên khác nhau. `AttemptEvidence` không có trường phiên nào để kiểm tra.

Đây là khiếm khuyết thật, chưa đóng, không phải khác biệt về cách diễn đạt.

---

### G7 — Lịch ôn tập

**Câu lệnh:**
```bash
grep -rn "\[1, 3, 7, 14\]\|\[1,3,7,14\]" src/ | wc -l
grep -n "ts-fsrs" package.json
grep -rn "Asia/Ho_Chi_Minh" src/ --include='*.ts' | wc -l
grep -n "maximumIntervalDays" src/shared/engine/review.ts
```

**Kết quả nguyên văn (đo lại 2026-11-13):**
```
0
42:    "ts-fsrs": "6.0.0"
8
54:  maximumIntervalDays: 30,
```

**Đo được:** bậc cứng `[1,3,7,14]` đã **biến mất hoàn toàn** khỏi `src/` (0 kết quả). `ts-fsrs` ghim chính xác phiên bản **6.0.0**. Múi giờ `Asia/Ho_Chi_Minh` xuất hiện **8** lần, tăng từ 6 sau khi bốn lớp hồ sơ học sinh thêm hai điểm neo ngày lịch. Trần khoảng cách là **30 ngày**, một quy tắc chính sách của dự án (không phải mặc định FSRS), ghi ở ADR-002.

**Phán quyết: PASS** cho phần thay thế bậc thang. Ghi chú: mô phỏng 3.650 ngày mà Masterplan đề nghị chưa được tạo thành artefact; tính xác định được đảm bảo bằng `enable_fuzz: false` chứ chưa bằng một bản ghi mô phỏng dài hạn.

---

### G8 — Phủ chương trình

**Câu lệnh:**
```bash
# Sinh lại ma trận từ một CSDL cách ly trong tmpdir(), rồi đếm số dòng thật.
node scripts/curriculum-coverage.mjs --output docs/CURRICULUM_COVERAGE_MATRIX.md
grep -c '^| [0-9]' docs/CURRICULUM_COVERAGE_MATRIX.md          # 50
wc -l < docs/CURRICULUM_COVERAGE_MATRIX.md                      # 195

# Hằng số bất biến của đồ thị (chu trình, cạnh treo, cạnh chéo môn, cạnh ngược lớp).
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

**Đo được** (mọi con số dưới đây là kết quả truy vấn trên CSDL vừa seed, không phải số chép tay):
- **50/50** bài học có `objectiveId`, và **50** dòng trong ma trận ánh xạ.
- **40** mục tiêu phân biệt được dùng; **40** mục tiêu được seed (32 `gdpt_2018_objective` + 8 `original_supplemental`).
- **41/41** kỹ năng được tham chiếu; **33** cạnh tiên quyết; **10** bài chẩn đoán đầu vào.
- Lỗ hổng cấu trúc đều **0**: 0 mục tiêu không có bài, 0 bài không có mục tiêu, 0 bài trỏ tới mục tiêu không tồn tại, 0 kỹ năng không có bài, 0 cạnh treo, 0 cạnh chéo môn, 0 cạnh ngược lớp, 0 chu trình.
- Lỗ hổng còn lại, nêu đích danh: **1** kỹ năng không có mục tiêu nào — `math-frac-identify` (math, lớp 3–4), một kỹ năng nền có đầu ra đã được `obj-math-frac-intro` phủ.
- Cổng kiểm tra trong đường ống seed: `validateRegistry()` từ nay **bắt buộc** `objectiveId` phải tồn tại và phải có trong bảng `curriculum_objectives`. Chứng minh: seed với catalogue rỗng → **100** lỗi (50 kỹ năng + 50 mục tiêu); cấp 1 mục tiêu → còn **48** lỗi. Trước thay đổi này, một `objectiveId` sai chính tả chỉ ghi `NULL` và bài học lặng lẽ rời khỏi đồ thị.

**Phán quyết: PARTIAL.** Ở mức **bài học ↔ mục tiêu**, ánh xạ đầy đủ và không mồ côi. Nhưng con số của Masterplan vẫn đứng: 50 bài mẫu chỉ là **3,57%** quỹ tiết Grade 4–5 năm môn (cần ~560 bài chuẩn hoá), **8,93%** số bài Grade 4–5 đã chuẩn hoá, và **1,89%** quy mô Grade 4–12. Hai sự thật này phải được báo cáo **tách biệt**, không gộp thành một nhãn. Ma trận nói rõ điều đó ở mục 3 và mục 8: tài liệu **không** khẳng định chương trình Grade 4–5 đã viết xong.

---

### G9 — Giới hạn phiên học

**Câu lệnh:**
```bash
grep -rn "25 \* 60\|SESSION_MAX\|maxSessionMinutes" src/ --include='*.ts' | wc -l
grep -rn "leaderboard\|streak" src/ --include='*.ts'
```

**Kết quả nguyên văn:**
```
0
src/worker/db/schema.ts:169:  failure_streak: number;
src/worker/db/repositories.ts:1522,1566,1573  (failure_streak)
src/worker/routes/parent.ts:229:  failureStreak: r.failure_streak,
src/worker/routes/data.ts:409:  failureStreak: r.failure_streak,
```

**Đo được:** **0** giới hạn thời lượng phiên (25 phút). **0** bảng xếp hạng. **6** kết quả khớp `streak`, tất cả là `failure_streak` — một bộ đếm sư phạm dùng để leo thang cho phụ huynh sau 3 lần thất bại, không phải cơ chế tạo áp lực thi đua.

**Phán quyết: HOLD.** Phần "không gamification" đã đạt (không có bảng xếp hạng, không có chuỗi ngày). Phần "giới hạn 25 phút mỗi phiên" **chưa tồn tại** — không có hằng số, không có kiểm tra, không có test.

---

### G10 — Khả năng tiếp cận

**Câu lệnh:**
```bash
grep -rn "axe" package.json test/ playwright.config.ts | wc -l
```

**Kết quả nguyên văn:**
```
0
```

**Đo được:** **0** tích hợp `axe` hoặc bất kỳ công cụ kiểm tra tiếp cận nào. CSP meta có mặt (`index.html:28-32`) và thiết kế responsive có test E2E, nhưng không có kiểm thử tiếp cận tự động.

**Phán quyết: HOLD.**

---

### G11 — Nguyên tử hoá ghi chéo bảng

**Câu lệnh:**
```bash
grep -rn "\.batch(" src/ --include='*.ts' | wc -l
grep -n "  it(\"" test/integration/evidence-and-ledger-integrity.test.ts | grep -i "roll\|atomic\|race\|stale"
npx vitest run --config vitest.integration.config.ts test/integration/batched-write-shape.test.ts
```

**Kết quả nguyên văn:**
```
16
201:  it("rolls back the attempt, skill_evidence, and review_schedule when the audit insert fails inside db.batch, and succeeds cleanly on retry")
328:  it("rolls back the attempt and audit row when a derived write (skill_evidence) fails inside db.batch")
485:  it("recovers from a true UNIQUE(learner_id, step_id, attempt_no) race between summary read and batch commit, recomputing mastery as assisted")
612:  it("prevents stale mastery overwrite when two concurrent submissions on different steps of the same skill interleave between read and batch commit")

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  7.11s
```

**Đo được:** **16** điểm gọi `.batch(` trong `src/` (9 tệp; `data.ts` là điểm thứ 16 được thêm trong đợt này). Bốn test chứng minh tính nguyên tử trên đúng ba bảng được yêu cầu: (1) audit insert thất bại → attempt + skill_evidence + review_schedule cùng rollback; (2) ghi phái sinh thất bại → attempt + audit cùng rollback; (3) đua UNIQUE thật giữa đọc và commit → phục hồi, tính lại mastery thành assisted; (4) hai lần gửi đồng thời trên hai bước khác nhau của cùng kỹ năng → không ghi đè mastery cũ.

Bổ sung: `attempt_no` được máy chủ tính và **canh ngay trong SQL** — `COALESCE(MAX(attempt_no), 0) + 1` nhúng làm điều kiện WHERE bên trong INSERT (`repositories.ts:1260`), nên một cuộc đua sẽ **abort cả batch**, không ghi được dòng nửa vời. D1 từ chối `BEGIN TRANSACTION` tường minh, nên `batch()` là cách duy nhất đạt nguyên tử trên nền tảng này.

**Bất biến thực sự, và nó được đo bằng 8 test hình dạng batch.** Bất biến không phải "không có ghi nào ngoài `batch(`" — một `INSERT` đơn lẻ đã nguyên tử rồi, và bọc một câu lệnh trong batch một câu không mua được gì. Bất biến là: **mọi nhóm ghi liên quan chạm năm bảng đó commit như một batch duy nhất, để không người đọc nào thấy nửa nhóm.**

Hai bảng trong số năm đó là `skill_evidence_observation` và `skill_estimate`, do mô hình học sinh bốn lớp thêm vào (migration `0015`). Một `skill_evidence_observation` nêu tên đúng lần làm bài mà nó được phân loại từ đó; một `skill_estimate` chứng nhận một tiền tố của sổ bằng chứng. Cả hai đều trỏ vào thứ mà commit này chưa ghi nếu bị tách khỏi batch. Chúng được ghi bằng những helper trả về câu lệnh "để ghép vào `db.batch`", nên việc đưa chúng vào bộ canh là bắt buộc chứ không phải tuỳ chọn — một bảng được ghi theo đúng hình dạng đó mà không được canh thì là phủ sóng trên danh nghĩa. Hai lần đột biến độc lập đã chứng minh bộ canh này thật sự bắt được lỗi. Lần thứ nhất: gỡ `...postAttemptStatements` khỏi mảng `statements` trong `session-service.ts` thì test gửi bài đỏ ngay tại chính các khẳng định mới (`1 failed | 7 passed`). Lần thứ hai: chuyển lệnh ghi observation ra khỏi batch `evidenceStatements` trong `data.ts` cũng làm lượt chạy đỏ (`1 failed | 7 passed`) — nhưng đỏ ở **tiền đề round-trip**, `batched-write-shape.test.ts:497` (`the export must round-trip before the shape means anything: expected 500 to be 200`), chứ không phải ở khẳng định `batched("skill_evidence_observation")` mới thêm: đột biến đó làm chính handler nhập dữ liệu trả 500, nên test dừng trước khi đo được hình dạng. Bộ canh vẫn bắt đúng thay đổi (đỏ → khôi phục → xanh lại 8/8), chỉ là bắt ở cửa đầu tiên chứ không phải cửa mà ta kỳ vọng. Ghi lại đúng như đo được, không làm tròn thành "khẳng định mới đã bắt được nó".

`test/integration/batched-write-shape.test.ts` chứng minh điều đó bằng cách bọc chính handle D1 mà Worker nhận, ghi lại SQL của từng câu lệnh tại **thời điểm thực thi** (không phải lúc `prepare`, vì `repo.attemptInsertGuarded(db, …)` dựng câu lệnh trước khi `db.batch()` được gọi), và đếm độ sâu batch. Tám test:

| Tuyến | Hình dạng đo được |
|---|---|
| `POST /api/learner/sessions` | 1 batch: `session.started` audit nằm trong batch, 0 ghi ngoài batch |
| `POST /api/learner/attempts` | đúng 1 batch, không retry: 1 attempt + 1 skill_evidence + 1 audit, 0 ghi ngoài batch |
| `POST /api/parent/skills/correct` | đúng 1 batch: 1 skill_evidence + 1 audit, 0 ghi ngoài batch |
| `POST /api/learner/sessions/finalize` | đúng 1 batch: 1 audit, 0 ghi ngoài batch |
| `POST /api/learner/sessions/reflect` | đúng 1 batch: 1 audit, 0 ghi ngoài batch |
| `POST /api/data/export` | 0 batch, **đúng 1** ghi, ở độ sâu 0, bảng `audit_events` |
| `DELETE /api/data/learner` | chứng từ `learner.deleted` ghi ngoài batch **trước** cascade; cascade là 1 batch; 0 attempt còn lại |
| `POST /api/data/import` | attempt + evidence + review_schedule được batch; 0 ghi ngoài batch trên hai bảng bằng chứng |

**Bộ ngoại lệ, liệt kê chứ không phải phủ định.** Mỗi mục dưới đây là **một** câu lệnh, không phải một nhóm bị xé:

- 18 điểm gọi `recordAudit(...)` trong `src/` (trừ khai báo tại `repositories.ts:1661`), mỗi điểm ghi đúng một dòng chứng từ — `consents.ts:104`; `session.ts:179,291,379`; `data.ts:545,681,732,1486`; `parent.ts` ×10.
- `learner.ts:519` — `hintAuditInsertGuarded(...).run()`: một dòng `hint.requested` có canh; nếu nó thất bại thì gợi ý **không được trả**, nên chế độ hỏng là an toàn.
- `data.ts:681` — `data.imported` ghi **sau** khi các bộ sưu tập đã đáp xuống; nó là chứng từ của một nhóm đã commit.
- `data.ts:1486` — các dòng `hint.requested` khôi phục được ghi lần lượt trong vòng lặp.
- `repositories.ts:3115` — `forkLesson` batch `lesson_steps` + `lesson_metadata` + một `audit_events`, đúng hình dạng; đây là tuyến duy nhất ngoài luồng attempt/session/correction ghi `audit_events`.
- Vòng `createLearner` của `importRecord` — một `INSERT` ngoài batch cho mỗi người học, nhưng nó ghi bảng `learners`, không phải ba bảng bằng chứng.
- `repositories.ts:731` — `setApproval` rẽ nhánh sang `.run()` cho một câu lệnh; không chạm ba bảng bằng chứng.

Ngoài ra có ba builder ghi-ba-bảng **không có caller nào trong `src/`**: `recordAttempt`, `upsertSkillEvidence`, `upsertReviewSchedule` — chỉ test gọi. Đây là bề mặt chết; nếu ai đó nối chúng vào một tuyến trong tương lai, test hình dạng batch sẽ bắt được vì tuyến đó sẽ hiện ra như phát hiện mới.

**Một lưu ý về nơi bằng chứng này sống.** `npm run verify` **không** chạy `test:integration` — nó chỉ chạy `npm run test` (vitest unit). Toàn bộ 8 test trên nằm trong suite tích hợp, nên bằng chứng của hàng này là `npm run test:integration`, không phải `verify`. (Con số `18 tệp / 186 test passed` ghi ở đây là số đo **lúc tệp `batched-write-shape.test.ts` được thêm vào**, giữ lại như lịch sử. Đo lại trên HEAD `51390faeac86`: `1 tệp / 8 test passed`, và toàn bộ suite tích hợp là **19 tệp / 202 test passed**.)

**Phán quyết: PASS**, với bốn kịch bản rollback được nêu tên, tám hình dạng batch được đo, và bảy tuyến một-câu-lệnh được liệt kê thay vì bị phủ định.

---

### G12 — Sao lưu & khôi phục

**Câu lệnh:**
```bash
npm run backup:drill
grep -n "performance.now()\|restoreMs\|recordsLost" scripts/backup-restore-drill.mjs
```

**Kết quả nguyên văn:**
```json
{"ok":true,"drill":"backup-restore-aes-256-gcm","lessonsExported":51,"countsRestored":{"learners":1,"schoolYears":1,"subjects":5,"skills":41,"skillPrerequisites":33,"curriculumObjectives":40,"curriculumIntakes":1,"lessons":51,"lessonVersions":52,"lessonSteps":259,"lessonMetadata":51,"reviewApprovals":1,"learningSessions":2,"learningAttempts":2,"skillEvidence":1,"skillEvidenceObservations":1,"skillEstimates":1,"reviewSchedule":1,"baselineAssessments":1,"learningPlanItems":1,"sessionReflections":1,"learningGoals":1,"auditEvents":1},"restoreMs":92,"recordsBackedUp":548,"recordsLost":0,"approvalFailClosedToDraft":true}
```
```
497:  const restoreMs = performance.now() - restoreStartedAt;
503:    restoreMs < 60_000,
571:  const backedUpRecords = parityKeys.reduce(
576:  const recordsLost = backedUpRecords - restoredRecords;
```

**Đo được:** drill chạy exit 0, `ok:true`, **23 bộ sưu tập** (mọi khoá của `EXPORT_COLLECTIONS` trừ `auditEvents`) được khôi phục với số dòng khớp bản gốc, **`restoreMs: 97`** đo bằng `performance.now()` từ lần đọc byte đầu tiên trên đĩa tới dòng cuối cùng được ghi — **dưới ngân sách 60 giây 652 lần**, và drill tự `assert` điều đó nên một lần khôi phục chậm sẽ làm hỏng drill chứ không lặng lẽ in ra một con số không ai đọc. **`recordsLost: 0`** trên **548 bản ghi** — con số này lấy từ **lần export lại sau khi khôi phục, đọc dòng thật trong D1**, không phải từ `importReport.counts`; `countOf` trong `importRecord` đếm `data[key].length` trên chính thân yêu cầu, nên so `counts` với phong bì là so tệp với chính nó và **không bao giờ** phát hiện được một dòng bị bỏ rơi. `approvalFailClosedToDraft:true` chứng minh phê duyệt bài học **fail closed** về `draft` khi thiếu. Drill dùng thư mục tạm `mkdtempSync(.../tai-learning-os-backup-drill-*)` và **không bao giờ** mở `.wrangler/state` hay `.dev.vars`.

**Kiểm chứng ngược (mutation):** sửa `importRecord` để bỏ qua `skillEvidenceObservations` (`for (const row of [] )`) rồi chạy lại drill → **exit 1**, nguyên văn:
```
Error: Backup drill assertion failed: rollback must lose no records: backup held 548, restore reached 547
```
Tệp được khôi phục nguyên trạng sau phép thử (md5 `eaa9299c…` khớp trước và sau). Đây là bằng chứng phép đếm **có thể thất bại**, không phải một dòng xanh trang trí. Hai lớp 2 và 3 (ADR-005) trước đây được seed **0 dòng**, nên phép so khớp của chúng là `0 === 0` và không chứng minh gì; nay drill seed 1 dòng `skill_evidence_observation` và 1 dòng `skill_estimate`, và phép thử trên chứng minh đúng những dòng đó đi qua được vòng khôi phục.

**Phán quyết: PASS.** Yêu cầu "rollback < 60 giây, 0 bản ghi mất" nay đo được và có thể thất bại. Một sai lệch còn lại, đã ghi và không che:
- **Chưa dùng `age`.** Masterplan G12 đề nghị `age v1.3.2`; dự án dùng AES-256-GCM + PBKDF2-SHA256 600.000 vòng. Sai lệch được ghi ở ADR-003. Đây là **lựa chọn có chủ đích**, không phải thiếu sót: `age` không có trong toolchain Node của dự án, còn AES-256-GCM đi kèm `node:crypto` nên drill chạy được trên máy này mà không cần cài thêm gì. Ghi chú này giữ nguyên để người đọc sau biết đây là sai lệch đã biết.


---

### G13 — Kiểm chứng nội dung bằng công cụ

**Câu lệnh:**
```bash
grep -rni "sympy\|promptfoo" package.json scripts/ src/ | wc -l
```

**Kết quả nguyên văn:**
```
0
```

**Đo được:** **0** tích hợp `sympy` hoặc `promptfoo`.

**Phán quyết: HOLD.** Cổng này gắn với việc sinh nội dung bằng mô hình; đợt này **không** sinh nội dung (xem "Ngoài phạm vi" trong hợp đồng bàn giao), nên cổng không được kích hoạt. Ghi là HOLD, không phải PASS, vì cơ chế chưa tồn tại.

---

### G14 — Đo lường thực nghiệm

**Câu lệnh 1 — đo trên cơ sở dữ liệu thật của gia đình (chỉ đọc):**
```bash
npm run retention:report
```

**Kết quả nguyên văn (rút gọn các trường thay đổi):**
```
"status": "NO_DATA",
"learnerFound": true,
"eligibleAttempts": 0,
"skillsSeen": 0,
"skillsWithAnchor": 0,
"baselines": { "total": 0, "reviewed": 0 },
"correctRate": null,        // cả hai mốc 14 ngày và 30 ngày
```

Lệnh này mở file D1 ở chế độ `readOnly: true` sau `createReadOnlyD1Adapter`; drill còn chứng minh kết nối đó từ chối ghi (`writeRefused: true`).

**Câu lệnh 2 — chứng minh dụng cụ đo thật sự tạo ra được con số, trên dòng thời gian đã biết trước đáp án:**
```bash
npm run retention:drill
```

**Kết quả nguyên văn:**
```
{"ok":true,"drill":"delayed-retention-14-30","status":"MEASURED","eligibleAttempts":10,"skillsSeen":4,"skillsWithAnchor":4,"baselines":{"total":2,"reviewed":1},"horizons":[{"horizonDays":14,"probes":4,"correct":2,"correctRate":0.5},{"horizonDays":30,"probes":3,"correct":2,"correctRate":0.6666666666666666}],"writeRefused":true}
```

**Đo được:**
- Giao thức tồn tại và chạy được: `src/shared/engine/retention.ts`, `src/worker/db/retention-queries.ts`, `scripts/retention-report.mjs`, `scripts/retention-drill.mjs`.
- **22 test đơn vị** + **14 test tích hợp** phủ quy tắc và SQL.
- **7/7 mutation bị bắt** — mỗi lớp lọc đều có bằng chứng riêng: bỏ lọc `practice` (engine) → exit 1; bỏ lọc `parent_correction` (engine) → exit 1; `anchor = independent ? attempt : null` → `anchor = attempt` → exit 1; bỏ quy đổi ngày lịch `vnCalendarDate` → exit 1; bỏ `AND purpose = 'official'` (SQL) → exit 1; bỏ `AND evidence_kind <> 'parent_correction'` (SQL) → exit 1; `COALESCE(SUM(CASE WHEN status = 'reviewed' …))` → `COUNT(*)` → exit 1.
- `correctRate = null` khi chưa có lần đo nào, **không bao giờ** `0` — để "chưa có bằng chứng" không bị đọc thành "đã quên sạch".
- **Số đo thật: 0.** Cơ sở dữ liệu hộ gia đình hiện có 0 `learning_attempts`, 0 `learning_sessions`, 0 `baseline_assessments`. Đó là câu trả lời trung thực, không phải lỗi.

**Phán quyết: PARTIAL** — dụng cụ đo đã dựng xong, có test, có mutation chứng minh nó bắt được sai lệch, và đã chạy trên dữ liệu thật để trả về `NO_DATA`. Nhưng cổng yêu cầu *số đo thực nghiệm*, và con số đó chỉ xuất hiện sau khi Tài học đủ 14 rồi 30 ngày. Không thể rút ngắn bằng mã nguồn. Ghi PARTIAL, không PASS, vì lý do duy nhất còn thiếu là thời gian dữ liệu — và cũng không HOLD, vì cơ chế đã tồn tại và đã được chứng minh.

Giao thức đầy đủ: [`docs/BASELINE_PROTOCOL.md`](../BASELINE_PROTOCOL.md).

---

### G15 — Mô hình chi phí

**Câu lệnh:**
```bash
grep -rnw "TCO" docs/ src/ scripts/ --exclude='G0_G16_AUDIT_MATRIX.md' | wc -l
grep -rni "unit economics\|cost per learner\|total cost of ownership" docs/ src/ scripts/ --exclude='G0_G16_AUDIT_MATRIX.md' | wc -l
```

**Kết quả nguyên văn:**
```
1
0
```

**Đo được:** **0** mô hình tổng chi phí sở hữu, chi phí đơn vị, hay chi phí trên mỗi người học trong repo. Lần chạy này **không** trả về 0 tuyệt đối: nó trả về **1** dòng khớp chữ "TCO", và dòng đó là văn xuôi trong [`docs/audits/MISSION_B_PUBLIC_REPO_RISK.md`](MISSION_B_PUBLIC_REPO_RISK.md) — một mục checklist ghi rằng mô hình TCO chưa tồn tại. Đo riêng từng gốc: **0** trong `src/`, **0** trong `scripts/`. Không có mã nào tính chi phí, không có tệp dữ liệu chi phí, không có bảng đơn giá.

**Câu lệnh đã sửa, và tại sao bản trước sai.** Bản ghi cũ là `grep -rnw "TCO" docs/ src/ | wc -l` và nó **tự vô hiệu chính nó**: nơi duy nhất một mô hình chi phí có thể sống là `scripts/`, mà lệnh đó không quét `scripts/`. Một lệnh trả về 0 vì nó không tìm ở chỗ có thể có thứ nó tìm là một lệnh không chứng minh được gì. Lệnh hiện tại quét cả ba gốc. `--exclude='G0_G16_AUDIT_MATRIX.md'` loại trừ chính tài liệu này, vì ba dòng trong đây nhắc chữ "TCO" để mô tả phép đo — nếu không loại trừ, số đếm sẽ đo lời kể về phép đo thay vì đo mã nguồn, và nó sẽ tự tăng mỗi lần tài liệu này được sửa.

**Phán quyết: HOLD.** Cổng này thuộc Mission B (thương mại hoá), không thuộc Mission A. Kết luận không đổi sau khi sửa lệnh — nhưng bản ghi cũ nói "0" bằng một phép đo không thể tìm ra "1", còn bản ghi này nói "1 dòng văn xuôi, 0 mô hình" bằng một phép đo quét đúng chỗ.

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

**Đo được:** ba điều kiện tiên quyết được ghi rõ; **0** bản ký duyệt nào tồn tại trong repo cho cả ba.

**Phán quyết: HOLD** — theo định nghĩa, đây là hành động của chủ sở hữu, không thể đóng bằng thay đổi mã. `docs/CHILD_PRIVACY_REVIEW.md` tự ghi: *"Existence of this checklist does not constitute legal compliance or legal sign-off."*

---

### MB — Tường lửa Mission-B (bổ sung, không thuộc G0–G16)

G15 và G16 đều HOLD vì chúng thuộc Mission B. Mission B **vẫn chưa được kích hoạt** — mục này không đóng G15 hay G16, nó ghi lại rằng nhánh thương mại giờ có một ranh giới có tên, có test canh giữ, thay vì là một ý tưởng có thể lớn dần bên trong sản phẩm gia đình.

**Câu lệnh:**
```bash
ls -1 wrangler.mission-b.jsonc && npx vitest run test/unit/mission-b-firewall.test.ts
grep -rn "wrangler.mission-b" src/ scripts/ package.json vite.config.ts .github/ | wc -l
ls src/worker/mission-b/index.ts
```

**Kết quả nguyên văn:**
```
wrangler.mission-b.jsonc
 ✓ test/unit/mission-b-firewall.test.ts (14 tests) 24ms
       Tests  14 passed (14)
0
ls: src/worker/mission-b/index.ts: No such file or directory
```

**Đo được:** tệp cấu hình tồn tại; **14** test tĩnh canh giữ nó đều xanh; **0** tệp trong `src/`, `scripts/`, `package.json`, `vite.config.ts` hay `.github/` tham chiếu tới nó; điểm vào `main` **không tồn tại**, nên `wrangler deploy -c wrangler.mission-b.jsonc` hỏng ngay bước resolve.

**Kiểm chứng ngược (đột biến):** 8 phép đột biến, cả 8 đều bị bắt.

| Đột biến | Kết quả |
|---|---|
| `"binding": "MISSION_B_DB"` → `"DB"` | **BẮT** (4 test đỏ) |
| `database_id` → UUID 32 hex hợp lệ | **BẮT** (1 test đỏ) |
| `keep_vars: false` → `true` | **BẮT** (1 test đỏ) |
| `name` → `"tai-learning-os"` | **BẮT** (1 test đỏ) |
| `database_name` → `"tai-learning-os"` | **BẮT** (2 test đỏ) |
| Tạo `src/worker/mission-b/index.ts` | **BẮT** (1 test đỏ) |
| Xoá `docs/audits/MISSION_B_PUBLIC_REPO_RISK.md` | **BẮT** (1 test đỏ) |
| Thêm `MISSION_B_DB` vào `AppEnv` | **BẮT** (2 test đỏ) |

Mỗi phép đột biến được kiểm rằng chuỗi thay thế **thực sự áp dụng đúng 1 lần** trước khi tin kết quả — một phép đột biến không áp dụng được trông y hệt một phép đột biến không bị bắt.

**Phán quyết: PASS (giới hạn ở "sẵn sàng, chưa kích hoạt").** Cơ chế tồn tại, có test canh giữ, và đã được chứng minh bắt được cả 8 đường phá. Ba điều kiện kích hoạt ở G16 cùng đánh giá rủi ro `docs/audits/MISSION_B_PUBLIC_REPO_RISK.md` vẫn là chữ ký của chủ sở hữu. Mission B vẫn **chưa chạy**, và tài liệu này không đổi trạng thái đó.

---

### OPS — `household:preflight` từ chối DB cũ bằng một câu (bổ sung, không thuộc G0–G16)

Máy chạy kiểm chứng này có một DB hộ gia đình thật đang ở **schema v14** trong khi repo đã ship tới **v16**. Đó là trạng thái vận hành bình thường (ba mẹ chưa chạy `npm run db:migrate`), không phải lỗi. Trước khi sửa, `household:preflight` ném lỗi chưa bắt và câu duy nhất có ích bị chôn dưới bốn khung `at async …`. Mục này ghi lại hành vi sau khi sửa, vì **câu thông báo cho ba mẹ chính là sản phẩm**.

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
 ✓ test/unit/household-preflight.test.ts (14 tests) 812ms
      Tests  14 passed (14)
```

**Đo được:** đúng **1** dòng stderr, **0** khung `at ` (không stack trace), **0** byte stdout từ script (chỉ banner của npm), `REAL_EXIT=1`, **14** test xanh trong 1 tệp. DB hộ gia đình đo trực tiếp bằng `node:sqlite` read-only: `{"v":14}`; repo có **16** tệp migration, tệp mới nhất `migrations/0016_learning_attempts_append_only_update_guard.sql`.

**Kiểm chứng ngược (đột biến):** thay `failure = error;` bằng `throw error;` (kiểm rằng chuỗi thay thế áp dụng **đúng 1 lần**) → test đỏ với `expected 'file:///Users/macbook/projects/tai-le…' to be 'preflight refused: Household DB prefl…'`; khôi phục nguyên bản → **14/14** xanh. Test không chỉ xanh mà chứng minh được nó bắt được đúng hỏng hóc nó tồn tại để bắt.

**Điều kiện tiên quyết cho ba mẹ (operator docs):** câu lệnh sửa chỉ hữu ích nếu ba mẹ đọc được nó ở nơi ba mẹ tìm. Đã ghi vào ba bề mặt phụ huynh, song ngữ:
- `docs/PARENT_OPERATIONS.md` §1.2 — mục mới "Nếu lệnh kiểm tra báo `schemaVersion` quá cũ", kèm nguyên văn dòng thông báo, hai lệnh `db:migrate` → `household:preflight`, và một câu tiếng Anh.
- `docs/PARENT_PILOT_GUIDE.md` bước 3 — dòng bổ sung ngay dưới lệnh preflight.
- `README.md` khối lệnh — chú thích một dòng ngay trên `npm run household:preflight`.

Đồng thời sửa một con số đã sai trong `PARENT_OPERATIONS.md:28`: tài liệu ghi "đúng phiên bản lược đồ mới nhất (`schemaVersion: 14`)" — chính xác là trạng thái mà preflight **từ chối**. Đã đổi thành `schemaVersion ≥ 15`, khớp `MINIMUM_SUPPORTED_SCHEMA_VERSION` tại `src/worker/db/reprovision-household.ts:316`.

**Phán quyết: PASS.** Hành vi quan sát được đúng như hợp đồng: một câu, đúng câu lệnh sửa, thoát mã 1, không lộ giá trị bí mật.

---

## Lệnh chạy lại toàn bộ

```bash
cd ~/projects/tai-learning-os

# G0
git rev-parse HEAD && git status --porcelain | wc -l

# G1, G6, G9, G13, G15
grep -rn "EMERGING" src/ test/ --include='*.ts' | wc -l
grep -n "sessionId\|session_id" src/shared/engine/competency.ts | wc -l
grep -rn "25 \* 60\|SESSION_MAX\|maxSessionMinutes" src/ --include='*.ts' | wc -l
grep -rni "sympy\|promptfoo" package.json scripts/ src/ | wc -l
grep -rnw "TCO" docs/ src/ scripts/ --exclude='G0_G16_AUDIT_MATRIX.md' | wc -l

# G14 (chạy thật)
npm run retention:report
npm run retention:drill

# G2, G7, G10
grep -rn "page.route\|context.route" test/ | wc -l
grep -rn "\[1, 3, 7, 14\]\|\[1,3,7,14\]" src/ | wc -l
grep -rn "axe" package.json test/ playwright.config.ts | wc -l

# G3
grep -rn "SESSION_SECRET\s*=\s*['\"]\|PARENT_PASSWORD_HASH\s*=\s*['\"]" src/

# G11
grep -rn "\.batch(" src/ --include='*.ts' | wc -l

# G4, G12 (chạy thật)
npm run validate:lessons
npm run backup:drill

# Bộ kiểm thử đầy đủ
npx vitest run            # 21 tệp / 356 test
npm run test:integration  # 19 tệp / 202 test

# OPS
npm run household:preflight
npx vitest run test/unit/household-preflight.test.ts
```

---

## Điều tài liệu này **không** khẳng định

- Không khẳng định hệ thống an toàn để triển khai. **Bảy** cổng HOLD ở trên chặn điều đó.
- Không khẳng định nội dung chương trình đã đủ. 50 bài là 3,57% quỹ tiết Grade 4–5; phần còn thiếu là công việc soạn nội dung, nằm ngoài phạm vi đợt này.
- Không khẳng định G6 đã đóng. Điều kiện "khác phiên" chưa được cài đặt, và việc cài đặt nó cần thay đổi `AttemptEvidence` cùng schema.
- Không khẳng định G12 đã sẵn sàng cho dữ liệu thật. Drill đo `restoreMs: 97` (bốn lần chạy: 97/101/98/99 ms) trên **548 bản ghi** trong một D1 tạm; đó là bằng chứng cho ngân sách 60 giây ở quy mô hiện tại, **không** phải phép đo trên cơ sở dữ liệu nhiều năm của gia đình, nơi `learning_attempts` sẽ lớn hơn nhiều lần. Drill này cũng không đọc `.wrangler/state`, nên chưa chứng minh được khôi phục cơ sở dữ liệu hộ gia đình thật.
- Không khẳng định các số đo trên tái lập được từ một HEAD còn nằm ngoài repo — chúng đo trên HEAD `51390faeac86` với cây làm việc sạch (G0), nhưng bốn bộ kiểm thử trong repo này phụ thuộc vào trình duyệt và môi trường Node (CI dùng Node 24, máy đo dùng Node 26.7.0). Con số `restoreMs` cũng dao động theo tải máy, nên chỉ ngân sách 60 giây có ý nghĩa, không phải chính con số 97.
