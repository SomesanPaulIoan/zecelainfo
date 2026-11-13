"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

type Attempt = {
  status: "in_progress" | "finished";
  grade: string | null;
  correct_count: number | null;
};

type EligibilityResponse = {
  data: { eligible: boolean; attempt: Attempt | null; questionsConfigured: boolean };
};

export function PlacementTestCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [eligible, setEligible] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questionsConfigured, setQuestionsConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void apiFetch<EligibilityResponse>("/api/placement-test/eligibility")
      .then((response) => {
        if (cancelled) return;
        setEligible(response.data.eligible);
        setAttempt(response.data.attempt);
        setQuestionsConfigured(response.data.questionsConfigured);
      })
      .catch(() => {
        if (cancelled) return;
        setEligible(false);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!loaded || !eligible) return null;

  const startOrResume = async () => {
    setStarting(true);
    try {
      if (!attempt) {
        await apiFetch("/api/placement-test/start", { method: "POST", body: JSON.stringify({}) });
      }
      router.push("/test-initial");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-100 to-amber-100 p-4">
      <h3 className="text-lg font-bold text-slate-900">Test initial de plasament</h3>
      <p className="mt-2 text-sm text-slate-700">
        Inainte de a forma grupele de meditatii, fiecare elev inscris da un test initial: 20 de grile cu o
        singura varianta corecta (A-F, vizibile direct pe imagine), cronometrat la 2 ore. Testul se poate
        da o singura data, iar nota rezultata este folosita pentru a forma grupele. Daca iesi din pagina in
        timpul testului, poti reveni si continua exact de unde ai ramas ca timp.
      </p>

      {!attempt && !questionsConfigured ? (
        <>
          <button
            type="button"
            disabled
            className="mt-4 cursor-not-allowed rounded-xl border-2 border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-extrabold text-zinc-500"
          >
            Incepe testul initial
          </button>
          <p className="mt-2 text-xs text-zinc-500">Testul nu este inca disponibil. Revino mai tarziu.</p>
        </>
      ) : !attempt ? (
        <button
          type="button"
          onClick={() => void startOrResume()}
          disabled={starting}
          className="mt-4 rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 px-4 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-60"
        >
          {starting ? "Se pregateste..." : "Incepe testul initial"}
        </button>
      ) : attempt.status === "in_progress" ? (
        <button
          type="button"
          onClick={() => void startOrResume()}
          disabled={starting}
          className="mt-4 rounded-xl border-2 border-amber-500 bg-gradient-to-r from-amber-300 to-yellow-300 px-4 py-2 text-sm font-extrabold text-slate-900 disabled:opacity-60"
        >
          Continua testul initial
        </button>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold text-emerald-800">
            Ai sustinut testul initial. Nota ta: {attempt.grade !== null ? Number(attempt.grade).toFixed(2) : "-"} / 10
            {attempt.correct_count !== null ? ` (${attempt.correct_count}/20 corecte)` : ""}.
          </p>
          <button
            type="button"
            onClick={() => router.push("/test-initial")}
            className="mt-3 rounded-xl border-2 border-sky-400 bg-sky-100 px-4 py-2 text-sm font-extrabold text-sky-900 hover:bg-sky-200"
          >
            Vezi desfasuratorul
          </button>
        </>
      )}
    </div>
  );
}
