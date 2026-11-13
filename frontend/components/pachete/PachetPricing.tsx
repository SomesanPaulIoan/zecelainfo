"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { GrileTrialSmsModal } from "@/components/grile/GrileTrialSmsModal";
import { apiFetch } from "@/lib/api";
import type { BillingProfilePutPayload } from "@/lib/billingProfileForm";
import { PACHET_PRICING_ANCHOR, PACHET_TRIAL_ANCHOR, type PachetOfferCode } from "@/lib/pachete";
import { examFromPachetSlug, getPreferredExam, setPreferredExam } from "@/lib/attribution";
import { track, trackConfirmedPurchase } from "@/lib/track";
import type { PublicPricing } from "@/lib/pricing";

type GrilePaidPlan = "month_1" | "month_3" | "until_2027";

type Checkout =
  | { kind: "grile"; plan: GrilePaidPlan }
  | { kind: "bundle" };

type AccessStatus = {
  has_access: boolean;
  access_until: string | null;
  trial_used: boolean;
  current_plan_code: string | null;
  trial_available?: boolean;
  trial_unavailable_message?: string | null;
};

type CreatePaymentResponse = {
  data: { attempt_id: string; checkout_url: string | null; direct_paid?: boolean };
};

type PurchaseInfo = { event_id: string; product_code: string; value: number; currency: string };

type ConfirmOfferResponse = {
  data: { payment_status: "paid" | "pending"; invoice_number?: string | null; purchase?: PurchaseInfo };
};

type GrilePlanView = {
  plan: GrilePaidPlan;
  title: string;
  price: number;
  period: string;
  perMonth: string | null;
  note: string;
  highlight?: string;
};

const PLAN_COPY: Record<GrilePaidPlan, { title: string; note: string }> = {
  month_1: { title: "1 lună", note: "Pentru o lună intensă de recapitulare." },
  month_3: { title: "3 luni", note: "Ritm constant, fără grija reînnoirii lunare." },
  until_2027: { title: "Până la 1 August 2027", note: "O singură plată pentru tot anul de pregătire." },
};

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

/**
 * Planurile cu pretul real din backend. Eticheta „Cel mai avantajos” se calculeaza (cost pe luna de acces),
 * nu e pusa de mana: spre vara lui 2027 abonamentul „pana la 1 August” nu mai e neaparat cel mai ieftin pe luna.
 */
function buildGrilePlans(pricing: PublicPricing, now: number): GrilePlanView[] {
  const plans = pricing.grile_plans
    .filter((plan): plan is typeof plan & { code: GrilePaidPlan } => plan.code in PLAN_COPY)
    .map((plan) => {
      const months = plan.fixed_until
        ? Math.max(0, (Date.parse(plan.fixed_until) - now) / MS_PER_MONTH)
        : (plan.duration_days ?? 0) / 30;
      return { plan, months, perMonthValue: months > 0 ? plan.price_ron / months : Infinity };
    });
  const cheapest = plans.reduce<(typeof plans)[number] | null>(
    (best, item) => (item.months >= 1 && (!best || item.perMonthValue < best.perMonthValue) ? item : best),
    null,
  );
  return plans.map(({ plan, months, perMonthValue }) => ({
    plan: plan.code,
    title: PLAN_COPY[plan.code].title,
    note: PLAN_COPY[plan.code].note,
    price: plan.price_ron,
    period: plan.fixed_until
      ? `acces până pe ${formatDateRo(plan.fixed_until)}`
      : `${plan.duration_days} de zile`,
    perMonth: months > 1.5 && Number.isFinite(perMonthValue) ? `cca ${Math.round(perMonthValue)} lei / lună` : null,
    highlight: cheapest && cheapest.plan.code === plan.code && plans.length > 1 ? "Cel mai avantajos pe lună" : undefined,
  }));
}

function formatRon(value: number) {
  return `${Math.round(value).toLocaleString("ro-RO")} lei`;
}

function formatDateRo(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
}

function Check() {
  return (
    <span aria-hidden className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
      ✓
    </span>
  );
}

