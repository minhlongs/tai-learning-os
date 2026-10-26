/**
 * Parent Baseline Assessment screen.
 *
 * Lets the parent trigger or inspect the non-punitive diagnostic baseline
 * assessment for Math, Vietnamese reading comprehension, and English.
 *
 * The diagnostic reports strictly:
 *   - What was observed independently
 *   - What was supported by hints or multiple attempts
 *   - Which skills need additional observations
 *   - Suggested starting lessons
 *   - Whether parent review is required
 *
 * It never assigns an IQ score, rank, percentage, or permanent deficit label.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  BaselineGetResponse,
  BaselineAssessmentDto,
} from "../../../shared/api-contract";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { ErrorPanel, LoadingPanel } from "../../components/ScreenState";

const SUBJECTS = [
  { id: "math", nameVi: "Toán học — Phân số, phép tính & quy tắc dấu ngoặc" },
  { id: "vietnamese", nameVi: "Tiếng Việt — Đọc hiểu ý chính, chi tiết & dẫn chứng" },
  { id: "english", nameVi: "Tiếng Anh — Từ vựng theo ngữ cảnh & mẫu câu cơ bản" },
] as const;

export function BaselineAssessmentScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [assessments, setAssessments] = useState<readonly BaselineAssessmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySubject, setBusySubject] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const loadBaseline = useCallback(() => {
    void api.get<BaselineGetResponse>(endpoints.baselineAssessments).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(failureMessage(result.failure));
        return;
      }
      setAssessments(result.value.assessments);
      setError(null);
    });
  }, []);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  const evaluateSubject = (subjectId: string) => {
    setBusySubject(subjectId);
    setNote(null);
    void api
      .post<{ ok: true; assessment: BaselineAssessmentDto }>(endpoints.baselineAssessments, {
        subjectId,
      })
      .then((result) => {
        setBusySubject(null);
        if (!result.ok) {
          setNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setNote({
          tone: "ok",
          text: `Đã tổng hợp báo cáo quan sát đầu vào cho môn ${subjectId}.`,
        });
        loadBaseline();
      });
  };

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="dashboard">
        <header className="dashboard__header">
          <h1 className="page__title">Đánh giá đầu vào (Baseline Diagnostic)</h1>
          <p className="page__lede">
            Tổng hợp bằng chứng quan sát đầu vào từ các bài học của Tài cho 3 môn (Toán, Tiếng Việt,
            Tiếng Anh). Báo cáo này không chấm điểm hay xếp loại, mà chỉ rõ những gì đã quan sát
            được độc lập, những gì cần gợi ý hỗ trợ, kỹ năng nào cần thêm quan sát, và gợi ý bài học
            bắt đầu phù hợp.
          </p>
        </header>

        {loading ? <LoadingPanel what="báo cáo đánh giá đầu vào" /> : null}
        {error ? <ErrorPanel message={error} onRetry={loadBaseline} /> : null}

        {note ? (
          <p
            role="status"
            className={note.tone === "ok" ? "pill pill--correct" : "pill pill--attention"}
          >
            {note.text}
          </p>
        ) : null}

        <div style={{ display: "grid", gap: "1rem" }}>
          {SUBJECTS.map((subj) => {
            const latest = assessments.find((a) => a.subjectId === subj.id);
            const busy = busySubject === subj.id;
            return (
              <section
                key={subj.id}
                className="card"
                aria-labelledby={`baseline-title-${subj.id}`}
                data-testid={`baseline-card-${subj.id}`}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <h2 className="card__title" id={`baseline-title-${subj.id}`}>
                    {subj.nameVi}
                  </h2>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy}
                    onClick={() => evaluateSubject(subj.id)}
                    data-testid={`evaluate-baseline-${subj.id}`}
                  >
                    {busy ? "Đang tổng hợp…" : "Tổng hợp / Cập nhật quan sát đầu vào"}
                  </button>
                </div>

                {!latest ? (
                  <p className="card__note">
                    Chưa chạy tổng hợp đánh giá đầu vào cho môn này. Nhấn nút trên để phân tích từ
                    các lần làm bài thực tế của Tài.
                  </p>
                ) : (
                  <dl className="summary-facts" style={{ marginTop: "0.75rem" }}>
                    <div className="summary-facts__row">
                      <dt className="summary-facts__label">Quan sát độc lập</dt>
                      <dd className="summary-facts__value">
                        {latest.observedSummaryVi ?? "Chưa có dữ liệu"}
                      </dd>
                    </div>
                    <div className="summary-facts__row">
                      <dt className="summary-facts__label">Có hỗ trợ / gợi ý</dt>
                      <dd className="summary-facts__value">
                        {latest.supportedSummaryVi ?? "Chưa có dữ liệu"}
                      </dd>
                    </div>
                    <div className="summary-facts__row">
                      <dt className="summary-facts__label">Kỹ năng cần thêm quan sát</dt>
                      <dd className="summary-facts__value">
                        {latest.needsObservation.length > 0
                          ? latest.needsObservation.join(", ")
                          : "Đã có quan sát bước đầu cho các kỹ năng trong môn"}
                      </dd>
                    </div>
                    <div className="summary-facts__row">
                      <dt className="summary-facts__label">Bài học khởi đầu gợi ý</dt>
                      <dd className="summary-facts__value">
                        {latest.suggestedLessons.length > 0
                          ? latest.suggestedLessons.join(", ")
                          : "Không có bài chờ"}
                      </dd>
                    </div>
                    <div className="summary-facts__row">
                      <dt className="summary-facts__label">Cần phụ huynh xem xét</dt>
                      <dd className="summary-facts__value">
                        {latest.parentReviewRequired ? (
                          <span className="pill pill--attention">Cần phụ huynh xem xét</span>
                        ) : (
                          <span className="pill pill--correct">Ổn định</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              </section>
            );
          })}
        </div>

        <p className="card__note" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onNavigate("/parent/planner")}
          >
            Tạo / Xem Kế hoạch học tập 4 tuần →
          </button>{" "}
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent")}>
            Về trang tổng quan
          </button>
        </p>
      </div>
    </ProtectedScreen>
  );
}
