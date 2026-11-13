"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BAC_PDF_ONLY_MESSAGE, isAcceptedBacPdfFile } from "@/lib/bacPdfUpload";

type BacSubjectRow = {
  id: number;
  name: string;
  year: number | null;
  tip: "antrenament" | "oficial";
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
  price_lei: number;
  status: "draft" | "published";
  profile_id: number | null;
  created_at: string;
};

type OfficialPhase = "model" | "simulare" | "vara" | "toamna" | "speciala";

const YEAR_OPTIONS = [2026, 2025, 2024, 2023, 2022, 2021, 2020];

const OFFICIAL_PHASES: Array<{ value: OfficialPhase; label: string }> = [
  { value: "model", label: "Model" },
  { value: "simulare", label: "Simulare" },
  { value: "vara", label: "Vara" },
  { value: "toamna", label: "Toamna" },
  { value: "speciala", label: "Speciala" },
];

function getProfileLabel(profileId: number) {
  if (profileId === 1) return "Mate-Info";
  if (profileId === 2) return "Stiinte ale Naturii";
  return `Profil ${profileId}`;
}

function getProfileSuffix(profileId: number) {
  return profileId === 1 ? "MI" : "SN";
}

function buildSubjectName(params: {
  tip: "oficial" | "antrenament";
  year: number;
  profileId: number;
  phase: OfficialPhase;
  variant: number;
}) {
  const profileLabel = getProfileLabel(params.profileId);
  if (params.tip === "oficial") {
    const phaseLabel = OFFICIAL_PHASES.find((entry) => entry.value === params.phase)?.label ?? "Oficial";
    return `Subiect BAC Informatica ${phaseLabel} ${profileLabel} ${params.year}`;
  }
  return `Subiect antrenament BAC Informatica varianta ${params.variant} ${profileLabel} ${params.year}`;
}

function suggestPdfNames(params: {
  tip: "oficial" | "antrenament";
  profileId: number;
  phase: OfficialPhase;
  variant: number;
}) {
  const suffix = getProfileSuffix(params.profileId);
  if (params.tip === "oficial") {
    const phaseCapitalized = params.phase.charAt(0).toUpperCase() + params.phase.slice(1);
    return {
      subject: `Subiect${phaseCapitalized}${suffix}.pdf`,
      barem: `Barem${phaseCapitalized}${suffix}.pdf`,
    };
  }
  const variantPadded = String(params.variant).padStart(2, "0");
  return {
    subject: `subiect-var${variantPadded}-${suffix}.pdf`,
    barem: `barem-var${variantPadded}-${suffix}.pdf`,
  };
}

