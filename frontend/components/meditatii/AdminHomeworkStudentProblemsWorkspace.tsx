"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

type Attempt = { id: string; score: number; status: string; language: string; created_at: string };

type AdminHomeworkStudentProblemsResponse = {
  data: {
    assignment: { id: string; group_id: string; group_name: string; start_date: string; end_date: string; item_count: number };
    student: {
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    };
    problems: Array<{ id: string; slug: string; title: string; attempts: Attempt[] }>;
  };
};

const STATUS_LABELS: Record<string, string> = {
  accepted: "Acceptat",
  wrong_answer: "Raspuns gresit",
  time_limit: "Time limit",
  memory_limit: "Memory limit",
  runtime_error: "Eroare executie",
  compile_error: "Eroare compilare",
  partial: "Partial",
  pending: "In asteptare",
  compiling: "Compilare",
  running: "Rulare",
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function studentDisplayName(row: AdminHomeworkStudentProblemsResponse["data"]["student"]) {
  const full = row.full_name?.trim();
  if (full) return full;
  const first = row.first_name?.trim();
  const last = row.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return row.username || row.email;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ro-RO");
}

export function AdminHomeworkStudentProblemsWorkspace({
  assignmentId,
  userId,
}: {
  assignmentId: string;
  userId: string;
}) {
  const { data, error, isLoading } = useSWR<AdminHomeworkStudentProblemsResponse>(
    `/api/meditations/admin/homework/${assignmentId}/problems-stats/students/${userId}`,
    apiFetch,
  );

  const backHref = "/dashboard?adminMeditations=1";

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca...</main>;
  }

  if (error || !data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Nu am putut incarca detaliile."}
        </p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-violet-800 hover:underline">
          Inapoi la meditatii
        </Link>
      </main>
    );
  }

  const { assignment, student, problems } = data.data;
  const studentName = studentDisplayName(student);
  const total = problems.reduce((sum, p) => sum + p.attempts.reduce((s, a) => s + a.score, 0), 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(109,40,217,0.45)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-700">vizualizare admin</p>
          <h1 className="mt-1 text-2xl font-black text-violet-950 sm:text-3xl">{studentName}</h1>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Tema probleme {assignment.group_name} · {formatDateTime(assignment.start_date)} – {formatDateTime(assignment.end_date)} ·
            punctaj total: {total}
          </p>
          <Link
            href={backHref}
            className="mt-4 inline-flex rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-900 hover:bg-violet-100"
          >
            Inapoi la meditatii
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {problems.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white/90 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-sky-100 bg-sky-50/50 px-5 py-3">
                <Link href={`/problems/${p.slug}`} target="_blank" className="font-bold text-sky-950 hover:underline">
                  {p.title}
                </Link>
                <span className="text-xs font-semibold text-slate-500">{p.attempts.length} incercari</span>
              </div>
              {p.attempts.length === 0 ? (
                <p className="px-5 py-3 text-sm text-zinc-500">Nicio incercare dupa data publicarii temei.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Data</th>
                        <th className="px-4 py-2 font-semibold">Scor</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                        <th className="px-4 py-2 font-semibold">Limbaj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.attempts.map((a) => (
                        <tr key={a.id} className="border-t border-zinc-100 text-slate-800">
                          <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                          <td className="px-4 py-2 font-semibold tabular-nums">{a.score}</td>
                          <td className="px-4 py-2">{statusLabel(a.status)}</td>
                          <td className="px-4 py-2">{a.language}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
