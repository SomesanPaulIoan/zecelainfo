"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { captureAttribution, examFromPachetSlug, isExamKey, sendPageHit, syncAttribution } from "@/lib/attribution";
import { CONSENT_EVENT, OPEN_CONSENT_EVENT, readConsent, saveConsent, type ConsentState } from "@/lib/consent";

type Props = { gaMeasurementId: string | null; tiktokPixelId: string | null };

declare global {
  interface Window {
    dataLayer?: unknown[];
    __zliGaLoaded?: boolean;
    __zliTtqLoaded?: boolean;
    TiktokAnalyticsObject?: string;
  }
}

/**
 * Pixel-ul TikTok ruleaza doar pe paginile comerciale (landing, pachete, demo, cont, trial), nu in zonele in care
 * elevii invata (rezolvare grile, cursuri, probleme): nu vrem date de comportament educational catre o retea de reclame.
 */
function isCommercialPath(path: string) {
  return (
    path === "/" ||
    path === "/grile" ||
    path === "/bacalaureat" ||
    path === "/cursuri" ||
    path.startsWith("/pachete") ||
    path.startsWith("/test-gratuit") ||
    path.startsWith("/bun-venit") ||
    path.startsWith("/trial-incheiat") ||
    path === "/login" ||
    path === "/register" ||
    path === "/verify"
  );
}

function pageGroup(path: string): { page: string; exam: string | null } | null {
  if (path === "/") return { page: "home", exam: null };
  if (path === "/pachete") return { page: "pachete", exam: null };
  if (path.startsWith("/pachete/")) return { page: "pachet", exam: examFromPachetSlug(path.split("/")[2] ?? "") };
  if (path.startsWith("/test-gratuit")) {
    const exam = new URLSearchParams(window.location.search).get("exam");
    return { page: "test-gratuit", exam: isExamKey(exam) ? exam : null };
  }
  if (path === "/grile") return { page: "grile", exam: null };
  if (path === "/cursuri") return { page: "cursuri", exam: null };
  return null;
}

function loadGa(id: string) {
  if (window.__zliGaLoaded) return;
  window.__zliGaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  // Doar statistica: fara semnale de publicitate in Google.
  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** Codul de baza oficial TikTok Pixel, fara Advanced Matching (nu apelam niciodata ttq.identify). */
function loadTikTok(pixelId: string) {
  if (window.__zliTtqLoaded) return;
  window.__zliTtqLoaded = true;
  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    ttq.setAndDefer = function (target: any, method: string) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const instance = ttq._i[id] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(instance, ttq.methods[n]);
      return instance;
    };
    ttq.load = function (id: string, options?: any) {
      const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = src;
      ttq._t = ttq._t || {};
      ttq._t[id] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};
      const script = d.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = `${src}?sdkid=${id}&lib=${t}`;
      const first = d.getElementsByTagName("script")[0];
      first.parentNode!.insertBefore(script, first);
    };
    ttq.load(pixelId);
  })(window, document, "ttq");
  /* eslint-enable */
}

