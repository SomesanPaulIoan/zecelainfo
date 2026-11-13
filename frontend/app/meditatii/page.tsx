import { MeditatiiSignupForm } from "@/components/meditatii/MeditatiiSignupForm";
import { InstructorBioParagraphs } from "@/components/marketing/InstructorBioParagraphs";
import { StudentTestimonials } from "@/components/meditatii/StudentTestimonials";

function InfoPillCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[1.6rem] border border-sky-200/80 bg-white/95 p-5 text-left shadow-[0_16px_40px_-28px_rgba(2,132,199,0.4)] transition duration-300 hover:-translate-y-0.5 hover:border-amber-200/80 hover:shadow-[0_20px_50px_-30px_rgba(245,158,11,0.35)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-300/25 blur-2xl transition group-hover:bg-amber-300/35" />
      <p className="relative text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700">{label}</p>
      <p className="relative mt-2 text-base font-black text-sky-950">{value}</p>
    </div>
  );
}

export default function MeditatiiPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/95 px-3 py-1 text-xs font-extrabold tracking-wide text-sky-900">
            ÎNSCRIERI · AN ȘCOLAR 2026 – 2027
          </span>
          <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-sky-950 sm:text-5xl">
            Meditații la informatică 2026 – 2027
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-justify text-pretty text-lg font-medium leading-relaxed text-slate-600">
            <strong className="font-semibold text-sky-950">Înscrierile sunt pentru anul școlar 2026 – 2027.</strong> Pe
            această pagină poți să te înscrii la cel mai înalt nivel de pregătire pentru examenele de la finalul clasei a
            XII-a. În cadrul programului de meditații, Paul predă toată materia de liceu încă o dată și te ajută să te
            pregătești prin tehnici moderne, clare și adaptate examenelor de bacalaureat și de admitere.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoPillCard label="Format" value="Grupe restrânse" />
            <InfoPillCard label="Obiectiv" value="Bac + Admitere" />
            <InfoPillCard label="Focus" value="Structură + progres" />
            <InfoPillCard label="Preț" value="150 lei / ședință" />
          </div>
        </section>

        <section className="mx-auto mt-14 grid max-w-[960px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="relative overflow-hidden rounded-[1.8rem] border border-sky-200/80 bg-white/95 p-6 shadow-[0_16px_48px_-28px_rgba(2,132,199,0.45)]">
            <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
            <h2 className="relative text-xl font-black text-sky-950">Cum se desfășoară</h2>
            <ul className="relative mt-4 list-disc space-y-2.5 pl-5 text-justify text-sm leading-relaxed text-slate-700 marker:text-sky-600 sm:text-base">
              <li>Grupe de maximum 5 elevi, formate după un test inițial.</li>
              <li>În septembrie–ianuarie se recapitulează și se aprofundează materia de liceu.</li>
              <li>
                Ulterior se lucrează pe subiecte oficiale: grile pentru admitere la facultate sau subiecte de bacalaureat
                pentru examenul de maturitate.
              </li>
              <li>Temă săptămânală; neclaritățile se discută în ședință.</li>
              <li>Feedback constant și monitorizare continuă a progresului.</li>
              <li>O ședință durează 2 ore, are loc o dată pe săptămână și costă 150 lei.</li>
            </ul>
            <div className="relative mt-6 rounded-xl border-2 border-amber-300/60 bg-gradient-to-br from-amber-50 to-yellow-50/80 p-4 text-sm text-slate-800 shadow-sm">
              <p className="font-extrabold text-sky-950">Contact rapid</p>
              <p className="mt-1 font-medium">WhatsApp: 0744 218 696</p>
              <p className="font-medium">Email: zecelainfo@gmail.com</p>
            </div>
          </article>

          <MeditatiiSignupForm />
        </section>

        <StudentTestimonials />

        <section className="mx-auto mt-12 max-w-[960px]">
          <div className="overflow-hidden rounded-[2rem] border border-sky-200/80 bg-white/90 p-6 shadow-[0_20px_64px_-34px_rgba(2,132,199,0.45)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">Profesorul tău de informatică</p>
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm lg:mx-0 lg:max-w-none">
                <img
                  src="/cursuri-images/autor-paul-ioan-somesan.png?v=3"
                  alt="Paul-Ioan Someșan"
                  className="aspect-[3/4] w-full object-cover object-center"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-sky-950 sm:text-3xl">Paul-Ioan Someșan</h2>
                <p className="mt-1 text-sm font-extrabold text-blue-700 sm:text-base">Fondatorul platformei Zece la Info</p>
                <InstructorBioParagraphs className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
