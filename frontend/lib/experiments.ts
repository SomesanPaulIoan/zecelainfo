import { hasConsent } from "@/lib/consent";

/**
 * A/B testing minimal. Reguli:
 * - un experiment are o varianta de control (prima) care se afiseaza ori de cate ori nu putem atribui stabil
 *   (experiment oprit, fara acord de statistica, fara storage);
 * - atribuirea e stabila per browser (localStorage) si se raporteaza in GA4 ca `experiment_exposure`;
 * - castigatorul NU se declara dupa cateva click-uri: vezi docs/marketing-tracking.md (marime minima de esantion).
 */
export const EXPERIMENTS = {
  home_hero_cta: {
    enabled: false,
    variants: ["Activează gratuit 24h", "Încearcă gratuit 24h"],
  },
} as const satisfies Record<string, { enabled: boolean; variants: readonly string[] }>;

export type ExperimentName = keyof typeof EXPERIMENTS;

export function getVariant<N extends ExperimentName>(name: N): (typeof EXPERIMENTS)[N]["variants"][number] {
  const experiment = EXPERIMENTS[name];
  const control = experiment.variants[0];
  if (!experiment.enabled || typeof window === "undefined" || !hasConsent("analytics")) return control;
  try {
    const key = `zli_exp_${name}`;
    let index = Number(window.localStorage.getItem(key));
    if (!Number.isInteger(index) || index < 0 || index >= experiment.variants.length || window.localStorage.getItem(key) === null) {
      index = Math.floor(Math.random() * experiment.variants.length);
      window.localStorage.setItem(key, String(index));
    }
    window.gtag?.("event", "experiment_exposure", { experiment: name, variant: index });
    return experiment.variants[index];
  } catch {
    return control;
  }
}
