"use client";

import { ModalPortal } from "@/components/ui/ModalPortal";

export type CommunityGrilaStats = {
  users_attempted: number;
  users_first_try_correct: number;
  users_first_try_wrong: number;
  users_ever_correct: number;
  total_attempts: number;
  correct_attempts: number;
  pct_first_try_correct: number | null;
  pct_first_try_wrong: number | null;
  pct_success_attempts: number | null;
  pct_users_ever_correct: number | null;
  avg_attempts_per_user: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Ex: "12" sau "5" — apare in propozitia "Agregate pentru grila …" */
  questionLabel: string;
  loading: boolean;
  error: string | null;
  stats: CommunityGrilaStats | null;
};

export function GrilaCommunityStatsModal({ open, onClose, questionLabel, loading, error, stats }: Props) {
  if (!open) return null;

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl border border-sky-100 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-sky-950">Statistici comunitate</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
          >
            Inchide
          </button>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          Agregate pentru grila {questionLabel}—toti utilizatorii care au verificat raspunsul (mod normal sau dupa o simulare
          incheiata), in mod anonim.
        </p>
        {loading ? <p className="text-sm text-slate-600">Se incarca...</p> : null}
        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
        {!loading && stats && !error ? (
          stats.users_attempted === 0 ? (
            <p className="text-sm text-slate-700">Inca nu exista date de la comunitate pentru aceasta grila.</p>
          ) : (
            <div className="space-y-3">
              {stats.users_attempted < 8 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  Esantion redus ({stats.users_attempted} {stats.users_attempted === 1 ? "elev" : "elevi"}). Interpreta procentele cu
                  grija.
                </p>
              ) : null}
              <dl className="space-y-3 text-sm">
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">Elevi care au verificat</dt>
                  <dd className="mt-1 text-2xl font-extrabold tabular-nums text-sky-950">{stats.users_attempted}</dd>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <dt className="font-semibold text-slate-900">Corect la prima verificare</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="text-xl font-extrabold tabular-nums text-emerald-700">
                      {stats.pct_first_try_correct != null ? `${stats.pct_first_try_correct.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      ({stats.users_first_try_correct} din {stats.users_attempted})
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <dt className="font-semibold text-slate-900">Gresit la prima verificare</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="text-xl font-extrabold tabular-nums text-rose-700">
                      {stats.pct_first_try_wrong != null ? `${stats.pct_first_try_wrong.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      ({stats.users_first_try_wrong} din {stats.users_attempted})
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <dt className="font-semibold text-slate-900">Rata de succes (toate verificarile)</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="text-xl font-extrabold tabular-nums text-sky-800">
                      {stats.pct_success_attempts != null ? `${stats.pct_success_attempts.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      {stats.correct_attempts} corecte din {stats.total_attempts} verificari
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <dt className="font-semibold text-slate-900">Elevi cu macar o verificare corecta</dt>
                  <dd className="mt-1 text-slate-800">
                    <span className="text-xl font-extrabold tabular-nums text-sky-800">
                      {stats.pct_users_ever_correct != null ? `${stats.pct_users_ever_correct.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-slate-600">
                      {" "}
                      ({stats.users_ever_correct} din {stats.users_attempted})
                    </span>
                  </dd>
                </div>
                {stats.avg_attempts_per_user != null ? (
                  <div className="rounded-xl border border-sky-100 bg-white p-3">
                    <dt className="font-semibold text-slate-900">Medie verificari / elev</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">
                      {stats.avg_attempts_per_user.toFixed(1)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          )
        ) : null}
      </div>
    </div>
    </ModalPortal>
  );
}
