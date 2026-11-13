"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { apiFetch } from "@/lib/api";

type RunResult = {
  passed: number;
  total: number;
  is_full_score: boolean;
  results: Array<{
    test_id: string;
    label: string | null;
    verdict: string;
    points: number;
    max_points: number;
    time_ms: number;
    stdout?: string;
    stderr?: string;
    expected_output?: string;
    is_visible: boolean;
  }>;
};

type BacExamCodeAnswerProps = {
  exerciseId?: string;
  value: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  defaultCode?: string;
};

function verdictClass(verdict: string) {
  if (verdict === "AC") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (verdict === "CE") return "text-amber-800 bg-amber-50 border-amber-200";
  if (verdict === "TLE") return "text-orange-800 bg-orange-50 border-orange-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

export function BacExamCodeAnswer({ exerciseId, value, onChange, readOnly = false, defaultCode }: BacExamCodeAnswerProps) {
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const code = value || defaultCode || "#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}\n";

  const onRun = async () => {
    if (!exerciseId) {
      setRunError("Salveaza subiectul inainte de a rula testele.");
      return;
    }
    if (!code.trim()) {
      setRunError("Scrie codul inainte de rulare.");
      return;
    }
    setRunning(true);
    setRunError(null);
    setRunResult(null);
    try {
      const response = await apiFetch<{ data: RunResult }>(`/api/bac-exam/exercises/${exerciseId}/run`, {
        method: "POST",
        body: JSON.stringify({ code, language: "cpp" }),
      });
      setRunResult(response.data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Rulare esuata.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <CodeEditor value={code} onChange={(next) => onChange?.(next)} language="cpp" readOnly={readOnly} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={running || !exerciseId}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {running ? "Rulez testele..." : "Ruleaza testele"}
        </button>
        {!exerciseId ? (
          <span className="text-xs text-zinc-500">Salveaza subiectul pentru a putea rula testele.</span>
        ) : null}
      </div>
      {runError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{runError}</p> : null}
      {runResult ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm font-semibold text-zinc-900">
            Rezultat: {runResult.passed}/{runResult.total} teste trecute
            {runResult.is_full_score ? " — complet corect!" : ""}
          </p>
          <div className="mt-2 space-y-2">
            {runResult.results.map((test, idx) => (
              <div key={test.test_id} className={`rounded-lg border p-2 text-xs ${verdictClass(test.verdict)}`}>
                <p className="font-semibold">
                  Test {test.label || idx + 1}: {test.verdict} ({test.points}/{test.max_points}p) — {test.time_ms}ms
                </p>
                {test.stdout ? (
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-1 font-mono text-[11px]">
                    stdout: {test.stdout}
                  </pre>
                ) : null}
                {test.stderr ? (
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-1 font-mono text-[11px]">
                    stderr: {test.stderr}
                  </pre>
                ) : null}
                {test.expected_output && test.verdict === "WA" ? (
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap rounded bg-white/70 p-1 font-mono text-[11px]">
                    asteptat: {test.expected_output}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
