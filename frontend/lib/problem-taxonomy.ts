export type ProblemLevel = "grade9" | "grade10" | "grade11" | "bacalaureat" | "oop" | "concursuri";

export type ProblemItem = {
  id: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  tags: string[];
  source: string | null;
  time_limit_ms: number;
  memory_limit_mb: number;
  curriculum_level?: ProblemLevel | null;
  curriculum_chapter_id?: string | null;
  curriculum_subcategory_id?: string | null;
};

export type SubcategoryDef = { id: string; name: string; keywords: string[] };
export type ChapterDef = { id: string; name: string; subcategories: SubcategoryDef[] };
export type Taxonomy = Record<ProblemLevel, ChapterDef[]>;

export const levelOptions: Array<{ label: string; value: ProblemLevel }> = [
  { label: "Clasa a 9-a", value: "grade9" },
  { label: "Clasa a 10-a", value: "grade10" },
  { label: "Clasa a 11-a", value: "grade11" },
  { label: "Bacalaureat", value: "bacalaureat" },
  { label: "OOP", value: "oop" },
  { label: "Concursuri", value: "concursuri" },
];

type BacSessionDef = { id: string; label: string };

const BAC_ANTRENAMENT_COUNT_BY_YEAR: Record<number, number> = {
  2020: 20,
  2021: 12,
};

