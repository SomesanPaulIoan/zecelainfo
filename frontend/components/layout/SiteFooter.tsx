import Link from "next/link";
import Image from "next/image";
import { PACHETE, pachetPath } from "@/lib/pachete";
import { ConsentSettingsButton } from "@/components/analytics/ConsentSettingsButton";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-sky-100 bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(250,204,21,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_90%_30%,rgba(14,165,233,0.22),transparent_50%)]" />
      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 2xl:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          <section>
            <Link href="/" className="mb-3 inline-flex rounded-xl border border-yellow-300/35 bg-white/10 p-2 ring-1 ring-sky-300/25">
              <Image
                src="/assets/zece-la-info-footer-logo-v2.png"
                alt="Zece la Info"
                width={220}
                height={220}
                className="h-52 w-auto rounded-lg"
              />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-slate-200">
              Zece la Info este platforma completă de informatică pentru elevii de liceu: grile, cursuri video, subiecte de
              Bacalaureat, probleme și multe alte materiale pentru Bac și admitere.
            </p>
          </section>

          <section>
            <p className="text-base font-semibold text-white">Legături utile</p>
            <nav aria-label="Legături utile" className="mt-4 flex flex-col gap-2 text-sm text-slate-200">
              <Link href="/" className="hover:text-yellow-200">
                Acasă
              </Link>
              <Link href="/cursuri" className="hover:text-yellow-200">
                Cursuri
              </Link>
              <Link href="/problems" className="hover:text-yellow-200">
                Probleme
              </Link>
              <Link href="/grile" className="hover:text-yellow-200">
                Grile
              </Link>
              <Link href="/bacalaureat" className="hover:text-yellow-200">
                Bacalaureat
              </Link>
              <Link href="/meditatii" className="hover:text-yellow-200">
                Meditații
              </Link>
              <Link href="/pachete" className="hover:text-yellow-200">
                Pachete
              </Link>
              {PACHETE.map((pachet) => (
                <Link key={pachet.slug} href={pachetPath(pachet.slug)} className="hover:text-yellow-200">
                  Pachete {pachet.label}
                </Link>
              ))}
              <Link href="/grile/admitere-ubb" className="hover:text-yellow-200">
                Grile Informatică UBB
              </Link>
              <Link href="/grile/admitere-unstpb" className="hover:text-yellow-200">
                Grile Informatică UNSTPB
              </Link>
              <Link href="/grile/admitere-ub" className="hover:text-yellow-200">
                Grile Informatica UB
              </Link>
              <Link href="/grile/admitere-tu-iasi" className="hover:text-yellow-200">
                Grile Informatică TU Iași
              </Link>
              <Link href="/grile/bacalaureat" className="hover:text-yellow-200">
                Grile Bacalaureat
              </Link>
            </nav>
          </section>

          <section>
            <p className="text-base font-semibold text-white">Compania noastră</p>
            <div className="mt-4 space-y-1 text-sm text-slate-200">
              <p>Firmă: Zece la Grile SRL</p>
              <p>CUI: 53193948</p>
              <p>Nr. Reg. Com.: J2025100876005</p>
              <p>EUID: ROONRC.J2025100876005</p>
              <p>Adresă: Împăratul Traian 27, Bistrița, 420145, România</p>
              <p>Email: zecelainfo@gmail.com</p>
              <p>WhatsApp: +40 744 218 696</p>
            </div>
          </section>

          <section>
            <p className="text-base font-semibold text-white">Urmărește-ne & Legal</p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p>
                Pentru orice neînțelegere apărută, ne dorim să găsim mai întâi o soluție pe cale amiabilă, prin dialog
                și comunicare directă.
              </p>
              <p>Contact WhatsApp: 0744 218 696 (Paul-Ioan Someșan)</p>
              <p>Dacă nu este posibil, consumatorii pot apela la:</p>
              <ul className="space-y-1">
                <li>A.N.P.C.</li>
                <li>A.N.P.C. – SAL</li>
                <li>ODR</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-8 border-t border-white/15 pt-4 text-xs text-slate-300">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Zece la Grile SRL. Toate drepturile rezervate.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/termeni-si-conditii" className="hover:text-yellow-200 hover:underline">
                Termeni și condiții
              </Link>
              <span className="opacity-50">|</span>
              <Link href="/politica-de-confidentialitate" className="hover:text-yellow-200 hover:underline">
                Politica de Confidențialitate
              </Link>
              <span className="opacity-50">|</span>
              <Link href="/politica-de-cookies" className="hover:text-yellow-200 hover:underline">
                Politica de Cookies
              </Link>
              <span className="opacity-50">|</span>
              <ConsentSettingsButton className="hover:text-yellow-200 hover:underline" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
