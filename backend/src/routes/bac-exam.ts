import { randomUUID } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { ensureBacExamTables } from "../bac-exam/ensure-tables";
import { runTestsOnCode } from "../bac-exam/code-runner";
import { gradeSubmission, loadSubjectBundle, recalculateSubmissionTotals } from "../bac-exam/grading.service";
import { saveBacExamImage } from "../bac-exam/image-upload";
import { BAC_EXAM_EXERCISE_TYPES } from "../bac-exam/types";

export const bacExamRouter = Router();

function routeParamString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const jsonRecord = z.record(z.string(), z.unknown());

const exerciseTypeEnum = z.enum(BAC_EXAM_EXERCISE_TYPES);
const sectionEnum = z.enum(["I", "II", "III"]);

const imageUploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_base64: z.string().min(20),
  alt_text: z.string().max(500).optional(),
});

const testSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(100).optional(),
  input_data: z.string().default(""),
  expected_output: z.string().default(""),
  time_limit_ms: z.number().int().positive().default(2000),
  memory_limit_mb: z.number().int().positive().default(128),
  output_type: z.enum(["stdout", "file", "both"]).default("stdout"),
  input_source: z.enum(["stdin", "file"]).default("stdin"),
  input_filename: z.string().optional(),
  output_filename: z.string().optional(),
  points: z.number().min(0).default(0),
  is_visible: z.boolean().default(false),
  sort_order: z.number().int().nonnegative().default(0),
});

const gradingRuleSchema = z.object({
  rule_key: z.string().min(1).max(100),
  rule_value: jsonRecord.default({}),
  points: z.number().min(0).default(0),
  sort_order: z.number().int().nonnegative().default(0),
});

const exerciseSchema = z.object({
  id: z.string().uuid().optional(),
  internal_code: z.string().min(2).max(32),
  title: z.string().max(255).optional(),
  section: sectionEnum,
  exercise_type: exerciseTypeEnum,
  sort_order: z.number().int().nonnegative().default(0),
  max_points: z.number().min(0),
  config: jsonRecord.default({}),
  grading_rules: jsonRecord.default({}),
  default_feedback: z.string().max(2000).optional(),
  images: z.array(imageUploadSchema).default([]),
  tests: z.array(testSchema).default([]),
  rules: z.array(gradingRuleSchema).default([]),
});

const subjectSchema = z.object({
  title: z.string().min(3).max(255),
  session_label: z.string().max(100).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  variant_label: z.string().max(50).optional(),
  profile_id: z.number().int().min(1).max(2).default(1),
  duration_minutes: z.number().int().positive().default(180),
  is_active: z.boolean().default(false),
  points_subject_i: z.number().min(0).default(20),
  points_subject_ii: z.number().min(0).default(40),
  points_subject_iii: z.number().min(0).default(30),
  points_oficiu: z.number().min(0).default(10),
  grade_divisor: z.number().positive().default(10),
  metadata: jsonRecord.default({}),
  exercises: z.array(exerciseSchema).default([]),
});

const saveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      exercise_id: z.string().uuid(),
      answer: jsonRecord,
    }),
  ),
});

const runCodeSchema = z.object({
  code: z.string().min(1).max(100000),
  language: z.enum(["cpp", "c", "pascal", "python"]).default("cpp"),
});

const testOfficialSchema = z.object({
  exercise_id: z.string().uuid(),
  code: z.string().min(1),
  language: z.enum(["cpp", "c", "pascal", "python"]).default("cpp"),
});

