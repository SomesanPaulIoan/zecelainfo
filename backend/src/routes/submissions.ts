import { Router, type NextFunction, type Request, type Response } from "express";
import vm from "node:vm";
import { z } from "zod";
import { pgPool } from "../db/postgres";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { compareWithExpected, runCodeLocally } from "../services/local-run.service";
import { validateBody } from "../middleware/validate";
import { submissionsQueue } from "../queue/submission.queue";
import { normalizePoints } from "../utils/points";

async function ensureAdminRole(userId?: string) {
  const roleResult = await pgPool.query<{ role: "student" | "professor" | "admin" }>(
    `SELECT role FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const role = roleResult.rows[0]?.role;
  return role === "admin";
}

const uuidParamSchema = z.string().uuid();

/** Respinge cu 400 rutele admin cu parametri care nu sunt UUID-uri (altfel Postgres arunca si raspundem 500). */
function requireUuidParams(...names: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const name of names) {
      if (!uuidParamSchema.safeParse(req.params[name]).success) {
        res.status(400).json({ error: `Invalid ${name}`, code: "VALIDATION_ERROR" });
        return;
      }
    }
    next();
  };
}

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed = await ensureAdminRole(req.user?.id);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  } catch (error) {
    console.error("Failed to authorize submissions route:", error);
    res.status(500).json({ error: "Failed to authorize", code: "INTERNAL_ERROR" });
  }
}

const createSubmissionSchema = z.object({
  problem_id: z.string().uuid(),
  code: z.string().min(1).max(100000),
  language: z.enum(["cpp", "c", "pascal", "python"]),
});
const runSubmissionSchema = createSubmissionSchema.extend({
  stdin: z.string().max(200000).optional(),
  mode: z.enum(["custom", "samples"]).default("custom"),
});

export const submissionsRouter = Router();

type ProblemIoConfig = {
  input_source: "stdin" | "file";
  output_target: "stdout" | "file";
  input_filename: string | null;
  output_filename: string | null;
  solution_mode: "full" | "function";
  function_template: string | null;
  function_template_cpp: string | null;
  function_template_c: string | null;
  function_template_pascal: string | null;
  function_template_python: string | null;
  checker_mode: "exact" | "custom";
  checker_code: string | null;
};

async function ensureProblemIoColumns() {
  await pgPool.query(`
    ALTER TABLE problems
      ADD COLUMN IF NOT EXISTS input_source TEXT NOT NULL DEFAULT 'stdin' CHECK (input_source IN ('stdin', 'file')),
      ADD COLUMN IF NOT EXISTS output_target TEXT NOT NULL DEFAULT 'stdout' CHECK (output_target IN ('stdout', 'file')),
      ADD COLUMN IF NOT EXISTS input_filename TEXT,
      ADD COLUMN IF NOT EXISTS output_filename TEXT,
      ADD COLUMN IF NOT EXISTS solution_mode TEXT NOT NULL DEFAULT 'full' CHECK (solution_mode IN ('full', 'function')),
      ADD COLUMN IF NOT EXISTS function_template TEXT,
      ADD COLUMN IF NOT EXISTS function_template_cpp TEXT,
      ADD COLUMN IF NOT EXISTS function_template_c TEXT,
      ADD COLUMN IF NOT EXISTS function_template_pascal TEXT,
      ADD COLUMN IF NOT EXISTS function_template_python TEXT,
      ADD COLUMN IF NOT EXISTS checker_mode TEXT NOT NULL DEFAULT 'exact' CHECK (checker_mode IN ('exact', 'custom')),
      ADD COLUMN IF NOT EXISTS checker_code TEXT
  `);
}

async function getProblemIoConfig(problemId: string): Promise<ProblemIoConfig> {
  await ensureProblemIoColumns();
  const result = await pgPool.query<ProblemIoConfig>(
    `SELECT input_source, output_target, input_filename, output_filename, solution_mode, function_template,
            function_template_cpp, function_template_c, function_template_pascal, function_template_python,
            checker_mode, checker_code
     FROM problems
     WHERE id = $1
     LIMIT 1`,
    [problemId],
  );
  return (
    result.rows[0] ?? {
      input_source: "stdin",
      output_target: "stdout",
      input_filename: null,
      output_filename: null,
      solution_mode: "full",
      function_template: null,
      function_template_cpp: null,
      function_template_c: null,
      function_template_pascal: null,
      function_template_python: null,
      checker_mode: "exact",
      checker_code: null,
    }
  );
}

const FUNCTION_TEMPLATE_KEY_BY_LANGUAGE = {
  cpp: "function_template_cpp",
  c: "function_template_c",
  pascal: "function_template_pascal",
  python: "function_template_python",
} as const;

function buildEffectiveCode(problemConfig: ProblemIoConfig, userCode: string, language: "cpp" | "c" | "pascal" | "python"): string {
  if (problemConfig.solution_mode !== "function") {
    return userCode;
  }
  const perLanguageTemplate = problemConfig[FUNCTION_TEMPLATE_KEY_BY_LANGUAGE[language]];
  const template = perLanguageTemplate ?? problemConfig.function_template ?? "";
  if (template.includes("__USER_CODE__")) {
    return template.replaceAll("__USER_CODE__", userCode);
  }
  return `${template}\n\n${userCode}`;
}

function isAcceptedOutput(config: ProblemIoConfig, input: string, expectedOutput: string, actualOutput: string): boolean {
  if (config.checker_mode !== "custom") {
    return compareWithExpected(actualOutput, expectedOutput);
  }
  const checkerCode = config.checker_code ?? "";
  const sandbox: Record<string, unknown> = {
    input,
    expectedOutput,
    actualOutput,
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
  const result = sandbox.result;
  if (typeof result === "boolean") return result;
  if (typeof result === "object" && result && "ok" in result) return Boolean((result as { ok: boolean }).ok);
  return Boolean(result);
}

submissionsRouter.post("/run", validateBody(runSubmissionSchema), async (req, res) => {
  try {
    const { problem_id, code, language, stdin, mode } = req.body;
    const ioConfig = await getProblemIoConfig(problem_id);
    const effectiveCode = buildEffectiveCode(ioConfig, code, language);
    if (mode === "custom") {
      const execution = await runCodeLocally({
        language,
        code: effectiveCode,
        input: stdin ?? "",
        timeLimitMs: 3000,
        io: ioConfig,
      });

      res.json({
        data: {
          verdict: execution.verdict,
          time_ms: execution.timeMs,
          stdout: execution.stdout,
          stderr: execution.stderr,
        },
      });
      return;
    }

    const testsResult = await pgPool.query(
      `SELECT id, input, expected_output, points, is_sample
       FROM test_cases
       WHERE problem_id = $1 AND is_sample = true
       ORDER BY order_index ASC`,
      [problem_id],
    );

    const sampleTests = testsResult.rows;
    if (sampleTests.length === 0) {
      res.status(400).json({
        error: "No sample tests available for this problem",
        code: "NO_SAMPLE_TESTS",
      });
      return;
    }

    const runResults = [];
    let score = 0;
    const normalizedMaxPoints = normalizePoints(sampleTests.map((test) => Number(test.points || 0)));
    let finalStatus: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error" = "accepted";

    for (const [index, test] of sampleTests.entries()) {
      const maxPoints = normalizedMaxPoints[index];
      const execution = await runCodeLocally({
        language,
        code: effectiveCode,
        input: test.input,
        timeLimitMs: 2000,
        io: ioConfig,
      });

      let verdict: "AC" | "WA" | "TLE" | "RE" | "CE" = execution.verdict;
      if (verdict === "AC" && !isAcceptedOutput(ioConfig, test.input, test.expected_output, execution.stdout)) {
        verdict = "WA";
      }

      const earnedPoints = verdict === "AC" ? maxPoints : 0;
      score += earnedPoints;

      if (verdict === "CE") finalStatus = "compile_error";
      else if (verdict === "RE" && finalStatus !== "compile_error") finalStatus = "runtime_error";
      else if (verdict === "TLE" && !["compile_error", "runtime_error"].includes(finalStatus)) finalStatus = "time_limit";
      else if (verdict === "WA" && finalStatus === "accepted") finalStatus = "wrong_answer";

      runResults.push({
        test_id: test.id,
        verdict,
        points: earnedPoints,
        max_points: maxPoints,
        time_ms: execution.timeMs,
        memory_kb: 0,
        is_sample: true,
        stdout: execution.stdout,
        stderr: execution.stderr,
        expected_output: test.expected_output,
      });
    }

    const normalizedScore = Math.round(score);
    if (normalizedScore === 100) {
      finalStatus = "accepted";
    } else if (finalStatus === "accepted") {
      finalStatus = "wrong_answer";
    }

    res.json({
      data: {
        status: finalStatus,
        score: normalizedScore,
        test_results: runResults,
      },
    });
  } catch (error) {
    console.error("Run failed:", error);
    res.status(500).json({ error: "Run failed", code: "INTERNAL_ERROR" });
  }
});

submissionsRouter.post("/", requireAuth, validateBody(createSubmissionSchema), async (req, res) => {
  const userId = req.user!.id;
  const payload = {
    user_id: userId,
    problem_id: req.body.problem_id,
    code: req.body.code,
    language: req.body.language,
    status: "pending",
  };

  try {
    const result = await pgPool.query<{ id: string }>(
      `INSERT INTO submissions (user_id, problem_id, code, language, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [payload.user_id, payload.problem_id, payload.code, payload.language, payload.status],
    );
    const submissionId = result.rows[0]?.id;
    if (!submissionId) {
      res.status(400).json({ error: "Submit failed", code: "CREATE_FAILED" });
      return;
    }

    await submissionsQueue.add("evaluate", { submissionId });
    res.status(201).json({ data: { submission_id: submissionId } });
  } catch (error) {
    console.error("Submit failed:", error);
    res.status(400).json({ error: "Submit failed", code: "CREATE_FAILED" });
  }
});

