# ADR-003 — Ghi nhiều bảng bằng `db.batch`, và sao lưu mã hoá có kiểm chứng

**Trạng thái:** Đã chấp nhận (2026-11-08)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `src/worker/services/session-service.ts`, `src/worker/db/repositories.ts`, `src/shared/crypto/backup-cipher.ts`

---

## Phần A — Tính nguyên tử của `env.DB.batch([...])`

### Bối cảnh

Mỗi lượt nộp bài của Tài phải ghi **ba bảng cùng lúc**:

| Bảng | Vai trò |
|---|---|
| `learning_attempts` | Bằng chứng thô, append-only — điều em thực sự đã làm |
| `skill_evidence` | Diễn giải — trạng thái năng lực suy ra từ bằng chứng đó |
| `audit_events` | Nhật ký kiểm toán — ai/cái gì/khi nào |

Ba bảng này **chỉ có nghĩa khi đi cùng nhau**. Một `learning_attempts` không có `audit_events` là một hành động không có dấu vết. Một `skill_evidence` không có `learning_attempts` là một tuyên bố về năng lực trẻ mà không có bằng chứng nào đứng sau — đúng thứ mà hệ thống này tồn tại để ngăn chặn.

Từ `ADR-005`, mô hình người học bốn lớp thêm hai bảng nữa vào **cùng batch đó**: `skill_evidence_observation` (lớp 2 — nêu tên đúng lần làm bài mà nó được phân loại từ đó) và `skill_estimate` (lớp 3 — chứng nhận một tiền tố của sổ bằng chứng). Cả hai đều trỏ vào thứ mà batch này chưa ghi nếu bị tách ra, nên quyết định dưới đây áp dụng nguyên vẹn cho chúng.

D1 (Cloudflare) **không hỗ trợ** `BEGIN TRANSACTION` / `COMMIT` tường minh qua API của nó. Cách duy nhất để có tính nguyên tử là `env.DB.batch([...])`, thực thi danh sách câu lệnh như một đơn vị: hoặc tất cả, hoặc không gì cả.

### Quyết định

**Mọi ghi chéo bảng đi qua một lần `env.DB.batch([...])` duy nhất.** Không có ngoại lệ, không có `await` rời rạc giữa các bảng.

Các điểm ghi trong mã nguồn:

- `src/worker/services/session-service.ts:346` — lượt nộp bài chính thức (attempt + audit + evidence + review schedule + observation + estimate)
- `src/worker/services/session-service.ts:437` — chỉnh tay của phụ huynh (evidence + audit)
- `src/worker/routes/learner.ts:432`, `:726`, `:790` — mở phiên, kết thúc phiên, ghi nhận
- `src/worker/routes/parent.ts:722`, `:1114` — sửa tay của phụ huynh và các thao tác quản trị
- `src/worker/routes/consents.ts:143` — đồng thuận
- `src/worker/routes/organization-lessons.ts:225` — duyệt bài học của tổ chức
- `src/worker/routes/data.ts:1384` — khôi phục bản sao lưu (attempt + evidence + observation + review schedule cùng một batch)

### Bằng chứng

Không phải niềm tin — có test cố tình làm hỏng giữa chừng để chứng minh rollback thật:

`test/integration/evidence-and-ledger-integrity.test.ts:200` — khối `describe` mang đúng tên *"atomic attempt, derivation, review schedule, and audit batch boundary"*; test bên trong là `:201` (*"rolls back the attempt, skill_evidence, and review_schedule when the audit insert fails inside db.batch, and succeeds cleanly on retry"*):

> tạo một `CREATE TRIGGER fault_inject_attempt_audit` ném lỗi trên `INSERT INTO audit_events WHEN NEW.action = 'attempt.submitted'`, rồi nộp bài bình thường.

Vì `statements[0]` là INSERT vào `learning_attempts` và `statements[1]` là INSERT vào `audit_events`, trigger nổ **sau khi** attempt đã được ghi trong cùng batch. Test xác nhận: attempt bị rollback, và `skill_evidence` / `review_schedule` không hề được ghi. Nếu ai đó tách batch thành các `await` riêng lẻ, test này sẽ đỏ ngay — nó là lưới an toàn cho đúng quyết định này.

Test thứ hai (`test/integration/evidence-and-ledger-integrity.test.ts:328` — *"rolls back the attempt and audit row when a derived write (skill_evidence) fails inside db.batch"*) chứng minh chiều ngược lại: hỏng ở bảng diễn giải thì bằng chứng thô cũng không được sống sót một mình.

Test thứ ba, và là test canh **hình dạng** batch chứ không chỉ hậu quả của nó: `test/integration/batched-write-shape.test.ts` gắn thiết bị đo vào chính handle D1 mà Worker nhận, đánh dấu mỗi lệnh INSERT thuộc năm bảng bằng độ sâu lúc nó *thực thi*, rồi khẳng định không có nhóm ghi nào chạm năm bảng đó mà lại commit ngoài `batch`. Đây là lưới bắt được thay đổi *trước khi* nó tạo ra trạng thái nửa vời, thay vì sau khi.

