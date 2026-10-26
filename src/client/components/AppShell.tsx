/**
 * The app shell: top bar + page frame.
 *
 * It is deliberately dumb — it knows the session's display name and the
 * learner's nickname, both of which come from `GET /api/session`, and nothing
 * else. Every screen supplies its own children.
 */

import type { ReactNode } from "react";
import "./TopBar.css";

export type AppShellProps = {
  parentName: string | null;
  learnerNickname: string | null;
  children: ReactNode;
  onNavigate: (to: string) => void;
  onLogout: () => void;
  /** Which nav links to show; the learner area has no parent navigation. */
  area: "learner" | "parent";
  mode?: "parent" | "learner" | null;
  onEnterChildMode?: () => void;
};

export function AppShell({
  parentName,
  learnerNickname,
  children,
  onNavigate,
  onLogout,
  area,
  mode,
  onEnterChildMode,
}: AppShellProps): React.JSX.Element {
  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar__brand">
          TAI LEARNING OS
          <span className="topbar__brand-sub">Hệ điều hành học tập của bé</span>
        </span>

        <span className="topbar__spacer" />

        <nav className="topbar__nav" aria-label="Điều hướng chính">
          {area === "learner" ? (
            <>
              <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/")}>
                Trang học tập
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent")}
              >
                {mode === "learner" ? "Khu phụ huynh (cần mật khẩu)" : "Khu phụ huynh"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent")}
              >
                Tổng quan
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent/curriculum")}
              >
                Chương trình
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent/baseline")}
              >
                Đánh giá đầu vào
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent/planner")}
              >
                Kế hoạch 4 tuần
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent/lessons")}
              >
                Bài học
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onNavigate("/parent/data")}
              >
                Dữ liệu
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => onNavigate("/")}>
                Trang học tập
              </button>
              {onEnterChildMode ? (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={onEnterChildMode}
                  data-testid="enter-child-mode"
                >
                  Giao máy cho bé
                </button>
              ) : null}
            </>
          )}
        </nav>

        <span className="topbar__who">
          {parentName ? `Phụ huynh: ${parentName}` : "Chưa đăng nhập"}
          {learnerNickname ? ` · Bé: ${learnerNickname}` : ""}
          {mode === "learner" ? " · Chế độ của bé" : ""}
        </span>

        <button
          type="button"
          className="btn btn--ghost topbar__logout"
          onClick={onLogout}
        >
          Đăng xuất
        </button>
      </header>

      <main className="page">{children}</main>
    </div>
  );
}
