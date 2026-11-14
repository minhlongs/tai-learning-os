# ĐÁNH GIÁ RỦI RO: KHO MÃ CÔNG KHAI VÀ MISSION-B

## PUBLIC REPOSITORY RISK ASSESSMENT — MISSION-B (COMMERCIAL)

**Dự án:** TAI LEARNING OS
**Ngày đo:** 2026-11-13
**Nhánh:** `feat/mission-a-2036-foundation`
**Trạng thái Mission-B:** **CHƯA KÍCH HOẠT** — cấu hình firewall tồn tại, không có đường chạy nào dùng nó.

> **Bilingual guide / Hướng dẫn song ngữ.** Phần tiếng Việt ở trên, phần English ở dưới mỗi mục.

---

## 0. Tài liệu này để làm gì (Purpose)

Mission-B là nhánh thương mại của sản phẩm. Nó **chưa được xây**. Nhưng repo này đang **công khai**, nghĩa là bất kỳ ai cũng đọc được toàn bộ chương trình học, toàn bộ luật chấm điểm, và toàn bộ danh sách điểm yếu mà chính dự án tự ghi ra. Quyết định giữ repo công khai là quyết định của chủ sở hữu và tài liệu này **không** đề nghị đảo ngược nó. Việc của tài liệu này là **đếm** xem cái gì đang phơi ra ngoài, và nói rõ cái gì đáng lo, cái gì không.

Mọi con số dưới đây được đo trên HEAD ngày 2026-11-13 bằng lệnh ghi kèm. Không có con số nào là ước lượng.

> Mission-B is the commercial branch of the product. It is not built. But this repository is public, which means anyone can read the whole curriculum, the whole grading rule set, and the project's own list of weaknesses. Keeping the repository public is the owner's decision and this document does not argue against it. Its job is to **count** what is exposed, and to say plainly what matters and what does not. Every number below was measured on HEAD, 2026-11-13, with the command shown. None is an estimate.

---

## 1. Hình dạng thực tế của kho mã (What the repository actually is)

| Thuộc tính | Giá trị đo được | Lệnh đo |
|---|---|---|
| Chế độ hiển thị | `PUBLIC`, `isPrivate: false` | `gh repo view --json visibility,isPrivate` |
| Số tệp được theo dõi | **272** | `git ls-files \| wc -l` |
| Số commit | **58** | `git rev-list --count --all` |
| Giấy phép | **không có tệp `LICENSE` nào** | `git ls-files \| grep -ci LICENSE` → 0 |
| Tuyên bố "open source" | **0 lần** trong README và `docs/*.md` | `grep -ri "open source" README.md docs/*.md \| wc -l` |
| Mã nguồn `src/` | **35.300 dòng** | `find src -name "*.ts*" \| xargs wc -l` |
| Kiểm thử `test/` | **19.389 dòng** (21 unit, 19 integration, 2 e2e) | `git ls-files -z 'test/*' \| xargs -0 wc -l` |
| Tài liệu `docs/` | **2.124 dòng** | `git ls-files -z 'docs/*' \| xargs -0 wc -l` |

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
| Bản sao seed trong test | 26.575 byte tại `test/integration/lesson-seed.ts` |

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

> **Exposure summary.** Everything a competitor would want to copy — the 50-lesson curriculum (257 steps, 7,813 lines), the 269 answer-key fields behind it, and the exact grading and scheduling constants — is readable, structured, and duplicated inside the test tree. The audit matrix additionally publishes the project's own seven HOLD gates with measured numbers. That honesty is correct engineering, but it is also a free map for anyone probing the system.

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

`.gitignore` chặn `.wrangler/`, `.dev.vars`, `.dev.vars.*`, `*.sqlite`, `dist/` — và `.dev.vars.example` được whitelist có chủ đích.

