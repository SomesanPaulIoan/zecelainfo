"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api";
import useSWR from "swr";

type FeedbackResponse = {
  data: {
    submission: {
      id: string;
      subject_id: number;
      status: string;
      uploaded_pdf_public_url: string | null;
      uploaded_pdf_name: string | null;
      subject_name: string;
      subject_pdf_url: string;
      barem_pdf_url: string | null;
    };
    review: {
      id: string;
      total_score: number;
      feedback: string | null;
      created_at: string;
      updated_at: string;
    } | null;
    items: Array<{
      rubric_id: number;
      code: string;
      title: string | null;
      max_points: number;
      awarded_points: number;
      feedback_text?: string | null;
      sort_order: number;
    }>;
  };
};

export function BacSubmissionFeedbackClient({ subjectId, submissionId }: { subjectId: string; submissionId: string }) {
  const { data, isLoading } = useSWR<FeedbackResponse>(`/api/bacalaureat/submissions/${submissionId}/review`, apiFetch);
  const payload = data?.data;

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca feedback-ul...</main>;
  }

  if (!payload?.submission) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-rose-700">Nu am gasit datele submisiei.</main>;
  }

  if (!payload.review) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">Aceasta submisie nu este corectata inca.</p>
          <Link href={`/bacalaureat/subiect/${subjectId}`} className="mt-4 inline-flex rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100">
            Inapoi la subiect
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[1800px] px-3 py-6">
      <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sky-950">Feedback corectare</h1>
            <p className="mt-1 text-sm text-slate-700">{payload.submission.subject_name}</p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">Nota: {Number(payload.review.total_score).toFixed(2)} / 100</p>
          </div>
          <Link href={`/bacalaureat/subiect/${subjectId}`} className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-50">
            Inapoi la subiect
          </Link>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rezolvare elev</p>
            {payload.submission.uploaded_pdf_public_url ? (
              <Link href={payload.submission.uploaded_pdf_public_url} target="_blank" className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                Deschide in tab nou
              </Link>
            ) : null}
          </div>
          {payload.submission.uploaded_pdf_public_url ? (
            <iframe src={payload.submission.uploaded_pdf_public_url} title="Rezolvare elev" className="mt-2 h-[100vh] w-full rounded-lg border border-sky-100" />
          ) : (
            <p className="mt-2 text-sm text-rose-700">Nu exista PDF incarcat.</p>
          )}
        </article>

        <article className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Feedback</p>
          <div className="mt-2 max-h-[100vh] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Cod</th>
                  <th className="px-2 py-2">Rubrica</th>
                  <th className="px-2 py-2">Acordat</th>
                  <th className="px-2 py-2">Maxim</th>
                  <th className="px-2 py-2">Feedback pe rubrica</th>
                </tr>
              </thead>
              <tbody>
                {payload.items.map((item) => (
                  <tr key={`${item.rubric_id}-${item.code}`} className="border-b border-sky-50 text-slate-700">
                    <td className="px-2 py-2 font-semibold">{item.code}</td>
                    <td className="px-2 py-2">{item.title ?? "-"}</td>
                    <td className="px-2 py-2">{Number(item.awarded_points).toFixed(2)}</td>
                    <td className="px-2 py-2">{Number(item.max_points).toFixed(2)}</td>
                    <td className="px-2 py-2 whitespace-pre-wrap">{item.feedback_text?.trim() || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-sm font-semibold text-sky-900">Feedback profesor</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{payload.review.feedback?.trim() || "Nu a fost adaugat feedback textual."}</p>
          </div>
        </article>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Subiect PDF</p>
            <Link href={payload.submission.subject_pdf_url} target="_blank" className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
              Deschide in tab nou
            </Link>
          </div>
          <iframe src={payload.submission.subject_pdf_url} title="Subiect PDF" className="mt-2 h-[100vh] w-full rounded-lg border border-sky-100" />
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Barem PDF</p>
            {payload.submission.barem_pdf_url ? (
              <Link href={payload.submission.barem_pdf_url} target="_blank" className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
                Deschide in tab nou
              </Link>
            ) : null}
          </div>
          {payload.submission.barem_pdf_url ? (
            <iframe src={payload.submission.barem_pdf_url} title="Barem PDF" className="mt-2 h-[100vh] w-full rounded-lg border border-sky-100" />
          ) : (
            <p className="mt-2 text-sm text-zinc-600">Acest subiect nu are barem atasat.</p>
          )}
        </article>
      </section>
    </main>
  );
}
