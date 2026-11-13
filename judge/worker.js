const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const { readFile, writeFile } = require("fs").promises;
const { join } = require("path");
const { Pool } = require("pg");
const vm = require("vm");
const { getCompileInvocation } = require("./compilers");
const { initBox, cleanupBox, compileInSandbox, executeInSandbox } = require("./sandbox");
const { runPlayground } = require("./playground");
const { startInteractiveServer } = require("./interactive");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/zecelainfo",
});

function normalizePoints(rawWeights, total = 100) {
  const n = rawWeights.length;
  if (n === 0) return [];

  const sum = rawWeights.reduce((acc, w) => acc + Math.max(0, Number(w) || 0), 0);
  if (sum <= 0) return rawWeights.map(() => 0);

  const totalCents = Math.round(total * 100);
  const exactCents = rawWeights.map((w) => (Math.max(0, Number(w) || 0) / sum) * totalCents);
  const flooredCents = exactCents.map((v) => Math.floor(v));
  let remainder = totalCents - flooredCents.reduce((acc, v) => acc + v, 0);

  const byRemainingFraction = exactCents
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const resultCents = [...flooredCents];
  for (let k = 0; k < byRemainingFraction.length && remainder > 0; k += 1, remainder -= 1) {
    resultCents[byRemainingFraction[k].i] += 1;
  }

  return resultCents.map((c) => c / 100);
}

function normalizeOutput(output) {
  return output
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n");
}

function mapFinalStatus(testResults, score) {
  const verdicts = testResults.map((test) => test.verdict);
  if (verdicts.includes("CE")) return "compile_error";
  if (verdicts.includes("RE")) return "runtime_error";
  if (verdicts.includes("TLE")) return "time_limit";
  if (verdicts.every((value) => value === "AC")) return "accepted";
  if (score > 0) return "partial";
  return "wrong_answer";
}

const FUNCTION_TEMPLATE_KEY_BY_LANGUAGE = {
  cpp: "function_template_cpp",
  c: "function_template_c",
  pascal: "function_template_pascal",
  python: "function_template_python",
};

function buildEffectiveCode(problemConfig, userCode, language) {
  if (problemConfig.solution_mode !== "function") {
    return userCode;
  }
  const perLanguageTemplate = problemConfig[FUNCTION_TEMPLATE_KEY_BY_LANGUAGE[language]];
  const template = perLanguageTemplate || problemConfig.function_template || "";
  if (template.includes("__USER_CODE__")) {
    return template.split("__USER_CODE__").join(userCode);
  }
  return `${template}\n\n${userCode}`;
}

