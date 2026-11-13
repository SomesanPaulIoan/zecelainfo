"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearStoredToken, getStoredToken, type AuthUser } from "@/lib/auth";

/**
 * Afisam CTA login/register doar pentru vizitatori.
 * Nu folosim `useAuth` aici: pagina home e Server Component async iar in unele combinatii Next/React
 * primul render al clientului din acel slot poate rula fara contextul din `AuthProvider` (eroare hidratare).
 * Logica este aliniata cu `AuthProvider.refreshUser`.
 */
export function HomeAuthPrompt() {
  const [phase, setPhase] = useState<"loading" | "guest" | "user">("loading");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setPhase("guest");
      return;
    }

    let cancelled = false;
    void apiFetch<{ data: AuthUser }>("/api/auth/me")
      .then(() => {
        if (!cancelled) setPhase("user");
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken();
          setPhase("guest");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase !== "guest") {
    return null;
  }

  return (
    <section className="mt-12 rounded-2xl border border-sky-100 bg-sky-50/70 p-6 text-center">
      <p className="text-sm text-slate-700">Pentru a beneficia de toate materialele de pe aceasta platforma, ai nevoie de un cont activ.</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-100"
        >
          Creează cont
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-amber-200/80 hover:bg-amber-50/60"
        >
          Am deja cont
        </Link>
      </div>
    </section>
  );
}
