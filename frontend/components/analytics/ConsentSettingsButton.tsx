"use client";

import { openConsentSettings } from "@/lib/consent";

export function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Setări cookies
    </button>
  );
}
