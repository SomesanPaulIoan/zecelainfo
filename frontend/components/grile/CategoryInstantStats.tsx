"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type Props = {
  categorySlug: string;
  categoryName: string;
  /** Sumarul incarcat pe server — fara el, HTML-ul vazut de Google afisa „0 grile” pana la hidratare. */
  initialSummary?: SummaryResponse["data"] | null;
};

type SummaryResponse = {
  data: {
    category: {
      id: string;
      slug: string;
      name: string;
    };
    total_questions: number;
    total_with_video: number;
    total_with_hint: number;
    total_with_explanation: number;
  };
};

type SolvedSummaryResponse = {
  data: {
    solved_questions: number;
  };
};

export function CategoryInstantStats({ categorySlug, categoryName, initialSummary = null }: Props) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<SummaryResponse["data"] | null>(initialSummary);
  const [solved, setSolved] = useState(0);

  useEffect(() => {
    if (!categorySlug || initialSummary) return;
    void apiFetch<SummaryResponse>(`/api/grile/categories/${categorySlug}/summary`)
      .then((response) => setSummary(response.data))
      .catch(() => setSummary(null));
  }, [categorySlug, initialSummary]);

  useEffect(() => {
    if (!categorySlug || !user) {
      setSolved(0);
      return;
    }
    void apiFetch<SolvedSummaryResponse>(`/api/grile/categories/${categorySlug}/solved-summary`)
      .then((response) => setSolved(response.data.solved_questions))
      .catch(() => setSolved(0));
  }, [categorySlug, user]);

  const progress = useMemo(() => {
    const total = summary?.total_questions ?? 0;
    if (total <= 0) return 0;
    return Math.round((solved / total) * 100);
  }, [solved, summary?.total_questions]);

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-sky-950">Statistici importante pentru {categoryName}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-sky-200 bg-sky-50/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Total grile categorie</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{summary?.total_questions ?? 0}</p>
        </article>
        <article className="rounded-lg border border-sky-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cu explicații video</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary?.total_with_video ?? 0}</p>
        </article>
        <article className="rounded-lg border border-sky-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cu indicații</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary?.total_with_hint ?? 0}</p>
        </article>
        <article className="rounded-lg border border-sky-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cu explicații</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{summary?.total_with_explanation ?? 0}</p>
        </article>
      </div>
      {user ? (
        <article className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Progresul tău: {solved} / {summary?.total_questions ?? 0} ({progress}%)
            </p>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </article>
      ) : null}
      {!user ? (
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sky-100">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {!user ? (
        <p className="mt-1 text-xs font-semibold text-slate-700">
          Progres estimat categorie: {progress}% ({solved} / {summary?.total_questions ?? 0})
        </p>
      ) : null}
    </div>
  );
}
