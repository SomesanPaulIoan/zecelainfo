/**
 * Paginile de vanzare /pachete/<slug>: cate una pe examen. Fiecare vinde abonamentele de grile (comune tuturor
 * examenelor) si pachetul „grile + cursul examenului pana la 1 August 2027” (`offerCode` din /api/offers-2027).
 */

export type PachetOfferCode = "ubb_bundle" | "ub_unstpb_bundle" | "uaic_tuiasi_bundle" | "bac_bundle";

export type PachetConfig = {
  slug: string;
  /** Eticheta din meniu si din breadcrumbs. */
  label: string;
  /** Numele examenului in fraze („Admiterea la Informatică UBB”). */
  examPhrase: string;
  /** Pentru ce examen exista efectiv grile (la Iasi: doar TU Iasi, nu si UAIC). */
  grileExamPhrase: string;
  /** Precizare afisata langa grile, cand acoperirea difera de numele pachetului. */
  grileScopeNote?: string;
  eyebrow: string;
  h1: string;
  lede: string;
  offerCode: PachetOfferCode;
  courseSlug: string;
  /** Categoriile de grile specifice examenului (evidentiate in lista tuturor categoriilor). */
  grileSlugs: string[];
  /** Pagina cu detalii despre examen (doar Bac are una separata; ghidurile de admitere au fost unite cu aceste pagini). */
  guidePath: string | null;
  /** Testimonialele de la meditatii afisate (filtru pe campul `admission`); null = niciunul. */
  testimonialMatch: RegExp | null;
  testimonialsHeading: string;
  metaTitle: string;
  metaDescription: string;
};

export const PACHETE: PachetConfig[] = [
  {
    slug: "admitere-ubb",
    label: "Admitere UBB",
    examPhrase: "Admiterea la Informatică UBB",
    grileExamPhrase: "Admiterea la Informatică UBB",
    eyebrow: "Admitere Informatică UBB · 2027",
    h1: "Tot ce-ți trebuie pentru Admiterea la Informatică UBB",
    lede: "Toate subiectele date la UBB, rezolvate ca grile cu explicații și video, plus cursul complet cu toată materia din programă. Te pregătești exact pe stilul examenului de la Cluj.",
    offerCode: "ubb_bundle",
    courseSlug: "curs-admitere-ubb",
    grileSlugs: ["admitere-ubb"],
    guidePath: null,
    testimonialMatch: /\bUBB\b/,
    testimonialsHeading: "Elevi admiși la UBB după pregătirea cu Paul",
    metaTitle: "Pachete Admitere Informatică UBB 2027 – Grile + Curs Video",
    metaDescription:
      "Grile de admitere UBB cu explicații și rezolvări video, plus cursul video complet. Abonamente de la 150 lei/lună sau pachet complet curs + grile până la 1 August 2027. Testează gratuit 24h.",
  },
  {
    slug: "admitere-ub-unstpb",
    label: "Admitere UB & UNSTPB",
    examPhrase: "Admiterea la Informatică UB și UNSTPB",
    grileExamPhrase: "Admiterea la Informatică UB și UNSTPB",
    eyebrow: "Admitere Informatică UB & Politehnica · 2027",
    h1: "Tot ce-ți trebuie pentru Admiterea la Informatică UB și UNSTPB",
    lede: "Subiectele reale de la Universitatea din București și Politehnica București, rezolvate ca grile cu explicații și video, plus cursul complet cu toată materia. Un singur pachet pentru ambele admiteri.",
    offerCode: "ub_unstpb_bundle",
    courseSlug: "curs-admitere-ub-unstpb",
    grileSlugs: ["admitere-ub", "admitere-unstpb"],
    guidePath: null,
    testimonialMatch: /\bFMI UB\b|–\s*UB\b|\bUNSTPB\b/,
    testimonialsHeading: "Elevi admiși la UB și Politehnica București după pregătirea cu Paul",
    metaTitle: "Pachete Admitere Informatică UB & UNSTPB 2027 – Grile + Curs",
    metaDescription:
      "Grile de admitere UB și UNSTPB (Politehnica) cu explicații și rezolvări video, plus cursul video complet. De la 150 lei/lună sau pachet curs + grile până la 1 August 2027. Testează gratuit 24h.",
  },
  {
    slug: "admitere-uaic-tuiasi",
    label: "Admitere UAIC & TU Iași",
    examPhrase: "Admiterea la Informatică UAIC și TU Iași",
    grileExamPhrase: "Admiterea la TU Iași",
    grileScopeNote:
      "Grilele sunt din subiectele TU Iași (Automatică și Calculatoare). Admiterea la UAIC nu are încă grile dedicate pe platformă; subiectele UAIC sunt rezolvate în curs.",
    eyebrow: "Admitere Informatică Iași · 2027",
    h1: "Tot ce-ți trebuie pentru Admiterea la Informatică în Iași",
    lede: "Grilele din subiectele TU Iași, cu explicații și video, plus cursul complet cu toată materia din programă și subiectele UAIC și TU Iași rezolvate. Te pregătești pe stilul examenelor din Iași.",
    offerCode: "uaic_tuiasi_bundle",
    courseSlug: "curs-admitere-uaic-tuiasi",
    grileSlugs: ["admitere-tu-iasi"],
    guidePath: null,
    testimonialMatch: null,
    testimonialsHeading: "",
    metaTitle: "Pachete Admitere Informatică UAIC & TU Iași 2027 – Grile + Curs",
    metaDescription:
      "Grile din subiectele de admitere TU Iași cu explicații și rezolvări video, plus cursul video complet cu subiecte UAIC și TU Iași rezolvate. De la 150 lei/lună sau pachet curs + grile până la 1 August 2027. Testează gratuit 24h.",
  },
  {
    slug: "bacalaureat",
    label: "Bacalaureat",
    examPhrase: "Bacalaureatul la Informatică",
    grileExamPhrase: "Bacalaureatul la Informatică",
    eyebrow: "Bacalaureat Informatică · Mate-Info · 2027",
    h1: "Tot ce-ți trebuie pentru Bacalaureatul la Informatică",
    lede: "Itemii din subiectele oficiale de Bac rezolvați ca grile cu explicații și video, plus cursul complet: toată materia și subiecte oficiale rezolvate integral. Și, bonus, acces la grilele tuturor admiterilor.",
    offerCode: "bac_bundle",
    courseSlug: "curs-bacalaureat-informatica-mi",
    grileSlugs: ["bacalaureat"],
    guidePath: "/bacalaureat",
    testimonialMatch: null,
    testimonialsHeading: "",
    metaTitle: "Pachete Bacalaureat Informatică 2027 – Grile + Curs Video",
    metaDescription:
      "Grile din subiectele de Bac la informatică cu explicații și rezolvări video, plus cursul video complet. De la 150 lei/lună sau pachet curs + grile până la 1 August 2027. Testează gratuit 24h.",
  },
];

export function getPachet(slug: string): PachetConfig | undefined {
  return PACHETE.find((pachet) => pachet.slug === slug);
}

export function pachetPath(slug: string): string {
  return `/pachete/${slug}`;
}

/** Ancora sectiunii de preturi de pe fiecare pagina de pachet. */
export const PACHET_PRICING_ANCHOR = "preturi";
export const PACHET_TRIAL_ANCHOR = "test-gratuit";
