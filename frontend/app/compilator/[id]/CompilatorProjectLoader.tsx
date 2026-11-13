"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { getPlaygroundProject, type PlaygroundProject } from "@/lib/api";

export function CompilatorProjectLoader({ projectId }: { projectId: string }) {
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<PlaygroundProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Trebuie sa fii autentificat pentru a deschide acest proiect.");
      return;
    }
    let isMounted = true;
    void getPlaygroundProject(projectId)
      .then((data) => {
        if (isMounted) setProject(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Proiectul nu a putut fi incarcat.");
      });
    return () => {
      isMounted = false;
    };
  }, [authLoading, user, projectId]);

  if (error) {
    return (
      <main className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950 px-4 text-center">
        <p className="text-sm font-medium text-zinc-300">{error}</p>
        <Link href="/compilator" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
          Deschide un proiect nou
        </Link>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Se incarca proiectul...</p>
      </main>
    );
  }

  return <PlaygroundWorkspace initialProject={project} />;
}
