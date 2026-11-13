"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import useSWR from "swr";

type PendingSubmission = {
  id: string;
  subject_id: number;
  status: "submitted" | "reviewed" | "draft";
  created_at: string;
  uploaded_pdf_name: string | null;
  uploaded_pdf_public_url: string | null;
  submitted_at: string | null;
  subject_name: string;
  student_email: string;
};

type PendingResponse = { data: PendingSubmission[] };

type Rubric = {
  id: number;
  code: string;
  title: string | null;
  max_points: string | number;
  sort_order: number;
};

type ReviewItem = {
  rubric_id: number;
  awarded_points: string | number;
  feedback_text?: string | null;
};

type ReviewFormResponse = {
  data: {
    submission: {
      id: string;
      status: string;
      uploaded_pdf_public_url: string | null;
      subject_name: string;
      subject_pdf_url: string;
      student_email: string;
    };
    rubrics: Rubric[];
    review: { id: string; total_score: number; feedback: string | null } | null;
    review_items: ReviewItem[];
  };
};

export function BacReviewAdminPanel() {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [awardedByRubric, setAwardedByRubric] = useState<Record<number, number>>({});
  const [feedbackByRubric, setFeedbackByRubric] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: pendingData,
    mutate: mutatePending,
    error: pendingError,
    isLoading: pendingLoading,
  } = useSWR<PendingResponse>("/api/bacalaureat/submissions/pending-review", apiFetch);
  const pending = pendingData?.data ?? [];

  const { data: reviewData, mutate: mutateReview } = useSWR<ReviewFormResponse>(
    selectedSubmissionId ? `/api/bacalaureat/submissions/${selectedSubmissionId}/review-form` : null,
    apiFetch,
  );

  const formData = reviewData?.data;

  const effectivePoints = useMemo(() => {
    if (!formData) return [];
    return formData.rubrics.map((rubric) => {
      const max = Number(rubric.max_points);
      const fallback = formData.review_items.find((item) => item.rubric_id === rubric.id);
      const existing = fallback ? Number(fallback.awarded_points) : max;
      const current = awardedByRubric[rubric.id];
      const feedbackCurrent = feedbackByRubric[rubric.id];
      return {
        ...rubric,
        max_points_number: max,
        awarded_points: Number.isFinite(current) ? current : existing,
        feedback_text: typeof feedbackCurrent === "string" ? feedbackCurrent : (fallback?.feedback_text ?? ""),
      };
    });
  }, [formData, awardedByRubric, feedbackByRubric]);

  const totalScore = useMemo(() => {
    const rubricTotal = effectivePoints.reduce((sum, rubric) => sum + Number(rubric.awarded_points || 0), 0);
    return Math.min(100, rubricTotal + 10);
  }, [effectivePoints]);

  const loadSubmission = async (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setMessage(null);
    setError(null);
    setAwardedByRubric({});
    setFeedbackByRubric({});
    setFeedback("");
    try {
      const response = await apiFetch<ReviewFormResponse>(`/api/bacalaureat/submissions/${submissionId}/review-form`);
      const review = response.data.review;
      setFeedback(review?.feedback ?? "");
      const next: Record<number, number> = {};
      const nextFeedback: Record<number, string> = {};
      for (const rubric of response.data.rubrics) {
        const existing = response.data.review_items.find((item) => item.rubric_id === rubric.id);
        next[rubric.id] = existing ? Number(existing.awarded_points) : Number(rubric.max_points);
        nextFeedback[rubric.id] = existing?.feedback_text ?? "";
      }
      setAwardedByRubric(next);
      setFeedbackByRubric(nextFeedback);
      await mutateReview(response, { revalidate: false });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nu am putut incarca submisia pentru corectare.");
    }
  };

  const saveReview = async () => {
    if (!selectedSubmissionId || !formData) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch(`/api/bacalaureat/submissions/${selectedSubmissionId}/review`, {
        method: "POST",
        body: JSON.stringify({
          feedback,
          items: effectivePoints.map((rubric) => ({
            rubric_id: Number(rubric.id),
            awarded_points: Number(rubric.awarded_points),
            feedback_text: rubric.feedback_text ?? "",
          })),
        }),
      });
      setMessage("Corectarea a fost salvata.");
      await mutatePending();
      await mutateReview();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nu am putut salva corectarea.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="corecteaza-subiecte-bac" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-12">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900">Corectare subiecte Bac</h2>
        <p className="mt-1 text-sm text-zinc-600">Vezi submisiile trimise spre corectare, acorda punctaje pe rubrici si salveaza feedback-ul.</p>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-semibold text-zinc-800">Submisii</p>
            <div className="mt-2 max-h-[70vh] space-y-2 overflow-auto">
              {pendingLoading ? <p className="text-xs text-zinc-500">Se incarca submisiile...</p> : null}
              {pendingError ? (
                <p className="text-xs text-rose-700">
                  Nu am putut incarca submisiile pentru corectare: {pendingError instanceof Error ? pendingError.message : "eroare necunoscuta"}.
                </p>
              ) : null}
              {pending.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => void loadSubmission(entry.id)}
                  className={`w-full rounded-lg border p-3 text-left text-xs ${
                    selectedSubmissionId === entry.id ? "border-sky-300 bg-sky-50" : "border-zinc-200 bg-white"
                  }`}
                >
                  <p className="font-semibold text-zinc-900">{entry.subject_name}</p>
                  <p className="mt-1 text-zinc-600">{entry.student_email}</p>
                  <p className="mt-1 text-zinc-500">Status: {entry.status}</p>
                </button>
              ))}
              {!pendingLoading && !pendingError && pending.length === 0 ? <p className="text-xs text-zinc-500">Nu exista submisii pentru corectare.</p> : null}
            </div>
          </aside>

          <div className="space-y-4">
            {!formData ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">Selecteaza o submisie din stanga.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <article className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Subiect</p>
                    <iframe src={formData.submission.subject_pdf_url} title="Subiect bac" className="mt-2 h-[60vh] w-full rounded-lg border border-zinc-200" />
                  </article>
                  <article className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rezolvare elev</p>
                    {formData.submission.uploaded_pdf_public_url ? (
                      <iframe src={formData.submission.uploaded_pdf_public_url} title="Rezolvare elev" className="mt-2 h-[60vh] w-full rounded-lg border border-zinc-200" />
                    ) : (
                      <p className="mt-2 text-sm text-rose-700">Nu exista PDF incarcat.</p>
                    )}
                  </article>
                </div>

                <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Rubrica de corectare</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                          <th className="px-2 py-2">Cod</th>
                          <th className="px-2 py-2">Rubrica</th>
                          <th className="px-2 py-2">Maxim</th>
                          <th className="px-2 py-2">Punctaj acordat</th>
                          <th className="px-2 py-2">Feedback pe rubrica</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectivePoints.map((rubric) => (
                          <tr key={rubric.id} className="border-b border-zinc-200">
                            <td className="px-2 py-2 font-semibold text-zinc-700">{rubric.code}</td>
                            <td className="px-2 py-2 text-zinc-700">{rubric.title ?? "-"}</td>
                            <td className="px-2 py-2 text-zinc-700">{rubric.max_points_number}</td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                max={rubric.max_points_number}
                                step="0.5"
                                value={rubric.awarded_points}
                                onChange={(event) =>
                                  setAwardedByRubric((prev) => ({
                                    ...prev,
                                    [rubric.id]: Number(event.target.value),
                                  }))
                                }
                                className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <textarea
                                rows={2}
                                value={rubric.feedback_text}
                                onChange={(event) =>
                                  setFeedbackByRubric((prev) => ({
                                    ...prev,
                                    [rubric.id]: event.target.value,
                                  }))
                                }
                                className="w-full min-w-[250px] rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <label className="mt-4 block text-sm font-medium text-zinc-700">
                    Feedback
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </label>
                  <p className="mt-2 text-sm font-semibold text-zinc-800">Nota finala (cu 10p din oficiu): {totalScore.toFixed(2)} / 100</p>
                  <button
                    type="button"
                    onClick={() => void saveReview()}
                    disabled={saving}
                    className="mt-3 rounded-xl bg-sky-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
                  >
                    {saving ? "Se salveaza..." : "Salveaza corectarea"}
                  </button>
                </article>
              </>
            )}
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
