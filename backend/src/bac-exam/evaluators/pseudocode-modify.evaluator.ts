import { checkBlocklyStructure, checkCppPatterns } from "../blockly-check";
import { runTestsOnCode } from "../code-runner";
import { resolveGradingWeights } from "../grading-weights";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

export async function evaluatePseudocodeModify(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const generatedCpp = String(ctx.answer.generatedCpp ?? "");
  const blocklyXml = String(ctx.answer.blocklyXml ?? "");

  const requiredBlocks = asStringArray(ctx.exercise.config.required_block_types);
  const forbiddenBlocks = asStringArray(ctx.exercise.config.forbidden_block_types);
  const requiredCppRegex = asStringArray(ctx.exercise.config.required_cpp_regex);
  const forbiddenCppRegex = asStringArray(ctx.exercise.config.forbidden_cpp_regex);
  const forbidOldStructure = Boolean(ctx.exercise.config.forbid_old_structure ?? false);

  const weights = resolveGradingWeights(
    maxPoints,
    ["structure", "tests"],
    ctx.rules,
    (ctx.exercise.config.grading_weights as Record<string, number>) ?? ctx.exercise.grading_rules,
  );

  const breakdown: BacExamEvaluationResult["breakdown"] = [];
  let awarded = 0;

  // Structure: Blockly blocks + optional C++ regex
  let structureScore = 0;
  const structureMax = weights.structure;
  if (structureMax > 0) {
    const blockCheck = checkBlocklyStructure({
      blocklyXml,
      requiredBlockTypes: requiredBlocks,
      forbiddenBlockTypes: forbiddenBlocks,
    });
    const cppCheck = checkCppPatterns(generatedCpp, requiredCppRegex, forbidOldStructure ? forbiddenCppRegex : []);

    const blockOk = requiredBlocks.length === 0 || blockCheck.ok;
    const cppOk = requiredCppRegex.length === 0 || cppCheck.ok;
    const noForbiddenCpp = !forbidOldStructure || forbiddenCppRegex.length === 0 || cppCheck.forbiddenMatches.length === 0;

    if (blockOk && cppOk && noForbiddenCpp) {
      structureScore = structureMax;
    } else if (requiredBlocks.length > 0 || requiredCppRegex.length > 0) {
      const blockRatio =
        requiredBlocks.length > 0
          ? (requiredBlocks.length - blockCheck.missing.length) / requiredBlocks.length
          : 1;
      const cppRatio =
        requiredCppRegex.length > 0
          ? (requiredCppRegex.length - cppCheck.missingPatterns.length) / requiredCppRegex.length
          : 1;
      structureScore = Number((structureMax * Math.min(blockRatio, cppRatio)).toFixed(2));
      if (!noForbiddenCpp) structureScore = 0;
    } else {
      structureScore = blocklyXml.trim() ? structureMax : 0;
    }

    breakdown.push({
      key: "structure",
      label: "Structura pseudocod",
      awarded: structureScore,
      max: structureMax,
      detail: blockCheck.missing.length
        ? `Lipsesc blocuri: ${blockCheck.missing.join(", ")}`
        : blockCheck.forbiddenFound.length
          ? `Blocuri interzise: ${blockCheck.forbiddenFound.join(", ")}`
          : "Structura acceptata.",
    });
    awarded += structureScore;
  }

  // Tests on generated C++
  let testsScore = 0;
  const testsMax = weights.tests;
  if (testsMax > 0) {
    if (!generatedCpp.trim()) {
      breakdown.push({ key: "tests", label: "Teste echivalenta", awarded: 0, max: testsMax, detail: "C++ generat gol." });
    } else if (ctx.tests.length === 0) {
      testsScore = testsMax;
      breakdown.push({ key: "tests", label: "Teste echivalenta", awarded: testsMax, max: testsMax, detail: "Fara teste configurate." });
      awarded += testsScore;
    } else {
      const outcomes = await runTestsOnCode({
        code: generatedCpp,
        tests: ctx.tests,
        wrapperTemplate: (ctx.exercise.config.wrapper_template as string) ?? null,
        submissionId: ctx.submissionId,
        exerciseId: ctx.exercise.id,
      });
      const passed = outcomes.filter((t) => t.verdict === "AC").length;
      const ratio = outcomes.length > 0 ? passed / outcomes.length : 0;
      testsScore = Number((testsMax * ratio).toFixed(2));
      breakdown.push({
        key: "tests",
        label: "Teste echivalenta",
        awarded: testsScore,
        max: testsMax,
        detail: `${passed}/${outcomes.length} teste trecute`,
      });
      awarded += testsScore;

      return {
        awarded_points: Number(awarded.toFixed(2)),
        max_points: maxPoints,
        breakdown,
        feedback:
          awarded >= maxPoints
            ? ctx.exercise.default_feedback ?? "Pseudocod corect."
            : `Structura: ${structureScore}/${structureMax}p, teste: ${passed}/${outcomes.length}.`,
        test_results: outcomes.map((t) => ({
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
        })),
      };
    }
  }

  awarded = Number(awarded.toFixed(2));
  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown,
    feedback:
      awarded >= maxPoints
        ? ctx.exercise.default_feedback ?? "Pseudocod corect."
        : `Ai obtinut ${awarded}/${maxPoints} puncte.`,
  };
}
