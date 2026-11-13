"use client";

import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type CurrentProblemsHomeworkResponse = {
  data: {
    assignment: {
      id: string;
      group_id: string;
      group_name: string;
      start_date: string;
      end_date: string;
      item_count: number;
    } | null;
  };
};

/** Cheia SWR e comuna tuturor rândurilor din pagina de probleme, asa ca fetch-ul se face o singura data. */
const CURRENT_PROBLEMS_HOMEWORK_KEY = "/api/meditations/admin/problems-homework/current";

export function useCurrentProblemsHomework() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "professor";
  const { data, mutate } = useSWR<CurrentProblemsHomeworkResponse>(isAdmin ? CURRENT_PROBLEMS_HOMEWORK_KEY : null, apiFetch);
  return { isAdmin, assignment: data?.data?.assignment ?? null, mutate };
}

export function AddToProblemsHomeworkButton({ problemId }: { problemId: string }) {
  const { isAdmin, assignment, mutate } = useCurrentProblemsHomework();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAdmin || !assignment) return null;

  const handleAdd = async () => {
    setAdding(true);
    setMessage(null);
    try {
      const res = await apiFetch<{ data: { added: number } }>("/api/meditations/admin/problems-homework/current/items", {
        method: "POST",
        body: JSON.stringify({ problem_id: problemId }),
      });
      setMessage(res.data.added > 0 ? "Adaugata!" : "Era deja in tema");
      await mutate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Eroare");
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleAdd();
      }}
      disabled={adding}
      title={`Tema curenta: ${assignment.group_name} (${assignment.start_date} – ${assignment.end_date})`}
      className="inline-flex shrink-0 items-center rounded-lg border-2 border-indigo-300 bg-gradient-to-r from-indigo-100 to-sky-100 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-indigo-900 transition hover:from-indigo-200 hover:to-sky-200 disabled:opacity-60"
    >
      {adding ? "Se adauga..." : (message ?? "Adauga in tema")}
    </button>
  );
}
