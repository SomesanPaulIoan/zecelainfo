"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { apiFetch } from "@/lib/api";
import useSWR from "swr";

type QueueRow = {
  id: string;
  subject_id: number;
  status: "submitted" | "reviewed";
  created_at: string;
  submitted_at: string | null;
  subject_name: string;
  student_full_name: string;
  student_email: string;
  total_score: number | null;
};

type QueueResponse = {
  data: {
    pending: QueueRow[];
    reviewed: QueueRow[];
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ro-RO");
}

type SubjectGroup = {
  subject_id: number;
  subject_name: string;
  rows: QueueRow[];
};

function groupBySubject(rows: QueueRow[]): SubjectGroup[] {
  const groups = new Map<number, SubjectGroup>();
  for (const row of rows) {
    const existing = groups.get(row.subject_id);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(row.subject_id, {
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        rows: [row],
      });
    }
  }
  return Array.from(groups.values()).sort((a, b) => a.subject_name.localeCompare(b.subject_name, "ro"));
}

function PendingTable({ rows }: { rows: QueueRow[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
          <th className="px-2 py-2">Elev</th>
          <th className="px-2 py-2">Trimis la</th>
          <th className="px-2 py-2">Actiune</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-zinc-100">
            <td className="px-2 py-2">
              <p className="font-semibold text-zinc-800">{row.student_full_name}</p>
              <p className="text-xs text-zinc-500">{row.student_email}</p>
            </td>
            <td className="px-2 py-2 text-zinc-600">{formatDate(row.submitted_at)}</td>
            <td className="px-2 py-2">
              <Link href={`/admin/corecteaza-subiecte-bac/${row.id}`} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black">
                Corecteaza
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReviewedTable({ rows }: { rows: QueueRow[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
          <th className="px-2 py-2">Elev</th>
          <th className="px-2 py-2">Nota</th>
          <th className="px-2 py-2">Actiune</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-zinc-100">
            <td className="px-2 py-2">
              <p className="font-semibold text-zinc-800">{row.student_full_name}</p>
              <p className="text-xs text-zinc-500">{row.student_email}</p>
            </td>
            <td className="px-2 py-2 text-zinc-700">{row.total_score != null ? Number(row.total_score).toFixed(2) : "-"}</td>
            <td className="px-2 py-2">
              <Link href={`/admin/corecteaza-subiecte-bac/${row.id}`} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                Recorecteaza
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BacReviewQueuePage() {
  const { data, isLoading, error } = useSWR<QueueResponse>("/api/bacalaureat/submissions/review-queue", apiFetch);
  const pending = data?.data.pending ?? [];
  const reviewed = data?.data.reviewed ?? [];
  const pendingBySubject = groupBySubject(pending);
  const reviewedBySubject = groupBySubject(reviewed);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-zinc-50">
        <section className="mx-auto max-w-[1600px] px-4 py-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-zinc-900">Corecteaza Subiecte Bac</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Lucrarile sunt grupate pe subiect: sus cele de corectat, jos cele deja corectate (cu optiune de recorectare).
            </p>
            <Link
              href="/admin/subiecte-bac"
              className="mt-3 inline-flex rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-50"
            >
              Adauga subiecte BAC noi
            </Link>
          </div>

          {isLoading ? <p className="mt-4 text-sm text-zinc-600">Se incarca lista...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-700">{error instanceof Error ? error.message : "Nu am putut incarca lista."}</p> : null}

          <div className="mt-5 space-y-6">
            <section className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900">Subiecte necorectate</h2>
                {pending.length > 0 ? (
                  <span className="text-sm text-zinc-500">
                    {pending.length} {pending.length === 1 ? "lucrare" : "lucrari"} · {pendingBySubject.length}{" "}
                    {pendingBySubject.length === 1 ? "subiect" : "subiecte"}
                  </span>
                ) : null}
              </div>

              {pending.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Nu exista subiecte necorectate.</p> : null}

              <div className="mt-4 space-y-5">
                {pendingBySubject.map((group) => (
                  <div key={group.subject_id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2">
                      <h3 className="font-semibold text-zinc-900">{group.subject_name}</h3>
                      <span className="text-xs text-zinc-500">
                        {group.rows.length} {group.rows.length === 1 ? "lucrare" : "lucrari"}
                      </span>
                    </div>
                    <div className="mt-2 overflow-x-auto">
                      <PendingTable rows={group.rows} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900">Subiecte corectate</h2>
                {reviewed.length > 0 ? (
                  <span className="text-sm text-zinc-500">
                    {reviewed.length} {reviewed.length === 1 ? "lucrare" : "lucrari"} · {reviewedBySubject.length}{" "}
                    {reviewedBySubject.length === 1 ? "subiect" : "subiecte"}
                  </span>
                ) : null}
              </div>

              {reviewed.length === 0 ? <p className="mt-3 text-sm text-zinc-500">Nu exista subiecte corectate.</p> : null}

              <div className="mt-4 space-y-5">
                {reviewedBySubject.map((group) => (
                  <div key={group.subject_id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2">
                      <h3 className="font-semibold text-zinc-900">{group.subject_name}</h3>
                      <span className="text-xs text-zinc-500">
                        {group.rows.length} {group.rows.length === 1 ? "lucrare" : "lucrari"}
                      </span>
                    </div>
                    <div className="mt-2 overflow-x-auto">
                      <ReviewedTable rows={group.rows} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}
