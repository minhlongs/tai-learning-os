# Báo cáo Tư vấn Kiến trúc Milestone M9 (`ak-advise --ultra`)

- **Ngày**: 2026-11-02
- **Nhánh cơ sở**: `main` (`631f44a`)
- **Chế độ**: `--ultra` (Best-of-5 Verifier Mode)
- **Phạm vi đã xác nhận**: Phương án 1 — Trọn gói M9 (4 bề mặt giao diện + đồng bộ `lessonVersions` khi xuất dữ liệu + kiểm thử đa tầng)

---

### 1. Verdict

**ĐỒNG Ý TRIỂN KHAI NGAY (APPROVE WITH COMPILE-TIME EXHAUSTIVENESS & RBAC GUARDRAILS)** — Cả 4 hạng mục trong gói bằng chứng đã được xác minh khớp 100% với trạng thái mã nguồn tại commit `631f44a`:
1. `endpoints.updateContent` (`/api/parent/lessons/content` tại `/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:645`) và `endpoints.updateLearner` (`/api/parent/learners/profile` tại `/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:980`) là 2 endpoint cuối cùng trong `/Users/macbook/projects/tai-learning-os/src/client/lib/endpoints.ts` chưa có caller trên tầng giao diện React.
2. `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DataControlScreen.tsx:49-64` hiện chỉ khai báo 14 phần tử trong mảng `COLLECTION_LABELS` (`readonly { key: keyof ExportBody; labelVi: string }[]`), bỏ sót 7 collection của M4–M8 (`lessonVersions`, `curriculumObjectives`, `curriculumIntakes`, `lessonMetadata`, `baselineAssessments`, `learningPlanItems`, `sessionReflections`) vì kiểu mảng không ép buộc vét cạn (exhaustiveness) toàn bộ key của `ExportBody`.
3. `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/OrganizationStudioScreen.tsx:893-900` đang bắt người dùng gõ tay `teacherId` vào `<input>`, trong khi danh sách thành viên trung tâm (`GET /api/org/members`) đã có sẵn cấu trúc `MemberRow` (`userId`, `displayName`, `role`).

Để bản vá đạt độ chặt tuyệt đối ở cấp độ biên dịch (compile-time), phân quyền RBAC trên UI trung tâm (`/parent/organization`), và vượt qua toàn bộ 3 viewport E2E (Desktop `1280×800`, Tablet `820×1180`, Mobile Pixel 7), cần áp dụng chính xác thiết kế kỹ thuật dưới đây.

---

### 2. What you should do

#### A. Khóa chặt tính vét cạn ở thời điểm biên dịch (Compile-time TypeScript Exhaustiveness) giữa `ExportBody` và `COLLECTION_LABELS`
Trong `/Users/macbook/projects/tai-learning-os/src/shared/schemas/transfer.ts:29-52`, `ExportBody` có tổng cộng 22 thuộc tính: **21 collection dữ liệu người học/chương trình** và 1 bảng hệ thống `schemaVersions`.
Nếu giữ nguyên khai báo mảng `const COLLECTION_LABELS: readonly { key: keyof ExportBody; labelVi: string }[]`, trình biên dịch TypeScript chỉ kiểm tra từng phần tử có thuộc `keyof ExportBody` hay không, chứ **không báo lỗi nếu thiếu key**.
- **Giải pháp bắt buộc trong `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DataControlScreen.tsx`**:
  1. Định nghĩa kiểu khóa xuất dữ liệu người dùng:
     ```ts
     type ExportCollectionKey = Exclude<keyof ExportBody, "schemaVersions">;
     ```
  2. Khai báo một `Record<ExportCollectionKey, string>` làm nguồn chân lý duy nhất để trình biên dịch bắt buộc phải có đủ 21 key (thiếu 1 key lập tức gãy `npm run typecheck`):
     ```ts
     const COLLECTION_LABEL_MAP: Record<ExportCollectionKey, string> = {
       learners: "Hồ sơ người học",
       schoolYears: "Năm học",
       subjects: "Môn học",
       skills: "Kỹ năng",
       skillPrerequisites: "Điều kiện tiên quyết",
       curriculumObjectives: "Mục tiêu chương trình (GDPT 2018)",
       curriculumIntakes: "Thiết lập chương trình theo môn",
       lessons: "Bài học",
       lessonVersions: "Phiên bản nội dung bài học",
       lessonSteps: "Bước trong bài học",
       lessonMetadata: "Siêu dữ liệu & nguồn gốc bài học",
       reviewApprovals: "Lần phụ huynh duyệt bài",
       learningSessions: "Phiên học của bé",
       learningAttempts: "Lần bé trả lời",
       skillEvidence: "Bằng chứng năng lực",
       reviewSchedule: "Lịch ôn tập",
       baselineAssessments: "Đánh giá đầu vào",
       learningPlanItems: "Mục kế hoạch học tập 4 tuần",
       sessionReflections: "Cảm nhận sau buổi học",
       learningGoals: "Mục tiêu học tập",
       auditEvents: "Nhật ký thay đổi",
     };
     ```
  3. Tạo mảng có thứ tự ổn định `COLLECTION_LABELS` từ `COLLECTION_LABEL_MAP` (hoặc dùng `satisfies readonly { key: ExportCollectionKey; labelVi: string }[]` kèm kiểm tra kiểu hai chiều `Exclude<ExportCollectionKey, (typeof COLLECTION_LABELS)[number]["key"]> extends never ? true : never`).
  4. Đồng bộ luôn `/Users/macbook/projects/tai-learning-os/src/worker/routes/data.ts`: kiểm tra `exportRecord` để đảm bảo `lessonVersions` từ bảng `lesson_versions` (cho các `lessonIds` được xuất) cũng được đính kèm đầy đủ vào `body` hoặc được `countCollections` xử lý an toàn qua `Array.isArray(value) ? value.length : 0`.

