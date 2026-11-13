# TAI LEARNING OS — Cẩm Nang Vận Hành Dành Cho Phụ Huynh
## (Parent Operations Handbook)

> **Bilingual Guide / Hướng dẫn song ngữ**: Tài liệu hướng dẫn phụ huynh cách quản lý, phê duyệt bài học, theo dõi năng lực học tập và sao lưu dữ liệu cho con.

---

## 1. Bắt Đầu Sử Dụng (First-Run & Login)

### Khởi động hệ thống
Mỗi khi cho bé học, phụ huynh mở terminal trên máy tính và chạy:
```bash
npm run dev
```
Mở trình duyệt web tại địa chỉ: `http://localhost:8791`

### Đăng nhập phụ huynh
- Nhập thông tin đăng nhập đã cấu hình cục bộ (mặc định môi trường dev: Tên hiển thị `Phụ huynh`, mật khẩu: `MatKhauBiMat2026`).
- Phiên đăng nhập có thời hạn **8 tiếng**, tự động bảo vệ khi tắt trình duyệt.

### 1.1 Kiểm tra sẵn sàng trước buổi học (`npm run household:preflight`)
Trước khi cho bé bắt đầu phiên học, phụ huynh có thể kiểm tra nhanh (chỉ-đọc 100%, không làm thay đổi một byte nào trong cơ sở dữ liệu) xem máy gia đình đã sẵn sàng hay chưa:
```bash
npm run household:preflight
```
Lệnh sẽ trả về báo cáo JSON xác nhận:
- Tệp cấu hình `.dev.vars` đã có đầy đủ khóa bảo mật phiên và mật khẩu phụ huynh.
- Cơ sở dữ liệu D1 cục bộ nguyên vẹn (`integrityCheck: "ok"`), đúng phiên bản lược đồ mới nhất (`schemaVersion` ≥ 15) và đủ 50 bài học trong danh mục.
- Hồ sơ hộ gia đình sạch tuyệt đối (chỉ có 1 phụ huynh, 1 học sinh `"Tài"`, 0 trung tâm/lớp học mô phỏng).
- Trạng thái `readyForLearnerSession: true` (đã có bài học được phụ huynh duyệt cho bé).

### 1.2 Nếu lệnh kiểm tra báo "schemaVersion" quá cũ (If preflight refuses on schemaVersion)
Nếu màn hình báo đúng một dòng như sau:
```
preflight refused: Household DB preflight failed: expected schemaVersion >= 15, found 14. Run `npm run db:migrate` to bring this database up to date.
```
thì đó **không phải lỗi** — chỉ là cơ sở dữ liệu của máy chưa được cập nhật lên phiên bản lược đồ mới nhất. Phụ huynh chỉ cần chạy đúng lệnh mà thông báo đã ghi:
```bash
npm run db:migrate
npm run household:preflight   # chạy lại để xác nhận đã sẵn sàng
```
**English:** If `npm run household:preflight` stops with `expected schemaVersion >= 15, found 14`, the household database is simply older than the code shipped in this repository. Nothing is broken and no data is lost — run `npm run db:migrate` once, then run `npm run household:preflight` again.

---

## 2. Quản Trị Bài Học & Phê Duyệt Nội Dung (Lesson Approval)

Mặc định, khi bài học mới được đưa vào hệ thống, bài học ở trạng thái **Bản nháp (Draft)** hoặc **Chưa duyệt**. Bé Tài sẽ **không nhìn thấy** bài học này trong danh sách môn học cho đến khi phụ huynh duyệt.

### Các bước phê duyệt trên giao diện web:
1. Đăng nhập vào hệ thống và nhấn vào menu **"Quản lý bài học"** (`/parent/lessons`).
2. Danh sách bài học theo 5 môn học đang mở (Toán học, Tiếng Anh, Tiếng Việt, Khoa học, Tư duy phản biện) sẽ hiển thị chi tiết tên bài và mục tiêu học tập.
3. Nhấn nút **"Chưa duyệt"** để chuyển sang **"Đã duyệt"**.
4. Khi đã duyệt, bài học sẽ lập tức xuất hiện trên giao diện học tập của bé. Phụ huynh có thể thu hồi phê duyệt bất kỳ lúc nào nếu muốn điều chỉnh lộ trình học.

### Phê duyệt nhanh hàng loạt từ Terminal (`npm run household:approve-lessons`):
Nếu phụ huynh muốn duyệt nhanh toàn bộ các bài học theo khối lớp của bé (mặc định là **Lớp 4** với 25 bài học thuộc 5 môn học) mà không cần bấm từng bài trên giao diện web:
```bash
# Duyệt toàn bộ bài học thuộc khối lớp của bé Tài (mặc định Lớp 4)
npm run household:approve-lessons

# Hoặc duyệt theo bộ lọc cụ thể (theo khối lớp, môn học, mã bài học, hoặc toàn bộ 50 bài Lớp 4–5)
npm run household:approve-lessons -- --grade 4 --subject math
npm run household:approve-lessons -- --lesson math-g4-fractions-equivalent
npm run household:approve-lessons -- --all
```
Lệnh này chạy nguyên tử (atomic) và an toàn khi chạy lại nhiều lần (idempotent): những bài đã duyệt ở phiên bản hiện tại sẽ được giữ nguyên, và mỗi bài mới duyệt đều được ghi nhận đầy đủ vào bảng `review_approvals` cùng nhật ký kiểm toán `audit_events` (`lesson.approval.approved` gắn với tài khoản phụ huynh).

