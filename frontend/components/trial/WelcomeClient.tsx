"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEMO_EXAMS, examInfo, getPreferredExam, isExamKey, setPreferredExam, type ExamKey } from "@/lib/attribution";
import { apiFetch } from "@/lib/api";
import { fetchJourney, hoursLeft, type Journey } from "@/lib/journey";

const COURSE_BY_PACHET: Record<string, string> = {
  "admitere-ubb": "curs-admitere-ubb",
  "admitere-ub-unstpb": "curs-admitere-ub-unstpb",
  "admitere-uaic-tuiasi": "curs-admitere-uaic-tuiasi",
  bacalaureat: "curs-bacalaureat-informatica-mi",
};

function Suggestions({ exam }: { exam: ExamKey }) {
  const info = examInfo(exam);
  const steps = [
    {
      title: `Rezolvă grile ${info.short}`,
      text: "Alege un subiect din anii trecuți și cere indicația când te blochezi.",
      href: `/grile/${info.grile}`,
      cta: "Deschide grilele",
    },
    {
      title: "Urmărește o explicație video",
      text: "La grilele cu video, apasă „Vezi explicația video” după ce răspunzi.",
      href: `/grile/${info.grile}`,
      cta: "Alege o grilă",
    },
    {
      title: exam === "bac" ? "Rezolvă un subiect întreg" : "Încearcă o simulare pe timp",
      text:
        exam === "bac"
          ? "Grilele din subiectele oficiale de Bac, una după alta, ca la examen."
          : "Modul Examen: un subiect întreg, cu cronometru și notă la final.",
      href: `/grile/${info.grile}`,
      cta: exam === "bac" ? "Vezi subiectele" : "Pornește o simulare",
    },
    {
      title: "Urmărește o lecție din curs",
      text: "Toate cursurile video sunt deschise în aceste 24 de ore.",
      href: `/cursuri/${COURSE_BY_PACHET[info.pachet]}`,
      cta: "Deschide cursul",
    },
  ];
  return (
    <ol className="mt-6 grid gap-3 sm:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step.title} className="flex flex-col rounded-2xl border border-sky-200/80 bg-white/95 p-4 shadow-sm">
          <span className="text-xs font-extrabold uppercase tracking-wide text-sky-700">Pasul {index + 1}</span>
          <h2 className="mt-1 text-base font-black text-sky-950">{step.title}</h2>
          <p className="mt-1 flex-1 text-sm text-slate-600">{step.text}</p>
          <Link
            href={step.href}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-bold text-white hover:bg-sky-600"
          >
            {step.cta}
          </Link>
        </li>
      ))}
    </ol>
  );
}

function WelcomeInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const param = searchParams.get("exam");
  const [exam, setExam] = useState<ExamKey | null>(isExamKey(param) ? param : null);

  useEffect(() => {
    if (!user) return;
    void fetchJourney(user.id, { fresh: true }).then((data) => {
      setJourney(data);
      if (!exam) {
        const fromServer = isExamKey(data?.exam) ? (data!.exam as ExamKey) : null;
        setExam(fromServer ?? getPreferredExam());
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const chooseExam = (key: ExamKey) => {
    setExam(key);
    setPreferredExam(key);
    void apiFetch("/api/marketing/me/exam", { method: "PUT", body: JSON.stringify({ exam: key }) }).catch(() => undefined);
  };

  const hours = hoursLeft(journey?.access_until ?? null);
  const onTrial = journey?.state === "trial";

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="rounded-[1.8rem] border border-emerald-200 bg-white/95 p-6 shadow-[0_18px_50px_-30px_rgba(2,132,199,0.45)] sm:p-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">Acces gratuit activ</p>
        <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">Bine ai venit!</h1>
        <p className="mt-3 text-pretty text-base text-slate-700">
          {exam
            ? `Ai 24 de ore să explorezi platforma. Începe cu grilele ${examInfo(exam).short}, încearcă o simulare și urmărește o lecție din curs.`
            : "Ai 24 de ore să explorezi toate grilele și toate cursurile video."}
        </p>
        {onTrial && hours != null ? (
          <p className="mt-2 text-sm text-slate-500">
            Accesul gratuit mai durează cca {hours} {hours === 1 ? "oră" : "ore"}. După aceea se oprește singur, fără nicio plată;
            progresul rămâne salvat.
          </p>
        ) : null}
      </div>

      {exam ? (
        <Suggestions exam={exam} />
      ) : (
        <div className="mt-6 rounded-2xl border border-sky-200/80 bg-white/95 p-5">
          <h2 className="text-base font-black text-sky-950">Pentru ce examen te pregătești?</h2>
          <div className="mt-3 grid gap-2">
            {DEMO_EXAMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseExam(item.key)}
                className="min-h-12 rounded-xl border-2 border-sky-200 bg-white px-4 text-left font-bold text-sky-950 hover:border-amber-300 hover:bg-amber-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {exam ? (
        <p className="mt-6 text-center text-sm text-slate-600">
          Te pregătești pentru alt examen?{" "}
          <button type="button" onClick={() => setExam(null)} className="font-bold text-sky-800 underline underline-offset-4">
            Schimbă examenul
          </button>
        </p>
      ) : null}
    </section>
  );
}

export function WelcomeClient() {
  return (
    <RequireAuth>
      <WelcomeInner />
    </RequireAuth>
  );
}
