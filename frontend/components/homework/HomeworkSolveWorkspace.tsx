"use client";

import Link from "next/link";
import useSWR from "swr";
import { SourceWorkspace } from "@/components/grile/SourceWorkspace";
import { apiFetch } from "@/lib/api";

type HomeworkSolveResponse = {
  data: {
    assignment: {
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    };
    questions: Array<{
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
    }>;
  };
};

function formatHomeworkDate(value: string) {
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

export function HomeworkSolveWorkspace({ assignmentId }: { assignmentId: string }) {
  const { data, error, isLoading } = useSWR<HomeworkSolveResponse>(
    `/api/meditations/homework/${assignmentId}`,
    apiFetch,
  );

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca tema...</main>;
  }

  if (error || !data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Nu am putut incarca tema."}
        </p>
        <Link href="/dashboard?section=classes" className="mt-4 inline-block text-sm font-semibold text-sky-800 hover:underline">
          Inapoi la Temele mele
        </Link>
      </main>
    );
  }

  const { assignment, questions } = data.data;
  const isExpired = assignment.end_date < new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-none px-2 pb-8 pt-6 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">tema grile</p>
              <h1 className="mt-1 text-2xl font-black text-sky-950 sm:text-3xl">{assignment.group_name}</h1>
              <p className="mt-1 text-sm font-medium text-slate-700">
                Publicata {formatHomeworkDate(assignment.start_date)} · pana la {formatHomeworkDate(assignment.end_date)}
                {isExpired ? " · expirata" : " · activa"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                In navigator, bifa sau X apar doar pentru grilele rezolvate dupa data publicarii temei.
              </p>
            </div>
            <Link
              href="/dashboard?section=classes"
              className="rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:from-amber-200 hover:to-yellow-200"
            >
              Inapoi la Temele mele
            </Link>
          </div>
        </div>
        <SourceWorkspace
          sourceId={assignment.id}
          sourceName={`Tema ${assignment.group_name}`}
          categoryName="Meditații"
          questions={questions}
          contextLabel="Tema"
          contextPurpose="Grile din tema grupei de meditatii"
          progressScope="homework"
          homeworkAssignmentId={assignment.id}
        />
      </section>
    </main>
  );
}
