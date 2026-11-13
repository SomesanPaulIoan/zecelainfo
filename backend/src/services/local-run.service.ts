import { runInPlaygroundSandbox } from "./playground-run.service";

type Language = "cpp" | "c" | "pascal" | "python";

type RunInput = {
  language: Language;
  code: string;
  input: string;
  timeLimitMs: number;
  io: {
    input_source: "stdin" | "file";
    output_target: "stdout" | "file";
    input_filename?: string | null;
    output_filename?: string | null;
  };
};

export type RunResult = {
  verdict: "AC" | "WA" | "TLE" | "RE" | "CE";
  stdout: string;
  stderr: string;
  timeMs: number;
};

function normalizeOutput(output: string): string {
  return output
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n");
}

/** Runs a problem's custom/sample execution through the judge's isolate sandbox (see judge/playground.js), not locally. */
export async function runCodeLocally({ language, code, input, timeLimitMs, io }: RunInput): Promise<RunResult> {
  const result = await runInPlaygroundSandbox({
    language,
    code,
    stdin: input,
    inputSource: io.input_source,
    inputFilename: io.input_filename,
    outputTarget: io.output_target,
    outputFilename: io.output_filename,
    timeLimitMs,
    memoryLimitMb: 128,
  });

  return {
    verdict: result.verdict === "AC" || result.verdict === "CE" || result.verdict === "TLE" || result.verdict === "RE" ? result.verdict : "RE",
    stdout: result.stdout,
    stderr: result.stderr,
    timeMs: result.timeMs,
  };
}

export function compareWithExpected(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}
