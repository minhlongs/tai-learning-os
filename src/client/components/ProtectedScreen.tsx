/**
 * Gate + shell in one component.
 *
 * The router already proved a parent session exists; this component renders the
 * shared top bar with that session's identity and applies the screen's own body
 * inside the page frame. Keeping that in one place means the learner area and
 * the parent area cannot drift apart in navigation or sign-out behaviour.
 */

import { useCallback, useState, type ReactNode } from "react";
import type { SessionInfo, SwitchSessionModeRequest } from "../../shared/api-contract";
import { api, failureMessage } from "../lib/api";
import { clearCsrfToken } from "../lib/csrf-store";
import { endpoints } from "../lib/endpoints";
import { useSessionContext } from "../lib/SessionProvider";
import { navigate } from "../App";
import { AppShell, type AppShellProps } from "./AppShell";

export type ProtectedScreenProps = {
  area: AppShellProps["area"];
  session: SessionInfo;
  children: ReactNode;
};

export function ProtectedScreen({
  area,
  session,
  children,
}: ProtectedScreenProps): React.JSX.Element {
  const [signingOut, setSigningOut] = useState(false);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const { updateSession } = useSessionContext();

  const onNavigate = useCallback(
    (to: string) => {
      if (to.startsWith("/parent") && session.mode === "learner") {
        setPendingTarget(to);
        setPassword("");
        setPasswordError(null);
        setPasswordPromptOpen(true);
        return;
      }
      navigate(to);
    },
    [session.mode],
  );

  const onLogout = useCallback(() => {
    setSigningOut(true);
    void api.post<{ loggedOut: true }>("/api/session/logout").then(() => {
      clearCsrfToken();
      navigate("/login");
    });
  }, []);

  const handleEnterChildMode = useCallback(() => {
    setSwitching(true);
    const body: SwitchSessionModeRequest = { mode: "learner" };
    void api.post<SessionInfo>(endpoints.sessionMode, body).then((res) => {
      setSwitching(false);
      if (res.ok) {
        updateSession(res.value);
        navigate("/");
      }
    });
  }, [updateSession]);

  const handleUnlockParentMode = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!password) {
        setPasswordError("Vui lòng nhập mật khẩu phụ huynh.");
        return;
      }
      setSwitching(true);
      setPasswordError(null);
      const body: SwitchSessionModeRequest = { mode: "parent", password };
      void api.post<SessionInfo>(endpoints.sessionMode, body).then((res) => {
        setSwitching(false);
        if (res.ok) {
          updateSession(res.value);
          setPasswordPromptOpen(false);
          const target = pendingTarget ?? "/parent";
          setPendingTarget(null);
          navigate(target);
        } else {
          setPasswordError(failureMessage(res.failure));
        }
      });
    },
    [password, pendingTarget, updateSession],
  );

  return (
    <AppShell
      area={area}
      mode={session.mode}
      parentName={session.parentDisplayName}
      learnerNickname={session.learner?.nickname ?? null}
      onNavigate={onNavigate}
      onEnterChildMode={session.mode !== "learner" ? handleEnterChildMode : undefined}
      // Disable, don't hide: a second click during sign-out must not fire twice.
      onLogout={signingOut || switching ? () => undefined : onLogout}
    >
      {passwordPromptOpen ? (
        <div className="card" style={{ maxWidth: "480px", margin: "2rem auto" }} role="dialog" aria-labelledby="unlock-title">
          <h2 id="unlock-title" className="card__title">Xác nhận mật khẩu phụ huynh</h2>
          <p className="card__note">
            Thiết bị đang ở chế độ dành cho bé. Để truy cập bảng theo dõi, duyệt bài học hoặc dữ liệu, vui lòng nhập mật khẩu phụ huynh.
          </p>
          <form onSubmit={handleUnlockParentMode}>
            <div className="field">
              <label className="field__label" htmlFor="parent-unlock-password">
                Mật khẩu phụ huynh
              </label>
              <input
                id="parent-unlock-password"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={switching}
                autoFocus
              />
            </div>
            {passwordError ? (
              <p className="data-control__notice data-control__notice--error" role="alert">
                {passwordError}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" className="btn btn--primary" disabled={switching}>
                {switching ? "Đang mở khóa…" : "Mở khóa khu phụ huynh"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setPasswordPromptOpen(false);
                  setPendingTarget(null);
                }}
                disabled={switching}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}
