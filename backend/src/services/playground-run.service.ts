import { playgroundQueue, playgroundQueueEvents } from "../queue/playground.queue";

export type PlaygroundLanguage = "cpp" | "c" | "pascal" | "python";

export type PlaygroundFile = { name: string; content: string };

export type PlaygroundRunInput = {
  language: PlaygroundLanguage;
  code: string;
  stdin?: string;
  files?: PlaygroundFile[];
  inputSource?: "stdin" | "file";
  inputFilename?: string | null;
  outputTarget?: "stdout" | "file";
  outputFilename?: string | null;
  timeLimitMs?: number;
  memoryLimitMb?: number;
};

export type PlaygroundRunResult = {
  verdict: "AC" | "CE" | "TLE" | "RE" | "XX";
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number;
  files: PlaygroundFile[];
};

/** Runs untrusted code inside the judge container's isolate sandbox (see judge/playground.js) and waits for the result. */
export async function runInPlaygroundSandbox(input: PlaygroundRunInput): Promise<PlaygroundRunResult> {
  const job = await playgroundQueue.add("run", input);
  const waitTimeoutMs = Math.max((input.timeLimitMs ?? 3000) + 10000, 15000);
  const result = await job.waitUntilFinished(playgroundQueueEvents, waitTimeoutMs);
  return result as PlaygroundRunResult;
}
