import CandidateBoard from "@/components/CandidateBoard";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Candidates" };

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job } = await searchParams;
  return (
    <>
      <PageHeader title="Candidate pipeline" subtitle="Move applicants through each hiring stage." />
      <CandidateBoard initialJobId={job} />
    </>
  );
}