#### B. Phân quyền hiển thị RBAC chính xác trên `/parent/organization` khi Giáo viên (`teacher`) vs Chủ sở hữu/Quản trị viên (`owner`/`admin`) chỉnh sửa bài học
Kiểm tra trực tiếp `/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:663-669` cho thấy quy tắc RBAC ở tầng Worker là:
```ts
const orgLesson = await repo.findOrganizationLesson(context.env.DB, lesson.id);
if (orgLesson) {
  const role = await repo.findMemberRole(context.env.DB, orgLesson.organization_id, context.parent.parentId);
  if (!role || (role === "teacher" && orgLesson.author_id !== context.parent.parentId)) {
    return forbidden("Bạn không có quyền chỉnh sửa nội dung bài học của tổ chức này.");
  }
}
```
Và triết lý giao diện tại đầu file `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/OrganizationStudioScreen.tsx:15` quy định rõ: *"offering a button the server is guaranteed to refuse is a lying UI"*.
Nhưng hãy chú ý: `SessionInfo` (`/Users/macbook/projects/tai-learning-os/src/shared/api-contract.ts:19-29`) hiện chỉ trả về `parentDisplayName` mà chưa trả về `parentId`, trong khi `OrganizationMemberListResponse` (`GET /api/org/members`) và `OrganizationLessonListResponse` (`GET /api/org/lessons`) có `userId` và `authorId`!
- **Giải pháp RBAC chuẩn xác**:
  1. Hoặc bổ sung `parentId?: string | null` vào `SessionInfo` (trong `/Users/macbook/projects/tai-learning-os/src/shared/api-contract.ts` và `/Users/macbook/projects/tai-learning-os/src/worker/routes/session.ts:84`) **HOẶC** nâng state `members: MemberRow[]` lên `OrganizationStudioScreen` để chia sẻ cho cả `MembersSection`, `ClassroomSection`, và `LessonStudioSection`.
  2. Trong `LessonStudioSection`, xác định quyền chỉnh sửa từng dòng bài học (`OrgLessonRow`):
     - Nếu `canManage` (`myRole === "owner" || myRole === "admin"`): **Được phép chỉnh sửa mọi bài học của trung tâm**.
     - Nếu `myRole === "teacher"`: **Chỉ hiện nút chỉnh sửa (`data-testid="org-lesson-edit-btn"`) và nút `"Gửi duyệt"` (`data-testid="org-lesson-submit-btn"`) trên các bài học mà chính giáo viên đó là tác giả** (`l.authorId === currentParentId`, hoặc đối chiếu qua `members` / `session.parentId`). Với bài của giáo viên khác, hiển thị nhãn tĩnh `"Tác giả: ${l.authorDisplayName}"` thay vì hiện nút rồi bị lỗi `403 Forbidden`.
  3. Khi mở chế độ sửa một bài học trong `LessonStudioSection`:
     - Gọi `GET /api/parent/lessons/:lessonId` (`endpoints.lessonDetail(lessonId)`) để nạp `version` hiện tại và danh sách `steps` (cùng `titleVi`, `objectiveVi`).
     - Khi lưu chỉnh sửa, gọi `POST /api/parent/lessons/content` (`endpoints.updateContent`) với `{ lessonId, expectedVersion: detail.version, titleVi, objectiveVi, steps }`.
     - Sau khi lưu thành công (`res.value.version` tăng lên `v + 1`), Worker đã tự động đặt lại `organization_lessons.review_status = 'draft'` (`/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:796`). Giao diện gọi `load()` để cập nhật trạng thái dòng đó về `"Bản nháp"` và hiển thị thông báo rõ ràng: `"Đã cập nhật nội dung bài học (phiên bản ${res.value.version}). Trạng thái duyệt của trung tâm đã chuyển về Bản nháp để duyệt lại."`

