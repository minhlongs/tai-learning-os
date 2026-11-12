# GIAO THỨC ĐO LƯỜNG: ĐIỂM XUẤT PHÁT VÀ GHI NHỚ SAU 14/30 NGÀY
## BASELINE + DELAYED-RETENTION MEASUREMENT PROTOCOL

**Dự án:** TAI LEARNING OS
**Mục tiêu:** Thay những con số đang là **giả định** (0.95 xác suất nhớ, 30 ngày trần ôn tập) bằng **bằng chứng đo được** trên chính bé Tài.

> **Bilingual guide / Hướng dẫn song ngữ.** Phần tiếng Việt ở trên, phần English ở dưới mỗi mục.

---

## 0. Vì sao phải có tài liệu này (Why this document exists)

Bộ lập lịch ôn tập (FSRS-6) được chỉnh để một kỹ năng còn **95% khả năng nhớ** đúng vào ngày đến hạn ôn. Con số 0.95 đó **không phải** kết quả đo bé Tài — nó là một giả định khởi đầu có lý lẽ, lấy từ nghiên cứu chung. Giao thức này là cách biến giả định đó thành phép đo: **trong số những kỹ năng bé đã tự giải được, bao nhiêu kỹ năng bé vẫn tự giải được sau khi khoảng cách thời gian thật sự trôi qua?**

> The FSRS-6 scheduler is tuned so a skill sits at **0.95 recall** on its due date. That 0.95 is an assumption about this child, not a measurement of her. This protocol turns the assumption into a measurement: **of the skills she solved unaided, how many can she still solve unaided once the interval has actually elapsed?**

---

## 1. Nửa thứ nhất: Điểm xuất phát (The baseline half)

### 1.1 Bảng dữ liệu (Where it is stored)

Mỗi lần đánh giá đầu vào là **một dòng** trong bảng `baseline_assessments` (migration `0003_curriculum_and_trust_closure.sql`):

| Cột | Ý nghĩa với phụ huynh |
|---|---|
| `learner_id` | Buổi đánh giá này của bé nào |
| `subject_id` | Môn nào (Toán, Tiếng Việt, Tiếng Anh, Khoa học, Tư duy phản biện) |
| `session_id` | Buổi học nào đã sinh ra dữ liệu này |
| `status` | `pending` (chưa tổng hợp) → `completed` (máy đã tổng hợp) → `reviewed` (phụ huynh đã đọc và duyệt) |
| `observed_summary_vi` | Những gì **quan sát được**: số bước, số câu tự làm đúng, số lần dùng gợi ý |
| `supported_summary_vi` | Những kỹ năng **có bằng chứng vững** — bé tự giải ngay lần đầu, không gợi ý, không thử lại |
| `needs_observation_json` | Những kỹ năng **cần xem thêm** — chưa có lượt làm, hoặc mới làm được khi có gợi ý |
| `suggested_lessons_json` | Danh sách bài học nên bắt đầu, để lấp đúng chỗ hổng |
| `parent_review_required` | Mặc định `1`: **máy không tự chốt**, phụ huynh phải xem |
| `created_at` / `completed_at` | Thời điểm tạo và thời điểm tổng hợp xong |

> **Lưu ý về tên cột:** tài liệu [`docs/BASELINE_ASSESSMENT.md`](BASELINE_ASSESSMENT.md) mô tả cùng các trường này bằng tên kiểu `observedSummaryVi`, trong khi cơ sở dữ liệu dùng `observed_summary_vi`. Đây là **cùng một dữ liệu**, chỉ khác cách viết. Tên trong bảng trên là tên thật trong cơ sở dữ liệu. Việc lệch tên đã được ghi thành issue riêng để sửa tài liệu, không sửa lẫn vào giao thức này.

### 1.2 Trạng thái `reviewed` là mốc quan trọng (Why `reviewed` matters)

`status = 'reviewed'` nghĩa là **phụ huynh đã đọc và đồng ý** với bản tổng hợp. Chỉ khi đó con số điểm xuất phát mới được coi là "đã chốt". Một dòng `completed` nhưng chưa `reviewed` là bản nháp của máy, chưa phải kết luận của gia đình.

