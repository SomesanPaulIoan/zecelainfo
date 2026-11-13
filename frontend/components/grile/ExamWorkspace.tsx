"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { ContentFeedbackStars } from "@/components/grile/ContentFeedbackStars";
import { GrilaCommunityStatsModal, type CommunityGrilaStats } from "@/components/grile/GrilaCommunityStatsModal";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { GrilaAdministrationButton } from "@/components/grile/GrilaAdministrationButton";
import type { GrilaAdminContent } from "@/components/grile/GrilaAdminContentModal";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type ExamQuestion = {
  id: string;
  order_index: number | null;
  legacy_id: number;
  image_url: string | null;
  variants_count: number | null;
  hint?: string | null;
  short_explanation?: string | null;
  full_explanation?: string | null;
  explanation?: string | null;
  video_url?: string | null;
};

type ExamWorkspaceProps = {
  sourceId: string;
  sourceName: string;
  initialAttemptId?: string | null;
};
type FeedbackType = "hint" | "short_explanation" | "full_explanation" | "video";

function formatTimeLeft(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function extractApiErrorPayload(error: unknown): { code?: string; data?: Record<string, unknown> } | null {
  if (!(error instanceof Error)) return null;
  const marker = ": ";
  const markerIndex = error.message.indexOf(marker);
  if (markerIndex < 0) return null;
  const maybeJson = error.message.slice(markerIndex + marker.length);
  try {
    return JSON.parse(maybeJson) as { code?: string; data?: Record<string, unknown> };
  } catch {
    return null;
  }
}

export function ExamWorkspace({ sourceId, sourceName, initialAttemptId = null }: ExamWorkspaceProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [questionOverrides, setQuestionOverrides] = useState<Record<string, Partial<ExamQuestion>>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [activeModal, setActiveModal] = useState<"hint" | "short_explanation" | "full_explanation" | "video" | null>(null);
  const [myList, setMyList] = useState<Record<string, boolean>>({});
  const [flaggedList, setFlaggedList] = useState<Record<string, boolean>>({});
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [communityStatsOpen, setCommunityStatsOpen] = useState(false);
  const [communityStats, setCommunityStats] = useState<CommunityGrilaStats | null>(null);
  const [communityStatsLoading, setCommunityStatsLoading] = useState(false);
  const [communityStatsError, setCommunityStatsError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score_total: number;
    score_without_bonus: number;
    bonus_points: number;
    time_spent_seconds: number;
    finished_at: string;
    breakdown: Array<{
      question_id: string;
      order: number;
      selected_answers: string;
      correct_answers: string;
      score: number;
    }>;
  } | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<
    Array<{
      id: string;
      score_total: number | null;
      score_without_bonus: number | null;
      question_count: number;
      time_spent_seconds: number | null;
      started_at: string;
      finished_at: string | null;
      status: string;
    }>
  >([]);
  const [loadingAttemptDetailsId, setLoadingAttemptDetailsId] = useState<string | null>(null);
  const [activeReviewAttemptId, setActiveReviewAttemptId] = useState<string | null>(initialAttemptId);
  const examNavButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const examNavContainerRef = useRef<HTMLDivElement | null>(null);
  const reviewNavButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reviewDesktopNavContainerRef = useRef<HTMLDivElement | null>(null);
  const reviewMobileNavContainerRef = useRef<HTMLDivElement | null>(null);
  const updateAttemptQuery = (attemptValue: string | null) => {
    const url = attemptValue
      ? `/grile/source/${sourceId}/exam?attempt=${encodeURIComponent(attemptValue)}`
      : `/grile/source/${sourceId}/exam`;
    router.replace(url, { scroll: false });
  };

  const saveAnswerForQuestion = async (questionId: string, selectedAnswers: string[]) => {
    if (!attemptId) return;
    await apiFetch(`/api/grile/exam-attempts/${attemptId}/answers`, {
      method: "POST",
      body: JSON.stringify({
        questionId,
        selectedAnswers,
      }),
    });
  };

  const loadAttemptState = async (attemptToLoad: string) => {
    const stateResponse = await apiFetch<{
      data: {
        attempt: {
          id: string;
          status: string;
          duration_seconds: number;
          started_at: string;
        };
        answers: Array<{ question_id: string; selected_answers: string }>;
      };
    }>(`/api/grile/exam-attempts/${attemptToLoad}/state`);
    const mappedAnswers: Record<string, string[]> = {};
    for (const answer of stateResponse.data.answers) {
      mappedAnswers[answer.question_id] = answer.selected_answers
        .split("")
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean)
        .sort();
    }
    setAnswers(mappedAnswers);
    const startedAt = new Date(stateResponse.data.attempt.started_at).getTime();
    const duration = stateResponse.data.attempt.duration_seconds;
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    const remaining = Math.max(0, duration - elapsedSeconds);
    setDurationSeconds(duration);
    setStartedAtMs(startedAt);
    setTimeLeft(remaining);
  };


  const displayQuestions = useMemo(
    () => questions.map((question) => ({ ...question, ...questionOverrides[question.id] })),
    [questions, questionOverrides],
  );

  const handleAdminContentSaved = (content: GrilaAdminContent) => {
    setQuestionOverrides((prev) => ({
      ...prev,
      [content.id]: {
        hint: content.hint,
        short_explanation: content.short_explanation,
        full_explanation: content.full_explanation,
        explanation: content.full_explanation ?? content.short_explanation,
        video_url: content.video_url,
        image_url: content.image_url,
      },
    }));
  };

  const activeQuestion = displayQuestions[activeIndex];
  const activeFeedbackType: FeedbackType | null = activeModal;
  const feedbackKey = activeQuestion && activeFeedbackType ? `${activeQuestion.id}:${activeFeedbackType}` : null;
  const activeFeedbackRating = feedbackKey ? feedbackRatings[feedbackKey] ?? null : null;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < questions.length - 1;
  const optionsCount = Math.min(Math.max(activeQuestion?.variants_count ?? 4, 2), 10);
  const options = useMemo(() => LETTERS.slice(0, optionsCount), [optionsCount]);
  const pointsPerQuestion = useMemo(() => (questions.length > 0 ? 90 / questions.length : 0), [questions.length]);
  const finalGradeOutOf10 = result ? result.score_total / 10 : 0;
  const gridScoreOutOf10 = result ? result.score_without_bonus / 10 : 0;
  const answeredMap = useMemo(
    () =>
      Object.fromEntries(
        questions.map((question) => [question.id, (answers[question.id] ?? []).length > 0]),
      ) as Record<string, boolean>,
    [answers, questions],
  );
  const unansweredCount = useMemo(
    () => questions.reduce((count, question) => count + ((answers[question.id] ?? []).length === 0 ? 1 : 0), 0),
    [answers, questions],
  );

  const loadAttemptDetails = async (attemptIdToLoad: string, syncUrl = true) => {
    try {
      setLoadingAttemptDetailsId(attemptIdToLoad);
      const response = await apiFetch<{
        data: {
          score_total: number;
          score_without_bonus: number;
          bonus_points: number;
          time_spent_seconds: number;
          finished_at: string;
          breakdown: Array<{
            question_id: string;
            order: number;
            selected_answers: string;
            correct_answers: string;
            score: number;
          }>;
        };
      }>(`/api/grile/exam-attempts/${attemptIdToLoad}/review`);
      setResult(response.data);
      setActiveIndex(0);
      setActiveReviewAttemptId(attemptIdToLoad);
      if (syncUrl) updateAttemptQuery(attemptIdToLoad);
    } catch {
      setError("Nu am putut incarca detaliile simularii.");
    } finally {
      setLoadingAttemptDetailsId(null);
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const questionsResponse = await apiFetch<{
          data: { config: { mode_enabled: boolean; duration_seconds: number }; questions: ExamQuestion[] };
        }>(`/api/grile/sources/${sourceId}/exam-questions`);
        if (cancelled) return;
        if (!questionsResponse.data.config.mode_enabled) {
          setError("Modul examen nu este activ pentru aceasta sursa.");
          return;
        }
        setQuestions(questionsResponse.data.questions);
        if (initialAttemptId) {
          if (cancelled) return;
          await loadAttemptDetails(initialAttemptId, false);
          return;
        }
        const activeResponse = await apiFetch<{
          data: {
            attempt: {
              id: string;
              source_id: string;
              source_name: string;
              started_at: string;
              duration_seconds: number;
              question_count: number;
              scoring_mode: string;
            } | null;
          };
        }>(`/api/grile/sources/${sourceId}/exam-attempts/active`);
        if (cancelled) return;
        if (activeResponse.data.attempt) {
          if (activeResponse.data.attempt.source_id !== sourceId) {
            setError(
              `Nu am putut porni modul examen pentru ca esti momentan intr-un alt examen: "${activeResponse.data.attempt.source_name}"`,
            );
            return;
          }
          setAttemptId(activeResponse.data.attempt.id);
          setDurationSeconds(activeResponse.data.attempt.duration_seconds);
          setStartedAtMs(new Date(activeResponse.data.attempt.started_at).getTime());
          await loadAttemptState(activeResponse.data.attempt.id);
          if (cancelled) return;
          setReady(true);
          return;
        }
        const startResponse = await apiFetch<{
          data: { attempt_id: string; started_at: string; duration_seconds: number };
        }>(`/api/grile/sources/${sourceId}/exam-attempts/start`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (cancelled) return;
        setAttemptId(startResponse.data.attempt_id);
        setDurationSeconds(startResponse.data.duration_seconds);
        setStartedAtMs(new Date(startResponse.data.started_at).getTime());
        await loadAttemptState(startResponse.data.attempt_id);
        if (cancelled) return;
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        const payload = extractApiErrorPayload(error);
        if (payload?.code === "EXAM_ALREADY_IN_PROGRESS") {
          const sourceNameBusy =
            typeof payload.data?.source_name === "string" ? payload.data.source_name : "o alta sursa";
          setError(`Nu am putut porni modul examen pentru ca esti momentan intr-un alt examen: "${sourceNameBusy}"`);
          return;
        }
        setError("Nu am putut porni modul examen.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialAttemptId, loading, sourceId, user]);

  useEffect(() => {
    if (!user) return;
    void apiFetch<{
      data: Array<{ question_id: string; is_flagged: boolean; in_my_list: boolean }>;
    }>(`/api/grile/sources/${sourceId}/progress`)
      .then((response) => {
        const myMap: Record<string, boolean> = {};
        const flaggedMap: Record<string, boolean> = {};
        for (const item of response.data) {
          myMap[item.question_id] = item.in_my_list;
          flaggedMap[item.question_id] = item.is_flagged;
        }
        setMyList(myMap);
        setFlaggedList(flaggedMap);
      })
      .catch(() => {
        setMyList({});
        setFlaggedList({});
      });
  }, [sourceId, user]);

  const loadAttemptHistory = async () => {
    if (!user) {
      setAttemptHistory([]);
      return;
    }
    try {
      const response = await apiFetch<{
        data: Array<{
          id: string;
          score_total: number | null;
          score_without_bonus: number | null;
          question_count: number;
          time_spent_seconds: number | null;
          started_at: string;
          finished_at: string | null;
          status: string;
        }>;
      }>(`/api/grile/sources/${sourceId}/exam-attempts`);
      setAttemptHistory(response.data);
    } catch {
      setAttemptHistory([]);
    }
  };

  useEffect(() => {
    void loadAttemptHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, user]);

  useEffect(() => {
    if (!ready || result || !attemptId || !startedAtMs) return;
    const tick = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      const remaining = Math.max(0, durationSeconds - elapsedSeconds);
      setTimeLeft(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attemptId, durationSeconds, ready, result, startedAtMs]);

  useEffect(() => {
    if (result) return;
    const q = questions[activeIndex];
    const container = examNavContainerRef.current;
    const button = q ? examNavButtonRefs.current[q.id] : null;
    if (!container || !button || !container.contains(button)) return;

    const scrollId = requestAnimationFrame(() => {
      const relativeTop = button.offsetTop;
      const targetTop = relativeTop - container.clientHeight / 2 + button.clientHeight / 2;
      const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
      const nextTop = Math.max(0, Math.min(targetTop, maxTop));
      container.scrollTo({ top: nextTop, behavior: "smooth" });
    });

    return () => cancelAnimationFrame(scrollId);
  }, [activeIndex, questions, result]);

  useEffect(() => {
    if (!result) return;
    const q = questions[activeIndex];
    if (!q) return;

    const scrollId = requestAnimationFrame(() => {
      const button = reviewNavButtonRefs.current[q.id];
      const containers = [reviewDesktopNavContainerRef.current, reviewMobileNavContainerRef.current];
      for (const container of containers) {
        if (!container || !button || !container.contains(button)) continue;
        const relativeTop = button.offsetTop;
        const targetTop = relativeTop - container.clientHeight / 2 + button.clientHeight / 2;
        const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
        const nextTop = Math.max(0, Math.min(targetTop, maxTop));
        container.scrollTo({ top: nextTop, behavior: "smooth" });
      }
    });

    return () => cancelAnimationFrame(scrollId);
  }, [activeIndex, questions, result]);

  useEffect(() => {
    if (!result || !user || !activeQuestion || !activeFeedbackType) return;
    const key = `${activeQuestion.id}:${activeFeedbackType}`;
    if (feedbackRatings[key]) return;
    void apiFetch<{ data: { content_type: FeedbackType; rating: number | null } }>(
      `/api/grile/questions/${activeQuestion.id}/content-feedback?contentType=${activeFeedbackType}`,
    )
      .then((response) => {
        if (response.data.rating) {
          setFeedbackRatings((prev) => ({ ...prev, [key]: response.data.rating as number }));
        }
      })
      .catch(() => undefined);
  }, [activeFeedbackType, activeQuestion, feedbackRatings, result, user]);

  useEffect(() => {
    if (!communityStatsOpen || !activeQuestion || !result) return;
    if (!user) {
      setCommunityStats(null);
      setCommunityStatsLoading(false);
      setCommunityStatsError("Trebuie sa fii conectat ca sa vezi statisticile comunitatii.");
      return;
    }
    setCommunityStatsLoading(true);
    setCommunityStatsError(null);
    void apiFetch<{ data: CommunityGrilaStats }>(`/api/grile/questions/${activeQuestion.id}/community-stats`)
      .then((response) => setCommunityStats(response.data))
      .catch(() => {
        setCommunityStats(null);
        setCommunityStatsError("Nu am putut incarca statisticile comunitatii.");
      })
      .finally(() => setCommunityStatsLoading(false));
  }, [communityStatsOpen, activeQuestion?.id, user, result]);

  const toggleAnswer = (letter: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => {
      const current = prev[activeQuestion.id] ?? [];
      const next = current.includes(letter)
        ? current.filter((item) => item !== letter)
        : [...current, letter].sort();
      void saveAnswerForQuestion(activeQuestion.id, next).catch(() => undefined);
      return { ...prev, [activeQuestion.id]: next };
    });
  };

  const saveCurrentAnswer = async () => {
    if (!activeQuestion || !attemptId) return;
    await saveAnswerForQuestion(activeQuestion.id, answers[activeQuestion.id] ?? []);
  };

  const goNext = async () => {
    await saveCurrentAnswer();
    if (canGoNext) setActiveIndex((idx) => idx + 1);
  };

  const goPrev = async () => {
    await saveCurrentAnswer();
    if (canGoPrev) setActiveIndex((idx) => idx - 1);
  };

  const goToQuestion = async (index: number) => {
    if (!questions.length) return;
    const clamped = Math.max(0, Math.min(questions.length - 1, index));
    await saveCurrentAnswer();
    setActiveIndex(clamped);
  };

  const handleFinishExam = async () => {
    if (!attemptId || finishing || result) return;
    setFinishing(true);
    try {
      await saveCurrentAnswer();
      const finishResponse = await apiFetch<{
        data: {
          score_total: number;
          score_without_bonus: number;
          bonus_points: number;
          time_spent_seconds: number;
          finished_at: string;
          breakdown: Array<{
            question_id: string;
            order: number;
            selected_answers: string;
            correct_answers: string;
            score: number;
          }>;
        };
      }>(`/api/grile/exam-attempts/${attemptId}/finish`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setResult(finishResponse.data);
      setActiveReviewAttemptId(attemptId);
      updateAttemptQuery(attemptId);
      await loadAttemptHistory();
    } catch {
      setError("Nu am putut finaliza examenul.");
    } finally {
      setFinishing(false);
    }
  };

  useEffect(() => {
    if (!ready || result || !attemptId || !startedAtMs || timeLeft > 0) return;
    void handleFinishExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, ready, result, attemptId, startedAtMs]);

  const toggleFlag = async () => {
    if (!activeQuestion || !user) return;
    const next = !flaggedList[activeQuestion.id];
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/flag`, {
        method: "POST",
        body: JSON.stringify({ value: next }),
      });
      setFlaggedList((prev) => ({ ...prev, [activeQuestion.id]: next }));
    } catch {
      // no-op
    }
  };

  const toggleMyList = async () => {
    if (!activeQuestion || !user) return;
    const next = !myList[activeQuestion.id];
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/my-list`, {
        method: "POST",
        body: JSON.stringify({ value: next }),
      });
      setMyList((prev) => ({ ...prev, [activeQuestion.id]: next }));
    } catch {
      // no-op
    }
  };

  const saveContentFeedback = async (rating: number) => {
    if (!activeQuestion || !activeFeedbackType || !result) return;
    if (!user) return;
    const key = `${activeQuestion.id}:${activeFeedbackType}`;
    setFeedbackSaving(true);
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/content-feedback`, {
        method: "POST",
        body: JSON.stringify({ contentType: activeFeedbackType, rating }),
      });
      setFeedbackRatings((prev) => ({ ...prev, [key]: rating }));
    } catch {
      // no-op
    } finally {
      setFeedbackSaving(false);
    }
  };

  if (loading) return <p className="text-sm font-medium text-slate-600">Se incarca...</p>;
  if (!user) return <p className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-800">Trebuie sa fii logat ca sa intri in Mod Examen.</p>;
  if (error) return <p className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>;

  if (result) {
    const breakdownByQuestionId = new Map(result.breakdown.map((item) => [item.question_id, item]));
    const reviewItem = activeQuestion ? breakdownByQuestionId.get(activeQuestion.id) : null;
    const canReviewPrev = activeIndex > 0;
    const canReviewNext = activeIndex < questions.length - 1;

    const reviewStateByQuestionId: Record<string, "correct" | "partial" | "wrong"> = {};
    for (const item of result.breakdown) {
      if (item.score <= 0) {
        reviewStateByQuestionId[item.question_id] = "wrong";
      } else if (item.score + 0.01 >= pointsPerQuestion) {
        reviewStateByQuestionId[item.question_id] = "correct";
      } else {
        reviewStateByQuestionId[item.question_id] = "partial";
      }
    }

    return (
      <div className="space-y-5">
        <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)]">
          <h2 className="text-xl font-bold text-sky-950">Rezultat final</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/70 p-3">
              <p className="text-xs text-slate-600">Sursa</p>
              <p className="mt-1 text-sm font-semibold text-sky-950">{sourceName}</p>
            </article>
            <article className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 p-3">
              <p className="text-xs text-slate-700">Nota finala</p>
              <p className="mt-1 text-sm font-extrabold text-slate-900">{finalGradeOutOf10.toFixed(2)} / 10</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/70 p-3">
              <p className="text-xs text-slate-600">Punctaj grile</p>
              <p className="mt-1 text-sm font-semibold text-sky-950">{gridScoreOutOf10.toFixed(2)} / 10</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/70 p-3">
              <p className="text-xs text-slate-600">Durata</p>
              <p className="mt-1 text-sm font-semibold text-sky-950">{formatTimeLeft(result.time_spent_seconds)}</p>
            </article>
            <article className="rounded-2xl border border-sky-200 bg-gradient-to-b from-white to-sky-50/70 p-3">
              <p className="text-xs text-slate-600">Finalizat la</p>
              <p className="mt-1 text-sm font-semibold text-sky-950">{new Date(result.finished_at).toLocaleString("ro-RO")}</p>
            </article>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[230px_minmax(0,1fr)_280px]">
          <aside className="hidden rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:block">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator grile</p>
            <div ref={reviewDesktopNavContainerRef} className="max-h-[680px] space-y-1 overflow-auto pr-1">
              {questions.map((question, idx) => {
                const state = reviewStateByQuestionId[question.id] ?? "wrong";
                return (
                  <button
                    key={`review-nav-${question.id}`}
                    ref={(element) => {
                      reviewNavButtonRefs.current[question.id] = element;
                    }}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                      idx === activeIndex
                        ? "border-amber-400 bg-gradient-to-r from-amber-200 to-yellow-200 text-slate-900 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                    }`}
                  >
                    <span className="font-medium">Grila {question.order_index ?? idx + 1}</span>
                    <span className="flex items-center gap-3">
                      <span
                        className={`inline-flex w-5 justify-center text-lg font-black ${
                          state === "correct"
                            ? "text-emerald-600"
                            : state === "partial"
                              ? "text-orange-500"
                              : "text-rose-600"
                        }`}
                        aria-hidden
                      >
                        {state === "correct" ? "✓" : state === "partial" ? "~" : "✕"}
                      </span>
                      <span
                        className={`text-lg leading-none ${
                          myList[question.id] ? "text-yellow-500" : "text-slate-300"
                        }`}
                        aria-label={myList[question.id] ? "In lista mea" : "Nu este in lista mea"}
                      >
                        {myList[question.id] ? "★" : "☆"}
                      </span>
                      <span
                        className={`inline-flex w-5 items-center justify-center text-lg leading-none font-bold ${
                          flaggedList[question.id] ? "text-rose-600" : "text-slate-300"
                        }`}
                        aria-label={flaggedList[question.id] ? "Intrebare marcata" : "Intrebare nemarcata"}
                      >
                        ?
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] sm:p-5">
            <h3 className="text-lg font-semibold text-sky-950">Review raspunsuri</h3>
            {activeQuestion ? (
              <>
                <div className="mt-3 grid grid-cols-6 gap-2 xl:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveModal("hint")}
                    className="rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 px-2 py-2 text-center text-xs font-extrabold text-slate-900 transition hover:brightness-95"
                    title="Vezi Indicatii"
                  >
                    💡
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal("short_explanation")}
                    className="rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 px-2 py-2 text-center text-xs font-extrabold text-slate-900 transition hover:brightness-95"
                    title="Vezi Explicatie scurta"
                  >
                    📘
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal("full_explanation")}
                    className="rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 px-2 py-2 text-center text-xs font-extrabold text-slate-900 transition hover:brightness-95"
                    title="Vezi Explicatie lunga"
                  >
                    📗
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal("video")}
                    className="rounded-xl border-2 border-yellow-300 bg-gradient-to-r from-yellow-100 to-amber-100 px-2 py-2 text-center text-xs font-extrabold text-slate-900 transition hover:brightness-95"
                    title="Vezi Video"
                  >
                    ▶️
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleFlag()}
                    className={`rounded-xl border-2 px-2 py-2 text-center text-xs font-extrabold transition ${
                      flaggedList[activeQuestion.id]
                        ? "border-rose-500 bg-gradient-to-r from-rose-200 to-amber-200 text-rose-900"
                        : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
                    }`}
                    title="Marcheaza intrebare"
                  >
                    {flaggedList[activeQuestion.id] ? "❓✅" : "❓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleMyList()}
                    className={`rounded-xl border-2 px-2 py-2 text-center text-xs font-extrabold transition ${
                      myList[activeQuestion.id]
                        ? "border-amber-500 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900"
                        : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
                    }`}
                    title="Lista mea"
                  >
                    {myList[activeQuestion.id] ? "⭐✅" : "⭐"}
                  </button>
                </div>
                <p className="mt-2 text-sm font-semibold text-sky-950">
                  Grila {activeQuestion.order_index ?? activeIndex + 1}
                </p>
                {activeQuestion.image_url ? (
                  <div className="mt-3">
                    <GrilaImage
                      src={activeQuestion.image_url}
                      alt={`Review grila ${activeQuestion.order_index ?? activeIndex + 1}`}
                      className="xl:max-h-[70vh]"
                    />
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-8 text-center text-sm font-medium text-slate-500">
                    Imagine indisponibila
                  </div>
                )}
                <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/40 p-3 text-sm">
                  <p className="text-slate-700">Raspunsul tau: <span className="font-semibold text-sky-950">{reviewItem?.selected_answers || "-"}</span></p>
                  <p className="text-slate-700">Raspuns corect: <span className="font-semibold text-sky-950">{reviewItem?.correct_answers || "-"}</span></p>
                  <p className="text-slate-700">Punctaj grila: <span className="font-semibold text-sky-950">{(reviewItem?.score ?? 0).toFixed(2)}</span></p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 xl:hidden">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
                    disabled={!canReviewPrev}
                    className="rounded-lg border border-yellow-500 bg-yellow-400 px-3 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-50"
                  >
                    Grila anterioara
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                    disabled={!canReviewNext}
                    className="rounded-lg border border-yellow-500 bg-yellow-400 px-3 py-2 text-base font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-50"
                  >
                    Grila urmatoare
                  </button>
                </div>
              </>
            ) : null}
          </section>

          <aside className="hidden rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:block">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Actiuni review</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveModal("hint")}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95"
              >
                Vezi Indicatii
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("short_explanation")}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95"
              >
                Vezi Explicatie scurta
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("full_explanation")}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95"
              >
                Vezi Explicatie lunga
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("video")}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95"
              >
                Vezi explicatia Video
              </button>
              <button
                type="button"
                onClick={() => setCommunityStatsOpen(true)}
                className="w-full rounded-xl border-2 border-sky-400 bg-gradient-to-r from-sky-100 to-sky-50 px-3 py-2.5 text-base font-extrabold text-sky-950 transition hover:brightness-95"
              >
                Statistici comunitate
              </button>
              <button
                type="button"
                onClick={() => void toggleFlag()}
                className={`w-full rounded-xl border-2 px-3 py-2.5 text-base font-extrabold transition ${
                  flaggedList[activeQuestion?.id ?? ""]
                    ? "border-rose-500 bg-gradient-to-r from-rose-200 to-amber-200 text-rose-900"
                    : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
                }`}
              >
                {flaggedList[activeQuestion?.id ?? ""] ? "❓ Demarcheaza" : "❓ Marcheaza intrebare"}
              </button>
              <button
                type="button"
                onClick={() => void toggleMyList()}
                className={`w-full rounded-xl border-2 px-3 py-2.5 text-base font-extrabold transition ${
                  myList[activeQuestion?.id ?? ""]
                    ? "border-amber-500 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900"
                    : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
                }`}
              >
                {myList[activeQuestion?.id ?? ""] ? "⭐ Elimina din lista" : "⭐ Adauga in Lista mea"}
              </button>
              {activeQuestion ? (
                <GrilaAdministrationButton questionId={activeQuestion.id} onSaved={handleAdminContentSaved} />
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
                  disabled={!canReviewPrev}
                  className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:opacity-50"
                >
                  Grila anterioara
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                  disabled={!canReviewNext}
                  className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:opacity-50"
                >
                  Grila urmatoare
                </button>
              </div>
            </div>
          </aside>
        </div>

        <aside className="rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:hidden">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator grile</p>
          <div ref={reviewMobileNavContainerRef} className="max-h-[320px] space-y-1 overflow-auto pr-1">
            {questions.map((question, idx) => {
              const state = reviewStateByQuestionId[question.id] ?? "wrong";
              return (
                <button
                  key={`review-mobile-nav-${question.id}`}
                  ref={(element) => {
                    reviewNavButtonRefs.current[question.id] = element;
                  }}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                    idx === activeIndex
                      ? "border-amber-400 bg-gradient-to-r from-amber-200 to-yellow-200 text-slate-900 shadow-sm"
                      : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  <span className="font-medium">Grila {question.order_index ?? idx + 1}</span>
                  <span className="flex items-center gap-3">
                    <span
                      className={`inline-flex w-5 justify-center text-lg font-black ${
                        state === "correct"
                          ? "text-emerald-600"
                          : state === "partial"
                            ? "text-orange-500"
                            : "text-rose-600"
                      }`}
                      aria-hidden
                    >
                      {state === "correct" ? "✓" : state === "partial" ? "~" : "✕"}
                    </span>
                    <span
                      className={`text-lg leading-none ${
                        myList[question.id] ? "text-yellow-500" : "text-slate-300"
                      }`}
                      aria-label={myList[question.id] ? "In lista mea" : "Nu este in lista mea"}
                    >
                      {myList[question.id] ? "★" : "☆"}
                    </span>
                    <span
                      className={`inline-flex w-5 items-center justify-center text-lg leading-none font-bold ${
                        flaggedList[question.id] ? "text-rose-600" : "text-slate-300"
                      }`}
                      aria-label={flaggedList[question.id] ? "Intrebare marcata" : "Intrebare nemarcata"}
                    >
                      ?
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {activeQuestion ? (
          <GrilaCommunityStatsModal
            open={communityStatsOpen}
            onClose={() => setCommunityStatsOpen(false)}
            questionLabel={String(activeQuestion.order_index ?? activeIndex + 1)}
            loading={communityStatsLoading}
            error={communityStatsError}
            stats={communityStats}
          />
        ) : null}

        {activeModal && activeQuestion ? (
          <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-sky-100 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-sky-950">
                  {activeModal === "hint"
                    ? "Indicatii"
                    : activeModal === "short_explanation"
                      ? "Explicatie scurta"
                      : activeModal === "full_explanation"
                        ? "Explicatie lunga"
                        : "Rezolvare Video"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
                >
                  Inchide
                </button>
              </div>

              {activeModal === "hint" ? (
                <MarkdownLatexContent
                  content={activeQuestion.hint || "Nu exista indicii."}
                  className="whitespace-pre-wrap text-sm leading-6 text-slate-800"
                />
              ) : null}
              {activeModal === "short_explanation" ? (
                <MarkdownLatexContent
                  content={activeQuestion.short_explanation || "Nu exista explicatie scurta."}
                  className="whitespace-pre-wrap text-sm leading-6 text-slate-800"
                />
              ) : null}
              {activeModal === "full_explanation" ? (
                <MarkdownLatexContent
                  content={activeQuestion.full_explanation || activeQuestion.explanation || "Nu exista explicatie lunga."}
                  className="whitespace-pre-wrap text-sm leading-6 text-slate-800"
                />
              ) : null}
              {activeModal === "video" ? (
                activeQuestion.video_url ? (
                  <iframe
                    src={toVimeoEmbedUrl(activeQuestion.video_url) ?? undefined}
                    title={`Video review grila ${activeQuestion.order_index ?? activeQuestion.legacy_id}`}
                    className="aspect-video w-full rounded-xl border border-sky-100"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-sm text-slate-700">Nu exista video pentru aceasta grila.</p>
                )
              ) : null}
              <ContentFeedbackStars
                value={activeFeedbackRating}
                saving={feedbackSaving}
                disabled={!user}
                onRate={(value) => void saveContentFeedback(value)}
              />
            </div>
          </div>
          </ModalPortal>
        ) : null}
        <div className="rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] sm:p-5">
          <h3 className="text-lg font-semibold text-sky-950">Istoric simulari</h3>
          {attemptHistory.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Nu ai simulari finalizate pentru aceasta sursa.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-600">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Nota</th>
                    <th className="px-3 py-2 font-semibold">Punctaj grile</th>
                    <th className="px-3 py-2 font-semibold">Intrebari</th>
                    <th className="px-3 py-2 font-semibold">Durata</th>
                    <th className="px-3 py-2 font-semibold">Detalii</th>
                  </tr>
                </thead>
                <tbody>
                  {attemptHistory.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-sky-50 text-slate-800">
                      <td className="px-3 py-2">{new Date(attempt.finished_at ?? attempt.started_at).toLocaleString("ro-RO")}</td>
                      <td className="px-3 py-2 font-semibold">{((attempt.score_total ?? 0) / 10).toFixed(2)} / 10</td>
                      <td className="px-3 py-2">{((attempt.score_without_bonus ?? 0) / 10).toFixed(2)} / 9</td>
                      <td className="px-3 py-2">{attempt.question_count}</td>
                      <td className="px-3 py-2">{formatTimeLeft(attempt.time_spent_seconds ?? 0)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void loadAttemptDetails(attempt.id, true)}
                          disabled={loadingAttemptDetailsId === attempt.id}
                          className={`rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold disabled:opacity-50 ${
                            activeReviewAttemptId === attempt.id
                              ? "border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900"
                              : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
                          }`}
                        >
                          {loadingAttemptDetailsId === attempt.id ? "Se incarca..." : "Detalii"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!ready || !activeQuestion) return <p className="text-sm font-medium text-slate-600">Se pregateste examenul...</p>;

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-20 flex items-center justify-between rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-200/95 to-amber-200/95 p-3 shadow-[0_12px_32px_-18px_rgba(245,158,11,0.65)] backdrop-blur">
        <p className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Mod Examen - {sourceName}</p>
        <p className={`text-base font-extrabold ${timeLeft <= 900 ? "animate-pulse text-rose-700" : "text-slate-900"}`}>{formatTimeLeft(timeLeft)}</p>
      </div>

      <section className="rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] sm:p-5">
        <div className="mb-3">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator grile</p>
          <div ref={examNavContainerRef} className="max-h-[150px] overflow-auto rounded-2xl border border-sky-200 bg-sky-50/60 p-2">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
              {questions.map((question, idx) => {
                const answered = answeredMap[question.id];
                return (
                  <button
                    key={`exam-nav-${question.id}`}
                    type="button"
                    ref={(element) => {
                      examNavButtonRefs.current[question.id] = element;
                    }}
                    onClick={() => void goToQuestion(idx)}
                    className={`rounded-xl border px-2 py-1.5 text-xs font-extrabold transition ${
                      idx === activeIndex
                        ? "border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 text-slate-900"
                        : answered
                          ? "border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "border-sky-200 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                    title={answered ? "Raspuns salvat" : "Fara raspuns"}
                  >
                    {question.order_index ?? idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mb-3 text-sm font-semibold text-sky-950">Grila {activeQuestion.order_index ?? activeIndex + 1}</p>
        {activeQuestion.image_url ? (
          <GrilaImage src={activeQuestion.image_url} alt={`Grila ${activeIndex + 1}`} className="xl:max-h-[70vh]" />
        ) : (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-8 text-center text-sm font-medium text-slate-500">Imagine indisponibila</div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => toggleAnswer(letter)}
              className={`rounded-xl border-2 px-3 py-1.5 text-sm font-extrabold transition ${
                (answers[activeQuestion.id] ?? []).includes(letter)
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
            onClick={() => void goPrev()}
            disabled={!canGoPrev}
            className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-50"
          >
            Inapoi
          </button>
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={!canGoNext}
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
          <div
            className="w-full max-w-md rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-sky-950">Finalizezi examenul?</h3>
            <p className="mt-2 text-sm text-slate-700">
              {unansweredCount > 0
                ? `Nu ai raspuns inca la toate intrebarile (${unansweredCount} ramase). Sigur vrei sa inchizi?`
                : "Sigur ai terminat? Dupa finalizare nu mai poti modifica raspunsurile."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinishConfirmOpen(false)}
                className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-sky-50"
              >
                Continua examenul
              </button>
              <button
                type="button"
                onClick={() => {
                  setFinishConfirmOpen(false);
                  void handleFinishExam();
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