#### C. Nối `endpoints.updateContent` vào `DetailPanel` của `LessonManagerScreen.tsx` (kèm chuẩn hóa kiểu `LessonDetailResponse` trong `src/shared/api-contract.ts:372`)
1. Trong `/Users/macbook/projects/tai-learning-os/src/shared/api-contract.ts:365-373`, cập nhật kiểu `steps` của `LessonDetailResponse` để `content: ExerciseSpec` và `explanationVi: string` phản ánh đúng dữ liệu thực tế từ `getLessonDetail` (`src/worker/routes/parent.ts:488-504`), giúp truyền vào `UpdateContentRequest["steps"]` hoàn toàn khớp kiểu mà không cần ép kiểu.
2. Xóa dòng chú thích cũ ở `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/LessonManagerScreen.tsx:682-683` (*"Content editing is deliberately not offered here"*).
3. Trong `DetailPanel` (`/Users/macbook/projects/tai-learning-os/src/client/screens/parent/LessonManagerScreen.tsx:685`), thêm chế độ chỉnh sửa trực tiếp (`isEditing`) cho phép phụ huynh cập nhật:
   - `titleVi` (`data-testid="lesson-edit-title-input"`)
   - `objectiveVi` (`data-testid="lesson-edit-objective-input"`)
   - Câu hỏi tiếng Việt (`question_vi`), 3 gợi ý tăng dần (`hint1_vi`, `hint2_vi`, `hint3_vi`), và lời giải thích (`explanationVi`) của từng bước (`step`), giữ nguyên các trường chuyên biệt của từng dạng bài tập (`ExerciseSpec`: `multiple_choice`, `fill_blank`, `number_order`, `fraction_visual`, `sentence_build`, `reading_comprehension`, `vocab_match`, `claim_evidence`) và `answerKey` để vượt qua bộ kiểm tra nghiêm ngặt `validateStepSet(body.steps)` ở `/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:683`.
4. Truyền `expectedVersion: detail.version` vào payload `UpdateContentRequest`. Khi `POST /api/parent/lessons/content` trả về `{ lessonId, version }`, gọi lại `openDetail(lessonId)` và `loadLessons()` để:
   - Hiển thị ngay `Phiên bản ${version}` mới (`v + 1`).
   - Nếu bài học trước đó đang ở trạng thái `approved`, danh sách bài học sẽ tự động chuyển sang nhãn cảnh báo `"Cần duyệt lại"` (`pendingReapproval: true`) đúng với bất biến sư phạm của hệ thống.

#### D. Nối `endpoints.updateLearner` (`PATCH /api/parent/learners/profile`) vào `DashboardScreen.tsx`
1. Trên `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DashboardScreen.tsx` (hiển thị ngay khi `data?.learner` tồn tại, kể cả khi `data.emptyState === true` hoặc `false`), thêm thẻ/khối chỉnh sửa hồ sơ người học (`LearnerProfileSection`, `data-testid="learner-profile-section"`).
2. Cho phép phụ huynh cập nhật:
   - `nickname` (1..40 ký tự, `data-testid="learner-profile-nickname-input"`)
   - `grade` (`<select>` từ Lớp 1 đến Lớp 12, `data-testid="learner-profile-grade-select"`)
   - Nút lưu (`data-testid="learner-profile-save-btn"`) gửi `api.patch<LearnerProfile>(endpoints.updateLearner, { learnerId: data.learner.id, nickname, grade })`.
3. Khi thành công: gọi đồng thời `load()` (cập nhật Dashboard) VÀ `reload()` từ `useSessionContext()` để đồng bộ tên và khối lớp của bé trên thanh điều hướng toàn cục (`session.learner` và `session.learners`).

#### E. Thay `<input>` `teacherId` bằng `<select>` thành viên trung tâm trong `OrganizationStudioScreen.tsx`
1. Nâng danh sách `members` (`MemberRow[]`) lên `OrganizationStudioScreen` (hoặc tải qua `endpoints.orgMembers` trong `ClassroomSection` với `onFocus` tương tự `loadConsented`). Việc nâng `members` lên `OrganizationStudioScreen` và truyền `members` + `onMembersChanged` xuống `MembersSection` và `ClassroomSection` là tối ưu nhất vì khi vừa thêm thành viên ở `MembersSection`, `<select>` trong `ClassroomSection` có ngay dữ liệu mới mà không cần fetch thừa.
2. Tại `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/OrganizationStudioScreen.tsx:891-904`, thay `<input id="org-teacher-input">` bằng `<select id="org-teacher-select" data-testid="org-teacher-select">`:
   - Option mặc định: `<option value="">— Chọn giáo viên —</option>`
   - Render danh sách `members`: `<option key={m.userId} value={m.userId}>{m.displayName} ({ROLE_LABELS[m.role]})</option>`.

