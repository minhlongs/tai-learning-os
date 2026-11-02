# TAI LEARNING OS — Hệ Điều Hành Học Tập Tài

> **Hệ điều hành học tập local-first, bảo vệ quyền riêng tư tuyệt đối cho trẻ em, do phụ huynh quản trị.**  
> *A local-first, parent-governed, evidence-based learning operating system for child education.*

---

## Tổng Quan (Overview)

**TAI LEARNING OS** là nền tảng học tập được thiết kế riêng cho học sinh tiểu học (lớp 4), ưu tiên giao diện và nội dung hoàn toàn bằng tiếng Việt (**Vietnamese-first**). Hệ thống được phát triển với triết lý:

1. **Local-First & Data Sovereignty**: Chạy hoàn toàn cục bộ trên máy tính của gia đình (`workerd` + SQLite D1). Không gửi dữ liệu lên máy chủ đám mây, không gắn mã theo dõi bên thứ ba, không phụ thuộc vào kết nối Internet khi học tập.
2. **Tuyệt Đối Không Lưu Trữ Thông Tin Nhạy Cảm**: Không lưu họ tên đầy đủ, ngày sinh cụ thể, trường học, số điện thoại, địa chỉ hay ảnh đại diện. Chỉ sử dụng biệt danh ("Tài") và năm sinh để xác định lứa tuổi.
3. **Phụ Huynh Giám Sát Chủ Động**: Mọi bài học phải được phụ huynh phê duyệt (`review_approvals`) mới hiển thị cho người học. Phụ huynh có toàn quyền xem nhật ký bằng chứng học tập, xuất dữ liệu (`export`), khôi phục (`import`) hoặc xóa sạch vĩnh viễn (`delete cascade`).
4. **Bảo Mật & Minh Bạch Tuyệt Đối**: Toàn bộ logic chấm điểm và đáp án (`answer_key`) được lưu và xử lý tại backend Worker. Trình duyệt không bao giờ nắm giữ đáp án trước khi học sinh trả lời đúng.

---

## Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**: React 19, TypeScript strict mode, CSS thuần theo Design Tokens trực quan và thân thiện.
- **Backend / Edge Runtime**: Cloudflare Workers (`workerd`), REST API được kiểm soát qua `x-tlo-csrf` và Session Cookie (`HttpOnly`, `SameSite=Strict`).
- **Database**: Cloudflare D1 (SQLite) với 22 bảng quan hệ, ràng buộc khóa ngoại `PRAGMA foreign_keys = ON`, bảng bóp nghẹt đăng nhập thất bại `auth_throttles`, bản chụp phiên bản bất biến `lesson_versions`, siêu dữ liệu chương trình GDPT 2018 và kế hoạch học tập 4 tuần.
- **Testing & Verification**:
  - `Vitest` (Unit test cho engine sư phạm, planner, crypto, schema).
  - `@cloudflare/vitest-pool-workers` (Integration test chạy trực tiếp trên workerd và D1 cục bộ).
  - `Playwright` (End-to-End E2E test mô phỏng toàn bộ hành trình người học trên cả Desktop, Tablet và Mobile).

---

## Hướng Dẫn Cài Đặt & Sử Dụng (Quick Start)

### 1. Yêu Cầu Môi Trường
- Node.js `>= 22.12.0`
- Trình quản lý gói `npm`

### 2. Cài Đặt Phụ Thuộc
```bash
npm install
```

### 3. Khởi Tạo Cơ Sở Dữ Liệu & Nạp Dữ Liệu Bài Học
```bash
# Áp dụng migrations vào D1 cục bộ
npm run db:migrate

# Nạp danh mục 5 môn học và 25 bài học mẫu (Toán, Tiếng Anh, Tiếng Việt, Khoa học, Tư duy phản biện — mỗi môn 5 bài)
npm run seed:demo
```

