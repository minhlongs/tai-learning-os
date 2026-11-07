# Lờikế: Đừng xây thêm tính năng — hãy cho Tài học một buổi thật

> Advisory only. Không có thay đổi code hay tài liệu nào được thực hiện trong lần tư vấn này.
> Ngày: 2026-11-06 · Dự án: TAI Learning OS · Nhánh: `main` (sạch)

## Những gì cần từ bạn (chưa giải quyết được trong phiên này)

1. **Chữ bạn trên file `CLAUDE.md`.** Bản thảo điều khoản pilot mới nằm ở mục "Bản thảo đề xuất" bên dưới. Đây là file mọi phiên làm việc đều nạp và nó đang đặt ra ranh giới an toàn cho trẻ em, nên cần bạn đọc và duyệt trước khi ghi.
2. **Ký duyệt pháp lý (chỉ cần khi nào lên máy chủ).** `docs/CHILD_PRIVACY_REVIEW.md` §4 yêu cầu nộp hồ sơ DPIA và đánh giá chuyển dữ liệu xuyên biên giới. Việc này **không chặn** chạy localhost, nhưng sẽ chặn phiên bản host.

## 1. Verdict

Vấn đề của dự án này **không phải thiếu tính năng**. Nó là một hệ thống được xây rất kỹ nhưng chưa từng chạy một lần thật. Phản ứng tự nhiên lúc này — thêm biểu đồ, thêm màn hình, làm sâu chương trình — sẽ xây tiếp trên nền không có dữ liệu.

Tôi tán thành quyết định của bạn: làm rõ chính sách và bật chế độ chạy thật. Đó đúng là việc cần làm tiếp theo.

Điểm tôi phản đối trong cách đặt vấn đề ban đầu: cụm "làm sâu giá trị sản phẩm" và "cả 4 hướng". Bốn hướng đó đều là việc của *sau*. Nếu làm trước, bạn sẽ quyết định xây cái gì dựa trên phỏng đoán thay vì dựa trên bé đang yếu thật ở đâu.

## 2. Bạn nên làm gì (theo thứ tự)

**Bước 1 — Sửa chính sách trước.** Tách điều khoản tại `CLAUDE.md` dòng 5 và `docs/ROADMAP_90_DAYS.md` dòng 5 thành hai mục: chặn tuyệt đối đối với bản host công khai (nhiều bé, máy chủ, xử lý dữ liệu); cho phép rõ ràng đối với localhost trên máy gia đình cho một bé do chính bạn giám sát. Giữ nguyên các rào chinh khác (`wrangler deploy`, remote migrations, tài nguyên đám mây).

**Bước 2 — Đồng bộ DB cục bộ về đúng trạng thái của code.** Chạy `npm run db:migrate` để áp dụng 5 migration còn thiếu, rồi `npm run seed:demo` để seed 50 bài. Hiện DB đang ở schema version 9 với 12 bài, trong khi đĩa có 51 file bài và code M12 yêu cầu 50 bài.

**Bước 3 — Dọn dữ liệu rác ra khỏi tài khoản của Tài.** Có 3 phiên học chỉ dài 30ms, 27ms, 660ms và 1 dòng `skill_evidence` ghi tay. Chạy `npm run db:reset-data` (script này khai báo rõ nó không xóa bảng, không đụng tới migration, và giữ nguyên catalogue) để Tài bắt đầu từ bảng trắng.

**Bước 4 — Chạy một buổi học thật đầu đến cuối, trên localhost.** `npm run dev`, mở `http://localhost:8791`, đăng nhập bằng tài khoản cha mẹ, duyệt vài bài, rồi cho Tài làm trọn một bài 5 bước. Ghi nhận chỗ bé vấp: chữ quá nhỏ, gợi ý không đủ, bước bỏ cuộc.

**Bước 5 — Chỉ sau bước 4, mới quyết định làm sâu cái gì.** Ba hướng trong bốn hướng bạn chọn (biểu đồ bố mẹ, phản hồi sau bài, ôn tập thông minh) sẽ tự hiện ra từ dữ liệu đó.

Bạn có thể dừng sau bước 4 bất cứ lúc nào. Một buổi học thật tự nó đã trả lời được câu hỏi mà 50 bài học không trả lời được.

## 3. Bạn không nên làm gì

- **Đừng viết biểu đồ xu hướng ngay.** Không có điểm dữ liệu nào để vẽ. Một biểu đồ đẹp trên bảng rỗng sẽ khiến bạn tưởng hệ thống đang hoạt động tốt.
- **Đừng thêm thư viện vẽ biểu đồ (recharts, d3, visx…) trong lần làm việc này.** `package.json` hiện không có thư viện nào như vậy, và không cần cho tới khi có dữ liệu.
- **Đừng xây lớp trừu tượn "đa học sinh" hoặc "đa gia đình" để chuẩn bị cho tương lai.** Chỉ có một bé dùng trên một máy. Khi bé thứ hai thật sự xuất hiện, lúc đó hãy rút ra phần dùng chung.
- **Đừng đụng `src/worker/db/repositories.ts` (3.622 dòng) và `src/worker/routes/parent.ts` (2.513 dòng).** Chúng lớn nhất mã nguồn nhưng hiện hoạt động đúng. Chia nhỏ bọn chúng rủi ro cao và hoàn toàn không chặn việc cho Tài học.
- **Đừng viết bài học mới và đừng deploy.** Cả hai đều năm ngoài thứ bạn đang cần lúc này.
- **Đừng để tôi ghi đè `CLAUDE.md` mà bạn không đọc.** File này là ranh giới an toàn của cả dự án.

