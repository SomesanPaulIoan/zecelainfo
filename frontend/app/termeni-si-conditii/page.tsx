import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  alternates: { canonical: "/termeni-si-conditii" },
};

export default function TermeniSiConditiiPage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Termeni și Condiții de utilizare a www.zecelainfo.ro
          </h1>
          <p className="mt-2 text-sm text-zinc-600">Ultima actualizare: 29.04.2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-800">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">1. Definiții</h2>
              <p>„Platforma” – website-ul www.zecelainfo.ro și subpaginile sale, inclusiv contul de utilizator și funcționalitățile aferente.</p>
              <p>
                „Operatorul” – <strong>Zece la Grile SRL</strong>, societate înregistrată în România, având:
                CUI: 53193948, Nr. înmatriculare: J2025100876005, EUID: ROONRC.J2025100876005.
              </p>
              <p>„Utilizator” – orice persoană care accesează Platforma, cu sau fără Cont.</p>
              <p>„Cont” – profilul creat pe Platformă pentru acces la funcții și/sau servicii.</p>
              <p>„Servicii” – acces la conținut educațional (grile, explicații text/video, indicații, statistici, mod examen, progres).</p>
              <p>„Servicii cu plată” – pachete Premium (pe perioade fixe) și/sau abonamente (dacă sunt afișate ca atare în platformă).</p>
              <p>„Conținut” – materiale educaționale disponibile în Platformă (grile, explicații, elemente grafice, interfață, structuri, texte, video etc.).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">2. Operatorul și contact</h2>
              <p>
                Platforma este deținută și administrată de <strong>Zece la Grile SRL</strong> (CUI: 53193948, Nr.
                înmatriculare: J2025100876005, EUID: ROONRC.J2025100876005).
              </p>
              <p>Pentru solicitări legate de cont, plăți, facturi, acces sau conținut:</p>
              <p>Email: zecelainfo@gmail.com</p>
              <p>Telefon/WhatsApp: +40 744 218 696</p>
              <p>Adresă corespondență: Împăratul Traian 27, Bistrița, 420145, România</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">3. Crearea contului și eligibilitate</h2>
              <p>3.1. Pentru utilizarea completă a funcțiilor Platformei este necesară crearea unui Cont. Unele secțiuni pot fi accesate fără Cont, în regim gratuit.</p>
              <p>3.2. Utilizatorul declară că are cel puțin 16 ani sau acordul părintelui/tutorelui pentru crearea și utilizarea Contului. Pentru plăți, este recomandat ca acestea să fie efectuate de un adult.</p>
              <p>3.3. Utilizatorul este responsabil de corectitudinea datelor furnizate și de actualizarea acestora (în special datele de facturare).</p>
              <p>3.4. Utilizatorul este responsabil pentru păstrarea confidențialității credențialelor (email/parolă) și pentru toate acțiunile realizate în Contul său.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">4. Tipuri de acces și servicii</h2>
              <p>4.1. Acces Gratuit (Free) – acces limitat la conținutul marcat ca gratuit în Platformă, conform informațiilor afișate în paginile dedicate.</p>
              <p>4.2. Acces Premium – acces complet la conținut și funcții Premium (ex.: explicații video, indicații, explicații text, mod examen, grile pe capitole, statistici), pe perioada pachetului activ.</p>
              <p>4.3. Durata, prețul și beneficiile fiecărui pachet sunt cele afișate pe Platformă la momentul achiziției și se aplică pentru perioada activă.</p>
              <p>4.4. Operatorul își rezervă dreptul de a introduce, modifica sau retrage pachete, oferte și promoții, cu efect pentru viitor (nu afectează accesul deja activ pe perioada plătită).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">5. Plăți, procesare, facturare</h2>
              <p>5.1. Plățile pentru Serviciile cu plată sunt procesate prin procesatori de plăți integrați în Platformă (ex.: Stripe / Revolut / alți procesatori afișați la checkout).</p>
              <p>5.2. Prețurile sunt afișate în Platformă și pot fi modificate cu efect pentru viitor. Prețul aplicabil este cel afișat la momentul plasării comenzii.</p>
              <p>5.3. Facturarea se face electronic, pe baza datelor de facturare furnizate de Utilizator în formularul de checkout/cont. Utilizatorul este responsabil să furnizeze date corecte și complete.</p>
              <p>5.4. În cazul nefinalizării plății sau a respingerii acesteia de către procesator, accesul Premium nu se activează.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">6. Rambursări și dreptul de retragere</h2>
              <p>6.1. Serviciile oferite reprezintă conținut/servicii digitale furnizate, de regulă, imediat după confirmarea plății (activarea accesului).</p>
              <p>6.2. Prin finalizarea comenzii și efectuarea plății, Utilizatorul solicită expres începerea furnizării Serviciilor imediat și confirmă că a fost informat că, în măsura aplicabilă, își poate pierde dreptul de retragere pentru conținut digital furnizat imediat.</p>
              <p>6.3. În general, sumele achitate pentru accesul Premium nu sunt rambursabile după activare. Excepții pot fi analizate punctual în situații obiective (ex.: plată dublă evidentă, eroare tehnică majoră confirmată).</p>
              <p>6.4. Pentru solicitări legate de plăți/facturi: Telefon/Whatsapp: 0744 218 696 (Paul-Ioan Somesan) sau zecelainfo@gmail.com.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">7. Licență de utilizare și restricții</h2>
              <p>7.1. Accesul la Conținut este oferit sub forma unei licențe personale, neexclusive, netransferabile, limitată la durata pachetului activ.</p>
              <p>7.2. Este interzisă redistribuirea conținutului (texte, grile, explicații, video), copierea masivă, publicarea, revânzarea, înregistrarea ecranului în scop de redistribuire, precum și automatizarea accesului (scraping, bots).</p>
              <p>7.3. Este interzisă partajarea contului sau oferirea accesului către terți. Operatorul poate limita/suspenda accesul în caz de suspiciuni rezonabile de abuz, fără restituirea sumelor plătite.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">8. Măsuri anti-abuz și securitate</h2>
              <p>8.1. Pentru protejarea conținutului și a conturilor, Platforma poate colecta și corela loguri de securitate (ex.: IP, dispozitiv, browser, sistem de operare, sesiuni), în conformitate cu Politica de Confidențialitate.</p>
              <p>8.2. În caz de activitate anormală (ex.: conectări simultane din locații incompatibile, tentative repetate de acces), Operatorul poate solicita verificări, poate limita temporar accesul sau poate suspenda contul până la clarificare.</p>
              <p>8.3. Utilizatorul se obligă să notifice imediat Operatorul dacă suspectează compromiterea contului.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">9. Disponibilitate, mentenanță, modificări</h2>
              <p>9.1. Operatorul depune eforturi pentru o disponibilitate ridicată, însă Platforma poate fi indisponibilă temporar din motive de mentenanță, actualizări sau evenimente independente (servicii terțe, internet, hosting).</p>
              <p>9.2. Operatorul poate modifica sau îmbunătăți funcții, structură sau conținut (ex.: actualizări la „Mod Examen”, statistici, organizare capitole), fără a diminua accesul deja activ pe perioada achitată.</p>
              <p>9.3. Operatorul poate actualiza acești Termeni; versiunea în vigoare este cea publicată pe această pagină.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">9A. Cerințe tehnice și actualizări</h2>
              <p>9A.1. Platforma este un serviciu digital accesat prin browser (desktop/mobil). Funcționarea poate depinde de conexiunea la internet, setările dispozitivului și compatibilitatea browserului.</p>
              <p>9A.2. Pentru securitate și funcționare, Operatorul poate furniza actualizări. Neaplicarea actualizărilor sau folosirea unor versiuni vechi de browser poate afecta performanța și accesul.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">10. Proprietate intelectuală</h2>
              <p>10.1. Platforma www.zecelainfo.ro, ca ansamblu, reprezintă o operă complexă și este protejată de legislația privind drepturile de autor și drepturile conexe.</p>
              <p>10.2. Operatorul deține drepturi de autor și/sau drepturi patrimoniale asupra structurii și organizării Platformei, selecției și clasificării grilelor, codului sursă, interfeței, designului, explicațiilor originale și funcționalităților.</p>
              <p>10.3. Enunțurile unor grile pot proveni din surse externe publice sau gratuite; drepturile de autor asupra acestor materiale aparțin titularilor respectivi.</p>
              <p>10.4. Includerea acestor grile în Platformă are scop educațional, într-un sistem original de evaluare și învățare.</p>
              <p>10.5. Este interzisă copierea, extragerea sau reutilizarea sistematică a conținutului Platformei fără acordul scris al Operatorului.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">11. Protecția datelor</h2>
              <p>11.1. Prelucrarea datelor personale se face conform Politicii de Confidențialitate și Politicii de Cookies publicate pe Platformă.</p>
              <p>11.2. Pentru solicitări legate de date (acces, rectificare, ștergere, opoziție) ne poți scrie la: zecelainfo@gmail.com.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">12. Răspundere</h2>
              <p>12.1. Platforma are caracter educațional. Operatorul nu garantează obținerea unei anumite note sau promovarea examenelor; rezultatele depind de nivelul și efortul Utilizatorului.</p>
              <p>12.2. În limitele permise de lege, răspunderea Operatorului este limitată la sumele efectiv plătite de Utilizator pentru perioada curentă de acces, dacă se dovedește o culpă directă a Operatorului.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">13. Legea aplicabilă și soluționarea disputelor</h2>
              <p>13.1. Prezentul acord este guvernat de legea română, în măsura în care normele imperative aplicabile nu prevăd altfel.</p>
              <p>13.2. Orice dispută va fi încercată mai întâi pe cale amiabilă, prin dialog și comunicare directă (email/telefon).</p>
              <p>13.3. Dacă nu este posibilă soluționarea amiabilă, consumatorii pot apela la: A.N.P.C., A.N.P.C. – SAL, ODR.</p>
              <p>13.4. În lipsa unei soluții, competența revine instanțelor competente din România.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">14. Suport</h2>
              <p>Pentru întrebări despre cont, plăți, facturi sau conținut: zecelainfo@gmail.com sau telefon/WhatsApp: +40 744 218 696.</p>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