async function runExerciseTests(params: {
  exerciseId: string;
  code: string;
  language: "cpp" | "c" | "pascal" | "python";
  includeHidden: boolean;
  submissionId?: string;
}) {
  const exResult = await pgPool.query<{ config: Record<string, unknown> }>(
    `SELECT config FROM bac_exam_exercises WHERE id = $1 LIMIT 1`,
    [params.exerciseId],
  );
  const exercise = exResult.rows[0];
  if (!exercise) {
    throw new Error("NOT_FOUND");
  }

  const testsResult = await pgPool.query(
    `SELECT id, exercise_id, label, input_data, expected_output, time_limit_ms, memory_limit_mb,
            output_type, input_source, input_filename, output_filename,
            points::float8 AS points, is_visible, sort_order
     FROM bac_exam_tests
     WHERE exercise_id = $1
     ORDER BY sort_order`,
    [params.exerciseId],
  );

  const tests = params.includeHidden ? testsResult.rows : testsResult.rows.filter((t) => t.is_visible);
  if (tests.length === 0) {
    throw new Error("NO_TESTS");
  }

  const outcomes = await runTestsOnCode({
    code: params.code,
    language: params.language,
    tests,
    wrapperTemplate: (exercise.config.wrapper_template as string) ?? null,
    exerciseId: params.exerciseId,
    submissionId: params.submissionId,
  });

  const passed = outcomes.filter((t) => t.verdict === "AC").length;
  return {
    passed,
    total: outcomes.length,
    is_full_score: passed === outcomes.length && outcomes.length > 0,
    results: outcomes.map((t) => ({
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

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: string }>(`SELECT role FROM users WHERE id = $1 LIMIT 1`, [userId]);
  return roleResult.rows[0]?.role === "admin";
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await ensureAdminRole(req.user?.id))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  } catch (error) {
    console.error("bac-exam admin check failed:", error);
    res.status(500).json({ error: "Internal error", code: "INTERNAL_ERROR" });
  }
}

async function persistExerciseImages(
  client: PoolClient,
  exerciseId: string,
  images: z.infer<typeof imageUploadSchema>[],
) {
  await client.query(`DELETE FROM bac_exam_exercise_images WHERE exercise_id = $1`, [exerciseId]);
  for (let i = 0; i < images.length; i += 1) {
    const img = images[i];
    const url = await saveBacExamImage(img.file_name, img.file_base64);
    await client.query(
      `INSERT INTO bac_exam_exercise_images (exercise_id, image_url, alt_text, sort_order)
       VALUES ($1, $2, $3, $4)`,
      [exerciseId, url, img.alt_text ?? null, i],
    );
  }
}

async function persistExerciseTests(client: PoolClient, exerciseId: string, tests: z.infer<typeof testSchema>[]) {
  await client.query(`DELETE FROM bac_exam_tests WHERE exercise_id = $1`, [exerciseId]);
  for (const test of tests) {
    await client.query(
      `INSERT INTO bac_exam_tests
         (exercise_id, label, input_data, expected_output, time_limit_ms, memory_limit_mb,
          output_type, input_source, input_filename, output_filename, points, is_visible, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        exerciseId,
        test.label ?? null,
        test.input_data,
        test.expected_output,
        test.time_limit_ms,
        test.memory_limit_mb,
        test.output_type,
        test.input_source,
        test.input_filename ?? null,
        test.output_filename ?? null,
        test.points,
        test.is_visible,
        test.sort_order,
      ],
    );
  }
}

async function persistExerciseRules(client: PoolClient, exerciseId: string, rules: z.infer<typeof gradingRuleSchema>[]) {
  await client.query(`DELETE FROM bac_exam_grading_rules WHERE exercise_id = $1`, [exerciseId]);
  for (const rule of rules) {
    await client.query(
      `INSERT INTO bac_exam_grading_rules (exercise_id, rule_key, rule_value, points, sort_order)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [exerciseId, rule.rule_key, JSON.stringify(rule.rule_value), rule.points, rule.sort_order],
    );
  }
}

async function upsertSubjectWithExercises(payload: z.infer<typeof subjectSchema>, subjectId?: string, userId?: string) {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    let id = subjectId ?? randomUUID();

    if (subjectId) {
      await client.query(
        `UPDATE bac_exam_subjects
         SET title=$2, session_label=$3, year=$4, variant_label=$5, profile_id=$6, duration_minutes=$7,
             is_active=$8, points_subject_i=$9, points_subject_ii=$10, points_subject_iii=$11,
             points_oficiu=$12, grade_divisor=$13, metadata=$14::jsonb, updated_at=NOW()
         WHERE id=$1`,
        [
          subjectId,
          payload.title,
          payload.session_label ?? null,
          payload.year ?? null,
          payload.variant_label ?? null,
          payload.profile_id,
          payload.duration_minutes,
          payload.is_active,
          payload.points_subject_i,
          payload.points_subject_ii,
          payload.points_subject_iii,
          payload.points_oficiu,
          payload.grade_divisor,
          JSON.stringify(payload.metadata),
        ],
      );
      await client.query(`DELETE FROM bac_exam_exercises WHERE subject_id = $1`, [subjectId]);
    } else {
      await client.query(
        `INSERT INTO bac_exam_subjects
           (id, title, session_label, year, variant_label, profile_id, duration_minutes, is_active,
            points_subject_i, points_subject_ii, points_subject_iii, points_oficiu, grade_divisor, metadata, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15)`,
        [
          id,
          payload.title,
          payload.session_label ?? null,
          payload.year ?? null,
          payload.variant_label ?? null,
          payload.profile_id,
          payload.duration_minutes,
          payload.is_active,
          payload.points_subject_i,
          payload.points_subject_ii,
          payload.points_subject_iii,
          payload.points_oficiu,
          payload.grade_divisor,
          JSON.stringify(payload.metadata),
          userId ?? null,
        ],
      );
    }

    for (const exercise of payload.exercises) {
      const exerciseId = exercise.id ?? randomUUID();
      await client.query(
        `INSERT INTO bac_exam_exercises
           (id, subject_id, internal_code, title, section, exercise_type, sort_order, max_points, config, grading_rules, default_feedback)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11)`,
        [
          exerciseId,
          id,
          exercise.internal_code,
          exercise.title ?? null,
          exercise.section,
          exercise.exercise_type,
          exercise.sort_order,
          exercise.max_points,
          JSON.stringify(exercise.config),
          JSON.stringify(exercise.grading_rules),
          exercise.default_feedback ?? null,
        ],
      );
      await persistExerciseImages(client, exerciseId, exercise.images);
      await persistExerciseTests(client, exerciseId, exercise.tests);
      await persistExerciseRules(client, exerciseId, exercise.rules);
    }

    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function mapPublicExercise(
  exercise: {
    id: string;
    internal_code: string;
    title: string | null;
    section: string;
    exercise_type: string;
    sort_order: number;
    max_points: number;
    config: Record<string, unknown>;
    default_feedback: string | null;
  },
  images: Array<{ exercise_id: string; image_url: string; alt_text: string | null; sort_order: number }>,
  tests: Array<{ exercise_id: string; is_visible: boolean }>,
  forStudent: boolean,
) {
  const exerciseImages = images.filter((img) => img.exercise_id === exercise.id);
  const visibleTestsCount = tests.filter((t) => t.exercise_id === exercise.id && t.is_visible).length;
  const config = { ...exercise.config };
  if (forStudent) {
    delete config.correct_answer;
    delete config.expected_output;
    delete config.reference_code;
    delete config.wrapper_template;
    delete config.official_solution;
  }
  return {
    id: exercise.id,
    internal_code: exercise.internal_code,
    title: exercise.title,
    section: exercise.section,
    exercise_type: exercise.exercise_type,
    sort_order: exercise.sort_order,
    max_points: exercise.max_points,
    config,
    default_feedback: forStudent ? null : exercise.default_feedback,
    images: exerciseImages.map((img) => ({ url: img.image_url, alt: img.alt_text })),
    visible_tests_count: visibleTestsCount,
  };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

bacExamRouter.get("/admin/subjects", requireAuth, requireAdmin, async (_req, res) => {
  try {
    await ensureBacExamTables();
    const result = await pgPool.query(
      `SELECT id, title, session_label, year, variant_label, profile_id, duration_minutes, is_active,
              points_subject_i, points_subject_ii, points_subject_iii, points_oficiu, grade_divisor,
              created_at::text, updated_at::text
       FROM bac_exam_subjects
       ORDER BY year DESC NULLS LAST, created_at DESC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("bac-exam list subjects:", error);
    res.status(500).json({ error: "Failed to list subjects", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.get("/admin/subjects/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureBacExamTables();
    const bundle = await loadSubjectBundle(routeParamString(req.params.id));
    if (!bundle) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }
    res.json({
      data: {
        subject: bundle.subject,
        exercises: bundle.exercises.map((ex) => ({
          ...ex,
          images: bundle.images.filter((img) => img.exercise_id === ex.id),
          tests: bundle.tests.filter((t) => t.exercise_id === ex.id),
          rules: bundle.rules.filter((r) => r.exercise_id === ex.id),
        })),
      },
    });
  } catch (error) {
    console.error("bac-exam get subject:", error);
    res.status(500).json({ error: "Failed to load subject", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.post("/admin/subjects", requireAuth, requireAdmin, validateBody(subjectSchema), async (req, res) => {
  try {
    await ensureBacExamTables();
    const id = await upsertSubjectWithExercises(req.body, undefined, req.user?.id);
    res.status(201).json({ data: { id } });
  } catch (error) {
    console.error("bac-exam create subject:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Create failed", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.put("/admin/subjects/:id", requireAuth, requireAdmin, validateBody(subjectSchema), async (req, res) => {
  try {
    await ensureBacExamTables();
    const id = await upsertSubjectWithExercises(req.body, routeParamString(req.params.id), req.user?.id);
    res.json({ data: { id } });
  } catch (error) {
    console.error("bac-exam update subject:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Update failed", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.post("/admin/test-official", requireAuth, requireAdmin, validateBody(testOfficialSchema), async (req, res) => {
  try {
    await ensureBacExamTables();
    const { exercise_id, code, language } = req.body as z.infer<typeof testOfficialSchema>;
    const data = await runExerciseTests({
      exerciseId: exercise_id,
      code,
      language,
      includeHidden: true,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Exercise not found", code: "NOT_FOUND" });
      return;
    }
    if (error instanceof Error && error.message === "NO_TESTS") {
      res.status(400).json({ error: "Nu exista teste configurate.", code: "NO_TESTS" });
      return;
    }
    console.error("bac-exam test official:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Test failed", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.post("/exercises/:id/run", requireAuth, validateBody(runCodeSchema), async (req, res) => {
  try {
    await ensureBacExamTables();
    const exerciseId = routeParamString(req.params.id);
    const { code, language } = req.body as z.infer<typeof runCodeSchema>;
    const isAdmin = await ensureAdminRole(req.user?.id);
    const data = await runExerciseTests({
      exerciseId,
      code,
      language,
      includeHidden: isAdmin,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      res.status(404).json({ error: "Exercise not found", code: "NOT_FOUND" });
      return;
    }
    if (error instanceof Error && error.message === "NO_TESTS") {
      res.status(400).json({
        error: "Nu exista teste vizibile pentru rulare. Marcheaza cel putin un test ca vizibil in admin.",
        code: "NO_TESTS",
      });
      return;
    }
    console.error("bac-exam run code:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Run failed", code: "INTERNAL_ERROR" });
  }
});

// ─── Student / public ────────────────────────────────────────────────────────

bacExamRouter.get("/subjects", async (_req, res) => {
  try {
    await ensureBacExamTables();
    const result = await pgPool.query(
      `SELECT id, title, session_label, year, variant_label, profile_id, duration_minutes
       FROM bac_exam_subjects
       WHERE is_active = TRUE
       ORDER BY year DESC NULLS LAST, title ASC`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("bac-exam public subjects:", error);
    res.status(500).json({ error: "Failed to list subjects", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.get("/subjects/:id", async (req, res) => {
  try {
    await ensureBacExamTables();
    const bundle = await loadSubjectBundle(routeParamString(req.params.id));
    if (!bundle || !bundle.subject.is_active) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }
    res.json({
      data: {
        subject: {
          id: bundle.subject.id,
          title: bundle.subject.title,
          session_label: bundle.subject.session_label,
          year: bundle.subject.year,
          variant_label: bundle.subject.variant_label,
          profile_id: bundle.subject.profile_id,
          duration_minutes: bundle.subject.duration_minutes,
          points_subject_i: bundle.subject.points_subject_i,
          points_subject_ii: bundle.subject.points_subject_ii,
          points_subject_iii: bundle.subject.points_subject_iii,
          points_oficiu: bundle.subject.points_oficiu,
          grade_divisor: bundle.subject.grade_divisor,
        },
        exercises: bundle.exercises.map((ex) => mapPublicExercise(ex, bundle.images, bundle.tests, true)),
      },
    });
  } catch (error) {
    console.error("bac-exam get public subject:", error);
    res.status(500).json({ error: "Failed to load subject", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.post("/subjects/:id/start", requireAuth, async (req, res) => {
  try {
    await ensureBacExamTables();
    const subjectId = routeParamString(req.params.id);
    const exists = await pgPool.query(`SELECT id FROM bac_exam_subjects WHERE id = $1 AND is_active = TRUE`, [subjectId]);
    if (!exists.rows[0]) {
      res.status(404).json({ error: "Subject not found", code: "NOT_FOUND" });
      return;
    }
    const created = await pgPool.query<{ id: string }>(
      `INSERT INTO bac_exam_submissions (subject_id, user_id, status, started_at)
       VALUES ($1, $2, 'in_progress', NOW())
       RETURNING id`,
      [subjectId, req.user!.id],
    );
    res.status(201).json({ data: { submission_id: created.rows[0]?.id } });
  } catch (error) {
    console.error("bac-exam start:", error);
    res.status(500).json({ error: "Failed to start exam", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.get("/admin/submissions/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureBacExamTables();
    const submissionId = routeParamString(req.params.id);
    const result = await pgPool.query(
      `SELECT s.id, s.subject_id, s.user_id, s.status, s.started_at::text, s.finished_at::text, s.submitted_at::text,
              s.total_points::float8 AS total_points, s.final_grade::float8 AS final_grade,
              sub.title AS subject_title, sub.duration_minutes
       FROM bac_exam_submissions s
       JOIN bac_exam_subjects sub ON sub.id = s.subject_id
       WHERE s.id = $1
       LIMIT 1`,
      [submissionId],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }

    const results = await pgPool.query(
      `SELECT exercise_id, awarded_points::float8 AS awarded_points, max_points::float8 AS max_points,
              breakdown, feedback, test_results
       FROM bac_exam_submission_results WHERE submission_id = $1`,
      [submissionId],
    );

    res.json({ data: { submission: row, results: results.rows } });
  } catch (error) {
    console.error("bac-exam admin get submission:", error);
    res.status(500).json({ error: "Failed to load submission", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.get("/submissions/:id", requireAuth, async (req, res) => {
  try {
    await ensureBacExamTables();
    const submissionId = routeParamString(req.params.id);
    const isAdmin = await ensureAdminRole(req.user?.id);
    const result = await pgPool.query(
      `SELECT s.id, s.subject_id, s.status, s.started_at::text, s.finished_at::text, s.submitted_at::text,
              s.total_points::float8 AS total_points, s.final_grade::float8 AS final_grade,
              sub.title AS subject_title, sub.duration_minutes
       FROM bac_exam_submissions s
       JOIN bac_exam_subjects sub ON sub.id = s.subject_id
       WHERE s.id = $1 AND (s.user_id = $2 OR $3 = TRUE)
       LIMIT 1`,
      [submissionId, req.user!.id, isAdmin],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }

    const answers = await pgPool.query(
      `SELECT exercise_id, answer FROM bac_exam_submission_answers WHERE submission_id = $1`,
      [submissionId],
    );
    const results = await pgPool.query(
      `SELECT exercise_id, awarded_points::float8 AS awarded_points, max_points::float8 AS max_points,
              breakdown, feedback, test_results
       FROM bac_exam_submission_results WHERE submission_id = $1`,
      [submissionId],
    );

    res.json({ data: { submission: row, answers: answers.rows, results: results.rows } });
  } catch (error) {
    console.error("bac-exam get submission:", error);
    res.status(500).json({ error: "Failed to load submission", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.put("/submissions/:id/answers", requireAuth, validateBody(saveAnswersSchema), async (req, res) => {
  try {
    await ensureBacExamTables();
    const submissionId = routeParamString(req.params.id);
    const owned = await pgPool.query(
      `SELECT id, status FROM bac_exam_submissions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [submissionId, req.user!.id],
    );
    const submission = owned.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }
    if (submission.status !== "in_progress") {
      res.status(400).json({ error: "Submisia nu mai poate fi modificata.", code: "INVALID_STATUS" });
      return;
    }

    const payload = req.body as z.infer<typeof saveAnswersSchema>;
    for (const item of payload.answers) {
      await pgPool.query(
        `INSERT INTO bac_exam_submission_answers (submission_id, exercise_id, answer, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (submission_id, exercise_id) DO UPDATE
         SET answer = EXCLUDED.answer, updated_at = NOW()`,
        [submissionId, item.exercise_id, JSON.stringify(item.answer)],
      );
    }
    res.json({ data: { saved: true } });
  } catch (error) {
    console.error("bac-exam save answers:", error);
    res.status(500).json({ error: "Failed to save answers", code: "INTERNAL_ERROR" });
  }
});

bacExamRouter.post("/submissions/:id/submit", requireAuth, async (req, res) => {
  try {
    await ensureBacExamTables();
    const submissionId = routeParamString(req.params.id);
    const owned = await pgPool.query(
      `SELECT id, status FROM bac_exam_submissions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [submissionId, req.user!.id],
    );
    const submission = owned.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
      return;
    }
    if (submission.status !== "in_progress") {
      res.status(400).json({ error: "Deja trimis.", code: "INVALID_STATUS" });
      return;
    }

    await pgPool.query(
      `UPDATE bac_exam_submissions SET status = 'submitted', submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [submissionId],
    );

    const grade = await gradeSubmission(submissionId);
    res.json({ data: grade });
  } catch (error) {
    console.error("bac-exam submit:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Submit failed", code: "INTERNAL_ERROR" });
  }
});

const overrideSchema = z.object({
  exercise_id: z.string().uuid(),
  new_points: z.number().min(0),
  reason: z.string().max(2000).optional(),
});

bacExamRouter.post(
  "/admin/submissions/:id/override",
  requireAuth,
  requireAdmin,
  validateBody(overrideSchema),
  async (req, res) => {
    try {
      await ensureBacExamTables();
      const submissionId = routeParamString(req.params.id);
      const { exercise_id, new_points, reason } = req.body as z.infer<typeof overrideSchema>;

      const current = await pgPool.query<{ awarded_points: number; max_points: number }>(
        `SELECT awarded_points::float8 AS awarded_points, max_points::float8 AS max_points
         FROM bac_exam_submission_results
         WHERE submission_id = $1 AND exercise_id = $2
         LIMIT 1`,
        [submissionId, exercise_id],
      );
      const row = current.rows[0];
      if (!row) {
        res.status(404).json({ error: "Rezultat negasit", code: "NOT_FOUND" });
        return;
      }

      const cappedPoints = Math.min(new_points, Number(row.max_points));

      await pgPool.query(
        `INSERT INTO bac_exam_manual_overrides
           (submission_id, exercise_id, reviewer_user_id, previous_points, new_points, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [submissionId, exercise_id, req.user!.id, row.awarded_points, cappedPoints, reason ?? null],
      );

      await pgPool.query(
        `UPDATE bac_exam_submission_results
         SET awarded_points = $3, feedback = COALESCE(feedback, '') || ' [Ajustat manual de admin]', updated_at = NOW()
         WHERE submission_id = $1 AND exercise_id = $2`,
        [submissionId, exercise_id, cappedPoints],
      );

      const totals = await recalculateSubmissionTotals(submissionId);
      res.json({ data: { exercise_id, awarded_points: cappedPoints, ...totals } });
    } catch (error) {
      console.error("bac-exam override:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Override failed", code: "INTERNAL_ERROR" });
    }
  },
);

bacExamRouter.get("/exercise-types", (_req, res) => {
  res.json({
    data: BAC_EXAM_EXERCISE_TYPES.map((type) => ({
      id: type,
      label: type.replaceAll("_", " "),
      implemented: true,
    })),
  });
});