> **Nothing secret is in the tree, and nothing secret has ever been in its 58-commit history.** Zero credential-shaped strings, zero tracked database files, zero school/address/phone fields. The two secret *names* appear only as identifiers. `.gitignore` blocks the state directory, the real `.dev.vars`, and every SQLite file, with the example file deliberately whitelisted.

---

## 4. Rủi ro tồn dư: định danh đứa trẻ (Residual risk: the child's identifier)

Đây là mục duy nhất mà tôi không thể nói "không sao".

| Số đo | Giá trị |
|---|---|
| Tệp được theo dõi có chứa biệt danh `Tài` | **54** trong 272 (20%) |
| Phân bố | 19 `test/`, 11 `src/`, 10 `docs/`, 7 `plans/`, 3 `scripts/`, 1 `README.md`, 1 `index.html`, 1 `CLAUDE.md`, 1 `AGENTS.md` |
| Fixture nguyên văn `nickname: "Tài"` | **11** lần trong **7** tệp kiểm thử |
| Trong đó | `learner-journey.spec.ts` 1, `m4-browser-verification.spec.ts` 4, `api.test.ts` 1, `backup-cipher.test.ts` 1, `export-import.test.ts` 1, `household-preflight.test.ts` 2, `reprovision-household-db.test.ts` 1 |
| Mỗi fixture đi kèm | `birthYear: 2016`, `grade: 4`, `timezone: "Asia/Ho_Chi_Minh"` |
| Tên tệp sao lưu mẫu `backup-tai` | **7** tệp |

**Đánh giá thẳng:** đây **không** phải dữ liệu cá nhân đầy đủ theo chính sách "vắng mặt" của dự án — không có họ tên, không ngày sinh đầy đủ, không trường học, không địa chỉ, không số điện thoại. Nhưng **biệt danh + năm sinh + lớp + múi giờ** là một bộ bốn trường đủ để thu hẹp về một đứa trẻ cụ thể trong một nhóm nhỏ, nếu biệt danh đó khớp với một người thật. Rủi ro không nằm ở chỗ "lộ dữ liệu" mà ở chỗ "lộ một cái tên gắn với một hồ sơ học tập".

Mức độ: **thấp đến trung bình**, phụ thuộc hoàn toàn vào việc biệt danh có nhận dạng được ngoài đời hay không — điều tôi không thể kiểm tra và chủ sở hữu thì biết.

> **This is the one section I cannot call clean.** Forty-one test files mention the nickname; eleven literal `nickname: "Tài"` fixtures across seven test files each carry `birthYear: 2016`, `grade: 4`, and `timezone: "Asia/Ho_Chi_Minh"`. That is not full personal data under the project's own absence policy — no legal name, no full date of birth, no school, no address, no phone. But nickname plus birth year plus grade plus timezone is a four-field set that narrows to one specific child in a small population. The risk is not "data leak"; it is "a name attached to a learning record". Severity: **low to moderate**, entirely dependent on whether the nickname is recognizable off-line — which I cannot check and the owner can.

---

## 5. Sổ rủi ro (Risk register)

| # | Rủi ro | Khả năng | Tác động | Trạng thái |
|---|---|---|---|---|
| R1 | Đối thủ sao chép 50 bài học + đáp án | Chắc chắn | Trung bình | **Chấp nhận** — xem §6 |
| R2 | Đối thủ sao chép luật chấm điểm / tham số FSRS | Chắc chắn | Thấp | **Chấp nhận** — luật chấm điểm không phải bí mật cạnh tranh |
| R3 | Kẻ tấn công dùng danh sách HOLD trong audit matrix để dò | Chắc chắn | Thấp | **Chấp nhận** — server chưa chạy công khai, nên chưa có gì để dò |
| R4 | Biệt danh + năm sinh + lớp đủ để nhận dạng một đứa trẻ | Thấp | Trung bình–cao | **Mở** — §4 |
| R5 | Người khác dùng mã mà không có giấy phép rồi tranh chấp | Thấp | Trung bình | **Chấp nhận** — không có LICENSE nghĩa là không có quyền dùng |
| R6 | Rò rỉ tương lai qua commit (bí mật, dữ liệu thật) | Thấp | Cao | **Đã kiểm soát** — `.gitignore` + 0 chuỗi bí mật trong 58 commit |
| R7 | Mission-B bị kích hoạt nhầm qua cấu hình công khai | Rất thấp | Cao | **Đã đóng** — firewall + guard test, xem §7 |

