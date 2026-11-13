"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { apiFetch } from "@/lib/api";
import type { BillingProfilePutPayload } from "@/lib/billingProfileForm";

export type Offer2027Code = "ub_unstpb_bundle" | "ubb_bundle" | "grile_only";

type OfferCatalogItem = {
  code: Offer2027Code;
  title: string;
  subtitle: string;
  badge: string | null;
  includes_course: boolean;
  includes_grile: boolean;
  course_slug: string | null;
  course_name: string | null;
  parts_count: number;
  course_hours: number;
  lessons_count: number;
  grile_questions_count: number;
  catalog_course_ron: number;
  catalog_grile_ron: number;
  catalog_total_ron: number;
  promo_price_ron: number;
  savings_ron: number;
  savings_percent: number;
  access_until_label: string;
};

type CatalogResponse = {
  data: {
    access_until: string;
    items: OfferCatalogItem[];
  };
};

type CreatePaymentResponse = {
  data: { attempt_id: string; checkout_url: string | null; direct_paid?: boolean };
};

type ConfirmPaymentResponse = {
  data: {
    ok: boolean;
    payment_status: "paid" | "pending";
    invoice_number?: string | null;
    offer_code?: string;
  };
};

const OFFER_ACCENTS: Record<Offer2027Code, { ring: string; glow: string; btn: string; chip: string }> = {
  ub_unstpb_bundle: {
    ring: "ring-amber-400/70",
    glow: "from-amber-400/30 via-orange-300/20 to-yellow-200/30",
    btn: "from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400",
    chip: "bg-amber-500 text-white",
  },
  ubb_bundle: {
    ring: "ring-sky-400/70",
    glow: "from-sky-400/30 via-cyan-300/20 to-blue-200/30",
    btn: "from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500",
    chip: "bg-sky-600 text-white",
  },
  grile_only: {
    ring: "ring-violet-400/70",
    glow: "from-violet-400/25 via-fuchsia-300/20 to-purple-200/25",
    btn: "from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500",
    chip: "bg-violet-600 text-white",
  },
};

function formatRon(value: number) {
  return `${Math.round(value).toLocaleString("ro-RO")} lei`;
}

function formatQuestionsCount(value: number) {
  if (value <= 0) return "0";
  const floored = Math.floor(value / 100) * 100;
  return `${floored.toLocaleString("ro-RO")}+`;
}

const OFFER_DEADLINE_ISO = "2026-08-31T23:59:59+03:00";

function OfferDeadlineBanner() {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(OFFER_DEADLINE_ISO).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setExpired(true);
        return;
      }
      setLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-rose-400/70 bg-rose-500/15 px-5 py-5 text-center shadow-[0_20px_60px_-20px_rgba(244,63,94,0.6)] backdrop-blur-md sm:px-8 sm:py-6">
      <p className="text-lg font-black uppercase leading-snug tracking-wide text-white sm:text-2xl">
        Ofertele sunt valabile până la <span className="text-rose-200">31 August 2026</span>!
      </p>
      {expired ? (
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-rose-200">Oferta s-a încheiat</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {[
            { label: "zile", value: left.days },
            { label: "ore", value: left.hours },
            { label: "min", value: left.minutes },
            { label: "sec", value: left.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="min-w-[4rem] rounded-xl border border-rose-200/40 bg-white/10 px-3 py-2 text-center shadow-lg"
            >
              <p className="text-xl font-black tabular-nums text-white sm:text-2xl">
                {String(unit.value).padStart(2, "0")}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-100">{unit.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CountdownStrip({ targetIso }: { targetIso: string }) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {[
        { label: "zile", value: left.days },
        { label: "ore", value: left.hours },
        { label: "min", value: left.minutes },
      ].map((unit) => (
        <div
          key={unit.label}
          className="min-w-[4.5rem] rounded-2xl border border-white/30 bg-white/15 px-3 py-2 text-center shadow-lg backdrop-blur-md"
        >
          <p className="text-2xl font-black tabular-nums text-white">{unit.value}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{unit.label}</p>
        </div>
      ))}
    </div>
  );
}

