/**
 * Consimtamant cookie-uri (ePrivacy/GDPR). Esentialele (login, preferinte alese explicit) nu cer acord;
 * statistica (GA4, atribuire pe campanii) si marketing (TikTok Pixel) se incarca DOAR dupa acord explicit.
 * Alegerea se pastreaza in localStorage (strict necesar ca sa nu reintrebam la fiecare pagina).
 */

export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: number;
};

/** Cresterea versiunii (ex. la adaugarea unui serviciu nou) reafiseaza banner-ul tuturor. */
export const CONSENT_VERSION = 1;
const STORAGE_KEY = "zli_consent";
export const CONSENT_EVENT = "zli-consent-change";
export const OPEN_CONSENT_EVENT = "zli-consent-open";

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return { analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing), decidedAt: parsed.decidedAt, version: parsed.version };
  } catch {
    return null;
  }
}

export function hasConsent(kind: "analytics" | "marketing"): boolean {
  return Boolean(readConsent()?.[kind]);
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const previous = readConsent();
  const state: ConsentState = { ...choice, decidedAt: new Date().toISOString(), version: CONSENT_VERSION };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* fara storage: alegerea ramane doar pentru pagina curenta */
  }
  const revoked = (previous?.analytics && !choice.analytics) || (previous?.marketing && !choice.marketing);
  if (revoked) clearTrackingStorage(!choice.analytics, !choice.marketing);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { state, revoked } }));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}

/** La retragerea acordului: stergem cookie-urile terte cunoscute si datele de atribuire salvate local. */
function clearTrackingStorage(analytics: boolean, marketing: boolean) {
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`, `.${host.replace(/^www\./, "")}`];
  const expire = (name: string) => {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  };
  const names = document.cookie.split(";").map((part) => part.split("=")[0]?.trim() ?? "");
  for (const name of names) {
    if (analytics && (name === "_ga" || name.startsWith("_ga_") || name === "_gid")) expire(name);
    if (marketing && (name === "_ttp" || name === "_tt_enable_cookie" || name.startsWith("ttcsid") || name === "ttclid")) expire(name);
  }
  try {
    if (analytics) window.localStorage.removeItem("zli_attr");
    if (marketing) {
      const raw = window.localStorage.getItem("zli_attr");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        delete parsed.ttclid;
        window.localStorage.setItem("zli_attr", JSON.stringify(parsed));
      }
    }
  } catch {
    /* ignore */
  }
}
