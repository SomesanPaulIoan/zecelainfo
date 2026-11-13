"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";

type ProblemsHomeworkAssignmentRow = {
  id: string;
  group_id: string;
  group_name: string;
  start_date: string;
  end_date: string;
  item_count: number;
  solved_since_publish: number;
  status: "active" | "expired";
};

type MyProblemsHomeworkResponse = {
  data: {
    active: ProblemsHomeworkAssignmentRow[];
    expired: ProblemsHomeworkAssignmentRow[];
  };
};

type ProblemsHomeworkDetailResponse = {
  data: {
    assignment: { id: string; group_name: string; start_date: string; end_date: string; item_count: number };
    problems: Array<{ id: string; slug: string; title: string; difficulty: string; solved: boolean }>;
  };
};

function formatHomeworkDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

function ProblemsHomeworkAssignmentItem({
  row,
  initialOpenAssignmentId,
}: {
  row: ProblemsHomeworkAssignmentRow;
  initialOpenAssignmentId?: string | null;
}) {
  const shouldOpenInitially = row.id === initialOpenAssignmentId;
  const [open, setOpen] = useState(shouldOpenInitially);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const { data, isLoading } = useSWR<ProblemsHomeworkDetailResponse>(
    open ? `/api/meditations/problems-homework/${row.id}` : null,
    apiFetch,
  );
  const problems = data?.data?.problems ?? [];

  useEffect(() => {
    if (shouldOpenInitially) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Doar la montare: vrem sa derulam catre tema deschisa initial o singura data, nu de fiecare data cand se schimba prop-ul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <details
      ref={detailsRef}
      open={open}
      className="group border-b border-zinc-200 last:border-b-0"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-zinc-900">{row.group_name}</p>
            <p className="text-xs text-zinc-500">
              {formatHomeworkDate(row.start_date)} – {formatHomeworkDate(row.end_date)}
              {row.status === "expired" ? " · expirata" : ""}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-zinc-500">
          {row.solved_since_publish} / {row.item_count} rezolvate
        </span>
      </summary>
      <div className="bg-white">
        {isLoading ? <p className="px-4 py-3 text-sm text-zinc-600">Se incarca...</p> : null}
        {!isLoading && problems.length === 0 ? (
          <p className="px-4 py-3 text-sm text-zinc-500">Aceasta tema nu contine probleme.</p>
        ) : null}
        {problems.map((p) => (
          <Link
            key={p.id}
            href={`/problems/${p.slug}?homeworkAssignmentId=${row.id}`}
            className="flex items-center gap-3 border-t border-zinc-100 px-4 py-2.5 text-sm transition first:border-t-0 hover:bg-sky-50/60"
          >
            {p.solved ? (
              <CheckCircle2 className="h-[17px] w-[17px] shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-[17px] w-[17px] shrink-0 text-zinc-300" />
            )}
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{p.title}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
          </Link>
        ))}
      </div>
    </details>
  );
}

function ProblemsHomeworkAccordion({
  title,
  rows,
  emptyMessage,
  initialOpenAssignmentId,
}: {
  title: string;
  rows: ProblemsHomeworkAssignmentRow[];
  emptyMessage: string;
  initialOpenAssignmentId?: string | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">{emptyMessage}</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
          {rows.map((row) => (
            <ProblemsHomeworkAssignmentItem key={row.id} row={row} initialOpenAssignmentId={initialOpenAssignmentId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MyProblemsHomeworkSection({ initialOpenAssignmentId }: { initialOpenAssignmentId?: string | null }) {
  const { data, error, isLoading } = useSWR<MyProblemsHomeworkResponse>("/api/meditations/my-problems-homework", apiFetch);
  const active = data?.data.active ?? [];
  const expired = data?.data.expired ?? [];

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Se incarca temele...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-700">{error instanceof Error ? error.message : "Nu am putut incarca temele."}</p>;
  }

  if (active.length === 0 && expired.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Nu ai teme de probleme din grupele tale de meditatii. Cand profesorul publica o tema, o vei vedea aici.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <ProblemsHomeworkAccordion
        title="Teme active"
        rows={active}
        emptyMessage="Nu ai teme active momentan."
        initialOpenAssignmentId={initialOpenAssignmentId}
      />
      <ProblemsHomeworkAccordion
        title="Teme expirate"
        rows={expired}
        emptyMessage="Nu ai teme expirate."
        initialOpenAssignmentId={initialOpenAssignmentId}
      />
    </div>
  );
}
