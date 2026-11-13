"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { apiFetch } from "@/lib/api";
import {
  DEMO_EXAMS,
  attributionForServer,
  examInfo,
  getPreferredExam,
  isExamKey,
  lastDemoSession,
  rememberDemoSession,
  setPreferredExam,
  trialActivationHref,
  type ExamKey,
} from "@/lib/attribution";
import { track } from "@/lib/track";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

type DemoQuestion = {
  id: string;
  image_url: string | null;
  variants_count: number | null;
  difficulty: number | null;
  chapter_names: string[];
  source_name: string | null;
  has_video: boolean;
  hint: string | null;
  answered: null | {
    selected: string;
    is_correct: boolean;
    expected_answer: string | null;
    short_explanation: string | null;
    full_explanation: string | null;
    video_url: string | null;
  };
};

type DemoSession = {
  id: string;
  exam: ExamKey;
  total: number;
  answered_count: number;
  correct_count: number;
  completed: boolean;
  questions: DemoQuestion[];
};

const LETTERS = "ABCDEFGHIJ".split("");

function apiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  const match = /API (\d+):\s*(\{[\s\S]*\})\s*$/.exec(error.message);
  if (match?.[2]) {
    try {
      const parsed = JSON.parse(match[2]) as { error?: string; code?: string };
      if (parsed.code === "DEMO_DISABLED") return "Testul gratuit este oprit temporar. Poți activa direct cele 24 de ore gratuite.";
      if (parsed.error) return parsed.error;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

function Difficulty({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="text-xs font-semibold text-slate-500" aria-label={`Dificultate ${value} din 5`}>
      Dificultate{" "}
      <span className="text-amber-500">{"★".repeat(Math.min(5, Math.max(0, value)))}</span>
      <span className="text-slate-300">{"★".repeat(Math.max(0, 5 - value))}</span>
    </span>
  );
}

function ExamPicker({ onPick, busy }: { onPick: (exam: ExamKey) => void; busy: ExamKey | null }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Test gratuit · fără cont</p>
      <h1 className="mt-2 text-balance text-center text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
        Rezolvă 5 grile reale, acum
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-pretty text-center text-base text-slate-600">
        Grile din subiectele date la examen, cu indicație, explicație și rezolvare video. Fără cont, fără card. Durează
        aproximativ 10 minute.
      </p>
      <h2 className="mt-8 text-center text-sm font-extrabold uppercase tracking-wide text-slate-500">Pentru ce examen te pregătești?</h2>
      <ul className="mt-3 grid gap-3">
        {DEMO_EXAMS.map((exam) => (
          <li key={exam.key}>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => onPick(exam.key)}
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border-2 border-sky-200 bg-white px-5 py-3 text-left text-base font-bold text-sky-950 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-60"
            >
              <span>{exam.label}</span>
              <span aria-hidden className="text-sky-600">
                {busy === exam.key ? "…" : "→"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-slate-500">
        Vrei acces la toate grilele și cursurile? După test poți activa <strong>24 de ore gratuit</strong> (cont + verificare SMS, fără card).
      </p>
    </section>
  );
}

function QuestionCard({
  session,
  question,
  index,
  onAnswered,
  onNext,
}: {
  session: DemoSession;
  question: DemoQuestion;
  index: number;
  onAnswered: (next: DemoSession) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(question.hint);
  const [hintOpen, setHintOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const multi = session.exam === "ubb";
  const options = LETTERS.slice(0, Math.min(Math.max(question.variants_count ?? 4, 2), 10));
  const answered = question.answered;
  const isLast = index === session.total - 1;

  useEffect(() => {
    setSelected([]);
    setHint(question.hint);
    setHintOpen(false);
    setExplanationOpen(false);
    setVideoOpen(false);
    setError(null);
  }, [question.id, question.hint]);

  const toggle = (letter: string) => {
    if (answered) return;
    setSelected((prev) =>
      multi ? (prev.includes(letter) ? prev.filter((item) => item !== letter) : [...prev, letter].sort()) : [letter],
    );
  };

  const openHint = async () => {
    setHintOpen(true);
    if (hint) return;
    try {
      const response = await apiFetch<{ data: { hint: string | null } }>(
        `/api/demo/sessions/${session.id}/questions/${question.id}/hint`,
        { method: "POST" },
      );
      setHint(response.data.hint ?? "Nu există indicație pentru această grilă.");
    } catch (err) {
      setHint(null);
      setError(apiErrorMessage(err, "Nu am putut încărca indicația."));
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: DemoSession }>(`/api/demo/sessions/${session.id}/questions/${question.id}/answer`, {
        method: "POST",
        body: JSON.stringify({ selectedAnswers: selected }),
      });
      onAnswered(response.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Nu am putut verifica răspunsul. Încearcă din nou."));
    } finally {
      setBusy(false);
    }
  };

  const explanation = answered?.full_explanation || answered?.short_explanation || null;
  const videoUrl = answered?.video_url ? toVimeoEmbedUrl(answered.video_url) : null;

  return (
    <article className="rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-sky-800">
          Grila {index + 1} din {session.total}
        </span>
        <Difficulty value={question.difficulty} />
      </div>
      {question.source_name || question.chapter_names.length > 0 ? (
        <p className="mt-2 text-xs text-slate-500">
          {question.source_name ? <>Sursa: {question.source_name}</> : null}
          {question.chapter_names.length > 0 ? <> · {question.chapter_names.slice(0, 2).join(", ")}</> : null}
        </p>
      ) : null}
      <div className="mt-3">
        {question.image_url ? (
          <>
            <GrilaImage src={question.image_url} alt={`Grila ${index + 1}`} className="max-h-[60vh]" />
            <p className="mt-1 text-center text-xs text-slate-500 sm:hidden">Atinge imaginea ca s-o mărești.</p>
          </>
        ) : (
          <p className="rounded-xl bg-sky-50 p-6 text-center text-sm text-slate-500">Imagine indisponibilă</p>
        )}
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-700">
        {multi ? "La UBB pot fi corecte mai multe variante: selectează-le pe toate." : "Alege varianta corectă."}
      </p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Variante de răspuns">
        {options.map((letter) => {
          const chosen = answered ? answered.selected.includes(letter) : selected.includes(letter);
          const correct = answered?.expected_answer?.toUpperCase().includes(letter);
          let tone = chosen
            ? "border-amber-500 bg-gradient-to-r from-amber-200 to-yellow-200 text-slate-900"
            : "border-sky-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50";
          if (answered) {
            tone = correct
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : chosen
                ? "border-rose-400 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-white text-slate-400";
          }
          return (
            <button
              key={letter}
              type="button"
              aria-pressed={chosen}
              disabled={Boolean(answered)}
              onClick={() => toggle(letter)}
              className={`min-h-12 rounded-xl border-2 px-4 text-lg font-extrabold transition sm:min-w-14 ${tone}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {!answered ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            disabled={selected.length === 0 || busy}
            onClick={() => void submit()}
            className="min-h-12 rounded-xl bg-sky-700 px-5 text-base font-extrabold text-white shadow-md transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Se verifică..." : "Verifică răspunsul"}
          </button>
          <button
            type="button"
            onClick={() => void openHint()}
            className="min-h-12 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 text-base font-bold text-slate-900 hover:bg-amber-100"
          >
            💡 Indicație
          </button>
        </div>
      ) : (
        <div
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
            answered.is_correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {answered.is_correct ? "Corect! " : "Nu e corect. "}
          Răspunsul corect: <span className="font-black">{answered.expected_answer}</span>
        </div>
      )}

      {hintOpen && !answered ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-amber-800">Indicație</p>
          {hint ? (
            <MarkdownLatexContent content={hint} className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800" />
          ) : (
            <p className="mt-1 text-sm text-slate-500">Se încarcă...</p>
          )}
        </div>
      ) : null}

      {answered ? (
        <div className="mt-3 space-y-2">
          {explanation ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60">
              <button
                type="button"
                aria-expanded={explanationOpen}
                onClick={() => setExplanationOpen((open) => !open)}
                className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-bold text-sky-950"
              >
                📘 Explicația pas cu pas <span aria-hidden>{explanationOpen ? "−" : "+"}</span>
              </button>
              {explanationOpen ? (
                <MarkdownLatexContent content={explanation} className="whitespace-pre-wrap px-4 pb-4 text-sm leading-6 text-slate-800" />
              ) : null}
            </div>
          ) : null}
          {videoUrl ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60">
              <button
                type="button"
                aria-expanded={videoOpen}
                onClick={() => setVideoOpen((open) => !open)}
                className="flex min-h-12 w-full items-center justify-between px-4 text-left text-sm font-bold text-sky-950"
              >
                ▶️ Rezolvarea video <span aria-hidden>{videoOpen ? "−" : "+"}</span>
              </button>
              {videoOpen ? (
                <div className="px-3 pb-3">
                  <iframe
                    src={videoUrl}
                    title={`Rezolvare video grila ${index + 1}`}
                    className="aspect-video w-full rounded-xl border border-sky-100"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onNext}
            className="min-h-12 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-5 text-base font-extrabold text-slate-900 shadow-md hover:brightness-105"
          >
            {isLast ? "Vezi rezultatul" : "Grila următoare →"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function Result({ session, loggedIn, onRestart }: { session: DemoSession; loggedIn: boolean; onRestart: () => void }) {
  const exam = examInfo(session.exam);
  const percent = session.total > 0 ? Math.round((session.correct_count / session.total) * 100) : 0;
  const wrong = session.questions.filter((question) => question.answered && !question.answered.is_correct);
  const message =
    session.correct_count === session.total
      ? "Foarte bine! Continuă cu subiecte întregi pe timp, ca să vezi cum te descurci în condiții de examen."
      : session.correct_count >= Math.ceil(session.total / 2)
        ? "Un început bun. Continuă cu exerciții și explicații din platformă ca să-ți consolidezi cunoștințele."
        : "Fiecare greșeală e o lecție. Explicațiile și rezolvările video te ajută să înțelegi de ce, nu doar care e răspunsul.";

  return (
    <section className="space-y-5">
      <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 text-center shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)] sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Rezultatul tău · {exam.short}</p>
        <p className="mt-3 text-5xl font-black tracking-tight text-sky-950">
          {session.correct_count} <span className="text-2xl text-slate-400">din {session.total}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">{percent}% răspunsuri corecte</p>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-slate-700">
          Ai rezolvat corect {session.correct_count} din {session.total} grile. {message}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs text-slate-500">
          5 grile nu sunt o evaluare completă a pregătirii tale; sunt doar o mostră din platformă.
        </p>
        <div className="mx-auto mt-6 grid max-w-lg gap-3">
          <Link
            href={trialActivationHref(session.exam, loggedIn)}
            className="flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-900 px-6 text-base font-extrabold text-white shadow-lg ring-1 ring-yellow-300/60 hover:brightness-110"
          >
            Activează gratuit 24h de acces complet
          </Link>
          <p className="-mt-1 text-xs text-slate-500">
            Toate grilele și toate cursurile video, 24 de ore. {loggedIn ? "" : "Îți faci cont, "}confirmi telefonul prin SMS, fără card.
          </p>
          <Link
            href={`/pachete/${exam.pachet}`}
            className="flex min-h-12 items-center justify-center rounded-2xl border-2 border-amber-300 bg-amber-50 px-6 text-base font-extrabold text-slate-900 hover:bg-amber-100"
          >
            Vezi pachetele de pregătire
          </Link>
        </div>
      </div>

      {wrong.length > 0 ? (
        <div className="rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 sm:p-6">
          <h2 className="text-lg font-black text-sky-950">Explicațiile grilelor greșite</h2>
          <div className="mt-3 space-y-3">
            {wrong.map((question) => {
              const index = session.questions.findIndex((item) => item.id === question.id);
              const text = question.answered?.full_explanation || question.answered?.short_explanation;
              return (
                <details key={question.id} className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <summary className="min-h-10 cursor-pointer text-sm font-bold text-sky-950">
                    Grila {index + 1}: ai ales {question.answered?.selected}, corect era {question.answered?.expected_answer}
                  </summary>
                  {question.image_url ? (
                    <div className="mt-2">
                      <GrilaImage src={question.image_url} alt={`Grila ${index + 1}`} className="max-h-[50vh]" />
                    </div>
                  ) : null}
                  {text ? <MarkdownLatexContent content={text} className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800" /> : null}
                </details>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="text-center">
        <button type="button" onClick={onRestart} className="text-sm font-bold text-sky-800 underline-offset-4 hover:underline">
          Încearcă alt examen
        </button>
      </p>
    </section>
  );
}

export function DemoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [starting, setStarting] = useState<ExamKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const completedTracked = useRef<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const start = useCallback(
    async (exam: ExamKey) => {
      setStarting(exam);
      setError(null);
      setPreferredExam(exam);
      try {
        const response = await apiFetch<{ data: DemoSession }>("/api/demo/sessions", {
          method: "POST",
          body: JSON.stringify({ exam, attribution: attributionForServer() }),
        });
        rememberDemoSession(response.data.id);
        setSession(response.data);
        setActiveIndex(0);
        setShowResult(false);
        track({ name: "demo_started", exam });
        router.replace(`/test-gratuit?exam=${exam}`, { scroll: false });
      } catch (err) {
        setError(apiErrorMessage(err, "Nu am putut porni testul. Încearcă din nou."));
      } finally {
        setStarting(null);
      }
    },
    [router],
  );

  // Revenire dupa refresh: continuam sesiunea din acelasi tab, daca e pentru examenul din URL.
  useEffect(() => {
    const examParam = searchParams.get("exam");
    const stored = lastDemoSession();
    if (!stored) {
      setRestoring(false);
      return;
    }
    void apiFetch<{ data: DemoSession }>(`/api/demo/sessions/${stored}`)
      .then((response) => {
        if (examParam && response.data.exam !== examParam) return;
        setSession(response.data);
        const firstOpen = response.data.questions.findIndex((question) => !question.answered);
        setActiveIndex(firstOpen === -1 ? response.data.total - 1 : firstOpen);
        setShowResult(response.data.completed);
        if (response.data.completed) completedTracked.current = response.data.id;
      })
      .catch(() => undefined)
      .finally(() => setRestoring(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeIndex, showResult, session?.id]);

  const onAnswered = (next: DemoSession) => {
    setSession(next);
    if (next.completed && completedTracked.current !== next.id) {
      completedTracked.current = next.id;
      track({ name: "demo_completed", exam: next.exam });
    }
  };

  if (restoring) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">Se încarcă...</div>;
  }

  if (!session) {
    const examParam = searchParams.get("exam");
    const preselected = isExamKey(examParam) ? examParam : null;
    return (
      <>
        {preselected ? (
          <section className="mx-auto w-full max-w-3xl px-4 pt-8 text-center sm:px-6 sm:pt-12">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-700">Test gratuit · fără cont</p>
            <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-5xl">
              5 grile reale de la {examInfo(preselected).label.replace(/^Admitere /, "admiterea ")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-slate-600">
              Cu indicație, explicație pas cu pas și rezolvare video. Fără cont, fără card.
            </p>
            <button
              type="button"
              disabled={starting !== null}
              onClick={() => void start(preselected)}
              className="mt-6 min-h-14 w-full max-w-sm rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-900 px-6 text-base font-extrabold text-white shadow-lg ring-1 ring-yellow-300/60 hover:brightness-110 disabled:opacity-60"
            >
              {starting ? "Se pregătește testul..." : "Începe testul"}
            </button>
            {error ? <p className="mx-auto mt-4 max-w-md rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
            <p className="mt-6 text-sm text-slate-500">Alt examen?</p>
          </section>
        ) : null}
        <ExamPicker onPick={(exam) => void start(exam)} busy={starting} />
        {error && !preselected ? (
          <p className="mx-auto -mt-10 mb-10 max-w-md rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-800">
            {error}{" "}
            <Link href={trialActivationHref(getPreferredExam(), Boolean(user))} className="font-bold underline">
              Activează 24h gratuit
            </Link>
          </p>
        ) : null}
      </>
    );
  }

  const question = session.questions[activeIndex];

  return (
    <div ref={topRef} className="mx-auto w-full max-w-3xl scroll-mt-20 px-3 pb-16 pt-5 sm:px-6 sm:pt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-sky-950">Test gratuit · {examInfo(session.exam).short}</p>
        <ol className="flex gap-1.5" aria-label="Progres">
          {session.questions.map((item, idx) => (
            <li
              key={item.id}
              aria-label={`Grila ${idx + 1}${item.answered ? (item.answered.is_correct ? ", corect" : ", greșit") : ""}`}
              className={`h-2.5 w-7 rounded-full ${
                item.answered ? (item.answered.is_correct ? "bg-emerald-500" : "bg-rose-400") : idx === activeIndex && !showResult ? "bg-amber-400" : "bg-sky-100"
              }`}
            />
          ))}
        </ol>
      </div>
      {showResult ? (
        <Result
          session={session}
          loggedIn={Boolean(user)}
          onRestart={() => {
            setSession(null);
            setShowResult(false);
            router.replace("/test-gratuit", { scroll: false });
          }}
        />
      ) : question ? (
        <QuestionCard
          session={session}
          question={question}
          index={activeIndex}
          onAnswered={onAnswered}
          onNext={() => {
            if (activeIndex >= session.total - 1) setShowResult(true);
            else setActiveIndex(activeIndex + 1);
          }}
        />
      ) : null}
    </div>
  );
}
