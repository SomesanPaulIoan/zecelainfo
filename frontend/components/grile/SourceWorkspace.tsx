"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { ContentFeedbackStars } from "@/components/grile/ContentFeedbackStars";
import { GrilaCommunityStatsModal, type CommunityGrilaStats } from "@/components/grile/GrilaCommunityStatsModal";
import { GrilaImage } from "@/components/grile/GrilaImage";
import { GrilaAdministrationButton } from "@/components/grile/GrilaAdministrationButton";
import type { GrilaAdminContent } from "@/components/grile/GrilaAdminContentModal";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { toVimeoEmbedUrl } from "@/lib/vimeo";

type SourceQuestion = {
  id: string;
  legacy_id: number;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  explanation: string | null;
  video_url: string | null;
  difficulty: number | null;
  order_index: number | null;
  variants_count: number | null;
  chapter_names: string[] | null;
  source_name?: string | null;
  is_flagged?: boolean;
  in_my_list?: boolean;
  last_attempt_at?: string | null;
  has_correct_attempt?: boolean;
  has_wrong_attempt?: boolean;
};

type SourceWorkspaceProps = {
  sourceId: string;
  categoryName: string;
  sourceName: string;
  questions: SourceQuestion[];
  contextLabel?: string;
  contextPurpose?: string;
  progressScope?: "source" | "chapter" | "homework" | "none";
  homeworkAssignmentId?: string;
  /** Vizualizare admin: fara verificare raspuns / marcaje. */
  readOnly?: boolean;
  /** Navigator: Grila 1, 2, 3… (sortare dupa order_index, afisare secventiala). */
  sequentialNavNumbers?: boolean;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function questionDisplayNumber(_question: SourceQuestion, index: number): number {
  return index + 1;
}

function sortOrderValue(orderIndex: number | null | undefined): number {
  if (orderIndex == null) return Number.MAX_SAFE_INTEGER;
  const numeric = Number(orderIndex);
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER;
}

function sortQuestionsForDisplay(questions: SourceQuestion[]) {
  return [...questions].sort((a, b) => {
    const orderA = sortOrderValue(a.order_index);
    const orderB = sortOrderValue(b.order_index);
    if (orderA !== orderB) return orderA - orderB;
    return (a.legacy_id ?? 0) - (b.legacy_id ?? 0);
  });
}

type ProgressItem = {
  question_id: string;
  is_flagged: boolean;
  in_my_list: boolean;
  last_attempt_at: string | null;
  last_is_correct: boolean | null;
  has_correct_attempt: boolean;
  has_wrong_attempt: boolean;
};
type FeedbackType = "hint" | "short_explanation" | "full_explanation" | "video";

export function SourceWorkspace({
  sourceId,
  categoryName,
  sourceName,
  questions,
  contextLabel = "Sursa",
  contextPurpose = "Din ce set provine grila",
  progressScope = "source",
  homeworkAssignmentId,
  readOnly = false,
}: SourceWorkspaceProps) {
  const { user } = useAuth();
  const [questionOverrides, setQuestionOverrides] = useState<Record<string, Partial<SourceQuestion>>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"hint" | "short_explanation" | "full_explanation" | "video" | null>(null);
  const [myList, setMyList] = useState<Record<string, boolean>>({});
  const [flaggedList, setFlaggedList] = useState<Record<string, boolean>>({});
  const [lastSolvedAt, setLastSolvedAt] = useState<Record<string, string | null>>({});
  const [hasCorrectAttempt, setHasCorrectAttempt] = useState<Record<string, boolean>>({});
  const [hasWrongAttempt, setHasWrongAttempt] = useState<Record<string, boolean>>({});
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({});
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSaving, setReportSaving] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [communityStatsOpen, setCommunityStatsOpen] = useState(false);
  const [communityStats, setCommunityStats] = useState<CommunityGrilaStats | null>(null);
  const [communityStatsLoading, setCommunityStatsLoading] = useState(false);
  const [communityStatsError, setCommunityStatsError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const desktopNavContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileNavContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopNavButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileNavButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedQuestions = useMemo(() => sortQuestionsForDisplay(questions), [questions]);
  const displayQuestions = useMemo(
    () => sortedQuestions.map((question) => ({ ...question, ...questionOverrides[question.id] })),
    [sortedQuestions, questionOverrides],
  );

  const activeQuestion = displayQuestions[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < displayQuestions.length - 1;

  const handleAdminContentSaved = (content: GrilaAdminContent) => {
    setQuestionOverrides((prev) => ({
      ...prev,
      [content.id]: {
        answer: content.answer,
        hint: content.hint,
        short_explanation: content.short_explanation,
        full_explanation: content.full_explanation,
        video_url: content.video_url,
        image_url: content.image_url,
        explanation: content.full_explanation ?? content.short_explanation,
      },
    }));
  };
  const optionsCount = Math.min(Math.max(activeQuestion?.variants_count ?? 4, 2), 10);
  const options = useMemo(() => LETTERS.slice(0, optionsCount), [optionsCount]);
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => ({
        id: index,
        left: Math.round(Math.random() * 100),
        duration: 1.6 + Math.random() * 1.6,
        delay: Math.random() * 0.35,
        rotate: Math.round(Math.random() * 360),
        color: ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#a855f7"][index % 5],
      })),
    [],
  );

  const goToQuestion = (index: number) => {
    setActiveIndex(index);
    setSelectedAnswers([]);
    setFeedback(null);
    setActiveModal(null);
  };

  const activeFeedbackType: FeedbackType | null = activeModal;
  const feedbackKey = activeFeedbackType ? `${activeQuestion.id}:${activeFeedbackType}` : null;
  const activeFeedbackRating = feedbackKey ? feedbackRatings[feedbackKey] ?? null : null;

  const applyProgressItems = (items: ProgressItem[]) => {
    const flagMap: Record<string, boolean> = {};
    const myListMap: Record<string, boolean> = {};
    const solvedMap: Record<string, string | null> = {};
    const correctMap: Record<string, boolean> = {};
    const wrongMap: Record<string, boolean> = {};
    for (const item of items) {
      flagMap[item.question_id] = item.is_flagged;
      myListMap[item.question_id] = item.in_my_list;
      solvedMap[item.question_id] = item.last_attempt_at;
      correctMap[item.question_id] = item.has_correct_attempt;
      wrongMap[item.question_id] = item.has_wrong_attempt;
    }
    setFlaggedList(flagMap);
    setMyList(myListMap);
    setLastSolvedAt(solvedMap);
    setHasCorrectAttempt(correctMap);
    setHasWrongAttempt(wrongMap);
  };

  const loadProgress = async () => {
    if (!user || progressScope === "none") return;
    const progressPath =
      progressScope === "homework" && homeworkAssignmentId
        ? `/api/meditations/homework/${homeworkAssignmentId}/progress`
        : progressScope === "chapter"
          ? `/api/grile/chapters/${sourceId}/progress`
          : `/api/grile/sources/${sourceId}/progress`;
    try {
      const response = await apiFetch<{ data: ProgressItem[] }>(progressPath);
      applyProgressItems(response.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadProgress();
  }, [progressScope, sourceId, user, homeworkAssignmentId]);

  const navStatusSymbol = (questionId: string) => {
    if (hasCorrectAttempt[questionId]) return "✓";
    if (hasWrongAttempt[questionId]) return "✕";
    return progressScope === "homework" ? "" : "·";
  };

  const navStatusClass = (questionId: string) => {
    if (hasCorrectAttempt[questionId]) return "text-emerald-600";
    if (hasWrongAttempt[questionId]) return "text-rose-600";
    return progressScope === "homework" ? "text-transparent" : "text-slate-300";
  };

  useEffect(() => {
    if (progressScope !== "none") return;
    const flagMap: Record<string, boolean> = {};
    const myListMap: Record<string, boolean> = {};
    const solvedMap: Record<string, string | null> = {};
    const correctMap: Record<string, boolean> = {};
    const wrongMap: Record<string, boolean> = {};
    for (const question of displayQuestions) {
      flagMap[question.id] = Boolean(question.is_flagged);
      myListMap[question.id] = Boolean(question.in_my_list);
      solvedMap[question.id] = question.last_attempt_at ?? null;
      correctMap[question.id] = Boolean(question.has_correct_attempt);
      wrongMap[question.id] = Boolean(question.has_wrong_attempt);
    }
    setFlaggedList(flagMap);
    setMyList(myListMap);
    setLastSolvedAt(solvedMap);
    setHasCorrectAttempt(correctMap);
    setHasWrongAttempt(wrongMap);
  }, [progressScope, displayQuestions]);

  useEffect(() => {
    if (activeIndex >= displayQuestions.length) {
      setActiveIndex(Math.max(0, displayQuestions.length - 1));
    }
  }, [activeIndex, displayQuestions.length]);

  useEffect(() => {
    const q = displayQuestions[activeIndex];
    if (!q) return;
    const desktopButton = desktopNavButtonRefs.current[q.id];
    const mobileButton = mobileNavButtonRefs.current[q.id];
    const desktopContainer = desktopNavContainerRef.current;
    const mobileContainer = mobileNavContainerRef.current;
    const desktopVisible = Boolean(desktopContainer && desktopContainer.offsetParent !== null);
    const container = desktopVisible ? desktopContainer : mobileContainer;
    const target = desktopVisible ? desktopButton : mobileButton;
    if (!container || !target) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetCenterY = targetRect.top - containerRect.top + container.scrollTop + targetRect.height / 2;
    const centeredTop = targetCenterY - container.clientHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollTo({
      top: Math.min(maxScrollTop, Math.max(0, centeredTop)),
      behavior: "smooth",
    });
  }, [activeIndex, displayQuestions]);

  useEffect(() => {
    if (!user || !activeFeedbackType || !activeQuestion) return;
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
  }, [activeFeedbackType, activeQuestion, feedbackRatings, user]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!communityStatsOpen || !activeQuestion) return;
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
  }, [communityStatsOpen, activeQuestion?.id, user]);

  const toggleAnswer = (letter: string) => {
    setSelectedAnswers((prev) =>
      prev.includes(letter) ? prev.filter((item) => item !== letter) : [...prev, letter].sort(),
    );
  };

  const checkAnswer = async () => {
    if (!activeQuestion) return;
    if (!user) {
      setFeedback("Trebuie sa fii logat ca sa verifici raspunsul.");
      return;
    }
    try {
      const response = await apiFetch<{
        data: { is_correct: boolean; expected_answer: string | null; attempted_at: string | null };
      }>(`/api/grile/questions/${activeQuestion.id}/check`, {
        method: "POST",
        body: JSON.stringify({ selectedAnswers }),
      });
      const ok = response.data.is_correct;
      setFeedback(ok ? "RASPUNS CORECT 🎉" : "RASPUNS GRESIT 😢");
      if (ok) {
        if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
        setShowCelebration(true);
        celebrationTimerRef.current = setTimeout(() => setShowCelebration(false), 3600);
      }
      if (progressScope === "homework") {
        await loadProgress();
      } else {
        setLastSolvedAt((prev) => ({ ...prev, [activeQuestion.id]: response.data.attempted_at }));
        setHasCorrectAttempt((prev) => ({ ...prev, [activeQuestion.id]: prev[activeQuestion.id] || ok }));
        setHasWrongAttempt((prev) => ({ ...prev, [activeQuestion.id]: prev[activeQuestion.id] || !ok }));
      }
    } catch {
      setFeedback("Nu am putut verifica raspunsul acum.");
    }
  };

  const markQuestion = async () => {
    if (!activeQuestion) return;
    if (!user) {
      setFeedback("Trebuie sa fii logat pentru marcaje.");
      return;
    }
    const next = !flaggedList[activeQuestion.id];
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/flag`, {
        method: "POST",
        body: JSON.stringify({ value: next }),
      });
      setFlaggedList((prev) => ({ ...prev, [activeQuestion.id]: next }));
    } catch {
      setFeedback("Nu am putut salva marcajul.");
    }
  };

  const toggleMyList = async () => {
    if (!activeQuestion) return;
    if (!user) {
      setFeedback("Trebuie sa fii logat pentru Lista mea.");
      return;
    }
    const next = !myList[activeQuestion.id];
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/my-list`, {
        method: "POST",
        body: JSON.stringify({ value: next }),
      });
      setMyList((prev) => ({ ...prev, [activeQuestion.id]: next }));
    } catch {
      setFeedback("Nu am putut salva in Lista mea.");
    }
  };

  const saveContentFeedback = async (rating: number) => {
    if (!activeQuestion || !activeFeedbackType) return;
    if (!user) {
      setFeedback("Trebuie sa fii logat ca sa votezi utilitatea explicatiei.");
      return;
    }
    const key = `${activeQuestion.id}:${activeFeedbackType}`;
    setFeedbackSaving(true);
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/content-feedback`, {
        method: "POST",
        body: JSON.stringify({ contentType: activeFeedbackType, rating }),
      });
      setFeedbackRatings((prev) => ({ ...prev, [key]: rating }));
    } catch {
      setFeedback("Nu am putut salva votul acum.");
    } finally {
      setFeedbackSaving(false);
    }
  };

  const submitIssueReport = async () => {
    if (!activeQuestion || !user) return;
    if (reportText.trim().length < 10) {
      setFeedback("Raportul trebuie sa aiba cel putin 10 caractere.");
      return;
    }
    setReportSaving(true);
    try {
      await apiFetch(`/api/grile/questions/${activeQuestion.id}/report-issue`, {
        method: "POST",
        body: JSON.stringify({ message: reportText.trim() }),
      });
      setReportModalOpen(false);
      setReportText("");
      setFeedback("Raport trimis. Multumim!");
    } catch {
      setFeedback("Nu am putut trimite raportul acum.");
    } finally {
      setReportSaving(false);
    }
  };

  const openReportModal = async () => {
    if (!activeQuestion || !user) {
      setFeedback("Trebuie sa fii logat ca sa raportezi o problema.");
      return;
    }
    setReportModalOpen(true);
    setReportLoading(true);
    try {
      const response = await apiFetch<{ data: { id: string; message: string; status: "open" | "resolved"; updated_at: string } | null }>(
        `/api/grile/questions/${activeQuestion.id}/report-issue`,
      );
      setReportText(response.data?.message ?? "");
    } catch {
      setReportText("");
    } finally {
      setReportLoading(false);
    }
  };

  if (!activeQuestion) {
    return (
      <div className="rounded-2xl border border-sky-100 bg-white p-6 text-slate-600">
        Nu exista grile in sursa selectata.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-5 text-[15px]">
      {showCelebration ? (
        <ModalPortal>
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-10%] block h-3 w-2"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate}deg)`,
                animation: `zli_confetti_fall ${piece.duration}s linear ${piece.delay}s forwards`,
              }}
              aria-hidden
            />
          ))}
        </div>
        </ModalPortal>
      ) : null}
      <style jsx>{`
        @keyframes zli_confetti_fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0.95;
          }
        }
      `}</style>
      <div className="rounded-[1.8rem] border border-sky-200/80 bg-white/90 p-4 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)] backdrop-blur-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-xl border border-sky-100 bg-white p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{contextLabel}</p>
            <p className="mt-0.5 text-sm text-slate-500">{contextPurpose}</p>
            <p className="mt-2 text-sm font-semibold text-sky-950">{sourceName}</p>
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Categorie</p>
            <p className="mt-0.5 text-sm text-slate-500">Examenul selectat</p>
            <p className="mt-2 text-sm font-semibold text-sky-950">{categoryName}</p>
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-3">
            {progressScope === "chapter" ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sursa</p>
                <p className="mt-0.5 text-sm text-slate-500">Setul din care provine grila</p>
                <p className="mt-2 text-sm font-semibold text-sky-950">{activeQuestion.source_name || "-"}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Capitole</p>
                <p className="mt-0.5 text-sm text-slate-500">Temele atinse de intrebare</p>
                <p className="mt-2 text-sm font-semibold text-sky-950">{activeQuestion.chapter_names?.join(", ") || "-"}</p>
              </>
            )}
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dificultate</p>
            <p className="mt-0.5 text-sm text-slate-500">Nivel estimat al grilei</p>
            <p className="mt-2 flex items-center gap-1 text-xl leading-none">
              {activeQuestion.difficulty == null
                ? <span className="text-sm font-semibold text-sky-950">-</span>
                : Array.from({ length: 5 }, (_, index) => (
                    <span
                      key={`difficulty-star-${index}`}
                      className={index < Math.min(Math.max(activeQuestion.difficulty ?? 0, 0), 5) ? "text-yellow-500" : "text-slate-300"}
                      aria-hidden
                    >
                      ★
                    </span>
                  ))}
            </p>
          </article>
          <article className="rounded-xl border border-sky-100 bg-white p-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ultima Rezolvare</p>
            <p className="mt-0.5 text-sm text-slate-500">Ultimul raspuns trimis de tine</p>
            <p className="mt-2 text-sm font-semibold text-sky-950">
              {lastSolvedAt[activeQuestion.id] ? new Date(lastSolvedAt[activeQuestion.id] as string).toLocaleString("ro-RO") : "-"}
            </p>
          </article>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="hidden rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:block">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator de grile</p>
          <div ref={desktopNavContainerRef} className="max-h-[680px] space-y-1 overflow-auto pr-1">
            {displayQuestions.map((question, idx) => (
              <button
                key={question.id}
                ref={(element) => {
                  desktopNavButtonRefs.current[question.id] = element;
                }}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                  idx === activeIndex
                    ? "border-amber-400 bg-gradient-to-r from-amber-200 to-yellow-200 text-slate-900 shadow-sm"
                    : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                }`}
              >
                <span className="font-medium">Grila {questionDisplayNumber(question, idx)}</span>
                <span className="flex items-center gap-3">
                  <span className={`inline-flex w-5 justify-center text-lg font-black ${navStatusClass(question.id)}`} aria-hidden>
                    {navStatusSymbol(question.id)}
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
            ))}
          </div>
        </aside>

        <section className="rounded-[1.7rem] border border-sky-200/80 bg-white/95 p-4 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] sm:p-5">
          <div className="mb-3 grid grid-cols-6 gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => setActiveModal("hint")}
              className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-2 py-2 text-center text-sm font-extrabold text-slate-900 transition hover:brightness-95"
              title="Vezi Indicatii"
            >
              💡
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("short_explanation")}
              className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-2 py-2 text-center text-sm font-extrabold text-slate-900 transition hover:brightness-95"
              title="Vezi Explicatie scurta"
            >
              📘
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("full_explanation")}
              className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-2 py-2 text-center text-sm font-extrabold text-slate-900 transition hover:brightness-95"
              title="Vezi Explicatie lunga"
            >
              📗
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("video")}
              className="rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-2 py-2 text-center text-sm font-extrabold text-slate-900 transition hover:brightness-95"
              title="Vezi Video"
            >
              ▶️
            </button>
            <button
              type="button"
              onClick={readOnly ? undefined : markQuestion}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className={`rounded-xl border-2 px-2 py-2 text-center text-sm font-extrabold transition ${
                flaggedList[activeQuestion.id]
                  ? "border-rose-500 bg-gradient-to-r from-rose-200 to-amber-200 text-rose-900 shadow-sm"
                  : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
              }`}
              title="Marcheaza intrebare"
            >
              {flaggedList[activeQuestion.id] ? "❓✅" : "❓"}
            </button>
            <button
              type="button"
              onClick={readOnly ? undefined : toggleMyList}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className={`rounded-xl border-2 px-2 py-2 text-center text-sm font-extrabold transition ${
                myList[activeQuestion.id]
                  ? "border-amber-500 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 shadow-sm"
                  : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
              }`}
              title="Lista mea"
            >
              {myList[activeQuestion.id] ? "⭐✅" : "⭐"}
            </button>
          </div>
          {activeQuestion ? (
            <GrilaAdministrationButton
              questionId={activeQuestion.id}
              onSaved={handleAdminContentSaved}
              className="mb-3 w-full rounded-xl border-2 border-violet-500 bg-gradient-to-r from-violet-200 to-purple-200 px-3 py-2 text-sm font-extrabold text-violet-950 xl:hidden"
            />
          ) : null}

          <div className="mb-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-sky-800">
            Grila #{questionDisplayNumber(activeQuestion, activeIndex)}
          </div>
          {readOnly && activeQuestion.answer ? (
            <p className="mb-3 text-sm font-semibold text-emerald-800">
              Raspuns corect: <span className="font-black">{activeQuestion.answer}</span>
            </p>
          ) : null}
          {activeQuestion.image_url ? (
            <GrilaImage
              src={activeQuestion.image_url}
              alt={`Grila ${questionDisplayNumber(activeQuestion, activeIndex)}`}
              className="xl:max-h-[75vh]"
            />
          ) : (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-8 text-center text-sm font-medium text-slate-500">
              Imagine indisponibila
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {options.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={readOnly ? undefined : () => toggleAnswer(letter)}
                  disabled={readOnly}
                  className={`rounded-xl border-2 px-4 py-2.5 text-base font-extrabold transition ${
                    selectedAnswers.includes(letter)
                      ? "border-yellow-500 bg-gradient-to-r from-yellow-300 to-amber-300 text-slate-900"
                      : "border-sky-200 bg-white text-slate-700 hover:border-yellow-300 hover:bg-yellow-50"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
            {feedback ? (
              <p
                className={`ml-auto text-sm font-bold ${
                  feedback.includes("CORECT") ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={readOnly ? undefined : checkAnswer}
            disabled={readOnly}
            style={readOnly ? { display: "none" } : undefined}
            className="mt-4 w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95 xl:hidden"
          >
            Verifica Raspunsul
          </button>

          <div className="mt-2 grid grid-cols-2 gap-2 xl:hidden">
            <button
              type="button"
              onClick={() => goToQuestion(activeIndex - 1)}
              disabled={!canGoPrev}
              className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Grila anterioara
            </button>
            <button
              type="button"
              onClick={() => goToQuestion(activeIndex + 1)}
              disabled={!canGoNext}
              className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Grila urmatoare
            </button>
          </div>
        </section>

        <aside className="rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:hidden">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Navigator de grile</p>
          <div ref={mobileNavContainerRef} className="max-h-[320px] space-y-1 overflow-auto pr-1">
            {displayQuestions.map((question, idx) => (
              <button
                key={`mobile-${question.id}`}
                ref={(element) => {
                  mobileNavButtonRefs.current[question.id] = element;
                }}
                type="button"
                onClick={() => goToQuestion(idx)}
                className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                  idx === activeIndex
                    ? "border-amber-400 bg-gradient-to-r from-amber-200 to-yellow-200 text-slate-900 shadow-sm"
                    : "border-transparent text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                }`}
              >
                <span className="font-medium">Grila {questionDisplayNumber(question, idx)}</span>
                <span className="flex items-center gap-3">
                  <span className={`inline-flex w-5 justify-center text-lg font-black ${navStatusClass(question.id)}`} aria-hidden>
                    {navStatusSymbol(question.id)}
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
            ))}
          </div>
        </aside>

        <aside className="hidden rounded-[1.5rem] border border-sky-200/80 bg-white/95 p-3 shadow-[0_16px_42px_-28px_rgba(2,132,199,0.45)] xl:block">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-sky-700">Actiuni</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={readOnly ? undefined : checkAnswer}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-base font-extrabold text-slate-900 transition hover:brightness-95"
            >
              Verifica Raspunsul
            </button>
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
              className="block w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-center text-base font-extrabold text-slate-900 transition hover:brightness-95"
            >
              Vezi explicatia Video
            </button>
            <button
              type="button"
              onClick={() => setCommunityStatsOpen(true)}
              className="block w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2.5 text-center text-base font-extrabold text-slate-900 transition hover:brightness-95"
            >
              Vezi statistici grila
            </button>
            <button
              type="button"
              onClick={readOnly ? undefined : markQuestion}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-base font-extrabold transition ${
                flaggedList[activeQuestion.id]
                  ? "border-rose-500 bg-gradient-to-r from-rose-200 to-amber-200 text-rose-900 shadow-sm"
                  : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
              }`}
            >
              {flaggedList[activeQuestion.id] ? "❓ Demarcheaza" : "❓ Marcheaza intrebare"}
            </button>
            <button
              type="button"
              onClick={readOnly ? undefined : toggleMyList}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-base font-extrabold transition ${
                myList[activeQuestion.id]
                  ? "border-amber-500 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 shadow-sm"
                  : "border-yellow-400 bg-gradient-to-r from-yellow-200 to-amber-200 text-slate-900 hover:brightness-95"
              }`}
            >
              {myList[activeQuestion.id] ? "⭐ Elimina din lista" : "⭐ Adauga in Lista mea"}
            </button>
            <button
              type="button"
              onClick={readOnly ? undefined : () => void openReportModal()}
              disabled={readOnly}
              style={readOnly ? { display: "none" } : undefined}
              className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-base font-semibold text-rose-700 hover:bg-rose-100"
            >
              Raporteaza Greseala
            </button>
            {activeQuestion ? (
              <GrilaAdministrationButton questionId={activeQuestion.id} onSaved={handleAdminContentSaved} />
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goToQuestion(activeIndex - 1)}
                disabled={!canGoPrev}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Grila anterioara
              </button>
              <button
                type="button"
                onClick={() => goToQuestion(activeIndex + 1)}
                disabled={!canGoNext}
                className="w-full rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-300 to-amber-300 px-3 py-2 text-base font-extrabold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Grila urmatoare
              </button>
            </div>
          </div>
        </aside>
      </div>

      {activeModal ? (
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
                <div className="space-y-3">
                  <iframe
                    src={toVimeoEmbedUrl(activeQuestion.video_url) ?? undefined}
                    title={`Video grila ${questionDisplayNumber(activeQuestion, activeIndex)}`}
                    className="aspect-video w-full rounded-xl border border-sky-100"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
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

      {communityStatsOpen ? (
        <GrilaCommunityStatsModal
          open={communityStatsOpen}
          onClose={() => setCommunityStatsOpen(false)}
          questionLabel={String(questionDisplayNumber(activeQuestion, activeIndex))}
          loading={communityStatsLoading}
          error={communityStatsError}
          stats={communityStats}
        />
      ) : null}

      {reportModalOpen ? (
        <ModalPortal>
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-sky-100 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-sky-950">Raporteaza Greseala</h3>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-sky-50"
              >
                Inchide
              </button>
            </div>
            <p className="mb-2 text-sm text-slate-700">
              Te rugam sa detaliezi pentru a putea identifica eroarea la care te referi mai usor!
            </p>
            {reportLoading ? <p className="mb-2 text-sm text-slate-500">Se incarca ultimul raport...</p> : null}
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="h-36 w-full rounded-lg border border-sky-200 p-3 text-sm text-slate-800 outline-none focus:border-sky-400"
              placeholder="Descrie problema cat mai clar..."
              disabled={reportLoading}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Renunta
              </button>
              <button
                type="button"
                onClick={() => void submitIssueReport()}
                disabled={reportSaving}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {reportSaving ? "Se trimite..." : "Trimite raportul"}
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