**Phạm vi của bản duyệt:** Phê duyệt gắn với **từng bé** và **từng phiên bản nội dung** của bài học:

- Duyệt bài cho bé thứ nhất **không** tự động duyệt cho bé thứ hai.
- Các bài học được giao từ lớp học trung tâm cũng được hiển thị và cách ly theo đúng từng bé được ghi danh.
- Nếu bài học được chỉnh sửa nội dung (tạo phiên bản mới), bé sẽ không thấy bản mới cho đến khi phụ huynh duyệt lại.

**Khi thu hồi quyền đang có phiên đang học:** Phụ huynh thu hồi quyền thì phiên học mới bị chặn ngay lập tức. Nếu bé đang học dở một phiên hợp lệ đã bắt đầu trước khi thu hồi, phiên đó chỉ được tiếp tục tối đa **30 phút** kể từ lần thu hồi đầu tiên, sau đó mọi thao tác đều bị từ chối. Việc thu hồi rồi cấp lại không kéo dài thêm khoảng 30 phút này.

---

## 3. Theo Dõi Tiến Độ & Bằng Chứng Năng Lực (Mastery Dashboard)

Tại trang **"Bảng theo dõi"** (`/parent`):
- **Tổng quan ghi nhận**: Xem tổng số phiên học đã hoàn thành, số lần trả lời độc lập và tỷ lệ tự làm đúng mà không cần trợ giúp.
- **Chi tiết từng kỹ năng**:
  - `CHƯA QUAN SÁT (NOT_OBSERVED)`: Bé chưa làm bài tập về kỹ năng này.
  - `CẦN HỖ TRỢ (SUPPORTED)`: Bé trả lời đúng nhưng cần gợi ý mức 3-4 (đã xem hướng dẫn giải).
  - `ĐỘC LẬP (INDEPENDENT)`: Bé tự suy nghĩ và trả lời đúng không cần trợ giúp.
  - `GHI NHỚ TỐT (RETAINED)`: Bé hoàn thành xuất sắc các bài ôn tập cách quãng sau 3, 7, 14 ngày.
  - `VẬN DỤNG (TRANSFERRED)`: Bé giải quyết tốt các bài toán thực tế phức tạp.
- **Cảnh báo cần phụ huynh can thiệp (`needsParentAttention`)**: Nếu bé làm sai liên tiếp từ 3 lần trở lên ở một kỹ năng, hệ thống sẽ gắn cờ cảnh báo để phụ huynh ngồi cùng giải thích lại khái niệm cốt lõi cho con.
- **Đề xuất bài học tiếp theo & Liên thông năm học**: Bảng theo dõi hiển thị gợi ý bài học tiếp theo dựa trên tiến độ kỹ năng tiên quyết của bé và hỗ trợ chuyển tiếp năm học mới (giữ nguyên toàn bộ lịch sử năng lực của các năm trước).
- **Mục tiêu phụ huynh đặt ra (`learning_goals`)**: Phụ huynh có thể tạo mục tiêu học tập mới (chọn môn học, ngày dự kiến hoàn thành, ghi chú đồng hành) và cập nhật trạng thái (*Đang theo đuổi*, *Tạm dừng*, *Đã đạt*, *Đã khép lại*) ngay trên Bảng theo dõi. Mục tiêu của gia đình được tách biệt hoàn toàn với bằng chứng năng lực thực tế của bé.

---

## 4. Quản Trị Dữ Liệu: Sao Lưu, Khôi Phục & Xóa (Data Management)

Tại trang **"Quản lý dữ liệu"** (`/parent/data`):

### 1. Sao lưu hồ sơ (Export & Mã hóa AES-256-GCM)
- Nhấn nút **"Tải tệp sao lưu"** trên giao diện (`/parent/data`), hoặc nhập mật khẩu bảo vệ (tối thiểu 8 ký tự) vào ô **"Mật khẩu mã hóa bản sao lưu"** rồi nhấn **"Tải tệp sao lưu mã hóa AES-256-GCM"** (`PBKDF2-SHA256` 600.000 vòng + `AES-256-GCM`).
- Từ terminal, phụ huynh có thể xuất bản sao lưu JSON tiêu chuẩn hoặc bản mã hóa:
  ```bash
  npm run export:learner -- ./backup-tai-$(date +%Y%m%d).json
  npm run export:learner -- ./backup-tai-$(date +%Y%m%d).enc.json --passphrase "mat-khau-sao-luu"
  ```