---

### 3. What you shouldn't do

1. **KHÔNG gửi thiếu bước hoặc làm rơi trường của `ExerciseSpec` khi gọi `endpoints.updateContent`**:
   - Nếu `body.steps` được gửi lên, `/Users/macbook/projects/tai-learning-os/src/worker/routes/parent.ts:683` chạy `validateStepSet(body.steps)` kiểm tra vị trí tuần tự `1..N`, `validateExercise(step.content)`, và kiểm tra chéo `answerKey` với `content` (ví dụ `correctChoiceId` phải khớp với choice có `correct: true`). Khi sửa câu hỏi/gợi ý/giải thích trong `LessonManagerScreen.tsx`, phải bảo toàn nguyên vẹn cấu trúc `step.content` (`...step.content, question_vi, hint1_vi, hint2_vi, hint3_vi`) và `step.answerKey` của từng bước.
2. **KHÔNG đưa `schemaVersions` vào `COLLECTION_LABELS`**:
   - `schemaVersions` là bảng kỹ thuật nội bộ của D1 (`{ version: number; description: string }[]`), không nằm trong `EXPORT_COLLECTIONS` (20 bảng + `lessonVersions` = 21 bảng). Đưa `schemaVersions` vào bảng đếm giao diện phụ huynh sẽ làm lệch yêu cầu "21 collections". Hãy dùng `Exclude<keyof ExportBody, "schemaVersions">`.
3. **KHÔNG dùng `:any` hoặc ép kiểu mù (`as unknown as ...`) để lách kiểm tra TypeScript**:
   - Mọi request/response (`UpdateContentRequest`, `UpdateContentResponse`, `UpdateLearnerProfileRequest`, `LearnerProfile`) đều đã có sẵn trong `/Users/macbook/projects/tai-learning-os/src/shared/api-contract.ts:384-400, 451-466`. Hãy import và sử dụng trực tiếp.
4. **KHÔNG đụng chạm tới `.wrangler/state`, `.dev.vars`, hoặc cổng `8791`**:
   - Toàn bộ E2E Playwright chạy cô lập trên cổng `8792` với thư mục tạm trong `os.tmpdir()`. Tuyệt đối không chạy lệnh deploy hay sửa cấu hình môi trường.

---

### 4. What could be better / more efficient

1. **Chia sẻ trạng thái `members` ở cấp `OrganizationStudioScreen`**:
   - Hiện tại `MembersSection` và `ClassroomSection` nằm cạnh nhau trong cùng một trang `/parent/organization`. Nếu nâng `members` và `loadMembers` lên `OrganizationStudioScreen` (chạy khi `activeOrg.id` đổi), cả 3 khu vực sẽ hưởng lợi cùng lúc:
     - `MembersSection` hiển thị bảng thành viên và gọi `onMembersChanged()` sau khi thêm/cập nhật thành viên.
     - `ClassroomSection` nhận ngay `members` làm nguồn cho `<select data-testid="org-teacher-select">` mà không tốn thêm 1 HTTP request `GET /api/org/members`.
     - `LessonStudioSection` biết chính xác `userId` của phiên hiện tại hoặc quyền của từng thành viên.
2. **Trả về `parentId` trong `GET /api/session` (`SessionInfo`)**:
   - Thêm `parentId?: string | null` vào `SessionInfo` (chỉ 1 dòng tại `/Users/macbook/projects/tai-learning-os/src/worker/routes/session.ts:85`: `parentId: parent.id`) giúp `OrganizationStudioScreen` biết chính xác `session.parentId` để đối chiếu `orgLesson.authorId === session.parentId` cho vai trò `teacher`, vừa dùng làm giá trị mặc định thông minh hoặc hiển thị `(Bạn)` bên cạnh tên thành viên trong `<select>` phân công giáo viên.
3. **Kiểm thử E2E gộp luồng (Cohesive E2E Assertions) trên cả 3 Viewport**:
   - Playwright (`playwright.config.ts:44-65`) nhân bản mọi bài test trong `test/e2e/` qua 3 project: `desktop` (`1280×800`), `tablet` (`820×1180`, `isMobile: true, hasTouch: true`), và `mobile` (`Pixel 7`).
   - Thay vì tạo thêm bài test rời rạc phải đăng nhập và khởi tạo D1 từ đầu (tốn thêm 3 × thời gian khởi tạo PBKDF2 600k iterations), hãy mở rộng trực tiếp bài test số 10 trong `/Users/macbook/projects/tai-learning-os/test/e2e/m4-browser-verification.spec.ts` để kiểm tra liền mạch cả 4 tính năng trên cả 3 viewport mà không làm tăng thời gian chạy suite.

