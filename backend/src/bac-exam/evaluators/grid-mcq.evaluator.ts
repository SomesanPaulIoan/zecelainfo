import { normalizeMcqAnswer } from "../normalize";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

export function evaluateGridMcq(ctx: BacExamEvaluatorContext): BacExamEvaluationResult {
  const correct = normalizeMcqAnswer(ctx.exercise.config.correct_answer);
  const student = normalizeMcqAnswer(ctx.answer.selected);
  const maxPoints = Number(ctx.exercise.max_points || 0);

  const isCorrect = correct.length > 0 && student === correct;
  const awarded = isCorrect ? maxPoints : 0;

  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown: [
      {
        key: "selection",
        label: "Raspuns grila",
        awarded,
        max: maxPoints,
        detail: isCorrect ? "Raspuns corect." : `Ai ales ${student || "—"}, corect: ${correct || "—"}.`,
      },
    ],
    feedback: isCorrect
      ? ctx.exercise.default_feedback ?? "Corect!"
      : `Raspuns gresit. Varianta corecta: ${correct.toUpperCase()}.`,
  };
}
