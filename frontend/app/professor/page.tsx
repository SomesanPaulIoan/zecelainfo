import { RequireAuth } from "@/components/auth/RequireAuth";

export default function ProfessorPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Dashboard profesor</h1>
        <p className="mt-2 text-zinc-600">Gestionare clase, teme si progres elevi.</p>
      </main>
    </RequireAuth>
  );
}