---

### 5. My take and how to get there

Lộ trình thực thi gồm **4 bước gọn, sạch, không dư thừa**:

#### Bước 1: Khóa vét cạn 21 collection trong `DataControlScreen.tsx` (và đồng bộ `lessonVersions` trong `data.ts`)
- Tại `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DataControlScreen.tsx:48-64`:
  - Khai báo `type ExportCollectionKey = Exclude<keyof ExportBody, "schemaVersions">;`
  - Khai báo `COLLECTION_LABEL_MAP: Record<ExportCollectionKey, string>` chứa đủ 21 khóa tiếng Việt rõ nghĩa.
  - Sinh `COLLECTION_LABELS` theo thứ tự logic của `ExportBody` (bổ sung `curriculumObjectives`, `curriculumIntakes`, `lessonVersions`, `lessonMetadata`, `baselineAssessments`, `learningPlanItems`, `sessionReflections`).
- Tại `/Users/macbook/projects/tai-learning-os/src/worker/routes/data.ts`:
  - Kiểm tra và bổ sung truy vấn `lesson_versions` cho các `lessonIds` được xuất vào `body.lessonVersions` để tệp JSON xuất ra luôn mang đầy đủ cả 21 khóa mảng.

#### Bước 2: Nối `endpoints.updateLearner` vào `DashboardScreen.tsx`
- Tại `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/DashboardScreen.tsx`:
  - Import `UpdateLearnerProfileRequest`, `LearnerProfile` từ `../../../shared/api-contract`.
  - Lấy `{ session, reload }` từ `useSessionContext()`.
  - Tạo component `LearnerProfileSection` nhận `learner: NonNullable<ParentDashboardResponse["learner"]>` và `onUpdated: () => void`.
  - Hiển thị biểu mẫu nhỏ gọn với `<input data-testid="learner-profile-nickname-input">` (1–40 ký tự) và `<select data-testid="learner-profile-grade-select">` (Lớp 1..12) + nút `<button type="submit" data-testid="learner-profile-save-btn">Lưu hồ sơ</button>`.
  - Khi submit, gọi `api.patch<LearnerProfile>(endpoints.updateLearner, { learnerId: learner.id, nickname: nickname.trim(), grade })`. Khi `res.ok`, hiển thị thông báo `data-testid="learner-profile-notice"`, gọi `load()` và `reload()`.

#### Bước 3: Nối `<select>` giáo viên và `endpoints.updateContent` (kèm RBAC) vào `OrganizationStudioScreen.tsx`
- Bổ sung `parentId?: string | null` vào `SessionInfo` trong `/Users/macbook/projects/tai-learning-os/src/shared/api-contract.ts` và `/Users/macbook/projects/tai-learning-os/src/worker/routes/session.ts`.
- Tại `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/OrganizationStudioScreen.tsx`:
  - Nâng state `members` (`MemberRow[]`) lên `OrganizationStudioScreen` (hoặc nạp trong `ClassroomSection`) và truyền xuống `ClassroomSection`.
  - Trong `ClassroomSection` (dòng 891–904), thay `<input data-testid="org-teacher-input">` bằng `<select id="org-teacher-select" className="select" data-testid="org-teacher-select">` liệt kê các thành viên của tổ chức (`m.userId` -> `${m.displayName} (${ROLE_LABELS[m.role]})`).
  - Trong `LessonStudioSection`:
    - Tính biến `const canEditLesson = (l: OrgLessonRow) => canManage || (myRole === "teacher" && l.authorId === session.parentId);`.
    - Chỉ hiển thị nút `"Gửi duyệt"` (`l.reviewStatus === "draft" || l.reviewStatus === "org_rejected"`) và nút `"Chỉnh sửa"` (`data-testid={`org-lesson-edit-btn-${l.lessonId}`}`) khi `canEditLesson(l)` là `true`.
    - Khi bấm `"Chỉnh sửa"`, gọi `api.get<LessonDetailResponse>(endpoints.lessonDetail(l.lessonId))` để nạp dữ liệu bài học (`editingLessonId`, `editingVersion`, `titleVi`, `objectiveVi`, và `steps`), chuyển biểu mẫu sang chế độ cập nhật nội dung.
    - Khi bấm lưu ở chế độ cập nhật (`data-testid="org-lesson-update-btn"`), gọi `api.post<UpdateContentResponse>(endpoints.updateContent, { lessonId: editingLessonId, expectedVersion: editingVersion, titleVi, objectiveVi, steps: mappedSteps })`. Sau khi thành công, thoát chế độ sửa, thông báo phiên bản mới `res.value.version` và gọi `load()` (lúc này trạng thái bài học trung tâm tự động quay về `"Bản nháp"`).

