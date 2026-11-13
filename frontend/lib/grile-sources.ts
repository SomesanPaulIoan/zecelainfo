/** Etichetarea surselor de grile pe tab-uri (ex. „Examen Vara”, „Concurs Mate Info”) pe baza numelui sursei. */

export type GrileItem = {
  id: string;
  name: string;
  image_url?: string | null;
  total_questions: number;
  exam_mode_enabled?: boolean;
  source_tag?: string | null;
};

const UBB_SOURCE_TAG_ORDER = [
  "Concurs Mate Info",
  "Examen Vara",
  "Examen Toamna",
  "Simulari Zece la Info",
  "Culegere Oficiala",
  "Grile Antrenament",
] as const;

const UNSTPB_SOURCE_TAG_ORDER = [
  "Simulare Examen Preadmitere",
  "Examen Preadmitere",
  "Examen Admitere",
  "Examen Vara",
  "Variante de Antrenament",
  "Culegere",
] as const;

const UB_SOURCE_TAG_ORDER = ["Admitere FMI", "Admitere CTI", "Concurs Mate Info", "Variante de Antrenament"] as const;

function resolveUbSourceTag(sourceName: string): string | null {
  const n = sourceName.toLowerCase();
  if (n.includes("varianta") || n.includes("variante") || n.includes("antrenament")) return "Variante de Antrenament";
  if (n.includes("concurs") || n.includes("mate info")) return "Concurs Mate Info";
  if (n.includes("cti")) return "Admitere CTI";
  if (n.includes("fmi")) return "Admitere FMI";
  return null;
}

function resolveUbbSourceTag(sourceName: string): string | null {
  const normalizedName = sourceName.toLowerCase();
  if (normalizedName.includes("concurs")) return "Concurs Mate Info";
  if (normalizedName.includes("toamna")) return "Examen Toamna";
  if (normalizedName.includes("simular") || normalizedName.includes("zece la info")) return "Simulari Zece la Info";
  // Doar culegerile 115 / 230 „de antrenament” — nu și „Test Antrenament … Culegere Admitere …”.
  const is115Or230Antrenament =
    /\b(115|230)\b/.test(normalizedName) && normalizedName.includes("antrenament");
  if (is115Or230Antrenament) return "Grile Antrenament";
  if (normalizedName.includes("culegere")) return "Culegere Oficiala";
  if (normalizedName.includes("antrenament")) return "Grile Antrenament";
  if (normalizedName.includes("vara") || normalizedName.includes("admitere")) return "Examen Vara";
  return null;
}

function resolveUnstpbSourceTag(sourceName: string): string | null {
  const n = sourceName.toLowerCase();
  if (n.includes("simulare") && n.includes("preadmitere")) return "Simulare Examen Preadmitere";
  if (n.includes("simulare")) return "Examen Admitere";
  if (n.includes("vara")) return "Examen Vara";
  if (n.includes("culegere")) return "Culegere";
  if (n.includes("varianta") || n.includes("variante") || n.includes("antrenament")) return "Variante de Antrenament";
  // „preadmitere” conține „admitere” — verificăm întâi preadmitere.
  if (n.includes("preadmitere")) return "Examen Preadmitere";
  if (n.includes("admitere")) return "Examen Admitere";
  return null;
}

export function resolveSourceTag(categorySlug: string, sourceName: string): string | null {
  if (categorySlug === "admitere-ubb") return resolveUbbSourceTag(sourceName);
  if (categorySlug === "admitere-unstpb") return resolveUnstpbSourceTag(sourceName);
  if (categorySlug === "admitere-ub") return resolveUbSourceTag(sourceName);
  return null;
}

export function sourceTagFallback(categorySlug: string): string | null {
  if (categorySlug === "admitere-ubb") return UBB_SOURCE_TAG_ORDER[UBB_SOURCE_TAG_ORDER.length - 1];
  if (categorySlug === "admitere-unstpb") return "Examen Admitere";
  if (categorySlug === "admitere-ub") return "Admitere FMI";
  return null;
}

export function withResolvedSourceTags(items: GrileItem[], categorySlug: string): GrileItem[] {
  const fallback = sourceTagFallback(categorySlug);
  if (fallback == null) return items;
  return items.map((item) => {
    const resolvedTag = resolveSourceTag(categorySlug, item.name);
    const fallbackTag = resolvedTag ?? fallback;
    return { ...item, source_tag: fallbackTag };
  });
}

export function sourceTagTabOrderForCategory(categorySlug: string): string[] | undefined {
  if (categorySlug === "admitere-ubb") return [...UBB_SOURCE_TAG_ORDER];
  if (categorySlug === "admitere-unstpb") return [...UNSTPB_SOURCE_TAG_ORDER];
  if (categorySlug === "admitere-ub") return [...UB_SOURCE_TAG_ORDER];
  return undefined;
}
