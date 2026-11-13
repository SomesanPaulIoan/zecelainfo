import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PACHETE, pachetPath } from "@/lib/pachete";

export const metadata: Metadata = {
  title: "Pagina nu a fost găsită",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="bg-[radial-gradient(circle_at_top_right,_var(--glow-amber),_var(--glow-blue)_38%,_var(--glow-blue-deep)_88%)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sky-700">Eroare 404</p>
        <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-sky-950 sm:text-5xl">
          Pagina pe care o cauți nu există.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-slate-600">
          Poate a fost mutată sau linkul are o greșeală. Uite câteva locuri bune de unde poți continua:
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/grile" size="lg">
            Rezolvă grile
          </ButtonLink>
          <ButtonLink href="/cursuri" variant="secondary" size="lg">
            Vezi cursurile
          </ButtonLink>
          <ButtonLink href="/" variant="ghost" size="lg">
            Pagina principală
          </ButtonLink>
        </div>
        <nav aria-label="Pagini populare" className="mx-auto mt-12 max-w-xl rounded-[1.6rem] border border-sky-200/80 bg-white/90 p-6 text-left">
          <h2 className="text-base font-black text-sky-950">Pagini populare</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {PACHETE.map((pachet) => (
              <li key={pachet.slug}>
                <Link href={pachetPath(pachet.slug)} className="font-semibold text-sky-800 hover:underline">
                  Pachete {pachet.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/bacalaureat" className="font-semibold text-sky-800 hover:underline">
                Bacalaureat Informatică
              </Link>
            </li>
            <li>
              <Link href="/bacalaureat/arhiva-de-subiecte" className="font-semibold text-sky-800 hover:underline">
                Arhiva de subiecte Bac
              </Link>
            </li>
            <li>
              <Link href="/problems" className="font-semibold text-sky-800 hover:underline">
                Probleme de informatică
              </Link>
            </li>
            <li>
              <Link href="/meditatii" className="font-semibold text-sky-800 hover:underline">
                Meditații
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  );
}
