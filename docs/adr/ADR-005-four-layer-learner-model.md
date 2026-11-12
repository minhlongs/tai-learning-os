# ADR-005 — Bốn lớp của hồ sơ học sinh: quan sát → bằng chứng → ước lượng → trạng thái

**Trạng thái:** Đã chấp nhận (2026-11-08)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `migrations/0015_four_layer_learner_model.sql`, `src/shared/engine/review.ts`, `src/shared/schemas/transfer.ts`, `src/worker/db/schema.ts`, `src/worker/db/repositories.ts`, `src/worker/services/session-service.ts`, `src/worker/routes/data.ts`, `src/worker/db/reset-user-data.ts`, `src/worker/db/reprovision-household.ts`, `src/worker/db/household-preflight.ts`, `test/integration/four-layer-learner-model.test.ts`

---

## Bối cảnh

Hệ thống trả lời bốn câu hỏi khác nhau về một đứa trẻ, và trước ADR này cả bốn câu trả lời nằm lẫn trong hai bảng:

| Câu hỏi | Câu trả lời đúng phải đến từ đâu |
|---|---|
| "Hôm qua em làm gì?" | những gì đã ghi lại — **quan sát thô** |
| "Lần làm đó có được tính là em tự làm không?" | cách phân loại từng lần — **bằng chứng** |
| "Mô hình bộ nhớ tin em nhớ bài này đến mức nào, và tin từ lúc nào?" | số do FSRS tính — **ước lượng** |
| "Ba mẹ nên đọc em đang ở mức nào?" | một nhãn duy nhất — **trạng thái** |

Câu hỏi thứ hai là chỗ hỏng thật. Trước 0015, "lần làm này có được tính là độc lập không" chỉ tồn tại **bên trong các bộ đếm đang chạy** trên `skill_evidence` (`correct_count`, `assisted_count`, …). Mỗi lần làm mới ghi đè bộ đếm, và sự thật của lần cũ biến mất. Hệ quả cụ thể:

- Ba mẹ thấy `SUPPORTED` và hỏi "vì sao?" — hệ thống không còn dòng nào để chỉ vào. Bộ đếm nói `assisted_count = 3` nhưng không nói ba lần nào, vào lúc nào, dưới mức gợi ý nào.
- Một lần làm được ghi với `help_level = 0` và `attemptNo = 1` (điều kiện độc lập theo ADR-001) có thể bị tính lại sau khi ai đó sửa một dòng khác. Không có bản ghi bất biến nào để đối chiếu.

Câu hỏi thứ ba trước đây **không được trả lời chút nào**. `review.ts` có một quyết định ghi rõ: thẻ FSRS được tính lại mỗi lần gọi, **không bao giờ lưu**, vì "trạng thái mô hình đã lưu có thể trôi khỏi sổ cái mà ba mẹ đọc". Mối lo đó đúng. Nhưng cái giá phải trả thì không được ghi ở đâu: **không thể kiểm tra, không thể so sánh giữa các phiên bản mô hình, không thể phát hiện trôi**. Không lưu không làm mô hình đúng hơn — nó chỉ làm mô hình không quan sát được.

## Quyết định

**Tách hồ sơ học sinh thành bốn lớp, mỗi lớp chỉ trả lời câu hỏi của chính nó.**

### Lớp 1 — QUAN SÁT: `learning_attempts`

Những gì đứa trẻ thực sự làm. Một dòng append-only cho mỗi lần nộp bài. **Không đổi trong migration này** — bảng này vốn đã là lớp thô đúng nghĩa.

### Lớp 2 — BẰNG CHỨNG: `skill_evidence_observation` (mới)

Một dòng cho mỗi cặp (lần làm, kỹ năng), ghi lại lần làm đó **được phép tính là gì**:

```sql
observed_kind TEXT NOT NULL
                CHECK (observed_kind IN ('independent','assisted','correction')),
help_level    INTEGER NOT NULL DEFAULT 0 CHECK (help_level >= 0 AND help_level <= 4),
attempt_no    INTEGER NOT NULL DEFAULT 1,
UNIQUE (learner_id, skill_id, attempt_id)
```

Ba quyết định trong ba dòng đó:

- **Khoá trên lần làm, không khoá trên lần chạy.** `UNIQUE (learner_id, skill_id, attempt_id)` khiến bảng này **tái tạo được chính xác** từ `learning_attempts`. Đó là điều làm nó thành một lớp *bằng chứng* chứ không phải thêm một ý kiến nữa.
- **`observed_kind` do đúng `isIndependentAttempt()` tính** — nguồn chân lý duy nhất theo ADR-001, không phải một bản sao thứ tư của quy tắc đó.
- **`help_level` được chép vào, không đọc lại.** Mức gợi ý có hiệu lực lúc chấm nằm ngay trong dòng bằng chứng, nên việc phân loại có thể được kiểm toán đối chiếu với đúng vệt gợi ý mà nó đã được chấm dưới.

