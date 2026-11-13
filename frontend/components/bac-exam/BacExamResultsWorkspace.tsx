"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type ResultRow = {
  exercise_id: string;
  awarded_points: number;
  max_points: number;
  breakdown: Array<{ key: string; label: string; awarded: number; max: number; detail?: string }>;
  feedback: string | null;
  test_results: Array<{
    test_id: string;
    label: string | null;
    verdict: string;
    points: number;
    max_points: number;
    is_visible: boolean;
  }> | null;
};

export function BacExamResultsWorkspace({ subjectId, submissionId }: { subjectId: string; submissionId: string }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<{
    subject_title: string;
    total_points: number;
    final_grade: number;
    status: string;
  } | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [overrideMsg, setOverrideMsg] = useState<string | null>(null);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: {
          submission: {
            subject_title: string;
            total_points: number;
            final_grade: number;
            status: string;
          };
          results: ResultRow[];
        };
      }>(`/api/bac-exam/submissions/${submissionId}`);
      setSubmission(response.data.submission);
      setResults(response.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca rezultatele.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResults();
  }, [submissionId]);

  const applyOverride = async (exerciseId: string, maxPoints: number) => {
    const raw = overrideDraft[exerciseId];
    const newPoints = Number(raw);
    if (Number.isNaN(newPoints) || newPoints < 0) {
      setOverrideMsg("Punctaj invalid.");
      return;
    }
    try {
      const response = await apiFetch<{
        data: { total_points: number; final_grade: number; awarded_points: number };
      }>(`/api/bac-exam/admin/submissions/${submissionId}/override`, {
        method: "POST",
        body: JSON.stringify({
          exercise_id: exerciseId,
          new_points: Math.min(newPoints, maxPoints),
          reason: "Ajustare manuala admin",
        }),
      });
      setOverrideMsg(`Actualizat: ${response.data.awarded_points}p. Nota noua: ${response.data.final_grade}`);
      await loadResults();
    } catch (err) {
      setOverrideMsg(err instanceof Error ? err.message : "Override esuat.");
    }
  };

  if (loading) return <p className="p-8 text-sm text-zinc-600">Se calculeaza rezultatul...</p>;
  if (error) return <p className="p-8 text-sm text-rose-700">{error}</p>;
  if (!submission) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Rezultat examen</h1>
        <p className="mt-1 text-sm text-zinc-600">{submission.subject_title}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="text-xs uppercase text-sky-700">Punctaj total</p>
            <p className="text-2xl font-bold text-sky-900">{submission.total_points}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs uppercase text-emerald-700">Nota</p>
            <p className="text-2xl font-bold text-emerald-900">{submission.final_grade}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs uppercase text-zinc-600">Status</p>
            <p className="text-lg font-semibold text-zinc-900">{submission.status}</p>
          </div>
        </div>
        {overrideMsg ? <p className="mt-3 text-sm text-sky-700">{overrideMsg}</p> : null}
      </div>

      <div className="mt-6 space-y-3">
        {results.map((row) => (
          <div key={row.exercise_id} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-zinc-900">Exercitiu</p>
              <p className="text-sm font-medium text-zinc-700">
                {row.awarded_points}/{row.max_points}p
              </p>
            </div>
            {row.feedback ? <p className="mt-2 text-sm text-zinc-600">{row.feedback}</p> : null}
            {row.breakdown?.length ? (
              <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                {row.breakdown.map((item) => (
                  <li key={item.key}>
                    {item.label}: {item.awarded}/{item.max} {item.detail ? `— ${item.detail}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {row.test_results?.length ? (
              <div className="mt-3 rounded-lg bg-zinc-50 p-2 text-xs">
                {row.test_results
                  .filter((t) => t.is_visible)
                  .map((t) => (
                    <p key={t.test_id}>
                      {t.label ?? t.test_id}: {t.verdict} ({t.points}/{t.max_points}p)
                    </p>
                  ))}
              </div>
            ) : null}
            {isAdmin ? (
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-zinc-100 pt-3">
                <label className="text-xs text-zinc-600">
                  Ajustare manuala (admin)
                  <input
                    type="number"
                    min={0}
                    max={row.max_points}
                    step={0.5}
                    value={overrideDraft[row.exercise_id] ?? String(row.awarded_points)}
                    onChange={(e) => setOverrideDraft((p) => ({ ...p, [row.exercise_id]: e.target.value }))}
                    className="mt-1 block w-24 rounded border px-2 py-1 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void applyOverride(row.exercise_id, row.max_points)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700"
                >
                  Salveaza punctaj
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Link href={`/bacalaureat/examen/${subjectId}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50">
          Inapoi la subiect
        </Link>
        <Link href="/bacalaureat" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
          Bacalaureat
        </Link>
      </div>
    </div>
  );
}