async function ensureProblemIoColumns(client) {
  await client.query(`
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

function isAcceptedOutput(problem, input, expectedOutput, actualOutput) {
  if (problem.checker_mode !== "custom") {
    return normalizeOutput(actualOutput || "") === normalizeOutput(expectedOutput || "");
  }
  const checkerCode = problem.checker_code || "";
  const sandbox = {
    input: input || "",
    expectedOutput: expectedOutput || "",
    actualOutput: actualOutput || "",
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
  if (typeof sandbox.result === "boolean") return sandbox.result;
  if (sandbox.result && typeof sandbox.result === "object" && "ok" in sandbox.result) return Boolean(sandbox.result.ok);
  return Boolean(sandbox.result);
}

async function runSubmittedProgram({ language, boxId, boxPath, boxWorkDir, input, timeLimitMs, memoryLimitMb, ioConfig }) {
  const command = language === "python" ? "/usr/bin/python3" : "./solution";
  const args = language === "python" ? [`solution.py`] : [];

  const isFileInput = ioConfig.input_source === "file";
  const execution = await executeInSandbox({
    boxId,
    boxPath,
    boxWorkDir,
    command,
    args,
    stdinContent: isFileInput ? "" : input || "",
    fileInputName: isFileInput ? (ioConfig.input_filename || "input.txt").trim() : undefined,
    fileInputContent: isFileInput ? input || "" : undefined,
    timeLimitMs,
    memoryLimitMb,
  });

  let actualOutput = execution.stdout || "";
  if (execution.verdict === "OK" && ioConfig.output_target === "file") {
    const outputFileName = (ioConfig.output_filename || "output.txt").trim();
    try {
      actualOutput = await readFile(join(boxWorkDir, outputFileName), "utf8");
    } catch {
      actualOutput = "";
    }
  }

  return { ...execution, actualOutput };
}

const worker = new Worker(
  "submissions",
  async (job) => {
    const { submissionId } = job.data;
    const client = await pool.connect();
    let boxId;

    try {
      console.log(`[judge] Received submission ${submissionId}`);
      await client.query(`UPDATE submissions SET status = 'running' WHERE id = $1`, [submissionId]);

      const submissionResult = await client.query(
        `SELECT id, problem_id, code, language FROM submissions WHERE id = $1 LIMIT 1`,
        [submissionId],
      );
      const submission = submissionResult.rows[0];
      if (!submission) {
        console.error(`[judge] Submission ${submissionId} not found`);
        return;
      }

      await ensureProblemIoColumns(client);
      const problemResult = await client.query(
        `SELECT id, time_limit_ms, memory_limit_mb, input_source, output_target, input_filename, output_filename, solution_mode, function_template,
                function_template_cpp, function_template_c, function_template_pascal, function_template_python,
                checker_mode, checker_code
         FROM problems
         WHERE id = $1
         LIMIT 1`,
        [submission.problem_id],
      );
      const problem = problemResult.rows[0];
      if (!problem) {
        console.error(`[judge] Problem ${submission.problem_id} not found`);
        return;
      }

      const testsResult = await client.query(
        `SELECT id, input, expected_output, points, is_sample
         FROM test_cases
         WHERE problem_id = $1
         ORDER BY order_index ASC`,
        [submission.problem_id],
      );
      const tests = testsResult.rows;
      if (tests.length === 0) {
        await client.query(
          `UPDATE submissions
           SET status = 'accepted', score = 100, test_results = '[]'::jsonb
           WHERE id = $1`,
          [submissionId],
        );
        return;
      }

      const box = await initBox();
      boxId = box.boxId;
      const extensionByLanguage = {
        cpp: "cpp",
        c: "c",
        pascal: "pas",
        python: "py",
      };
      const extension = extensionByLanguage[submission.language];
      const sourceFileName = `solution.${extension}`;
      const effectiveCode = buildEffectiveCode(problem, submission.code, submission.language);
      await writeFile(join(box.boxWorkDir, sourceFileName), effectiveCode, "utf8");

      if (submission.language !== "python") {
        const invocation = getCompileInvocation({ language: submission.language, sourceFileName });
        const compileResult = await compileInSandbox({
          boxId: box.boxId,
          boxPath: box.boxPath,
          boxWorkDir: box.boxWorkDir,
          command: invocation.command,
          args: invocation.args,
        });
        if (compileResult.verdict !== "OK") {
          await client.query(
            `UPDATE submissions
             SET status = 'compile_error', score = 0, compile_error_message = $2, test_results = '[]'::jsonb
             WHERE id = $1`,
            [submissionId, String(compileResult.stderr || compileResult.stdout || compileResult.meta.message || "Compilation failed")],
          );
          return;
        }
      }

      const testResults = [];
      let score = 0;
      const timeLimitMs = Number(problem.time_limit_ms || 1000);
      const memoryLimitMb = Number(problem.memory_limit_mb || 64);
      const normalizedMaxPoints = normalizePoints(tests.map((test) => Number(test.points || 0)));

      for (const [index, test] of tests.entries()) {
        const maxPoints = normalizedMaxPoints[index];
        const execution = await runSubmittedProgram({
          language: submission.language,
          boxId: box.boxId,
          boxPath: box.boxPath,
          boxWorkDir: box.boxWorkDir,
          input: test.input,
          timeLimitMs,
          memoryLimitMb,
          ioConfig: problem,
        });

        if (execution.verdict !== "OK") {
          testResults.push({
            test_id: test.id,
            verdict: execution.verdict === "TLE" ? "TLE" : "RE",
            time_ms: execution.timeMs,
            memory_kb: execution.memoryKb,
            points: 0,
            max_points: maxPoints,
            is_sample: Boolean(test.is_sample),
          });
          continue;
        }

        const isAccepted = isAcceptedOutput(problem, test.input, test.expected_output || "", execution.actualOutput || "");
        const verdict = isAccepted ? "AC" : "WA";
        const points = isAccepted ? maxPoints : 0;
        score += points;

        testResults.push({
          test_id: test.id,
          verdict,
          time_ms: execution.timeMs,
          memory_kb: execution.memoryKb,
          points,
          max_points: maxPoints,
          is_sample: Boolean(test.is_sample),
        });
      }

      const normalizedScore = Math.round(score);
      const finalStatus = mapFinalStatus(testResults, normalizedScore);

      await client.query(
        `UPDATE submissions
         SET status = $2, score = $3, test_results = $4::jsonb
         WHERE id = $1`,
        [submissionId, finalStatus, normalizedScore, JSON.stringify(testResults)],
      );

      console.log(`[judge] Submission ${submissionId} evaluated with score ${normalizedScore}`);
    } finally {
      client.release();
      if (boxId !== undefined) {
        await cleanupBox(boxId);
      }
    }
  },
  { connection },
);

worker.on("ready", () => {
  console.log("[judge] worker ready");
});

worker.on("failed", (job, err) => {
  const jobId = job && job.id ? job.id : "unknown";
  console.error(`[judge] submission ${jobId} failed:`, err);
});

const playgroundWorker = new Worker(
  "playground",
  async (job) => runPlayground(job.data),
  { connection, concurrency: 4 },
);

playgroundWorker.on("ready", () => {
  console.log("[judge] playground worker ready");
});

playgroundWorker.on("failed", (job, err) => {
  const jobId = job && job.id ? job.id : "unknown";
  console.error(`[judge] playground job ${jobId} failed:`, err);
});

startInteractiveServer(Number(process.env.INTERACTIVE_WS_PORT) || 4100);
