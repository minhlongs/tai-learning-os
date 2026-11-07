/**
 * React context and hooks for the shared session state provided by `SessionProvider`.
 *
 * Separated from `SessionProvider.tsx` so the component module exports only the
 * React component and satisfies `react-refresh/only-export-components`.
 */

import { createContext, useContext } from "react";
import type { SessionInfo } from "../../shared/api-contract";
import type { useSession } from "./useSession";

export type SessionContextValue = ReturnType<typeof useSession>;

export const SessionContext = createContext<SessionContextValue | null>(null);

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
