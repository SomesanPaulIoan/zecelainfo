"use client";

import Link from "next/link";
import useSWR from "swr";
import { SourceWorkspace } from "@/components/grile/SourceWorkspace";
import { apiFetch } from "@/lib/api";

type Question = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  explanation: string | null;
  video_url: string | null;
  difficulty: number | null;
  order_index: number | null;
  variants_count: number | null;
  chapter_names: string[] | null;
};

type AdminHomeworkFullResponse = {
  data: {
    assignment: {
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    };
    questions: Question[];
  };
};

function formatHomeworkDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export function AdminHomeworkFullWorkspace({
  assignmentId,
  groupId,
}: {
  assignmentId: string;
  groupId: string;
}) {
  const { data, error, isLoading } = useSWR<AdminHomeworkFullResponse>(
    `/api/meditations/admin/homework/${assignmentId}/questions`,
    apiFetch,
  );

  const statsHref = `/admin/meditatii/teme/${assignmentId}/statistici?groupId=${encodeURIComponent(groupId)}`;
  const backHref = `/dashboard?adminMeditations=1`;

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca tema...</main>;
  }

  if (error || !data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Nu am putut incarca tema."}
        </p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-semibold text-violet-800 hover:underline">
          Inapoi la administrare meditatii
        </Link>
      </main>
    );
  }

  const { assignment, questions } = data.data;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-none px-2 pb-8 pt-6 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(109,40,217,0.45)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-700">vizualizare admin</p>
          <h1 className="mt-1 text-2xl font-black text-violet-950 sm:text-3xl">Toata tema — {assignment.group_name}</h1>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatHomeworkDate(assignment.start_date)} – {formatHomeworkDate(assignment.end_date)} · {questions.length} grile
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={statsHref}
              className="rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-900 hover:bg-violet-100"
            >
              Statistici elevi
            </Link>
            <Link
              href={backHref}
              className="rounded-full border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-extrabold text-slate-900 hover:bg-amber-100"
            >
              Inapoi la administrare
            </Link>
          </div>
        </div>

        <SourceWorkspace
          sourceId={assignmentId}
          sourceName={`Tema ${assignment.group_name}`}
          categoryName={assignment.group_name}
          questions={questions}
          contextLabel="Tema meditatii"
          contextPurpose="Toate grilele din tema (vizualizare admin)"
          progressScope="none"
          sequentialNavNumbers
        />
      </section>
    </main>
  );
}
