"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AuthCard from "@/components/AuthCard";
import { Notice } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME, type Role } from "@/lib/data";

/** Only follow `next` if it is a page inside the user's own portal. */
function destination(role: Role, next: string | null) {
  const prefix = ROLE_HOME[role];
  if (next && (next === prefix || next.startsWith(prefix + "/") || next.startsWith(prefix + "?"))) return next;
  return prefix;
}

export default function LoginForm() {
  const { status, user, login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just signed in): go to the portal.
  useEffect(() => {
    if (status !== "authed" || !user) return;
    router.replace(user.mustChangePassword ? "/change-password" : destination(user.role, next));
  }, [status, user, next, router]);

  return (
    <AuthCard
      title="Sign in"
      subtitle="Students, recruiters and the placement cell all sign in here."
      footer={
        <>
          Recruiter without an account?{" "}
          <Link href="/register" className="font-medium text-indigo-600 dark:text-indigo-300">
            Register your company
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await login(email, password);
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">Students receive a temporary password from the placement cell. Forgot yours? Ask the cell to reset it.</p>
      </form>
    </AuthCard>
  );
}
