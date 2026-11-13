"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export type BacSubject = {
  id: number;
  name: string;
  year: number | null;
  tip: "antrenament" | "oficial";
  subject_pdf_url: string;
  barem_pdf_url: string | null;
  video_url: string | null;
  duration_minutes: number;
  price_lei: number;
  profile_id: number | null;
};

type BacArchiveResponse = {
  data: {
    subjects: BacSubject[];
    filters: {
      years: number[];
      tips: string[];
      profiles: number[];
    };
  };
};

export type BacArchiveInitialData = {
  subjects: BacSubject[];
  years: number[];
  profiles: number[];
};

type MySubmissionRow = {
  id: string;
  subject_id: number;
  status: "draft" | "submitted" | "reviewed";
  uploaded_pdf_name: string | null;
  total_score?: number | null;
};

type MySubmissionsResponse = {
  data: MySubmissionRow[];
};

function getProfileLabel(profileId: number | null) {
  if (profileId === 1) return "Mate-Info";
  if (profileId === 2) return "St. Nat.";
  if (profileId == null) return "Profil nedefinit";
  return `Profil ${profileId}`;
}

const OFFICIAL_PHASE_ORDER: Array<{ key: string; label: string; weight: number }> = [
  { key: "toamna", label: "Toamna", weight: 1 },
  { key: "vara", label: "Vara", weight: 2 },
  { key: "speciala", label: "Speciala", weight: 3 },
  { key: "simulare", label: "Simulare", weight: 4 },
  { key: "model", label: "Model", weight: 5 },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getOfficialPhase(subjectName: string) {
  const normalized = normalizeText(subjectName);
  const match = OFFICIAL_PHASE_ORDER.find((entry) => normalized.includes(entry.key));
  return match ?? { key: "other", label: "Altele", weight: 99 };
}

function getVariantOrder(subjectName: string) {
  const normalized = normalizeText(subjectName);
  const match = normalized.match(/varianta\s+(\d+)/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function BacArchiveClient({ initialData }: { initialData?: BacArchiveInitialData }) {
  return <BacArchiveClientWithMode mode="archive" initialData={initialData} />;
}

export function BacArchiveClientWithMode({
  mode,
  initialData,
}: {
  mode: "archive" | "solve";
  initialData?: BacArchiveInitialData;
}) {
  const [subjects, setSubjects] = useState<BacSubject[]>(initialData?.subjects ?? []);
  const [years, setYears] = useState<number[]>(initialData?.years ?? []);
  const [profiles, setProfiles] = useState<number[]>(initialData?.profiles ?? []);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedTip, setSelectedTip] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [mySubmissions, setMySubmissions] = useState<MySubmissionRow[]>([]);
  const skipInitialFetchRef = useRef(Boolean(initialData));

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    if (selectedTip) params.set("tip", selectedTip);
    if (selectedProfile) params.set("profile_id", selectedProfile);
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    setError(null);
    void apiFetch<BacArchiveResponse>(`/api/bacalaureat/subjects?${params.toString()}`)
      .then((subjectsResponse) => {
        if (cancelled) return;
        setSubjects(subjectsResponse.data.subjects ?? []);
        setYears(subjectsResponse.data.filters.years ?? []);
        setProfiles(subjectsResponse.data.filters.profiles ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Nu am putut incarca arhiva de subiecte momentan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedTip, selectedProfile, search]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<MySubmissionsResponse>("/api/bacalaureat/submissions/my")
      .then((response) => {
        if (!cancelled) setMySubmissions(response.data ?? []);
      })
      .catch(() => {
        /* anonim sau eroare - fara marcaje "ai rezolvat deja" */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const withVideo = subjects.filter((item) => Boolean(item.video_url)).length;
    return `${subjects.length} subiecte • ${withVideo} cu video`;
  }, [subjects]);

  const submissionsBySubject = useMemo(() => {
    const map = new Map<number, MySubmissionRow[]>();
    for (const submission of mySubmissions) {
      const current = map.get(submission.subject_id) ?? [];
      current.push(submission);
      map.set(submission.subject_id, current);
    }
    return map;
  }, [mySubmissions]);

  const groupedSubjects = useMemo(() => {
    const official = subjects.filter((subject) => subject.tip === "oficial");
    const training = subjects.filter((subject) => subject.tip === "antrenament");

    const groupByYear = (items: BacSubject[]) => {
      const map = new Map<number, BacSubject[]>();
      for (const item of items) {
        const year = item.year ?? 0;
        const current = map.get(year) ?? [];
        current.push(item);
        map.set(year, current);
      }
      return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
    };

    const officialGroups = groupByYear(official).map(([year, list]) => ({
      year,
      subjects: [...list].sort((a, b) => {
        const phaseA = getOfficialPhase(a.name);
        const phaseB = getOfficialPhase(b.name);
        if (phaseA.weight !== phaseB.weight) return phaseA.weight - phaseB.weight;
        const profileA = a.profile_id ?? 999;
        const profileB = b.profile_id ?? 999;
        if (profileA !== profileB) return profileA - profileB;
        return a.name.localeCompare(b.name, "ro");
      }),
    }));

    const trainingGroups = groupByYear(training).map(([year, list]) => ({
      year,
      subjects: [...list].sort((a, b) => {
        const variantA = getVariantOrder(a.name);
        const variantB = getVariantOrder(b.name);
        if (variantA !== variantB) return variantA - variantB;
        return a.name.localeCompare(b.name, "ro");
      }),
    }));

    return { officialGroups, trainingGroups };
  }, [subjects]);

  return (
    <section className="mt-6 rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cauta dupa nume..."
          className="rounded-xl border-2 border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-200/70"
        />
        <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="rounded-xl border-2 border-sky-200 bg-white px-3 py-2 text-sm text-slate-900">
          <option value="">Toti anii</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <select value={selectedTip} onChange={(event) => setSelectedTip(event.target.value)} className="rounded-xl border-2 border-sky-200 bg-white px-3 py-2 text-sm text-slate-900">
          <option value="">Toate tipurile</option>
          <option value="oficial">Oficial</option>
          <option value="antrenament">Antrenament</option>
        </select>
        <select value={selectedProfile} onChange={(event) => setSelectedProfile(event.target.value)} className="rounded-xl border-2 border-sky-200 bg-white px-3 py-2 text-sm text-slate-900">
          <option value="">Toate profilele</option>
          {profiles.map((profile) => (
            <option key={profile} value={String(profile)}>
              {getProfileLabel(profile)}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-700">{summary}</p>
      {loading ? <p className="mt-4 text-sm text-slate-600">Se incarca subiectele...</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-4 space-y-6">
          {groupedSubjects.officialGroups.map((group) => (
            <div key={`official-${group.year}`} className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-sky-900">Subiecte oficiale • {group.year || "Fara an"}</p>
              {group.subjects.map((subject) => (
                <article key={subject.id} className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/60 p-4">
                  {(() => {
                    const own = submissionsBySubject.get(subject.id) ?? [];
                    const solvedOnce = own.some((entry) => Boolean(entry.uploaded_pdf_name));
                    const maxReviewedScore = own
                      .filter((entry) => entry.status === "reviewed" && entry.total_score != null)
                      .reduce<number | null>((max, entry) => {
                        const score = Number(entry.total_score);
                        if (!Number.isFinite(score)) return max;
                        if (max == null) return score;
                        return Math.max(max, score);
                      }, null);
                    const phase = getOfficialPhase(subject.name);
                    return (
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-sky-950">{subject.name}</h3>
                          <p className="mt-1 text-xs text-slate-600">
                            {subject.year ?? "An necunoscut"} • {phase.label} • {getProfileLabel(subject.profile_id)} • {subject.duration_minutes} minute
                          </p>
                          {solvedOnce ? (
                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                              Ai rezolvat deja acest subiect.
                              {maxReviewedScore != null ? ` Nota maxima obtinuta: ${maxReviewedScore.toFixed(2)} / 100` : ""}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs font-semibold text-zinc-500">Nu ai rezolvat inca acest subiect.</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {mode === "archive" ? (
                            <>
                              <Link href={subject.subject_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                                PDF Subiect
                              </Link>
                              {subject.barem_pdf_url ? (
                                <Link href={subject.barem_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                                  PDF Barem
                                </Link>
                              ) : null}
                            </>
                          ) : null}
                          {mode === "solve" ? (
                            <Link href={`/bacalaureat/subiect/${subject.id}`} className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                              Rezolva Subiect
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </article>
              ))}
            </div>
          ))}

          {groupedSubjects.trainingGroups.map((group) => (
            <div key={`training-${group.year}`} className="space-y-3">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-900">Subiecte de antrenament • {group.year || "Fara an"}</p>
              {group.subjects.map((subject) => (
            <article key={subject.id} className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/60 p-4">
              {(() => {
                const own = submissionsBySubject.get(subject.id) ?? [];
                const solvedOnce = own.some((entry) => Boolean(entry.uploaded_pdf_name));
                const maxReviewedScore = own
                  .filter((entry) => entry.status === "reviewed" && entry.total_score != null)
                  .reduce<number | null>((max, entry) => {
                    const score = Number(entry.total_score);
                    if (!Number.isFinite(score)) return max;
                    if (max == null) return score;
                    return Math.max(max, score);
                  }, null);
                return (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-sky-950">{subject.name}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {subject.year ?? "An necunoscut"} • Varianta {Number.isFinite(getVariantOrder(subject.name)) ? getVariantOrder(subject.name) : "-"} • {getProfileLabel(subject.profile_id)} • {subject.duration_minutes} minute
                  </p>
                  {solvedOnce ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Ai rezolvat deja acest subiect.
                      {maxReviewedScore != null ? ` Nota maxima obtinuta: ${maxReviewedScore.toFixed(2)} / 100` : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-zinc-500">Nu ai rezolvat inca acest subiect.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {mode === "archive" ? (
                    <>
                      <Link href={subject.subject_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                        PDF Subiect
                      </Link>
                      {subject.barem_pdf_url ? (
                        <Link href={subject.barem_pdf_url} target="_blank" className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                          PDF Barem
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                  {mode === "solve" ? (
                    <Link href={`/bacalaureat/subiect/${subject.id}`} className="rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1.5 text-xs font-extrabold text-slate-800 transition hover:brightness-95">
                      Rezolva Subiect
                    </Link>
                  ) : null}
                </div>
              </div>
                );
              })()}
            </article>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
