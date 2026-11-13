"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { apiFetch } from "@/lib/api";

type ExamSubject = {
  id: string;
  title: string;
  session_label: string | null;
  year: number | null;
  variant_label: string | null;
  duration_minutes: number;
};

export default function BacExamListPage() {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch<{ data: ExamSubject[] }>("/api/bac-exam/subjects");
        setSubjects(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut incarca subiectele.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">Examene Bac — corectare automata</h1>
        <p className="mt-2 text-sm text-zinc-600">Rezolva subiecte interactive cu notare automata.</p>
        {loading ? <p className="mt-6 text-sm text-zinc-500">Se incarca...</p> : null}
        {error ? <p className="mt-6 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-6 space-y-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/bacalaureat/examen/${subject.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-sky-300 hover:bg-sky-50/30"
            >
              <p className="font-semibold text-zinc-900">{subject.title}</p>
              <p className="text-sm text-zinc-600">
                {subject.session_label} {subject.year ?? ""} • Varianta {subject.variant_label ?? "—"} • {subject.duration_minutes} min
              </p>
            </Link>
          ))}
          {!loading && subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">Nu exista subiecte active momentan.</p>
          ) : null}
        </div>
        <Link href="/bacalaureat" className="mt-6 inline-block text-sm text-sky-700 hover:underline">
          Inapoi la Bacalaureat
        </Link>
      </main>
    </RequireAuth>
  );
}
