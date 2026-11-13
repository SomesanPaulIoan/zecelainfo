/**
 * Scales a set of raw (relative) test weights onto a fixed-total scale (100 by default)
 * so the returned values always sum to exactly `total`, using the largest-remainder
 * method to distribute rounding leftovers. Values are rounded to 2 decimals.
 *
 * Example: 8 equal-weight tests -> [12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5, 12.5]
 */
export function normalizePoints(rawWeights: number[], total = 100): number[] {
  const n = rawWeights.length;
  if (n === 0) return [];

  const sum = rawWeights.reduce((acc, w) => acc + Math.max(0, Number(w) || 0), 0);
  if (sum <= 0) return rawWeights.map(() => 0);

  const totalCents = Math.round(total * 100);
  const exactCents = rawWeights.map((w) => (Math.max(0, Number(w) || 0) / sum) * totalCents);
  const flooredCents = exactCents.map((v) => Math.floor(v));
  let remainder = totalCents - flooredCents.reduce((acc, v) => acc + v, 0);

  const byRemainingFraction = exactCents
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const resultCents = [...flooredCents];
  for (let k = 0; k < byRemainingFraction.length && remainder > 0; k += 1, remainder -= 1) {
    resultCents[byRemainingFraction[k].i] += 1;
  }

  return resultCents.map((c) => c / 100);
}
