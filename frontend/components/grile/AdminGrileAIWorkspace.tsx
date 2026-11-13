"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { apiFetch } from "@/lib/api";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { ModalPortal } from "@/components/ui/ModalPortal";

type Category = { id: string; slug: string; name: string };
type Source = { id: string; name: string; total_questions?: number; exam_mode_enabled?: boolean };
type Chapter = { id: string; name: string; total_questions?: number };

type Stats = {
  total_questions: number;
  ai_generated: number;
  without_ai: number;
  needs_human_review: number;
  processing_error: number;
  processed_today: number;
  completion_percent: number;
};

type Item = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  official_answer: string | null;
  difficulty: number | null;
  variants_count: number | null;
  source_name: string | null;
  chapter_names: string[] | null;
  official_answer_normalized: string | null;
  model_suggested_answer_normalized: string | null;
  processing_status: "pending" | "processing" | "done" | "error" | null;
  confidence: number | null;
  ocr_confidence: number | null;
  needs_human_review: boolean | null;
  generated_at: string | null;
  error_message: string | null;
  reviewed_by_admin: boolean | null;
};

type Details = Record<string, unknown> & {
  question_id: string;
  image_url: string | null;
  official_answer: string | null;
  official_answer_normalized: string | null;
  model_suggested_answer_normalized: string | null;
  agrees_with_official_answer: boolean | null;
  needs_human_review: boolean | null;
  ocr_confidence: number | null;
  confidence: number | null;
  review_reason: string | null;
  transcribed_question: string | null;
  transcribed_options: Array<{ letter: string; text: string }> | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  options_explanation: Array<{ letter: string; explanation: string }> | null;
  trap: string | null;
  complexity: string | null;
  difficulty_estimate: string | null;
  tags: string[] | null;
  student_visible: { hint?: string; explanation?: string; trap?: string } | null;
  admin_notes: string | null;
  content_format: string | null;
  raw_ai_response: string | null;
  error_message: string | null;
};
type ReportItem = {
  id: string;
  question_id: string;
  legacy_id: number | null;
  order_index: number | null;
  source_name: string | null;
  user_email: string | null;
  message: string;
  status: "open" | "resolved";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type ReportQuestionContent = {
  id: string;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  video_url: string | null;
};

type Filters = {
  categorySlug: string;
  sourceId: string;
  chapterId: string;
  difficulty: "" | number;
  searchQuestionId: string;
  processingStatus: "" | "pending" | "processing" | "done" | "error";
  onlyWithoutAI: boolean;
  onlyNeedsReview: boolean;
  onlyErrors: boolean;
};

export function AdminGrileAIWorkspace() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Filters>({
    categorySlug: "",
    sourceId: "",
    chapterId: "",
    difficulty: "",
    searchQuestionId: "",
    processingStatus: "",
    onlyWithoutAI: false,
    onlyNeedsReview: false,
    onlyErrors: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [details, setDetails] = useState<Details | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ processed: 0, success: 0, errors: 0, needsReview: 0 });
  const [batchCurrentQuestionId, setBatchCurrentQuestionId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [activeReportContent, setActiveReportContent] = useState<ReportQuestionContent | null>(null);
  const [reportModalLoading, setReportModalLoading] = useState(false);
  const [reportModalSaving, setReportModalSaving] = useState(false);
  const [reportModalError, setReportModalError] = useState<string | null>(null);
  const [reportAnswer, setReportAnswer] = useState("");
  const [reportHint, setReportHint] = useState("");
  const [reportShortExplanation, setReportShortExplanation] = useState("");
  const [reportFullExplanation, setReportFullExplanation] = useState("");
  const [reportVideoUrl, setReportVideoUrl] = useState("");
  const [reportResolutionMessage, setReportResolutionMessage] = useState("");
  const [reportPendingImageFile, setReportPendingImageFile] = useState<File | null>(null);
  const [reportPendingImagePreview, setReportPendingImagePreview] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: Category[] }>("/api/grile/categories");
      setCategories(response.data ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadCategoryDetails = useCallback(async (slug: string) => {
    if (!slug) {
      setSources([]);
      setChapters([]);
      return;
    }
    try {
      const response = await apiFetch<{
        data: {
          sources: Source[];
          chapters: Chapter[];
        };
      }>(`/api/grile/categories/${slug}?view=sources`);
      setSources(response.data.sources ?? []);
      setChapters(response.data.chapters ?? []);
    } catch {
      setSources([]);
      setChapters([]);
    }
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.categorySlug) params.set("categorySlug", filters.categorySlug);
    if (filters.sourceId) params.set("sourceId", filters.sourceId);
    if (filters.chapterId) params.set("chapterId", filters.chapterId);
    if (filters.difficulty !== "") params.set("difficulty", String(filters.difficulty));
    if (filters.searchQuestionId.trim()) params.set("searchQuestionId", filters.searchQuestionId.trim());
    if (filters.processingStatus) params.set("processingStatus", filters.processingStatus);
    if (filters.onlyWithoutAI) params.set("onlyWithoutAI", "true");
    if (filters.onlyNeedsReview) params.set("onlyNeedsReview", "true");
    if (filters.onlyErrors) params.set("onlyErrors", "true");
    params.set("limit", "50");
    return params.toString();
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategoryDetails(filters.categorySlug);
  }, [filters.categorySlug, loadCategoryDetails]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiFetch<{ data: Stats }>("/api/grile/admin/ai/stats");
      setStats(response.data);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut incarca statisticile.";
      setErrorMessage(message.includes("403") ? "Nu ai acces la AI Grile. Ai nevoie de rol admin/professor." : message);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const response = await apiFetch<{ data: { items: ReportItem[] } }>("/api/grile/admin/reports?status=open&limit=100");
      setReports(response.data.items ?? []);
    } catch {
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: { items: Item[] } }>(`/api/grile/admin/ai/questions?${queryString}`);
      setItems(response.data.items);
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut incarca grilele.";
      setErrorMessage(message.includes("403") ? "Nu ai acces la AI Grile. Ai nevoie de rol admin/professor." : message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, [loadReports]);

  const processOne = async (questionId: string, forceRegenerate = false) => {
    setProcessingIds((prev) => ({ ...prev, [questionId]: true }));
    try {
      await apiFetch("/api/grile/admin/ai/process-one", {
        method: "POST",
        body: JSON.stringify({ questionId, forceRegenerate }),
      });
      await Promise.all([loadItems(), loadStats()]);
    } finally {
      setProcessingIds((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const openDetails = async (questionId: string) => {
    const response = await apiFetch<{ data: Details }>(`/api/grile/admin/ai/questions/${questionId}`);
    setDetails(response.data);
    setReviewNote(String(response.data.admin_review_note ?? ""));
  };

  const markReviewed = async () => {
    if (!details) return;
    await apiFetch(`/api/grile/admin/ai/questions/${details.question_id}/review`, {
      method: "POST",
      body: JSON.stringify({ adminReviewNote: reviewNote, clearNeedsHumanReview: true }),
    });
    await Promise.all([loadItems(), loadStats(), openDetails(details.question_id)]);
  };

  const resetResult = async (questionId: string) => {
    await apiFetch(`/api/grile/admin/ai/questions/${questionId}`, { method: "DELETE" });
    if (details?.question_id === questionId) setDetails(null);
    await Promise.all([loadItems(), loadStats()]);
  };

  const runBatch = async (limit: number) => {
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchLog([]);
    setBatchProgress({ processed: 0, success: 0, errors: 0, needsReview: 0 });
    setBatchCurrentQuestionId(null);
    try {
      let keepGoing = true;
      const chunkSize = 1;
      while (keepGoing) {
        setBatchCurrentQuestionId("selectare urmatoarea grila...");
        const response = await apiFetch<{
          data: {
            processedCount: number;
            successCount: number;
            errorCount: number;
            needsReviewCount: number;
            results: Array<{ questionId: string; ok: boolean; error?: string; needsReview?: boolean; skipped?: boolean }>;
          };
        }>("/api/grile/admin/ai/process-batch", {
          method: "POST",
          body: JSON.stringify({
            limit: chunkSize,
            categorySlug: filters.categorySlug || undefined,
            sourceId: filters.sourceId || undefined,
            chapterId: filters.chapterId || undefined,
            difficulty: filters.difficulty === "" ? undefined : filters.difficulty,
            searchQuestionId: filters.searchQuestionId || undefined,
            processingStatus: filters.processingStatus || undefined,
            onlyWithoutAI: filters.onlyWithoutAI,
            onlyNeedsReview: filters.onlyNeedsReview,
            onlyErrors: filters.onlyErrors,
            forceRegenerate: false,
            includeAlreadyGenerated: false,
          }),
        });

        const data = response.data;
        if (data.processedCount === 0) {
          keepGoing = false;
          continue;
        }
        const firstId = data.results[0]?.questionId ?? null;
        setBatchCurrentQuestionId(firstId);
        setBatchProgress((prev) => ({
          processed: prev.processed + data.processedCount,
          success: prev.success + data.successCount,
          errors: prev.errors + data.errorCount,
          needsReview: prev.needsReview + data.needsReviewCount,
        }));
        setBatchLog((prev) => [
          ...data.results
            .slice(0, 10)
            .map((row) => `${row.ok ? (row.skipped ? "SKIP" : "OK") : "ERR"} ${row.questionId}${row.needsReview ? " (review)" : ""}${row.error ? `: ${row.error}` : ""}`),
          ...prev,
        ].slice(0, 30));

        await Promise.all([loadItems(), loadStats()]);
        if (data.errorCount > 0) {
          setBatchLog((prev) => ["Atentie: a aparut o eroare pe o grila, continui automat cu urmatoarea.", ...prev].slice(0, 30));
        }
        if (data.processedCount < chunkSize) {
          keepGoing = false;
        }
      }
    } finally {
      setBatchCurrentQuestionId(null);
      setBatchRunning(false);
      await Promise.all([loadItems(), loadStats()]);
    }
  };

  const autoReviewConfidentNeedsReview = async () => {
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchCurrentQuestionId("auto-review");
    try {
      const response = await apiFetch<{ data: { updatedCount: number; questionIds: string[] } }>(
        "/api/grile/admin/ai/auto-review-confident",
        {
          method: "POST",
          body: JSON.stringify({
            categorySlug: filters.categorySlug || undefined,
            sourceId: filters.sourceId || undefined,
            chapterId: filters.chapterId || undefined,
          }),
        },
      );
      const updatedCount = response.data.updatedCount ?? 0;
      setBatchLog((prev) => [`AUTO-REVIEW: ${updatedCount} grile marcate verificate.`, ...prev].slice(0, 30));
      await Promise.all([loadItems(), loadStats()]);
    } finally {
      setBatchCurrentQuestionId(null);
      setBatchRunning(false);
    }
  };

  const resolveReport = async (reportId: string) => {
    await apiFetch(`/api/grile/admin/reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ adminNote: "" }),
    });
    await loadReports();
  };

  const openReportAdmin = async (report: ReportItem) => {
    setActiveReport(report);
    setReportModalLoading(true);
    setReportModalSaving(false);
    setReportModalError(null);
    setReportResolutionMessage(
      `Iti multumim pentru raportare.\n\nVerificarea noastra:\n- \n\nCu apreciere,\nPaul Somesan`,
    );
    setReportPendingImageFile(null);
    setReportPendingImagePreview(null);
    try {
      const response = await apiFetch<{ data: ReportQuestionContent }>(`/api/grile/admin/questions/${report.question_id}/content`);
      const row = response.data;
      setActiveReportContent(row);
      setReportAnswer(row.answer ?? "");
      setReportHint(row.hint ?? "");
      setReportShortExplanation(row.short_explanation ?? "");
      setReportFullExplanation(row.full_explanation ?? "");
      setReportVideoUrl(row.video_url ?? "");
    } catch (error) {
      setReportModalError(error instanceof Error ? error.message : "Nu am putut incarca datele grilei.");
      setActiveReportContent(null);
    } finally {
      setReportModalLoading(false);
    }
  };

  const closeReportAdmin = () => {
    setActiveReport(null);
    setActiveReportContent(null);
    setReportModalLoading(false);
    setReportModalSaving(false);
    setReportModalError(null);
    setReportPendingImageFile(null);
    if (reportPendingImagePreview) URL.revokeObjectURL(reportPendingImagePreview);
    setReportPendingImagePreview(null);
  };

  const readFileAsBase64 = async (file: File): Promise<string> =>
    await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Nu am putut citi fisierul."));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error("Nu am putut citi fisierul."));
      reader.readAsDataURL(file);
    });

  const handleReportImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setReportModalError("Format neacceptat. Foloseste PNG, JPG, WEBP sau GIF.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setReportModalError("Imaginea depaseste limita de 15 MB.");
      return;
    }
    setReportModalError(null);
    setReportPendingImageFile(file);
    setReportPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const saveReportQuestionContent = async (): Promise<boolean> => {
    if (!activeReport) return false;
    setReportModalSaving(true);
    setReportModalError(null);
    try {
      const payload: Record<string, string | null> = {
        answer: reportAnswer.trim().toUpperCase(),
        hint: reportHint,
        short_explanation: reportShortExplanation,
        full_explanation: reportFullExplanation,
        video_url: reportVideoUrl.trim() === "" ? null : reportVideoUrl.trim(),
      };
      if (reportPendingImageFile) {
        payload.image_file_name = reportPendingImageFile.name;
        payload.image_base64 = await readFileAsBase64(reportPendingImageFile);
      }
      const response = await apiFetch<{ data: ReportQuestionContent }>(`/api/grile/admin/questions/${activeReport.question_id}/content`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setActiveReportContent(response.data);
      setReportPendingImageFile(null);
      if (reportPendingImagePreview) URL.revokeObjectURL(reportPendingImagePreview);
      setReportPendingImagePreview(null);
      return true;
    } catch (error) {
      setReportModalError(error instanceof Error ? error.message : "Nu am putut salva continutul grilei.");
      return false;
    } finally {
      setReportModalSaving(false);
    }
  };

  const resolveReportWithEmail = async () => {
    if (!activeReport) return;
    if (reportResolutionMessage.trim().length < 10) {
      setReportModalError("Mesajul pentru elev trebuie sa aiba minim 10 caractere.");
      return;
    }
    setReportModalSaving(true);
    setReportModalError(null);
    try {
      const saved = await saveReportQuestionContent();
      if (!saved) return;
      await apiFetch(`/api/grile/admin/reports/${activeReport.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({
          adminNote: reportResolutionMessage.trim(),
          resolutionMessage: reportResolutionMessage.trim(),
          sendEmail: true,
        }),
      });
      await loadReports();
      closeReportAdmin();
    } catch (error) {
      setReportModalError(error instanceof Error ? error.message : "Nu am putut solutiona raportul.");
      setReportModalSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {[
          ["Total grile", stats?.total_questions ?? 0],
          ["Cu AI", stats?.ai_generated ?? 0],
          ["Fara AI", stats?.without_ai ?? 0],
          ["Needs review", stats?.needs_human_review ?? 0],
          ["Eroare", stats?.processing_error ?? 0],
          ["Procesate azi", stats?.processed_today ?? 0],
          ["Completare", `${stats?.completion_percent ?? 0}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-zinc-200 bg-white p-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-lg font-semibold text-zinc-900">{String(value)}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <select
            value={filters.categorySlug}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                categorySlug: e.target.value,
                sourceId: "",
                chapterId: "",
              }))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Toate categoriile</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sourceId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sourceId: e.target.value,
                chapterId: e.target.value ? "" : prev.chapterId,
              }))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            disabled={!filters.categorySlug}
          >
            <option value="">Toate sursele</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.chapterId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                chapterId: e.target.value,
                sourceId: e.target.value ? "" : prev.sourceId,
              }))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            disabled={!filters.categorySlug}
          >
            <option value="">Toate capitolele</option>
            {chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                difficulty: e.target.value ? Number(e.target.value) : "",
              }))
            }
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Dificultate (toate)</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            value={filters.searchQuestionId}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuestionId: e.target.value }))}
            placeholder="Cauta dupa ID"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={filters.processingStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, processingStatus: e.target.value as Filters["processingStatus"] }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Toate statusurile</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="done">done</option>
            <option value="error">error</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={filters.onlyWithoutAI} onChange={(e) => setFilters((prev) => ({ ...prev, onlyWithoutAI: e.target.checked }))} />
            doar fara AI
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={filters.onlyNeedsReview} onChange={(e) => setFilters((prev) => ({ ...prev, onlyNeedsReview: e.target.checked }))} />
            doar needs review
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={filters.onlyErrors} onChange={(e) => setFilters((prev) => ({ ...prev, onlyErrors: e.target.checked }))} />
            doar erori
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void runBatch(5)} disabled={batchRunning} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Proceseaza lot 5</button>
          <button type="button" onClick={() => void runBatch(10)} disabled={batchRunning} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Proceseaza lot 10</button>
          <button type="button" onClick={() => void runBatch(50)} disabled={batchRunning} className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-800 disabled:opacity-50">Proceseaza lot 50</button>
          <button
            type="button"
            onClick={() => void runBatch(50)}
            disabled={batchRunning}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-50"
            title="Ruleaza in bucle de cate 50 pana cand nu mai are ce procesa"
          >
            Ruleaza pe toate (loturi 50)
          </button>
          <button
            type="button"
            onClick={() => void autoReviewConfidentNeedsReview()}
            disabled={batchRunning}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 disabled:opacity-50"
            title="Marcheaza automat ca verificate toate grilele cu needs review + confidence 1/1"
          >
            Marcheaza verificate: Needs review + Conf 1/1
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Progres batch: {batchProgress.processed} procesate, {batchProgress.success} ok, {batchProgress.errors} erori, {batchProgress.needsReview} review.
        </p>
        {batchRunning ? (
          <p className="mt-1 text-xs font-medium text-zinc-700">
            Se proceseaza acum: {batchCurrentQuestionId ? `${batchCurrentQuestionId.slice(0, 8)}...` : "pregatire lot..."}
          </p>
        ) : null}
        {batchLog.length ? <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs">{batchLog.join("\n")}</pre> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        {loading ? (
          <p className="text-sm text-zinc-600">Se incarca...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Preview</th>
                  <th className="px-2 py-2">Sursa</th>
                  <th className="px-2 py-2">Barem</th>
                  <th className="px-2 py-2">Model</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Conf</th>
                  <th className="px-2 py-2">Needs review</th>
                  <th className="px-2 py-2">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 align-top">
                    <td className="px-2 py-2 text-xs">{item.id.slice(0, 8)}…</td>
                    <td className="px-2 py-2">{item.image_url ? <img src={item.image_url} alt="preview grila" className="h-10 w-16 rounded border border-zinc-200 object-cover" /> : "—"}</td>
                    <td className="px-2 py-2 text-xs">{item.source_name ?? "-"}</td>
                    <td className="px-2 py-2">{item.official_answer_normalized ?? "-"}</td>
                    <td className="px-2 py-2">{item.model_suggested_answer_normalized ?? "-"}</td>
                    <td className="px-2 py-2">{item.processing_status ?? "pending"}</td>
                    <td className="px-2 py-2 text-xs">{item.confidence ?? "-"} / {item.ocr_confidence ?? "-"}</td>
                    <td className="px-2 py-2">{item.needs_human_review ? "Da" : "Nu"}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => void processOne(item.id, false)} disabled={Boolean(processingIds[item.id])} className="rounded border border-zinc-300 px-2 py-1 text-xs">Genereaza</button>
                        <button type="button" onClick={() => void processOne(item.id, true)} disabled={Boolean(processingIds[item.id])} className="rounded border border-zinc-300 px-2 py-1 text-xs">Regen</button>
                        <button type="button" onClick={() => void openDetails(item.id)} className="rounded border border-zinc-300 px-2 py-1 text-xs">Detalii</button>
                        <button type="button" onClick={() => void resetResult(item.id)} className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700">Reset</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Raportari greseli grile (open)</h3>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="rounded border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700"
          >
            Refresh
          </button>
        </div>
        {reportsLoading ? (
          <p className="text-sm text-zinc-600">Se incarca raportarile...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-zinc-600">Nu exista raportari deschise.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-600">
                  <th className="px-2 py-2">Grila</th>
                  <th className="px-2 py-2">Sursa</th>
                  <th className="px-2 py-2">Utilizator</th>
                  <th className="px-2 py-2">Mesaj</th>
                  <th className="px-2 py-2">Data</th>
                  <th className="px-2 py-2">Actiune</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-zinc-100 align-top">
                    <td className="px-2 py-2 text-xs">
                      {report.order_index ?? "-"} / {report.legacy_id ?? "-"}
                      <div className="text-[10px] text-zinc-500">{report.question_id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-2 py-2 text-xs">{report.source_name ?? "-"}</td>
                    <td className="px-2 py-2 text-xs">{report.user_email ?? "-"}</td>
                    <td className="px-2 py-2 text-xs text-zinc-800">{report.message}</td>
                    <td className="px-2 py-2 text-xs">{new Date(report.created_at).toLocaleString("ro-RO")}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => void openReportAdmin(report)}
                          className="rounded border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-800"
                        >
                          Administrare
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveReport(report.id)}
                          className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                        >
                          Marcheaza rezolvat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {details ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">Rezultat AI grila {details.question_id}</h3>
              <button type="button" onClick={() => setDetails(null)} className="rounded border border-zinc-300 px-3 py-1 text-sm">Inchide</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <p><strong>Barem:</strong> {details.official_answer_normalized ?? "-"}</p>
              <p><strong>Model:</strong> {details.model_suggested_answer_normalized ?? "-"}</p>
              <p><strong>Acord:</strong> {details.agrees_with_official_answer ? "Da" : "Nu"}</p>
              <p><strong>Needs review:</strong> {details.needs_human_review ? "Da" : "Nu"}</p>
              <p><strong>OCR:</strong> {details.ocr_confidence ?? "-"}</p>
              <p><strong>Confidence:</strong> {details.confidence ?? "-"}</p>
            </div>
            {details.image_url ? <img src={details.image_url} alt="grila" className="mt-3 max-h-60 rounded border border-zinc-200 object-contain" /> : null}
            <div className="mt-4 space-y-3">
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Transcriere</p><MarkdownLatexContent content={details.transcribed_question ?? ""} /></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Indiciu</p><MarkdownLatexContent content={details.hint ?? ""} /></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Explicatie scurta</p><MarkdownLatexContent content={details.short_explanation ?? ""} /></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Explicatie completa</p><MarkdownLatexContent content={details.full_explanation ?? ""} /></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Capcana</p><MarkdownLatexContent content={details.trap ?? ""} /></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Review reason</p><p>{details.review_reason ?? "-"}</p></article>
              <article className="rounded-lg border border-zinc-200 p-3"><p className="mb-2 text-xs text-zinc-500">Admin notes</p><MarkdownLatexContent content={details.admin_notes ?? ""} /></article>
              <details className="rounded-lg border border-zinc-200 p-3">
                <summary className="cursor-pointer text-sm font-medium">Raw AI response</summary>
                <pre className="mt-2 overflow-auto text-xs">{details.raw_ai_response ?? "-"}</pre>
              </details>
            </div>
            <div className="mt-4 rounded-lg border border-zinc-200 p-3">
              <label className="text-sm font-medium text-zinc-800">Nota admin</label>
              <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className="mt-1 h-20 w-full rounded border border-zinc-300 p-2 text-sm" />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void markReviewed()} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Marcheaza verificata</button>
                <button type="button" onClick={() => void processOne(details.question_id, true)} className="rounded border border-zinc-300 px-3 py-2 text-xs font-semibold">Regenerare AI</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {activeReport ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3" onClick={closeReportAdmin} role="presentation">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-auto rounded-2xl border border-zinc-200 bg-white p-5" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Administrare raport grila #{activeReport.order_index ?? "-"} · legacy {activeReport.legacy_id ?? "-"}</h3>
                <button type="button" onClick={closeReportAdmin} className="rounded border border-zinc-300 px-3 py-1 text-sm">Inchide</button>
              </div>
              {reportModalError ? <p className="mb-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{reportModalError}</p> : null}
              {reportModalLoading ? (
                <p className="text-sm text-zinc-600">Se incarca...</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <section className="space-y-3 rounded-xl border border-zinc-200 p-3">
                    <p className="text-xs text-zinc-600">
                      Raportat de: <strong>{activeReport.user_email ?? "-"}</strong> · {new Date(activeReport.created_at).toLocaleString("ro-RO")}
                    </p>
                    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">{activeReport.message}</article>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-zinc-800">Imagine grila</p>
                      {reportPendingImagePreview || activeReportContent?.image_url ? (
                        <div className="max-h-[52vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                          <GrilaImage src={reportPendingImagePreview ?? activeReportContent?.image_url ?? ""} alt="grila" className="max-h-[50vh]" />
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-sm text-zinc-500">Nu exista imagine.</p>
                      )}
                      <label className="mt-2 inline-flex cursor-pointer rounded border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-900">
                        <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleReportImageChange} />
                        {reportPendingImageFile ? "Schimba imaginea selectata" : "Incarca imagine noua"}
                      </label>
                    </div>
                  </section>
                  <section className="space-y-3 rounded-xl border border-zinc-200 p-3">
                    <label className="block text-sm font-medium text-zinc-800">
                      Raspuns corect
                      <input value={reportAnswer} onChange={(e) => setReportAnswer(e.target.value.toUpperCase())} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm uppercase" />
                    </label>
                    <label className="block text-sm font-medium text-zinc-800">
                      Indicatie
                      <textarea value={reportHint} onChange={(e) => setReportHint(e.target.value)} className="mt-1 h-20 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm font-medium text-zinc-800">
                      Explicatie scurta
                      <textarea value={reportShortExplanation} onChange={(e) => setReportShortExplanation(e.target.value)} className="mt-1 h-24 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm font-medium text-zinc-800">
                      Explicatie lunga
                      <textarea value={reportFullExplanation} onChange={(e) => setReportFullExplanation(e.target.value)} className="mt-1 h-28 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm font-medium text-zinc-800">
                      Link video
                      <input value={reportVideoUrl} onChange={(e) => setReportVideoUrl(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="block text-sm font-medium text-zinc-800">
                      Mesaj catre elev (email)
                      <textarea
                        value={reportResolutionMessage}
                        onChange={(e) => setReportResolutionMessage(e.target.value)}
                        className="mt-1 h-32 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                        placeholder="Scrie daca raportarea a fost corecta, de ce si ce ai modificat."
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button type="button" onClick={() => void saveReportQuestionContent()} disabled={reportModalSaving} className="rounded border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-800">
                        Salveaza grila
                      </button>
                      <button type="button" onClick={() => void resolveReportWithEmail()} disabled={reportModalSaving} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                        {reportModalSaving ? "Se proceseaza..." : "Salveaza + trimite email + rezolva raport"}
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
