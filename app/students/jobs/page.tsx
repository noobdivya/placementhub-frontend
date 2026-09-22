import { Suspense } from "react";
import JobsBoard from "@/components/JobsBoard";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Job board" };

export default function StudentJobs() {
  return (
    <>
      <PageHeader title="Job board" subtitle="Openings from companies visiting campus this season." />
      <Suspense>
        <JobsBoard />
      </Suspense>
    </>
  );
}