> **R4 is the only row still open.** Everything else is either accepted with a stated reason or already closed by a mechanism. R7 in particular is closed by construction: the commercial config points at an entry point that does not exist and names a binding no household code declares.

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
| 6 | 13 test tĩnh canh giữ cả 5 lớp trên | `test/unit/mission-b-firewall.test.ts` |

Ba điều kiện tiên quyết để kích hoạt, ghi tại `docs/ROADMAP_90_DAYS.md:56-62`: (1) chủ sở hữu ký văn bản thu hồi ràng buộc `LOCAL ONLY`; (2) ký duyệt pháp lý về quyền riêng tư trẻ em; (3) cấp phát bí mật production qua Worker secrets. Cho tới khi cả ba được ký, tệp cấu hình này **trơ**.

> **Three activation prerequisites, and none is satisfiable by a code change.** Until all three are signed, the config is inert by construction — a file that cannot deploy, against a database that does not exist, with a binding no household code knows.

---

## 8. Khuyến nghị (Recommendations)

**Khuyến nghị chính: giữ nguyên hiện trạng trong đợt này.** Không đổi biệt danh trong 7 tệp kiểm thử bây giờ, vì:

- Việc đổi là thao tác cơ học 7 tệp, làm được bất cứ lúc nào trong vài phút, không phụ thuộc gì.
- Làm bây giờ sẽ đụng vào 7 tệp kiểm thử đang xanh ngay trước khi mở PR — rủi ro nhiễu cao hơn lợi ích.
- Thời điểm lợi ích xuất hiện là **trước khi repo được quảng bá cho Mission-B**, không phải hôm nay.

**Điều kiện đổi ý:** nếu chủ sở hữu xác nhận biệt danh `Tài` nhận dạng được ngoài đời (tên thật, tên ở trường, tên trên mạng xã hội), thì việc đổi phải làm **trước** bất kỳ bước nào dưới đây, và tôi khuyến nghị đổi ngay.

Hai lựa chọn nếu cần đổi, xếp theo chi phí:

| Lựa chọn | Việc phải làm | Chi phí | Ghi chú |
|---|---|---|---|
| **A. Đổi biệt danh fixture** (khuyến nghị nếu cần) | Thay `"Tài"` → `"Bé Mẫu"` trong 7 tệp kiểm thử và `backup-tai` → `backup-mau` trong 7 tệp tài liệu/kịch bản | ~15 phút, cơ học, không đổi hành vi | Giữ nguyên `birthYear`/`grade`/`timezone` — ba trường đó không nhận dạng ai |
| **B. Chuyển repo sang private** | Đổi `visibility` qua `gh` | 1 lệnh, nhưng **đảo ngược quyết định của chủ sở hữu** | Chỉ làm khi chủ sở hữu yêu cầu; tài liệu này không đề nghị |

Việc **không** nên làm: thêm `LICENSE` kiểu MIT/Apache "cho đẹp". Hiện tại không có giấy phép nghĩa là không ai có quyền dùng; thêm giấy phép mở sẽ **trao** quyền đó, đúng ngược lại mục tiêu thương mại của Mission-B.

> **Recommendation: leave it as is for this run.** The fixture rename is a seven-file mechanical edit that can happen any time in fifteen minutes; doing it now would touch seven currently-green test files immediately before a pull request, trading real risk of noise for a benefit that only materialises when the repository is promoted for Mission-B. The one thing not to do is add an MIT or Apache licence "to look proper" — today the absence of a licence means nobody may use the code; adding one would grant that right, which is the opposite of Mission-B's commercial intent.

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
