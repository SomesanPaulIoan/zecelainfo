/** Normalization helpers for text-based answer comparison. */

export function normalizeTextOutput(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n")
    .trim();
}

export function splitOutputTokens(raw: string): string[] {
  const normalized = normalizeTextOutput(raw);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

export function compareOutputsExact(student: string, expected: string): boolean {
  return normalizeTextOutput(student) === normalizeTextOutput(expected);
}

/** Partial scoring when expected output has multiple whitespace-separated tokens/positions. */
export function scoreOutputByPositions(student: string, expected: string): { awarded: number; max: number } {
  const expectedTokens = splitOutputTokens(expected);
  if (expectedTokens.length === 0) {
    return { awarded: compareOutputsExact(student, expected) ? 1 : 0, max: 1 };
  }
  const studentTokens = splitOutputTokens(student);
  let matches = 0;
  for (let i = 0; i < expectedTokens.length; i += 1) {
    if (studentTokens[i] === expectedTokens[i]) matches += 1;
  }
  return { awarded: matches, max: expectedTokens.length };
}

export function normalizeMcqAnswer(raw: unknown): string {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  const match = value.match(/[a-d]/);
  return match?.[0] ?? "";
}
