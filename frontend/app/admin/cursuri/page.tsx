"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminCoursesWorkspace } from "@/components/cursuri/AdminCoursesWorkspace";

export default function AdminCursuriPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-gradient-to-b from-sky-50/50 via-white to-slate-100/80">
        <section className="mx-auto max-w-4xl px-6 pb-6 pt-10">
          <div className="rounded-3xl border border-sky-200/60 bg-white/90 p-6 shadow-xl shadow-sky-100/40">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-sky-950">Admin — Cursuri</h1>
            <p className="mt-2 text-sm text-slate-600">
              Incarca arhive ZIP cu resursele cursului. Elevii care au cumparat cel putin o parte pot descarca arhiva din
              pagina cursului.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-50"
            >
              Inapoi la admin
            </Link>
          </div>
        </section>
        <section className="mx-auto max-w-4xl px-6 pb-12">
          <AdminCoursesWorkspace />
        </section>
      </main>
    </RequireAuth>
  );
}
