"use client";

import { BacExamCodeAnswer } from "@/components/bac-exam/BacExamCodeAnswer";
import { BacExamPseudocodeCompositeAnswer } from "@/components/bac-exam/BacExamPseudocodeCompositeAnswer";
import { BlocklyPseudocodeEditor } from "@/components/bac-exam/BlocklyPseudocodeEditor";
import { CodeEditor } from "@/components/editor/CodeEditor";
import type { BacExamExerciseForm, BacExamSubjectForm } from "@/lib/bac-exam-types";
import { EXERCISE_TYPE_LABELS } from "@/lib/bac-exam-types";

type PreviewAnswerState = Record<string, Record<string, unknown>>;

type BacExamPreviewProps = {
  subject: BacExamSubjectForm;
  selectedExerciseIndex: number;
  previewAnswers?: PreviewAnswerState;
  onPreviewAnswerChange?: (exerciseCode: string, answer: Record<string, unknown>) => void;
  mode?: "admin" | "student";
  /** Map internal_code → exercise UUID (necesar pentru rulare teste) */
  exerciseIds?: Record<string, string>;
};

function ExerciseAnswerPreview({
  exercise,
  answer,
  onChange,
  mode,
  exerciseId,
}: {
  exercise: BacExamExerciseForm;
  answer: Record<string, unknown>;
  onChange?: (next: Record<string, unknown>) => void;
  mode: "admin" | "student";
  exerciseId?: string;
}) {
  const readOnly = false;

  if (exercise.exercise_type === "grid_mcq") {
    return (
      <div className="flex flex-wrap gap-2">
        {(["a", "b", "c", "d"] as const).map((letter) => (
          <label
            key={letter}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              answer.selected === letter ? "border-sky-500 bg-sky-50" : "border-zinc-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name={`preview-${exercise.internal_code}`}
              checked={answer.selected === letter}
              disabled={readOnly}
              onChange={() => onChange?.({ selected: letter })}
            />
            {letter.toUpperCase()}
          </label>
        ))}
      </div>
    );
  }

  if (exercise.exercise_type === "output_display") {
    return (
      <textarea
        value={String(answer.text ?? "")}
        readOnly={readOnly}
        onChange={(e) => onChange?.({ text: e.target.value })}
        placeholder="Scrie ce crezi ca se afiseaza..."
        className="h-24 w-full rounded-lg border border-zinc-300 p-3 font-mono text-sm"
      />
    );
  }

  if (["code_full", "code_function", "code_fill"].includes(exercise.exercise_type)) {
    return (
      <BacExamCodeAnswer
        exerciseId={exerciseId}
        value={String(answer.code ?? "")}
        onChange={(code) => onChange?.({ code })}
        readOnly={readOnly}
      />
    );
  }

  if (exercise.exercise_type === "pseudocode_composite") {
    return (
      <BacExamPseudocodeCompositeAnswer
        exercise={exercise}
        answer={answer}
        exerciseId={exerciseId}
        readOnly={readOnly}
        onChange={(next) => onChange?.(next)}
      />
    );
  }

  if (exercise.exercise_type === "data_sets") {
    const sets = Array.isArray(answer.sets) ? (answer.sets as string[]) : ["", ""];
    const required = Math.max(1, Number(exercise.config.required_sets ?? 2));
    const rows = Array.from({ length: Math.max(required, sets.length) }, (_, i) => sets[i] ?? "");
    return (
      <div className="space-y-2">
        {rows.map((set, idx) => (
          <label key={idx} className="block text-sm">
            Set de date {idx + 1}
            <textarea
              value={set}
              readOnly={readOnly}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = e.target.value;
                onChange?.({ sets: next });
              }}
              placeholder="Input pentru program (stdin)..."
              className="mt-1 h-20 w-full rounded-lg border border-zinc-300 p-2 font-mono text-xs"
            />
          </label>
        ))}
      </div>
    );
  }

  if (exercise.exercise_type === "cpp_struct") {
    return (
      <CodeEditor
        value={String(answer.code ?? "")}
        onChange={(code) => onChange?.({ code })}
        language="cpp"
        readOnly={readOnly}
      />
    );
  }

  if (exercise.exercise_type === "flexible_answer") {
    const required = Math.max(1, Number(exercise.config.required_count ?? 1));
    const answers = Array.isArray(answer.answers) ? (answer.answers as string[]) : [""];
    const rows = Array.from({ length: Math.max(required, answers.length) }, (_, i) => answers[i] ?? "");
    return (
      <div className="space-y-2">
        {rows.map((ans, idx) => (
          <label key={idx} className="block text-sm">
            Raspuns {required > 1 ? idx + 1 : ""}
            <input
              type="text"
              value={ans}
              readOnly={readOnly}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = e.target.value;
                onChange?.({ answers: next });
              }}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
    );
  }

  if (exercise.exercise_type === "pseudocode_modify") {
    return (
      <BlocklyPseudocodeEditor
        value={String(answer.generatedCpp ?? "")}
        blocklyXml={String(answer.blocklyXml ?? "")}
        readOnly={readOnly}
        onChange={(payload) => onChange?.({ ...answer, blocklyXml: payload.blocklyXml, generatedCpp: payload.generatedCpp, pseudocode: payload.pseudocode })}
      />
    );
  }

  if (exercise.exercise_type === "code_with_explanation") {
    return (
      <div className="space-y-3">
        <BacExamCodeAnswer
          exerciseId={exerciseId}
          value={String(answer.code ?? "")}
          onChange={(code) => onChange?.({ ...answer, code })}
          readOnly={readOnly}
        />
        <textarea
          value={String(answer.explanation ?? "")}
          readOnly={readOnly}
          onChange={(e) => onChange?.({ ...answer, explanation: e.target.value })}
          placeholder="Explica algoritmul si eficienta..."
          className="h-28 w-full rounded-lg border border-zinc-300 p-3 text-sm"
        />
      </div>
    );
  }

  return (
    <textarea
      value={String(answer.text ?? "")}
      readOnly={readOnly}
      onChange={(e) => onChange?.({ text: e.target.value })}
      className="h-24 w-full rounded-lg border border-zinc-300 p-3 text-sm"
    />
  );
}

