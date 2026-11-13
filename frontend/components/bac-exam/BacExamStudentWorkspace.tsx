"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BacExamPreview } from "@/components/bac-exam/BacExamPreview";
import { apiFetch } from "@/lib/api";
import type { BacExamExerciseType, BacExamSection, BacExamSubjectForm } from "@/lib/bac-exam-types";

type PublicExercise = {
  id: string;
  internal_code: string;
  title: string | null;
  section: BacExamSection;
  exercise_type: BacExamExerciseType;
  sort_order: number;
  max_points: number;
  config: Record<string, unknown>;
  images: Array<{ url: string; alt: string | null }>;
};

type PublicSubject = {
  id: string;
  title: string;
  session_label: string | null;
  year: number | null;
  variant_label: string | null;
  duration_minutes: number;
  points_subject_i: number;
  points_subject_ii: number;
  points_subject_iii: number;
  points_oficiu: number;
  grade_divisor: number;
};

function formatTimer(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BacExamStudentWorkspace({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [subject, setSubject] = useState<PublicSubject | null>(null);
  const [exercises, setExercises] = useState<PublicExercise[]>([]);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(3 * 60 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSubject: BacExamSubjectForm | null = useMemo(() => {
    if (!subject) return null;
    return {
      title: subject.title,
      session_label: subject.session_label ?? "",
      year: subject.year ?? 2026,
      variant_label: subject.variant_label ?? "",
      profile_id: 1,
      duration_minutes: subject.duration_minutes,
      is_active: true,
      points_subject_i: subject.points_subject_i,
      points_subject_ii: subject.points_subject_ii,
      points_subject_iii: subject.points_subject_iii,
      points_oficiu: subject.points_oficiu,
      grade_divisor: subject.grade_divisor,
      exercises: exercises.map((ex) => ({
        internal_code: ex.internal_code,
        title: ex.title ?? "",
        section: ex.section,
        exercise_type: ex.exercise_type,
        sort_order: ex.sort_order,
        max_points: ex.max_points,
        config: ex.config,
        grading_rules: {},
        default_feedback: "",
        images: ex.images.map((img) => ({
          file_name: img.url.split("/").pop() ?? "img",
          file_base64: img.url,
          alt_text: img.alt ?? "",
          preview_url: img.url,
        })),
        tests: [],
      })),
    };
  }, [subject, exercises]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subjectRes = await apiFetch<{ data: { subject: PublicSubject; exercises: PublicExercise[] } }>(
        `/api/bac-exam/subjects/${subjectId}`,
      );
      setSubject(subjectRes.data.subject);
      setExercises(subjectRes.data.exercises);

      const startRes = await apiFetch<{ data: { submission_id: string } }>(`/api/bac-exam/subjects/${subjectId}/start`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setSubmissionId(startRes.data.submission_id);

      const subRes = await apiFetch<{ data: { submission: { started_at: string } } }>(
        `/api/bac-exam/submissions/${startRes.data.submission_id}`,
      );
      setStartedAt(subRes.data.submission.started_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut porni examenul.");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!startedAt || !subject) return;
    const endMs = new Date(startedAt).getTime() + subject.duration_minutes * 60 * 1000;
    const tick = () => setRemainingSeconds(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, subject]);

  const saveAnswers = async () => {
    if (!submissionId) return;
    const payload = exercises.map((ex) => ({
      exercise_id: ex.id,
      answer: answers[ex.internal_code] ?? {},
    }));
    await apiFetch(`/api/bac-exam/submissions/${submissionId}/answers`, {
      method: "PUT",
      body: JSON.stringify({ answers: payload }),
    });
  };

  const handleSubmit = async () => {
    if (!submissionId) return;
    const confirmSubmit = window.confirm("Sigur vrei sa trimiti subiectul? Nu mai poti modifica raspunsurile.");
    if (!confirmSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveAnswers();
      await apiFetch(`/api/bac-exam/submissions/${submissionId}/submit`, { method: "POST", body: JSON.stringify({}) });
      router.push(`/bacalaureat/examen/${subjectId}/rezultat/${submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trimitere esuata.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !previewSubject) {
    return <p className="p-8 text-sm text-zinc-600">Se incarca examenul...</p>;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{subject?.title}</p>
            <p className="text-xs text-zinc-500">Examen Bac Informatica — mod interactiv</p>
          </div>
          <div className={`rounded-lg px-3 py-1.5 font-mono text-sm ${remainingSeconds < 600 ? "bg-rose-100 text-rose-800" : "bg-zinc-100"}`}>
            {formatTimer(remainingSeconds)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Exercitii</p>
          <div className="mt-2 space-y-1">
            {exercises.map((ex, idx) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                  idx === selectedIndex ? "bg-sky-600 text-white" : "hover:bg-zinc-100"
                }`}
              >
                {ex.internal_code} <span className="opacity-70">({ex.max_points}p)</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveAnswers()}
            className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
          >
            Salveaza progres
          </button>
          <button
            type="button"
            disabled={submitting || remainingSeconds <= 0}
            onClick={() => void handleSubmit()}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Trimit..." : "Trimite subiectul"}
          </button>
        </aside>

        <section>
          <BacExamPreview
            subject={previewSubject}
            selectedExerciseIndex={selectedIndex}
            previewAnswers={answers}
            onPreviewAnswerChange={(code, answer) => setAnswers((p) => ({ ...p, [code]: answer }))}
            mode="student"
            exerciseIds={Object.fromEntries(exercises.map((ex) => [ex.internal_code, ex.id]))}
          />
          {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </section>
      </main>
    </div>
  );
}
