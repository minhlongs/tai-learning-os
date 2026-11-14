# ĐÁNH GIÁ RỦI RO: KHO MÃ CÔNG KHAI VÀ MISSION-B

## PUBLIC REPOSITORY RISK ASSESSMENT — MISSION-B (COMMERCIAL)

**Dự án:** TAI LEARNING OS
**Ngày đo:** 2026-11-14
**Nhánh:** `feat/issue-66-parameterize-parent-ui-and-baseline-stories`
**Trạng thái Mission-B:** **CHƯA KÍCH HOẠT** — cấu hình firewall tồn tại, không có đường chạy nào dùng nó.

> **Bilingual guide / Hướng dẫn song ngữ.** Phần tiếng Việt ở trên, phần English ở dưới mỗi mục.

---

## 0. Tài liệu này để làm gì (Purpose)

Mission-B là nhánh thương mại của sản phẩm. Nó **chưa được xây**. Nhưng repo này đang **công khai**, nghĩa là bất kỳ ai cũng đọc được toàn bộ chương trình học, toàn bộ luật chấm điểm, và toàn bộ danh sách điểm yếu mà chính dự án tự ghi ra. Quyết định giữ repo công khai là quyết định của chủ sở hữu và tài liệu này **không** đề nghị đảo ngược nó. Việc của tài liệu này là **đếm** xem cái gì đang phơi ra ngoài, và nói rõ cái gì đáng lo, cái gì không.

Mọi con số dưới đây được đo trên HEAD ngày 2026-11-14 bằng lệnh ghi kèm. Không có con số nào là ước lượng.

> Mission-B is the commercial branch of the product. It is not built. But this repository is public, which means anyone can read the whole curriculum, the whole grading rule set, and the project's own list of weaknesses. Keeping the repository public is the owner's decision and this document does not argue against it. Its job is to **count** what is exposed, and to say plainly what matters and what does not. Every number below was measured on HEAD, 2026-11-14, with the command shown. None is an estimate.

---

## 1. Hình dạng thực tế của kho mã (What the repository actually is)

| Thuộc tính | Giá trị đo được | Lệnh đo |
|---|---|---|
| Chế độ hiển thị | `PUBLIC`, `isPrivate: false` | `gh repo view --json visibility,isPrivate` |
| Số tệp được theo dõi | **303** | `git ls-files \| wc -l` |
| Số commit trên nhánh (sau commit PR) | **61** | `git rev-list --count HEAD` |
| Giấy phép | **không có tệp `LICENSE` nào** | `git ls-files \| grep -ci LICENSE` → 0 |
| Tuyên bố "open source" | **0 lần** trong README và `docs/*.md` | `grep -ri "open source" README.md docs/*.md \| wc -l` |
| Mã nguồn `src/` | **35.492 dòng** | `find src -name "*.ts*" \| xargs wc -l` |
| Kiểm thử `test/` | **23.122 dòng** (24 unit, 19 integration, 2 e2e) | `git ls-files -z 'test/*' \| xargs -0 wc -l` |
| Tài liệu `docs/` | **4.061 dòng** | `git ls-files -z 'docs/*' \| xargs -0 wc -l` |

**Điểm quan trọng nhất: không có giấy phép.** Không có `LICENSE` nghĩa là luật bản quyền mặc định áp dụng — **không** có quyền sao chép, sửa, hay dùng thương mại nào được cấp. Repo công khai cho người ta **đọc**, không cho người ta **dùng**. Đây là khác biệt pháp lý lớn giữa "công khai" và "mã nguồn mở", và hiện tại dự án đứng ở phía an toàn hơn.

> **The single most important fact: there is no licence.** No `LICENSE` file means default copyright applies — no right to copy, modify, or use commercially is granted. A public repository lets people **read**; it does not let them **use**. That is the legal difference between "public" and "open source", and the project currently sits on the safer side of it.

---

## 2. Cái gì đang phơi ra (What is exposed)

### 2.1 Toàn bộ nội dung chương trình học

