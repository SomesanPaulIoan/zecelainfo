import type { Metadata } from "next";
import { PersonalQuestionsWorkspace } from "@/components/grile/PersonalQuestionsWorkspace";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function GrileIntrebarileMelePage() {
  return (
    <PersonalQuestionsWorkspace
      title="Întrebările mele marcate"
      endpoint="/api/grile/me/flagged/questions"
      sourceName="Întrebările mele"
      contextLabel="Filtru"
      contextPurpose="Intrebari marcate de tine pentru revizitare"
      heroDescription="Întrebările marcate pentru recapitulare stau aici, grupate ca într-o listă personală — revino la ele când vrei să consolidezi."
    />
  );
}
