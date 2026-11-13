import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminHomeworkFullWorkspace } from "@/components/meditatii/AdminHomeworkFullWorkspace";

type PageProps = {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ groupId?: string }>;
};

export default async function AdminHomeworkFullPage({ params, searchParams }: PageProps) {
  const { assignmentId } = await params;
  const { groupId } = await searchParams;

  if (!groupId) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-3xl px-6 py-14 text-sm text-rose-700">
          Lipseste parametrul groupId. Deschide tema din tab-ul Teme al grupei.
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminHomeworkFullWorkspace assignmentId={assignmentId} groupId={groupId} />
    </RequireAuth>
  );
}
