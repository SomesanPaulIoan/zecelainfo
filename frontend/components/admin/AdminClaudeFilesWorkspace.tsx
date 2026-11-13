"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, openAuthenticatedDocumentInNewTab } from "@/lib/api";

function resolveApiBaseUrl(): string {
  const rawPublic = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (typeof window !== "undefined") {
    if (!rawPublic) return "";
    if (window.location.protocol === "https:" && rawPublic.startsWith("http://localhost")) return "";
    return rawPublic;
  }
  return rawPublic || "http://127.0.0.1:4000";
}

function AuthenticatedImagePreview({
  fileId,
  alt,
  className,
}: {
  fileId: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      const headers: Record<string, string> = {};
      const token = window.localStorage.getItem("zecelainfo_token");
      if (token) headers.authorization = `Bearer ${token}`;

      const response = await fetch(`${resolveApiBaseUrl()}/api/claude-files/admin/${fileId}/download`, {
        headers,
      });
      if (!response.ok || !active) return;
      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      if (active) setSrc(objectUrl);
    };

    void load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (!src) {
    return <div className={`${className ?? ""} bg-zinc-100`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}

type ClaudeFileCategory = "image" | "pdf" | "code" | "archive" | "other";

type ClaudeReferenceFile = {
  id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  workspace_path: string;
  mime_type: string | null;
  size_bytes: number;
  category: ClaudeFileCategory;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
}

function categoryLabel(category: ClaudeFileCategory): string {
  switch (category) {
    case "image":
      return "Imagine";
    case "pdf":
      return "PDF";
    case "code":
      return "Cod";
    case "archive":
      return "Arhiva";
    default:
      return "Alt tip";
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Nu am putut citi fisierul."));
    };
    reader.onerror = () => reject(new Error("Nu am putut citi fisierul."));
    reader.readAsDataURL(file);
  });
}

