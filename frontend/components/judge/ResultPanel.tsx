"use client";

import { CheckCircle2, Clock, MemoryStick, XCircle } from "lucide-react";
import { getStatusMeta, getTestVerdictMeta, type SubmissionStatus, type TestVerdict } from "@/lib/judge-format";

export type ResultTest = {
  test_id: string;
  verdict: TestVerdict;
  points: number;
  max_points?: number;
  time_ms: number;
  memory_kb?: number;
  is_sample: boolean;
  stdout?: string;
  stderr?: string;
  expected_output?: string;
};

type ResultPanelProps = {
  label: string;
  status: SubmissionStatus;
  score: number;
  tests: ResultTest[] | null;
  compileErrorMessage?: string | null;
};

export function ResultPanel({ label, status, score, tests, compileErrorMessage }: ResultPanelProps) {
  const meta = getStatusMeta(status);
  const passedCount = tests?.filter((test) => test.verdict === "AC").length ?? 0;
  const totalCount = tests?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${meta.classes.bg} ${meta.classes.border}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {status === "accepted" ? (
              <CheckCircle2 className={`h-6 w-6 ${meta.classes.text}`} />
            ) : status === "pending" || status === "running" ? (
              <span className={`h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${meta.classes.text}`} />
            ) : (
              <XCircle className={`h-6 w-6 ${meta.classes.text}`} />
            )}
            <div>
              <p className={`text-lg font-bold leading-tight ${meta.classes.text}`}>{meta.label}</p>
              <p className="text-xs text-zinc-500">{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalCount > 0 ? (
              <p className="text-sm font-semibold text-zinc-700">
                {passedCount} / {totalCount} teste trecute
              </p>
            ) : null}
            <p className="text-sm font-semibold text-zinc-700">Scor: {score} / 100</p>
          </div>
        </div>
      </div>

      {compileErrorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-zinc-950 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">Mesaj compilator</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-rose-200">
            {compileErrorMessage}
          </pre>
        </div>
      ) : null}

      {tests && tests.length > 0 ? (
        <div className="space-y-2">
          {tests.map((test, index) => {
            const testMeta = getTestVerdictMeta(test.verdict);
            const hasIo = typeof test.stdout === "string" || typeof test.expected_output === "string";
            return (
              <details
                key={test.test_id}
                className={`group overflow-hidden rounded-xl border ${testMeta.classes.border} ${testMeta.classes.bg}`}
                open={test.verdict !== "AC" && index === tests.findIndex((t) => t.verdict !== "AC")}
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white ${testMeta.classes.dot}`}>
                      {index + 1}
                    </span>
                    <span className={`text-sm font-semibold ${testMeta.classes.text}`}>{testMeta.label}</span>
                    {test.is_sample ? (
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-zinc-500">exemplu</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {test.time_ms} ms
                    </span>
                    {typeof test.memory_kb === "number" && test.memory_kb > 0 ? (
                      <span className="flex items-center gap-1">
                        <MemoryStick className="h-3.5 w-3.5" /> {test.memory_kb} KB
                      </span>
                    ) : null}
                    <span className="font-semibold text-zinc-700">
                      {test.points} / {test.max_points ?? test.points}p
                    </span>
                  </div>
                </summary>
                {hasIo ? (
                  <div className="space-y-2 border-t border-black/5 bg-white/70 px-3.5 py-3 text-xs">
                    <IoBlock label="Iesirea ta" value={test.stdout} />
                    <IoBlock label="Iesire asteptata" value={test.expected_output} />
                    {test.stderr ? <IoBlock label="Stderr" value={test.stderr} tone="error" /> : null}
                  </div>
                ) : null}
              </details>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function IoBlock({ label, value, tone }: { label: string; value?: string; tone?: "error" }) {
  if (typeof value !== "string") return null;
  return (
    <div>
      <p className="mb-1 font-medium text-zinc-500">{label}</p>
      <pre
        className={`overflow-x-auto whitespace-pre-wrap break-words rounded-lg border p-2 font-mono ${
          tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-zinc-200 bg-zinc-50 text-zinc-800"
        }`}
      >
        {value || "(gol)"}
      </pre>
    </div>
  );
}
