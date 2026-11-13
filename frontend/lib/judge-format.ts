export type SubmissionStatus =
  | "pending"
  | "running"
  | "accepted"
  | "wrong_answer"
  | "time_limit"
  | "memory_limit"
  | "runtime_error"
  | "compile_error"
  | "partial";

export type TestVerdict = "AC" | "WA" | "TLE" | "RE" | "MLE" | "CE";

type Tone = "success" | "error" | "warning" | "info" | "neutral";

const toneClasses: Record<Tone, { text: string; bg: string; border: string; solid: string; dot: string }> = {
  success: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    solid: "bg-emerald-500 text-white",
    dot: "bg-emerald-500",
  },
  error: {
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    solid: "bg-rose-500 text-white",
    dot: "bg-rose-500",
  },
  warning: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    solid: "bg-amber-500 text-white",
    dot: "bg-amber-500",
  },
  info: {
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    solid: "bg-sky-500 text-white",
    dot: "bg-sky-500",
  },
  neutral: {
    text: "text-zinc-600",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
    solid: "bg-zinc-400 text-white",
    dot: "bg-zinc-400",
  },
};

const statusMeta: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  pending: { label: "In asteptare", tone: "neutral" },
  running: { label: "Se evalueaza...", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  wrong_answer: { label: "Raspuns gresit", tone: "error" },
  time_limit: { label: "Time Limit Exceeded", tone: "warning" },
  memory_limit: { label: "Memory Limit Exceeded", tone: "warning" },
  runtime_error: { label: "Eroare de executie", tone: "error" },
  compile_error: { label: "Eroare de compilare", tone: "error" },
  partial: { label: "Partial corect", tone: "warning" },
};

const testVerdictMeta: Record<TestVerdict, { label: string; tone: Tone }> = {
  AC: { label: "Trecut", tone: "success" },
  WA: { label: "Raspuns gresit", tone: "error" },
  TLE: { label: "Time Limit", tone: "warning" },
  MLE: { label: "Memory Limit", tone: "warning" },
  RE: { label: "Eroare executie", tone: "error" },
  CE: { label: "Eroare compilare", tone: "error" },
};

export function getStatusMeta(status: SubmissionStatus) {
  const meta = statusMeta[status] ?? statusMeta.pending;
  return { ...meta, classes: toneClasses[meta.tone] };
}

export function getTestVerdictMeta(verdict: TestVerdict) {
  const meta = testVerdictMeta[verdict] ?? testVerdictMeta.RE;
  return { ...meta, classes: toneClasses[meta.tone] };
}
