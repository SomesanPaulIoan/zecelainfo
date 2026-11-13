import Link from "next/link";
import { CategoryEntryGrid } from "@/components/grile/CategoryEntryGrid";
import { CategoryInstantStats } from "@/components/grile/CategoryInstantStats";
import { GrileAccessGate } from "@/components/grile/GrileAccessGate";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buttonClass } from "@/components/ui/ButtonLink";
import { EXAMS, getExamByGrileSlug, grileExamPath } from "@/lib/exams";
import type { GrileCategoryDetails, GrileCategorySummary } from "@/lib/grile-data";
import { sourceTagTabOrderForCategory, withResolvedSourceTags } from "@/lib/grile-sources";
import { formatRoNumber } from "@/lib/seo";

type Props = {
  details: GrileCategoryDetails;
  summary: GrileCategorySummary | null;
  selectedView: "sources" | "chapters";
};

/** Pagina unei categorii de grile (/grile/[exam] si /grile/[exam]/capitole), randata complet pe server. */
export function GrileCategoryView({ details, summary, selectedView }: Props) {
  const slug = details.category.slug;
  const exam = getExamByGrileSlug(slug);
  const label = exam?.grileLabel ?? details.category.name;
  const entries = selectedView === "sources" ? withResolvedSourceTags(details.sources, slug) : details.chapters;
  const examModeCount = details.sources.filter((source) => source.exam_mode_enabled).length;
  const otherExams = EXAMS.filter((item) => item.grileSlug !== slug);

  const breadcrumbs = [
    { name: "Acasă", path: "/" },
    { name: "Grile", path: "/grile" },
    { name: details.category.name, path: grileExamPath(slug) },
    ...(selectedView === "chapters" ? [{ name: "Pe capitole", path: grileExamPath(slug, "chapters") }] : []),
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
      <section className="mx-auto w-full max-w-none px-3 pb-8 pt-6 sm:px-4 sm:pt-8 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-5 shadow-[0_20px_70px_-30px_rgba(2,132,199,0.5)] backdrop-blur-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Breadcrumbs items={breadcrumbs} />
              <Link
                href="/grile"
                className="inline-flex shrink-0 items-center rounded-full border-2 border-amber-300/90 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition hover:border-amber-400 hover:from-amber-200 hover:to-yellow-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:px-5"
              >
                ← Toate categoriile
              </Link>
            </div>
            <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
              Grile {label}
              {selectedView === "chapters" ? <span className="text-sky-700"> pe capitole</span> : null}
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-slate-700">
              {exam?.grileIntro ?? `Grile de pregătire pentru ${details.category.name}, cu indicații și explicații.`}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              Rezolvă pe <strong className="font-semibold text-slate-800">surse</strong> (subiect cu subiect) sau pe{" "}
              <strong className="font-semibold text-slate-800">capitole</strong>.
              {examModeCount > 0
                ? ` ${examModeCount} surse au și modul „Examen”: le rezolvi pe timp, iar la final primești nota.`
                : null}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#lista-grile" className={buttonClass("primary", "lg")}>
                Începe să rezolvi
              </a>
              {exam?.courseSlug ? (
                <Link href={`/cursuri/${exam.courseSlug}`} className={buttonClass("secondary", "lg")}>
                  Vezi cursul {exam.shortName}
                </Link>
              ) : null}
              {exam?.landingPath ? (
                <Link href={exam.landingPath} className={buttonClass("ghost", "lg")}>
                  {exam.grileSlug === "bacalaureat" ? "Ghid Bacalaureat" : `Pachete admitere ${exam.shortName}`} →
                </Link>
              ) : null}
            </div>

            <CategoryInstantStats categorySlug={slug} categoryName={details.category.name} initialSummary={summary} />

            {summary && summary.total_with_video > 0 ? (
              <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-700">
                <strong className="font-extrabold text-sky-950">Nu doar vezi că ai greșit. Înțelegi de ce ai greșit.</strong>{" "}
                {formatRoNumber(summary.total_with_video)} din cele {formatRoNumber(summary.total_questions)} de grile au
                rezolvare video, iar {formatRoNumber(summary.total_with_explanation)} au explicații pas cu pas.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section id="lista-grile" className="mx-auto w-full max-w-none scroll-mt-20 px-3 pb-14 sm:px-4 lg:px-6 2xl:px-10">
        <div className="space-y-7">
          <div className="rounded-3xl border border-sky-200/80 bg-white/90 p-4 shadow-[0_14px_50px_-28px_rgba(3,105,161,0.45)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-wide text-sky-900">Ce vrei să înveți astăzi?</h2>
              <div className="inline-flex rounded-2xl border border-sky-200 bg-sky-50 p-1.5" role="group" aria-label="Mod de afișare">
                <Link
                  href={grileExamPath(slug, "sources")}
                  aria-current={selectedView === "sources" ? "page" : undefined}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition ${
                    selectedView === "sources"
                      ? "bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900 shadow-sm"
                      : "text-sky-800 hover:bg-white"
                  }`}
                >
                  Surse Grile
                </Link>
                <Link
                  href={grileExamPath(slug, "chapters")}
                  aria-current={selectedView === "chapters" ? "page" : undefined}
                  className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide transition ${
                    selectedView === "chapters"
                      ? "bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900 shadow-sm"
                      : "text-sky-800 hover:bg-white"
                  }`}
                >
                  Capitole Grile
                </Link>
              </div>
            </div>

            <CategoryEntryGrid
              selectedView={selectedView}
              activeCategorySlug={slug}
              sourceTagTabOrder={sourceTagTabOrderForCategory(slug)}
              entries={entries}
            />

            {entries.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm font-medium text-slate-600">
                {selectedView === "sources"
                  ? "Nu există încă surse pentru această categorie."
                  : "Nu există încă capitole pentru această categorie."}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <GrileAccessGate>{null}</GrileAccessGate>
        </div>

        <nav aria-label="Grile pentru alte examene" className="mt-10 rounded-3xl border border-sky-100 bg-white/80 p-5 sm:p-6">
          <h2 className="text-base font-black text-sky-950">Grile pentru alte examene</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherExams.map((item) => (
              <li key={item.grileSlug}>
                <Link
                  href={grileExamPath(item.grileSlug)}
                  className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-sky-900 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  Grile {item.grileLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </main>
  );
}
