"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminClaudeFilesWorkspace } from "@/components/admin/AdminClaudeFilesWorkspace";

export default function AdminFisiereClaudePage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-gradient-to-b from-violet-50/50 via-white to-zinc-100/80">
        <section className="mx-auto max-w-5xl px-6 pb-6 pt-10">
          <div className="rounded-3xl border border-violet-200/60 bg-white/90 p-6 shadow-xl shadow-violet-100/40">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-violet-700">admin</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">Fisiere Claude</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Incarca fisiere de referinta (poze, PDF-uri, cod) pe care mi le poti da in chat cand imi ceri sa fac
              ceva in proiect.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-lg border border-violet-200 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-50"
            >
              Inapoi la admin
            </Link>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <AdminClaudeFilesWorkspace />
        </section>
      </main>
    </RequireAuth>
  );
}
