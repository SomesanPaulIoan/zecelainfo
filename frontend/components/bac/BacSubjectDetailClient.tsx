"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { BillingProfileCheckoutModal } from "@/components/billing/BillingProfileCheckoutModal";
import { apiFetch } from "@/lib/api";
import type { BillingProfilePutPayload } from "@/lib/billingProfileForm";
import { toVimeoEmbedUrl } from "@/lib/vimeo";
import useSWR from "swr";

export type BacSubject = {
  id: number;
  name: string;
  year: number | null;
  tip: "antrenament" | "oficial";
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
  profile_id: number | null;
  price_lei?: number | null;
};

type BacSubjectResponse = { data: BacSubject };

type SubmissionRow = {
  id: string;
  subject_id: number;
  status: "draft" | "submitted" | "reviewed";
  started_at: string | null;
  finished_at: string | null;
  uploaded_pdf_name: string | null;
  uploaded_pdf_public_url: string | null;
  submitted_at: string | null;
  created_at: string;
  total_score?: number | null;
};

type BacCorrectionConfirmResponse = {
  data: {
    ok?: boolean;
    payment_status: string;
    submission_id?: string;
    invoice_number?: string | null;
    invoice_url?: string | null;
    revolut_status?: string;
  };
};

type BacCorrectionCreatePaymentResponse = {
  data: { attempt_id: string; checkout_url: string | null; direct_paid?: boolean };
};

type SubjectSubmissionsResponse = { data: SubmissionRow[] };

