import type { ReactNode } from "react";

function Kw({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-slate-900">{children}</strong>;
}

type InstructorBioParagraphsProps = {
  className?: string;
};

export function InstructorBioParagraphs({ className }: InstructorBioParagraphsProps) {
  const root = className ? `text-justify ${className}` : "text-justify";

  return (
    <div className={root}>
      <p className="leading-relaxed">
        <Kw>Paul-Ioan Someșan</Kw> este fondatorul proiectelor <Kw>Zece la Examene</Kw>, <Kw>Zece la Grile</Kw> și{" "}
        <Kw>Zece la Bac</Kw>, platforme care au contribuit la schimbarea modului în care elevii din România se pregătesc
        pentru <Kw>Bacalaureat</Kw> și <Kw>admiterea la facultățile de top</Kw>.
      </p>

      <p className="leading-relaxed">
        Absolvent al Facultății de Matematică și Informatică din cadrul Universității Babeș-Bolyai din Cluj-Napoca,{" "}
        <Kw>olimpic național la Informatică</Kw> și unul dintre cei mai buni candidați ai generației sale la admiterea la{" "}
        <Kw>Informatică UBB</Kw>, Paul a transformat pasiunea pentru educație, programare și performanță într-un{" "}
        <Kw>ecosistem digital</Kw> construit pentru elevii care vor <Kw>rezultate reale</Kw>.
      </p>

      <p className="leading-relaxed">
        <Kw>Zece la Info</Kw> apare ca o continuare firească a peste 6 ani de experiență în educație, predare și dezvoltare
        de platforme educaționale. Noua platformă integrează într-un singur loc experiența acumulată prin Zece la Examene,
        Zece la Grile și Zece la Bac, aducând împreună cursuri, grile, probleme, explicații video, simulări, statistici
        inteligente și instrumente moderne de învățare.
      </p>

      <p className="leading-relaxed">
        Prin <Kw>Zece la Info</Kw>, Paul îmbină <Kw>rigoarea academică</Kw> a informaticii cu tehnologia modernă și cu o
        metodă de predare clară, logică și aplicată. Platforma este gândită pentru elevii care vor să înțeleagă profund
        materia, să se pregătească eficient pentru examene și să aibă acces la o experiență completă de învățare,
        construită de cineva care a trecut prin performanță la cel mai înalt nivel și care știe exact ce înseamnă
        pregătirea pentru <Kw>rezultate excelente</Kw>.
      </p>

      <p className="leading-relaxed">
        <Kw>Zece la Info</Kw> nu este doar o nouă platformă, ci pasul următor al unui ecosistem educațional construit în
        jurul performanței, tehnologiei și învățării inteligente.
      </p>
    </div>
  );
}
