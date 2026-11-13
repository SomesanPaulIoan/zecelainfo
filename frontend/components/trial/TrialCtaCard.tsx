"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GrileTrialSmsModal } from "@/components/grile/GrileTrialSmsModal";
import { apiFetch } from "@/lib/api";
import { fetchJourney } from "@/lib/journey";

type Props = {
  /** Apelat dupa activare (ex. reincarca accesul la curs). */
  onActivated?: () => Promise<void> | void;
  className?: string;
};

/**
 * Invitatie la trialul gratuit de 24h (acces la tot site-ul). Vizitator -> creare cont;
 * logat fara trial folosit -> deschide modalul SMS; trial deja folosit -> nu afiseaza nimic.
 */
export function TrialCtaCard({ onActivated, className = "" }: Props) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [trialUsed, setTrialUsed] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setTrialUsed(null);
      return;
    }
    let cancelled = false;
    void apiFetch<{ data: { trial_used: boolean } }>("/api/grile/access/status")
      .then((response) => {
        if (!cancelled) setTrialUsed(Boolean(response.data.trial_used));
      })
      .catch(() => {
        if (!cancelled) setTrialUsed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return null;
  if (user && trialUsed !== false) return null;

  const next = encodeURIComponent(pathname || "/cursuri");

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-emerald-950">Încearcă gratuit 24 de ore tot site-ul</p>
        <p className="mt-0.5 text-sm text-emerald-900/90">
          Toate cursurile video și toate grilele, fără card. Confirmi doar numărul de telefon prin SMS.
        </p>
      </div>
      {user ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-500"
        >
          Activează gratuit 24h
        </button>
      ) : (
        <Link
          href={`/register?next=${next}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-500"
        >
          Creează cont și activează 24h gratuit
        </Link>
      )}
      {user ? (
        <GrileTrialSmsModal
          open={open}
          onClose={() => setOpen(false)}
          onActivated={async () => {
            setTrialUsed(true);
            void fetchJourney(user.id, { fresh: true });
            await onActivated?.();
          }}
        />
      ) : null}
    </div>
  );
}