### Hệ quả

**Được:** Không thể tồn tại trạng thái nửa vời giữa bằng chứng và diễn giải. Nhật ký kiểm toán append-only không bao giờ thiếu dòng cho một hành động đã ghi.

**Mất / chấp nhận:**
- `db.batch` không cho phép đọc kết quả của câu lệnh trước để quyết định câu lệnh sau trong cùng batch. Vì vậy `attempt_no` phải được tính **trước** khi vào batch (`COALESCE(MAX(attempt_no), 0) + 1` tại `src/worker/db/repositories.ts:1260`) và được **kiểm chứng lại bên trong** câu lệnh INSERT bằng một subquery điều kiện — nếu giữa lúc đọc và lúc ghi có ai chen vào, câu INSERT không khớp điều kiện và batch thất bại, rồi toàn bộ được thử lại. Xem `ADR-001` về `attemptNo`, và `test/integration/evidence-and-ledger-integrity.test.ts:485` — *"recovers from a true UNIQUE(learner_id, step_id, attempt_no) race between summary read and batch commit, recomputing mastery as assisted"*.
- Một batch hỏng nghĩa là **toàn bộ** lượt làm bài bị từ chối, kể cả khi chỉ phần audit lỗi. Trẻ có thể thấy lỗi cho một câu trả lời đúng. Đây là đánh đổi đã chọn: thà bắt làm lại còn hơn ghi một nửa sự thật.

---

## Phần B — Sao lưu mã hoá

### Bối cảnh

Dữ liệu học tập của một đứa trẻ dưới 13 tuổi rời khỏi máy này theo đúng một đường: bản sao lưu. Bản sao lưu đó chứa lịch sử làm bài, trạng thái năng lực, và ghi chú của phụ huynh. Nếu nó nằm dạng thô trên ổ đĩa hay trong một thư mục đồng bộ đám mây, thì mọi cam kết "riêng tư bằng cách không thu thập" đều vô nghĩa.

### Quyết định

**AES-256-GCM + PBKDF2-SHA256, 600.000 vòng, salt ngẫu nhiên 16 byte** (`src/shared/crypto/backup-cipher.ts`).

Không dùng `age`, không dùng GPG, không dùng nén-có-mật-khẩu của zip. Lý do: `age` và GPG cần công cụ ngoài cài trên máy; hệ thống này chạy trên Web Crypto có sẵn trong workerd và trình duyệt, nên cùng một đoạn mã dùng được cho cả `npm run export:learner` lẫn nút tải trong `/parent/data`.

**AAD ràng buộc phần đầu phong bì.** `buildAadBytes()` (`src/shared/crypto/backup-cipher.ts:69`, gọi ở `:144` và `:235`) ghép `format|kdf|iterations|cipher` thành associated data. Nhờ vậy, kẻ sửa `iterations` từ 600.000 xuống 100 để làm yếu quá trình dẫn xuất khoá sẽ làm hỏng xác thực GCM — phong bì bị từ chối, không phải bị giải mã với tham số yếu hơn.

### Bằng chứng

`npm run backup:drill` (`scripts/backup-restore-drill.mjs`) chạy trên một cơ sở dữ liệu `tmpdir()` **tách biệt** — không bao giờ chạm vào dữ liệu thật của gia đình — và kiểm chứng: sao lưu → giải mã → khôi phục → so khớp từng bản ghi, cùng ba đường từ chối (`scripts/backup-restore-drill.mjs:411–428`): sai mật khẩu, lật một byte ciphertext, và **tăng `iterations` thêm 1** — trường hợp thứ ba là phép thử trực tiếp cho AAD ở trên, vì `iterations` đã nằm trong associated data nên phong bì bị từ chối thay vì được giải mã bằng tham số yếu hơn.

### Hệ quả

**Được:** Bản sao lưu vô dụng nếu không có mật khẩu, và việc chỉnh sửa phong bì bị phát hiện.

**Mất / chấp nhận:**
- **Mất mật khẩu là mất dữ liệu.** Không có cơ chế khôi phục, và đó là chủ ý — thêm một cửa khôi phục là thêm một cửa tấn công. Phụ huynh được nhắc rõ trong `docs/PARENT_OPERATIONS.md`.
- PBKDF2 600.000 vòng làm mỗi lần sao lưu/khôi phục chậm hơn đáng kể. Với một hộ gia đình, vài giây là chấp nhận được; với hàng nghìn người dùng đồng thời thì không — nhưng đó là vấn đề của Mission B, không phải hôm nay.

## Điều ADR này **không** khẳng định

Không có bản sao lưu tự động lên đám mây nào đang chạy. `ROADMAP_90_DAYS.md:61` ghi mục này là **đã kiểm chứng cục bộ (M8)**, không phải đã triển khai từ xa. Việc đẩy bản sao lưu mã hoá ra khỏi máy này là hành động của Mission B và bị chặn cho tới khi có uỷ quyền bằng văn bản của chủ sở hữu.
