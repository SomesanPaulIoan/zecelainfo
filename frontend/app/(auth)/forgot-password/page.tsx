"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

function getReadableApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const marker = ": ";
  const markerIndex = error.message.indexOf(marker);
  if (markerIndex < 0) return error.message || fallback;
  const maybeJson = error.message.slice(markerIndex + marker.length);
  try {
    const parsed = JSON.parse(maybeJson) as { error?: string };
    if (parsed?.error?.trim()) return parsed.error.trim();
  } catch {
    // keep original
  }
  return error.message || fallback;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trimmedEmail = email.trim();
  const emailFormatValid = trimmedEmail.length === 0 ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await apiFetch<{ data: { ok: boolean; message: string } }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(getReadableApiError(requestError, "Nu am putut procesa cererea acum."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-md px-6 py-14 text-zinc-900">
        <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">recuperare cont</p>
          <h1 className="mt-2 text-3xl font-black text-sky-950">Am uitat parola</h1>
          <p className="mt-2 text-sm text-slate-700">
            Introdu email-ul contului. Daca exista in platforma, iti trimitem o parola provizorie pe email.
          </p>

          <div className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemplu.ro"
              className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
            />
            {!emailFormatValid ? <p className="text-xs font-semibold text-rose-700">Introdu o adresa de email valida.</p> : null}
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !trimmedEmail || !emailFormatValid}
            className="mt-4 w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Se trimite..." : "Trimite parola provizorie"}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold">
            <Link href="/login" className="text-slate-700 hover:underline">
              Catre login
            </Link>
            <Link href="/register" className="text-sky-800 hover:underline">
              Creeaza cont nou
            </Link>
          </div>

          {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
