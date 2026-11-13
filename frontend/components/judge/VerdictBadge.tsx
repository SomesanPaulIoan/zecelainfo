import { getStatusMeta, type SubmissionStatus } from "@/lib/judge-format";

export function VerdictBadge({ verdict }: { verdict: SubmissionStatus }) {
  const meta = getStatusMeta(verdict);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.classes.bg} ${meta.classes.text} ${meta.classes.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.classes.dot}`} />
      {meta.label}
    </span>
  );
}
