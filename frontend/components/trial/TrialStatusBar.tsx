"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { GrileTrialSmsModal } from "@/components/grile/GrileTrialSmsModal";
import { examInfo, getPreferredExam, isExamKey } from "@/lib/attribution";
import { fetchJourney, hoursLeft, type Journey } from "@/lib/journey";

const DISMISS_KEY = "zli_trial_bar_dismissed";
const HIDDEN_PREFIXES = ["/admin", "/pachete", "/bun-venit", "/trial-incheiat", "/login", "/register", "/verify"];

/**
 * O linie discreta sub meniu: cont nou fara trial -> invitatie la trialul de 24h (deschide direct modalul SMS);
 * in trial arata timpul ramas si un link spre pachetul examenului; dupa expirare trimite la pagina cu progresul
 * si ofertele. Fara pop-up-uri, fara cronometru pe secunde.
 */
export function TrialStatusBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [trialOpen, setTrialOpen] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "student") {
      setJourney(null);
      return;
    }
    let cancelled = false;
    void fetchJourney(user.id).then((data) => {
      if (!cancelled) setJourney(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  if (!journey || dismissed || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  // "new" include si elevii cu acces dat manual de admin: lor nu le cerem trialul.
  const hasActiveAccess = journey.access_until != null && Date.parse(journey.access_until) > Date.now();
  if (journey.state === "new" && hasActiveAccess) return null;
  if (journey.state !== "new" && journey.state !== "trial" && journey.state !== "trial_expired") return null;

  const examKey = isExamKey(journey.exam) ? journey.exam : getPreferredExam();
  const pachetHref = `/pachete/${examKey ? examInfo(examKey).pachet : ""}`.replace(/\/$/, "");

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (journey.state === "new") {
    return (
      <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-2 text-sm text-slate-900">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p>
            <strong>Mai ai un pas:</strong> confirmă telefonul prin SMS și primești 24 de ore acces gratuit la toate grilele și
            toate cursurile. Fără card.
          </p>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTrialOpen(true)}
              className="min-h-9 rounded-lg bg-sky-700 px-3 font-bold text-white hover:bg-sky-600"
            >
              Activează gratuit 24h
            </button>
            <button type="button" onClick={dismiss} aria-label="Ascunde" className="px-1 text-slate-500 hover:text-slate-900">
              ✕
            </button>
          </span>
        </div>
        <GrileTrialSmsModal
          open={trialOpen}
          onClose={() => setTrialOpen(false)}
          onActivated={() => {
            setTrialOpen(false);
            if (user) void fetchJourney(user.id, { fresh: true }).then(setJourney);
            router.push(`/bun-venit?exam=${examKey ?? ""}`);
          }}
        />
      </div>
    );
  }

  if (journey.state === "trial") {
    const hours = hoursLeft(journey.access_until);
    return (
      <div className="border-b border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-950">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p>
            <strong>Acces gratuit activ</strong>
            {hours != null ? ` · mai ai cca ${hours} ${hours === 1 ? "oră" : "ore"}` : ""}. Îți place platforma? Continuă
            pregătirea și după perioada gratuită.
          </p>
          <span className="flex items-center gap-3">
            <Link href={pachetHref} className="font-bold underline underline-offset-4">
              Vezi pachetul {examKey ? examInfo(examKey).short : ""}
            </Link>
            <button type="button" onClick={dismiss} aria-label="Ascunde" className="px-1 text-emerald-700 hover:text-emerald-950">
              ✕
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-2 text-sm text-slate-900">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          <strong>Cele 24 de ore gratuite s-au încheiat.</strong> Progresul tău e salvat.
        </p>
        <span className="flex items-center gap-3">
          <Link href="/trial-incheiat" className="font-bold underline underline-offset-4">
            Vezi cum continui
          </Link>
          <button type="button" onClick={dismiss} aria-label="Ascunde" className="px-1 text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </span>
      </div>
    </div>
  );
}
