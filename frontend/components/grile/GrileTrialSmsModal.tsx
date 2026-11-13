"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { getPreferredExam } from "@/lib/attribution";
import { track } from "@/lib/track";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Prefill din profil (ex. +40722...) */
  initialPhone?: string | null;
  onActivated: () => Promise<void> | void;
};

function TrialCooldownSpinner({ spinKey }: { spinKey: number }) {
  return (
    <svg
      key={spinKey}
      className="h-4 w-4 shrink-0 text-amber-900"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ animation: "trialSmsCooldownSpin 30s linear forwards" }}
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/** Mesaje prietenoase pe codurile de eroare ale backend-ului (protectiile anti-abuz raman neschimbate). */
const FRIENDLY_ERRORS: Record<string, string> = {
  INVALID_PHONE: "Numărul nu pare valid. Scrie-l ca 07xx xxx xxx (număr din România).",
  PHONE_TRIAL_ALREADY_USED:
    "Acest număr a activat deja testul gratuit pe alt cont. Fiecare număr de telefon îl poate activa o singură dată.",
  TRIAL_ALREADY_USED: "Ai folosit deja testul gratuit pe acest cont. Poți continua cu unul dintre pachete.",
  INVALID_SMS_CODE: "Codul nu e corect sau a expirat (e valabil 10 minute). Verifică SMS-ul sau cere un cod nou.",
  RATE_LIMIT_TRIAL_SMS: "Am trimis deja un cod. Poți cere altul peste câteva secunde.",
  SMS_SEND_FAILED: "Nu am reușit să trimitem SMS-ul. Verifică numărul și încearcă din nou peste un minut.",
  TRIAL_UNAVAILABLE: "Testul gratuit nu este disponibil momentan.",
  SMSLINK_NOT_CONFIGURED: "Trimiterea SMS-urilor nu funcționează momentan. Te rugăm să încerci mai târziu.",
};

function parseApiError(err: unknown): { message: string; code: string | null } {
  if (!(err instanceof Error)) return { message: "A apărut o eroare. Încearcă din nou.", code: null };
  const m = /API \d+:\s*(\{[\s\S]*\})\s*$/.exec(err.message);
  if (!m?.[1]) return { message: "Nu am putut contacta serverul. Verifică conexiunea și încearcă din nou.", code: null };
  try {
    const j = JSON.parse(m[1]) as { error?: string; code?: string };
    const code = j.code ?? null;
    return { message: (code && FRIENDLY_ERRORS[code]) || j.error || "A apărut o eroare.", code };
  } catch {
    return { message: "A apărut o eroare. Încearcă din nou.", code: null };
  }
}