#### Bước 4: Nối `endpoints.updateContent` vào `DetailPanel` của `LessonManagerScreen.tsx` & Kiểm thử đa tầng
- Tại `/Users/macbook/projects/tai-learning-os/src/client/screens/parent/LessonManagerScreen.tsx`:
  - Trong `DetailPanel`, thêm nút `"Chỉnh sửa nội dung"` (`data-testid="lesson-detail-edit-btn"`).
  - Khi bật chế độ sửa, hiển thị ô nhập `titleVi` (`data-testid="lesson-edit-title-input"`), `objectiveVi` (`data-testid="lesson-edit-objective-input"`), và cho từng bước hiển thị ô sửa `question_vi` (`data-testid={`lesson-edit-step-question-${step.position}`}`), `hint1_vi`..`hint3_vi`, và `explanationVi` (`data-testid={`lesson-edit-step-explanation-${step.position}`}`).
  - Khi bấm `"Lưu phiên bản mới"` (`data-testid="lesson-detail-save-btn"`), gọi `api.post<UpdateContentResponse>(endpoints.updateContent, { lessonId: detail.id, expectedVersion: detail.version, titleVi, objectiveVi, steps })`.
  - Khi lưu thành công, gọi callback `onContentUpdated(detail.id)` để tải lại chi tiết bài học (hiển thị `Phiên bản ${v + 1}`) và tải lại danh sách bài học (hiển thị trạng thái `"Cần duyệt lại"` nếu bài trước đó đã duyệt).
- Cập nhật unit/integration tests và E2E test (`test/e2e/m4-browser-verification.spec.ts`) để xác minh trên cả 3 viewport Desktop/Tablet/Mobile:
  - Lưu ý quan trọng cho E2E đa viewport: Trên Tablet (`820×1180`, `isMobile: true`) và Mobile (`Pixel 7`), trước khi tương tác với các nút trong `DetailPanel` hoặc form cuối trang `OrganizationStudioScreen`, luôn dùng `locator.scrollIntoViewIfNeeded()` hoặc đảm bảo phần tử hiển thị trong viewport, và không dựa vào hover state.

---

### 6. Benefits

1. **Không còn bất kỳ endpoint mồ côi (orphaned route) nào**: 100% các route trong `/Users/macbook/projects/tai-learning-os/src/client/lib/endpoints.ts` đều có caller thực tế trên giao diện React và được kiểm chứng qua E2E browser test.
2. **Bảo vệ kiểu dữ liệu tự động ở thời điểm biên dịch**: Nhờ `Record<Exclude<keyof ExportBody, "schemaVersions">, string>`, bất kỳ ai thêm collection mới vào `ExportBody` trong tương lai mà quên cập nhật `DataControlScreen.tsx` sẽ bị chặn ngay tại `npm run typecheck`.
3. **Chuỗi kiểm duyệt sư phạm khép kín (End-to-End Pedagogical Integrity)**:
   - Phụ huynh sửa bài học đã duyệt -> version tăng lên `v + 1` -> trạng thái chuyển sang `"Cần duyệt lại"` (`pendingReapproval: true`) -> học sinh không thấy bản chưa duyệt lại.
   - Giáo viên/Quản trị viên sửa bài học trung tâm đã duyệt (`org_approved`) -> version tăng lên `v + 1` -> trạng thái trung tâm tự động quay về `"Bản nháp"` (`draft`) -> bắt buộc qua lại bước trung tâm duyệt trước khi giao cho lớp.
4. **UX trung thực & chống lỗi nhập liệu**: Thay thế ô nhập UUID/userId thủ công bằng `<select>` thành viên trung tâm và ẩn các nút thao tác mà RBAC phía server từ chối đối với giáo viên không phải tác giả.

---

### 7. Trade-offs

1. **Chỉnh sửa bước bài học trong `LessonManagerScreen.tsx` với các kiểu bài tập đa hình (`ExerciseSpec`)**:
   - Các bài học hệ thống sử dụng nhiều kiểu `ExerciseSpec` khác nhau (`multiple_choice`, `fraction_visual`, `reading_comprehension`, `vocab_match`, v.v.).
   - *Đánh đổi thông minh*: Thay vì xây dựng bộ trình soạn thảo cấu trúc đồ họa phức tạp trong `DetailPanel`, biểu mẫu chỉnh sửa trong `DetailPanel` cho phép sửa các trường văn bản sư phạm chung của mọi bước (`question_vi`, `hint1_vi`, `hint2_vi`, `hint3_vi`, `explanationVi`, và các lựa chọn cho `multiple_choice`) đồng thời giữ nguyên các trường cấu hình chuyên biệt + `answerKey` của bước đó. Khi nào cần tạo mới từ đầu các bài tập đồ họa phân số (`fraction_visual`) trên UI mà không qua seed JSON thì mới cần mở rộng thêm form chuyên biệt theo từng `content.type` (chi phí chuyển đổi ~1–2 ngày công, không cần đổi API hay DB).
