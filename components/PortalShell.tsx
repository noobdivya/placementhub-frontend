"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import NotificationBell from "./NotificationBell";
import Shell, { type NavItem } from "./Shell";
import { Spinner } from "./ui";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME, type Role } from "@/lib/data";

/**
 * Guards a portal: only a signed-in user of `role` gets through. Everyone else is
 * sent to sign in (or to their own portal, or to replace a temporary password).
 */
export default function PortalShell({ role, portal, nav, children }: { role: Role; portal: string; nav: NavItem[]; children: ReactNode }) {
  const { status, user, me, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = status === "authed" && user?.role === role && !user?.mustChangePassword;

  useEffect(() => {
    if (status === "anon") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authed" && user) {
      if (user.mustChangePassword) router.replace("/change-password");
      else if (user.role !== role) router.replace(ROLE_HOME[user.role]);
    }
  }, [status, user, role, router, pathname]);

  if (!allowed || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  const label =
    role === "student"
      ? me?.student
        ? `${me.student.branch} · ${me.student.roll}`
        : "Student"
      : role === "company"
        ? me?.company
          ? `HR · ${me.company.hr}`
          : "Recruiter"
        : "Placement Officer";

  return (
    <Shell
      portal={portal}
      nav={nav}
      user={{ name: role === "company" && me?.company ? me.company.name : user.name, role: label }}
      bell={role === "student" ? <NotificationBell /> : undefined}
      onSignOut={async () => {
        await logout();
        router.replace("/login");
      }}
    >
      {children}
    </Shell>
  );
}
