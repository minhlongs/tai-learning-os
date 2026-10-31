/**
 * Parent lesson manager.
 *
 * This is the gate between stored content and the learner mode. The learner
 * screens only ever list lessons whose approval row says `approved`, so this
 * screen's job is to show the parent the true status of every lesson and let
 * them decide it.
 *
 * Two properties are load-bearing and the UI is built around them:
 *
 *   1. `pendingReapproval` means content changed AFTER an approval, so that
 *      approval is stale. It is flagged with words, not colour alone —
 *      a washed-out green pill is exactly the wrong signal for "this approval
 *      no longer describes the lesson".
 *   2. The detail response is the only place the answer key is ever returned.
 *      It is labelled as parent-only every time it renders.
 *
 * Approving is one click. Refusing is two, inline, because refusing is the
 * decision that removes a lesson from the learner's day.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClassroomLessonListResponse,
  GrantLearnerConsentRequest,
  GrantLearnerConsentResponse,
  LearnerConsentListResponse,
  LessonListResponse,
  LessonDetailResponse,
  RevokeLearnerConsentRequest,
  RevokeLearnerConsentResponse,
  SetApprovalRequest,
  SetApprovalResponse,
} from "../../../shared/api-contract";
import type { ApprovalStatus } from "../../../shared/schemas/attempt";
import { readActiveLearnerId } from "../../lib/active-learner-store";
import { api, failureMessage } from "../../lib/api";
import { useSessionContext } from "../../lib/SessionProvider";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import { endpoints } from "../../lib/endpoints";
import "../../styles/lesson-manager.css";

/** One row of the list, taken from the contract rather than restated. */
type LessonRow = LessonListResponse["lessons"][number];
type ConsentRow = LearnerConsentListResponse["consents"][number];
type ClassroomLessonRow = ClassroomLessonListResponse["lessons"][number];

/**
 * The Vietnamese label for each real `ApprovalStatus` member.
 *
 * A `Record` here proves exhaustiveness: adding a member to the union in
 * `schemas/attempt.ts` breaks this file until it is labelled, rather than
 * silently rendering an unlabelled status.
 */
const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "Chưa duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const STATUS_TONES: Record<ApprovalStatus, string> = {
  draft: "status-pill--draft",
  approved: "status-pill--approved",
  rejected: "status-pill--rejected",
};

/**
 * The two facts a row's status cell states: the words and the colour class.
 *
 * `pendingReapproval` only ever upgrades an APPROVED lesson to "needs review".
 * It never overrides `draft` or `rejected`, because those lessons have no
 * approval to make stale — labelling a refused lesson "needs re-approval"
 * would send the parent looking for a decision that does not exist.
 */
function statusCell(lesson: {
  approvalStatus: ApprovalStatus;
  pendingReapproval: boolean;
}): { label: string; tone: string } {
  if (lesson.pendingReapproval) {
    return { label: "Cần duyệt lại", tone: "status-pill--attention" };
  }
  return { label: STATUS_LABELS[lesson.approvalStatus], tone: STATUS_TONES[lesson.approvalStatus] };
}

/** What the parent is told a lesson's status means for the learner's day. */
const STATUS_EFFECT: Record<ApprovalStatus, string> = {
  draft: "Bài này chưa hiện với Tài.",
  approved: "Bài này đang hiện với Tài.",
  rejected: "Bài này không hiện với Tài.",
};

/** Human name for a step kind, used as a secondary text label in the detail. */
const STEP_KIND_LABELS: Record<string, string> = {
  concept: "Khái niệm",
  visual: "Quan sát hình",
  guided: "Làm cùng hướng dẫn",
  independent: "Làm độc lập",
  transfer: "Vận dụng",
};

/** A refusal awaiting the parent's confirmation. One lesson at a time. */
type PendingRefusal = { lessonId: string; titleVi: string; learnerId: string | null };

