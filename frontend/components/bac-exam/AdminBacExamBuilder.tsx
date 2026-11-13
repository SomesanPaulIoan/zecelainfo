"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BacExamPreview } from "@/components/bac-exam/BacExamPreview";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { apiFetch } from "@/lib/api";
import {
  BAC_EXAM_EXERCISE_TYPES,
  compositeMaxPoints,
  defaultPseudocodeCompositeConfig,
  defaultSubjectForm,
  defaultTest,
  EXERCISE_TYPE_LABELS,
  parseCompositeConfig,
  type PseudocodeCompositeConfig,
  type BacExamExerciseForm,
  type BacExamExerciseType,
  type BacExamSection,
  type BacExamSubjectForm,
} from "@/lib/bac-exam-types";

type SubjectListItem = {
  id: string;
  title: string;
  year: number | null;
  is_active: boolean;
  created_at: string;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Nu am putut citi fisierul."));
    };
    reader.onerror = () => reject(new Error("Nu am putut citi fisierul."));
    reader.readAsDataURL(file);
  });
}

function newExercise(section: BacExamSection, index: number): BacExamExerciseForm {
  const code = section === "I" ? `S1-${index}` : section === "II" ? `S2-${index}` : `S3-${index}`;
  if (section === "II" && index === 1) {
    const composite = defaultPseudocodeCompositeConfig();
    return {
      internal_code: code,
      title: "Problema pseudocod (2.1)",
      section,
      exercise_type: "pseudocode_composite",
      sort_order: index,
      max_points: compositeMaxPoints(composite),
      config: composite as unknown as Record<string, unknown>,
      grading_rules: {},
      default_feedback: "",
      images: [],
      tests: [defaultTest(), defaultTest(), defaultTest()],
    };
  }
  return {
    internal_code: code,
    title: `Exercitiu ${code}`,
    section,
    exercise_type: section === "I" ? "grid_mcq" : section === "III" ? "code_full" : "output_display",
    sort_order: index,
    max_points: section === "I" ? 4 : 10,
    config: section === "I" ? { correct_answer: "a" } : {},
    grading_rules: {},
    default_feedback: "",
    images: [],
    tests: section === "III" ? [defaultTest(), defaultTest()] : [],
  };
}

type AdminBacExamBuilderProps = {
  subjectId?: string;
};

