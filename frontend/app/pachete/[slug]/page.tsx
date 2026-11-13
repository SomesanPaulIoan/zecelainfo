import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TESTIMONIALS } from "@/components/meditatii/StudentTestimonials";
import { PachetPricing } from "@/components/pachete/PachetPricing";
import { PachetReviews, PachetTestimonials } from "@/components/pachete/PachetReviews";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { apiFetch } from "@/lib/api";
import { getStaticCourseReviews, type CourseReview } from "@/lib/course-reviews";
import { grileExamPath } from "@/lib/exams";
import {
  getCourse,
  getGrileCategories,
  getGrileCategoryDetails,
  getGrileCategorySummary,
  getGrileGlobalSummary,
  type GrileCategorySummary,
} from "@/lib/grile-data";
import { sourceTagTabOrderForCategory, withResolvedSourceTags, type GrileItem } from "@/lib/grile-sources";
import {
  getPachet,
  PACHET_PRICING_ANCHOR,
  PACHET_TRIAL_ANCHOR,
  PACHETE,
  pachetPath,
} from "@/lib/pachete";
import { formatRoNumber, pageMetadata } from "@/lib/seo";
import { getPublicPricing } from "@/lib/pricing";
import { PachetStickyCta } from "@/components/pachete/PachetStickyCta";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pachet = getPachet(slug);
  if (!pachet) return { title: "Pachete", robots: { index: false } };
  return pageMetadata({ title: pachet.metaTitle, description: pachet.metaDescription, path: pachetPath(pachet.slug) });
}

type PublicReviewsResponse = {
  data: Array<{ author_name: string; title: string; content: string; rating: number; updated_at: string }>;
};