Bảng này **append-only**: trigger `skill_evidence_observation_no_update` chặn `UPDATE`. Lý do giống hệt `audit_events` ở migration 0004: lớp bằng chứng tồn tại để được chỉ vào khi ba mẹ hỏi "vì sao trạng thái này là INDEPENDENT?", và một dòng bằng chứng sửa được thì có thể bị sửa để biện minh cho bất kỳ trạng thái nào.

### Lớp 3 — ƯỚC LƯỢNG: `skill_estimate` (mới)

Trạng thái bộ nhớ FSRS-6 (stability, difficulty, retrievability) **như đã tính tại một thời điểm xác định, từ một tiền tố sổ cái xác định**.

Đây không phải một quyết định xếp lịch — `review_schedule` đã giữ ngày đến hạn. Bảng này giữ **mô hình bộ nhớ đằng sau** quyết định đó, để ba mẹ hỏi được "mô hình tin chắc đến đâu, và tin đó cũ hơn dữ liệu bao lâu?" mà không phải chạy FSRS trong đầu.

### Lớp 4 — TRẠNG THÁI: `skill_evidence.state`

Nhãn duy nhất ba mẹ đọc: `NOT_OBSERVED → SUPPORTED → INDEPENDENT → RETAINED → TRANSFERRED`. **Không đổi trong migration này.** Trạng thái vẫn được `deriveCompetency()` suy ra từ sổ cái lần làm, **không bao giờ được ghi từ `skill_estimate`**.

## Đảo ngược quyết định "thẻ được suy ra, không bao giờ lưu"

Quyết định cũ trong `review.ts` bị đảo, và lý do phải rõ: **giữ mô hình không lưu không làm nó đúng hơn, chỉ làm nó không quan sát được.** Rủi ro trôi là thật, nhưng nó được xử lý bằng thiết kế chứ không bằng cách ném số đi.

Mỗi dòng `skill_estimate` mang theo bằng chứng chống trôi của chính nó:

| Cột | Nói gì |
|---|---|
| `attempt_watermark` | `attemptId` của lần làm cuối cùng đã được gộp vào ước lượng này |
| `attempt_count` | có bao nhiêu lần làm đã được gộp |
| `model_version` | phiên bản FSRS đã tính (`v6.0.0` hôm nay) |
| `computed_at` | thời điểm mô hình tính ra những con số này |

Người đọc so ba cột đầu với `learning_attempts` và biết ngay con số còn hiện hành hay cần tính lại — **không cần chạy lại mô hình**. Và nếu muốn kiểm tra con số, họ chạy lại mô hình: `computeEstimate()` dùng lại đúng hàm `replay()` mà `scheduleReview()` dùng, nên tính lại **luôn tái tạo được bit-for-bit** những gì đã ghi.

**Ước lượng là một bộ đệm có nghĩa vụ chứng minh, không phải nguồn chân lý.**

## Additive only — vì sao không tái cấu trúc `skill_evidence`

Không cột nào bị thêm vào, bỏ khỏi, hay đổi tên trên bảng đã có. Lý do là một hành vi cụ thể của SQLite 3.53: `ALTER TABLE … DROP COLUMN` **thành công nhưng âm thầm xoá mọi CHECK constraint tham chiếu tới cột bị bỏ**. Tái cấu trúc `skill_evidence` sẽ lặng lẽ vứt bỏ ràng buộc `COMPETENCY_STATES` — ràng buộc chặn một nhãn trạng thái không tồn tại. Ràng buộc mới do hai bảng mới mang, không do sửa bảng cũ.

## `replay()` bỏ qua `parent_correction` — vì sao

`replay()` lọc `evidenceKind !== "parent_correction"` trước khi bước FSRS. Dòng đó ghi **lời khẳng định của ba mẹ**, không phải kết quả học tập của đứa trẻ. Chấm điểm nó sẽ cho một lời đính chính thiện chí âm thầm viết lại mô hình bộ nhớ — đúng kiểu hỏng ADR này được tạo ra để ngăn. Quyền quyết định của ba mẹ vẫn có hiệu lực đầy đủ, chỉ ở đúng chỗ của nó: làm **sàn** cho `state` trong `deriveCompetency()`, nơi một lần làm sai sau đó không kéo trạng thái xuống dưới mức ba mẹ đã đặt.

## Vì sao chèn vào lớp 2 là `INSERT` thường, không phải upsert

`evidenceObservationInsert()` dùng `INSERT` trơn. Bảng append-only và khoá theo lần làm, nên **xung đột nghĩa là cùng một lần làm đã được phân loại hai lần**. Đó là vi phạm bất biến thật và phải làm hỏng cả batch, không phải bị nuốt bằng `ON CONFLICT DO UPDATE`.

