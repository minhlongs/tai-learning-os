# ĐỘNG CƠ LẬP KẾ HOẠCH HỌC TẬP 4 TUẦN
## FOUR-WEEK LEARNING PLANNER ARCHITECTURE

**Dự án:** TAI LEARNING OS  
**Mô-đun:** `src/shared/engine/planner.ts`, `/api/parent/planner`, `/parent/planner`

---

### 1. THUẬT TOÁN ƯU TIÊN TẤT ĐỊNH (DETERMINISTIC PRIORITY SCHEDULING)

Động cơ lập kế hoạch 4 tuần (`generateFourWeekPlan`) phân bổ các phiên học tập vào 4 tuần liên tiếp (mặc định 3 buổi/tuần, tối đa ~20 phút/buổi) thông qua 4 hàng đợi ưu tiên rời nhau (disjoint queues):
1. **Hàng đợi Ôn tập đến hạn (`reviewQueue`):** Các bài học gắn với kỹ năng đã đến hạn ôn tập cách quãng (`dueForReview = true`) nhằm củng cố trí nhớ dài hạn.
2. **Hàng đợi Lấp lỗ hổng tiên quyết (`gapQueue`):** Các kỹ năng nền tảng chưa có điều kiện tiên quyết phức tạp nhưng đang ở trạng thái `SUPPORTED` hoặc `NOT_OBSERVED`.
3. **Hàng đợi Khảo sát bổ sung (`observationQueue`):** Các kỹ năng được đánh giá đầu vào đánh dấu cần thu thập thêm bằng chứng thực tế (`needsObservation = true`).
4. **Hàng đợi Mở rộng chương trình (`generalQueue`):** Các bài học tiếp theo trong chương trình chưa đạt mức `TRANSFERRED`.

Mỗi bài học được gắn nhãn loại phiên (`sessionType`): `prerequisite_gap`, `retrieval_review`, `baseline_followup`, hoặc `new_skill`.

---

### 2. PHÂN LOẠI TRẠNG THÁI TRỰC QUAN

Trên màn hình quản trị `/parent/planner` và API trả về, các mục kế hoạch được phân nhóm tự động theo thời gian thực:
- `TODAY`: Bài học dự kiến diễn ra trong ngày hôm nay.
- `UPCOMING`: Các bài học sắp tới trong chu kỳ 4 tuần.
- `REVIEW DUE`: Các bài học ôn tập định kỳ đến hạn cần ưu tiên.
- `COMPLETED`: Các bài học đã hoàn thành.
- `NEEDS PARENT REVIEW`: Các bài học trong kế hoạch nhưng chưa được phụ huynh phê duyệt (`approved = false`) hoặc cần phụ huynh xem xét lại sau khi cập nhật phiên bản.

---

### 3. QUYỀN ĐIỀU CHỈNH CỦA PHỤ HUYNH

Phụ huynh hoàn toàn làm chủ kế hoạch học tập qua API `PATCH /api/parent/planner/item`:
- Đánh dấu hoàn thành (`status: "completed"`).
- Bỏ qua bài học (`status: "skipped"`).
- Dời lịch sang ngày khác (`scheduledDate: "YYYY-MM-DD"`, `status: "rescheduled"`).
- Ghi chú lưu ý sư phạm riêng cho từng buổi học (`parentNote`).
