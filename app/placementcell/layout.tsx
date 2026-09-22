import PortalShell from "@/components/PortalShell";
import type { NavItem } from "@/components/Shell";

const nav: NavItem[] = [
  { href: "/placementcell", label: "Dashboard", icon: "home" },
  { href: "/placementcell/students", label: "Students", icon: "users" },
  { href: "/placementcell/companies", label: "Companies", icon: "building" },
  { href: "/placementcell/jobs", label: "Job approvals", icon: "briefcase" },
  { href: "/placementcell/drives", label: "Drives", icon: "calendar" },
  { href: "/placementcell/reports", label: "Reports", icon: "chart" },
];

export default function PlacementCellLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell role="admin" portal="Placement cell" nav={nav}>
      {children}
    </PortalShell>
  );
}
