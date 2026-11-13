import type { Metadata } from "next";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { grileExamPath } from "@/lib/exams";
import { ExamWorkspace } from "@/components/grile/ExamWorkspace";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type SourcePageProps = {
  params: Promise<{ sourceId: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

type SourceQuestionsResponse = {
  data: {
    source: {
      id: string;
      name: string;
      category_slug: string;
    };
  };
};

export default async function SourceExamPage({ params, searchParams }: SourcePageProps) {
  const { sourceId } = await params;
  const query = await searchParams;
  const initialAttemptId = typeof query.attempt === "string" ? query.attempt : null;
  let sourceName = "Sursa";
  let categorySlug: string | null = null;
  try {
    const response = await apiFetch<SourceQuestionsResponse>(`/api/grile/sources/${sourceId}/questions`);
    sourceName = response.data.source.name;
    categorySlug = response.data.source.category_slug;
  } catch {
    sourceName = "Sursa";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-none px-2 pb-8 pt-6 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative mb-4 overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-0 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">mod examen</p>
              <h1 className="mt-1 text-2xl font-black text-sky-950 sm:text-3xl">{sourceName}</h1>
              <p className="mt-1 text-sm font-medium text-slate-700">Simulare cu cronometru, scor instant si review complet</p>
            </div>
            <Link
              href={categorySlug ? grileExamPath(categorySlug) : "/grile"}
              className="rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:from-amber-200 hover:to-yellow-200"
            >
              ← Inapoi la grile
            </Link>
          </div>
        </div>
        <ExamWorkspace sourceId={sourceId} sourceName={sourceName} initialAttemptId={initialAttemptId} />
      </section>
    </main>
  );
}
