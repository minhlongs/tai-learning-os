/**
 * Parent sign-in, and first-run account creation.
 *
 * Two forms, one screen: `login` posts to `/api/session/login`; `bootstrap`
 * posts to `/api/session/bootstrap`, which the Worker refuses once a parent row
 * exists. Bootstrap returns `{created:true}` WITHOUT a CSRF token, so after a
 * successful creation the screen re-reads `/api/session` before navigating.
 *
 * Failure copy is Vietnamese and never reveals whether the name or the password
 * was wrong — the Worker cannot be used to enumerate accounts either.
 */

import { useState } from "react";
import { api, failureMessage, type ApiResult } from "../lib/api";
import { forgetSession } from "../lib/useSession";
import { useSessionContext } from "../lib/SessionProvider";
import type { SessionInfo } from "../../shared/api-contract";
import { navigate } from "../App";
import "../styles/login.css";

type Mode = "login" | "bootstrap";

export function LoginScreen(): React.JSX.Element {
  const { reload: reloadSession } = useSessionContext();
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode): void {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const name = displayName.trim();
    if (name.length === 0) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (password.length === 0) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setBusy(true);
    const result: ApiResult<SessionInfo | { created: true }> =
      mode === "login"
        ? await api.post<SessionInfo>("/api/session/login", { displayName: name, password })
        : await api.post<{ created: true }>("/api/session/bootstrap", {
            displayName: name,
            password,
          });
    setBusy(false);

    if (!result.ok) {
      forgetSession();
      setError(failureMessage(result.failure));
      return;
    }

    // The cookie is set, so the server now considers this browser signed in —
    // but the router renders on the session in React state, which still says
    // anonymous. Re-reading it is what actually moves the app off /login;
    // pushing a URL alone changes the address bar and nothing else.
    const session = await api.get<SessionInfo>("/api/session");
    if (session.ok && session.value.authenticated) {
      await reloadSession();
      navigate("/");
      return;
    }
    navigate("/login");
  }

  const creating = mode === "bootstrap";

  return (
    <div className="login">
      <main className="login__card">
        <h1 className="login__title">TAI LEARNING OS</h1>
        <p className="login__lede">
          {creating
            ? "Tạo tài khoản phụ huynh cho lần đầu sử dụng. Mật khẩu tối thiểu 10 ký tự."
            : "Đăng nhập bằng tài khoản phụ huynh để vào khu học tập."}
        </p>

        {error ? (
          <p className="login__error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="login__notice" role="status">
            {notice}
          </p>
        ) : null}

        <form className="login__form" onSubmit={(e) => void onSubmit(e)} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="login-name">
              Tên đăng nhập
            </label>
            <input
              id="login-name"
              className="input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="username"
              required
              aria-describedby="login-name-hint"
            />
            <span className="input-note" id="login-name-hint">
              Tên phụ huynh dùng để đăng nhập.
            </span>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Mật khẩu
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={creating ? "new-password" : "current-password"}
              required
              aria-describedby="login-password-hint"
            />
            <span className="input-note" id="login-password-hint">
              {creating
                ? "Tối thiểu 10 ký tự. Chỉ dùng được khi chưa có tài khoản nào."
                : "Mật khẩu của tài khoản phụ huynh."}
            </span>
          </div>

          <button type="submit" className="btn btn--primary btn--large btn--block" disabled={busy}>
            {busy
              ? "Đang xử lý…"
              : creating
                ? "Tạo tài khoản"
                : "Đăng nhập"}
          </button>
        </form>

        <div className="login__switch">
          {creating ? (
            <button type="button" className="btn btn--secondary" onClick={() => switchMode("login")}>
              Tôi đã có tài khoản — đăng nhập
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => switchMode("bootstrap")}
            >
              Lần đầu dùng — tạo tài khoản phụ huynh
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
