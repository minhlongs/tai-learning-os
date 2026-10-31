/**
 * Parent data control: sao lưu, phục hồi, xóa.
 *
 * Three real operations against the parent's own record, and each one has to be
 * honest about what it does:
 *
 *  - EXPORT (`POST /api/data/export`) produces the portable envelope and the
 *    browser writes it to a real file. No count or file size is invented here;
 *    everything shown comes from the response.
 *
 *  - IMPORT reads a chosen file, checks its shape in the browser first, and
 *    only then sends it. The server re-keys the imported learner to the parent
 *    doing the import, so the screen says that plainly rather than implying a
 *    merge.
 *
 *  - DELETE is irreversible. It is behind a typed confirmation that names the
 *    learner, matching what the server requires, because a mistyped string must
 *    fail on the client just as it would on the server. Nothing is cleared,
 *    navigated, or assumed until `{ deleted: true }` actually comes back.
 *
 * The learner's nickname appears only where it is load-bearing: inside the
 * confirmation string the parent has to type. It is not repeated in headings.
 */

import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  CreateLearnerRequest,
  CreateLearnerResponse,
  DeleteLearnerRequest,
  DeleteLearnerResponse,
  ExportResponse,
  ImportResponse,
} from "../../../shared/api-contract";
import { TRANSFER_FORMAT_VERSION, type ExportBody } from "../../../shared/schemas/transfer";
import { setActiveLearnerId } from "../../lib/active-learner-store";
import { api, failureMessage } from "../../lib/api";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { endpoints } from "../../lib/endpoints";
import "../../styles/data-control.css";

/** Collections an export carries, in the order the server writes them. */
const COLLECTION_LABELS: readonly { key: keyof ExportBody; labelVi: string }[] = [
  { key: "learners", labelVi: "Hồ sơ người học" },
  { key: "schoolYears", labelVi: "Năm học" },
  { key: "subjects", labelVi: "Môn học" },
  { key: "skills", labelVi: "Kỹ năng" },
  { key: "skillPrerequisites", labelVi: "Điều kiện tiên quyết" },
  { key: "lessons", labelVi: "Bài học" },
  { key: "lessonSteps", labelVi: "Bước trong bài học" },
  { key: "reviewApprovals", labelVi: "Lần phụ huynh duyệt bài" },
  { key: "learningSessions", labelVi: "Phiên học của bé" },
  { key: "learningAttempts", labelVi: "Lần bé trả lời" },
  { key: "skillEvidence", labelVi: "Bằng chứng năng lực" },
  { key: "reviewSchedule", labelVi: "Lịch ôn tập" },
  { key: "learningGoals", labelVi: "Mục tiêu học tập" },
  { key: "auditEvents", labelVi: "Nhật ký thay đổi" },
];

/** One removable data family in the cascade. Mirrors the server's DELETE set. */
const DELETE_ITEMS: readonly string[] = [
  "Hồ sơ người học (biệt danh, năm sinh, khối lớp)",
  "Toàn bộ năm học đã tạo",
  "Phiên học — mỗi lần bé mở một bài",
  "Lần trả lời — từng câu bé đã làm và kết quả",
  "Bằng chứng năng lực đã ghi nhận",
  "Lịch ôn tập đã tính",
  "Mục tiêu học tập đã đặt",
];

/* ── Export ─────────────────────────────────────────────────────────────────── */

/** A filename that is descriptive and carries no personal identifier. */
function exportFileName(): string {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `tai-learning-os-export-${iso}.json`;
}

