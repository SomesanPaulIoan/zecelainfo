import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { resolveGradingWeights } from "../grading-weights";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

const execFileAsync = promisify(execFile);

type FieldSpec = { name: string; type: string };

function asFieldSpecs(raw: unknown): FieldSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const obj = item as Record<string, unknown>;
      return { name: String(obj.name ?? ""), type: String(obj.type ?? "") };
    })
    .filter((f) => f.name && f.type);
}

function buildStructWrapper(userCode: string, compileChecks: string[], template?: string | null): string {
  const checks = compileChecks.map((expr) => `  (void)(${expr});`).join("\n");
  const tpl = template?.trim();
  if (tpl?.includes("__USER_CODE__")) {
    return tpl.replace("__USER_CODE__", userCode).replace("// COMPILE_CHECKS", checks);
  }
  return `#include <iostream>
using namespace std;

${userCode}

int main() {
${checks || "  return 0;"}
  return 0;
}
`;
}

async function tryCompile(cpp: string): Promise<{ ok: boolean; stderr: string }> {
  const workDir = await mkdtemp(join(tmpdir(), "bac-struct-"));
  try {
    const bitsDir = join(workDir, "bits");
    await mkdir(bitsDir, { recursive: true });
    await writeFile(join(bitsDir, "stdc++.h"), "#pragma once\n#include <iostream>\n#include <string>\n#include <vector>\n", "utf8");
    const sourcePath = join(workDir, "main.cpp");
    await writeFile(sourcePath, cpp, "utf8");
    await execFileAsync("g++", ["-std=c++17", "-O2", "-I", workDir, sourcePath, "-o", join(workDir, "out")], {
      timeout: 10000,
    });
    return { ok: true, stderr: "" };
  } catch (error) {
    const stderr =
      error && typeof error === "object" && "stderr" in error ? String((error as { stderr: string }).stderr) : String(error);
    return { ok: false, stderr };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function scoreTextStructure(code: string, structName: string, fields: FieldSpec[]): number {
  let score = 0;
  const max = 4;
  if (/struct\s+\w+/i.test(code)) score += 1;
  if (structName && new RegExp(`struct\\s+${structName}\\b`).test(code)) score += 1;
  if (fields.length > 0) {
    const found = fields.filter((f) => new RegExp(`\\b${f.type}\\s+${f.name}\\b`).test(code)).length;
    score += Math.round((found / fields.length) * 2);
  }
  return Math.min(score, max) / max;
}

export async function evaluateCppStruct(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const studentCode = String(ctx.answer.code ?? ctx.answer.text ?? "");
  const structName = String(ctx.exercise.config.struct_name ?? "");
  const fields = asFieldSpecs(ctx.exercise.config.fields);
  const compileChecks = Array.isArray(ctx.exercise.config.compile_checks)
    ? (ctx.exercise.config.compile_checks as unknown[]).map(String).filter(Boolean)
    : [];
  const wrapperTemplate = (ctx.exercise.config.wrapper_template as string) ?? null;

  const weights = resolveGradingWeights(
    maxPoints,
    ["definition", "compile"],
    ctx.rules,
    (ctx.exercise.config.grading_weights as Record<string, number>) ?? ctx.exercise.grading_rules,
  );

  const breakdown: BacExamEvaluationResult["breakdown"] = [];
  let awarded = 0;

  if (!studentCode.trim()) {
    return {
      awarded_points: 0,
      max_points: maxPoints,
      breakdown: [{ key: "definition", label: "Definitie structura", awarded: 0, max: maxPoints }],
      feedback: "Nu ai trimis definitia structurii.",
    };
  }

  const defMax = weights.definition;
  const textRatio = scoreTextStructure(studentCode, structName, fields);
  const defScore = Number((defMax * textRatio).toFixed(2));
  breakdown.push({
    key: "definition",
    label: "Definitie structura",
    awarded: defScore,
    max: defMax,
    detail: `Detectare text: ${Math.round(textRatio * 100)}%`,
  });
  awarded += defScore;

  const compileMax = weights.compile;
  const fullCode = buildStructWrapper(studentCode, compileChecks, wrapperTemplate);
  const compiled = await tryCompile(fullCode);
  const compileScore = compiled.ok ? compileMax : 0;
  breakdown.push({
    key: "compile",
    label: "Compilare si acces campuri",
    awarded: compileScore,
    max: compileMax,
    detail: compiled.ok ? "Compileaza corect." : compiled.stderr.slice(0, 200),
  });
  awarded += compileScore;

  return {
    awarded_points: Number(awarded.toFixed(2)),
    max_points: maxPoints,
    breakdown,
    feedback:
      awarded >= maxPoints
        ? ctx.exercise.default_feedback ?? "Structura corecta."
        : compiled.ok
          ? "Structura partial corecta."
          : "Definitia nu compileaza sau accesul la campuri esueaza.",
  };
}
