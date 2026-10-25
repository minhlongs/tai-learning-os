/**
 * One `/api/session` read for the whole app.
 *
 * The router's auth gate and every screen need the same value. Without a
 * provider each screen would re-fetch it; with one, the request happens once on
 * mount and the CSRF token stays in one place.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SessionInfo } from "../../shared/api-contract";
import { useSession } from "./useSession";

export type SessionContextValue = ReturnType<typeof useSession>;

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const value = useSession();
  const memo = useMemo(() => value, [value.loading, value.session, value.error]);
  return <SessionContext.Provider value={memo}>{children}</SessionContext.Provider>;
}

export function useSessionContext(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSessionContext must be used inside SessionProvider.");
  return value;
}

/** The non-null session, only safe to call behind the router's auth gate. */
export function useAuthenticatedSession(): SessionInfo {
  const { session } = useSessionContext();
  return session;
}
