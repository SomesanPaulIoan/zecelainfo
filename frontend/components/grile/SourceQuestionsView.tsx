"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { grileExamPath } from "@/lib/exams";
import { GrileAccessGate } from "@/components/grile/GrileAccessGate";
import { SourceWorkspace } from "@/components/grile/SourceWorkspace";

type SourceQuestion = {
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
  source_name?: string | null;
};

type SourceQuestionsResponse = {
  data: {
    source: { id: string; name: string; category_slug: string };
    category: { slug: string };
    questions: SourceQuestion[];
  };
};

type ChapterQuestionsResponse = {
  data: {
    chapter: { id: string; name: string; category_slug: string };
    questions: SourceQuestion[];
  };
};

type Loaded = {
  id: string;
  name: string;
  categorySlug: string;
  questions: SourceQuestion[];
};

type Props = {
  mode: "source" | "chapter";
  id: string;
};

function categoryNameFromSlug(slug: string): string {
  if (slug === "admitere-ubb") return "Admitere UBB";
  if (slug === "admitere-unstpb") return "Admitere UNSTPB";
  if (slug === "admitere-ub") return "Admitere UB";
  if (slug === "admitere-tu-iasi") return "Admitere TU Iasi";
  if (slug === "admitere-atm") return "Admitere ATM";
  if (slug === "bacalaureat") return "Bacalaureat";
  return slug;
}

function QuestionsLoader({ mode, id }: Props) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const path =
      mode === "source" ? `/api/grile/sources/${id}/questions` : `/api/grile/chapters/${id}/questions`;
    apiFetch<SourceQuestionsResponse | ChapterQuestionsResponse>(path)
      .then((response) => {
        if (cancelled) return;
        if (mode === "source") {
          const { source, questions } = (response as SourceQuestionsResponse).data;
          setLoaded({ id: source.id, name: source.name, categorySlug: source.category_slug, questions });
        } else {
          const { chapter, questions } = (response as ChapterQuestionsResponse).data;
          setLoaded({ id: chapter.id, name: chapter.name, categorySlug: chapter.category_slug, questions });
        }
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  if (state === "loading") {
    return (
      <div className="rounded-xl border border-sky-100 bg-white p-4 text-sm text-slate-600">
        Se incarca grilele...
      </div>
    );
  }

  if (state === "error" || !loaded) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
        {mode === "source" ? "Nu am putut incarca sursa de grile." : "Nu am putut incarca grilele pentru capitolul selectat."}
      </div>
    );
  }

  const categoryName = categoryNameFromSlug(loaded.categorySlug);
  const backHref =
    mode === "source"
      ? grileExamPath(loaded.categorySlug)
      : grileExamPath(loaded.categorySlug, "chapters");
  const backLabel = mode === "source" ? "← Inapoi la surse" : "← Inapoi la capitole";
  const subtitleSuffix = mode === "source" ? "mod rezolvare pe sursa" : "mod rezolvare pe capitol";

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">grile workspace</p>
            <h1 className="mt-1 text-2xl font-black text-sky-950 sm:text-3xl">{loaded.name}</h1>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {categoryName} · {subtitleSuffix}
            </p>
          </div>
          <Link
            href={backHref}
            className="rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:from-amber-200 hover:to-yellow-200"
          >
            {backLabel}
          </Link>
        </div>
      </div>
      {mode === "source" ? (
        <SourceWorkspace
          sourceId={loaded.id}
          sourceName={loaded.name}
          categoryName={categoryName}
          questions={loaded.questions}
          sequentialNavNumbers
        />
      ) : (
        <SourceWorkspace
          sourceId={loaded.id}
          sourceName={loaded.name}
          categoryName={categoryName}
          questions={loaded.questions}
          contextLabel="Capitol"
          contextPurpose="Setul de grile filtrat pe capitol"
          progressScope="chapter"
        />
      )}
    </>
  );
}

export function SourceQuestionsView({ mode, id }: Props) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-none px-2 pb-8 pt-6 sm:px-4 lg:px-6 2xl:px-10">
        <GrileAccessGate>
          <QuestionsLoader mode={mode} id={id} />
        </GrileAccessGate>
      </section>
    </main>
  );
}
