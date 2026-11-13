import { runTestsOnCode } from "../code-runner";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

export async function evaluateCodeFull(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const code = String(ctx.answer.code ?? "");
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const wrapper = (ctx.exercise.config.wrapper_template as string | undefined) ?? null;

  if (!code.trim()) {
    return {
      awarded_points: 0,
      max_points: maxPoints,
      breakdown: [{ key: "code", label: "Cod", awarded: 0, max: maxPoints }],
      feedback: "Nu ai trimis cod.",
      test_results: [],
    };
  }

  const outcomes = await runTestsOnCode({
    code,
    tests: ctx.tests,
    wrapperTemplate: wrapper,
    submissionId: ctx.submissionId,
    exerciseId: ctx.exercise.id,
  });

  const totalTestPoints = outcomes.reduce((sum, t) => sum + t.max_points, 0);
  const earnedTestPoints = outcomes.reduce((sum, t) => sum + t.points, 0);
  const ratio = totalTestPoints > 0 ? earnedTestPoints / totalTestPoints : outcomes.every((t) => t.verdict === "AC") ? 1 : 0;
  const awarded = Number((maxPoints * ratio).toFixed(2));

  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown: [
      {
        key: "tests",
        label: "Teste trecute",
        awarded,
        max: maxPoints,
        detail: `${outcomes.filter((t) => t.verdict === "AC").length}/${outcomes.length} teste`,
      },
    ],
    feedback:
      awarded >= maxPoints
        ? ctx.exercise.default_feedback ?? "Toate testele au trecut."
        : `Ai trecut ${outcomes.filter((t) => t.verdict === "AC").length}/${outcomes.length} teste.`,
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
