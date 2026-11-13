"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type Summary = {
  totals: {
    page_views: number;
    demo_started: number;
    demo_completed: number;
    demo_with_account: number;
    registrations: number;
    trials: number;
    trials_converted: number;
    orders: number;
    customers: number;
    revenue_gross_ron: number;
    revenue_net_ron: number | null;
    avg_order_ron: number | null;
    ad_spend_ron: number | null;
  };
  rates: Record<
    "visit_to_demo" | "visit_to_account" | "demo_to_account" | "account_to_trial" | "trial_to_purchase" | "visit_to_purchase" | "cac_ron" | "roas",
    number | null
  >;
  top_products: Array<{ flow: string; product: string; orders: number; revenue: number }>;
  by_exam: Array<{ exam_group: string | null; orders: number; revenue: number }>;
  campaigns: Array<{
    utm_source: string | null;
    utm_campaign: string | null;
    registrations: number;
    trials: number;
    orders: number;
    revenue: number;
    spend_ron: number | null;
    cac_ron: number | null;
    roas: number | null;
  }>;
  attribution_coverage: { total: number; attributed: number };
  notes: string[];
};

const EXAM_LABELS: Record<string, string> = { ubb: "UBB", ub_unstpb: "UB & UNSTPB", iasi: "UAIC & TU Iași", bac: "Bacalaureat" };

function isoDay(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return isoDay(date);
}

const ron = (value: number | null | undefined) =>
  value == null ? "indisponibil" : `${value.toLocaleString("ro-RO", { maximumFractionDigits: 0 })} lei`;
const pct = (value: number | null | undefined) =>
  value == null ? "—" : `${(value * 100).toLocaleString("ro-RO", { maximumFractionDigits: 1 })}%`;
const num = (value: number) => value.toLocaleString("ro-RO");

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

