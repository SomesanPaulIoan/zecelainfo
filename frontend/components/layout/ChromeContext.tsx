"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ChromeContext = createContext<{
  footerHiddenCount: number;
  setFooterHiddenCount: React.Dispatch<React.SetStateAction<number>>;
} | null>(null);

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [footerHiddenCount, setFooterHiddenCount] = useState(0);
  const value = useMemo(() => ({ footerHiddenCount, setFooterHiddenCount }), [footerHiddenCount]);
  return <ChromeContext.Provider value={value}>{children}</ChromeContext.Provider>;
}

export function useIsFooterHidden() {
  const ctx = useContext(ChromeContext);
  return (ctx?.footerHiddenCount ?? 0) > 0;
}

/** Ascunde footer-ul global cat timp componenta apelanta e montata (ex: workspace-uri full-screen). */
export function useHideSiteFooter() {
  const ctx = useContext(ChromeContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setFooterHiddenCount((count) => count + 1);
    return () => ctx.setFooterHiddenCount((count) => count - 1);
  }, [ctx]);
}
