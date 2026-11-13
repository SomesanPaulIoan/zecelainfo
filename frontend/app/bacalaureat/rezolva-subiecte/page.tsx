import type { Metadata } from "next";
import Link from "next/link";
import { BacArchiveClientWithMode } from "@/components/bac/BacArchiveClient";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BacRezolvaPage() {
  return (
    <RequireAuth>
      <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
        <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-8 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">simulare bac</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-sky-950">Rezolva Subiecte</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Aici vei putea rezolva subiecte complete de Bac, incarca PDF-ul cu rezolvarea ta si primi feedback in maxim 48 de ore.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/grile/bacalaureat" className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95">
              Rezolva grile Bac
            </Link>
            <Link href="/dashboard" className="rounded-xl border-2 border-sky-300 bg-white px-4 py-2 text-sm font-extrabold text-sky-900 transition hover:border-sky-400 hover:bg-sky-50">
              Vezi progresul
            </Link>
          </div>
        </div>
        <BacArchiveClientWithMode mode="solve" />
        </section>
      </main>
    </RequireAuth>
  );
}
