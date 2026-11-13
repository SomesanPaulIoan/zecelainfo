"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { SourceWorkspace } from "@/components/grile/SourceWorkspace";
import { apiFetch } from "@/lib/api";

type Question = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  explanation: string | null;
  video_url: string | null;
  difficulty: number | null;
  order_index: number | null;
  variants_count: number | null;
  chapter_names: string[] | null;
  is_flagged?: boolean;
  in_my_list?: boolean;
  last_attempt_at?: string | null;
  has_correct_attempt?: boolean;
  has_wrong_attempt?: boolean;
};

type EndpointResponse = {
  data: {
    questions: Question[];
  };
};

type Props = {
  title: string;
  endpoint: "/api/grile/me/my-list/questions" | "/api/grile/me/flagged/questions";
  sourceName: string;
  contextLabel: string;
  contextPurpose: string;
  /** Subtitlu sub titlul mare (hero) */
  heroDescription: string;
};

export function PersonalQuestionsWorkspace({
  title,
  endpoint,
  sourceName,
  contextLabel,
  contextPurpose,
  heroDescription,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await apiFetch<EndpointResponse>(endpoint);
        if (cancelled) return;
        setQuestions(response.data.questions ?? []);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
        <section className="mx-auto w-full max-w-none px-3 pb-10 pt-8 sm:px-4 lg:px-6">
          <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-30px_rgba(2,132,199,0.45)] backdrop-blur-sm sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Grile personale</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{heroDescription}</p>
              </div>
              <Link
                href="/grile"
                className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-amber-300/90 bg-gradient-to-r from-amber-100 to-yellow-100 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-sm transition hover:scale-[1.02] hover:border-amber-400 hover:from-amber-200 hover:to-yellow-200"
              >
                ← Înapoi la grile
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 rounded-2xl border border-sky-100 bg-white/80 p-6 shadow-sm">
              <div className="h-4 w-48 animate-pulse rounded-lg bg-slate-200/90" />
              <div className="h-3 w-full max-w-md animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full max-w-sm animate-pulse rounded bg-slate-100" />
              <p className="pt-2 text-sm font-medium text-slate-500">Se încarcă întrebările…</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-4 text-sm font-medium text-rose-800 shadow-sm">
              Nu am putut încărca întrebările tale acum. Încearcă din nou în câteva momente.
            </div>
          ) : null}

          {!loading && !error ? (
            <SourceWorkspace
              sourceId={endpoint === "/api/grile/me/my-list/questions" ? "my-list" : "flagged-list"}
              sourceName={sourceName}
              categoryName="Grile personale"
              questions={questions}
              contextLabel={contextLabel}
              contextPurpose={contextPurpose}
              progressScope="none"
            />
          ) : null}
        </section>
      </main>
    </RequireAuth>
  );
}
