# BÁO CÁO TOÀN VẸN SƯ PHẠM VÀ CƠ CHẾ ĐÁNH GIÁ NĂNG LỰC (GATE 02)
## GATE 02 LEARNING INTEGRITY REPORT — TAI LEARNING OS

**Ngày lập:** 25/10/2026  
**Chủ đề:** Tính trung thực của dữ liệu học tập, cơ chế chấm điểm và chống gian lận  

---

### 1. BẢO VỆ ĐÁP ÁN: KHÔNG BAO GIỜ GỬI ĐÁP ÁN XUỐNG TRÌNH DUYỆT (ZERO ANSWER KEYS IN BROWSER)

- **Nguyên tắc bất biến:** Toàn bộ dữ liệu bài học khi gửi xuống phía học sinh (`StartSessionResponse`) đều phải đi qua bộ lọc `toLearnerExercise()` (`src/shared/schemas/exercise.ts`).
- **Các trường bị loại bỏ hoàn toàn:**
  - `correctChoiceId` (trắc nghiệm)
  - `correctNumerator`, `correctDenominator` (phân số)
  - `evidenceSentence_vi`, `sentenceAcceptedWords` (đọc hiểu)
  - `explanationVi` (lời giải thích chi tiết — chỉ được mở sau khi nộp bài đúng)
- **Kiểm định thực nghiệm:**
  - `test/integration/learner-journey.test.ts` duyệt qua từng bước của tất cả 9 bài học trong cơ sở dữ liệu và xác nhận hàm `leaksAnswer(step.content)` luôn trả về `false`.
  - Không thể đọc trước đáp án từ DevTools hay mạng máy tính.

---

### 2. CHỐNG GIAN LẬN MỨC GỢI Ý (PROGRESSIVE HINT DISCLOSURE INTEGRITY)

- **Cơ chế 4 cấp độ gợi ý:**
  - Mức 1: Nhắc nhở định hướng chung.
  - Mức 2: Gợi mở phương pháp tư duy.
  - Mức 3: Hướng dẫn một phần cách giải (bắt đầu tính là `assisted`).
  - Mức 4: Gần như toàn bộ lời giải mẫu (`assisted`).
- **Lỗ hổng đã triệt tiêu:**
  - Học sinh mở gợi ý mức 3 hoặc 4, sau đó can thiệp mã JavaScript phía client gửi `helpLevel: 0` khi nộp bài.
  - **Khắc phục ở Gate 02:** Server ghi nhận sự kiện kiểm toán `hint.requested` kèm `level` và `sessionId`. Khi nhận yêu cầu nộp bài tại `POST /api/learner/attempts`, server tự động truy vấn mức gợi ý cao nhất đã mở qua `findMaxDisclosedHintLevel` và cưỡng chế:
    ```ts
    const effectiveHelpLevel = Math.max(clampHelp(body.helpLevel), disclosedHintLevel);
    ```
  - Mọi bài làm đã mở gợi ý $\ge 3$ đều bị gắn cờ `evidence_kind = 'assisted'` vĩnh viễn trong nhật ký bài làm.

---

### 3. CHỐNG ĐOÁN MÒ ĐÁP ÁN (ANTI-BRUTE-FORCE & GUESSING DEFENSE)

- **Quy tắc nỗ lực độc lập (`isIndependentAttempt`):**
  - Trước Gate 02: Bất kỳ bài làm đúng nào không dùng gợi ý (`helpLevel <= 2`) đều được tính là độc lập, kể cả khi học sinh đã thử sai 3 lần trước đó trong cùng bước học.
  - Sau Gate 02: Bổ sung ràng buộc `attemptNo === 1`. Chỉ lần thử đầu tiên của một bước học trong một phiên mới được công nhận là giải độc lập. Lần thử thứ hai trở đi (`attemptNo > 1`) dù làm đúng vẫn không được tính vào số lần giải độc lập (`independentCount`).

---

### 4. THU HỒI NĂNG LỰC VÀ ĐẶT LẠI LỊCH ÔN TẬP KHI THẤT BẠI (RETENTION FAILURE RESET)

- **Máy trạng thái năng lực (`deriveCompetency`):**
  - Trạng thái `RETAINED` (Ghi nhớ bền vững) chỉ đạt được khi học sinh vượt qua bài ôn tập định kỳ (`isReview`) một cách độc lập.
  - Nếu học sinh thất bại trong lần ôn tập (`isReview` và `outcome === 'incorrect'`), trạng thái năng lực lập tức bị hạ về `INDEPENDENT`.
- **Lập lịch lặp lại ngắt quãng (`scheduleReview`):**
  - Thang dãn cách tiêu chuẩn: `[1, 3, 7, 14]` ngày.
  - Khi trượt bài ôn tập, khoảng thời gian ôn tập lập tức bị reset về `1` ngày (`failureRetryDays`), đồng thời ghi nhận `failureStreak = 1` để phụ huynh theo dõi.
  - Nếu chuỗi thất bại liên tiếp $\ge 3$, cờ `needsParentAttention` sẽ được bật để yêu cầu phụ huynh vào can thiệp hỗ trợ.
