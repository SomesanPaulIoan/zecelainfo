import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpenCheck, Lightbulb, ListChecks, PlayCircle, Timer } from "lucide-react";
import { HomeAuthPrompt } from "@/components/home/HomeAuthPrompt";
import { InstructorBioParagraphs } from "@/components/marketing/InstructorBioParagraphs";
import { TESTIMONIALS, TestimonialCard } from "@/components/meditatii/StudentTestimonials";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ADMISSION_LANDINGS, TARGET_EXAM_YEAR, grileExamPath } from "@/lib/exams";
import { courseStats, getCourses, getGrileCategorySummary, getGrileGlobalSummary } from "@/lib/grile-data";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Admitere Informatică și Bac ${TARGET_EXAM_YEAR} – Grile, Cursuri și Meditații | Zece la Info`,
  absoluteTitle: true,
  description:
    "Pregătire pentru Bacalaureat și admiterea la Informatică (UBB, UB, Politehnica, Iași): mii de grile cu explicații video, cursuri complete, simulări de examen și meditații.",
  path: "/",
});

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  stats: string[];
};

function FeatureCard({ title, description, href, stats }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-[0_16px_40px_-28px_rgba(2,132,199,0.45)] transition duration-300 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_24px_70px_-32px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full bg-amber-300/25 blur-2xl transition group-hover:bg-amber-300/35" />
      <h3 className="relative text-lg font-black text-sky-950">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {stats.map((stat) => (
          <span
            key={stat}
            className="rounded-full border border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-100 px-2.5 py-1 text-xs font-bold text-slate-700"
          >
            {stat}
          </span>
        ))}
      </div>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">{eyebrow}</p>
      <h2 className="mt-2 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

/** Cate o recenzie per facultate, ca selectia de pe homepage sa acopere toate examenele (fara a modifica textul). */
function pickHomeTestimonials() {
  const picks = ["Alexandra C.", "Andrei R.", "Ana T.", "David R.", "Maria Gabriela A.", "Daniella K."];
  return picks
    .map((name) => TESTIMONIALS.find((testimonial) => testimonial.name === name))
    .filter((testimonial): testimonial is (typeof TESTIMONIALS)[number] => Boolean(testimonial));
}

export default async function Home() {
  const [globalSummary, courses, bacSummary, ...landingSummaries] = await Promise.all([
    getGrileGlobalSummary(),
    getCourses(),
    getGrileCategorySummary("bacalaureat"),
    ...ADMISSION_LANDINGS.map((landing) => getGrileCategorySummary(landing.grileSlug)),
  ]);

  const courseList = courses ?? [];
  const courseHoursTotal = courseList.reduce((sum, course) => sum + courseStats(course).hours, 0);
  const grileTotal = globalSummary?.total_questions ?? 0;
  const videoTotal = globalSummary?.total_with_video ?? 0;
  const aiTotal = globalSummary?.total_with_hint_and_explanation ?? 0;
  const correctAttempts = globalSummary?.total_correct_attempts ?? 0;

  const heroStats = [
    grileTotal > 0 ? { value: formatRoNumber(grileTotal), label: "grile de informatică" } : null,
    videoTotal > 0 ? { value: formatRoNumber(videoTotal), label: "explicații video" } : null,
    courseHoursTotal > 0 ? { value: `${formatRoNumber(courseHoursTotal)}+`, label: "ore de curs video" } : null,
    correctAttempts > 0 ? { value: formatRoNumber(correctAttempts), label: "grile rezolvate corect de elevi" } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  const examCards = [
    ...ADMISSION_LANDINGS.map((landing, index) => ({
      key: landing.key,
      title: landing.title,
      institutions: landing.institutions.join(" • "),
      href: landing.path,
      trialPath: `${landing.path}?activeaza=1#test-gratuit`,
      grilePath: grileExamPath(landing.grileSlug),
      coursePath: `/cursuri/${landing.courseSlug}`,
      summary: landingSummaries[index],
    })),
    {
      key: "bac",
      title: "Bacalaureat Informatică",
      institutions: "Proba de informatică, profil Mate-Info",
      href: "/bacalaureat",
      trialPath: "/pachete/bacalaureat?activeaza=1#test-gratuit",
      grilePath: grileExamPath("bacalaureat"),
      coursePath: "/cursuri/curs-bacalaureat-informatica-mi",
      summary: bacSummary,
    },
  ];

  const testimonials = pickHomeTestimonials();

  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        {/* HERO */}
        <section className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/95 px-3 py-1 text-xs font-extrabold tracking-wide text-sky-900">
            BAC + ADMITERE LA INFORMATICĂ · {TARGET_EXAM_YEAR}
          </span>
          <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-sky-950 sm:text-6xl">
            Tot ce ai nevoie pentru Bac și Admiterea la Informatică.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg font-medium leading-relaxed text-slate-600 sm:text-xl">
            Mii de grile, explicații video și cursuri complete pentru UBB, Universitatea din București, Politehnica, Iași și
            Bacalaureat. Testează gratuit 24 de ore toată platforma și descoperă cum să te pregătești mai eficient.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="#examene" size="lg">
              Activează gratuit 24h
            </ButtonLink>
            <ButtonLink href="/pachete" variant="secondary" size="lg">
              Vezi pachetele și prețurile
            </ButtonLink>
          </div>
          <ul className="mx-auto mt-5 grid max-w-2xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
            <li className="rounded-2xl border border-sky-200/80 bg-white/90 px-4 py-3">
              <strong className="text-sky-950">Acces la tot:</strong> toate grilele, cu indicații, explicații și video, plus toate
              cursurile.
            </li>
            <li className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3">
              <strong className="text-sky-950">24 de ore de acces complet gratuit.</strong> Fără card. Activare prin cont și
              verificare SMS.
            </li>
          </ul>

          {heroStats.length > 0 ? (
            <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="flex flex-col rounded-2xl border border-sky-200/80 bg-white/90 px-4 py-4 shadow-sm">
                  <dt className="order-2 text-xs font-semibold leading-snug text-slate-600 sm:text-sm">{stat.label}</dt>
                  <dd className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        {/* EXAMENE */}
        <section id="examene" className="mt-20 scroll-mt-24" aria-labelledby="examene-heading">
          <div id="examene-heading">
            <SectionHeading
              eyebrow="Alege examenul"
              title="Pregătire dedicată fiecărui examen"
              subtitle="Subiectele reale din anii trecuți, cursul potrivit și simulări pe timp — separat pentru fiecare facultate."
            />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examCards.map((card) => (
              <article
                key={card.key}
                className="flex flex-col overflow-hidden rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 shadow-[0_16px_40px_-28px_rgba(2,132,199,0.45)] transition hover:border-yellow-300"
              >
                <h3 className="text-xl font-black text-sky-950">
                  <Link href={card.href} className="hover:underline">
                    {card.title}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-slate-600">{card.institutions}</p>
                {card.summary ? (
                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    {formatRoNumber(card.summary.total_questions)} grile
                    {card.summary.total_with_video > 0 ? ` · ${formatRoNumber(card.summary.total_with_video)} cu video` : ""}
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Link
                    href={card.trialPath}
                    className="inline-flex min-h-10 items-center rounded-xl bg-sky-700 px-3 text-sm font-bold text-white hover:bg-sky-600"
                  >
                    24h gratuit
                  </Link>
                  <Link
                    href={card.grilePath}
                    className="inline-flex min-h-10 items-center rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-slate-900 hover:bg-amber-100"
                  >
                    Grile
                  </Link>
                  <Link
                    href={card.coursePath}
                    className="inline-flex min-h-10 items-center rounded-xl border border-sky-200 bg-white px-3 text-sm font-bold text-sky-900 hover:bg-sky-50"
                  >
                    Curs
                  </Link>
                  <Link href={card.href} className="inline-flex min-h-10 items-center px-1 text-sm font-bold text-sky-700 hover:underline">
                    {card.key === "bac" ? "Totul despre Bac" : "Vezi pachetele"} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* DE CE */}
        <section className="mt-20 overflow-hidden rounded-[2rem] border border-sky-200/80 bg-sky-950 p-6 text-white shadow-[0_20px_64px_-34px_rgba(2,132,199,0.6)] sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300">De ce Zece la Info</p>
            <h2 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-4xl">
              Nu doar vezi că ai greșit. Înțelegi de ce ai greșit.
            </h2>
            <p className="mt-3 text-pretty text-base text-sky-100">
              {videoTotal > 0 && grileTotal > 0
                ? `${formatRoNumber(videoTotal)} din cele ${formatRoNumber(grileTotal)} de grile au rezolvare video filmată de Paul. `
                : ""}
              Fiecare greșeală devine o lecție: primești indicația, explicația pas cu pas și, unde există, video-ul cu rezolvarea.
            </p>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Lightbulb,
                title: "Indicații înainte de răspuns",
                text: "Te blochezi? Cere o indicație și încearcă din nou, fără să vezi direct soluția.",
              },
              {
                icon: ListChecks,
                title: "Explicații pas cu pas",
                text: aiTotal > 0 ? `${formatRoNumber(aiTotal)} de grile au indicații și explicații scrise.` : "Explicații scrise pentru grile.",
              },
              {
                icon: PlayCircle,
                title: "Rezolvări video",
                text: "Paul rezolvă grila și explică raționamentul, nu doar răspunsul.",
              },
              {
                icon: Timer,
                title: "Simulări de examen",
                text: "Modul „Examen”: rezolvi un subiect întreg pe timp și primești nota la final.",
              },
            ].map((item) => (
              <li key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <item.icon aria-hidden="true" className="h-6 w-6 text-amber-300" />
                <h3 className="mt-3 text-base font-black">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-sky-100">{item.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/grile" size="lg">
              Încearcă grilele
            </ButtonLink>
          </div>
        </section>

        {/* PLATFORMA */}
        <section className="mt-20">
          <SectionHeading eyebrow="Platforma" title="Tot ce găsești pe Zece la Info" />
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FeatureCard
              title="Grile de informatică"
              description="Subiectele reale de admitere și Bac, transformate în grile cu indicații, explicații și rezolvări video."
              href="/grile"
              stats={[
                `${formatRoNumber(grileTotal)} grile`,
                `${formatRoNumber(videoTotal)} cu explicații video`,
                "Simulări cu notă",
              ]}
            />
            <FeatureCard
              title="Cursuri video"
              description="Cursuri complete de pregătire pentru examenele de la finalul clasei a XII-a, cu toată materia și subiectele rezolvate, filmate de Paul-Ioan Someșan."
              href="/cursuri"
              stats={[
                `${courseList.length} cursuri`,
                ...(courseHoursTotal > 0 ? [`${formatRoNumber(courseHoursTotal)}+ ore de curs`] : []),
                "Bac · UBB · UB · UNSTPB · UAIC · TU Iași",
              ]}
            />
            <FeatureCard
              title="Probleme"
              description="Probleme de informatică pe capitole, cu editor, compilator online și evaluare automată a soluției."
              href="/problems"
              stats={["Editor și compilator online", "Evaluare automată", "Indicații de rezolvare"]}
            />
            <FeatureCard
              title="Meditații"
              description="Meditații cu Paul-Ioan Someșan în grupe de maximum 5 elevi, pentru admitere și Bac."
              href="/meditatii"
              stats={["Maxim 5 elevi / grupă", "Bacalaureat", "Admitere UBB / UB / UNSTPB / UAIC / TU Iași"]}
            />
            <FeatureCard
              title="Subiecte de Bac"
              description="Rezolvi subiecte de Bac pe timp, încarci PDF-ul și primești feedback în maximum 7 zile."
              href="/bacalaureat"
              stats={["Rezolvare cronometrată", "Upload PDF", "Feedback în 7 zile", "Video explicativ"]}
            />
            <FeatureCard
              title="Compilator online"
              description="Scrii și rulezi cod C++, C, Pascal sau Python direct din browser, fără nicio instalare."
              href="/compilator"
              stats={["C++ · C · Pascal · Python", "Fără instalare"]}
            />
          </div>
        </section>

        {/* TESTIMONIALE */}
        {testimonials.length > 0 ? (
          <section className="mt-20">
            <SectionHeading
              eyebrow="Rezultate reale"
              title="Elevi admiși după pregătirea cu Paul"
              subtitle="Recenzii lăsate de elevii de la meditații, admiși la UBB, UB și Politehnica București."
            />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
              ))}
            </div>
            <p className="mt-6 text-center">
              <Link href="/meditatii" className="text-sm font-bold text-sky-800 underline-offset-4 hover:underline">
                Vezi toate cele {TESTIMONIALS.length} recenzii →
              </Link>
            </p>
          </section>
        ) : null}

        {/* PROFESOR */}
        <section className="mt-20 overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_20px_64px_-34px_rgba(2,132,199,0.45)] sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">Profesorul tău de informatică</p>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm lg:mx-0 lg:max-w-none">
              <Image
                src="/cursuri-images/autor-paul-ioan-somesan.png?v=3"
                alt="Paul-Ioan Someșan, fondatorul Zece la Info"
                fill
                sizes="(max-width: 1024px) 260px, 240px"
                className="object-cover object-center"
              />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">Paul-Ioan Someșan</h2>
              <p className="mt-1 text-sm font-extrabold text-blue-700 sm:text-base">Fondatorul platformei Zece la Info</p>
              <InstructorBioParagraphs className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700" />
              <blockquote className="mt-4 rounded-2xl border-l-4 border-sky-600 bg-sky-50/70 px-4 py-3 text-sm font-semibold italic text-slate-800">
                Cred ca educatia trebuie sa fie logica, accesibila si inspirata din realitate. Scopul meu este ca fiecare elev sa
                inteleaga, nu doar sa memoreze.
              </blockquote>
            </div>
          </div>
        </section>

        <HomeAuthPrompt />

        {/* CTA FINAL */}
        <section className="mt-16 rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 text-center sm:p-10">
          <BookOpenCheck aria-hidden="true" className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="mt-3 text-balance text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">
            Începe cu o grilă. Vezi diferența din prima explicație.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-700">
            24 de ore de acces complet gratuit. Fără card. Activare prin cont și verificare SMS.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="#examene" size="lg">
              Activează gratuit 24h
            </ButtonLink>
            <ButtonLink href="/pachete" variant="secondary" size="lg">
              Vezi pachetele și prețurile
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}