## 4. Có thể làm tốt hơn / rẻ hơn như thế nào

Xếp theo công bỏ ra trên giá trị thu được:

1. **Bắt đầu với sửa chính sách** — chỉ 2 file, không đụng code, và nó mở khóa mọi việc khác. Rủi ro thấp nhất.
2. **Thứ hai là đồng bộ DB** — 2 lệnh, sửa một lỗi thật (DB lệch 5 migration so với code).
3. **Thứ ba là một buổi học thật** — tốn thời gian của bạn chứ không phải của tôi, cho ra bằng chứng.
4. **Đắt nhất, để cuối cùng** — mọi tính năng "làm sâu". Xứng đng làm, nhưng chỉ khi đã có dữ liệu biết làm cái nào.

## 5. Quan điểm của tôi và đường đi cụ thể

| Bước | Việc | Kết quả kiểm chứng được |
|---|---|---|
| 1 | Bạn duyệt bản thảo điều khoản pilot | `CLAUDE.md` và ROADMAP phân biệt rõ hosted vs localhost |
| 2 | `npm run db:migrate` | `d1_migrations` = 14 |
| 3 | `npm run seed:demo` | `lessons` = 50 (thay vì 12) |
| 4 | `npm run db:reset-data` | `learning_attempts` = 0, `learning_sessions` = 0, `skill_evidence` = 0 |
| 5 | `npm run dev` → đăng nhập → duyệt bài → Tài làm 1 bài | `learning_attempts` ≥ 1, `review_schedule` ≥ 1 |
| 6 | Chọn một milestone làm sâu duy nhất | Milestone có tên, chọn từ bằng chứng |

Bước 5 là bước tôi không thể làm thay bạn — tôi không ngồi cạnh bé được. Tôi làm được bước 2, 3, 4, và bước 1 (đề xuất chữ viết).

## 6. Lợi ích

- **Bạn ngừng phỏng đoán và bắt đầu biết.** Mọi quyết định tính năng sau này dựa trên bé thật sự vấp ở đâu.
- **DB hết lệch với code** — hết rủi ro chạy trên dữ liệu cũ và rút kết luận sai.
- **Chính sách hết mơ hồ** — không còn phải tự phân vân lần tới khi định cho bé dùng.
- **Không tốn công vô ích** — không xây biểu đồ trên bảng rỗng, không chia nhỏ file đang chạy tốt.

## 7. Đánh đổi

- **Bạn phải bỏ thời gian ngồi cạnh bé.** Nếu bé chỉ học 5 phút rồi chán, bạn thu được ít bằng chứng hơn dự tính.
- **Cho bé dùng dù chưa có duyệt pháp lý là rủi ro bạn tự chấp nhận.** Quan điểm của tôi: localhost, một bé, máy gia đình, bạn tự giám sát, không dữ liệu ra ngoài — rủi ro thấp và khác một trời với việc host công khai. Nhưng đó là phán đoán của tôi, không phải kết luận pháp lý. Nếu không chấp nhận được điểm này, hãy dừng ở bước 1 và chờ luật sư.
- **Tôi đề nghị ghi rõ ranh giới trong `CLAUDE.md`, còn bạn chọn để tôi chỉ đề xuất chữ viết thay vì tự sửa.** Chi phí là phải qua một bước duyệt. Tôi chọn cách này vì file đó mọi phiên đều nạp và nó là ranh giới an toàn.
- **Khuyến nghị hết đúng nếu** bé từ chối học trên màn hình, hoặc bạn cần demo để trình diễn/bán trước khi có dữ liệu. Khi đó hướng đúng là xây minh họa có dữ liệu mẫu — nhưng chi phí chuyển sang nó là phải làm lại phần trình bày sau này.

## 8. Phần chưa kiểm chứng

- **Điều khoản pháp lý cho localhost.** Nơi đã xem: `docs/CHILD_PRIVACY_REVIEW.md` §4, dòng 5 của `CLAUDE.md`. Hai file này nói rõ phần duyệt pháp lý cần cho bản host, nhưng không nói gì cụ thể về localhost. Thứ sẽ xác nhận được: ý kiến luật sư hoặc cơ quan chức năng.
- **Máy chủ dev có thật sự khởi động và đăng nhập được trên máy này không.** Nơi đã xem: `vite.config.ts` (port cố định 8791), sự tồn tại của `.dev.vars` (có, được gitignore), `parents` = 1. Tôi **không** chạy thử `npm run dev` vì đó là tiến trình chạy nề. Thứ sẽ xác nhận được: chạy `npm run dev` rồi đăng nhập.
- **Bản thảo đề xuất cho `CLAUDE.md` chưa được viết vào file** — bạn chưa xem chữ viết cụ thể trong ngữ cảnh đọc lờikế.

