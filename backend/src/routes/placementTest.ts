import { Router } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";

export const placementTestRouter = Router();

let placementTestTablesEnsured = false;

export async function ensurePlacementTestTables() {
  if (placementTestTablesEnsured) return;
  await pgPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS placement_test_questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_index INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E', 'F')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS placement_test_attempts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished')),
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      duration_seconds INTEGER NOT NULL DEFAULT 7200,
      correct_count INTEGER,
      grade NUMERIC(4, 2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS placement_test_attempt_answers (
      attempt_id UUID NOT NULL REFERENCES placement_test_attempts(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES placement_test_questions(id),
      selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D', 'E', 'F')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (attempt_id, question_id)
    )
  `);
  await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_placement_test_questions_order ON placement_test_questions(order_index)`);
  placementTestTablesEnsured = true;
}

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role === "professor" || role === "admin";
}

type AttemptRow = {
  id: string;
  user_id: string;
  status: "in_progress" | "finished";
  started_at: string;
  finished_at: string | null;
  duration_seconds: number;
  correct_count: number | null;
  grade: string | null;
};

function computeGrade(correctCount: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 1;
  const raw = 1 + (correctCount / totalQuestions) * 9;
  return Math.round(raw * 100) / 100;
}

/** Daca timpul alocat a expirat si testul e inca in_progress, il finalizeaza server-side pe baza raspunsurilor salvate pana acum (elevul poate sa nu mai fi deschis pagina la timp). */
async function finalizeIfExpired(attempt: AttemptRow): Promise<AttemptRow> {
  if (attempt.status !== "in_progress") return attempt;
  const startedAtMs = new Date(attempt.started_at).getTime();
  const deadlineMs = startedAtMs + attempt.duration_seconds * 1000;
  if (Date.now() < deadlineMs) return attempt;
  return finishAttempt(attempt.id);
}

async function finishAttempt(attemptId: string): Promise<AttemptRow> {
  const totalResult = await pgPool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM placement_test_questions WHERE is_active = true`,
  );
  const totalQuestions = totalResult.rows[0]?.count ?? 0;
  const correctResult = await pgPool.query<{ correct_count: number }>(
    `SELECT COUNT(*)::int AS correct_count
     FROM placement_test_attempt_answers a
     JOIN placement_test_questions q ON q.id = a.question_id
     WHERE a.attempt_id = $1 AND a.selected_answer = q.correct_answer`,
    [attemptId],
  );
  const correctCount = correctResult.rows[0]?.correct_count ?? 0;
  const grade = computeGrade(correctCount, totalQuestions);
  const updateResult = await pgPool.query<AttemptRow>(
    `UPDATE placement_test_attempts
     SET status = 'finished', finished_at = NOW(), correct_count = $2, grade = $3
     WHERE id = $1 AND status = 'in_progress'
     RETURNING id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text`,
    [attemptId, correctCount, grade],
  );
  if (updateResult.rows[0]) return updateResult.rows[0];
  const existing = await pgPool.query<AttemptRow>(
    `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
     FROM placement_test_attempts WHERE id = $1`,
    [attemptId],
  );
  return existing.rows[0];
}

async function isEligible(userId: string): Promise<boolean> {
  const result = await pgPool.query(`SELECT 1 FROM meditations_leads WHERE user_id = $1 LIMIT 1`, [userId]);
  return result.rows.length > 0;
}

placementTestRouter.get("/eligibility", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    const eligible = await isEligible(req.user!.id);
    const attemptResult = await pgPool.query<AttemptRow>(
      `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
       FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
      [req.user!.id],
    );
    let attempt = attemptResult.rows[0] ?? null;
    if (attempt) attempt = await finalizeIfExpired(attempt);
    const countResult = await pgPool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM placement_test_questions WHERE is_active = true`,
    );
    const questionsConfigured = (countResult.rows[0]?.count ?? 0) > 0;
    res.json({ data: { eligible, attempt, questionsConfigured } });
  } catch (error) {
    console.error("Failed to check placement test eligibility:", error);
    res.status(500).json({ error: "Failed to check eligibility", code: "INTERNAL_ERROR" });
  }
});

placementTestRouter.post("/start", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    if (!(await isEligible(req.user!.id))) {
      res.status(403).json({ error: "Not eligible for placement test", code: "NOT_ELIGIBLE" });
      return;
    }
    const existingResult = await pgPool.query<AttemptRow>(
      `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
       FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
      [req.user!.id],
    );
    if (existingResult.rows[0]) {
      const attempt = await finalizeIfExpired(existingResult.rows[0]);
      res.json({ data: { attempt } });
      return;
    }
    const countResult = await pgPool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM placement_test_questions WHERE is_active = true`,
    );
    if ((countResult.rows[0]?.count ?? 0) === 0) {
      res.status(400).json({ error: "No placement test questions configured", code: "NO_QUESTIONS" });
      return;
    }
    try {
      const insertResult = await pgPool.query<AttemptRow>(
        `INSERT INTO placement_test_attempts (user_id)
         VALUES ($1)
         RETURNING id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text`,
        [req.user!.id],
      );
      res.json({ data: { attempt: insertResult.rows[0] } });
    } catch (insertError: unknown) {
      // Alta cerere concurenta a creat deja attempt-ul intre timp (UNIQUE(user_id)).
      const isUniqueViolation =
        typeof insertError === "object" && insertError !== null && (insertError as { code?: string }).code === "23505";
      if (!isUniqueViolation) throw insertError;
      const raceResult = await pgPool.query<AttemptRow>(
        `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
         FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
        [req.user!.id],
      );
      res.json({ data: { attempt: raceResult.rows[0] } });
    }
  } catch (error) {
    console.error("Failed to start placement test:", error);
    res.status(500).json({ error: "Failed to start placement test", code: "INTERNAL_ERROR" });
  }
});