export function LessonManagerScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [lessons, setLessons] = useState<readonly LessonRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [consents, setConsents] = useState<readonly ConsentRow[]>([]);
  const [consentOrgs, setConsentOrgs] = useState<readonly { id: string; name: string }[]>([]);
  const [classroomLessons, setClassroomLessons] = useState<readonly ClassroomLessonRow[]>([]);
  const [busyConsentOrgId, setBusyConsentOrgId] = useState<string | null>(null);

  /**
   * Short confirmation or failure line after a decision. The tone drives the
   * colour AND a leading word, so the outcome is never colour-only.
   */
  const [actionNote, setActionNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  /** Which lesson's buttons are currently in flight, so a row can be disabled. */
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<PendingRefusal | null>(null);

  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LessonDetailResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const detailRef = useRef<HTMLDivElement | null>(null);

  // `listLoading` starts true and the list is refreshed in place after each
  // decision (the response echoes the status it stored), so this effect only
  // ever has to CLEAR the spinner. Turning it on would setState synchronously
  // inside the effect, which React flags as a cascading-render risk.
  const loadLessons = useCallback(() => {
    const seq = ++requestSeqRef.current;
    const expectedLearnerId = session.learner?.id ?? readActiveLearnerId();
    const isStale = () => {
      if (!mountedRef.current || requestSeqRef.current !== seq) return true;
      const currentActive = readActiveLearnerId();
      return Boolean(expectedLearnerId && currentActive && currentActive !== expectedLearnerId);
    };

    void api.get<LessonListResponse>(endpoints.lessons).then((result) => {
      if (isStale()) return;
      if (result.ok) {
        setLessons(result.value.lessons);
        setListError(null);
      } else {
        setListError(failureMessage(result.failure));
      }
      setListLoading(false);
    });
    void api.get<LearnerConsentListResponse>(endpoints.consents).then((res) => {
      if (isStale()) return;
      if (res.ok) setConsents(res.value.consents);
    });
    void api.get<{ organizations: { id: string; name: string }[] }>(endpoints.consentOrganizations).then((res) => {
      if (isStale()) return;
      if (res.ok) setConsentOrgs(res.value.organizations);
    });
    void api.get<ClassroomLessonListResponse>(endpoints.classroomLessons).then((res) => {
      if (isStale()) return;
      if (res.ok) setClassroomLessons(res.value.lessons);
    });
  }, [session.learner?.id]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  /**
   * Open one lesson in full, including its answer key.
   *
   * The response is not normalised or trimmed: this is a review surface, so what
   * the server returns for the key is what the parent reads.
   */
  const openDetail = useCallback((lessonId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    setOpenLessonId(lessonId);
    void api.get<LessonDetailResponse>(endpoints.lessonDetail(lessonId)).then((result) => {
      setDetailLoading(false);
      if (result.ok) {
        setDetail(result.value);
      } else {
        setDetailError(failureMessage(result.failure));
      }
      // Move the reading position to the panel the parent just opened.
      detailRef.current?.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const closeDetail = useCallback(() => {
    setOpenLessonId(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);

  /**
   * Approve immediately.
   *
   * The row is updated from the response rather than refetched: the server
   * echoes the status it stored, so the list stays truthful without a second
   * request that could race the first.
   */
  const approve = useCallback(
    (lesson: LessonRow) => {
      const targetLearnerId = session.learner?.id ?? readActiveLearnerId();
      setActionNote(null);
      setBusyLessonId(lesson.id);
      const body: SetApprovalRequest = {
        lessonId: lesson.id,
        status: "approved",
        learnerId: targetLearnerId ?? undefined,
        version: lesson.version,
      };
      void api.post<SetApprovalResponse>(endpoints.setApproval, body).then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setBusyLessonId(null);
        if (!result.ok) {
          setActionNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        const status = result.value.status;
        setLessons((current) =>
          current.map((row) =>
            row.id === lesson.id
              ? { ...row, approvalStatus: status, pendingReapproval: false }
              : row,
          ),
        );
        setActionNote({ tone: "ok", text: `Đã duyệt “${lesson.titleVi}”.` });
      });
    },
    [session.learner?.id],
  );

  const submitRefusal = useCallback(
    (lessonId: string, status: ApprovalStatus, note: string) => {
      const title = refusal?.titleVi ?? "";
      const targetLearnerId = refusal?.learnerId ?? session.learner?.id ?? readActiveLearnerId();
      setActionNote(null);
      setBusyLessonId(lessonId);
      const body: SetApprovalRequest = {
        lessonId,
        status,
        learnerId: targetLearnerId ?? undefined,
        note: note.trim().length === 0 ? undefined : note.trim(),
      };
      void api.post<SetApprovalResponse>(endpoints.setApproval, body).then((result) => {
        if (!mountedRef.current) return;
        if (targetLearnerId && readActiveLearnerId() && readActiveLearnerId() !== targetLearnerId) return;
        setBusyLessonId(null);
        setRefusal(null);
        if (!result.ok) {
          setActionNote({ tone: "error", text: failureMessage(result.failure) });
          return;
        }
        const stored = result.value.status;
        setLessons((current) =>
          current.map((row) => (row.id === lessonId ? { ...row, approvalStatus: stored } : row)),
        );
        setActionNote({
          tone: "ok",
          text:
            status === "rejected"
              ? `Đã từ chối “${title}”. Bài này sẽ không hiện với Tài.`
              : `Đã cập nhật “${title}”.`,
        });
      });
    },
    [refusal, session.learner?.id],
  );

  const handleGrantConsent = useCallback(
    (organizationId: string, organizationName: string) => {
      const learnerId = session.learner?.id;
      if (!learnerId) return;
      setBusyConsentOrgId(organizationId);
      setActionNote(null);
      const body: GrantLearnerConsentRequest = { organizationId, learnerId };
      void api.post<GrantLearnerConsentResponse>(endpoints.grantConsent, body).then((res) => {
        setBusyConsentOrgId(null);
        if (!res.ok) {
          setActionNote({ tone: "error", text: failureMessage(res.failure) });
          return;
        }
        setActionNote({
          tone: "ok",
          text: `Đã cấp quyền chia sẻ dữ liệu học tập với trung tâm “${organizationName}”.`,
        });
        loadLessons();
      });
    },
    [loadLessons, session.learner?.id],
  );

  const handleRevokeConsent = useCallback(
    (organizationId: string, organizationName: string) => {
      const learnerId = session.learner?.id;
      if (!learnerId) return;
      setBusyConsentOrgId(organizationId);
      setActionNote(null);
      const body: RevokeLearnerConsentRequest = { organizationId, learnerId };
      void api.post<RevokeLearnerConsentResponse>(endpoints.revokeConsent, body).then((res) => {
        setBusyConsentOrgId(null);
        if (!res.ok) {
          setActionNote({ tone: "error", text: failureMessage(res.failure) });
          return;
        }
        setActionNote({
          tone: "ok",
          text: `Đã thu hồi quyền truy cập của trung tâm “${organizationName}”.`,
        });
        loadLessons();
      });
    },
    [loadLessons, session.learner?.id],
  );

  const draftCount = lessons.filter((lesson) => lesson.approvalStatus !== "approved").length;
  const reapprovalCount = lessons.filter((lesson) => lesson.pendingReapproval).length;

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="lesson-manager">
        <header className="lesson-manager__header">
          <h1 className="page__title">Quản lý bài học</h1>
          <p className="page__lede">
            Tất cả bài học trong máy, kèm trạng thái duyệt thật của từng bài. Chỉ
            bài đã duyệt mới hiện với Tài.
          </p>
          {/* The invariant, stated where the parent can read it before acting. */}
          <div className="lesson-manager__rule">
            <p>
              <strong>Quy tắc:</strong> chỉ bài “{STATUS_LABELS.approved}” mới xuất
              hiện khi Tài học. Các trạng thái khác không hiện với Tài.
            </p>
            <p>
              Khi nội dung bài học bị sửa sau khi đã duyệt, bản duyệt cũ không còn
              đúng nữa — bài đó hiện “Cần duyệt lại” cho tới khi bạn duyệt lại.
            </p>
          </div>
        </header>

        {/* One polite live region for every decision outcome on this screen.
            The leading word carries the meaning with the colour. */}
        <div aria-live="polite">
          {actionNote ? (
            <p
              className={`lesson-manager__status lesson-manager__status--${actionNote.tone}`}
              role="status"
            >
              {actionNote.tone === "ok" ? "Xong. " : "Chưa thực hiện được. "}
              {actionNote.text}
            </p>
          ) : null}
        </div>

        {listLoading ? <LoadingPanel what="danh sách bài học" /> : null}
        {listError ? <ErrorPanel message={listError} onRetry={loadLessons} /> : null}

        {!listLoading && !listError && lessons.length === 0 ? (
          <EmptyPanel title="Chưa có bài học nào được tạo">
            <p>Khi có bài học, chúng sẽ được liệt kê tại đây để bạn xem và duyệt.</p>
          </EmptyPanel>
        ) : null}

        {lessons.length > 0 ? (
          <>
            {/* Real counts, computed from the list only. No invented stats. */}
            <p className="lesson-manager__counts">
              {`Tổng ${lessons.length} bài. Chưa duyệt: ${draftCount}. Cần duyệt lại: ${reapprovalCount}.`}
            </p>
            <section aria-labelledby="lesson-table-title">
              <h2 className="section-title" id="lesson-table-title">
                Trạng thái duyệt
              </h2>
              <div className="lesson-manager__table-wrap">
                <table className="lesson-manager__table">
                  <caption>
                    Mỗi dòng là một bài học. Trạng thái được ghi bằng chữ, không chỉ
                    bằng màu.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Bài học</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Số bước</th>
                      <th scope="col">Nội dung</th>
                      <th scope="col">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => {
                      const pending = lesson.pendingReapproval;
                      const busy = busyLessonId === lesson.id;
                      return (
                        <tr key={lesson.id}>
                          <td className="lesson-cell-title">
                            <span className="lesson-cell-title__vi">{lesson.titleVi}</span>
                            <span className="lesson-cell-title__en">{lesson.titleEn}</span>
                            {lesson.provenance ? (
                              <span className="row__meta">
                                Nguồn: {lesson.provenance}
                                {lesson.expectedDurationMinutes
                                  ? ` · ~${lesson.expectedDurationMinutes} phút`
                                  : ""}
                              </span>
                            ) : null}
                            {lesson.reviewRecommendationVi ? (
                              <span className="row__meta">{lesson.reviewRecommendationVi}</span>
                            ) : null}
                          </td>
                          <td>
                            <span className={`status-pill ${statusCell(lesson).tone}`}>
                              {statusCell(lesson).label}
                            </span>
                            <span className="row__meta">
                              {STATUS_EFFECT[lesson.approvalStatus]}
                            </span>
                            {lesson.pendingReapproval ? (
                              /* Safety surface: the cause is spelled out in words. */
                              <span className="reapproval-flag">
                                <span className="reapproval-flag__label">Cần duyệt lại</span>
                                Nội dung đã thay đổi sau lần duyệt trước, nên cần xem lại
                                toàn bộ bài trước khi quyết định.
                              </span>
                            ) : null}
                          </td>
                          <td>
                            <span className="lesson-manager__count">{`${lesson.stepCount} bước`}</span>
                          </td>
                          <td>
                            <span className="lesson-manager__version">{`Phiên bản ${lesson.version}`}</span>
                          </td>
                          <td>
                            <div className="lesson-manager__actions">
                              <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => openDetail(lesson.id)}
                                aria-expanded={openLessonId === lesson.id}
                                aria-controls="lesson-detail-panel"
                              >
                                Xem bài
                              </button>
                              {lesson.approvalStatus === "approved" && !pending ? null : (
                                <button
                                  type="button"
                                  className="btn btn--primary"
                                  disabled={busy}
                                  onClick={() => approve(lesson)}
                                >
                                  {busy ? "Đang gửi…" : STATUS_LABELS.approved}
                                </button>
                              )}
                              {lesson.approvalStatus === "rejected" ? null : (
                                <button
                                  type="button"
                                  className="btn btn--danger"
                                  disabled={busy}
                                  onClick={() =>
                                    setRefusal({
                                      lessonId: lesson.id,
                                      titleVi: lesson.titleVi,
                                      learnerId: session.learner?.id ?? readActiveLearnerId(),
                                    })
                                  }
                                >
                                  Từ chối
                                </button>
                              )}
                            </div>
                            {refusal?.lessonId === lesson.id ? (
                              <RefusalPanel
                                lessonId={lesson.id}
                                titleVi={lesson.titleVi}
                                busy={busy}
                                onCancel={() => setRefusal(null)}
                                onConfirm={(note) => submitRefusal(lesson.id, "rejected", note)}
                              />
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {openLessonId ? (
          <DetailPanel
            panelId="lesson-detail-panel"
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onClose={closeDetail}
            panelRef={detailRef}
            onRetry={() => openDetail(openLessonId)}
          />
        ) : null}

        <section className="card" aria-labelledby="classroom-lessons-title" style={{ marginTop: "1.5rem" }}>
          <h2 className="card__title" id="classroom-lessons-title">
            Bài học được lớp / trung tâm giao
          </h2>
          {classroomLessons.length === 0 ? (
            <p className="row__meta">
              Chưa có bài học nào từ lớp hoặc trung tâm được giao cho hồ sơ này.
            </p>
          ) : (
            <ul className="rows" data-testid="classroom-assigned-lessons">
              {classroomLessons.map((item) => (
                <li key={`${item.classroomId}-${item.lessonId}`} className="row">
                  <span className="row__main">
                    <strong className="row__title">{item.titleVi}</strong>
                    <br />
                    <span className="row__meta">
                      Môn: {item.subjectId} · Lớp {item.gradeFrom}
                      {item.isParentApproved ? " · Phụ huynh đã duyệt" : " · Chờ phụ huynh duyệt"}
                    </span>
                  </span>
                  <span className="row__aside" style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => openDetail(item.lessonId)}
                    >
                      Xem bài
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="consent-grants-title" style={{ marginTop: "1.5rem" }}>
          <h2 className="card__title" id="consent-grants-title">
            Quyền chia sẻ dữ liệu với trung tâm / gia sư
          </h2>
          <p className="card__note">
            Trung tâm hoặc giáo viên chỉ xem được tiến độ của bé khi phụ huynh cấp
            quyền đồng ý. Khi thu hồi quyền, trung tâm bị ngắt quyền truy cập ngay lập tức.
          </p>
          {consents.length === 0 && consentOrgs.length === 0 ? (
            <p className="row__meta">
              Hồ sơ này hiện chưa ghi danh vào lớp học của trung tâm nào.
            </p>
          ) : (
            <ul className="rows" data-testid="learner-consents-list">
              {consents.map((c) => (
                <li key={c.id} className="row">
                  <span className="row__main">
                    <strong className="row__title">{c.organizationName}</strong>
                    <br />
                    <span className="row__meta">
                      Trạng thái:{" "}
                      {c.status === "active" ? "Đang cho phép chia sẻ" : "Đã thu hồi quyền"}
                    </span>
                  </span>
                  <span className="row__aside">
                    {c.status === "active" ? (
                      <button
                        type="button"
                        className="btn btn--danger"
                        disabled={busyConsentOrgId === c.organizationId}
                        data-testid={`revoke-consent-${c.organizationId}`}
                        onClick={() => handleRevokeConsent(c.organizationId, c.organizationName)}
                      >
                        Thu hồi quyền
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={busyConsentOrgId === c.organizationId}
                        data-testid={`grant-consent-${c.organizationId}`}
                        onClick={() => handleGrantConsent(c.organizationId, c.organizationName)}
                      >
                        Cấp quyền lại
                      </button>
                    )}
                  </span>
                </li>
              ))}
              {consentOrgs
                .filter((org) => !consents.some((c) => c.organizationId === org.id))
                .map((org) => (
                  <li key={org.id} className="row">
                    <span className="row__main">
                      <strong className="row__title">{org.name}</strong>
                      <br />
                      <span className="row__meta">Chưa cấp quyền chia sẻ dữ liệu</span>
                    </span>
                    <span className="row__aside">
                      <button
                        type="button"
                        className="btn btn--primary"
                        disabled={busyConsentOrgId === org.id}
                        data-testid={`grant-consent-${org.id}`}
                        onClick={() => handleGrantConsent(org.id, org.name)}
                      >
                        Cấp quyền
                      </button>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <p className="card__note">
          Khu vực phụ huynh không hiển thị với Tài.{" "}
          <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent")}>
            Về trang tổng quan
          </button>
        </p>
      </div>
    </ProtectedScreen>
  );
}

/** Props for the inspection panel, kept in one type so the screen stays short. */
type DetailProps = {
  panelId: string;
  detail: LessonDetailResponse | null;
  loading: boolean;
  error: string | null;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * The full lesson, including the answer key.
 *
 * Content editing is deliberately not offered here: this screen manages
 * approval, and a partial editor is worse than none.
 */
function DetailPanel({
  panelId,
  detail,
  loading,
  error,
  panelRef,
  onClose,
  onRetry,
}: DetailProps): React.JSX.Element {
  return (
    <section className="detail" id={panelId} aria-labelledby={`${panelId}-title`} ref={panelRef}>
      <div className="detail__head">
        <h2 className="detail__title" id={`${panelId}-title`}>
          {detail ? detail.titleVi : "Bài học"}
        </h2>
        {detail ? (
          <>
            <div className="detail__meta">
              <span className={`status-pill ${STATUS_TONES[detail.approvalStatus]}`}>
                {STATUS_LABELS[detail.approvalStatus]}
              </span>
              <span className="row__meta">{STATUS_EFFECT[detail.approvalStatus]}</span>
              <span className="row__meta">{`Phiên bản ${detail.version}`}</span>
            </div>
            <p className="detail__objective">{detail.objectiveVi}</p>
          </>
        ) : null}
      </div>

      {loading ? <LoadingPanel what="nội dung bài học" /> : null}
      {error ? <ErrorPanel message={error} onRetry={onRetry} /> : null}

      {detail ? (
        <>
          {/* Renders with the key every time, without exception. */}
          <div className="detail__warning">
            <strong className="detail__warning-title">Đáp án (chỉ phụ huynh xem được)</strong>
            <p>
              Nội dung bên dưới có đáp án. Không đưa phần này cho Tài xem, không
              chụp màn hình gửi đi, và không đọc đáp án trước khi Tài tự làm.
            </p>
          </div>

          {detail.steps.length === 0 ? (
            <EmptyPanel title="Bài học chưa có bước nào">
              <p>Bạn vẫn có thể duyệt hoặc từ chối bài này.</p>
            </EmptyPanel>
          ) : (
            <ol className="detail__steps">
              {detail.steps.map((step) => (
                <li className="detail__step" key={step.id}>
                  <div className="detail__step-head">
                    <h3 className="detail__step-title">{`Bước ${step.position}`}</h3>
                    <span className="pill">{STEP_KIND_LABELS[step.kind] ?? step.kind}</span>
                  </div>
                  <div className="detail__block">
                    <span className="detail__block-label">Nội dung</span>
                    <StepContent content={step.content} />
                  </div>
                  {step.explanationVi ? (
                    <div className="detail__block">
                      <span className="detail__block-label">Giải thích</span>
                      <p className="detail__explanation">{step.explanationVi}</p>
                    </div>
                  ) : null}
                  <div className="detail__answer-key">
                    <span className="detail__answer-key-label">Đáp án (chỉ phụ huynh xem được)</span>
                    <pre>{formatAnswerKey(step.answerKey)}</pre>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}

      <div className="detail__foot">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Đóng
        </button>
      </div>
    </section>
  );
}

/**
 * The question the learner sees, read off the validated exercise spec.
 *
 * Every variant carries a `question_vi` except the reading passage, which
 * carries the passage and its title; that is rendered instead. Nothing is
 * guessed for an unknown type — the label says the type.
 */
function StepContent({ content }: { content: LessonDetailResponse["steps"][number]["content"] }): React.JSX.Element {
  if (content.type === "reading_comprehension") {
    return (
      <div className="detail__block">
        <p className="detail__explanation">{content.passageTitle_vi}</p>
        <p className="detail__explanation">{content.passage_vi}</p>
        <p className="detail__explanation">{content.question_vi}</p>
      </div>
    );
  }
  if (content.type === "vocab_match") {
    return (
      <div className="detail__block">
        <p className="detail__explanation">{content.question_vi}</p>
        <p className="detail__explanation">{content.word}</p>
      </div>
    );
  }
  return <p className="detail__explanation">{content.question_vi}</p>;
}

/**
 * Render the answer key as stable, readable text.
 *
 * The key is `unknown` by contract: it is whatever was validated and stored. It
 * is pretty-printed so a parent reviewing it sees the real shape instead of a
 * single opaque line, and an absent key says so rather than showing `{}`.
 */
function formatAnswerKey(answerKey: unknown): string {
  if (answerKey === null || answerKey === undefined) return "(bài này không có đáp án riêng)";
  try {
    return JSON.stringify(answerKey, null, 2);
  } catch {
    // A key that cannot be serialised is a data problem, shown as one.
    return "(không đọc được đáp án của bước này)";
  }
}

/**
 * The two-step refusal: a real inline panel with its own buttons.
 *
 * `window.confirm` is available here but is bypassed by users who dismiss
 * dialogs reflexively, and it cannot carry the reason field, which is the part
 * that makes the refusal reviewable later.
 */
function RefusalPanel({
  lessonId,
  titleVi,
  busy,
  onCancel,
  onConfirm,
}: {
  lessonId: string;
  titleVi: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}): React.JSX.Element {
  const [note, setNote] = useState("");
  const noteId = `refusal-note-${lessonId}`;

  return (
    <div className="confirm" role="group" aria-labelledby={`${noteId}-title`}>
      <p className="confirm__title" id={`${noteId}-title`}>
        {`Từ chối “${titleVi}”?`}
      </p>
      <p className="confirm__body">
        Sau khi từ chối, bài này sẽ không hiện với Tài cho tới khi bạn duyệt lại.
        Bạn vẫn có thể mở bài để xem lại.
      </p>
      <div className="confirm__field">
        <label className="confirm__label" htmlFor={noteId}>
          Lý do (không bắt buộc)
        </label>
        <input
          className="input"
          id={noteId}
          type="text"
          value={note}
          maxLength={500}
          placeholder="Vì sao bài này chưa phù hợp?"
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <div className="confirm__actions">
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy}
          onClick={() => onConfirm(note)}
        >
          {busy ? "Đang gửi…" : "Xác nhận từ chối"}
        </button>
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={onCancel}>
          Giữ nguyên
        </button>
      </div>
    </div>
  );
}
