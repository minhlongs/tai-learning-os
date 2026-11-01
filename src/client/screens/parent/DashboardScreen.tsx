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

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type {
  CorrectSkillRequest,
  CorrectSkillResponse,
  CreateGoalRequest,
  CreateGoalResponse,
  GoalStatus,
  ParentDashboardResponse,
  SchoolYearTransitionResponse,
  SetApprovalRequest,
  SetApprovalResponse,
  UpdateGoalStatusRequest,
  UpdateGoalStatusResponse,
} from "../../../shared/api-contract";
import { COMPETENCY_STATES, type CompetencyState } from "../../../shared/schemas/attempt";
import { readActiveLearnerId } from "../../lib/active-learner-store";
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
type Recommendation = ParentDashboardResponse["recommendedNextLessons"][number];
type SchoolYearRow = ParentDashboardResponse["schoolYears"][number];

const SUBJECT_LABELS: Record<string, string> = {
  math: "Toán",
  english: "Tiếng Anh",
  vietnamese: "Tiếng Việt",
  science: "Khoa học",
  debate: "Tư duy phản biện",
};

const RECOMMENDATION_KIND_LABELS: Record<Recommendation["recommendationKind"], string> = {
  unlocked_next: "Đã mở khóa",
  prerequisite_gap: "Bổ sung nền tảng",
  reinforce_supported: "Củng cố thêm",
};

const CLASS_NAMES: Record<Recommendation["recommendationKind"], string> = {
  unlocked_next: "pill--kind-unlocked",
  prerequisite_gap: "pill--kind-gap",
  reinforce_supported: "pill--kind-reinforce",
};

