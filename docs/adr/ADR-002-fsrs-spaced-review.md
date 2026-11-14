# ADR-002 — Khoảng cách ôn tập do FSRS-6 tính, không dùng thang cố định

**Trạng thái:** Đã chấp nhận (2026-11-08)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `src/shared/engine/review.ts`, `package.json` (`ts-fsrs` 6.0.0)

---

## Bối cảnh

Bản gốc dùng một thang dãn cách viết cứng: **1 → 3 → 7 → 14 ngày**, rồi lặp lại 14.
Thang này có ba khuyết điểm không sửa được bằng cách chỉnh số:

1. **Nó phớt lờ chính lịch sử làm bài của Tài.** Em làm đúng một kỹ năng khó lần đầu, hay phải vật lộn ba lần rồi mới qua sau khi được gợi ý — cả hai trường hợp nhận đúng cùng một khoảng cách, vì thang chỉ đếm số lần, không đọc chất lượng từng lần.
2. **Nó trần cứng ở 14 ngày vĩnh viễn.** Một kỹ năng đã nhớ rất vững vẫn bị gọi ôn lại mỗi hai tuần, tốn thời gian của trẻ vào thứ trẻ đã biết.
3. **Nó không có mô hình nào phía sau.** Con số `14` không xuất phát từ dữ liệu nào cả — nó là một quy ước được chép lại.

FSRS-6 (Free Spaced Repetition Scheduler, thế hệ 6) giải đúng ba điểm này: nó nhận chuỗi `Again/Hard/Good/Easy` kèm thời điểm thực tế, và mô hình hoá độ ổn định ký ức (`stability`) cùng độ khó (`difficulty`) của từng thẻ để tính khoảng cách tiếp theo.

## Quyết định

**Pinned `ts-fsrs` đúng phiên bản `6.0.0`** (không dùng `^`, để một bản vá thượng nguồn không âm thầm đổi lịch học của trẻ), và cấu hình:

```ts
fsrs(generatorParameters({
  request_retention: 0.95,
  maximum_interval: 30,
  enable_fuzz: false,
  enable_short_term: false,
}))
```

Bốn quyết định trong bốn tham số đó, mỗi cái có lý do riêng:

### `request_retention: 0.95`

Đây là xác suất Tài còn nhớ đúng vào ngày đến hạn. FSRS mặc định 0.90 (dành cho người lớn tự học). Một học sinh lớp 4 mất nhiều hơn người lớn khi quên: mất niềm tin, phải học lại từ đầu một bước, và phụ huynh phải ngồi vào dạy lại. Đo thực tế trên HEAD, cùng trần 30 ngày, 6 lần `Good` liên tiếp:

| `request_retention` | Lịch thu được (ngày) |
|---|---|
| 0.80 | 8 → 30 → 30 → 30 → 30 → 30 |
| 0.85 | 4 → 30 → 30 → 30 → 30 → 30 |
| 0.90 | 3 → 14 → 30 → 30 → 30 → 30 |
| **0.95** | **3 → 6 → 15 → 30 → 30 → 30** |
| 0.97 | 3 → 3 → 6 → 11 → 19 → 30 |

0.80 và 0.85 đẩy thẳng lên trần ngay lần ôn thứ hai — với một đứa trẻ 9 tuổi, đó là quá lạc quan và sẽ vỡ đúng vào lúc không ai để ý (kỳ báo cáo cuối kỳ). 0.97 thì gọi ôn lại quá dày (3 ngày rồi lại 3 ngày), biến việc học thành việc đối phó.

### `maximum_interval: 30`

Trần cho **người học này**, không phải một tuyên bố về mô hình. Đo tại 0.95:

| `maximum_interval` | Lịch thu được |
|---|---|
| 14 | 3 → 6 → **14** → 14 → 14 → 14 |
| 21 | 3 → 6 → 15 → **21** → 21 → 21 |
| **30** | **3 → 6 → 15 → 30 → 30 → 30** |
| 45 | 3 → 6 → 15 → 34 → **45** → 45 |
| 60 | 3 → 6 → 15 → 34 → **60** → 60 |

Một tháng đủ dài để một đứa trẻ vẫn còn nhớ, và đủ ngắn để một kỹ năng bị quên sẽ nổi lên **trong cùng học kỳ** — trước khi phụ huynh chỉ phát hiện ra ở bảng điểm. Với 45–60 ngày, khoảng trống có thể băng qua ranh giới học kỳ.

### `enable_fuzz: false` — bắt buộc

FSRS **cố ý** thêm nhiễu ngẫu nhiên vào khoảng cách để các thẻ đến hạn không dồn vào cùng một ngày. Nhưng `scheduleReview()` là một hàm thuần, và toàn bộ giá trị kiểm toán của hệ thống này nằm ở chỗ: **cùng một lịch sử làm bài phải luôn ra cùng một lịch ôn**. Nếu bật fuzz, phụ huynh bấm xem lại báo cáo hai lần sẽ thấy hai ngày khác nhau, và không ai giải thích được vì sao. Test `test/unit/review-scheduling.test.ts:129` — *"stays deterministic — the same history yields the same interval"* — khoá bất biến này.

Đánh đổi: mất tính năng dàn đều tải. Với một người học, vài kỹ năng đến hạn cùng ngày là chuyện chấp nhận được; mất tính tái lập thì không.

### `enable_short_term: false` — bắt buộc

