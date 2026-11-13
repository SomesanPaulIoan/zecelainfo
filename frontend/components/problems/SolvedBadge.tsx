"use client";

import { useSolvedProblems } from "./SolvedProblemsProvider";

export function SolvedBadge({ problemId }: { problemId: string }) {
  const solved = useSolvedProblems().has(problemId);
  return <p className={`mt-3 text-sm font-medium ${solved ? "text-emerald-700" : "text-zinc-700"}`}>{solved ? "Rezolvata" : "Nerezolvata"}</p>;
}
