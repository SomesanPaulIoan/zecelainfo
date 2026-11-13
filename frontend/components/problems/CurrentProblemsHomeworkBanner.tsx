"use client";

import { useCurrentProblemsHomework } from "./AddToProblemsHomeworkButton";

/** Vizibil doar pentru admin/profesor: arata pe ce tema de probleme cad butoanele "Adauga in tema" de mai jos. */
export function CurrentProblemsHomeworkBanner() {
  const { isAdmin, assignment } = useCurrentProblemsHomework();
  if (!isAdmin || !assignment) return null;

  return (
    <div className="mb-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-sky-50 to-white px-4 py-3 text-sm text-indigo-950 shadow-sm">
      <p className="font-extrabold uppercase tracking-wide text-indigo-900">Tema curenta la probleme</p>
      <p className="mt-1 text-xs font-medium text-indigo-900/90">
        Grupa: {assignment.group_name} · Perioada: {assignment.start_date} – {assignment.end_date} · {assignment.item_count}{" "}
        {assignment.item_count === 1 ? "problema" : "probleme"} in lista temei. Foloseste butonul „Adauga in tema” de pe fiecare
        rand.
      </p>
    </div>
  );
}
