"use client";

import { useEffect, useState } from "react";
import { PACHET_PRICING_ANCHOR, PACHET_TRIAL_ANCHOR } from "@/lib/pachete";

/**
 * Bara discreta de pe mobil: apare dupa ce elevul a trecut de hero si dispare cand sectiunea de preturi
 * sau zona de test gratuit e pe ecran (nu acopera butoanele de cumparare).
 */
export function PachetStickyCta() {
  const [scrolled, setScrolled] = useState(false);
  const [pricingVisible, setPricingVisible] = useState(false);

  useEffect(() => {
    // Ascunsa si la finalul paginii, ca sa nu acopere subsolul.
    const onScroll = () =>
      setScrolled(
        window.scrollY > 600 && window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 500,
      );
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const targets = [PACHET_PRICING_ANCHOR, PACHET_TRIAL_ANCHOR]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setPricingVisible(visible.size > 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  if (!scrolled || pricingVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2 shadow-[0_-8px_30px_-18px_rgba(2,132,199,0.5)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <a
          href={`#${PACHET_PRICING_ANCHOR}`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-sky-700 px-3 text-sm font-extrabold text-white"
        >
          Vezi prețurile
        </a>
        <a
          href={`#${PACHET_TRIAL_ANCHOR}`}
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-50 px-3 text-sm font-extrabold text-slate-900"
        >
          24h gratuit
        </a>
      </div>
    </div>
  );
}
