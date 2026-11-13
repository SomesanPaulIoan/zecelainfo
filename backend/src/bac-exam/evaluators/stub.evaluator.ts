import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

/** Placeholder for exercise types not yet implemented — extend with real evaluator. */
export function evaluateNotImplemented(ctx: BacExamEvaluatorContext): BacExamEvaluationResult {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  return {
    awarded_points: 0,
    max_points: maxPoints,
    breakdown: [
      {
        key: "pending",
        label: "Evaluator in dezvoltare",
        awarded: 0,
        max: maxPoints,
        detail: `Tipul ${ctx.exercise.exercise_type} va fi implementat — configureaza testele/regulile in admin.`,
      },
    ],
    feedback: `Evaluatorul pentru tipul „${ctx.exercise.exercise_type}” nu este inca activ.`,
  };
}