async function copyText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function AdminClaudeFilesWorkspace() {
  const [files, setFiles] = useState<ClaudeReferenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: ClaudeReferenceFile[] }>("/api/claude-files/admin/list");
      setFiles(response.data);
      setEditingNotes(
        Object.fromEntries(response.data.map((file) => [file.id, file.notes ?? ""])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca fisierele.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const fileCountText = useMemo(() => `${files.length} fisiere`, [files.length]);

  const handleUpload = async (selectedFiles: FileList | File[]) => {
    const list = Array.from(selectedFiles);
    if (list.length === 0) return;

    setUploading(true);
    setError(null);
    setMessage(null);

    let uploaded = 0;
    try {
      for (const file of list) {
        if (file.size > 30 * 1024 * 1024) {
          throw new Error(`"${file.name}" depaseste limita de 30 MB.`);
        }
        const file_base64 = await readFileAsDataUrl(file);
        await apiFetch("/api/claude-files/admin/upload", {
          method: "POST",
          body: JSON.stringify({
            file_name: file.name,
            file_base64,
            notes: uploadNotes.trim() || undefined,
          }),
        });
        uploaded += 1;
      }
      setMessage(
        uploaded === 1
          ? "Fisier incarcat. Copiaza calea din lista si o poti da ca referinta in chat."
          : `${uploaded} fisiere incarcate.`,
      );
      setUploadNotes("");
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca fisierul.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNotes = async (fileId: string) => {
    setBusyFileId(fileId);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/claude-files/admin/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: editingNotes[fileId] ?? "" }),
      });
      setMessage("Notite salvate.");
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut salva notitele.");
    } finally {
      setBusyFileId(null);
    }
  };

  const handleDelete = async (file: ClaudeReferenceFile) => {
    if (
      !window.confirm(
        `Stergi fisierul "${file.original_name}"? Nu il vei mai putea folosi ca referinta.`,
      )
    ) {
      return;
    }

    setBusyFileId(file.id);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/claude-files/admin/${file.id}`, { method: "DELETE" });
      setMessage("Fisier sters.");
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut sterge fisierul.");
    } finally {
      setBusyFileId(null);
    }
  };

  const handleCopyPath = async (file: ClaudeReferenceFile) => {
    try {
      await copyText(file.workspace_path);
      setMessage(`Cale copiata: ${file.workspace_path}`);
    } catch {
      setError("Nu am putut copia calea in clipboard.");
    }
  };

  const handleCopyPrompt = async (file: ClaudeReferenceFile) => {
    const notePart = file.notes?.trim() ? ` Context: ${file.notes.trim()}` : "";
    const prompt = `Foloseste ca referinta fisierul @${file.workspace_path}.${notePart}`;
    try {
      await copyText(prompt);
      setMessage("Prompt copiat — lipeste-l in chat-ul cu AI.");
    } catch {
      setError("Nu am putut copia promptul.");
    }
  };

  const handlePreview = async (file: ClaudeReferenceFile) => {
    try {
      await openAuthenticatedDocumentInNewTab(`/api/claude-files/admin/${file.id}/download`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut deschide fisierul.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
        <p className="text-sm font-semibold text-violet-950">Cum folosesti zona asta</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-violet-900/90">
          <li>Incarci poze, PDF-uri sau fisiere cu cod.</li>
          <li>Copiezi calea sau promptul gata facut din lista.</li>
          <li>Il dai in chat cand imi ceri ceva — ex: „Foloseste @Zece la Info/claude-files/...”.</li>
        </ol>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900">Incarca fisiere</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Acceptate: imagini, PDF, cod sursa, text, ZIP. Max 30 MB per fisier.
        </p>

        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Notite pentru urmatoarele upload-uri (optional)
          <textarea
            value={uploadNotes}
            onChange={(event) => setUploadNotes(event.target.value)}
            placeholder="Ex: mockup pagina curs, barem subiect 3, cod sursa vechi"
            className="mt-1 h-20 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
          />
        </label>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 px-6 py-10 text-center transition hover:border-violet-300 hover:bg-violet-50/70">
          <input
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const selected = event.target.files;
              if (selected?.length) void handleUpload(selected);
              event.target.value = "";
            }}
          />
          <p className="text-sm font-semibold text-violet-900">
            {uploading ? "Se incarca..." : "Click sau trage fisiere aici"}
          </p>
          <p className="mt-1 text-xs text-violet-800/80">Poti selecta mai multe fisiere odata</p>
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Fisiere incarcate</h2>
            <p className="text-sm text-zinc-600">{fileCountText}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadFiles()}
            disabled={loading}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            {loading ? "Se incarca..." : "Reincarca"}
          </button>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-600">Se incarca lista...</p> : null}

        {!loading && files.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">Nu ai incarcat inca niciun fisier de referinta.</p>
        ) : null}

        <div className="mt-4 space-y-4">
          {files.map((file) => {
            const busy = busyFileId === file.id;
            const isImage = file.category === "image";
            return (
              <article
                key={file.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900">{file.original_name}</p>
                      <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                        {categoryLabel(file.category)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatBytes(file.size_bytes)} · {formatDate(file.created_at)}
                    </p>
                    <p className="mt-2 break-all rounded-lg border border-violet-100 bg-white px-3 py-2 font-mono text-xs text-violet-900">
                      {file.workspace_path}
                    </p>
                  </div>

                  {isImage ? (
                    <button
                      type="button"
                      onClick={() => void handlePreview(file)}
                      className="shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white"
                      title="Previzualizare"
                    >
                      <AuthenticatedImagePreview
                        fileId={file.id}
                        alt={file.original_name}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  ) : null}
                </div>

                <label className="mt-3 block text-xs font-medium text-zinc-700">
                  Notite (context pentru AI)
                  <textarea
                    value={editingNotes[file.id] ?? ""}
                    onChange={(event) =>
                      setEditingNotes((prev) => ({ ...prev, [file.id]: event.target.value }))
                    }
                    placeholder="Ex: design tinta pentru pagina de login"
                    className="mt-1 h-16 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-violet-400 focus:ring-2"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyPath(file)}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100"
                  >
                    Copiaza calea
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyPrompt(file)}
                    className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100"
                  >
                    Copiaza prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePreview(file)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Deschide
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveNotes(file.id)}
                    disabled={busy}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    Salveaza notite
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(file)}
                    disabled={busy}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    Sterge
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
