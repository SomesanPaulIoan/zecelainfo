import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TESTIMONIALS, TestimonialCard } from "@/components/meditatii/StudentTestimonials";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ADMISSION_LANDINGS, TARGET_EXAM_YEAR, getAdmissionLanding, grileExamPath } from "@/lib/exams";
import { courseStats, getCourse, getGrileCategoryDetails, getGrileCategorySummary } from "@/lib/grile-data";
import { sourceTagTabOrderForCategory, withResolvedSourceTags, type GrileItem } from "@/lib/grile-sources";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ exam: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam } = await params;
  const landing = getAdmissionLanding(exam);
  if (!landing) return { title: "Pagina nu a fost găsită" };
  return pageMetadata({ title: landing.seoTitle, description: landing.metaDescription, path: landing.path });
}

/** Grupeaza sursele pe eticheta lor (Examen Vara, Concurs Mate Info...), in ordinea tab-urilor din pagina de grile. */
function groupSources(sources: GrileItem[], grileSlug: string) {
  const tagged = withResolvedSourceTags(sources, grileSlug);
  const order = sourceTagTabOrderForCategory(grileSlug) ?? [];
  const groups = new Map<string, GrileItem[]>();
  for (const source of tagged) {
    const tag = source.source_tag ?? "Subiecte și variante";
    groups.set(tag, [...(groups.get(tag) ?? []), source]);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export default async function AdmissionLandingPage({ params }: Props) {
  const { exam } = await params;
  const landing = getAdmissionLanding(exam);
  if (!landing) notFound();

  const [summary, sourcesDetails, chaptersDetails, course] = await Promise.all([
    getGrileCategorySummary(landing.grileSlug),
    getGrileCategoryDetails(landing.grileSlug, "sources"),
    getGrileCategoryDetails(landing.grileSlug, "chapters"),
    getCourse(landing.courseSlug),
  ]);

  const sources = sourcesDetails?.sources ?? [];
  const sourceGroups = groupSources(sources, landing.grileSlug);
  const simulationsCount = sources.filter((source) => source.exam_mode_enabled).length;
  const chapters = (chaptersDetails?.chapters ?? []).filter((chapter) => chapter.total_questions > 0);
  const stats = course ? courseStats(course) : null;
  const testimonials = landing.testimonialMatch
    ? TESTIMONIALS.filter((testimonial) => landing.testimonialMatch?.test(testimonial.admission)).slice(0, 6)
    : [];
  const grilePath = grileExamPath(landing.grileSlug);
  const coursePath = `/cursuri/${landing.courseSlug}`;
  const otherLandings = ADMISSION_LANDINGS.filter((item) => item.key !== landing.key);

  const heroStats = [
    summary ? { value: formatRoNumber(summary.total_questions), label: "grile din subiecte reale" } : null,
    summary && summary.total_with_video > 0 ? { value: formatRoNumber(summary.total_with_video), label: "explicații video" } : null,
    simulationsCount > 0 ? { value: formatRoNumber(simulationsCount), label: "simulări cu notă (mod Examen)" } : null,
    stats && stats.hours > 0 ? { value: `${stats.hours}+`, label: "ore de curs video" } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
    <main className="bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Breadcrumbs
          items={[
            { name: "Acasă", path: "/" },
            { name: "Admitere Informatică", path: "/admitere-informatica" },
            { name: landing.shortName, path: landing.path },
          ]}
        />

        <section className="mt-6 max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">{landing.institutions.join(" • ")}</p>
          <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-sky-950 sm:text-5xl">
            {landing.title} {TARGET_EXAM_YEAR}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-700">{landing.intro}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={grilePath} size="lg">
              Începe să rezolvi grile
            </ButtonLink>
            <ButtonLink href={coursePath} variant="secondary" size="lg">
              Vezi cursul
            </ButtonLink>
          </div>
        </section>

        {heroStats.length > 0 ? (
          <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="flex flex-col rounded-2xl border border-sky-200/80 bg-white/90 px-4 py-4 shadow-sm">
                <dt className="order-2 text-xs font-semibold leading-snug text-slate-600 sm:text-sm">{stat.label}</dt>
                <dd className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <section className="mt-14" aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
            Cum te pregătești pe Zece la Info
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <li className="rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Pasul 1 · Teorie</p>
              <h3 className="mt-2 text-lg font-black text-sky-950">Parcurgi materia în curs</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {stats
                  ? `${stats.partsCount} părți și ${stats.videosCount} lecții video${stats.hours > 0 ? `, peste ${stats.hours} de ore` : ""}, cu toată materia și subiectele rezolvate.`
                  : "Lecții video cu toată materia și subiectele din anii trecuți rezolvate."}
              </p>
              <Link href={coursePath} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline">
                Vezi structura cursului →
              </Link>
            </li>
            <li className="rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Pasul 2 · Exersare</p>
              <h3 className="mt-2 text-lg font-black text-sky-950">Rezolvi grile pe capitole</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {chapters.length > 0
                  ? `${chapters.length} capitole, de la algoritmi elementari până la grafuri și programare dinamică. Pentru fiecare grilă ai indicație, explicație și, la multe dintre ele, video.`
                  : "Grilele sunt grupate pe capitole, cu indicații, explicații și video."}
              </p>
              <Link
                href={grileExamPath(landing.grileSlug, "chapters")}
                className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline"
              >
                Grile pe capitole →
              </Link>
            </li>
            <li className="rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Pasul 3 · Simulare</p>
              <h3 className="mt-2 text-lg font-black text-sky-950">Dai examenul înainte de examen</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {simulationsCount > 0
                  ? `${simulationsCount} subiecte pot fi rezolvate în modul „Examen”: pe timp, iar la final primești nota.`
                  : "Rezolvi subiecte întregi, exact ca la examen."}
              </p>
              <Link href={grilePath} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline">
                Alege un subiect →
              </Link>
            </li>
          </ol>
        </section>

        {sourceGroups.length > 0 ? (
          <section className="mt-14" aria-labelledby="subiecte-heading">
            <h2 id="subiecte-heading" className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
              Subiecte și variante disponibile ca grile
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {sources.length} surse pentru {landing.title}. Fiecare poate fi rezolvată grilă cu grilă, cu explicații.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {sourceGroups.map(([tag, items], index) => (
                <details key={tag} open={index < 2} className="group rounded-2xl border border-sky-200/80 bg-white/95 p-4 shadow-sm">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 font-black text-sky-950">
                    <span>{tag}</span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800">{items.length}</span>
                  </summary>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-baseline justify-between gap-3 border-t border-sky-50 pt-1.5">
                        <span>{item.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{item.total_questions} grile</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
            <div className="mt-6">
              <ButtonLink href={grilePath}>Deschide toate grilele {landing.shortName}</ButtonLink>
            </div>
          </section>
        ) : null}

        {chapters.length > 0 ? (
          <section className="mt-14" aria-labelledby="capitole-heading">
            <h2 id="capitole-heading" className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
              Capitolele din care se dau grile
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {chapters.map((chapter) => (
                <li
                  key={chapter.id}
                  className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  {chapter.name} <span className="text-slate-500">· {chapter.total_questions}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {course ? (
          <section className="mt-14 overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/95 shadow-[0_20px_64px_-34px_rgba(2,132,199,0.45)]">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              {course.image_url ? (
                <div className="relative aspect-[16/9] md:aspect-auto">
                  <Image
                    src={course.image_url}
                    alt={course.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="p-6 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">Cursul recomandat</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-sky-950">{course.name}</h2>
                {course.hook ? <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600">{course.hook}</p> : null}
                {stats ? (
                  <ul className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                    <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">{stats.partsCount} părți</li>
                    <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">{stats.videosCount} video-uri</li>
                    {stats.hours > 0 ? (
                      <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">{stats.hours}+ ore</li>
                    ) : null}
                    {stats.lowestPartPrice ? (
                      <li className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                        de la {stats.lowestPartPrice} {course.currency || "RON"} / parte
                      </li>
                    ) : null}
                  </ul>
                ) : null}
                <div className="mt-6">
                  <ButtonLink href={coursePath} variant="dark">
                    {stats && stats.freePreviewCount > 0 ? "Vezi cursul și lecțiile gratuite" : "Vezi cursul"}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {testimonials.length > 0 ? (
          <section className="mt-14" aria-labelledby="recenzii-heading">
            <h2 id="recenzii-heading" className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
              Elevi admiși la {landing.shortName} după pregătirea cu Paul
            </h2>
            <p className="mt-2 text-sm text-slate-600">Recenzii reale ale elevilor de la meditații.</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 sm:p-10">
          <h2 className="text-balance text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
            Nu doar vezi că ai greșit. Înțelegi de ce ai greșit.
          </h2>
          <p className="mt-3 max-w-2xl text-pretty text-slate-700">
            Începe cu un subiect din anii trecuți. La fiecare grilă poți cere o indicație, poți citi explicația și poți
            urmări rezolvarea video.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={grilePath} size="lg">
              Rezolvă grile {landing.shortName}
            </ButtonLink>
            <ButtonLink href="/meditatii" variant="secondary" size="lg">
              Meditații în grupe mici
            </ButtonLink>
          </div>
        </section>

        <nav aria-label="Alte admiteri" className="mt-14">
          <h2 className="text-lg font-black text-sky-950">Pregătire pentru alte facultăți</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherLandings.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.path}
                  className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-sky-900 hover:border-amber-300 hover:bg-amber-50"
                >
                  {item.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/bacalaureat"
                className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-sky-900 hover:border-amber-300 hover:bg-amber-50"
              >
                Bacalaureat Informatică
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
