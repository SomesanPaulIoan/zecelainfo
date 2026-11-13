import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Layers, Sparkles, Search } from "lucide-react";
import { fetchAllProblems } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { ProblemsOverviewStats } from "@/components/problems/ProblemsOverviewStats";
import { SolvedProblemsProvider } from "@/components/problems/SolvedProblemsProvider";
import { ChapterAccordion, ProblemRow, SolvedStatChip, type ChapterGroup } from "@/components/problems/ProblemCatalogTree";
import { CurrentProblemsHomeworkBanner } from "@/components/problems/CurrentProblemsHomeworkBanner";
import {
  taxonomy,
  levelOptions,
  getProblemLevel,
  classifyProblem,
  type ProblemItem,
  type ProblemLevel,
} from "@/lib/problem-taxonomy";

export const metadata: Metadata = pageMetadata({
  title: "Probleme de informatică cu evaluare automată",
  description:
    "Exersează programare cu probleme de informatică pentru liceu, cu evaluare automată a soluțiilor, teste variate și niveluri de dificultate.",
  path: "/problems",
});

type ProblemsPageProps = {
  searchParams: Promise<{
    difficulty?: "easy" | "medium" | "hard" | "facultate";
    level?: "grade9" | "grade10" | "grade11" | "bacalaureat" | "oop" | "concursuri";
    search?: string;
  }>;
};

function isProblemLevel(value: unknown): value is ProblemLevel {
  return (
    value === "grade9" ||
    value === "grade10" ||
    value === "grade11" ||
    value === "bacalaureat" ||
    value === "oop" ||
    value === "concursuri"
  );
}

const difficultyOptions: Array<{ label: string; value: ProblemItem["difficulty"] }> = [
  { label: "Usoara", value: "easy" },
  { label: "Medie", value: "medium" },
  { label: "Grea", value: "hard" },
  { label: "Facultate", value: "facultate" },
];

const DIFFICULTY_DOT: Record<ProblemItem["difficulty"], string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-rose-500",
  facultate: "bg-violet-500",
};

function buildFilterHref(overrides: { difficulty?: string; level?: string; search?: string }) {
  const params = new URLSearchParams();
  if (overrides.search) params.set("search", overrides.search);
  if (overrides.level) params.set("level", overrides.level);
  if (overrides.difficulty) params.set("difficulty", overrides.difficulty);
  const query = params.toString();
  return query ? `/problems?${query}` : "/problems";
}

