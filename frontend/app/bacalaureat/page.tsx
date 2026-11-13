import type { Metadata } from "next";
import Link from "next/link";
import { Archive, BookOpen, ListChecks, PenLine } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { apiFetch } from "@/lib/api";
import { TARGET_EXAM_YEAR, grileExamPath } from "@/lib/exams";
import { courseStats, getCourse, getGrileCategorySummary } from "@/lib/grile-data";
import { formatRoNumber, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Bacalaureat Informatică ${TARGET_EXAM_YEAR} – Subiecte, Grile, Simulări și Curs`,
  description:
    "Pregătire pentru Bacalaureat la Informatică: arhiva de subiecte cu barem, rezolvare cronometrată cu corectare și feedback, grile din subiectele oficiale și curs video complet.",
  path: "/bacalaureat",
});

type BacSubject = { id: string; year: number; tip: string; video_url: string | null };

async function getBacSubjects(): Promise<BacSubject[] | null> {
  try {
    const response = await apiFetch<{ data: { subjects: BacSubject[] } }>("/api/bacalaureat/subjects");
    return response.data.subjects ?? [];
  } catch {
    return null;
  }
}

export default async function BacalaureatPage() {
  const [subjects, grileSummary, course] = await Promise.all([
    getBacSubjects(),
    getGrileCategorySummary("bacalaureat"),
    getCourse("curs-bacalaureat-informatica-mi"),
  ]);
  const subjectsCount = subjects?.length ?? 0;
  const subjectsWithVideo = subjects?.filter((subject) => Boolean(subject.video_url)).length ?? 0;
  const years = subjects ? subjects.map((subject) => subject.year).filter(Boolean) : [];
  const yearRange = years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : null;
  const stats = course ? courseStats(course) : null;

  const cards = [
    {
      icon: Archive,
      title: "Arhiva de subiecte",
      text:
        subjectsCount > 0
          ? `${subjectsCount} subiecte${yearRange ? ` din ${yearRange}` : ""}, oficiale și de antrenament, cu PDF și barem${subjectsWithVideo > 0 ? `; ${subjectsWithVideo} au rezolvare video` : ""}.`
          : "Subiecte oficiale și de antrenament, cu PDF și barem.",
      href: "/bacalaureat/arhiva-de-subiecte",
      cta: "Deschide arhiva",
    },
    {
      icon: PenLine,
      title: "Simulare cu corectare",
      text: "Rezolvi subiectul pe timp (3 ore), încarci PDF-ul cu rezolvarea și primești punctaj detaliat și feedback de la Paul.",
      href: "/bacalaureat/rezolva-subiecte",
      cta: "Rezolvă un subiect",
    },
    {
      icon: ListChecks,
      title: "Grile de Bac",
      text: grileSummary
        ? `${formatRoNumber(grileSummary.total_questions)} de itemi tip grilă din subiectele de Bac, ${formatRoNumber(grileSummary.total_with_video)} cu explicație video.`
        : "Itemii tip grilă din subiectele de Bac, cu explicații și video.",
      href: grileExamPath("bacalaureat"),
      cta: "Rezolvă grile Bac",
    },
    {
      icon: BookOpen,
      title: "Curs video de Bac",
      text: stats
        ? `${stats.partsCount} părți, ${stats.videosCount} lecții video${stats.hours > 0 ? ` (peste ${stats.hours} de ore)` : ""}: toată materia și subiecte oficiale rezolvate integral.`
        : "Toată materia explicată și subiecte oficiale rezolvate integral.",
      href: "/cursuri/curs-bacalaureat-informatica-mi",
      cta: "Vezi cursul",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: "Acasă", path: "/" },
            { name: "Bacalaureat", path: "/bacalaureat" },
          ]}
        />
        <div className="mt-6 rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)] sm:p-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">zona bacalaureat · profil Mate-Info</p>
          <h1 className="mt-3 text-balance text-3xl font-black tracking-tight text-sky-950 sm:text-4xl">
            Bacalaureat la Informatică {TARGET_EXAM_YEAR}
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-slate-700">
            Tot ce îți trebuie pentru proba de informatică într-un singur loc: subiectele din anii trecuți cu barem,
            simulări cronometrate corectate de Paul, grile din itemii oficiali și cursul video complet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/bacalaureat/rezolva-subiecte" size="lg">
              Rezolvă subiecte
            </ButtonLink>
            <ButtonLink href="/bacalaureat/arhiva-de-subiecte" variant="secondary" size="lg">
              Arhiva de subiecte
            </ButtonLink>
          </div>
        </div>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Resurse pentru Bacalaureat">
          {cards.map((card) => (
            <article key={card.title} className="flex flex-col rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-6 shadow-sm">
              <card.icon aria-hidden="true" className="h-6 w-6 text-amber-500" />
              <h2 className="mt-3 text-lg font-black text-sky-950">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{card.text}</p>
              <Link href={card.href} className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline">
                {card.cta} →
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[1.6rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6">
          <h2 className="text-lg font-black text-sky-950">Dai și admitere la Informatică?</h2>
          <p className="mt-1 text-sm text-slate-700">
            Materia de Bac se suprapune în mare parte cu cea de la admitere. Vezi ce trebuie să știi pentru facultatea ta.
          </p>
          <Link href="/pachete" className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline">
            Pachete pentru admiterea la Informatică →
          </Link>
        </section>
      </div>
    </main>
  );
}
