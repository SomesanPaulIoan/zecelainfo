"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/api";
import { GrilaAdminContentModal } from "@/components/grile/GrilaAdminContentModal";

type Category = { id: string; slug: string; name: string };
type Chapter = { id: string; name: string };
type SourceRow = {
  id: string;
  name: string;
  is_published: boolean;
  published_at: string | null;
  order_index: number | null;
  default_variants_count: number;
  question_count: number;
  ai_done_count: number;
  exam_mode_enabled?: boolean;
};

type QuestionRow = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  answer: string | null;
  video_url: string | null;
  order_index: number | null;
  variants_count: number | null;
  chapter_ids: string[];
  chapter_names: string[];
  ai_processing_status: string | null;
  ai_needs_review: boolean | null;
};

type QuestionDraft = {
  answer: string;
  video_url: string;
  chapter_ids: string[];
  saving: boolean;
  aiRunning: boolean;
  contentModalOpen: boolean;
};

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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
}

export function AdminGrileSourcesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [selectedSourceMeta, setSelectedSourceMeta] = useState<SourceRow | null>(null);

  const [newSourceName, setNewSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchAiRunning, setBatchAiRunning] = useState(false);
  const [batchLog, setBatchLog] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examModeSaving, setExamModeSaving] = useState(false);
  const [reorderingSources, setReorderingSources] = useState(false);
  const [variantsDraft, setVariantsDraft] = useState(4);
  const [variantsSaving, setVariantsSaving] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>({});

  const sourcesDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const selectedSource = useMemo(
    () => sources.find((s) => s.id === selectedSourceId) ?? selectedSourceMeta,
    [sources, selectedSourceId, selectedSourceMeta],
  );

  useEffect(() => {
    setVariantsDraft(selectedSource?.default_variants_count ?? 4);
  }, [selectedSource?.id, selectedSource?.default_variants_count]);

  const loadCategories = useCallback(async () => {
    const response = await apiFetch<{ data: Category[] }>("/api/grile/categories");
    setCategories(response.data ?? []);
  }, []);

  const loadCategorySources = useCallback(async (slug: string) => {
    if (!slug) {
      setSources([]);
      setChapters([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: { category: Category; sources: SourceRow[]; chapters: Chapter[] };
      }>(`/api/grile/admin/categories/${slug}/sources`);
      setSources(response.data.sources ?? []);
      setChapters(response.data.chapters ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca sursele.");
      setSources([]);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSourceQuestions = useCallback(async (sourceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: { source: SourceRow; questions: QuestionRow[] };
      }>(`/api/grile/admin/sources/${sourceId}/questions`);
      setSelectedSourceMeta(response.data.source);
      setQuestions(response.data.questions ?? []);
      const nextDrafts: Record<string, QuestionDraft> = {};
      for (const q of response.data.questions ?? []) {
        nextDrafts[q.id] = {
          answer: q.answer ?? "",
          video_url: q.video_url ?? "",
          chapter_ids: q.chapter_ids ?? [],
          saving: false,
          aiRunning: false,
          contentModalOpen: false,
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca grilele sursei.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setSelectedSourceId(null);
    setQuestions([]);
    setSelectedSourceMeta(null);
    void loadCategorySources(selectedCategorySlug);
  }, [selectedCategorySlug, loadCategorySources]);

  useEffect(() => {
    if (!selectedSourceId) return;
    void loadSourceQuestions(selectedSourceId);
  }, [selectedSourceId, loadSourceQuestions]);

  const handleCreateSource = async () => {
    if (!selectedCategorySlug || !newSourceName.trim()) return;
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch<{ data: SourceRow }>("/api/grile/admin/sources", {
        method: "POST",
        body: JSON.stringify({ category_slug: selectedCategorySlug, name: newSourceName.trim() }),
      });
      setNewSourceName("");
      setMessage("Sursa a fost creata ca draft.");
      await loadCategorySources(selectedCategorySlug);
      setSelectedSourceId(response.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut crea sursa.");
    }
  };

  const handlePublishSource = async () => {
    if (!selectedSourceId) return;
    if (!window.confirm("Publici sursa pentru toti utilizatorii?")) return;
    try {
      await apiFetch(`/api/grile/admin/sources/${selectedSourceId}/publish`, { method: "POST" });
      setMessage("Sursa a fost publicata.");
      await loadCategorySources(selectedCategorySlug);
      await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut publica sursa.");
    }
  };

  const handleUnpublishSource = async () => {
    if (!selectedSourceId) return;
    if (!window.confirm("Retragi sursa din catalogul public?")) return;
    try {
      await apiFetch(`/api/grile/admin/sources/${selectedSourceId}/unpublish`, { method: "POST" });
      setMessage("Sursa a revenit la draft.");
      await loadCategorySources(selectedCategorySlug);
      await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut retrage sursa.");
    }
  };

  const handleToggleExamMode = async (enabled: boolean) => {
    if (!selectedSourceId) return;
    setExamModeSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/grile/admin/sources/${selectedSourceId}/exam-mode`, {
        method: "PATCH",
        body: JSON.stringify({ mode_enabled: enabled }),
      });
      setMessage(enabled ? "Mod Examen activat pentru aceasta sursa." : "Mod Examen dezactivat pentru aceasta sursa.");
      await loadCategorySources(selectedCategorySlug);
      if (selectedSourceId) await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut actualiza Mod Examen.");
    } finally {
      setExamModeSaving(false);
    }
  };

  const handleSourcesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sources.findIndex((s) => s.id === active.id);
    const newIndex = sources.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sources, oldIndex, newIndex);
    setSources(reordered);
    setReorderingSources(true);
    setError(null);
    try {
      await apiFetch(`/api/grile/admin/categories/${selectedCategorySlug}/sources/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ source_ids: reordered.map((s) => s.id) }),
      });
      setMessage("Ordinea surselor a fost salvata.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva ordinea surselor.");
      await loadCategorySources(selectedCategorySlug);
    } finally {
      setReorderingSources(false);
    }
  };

  const handleUpdateVariantsCount = async () => {
    if (!selectedSourceId) return;
    if (
      !window.confirm(
        `Setezi ${variantsDraft} variante de raspuns pentru toate grilele existente din aceasta sursa?`,
      )
    ) {
      return;
    }
    setVariantsSaving(true);
    setError(null);
    try {
      const response = await apiFetch<{
        data: { default_variants_count: number; updated_questions: number };
      }>(`/api/grile/admin/sources/${selectedSourceId}/variants-count`, {
        method: "PATCH",
        body: JSON.stringify({ variants_count: variantsDraft }),
      });
      setMessage(
        `Numar variante actualizat la ${response.data.default_variants_count} pentru ${response.data.updated_questions} grile.`,
      );
      await loadCategorySources(selectedCategorySlug);
      await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut actualiza numarul de variante.");
    } finally {
      setVariantsSaving(false);
    }
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!selectedSourceId) return;
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const payloadFiles: Array<{ file_name: string; file_base64: string }> = [];
      for (const file of list) {
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
          throw new Error(`Format neacceptat pentru ${file.name}.`);
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${file.name} depaseste 15 MB.`);
        }
        payloadFiles.push({
          file_name: file.name,
          file_base64: await readFileAsBase64(file),
        });
      }
      await apiFetch(`/api/grile/admin/sources/${selectedSourceId}/questions/bulk`, {
        method: "POST",
        body: JSON.stringify({ files: payloadFiles }),
      });
      setMessage(`${payloadFiles.length} grile incarcate si procesate (1000x700 + watermark).`);
      await loadSourceQuestions(selectedSourceId);
      await loadCategorySources(selectedCategorySlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca imaginile.");
    } finally {
      setUploading(false);
    }
  };

  const updateDraft = (questionId: string, patch: Partial<QuestionDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));
  };

  const saveQuestionMeta = async (questionId: string) => {
    const draft = drafts[questionId];
    if (!draft) return;
    updateDraft(questionId, { saving: true });
    setError(null);
    try {
      await apiFetch(`/api/grile/admin/questions/${questionId}/meta`, {
        method: "PATCH",
        body: JSON.stringify({
          answer: draft.answer.trim().toUpperCase(),
          video_url: draft.video_url.trim() === "" ? null : draft.video_url.trim(),
          chapter_ids: draft.chapter_ids,
        }),
      });
      setMessage("Grila salvata.");
      if (selectedSourceId) await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva grila.");
    } finally {
      updateDraft(questionId, { saving: false });
    }
  };

  const runAiForQuestion = async (questionId: string) => {
    updateDraft(questionId, { aiRunning: true });
    setError(null);
    try {
      await apiFetch("/api/grile/admin/ai/process-one", {
        method: "POST",
        body: JSON.stringify({ questionId, forceRegenerate: false }),
      });
      setMessage("AI generat pentru grila selectata.");
      if (selectedSourceId) await loadSourceQuestions(selectedSourceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut rula AI pe grila.");
    } finally {
      updateDraft(questionId, { aiRunning: false });
    }
  };

  const runAiForWholeSource = async () => {
    if (!selectedSourceId || batchAiRunning) return;
    setBatchAiRunning(true);
    setBatchLog([]);
    setError(null);
    try {
      const chunkSize = 1;
      let keepGoing = true;
      while (keepGoing) {
        const response = await apiFetch<{
          data: {
            processedCount: number;
            successCount: number;
            errorCount: number;
            results: Array<{ questionId: string; ok: boolean; error?: string }>;
          };
        }>("/api/grile/admin/ai/process-batch", {
          method: "POST",
          body: JSON.stringify({
            limit: chunkSize,
            sourceId: selectedSourceId,
            forceRegenerate: false,
            includeAlreadyGenerated: false,
          }),
        });
        const data = response.data;
        if (data.processedCount === 0) {
          keepGoing = false;
          continue;
        }
        setBatchLog((prev) => [
          ...data.results.map((r) => `${r.ok ? "OK" : "ERR"} ${r.questionId.slice(0, 8)}${r.error ? `: ${r.error}` : ""}`),
          ...prev,
        ].slice(0, 20));
        if (data.processedCount < chunkSize) keepGoing = false;
      }
      setMessage("Batch AI finalizat pentru sursa.");
      await loadSourceQuestions(selectedSourceId);
      await loadCategorySources(selectedCategorySlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut rula batch AI.");
    } finally {
      setBatchAiRunning(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm("Stergi aceasta grila?")) return;
    try {
      await apiFetch(`/api/grile/admin/questions/${questionId}`, { method: "DELETE" });
      setMessage("Grila stearsa.");
      if (selectedSourceId) {
        await loadSourceQuestions(selectedSourceId);
        await loadCategorySources(selectedCategorySlug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut sterge grila.");
    }
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-zinc-900">1. Selecteaza categoria</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategorySlug(category.slug)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                selectedCategorySlug === category.slug
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {selectedCategorySlug ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-zinc-900">2. Surse din categorie</h2>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <input
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              placeholder="Nume sursa noua (draft)"
              className="min-w-[240px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleCreateSource()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Adauga sursa
            </button>
          </div>

          {loading && !selectedSourceId ? <p className="mt-3 text-sm text-zinc-600">Se incarca...</p> : null}

          <p className="mt-3 text-xs text-zinc-500">
            Trage o sursa peste alta ca sa schimbi ordinea in care le vad elevii.
            {reorderingSources ? " Se salveaza..." : null}
          </p>

          <DndContext
            sensors={sourcesDndSensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => void handleSourcesDragEnd(event)}
          >
            <SortableContext items={sources.map((source) => source.id)} strategy={rectSortingStrategy}>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {sources.map((source) => (
                  <SortableSourceCard
                    key={source.id}
                    source={source}
                    selected={selectedSourceId === source.id}
                    onSelect={() => setSelectedSourceId(source.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      ) : null}

      {selectedSourceId && selectedSource ? (
        <section className="rounded-2xl border border-violet-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">3. Editor sursa: {selectedSource.name}</h2>
              <p className="text-sm text-zinc-600">
                Status: {selectedSource.is_published ? "Publicata" : "Draft (invizibila elevilor)"}
                {" · "}
                Mod Examen: {selectedSource.exam_mode_enabled ? "activ" : "inactiv"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={examModeSaving}
                onClick={() => void handleToggleExamMode(!selectedSource.exam_mode_enabled)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                  selectedSource.exam_mode_enabled
                    ? "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
                    : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {examModeSaving
                  ? "Se salveaza..."
                  : selectedSource.exam_mode_enabled
                    ? "Dezactiveaza Mod Examen"
                    : "Activeaza Mod Examen"}
              </button>
              {!selectedSource.is_published ? (
                <button
                  type="button"
                  onClick={() => void handlePublishSource()}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Publica sursa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleUnpublishSource()}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Retrage (draft)
                </button>
              )}
              <button
                type="button"
                disabled={batchAiRunning}
                onClick={() => void runAiForWholeSource()}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-900 disabled:opacity-50"
              >
                {batchAiRunning ? "AI batch..." : "Genereaza AI toata sursa"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <label className="text-sm">
              <span className="block font-semibold text-zinc-800">Numar variante raspuns (A, B, C, ...)</span>
              <select
                value={variantsDraft}
                onChange={(e) => setVariantsDraft(Number(e.target.value))}
                className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={variantsSaving}
              onClick={() => void handleUpdateVariantsCount()}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {variantsSaving ? "Se salveaza..." : "Salveaza pentru toata sursa"}
            </button>
            <p className="w-full text-xs text-zinc-500">
              Se aplica tuturor grilelor existente din aceasta sursa si devine valoarea implicita pentru grilele adaugate ulterior.
            </p>
          </div>

          <div
            className="mt-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void handleUploadFiles(e.dataTransfer.files);
            }}
          >
            <p className="text-sm font-medium text-zinc-800">Trage screenshot-uri aici (PNG/JPG/WEBP/GIF)</p>
            <p className="mt-1 text-xs text-zinc-500">Se redimensioneaza la 1000x700 (fit, fara deformare) + watermark zecelainfo.ro</p>
            <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100">
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) void handleUploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {uploading ? "Se incarca..." : "Selecteaza fisiere"}
            </label>
          </div>

          {batchLog.length > 0 ? (
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs">{batchLog.join("\n")}</pre>
          ) : null}

          <div className="mt-5 space-y-4">
            {questions.length === 0 ? <p className="text-sm text-zinc-600">Nu exista grile in aceasta sursa.</p> : null}
            {questions.map((question) => {
              const draft = drafts[question.id];
              if (!draft) return null;
              return (
                <article key={question.id} className="rounded-xl border border-zinc-200 p-3">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      {question.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={question.image_url} alt="Grila" className="h-auto w-full object-contain" />
                      ) : (
                        <p className="p-4 text-xs text-zinc-500">Fara imagine</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">
                        #{question.order_index ?? "-"} · legacy {question.legacy_id} · AI: {question.ai_processing_status ?? "pending"}
                      </p>
                      <label className="block text-sm">
                        <span className="font-semibold text-zinc-800">Raspuns corect</span>
                        <input
                          value={draft.answer}
                          onChange={(e) => updateDraft(question.id, { answer: e.target.value.toUpperCase() })}
                          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm uppercase"
                          placeholder="Ex: AB"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-zinc-800">Link video Vimeo</span>
                        <input
                          value={draft.video_url}
                          onChange={(e) => updateDraft(question.id, { video_url: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                          placeholder="https://vimeo.com/123456789 (se converteste automat la embed)"
                        />
                      </label>
                      <div className="block text-sm">
                        <span className="font-semibold text-zinc-800">Capitole</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {chapters.map((chapter) => {
                            const checked = draft.chapter_ids.includes(chapter.id);
                            return (
                              <label key={chapter.id} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...draft.chapter_ids, chapter.id]
                                      : draft.chapter_ids.filter((id) => id !== chapter.id);
                                    updateDraft(question.id, { chapter_ids: next });
                                  }}
                                />
                                {chapter.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={draft.saving}
                          onClick={() => void saveQuestionMeta(question.id)}
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {draft.saving ? "Se salveaza..." : "Salveaza"}
                        </button>
                        <button
                          type="button"
                          disabled={draft.aiRunning}
                          onClick={() => void runAiForQuestion(question.id)}
                          className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 disabled:opacity-50"
                        >
                          {draft.aiRunning ? "AI..." : "Trimite la OpenAI"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDraft(question.id, { contentModalOpen: true })}
                          className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900"
                        >
                          Indicii / explicatii
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteQuestion(question.id)}
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800"
                        >
                          Sterge
                        </button>
                      </div>
                    </div>
                  </div>
                  <GrilaAdminContentModal
                    open={draft.contentModalOpen}
                    onClose={() => updateDraft(question.id, { contentModalOpen: false })}
                    questionId={question.id}
                  />
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SortableSourceCard({
  source,
  selected,
  onSelect,
}: {
  source: SourceRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: source.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onSelect}
      className={`cursor-grab rounded-xl border p-3 text-left active:cursor-grabbing ${
        selected ? "border-violet-500 bg-violet-50" : "border-zinc-200 bg-zinc-50 hover:bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-zinc-900">{source.name}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {source.exam_mode_enabled ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">Mod Examen</span>
          ) : null}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              source.is_published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {source.is_published ? "Publicata" : "Draft"}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-zinc-600">
        {source.question_count} grile · AI done: {source.ai_done_count}
      </p>
    </button>
  );
}
