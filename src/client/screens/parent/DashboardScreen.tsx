/**
 * Parent dashboard.
 *
 * The screen answers "what did my child actually do, and what needs a decision
 * from me?" — and refuses to answer a question the record cannot support. Four
 * rules hold it to that:
 *
 *  1. AN EMPTY LEARNER IS SHOWN EMPTY. `emptyState` from the server decides
 *     this, not a client-side guess at "zero sessions means empty". Nothing is
 *     pre-filled with a placeholder learner or a suggestive row.
 *
 *  2. STATE COMES FROM STORED EVIDENCE. Every competency cell renders a state
 *     the server derived from stored attempts, with its reason. The parent can
 *     disagree with it; they cannot accidentally read it as a measurement of
 *     the child.
 *
 *  3. COUNTS ARE NOT SCORES. Two counts sit side by side — independent and
 *     assisted — and neither is turned into a percentage, an average, a rank or
 *     a trend line. Help used is shown, not hidden.
 *
 *  4. WHAT NEEDS A PARENT IS SAID PLAINLY. Skills past the failure threshold
 *     and lessons awaiting a decision are listed with the reason, so the
 *     dashboard points at a decision rather than implying a verdict.
 */

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type {
  CorrectSkillRequest,
  CorrectSkillResponse,
  ParentDashboardResponse,
} from "../../../shared/api-contract";
import { COMPETENCY_STATES, type CompetencyState } from "../../../shared/schemas/attempt";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import {
  competencyClass,
  competencyGlyph,
  competencyLabel,
  formatDate,
  formatDaysUntil,
} from "../../lib/format";
import "../../styles/dashboard.css";

type SkillEvidence = ParentDashboardResponse["skillEvidence"][number];
type ReviewEntry = ParentDashboardResponse["reviewQueue"][number];
type SessionRow = ParentDashboardResponse["recentSessions"][number];

