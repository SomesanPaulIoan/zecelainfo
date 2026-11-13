"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

type HomeworkStudentStats = {
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  correct_count: number;
  wrong_count: number;
  flagged_count: number;
  total_count: number;
  percent_complete: number;
};

type AdminHomeworkStatsResponse = {
  data: {
    assignment: {
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    };
    students: HomeworkStudentStats[];
  };
};

function formatHomeworkDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

function studentDisplayName(row: HomeworkStudentStats) {
  const full = row.full_name?.trim();
  if (full) return full;
  const first = row.first_name?.trim();
  const last = row.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return row.username || row.email;
}

function grileLink(assignmentId: string, userId: string, filter: "correct" | "wrong" | "flagged", groupId: string) {
  const params = new URLSearchParams({ filter, groupId });
  return `/admin/meditatii/teme/${assignmentId}/elevi/${userId}?${params.toString()}`;
}

export function AdminHomeworkStatsWorkspace({
  assignmentId,
  groupId,
}: {
  assignmentId: string;
  groupId: string;
}) {
  const { data, error, isLoading } = useSWR<AdminHomeworkStatsResponse>(
    `/api/meditations/admin/homework/${assignmentId}/stats`,
    apiFetch,
  );

  const backHref = `/dashboard?adminMeditations=1`;

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca statisticile...</main>;
  }

  if (error || !data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Nu am putut incarca statisticile temei."}
        </p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-violet-800 hover:underline">
          Inapoi la administrare meditatii
        </Link>
      </main>
    );
  }

  const { assignment, students } = data.data;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-violet),_var(--glow-blue)_40%,_var(--glow-indigo)_85%)]">
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-2xl border border-violet-200/80 bg-white/95 p-6 shadow-lg">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-violet-700">Statistici tema grile</p>
          <h1 className="mt-1 text-2xl font-black text-violet-950">{assignment.group_name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {formatHomeworkDate(assignment.start_date)} – {formatHomeworkDate(assignment.end_date)} · {assignment.item_count}{" "}
            grile in tema
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Numaratoarea tine cont doar de activitatea dupa data publicarii temei. Procentul = grile rezolvate corect / total.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/meditatii/teme/${assignmentId}/tema?groupId=${encodeURIComponent(groupId)}`}
              className="inline-flex rounded-full border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-900 hover:bg-sky-100"
            >
              Vezi toata tema
            </Link>
            <Link
              href={backHref}
              className="inline-flex rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-900 hover:bg-violet-100"
            >
              Inapoi la administrare meditatii
            </Link>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="rounded-xl border border-violet-100 bg-white p-4 text-sm text-slate-600">Niciun elev in aceasta grupa.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-violet-200/70 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-violet-50 text-violet-900">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Elev</th>
                  <th className="px-3 py-2.5 font-semibold">Rezolvate corect</th>
                  <th className="px-3 py-2.5 font-semibold">Rezolvate gresit</th>
                  <th className="px-3 py-2.5 font-semibold">Marcate ca intrebare</th>
                  <th className="px-3 py-2.5 font-semibold">Progres tema</th>
                </tr>
              </thead>
              <tbody>
                {students.map((row) => (
                  <tr key={row.user_id} className="border-t border-violet-100 text-slate-800">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold">{studentDisplayName(row)}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatLink
                        href={grileLink(assignmentId, row.user_id, "correct", groupId)}
                        count={row.correct_count}
                        total={row.total_count}
                        tone="emerald"
                        label="Rezolvate corect"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatLink
                        href={grileLink(assignmentId, row.user_id, "wrong", groupId)}
                        count={row.wrong_count}
                        total={row.total_count}
                        tone="rose"
                        label="Rezolvate gresit"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatLink
                        href={grileLink(assignmentId, row.user_id, "flagged", groupId)}
                        count={row.flagged_count}
                        total={row.total_count}
                        tone="amber"
                        label="Marcate ca intrebare"
                      />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-bold text-violet-900">{row.percent_complete}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatLink({
  href,
  count,
  total,
  tone,
  label,
}: {
  href: string;
  count: number;
  total: number;
  tone: "emerald" | "rose" | "amber";
  label: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
      : tone === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
        : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100";

  if (count === 0) {
    return <span className="text-slate-400 tabular-nums">0 / {total}</span>;
  }

  return (
    <Link
      href={href}
      title={`Vezi grilele: ${label}`}
      className={`inline-flex rounded-lg border px-2.5 py-1 font-semibold tabular-nums transition ${toneClass}`}
    >
      {count} / {total}
    </Link>
  );
}
