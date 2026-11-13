import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  alternates: { canonical: "/politica-de-confidentialitate" },
};

export default function PoliticaConfidentialitatePage() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Politica de Confidențialitate (GDPR)</h1>
          <p className="mt-2 text-sm text-zinc-600">Ultima actualizare: 29.04.2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-800">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900">1. Cine suntem</h2>
              <p>
                Platforma www.zecelainfo.ro (“Platforma”) este deținută și administrată de: <strong>Zece la Grile SRL</strong>,
                societate înregistrată în România.
              </p>
              <p>CUI: 53193948</p>
              <p>Nr. înmatriculare: J2025100876005</p>
              <p>EUID: ROONRC.J2025100876005</p>
              <p>Adresă (corespondență): Împăratul Traian 27, Bistrița, 420145, România</p>
              <p>Email: zecelainfo@gmail.com</p>
              <p>Telefon/WhatsApp: +40 744 218 696</p>
              <p>
                În această Politică explicăm ce date colectăm, de ce le colectăm, cum le folosim și ce drepturi ai.
                Prelucrăm datele în conformitate cu Regulamentul (UE) 2016/679 (“GDPR”) și legislația națională aplicabilă.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">2. Ce date colectăm</h2>
              <p>2.1. Date de cont – nume (dacă este furnizat), email, parolă (stocată sub formă de hash), ID intern utilizator, preferințe.</p>
              <p>2.2. Date de utilizare în Platformă – grile rezolvate, răspunsuri, progres, statistici personale, timp de utilizare, interacțiuni cu funcțiile platformei (ex.: Mod Examen).</p>
              <p>2.3. Date de facturare – nume/firmă, CUI (dacă e cazul), adresă, țară, email, telefon (dacă e furnizat), alte câmpuri completate pentru emiterea facturii.</p>
              <p>2.4. Date despre plăți și tranzacții – produs/pachet achiziționat, sumă, monedă, status (plătit/eșuat/rambursat), identificatori de tranzacție/ordine din procesatorul de plăți. Nu stocăm date complete de card; acestea sunt procesate direct de procesatorii de plăți.</p>
              <p>2.5. Date tehnice & securitate – adresa IP, user-agent (browser/OS/dispozitiv), timestamp-uri, loguri de autentificare, evenimente de securitate (ex.: conexiuni simultane/anomalii).</p>
              <p>2.6. Cookie-uri & tehnologii similare – cookie-uri esențiale (sesiune/autentificare), cookie-uri de preferințe și, dacă îți dai acordul, cookie-uri analitice/marketing (detalii la secțiunea 10).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">3. De ce folosim datele (scopuri)</h2>
              <p>3.1. Furnizarea serviciilor – creare cont, autentificare, acces la conținut, afișare progres și statistici, funcționalități precum “Mod Examen”.</p>
              <p>3.2. Administrare abonamente/pachete – activare acces, verificare status, expirare, suport pentru utilizatori.</p>
              <p>3.3. Plăți & facturare – procesarea plăților, emiterea și transmiterea facturilor, evidențe financiar-contabile.</p>
              <p>3.4. Securitate & prevenirea abuzurilor – protecția conturilor și a conținutului, detectarea accesului fraudulos, prevenirea partajării contului (anti-sharing), protecție împotriva atacurilor.</p>
              <p>3.5. Suport & comunicări operaționale – răspuns la solicitări, notificări despre cont, plăți, probleme tehnice, modificări esențiale.</p>
              <p>3.6. Îmbunătățirea Platformei – analize agregate (ne-identificabile direct) pentru optimizare, performanță, experiență de utilizare.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">4. Temeiuri legale (GDPR)</h2>
              <p>4.1. Executarea contractului (art. 6(1)(b) GDPR) – pentru a-ți furniza accesul la Platformă și funcțiile acesteia.</p>
              <p>4.2. Obligație legală (art. 6(1)(c) GDPR) – în special obligații fiscal-contabile (facturi, evidențe, arhivare).</p>
              <p>4.3. Interes legitim (art. 6(1)(f) GDPR) – securitate, prevenirea fraudelor/abuzurilor, apărarea drepturilor în caz de litigiu, îmbunătățiri tehnice.</p>
              <p>4.4. Consimțământ (art. 6(1)(a) GDPR) – acolo unde este necesar (ex.: cookie-uri neesențiale, comunicări de marketing). Îl poți retrage oricând.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">5. Cui putem divulga datele</h2>
              <p>Nu vindem și nu închiriem datele tale.</p>
              <p>5.1. Procesatori de plăți – pentru procesarea plăților și gestionarea tranzacțiilor (în funcție de integrarea activă pe site).</p>
              <p>5.2. Furnizori IT/hosting – găzduire, email tranzacțional, monitorizare, back-up, securitate (în baza unor contracte și obligații de confidențialitate).</p>
              <p>5.3. Autorități publice – doar dacă legea ne obligă (ex.: ANAF, instanțe), strict în limitele cerințelor legale.</p>
              <p>5.4. Consultanți/profesioniști (ex.: contabil, avocat) – doar dacă este necesar pentru obligații legale sau apărarea drepturilor noastre.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">6. Transferuri internaționale</h2>
              <p>
                În mod normal, ne propunem să utilizăm furnizori în UE/SEE. Dacă totuși anumite servicii implică transferuri în afara UE/SEE,
                transferul se face doar cu garanții legale adecvate (ex.: clauze contractuale standard) și măsuri de securitate rezonabile.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">7. Cât timp păstrăm datele</h2>
              <p>7.1. Date cont – cât timp contul este activ; la ștergere putem păstra minimul necesar pentru obligații legale și apărarea drepturilor.</p>
              <p>7.2. Date de facturare & documente – conform legislației fiscal-contabile aplicabile (de regulă 5–10 ani).</p>
              <p>7.3. Loguri tehnice & securitate – în general între 6 și 24 luni (în funcție de necesitatea de securitate și investigare).</p>
              <p>La expirarea termenelor, datele se șterg sau se anonimizează în siguranță.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">8. Drepturile tale</h2>
              <p>Ai următoarele drepturi, în condițiile GDPR: acces, rectificare, ștergere, restricționare, portabilitate, opoziție, retragerea consimțământului.</p>
              <p>Pentru exercitarea drepturilor: zecelainfo@gmail.com.</p>
              <p>Ai dreptul să depui plângere la ANSPDCP.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">9. Securitatea datelor</h2>
              <p>Aplicăm măsuri tehnice și organizatorice rezonabile pentru protecția datelor: control acces, parole hash, limitări anti-abuz, loguri, back-up, actualizări și monitorizare.</p>
              <p>Totuși, nicio transmisie online nu poate fi garantată 100% sigură.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">10. Cookie-uri</h2>
              <p>10.1. Cookie-uri esențiale – necesare pentru funcționare (sesiune, autentificare, securitate, protecție CSRF).</p>
              <p>10.2. Cookie-uri de preferințe – rețin opțiuni (ex.: setări, preferințe).</p>
              <p>10.3. Cookie-uri analitice/marketing – utilizate doar dacă îți dai acordul (unde se aplică).</p>
              <p>Pentru detalii complete, consultă și Politica de Cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">11. Minori</h2>
              <p>Platforma nu este destinată copiilor sub 16 ani. Dacă ai între 16–18 ani, este recomandat acordul părintelui/tutorelui.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">12. Comunicări</h2>
              <p>Putem trimite comunicări operaționale (confirmări, activări, facturi, notificări despre cont/abonament, mentenanță).</p>
              <p>Comunicările promoționale, dacă există, se trimit doar cu consimțământ și pot fi oprite oricând.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">13. Modificări ale politicii</h2>
              <p>Putem actualiza această Politică pentru a reflecta schimbări în Platformă sau în cerințele legale.</p>
              <p>Versiunea curentă va fi disponibilă pe această pagină, cu data ultimei actualizări.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900">14. Contact</h2>
              <p>Întrebări despre protecția datelor: zecelainfo@gmail.com sau telefon/WhatsApp: +40 744 218 696.</p>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
