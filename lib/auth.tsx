"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, changePassword as apiChangePassword, login as apiLogin, logout as apiLogout, refreshSession, subscribeSession, type SessionUser } from "./api";
import type { CompanyRecord, StudentProfile } from "./data";

/** What GET /me returns beyond the account itself. */
export interface Me {
  user: SessionUser;
  student?: StudentProfile;
  company?: CompanyRecord;
}

interface AuthState {
  /** `loading` until we know whether a session exists. */
  status: "loading" | "anon" | "authed";
  user: SessionUser | null;
  me: Me | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  changePassword: (current: string, next: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** Re-read /me (after a profile edit, say). */
  reloadMe: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

// A hint that a refresh cookie probably exists, so anonymous visitors of public
// pages don't fire a pointless (401) refresh request on every page load.
const HINT = "ph_session";
const hint = {
  get: () => {
    try {
      return localStorage.getItem(HINT) === "1";
    } catch {
      return false;
    }
  },
  set: (on: boolean) => {
    try {
      if (on) localStorage.setItem(HINT, "1");
      else localStorage.removeItem(HINT);
    } catch {}
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const reloadMe = useCallback(async () => {
    try {
      setMe(await api.get<Me>("/me"));
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    // Fires for sign-in, refresh, and a refresh that failed (session lost → null).
    const unsub = subscribeSession((u) => {
      setUser(u);
      setStatus(u ? "authed" : "anon");
      if (!u) {
        setMe(null);
        hint.set(false);
      } else hint.set(true);
    });
    // A failed refresh reports through the subscription; with no hint there's nothing to try.
    (hint.get() ? refreshSession() : Promise.resolve(null)).then((u) => {
      if (!u) setStatus("anon");
    });
    return unsub;
  }, []);

  const uid = user?.id;
  const must = user?.mustChangePassword;
  // /me is refused while a temporary password is still active; the guard sends the user to change it first.
  useEffect(() => {
    if (!uid || must) return;
    let live = true;
    api
      .get<Me>("/me")
      .then((m) => live && setMe(m))
      .catch(() => live && setMe(null));
    return () => {
      live = false;
    };
  }, [uid, must]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      me,
      login: apiLogin,
      changePassword: apiChangePassword,
      logout: apiLogout,
      reloadMe,
    }),
    [status, user, me, reloadMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