function OfferCard({
  offer,
  featured,
  onBuy,
}: {
  offer: OfferCatalogItem;
  featured?: boolean;
  onBuy: (code: Offer2027Code) => void;
}) {
  const accent = OFFER_ACCENTS[offer.code];

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border bg-white/95 p-6 shadow-[0_24px_80px_-32px_rgba(2,132,199,0.45)] backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_-28px_rgba(245,158,11,0.35)] sm:p-8 ${
        featured ? `border-amber-300/80 ring-4 ${accent.ring}` : "border-sky-100/90"
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 ${accent.glow}`} />
      {offer.badge ? (
        <span
          className={`absolute right-5 top-5 z-10 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-lg ${accent.chip}`}
        >
          {offer.badge}
        </span>
      ) : null}
      {featured ? (
        <div className="absolute -left-8 top-6 z-10 -rotate-12 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 px-8 py-1 text-xs font-black uppercase tracking-widest text-white shadow-xl">
          Best deal
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">Ofertă limitată</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-sky-950 sm:text-3xl">{offer.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{offer.subtitle}</p>

        <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md sm:text-xs">
          <span aria-hidden>🔓</span>
          <span>
            Acces {offer.includes_course && offer.includes_grile ? "curs + grile" : offer.includes_course ? "curs" : "grile"} până
            la {offer.access_until_label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {offer.includes_course ? (
            <>
              <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-center">
                <p className="text-xl font-black text-sky-950">{offer.course_hours}+</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">ore curs video</p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-center">
                <p className="text-xl font-black text-sky-950">{offer.lessons_count}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">lecții video</p>
              </div>
            </>
          ) : null}
          {offer.includes_grile ? (
            <div className="col-span-2 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 text-center">
              <p className="text-xl font-black text-sky-950">{formatQuestionsCount(offer.grile_questions_count)}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">întrebări grilă</p>
            </div>
          ) : null}
        </div>

        <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
          {offer.includes_course ? (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>
                <strong>Curs video complet</strong>
                {offer.parts_count > 0 ? ` — ${offer.parts_count} părți incluse` : ""}
              </span>
            </li>
          ) : null}
          {offer.includes_grile ? (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>
                <strong>Acces la toată platforma de grile</strong> până la {offer.access_until_label}
              </span>
            </li>
          ) : null}
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-emerald-600">✓</span>
            <span>Factură SmartBill + plată securizată Revolut</span>
          </li>
        </ul>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preț normal</p>
                <p className="text-lg font-bold text-slate-400 line-through">{formatRon(offer.catalog_total_ron)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Oferta ta</p>
                <p className="text-4xl font-black text-sky-950">{formatRon(offer.promo_price_ron)}</p>
              </div>
            </div>
            {offer.savings_ron > 0 ? (
              <p className="mt-3 rounded-xl bg-emerald-100/90 px-3 py-2 text-center text-sm font-bold text-emerald-900">
                Economisești {formatRon(offer.savings_ron)} (−{offer.savings_percent}%)
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onBuy(offer.code)}
            className={`mt-4 w-full rounded-2xl bg-gradient-to-r px-5 py-4 text-base font-extrabold text-white shadow-xl shadow-sky-900/25 transition ${accent.btn}`}
          >
            Cumpără acum — {formatRon(offer.promo_price_ron)}
          </button>
        </div>
      </div>
    </article>
  );
}

type Props = {
  initialCatalog: CatalogResponse["data"] | null;
};

export function Offers2027PageClient({ initialCatalog }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [catalogError, setCatalogError] = useState(!initialCatalog);
  const [selectedOffer, setSelectedOffer] = useState<OfferCatalogItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialCatalog) return;
    void apiFetch<CatalogResponse>("/api/offers-2027/catalog")
      .then((response) => {
        setCatalog(response.data);
        setCatalogError(false);
      })
      .catch(() => setCatalogError(true));
  }, [initialCatalog]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const attempt = searchParams.get("attempt");
    if (payment !== "success" || !attempt) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await apiFetch<ConfirmPaymentResponse>("/api/offers-2027/confirm-payment", {
          method: "POST",
          body: JSON.stringify({ attemptId: attempt }),
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          const purchasedOffer = catalog?.items.find((o) => o.code === response.data.offer_code) ?? null;
          const accessSuffix = purchasedOffer
            ? purchasedOffer.includes_course && purchasedOffer.includes_grile
              ? " la curs și grile"
              : purchasedOffer.includes_course
                ? " la curs"
                : " la grile"
            : "";
          setFeedback(
            response.data.invoice_number
              ? `Plată confirmată! Accesul este activ. Factura: ${response.data.invoice_number}.`
              : `Plată confirmată! Accesul${accessSuffix} este activ.`,
          );
        } else {
          setFeedback("Plata este încă în procesare la Revolut. Reîncarcă pagina în câteva secunde.");
        }
      } catch {
        if (!cancelled) setFeedback("Nu am putut confirma plata acum. Verifică în dashboard și încearcă din nou.");
      } finally {
        if (!cancelled) router.replace("/oferte-2027");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, catalog]);

  const handleBuy = useCallback(
    (code: Offer2027Code) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent("/oferte-2027")}`);
        return;
      }
      const item = catalog?.items.find((o) => o.code === code) ?? null;
      setSelectedOffer(item);
      setCheckoutOpen(true);
    },
    [catalog?.items, router, user],
  );

  const checkoutSummary = useMemo(() => {
    if (!selectedOffer) return null;
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5 shadow-inner">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700">Ofertă 2027</p>
        <p className="mt-1 text-2xl font-black text-sky-950">{selectedOffer.title}</p>
        <p className="mt-1 text-sm text-slate-600">{selectedOffer.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-amber-200/60 pt-4">
          <div>
            <p className="text-xs text-slate-500 line-through">Lista: {formatRon(selectedOffer.catalog_total_ron)}</p>
            <p className="text-3xl font-black text-sky-950">{formatRon(selectedOffer.promo_price_ron)}</p>
          </div>
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
            −{selectedOffer.savings_percent}%
          </span>
        </div>
      </div>
    );
  }, [selectedOffer]);

  const confirmPurchase = async (profile: BillingProfilePutPayload, extras?: { discountCode?: string | null }) => {
    if (!selectedOffer) throw new Error("missing offer");
    const response = await apiFetch<CreatePaymentResponse>("/api/offers-2027/create-payment", {
      method: "POST",
      body: JSON.stringify({
        offerCode: selectedOffer.code,
        acceptTerms: true,
        billingProfile: profile,
        discountCode: extras?.discountCode ?? undefined,
      }),
    });
    if (response.data.direct_paid || !response.data.checkout_url) {
      setCheckoutOpen(false);
      setSelectedOffer(null);
      setFeedback("Comandă înregistrată cu succes. Accesul este activ!");
      return;
    }
    window.location.href = response.data.checkout_url;
  };

  const accessLabel = catalog?.items[0]?.access_until_label ?? "1 August 2027";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(251,191,36,0.25),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(167,139,250,0.2),_transparent_45%)]" />
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 animate-pulse rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 animate-pulse rounded-full bg-amber-400/20 blur-3xl [animation-delay:1s]" />

      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-sky-950/90 via-blue-950/85 to-indigo-950/90 px-6 py-12 text-center shadow-[0_40px_120px_-40px_rgba(14,165,233,0.55)] sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.25em] text-amber-200">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-amber-300" />
            Oferte 2027
          </span>
          <OfferDeadlineBanner />
          <h1 className="relative mt-6 text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Dai admiterea în 2027?
            <span className="mt-2 block bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent">
              Aici găsești cele mai bune oferte!
            </span>
          </h1>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg font-medium text-sky-100/90">
            Pachete complete cu curs video + grile până la <strong className="text-white">{accessLabel}</strong>. Prețuri
            speciale, valabile pentru pregătirea de admitere.
          </p>
          {catalog?.access_until ? <CountdownStrip targetIso={catalog.access_until} /> : null}
        </section>

        {feedback ? (
          <p className="mt-6 rounded-2xl border border-emerald-300/50 bg-emerald-500/15 px-4 py-3 text-center text-sm font-semibold text-emerald-100">
            {feedback}
          </p>
        ) : null}

        {catalogError ? (
          <p className="mt-8 rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 text-center text-rose-100">
            Nu am putut încărca ofertele. Reîncearcă în câteva secunde.
          </p>
        ) : null}

        {!catalogError && !catalog ? (
          <p className="mt-12 text-center text-sky-200">Se încarcă ofertele...</p>
        ) : null}

        {catalog ? (
          <section className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6 xl:gap-8">
            {catalog.items.map((offer, index) => (
              <OfferCard key={offer.code} offer={offer} featured={index === 0} onBuy={handleBuy} />
            ))}
          </section>
        ) : null}

        <section className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Plată", value: "Revolut securizat" },
            { label: "Facturare", value: "SmartBill instant" },
            { label: "Suport", value: "Comunitate Discord" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-sm"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-sky-300">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
            </div>
          ))}
        </section>

        {!authLoading && !user ? (
          <div className="mt-10 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6 text-center">
            <p className="text-lg font-bold text-white">Creează cont sau autentifică-te pentru a cumpăra</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/login?next=/oferte-2027"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"
              >
                Login
              </Link>
              <Link
                href="/register?next=/oferte-2027"
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-bold text-sky-950 shadow-lg"
              >
                Creează cont
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {checkoutOpen && selectedOffer ? (
        <BillingProfileCheckoutModal
          open={checkoutOpen}
          fieldIdPrefix="offers-2027-billing"
          summary={checkoutSummary}
          discount={{ scope: "site", baseAmountRon: selectedOffer.promo_price_ron }}
          checkoutNotice={
            <p>
              <span className="font-semibold text-sky-950">Acces activ până la {selectedOffer.access_until_label}.</span>{" "}
              După plată primești acces imediat la curs (dacă e inclus) și la toate grilele platformei.
            </p>
          }
          submitLabel={`Plătește ${formatRon(selectedOffer.promo_price_ron)}`}
          onClose={() => {
            setCheckoutOpen(false);
            setSelectedOffer(null);
          }}
          onConfirm={confirmPurchase}
        />
      ) : null}
    </main>
  );
}
