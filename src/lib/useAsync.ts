// Minimal async-data hook: tracks loading/error and supports manual reload.

import { useEffect, useState } from "react";

/**
 * Turn anything thrown into a readable string. Supabase/PostgREST reject with a
 * plain object ({ message, details, hint, code }), not an Error — without this,
 * such failures stringify to the useless "[object Object]".
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const parts = [o.message, o.details, o.hint, o.code].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  }
  return String(e);
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    factory()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          // Log the raw error so the console shows the full object (status, code, hint).
          console.error("useAsync fetch failed:", e);
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
