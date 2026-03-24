"use client";

import { useState, useCallback, useRef } from "react";

type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type UseApiReturn<T> = UseApiState<T> & {
  execute: (url: string, options?: RequestInit) => Promise<T | null>;
};

export function useApi<T>(): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const activeRef = useRef(0);

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<T | null> => {
      const id = ++activeRef.current;
      setState((s) => ({ ...s, loading: true, error: null }));

      const attempt = async (): Promise<Response> => {
        try {
          const res = await fetch(url, options);
          return res;
        } catch (err) {
          // Retry once on network failure
          try {
            const res = await fetch(url, options);
            return res;
          } catch {
            throw err;
          }
        }
      };

      try {
        const res = await attempt();
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(text || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as T;
        if (id === activeRef.current) {
          setState({ data, loading: false, error: null });
        }
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        if (id === activeRef.current) {
          setState((s) => ({ ...s, loading: false, error: message }));
        }
        return null;
      }
    },
    [],
  );

  return { ...state, execute };
}
