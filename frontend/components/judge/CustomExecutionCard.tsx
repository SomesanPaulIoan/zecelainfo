import { Clock, Terminal } from "lucide-react";

const EXECUTION_LABEL: Record<string, { label: string; tone: "success" | "error" | "warning" }> = {
  AC: { label: "Executat cu succes", tone: "success" },
  WA: { label: "Executat cu succes", tone: "success" },
  TLE: { label: "Timp depasit", tone: "warning" },
  RE: { label: "Eroare de executie", tone: "error" },
  CE: { label: "Eroare de compilare", tone: "error" },
};

const TONE_CLASSES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export function CustomExecutionCard({
  verdict,
  timeMs,
  stdout,
  stderr,
}: {
  verdict: "AC" | "WA" | "TLE" | "RE" | "CE";
  timeMs: number;
  stdout: string;
  stderr: string;
}) {
  const meta = EXECUTION_LABEL[verdict] ?? EXECUTION_LABEL.RE;

  return (
    <div className="space-y-3">
      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${TONE_CLASSES[meta.tone]}`}>
        <span className="flex items-center gap-2">
          <Terminal className="h-4 w-4" /> {meta.label}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium opacity-80">
          <Clock className="h-3.5 w-3.5" /> {timeMs} ms
        </span>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">Iesire (stdout)</p>
        <pre className="min-h-[2.5rem] overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-xs text-zinc-800">
          {stdout || "(gol)"}
        </pre>
      </div>
      {stderr ? (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Stderr</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-rose-200 bg-rose-50 p-2.5 font-mono text-xs text-rose-700">
            {stderr}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
