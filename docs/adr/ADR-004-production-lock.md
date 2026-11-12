# ADR-004 — Khoá production: không có đường triển khai nào đang mở

**Trạng thái:** Đã chấp nhận (2026-11-08)
**Người đề xuất:** Kỹ thuật viên chính
**Phạm vi:** `wrangler.jsonc`, `src/worker/config-guard.ts`, `src/worker/http/middleware.ts`, `src/worker/index.ts`, `test/unit/config-guard.test.ts`, `test/unit/deployment-lock.test.ts`, `docs/ROADMAP_90_DAYS.md`

---

## Bối cảnh

Hệ thống này chứa dữ liệu học tập của một đứa trẻ dưới 13 tuổi. Mọi tuyên bố về quyền riêng tư của nó — "riêng tư bằng cách không thu thập", "không có khoá đáp án trong trình duyệt", "bằng chứng append-only" — chỉ đúng chừng nào dữ liệu còn nằm trên máy này và không có ai khác chạm tới.

Vì vậy câu hỏi đặt ra không phải "làm sao triển khai an toàn", mà là **"có bao nhiêu cửa dẫn tới việc triển khai, và cửa nào đang mở"**. Một hệ thống nói mình local-first nhưng chỉ cần một lệnh là lên mây không phải là hệ thống local-first; nó là một hệ thống trên mây chưa được triển khai.

## Quyết định

**Khoá production bằng bốn lớp độc lập, mỗi lớp đủ để chặn một mình. Ba trong bốn lớp có test tự động canh giữ.**

### Lớp 1 — Cấu hình tuyên bố rõ nó không triển khai được

`wrangler.jsonc:3`:

```
// LOCAL ONLY: this config must never be deployed without founder authorization.
```

`wrangler.jsonc:20-21`:

```jsonc
"database_id": "local-only",
"preview_database_id": "local-preview"
```

`database_id: "local-only"` **không phải** một ID thật của Cloudflare. Đây là chủ ý: nó không thể vô tình trở thành một cơ sở dữ liệu từ xa, vì không có cơ sở dữ liệu nào mang ID đó tồn tại trên tài khoản Cloudflare nào. Một `wrangler deploy` với cấu hình này sẽ thất bại vì không tìm thấy D1 tương ứng.

Lớp này từng chỉ hoạt động **một cách tình cờ**: không có gì báo động nếu ai đó thay `database_id` bằng một UUID thật, vì một thay đổi như vậy không làm hỏng bất kỳ test nào. Nay nó là một cổng có chủ đích — `test/unit/deployment-lock.test.ts` đọc chính `wrangler.jsonc` đã commit và thất bại nếu `database_id` không còn là `local-only`, nếu có khối `env.*` có thể trỏ binding sang nơi khác, hoặc nếu `vars` mang theo bí mật.

Test đó tự bóc comment JSONC (không có parser JSONC nào là dependency được khai báo) và có một khẳng định riêng chứng minh các khẳng định kia không phụ thuộc vào comment: chuỗi `LOCAL ONLY` phải còn trong tệp gốc và phải biến mất sau khi bóc.

### Lớp 2 — Worker từ chối **mọi** request khi cấu hình không dùng được

`src/worker/http/middleware.ts:128-139` — đầu tiên trong `dispatch()`, trước cả route matching:

```ts
const verdict = validateConfig(env);
if (!verdict.ok) {
  console.error(
    `refusing to serve: invalid configuration ${verdict.problems.map((problem) => problem.code).join(", ")}`,
  );
  return serverError();
}
```

Việc kiểm tra nằm trong `src/worker/config-guard.ts`, một hàm thuần trả về mã lỗi ổn định định danh được (`session_secret_missing`, `session_secret_too_short`, `session_secret_too_repetitive`, `parent_password_hash_missing`, `parent_password_hash_malformed`, `parent_password_hash_weak`) để test khẳng định đúng lỗi cụ thể thay vì suy ra từ một 500 trống. Nó trả **toàn bộ** danh sách lỗi cùng lúc, không phải lỗi đầu tiên, để một lần khởi động lại báo cáo hết thay vì mỗi lần một dòng.

