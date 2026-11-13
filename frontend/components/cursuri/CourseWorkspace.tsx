"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, downloadAuthenticatedFile } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { TrialCtaCard } from "@/components/trial/TrialCtaCard";
import { InstructorBioParagraphs } from "@/components/marketing/InstructorBioParagraphs";
import { getStaticCourseReviews, type CourseReview } from "@/lib/course-reviews";
import { track, trackConfirmedPurchase } from "@/lib/track";

function formatPartAccessUntilLabel(accessUntil: string | null | undefined): string | null {
  if (accessUntil == null || accessUntil === "") return null;
  const d = new Date(accessUntil);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

type CourseVideo = {
  id: string;
  title: string;
  duration_seconds: number | null;
  sort_order: number;
  is_free_preview: boolean;
  vimeo_id: string;
};

type CoursePart = {
  id: string;
  name: string;
  short_summary: string | null;
  order_index: number;
  hours: number | null;
  price: string | number | null;
  sale_price: string | number | null;
  currency: string;
  videos: CourseVideo[];
};

type Course = {
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
  parts: CoursePart[];
};


function toEmbedUrl(vimeoId: string) {
  return `https://player.vimeo.com/video/${vimeoId}`;
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${m}m ${s}s`;
}

function formatPrice(value: string | number | null | undefined, currency = "RON") {
  if (value == null) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${numeric.toFixed(0)} ${currency}`;
}

function getLowestPartPrice(parts: CoursePart[]) {
  const values = parts
    .map((part) => Number(part.sale_price ?? part.price))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (values.length === 0) return null;
  return Math.min(...values);
}

function normalizePreviewUrl(course: Course) {
  if (course.preview_video_url && course.preview_video_url.trim().length > 0) return course.preview_video_url.trim();
  if (course.preview_video_vimeo_id && course.preview_video_vimeo_id.trim().length > 0) {
    return toEmbedUrl(course.preview_video_vimeo_id.trim());
  }
  return null;
}

export function CourseWorkspace({ course }: { course: Course }) {
  const { user, loading } = useAuth();
  const allVideos = useMemo(
    () => (course.parts ?? []).flatMap((part) => (Array.isArray(part.videos) ? part.videos : [])),
    [course.parts],
  );
  const totalDurationSeconds = allVideos.reduce((acc, video) => acc + (video.duration_seconds ?? 0), 0);
  const previewVideoUrl = normalizePreviewUrl(course);
  const listedParts = Array.isArray(course.parts) ? course.parts : [];
  const fallbackReviews = getStaticCourseReviews(course.slug ?? "");
  const [publicReviews, setPublicReviews] = useState<CourseReview[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ title: string; vimeo_id: string } | null>(null);
  const [presentationVideoOpen, setPresentationVideoOpen] = useState(false);
  const [access, setAccess] = useState<{
    ownedPartIds: Set<string>;
    /** Parti deblocate doar din trial-ul gratuit de 24h: se pot viziona, dar se pot si cumpara. */
    trialPartIds: Set<string>;
    partAccessUntil: Map<string, string | null>;
    canReview: boolean;
    remaining: { parts_count: number; subtotal: number; discount: number; total: number } | null;
    resourcesZip: { file_name: string | null; size_bytes: number | null; updated_at: string | null } | null;
  }>({
    ownedPartIds: new Set<string>(),
    trialPartIds: new Set<string>(),
    partAccessUntil: new Map(),
    canReview: false,
    remaining: null,
    resourcesZip: null,
  });
  const [accessLoading, setAccessLoading] = useState(false);
  const [downloadingResourcesZip, setDownloadingResourcesZip] = useState(false);
  const [resourcesZipMessage, setResourcesZipMessage] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<null | { mode: "part"; partId: string } | { mode: "remaining" }>(null);
  const [myReview, setMyReview] = useState<{
    author_name: string;
    title: string;
    content: string;
    rating: number;
  } | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [openPartId, setOpenPartId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseHours = formatDuration(totalDurationSeconds) || "-";
  const lowestPartPrice = getLowestPartPrice(listedParts);
  const coursePrice = formatPrice(lowestPartPrice, course.currency || "RON") || formatPrice(course.sale_price ?? course.price, course.currency || "RON");
  const completeDescription =
    course.content_html && course.content_html.trim().length > 0
      ? null
      : `Acest curs este construit ca un parcurs complet, de la notiunile fundamentale pana la rezolvarea aplicata a subiectelor de examen.
Vei invata pe etape clare, organizate pe parti si lectii video, astfel incat sa intelegi logica fiecarui capitol si sa poti aplica rapid metodele corecte in exercitii.

Continutul include explicatii practice, exemple relevante, tehnici de rezolvare si antrenament orientat spre rezultate, cu accent pe claritate, ritm de invatare si progres real.
La final, ai o structura solida de lucru, mai multa incredere si o strategie clara pentru examen.`;
  const mergedReviews = [...publicReviews];
  for (const fallback of fallbackReviews) {
    const exists = mergedReviews.some(
      (review) => review.author === fallback.author && review.title === fallback.title && review.content === fallback.content,
    );
    if (!exists) mergedReviews.push(fallback);
  }
  const effectiveReviews = mergedReviews;
  const visibleReviews = showAllReviews ? effectiveReviews : effectiveReviews.slice(0, 6);
  const hasRemainingParts = Boolean(access.remaining && access.remaining.parts_count > 0);
  const hasOwnedParts = access.ownedPartIds.size > 0;
  const canDownloadResourcesZip = hasOwnedParts && access.resourcesZip != null;

  const handleDownloadResourcesZip = async () => {
    if (!course.slug || !canDownloadResourcesZip) return;
    setDownloadingResourcesZip(true);
    setResourcesZipMessage(null);
    try {
      await downloadAuthenticatedFile(
        `/api/courses/${encodeURIComponent(course.slug)}/resources-zip`,
        access.resourcesZip?.file_name?.trim() || `${course.slug}-resurse.zip`,
      );
    } catch (err) {
      setResourcesZipMessage(err instanceof Error ? err.message : "Nu am putut descarca arhiva.");
    } finally {
      setDownloadingResourcesZip(false);
    }
  };

  const coursePurchaseSummary = useMemo((): ReactNode => {
    if (!checkout) return null;
    if (checkout.mode === "part") {
      const part = listedParts.find((p) => p.id === checkout.partId);
      if (!part) {
        return <p className="text-sm font-medium text-rose-600">Nu am gasit partea selectata.</p>;
      }
      const line = formatPrice(part.sale_price ?? part.price, part.currency) || "-";
      return (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Achizitionezi</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{course.name}</p>
          <p className="mt-2 text-lg font-bold text-sky-950">
            Partea {part.order_index}: {part.name}
          </p>
          {part.short_summary ? <p className="mt-1 text-sm text-slate-600">{part.short_summary}</p> : null}
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{line}</p>
          <p className="mt-3 border-t border-amber-200/60 pt-2 text-xs leading-relaxed text-slate-700">
            <span className="font-semibold text-sky-950">Acces 12 luni:</span> dupa confirmarea platii, lectiile din aceasta parte
            sunt disponibile timp de 12 luni.
          </p>
        </div>
      );
    }
    const rem = access.remaining;
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Achizitionezi</p>
        <p className="mt-1 text-sm font-medium text-slate-800">{course.name}</p>
        <p className="mt-2 text-lg font-bold text-sky-950">Toate partile ramase ({rem?.parts_count ?? 0})</p>
        <div className="mt-3 space-y-1.5 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">{(rem?.subtotal ?? 0).toFixed(0)} RON</span>
          </div>
          <div className="flex items-center justify-between text-emerald-700">
            <span>Reducere 25%</span>
            <span className="font-semibold">- {(rem?.discount ?? 0).toFixed(0)} RON</span>
          </div>
        </div>
        <p className="mt-3 text-2xl font-extrabold text-slate-900">Total: {(rem?.total ?? 0).toFixed(0)} RON</p>
        <p className="mt-3 border-t border-amber-200/60 pt-2 text-xs leading-relaxed text-slate-700">
          <span className="font-semibold text-sky-950">Acces 12 luni:</span> dupa confirmarea platii, toate partile din acest bundle
          sunt disponibile timp de 12 luni fiecare.
        </p>
      </div>
    );
  }, [checkout, course.name, listedParts, access.remaining]);

  const checkoutBaseAmountRon = useMemo(() => {
    if (!checkout) return 0;
    if (checkout.mode === "part") {
      const part = listedParts.find((p) => p.id === checkout.partId);
      if (!part) return 0;
      return Number(part.sale_price ?? part.price ?? 0) || 0;
    }
    return Number(access.remaining?.total ?? 0) || 0;
  }, [checkout, listedParts, access.remaining]);

  const refreshAccess = async () => {
    if (!course.slug || !user) return;
    setAccessLoading(true);
    try {
      const response = await apiFetch<{
        data: {
          owned_part_ids: string[];
          owned_part_access?: Array<{ part_id: string; access_until: string | null }>;
          trial_part_ids?: string[];
          can_review: boolean;
          resources_zip: { file_name: string | null; size_bytes: number | null; updated_at: string | null } | null;
          remaining: { parts_count: number; subtotal: number; discount: number; total: number };
        };
      }>(`/api/courses/${course.slug}/access`);
      const partAccessUntil = new Map<string, string | null>();
      for (const row of response.data.owned_part_access ?? []) {
        partAccessUntil.set(row.part_id, row.access_until);
      }
      setAccess({
        ownedPartIds: new Set(response.data.owned_part_ids),
        trialPartIds: new Set(response.data.trial_part_ids ?? []),
        partAccessUntil,
        canReview: response.data.can_review,
        remaining: response.data.remaining,
        resourcesZip: response.data.resources_zip,
      });
    } catch (err) {
      console.error("[courses] refreshAccess failed:", err);
      // Nu reseta accesul la gol: dupa checkout tokenul poate fi expirat temporar,
      // iar golirea state-ului face ca UI-ul sa para blocat desi DB-ul are drepturi.
    } finally {
      setAccessLoading(false);
    }
  };

  useEffect(() => {
    const payment = searchParams.get("payment");
    const attempt = searchParams.get("attempt");
    if (payment !== "success" || !attempt || !course.slug) return;
    let cancelled = false;
    const confirm = async () => {
      setAccessLoading(true);
      try {
        const response = await apiFetch<{
          data: {
            ok: boolean;
            payment_status: string;
            invoice_number?: string | null;
            revolut_status?: string;
            local_redirect_url?: string;
            granted_part_ids?: string[];
            purchase?: { event_id: string; product_code: string; value: number; currency: string };
          };
        }>(`/api/courses/${course.slug}/confirm-payment`, {
          method: "POST",
          body: JSON.stringify({ attemptId: attempt }),
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          trackConfirmedPurchase(response.data.purchase);
          const granted = response.data.granted_part_ids ?? [];
          if (granted.length > 0) {
            setAccess((prev) => {
              const next = new Set(prev.ownedPartIds);
              const trial = new Set(prev.trialPartIds);
              for (const id of granted) {
                next.add(id);
                trial.delete(id);
              }
              return { ...prev, ownedPartIds: next, trialPartIds: trial, canReview: next.size > trial.size };
            });
          }
          setPaymentMessage(
            response.data.invoice_number
              ? `Plata confirmata. Factura emisa: ${response.data.invoice_number}.`
              : "Plata confirmata. Accesul la parti a fost activat.",
          );
          if (user) {
            await refreshAccess();
          }
          const onNgrok = typeof window !== "undefined" && window.location.hostname.includes("ngrok");
          if (!cancelled && onNgrok && response.data.local_redirect_url) {
            window.location.href = response.data.local_redirect_url;
            return;
          }
        } else {
          setPaymentMessage("Plata este inca in procesare la Revolut. Reincarca pagina in cateva secunde.");
        }
      } catch {
        if (!cancelled) {
          setPaymentMessage("Nu am putut confirma plata acum. Verifica istoricul si incearca din nou.");
        }
      } finally {
        if (!cancelled) setAccessLoading(false);
        if (!cancelled) router.replace(`/cursuri/${course.slug}`);
      }
    };
    void confirm();
    return () => {
      cancelled = true;
    };
    // refreshAccess: nu in deps (recreata la fiecare render); user e inclus ca sa rerulam confirm dupa hidratare auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.slug, router, searchParams, user]);

  useEffect(() => {
    if (!course.slug || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch<{
          data: {
            can_review: boolean;
            review: {
              author_name: string;
              title: string;
              content: string;
              rating: number;
            } | null;
          };
        }>(`/api/courses/${course.slug}/reviews/me`);
        if (cancelled) return;
        const review = response.data.review;
        setMyReview(review);
        if (review) {
          setFormTitle(review.title);
          setFormContent(review.content);
          setFormRating(review.rating);
        }
      } catch {
        if (!cancelled) {
          setMyReview(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [course.slug, user]);

  useEffect(() => {
    if (!course.slug) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch<{
          data: Array<{
            author_name: string;
            title: string;
            content: string;
            rating: number;
            updated_at: string;
          }>;
        }>(`/api/courses/${course.slug}/reviews`);
        if (cancelled) return;
        const mapped: CourseReview[] = response.data.map((review) => ({
          author: review.author_name,
          title: review.title,
          content: review.content,
          rating: review.rating,
          date: String(review.updated_at).slice(0, 10),
        }));
        setPublicReviews(mapped);
      } catch {
        if (!cancelled) setPublicReviews([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [course.slug]);

  useEffect(() => {
    void refreshAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.slug, user?.id]);

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course.slug) return;
    setSavingReview(true);
    setReviewMessage(null);
    try {
      const response = await apiFetch<{
        data: { author_name: string; title: string; content: string; rating: number };
      }>(`/api/courses/${course.slug}/reviews/me`, {
        method: "POST",
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          rating: formRating,
        }),
      });
      setMyReview(response.data);
      setReviewMessage(myReview ? "Review-ul tau a fost actualizat." : "Review-ul tau a fost trimis.");
    } catch {
      setReviewMessage("Nu am putut salva review-ul acum. Incearca din nou.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!course.slug || !myReview) return;
    setSavingReview(true);
    setReviewMessage(null);
    try {
      await apiFetch(`/api/courses/${course.slug}/reviews/me`, {
        method: "DELETE",
      });
      setMyReview(null);
      setFormTitle("");
      setFormContent("");
      setFormRating(5);
      setReviewMessage("Review-ul tau a fost sters.");
      const response = await apiFetch<{
        data: Array<{
          author_name: string;
          title: string;
          content: string;
          rating: number;
          updated_at: string;
        }>;
      }>(`/api/courses/${course.slug}/reviews`);
      const mapped: CourseReview[] = response.data.map((review) => ({
        author: review.author_name,
        title: review.title,
        content: review.content,
        rating: review.rating,
        date: String(review.updated_at).slice(0, 10),
      }));
      setPublicReviews(mapped);
    } catch {
      setReviewMessage("Nu am putut sterge review-ul acum. Incearca din nou.");
    } finally {
      setSavingReview(false);
    }
  };

  const handleBuyPart = (partId: string) => {
    setCheckout({ mode: "part", partId });
  };

  const handleBuyAllRemaining = () => {
    setCheckout({ mode: "remaining" });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--glow-sky-haze)_0%,_var(--color-white)_48%,_var(--glow-amber-haze)_100%)]">
      {paymentMessage ? (
        <div className="mx-auto max-w-none px-3 pt-6 sm:px-4 lg:px-6 2xl:px-10">
          <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 shadow-sm">
            {paymentMessage}
          </p>
        </div>
      ) : null}
      <section className="mx-auto w-full max-w-none px-3 pb-5 pt-8 sm:px-4 lg:px-6 2xl:px-10">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_22px_80px_-26px_rgba(14,116,144,0.5)] backdrop-blur">
          <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-44 w-44 rounded-full bg-amber-200/70 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_520px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Prezentare curs</p>
              <h1 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">{course.h1 || course.name}</h1>
              {course.hook ? <p className="mt-3 text-justify text-slate-700">{course.hook}</p> : null}
              <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/65 p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Parti</p>
                  <p className="mt-1 text-lg font-bold text-sky-950">{listedParts.length}</p>
                </article>
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Video-uri</p>
                  <p className="mt-1 text-lg font-bold text-sky-950">{allVideos.length}</p>
                </article>
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Durata totala</p>
                  <p className="mt-1 text-lg font-bold text-sky-950">{courseHours}</p>
                </article>
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Autor</p>
                  <p className="mt-1 text-sm font-semibold text-sky-950">{course.author_name || "-"}</p>
                </article>
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Format</p>
                  <p className="mt-1 text-sm font-semibold text-sky-950">{course.format || "video"}</p>
                </article>
                <article className="rounded-xl border border-amber-100/90 bg-amber-50/95 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pret</p>
                  <p className="mt-1 text-sm font-semibold text-sky-950">{coursePrice ? `De la ${coursePrice}` : "-"}</p>
                </article>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60 shadow-sm">
              {course.image_url ? (
                <img src={course.image_url} alt={course.name} className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center text-zinc-500">Imagine curs</div>
              )}
            </div>
          </div>
          {course.content_html ? (
            <div className="border-t border-sky-100/90 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">Descriere completa</h2>
              <div
                className="prose mt-3 max-w-none text-slate-900 [&_p]:text-justify prose-headings:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{ __html: course.content_html }}
              />
            </div>
          ) : (
            <div className="border-t border-sky-100/90 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">Descriere completa</h2>
              <p className="mt-3 whitespace-pre-line text-justify text-sm leading-7 text-slate-900">{completeDescription}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-5 sm:px-4 lg:px-6 2xl:px-10">
        <article className="relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_56px_-28px_rgba(14,116,144,0.6)]">
          <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-sky-100/70 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">Autorul cursului</p>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/60 shadow-sm lg:mx-0 lg:max-w-none">
              <Image
                src="/cursuri-images/autor-paul-ioan-somesan.png?v=3"
                alt="Paul-Ioan Someșan"
                fill
                sizes="(max-width: 1024px) 260px, 240px"
                className="object-cover object-center"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-sky-950">Paul-Ioan Someșan</h3>
              <p className="mt-1 text-lg font-semibold text-sky-700">Fondatorul platformei Zece la Info</p>
              <InstructorBioParagraphs className="mt-4 space-y-3 text-sm leading-7 text-slate-900" />
              <blockquote className="mt-4 border-l-4 border-sky-600 pl-4 text-justify text-base font-semibold italic text-slate-800">
                Cred ca educatia trebuie sa fie logica, accesibila si inspirata din realitate. Scopul meu este ca fiecare elev sa
                inteleaga, nu doar sa memoreze.
              </blockquote>
            </div>
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-5 sm:px-4 lg:px-6 2xl:px-10">
        <article className="rounded-[1.4rem] border border-white/80 bg-white/90 px-4 py-3 shadow-[0_12px_36px_-22px_rgba(14,116,144,0.55)] sm:px-5 sm:py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-sky-950 sm:text-lg">Video de prezentare curs</h2>
              <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:text-sm">
                Prezentarea structurii cursului si a modului de lucru — deschide intr-un pop-up cand esti gata.
              </p>
            </div>
            <button
              type="button"
              disabled={!previewVideoUrl}
              onClick={() => {
                if (previewVideoUrl) setPresentationVideoOpen(true);
              }}
              className="inline-flex w-full shrink-0 cursor-pointer items-center justify-center rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[200px]"
            >
              {previewVideoUrl ? "Vezi video prezentare" : "Video indisponibil"}
            </button>
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-12 sm:px-4 lg:px-6 2xl:px-10">
        <article className="rounded-[1.8rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_56px_-28px_rgba(14,116,144,0.6)]">
          <h2 className="text-xl font-bold text-sky-950">Structura pe parti</h2>
          <p className="mt-1 text-sm text-slate-600">
            Apasa pe o parte pentru a vedea toate video-urile incluse. Partile pot fi achizitionate integral cu 25% reducere
            sau individual la pretul afisat in dreptul fiecareia. Accesul la continutul platit este de{" "}
            <strong>12 luni</strong> de la confirmarea platii.
          </p>
          <TrialCtaCard className="mt-4" onActivated={refreshAccess} />
          {canDownloadResourcesZip ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-950">Resurse curs (ZIP)</p>
                <p className="mt-0.5 text-xs text-emerald-900/80">
                  Materiale suplimentare pentru cursul achizitionat
                  {access.resourcesZip?.file_name ? ` · ${access.resourcesZip.file_name}` : ""}
                  {access.resourcesZip?.size_bytes
                    ? ` · ${(access.resourcesZip.size_bytes / (1024 * 1024)).toFixed(1)} MB`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={downloadingResourcesZip}
                onClick={() => void handleDownloadResourcesZip()}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingResourcesZip ? "Se descarca..." : "Descarca arhiva ZIP"}
              </button>
            </div>
          ) : null}
          {!canDownloadResourcesZip && access.trialPartIds.size > 0 ? (
            <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              Ești în perioada de test gratuit: poți urmări lecțiile, iar arhiva cu resursele cursului se deblochează după achiziție.
            </p>
          ) : null}
          {resourcesZipMessage ? <p className="mt-2 text-sm text-rose-700">{resourcesZipMessage}</p> : null}
          <div className={`mt-4 grid grid-cols-1 gap-4 ${hasRemainingParts ? "xl:grid-cols-[minmax(0,1fr)_330px]" : ""}`}>
            <div className="space-y-3">
              {listedParts.map((part) => (
                <article
                  id={`part-${part.id}`}
                  key={part.id}
                  className="scroll-mt-28 overflow-hidden rounded-2xl border border-amber-200/70 bg-amber-50/60 shadow-sm"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={openPartId === part.id}
                    onClick={() => setOpenPartId((prev) => (prev === part.id ? null : part.id))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpenPartId((prev) => (prev === part.id ? null : part.id));
                      }
                    }}
                    className="flex w-full cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left outline-none ring-sky-400/40 focus-visible:ring-2"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Partea {part.order_index}</p>
                      <p className="text-base font-semibold text-zinc-900">{part.name}</p>
                      {part.short_summary ? <p className="mt-1 text-sm text-zinc-600">{part.short_summary}</p> : null}
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p>{part.videos.length} video-uri</p>
                      <p>{formatPrice(part.sale_price ?? part.price, part.currency) || "-"}</p>
                      {access.trialPartIds.has(part.id) ? (
                        <span className="mt-1 flex flex-col items-end gap-0.5">
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Trial 24h
                          </span>
                          {formatPartAccessUntilLabel(access.partAccessUntil.get(part.id)) ? (
                            <span className="max-w-[11rem] text-right text-[10px] font-medium leading-tight text-amber-800/90">
                              pana la {formatPartAccessUntilLabel(access.partAccessUntil.get(part.id))}
                            </span>
                          ) : null}
                        </span>
                      ) : access.ownedPartIds.has(part.id) ? (
                        <span className="mt-1 flex flex-col items-end gap-0.5">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Detinut
                          </span>
                          {formatPartAccessUntilLabel(access.partAccessUntil.get(part.id)) ? (
                            <span className="max-w-[11rem] text-right text-[10px] font-medium leading-tight text-emerald-800/90">
                              pana la {formatPartAccessUntilLabel(access.partAccessUntil.get(part.id))}
                            </span>
                          ) : (
                            <span className="max-w-[11rem] text-right text-[10px] text-slate-500">acces fara data limita</span>
                          )}
                        </span>
                      ) : null}
                      {!access.ownedPartIds.has(part.id) || access.trialPartIds.has(part.id) ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleBuyPart(part.id);
                          }}
                          disabled={!user}
                          className="mt-1 inline-flex cursor-pointer rounded-full border border-sky-300/40 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cumpara doar partea aceasta
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {openPartId === part.id ? (
                    <div className="space-y-2 border-t border-sky-100 bg-white/95 p-4">
                      {(Array.isArray(part.videos) ? [...part.videos] : [])
                        .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title))
                        .map((video, index) => (
                          <button
                            key={video.id}
                            type="button"
                            disabled={!video.is_free_preview && !access.ownedPartIds.has(part.id)}
                            onClick={() => setSelectedVideo({ title: video.title, vimeo_id: video.vimeo_id })}
                            className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg border border-sky-100 bg-sky-50/40 px-3 py-2 text-left hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <div>
                              <p className="text-sm font-medium text-zinc-900">
                                {index + 1}. {video.title}
                              </p>
                              <p className="text-xs text-zinc-600">
                                {video.is_free_preview ? "Preview gratuit" : access.ownedPartIds.has(part.id) ? "Lectie completa" : "Lectie blocata"}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              {!video.is_free_preview && !access.ownedPartIds.has(part.id) ? (
                                <p className="text-sm text-zinc-600">🔒</p>
                              ) : null}
                              <p className="text-xs text-zinc-600">{formatDuration(video.duration_seconds)}</p>
                            </div>
                          </button>
                        ))}
                      {part.videos.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nu exista video-uri publicate in aceasta parte momentan.</p>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
              {listedParts.length === 0 ? <p className="text-sm text-zinc-500">Nu exista parti publicate momentan.</p> : null}
            </div>

            {hasRemainingParts ? (
              <aside className="h-fit rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/95 to-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Plata integrala</p>
              <h3 className="mt-1 text-lg font-bold text-sky-950">Rezumat partile ramase</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-700">
                  <span>Parti ramase</span>
                  <span className="font-semibold">{access.remaining?.parts_count ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-700">
                  <span>Total ramas</span>
                  <span className="font-semibold">{(access.remaining?.subtotal ?? 0).toFixed(0)} RON</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Reducere 25%</span>
                  <span className="font-semibold">- {(access.remaining?.discount ?? 0).toFixed(0)} RON</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-sky-900 px-3 py-3 text-white">
                <p className="text-xs uppercase tracking-wide text-sky-100">Platesti doar</p>
                <p className="text-2xl font-extrabold">{(access.remaining?.total ?? 0).toFixed(0)} RON</p>
              </div>
              <p className="mt-2 text-xs leading-snug text-slate-600">
                Acces la fiecare parte cumparata: <strong>12 luni</strong> de la confirmarea platii.
              </p>
              <button
                type="button"
                disabled={!user || !access.remaining || access.remaining.parts_count === 0}
                onClick={handleBuyAllRemaining}
                className="mt-4 w-full cursor-pointer rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!access.remaining || access.remaining.parts_count === 0
                  ? "Detii deja toate partile"
                  : "Cumpara toate partile ramase"}
              </button>
              {!user ? <p className="mt-3 text-xs text-zinc-500">Autentifica-te ca sa finalizezi achizitia.</p> : null}
              {accessLoading ? <p className="mt-2 text-xs text-zinc-500">Se actualizeaza accesul...</p> : null}
              </aside>
            ) : null}
          </div>
        </article>
      </section>

      <section className="mx-auto w-full max-w-none px-3 pb-12 sm:px-4 lg:px-6 2xl:px-10">
        <article className="rounded-[1.8rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_56px_-28px_rgba(14,116,144,0.6)]">
          <h2 className="text-xl font-bold text-sky-950">Review-uri elevi</h2>
          <p className="mt-1 text-sm text-slate-600">Pareri reale de la elevi care au folosit cursul pentru pregatire.</p>
          {effectiveReviews.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleReviews.map((review) => (
                <article key={`${review.author}-${review.date}`} className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{review.author}</p>
                    <p className="text-xs text-zinc-500">{review.date}</p>
                  </div>
                  <p className="mt-2 text-base leading-none text-amber-500">{"★".repeat(review.rating)}</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-800">{review.title}</p>
                  <p className="mt-2 text-justify text-sm leading-6 text-zinc-700">{review.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">Momentan nu exista review-uri publice pentru acest curs.</p>
          )}
          {effectiveReviews.length > 6 ? (
            <button
              type="button"
              onClick={() => setShowAllReviews((current) => !current)}
              className="mt-4 cursor-pointer rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300"
            >
              {showAllReviews ? "Afiseaza mai putine" : "Mai multe review-uri"}
            </button>
          ) : null}

          <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
              <h3 className="text-base font-bold text-sky-950">Lasa un review</h3>
              {!loading && !user ? (
                <p className="mt-2 text-sm text-zinc-600">Autentifica-te pentru a adauga sau actualiza review-ul tau.</p>
              ) : null}
              {user && !access.canReview ? (
                <p className="mt-2 text-sm text-zinc-600">Doar elevii care au cumparat cel putin o parte a cursului pot lasa review.</p>
              ) : null}
              {user && access.canReview ? (
                <form className="mt-3 space-y-3" onSubmit={handleSubmitReview}>
                  <input
                    value={formTitle}
                    onChange={(event) => setFormTitle(event.target.value)}
                    placeholder="Titlul review-ului"
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                    required
                    minLength={3}
                    maxLength={160}
                  />
                  <textarea
                    value={formContent}
                    onChange={(event) => setFormContent(event.target.value)}
                    placeholder="Scrie experienta ta cu acest curs..."
                    className="min-h-[140px] w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-300/40 focus:ring"
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-zinc-800">Rating:</label>
                    <select
                      value={formRating}
                      onChange={(event) => setFormRating(Number(event.target.value))}
                      className="rounded-md border border-sky-200 bg-white px-2 py-1 text-sm text-slate-900"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} stele
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={savingReview}
                    className="cursor-pointer rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-900/20 transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingReview ? "Se salveaza..." : myReview ? "Actualizeaza review-ul" : "Trimite review"}
                    </button>
                    {myReview ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteReview()}
                        disabled={savingReview}
                        className="cursor-pointer rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-200/80 hover:bg-amber-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Sterge review
                      </button>
                    ) : null}
                  </div>
                  {reviewMessage ? <p className="text-sm text-zinc-700">{reviewMessage}</p> : null}
                </form>
              ) : null}
          </div>
        </article>
      </section>

      {checkout && course.slug && user ? (
        <BillingProfileCheckoutModal
          open
          fieldIdPrefix="course-purchase"
          discount={checkoutBaseAmountRon > 0 ? { scope: "courses", baseAmountRon: checkoutBaseAmountRon } : undefined}
          summary={coursePurchaseSummary}
          checkoutNotice={
            <>
              <span className="font-semibold text-sky-950">Acces 12 luni.</span> Continutul din aceasta comanda (parti / lectii
              video) este disponibil timp de <strong>12 luni</strong> de la confirmarea platii la Revolut. Dupa expirare, poti
              cumpara din nou partile dorite pentru a redeschide accesul.
            </>
          }
          submitLabel={checkout.mode === "part" ? "Cumpara partea" : "Cumpara toate partile ramase"}
          onClose={() => setCheckout(null)}
          onConfirm={async (profile, extras) => {
            if (!course.slug || !checkout) throw new Error("missing");
            const body =
              checkout.mode === "part"
                ? {
                    mode: "part" as const,
                    partId: checkout.partId,
                    billingProfile: profile,
                    acceptTerms: true,
                    discountCode: extras?.discountCode ?? undefined,
                  }
                : {
                    mode: "remaining" as const,
                    billingProfile: profile,
                    acceptTerms: true,
                    discountCode: extras?.discountCode ?? undefined,
                  };
            const response = await apiFetch<{
              data: { checkout_url: string | null; direct_paid?: boolean; attempt_id?: string };
            }>(`/api/courses/${course.slug}/create-payment`, {
              method: "POST",
              body: JSON.stringify(body),
            });
            if (response.data.attempt_id) {
              track({
                name: "begin_checkout",
                eventId: `checkout_${response.data.attempt_id}`,
                productCode: `${course.slug}:${body.mode}`,
                value: checkoutBaseAmountRon,
              });
            }
            if (response.data.direct_paid || !response.data.checkout_url) {
              setCheckout(null);
              setPaymentMessage("Comanda a fost inregistrata. Accesul la parti este activ (fara plata Revolut).");
              await refreshAccess();
              return;
            }
            window.location.href = response.data.checkout_url;
          }}
        />
      ) : null}

      {presentationVideoOpen && previewVideoUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setPresentationVideoOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl border border-sky-100 bg-zinc-900 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="line-clamp-1 text-sm font-semibold text-zinc-100">Prezentare: {course.name}</p>
              <button
                type="button"
                onClick={() => setPresentationVideoOpen(false)}
                className="cursor-pointer rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-800"
              >
                Inchide
              </button>
            </div>
            <iframe
              src={previewVideoUrl}
              title={`Prezentare ${course.name}`}
              className="aspect-video w-full overflow-hidden rounded-lg"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {selectedVideo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-zinc-700 bg-zinc-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="line-clamp-1 text-sm font-semibold text-zinc-100">{selectedVideo.title}</p>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="cursor-pointer rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-100"
              >
                Inchide
              </button>
            </div>
            <iframe
              src={toEmbedUrl(selectedVideo.vimeo_id)}
              title={selectedVideo.title}
              className="aspect-video w-full rounded-lg"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