export function MarketingRuntime({ gaMeasurementId, tiktokPixelId }: Props) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    const initial = readConsent();
    setConsent(initial);
    setBannerOpen(!initial);
    setReady(true);
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ state: ConsentState; revoked: boolean }>).detail;
      setConsent(detail.state);
      // Scripturile deja incarcate nu pot fi descarcate: la retragere reincarcam pagina fara ele.
      if (detail.revoked) window.location.reload();
    };
    const onOpen = () => {
      const current = readConsent();
      setDraft({ analytics: Boolean(current?.analytics), marketing: Boolean(current?.marketing) });
      setSettingsOpen(true);
      setBannerOpen(true);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener(OPEN_CONSENT_EVENT, onOpen);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener(OPEN_CONSENT_EVENT, onOpen);
    };
  }, []);

  // Scripturile terte: doar dupa acord.
  useEffect(() => {
    if (!consent) return;
    if (consent.analytics && gaMeasurementId) loadGa(gaMeasurementId);
    if (consent.marketing && tiktokPixelId && isCommercialPath(pathname)) loadTikTok(tiktokPixelId);
  }, [consent, gaMeasurementId, tiktokPixelId, pathname]);

  // PageView TikTok doar pe paginile comerciale; GA4 isi trimite singur page_view (enhanced measurement).
  useEffect(() => {
    if (consent?.marketing && window.__zliTtqLoaded && window.ttq && isCommercialPath(pathname)) window.ttq.page();
  }, [consent, pathname]);

  // Contor agregat de afisari (fara cookie) + captura atribuirii (cu acord).
  useEffect(() => {
    const group = pageGroup(pathname);
    if (group) sendPageHit(group.page, isExamKey(group.exam) ? group.exam : null);
    if (consent?.analytics) captureAttribution();
  }, [pathname, consent]);

  // Leaga atribuirea de cont dupa login (o data per user).
  const userId = user?.id ?? null;
  useEffect(() => {
    if (userId && consent?.analytics) void syncAttribution(userId);
  }, [userId, consent]);

  const decide = useCallback(
    (choice: { analytics: boolean; marketing: boolean }) => {
      const previous = readConsent();
      saveConsent(choice);
      setBannerOpen(false);
      setSettingsOpen(false);
      if (userId) {
        if (choice.analytics) {
          captureAttribution();
          void syncAttribution(userId, { force: true });
        } else if (previous?.marketing && !choice.marketing) {
          void apiFetch("/api/marketing/consent", { method: "POST", body: JSON.stringify({ marketing: false }), keepalive: true }).catch(() => undefined);
        }
      }
    },
    [userId],
  );

  if (!ready || !bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-[150] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:px-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-sky-200 bg-white p-4 text-sm text-slate-700 shadow-[0_-10px_50px_-20px_rgba(2,132,199,0.55)] sm:p-5">
        <p id="consent-title" className="font-black text-sky-950">
          Cookie-uri pe Zece la Info
        </p>
        <p className="mt-1.5 leading-relaxed">
          Folosim cookie-uri esențiale pentru cont și funcționarea site-ului. Doar cu acordul tău folosim și cookie-uri de{" "}
          <strong>statistică</strong> (Google Analytics) și de <strong>marketing</strong> (TikTok), ca să vedem ce campanii
          funcționează. Poți schimba oricând alegerea din subsolul paginii.{" "}
          <Link href="/politica-de-cookies" className="font-semibold text-sky-800 underline">
            Detalii
          </Link>
        </p>
        {settingsOpen ? (
          <div className="mt-3 space-y-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
            <label className="flex items-start gap-2.5">
              <input type="checkbox" checked disabled className="mt-0.5 h-4 w-4" />
              <span>
                <strong>Esențiale</strong> — autentificare, preferințe, securitate. Mereu active.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(event) => setDraft((prev) => ({ ...prev, analytics: event.target.checked }))}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong>Statistică</strong> — Google Analytics și sursa vizitei (ex. ce campanie te-a adus), agregat.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={draft.marketing}
                onChange={(event) => setDraft((prev) => ({ ...prev, marketing: event.target.checked }))}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong>Marketing</strong> — TikTok Pixel, pentru măsurarea reclamelor. Nu trimitem email, telefon sau rezultatele
                tale la grile.
              </span>
            </label>
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {settingsOpen ? (
            <button
              type="button"
              onClick={() => decide(draft)}
              className="min-h-11 rounded-xl border-2 border-sky-700 bg-sky-700 px-4 font-bold text-white hover:bg-sky-600 sm:col-span-1"
            >
              Salvează alegerea
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft({ analytics: Boolean(consent?.analytics), marketing: Boolean(consent?.marketing) });
                setSettingsOpen(true);
              }}
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-4 font-bold text-sky-900 hover:bg-sky-50"
            >
              Setări
            </button>
          )}
          <button
            type="button"
            onClick={() => decide({ analytics: false, marketing: false })}
            className="min-h-11 rounded-xl border-2 border-sky-700 bg-white px-4 font-bold text-sky-900 hover:bg-sky-50"
          >
            Doar esențiale
          </button>
          <button
            type="button"
            onClick={() => decide({ analytics: true, marketing: true })}
            className="min-h-11 rounded-xl border-2 border-sky-700 bg-sky-700 px-4 font-bold text-white hover:bg-sky-600"
          >
            Accept toate
          </button>
        </div>
      </div>
    </div>
  );
}