export function BacExamPreview({
  subject,
  selectedExerciseIndex,
  previewAnswers = {},
  onPreviewAnswerChange,
  mode = "admin",
  exerciseIds = {},
}: BacExamPreviewProps) {
  const exercise = subject.exercises[selectedExerciseIndex] ?? subject.exercises[0];
  if (!exercise) {
    return <p className="text-sm text-zinc-500">Adauga cel putin un exercitiu.</p>;
  }

  const answer = previewAnswers[exercise.internal_code] ?? {};

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview elev</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-900">{subject.title}</h2>
        <p className="text-sm text-zinc-600">
          {subject.session_label} {subject.year} • Varianta {subject.variant_label} • {subject.duration_minutes} min
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Punctaj: I={subject.points_subject_i} + II={subject.points_subject_ii} + III={subject.points_subject_iii} + oficiu{" "}
          {subject.points_oficiu}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {exercise.internal_code} — {exercise.title || EXERCISE_TYPE_LABELS[exercise.exercise_type]}
          </p>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">{exercise.max_points}p</span>
        </div>

        {exercise.images.length > 0 ? (
          <div className="mt-3 space-y-2">
            {exercise.images.map((img, idx) => (
              <img
                key={`${img.file_name}-${idx}`}
                src={img.preview_url || img.file_base64}
                alt={img.alt_text || exercise.title}
                className="max-h-80 w-full rounded-lg border border-zinc-200 object-contain"
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            Imagine cerinta — incarca in panoul din stanga
          </p>
        )}

        <div className="mt-4">
          <ExerciseAnswerPreview
            exercise={exercise}
            answer={answer}
            mode={mode}
            exerciseId={exerciseIds[exercise.internal_code]}
            onChange={(next) => onPreviewAnswerChange?.(exercise.internal_code, next)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
        <p className="font-semibold text-zinc-800">Index exercitii</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {subject.exercises.map((ex, idx) => (
            <span
              key={ex.internal_code}
              className={`rounded-md px-2 py-1 ${idx === selectedExerciseIndex ? "bg-sky-600 text-white" : "bg-white text-zinc-700"}`}
            >
              {ex.internal_code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
