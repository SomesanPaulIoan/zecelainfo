"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { apiFetch } from "@/lib/api";
import useSWR from "swr";

type Rubric = {
  id: number | string;
  code: string;
  title: string | null;
  max_points: number | string;
  sort_order: number;
};

type ReviewItem = {
  rubric_id: number | string;
  awarded_points: number | string;
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
      barem_pdf_url: string | null;
      student_full_name: string;
      student_email: string;
    };
    rubrics: Rubric[];
    review: { id: string; total_score: number; feedback: string | null } | null;
    review_items: ReviewItem[];
  };
};

export function BacAdminReviewWorkspace({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const lastInitializedSubmissionRef = useRef<string | null>(null);
  const [awardedByRubric, setAwardedByRubric] = useState<Record<number, number>>({});
  const [feedbackByRubric, setFeedbackByRubric] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, mutate, isLoading } = useSWR<ReviewFormResponse>(`/api/bacalaureat/submissions/${submissionId}/review-form`, apiFetch, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data) return;
    if (lastInitializedSubmissionRef.current === submissionId && isDirty) return;

    const response = data;
    const nextPoints: Record<number, number> = {};
    const nextFeedback: Record<number, string> = {};
    for (const rubric of response.data.rubrics) {
      const id = Number(rubric.id);
      const item = response.data.review_items.find((entry) => Number(entry.rubric_id) === id);
      nextPoints[id] = item ? Number(item.awarded_points) : Number(rubric.max_points);
      nextFeedback[id] = item?.feedback_text ?? "";
    }
    setAwardedByRubric(nextPoints);
    setFeedbackByRubric(nextFeedback);
    setFeedback(response.data.review?.feedback ?? "");
    setIsDirty(false);
    lastInitializedSubmissionRef.current = submissionId;
  }, [data, submissionId, isDirty]);

  useEffect(() => {
    if (!isDirty || saving) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, saving]);

  useEffect(() => {
    lastInitializedSubmissionRef.current = null;
    setIsDirty(false);
  }, [submissionId]);

  const payload = data?.data;
  const effectiveRubrics = useMemo(() => {
    if (!payload) return [];
    return payload.rubrics.map((rubric) => {
      const id = Number(rubric.id);
      const max = Number(rubric.max_points);
      const awarded = Number.isFinite(awardedByRubric[id]) ? awardedByRubric[id] : max;
      return {
        ...rubric,
        id,
        max_points_number: max,
        awarded_points: awarded,
        feedback_text: feedbackByRubric[id] ?? "",
      };
    });
  }, [payload, awardedByRubric, feedbackByRubric]);

  const totalScore = useMemo(() => {
    const rubricTotal = effectiveRubrics.reduce((sum, rubric) => sum + Number(rubric.awarded_points || 0), 0);
    return Math.min(100, rubricTotal + 10);
  }, [effectiveRubrics]);

  const saveReview = async () => {
    if (!payload) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch(`/api/bacalaureat/submissions/${submissionId}/review`, {
        method: "POST",
        body: JSON.stringify({
          feedback,
          items: effectiveRubrics.map((rubric) => ({
            rubric_id: Number(rubric.id),
            awarded_points: Number(rubric.awarded_points),
            feedback_text: rubric.feedback_text ?? "",
          })),
        }),
      });
      setIsDirty(false);
      setMessage("Corectarea a fost salvata.");
      await mutate();
      router.push("/admin/corecteaza-subiecte-bac");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nu am putut salva corectarea.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-zinc-50">
        <section className="mx-auto max-w-[1800px] px-3 py-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Corecteaza subiect Bac</h1>
              <p className="text-sm text-zinc-600">
                Elev: {payload?.submission.student_full_name ?? "-"} ({payload?.submission.student_email ?? "-"})
              </p>
            </div>
            <Link href="/admin/corecteaza-subiecte-bac" className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
              Inapoi la lista
            </Link>
          </div>

          {isLoading ? <p className="text-sm text-zinc-600">Se incarca submisia...</p> : null}
          {!isLoading && !payload ? <p className="text-sm text-rose-700">Submisia nu a fost gasita.</p> : null}

          {payload ? (
            <>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">PDF elev</p>
                    {payload.submission.uploaded_pdf_public_url ? (
                      <Link
                        href={payload.submission.uploaded_pdf_public_url}
                        target="_blank"
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                      >
                        Deschide in tab nou
                      </Link>
                    ) : null}
                  </div>
                  {payload.submission.uploaded_pdf_public_url ? (
                    <iframe src={payload.submission.uploaded_pdf_public_url} title="Rezolvare elev" className="mt-2 h-[100vh] w-full rounded-lg border border-zinc-200" />
                  ) : (
                    <p className="mt-2 text-sm text-rose-700">Nu exista PDF incarcat.</p>
                  )}
                </article>

                <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rubrici de corectare</p>
                  <div className="mt-2 max-h-[100vh] overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                          <th className="px-2 py-2">Cod</th>
                          <th className="px-2 py-2">Maxim</th>
                          <th className="px-2 py-2">Acordat</th>
                          <th className="px-2 py-2">Feedback rubrica</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectiveRubrics.map((rubric) => (
                          <tr key={rubric.id} className="border-b border-zinc-100 align-top">
                            <td className="px-2 py-2">
                              <p className="font-semibold text-zinc-800">{rubric.code}</p>
                              <p className="text-xs text-zinc-500">{rubric.title ?? "-"}</p>
                            </td>
                            <td className="px-2 py-2 text-zinc-700">{rubric.max_points_number}</td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                min={0}
                                max={rubric.max_points_number}
                                step="0.5"
                                value={rubric.awarded_points}
                                onChange={(event) => {
                                  setIsDirty(true);
                                  setAwardedByRubric((prev) => ({
                                    ...prev,
                                    [rubric.id]: Number(event.target.value),
                                  }));
                                }}
                                className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <textarea
                                rows={2}
                                value={rubric.feedback_text}
                                onChange={(event) => {
                                  setIsDirty(true);
                                  setFeedbackByRubric((prev) => ({
                                    ...prev,
                                    [rubric.id]: event.target.value,
                                  }));
                                }}
                                className="w-full min-w-[260px] rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <label className="mt-3 block text-sm font-medium text-zinc-700">
                    Feedback general
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(event) => {
                        setIsDirty(true);
                        setFeedback(event.target.value);
                      }}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </label>
                  <p className="mt-2 text-sm font-semibold text-zinc-800">Nota finala (cu 10p din oficiu): {totalScore.toFixed(2)} / 100</p>
                  <button
                    type="button"
                    onClick={() => void saveReview()}
                    disabled={saving}
                    className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                  >
                    {saving ? "Se salveaza..." : "Salveaza corectarea"}
                  </button>
                </article>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Subiect PDF</p>
                    <Link
                      href={payload.submission.subject_pdf_url}
                      target="_blank"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                    >
                      Deschide in tab nou
                    </Link>
                  </div>
                  <iframe src={payload.submission.subject_pdf_url} title="Subiect PDF" className="mt-2 h-[100vh] w-full rounded-lg border border-zinc-200" />
                </article>
                <article className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Barem PDF</p>
                    {payload.submission.barem_pdf_url ? (
                      <Link
                        href={payload.submission.barem_pdf_url}
                        target="_blank"
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                      >
                        Deschide in tab nou
                      </Link>
                    ) : null}
                  </div>
                  {payload.submission.barem_pdf_url ? (
                    <iframe src={payload.submission.barem_pdf_url} title="Barem PDF" className="mt-2 h-[100vh] w-full rounded-lg border border-zinc-200" />
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">Acest subiect nu are barem atasat.</p>
                  )}
                </article>
              </div>
            </>
          ) : null}

          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
        </section>
      </main>
    </RequireAuth>
  );
}
