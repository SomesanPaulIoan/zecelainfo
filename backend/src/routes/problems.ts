import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { compareWithExpected, runCodeLocally } from "../services/local-run.service";
import { normalizePoints } from "../utils/points";

const createProblemSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  statement: z.string().min(10),
  official_solution: z.string().min(10).default("Soluția oficială va fi publicată în curând."),
  input_format: z.string().default(""),
  output_format: z.string().default(""),
  constraints: z.string().default(""),
  difficulty: z.enum(["easy", "medium", "hard", "facultate"]),
  time_limit_ms: z.number().int().positive().default(1000),
  memory_limit_mb: z.number().int().positive().default(64),
  tags: z.array(z.string()).default([]),
  input_source: z.enum(["stdin", "file"]).default("stdin"),
  output_target: z.enum(["stdout", "file"]).default("stdout"),
  input_filename: z.string().min(1).optional(),
  output_filename: z.string().min(1).optional(),
  curriculum_level: z.enum(["grade9", "grade10", "grade11", "bacalaureat", "oop"]),
  curriculum_chapter_id: z.string().min(1),
  curriculum_subcategory_id: z.string().min(1),
  solution_mode: z.enum(["full", "function"]).default("full"),
  function_template: z.string().optional(),
  checker_mode: z.enum(["exact", "custom"]).default("exact"),
  checker_code: z.string().optional(),
});

export const problemsRouter = Router();

const importTestSchema = z.object({
  input: z.string(),
  expected_output: z.string(),
  is_sample: z.boolean().default(false),
  points: z.number().int().nonnegative().default(0),
  order_index: z.number().int().nonnegative().default(0),
});

const importProblemSchema = createProblemSchema.extend({
  source: z.string().min(2).optional(),
  tests: z.array(importTestSchema).min(1),
});

const importDraftSchema = z.object({
  payload: importProblemSchema,
});

const adminTestOfficialSchema = z.object({
  language: z.enum(["cpp", "c", "pascal", "python"]),
  payload: importProblemSchema,
  official_solution: z.string().min(1),
});

type ImportProblemPayload = z.infer<typeof importProblemSchema>;
const updateProblemSchema = createProblemSchema.extend({
  tests: z.array(importTestSchema).min(1),
});

type UpdateProblemPayload = z.infer<typeof updateProblemSchema>;

const updateProblemTextSchema = z.object({
  title: z.string().min(3),
  statement: z.string().min(10),
  hints: z.string().optional().default(""),
  explanation: z.string().optional().default(""),
});

type UpdateProblemTextPayload = z.infer<typeof updateProblemTextSchema>;

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role === "admin";
}

/** Doar dupa `requireAuth` — lista publica de probleme (GET /) nu trece pe aici. */
async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  } catch (error) {
    console.error("Failed to authorize problems route:", error);
    res.status(500).json({ error: "Failed to authorize", code: "INTERNAL_ERROR" });
  }
}

