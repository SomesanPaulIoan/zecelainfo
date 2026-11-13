"use client";

import Link from "next/link";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

export type HomeworkAssignmentRow = {
  id: string;
  group_id: string;
  group_name: string;
  start_date: string;
  end_date: string;
  item_count: number;
  solved_since_publish: number;
  status: "active" | "expired";
};

type MyHomeworkResponse = {
  data: {
    active: HomeworkAssignmentRow[];
    expired: HomeworkAssignmentRow[];
  };
};

function formatHomeworkDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

function HomeworkTable({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: HomeworkAssignmentRow[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">{emptyMessage}</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Grupa</th>
                <th className="px-3 py-2 font-semibold">Perioada</th>
                <th className="px-3 py-2 font-semibold">Grile</th>
                <th className="px-3 py-2 font-semibold">Rezolvate</th>
                <th className="px-3 py-2 font-semibold">Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200 text-zinc-800">
                  <td className="px-3 py-2 font-medium">{row.group_name}</td>
                  <td className="px-3 py-2">
                    {formatHomeworkDate(row.start_date)} – {formatHomeworkDate(row.end_date)}
                  </td>
                  <td className="px-3 py-2">{row.item_count}</td>
                  <td className="px-3 py-2">
                    {row.solved_since_publish} / {row.item_count}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/teme/${row.id}`}
                      className="inline-flex rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95"
                    >
                      Rezolva
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function MyHomeworkSection() {
  const { data, error, isLoading } = useSWR<MyHomeworkResponse>("/api/meditations/my-homework", apiFetch);
  const active = data?.data.active ?? [];
  const expired = data?.data.expired ?? [];

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Se incarca temele...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-rose-700">
        {error instanceof Error ? error.message : "Nu am putut incarca temele."}
      </p>
    );
  }

  if (active.length === 0 && expired.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Nu ai teme de grile din grupele tale de meditatii. Cand profesorul publica o tema, o vei vedea aici.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <HomeworkTable title="Teme active" rows={active} emptyMessage="Nu ai teme active momentan." />
      <HomeworkTable title="Teme expirate" rows={expired} emptyMessage="Nu ai teme expirate." />
    </div>
  );
}
