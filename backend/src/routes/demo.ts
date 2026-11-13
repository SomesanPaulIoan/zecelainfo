import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { optionalAuth } from "../middleware/auth";
import {
  EXAM_GRILE_CATEGORY,
  dailyIpHash,
  ensureMarketingTables,
  isLikelyBot,
  newDemoSessionId,
  parseExamKey,
  pickUtm,
  type ExamKey,
} from "../services/marketing.service";

/**
 * Demo anonim „Test gratuit”: 5 grile reale per sesiune, fara cont.
 *
 * Protectii (server-side, nu doar in UI):
 * - fiecare examen are un pool fix de max. POOL_SIZE grile (tabela grile_demo_questions); o sesiune vede 5 din ele,
 *   deci un scraper nu poate obtine decat acest pool, niciodata restul bibliotecii;
 * - raspunsul corect, explicatia si video-ul unei grile se dau doar dupa ce grila a primit un raspuns in sesiune;
 * - rate-limit pe hash-ul zilnic al IP-ului; sesiunile expira dupa SESSION_TTL_HOURS;
 * - feature flag: demo-ul e OPRIT implicit (decizie 2026-10-13, oferta gratuita principala e trialul 24h);
 *   DEMO_ENABLED=1 il porneste. Pagina /test-gratuit redirectioneaza acum spre pachetul examenului.
 */

export const demoRouter = Router();

const QUESTIONS_PER_SESSION = 5;
const POOL_SIZE = 15;
const SESSION_TTL_HOURS = 24;
const MAX_SESSIONS_PER_IP_PER_HOUR = 15;
const MAX_ACTIONS_PER_IP_PER_HOUR = 300;

function demoEnabled() {
  const flag = (process.env.DEMO_ENABLED ?? "0").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

// Rate-limit in memorie: backend-ul ruleaza intr-o singura instanta. Fereastra de 1h, pe hash de IP.
const buckets = new Map<string, number[]>();
function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 50_000) {
    for (const [k, v] of buckets) if (!v.some((t) => t > windowStart)) buckets.delete(k);
  }
  return false;
}

function guard(req: Request, res: Response, kind: "session" | "action"): boolean {
  if (!demoEnabled()) {
    res.status(503).json({ error: "Demo-ul este oprit temporar.", code: "DEMO_DISABLED" });
    return false;
  }
  const ip = dailyIpHash(req);
  const limited =
    kind === "session"
      ? rateLimited(`s:${ip}`, MAX_SESSIONS_PER_IP_PER_HOUR)
      : rateLimited(`a:${ip}`, MAX_ACTIONS_PER_IP_PER_HOUR);
  if (limited) {
    res.status(429).json({ error: "Prea multe cereri. Mai încearcă peste puțin timp.", code: "RATE_LIMITED" });
    return false;
  }
  return true;
}

const BANDS = [
  { band: "easy", min: 1, max: 2, take: 6 },
  { band: "medium", min: 3, max: 3, take: 6 },
  { band: "hard", min: 4, max: 5, take: 3 },
] as const;

/**
 * Daca un examen nu are inca pool, il generam o singura data din grilele publicate care au tot continutul didactic
 * (imagine, raspuns, indicatie, explicatie, video). Alegerea e determinista (md5(id)), deci stabila intre reporniri.
 * Pool-ul poate fi curatoriat ulterior direct in tabela (is_active / alte question_id).
 */
