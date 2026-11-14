# ADR-001 — Một chuẩn duy nhất cho "làm độc lập"

**Trạng thái:** Đã chấp nhận (2026-11-08)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `src/shared/engine/competency.ts`, `src/shared/engine/planner.ts`, `src/shared/schemas/attempt.ts`

---

## Bối cảnh

Hệ thống phải trả lời một câu duy nhất, lặp đi lặp lại, cho mỗi lượt làm bài của Tài:
**"Lần làm này có được tính là em tự làm độc lập không?"**

Câu trả lời này quyết định ba thứ khác nhau:

1. Trạng thái năng lực của kỹ năng (`COMPETENCY_STATES` trong `src/shared/schemas/attempt.ts:25`).
2. Khoảng cách ôn tập tiếp theo (qua `gradeFor()` trong `src/shared/engine/review.ts` — độc lập → `Good`, có trợ giúp → `Hard`).
3. Nội dung báo cáo chẩn đoán đầu vào mà phụ huynh đọc (`evaluateBaselineDiagnostic()`).

Trước ADR này, quy tắc đó được viết **ba lần, ở ba nơi, với ba mức chặt khác nhau**:

| Nơi | Cách kiểm tra | Lỗ hổng |
|---|---|---|
| `evidenceKindFor()` — `src/shared/schemas/attempt.ts:50` | `outcome === "correct" && helpLevel === 0 && attemptNo === 1` | Không xét `parent_correction`; đây là nơi ghi provenance lúc lưu, không phải nơi phán xét |
| `isIndependentAttempt()` — `src/shared/engine/competency.ts:62` | Thêm `evidenceKind !== "observed" → false` | Đúng, nhưng `attemptNo` là **tuỳ chọn** |
| `evaluateBaselineDiagnostic()` — `src/shared/engine/planner.ts:226` (trước ADR này) | `outcome === "correct" && helpLevel === 0 && attemptNo === 1` | **Thiếu hoàn toàn** kiểm tra `evidenceKind` |

Lỗ hổng thứ ba là lỗi thật, không phải vấn đề thẩm mỹ: một dòng `skill_evidence` do phụ huynh sửa tay (`source = 'parent_correction'`) được chuyển sang dạng `AttemptEvidence` với `evidenceKind: "parent_correction"` (`src/worker/services/session-service.ts:200`). Nếu dòng đó lọt vào báo cáo chẩn đoán mà không qua kiểm tra `evidenceKind`, hệ thống sẽ báo với phụ huynh rằng *"Em tự tin làm độc lập tốt N câu"* trong khi thực tế **không có lần nào em tự làm**. Đó là một lời nói dối về năng lực của trẻ, đúng loại điều mà toàn bộ hệ thống này được xây để chống lại.

## Quyết định

**`isIndependentAttempt()` trong `src/shared/engine/competency.ts:62` là nguồn chân lý duy nhất.**

Mọi nơi khác phải gọi hàm này, không được viết lại điều kiện. Cụ thể, `evaluateBaselineDiagnostic()` nay dựng một `AttemptEvidence` tối thiểu qua `asEvidence()` rồi gọi `isIndependentAttempt()`, và `BaselineDiagnosticInput.attempts[]` nhận thêm trường tuỳ chọn `evidenceKind` để giữ nguyên provenance từ DB (`src/worker/routes/parent.ts:1640` truyền `a.evidence_kind`).

Quy tắc đầy đủ, một câu: **một lượt làm là độc lập khi và chỉ khi `evidenceKind === "observed"`, `outcome === "correct"`, `helpLevel === 0`, và `attemptNo === 1`** (khi `attemptNo` được cung cấp).

`evidenceKindFor()` **không** phải chuẩn thứ hai. Nó là hàm ghi provenance phía server tại thời điểm lưu, và nó đã tự cấm `parent_correction` bằng kiểu dữ liệu: nó chỉ trả `"observed"` hoặc `"assisted"`. Không có đường nào để nó sinh ra `parent_correction`.

## Hệ quả

**Được:**
- Chẩn đoán đầu vào và động cơ năng lực không thể lệch nhau nữa. Có test: `test/unit/planner-engine.test.ts` — *"never counts a parent correction as an independent solve"*.
- Thêm một nơi tiêu thụ mới trong tương lai sẽ tự động đúng, vì chỉ có một hàm để gọi.

**Mất / chấp nhận:**
- `AttemptEvidence.attemptNo` vẫn là **tuỳ chọn**. Khi vắng mặt, `isIndependentAttempt()` coi như thoả (bỏ qua kiểm tra) thay vì từ chối. Hai nơi gọi trong production đều luôn truyền `attempt_no` lấy từ DB (`src/worker/services/session-service.ts:179` và `:394`), nên hiện tại không có đường nào lọt. Nhưng đây là **bất biến được giữ bởi quy ước, không bởi kiểu** — một caller mới quên truyền sẽ âm thầm nới lỏng luật. Ghi lại đây như món nợ kỹ thuật đã biết, không che.
- `BaselineDiagnosticInput.attempts[].evidenceKind` mặc định là `"observed"` khi thiếu, để không phá các fixture cũ. Cùng loại nợ: một caller mới quên truyền sẽ **thiên về phía tin tưởng** (nhận nhầm là độc lập). Đây là hướng sai nguy hiểm nhất và phải sửa thành `"assisted"` nếu có caller thứ hai.

**Không thay đổi:**
- `COMPETENCY_CONFIG.independentMinCorrect = 2` vẫn giữ nguyên: một lần đúng may mắn không đủ lập `INDEPENDENT`. Đây là **giả định khởi đầu, chưa được kiểm chứng** cho Tài, và được ghi đúng như vậy trong `docs/LEARNING_ENGINE.md`.

## Ghi chú về tài liệu sai

`docs/CURRICULUM_ARCHITECTURE.md` mục 3 và `docs/audits/GATE_03_REPORT.md:27` từng mô tả thang năng lực **5 bậc** có `EMERGING`. Điều này **không đúng với mã nguồn**: `COMPETENCY_STATES` (`src/shared/schemas/attempt.ts:25`) chỉ có `NOT_OBSERVED`, `SUPPORTED`, `INDEPENDENT`, `RETAINED`, `TRANSFERRED` — không có `EMERGING`. Mã nguồn là chuẩn; cả hai tài liệu đã được sửa để chép lại đúng bộ giá trị đó, và số đo hiện tại là `grep -rn "EMERGING" src/ test/` → **0** dòng. Chữ `EMERGING` chỉ còn tồn tại trong chính ghi chú lịch sử này, nơi nó đang được nhắc lại để giải thích — không phải một mô tả về hệ thống hiện hành.
