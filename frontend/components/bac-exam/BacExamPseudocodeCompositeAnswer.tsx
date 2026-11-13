"use client";

import { BacExamCodeAnswer } from "@/components/bac-exam/BacExamCodeAnswer";
import { BlocklyPseudocodeEditor } from "@/components/bac-exam/BlocklyPseudocodeEditor";
import { compositeMaxPoints, parseCompositeConfig, type BacExamExerciseForm } from "@/lib/bac-exam-types";

type CompositeAnswer = {
  part_a?: { text?: string };
  part_b?: { sets?: string[] };
  part_c?: { code?: string };
  part_d?: { blocklyXml?: string; generatedCpp?: string; pseudocode?: string };
};

type BacExamPseudocodeCompositeAnswerProps = {
  exercise: BacExamExerciseForm;
  answer: CompositeAnswer;
  exerciseId?: string;
  readOnly?: boolean;
  onChange: (next: CompositeAnswer) => void;
};

function partPointsLabel(exercise: BacExamExerciseForm): string {
  const cfg = parseCompositeConfig(exercise.config);
  return `a:${cfg.part_a.points}p + b:${cfg.part_b.points}p + c:${cfg.part_c.points}p + d:${cfg.part_d.points}p = ${compositeMaxPoints(cfg)}p`;
}

export function BacExamPseudocodeCompositeAnswer({
  exercise,
  answer,
  exerciseId,
  readOnly = false,
  onChange,
}: BacExamPseudocodeCompositeAnswerProps) {
  const cfg = parseCompositeConfig(exercise.config);
  const requiredSets = Math.max(1, Math.min(3, Number(cfg.part_b.required_sets ?? 2)));
  const perSetPoints = Number((cfg.part_b.points / requiredSets).toFixed(1));
  const sets = answer.part_b?.sets ?? Array.from({ length: requiredSets }, () => "");
  const setRows = Array.from({ length: requiredSets }, (_, i) => sets[i] ?? "");
  const initialBlockly = cfg.part_d.initial_blockly_xml;
  const dXml = answer.part_d?.blocklyXml?.trim() ? answer.part_d.blocklyXml : initialBlockly;

  return (
    <div className="space-y-6">
      <p className="text-xs text-zinc-500">{partPointsLabel(exercise)}</p>

      <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
        <h3 className="text-sm font-semibold text-sky-900">a) Ce se afiseaza? ({cfg.part_a.points}p — tot sau nimic)</h3>
        <textarea
          value={answer.part_a?.text ?? ""}
          readOnly={readOnly}
          onChange={(e) => onChange({ ...answer, part_a: { text: e.target.value } })}
          placeholder="Scrie exact ce se afiseaza..."
          className="mt-2 h-20 w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-sm"
        />
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
        <h3 className="text-sm font-semibold text-amber-900">
          b) Seturi de date ({cfg.part_b.points}p — {perSetPoints}p / set, {requiredSets} seturi)
        </h3>
        <p className="mt-1 text-xs text-amber-800">Introdu date de intrare (stdin) pentru care programul afiseaza rezultatul cerut.</p>
        <div className="mt-2 space-y-2">
          {setRows.map((set, idx) => (
            <label key={idx} className="block text-sm">
              Set {idx + 1}
              <textarea
                value={set}
                readOnly={readOnly}
                onChange={(e) => {
                  const next = [...setRows];
                  next[idx] = e.target.value;
                  onChange({ ...answer, part_b: { sets: next } });
                }}
                placeholder="Ex: 5&#10;3"
                className="mt-1 h-16 w-full rounded-lg border border-zinc-300 bg-white p-2 font-mono text-xs"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
        <h3 className="text-sm font-semibold text-emerald-900">c) Scrieti programul C/C++ ({cfg.part_c.points}p)</h3>
        <div className="mt-2">
          <BacExamCodeAnswer
            exerciseId={exerciseId}
            value={answer.part_c?.code ?? ""}
            onChange={(code) => onChange({ ...answer, part_c: { code } })}
            readOnly={readOnly}
          />
        </div>
      </section>

      <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
        <h3 className="text-sm font-semibold text-violet-900">d) Modificati pseudocodul ({cfg.part_d.points}p)</h3>
        <p className="mt-1 text-xs text-violet-800">Modifica structura repetitiva conform cerintei — pseudocodul se transforma automat in C++.</p>
        <div className="mt-2">
          <BlocklyPseudocodeEditor
            value={String(answer.part_d?.generatedCpp ?? "")}
            blocklyXml={dXml}
            readOnly={readOnly}
            onChange={(payload) =>
              onChange({
                ...answer,
                part_d: {
                  blocklyXml: payload.blocklyXml,
                  generatedCpp: payload.generatedCpp,
                  pseudocode: payload.pseudocode,
                },
              })
            }
          />
        </div>
      </section>
    </div>
  );
}
