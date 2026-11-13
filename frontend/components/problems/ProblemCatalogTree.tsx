"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Trophy } from "lucide-react";
import type { ChapterDef, ProblemItem } from "@/lib/problem-taxonomy";
import { useSolvedProblems } from "./SolvedProblemsProvider";
import { AddToProblemsHomeworkButton } from "./AddToProblemsHomeworkButton";

export type SubcategoryGroup = { name: string; problems: ProblemItem[] };
export type ChapterGroup = { chapter: ChapterDef; subcategories: SubcategoryGroup[]; total: number };

const DIFFICULTY_BADGE: Record<ProblemItem["difficulty"], string> = {
  easy: "border-emerald-300 bg-emerald-100 text-emerald-800",
  medium: "border-amber-300 bg-amber-100 text-amber-800",
  hard: "border-rose-300 bg-rose-100 text-rose-800",
  facultate: "border-violet-300 bg-violet-100 text-violet-800",
};

/** Cate din problemele curent afisate sunt rezolvate de utilizator — calculat in browser (vezi SolvedProblemsProvider). */
export function SolvedStatChip({ problemIds }: { problemIds: string[] }) {
  const solvedSet = useSolvedProblems();
  const solvedInView = problemIds.filter((id) => solvedSet.has(id)).length;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 px-3.5 py-2.5 shadow-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <Trophy className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-600">Rezolvate</p>
        <p className="text-sm font-bold leading-tight text-emerald-950">{solvedInView}</p>
      </div>
    </div>
  );
}

/** Acordeon de capitol. Daca are o singura subcategorie, sare peste nivelul de nesting si listeaza direct problemele. */
export function ChapterAccordion({ group }: { group: ChapterGroup }) {
  const solvedSet = useSolvedProblems();
  const { chapter, subcategories, total } = group;
  const solvedCount = subcategories.reduce(
    (sum, sub) => sum + sub.problems.filter((problem) => solvedSet.has(problem.id)).length,
    0,
  );

  return (
    <details className="group border-b border-sky-100 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition hover:bg-sky-50/70 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <ChevronRight className="h-4 w-4 shrink-0 text-sky-400 transition-transform duration-200 group-open:rotate-90" />
          <h3 className="truncate text-base font-bold text-sky-950">{chapter.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs font-semibold text-slate-500">
          <span>{total} probleme</span>
          <span className="text-emerald-600">{solvedCount} rezolvate</span>
        </div>
      </summary>
      <div className="border-t border-sky-100 bg-sky-50/30">
        {subcategories.length === 1
          ? subcategories[0].problems.map((problem) => <ProblemRow key={problem.id} problem={problem} />)
          : subcategories.map((sub) => <SubcategoryAccordion key={sub.name} group={sub} />)}
      </div>
    </details>
  );
}

function SubcategoryAccordion({ group }: { group: SubcategoryGroup }) {
  const solvedSet = useSolvedProblems();
  const solvedCount = group.problems.filter((problem) => solvedSet.has(problem.id)).length;
  return (
    <details className="group/sub border-b border-sky-100 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 pl-9 pr-5 transition hover:bg-sky-50 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-400 transition-transform duration-200 group-open/sub:rotate-90" />
          <p className="truncate text-sm font-semibold text-slate-700">{group.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-semibold text-slate-500">
          <span>{group.problems.length} probleme</span>
          <span className="text-emerald-600">{solvedCount} rezolvate</span>
        </div>
      </summary>
      <div className="bg-white">
        {group.problems.map((problem) => (
          <ProblemRow key={problem.id} problem={problem} />
        ))}
      </div>
    </details>
  );
}

export function ProblemRow({ problem }: { problem: ProblemItem }) {
  const solvedSet = useSolvedProblems();
  const solved = solvedSet.has(problem.id);
  return (
    <div className="group/row flex items-center gap-3 border-t border-sky-100 px-5 py-3 transition first:border-t-0 hover:bg-sky-50/60">
      <Link href={`/problems/${problem.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        {solved ? (
          <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-emerald-500" />
        ) : (
          <Circle className="h-[18px] w-[18px] shrink-0 text-zinc-300" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 group-hover/row:text-sky-900">{problem.title}</span>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {problem.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
              #{tag}
            </span>
          ))}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${DIFFICULTY_BADGE[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover/row:translate-x-0.5 group-hover/row:text-sky-500" />
      </Link>
      <AddToProblemsHomeworkButton problemId={problem.id} />
    </div>
  );
}