Thiết kế đúng ở bốn điểm:

1. **Fail closed** — từ chối, không phải chạy ở chế độ không xác thực.
2. **Kiểm tra độ mạnh, không chỉ sự hiện diện.** `SESSION_SECRET` phải dài tối thiểu 32 byte UTF-8 (đo theo byte, vì chữ ký tính trên byte — một chuỗi 24 ký tự tiếng Việt là 48 byte) và phải có ít nhất 8 ký tự khác nhau. `PARENT_PASSWORD_HASH`, khi được cung cấp, phải đúng định dạng `pbkdf2-sha256:<iterations>$<salt>$<hash>` và có iteration ≥ 100.000. Một chuỗi như `SESSION_SECRET="a"` ký HMAC-SHA256 hoàn toàn hợp lệ về mặt mật mã và hoàn toàn vô dụng trước kẻ tấn công; kiểm tra cũ chấp nhận nó.
3. **Mờ với người dùng** — 500 trống, chỉ mã lỗi vào log, không bao giờ giá trị bí mật. Có test riêng khẳng định không thông điệp lỗi nào lặp lại giá trị được cung cấp.
4. **Đặt trước mọi thứ khác** — trước route matching, trước rate limiter, trước xác thực. Không có đường vòng.

### Lớp 3 — Không có bí mật mặc định nào trong mã nguồn

`wrangler.jsonc:56` là `"vars": {}` — trống. Không có `SESSION_SECRET`, không có `PARENT_PASSWORD_HASH`, và **cố ý không có `ENVIRONMENT`**.

`ENVIRONMENT` là chìa khoá duy nhất mở nhánh bỏ qua `parent_password_hash_missing` (nó cho phép tạo tài khoản phụ huynh lần đầu trên cơ sở dữ liệu trống). Trước đây nó nằm trong `vars` gốc, nghĩa là bất kỳ ai deploy tệp này cũng thừa hưởng nhánh bỏ qua đó mà không biết. Nay:

- `validateConfig` mặc định **production** khi `ENVIRONMENT` không được đặt — không phải mặc định development.
- `ENVIRONMENT=development` chỉ đến từ `.dev.vars` (bị `.gitignore` chặn, không được git theo dõi) hoặc từ một biến môi trường do người vận hành tự đặt. Một deploy quên đặt nó nhận luật nghiêm, không phải nhánh bỏ qua.
- `test/unit/deployment-lock.test.ts` thất bại nếu chuỗi `ENVIRONMENT` xuất hiện lại trong `wrangler.jsonc` sau khi bóc comment.

`.dev.vars.example` (được commit, không chứa giá trị thật) giải thích cả ba biến. Nghĩa là: một bản checkout sạch **không thể chạy** cho tới khi người vận hành tự tạo `.dev.vars` và tự sinh một khoá ký đủ mạnh. Không có trạng thái "chạy được với bí mật mặc định" để ai đó vô tình triển khai.

### Lớp 4 — Ba điều kiện tiên quyết bằng văn bản

`docs/ROADMAP_90_DAYS.md:56-60` chặn mọi `wrangler deploy`, tạo D1 từ xa, hay công bố URL công khai cho tới khi:

1. **Uỷ quyền bằng văn bản của chủ sở hữu** — thu hồi ràng buộc `LOCAL ONLY` trong `wrangler.jsonc`.
2. **Phê duyệt pháp lý về quyền riêng tư trẻ em** — hoàn tất đánh giá tại `docs/CHILD_PRIVACY_REVIEW.md` §4 (Luật 91/2025/QH15, Nghị định 356/2025/NĐ-CP, kế thừa Nghị định 13/2023/NĐ-CP). Chính tài liệu đó ghi rõ: *"Existence of this checklist does not constitute legal compliance or legal sign-off."*
3. **Cung cấp bí mật production** — `SESSION_SECRET` entropy cao và `PARENT_PASSWORD_HASH` production, đưa vào qua Worker secrets được mã hoá, không bao giờ qua tệp cấu hình.

Ba điều kiện này không phải thủ tục. Điều kiện 1 và 2 nằm ngoài quyền của kỹ thuật viên, và đó là mục đích: chúng không thể bị vượt qua bằng một thay đổi mã.