/** Byte length of the UTF-8 text, which is what lands on disk. */
function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Hand the envelope to the browser's download machinery and clean up after it. */
function downloadEnvelope(text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = exportFileName();
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately would cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Counts per collection, reading only collections that are actually arrays. */
function countCollections(data: unknown): { label: string; count: number }[] {
  if (typeof data !== "object" || data === null) return [];
  const body = data as Record<string, unknown>;
  const rows: { label: string; count: number }[] = [];
  for (const entry of COLLECTION_LABELS) {
    const value = body[entry.key];
    rows.push({ label: entry.labelVi, count: Array.isArray(value) ? value.length : 0 });
  }
  return rows;
}

/* ── Import validation ──────────────────────────────────────────────────────── */

type CheckedFile =
  | { ok: true; envelope: ExportResponse; problems: null }
  | { ok: false; envelope: null; problems: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Everything the server checks about an envelope's *shape*, decided in the
 * browser so the parent reads the full list before sending anything.
 *
 * A newer `formatVersion` is refused outright: this app cannot interpret data
 * it does not know, and the file has to be restored by the version that made it.
 */
function checkEnvelope(fileText: string): CheckedFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText) as unknown;
  } catch {
    return {
      ok: false,
      envelope: null,
      problems: [
        "Tệp không phải là JSON hợp lệ. Hãy chọn đúng tệp sao lưu mà ứng dụng đã tạo ra.",
      ],
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      envelope: null,
      problems: ["Tệp phải chứa một đối tượng JSON, không phải một danh sách hay một giá trị đơn lẻ."],
    };
  }

  const problems: string[] = [];

  const rawVersion = parsed.formatVersion;
  if (typeof rawVersion !== "number") {
    problems.push(
      "Thiếu số phiên bản định dạng (formatVersion). Tệp này có thể không phải tệp sao lưu của ứng dụng.",
    );
  } else if (!Number.isInteger(rawVersion)) {
    problems.push("Số phiên bản định dạng (formatVersion) phải là một số nguyên.");
  } else if (rawVersion > TRANSFER_FORMAT_VERSION) {
    problems.push(
      `Tệp này được tạo bởi phiên bản mới hơn (định dạng ${rawVersion}, máy này chỉ đọc được ${TRANSFER_FORMAT_VERSION}). ` +
        "Hãy mở tệp bằng chính phiên bản ứng dụng đã tạo ra nó, hoặc cập nhật ứng dụng lên bản mới nhất rồi thử lại.",
    );
  } else if (rawVersion < TRANSFER_FORMAT_VERSION) {
    problems.push(
      `Tệp này là định dạng cũ (${rawVersion}, hiện tại là ${TRANSFER_FORMAT_VERSION}) nên máy này không phục hồi được.`,
    );
  }

  if (parsed.exportedAt !== undefined && !Number.isFinite(parsed.exportedAt)) {
    problems.push("Mốc thời gian xuất dữ liệu (exportedAt) không hợp lệ.");
  }

  const data = parsed.data;
  if (!isPlainObject(data)) {
    problems.push("Thiếu phần nội dung dữ liệu (data). Tệp sao lưu phải có mục này.");
  } else {
    // Only collections actually present are judged: an absent one is a server
    // concern, an invalid one is visible here.
    for (const entry of COLLECTION_LABELS) {
      const value = data[entry.key];
      if (value === undefined) continue;
      if (!Array.isArray(value)) {
        problems.push(`Mục "${entry.labelVi}" trong tệp phải là một danh sách.`);
      }
    }
  }

  if (problems.length > 0) {
    return { ok: false, envelope: null, problems };
  }

  return { ok: true, envelope: parsed as unknown as ExportResponse, problems: null };
}

/* ── Screen ─────────────────────────────────────────────────────────────────── */

