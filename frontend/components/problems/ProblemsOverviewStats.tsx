"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type SubmissionDashboardStats = {
  submissions_total: number;
  accepted_submissions_total: number;
  solved_total: number;
  solved_30d: number;
  success_rate_overall: number;
  success_rate_30d: number;
};

type Props = {
  totalProblems: number;
};

function fmtRo(n: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.max(0, Math.floor(n)));
}

export function ProblemsOverviewStats({ totalProblems }: Props) {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<SubmissionDashboardStats | null>(null);

  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }
    void apiFetch<{ data: SubmissionDashboardStats }>("/api/submissions/dashboard/stats")
      .then((response) => setStats(response.data))
      .catch(() => setStats(null));
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-amber-50 p-4 text-sm font-semibold text-slate-700 shadow-sm">
        <span>
          <span className="text-sky-900">Autentifica-te</span> ca sa iti urmaresti progresul: probleme rezolvate, rata de succes si multe altele.
        </span>
        <div className="flex shrink-0 gap-2">
          <a href="/login" className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-900 shadow-sm transition hover:bg-sky-50">
            Login
          </a>
          <a
            href="/register"
            className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-amber-300 hover:to-orange-400"
          >
            Creeaza cont
          </a>
        </div>
      </div>
    );
  }

  const solvedTotal = stats?.solved_total ?? 0;
  const submissionsTotal = stats?.submissions_total ?? 0;
  const successRate = stats?.success_rate_overall ?? 0;
  const progress = totalProblems > 0 ? Math.min(100, (solvedTotal / totalProblems) * 100) : 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-3.5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">Rezolvate de tine</p>
        <p className="mt-1 text-2xl font-black text-emerald-950">{fmtRo(solvedTotal)}</p>
      </article>
      <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/60 p-3.5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-900">Trimiteri totale</p>
        <p className="mt-1 text-2xl font-black text-violet-950">{fmtRo(submissionsTotal)}</p>
      </article>
      <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/60 p-3.5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900">Rata de succes</p>
        <p className="mt-1 text-2xl font-black text-amber-950">{solvedTotal > 0 ? successRate.toFixed(1) : "0.0"}%</p>
      </article>

      <div className="rounded-2xl border border-yellow-300 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 p-4 shadow-sm sm:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-950">
            Progresul tau: {solvedTotal} / {totalProblems} ({progress.toFixed(1)}%)
          </p>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
