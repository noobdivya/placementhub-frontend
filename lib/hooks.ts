"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";

type Query = Record<string, string | number | boolean | undefined | null>;

export interface Fetched<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (fn: (prev: T | null) => T | null) => void;
}

interface State<T> {
  /** Which request produced this state. */
  req: string | null;
  data: T | null;
  error: string | null;
}

/**
 * GET `path` (with `query`) whenever they change. Stale responses are dropped, so
 * quickly changing filters can never show results for an older query. While a new
 * request is in flight the previous data stays available (`loading` is true).
 * Pass `null` to skip fetching.
 */
export function useFetch<T>(path: string | null, query?: Query): Fetched<T> {
  const [state, setState] = useState<State<T>>({ req: null, data: null, error: null });
  const [tick, setTick] = useState(0);
  const req = path === null ? null : `${path}?${JSON.stringify(query ?? {})}#${tick}`;

  useEffect(() => {
    if (req === null || path === null) return;
    let live = true;
    api
      .get<T>(path, query)
      .then((data) => live && setState({ req, data, error: null }))
      .catch((e) => live && setState((s) => ({ req, data: s.data, error: errorMessage(e) })));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `req` captures path, query and reloads
  }, [req]);

  const settled = state.req === req;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((fn: (prev: T | null) => T | null) => setState((s) => ({ ...s, data: fn(s.data) })), []);
  return { data: state.data, error: settled ? state.error : null, loading: req !== null && !settled, reload, setData };
}

/** Debounce a fast-changing value such as a search box. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
