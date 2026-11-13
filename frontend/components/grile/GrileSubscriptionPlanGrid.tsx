"use client";

export type PlanCode = "free_24h" | "month_1" | "month_3" | "until_2027";

export type GrilePublicSummary = {
  total_questions: number;
  total_with_video: number;
  total_with_hint: number;
  total_with_explanation: number;
  total_with_hint_and_explanation: number;
  total_with_hint_ai: number;
  total_with_explanation_ai: number;
  total_sources: number;
  total_chapters: number;
  total_categories: number;
  total_correct_attempts: number;
  total_attempts: number;
  users_with_active_premium: number;
};

type PlanDef = {
  code: PlanCode;
  title: string;
  subtitle: string;
  priceLabel: string;
  periodLabel: string;
  priceTagline?: string;
  cta: string;
  badge?: { label: string; variant: "mint" | "sky" | "emerald" };
  ribbon?: { label: string; className: string };
  ribbonSub?: string;
  footnote: string;
  extraFeatures?: string[];
};

const PLANS: PlanDef[] = [
  {
    code: "free_24h",
    title: "1 zi gratuită",
    subtitle: "Testezi gratuit toate grilele și toate cursurile video, cu confirmare rapidă prin SMS.",
    priceLabel: "0",
    periodLabel: "/ 24h",
    cta: "Activează gratuit",
    badge: { label: "Gratuit", variant: "mint" },
    footnote: "O singură activare per număr de telefon, o dată per cont. Confirmare prin cod SMS.",
  },
  {
    code: "month_1",
    title: "1 lună",
    subtitle: "O lună intensă de pregătire pentru examenele de informatică.",
    priceLabel: "150",
    periodLabel: "/ 30 zile",
    cta: "Alege 1 lună",
    badge: { label: "Standard", variant: "sky" },
    footnote: "Recomandat dacă ai o lună de „push” (vacanță / pregătire rapidă).",
  },
  {
    code: "month_3",
    title: "3 luni",
    subtitle: "Ritm constant pentru o pregătire de un trimestru.",
    priceLabel: "399",
    periodLabel: "/ 90 zile",
    priceTagline: "Cca 133 lei pe lună, fără grija reînnoirii lunare.",
    cta: "Alege 3 luni",
    footnote: "Pentru elevii care vor rezultat clar: rezolvi sistematic, vezi unde greșești, corectezi.",
    extraFeatures: ["Progres, grile rezolvate, recapitulare rapidă"],
  },
  {
    code: "until_2027",
    title: "Până la 1 August 2027",
    subtitle: "Acces neîntrerupt pe toată perioada de pregătire, fără să te mai gândești la reînnoiri.",
    priceLabel: "699",
    periodLabel: "/ până la 1 Aug 2027",
    priceTagline: "Vrei și cursul video? Îl adaugi la pachet cu doar +300 lei.",
    cta: "Alege până la 2027",
    ribbon: { label: "BEST VALUE", className: "bg-gradient-to-r from-emerald-700 to-teal-600" },
    ribbonSub: "Cel mai mic preț pe lună",
    footnote: "Ideal dacă vrei „peace of mind”: ai platforma activă pe toată perioada de pregătire, dintr-o singură plată.",
    extraFeatures: ["Nu mai trebuie să reînnoiești abonamentul"],
  },
];

function fmtRo(n: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.max(0, Math.floor(n)));
}

function StatInline({ loading, value }: { loading: boolean; value: number | null }) {
  if (loading) {
    return (
      <span className="inline-block h-[1.05em] min-w-[3.25rem] animate-pulse rounded bg-slate-200/90 align-middle" aria-hidden />
    );
  }
  if (value === null) {
    return <span className="font-bold text-slate-400">—</span>;
  }
  return <strong className="font-bold text-slate-900">{fmtRo(value)}</strong>;
}

