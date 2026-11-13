import type { Metadata } from "next";
import { PersonalQuestionsWorkspace } from "@/components/grile/PersonalQuestionsWorkspace";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GrileListaMeaPage() {
  return (
    <PersonalQuestionsWorkspace
      title="Lista mea de grile"
      endpoint="/api/grile/me/my-list/questions"
      sourceName="Lista mea"
      contextLabel="Filtru"
      contextPurpose="Intrebari salvate de tine in Lista mea"
      heroDescription="Toate întrebările pe care le-ai adăugat în Lista mea, într-un singur flux de lucru ca la o sursă obișnuită — filtre, progres și explicații la un click."
    />
  );
}
