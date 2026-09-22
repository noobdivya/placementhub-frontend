import PostJobForm from "@/components/PostJobForm";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Post a job" };

export default async function PostJob({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  return (
    <>
      <PageHeader
        title={edit ? "Edit posting" : "Post a job"}
        subtitle="Set the role and who's eligible. The placement cell reviews before it goes live."
      />
      <PostJobForm key={edit ?? "new"} editId={edit} />
    </>
  );
}
