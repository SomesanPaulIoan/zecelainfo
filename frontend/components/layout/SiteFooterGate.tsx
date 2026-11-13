"use client";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { useIsFooterHidden } from "@/components/layout/ChromeContext";

export function SiteFooterGate() {
  const hidden = useIsFooterHidden();
  if (hidden) return null;
  return <SiteFooter />;
}
