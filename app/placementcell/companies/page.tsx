import CompanyApprovals from "@/components/CompanyApprovals";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Companies" };

export default function PlacementCompanies() {
  return (
    <>
      <PageHeader title="Companies" subtitle="Review and approve recruiters before they can post to students." />
      <CompanyApprovals />
    </>
  );
}
