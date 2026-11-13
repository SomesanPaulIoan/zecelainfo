import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminHomeworkStudentGrileWorkspace } from "@/components/meditatii/AdminHomeworkStudentGrileWorkspace";

type HomeworkFilter = "correct" | "wrong" | "flagged";

type PageProps = {
  params: Promise<{ assignmentId: string; userId: string }>;
  searchParams: Promise<{ filter?: string; groupId?: string }>;
};

function parseFilter(raw: string | undefined): HomeworkFilter | null {
  if (raw === "correct" || raw === "wrong" || raw === "flagged") return raw;
  return null;
}

export default async function AdminHomeworkStudentGrilePage({ params, searchParams }: PageProps) {
  const { assignmentId, userId } = await params;
  const { filter: filterRaw, groupId } = await searchParams;
  const filter = parseFilter(filterRaw);

  if (!groupId || !filter) {
    return (
      <RequireAuth>
        <main className="mx-auto max-w-3xl px-6 py-14 text-sm text-rose-700">
          Parametri invalizi. Deschide pagina din statisticile temei (link pe Rezolvate corect / gresit / marcate).
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminHomeworkStudentGrileWorkspace
        assignmentId={assignmentId}
        userId={userId}
        filter={filter}
        groupId={groupId}
      />
    </RequireAuth>
  );
}
