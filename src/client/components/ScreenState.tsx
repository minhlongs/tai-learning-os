/**
 * Shared state placeholders: loading, empty, error.
 *
 * These exist so a screen never has to invent copy for "no data yet" — the
 * Vietnamese wording is decided once, in one place, for every screen.
 */

import type { ReactNode } from "react";
import "./StatePanel.css";

type PanelProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
};

/** A block that owns its own landmark label and is easy to find in tests. */
export function StatePanel({
  title,
  children,
  action,
  tone = "neutral",
}: PanelProps): React.JSX.Element {
  return (
    <section
      className={`state-panel state-panel--${tone}`}
      role="status"
      aria-live="polite"
    >
      <h2 className="state-panel__title">{title}</h2>
      {children ? <div className="state-panel__body">{children}</div> : null}
      {action ? <div className="state-panel__action">{action}</div> : null}
    </section>
  );
}

export function LoadingPanel({ what }: { what: string }): React.JSX.Element {
  return (
    <section className="state-panel state-panel--loading" aria-busy="true">
      <p className="state-panel__title">Đang tải {what}…</p>
    </section>
  );
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}): React.JSX.Element {
  return (
    <StatePanel title="Có lỗi xảy ra" tone="error">
      <p>{message}</p>
      {onRetry ? (
        <div className="state-panel__action">
          <button type="button" className="btn btn--secondary" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      ) : null}
    </StatePanel>
  );
}

/** The honest empty state: nothing was recorded, and nothing is invented. */
export function EmptyPanel({
  title = "Chưa có dữ liệu",
  children,
}: PanelProps): React.JSX.Element {
  return (
    <section className="state-panel">
      <h2 className="state-panel__title">{title}</h2>
      {children ? <div className="state-panel__body">{children}</div> : null}
    </section>
  );
}