placementTestRouter.get("/state", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    const attemptResult = await pgPool.query<AttemptRow>(
      `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
       FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
      [req.user!.id],
    );
    const rawAttempt = attemptResult.rows[0];
    if (!rawAttempt) {
      res.status(404).json({ error: "No attempt found", code: "NOT_FOUND" });
      return;
    }
    const attempt = await finalizeIfExpired(rawAttempt);
    const questionsResult = await pgPool.query<{ id: string; order_index: number; image_url: string; correct_answer: string }>(
      `SELECT id, order_index, image_url, correct_answer FROM placement_test_questions WHERE is_active = true ORDER BY order_index ASC`,
    );
    const answersResult = await pgPool.query<{ question_id: string; selected_answer: string }>(
      `SELECT question_id, selected_answer FROM placement_test_attempt_answers WHERE attempt_id = $1`,
      [attempt.id],
    );
    // Raspunsurile corecte se vad abia dupa finalizare, ca sa nu poata fi "trisat" testul in timp ce e in desfasurare.
    const questions =
      attempt.status === "finished"
        ? questionsResult.rows
        : questionsResult.rows.map(({ id, order_index, image_url }) => ({ id, order_index, image_url }));
    res.json({
      data: {
        attempt,
        questions,
        answers: answersResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch placement test state:", error);
    res.status(500).json({ error: "Failed to fetch placement test state", code: "INTERNAL_ERROR" });
  }
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.enum(["A", "B", "C", "D", "E", "F"]),
});

placementTestRouter.post("/answers", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", code: "INVALID_PAYLOAD" });
      return;
    }
    const attemptResult = await pgPool.query<AttemptRow>(
      `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
       FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
      [req.user!.id],
    );
    const rawAttempt = attemptResult.rows[0];
    if (!rawAttempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    const attempt = await finalizeIfExpired(rawAttempt);
    if (attempt.status !== "in_progress") {
      res.status(400).json({ error: "Attempt already finished", code: "ATTEMPT_FINISHED" });
      return;
    }
    const questionResult = await pgPool.query<{ id: string }>(
      `SELECT id FROM placement_test_questions WHERE id = $1 AND is_active = true LIMIT 1`,
      [parsed.data.questionId],
    );
    if (!questionResult.rows[0]) {
      res.status(400).json({ error: "Invalid question", code: "INVALID_QUESTION" });
      return;
    }
    await pgPool.query(
      `INSERT INTO placement_test_attempt_answers (attempt_id, question_id, selected_answer, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET selected_answer = EXCLUDED.selected_answer, updated_at = NOW()`,
      [attempt.id, parsed.data.questionId, parsed.data.selectedAnswer],
    );
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Failed to save placement test answer:", error);
    res.status(500).json({ error: "Failed to save answer", code: "INTERNAL_ERROR" });
  }
});

placementTestRouter.post("/finish", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    const attemptResult = await pgPool.query<AttemptRow>(
      `SELECT id, user_id, status, started_at::text, finished_at::text, duration_seconds, correct_count, grade::text
       FROM placement_test_attempts WHERE user_id = $1 LIMIT 1`,
      [req.user!.id],
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) {
      res.status(404).json({ error: "Attempt not found", code: "NOT_FOUND" });
      return;
    }
    const finished = attempt.status === "in_progress" ? await finishAttempt(attempt.id) : attempt;
    res.json({ data: { attempt: finished } });
  } catch (error) {
    console.error("Failed to finish placement test:", error);
    res.status(500).json({ error: "Failed to finish placement test", code: "INTERNAL_ERROR" });
  }
});

placementTestRouter.get("/admin/results", requireAuth, async (req, res) => {
  try {
    await ensurePlacementTestTables();
    if (!(await ensureAdminRole(req.user?.id))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    const result = await pgPool.query<{
      user_id: string;
      full_name: string | null;
      email: string;
      preparation_for: string | null;
      status: string | null;
      correct_count: number | null;
      grade: string | null;
      started_at: string | null;
      finished_at: string | null;
    }>(
      `SELECT DISTINCT ON (u.id)
         u.id AS user_id,
         u.full_name,
         u.email,
         l.grade AS preparation_for,
         a.status,
         a.correct_count,
         a.grade::text,
         a.started_at::text,
         a.finished_at::text
       FROM meditations_leads l
       JOIN users u ON u.id = l.user_id
       LEFT JOIN placement_test_attempts a ON a.user_id = u.id
       ORDER BY u.id, a.started_at DESC NULLS LAST
      `,
    );
    const rows = result.rows.sort((a, b) => {
      const gradeA = a.grade !== null ? Number(a.grade) : -1;
      const gradeB = b.grade !== null ? Number(b.grade) : -1;
      return gradeB - gradeA;
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("Failed to fetch placement test admin results:", error);
    res.status(500).json({ error: "Failed to fetch results", code: "INTERNAL_ERROR" });
  }
});
