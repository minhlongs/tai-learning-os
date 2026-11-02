/**
 * Parent Four-Week Learning Planner screen.
 *
 * Visualizes the 4-week learning roadmap for the learner across weeks and days.
 * Highlights:
 *   - TODAY (hôm nay)
 *   - UPCOMING (sắp tới)
 *   - REVIEW DUE (đến hạn ôn tập ngắt quãng)
 *   - COMPLETED (đã hoàn thành)
 *   - NEEDS PARENT REVIEW (cần phụ huynh xem xét)
 *
 * Allows the parent to:
 *   - Deterministically generate / regenerate the 4-week plan from curriculum & evidence
 *   - Mark items as completed, skipped, or rescheduled
 *   - Add parent notes to any scheduled item
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type {
  PlannerGetResponse,
  LearningPlanItemDto,
  SchedulePracticePlanItemRequest,
  UpdatePlanItemRequest,
} from "../../../shared/api-contract";
import { readActiveLearnerId } from "../../lib/active-learner-store";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

const STATUS_LABELS: Record<LearningPlanItemDto["status"], string> = {
  scheduled: "Đã xếp lịch",
  completed: "Đã hoàn thành",
  skipped: "Bỏ qua",
  rescheduled: "Dời lịch",
};

const KIND_LABELS: Record<string, string> = {
  lesson: "Bài học mới",
  review: "Ôn tập ngắt quãng",
  baseline: "Quan sát đầu vào",
  practice: "Luyện tập gia đình",
};

export function FourWeekPlannerScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [data, setData] = useState<PlannerGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [schedulingPractice, setSchedulingPractice] = useState(false);
  const [practiceLessonId, setPracticeLessonId] = useState("");
  const [practiceWeekIndex, setPracticeWeekIndex] = useState<number>(1);
  const [practiceDayOfWeek, setPracticeDayOfWeek] = useState<number>(1);
  const [practiceNote, setPracticeNote] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPlan = useCallback(() => {
    const seq = ++requestSeqRef.current;
    const expectedLearnerId = session.learner?.id ?? readActiveLearnerId();
    void api.get<PlannerGetResponse>(endpoints.planner).then((result) => {
      if (!mountedRef.current || requestSeqRef.current !== seq) return;
      const currentActive = readActiveLearnerId();
      if (expectedLearnerId && currentActive && currentActive !== expectedLearnerId) return;
      setLoading(false);
      if (!result.ok) {
        setError(failureMessage(result.failure));
        return;
      }
      if (expectedLearnerId && result.value.learnerId && result.value.learnerId !== expectedLearnerId) {
        return;
      }
      setData(result.value);
      setError(null);
    });
  }, [session.learner?.id]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleGenerate = () => {
    const targetLearnerId = data?.learnerId ?? session.learner?.id ?? readActiveLearnerId();
    setGenerating(true);
    setNote(null);
    void api
      .post<PlannerGetResponse>(endpoints.generatePlan, {
        learnerId: targetLearnerId ?? undefined,
      })
      .then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setGenerating(false);
        if (!result.ok) {
          setNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setNote({
          tone: "ok",
          text: `Đã lập kế hoạch 4 tuần với ${result.value.items.length} buổi học dự kiến.`,
        });
        loadPlan();
      });
  };

  const handleUpdateStatus = (
    itemId: string,
    newStatus: LearningPlanItemDto["status"],
    parentNote?: string | null,
  ) => {
    const targetLearnerId = data?.learnerId ?? session.learner?.id ?? readActiveLearnerId();
    setUpdatingId(itemId);
    const body: UpdatePlanItemRequest = {
      learnerId: targetLearnerId ?? undefined,
      itemId,
      status: newStatus,
      parentNote: parentNote === undefined ? undefined : parentNote,
    };
    void api
      .patch<PlannerGetResponse>(endpoints.updatePlanItem, body)
      .then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setUpdatingId(null);
        if (!result.ok) {
          setNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setNote({ tone: "ok", text: "Đã cập nhật trạng thái buổi học." });
        loadPlan();
      });
  };

  const handleSchedulePractice = (event: FormEvent) => {
    event.preventDefault();
    if (!practiceLessonId) {
      setNote({ tone: "error", text: "Vui lòng chọn một bản luyện tập gia đình để xếp lịch." });
      return;
    }
    const targetLearnerId = data?.learnerId ?? session.learner?.id ?? readActiveLearnerId();
    setSchedulingPractice(true);
    setNote(null);
    const body: SchedulePracticePlanItemRequest = {
      learnerId: targetLearnerId ?? undefined,
      lessonId: practiceLessonId,
      weekIndex: practiceWeekIndex,
      dayOfWeek: practiceDayOfWeek,
      parentNote: practiceNote.trim() || null,
    };
    void api
      .post<PlannerGetResponse>(endpoints.schedulePracticePlanItem, body)
      .then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setSchedulingPractice(false);
        if (!result.ok) {
          setNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setPracticeNote("");
        setSelectedWeek(practiceWeekIndex);
        setData(result.value);
        setNote({
          tone: "ok",
          text: `Đã xếp lịch luyện tập gia đình vào Tuần ${practiceWeekIndex} (${DAY_LABELS[practiceDayOfWeek] ?? `Thứ ${practiceDayOfWeek}`}).`,
        });
      });
  };

  const items = data?.items ?? [];
  const availablePracticeLessons = data?.availablePracticeLessons ?? [];
  const weekItems = items.filter((item) => item.weekIndex === selectedWeek);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="dashboard">
        <header className="dashboard__header">
          <h1 className="page__title">Kế hoạch học tập 4 tuần của Tài</h1>
          <p className="page__lede">
            Kế hoạch phân bổ tự động dựa trên chương trình của khối lớp, các lỗ hổng kỹ năng tiên
            quyết, và chu kỳ ôn tập ngắt quãng (Spaced Retrieval). Mỗi buổi giới hạn ~20 phút, không
            quá tải. Phụ huynh có toàn quyền dời lịch, đánh dấu xong hoặc bỏ qua.
          </p>
        </header>

        {loading ? <LoadingPanel what="kế hoạch 4 tuần" /> : null}
        {error ? <ErrorPanel message={error} onRetry={loadPlan} /> : null}

        {note ? (
          <p
            role="status"
            className={note.tone === "ok" ? "pill pill--correct" : "pill pill--attention"}
          >
            {note.text}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
          <button
            type="button"
            className="btn btn--primary"
            disabled={generating}
            onClick={handleGenerate}
            data-testid="generate-plan-btn"
          >
            {generating ? "Đang phân tích & lập kế hoạch…" : "Tạo / Cập nhật lại kế hoạch 4 tuần"}
          </button>
        </div>

        {data ? (
          <section
            className="card"
            aria-labelledby="schedule-practice-title"
            data-testid="schedule-practice-section"
            style={{ marginBottom: "1rem" }}
          >
            <h2 className="card__title" id="schedule-practice-title">
              Giao bài luyện tập gia đình vào kế hoạch 4 tuần
            </h2>
            <p className="card__note">
              Bài luyện tập gia đình do phụ huynh tự tạo không tính vào bằng chứng tự làm độc lập (INDEPENDENT) và vẫn được giữ nguyên khi cập nhật lại kế hoạch 4 tuần tự động.
            </p>
            {availablePracticeLessons.length === 0 ? (
              <p className="card__note" data-testid="no-practice-lessons-note">
                Chưa có bản luyện tập gia đình nào. Hãy tạo bản luyện tập riêng trong phần{" "}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onNavigate("/parent/lessons")}
                >
                  Quản lý bài học
                </button>
                .
              </p>
            ) : (
              <form
                onSubmit={handleSchedulePractice}
                data-testid="schedule-practice-form"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  alignItems: "flex-end",
                  marginTop: "0.5rem",
                }}
              >
                <div>
                  <label className="field__label" htmlFor="practice-lesson-select">
                    Bài luyện tập gia đình
                  </label>
                  <select
                    id="practice-lesson-select"
                    data-testid="practice-lesson-select"
                    className="select"
                    value={practiceLessonId}
                    onChange={(e) => setPracticeLessonId(e.target.value)}
                    disabled={schedulingPractice}
                  >
                    <option value="">— Chọn bài luyện tập —</option>
                    {availablePracticeLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.titleVi} ({lesson.subjectId.toUpperCase()} · v{lesson.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field__label" htmlFor="practice-week-select">
                    Tuần
                  </label>
                  <select
                    id="practice-week-select"
                    data-testid="practice-week-select"
                    className="select"
                    value={practiceWeekIndex}
                    onChange={(e) => setPracticeWeekIndex(Number(e.target.value))}
                    disabled={schedulingPractice}
                  >
                    {[1, 2, 3, 4].map((wk) => (
                      <option key={wk} value={wk}>
                        Tuần {wk}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field__label" htmlFor="practice-day-select">
                    Thứ trong tuần
                  </label>
                  <select
                    id="practice-day-select"
                    data-testid="practice-day-select"
                    className="select"
                    value={practiceDayOfWeek}
                    onChange={(e) => setPracticeDayOfWeek(Number(e.target.value))}
                    disabled={schedulingPractice}
                  >
                    {Object.entries(DAY_LABELS).map(([day, label]) => (
                      <option key={day} value={day}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field__label" htmlFor="practice-note-input">
                    Ghi chú (tùy chọn)
                  </label>
                  <input
                    id="practice-note-input"
                    data-testid="practice-note-input"
                    className="input"
                    type="text"
                    value={practiceNote}
                    onChange={(e) => setPracticeNote(e.target.value)}
                    placeholder="VD: Ôn nhẹ cuối tuần"
                    disabled={schedulingPractice}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--secondary"
                  data-testid="schedule-practice-submit"
                  disabled={schedulingPractice}
                >
                  {schedulingPractice ? "Đang xếp lịch…" : "Xếp lịch luyện tập"}
                </button>
              </form>
            )}
          </section>
        ) : null}

        {data && items.length === 0 ? (
          <EmptyPanel title="Chưa có kế hoạch nào được lập">
            <p>
              Nhấn nút &ldquo;Tạo / Cập nhật lại kế hoạch 4 tuần&rdquo; ở trên để hệ thống quét dữ liệu
              chương trình và bằng chứng hiện có để lập lộ trình cho Tài.
            </p>
          </EmptyPanel>
        ) : null}

        {data && items.length > 0 ? (
          <>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              {[1, 2, 3, 4].map((wk) => {
                const count = items.filter((it) => it.weekIndex === wk).length;
                return (
                  <button
                    key={wk}
                    type="button"
                    className={selectedWeek === wk ? "btn btn--primary" : "btn btn--secondary"}
                    onClick={() => setSelectedWeek(wk)}
                  >
                    Tuần {wk} ({count} buổi)
                  </button>
                );
              })}
            </div>

            <section className="card" aria-labelledby="week-plan-title">
              <h2 className="card__title" id="week-plan-title">
                Chi tiết Tuần {selectedWeek}
              </h2>
              {weekItems.length === 0 ? (
                <p className="card__note">Tuần này chưa có buổi học nào được xếp.</p>
              ) : (
                <ul className="rows">
                  {weekItems.map((item) => {
                    const isToday = item.scheduledDate === todayStr;
                    const isReview = item.itemKind === "review";
                    const isUpdating = updatingId === item.id;

                    return (
                      <li key={item.id} className="row" data-testid={`plan-item-${item.id}`}>
                        <div className="row__main">
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span className="row__title">
                              {DAY_LABELS[item.dayOfWeek] ?? `Thứ ${item.dayOfWeek}`}
                              {item.scheduledDate ? ` (${item.scheduledDate})` : ""}
                            </span>
                            {isToday ? (
                              <span className="pill pill--attention">HÔM NAY (TODAY)</span>
                            ) : null}
                            <span
                              className={
                                isReview ? "pill pill--attention" : "pill pill--correct"
                              }
                            >
                              {KIND_LABELS[item.itemKind] ?? item.itemKind}
                            </span>
                            <span className="pill">{item.subjectId.toUpperCase()}</span>
                            <span className="pill">{item.durationMinutes} phút</span>
                            <span className="pill">{STATUS_LABELS[item.status]}</span>
                            {item.itemKind === "practice" || item.purpose === "practice" ? (
                              <span
                                className="pill pill--attention"
                                data-testid={`plan-item-practice-badge-${item.id}`}
                              >
                                Luyện tập gia đình · Không tính độc lập
                              </span>
                            ) : null}
                          </div>
                          {item.lessonTitleVi ? (
                            <p className="row__meta" style={{ marginTop: "0.25rem" }}>
                              <strong>Bài học:</strong> {item.lessonTitleVi}
                            </p>
                          ) : null}
                          <p className="row__meta" style={{ marginTop: "0.25rem" }}>
                            <strong>Lý do xếp:</strong> {item.reasonVi}
                          </p>
                          {item.parentNote ? (
                            <p className="row__meta" style={{ fontStyle: "italic" }}>
                              Ghi chú của phụ huynh: {item.parentNote}
                            </p>
                          ) : null}
                        </div>

                        <div className="row__aside" style={{ display: "flex", gap: "0.25rem" }}>
                          {item.status !== "completed" ? (
                            <button
                              type="button"
                              className="btn btn--secondary"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(item.id, "completed")}
                            >
                              Đã xong
                            </button>
                          ) : null}
                          {item.status !== "skipped" ? (
                            <button
                              type="button"
                              className="btn btn--secondary"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(item.id, "skipped")}
                            >
                              Bỏ qua
                            </button>
                          ) : null}
                          {item.status !== "rescheduled" ? (
                            <button
                              type="button"
                              className="btn btn--secondary"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(item.id, "rescheduled")}
                            >
                              Dời lịch
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        ) : null}

        <p className="card__note" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onNavigate("/parent/curriculum")}
          >
            ← Cấu hình chương trình
          </button>{" "}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onNavigate("/parent/baseline")}
          >
            ← Đánh giá đầu vào
          </button>{" "}
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent")}>
            Về trang tổng quan
          </button>
        </p>
      </div>
    </ProtectedScreen>
  );
}
