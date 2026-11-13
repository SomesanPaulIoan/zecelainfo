import { pgPool } from "../db/postgres";
import fs from "node:fs/promises";
import path from "node:path";
import { getGrileQuestionsUploadDir } from "./grilaQuestionImage.service";
import { getAppBaseUrl } from "./revolutSmartbill.service";

export const GRILE_AI_PROMPT_VERSION = "grile_ai_v1.0";
export const GRILE_AI_CONTENT_FORMAT = "markdown_latex";

const SYSTEM_PROMPT = `Esti un profesor expert de informatica pentru admiterea la facultate in Romania.

Primesti o imagine cu o grila de informatica si, separat, raspunsul oficial din baza de date. Grila poate contine pseudocod, cod C/C++, tabele, formule, vectori, grafuri sau variante de raspuns.

Scopul tau principal este:
1. sa citesti cu atentie grila din imagine;
2. sa explici raspunsul oficial primit din baza de date;
3. sa oferi un indiciu util pentru elev;
4. sa oferi o explicatie completa, clara si educativa;
5. sa semnalezi intern daca raspunsul oficial pare gresit, incomplet sau daca grila este ambigua.

Reguli foarte importante:
- Raspunsul oficial primit din baza de date este considerat baremul platformei.
- Grila poate avea intre 2 si 10 variante de raspuns, de la A pana la maximum J.
- Grila poate avea una sau mai multe variante corecte.
- Raspunsurile oficiale sunt in format compact fara virgule, de exemplu A, AC, BDEH.
- Nu presupune niciodata ca exista doar 4 variante.
- Nu presupune niciodata ca exista o singura varianta corecta.
- Trateaza raspunsul oficial ca set de litere corecte.
- Normalizeaza raspunsurile in format compact inainte de comparatie.
- Nu modifica raspunsul oficial in explicatia pentru elev.
- Daca nu esti de acord cu raspunsul oficial, marcheaza acest lucru doar in campurile interne.
- Nu spune elevului ca baremul ar putea fi gresit.
- Explicatia pentru elev trebuie sa fie formulata ca si cum raspunsul oficial este cel corect.
- Daca imaginea este neclara sau nu poti citi complet grila, seteaza needs_human_review: true.
- Raspunde exclusiv in limba romana.
- Returneaza exclusiv JSON valid. Nu adauga text in afara JSON.

Formatul campurilor text:
- Foloseste Markdown + LaTeX.
- Nu folosi HTML brut.
- Foloseste formule inline cu \\( ... \\) si block cu \\[ ... \\].
- Pentru cod, foloseste blocuri triple backticks.
`;

type GrileQuestionContext = {
  questionId: string;
  legacyId: number;
  imageUrl: string | null;
  answer: string | null;
  hint: string | null;
  explanation: string | null;
  transcript: string | null;
  sourceName: string | null;
  chapterNames: string[];
  difficulty: number | null;
  variantsCount: number | null;
};

type AIGeneratedResult = {
  grila_id: string;
  ocr_confidence: number;
  transcribed_question: string;
  transcribed_options: Array<{ letter: string; text: string }>;
  official_answer: string | null;
  official_answer_normalized: string;
  model_suggested_answer: string | null;
  model_suggested_answer_normalized: string | null;
  correct_options: string[];
  extra_correct_options_suspected: string[];
  official_options_suspected_wrong: string[];
  agrees_with_official_answer: boolean;
  needs_human_review: boolean;
  confidence: number;
  review_reason: string | null;
  hint: string;
  short_explanation: string;
  full_explanation: string;
  options_explanation: Array<{
    letter: string;
    is_officially_correct: boolean;
    is_model_considered_correct: boolean;
    explanation: string;
  }>;
  trap: string;
  complexity: string | null;
  difficulty_estimate: string;
  tags: string[];
  student_visible: {
    hint: string;
    explanation: string;
    trap: string;
  };
  content_format: string;
  admin_notes: string;
};

function shouldAutoApproveResult(result: AIGeneratedResult) {
  const confidenceIsMax = result.confidence === 100 || result.confidence === 1;
  return (
    confidenceIsMax &&
    result.agrees_with_official_answer &&
    !result.needs_human_review
  );
}

async function applyAutoApprovedResultToQuestion(questionId: string, result: AIGeneratedResult) {
  const explanationForQuestion =
    result.full_explanation.trim() ||
    result.short_explanation.trim() ||
    result.student_visible.explanation.trim();
  await pgPool.query(
    `UPDATE grile_questions
     SET hint_ai = $2,
         explanation_ai = $3,
         transcript = CASE
           WHEN NULLIF($4, '') IS NOT NULL THEN $4
           ELSE transcript
         END
     WHERE id = $1`,
    [
      questionId,
      result.hint.trim() || result.student_visible.hint.trim() || null,
      explanationForQuestion || null,
      result.transcribed_question.trim() || null,
    ],
  );
}

