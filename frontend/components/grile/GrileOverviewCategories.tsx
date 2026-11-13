"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { grileExamPath } from "@/lib/exams";

type Category = {
  id: string;
  slug: string;
  name: string;
};

type CategorySummary = {
  total_questions: number;
  total_with_video: number;
  total_with_hint: number;
  total_with_explanation: number;
};

type SolvedSummary = {
  solved_questions: number;
};

type Props = {
  categories: Category[];
  /** Sumarele incarcate pe server, ca HTML-ul initial (si Google) sa vada cifrele reale, nu 0. */
  initialSummaries?: Record<string, CategorySummary>;
};

const cardGrid = "grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3";

const shellBase =
  "group relative block overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_14px_38px_-26px_rgba(3,105,161,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-28px_rgba(245,158,11,0.45)]";

function BlurOrbs({ warm = false }: { warm?: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full blur-2xl transition group-hover:opacity-100 ${
          warm ? "bg-amber-300/30 group-hover:bg-amber-300/40" : "bg-amber-300/25 group-hover:bg-amber-300/35"
        }`}
      />
      <div className="pointer-events-none absolute -left-14 bottom-0 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />
    </>
  );
}

export function GrileOverviewCategories({ categories, initialSummaries }: Props) {
  const { user } = useAuth();
  const [summaryMap, setSummaryMap] = useState<Record<string, CategorySummary>>(initialSummaries ?? {});
  const [solvedMap, setSolvedMap] = useState<Record<string, number>>({});
  const [myListStats, setMyListStats] = useState<{ total: number; solved: number }>({ total: 0, solved: 0 });
  const [flaggedStats, setFlaggedStats] = useState<{ total: number; solved: number }>({ total: 0, solved: 0 });

  useEffect(() => {
    let cancelled = false;
    const loadSummaries = async () => {
      try {
        const responses = await Promise.all(
          categories.map(async (category) => {
            const response = await apiFetch<{ data: CategorySummary }>(`/api/grile/categories/${category.slug}/summary`);
            return [category.slug, response.data] as const;
          }),
        );
        if (cancelled) return;
        const next: Record<string, CategorySummary> = {};
        for (const [slug, data] of responses) next[slug] = data;
        setSummaryMap(next);
      } catch {
        if (!cancelled) setSummaryMap({});
      }
    };

    if (categories.length > 0 && !initialSummaries) void loadSummaries();
    return () => {
      cancelled = true;
    };
  }, [categories, initialSummaries]);

  useEffect(() => {
    let cancelled = false;
    const loadSolved = async () => {
      if (!user) {
        setSolvedMap({});
        return;
      }
      try {
        const responses = await Promise.all(
          categories.map(async (category) => {
            const response = await apiFetch<{ data: SolvedSummary }>(`/api/grile/categories/${category.slug}/solved-summary`);
            return [category.slug, response.data.solved_questions ?? 0] as const;
          }),
        );
        if (cancelled) return;
        const next: Record<string, number> = {};
        for (const [slug, solved] of responses) next[slug] = solved;
        setSolvedMap(next);
      } catch {
        if (!cancelled) setSolvedMap({});
      }
    };

    if (categories.length > 0) void loadSolved();
    return () => {
      cancelled = true;
    };
  }, [categories, user]);

  useEffect(() => {
    let cancelled = false;
    const loadPersonalStats = async () => {
      if (!user) {
        setMyListStats({ total: 0, solved: 0 });
        setFlaggedStats({ total: 0, solved: 0 });
        return;
      }
      try {
        const [myListResponse, flaggedResponse] = await Promise.all([
          apiFetch<{ data: { questions: Array<{ has_correct_attempt?: boolean }> } }>("/api/grile/me/my-list/questions"),
          apiFetch<{ data: { questions: Array<{ has_correct_attempt?: boolean }> } }>("/api/grile/me/flagged/questions"),
        ]);
        if (cancelled) return;

        const myListQuestions = myListResponse.data.questions ?? [];
        const flaggedQuestions = flaggedResponse.data.questions ?? [];

        setMyListStats({
          total: myListQuestions.length,
          solved: myListQuestions.filter((q) => Boolean(q.has_correct_attempt)).length,
        });
        setFlaggedStats({
          total: flaggedQuestions.length,
          solved: flaggedQuestions.filter((q) => Boolean(q.has_correct_attempt)).length,
        });
      } catch {
        if (!cancelled) {
          setMyListStats({ total: 0, solved: 0 });
          setFlaggedStats({ total: 0, solved: 0 });
        }
      }
    };

    void loadPersonalStats();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = useMemo(
    () =>
      categories.map((category) => {
        const summary = summaryMap[category.slug];
        const total = summary?.total_questions ?? 0;
        const solved = solvedMap[category.slug] ?? 0;
        const progress = total > 0 ? Math.round((solved / total) * 100) : 0;
        return {
          category,
          total,
          solved,
          progress,
          withVideo: summary?.total_with_video ?? 0,
          withHint: summary?.total_with_hint ?? 0,
          withExplanation: summary?.total_with_explanation ?? 0,
        };
      }),
    [categories, solvedMap, summaryMap],
  );

  const myProgress = myListStats.total > 0 ? Math.round((myListStats.solved / myListStats.total) * 100) : 0;
  const flaggedProgress = flaggedStats.total > 0 ? Math.round((flaggedStats.solved / flaggedStats.total) * 100) : 0;

  return (
    <div className={cardGrid}>
      {cards.map((item) => (
        <Link
          key={item.category.id}
          href={grileExamPath(item.category.slug)}
          className={`${shellBase} border-sky-200 bg-gradient-to-b from-white via-sky-50/70 to-blue-50 hover:border-yellow-300`}
        >
          <BlurOrbs />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-700">Categorie</p>
              <p className="mt-1 truncate text-lg font-black text-sky-950">{item.category.name}</p>
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-bold text-sky-900">
              {item.total} întrebări
            </span>
          </div>
          <div className="relative mt-4 rounded-2xl border border-sky-100 bg-white/85 p-3">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
              <span>
                {item.solved} / {item.total} rezolvate
              </span>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 font-extrabold text-sky-800">{item.progress}%</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-sky-400"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-sky-200/90 bg-sky-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                {item.withExplanation} explicații
              </span>
              <span className="rounded-full border border-sky-200/90 bg-sky-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                {item.withHint} indicații
              </span>
              <span className="rounded-full border border-sky-200/90 bg-sky-50/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                {item.withVideo} video
              </span>
            </div>
          </div>
          <div className="relative mt-3">
            <span className="flex w-full items-center justify-center rounded-xl border-2 border-sky-300 bg-white px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-sky-900 transition group-hover:border-sky-400 group-hover:bg-sky-50">
              Intră acum
            </span>
          </div>
        </Link>
      ))}

      <Link
        href="/grile/lista-mea"
        className={`${shellBase} border-amber-200/90 bg-gradient-to-b from-white via-amber-50/80 to-yellow-50 hover:border-amber-400`}
      >
        <BlurOrbs warm />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-800">Personal</p>
            <p className="mt-1 truncate text-lg font-black text-amber-950">Lista mea</p>
            <p className="mt-1 text-xs font-medium leading-snug text-amber-900/85">Întrebări salvate pentru repetare rapidă.</p>
          </div>
          <span className="inline-flex shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-950">
            {myListStats.total} în listă
          </span>
        </div>
        <div className="relative mt-4 rounded-2xl border border-amber-100 bg-white/90 p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
            <span>
              {myListStats.solved} / {myListStats.total} rezolvate
            </span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-extrabold text-amber-900">{myProgress}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-amber-100/80">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" style={{ width: `${myProgress}%` }} />
          </div>
        </div>
        <div className="relative mt-3">
          <span className="flex w-full items-center justify-center rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-200 to-yellow-200 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-900 transition group-hover:brightness-95">
            Deschide lista
          </span>
        </div>
      </Link>

      <Link
        href="/grile/intrebarile-mele"
        className={`${shellBase} border-rose-200/85 bg-gradient-to-b from-white via-rose-50/55 to-orange-50/90 hover:border-rose-300`}
      >
        <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-rose-300/25 blur-2xl transition group-hover:bg-rose-300/35" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-28 w-28 rounded-full bg-orange-200/30 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-rose-800">Personal</p>
            <p className="mt-1 truncate text-lg font-black text-rose-950">Întrebările mele</p>
            <p className="mt-1 text-xs font-medium leading-snug text-rose-900/85">Marcate pentru când vrei să recapeți pasul.</p>
          </div>
          <span className="inline-flex shrink-0 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-950">
            {flaggedStats.total} marcate
          </span>
        </div>
        <div className="relative mt-4 rounded-2xl border border-rose-100 bg-white/90 p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
            <span>
              {flaggedStats.solved} / {flaggedStats.total} rezolvate
            </span>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 font-extrabold text-rose-900">{flaggedProgress}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-rose-100/80">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400" style={{ width: `${flaggedProgress}%` }} />
          </div>
        </div>
        <div className="relative mt-3">
          <span className="flex w-full items-center justify-center rounded-xl border-2 border-rose-300 bg-gradient-to-r from-rose-100 to-orange-100 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-rose-950 transition group-hover:border-rose-400">
            Deschide marcatele
          </span>
        </div>
      </Link>
    </div>
  );
}
