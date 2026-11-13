import type { MetadataRoute } from "next";
import { PACHETE, pachetPath } from "@/lib/pachete";
import { apiFetch } from "@/lib/api";
import { EXAMS, grileExamPath } from "@/lib/exams";
import { SITE_URL } from "@/lib/seo";

/** La build Docker nu rulează API-ul; fără asta rutele dinamice raman inghetate goale. */
export const dynamic = "force-dynamic";

type GrileCategoriesResponse = { data: Array<{ slug: string }> };
type CoursesResponse = { data: Array<{ slug: string }> };
type ProblemsResponse = { data: { problems: Array<{ slug: string }>; total: number } };
type BacSubjectsResponse = { data: { subjects: Array<{ id: number | string }> } };

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return null;
  }
}

const STATIC_PATHS = [
  "/",
  "/cursuri",
  "/grile",
  "/bacalaureat",
  "/bacalaureat/arhiva-de-subiecte",
  "/problems",
  "/meditatii",
  "/compilator",
  "/pachete",
  ...PACHETE.map((pachet) => pachetPath(pachet.slug)),
  "/politica-de-confidentialitate",
  "/politica-de-cookies",
  "/termeni-si-conditii",
];

// API-ul plafoneaza `limit` la 1000, asa ca luam toate paginile.
async function fetchAllProblemSlugs(): Promise<string[]> {
  const limit = 1000;
  const slugs: string[] = [];
  for (let page = 1; page <= 20; page++) {
    const response = await safeFetch<ProblemsResponse>(`/api/problems/?limit=${limit}&page=${page}`);
    const batch = response?.data.problems ?? [];
    slugs.push(...batch.map((problem) => problem.slug));
    if (batch.length < limit || slugs.length >= (response?.data.total ?? 0)) break;
  }
  return slugs;
}

// Fara `lastModified`: o data falsa („acum” la fiecare cerere) e ignorata de Google si nu aduce nimic.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
  }));

  const [grileCategories, courses, problems, subjects] = await Promise.all([
    safeFetch<GrileCategoriesResponse>("/api/grile/categories"),
    safeFetch<CoursesResponse>("/api/courses/"),
    fetchAllProblemSlugs(),
    safeFetch<BacSubjectsResponse>("/api/bacalaureat/subjects"),
  ]);

  const grileSlugs = grileCategories?.data.map((category) => category.slug) ?? EXAMS.map((exam) => exam.grileSlug);
  const grileRoutes: MetadataRoute.Sitemap = grileSlugs.flatMap((slug) => [
    { url: `${SITE_URL}${grileExamPath(slug)}` },
    { url: `${SITE_URL}${grileExamPath(slug, "chapters")}` },
  ]);

  const courseRoutes: MetadataRoute.Sitemap = (courses?.data ?? []).map((course) => ({
    url: `${SITE_URL}/cursuri/${course.slug}`,
  }));

  const problemRoutes: MetadataRoute.Sitemap = problems.map((slug) => ({
    url: `${SITE_URL}/problems/${slug}`,
  }));

  const subjectRoutes: MetadataRoute.Sitemap = (subjects?.data.subjects ?? []).map((subject) => ({
    url: `${SITE_URL}/bacalaureat/subiect/${subject.id}`,
  }));

  return [...staticRoutes, ...grileRoutes, ...courseRoutes, ...problemRoutes, ...subjectRoutes];
}