## Điều ADR này **không** khẳng định

Đây là phần quan trọng nhất, và nó phải được nói thẳng.

**"Từ chối khởi động" không diễn đạt được trên nền tảng này.** Một Cloudflare Worker không có pha khởi động: nó được khởi tạo cho từng request. Không có chỗ nào để đặt một kiểm tra "chạy một lần rồi thoát". Hành vi gần nhất có thể đạt được là **từ chối mọi request**, và đó chính là điều lớp 2 làm — cổng nằm trước cả route matching, nên một Worker thiếu khoá ký trả 500 cho `/api/parent/dashboard`, cho `/api/does-not-exist`, cho `/`, và cho mọi tài nguyên tĩnh. `test/integration/api.test.ts` khẳng định đúng điều đó trên cả bốn loại đường dẫn. Đây là hành vi **đủ an toàn** và là mức mạnh nhất nền tảng cho phép, nhưng nó **khác** câu chữ "từ chối khởi động", và sự khác biệt đó được ghi ở đây thay vì bị viết lại cho khớp.

**Kiểm tra độ mạnh không chứng minh được tính ngẫu nhiên.** Entropy là thuộc tính của **quá trình sinh ra** chuỗi, không phải của chuỗi. Một cụm sáu từ điển có thể đo đẹp theo mọi thống kê ký tự và vẫn đoán được bởi bất kỳ ai biết cụm đó. Vì vậy các kiểm tra trong `config-guard.ts` được mô tả là **sàn**, không phải **bằng chứng**: chúng bắt được lỗi vận hành thực tế (placeholder, giá trị rỗng, cụm gõ tay, khoá ngẫu nhiên bị cắt cụt), và không có dòng nào trong tệp đó được gọi là "xác minh tính ngẫu nhiên".

**Không có xác thực cấu trúc salt/digest.** Cổng kiểm tra salt và digest **có mặt**, không kiểm tra chúng là base64url hợp lệ hay dài đúng. Một hash `pbkdf2-sha256:600000$x$y` đi qua cổng và sau đó làm hỏng đường đăng nhập. Đây là lỗi hiển thị rõ (không đăng nhập được, không phải đăng nhập sai người), nên nó không phải lỗ hổng bảo mật; nó là một thông điệp lỗi kém hữu ích, và được ghi nhận ở đây thay vì được vá bằng cách đoán.

**Cổng này không bảo vệ dữ liệu khỏi người có quyền sửa mã nguồn.** Ai sửa được `middleware.ts` thì bỏ được cổng. Nó bảo vệ khỏi **cấu hình sai và triển khai vô ý**, không phải khỏi người vận hành ác ý — đó là việc của lớp 1 và lớp 4.

## Hệ quả

**Được:**
- Không có đường triển khai nào đang mở một cách vô tình. Bốn lớp, ba trong số đó độc lập với thiện chí của người vận hành.
- Bí mật không có giá trị mặc định, nên trạng thái "chạy được mà chưa cấu hình" không tồn tại.
- Ba lớp có test canh giữ: `config-guard` (14 test cho từng mã lỗi và cho việc không rò giá trị), `deployment-lock` (6 test đọc tệp cấu hình đã commit), và hai test tích hợp chạy qua `worker.fetch` thật.

**Mất / chấp nhận:**
- Mọi thao tác remote đều phải qua tay người: không CI/CD, không preview deploy, không staging trên mây. Với một hộ gia đình, đó là cái giá đúng.
- Một `ENVIRONMENT` bị đặt sai thành `"development"` trên production sẽ tắt yêu cầu `PARENT_PASSWORD_HASH`. Không có gì trong mã chặn được điều đó — chỉ có việc `wrangler.jsonc` không khai báo biến này, và một test đọc tệp đó để giữ nguyên trạng.
- Hai khoảng trống đã ghi ở trên (không có pha khởi động; không xác thực cấu trúc salt/digest) là nợ kỹ thuật **đã biết**, và cả hai đều không thể đóng bằng một thay đổi mã đơn thuần. ADR này không được đọc như một lời khẳng định rằng khoá đã hoàn chỉnh.