export function DashboardScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [data, setData] = useState<ParentDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** Captured once per load so the review wording cannot change mid-view. */
  const [nowMs] = useState(() => Date.now());

  const load = useCallback(() => {
    void api.get<ParentDashboardResponse>(endpoints.parentDashboard).then((result) => {
      if (result.ok) {
        setData(result.value);
        setError(null);
      } else {
        setError(failureMessage(result.failure));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header__title">Bảng theo dõi</h1>
            <p className="dashboard-header__lede">
              Đây là những gì đã được ghi nhận từ các phiên học thật. Mỗi con số
              đều đến từ dữ liệu đã lưu, không có điểm hay xếp hạng.
            </p>
          </div>
          <nav className="dashboard-header__nav" aria-label="Khu vực phụ huynh">
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/lessons")}>
              Quản lý bài học
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/data")}>
              Dữ liệu của bé
            </button>
          </nav>
        </header>

        {loading ? <LoadingPanel what="bảng theo dõi" /> : null}

        {!loading && error ? <ErrorPanel message={error} onRetry={load} /> : null}

        {!loading && !error && data?.emptyState ? (
          <EmptyPanel title="Chưa có dữ liệu nào được ghi nhận">
            <p>
              Khi bé hoàn thành một bài học đã được duyệt, kết quả sẽ xuất hiện
              tại đây. Cho đến lúc đó, bảng này để trống thay vì đoán.
            </p>
            <div className="state-panel__action">
              <button
                type="button"
                className="btn btn--large"
                onClick={() => onNavigate("/parent/lessons")}
              >
                Duyệt bài học cho bé
              </button>
            </div>
          </EmptyPanel>
        ) : null}

        {!loading && !error && data && !data.emptyState ? (
          <>
            <section className="card" aria-labelledby="stats-title">
              <h2 className="card__title" id="stats-title">
                {data.learner?.nickname ?? "Người học"} — tổng quan ghi nhận
              </h2>
              <dl className="dashboard-stats">
                <Stat label="Số phiên đã học" value={data.stats.sessionCount} />
                <Stat label="Số lần làm độc lập được" value={data.stats.independentAttempts} />
                <Stat label="Số lần cần gợi ý mức 3 trở lên" value={data.stats.assistedAttempts} />
                <Stat label="Số kỹ năng đã quan sát được" value={data.stats.skillsObserved} />
                <Stat label="Số kỹ năng làm độc lập được" value={data.stats.skillsIndependent} />
                <Stat
                  label="Phiên gần nhất"
                  value={data.stats.lastSessionAt === null ? "Chưa có" : formatDate(data.stats.lastSessionAt)}
                />
              </dl>
              <p className="dashboard-note">
                Hai số “làm độc lập” và “cần gợi ý” được giữ riêng và không cộng
                thành điểm. Số lần cần gợi ý là thông tin, không phải lỗi.
              </p>
            </section>

            <ReviewQueue queue={data.reviewQueue} nowMs={nowMs} />

            {data.needsAttention.length > 0 ? (
              <section className="card" aria-labelledby="attention-title">
                <h2 className="card__title" id="attention-title">
                  Cần quyết định của phụ huynh
                </h2>
                <ul className="dashboard-attention">
                  {data.needsAttention.map((item) => (
                    <li key={item.skillId}>
                      <strong>{item.skillNameVi}</strong>
                      <span className="dashboard-attention__reason">{item.reasonVi}</span>
                    </li>
                  ))}
                </ul>
                <p className="dashboard-note">
                  Kỹ năng liên tục chưa đạt cần phụ huynh xem lại, không nên để
                  hệ thống tự ép bé làm lại.
                </p>
              </section>
            ) : null}

            <SkillTable
              rows={data.skillEvidence}
              learnerId={data.learner?.id ?? null}
              onCorrected={load}
            />

            <RecentSessions rows={data.recentSessions} />

            {data.goals.length > 0 ? (
              <section className="card" aria-labelledby="goals-title">
                <h2 className="card__title" id="goals-title">
                  Mục tiêu phụ huynh đặt ra
                </h2>
                <ul className="dashboard-goals">
                  {data.goals.map((goal) => (
                    <li key={goal.id}>
                      <span className={`pill pill--goal pill--goal--${goal.status}`}>
                        {GOAL_LABELS[goal.status]}
                      </span>
                      <span>{goal.titleVi}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}

/* ── sections ──────────────────────────────────────────────────────────────── */

const GOAL_LABELS: Record<ParentDashboardResponse["goals"][number]["status"], string> = {
  active: "Đang thực hiện",
  paused: "Tạm dừng",
  achieved: "Đã đạt",
  retired: "Đã bỏ",
};

function Stat({ label, value }: { label: string; value: number | string }): React.JSX.Element {
  return (
    <div className="dashboard-stats__item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReviewQueue({
  queue,
  nowMs,
}: {
  queue: readonly ReviewEntry[];
  nowMs: number;
}): React.JSX.Element {
  return (
    <section className="card" aria-labelledby="review-title">
      <h2 className="card__title" id="review-title">
        Đến hạn ôn tập
      </h2>
      {queue.length === 0 ? (
        <p className="dashboard-empty">
          Hiện không có kỹ năng nào đến hạn ôn.
        </p>
      ) : (
        <ul className="dashboard-review">
          {queue.map((entry) => (
            <li key={entry.skillId}>
              <div className="dashboard-review__head">
                <strong>{entry.skillNameVi}</strong>
                <span className="pill pill--due">{formatDaysUntil(entry.dueAt, nowMs)}</span>
              </div>
              <span className="dashboard-review__meta">
                Chu kỳ hiện tại: {entry.intervalDays} ngày.{" "}
                {entry.failureStreak > 0
                  ? `Vừa trả lời chưa đúng ${entry.failureStreak} lần liền.`
                  : "Không có lần chưa đạt liền trước đó."}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SkillTable({
  rows,
  learnerId,
  onCorrected,
}: {
  rows: readonly SkillEvidence[];
  learnerId: string | null;
  onCorrected: () => void;
}): React.JSX.Element {
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [targetState, setTargetState] = useState<CompetencyState>("SUPPORTED");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openEditor = (row: SkillEvidence) => {
    setEditingSkillId(row.skillId);
    setTargetState(row.state);
    setNote("");
    setFormError(null);
    setNotice(null);
  };

  const handleSubmit = (event: FormEvent, row: SkillEvidence) => {
    event.preventDefault();
    if (!note.trim()) {
      setFormError("Vui lòng ghi lý do điều chỉnh.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const body: CorrectSkillRequest = {
      skillId: row.skillId,
      state: targetState,
      note: note.trim(),
      learnerId: learnerId ?? undefined,
    };
    void api.post<CorrectSkillResponse>(endpoints.correctSkill, body).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setFormError(failureMessage(res.failure));
        return;
      }
      setEditingSkillId(null);
      setNote("");
      setNotice(`Đã ghi nhận điều chỉnh cho kỹ năng “${row.skillNameVi}”.`);
      onCorrected();
    });
  };

  return (
    <section className="card" aria-labelledby="skills-title">
      <h2 className="card__title" id="skills-title">
        Bằng chứng theo kỹ năng
      </h2>
      {notice ? (
        <p className="data-control__notice data-control__notice--ok" role="status">
          {notice}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="dashboard-empty">
          Chưa có kỹ năng nào được ghi nhận. Danh sách này chỉ hiện kỹ năng đã
          có lượt trả lời được lưu.
        </p>
      ) : (
        <table className="dashboard-table">
          <caption className="dashboard-table__caption">
            Trạng thái được suy ra từ các lượt trả lời đã lưu. Phụ huynh có thể
            sửa lại từng kỹ năng nếu nhận thấy ghi nhận chưa đúng.
          </caption>
          <thead>
            <tr>
              <th scope="col">Kỹ năng</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Làm độc lập</th>
              <th scope="col">Cần gợi ý</th>
              <th scope="col">Cập nhật</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.skillId}>
                <th scope="row">
                  <div>{row.skillNameVi}</div>
                  {row.reasonVi ? <div className="row__meta">{row.reasonVi}</div> : null}
                </th>
                <td>
                  <span className={`pill pill--state ${competencyClass(row.state)}`}>
                    <span aria-hidden="true">{competencyGlyph(row.state)}</span>
                    {competencyLabel(row.state)}
                  </span>
                </td>
                <td className="dashboard-table__num">{row.independentCount}</td>
                <td className="dashboard-table__num">{row.assistedCount}</td>
                <td>{formatDate(row.updatedAt)}</td>
                <td>
                  {editingSkillId === row.skillId ? (
                    <form
                      onSubmit={(e) => handleSubmit(e, row)}
                      data-testid={`skill-correction-form-${row.skillId}`}
                      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                    >
                      <label className="field__label" htmlFor={`state-${row.skillId}`}>
                        Mức năng lực
                      </label>
                      <select
                        id={`state-${row.skillId}`}
                        className="select"
                        value={targetState}
                        onChange={(e) => setTargetState(e.target.value as CompetencyState)}
                        disabled={busy}
                      >
                        {COMPETENCY_STATES.map((st) => (
                          <option key={st} value={st}>
                            {competencyLabel(st)}
                          </option>
                        ))}
                      </select>
                      <label className="field__label" htmlFor={`note-${row.skillId}`}>
                        Lý do điều chỉnh
                      </label>
                      <input
                        id={`note-${row.skillId}`}
                        className="input"
                        type="text"
                        placeholder="Ví dụ: Đã kiểm tra trực tiếp trên giấy"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={busy}
                      />
                      {formError ? (
                        <p className="data-control__notice data-control__notice--error" role="alert">
                          {formError}
                        </p>
                      ) : null}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button type="submit" className="btn btn--primary" disabled={busy}>
                          {busy ? "Đang lưu…" : "Lưu điều chỉnh"}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={busy}
                          onClick={() => setEditingSkillId(null)}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      data-testid={`correct-skill-${row.skillId}`}
                      onClick={() => openEditor(row)}
                    >
                      Điều chỉnh
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function RecentSessions({ rows }: { rows: readonly SessionRow[] }): React.JSX.Element {
  return (
    <section className="card" aria-labelledby="sessions-title">
      <h2 className="card__title" id="sessions-title">
        Các phiên học gần đây
      </h2>
      {rows.length === 0 ? (
        <p className="dashboard-empty">Chưa có phiên học nào.</p>
      ) : (
        <ul className="dashboard-sessions">
          {rows.map((row) => (
            <li key={row.sessionId}>
              <div className="dashboard-sessions__head">
                <strong>{row.lessonTitleVi}</strong>
                <span className={`pill pill--status pill--status--${row.status}`}>
                  {SESSION_LABELS[row.status]}
                </span>
              </div>
              <span className="dashboard-sessions__meta">
                {formatDate(row.startedAt)} · Làm {row.attemptedCount} câu, đúng{" "}
                {row.correctCount}, tự làm được {row.independentCount}.
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const SESSION_LABELS: Record<SessionRow["status"], string> = {
  in_progress: "Đang học",
  completed: "Đã xong",
  abandoned: "Thoát giữa chừng",
};