| Hạng mục | Số đo |
|---|---|
| Bài học | **50** |
| Bước học (step) | **257** |
| Dòng mã nội dung | **7.813** dòng trong `src/shared/content/**` |
| Bản sao seed trong test | 25.867 byte tại `test/integration/lesson-seed.ts` |

Bất kỳ ai cũng tải được toàn bộ 50 bài, ở dạng có cấu trúc, kèm bản sao thứ hai trong thư mục test.

### 2.2 Toàn bộ đáp án

| Trường | Số lần xuất hiện trong `src/shared/content` |
|---|---|
| `correctChoiceId` | **254** |
| `correctNumerator` | **8** |
| `correctDenominator` | **8** |
| `sentenceAcceptedWords` | **5** |
| `explanationVi` | **258** |

Đây là **đáp án của 50 bài đang có**, không phải đáp án của 510 bài chưa viết.

### 2.3 Toàn bộ luật chấm điểm và tham số lập lịch

| Hằng số | Giá trị | Vị trí |
|---|---|---|
| `requestRetention` | `0.95` | `src/shared/engine/review.ts:47` |
| `maximumIntervalDays` | `30` | `src/shared/engine/review.ts:54` |
| Điều kiện INDEPENDENT | `helpLevel === 0`, `attemptNo === 1`, ngưỡng số lượt đúng | `src/shared/engine/**` |
| Thứ hạng | `SUPPORTED: 1`, `INDEPENDENT: 2` | `src/shared/engine/**` |

### 2.4 Danh sách điểm yếu do chính dự án công bố

`docs/audits/G0_G16_AUDIT_MATRIX.md` ghi rõ **7 cổng HOLD** (G2, G6, G9, G10, G13, G15, G16) và **3 cổng PARTIAL** (G0, G8, G14), mỗi cổng kèm số đo. Đây là tài liệu trung thực và nó cũng là một bản đồ miễn phí cho người muốn tấn công: nó nói chính xác chỗ nào chưa có kiểm thử chặn mạng ra ngoài (G2), chỗ nào chưa có kiểm thử `axe` (G10), chỗ nào chưa có mô hình chi phí (G15).

> **Exposure summary.** Everything a competitor would want to copy — the 50-lesson curriculum (257 steps, 7,813 lines), the 275 answer-key fields behind it, and the exact grading and scheduling constants — is readable, structured, and duplicated inside the test tree. The audit matrix additionally publishes the project's own seven HOLD gates with measured numbers. That honesty is correct engineering, but it is also a free map for anyone probing the system.

---

## 3. Cái gì KHÔNG phơi ra (What is not exposed)

| Kiểm tra | Kết quả |
|---|---|
| Chuỗi giống bí mật `sk-…` (≥20 ký tự) | **0** |
| Khoá AWS `AKIA…` | **0** |
| JWT `eyJ…` | **0** |
| Tệp `.dev.vars` được theo dõi | **chỉ `.dev.vars.example`** (giá trị giữ chỗ) |
| `.dev.vars` từng vào lịch sử git | **không** — `git log --all --diff-filter=A --name-only \| grep -i vars` chỉ trả về `.dev.vars.example` |
| Tệp `.sqlite` được theo dõi | **0** (1 kết quả khớp là tên một tệp kế hoạch, không phải dữ liệu) |
| Trường `school_name` / `home_address` / `phone_number` trong `src/`, `test/` | **0** |
| Tên bí mật trong mã | `SESSION_SECRET`, `PARENT_PASSWORD_HASH` chỉ xuất hiện **dưới dạng tên biến**, không có giá trị |

`.gitignore` chặn `.wrangler/`, `.dev.vars`, `.dev.vars.*`, `*.sqlite`, `dist/` — và `.dev.vars.example` được whitelist có chủ đích. Ngoài ra, `vite.config.ts` xoá `workerConfig.configPath` khi chạy `vite build` và lọc bỏ mọi mục `.dev.vars*` trong `generateBundle`, đồng thời `test/unit/build-no-secrets.test.ts` kiểm chứng rằng `npm run build` không bao giờ phát sinh `.dev.vars` hay `.dev.vars.*` vào `dist/worker/` hoặc `dist/client/`.