const BAC_SESSIONS_BY_YEAR: Record<number, BacSessionDef[]> = {
  2020: [
    { id: "model", label: "Model" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
  2021: [
    { id: "model", label: "Model" },
    { id: "simulare", label: "Simulare" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
  2022: [
    { id: "model", label: "Model" },
    { id: "simulare", label: "Simulare" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
  2023: [
    { id: "model", label: "Model" },
    { id: "simulare", label: "Simulare" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
  2024: [
    { id: "model", label: "Model" },
    { id: "simulare", label: "Simulare" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
  2025: [
    { id: "model", label: "Model" },
    { id: "simulare", label: "Simulare" },
    { id: "speciala", label: "Sesiune Speciala" },
    { id: "vara", label: "Sesiunea Vara" },
    { id: "toamna", label: "Sesiunea Toamna" },
  ],
};

function buildBacYearChapter(year: number): ChapterDef {
  const sessions = BAC_SESSIONS_BY_YEAR[year] ?? [];
  const subcategories: SubcategoryDef[] = sessions.map((session) => ({
    id: `${session.id}-${year}`,
    name: `${session.label} ${year}`,
    keywords: ["bacalaureat", "subiectul 3", "subiectul iii", session.id, String(year)],
  }));
  const antrenamentCount = BAC_ANTRENAMENT_COUNT_BY_YEAR[year] ?? 0;
  for (let v = 1; v <= antrenamentCount; v++) {
    subcategories.push({
      id: `antrenament-${year}-v${v}`,
      name: `Antrenament ${year} - Varianta ${v}`,
      keywords: ["bacalaureat", "antrenament", "subiectul 3", "subiectul iii", String(year), `varianta ${v}`],
    });
  }
  return { id: `bacalaureat-${year}`, name: `Bacalaureat ${year}`, subcategories };
}

/** Probleme de concurs (Concurs MateInfo UB) transformate din grile care necesitau de fapt un calcul/algoritm, nu doar cunostinte teoretice. */
function buildConcursMIUBYearChapter(year: number): ChapterDef {
  return {
    id: `concurs-mi-ub-${year}`,
    name: `Concurs MI UB ${year}`,
    subcategories: [
      { id: `probleme-${year}`, name: `Probleme ${year}`, keywords: ["concurs", "mateinfo", "mi ub", "concurs mate info ub", String(year)] },
    ],
  };
}

export const taxonomy: Taxonomy = {
  grade9: [
    {
      id: "probleme-de-baza",
      name: "Probleme de Baza",
      subcategories: [
        { id: "operatori-expresii", name: "Operatori si Expresii", keywords: ["operator", "expres", "aritmetica", "introducere"] },
        { id: "structuri-decizie-general", name: "Structuri de Decizie", keywords: ["if", "decizie", "conditie"] },
        { id: "structuri-repetitive-general", name: "Structuri Repetitive", keywords: ["for", "while", "repet", "loop"] },
      ],
    },
    {
      id: "algoritmi-elementari",
      name: "Probleme cu Algoritmi Elementari",
      subcategories: [
        { id: "sume-produse-numarari", name: "Sume, produse, numarari", keywords: ["suma", "produs", "numarare", "count"] },
        { id: "maxime-minime", name: "Maxime si minime", keywords: ["maxim", "minim", "max", "min"] },
        { id: "cifrele-unui-numar", name: "Cifrele unui numar", keywords: ["cifre", "numar", "palindrom"] },
        { id: "divizibilitate", name: "Divizibilitate", keywords: ["diviz", "prim", "cmmdc", "cmmmc"] },
        { id: "generarea-unor-siruri", name: "Generarea unor siruri", keywords: ["sir", "generare", "fibonacci"] },
        { id: "baze-de-numeratie", name: "Baze de numeratie", keywords: ["baza", "binar", "hex", "conversie"] },
      ],
    },
    {
      id: "tablouri-uni",
      name: "Probleme cu Tablouri Unidimensionale",
      subcategories: [
        { id: "parcurgerea-vectorilor", name: "Parcurgerea vectorilor", keywords: ["parcurgere", "vector", "unidimensional"] },
        { id: "stergeri-inserari", name: "Stergeri si inserari de elemente in vectori", keywords: ["sterg", "inser", "insert", "delete"] },
        { id: "verificarea-proprietatilor", name: "Verificarea unor proprietati", keywords: ["propriet", "verific"] },
        { id: "sortarea-vectorilor", name: "Sortarea vectorilor", keywords: ["sort", "ordon"] },
        { id: "interclasare", name: "Interclasare", keywords: ["interclas", "merge"] },
        { id: "cautare-binara", name: "Cautare binara", keywords: ["binary-search", "cautare binara", "interogari"] },
        { id: "probleme-secvente", name: "Probleme cu secvente", keywords: ["secventa", "subsir", "subarray"] },
        { id: "vectori-frecventa", name: "Vectori caracteristici / de frecventa", keywords: ["frecventa", "caracteristic"] },
      ],
    },
    {
      id: "tablouri-bi",
      name: "Probleme cu Tablouri Bidimensionale",
      subcategories: [
        { id: "parcurgere-matrici-oarecare", name: "Parcurgerea matricelor oarecare", keywords: ["matrice", "bidimensional", "linii", "coloane"] },
        { id: "parcurgere-matrici-patratice", name: "Parcurgerea matricelor patratice", keywords: ["matrice patratica", "diagonala", "patratica"] },
        { id: "generari-matrice", name: "Generari de matrice", keywords: ["generare", "matrice", "pattern", "spirala"] },
      ],
    },
  ],
  grade10: [
    {
      id: "subprograme",
      name: "Subprograme",
      subcategories: [
        { id: "returneaza-valori", name: "Subprograme care returneaza valori", keywords: ["functie", "return", "valoare"] },
        { id: "valori-prin-parametri", name: "Subprograme care intorc valori prin parametri", keywords: ["parametru", "referinta", "by reference"] },
        { id: "prelucreaza-tab-unidimensionale", name: "Subprograme care prelucreaza tablouri unidimensionale", keywords: ["subprogram", "vector", "unidimensional"] },
        { id: "prelucreaza-tab-bidimensionale", name: "Subprograme care prelucreaza tablouri bidimensionale", keywords: ["subprogram", "matrice", "bidimensional"] },
        { id: "subprograme-siruri", name: "Subprograme cu siruri de caractere", keywords: ["subprogram", "siruri", "string"] },
      ],
    },
    {
      id: "subprograme-recursive",
      name: "Subprograme Recursive",
      subcategories: [
        { id: "subprograme-recursive-baza", name: "Subprograme recursive", keywords: ["recursiv", "recursive"] },
        { id: "subprograme-recursive-diverse", name: "Probleme diverse", keywords: ["recursie", "probleme diverse"] },
      ],
    },
    {
      id: "divide-et-impera",
      name: "Divide et Impera",
      subcategories: [
        { id: "dei-diverse", name: "Probleme diverse", keywords: ["divide et impera", "dei", "impera"] },
        { id: "dei-sortare", name: "Algoritmi de sortare", keywords: ["merge sort", "quicksort", "sortare"] },
      ],
    },
    {
      id: "siruri-caractere",
      name: "Siruri de caractere",
      subcategories: [
        { id: "prelucrari-elementare-siruri", name: "Prelucrari elementare pe siruri de caractere", keywords: ["siruri", "string", "char", "prelucrari", "vocale", "consoane"] },
        { id: "operatii-cu-siruri", name: "Operatii clasice cu siruri (comparare, cautare, concatenare)", keywords: ["strlen", "strcpy", "strcat", "strcmp", "substr", "cautare", "concatenare", "cuvinte"] },
        { id: "siruri-diverse", name: "Cuvinte, propozitii si prelucrari complexe", keywords: ["siruri", "diverse", "propozitie", "cuvinte", "codificare"] },
      ],
    },
    {
      id: "structuri-neomogene",
      name: "Structuri de date Neomogene",
      subcategories: [
        { id: "neomogene-diverse", name: "Probleme diverse", keywords: ["structuri neomogene", "inregistrare", "struct"] },
        { id: "exercitii-structuri", name: "Exercitii cu structuri", keywords: ["struct", "inregistrare", "campuri"] },
      ],
    },
    {
      id: "structuri-liniare",
      name: "Structuri de date liniare",
      subcategories: [
        { id: "stiva", name: "Stiva", keywords: ["stiva", "stack"] },
        { id: "coada", name: "Coada", keywords: ["coada", "queue"] },
        { id: "lee", name: "Algoritmul Lee", keywords: ["lee", "bfs", "labirint", "distanta minima", "flood fill"] },
      ],
    },
    {
      id: "liste-alocate-dinamic",
      name: "Liste Alocate Dinamic",
      subcategories: [
        { id: "liste-simplu", name: "Operatii cu liste simplu inlantuite", keywords: ["lista simplu", "simplu inlantuita", "linked list"] },
        { id: "liste-dublu", name: "Operatii cu liste dublu inlantuite", keywords: ["lista dublu", "dublu inlantuita", "doubly linked"] },
      ],
    },
  ],
  grade11: [
    {
      id: "backtracking",
      name: "Backtracking",
      subcategories: [
        { id: "elemente-combinatorica", name: "Elemente de Combinatorica", keywords: ["backtracking", "combinatorica", "permutari", "aranjamente", "combinari"] },
        { id: "backtracking-diverse", name: "Probleme Diverse", keywords: ["backtracking", "diverse"] },
        { id: "backtracking-plan", name: "Backtracking in Plan", keywords: ["backtracking in plan", "grid", "labirint"] },
      ],
    },
    { id: "greedy", name: "Metoda Greedy", subcategories: [{ id: "greedy-diverse", name: "Probleme diverse", keywords: ["greedy", "interval", "activitati", "huffman"] }] },
    {
      id: "dp",
      name: "Programare Dinamica",
      subcategories: [
        { id: "dp-numarare", name: "Probleme de numarare", keywords: ["dp", "numarare", "count ways"] },
        { id: "dp-definitorii", name: "Probleme definitorii", keywords: ["dp", "subsecventa", "knapsack", "lcs", "editare"] },
      ],
    },
    {
      id: "grafuri",
      name: "Teoria Grafurilor",
      subcategories: [
        { id: "grafuri-neorientate-elementar", name: "Probleme elementare cu grafuri neorientate", keywords: ["graf neorientat", "neorientat", "grafuri elementare"] },
        { id: "parcurgere-neorientate", name: "Parcurgerea grafurilor neorientate", keywords: ["bfs", "dfs", "componenta conexa"] },
        { id: "grafuri-orientate-diverse", name: "Probleme diverse cu grafuri orientate", keywords: ["graf orientat", "topologic", "scc"] },
        { id: "grafuri-costuri", name: "Grafuri cu costuri", keywords: ["dijkstra", "bellman", "cost", "ponderi"] },
        { id: "arbori-radacina", name: "Arbori cu radacina", keywords: ["arbore cu radacina", "tree", "radacina"] },
      ],
    },
    {
      id: "structuri-arborescente",
      name: "Structuri de date arborescente",
      subcategories: [
        { id: "arbori-binari", name: "Arbori binari", keywords: ["arbore binar", "binary tree"] },
        { id: "structuri-date-arbori", name: "Structuri de date", keywords: ["heap", "bst", "arbore"] },
        { id: "arbori-intervale", name: "Arbori de intervale", keywords: ["segment tree", "arbore de intervale", "fenwick"] },
      ],
    },
  ],
  bacalaureat: [2020, 2021, 2022, 2023, 2024, 2025].map(buildBacYearChapter),
  oop: [
    {
      id: "oop-clase-simple",
      name: "Clase Simple",
      subcategories: [
        { id: "incapsulare-si-constructori", name: "Incapsulare si constructori", keywords: ["clasa", "constructor", "incapsulare", "getter", "setter", "oop"] },
      ],
    },
    {
      id: "oop-colectii-interne",
      name: "Clase cu Colectii Interne",
      subcategories: [
        { id: "validare-si-colectii", name: "Validare si colectii interne", keywords: ["clasa", "vector", "validare", "colectie", "oop"] },
      ],
    },
    {
      id: "oop-compunere-clase",
      name: "Compunere de Clase",
      subcategories: [
        { id: "compunere-obiecte", name: "O clasa contine obiecte din alta clasa", keywords: ["clasa", "compunere", "composition", "oop"] },
      ],
    },
    {
      id: "oop-sisteme-mari",
      name: "Sisteme Mari (Compunere Multipla)",
      subcategories: [
        { id: "sisteme-multi-clasa", name: "Sisteme cu mai multe clase care colaboreaza", keywords: ["clasa", "sistem", "catalog", "oop", "multi-clasa"] },
      ],
    },
  ],
  concursuri: [2021, 2022, 2023, 2024, 2025, 2026].map(buildConcursMIUBYearChapter),
};

export function getProblemLevel(problem: ProblemItem): ProblemLevel {
  if (problem.curriculum_level && ["grade9", "grade10", "grade11", "bacalaureat", "oop", "concursuri"].includes(problem.curriculum_level)) {
    return problem.curriculum_level;
  }
  const tags = problem.tags.map((tag) => tag.toLowerCase().trim());
  if (tags.some((tag) => ["clasa9", "clasa-9", "clasa a 9-a", "9"].includes(tag))) return "grade9";
  if (tags.some((tag) => ["clasa10", "clasa-10", "clasa a 10-a", "10"].includes(tag))) return "grade10";
  if (tags.some((tag) => ["clasa11", "clasa-11", "clasa a 11-a", "11"].includes(tag))) return "grade11";
  if (problem.difficulty === "easy") return "grade9";
  if (problem.difficulty === "medium") return "grade10";
  return "grade11";
}

export function classifyProblem(problem: ProblemItem, chapters: ChapterDef[]): { chapter: ChapterDef; subcategory: SubcategoryDef } {
  if (problem.curriculum_chapter_id && problem.curriculum_subcategory_id) {
    const explicitChapter = chapters.find((chapter) => chapter.id === problem.curriculum_chapter_id);
    const explicitSubcategory = explicitChapter?.subcategories.find(
      (subcategory) => subcategory.id === problem.curriculum_subcategory_id,
    );
    if (explicitChapter && explicitSubcategory) {
      return { chapter: explicitChapter, subcategory: explicitSubcategory };
    }
  }

  const normalizedTags = new Set(problem.tags.map((tag) => tag.toLowerCase().trim()));

  for (const chapter of chapters) {
    for (const subcategory of chapter.subcategories) {
      if (normalizedTags.has(subcategory.id.toLowerCase())) {
        return { chapter, subcategory };
      }
    }
  }

  const haystack = `${problem.title} ${problem.slug} ${problem.tags.join(" ")}`.toLowerCase();
  for (const chapter of chapters) {
    for (const subcategory of chapter.subcategories) {
      if (subcategory.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
        return { chapter, subcategory };
      }
    }
  }
  return { chapter: chapters[0], subcategory: chapters[0].subcategories[0] };
}
