"use client";

import Link from "next/link";
import { BacPdfScrollViewer } from "@/components/bac/BacPdfScrollViewer";
import { apiFetch } from "@/lib/api";
import useSWR from "swr";

type SubmissionDetails = {
  id: string;
  subject_id: number;
  status: "draft" | "submitted" | "reviewed";
  started_at: string | null;
  finished_at: string | null;
  uploaded_pdf_name: string | null;
  uploaded_pdf_public_url: string | null;
  submitted_at: string | null;
  subject_name: string;
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
};

type SubmissionDetailsResponse = { data: SubmissionDetails };

export function BacSubmissionReviewWorkspace({ subjectId, submissionId }: { subjectId: string; submissionId: string }) {
  const { data, isLoading } = useSWR<SubmissionDetailsResponse>(`/api/bacalaureat/submissions/${submissionId}`, apiFetch);
  const submission = data?.data;

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca submisia...</main>;
  }

  if (!submission) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-rose-700">Submisia nu a fost gasita.</main>;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[1700px] px-3 py-6 sm:px-4 lg:px-6">
      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-sky-950">Submisie incarcată</h1>
        <p className="mt-1 text-sm text-slate-700">{submission.subject_name}</p>
        <p className="mt-2 text-sm text-slate-600">
          Status: <span className="font-semibold">{submission.status}</span>
        </p>
        <div className="mt-3">
          <Link href={`/bacalaureat/subiect/${subjectId}`} className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-50">
            Inapoi la subiect
          </Link>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-950">Subiect (PDF)</h2>
          <BacPdfScrollViewer src={submission.subject_pdf_url} title={`Subiect ${submission.subject_name}`} />
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-950">Rezolvarea ta (PDF)</h2>
          {submission.uploaded_pdf_public_url ? (
            <BacPdfScrollViewer src={submission.uploaded_pdf_public_url} title={`Rezolvare ${submission.subject_name}`} />
          ) : (
            <p className="mt-3 text-sm text-rose-700">Nu exista PDF incarcat pentru aceasta submisie.</p>
          )}
        </article>
      </section>
    </main>
  );
}
