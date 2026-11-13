"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type GlobalGrileSummary = {
  total_questions: number;
  total_with_video: number;
  total_with_hint: number;
  total_with_explanation: number;
  total_with_hint_and_explanation: number;
  total_with_hint_ai: number;
  total_with_explanation_ai: number;
  total_correct_attempts: number;
  total_attempts: number;
  users_with_active_premium: number;
};

type GrileStats = {
  attempts_today: number;
  attempts_7d: number;
  attempts_30d: number;
  attempts_total: number;
  correct_attempts_total: number;
  correct_attempts_30d: number;
  solved_total: number;
  solved_30d: number;
  success_rate_overall: number;
  success_rate_30d: number;
};

type Props = {
  globalSummary: GlobalGrileSummary;
};

function fmtRo(n: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.max(0, Math.floor(n)));
}

export function GrileOverviewStats({ globalSummary }: Props) {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<GrileStats | null>(null);
  const solvedTotal = userStats?.solved_total ?? 0;
  const attemptsTotal = userStats?.attempts_total ?? 0;
  const successRate = userStats?.success_rate_overall ?? 0;
  const solvedProgress = globalSummary.total_questions > 0 ? Math.min(100, (solvedTotal / globalSummary.total_questions) * 100) : 0;
  const aiHintExplanation = globalSummary.total_with_hint_and_explanation ?? 0;
  const correctAttempts = globalSummary.total_correct_attempts ?? 0;
  const allAttempts = globalSummary.total_attempts ?? 0;
  const premiumUsers = globalSummary.users_with_active_premium ?? 0;

  useEffect(() => {
    if (!user) {
      setUserStats(null);
      return;
    }
    void apiFetch<{ data: GrileStats }>("/api/grile/dashboard/stats")
      .then((response) => setUserStats(response.data))
      .catch(() => setUserStats(null));
  }, [user]);

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <article className="rounded-lg border border-sky-200 bg-sky-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Total grile platformă</p>
        <p className="mt-1 text-xl font-extrabold text-slate-900">{fmtRo(globalSummary.total_questions)}</p>
      </article>
      <article className="rounded-lg border border-sky-100 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cu explicații video</p>
        <p className="mt-1 text-xl font-bold text-slate-900">{fmtRo(globalSummary.total_with_video)}</p>
      </article>
      <article className="rounded-lg border border-sky-100 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cu indicații și explicații AI</p>
        <p className="mt-1 text-xl font-bold text-slate-900">{fmtRo(aiHintExplanation)}</p>
      </article>
      <article className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Total grile rezolvate</p>
        <p className="mt-1 text-xl font-bold text-emerald-950">{fmtRo(correctAttempts)}</p>
      </article>
      <article className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">Total încercări</p>
        <p className="mt-1 text-xl font-bold text-amber-950">{fmtRo(allAttempts)}</p>
      </article>
      <article className="rounded-lg border border-violet-200 bg-violet-50/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">Useri cu acces premium acum</p>
        <p className="mt-1 text-xl font-bold text-violet-950">{fmtRo(premiumUsers)}</p>
      </article>

      {user ? (
        <article className="md:col-span-2 lg:col-span-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Progresul tau: {solvedTotal} / {globalSummary.total_questions} ({solvedProgress.toFixed(2)}%)
            </p>
            <p className="text-[11px] font-semibold text-slate-700">
              Incercari totale: {attemptsTotal} • Rata de succes: {successRate.toFixed(2)}%
            </p>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-sky-100">
            <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500" style={{ width: `${solvedProgress}%` }} />
          </div>
        </article>
      ) : null}
    </div>
  );
}
