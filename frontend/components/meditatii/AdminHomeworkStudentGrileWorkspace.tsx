"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { SourceWorkspace } from "@/components/grile/SourceWorkspace";
import { apiFetch } from "@/lib/api";

type HomeworkFilter = "correct" | "wrong" | "flagged";

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
  is_flagged?: boolean;
  in_my_list?: boolean;
  last_attempt_at?: string | null;
  has_correct_attempt?: boolean;
  has_wrong_attempt?: boolean;
};

type AdminHomeworkStudentQuestionsResponse = {
  data: {
    assignment: {
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    };
    student: {
      user_id: string;
      email: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
    };
    filter: HomeworkFilter;
    questions: Question[];
  };
};

const FILTER_LABELS: Record<HomeworkFilter, string> = {
  correct: "Rezolvate corect",
  wrong: "Rezolvate gresit",
  flagged: "Marcate ca intrebare",
};

function studentDisplayName(row: AdminHomeworkStudentQuestionsResponse["data"]["student"]) {
  const full = row.full_name?.trim();
  if (full) return full;
  const first = row.first_name?.trim();
  const last = row.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return row.username || row.email;
}

export function AdminHomeworkStudentGrileWorkspace({
  assignmentId,
  userId,
  filter,
  groupId,
}: {
  assignmentId: string;
  userId: string;
  filter: HomeworkFilter;
  groupId: string;
}) {
  const endpoint = useMemo(
    () => `/api/meditations/admin/homework/${assignmentId}/students/${userId}/questions?filter=${filter}`,
    [assignmentId, userId, filter],
  );
  const { data, error, isLoading } = useSWR<AdminHomeworkStudentQuestionsResponse>(endpoint, apiFetch);

  const statsHref = `/admin/meditatii/teme/${assignmentId}/statistici?groupId=${encodeURIComponent(groupId)}`;

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca grilele...</main>;
  }

  if (error || !data?.data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error instanceof Error ? error.message : "Nu am putut incarca grilele."}
        </p>
        <Link href={statsHref} className="mt-4 inline-block text-sm font-semibold text-violet-800 hover:underline">
          Inapoi la statistici tema
        </Link>
      </main>
    );
  }

  const { assignment, student, questions } = data.data;
  const studentName = studentDisplayName(student);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-none px-2 pb-8 pt-6 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(109,40,217,0.45)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-700">vizualizare admin</p>
          <h1 className="mt-1 text-2xl font-black text-violet-950 sm:text-3xl">
            {FILTER_LABELS[filter]} — {studentName}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Tema {assignment.group_name} · {questions.length} grile
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/meditatii/teme/${assignmentId}/tema?groupId=${encodeURIComponent(groupId)}`}
              className="rounded-full border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-900 hover:bg-sky-100"
            >
              Toata tema
            </Link>
            <Link
              href={statsHref}
              className="rounded-full border-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-900 hover:bg-violet-100"
            >
              Inapoi la statistici
            </Link>
          </div>
        </div>

        {questions.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-sky-100 bg-white p-6 text-sm text-slate-600">
            Nu exista grile in aceasta categorie pentru acest elev.
          </p>
        ) : (
          <SourceWorkspace
            sourceId={`${assignmentId}-${filter}-${userId}`}
            sourceName={`${FILTER_LABELS[filter]} (${studentName})`}
            categoryName={assignment.group_name}
            questions={questions}
            contextLabel="Tema meditatii"
            contextPurpose={`Grile ${FILTER_LABELS[filter].toLowerCase()} din tema`}
            progressScope="none"
            sequentialNavNumbers
          />
        )}
      </section>
    </main>
  );
}