submissionsRouter.get("/problem/:problemId", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  try {
    const result = await pgPool.query(
      `SELECT id, status, score, language, created_at
       FROM submissions
       WHERE problem_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [req.params.problemId, userId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions", code: "INTERNAL_ERROR" });
  }
});

submissionsRouter.get("/meta/solved-problems", optionalAuth, async (req, res) => {
  if (!req.user) {
    res.json({ data: [] });
    return;
  }
  const userId = req.user.id;
  try {
    const result = await pgPool.query<{ problem_id: string }>(
      `SELECT DISTINCT problem_id
       FROM submissions
       WHERE user_id = $1 AND status = 'accepted'`,
      [userId],
    );
    res.json({ data: result.rows.map((row) => row.problem_id) });
  } catch (error) {
    console.error("Failed to fetch solved problems:", error);
    res.status(500).json({ error: "Failed to fetch solved problems", code: "INTERNAL_ERROR" });
  }
});

submissionsRouter.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const countsResult = await pgPool.query<{
      submissions_today: number;
      submissions_7d: number;
      submissions_30d: number;
      submissions_total: number;
      accepted_submissions_total: number;
      accepted_submissions_30d: number;
      solved_total: number;
      solved_30d: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE s.created_at >= CURRENT_DATE)::int AS submissions_today,
         COUNT(*) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days')::int AS submissions_7d,
         COUNT(*) FILTER (WHERE s.created_at >= NOW() - INTERVAL '30 days')::int AS submissions_30d,
         COUNT(*)::int AS submissions_total,
         COUNT(*) FILTER (WHERE s.status = 'accepted')::int AS accepted_submissions_total,
         COUNT(*) FILTER (WHERE s.status = 'accepted' AND s.created_at >= NOW() - INTERVAL '30 days')::int AS accepted_submissions_30d,
         COUNT(DISTINCT s.problem_id) FILTER (WHERE s.status = 'accepted')::int AS solved_total,
         COUNT(DISTINCT s.problem_id) FILTER (WHERE s.status = 'accepted' AND s.created_at >= NOW() - INTERVAL '30 days')::int AS solved_30d
       FROM submissions s
       WHERE s.user_id = $1`,
      [userId],
    );

    // Rata de succes = media incercarilor per problema rezolvata, numarand doar incercarile
    // pana la (si inclusiv) prima solutie de 100 de puncte a fiecarei probleme — orice
    // incercare ulterioara primei rezolvari nu mai conteaza (nici esuata, nici corecta).
    const attemptsResult = await pgPool.query<{
      total_attempts_to_first_solve: number;
      solved_total: number;
    }>(
      `WITH first_ac AS (
         SELECT problem_id, MIN(created_at) AS first_ac_at
         FROM submissions
         WHERE user_id = $1 AND status = 'accepted'
         GROUP BY problem_id
       ),
       attempts_until_first_ac AS (
         SELECT fa.problem_id, COUNT(*)::int AS attempts
         FROM first_ac fa
         JOIN submissions s
           ON s.user_id = $1
          AND s.problem_id = fa.problem_id
          AND s.created_at <= fa.first_ac_at
         GROUP BY fa.problem_id
       )
       SELECT
         COALESCE(SUM(attempts), 0)::int AS total_attempts_to_first_solve,
         COUNT(*)::int AS solved_total
       FROM attempts_until_first_ac`,
      [userId],
    );

    const counts = countsResult.rows[0] ?? {
      submissions_today: 0,
      submissions_7d: 0,
      submissions_30d: 0,
      submissions_total: 0,
      accepted_submissions_total: 0,
      accepted_submissions_30d: 0,
      solved_total: 0,
      solved_30d: 0,
    };
    const attempts = attemptsResult.rows[0] ?? { total_attempts_to_first_solve: 0, solved_total: 0 };

    // Rata de succes (%) = numarul de probleme rezolvate / numarul de incercari numarate
    // (fiecare problema rezolvata contribuie exact 1 succes din cele k incercari pana la
    // prima solutie de 100%) * 100.
    const successRate =
      attempts.total_attempts_to_first_solve > 0
        ? (attempts.solved_total / attempts.total_attempts_to_first_solve) * 100
        : 0;

    res.json({
      data: {
        ...counts,
        success_rate_overall: Number(successRate.toFixed(2)),
        success_rate_30d: Number(successRate.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Failed to fetch submission dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch submission dashboard stats", code: "INTERNAL_ERROR" });
  }
});

/** Clasele (grupele) de meditatii cu elevii lor si statisticile lor pentru o problema anume (doar admin). */
submissionsRouter.get("/admin/problem/:problemId/roster", requireAuth, requireAdmin, requireUuidParams("problemId"), async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT
         g.id,
         g.name,
         g.weekday,
         to_char(g.start_time, 'HH24:MI') AS start_time,
         to_char(g.end_time, 'HH24:MI') AS end_time,
         COUNT(m.user_id)::int AS members_count,
         COALESCE(
           json_agg(
             json_build_object(
               'user_id', u.id,
               'email', u.email,
               'username', u.username,
               'first_name', u.first_name,
               'last_name', u.last_name,
               'full_name', u.full_name,
               'attempts_count', COALESCE(stats.attempts_count, 0),
               'best_score', stats.best_score,
               'last_submitted_at', stats.last_submitted_at
             ) ORDER BY u.full_name NULLS LAST, u.email ASC
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'::json
         ) AS members
       FROM meditation_groups g
       LEFT JOIN meditation_group_memberships m ON m.group_id = g.id
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS attempts_count, MAX(s.score)::int AS best_score, MAX(s.created_at)::text AS last_submitted_at
         FROM submissions s
         WHERE s.user_id = u.id AND s.problem_id = $1
       ) stats ON true
       GROUP BY g.id
       ORDER BY g.weekday ASC, g.start_time ASC`,
      [req.params.problemId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch admin problem roster:", error);
    res.status(500).json({ error: "Failed to fetch roster", code: "INTERNAL_ERROR" });
  }
});

/** Toate incercarile unui elev la o problema anume (doar admin). */
submissionsRouter.get("/admin/problem/:problemId/students/:userId", requireAuth, requireAdmin, requireUuidParams("problemId", "userId"), async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT id, status, score, language, created_at
       FROM submissions
       WHERE problem_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [req.params.problemId, req.params.userId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to fetch admin student submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions", code: "INTERNAL_ERROR" });
  }
});

/** Codul complet al unei incercari, indiferent de autor (doar admin) — pentru revizuirea temelor elevilor. */
submissionsRouter.get("/admin/:id", requireAuth, requireAdmin, requireUuidParams("id"), async (req, res) => {
  try {
    const result = await pgPool.query(
      `SELECT id, status, score, language, code, test_results, compile_error_message, created_at
       FROM submissions
       WHERE id = $1
       LIMIT 1`,
      [req.params.id],
    );
    const submission = result.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: submission });
  } catch (error) {
    console.error("Failed to fetch admin submission:", error);
    res.status(500).json({ error: "Failed to fetch submission", code: "INTERNAL_ERROR" });
  }
});

submissionsRouter.get("/:id", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  try {
    const result = await pgPool.query(
      `SELECT id, status, score, language, code, test_results, ai_feedback, compile_error_message
       FROM submissions
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [req.params.id, userId],
    );
    const submission = result.rows[0];
    if (!submission) {
      res.status(404).json({ error: "Submission not found", code: "NOT_FOUND" });
      return;
    }
    res.json({ data: submission });
  } catch (error) {
    console.error("Failed to fetch submission:", error);
    res.status(500).json({ error: "Failed to fetch submission", code: "INTERNAL_ERROR" });
  }
});