async function ensureDemoPool(exam: ExamKey) {
  const existing = await pgPool.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM grile_demo_questions WHERE exam = $1 AND is_active`,
    [exam],
  );
  if ((existing.rows[0]?.n ?? 0) >= QUESTIONS_PER_SESSION) return;
  const categorySlug = EXAM_GRILE_CATEGORY[exam];
  for (const band of BANDS) {
    await pgPool.query(
      `INSERT INTO grile_demo_questions (exam, question_id, band)
       SELECT $1, q.id, $2
       FROM grile_questions q
       JOIN grile_sources s ON s.id = q.source_id AND s.is_published = true
       JOIN grile_categories c ON c.id = s.category_id AND c.slug = $3
       LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
       WHERE q.image_url IS NOT NULL
         AND COALESCE(q.answer, '') <> ''
         AND ($1 = 'ubb' OR length(trim(q.answer)) = 1)
         AND COALESCE(q.video_url, '') <> ''
         AND q.difficulty BETWEEN $4 AND $5
         AND COALESCE(NULLIF(ai.hint, ''), NULLIF(q.hint_ai, ''), q.hint) IS NOT NULL
         AND COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(q.explanation_ai, ''), q.explanation) IS NOT NULL
       ORDER BY md5(q.id::text)
       LIMIT $6
       ON CONFLICT DO NOTHING`,
      [exam, band.band, categorySlug, band.min, band.max, band.take],
    );
  }
}

/** 2 usoare, 2 medii, 1 grea (cu fallback daca un nivel lipseste), in ordine crescatoare de dificultate. */
async function pickSessionQuestions(exam: ExamKey): Promise<string[]> {
  const pool = await pgPool.query<{ question_id: string; band: string }>(
    `SELECT question_id, band FROM grile_demo_questions WHERE exam = $1 AND is_active ORDER BY random() LIMIT ${POOL_SIZE * 2}`,
    [exam],
  );
  const byBand = (band: string) => pool.rows.filter((row) => row.band === band).map((row) => row.question_id);
  const picked = [...byBand("easy").slice(0, 2), ...byBand("medium").slice(0, 2), ...byBand("hard").slice(0, 1)];
  for (const row of pool.rows) {
    if (picked.length >= QUESTIONS_PER_SESSION) break;
    if (!picked.includes(row.question_id)) picked.push(row.question_id);
  }
  return picked.slice(0, QUESTIONS_PER_SESSION);
}

type DemoQuestionRow = {
  id: string;
  image_url: string | null;
  answer: string | null;
  hint: string | null;
  short_explanation: string | null;
  full_explanation: string | null;
  video_url: string | null;
  difficulty: number | null;
  variants_count: number | null;
  chapter_names: string[] | null;
  source_name: string | null;
};

async function loadQuestions(ids: string[]): Promise<Map<string, DemoQuestionRow>> {
  const result = await pgPool.query<DemoQuestionRow>(
    `SELECT q.id, q.image_url, q.answer,
            COALESCE(NULLIF(ai.hint, ''), NULLIF(ai.student_visible->>'hint', ''), NULLIF(q.hint_ai, ''), q.hint) AS hint,
            COALESCE(NULLIF(ai.short_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS short_explanation,
            COALESCE(NULLIF(ai.full_explanation, ''), NULLIF(ai.student_visible->>'explanation', ''), NULLIF(q.explanation_ai, ''), q.explanation) AS full_explanation,
            q.video_url, q.difficulty, q.variants_count,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT ch.name), NULL) AS chapter_names,
            s.name AS source_name
     FROM grile_questions q
     LEFT JOIN grile_sources s ON s.id = q.source_id
     LEFT JOIN grile_question_ai_results ai ON ai.question_id = q.id AND ai.reviewed_by_admin = true
     LEFT JOIN grile_question_chapters gqc ON gqc.question_id = q.id
     LEFT JOIN grile_chapters ch ON ch.id = gqc.chapter_id
     WHERE q.id = ANY($1::uuid[])
     GROUP BY q.id, ai.id, s.name`,
    [ids],
  );
  return new Map(result.rows.map((row) => [row.id, row]));
}

function normalizeLetters(raw: string | string[] | null | undefined): string[] {
  const list = Array.isArray(raw) ? raw : (raw ?? "").split("");
  return [...new Set(list.map((item) => item.trim().toUpperCase()).filter((item) => /^[A-Z]$/.test(item)))].sort();
}

type SessionRow = {
  id: string;
  exam: ExamKey;
  question_ids: string[];
  answers: Record<string, { selected: string; correct: boolean; at: string }>;
  hints_opened: string[];
  created_at: string;
  completed_at: string | null;
};

async function loadSession(id: string): Promise<SessionRow | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const result = await pgPool.query<SessionRow>(
    `SELECT id, exam, question_ids, answers, hints_opened, created_at::text, completed_at::text
     FROM demo_sessions
     WHERE id = $1 AND created_at > NOW() - make_interval(hours => $2)`,
    [id, SESSION_TTL_HOURS],
  );
  return result.rows[0] ?? null;
}

/** Ce vede clientul: raspunsul, explicatiile si video-ul doar pentru grilele deja rezolvate. */
function publicQuestion(row: DemoQuestionRow, session: SessionRow) {
  const answered = session.answers[row.id];
  const hintOpened = session.hints_opened.includes(row.id);
  return {
    id: row.id,
    image_url: row.image_url,
    variants_count: row.variants_count,
    difficulty: row.difficulty,
    chapter_names: row.chapter_names ?? [],
    source_name: row.source_name,
    has_video: Boolean(row.video_url),
    answered: answered
      ? {
          selected: answered.selected,
          is_correct: answered.correct,
          expected_answer: row.answer,
          short_explanation: row.short_explanation,
          full_explanation: row.full_explanation,
          video_url: row.video_url,
        }
      : null,
    hint: hintOpened || answered ? row.hint : null,
  };
}

async function sessionPayload(session: SessionRow) {
  const questions = await loadQuestions(session.question_ids);
  const ordered = session.question_ids.map((id) => questions.get(id)).filter((row): row is DemoQuestionRow => Boolean(row));
  const answeredCount = Object.keys(session.answers).length;
  const correctCount = Object.values(session.answers).filter((answer) => answer.correct).length;
  return {
    id: session.id,
    exam: session.exam,
    total: ordered.length,
    answered_count: answeredCount,
    correct_count: correctCount,
    completed: Boolean(session.completed_at),
    questions: ordered.map((row) => publicQuestion(row, session)),
  };
}

demoRouter.get("/config", (_req, res) => {
  res.json({ data: { enabled: demoEnabled(), questions_per_session: QUESTIONS_PER_SESSION } });
});

const createSessionSchema = z.object({
  exam: z.string(),
  attribution: z.record(z.string(), z.unknown()).nullable().optional(),
});

demoRouter.post("/sessions", optionalAuth, async (req, res) => {
  try {
    if (!guard(req, res, "session")) return;
    const parsed = createSessionSchema.safeParse(req.body);
    const exam = parsed.success ? parseExamKey(parsed.data.exam) : null;
    if (!exam) {
      res.status(400).json({ error: "Examen invalid", code: "INVALID_EXAM" });
      return;
    }
    await ensureMarketingTables();
    await ensureDemoPool(exam);
    const questionIds = await pickSessionQuestions(exam);
    if (questionIds.length === 0) {
      res.status(503).json({ error: "Demo-ul nu este disponibil pentru acest examen.", code: "DEMO_EMPTY" });
      return;
    }
    // Atribuirea vine doar daca vizitatorul a acceptat statisticile (decis in frontend).
    const utm = pickUtm(parsed.success ? parsed.data.attribution ?? undefined : undefined);
    const sessionId = newDemoSessionId();
    await pgPool.query(
      `INSERT INTO demo_sessions (id, exam, question_ids, utm_source, utm_medium, utm_campaign, utm_content, ip_hash, user_id)
       VALUES ($1, $2, $3::uuid[], $4, $5, $6, $7, $8, $9)`,
      [
        sessionId,
        exam,
        questionIds,
        utm.utm_source ?? null,
        utm.utm_medium ?? null,
        utm.utm_campaign ?? null,
        utm.utm_content ?? null,
        isLikelyBot(req) ? "bot" : dailyIpHash(req),
        req.user?.id ?? null,
      ],
    );
    const session = await loadSession(sessionId);
    res.status(201).json({ data: await sessionPayload(session!) });
  } catch (error) {
    console.error("demo create session:", error);
    res.status(500).json({ error: "Nu am putut porni testul.", code: "INTERNAL_ERROR" });
  }
});

demoRouter.get("/sessions/:id", async (req, res) => {
  try {
    if (!guard(req, res, "action")) return;
    await ensureMarketingTables();
    const session = await loadSession(String(req.params.id));
    if (!session) {
      res.status(404).json({ error: "Sesiunea a expirat. Pornește un test nou.", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: await sessionPayload(session) });
  } catch (error) {
    console.error("demo get session:", error);
    res.status(500).json({ error: "Eroare internă", code: "INTERNAL_ERROR" });
  }
});

demoRouter.post("/sessions/:id/questions/:questionId/hint", async (req, res) => {
  try {
    if (!guard(req, res, "action")) return;
    await ensureMarketingTables();
    const session = await loadSession(String(req.params.id));
    const questionId = String(req.params.questionId);
    if (!session || !session.question_ids.includes(questionId)) {
      res.status(404).json({ error: "Grila nu face parte din test.", code: "NOT_FOUND" });
      return;
    }
    await pgPool.query(
      `UPDATE demo_sessions SET hints_opened = array_append(hints_opened, $2::uuid)
       WHERE id = $1 AND NOT ($2::uuid = ANY(hints_opened))`,
      [session.id, questionId],
    );
    const questions = await loadQuestions([questionId]);
    res.json({ data: { hint: questions.get(questionId)?.hint ?? null } });
  } catch (error) {
    console.error("demo hint:", error);
    res.status(500).json({ error: "Eroare internă", code: "INTERNAL_ERROR" });
  }
});

const answerSchema = z.object({ selectedAnswers: z.array(z.string().max(2)).max(10) });

demoRouter.post("/sessions/:id/questions/:questionId/answer", async (req, res) => {
  try {
    if (!guard(req, res, "action")) return;
    await ensureMarketingTables();
    const parsed = answerSchema.safeParse(req.body);
    const selected = parsed.success ? normalizeLetters(parsed.data.selectedAnswers) : [];
    if (selected.length === 0) {
      res.status(400).json({ error: "Alege cel puțin un răspuns.", code: "EMPTY_ANSWER" });
      return;
    }
    const questionId = String(req.params.questionId);
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const locked = await client.query<{ question_ids: string[]; answers: SessionRow["answers"] }>(
        `SELECT question_ids, answers FROM demo_sessions
         WHERE id = $1 AND created_at > NOW() - make_interval(hours => $2) FOR UPDATE`,
        [String(req.params.id), SESSION_TTL_HOURS],
      );
      const row = locked.rows[0];
      if (!row || !row.question_ids.includes(questionId)) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Grila nu face parte din test.", code: "NOT_FOUND" });
        return;
      }
      // Primul raspuns conteaza pentru scor; un al doilea apel doar reintoarce rezultatul.
      if (!row.answers[questionId]) {
        const question = await client.query<{ answer: string | null }>(`SELECT answer FROM grile_questions WHERE id = $1`, [questionId]);
        const expected = normalizeLetters(question.rows[0]?.answer ?? "");
        const correct = expected.length === selected.length && expected.every((letter, index) => letter === selected[index]);
        const answers = { ...row.answers, [questionId]: { selected: selected.join(""), correct, at: new Date().toISOString() } };
        const completed = row.question_ids.every((id) => answers[id]);
        await client.query(
          `UPDATE demo_sessions SET answers = $2::jsonb, completed_at = CASE WHEN $3 THEN COALESCE(completed_at, NOW()) ELSE completed_at END
           WHERE id = $1`,
          [String(req.params.id), JSON.stringify(answers), completed],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    const session = await loadSession(String(req.params.id));
    res.json({ data: await sessionPayload(session!) });
  } catch (error) {
    console.error("demo answer:", error);
    res.status(500).json({ error: "Nu am putut verifica răspunsul.", code: "INTERNAL_ERROR" });
  }
});
