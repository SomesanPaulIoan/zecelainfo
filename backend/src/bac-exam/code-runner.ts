import { createHash } from "node:crypto";
import { pgPool } from "../db/postgres";
import { compareWithExpected, runCodeLocally } from "../services/local-run.service";
import type { BacExamTestRow } from "./types";

type RunCodeInput = {
  code: string;
  language?: "cpp" | "c" | "pascal" | "python";
  tests: BacExamTestRow[];
  wrapperTemplate?: string | null;
  submissionId?: string;
  exerciseId?: string;
};

export type BacCodeTestOutcome = {
  test_id: string;
  label: string | null;
  verdict: "AC" | "WA" | "TLE" | "RE" | "CE";
  points: number;
  max_points: number;
  time_ms: number;
  stdout: string;
  stderr: string;
  expected_output: string;
  is_visible: boolean;
};

function buildEffectiveCode(userCode: string, wrapperTemplate?: string | null): string {
  const template = wrapperTemplate?.trim() ?? "";
  if (!template) return userCode;
  if (template.includes("__USER_CODE__")) {
    return template.replaceAll("__USER_CODE__", userCode);
  }
  if (template.includes("// DE_COMPLETAT")) {
    return template.replace("// DE_COMPLETAT", userCode);
  }
  return `${template}\n\n${userCode}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function logCodeRun(params: {
  submissionId?: string;
  exerciseId?: string;
  testId: string | null;
  language: string;
  code: string;
  verdict: string;
  stdout: string;
  stderr: string;
  timeMs: number;
}) {
  if (!params.submissionId) return;
  const codeHash = createHash("sha256").update(params.code).digest("hex").slice(0, 16);
  const testId = params.testId && UUID_RE.test(params.testId) ? params.testId : null;
  await pgPool.query(
    `INSERT INTO bac_exam_code_runs
       (submission_id, exercise_id, test_id, language, code_hash, verdict, stdout, stderr, time_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      params.submissionId,
      params.exerciseId ?? null,
      testId,
      params.language,
      codeHash,
      params.verdict,
      params.stdout,
      params.stderr,
      params.timeMs,
    ],
  );
}

export async function runTestsOnCode(input: RunCodeInput): Promise<BacCodeTestOutcome[]> {
  const language = input.language ?? "cpp";
  const effectiveCode = buildEffectiveCode(input.code, input.wrapperTemplate);
  const outcomes: BacCodeTestOutcome[] = [];

  for (const test of input.tests) {
    const io = {
      input_source: test.input_source,
      output_target: test.output_type === "file" ? ("file" as const) : ("stdout" as const),
      input_filename: test.input_filename,
      output_filename: test.output_filename,
    };

    const execution = await runCodeLocally({
      language,
      code: effectiveCode,
      input: test.input_data,
      timeLimitMs: test.time_limit_ms,
      io,
    });

    let verdict = execution.verdict;
    if (verdict === "AC" && !compareWithExpected(execution.stdout, test.expected_output)) {
      verdict = "WA";
    }

    const maxPoints = Number(test.points || 0);
    const earned = verdict === "AC" ? maxPoints : 0;

    await logCodeRun({
      submissionId: input.submissionId,
      exerciseId: input.exerciseId,
      testId: test.id,
      language,
      code: effectiveCode,
      verdict,
      stdout: execution.stdout,
      stderr: execution.stderr,
      timeMs: execution.timeMs,
    });

    outcomes.push({
      test_id: test.id,
      label: test.label,
      verdict,
      points: earned,
      max_points: maxPoints,
      time_ms: execution.timeMs,
      stdout: execution.stdout,
      stderr: execution.stderr,
      expected_output: test.expected_output,
      is_visible: test.is_visible,
    });
  }

  return outcomes;
}

export type InlineTestSpec = {
  label?: string;
  input_data?: string;
  expected_output?: string;
  time_limit_ms?: number;
  memory_limit_mb?: number;
  output_type?: "stdout" | "file" | "both";
  input_source?: "stdin" | "file";
  input_filename?: string | null;
  output_filename?: string | null;
};

export async function runInlineTestsOnCode(input: {
  code: string;
  language?: "cpp" | "c" | "pascal" | "python";
  tests: InlineTestSpec[];
  wrapperTemplate?: string | null;
  submissionId?: string;
  exerciseId?: string;
  labelPrefix?: string;
}): Promise<BacCodeTestOutcome[]> {
  const language = input.language ?? "cpp";
  const effectiveCode = buildEffectiveCode(input.code, input.wrapperTemplate);
  const outcomes: BacCodeTestOutcome[] = [];

  for (let i = 0; i < input.tests.length; i += 1) {
    const test = input.tests[i];
    const io = {
      input_source: test.input_source ?? ("stdin" as const),
      output_target: test.output_type === "file" ? ("file" as const) : ("stdout" as const),
      input_filename: test.input_filename,
      output_filename: test.output_filename,
    };

    const execution = await runCodeLocally({
      language,
      code: effectiveCode,
      input: test.input_data ?? "",
      timeLimitMs: test.time_limit_ms ?? 2000,
      io,
    });

    let verdict = execution.verdict;
    if (verdict === "AC" && !compareWithExpected(execution.stdout, test.expected_output ?? "")) {
      verdict = "WA";
    }

    const testId = `inline-${input.labelPrefix ?? "t"}-${i}`;

    await logCodeRun({
      submissionId: input.submissionId,
      exerciseId: input.exerciseId,
      testId: null,
      language,
      code: effectiveCode,
      verdict,
      stdout: execution.stdout,
      stderr: execution.stderr,
      timeMs: execution.timeMs,
    });

    outcomes.push({
      test_id: testId,
      label: test.label ?? `${input.labelPrefix ?? "test"}-${i + 1}`,
      verdict,
      points: verdict === "AC" ? 1 : 0,
      max_points: 1,
      time_ms: execution.timeMs,
      stdout: execution.stdout,
      stderr: execution.stderr,
      expected_output: test.expected_output ?? "",
      is_visible: true,
    });
  }

  return outcomes;
}
