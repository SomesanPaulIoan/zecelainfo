import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ADMISSION_LANDINGS, TARGET_EXAM_YEAR, grileExamPath } from "@/lib/exams";
import { getGrileCategorySummary } from "@/lib/grile-data";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Admitere Informatică ${TARGET_EXAM_YEAR} – Pregătire UBB, UB, Politehnica, Iași`,
  description:
    "Pregătire pentru admiterea la Informatică: grile din subiectele reale, cursuri video și simulări de examen pentru UBB, Universitatea din București, Politehnica București, UAIC și TU Iași.",
  path: "/admitere-informatica",
});

export default async function AdmitereInformaticaPage() {
  const [atmSummary, ...summaries] = await Promise.all([
    getGrileCategorySummary("admitere-atm"),
    ...ADMISSION_LANDINGS.map((landing) => getGrileCategorySummary(landing.grileSlug)),
  ]);

  return (
    <main className="bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Acasă", path: "/" },
            { name: "Admitere Informatică", path: "/admitere-informatica" },
          ]}
        />
        <section className="mt-6 max-w-3xl">
          <h1 className="text-balance text-4xl font-black tracking-tight text-sky-950 sm:text-5xl">
            Admitere la Informatică {TARGET_EXAM_YEAR}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-700">
            Fiecare facultate are propriul stil de subiecte. Pe Zece la Info te pregătești exact pe subiectele date în anii
            trecuți la facultatea pe care o vrei: le rezolvi ca grile, cu explicații și video, apoi dai simulări pe timp
            și înveți teoria din cursul dedicat.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Facultăți">
          {ADMISSION_LANDINGS.map((landing, index) => {
            const summary = summaries[index];
            return (
              <article
                key={landing.key}
                className="flex flex-col rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_40px_-28px_rgba(2,132,199,0.45)]"
              >
                <h2 className="text-xl font-black text-sky-950">
                  <Link href={landing.path} className="hover:underline">
                    {landing.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-600">{landing.institutions.join(" • ")}</p>
                {summary ? (
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    {formatRoNumber(summary.total_questions)} grile
                    {summary.total_with_video > 0 ? ` · ${formatRoNumber(summary.total_with_video)} explicații video` : ""}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <ButtonLink href={landing.path} variant="dark">
                    Ghid {landing.shortName}
                  </ButtonLink>
                  <Link
                    href={grileExamPath(landing.grileSlug)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-slate-900 hover:bg-amber-100"
                  >
                    Grile
                  </Link>
                  <Link
                    href={`/cursuri/${landing.courseSlug}`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-sky-200 bg-white px-4 text-sm font-bold text-sky-900 hover:bg-sky-50"
                  >
                    Curs
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-10 rounded-[1.6rem] border border-sky-200/80 bg-white/90 p-6">
          <h2 className="text-lg font-black text-sky-950">Alte examene</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <Link href={grileExamPath("admitere-atm")} className="font-bold text-sky-800 hover:underline">
                Grile Admitere Academia Tehnică Militară (ATM)
              </Link>
              {atmSummary ? ` — ${formatRoNumber(atmSummary.total_questions)} grile din subiecte și culegere.` : null}
            </li>
            <li>
              <Link href="/bacalaureat" className="font-bold text-sky-800 hover:underline">
                Bacalaureat Informatică
              </Link>{" "}
              — subiecte, grile, simulări cu corectare și curs.
            </li>
          </ul>
        </section>

        <section className="mt-10 rounded-[2rem] border border-sky-900 bg-sky-950 p-6 text-white sm:p-10">
          <h2 className="text-balance text-2xl font-black tracking-tight sm:text-3xl">
            Nu doar vezi că ai greșit. Înțelegi de ce ai greșit.
          </h2>
          <p className="mt-3 max-w-2xl text-sky-100">
            La fiecare grilă ai indicație, explicație pas cu pas și, pentru majoritatea, rezolvare video. Iar în modul
            „Examen” rezolvi subiectul întreg pe timp și primești nota.
          </p>
          <div className="mt-6">
            <ButtonLink href="/grile" size="lg">
              Începe să rezolvi
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}