/** Grupeaza problemele unui nivel pe capitole si subcategorii, ignorand nodurile fara nicio problema. */
function groupByChapter(levelProblems: ProblemItem[], level: ProblemLevel): ChapterGroup[] {
  const chapters = taxonomy[level] ?? [];
  const classified = levelProblems.map((problem) => ({ problem, ...classifyProblem(problem, chapters) }));

  return chapters
    .map((chapter) => {
      const subcategories = chapter.subcategories
        .map((subcategory) => ({
          name: subcategory.name,
          problems: classified.filter((entry) => entry.chapter.id === chapter.id && entry.subcategory.id === subcategory.id).map((entry) => entry.problem),
        }))
        .filter((group) => group.problems.length > 0);
      const total = subcategories.reduce((sum, group) => sum + group.problems.length, 0);
      return { chapter, subcategories, total };
    })
    .filter((group) => group.total > 0);
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const query = await searchParams;
  const selectedDifficulty = query.difficulty;
  const selectedLevel = isProblemLevel(query.level) ? query.level : undefined;
  const selectedSearch = query.search ?? "";
  const isFiltering = Boolean(selectedSearch || selectedDifficulty);

  const apiParams = new URLSearchParams();
  if (selectedDifficulty) apiParams.set("difficulty", selectedDifficulty);
  if (selectedSearch) apiParams.set("search", selectedSearch);

  let problems: ProblemItem[] = [];
  let total = 0;
  let loadError = false;

  try {
    const fetched = await fetchAllProblems(apiParams);
    problems = fetched.problems;
    total = fetched.total;
  } catch {
    loadError = true;
  }

  const filteredProblems = selectedLevel ? problems.filter((problem) => getProblemLevel(problem) === selectedLevel) : problems;

  // Cautarea si filtrul de dificultate au prioritate: afiseaza rezultate direct, fara sa mai fie nevoie sa navighezi prin arbore.
  const levelsToBrowse: ProblemLevel[] = selectedLevel ? [selectedLevel] : levelOptions.map((option) => option.value);
  const levelSections = isFiltering
    ? []
    : levelsToBrowse
        .map((level) => ({
          level,
          label: levelOptions.find((option) => option.value === level)!.label,
          chapters: groupByChapter(
            filteredProblems.filter((problem) => getProblemLevel(problem) === level),
            level,
          ),
        }))
        .filter((section) => section.chapters.length > 0);

  const hasAnyContent = isFiltering ? filteredProblems.length > 0 : levelSections.length > 0;

  return (
    <SolvedProblemsProvider>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-white/90 p-8 shadow-[0_20px_60px_-28px_rgba(2,132,199,0.35)] backdrop-blur">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-900">
                <Sparkles className="h-3.5 w-3.5" /> zecelainfo judge
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">Probleme algoritmice</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                Rezolva probleme cu evaluare automata, testeaza-ti codul instant si urmareste progresul pe capitole din
                programa de liceu.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <StatChip icon={Layers} label="Total probleme" value={String(total)} tone="sky" />
                <SolvedStatChip problemIds={filteredProblems.map((problem) => problem.id)} />
                <StatChip
                  icon={GraduationCap}
                  label="Nivel curent"
                  value={levelOptions.find((option) => option.value === selectedLevel)?.label ?? "Toate nivelurile"}
                  tone="violet"
                />
              </div>

              <ProblemsOverviewStats totalProblems={total} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div className="space-y-4 rounded-2xl border border-sky-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
            <form className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
              <input
                type="text"
                name="search"
                defaultValue={selectedSearch}
                placeholder="Cauta o problema dupa titlu..."
                className="w-full rounded-xl border border-sky-200 bg-sky-50/60 py-2.5 pl-10 pr-4 text-sm outline-none ring-sky-400 transition focus:bg-white focus:ring-2"
              />
              <input type="hidden" name="level" value={selectedLevel ?? ""} />
              <input type="hidden" name="difficulty" value={selectedDifficulty ?? ""} />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">Nivel</span>
              <FilterPill href={buildFilterHref({ difficulty: selectedDifficulty, search: selectedSearch })} active={!selectedLevel}>
                Toate
              </FilterPill>
              {levelOptions.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref({ difficulty: selectedDifficulty, search: selectedSearch, level: option.value })}
                  active={selectedLevel === option.value}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">Dificultate</span>
              <FilterPill href={buildFilterHref({ level: selectedLevel, search: selectedSearch })} active={!selectedDifficulty}>
                Toate
              </FilterPill>
              {difficultyOptions.map((option) => (
                <FilterPill
                  key={option.value}
                  href={buildFilterHref({ level: selectedLevel, search: selectedSearch, difficulty: option.value })}
                  active={selectedDifficulty === option.value}
                  dot={DIFFICULTY_DOT[option.value]}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <CurrentProblemsHomeworkBanner />
          {loadError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              Nu am putut incarca problemele. Incearca sa reincarci pagina.
            </p>
          ) : null}

          {!loadError && !hasAnyContent ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-sky-300 bg-white/70 px-6 py-16 text-center">
              <Sparkles className="h-8 w-8 text-sky-300" />
              <p className="text-sm font-semibold text-zinc-700">Nu exista probleme pentru filtrele selectate.</p>
              <p className="text-xs text-zinc-500">Adaugam probleme noi in mod constant - revino in curand.</p>
              <Link href="/problems" className="rounded-xl border border-sky-300 bg-white px-4 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-50">
                Vezi toate problemele
              </Link>
            </div>
          ) : null}

          {!loadError && isFiltering && filteredProblems.length > 0 ? (
            <ProblemListCard title="Rezultate" subtitle={`${filteredProblems.length} probleme gasite`}>
              {filteredProblems.map((problem) => (
                <ProblemRow key={problem.id} problem={problem} />
              ))}
            </ProblemListCard>
          ) : null}

          {!loadError && !isFiltering && levelSections.length > 0 ? (
            <div className="space-y-8">
              {levelSections.map(({ level, label, chapters }) => (
                <div key={level} className="space-y-3">
                  {!selectedLevel ? <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-sky-700">{label}</h2> : null}
                  <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white/90 shadow-[0_14px_40px_-30px_rgba(3,105,161,0.35)] backdrop-blur">
                    {chapters.map((group) => (
                      <ChapterAccordion key={group.chapter.id} group={group} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </SolvedProblemsProvider>
  );
}

const STAT_CHIP_TONES = {
  sky: { border: "border-sky-200", bg: "bg-gradient-to-br from-sky-50 to-sky-100/60", icon: "bg-sky-100 text-sky-700", value: "text-sky-950" },
  emerald: {
    border: "border-emerald-200",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-950",
  },
  violet: {
    border: "border-violet-200",
    bg: "bg-gradient-to-br from-violet-50 to-violet-100/60",
    icon: "bg-violet-100 text-violet-700",
    value: "text-violet-950",
  },
} as const;

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: keyof typeof STAT_CHIP_TONES;
}) {
  const t = STAT_CHIP_TONES[tone];
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border ${t.border} ${t.bg} px-3.5 py-2.5 shadow-sm`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-600">{label}</p>
        <p className={`text-sm font-bold leading-tight ${t.value}`}>{value}</p>
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  dot,
  children,
}: {
  href: string;
  active: boolean;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-amber-400 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900 shadow-sm"
          : "border-sky-200 bg-white text-sky-800 hover:border-sky-400 hover:bg-sky-50"
      }`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-slate-900" : dot}`} /> : null}
      {children}
    </Link>
  );
}

function ProblemListCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-sky-200/80 bg-white/90 shadow-[0_14px_40px_-30px_rgba(3,105,161,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-sky-50/50 px-5 py-4">
        <h2 className="text-lg font-bold tracking-tight text-sky-950">{title}</h2>
        <p className="text-xs font-medium text-sky-700">{subtitle}</p>
      </div>
      <div className="divide-y divide-sky-100">{children}</div>
    </div>
  );
}
