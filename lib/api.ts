// ---------------------------------------------------------------------------
// API client for the Placement Hub backend.
//
// The access token lives only in memory. The refresh token is an httpOnly
// cookie scoped to the API's `/auth` path, so it is only ever sent to
// /auth/* calls (with `credentials: "include"`). Any authenticated request
// first makes sure a fresh access token exists; a 401 triggers one refresh
// and one retry.
// ---------------------------------------------------------------------------

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export type Role = "student" | "company" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
}

interface SessionResponse {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** A readable message for any thrown value, including per-field validation errors. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const f = e.fields ? Object.entries(e.fields).map(([k, v]) => `${k}: ${v}`) : [];
    return f.length ? `${e.message} (${f.join("; ")})` : e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

// ---- session state --------------------------------------------------------

let accessToken: string | null = null;
let expiresAt = 0;
let onSession: ((u: SessionUser | null) => void) | null = null;

/** The auth provider registers here to hear about sign-ins and forced sign-outs. */
export function subscribeSession(fn: (u: SessionUser | null) => void) {
  onSession = fn;
  return () => {
    if (onSession === fn) onSession = null;
  };
}

function setSession(s: SessionResponse | null) {
  accessToken = s?.accessToken ?? null;
  expiresAt = s ? new Date(s.expiresAt).getTime() : 0;
  onSession?.(s?.user ?? null);
}

// A single refresh in flight at a time. React strict mode, several components
// mounting together, and other tabs (via Web Locks) must never present the same
// rotating refresh cookie twice: the server treats that as token theft.
let refreshing: Promise<SessionResponse | null> | null = null;

interface RefreshResult {
  session: SessionResponse | null;
  /** The server said the refresh cookie is no good (as opposed to being busy or unreachable). */
  rejected: boolean;
}

async function doRefresh(): Promise<RefreshResult> {
  const run = async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (res.ok) return { session: (await res.json()) as SessionResponse, rejected: false };
      return { session: null, rejected: res.status === 401 || res.status === 403 };
    } catch {
      return { session: null, rejected: false };
    }
  };
  return typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request("ph-refresh", run) : run();
}

/**
 * Get a session using the refresh cookie. Resolves null when there is none. Only a
 * definite rejection signs the user out; a rate limit or network blip leaves the
 * current session alone so the next action can simply try again.
 */
export function refreshSession(): Promise<SessionUser | null> {
  refreshing ??= doRefresh()
    .then((r) => {
      if (r.session || r.rejected) setSession(r.session);
      return r.session;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing.then((s) => s?.user ?? null);
}

async function ensureToken(): Promise<string | null> {
  if (accessToken && Date.now() < expiresAt - 20_000) return accessToken;
  await refreshSession();
  return accessToken;
}

async function authed(path: string, init: RequestInit): Promise<Response> {
  const send = async () => {
    const token = await ensureToken();
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_URL}${path}`, { ...init, headers });
  };
  let res = await send();
  if (res.status === 401) {
    accessToken = null; // force a refresh; the failed token is no good
    res = await send();
  }
  return res;
}

async function toError(res: Response): Promise<ApiError> {
  let body: { error?: { code?: string; message?: string; fields?: Record<string, string> } } = {};
  try {
    body = await res.json();
  } catch {}
  const e = body.error;
  return new ApiError(res.status, e?.code ?? "error", e?.message ?? `Request failed (${res.status})`, e?.fields);
}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query) {
  if (!query) return path;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `${path}?${s}` : path;
}

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown; form?: FormData; public?: boolean } = {}): Promise<T> {
  const url = withQuery(path, opts.query);
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const init: RequestInit = { method, headers, body };
  const res = opts.public ? await fetch(`${API_URL}${url}`, init) : await authed(url, init);
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  del: <T>(path: string, query?: Query) => request<T>("DELETE", path, { query }),
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, { form }),

  /** Fetch a file with the bearer token and hand it to the browser as a download. */
  async download(path: string, fallbackName: string, query?: Query) {
    const res = await authed(withQuery(path, query), { method: "GET" });
    if (!res.ok) throw await toError(res);
    const cd = res.headers.get("Content-Disposition") ?? "";
    const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)?.[1];
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name ? decodeURIComponent(name) : fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  },
};

/**
 * Unauthenticated read used by public pages (also safe on the server). Bounded to 8s: this
 * runs during Next.js static generation (build time) as well as ISR revalidation, and an
 * unbounded fetch against a cold/sleeping backend (e.g. Render's free tier) would otherwise
 * hang past Vercel's per-page build timeout and fail the whole deploy. Callers already treat
 * a rejected promise as "backend unavailable, fall back to defaults" (see app/page.tsx).
 */
export async function publicGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(8_000), ...init });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

// ---- auth calls -----------------------------------------------------------

async function authCall(path: string, body?: unknown, token?: boolean): Promise<SessionResponse> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) {
    const t = await ensureToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as SessionResponse;
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const s = await authCall("/auth/login", { email, password });
  setSession(s);
  return s.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<SessionUser> {
  const s = await authCall("/auth/change-password", { currentPassword, newPassword }, true);
  setSession(s);
  return s.user;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {}
  setSession(null);
}

export interface CompanyRegistration {
  companyName: string;
  industry: string;
  hrName: string;
  email: string;
  phone: string;
  password: string;
}

export function registerCompany(input: CompanyRegistration) {
  return request<{ message: string }>("POST", "/auth/register/company", { body: input, public: true });
}