- **Khác biệt cần biết về nhật ký kiểm toán:** bản sao lưu tải từ giao diện (`/parent/data`) được ghi lại một dòng `data.exported` trong nhật ký kiểm toán. Bản sao lưu chạy từ terminal (`npm run export:learner`) **không** ghi dòng này, vì lệnh terminal được thiết kế chỉ đọc tuyệt đối — nó không thay đổi một byte nào trong cơ sở dữ liệu. Việc sao lưu từ terminal vẫn tạo ra đúng một tệp như lúc tải từ giao diện; chỉ có dấu vết trong nhật ký là khác. Nếu phụ huynh cần dấu vết trong nhật ký, hãy xuất bản sao lưu từ trang "Quản lý dữ liệu".
- Để kiểm tra định kỳ quy trình sao lưu, giải mã, chống giả mạo và khôi phục dữ liệu trong cơ sở dữ liệu cô lập:
  ```bash
  npm run backup:drill
  ```
- Toàn bộ lịch sử bài học, câu trả lời, tiến độ ôn tập và nhật ký kiểm toán sẽ được lưu trữ an toàn trong 1 tập tin JSON tiêu chuẩn (`tai-learning-os-export@v1`) hoặc phong bì mã hóa xác thực (`tai-encrypted-backup-v1`).

### 2. Khôi phục hồ sơ (Import)
- Dùng khi chuyển dữ liệu sang máy tính mới: Chọn tập tin sao lưu JSON (hoặc tệp đã mã hóa kèm mật khẩu giải mã) và nhấn **"Khôi phục từ tệp này"**.
- Hệ thống sẽ xác thực toàn bộ tính toàn vẹn của dữ liệu trước khi nạp vào máy.

### 3. Xóa vĩnh viễn hồ sơ (Hard Delete)
- Nếu muốn xóa sạch toàn bộ lịch sử học tập của bé để bắt đầu lại:
  - Nhập chính xác chuỗi xác nhận: `XOA Tài`
  - Nhấn **"Xác nhận xóa vĩnh viễn"**.
  - Toàn bộ dữ liệu phiên học, câu trả lời và năng lực sẽ được dọn dẹp sạch sẽ khỏi máy.

### 4. Lưu trữ & Cấp phát lại Cơ sở dữ liệu Hộ gia đình Sạch (`npm run db:reprovision-household`)
- Do bảng nhật ký kiểm toán `audit_events` được bảo vệ chỉ-ghi-thêm (append-only) bởi trigger SQLite, lệnh xóa dữ liệu thông thường (`npm run db:reset-data`) sẽ chủ động từ chối chạy khi đã có dòng nhật ký trong cơ sở dữ liệu.
- Nếu cơ sở dữ liệu cục bộ vô tình bị lẫn dữ liệu thử nghiệm hoặc phụ huynh muốn làm mới hoàn toàn môi trường học tập mà vẫn giữ lại hồ sơ định danh của gia đình:
  ```bash
  # Lưu trữ nguyên vẹn tệp SQLite hiện tại vào thư mục backups/ và cấp phát lại DB sạch (giữ lại Phụ huynh, bé Tài, Năm học và 50 bài học)
  npm run db:reprovision-household

  # Hoặc cấp phát lại DB sạch kèm duyệt sẵn toàn bộ bài học theo khối lớp của bé Tài
  npm run db:reprovision-household -- --approve-grade-lessons
  ```
- **Cam kết bảo toàn bằng chứng:** Bước 1 của lệnh này mở tệp SQLite cũ ở chế độ **chỉ-đọc tuyệt đối (`readOnly: true`)** để trích xuất thông tin định danh trước khi di chuyển toàn bộ tệp sang `backups/household-db-archive-<timestamp>/`, đảm bảo mã băm SHA-256 của bản lưu trữ không thay đổi một byte nào.

---

## 5. Quản Trị Trung Tâm, Lớp Học & Biên Soạn Bài Học (`/parent/organization`)

Tại trang **"Trung tâm & Lớp học"** (`/parent/organization`), phụ huynh hoặc quản trị viên/giáo viên trung tâm có thể:
1. **Tạo và chuyển đổi Trung tâm (`Organization`)**: Tạo tổ chức giáo dục mới và xem vai trò hiện tại (*Chủ sở hữu*, *Quản trị viên*, *Giáo viên*).
2. **Quản lý nhân sự & Quyền đồng thuận (`Consent`)**: Thêm giáo viên/quản trị viên vào trung tâm, cấp hoặc thu hồi quyền đồng thuận chia sẻ dữ liệu học tập của từng bé bất kỳ lúc nào.
3. **Quản lý Lớp học & Ghi danh**: Tạo lớp học, phân công giáo viên phụ trách và ghi danh học sinh đã có đồng thuận hợp lệ của phụ huynh.
4. **Biên soạn, Duyệt & Giao bài học 5 bước**: Soạn bài học 5 bước (`Khái niệm` → `Ví dụ mẫu` → `Có hướng dẫn` → `Tự làm` → `Vận dụng`), gửi duyệt nội bộ trung tâm (`draft` → `submitted` → `org_approved`) và giao bài cho lớp học. Bài học được giao cho lớp vẫn bắt buộc phải được **phụ huynh của bé phê duyệt lần cuối** tại `/parent/lessons` trước khi hiển thị cho bé.