function IconInfinity({ className }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center font-serif text-[1.15rem] font-black leading-none text-sky-600 ${className ?? ""}`} aria-hidden>
      ∞
    </span>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconBulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2Z" />
    </svg>
  );
}

function IconDroplet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2.7c-3 4-6 7.2-6 11a6 6 0 0 0 12 0c0-3.8-3-7-6-11Z" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m12.83 2.18 8 3.64a1 1 0 0 1 0 1.82l-8 3.64a2 2 0 0 1-1.66 0l-8-3.64a1 1 0 0 1 0-1.82l8-3.64a2 2 0 0 1 1.66 0Z" />
      <path d="M2 12.5 12 16l10-3.5M2 17l10 3.5L22 17" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 3v18h18M7 16l4-6 4 3 5-9" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const badgeClass: Record<NonNullable<PlanDef["badge"]>["variant"], string> = {
  mint: "border-emerald-200/80 bg-emerald-50 text-emerald-900",
  sky: "border-sky-200/80 bg-sky-50 text-sky-900",
  emerald: "border-emerald-300/90 bg-emerald-100/90 text-emerald-950",
};

type Props = {
  summary: GrilePublicSummary | null;
  summaryLoading: boolean;
  onSelectPlan: (code: PlanCode) => void;
};

export function GrileSubscriptionPlanGrid({
  summary,
  summaryLoading,
  onSelectPlan,
}: Props) {
  const tq = summary?.total_questions ?? null;
  const tv = summary?.total_with_video ?? null;
  const tHintEx = summary?.total_with_hint_and_explanation ?? null;
  const ts = summary?.total_sources ?? null;
  const tch = summary?.total_chapters ?? null;
  const tcat = summary?.total_categories ?? null;

  const stat = (value: number | null, fallback: string) =>
    summaryLoading || value === null ? <span className="inline-block h-4 w-14 animate-pulse rounded bg-slate-200/90" /> : fmtRo(value);

  const baseFeatures = [
    {
      icon: IconInfinity,
      line: (
        <>
          Acces complet: <strong className="font-bold text-slate-900">{stat(tq, "—")}</strong> grile +{" "}
          <strong className="font-bold text-slate-900">{stat(ts, "—")}</strong> surse
        </>
      ),
    },
    {
      icon: IconPlay,
      line: (
        <>
          Toate video-urile: <strong className="font-bold text-slate-900">{stat(tv, "—")}</strong> grile cu explicații
        </>
      ),
    },
    {
      icon: IconBulb,
      line: (
        <>
          <strong className="font-bold text-slate-900">Indicații și explicații text</strong> pe{" "}
          <strong className="font-bold text-slate-900">{stat(tHintEx, "—")}</strong> grile
        </>
      ),
    },
    {
      icon: IconDroplet,
      line: (
        <>
          <strong className="font-bold text-slate-900">Mod Examen</strong> (simulezi orice subiect)
        </>
      ),
    },
    {
      icon: IconLayers,
      line: (
        <>
          Grile grupate pe <strong className="font-bold text-slate-900">surse</strong> &{" "}
          <strong className="font-bold text-slate-900">{stat(tch, "—")}</strong> capitole ·{" "}
          <strong className="font-bold text-slate-900">{stat(tcat, "—")}</strong> categorii
        </>
      ),
    },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.22),transparent_65%)]" />
      <div className="relative">
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Alege perioada de acces</h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
          Cea mai performantă platformă cu grile de informatică din țară:{" "}
          <StatInline loading={summaryLoading} value={tq} /> grile în total, dintre acestea{" "}
          <StatInline loading={summaryLoading} value={tHintEx} /> au indicații și explicații text generate de AI și{" "}
          <StatInline loading={summaryLoading} value={tv} /> au chiar și explicații video filmate de Paul Somesan în
          peste 2 ani de muncă intensă.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {PLANS.map((plan) => {
            const isPopular = plan.code === "month_3";
            const isBest = plan.code === "until_2027";

            return (
              <article
                key={plan.code}
                className={`group relative flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_22px_60px_-28px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-24px_rgba(14,165,233,0.35)] ${
                  isPopular
                    ? "border-sky-400/70 ring-2 ring-sky-300/50 xl:scale-[1.02] xl:z-[1]"
                    : isBest
                      ? "border-emerald-300/70 ring-1 ring-emerald-200/60"
                      : "border-slate-200/90"
                }`}
              >
                {plan.ribbon ? (
                  <div
                    className={`absolute right-[-2.75rem] top-[1.35rem] z-[2] w-[10.5rem] rotate-45 py-1 text-center text-[0.65rem] font-black uppercase tracking-widest text-white shadow-md ${plan.ribbon.className}`}
                  >
                    {plan.ribbon.label}
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
                  <div className="flex min-h-[3.25rem] items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 sm:text-2xl">{plan.title}</h3>
                      <p className="mt-1.5 text-sm leading-snug text-slate-600">{plan.subtitle}</p>
                    </div>
                    {plan.badge ? (
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${badgeClass[plan.badge.variant]}`}
                      >
                        {plan.badge.label}
                      </span>
                    ) : null}
                  </div>

                  {plan.ribbonSub ? (
                    <p
                      className={`mt-2 text-xs font-semibold ${
                        plan.code === "until_2027" ? "text-emerald-800" : "text-emerald-700"
                      }`}
                    >
                      {plan.ribbonSub}
                    </p>
                  ) : null}

                  <div className="mt-6">
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-4xl font-black tabular-nums tracking-tight text-slate-900 sm:text-[2.75rem]">
                        {plan.priceLabel === "0" ? "0" : plan.priceLabel}{" "}
                        <span className="text-lg font-bold text-slate-500 sm:text-xl">Lei</span>
                      </span>
                      <span className="text-base font-semibold text-slate-500">{plan.periodLabel}</span>
                    </p>
                    {plan.priceTagline ? (
                      <p className="mt-2 text-sm font-medium leading-snug text-slate-600">{plan.priceTagline}</p>
                    ) : null}
                  </div>

                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-slate-700">
                    {baseFeatures.map((row, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                          <row.icon className="h-4 w-4" />
                        </span>
                        <span className="leading-snug">{row.line}</span>
                      </li>
                    ))}
                    {plan.extraFeatures?.map((text, i) => (
                      <li key={`extra-${i}`} className="flex gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                          {plan.code === "month_3" ? (
                            <IconChart className="h-4 w-4" />
                          ) : (
                            <IconCheck className="h-4 w-4" />
                          )}
                        </span>
                        <span className="leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                    {plan.footnote}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.code)}
                    className={`mt-5 w-full rounded-xl py-3.5 text-sm font-bold shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                      isPopular
                        ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500"
                        : "bg-gradient-to-r from-sky-600 to-cyan-600 text-white hover:from-sky-500 hover:to-cyan-500"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function getPlanCheckoutLabels(code: PlanCode | null): {
  title: string;
  subtitle: string;
  price: string;
  period: string;
} | null {
  if (!code) return null;
  const p = PLANS.find((x) => x.code === code);
  if (!p) return null;
  return {
    title: p.title,
    subtitle: p.subtitle,
    price: p.priceLabel === "0" ? "0 Lei" : `${p.priceLabel} Lei`,
    period: p.periodLabel,
  };
}
