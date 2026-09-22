"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthCard from "@/components/AuthCard";
import { Notice, Spinner } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/data";

export default function ChangePasswordPage() {
  const { status, user, changePassword, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anon") router.replace("/login");
  }, [status, router]);

  if (status !== "authed" || !user)
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <AuthCard
      title={user.mustChangePassword ? "Choose a new password" : "Change password"}
      subtitle={user.mustChangePassword ? "You are using a temporary password. Set your own to continue." : "You will be signed out of your other devices."}
      footer={
        <button
          className="font-medium text-indigo-600 dark:text-indigo-300"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (next !== again) return setError("The new passwords don't match.");
          setBusy(true);
          setError(null);
          try {
            const u = await changePassword(current, next);
            router.replace(ROLE_HOME[u.role]);
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <div>
          <label className="label" htmlFor="current">
            {user.mustChangePassword ? "Temporary password" : "Current password"}
          </label>
          <input id="current" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="new">
            New password (8–72 characters)
          </label>
          <input id="new" className="input" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={next} onChange={(e) => setNext(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="again">
            Repeat new password
          </label>
          <input id="again" className="input" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}
