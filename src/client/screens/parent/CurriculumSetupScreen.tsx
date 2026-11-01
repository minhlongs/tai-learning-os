/**
 * Parent Curriculum Setup screen.
 *
 * Allows the parent to configure the school year, grade, textbook series
 * (`UNKNOWN` when not yet provided), current unit, current lesson, weekly
 * session cadence, session duration, material reference, and provenance label
 * per subject. Also displays the explicit GDPT 2018 curriculum objectives
 * registered for the grade.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CurriculumGetResponse,
  ProvenanceType,
  UpsertCurriculumIntakeRequest,
} from "../../../shared/api-contract";
import { readActiveLearnerId } from "../../lib/active-learner-store";
import { api, failureMessage } from "../../lib/api";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { ErrorPanel, LoadingPanel } from "../../components/ScreenState";

const SUBJECTS = [
  { id: "math", nameVi: "Toán học" },
  { id: "vietnamese", nameVi: "Tiếng Việt" },
  { id: "english", nameVi: "Tiếng Anh" },
  { id: "science", nameVi: "Khoa học" },
  { id: "debate", nameVi: "Tư duy phản biện" },
] as const;

const PROVENANCE_LABELS: Record<ProvenanceType, string> = {
  gdpt_2018_objective: "Mục tiêu Chương trình GDPT 2018",
  parent_textbook: "Tài liệu / Sách giáo khoa do phụ huynh cung cấp",
  original_supplemental: "Bài tập bổ trợ nguyên bản",
  unverified_assumption: "Giả định chưa xác minh",
};

export function CurriculumSetupScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const [data, setData] = useState<CurriculumGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("math");
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [schoolYearLabel, setSchoolYearLabel] = useState("2026-2027");
  const [grade, setGrade] = useState(4);
  const [textbookSeries, setTextbookSeries] = useState("UNKNOWN");
  const [currentUnit, setCurrentUnit] = useState("UNKNOWN");
  const [currentLesson, setCurrentLesson] = useState("UNKNOWN");
  const [weeklySessions, setWeeklySessions] = useState(3);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(20);
  const [materialReference, setMaterialReference] = useState("");
  const [learningGoalsVi, setLearningGoalsVi] = useState("");
  const [provenance, setProvenance] = useState<ProvenanceType>("unverified_assumption");
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncFormForSubject = useCallback(
    (payload: CurriculumGetResponse, subjectId: string) => {
      const existing =
        payload.intakes.find(
          (row) => row.subjectId === subjectId && row.schoolYearLabel === payload.schoolYearLabel,
        ) ?? payload.intakes.find((row) => row.subjectId === subjectId);
      if (existing) {
        setSchoolYearLabel(existing.schoolYearLabel);
        setGrade(existing.grade);
        setTextbookSeries(existing.textbookSeries);
        setCurrentUnit(existing.currentUnit);
        setCurrentLesson(existing.currentLesson);
        setWeeklySessions(existing.weeklySessions);
        setSessionDurationMinutes(existing.sessionDurationMinutes);
        setMaterialReference(existing.materialReference ?? "");
        setLearningGoalsVi(existing.learningGoalsVi ?? "");
        setProvenance(existing.provenance);
      } else {
        setSchoolYearLabel(payload.schoolYearLabel || "2026-2027");
        setGrade(payload.grade || 4);
        setTextbookSeries("UNKNOWN");
        setCurrentUnit("UNKNOWN");
        setCurrentLesson("UNKNOWN");
        setWeeklySessions(3);
        setSessionDurationMinutes(20);
        setMaterialReference("");
        setLearningGoalsVi("");
        setProvenance("unverified_assumption");
      }
    },
    [],
  );

  const loadCurriculum = useCallback(() => {
    const seq = ++requestSeqRef.current;
    const expectedLearnerId = session.learner?.id ?? readActiveLearnerId();
    void api.get<CurriculumGetResponse>(endpoints.curriculum).then((result) => {
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
      syncFormForSubject(result.value, selectedSubject);
    });
  }, [selectedSubject, session.learner?.id, syncFormForSubject]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setStatusNote(null);
    if (data) {
      syncFormForSubject(data, subjectId);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const targetLearnerId = data?.learnerId ?? session.learner?.id ?? readActiveLearnerId();
    setSaving(true);
    setStatusNote(null);
    const body: UpsertCurriculumIntakeRequest = {
      learnerId: targetLearnerId ?? undefined,
      schoolYearLabel: schoolYearLabel.trim() || "2026-2027",
      grade,
      subjectId: selectedSubject,
      textbookSeries: textbookSeries.trim() || "UNKNOWN",
      currentUnit: currentUnit.trim() || "UNKNOWN",
      currentLesson: currentLesson.trim() || "UNKNOWN",
      weeklySessions,
      sessionDurationMinutes,
      materialReference: materialReference.trim() || null,
      learningGoalsVi: learningGoalsVi.trim() || null,
      provenance,
    };
    void api
      .post<{ ok: true; intakeId: string }>(endpoints.curriculum, body)
      .then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setSaving(false);
        if (!result.ok) {
          setStatusNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        setStatusNote({
          tone: "ok",
          text: "Đã lưu thiết lập chương trình học của phụ huynh.",
        });
        loadCurriculum();
      });
  };

  const objectivesForSubject = (data?.objectives ?? []).filter(
    (obj) => obj.subjectId === selectedSubject,
  );

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="dashboard">
        <header className="dashboard__header">
          <h1 className="page__title">Chương trình học &amp; Sách giáo khoa</h1>
          <p className="page__lede">
            Thiết lập năm học, khối lớp, bộ sách giáo khoa và bài đang học trên lớp của Tài. Khi chưa
            rõ bộ sách hoặc bài hiện tại, hệ thống ghi nhận rõ là <code>UNKNOWN</code> và không tự suy
            đoán.
          </p>
        </header>

        {loading ? <LoadingPanel what="thiết lập chương trình học" /> : null}
        {error ? <ErrorPanel message={error} onRetry={loadCurriculum} /> : null}

        {data ? (
          <>
            <section className="card" aria-labelledby="subject-tabs-title">
              <h2 className="card__title" id="subject-tabs-title">
                Chọn môn học để cấu hình
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {SUBJECTS.map((subj) => (
                  <button
                    key={subj.id}
                    type="button"
                    className={
                      selectedSubject === subj.id ? "btn btn--primary" : "btn btn--secondary"
                    }
                    onClick={() => handleSelectSubject(subj.id)}
                    data-testid={`curriculum-subject-${subj.id}`}
                  >
                    {subj.nameVi}
                  </button>
                ))}
              </div>

              {statusNote ? (
                <p
                  role="status"
                  className={statusNote.tone === "ok" ? "pill pill--correct" : "pill pill--attention"}
                >
                  {statusNote.text}
                </p>
              ) : null}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <label htmlFor="curriculum-school-year">
                    <strong>Năm học</strong>
                  </label>
                  <input
                    id="curriculum-school-year"
                    className="input"
                    type="text"
                    value={schoolYearLabel}
                    onChange={(e) => setSchoolYearLabel(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="curriculum-grade">
                    <strong>Khối lớp (1–12)</strong>
                  </label>
                  <input
                    id="curriculum-grade"
                    className="input"
                    type="number"
                    min={1}
                    max={12}
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) || 4)}
                  />
                </div>

                <div>
                  <label htmlFor="curriculum-textbook">
                    <strong>Bộ sách giáo khoa (giữ UNKNOWN nếu chưa xác nhận)</strong>
                  </label>
                  <input
                    id="curriculum-textbook"
                    className="input"
                    type="text"
                    value={textbookSeries}
                    onChange={(e) => setTextbookSeries(e.target.value)}
                    placeholder="UNKNOWN / Kết nối tri thức / Chân trời sáng tạo / Cánh diều"
                  />
                </div>

                <div>
                  <label htmlFor="curriculum-unit">
                    <strong>Chủ đề / Chương đang học trên lớp</strong>
                  </label>
                  <input
                    id="curriculum-unit"
                    className="input"
                    type="text"
                    value={currentUnit}
                    onChange={(e) => setCurrentUnit(e.target.value)}
                    placeholder="UNKNOWN"
                  />
                </div>

                <div>
                  <label htmlFor="curriculum-lesson">
                    <strong>Bài học hiện tại trên lớp</strong>
                  </label>
                  <input
                    id="curriculum-lesson"
                    className="input"
                    type="text"
                    value={currentLesson}
                    onChange={(e) => setCurrentLesson(e.target.value)}
                    placeholder="UNKNOWN"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label htmlFor="curriculum-weekly-sessions">
                      <strong>Số buổi học mỗi tuần (1–7)</strong>
                    </label>
                    <input
                      id="curriculum-weekly-sessions"
                      className="input"
                      type="number"
                      min={1}
                      max={7}
                      value={weeklySessions}
                      onChange={(e) => setWeeklySessions(Number(e.target.value) || 3)}
                    />
                  </div>
                  <div>
                    <label htmlFor="curriculum-duration">
                      <strong>Thời lượng mỗi buổi (phút, 10–60)</strong>
                    </label>
                    <input
                      id="curriculum-duration"
                      className="input"
                      type="number"
                      min={10}
                      max={60}
                      value={sessionDurationMinutes}
                      onChange={(e) => setSessionDurationMinutes(Number(e.target.value) || 20)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="curriculum-provenance">
                    <strong>Nguồn xác thực chương trình (Provenance)</strong>
                  </label>
                  <select
                    id="curriculum-provenance"
                    className="input"
                    value={provenance}
                    onChange={(e) => setProvenance(e.target.value as ProvenanceType)}
                  >
                    {(Object.keys(PROVENANCE_LABELS) as ProvenanceType[]).map((key) => (
                      <option key={key} value={key}>
                        {PROVENANCE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="curriculum-goals">
                    <strong>Mục tiêu ưu tiên của phụ huynh</strong>
                  </label>
                  <textarea
                    id="curriculum-goals"
                    className="input"
                    rows={2}
                    value={learningGoalsVi}
                    onChange={(e) => setLearningGoalsVi(e.target.value)}
                    placeholder="Ví dụ: Củng cố cộng trừ phân số và đọc hiểu tìm dẫn chứng."
                  />
                </div>

                <div>
                  <label htmlFor="curriculum-reference">
                    <strong>Ghi chú tài liệu tham khảo (tùy chọn)</strong>
                  </label>
                  <input
                    id="curriculum-reference"
                    className="input"
                    type="text"
                    value={materialReference}
                    onChange={(e) => setMaterialReference(e.target.value)}
                    placeholder="Ví dụ: Phiếu bài tập tuần 5 của cô giáo"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={saving}
                    data-testid="save-curriculum-btn"
                  >
                    {saving ? "Đang lưu…" : "Lưu thiết lập chương trình"}
                  </button>
                </div>
              </form>
            </section>

            <section className="card" aria-labelledby="objectives-title">
              <h2 className="card__title" id="objectives-title">
                Mục tiêu chương trình GDPT 2018 đã đăng ký ({objectivesForSubject.length})
              </h2>
              <ul className="rows">
                {objectivesForSubject.map((obj) => (
                  <li key={obj.id} className="row">
                    <div className="row__main">
                      <span className="row__title">
                        [{obj.code}] {obj.titleVi}
                      </span>
                      <p className="row__meta">{obj.descriptionVi}</p>
                      <span className="pill">
                        Nguồn: {PROVENANCE_LABELS[obj.provenance]}
                        {obj.sourceRef ? ` · ${obj.sourceRef}` : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <p className="card__note">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => onNavigate("/parent/baseline")}
              >
                Sang Đánh giá đầu vào →
              </button>{" "}
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => onNavigate("/parent/planner")}
              >
                Sang Kế hoạch 4 tuần →
              </button>
            </p>
          </>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}
