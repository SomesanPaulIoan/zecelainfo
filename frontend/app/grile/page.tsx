import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { GrileAccessGate } from "@/components/grile/GrileAccessGate";
import { GrileOverviewCategories } from "@/components/grile/GrileOverviewCategories";
import { GrileOverviewStats } from "@/components/grile/GrileOverviewStats";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { grileExamPath, TARGET_EXAM_YEAR } from "@/lib/exams";
import { GRILE_PACKAGES_ANCHOR } from "@/lib/grile-packages";
import {
  getGrileCategories,
  getGrileCategorySummary,
  getGrileGlobalSummary,
  type GrileCategory,
  type GrileCategorySummary,
} from "@/lib/grile-data";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type GrilePageProps = {
  searchParams: Promise<{
    exam?: string;
    view?: "sources" | "chapters";
  }>;
};

function overviewSubtitle(totalQuestions: number | null, totalWithVideo: number | null): string {
  if (!totalQuestions) {
    return "Mii de grile de informatică pentru admitere și Bacalaureat, cu indicații, explicații și rezolvări video filmate de Paul.";
  }
  const video = totalWithVideo ? ` și ${formatRoNumber(totalWithVideo)} de explicații video filmate de Paul` : "";
  return `${formatRoNumber(totalQuestions)} de grile de informatică pentru admitere și Bacalaureat, cu indicații și explicații pas cu pas${video}. Alege examenul și începe să rezolvi.`;
}

export async function generateMetadata(): Promise<Metadata> {
  const summary = await getGrileGlobalSummary();
  const description = summary
    ? `${formatRoNumber(summary.total_questions)} de grile de informatică pentru admitere (UBB, UB, Politehnica, Iași, ATM) și Bacalaureat, cu explicații și ${formatRoNumber(summary.total_with_video)} de rezolvări video.`
    : "Grile de informatică pentru admitere (UBB, UB, Politehnica, Iași, ATM) și Bacalaureat, cu explicații și rezolvări video.";
  return pageMetadata({
    title: `Grile Admitere Informatică și Bac ${TARGET_EXAM_YEAR} – Teste cu Explicații`,
    description,
    path: "/grile",
  });
}

export default async function GrilePage({ searchParams }: GrilePageProps) {
  const query = await searchParams;
  // URL-urile vechi `/grile?exam=…` sunt redirectionate 301 in `proxy.ts`; asta e doar plasa de siguranta.
  if (query.exam && /^[a-z0-9-]+$/.test(query.exam)) {
    permanentRedirect(grileExamPath(query.exam, query.view === "chapters" ? "chapters" : "sources"));
  }

  const [categoriesResult, globalSummary] = await Promise.all([getGrileCategories(), getGrileGlobalSummary()]);
  const categories: GrileCategory[] = categoriesResult ?? [];
  const loadError = categoriesResult === null;
  const summaries = await Promise.all(categories.map((category) => getGrileCategorySummary(category.slug)));
  const initialSummaries: Record<string, GrileCategorySummary> = {};
  summaries.forEach((summary, index) => {
    if (summary) initialSummaries[categories[index].slug] = summary;
  });
  const allSummariesLoaded = summaries.every(Boolean);
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
      <section className="mx-auto w-full max-w-none px-3 pb-8 pt-6 sm:px-4 sm:pt-8 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-5 shadow-[0_20px_70px_-30px_rgba(2,132,199,0.5)] backdrop-blur-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="relative">
            <Breadcrumbs
              items={[
                { name: "Acasă", path: "/" },
                { name: "Grile", path: "/grile" },
              ]}
            />
            <h1 className="mt-4 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
              Grile de informatică pentru admitere și Bacalaureat
            </h1>
            <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-slate-700">
              {overviewSubtitle(globalSummary?.total_questions ?? null, globalSummary?.total_with_video ?? null)}
            </p>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-sky-900">
              Nu doar vezi că ai greșit. Înțelegi de ce ai greșit.
            </p>
            {globalSummary ? <GrileOverviewStats globalSummary={globalSummary} /> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-14 sm:px-4 lg:px-6 2xl:px-10">
        {loadError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            Nu am putut încărca categoriile de grile. Te rugăm să reîncarci pagina în câteva momente.
          </p>
        ) : (
          <>
            <div className="rounded-3xl border border-sky-200/80 bg-white/90 p-4 shadow-[0_14px_50px_-28px_rgba(3,105,161,0.45)] sm:p-7">
              <div className="mb-5 flex flex-col gap-2 border-b border-sky-100/90 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Dashboard grile</p>
                  <h2 className="mt-1.5 text-xl font-black tracking-tight text-sky-950 sm:text-2xl">Alege examenul</h2>
                  <p className="mt-1 max-w-xl text-sm text-slate-600">
                    Alege examenul pentru care te pregătești. Fiecare categorie are subiectele reale, pe surse și pe capitole.
                  </p>
                </div>
                <span className="inline-flex w-fit shrink-0 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-sm">
                  {categories.length} categorii active
                </span>
              </div>
              <GrileOverviewCategories
                categories={categories}
                initialSummaries={allSummariesLoaded ? initialSummaries : undefined}
              />
            </div>
            <div id={GRILE_PACKAGES_ANCHOR} className="mt-8 scroll-mt-24">
              <GrileAccessGate>{null}</GrileAccessGate>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