Lệnh đo phần này:

```bash
npm run retention:report
```

Báo cáo in ra `baselines: { total, reviewed }`. Nếu `total: 2, reviewed: 1` thì đã có 2 buổi đánh giá, nhưng chỉ 1 buổi được phụ huynh duyệt.

> `status = 'reviewed'` means the parent has read and accepted the summary. Only then is the baseline a settled number. A `completed` row the parent has not reviewed is the machine's draft, not the family's conclusion.

---

## 2. Nửa thứ hai: Ghi nhớ trì hoãn (The delayed-retention half)

### 2.1 "Lần kiểm tra trì hoãn" là gì (What a delayed probe is)

Một **lần kiểm tra trì hoãn** (*delayed probe*) là một lượt làm bài thoả **cả bốn** điều kiện:

1. Cách lần làm gần nhất mà bé **tự giải được** ít nhất **14 ngày** (hoặc **30 ngày**, tuỳ mốc đang đo);
2. Là lượt làm **chính thức** (`purpose = 'official'`) — không phải lượt luyện tập;
3. **Không phải** bản ghi phụ huynh sửa tay (`evidence_kind <> 'parent_correction'`);
4. Có gắn với một kỹ năng cụ thể (`skill_id`).

Lượt làm đó **đã có sẵn** trong sổ ghi bài. Giao thức này **không ghi gì thêm và không lên lịch gì cả** — nó chỉ đọc lại lịch sử và đếm.

> A delayed probe is an attempt that answers a skill at least 14 (or 30) calendar days after the last attempt where she solved it unaided, is official rather than practice, is not a parent-recorded correction, and carries a skill id. It already exists in the ledger; this protocol writes nothing and schedules nothing.

### 2.2 Vì sao "ngày" là ngày trên lịch Việt Nam (Calendar days, not 24-hour blocks)

Khoảng cách được đếm bằng **ngày trên lịch `Asia/Ho_Chi_Minh`**, dùng cùng hàm `vnCalendarDate()` mà bộ lập lịch dùng. Vì vậy "14 ngày" nghĩa là **14 ngày trên lịch của bé**, không phải 14 × 24 giờ đo từ một múi giờ khác.

Ví dụ: làm lúc 23:00 ngày 5/1, làm lại lúc 00:30 ngày 19/1 → **14 ngày trên lịch**, dù thời gian trôi chỉ khoảng 13 ngày 1,5 giờ.

> Gaps are counted as calendar dates in `Asia/Ho_Chi_Minh`, using the same `vnCalendarDate()` the scheduler uses — so "14 days" means 14 dates on the child's own calendar, never 14 × 24 hours measured from another timezone.

### 2.3 Mốc neo và việc đặt lại mốc (The anchor, and when it resets)

- Mốc neo (*anchor*) luôn là **lần tự giải được gần nhất**.
- Nếu một lượt làm đến **quá sớm** để tính là kiểm tra, mà bé vẫn tự giải đúng, thì lượt đó **trở thành mốc neo mới**.
- Nếu lượt kiểm tra **sai**, mốc neo bị **xoá** — vì sau khi bé đã quên, lần học cũ không còn mô tả đúng điều bé biết nữa. Nếu giữ mốc cũ, mọi lần thử lại sau đó đều bị tính thành "kiểm tra mới", làm mẫu số phồng lên trong cùng một đợt quên.

Hệ quả có chủ đích: một kỹ năng được ôn đều mỗi 14 ngày sẽ sinh ra **nhiều lần kiểm tra 14 ngày** và **không có** lần kiểm tra 30 ngày — vì các lần ôn ở giữa đã đặt lại mốc neo trước khi khoảng cách kịp chạm một tháng. Con số 30 ngày trả lời câu "còn nhớ gì sau một tháng **không ôn**"; một bé chưa từng trải qua một tháng không ôn thì **chưa có bằng chứng cho câu đó**.

> The anchor is always the most recent independent solve. A too-soon solve that is still unaided becomes the new anchor. A failed probe clears the anchor, so retries inside one forgetting episode are not counted as fresh probes. A skill reviewed every 14 days therefore produces 14-day probes and no 30-day probe — that is a property of the protocol, not a defect.