type Props = {
  pricing: PublicPricing;
  pachetSlug: string;
  pachetLabel: string;
  offerCode: PachetOfferCode;
  courseSlug: string;
  courseName: string;
  courseHours: number;
  courseLessons: number;
  /** Pretul cursului cumparat separat (12 luni), pentru comparatie. */
  courseStandalonePriceRon: number | null;
  totalGrile: number;
  primaryGrilePath: string;
};

export function PachetPricing({
  pricing,
  pachetSlug,
  pachetLabel,
  offerCode,
  courseSlug,
  courseName,
  courseHours,
  courseLessons,
  courseStandalonePriceRon,
  totalGrile,
  primaryGrilePath,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null);
  const [now] = useState(() => Date.now());
  const GRILE_PLANS = buildGrilePlans(pricing, now);
  const BUNDLE_PRICE_RON = pricing.bundles.find((bundle) => bundle.code === offerCode)?.price_ron ?? 0;
  const GRILE_UNTIL_2027_RON = pricing.grile_plans.find((plan) => plan.code === "until_2027")?.price_ron ?? 0;
  const pageExam = examFromPachetSlug(pachetSlug);

  useEffect(() => {
    track({ name: "view_content", exam: pageExam, contentId: offerCode });
    if (pageExam && !getPreferredExam()) setPreferredExam(pageExam);
  }, [offerCode, pageExam]);

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      return;
    }
    try {
      const response = await apiFetch<{ data: AccessStatus }>("/api/grile/access/status");
      setStatus(response.data);
    } catch {
      setStatus(null);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void loadStatus();
  }, [authLoading, loadStatus]);

  // Intoarcere de la Revolut pentru pachetul curs + grile.
  useEffect(() => {
    const attempt = searchParams.get("attempt");
    if (searchParams.get("payment") !== "success" || !attempt) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await apiFetch<ConfirmOfferResponse>("/api/offers-2027/confirm-payment", {
          method: "POST",
          body: JSON.stringify({ attemptId: attempt }),
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          trackConfirmedPurchase(response.data.purchase);
          setFeedback({
            tone: "success",
            text: response.data.invoice_number
              ? `Plată confirmată! Ai acces la curs și la toate grilele. Factura ${response.data.invoice_number} a fost trimisă pe email.`
              : "Plată confirmată! Ai acces la curs și la toate grilele.",
          });
          void loadStatus();
        } else {
          setFeedback({ tone: "info", text: "Plata este încă în procesare la Revolut. Accesul se activează automat în câteva minute." });
        }
      } catch {
        if (!cancelled) {
          setFeedback({ tone: "error", text: "Nu am putut confirma plata acum. Dacă ai plătit, accesul se activează automat în câteva minute." });
        }
      } finally {
        if (!cancelled) router.replace(pathname, { scroll: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStatus, pathname, router, searchParams]);

  // Venit din demo / inregistrare cu intentia de a activa trialul: deschidem direct modalul (o singura data).
  const autoOpenHandled = useRef(false);
  useEffect(() => {
    if (autoOpenHandled.current || searchParams.get("activeaza") !== "1" || authLoading) return;
    if (!user || !status) return;
    autoOpenHandled.current = true;
    if (!status.has_access && !status.trial_used && status.trial_available !== false) setTrialOpen(true);
    router.replace(`${pathname}#${PACHET_TRIAL_ANCHOR}`, { scroll: false });
  }, [authLoading, pathname, router, searchParams, status, user]);

  const requireLogin = () => {
    router.push(`/login?next=${encodeURIComponent(`${pathname}#${PACHET_PRICING_ANCHOR}`)}`);
  };

  const startCheckout = (next: Checkout) => {
    if (!user) {
      requireLogin();
      return;
    }
    setCheckout(next);
  };

  const startTrial = () => {
    if (!user) {
      router.push(`/register?motiv=trial&next=${encodeURIComponent(`${pathname}?activeaza=1#${PACHET_TRIAL_ANCHOR}`)}`);
      return;
    }
    setTrialOpen(true);
  };

  const confirmPurchase = async (profile: BillingProfilePutPayload, extras?: { discountCode?: string | null }) => {
    if (!checkout) throw new Error("missing checkout");
    const response =
      checkout.kind === "bundle"
        ? await apiFetch<CreatePaymentResponse>("/api/offers-2027/create-payment", {
            method: "POST",
            body: JSON.stringify({
              offerCode,
              acceptTerms: true,
              billingProfile: profile,
              discountCode: extras?.discountCode ?? undefined,
            }),
          })
        : await apiFetch<CreatePaymentResponse>("/api/grile/access/create-payment", {
            method: "POST",
            body: JSON.stringify({
              planCode: checkout.plan,
              acceptTerms: true,
              billingProfile: profile,
              discountCode: extras?.discountCode ?? undefined,
            }),
          });
    const productCode = checkout.kind === "bundle" ? offerCode : checkout.plan;
    track({ name: "begin_checkout", eventId: `checkout_${response.data.attempt_id}`, productCode, value: checkoutPrice });
    if (response.data.direct_paid || !response.data.checkout_url) {
      setCheckout(null);
      setFeedback({ tone: "success", text: "Comanda a fost înregistrată. Accesul este activ!" });
      void loadStatus();
      return;
    }
    window.location.href = response.data.checkout_url;
  };

  const selectedGrilePlan = checkout?.kind === "grile" ? GRILE_PLANS.find((p) => p.plan === checkout.plan) ?? null : null;
  const checkoutPrice = checkout?.kind === "bundle" ? BUNDLE_PRICE_RON : selectedGrilePlan?.price ?? 0;
  const checkoutTitle = checkout?.kind === "bundle" ? `Pachet complet ${pachetLabel}` : `Grile — ${selectedGrilePlan?.title ?? ""}`;
  const checkoutSubtitle =
    checkout?.kind === "bundle"
      ? `${courseName} + toate grilele platformei, până la 1 August 2027`
      : `Toate cele ${totalGrile.toLocaleString("ro-RO")} de grile, de la toate examenele · ${selectedGrilePlan?.period ?? ""}`;

  const hasActiveAccess = Boolean(status?.has_access);
  const isTrialActive = hasActiveAccess && status?.current_plan_code === "free_24h";
  const trialUsed = Boolean(status?.trial_used);
  const trialAvailable = status?.trial_available !== false;
  const coursePremiumRon = BUNDLE_PRICE_RON - GRILE_UNTIL_2027_RON;

  return (
    <>
      {feedback ? (
        <div
          role="status"
          className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : feedback.tone === "info"
                ? "border-sky-200 bg-sky-50 text-sky-900"
                : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <p>{feedback.text}</p>
          {feedback.tone === "success" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/cursuri/${courseSlug}`} className="rounded-xl bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-600">
                Începe cursul
              </Link>
              <Link href={primaryGrilePath} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-emerald-900 hover:bg-emerald-50">
                Rezolvă grile
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasActiveAccess && status?.access_until && !isTrialActive ? (
        <p className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-900">
          Ai deja acces activ la grile până pe <strong>{formatDateRo(status.access_until)}</strong>. Un abonament nou se adaugă
          peste perioada rămasă.
        </p>
      ) : null}

      {/* Pachetul complet */}
      <article className="relative overflow-hidden rounded-[2rem] border-2 border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 shadow-[0_30px_80px_-40px_rgba(217,119,6,0.55)] sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white shadow-md">
              Recomandat · Pachet complet
            </span>
            <h3 className="mt-4 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">
              Grile + Curs video, până la 1 August 2027
            </h3>
            <p className="mt-3 max-w-xl text-pretty text-lg font-bold leading-snug text-sky-950">
              Pentru doar <span className="text-amber-700">{formatRon(coursePremiumRon)} în plus</span> față de abonamentul
              complet de grile, primești și cursul video de pregătire.
            </p>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-slate-700">
              Abonamentul de grile până la 1 August 2027 (toate examenele), plus <strong>{courseName}</strong>, cu acces tot
              până la 1 August 2027. O singură plată, fără reînnoire automată.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <li className="flex gap-2.5">
                <Check />
                <span>
                  <strong>{courseHours}+ ore</strong> de curs video, {courseLessons} lecții
                </span>
              </li>
              <li className="flex gap-2.5">
                <Check />
                <span>
                  <strong>{totalGrile.toLocaleString("ro-RO")} de grile</strong> de la toate examenele
                </span>
              </li>
              <li className="flex gap-2.5">
                <Check />
                <span>Toată materia din programă + subiecte rezolvate integral</span>
              </li>
              <li className="flex gap-2.5">
                <Check />
                <span>Indicații, explicații și rezolvări video la grile</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span>Grile până la 1 Aug 2027</span>
                <span className="font-semibold text-slate-800">{formatRon(GRILE_UNTIL_2027_RON)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Curs video complet</span>
                <span className="font-semibold text-amber-700">+{formatRon(coursePremiumRon)}</span>
              </div>
              {courseStandalonePriceRon ? (
                <p className="pt-1 text-xs text-slate-500">
                  Cumpărat separat, cursul costă {formatRon(courseStandalonePriceRon)}.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex items-end gap-2 border-t border-amber-100 pt-4">
              <span className="text-5xl font-black tracking-tight text-sky-950">{BUNDLE_PRICE_RON}</span>
              <span className="pb-1.5 text-lg font-bold text-slate-500">lei</span>
              <span className="pb-2 text-xs font-semibold text-slate-500">· plată unică</span>
            </div>
            <button
              type="button"
              onClick={() => startCheckout({ kind: "bundle" })}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-amber-900/20 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            >
              Cumpără pachetul complet
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Plată securizată Revolut · Factură SmartBill pe email</p>
          </div>
        </div>
      </article>

      {/* Doar grile */}
      <div className="mt-12">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Doar grile</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-sky-950">Abonament la platforma de grile</h3>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            Fiecare abonament deblochează toate cele {totalGrile.toLocaleString("ro-RO")} de grile, de la toate admiterile și Bac.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {GRILE_PLANS.map((plan) => (
            <article
              key={plan.plan}
              className={`relative flex flex-col rounded-3xl border bg-white/95 p-6 shadow-[0_18px_50px_-32px_rgba(3,105,161,0.5)] transition hover:-translate-y-0.5 ${
                plan.highlight ? "border-sky-300 ring-2 ring-sky-200/70" : "border-sky-100"
              }`}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-6 rounded-full bg-sky-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow">
                  {plan.highlight}
                </span>
              ) : null}
              <h4 className="text-lg font-black text-sky-950">{plan.title}</h4>
              <p className="mt-1 text-sm text-slate-600">{plan.note}</p>
              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-4xl font-black tracking-tight text-sky-950">{plan.price}</span>
                <span className="pb-1 font-bold text-slate-500">lei</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {plan.period}
                {plan.perMonth ? ` · ${plan.perMonth}` : ""}
              </p>
              <button
                type="button"
                onClick={() => startCheckout({ kind: "grile", plan: plan.plan })}
                className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                  plan.highlight
                    ? "bg-sky-700 text-white shadow-md hover:bg-sky-600"
                    : "border border-sky-200 bg-white text-sky-900 hover:bg-sky-50"
                }`}
              >
                Alege {plan.title.toLowerCase()}
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Comparatie */}
      <div className="mt-10 overflow-x-auto rounded-3xl border border-sky-100 bg-white/95 shadow-[0_18px_50px_-32px_rgba(3,105,161,0.5)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <caption className="px-5 pt-5 text-left text-base font-black text-sky-950">Grile sau pachet complet?</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-5 py-3 font-bold">Ce primești</th>
              <th scope="col" className="px-5 py-3 font-bold">Doar grile</th>
              <th scope="col" className="bg-amber-50 px-5 py-3 font-bold text-amber-800">Pachet complet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50 text-slate-700">
            {[
              [`Toate cele ${totalGrile.toLocaleString("ro-RO")} de grile, de la toate examenele`, "✓", "✓"],
              ["Indicații, explicații pas cu pas, rezolvări video", "✓", "✓"],
              ["Simulări de examen pe timp (mod Examen)", "✓", "✓"],
              [`${courseName} (${courseHours}+ ore, ${courseLessons} lecții)`, "—", "✓"],
              [
                "Durata accesului",
                "30 de zile, 90 de zile sau până la 1 Aug 2027",
                "Până la 1 August 2027 (grile + curs)",
              ],
              [
                "Preț",
                `de la ${formatRon(Math.min(...GRILE_PLANS.map((plan) => plan.price)))}`,
                formatRon(BUNDLE_PRICE_RON),
              ],
            ].map(([label, grile, bundle]) => (
              <tr key={label}>
                <th scope="row" className="px-5 py-3 font-semibold text-sky-950">{label}</th>
                <td className="px-5 py-3">{grile}</td>
                <td className="bg-amber-50/60 px-5 py-3 font-semibold text-slate-900">{bundle}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 pb-5 pt-1 text-xs text-slate-500">
          Plata se face o singură dată, online, prin Revolut (card, Apple Pay sau Google Pay). Nu există reînnoire automată.
          Accesul se activează imediat după confirmarea plății, iar factura vine pe email. Un abonament nou de grile se adaugă
          peste perioada rămasă.
        </p>
      </div>

      {/* Test gratuit */}
      <section
        id={PACHET_TRIAL_ANCHOR}
        className="relative mt-14 scroll-mt-24 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-800 via-sky-900 to-blue-950 px-6 py-10 text-center shadow-[0_30px_80px_-40px_rgba(2,132,199,0.8)] sm:px-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber-200">Nu ești sigur?</p>
          <h3 className="mx-auto mt-3 max-w-2xl text-balance text-2xl font-black tracking-tight text-white sm:text-3xl">
            Testează gratuit 24 de ore: toate grilele și toate cursurile
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-sky-100">
            Fără card. Confirmi doar numărul de telefon prin SMS. Trialul se poate activa o singură dată per număr de telefon.
          </p>
          {isTrialActive ? (
            <p className="mx-auto mt-6 w-fit rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-100">
              Trialul tău este activ până pe {formatDateRo(status?.access_until ?? null)}. Spor la învățat!
            </p>
          ) : hasActiveAccess ? null : trialUsed ? (
            <p className="mx-auto mt-6 w-fit rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-sky-100">
              Ai folosit deja testul gratuit pe acest cont. Alege un pachet de mai sus ca să continui.
            </p>
          ) : !trialAvailable ? (
            <p className="mx-auto mt-6 w-fit rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-sky-100">
              {status?.trial_unavailable_message ?? "Testul gratuit nu este disponibil momentan."}
            </p>
          ) : (
            <button
              type="button"
              onClick={startTrial}
              className="mt-7 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-7 py-3.5 text-base font-extrabold text-sky-950 shadow-lg transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-900"
            >
              Activează gratuit 24h
            </button>
          )}
        </div>
      </section>

      <GrileTrialSmsModal
        open={trialOpen}
        onClose={() => setTrialOpen(false)}
        onActivated={async () => {
          setTrialOpen(false);
          await loadStatus();
          router.push(`/bun-venit?exam=${getPreferredExam() ?? pageExam ?? ""}`);
        }}
      />

      {checkout ? (
        <BillingProfileCheckoutModal
          open
          fieldIdPrefix="pachet-billing"
          discount={{ scope: checkout.kind === "bundle" ? "site" : "grile", baseAmountRon: checkoutPrice }}
          summary={
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Achiziționezi</p>
              <p className="mt-1 text-xl font-bold text-sky-950">{checkoutTitle}</p>
              <p className="mt-0.5 text-sm text-slate-700">{checkoutSubtitle}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatRon(checkoutPrice)}</p>
            </div>
          }
          submitLabel={`Plătește ${formatRon(checkoutPrice)}`}
          onClose={() => setCheckout(null)}
          onConfirm={confirmPurchase}
        />
      ) : null}
    </>
  );
}
