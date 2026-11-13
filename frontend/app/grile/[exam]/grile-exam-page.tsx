import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrileCategoryView } from "@/components/grile/GrileCategoryView";
import { apiFetch } from "@/lib/api";
import { getExamByGrileSlug, grileExamPath } from "@/lib/exams";
import { getGrileCategorySummary, type GrileCategoryDetails } from "@/lib/grile-data";
import { pageMetadata } from "@/lib/seo";

/** Logica comuna pentru /grile/[exam] (surse) si /grile/[exam]/capitole. */

export async function grileExamMetadata(slug: string, view: "sources" | "chapters"): Promise<Metadata> {
  const summary = await getGrileCategorySummary(slug);
  // Nota: layout-ul /grile are <Suspense>, deci statusul 200 pleaca inainte de notFound() din pagina;
  // categoriile inexistente primesc totusi UI-ul 404 si `noindex`.
  if (!summary) return { title: "Grile", robots: { index: false } };
  const exam = getExamByGrileSlug(slug);
  const name = summary.category.name;
  const baseTitle = exam?.grileSeoTitle ?? `Grile ${name}`;
  const count = summary.total_questions;
  if (view === "chapters") {
    return pageMetadata({
      title: `Grile ${exam?.grileLabel ?? name} pe capitole`,
      description: `${count} de grile ${exam?.grileLabel ?? name} grupate pe capitole (recursivitate, tablouri, grafuri, backtracking și altele), cu indicații, explicații și rezolvări video.`,
      path: grileExamPath(slug, "chapters"),
    });
  }
  return pageMetadata({
    title: baseTitle,
    description: exam?.grileMetaDescription ?? `${count} de grile pentru ${name}, cu indicații și explicații.`,
    path: grileExamPath(slug),
  });
}

export async function GrileExamPage({ slug, view }: { slug: string; view: "sources" | "chapters" }) {
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const [detailsResult, summary] = await Promise.all([
    apiFetch<{ data: GrileCategoryDetails }>(`/api/grile/categories/${slug}?view=${view}`).then(
      (response) => response.data,
      (error: unknown) => error,
    ),
    getGrileCategorySummary(slug),
  ]);
  // 404 doar cand categoria chiar nu exista; o pana de backend trebuie sa dea 500, nu sa „dezindexeze” pagina.
  if (detailsResult instanceof Error) {
    if (detailsResult.message.startsWith("API 404")) notFound();
    throw detailsResult;
  }
  const details = detailsResult as GrileCategoryDetails;
  return <GrileCategoryView details={details} summary={summary} selectedView={view} />;
}
