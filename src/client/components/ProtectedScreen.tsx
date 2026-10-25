/**
 * Gate + shell in one component.
 *
 * The router already proved a parent session exists; this component renders the
 * shared top bar with that session's identity and applies the screen's own body
 * inside the page frame. Keeping that in one place means the learner area and
 * the parent area cannot drift apart in navigation or sign-out behaviour.
 */

import { useCallback, useState, type ReactNode } from "react";
import type { SessionInfo } from "../../shared/api-contract";
import { api } from "../lib/api";
import { clearCsrfToken } from "../lib/csrf-store";
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

  const onNavigate = useCallback((to: string) => navigate(to), []);

  const onLogout = useCallback(() => {
    setSigningOut(true);
    void api.post<{ loggedOut: true }>("/api/session/logout").then(() => {
      clearCsrfToken();
      navigate("/login");
    });
  }, []);

  return (
    <AppShell
      area={area}
      parentName={session.parentDisplayName}
      learnerNickname={session.learner?.nickname ?? null}
      onNavigate={onNavigate}
      // Disable, don't hide: a second click during sign-out must not fire twice.
      onLogout={signingOut ? () => undefined : onLogout}
    >
      {children}
    </AppShell>
  );
}
