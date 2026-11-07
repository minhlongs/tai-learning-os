/**
 * One session fetch per app mount, shared across the router and every screen.
 *
 * Calling `useSession()` directly in both `Router` and `DashboardScreen` ran
 * two parallel `GET /api/session` requests on every navigation. The provider
 * holds the single `useSession()` instance; screens read it with
 * `useSessionContext()` from `./session-context`.
 */

import { useMemo, type ReactNode } from "react";
import { SessionContext } from "./session-context";
import { useSession } from "./useSession";

export function SessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { loading, session, error, reload, updateSession, selectLearner } = useSession();
  const memo = useMemo(
    () => ({ loading, session, error, reload, updateSession, selectLearner }),
    [loading, session, error, reload, updateSession, selectLearner],
  );
  return <SessionContext.Provider value={memo}>{children}</SessionContext.Provider>;
}
