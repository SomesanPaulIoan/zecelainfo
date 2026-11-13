"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { apiFetch } from "@/lib/api";
import { safeNextPath } from "@/lib/navigation";

function getReadableApiError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const marker = ": ";
  const markerIndex = error.message.indexOf(marker);
  if (markerIndex < 0) return error.message || fallback;
  const maybeJson = error.message.slice(markerIndex + marker.length);
  try {
    const parsed = JSON.parse(maybeJson) as { error?: string };
    const apiMessage = parsed?.error?.trim();
    if (apiMessage) {
      if (apiMessage === "Email sau username deja folosit") return "Email deja folosit!";
      return apiMessage;
    }
  } catch {
    // keep original message below
  }
  return error.message || fallback;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const nextPath = safeNextPath(searchParams.get("next"));
  const nextQuery = nextPath !== "/" ? `&next=${encodeURIComponent(nextPath)}` : "";
  const forTrial = searchParams.get("motiv") === "trial";

  // Cont creat cu Google (sau deja logat): continua direct spre pagina ceruta.
  useEffect(() => {
    if (user) router.replace(nextPath);
  }, [user, router, nextPath]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();
  const trimmedEmail = email.trim();
  const emailFormatValid = trimmedEmail.length === 0 ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordTooShort = password.length > 0 && password.length < 6;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    trimmedFirstName.length > 0 &&
    trimmedLastName.length > 0 &&
    trimmedEmail.length > 0 &&
    emailFormatValid &&
    password.length >= 6 &&
    confirmPassword.length > 0 &&
    !passwordsMismatch;

  const signUpWithPassword = async () => {
    const normalizedFirstName = trimmedFirstName;
    const normalizedLastName = trimmedLastName;
    const normalizedEmail = trimmedEmail.toLowerCase();
    const fullName = `${normalizedLastName} ${normalizedFirstName}`.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      setError("Completeaza numele si prenumele.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    const rawUsername = `${normalizedFirstName}.${normalizedLastName}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]/g, "");
    const fallbackUsername = normalizedEmail.split("@")[0] ?? "elev";
    const username = (rawUsername || fallbackUsername).slice(0, 32);

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          username,
          full_name: fullName,
          role: "student",
        }),
      });
      setMessage("Cont creat. Redirectionam spre verificarea OTP...");
      router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}&sent=1&nou=1${nextQuery}`);
    } catch (signUpError) {
      setError(getReadableApiError(signUpError, "Nu am putut crea contul acum."));
    }
    setLoading(false);
  };

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-md px-6 py-14 text-zinc-900">
      <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">cont nou</p>
        <h1 className="mt-2 text-3xl font-black text-sky-950">Creeaza cont</h1>
        <p className="mt-2 text-sm text-slate-700">Completeaza datele, apoi confirma contul cu codul OTP primit pe email.</p>
        {forTrial ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
            Ultimul pas până la 24 de ore de acces gratuit la toate grilele și cursurile: contul (un minut), apoi confirmarea
            telefonului prin SMS. Fără card.
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Nume"
            className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
          />
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Prenume"
            className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplu.ro"
            className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
          />
          {!emailFormatValid ? <p className="text-xs font-semibold text-rose-700">Introdu o adresa de email valida.</p> : null}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Parola (minim 6 caractere)"
            className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
          />
          {passwordTooShort ? <p className="text-xs font-semibold text-rose-700">Parola trebuie sa aiba minim 6 caractere.</p> : null}
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirma parola"
            className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
          />
          {passwordsMismatch ? <p className="text-xs font-semibold text-rose-700">Parolele nu coincid.</p> : null}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void signUpWithPassword()}
            disabled={loading || !canSubmit}
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Se creeaza..." : "Creeaza cont"}
          </button>
          {!canSubmit ? (
            <p className="mt-2 text-xs font-semibold text-slate-600">
              Completeaza toate campurile, foloseste o parola de minim 6 caractere si confirma corect parola.
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <GoogleLoginButton onError={setError} />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-semibold">
          <Link href={`/verify?email=${encodeURIComponent(email)}${nextQuery}`} className="text-sky-800 hover:underline">
            Verifica codul OTP
          </Link>
          <Link href={nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"} className="text-slate-700 hover:underline">
            Ai deja cont? Login
          </Link>
        </div>

        {message ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p> : null}
      </div>
      </section>
    </main>
  );
}
