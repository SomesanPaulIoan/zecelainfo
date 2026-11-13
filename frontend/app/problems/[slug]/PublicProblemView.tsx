import Link from "next/link";
import { ArrowLeft, Lock, MemoryStick, Timer } from "lucide-react";
import { MarkdownLatexContent } from "@/components/common/MarkdownLatexContent";

export type PublicProblemData = {
  title: string;
  statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: "easy" | "medium" | "hard" | "facultate";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  sample_tests: Array<{ id: string; input: string; expected_output: string }>;
};

const DIFFICULTY_META: Record<PublicProblemData["difficulty"], { label: string; classes: string }> = {
  easy: { label: "Usoara", classes: "border-emerald-300 bg-emerald-100/80 text-emerald-800" },
  medium: { label: "Medie", classes: "border-amber-300 bg-amber-100/80 text-amber-800" },
  hard: { label: "Grea", classes: "border-rose-300 bg-rose-100/80 text-rose-800" },
  facultate: { label: "Facultate", classes: "border-violet-300 bg-violet-100/80 text-violet-800" },
};

// Varianta publica (vizitatori nelogati + Googlebot): enuntul complet, fara editor,
// fara indicatii/explicatii/solutii. Se randeaza pe server, deci continutul e in HTML.
export function PublicProblemView({ problem, slug }: { problem: PublicProblemData; slug: string }) {
  const difficultyMeta = DIFFICULTY_META[problem.difficulty];
  const next = encodeURIComponent(`/problems/${slug}`);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/problems"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Probleme
      </Link>

      <header className="mt-3 space-y-3">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{problem.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${difficultyMeta.classes}`}>
            {difficultyMeta.label}
          </span>
          <span className="flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> {problem.time_limit_ms} ms
          </span>
          <span className="flex items-center gap-1">
            <MemoryStick className="h-3.5 w-3.5" /> {problem.memory_limit_mb} MB
          </span>
          {problem.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <article className="mt-6 space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
        <MarkdownLatexContent content={problem.statement} className="text-[15px] leading-7 text-zinc-800" />

        <dl className="space-y-4 border-t border-zinc-100 pt-5 text-sm leading-6 text-zinc-700">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Date de intrare</dt>
            <dd className="mt-1">{problem.input_format}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Date de iesire</dt>
            <dd className="mt-1">{problem.output_format}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Restrictii</dt>
            <dd className="mt-1 font-mono text-[13px]">{problem.constraints}</dd>
          </div>
        </dl>

        {problem.sample_tests.length > 0 ? (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Exemple</h2>
            <div className="space-y-3">
              {problem.sample_tests.map((sample, index) => (
                <div key={sample.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <p className="border-b border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-600">
                    Exemplul {index + 1}
                  </p>
                  <div className="grid grid-cols-1 divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {[
                      ["Intrare", sample.input],
                      ["Iesire", sample.expected_output],
                    ].map(([label, value]) => (
                      <div key={label} className="px-3.5 py-3">
                        <p className="mb-1 text-[11px] font-medium text-zinc-500">{label}</p>
                        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-zinc-800">{value}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </article>

      <section className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
          <div>
            <p className="font-semibold text-zinc-900">Vrei să rezolvi problema?</p>
            <p className="mt-0.5 text-sm text-zinc-600">
              Creează-ți un cont gratuit ca să scrii cod în editor, să trimiți soluții la evaluator și să vezi indicațiile.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/login?next=${next}`}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-100"
          >
            Autentificare
          </Link>
          <Link
            href={`/register?next=${next}`}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Cont gratuit
          </Link>
        </div>
      </section>
    </main>
  );
}