### 2.4 "Tự giải được" nghĩa là gì (What "unaided" means)

Giao thức **không định nghĩa lại** tiêu chuẩn này. Nó gọi đúng hàm `isIndependentAttempt()` trong `src/shared/engine/competency.ts` — cùng một quy tắc mà bộ máy tính mức thành thạo đang dùng:

- hệ thống tự quan sát được (`evidence_kind = 'observed'`);
- trả lời **đúng**;
- **không dùng gợi ý** (`help_level = 0`);
- **lần thử đầu tiên** (`attempt_no = 1`).

Nếu sau này quy tắc "tự giải" thay đổi, con số ghi nhớ **buộc phải thay đổi theo**. Hai bản sao của cùng một định nghĩa sẽ lệch nhau, và khi đó giao thức sẽ đo một tiêu chuẩn mà bộ máy chưa từng dùng.

> The protocol delegates to `isIndependentAttempt()` rather than re-expressing the rule, so retention moves with mastery if the rule ever changes.

---

## 3. Các trạng thái của báo cáo (The report's states)

`npm run retention:report` **chỉ** in ra một trong bốn trạng thái sau. Đây là điểm quan trọng nhất của giao thức. Ba trạng thái đầu do công cụ đo sinh ra; trạng thái thứ tư là của chính câu lệnh, khi chưa có hồ sơ học sinh nào để đo:

| Trạng thái | Nghĩa là gì | Phụ huynh nên hiểu |
|---|---|---|
| `NO_DATA` | Chưa có lượt làm bài nào được ghi cho bé | "Chưa bắt đầu đo" — **không phải** "bé không nhớ gì" |
| `AWAITING_PROBES` | Đã có lượt làm, nhưng chưa lượt nào cách mốc neo đủ xa | "Đồng hồ đang chạy" — cần chờ đủ 14 ngày |
| `MEASURED` | Đã có ít nhất một mốc có ít nhất một lần kiểm tra | Con số bên dưới là **đo được thật** |
| `NO_LEARNER` | Không tìm thấy hồ sơ học sinh đang hoạt động | Chưa cài đặt xong |

Khi chưa có lần kiểm tra nào, `correctRate` là **`null`**, tuyệt đối **không phải `0`**. "Chưa được kiểm tra sau 14 ngày" và "quên sạch sau 14 ngày" là **hai sự thật khác nhau**; một báo cáo in `0` cho cả hai sẽ biến **thiếu bằng chứng** thành **bằng chứng của việc quên**.

> When no probe exists yet, `correctRate` is `null`, never `0`. "She has not been tested after 14 days" and "she forgot everything after 14 days" are different facts, and a report that prints `0` for both turns absence of evidence into evidence of forgetting.

---

## 4. Đo được gì ngay hôm nay (What is measured today)

### 4.1 Trên cơ sở dữ liệu thật của gia đình (On the household database)

Đo trên HEAD, đọc-chỉ, ngày 2026-11-13:

```bash
npm run retention:report
```

```json
{
  "ok": true,
  "protocol": "delayed-retention",
  "status": "NO_DATA",
  "learnerFound": true,
  "eligibleAttempts": 0,
  "skillsSeen": 0,
  "skillsWithAnchor": 0,
  "baselines": { "total": 0, "reviewed": 0 }
}
```

**Đây là câu trả lời trung thực, không phải lỗi.** Cơ sở dữ liệu hộ gia đình hiện có **0 lượt làm bài**, **0 buổi học đã kết thúc**, **0 bản đánh giá đầu vào**. Không có số liệu nào để đo, và báo cáo nói đúng như vậy thay vì bịa ra một con số.

> **This is the honest answer, not a bug.** The household database holds 0 attempts, 0 completed sessions and 0 baseline assessments. There is nothing to measure, and the report says so instead of inventing a figure.

### 4.2 Bộ đo có đo được số thật không? (Does the instrument actually produce a number?)

Câu hỏi đúng là: *bộ đo này đã bao giờ in ra một con số chưa, và con số đó có kiểm chứng được không?* Để trả lời, có một bài diễn tập dựng một lịch sử **đã biết trước đáp án**, rồi **khẳng định** đáp án đó:

