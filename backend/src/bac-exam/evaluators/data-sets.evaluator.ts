import { compareOutputsExact } from "../normalize";
import { runCodeLocally } from "../../services/local-run.service";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

function normalizeInputSet(raw: string): string {
  return raw.replace(/\r\n/g, "\n").trim();
}

function dedupeSets(sets: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sets) {
    const key = normalizeInputSet(s);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export async function evaluateDataSets(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const referenceCode = String(ctx.exercise.config.reference_code ?? "");
  const targetOutput = String(ctx.exercise.config.target_output ?? "");
  const requiredSets = Math.max(1, Number(ctx.exercise.config.required_sets ?? 2));
  const requireDistinct = Boolean(ctx.exercise.config.require_distinct ?? true);
  const timeLimitMs = Number(ctx.exercise.config.time_limit_ms ?? 2000);

  const rawSets = Array.isArray(ctx.answer.sets)
    ? (ctx.answer.sets as unknown[]).map(String)
    : String(ctx.answer.text ?? "")
        .split("\n---\n")
        .map((s) => s.trim())
        .filter(Boolean);

  const sets = requireDistinct ? dedupeSets(rawSets) : rawSets.map(normalizeInputSet).filter(Boolean);

  if (!referenceCode.trim()) {
    return {
      awarded_points: 0,
      max_points: maxPoints,
      breakdown: [{ key: "config", label: "Configurare", awarded: 0, max: maxPoints, detail: "Lipseste reference_code in admin." }],
      feedback: "Exercitiul nu este configurat (cod referinta lipsa).",
    };
  }

  if (sets.length === 0) {
    return {
      awarded_points: 0,
      max_points: maxPoints,
      breakdown: [{ key: "sets", label: "Seturi de date", awarded: 0, max: maxPoints }],
      feedback: "Nu ai trimis seturi de date.",
    };
  }

  const pointsPerSet = maxPoints / requiredSets;
  let validCount = 0;
  const details: string[] = [];

  for (let i = 0; i < Math.min(sets.length, requiredSets); i += 1) {
    const input = sets[i];
    const execution = await runCodeLocally({
      language: "cpp",
      code: referenceCode,
      input,
      timeLimitMs,
      io: { input_source: "stdin", output_target: "stdout" },
    });

    const ok =
      execution.verdict === "AC" &&
      (targetOutput ? compareOutputsExact(execution.stdout, targetOutput) : true);

    if (ok) validCount += 1;
    details.push(`Set ${i + 1}: ${ok ? "valid" : execution.verdict}${targetOutput && !ok ? ` (output: ${execution.stdout.trim().slice(0, 40)})` : ""}`);
  }

  const awarded = Number((validCount * pointsPerSet).toFixed(2));

  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown: [
      {
        key: "sets",
        label: "Seturi valide",
        awarded,
        max: maxPoints,
        detail: `${validCount}/${requiredSets} seturi — ${details.join("; ")}`,
      },
    ],
    feedback:
      validCount >= requiredSets
        ? ctx.exercise.default_feedback ?? "Toate seturile cerute sunt valide."
        : `${validCount}/${requiredSets} seturi valide.`,
  };
}