export function GrileTrialSmsModal({ open, onClose, initialPhone, onActivated }: Props) {
  const { user } = useAuth();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [rawPhone, setRawPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [activating, setActivating] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCooldown, setSmsCooldown] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Dupa activare aratam confirmarea; onActivated ruleaza cand elevul inchide confirmarea. */
  const [activatedUntil, setActivatedUntil] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSmsCode("");
    setSmsSent(false);
    setSmsCooldown(false);
    setSpinKey(0);
    setActivatedUntil(null);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setRawPhone(initialPhone?.trim() ? initialPhone.trim() : "");
  }, [open, initialPhone]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const startSmsCooldown = () => {
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    setSpinKey((k) => k + 1);
    setSmsCooldown(true);
    cooldownTimerRef.current = setTimeout(() => {
      setSmsCooldown(false);
      cooldownTimerRef.current = null;
    }, 30_000);
  };

  const sendSms = async () => {
    setError(null);
    setErrorCode(null);
    setSending(true);
    try {
      await apiFetch<{ data: { ok: boolean } }>("/api/grile/access/trial/send-sms", {
        method: "POST",
        body: JSON.stringify({ rawPhone }),
      });
      setSmsSent(true);
      startSmsCooldown();
    } catch (e) {
      const parsed = parseApiError(e);
      setError(parsed.message);
      setErrorCode(parsed.code);
    } finally {
      setSending(false);
    }
  };

  const activate = async () => {
    setError(null);
    setErrorCode(null);
    setActivating(true);
    try {
      const response = await apiFetch<{ data: { ok: boolean; has_access: boolean; access_until: string; current_plan_code: string } }>(
        "/api/grile/access/activate", {
        method: "POST",
        body: JSON.stringify({
          planCode: "free_24h",
          acceptTerms,
          trialPhone: rawPhone,
          trialSmsCode: smsCode,
        }),
      });
      const exam = getPreferredExam();
      if (exam) {
        void apiFetch("/api/marketing/me/exam", { method: "PUT", body: JSON.stringify({ exam }) }).catch(() => undefined);
      }
      if (user) track({ name: "start_trial", eventId: `trial_${user.id}`, exam });
      setActivatedUntil(response.data.access_until);
    } catch (e) {
      const parsed = parseApiError(e);
      setError(parsed.message);
      setErrorCode(parsed.code);
    } finally {
      setActivating(false);
    }
  };

  const finish = async () => {
    await onActivated();
    onClose();
  };

  if (activatedUntil) {
    const untilLabel = new Date(activatedUntil).toLocaleString("ro-RO", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div className="fixed inset-0 z-[200] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain bg-black/45 px-4 py-8 sm:px-6 sm:py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="trial-success-title"
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl"
        >
          <div className="space-y-4 px-5 py-6 text-center">
            <div className="text-4xl" aria-hidden>
              🎉
            </div>
            <h2 id="trial-success-title" className="text-xl font-extrabold text-sky-950">
              Gata! Ai acces la tot site-ul 24 de ore
            </h2>
            <ul className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-left text-sm text-emerald-950">
              <li>✓ Toate cursurile video</li>
              <li>✓ Toate grilele (admitere și Bacalaureat), cu explicații</li>
              <li>
                ✓ Accesul gratuit expiră pe <strong>{untilLabel}</strong>
              </li>
            </ul>
            <p className="text-sm text-slate-600">
              Ți-am trimis și un email cu detaliile. Testul gratuit se poate activa o singură dată per cont și per număr de telefon.
            </p>
            <button
              type="button"
              onClick={() => void finish()}
              className="w-full rounded-xl border border-sky-300 bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
            >
              Începe acum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain bg-black/45 px-4 py-8 sm:px-6 sm:py-10">
      <style>{`@keyframes trialSmsCooldownSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-sms-title"
        className="relative w-full max-h-[min(90dvh,calc(100dvh-4rem))] max-w-md overflow-y-auto rounded-2xl border border-sky-100 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3">
          <h2 id="trial-sms-title" className="text-lg font-bold text-sky-950">
            Activează 24h gratuit
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-sky-200 px-2 py-1 text-sm text-slate-600 hover:bg-sky-50"
          >
            Închide
          </button>
        </div>
        <div className="space-y-4 px-4 py-4">
          <ul className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-950">
            <li>✓ 24 de ore acces la toate grilele și la toate cursurile video</li>
            <li>✓ Fără card, fără abonament care se reînnoiește</li>
            <li>✓ După 24 de ore accesul se oprește singur; progresul tău rămâne salvat</li>
          </ul>
          <p className="text-xs text-slate-600">
            Confirmăm numărul prin SMS doar ca să evităm abuzurile: un număr poate activa testul o singură dată. Nu îți trimitem
            reclame prin SMS.
          </p>
          <div>
            <label htmlFor="trial-phone" className="mb-1 block text-xs font-medium text-slate-700">
              Număr de telefon (România)
            </label>
            <input
              id="trial-phone"
              type="tel"
              autoComplete="tel"
              placeholder="07xx xxx xxx"
              value={rawPhone}
              onChange={(e) => setRawPhone(e.target.value)}
              className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-sky-300 text-sky-600"
            />
            <span>
              Accept{" "}
              <Link href="/termeni-si-conditii" target="_blank" className="font-semibold text-sky-800 underline">
                termenii și condițiile
              </Link>{" "}
              pentru activarea testului gratuit.
            </span>
          </label>
          <button
            type="button"
            disabled={sending || smsCooldown || !rawPhone.trim() || !acceptTerms}
            onClick={() => void sendSms()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-60"
          >
            {smsCooldown ? <TrialCooldownSpinner spinKey={spinKey} /> : null}
            {sending ? "Se trimite..." : smsSent ? "Retrimite codul" : "Trimite codul prin SMS"}
          </button>
          {smsSent ? (
            <div>
              <label htmlFor="trial-code" className="mb-1 block text-xs font-medium text-slate-700">
                Codul din SMS (6 cifre)
              </label>
              <input
                id="trial-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-sky-400"
              />
            </div>
          ) : null}
          {smsSent ? (
            <button
              type="button"
              disabled={activating || smsCode.trim().length < 4}
              onClick={() => void activate()}
              className="w-full rounded-xl border border-sky-300 bg-sky-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              {activating ? "Se activează..." : "Activează accesul de 24h"}
            </button>
          ) : null}
          {smsSent && !error ? (
            <p className="text-xs text-slate-500">Am trimis codul. Poate dura până la un minut să ajungă.</p>
          ) : null}
          {error ? (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <p>{error}</p>
              {errorCode === "TRIAL_ALREADY_USED" || errorCode === "PHONE_TRIAL_ALREADY_USED" ? (
                <Link href="/pachete" className="mt-1 inline-block font-bold underline">
                  Vezi pachetele
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
