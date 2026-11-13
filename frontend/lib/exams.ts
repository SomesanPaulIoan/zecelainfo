/**
 * Configuratia statica a examenelor pentru paginile publice (SEO + linkuri interne).
 * Cifrele (numar grile, video, surse) NU se pun aici — vin live din API.
 * `grileSlug` trebuie sa corespunda cu slug-ul categoriei din `grile_categories`.
 */

/** Anul sezonului de examene vizat de paginile de marketing; schimba-l intr-un singur loc. */
export const TARGET_EXAM_YEAR = 2027;

export type ExamConfig = {
  grileSlug: string;
  /** Eticheta scurta folosita in titluri si linkuri (ex. „UBB”). */
  shortName: string;
  /** Numele institutiei, asa cum apare in mod oficial. */
  institution: string;
  /** Pagina de vanzare/prezentare a examenului (/pachete/<slug> sau /bacalaureat), daca exista. */
  landingPath: string | null;
  courseSlug: string | null;
  /** Fragment folosit in „Grile {grileLabel}”. */
  grileLabel: string;
  /** <title> pentru pagina de grile (fara sufixul de brand); tinut sub ~65 de caractere. */
  grileSeoTitle: string;
  grileIntro: string;
  grileMetaDescription: string;
};

export const EXAMS: ExamConfig[] = [
  {
    grileSlug: "admitere-ubb",
    shortName: "UBB",
    institution: "Universitatea Babeș-Bolyai din Cluj-Napoca",
    landingPath: "/pachete/admitere-ubb",
    courseSlug: "curs-admitere-ubb",
    grileLabel: "Admitere Informatică UBB",
    grileSeoTitle: `Grile Admitere Informatică UBB ${TARGET_EXAM_YEAR} – Subiecte și Simulări`,
    grileIntro:
      "Subiectele de la admiterea la Informatică UBB (sesiunile de vară și de toamnă), Concursul Mate-Info UBB, culegerea de admitere și simulările Zece la Info — toate într-un singur loc, cu indicații, explicații și rezolvări video.",
    grileMetaDescription:
      "Grile pentru admiterea la Informatică UBB Cluj: subiecte oficiale de vară și toamnă, Concurs Mate-Info, simulări cu notă și explicații video pentru fiecare tip de exercițiu.",
  },
  {
    grileSlug: "admitere-ub",
    shortName: "UB",
    institution: "Universitatea din București",
    landingPath: "/pachete/admitere-ub-unstpb",
    courseSlug: "curs-admitere-ub-unstpb",
    grileLabel: "Admitere Informatică UB",
    grileSeoTitle: `Grile Admitere Informatică UB (FMI) ${TARGET_EXAM_YEAR} – Subiecte și Simulări`,
    grileIntro:
      "Subiectele de admitere de la FMI și CTI Universitatea din București, Concursul Mate-Info UB și variante de antrenament, rezolvate cu indicații, explicații și video.",
    grileMetaDescription:
      "Grile pentru admiterea la Informatică la Universitatea din București (FMI): subiecte de admitere, Concurs Mate-Info UB și variante de antrenament cu explicații video.",
  },
  {
    grileSlug: "admitere-unstpb",
    shortName: "UNSTPB",
    institution: "Universitatea Națională de Știință și Tehnologie POLITEHNICA București",
    landingPath: "/pachete/admitere-ub-unstpb",
    courseSlug: "curs-admitere-ub-unstpb",
    grileLabel: "Admitere Informatică UNSTPB (Politehnica București)",
    grileSeoTitle: `Grile Admitere Politehnica București (UNSTPB) Informatică ${TARGET_EXAM_YEAR}`,
    grileIntro:
      "Subiectele de admitere și preadmitere de la Politehnica București, simulările de preadmitere, culegerea de teste și variante de antrenament — cu indicații, explicații și rezolvări video.",
    grileMetaDescription:
      "Grile pentru admiterea la Politehnica București (UNSTPB) la informatică: subiecte de admitere și preadmitere, simulări cu notă și explicații video.",
  },
  {
    grileSlug: "admitere-tu-iasi",
    shortName: "TU Iași",
    institution: "Universitatea Tehnică „Gheorghe Asachi” din Iași",
    landingPath: "/pachete/admitere-uaic-tuiasi",
    courseSlug: "curs-admitere-uaic-tuiasi",
    grileLabel: "Admitere Informatică TU Iași",
    grileSeoTitle: `Grile Admitere Informatică TU Iași ${TARGET_EXAM_YEAR} – Subiecte Rezolvate`,
    grileIntro:
      "Subiectele de admitere la informatică de la Universitatea Tehnică din Iași și variante de antrenament, rezolvate cu indicații, explicații și video.",
    grileMetaDescription:
      "Grile pentru admiterea la Universitatea Tehnică „Gheorghe Asachi” din Iași: subiecte de admitere la informatică și variante de antrenament, cu explicații video.",
  },
  {
    grileSlug: "admitere-atm",
    shortName: "ATM",
    institution: "Academia Tehnică Militară „Ferdinand I”",
    landingPath: null,
    courseSlug: null,
    grileLabel: "Admitere Informatică ATM",
    grileSeoTitle: `Grile Admitere ATM Informatică ${TARGET_EXAM_YEAR} – Subiecte și Culegere`,
    grileIntro:
      "Subiectele de admitere la Academia Tehnică Militară și culegerea de probleme, organizate pe surse și pe capitole, cu indicații și explicații.",
    grileMetaDescription:
      "Grile pentru admiterea la Academia Tehnică Militară (ATM) la informatică: subiecte din anii anteriori și culegere, organizate pe capitole, cu explicații.",
  },
  {
    grileSlug: "bacalaureat",
    shortName: "Bac",
    institution: "Bacalaureat — proba de Informatică",
    landingPath: "/bacalaureat",
    courseSlug: "curs-bacalaureat-informatica-mi",
    grileLabel: "Bacalaureat Informatică",
    grileSeoTitle: `Grile Bac Informatică ${TARGET_EXAM_YEAR} – Itemi din Subiecte, cu Explicații`,
    grileIntro:
      "Itemii tip grilă din subiectele de Bacalaureat la informatică din ultimii ani și variante de antrenament, cu indicații, explicații și rezolvări video.",
    grileMetaDescription:
      "Grile de Bacalaureat la informatică: itemi din subiectele oficiale și variante de antrenament, organizați pe ani și pe capitole, cu explicații video.",
  },
];

