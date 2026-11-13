"use client";

import { safeNextPath } from "@/lib/navigation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { apiFetch } from "@/lib/api";
import { setStoredToken } from "@/lib/auth";

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

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Doar cai interne (ex. `/grile#pachete`); `//host` sau URL-uri absolute ar fi open redirect.
  const requestedNext = searchParams.get("next") ?? "";
  const nextPath = safeNextPath(requestedNext);
  const registerHref = nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";
  const requiresAuthMessage = searchParams.get("auth_required") === "1";

  useEffect(() => {
    if (user) {
      router.replace(nextPath);
    }
  }, [user, router, nextPath]);

  const loginWithPassword = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<{ data: { token: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(response.data.token);
      await refreshUser();
      setMessage("Autentificat cu succes. Poti continua in platforma.");
      router.replace(nextPath);
    } catch (authError) {
      const msg = getReadableApiError(authError, "Nu am putut face login acum.");
      setError(msg);
      if (msg.toLowerCase().includes("confirmat") || msg.toLowerCase().includes("otp")) {
        setMessage("Cont neconfirmat? Mergi la verificare OTP si apasa „Retrimite codul” pentru un cod nou.");
      }
    }
    setLoading(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loginWithPassword();
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-md px-6 py-14 text-zinc-900">
      <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">autentificare</p>
        <h1 className="mt-2 text-3xl font-black text-sky-950">Login</h1>
        <p className="mt-2 text-sm text-slate-700">
          Conecteaza-te la contul tau daca ai deja unul sau{" "}
          <Link href={registerHref} className="font-extrabold text-sky-800 hover:underline">
            Creeaza unul
          </Link>{" "}
          daca nu ai deja un cont.
        </p>
        {requiresAuthMessage ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            Trebuie sa fii conectat pentru a putea accesa aceasta zona din site.
          </p>
        ) : null}

        <form className="mt-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemplu.ro"
              className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Parola"
              className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "Se autentifica..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <GoogleLoginButton onError={setError} />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-semibold">
          <Link href={`/verify?email=${encodeURIComponent(email)}${nextPath !== "/" ? `&next=${encodeURIComponent(nextPath)}` : ""}`} className="text-sky-800 hover:underline">
            Verifica codul OTP
          </Link>
          <Link href="/forgot-password" className="text-sky-800 hover:underline">
            Am uitat parola
          </Link>
          <Link href={registerHref} className="text-slate-700 hover:underline">
            Nu ai cont? Register
          </Link>
        </div>

        {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
      </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