async function ensureImportTables() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS problem_import_drafts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      payload JSONB NOT NULL,
      validation_report JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
      created_problem_id UUID REFERENCES problems(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function ensureProblemIoColumns() {
  await pgPool.query(`
    ALTER TABLE problems
      ADD COLUMN IF NOT EXISTS input_source TEXT NOT NULL DEFAULT 'stdin' CHECK (input_source IN ('stdin', 'file')),
      ADD COLUMN IF NOT EXISTS output_target TEXT NOT NULL DEFAULT 'stdout' CHECK (output_target IN ('stdout', 'file')),
      ADD COLUMN IF NOT EXISTS input_filename TEXT,
      ADD COLUMN IF NOT EXISTS output_filename TEXT,
      ADD COLUMN IF NOT EXISTS curriculum_level TEXT CHECK (curriculum_level IN ('grade9', 'grade10', 'grade11', 'bacalaureat', 'oop')),
      ADD COLUMN IF NOT EXISTS curriculum_chapter_id TEXT,
      ADD COLUMN IF NOT EXISTS curriculum_subcategory_id TEXT,
      ADD COLUMN IF NOT EXISTS solution_mode TEXT NOT NULL DEFAULT 'full' CHECK (solution_mode IN ('full', 'function')),
      ADD COLUMN IF NOT EXISTS function_template TEXT,
      ADD COLUMN IF NOT EXISTS function_signature JSONB,
      ADD COLUMN IF NOT EXISTS function_template_cpp TEXT,
      ADD COLUMN IF NOT EXISTS function_template_c TEXT,
      ADD COLUMN IF NOT EXISTS function_template_pascal TEXT,
      ADD COLUMN IF NOT EXISTS function_template_python TEXT,
      ADD COLUMN IF NOT EXISTS function_stub_cpp TEXT,
      ADD COLUMN IF NOT EXISTS function_stub_c TEXT,
      ADD COLUMN IF NOT EXISTS function_stub_pascal TEXT,
      ADD COLUMN IF NOT EXISTS function_stub_python TEXT,
      ADD COLUMN IF NOT EXISTS checker_mode TEXT NOT NULL DEFAULT 'exact' CHECK (checker_mode IN ('exact', 'custom')),
      ADD COLUMN IF NOT EXISTS checker_code TEXT,
      ADD COLUMN IF NOT EXISTS hints TEXT,
      ADD COLUMN IF NOT EXISTS explanation TEXT,
      ADD COLUMN IF NOT EXISTS official_solution_cpp TEXT,
      ADD COLUMN IF NOT EXISTS official_solution_python TEXT
  `);
}

const FUNCTION_TEMPLATE_COLUMN_BY_LANGUAGE: Record<"cpp" | "c" | "pascal" | "python", string> = {
  cpp: "function_template_cpp",
  c: "function_template_c",
  pascal: "function_template_pascal",
  python: "function_template_python",
};

function validateImportPayload(payload: ImportProblemPayload) {
  const checks: Array<{ key: string; ok: boolean; message: string }> = [];
  const sampleCount = payload.tests.filter((test) => test.is_sample).length;
  const totalPoints = payload.tests.reduce((acc, test) => acc + Number(test.points || 0), 0);

  checks.push({
    key: "samples",
    ok: sampleCount >= 1,
    message: sampleCount >= 1 ? `OK: ${sampleCount} sample tests` : "Trebuie minim un sample test",
  });
  checks.push({
    key: "curriculum",
    ok: Boolean(payload.curriculum_level && payload.curriculum_chapter_id?.trim() && payload.curriculum_subcategory_id?.trim()),
    message:
      Boolean(payload.curriculum_level && payload.curriculum_chapter_id?.trim() && payload.curriculum_subcategory_id?.trim())
        ? "OK: categorie curriculara setata"
        : "Categoria curriculara (nivel/capitol/subcategorie) este obligatorie",
  });
  checks.push({
    key: "function-template",
    ok: payload.solution_mode === "full" || Boolean(payload.function_template?.trim()),
    message:
      payload.solution_mode === "full" || Boolean(payload.function_template?.trim())
        ? "OK: template functie valid"
        : "Pentru modul function trebuie completat codul template",
  });
  checks.push({
    key: "checker",
    ok: payload.checker_mode === "exact" || Boolean(payload.checker_code?.trim()),
    message:
      payload.checker_mode === "exact" || Boolean(payload.checker_code?.trim())
        ? "OK: checker valid"
        : "Pentru checker custom trebuie completat checker_code",
  });
  checks.push({
    key: "io-input-filename",
    ok: payload.input_source === "stdin" || Boolean(payload.input_filename?.trim()),
    message:
      payload.input_source === "stdin" || Boolean(payload.input_filename?.trim())
        ? "OK: configuratie input valida"
        : "Pentru input din fisier trebuie completat numele fisierului de input",
  });
  checks.push({
    key: "io-output-filename",
    ok: payload.output_target === "stdout" || Boolean(payload.output_filename?.trim()),
    message:
      payload.output_target === "stdout" || Boolean(payload.output_filename?.trim())
        ? "OK: configuratie output valida"
        : "Pentru output in fisier trebuie completat numele fisierului de output",
  });
  checks.push({
    key: "points",
    ok: totalPoints > 0,
    message: totalPoints > 0 ? `OK: total puncte ${totalPoints}` : "Total puncte trebuie sa fie > 0",
  });
  checks.push({
    key: "slug-format",
    ok: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug),
    message: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug) ? "OK: slug valid" : "Slug invalid (foloseste kebab-case)",
  });
  checks.push({
    key: "official-solution",
    ok: payload.official_solution.trim().length >= 10,
    message: payload.official_solution.trim().length >= 10 ? "OK: solutie oficiala prezenta" : "Lipseste solutia oficiala",
  });

  const isValid = checks.every((check) => check.ok);
  return { is_valid: isValid, checks, summary: isValid ? "Draft valid pentru aprobare" : "Draft invalid - corecteaza erorile" };
}