function subjectLabel(subjectId: string): string {
  return SUBJECT_LABELS[subjectId] ?? subjectId;
}

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
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(() => {
    const seq = ++requestSeqRef.current;
    const expectedLearnerId = session.learner?.id ?? readActiveLearnerId();
    void api.get<ParentDashboardResponse>(endpoints.parentDashboard).then((result) => {
      if (!mountedRef.current || requestSeqRef.current !== seq) return;
      const currentActive = readActiveLearnerId();
      if (expectedLearnerId && currentActive && currentActive !== expectedLearnerId) return;
      if (result.ok) {
        if (expectedLearnerId && result.value.learner?.id && result.value.learner.id !== expectedLearnerId) {
          return;
        }
        setData(result.value);
        setError(null);
      } else {
        setError(failureMessage(result.failure));
      }
      setLoading(false);
    });
  }, [session.learner?.id]);

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
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/curriculum")}>
              Chương trình học
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/baseline")}>
              Đánh giá đầu vào
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/lessons")}>
              Quản lý bài học
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent/planner")}>
              Kế hoạch 4 tuần
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

        {!loading && !error && data?.learner ? (
          <>
            <PrerequisiteRecommendations
              recommendations={data.recommendedNextLessons}
              learnerId={data.learner.id}
              onApproved={load}
            />

            <SchoolYearContinuitySection
              schoolYears={data.schoolYears}
              learnerId={data.learner.id}
              learnerGrade={data.learner.grade}
              activeSchoolYearLabel={data.learner.schoolYearLabel ?? null}
              onTransitioned={load}
            />

            <ParentGoalsSection
              goals={data.goals}
              learnerId={data.learner.id}
              onUpdated={load}
            />
          </>
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
  const [boundLearnerId, setBoundLearnerId] = useState<string | null>(learnerId);
  const [targetState, setTargetState] = useState<CompetencyState>("SUPPORTED");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openEditor = (row: SkillEvidence) => {
    setEditingSkillId(row.skillId);
    setBoundLearnerId(learnerId);
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
    const targetLearnerId = boundLearnerId ?? learnerId;
    if (!targetLearnerId) {
      setFormError("Không xác định được hồ sơ người học.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const body: CorrectSkillRequest = {
      skillId: row.skillId,
      state: targetState,
      note: note.trim(),
      learnerId: targetLearnerId,
    };
    void api.post<CorrectSkillResponse>(endpoints.correctSkill, body).then((res) => {
      if (readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
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

function PrerequisiteRecommendations({
  recommendations,
  learnerId,
  onApproved,
}: {
  recommendations: readonly Recommendation[];
  learnerId: string | null;
  onApproved: () => void;
}): React.JSX.Element {
  const [approvingLessonId, setApprovingLessonId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const handleQuickApprove = (rec: Recommendation) => {
    if (!rec.lessonId || !learnerId) return;
    setApprovingLessonId(rec.lessonId);
    setNotice(null);
    const body: SetApprovalRequest = {
      lessonId: rec.lessonId,
      status: "approved",
      learnerId,
      ...(rec.lessonVersion !== null && rec.lessonVersion !== undefined
        ? { version: rec.lessonVersion }
        : {}),
    };
    void api.post<SetApprovalResponse>(endpoints.setApproval, body).then((res) => {
      if (readActiveLearnerId() && readActiveLearnerId() !== learnerId) return;
      setApprovingLessonId(null);
      if (!res.ok) {
        setNotice({ tone: "error", text: failureMessage(res.failure) });
        return;
      }
      setNotice({
        tone: "ok",
        text: `Đã duyệt bài học “${rec.lessonTitleVi ?? rec.skillNameVi}” cho bé.`,
      });
      onApproved();
    });
  };

  return (
    <section
      className="card"
      aria-labelledby="prereq-rec-title"
      data-testid="prerequisite-recommendations"
    >
      <h2 className="card__title" id="prereq-rec-title">
        Gợi ý lộ trình theo kỹ năng tiên quyết
      </h2>
      <p className="dashboard-note">
        Hệ thống đối chiếu cây kỹ năng tiên quyết và bằng chứng hiện có để gợi ý
        bài học nền tảng hoặc bài học tiếp theo đã mở khóa. Phụ huynh giữ toàn
        quyền quyết định duyệt bài.
      </p>
      {notice ? (
        <p
          className={`data-control__notice data-control__notice--${notice.tone}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}
      {recommendations.length === 0 ? (
        <p className="dashboard-empty">
          Hiện chưa có gợi ý kỹ năng tiên quyết mới cần bổ sung.
        </p>
      ) : (
        <ul className="dashboard-sessions">
          {recommendations.map((rec) => (
            <li key={rec.skillId} data-testid={`prereq-rec-${rec.skillId}`}>
              <div className="dashboard-sessions__head">
                <div>
                  <strong>{rec.skillNameVi}</strong>{" "}
                  <span className="pill">{subjectLabel(rec.subjectId)}</span>{" "}
                  <span className={`pill ${CLASS_NAMES[rec.recommendationKind]}`}>
                    {RECOMMENDATION_KIND_LABELS[rec.recommendationKind]}
                  </span>
                </div>
                <div>
                  {rec.approvalStatus === "approved" ? (
                    <span
                      className="pill pill--status pill--status--completed"
                      data-testid={`prereq-approved-${rec.lessonId ?? rec.skillId}`}
                    >
                      Đã duyệt cho bé
                    </span>
                  ) : rec.lessonId ? (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      data-testid={`prereq-approve-${rec.lessonId}`}
                      disabled={approvingLessonId === rec.lessonId}
                      onClick={() => handleQuickApprove(rec)}
                    >
                      {approvingLessonId === rec.lessonId ? "Đang duyệt…" : "Duyệt ngay"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="dashboard-sessions__meta">
                <div>{rec.reasonVi}</div>
                {rec.lessonTitleVi ? (
                  <div>
                    Bài học gợi ý: <strong>{rec.lessonTitleVi}</strong>
                  </div>
                ) : null}
                {rec.prerequisiteNamesVi.length > 0 ? (
                  <div>Kỹ năng tiên quyết: {rec.prerequisiteNamesVi.join(", ")}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SchoolYearContinuitySection({
  schoolYears,
  learnerId,
  learnerGrade,
  activeSchoolYearLabel,
  onTransitioned,
}: {
  schoolYears: readonly SchoolYearRow[];
  learnerId: string | null;
  learnerGrade: number | null;
  activeSchoolYearLabel: string | null;
  onTransitioned: () => void;
}): React.JSX.Element {
  const [label, setLabel] = useState("2027-2028");
  const [gradeOverride, setGradeOverride] = useState<number | null>(null);
  const grade = gradeOverride ?? Math.min(12, (learnerGrade ?? 4) + 1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const handleTransition = (event: FormEvent) => {
    event.preventDefault();
    if (!learnerId) return;
    setBusy(true);
    setNotice(null);
    void api
      .post<SchoolYearTransitionResponse>(endpoints.schoolYears, {
        learnerId,
        label: label.trim(),
        grade,
      })
      .then((res) => {
        if (readActiveLearnerId() && readActiveLearnerId() !== learnerId) return;
        setBusy(false);
        if (!res.ok) {
          setNotice({ tone: "error", text: failureMessage(res.failure) });
          return;
        }
        setNotice({
          tone: "ok",
          text: `Đã chuyển sang năm học ${res.value.schoolYear.label} (Lớp ${res.value.schoolYear.grade ?? grade}). Toàn bộ lịch sử các năm học trước được giữ nguyên.`,
        });
        onTransitioned();
      });
  };

  return (
    <section
      className="card"
      aria-labelledby="school-year-title"
      data-testid="school-year-continuity-section"
    >
      <h2 className="card__title" id="school-year-title">
        Liên tục qua các năm học & chuyển lớp
      </h2>
      <p className="dashboard-note">
        Năm học hiện hành:{" "}
        <strong data-testid="active-school-year-label">
          {activeSchoolYearLabel ?? "Chưa thiết lập"}
        </strong>{" "}
        · Khối lớp hiện tại:{" "}
        <strong data-testid="active-learner-grade">Lớp {learnerGrade ?? 4}</strong>. Khi chuyển
        sang năm học mới, toàn bộ phiên học và bằng chứng kỹ năng của các năm trước vẫn được
        bảo toàn nguyên vẹn.
      </p>

      {schoolYears.length > 0 ? (
        <table className="dashboard-table" data-testid="school-year-history-table">
          <thead>
            <tr>
              <th scope="col">Năm học</th>
              <th scope="col">Khối lớp</th>
              <th scope="col">Thời gian</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Phiên học (hoàn thành)</th>
              <th scope="col">Lượt độc lập / Tổng lượt</th>
            </tr>
          </thead>
          <tbody>
            {schoolYears.map((sy) => (
              <tr key={sy.id} data-testid={`school-year-row-${sy.label}`}>
                <th scope="row">{sy.label}</th>
                <td>Lớp {sy.grade ?? "—"}</td>
                <td>
                  {sy.startsOn} → {sy.endsOn}
                </td>
                <td>
                  <span className={`pill ${sy.isActive ? "pill--status--completed" : ""}`}>
                    {sy.isActive ? "Đang học" : "Lưu trữ"}
                  </span>
                </td>
                <td className="dashboard-table__num">
                  {sy.sessionCount} ({sy.completedSessionCount})
                </td>
                <td className="dashboard-table__num">
                  {sy.independentAttemptCount} / {sy.attemptCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="dashboard-empty">Chưa có niên khóa nào được lưu trữ.</p>
      )}

      <form
        onSubmit={handleTransition}
        data-testid="school-year-transition-form"
        style={{
          marginTop: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label className="field__label" htmlFor="school-year-label-input">
            Năm học mới
          </label>
          <input
            id="school-year-label-input"
            data-testid="school-year-label-input"
            className="input"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="2027-2028"
            disabled={busy}
          />
        </div>
        <div>
          <label className="field__label" htmlFor="school-year-grade-input">
            Khối lớp mới
          </label>
          <select
            id="school-year-grade-input"
            data-testid="school-year-grade-input"
            className="select"
            value={grade}
            onChange={(e) => setGradeOverride(Number(e.target.value))}
            disabled={busy}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
              <option key={g} value={g}>
                Lớp {g}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn btn--secondary"
          data-testid="school-year-transition-submit"
          disabled={busy || !learnerId}
        >
          {busy ? "Đang chuyển năm học…" : "Chuyển năm học & lưu trữ"}
        </button>
      </form>
      {notice ? (
        <p
          className={`data-control__notice data-control__notice--${notice.tone}`}
          data-testid="school-year-transition-notice"
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}
    </section>
  );
}

const GOAL_STATUS_OPTIONS: readonly GoalStatus[] = ["active", "paused", "achieved", "retired"];

function ParentGoalsSection({
  goals,
  learnerId,
  onUpdated,
}: {
  goals: ParentDashboardResponse["goals"];
  learnerId: string | null;
  onUpdated: () => void;
}): React.JSX.Element {
  const [titleVi, setTitleVi] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const handleCreateGoal = (event: FormEvent) => {
    event.preventDefault();
    if (!learnerId) return;
    if (!titleVi.trim()) {
      setNotice({ tone: "error", text: "Vui lòng nhập nội dung mục tiêu học tập." });
      return;
    }
    setCreating(true);
    setNotice(null);
    const body: CreateGoalRequest = {
      learnerId,
      titleVi: titleVi.trim(),
      subjectId: subjectId || null,
      targetDate: targetDate.trim() || null,
      note: note.trim() || null,
    };
    void api.post<CreateGoalResponse>(endpoints.parentGoals, body).then((res) => {
      if (readActiveLearnerId() && readActiveLearnerId() !== learnerId) return;
      setCreating(false);
      if (!res.ok) {
        setNotice({ tone: "error", text: failureMessage(res.failure) });
        return;
      }
      setTitleVi("");
      setSubjectId("");
      setTargetDate("");
      setNote("");
      setNotice({
        tone: "ok",
        text: `Đã thêm mục tiêu “${res.value.goal.titleVi}”.`,
      });
      onUpdated();
    });
  };

  const handleStatusChange = (goalId: string, status: GoalStatus) => {
    if (!learnerId) return;
    setUpdatingGoalId(goalId);
    setNotice(null);
    const body: UpdateGoalStatusRequest = {
      learnerId,
      goalId,
      status,
    };
    void api.patch<UpdateGoalStatusResponse>(endpoints.parentGoals, body).then((res) => {
      if (readActiveLearnerId() && readActiveLearnerId() !== learnerId) return;
      setUpdatingGoalId(null);
      if (!res.ok) {
        setNotice({ tone: "error", text: failureMessage(res.failure) });
        return;
      }
      setNotice({
        tone: "ok",
        text: `Đã cập nhật trạng thái mục tiêu “${res.value.goal.titleVi}” sang ${GOAL_LABELS[status]}.`,
      });
      onUpdated();
    });
  };

  return (
    <section
      className="card"
      aria-labelledby="goals-title"
      data-testid="parent-goals-section"
    >
      <h2 className="card__title" id="goals-title">
        Mục tiêu phụ huynh đặt ra
      </h2>
      <p className="dashboard-note">
        Mục tiêu do gia đình đặt ra để định hướng đồng hành cùng con, hoàn toàn tách biệt với bằng chứng năng lực thực tế.
      </p>

      {notice ? (
        <p
          className={`data-control__notice data-control__notice--${notice.tone}`}
          data-testid="parent-goals-notice"
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}

      {goals.length === 0 ? (
        <p className="dashboard-empty" data-testid="parent-goals-empty">
          Chưa có mục tiêu nào được đặt cho bé.
        </p>
      ) : (
        <ul className="dashboard-goals" data-testid="parent-goals-list">
          {goals.map((goal) => (
            <li
              key={goal.id}
              data-testid={`parent-goal-item-${goal.id}`}
              style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                <span className={`pill pill--goal pill--goal--${goal.status}`}>
                  {GOAL_LABELS[goal.status]}
                </span>
                {goal.subjectId ? (
                  <span className="pill">{subjectLabel(goal.subjectId)}</span>
                ) : null}
                <strong>{goal.titleVi}</strong>
                {goal.targetDate ? (
                  <span className="dashboard-sessions__meta">(Dự kiến: {goal.targetDate})</span>
                ) : null}
                {goal.note ? (
                  <span className="dashboard-sessions__meta">— {goal.note}</span>
                ) : null}
              </div>
              <div>
                <label className="sr-only" htmlFor={`goal-status-${goal.id}`}>
                  Trạng thái mục tiêu {goal.titleVi}
                </label>
                <select
                  id={`goal-status-${goal.id}`}
                  data-testid={`goal-status-select-${goal.id}`}
                  className="select"
                  value={goal.status}
                  disabled={updatingGoalId === goal.id}
                  onChange={(e) => handleStatusChange(goal.id, e.target.value as GoalStatus)}
                >
                  {GOAL_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {GOAL_LABELS[st]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleCreateGoal}
        data-testid="create-goal-form"
        style={{
          marginTop: "1rem",
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          alignItems: "end",
        }}
      >
        <div>
          <label className="field__label" htmlFor="goal-title-input">
            Mục tiêu mới
          </label>
          <input
            id="goal-title-input"
            data-testid="goal-title-input"
            className="input"
            type="text"
            value={titleVi}
            onChange={(e) => setTitleVi(e.target.value)}
            placeholder="Ví dụ: Tự tóm tắt ý chính đoạn văn lớp 4"
            disabled={creating}
          />
        </div>
        <div>
          <label className="field__label" htmlFor="goal-subject-select">
            Môn học (tùy chọn)
          </label>
          <select
            id="goal-subject-select"
            data-testid="goal-subject-select"
            className="select"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={creating}
          >
            <option value="">Chung các môn</option>
            {Object.entries(SUBJECT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field__label" htmlFor="goal-target-date-input">
            Ngày dự kiến (YYYY-MM-DD)
          </label>
          <input
            id="goal-target-date-input"
            data-testid="goal-target-date-input"
            className="input"
            type="text"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            placeholder="2026-12-31"
            disabled={creating}
          />
        </div>
        <div>
          <label className="field__label" htmlFor="goal-note-input">
            Ghi chú của ba mẹ
          </label>
          <input
            id="goal-note-input"
            data-testid="goal-note-input"
            className="input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ôn nhẹ nhàng 3 buổi/tuần"
            disabled={creating}
          />
        </div>
        <div>
          <button
            type="submit"
            className="btn btn--secondary"
            data-testid="create-goal-submit"
            disabled={creating || !learnerId}
          >
            {creating ? "Đang lưu…" : "Thêm mục tiêu"}
          </button>
        </div>
      </form>
    </section>
  );
}

