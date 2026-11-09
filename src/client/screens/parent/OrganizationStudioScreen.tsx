/**
 * B2B2C Organization & Classroom Studio (`/parent/organization`).
 *
 * This screen is the production caller for the `/api/org/*` routes. Without it
 * those handlers exist but are never reached from a browser, which is exactly
 * the "orphaned backend" failure this screen closes: a route with no caller
 * cannot be verified by anything except a hand-written request.
 *
 * Parent sovereignty is enforced server-side, but the UI is shaped by it:
 *   - A parent's learner only appears in the enrolment picker after the parent
 *     has granted consent (`GET /api/org/consented-learners`), so the screen
 *     never even lists a learner a center has no permission to see.
 *   - The session's own role comes from `GET /api/org/list`, so owner-only
 *     controls are never rendered for an admin session in the first place —
 *     offering a button the server is guaranteed to refuse is a lying UI.
 *   - A lesson travels a real chain: draft -> submitted -> org_approved ->
 *     assigned to a classroom -> parent approval. Each state is named in words
 *     so a lesson can never silently become visible to a child.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AddOrganizationMemberRequest,
  AddOrganizationMemberResponse,
  AssignClassroomLessonRequest,
  AssignClassroomLessonResponse,
  AssignClassroomTeacherRequest,
  AssignClassroomTeacherResponse,
  ClassroomLearnersResponse,
  ClassroomLessonListResponse,
  ClassroomListResponse,
  ClassroomProgressResponse,
  ConsentedOrgLearnersResponse,
  CreateClassroomRequest,
  CreateClassroomResponse,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  CreateOrgLessonRequest,
  CreateOrgLessonResponse,
  EnrollLearnerRequest,
  EnrollLearnerResponse,
  LessonDetailResponse,
  MemberOrganizationListResponse,
  OrganizationLessonListResponse,
  OrganizationMemberListResponse,
  OrganizationRoleContract,
  ReviewOrgLessonRequest,
  ReviewOrgLessonResponse,
  SubmitOrgLessonReviewRequest,
  SubmitOrgLessonReviewResponse,
  UpdateContentRequest,
  UpdateContentResponse,
} from "../../../shared/api-contract";
import type { LessonStepKind } from "../../../shared/schemas/attempt";
import type { ExerciseSpec } from "../../../shared/schemas/exercise";
import { api, failureMessage } from "../../lib/api";
import { readActiveLearnerId } from "../../lib/active-learner-store";
import { endpoints } from "../../lib/endpoints";
import { useSessionContext } from "../../lib/session-context";
import { ProtectedScreen } from "../../components/ProtectedScreen";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "../../components/ScreenState";
import "../../styles/organization-studio.css";

type OrganizationRow = MemberOrganizationListResponse["organizations"][number];
type ClassroomRow = ClassroomListResponse["classrooms"][number];
type MemberRow = OrganizationMemberListResponse["members"][number];
type OrgLessonRow = OrganizationLessonListResponse["lessons"][number];
type ConsentedLearner = ConsentedOrgLearnersResponse["learners"][number];
type AssignedLesson = ClassroomLessonListResponse["lessons"][number];
type ClassroomProgressLearner = ClassroomProgressResponse["learners"][number];

type PolymorphicDraftStep = {
  position: number;
  kind: LessonStepKind;
  content: ExerciseSpec;
  answerKey: unknown;
  explanationVi: string;
};

/** The 5 subjects whose curriculum is active in the MVP, in display order. */
const SUBJECT_OPTIONS: { id: string; labelVi: string }[] = [
  { id: "math", labelVi: "Toán" },
  { id: "vietnamese", labelVi: "Tiếng Việt" },
  { id: "english", labelVi: "Tiếng Anh" },
  { id: "science", labelVi: "Khoa học" },
  { id: "debate", labelVi: "Tư duy & Phản biện" },
];

const ROLES: readonly OrganizationRoleContract[] = ["owner", "admin", "teacher"];

const ROLE_LABELS: Record<OrganizationRoleContract, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  teacher: "Giáo viên",
};

const REVIEW_STATUS_LABELS: Record<OrgLessonRow["reviewStatus"], string> = {
  draft: "Bản nháp",
  submitted: "Chờ duyệt",
  org_approved: "Trung tâm đã duyệt",
  org_rejected: "Trung tâm từ chối",
};

const STEP_KIND_LABELS: Record<LessonStepKind, string> = {
  concept: "Khái niệm",
  visual: "Quan sát hình",
  guided: "Làm cùng hướng dẫn",
  independent: "Làm độc lập",
  transfer: "Vận dụng",
};

/** The teaching sequence, in the order the content modules are written in. */
const STEP_SEQUENCE: readonly LessonStepKind[] = ["concept", "concept", "guided", "independent", "transfer"];

/**
 * The blank multiple-choice step the authoring form starts from.
 *
 * `hint1_vi`..`hint3_vi` are required by the exercise schema, so a step cannot
 * be saved with a missing hint: a step with no hints would let a stuck child
 * stall with no way forward, which is exactly what the hint policy forbids.
 */
function blankChoiceStep(position: number): PolymorphicDraftStep {
  const kind = STEP_SEQUENCE[position - 1] ?? "guided";
  return {
    position,
    kind,
    content: {
      type: "multiple_choice",
      question_vi: "",
      choices: [
        { id: "a", label_vi: "", correct: true },
        { id: "b", label_vi: "", correct: false },
        { id: "c", label_vi: "", correct: false },
        { id: "d", label_vi: "", correct: false },
      ],
      hint1_vi: "",
      hint2_vi: "",
      hint3_vi: "",
    },
    answerKey: { correctChoiceId: "a" },
    explanationVi: "",
  };
}

function emptyDraftSteps(): PolymorphicDraftStep[] {
  return [1, 2, 3, 4, 5].map(blankChoiceStep);
}

/** A tiny result type so a helper can reject without throwing. */
type Call<T> = { ok: true; value: T } | { ok: false; failure: unknown };

