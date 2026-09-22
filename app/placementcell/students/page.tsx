import StudentsTable from "@/components/StudentsTable";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Students" };

export default function PlacementStudents() {
  return (
    <>
      <PageHeader title="Students" subtitle="Registered students of the 2026 batch and their placement status." />
      <StudentsTable />
    </>
  );
}
