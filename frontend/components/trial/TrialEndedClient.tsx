"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { examInfo, getPreferredExam, isExamKey, type ExamKey } from "@/lib/attribution";
import { fetchJourney, type Journey } from "@/lib/journey";
import { PACHET_PRICING_ANCHOR } from "@/lib/pachete";
import type { PublicPricing } from "@/lib/pricing";

const BUNDLE_BY_PACHET: Record<string, string> = {
  "admitere-ubb": "ubb_bundle",
  "admitere-ub-unstpb": "ub_unstpb_bundle",
  "admitere-uaic-tuiasi": "uaic_tuiasi_bundle",
  bacalaureat: "bac_bundle",
};

function Inner({ pricing }: { pricing: PublicPricing | null }) {
  const { user } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    void fetchJourney(user.id, { fresh: true }).then((data) => {
      setJourney(data);
      setLoaded(true);
    });
  }, [user]);

  if (!loaded) return <p className="py-16 text-center text-slate-600">Se încarcă...</p>;

  const exam: ExamKey | null = isExamKey(journey?.exam) ? (journey!.exam as ExamKey) : getPreferredExam();
  const pachet = exam ? examInfo(exam).pachet : null;
  const pachetHref = pachet ? `/pachete/${pachet}#${PACHET_PRICING_ANCHOR}` : "/pachete";
  const cheapestGrile = pricing ? Math.min(...pricing.grile_plans.map((plan) => plan.price_ron)) : null;
  const bundle = pricing && pachet ? pricing.bundles.find((item) => item.code === BUNDLE_BY_PACHET[pachet]) : null;
  const progress = journey?.trial_progress;
  const hasProgress = Boolean(progress && (progress.grile_attempted > 0 || progress.exam_simulations > 0));
  const stillOnTrial = journey?.state === "trial";
  const alreadyPaid = journey?.state === "grile" || journey?.state === "complete";

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 text-center shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)] sm:p-8">
        {alreadyPaid ? (
          <>
            <h1 className="text-3xl font-black tracking-tight text-sky-950">Ai deja acces activ</h1>
            <p className="mt-3 text-slate-700">Spor la pregătire!</p>
            <Link href="/grile" className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-sky-700 px-6 font-bold text-white">
              Mergi la grile
            </Link>
          </>
        ) : (
          <>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">
              {stillOnTrial ? "Accesul gratuit e încă activ" : "Perioada gratuită s-a încheiat"}
            </p>
            <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">
              {stillOnTrial ? "Continuă pregătirea și după cele 24 de ore" : "Cele 24 de ore gratuite s-au încheiat. Continuă pregătirea!"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-slate-700">
              Tot ce ai rezolvat rămâne salvat în cont. Când activezi un abonament, regăsești progresul exact unde l-ai lăsat.
            </p>
          </>
        )}

        {hasProgress && progress ? (
          <dl className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-2 py-3">
              <dd className="text-2xl font-black text-sky-950">{progress.grile_attempted}</dd>
              <dt className="text-xs font-semibold text-slate-600">grile rezolvate</dt>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-2 py-3">
              <dd className="text-2xl font-black text-sky-950">{progress.grile_correct}</dd>
              <dt className="text-xs font-semibold text-slate-600">rezolvate corect</dt>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-2 py-3">
              <dd className="text-2xl font-black text-sky-950">{progress.exam_simulations}</dd>
              <dt className="text-xs font-semibold text-slate-600">simulări începute</dt>
            </div>
          </dl>
        ) : null}
      </div>

      {!alreadyPaid ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="relative flex flex-col rounded-[1.6rem] border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <span className="w-fit rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
              {exam ? `Recomandat pentru ${examInfo(exam).short}` : "Recomandat"}
            </span>
            <h2 className="mt-3 text-xl font-black text-sky-950">Pachet complet</h2>
            <p className="mt-1 flex-1 text-sm text-slate-700">
              Toate grilele + {bundle?.course_name ?? "cursul video al examenului tău"}, până la 1 August 2027.
            </p>
            <p className="mt-3 text-3xl font-black text-sky-950">{bundle ? `${bundle.price_ron} lei` : "—"}</p>
            <Link
              href={pachetHref}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 font-extrabold text-white"
            >
              Vezi pachetul complet
            </Link>
          </article>
          <article className="flex flex-col rounded-[1.6rem] border border-sky-200 bg-white/95 p-5 shadow-sm">
            <h2 className="mt-1 text-xl font-black text-sky-950">Grile Premium</h2>
            <p className="mt-1 flex-1 text-sm text-slate-700">
              Toate grilele, de la toate examenele, cu indicații, explicații și video. 1 lună, 3 luni sau până la 1 August 2027.
            </p>
            <p className="mt-3 text-3xl font-black text-sky-950">{cheapestGrile ? `de la ${cheapestGrile} lei` : "—"}</p>
            <Link
              href={pachetHref}
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-sky-700 px-4 font-extrabold text-sky-900"
            >
              Vezi abonamentele
            </Link>
          </article>
        </div>
      ) : null}
      {!alreadyPaid ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Plată unică prin Revolut, fără reînnoire automată. Factura vine pe email.
        </p>
      ) : null}
    </section>
  );
}

export function TrialEndedClient({ pricing }: { pricing: PublicPricing | null }) {
  return (
    <RequireAuth>
      <Inner pricing={pricing} />
    </RequireAuth>
  );
}
