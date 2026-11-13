"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { ModalPortal } from "@/components/ui/ModalPortal";

export type GrilaAdminContent = {
  id: string;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  video_url: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  questionId: string;
  onSaved?: (content: GrilaAdminContent) => void;
};

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function withCacheBust(url: string | null): string | null {
  if (!url) return null;
  if (!url.startsWith("/uploads/grile-questions/")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
}

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

export function GrilaAdminContentModal({ open, onClose, questionId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [shortExplanation, setShortExplanation] = useState("");
  const [fullExplanation, setFullExplanation] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingImagePreview) return;
    return () => URL.revokeObjectURL(pendingImagePreview);
  }, [pendingImagePreview]);

  useEffect(() => {
    if (!open || !questionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPendingImageFile(null);
    setPendingImagePreview(null);
    void apiFetch<{ data: GrilaAdminContent }>(`/api/grile/admin/questions/${questionId}/content`)
      .then((response) => {
        if (cancelled) return;
        const row = response.data;
        setAnswer(row.answer ?? "");
        setHint(row.hint ?? "");
        setShortExplanation(row.short_explanation ?? "");
        setFullExplanation(row.full_explanation ?? "");
        setVideoUrl(row.video_url ?? "");
        setImageUrl(row.image_url);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Nu am putut incarca continutul.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, questionId]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setError("Format neacceptat. Foloseste PNG, JPG, WEBP sau GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Imaginea depaseste limita de 15 MB.");
      return;
    }
    setError(null);
    setPendingImageFile(file);
    setPendingImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string | null> = {
        answer: answer.trim().toUpperCase(),
        hint,
        short_explanation: shortExplanation,
        full_explanation: fullExplanation,
        video_url: videoUrl.trim() === "" ? null : videoUrl.trim(),
      };
      if (pendingImageFile) {
        payload.image_file_name = pendingImageFile.name;
        payload.image_base64 = await readFileAsBase64(pendingImageFile);
      }
      const response = await apiFetch<{ data: GrilaAdminContent }>(`/api/grile/admin/questions/${questionId}/content`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const saved = {
        ...response.data,
        image_url: withCacheBust(response.data.image_url),
      };
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva modificarile.");
    } finally {
      setSaving(false);
    }
  };

  const previewSrc = pendingImagePreview ?? imageUrl;

  if (!open) return null;

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Admin</p>
            <h3 className="text-lg font-semibold text-slate-900">Administrare grila</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Inchide
          </button>
        </div>

        {loading ? <p className="text-sm text-slate-600">Se incarca...</p> : null}
        {error ? <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        {!loading ? (
          <div className="space-y-4">
            <div className="block text-sm">
              <span className="font-semibold text-slate-800">Imagine grila</span>
              {previewSrc ? (
                <div className="mt-2 max-h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <GrilaImage src={previewSrc} alt="Previzualizare grila" className="max-h-56" />
                </div>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  Nu exista imagine pentru aceasta grila.
                </p>
              )}
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
                {pendingImageFile ? "Schimba imaginea selectata" : "Incarca imagine noua"}
              </label>
              {pendingImageFile ? (
                <p className="mt-1 text-xs text-slate-500">
                  Fisier nou: {pendingImageFile.name} ({(pendingImageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP sau GIF, maxim 15 MB.</p>
            </div>
            <label className="block text-sm">
              <span className="font-semibold text-slate-800">Raspuns corect (barem)</span>
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase"
                placeholder="Ex: AB"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-800">Indicatie</span>
              <textarea
                value={hint}
                onChange={(event) => setHint(event.target.value)}
                className="mt-1 h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-800">Explicatie scurta</span>
              <textarea
                value={shortExplanation}
                onChange={(event) => setShortExplanation(event.target.value)}
                className="mt-1 h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-800">Explicatie lunga</span>
              <textarea
                value={fullExplanation}
                onChange={(event) => setFullExplanation(event.target.value)}
                className="mt-1 h-36 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-slate-800">Link video</span>
              <input
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Anuleaza
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {saving ? "Se salveaza..." : "Salveaza"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
    </ModalPortal>
  );
}