type SubjectStatsResponse = {
  data: {
    attempts_count: number;
    avg_grade: number | null;
    min_grade: number | null;
    max_grade: number | null;
    buckets: Array<{
      label: string;
      count: number;
    }>;
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ro-RO");
}

function getSubmissionStatusLabel(submission: SubmissionRow) {
  if (submission.status === "draft" && submission.uploaded_pdf_name) return "Incarcat";
  if (submission.status === "submitted") return "Trimis la Corectare";
  if (submission.status === "reviewed") return "Corectat";
  return "Draft";
}

export function BacSubjectDetailClient({
  subjectId,
  initialSubject,
}: {
  subjectId: string;
  initialSubject: BacSubject;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correctionModalSubmissionId, setCorrectionModalSubmissionId] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [adminVideoUrl, setAdminVideoUrl] = useState("");
  const [savingVideoUrl, setSavingVideoUrl] = useState(false);

  const { data: subjectData, mutate: mutateSubject } = useSWR<BacSubjectResponse>(
    `/api/bacalaureat/subjects/${subjectId}`,
    apiFetch,
    { fallbackData: { data: initialSubject } },
  );
  const {
    data: submissionsData,
    mutate: mutateSubmissions,
    isLoading: submissionsLoading,
  } = useSWR<SubjectSubmissionsResponse>(user ? `/api/bacalaureat/subjects/${subjectId}/submissions/my` : null, apiFetch);
  const { data: statsData, isLoading: statsLoading } = useSWR<SubjectStatsResponse>(
    user ? `/api/bacalaureat/subjects/${subjectId}/stats` : null,
    apiFetch,
  );

  const subject = subjectData?.data;
  const submissions = submissionsData?.data ?? [];
  const videoEmbedUrl = toVimeoEmbedUrl(subject?.video_url);

  useEffect(() => {
    setAdminVideoUrl(subject?.video_url ?? "");
  }, [subject?.video_url]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const attempt = searchParams.get("attempt");
    if (payment !== "success" || !attempt) return;
    let cancelled = false;
    const run = async () => {
      setFeedback(null);
      setError(null);
      try {
        const response = await apiFetch<BacCorrectionConfirmResponse>("/api/bacalaureat/correction-payments/confirm", {
          method: "POST",
          body: JSON.stringify({ attemptId: attempt }),
        });
        if (cancelled) return;
        if (response.data.payment_status === "paid") {
          setFeedback(
            response.data.invoice_number
              ? `Plata confirmata. Submisia a fost trimisa spre corectare. Factura: ${response.data.invoice_number}.`
              : "Plata confirmata. Submisia a fost trimisa spre corectare.",
          );
          await mutateSubmissions();
          router.replace(`/bacalaureat/subiect/${subjectId}`, { scroll: false });
        } else {
          setFeedback("Plata este inca in procesare la Revolut. Reincarca pagina in cateva secunde.");
        }
      } catch (confirmError) {
        if (!cancelled) {
          setError(confirmError instanceof Error ? confirmError.message : "Nu am putut confirma plata.");
        }
      } finally {
        if (!cancelled) {
          await mutateSubmissions();
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, subjectId, router, mutateSubmissions]);

  const hasSolvedOnce = submissions.some((submission) => Boolean(submission.uploaded_pdf_name));
  const hasSubmittedForReview = submissions.some(
    (submission) => submission.status === "submitted" || submission.status === "reviewed",
  );
  const stats = statsData?.data;
  const maxBucketCount = Math.max(...(stats?.buckets.map((bucket) => bucket.count) ?? [0]), 0);

  const startSolving = async () => {
    if (!subject) return;
    if (!user) {
      router.push(`/login?next=/bacalaureat/subiect/${subjectId}`);
      return;
    }
    setFeedback(null);
    setError(null);
    try {
      const numericSubjectId = Number(subject.id);
      const response = await apiFetch<{ data: { id: string } }>("/api/bacalaureat/submissions", {
        method: "POST",
        body: JSON.stringify({ subject_id: numericSubjectId }),
      });
      window.location.href = `/bacalaureat/subiect/${subject.id}/simulare/${response.data.id}`;
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Nu am putut porni rezolvarea.");
    }
  };

  /** Aliniat cu backend `BAC_CORRECTION_PRICE_LEI`. */
  const correctionPriceLei = 50;

  const correctionCheckoutSummary = useMemo(
    () => (
      <div className="rounded-lg border border-amber-200/70 bg-amber-50/85 px-3 py-2 text-sm text-slate-700">
        <p className="mb-2 font-semibold text-slate-900">Total: {correctionPriceLei} RON (plata securizata Revolut)</p>
        <ul className="list-disc space-y-1 pl-4 leading-snug">
          <li>Feedback detaliat in maxim 7 zile.</li>
          <li>Acces la un videoclip explicativ.</li>
          <li>Factura SmartBill dupa plata (PDF descarcabil din cont).</li>
        </ul>
      </div>
    ),
    [correctionPriceLei],
  );

  const confirmCorrectionPurchase = async (profile: BillingProfilePutPayload, extras?: { discountCode?: string | null }) => {
    if (!correctionModalSubmissionId) throw new Error("missing submission");
    setFeedback(null);
    setError(null);
    const response = await apiFetch<BacCorrectionCreatePaymentResponse>("/api/bacalaureat/correction-payments/create", {
      method: "POST",
      body: JSON.stringify({
        submission_id: correctionModalSubmissionId,
        billingProfile: profile,
        acceptTerms: true as const,
        discountCode: extras?.discountCode ?? undefined,
      }),
    });
    if (response.data.direct_paid || !response.data.checkout_url) {
      setCorrectionModalSubmissionId(null);
      setFeedback("Plata cu reducere 100%: submisia a fost trimisa spre corectare. Nu se emite factura pentru suma 0 RON.");
      await mutateSubmissions();
      return;
    }
    window.location.href = response.data.checkout_url;
  };

  const saveAdminVideoUrl = async () => {
    if (!subject) return;
    setSavingVideoUrl(true);
    setError(null);
    setFeedback(null);
    try {
      await apiFetch(`/api/bacalaureat/admin/subjects/${subject.id}`, {
        method: "PUT",
        body: JSON.stringify({
          video_url: adminVideoUrl.trim() === "" ? null : adminVideoUrl.trim(),
        }),
      });
      await mutateSubject();
      setFeedback(adminVideoUrl.trim() ? "Link video salvat." : "Link video sters.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nu am putut salva linkul video.");
    } finally {
      setSavingVideoUrl(false);
    }
  };

  if (!subject) {
    return <main className="mx-auto max-w-6xl px-6 py-14 text-sm font-semibold text-rose-700">Subiectul nu a fost gasit.</main>;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl px-6 py-12">
      <div className="mb-4">
        <Link
          href="/bacalaureat/rezolva-subiecte"
          className="inline-flex items-center rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:brightness-95"
        >
          ← Inapoi la Subiecte
        </Link>
      </div>
      <section className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
        <h1 className="text-3xl font-black text-sky-950">{subject.name}</h1>
        <p className="mt-2 text-sm text-slate-700">
          {subject.year ?? "An necunoscut"} • {subject.tip} • Durata: 3 ore
        </p>
        <p className="mt-3 text-sm text-slate-600">
          In aceasta pagina poti vedea detaliile subiectului si poti porni rezolvarea in modul simulare.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {hasSolvedOnce ? (
            <Link href={subject.subject_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:brightness-95">
              Deschide subiectul
            </Link>
          ) : (
            <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-500">
              Subiect disponibil dupa prima rezolvare
            </span>
          )}
          {subject.barem_pdf_url ? (
            hasSolvedOnce ? (
              <Link href={subject.barem_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 text-sm font-extrabold text-slate-800 transition hover:brightness-95">
                Vezi baremul
              </Link>
            ) : (
              <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-500">
                Barem disponibil dupa prima rezolvare
              </span>
            )
          ) : null}
          <button type="button" onClick={() => void startSolving()} className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:brightness-95">
            Incepe rezolvarea cronometrata
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
        <h2 className="text-lg font-semibold text-sky-950">Cum functioneaza corectarea</h2>
        <p className="mt-1 text-sm text-slate-600">
          Parcurge pasii de mai jos ca sa folosesti la maximum simularea, corectura si feedback-ul personalizat.
        </p>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <li className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
            <span className="font-semibold text-sky-900">1.</span> Cand esti pregatit, incepi rezolvarea cronometrata. Ai 3 ore la
            dispozitie sa lucrezi si sa incarci PDF-ul cu rezolvarea ta.
          </li>
          <li className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
            <span className="font-semibold text-sky-900">2.</span> In tabelul „Submisiile tale” alegi incercarea dorita si o trimiti
            spre corectare.
          </li>
          <li className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
            <span className="font-semibold text-sky-900">3.</span> Dupa trimiterea la corectare, deblochezi automat videoclipul
            explicativ pentru subiectul respectiv.
          </li>
          <li className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
            <span className="font-semibold text-sky-900">4.</span> In maximum 7 zile primesti feedback complet de la Paul, inclusiv
            punctaj detaliat pe fiecare exercitiu.
          </li>
          <li className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
            <span className="font-semibold text-sky-900">5.</span> Repeti procesul pana cand ajungi la nivelul si nota pe care ti le
            doresti la Bac.
          </li>
        </ol>
      </section>

      <section className="mt-5 rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
        <h2 className="text-lg font-semibold text-sky-950">Submisiile tale</h2>
        <p className="mt-1 text-sm text-slate-600">
          Dupa ce incarci PDF-ul in simulare, revii aici si poti trimite submisia spre corectare.
        </p>
        {submissionsLoading ? <p className="mt-4 text-sm text-slate-600">Se incarca submisiile...</p> : null}
        {!submissionsLoading && submissions.length === 0 ? <p className="mt-4 text-sm text-slate-600">Nu ai submisii pentru acest subiect.</p> : null}

        {!submissionsLoading && submissions.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-sky-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-2">Data</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">PDF</th>
                  <th className="px-2 py-2">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-sky-50 text-slate-700">
                    <td className="px-2 py-2">{formatDate(submission.created_at)}</td>
                    <td className="px-2 py-2">
                      {getSubmissionStatusLabel(submission)}
                      {submission.status === "reviewed" && submission.total_score != null ? ` (${Number(submission.total_score).toFixed(2)})` : ""}
                    </td>
                    <td className="px-2 py-2">{submission.uploaded_pdf_name ?? "-"}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={
                            submission.uploaded_pdf_public_url
                              ? `/bacalaureat/subiect/${subject.id}/submisie/${submission.id}`
                              : `/bacalaureat/subiect/${subject.id}/simulare/${submission.id}`
                          }
                          className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-xs font-extrabold text-slate-800 transition hover:brightness-95"
                        >
                          Deschide
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setCorrectionModalSubmissionId(submission.id);
                          }}
                          disabled={!submission.uploaded_pdf_name || submission.status !== "draft"}
                          className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-xs font-extrabold text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Trimite spre corectare
                        </button>
                        {submission.status === "reviewed" ? (
                          <Link
                            href={`/bacalaureat/subiect/${subject.id}/feedback/${submission.id}`}
                            className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-xs font-extrabold text-slate-800 transition hover:brightness-95"
                          >
                            Vezi feedback
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="mt-5 rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
        <h2 className="text-lg font-semibold text-sky-950">Rezolvare Video Explicativa</h2>
            <p className="mt-1 text-sm text-slate-600">
              Poti vizualiza videoclip-ul doar daca ai trimis cel putin o rezolvare la corectare.
            </p>
          </div>
          {subject.video_url && hasSubmittedForReview ? (
            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="inline-flex min-w-[220px] items-center justify-center rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-6 py-3 text-base font-extrabold text-slate-900 transition hover:brightness-95"
            >
              Vezi video
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-w-[220px] items-center justify-center rounded-xl border border-zinc-300 bg-zinc-100 px-6 py-3 text-base font-bold text-zinc-500"
            >
              Vezi video
            </button>
          )}
        </div>
        <div className="mt-2">
          {!subject.video_url ? (
            <p className="text-xs text-zinc-500">Acest subiect nu are rezolvare video!</p>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-sm font-semibold text-amber-950">Admin — link video Vimeo</p>
            <p className="mt-1 text-xs text-amber-900/80">
              Lipeste linkul de pe Vimeo (ex. https://vimeo.com/1297292). Se salveaza automat in format embed.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                <span className="font-medium text-slate-800">URL Vimeo</span>
                <input
                  type="url"
                  value={adminVideoUrl}
                  onChange={(e) => setAdminVideoUrl(e.target.value)}
                  placeholder="https://vimeo.com/1297292"
                  className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800"
                />
              </label>
              <button
                type="button"
                disabled={savingVideoUrl}
                onClick={() => void saveAdminVideoUrl()}
                className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {savingVideoUrl ? "Se salveaza..." : "Salveaza video"}
              </button>
            </div>
            {subject.video_url ? (
              <p className="mt-2 text-xs text-slate-600">
                Embed curent: <span className="font-mono">{videoEmbedUrl ?? subject.video_url}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mt-5 rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
        <h2 className="text-lg font-semibold text-sky-950">Statistici elevi</h2>
        <p className="mt-1 text-sm text-slate-600">
          Distributia notelor pentru aceasta simulare (doar incercarile corectate).
        </p>
        {statsLoading ? <p className="mt-3 text-sm text-slate-600">Se incarca statisticile...</p> : null}
        {!statsLoading && stats ? (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-2 rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <p className="text-xl font-black text-sky-950">{stats.attempts_count}</p>
                  <p className="text-xs text-slate-600">incercari corectate</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <p className="text-xl font-black text-sky-950">
                    {stats.avg_grade != null ? stats.avg_grade.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-slate-600">media</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <p className="text-xl font-black text-sky-950">
                    {stats.min_grade != null ? stats.min_grade.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-slate-600">minim</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-white p-3">
                  <p className="text-xl font-black text-sky-950">
                    {stats.max_grade != null ? stats.max_grade.toFixed(2) : "—"}
                  </p>
                  <p className="text-xs text-slate-600">maxim</p>
                </div>
              </div>
              <div className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs text-slate-600">
                Intervale: {stats.buckets.map((bucket) => bucket.label).join(", ")}.
              </div>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-3">
              <div className="grid h-52 grid-cols-6 items-end gap-2 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/50 to-white px-3 py-2">
                {stats.buckets.map((bucket) => {
                  const heightPct = maxBucketCount > 0 ? Math.max(8, (bucket.count / maxBucketCount) * 100) : 8;
                  return (
                    <div key={bucket.label} className="flex h-full flex-col items-center justify-end gap-1">
                      <span className="text-[11px] font-semibold text-slate-500">{bucket.count}</span>
                      <div
                        className="w-full rounded-t-md border border-sky-200 bg-gradient-to-t from-sky-300 to-sky-200"
                        style={{ height: `${heightPct}%` }}
                        title={`${bucket.label}: ${bucket.count}`}
                      />
                      <span className="text-[11px] font-semibold text-slate-600">{bucket.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {feedback ? <p className="mt-4 text-sm text-emerald-700">{feedback}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {correctionModalSubmissionId ? (
        <BillingProfileCheckoutModal
          open
          fieldIdPrefix="bac-correction"
          summary={correctionCheckoutSummary}
          discount={{ scope: "bac_correction", baseAmountRon: correctionPriceLei }}
          size="compact"
          submitLabel="Continua spre Revolut"
          onClose={() => setCorrectionModalSubmissionId(null)}
          onConfirm={confirmCorrectionPurchase}
        />
      ) : null}

      {videoModalOpen && videoEmbedUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl rounded-[1.6rem] border border-sky-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-sky-950">Video explicativ</h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-sm font-extrabold text-slate-800 transition hover:brightness-95"
              >
                Inchide
              </button>
            </div>
            <iframe
              src={videoEmbedUrl}
              title={`Video explicativ ${subject.name}`}
              className="aspect-video w-full rounded-2xl border border-sky-200"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
