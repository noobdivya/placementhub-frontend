import PortalShell from "@/components/PortalShell";
import type { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/companies", label: "Dashboard", icon: "home" },
  { href: "/companies/jobs", label: "Job postings", icon: "briefcase" },
  { href: "/companies/candidates", label: "Candidates", icon: "users" },
  { href: "/companies/post", label: "Post a job", icon: "plus" },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="company" portal="Company portal" nav={nav}>
      {children}
    </PortalShell>
  );
}