export function DataControlScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session, reload } = useSessionContext();
  const learner = session.learner;
  const learners = session.learners ?? (learner ? [{ id: learner.id, nickname: learner.nickname, grade: 4 }] : []);

  /* Multi-learner household enrolment -------------------------------------- */
  const [newNickname, setNewNickname] = useState("");
  const [newGrade, setNewGrade] = useState("4");
  const [enrolBusy, setEnrolBusy] = useState(false);
  const [enrolError, setEnrolError] = useState<string | null>(null);
  const [enrolSuccess, setEnrolSuccess] = useState<string | null>(null);

  const onCreateLearner = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const trimmed = newNickname.trim();
      if (!trimmed) {
        setEnrolError("Vui lòng nhập biệt danh cho bé.");
        return;
      }
      setEnrolBusy(true);
      setEnrolError(null);
      setEnrolSuccess(null);
      const parsedGrade = Number.parseInt(newGrade, 10);
      const body: CreateLearnerRequest = {
        nickname: trimmed,
        birthYear: null,
        grade: Number.isInteger(parsedGrade) ? parsedGrade : 4,
        timezone: "Asia/Ho_Chi_Minh",
      };
      void api.post<CreateLearnerResponse>(endpoints.createLearner, body).then((result) => {
        setEnrolBusy(false);
        if (!result.ok) {
          setEnrolError(failureMessage(result.failure));
          return;
        }
        setNewNickname("");
        setEnrolSuccess(`Đã thêm hồ sơ bé "${result.value.learner.nickname}".`);
        setActiveLearnerId(result.value.learner.id);
        reload();
      });
    },
    [newNickname, newGrade, reload],
  );

  /* Export ------------------------------------------------------------------ */
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exported, setExported] = useState<{
    fileName: string;
    bytes: number;
    formatVersion: number;
    exportedAt: number;
    hasEvidence: boolean;
    counts: { label: string; count: number }[];
  } | null>(null);

  /* Import ------------------------------------------------------------------ */
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importProblems, setImportProblems] = useState<string[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importCounts, setImportCounts] = useState<{ label: string; count: number }[]>([]);
  const importPayload = useRef<ExportResponse | null>(null);
  /**
   * The envelope that passed the browser-side check, held in state so the
   * submit button's disabled rule re-renders correctly once `file.text()`
   * resolves. A ref would not trigger a render, and reading one during render
   * would leave the button showing a stale answer.
   */
  const [importReady, setImportReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Delete ------------------------------------------------------------------ */
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  /** The server's exact rule: `XOA <nickname>`, no leading or trailing space. */
  const requiredPhrase = learner ? `XOA ${learner.nickname}` : "";
  const confirmMatches = requiredPhrase.length > 0 && confirmText === requiredPhrase;

  const onExport = useCallback(() => {
    setExportBusy(true);
    setExportError(null);
    setExported(null);
    // The response carries the envelope, so the file is written from the very
    // bytes the server produced rather than from anything assembled here.
    void api.post<ExportResponse>(endpoints.exportData).then((result) => {
      setExportBusy(false);
      if (!result.ok) {
        setExportError(failureMessage(result.failure));
        return;
      }
      const envelope = result.value;
      const text = JSON.stringify(envelope, null, 2);
      downloadEnvelope(text);
      setExported({
        fileName: exportFileName(),
        bytes: byteLength(text),
        formatVersion: envelope.formatVersion,
        exportedAt: envelope.exportedAt,
        hasEvidence: envelope.containsLearnerEvidence,
        counts: countCollections(envelope.data),
      });
    });
  }, []);

  const onPickFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // A second pick must not inherit the previous file's verdict.
    setImportError(null);
    setImportResult(null);
    setImportProblems([]);
    setImportCounts([]);
    setImportFileName(null);
    importPayload.current = null;
    setImportReady(false);

    if (!file) return;

    setImportFileName(file.name);
    void file.text().then((text) => {
      const checked = checkEnvelope(text);
      if (checked.ok) {
        importPayload.current = checked.envelope;
        setImportProblems([]);
        setImportCounts(countCollections(checked.envelope.data));
      } else {
        importPayload.current = null;
        setImportProblems(checked.problems);
      }
      setImportReady(checked.ok);
    });
  }, []);

  const onImport = useCallback(() => {
    const payload = importPayload.current;
    if (!payload) return;
    setImportBusy(true);
    setImportError(null);
    setImportResult(null);
    void api.post<ImportResponse>(endpoints.importData, payload).then((result) => {
      setImportBusy(false);
      if (result.ok) {
        setImportResult(result.value);
        // The learner on this machine changed; the checked envelope is spent,
        // so it cannot be submitted a second time by accident.
        importPayload.current = null;
        setImportReady(false);
        setImportFileName(null);
        setImportCounts([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setImportError(failureMessage(result.failure));
      }
    });
  }, []);

  const onDelete = useCallback(() => {
    if (!learner || !confirmMatches || deleted) return;
    const body: DeleteLearnerRequest = { learnerId: learner.id, confirmation: confirmText };
    setDeleteBusy(true);
    setDeleteError(null);
    // No navigation, no optimistic clearing: the panel below is what changes,
    // and only after `{ deleted: true }` came back from the server.
    void api.del<DeleteLearnerResponse>(endpoints.deleteLearner, body).then((result) => {
      setDeleteBusy(false);
      if (result.ok) {
        setDeleted(true);
        setConfirmText("");
        return;
      }
      setDeleteError(failureMessage(result.failure));
    });
  }, [learner, confirmMatches, deleted, confirmText]);

  const exportedAtLabel = exported
    ? new Date(exported.exportedAt).toLocaleString("vi-VN")
    : null;

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="data-control">
        <header className="page__header">
          <h1 className="page__title">Quản lý dữ liệu của bé</h1>
          <p className="page__lede">
            Mọi thành tích học tập của bé được lưu trên thiết bị này. Phụ huynh có thể sao lưu
            ra tệp, phục hồi từ tệp, hoặc xóa hoàn toàn.
          </p>
        </header>

        {/* ── 0. Household learners ─────────────────────────────────────── */}
        <section className="card data-control__section" aria-labelledby="household-learners-title">
          <h2 className="card__title" id="household-learners-title">
            Hồ sơ các bé trong gia đình
          </h2>
          <p className="card__note">
            Mỗi bé có bài học được duyệt, tiến độ và lịch ôn tập độc lập. Phụ huynh có thể thêm
            hồ sơ mới hoặc chuyển đổi giữa các bé ngay tại đây.
          </p>

          {learners.length > 0 ? (
            <ul className="data-control__counts" data-testid="household-learners-list">
              {learners.map((item) => {
                const isActive = item.id === learner?.id;
                return (
                  <li className="data-control__count" key={item.id}>
                    <span className="data-control__count-label">
                      <strong>{item.nickname}</strong>
                      {item.grade ? ` · Lớp ${item.grade}` : ""}
                      {isActive ? " (Đang chọn)" : ""}
                    </span>
                    {!isActive ? (
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          setActiveLearnerId(item.id);
                          reload();
                        }}
                      >
                        Chọn hồ sơ này
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <form onSubmit={onCreateLearner} style={{ marginTop: "1rem" }} data-testid="add-learner-form">
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="field" style={{ flex: "1 1 200px", marginBottom: 0 }}>
                <label className="field__label" htmlFor="new-learner-nickname">
                  Biệt danh bé mới
                </label>
                <input
                  id="new-learner-nickname"
                  className="input"
                  type="text"
                  maxLength={40}
                  placeholder="Ví dụ: Bé Minh"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  disabled={enrolBusy}
                />
              </div>
              <div className="field" style={{ width: "140px", marginBottom: 0 }}>
                <label className="field__label" htmlFor="new-learner-grade">
                  Khối lớp
                </label>
                <select
                  id="new-learner-grade"
                  className="select"
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  disabled={enrolBusy}
                >
                  <option value="3">Lớp 3</option>
                  <option value="4">Lớp 4</option>
                  <option value="5">Lớp 5</option>
                </select>
              </div>
              <button type="submit" className="btn btn--secondary" disabled={enrolBusy}>
                {enrolBusy ? "Đang thêm…" : "Thêm hồ sơ bé"}
              </button>
            </div>
            {enrolError ? (
              <p className="data-control__notice data-control__notice--error" role="alert">
                {enrolError}
              </p>
            ) : null}
            {enrolSuccess ? (
              <p className="data-control__notice data-control__notice--ok" role="status">
                {enrolSuccess}
              </p>
            ) : null}
          </form>
        </section>

        {/* ── 1. Export ─────────────────────────────────────────────────── */}
        <section className="card data-control__section" aria-labelledby="export-title">
          <h2 className="card__title" id="export-title">
            1. Sao lưu dữ liệu ra tệp
          </h2>
          <p className="card__note">
            Ấn nút bên dưới để tải về một tệp JSON chứa toàn bộ hồ sơ học tập của bé. Tệp này
            giống như một bản gốc giấy tờ: nếu mất máy này, đây là thứ duy nhất giúp lấy lại
            dữ liệu.
          </p>
          <p className="card__note">
            <strong>Hãy cất tệp vào nơi chỉ người lớn trong nhà truy cập được</strong> — tệp
            chứa đầy đủ thành tích học tập của bé, kể cả tên bé đặt trong hồ sơ.
          </p>

          <div className="data-control__actions">
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={onExport}
              disabled={exportBusy}
            >
              {exportBusy ? "Đang tạo tệp…" : "Tải tệp sao lưu về máy"}
            </button>
          </div>

          {exportError ? (
            <p className="data-control__notice data-control__notice--error" role="alert">
              <span aria-hidden="true">✕ </span>
              {exportError}
            </p>
          ) : null}

          {exported ? (
            <div className="data-control__result" role="status" aria-live="polite">
              <h3 className="data-control__result-title">
                <span aria-hidden="true">✓ </span>Đã tạo tệp sao lưu
              </h3>
              <dl className="data-control__facts">
                <div className="data-control__fact">
                  <dt>Tên tệp</dt>
                  <dd className="data-control__value-break">{exported.fileName}</dd>
                </div>
                <div className="data-control__fact">
                  <dt>Kích thước</dt>
                  <dd>
                    {exported.bytes.toLocaleString("vi-VN")} byte
                  </dd>
                </div>
                <div className="data-control__fact">
                  <dt>Phiên bản định dạng</dt>
                  <dd>{exported.formatVersion}</dd>
                </div>
                <div className="data-control__fact">
                  <dt>Thời điểm tạo</dt>
                  <dd>{exportedAtLabel}</dd>
                </div>
              </dl>
              <p className="card__note">
                {exported.hasEvidence
                  ? "Tệp này có chứa kết quả học tập thật của bé."
                  : "Tệp này chưa có phiên học nào, nên chủ yếu là nội dung bài học."}
              </p>
              <h4 className="data-control__summary-title">Trong tệp có gì</h4>
              <ul className="data-control__counts">
                {exported.counts.map((row) => (
                  <li className="data-control__count" key={row.label}>
                    <span className="data-control__count-label">{row.label}</span>
                    <span className="data-control__count-value">{row.count}</span>
                  </li>
                ))}
              </ul>
              <p className="card__note">
                Đây là số liệu thật lấy từ tệp vừa tạo, không phải ước tính.
              </p>
            </div>
          ) : null}
        </section>

        {/* ── 2. Import ─────────────────────────────────────────────────── */}
        <section className="card data-control__section" aria-labelledby="import-title">
          <h2 className="card__title" id="import-title">
            2. Phục hồi từ tệp sao lưu
          </h2>
          <p className="card__note">
            Chọn một tệp sao lưu đã tải từ ứng dụng này. Ứng dụng sẽ tự đọc và kiểm tra tệp
            ngay trên máy phụ huynh trước khi gửi đi — nếu tệp có vấn đề, phụ huynh sẽ thấy
            đủ danh sách lỗi và <strong>chưa gửi gì cả</strong>.
          </p>
          <p className="card__note">
            Khi phục hồi, hồ sơ người học trong tệp sẽ thuộc về <strong>tài khoản phụ huynh
            đang đăng nhập</strong>. Ứng dụng <strong>không gộp</strong> và <strong>không ghi
            đè</strong> dữ liệu đang có: nếu máy này đã có hồ sơ người học, phụ huynh phải
            xóa hồ sơ hiện tại trước.
          </p>

          <div className="field">
            <label className="field__label" htmlFor="import-file">
              Chọn tệp sao lưu (định dạng JSON)
            </label>
            <p className="field__hint" id="import-file-hint">
              Chỉ nhận tệp JSON do ứng dụng này tạo ra. Đây là tệp văn bản thuần, mở được
              bằng trình soạn thảo đơn giản.
            </p>
            <input
              className="input data-control__file-input"
              id="import-file"
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              aria-describedby="import-file-hint"
              onChange={onPickFile}
            />
          </div>

          <div className="data-control__live">
            {importFileName && importProblems.length === 0 ? (
              <p
                className="data-control__notice data-control__notice--ok"
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">✓ </span>
                Đã đọc tệp <strong>{importFileName}</strong> và tệp có cấu trúc hợp lệ.
              </p>
            ) : null}

            {importProblems.length > 0 ? (
              <div
                className="data-control__notice data-control__notice--error data-control__problems"
                role="alert"
              >
                <h3 className="data-control__problems-title">
                  <span aria-hidden="true">✕ </span>Tệp này chưa dùng được ({importProblems.length}{" "}
                  vấn đề)
                </h3>
                <ul className="data-control__problem-list">
                  {importProblems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
                <p className="data-control__problems-foot">
                  Hãy chọn đúng tệp sao lưu rồi thử lại. Không có dữ liệu nào được gửi đi.
                </p>
              </div>
            ) : null}

            {importCounts.length > 0 ? (
              <div className="data-control__result" role="status">
                <h4 className="data-control__summary-title">Tệp sẽ đưa vào</h4>
                <ul className="data-control__counts">
                  {importCounts.map((row) => (
                    <li className="data-control__count" key={row.label}>
                      <span className="data-control__count-label">{row.label}</span>
                      <span className="data-control__count-value">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {importError ? (
              <p className="data-control__notice data-control__notice--error" role="alert">
                <span aria-hidden="true">✕ </span>
                {importError}
              </p>
            ) : null}

            {importResult ? (
              <div className="data-control__result" role="status">
                <h3 className="data-control__result-title">
                  <span aria-hidden="true">✓ </span>
                  {importResult.ok
                    ? "Đã phục hồi xong dữ liệu"
                    : "Máy chủ từ chối tệp này"}
                </h3>
                {Object.keys(importResult.counts).length > 0 ? (
                  <>
                    <h4 className="data-control__summary-title">Máy chủ đã ghi nhận</h4>
                    <ul className="data-control__counts">
                      {Object.entries(importResult.counts).map(([key, count]) => (
                        <li className="data-control__count" key={key}>
                          <span className="data-control__count-label">{collectionLabel(key)}</span>
                          <span className="data-control__count-value">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {importResult.errors.length > 0 ? (
                  <ul className="data-control__problem-list">
                    {importResult.errors.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {importResult.warnings.length > 0 ? (
                  <ul className="data-control__warning-list">
                    {importResult.warnings.map((item) => (
                      <li key={item}>
                        <span aria-hidden="true">▲ </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="data-control__actions">
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={onImport}
              disabled={importBusy || importProblems.length > 0 || !importReady}
            >
              {importBusy ? "Đang phục hồi…" : "Phục hồi dữ liệu từ tệp này"}
            </button>
          </div>
          <p className="card__note">
            Nút phục hồi chỉ bấm được sau khi tệp đã qua bước kiểm tra bên trên.
          </p>
        </section>

        {/* ── 3. Delete ─────────────────────────────────────────────────── */}
        <section
          className="card data-control__section data-control__section--danger"
          aria-labelledby="delete-title"
        >
          <h2 className="card__title" id="delete-title">
            3. Xóa toàn bộ dữ liệu của bé
          </h2>

          <div className="data-control__alert" role="alert">
            <h3 className="data-control__alert-title">
              <span aria-hidden="true">▲ </span>Cảnh báo: việc này không hoàn lại được
            </h3>
            <p>
              Xóa hồ sơ sẽ xóa sạch thành tích học tập của bé khỏi thiết bị này. Dữ liệu đã
              xóa <strong>không thể khôi phục bằng bất kỳ nút nào trong ứng dụng</strong>. Nếu
              chưa có bản sao lưu, hãy sao lưu ở mục 1 trước.
            </p>
            <p>
              Dữ liệu sẽ bị xóa:
            </p>
            <ul className="data-control__delete-list">
              {DELETE_ITEMS.map((item) => (
                <li key={item}>
                  <span className="data-control__delete-glyph" aria-hidden="true">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p>
              Chỉ có nhật ký ghi lại việc xóa này là được giữ lại, để chứng minh phụ huynh
              đã yêu cầu xóa. Bài học và nội dung môn học sẽ <strong>không</strong> bị xóa —
              đó là nội dung dùng chung cho mọi người học.
            </p>
          </div>

          {learner ? (
            <>
              <div className="field">
                <label className="field__label" htmlFor="delete-confirm">
                  Gõ chính xác câu xác nhận để mở khóa nút xóa
                </label>
                <p className="field__hint" id="delete-confirm-hint">
                  Câu cần gồm từ <code>XOA</code> (viết hoa), một dấu cách, rồi biệt danh của
                  bé trong hồ sơ. Biệt danh này là biệt danh phụ huynh đã đặt khi tạo hồ sơ.
                </p>
                <p className="data-control__phrase" id="delete-confirm-phrase">
                  Cần gõ: <code className="data-control__phrase-code">{requiredPhrase}</code>
                </p>
                <input
                  className="input"
                  id="delete-confirm"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={confirmText}
                  aria-describedby="delete-confirm-hint delete-confirm-phrase"
                  onChange={(event) => setConfirmText(event.target.value)}
                />
              </div>

              <div className="data-control__actions">
                <button
                  type="button"
                  className="btn btn--danger btn--large"
                  onClick={onDelete}
                  disabled={deleteBusy || !confirmMatches || deleted}
                >
                  {deleteBusy ? "Đang xóa…" : "Xóa vĩnh viễn hồ sơ người học"}
                </button>
              </div>
              {!confirmMatches ? (
                <p className="card__note">
                  Nút xóa sẽ hoạt động khi câu gõ vào khớp chính xác với câu xác nhận ở trên.
                </p>
              ) : null}
            </>
          ) : (
            <p className="data-control__notice data-control__notice--ok" role="status">
              Hiện chưa có hồ sơ người học nào trên máy này nên không có gì để xóa.
            </p>
          )}

          {deleteError ? (
            <p className="data-control__notice data-control__notice--error" role="alert">
              <span aria-hidden="true">✕ </span>
              {deleteError}
            </p>
          ) : null}

          {deleted ? (
            <div className="data-control__result" role="status" aria-live="polite">
              <h3 className="data-control__result-title">
                <span aria-hidden="true">✓ </span>Máy chủ đã xác nhận đã xóa
              </h3>
              <p>
                Hồ sơ người học và toàn bộ thành tích học tập đã được xóa khỏi thiết bị này.
                Việc này đã hoàn tất, không thể hoàn tác.
              </p>
              <p className="card__note">
                Hồ sơ người học sẽ không tự tạo lại. Phụ huynh có thể về trang tổng quan để xem
                lại tình trạng của tài khoản.
              </p>
              <div className="data-control__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => onNavigate("/parent")}
                >
                  Về trang tổng quan
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <p className="data-control__foot">
          Ứng dụng chỉ lấy và gửi dữ liệu cho chính máy chủ của phụ huynh — không gửi đi bất kỳ
          dịch vụ nào khác.
        </p>
      </div>
    </ProtectedScreen>
  );
}

/** A server collection key as Vietnamese, so an import report is readable. */
function collectionLabel(key: string): string {
  const found = COLLECTION_LABELS.find((entry) => entry.key === key);
  return found ? found.labelVi : key;
}
