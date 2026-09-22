import PortalShell from "@/components/PortalShell";
import type { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/students", label: "Dashboard", icon: "home" },
  { href: "/students/jobs", label: "Job board", icon: "briefcase" },
  { href: "/students/applications", label: "My applications", icon: "file" },
  { href: "/students/profile", label: "Profile & resume", icon: "user" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="student" portal="Student portal" nav={nav}>
      {children}
    </PortalShell>
  );
}
