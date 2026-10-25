/**
 * The session hook: one `GET /api/session` on mount, then React state.
 *
 * The CSRF token is mirrored into the module store so `lib/api.ts` can attach it
 * to mutating requests without every screen threading it through props.
 */

import { useCallback, useEffect, useState } from "react";
import type { SessionInfo } from "../../shared/api-contract";
import { api, type ApiFailure } from "./api";
import { clearCsrfToken, setCsrfToken } from "./csrf-store";

const ANONYMOUS: SessionInfo = {
  authenticated: false,
  parentDisplayName: null,
  learner: null,
  csrfToken: null,
};

export type SessionState = {
  loading: boolean;
  session: SessionInfo;
  error: ApiFailure | null;
  reload: () => void;
};

/** Remember a session the server just issued (login / bootstrap). */
export function adoptSession(info: SessionInfo): void {
  setCsrfToken(info.csrfToken);
}

export function forgetSession(): void {
  clearCsrfToken();
}

export function useSession(): SessionState {
  const [session, setSession] = useState<SessionInfo>(ANONYMOUS);
  // Starts true: the mount fetch is already in flight, so the effect never has
  // to turn the spinner on itself. A reload does, from its own event handler.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    void api.get<SessionInfo>("/api/session").then((result) => {
      if (!live) return;
      if (result.ok) {
        setSession(result.value);
        setCsrfToken(result.value.csrfToken);
        setError(null);
      } else {
        // An unauthenticated result still tells us the app is reachable.
        if (result.failure.kind === "unauthorized") setSession(ANONYMOUS);
        setError(result.failure);
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);
  return { loading, session, error, reload };
}
