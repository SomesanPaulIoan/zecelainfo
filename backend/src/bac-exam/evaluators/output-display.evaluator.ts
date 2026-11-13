import { compareOutputsExact, scoreOutputByPositions } from "../normalize";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

export function evaluateOutputDisplay(ctx: BacExamEvaluatorContext): BacExamEvaluationResult {
  const expected = String(ctx.exercise.config.expected_output ?? "");
  const student = String(ctx.answer.text ?? "");
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const partialMode = Boolean(ctx.exercise.config.partial_by_positions ?? ctx.exercise.grading_rules.partial_by_positions);

  if (partialMode) {
    const { awarded, max } = scoreOutputByPositions(student, expected);
    const ratio = max > 0 ? awarded / max : 0;
    const points = Number((maxPoints * ratio).toFixed(2));
    return {
      awarded_points: points,
      max_points: maxPoints,
      breakdown: [
        {
          key: "positions",
          label: "Pozitii corecte",
          awarded: points,
          max: maxPoints,
          detail: `${awarded}/${max} pozitii corecte.`,
        },
      ],
      feedback:
        points >= maxPoints
          ? ctx.exercise.default_feedback ?? "Corect!"
          : `Partial: ${awarded}/${max} pozitii. Asteptat: ${expected}`,
    };
  }

  const isCorrect = compareOutputsExact(student, expected);
  const awarded = isCorrect ? maxPoints : 0;
  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown: [
      {
        key: "exact",
        label: "Raspuns exact",
        awarded,
        max: maxPoints,
      },
    ],
    feedback: isCorrect ? ctx.exercise.default_feedback ?? "Corect!" : `Gresit. Asteptat: ${expected}`,
  };
}
