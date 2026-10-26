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

import { useCallback, useEffect, useState } from "react";
import type {
  PlannerGetResponse,
  LearningPlanItemDto,
  UpdatePlanItemRequest,
} from "../../../shared/api-contract";
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const loadPlan = useCallback(() => {
    void api.get<PlannerGetResponse>(endpoints.planner).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(failureMessage(result.failure));
        return;
      }
      setData(result.value);
      setError(null);
    });
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleGenerate = () => {
    setGenerating(true);
    setNote(null);
    void api
      .post<PlannerGetResponse>(endpoints.generatePlan, {})
      .then((result) => {
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
    setUpdatingId(itemId);
    const body: UpdatePlanItemRequest = {
      itemId,
      status: newStatus,
      parentNote: parentNote === undefined ? undefined : parentNote,
    };
    void api
      .patch<PlannerGetResponse>(endpoints.updatePlanItem, body)
      .then((result) => {
        setUpdatingId(null);
        if (!result.ok) {
          setNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setNote({ tone: "ok", text: "Đã cập nhật trạng thái buổi học." });
        loadPlan();
      });
  };

  const items = data?.items ?? [];
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
                          </div>
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
