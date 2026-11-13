import { hasConsent } from "@/lib/consent";

/**
 * Evenimente de funnel, trimise catre GA4 (doar cu acord de statistica) si TikTok Pixel (doar cu acord de marketing).
 * Nu trimitem niciodata date personale (email, telefon, nume) si nici rezultate scolare (scoruri, raspunsuri).
 *
 * TikTok: nume standard (ViewContent, CompleteRegistration, StartTrial, InitiateCheckout, Purchase) + 2 custom pentru demo.
 * Purchase/StartTrial folosesc acelasi event_id ca serverul (Events API) → TikTok deduplica.
 */

export type FunnelEvent =
  | { name: "view_content"; exam: string | null; contentId: string }
  | { name: "demo_started"; exam: string }
  | { name: "demo_completed"; exam: string }
  | { name: "sign_up"; method: "email" | "google" }
  | { name: "start_trial"; eventId: string; exam: string | null }
  | { name: "begin_checkout"; eventId: string; productCode: string; value: number }
  | { name: "purchase"; eventId: string; productCode: string; value: number };

type Gtag = (...args: unknown[]) => void;
type Ttq = { track: (event: string, props?: Record<string, unknown>, options?: { event_id?: string }) => void; page: () => void };

declare global {
  interface Window {
    gtag?: Gtag;
    ttq?: Ttq;
  }
}

function ga(event: string, params: Record<string, unknown>) {
  if (!hasConsent("analytics") || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

function tiktok(event: string, props: Record<string, unknown>, eventId?: string) {
  if (!hasConsent("marketing") || !window.ttq) return;
  window.ttq.track(event, props, eventId ? { event_id: eventId } : undefined);
}

export function track(event: FunnelEvent) {
  if (typeof window === "undefined") return;
  try {
    switch (event.name) {
      case "view_content":
        ga("view_item", { items: [{ item_id: event.contentId, item_category: event.exam ?? undefined }] });
        tiktok("ViewContent", { content_type: "product", contents: [{ content_id: event.contentId }] });
        break;
      case "demo_started":
        ga("demo_started", { exam: event.exam });
        tiktok("demo_started", { content_type: "product", contents: [{ content_id: `demo_${event.exam}` }] });
        break;
      case "demo_completed":
        ga("demo_completed", { exam: event.exam });
        tiktok("demo_completed", { content_type: "product", contents: [{ content_id: `demo_${event.exam}` }] });
        break;
      case "sign_up":
        ga("sign_up", { method: event.method });
        tiktok("CompleteRegistration", {});
        break;
      case "start_trial":
        ga("start_trial", { exam: event.exam ?? undefined });
        tiktok("StartTrial", { content_type: "product", contents: [{ content_id: "free_24h" }] }, event.eventId);
        break;
      case "begin_checkout":
        ga("begin_checkout", { currency: "RON", value: event.value, items: [{ item_id: event.productCode, price: event.value }] });
        tiktok(
          "InitiateCheckout",
          { currency: "RON", value: event.value, content_type: "product", contents: [{ content_id: event.productCode, price: event.value, quantity: 1 }] },
          event.eventId,
        );
        break;
      case "purchase":
        if (!(event.value > 0)) return;
        ga("purchase", {
          transaction_id: event.eventId,
          currency: "RON",
          value: event.value,
          items: [{ item_id: event.productCode, price: event.value, quantity: 1 }],
        });
        tiktok(
          "Purchase",
          { currency: "RON", value: event.value, content_type: "product", contents: [{ content_id: event.productCode, price: event.value, quantity: 1 }] },
          event.eventId,
        );
        break;
    }
  } catch {
    /* tracking-ul nu are voie sa strice pagina */
  }
}

type PurchasePayload = { event_id: string; product_code: string; value: number; currency: string } | null | undefined;

/**
 * Purchase se raporteaza doar dupa ce SERVERUL confirma plata (raspunsul confirm-payment cu status paid).
 * Cheia locala impiedica re-trimiterea la refresh; event_id-ul identic cu cel de pe server acopera restul.
 */
export function trackConfirmedPurchase(purchase: PurchasePayload) {
  if (!purchase?.event_id) return;
  const key = `zli_tracked_${purchase.event_id}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    /* fara storage: deduplicarea ramane pe event_id */
  }
  track({ name: "purchase", eventId: purchase.event_id, productCode: purchase.product_code, value: purchase.value });
}