export function AdminBacExamBuilder({ subjectId }: AdminBacExamBuilderProps) {
  const [form, setForm] = useState<BacExamSubjectForm>(defaultSubjectForm());
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, Record<string, unknown>>>({});
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [loading, setLoading] = useState(Boolean(subjectId));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubjectId, setCurrentSubjectId] = useState<string | undefined>(subjectId);
  const [exerciseIdByCode, setExerciseIdByCode] = useState<Record<string, string>>({});

  const selectedExercise = form.exercises[selectedExerciseIndex] ?? form.exercises[0];

  const loadSubjects = useCallback(async () => {
    const response = await apiFetch<{ data: SubjectListItem[] }>("/api/bac-exam/admin/subjects");
    setSubjects(response.data);
  }, []);

  const loadSubject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      type LoadedExercise = {
        id: string;
        internal_code: string;
        title: string | null;
        section: BacExamSection;
        exercise_type: BacExamExerciseType;
        sort_order: number;
        max_points: number;
        config: Record<string, unknown>;
        grading_rules: Record<string, unknown>;
        default_feedback: string | null;
        images: Array<{ image_url: string; alt_text: string | null }>;
        tests: BacExamExerciseForm["tests"];
      };

      const response = await apiFetch<{
        data: {
          subject: BacExamSubjectForm & { id: string };
          exercises: LoadedExercise[];
        };
      }>(`/api/bac-exam/admin/subjects/${id}`);

      const { subject, exercises } = response.data;
      setForm({
        title: subject.title,
        session_label: subject.session_label ?? "",
        year: subject.year ?? 2026,
        variant_label: subject.variant_label ?? "",
        profile_id: subject.profile_id,
        duration_minutes: subject.duration_minutes,
        is_active: subject.is_active,
        points_subject_i: Number(subject.points_subject_i),
        points_subject_ii: Number(subject.points_subject_ii),
        points_subject_iii: Number(subject.points_subject_iii),
        points_oficiu: Number(subject.points_oficiu),
        grade_divisor: Number(subject.grade_divisor),
        exercises: exercises.map((ex) => ({
          internal_code: ex.internal_code,
          title: ex.title ?? "",
          section: ex.section,
          exercise_type: ex.exercise_type,
          sort_order: ex.sort_order,
          max_points: Number(ex.max_points),
          config: ex.config ?? {},
          grading_rules: ex.grading_rules ?? {},
          default_feedback: ex.default_feedback ?? "",
          images: ex.images.map((img) => ({
            file_name: img.image_url.split("/").pop() ?? "image.png",
            file_base64: img.image_url,
            alt_text: img.alt_text ?? "",
            preview_url: img.image_url,
          })),
          tests: ex.tests.map((t, idx) => ({
            label: t.label ?? "",
            input_data: t.input_data,
            expected_output: t.expected_output,
            time_limit_ms: t.time_limit_ms,
            memory_limit_mb: t.memory_limit_mb,
            output_type: t.output_type,
            input_source: t.input_source,
            input_filename: t.input_filename ?? "bac.in",
            output_filename: t.output_filename ?? "bac.out",
            points: Number(t.points),
            is_visible: t.is_visible,
            sort_order: t.sort_order ?? idx,
          })),
        })),
      });
      setCurrentSubjectId(id);
      setExerciseIdByCode(Object.fromEntries(exercises.map((ex) => [ex.internal_code, ex.id])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut incarca subiectul.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    if (subjectId) void loadSubject(subjectId);
  }, [subjectId, loadSubject]);

  const totalConfiguredPoints = useMemo(
    () => form.exercises.reduce((sum, ex) => sum + Number(ex.max_points || 0), 0) + form.points_oficiu,
    [form.exercises, form.points_oficiu],
  );

  const updateExercise = (index: number, patch: Partial<BacExamExerciseForm>) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, idx) => (idx === index ? { ...ex, ...patch } : ex)),
    }));
  };

  const updateCompositeConfig = (
    index: number,
    patch: {
      part_a?: Partial<PseudocodeCompositeConfig["part_a"]>;
      part_b?: Partial<PseudocodeCompositeConfig["part_b"]>;
      part_c?: Partial<PseudocodeCompositeConfig["part_c"]>;
      part_d?: Partial<PseudocodeCompositeConfig["part_d"]>;
      part_d_tests?: PseudocodeCompositeConfig["part_d_tests"];
    },
  ) => {
    const ex = form.exercises[index];
    if (!ex) return;
    const current = parseCompositeConfig(ex.config);
    const next: PseudocodeCompositeConfig = {
      ...current,
      ...patch,
      part_a: { ...current.part_a, ...patch.part_a },
      part_b: { ...current.part_b, ...patch.part_b },
      part_c: { ...current.part_c, ...patch.part_c },
      part_d: { ...current.part_d, ...patch.part_d, grading_weights: { ...current.part_d.grading_weights, ...patch.part_d?.grading_weights } },
      part_d_tests: patch.part_d_tests ?? current.part_d_tests,
    };
    updateExercise(index, {
      config: next as unknown as Record<string, unknown>,
      max_points: compositeMaxPoints(next),
    });
  };

  const addExercise = (section: BacExamSection) => {
    const count = form.exercises.filter((e) => e.section === section).length + 1;
    const exercise = newExercise(section, count);
    setForm((prev) => ({ ...prev, exercises: [...prev.exercises, exercise] }));
    setSelectedExerciseIndex(form.exercises.length);
  };

  const handleImageUpload = async (index: number, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    updateExercise(index, {
      images: [
        ...(form.exercises[index]?.images ?? []),
        {
          file_name: file.name,
          file_base64: dataUrl,
          alt_text: file.name,
          preview_url: dataUrl,
        },
      ],
    });
  };

  const saveSubject = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const path = currentSubjectId ? `/api/bac-exam/admin/subjects/${currentSubjectId}` : "/api/bac-exam/admin/subjects";
      const method = currentSubjectId ? "PUT" : "POST";
      const response = await apiFetch<{ data: { id: string } }>(path, {
        method,
        body: JSON.stringify(form),
      });
      const id = response.data.id;
      setCurrentSubjectId(id);
      setMessage("Subiect salvat.");
      await loadSubjects();
      await loadSubject(id);
      if (!currentSubjectId) {
        window.history.replaceState(null, "", `/admin/bac-exam/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvare esuata.");
    } finally {
      setSaving(false);
    }
  };

  const testOfficialSolution = async () => {
    if (!currentSubjectId || !selectedExercise) return;
    const code =
      selectedExercise.exercise_type === "pseudocode_composite"
        ? String(
            selectedExercise.config.reference_code ??
              parseCompositeConfig(selectedExercise.config).part_c.wrapper_template ??
              "",
          )
        : String(selectedExercise.config.reference_code ?? selectedExercise.config.official_solution ?? "");
    if (!code.trim()) {
      setError("Completeaza codul de referinta in config (reference_code).");
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const exIdResponse = await apiFetch<{ data: { exercises: Array<{ internal_code: string; id: string }> } }>(
        `/api/bac-exam/admin/subjects/${currentSubjectId}`,
      );
      const exerciseId = exIdResponse.data.exercises.find((e) => e.internal_code === selectedExercise.internal_code)?.id;
      if (!exerciseId) throw new Error("Salveaza subiectul inainte de testare.");
      const result = await apiFetch<{ data: { passed: number; total: number; is_full_score: boolean } }>(
        "/api/bac-exam/admin/test-official",
        {
          method: "POST",
          body: JSON.stringify({ exercise_id: exerciseId, code, language: "cpp" }),
        },
      );
      setMessage(`Test oficial: ${result.data.passed}/${result.data.total} teste trecute.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test esuat.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-sm text-zinc-600">Se incarca builder-ul...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-zinc-100/80">
      <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-8 md:px-6">
        <div className="rounded-3xl border border-sky-200/70 bg-white/90 p-6 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Builder Subiecte Bac — corectare automata</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Configureaza subiectul in stanga, preview live in dreapta. Punctaj total configurat: {totalConfiguredPoints}p
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50">
                Inapoi admin
              </Link>
              <button
                type="button"
                onClick={() => void saveSubject()}
                disabled={saving}
                className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {saving ? "Salvez..." : "Salveaza subiect"}
              </button>
            </div>
          </div>
          {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 pb-12 md:px-6 xl:grid-cols-2">
        {/* LEFT: Builder */}
        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Configurare subiect</h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">
              Titlu
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Sesiune
              <input
                value={form.session_label}
                onChange={(e) => setForm((p) => ({ ...p, session_label: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              An
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Varianta
              <input
                value={form.variant_label}
                onChange={(e) => setForm((p) => ({ ...p, variant_label: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Timp (minute)
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm((p) => ({ ...p, duration_minutes: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Profil
              <select
                value={form.profile_id}
                onChange={(e) => setForm((p) => ({ ...p, profile_id: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value={1}>Mate-Info</option>
                <option value={2}>Stiinte ale Naturii</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-semibold text-zinc-800">Punctaje configurabile</p>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
              {(
                [
                  ["points_subject_i", "Subiect I"],
                  ["points_subject_ii", "Subiect II"],
                  ["points_subject_iii", "Subiect III"],
                  ["points_oficiu", "Oficiu"],
                  ["grade_divisor", "Divizor nota"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="text-xs font-medium text-zinc-700">
                  {label}
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Activ (vizibil elevilor)
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addExercise("I")} className="rounded-lg border px-3 py-1.5 text-xs">
              + Subiect I
            </button>
            <button type="button" onClick={() => addExercise("II")} className="rounded-lg border px-3 py-1.5 text-xs">
              + Subiect II
            </button>
            <button type="button" onClick={() => addExercise("III")} className="rounded-lg border px-3 py-1.5 text-xs">
              + Subiect III
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {form.exercises.map((ex, idx) => (
              <button
                key={`${ex.internal_code}-${idx}`}
                type="button"
                onClick={() => setSelectedExerciseIndex(idx)}
                className={`rounded-md px-2 py-1 text-xs ${idx === selectedExerciseIndex ? "bg-sky-600 text-white" : "bg-zinc-100"}`}
              >
                {ex.internal_code}
              </button>
            ))}
          </div>

          {selectedExercise ? (
            <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
              <p className="font-semibold text-zinc-900">Exercitiu: {selectedExercise.internal_code}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Cod intern
                  <input
                    value={selectedExercise.internal_code}
                    onChange={(e) => updateExercise(selectedExerciseIndex, { internal_code: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm">
                  Titlu
                  <input
                    value={selectedExercise.title}
                    onChange={(e) => updateExercise(selectedExerciseIndex, { title: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-sm">
                  Sectiune
                  <select
                    value={selectedExercise.section}
                    onChange={(e) => updateExercise(selectedExerciseIndex, { section: e.target.value as BacExamSection })}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                  </select>
                </label>
                <label className="text-sm">
                  Tip exercitiu
                  <select
                    value={selectedExercise.exercise_type}
                    onChange={(e) => {
                      const nextType = e.target.value as BacExamExerciseType;
                      if (nextType === "pseudocode_composite") {
                        const composite = defaultPseudocodeCompositeConfig();
                        updateExercise(selectedExerciseIndex, {
                          exercise_type: nextType,
                          config: composite as unknown as Record<string, unknown>,
                          max_points: compositeMaxPoints(composite),
                          tests: selectedExercise.tests.length ? selectedExercise.tests : [defaultTest(), defaultTest(), defaultTest()],
                        });
                        return;
                      }
                      updateExercise(selectedExerciseIndex, { exercise_type: nextType });
                    }}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  >
                    {BAC_EXAM_EXERCISE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {EXERCISE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Punctaj maxim
                  <input
                    type="number"
                    value={selectedExercise.max_points}
                    onChange={(e) => updateExercise(selectedExerciseIndex, { max_points: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm"
                  />
                </label>
              </div>

              <label className="block text-sm">
                Imagine cerinta
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(selectedExerciseIndex, file);
                  }}
                />
              </label>

              {selectedExercise.exercise_type === "pseudocode_composite" ? (
                (() => {
                  const cc = parseCompositeConfig(selectedExercise.config);
                  return (
                    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/30 p-3 text-sm">
                      <p className="font-semibold text-violet-900">Configurare 2.1 unificata (o imagine, subpuncte a–d)</p>

                      <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="font-medium">a) Ce se afiseaza ({cc.part_a.points}p)</p>
                        <textarea
                          value={cc.part_a.expected_output}
                          onChange={(e) => updateCompositeConfig(selectedExerciseIndex, { part_a: { expected_output: e.target.value } })}
                          placeholder="Output corect"
                          className="h-16 w-full rounded border p-2 font-mono text-xs"
                        />
                        <label className="block text-xs">
                          Punctaj a
                          <input
                            type="number"
                            value={cc.part_a.points}
                            onChange={(e) => updateCompositeConfig(selectedExerciseIndex, { part_a: { points: Number(e.target.value) } })}
                            className="ml-2 w-16 rounded border px-1"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="font-medium">b) Seturi de date ({cc.part_b.points}p total)</p>
                        <label className="block text-xs">
                          Nr. seturi cerute (1=6p/set, 2=3p/set, 3=2p/set)
                          <select
                            value={cc.part_b.required_sets}
                            onChange={(e) => updateCompositeConfig(selectedExerciseIndex, { part_b: { required_sets: Number(e.target.value) } })}
                            className="ml-2 rounded border px-2 py-1"
                          >
                            <option value={1}>1 set</option>
                            <option value={2}>2 seturi</option>
                            <option value={3}>3 seturi</option>
                          </select>
                        </label>
                        <textarea
                          value={cc.part_b.target_output}
                          onChange={(e) => updateCompositeConfig(selectedExerciseIndex, { part_b: { target_output: e.target.value } })}
                          placeholder="Output asteptat la rularea cu seturile elevului"
                          className="h-14 w-full rounded border p-2 font-mono text-xs"
                        />
                        <p className="text-xs text-zinc-600">Cod C++ echivalent pseudocodului (ruleaza la verificare):</p>
                        <CodeEditor
                          value={cc.part_b.reference_code}
                          onChange={(code) => updateCompositeConfig(selectedExerciseIndex, { part_b: { reference_code: code } })}
                          language="cpp"
                        />
                      </div>

                      <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="font-medium">c) Program C/C++ elev ({cc.part_c.points}p) — teste mai jos</p>
                        <CodeEditor
                          value={cc.part_c.wrapper_template}
                          onChange={(code) => updateCompositeConfig(selectedExerciseIndex, { part_c: { wrapper_template: code } })}
                          language="cpp"
                        />
                      </div>

                      <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="font-medium">d) Modifica pseudocod ({cc.part_d.points}p)</p>
                        <label className="block text-xs">
                          Blockly XML initial (pseudocod de start)
                          <textarea
                            value={cc.part_d.initial_blockly_xml}
                            onChange={(e) => updateCompositeConfig(selectedExerciseIndex, { part_d: { initial_blockly_xml: e.target.value } })}
                            placeholder="Lipeste XML Blockly exportat din editor..."
                            className="mt-1 h-32 w-full rounded border p-2 font-mono text-[10px]"
                          />
                        </label>
                        <label className="block text-xs">
                          Blocuri obligatorii (virgula)
                          <input
                            value={cc.part_d.required_block_types.join(", ")}
                            onChange={(e) =>
                              updateCompositeConfig(selectedExerciseIndex, {
                                part_d: { required_block_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) },
                              })
                            }
                            className="mt-1 w-full rounded border px-2 py-1"
                          />
                        </label>
                        <label className="block text-xs">
                          Blocuri interzise
                          <input
                            value={cc.part_d.forbidden_block_types.join(", ")}
                            onChange={(e) =>
                              updateCompositeConfig(selectedExerciseIndex, {
                                part_d: { forbidden_block_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) },
                              })
                            }
                            className="mt-1 w-full rounded border px-2 py-1"
                          />
                        </label>
                        <p className="text-xs font-medium">Teste subpunct d (C++ generat din Blockly)</p>
                        {cc.part_d_tests.map((test, tIdx) => (
                          <div key={`d-test-${tIdx}`} className="grid grid-cols-2 gap-2 rounded border bg-zinc-50 p-2">
                            <textarea
                              value={test.input_data}
                              placeholder="Input"
                              onChange={(e) => {
                                const tests = [...cc.part_d_tests];
                                tests[tIdx] = { ...tests[tIdx], input_data: e.target.value };
                                updateCompositeConfig(selectedExerciseIndex, { part_d_tests: tests });
                              }}
                              className="h-14 rounded border p-1 font-mono text-[10px]"
                            />
                            <textarea
                              value={test.expected_output}
                              placeholder="Output"
                              onChange={(e) => {
                                const tests = [...cc.part_d_tests];
                                tests[tIdx] = { ...tests[tIdx], expected_output: e.target.value };
                                updateCompositeConfig(selectedExerciseIndex, { part_d_tests: tests });
                              }}
                              className="h-14 rounded border p-1 font-mono text-[10px]"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateCompositeConfig(selectedExerciseIndex, {
                              part_d_tests: [...cc.part_d_tests, { ...defaultTest(), sort_order: cc.part_d_tests.length }],
                            })
                          }
                          className="text-xs text-violet-700"
                        >
                          + Test subpunct d
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : null}

              {selectedExercise.exercise_type === "grid_mcq" ? (
                <label className="block text-sm">
                  Raspuns corect (a/b/c/d)
                  <select
                    value={String(selectedExercise.config.correct_answer ?? "a")}
                    onChange={(e) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, correct_answer: e.target.value },
                      })
                    }
                    className="mt-1 rounded-lg border px-2 py-1.5 text-sm"
                  >
                    {["a", "b", "c", "d"].map((l) => (
                      <option key={l} value={l}>
                        {l.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {selectedExercise.exercise_type === "output_display" ? (
                <>
                  <label className="block text-sm">
                    Output corect
                    <textarea
                      value={String(selectedExercise.config.expected_output ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, expected_output: e.target.value },
                        })
                      }
                      className="mt-1 h-20 w-full rounded-lg border p-2 font-mono text-xs"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedExercise.config.partial_by_positions)}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, partial_by_positions: e.target.checked },
                        })
                      }
                    />
                    Punctaj partial pe pozitii
                  </label>
                </>
              ) : null}

              {selectedExercise.exercise_type === "data_sets" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Seturi de date — cod referinta + output tinta</p>
                  <label className="block text-sm">
                    Nr. seturi cerute
                    <input
                      type="number"
                      min={1}
                      value={Number(selectedExercise.config.required_sets ?? 2)}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, required_sets: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-24 rounded-lg border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    Output tinta (la rularea cu input-ul elevului)
                    <textarea
                      value={String(selectedExercise.config.target_output ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, target_output: e.target.value },
                        })
                      }
                      className="mt-1 h-16 w-full rounded-lg border p-2 font-mono text-xs"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedExercise.config.require_distinct ?? true)}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, require_distinct: e.target.checked },
                        })
                      }
                    />
                    Seturi distincte obligatorii
                  </label>
                  <CodeEditor
                    value={String(selectedExercise.config.reference_code ?? "")}
                    onChange={(code) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, reference_code: code },
                      })
                    }
                    language="cpp"
                  />
                </div>
              ) : null}

              {selectedExercise.exercise_type === "pseudocode_modify" ? (
                <div className="space-y-2 text-sm">
                  <label className="block">
                    Blocuri Blockly obligatorii (tipuri, separate prin virgula)
                    <input
                      value={String((selectedExercise.config.required_block_types as string[] | undefined)?.join(", ") ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: {
                            ...selectedExercise.config,
                            required_block_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    Blocuri interzise
                    <input
                      value={String((selectedExercise.config.forbidden_block_types as string[] | undefined)?.join(", ") ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: {
                            ...selectedExercise.config,
                            forbidden_block_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    Regex C++ obligatorii (cate unul pe linie)
                    <textarea
                      value={String((selectedExercise.config.required_cpp_regex as string[] | undefined)?.join("\n") ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: {
                            ...selectedExercise.config,
                            required_cpp_regex: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="mt-1 h-16 w-full rounded-lg border p-2 font-mono text-xs"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      Puncte structura
                      <input
                        type="number"
                        value={Number((selectedExercise.config.grading_weights as Record<string, number> | undefined)?.structure ?? 3)}
                        onChange={(e) =>
                          updateExercise(selectedExerciseIndex, {
                            config: {
                              ...selectedExercise.config,
                              grading_weights: {
                                ...((selectedExercise.config.grading_weights as Record<string, number>) ?? {}),
                                structure: Number(e.target.value),
                                tests: Number(
                                  (selectedExercise.config.grading_weights as Record<string, number> | undefined)?.tests ?? 7,
                                ),
                              },
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1.5"
                      />
                    </label>
                    <label>
                      Puncte teste
                      <input
                        type="number"
                        value={Number((selectedExercise.config.grading_weights as Record<string, number> | undefined)?.tests ?? 7)}
                        onChange={(e) =>
                          updateExercise(selectedExerciseIndex, {
                            config: {
                              ...selectedExercise.config,
                              grading_weights: {
                                ...((selectedExercise.config.grading_weights as Record<string, number>) ?? {}),
                                tests: Number(e.target.value),
                                structure: Number(
                                  (selectedExercise.config.grading_weights as Record<string, number> | undefined)?.structure ?? 3,
                                ),
                              },
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg border px-2 py-1.5"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {selectedExercise.exercise_type === "cpp_struct" ? (
                <div className="space-y-2 text-sm">
                  <label className="block">
                    Nume structura
                    <input
                      value={String(selectedExercise.config.struct_name ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, struct_name: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    Expresii care trebuie sa compileze (cate una pe linie, ex: s[0].nrLocuri)
                    <textarea
                      value={String((selectedExercise.config.compile_checks as string[] | undefined)?.join("\n") ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: {
                            ...selectedExercise.config,
                            compile_checks: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="mt-1 h-20 w-full rounded-lg border p-2 font-mono text-xs"
                    />
                  </label>
                  <CodeEditor
                    value={String(selectedExercise.config.wrapper_template ?? "")}
                    onChange={(code) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, wrapper_template: code },
                      })
                    }
                    language="cpp"
                  />
                </div>
              ) : null}

              {selectedExercise.exercise_type === "flexible_answer" ? (
                <div className="space-y-2 text-sm">
                  <label className="block">
                    Tip validare
                    <select
                      value={String(selectedExercise.config.validation_type ?? "list")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, validation_type: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    >
                      <option value="list">Lista raspunsuri acceptate</option>
                      <option value="formula">Validator determinist (constrangeri)</option>
                      <option value="openai">OpenAI semantic</option>
                    </select>
                  </label>
                  <label className="block">
                    Nr. raspunsuri cerute
                    <input
                      type="number"
                      min={1}
                      value={Number(selectedExercise.config.required_count ?? 1)}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, required_count: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-24 rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  {String(selectedExercise.config.validation_type ?? "list") === "list" ? (
                    <label className="block">
                      Raspunsuri acceptate (cate unul pe linie)
                      <textarea
                        value={String((selectedExercise.config.accepted_answers as string[] | undefined)?.join("\n") ?? "")}
                        onChange={(e) =>
                          updateExercise(selectedExerciseIndex, {
                            config: {
                              ...selectedExercise.config,
                              accepted_answers: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                            },
                          })
                        }
                        className="mt-1 h-24 w-full rounded-lg border p-2 font-mono text-xs"
                      />
                    </label>
                  ) : null}
                  {String(selectedExercise.config.validation_type) === "formula" ? (
                    <label className="block">
                      Constrangeri JSON (ex: [{`{"left":"n1+n2","op":"==","right":28}`}])
                      <textarea
                        value={JSON.stringify(selectedExercise.config.constraints ?? [], null, 2)}
                        onChange={(e) => {
                          try {
                            const constraints = JSON.parse(e.target.value) as unknown;
                            updateExercise(selectedExerciseIndex, {
                              config: { ...selectedExercise.config, constraints },
                            });
                          } catch {
                            // ignore invalid JSON while typing
                          }
                        }}
                        className="mt-1 h-28 w-full rounded-lg border p-2 font-mono text-xs"
                      />
                    </label>
                  ) : null}
                  {String(selectedExercise.config.validation_type) === "openai" ? (
                    <textarea
                      value={String(selectedExercise.config.openai_system_prompt ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, openai_system_prompt: e.target.value },
                        })
                      }
                      placeholder="Prompt system OpenAI (optional)"
                      className="h-20 w-full rounded-lg border p-2 text-xs"
                    />
                  ) : null}
                </div>
              ) : null}

              {selectedExercise.exercise_type === "code_with_explanation" ? (
                <div className="space-y-2 text-sm">
                  <label className="block">
                    Fractie puncte cod (0-1)
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={Number(selectedExercise.config.code_points_fraction ?? 0.8)}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, code_points_fraction: Number(e.target.value) },
                        })
                      }
                      className="mt-1 w-24 rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    Complexitate asteptata
                    <input
                      value={String(selectedExercise.config.expected_complexity ?? "")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, expected_complexity: e.target.value },
                        })
                      }
                      placeholder="ex: O(n log n)"
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    />
                  </label>
                  <label className="block">
                    Focus eficienta
                    <select
                      value={String(selectedExercise.config.efficiency_focus ?? "both")}
                      onChange={(e) =>
                        updateExercise(selectedExerciseIndex, {
                          config: { ...selectedExercise.config, efficiency_focus: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border px-2 py-1.5"
                    >
                      <option value="time">Timp</option>
                      <option value="memory">Memorie</option>
                      <option value="both">Timp + memorie</option>
                    </select>
                  </label>
                  <textarea
                    value={String(selectedExercise.config.openai_system_prompt ?? "")}
                    onChange={(e) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, openai_system_prompt: e.target.value },
                      })
                    }
                    placeholder="Prompt system OpenAI pentru explicatie (optional)"
                    className="h-20 w-full rounded-lg border p-2 text-xs"
                  />
                </div>
              ) : null}

              {selectedExercise.exercise_type === "pseudocode_composite" ? (
                <p className="text-xs text-zinc-600">
                  Testele de mai jos sunt pentru <strong>subpunctul c</strong>. Subpunctul d are teste in panoul violet.
                </p>
              ) : null}

              {["code_full", "code_function", "code_fill", "pseudocode_modify", "code_with_explanation", "pseudocode_composite"].includes(
                selectedExercise.exercise_type,
              ) ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Template wrapper C++ (optional, foloseste __USER_CODE__ sau // DE_COMPLETAT)</p>
                  <CodeEditor
                    value={String(selectedExercise.config.wrapper_template ?? "")}
                    onChange={(code) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, wrapper_template: code },
                      })
                    }
                    language="cpp"
                  />
                  <p className="text-sm font-medium">Cod referinta pentru testare admin</p>
                  <CodeEditor
                    value={String(selectedExercise.config.reference_code ?? "")}
                    onChange={(code) =>
                      updateExercise(selectedExerciseIndex, {
                        config: { ...selectedExercise.config, reference_code: code },
                      })
                    }
                    language="cpp"
                  />
                  <button
                    type="button"
                    disabled={testing || !currentSubjectId}
                    onClick={() => void testOfficialSolution()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {testing ? "Testez..." : "Ruleaza test de verificare (solutie oficiala)"}
                  </button>
                </div>
              ) : null}

              {selectedExercise.tests.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Teste automate ({selectedExercise.tests.length})</p>
                    <button
                      type="button"
                      onClick={() =>
                        updateExercise(selectedExerciseIndex, {
                          tests: [...selectedExercise.tests, { ...defaultTest(), sort_order: selectedExercise.tests.length }],
                        })
                      }
                      className="text-xs text-sky-700"
                    >
                      + Test
                    </button>
                  </div>
                  {selectedExercise.tests.map((test, tIdx) => (
                    <div key={`test-${tIdx}`} className="rounded-lg border bg-zinc-50 p-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <textarea
                          value={test.input_data}
                          placeholder="Input"
                          onChange={(e) => {
                            const tests = [...selectedExercise.tests];
                            tests[tIdx] = { ...tests[tIdx], input_data: e.target.value };
                            updateExercise(selectedExerciseIndex, { tests });
                          }}
                          className="h-16 rounded border p-1 font-mono"
                        />
                        <textarea
                          value={test.expected_output}
                          placeholder="Output asteptat"
                          onChange={(e) => {
                            const tests = [...selectedExercise.tests];
                            tests[tIdx] = { ...tests[tIdx], expected_output: e.target.value };
                            updateExercise(selectedExerciseIndex, { tests });
                          }}
                          className="h-16 rounded border p-1 font-mono"
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <label>
                          Puncte
                          <input
                            type="number"
                            value={test.points}
                            onChange={(e) => {
                              const tests = [...selectedExercise.tests];
                              tests[tIdx] = { ...tests[tIdx], points: Number(e.target.value) };
                              updateExercise(selectedExerciseIndex, { tests });
                            }}
                            className="ml-1 w-14 rounded border px-1"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={test.is_visible}
                            onChange={(e) => {
                              const tests = [...selectedExercise.tests];
                              tests[tIdx] = { ...tests[tIdx], is_visible: e.target.checked };
                              updateExercise(selectedExerciseIndex, { tests });
                            }}
                          />
                          Vizibil elev
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <label className="block text-sm">
                Feedback implicit
                <textarea
                  value={selectedExercise.default_feedback}
                  onChange={(e) => updateExercise(selectedExerciseIndex, { default_feedback: e.target.value })}
                  className="mt-1 h-16 w-full rounded-lg border p-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-sm font-semibold">Subiecte existente</p>
            <div className="mt-2 max-h-40 space-y-1 overflow-auto">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => void loadSubject(s.id)}
                  className="block w-full rounded-lg border bg-white px-2 py-1.5 text-left text-xs hover:bg-sky-50"
                >
                  {s.title} {s.year ?? ""} {s.is_active ? "• activ" : "• draft"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="h-fit rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <BacExamPreview
            subject={form}
            selectedExerciseIndex={selectedExerciseIndex}
            previewAnswers={previewAnswers}
            onPreviewAnswerChange={(code, answer) => setPreviewAnswers((p) => ({ ...p, [code]: answer }))}
            mode="admin"
            exerciseIds={exerciseIdByCode}
          />
          {currentSubjectId ? (
            <a
              href={`/bacalaureat/examen/${currentSubjectId}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg border border-sky-300 px-3 py-2 text-sm text-sky-800 hover:bg-sky-50"
            >
              Preview elev (tab nou)
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
