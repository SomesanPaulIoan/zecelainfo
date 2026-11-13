"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { ProblemWorkspace } from "./ProblemWorkspace";

type FullProblem = ComponentProps<typeof ProblemWorkspace>["problem"];

// Serverul trimite doar varianta publica (enunt). Utilizatorii autentificati primesc
// editorul, iar indicatiile/explicatiile/solutiile oficiale se aduc abia aici, in client,
// ca sa nu ajunga in HTML-ul public al paginii.
export function ProblemGate({ slug, publicView }: { slug: string; publicView: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [problem, setProblem] = useState<FullProblem | null>(null);

  useEffect(() => {
    if (!user || problem) return;
    let cancelled = false;
    void apiFetch<{ data: FullProblem }>(`/api/problems/${slug}`)
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        setProblem({
          ...data,
          hints: data.hints ?? "",
          explanation: data.explanation ?? "",
          official_solution_cpp: data.official_solution_cpp ?? "",
          official_solution_python: data.official_solution_python ?? "",
          solution_mode: data.solution_mode ?? "full",
          function_stub_cpp: data.function_stub_cpp ?? null,
          function_stub_c: data.function_stub_c ?? null,
          function_stub_pascal: data.function_stub_pascal ?? null,
          function_stub_python: data.function_stub_python ?? null,
        });
      })
      .catch(() => {
        // raman pe varianta publica
      });
    return () => {
      cancelled = true;
    };
  }, [user, slug, problem]);

  if (!loading && user && problem) {
    return <ProblemWorkspace problem={problem} initialHistory={[]} />;
  }
  return <>{publicView}</>;
}