## Bản thảo đề xuất (cần bạn duyệt trước khi ghi)

Thay cho dòng hiện tại trong `CLAUDE.md` (dòng 5) và `docs/ROADMAP_90_DAYS.md` (dòng 5), tách thành hai mục:

```markdown
> **Release Policy: PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED.**
> Git push, pull request creation, and squash/merge to `main` are authorized following comprehensive local multi-layer verification.
>
> **Blocked (unchanged):** Remote deploy (`wrangler deploy`), remote migrations, remote resource provisioning, paid/external LLM APIs, and hosted multi-learner child pilot (public server, cloud data processing, or any learner outside this household).
>
> **Permitted:** Localhost use on this household machine for a single learner, supervised in person by the parent/owner. Local-only runs collect exactly the data the schema already defines and send nothing off the device.
```

Nếu bạn duyệt bản trên, hai file được sửa cùng một nội dung này và không đổi gì khác.

## 9. Checklist, chỉ số thành công, và bản giao việc

**Checklist công việc**

```text
- [ ] Duyệt bản thảo điều khoản pilot ở trên
- [ ] Ghi bản thảo đã duyệt vào CLAUDE.md và docs/ROADMAP_90_DAYS.md
- [ ] Chạy npm run db:migrate; xác nhận d1_migrations = 14
- [ ] Chạy npm run seed:demo; xác nhận lessons = 50
- [ ] Chạy npm run db:reset-data; xác nhận attempts/sessions/evidence = 0
- [ ] Chạy npm run dev, đăng nhập, duyệt vài bài Lớp 4
- [ ] Cho Tài làm trọn một bài 5 bước trên localhost
- [ ] Ghi lại chỗ bé vấp (chữ, gợi ý, bước bỏ cuộc)
- [ ] Dựa trên ghi chú đó, chọn một milestone làm sâu duy nhất
```

**Chỉ số thành công** (kiểm chứng được bằng lệnh hoặc con số)

- `SELECT COUNT(*) FROM d1_migrations` = **14**
- `SELECT COUNT(*) FROM lessons` = **50**
- Sau reset: `learning_attempts` = 0, `learning_sessions` = 0, `skill_evidence` = 0
- Sau buổi học thật: `learning_attempts` **≥ 1**, và ít nhất một `review_schedule` được tạo
- `CLAUDE.md` và `docs/ROADMAP_90_DAYS.md` đều chứa phân biệt rõ hosted-pilot (bị chặn) và localhost (được phép)
- Không có lời gọi mạng ra ngoài trong buổi học thật

**Bản giao việc**

```text
Objective: Cho Tài hoàn thành một buổi học thật trên localhost để thu thập
dữ liệu học thật đầu tiên, sau khi làm rõ ranh giới chính sách hosted-vs-localhost.

Done means:
- CLAUDE.md và docs/ROADMAP_90_DAYS.md đều phân biệt rõ hai mức: pilot hosted
  bị chặn tuyệt đối; localhost trên máy gia đình cho một bé được phép.
- DB cục bộ ở đúng trạng thái của code: 14 migration đã áp dụng, 50 bài học
  đã seed.
- Tài khoản của Tài không còn dữ liệu test rác (0 phiên học, 0 lượt làm bài,
  0 dòng skill_evidence) trước buổi học thật.
- Có ít nhất một learning_attempt thật và một review_schedule được sinh ra sau
  buổi học; ghi chú được lưu về chỗ bé vấp.

Out of scope: Deploy, migration từ xa, viết bài học mới, biểu đồ/phân tích,
chia nhỏ repositories.ts và parent.ts, mọi thư viện vẽ biểu đồ, mọi lớp trừu
tượng đa-gia đình.

Constraints: Không commit secret hay file .dev.vars. Không ghi đè CLAUDE.md mà
không bản sửa được người dùng đọc và duyệt. Giữ KISS/DRY, không thêm gì ngoài
yêu cầu. Mọi thay đổi code/test phải qua npm run verify trước khi commit.

Stop and ask only if:
- một hành động không đảo ngược được (xoá dữ liệu ngoài phạm vi reset đã duyệt,
  force push, sửa lịch sử đã công bố)
- một thay đổi vượt phạm vi đã xác nhận hoặc ra ngoài repository này
- một lỗi không giải thích được trong quá trình học thật
- bất kỳ điều gì thuộc về 3 mục Production Gate (chữ ký Founder, duyệt pháp lý,
  secret production)
```

## Unresolved questions

1. Bạn có duyệt bản thảo điều khoản pilot ở trên không, hay muốn đổi từ ngữ?
2. Bước 4 (`npm run db:reset-data`) xóa dữ liệu — bạn muốn tôi chạy, hay tự chạy để bạn chứng kiến?
