"use client";

import { useState } from "react";

type ContentFeedbackStarsProps = {
  value: number | null;
  saving?: boolean;
  disabled?: boolean;
  onRate: (value: number) => void;
};

export function ContentFeedbackStars({ value, saving = false, disabled = false, onRate }: ContentFeedbackStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
      <p className="text-sm font-medium text-slate-800">Cat de utila ti-a fost aceasta explicatie?</p>
      <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHoverValue(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = displayValue >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRate(star)}
              onMouseEnter={() => setHoverValue(star)}
              disabled={disabled || saving}
              aria-label={`Acorda ${star} stele`}
              className={`text-2xl leading-none transition-colors ${
                active ? "text-amber-400" : "text-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {saving ? "Se salveaza votul..." : value ? `Ai votat: ${value} din 5 stele.` : "Alege intre 1 si 5 stele."}
      </p>
    </div>
  );
}