```bash
npm run retention:drill
```

```json
{
  "ok": true,
  "drill": "delayed-retention-14-30",
  "status": "MEASURED",
  "eligibleAttempts": 10,
  "skillsSeen": 4,
  "skillsWithAnchor": 4,
  "baselines": { "total": 2, "reviewed": 1 },
  "horizons": [
    { "horizonDays": 14, "probes": 4, "correct": 2, "correctRate": 0.5 },
    { "horizonDays": 30, "probes": 3, "correct": 2, "correctRate": 0.6666666666666666 }
  ],
  "writeRefused": true
}
```

Bài diễn tập chạy trong một thư mục tạm, **không bao giờ mở** `.wrangler/state`, **không chạm** `.dev.vars`, **không ghi** vào cơ sở dữ liệu của bé Tài. Nó cũng chứng minh kết nối đọc của báo cáo **thật sự không ghi được** (`writeRefused: true`).

> The drill builds a timeline whose answer is known in advance and asserts it, in a fresh temp directory that never opens `.wrangler/state` and never touches `.dev.vars`. It also proves the report's reader cannot write.

### 4.3 Muốn đo thật thì cần gì (What a real measurement requires)

Không có bước nào dưới đây được tự động chạy khi chưa có người học ngồi vào máy:

1. Bé làm bài dưới sự quan sát trực tiếp của phụ huynh — các lượt làm được ghi vào sổ.
2. Phụ huynh tổng hợp điểm xuất phát tại `/parent/baseline` và **duyệt** kết quả (`status = 'reviewed'`).
3. **Chờ đủ 14 ngày trên lịch** rồi cho bé làm lại cùng kỹ năng đó **không gợi ý**.
4. Chạy `npm run retention:report`. Lúc đó trạng thái chuyển từ `AWAITING_PROBES` sang `MEASURED`.

Cho đến khi bước 3 xảy ra, **mọi con số ghi nhớ đều là giả định**, và báo cáo sẽ nói đúng như vậy.

> Until a real child comes back after 14 calendar days, every retention figure is still an assumption — and the report says so.

---

## 5. Câu lệnh và tệp liên quan (Commands and code map)

| Thành phần | Đường dẫn |
|---|---|
| Bộ máy tính ghi nhớ | `src/shared/engine/retention.ts` |
| Truy vấn đọc dữ liệu | `src/worker/db/retention-queries.ts` |
| Lệnh báo cáo (chỉ đọc) | `scripts/retention-report.mjs` — `npm run retention:report` |
| Bài diễn tập có đáp án biết trước | `scripts/retention-drill.mjs` — `npm run retention:drill` |
| Kiểm thử quy tắc (unit) | `test/unit/retention-protocol.test.ts` — 22 test |
| Kiểm thử SQL trên D1 thật (integration) | `test/integration/retention-protocol.test.ts` — 14 test |

---

## 6. Những gì giao thức này **không** khẳng định (What this protocol does **not** claim)

- **Không** khẳng định 0.95 là đúng cho bé Tài. Ngược lại: nó tồn tại để kiểm tra điều đó.
- **Không** khẳng định 30 ngày là trần đúng cho bé Tài. Đó là chính sách của dự án, chưa được đo.
- **Không** dự đoán tương lai và không dùng mô hình ngôn ngữ. Nó chỉ đếm lại những gì sổ ghi bài đã ghi.
- **Không** dùng bảng `review_schedule` làm nguồn, vì bảng đó chỉ giữ **ngày đến hạn hiện tại**, không giữ lịch sử. Một lần kiểm tra suy ra từ bảng đó sẽ **không thể tính lại và đối chiếu** về sau. `learning_attempts` là sổ chỉ-thêm (*append-only*), nên một lần kiểm tra suy ra từ nó **có thể tính lại** bất cứ lúc nào.

> This protocol does not claim 0.95 or 30 days are right for this child — it exists to test that. It does not predict, and it uses no language model: it only recounts what the ledger already holds. It deliberately does not read `review_schedule`, which keeps only the *current* due date, so a probe derived from it could not be recomputed and checked later; `learning_attempts` is append-only, so a probe derived from it can be.
