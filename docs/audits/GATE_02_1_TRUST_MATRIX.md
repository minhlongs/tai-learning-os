# MA TRẬN ĐẢM BẢO LÒNG TIN VÀ ĐẶC QUYỀN (GATE 02.1 TRUST MATRIX)
## GATE 02.1 TRUST & PRIVILEGE MATRIX — TAI LEARNING OS

**Ngày phê duyệt:** 25/10/2026  
**Thẩm quyền:** Supreme Command #02.1 — Security & Learning Integrity Audit  
**Trạng thái:** **VERIFIED GREEN (LOCAL ONLY) / PRODUCTION BLOCKED**

---

### 1. MA TRẬN PHÂN LOẠI NĂNG LỰC SƯ PHẠM (PEDAGOGICAL COMPETENCY MATRIX)

Quy tắc bất biến trong `src/shared/engine/competency.ts` (`COMPETENCY_CONFIG.smallHint = 0`):

| Kịch bản làm bài của học sinh | `outcome` | `attemptNo` | `helpLevel` (sau đối chiếu gợi ý máy chủ) | `evidenceKind` | Đánh giá `isIndependentAttempt` | Trạng thái năng lực (`deriveCompetency` khi đủ $\ge 2$ lần) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tự giải đúng ngay lần đầu, không gợi ý** | `correct` | `1` | `0` | `observed` | **TRUE** | **`INDEPENDENT`** (hoặc `RETAINED` / `TRANSFERRED`) |
| **Giải đúng lần đầu nhưng xem gợi ý mức 1** | `correct` | `1` | `1` | `assisted` | **FALSE** | **`SUPPORTED`** |
| **Giải đúng lần đầu nhưng xem gợi ý mức 2** | `correct` | `1` | `2` | `assisted` | **FALSE** | **`SUPPORTED`** |
| **Giải đúng lần đầu nhưng xem gợi ý mức 3–4** | `partial` / `correct` | `1` | `3` hoặc `4` | `assisted` | **FALSE** | **`SUPPORTED`** |
| **Xem gợi ý trên máy chủ rồi giả mạo `helpLevel: 0`** | `correct` | `1` | $\max(0, \text{disclosed}) \ge 1$ | `assisted` | **FALSE** | **`SUPPORTED`** |
| **Trả lời sai lần 1, trả lời đúng lần 2 (không gợi ý)** | `correct` | `2` | `0` | `assisted` | **FALSE** | **`SUPPORTED`** |
| **Phụ huynh chỉnh sửa thủ công (`parent_correction`)** | — | — | — | `parent_correction` | **FALSE** | Ghi nhận theo nhãn `source = 'parent_correction'` |

---

### 2. MA TRẬN KIỂM SOÁT ĐẶC QUYỀN THEO CHẾ ĐỘ PHIÊN (PRIVILEGE BOUNDARY MATRIX)

Hệ thống phân tách rõ ràng giữa **Chế độ Phụ huynh (`mode: "parent"`)** và **Chế độ Học sinh (`mode: "learner"`)** ngay trong chữ ký HMAC-SHA256 của cookie phiên `tlo_session`:

| Tuyến API (Route) | Phương thức | Loại Route | Chế độ Phụ huynh (`mode: "parent"`) | Chế độ Học sinh (`mode: "learner"`) | Bảo vệ CSRF & Origin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/session` | `GET` | `public` | `200 OK` | `200 OK` | Không áp dụng (GET) |
| `/api/session/login` | `POST` | `public` | `200 OK` | `200 OK` | Rate Limit theo IP (`auth:<hash32(ip)>`) |
| `/api/session/mode` (sang `learner`) | `POST` | `protected` | `200 OK` (Chuyển sang chế độ bé) | `200 OK` | Bắt buộc `x-tlo-csrf` + `Origin` |
| `/api/session/mode` (sang `parent`) | `POST` | `protected` | `200 OK` (Yêu cầu mật khẩu) | **`200 OK` chỉ khi đúng mật khẩu; `403` nếu sai** | Bắt buộc `x-tlo-csrf` + `Origin` + Rate Limit |
| `/api/learner/*` (home, subjects, sessions, attempts, hints) | `GET` / `POST` | `protected` | `200 OK` | `200 OK` | Bắt buộc `x-tlo-csrf` + `Origin` cho POST |
| `/api/parent/dashboard` | `GET` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Kiểm tra đặc quyền `mode !== "learner"` |
| `/api/parent/lessons` & `/api/parent/lessons/:id` | `GET` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Kiểm tra đặc quyền `mode !== "learner"` |
| `/api/parent/lessons/approval` | `POST` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/parent/lessons/content` | `POST` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/parent/skills/correct` | `POST` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/parent/learners` & `/api/parent/learners/profile` | `POST` / `PATCH` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/data/export` | `POST` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/data/import` | `POST` | **`parentRoute`** | `200 OK` | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |
| `/api/data/learner` (Xóa dữ liệu) | `DELETE` | **`parentRoute`** | `200 OK` (Kèm chuỗi `XOA <Tên>`) | **`403 Forbidden`** | Đặc quyền `parent` + CSRF + Origin |

---

### 3. ĐẢM BẢO MẬT MÃ VÀ CHỐNG TẤN CÔNG DÒ MẬT KHẨU (CRYPTO & RATE LIMIT GUARANTEES)

1. **PBKDF2-SHA256 100,000 vòng:**
   - Mọi mật khẩu tạo mới hoặc cập nhật đều sử dụng 100,000 vòng lặp PBKDF2-SHA256 với muối ngẫu nhiên 16 bytes.
   - Khi đăng nhập với bản ghi cũ (ví dụ 60,000 vòng), hàm `needsRehash` phát hiện và tự động nâng cấp lên `pbkdf2-sha256:100000$<salt>$<hash>` một cách trong suốt.
2. **Khóa giới hạn tần suất cố định theo địa chỉ IP (`authClientKey`):**
   - Không phụ thuộc vào `User-Agent` hay `Accept-Language`.
   - Ngăn chặn triệt để việc kẻ tấn công xoay vòng header để vượt qua giới hạn 5 lần thử sai / 60 giây trên `/api/session/login`, `/api/session/bootstrap`, và `/api/session/mode`.
