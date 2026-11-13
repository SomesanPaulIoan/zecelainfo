import { normalizeTextOutput } from "../normalize";
import { mergeAnswerVariables, validateConstraints, type Constraint } from "../formula-validator";
import { evaluateFlexibleWithOpenAI } from "../openai.service";
import type { BacExamEvaluationResult, BacExamEvaluatorContext } from "../types";

function normalizeAnswerText(raw: string): string {
  return normalizeTextOutput(raw).toLowerCase();
}

function collectStudentAnswers(answer: Record<string, unknown>): string[] {
  if (Array.isArray(answer.answers)) {
    return (answer.answers as unknown[]).map(String).map((s) => s.trim()).filter(Boolean);
  }
  return String(answer.text ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchAccepted(student: string, accepted: string[], mode: string): boolean {
  const s = mode === "exact" ? student.trim() : normalizeAnswerText(student);
  return accepted.some((a) => {
    const ref = mode === "exact" ? a.trim() : normalizeAnswerText(a);
    if (mode === "contains") return s.includes(ref) || ref.includes(s);
    return s === ref;
  });
}

export async function evaluateFlexibleAnswer(ctx: BacExamEvaluatorContext): Promise<BacExamEvaluationResult> {
  const maxPoints = Number(ctx.exercise.max_points || 0);
  const validationType = String(ctx.exercise.config.validation_type ?? "list");
  const requiredCount = Math.max(1, Number(ctx.exercise.config.required_count ?? 1));
  const matchMode = String(ctx.exercise.config.match_mode ?? "normalized");
  const acceptedAnswers = Array.isArray(ctx.exercise.config.accepted_answers)
    ? (ctx.exercise.config.accepted_answers as unknown[]).map(String).filter(Boolean)
    : [];

  const studentAnswers = collectStudentAnswers(ctx.answer);

  if (studentAnswers.length === 0 && validationType !== "formula") {
    return {
      awarded_points: 0,
      max_points: maxPoints,
      breakdown: [{ key: "answers", label: "Raspunsuri", awarded: 0, max: maxPoints }],
      feedback: "Nu ai trimis raspuns.",
    };
  }

  if (validationType === "openai" || validationType === "openai_hybrid") {
    if (!ctx.submissionId) {
      return {
        awarded_points: 0,
        max_points: maxPoints,
        breakdown: [{ key: "ai", label: "Evaluare AI", awarded: 0, max: maxPoints }],
        feedback: "Evaluarea AI necesita o submisie salvata.",
        needs_ai: true,
      };
    }
    try {
      const { result, awardedRatio } = await evaluateFlexibleWithOpenAI({
        exerciseId: ctx.exercise.id,
        submissionId: ctx.submissionId,
        studentAnswers,
        acceptedAnswers,
        requiredCount,
        customSystemPrompt: ctx.exercise.config.openai_system_prompt as string | undefined,
        customUserTemplate: ctx.exercise.config.openai_user_template as string | undefined,
      });
      const awarded = Number((maxPoints * awardedRatio).toFixed(2));
      return {
        awarded_points: awarded,
        max_points: maxPoints,
        breakdown: [
          {
            key: "ai",
            label: "Evaluare semantica",
            awarded,
            max: maxPoints,
            detail: result.feedback,
          },
        ],
        feedback: result.feedback,
        needs_ai: true,
      };
    } catch (error) {
      return {
        awarded_points: 0,
        max_points: maxPoints,
        breakdown: [
          {
            key: "ai",
            label: "Evaluare AI",
            awarded: 0,
            max: maxPoints,
            detail: error instanceof Error ? error.message : "Eroare AI",
          },
        ],
        feedback: "Evaluarea AI a esuat.",
        needs_ai: true,
      };
    }
  }

  if (validationType === "formula") {
    const constraints = Array.isArray(ctx.exercise.config.constraints)
      ? (ctx.exercise.config.constraints as Constraint[])
      : [];
    const vars = mergeAnswerVariables(ctx.answer);
    const valid = constraints.length > 0 && validateConstraints(vars, constraints);
    const awarded = valid ? maxPoints : 0;
    return {
      awarded_points: awarded,
      max_points: maxPoints,
      breakdown: [
        {
          key: "formula",
          label: "Validator determinist",
          awarded,
          max: maxPoints,
          detail: valid ? "Constrangerile sunt satisfacute." : `Variabile: ${JSON.stringify(vars)}`,
        },
      ],
      feedback: valid ? ctx.exercise.default_feedback ?? "Raspuns corect." : "Raspunsul nu satisface constrangerile.",
    };
  }

  // Default: list matching
  const correct: string[] = [];
  const seen = new Set<string>();
  for (const ans of studentAnswers) {
    const key = normalizeAnswerText(ans);
    if (seen.has(key)) continue;
    if (matchAccepted(ans, acceptedAnswers, matchMode)) {
      correct.push(ans);
      seen.add(key);
    }
  }

  const validCount = Math.min(correct.length, requiredCount);
  const awarded = Number(((validCount / requiredCount) * maxPoints).toFixed(2));

  return {
    awarded_points: awarded,
    max_points: maxPoints,
    breakdown: [
      {
        key: "answers",
        label: "Raspunsuri corecte",
        awarded,
        max: maxPoints,
        detail: `${validCount}/${requiredCount} raspunsuri acceptate`,
      },
    ],
    feedback:
      validCount >= requiredCount
        ? ctx.exercise.default_feedback ?? "Raspuns corect."
        : `${validCount}/${requiredCount} raspunsuri corecte.`,
  };
}
