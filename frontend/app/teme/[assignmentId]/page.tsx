import { HomeworkSolveWorkspace } from "@/components/homework/HomeworkSolveWorkspace";
import { RequireAuth } from "@/components/auth/RequireAuth";

type PageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function HomeworkSolvePage({ params }: PageProps) {
  const { assignmentId } = await params;
  return (
    <RequireAuth>
      <HomeworkSolveWorkspace assignmentId={assignmentId} />
    </RequireAuth>
  );
}
