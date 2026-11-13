import { runTestsOnCode } from "../code-runner";
import { evaluateExplanationWithOpenAI, loadExerciseOpenAIPrompt } from "../openai.service";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

export async function evaluateCodeWithExplanation(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const codeFraction = Number(ctx.exercise.config.code_points_fraction ?? 0.8);
  const codeMax = Number((maxPoints * codeFraction).toFixed(2));
  const explanationMax = Number((maxPoints - codeMax).toFixed(2));

  const code = String(ctx.answer.code ?? "");
  const explanation = String(ctx.answer.explanation ?? "");

  const breakdown: BacExamEvaluationResult["breakdown"] = [];
  let awarded = 0;

  // Code portion
  let testResults: BacExamEvaluationResult["test_results"];
  if (!code.trim()) {
    breakdown.push({ key: "code", label: "Cod", awarded: 0, max: codeMax, detail: "Cod lipsa." });
  } else if (ctx.tests.length === 0) {
    breakdown.push({ key: "code", label: "Cod", awarded: 0, max: codeMax, detail: "Fara teste configurate." });
  } else {
    const outcomes = await runTestsOnCode({
      code,
      tests: ctx.tests,
      wrapperTemplate: (ctx.exercise.config.wrapper_template as string) ?? null,
      submissionId: ctx.submissionId,
      exerciseId: ctx.exercise.id,
    });
    const passed = outcomes.filter((t) => t.verdict === "AC").length;
    const ratio = outcomes.length > 0 ? passed / outcomes.length : 0;
    const codeScore = Number((codeMax * ratio).toFixed(2));
    breakdown.push({
      key: "code",
      label: "Teste cod",
      awarded: codeScore,
      max: codeMax,
      detail: `${passed}/${outcomes.length} teste`,
    });
    awarded += codeScore;
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

  // Explanation portion via OpenAI
  let explanationFeedback = "";
  if (explanationMax > 0) {
    if (!explanation.trim()) {
      breakdown.push({ key: "explanation", label: "Explicatie", awarded: 0, max: explanationMax, detail: "Explicatie lipsa." });
    } else if (!ctx.submissionId) {
      breakdown.push({
        key: "explanation",
        label: "Explicatie",
        awarded: 0,
        max: explanationMax,
        detail: "Necesita submisie pentru evaluare AI.",
      });
    } else {
      try {
        const dbPrompt = await loadExerciseOpenAIPrompt(ctx.exercise.id, "explanation");
        const ai = await evaluateExplanationWithOpenAI({
          exerciseId: ctx.exercise.id,
          submissionId: ctx.submissionId,
          studentExplanation: explanation,
          studentCode: code,
          expectedComplexity: String(ctx.exercise.config.expected_complexity ?? ""),
          efficiencyFocus: (ctx.exercise.config.efficiency_focus as "time" | "memory" | "both") ?? "both",
          customSystemPrompt:
            dbPrompt?.system_prompt || (ctx.exercise.config.openai_system_prompt as string | undefined),
          customUserTemplate:
            dbPrompt?.user_prompt_template || (ctx.exercise.config.openai_user_template as string | undefined),
          promptId: dbPrompt?.id ?? null,
        });

        const algoPoint = explanationMax >= 2 ? explanationMax / 2 : explanationMax;
        const effPoint = explanationMax - algoPoint;
        const algoScore =
          ai.result.algorithm_description_points === 1 ? algoPoint : 0;
        const effScore = ai.result.efficiency_points === 1 ? effPoint : 0;
        const explScore = Number((algoScore + effScore).toFixed(2));

        breakdown.push({
          key: "explanation",
          label: "Explicatie (AI)",
          awarded: explScore,
          max: explanationMax,
          detail: ai.result.feedback,
        });
        awarded += explScore;
        explanationFeedback = ai.result.feedback;
      } catch (error) {
        breakdown.push({
          key: "explanation",
          label: "Explicatie (AI)",
          awarded: 0,
          max: explanationMax,
          detail: error instanceof Error ? error.message : "Eroare AI",
        });
      }
    }
  }

  awarded = Number(awarded.toFixed(2));
  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown,
    feedback:
      awarded >= maxPoints
        ? ctx.exercise.default_feedback ?? "Program si explicatie corecte."
        : explanationFeedback || `Ai obtinut ${awarded}/${maxPoints} puncte.`,
    test_results: testResults,
    needs_ai: explanationMax > 0,
  };
}