async function readFileAsDataUrl(file: File): Promise<string> {
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

export function AdminBacSubjectsWorkspace() {
  const [subjects, setSubjects] = useState<BacSubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(2026);
  const [tip, setTip] = useState<"oficial" | "antrenament">("oficial");
  const [profileId, setProfileId] = useState(1);
  const [phase, setPhase] = useState<OfficialPhase>("model");
  const [variant, setVariant] = useState(1);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [subjectFile, setSubjectFile] = useState<File | null>(null);
  const [baremFile, setBaremFile] = useState<File | null>(null);

  const suggestedName = useMemo(
    () => buildSubjectName({ tip, year, profileId, phase, variant }),
    [tip, year, profileId, phase, variant],
  );

  const suggestedPdfNames = useMemo(
    () => suggestPdfNames({ tip, profileId, phase, variant }),
    [tip, profileId, phase, variant],
  );

  useEffect(() => {
    if (!nameTouched) {
      setName(suggestedName);
    }
  }, [suggestedName, nameTouched]);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: BacSubjectRow[] }>("/api/bacalaureat/admin/subjects");
      setSubjects(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca subiectele.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const resetForm = () => {
    setYear(2026);
    setTip("oficial");
    setProfileId(1);
    setPhase("model");
    setVariant(1);
    setName("");
    setNameTouched(false);
    setVideoUrl("");
    setPublishNow(true);
    setSubjectFile(null);
    setBaremFile(null);
  };

  const handleCreate = async () => {
    if (!subjectFile) {
      setError("Incarca PDF-ul cu subiectul.");
      return;
    }
    if (!isAcceptedBacPdfFile(subjectFile)) {
      setError(BAC_PDF_ONLY_MESSAGE);
      return;
    }
    if (baremFile && !isAcceptedBacPdfFile(baremFile)) {
      setError(BAC_PDF_ONLY_MESSAGE);
      return;
    }
    if (name.trim().length < 3) {
      setError("Numele subiectului trebuie sa aiba minim 3 caractere.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        year,
        tip,
        profile_id: profileId,
        status: publishNow ? "published" : "draft",
        subject_pdf: {
          file_name: subjectFile.name,
          file_base64: await readFileAsDataUrl(subjectFile),
        },
      };
      if (videoUrl.trim()) {
        payload.video_url = videoUrl.trim();
      }
      if (baremFile) {
        payload.barem_pdf = {
          file_name: baremFile.name,
          file_base64: await readFileAsDataUrl(baremFile),
        };
      }

      const response = await apiFetch<{ data: BacSubjectRow }>("/api/bacalaureat/admin/subjects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        response.data.status === "published"
          ? `Subiectul „${response.data.name}” a fost publicat. Apare in arhiva si la rezolvare subiecte.`
          : `Subiectul „${response.data.name}” a fost salvat ca draft.`,
      );
      resetForm();
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut adauga subiectul.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (subject: BacSubjectRow) => {
    const nextStatus = subject.status === "published" ? "draft" : "published";
    const confirmText =
      nextStatus === "published"
        ? `Publici subiectul „${subject.name}”? Va aparea pe site.`
        : `Retragi subiectul „${subject.name}”? Nu va mai fi vizibil pe site.`;
    if (!window.confirm(confirmText)) return;

    setBusyId(subject.id);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/api/bacalaureat/admin/subjects/${subject.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      setMessage(nextStatus === "published" ? "Subiect publicat." : "Subiect retras (draft).");
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut actualiza statusul.");
    } finally {
      setBusyId(null);
    }
  };

  const publishedCount = subjects.filter((row) => row.status === "published").length;
  const draftCount = subjects.filter((row) => row.status === "draft").length;

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}

      <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-sky-950">Adauga subiect nou</h2>
        <p className="mt-1 text-sm text-slate-600">
          Subiectele publicate apar automat in{" "}
          <Link href="/bacalaureat/arhiva-de-subiecte" className="font-medium text-sky-800 underline">
            Arhiva de subiecte
          </Link>{" "}
          si in{" "}
          <Link href="/bacalaureat/rezolva-subiecte" className="font-medium text-sky-800 underline">
            Rezolva subiecte
          </Link>
          .
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            An
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
            >
              {YEAR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Tip subiect
            <select
              value={tip}
              onChange={(event) => setTip(event.target.value as "oficial" | "antrenament")}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
            >
              <option value="oficial">Oficial</option>
              <option value="antrenament">Antrenament</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Profil
            <select
              value={profileId}
              onChange={(event) => setProfileId(Number(event.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
            >
              <option value={1}>Mate-Info</option>
              <option value={2}>Stiinte ale Naturii</option>
            </select>
          </label>

          {tip === "oficial" ? (
            <label className="text-sm font-medium text-slate-700">
              Sesiune / faza
              <select
                value={phase}
                onChange={(event) => setPhase(event.target.value as OfficialPhase)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
              >
                {OFFICIAL_PHASES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-sm font-medium text-slate-700">
              Varianta
              <input
                type="number"
                min={1}
                max={99}
                value={variant}
                onChange={(event) => setVariant(Math.max(1, Number(event.target.value) || 1))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
              />
            </label>
          )}

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Nume afisat pe site
            <input
              value={name}
              onChange={(event) => {
                setNameTouched(true);
                setName(event.target.value);
              }}
              placeholder={suggestedName}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
            />
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-3">
            Video rezolvare (optional, Vimeo)
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://vimeo.com/..."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 p-4 text-sm font-medium text-slate-700">
            PDF Subiect *
            <p className="mt-1 text-xs font-normal text-slate-500">Sugestie nume: {suggestedPdfNames.subject}</p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setSubjectFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-xs"
            />
            {subjectFile ? <p className="mt-2 text-xs text-emerald-700">Selectat: {subjectFile.name}</p> : null}
          </label>

          <label className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4 text-sm font-medium text-slate-700">
            PDF Barem
            <p className="mt-1 text-xs font-normal text-slate-500">Sugestie nume: {suggestedPdfNames.barem}</p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setBaremFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-xs"
            />
            {baremFile ? <p className="mt-2 text-xs text-emerald-700">Selectat: {baremFile.name}</p> : null}
          </label>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(event) => setPublishNow(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          Publica imediat pe site
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={submitting}
            className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {submitting ? "Se incarca..." : "Adauga subiect"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Reseteaza formular
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subiecte existente</h2>
            <p className="mt-1 text-sm text-slate-600">
              {publishedCount} publicate • {draftCount} draft
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSubjects()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Se incarca..." : "Reincarca"}
          </button>
        </div>

        <div className="mt-4 max-h-[520px] space-y-2 overflow-auto">
          {loading ? <p className="text-sm text-slate-500">Se incarca lista...</p> : null}
          {!loading && subjects.length === 0 ? <p className="text-sm text-slate-500">Nu exista subiecte inca.</p> : null}
          {subjects.map((subject) => (
            <article key={subject.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    #{subject.id} • {subject.year ?? "—"} • {subject.tip} •{" "}
                    {subject.profile_id ? getProfileLabel(subject.profile_id) : "Profil —"} •{" "}
                    <span
                      className={
                        subject.status === "published" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"
                      }
                    >
                      {subject.status === "published" ? "Publicat" : "Draft"}
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <a href={subject.subject_pdf_url} target="_blank" rel="noreferrer" className="text-sky-800 underline">
                      PDF subiect
                    </a>
                    {subject.barem_pdf_url ? (
                      <a href={subject.barem_pdf_url} target="_blank" rel="noreferrer" className="text-sky-800 underline">
                        PDF barem
                      </a>
                    ) : null}
                    {subject.status === "published" ? (
                      <Link href={`/bacalaureat/subiect/${subject.id}`} className="text-sky-800 underline">
                        Pagina rezolvare
                      </Link>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleStatus(subject)}
                  disabled={busyId === subject.id}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    subject.status === "published"
                      ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {busyId === subject.id ? "..." : subject.status === "published" ? "Retrage" : "Publica"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
