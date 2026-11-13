"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

const PREPARATION_OPTIONS = [
  "Bacalaureat",
  "Admitere UBB",
  "Admitere UB",
  "Admitere UNSTPB",
  "Admitere TU Iasi",
  "Admitere UAIC",
] as const;

function splitName(fullName: string | null | undefined, username: string) {
  const fromFullName = fullName?.trim();
  if (fromFullName) {
    const parts = fromFullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return {
        lastName: parts[0],
        firstName: parts.slice(1).join(" "),
      };
    }
  }

  const cleaned = username.replace(/[._-]+/g, " ").trim();
  const fallbackParts = cleaned.split(/\s+/).filter(Boolean);
  if (fallbackParts.length >= 2) {
    return {
      lastName: fallbackParts[0],
      firstName: fallbackParts.slice(1).join(" "),
    };
  }

  return {
    lastName: cleaned || "",
    firstName: "",
  };
}

export function MeditatiiSignupForm() {
  const { user, loading } = useAuth();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preparationFor, setPreparationFor] = useState<(typeof PREPARATION_OPTIONS)[number]>("Bacalaureat");
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!user) return;
    const parts = splitName(user.full_name, user.username);
    setLastName(parts.lastName);
    setFirstName(parts.firstName);
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCheckingStatus(false);
      return;
    }
    let cancelled = false;
    setCheckingStatus(true);
    void apiFetch<{ data: { already_registered: boolean } }>("/api/meditations/leads/me")
      .then((response) => {
        if (!cancelled) setAlreadyRegistered(response.data.already_registered);
      })
      .catch(() => {
        // daca verificarea esueaza, lasam formularul disponibil; backend-ul oricum respinge dublurile
      })
      .finally(() => {
        if (!cancelled) setCheckingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const fullName = useMemo(() => `${lastName.trim()} ${firstName.trim()}`.trim(), [lastName, firstName]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setIsError(true);
      setFeedback("Trebuie să fii conectat pentru a trimite înscrierea.");
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setIsError(false);
    try {
      await apiFetch("/api/meditations/leads", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          grade: preparationFor,
          message: observations,
        }),
      });
      setFeedback("Înscriere trimisă cu succes. Te vom contacta în cel mai scurt timp.");
      setPhone("");
      setPreparationFor("Bacalaureat");
      setObservations("");
      setAlreadyRegistered(true);
    } catch (submitError) {
      setIsError(true);
      if (submitError instanceof Error && submitError.message.includes("API 409")) {
        setAlreadyRegistered(true);
        setFeedback("Te-ai inscris deja la meditatii.");
      } else {
        setFeedback("Nu am putut trimite înscrierea acum. Încearcă din nou.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl" />
        <h2 className="relative text-xl font-black text-sky-950">Înscriere la meditații</h2>
        <p className="relative mt-2 text-sm text-slate-600">Se verifică sesiunea…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-36 w-36 rounded-full bg-amber-200/35 blur-3xl" />
        <h2 className="relative text-xl font-black text-sky-950">Înscriere la meditații</h2>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-700">
          Pentru înscriere trebuie să fii conectat în contul tău.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link
            href="/login?next=%2Fmeditatii"
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm transition hover:brightness-95"
          >
            Conectează-te
          </Link>
          <Link
            href="/register"
            className="rounded-xl border-2 border-sky-300 bg-white px-4 py-2.5 text-sm font-extrabold text-sky-900 shadow-sm transition hover:border-sky-400 hover:bg-sky-50"
          >
            Creează cont
          </Link>
        </div>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="relative overflow-hidden rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-36 w-36 rounded-full bg-sky-200/40 blur-3xl" />
        <h2 className="relative text-xl font-black text-sky-950">Înscriere la meditații</h2>
        <p className="relative mt-2 text-sm text-slate-600">Se verifică înscrierea…</p>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="relative overflow-hidden rounded-[1.8rem] border border-emerald-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]">
        <div className="pointer-events-none absolute -right-16 top-0 h-36 w-36 rounded-full bg-emerald-200/35 blur-3xl" />
        <h2 className="relative text-xl font-black text-sky-950">Înscriere la meditații</h2>
        <p className="relative mt-3 text-sm font-semibold text-emerald-700">Te-ai inscris deja la meditatii.</p>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-700">
          Am trimis o confirmare pe email, cu detalii despre pregătire și o reducere specială pentru tine. Te vom
          contacta după 1 Septembrie pentru testul inițial de formare a grupelor.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-4 overflow-hidden rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]"
    >
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
      <h2 className="relative text-xl font-black text-sky-950">Înscriere la meditații</h2>
      <div className="relative mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Nume</span>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Prenume</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Adresă de e-mail</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Telefon</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2">
          <span>Pentru ce te pregătești</span>
          <select
            required
            value={preparationFor}
            onChange={(e) => setPreparationFor(e.target.value as (typeof PREPARATION_OPTIONS)[number])}
            className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40 md:max-w-md"
          >
            {PREPARATION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="relative space-y-1.5 text-sm font-medium text-slate-700">
        <span>Observații (opțional)</span>
        <textarea
          rows={4}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300/40"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="relative rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Se trimite…" : "Trimite înscrierea"}
      </button>
      {feedback ? (
        <p className={`text-sm ${isError ? "text-rose-700" : "text-emerald-700"}`}>{feedback}</p>
      ) : null}
    </form>
  );
}
