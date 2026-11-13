import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseWorkspace } from "@/components/cursuri/CourseWorkspace";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { apiFetch } from "@/lib/api";
import { ADMISSION_LANDINGS, EXAMS, grileExamPath } from "@/lib/exams";
import { breadcrumbJsonLd, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

function courseHours(parts: CourseDetailResponse["data"]["parts"]): number {
  const seconds = parts.reduce(
    (sum, part) => sum + (part.videos ?? []).reduce((acc, video) => acc + Number(video.duration_seconds ?? 0), 0),
    0,
  );
  return Math.round(seconds / 3600);
}

/** Oferta pentru Course schema: pretul cursului daca e setat, altfel intervalul de preturi pe parti (fara „0 RON” fals). */
function courseOffer(course: CourseDetailResponse["data"], url: string) {
  const currency = course.currency || "RON";
  const coursePrice = Number(course.sale_price ?? course.price);
  if (Number.isFinite(coursePrice) && coursePrice > 0) {
    return { "@type": "Offer", category: "Paid", price: String(coursePrice), priceCurrency: currency, url };
  }
  const partPrices = course.parts.map((part) => Number(part.sale_price ?? part.price)).filter((value) => Number.isFinite(value) && value > 0);
  if (partPrices.length === 0) return undefined;
  return {
    "@type": "AggregateOffer",
    category: "Paid",
    lowPrice: String(Math.min(...partPrices)),
    highPrice: String(partPrices.reduce((sum, value) => sum + value, 0)),
    offerCount: partPrices.length,
    priceCurrency: currency,
    url,
  };
}

export const dynamic = "force-dynamic";

type CourseDetailResponse = {
  data: {
    slug?: string;
    h1?: string | null;
    name: string;
    hook: string | null;
    author_name: string | null;
    image_url: string | null;
    preview_video_vimeo_id?: string | null;
    preview_video_url?: string | null;
    level?: string | null;
    format?: string | null;
    language?: string | null;
    price?: string | number | null;
    sale_price?: string | number | null;
    currency?: string;
    parts_count?: number | null;
    hours_total?: number | null;
    target_audience: string | null;
    content_summary: string | null;
    requirements: string | null;
    outcomes: string | null;
    bonuses: string | null;
    content_html: string | null;
    resources_url?: string | null;
    parts: Array<{
      id: string;
      name: string;
      short_summary: string | null;
      order_index: number;
      hours: number | null;
      price: string | number | null;
      sale_price: string | number | null;
      currency: string;
      videos: Array<{
        id: string;
        title: string;
        duration_seconds: number | null;
        sort_order: number;
        is_free_preview: boolean;
        vimeo_id: string;
      }>;
    }>;
  };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await apiFetch<CourseDetailResponse>(`/api/courses/${encodeURIComponent(slug)}`);
    const course = response.data;
    const title = course.h1 || course.name;
    const description = course.hook || course.content_summary || `${course.name} — curs video de informatică pe Zece la Info.`;
    const canonicalSlug = course.slug ?? slug;
    return pageMetadata({
      title,
      description,
      path: `/cursuri/${canonicalSlug}`,
      images: course.image_url ? [course.image_url] : undefined,
    });
  } catch {
    return {};
  }
}

export default async function CursDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let course: CourseDetailResponse["data"];
  try {
    const response = await apiFetch<CourseDetailResponse>(`/api/courses/${encodeURIComponent(slug)}`);
    course = response.data;
  } catch {
    notFound();
  }
  const canonicalSlug = course.slug ?? slug;
  const courseUrl = `${SITE_URL}/cursuri/${canonicalSlug}`;
  const hours = courseHours(course.parts);
  const offer = courseOffer(course, courseUrl);
  const relatedExams = EXAMS.filter((exam) => exam.courseSlug === canonicalSlug);
  // UB si UNSTPB au acelasi curs si aceeasi pagina de pachete: pastram un singur link per pagina.
  const relatedLandings = ADMISSION_LANDINGS.filter(
    (landing, index, all) =>
      landing.courseSlug === canonicalSlug && all.findIndex((item) => item.path === landing.path) === index,
  );
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.h1 || course.name,
          description: course.hook || course.content_summary || course.name,
          url: courseUrl,
          image: course.image_url ? new URL(course.image_url, SITE_URL).toString() : undefined,
          inLanguage: "ro",
          provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          ...(course.author_name ? { creator: { "@type": "Person", name: course.author_name } } : {}),
          ...(offer ? { offers: offer } : {}),
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "Online",
            ...(hours > 0 ? { courseWorkload: `PT${hours}H` } : {}),
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Acasă", path: "/" },
          { name: "Cursuri", path: "/cursuri" },
          { name: course.h1 || course.name, path: `/cursuri/${canonicalSlug}` },
        ])}
      />
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center bg-sky-50/50 p-8 text-sm font-medium text-slate-600">
            Se incarca cursul...
          </div>
        }
      >
        <CourseWorkspace course={{ ...course, slug: canonicalSlug }} />
      </Suspense>
      {relatedExams.length > 0 ? (
        <nav aria-label="Exersează după curs" className="border-t border-sky-100 bg-sky-50/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <h2 className="text-lg font-black text-sky-950">Exersează ce înveți în curs</h2>
            <p className="mt-1 text-sm text-slate-600">
              Subiectele din anii trecuți, rezolvate ca grile, cu explicații și video.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {relatedExams.map((exam) => (
                <li key={exam.grileSlug}>
                  <Link
                    href={grileExamPath(exam.grileSlug)}
                    className="inline-flex min-h-10 items-center rounded-full border border-amber-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-amber-50"
                  >
                    Grile {exam.grileLabel}
                  </Link>
                </li>
              ))}
              {relatedLandings.map((landing) => (
                <li key={landing.key}>
                  <Link
                    href={landing.path}
                    className="inline-flex min-h-10 items-center rounded-full border border-sky-200 bg-white px-4 text-sm font-bold text-sky-900 hover:bg-sky-50"
                  >
                    Pachete și prețuri
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </>
  );
}
