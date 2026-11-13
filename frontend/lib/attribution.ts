import { apiFetch } from "@/lib/api";
import { hasConsent } from "@/lib/consent";

/**
 * Examenul ales si atribuirea pe campanii.
 * - Examenul ales e o preferinta functionala (o alege elevul, nu e tracking) → se pastreaza mereu.
 * - utm_* / pagina de intrare: doar cu acord de statistica; ttclid: doar cu acord de marketing.
 * - Prima atingere castiga (nu suprascriem o campanie cu alta in aceeasi atribuire).
 */

export const DEMO_EXAMS = [
  { key: "ubb", label: "Admitere UBB Cluj-Napoca", short: "UBB", pachet: "admitere-ubb", grile: "admitere-ubb" },
  { key: "ub", label: "Admitere Universitatea din București", short: "UB", pachet: "admitere-ub-unstpb", grile: "admitere-ub" },
  { key: "unstpb", label: "Admitere UNSTPB (Politehnica București)", short: "UNSTPB", pachet: "admitere-ub-unstpb", grile: "admitere-unstpb" },
  { key: "iasi", label: "Admitere UAIC / TU Iași", short: "Iași", pachet: "admitere-uaic-tuiasi", grile: "admitere-tu-iasi" },
  { key: "bac", label: "Bacalaureat Informatică", short: "Bac", pachet: "bacalaureat", grile: "bacalaureat" },
] as const;

export type ExamKey = (typeof DEMO_EXAMS)[number]["key"];

export function isExamKey(value: unknown): value is ExamKey {
  return typeof value === "string" && DEMO_EXAMS.some((exam) => exam.key === value);
}

export function examInfo(key: ExamKey) {
  return DEMO_EXAMS.find((exam) => exam.key === key)!;
}

/** Pagina de pachete → examenul implicit (UB&UNSTPB → ub). */
export function examFromPachetSlug(slug: string): ExamKey | null {
  return DEMO_EXAMS.find((exam) => exam.pachet === slug)?.key ?? null;
}

const EXAM_KEY = "zli_exam";
const ATTR_KEY = "zli_attr";
const SENT_PREFIX = "zli_attr_sent_";
const DEMO_SESSION_KEY = "zli_demo_session";

export function getPreferredExam(): ExamKey | null {
  try {
    const value = window.localStorage.getItem(EXAM_KEY);
    return isExamKey(value) ? value : null;
  } catch {
    return null;
  }
}

export function setPreferredExam(exam: ExamKey) {
  try {
    window.localStorage.setItem(EXAM_KEY, exam);
  } catch {
    /* ignore */
  }
}

type StoredAttribution = {
  utm: Record<string, string>;
  ttclid?: string;
  landingPath: string;
  firstTouchAt: string;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

/** UTM-urile din URL-ul curent (nu din storage): folosite pentru contorul agregat de vizite. */
export function currentUrlUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 100);
  }
  return utm;
}

export function captureAttribution() {
  if (typeof window === "undefined") return;
  const utm = currentUrlUtm();
  const ttclid = new URLSearchParams(window.location.search).get("ttclid")?.trim() || undefined;
  if (!hasConsent("analytics")) return;
  try {
    const existing = readStoredAttribution();
    if (existing && Object.keys(existing.utm).length > 0) {
      if (ttclid && !existing.ttclid && hasConsent("marketing")) {
        window.localStorage.setItem(ATTR_KEY, JSON.stringify({ ...existing, ttclid }));
      }
      return;
    }
    if (Object.keys(utm).length === 0 && existing) return;
    const record: StoredAttribution = {
      utm,
      ttclid: hasConsent("marketing") ? ttclid : undefined,
      landingPath: window.location.pathname,
      firstTouchAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ATTR_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

function readStoredAttribution(): StoredAttribution | null {
  try {
    const raw = window.localStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as StoredAttribution) : null;
  } catch {
    return null;
  }
}

/** Pentru sesiunea de demo: atribuirea se trimite doar daca exista acord de statistica. */
export function attributionForServer(): Record<string, string> | null {
  if (!hasConsent("analytics")) return null;
  const stored = readStoredAttribution();
  const fromUrl = currentUrlUtm();
  return Object.keys(fromUrl).length > 0 ? fromUrl : stored?.utm ?? null;
}

export function rememberDemoSession(id: string) {
  try {
    window.sessionStorage.setItem(DEMO_SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

export function lastDemoSession(): string | null {
  try {
    return window.sessionStorage.getItem(DEMO_SESSION_KEY);
  } catch {
    return null;
  }
}

/** O singura data per utilizator (si la schimbarea acordului): leaga atribuirea de cont pe server. */
export async function syncAttribution(userId: string, opts: { force?: boolean } = {}) {
  if (!hasConsent("analytics")) return;
  const sentKey = `${SENT_PREFIX}${userId}`;
  try {
    if (!opts.force && window.localStorage.getItem(sentKey)) return;
  } catch {
    return;
  }
  const stored = readStoredAttribution();
  try {
    await apiFetch("/api/marketing/attribution", {
      method: "POST",
      body: JSON.stringify({
        utm: stored?.utm ?? null,
        ttclid: hasConsent("marketing") ? stored?.ttclid ?? null : null,
        landingPath: stored?.landingPath ?? null,
        firstTouchAt: stored?.firstTouchAt ?? null,
        exam: getPreferredExam(),
        marketingConsent: hasConsent("marketing"),
        demoSessionId: lastDemoSession(),
      }),
    });
    window.localStorage.setItem(sentKey, "1");
  } catch {
    /* reincercam la urmatoarea incarcare */
  }
}

/** Contor agregat, fara cookie si fara identificator (nu necesita acord). */
export function sendPageHit(page: string, exam: ExamKey | null) {
  try {
    const body = JSON.stringify({ page, exam, utm: currentUrlUtm() });
    void fetch("/api/marketing/hit", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
  } catch {
    /* ignore */
  }
}

/** Unde duce „Activează gratuit 24h”: pagina pachetului examenului, cu modalul de trial deschis automat. */
export function trialActivationPath(exam: ExamKey | null): string {
  const pachet = exam ? examInfo(exam).pachet : "admitere-ubb";
  return `/pachete/${pachet}?activeaza=1#test-gratuit`;
}

/** Pentru vizitatorii fara cont: inregistrare, apoi revenire la activarea trialului. */
export function trialActivationHref(exam: ExamKey | null, loggedIn: boolean): string {
  const target = trialActivationPath(exam);
  return loggedIn ? target : `/register?next=${encodeURIComponent(target)}&motiv=trial`;
}
