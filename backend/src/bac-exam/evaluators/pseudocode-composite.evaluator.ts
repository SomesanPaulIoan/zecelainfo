import { checkBlocklyStructure, checkCppPatterns } from "../blockly-check";
import { runInlineTestsOnCode, runTestsOnCode } from "../code-runner";
import { compareOutputsExact } from "../normalize";
import { runCodeLocally } from "../../services/local-run.service";
import type { BacExamBreakdownItem, BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

type PartAConfig = { expected_output?: string; points?: number };
type PartBConfig = {
  reference_code?: string;
  target_output?: string;
  required_sets?: number;
  points?: number;
  require_distinct?: boolean;
};
type PartCConfig = { points?: number; wrapper_template?: string };
type PartDConfig = {
  initial_blockly_xml?: string;
  points?: number;
  required_block_types?: string[];
  forbidden_block_types?: string[];
  required_cpp_regex?: string[];
  forbidden_cpp_regex?: string[];
  forbid_old_structure?: boolean;
  grading_weights?: { structure?: number; tests?: number };
};
type InlineTest = {
  input_data?: string;
  expected_output?: string;
  time_limit_ms?: number;
  memory_limit_mb?: number;
  output_type?: "stdout" | "file" | "both";
  input_source?: "stdin" | "file";
  input_filename?: string | null;
  output_filename?: string | null;
};

function partConfig<T>(raw: unknown): T {
  return (raw ?? {}) as T;
}

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

function pointsPerSet(totalPoints: number, requiredSets: number): number {
  return requiredSets > 0 ? Number((totalPoints / requiredSets).toFixed(2)) : 0;
}

export async function evaluatePseudocodeComposite(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const cfg = ctx.exercise.config;
  const partA = partConfig<PartAConfig>(cfg.part_a);
  const partB = partConfig<PartBConfig>(cfg.part_b);
  const partC = partConfig<PartCConfig>(cfg.part_c);
  const partD = partConfig<PartDConfig>(cfg.part_d);
  const partDTests = Array.isArray(cfg.part_d_tests) ? (cfg.part_d_tests as InlineTest[]) : [];

  const maxPoints = Number(ctx.exercise.max_points || 0);
  const breakdown: BacExamBreakdownItem[] = [];
  let awarded = 0;

  const answerRoot = ctx.answer ?? {};
  const answerA = partConfig<{ text?: string }>(answerRoot.part_a);
  const answerB = partConfig<{ sets?: unknown[] }>(answerRoot.part_b);
  const answerC = partConfig<{ code?: string }>(answerRoot.part_c);
  const answerD = partConfig<{ blocklyXml?: string; generatedCpp?: string }>(answerRoot.part_d);

  // ─── a) Ce se afiseaza — tot sau nimic ───────────────────────────────────
  const aMax = Number(partA.points ?? 4);
  const expectedA = String(partA.expected_output ?? "");
  const studentA = String(answerA.text ?? "");
  const aOk = expectedA.length > 0 && compareOutputsExact(studentA, expectedA);
  const aScore = aOk ? aMax : 0;
  breakdown.push({
    key: "part_a",
    label: "a) Ce se afiseaza",
    awarded: aScore,
    max: aMax,
    detail: aOk ? "Corect." : `Asteptat: ${expectedA || "—"}`,
  });
  awarded += aScore;

  // ─── b) Seturi de date — proportional ─────────────────────────────────────
  const bMax = Number(partB.points ?? 6);
  const requiredSets = Math.max(1, Math.min(3, Number(partB.required_sets ?? 2)));
  const perSet = pointsPerSet(bMax, requiredSets);
  const referenceCode = String(partB.reference_code ?? "");
  const targetB = String(partB.target_output ?? "");
  const rawSets = Array.isArray(answerB.sets) ? answerB.sets.map(String) : [];
  const sets = partB.require_distinct !== false ? dedupeSets(rawSets) : rawSets.map(normalizeInputSet).filter(Boolean);

  let validSets = 0;
  if (referenceCode.trim() && targetB.length > 0 && sets.length > 0) {
    for (let i = 0; i < Math.min(sets.length, requiredSets); i += 1) {
      const execution = await runCodeLocally({
        language: "cpp",
        code: referenceCode,
        input: sets[i],
        timeLimitMs: Number(cfg.part_b_time_limit_ms ?? 2000),
        io: { input_source: "stdin", output_target: "stdout" },
      });
      if (execution.verdict === "AC" && compareOutputsExact(execution.stdout, targetB)) {
        validSets += 1;
      }
    }
  }
  const bScore = Number((validSets * perSet).toFixed(2));
  breakdown.push({
    key: "part_b",
    label: "b) Seturi de date",
    awarded: bScore,
    max: bMax,
    detail: `${validSets}/${requiredSets} seturi valide (${perSet}p/set)`,
  });
  awarded += bScore;

  // ─── c) Program C++ — teste ───────────────────────────────────────────────
  const cMax = Number(partC.points ?? 6);
  const studentCode = String(answerC.code ?? "");
  let testResults: BacExamEvaluationResult["test_results"];

  if (!studentCode.trim()) {
    breakdown.push({ key: "part_c", label: "c) Program C/C++", awarded: 0, max: cMax, detail: "Cod lipsa." });
  } else if (ctx.tests.length === 0) {
    breakdown.push({ key: "part_c", label: "c) Program C/C++", awarded: 0, max: cMax, detail: "Fara teste configurate." });
  } else {
    const outcomes = await runTestsOnCode({
      code: studentCode,
      tests: ctx.tests,
      wrapperTemplate: partC.wrapper_template ?? null,
      submissionId: ctx.submissionId,
      exerciseId: ctx.exercise.id,
    });
    const passed = outcomes.filter((t) => t.verdict === "AC").length;
    const ratio = outcomes.length > 0 ? passed / outcomes.length : 0;
    const cScore = Number((cMax * ratio).toFixed(2));
    breakdown.push({
      key: "part_c",
      label: "c) Program C/C++",
      awarded: cScore,
      max: cMax,
      detail: `${passed}/${outcomes.length} teste`,
    });
    awarded += cScore;
    testResults = outcomes.map((t) => ({
      test_id: t.test_id,
      label: t.label,
      verdict: t.verdict,
      points: t.points,
      max_points: t.max_points,
      time_ms: t.time_ms,
      stdout: t.is_visible ? t.stdout : undefined,
      stderr: t.is_visible ? t.stderr : undefined,
      expected_output: t.is_visible ? t.expected_output : undefined,
      is_visible: t.is_visible,
    }));
  }

  // ─── d) Modifica pseudocod — Blockly → C++ + teste ────────────────────────
  const dMax = Number(partD.points ?? 4);
  const generatedCpp = String(answerD.generatedCpp ?? "");
  const blocklyXml = String(answerD.blocklyXml ?? "");
  const structureWeight = Number(partD.grading_weights?.structure ?? 1);
  const testsWeight = Number(partD.grading_weights?.tests ?? 3);
  const weightSum = structureWeight + testsWeight;

  let dScore = 0;
  if (!blocklyXml.trim() && !generatedCpp.trim()) {
    breakdown.push({ key: "part_d", label: "d) Modifica pseudocodul", awarded: 0, max: dMax, detail: "Raspuns lipsa." });
  } else {
    const structureMax = Number(((dMax * structureWeight) / weightSum).toFixed(2));
    const testsMax = Number((dMax - structureMax).toFixed(2));

    const blockCheck = checkBlocklyStructure({
      blocklyXml,
      requiredBlockTypes: partD.required_block_types ?? [],
      forbiddenBlockTypes: partD.forbidden_block_types ?? [],
    });
    const cppCheck = checkCppPatterns(
      generatedCpp,
      partD.required_cpp_regex ?? [],
      partD.forbid_old_structure ? (partD.forbidden_cpp_regex ?? []) : [],
    );
    const structureOk =
      (partD.required_block_types?.length ? blockCheck.ok : true) &&
      (partD.required_cpp_regex?.length ? cppCheck.ok : true) &&
      (!partD.forbid_old_structure || !partD.forbidden_cpp_regex?.length || cppCheck.forbiddenMatches.length === 0);

    const structureScore = structureOk ? structureMax : blocklyXml.trim() ? Number((structureMax * 0.5).toFixed(2)) : 0;

    let testsScore = 0;
    let dDetail = structureOk ? "Structura OK." : "Structura incompleta.";
    if (generatedCpp.trim() && partDTests.length > 0) {
      const dOutcomes = await runInlineTestsOnCode({
        code: generatedCpp,
        tests: partDTests,
        submissionId: ctx.submissionId,
        exerciseId: ctx.exercise.id,
        labelPrefix: "d",
      });
      const passed = dOutcomes.filter((t) => t.verdict === "AC").length;
      testsScore = Number((testsMax * (passed / dOutcomes.length)).toFixed(2));
      dDetail = `${dDetail} Teste: ${passed}/${dOutcomes.length}.`;
    } else if (partDTests.length === 0) {
      testsScore = generatedCpp.trim() ? testsMax : 0;
      dDetail = `${dDetail} Fara teste D — punctaj pe compilare.`;
    }

    dScore = Number((structureScore + testsScore).toFixed(2));
    breakdown.push({
      key: "part_d",
      label: "d) Modifica pseudocodul",
      awarded: dScore,
      max: dMax,
      detail: dDetail,
    });
    awarded += dScore;
  }

  awarded = Number(awarded.toFixed(2));
  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown,
    feedback:
      awarded >= maxPoints
        ? ctx.exercise.default_feedback ?? "Toate subpunctele corecte."
        : `Total ${awarded}/${maxPoints}p pe subpunctele a–d.`,
    test_results: testResults,
  };
}
