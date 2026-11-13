import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de cookies",
  alternates: { canonical: "/politica-de-cookies" },
};

export default function PoliticaCookiesPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Politica de Cookies</h1>
          <p className="mt-2 text-sm text-zinc-600">Ultima actualizare: 13.10.2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-800">
            <section>
              <p>
                Această Politică explică modul în care www.zecelainfo.ro (“Platforma”) utilizează cookie-uri și
                tehnologii similare, ce tipuri folosim, de ce le folosim și cum poți controla preferințele tale.
              </p>
              <p>
                Platforma este deținută și administrată de <strong>Zece la Grile SRL</strong>, România.
              </p>
              <p>CUI: 53193948</p>
              <p>Nr. înmatriculare: J2025100876005</p>
              <p>EUID: ROONRC.J2025100876005</p>
              <p>Contact: zecelainfo@gmail.com</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">1. Ce sunt cookie-urile</h2>
              <p>
                Cookie-urile sunt fișiere mici de text stocate pe dispozitivul tău (computer, telefon, tabletă) atunci
                când vizitezi un site. Ele ajută site-ul să funcționeze corect (de exemplu autentificare), să rețină
                preferințe și, uneori, să colecteze informații despre modul în care este folosit site-ul.
              </p>
              <p>
                Pe lângă cookie-uri, putem utiliza și tehnologii similare (de ex. localStorage/sessionStorage sau
                identificatori tehnici) cu roluri apropiate. În această Politică le vom include generic sub termenul
                “cookie-uri”, acolo unde este cazul.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">2. De ce folosim cookie-uri</h2>
              <p>
                Folosim cookie-uri pentru: funcționare esențială, preferințe, performanță & analiză și marketing (doar
                dacă există servicii active și consimțământ, unde se aplică).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">3. Tipuri de cookie-uri pe care le putem folosi</h2>
              <p>
                3.1. După durată: cookie-uri de sesiune și cookie-uri persistente.
              </p>
              <p>
                3.2. După proveniență: cookie-uri first-party (de pe zecelainfo.ro) și third-party (servicii terțe).
              </p>
              <p>
                3.3. După scop:
              </p>
              <p>
                A) Cookie-uri esențiale (strict necesare) – necesare pentru funcționare (login, sesiune, securitate,
                CSRF), nu pot fi dezactivate din sistemele noastre.
              </p>
              <p>
                B) Cookie-uri de preferințe – rețin setări de afișare, unde este cazul.
              </p>
              <p>
                C) Cookie-uri analitice/de performanță – pentru optimizare și stabilitate, de regulă agregat; doar dacă
                sunt implementate și, unde e necesar, cu consimțământ.
              </p>
              <p>
                D) Cookie-uri de marketing/publicitate – doar dacă sunt implementate și cu consimțământ.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">4. Ce cookie-uri folosim efectiv</h2>
              <p>
                Cookie-urile și datele salvate local în browser, grupate pe categorii. Cele de statistică și de marketing se
                activează doar după ce îți exprimi acordul în banner-ul de cookie-uri și pot fi oprite oricând din linkul
                „Setări cookies” din subsolul paginii.
              </p>
              <div className="overflow-x-auto">
                <table className="mt-2 w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-600">
                      <th className="py-2 pr-3">Nume</th>
                      <th className="py-2 pr-3">Categorie</th>
                      <th className="py-2 pr-3">Furnizor</th>
                      <th className="py-2 pr-3">Scop</th>
                      <th className="py-2">Durată</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr><td className="py-2 pr-3">zecelainfo_token</td><td className="pr-3">Esențial</td><td className="pr-3">Zece la Info</td><td className="pr-3">Menține autentificarea (stocare locală)</td><td>până la delogare</td></tr>
                    <tr><td className="py-2 pr-3">zli_consent</td><td className="pr-3">Esențial</td><td className="pr-3">Zece la Info</td><td className="pr-3">Reține alegerea ta privind cookie-urile</td><td>până la ștergere</td></tr>
                    <tr><td className="py-2 pr-3">zli_exam, tema, zli_demo_session</td><td className="pr-3">Preferințe / funcțional</td><td className="pr-3">Zece la Info</td><td className="pr-3">Examenul ales, tema de culoare, continuarea testului gratuit în aceeași filă</td><td>până la ștergere / închiderea filei</td></tr>
                    <tr><td className="py-2 pr-3">zli_attr</td><td className="pr-3">Statistică</td><td className="pr-3">Zece la Info</td><td className="pr-3">Sursa vizitei (parametri utm, pagina de intrare), pentru a ști ce campanii aduc conturi și comenzi, la nivel agregat</td><td>până la ștergere</td></tr>
                    <tr><td className="py-2 pr-3">_ga, _ga_*</td><td className="pr-3">Statistică</td><td className="pr-3">Google Analytics 4</td><td className="pr-3">Statistici de utilizare; fără semnale de publicitate Google</td><td>până la 2 ani</td></tr>
                    <tr><td className="py-2 pr-3">_ttp, ttclid</td><td className="pr-3">Marketing</td><td className="pr-3">TikTok Pixel</td><td className="pr-3">Măsurarea reclamelor TikTok (ex. dacă o vizită din reclamă a dus la un cont sau o comandă). Nu transmitem email, telefon, nume sau rezultatele la grile.</td><td>până la 13 luni</td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Fără cookie-uri, contorizăm agregat afișările unor pagini (ex. câte vizite a avut o pagină într-o zi și din ce
                campanie), fără identificatori și fără a salva adresa IP.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">5. Consimțământ și banner de cookie-uri</h2>
              <p>
                Unde este necesar legal, cookie-urile neesențiale (analitice/marketing) sunt folosite doar după acordul
                tău exprimat prin banner/setări.
              </p>
              <p>
                Cookie-urile esențiale sunt folosite indiferent de consimțământ, deoarece sunt necesare funcționării
                platformei.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">6. Cum poți controla cookie-urile</h2>
              <p>
                6.1. Setările browserului – poți vedea, șterge sau bloca cookie-uri (inclusiv third-party).
              </p>
              <p>
                6.2. Ștergerea cookie-urilor – poate necesita autentificare din nou și resetarea preferințelor.
              </p>
              <p>
                6.3. Limitări – blocarea cookie-urilor esențiale poate afecta funcționalități precum login-ul și menținerea
                sesiunii.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">7. Date colectate prin cookie-uri și GDPR</h2>
              <p>
                Unele cookie-uri pot colecta date care, direct sau indirect, pot deveni date cu caracter personal (ex.:
                identificatori online, IP, informații despre dispozitiv).
              </p>
              <p>
                Prelucrarea se face conform Politicii de Confidențialitate și GDPR, pe temeiuri precum interes legitim,
                executarea contractului, obligație legală sau consimțământ (unde este cazul).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">8. Cookie-uri terțe (third-party)</h2>
              <p>
                Platforma poate integra servicii terțe (ex.: procesatori de plăți, instrumente de analiză) care pot seta
                propriile cookie-uri conform politicilor lor.
              </p>
              <p>
                Folosim furnizori de încredere și limităm cookie-urile terțe la strictul necesar. Cookie-urile
                neesențiale sunt activate doar cu consimțământ, unde legea o cere.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">9. Modificări ale Politicii de Cookies</h2>
              <p>
                Putem actualiza această Politică atunci când schimbăm funcționalități, furnizori integrați sau când apar
                modificări legislative.
              </p>
              <p>Versiunea curentă este publicată pe această pagină, împreună cu data ultimei actualizări.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">10. Contact</h2>
              <p>Pentru întrebări despre cookie-uri și confidențialitate:</p>
              <p>Email: zecelainfo@gmail.com</p>
              <p>Telefon/WhatsApp: +40 744 218 696</p>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
