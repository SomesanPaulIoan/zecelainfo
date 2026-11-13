import type { BacExamEvaluationResult, BacExamEvaluatorContext, BacExamExerciseType } from "../types";
import { evaluateCodeFull } from "./code-full.evaluator";
import { evaluateCodeWithExplanation } from "./code-with-explanation.evaluator";
import { evaluateCppStruct } from "./cpp-struct.evaluator";
import { evaluateDataSets } from "./data-sets.evaluator";
import { evaluateFlexibleAnswer } from "./flexible-answer.evaluator";
import { evaluateGridMcq } from "./grid-mcq.evaluator";
import { evaluateOutputDisplay } from "./output-display.evaluator";
import { evaluatePseudocodeComposite } from "./pseudocode-composite.evaluator";
import { evaluatePseudocodeModify } from "./pseudocode-modify.evaluator";
import { evaluateNotImplemented } from "./stub.evaluator";

type EvaluatorFn = (ctx: BacExamEvaluatorContext) => BacExamEvaluationResult | Promise<BacExamEvaluationResult>;

const registry: Record<BacExamExerciseType, EvaluatorFn> = {
  grid_mcq: evaluateGridMcq,
  output_display: evaluateOutputDisplay,
  code_full: evaluateCodeFull,
  code_function: evaluateCodeFull,
  code_fill: evaluateCodeFull,
  data_sets: evaluateDataSets,
  pseudocode_modify: evaluatePseudocodeModify,
  pseudocode_composite: evaluatePseudocodeComposite,
  cpp_struct: evaluateCppStruct,
  flexible_answer: evaluateFlexibleAnswer,
  code_with_explanation: evaluateCodeWithExplanation,
};

export async function evaluateExercise(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const evaluator = registry[ctx.exercise.exercise_type] ?? evaluateNotImplemented;
  return evaluator(ctx);
}

export { registry as bacExamEvaluatorRegistry };
