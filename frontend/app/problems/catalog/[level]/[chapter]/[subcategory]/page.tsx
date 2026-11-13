import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchAllProblems } from "@/lib/api";
import { classifyProblem, getProblemLevel, taxonomy, type ProblemItem, type ProblemLevel } from "@/lib/problem-taxonomy";
import { SolvedProblemsProvider } from "@/components/problems/SolvedProblemsProvider";
import { SolvedBadge } from "@/components/problems/SolvedBadge";

const difficultyStyles: Record<ProblemItem["difficulty"], string> = {
  easy: "border-emerald-300 bg-emerald-100/80 text-emerald-800",
  medium: "border-amber-300 bg-amber-100/80 text-amber-800",
  hard: "border-rose-300 bg-rose-100/80 text-rose-800",
  facultate: "border-violet-300 bg-violet-100/80 text-violet-800",
};

export default async function SubcategoryProblemsPage({
  params,
}: {
  params: Promise<{ level: string; chapter: string; subcategory: string }>;
}) {
  const { level, chapter, subcategory } = await params;
  const typedLevel = level as ProblemLevel;
  const chapters = taxonomy[typedLevel];
  if (!chapters) notFound();

  const chapterDef = chapters.find((entry) => entry.id === chapter);
  const subcategoryDef = chapterDef?.subcategories.find((entry) => entry.id === subcategory);
  if (!chapterDef || !subcategoryDef) notFound();

  let problems: ProblemItem[] = [];
  try {
    const response = await fetchAllProblems(new URLSearchParams());
    problems = response.problems;
  } catch {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">Nu am putut incarca problemele pentru subcategorie.</p>
      </main>
    );
  }

  const filtered = problems
    .filter((problem) => getProblemLevel(problem) === typedLevel)
    .filter((problem) => {
      const classified = classifyProblem(problem, chapters);
      return classified.chapter.id === chapter && classified.subcategory.id === subcategory;
    });

  return (
    <SolvedProblemsProvider>
      <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100/80">
        <section className="mx-auto max-w-7xl px-6 pb-6 pt-10">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <Link href={`/problems?level=${typedLevel}`} className="text-sm font-medium text-violet-700 hover:text-violet-800">
              {"<-"} Inapoi la capitole
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-zinc-900">{subcategoryDef.name}</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Capitol: {chapterDef.name} • {filtered.length} probleme
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-14">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">Nu exista probleme in aceasta subcategorie momentan.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((problem) => (
                <Link
                  key={problem.id}
                  href={`/problems/${problem.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-zinc-200/40 blur-2xl transition group-hover:bg-violet-200/50" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold text-zinc-900 transition group-hover:text-violet-700">{problem.title}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${difficultyStyles[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-600">{problem.source ?? "Sursa interna"}</p>
                    <SolvedBadge problemId={problem.id} />
                    <div className="mt-4 text-sm font-medium text-violet-700">Deschide problema {"->"}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </SolvedProblemsProvider>
  );
}