2. **Mở rộng `SessionInfo` thêm `parentId` và chuẩn hóa kiểu `LessonDetailResponse["steps"]`**:
   - Thêm `parentId?: string | null` vào `GET /api/session` và cập nhật `LessonDetailResponse["steps"]` dùng `content: ExerciseSpec` trong `src/shared/api-contract.ts` là thay đổi tương thích ngược 100%, không làm ảnh hưởng bất kỳ test hiện có nào, và giải quyết triệt để cả bài toán RBAC hiển thị cho `teacher` lẫn kiểm tra kiểu nghiêm ngặt (`0 :any`).

---

### 8. Work checklist, success metrics & handoff brief

#### Work Checklist
- [ ] **1. `src/shared/api-contract.ts` & `src/worker/routes/session.ts`**: Bổ sung `parentId?: string | null` vào `SessionInfo` để client xác định chính xác quyền tác giả (`authorId === session.parentId`) khi ở vai trò `teacher`; cập nhật `LessonDetailResponse["steps"]` dùng `content: ExerciseSpec` và `explanationVi: string`.
- [ ] **2. `src/client/screens/parent/DataControlScreen.tsx` & `src/worker/routes/data.ts`**: Dùng `Record<Exclude<keyof ExportBody, "schemaVersions">, string>` để khóa vét cạn 21 collection của `ExportBody` ở thời điểm biên dịch; bổ sung xuất `lessonVersions` trong `exportRecord` (`src/worker/routes/data.ts`).
- [ ] **3. `src/client/screens/parent/DashboardScreen.tsx`**: Thêm `LearnerProfileSection` gọi `api.patch(endpoints.updateLearner, ...)` để cập nhật `nickname` (1–40 ký tự) và `grade` (1–12), sau đó gọi `load()` và `reload()` của `useSessionContext()`.
- [ ] **4. `src/client/screens/parent/LessonManagerScreen.tsx`**: Bổ sung chế độ chỉnh sửa trong `DetailPanel` gọi `api.post(endpoints.updateContent, ...)` với `expectedVersion: detail.version`, cho phép sửa `titleVi`, `objectiveVi`, và `question_vi` / `hint1_vi..hint3_vi` / `explanationVi` của các bước, tăng version lên `v + 1`.
- [ ] **5. `src/client/screens/parent/OrganizationStudioScreen.tsx`**:
  - Thay `<input>` `teacherId` trong `ClassroomSection` bằng `<select data-testid="org-teacher-select">` lấy từ danh sách thành viên (`GET /api/org/members`).
  - Bổ sung chế độ chỉnh sửa bài học tổ chức trong `LessonStudioSection` gọi `endpoints.updateContent` kèm kiểm tra RBAC (`canManage || (myRole === "teacher" && l.authorId === session.parentId)`).
- [ ] **6. Tests & Verification Gates**: Cập nhật integration/E2E tests (`test/e2e/m4-browser-verification.spec.ts`) kiểm tra cả 4 hạng mục trên 3 viewport (Desktop, Tablet, Mobile); chạy `npm run verify`, `npm run test:integration`, `npm run test:e2e`, và `npm run backup:drill`.

#### Success Metrics
- `git grep "endpoints.updateContent" src/client/screens/` trả về cả `LessonManagerScreen.tsx` và `OrganizationStudioScreen.tsx`.
- `git grep "endpoints.updateLearner" src/client/screens/` trả về `DashboardScreen.tsx`.
- `COLLECTION_LABELS` trong `DataControlScreen.tsx` có đúng 21 phần tử và được bảo vệ bởi kiểu vét cạn `Record<Exclude<keyof ExportBody, "schemaVersions">, string>`.
- `npm run verify`, `npm run test:integration`, `npm run test:e2e` (trên cả 3 project `desktop`, `tablet`, `mobile`), và `npm run backup:drill` đều PASS với 0 lỗi.

