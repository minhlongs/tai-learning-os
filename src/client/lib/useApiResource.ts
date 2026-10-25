/**
 * Load one GET resource with loading / error / reload state.
 *
 * Screens repeat this pattern constantly; one hook keeps the "ignore a late
 * response after unmount" rule in a single place.
 */

import { useCallback, useEffect, useState } from "react";
import { api, failureMessage } from "./api";

export type Resource<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

export function useApiResource<T>(path: string | null): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The initial value already covers the mount fetch, so the effect only ever
  // clears it. Turning the spinner ON belongs in the reload handler, where it
  // runs in an event rather than mid-effect.
  const [loading, setLoading] = useState(path !== null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    // A null path means "there is nothing to load yet": the initial state
    // already reports that, so the effect has nothing to set.
    if (path === null) return;
    let live = true;
    void api.get<T>(path).then((result) => {
      if (!live) return;
      if (result.ok) {
        setData(result.value);
        setError(null);
      } else {
        setError(failureMessage(result.failure));
      }
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [path, nonce]);

  const reload = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);
  return { data, error, loading, reload };
}
