"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CourseResourcesZipMeta = {
  file_name: string | null;
  size_bytes: number | null;
  updated_at: string | null;
};

type AdminCourseRow = {
  id: string;
  slug: string;
  name: string;
  is_published: boolean;
  resources_zip: CourseResourcesZipMeta | null;
};

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdatedAt(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
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

export function AdminCoursesWorkspace() {
  const [courses, setCourses] = useState<AdminCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: AdminCourseRow[] }>("/api/courses/admin/list");
      setCourses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca cursurile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleUpload = async (courseId: string, file: File) => {
    if (!/\.zip$/i.test(file.name)) {
      setError("Doar fisiere .zip sunt acceptate.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("Arhiva depaseste limita de 30 MB.");
      return;
    }

    setBusyCourseId(courseId);
    setError(null);
    setMessage(null);
    try {
      const file_base64 = await readFileAsDataUrl(file);
      await apiFetch(`/api/courses/admin/${courseId}/resources-zip`, {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, file_base64 }),
      });
      setMessage(`Arhiva a fost incarcata pentru cursul selectat.`);
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca arhiva.");
    } finally {
      setBusyCourseId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm("Stergi arhiva ZIP pentru acest curs? Elevii nu o vor mai putea descarca.")) return;

    setBusyCourseId(courseId);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/courses/admin/${courseId}/resources-zip`, { method: "DELETE" });
      setMessage("Arhiva a fost stearsa.");
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut sterge arhiva.");
    } finally {
      setBusyCourseId(null);
    }
  };

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {loading ? <p className="text-sm text-slate-600">Se incarca cursurile...</p> : null}

      {!loading && courses.length === 0 ? (
        <p className="text-sm text-slate-600">Nu exista cursuri in baza de date.</p>
      ) : null}

      <div className="space-y-4">
        {courses.map((course) => {
          const zip = course.resources_zip;
          const busy = busyCourseId === course.id;
          return (
            <article
              key={course.id}
              className="rounded-2xl border border-sky-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{course.slug}</p>
                  <h2 className="mt-1 text-lg font-bold text-sky-950">{course.name}</h2>
                  <p className="mt-1 text-xs text-slate-600">
                    {course.is_published ? "Publicat" : "Nepublicat"} · ID {course.id.slice(0, 8)}…
                  </p>
                </div>
                <a
                  href={`/cursuri/${course.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-50"
                >
                  Vezi pagina curs
                </a>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Arhiva resurse (ZIP)</p>
                <p className="mt-1 text-xs text-slate-600">
                  Elevii care detin cel putin o parte din curs pot descarca arhiva din sectiunea „Structura pe parti”.
                </p>

                {zip ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
                    <p>
                      <span className="font-semibold">Fisier:</span> {zip.file_name ?? "resurse.zip"}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Marime:</span> {formatBytes(zip.size_bytes)}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Actualizat:</span> {formatUpdatedAt(zip.updated_at)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Nicio arhiva incarcata.</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label
                    className={`inline-flex cursor-pointer rounded-xl border border-sky-300/50 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 ${
                      busy ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    {busy ? "Se proceseaza..." : zip ? "Inlocuieste ZIP" : "Incarca ZIP"}
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      className="sr-only"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleUpload(course.id, file);
                      }}
                    />
                  </label>
                  {zip ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(course.id)}
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    >
                      Sterge arhiva
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
