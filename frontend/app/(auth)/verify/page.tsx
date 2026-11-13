"use client";

import { safeNextPath } from "@/lib/navigation";
import { track } from "@/lib/track";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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

function VerifyPageInner() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const otpSent = searchParams.get("sent") === "1";
  const isNewAccount = searchParams.get("nou") === "1";
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);

  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setResendCooldownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldownSec]);

  const verifyOtp = async () => {
    setVerifying(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<{ data: { token: string } }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      setStoredToken(response.data.token);
      await refreshUser();
      setMessage("Cod validat cu succes. Contul este confirmat.");
      if (isNewAccount) track({ name: "sign_up", method: "email" });
      router.replace(nextPath);
    } catch (verifyError) {
      setError(getReadableApiError(verifyError, "Nu am putut verifica codul."));
    }
    setVerifying(false);
  };

  const resendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Introdu emailul contului pentru a retrimite codul.");
      return;
    }
    if (resendCooldownSec > 0) return;

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch<{ data: { message: string } }>("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setCode("");
      setMessage(response.data.message || "Am trimis un cod nou pe email. Este valabil 10 minute.");
      setResendCooldownSec(60);
    } catch (resendError) {
      const msg = getReadableApiError(resendError, "Nu am putut retrimite codul.");
      setError(msg);
      if (msg.includes("peste cateva secunde")) {
        setResendCooldownSec(60);
      }
    }
    setResending(false);
  };

  const busy = verifying || resending;

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-md px-6 py-14">
        <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">verificare cont</p>
          <h1 className="mt-2 text-3xl font-black text-sky-950">Verificare cod email</h1>
          <p className="mt-2 text-sm text-slate-600">
            Introdu codul primit pe email (OTP). Codul este valabil <strong>10 minute</strong>.
          </p>
          {otpSent ? (
            <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-semibold text-sky-800">
              Am trimis un cod OTP pe email. Verifica inbox-ul (si spam-ul) si introdu codul mai jos.
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@exemplu.ro"
              className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Cod OTP (6 cifre)"
              className="w-full rounded-xl border-2 border-sky-200 px-3 py-2 text-sm outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
            />
          </div>

          <button
            type="button"
            onClick={() => void verifyOtp()}
            disabled={busy || !email.trim() || code.trim().length !== 6}
            className="mt-4 w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95 disabled:opacity-50"
          >
            {verifying ? "Verific..." : "Verifica codul"}
          </button>

          <button
            type="button"
            onClick={() => void resendOtp()}
            disabled={busy || !email.trim() || resendCooldownSec > 0}
            className="mt-2 w-full rounded-xl border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-900 transition hover:bg-sky-100 disabled:opacity-50"
          >
            {resending
              ? "Se trimite..."
              : resendCooldownSec > 0
                ? `Retrimite codul (${resendCooldownSec}s)`
                : "Retrimite codul OTP"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Cod expirat sau pierdut? Apasa retrimite — vei primi un cod nou, valabil inca 10 minute.
          </p>

          <div className="mt-4 flex items-center justify-between text-xs font-semibold">
            <Link href="/login" className="text-slate-700 hover:underline">
              Catre login
            </Link>
            <Link href="/register" className="text-slate-700 hover:underline">
              Creeaza cont nou
            </Link>
          </div>

          {message ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageInner />
    </Suspense>
  );
}
