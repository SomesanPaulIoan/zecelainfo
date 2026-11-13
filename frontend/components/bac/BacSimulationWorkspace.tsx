"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BacPdfPreview } from "@/components/bac/BacPdfPreview";
import { BacPdfScrollViewer } from "@/components/bac/BacPdfScrollViewer";
import { apiFetch } from "@/lib/api";
import { BAC_PDF_ONLY_MESSAGE, isAcceptedBacPdfFile } from "@/lib/bacPdfUpload";
import useSWR, { mutate } from "swr";

type SubmissionDetails = {
  id: string;
  subject_id: number;
  status: "draft" | "submitted" | "reviewed";
  started_at: string | null;
  finished_at: string | null;
  uploaded_pdf_name: string | null;
  uploaded_pdf_public_url: string | null;
  submitted_at: string | null;
  subject_name: string;
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
};

type SubmissionDetailsResponse = { data: SubmissionDetails };

function formatTimer(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BacSimulationWorkspace({ subjectId, submissionId }: { subjectId: string; submissionId: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(3 * 60 * 60);

  const { data, isLoading } = useSWR<SubmissionDetailsResponse>(`/api/bacalaureat/submissions/${submissionId}`, apiFetch);
  const submission = data?.data;

  useEffect(() => {
    if (submission?.uploaded_pdf_public_url) {
      setUploadedPdfUrl(submission.uploaded_pdf_public_url);
      setUploadedFileName(submission.uploaded_pdf_name);
    }
  }, [submission?.uploaded_pdf_public_url, submission?.uploaded_pdf_name]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!submission) return;
    if (submission.status !== "draft") {
      window.location.replace(`/bacalaureat/subiect/${subjectId}`);
    }
  }, [submission, subjectId]);

  useEffect(() => {
    if (!submission?.started_at) {
      setRemainingSeconds(3 * 60 * 60);
      return;
    }
    const startedAtMs = new Date(submission.started_at).getTime();
    const endMs = startedAtMs + 3 * 60 * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((endMs - now) / 1000));
      setRemainingSeconds(diffSec);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [submission?.started_at]);

  const isExpired = remainingSeconds <= 0;
  const isSavedOnServer = Boolean(uploadedPdfUrl);
  const previewSrc = uploadedPdfUrl ?? localPreviewUrl;
  const previewFileName = uploadedFileName ?? selectedFile?.name ?? null;

  const subtitle = useMemo(() => {
    if (!submission) return "";
    return `${submission.subject_name} • Simulare 3 ore`;
  }, [submission]);

  const uploadPdf = async () => {
    if (!selectedFile) {
      setError("Alege mai intai un fisier PDF.");
      return;
    }
    if (!isAcceptedBacPdfFile(selectedFile)) {
      setError(BAC_PDF_ONLY_MESSAGE);
      setSelectedFile(null);
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
        reader.readAsDataURL(selectedFile);
      });
      const response = await apiFetch<{ data: { file_url: string; file_name: string } }>(
        `/api/bacalaureat/submissions/${submissionId}/upload-pdf`,
        {
          method: "POST",
          body: JSON.stringify({
            file_name: selectedFile.name,
            file_base64: fileBase64,
          }),
        },
      );
      setUploadedPdfUrl(response.data.file_url);
      setUploadedFileName(response.data.file_name);
      setSelectedFile(null);
      setFeedback("PDF salvat. Redirectionare catre pagina subiectului...");
      await mutate(`/api/bacalaureat/submissions/${submissionId}`);
      window.setTimeout(() => {
        window.location.href = `/bacalaureat/subiect/${subjectId}`;
      }, 800);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload esuat.");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Se incarca simularea...</main>;
  }

  if (!submission) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-rose-700">Simularea nu a fost gasita.</main>;
  }

  if (submission.status !== "draft") {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm text-slate-600">Redirectionare catre pagina subiectului...</main>;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[1700px] px-3 py-6 sm:px-4 lg:px-6">
      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-sky-950">Rezolva Subiect</h1>
        <p className="mt-1 text-sm text-slate-700">{subtitle}</p>
        <p className={`mt-3 inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${isExpired ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-900"}`}>
          Timer: {formatTimer(remainingSeconds)}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-950">Subiect (PDF)</h2>
          <BacPdfScrollViewer src={submission.subject_pdf_url} title={submission.subject_name} />
        </article>

        <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-sky-950">Incarca rezolvarea ta (PDF)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Incarca fisierul PDF, verifica previzualizarea si apasa Salveaza — vei fi redirectionat automat la pagina subiectului pentru trimitere spre corectare.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={uploading || isExpired}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && !isAcceptedBacPdfFile(file)) {
                  setError(BAC_PDF_ONLY_MESSAGE);
                  setSelectedFile(null);
                  event.target.value = "";
                  return;
                }
                setError(null);
                setFeedback(null);
                setSelectedFile(file ?? null);
                if (file && isSavedOnServer) {
                  setUploadedPdfUrl(null);
                  setUploadedFileName(null);
                }
              }}
              className="cursor-pointer rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              disabled={uploading || isExpired || !selectedFile}
              onClick={() => void uploadPdf()}
              className="rounded-lg bg-sky-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950 disabled:opacity-50"
            >
              {uploading ? "Se salveaza..." : isSavedOnServer ? "Inlocuieste PDF-ul" : "Salveaza rezolvarea"}
            </button>
            {isSavedOnServer ? (
              <Link
                href={`/bacalaureat/subiect/${subjectId}`}
                className="rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:brightness-95"
              >
                Mergi la pagina subiectului
              </Link>
            ) : null}
          </div>
          {previewSrc ? (
            <BacPdfPreview
              src={previewSrc}
              title={`Rezolvare ${submission.subject_name}`}
              fileName={previewFileName}
              hint={isSavedOnServer ? "PDF salvat pe site — verifica inainte de trimitere" : "Previzualizare locala — apasa Salveaza pentru a confirma"}
            />
          ) : null}
          {isExpired ? <p className="mt-3 text-sm text-rose-700">Timpul de 3 ore a expirat.</p> : null}
          {feedback ? <p className="mt-3 text-sm text-emerald-700">{feedback}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}
