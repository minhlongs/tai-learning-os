/**
 * The end-of-lesson summary.
 *
 * This is the product's most important integrity surface: it is the one screen
 * whose whole job is to say what actually happened. Four rules hold it to that
 * promise, and they are stated here because a future change could quietly break
 * any of them:
 *
 *  1. NOTHING IS REWARDED. No points, stars, XP, badges, percentage, rank,
 *     streak, confetti or celebration animation appears here. Every number is a
 *     count the server persisted, and no count is turned into a nicer number.
 *
 *  2. HELP IS VISIBLE. `assistedCount` and `maxHelpLevel` are always rendered,
 *     including when they are zero. The summary never hides that help was used.
 *
 *  3. COUNTS ARE NOT FRACTIONS. `stepsCompleted` counts distinct steps. The
 *     client is never told the lesson's total step count, so this screen must
 *     not render it as "3/10" or as any implied share of a whole.
 *
 *  4. NOTHING IS CLAIMED ABOUT ABILITY. The screen records ("đã ghi nhận") and
 *     never asserts mastery.
 */

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { FinalizeSessionResponse, SessionSummary } from "../../../shared/api-contract";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/session-context";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import { formatDate, formatDaysUntil } from "../../lib/format";
import "../../styles/session-summary.css";

/**
 * What the screen is showing. Exactly one phase is active at a time, so the
 * loading, error and summary panels can never appear together.
 */
type SummaryState =
  | { phase: "loading" }
  | { phase: "failed"; message: string }
  | { phase: "ready"; summary: SessionSummary; status: FinalizeSessionResponse["status"] };

/** Session ids whose finalize POST the browser has already issued.
 *
 * Module-level on purpose: React StrictMode double-invokes effects in
 * development, and the effect runs again whenever the route is revisited. Both
 * would otherwise ask the server to finalize the same session twice. The
 * server's own guard makes a second call harmless, but it is still a wasted
 * request, so it is prevented here. */
const finalizeIssued = new Set<string>();

/** A summary already returned, so returning to a finished session shows the
 * same numbers instead of asking the server again. */
type StoredSummary = { summary: SessionSummary; status: FinalizeSessionResponse["status"] };

const summaryCache = new Map<string, StoredSummary>();

