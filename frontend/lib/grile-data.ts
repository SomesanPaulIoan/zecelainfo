import { apiFetch } from "@/lib/api";
import type { GrileItem } from "@/lib/grile-sources";

/**
 * Fetch-uri publice folosite de paginile randate pe server (SEO).
 * Toate intorc `null` la eroare ca pagina sa se poata randa si fara backend.
 */

export type GrileCategory = { id: string; slug: string; name: string };

export type GrileCategorySummary = {
  category: GrileCategory;
  total_questions: number;
  total_with_video: number;
  total_with_hint: number;
  total_with_explanation: number;
};

export type GrileCategoryDetails = {
  category: GrileCategory;
  view: "sources" | "chapters";
  sources: GrileItem[];
  chapters: GrileItem[];
};

export type GrileGlobalSummary = {
  total_questions: number;
  total_with_video: number;
  total_with_hint: number;
  total_with_explanation: number;
  total_with_hint_and_explanation: number;
  total_with_hint_ai: number;
  total_with_explanation_ai: number;
  total_sources?: number;
  total_chapters?: number;
  total_correct_attempts: number;
  total_attempts: number;
  users_with_active_premium: number;
};

export type CourseVideo = {
  id: string;
  title: string;
  duration_seconds: number | null;
  sort_order: number;
  is_free_preview: boolean;
  vimeo_id: string;
};

export type CoursePart = {
  id: string;
  name: string;
  short_summary: string | null;
  order_index: number;
  hours?: number | null;
  price?: string | number | null;
  videos?: CourseVideo[];
};

export type CourseSummary = {
  id: string;
  slug: string;
  name: string;
  h1?: string | null;
  hook: string | null;
  image_url: string | null;
  price: string | number | null;
  sale_price: string | number | null;
  currency: string;
  parts_count: number | null;
  hours_total: number | null;
  parts?: CoursePart[];
};

async function safe<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch {
    return null;
  }
}

export async function getGrileCategories(): Promise<GrileCategory[] | null> {
  const response = await safe<{ data: GrileCategory[] }>("/api/grile/categories");
  return response?.data ?? null;
}

export async function getGrileCategorySummary(slug: string): Promise<GrileCategorySummary | null> {
  const response = await safe<{ data: GrileCategorySummary }>(`/api/grile/categories/${encodeURIComponent(slug)}/summary`);
  return response?.data ?? null;
}

export async function getGrileCategoryDetails(slug: string, view: "sources" | "chapters"): Promise<GrileCategoryDetails | null> {
  const response = await safe<{ data: GrileCategoryDetails }>(`/api/grile/categories/${encodeURIComponent(slug)}?view=${view}`);
  return response?.data ?? null;
}

export async function getGrileGlobalSummary(): Promise<GrileGlobalSummary | null> {
  const response = await safe<{ data: GrileGlobalSummary }>("/api/grile/summary");
  return response?.data ?? null;
}

export async function getCourses(): Promise<CourseSummary[] | null> {
  const response = await safe<{ data: CourseSummary[] }>("/api/courses");
  return response?.data ?? null;
}

export async function getCourse(slug: string): Promise<CourseSummary | null> {
  const response = await safe<{ data: CourseSummary }>(`/api/courses/${encodeURIComponent(slug)}`);
  return response?.data ?? null;
}

/** Statistici derivate dintr-un curs: numar video, durata totala si cel mai mic pret pe parte. */
export function courseStats(course: CourseSummary) {
  const parts = Array.isArray(course.parts) ? course.parts : [];
  const videos = parts.flatMap((part) => (Array.isArray(part.videos) ? part.videos : []));
  const totalSeconds = videos.reduce((sum, video) => sum + Number(video.duration_seconds ?? 0), 0);
  const partHours = parts.reduce((sum, part) => sum + Number(part.hours ?? 0), 0);
  const hours = totalSeconds > 0 ? totalSeconds / 3600 : partHours > 0 ? partHours : Number(course.hours_total ?? 0);
  const partPrices = parts.map((part) => Number(part.price)).filter((value) => Number.isFinite(value) && value > 0);
  return {
    partsCount: parts.length || Number(course.parts_count ?? 0),
    videosCount: videos.length,
    freePreviewCount: videos.filter((video) => video.is_free_preview).length,
    hours: Math.round(hours),
    lowestPartPrice: partPrices.length > 0 ? Math.min(...partPrices) : null,
  };
}