problemsRouter.get("/", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const difficulty = typeof req.query.difficulty === "string" ? req.query.difficulty : undefined;
  const page = Number(req.query.page ?? 1);
  const rawLimit = Number(req.query.limit ?? 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 1000) : 500;
  const offset = (page - 1) * limit;

  const clauses: string[] = ["is_published = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (difficulty) {
    clauses.push(`difficulty = $${idx}`);
    params.push(difficulty);
    idx += 1;
  }

  if (search) {
    clauses.push(`(title ILIKE $${idx} OR slug ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx += 1;
  }

  const whereSql = `WHERE ${clauses.join(" AND ")}`;
  const dataSql = `
    SELECT id, slug, title, difficulty, tags, time_limit_ms, memory_limit_mb, source, created_at,
           curriculum_level, curriculum_chapter_id, curriculum_subcategory_id
    FROM problems
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${idx}
    OFFSET $${idx + 1}
  `;
  const countSql = `SELECT COUNT(*)::int AS total FROM problems ${whereSql}`;

  try {
    await ensureProblemIoColumns();
    const [dataResult, countResult] = await Promise.all([
      pgPool.query(dataSql, [...params, limit, offset]),
      pgPool.query<{ total: number }>(countSql, params),
    ]);

    res.json({
      data: {
        problems: dataResult.rows,
        total: countResult.rows[0]?.total ?? 0,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch problems:", error);
    res.status(500).json({ error: "Failed to fetch problems", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.get("/admin/list", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureProblemIoColumns();

    const result = await pgPool.query(
      `SELECT
         id, slug, title, difficulty, tags, source, is_published, created_at,
         time_limit_ms, memory_limit_mb, input_source, output_target, input_filename, output_filename,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, checker_mode
       FROM problems
       ORDER BY created_at DESC
       LIMIT 500`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch admin problems list:", error);
    res.status(500).json({ error: "Failed to fetch admin problems list", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.put("/admin/:id", requireAuth, requireAdmin, validateBody(updateProblemSchema), async (req, res) => {
  try {
    await ensureProblemIoColumns();

    const payload = req.body as UpdateProblemPayload;
    const updateResult = await pgPool.query(
      `UPDATE problems
       SET title = $2,
           slug = $3,
           statement = $4,
           official_solution = $5,
           input_format = $6,
           output_format = $7,
           constraints = $8,
           difficulty = $9,
           time_limit_ms = $10,
           memory_limit_mb = $11,
           tags = $12,
           input_source = $13,
           output_target = $14,
           input_filename = $15,
           output_filename = $16,
           curriculum_level = $17,
           curriculum_chapter_id = $18,
           curriculum_subcategory_id = $19,
           solution_mode = $20,
           function_template = $21,
           checker_mode = $22,
           checker_code = $23,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, slug, updated_at`,
      [
        req.params.id,
        payload.title,
        payload.slug,
        payload.statement,
        payload.official_solution,
        payload.input_format,
        payload.output_format,
        payload.constraints,
        payload.difficulty,
        payload.time_limit_ms,
        payload.memory_limit_mb,
        payload.tags,
        payload.input_source,
        payload.output_target,
        payload.input_filename ?? null,
        payload.output_filename ?? null,
        payload.curriculum_level,
        payload.curriculum_chapter_id,
        payload.curriculum_subcategory_id,
        payload.solution_mode,
        payload.function_template ?? null,
        payload.checker_mode,
        payload.checker_code ?? null,
      ],
    );
    const updated = updateResult.rows[0];
    if (!updated) {
      res.status(404).json({ error: "Problem not found", code: "NOT_FOUND" });
      return;
    }

    await pgPool.query(`DELETE FROM test_cases WHERE problem_id = $1`, [req.params.id]);
    for (const [index, test] of payload.tests.entries()) {
      await pgPool.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, test.input, test.expected_output, test.is_sample, test.points, test.order_index ?? index + 1],
      );
    }
    res.json({ data: updated });
  } catch (error) {
    console.error("Failed to update problem:", error);
    res.status(500).json({ error: "Failed to update problem", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.put(
  "/admin/:id/text",
  requireAuth,
  requireAdmin,
  validateBody(updateProblemTextSchema),
  async (req, res) => {
    try {
      const payload = req.body as UpdateProblemTextPayload;
      const updateResult = await pgPool.query(
        `UPDATE problems
       SET title = $2,
           statement = $3,
           hints = $4,
           explanation = $5,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, statement, hints, explanation, updated_at`,
        [req.params.id, payload.title, payload.statement, payload.hints || null, payload.explanation || null],
      );
      const updated = updateResult.rows[0];
      if (!updated) {
        res.status(404).json({ error: "Problem not found", code: "NOT_FOUND" });
        return;
      }
      res.json({ data: updated });
    } catch (error) {
      console.error("Failed to update problem text:", error);
      res.status(500).json({ error: "Failed to update problem text", code: "INTERNAL_ERROR" });
    }
  },
);

problemsRouter.get("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureProblemIoColumns();

    const result = await pgPool.query(
      `SELECT
         id, title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, tags, source, input_source, output_target,
         input_filename, output_filename, curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         solution_mode, function_template, checker_mode, checker_code, is_published, created_at
       FROM problems
       WHERE id = $1
       LIMIT 1`,
      [req.params.id],
    );
    const problem = result.rows[0];
    if (!problem) {
      res.status(404).json({ error: "Problem not found", code: "NOT_FOUND" });
      return;
    }

    const testsResult = await pgPool.query(
      `SELECT input, expected_output, is_sample, points, order_index
       FROM test_cases
       WHERE problem_id = $1
       ORDER BY order_index ASC`,
      [req.params.id],
    );

    res.json({ data: { ...problem, tests: testsResult.rows } });
  } catch (error) {
    console.error("Failed to fetch admin problem:", error);
    res.status(500).json({ error: "Failed to fetch admin problem", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.delete("/admin/:id", requireAuth, requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    await ensureImportTables();

    await client.query("BEGIN");
    await client.query(
      `UPDATE problem_import_drafts
       SET created_problem_id = NULL, updated_at = NOW()
       WHERE created_problem_id = $1`,
      [req.params.id],
    );

    const result = await client.query(
      `DELETE FROM problems
       WHERE id = $1
       RETURNING id, title`,
      [req.params.id],
    );
    const deleted = result.rows[0];
    if (!deleted) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Problem not found", code: "NOT_FOUND" });
      return;
    }

    await client.query("COMMIT");
    res.json({ data: deleted });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to delete problem:", error);
    res.status(500).json({ error: "Failed to delete problem", code: "INTERNAL_ERROR" });
  } finally {
    client.release();
  }
});

problemsRouter.get("/:slug", async (req, res, next) => {
  const { slug } = req.params;
  if (slug === "import-drafts" || slug === "import-draft") {
    next();
    return;
  }
  try {
    await ensureProblemIoColumns();
    const problemResult = await pgPool.query(
      `SELECT
         id, slug, title, statement, official_solution, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, source, video_solution_url, tags, allowed_languages,
         is_published, author_id, created_at, updated_at, input_source, output_target, input_filename, output_filename,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id,
         hints, explanation, official_solution_cpp, official_solution_python,
         solution_mode, function_signature,
         function_stub_cpp, function_stub_c, function_stub_pascal, function_stub_python
       FROM problems
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug],
    );
    const problem = problemResult.rows[0];

    if (!problem) {
      res.status(404).json({ error: "Problem not found", code: "NOT_FOUND" });
      return;
    }

    const sampleTestsResult = await pgPool.query(
      `SELECT id, input, expected_output, is_sample, points
       FROM test_cases
       WHERE problem_id = $1 AND is_sample = true
       ORDER BY order_index ASC`,
      [problem.id],
    );

    res.json({
      data: {
        ...problem,
        sample_tests: sampleTestsResult.rows,
      },
    });
  } catch (error) {
    console.error("Failed to fetch problem:", error);
    res.status(500).json({ error: "Failed to fetch problem", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.post("/", requireAuth, requireAdmin, validateBody(createProblemSchema), async (req, res) => {
  try {
    await ensureProblemIoColumns();
    const insertResult = await pgPool.query(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, tags, input_source, output_target, input_filename, output_filename,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, function_template, checker_mode, checker_code, author_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [
        req.body.title,
        req.body.slug,
        req.body.statement,
        req.body.official_solution,
        req.body.input_format,
        req.body.output_format,
        req.body.constraints,
        req.body.difficulty,
        req.body.time_limit_ms,
        req.body.memory_limit_mb,
        req.body.tags,
        req.body.input_source,
        req.body.output_target,
        req.body.input_filename ?? null,
        req.body.output_filename ?? null,
        req.body.curriculum_level,
        req.body.curriculum_chapter_id,
        req.body.curriculum_subcategory_id,
        req.body.solution_mode,
        req.body.function_template ?? null,
        req.body.checker_mode,
        req.body.checker_code ?? null,
        req.user?.id,
      ],
    );

    res.status(201).json({ data: insertResult.rows[0] });
  } catch (error) {
    console.error("Create problem failed:", error);
    res.status(400).json({ error: "Create failed", code: "CREATE_FAILED" });
  }
});

problemsRouter.get("/import-drafts", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureImportTables();
    await ensureProblemIoColumns();

    const result = await pgPool.query(
      `SELECT id, payload, validation_report, status, created_problem_id, created_at, updated_at
       FROM problem_import_drafts
       ORDER BY created_at DESC
       LIMIT 50`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch import drafts:", error);
    res.status(500).json({ error: "Failed to fetch import drafts", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.post("/import-draft", requireAuth, requireAdmin, validateBody(importDraftSchema), async (req, res) => {
  try {
    await ensureImportTables();
    await ensureProblemIoColumns();

    const payload = req.body.payload as ImportProblemPayload;
    const validationReport = validateImportPayload(payload);
    const slugExists = await pgPool.query<{ id: string }>(`SELECT id FROM problems WHERE slug = $1 LIMIT 1`, [payload.slug]);
    if (slugExists.rows[0]) {
      validationReport.is_valid = false;
      validationReport.checks.push({ key: "slug-unique", ok: false, message: "Slug deja existent in baza de date" });
      validationReport.summary = "Draft invalid - slug duplicat";
    } else {
      validationReport.checks.push({ key: "slug-unique", ok: true, message: "OK: slug disponibil" });
    }

    const insertResult = await pgPool.query(
      `INSERT INTO problem_import_drafts (author_id, payload, validation_report, status)
       VALUES ($1, $2::jsonb, $3::jsonb, 'draft')
       RETURNING id, validation_report, status, created_at`,
      [req.user?.id ?? null, JSON.stringify(payload), JSON.stringify(validationReport)],
    );
    res.status(201).json({ data: insertResult.rows[0] });
  } catch (error) {
    console.error("Failed to create import draft:", error);
    res.status(500).json({ error: "Failed to create import draft", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.post("/import-drafts/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const client = await pgPool.connect();
  try {
    await ensureImportTables();

    const draftResult = await client.query<{
      id: string;
      payload: ImportProblemPayload;
      validation_report: { is_valid: boolean };
      status: "draft" | "approved" | "rejected";
    }>(
      `SELECT id, payload, validation_report, status
       FROM problem_import_drafts
       WHERE id = $1
       LIMIT 1`,
      [req.params.id],
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      res.status(404).json({ error: "Draft not found", code: "NOT_FOUND" });
      return;
    }
    if (draft.status !== "draft") {
      res.status(400).json({ error: "Draft already processed", code: "INVALID_STATE" });
      return;
    }
    if (!draft.validation_report?.is_valid) {
      res.status(400).json({ error: "Draft is not valid", code: "INVALID_DRAFT" });
      return;
    }

    await client.query("BEGIN");
    const payload = draft.payload;
    const createProblemResult = await client.query<{ id: string }>(
      `INSERT INTO problems (
         title, slug, statement, official_solution, input_format, output_format, constraints,
         difficulty, time_limit_ms, memory_limit_mb, tags, source, input_source, output_target, input_filename, output_filename,
         curriculum_level, curriculum_chapter_id, curriculum_subcategory_id, solution_mode, function_template, checker_mode, checker_code, author_id, is_published
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,true)
       RETURNING id`,
      [
        payload.title,
        payload.slug,
        payload.statement,
        payload.official_solution,
        payload.input_format,
        payload.output_format,
        payload.constraints,
        payload.difficulty,
        payload.time_limit_ms,
        payload.memory_limit_mb,
        payload.tags,
        payload.source ?? "Sursa interna",
        payload.input_source,
        payload.output_target,
        payload.input_filename ?? null,
        payload.output_filename ?? null,
        payload.curriculum_level,
        payload.curriculum_chapter_id,
        payload.curriculum_subcategory_id,
        payload.solution_mode,
        payload.function_template ?? null,
        payload.checker_mode,
        payload.checker_code ?? null,
        req.user?.id ?? null,
      ],
    );
    const problemId = createProblemResult.rows[0]?.id;
    if (!problemId) {
      throw new Error("Problem creation failed");
    }

    for (const test of payload.tests) {
      await client.query(
        `INSERT INTO test_cases (problem_id, input, expected_output, is_sample, points, order_index)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [problemId, test.input, test.expected_output, test.is_sample, test.points, test.order_index],
      );
    }

    await client.query(
      `UPDATE problem_import_drafts
       SET status = 'approved', created_problem_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [draft.id, problemId],
    );
    await client.query("COMMIT");
    res.json({ data: { draft_id: draft.id, created_problem_id: problemId, status: "approved" } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to approve draft:", error);
    res.status(500).json({ error: "Failed to approve draft", code: "INTERNAL_ERROR" });
  } finally {
    client.release();
  }
});

problemsRouter.post("/import-drafts/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    await ensureImportTables();

    const draftResult = await pgPool.query<{ id: string; status: "draft" | "approved" | "rejected" }>(
      `SELECT id, status
       FROM problem_import_drafts
       WHERE id = $1
       LIMIT 1`,
      [req.params.id],
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      res.status(404).json({ error: "Draft not found", code: "NOT_FOUND" });
      return;
    }
    if (draft.status !== "draft") {
      res.status(400).json({ error: "Draft already processed", code: "INVALID_STATE" });
      return;
    }

    await pgPool.query(
      `UPDATE problem_import_drafts
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1`,
      [draft.id],
    );

    res.json({ data: { draft_id: draft.id, status: "rejected" } });
  } catch (error) {
    console.error("Failed to reject draft:", error);
    res.status(500).json({ error: "Failed to reject draft", code: "INTERNAL_ERROR" });
  }
});

problemsRouter.post("/admin/test-official", requireAuth, requireAdmin, validateBody(adminTestOfficialSchema), async (req, res) => {
  try {
    const payload = req.body.payload as ImportProblemPayload;
    const language = req.body.language as "cpp" | "c" | "pascal" | "python";
    const officialSolution = String(req.body.official_solution ?? "");
    const ioConfig = {
      input_source: payload.input_source,
      output_target: payload.output_target,
      input_filename: payload.input_filename ?? null,
      output_filename: payload.output_filename ?? null,
      solution_mode: payload.solution_mode,
      function_template: payload.function_template ?? null,
      checker_mode: payload.checker_mode,
      checker_code: payload.checker_code ?? null,
    } as const;
    const effectiveCode =
      ioConfig.solution_mode === "function"
        ? ioConfig.function_template?.includes("__USER_CODE__")
          ? ioConfig.function_template.replaceAll("__USER_CODE__", officialSolution)
          : `${ioConfig.function_template ?? ""}\n\n${officialSolution}`
        : officialSolution;

    const testResults: Array<{
      verdict: "AC" | "WA" | "TLE" | "RE" | "CE";
      points: number;
      max_points: number;
      time_ms: number;
      stderr: string;
    }> = [];
    let earnedPoints = 0;
    let finalStatus: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error" = "accepted";
    const normalizedMaxPoints = normalizePoints(payload.tests.map((test) => Number(test.points || 0)));

    for (const [testIndex, test] of payload.tests.entries()) {
      const maxPoints = normalizedMaxPoints[testIndex];
      const execution = await runCodeLocally({
        language,
        code: effectiveCode,
        input: test.input,
        timeLimitMs: payload.time_limit_ms,
        io: ioConfig,
      });

      let verdict: "AC" | "WA" | "TLE" | "RE" | "CE" = execution.verdict;
      if (verdict === "AC") {
        if (ioConfig.checker_mode === "custom") {
          const vm = await import("node:vm");
          const checkerCode = ioConfig.checker_code ?? "";
          const sandbox: Record<string, unknown> = {
            input: test.input,
            expectedOutput: test.expected_output,
            actualOutput: execution.stdout,
            result: false,
          };
          const script = new vm.Script(`
${checkerCode}
if (typeof check !== "function") {
  throw new Error("Checker custom trebuie sa defineasca functia check({ input, expectedOutput, actualOutput }).");
}
result = check({ input, expectedOutput, actualOutput });
`);
          script.runInNewContext(sandbox, { timeout: 100 });
          const checkerResult = sandbox.result;
          const accepted =
            typeof checkerResult === "boolean"
              ? checkerResult
              : Boolean(
                  checkerResult &&
                    typeof checkerResult === "object" &&
                    "ok" in (checkerResult as { ok: boolean })
                    ? (checkerResult as { ok: boolean }).ok
                    : checkerResult,
                );
          if (!accepted) verdict = "WA";
        } else if (!compareWithExpected(execution.stdout, test.expected_output)) {
          verdict = "WA";
        }
      }
      const points = verdict === "AC" ? maxPoints : 0;
      earnedPoints += points;
      if (verdict === "CE") finalStatus = "compile_error";
      else if (verdict === "RE" && finalStatus !== "compile_error") finalStatus = "runtime_error";
      else if (verdict === "TLE" && !["compile_error", "runtime_error"].includes(finalStatus)) finalStatus = "time_limit";
      else if (verdict === "WA" && finalStatus === "accepted") finalStatus = "wrong_answer";

      testResults.push({
        verdict,
        points,
        max_points: maxPoints,
        time_ms: execution.timeMs,
        stderr: execution.stderr,
      });
    }

    const score = Math.round(earnedPoints);
    if (score === 100) finalStatus = "accepted";
    else if (finalStatus === "accepted") finalStatus = "wrong_answer";

    res.json({
      data: {
        status: finalStatus,
        score,
        is_full_score: score === 100,
        tests: testResults,
      },
    });
  } catch (error) {
    console.error("Failed to test official solution:", error);
    res.status(500).json({ error: "Failed to test official solution", code: "INTERNAL_ERROR" });
  }
});