export function OrganizationStudioScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  const { session } = useSessionContext();
  const mountedRef = useRef(true);
  const seqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [createOrgBusy, setCreateOrgBusy] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [createOrgNotice, setCreateOrgNotice] = useState<string | null>(null);

  const loadOrganizations = useCallback((preferredOrgId?: string) => {
    const seq = ++seqRef.current;
    void api.get<MemberOrganizationListResponse>(endpoints.orgList).then((res) => {
      if (!mountedRef.current || seq !== seqRef.current) return;
      setLoadingOrgs(false);
      if (!res.ok) {
        setOrgsError(failureMessage(res.failure));
        return;
      }
      setOrgsError(null);
      const rows = res.value.organizations ?? [];
      setOrganizations(rows);
      setActiveOrgId((current) => preferredOrgId ?? current ?? rows[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleCreateOrganization = (event: React.FormEvent) => {
    event.preventDefault();
    setCreateOrgError(null);
    setCreateOrgNotice(null);
    const name = newOrgName.trim();
    const slug = newOrgSlug.trim().toLowerCase();
    if (!name || !slug) {
      setCreateOrgError("Vui lòng nhập tên trung tâm và mã định danh (slug).");
      return;
    }
    setCreateOrgBusy(true);
    const body: CreateOrganizationRequest = { name, slug };
    void api.post<CreateOrganizationResponse>(endpoints.orgCreate, body).then((res) => {
      if (!mountedRef.current) return;
      setCreateOrgBusy(false);
      if (!res.ok) {
        setCreateOrgError(failureMessage(res.failure));
        return;
      }
      const createdOrg: OrganizationRow = {
        ...res.value.organization,
        role: "owner",
      };
      setOrganizations((current) => [createdOrg, ...current.filter((o) => o.id !== createdOrg.id)]);
      setActiveOrgId(createdOrg.id);
      setNewOrgName("");
      setNewOrgSlug("");
      setCreateOrgNotice(`Đã khởi tạo trung tâm “${res.value.organization.name}”.`);
      loadOrganizations(res.value.organization.id);
    });
  };

  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? null;
  const canManage = activeOrg?.role === "owner" || activeOrg?.role === "admin";

  return (
    <ProtectedScreen area="parent" session={session}>
      <div className="org-studio">
        <header className="org-studio__header">
          <div>
            <h1 className="org-studio__title">Trung tâm &amp; Lớp học</h1>
            <p className="org-studio__lead">
              Nơi phụ huynh cho phép một trung tâm tiếp cận hồ sơ bé, xếp lớp, và
              kiểm soát bài học do trung tâm gửi sang. Mọi quyền tiếp cận đều bắt
              đầu từ sự chấp thuận của phụ huynh và không tự hết hiệu lực.
            </p>
          </div>
          <nav className="org-studio__backnav" aria-label="Khu vực phụ huynh">
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/parent")}>
              Tổng quan
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onNavigate("/parent/lessons")}
            >
              Quản lý bài học
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onNavigate("/parent/data")}
            >
              Dữ liệu của bé
            </button>
          </nav>
        </header>

        <section className="card" aria-labelledby="org-create-title">
          <h2 className="card__title" id="org-create-title">
            Khởi tạo trung tâm mới
          </h2>
          <p className="org-studio__hint">
            Người tạo trung tâm tự động giữ vai trò Chủ sở hữu (owner).
          </p>
          {createOrgError ? (
            <p className="org-studio__notice org-studio__notice--error" role="alert">
              {createOrgError}
            </p>
          ) : null}
          {createOrgNotice ? (
            <p className="org-studio__notice org-studio__notice--ok" role="status">
              {createOrgNotice}
            </p>
          ) : null}
          <form className="org-studio__form org-studio__form--row" onSubmit={handleCreateOrganization}>
            <label htmlFor="org-create-name">
              <span>Tên trung tâm</span>
              <input
                id="org-create-name"
                className="input"
                data-testid="org-create-name-input"
                placeholder="VD: Trung tâm Toán & Khoa học Sao Khuê"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
            </label>
            <label htmlFor="org-create-slug">
              <span>Mã định danh (slug)</span>
              <input
                id="org-create-slug"
                className="input"
                data-testid="org-create-slug-input"
                placeholder="VD: sao-khue-center"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
              />
            </label>
            <button type="submit" className="btn" data-testid="org-create-submit-btn" disabled={createOrgBusy}>
              {createOrgBusy ? "Đang tạo…" : "Tạo trung tâm"}
            </button>
          </form>
        </section>

        {loadingOrgs ? <LoadingPanel what="danh sách trung tâm" /> : null}
        {orgsError ? <ErrorPanel message={orgsError} onRetry={() => loadOrganizations()} /> : null}

        {!loadingOrgs && !orgsError && organizations.length > 0 ? (
          <section className="org-studio__orgbar" aria-label="Chọn trung tâm">
            <label className="org-studio__inlinelabel" htmlFor="org-studio-select">
              <span>Trung tâm đang làm việc</span>
              <select
                id="org-studio-select"
                className="select"
                data-testid="org-studio-select"
                value={activeOrgId ?? ""}
                onChange={(e) => setActiveOrgId(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({ROLE_LABELS[org.role]})
                  </option>
                ))}
              </select>
            </label>
            <span className="org-studio__pill" data-testid="org-studio-role">
              Vai trò của bạn: {activeOrg ? ROLE_LABELS[activeOrg.role] : "—"}
            </span>
          </section>
        ) : null}

        {!loadingOrgs && !orgsError && organizations.length === 0 ? (
          <EmptyPanel title="Bạn chưa thuộc trung tâm nào">
            <p>
              Tạo một trung tâm bằng biểu mẫu phía trên nếu bạn là người điều hành,
              hoặc đợi quản trị viên thêm bạn vào trung tâm hiện có.
            </p>
          </EmptyPanel>
        ) : null}

        {activeOrg ? (
          <>
            <MembersSection key={`members:${activeOrg.id}`} organizationId={activeOrg.id} canManage={canManage} myRole={activeOrg.role} />
            {canManage ? <ConsentSection key={`consent:${activeOrg.id}`} organizationId={activeOrg.id} canManage={canManage} /> : null}
            <ClassroomSection key={`classrooms:${activeOrg.id}`} organizationId={activeOrg.id} canManage={canManage} />
            <LessonStudioSection
              key={`lessons:${activeOrg.id}`}
              organizationId={activeOrg.id}
              canManage={canManage}
              myRole={activeOrg.role}
              currentUserId={session.parentId ?? null}
            />
          </>
        ) : null}
      </div>
    </ProtectedScreen>
  );
}

/* ── Members ──────────────────────────────────────────────────────────────── */

function MembersSection({
  organizationId,
  canManage,
  myRole,
}: {
  organizationId: string;
  canManage: boolean;
  myRole: OrganizationRoleContract;
}): React.JSX.Element {
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<OrganizationRoleContract>("teacher");

  const load = useCallback(() => {
    void api
      .get<OrganizationMemberListResponse>(`${endpoints.orgMembers}?organizationId=${encodeURIComponent(organizationId)}`)
      .then((res) => {
        if (!res.ok) {
          setError(failureMessage(res.failure));
          return;
        }
        setError(null);
        setMembers(res.value.members ?? []);
      });
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (!userId.trim()) {
      setError("Vui lòng nhập mã thành viên (userId).");
      return;
    }
    const body: AddOrganizationMemberRequest = {
      organizationId,
      userId: userId.trim(),
      role,
    };
    void api.post<AddOrganizationMemberResponse>(endpoints.orgMembers, body).then((res) => {
      if (!res.ok) {
        setError(failureMessage(res.failure));
        return;
      }
      setError(null);
      setNotice("Đã cập nhật thành viên.");
      setUserId("");
      load();
    });
  };

  // Only the owner may promote another owner, so the owner option is absent for
  // an admin session rather than offered and refused.
  const roleOptions: readonly OrganizationRoleContract[] = myRole === "owner" ? ROLES : ["admin", "teacher"];

  return (
    <section className="card" aria-labelledby="org-members-title">
      <h2 className="card__title" id="org-members-title">
        Thành viên trung tâm
      </h2>
      {error ? (
        <p className="org-studio__notice org-studio__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {members === null ? (
        <LoadingPanel what="danh sách thành viên" />
      ) : (
        <table className="org-studio__table" data-testid="org-members-table">
          <thead>
            <tr>
              <th scope="col">Thành viên</th>
              <th scope="col">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.displayName}</td>
                <td>
                  <span className={`org-studio__pill org-studio__pill--${m.role}`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="org-studio__hint">
        Quản trị viên không được bổ nhiệm chủ sở hữu, và không thể hạ vai trò chủ
        sở hữu cuối cùng. Đây là giới hạn chống khóa trung tâm, không phải hạn
        chế quyền của bạn.
      </p>

      {canManage ? (
        <form className="org-studio__form org-studio__form--row" onSubmit={submit}>
          <label htmlFor="org-member-user">
            <span>Mã thành viên (userId)</span>
            <input
              id="org-member-user"
              className="input"
              data-testid="org-member-user-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label htmlFor="org-member-role">
            <span>Vai trò</span>
            <select
              id="org-member-role"
              className="select"
              data-testid="org-member-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as OrganizationRoleContract)}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn" data-testid="org-member-add-btn">
            Thêm / cập nhật thành viên
          </button>
        </form>
      ) : null}
      {notice ? (
        <p className="org-studio__notice org-studio__notice--ok" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}

/* ── Consent (parent sovereignty) ─────────────────────────────────────────── */

function ConsentSection({
  organizationId,
  canManage,
}: {
  organizationId: string;
  canManage: boolean;
}): React.JSX.Element {
  const [learners, setLearners] = useState<ConsentedLearner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    void api
      .get<ConsentedOrgLearnersResponse>(
        `${endpoints.orgConsentedLearners}?organizationId=${encodeURIComponent(organizationId)}`,
      )
      .then((res) => {
        if (!res.ok) {
          setError(failureMessage(res.failure));
          setLearners(null);
          return;
        }
        setError(null);
        setLearners(res.value.learners ?? []);
      });
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = (path: string, successVi: string) => {
    setNotice(null);
    const learnerId = readActiveLearnerId() ?? undefined;
    void api.post<{ success?: boolean }>(path, { organizationId, learnerId }).then((res) => {
      if (!res.ok) {
        setError(failureMessage(res.failure));
        return;
      }
      setError(null);
      setNotice(successVi);
      load();
    });
  };

  return (
    <section className="card" aria-labelledby="org-consent-title">
      <h2 className="card__title" id="org-consent-title">
        Bé đã chấp thuận cho trung tâm này
      </h2>
      <p className="org-studio__hint">
        Danh sách chỉ chứa những hồ sơ đang có chấp thuận (consent) hiệu lực cho
        trung tâm này. Thu hồi chấp thuận cắt quyền tiếp cận ngay lập tức, kể cả
        các phiên đã đăng nhập.
      </p>
      {error ? (
        <p className="org-studio__notice org-studio__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {learners === null ? (
        <LoadingPanel what="danh sách bé đã chấp thuận" />
      ) : learners.length === 0 ? (
        <EmptyPanel title="Chưa có hồ sơ nào được chấp thuận cho trung tâm này">
          <p>
            Chọn một hồ sơ bé ở góc trên rồi dùng nút “Cấp chấp thuận” bên dưới.
            Trung tâm không thể xem bất cứ dữ liệu nào của bé trước bước đó.
          </p>
        </EmptyPanel>
      ) : (
        <table className="org-studio__table" data-testid="org-consented-learners-table">
          <thead>
            <tr>
              <th scope="col">Bé</th>
              <th scope="col">Lớp</th>
              <th scope="col">Chấp thuận</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((l) => (
              <tr key={l.id}>
                <td>{l.nickname}</td>
                <td>{l.grade ? `Lớp ${l.grade}` : "—"}</td>
                <td>
                  <span className="org-studio__pill org-studio__pill--active">Đang hiệu lực</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {notice ? (
        <p className="org-studio__notice org-studio__notice--ok" role="status">
          {notice}
        </p>
      ) : null}
      {canManage ? (
        <div className="org-studio__form org-studio__form--row">
          <button
            type="button"
            className="btn btn--secondary"
            data-testid="org-consent-grant-btn"
            onClick={() => act(endpoints.grantConsent, "Đã cấp chấp thuận cho hồ sơ đang chọn.")}
          >
            Cấp chấp thuận cho hồ sơ đang chọn
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            data-testid="org-consent-revoke-btn"
            onClick={() => act(endpoints.revokeConsent, "Đã thu hồi chấp thuận của hồ sơ đang chọn.")}
          >
            Thu hồi chấp thuận của hồ sơ đang chọn
          </button>
        </div>
      ) : null}
    </section>
  );
}

/* ── Classrooms, teachers, and enrolments ─────────────────────────────────── */

function ClassroomSection({
  organizationId,
  canManage,
}: {
  organizationId: string;
  canManage: boolean;
}): React.JSX.Element {
  const [classrooms, setClassrooms] = useState<ClassroomRow[] | null>(null);
  const [consented, setConsented] = useState<ConsentedLearner[]>([]);
  const [orgMembers, setOrgMembers] = useState<MemberRow[]>([]);
  const [orgLessons, setOrgLessons] = useState<OrgLessonRow[]>([]);
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null);
  const [classLearners, setClassLearners] = useState<{ id: string; nickname: string; grade: number | null }[]>([]);
  const [assigned, setAssigned] = useState<AssignedLesson[]>([]);
  const [progressLearners, setProgressLearners] = useState<ClassroomProgressLearner[]>([]);

  const [classroomName, setClassroomName] = useState("");
  const [classroomGrade, setClassroomGrade] = useState("4");
  const [classroomSubject, setClassroomSubject] = useState<string>("math");
  const [teacherId, setTeacherId] = useState("");
  const [enrollLearnerId, setEnrollLearnerId] = useState("");
  const [assignLessonId, setAssignLessonId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadClassrooms = useCallback(() => {
    void api
      .get<ClassroomListResponse>(`${endpoints.orgClassrooms}?organizationId=${encodeURIComponent(organizationId)}`)
      .then((res) => {
        if (!res.ok) {
          setError(failureMessage(res.failure));
          return;
        }
        const rows = res.value.classrooms ?? [];
        setClassrooms(rows);
        setActiveClassroomId((current) => current ?? rows[0]?.id ?? null);
      });
  }, [organizationId]);

  const loadOrgLessons = useCallback(() => {
    void api
      .get<OrganizationLessonListResponse>(`${endpoints.orgLessons}?organizationId=${encodeURIComponent(organizationId)}`)
      .then((res) => {
        if (res.ok) setOrgLessons(res.value.lessons ?? []);
      });
  }, [organizationId]);

  const loadConsented = useCallback(() => {
    if (!canManage) return;
    void api
      .get<ConsentedOrgLearnersResponse>(`${endpoints.orgConsentedLearners}?organizationId=${encodeURIComponent(organizationId)}`)
      .then((res) => {
        if (res.ok) setConsented(res.value.learners ?? []);
      });
  }, [canManage, organizationId]);

  const loadOrgMembers = useCallback(() => {
    if (!canManage) return;
    void api
      .get<OrganizationMemberListResponse>(`${endpoints.orgMembers}?organizationId=${encodeURIComponent(organizationId)}`)
      .then((res) => {
        if (res.ok) setOrgMembers(res.value.members ?? []);
      });
  }, [canManage, organizationId]);

  useEffect(() => {
    loadClassrooms();
    loadOrgLessons();
    loadConsented();
    loadOrgMembers();
  }, [loadClassrooms, loadOrgLessons, loadConsented, loadOrgMembers]);

  useEffect(() => {
    if (!activeClassroomId) return;
    const q = `classroomId=${encodeURIComponent(activeClassroomId)}`;
    void api.get<ClassroomLearnersResponse>(`${endpoints.orgClassroomLearners}?${q}`).then((res) => {
      if (res.ok) setClassLearners(res.value.learners ?? []);
    });
    void api.get<ClassroomLessonListResponse>(`${endpoints.orgClassroomAssignedLessons}?${q}`).then((res) => {
      if (res.ok) setAssigned(res.value.lessons ?? []);
    });
    void api.get<ClassroomProgressResponse>(`${endpoints.orgClassroomProgress}?${q}`).then((res) => {
      if (res.ok) setProgressLearners(res.value.learners ?? []);
    });
  }, [activeClassroomId]);

  /**
   * Every mutation here reloads the assigned-lesson list, because a rejection at
   * the server (bad role, unapproved lesson, missing consent) must not leave a
   * row on screen that the server never accepted.
   */
  const run = <T,>(call: Promise<Call<T>>, successVi: string) => {
    void call.then((res) => {
      if (!res.ok) {
        setError(failureMessage(res.failure as never));
        return;
      }
      setError(null);
      setNotice(successVi);
      loadClassrooms();
      loadOrgLessons();
      loadConsented();
      if (activeClassroomId) {
        const q = `classroomId=${encodeURIComponent(activeClassroomId)}`;
        void api.get<ClassroomLearnersResponse>(`${endpoints.orgClassroomLearners}?${q}`).then((r) => {
          if (r.ok) setClassLearners(r.value.learners ?? []);
        });
        void api.get<ClassroomLessonListResponse>(`${endpoints.orgClassroomAssignedLessons}?${q}`).then((r) => {
          if (r.ok) setAssigned(r.value.lessons ?? []);
        });
        void api.get<ClassroomProgressResponse>(`${endpoints.orgClassroomProgress}?${q}`).then((r) => {
          if (r.ok) setProgressLearners(r.value.learners ?? []);
        });
      }
    });
  };

  const createClassroom = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!classroomName.trim()) {
      setError("Vui lòng đặt tên lớp học.");
      return;
    }
    const grade = Number.parseInt(classroomGrade, 10);
    const body: CreateClassroomRequest = {
      organizationId,
      name: classroomName.trim(),
      grade: Number.isFinite(grade) ? grade : null,
      subjectId: classroomSubject,
    };
    run(api.post<CreateClassroomResponse>(endpoints.orgClassrooms, body), "Đã tạo lớp học.");
    setClassroomName("");
  };

  const assignTeacher = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!activeClassroomId || !teacherId.trim()) {
      setError("Vui lòng chọn thành viên giáo viên từ danh sách.");
      return;
    }
    const body: AssignClassroomTeacherRequest = { classroomId: activeClassroomId, teacherId: teacherId.trim() };
    run(api.post<AssignClassroomTeacherResponse>(endpoints.orgClassroomTeachers, body), "Đã phân công giáo viên.");
    setTeacherId("");
  };

  const enroll = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!activeClassroomId || !enrollLearnerId) {
      setError("Vui lòng chọn bé đã cấp chấp thuận để xếp lớp.");
      return;
    }
    const body: EnrollLearnerRequest = { classroomId: activeClassroomId, learnerId: enrollLearnerId };
    run(api.post<EnrollLearnerResponse>(endpoints.orgClassroomEnroll, body), "Đã xếp bé vào lớp.");
  };

  const assignLesson = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!activeClassroomId || !assignLessonId) {
      setError("Vui lòng chọn bài học đã được trung tâm duyệt.");
      return;
    }
    const body: AssignClassroomLessonRequest = { classroomId: activeClassroomId, lessonId: assignLessonId };
    run(api.post<AssignClassroomLessonResponse>(endpoints.orgClassroomAssignLesson, body), "Đã giao bài cho lớp.");
  };

  const approvedLessons = orgLessons.filter((l) => l.reviewStatus === "org_approved");

  return (
    <section className="card" aria-labelledby="org-classroom-title">
      <h2 className="card__title" id="org-classroom-title">
        Lớp học &amp; phân công
      </h2>
      {error ? (
        <p className="org-studio__notice org-studio__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="org-studio__notice org-studio__notice--ok" role="status">
          {notice}
        </p>
      ) : null}

      {classrooms === null ? (
        <LoadingPanel what="danh sách lớp học" />
      ) : classrooms.length === 0 ? (
        <EmptyPanel title="Chưa có lớp học nào" />
      ) : (
        <>
          <label className="org-studio__inlinelabel" htmlFor="org-classroom-select">
            <span>Đang xem lớp</span>
            <select
              id="org-classroom-select"
              className="select"
              data-testid="org-classroom-select"
              value={activeClassroomId ?? ""}
              onChange={(e) => setActiveClassroomId(e.target.value)}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.grade ? ` · Lớp ${c.grade}` : ""}
                </option>
              ))}
            </select>
          </label>

          <h3 className="org-studio__subtitle">Bé trong lớp</h3>
          {classLearners.length === 0 ? (
            <p className="org-studio__hint">Chưa có bé nào được xếp vào lớp này.</p>
          ) : (
            <ul className="org-studio__chips" data-testid="org-classroom-learners">
              {classLearners.map((l) => (
                <li key={l.id} className="org-studio__chip">
                  {l.nickname}
                  {l.grade ? ` · Lớp ${l.grade}` : ""}
                </li>
              ))}
            </ul>
          )}

          <h3 className="org-studio__subtitle">Bài học đã giao cho lớp</h3>
          {assigned.length === 0 ? (
            <p className="org-studio__hint">Chưa giao bài học nào cho lớp này.</p>
          ) : (
            <table className="org-studio__table" data-testid="org-classroom-assigned">
              <thead>
                <tr>
                  <th scope="col">Bài học</th>
                  <th scope="col">Phiên bản giao</th>
                  <th scope="col">Phụ huynh đã duyệt</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map((a) => (
                  <tr key={`${a.classroomId}:${a.lessonId}`}>
                    <td>{a.titleVi}</td>
                    <td>{`v${a.assignedVersion ?? 1}`}</td>
                    <td>{a.isParentApproved ? "Đã duyệt" : "Chưa duyệt"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="org-studio__subtitle">Tiến độ lớp học (chỉ hiện bé có chấp thuận hiệu lực)</h3>
          {progressLearners.length === 0 ? (
            <p className="org-studio__hint" data-testid="org-classroom-progress-empty">
              Chưa có dữ liệu tiến độ cho lớp này.
            </p>
          ) : (
            <table className="org-studio__table" data-testid="org-classroom-progress">
              <thead>
                <tr>
                  <th scope="col">Bé</th>
                  <th scope="col">Lớp</th>
                  <th scope="col">Bài đã giao</th>
                  <th scope="col">Phụ huynh đã duyệt</th>
                  <th scope="col">Đã hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {progressLearners.map((p) => (
                  <tr key={p.learnerId} data-testid={`org-progress-row-${p.learnerId}`}>
                    <td>{p.nickname}</td>
                    <td>{p.grade ? `Lớp ${p.grade}` : "—"}</td>
                    <td>{p.assignedCount}</td>
                    <td>{`${p.parentApprovedCount}/${p.assignedCount}`}</td>
                    <td>{`${p.completedCount}/${p.assignedCount}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="org-studio__grid">
            {canManage ? (
              <form className="org-studio__form" onSubmit={enroll}>
                <h3 className="org-studio__subtitle">Xếp bé vào lớp</h3>
                <label htmlFor="org-enroll-learner">
                  <span>Bé đã cấp chấp thuận</span>
                  <select
                    id="org-enroll-learner"
                    className="select"
                    data-testid="org-enroll-learner-select"
                    value={enrollLearnerId}
                    onChange={(e) => setEnrollLearnerId(e.target.value)}
                    onFocus={loadConsented}
                  >
                    <option value="">— Chọn bé —</option>
                    {consented.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nickname}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn" data-testid="org-enroll-submit">
                  Xếp vào lớp
                </button>
                {consented.length === 0 ? (
                  <p className="org-studio__hint">
                    Chưa có bé nào cấp chấp thuận cho trung tâm này. Hãy cấp chấp thuận
                    trước khi xếp lớp.
                  </p>
                ) : null}
              </form>
            ) : null}

            {canManage ? (
              <form className="org-studio__form" onSubmit={assignTeacher}>
                <h3 className="org-studio__subtitle">Phân công giáo viên</h3>
                <label htmlFor="org-teacher-select">
                  <span>Thành viên trung tâm</span>
                  <select
                    id="org-teacher-select"
                    className="select"
                    data-testid="org-teacher-select"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    onFocus={loadOrgMembers}
                  >
                    <option value="">— Chọn giáo viên —</option>
                    {orgMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {`${m.userId} (${ROLE_LABELS[m.role]})`}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn" data-testid="org-teacher-assign-btn">
                  Phân công
                </button>
                <p className="org-studio__hint">
                  Giáo viên phải là thành viên cùng trung tâm, và chỉ thấy học sinh
                  trong lớp mình được phân công.
                </p>
              </form>
            ) : null}

            <form className="org-studio__form" onSubmit={assignLesson}>
              <h3 className="org-studio__subtitle">Giao bài đã duyệt</h3>
              <label htmlFor="org-assign-lesson">
                <span>Bài học</span>
                <select
                  id="org-assign-lesson"
                  className="select"
                  data-testid="org-assign-lesson-select"
                  value={assignLessonId}
                  onChange={(e) => setAssignLessonId(e.target.value)}
                  onFocus={loadOrgLessons}
                >
                  <option value="">— Chọn bài —</option>
                  {approvedLessons.map((l) => (
                    <option key={l.lessonId} value={l.lessonId}>
                      {l.titleVi}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn" data-testid="org-assign-lesson-btn">
                Giao bài
              </button>
              {approvedLessons.length === 0 ? (
                <p className="org-studio__hint">
                  Chưa có bài nào được trung tâm duyệt. Bài phải qua bước duyệt trước
                  khi giao cho lớp.
                </p>
              ) : null}
            </form>
          </div>
        </>
      )}

      {canManage ? (
        <form className="org-studio__form org-studio__form--row" onSubmit={createClassroom}>
          <h3 className="org-studio__subtitle">Tạo lớp học mới</h3>
          <label htmlFor="org-classroom-name">
            <span>Tên lớp</span>
            <input
              id="org-classroom-name"
              className="input"
              data-testid="org-classroom-name-input"
              value={classroomName}
              onChange={(e) => setClassroomName(e.target.value)}
            />
          </label>
          <label htmlFor="org-classroom-grade">
            <span>Lớp</span>
            <input
              id="org-classroom-grade"
              className="input"
              data-testid="org-classroom-grade-input"
              value={classroomGrade}
              onChange={(e) => setClassroomGrade(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label htmlFor="org-classroom-subject">
            <span>Môn</span>
            <select
              id="org-classroom-subject"
              className="select"
              value={classroomSubject}
              onChange={(e) => setClassroomSubject(e.target.value)}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.labelVi}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn" data-testid="org-classroom-create-btn">
            Tạo lớp
          </button>
        </form>
      ) : null}
    </section>
  );
}

/* ── Lesson authoring & review chain ──────────────────────────────────────── */

function LessonStudioSection({
  organizationId,
  canManage,
  myRole,
  currentUserId,
}: {
  organizationId: string;
  canManage: boolean;
  myRole: OrganizationRoleContract;
  currentUserId: string | null;
}): React.JSX.Element {
  const [lessons, setLessons] = useState<OrgLessonRow[] | null>(null);
  const [editingLesson, setEditingLesson] = useState<{
    lessonId: string;
    expectedVersion: number;
    stepClientIds: string[];
  } | null>(null);
  const [titleVi, setTitleVi] = useState("");
  const [objectiveVi, setObjectiveVi] = useState("");
  const [subjectId, setSubjectId] = useState<string>("math");
  const [gradeFrom, setGradeFrom] = useState("4");
  const [gradeTo, setGradeTo] = useState("4");
  const [steps, setSteps] = useState<PolymorphicDraftStep[]>(emptyDraftSteps);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void api
      .get<OrganizationLessonListResponse>(
        `${endpoints.orgLessons}?organizationId=${encodeURIComponent(organizationId)}`,
      )
      .then((res) => {
        if (!res.ok) {
          setError(failureMessage(res.failure));
          return;
        }
        setLessons(res.value.lessons ?? []);
      });
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditOrgLesson = (lessonId: string) => {
    setError(null);
    setNotice(null);
    setBusy(true);
    void api
      .get<LessonDetailResponse>(endpoints.lessonDetail(lessonId))
      .then((res) => {
        setBusy(false);
        if (!res.ok) {
          setError(failureMessage(res.failure));
          return;
        }
        const detail = res.value;
        setEditingLesson({
          lessonId: detail.id,
          expectedVersion: detail.version,
          stepClientIds: detail.steps.map((s) => s.id),
        });
        setTitleVi(detail.titleVi);
        setObjectiveVi(detail.objectiveVi);
        setSubjectId(detail.subjectId);
        // Preserve polymorphic ExerciseSpec (`multiple_choice`, `fraction_visual`,
        // `vocab_match`, `reading_comprehension`) and `answerKey` intact.
        setSteps(
          detail.steps.map((s) => ({
            position: s.position,
            kind: s.kind,
            content: s.content,
            answerKey: s.answerKey,
            explanationVi: s.explanationVi,
          })),
        );
        setNotice(`Đang chỉnh sửa “${detail.titleVi}” (Phiên bản hiện tại: ${detail.version}).`);
      });
  };

  const cancelEditOrgLesson = () => {
    setEditingLesson(null);
    setTitleVi("");
    setObjectiveVi("");
    setSteps(emptyDraftSteps());
    setNotice(null);
    setError(null);
  };

  /** Fill the form with a valid 5-step skeleton the author can customize or save directly. */
  const prefill = () => {
    setTitleVi("Bài học mẫu: quan sát và giải thích bằng dữ kiện");
    setObjectiveVi("Bé quan sát một hiện tượng và nêu được cách giải thích bằng dữ kiện.");
    setSteps(
      emptyDraftSteps().map((step, index) => ({
        ...step,
        content: {
          type: "multiple_choice" as const,
          question_vi: `Bước ${index + 1} (${STEP_KIND_LABELS[step.kind]}): Khi đặt khay nước vào ngăn đá tủ lạnh, hiện tượng gì sẽ xảy ra?`,
          choices: [
            { id: "a", label_vi: "Nước lỏng đông đặc thành nước đá rắn", correct: true },
            { id: "b", label_vi: "Nước biến mất hoàn toàn không còn lại gì", correct: false },
            { id: "c", label_vi: "Nước sôi lên ở nhiệt độ cao", correct: false },
            { id: "d", label_vi: "Nước biến thành kim loại", correct: false },
          ],
          hint1_vi: `Gợi ý 1 (Bước ${index + 1}): Hãy nhớ nhiệt độ trong ngăn đá rất thấp.`,
          hint2_vi: `Gợi ý 2 (Bước ${index + 1}): Khi gặp lạnh sâu, nước chuyển từ thể lỏng sang thể rắn.`,
          hint3_vi: `Gợi ý 3 (Bước ${index + 1}): Quá trình nước lỏng hóa rắn gọi là sự đông đặc.`,
        },
        answerKey: { correctChoiceId: "a" },
        explanationVi: `Giải thích bước ${index + 1}: Khi hạ nhiệt độ xuống thấp, nước lỏng đông đặc thành nước đá ở thể rắn.`,
      })),
    );
    setNotice("Đã điền sẵn khung 5 bước chuẩn. Bạn có thể chỉnh sửa hoặc lưu bản nháp ngay.");
  };

  const updateStep = (index: number, patch: Partial<PolymorphicDraftStep>) => {
    setSteps((current) => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const submitDraft = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!titleVi.trim() || !objectiveVi.trim()) {
      setError("Vui lòng nhập tên bài và mục tiêu bài học.");
      return;
    }
    if (steps.some((s) => s.content.question_vi.trim().length === 0)) {
      setError("Mỗi bước cần có câu hỏi bằng tiếng Việt.");
      return;
    }
    if (
      steps.some(
        (s) =>
          (s.content.type === "multiple_choice" ||
            s.content.type === "vocab_match" ||
            s.content.type === "reading_comprehension") &&
          s.content.choices.some((c) => c.label_vi.trim().length === 0),
      )
    ) {
      setError("Mỗi lựa chọn trong các bước trắc nghiệm/từ vựng/đọc hiểu cần có nội dung tiếng Việt.");
      return;
    }
    if (steps.some((s) => s.explanationVi.trim().length === 0)) {
      setError("Mỗi bước cần có lời giải thích hiện sau khi bé trả lời đúng.");
      return;
    }
    if (
      steps.some(
        (s) =>
          s.content.type === "multiple_choice" &&
          (s.content.hint1_vi.trim().length === 0 ||
            s.content.hint2_vi.trim().length === 0 ||
            s.content.hint3_vi.trim().length === 0),
      )
    ) {
      setError("Mỗi bước trắc nghiệm cần đủ 3 gợi ý tăng dần để bé không bị bí khi làm bài.");
      return;
    }
    if (editingLesson) {
      const updateBody: UpdateContentRequest = {
        lessonId: editingLesson.lessonId,
        expectedVersion: editingLesson.expectedVersion,
        titleVi: titleVi.trim(),
        objectiveVi: objectiveVi.trim(),
        steps: steps.map((s, idx) => ({
          clientId: editingLesson.stepClientIds[idx] ?? `${editingLesson.lessonId}-s${s.position}`,
          position: s.position,
          kind: s.kind,
          content: s.content,
          answerKey: s.answerKey,
          explanationVi: s.explanationVi.trim(),
        })),
      };
      setBusy(true);
      void api.post<UpdateContentResponse>(endpoints.updateContent, updateBody).then((res) => {
        setBusy(false);
        if (!res.ok) {
          setError(failureMessage(res.failure));
          return;
        }
        setNotice(
          `Đã cập nhật bài học lên phiên bản ${res.value.version} (trạng thái trở về Bản nháp).`,
        );
        setEditingLesson(null);
        setTitleVi("");
        setObjectiveVi("");
        setSteps(emptyDraftSteps());
        load();
      });
      return;
    }
    const gradeStart = Number.parseInt(gradeFrom, 10);
    const gradeEnd = Number.parseInt(gradeTo, 10);
    const body: CreateOrgLessonRequest = {
      organizationId,
      subjectId,
      titleVi: titleVi.trim(),
      titleEn: titleVi.trim(),
      objectiveVi: objectiveVi.trim(),
      objectiveEn: objectiveVi.trim(),
      gradeFrom: Number.isFinite(gradeStart) ? gradeStart : 4,
      gradeTo: Number.isFinite(gradeEnd) ? gradeEnd : 4,
      steps,
    };
    setBusy(true);
    void api.post<CreateOrgLessonResponse>(endpoints.orgLessonDraft, body).then((res) => {
      setBusy(false);
      if (!res.ok) {
        setError(failureMessage(res.failure));
        return;
      }
      setNotice("Đã lưu bản nháp bài học.");
      setTitleVi("");
      setObjectiveVi("");
      setSteps(emptyDraftSteps());
      load();
    });
  };

  const submitForReview = (lessonId: string) => {
    setError(null);
    setNotice(null);
    const body: SubmitOrgLessonReviewRequest = { lessonId, organizationId };
    void api.post<SubmitOrgLessonReviewResponse>(endpoints.orgLessonSubmit, body).then((res) => {
      if (!res.ok) {
        setError(failureMessage(res.failure));
        return;
      }
      setNotice("Đã gửi bài học cho trung tâm duyệt.");
      load();
    });
  };

  const review = (lessonId: string, decision: ReviewOrgLessonRequest["decision"]) => {
    setError(null);
    setNotice(null);
    const body: ReviewOrgLessonRequest = {
      lessonId,
      organizationId,
      decision,
      note: reviewNote.trim() || undefined,
    };
    void api.post<ReviewOrgLessonResponse>(endpoints.orgLessonReview, body).then((res) => {
      if (!res.ok) {
        setError(failureMessage(res.failure));
        return;
      }
      setNotice(decision === "org_approved" ? "Đã duyệt bài học." : "Đã từ chối bài học.");
      setReviewNote("");
      load();
    });
  };

  return (
    <section className="card" aria-labelledby="org-lesson-title">
      <h2 className="card__title" id="org-lesson-title">
        Soạn &amp; duyệt bài học của trung tâm
      </h2>
      <p className="org-studio__hint">
        Một bài học chỉ đến được bé sau khi đi đủ chuỗi: nháp → gửi duyệt → trung
        tâm duyệt → giao vào lớp → phụ huynh duyệt. Bước cuối luôn thuộc về phụ
        huynh, không thuộc về trung tâm. Bài đã được trung tâm duyệt không thể bị
        gửi duyệt lại khi chưa cập nhật nội dung mới.
      </p>
      {error ? (
        <p className="org-studio__notice org-studio__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="org-studio__notice org-studio__notice--ok" role="status">
          {notice}
        </p>
      ) : null}

      {lessons === null ? (
        <LoadingPanel what="danh sách bài học" />
      ) : lessons.length === 0 ? (
        <EmptyPanel title="Trung tâm chưa có bài học nào" />
      ) : (
        <table className="org-studio__table" data-testid="org-lessons-table">
          <thead>
            <tr>
              <th scope="col">Bài học</th>
              <th scope="col">Môn</th>
              <th scope="col">Bước</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => {
              const canEdit =
                canManage || (myRole === "teacher" && l.authorId === currentUserId);
              return (
                <tr key={l.lessonId}>
                  <td>
                    <strong>{l.titleVi}</strong>
                    <span className="org-studio__cellsub">{l.objectiveVi}</span>
                  </td>
                  <td>{SUBJECT_OPTIONS.find((s) => s.id === l.subjectId)?.labelVi ?? l.subjectId}</td>
                  <td>{l.stepCount}</td>
                  <td>
                    <span className={`org-studio__pill org-studio__pill--${l.reviewStatus}`}>
                      {REVIEW_STATUS_LABELS[l.reviewStatus]}
                    </span>
                  </td>
                  <td>
                    <div className="org-studio__actions">
                      {canEdit ? (
                        <button
                          type="button"
                          className="btn btn--small btn--secondary"
                          data-testid={`org-lesson-edit-btn-${l.lessonId}`}
                          onClick={() => startEditOrgLesson(l.lessonId)}
                          disabled={busy}
                        >
                          Chỉnh sửa
                        </button>
                      ) : null}
                      {canEdit &&
                      (l.reviewStatus === "draft" || l.reviewStatus === "org_rejected") ? (
                        <button
                          type="button"
                          className="btn btn--small"
                          data-testid="org-lesson-submit-btn"
                          onClick={() => submitForReview(l.lessonId)}
                        >
                          Gửi duyệt
                        </button>
                      ) : null}
                      {canManage && l.reviewStatus === "submitted" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn--small"
                            data-testid="org-lesson-approve-btn"
                            onClick={() => review(l.lessonId, "org_approved")}
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            className="btn btn--small btn--secondary"
                            data-testid="org-lesson-reject-btn"
                            onClick={() => review(l.lessonId, "org_rejected")}
                          >
                            Từ chối
                          </button>
                        </>
                      ) : null}
                      {l.reviewStatus === "org_approved" ? (
                        <span className="org-studio__hint">Đã duyệt — sẵn sàng giao cho lớp</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <form className="org-studio__form" onSubmit={submitDraft}>
        <div className="org-studio__formhead">
          <h3 className="org-studio__subtitle">
            {editingLesson
              ? `Chỉnh sửa bài học (Phiên bản hiện tại: ${editingLesson.expectedVersion})`
              : "Soạn bài học mới"}
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {editingLesson ? (
              <button
                type="button"
                className="btn btn--small btn--ghost"
                data-testid="org-lesson-cancel-edit-btn"
                onClick={cancelEditOrgLesson}
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--small"
              data-testid="org-lesson-prefill-btn"
              onClick={prefill}
            >
              Điền sẵn khung 5 bước
            </button>
          </div>
        </div>
        <div className="org-studio__grid">
          <label htmlFor="org-lesson-title-input">
            <span>Tên bài học</span>
            <input
              id="org-lesson-title-input"
              className="input"
              data-testid="org-lesson-title-input"
              value={titleVi}
              onChange={(e) => setTitleVi(e.target.value)}
            />
          </label>
          <label htmlFor="org-lesson-subject-select">
            <span>Môn</span>
            <select
              id="org-lesson-subject-select"
              className="select"
              data-testid="org-lesson-subject-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.labelVi}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="org-lesson-grade-from">
            <span>Lớp từ</span>
            <input
              id="org-lesson-grade-from"
              className="input"
              value={gradeFrom}
              onChange={(e) => setGradeFrom(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label htmlFor="org-lesson-grade-to">
            <span>Lớp đến</span>
            <input
              id="org-lesson-grade-to"
              className="input"
              value={gradeTo}
              onChange={(e) => setGradeTo(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label htmlFor="org-lesson-objective" className="org-studio__wide">
            <span>Mục tiêu bài học</span>
            <input
              id="org-lesson-objective"
              className="input"
              data-testid="org-lesson-objective-input"
              value={objectiveVi}
              onChange={(e) => setObjectiveVi(e.target.value)}
            />
          </label>
        </div>

        <div className="org-studio__steps">
          {steps.map((step, index) => {
            const spec = step.content;
            return (
              <fieldset className="org-studio__step" key={step.position}>
                <legend>{`Bước ${step.position} · ${STEP_KIND_LABELS[step.kind]} (${spec.type})`}</legend>
                <label htmlFor={`org-step-prompt-${step.position}`}>
                  <span>Câu hỏi bằng tiếng Việt</span>
                  <input
                    id={`org-step-prompt-${step.position}`}
                    className="input"
                    data-testid={`org-step-prompt-${step.position}`}
                    value={spec.question_vi}
                    onChange={(e) =>
                      updateStep(index, {
                        content: { ...spec, question_vi: e.target.value } as ExerciseSpec,
                      })
                    }
                  />
                </label>
                {spec.type === "multiple_choice" ? (
                  <>
                    <div className="org-studio__choices">
                      {spec.choices.map((choice, choiceIndex) => (
                        <span className="org-studio__choice" key={choice.id}>
                          <span className="org-studio__choice-id">{choice.id}</span>
                          <input
                            className="input"
                            aria-label={`Đáp án ${choice.id} của bước ${step.position}`}
                            data-testid={`org-step-choice-${step.position}-${choice.id}`}
                            value={choice.label_vi}
                            onChange={(e) =>
                              updateStep(index, {
                                content: {
                                  ...spec,
                                  choices: spec.choices.map((c, i) =>
                                    i === choiceIndex ? { ...c, label_vi: e.target.value } : c,
                                  ),
                                },
                              })
                            }
                          />
                          <label className="org-studio__correct">
                            <input
                              type="radio"
                              name={`org-step-correct-${step.position}`}
                              checked={choice.correct}
                              onChange={() =>
                                updateStep(index, {
                                  content: {
                                    ...spec,
                                    choices: spec.choices.map((c, i) => ({
                                      ...c,
                                      correct: i === choiceIndex,
                                    })),
                                  },
                                  answerKey: { correctChoiceId: choice.id },
                                })
                              }
                            />
                            <span>Đáp án đúng</span>
                          </label>
                        </span>
                      ))}
                    </div>
                    <div className="org-studio__hints">
                      {(["hint1_vi", "hint2_vi", "hint3_vi"] as const).map((key) => (
                        <label key={key} htmlFor={`org-step-${key}-${step.position}`}>
                          <span>Gợi ý {key === "hint1_vi" ? "1" : key === "hint2_vi" ? "2" : "3"}</span>
                          <input
                            id={`org-step-${key}-${step.position}`}
                            className="input"
                            data-testid={`org-step-${key}-${step.position}`}
                            value={spec[key]}
                            onChange={(e) =>
                              updateStep(index, { content: { ...spec, [key]: e.target.value } })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}
                {spec.type === "fraction_visual" ? (
                  <p className="org-studio__hint" data-testid={`org-step-fraction-summary-${step.position}`}>
                    {`Dạng hình phân số (thanh ${spec.bar.parts} phần): ${spec.correctNumerator}/${spec.correctDenominator} (được bảo toàn cấu trúc khi lưu).`}
                  </p>
                ) : null}
                {spec.type === "vocab_match" ? (
                  <p className="org-studio__hint" data-testid={`org-step-vocab-summary-${step.position}`}>
                    {`Dạng từ vựng (${spec.word} — hình ${spec.image}): bảo toàn cấu trúc từ vựng & câu điền từ khi lưu.`}
                  </p>
                ) : null}
                {spec.type === "reading_comprehension" ? (
                  <p className="org-studio__hint" data-testid={`org-step-reading-summary-${step.position}`}>
                    {`Dạng đọc hiểu (${spec.passageTitle_vi}): bảo toàn đoạn văn & câu dẫn chứng khi lưu.`}
                  </p>
                ) : null}
                <label htmlFor={`org-step-explanation-${step.position}`}>
                  <span>Giải thích hiện sau khi trả lời đúng</span>
                  <input
                    id={`org-step-explanation-${step.position}`}
                    className="input"
                    data-testid={`org-step-explanation-${step.position}`}
                    value={step.explanationVi}
                    onChange={(e) => updateStep(index, { explanationVi: e.target.value })}
                  />
                </label>
              </fieldset>
            );
          })}
        </div>

        <button type="submit" className="btn" data-testid="org-lesson-save-btn" disabled={busy}>
          {busy
            ? "Đang lưu…"
            : editingLesson
              ? `Lưu thành phiên bản ${editingLesson.expectedVersion + 1}`
              : "Lưu bản nháp"}
        </button>
      </form>
    </section>
  );
}