export function SessionSummaryScreen({
  sessionId,
  onNavigate,
}: {
  sessionId: string;
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  // Seeded from the module-level cache: returning to an already-finished session
  // shows the same numbers immediately, with no request and no flash of a
  // spinner. Deriving the initial state from an external source is React's own
  // recommended pattern, and it keeps the effect free of synchronous setState.
  const [state, setState] = useState<SummaryState>(() => {
    const cached = summaryCache.get(sessionId);
    return cached
      ? { phase: "ready", summary: cached.summary, status: cached.status }
      : { phase: "loading" };
  });
  /** Captured once, so the relative review phrase cannot change mid-view. */
  const [nowMs] = useState(() => Date.now());
  const [feeling, setFeeling] = useState<
    "confident" | "good" | "neutral" | "confused" | "tired"
  >("good");
  const [reflectionNote, setReflectionNote] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflected, setReflected] = useState(false);

  const submitReflection = useCallback(() => {
    setSavingReflection(true);
    void api
      .post<{ ok: true; reflectionId: string }>(endpoints.reflectSession, {
        sessionId,
        feeling,
        noteVi: reflectionNote.trim() || null,
      })
      .then((result) => {
        setSavingReflection(false);
        if (result.ok) {
          setReflected(true);
        }
      });
  }, [feeling, reflectionNote, sessionId]);

  /**
   * Send the one finalize request this screen can make.
   *
   * Two module-level guards, both keyed by session id:
   *
   *  - `finalizeIssued` marks a request as sent BEFORE it resolves, because the
   *    duplicate we are defending against happens while the first is still in
   *    flight. A failed request releases the mark so a retry is possible.
   *  - `summaryCache` makes a route revisit render from memory instead of
   *    asking again.
   *
   * No unmount guard: React ignores state updates on a component that is gone,
   * and a result that lands after a route change is still cached for the return
   * visit. That cache is what makes the missing unmount guard safe.
   */
  const requestSummary = useCallback((): void => {
    if (finalizeIssued.has(sessionId)) return;
    finalizeIssued.add(sessionId);
    void api
      .post<FinalizeSessionResponse>(endpoints.finalizeSession, { sessionId })
      .then((result) => {
        if (result.ok) {
          const stored = { summary: result.value.summary, status: result.value.status };
          summaryCache.set(sessionId, stored);
          setState({ phase: "ready", summary: stored.summary, status: stored.status });
          return;
        }
        finalizeIssued.delete(sessionId);
        setState({ phase: "failed", message: failureMessage(result.failure) });
      });
  }, [sessionId]);

  /**
   * Finalize, or render a cached result if there is one.
   *
   * This is what the error panel's retry button calls. It is separate from the
   * effect below only because the cache hit is a synchronous setState, which
   * React's cascading-render rule disallows inside an effect body.
   */
  const finalize = useCallback((): void => {
    const cached = summaryCache.get(sessionId);
    if (cached) {
      setState({ phase: "ready", summary: cached.summary, status: cached.status });
      return;
    }
    requestSummary();
  }, [requestSummary, sessionId]);

  // The mount request. Deliberately NOT routed through `finalize`: this effect
  // must not run a synchronous setState before a response arrives. The same
  // module-level guard still prevents StrictMode's double-invoke from sending
  // two finalize posts.
  useEffect(() => {
    if (summaryCache.has(sessionId)) return;
    requestSummary();
  }, [requestSummary, sessionId]);

  /** Browser back when there is history to return to, the learner home if not. */
  const goBack = useCallback((): void => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    onNavigate("/");
  }, [onNavigate]);

  return (
    <ProtectedScreen area="learner" session={session}>
      <div className="summary-page">
        <header className="summary-header">
          <h1 className="summary-header__title">Kết quả bài học</h1>
          <p className="summary-header__lede">
            Dưới đây là những gì đã xảy ra trong bài học vừa rồi, ghi nhận đúng
            như vậy.
          </p>
          {state.phase === "ready" ? (
            <p className="summary-header__status">
              Trạng thái phiên học: {statusLabel(state.status)}
              {state.summary.purpose === "practice" ? (
                <>
                  {" · "}
                  <span
                    className="pill pill--attention"
                    data-testid="summary-practice-badge"
                  >
                    Luyện tập gia đình · Không tính vào bằng chứng tự làm độc lập
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </header>

        {state.phase === "loading" ? <LoadingPanel what="kết quả bài học" /> : null}

        {state.phase === "failed" ? (
          <ErrorPanel message={state.message} onRetry={finalize} />
        ) : null}

        {state.phase === "ready" ? (
          <>
            <section className="card" aria-labelledby="counts-title">
              <h2 className="card__title" id="counts-title">
                Số liệu bài học
              </h2>
              <dl className="summary-facts">
                <Fact label="Số câu đã làm" value={state.summary.attemptedCount} />
                <Fact
                  label="Số câu làm đúng"
                  value={
                    <span className="pill pill--correct">
                      <span aria-hidden="true">✓</span>
                      {state.summary.correctCount}
                    </span>
                  }
                />
                <Fact
                  label="Số câu chưa làm đúng"
                  value={
                    <span className="pill pill--incorrect">
                      <span aria-hidden="true">✗</span>
                      {notCorrect(state.summary)}
                    </span>
                  }
                  note="Gồm cả câu trả lời sai và câu trả lời đúng một phần."
                />
                <Fact
                  label="Số lần cần gợi ý mức 3 trở lên"
                  value={
                    <span className="pill pill--attention">
                      <span aria-hidden="true">!</span>
                      {state.summary.assistedCount}
                    </span>
                  }
                />
                <Fact
                  label="Mức gợi ý cao nhất đã dùng"
                  value={state.summary.maxHelpLevel}
                  note={
                    state.summary.maxHelpLevel === 0
                      ? "Mức 0 nghĩa là bài học này chưa có gợi ý nào được dùng."
                      : "Mức gợi ý cao nhất trong các bước đã làm."
                  }
                />
                <Fact
                  label="Số bước đã hoàn thành"
                  value={state.summary.stepsCompleted}
                  note="Đây là số bước riêng biệt đã trả lời đúng ít nhất một lần, không phải tổng số bước của bài học."
                />
              </dl>
            </section>

            <section aria-labelledby="skills-title">
              <h2 className="section-title" id="skills-title">
                Kỹ năng đã luyện ({state.summary.skillsPracticed.length})
              </h2>
              {state.summary.skillsPracticed.length > 0 ? (
                <ul className="rows">
                  {state.summary.skillsPracticed.map((skill) => (
                    <li key={skill.skillId} className="row">
                      <span className="row__main">
                        <span className="row__title">{skill.skillNameVi}</span>
                        <br />
                        <span className="row__meta">Mã môn: {skill.subjectId}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyPanel title="Chưa có kỹ năng nào được ghi nhận">
                  <p>
                    Trong bài học này chưa có bài tập nào gắn với kỹ năng. Danh
                    sách trống có nghĩa là chưa có dữ liệu — màn hình này không
                    tự thêm kỹ năng vào.
                  </p>
                </EmptyPanel>
              )}
            </section>

            <section aria-labelledby="review-title">
              <h2 className="section-title" id="review-title">
                Lịch ôn tập tiếp theo ({state.summary.nextReview.length})
              </h2>
              {state.summary.nextReview.length > 0 ? (
                <ul className="rows">
                  {state.summary.nextReview.map((entry) => {
                    const overdue = entry.dueAt <= nowMs;
                    return (
                      <li key={entry.skillId} className="row">
                        <span className="row__main">
                          <span className="row__title">{entry.skillNameVi}</span>
                          <br />
                          <span className="row__meta">
                            {entry.reasonVi} · Chu kỳ {entry.intervalDays} ngày ·
                            Đến hạn {formatDate(entry.dueAt)}
                          </span>
                        </span>
                        <span className="row__aside">
                          <span className={overdue ? "pill pill--attention" : "pill"}>
                            <span aria-hidden="true">{overdue ? "!" : "↻"}</span>
                            {formatDaysUntil(entry.dueAt, nowMs)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="summary-note">
                  Chưa có kỹ năng nào được xếp lịch ôn lại sau bài học này.
                </p>
              )}
            </section>

            <section className="card" aria-labelledby="reflection-title">
              <h2 className="card__title" id="reflection-title">
                Cảm xúc của em sau buổi học này
              </h2>
              {reflected ? (
                <p className="pill pill--correct">Cảm ơn em! Hệ thống đã ghi nhận cảm nhận của em.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <p className="card__note">Em cảm thấy thế nào sau khi làm xong bài học này?</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { key: "confident", label: "Tự tin" },
                      { key: "good", label: "Hài lòng" },
                      { key: "neutral", label: "Bình thường" },
                      { key: "confused", label: "Hơi bối rối" },
                      { key: "tired", label: "Hơi mệt" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={
                          feeling === f.key ? "btn btn--primary" : "btn btn--secondary"
                        }
                        onClick={() => setFeeling(f.key as "confident" | "good" | "neutral" | "confused" | "tired")}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <input
                      type="text"
                      className="input"
                      value={reflectionNote}
                      onChange={(e) => setReflectionNote(e.target.value)}
                      placeholder="Em có điều gì muốn chia sẻ thêm không? (không bắt buộc)"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={savingReflection}
                      onClick={submitReflection}
                    >
                      {savingReflection ? "Đang gửi…" : "Gửi cảm nhận"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="card card--muted" aria-labelledby="stopping-title">
              <h3 className="card__title" id="stopping-title">
                Điểm dừng tự nhiên cho ngày hôm nay
              </h3>
              <p className="card__note">
                Em đã hoàn thành bài học hôm nay rất tập trung. Não bộ cần thời gian nghỉ ngơi và ngủ ngon để củng cố các liên kết kiến thức vừa học. Giờ là lúc thích hợp để đứng dậy vận động hoặc nghỉ ngơi nhé!
              </p>
            </section>

            <nav className="summary-actions" aria-label="Sau khi xem kết quả">
              <button
                type="button"
                className="btn btn--primary btn--large"
                onClick={() => onNavigate("/")}
              >
                Về trang học tập
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--large"
                onClick={goBack}
              >
                ← Quay lại
              </button>
            </nav>

            <section className="card card--muted" aria-labelledby="honesty-title">
              <h3 className="card__title" id="honesty-title">
                Màn hình này không có điểm số
              </h3>
              <p className="card__note">
                Không có điểm, sao, huy hiệu hay bảng xếp hạng ở đây. Nếu em cần
                gợi ý trong bài, điều đó vẫn được ghi nhận thẳng thắn — toàn bộ
                màn hình này chỉ là bản ghi những gì đã xảy ra.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}

/**
 * One labelled count. The label and the number are separate elements so a
 * screen reader reads "Số câu đã làm: 12" rather than a bare figure.
 */
function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}): React.JSX.Element {
  return (
    <div className="summary-facts__row">
      <dt className="summary-facts__label">{label}</dt>
      <dd className="summary-facts__value">
        {value}
        {note ? <span className="summary-facts__note">{note}</span> : null}
      </dd>
    </div>
  );
}

/**
 * The session's own status, in the server's words. `abandoned` is stated
 * plainly: a learner who left early still gets the honest record, not a
 * congratulation.
 */
function statusLabel(status: FinalizeSessionResponse["status"]): string {
  switch (status) {
    case "in_progress":
      return "đang học (chưa kết thúc)";
    case "completed":
      return "đã hoàn thành";
    case "abandoned":
      return "đã thoát giữa chừng";
  }
}

/**
 * Attempts that did not end correct. Derived from two server counts rather than
 * reported by the server, so it is floored at zero: a bad count must never
 * render as a negative number of wrong answers.
 */
function notCorrect(summary: SessionSummary): number {
  return Math.max(0, summary.attemptedCount - summary.correctCount);
}
