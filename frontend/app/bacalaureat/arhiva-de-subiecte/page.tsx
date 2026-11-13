import type { Metadata } from "next";
import { BacArchiveClient, type BacArchiveInitialData } from "@/components/bac/BacArchiveClient";
import { apiFetch } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";

/** La build Docker nu rulează API-ul; fără asta HTML-ul static rămâne cu eroare/loading permanent. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Subiecte Bac Informatică cu Barem și Rezolvări Video – Arhivă",
  description:
    "Arhiva de subiecte oficiale și de antrenament pentru Bacalaureat la informatică, organizată pe ani, profil și variantă, cu PDF-uri, barem de corectare și rezolvări video.",
  path: "/bacalaureat/arhiva-de-subiecte",
});

type BacSubjectsResponse = {
  data: {
    subjects: BacArchiveInitialData["subjects"];
    filters: { years: number[]; tips: string[]; profiles: number[] };
  };
};

export default async function BacArhivaPage() {
  let initialData: BacArchiveInitialData | undefined;
  try {
    const response = await apiFetch<BacSubjectsResponse>("/api/bacalaureat/subjects");
    initialData = {
      subjects: response.data.subjects ?? [],
      years: response.data.filters.years ?? [],
      profiles: response.data.filters.profiles ?? [],
    };
  } catch {
    initialData = undefined;
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_85%)]">
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="rounded-[2rem] border border-sky-200/80 bg-white/90 p-8 shadow-[0_24px_70px_-34px_rgba(2,132,199,0.5)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-700">arhiva oficiala</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-sky-950">Arhiva de Subiecte</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          In aceasta sectiune vei avea arhiva completa de subiecte pentru Bacalaureat, organizata pe ani si variante.
        </p>
      </div>
      <BacArchiveClient initialData={initialData} />
      </section>
    </main>
  );
}
