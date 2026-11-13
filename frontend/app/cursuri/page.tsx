import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TrialCtaCard } from "@/components/trial/TrialCtaCard";
import { TARGET_EXAM_YEAR } from "@/lib/exams";
import { pageMetadata } from "@/lib/seo";

/** La build Docker nu rulează API-ul; fără asta HTML-ul static rămâne cu eroare „Verifica backend-ul”. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Cursuri Admitere Informatică și Bac ${TARGET_EXAM_YEAR} – Video, Complete`,
  description:
    "Cursuri video complete de informatică pentru Bacalaureat și admiterea la UBB, UB, Politehnica București, UAIC și TU Iași: toată materia și subiectele oficiale rezolvate.",
  path: "/cursuri",
});

type Course = {
  id: string;
  slug: string;
  name: string;
  h1: string | null;
  author_name: string | null;
  image_url: string | null;
  hook: string | null;
  price: string | number | null;
  sale_price: string | number | null;
  currency: string;
  parts_count: number | null;
  hours_total: number | null;
  level: string | null;
  format: string | null;
  language: string | null;
  parts?: CoursePart[];
};

type CoursesResponse = {
  data: Course[];
};

type CoursePart = {
  id: string;
  name: string;
  short_summary: string | null;
  order_index: number;
  price?: string | number | null;
  videos: CourseVideo[];
};

type CourseVideo = {
  id: string;
  title: string;
  duration_seconds: number | null;
  sort_order: number;
  is_free_preview: boolean;
  vimeo_id: string;
};

function formatPrice(value: string | number | null, currency: string) {
  if (value == null) return `0 ${currency}`;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value} ${currency}`;
  return `${numeric.toFixed(0)} ${currency}`;
}

function getLowestPartPrice(parts: CoursePart[]) {
  const prices = parts
    .map((part) => Number(part.price))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export default async function CursuriPage() {
  let courses: Course[] = [];
  let loadError = false;
  try {
    const response = await apiFetch<CoursesResponse>("/api/courses");
    courses = response.data;
  } catch {
    loadError = true;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--glow-sky-haze)_0%,_var(--color-white)_48%,_var(--glow-amber-haze)_100%)]">
      <section className="mx-auto w-full max-w-none px-3 pb-8 pt-10 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_22px_80px_-26px_rgba(14,116,144,0.5)] backdrop-blur">
          <div className="pointer-events-none absolute -left-12 -top-10 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-amber-200/70 blur-3xl" />
          <div className="relative">
            <Breadcrumbs
              items={[
                { name: "Acasă", path: "/" },
                { name: "Cursuri", path: "/cursuri" },
              ]}
            />
          </div>
          <h1 className="relative mt-4 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
            Cursuri de informatică pentru Bac și admitere
          </h1>
          <p className="relative mt-3 max-w-3xl text-pretty text-slate-700">
            Cursuri video complete pentru Bacalaureat și admiterea la facultățile de informatică: toată materia de liceu
            explicată pas cu pas și subiectele oficiale rezolvate. Cursurile de admitere au și lecții gratuite de previzualizare.
          </p>
          <TrialCtaCard className="relative mt-5 max-w-3xl" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-14 sm:px-4 lg:px-6 2xl:px-10">
        {loadError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-700 shadow-sm">
            Nu am putut încărca cursurile acum. Te rugăm să reîncarci pagina în câteva momente.
          </p>
        ) : null}

        {!loadError ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {courses.map((course, index) => {
              const safeParts = Array.isArray(course.parts) ? course.parts : [];
              const videosCount = safeParts.reduce((acc, part) => acc + (Array.isArray(part.videos) ? part.videos.length : 0), 0);
              const lowestPartPrice = getLowestPartPrice(safeParts);
              return (
                <article
                  key={course.id}
                  className="group relative overflow-hidden rounded-[1.7rem] border border-white/85 bg-white/90 shadow-[0_18px_60px_-24px_rgba(14,116,144,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(2,132,199,0.55)]"
                >
                  <div className="pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full bg-sky-100/80 blur-3xl transition group-hover:bg-sky-200/75" />
                  <div className="relative aspect-[16/9] bg-sky-50/60">
                    {course.image_url ? (
                      <Image
                        src={course.image_url}
                        alt={course.name}
                        fill
                        sizes="(max-width: 1280px) 100vw, 640px"
                        className="object-cover"
                        loading={index < 2 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : undefined}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500" aria-hidden="true">Zece la Info</div>
                    )}
                  </div>
                  <div className="relative space-y-3 p-5">
                    <h2 className="text-xl font-extrabold text-sky-950">{course.name}</h2>
                    {course.hook ? <p className="line-clamp-4 text-pretty text-sm text-slate-600">{course.hook}</p> : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                      {course.level ? <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1">{course.level}</span> : null}
                      {course.format ? <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1">{course.format}</span> : null}
                      {course.parts_count ? <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1">{course.parts_count} părți</span> : null}
                      {course.hours_total ? <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1">{course.hours_total} ore</span> : null}
                      <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1">{videosCount} video-uri</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-sky-950">
                          De la {formatPrice(lowestPartPrice ?? course.sale_price ?? course.price, course.currency)}
                        </span>
                      </div>
                      <Link
                        href={`/cursuri/${course.slug}`}
                        aria-label={`Vezi cursul: ${course.name}`}
                        className="inline-flex min-h-10 items-center rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300"
                      >
                        Vezi curs
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
