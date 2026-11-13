import type { BacExamGradingRuleRow } from "./types";

/** Resolve point weights from DB rules, config.grading_weights, or equal split fallback. */
export function resolveGradingWeights(
  maxPoints: number,
  keys: string[],
  rules: BacExamGradingRuleRow[],
  configWeights?: Record<string, number> | null,
): Record<string, number> {
  const fromRules = Object.fromEntries(
    rules.filter((r) => keys.includes(r.rule_key)).map((r) => [r.rule_key, Number(r.points || 0)]),
  );
  if (keys.every((k) => fromRules[k] > 0)) {
    return fromRules;
  }

  const fromConfig = configWeights ?? {};
  const configSum = keys.reduce((sum, k) => sum + Number(fromConfig[k] || 0), 0);
  if (configSum > 0) {
    const scale = maxPoints / configSum;
    return Object.fromEntries(keys.map((k) => [k, Number((Number(fromConfig[k] || 0) * scale).toFixed(2))]));
  }

  const each = keys.length > 0 ? Number((maxPoints / keys.length).toFixed(2)) : 0;
  return Object.fromEntries(keys.map((k) => [k, each]));
}
