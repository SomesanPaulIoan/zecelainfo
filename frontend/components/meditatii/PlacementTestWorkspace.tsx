"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { ModalPortal } from "@/components/ui/ModalPortal";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Question = {
  id: string;
  order_index: number;
  image_url: string;
  correct_answer?: string;
};

type Attempt = {
  id: string;
  status: "in_progress" | "finished";
  started_at: string;
  finished_at: string | null;
  duration_seconds: number;
  correct_count: number | null;
  grade: string | null;
};

function formatTimeLeft(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function extractApiErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const markerIndex = error.message.indexOf(": ");
  if (markerIndex < 0) return null;
  try {
    const payload = JSON.parse(error.message.slice(markerIndex + 2)) as { code?: string };
    return payload.code ?? null;
  } catch {
    return null;
  }
}

export function PlacementTestWorkspace() {
  const { user, loading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    async function loadState() {
      const response = await apiFetch<{ data: { attempt: Attempt; questions: Question[]; answers: Array<{ question_id: string; selected_answer: string }> } }>(
        "/api/placement-test/state",
      );
      return response.data;
    }

    (async () => {
      try {
        let state;
        try {
          state = await loadState();
        } catch (stateError) {
          if (extractApiErrorCode(stateError) !== "NOT_FOUND") throw stateError;
          await apiFetch("/api/placement-test/start", { method: "POST", body: JSON.stringify({}) });
          state = await loadState();
        }
        if (cancelled) return;
        setQuestions(state.questions);
        const answerMap: Record<string, string> = {};
        for (const answer of state.answers) answerMap[answer.question_id] = answer.selected_answer;
        setAnswers(answerMap);
        if (state.attempt.status === "finished") {
          setResult(state.attempt);
          setReady(true);
          return;
        }
        setDurationSeconds(state.attempt.duration_seconds);
        setStartedAtMs(new Date(state.attempt.started_at).getTime());
        setReady(true);
      } catch (loadError) {
        if (cancelled) return;
        const code = extractApiErrorCode(loadError);
        if (code === "NOT_ELIGIBLE") {
          setError("Nu esti inca inregistrat la meditatii, asa ca nu poti da testul initial.");
        } else if (code === "NO_QUESTIONS") {
          setError("Testul initial nu este inca configurat. Revino mai tarziu.");
        } else {
          setError("Nu am putut incarca testul initial.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const handleFinish = async () => {
    if (finishing || result) return;
    setFinishing(true);
    try {
      const response = await apiFetch<{ data: { attempt: Attempt } }>("/api/placement-test/finish", {
        method: "POST",
        body: JSON.stringify({}),
      });
      // Dupa finalizare, raspunsurile corecte devin vizibile - reincarcam starea ca sa avem desfasuratorul complet.
      const stateResponse = await apiFetch<{
        data: { attempt: Attempt; questions: Question[]; answers: Array<{ question_id: string; selected_answer: string }> };
      }>("/api/placement-test/state");
      setQuestions(stateResponse.data.questions);
      const answerMap: Record<string, string> = {};
      for (const answer of stateResponse.data.answers) answerMap[answer.question_id] = answer.selected_answer;
      setAnswers(answerMap);
      setResult(response.data.attempt);
    } catch {
      setError("Nu am putut finaliza testul.");
    } finally {
      setFinishing(false);
    }
  };

  useEffect(() => {
    if (!ready || result || !startedAtMs) return;
    const tick = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setTimeLeft(remaining);
      if (remaining <= 0) void handleFinish();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, result, startedAtMs, durationSeconds]);

  const activeQuestion = questions[activeIndex];
  const answeredMap = useMemo(
    () => Object.fromEntries(questions.map((q) => [q.id, Boolean(answers[q.id])])) as Record<string, boolean>,
    [answers, questions],
  );
  const unansweredCount = questions.length - Object.values(answeredMap).filter(Boolean).length;

  const selectAnswer = (letter: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: letter }));
    void apiFetch("/api/placement-test/answers", {
      method: "POST",
      body: JSON.stringify({ questionId: activeQuestion.id, selectedAnswer: letter }),
    }).catch(() => undefined);
  };

  if (loading) return <p className="text-sm font-medium text-slate-600">Se incarca...</p>;
  if (!user) return <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Trebuie sa fii logat.</p>;
  if (error) return <p className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>;

  if (result) {
    const gradeText = result.grade !== null ? Number(result.grade).toFixed(2) : "-";
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-5 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
          <h2 className="text-xl font-bold text-sky-950">Test initial finalizat</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 p-4">
              <p className="text-xs text-slate-700">Nota</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{gradeText} / 10</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/70 p-4">
              <p className="text-xs text-slate-600">Raspunsuri corecte</p>
              <p className="mt-1 text-2xl font-semibold text-sky-950">{result.correct_count ?? "-"} / 20</p>
            </article>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Rezultatul a fost inregistrat. Vei fi contactat cu privire la grupa de meditatii formata pe baza acestei note.
          </p>
        </div>

        {questions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-sky-950">Desfasurator</h3>
            {questions.map((question) => {
              const userAnswer = answers[question.id] ?? null;
              const isCorrect = userAnswer !== null && userAnswer === question.correct_answer;
              return (
                <article
                  key={question.id}
                  className={`rounded-2xl border-2 p-4 ${
                    isCorrect ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold text-slate-900">Grila {question.order_index}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        isCorrect ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                      }`}
                    >
                      {isCorrect ? "Corect" : userAnswer ? "Gresit" : "Neraspuns"}
                    </span>
                  </div>
                  <GrilaImage src={question.image_url} alt={`Grila ${question.order_index}`} className="mt-2 max-h-64" />
                  <p className="mt-2 text-sm text-slate-700">
                    Raspunsul tau: <strong>{userAnswer ?? "—"}</strong>
                    {!isCorrect ? (
                      <>
                        {" "}
                        · Raspuns corect: <strong>{question.correct_answer ?? "—"}</strong>
                      </>
                    ) : null}
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  if (!ready || !activeQuestion) return <p className="text-sm font-medium text-slate-600">Se pregateste testul initial...</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="sticky top-16 z-20 flex items-center justify-between rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-200/95 to-amber-200/95 p-3 shadow-[0_12px_32px_-18px_rgba(245,158,11,0.65)] backdrop-blur">
        <p className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Test initial meditatii</p>
        <p className={`text-base font-extrabold ${timeLeft <= 900 ? "animate-pulse text-rose-700" : "text-slate-900"}`}>
          {formatTimeLeft(timeLeft)}
        </p>
      </div>

      <section className="rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] sm:p-5">
        <div className="mb-3">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator grile</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {questions.map((question, idx) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`rounded-xl border px-2 py-1.5 text-xs font-extrabold transition ${
                  idx === activeIndex
                    ? "border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900"
                    : answeredMap[question.id]
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "border-sky-200 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50"
                }`}
              >
                {question.order_index}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold text-sky-950">Grila {activeQuestion.order_index}</p>
        <GrilaImage src={activeQuestion.image_url} alt={`Grila ${activeQuestion.order_index}`} className="xl:max-h-[70vh]" />

        <div className="mt-4 flex flex-wrap gap-2">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => selectAnswer(letter)}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition ${
                answers[activeQuestion.id] === letter
                  ? "border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900"
                  : "border-sky-200 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
            disabled={activeIndex === 0}
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-50"
          >
            Inapoi
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((idx) => Math.min(questions.length - 1, idx + 1))}
            disabled={activeIndex === questions.length - 1}
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-50"
          >
            Urmatoarea
          </button>
          <button
            type="button"
            onClick={() => setFinishConfirmOpen(true)}
            disabled={finishing}
            className="rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 px-3 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-60"
          >
            {finishing ? "Se calculeaza..." : "Finalizeaza"}
          </button>
        </div>
      </section>

      {finishConfirmOpen ? (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => setFinishConfirmOpen(false)}
          >
            <div className="w-full max-w-md rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-sky-950">Finalizezi testul initial?</h3>
              <p className="mt-2 text-sm text-slate-700">
                {unansweredCount > 0
                  ? `Nu ai raspuns inca la toate intrebarile (${unansweredCount} ramase). Dupa finalizare nu mai poti relua testul.`
                  : "Dupa finalizare nu mai poti relua testul. Sigur ai terminat?"}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFinishConfirmOpen(false)}
                  className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50"
                >
                  Continua testul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFinishConfirmOpen(false);
                    void handleFinish();
                  }}
                  disabled={finishing}
                  className="rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 px-3 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-60"
                >
                  {finishing ? "Se finalizeaza..." : "Da, finalizeaza"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