/** Funnel: o singura serie, o singura nuanta; valoarea si rata sunt scrise langa fiecare bara (nu doar culoare). */
function Funnel({ steps }: { steps: Array<{ label: string; value: number; rate: number | null }> }) {
  const max = Math.max(1, ...steps.map((step) => step.value));
  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li key={step.label} className="grid grid-cols-[8.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr]">
          <span className="font-semibold text-slate-700">{step.label}</span>
          <span className="flex items-center gap-2">
            <span
              className="h-5 rounded-r-[4px] bg-sky-600"
              style={{ width: `${Math.max(0.5, (step.value / max) * 100)}%` }}
              title={`${step.label}: ${num(step.value)}`}
            />
            <span className="whitespace-nowrap text-slate-900">
              <strong>{num(step.value)}</strong>
              {index > 0 ? <span className="text-slate-500"> · {pct(step.rate)} din pasul anterior</span> : null}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(daysAgo(0));
  const [source, setSource] = useState("");
  const [campaign, setCampaign] = useState("");
  const [exam, setExam] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [spend, setSpend] = useState({ day: daysAgo(0), utm_source: "tiktok", utm_campaign: "", amount_ron: "" });
  const [spendMessage, setSpendMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from, to });
    if (source.trim()) params.set("source", source.trim());
    if (campaign.trim()) params.set("campaign", campaign.trim());
    if (exam) params.set("exam", exam);
    try {
      const response = await apiFetch<{ data: Summary }>(`/api/marketing/admin/summary?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error && err.message.includes("403") ? "Doar administratorii au acces." : "Nu am putut încărca datele.");
    } finally {
      setLoading(false);
    }
  }, [from, to, source, campaign, exam]);

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveSpend = async () => {
    setSpendMessage(null);
    try {
      await apiFetch("/api/marketing/admin/ad-spend", {
        method: "PUT",
        body: JSON.stringify({ ...spend, amount_ron: Number(spend.amount_ron) }),
      });
      setSpendMessage("Cost salvat.");
      void load();
    } catch {
      setSpendMessage("Nu am putut salva costul. Verifică data, sursa și suma.");
    }
  };

  if (user && user.role !== "admin") {
    return <p className="p-10 text-center text-slate-600">Doar administratorii au acces la această pagină.</p>;
  }

  const t = data?.totals;
  const r = data?.rates;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">admin</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Marketing și conversii</h1>
          </div>
          <Link href="/admin" className="text-sm font-semibold text-sky-800 hover:underline">
            ← Înapoi la admin
          </Link>
        </div>

        <form
          className="mt-5 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          {[
            { label: "Ultimele 7 zile", days: 6 },
            { label: "30 de zile", days: 29 },
            { label: "90 de zile", days: 89 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setFrom(daysAgo(preset.days));
                setTo(daysAgo(0));
              }}
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {preset.label}
            </button>
          ))}
          <label className="text-xs font-semibold text-slate-600">
            De la
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block min-h-10 rounded-lg border border-slate-200 px-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Până la
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block min-h-10 rounded-lg border border-slate-200 px-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Sursă (utm_source)
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="tiktok" className="mt-1 block min-h-10 w-32 rounded-lg border border-slate-200 px-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Campanie
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="ubb_grile_video1" className="mt-1 block min-h-10 w-44 rounded-lg border border-slate-200 px-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Examen
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="mt-1 block min-h-10 rounded-lg border border-slate-200 px-2 text-sm">
              <option value="">Toate</option>
              {Object.entries(EXAM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="min-h-10 rounded-lg bg-sky-700 px-4 text-sm font-bold text-white hover:bg-sky-600">
            {loading ? "Se încarcă..." : "Aplică"}
          </button>
        </form>

        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}

        {t && r && data ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Încasări brute" value={ron(t.revenue_gross_ron)} hint={`Net: ${ron(t.revenue_net_ron)}`} />
              <Tile label="Comenzi plătite" value={num(t.orders)} hint={`${num(t.customers)} clienți`} />
              <Tile label="Valoare medie comandă" value={ron(t.avg_order_ron)} />
              <Tile label="Trial → cumpărare" value={pct(r.trial_to_purchase)} hint={`${num(t.trials_converted)} din ${num(t.trials)} trialuri`} />
              <Tile label="Cost reclame (introdus manual)" value={ron(t.ad_spend_ron)} />
              <Tile label="CAC" value={r.cac_ron == null ? "indisponibil" : ron(r.cac_ron)} hint="cost / client plătitor" />
              <Tile label="ROAS" value={r.roas == null ? "indisponibil" : `${r.roas.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}×`} hint="încasări / cost reclame" />
              <Tile label="Vizită → cumpărare" value={pct(r.visit_to_purchase)} />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black text-slate-900">Funnel</h2>
              <div className="mt-4">
                <Funnel
                  steps={[
                    { label: "Afișări pagini", value: t.page_views, rate: null },
                    // Demo-ul e oprit implicit; randurile apar doar daca exista sesiuni in perioada aleasa.
                    ...(t.demo_started > 0
                      ? [
                          { label: "Demo începute", value: t.demo_started, rate: r.visit_to_demo },
                          { label: "Demo terminate", value: t.demo_completed, rate: t.demo_completed / t.demo_started },
                        ]
                      : []),
                    { label: "Conturi noi", value: t.registrations, rate: r.visit_to_account ?? null },
                    { label: "Trialuri activate", value: t.trials, rate: r.account_to_trial },
                    { label: "Clienți plătitori", value: t.customers, rate: null },
                  ]}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {t.demo_started > 0
                  ? `Demo → cont: ${pct(r.demo_to_account)} (${num(t.demo_with_account)} sesiuni demo legate de un cont). `
                  : ""}
                Conturi cu sursă cunoscută: {num(data.attribution_coverage.attributed)} din {num(data.attribution_coverage.total)}.
              </p>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <caption className="px-5 pt-4 text-left text-lg font-black text-slate-900">Campanii (prima atingere)</caption>
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {["Sursă", "Campanie", "Conturi", "Trialuri", "Comenzi", "Încasări", "Cost", "CAC", "ROAS"].map((head) => (
                      <th key={head} scope="col" className="px-4 py-2 font-bold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                        Nicio conversie atribuită încă în acest interval.
                      </td>
                    </tr>
                  ) : (
                    data.campaigns.map((row) => (
                      <tr key={`${row.utm_source}|${row.utm_campaign}`}>
                        <td className="px-4 py-2">{row.utm_source ?? "—"}</td>
                        <td className="px-4 py-2">{row.utm_campaign ?? "—"}</td>
                        <td className="px-4 py-2">{num(row.registrations)}</td>
                        <td className="px-4 py-2">{num(row.trials)}</td>
                        <td className="px-4 py-2">{num(row.orders)}</td>
                        <td className="px-4 py-2">{ron(row.revenue)}</td>
                        <td className="px-4 py-2">{row.spend_ron == null ? "—" : ron(row.spend_ron)}</td>
                        <td className="px-4 py-2">{row.cac_ron == null ? "—" : ron(row.cac_ron)}</td>
                        <td className="px-4 py-2">{row.roas == null ? "—" : `${row.roas.toFixed(2)}×`}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <caption className="px-5 pt-4 text-left text-lg font-black text-slate-900">Cele mai vândute produse</caption>
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Produs</th>
                      <th className="px-4 py-2">Comenzi</th>
                      <th className="px-4 py-2">Încasări</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.top_products.map((row) => (
                      <tr key={`${row.flow}:${row.product}`}>
                        <td className="px-4 py-2">
                          <span className="text-slate-500">{row.flow} · </span>
                          {row.product}
                        </td>
                        <td className="px-4 py-2">{num(row.orders)}</td>
                        <td className="px-4 py-2">{ron(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <caption className="px-5 pt-4 text-left text-lg font-black text-slate-900">Vânzări pe examen</caption>
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Examen</th>
                      <th className="px-4 py-2">Comenzi</th>
                      <th className="px-4 py-2">Încasări</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.by_exam.map((row) => (
                      <tr key={row.exam_group ?? "none"}>
                        <td className="px-4 py-2">{row.exam_group ? EXAM_LABELS[row.exam_group] ?? row.exam_group : "Nespecificat (grile fără examen ales)"}</td>
                        <td className="px-4 py-2">{num(row.orders)}</td>
                        <td className="px-4 py-2">{ron(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-900">Cost reclame (manual)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fără integrare cu TikTok Ads, CAC și ROAS se calculează din costurile introduse aici (pe zi, sursă și campanie).
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input type="date" value={spend.day} onChange={(e) => setSpend({ ...spend, day: e.target.value })} className="min-h-10 rounded-lg border border-slate-200 px-2 text-sm" />
            <input value={spend.utm_source} onChange={(e) => setSpend({ ...spend, utm_source: e.target.value })} placeholder="sursă" className="min-h-10 w-28 rounded-lg border border-slate-200 px-2 text-sm" />
            <input value={spend.utm_campaign} onChange={(e) => setSpend({ ...spend, utm_campaign: e.target.value })} placeholder="campanie" className="min-h-10 w-44 rounded-lg border border-slate-200 px-2 text-sm" />
            <input inputMode="decimal" value={spend.amount_ron} onChange={(e) => setSpend({ ...spend, amount_ron: e.target.value })} placeholder="lei" className="min-h-10 w-24 rounded-lg border border-slate-200 px-2 text-sm" />
            <button type="button" onClick={() => void saveSpend()} className="min-h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">
              Salvează
            </button>
          </div>
          {spendMessage ? <p className="mt-2 text-sm text-slate-700">{spendMessage}</p> : null}
        </div>
      </section>
    </main>
  );
}

export function AdminMarketingDashboard() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
