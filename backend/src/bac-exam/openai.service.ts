import { pgPool } from "../db/postgres";

const DEFAULT_EXPLANATION_SYSTEM = `Esti un corector de Bacalaureat la Informatica.
Evaluezi explicatia elevului despre algoritm si eficienta.
Raspunde EXCLUSIV cu JSON valid, fara text in afara JSON.
Format:
{
  "algorithm_description_points": 0 sau 1,
  "efficiency_points": 0 sau 1,
  "feedback": "explicatie scurta pentru elev",
  "flags": []
}`;

export type ExplanationEvalResult = {
  algorithm_description_points: 0 | 1;
  efficiency_points: 0 | 1;
  feedback: string;
  flags: string[];
};

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Raspuns OpenAI invalid (nu e JSON).");
  }
}

function parseExplanationResult(raw: unknown): ExplanationEvalResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const algo = Number(data.algorithm_description_points) === 1 ? 1 : 0;
  const eff = Number(data.efficiency_points) === 1 ? 1 : 0;
  return {
    algorithm_description_points: algo,
    efficiency_points: eff,
    feedback: String(data.feedback ?? "").trim(),
    flags: Array.isArray(data.flags) ? data.flags.map((f) => String(f)) : [],
  };
}

async function callOpenAIChat(system: string, user: string, model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY lipseste din configurare.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text.slice(0, 400)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI a returnat raspuns gol.");
  }
  return content;
}

export async function evaluateExplanationWithOpenAI(params: {
  exerciseId: string;
  submissionId: string;
  studentExplanation: string;
  studentCode: string;
  expectedComplexity?: string;
  efficiencyFocus?: "time" | "memory" | "both";
  customSystemPrompt?: string;
  customUserTemplate?: string;
  promptId?: string | null;
}): Promise<{ result: ExplanationEvalResult; raw: string; model: string; promptSnapshot: string }> {
  const model = process.env.OPENAI_BAC_MODEL ?? process.env.OPENAI_GRILE_MODEL ?? "gpt-4.1-mini";
  const system = params.customSystemPrompt?.trim() || DEFAULT_EXPLANATION_SYSTEM;
  const userTemplate =
    params.customUserTemplate?.trim() ||
    `Explicatia elevului:
{{explanation}}

Codul elevului:
{{code}}

Complexitate asteptata: {{complexity}}
Ce trebuie justificat: {{efficiency_focus}}

Evalueaza conform instructiunilor.`;

  const user = userTemplate
    .replaceAll("{{explanation}}", params.studentExplanation)
    .replaceAll("{{code}}", params.studentCode)
    .replaceAll("{{complexity}}", params.expectedComplexity ?? "nespecificata")
    .replaceAll("{{efficiency_focus}}", params.efficiencyFocus ?? "both");

  const promptSnapshot = JSON.stringify({ system, user });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await callOpenAIChat(system, user, model);
      const parsed = parseExplanationResult(extractJsonObject(raw));

      await pgPool.query(
        `INSERT INTO bac_exam_ai_evaluations
           (submission_id, exercise_id, prompt_id, prompt_snapshot, model, raw_response, parsed_result, awarded_points)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [
          params.submissionId,
          params.exerciseId,
          params.promptId ?? null,
          promptSnapshot,
          model,
          raw,
          JSON.stringify(parsed),
          parsed.algorithm_description_points + parsed.efficiency_points,
        ],
      );

      return { result: parsed, raw, model, promptSnapshot };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Evaluare OpenAI esuata.");
}

const DEFAULT_FLEXIBLE_SYSTEM = `Esti un corector de Bacalaureat la Informatica.
Evaluezi daca raspunsurile elevului sunt corecte semantic, chiar daca formularea difera.
Raspunde EXCLUSIV cu JSON valid:
{
  "correct_count": numar intreg,
  "required_count": numar intreg,
  "is_accepted": true sau false,
  "feedback": "explicatie scurta"
}`;

export type FlexibleEvalResult = {
  correct_count: number;
  required_count: number;
  is_accepted: boolean;
  feedback: string;
};

export async function loadExerciseOpenAIPrompt(
  exerciseId: string,
  promptKey = "default",
): Promise<{ id: string; system_prompt: string; user_prompt_template: string; model: string | null } | null> {
  const result = await pgPool.query<{
    id: string;
    system_prompt: string;
    user_prompt_template: string;
    model: string | null;
  }>(
    `SELECT id, system_prompt, user_prompt_template, model
     FROM bac_exam_openai_prompts
     WHERE exercise_id = $1 AND prompt_key = $2 AND is_active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
    [exerciseId, promptKey],
  );
  return result.rows[0] ?? null;
}

function parseFlexibleResult(raw: unknown, requiredCount: number): FlexibleEvalResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const correctCount = Math.max(0, Math.floor(Number(data.correct_count ?? 0)));
  const required = Math.max(1, Math.floor(Number(data.required_count ?? requiredCount)));
  const isAccepted = Boolean(data.is_accepted ?? correctCount >= required);
  return {
    correct_count: correctCount,
    required_count: required,
    is_accepted: isAccepted,
    feedback: String(data.feedback ?? "").trim(),
  };
}

export async function evaluateFlexibleWithOpenAI(params: {
  exerciseId: string;
  submissionId: string;
  studentAnswers: string[];
  acceptedAnswers: string[];
  requiredCount: number;
  customSystemPrompt?: string;
  customUserTemplate?: string;
  promptId?: string | null;
}): Promise<{ result: FlexibleEvalResult; awardedRatio: number; raw: string; model: string }> {
  const model = process.env.OPENAI_BAC_MODEL ?? process.env.OPENAI_GRILE_MODEL ?? "gpt-4.1-mini";
  const system = params.customSystemPrompt?.trim() || DEFAULT_FLEXIBLE_SYSTEM;
  const userTemplate =
    params.customUserTemplate?.trim() ||
    `Raspunsuri acceptate (referinta):
{{accepted}}

Raspunsuri elev:
{{student}}

Numar raspunsuri cerute: {{required_count}}

Evalueaza conform instructiunilor.`;

  const user = userTemplate
    .replaceAll("{{accepted}}", params.acceptedAnswers.join("\n") || "(lista goala)")
    .replaceAll("{{student}}", params.studentAnswers.join("\n") || "(gol)")
    .replaceAll("{{required_count}}", String(params.requiredCount));

  const promptSnapshot = JSON.stringify({ system, user });

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await callOpenAIChat(system, user, model);
      const parsed = parseFlexibleResult(extractJsonObject(raw), params.requiredCount);
      const ratio = Math.min(1, parsed.correct_count / params.requiredCount);

      await pgPool.query(
        `INSERT INTO bac_exam_ai_evaluations
           (submission_id, exercise_id, prompt_id, prompt_snapshot, model, raw_response, parsed_result, awarded_points)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [
          params.submissionId,
          params.exerciseId,
          params.promptId ?? null,
          promptSnapshot,
          model,
          raw,
          JSON.stringify(parsed),
          parsed.correct_count,
        ],
      );

      return {
        result: parsed,
        awardedRatio: parsed.is_accepted ? 1 : ratio,
        raw,
        model,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Evaluare OpenAI esuata.");
}
