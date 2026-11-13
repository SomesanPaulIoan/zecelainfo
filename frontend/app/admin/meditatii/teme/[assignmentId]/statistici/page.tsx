import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminHomeworkStatsWorkspace } from "@/components/meditatii/AdminHomeworkStatsWorkspace";

type PageProps = {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ groupId?: string }>;
};

export default async function AdminHomeworkStatsPage({ params, searchParams }: PageProps) {
  const { assignmentId } = await params;
  const { groupId } = await searchParams;

  if (!groupId) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-3xl px-6 py-14 text-sm text-rose-700">
          Lipseste parametrul groupId. Deschide statisticile din tab-ul Teme al grupei.
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminHomeworkStatsWorkspace assignmentId={assignmentId} groupId={groupId} />
    </RequireAuth>
  );
}