/** Review-urile cursului: cele lasate pe site (API) + cele preluate de pe vechea platforma, fara duplicate. */
async function getCourseReviews(courseSlug: string): Promise<CourseReview[]> {
  let fromApi: CourseReview[] = [];
  try {
    const response = await apiFetch<PublicReviewsResponse>(`/api/courses/${encodeURIComponent(courseSlug)}/reviews`);
    fromApi = response.data.map((review) => ({
      author: review.author_name,
      date: review.updated_at?.slice(0, 10) ?? "",
      title: review.title,
      content: review.content,
      rating: Number(review.rating),
    }));
  } catch {
    fromApi = [];
  }
  const merged = [...fromApi];
  for (const review of getStaticCourseReviews(courseSlug)) {
    if (!merged.some((item) => item.author === review.author && item.title === review.title)) merged.push(review);
  }
  return merged;
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

function hoursLabel(seconds: number) {
  const hours = seconds / 3600;
  return hours >= 10 ? `${Math.round(hours)} ore` : `${hours.toFixed(1).replace(".", ",")} ore`;
}

export default async function PachetPage({ params }: Props) {
  const { slug } = await params;
  const pachet = getPachet(slug);
  if (!pachet) notFound();

  const [course, globalSummary, categories, pricing, reviews, examDetails] = await Promise.all([
    getCourse(pachet.courseSlug),
    getGrileGlobalSummary(),
    getGrileCategories(),
    getPublicPricing(),
    getCourseReviews(pachet.courseSlug),
    Promise.all(
      pachet.grileSlugs.map(async (grileSlug) => ({
        grileSlug,
        sources: (await getGrileCategoryDetails(grileSlug, "sources"))?.sources ?? [],
        chapters: ((await getGrileCategoryDetails(grileSlug, "chapters"))?.chapters ?? []).filter(
          (chapter) => chapter.total_questions > 0,
        ),
      })),
    ),
  ]);
  const bundlePricing = pricing?.bundles.find((bundle) => bundle.code === pachet.offerCode) ?? null;
  const standalonePrice = bundlePricing && bundlePricing.catalog_course_ron > 0 ? bundlePricing.catalog_course_ron : null;
  const testimonials = pachet.testimonialMatch
    ? TESTIMONIALS.filter((testimonial) => pachet.testimonialMatch?.test(testimonial.admission)).slice(0, 6)
    : [];
  const categorySummaries = (
    await Promise.all((categories ?? []).map((category) => getGrileCategorySummary(category.slug)))
  ).filter((summary): summary is GrileCategorySummary => Boolean(summary));
  // Mai intai categoriile examenului, apoi restul, descrescator dupa numarul de grile.
  categorySummaries.sort((a, b) => {
    const aOwn = pachet.grileSlugs.includes(a.category.slug) ? 1 : 0;
    const bOwn = pachet.grileSlugs.includes(b.category.slug) ? 1 : 0;
    return bOwn - aOwn || b.total_questions - a.total_questions;
  });

  const parts = (course?.parts ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  const partStats = parts.map((part) => {
    const videos = part.videos ?? [];
    return {
      id: part.id,
      name: part.name,
      summary: part.short_summary,
      seconds: videos.reduce((sum, video) => sum + Number(video.duration_seconds ?? 0), 0),
      videos: videos.length,
    };
  });
  const courseSeconds = partStats.reduce((sum, part) => sum + part.seconds, 0);
  const courseHours = Math.floor(courseSeconds / 3600);
  const courseLessons = partStats.reduce((sum, part) => sum + part.videos, 0);
  const totalGrile = globalSummary?.total_questions ?? categorySummaries.reduce((sum, item) => sum + item.total_questions, 0);
  const totalVideo = globalSummary?.total_with_video ?? 0;
  const ownGrile = categorySummaries
    .filter((summary) => pachet.grileSlugs.includes(summary.category.slug))
    .reduce((sum, summary) => sum + summary.total_questions, 0);
  const courseName = course?.h1 || course?.name || "Cursul video";
  const primaryGrilePath = grileExamPath(pachet.grileSlugs[0]);

  const faq = [
    {
      q: "Ce primesc exact cu un abonament de grile?",
      a: `Acces la toate cele ${formatRoNumber(totalGrile)} de grile de pe platformă, de la toate admiterile și Bac, nu doar la cele pentru ${pachet.grileExamPhrase}. La fiecare grilă ai indicație, explicație pas cu pas și, pentru ${formatRoNumber(totalVideo)} dintre ele, rezolvare video. Poți rezolva pe surse, pe capitole sau în modul Examen, cu cronometru.`,
    },
    {
      q: "Ce înseamnă pachetul complet?",
      a: `Abonamentul de grile până la 1 August 2027 plus ${courseName}, tot până la 1 August 2027. Plătești o singură dată și ai tot ce-ți trebuie până după examen.`,
    },
    {
      q: "Pot cumpăra doar cursul?",
      a: "Da. Cursul separat se cumpără de pe pagina lui, cu acces 12 luni, pe părți sau complet. Dacă vrei și grilele, pachetul complet iese mult mai avantajos.",
    },
    {
      q: "Cum funcționează testul gratuit de 24 de ore?",
      a: "Îți creezi cont, confirmi numărul de telefon prin SMS și primești 24 de ore acces la toate grilele și la toate cursurile video. Nu ceri card. Testul se poate activa o singură dată per număr de telefon.",
    },
    {
      q: "Cum plătesc și primesc factură?",
      a: "Plata se face online, securizat, prin Revolut (card sau Apple/Google Pay). Accesul se activează imediat, iar factura fiscală SmartBill îți vine automat pe email.",
    },
    {
      q: "Am deja abonament. Ce se întâmplă dacă mai cumpăr unul?",
      a: "Perioada nouă se adaugă peste cea rămasă, nu pierzi nicio zi.",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--glow-yellow),_var(--glow-sky)_35%,_var(--glow-sky-deep)_75%)]">
      {/* Hero */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-30px_rgba(2,132,199,0.5)] backdrop-blur-sm sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
          <div className="relative">
            <Breadcrumbs
              items={[
                { name: "Acasă", path: "/" },
                { name: "Pachete", path: "/pachete" },
                { name: pachet.label, path: pachetPath(pachet.slug) },
              ]}
            />
            <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">{pachet.eyebrow}</p>
            <h1 className="mt-2 max-w-4xl text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">{pachet.h1}</h1>
            <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-slate-700 sm:text-lg">{pachet.lede}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={`#${PACHET_PRICING_ANCHOR}`}
                className="rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-900 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-900/20 ring-1 ring-yellow-300/60 transition hover:brightness-110"
              >
                Vezi prețurile
              </a>
              <a
                href={`#${PACHET_TRIAL_ANCHOR}`}
                className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3 text-sm font-extrabold text-slate-900 transition hover:from-amber-100 hover:to-yellow-100"
              >
                Testează gratuit 24h
              </a>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              24 de ore de acces gratuit la toate grilele și toate cursurile. Fără card, activare prin cont și SMS.
            </p>
            <dl className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { value: formatRoNumber(totalGrile), label: "grile, toate examenele" },
                { value: formatRoNumber(totalVideo), label: "rezolvări video la grile" },
                { value: `${courseHours}+`, label: "ore de curs video" },
                { value: formatRoNumber(courseLessons), label: "lecții în curs" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3.5">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">{stat.value}</dd>
                  <dd className="mt-0.5 text-xs font-semibold text-slate-600">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Ce primesti */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pb-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_14px_50px_-28px_rgba(3,105,161,0.45)] sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Platforma de grile</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-sky-950">Grilele tuturor examenelor, într-un singur abonament</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {ownGrile > 0 ? (
                <>
                  <strong className="text-sky-950">{formatRoNumber(ownGrile)} de grile</strong> sunt din subiectele pentru{" "}
                  {pachet.grileExamPhrase}. Restul le primești bonus: exersezi și pe stilul celorlalte examene.
                </>
              ) : (
                "Exersezi pe subiectele reale ale tuturor examenelor de informatică."
              )}
            </p>
            {pachet.grileScopeNote ? (
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-slate-700">
                {pachet.grileScopeNote}
              </p>
            ) : null}
            <ul className="mt-5 divide-y divide-sky-100 overflow-hidden rounded-2xl border border-sky-100">
              {categorySummaries.map((summary) => {
                const own = pachet.grileSlugs.includes(summary.category.slug);
                return (
                  <li
                    key={summary.category.slug}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${own ? "bg-amber-50/80" : "bg-white"}`}
                  >
                    <Link href={grileExamPath(summary.category.slug)} className="font-semibold text-sky-950 hover:underline">
                      {summary.category.name}
                      {own ? (
                        <span className="ml-2 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                          examenul tău
                        </span>
                      ) : null}
                    </Link>
                    <span className="shrink-0 text-slate-600">
                      {formatRoNumber(summary.total_questions)} grile
                      {summary.total_with_video > 0 ? ` · ${formatRoNumber(summary.total_with_video)} video` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-5 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
              {[
                "Indicație înainte de răspuns",
                "Explicație pas cu pas la fiecare grilă",
                "Rezolvări video filmate de Paul",
                "Mod Examen: subiect întreg, pe timp",
              ].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden className="text-emerald-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_14px_50px_-28px_rgba(3,105,161,0.45)] sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Cursul video</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-sky-950">{courseName}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {courseHours}+ ore de lecții video, de la bazele limbajului până la subiectele de examen rezolvate integral. Îl primești
              în pachetul complet.
            </p>
            {partStats.length > 0 ? (
              <ol className="mt-5 space-y-2.5">
                {partStats.map((part, index) => (
                  <li key={part.id} className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sky-950">{part.name}</p>
                      <p className="text-xs text-slate-600">
                        {part.videos} lecții · {hoursLabel(part.seconds)}
                        {part.summary ? ` · ${part.summary}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
            <Link
              href={`/cursuri/${pachet.courseSlug}`}
              className="mt-5 inline-flex text-sm font-bold text-sky-800 hover:underline"
            >
              Vezi programa completă și lecțiile gratuite →
            </Link>
          </article>
        </div>
      </section>

      <PachetReviews courseName={course?.name ?? courseName} reviews={reviews} />

      {/* Preturi */}
      <section id={PACHET_PRICING_ANCHOR} className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-4 pb-10 pt-8 sm:px-6">
        <div className="mb-7 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Prețuri</p>
          <h2 className="mt-1.5 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">Alege cum te pregătești</h2>
        </div>
        {pricing ? (
        <PachetPricing
          pricing={pricing}
          pachetSlug={pachet.slug}
          pachetLabel={pachet.label}
          offerCode={pachet.offerCode}
          courseSlug={pachet.courseSlug}
          courseName={courseName}
          courseHours={courseHours}
          courseLessons={courseLessons}
          courseStandalonePriceRon={standalonePrice}
          totalGrile={totalGrile}
          primaryGrilePath={primaryGrilePath}
        />
        ) : (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-center text-sm font-semibold text-rose-800">
            Nu am putut încărca prețurile acum. Reîncarcă pagina în câteva secunde.
          </p>
        )}
      </section>

      <PachetTestimonials testimonials={testimonials} heading={pachet.testimonialsHeading} />

      {/* Cum functioneaza */}
      <section aria-labelledby="cum-functioneaza" className="mx-auto w-full max-w-[1280px] px-4 pb-4 pt-6 sm:px-6">
        <h2 id="cum-functioneaza" className="text-center text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
          Cum funcționează
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Activezi 24h gratuit",
              text: "Îți faci cont și confirmi telefonul prin SMS. Fără card, durează un minut.",
              href: `#${PACHET_TRIAL_ANCHOR}`,
              cta: "Activează 24h",
            },
            {
              title: "Explorezi tot",
              text: "Toate grilele, cu indicații, explicații și rezolvări video, simulări pe timp și toate cursurile video.",
              href: `#${PACHET_TRIAL_ANCHOR}`,
              cta: "Începe gratuit",
            },
            {
              title: "Alegi cum continui",
              text: "Abonament de grile sau pachetul complet cu cursul. Plată unică prin Revolut, factură pe email.",
              href: `#${PACHET_PRICING_ANCHOR}`,
              cta: "Vezi prețurile",
            },
          ].map((step, index) => (
            <li key={step.title} className="flex flex-col rounded-3xl border border-sky-200/80 bg-white/90 p-5 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-3 text-lg font-black text-sky-950">{step.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
              <a href={step.href} className="mt-3 text-sm font-bold text-sky-800 hover:underline">
                {step.cta} →
              </a>
            </li>
          ))}
        </ol>
      </section>


      {/* Subiecte si capitole (continut preluat din fostele ghiduri /admitere-informatica) */}
      {examDetails.some((item) => item.sources.length > 0) ? (
        <section aria-labelledby="subiecte-heading" className="mx-auto w-full max-w-[1280px] px-4 pb-10 sm:px-6">
          <div className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_14px_50px_-28px_rgba(3,105,161,0.45)] sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Subiecte reale</p>
            <h2 id="subiecte-heading" className="mt-1.5 text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
              Subiectele pentru {pachet.grileExamPhrase}, rezolvate ca grile
            </h2>
            {examDetails.map((item) => {
              const categoryName =
                categorySummaries.find((summary) => summary.category.slug === item.grileSlug)?.category.name ?? item.grileSlug;
              const groups = groupSources(item.sources, item.grileSlug);
              if (groups.length === 0) return null;
              return (
                <div key={item.grileSlug} className="mt-6">
                  {examDetails.length > 1 ? <h3 className="text-lg font-black text-sky-950">{categoryName}</h3> : null}
                  <p className="mt-1 text-sm text-slate-600">
                    {item.sources.length} surse, fiecare rezolvabilă grilă cu grilă sau ca simulare pe timp, cu notă.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {groups.map(([tag, sources], index) => (
                      <details key={tag} open={index < 2} className="group rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black text-sky-950">
                          <span>{tag}</span>
                          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sky-800">{sources.length}</span>
                        </summary>
                        <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                          {sources.map((source) => (
                            <li key={source.id} className="flex items-baseline justify-between gap-3 border-t border-sky-100 pt-1.5">
                              <span>{source.name}</span>
                              <span className="shrink-0 text-xs text-slate-500">{source.total_questions} grile</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                  {item.chapters.length > 0 ? (
                    <>
                      <p className="mt-5 text-sm font-bold text-sky-950">Pe capitole</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {item.chapters.map((chapter) => (
                          <li
                            key={chapter.id}
                            className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
                          >
                            {chapter.name} <span className="text-slate-500">· {chapter.total_questions}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <Link
                    href={grileExamPath(item.grileSlug)}
                    className="mt-4 inline-flex text-sm font-bold text-sky-800 hover:underline"
                  >
                    Vezi toate grilele {categoryName} →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="mx-auto w-full max-w-[900px] px-4 pb-10 sm:px-6">
        <h2 className="text-center text-2xl font-black tracking-tight text-sky-950">Întrebări frecvente</h2>
        <div className="mt-6 space-y-3">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-sky-100 bg-white/90 px-5 py-4 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-sky-950">
                {item.q}
                <span aria-hidden className="text-sky-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Alte pachete */}
      <nav aria-label="Alte pachete" className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-sky-100 bg-white/80 p-5 sm:p-6">
          <h2 className="text-base font-black text-sky-950">Te pregătești pentru alt examen?</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {PACHETE.filter((item) => item.slug !== pachet.slug).map((item) => (
              <li key={item.slug}>
                <Link
                  href={pachetPath(item.slug)}
                  className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-amber-50"
                >
                  Pachete {item.label}
                </Link>
              </li>
            ))}
            {pachet.guidePath ? (
              <li>
                <Link
                  href={pachet.guidePath}
                  className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-amber-100"
                >
                  Detalii despre examen →
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </nav>
      <PachetStickyCta />
    </main>
  );
}