```text
Objective: Khép kín 4 khoảng trống giao diện quản trị phụ huynh & trung tâm trong Milestone M9 (nối dây endpoints.updateContent và endpoints.updateLearner, đồng bộ vét cạn 21 khóa COLLECTION_LABELS + xuất lessonVersions, và thay ô nhập teacherId bằng <select> thành viên trung tâm).
Done means:
- git grep "endpoints.updateContent" src/client/screens/ trả về caller trong LessonManagerScreen.tsx và OrganizationStudioScreen.tsx (gửi kèm expectedVersion, tăng version lên v + 1, chuyển bài đã duyệt sang pendingReapproval và đưa bài trung tâm về draft).
- git grep "endpoints.updateLearner" src/client/screens/ trả về caller trong DashboardScreen.tsx (cập nhật nickname 1..40 ký tự và grade 1..12, đồng bộ cả Dashboard và Session).
- COLLECTION_LABELS trong DataControlScreen.tsx chứa đủ 21 khóa của ExportBody (bảo vệ bằng Record<Exclude<keyof ExportBody, "schemaVersions">, string>) và exportRecord trong src/worker/routes/data.ts xuất đầy đủ lessonVersions.
- ClassroomSection trong OrganizationStudioScreen.tsx sử dụng <select> nạp từ GET /api/org/members để phân công giáo viên.
- npm run verify, npm run test:integration, npm run test:e2e, và npm run backup:drill đều PASS với 0 lỗi.
Out of scope:
- Không tạo migration D1 mới hoặc thay đổi schema cơ sở dữ liệu.
- Không gọi LLM bên ngoài và không triển khai lên đám mây (PR-MERGE AUTHORIZED / PRODUCTION DEPLOY BLOCKED).
Constraints:
- Không chạm vào .wrangler/state, .dev.vars, hoặc cổng 8791.
- 0 kiểu :any, 0 console.log trong mã nguồn production, toàn bộ giao diện bằng tiếng Việt.
- Bảo toàn nguyên vẹn cấu trúc đa hình ExerciseSpec và answerKey khi chỉnh sửa bước bài học.
Stop and ask only if:
- Phát hiện lỗi kiểm thử không thể giải thích được từ mã nguồn hiện tại.
- Cần thực hiện bất kỳ thao tác xóa dữ liệu hoặc thay đổi ngoài phạm vi kho mã nguồn hiện tại.
```

---

## Phụ lục Xếp hạng 5 Ứng viên (`--ultra` Best-of-5 Verifier Rubric)

| Hạng | Ứng viên | Bám sát yêu cầu (1–20) | Bằng chứng mã nguồn (1–20) | Trung thực đánh đổi (1–20) | Tính khả thi & Handoff (1–20) | Tổng điểm (/80) | Nhận xét trọng tâm của Verifier |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1 (Winner)** | **Candidate 3** (`ae1d56ab1d28f6fac`) | **20** | **20** | **19** | **20** | **79/80** | Phát hiện và giải quyết trọn vẹn: (1) khóa kiểu tĩnh vét cạn `Record<Exclude<keyof ExportBody, "schemaVersions">, string>`, (2) đồng bộ `lessonVersions` trong `exportRecord`, (3) kiểm tra quyền RBAC hiển thị trên UI (`authorId === session.parentId`) để `teacher` không thấy nút sửa bài của giáo viên khác ("lying UI" invariant ở dòng 15 `OrganizationStudioScreen.tsx`), và (4) lưu ý E2E đa viewport (`desktop`/`tablet`/`mobile`). |
| **2** | **Candidate 1** (`ae75cb6fb69e265f2`) | **20** | **19** | **19** | **19** | **77/80** | Phát hiện rất chính xác việc `exportRecord` trong `src/worker/routes/data.ts` chưa đính kèm `lessonVersions` (dù `importCollections` đã đọc `data.lessonVersions`) và đề xuất tái sử dụng form 5 bước sẵn có trong `OrganizationStudioScreen.tsx`. |
| **3** | **Candidate 2** (`a1bf870f4e0c3edda`) | **19** | **19** | **18** | **19** | **75/80** | Phát hiện điểm lệch kiểu rất giá trị trong `src/shared/api-contract.ts:372`: `LessonDetailResponse["steps"]` đang kế thừa `LessonStepPayload` (`content: LearnerExerciseSpec`) trong khi Worker `getLessonDetail` thực tế trả về `ExerciseSpec` đầy đủ. |
| **4** | **Candidate 5** (`aeb40e5f9c844b2bc`) | **19** | **18** | **18** | **18** | **73/80** | Phân tích sâu cơ chế cắt hạn 30 phút (`clampContinuationDeadlinesForLearnerLessonStatement`) và đồng bộ `choices[].correct` với `answerKey.correctChoiceId`, nhưng chưa đề cập tới việc `exportRecord` thiếu `lessonVersions`. |
| **5** | **Candidate 4** (`a8c1d7ff8a60fc563`) | **16** | **15** | **18** | **17** | **66/80** | Đề xuất tách `LessonContentEditor.tsx` dùng chung hợp lý, nhưng trong đoạn code minh họa `COLLECTION_LABEL_MAP` đã viết nhầm một số tên khóa (`stepInteractions`, `masterySnapshots`, `lessonApprovals`) không khớp với tên khóa thực tế trong `src/shared/schemas/transfer.ts` (`learningAttempts`, `skillEvidence`, `reviewApprovals`). |
