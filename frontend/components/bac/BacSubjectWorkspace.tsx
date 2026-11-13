"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BacPdfPreview } from "@/components/bac/BacPdfPreview";
import { apiFetch } from "@/lib/api";
import { BAC_PDF_ONLY_MESSAGE, isAcceptedBacPdfFile } from "@/lib/bacPdfUpload";
import useSWR from "swr";

type BacSubject = {
  id: number;
  name: string;
  year: number | null;
  tip: "antrenament" | "oficial";
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
};

type BacSubjectResponse = { data: BacSubject };

export function BacSubjectWorkspace({ subjectId }: { subjectId: string }) {
  const [simulationStartedAt, setSimulationStartedAt] = useState<number | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useSWR<BacSubjectResponse>(`/api/bacalaureat/subjects/${subjectId}`, apiFetch);
  const subject = data?.data;

  useEffect(() => {
    if (!pendingFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingFile]);

  const previewSrc = uploadedPdfUrl ?? localPreviewUrl;
  const isSavedOnServer = Boolean(uploadedPdfUrl);

  const remainingMinutes = useMemo(() => {
    if (!subject || !simulationStartedAt) return subject?.duration_minutes ?? 180;
    const elapsed = (Date.now() - simulationStartedAt) / 1000 / 60;
    return Math.max(0, Math.ceil(subject.duration_minutes - elapsed));
  }, [subject, simulationStartedAt]);

  const startSimulation = async () => {
    if (!subject) return;
    setError(null);
    setFeedback(null);
    try {
      const numericSubjectId = Number(subject.id);
      const response = await apiFetch<{ data: { id: string } }>("/api/bacalaureat/submissions", {
        method: "POST",
        body: JSON.stringify({ subject_id: numericSubjectId }),
      });
      setSubmissionId(response.data.id);
      setSimulationStartedAt(Date.now());
      setFeedback("Simulare pornita. La final, incarca PDF-ul si trimite spre corectare.");
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Nu am putut porni simularea.");
    }
  };

  const uploadPdf = async (file: File) => {
    if (!submissionId) {
      setError("Porneste simularea inainte de upload.");
      return;
    }
    if (!isAcceptedBacPdfFile(file)) {
      setError(BAC_PDF_ONLY_MESSAGE);
      return;
    }
    setError(null);
    setFeedback(null);
    setUploading(true);
    try {
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Nu am putut citi fisierul."));
        reader.readAsDataURL(file);
      });
      const response = await apiFetch<{ data: { file_url: string; file_name: string } }>(
        `/api/bacalaureat/submissions/${submissionId}/upload-pdf`,
        {
          method: "POST",
          body: JSON.stringify({
            file_name: file.name,
            file_base64: fileBase64,
          }),
        },
      );
      setUploadedFileName(response.data.file_name);
      setUploadedPdfUrl(response.data.file_url);
      setPendingFile(null);
      setFeedback("PDF incarcat. Verifica previzualizarea inainte de trimitere spre corectare.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload esuat.");
    } finally {
      setUploading(false);
    }
  };

  const sendForReview = async () => {
    if (!submissionId) return;
    setError(null);
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiFetch(`/api/bacalaureat/submissions/${submissionId}/submit`, { method: "POST" });
      setFeedback("Rezolvarea a fost trimisa spre corectare.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Trimiterea a esuat.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <main className="mx-auto max-w-5xl px-6 py-14 text-sm text-slate-600">Se incarca subiectul...</main>;
  }

  if (!subject) {
    return <main className="mx-auto max-w-5xl px-6 py-14 text-sm text-rose-700">Subiectul nu a fost gasit.</main>;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl px-6 py-14">
      <section className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-sky-950">{subject.name}</h1>
        <p className="mt-2 text-sm text-slate-700">
          {subject.year ?? "An necunoscut"} • {subject.tip} • Durata simulare: {subject.duration_minutes} minute
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={subject.subject_pdf_url} target="_blank" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100">
            Deschide PDF subiect
          </Link>
          {subject.barem_pdf_url ? (
            <Link href={subject.barem_pdf_url} target="_blank" className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-50">
              Vezi baremul
            </Link>
          ) : null}
          {!simulationStartedAt ? (
            <button type="button" onClick={() => void startSimulation()} className="rounded-xl bg-sky-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950">
              Simuleaza
            </button>
          ) : (
            <span className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">Simulare activa • {remainingMinutes} min ramase</span>
          )}
        </div>
      </section>

      {subject.video_url ? (
        <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-sky-950">Video explicativ</h2>
          <iframe
            src={subject.video_url}
            title={`Video ${subject.name}`}
            className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-sky-100"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </section>
      ) : null}

      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-sky-950">Rezolvarea ta (PDF)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Dupa ce termini simularea, incarca PDF-ul rezolvarii. Apoi apasa butonul de trimitere spre corectare.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={!submissionId || uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!isAcceptedBacPdfFile(file)) {
                setError(BAC_PDF_ONLY_MESSAGE);
                event.target.value = "";
                return;
              }
              setError(null);
              setFeedback(null);
              setPendingFile(file);
              if (isSavedOnServer) {
                setUploadedPdfUrl(null);
                setUploadedFileName(null);
              }
            }}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
          <button
            type="button"
            onClick={() => pendingFile && void uploadPdf(pendingFile)}
            disabled={!submissionId || !pendingFile || uploading}
            className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            {uploading ? "Se incarca..." : isSavedOnServer ? "Inlocuieste PDF-ul" : "Salveaza PDF-ul"}
          </button>
          <button
            type="button"
            onClick={() => void sendForReview()}
            disabled={!submissionId || !uploadedPdfUrl || submitting}
            className="rounded-xl bg-sky-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
          >
            {submitting ? "Se trimite..." : "Trimite spre corectare"}
          </button>
        </div>
        {previewSrc ? (
          <BacPdfPreview
            src={previewSrc}
            title={`Rezolvare ${subject.name}`}
            fileName={uploadedFileName ?? pendingFile?.name ?? null}
            hint={isSavedOnServer ? "PDF salvat — verifica inainte de trimitere" : "Previzualizare locala — salveaza PDF-ul"}
          />
        ) : null}
        {uploadedFileName && isSavedOnServer ? <p className="mt-3 text-sm text-emerald-700">PDF incarcat: {uploadedFileName}</p> : null}
        {feedback ? <p className="mt-3 text-sm text-emerald-700">{feedback}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>
    </main>
  );
}