export function getExamByGrileSlug(slug: string): ExamConfig | undefined {
  return EXAMS.find((exam) => exam.grileSlug === slug);
}

/** URL-ul canonic al paginii de grile pentru un examen. */
export function grileExamPath(slug: string, view: "sources" | "chapters" = "sources"): string {
  return view === "chapters" ? `/grile/${slug}/capitole` : `/grile/${slug}`;
}

/** Landing-urile de admitere (fara Bac, care are propria sectiune). */
export type AdmissionLanding = {
  key: string;
  path: string;
  shortName: string;
  /** Numele afisat (pentru Iasi acopera doua universitati). */
  title: string;
  /** <title> fara sufixul de brand. */
  seoTitle: string;
  institutions: string[];
  grileSlug: string;
  courseSlug: string;
  /** Regex pe campul `admission` al testimonialelor, ca sa afisam doar elevi admisi la acea universitate. */
  testimonialMatch: RegExp | null;
  intro: string;
  metaDescription: string;
};

export const ADMISSION_LANDINGS: AdmissionLanding[] = [
  {
    key: "ubb",
    path: "/pachete/admitere-ubb",
    shortName: "UBB",
    title: "Admitere Informatică UBB",
    seoTitle: `Admitere Informatică UBB ${TARGET_EXAM_YEAR} – Curs, Grile și Simulări`,
    institutions: ["Universitatea Babeș-Bolyai din Cluj-Napoca"],
    grileSlug: "admitere-ubb",
    courseSlug: "curs-admitere-ubb",
    testimonialMatch: /\bUBB\b/,
    intro:
      "Pregătirea pentru admiterea la Informatică la Universitatea Babeș-Bolyai, construită în jurul subiectelor reale: cursul video care acoperă toată materia, toate subiectele de admitere și de la Concursul Mate-Info rezolvate sub formă de grile și simulări pe timp, cu notă la final.",
    metaDescription:
      "Pregătire completă pentru admiterea la Informatică UBB Cluj: curs video, subiecte oficiale și Concurs Mate-Info ca grile, simulări de examen și explicații video.",
  },
  {
    key: "ub",
    path: "/pachete/admitere-ub-unstpb",
    shortName: "UB",
    title: "Admitere Informatică UB",
    seoTitle: `Admitere Informatică UB (FMI) ${TARGET_EXAM_YEAR} – Curs, Grile și Simulări`,
    institutions: ["Universitatea din București"],
    grileSlug: "admitere-ub",
    courseSlug: "curs-admitere-ub-unstpb",
    testimonialMatch: /\bFMI UB\b|–\s*UB\b/,
    intro:
      "Pregătirea pentru admiterea la Informatică la Universitatea din București: cursul video comun pentru UB și Politehnica, subiectele de admitere FMI și CTI, Concursul Mate-Info UB și variante de antrenament, toate cu explicații.",
    metaDescription:
      "Pregătire pentru admiterea la Informatică UB (FMI București): curs video, subiecte de admitere și Concurs Mate-Info ca grile, simulări de examen și explicații video.",
  },
  {
    key: "unstpb",
    path: "/pachete/admitere-ub-unstpb",
    shortName: "UNSTPB",
    title: "Admitere Informatică UNSTPB (Politehnica București)",
    seoTitle: `Admitere Informatică Politehnica București (UNSTPB) ${TARGET_EXAM_YEAR}`,
    institutions: ["Universitatea Națională de Știință și Tehnologie POLITEHNICA București"],
    grileSlug: "admitere-unstpb",
    courseSlug: "curs-admitere-ub-unstpb",
    testimonialMatch: /\bUNSTPB\b/,
    intro:
      "Pregătirea pentru admiterea la Politehnica București pe partea de informatică: cursul video comun pentru UB și UNSTPB, subiectele de admitere și preadmitere, simulările de preadmitere și zeci de variante de antrenament, cu explicații video.",
    metaDescription:
      "Pregătire pentru admiterea la Politehnica București (UNSTPB) la informatică: curs video, subiecte de admitere și preadmitere ca grile, simulări și explicații video.",
  },
  {
    key: "iasi",
    path: "/pachete/admitere-uaic-tuiasi",
    shortName: "Iași",
    title: "Admitere Informatică Iași (UAIC și TU Iași)",
    seoTitle: `Admitere Informatică Iași ${TARGET_EXAM_YEAR} (UAIC, TU Iași) – Curs și Grile`,
    institutions: ["Universitatea „Alexandru Ioan Cuza” din Iași", "Universitatea Tehnică „Gheorghe Asachi” din Iași"],
    grileSlug: "admitere-tu-iasi",
    courseSlug: "curs-admitere-uaic-tuiasi",
    testimonialMatch: null,
    intro:
      "Pregătirea pentru admiterea la informatică în Iași: cursul video dedicat UAIC și Universității Tehnice „Gheorghe Asachi”, plus subiectele de admitere de la TU Iași și variante de antrenament sub formă de grile, cu explicații.",
    metaDescription:
      "Pregătire pentru admiterea la Informatică în Iași (UAIC și TU Iași): curs video, subiecte de admitere TU Iași ca grile, simulări de examen și explicații video.",
  },
];

export function getAdmissionLanding(key: string): AdmissionLanding | undefined {
  return ADMISSION_LANDINGS.find((landing) => landing.key === key);
}
