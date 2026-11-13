"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type SolvedProblemsResponse = { data: string[] };

const SolvedProblemsContext = createContext<Set<string>>(new Set());

/**
 * Furnizeaza id-urile problemelor rezolvate de utilizatorul curent. Trebuie sa ruleze in browser:
 * token-ul de autentificare traieste doar in localStorage, deci paginile /problems randate pe server
 * (RSC) nu pot sti niciodata cine e logat — de-abia dupa mount, in acest provider, avem acces la el.
 */
export function SolvedProblemsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setSolvedIds(new Set());
      return;
    }
    let cancelled = false;
    void apiFetch<SolvedProblemsResponse>("/api/submissions/meta/solved-problems")
      .then((response) => {
        if (!cancelled) setSolvedIds(new Set(response.data));
      })
      .catch(() => {
        if (!cancelled) setSolvedIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return <SolvedProblemsContext.Provider value={solvedIds}>{children}</SolvedProblemsContext.Provider>;
}

export function useSolvedProblems(): Set<string> {
  return useContext(SolvedProblemsContext);
}
