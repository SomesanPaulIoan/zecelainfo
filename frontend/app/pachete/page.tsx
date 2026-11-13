import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getGrileGlobalSummary } from "@/lib/grile-data";
import { PACHETE, pachetPath } from "@/lib/pachete";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Pachete Admitere Informatică și Bac 2027 – Grile + Curs Video",
  description:
    "Alege pachetul pentru examenul tău: Admitere UBB, UB & UNSTPB, UAIC & TU Iași sau Bacalaureat. Grile de la 150 lei/lună sau pachet complet curs + grile până la 1 August 2027. Testează gratuit 24h.",
  path: "/pachete",
});

export default async function PachetePage() {
  const summary = await getGrileGlobalSummary();
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-30px_rgba(2,132,199,0.5)] sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="relative">
            <Breadcrumbs
              items={[
                { name: "Acasă", path: "/" },
                { name: "Pachete", path: "/pachete" },
              ]}
            />
            <h1 className="mt-4 max-w-3xl text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
              Pachete pentru examenul tău de informatică
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-700 sm:text-lg">
              {summary ? `${formatRoNumber(summary.total_questions)} de grile cu explicații` : "Grile cu explicații"} și cursuri video
              complete. Grile de la 150 lei pe lună sau pachetul complet curs + grile până la 1 August 2027. Și poți testa totul
              gratuit 24 de ore.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {PACHETE.map((pachet) => (
            <Link
              key={pachet.slug}
              href={pachetPath(pachet.slug)}
              className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(3,105,161,0.5)] transition hover:-translate-y-1 hover:border-amber-300 sm:p-8"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">{pachet.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-sky-950">{pachet.label}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{pachet.lede}</p>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Grile de la <strong className="text-sky-950">150 lei</strong> · Curs + grile{" "}
                  <strong className="text-sky-950">999 lei</strong>
                </p>
                <span className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-sky-600">
                  Vezi pachetele →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