function uniqSortedLetters(items: string[]) {
  return [...new Set(items)].sort();
}

export function normalizeAnswer(raw: unknown): string {
  if (raw == null) return "";
  if (Array.isArray(raw)) {
    const letters = raw.flatMap((item) => String(item).toUpperCase().match(/[A-J]/g) ?? []);
    return uniqSortedLetters(letters).join("");
  }
  const upper = String(raw).toUpperCase();
  const letters = upper.match(/[A-J]/g) ?? [];
  return uniqSortedLetters(letters).join("");
}

function clampScore(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeOptionsList(raw: unknown) {
  if (!Array.isArray(raw)) return [] as Array<{ letter: string; text: string }>;
  const seen = new Set<string>();
  const normalized: Array<{ letter: string; text: string }> = [];
  for (const item of raw) {
    const letter = normalizeAnswer((item as { letter?: unknown })?.letter).slice(0, 1);
    if (!letter || seen.has(letter)) continue;
    seen.add(letter);
    normalized.push({
      letter,
      text: String((item as { text?: unknown })?.text ?? "").trim(),
    });
  }
  return normalized;
}

function normalizeOptionsExplanationInput(raw: unknown) {
  // Accept either array (preferred) or object map like { "A": { explanation: "..."} }
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const entries = Object.entries(raw as Record<string, unknown>);
  return entries.map(([letter, value]) => ({
    letter,
    ...(typeof value === "object" && value ? (value as Record<string, unknown>) : { explanation: String(value ?? "") }),
  }));
}

function normalizeExplanationList(raw: unknown, officialAnswerNorm: string, modelAnswerNorm: string | null) {
  const input = normalizeOptionsExplanationInput(raw);
  if (!Array.isArray(input)) return [] as AIGeneratedResult["options_explanation"];
  const officialSet = new Set(officialAnswerNorm.split(""));
  const modelSet = new Set((modelAnswerNorm ?? "").split(""));
  const seen = new Set<string>();
  const normalized: AIGeneratedResult["options_explanation"] = [];
  for (const item of input) {
    const letter = normalizeAnswer((item as { letter?: unknown })?.letter).slice(0, 1);
    if (!letter || seen.has(letter)) continue;
    seen.add(letter);
    const explanationCandidate =
      (item as { explanation?: unknown })?.explanation ??
      (item as { explicatie?: unknown })?.explicatie ??
      (item as { ["explicație"]?: unknown })?.["explicație"] ??
      (item as { explicatie_varianta?: unknown })?.explicatie_varianta ??
      "";
    normalized.push({
      letter,
      is_officially_correct: officialSet.has(letter),
      is_model_considered_correct: modelSet.has(letter),
      explanation: String(explanationCandidate ?? "").trim(),
    });
  }
  return normalized;
}

function normalizeTags(raw: unknown) {
  if (!Array.isArray(raw)) return [] as string[];
  return [...new Set(raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
}

function normalizeStudentVisible(raw: unknown) {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    hint: String(data.hint ?? "").trim(),
    explanation: String(data.explanation ?? "").trim(),
    trap: String(data.trap ?? "").trim(),
  };
}

export function normalizeAIResult(raw: unknown, officialAnswerRaw: string | null): AIGeneratedResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const officialAnswerNormalized = normalizeAnswer(data.official_answer_normalized || officialAnswerRaw || data.official_answer);
  const modelSuggestedAnswerNormalizedValue = normalizeAnswer(data.model_suggested_answer_normalized || data.model_suggested_answer);
  const modelSuggestedAnswerNormalized = modelSuggestedAnswerNormalizedValue || null;
  const agrees = officialAnswerNormalized === (modelSuggestedAnswerNormalized ?? "");
  const extraCorrectOptions = uniqSortedLetters((Array.isArray(data.extra_correct_options_suspected) ? data.extra_correct_options_suspected : []).flatMap((x) => normalizeAnswer(x).split("")));
  const officialWrongOptions = uniqSortedLetters((Array.isArray(data.official_options_suspected_wrong) ? data.official_options_suspected_wrong : []).flatMap((x) => normalizeAnswer(x).split("")));
  const ocrConfidence = clampScore(data.ocr_confidence);
  const confidence = clampScore(data.confidence);

  let needsReview = Boolean(data.needs_human_review);
  if (!agrees || extraCorrectOptions.length > 0 || officialWrongOptions.length > 0 || ocrConfidence < 90 || confidence < 90) {
    needsReview = true;
  }
  const reviewReasonFromModel = data.review_reason == null ? null : String(data.review_reason).trim() || null;
  const reviewReason =
    needsReview && !reviewReasonFromModel
      ? `Necesita verificare umana (acord barem: ${agrees ? "da" : "nu"}, OCR ${ocrConfidence}, confidence ${confidence}).`
      : reviewReasonFromModel;

  const options = normalizeOptionsList(data.transcribed_options ?? data.transcriere_variante ?? data.variante ?? []);
  const optionsExplanation = normalizeExplanationList(
    data.options_explanation ?? data.analiza_variante ?? data.explicatii_variante,
    officialAnswerNormalized,
    modelSuggestedAnswerNormalized,
  );

  const hintText = String((data.hint ?? data.indiciu ?? "") as unknown).trim();
  const shortExplanationText = String((data.short_explanation ?? data.explicatie_scurta ?? data.explicatieScurta ?? "") as unknown).trim();
  const fullExplanationText = String((data.full_explanation ?? data.explicatie ?? data["explicație"] ?? "") as unknown).trim();
  const trapText = String((data.trap ?? data.capcana ?? "") as unknown).trim();
  const internalObj = (data.internal ?? {}) as Record<string, unknown>;
  const adminNotesText = String((data.admin_notes ?? data.note_admin ?? internalObj.observatii ?? "") as unknown).trim();
  const transcribedQuestionText = String((data.transcribed_question ?? data.transcriere_enunt ?? data.cerinta_identificata ?? "") as unknown).trim();

  return {
    grila_id: String(data.grila_id ?? ""),
    ocr_confidence: ocrConfidence,
    transcribed_question: transcribedQuestionText,
    transcribed_options: options,
    official_answer: officialAnswerRaw,
    official_answer_normalized: officialAnswerNormalized,
    model_suggested_answer: modelSuggestedAnswerNormalized,
    model_suggested_answer_normalized: modelSuggestedAnswerNormalized,
    correct_options: officialAnswerNormalized.split(""),
    extra_correct_options_suspected: extraCorrectOptions,
    official_options_suspected_wrong: officialWrongOptions,
    agrees_with_official_answer: agrees,
    needs_human_review: needsReview,
    confidence,
    review_reason: reviewReason,
    hint: hintText,
    short_explanation: shortExplanationText,
    full_explanation: fullExplanationText,
    options_explanation: optionsExplanation,
    trap: trapText,
    complexity: data.complexity == null ? null : String(data.complexity).trim() || null,
    difficulty_estimate: String(data.difficulty_estimate ?? "").trim(),
    tags: normalizeTags(data.tags),
    student_visible: normalizeStudentVisible(data.student_visible),
    content_format: GRILE_AI_CONTENT_FORMAT,
    admin_notes: adminNotesText,
  };
}

async function callOpenAIForQuestion(context: GrileQuestionContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY lipseste din configurare.");
  }
  const model = process.env.OPENAI_GRILE_MODEL ?? "gpt-5.5-medium";
  const modelImageUrl = await resolveGrilaImageForOpenAI(context.imageUrl);
  const imageAvailableForModel = Boolean(modelImageUrl);
  if (context.imageUrl && !modelImageUrl) {
    throw new Error(
      "Imaginea grilei nu a putut fi incarcata pentru AI. Verifica fisierul din storage sau APP_BASE_URL.",
    );
  }
  const userPrompt = `Analizeaza grila trimisa.

Date din platforma:
- ID grila: ${context.questionId}
- Raspuns oficial: ${context.answer ?? ""}
- Capitol: ${(context.chapterNames ?? []).join(", ") || "-"}
- Sursa: ${context.sourceName ?? "-"}
- Dificultate actuala: ${context.difficulty ?? "-"}
- Numar variante raspuns: ${context.variantsCount ?? "-"}
- Text grila existent in DB, daca exista: ${context.transcript ?? ""}
- Variante existente in DB, daca exista: -
- Imagine disponibila pentru model: ${imageAvailableForModel ? "da" : "nu"}

Returneaza un JSON valid cu EXACT structura de mai jos (chei snake_case exact), fara chei in plus:

{
  "grila_id": "${context.questionId}",
  "ocr_confidence": 0,
  "transcribed_question": "",
  "transcribed_options": [
    { "letter": "A", "text": "" },
    { "letter": "B", "text": "" }
  ],
  "official_answer": "${context.answer ?? ""}",
  "official_answer_normalized": "",
  "model_suggested_answer": "",
  "model_suggested_answer_normalized": "",
  "correct_options": ["A"],
  "extra_correct_options_suspected": [],
  "official_options_suspected_wrong": [],
  "agrees_with_official_answer": true,
  "needs_human_review": false,
  "confidence": 0,
  "review_reason": null,
  "hint": "",
  "short_explanation": "",
  "full_explanation": "",
  "options_explanation": [
    { "letter": "A", "is_officially_correct": true, "is_model_considered_correct": true, "explanation": "" },
    { "letter": "B", "is_officially_correct": false, "is_model_considered_correct": false, "explanation": "" }
  ],
  "trap": "",
  "complexity": null,
  "difficulty_estimate": "usor",
  "tags": [],
  "student_visible": { "hint": "", "explanation": "", "trap": "" },
  "content_format": "markdown_latex",
  "admin_notes": ""
}

Reguli:
- raspunde exclusiv in romana
- nu presupune doar 4 variante; accepta A-J
- suporta raspunsuri multiple (ACF etc) si normalizeaza compact
- daca nu poti citi/rezolva sigur: needs_human_review=true si review_reason completat
- pentru elev: respecta baremul oficial, nu mentiona ca e gresit

Returneaza doar JSON valid.`;

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: userPrompt },
  ];
  if (modelImageUrl) {
    content.push({
      type: "image_url",
      image_url: { url: modelImageUrl },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText}`);
  }
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawContent = json.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI nu a returnat continut.");
  }
  return {
    modelUsed: model,
    rawResponse: rawContent,
    parsedResponse: JSON.parse(rawContent),
  };
}

function mimeTypeFromExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return null;
}

function grileImageFileNameFromUrl(imageUrl: string): string | null {
  const pathOnly = imageUrl.split("?")[0].split("#")[0];
  const match = /\/uploads\/grile-questions\/([^/]+)$/i.exec(pathOnly);
  return match?.[1] ?? null;
}

async function readImageAsDataUrl(filePath: string): Promise<string | null> {
  const mime = mimeTypeFromExt(filePath);
  if (!mime) return null;
  try {
    const bytes = await fs.readFile(filePath);
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** URL absolut public sau data URL pentru OpenAI vision. */
export async function resolveGrilaImageForOpenAI(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl?.trim()) return null;
  const trimmed = imageUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const fileName = grileImageFileNameFromUrl(trimmed);
  if (fileName) {
    const fromUploadDir = await readImageAsDataUrl(path.join(getGrileQuestionsUploadDir(), fileName));
    if (fromUploadDir) return fromUploadDir;
  }

  if (trimmed.startsWith("/")) {
    const relative = trimmed.replace(/^\/+/, "").split("?")[0];
    const publicCandidates = [
      path.resolve(process.cwd(), "..", "frontend", "public", relative),
      path.resolve(process.cwd(), "public", relative),
    ];
    for (const candidate of publicCandidates) {
      const dataUrl = await readImageAsDataUrl(candidate);
      if (dataUrl) return dataUrl;
    }

    const appBase = getAppBaseUrl().replace(/\/$/, "");
    if (appBase) {
      return `${appBase}/${relative}`;
    }
  }

  return null;
}

export async function processSingleGrilaAI(questionId: string, forceRegenerate: boolean) {
  const questionResult = await pgPool.query<{
    id: string;
    legacy_id: number;
    image_url: string | null;
    answer: string | null;
    hint: string | null;
    explanation: string | null;
    transcript: string | null;
    source_name: string | null;
    difficulty: number | null;
    variants_count: number | null;
    chapter_names: string[] | null;
  }>(
    `SELECT
       q.id,
       q.legacy_id,
       q.image_url,
       q.answer,
       COALESCE(NULLIF(q.hint_ai, ''), q.hint) AS hint,
       COALESCE(NULLIF(q.explanation_ai, ''), q.explanation) AS explanation,
       q.transcript,
       s.name AS source_name,
       q.difficulty,
       q.variants_count,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names
     FROM grile_questions q
     LEFT JOIN grile_sources s ON s.id = q.source_id
     LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
     LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
     WHERE q.id = $1
     GROUP BY q.id, s.name
     LIMIT 1`,
    [questionId],
  );
  const question = questionResult.rows[0];
  if (!question) {
    throw new Error("Grila nu a fost gasita.");
  }
  const existingResult = await pgPool.query<{ id: string; processing_status: string }>(
    `SELECT id, processing_status
     FROM grile_question_ai_results
     WHERE question_id = $1
     LIMIT 1`,
    [question.id],
  );
  if (existingResult.rows[0]?.processing_status === "processing") {
    throw new Error("Aceasta grila este deja in procesare.");
  }
  if (existingResult.rows[0] && !forceRegenerate) {
    return { skipped: true, reason: "already_generated" as const };
  }
  await pgPool.query(
    `INSERT INTO grile_question_ai_results
      (question_id, official_answer, official_answer_normalized, processing_status, prompt_version, content_format, model_used, generated_at, created_at, updated_at)
     VALUES ($1, $2, $3, 'processing', $4, $5, '-', NOW(), NOW(), NOW())
     ON CONFLICT (question_id)
     DO UPDATE SET
       official_answer = EXCLUDED.official_answer,
       official_answer_normalized = EXCLUDED.official_answer_normalized,
       processing_status = 'processing',
       prompt_version = EXCLUDED.prompt_version,
       content_format = EXCLUDED.content_format,
       error_message = NULL,
       updated_at = NOW()`,
    [question.id, question.answer, normalizeAnswer(question.answer), GRILE_AI_PROMPT_VERSION, GRILE_AI_CONTENT_FORMAT],
  );

  try {
    const ai = await callOpenAIForQuestion({
      questionId: question.id,
      legacyId: question.legacy_id,
      imageUrl: question.image_url,
      answer: question.answer,
      hint: question.hint,
      explanation: question.explanation,
      transcript: question.transcript,
      sourceName: question.source_name,
      chapterNames: question.chapter_names ?? [],
      difficulty: question.difficulty,
      variantsCount: question.variants_count,
    });
    const normalized = normalizeAIResult(ai.parsedResponse, question.answer);
    const autoApproved = shouldAutoApproveResult(normalized);
    const autoReviewNote = autoApproved
      ? "Auto-aprobat: confidence 1/1 si acord cu baremul oficial."
      : "";

    await pgPool.query(
      `UPDATE grile_question_ai_results
       SET official_answer = $2,
           official_answer_normalized = $3,
           model_suggested_answer = $4,
           model_suggested_answer_normalized = $5,
           correct_options = $6::jsonb,
           extra_correct_options_suspected = $7::jsonb,
           official_options_suspected_wrong = $8::jsonb,
           agrees_with_official_answer = $9,
           needs_human_review = $10,
           ocr_confidence = $11,
           confidence = $12,
           review_reason = $13,
           transcribed_question = $14,
           transcribed_options = $15::jsonb,
           hint = $16,
           short_explanation = $17,
           full_explanation = $18,
           options_explanation = $19::jsonb,
           trap = $20,
           complexity = $21,
           difficulty_estimate = $22,
           tags = $23::jsonb,
           student_visible = $24::jsonb,
           admin_notes = $25,
           content_format = $26,
           model_used = $27,
           prompt_version = $28,
           raw_ai_response = $29,
           reviewed_by_admin = $30,
           admin_review_note = $31,
           error_message = NULL,
           processing_status = 'done',
           generated_at = NOW(),
           updated_at = NOW()
       WHERE question_id = $1`,
      [
        question.id,
        normalized.official_answer,
        normalized.official_answer_normalized,
        normalized.model_suggested_answer,
        normalized.model_suggested_answer_normalized,
        JSON.stringify(normalized.correct_options),
        JSON.stringify(normalized.extra_correct_options_suspected),
        JSON.stringify(normalized.official_options_suspected_wrong),
        normalized.agrees_with_official_answer,
        normalized.needs_human_review,
        normalized.ocr_confidence,
        normalized.confidence,
        normalized.review_reason,
        normalized.transcribed_question,
        JSON.stringify(normalized.transcribed_options),
        normalized.hint,
        normalized.short_explanation,
        normalized.full_explanation,
        JSON.stringify(normalized.options_explanation),
        normalized.trap,
        normalized.complexity,
        normalized.difficulty_estimate,
        JSON.stringify(normalized.tags),
        JSON.stringify(normalized.student_visible),
        normalized.admin_notes,
        GRILE_AI_CONTENT_FORMAT,
        ai.modelUsed,
        GRILE_AI_PROMPT_VERSION,
        ai.rawResponse,
        autoApproved,
        autoReviewNote,
      ],
    );
    if (autoApproved) {
      await applyAutoApprovedResultToQuestion(question.id, normalized);
    }
    return { skipped: false, result: normalized };
  } catch (error) {
    await pgPool.query(
      `UPDATE grile_question_ai_results
       SET processing_status = 'error',
           error_message = $2,
           updated_at = NOW()
       WHERE question_id = $1`,
      [question.id, error instanceof Error ? error.message : "Unknown AI error"],
    );
    throw error;
  }
}