Ngược lại, `skillEstimateUpsert()` là upsert vì mỗi kỹ năng có đúng **một** ước lượng hiện hành (`UNIQUE (learner_id, skill_id)`) — ước lượng cũ bị thay thế, và điều đó đúng: nó là bộ đệm, không phải lịch sử.

## `computedAt` là tham số riêng, không phải `now`

`skillEstimateUpsert()` nhận `computedAt` **tách khỏi** `now`. Khi khôi phục từ sao lưu, dòng ước lượng phải giữ **thời điểm tính gốc**, không phải thời điểm khôi phục. Gộp hai thứ đó sẽ khiến một bản khôi phục tháng 3 trông như vừa được tính lại hôm nay, và watermark mất hết ý nghĩa.

## Điều ADR này **không** khẳng định

**Trigger append-only không chặn `DROP TABLE`, thay đổi schema, hay thay thế tệp cơ sở dữ liệu.** Đúng ranh giới mà 0004 đã ghi cho `audit_events`, và ghi lại ở đây thay vì để người đọc suy ra rằng "append-only" nghĩa là bất biến tuyệt đối. Nó chặn sửa-tại-chỗ qua SQL. Nó không chặn người có quyền ghi vào tệp.

**`skill_estimate` có thể trôi mà không ai báo động.** Watermark cho phép *phát hiện* trôi khi có người so sánh; nó không tự chạy. Không có tiến trình nền nào tính lại ước lượng, và ADR này không thêm cái đó. Một ước lượng cũ ngồi đó cho tới khi lần làm kế tiếp ghi đè.

**`retrievability_at` chỉ có nghĩa tại hoặc sau `last_review_at`.** Hàm kẹp `nowMs` lên `lastReviewAt` trước khi hỏi FSRS, vì hỏi sớm hơn là ngoại suy ngược. Ngoại suy ngược không bị ngăn bởi schema — nó bị ngăn bởi đúng một dòng mã, không phải bởi một bất biến đã chứng minh.

**Ước lượng lưu được không chứng minh được mô hình đúng.** Nó chứng minh được rằng cùng một sổ cái luôn cho cùng một con số. Đó là điều `test/integration/four-layer-learner-model.test.ts` kiểm tra — tính tái tạo, không phải tính chính xác sư phạm của FSRS-6 với đứa trẻ này.

## Hệ quả

**Được:**
- Mỗi câu hỏi về một đứa trẻ có đúng một lớp được phép trả lời. "Vì sao `SUPPORTED`?" giờ chỉ được vào một danh sách dòng bất biến, sắp theo thời gian.
- Trôi của mô hình bộ nhớ **phát hiện được** bằng ba cột số, không cần tin vào lời khẳng định.
- Hai lớp mới được sao lưu, khôi phục và chuyển giao cùng hồ sơ (`src/shared/schemas/transfer.ts:201,217`), với điều kiện nhập từ chối tham chiếu treo: một quan sát nêu `attemptId` không tồn tại, hay một ước lượng có `attemptWatermark` không trỏ tới đâu, sẽ đưa trôi trở lại — đúng thứ watermark tồn tại để bắt.
- Xoá học sinh xoá được cả hai lớp: thứ tự xoá đặt chúng trước `learning_attempts` ở cả `resetUserData` và `deleteLearnerCascade`.

**Mất / chấp nhận:**
- Mỗi lần làm thêm hai lượt ghi trong cùng batch (`session-service.ts:261,278`). Trong một household một-học-sinh đây là chi phí không đáng kể; nó vẫn là chi phí phải trả ở mọi lần nộp bài.
- `skill_estimate` là dữ liệu dư thừa có chủ đích. Nó **có thể** sai so với sổ cái, và đó là lý do tồn tại của watermark chứ không phải một lỗi cần vá.
- Ba tài liệu phải nhớ hai bảng mới: mọi danh sách bảng xoá, mọi truy vấn kiểm tra clean-room, và mọi lần xuất/nhập sao lưu. Đây là nợ kỹ thuật **đã trả một lần** bằng test `four-layer-learner-model.test.ts`, nhưng bảng thêm sau này sẽ phải trả lại.

**Không thay đổi:**
- `learning_attempts` vẫn là nguồn chân lý duy nhất. Xoá hai lớp mới và chạy lại hệ thống sẽ tái tạo chúng từ sổ cái.
- `skill_evidence.state` vẫn do `deriveCompetency()` suy ra từ sổ cái lần làm. Không có đường nào từ lớp 3 sang lớp 4.
- `audit_events` không ghi lớp 2 hay lớp 3. Đây là dữ liệu suy ra được, không phải hành động cần bằng chứng riêng.