> **Nothing secret is in the tree, and nothing secret has ever been in its 61-commit history.** Zero credential-shaped strings, zero tracked database files, zero school/address/phone fields. The two secret *names* appear only as identifiers. `.gitignore` blocks the state directory, the real `.dev.vars`, and every SQLite file, with the example file deliberately whitelisted. Furthermore, `vite.config.ts` strips `workerConfig.configPath` during `vite build` and removes any `.dev.vars*` bundle entries in `generateBundle`, and `test/unit/build-no-secrets.test.ts` asserts that `npm run build` never emits `.dev.vars` or `.dev.vars.*` into `dist/worker/` or `dist/client/`.

---

## 4. Rủi ro tồn dư: định danh đứa trẻ (Residual risk: the child's identifier)

Cây mã hiện hành (working tree) đã được làm sạch toàn phần qua Issue `#62` và Issue `#66`, và được canh giữ tự động bởi `test/unit/no-child-identifier-fixtures.test.ts`; tuy nhiên lịch sử git cũ vẫn giữ các phiên bản trước đó (vì việc viết lại lịch sử git là thao tác không thể đảo ngược và không được thực hiện tự động).

| Số đo trên cây mã hiện hành (sau Issue #62 & #66) | Giá trị |
|---|---|
| Fixture nguyên văn `nickname: "Tài"` trong `test/` và `scripts/` | **0** (giảm từ 11 lần trong 7 tệp kiểm thử; đã thay bằng `"Bé Mẫu"`) |
| Nhãn UI cứng `"Tài"` trong `src/client/**`, `src/worker/**`, `index.html` và truyện đọc đầu vào lớp 4 trong `src/shared/content/**` | **0** (đã tham số hoá theo `session.learner.nickname` qua `activeLearnerLabelVi()` và đổi nhân vật truyện sang `"An"` / `"Nam"`) |
| Fixture `birthYear: 2016` / `birth_year = 2016` trong `test/` và `scripts/` | **0** ngoài chính tệp canh giữ `test/unit/no-child-identifier-fixtures.test.ts` (đã thay bằng `2017`) |
| Tên tệp sao lưu mẫu `backup-tai` trong mã, kịch bản và tài liệu hoạt động | **0** ngoài tệp canh giữ và chính báo cáo kiểm toán này (đã thay bằng `backup-mau`) |
| Biệt danh học sinh độc lập `"Tài"` trong toàn bộ mã nguồn, nội dung, kịch bản, kiểm thử và tài liệu hiện hành (ngoài `plans/` và `docs/audits/`) | **0** (được chặn trực tiếp bằng biểu thức chính quy từ độc lập trong `test/unit/no-child-identifier-fixtures.test.ts`) |
| Tổng số tệp được theo dõi còn chứa chuỗi con `"Tài"` | **25** trong 303 (giảm từ 54; gồm 11 tệp từ vựng ghép tiếng Việt như `"Tài liệu"` / `"Tài khoản"` / `"Tài Năng"`, 1 tệp canh giữ `test/unit/no-child-identifier-fixtures.test.ts`, và 13 hồ sơ lịch sử trong `plans/` + `docs/audits/`) |
| Tệp kiểm thử canh giữ | `test/unit/no-child-identifier-fixtures.test.ts` (chuẩn hoá Unicode NFC, bắt cả chữ có dấu `Tài` và không dấu `Tai`, quét cả tệp đã theo dõi và tệp mới chưa `git add` ngoài `plans/` và `docs/audits/`) |

**Đánh giá thẳng:** trên nhánh hiện tại, không còn bất kỳ định danh cá nhân hay tên riêng `"Tài"` / `"Tai"` nào trong toàn bộ giao diện React (`src/client/`), backend (`src/worker/`), 50 bài học (`src/shared/content/`), lược đồ SQL (`migrations/`), cấu hình (`package.json`, `wrangler.jsonc`, `index.html`), bộ kiểm thử (`test/`), kịch bản CLI (`scripts/`) và tài liệu vận hành hiện hành. Rủi ro còn lại của R4 chỉ còn nằm ở **lịch sử commit git công khai trước Issue `#62` / `#66`** và chữ viết tắt tên dự án `TAI LEARNING OS`.

Mức độ tồn dư: **thấp**, phụ thuộc duy nhất vào việc chủ sở hữu có muốn giữ nguyên lịch sử git hay tạo snapshot sạch khi tách kho thương mại Mission-B.

> **Working-tree code, UI, curriculum content, schema comments, fixtures, and active docs are now 100% clean (Issues #62 & #66), while git history remains untouched by design.** Parent screens (`LessonManagerScreen`, `FourWeekPlannerScreen`, `BaselineAssessmentScreen`, `CurriculumSetupScreen`) and `household-preflight.ts` now interpolate the active learner's nickname dynamically, Grade 4 baseline story characters use neutral names (`"An"`, `"Nam"`), and `test/unit/no-child-identifier-fixtures.test.ts` normalizes Unicode to NFC and blocks both accented `"Tài"` and mixed-case ASCII `"Tai"` outside standard Vietnamese compound words (`"Tài liệu"`, `"Tài khoản"`, `"Tài Năng"`). Total tracked files matching the substring `"Tài"` dropped from 54 to **25** (11 files with ordinary Vietnamese compound vocabulary, 1 guard test file `test/unit/no-child-identifier-fixtures.test.ts`, and 13 historical `plans/` + `docs/audits/` records). Residual R4 exposure is strictly bounded to pre-#66 git commit history and the `TAI LEARNING OS` project title.

---

## 5. Sổ rủi ro (Risk register)

| # | Rủi ro | Khả năng | Tác động | Trạng thái |
|---|---|---|---|---|
| R1 | Đối thủ sao chép 50 bài học + đáp án | Chắc chắn | Trung bình | **Chấp nhận** — xem §6 |
| R2 | Đối thủ sao chép luật chấm điểm / tham số FSRS | Chắc chắn | Thấp | **Chấp nhận** — luật chấm điểm không phải bí mật cạnh tranh |
| R3 | Kẻ tấn công dùng danh sách HOLD trong audit matrix để dò | Chắc chắn | Thấp | **Chấp nhận** — server chưa chạy công khai, nên chưa có gì để dò |
| R4 | Biệt danh + năm sinh + lớp trong lịch sử git cũ đủ để nhận dạng một đứa trẻ | Thấp | Thấp–trung bình | **Đã đóng trên HEAD** (0 tên riêng trong mã/UI/nội dung/fixture + guard test; chỉ còn lịch sử git trước #66) — §4 |
| R5 | Người khác dùng mã mà không có giấy phép rồi tranh chấp | Thấp | Trung bình | **Chấp nhận** — không có LICENSE nghĩa là không có quyền dùng |
| R6 | Rò rỉ tương lai qua commit hoặc gói build (bí mật, dữ liệu thật) | Thấp | Cao | **Đã kiểm soát** — `.gitignore` + `build-no-secrets.test.ts` + 0 chuỗi bí mật trong 61 commit |
| R7 | Mission-B bị kích hoạt nhầm qua cấu hình công khai | Rất thấp | Cao | **Đã đóng** — firewall + guard test, xem §7 |

> **R4 is closed on HEAD and bounded strictly to pre-#66 git history.** Working-tree UI screens, curriculum stories, test fixtures, CLI scripts, and active docs carry zero instances of the household child's identifier, guarded automatically by `no-child-identifier-fixtures.test.ts`. R6 guards `npm run build` output via `build-no-secrets.test.ts`, and R7 remains closed by construction.

---

## 6. Vì sao vẫn giữ công khai (Why keep it public anyway)

Đây là quyết định của chủ sở hữu, và có lý do kỹ thuật đứng sau nó:

1. **Giá trị phòng thủ nằm ở tổ hợp chương-trình + động-cơ, không nằm ở từng bài.** Chép 50 bài không cho ai một hệ thống dạy học; bài học là thứ dễ thay, động cơ bằng chứng và luật INDEPENDENT mới là thứ khó làm đúng.
2. **Không có giấy phép** nghĩa là người đọc không có quyền dùng. Công khai để đọc ≠ trao quyền sử dụng.
3. **Repo công khai buộc dự án phải trung thực.** Audit matrix ghi 7 HOLD là bằng chứng của điều đó; nếu repo đóng, những dòng HOLD đó sẽ dễ bị làm mờ đi.
4. **Chưa có server công khai.** Mọi rủi ro tấn công đều cần một bề mặt chạy; hiện tại bề mặt đó là máy của gia đình.

> **The defensive value is in the curriculum-plus-engine combination, not in any single lesson.** Copying 50 lessons does not give anyone a teaching system; the evidence engine and the INDEPENDENT rule are the hard part. With no licence, readers have no right to use the code. And there is no public server yet, so there is no attack surface — every risk in the register that depends on an adversary requires one.

---

## 7. Tường lửa Mission-B (The Mission-B firewall)

Mission-B **chưa kích hoạt**. Cơ chế giữ nó như vậy:

| Lớp | Cơ chế | Tệp |
|---|---|---|
| 1 | Cấu hình riêng, không phải `wrangler.jsonc`; không script nào truyền nó làm `configPath` | `wrangler.mission-b.jsonc` |
| 2 | `main` trỏ tới `src/worker/mission-b/index.ts` — **tệp này không tồn tại**, nên `wrangler deploy -c` hỏng ngay bước đầu | `wrangler.mission-b.jsonc:25` |
| 3 | Binding tên `MISSION_B_DB`, khác `DB`; không mã nào trong `src/` bind nó | `wrangler.mission-b.jsonc:43` |
| 4 | `database_id: "unprovisioned-mission-b"` — không phải UUID Cloudflare, không thể resolve | `wrangler.mission-b.jsonc:45` |
| 5 | `keep_vars: false` — không thừa hưởng biến dashboard của Worker gia đình | `wrangler.mission-b.jsonc:40` |
| 6 | 19 test tĩnh canh giữ cả 5 lớp trên | `test/unit/mission-b-firewall.test.ts` |

Ba điều kiện tiên quyết để kích hoạt, ghi tại `docs/ROADMAP_90_DAYS.md:56-62`: (1) chủ sở hữu ký văn bản thu hồi ràng buộc `LOCAL ONLY`; (2) ký duyệt pháp lý về quyền riêng tư trẻ em; (3) cấp phát bí mật production qua Worker secrets. Cho tới khi cả ba được ký, tệp cấu hình này **trơ**.

> **Three activation prerequisites, and none is satisfiable by a code change.** Until all three are signed, the config is inert by construction — a file that cannot deploy, against a database that does not exist, with a binding no household code knows.

---

## 8. Khuyến nghị (Recommendations)

**Trạng thái sau Issue `#62` & `#66`: Lựa chọn A đã được thực thi trọn vẹn trên cây mã hiện hành.**

- Toàn bộ giao diện phụ huynh, 4 bài chẩn đoán đầu vào lớp 4, fixture kiểm thử, kịch bản CLI, chú thích lược đồ và tài liệu vận hành đã được tham số hoá theo `learner.nickname` hoặc chuyển sang định danh trung tính (`"Bé Mẫu"`, `"An"`, `"Nam"`, `birthYear: 2017`, `backup-mau`), có kiểm thử tự động `test/unit/no-child-identifier-fixtures.test.ts` chặn tái phát.
- **Không** tự động viết lại lịch sử git công khai (vì thao tác force-push/filter-repo là bất khả hồi và thuộc quyền quyết định riêng của chủ sở hữu).

Hai quyết định còn lại trước khi quảng bá rộng rãi cho Mission-B, xếp theo chi phí:

| Lựa chọn | Việc phải làm | Chi phí | Ghi chú |
|---|---|---|---|
| **A1. Giữ nguyên lịch sử git hiện tại** (mặc định nếu biệt danh không nhạy cảm ngoài đời) | Không cần thao tác thêm trên git | 0 phút | Cây mã HEAD đã sạch 100%; guard test giữ cho mọi commit mới sạch |
| **A2. Làm sạch lịch sử git hoặc chuyển sang repo mới khi tách Mission-B** | Chạy quy trình viết lại lịch sử / tạo repo thương mại mới từ snapshot sạch khi chủ sở hữu yêu cầu | Quyết định một chiều của chủ sở hữu | Chỉ thực hiện khi chủ sở hữu phê duyệt tường minh |
| **B. Chuyển repo sang private** | Đổi `visibility` qua `gh` | 1 lệnh, nhưng **đảo ngược quyết định của chủ sở hữu** | Chỉ làm khi chủ sở hữu yêu cầu; tài liệu này không đề nghị |

Việc **không** nên làm: thêm `LICENSE` kiểu MIT/Apache "cho đẹp". Hiện tại không có giấy phép nghĩa là không ai có quyền dùng; thêm giấy phép mở sẽ **trao** quyền đó, đúng ngược lại mục tiêu thương mại của Mission-B.

> **Post-Issue #62 & #66 status: Option A is fully complete on HEAD.** Parent UI screens dynamically render `learner.nickname`, Grade 4 baseline stories use neutral names (`"An"`, `"Nam"`), and all test fixtures, CLI scripts, schema comments, and active docs use neutral placeholders (`"Bé Mẫu"`, `birthYear: 2017`, `backup-mau`), enforced by `test/unit/no-child-identifier-fixtures.test.ts`. Git history was intentionally left unrewritten; rewriting history or starting Mission-B from a clean snapshot remains an explicit owner decision. Do not add an MIT or Apache licence "to look proper" — the absence of a licence preserves all rights by default.

---

## 9. Tài liệu này KHÔNG khẳng định gì (What this document does not claim)

- **Không** phải tư vấn pháp lý và **không** thay thế việc ký duyệt trong `docs/CHILD_PRIVACY_REVIEW.md`.
- **Không** cấp phép kích hoạt Mission-B. Việc kích hoạt vẫn cần ba chữ ký ở §7.
- **Không** khẳng định repo an toàn để vận hành công khai. Repo công khai để **đọc**; chưa có server công khai nào và chính sách vẫn là `PRODUCTION DEPLOY BLOCKED`.
- **Không** đề nghị đảo ngược quyết định giữ repo công khai.
- **Không** kiểm tra được biệt danh `Tài` có nhận dạng được ngoài đời hay không — đó là câu hỏi chỉ chủ sở hữu trả lời được, và là biến số duy nhất có thể đẩy R4 từ "thấp" lên "cao".

> **This is a risk count, not a legal opinion, not an activation permit, and not a deployment clearance.** The one variable it cannot measure is whether the nickname identifies a real child off-line — only the owner can answer that, and that answer alone can move R4 from low to high.

---

## 10. Bảng kiểm trước khi kích hoạt Mission-B (Activation checklist)

- [ ] Chủ sở hữu ký văn bản thu hồi `LOCAL ONLY` (`wrangler.jsonc`)
- [ ] Ký duyệt pháp lý quyền riêng tư trẻ em (`docs/CHILD_PRIVACY_REVIEW.md` §4)
- [ ] Cấp phát `SESSION_SECRET` và `PARENT_PASSWORD_HASH` qua Worker secrets cho Worker thương mại
- [ ] R4 đã đóng (biệt danh đã đổi **hoặc** chủ sở hữu xác nhận không nhận dạng được)
- [ ] `src/worker/mission-b/index.ts` được viết, và test `main` trong `mission-b-firewall.test.ts` được cập nhật **có chủ đích** trong cùng PR
- [ ] `database_id` thật được cấp phát và thay vào `wrangler.mission-b.jsonc`
- [ ] Mô hình TCO tồn tại (G15 hiện HOLD: 0 mô hình trong repo)

> **Activation is a signed decision with a checklist, not a config edit.** Each box above is someone's signature, not a code change — except the last two, which are the only ones this document's own numbers show are still entirely absent.