### 4. Khởi Động Máy Chủ Phát Triển (Local Dev)
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:8791` (hoặc cổng được Vite thông báo).

### 5. Tài Khoản Phụ Huynh Mặc Định (Môi Trường Thử Nghiệm Cục Bộ)
- **Tên đăng nhập**: `Phụ huynh`
- **Mật khẩu**: `MatKhauBiMat2026`

---

## Các Lệnh Kiểm Thử & Kiểm Soát (Verification Commands)

Hệ thống tuân thủ quy trình kiểm soát chất lượng nghiêm ngặt trước mỗi thay đổi:

```bash
# Kiểm tra TypeScript typecheck (toàn bộ app và worker)
npm run typecheck

# Kiểm tra quy chuẩn mã nguồn (linter)
npm run lint

# Chạy toàn bộ Unit Tests (191 tests across 11 files)
npm run test

# Chạy toàn bộ Integration Tests với workerd D1 (137 tests across 13 files)
npm run test:integration

# Chạy Playwright End-to-End Tests (51 tests, Desktop + Tablet + Mobile)
npm run test:e2e

# Xác thực toàn diện tất cả các cổng (typecheck, lint, test, validate:lessons, build)
npm run verify

# Diễn tập sao lưu & khôi phục mã hóa AES-256-GCM tự động trong môi trường cô lập
npm run backup:drill

# Xuất hồ sơ học tập ra tập tin JSON dự phòng (hoặc mã hóa AES-256-GCM với --passphrase)
npm run export:learner -- ./backup-tai.json
npm run export:learner -- ./backup-tai.enc.json --passphrase "mat-khau-sao-luu"

# Mở khóa tạm thời tài khoản phụ huynh khi nhập sai mật khẩu quá 5 lần
npm run unlock:parent
```

---

## Cấu Trúc Thư Mục (Project Structure)

```text
tai-learning-os/
├── docs/                      # Tài liệu kiến trúc, bảo mật, vận hành và quyền riêng tư
│   ├── ARCHITECTURE.md        # Kiến trúc hệ thống và phân tách trách nhiệm
│   ├── DATA_MODEL.md          # Đặc tả 22 bảng cơ sở dữ liệu và mô hình bằng chứng
│   ├── LEARNING_ENGINE.md     # Động cơ đánh giá năng lực và thuật ngữ sư phạm
│   ├── SECURITY.md            # Mô hình đe dọa, chính sách mật khẩu và CSRF
│   ├── CHILD_PRIVACY_REVIEW.md# Đánh giá quyền riêng tư dữ liệu trẻ em
│   ├── PARENT_OPERATIONS.md   # Cẩm nang vận hành dành cho phụ huynh
│   ├── ROADMAP_90_DAYS.md     # Kế hoạch phát triển và điều kiện triển khai
│   └── audits/                # Báo cáo kiểm định chất lượng Cổng 01, 02 & 03 (Forensic Audit)
├── migrations/                # D1 SQL Migrations (0001..0011)
├── scripts/                   # Các script công cụ cục bộ (seed, reset, export, hash)
├── src/
│   ├── client/                # React 19 SPA (Screens, Components, Styles)
│   ├── shared/                # Hợp đồng API chung, schema bài học, crypto, engine
│   └── worker/                # Cloudflare Worker REST API, route handlers, DB repositories
└── test/                      # Test suites (unit, integration, e2e)
```

---

## Chính Sách Triển Khai (Release Policy)

> **PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED**:  
> Git push, tạo Pull Request và hợp nhất vào nhánh `main` được phép thực hiện sau khi vượt qua đầy đủ các cổng kiểm chứng cục bộ (`typecheck`, `lint`, `test`, `test:integration`, `test:e2e`).  
> Mọi hoạt động triển khai lên hạ tầng Cloudflare công cộng (`wrangler deploy`), chạy migration từ xa hoặc xuất bản dữ liệu trẻ em thật đều bị chặn cho đến khi hoàn tất phê duyệt pháp lý và kỹ thuật bảo mật.
