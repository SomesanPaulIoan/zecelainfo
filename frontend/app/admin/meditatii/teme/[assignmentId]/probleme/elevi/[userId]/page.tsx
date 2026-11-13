import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminHomeworkStudentProblemsWorkspace } from "@/components/meditatii/AdminHomeworkStudentProblemsWorkspace";

type PageProps = {
  params: Promise<{ assignmentId: string; userId: string }>;
};

export default async function AdminHomeworkStudentProblemsPage({ params }: PageProps) {
  const { assignmentId, userId } = await params;

  return (
    <RequireAuth>
      <AdminHomeworkStudentProblemsWorkspace assignmentId={assignmentId} userId={userId} />
    </RequireAuth>
  );
}