Bộ lập lịch ngắn hạn của FSRS sinh ra các bước **dưới một ngày** (phút). Ba chỗ trong hệ thống không biểu diễn được đơn vị đó:

- `review_schedule.interval_days` là `INTEGER`
- `formatDaysUntil()` (`src/client/lib/format.ts:34`) tính bằng `Math.round(delta / DAY_MS)`
- `daysOverdue` trong dashboard phụ huynh cũng tính theo ngày nguyên

Hơn nữa, mô hình sử dụng thực tế của gia đình là **một phiên mỗi ngày**. Các bước vài phút không có chỗ đứng trong nhịp sống đó. Tắt short-term giữ cho mọi khoảng cách là bội số nguyên của 24 giờ.

## Ngày lịch Việt Nam

Mọi khoảng cách là bội số chính xác của `24 * 60 * 60 * 1000`. Việt Nam **không có giờ mùa hè (DST)**, nên `nowMs + N * DAY_MS` luôn rơi đúng vào **cùng giờ, N ngày lịch sau** theo `Asia/Ho_Chi_Minh`. Vì vậy yêu cầu "tính theo ngày lịch Việt Nam" được thoả mà không cần thư viện múi giờ nào.

Để phụ huynh đọc được bằng ngày thay vì suy ra từ mili giây, `ReviewDecision` có thêm `dueOnVi` (`YYYY-MM-DD`), sinh bởi `vnCalendarDate()` — cộng lệch +7 giờ rồi cắt chuỗi ISO. Test ranh giới UTC↔Việt Nam: `Date.UTC(2023,10,14,18,0,0)` → `"2023-11-15"`, `Date.UTC(2023,10,14,16,0,0)` → `"2023-11-14"`.

## Hai luật vẫn là của chúng ta, không phải của FSRS

FSRS chỉ nhìn thấy `Rating`. Nó không biết "có trợ giúp" nghĩa là gì, và nó không biết vì sao một lần sai nên được thử lại sớm.

1. **Trượt bài ôn → thử lại sau 1 ngày** (`failureRetryDays`), không theo lịch lapse của FSRS.
2. **Làm được nhưng có gợi ý → hẹn 1 ngày**, vì FSRS sẽ coi sự trợ giúp là ký ức. Việc ánh xạ `Grade` nằm ở `gradeFor()`: trả lời sai → `Again`; đúng mà không độc lập (`isIndependentAttempt() === false`) → `Hard`; đúng và độc lập → `Good`.

Lưu ý: FSRS coi `Hard` là **thành công nhưng khó**, nên nó vẫn có thể giãn khoảng cách. Vì vậy luật "1 ngày" ở trên được áp **trước** khi gọi FSRS (nhánh `!canClimb` trong `scheduleReview()`), chứ không phó mặc cho `Hard`.

## Hệ quả

**Được:**
- Khoảng cách giờ đọc được chất lượng từng lượt làm, và có cơ sở mô hình thay vì quy ước.
- `grep -rn "\[1, 3, 7, 14\]" src/` trả về **0 kết quả** — thang cũ không còn trong mã nguồn.

**Mất / chấp nhận — thay đổi sư phạm thật, không phải chi tiết kỹ thuật:**

- **Lần ôn đầu tiên của một kỹ năng mới đổi từ 1 ngày → 3 ngày.** Đo trên HEAD, thẻ rỗng, mỗi mức một lần:

  | Câu trả lời đầu | Khoảng cách |
  |---|---|
  | `Again` (sai) | 1 ngày |
  | `Hard` (đúng, có gợi ý) | 2 ngày |
  | **`Good` (đúng, độc lập)** | **3 ngày** |
  | `Easy` | 4 ngày |

  Đây là thay đổi có ý thức: 1 ngày là quá sớm để một ký ức vừa hình thành được kiểm tra có ý nghĩa. Nhưng nó **khác hành vi cũ** (`Good` từng cho 1 ngày), và test tích hợp `test/integration/evidence-and-ledger-integrity.test.ts:295` đã được cập nhật từ `1` sang `3` — test đó kiểm tra tính nguyên tử của `db.batch`, không phải giá trị khoảng cách.

- **`REVIEW_CONFIG.intervals` và `initialIntervalDays` bị xoá.** Đây là API nội bộ, nhưng là breaking change: mọi mã đọc hai trường này sẽ không biên dịch. Đó là mục đích — giữ lại chúng sẽ cho phép thang cũ sống sót một cách âm thầm.

**Rủi ro đã biết, chưa xử lý:**
- `src/worker/routes/learner.ts:675` tự dựng chuỗi `reasonVi: \`Ôn lại sau ${row.interval_days} ngày.\`` thay vì dùng `decision.reasonVi` từ bộ lập lịch. Hai câu giải thích cho cùng một sự việc là hai chỗ có thể lệch nhau. Ghi thành issue riêng, không sửa lẫn trong ADR này.

## Điều ADR này **không** khẳng định

Các con số 0.95 và 30 ngày là **giả định khởi đầu có lý lẽ, chưa được kiểm chứng trên chính Tài**. Chưa có dữ liệu ôn tập thật nào để nói 0.95 là đúng cho em. Giao thức đo lường (baseline + retention đo lại sau 14/30 ngày) là cách để thay giả định bằng bằng chứng, và nó được mô tả trong `docs/BASELINE_PROTOCOL.md`.
